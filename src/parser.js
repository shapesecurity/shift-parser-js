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

import * as Shift from "shift-ast";

import {isRestrictedWord, isStrictModeReservedWordES5} from "./utils";

import {ErrorMessages} from "./errors";

import Tokenizer, { TokenClass, TokenType } from "./tokenizer";

// Empty parameter list for ArrowExpression
const ARROW_EXPRESSION_PARAMS = "CoverParenthesizedExpressionAndArrowParameterList";

const STRICT_MODE_RESERVED_WORD = {
  "implements": null, "interface": null, "package": null, "private": null, "protected": null,
  "public": null, "static": null, "yield": null, "let": null
};

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
  Primary: 19
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

const FOR_OF_VAR = {};

function copyLocation(from, to) {
  if ("loc" in from) {
    to.loc = from.loc;
  }
  return to;
}

/**
 *
 * @param {[string]} strings
 * @returns {string?}
 */
function firstDuplicate(strings) {
  if (strings.length < 2) return null;
  let map = {};
  for (let cursor = 0; cursor < strings.length; cursor++) {
    let id = "$" + strings[cursor];
    if (map.hasOwnProperty(id)) {
      return strings[cursor];
    }
    map[id] = true;
  }
  return null;
}

function hasStrictModeReservedWord(ids) {
  return ids.some(id => STRICT_MODE_RESERVED_WORD.hasOwnProperty(id));
}

export class Parser extends Tokenizer {
  constructor(source) {
    super(source);
    this.labelSet = Object.create(null);
    this.LDN = [];
    this.VDN = Object.create(null);
    this.allowIn = true;
    this.inIteration = false;
    this.inSwitch = false;
    this.inFunctionBody = false;
    this.inMethod = false;
    this.inConstructor = false;
    this.hasClassHeritage = false;
    this.inGeneratorParameter = false;
    this.inParameter = false;
    this.inGeneratorBody = false;
    this.allowYieldExpression = false;
    this.allowLabeledFunction = true;
    this.module = false;
    this.strict = false;
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
    if (this.matchContextualKeyword(keyword)) {
      return this.lex();
    } else {
      throw this.createUnexpected(this.lookahead);
    }
  }

  eatContextualKeyword(keyword) {
    if (this.matchContextualKeyword(keyword)) {
      return this.lex();
    }
  }

  match(subType) {
    return this.lookahead.type === subType;
  }

  consumeSemicolon() {
    if (this.hasLineTerminatorBeforeNext) {
      return;
    }

    if (this.eat(TokenType.SEMICOLON)) {
      return;
    }

    if (!this.eof() && !this.match(TokenType.RBRACE)) {
      throw this.createUnexpected(this.lookahead);
    }
  }

  // this is a no-op, reserved for future use
  markLocation(node, startLocation) {
    return node;
  }

  wrapVDN(f, post) {
    let originalVDN = this.VDN;
    this.VDN = Object.create(null);
    let result = f.call(this);
    if (post) post.call(this);

    for (let key in this.VDN) {
      originalVDN[key] = this.VDN[key];
    }
    this.VDN = originalVDN;
    return result;
  }

  checkBlockScope() {
    let duplicate = firstDuplicate(this.LDN);
    if (duplicate !== null) {
      throw this.createError(ErrorMessages.DUPLICATE_BINDING, duplicate);
    }
    this.LDN.forEach(name => {
      if ({}.hasOwnProperty.call(this.VDN, "$" + name)) {
        throw this.createError(ErrorMessages.DUPLICATE_BINDING, name);
      }
    });
  }

  parseModule() {
    this.module = true;
    this.strict = true;

    this.lookahead = this.advance();
    let location = this.getLocation();
    let exportedNames = Object.create(null);
    let exportedBindings = Object.create(null);
    let items = [];
    while (!this.eof()) {
      items.push(this.parseModuleItem(exportedNames, exportedBindings));
    }
    for (let key in exportedBindings) {
      if (!{}.hasOwnProperty.call(this.VDN, key) && this.LDN.indexOf(key.slice(1)) === -1) {
        throw this.createError(ErrorMessages.MODULE_EXPORT_UNDEFINED, key.slice(1));
      }
    }
    this.checkBlockScope();
    return this.markLocation(new Shift.Module(items), location);
  }

  parseScript() {
    this.lookahead = this.advance();

    let location = this.getLocation();
    let originalLDN = this.LDN;
    this.LDN = [];

    let [body] = this.parseBody();
    if (!this.match(TokenType.EOS)) {
      throw this.createUnexpected(this.lookahead);
    }
    this.checkBlockScope();
    this.LDN = originalLDN;
    return this.markLocation(new Shift.Script(body), location);
  }

  parseFunctionBody(boundParams) {
    let startLocation = this.getLocation();

    let oldVDN = this.VDN;
    this.VDN = Object.create(null);

    let originalLDN = this.LDN;
    this.LDN = [];

    boundParams.forEach(name => this.VDN["$" + name] = true);

    let oldLabelSet = this.labelSet;
    let oldInIteration = this.inIteration;
    let oldInSwitch = this.inSwitch;
    let oldInFunctionBody = this.inFunctionBody;
    let previousStrict = this.strict;
    let oldModule = this.module;

    this.labelSet = Object.create(null);
    this.inIteration = false;
    this.inSwitch = false;
    this.inFunctionBody = true;
    this.module = false;

    this.expect(TokenType.LBRACE);
    let [body, isStrict] = this.parseBody();
    this.expect(TokenType.RBRACE);

    this.checkBlockScope();

    this.VDN = oldVDN;
    this.LDN = originalLDN;

    body = this.markLocation(body, startLocation);

    this.labelSet = oldLabelSet;
    this.inIteration = oldInIteration;
    this.inSwitch = oldInSwitch;
    this.inFunctionBody = oldInFunctionBody;
    this.strict = previousStrict;
    this.module = oldModule;
    return [body, isStrict];
  }

  parseBody() {
    let location = this.getLocation();
    let directives = [];
    let statements = [];
    let parsingDirectives = true;
    let isStrict = this.strict;
    let firstRestricted = null;
    this.wrapVDN(() => {
      while (true) {
        if (this.eof() || this.match(TokenType.RBRACE)) {
          break;
        }
        let token = this.lookahead;
        let text = token.slice.text;
        let isStringLiteral = token.type === TokenType.STRING;
        let directiveLocation = this.getLocation();
        let stmt = this.parseStatementListItem({isTopLevel: true});
        if (parsingDirectives) {
          if (isStringLiteral && stmt.type === "ExpressionStatement" &&
            stmt.expression.type === "LiteralStringExpression") {
            if (text === "\"use strict\"" || text === "'use strict'") {
              isStrict = true;
              this.strict = true;
              if (firstRestricted != null) {
                throw this.createErrorWithLocation(firstRestricted, ErrorMessages.STRICT_OCTAL_LITERAL);
              }
            } else if (firstRestricted == null && token.octal) {
              firstRestricted = token;
            }
            directives.push(this.markLocation(new Shift.Directive(text.slice(1, -1)), directiveLocation));
          } else {
            parsingDirectives = false;
            statements.push(stmt);
          }
        } else {
          statements.push(stmt);
        }
      }
    }, () => {

    });
    return [this.markLocation(new Shift.FunctionBody(directives, statements), location), isStrict];
  }

  parseImportSpecifier(boundNames) {
    let startLocation = this.getLocation(), identifier;
    if (this.lookahead.type === TokenType.IDENTIFIER) {
      identifier = this.parseIdentifier();
      if (!this.eatContextualKeyword("as")) {
        if ({}.hasOwnProperty.call(boundNames, "$" + identifier)) {
          throw this.createErrorWithLocation(startLocation, ErrorMessages.IMPORT_DUPE);
        }
        boundNames["$" + identifier] = true;
        return this.markLocation(
          new Shift.ImportSpecifier(
            null,
            this.markLocation({ type: "BindingIdentifier", name: identifier }, startLocation)), startLocation);
      }
    } else if (this.lookahead.type.klass.isIdentifierName) {
      identifier = this.parseIdentifierName();
      this.expectContextualKeyword("as");
    }

    let location = this.getLocation();
    let boundName = this.parseIdentifier();
    if ({}.hasOwnProperty.call(boundNames, "$" + boundName)) {
      throw this.createErrorWithLocation(location, ErrorMessages.IMPORT_DUPE);
    }
    boundNames["$" + boundName] = true;
    return this.markLocation(
      new Shift.ImportSpecifier(
        identifier,
        this.markLocation({ type: "BindingIdentifier", name: boundName }, location)),
      startLocation);
  }

  parseNameSpaceBinding(boundNames) {
    let startLocation = this.getLocation();
    this.expect(TokenType.MUL);
    this.expectContextualKeyword("as");
    let identifierLocation = this.getLocation();
    let identifier = this.parseIdentifier();
    if ({}.hasOwnProperty.call(boundNames, "$" + identifier)) {
      throw this.createErrorWithLocation(identifierLocation, ErrorMessages.IMPORT_DUPE);
    }
    boundNames["$" + identifier] = true;
    return this.markLocation({ type: "BindingIdentifier", name: identifier }, startLocation);
  }

  parseNamedImports(boundNames) {
    let result = [];
    this.expect(TokenType.LBRACE);
    while (!this.eat(TokenType.RBRACE)) {
      result.push(this.parseImportSpecifier(boundNames));
      if (!this.eat(TokenType.COMMA)) {
        this.expect(TokenType.RBRACE);
        break;
      }
    }
    return result;
  }

  parseFromClause() {
    this.expectContextualKeyword("from");
    let value = this.expect(TokenType.STRING)._value;
    this.consumeSemicolon();
    return value;
  }

