/**
 * Copyright 2014 Shape Security, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {ErrorMessages} from "./errors";

import Tokenizer, { TokenClass, TokenType } from "./tokenizer";

import * as AST from "shift-ast/checked"; // todo

// Empty parameter list for ArrowExpression
const ARROW_EXPRESSION_PARAMS = "CoverParenthesizedExpressionAndArrowParameterList";

const Precedence = {
  Sequence: 0,
  Yield: 1,
  Assignment: 1,
  Conditional: 2,
  ArrowFunction: 2,
  LogicalOR: 3,
  LogicalAND: 4,
  BitwiseOR: 5,
  BitwiseXOR: 6,
  BitwiseAND: 7,
  Equality: 8,
  Relational: 9,
  BitwiseSHIFT: 10,
  Additive: 11,
  Multiplicative: 12,
  Unary: 13,
  Postfix: 14,
  Call: 15,
  New: 16,
  TaggedTemplate: 17,
  Member: 18,
  Primary: 19,
};

const BinaryPrecedence = {
  "||": Precedence.LogicalOR,
  "&&": Precedence.LogicalAND,
  "|": Precedence.BitwiseOR,
  "^": Precedence.BitwiseXOR,
  "&": Precedence.BitwiseAND,
  "==": Precedence.Equality,
  "!=": Precedence.Equality,
  "===": Precedence.Equality,
  "!==": Precedence.Equality,
  "<": Precedence.Relational,
  ">": Precedence.Relational,
  "<=": Precedence.Relational,
  ">=": Precedence.Relational,
  "in": Precedence.Relational,
  "instanceof": Precedence.Relational,
  "<<": Precedence.BitwiseSHIFT,
  ">>": Precedence.BitwiseSHIFT,
  ">>>": Precedence.BitwiseSHIFT,
  "+": Precedence.Additive,
  "-": Precedence.Additive,
  "*": Precedence.Multiplicative,
  "%": Precedence.Multiplicative,
  "/": Precedence.Multiplicative,
};

function copyLocation(from, to) {
  if ("loc" in from) {
    to.loc = from.loc;
  }
  return to;
}

function isValidSimpleAssignmentTarget(node) {
  if (node == null) return false;
  switch (node.type) {
    case "IdentifierExpression":
    case "ComputedMemberExpression":
    case "StaticMemberExpression":
      return true;
  }
  return false;
}

function isPrefixOperator(token) {
  switch (token.type) {
    case TokenType.INC:
    case TokenType.DEC:
    case TokenType.ADD:
    case TokenType.SUB:
    case TokenType.BIT_NOT:
    case TokenType.NOT:
    case TokenType.DELETE:
    case TokenType.VOID:
    case TokenType.TYPEOF:
      return true;
  }
  return false;
}

function isUpdateOperator(token) {
  return token.type === TokenType.INC || token.type === TokenType.DEC;
}

export class Parser extends Tokenizer {
  constructor(source) {
    super(source);
    this.allowIn = true;
    this.inFunctionBody = false;
    this.inParameter = false;
    this.allowYieldExpression = false;
    this.module = false;
    this.moduleIsTheGoalSymbol = false;
    this.strict = false;

    // Cover grammar
    this.isBindingElement = true;
    this.isAssignmentTarget = true;
    this.firstExprError = null;
  }

  match(subType) {
    return this.lookahead.type === subType;
  }

  eat(tokenType) {
    if (this.lookahead.type === tokenType) {
      return this.lex();
    }
  }

  expect(tokenType) {
    if (this.lookahead.type === tokenType) {
      return this.lex();
    }
    throw this.createUnexpected(this.lookahead);
  }

  matchContextualKeyword(keyword) {
    return this.lookahead.type === TokenType.IDENTIFIER && this.lookahead.value === keyword;
  }

  expectContextualKeyword(keyword) {
    if (this.lookahead.type === TokenType.IDENTIFIER && this.lookahead.value === keyword) {
      return this.lex();
    } else {
      throw this.createUnexpected(this.lookahead);
    }
  }

  eatContextualKeyword(keyword) {
    if (this.lookahead.type === TokenType.IDENTIFIER && this.lookahead.value === keyword) {
      return this.lex();
    }
  }

  consumeSemicolon() {
    if (this.eat(TokenType.SEMICOLON)) return;
    if (this.hasLineTerminatorBeforeNext) return;
    if (!this.eof() && !this.match(TokenType.RBRACE)) {
      throw this.createUnexpected(this.lookahead);
    }
  }

  // this is a no-op, reserved for future use
  markLocation(node/*, startLocation*/) {
    return node;
  }

  parseModule() {
    this.moduleIsTheGoalSymbol = this.module = this.strict = true;
    this.lookahead = this.advance();

    let startLocation = this.getLocation();
    let {directives, statements} = this.parseBody();
    if (!this.match(TokenType.EOS)) {
      throw this.createUnexpected(this.lookahead);
    }
    return this.markLocation(new AST.Module({ directives, items: statements }), startLocation);
  }

  parseScript() {
    this.lookahead = this.advance();

    let startLocation = this.getLocation();
    let {directives, statements} = this.parseBody();
    if (!this.match(TokenType.EOS)) {
      throw this.createUnexpected(this.lookahead);
    }
    return this.markLocation(new AST.Script({ directives, statements }), startLocation);
  }

  parseFunctionBody() {
    let startLocation = this.getLocation();

    let oldInFunctionBody = this.inFunctionBody;
    let oldModule = this.module;
    let oldStrict = this.strict;
    this.inFunctionBody = true;
    this.module = false;

    this.expect(TokenType.LBRACE);
    let body = new AST.FunctionBody(this.parseBody());
    this.expect(TokenType.RBRACE);

    this.inFunctionBody = oldInFunctionBody;
    this.module = oldModule;
    this.strict = oldStrict;

    return this.markLocation(body, startLocation);
  }

  parseBody() {
    let directives = [], statements = [], parsingDirectives = true, directiveOctal = null;

    while (true) {
      if (this.eof() || this.match(TokenType.RBRACE)) break;
      let token = this.lookahead;
      let text = token.slice.text;
      let isStringLiteral = token.type === TokenType.STRING;
      let isModule = this.module;
      let directiveLocation = this.getLocation();
      let stmt = isModule ? this.parseModuleItem() : this.parseStatementListItem();
      if (parsingDirectives) {
        if (isStringLiteral && stmt.type === "ExpressionStatement" && stmt.expression.type === "LiteralStringExpression") {
          if (!directiveOctal && token.octal) {
            directiveOctal = this.createErrorWithLocation(directiveLocation, "Unexpected legacy octal escape sequence: \\" + token.octal);
          }
          let rawValue = text.slice(1, -1);
          if (rawValue === "use strict") {
            this.strict = true;
          }
          directives.push(this.markLocation(new AST.Directive({ rawValue }), directiveLocation));
        } else {
          parsingDirectives = false;
          if (directiveOctal && this.strict) {
            throw directiveOctal;
          }
          statements.push(stmt);
        }
      } else {
        statements.push(stmt);
      }
    }
    if (directiveOctal && this.strict) {
      throw directiveOctal;
    }

    return { directives, statements };
  }

  parseImportSpecifier() {
    let startLocation = this.getLocation(), name;
    if (this.match(TokenType.IDENTIFIER) || this.match(TokenType.YIELD) || this.match(TokenType.LET)) {
      name = this.parseIdentifier();
      if (!this.eatContextualKeyword("as")) {
        return this.markLocation(new AST.ImportSpecifier({
          name: null,
          binding: this.markLocation(new AST.BindingIdentifier({ name }), startLocation),
        }), startLocation);
      }
    } else if (this.lookahead.type.klass.isIdentifierName) {
      name = this.parseIdentifierName();
      this.expectContextualKeyword("as");
    }

    return this.markLocation(new AST.ImportSpecifier({ name, binding: this.parseBindingIdentifier() }), startLocation);
  }

  parseNameSpaceBinding() {
    this.expect(TokenType.MUL);
    this.expectContextualKeyword("as");
    return this.parseBindingIdentifier();
  }

  parseNamedImports() {
    let result = [];
    this.expect(TokenType.LBRACE);
    while (!this.eat(TokenType.RBRACE)) {
      result.push(this.parseImportSpecifier());
      if (!this.eat(TokenType.COMMA)) {
        this.expect(TokenType.RBRACE);
        break;
      }
    }
    return result;
  }

  parseFromClause() {
    this.expectContextualKeyword("from");
    let value = this.expect(TokenType.STRING).str;
    return value;
  }

  parseImportDeclaration() {
    let startLocation = this.getLocation(), defaultBinding = null, moduleSpecifier;
    this.expect(TokenType.IMPORT);
    switch (this.lookahead.type) {
      case TokenType.STRING:
        moduleSpecifier = this.lex().str;
        this.consumeSemicolon();
        return this.markLocation(new AST.Import({ defaultBinding: null, namedImports: [], moduleSpecifier }), startLocation);
      case TokenType.IDENTIFIER:
      case TokenType.YIELD:
      case TokenType.LET:
        defaultBinding = this.parseBindingIdentifier();
        if (!this.eat(TokenType.COMMA)) {
          let decl = new AST.Import({ defaultBinding, namedImports: [], moduleSpecifier: this.parseFromClause() });
          this.consumeSemicolon()
          return this.markLocation(decl, startLocation);
        }
        break;
    }
    if (this.match(TokenType.MUL)) {
      let decl = new AST.ImportNamespace({
        defaultBinding,
        namespaceBinding: this.parseNameSpaceBinding(),
        moduleSpecifier: this.parseFromClause(),
      });
      this.consumeSemicolon()
      return this.markLocation(decl, startLocation);
    } else if (this.match(TokenType.LBRACE)) {
      let decl = new AST.Import({
        defaultBinding,
        namedImports: this.parseNamedImports(),
        moduleSpecifier: this.parseFromClause(),
      });
      this.consumeSemicolon()
      return this.markLocation(decl, startLocation);
    } else {
      throw this.createUnexpected(this.lookahead);
    }
  }

  parseExportSpecifier() {
    let startLocation = this.getLocation();
    let name = this.parseIdentifierName();
    if (this.eatContextualKeyword("as")) {
      let exportedName = this.parseIdentifierName();
      return this.markLocation({ name, exportedName }, startLocation);
    }
    return this.markLocation({ name, exportedName: null }, startLocation);
  }

  parseExportClause() {
    this.expect(TokenType.LBRACE);
    let result = [];
    while (!this.eat(TokenType.RBRACE)) {
      result.push(this.parseExportSpecifier());
      if (!this.eat(TokenType.COMMA)) {
        this.expect(TokenType.RBRACE);
        break;
      }
    }
    return result;
  }

  parseExportDeclaration() {
    let startLocation = this.getLocation(), decl;
    this.expect(TokenType.EXPORT);
    switch (this.lookahead.type) {
      case TokenType.MUL:
        this.lex();
        // export * FromClause ;
        decl = new AST.ExportAllFrom({ moduleSpecifier: this.parseFromClause() });
        this.consumeSemicolon();
        break;
      case TokenType.LBRACE:
        // export ExportClause FromClause ;
        // export ExportClause ;
        let namedExports = this.parseExportClause();
        let moduleSpecifier = null;
        if (this.matchContextualKeyword("from")) {
          moduleSpecifier = this.parseFromClause();
          decl = new AST.ExportFrom({ namedExports: namedExports.map(e => new AST.ExportFromSpecifier(e)), moduleSpecifier })
        } else {
          decl = new AST.ExportLocals({ namedExports: namedExports.map(({name, exportedName}) => new AST.ExportLocalSpecifier({ name: new AST.IdentifierExpression({name}), exportedName })) });
        }
        this.consumeSemicolon();
        break;
      case TokenType.CLASS:
        // export ClassDeclaration
        decl = new AST.Export({ declaration: this.parseClass({ isExpr: false, inDefault: false }) });
        break;
      case TokenType.FUNCTION:
        // export HoistableDeclaration
        decl = new AST.Export({ declaration: this.parseFunction({ isExpr: false, inDefault: false, allowGenerator: true }) });
        break;
      case TokenType.DEFAULT:
        this.lex();
        switch (this.lookahead.type) {
          case TokenType.FUNCTION:
            // export default HoistableDeclaration[Default]
            decl = new AST.ExportDefault({
              body: this.parseFunction({ isExpr: false, inDefault: true, allowGenerator: true }),
            });
            break;
          case TokenType.CLASS:
            // export default ClassDeclaration[Default]
            decl = new AST.ExportDefault({ body: this.parseClass({ isExpr: false, inDefault: true }) });
            break;
          default:
            // export default [lookahead ∉ {function, class}] AssignmentExpression[In] ;
            decl = new AST.ExportDefault({ body: this.parseAssignmentExpression() });
            this.consumeSemicolon();
            break;
        }
        break;
      case TokenType.VAR:
      case TokenType.LET:
      case TokenType.CONST:
        // export LexicalDeclaration
        decl = new AST.Export({ declaration: this.parseVariableDeclaration(true) });
        this.consumeSemicolon();
        break;
      default:
        throw this.createUnexpected(this.lookahead);
    }
    return this.markLocation(decl, startLocation);
  }

  parseModuleItem() {
    switch (this.lookahead.type) {
      case TokenType.IMPORT:
        return this.parseImportDeclaration();
      case TokenType.EXPORT:
        return this.parseExportDeclaration();
      default:
        return this.parseStatementListItem();
    }
  }

  lookaheadLexicalDeclaration() {
    if (this.match(TokenType.LET) || this.match(TokenType.CONST)) {
      let lexerState = this.saveLexerState();
      this.lex();
      if (
        this.match(TokenType.IDENTIFIER) ||
        this.match(TokenType.YIELD) ||
        this.match(TokenType.LET) ||
        this.match(TokenType.LBRACE) ||
        this.match(TokenType.LBRACK)
      ) {
        this.restoreLexerState(lexerState);
        return true;
      } else {
        this.restoreLexerState(lexerState);
      }
    }
    return false;
  }

  parseStatementListItem() {
    if (this.eof()) throw this.createUnexpected(this.lookahead);

    switch (this.lookahead.type) {
      case TokenType.FUNCTION:
        return this.parseFunction({ isExpr: false, inDefault: false, allowGenerator: true });
      case TokenType.CLASS:
        return this.parseClass({ isExpr: false, inDefault: false });
      default:
        if (this.lookaheadLexicalDeclaration()) {
          let startLocation = this.getLocation();
          return this.markLocation(this.parseVariableDeclarationStatement(), startLocation);
        } else {
          return this.parseStatement();
        }
    }
  }

  parseStatement() {
    let startLocation = this.getLocation();
    let stmt = this.isolateCoverGrammar(this.parseStatementHelper);
    return this.markLocation(stmt, startLocation);
  }

  parseStatementHelper() {
    if (this.eof()) {
      throw this.createUnexpected(this.lookahead);
    }

    switch (this.lookahead.type) {
      case TokenType.SEMICOLON:
        return this.parseEmptyStatement();
      case TokenType.LBRACE:
        return this.parseBlockStatement();
      case TokenType.LPAREN:
        return this.parseExpressionStatement();
      case TokenType.BREAK:
        return this.parseBreakStatement();
      case TokenType.CONTINUE:
        return this.parseContinueStatement();
      case TokenType.DEBUGGER:
        return this.parseDebuggerStatement();
      case TokenType.DO:
        return this.parseDoWhileStatement();
      case TokenType.FOR:
        return this.parseForStatement();
      case TokenType.IF:
        return this.parseIfStatement();
      case TokenType.RETURN:
        return this.parseReturnStatement();
      case TokenType.SWITCH:
        return this.parseSwitchStatement();
      case TokenType.THROW:
        return this.parseThrowStatement();
      case TokenType.TRY:
        return this.parseTryStatement();
      case TokenType.VAR:
        return this.parseVariableDeclarationStatement();
      case TokenType.WHILE:
        return this.parseWhileStatement();
      case TokenType.WITH:
        return this.parseWithStatement();
      case TokenType.FUNCTION:
      case TokenType.CLASS:
        throw this.createUnexpected(this.lookahead);

      default: {
        if (this.lookaheadLexicalDeclaration()) {
          throw this.createUnexpected(this.lookahead);
        }
        let expr = this.parseExpression();
        // 12.12 Labelled Statements;
        if (expr.type === "IdentifierExpression" && this.eat(TokenType.COLON)) {
          let labeledBody = this.match(TokenType.FUNCTION)
            ? this.parseFunction({ isExpr: false, inDefault: false, allowGenerator: false })
            : this.parseStatement();
          return new AST.LabeledStatement({ label: expr.name, body: labeledBody });
        } else {
          this.consumeSemicolon();
          return new AST.ExpressionStatement({ expression: expr });
        }
      }
    }
  }

  parseEmptyStatement() {
    this.lex();
    return new AST.EmptyStatement;
  }

  parseBlockStatement() {
    return new AST.BlockStatement({ block: this.parseBlock() });
  }

  parseExpressionStatement() {
    let expr = this.parseExpression();
    this.consumeSemicolon();
    return new AST.ExpressionStatement({ expression: expr });
  }

  parseBreakStatement() {
    this.lex();

    // Catch the very common case first: immediately a semicolon (U+003B).
    if (this.eat(TokenType.SEMICOLON) || this.hasLineTerminatorBeforeNext) {
      return new AST.BreakStatement({ label: null });
    }

    let label = null;
    if (this.match(TokenType.IDENTIFIER) || this.match(TokenType.YIELD) || this.match(TokenType.LET)) {
      label = this.parseIdentifier();
    }

    this.consumeSemicolon();

    return new AST.BreakStatement({ label });
  }

  parseContinueStatement() {
    this.lex();

    // Catch the very common case first: immediately a semicolon (U+003B).
    if (this.eat(TokenType.SEMICOLON) || this.hasLineTerminatorBeforeNext) {
      return new AST.ContinueStatement({ label: null });
    }

    let label = null;
    if (this.match(TokenType.IDENTIFIER) || this.match(TokenType.YIELD) || this.match(TokenType.LET)) {
      label = this.parseIdentifier();
    }

    this.consumeSemicolon();

    return new AST.ContinueStatement({ label });
  }


  parseDebuggerStatement() {
    this.lex();
    this.consumeSemicolon();
    return new AST.DebuggerStatement;
  }

  parseDoWhileStatement() {
    this.lex();
    let body = this.parseStatement();
    this.expect(TokenType.WHILE);
    this.expect(TokenType.LPAREN);
    let test = this.parseExpression();
    this.expect(TokenType.RPAREN);
    this.eat(TokenType.SEMICOLON);
    return new AST.DoWhileStatement({ body, test });
  }

  parseForStatement() {
    this.lex();
    this.expect(TokenType.LPAREN);
    let test = null;
    let right = null;
    if (this.eat(TokenType.SEMICOLON)) {
      if (!this.match(TokenType.SEMICOLON)) {
        test = this.parseExpression();
      }
      this.expect(TokenType.SEMICOLON);
      if (!this.match(TokenType.RPAREN)) {
        right = this.parseExpression();
      }
      return new AST.ForStatement({ init: null, test, update: right, body: this.getIteratorStatementEpilogue() });
    } else {
      let startsWithLet = this.match(TokenType.LET);
      let isForDecl = this.lookaheadLexicalDeclaration();
      let leftLocation = this.getLocation();
      if (this.match(TokenType.VAR) || isForDecl) {
        let previousAllowIn = this.allowIn;
        this.allowIn = false;
        let init = this.parseVariableDeclaration(false);
        this.allowIn = previousAllowIn;

        if (init.declarators.length === 1 && (this.match(TokenType.IN) || this.matchContextualKeyword("of"))) {
          let ctor;

          if (this.match(TokenType.IN)) {
            if (init.declarators[0].init != null) {
              throw this.createError(ErrorMessages.INVALID_VAR_INIT_FOR_IN);
            }
            ctor = AST.ForInStatement;
            this.lex();
            right = this.parseExpression();
          } else {
            if (init.declarators[0].init != null) {
              throw this.createError(ErrorMessages.INVALID_VAR_INIT_FOR_OF);
            }
            ctor = AST.ForOfStatement;
            this.lex();
            right = this.parseAssignmentExpression();
          }

          let body = this.getIteratorStatementEpilogue();

          return new ctor({ left: init, right, body });
        } else {
          this.expect(TokenType.SEMICOLON);
          if (!this.match(TokenType.SEMICOLON)) {
            test = this.parseExpression();
          }
          this.expect(TokenType.SEMICOLON);
          if (!this.match(TokenType.RPAREN)) {
            right = this.parseExpression();
          }
          return new AST.ForStatement({ init, test, update: right, body: this.getIteratorStatementEpilogue() });
        }
      } else {
        let previousAllowIn = this.allowIn;
        this.allowIn = false;
        let expr = this.inheritCoverGrammar(this.parseAssignmentExpressionOrTarget);
        this.allowIn = previousAllowIn;

        if (this.isAssignmentTarget && expr.type !== "AssignmentExpression" && (this.match(TokenType.IN) || this.matchContextualKeyword("of"))) {
          if (expr.type === "ObjectAssignmentTarget" || expr.type === "ArrayAssignmentTarget") {
            this.firstExprError = null;
          }
          if (startsWithLet && this.matchContextualKeyword("of")) {
            throw this.createError(ErrorMessages.INVALID_LHS_IN_FOR_OF);
          }
          let ctor = this.match(TokenType.IN) ? AST.ForInStatement : AST.ForOfStatement;

          this.lex();
          right = this.parseExpression();

          return new ctor({ left: this.transformDestructuring(expr), right, body: this.getIteratorStatementEpilogue() });
        } else {
          if (this.firstExprError) {
            throw this.firstExprError;
          }
          while (this.eat(TokenType.COMMA)) {
            let rhs = this.parseAssignmentExpression();
            expr = this.markLocation(new AST.BinaryExpression({ left: expr, operator: ",", right: rhs}), leftLocation);
          }
          if (this.match(TokenType.IN)) {
            throw this.createError(ErrorMessages.INVALID_LHS_IN_FOR_IN);
          }
          if (this.matchContextualKeyword("of")) {
            throw this.createError(ErrorMessages.INVALID_LHS_IN_FOR_OF);
          }
          this.expect(TokenType.SEMICOLON);
          if (!this.match(TokenType.SEMICOLON)) {
            test = this.parseExpression();
          }
          this.expect(TokenType.SEMICOLON);
          if (!this.match(TokenType.RPAREN)) {
            right = this.parseExpression();
          }
          return new AST.ForStatement({ init: expr, test, update: right, body: this.getIteratorStatementEpilogue() });
        }
      }
    }
  }

  getIteratorStatementEpilogue() {
    this.expect(TokenType.RPAREN);
    let body = this.parseStatement();
    return body;
  }

  parseIfStatementChild() {
    return this.match(TokenType.FUNCTION)
      ? this.parseFunction({isExpr: false, inDefault: false, allowGenerator: false})
      : this.parseStatement();
  }

  parseIfStatement() {
    this.lex();
    this.expect(TokenType.LPAREN);
    let test = this.parseExpression();
    this.expect(TokenType.RPAREN);
    let consequent = this.parseIfStatementChild();
    let alternate = null;
    if (this.eat(TokenType.ELSE)) {
      alternate = this.parseIfStatementChild();
    }
    return new AST.IfStatement({ test, consequent, alternate });
  }

  parseReturnStatement() {
    if (!this.inFunctionBody) {
      throw this.createError(ErrorMessages.ILLEGAL_RETURN);
    }

    this.lex();

    // Catch the very common case first: immediately a semicolon (U+003B).
    if (this.eat(TokenType.SEMICOLON) || this.hasLineTerminatorBeforeNext) {
      return new AST.ReturnStatement({ expression: null });
    }

    let expression = null;
    if (!this.match(TokenType.RBRACE) && !this.eof()) {
      expression = this.parseExpression();
    }

    this.consumeSemicolon();
    return new AST.ReturnStatement({ expression });
  }

  parseSwitchStatement() {
    this.lex();
    this.expect(TokenType.LPAREN);
    let discriminant = this.parseExpression();
    this.expect(TokenType.RPAREN);
    this.expect(TokenType.LBRACE);

    if (this.eat(TokenType.RBRACE)) {
      return new AST.SwitchStatement({ discriminant, cases: [] });
    }

    let cases = this.parseSwitchCases();
    if (this.match(TokenType.DEFAULT)) {
      let defaultCase = this.parseSwitchDefault();
      let postDefaultCases = this.parseSwitchCases();
      if (this.match(TokenType.DEFAULT)) {
        throw this.createError(ErrorMessages.MULTIPLE_DEFAULTS_IN_SWITCH);
      }
      this.expect(TokenType.RBRACE);
      return new AST.SwitchStatementWithDefault({
        discriminant,
        preDefaultCases: cases,
        defaultCase,
        postDefaultCases,
      });
    } else {
      this.expect(TokenType.RBRACE);
      return new AST.SwitchStatement({ discriminant, cases });
    }
  }

  parseSwitchCases() {
    let result = [];
    while (!(this.eof() || this.match(TokenType.RBRACE) || this.match(TokenType.DEFAULT))) {
      result.push(this.parseSwitchCase());
    }
    return result;
  }

  parseSwitchCase() {
    let startLocation = this.getLocation();
    this.expect(TokenType.CASE);
    return this.markLocation(new AST.SwitchCase({
      test: this.parseExpression(),
      consequent: this.parseSwitchCaseBody(),
    }), startLocation);
  }

  parseSwitchDefault() {
    let startLocation = this.getLocation();
    this.expect(TokenType.DEFAULT);
    return this.markLocation(new AST.SwitchDefault({ consequent: this.parseSwitchCaseBody() }), startLocation);
  }

  parseSwitchCaseBody() {
    this.expect(TokenType.COLON);
    return this.parseStatementListInSwitchCaseBody();
  }

  parseStatementListInSwitchCaseBody() {
    let result = [];
    while (!(this.eof() || this.match(TokenType.RBRACE) || this.match(TokenType.DEFAULT) || this.match(TokenType.CASE))) {
      result.push(this.parseStatementListItem());
    }
    return result;
  }

  parseThrowStatement() {
    let token = this.lex();
    if (this.hasLineTerminatorBeforeNext) {
      throw this.createErrorWithLocation(token, ErrorMessages.NEWLINE_AFTER_THROW);
    }
    let expression = this.parseExpression();
    this.consumeSemicolon();
    return new AST.ThrowStatement({ expression });
  }

  parseTryStatement() {
    this.lex();
    let body = this.parseBlock();

    if (this.match(TokenType.CATCH)) {
      let catchClause = this.parseCatchClause();
      if (this.eat(TokenType.FINALLY)) {
        let finalizer = this.parseBlock();
        return new AST.TryFinallyStatement({ body, catchClause, finalizer });
      }
      return new AST.TryCatchStatement({ body, catchClause });
    }

    if (this.eat(TokenType.FINALLY)) {
      let finalizer = this.parseBlock();
      return new AST.TryFinallyStatement({ body, catchClause: null, finalizer });
    } else {
      throw this.createError(ErrorMessages.NO_CATCH_OR_FINALLY);
    }
  }

  parseVariableDeclarationStatement() {
    let declaration = this.parseVariableDeclaration(true);
    this.consumeSemicolon();
    return new AST.VariableDeclarationStatement({ declaration });
  }

  parseWhileStatement() {
    this.lex();
    this.expect(TokenType.LPAREN);
    let test = this.parseExpression();
    let body = this.getIteratorStatementEpilogue();
    return new AST.WhileStatement({ test, body });
  }

  parseWithStatement() {
    this.lex();
    this.expect(TokenType.LPAREN);
    let object = this.parseExpression();
    this.expect(TokenType.RPAREN);
    let body = this.parseStatement();
    return new AST.WithStatement({ object, body });
  }

  parseCatchClause() {
    let startLocation = this.getLocation();

    this.lex();
    this.expect(TokenType.LPAREN);
    if (this.match(TokenType.RPAREN) || this.match(TokenType.LPAREN)) {
      throw this.createUnexpected(this.lookahead);
    }
    let binding = this.parseBindingTarget();
    this.expect(TokenType.RPAREN);
    let body = this.parseBlock();

    return this.markLocation(new AST.CatchClause({ binding, body }), startLocation);
  }

  parseBlock() {
    let startLocation = this.getLocation();
    this.expect(TokenType.LBRACE);
    let body = [];
    while (!this.match(TokenType.RBRACE)) {
      body.push(this.parseStatementListItem());
    }
    this.expect(TokenType.RBRACE);
    return this.markLocation(new AST.Block({ statements: body }), startLocation);
  }

  parseVariableDeclaration(bindingPatternsMustHaveInit) {
    let startLocation = this.getLocation();
    let token = this.lex();

    // preceded by this.match(TokenSubType.VAR) || this.match(TokenSubType.LET);
    let kind = token.type === TokenType.VAR ? "var" : token.type === TokenType.CONST ? "const" : "let";
    let declarators = this.parseVariableDeclaratorList(bindingPatternsMustHaveInit);
    return this.markLocation(new AST.VariableDeclaration({ kind, declarators }), startLocation);
  }

  parseVariableDeclaratorList(bindingPatternsMustHaveInit) {
    let result = [];
    do {
      result.push(this.parseVariableDeclarator(bindingPatternsMustHaveInit));
    } while (this.eat(TokenType.COMMA));
    return result;
  }

  parseVariableDeclarator(bindingPatternsMustHaveInit) {
    let startLocation = this.getLocation();

    if (this.match(TokenType.LPAREN)) {
      throw this.createUnexpected(this.lookahead);
    }

    let binding = this.parseBindingTarget();
    if (bindingPatternsMustHaveInit && binding.type !== "BindingIdentifier" && !this.match(TokenType.ASSIGN)) {
      this.expect(TokenType.ASSIGN);
    }

    let init = null;
    if (this.eat(TokenType.ASSIGN)) {
      init = this.parseAssignmentExpression();
    }

    return this.markLocation(new AST.VariableDeclarator({ binding, init }), startLocation);
  }

  isolateCoverGrammar(parser) {
    var oldIsBindingElement = this.isBindingElement,
      oldIsAssignmentTarget = this.isAssignmentTarget,
      oldFirstExprError = this.firstExprError,
      result;
    this.isBindingElement = this.isAssignmentTarget = true;
    this.firstExprError = null;
    result = parser.call(this);
    if (this.firstExprError !== null) {
      throw this.firstExprError;
    }
    this.isBindingElement = oldIsBindingElement;
    this.isAssignmentTarget = oldIsAssignmentTarget;
    this.firstExprError = oldFirstExprError;
    return result;
  }

  inheritCoverGrammar(parser) {
    var oldIsBindingElement = this.isBindingElement,
      oldIsAssignmentTarget = this.isAssignmentTarget,
      oldFirstExprError = this.firstExprError,
      result;
    this.isBindingElement = this.isAssignmentTarget = true;
    this.firstExprError = null;
    result = parser.call(this);
    this.isBindingElement = this.isBindingElement && oldIsBindingElement;
    this.isAssignmentTarget = this.isAssignmentTarget && oldIsAssignmentTarget;
    this.firstExprError = oldFirstExprError || this.firstExprError;
    return result;
  }

  parseExpression() {
    let startLocation = this.getLocation();

    let left = this.parseAssignmentExpression();
    if (this.match(TokenType.COMMA)) {
      while (!this.eof()) {
        if (!this.match(TokenType.COMMA)) break;
        this.lex();
        let right = this.parseAssignmentExpression();
        left = this.markLocation(new AST.BinaryExpression({ left, operator: ",", right }), startLocation);
      }
    }
    return left;
  }

  parseArrowExpressionTail(head, startLocation) {
    // Convert param list.
    let {params = null, rest = null} = head;
    if (head.type !== ARROW_EXPRESSION_PARAMS) {
      if (head.type === "IdentifierExpression") {
        params = [this.targetToBinding(this.transformDestructuring(head))];
      } else {
        throw this.createUnexpected(this.lookahead);
      }
    }

    let paramsNode = this.markLocation(new AST.FormalParameters({ items: params, rest }), startLocation);

    let arrow = this.expect(TokenType.ARROW);

    let previousYield = this.allowYieldExpression;
    this.allowYieldExpression = false;
    let body = this.match(TokenType.LBRACE) ? this.parseFunctionBody() : this.parseAssignmentExpression();
    this.allowYieldExpression = previousYield;
    return this.markLocation(new AST.ArrowExpression({ params: paramsNode, body }), startLocation);
  }

  parseAssignmentExpression() {
    return this.isolateCoverGrammar(this.parseAssignmentExpressionOrTarget);
  }

  parseAssignmentExpressionOrTarget() {
    let startLocation = this.getLocation();

    if (this.allowYieldExpression && this.match(TokenType.YIELD)) {
      this.isBindingElement = this.isAssignmentTarget = false;
      return this.parseYieldExpression();
    }

    let expr = this.parseConditionalExpression();

    if (!this.hasLineTerminatorBeforeNext && this.match(TokenType.ARROW)) {
      this.isBindingElement = this.isAssignmentTarget = false;
      this.firstExprError = null;
      return this.parseArrowExpressionTail(expr, startLocation);
    }

    let isAssignmentOperator = false;
    let operator = this.lookahead;
    switch (operator.type) {
      case TokenType.ASSIGN_BIT_OR:
      case TokenType.ASSIGN_BIT_XOR:
      case TokenType.ASSIGN_BIT_AND:
      case TokenType.ASSIGN_SHL:
      case TokenType.ASSIGN_SHR:
      case TokenType.ASSIGN_SHR_UNSIGNED:
      case TokenType.ASSIGN_ADD:
      case TokenType.ASSIGN_SUB:
      case TokenType.ASSIGN_MUL:
      case TokenType.ASSIGN_DIV:
      case TokenType.ASSIGN_MOD:
      case TokenType.ASSIGN_EXP:
        isAssignmentOperator = true;
        break;
    }
    if (isAssignmentOperator) {
      if (!this.isAssignmentTarget || !isValidSimpleAssignmentTarget(expr)) {
        throw this.createError(ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
      }
      expr = this.transformDestructuring(expr);
    } else if (operator.type === TokenType.ASSIGN) {
      if (!this.isAssignmentTarget) {
        throw this.createError(ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
      }
      expr = this.transformDestructuring(expr);
    } else {
      return expr;
    }

    this.lex();
    let rhs = this.parseAssignmentExpression();

    this.firstExprError = null;
    let node;
    if (operator.type === TokenType.ASSIGN) {
      node = new AST.AssignmentExpression({ binding: expr, expression: rhs });
    }
    else {
      node = new AST.CompoundAssignmentExpression({ binding: expr, operator: operator.type.name, expression: rhs });
      this.isBindingElement = this.isAssignmentTarget = false;
    }
    return this.markLocation(node, startLocation);
  }

  targetToBinding(node) {
    if (node === null) {
      return null;
    }

    switch (node.type) {
      case "AssignmentTargetIdentifier":
        return new AST.BindingIdentifier({ name: node.name });
      case "ArrayAssignmentTarget":
        return new AST.ArrayBinding({ elements: node.elements.map(e => this.targetToBinding(e)), rest: this.targetToBinding(node.rest) });
      case "ObjectAssignmentTarget":
        return new AST.ObjectBinding({ properties: node.properties.map(p => this.targetToBinding(p)) });
      case "AssignmentTargetPropertyIdentifier":
        return new AST.BindingPropertyIdentifier({ binding: this.targetToBinding(node.binding), init: node.init });
      case "AssignmentTargetPropertyProperty":
        return new AST.BindingPropertyProperty({ name: node.name, binding: this.targetToBinding(node.binding) });
      case "AssignmentTargetWithDefault":
        return new AST.BindingWithDefault({ binding: this.targetToBinding(node.binding), init: node.init });
      default:
        throw new Error('Not reached');
    }
  }

  transformDestructuring(node) {
    switch (node.type) {

      case "DataProperty":
        return copyLocation(node, new AST.AssignmentTargetPropertyProperty({
          name: node.name,
          binding: this.transformDestructuringWithDefault(node.expression),
        }));
      case "ShorthandProperty":
        return copyLocation(node, new AST.AssignmentTargetPropertyIdentifier({
          binding: copyLocation(node, new AST.AssignmentTargetIdentifier({ name: node.name.name })),
          init: null,
        }));

      case "ObjectExpression":
        return copyLocation(node, new AST.ObjectAssignmentTarget({
          properties: node.properties.map(x => this.transformDestructuring(x)),
        }));
      case "ArrayExpression":
        let last = node.elements[node.elements.length - 1];
        if (last != null && last.type === "SpreadElement") {
          return copyLocation(node, new AST.ArrayAssignmentTarget({
            elements: node.elements.slice(0, -1).map(e => e && this.transformDestructuringWithDefault(e)),
            rest: copyLocation(last.expression, this.transformDestructuring(last.expression)),
          }));
        } else {
          return copyLocation(node, new AST.ArrayAssignmentTarget({
            elements: node.elements.map(e => e && this.transformDestructuringWithDefault(e)),
            rest: null,
          }));
        }
        /* istanbul ignore next */
        break;
      case "IdentifierExpression":
        return copyLocation(node, new AST.AssignmentTargetIdentifier({ name: node.name }));
      case "AssignmentExpression":
        throw this.createError(ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);

      case "StaticPropertyName":
        return copyLocation(node, new AST.AssignmentTargetIdentifier({ name: node.value }));

      case "ComputedMemberExpression":
        return copyLocation(node, new AST.ComputedMemberAssignmentTarget({ object: node.object, expression: node.expression }));
      case "StaticMemberExpression":
        return copyLocation(node, new AST.StaticMemberAssignmentTarget({ object: node.object, property: node.property }));

      case "ArrayAssignmentTarget":
      case "ObjectAssignmentTarget":
      case "ComputedMemberAssignmentTarget":
      case "StaticMemberAssignmentTarget":
      case "AssignmentTargetIdentifier":
      case "AssignmentTargetPropertyIdentifier":
      case "AssignmentTargetPropertyProperty":
      case "AssignmentTargetWithDefault":
        return node;
    }

    // istanbul ignore next
    throw new Error("Not reached");
  }

  transformDestructuringWithDefault(node) {
    switch (node.type) {
      case "AssignmentExpression":
        return copyLocation(node, new AST.AssignmentTargetWithDefault({
          binding: this.transformDestructuring(node.binding),
          init: node.expression,
        }));
    }
    return this.transformDestructuring(node);
  }

  lookaheadAssignmentExpression() {
    switch (this.lookahead.type) {
      case TokenType.ADD:
      case TokenType.ASSIGN_DIV:
      case TokenType.BIT_NOT:
      case TokenType.CLASS:
      case TokenType.DEC:
      case TokenType.DELETE:
      case TokenType.DIV:
      case TokenType.FALSE:
      case TokenType.FUNCTION:
      case TokenType.IDENTIFIER:
      case TokenType.INC:
      case TokenType.LET:
      case TokenType.LBRACE:
      case TokenType.LBRACK:
      case TokenType.LPAREN:
      case TokenType.NEW:
      case TokenType.NOT:
      case TokenType.NULL:
      case TokenType.NUMBER:
      case TokenType.STRING:
      case TokenType.SUB:
      case TokenType.SUPER:
      case TokenType.THIS:
      case TokenType.TRUE:
      case TokenType.TYPEOF:
      case TokenType.VOID:
      case TokenType.YIELD:
      case TokenType.TEMPLATE:
        return true;
    }
    return false;
  }

  parseYieldExpression() {
    let startLocation = this.getLocation();

    this.lex();
    if (this.hasLineTerminatorBeforeNext) {
      return this.markLocation(new AST.YieldExpression({ expression: null }), startLocation);
    }
    let isGenerator = !!this.eat(TokenType.MUL);
    let expr = null;
    if (isGenerator || this.lookaheadAssignmentExpression()) {
      expr = this.parseAssignmentExpression();
    }
    let ctor = isGenerator ? AST.YieldGeneratorExpression : AST.YieldExpression;
    return this.markLocation(new ctor({ expression: expr }), startLocation);
  }

  parseConditionalExpression() {
    let startLocation = this.getLocation();
    let test = this.parseBinaryExpression();
    if (this.firstExprError) return test;
    if (this.eat(TokenType.CONDITIONAL)) {
      this.isBindingElement = this.isAssignmentTarget = false;
      let previousAllowIn = this.allowIn;
      this.allowIn = true;
      let consequent = this.isolateCoverGrammar(this.parseAssignmentExpression);
      this.allowIn = previousAllowIn;
      this.expect(TokenType.COLON);
      let alternate = this.isolateCoverGrammar(this.parseAssignmentExpression);
      return this.markLocation(new AST.ConditionalExpression({ test, consequent, alternate }), startLocation);
    }
    return test;
  }

  isBinaryOperator(type) {
    switch (type) {
      case TokenType.OR:
      case TokenType.AND:
      case TokenType.BIT_OR:
      case TokenType.BIT_XOR:
      case TokenType.BIT_AND:
      case TokenType.EQ:
      case TokenType.NE:
      case TokenType.EQ_STRICT:
      case TokenType.NE_STRICT:
      case TokenType.LT:
      case TokenType.GT:
      case TokenType.LTE:
      case TokenType.GTE:
      case TokenType.INSTANCEOF:
      case TokenType.SHL:
      case TokenType.SHR:
      case TokenType.SHR_UNSIGNED:
      case TokenType.ADD:
      case TokenType.SUB:
      case TokenType.MUL:
      case TokenType.DIV:
      case TokenType.MOD:
        return true;
      case TokenType.IN:
        return this.allowIn;
      default:
        return false;
    }
  }

  parseBinaryExpression() {
    let startLocation = this.getLocation();
    let left = this.parseExponentiationExpression();
    if (this.firstExprError) {
      return left;
    }

    let operator = this.lookahead.type;

    if (!this.isBinaryOperator(operator)) return left;

    this.isBindingElement = this.isAssignmentTarget = false;

    this.lex();
    let stack = [];
    stack.push({startLocation, left, operator, precedence: BinaryPrecedence[operator.name]});
    startLocation = this.getLocation();
    let right = this.isolateCoverGrammar(this.parseExponentiationExpression);
    operator = this.lookahead.type;
    while (this.isBinaryOperator(operator)) {
      let precedence = BinaryPrecedence[operator.name];
      // Reduce: make a binary expression from the three topmost entries.
      while (stack.length && precedence <= stack[stack.length - 1].precedence) {
        let stackItem = stack[stack.length - 1];
        let stackOperator = stackItem.operator;
        left = stackItem.left;
        stack.pop();
        startLocation = stackItem.startLocation;
        right = this.markLocation(new AST.BinaryExpression({ left, operator: stackOperator.name, right }), startLocation);
      }

      this.lex();
      stack.push({startLocation, left: right, operator, precedence});

      startLocation = this.getLocation();
      right = this.isolateCoverGrammar(this.parseExponentiationExpression);
      operator = this.lookahead.type;
    }

    // Final reduce to clean-up the stack.
    return stack.reduceRight((expr, stackItem) =>
        this.markLocation(new AST.BinaryExpression({
          left: stackItem.left,
          operator: stackItem.operator.name,
          right: expr,
        }), stackItem.startLocation),
      right);
  }

  parseExponentiationExpression() {
    let left = this.parseUnaryExpression();
    if (this.lookahead.type !== TokenType.EXP) {
      return left;
    }
    this.lex();

    let right = this.isolateCoverGrammar(this.parseExponentiationExpression);
    return new AST.BinaryExpression({ left, operator: "**", right });
  }

  parseUnaryExpression() {
    if (this.lookahead.type.klass !== TokenClass.Punctuator && this.lookahead.type.klass !== TokenClass.Keyword) {
      return this.parseUpdateExpression();
    }
    let startLocation = this.getLocation();
    let operator = this.lookahead;
    if (!isPrefixOperator(operator)) {
      return this.parseUpdateExpression();
    }

    this.lex();
    this.isBindingElement = this.isAssignmentTarget = false;

    let node;
    if (isUpdateOperator(operator)) {
      let operandStartLocation = this.getLocation();
      let operand = this.isolateCoverGrammar(this.parseUnaryExpression);
      if (!isValidSimpleAssignmentTarget(operand)) {
        throw this.createErrorWithLocation(operandStartLocation, ErrorMessages.INVALID_UPDATE_OPERAND);
      }
      operand = this.transformDestructuring(operand);
      node = new AST.UpdateExpression({ isPrefix: true, operator: operator.value, operand });
    } else {
      let operand = this.isolateCoverGrammar(this.parseUnaryExpression);
      node = new AST.UnaryExpression({ operator: operator.value, operand });
    }

    return this.markLocation(node, startLocation);
  }

  parseUpdateExpression() {
    let startLocation = this.getLocation();

    let operand = this.parseLeftHandSideExpression({ allowCall: true });
    if (this.firstExprError || this.hasLineTerminatorBeforeNext) return operand;

    let operator = this.lookahead;
    if (!isUpdateOperator(operator)) return operand;
    this.lex();
    this.isBindingElement = this.isAssignmentTarget = false;
    if (!isValidSimpleAssignmentTarget(operand)) {
      throw this.createErrorWithLocation(startLocation, ErrorMessages.INVALID_UPDATE_OPERAND);
    }
    operand = this.transformDestructuring(operand);

    return this.markLocation(new AST.UpdateExpression({ isPrefix: false, operator: operator.value, operand }), startLocation);
  }

  parseLeftHandSideExpression({allowCall}) {
    let startLocation = this.getLocation();
    let previousAllowIn = this.allowIn;
    this.allowIn = true;

    let expr, token = this.lookahead;

    if (this.eat(TokenType.SUPER)) {
      this.isBindingElement = false;
      this.isAssignmentTarget = false;
      expr = this.markLocation(new AST.Super, startLocation);
      if (this.match(TokenType.LPAREN)) {
        if (allowCall) {
          expr = this.markLocation(new AST.CallExpression({
            callee: expr,
            arguments: this.parseArgumentList(),
          }), startLocation);
        } else {
          throw this.createUnexpected(token);
        }
      } else if (this.match(TokenType.LBRACK)) {
        expr = this.markLocation(new AST.ComputedMemberExpression({
          object: expr,
          expression: this.parseComputedMember(),
        }), startLocation);
        this.isAssignmentTarget = true;
      } else if (this.match(TokenType.PERIOD)) {
        expr = this.markLocation(new AST.StaticMemberExpression({
          object: expr,
          property: this.parseStaticMember(),
        }), startLocation);
        this.isAssignmentTarget = true;
      } else {
        throw this.createUnexpected(token);
      }
    } else if (this.match(TokenType.NEW)) {
      this.isBindingElement = this.isAssignmentTarget = false;
      expr = this.parseNewExpression();
    } else {
      expr = this.parsePrimaryExpression();
      if (this.firstExprError) {
        return expr;
      }
    }

    while (true) {
      if (allowCall && this.match(TokenType.LPAREN)) {
        this.isBindingElement = this.isAssignmentTarget = false;
        expr = this.markLocation(new AST.CallExpression({
          callee: expr,
          arguments: this.parseArgumentList(),
        }), startLocation);
      } else if (this.match(TokenType.LBRACK)) {
        this.isBindingElement = false;
        this.isAssignmentTarget = true;
        expr = this.markLocation(new AST.ComputedMemberExpression({
          object: expr,
          expression: this.parseComputedMember(),
        }), startLocation);
      } else if (this.match(TokenType.PERIOD)) {
        this.isBindingElement = false;
        this.isAssignmentTarget = true;
        expr = this.markLocation(new AST.StaticMemberExpression({
          object: expr,
          property: this.parseStaticMember(),
        }), startLocation);
      } else if (this.match(TokenType.TEMPLATE)) {
        this.isBindingElement = this.isAssignmentTarget = false;
        expr = this.markLocation(new AST.TemplateExpression({
          tag: expr,
          elements: this.parseTemplateElements(),
        }), startLocation);
      } else {
        break;
      }
    }

    this.allowIn = previousAllowIn;

    return expr;
  }

  parseTemplateElements() {
    let startLocation = this.getLocation();
    let token = this.lookahead;
    if (token.tail) {
      this.lex();
      return [this.markLocation(new AST.TemplateElement({ rawValue: token.slice.text.slice(1, -1) }), startLocation)];
    }
    let result = [
      this.markLocation(new AST.TemplateElement({ rawValue: this.lex().slice.text.slice(1, -2) }), startLocation),
    ];
    while (true) {
      result.push(this.parseExpression());
      if (!this.match(TokenType.RBRACE)) {
        throw this.createILLEGAL();
      }
      this.index = this.startIndex;
      this.line = this.startLine;
      this.lineStart = this.startLineStart;
      this.lookahead = this.scanTemplateElement();
      startLocation = this.getLocation();
      token = this.lex();
      if (token.tail) {
        result.push(this.markLocation(new AST.TemplateElement({ rawValue: token.slice.text.slice(1, -1) }), startLocation));
        return result;
      } else {
        result.push(this.markLocation(new AST.TemplateElement({ rawValue: token.slice.text.slice(1, -2) }), startLocation));
      }
    }
  }

  parseStaticMember() {
    this.lex();
    if (!this.lookahead.type.klass.isIdentifierName) {
      throw this.createUnexpected(this.lookahead);
    } else {
      return this.lex().value;
    }
  }

  parseComputedMember() {
    this.lex();
    let expr = this.parseExpression();
    this.expect(TokenType.RBRACK);
    return expr;
  }

  parseNewExpression() {
    let startLocation = this.getLocation();
    this.lex();
    if (this.eat(TokenType.PERIOD)) {
      let ident = this.expect(TokenType.IDENTIFIER);
      if (ident.value !== "target") {
        throw this.createUnexpected(ident);
      }
      return this.markLocation(new AST.NewTargetExpression, startLocation);
    }
    let callee = this.isolateCoverGrammar(() => this.parseLeftHandSideExpression({ allowCall: false }));
    return this.markLocation(new AST.NewExpression({
      callee,
      arguments: this.match(TokenType.LPAREN) ? this.parseArgumentList() : [],
    }), startLocation);
  }

  parseRegexFlags(flags) {
    let global = false,
        ignoreCase = false,
        multiLine = false,
        unicode = false,
        sticky = false;
    for (let i = 0; i < flags.length; ++i) {
      let f = flags[i];
      switch (f) {
        case 'g':
          if (global) {
            throw this.createError("Duplicate regular expression flag 'g'");
          }
          global = true;
          break;
        case 'i':
          if (ignoreCase) {
            throw this.createError("Duplicate regular expression flag 'i'");
          }
          ignoreCase = true;
          break;
        case 'm':
          if (multiLine) {
            throw this.createError("Duplicate regular expression flag 'm'");
          }
          multiLine = true;
          break;
        case 'u':
          if (unicode) {
            throw this.createError("Duplicate regular expression flag 'u'");
          }
          unicode = true;
          break;
        case 'y':
          if (sticky) {
            throw this.createError("Duplicate regular expression flag 'y'");
          }
          sticky = true;
          break;
        default:
          throw this.createError(`Invalid regular expression flag '${f}'`);
      }
    }
    return { global, ignoreCase, multiLine, unicode, sticky };
  }

  parsePrimaryExpression() {
    if (this.match(TokenType.LPAREN)) {
      return this.parseGroupExpression();
    }

    let startLocation = this.getLocation();

    switch (this.lookahead.type) {
      case TokenType.IDENTIFIER:
      case TokenType.YIELD:
      case TokenType.LET:
        return this.markLocation(new AST.IdentifierExpression({ name: this.parseIdentifier() }), startLocation);
      case TokenType.STRING:
        this.isBindingElement = this.isAssignmentTarget = false;
        return this.parseStringLiteral();
      case TokenType.NUMBER:
        this.isBindingElement = this.isAssignmentTarget = false;
        return this.parseNumericLiteral();
      case TokenType.THIS:
        this.lex();
        this.isBindingElement = this.isAssignmentTarget = false;
        return this.markLocation(new AST.ThisExpression, startLocation);
      case TokenType.FUNCTION:
        this.isBindingElement = this.isAssignmentTarget = false;
        return this.markLocation(this.parseFunction({isExpr: true, inDefault: false, allowGenerator: true}), startLocation);
      case TokenType.TRUE:
        this.lex();
        this.isBindingElement = this.isAssignmentTarget = false;
        return this.markLocation(new AST.LiteralBooleanExpression({ value: true }), startLocation);
      case TokenType.FALSE:
        this.lex();
        this.isBindingElement = this.isAssignmentTarget = false;
        return this.markLocation(new AST.LiteralBooleanExpression({ value: false }), startLocation);
      case TokenType.NULL:
        this.lex();
        this.isBindingElement = this.isAssignmentTarget = false;
        return this.markLocation(new AST.LiteralNullExpression, startLocation);
      case TokenType.LBRACK:
        return this.parseArrayExpression();
      case TokenType.LBRACE:
        return this.parseObjectExpression();
      case TokenType.TEMPLATE:
        this.isBindingElement = this.isAssignmentTarget = false;
        return this.markLocation(new AST.TemplateExpression({ tag: null, elements: this.parseTemplateElements() }), startLocation);
      case TokenType.DIV:
      case TokenType.ASSIGN_DIV:
        this.isBindingElement = this.isAssignmentTarget = false;
        this.lookahead = this.scanRegExp(this.match(TokenType.DIV) ? "/" : "/=");
        let token = this.lex();
        let lastSlash = token.value.lastIndexOf("/");
        let pattern = token.value.slice(1, lastSlash);
        let flags = token.value.slice(lastSlash + 1);
        let ctorArgs = this.parseRegexFlags(flags);
        ctorArgs.pattern = pattern;
        return this.markLocation(new AST.LiteralRegExpExpression(ctorArgs), startLocation);
      case TokenType.CLASS:
        this.isBindingElement = this.isAssignmentTarget = false;
        return this.parseClass({ isExpr: true, inDefault: false });
      default:
        throw this.createUnexpected(this.lookahead);
    }
  }

  parseNumericLiteral() {
    let startLocation = this.getLocation();
    let token = this.lex();
    if (token.octal && this.strict) {
      if (token.noctal) {
        throw this.createErrorWithLocation(startLocation, "Unexpected noctal integer literal");
      } else {
        throw this.createErrorWithLocation(startLocation, "Unexpected legacy octal integer literal");
      }
    }
    let node = token.value === 1 / 0
      ? new AST.LiteralInfinityExpression
      : new AST.LiteralNumericExpression({ value: token.value });
    return this.markLocation(node, startLocation);
  }

  parseStringLiteral() {
    let startLocation = this.getLocation();
    let token = this.lex();
    if (token.octal != null && this.strict) {
      throw this.createErrorWithLocation(startLocation, "Unexpected legacy octal escape sequence: \\" + token.octal);
    }
    return this.markLocation(new AST.LiteralStringExpression({ value: token.str }), startLocation);
  }

  parseIdentifierName() {
    if (this.lookahead.type.klass.isIdentifierName) {
      return this.lex().value;
    } else {
      throw this.createUnexpected(this.lookahead);
    }
  }

  parseBindingIdentifier() {
    let startLocation = this.getLocation();
    return this.markLocation(new AST.BindingIdentifier({ name: this.parseIdentifier() }), startLocation);
  }

  parseIdentifier() {
    let type = this.lookahead.type;
    if (type === TokenType.IDENTIFIER || type === TokenType.YIELD && !this.allowYieldExpression || type === TokenType.LET) {
        return this.lex().value;
    }
    throw this.createUnexpected(this.lookahead);
  }

  parseArgumentList() {
    this.lex();
    let args = this.parseArguments();
    this.expect(TokenType.RPAREN);
    return args;
  }

  parseArguments() {
    let result = [];
    while (true) {
      if (this.match(TokenType.RPAREN) || this.eof()) {
        return result;
      }
      let arg;
      if (this.eat(TokenType.ELLIPSIS)) {
        let startLocation = this.getLocation();
        arg = this.markLocation(new AST.SpreadElement({ expression: this.parseAssignmentExpression() }), startLocation);
      } else {
        arg = this.parseAssignmentExpression();
      }
      result.push(arg);
      if (!this.eat(TokenType.COMMA)) break;
    }
    return result;
  }

  // 11.2 Left-Hand-Side Expressions;

  ensureArrow() {
    if (this.hasLineTerminatorBeforeNext) {
      throw this.createError(ErrorMessages.UNEXPECTED_LINE_TERMINATOR);
    }
    if (!this.match(TokenType.ARROW)) {
      this.expect(TokenType.ARROW);
    }
  }

  parseGroupExpression() {
    // At this point, we need to parse 3 things:
    //  1. Group expression
    //  2. Assignment target of assignment expression
    //  3. Parameter list of arrow function
    let rest = null;
    let start = this.expect(TokenType.LPAREN);
    if (this.eat(TokenType.RPAREN)) {
      this.ensureArrow();
      this.isBindingElement = this.isAssignmentTarget = false;
      return {
          type: ARROW_EXPRESSION_PARAMS,
          params: [],
          rest: null,
      };
    } else if (this.eat(TokenType.ELLIPSIS)) {
      rest = this.parseBindingTarget();
      this.expect(TokenType.RPAREN);
      this.ensureArrow();
      this.isBindingElement = this.isAssignmentTarget = false;
      return {
        type: ARROW_EXPRESSION_PARAMS,
        params: [],
        rest,
      };
    }


    let startLocation = this.getLocation();
    let group = this.inheritCoverGrammar(this.parseAssignmentExpressionOrTarget);

    let params = this.isBindingElement ? [this.targetToBinding(this.transformDestructuringWithDefault(group))] : null;

    while (this.eat(TokenType.COMMA)) {
      this.isAssignmentTarget = false;
      if (this.match(TokenType.ELLIPSIS)) {
        if (!this.isBindingElement) {
          throw this.createUnexpected(this.lookahead);
        }
        this.lex();
        rest = this.parseBindingTarget();
        break;
      }

      if (!group) {
        // Can be only binding elements.
        let binding = this.parseBindingElement();
        params.push(binding);
      } else {
        // Can be either binding element or assignment target.
        let expr = this.inheritCoverGrammar(this.parseAssignmentExpressionOrTarget);
        if (!this.isBindingElement) {
          params = null;
        } else {
          params.push(this.targetToBinding(this.transformDestructuringWithDefault(expr)));
        }

        if (this.firstExprError) {
          group = null;
        } else {
          group = this.markLocation(new AST.BinaryExpression({
            left: group,
            operator: ",",
            right: expr,
          }), startLocation);
        }
      }
    }

    this.expect(TokenType.RPAREN);

    if (!this.hasLineTerminatorBeforeNext && this.match(TokenType.ARROW)) {
      if (!this.isBindingElement) {
        throw this.createErrorWithLocation(start, ErrorMessages.ILLEGAL_ARROW_FUNCTION_PARAMS);
      }

      this.isBindingElement = false;
      return { type: ARROW_EXPRESSION_PARAMS, params, rest };
    } else {
      // Ensure assignment pattern:
      if (rest) {
        this.ensureArrow();
      }
      this.isBindingElement = false;
      if (!isValidSimpleAssignmentTarget(group)) {
        this.isAssignmentTarget = false;
      }
      return group;
    }
  }

  parseArrayExpression() {
    let startLocation = this.getLocation();

    this.lex();

    let exprs = [];
    let rest = null;

    while (true) {
      if (this.match(TokenType.RBRACK)) {
        break;
      }
      if (this.eat(TokenType.COMMA)) {
        exprs.push(null);
      } else {
        let elementLocation = this.getLocation();
        let expr;
        if (this.eat(TokenType.ELLIPSIS)) {
          // Spread/Rest element
          expr = this.inheritCoverGrammar(this.parseAssignmentExpressionOrTarget);
          if (!this.isAssignmentTarget && this.firstExprError) {
            throw this.firstExprError;
          }
          if (expr.type === "ArrayAssignmentTarget" || expr.type === "ObjectAssignmentTarget") {
            rest = expr;
            break;
          }
          expr = this.markLocation(new AST.SpreadElement({ expression: expr }), elementLocation);
          if (!this.match(TokenType.RBRACK)) {
            this.isBindingElement = this.isAssignmentTarget = false;
          }
        } else {
          expr = this.inheritCoverGrammar(this.parseAssignmentExpressionOrTarget);
          if (!this.isAssignmentTarget && this.firstExprError) {
            throw this.firstExprError;
          }
        }
        exprs.push(expr);

        if (!this.match(TokenType.RBRACK)) {
          this.expect(TokenType.COMMA);
        }
      }
    }

    if (rest && this.match(TokenType.COMMA)) {
      throw this.createErrorWithLocation(startLocation, ErrorMessages.UNEXPECTED_COMMA_AFTER_REST);
    }

    this.expect(TokenType.RBRACK);

    if (rest) {
      if (!this.isAssignmentTarget) {
        throw this.createError(ErrorMessages.INVALID_LHS_IN_BINDING);
      }
      return this.markLocation(new AST.ArrayAssignmentTarget({
        elements: exprs.map(e => e && this.transformDestructuringWithDefault(e)),
        rest,
      }), startLocation);
    } else if (this.firstExprError) {
      if (!this.isAssignmentTarget) {
        throw this.firstExprError;
      }
      let last = exprs[exprs.length - 1];
      if (last != null && last.type === "SpreadElement") {
        return this.markLocation(new AST.ArrayAssignmentTarget({
          elements: exprs.slice(0, -1).map(e => e && this.transformDestructuringWithDefault(e)),
          rest: this.transformDestructuring(last.expression),
        }), startLocation);
      } else {
        return this.markLocation(new AST.ArrayAssignmentTarget({
          elements: exprs.map(e => e && this.transformDestructuringWithDefault(e)),
          rest: null,
        }), startLocation);
      }
    } else {
      return this.markLocation(new AST.ArrayExpression({ elements: exprs }), startLocation);
    }

  }

  parseObjectExpression() {
    let startLocation = this.getLocation();

    this.lex();

    let properties = [];
    while (!this.match(TokenType.RBRACE)) {
      let property = this.inheritCoverGrammar(this.parsePropertyDefinition);
      properties.push(property);
      if (!this.match(TokenType.RBRACE)) {
        this.expect(TokenType.COMMA);
      }
    }
    this.expect(TokenType.RBRACE);
    if (this.firstExprError) {
      if (!this.isAssignmentTarget) {
        throw this.createError(ErrorMessages.INVALID_LHS_IN_BINDING);
      }
      return this.markLocation(new AST.ObjectAssignmentTarget({ properties: properties.map(p => this.transformDestructuring(p)) }), startLocation);
    } else {
      return this.markLocation(new AST.ObjectExpression({ properties }), startLocation);
    }
  }

  parsePropertyDefinition() {
    let startLocation = this.getLocation();
    let token = this.lookahead;

    let {methodOrKey, kind} = this.parseMethodDefinition();
    switch (kind) {
      case "method":
        this.isBindingElement = this.isAssignmentTarget = false;
        return methodOrKey;
      case "identifier":
        if (this.eat(TokenType.ASSIGN)) {
          // CoverInitializedName
          let init = this.isolateCoverGrammar(this.parseAssignmentExpression);
          this.firstExprError = this.createErrorWithLocation(startLocation, ErrorMessages.ILLEGAL_PROPERTY);
          return this.markLocation(new AST.AssignmentTargetPropertyIdentifier({
            binding: this.transformDestructuring(methodOrKey),
            init,
          }), startLocation);
        } else if (!this.match(TokenType.COLON)) {
          if (token.type !== TokenType.IDENTIFIER && token.type !== TokenType.YIELD && token.type !== TokenType.LET) {
            throw this.createUnexpected(token);
          }
          return this.markLocation(new AST.ShorthandProperty({ name: new AST.IdentifierExpression({ name: methodOrKey.value }) }), startLocation);
        }
    }

    // DataProperty
    this.expect(TokenType.COLON);

    let expr = this.inheritCoverGrammar(this.parseAssignmentExpressionOrTarget);
    return this.markLocation(new AST.DataProperty({ name: methodOrKey, expression: expr }), startLocation);
  }

  parsePropertyName() {
    // PropertyName[Yield,GeneratorParameter]:
    let token = this.lookahead;
    let startLocation = this.getLocation();

    if (this.eof()) {
      throw this.createUnexpected(token);
    }

    switch (token.type) {
      case TokenType.STRING:
        return {
          name: this.markLocation(new AST.StaticPropertyName({
            value: this.parseStringLiteral().value,
          }), startLocation),
          binding: null,
        };
      case TokenType.NUMBER:
        let numLiteral = this.parseNumericLiteral();
        return {
          name: this.markLocation(new AST.StaticPropertyName({
            value: `${numLiteral.type === "LiteralInfinityExpression" ? 1 / 0 : numLiteral.value}`,
          }), startLocation),
          binding: null,
        };
      case TokenType.LBRACK:
        let previousYield = this.allowYieldExpression;
        this.lex();
        let expr = this.parseAssignmentExpression();
        this.expect(TokenType.RBRACK);
        this.allowYieldExpression = previousYield;
        return { name: this.markLocation(new AST.ComputedPropertyName({ expression: expr }), startLocation), binding: null };
    }

    let name = this.parseIdentifierName();
    return {
      name: this.markLocation(new AST.StaticPropertyName({ value: name }), startLocation),
      binding: this.markLocation(new AST.BindingIdentifier({ name }), startLocation),
    };
  }

  /**
   * Test if lookahead can be the beginning of a `PropertyName`.
   * @returns {boolean}
   */
  lookaheadPropertyName() {
    switch (this.lookahead.type) {
      case TokenType.NUMBER:
      case TokenType.STRING:
      case TokenType.LBRACK:
        return true;
      default:
        return this.lookahead.type.klass.isIdentifierName;
    }
  }

  /**
   * Try to parse a method definition.
   *
   * If it turns out to be one of:
   *  * `IdentifierReference`
   *  * `CoverInitializedName` (`IdentifierReference "=" AssignmentExpression`)
   *  * `PropertyName : AssignmentExpression`
   * The parser will stop at the end of the leading `Identifier` or `PropertyName` and return it.
   *
   * @returns {{methodOrKey: (Method|PropertyName), kind: string}}
   */
  parseMethodDefinition() {
    let token = this.lookahead;
    let startLocation = this.getLocation();

    let isGenerator = !!this.eat(TokenType.MUL);

    let {name, binding} = this.parsePropertyName();

    if (!isGenerator && token.type === TokenType.IDENTIFIER) {
      let name = token.value;
      if (name.length === 3) {
        // Property Assignment: Getter and Setter.
        if (name === "get" && this.lookaheadPropertyName()) {
          ({name} = this.parsePropertyName());
          this.expect(TokenType.LPAREN);
          this.expect(TokenType.RPAREN);
          let previousYield = this.allowYieldExpression;
          this.allowYieldExpression = false;
          let body = this.parseFunctionBody();
          this.allowYieldExpression = previousYield;
          return {
            methodOrKey: this.markLocation(new AST.Getter({ name, body }), startLocation),
            kind: "method",
          };
        } else if (name === "set" && this.lookaheadPropertyName()) {
          ({name} = this.parsePropertyName());
          this.expect(TokenType.LPAREN);
          let param = this.parseBindingElement();
          this.expect(TokenType.RPAREN);
          let previousYield = this.allowYieldExpression;
          this.allowYieldExpression = false;
          let body = this.parseFunctionBody();
          this.allowYieldExpression = previousYield;
          return {
            methodOrKey: this.markLocation(new AST.Setter({ name, param, body }), startLocation),
            kind: "method",
          };
        }
      }
    }

    if (this.match(TokenType.LPAREN)) {
      let previousYield = this.allowYieldExpression;
      this.allowYieldExpression = isGenerator;
      let params = this.parseParams();
      this.allowYieldExpression = isGenerator;
      let body = this.parseFunctionBody();
      this.allowYieldExpression = previousYield;

      return {
        methodOrKey: this.markLocation(new AST.Method({ isGenerator, name, params, body }), startLocation),
        kind: "method",
      };
    }

    if (isGenerator && this.match(TokenType.COLON)) {
      throw this.createUnexpected(this.lookahead);
    }

    return {
      methodOrKey: name,
      kind: token.type.klass.isIdentifierName ? "identifier" : "property",
      binding,
    };
  }

  parseClass({isExpr, inDefault}) {
    let startLocation = this.getLocation();

    this.lex();
    let name = null;
    let heritage = null;

    if (this.match(TokenType.IDENTIFIER)) {
      name = this.parseBindingIdentifier();
    } else if (!isExpr) {
      if (inDefault) {
        name = new AST.BindingIdentifier({ name: "*default*" });
      } else {
        throw this.createUnexpected(this.lookahead);
      }
    }

    if (this.eat(TokenType.EXTENDS)) {
      heritage = this.isolateCoverGrammar(() => this.parseLeftHandSideExpression({ allowCall: true }));
    }

    this.expect(TokenType.LBRACE);
    let elements = [];
    while (!this.eat(TokenType.RBRACE)) {
      if (this.eat(TokenType.SEMICOLON)) {
        continue;
      }
      let isStatic = false;
      let {methodOrKey, kind} = this.parseMethodDefinition();
      if (kind === "identifier" && methodOrKey.value === "static") {
        isStatic = true;
        ({methodOrKey, kind} = this.parseMethodDefinition());
      }
      if (kind === "method") {
        elements.push(copyLocation(methodOrKey, new AST.ClassElement({ isStatic, method: methodOrKey })));
      } else {
        throw this.createError("Only methods are allowed in classes");
      }
    }
    return this.markLocation(new (isExpr ? AST.ClassExpression : AST.ClassDeclaration)({ name, super: heritage, elements }), startLocation);
  }

  parseFunction({isExpr, inDefault, allowGenerator}) {
    let startLocation = this.getLocation();

    this.lex();

    let name = null;
    let isGenerator = allowGenerator && !!this.eat(TokenType.MUL);

    let previousYield = this.allowYieldExpression;

    if (isExpr) {
      this.allowYieldExpression = isGenerator;
    }

    if (!this.match(TokenType.LPAREN)) {
      name = this.parseBindingIdentifier();
    } else if (!isExpr) {
      if (inDefault) {
        name = new AST.BindingIdentifier({ name: "*default*" });
      } else {
        throw this.createUnexpected(this.lookahead);
      }
    }

    this.allowYieldExpression = isGenerator;
    let params = this.parseParams();
    this.allowYieldExpression = isGenerator;
    let body = this.parseFunctionBody();
    this.allowYieldExpression = previousYield;

    return this.markLocation(new (isExpr ? AST.FunctionExpression : AST.FunctionDeclaration)({ isGenerator, name, params, body }), startLocation);
  }

  parseArrayBinding() {
    let startLocation = this.getLocation();

    this.expect(TokenType.LBRACK);

    let elements = [], rest = null;

    while (true) {
      if (this.match(TokenType.RBRACK)) {
        break;
      }
      let el;

      if (this.eat(TokenType.COMMA)) {
        el = null;
      } else {
        if (this.eat(TokenType.ELLIPSIS)) {
          rest = this.parseBindingTarget();
          break;
        } else {
          el = this.parseBindingElement();
        }
        if (!this.match(TokenType.RBRACK)) {
          this.expect(TokenType.COMMA);
        }
      }
      elements.push(el);
    }

    this.expect(TokenType.RBRACK);

    return this.markLocation(new AST.ArrayBinding({ elements, rest }), startLocation);
  }

  parseBindingProperty() {
    let startLocation = this.getLocation();
    let token = this.lookahead;
    let {name, binding} = this.parsePropertyName();
    if ((token.type === TokenType.IDENTIFIER || token.type === TokenType.LET || token.type === TokenType.YIELD) && name.type === "StaticPropertyName") {
      if (!this.match(TokenType.COLON)) {
        let defaultValue = null;
        if (this.eat(TokenType.ASSIGN)) {
          let previousAllowYieldExpression = this.allowYieldExpression;
          let expr = this.parseAssignmentExpression();
          defaultValue = expr;
          this.allowYieldExpression = previousAllowYieldExpression;
        } else if (token.type === TokenType.YIELD && this.allowYieldExpression) {
          throw this.createUnexpected(token);
        }
        return this.markLocation(new AST.BindingPropertyIdentifier({
          binding,
          init: defaultValue,
        }), startLocation);
      }
    }
    this.expect(TokenType.COLON);
    binding = this.parseBindingElement();
    return this.markLocation(new AST.BindingPropertyProperty({ name, binding }), startLocation);
  }

  parseObjectBinding() {
    let startLocation = this.getLocation();

    this.expect(TokenType.LBRACE);

    let properties = [];
    while (!this.match(TokenType.RBRACE)) {
      properties.push(this.parseBindingProperty());
      if (!this.match(TokenType.RBRACE)) {
        this.expect(TokenType.COMMA);
      }
    }

    this.expect(TokenType.RBRACE);

    return this.markLocation(new AST.ObjectBinding({ properties }), startLocation);
  }

  parseBindingTarget() {
    switch (this.lookahead.type) {
      case TokenType.IDENTIFIER:
      case TokenType.LET:
      case TokenType.YIELD:
        return this.parseBindingIdentifier();
      case TokenType.LBRACK:
        return this.parseArrayBinding();
      case TokenType.LBRACE:
        return this.parseObjectBinding();
    }
    throw this.createUnexpected(this.lookahead);
  }

  parseBindingElement() {
    let startLocation = this.getLocation();
    let binding = this.parseBindingTarget();

    if (this.eat(TokenType.ASSIGN)) {
      let previousYieldExpression = this.allowYieldExpression;
      let init = this.parseAssignmentExpression();
      binding = this.markLocation(new AST.BindingWithDefault({ binding, init }), startLocation);
      this.allowYieldExpression = previousYieldExpression;
    }
    return binding;
  }

  parseParam() {
    let previousInParameter = this.inParameter;
    this.inParameter = true;
    let param = this.parseBindingElement();
    this.inParameter = previousInParameter;
    return param;
  }

  parseParams() {
    let paramsLocation = this.getLocation();

    this.expect(TokenType.LPAREN);

    let items = [], rest = null;
    if (!this.match(TokenType.RPAREN)) {
      while (!this.eof()) {
        if (this.eat(TokenType.ELLIPSIS)) {
          rest = this.parseBindingTarget();
          break;
        }
        items.push(this.parseParam());
        if (this.match(TokenType.RPAREN)) break;
        this.expect(TokenType.COMMA);
      }
    }

    this.expect(TokenType.RPAREN);

    return this.markLocation(new AST.FormalParameters({ items, rest }), paramsLocation);
  }
}
