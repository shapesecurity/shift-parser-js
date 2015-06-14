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
  switch (node.type) {
    case "IdentifierExpression":
    case "ComputedMemberExpression":
    case "StaticMemberExpression":
      return true;
  }
  return false;
}

function transformDestructuring(node) {
  switch (node.type) {
    case "ObjectExpression":
      return copyLocation(node, {
        type: "ObjectBinding",
        properties: node.properties.map(transformDestructuring),
      });
    case "DataProperty":
      return copyLocation(node, {
        type: "BindingPropertyProperty",
        name: node.name,
        binding: transformDestructuring(node.expression),
      });
    case "ShorthandProperty":
      return copyLocation(node, {
        type: "BindingPropertyIdentifier",
        binding: copyLocation(node, { type: "BindingIdentifier", name: node.name }),
        init: null,
      });
    case "ArrayExpression":
      let last = node.elements[node.elements.length - 1];
      if (last != null && last.type === "SpreadElement") {
        return copyLocation(node, {
          type: "ArrayBinding",
          elements: node.elements.slice(0, -1).map(e => e && transformDestructuring(e)),
          restElement: copyLocation(last.expression, transformDestructuring(last.expression)),
        });
      } else {
        return copyLocation(node, {
          type: "ArrayBinding",
          elements: node.elements.map(e => e && transformDestructuring(e)),
          restElement: null,
        });
      }
      /* istanbul ignore next */
      break;
    case "AssignmentExpression":
      return copyLocation(node, {
        type: "BindingWithDefault",
        binding: transformDestructuring(node.binding),
        init: node.expression,
      });
    case "IdentifierExpression":
      return copyLocation(node, { type: "BindingIdentifier", name: node.name });
    case "StaticPropertyName":
      return copyLocation(node, { type: "BindingIdentifier", name: node.value });
    case "ComputedMemberExpression":
    case "StaticMemberExpression":
    case "ArrayBinding":
    case "BindingIdentifier":
    case "BindingPropertyIdentifier":
    case "BindingPropertyProperty":
    case "BindingWithDefault":
    case "ObjectBinding":
      return node;
    // istanbul ignore next
    default:
      throw new Error("Not reached");
  }
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
    this.inGeneratorParameter = false;
    this.inParameter = false;
    this.allowYieldExpression = false;
    this.module = false;
    this.moduleIsTheGoalSymbol = false;

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
    if (this.hasLineTerminatorBeforeNext) return;
    if (this.eat(TokenType.SEMICOLON)) return;
    if (!this.eof() && !this.match(TokenType.RBRACE)) {
      throw this.createUnexpected(this.lookahead);
    }
  }

  // this is a no-op, reserved for future use
  markLocation(node/*, startLocation*/) {
    return node;
  }

  parseModule() {
    this.moduleIsTheGoalSymbol = this.module = true;
    this.lookahead = this.advance();

    let startLocation = this.getLocation();
    let {directives, statements} = this.parseBody();
    return this.markLocation({ type: "Module", directives, items: statements }, startLocation);
  }

  parseScript() {
    this.lookahead = this.advance();

    let startLocation = this.getLocation();
    let body = this.parseBody();
    body.type = "Script";
    if (!this.match(TokenType.EOS)) {
      throw this.createUnexpected(this.lookahead);
    }
    return this.markLocation(body, startLocation);
  }

  parseFunctionBody() {
    let startLocation = this.getLocation();

    let oldInFunctionBody = this.inFunctionBody;
    let oldModule = this.module;
    this.inFunctionBody = true;
    this.module = false;

    this.expect(TokenType.LBRACE);
    let body = this.markLocation(this.parseBody(), startLocation);
    this.expect(TokenType.RBRACE);

    this.inFunctionBody = oldInFunctionBody;
    this.module = oldModule;

    return body;
  }

  parseBody() {
    let directives = [], statements = [], parsingDirectives = true;

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
          directives.push(this.markLocation({ type: "Directive", rawValue: text.slice(1, -1)}, directiveLocation));
        } else {
          parsingDirectives = false;
          statements.push(stmt);
        }
      } else {
        statements.push(stmt);
      }
    }

    return { type: "FunctionBody", directives, statements };
  }

  parseImportSpecifier() {
    let startLocation = this.getLocation(), name;
    if (this.match(TokenType.IDENTIFIER) || this.match(TokenType.YIELD) || this.match(TokenType.LET)) {
      name = this.parseIdentifier();
      if (!this.eatContextualKeyword("as")) {
        return this.markLocation( {
          type: "ImportSpecifier",
          name: null,
          binding: this.markLocation({ type: "BindingIdentifier", name: name }, startLocation),
        }, startLocation);
      }
    } else if (this.lookahead.type.klass.isIdentifierName) {
      name = this.parseIdentifierName();
      this.expectContextualKeyword("as");
    }

    return this.markLocation({ type: "ImportSpecifier", name, binding: this.parseBindingIdentifier() }, startLocation);
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
    this.consumeSemicolon();
    return value;
  }

  parseImportDeclaration() {
    let startLocation = this.getLocation(), defaultBinding = null, moduleSpecifier;
    this.expect(TokenType.IMPORT);
    switch (this.lookahead.type) {
      case TokenType.STRING:
        moduleSpecifier = this.lex().str;
        this.consumeSemicolon();
        return this.markLocation({ type: "Import", defaultBinding: null, namedImports: [], moduleSpecifier }, startLocation);
      case TokenType.IDENTIFIER:
      case TokenType.YIELD:
      case TokenType.LET:
        defaultBinding = this.parseBindingIdentifier();
        if (!this.eat(TokenType.COMMA)) {
          return this.markLocation({ type: "Import", defaultBinding, namedImports: [], moduleSpecifier: this.parseFromClause() }, startLocation);
        }
        break;
    }
    if (this.match(TokenType.MUL)) {
      return this.markLocation({
        type: "ImportNamespace",
        defaultBinding,
        namespaceBinding: this.parseNameSpaceBinding(),
        moduleSpecifier: this.parseFromClause(),
      }, startLocation);
    } else if (this.match(TokenType.LBRACE)) {
      return this.markLocation({
        type: "Import",
        defaultBinding,
        namedImports: this.parseNamedImports(),
        moduleSpecifier: this.parseFromClause(),
      }, startLocation);
    } else {
      throw this.createUnexpected(this.lookahead);
    }
  }

  parseExportSpecifier() {
    let startLocation = this.getLocation();
    let name = this.parseIdentifierName();
    if (this.eatContextualKeyword("as")) {
      let exportedName = this.parseIdentifierName();
      return this.markLocation({ type: "ExportSpecifier", name, exportedName }, startLocation);
    }
    return this.markLocation({ type: "ExportSpecifier", name: null, exportedName: name }, startLocation);
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
        decl = { type: "ExportAllFrom", moduleSpecifier: this.parseFromClause() };
        break;
      case TokenType.LBRACE:
        // export ExportClause FromClause ;
        // export ExportClause ;
        let namedExports = this.parseExportClause();
        let moduleSpecifier = null;
        if (this.matchContextualKeyword("from")) {
          moduleSpecifier = this.parseFromClause();
        }
        decl = { type: "ExportFrom", namedExports, moduleSpecifier };
        break;
      case TokenType.CLASS:
        // export ClassDeclaration
        decl = { type: "Export", declaration: this.parseClass({ isExpr: false, inDefault: false }) };
        break;
      case TokenType.FUNCTION:
        // export HoistableDeclaration
        decl = { type: "Export", declaration: this.parseFunction({ isExpr: false, inDefault: false, allowGenerator: true }) };
        break;
      case TokenType.DEFAULT:
        this.lex();
        switch (this.lookahead.type) {
          case TokenType.FUNCTION:
            // export default HoistableDeclaration[Default]
            decl = {
              type: "ExportDefault",
              body: this.parseFunction({ isExpr: false, inDefault: true, allowGenerator: true }),
            };
            break;
          case TokenType.CLASS:
            // export default ClassDeclaration[Default]
            decl = { type: "ExportDefault", body: this.parseClass({ isExpr: false, inDefault: true }) };
            break;
          default:
            // export default [lookahead ∉ {function, class}] AssignmentExpression[In] ;
            decl = { type: "ExportDefault", body: this.parseAssignmentExpression() };
            this.consumeSemicolon();
            break;
        }
        break;
      case TokenType.VAR:
      case TokenType.LET:
      case TokenType.CONST:
        // export LexicalDeclaration
        decl = { type: "Export", declaration: this.parseVariableDeclaration(true) };
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
          return { type: "LabeledStatement", label: expr.name, body: labeledBody };
        } else {
          this.consumeSemicolon();
          return { type: "ExpressionStatement", expression: expr };
        }
      }
    }
  }

  parseEmptyStatement() {
    this.lex();
    return { type: "EmptyStatement" };
  }

  parseBlockStatement() {
    return { type: "BlockStatement", block: this.parseBlock() };
  }

  parseExpressionStatement() {
    let expr = this.parseExpression();
    this.consumeSemicolon();
    return { type: "ExpressionStatement", expression: expr };
  }

  parseBreakStatement() {
    this.lex();

    // Catch the very common case first: immediately a semicolon (U+003B).
    if (this.eat(TokenType.SEMICOLON) || this.hasLineTerminatorBeforeNext) {
      return { type: "BreakStatement", label: null };
    }

    let label = null;
    if (this.match(TokenType.IDENTIFIER) || this.match(TokenType.YIELD) || this.match(TokenType.LET)) {
      label = this.parseIdentifier();
    }

    this.consumeSemicolon();

    return { type: "BreakStatement", label };
  }

  parseContinueStatement() {
    this.lex();

    // Catch the very common case first: immediately a semicolon (U+003B).
    if (this.eat(TokenType.SEMICOLON) || this.hasLineTerminatorBeforeNext) {
      return { type: "ContinueStatement", label: null };
    }

    let label = null;
    if (this.match(TokenType.IDENTIFIER) || this.match(TokenType.YIELD) || this.match(TokenType.LET)) {
      label = this.parseIdentifier();
    }

    this.consumeSemicolon();

    return { type: "ContinueStatement", label };
  }


  parseDebuggerStatement() {
    this.lex();
    this.consumeSemicolon();
    return { type: "DebuggerStatement" };
  }

  parseDoWhileStatement() {
    this.lex();
    let body = this.parseStatement();
    this.expect(TokenType.WHILE);
    this.expect(TokenType.LPAREN);
    let test = this.parseExpression();
    this.expect(TokenType.RPAREN);
    this.eat(TokenType.SEMICOLON);
    return { type: "DoWhileStatement", body, test };
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
      return { type: "ForStatement", init: null, test, update: right, body: this.getIteratorStatementEpilogue() };
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
          let type;

          if (this.match(TokenType.IN)) {
            if (init.declarators[0].init != null) {
              throw this.createError(ErrorMessages.INVALID_VAR_INIT_FOR_IN);
            }
            type = "ForInStatement";
            this.lex();
            right = this.parseExpression();
          } else {
            if (init.declarators[0].init != null) {
              throw this.createError(ErrorMessages.INVALID_VAR_INIT_FOR_OF);
            }
            type = "ForOfStatement";
            this.lex();
            right = this.parseAssignmentExpression();
          }

          let body = this.getIteratorStatementEpilogue();

          return { type, left: init, right, body };
        } else {
          this.expect(TokenType.SEMICOLON);
          if (!this.match(TokenType.SEMICOLON)) {
            test = this.parseExpression();
          }
          this.expect(TokenType.SEMICOLON);
          if (!this.match(TokenType.RPAREN)) {
            right = this.parseExpression();
          }
          return { type: "ForStatement", init, test, update: right, body: this.getIteratorStatementEpilogue() };
        }
      } else {
        let previousAllowIn = this.allowIn;
        this.allowIn = false;
        let expr = this.inheritCoverGrammar(this.parseAssignmentExpressionOrBindingElement);
        this.allowIn = previousAllowIn;

        if (this.isAssignmentTarget && expr.type !== "AssignmentExpression" && (this.match(TokenType.IN) || this.matchContextualKeyword("of"))) {
          if (startsWithLet && this.matchContextualKeyword("of")) {
            throw this.createError(ErrorMessages.INVALID_LHS_IN_FOR_OF);
          }
          let type = this.match(TokenType.IN) ? "ForInStatement" : "ForOfStatement";

          this.lex();
          right = this.parseExpression();

          return { type, left: transformDestructuring(expr), right, body: this.getIteratorStatementEpilogue() };
        } else {
          if (this.firstExprError) {
            throw this.firstExprError;
          }
          while (this.eat(TokenType.COMMA)) {
            let rhs = this.parseAssignmentExpression();
            expr = this.markLocation({ type: "BinaryExpression", left: expr, operator: ",", right: rhs}, leftLocation);
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
          return { type: "ForStatement", init: expr, test, update: right, body: this.getIteratorStatementEpilogue() };
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
    return { type: "IfStatement", test, consequent, alternate };
  }

  parseReturnStatement() {
    if (!this.inFunctionBody) {
      throw this.createError(ErrorMessages.ILLEGAL_RETURN);
    }

    this.lex();

    if (this.hasLineTerminatorBeforeNext) {
      return { type: "ReturnStatement", expression: null };
    }

    let expression = null;
    if (!this.match(TokenType.SEMICOLON)) {
      if (!this.match(TokenType.RBRACE) && !this.eof()) {
        expression = this.parseExpression();
      }
    }

    this.consumeSemicolon();
    return { type: "ReturnStatement", expression };
  }

  parseSwitchStatement() {
    this.lex();
    this.expect(TokenType.LPAREN);
    let discriminant = this.parseExpression();
    this.expect(TokenType.RPAREN);
    this.expect(TokenType.LBRACE);

    if (this.eat(TokenType.RBRACE)) {
      return { type: "SwitchStatement", discriminant, cases: [] };
    }

    let cases = this.parseSwitchCases();
    if (this.match(TokenType.DEFAULT)) {
      let defaultCase = this.parseSwitchDefault();
      let postDefaultCases = this.parseSwitchCases();
      if (this.match(TokenType.DEFAULT)) {
        throw this.createError(ErrorMessages.MULTIPLE_DEFAULTS_IN_SWITCH);
      }
      this.expect(TokenType.RBRACE);
      return {
        type: "SwitchStatementWithDefault",
        discriminant,
        preDefaultCases: cases,
        defaultCase,
        postDefaultCases,
      };
    } else {
      this.expect(TokenType.RBRACE);
      return { type: "SwitchStatement", discriminant, cases };
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
    return this.markLocation({
      type: "SwitchCase",
      test: this.parseExpression(),
      consequent: this.parseSwitchCaseBody(),
    }, startLocation);
  }

  parseSwitchDefault() {
    let startLocation = this.getLocation();
    this.expect(TokenType.DEFAULT);
    return this.markLocation({ type: "SwitchDefault", consequent: this.parseSwitchCaseBody() }, startLocation);
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
    return { type: "ThrowStatement", expression };
  }

  parseTryStatement() {
    this.lex();
    let body = this.parseBlock();

    if (this.match(TokenType.CATCH)) {
      let catchClause = this.parseCatchClause();
      if (this.eat(TokenType.FINALLY)) {
        let finalizer = this.parseBlock();
        return { type: "TryFinallyStatement", body, catchClause, finalizer };
      }
      return { type: "TryCatchStatement", body, catchClause };
    }

    if (this.eat(TokenType.FINALLY)) {
      let finalizer = this.parseBlock();
      return { type: "TryFinallyStatement", body, catchClause: null, finalizer };
    } else {
      throw this.createError(ErrorMessages.NO_CATCH_OR_FINALLY);
    }
  }

  parseVariableDeclarationStatement() {
    let declaration = this.parseVariableDeclaration(true);
    this.consumeSemicolon();
    return { type: "VariableDeclarationStatement", declaration };
  }

  parseWhileStatement() {
    this.lex();
    this.expect(TokenType.LPAREN);
    let test = this.parseExpression();
    let body = this.getIteratorStatementEpilogue();
    return { type: "WhileStatement", test, body };
  }

  parseWithStatement() {
    this.lex();
    this.expect(TokenType.LPAREN);
    let object = this.parseExpression();
    this.expect(TokenType.RPAREN);
    let body = this.parseStatement();
    return { type: "WithStatement", object, body };
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

    return this.markLocation({ type: "CatchClause", binding, body }, startLocation);
  }

  parseBlock() {
    let startLocation = this.getLocation();
    this.expect(TokenType.LBRACE);
    let body = [];
    while (!this.match(TokenType.RBRACE)) {
      body.push(this.parseStatementListItem());
    }
    this.expect(TokenType.RBRACE);
    return this.markLocation({ type: "Block", statements: body }, startLocation);
  }

  parseVariableDeclaration(bindingPatternsMustHaveInit) {
    let startLocation = this.getLocation();
    let token = this.lex();

    // preceded by this.match(TokenSubType.VAR) || this.match(TokenSubType.LET);
    let kind = token.type === TokenType.VAR ? "var" : token.type === TokenType.CONST ? "const" : "let";
    let declarators = this.parseVariableDeclaratorList(bindingPatternsMustHaveInit);
    return this.markLocation({ type: "VariableDeclaration", kind, declarators }, startLocation);
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

    return this.markLocation({ type: "VariableDeclarator", binding, init }, startLocation);
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
        left = this.markLocation({ type: "BinaryExpression", left, operator: ",", right }, startLocation);
      }
    }
    return left;
  }

  parseArrowExpressionTail(head, startLocation) {
    let arrow = this.expect(TokenType.ARROW);

    // Convert param list.
    let {params = null, rest = null} = head;
    if (head.type !== ARROW_EXPRESSION_PARAMS) {
      if (head.type === "IdentifierExpression") {
        params = [transformDestructuring(head)];
      } else {
        throw this.createUnexpected(arrow);
      }
    }

    let paramsNode = this.markLocation({ type: "FormalParameters", items: params, rest }, startLocation);

    if (this.match(TokenType.LBRACE)) {
      let previousYield = this.allowYieldExpression;
      this.allowYieldExpression = false;
      let body = this.parseFunctionBody();
      this.allowYieldExpression = previousYield;
      return this.markLocation({ type: "ArrowExpression", params: paramsNode, body }, startLocation);
    } else {
      let body = this.parseAssignmentExpression();
      return this.markLocation({ type: "ArrowExpression", params: paramsNode, body }, startLocation);
    }
  }

  parseAssignmentExpression() {
    return this.isolateCoverGrammar(this.parseAssignmentExpressionOrBindingElement);
  }

  parseAssignmentExpressionOrBindingElement() {
    let startLocation = this.getLocation();

    if (this.allowYieldExpression && !this.inGeneratorParameter && this.match(TokenType.YIELD)) {
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
        isAssignmentOperator = true;
        break;
    }
    if (isAssignmentOperator) {
      if (!this.isAssignmentTarget || !isValidSimpleAssignmentTarget(expr)) {
        throw this.createError(ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
      }
      expr = transformDestructuring(expr);
    } else if (operator.type === TokenType.ASSIGN) {
      if (!this.isAssignmentTarget) {
        throw this.createError(ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
      }
      expr = transformDestructuring(expr);
    } else {
      return expr;
    }

    this.lex();
    let previousInGeneratorParameter = this.inGeneratorParameter;
    this.inGeneratorParameter = false;
    let rhs = this.parseAssignmentExpression();

    this.inGeneratorParameter = previousInGeneratorParameter;
    this.firstExprError = null;
    return this.markLocation(
      operator.type === TokenType.ASSIGN
        ? { type: "AssignmentExpression", binding: expr, expression: rhs }
        : { type: "CompoundAssignmentExpression", binding: expr, operator: operator.type.name, expression: rhs }
    , startLocation
    );
  }

  lookaheadAssignmentExpression() {
    switch (this.lookahead.type) {
      case TokenType.ADD:
      case TokenType.ASSIGN_DIV:
      case TokenType.CLASS:
      case TokenType.DEC:
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
      case TokenType.THIS:
      case TokenType.TRUE:
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
      return this.markLocation({ type: "YieldExpression", expression: null }, startLocation);
    }
    let isGenerator = !!this.eat(TokenType.MUL);
    let expr = null;
    if (isGenerator || this.lookaheadAssignmentExpression()) {
      expr = this.parseAssignmentExpression();
    }
    let type = isGenerator ? "YieldGeneratorExpression" : "YieldExpression";
    return this.markLocation({type, expression: expr}, startLocation);
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
      return this.markLocation({ type: "ConditionalExpression", test, consequent, alternate }, startLocation);
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
    let left = this.parseUnaryExpression();
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
    let right = this.isolateCoverGrammar(this.parseUnaryExpression);
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
        right = this.markLocation({ type: "BinaryExpression", left, operator: stackOperator.name, right }, startLocation);
      }

      this.lex();
      stack.push({startLocation, left: right, operator, precedence});

      startLocation = this.getLocation();
      right = this.isolateCoverGrammar(this.parseUnaryExpression);
      operator = this.lookahead.type;
    }

    // Final reduce to clean-up the stack.
    return stack.reduceRight((expr, stackItem) =>
        this.markLocation({
          type: "BinaryExpression",
          left: stackItem.left,
          operator: stackItem.operator.name,
          right: expr,
        }, stackItem.startLocation),
      right);
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
    let operand = this.isolateCoverGrammar(this.parseUnaryExpression);

    let node;
    if (isUpdateOperator(operator)) {
      if (operand.type === "IdentifierExpression") {
        operand.type = "BindingIdentifier";
      }
      node = { type: "UpdateExpression", isPrefix: true, operator: operator.value, operand: operand };
    } else {
      node = { type: "UnaryExpression", operator: operator.value, operand: operand };
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
    if (operand.type === "IdentifierExpression") {
      operand.type = "BindingIdentifier";
    }

    return this.markLocation({ type: "UpdateExpression", isPrefix: false, operator: operator.value, operand }, startLocation);
  }

  parseLeftHandSideExpression({allowCall}) {
    let startLocation = this.getLocation();
    let previousAllowIn = this.allowIn;
    this.allowIn = allowCall;

    let expr, token = this.lookahead;

    if (this.eat(TokenType.SUPER)) {
      this.isBindingElement = false;
      this.isAssignmentTarget = false;
      expr = this.markLocation({ type: "Super" }, startLocation);
      if (this.match(TokenType.LPAREN)) {
        if (allowCall) {
          expr = this.markLocation({
            type: "CallExpression",
            callee: expr,
            arguments: this.parseArgumentList(),
          }, startLocation);
        } else {
          throw this.createUnexpected(token);
        }
      } else if (this.match(TokenType.LBRACK)) {
        expr = this.markLocation({
          type: "ComputedMemberExpression",
          object: expr,
          expression: this.parseComputedMember(),
        }, startLocation);
        this.isAssignmentTarget = true;
      } else if (this.match(TokenType.PERIOD)) {
        expr = this.markLocation({
          type: "StaticMemberExpression",
          object: expr,
          property: this.parseStaticMember(),
        }, startLocation);
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
        expr = this.markLocation({
          type: "CallExpression",
          callee: expr,
          arguments: this.parseArgumentList(),
        }, startLocation);
      } else if (this.match(TokenType.LBRACK)) {
        this.isBindingElement = false;
        this.isAssignmentTarget = true;
        expr = this.markLocation({
          type: "ComputedMemberExpression",
          object: expr,
          expression: this.parseComputedMember(),
        }, startLocation);
      } else if (this.match(TokenType.PERIOD)) {
        this.isBindingElement = false;
        this.isAssignmentTarget = true;
        expr = this.markLocation({
          type: "StaticMemberExpression",
          object: expr,
          property: this.parseStaticMember(),
        }, startLocation);
      } else if (this.match(TokenType.TEMPLATE)) {
        this.isBindingElement = this.isAssignmentTarget = false;
        expr = this.markLocation({
          type: "TemplateExpression",
          tag: expr,
          elements: this.parseTemplateElements(),
        }, startLocation);
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
      return [this.markLocation({ type: "TemplateElement", rawValue: token.slice.text.slice(1, -1) }, startLocation)];
    }
    let result = [
      this.markLocation({ type: "TemplateElement", rawValue: this.lex().slice.text.slice(1, -2) }, startLocation),
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
        result.push(this.markLocation({ type: "TemplateElement", rawValue: token.slice.text.slice(1, -1) }, startLocation));
        return result;
      } else {
        result.push(this.markLocation({ type: "TemplateElement", rawValue: token.slice.text.slice(1, -2) }, startLocation));
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
      return this.markLocation({ type: "NewTargetExpression" }, startLocation);
    }
    let callee = this.isolateCoverGrammar(() => this.parseLeftHandSideExpression({ allowCall: false }));
    return this.markLocation({
      type: "NewExpression",
      callee,
      arguments: this.match(TokenType.LPAREN) ? this.parseArgumentList() : [],
    }, startLocation);
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
        return this.markLocation({ type: "IdentifierExpression", name: this.parseIdentifier() }, startLocation);
      case TokenType.STRING:
        this.isBindingElement = this.isAssignmentTarget = false;
        return this.parseStringLiteral();
      case TokenType.NUMBER:
        this.isBindingElement = this.isAssignmentTarget = false;
        return this.parseNumericLiteral();
      case TokenType.THIS:
        this.lex();
        this.isBindingElement = this.isAssignmentTarget = false;
        return this.markLocation({ type: "ThisExpression" }, startLocation);
      case TokenType.FUNCTION:
        this.isBindingElement = this.isAssignmentTarget = false;
        return this.markLocation(this.parseFunction({isExpr: true, inDefault: false, allowGenerator: true}), startLocation);
      case TokenType.TRUE:
        this.lex();
        this.isBindingElement = this.isAssignmentTarget = false;
        return this.markLocation({ type: "LiteralBooleanExpression", value: true }, startLocation);
      case TokenType.FALSE:
        this.lex();
        this.isBindingElement = this.isAssignmentTarget = false;
        return this.markLocation({ type: "LiteralBooleanExpression", value: false }, startLocation);
      case TokenType.NULL:
        this.lex();
        this.isBindingElement = this.isAssignmentTarget = false;
        return this.markLocation({ type: "LiteralNullExpression" }, startLocation);
      case TokenType.LBRACK:
        return this.parseArrayExpression();
      case TokenType.LBRACE:
        return this.parseObjectExpression();
      case TokenType.TEMPLATE:
        this.isBindingElement = this.isAssignmentTarget = false;
        return this.markLocation({ type: "TemplateExpression", tag: null, elements: this.parseTemplateElements() }, startLocation);
      case TokenType.DIV:
      case TokenType.ASSIGN_DIV:
        this.isBindingElement = this.isAssignmentTarget = false;
        this.lookahead = this.scanRegExp(this.match(TokenType.DIV) ? "/" : "/=");
        let token = this.lex();
        let lastSlash = token.value.lastIndexOf("/");
        let pattern = token.value.slice(1, lastSlash);
        let flags = token.value.slice(lastSlash + 1);
        return this.markLocation({ type: "LiteralRegExpExpression", pattern, flags }, startLocation);
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
    let node = token.value === 1 / 0
      ? { type: "LiteralInfinityExpression" }
      : { type: "LiteralNumericExpression", value: token.value };
    return this.markLocation(node, startLocation);
  }

  parseStringLiteral() {
    let startLocation = this.getLocation();
    return this.markLocation({ type: "LiteralStringExpression", value: this.lex().str }, startLocation);
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
    return this.markLocation({ type: "BindingIdentifier", name: this.parseIdentifier() }, startLocation);
  }

  parseIdentifier() {
    if (this.match(TokenType.IDENTIFIER) || !this.allowYieldExpression && this.match(TokenType.YIELD) || this.match(TokenType.LET)) {
      return this.lex().value;
    } else {
      throw this.createUnexpected(this.lookahead);
    }
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
        arg = this.markLocation({ type: "SpreadElement", expression: this.parseAssignmentExpression() }, startLocation);
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
      rest = this.parseBindingIdentifier();
      this.expect(TokenType.RPAREN);
      this.ensureArrow();
      this.isBindingElement = this.isAssignmentTarget = false;
      return {
        type: ARROW_EXPRESSION_PARAMS,
        params: [],
        rest: rest,
      };
    }


    let startLocation = this.getLocation();
    let group = this.inheritCoverGrammar(this.parseAssignmentExpressionOrBindingElement);

    let params = this.isBindingElement ? [group] : null;

    while (this.eat(TokenType.COMMA)) {
      this.isAssignmentTarget = false;
      if (this.match(TokenType.ELLIPSIS)) {
        if (!this.isBindingElement) {
          throw this.createUnexpected(this.lookahead);
        }
        this.lex();
        rest = this.parseBindingIdentifier();
        break;
      }

      if (!group) {
        // Can be only binding elements.
        let binding = this.parseBindingElement();
        params.push(binding);
      } else {
        // Can be either binding element or assignment target.
        let expr = this.inheritCoverGrammar(this.parseAssignmentExpressionOrBindingElement);
        if (!this.isBindingElement) {
          params = null;
        } else {
          params.push(expr);
        }

        if (this.firstExprError) {
          group = null;
        } else {
          group = this.markLocation({
            type: "BinaryExpression",
            left: group,
            operator: ",",
            right: expr,
          }, startLocation);
        }
      }
    }

    this.expect(TokenType.RPAREN);

    if (!this.hasLineTerminatorBeforeNext && this.match(TokenType.ARROW)) {
      if (!this.isBindingElement) {
        throw this.createErrorWithLocation(start, ErrorMessages.ILLEGAL_ARROW_FUNCTION_PARAMS);
      }

      params = params.map(transformDestructuring);

      this.isBindingElement = false;
      return { type: ARROW_EXPRESSION_PARAMS, params, rest };
    } else {
      // Ensure assignment pattern:
      if (rest) {
        this.ensureArrow();
      }
      this.isBindingElement = false;
      return group;
    }
  }

  parseArrayExpression() {
    let startLocation = this.getLocation();

    this.lex();

    let exprs = [];

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
          expr = this.inheritCoverGrammar(this.parseAssignmentExpressionOrBindingElement);
          if (!this.isAssignmentTarget && this.firstExprError) {
            throw this.firstExprError;
          }
          expr = this.markLocation({ type: "SpreadElement", expression: expr }, elementLocation);
          if (!this.match(TokenType.RBRACK)) {
            this.isBindingElement = this.isAssignmentTarget = false;
          }
        } else {
          expr = this.inheritCoverGrammar(this.parseAssignmentExpressionOrBindingElement);
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

    this.expect(TokenType.RBRACK);

    return this.markLocation({ type: "ArrayExpression", elements: exprs }, startLocation);
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
    return this.markLocation({ type: "ObjectExpression", properties }, startLocation);
  }

  parsePropertyDefinition() {
    let startLocation = this.getLocation();
    let token = this.lookahead;

    let {methodOrKey, kind} = this.parseMethodDefinition();
    switch (kind) {
      case "method":
        this.isBindingElement = this.isAssignmentTarget = false;
        return methodOrKey;
      case "identifier": // IdentifierReference,
        if (this.eat(TokenType.ASSIGN)) {
          // CoverInitializedName
          let init = this.isolateCoverGrammar(this.parseAssignmentExpression);
          this.firstExprError = this.createErrorWithLocation(startLocation, ErrorMessages.ILLEGAL_PROPERTY);
          return this.markLocation({
            type: "BindingPropertyIdentifier",
            binding: transformDestructuring(methodOrKey),
            init,
          }, startLocation);
        } else if (!this.match(TokenType.COLON)) {
          if (token.type !== TokenType.IDENTIFIER && token.type !== TokenType.YIELD && token.type !== TokenType.LET) {
            throw this.createUnexpected(token);
          }
          return this.markLocation({ type: "ShorthandProperty", name: methodOrKey.value }, startLocation);
        }
    }

    // DataProperty
    this.expect(TokenType.COLON);

    let expr = this.inheritCoverGrammar(this.parseAssignmentExpressionOrBindingElement);
    return this.markLocation({ type: "DataProperty", name: methodOrKey, expression: expr }, startLocation);
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
          name: this.markLocation({
            type: "StaticPropertyName",
            value: this.parseStringLiteral().value,
          }, startLocation),
          binding: null,
        };
      case TokenType.NUMBER:
        let numLiteral = this.parseNumericLiteral();
        return {
          name: this.markLocation({
            type: "StaticPropertyName",
            value: `${numLiteral.type === "LiteralInfinityExpression" ? 1 / 0 : numLiteral.value}`,
          }, startLocation),
          binding: null,
        };
      case TokenType.LBRACK:
        let previousYield = this.allowYieldExpression;
        if (this.inGeneratorParameter) {
          this.allowYieldExpression = false;
        }
        this.lex();
        let expr = this.parseAssignmentExpression();
        this.expect(TokenType.RBRACK);
        this.allowYieldExpression = previousYield;
        return { name: this.markLocation({ type: "ComputedPropertyName", expression: expr }, startLocation), binding: null };
    }

    let name = this.parseIdentifierName();
    return {
      name: this.markLocation({ type: "StaticPropertyName", value: name }, startLocation),
      binding: this.markLocation({ type: "BindingIdentifier", name }, startLocation),
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
          let body = this.parseFunctionBody();
          return {
            methodOrKey: this.markLocation({ type: "Getter", name, body }, startLocation),
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
            methodOrKey: this.markLocation({ type: "Setter", name, param, body }, startLocation),
            kind: "method",
          };
        }
      }
    }

    if (this.match(TokenType.LPAREN)) {
      let previousYield = this.allowYieldExpression;
      let previousInGeneratorParameter = this.inGeneratorParameter;
      this.inGeneratorParameter = isGenerator;
      this.allowYieldExpression = isGenerator;
      let params = this.parseParams();
      this.inGeneratorParameter = previousInGeneratorParameter;
      this.allowYieldExpression = previousYield;
      this.allowYieldExpression = isGenerator;

      let body = this.parseFunctionBody();
      this.allowYieldExpression = previousYield;

      return {
        methodOrKey: this.markLocation({ type: "Method", isGenerator, name, params, body }, startLocation),
        kind: "method",
      };
    }

    if (isGenerator && this.match(TokenType.COLON)) {
      throw this.createUnexpected(this.lookahead);
    }

    return {
      methodOrKey: name,
      kind: token.type.klass.isIdentifierName ? "identifier" : "property",
      binding: binding,
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
        name = this.markLocation({ type: "BindingIdentifier", name: "*default*" }, startLocation);
      } else {
        throw this.createUnexpected(this.lookahead);
      }
    }

    let previousInGeneratorParameter = this.inGeneratorParameter;
    let previousParamYield = this.allowYieldExpression;
    if (isExpr) {
      this.inGeneratorParameter = false;
      this.allowYieldExpression = false;
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
        elements.push(copyLocation(methodOrKey, { type: "ClassElement", isStatic, method: methodOrKey }));
      } else {
        throw this.createError("Only methods are allowed in classes");
      }
    }
    this.allowYieldExpression = previousParamYield;
    this.inGeneratorParameter = previousInGeneratorParameter;
    return this.markLocation({ type: isExpr ? "ClassExpression" : "ClassDeclaration", name, super: heritage, elements }, startLocation);
  }

  parseFunction({isExpr, inDefault, allowGenerator}) {
    let startLocation = this.getLocation();

    this.lex();

    let name = null;
    let isGenerator = allowGenerator && !!this.eat(TokenType.MUL);

    let previousGeneratorParameter = this.inGeneratorParameter;
    let previousYield = this.allowYieldExpression;

    if (!this.match(TokenType.LPAREN)) {
      name = this.parseBindingIdentifier();
    } else if (!isExpr) {
      if (inDefault) {
        name = this.markLocation({type: "BindingIdentifier", name: "*default*" }, startLocation);
      } else {
        throw this.createUnexpected(this.lookahead);
      }
    }

    this.inGeneratorParameter = isGenerator;
    this.allowYieldExpression = isGenerator;

    let params = this.parseParams();

    this.inGeneratorParameter = previousGeneratorParameter;
    this.allowYieldExpression = isGenerator;

    let body = this.parseFunctionBody();

    this.allowYieldExpression = previousYield;
    this.inGeneratorParameter = previousGeneratorParameter;

    let type = isExpr ? "FunctionExpression" : "FunctionDeclaration";
    return this.markLocation({ type, isGenerator, name, params, body }, startLocation);
  }

  parseArrayBinding() {
    let startLocation = this.getLocation();

    this.expect(TokenType.LBRACK);

    let elements = [], restElement = null;

    while (true) {
      if (this.match(TokenType.RBRACK)) {
        break;
      }
      let el;

      if (this.eat(TokenType.COMMA)) {
        el = null;
      } else {
        if (this.eat(TokenType.ELLIPSIS)) {
          restElement = this.parseBindingIdentifier();
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

    return this.markLocation({ type: "ArrayBinding", elements, restElement }, startLocation);
  }

  parseBindingProperty() {
    let startLocation = this.getLocation();
    let token = this.lookahead;
    let {name, binding} = this.parsePropertyName();
    if ((token.type === TokenType.IDENTIFIER || token.type === TokenType.YIELD) && name.type === "StaticPropertyName") {
      if (!this.match(TokenType.COLON)) {
        let defaultValue = null;
        if (this.eat(TokenType.ASSIGN)) {
          let previousAllowYieldExpression = this.allowYieldExpression;
          if (this.inGeneratorParameter) {
            this.allowYieldExpression = false;
          }
          let expr = this.parseAssignmentExpression();
          defaultValue = expr;
          this.allowYieldExpression = previousAllowYieldExpression;
        }
        return this.markLocation({
          type: "BindingPropertyIdentifier",
          binding: binding,
          init: defaultValue,
        }, startLocation);
      }
    }
    this.expect(TokenType.COLON);
    binding = this.parseBindingElement();
    return this.markLocation({ type: "BindingPropertyProperty", name, binding }, startLocation);
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

    return this.markLocation({ type: "ObjectBinding", properties }, startLocation);
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
      let previousInGeneratorParameter = this.inGeneratorParameter;
      let previousYieldExpression = this.allowYieldExpression;
      if (this.inGeneratorParameter) {
        this.allowYieldExpression = false;
      }
      this.inGeneratorParameter = false;
      let init = this.parseAssignmentExpression();
      binding = this.markLocation({ type: "BindingWithDefault", binding, init }, startLocation);
      this.inGeneratorParameter = previousInGeneratorParameter;
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
          rest = this.parseBindingIdentifier();
          break;
        }
        items.push(this.parseParam());
        if (this.match(TokenType.RPAREN)) break;
        this.expect(TokenType.COMMA);
      }
    }

    this.expect(TokenType.RPAREN);

    return this.markLocation({ type: "FormalParameters", items, rest }, paramsLocation);
  }
}