  parseImportDeclaration() {
    let startLocation = this.getLocation(), defaultBinding = null, moduleSpecifier, boundNames = Object.create(null);
    this.expect(TokenType.IMPORT);
    switch (this.lookahead.type) {
      case TokenType.STRING:
        moduleSpecifier = this.lex()._value;
        this.consumeSemicolon();
        return this.markLocation(new Shift.Import(null, [], moduleSpecifier), startLocation);
      case TokenType.IDENTIFIER:
        defaultBinding = this.expect(TokenType.IDENTIFIER).value;
        boundNames["$" + defaultBinding] = true;
        if (!this.eat(TokenType.COMMA)) {
          return this.markLocation(new Shift.Import(defaultBinding, [], this.parseFromClause()), startLocation);
        }
        break;
    }
    if (this.match(TokenType.MUL)) {
      return this.markLocation(new Shift.ImportNamespace(defaultBinding, this.parseNameSpaceBinding(boundNames), this.parseFromClause()), startLocation);
    } else if (this.match(TokenType.LBRACE)) {
      return this.markLocation(new Shift.Import(defaultBinding, this.parseNamedImports(boundNames), this.parseFromClause()), startLocation);
    } else {
      throw this.createUnexpected(this.lookahead);
    }
  }

  parseExportSpecifier(exportedNames, exportedBindings) {
    let startLocation = this.getLocation();
    let name = this.parseIdentifier();
    exportedBindings["$" + name] = true;
    if (this.eatContextualKeyword("as")) {
      let exportedName = this.parseIdentifierName();
      if ({}.hasOwnProperty.call(exportedNames, "$" + exportedName)) {
        throw this.createError(ErrorMessages.DUPLICATE_EXPORTED_NAME, exportedName);
      }
      exportedNames["$" + exportedName] = true;
      return this.markLocation(new Shift.ExportSpecifier(name, exportedName), startLocation);
    } else {
      if ({}.hasOwnProperty.call(exportedNames, "$" + name)) {
        throw this.createError(ErrorMessages.DUPLICATE_EXPORTED_NAME, name);
      }
      exportedNames["$" + name] = true;
    }
    return this.markLocation(new Shift.ExportSpecifier(null, name), startLocation);
  }

  parseExportClause(exportedNames, exportedBindings) {
    let result = [];
    this.expect(TokenType.LBRACE);
    while (!this.eat(TokenType.RBRACE)) {
      result.push(this.parseExportSpecifier(exportedNames, exportedBindings));
      if (!this.eat(TokenType.COMMA)) {
        this.expect(TokenType.RBRACE);
        break;
      }
    }
    return result;
  }

  parseExportDeclaration(exportedNames, exportedBindings) {
    let startLocation = this.getLocation(), decl;
    this.expect(TokenType.EXPORT);
    let isVar = false, key, oldLDN = this.LDN, oldVDN = this.VDN;
    this.LDN = [];
    this.VDN = Object.create(null);
    switch (this.lookahead.type) {
      case TokenType.MUL:
        this.lex();
        // export * FromClause ;
        decl = new Shift.ExportAllFrom(this.parseFromClause());
        break;
      case TokenType.LBRACE:
        // export ExportClause FromClause ;
        // export ExportClause ;
        let namedExports = this.parseExportClause(exportedNames, exportedBindings);
        let fromClause = null;
        if (this.matchContextualKeyword("from")) {
          fromClause = this.parseFromClause();
        }
        decl = new Shift.ExportFrom(namedExports, fromClause);
        break;
      case TokenType.CLASS:
        // export ClassDeclaration
        decl = new Shift.Export(this.parseClass({isExpr: false}));
        if ({}.hasOwnProperty.call(exportedNames, "$" + decl.declaration.name.name)) {
          throw this.createError(ErrorMessages.DUPLICATE_EXPORTED_NAME, decl.declaration.name.name);
        }
        key = decl.declaration.name.name;
        exportedNames["$" + key] = true;
        exportedBindings["$" + key] = true;
        oldLDN.push(key);
        break;
      case TokenType.FUNCTION:
        // export HoistableDeclaration
        decl = new Shift.Export(this.parseFunction({isExpr: false, isTopLevel: true}));
        if ({}.hasOwnProperty.call(exportedNames, "$" + decl.declaration.name.name)) {
          throw this.createError(ErrorMessages.DUPLICATE_EXPORTED_NAME, decl.declaration.name.name);
        }
        key = decl.declaration.name.name;
        exportedNames["$" + key] = true;
        exportedBindings["$" + key] = true;
        oldLDN.push(key);
        break;
      case TokenType.DEFAULT:
        if ({}.hasOwnProperty.call(exportedNames, "$default")) {
          throw this.createError(ErrorMessages.DUPLICATE_EXPORTED_NAME, "default");
        }
        exportedNames.$default = true;
        this.lex();
        switch (this.lookahead.type) {
          case TokenType.FUNCTION:
            // export default HoistableDeclaration[Default]
            decl = new Shift.ExportDefault(this.parseFunction({isExpr: false, inDefault: true, isTopLevel: true}));
            key = decl.body.name.name;
            if (key !== "*default*") {
              exportedBindings["$" + key] = true;
              oldLDN.push(key);
            }
            break;
          case TokenType.CLASS:
            // export default ClassDeclaration[Default]
            decl = new Shift.ExportDefault(this.parseClass({isExpr: false, inDefault: true}));
            key = decl.body.name.name;
            if (key !== "*default*") {
              exportedBindings["$" + key] = true;
              oldLDN.push(key);
            }
            break;
          default:
          {
            // export default [lookahead ∉ {function, class}] AssignmentExpression[In] ;
            decl = new Shift.ExportDefault(this.parseAssignmentExpression());
            break;
          }
        }
        break;
      case TokenType.VAR:
        isVar = true;
        // falls through
      case TokenType.LET:
      case TokenType.CONST:
        // export LexicalDeclaration
      {
        let boundNames = [];
        decl = new Shift.Export(this.parseVariableDeclaration({boundNames}));
        boundNames.forEach(name => {
            if ({}.hasOwnProperty.call(exportedNames, "$" + name)) {
              throw this.createError(ErrorMessages.DUPLICATE_EXPORTED_NAME, name);
            }
            exportedNames["$" + name] = true;
            exportedBindings["$" + name] = true;
          }
        );
        if (isVar) {
          boundNames.forEach(name => oldVDN["$" + name] = true);
        } else {
          [].push.apply(oldLDN, boundNames);
        }
        this.consumeSemicolon();
      }
        break;
      default:
        throw this.createUnexpected(this.lookahead);
    }
    this.LDN = oldLDN;
    this.VDN = oldVDN;
    return this.markLocation(decl, startLocation);
  }

  parseModuleItem(exportedNames, exportedBindings) {
    switch (this.lookahead.type) {
      case TokenType.IMPORT:
        return this.parseImportDeclaration();
      case TokenType.EXPORT:
        return this.parseExportDeclaration(exportedNames, exportedBindings);
      default:
        return this.parseStatementListItem();
    }
  }

  lookaheadLexicalDeclaration() {
    if (this.match(TokenType.LET) || this.match(TokenType.CONST)) {
      return true;
    }
    if (this.match(TokenType.IDENTIFIER) && this.lookahead.value === "let") {
      let lexerState = this.saveLexerState();
      this.lex();
      if (this.match(TokenType.YIELD) || this.match(TokenType.IDENTIFIER) ||
        this.match(TokenType.LBRACE) || this.match(TokenType.LBRACK)) {
        this.restoreLexerState(lexerState);
        return true;
      } else {
        this.restoreLexerState(lexerState);
      }
    }
    return false;
  }

  parseStatementListItem({isTopLevel = false} = {}) {
    let startLocation = this.getLocation();
    if (this.eof()) {
      throw this.createUnexpected(this.lookahead);
    }

    let decl = this.wrapVDN(() => {
      switch (this.lookahead.type) {
        case TokenType.FUNCTION:
          return this.parseFunction({isExpr: false, isTopLevel});
        case TokenType.CLASS:
          return this.parseClass({isExpr: false});
        default:
          if (this.lookaheadLexicalDeclaration()) {
            return this.parseVariableDeclarationStatement();
          }
          return this.parseStatement({allowLabeledFunction: true, isTopLevel});
      }
    }, this.checkBlockScope);
    return this.markLocation(decl, startLocation);
  }

  parseStatement({allowLabeledFunction = false, isTopLevel = false} = {}) {
    let startLocation = this.getLocation();
    let originalLDN = this.LDN;
    this.LDN = [];
    var stmt = this.wrapVDN(() => this.parseStatementHelper(allowLabeledFunction, originalLDN, isTopLevel));
    this.LDN = originalLDN;
    return this.markLocation(stmt, startLocation);
  }

  parseStatementHelper(allowLabeledFunction, originalLDN, isTopLevel) {
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
          let key = "$" + expr.name;
          if ({}.hasOwnProperty.call(this.labelSet, key)) {
            throw this.createError(ErrorMessages.LABEL_REDECLARATION, expr.name);
          }
          this.LDN = originalLDN;
          this.labelSet[key] = true;
          let labeledBody;
          if (this.match(TokenType.FUNCTION)) {
            if (this.strict || !allowLabeledFunction) {
              throw this.createUnexpected(this.lookahead);
            }
            labeledBody = this.parseFunction({isExpr: false, allowGenerator: false, isTopLevel});
          } else {
            labeledBody = this.parseStatement({allowLabeledFunction, isTopLevel});
          }
          delete this.labelSet[key];
          return new Shift.LabeledStatement(expr.name, labeledBody);
        } else {
          this.consumeSemicolon();
          return new Shift.ExpressionStatement(expr);
        }
      }
    }
  }

  parseEmptyStatement() {
    this.expect(TokenType.SEMICOLON);
    return new Shift.EmptyStatement;
  }

  parseBlockStatement() {
    let stmt = new Shift.BlockStatement(this.parseBlock());
    this.checkBlockScope();
    return stmt;
  }

  parseExpressionStatement() {
    let expr = this.parseExpression();
    this.consumeSemicolon();
    return new Shift.ExpressionStatement(expr);
  }

  parseBreakStatement() {
    let token = this.lookahead;
    this.expect(TokenType.BREAK);

    // Catch the very common case first: immediately a semicolon (U+003B).
    if (this.eat(TokenType.SEMICOLON)) {
      if (!(this.inIteration || this.inSwitch)) {
        throw this.createErrorWithLocation(token, ErrorMessages.ILLEGAL_BREAK);
      }

      return new Shift.BreakStatement(null);
    }

    if (this.hasLineTerminatorBeforeNext) {
      if (!(this.inIteration || this.inSwitch)) {
        throw this.createErrorWithLocation(token, ErrorMessages.ILLEGAL_BREAK);
      }

      return new Shift.BreakStatement(null);
    }

    let label = null;
    if (this.lookahead.type === TokenType.IDENTIFIER) {
      label = this.parseIdentifier();

      let key = "$" + label;
      if (!{}.hasOwnProperty.call(this.labelSet, key)) {
        throw this.createError(ErrorMessages.UNKNOWN_LABEL, label);
      }
    }

    this.consumeSemicolon();

    if (label == null && !(this.inIteration || this.inSwitch)) {
      throw this.createErrorWithLocation(token, ErrorMessages.ILLEGAL_BREAK);
    }

    return new Shift.BreakStatement(label);
  }

  parseContinueStatement() {
    let token = this.lookahead;
    this.expect(TokenType.CONTINUE);

    // Catch the very common case first: immediately a semicolon (U+003B).
    if (this.eat(TokenType.SEMICOLON)) {
      if (!this.inIteration) {
        throw this.createErrorWithLocation(token, ErrorMessages.ILLEGAL_CONTINUE);
      }

      return new Shift.ContinueStatement(null);
    }

    if (this.hasLineTerminatorBeforeNext) {
      if (!this.inIteration) {
        throw this.createErrorWithLocation(token, ErrorMessages.ILLEGAL_CONTINUE);
      }

      return new Shift.ContinueStatement(null);
    }

    let label = null;
    if (this.lookahead.type === TokenType.IDENTIFIER) {
      label = this.parseIdentifier();

      let key = "$" + label;
      if (!{}.hasOwnProperty.call(this.labelSet, key)) {
        throw this.createError(ErrorMessages.UNKNOWN_LABEL, label);
      }
    }

    this.consumeSemicolon();
    if (!this.inIteration) {
      throw this.createErrorWithLocation(token, ErrorMessages.ILLEGAL_CONTINUE);
    }

    return new Shift.ContinueStatement(label);
  }


  parseDebuggerStatement() {
    this.expect(TokenType.DEBUGGER);
    this.consumeSemicolon();
    return new Shift.DebuggerStatement;
  }

  parseDoWhileStatement() {
    this.expect(TokenType.DO);
    let oldInIteration = this.inIteration;
    this.inIteration = true;
    let body = this.parseStatement();
    this.inIteration = oldInIteration;

    this.expect(TokenType.WHILE);
    this.expect(TokenType.LPAREN);
    let test = this.parseExpression();
    this.expect(TokenType.RPAREN);
    this.eat(TokenType.SEMICOLON);

    return new Shift.DoWhileStatement(body, test);
  }

  static transformDestructuring(node) {
    switch (node.type) {
      case "ObjectExpression":
        return copyLocation(node, new Shift.ObjectBinding(
          node.properties.map(Parser.transformDestructuring)
        ));
      case "DataProperty":
        return copyLocation(node, new Shift.BindingPropertyProperty(
          node.name,
          Parser.transformDestructuring(node.expression)
        ));
      case "ShorthandProperty":
        return copyLocation(node, { type: "BindingPropertyIdentifier",
          binding: copyLocation(node, { type: "BindingIdentifier", name: node.name }),
          init: null,
        });
      case "ArrayExpression":
        let last = node.elements[node.elements.length - 1];
        if (last != null && last.type === "SpreadElement") {
          return copyLocation(node, new Shift.ArrayBinding(
            node.elements.slice(0, -1).map(e => e && Parser.transformDestructuring(e)),
            copyLocation(last.expression, Parser.transformDestructuring(last.expression))
          ));
        } else {
          return copyLocation(node, new Shift.ArrayBinding(
            node.elements.map(e => e && Parser.transformDestructuring(e)),
            null
          ));
        }
      case "AssignmentExpression":
        return copyLocation(node, new Shift.BindingWithDefault(
          Parser.transformDestructuring(node.binding),
          node.expression
        ));
      case "IdentifierExpression":
        return copyLocation(node, { type: "BindingIdentifier", name: node.name });
      case "ComputedMemberExpression":
      case "StaticMemberExpression":
        return node;
      case "ArrayBinding":
      case "BindingIdentifier":
      case "BindingPropertyIdentifier":
      case "BindingPropertyProperty":
      case "BindingWithDefault":
      case "ObjectBinding":
        return node;
    }
  }

  static isDestructuringTarget(node, isLeafNode) {
    switch (node.type) {
      case "ObjectExpression":
        return node.properties.every(p =>
          p.type === "BindingPropertyIdentifier" ||
          p.type === "ShorthandProperty" ||
          p.type === "DataProperty" &&
          Parser.isDestructuringTargetWithDefault(p.expression, isLeafNode)
        );
      case "ArrayExpression":
        if (node.elements.length === 0) return false;
        if (!node.elements.slice(0, -1)
            .filter(e => e != null)
            .every(e => Parser.isDestructuringTargetWithDefault(e, isLeafNode))) return false;
        let last = node.elements[node.elements.length - 1];
        return last == null ||
          last.type === "SpreadElement" && Parser.isDestructuringTarget(last.expression, isLeafNode) ||
          Parser.isDestructuringTargetWithDefault(last, isLeafNode);
      case "ArrayBinding":
      case "BindingIdentifier":
      case "BindingPropertyIdentifier":
      case "BindingPropertyProperty":
      case "BindingWithDefault":
      case "ObjectBinding":
        return true;
    }
    return isLeafNode(node);
  }

  static isDestructuringTargetWithDefault(node, isLeafNode) {
    return node.type === "AssignmentExpression" && node.operator === "=" ?
      Parser.isDestructuringTarget(node.binding, isLeafNode) :
      Parser.isDestructuringTarget(node, isLeafNode);
  }

  static isValidSimpleBindingTarget(node) {
    return node.type === "IdentifierExpression";
  }

  static isValidSimpleAssignmentTarget(node) {
    switch (node.type) {
      case "IdentifierExpression":
      case "ComputedMemberExpression":
      case "StaticMemberExpression":
        return true;
    }
    return false;
  }

  static boundNames(node) {
    switch (node.type) {
      case "BindingIdentifier":
        return [node.name];
      case "BindingWithDefault":
        return Parser.boundNames(node.binding);
      case "ArrayBinding": {
        let names = [];
        node.elements.filter(e => e != null).forEach(e => [].push.apply(names, Parser.boundNames(e)));
        if (node.restElement != null) {
          [].push.apply(names, Parser.boundNames(node.restElement));
        }
        return names;
      }
      case "ObjectBinding": {
        let names = [];
        node.properties.forEach(p => {
          switch (p.type) {
            case "BindingPropertyIdentifier":
              names.push(p.binding.name);
              break;
            case "BindingPropertyProperty":
              [].push.apply(names, Parser.boundNames(p.binding));
              break;
            // istanbul ignore next
            default:
              throw new Error("boundNames called on ObjectBinding with invalid property: " + p.type);
          }
        });
        return names;
      }
      case "ComputedMemberExpression":
      case "StaticMemberExpression":
        return [];
    }
    // istanbul ignore next
    throw new Error("boundNames called on invalid assignment target: " + node.type);
  }

  parseForStatement() {
    this.expect(TokenType.FOR);
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
      return new Shift.ForStatement(
          null,
          test,
          right,
          this.getIteratorStatementEpilogue()
      );
    } else {
      let startsWithLet = this.match(TokenType.LET) || this.match(TokenType.IDENTIFIER) && this.lookahead.value === "let";
      let isForDecl = this.lookaheadLexicalDeclaration();
      if (this.match(TokenType.VAR) || isForDecl) {
        let previousAllowIn = this.allowIn;
        this.allowIn = false;
        let initDecl = this.parseVariableDeclaration({inFor: true});
        this.allowIn = previousAllowIn;

        if (initDecl.declarators.length === 1 && (this.match(TokenType.IN) || this.match(TokenType.OF))) {
          let Ctor;

          if (this.match(TokenType.IN)) {
            if (initDecl.declarators[0].init != null) {
              throw this.createError(ErrorMessages.INVALID_VAR_INIT_FOR_IN);
            }
            Ctor = Shift.ForInStatement;
            this.lex();
            right = this.parseExpression();
          } else {
            if (initDecl.declarators[0].init != null) {
              throw this.createError(ErrorMessages.INVALID_VAR_INIT_FOR_OF);
            }
            Ctor = Shift.ForOfStatement;
            for (let key in this.VDN) {
              this.VDN[key] = FOR_OF_VAR;
            }

            this.lex();
            right = this.parseAssignmentExpression();
          }

          let epilogue = this.wrapVDN(this.getIteratorStatementEpilogue, isForDecl && this.checkBlockScope);

          return new Ctor(initDecl, right, epilogue);
        } else {
          this.expect(TokenType.SEMICOLON);
          if (!this.match(TokenType.SEMICOLON)) {
            test = this.parseExpression();
          }
          this.expect(TokenType.SEMICOLON);
          if (!this.match(TokenType.RPAREN)) {
            right = this.parseExpression();
          }
          return new Shift.ForStatement(initDecl, test, right, this.wrapVDN(this.getIteratorStatementEpilogue, isForDecl && this.checkBlockScope));
        }
      } else {
        let previousAllowIn = this.allowIn;
        this.allowIn = false;
        let init = this.parseExpression();
        this.allowIn = previousAllowIn;

        if (this.match(TokenType.IN) || !startsWithLet && this.match(TokenType.OF)) {
          if (!Parser.isValidSimpleAssignmentTarget(init)) {
            throw this.createError(ErrorMessages.INVALID_LHS_IN_FOR_IN);
          }

          let Ctor = this.match(TokenType.IN) ? Shift.ForInStatement : Shift.ForOfStatement;

          this.lex();
          right = this.parseExpression();

          return new Ctor(init, right, this.getIteratorStatementEpilogue());
        } else {
          this.expect(TokenType.SEMICOLON);
          if (!this.match(TokenType.SEMICOLON)) {
            test = this.parseExpression();
          }
          this.expect(TokenType.SEMICOLON);
          if (!this.match(TokenType.RPAREN)) {
            right = this.parseExpression();
          }
          return new Shift.ForStatement(init, test, right, this.getIteratorStatementEpilogue());
        }
      }
    }
  }

  getIteratorStatementEpilogue() {
    this.expect(TokenType.RPAREN);
    let oldInIteration = this.inIteration;
    this.inIteration = true;
    let body = this.parseStatement();
    this.inIteration = oldInIteration;
    return body;
  }

  parseIfStatement() {
    this.expect(TokenType.IF);
    this.expect(TokenType.LPAREN);
    let test = this.parseExpression();

    this.expect(TokenType.RPAREN);
    let consequent = this.parseStatement();
    let alternate = null;
    if (this.eat(TokenType.ELSE)) {
      alternate = this.parseStatement();
    }
    return new Shift.IfStatement(test, consequent, alternate);
  }

  parseReturnStatement() {
    let argument = null;

    this.expect(TokenType.RETURN);
    if (!this.inFunctionBody) {
      throw this.createError(ErrorMessages.ILLEGAL_RETURN);
    }

    if (this.hasLineTerminatorBeforeNext) {
      return new Shift.ReturnStatement(null);
    }

    if (!this.match(TokenType.SEMICOLON)) {
      if (!this.match(TokenType.RBRACE) && !this.eof()) {
        argument = this.parseExpression();
      }
    }

    this.consumeSemicolon();
    return new Shift.ReturnStatement(argument);
  }

  parseWithStatement() {
    if (this.strict) {
      throw this.createError(ErrorMessages.STRICT_MODE_WITH);
    }

    this.expect(TokenType.WITH);
    this.expect(TokenType.LPAREN);
    let object = this.parseExpression();
    this.expect(TokenType.RPAREN);
    let body = this.parseStatement();

    return new Shift.WithStatement(object, body);
  }

  parseSwitchStatement() {
    this.expect(TokenType.SWITCH);
    this.expect(TokenType.LPAREN);
    let discriminant = this.parseExpression();
    this.expect(TokenType.RPAREN);
    this.expect(TokenType.LBRACE);

    if (this.eat(TokenType.RBRACE)) {
      return new Shift.SwitchStatement(discriminant, []);
    }
    let oldInSwitch = this.inSwitch;
    this.inSwitch = true;
    return this.wrapVDN(() => {
      let cases = this.parseSwitchCases();
      if (this.match(TokenType.DEFAULT)) {
        let switchDefault = this.parseSwitchDefault();
        let postDefaultCases = this.parseSwitchCases();
        if (this.match(TokenType.DEFAULT)) {
          throw this.createError(ErrorMessages.MULTIPLE_DEFAULTS_IN_SWITCH);
        }
        this.inSwitch = oldInSwitch;
        this.expect(TokenType.RBRACE);
        return new Shift.SwitchStatementWithDefault(discriminant, cases, switchDefault, postDefaultCases);
      } else {
        this.inSwitch = oldInSwitch;
        this.expect(TokenType.RBRACE);
        return new Shift.SwitchStatement(discriminant, cases);
      }
    }, this.checkBlockScope);
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
    return this.markLocation(new Shift.SwitchCase(this.parseExpression(), this.parseSwitchCaseBody()), startLocation);
  }

  parseSwitchDefault() {
    let startLocation = this.getLocation();
    this.expect(TokenType.DEFAULT);
    return this.markLocation(new Shift.SwitchDefault(this.parseSwitchCaseBody()), startLocation);
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
    let token = this.expect(TokenType.THROW);

    if (this.hasLineTerminatorBeforeNext) {
      throw this.createErrorWithLocation(token, ErrorMessages.NEWLINE_AFTER_THROW);
    }

    let argument = this.parseExpression();

    this.consumeSemicolon();

    return new Shift.ThrowStatement(argument);
  }

  parseTryStatement() {
    this.expect(TokenType.TRY);
    let block = this.wrapVDN(this.parseBlock, this.checkBlockScope);

    if (this.match(TokenType.CATCH)) {
      let handler = this.parseCatchClause();
      if (this.eat(TokenType.FINALLY)) {
        let finalizer = this.wrapVDN(this.parseBlock, this.checkBlockScope);
        return new Shift.TryFinallyStatement(block, handler, finalizer);
      }
      return new Shift.TryCatchStatement(block, handler);
    }

    if (this.eat(TokenType.FINALLY)) {
      let finalizer = this.wrapVDN(this.parseBlock, this.checkBlockScope);
      return new Shift.TryFinallyStatement(block, null, finalizer);
    } else {
      throw this.createError(ErrorMessages.NO_CATCH_OR_FINALLY);
    }
  }

  parseVariableDeclarationStatement() {
    let declaration = this.parseVariableDeclaration();
    this.consumeSemicolon();
    return new Shift.VariableDeclarationStatement(declaration);
  }

  parseWhileStatement() {
    this.expect(TokenType.WHILE);
    this.expect(TokenType.LPAREN);
    return new Shift.WhileStatement(this.parseExpression(), this.getIteratorStatementEpilogue());
  }

  parseCatchClause() {
    let startLocation = this.getLocation();

    this.expect(TokenType.CATCH);
    this.expect(TokenType.LPAREN);
    let token = this.lookahead;
    if (this.match(TokenType.RPAREN) || this.match(TokenType.LPAREN)) {
      throw this.createUnexpected(token);
    }

    let param = this.parseLeftHandSideExpression({allowCall: false});

    if (!Parser.isDestructuringTarget(param, Parser.isValidSimpleBindingTarget)) {
      throw this.createUnexpected(token);
    }
    param = Parser.transformDestructuring(param);

    let bound = Parser.boundNames(param);
    if (firstDuplicate(bound) != null) {
      throw this.createErrorWithLocation(token, ErrorMessages.DUPLICATE_BINDING, firstDuplicate(bound));
    }

    if (this.strict && bound.some(isRestrictedWord)) {
      throw this.createErrorWithLocation(token, ErrorMessages.STRICT_CATCH_VARIABLE);
    }

    this.expect(TokenType.RPAREN);

    let body = this.wrapVDN(this.parseBlock, this.checkBlockScope);

    this.LDN.forEach(name => {
      if (bound.indexOf(name) >= 0) {
        throw this.createErrorWithLocation(token, ErrorMessages.DUPLICATE_BINDING, name);
      }
    });
    for (let key in this.VDN) {
      if (this.VDN[key] === FOR_OF_VAR && bound.indexOf(key.slice(1)) >= 0) {
        throw this.createError(ErrorMessages.DUPLICATE_CATCH_BINDING, key.slice(1));
      }
    }
    return this.markLocation(new Shift.CatchClause(param, body), startLocation);
  }

  parseBlock() {
    let startLocation = this.getLocation();
    this.expect(TokenType.LBRACE);

    let body = [];
    while (!this.match(TokenType.RBRACE)) {
      body.push(this.parseStatementListItem());
    }
    this.expect(TokenType.RBRACE);
    return this.markLocation(new Shift.Block(body), startLocation);
  }

  parseVariableDeclaration({inFor = false, boundNames = []} = {}) {
    let startLocation = this.getLocation();
    let token = this.lex();

    // Preceded by this.match(TokenSubType.VAR) || this.match(TokenSubType.LET);
    let kind = token.type === TokenType.VAR ? "var" : token.type === TokenType.CONST ? "const" : "let";
    let declarators = this.parseVariableDeclaratorList(kind, {inFor, boundNames});
    return this.markLocation(new Shift.VariableDeclaration(kind, declarators), startLocation);
  }

  parseVariableDeclaratorList(kind, {inFor, boundNames}) {
    let result = [];
    let [varDecl, allBound] = this.parseVariableDeclarator(kind, {allowConstWithoutBinding: inFor});
    result.push(varDecl);
    if (inFor && kind === "const" && varDecl.init === null) {
      return result;
    }

    while (this.eat(TokenType.COMMA)) {
      let [nextVarDecl, bound] = this.parseVariableDeclarator(kind, {allowConstWithoutBinding: false});
      result.push(nextVarDecl);
      if (kind !== "var") {
        allBound = allBound.concat(bound);
      }
    }

    if (this.strict && allBound.some(isRestrictedWord)) {
      throw this.createErrorWithLocation(this.lookahead, ErrorMessages.STRICT_VAR_NAME);
    }

    if (kind !== "var") {
      let dupe = firstDuplicate(allBound);
      if (dupe !== null) {
        throw this.createError(ErrorMessages.DUPLICATE_BINDING, dupe);
      }
    }
    [].push.apply(boundNames, allBound);
    return result;
  }

  parseVariableDeclarator(kind, {allowConstWithoutBinding}) {
    let startLocation = this.getLocation();
    let token = this.lookahead;

    if (this.match(TokenType.LPAREN)) {
      throw this.createUnexpected(this.lookahead);
    }
    let id = this.parseLeftHandSideExpression({allowCall: false});

    if (!Parser.isDestructuringTarget(id, Parser.isValidSimpleBindingTarget)) {
      throw this.createUnexpected(token);
    }
    id = Parser.transformDestructuring(id);

    let bound = Parser.boundNames(id);

    let init = null;
    if (kind === "const") {
      if (!allowConstWithoutBinding || this.match(TokenType.ASSIGN)) {
        this.expect(TokenType.ASSIGN);
        init = this.parseAssignmentExpression();
      }
    } else if (this.eat(TokenType.ASSIGN)) {
      init = this.parseAssignmentExpression();
    }

    if (kind === "var") {
      bound.forEach(name => this.VDN["$" + name] = true);
    } else {
      if (bound.indexOf("let") >= 0) {
        throw this.createErrorWithLocation(token, ErrorMessages.LEXICALLY_BOUND_LET);
      }
      [].push.apply(this.LDN, bound);
    }
    return [this.markLocation(new Shift.VariableDeclarator(id, init), startLocation), bound];
  }

  parseExpression() {
    let startLocation = this.getLocation();

    let expr = this.parseAssignmentExpression();

    if (this.match(TokenType.COMMA)) {
      while (!this.eof()) {
        if (!this.match(TokenType.COMMA)) {
          break;
        }
        this.lex();
        expr = this.markLocation(new Shift.BinaryExpression(",", expr, this.parseAssignmentExpression()),
            startLocation);
      }
    }
    return expr;
  }

  parseArrowExpressionTail(head, startLocation) {
    let arrow = this.expect(TokenType.ARROW);

    // Convert param list.
    let {params = null, rest = null} = head;
    if (head.type !== ARROW_EXPRESSION_PARAMS) {
      if (head.type === "IdentifierExpression") {
        let name = head.name;
        if (STRICT_MODE_RESERVED_WORD.hasOwnProperty(name)) {
          throw this.createError(ErrorMessages.STRICT_RESERVED_WORD);
        }
        if (isRestrictedWord(name)) {
          throw this.createError(ErrorMessages.STRICT_PARAM_NAME);
        }
        head = Parser.transformDestructuring(head);
        params = [head];
      } else {
        throw this.createUnexpected(arrow);
      }
    }

    if (this.match(TokenType.LBRACE)) {
      let previousYield = this.allowYieldExpression;
      this.allowYieldExpression = false;
      let boundParams = [].concat.apply([], params.map(Parser.boundNames));
      let [body] = this.parseFunctionBody(boundParams);
      this.allowYieldExpression = previousYield;
      return this.markLocation(new Shift.ArrowExpression(params, rest, body), startLocation);
    } else {
      let body = this.parseAssignmentExpression();
      return this.markLocation(new Shift.ArrowExpression(params, rest, body), startLocation);
    }
  }

  parseAssignmentExpression() {
    let token = this.lookahead;
    let startLocation = this.getLocation();

    if (this.allowYieldExpression && !this.inGeneratorParameter && this.lookahead.value === "yield") {
      return this.parseYieldExpression();
    }

    let node = this.parseConditionalExpression();

    if (!this.hasLineTerminatorBeforeNext && this.match(TokenType.ARROW)) {
      return this.parseArrowExpressionTail(node, startLocation);
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
      if (!Parser.isValidSimpleAssignmentTarget(node)) {
        throw this.createError(ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
      }
      if (node.type === "IdentifierExpression") {
        if (this.strict && isRestrictedWord(node.name)) {
          throw this.createErrorWithLocation(token, ErrorMessages.STRICT_LHS_ASSIGNMENT);
        }
        node = Parser.transformDestructuring(node);
      }
    } else if (operator.type === TokenType.ASSIGN) {
      if (!Parser.isDestructuringTarget(node, Parser.isValidSimpleAssignmentTarget)) {
        throw this.createError(ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
      }
      node = Parser.transformDestructuring(node);

      let bound = Parser.boundNames(node);
      if (this.strict && bound.some(isRestrictedWord)) {
        throw this.createErrorWithLocation(token, ErrorMessages.STRICT_LHS_ASSIGNMENT);
      }
    } else {
      if (node.type === "ObjectExpression" && node.properties.some(p => p.type === "BindingPropertyIdentifier")) {
        throw this.createUnexpected(operator);
      }
      return node;
    }

    this.lex();
    let previousInGeneratorParameter = this.inGeneratorParameter;
    this.inGeneratorParameter = false;
    let right = this.parseAssignmentExpression();
    this.inGeneratorParameter = previousInGeneratorParameter;
    return this.markLocation(new Shift.AssignmentExpression(operator.type.name, node, right), startLocation);
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
      return this.markLocation(new Shift.YieldExpression(null), startLocation);
    }
    let isGenerator = !!this.eat(TokenType.MUL);
    let previousYield = this.allowYieldExpression;
    let expr = null;
    if (isGenerator || this.lookaheadAssignmentExpression()) {
      expr = this.parseAssignmentExpression();
    }
    this.allowYieldExpression = previousYield;
    let Ctor = isGenerator ? Shift.YieldGeneratorExpression : Shift.YieldExpression;
    return this.markLocation(new Ctor(expr), startLocation);
  }

  parseConditionalExpression() {
    let startLocation = this.getLocation();
    let expr = this.parseBinaryExpression();
    if (this.eat(TokenType.CONDITIONAL)) {
      let previousAllowIn = this.allowIn;
      this.allowIn = true;
      let consequent = this.parseAssignmentExpression();
      this.allowIn = previousAllowIn;
      this.expect(TokenType.COLON);
      let alternate = this.parseAssignmentExpression();
      return this.markLocation(new Shift.ConditionalExpression(expr, consequent, alternate), startLocation);
    }

    return expr;
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
    let location = this.getLocation();
    let left = this.parseUnaryExpression();
    let operator = this.lookahead.type;

    let isBinaryOperator = this.isBinaryOperator(operator);
    if (!isBinaryOperator) {
      return left;
    }

    this.lex();
    let stack = [];
    stack.push({location, left, operator, precedence: BinaryPrecedence[operator.name]});
    location = this.getLocation();
    let right = this.parseUnaryExpression();

    operator = this.lookahead.type;
    isBinaryOperator = this.isBinaryOperator(this.lookahead.type);
    while (isBinaryOperator) {
      let precedence = BinaryPrecedence[operator.name];
      // Reduce: make a binary expression from the three topmost entries.
      while (stack.length && precedence <= stack[stack.length - 1].precedence) {
        let stackItem = stack[stack.length - 1];
        let stackOperator = stackItem.operator;
        left = stackItem.left;
        stack.pop();
        location = stackItem.location;
        right = this.markLocation(new Shift.BinaryExpression(stackOperator.name, left, right), location);
      }

      // Shift.
      this.lex();
      stack.push({location, left: right, operator, precedence});
      location = this.getLocation();
      right = this.parseUnaryExpression();

      operator = this.lookahead.type;
      isBinaryOperator = this.isBinaryOperator(operator);
    }

    // Final reduce to clean-up the stack.
    return stack.reduceRight((expr, stackItem) =>
      this.markLocation(new Shift.BinaryExpression(stackItem.operator.name, stackItem.left, expr), stackItem.location),
      right);
  }

  static isPrefixOperator(type) {
    switch (type) {
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

  parseUnaryExpression() {
    if (this.lookahead.type.klass !== TokenClass.Punctuator && this.lookahead.type.klass !== TokenClass.Keyword) {
      return this.parsePostfixExpression();
    }
    let startLocation = this.getLocation();
    let operator = this.lookahead;
    if (!Parser.isPrefixOperator(operator.type)) {
      return this.parsePostfixExpression();
    }
    this.lex();
    let expr = this.parseUnaryExpression();
    switch (operator.type) {
      case TokenType.INC:
      case TokenType.DEC:
        // 11.4.4, 11.4.5;
        if (expr.type === "IdentifierExpression") {
          if (this.strict && isRestrictedWord(expr.name)) {
            throw this.createError(ErrorMessages.STRICT_LHS_PREFIX);
          }
        }

        if (!Parser.isValidSimpleAssignmentTarget(expr)) {
          throw this.createError(ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
        }
        break;
      case TokenType.DELETE:
        if (expr.type === "IdentifierExpression" && this.strict) {
          throw this.createError(ErrorMessages.STRICT_DELETE);
        }
        break;
      default:
        break;
    }

    return this.markLocation(new Shift.PrefixExpression(operator.value, expr), startLocation);
  }

  parsePostfixExpression() {
    let startLocation = this.getLocation();

    let expr = this.parseLeftHandSideExpression({allowCall: true});

    if (this.hasLineTerminatorBeforeNext) {
      return expr;
    }

    let operator = this.lookahead;
    if (operator.type !== TokenType.INC && operator.type !== TokenType.DEC) {
      return expr;
    }
    this.lex();
    // 11.3.1, 11.3.2;
    if (expr.type === "IdentifierExpression") {
      if (this.strict && isRestrictedWord(expr.name)) {
        throw this.createError(ErrorMessages.STRICT_LHS_POSTFIX);
      }
    }
    if (!Parser.isValidSimpleAssignmentTarget(expr)) {
      throw this.createError(ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
    }
    return this.markLocation(new Shift.PostfixExpression(expr, operator.value), startLocation);
  }

  parseLeftHandSideExpression({allowCall}) {
    let startLocation = this.getLocation();
    let previousAllowIn = this.allowIn;
    this.allowIn = allowCall;

    let expr, token = this.lookahead;

    if (this.eat(TokenType.SUPER)) {
      expr = this.markLocation(new Shift.Super, startLocation);
      if (this.match(TokenType.LPAREN)) {
        if (allowCall) {
          if (this.inConstructor && !this.inParameter) {
            expr = this.markLocation(new Shift.CallExpression(expr, this.parseArgumentList()), startLocation);
          } else {
            throw this.createErrorWithLocation(startLocation, ErrorMessages.UNEXPECTED_SUPER_CALL);
          }
        } else {
          throw this.createUnexpected(token);
        }
      } else if (this.match(TokenType.LBRACK)) {
        if (this.inMethod && !this.inParameter) {
          expr = this.markLocation(new Shift.ComputedMemberExpression(expr, this.parseComputedMember()), startLocation);
        } else {
          throw this.createErrorWithLocation(startLocation, ErrorMessages.UNEXPECTED_SUPER_PROPERTY);
        }
      } else if (this.match(TokenType.PERIOD)) {
        if (this.inMethod && !this.inParameter) {
          expr = this.markLocation(new Shift.StaticMemberExpression(expr, this.parseNonComputedMember()), startLocation);
        } else {
          throw this.createErrorWithLocation(startLocation, ErrorMessages.UNEXPECTED_SUPER_PROPERTY);
        }
      } else {
        throw this.createUnexpected(token);
      }
    } else if (this.match(TokenType.NEW)) {
      expr = this.parseNewExpression();
    } else {
      expr = this.parsePrimaryExpression();
    }

    while (true) {
      if (allowCall && this.match(TokenType.LPAREN)) {
        expr = this.markLocation(new Shift.CallExpression(expr, this.parseArgumentList()), startLocation);
      } else if (this.match(TokenType.LBRACK)) {
        expr = this.markLocation(new Shift.ComputedMemberExpression(expr, this.parseComputedMember()), startLocation);
      } else if (this.match(TokenType.PERIOD)) {
        expr = this.markLocation(new Shift.StaticMemberExpression(expr, this.parseNonComputedMember()), startLocation);
      } else if (this.match(TokenType.TEMPLATE)) {
        expr = this.markLocation(new Shift.TemplateExpression(expr, this.parseTemplateElements()), startLocation);
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
      return [this.markLocation(new Shift.TemplateElement(token.value.slice(1, -1)), startLocation)];
    }
    let result = [this.markLocation(new Shift.TemplateElement(this.lex().value.slice(1, -2)), startLocation)];
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
        result.push(this.markLocation(new Shift.TemplateElement(token.value.slice(1, -1)), startLocation));
        return result;
      } else {
        result.push(this.markLocation(new Shift.TemplateElement(token.value.slice(1, -2)), startLocation));
      }
    }
  }

  parseNonComputedMember() {
    this.expect(TokenType.PERIOD);
    if (!this.lookahead.type.klass.isIdentifierName) {
      throw this.createUnexpected(this.lookahead);
    } else {
      return this.lex().value;
    }
  }

  parseComputedMember() {
    this.expect(TokenType.LBRACK);
    let expr = this.parseExpression();
    this.expect(TokenType.RBRACK);
    return expr;
  }

  parseNewExpression() {
    let startLocation = this.getLocation();
    this.expect(TokenType.NEW);
    if (this.eat(TokenType.PERIOD)) {
      let ident = this.expect(TokenType.IDENTIFIER);
      if (ident.value !== "target") {
        throw this.createUnexpected(ident);
      } else if (!this.inFunctionBody) {
        throw this.createErrorWithLocation(startLocation, ErrorMessages.UNEXPECTED_NEW_TARGET);
      }
      return this.markLocation(new Shift.NewTargetExpression, startLocation);
    }
    let callee = this.parseLeftHandSideExpression({allowCall: false});
    return this.markLocation(new Shift.NewExpression(
      callee,
      this.match(TokenType.LPAREN) ? this.parseArgumentList() : []
    ), startLocation);
  }

  parsePrimaryExpression() {
    if (this.match(TokenType.LPAREN)) {
      return this.parseGroupExpression();
    }

    let startLocation = this.getLocation();

    switch (this.lookahead.type) {
      case TokenType.YIELD:
      case TokenType.IDENTIFIER:
        return this.markLocation({ type: "IdentifierExpression", name: this.parseIdentifier() }, startLocation);
      case TokenType.STRING:
        return this.parseStringLiteral();
      case TokenType.NUMBER:
        return this.parseNumericLiteral();
      case TokenType.THIS:
        this.lex();
        return this.markLocation(new Shift.ThisExpression, startLocation);
      case TokenType.FUNCTION:
        return this.markLocation(this.parseFunction({isExpr: true}), startLocation);
      case TokenType.TRUE:
        this.lex();
        return this.markLocation(new Shift.LiteralBooleanExpression(true), startLocation);
      case TokenType.FALSE:
        this.lex();
        return this.markLocation(new Shift.LiteralBooleanExpression(false), startLocation);
      case TokenType.NULL:
        this.lex();
        return this.markLocation(new Shift.LiteralNullExpression, startLocation);
      case TokenType.LBRACK:
        return this.parseArrayExpression();
      case TokenType.LBRACE:
        return this.parseObjectExpression();
      case TokenType.TEMPLATE:
        return this.markLocation(new Shift.TemplateExpression(null, this.parseTemplateElements()), startLocation);
      case TokenType.DIV:
      case TokenType.ASSIGN_DIV:
        this.lookahead = this.scanRegExp(this.lookahead.type === TokenType.DIV ? "/" : "/=");
        let token = this.lex();
        let lastSlash = token.value.lastIndexOf("/");
        let pattern = token.value.slice(1, lastSlash).replace("\\/", "/");
        let flags = token.value.slice(lastSlash + 1);
        try {
          RegExp(pattern, flags);
        } catch (unused) {
          throw this.createErrorWithLocation(token, ErrorMessages.INVALID_REGULAR_EXPRESSION);
        }
        return this.markLocation(new Shift.LiteralRegExpExpression(pattern, flags), startLocation);
      case TokenType.CLASS:
        return this.parseClass({isExpr: true});
      default:
        throw this.createUnexpected(this.lex());
    }
  }

  parseNumericLiteral() {
    let startLocation = this.getLocation();
    if (this.strict && this.lookahead.octal) {
      throw this.createErrorWithLocation(this.lookahead, ErrorMessages.STRICT_OCTAL_LITERAL);
    }
    let token2 = this.lex();
    let node = token2._value === 1/0
      ? new Shift.LiteralInfinityExpression
      : new Shift.LiteralNumericExpression(token2._value);
    return this.markLocation(node, startLocation);
  }

  parseStringLiteral() {
    let startLocation = this.getLocation();
    if (this.strict && this.lookahead.octal) {
      throw this.createErrorWithLocation(this.lookahead, ErrorMessages.STRICT_OCTAL_LITERAL);
    }
    let token2 = this.lex();
    return this.markLocation(new Shift.LiteralStringExpression(token2._value, token2.slice.text),
        startLocation);
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
    if (this.match(TokenType.YIELD)) {
      if (this.strict) {
        this.lookahead.type = TokenType.YIELD;
        throw this.createUnexpected(this.lookahead);
      } else if (this.allowYieldExpression) {
        throw this.createUnexpected(this.lookahead);
      } else if (this.inGeneratorBody) {
        throw this.createUnexpected(this.lookahead);
      } else {
        return this.lex().value;
      }
    }
    return this.expect(TokenType.IDENTIFIER).value;
  }

  parseArgumentList() {
    this.expect(TokenType.LPAREN);
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
      let startLocation = this.getLocation();
      let arg;
      if (this.eat(TokenType.ELLIPSIS)) {
        arg = this.parseAssignmentExpression();
        arg = this.markLocation(new Shift.SpreadElement(arg), startLocation);
      } else {
        arg = this.parseAssignmentExpression();
      }
      result.push(arg);
      if (!this.eat(TokenType.COMMA)) {
        break;
      }
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
    let rest = null;
    let start = this.expect(TokenType.LPAREN);
    if (this.eat(TokenType.RPAREN)) {
      this.ensureArrow();
      return {
        type: ARROW_EXPRESSION_PARAMS,
        params: [],
        rest: null
      };
    } else if (this.eat(TokenType.ELLIPSIS)) {
      rest = this.parseBindingIdentifier();
      this.expect(TokenType.RPAREN);
      this.ensureArrow();
      return {
        type: ARROW_EXPRESSION_PARAMS,
        params: [],
        rest: rest
      };
    }

    let possibleBindings = !this.match(TokenType.LPAREN);
    let startLocation = this.getLocation();
    let group = this.parseAssignmentExpression();
    let params = [group];

    while (this.eat(TokenType.COMMA)) {
      if (this.match(TokenType.ELLIPSIS)) {
        if (!possibleBindings) {
          throw this.createUnexpected(this.lookahead);
        }
        this.lex();
        rest = this.parseBindingIdentifier();
        break;
      }
      possibleBindings = possibleBindings && !this.match(TokenType.LPAREN);
      let expr = this.parseAssignmentExpression();
      params.push(expr);
      group = this.markLocation(new Shift.BinaryExpression(",", group, expr), startLocation);
    }

    if (possibleBindings) {
      possibleBindings = params.every(e =>
        Parser.isDestructuringTargetWithDefault(e, Parser.isValidSimpleBindingTarget));
    }

    this.expect(TokenType.RPAREN);

    if (!this.hasLineTerminatorBeforeNext && this.match(TokenType.ARROW)) {
      if (!possibleBindings) {
        throw this.createErrorWithLocation(start, ErrorMessages.ILLEGAL_ARROW_FUNCTION_PARAMS);
      }
      // check dup params
      params = params.map(Parser.transformDestructuring);
      let allBoundNames = [];
      params.forEach(expr => {
        let boundNames = Parser.boundNames(expr);
        let dup = firstDuplicate(boundNames);
        if (dup) {
          throw this.createError(ErrorMessages.DUPLICATE_BINDING, dup);
        }
        allBoundNames = allBoundNames.concat(boundNames);
      });
      if (rest) {
        allBoundNames.push(rest.name);
      }

      if (firstDuplicate(allBoundNames) != null) {
        throw this.createError(ErrorMessages.STRICT_PARAM_DUPE);
      }

      let strictRestrictedWord = allBoundNames.some(isRestrictedWord);
      if (strictRestrictedWord) {
        throw this.createError(ErrorMessages.STRICT_PARAM_NAME);
      }

      let strictReservedWord = hasStrictModeReservedWord(allBoundNames);
      if (strictReservedWord) {
        throw this.createError(ErrorMessages.STRICT_RESERVED_WORD);
      }

      return {
        type: ARROW_EXPRESSION_PARAMS,
        params,
        rest
      };
    } else {
      if (rest) {
        this.ensureArrow();
      }
      return group;
    }
  }


  parseArrayExpression() {
    let startLocation = this.getLocation();

    this.expect(TokenType.LBRACK);

    let elements = this.parseArrayExpressionElements();

    this.expect(TokenType.RBRACK);

    return this.markLocation(new Shift.ArrayExpression(elements), startLocation);
  }

  parseArrayExpressionElements() {
    let result = [];
    while (true) {
      if (this.match(TokenType.RBRACK)) {
        return result;
      }
      let el;

      if (this.eat(TokenType.COMMA)) {
        el = null;
      } else {
        let startLocation = this.getLocation();
        if (this.eat(TokenType.ELLIPSIS)) {
          el = this.parseAssignmentExpression();
          el = this.markLocation(new Shift.SpreadElement(el), startLocation);
        } else {
          el = this.parseAssignmentExpression();
        }
        if (!this.match(TokenType.RBRACK)) {
          this.expect(TokenType.COMMA);
        }
      }
      result.push(el);
    }
  }

  parseObjectExpression() {
    let startLocation = this.getLocation();

    this.expect(TokenType.LBRACE);

    let properties = this.parseObjectExpressionItems();

    this.expect(TokenType.RBRACE);

    return this.markLocation(new Shift.ObjectExpression(properties), startLocation);
  }


  parseObjectExpressionItems() {
    let result = [];
    let has__proto__ = [false];
    while (!this.match(TokenType.RBRACE)) {
      result.push(this.parsePropertyDefinition(has__proto__));
      if (!this.match(TokenType.RBRACE)) {
        this.expect(TokenType.COMMA);
      }
    }
    return result;
  }

  parsePropertyDefinition(has__proto__) {
    let startLocation = this.getLocation();
    let token = this.lookahead;

    let {methodOrKey, kind} = this.parseMethodDefinition(false);
    switch (kind) {
      case "method":
        return methodOrKey;
      case "identifier": // IdentifierReference,
        if (this.eat(TokenType.ASSIGN)) {
          // CoverInitializedName
          if ((this.strict || this.allowYieldExpression) && methodOrKey.value === "yield") {
            throw this.createUnexpected(token);
          }
          return this.markLocation({ type: "BindingPropertyIdentifier",
            binding: this.markLocation({ type: "BindingIdentifier", name: methodOrKey.value }, startLocation),
            init: this.parseAssignmentExpression(),
          }, startLocation);
        } else if (!this.match(TokenType.COLON)) {
          if (token.type !== TokenType.IDENTIFIER && token.type !== TokenType.YIELD ||
            (this.strict || this.allowYieldExpression) && methodOrKey.value === "yield") {
            throw this.createUnexpected(token);
          }
          return this.markLocation(new Shift.ShorthandProperty(methodOrKey.value), startLocation);
        }
    }

    // DataProperty
    this.expect(TokenType.COLON);
    if (methodOrKey.type === "StaticPropertyName") {
      if (methodOrKey.value === "__proto__") {
        if (!has__proto__[0]) {
          has__proto__[0] = true;
        } else {
          throw this.createErrorWithLocation(token, ErrorMessages.DUPLICATE_PROTO_PROPERTY);
        }
      }
    }
    return this.markLocation(new Shift.DataProperty(
        methodOrKey,
        this.parseAssignmentExpression()),
      startLocation);
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
        return this.markLocation(new Shift.StaticPropertyName(this.parseStringLiteral().value), startLocation);
      case TokenType.NUMBER:
        let numLiteral = this.parseNumericLiteral();
        return this.markLocation(new Shift.StaticPropertyName("" + (numLiteral.type === "LiteralInfinityExpression" ? 1 / 0 : numLiteral.value)), startLocation);
      case TokenType.LBRACK:
        let previousYield = this.allowYieldExpression;
        if (this.inGeneratorParameter) {
          this.allowYieldExpression = false;
        }
        this.expect(TokenType.LBRACK);
        let expr = this.parseAssignmentExpression();
        this.expect(TokenType.RBRACK);
        this.allowYieldExpression = previousYield;
        return this.markLocation(new Shift.ComputedPropertyName(expr), startLocation);
    }

    return this.markLocation(new Shift.StaticPropertyName(this.parseIdentifierName()), startLocation);
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
   * The the parser will stop at the end of the leading `Identifier` or `PropertyName` and return it.
   *
   * @returns {{methodOrKey: (Shift.Method|Shift.PropertyName), kind: string}}
   */
  parseMethodDefinition(isClassProtoMethod) {
    let token = this.lookahead;
    let startLocation = this.getLocation();

    let isGenerator = !!this.eat(TokenType.MUL);

    let key = this.parsePropertyName();

    if (!isGenerator && token.type === TokenType.IDENTIFIER) {
      let name = token.value;
      if (name.length === 3) {
        // Property Assignment: Getter and Setter.
        if (name === "get" && this.lookaheadPropertyName()) {
          key = this.parsePropertyName();
          this.expect(TokenType.LPAREN);
          this.expect(TokenType.RPAREN);
          let previousInConstructor = this.inConstructor;
          this.inConstructor = false;
          let previousInMethod = this.inMethod;
          this.inMethod = true;
          let [body] = this.parseFunctionBody([]);
          this.inConstructor = previousInConstructor;
          this.inMethod = previousInMethod;
          return {
            methodOrKey: this.markLocation(new Shift.Getter(key, body), startLocation),
            kind: "method"
          };
        } else if (name === "set" && this.lookaheadPropertyName()) {
          key = this.parsePropertyName();
          this.expect(TokenType.LPAREN);
          let param = this.parseParam();
          let info = {};
          this.checkParam(param, token, [], info);
          this.expect(TokenType.RPAREN);
          let previousYield = this.allowYieldExpression;
          this.allowYieldExpression = false;
          let previousInConstructor = this.inConstructor;
          this.inConstructor = false;
          let previousInMethod = this.inMethod;
          this.inMethod = true;
          let boundParams = Parser.boundNames(param);
          let [body, isStrict] = this.parseFunctionBody(boundParams);
          this.allowYieldExpression = previousYield;
          this.inConstructor = previousInConstructor;
          this.inMethod = previousInMethod;
          if (isStrict) {
            if (info.firstRestricted) {
              throw this.createErrorWithLocation(info.firstRestricted, info.message);
            }
          }
          return {
            methodOrKey: this.markLocation(new Shift.Setter(key, param, body), startLocation),
            kind: "method"
          };
        }
      }
    }

    if (this.match(TokenType.LPAREN)) {
      let previousYield = this.allowYieldExpression;
      let previousInGeneratorParameter = this.inGeneratorParameter;
      this.inGeneratorParameter = isGenerator;
      this.allowYieldExpression = isGenerator;
      let paramInfo = this.parseParams(null);
      this.inGeneratorParameter = previousInGeneratorParameter;
      this.allowYieldExpression = previousYield;
      let previousInGeneratorBody = this.inGeneratorBody;
      let previousInConstructor = this.inConstructor;
      let previousInMethod = this.inMethod;
      this.allowYieldExpression = isGenerator;
      this.inConstructor =
        isClassProtoMethod && !isGenerator && this.hasClassHeritage &&
        key.type === "StaticPropertyName" && key.value === "constructor";
      this.inMethod = true;

      if (isGenerator) {
        this.inGeneratorBody = true;
      }
      let boundParams = [].concat.apply([], paramInfo.params.map(Parser.boundNames));
      let [body] = this.parseFunctionBody(boundParams);
      this.allowYieldExpression = previousYield;
      this.inGeneratorBody = previousInGeneratorBody;
      this.inConstructor = previousInConstructor;
      this.inMethod = previousInMethod;

      if (paramInfo.firstRestricted) {
        throw this.createErrorWithLocation(paramInfo.firstRestricted, paramInfo.message);
      }
      return {
        methodOrKey: this.markLocation(
          new Shift.Method(isGenerator, key, paramInfo.params, paramInfo.rest, body), startLocation),
        kind: "method"
      };
    }

    return {
      methodOrKey: key,
      kind: token.type.klass.isIdentifierName ? "identifier" : "property"
    };
  }

  parseClass({isExpr, inDefault = false}) {
    let location = this.getLocation();
    this.expect(TokenType.CLASS);
    let id = null;
    let heritage = null;

    if (this.match(TokenType.IDENTIFIER)) {
      let idLocation = this.getLocation();
      id = this.parseBindingIdentifier();
    } else if (!isExpr) {
      if (inDefault) {
        id = this.markLocation({ type: "BindingIdentifier", name: "*default*" }, location);
      } else {
        throw this.createUnexpected(this.lookahead);
      }
    }

    let previousInGeneratorParameter = this.inGeneratorParameter;
    let previousParamYield = this.allowYieldExpression;
    let previousHasClassHeritage = this.hasClassHeritage;
    if (isExpr) {
      this.inGeneratorParameter = false;
      this.allowYieldExpression = false;
    }
    if (this.eat(TokenType.EXTENDS)) {
      heritage = this.parseLeftHandSideExpression({allowCall: true});
    }

    this.expect(TokenType.LBRACE);
    let originalStrict = this.strict;
    this.strict = true;
    let methods = [];
    let hasConstructor = false;
    this.hasClassHeritage = heritage != null;
    while (!this.eat(TokenType.RBRACE)) {
      if (this.eat(TokenType.SEMICOLON)) {
        continue;
      }
      let methodToken = this.lookahead;
      let isStatic = false;
      let {methodOrKey, kind} = this.parseMethodDefinition(true);
      if (kind === "identifier" && methodOrKey.value === "static") {
        isStatic = true;
        ({methodOrKey, kind} = this.parseMethodDefinition(false));
      }
      switch (kind) {
        case "method":
          let key = methodOrKey.name;
          if (!isStatic) {
            if (key.type === "StaticPropertyName" && key.value === "constructor") {
              if (methodOrKey.type !== "Method" || methodOrKey.isGenerator) {
                throw this.createErrorWithLocation(methodToken, "Constructors cannot be generators, getters or setters");
              }
              if (hasConstructor) {
                throw this.createErrorWithLocation(methodToken, "Only one constructor is allowed in a class");
              } else {
                hasConstructor = true;
              }
            }
          } else {
            if (key.type === "StaticPropertyName" && key.value === "prototype") {
              throw this.createErrorWithLocation(methodToken, "Static class methods cannot be named 'prototype'");
            }
          }
          methods.push(new Shift.ClassElement(isStatic, methodOrKey));
          break;
        default:
          throw this.createError("Only methods are allowed in classes");
      }
    }
    if (!isExpr) {
      this.VDN["$" + id.name] = true;
    }
    this.strict = originalStrict;
    this.allowYieldExpression = previousParamYield;
    this.inGeneratorParameter = previousInGeneratorParameter;
    this.hasClassHeritage = previousHasClassHeritage;
    return this.markLocation(new (isExpr ? Shift.ClassExpression : Shift.ClassDeclaration)(id, heritage, methods), location);
  }

  parseFunction({isExpr, isTopLevel, inDefault = false, allowGenerator = true}) {
    let startLocation = this.getLocation();

    this.expect(TokenType.FUNCTION);

    let id = null;
    let message = null;
    let firstRestricted = null;
    let isGenerator = allowGenerator && !!this.eat(TokenType.MUL);
    let previousGeneratorParameter = this.inGeneratorParameter;
    let previousYield = this.allowYieldExpression;
    let previousInGeneratorBody = this.inGeneratorBody;

    if (!this.match(TokenType.LPAREN)) {
      let token = this.lookahead;
      let identifierLocation = this.getLocation();
      id = this.parseIdentifier();
      if (this.strict || isGenerator) {
        if (isRestrictedWord(id)) {
          throw this.createErrorWithLocation(token, ErrorMessages.STRICT_FUNCTION_NAME);
        }
      } else {
        if (isRestrictedWord(id)) {
          firstRestricted = token;
          message = ErrorMessages.STRICT_FUNCTION_NAME;
        } else if (isStrictModeReservedWordES5(id)) {
          firstRestricted = token;
          message = ErrorMessages.STRICT_RESERVED_WORD;
        }
      }
      id = this.markLocation({ type: "BindingIdentifier", name: id }, identifierLocation);
    } else if (!isExpr) {
      if (inDefault) {
        id = this.markLocation({type: "BindingIdentifier", name: "*default*" }, startLocation);
      } else {
        throw this.createUnexpected(this.lookahead);
      }
    }
    this.inGeneratorParameter = isGenerator;
    this.allowYieldExpression = isGenerator;
    let info = this.parseParams(firstRestricted);
    this.inGeneratorParameter = previousGeneratorParameter;
    this.allowYieldExpression = previousYield;

    if (info.message != null) {
      message = info.message;
    }

    let previousStrict = this.strict;
    this.allowYieldExpression = isGenerator;
    if (isGenerator) {
      this.inGeneratorBody = true;
    }
    let previousInConstructor = this.inConstructor;
    this.inConstructor = false;
    let previousInMethod = this.inMethod;
    this.inMethod = false;
    let boundParams = [].concat.apply([], info.params.map(Parser.boundNames));
    let [body, isStrict] = this.parseFunctionBody(boundParams);
    this.inGeneratorBody = previousInGeneratorBody;
    this.inConstructor = previousInConstructor;
    this.inMethod = previousInMethod;

    this.allowYieldExpression = previousYield;
    if (message != null) {
      if ((this.strict || isStrict) && info.firstRestricted != null) {
        throw this.createErrorWithLocation(info.firstRestricted, message);
      }
    }
    this.strict = previousStrict;
    let Ctor = isExpr ? Shift.FunctionExpression : Shift.FunctionDeclaration;
    if (!isExpr) {
      if (isTopLevel) {
        this.VDN["$" + id.name] = true;
      } else {
        this.LDN.push(id.name);
      }

    }
    return this.markLocation(
      new Ctor(isGenerator, id, info.params, info.rest, body),
      startLocation
    );
  }

  parseParam() {
    let token = this.lookahead;
    let originalInParameter = this.inParameter;
    this.inParameter = true;
    if (this.match(TokenType.LPAREN)) {
      throw this.createUnexpected(this.lookahead);
    }
    let param = this.parseLeftHandSideExpression({allowCall: false});
    if (this.eat(TokenType.ASSIGN)) {
      let previousInGeneratorParameter = this.inGeneratorParameter;
      let previousYieldExpression = this.allowYieldExpression;
      if (this.inGeneratorParameter) {
        this.allowYieldExpression = false;
      }
      this.inGeneratorParameter = false;
      param = this.markLocation(new Shift.AssignmentExpression("=", param, this.parseAssignmentExpression()));
      this.inGeneratorParameter = previousInGeneratorParameter;
      this.allowYieldExpression = previousYieldExpression;
    }
    if (!Parser.isDestructuringTargetWithDefault(param, Parser.isValidSimpleBindingTarget)) {
      throw this.createUnexpected(token);
    }
    this.inParameter = originalInParameter;
    return Parser.transformDestructuring(param);
  }

  checkParam(param, token, bound, info) {
    let newBound = Parser.boundNames(param);
    [].push.apply(bound, newBound);

    if (firstDuplicate(newBound) != null) {
      throw this.createErrorWithLocation(token, ErrorMessages.DUPLICATE_BINDING, firstDuplicate(newBound));
    }

    if (this.strict) {
      if (newBound.some(isRestrictedWord)) {
        throw this.createErrorWithLocation(token, ErrorMessages.STRICT_PARAM_NAME);
      } else if (firstDuplicate(bound) != null) {
        throw this.createErrorWithLocation(token, ErrorMessages.STRICT_PARAM_DUPE);
      }
    } else if (info.firstRestricted == null) {
      if (newBound.some(isRestrictedWord)) {
        info.firstRestricted = token;
        info.message = ErrorMessages.STRICT_PARAM_NAME;
      } else if (hasStrictModeReservedWord(newBound)) {
        info.firstRestricted = token;
        info.message = ErrorMessages.STRICT_RESERVED_WORD;
      } else if (firstDuplicate(bound) != null) {
        info.firstRestricted = token;
        info.message = ErrorMessages.STRICT_PARAM_DUPE;
      }
    }
  }

  parseParams(fr) {
    let info = {params: [], rest: null}, isSimpleParameter = true;
    info.firstRestricted = fr;
    this.expect(TokenType.LPAREN);

    if (!this.match(TokenType.RPAREN)) {
      let bound = [];
      let seenRest = false;

      while (!this.eof()) {
        let token = this.lookahead;
        let param;
        if (this.eat(TokenType.ELLIPSIS)) {
          isSimpleParameter = false;
          token = this.lookahead;
          param = this.parseBindingIdentifier();
          seenRest = true;
        } else {
          param = this.parseParam();
          if (param.type !== "BindingIdentifier") {
            isSimpleParameter = false;
          }
        }

        this.checkParam(param, token, bound, info);

        if (seenRest) {
          info.rest = param;
          break;
        }
        info.params.push(param);
        if (this.match(TokenType.RPAREN)) {
          break;
        }
        this.expect(TokenType.COMMA);
      }
    }

    if (!isSimpleParameter) {
      if (info.message === ErrorMessages.STRICT_PARAM_DUPE) {
        throw this.createError(info.message);
      }
    }

    this.expect(TokenType.RPAREN);
    return info;
  }
}
