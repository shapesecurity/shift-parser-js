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

import {isRestrictedWord, isStrictModeReservedWord} from "./utils";

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

    // Cover grammar
    this.isBindingElement = true;
    this.isAssignmentTarget = true;
    this.firstExprError = null;
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
    return this.markLocation({ type: "Module", items: items }, location);
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
    return this.markLocation({ type: "Script", body }, location);
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
            directives.push(this.markLocation({ type: "Directive", rawValue:text.slice(1, -1)}, directiveLocation));
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
    return [this.markLocation({ type: "FunctionBody", directives, statements }, location), isStrict];
  }

  parseImportSpecifier(boundNames) {
    let startLocation = this.getLocation(), name;
    if (this.lookahead.type === TokenType.IDENTIFIER) {
      name = this.parseIdentifier();
      if (!this.eatContextualKeyword("as")) {
        if ({}.hasOwnProperty.call(boundNames, "$" + name)) {
          throw this.createErrorWithLocation(startLocation, ErrorMessages.IMPORT_DUPE);
        }
        boundNames["$" + name] = true;
        return this.markLocation(
          {
            type: "ImportSpecifier",
            name: null,
            binding: this.markLocation({ type: "BindingIdentifier", name: name }, startLocation)
          }, startLocation);
      }
    } else if (this.lookahead.type.klass.isIdentifierName) {
      name = this.parseIdentifierName();
      this.expectContextualKeyword("as");
    }

    let location = this.getLocation();
    let boundName = this.parseIdentifier();
    if ({}.hasOwnProperty.call(boundNames, "$" + boundName)) {
      throw this.createErrorWithLocation(location, ErrorMessages.IMPORT_DUPE);
    }
    boundNames["$" + boundName] = true;
    return this.markLocation(
      {
        type: "ImportSpecifier",
        name,
        binding: this.markLocation({ type: "BindingIdentifier", name: boundName }, location),
      }, startLocation);
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
    let value = this.expect(TokenType.STRING).str;
    this.consumeSemicolon();
    return value;
  }

  parseImportDeclaration() {
    let startLocation = this.getLocation(), defaultBinding = null, moduleSpecifier, boundNames = Object.create(null);
    this.expect(TokenType.IMPORT);
    switch (this.lookahead.type) {
      case TokenType.STRING:
        moduleSpecifier = this.lex().str;
        this.consumeSemicolon();
        return this.markLocation({ type: "Import", defaultBinding: null, namedImports: [], moduleSpecifier }, startLocation);
      case TokenType.IDENTIFIER:
        defaultBinding = this.parseBindingIdentifier();
        boundNames["$" + defaultBinding.name] = true;
        if (!this.eat(TokenType.COMMA)) {
          return this.markLocation({ type: "Import", defaultBinding, namedImports: [], moduleSpecifier: this.parseFromClause() }, startLocation);
        }
        break;
    }
    if (this.match(TokenType.MUL)) {
      return this.markLocation({
        type: "ImportNamespace",
        defaultBinding,
        namespaceBinding: this.parseNameSpaceBinding(boundNames),
        moduleSpecifier: this.parseFromClause() }, startLocation);
    } else if (this.match(TokenType.LBRACE)) {
      return this.markLocation({
        type: "Import",
        defaultBinding,
        namedImports: this.parseNamedImports(boundNames),
        moduleSpecifier: this.parseFromClause() }, startLocation);
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
      return this.markLocation({ type: "ExportSpecifier", name, exportedName }, startLocation);
    } else {
      if ({}.hasOwnProperty.call(exportedNames, "$" + name)) {
        throw this.createError(ErrorMessages.DUPLICATE_EXPORTED_NAME, name);
      }
      exportedNames["$" + name] = true;
    }
    return this.markLocation({ type: "ExportSpecifier", name: null, exportedName: name }, startLocation);
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
        decl = { type: "ExportAllFrom", moduleSpecifier: this.parseFromClause() };
        break;
      case TokenType.LBRACE:
        // export ExportClause FromClause ;
        // export ExportClause ;
        let namedExports = this.parseExportClause(exportedNames, exportedBindings);
        let moduleSpecifier = null;
        if (this.matchContextualKeyword("from")) {
          moduleSpecifier = this.parseFromClause();
        }
        decl = { type: "ExportFrom", namedExports, moduleSpecifier };
        break;
      case TokenType.CLASS:
        // export ClassDeclaration
        decl = { type: "Export", declaration: this.parseClass({isExpr: false}) };
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
        decl = { type: "Export", declaration: this.parseFunction({isExpr: false, isTopLevel: true}) };
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
            decl = {
              type: "ExportDefault",
              body: this.parseFunction({ isExpr: false, inDefault: true, isTopLevel: true })
            };
            key = decl.body.name.name;
            if (key !== "*default*") {
              exportedBindings["$" + key] = true;
              oldLDN.push(key);
            }
            break;
          case TokenType.CLASS:
            // export default ClassDeclaration[Default]
            decl = { type: "ExportDefault", body: this.parseClass({ isExpr: false, inDefault: true }) };
            key = decl.body.name.name;
            if (key !== "*default*") {
              exportedBindings["$" + key] = true;
              oldLDN.push(key);
            }
            break;
          default:
          {
            // export default [lookahead ∉ {function, class}] AssignmentExpression[In] ;
            decl = { type: "ExportDefault", body: this.parseAssignmentExpression() };
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
        decl = { type: "Export", declaration: this.parseVariableDeclaration({boundNames}) };
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
    var stmt = this.wrapVDN(() => this.isolateCoverGrammar(() =>
      this.parseStatementHelper(allowLabeledFunction, originalLDN, isTopLevel)));
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
          return { type: "LabeledStatement", label: expr.name, body: labeledBody };
        } else {
          this.consumeSemicolon();
          return { type: "ExpressionStatement", expression: expr };
        }
      }
    }
  }

  parseEmptyStatement() {
    this.expect(TokenType.SEMICOLON);
    return { type: "EmptyStatement" };
  }

  parseBlockStatement() {
    let stmt = { type: "BlockStatement", block: this.parseBlock() };
    this.checkBlockScope();
    return stmt;
  }

  parseExpressionStatement() {
    let expr = this.parseExpression();
    this.consumeSemicolon();
    return { type: "ExpressionStatement", expression: expr };
  }

  parseBreakStatement() {
    let token = this.lookahead;
    this.expect(TokenType.BREAK);

    // Catch the very common case first: immediately a semicolon (U+003B).
    if (this.eat(TokenType.SEMICOLON)) {
      if (!(this.inIteration || this.inSwitch)) {
        throw this.createErrorWithLocation(token, ErrorMessages.ILLEGAL_BREAK);
      }

      return { type: "BreakStatement", label: null };
    }

    if (this.hasLineTerminatorBeforeNext) {
      if (!(this.inIteration || this.inSwitch)) {
        throw this.createErrorWithLocation(token, ErrorMessages.ILLEGAL_BREAK);
      }

      return { type: "BreakStatement", label: null };
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

    return { type: "BreakStatement", label };
  }

  parseContinueStatement() {
    let token = this.lookahead;
    this.expect(TokenType.CONTINUE);

    // Catch the very common case first: immediately a semicolon (U+003B).
    if (this.eat(TokenType.SEMICOLON)) {
      if (!this.inIteration) {
        throw this.createErrorWithLocation(token, ErrorMessages.ILLEGAL_CONTINUE);
      }

      return { type: "ContinueStatement", label: null };
    }

    if (this.hasLineTerminatorBeforeNext) {
      if (!this.inIteration) {
        throw this.createErrorWithLocation(token, ErrorMessages.ILLEGAL_CONTINUE);
      }

      return { type: "ContinueStatement", label: null };
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

    return { type: "ContinueStatement", label };
  }


  parseDebuggerStatement() {
    this.expect(TokenType.DEBUGGER);
    this.consumeSemicolon();
    return { type: "DebuggerStatement" };
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

    return { type: "DoWhileStatement", body, test };
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
      case "IdentifierExpression":
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
      return {
        type: "ForStatement",
        init: null,
        test,
        update: right,
        body: this.getIteratorStatementEpilogue()
      };
    } else {
      let startsWithLet = this.match(TokenType.LET) || this.match(TokenType.IDENTIFIER) && this.lookahead.value === "let";
      let isForDecl = this.lookaheadLexicalDeclaration();
      let leftLocation = this.getLocation();
      if (this.match(TokenType.VAR) || isForDecl) {
        let previousAllowIn = this.allowIn;
        this.allowIn = false;
        let init = this.parseVariableDeclaration({inFor: true});
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
            for (let key in this.VDN) {
              this.VDN[key] = FOR_OF_VAR;
            }

            this.lex();
            right = this.parseAssignmentExpression();
          }

          let body = this.wrapVDN(this.getIteratorStatementEpilogue, isForDecl && this.checkBlockScope);

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
          return {
            type: "ForStatement",
            init,
            test,
            update: right,
            body: this.wrapVDN(this.getIteratorStatementEpilogue, isForDecl && this.checkBlockScope)
          };
        }
      } else {
        let previousAllowIn = this.allowIn;
        this.allowIn = false;
        let expr = this.inheritCoverGrammar(this.parseAssignmentExpressionOrBindingElement);
        this.allowIn = previousAllowIn;

        if (this.isAssignmentTarget && expr.type !== "AssignmentExpression" && (this.match(TokenType.IN) || this.matchContextualKeyword("of"))) {
          if (startsWithLet && this.matchContextualKeyword("of")) {
            throw this.createError(ErrorMessages.INVALID_VAR_LHS_FOR_OF);
          }
          let type = this.match(TokenType.IN) ? "ForInStatement" : "ForOfStatement";

          this.lex();
          right = this.parseExpression();

          return { type, left: Parser.transformDestructuring(expr), right, body: this.getIteratorStatementEpilogue() };
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
    return { type: "IfStatement", test, consequent, alternate };
  }

  parseReturnStatement() {
    let expression = null;

    this.expect(TokenType.RETURN);
    if (!this.inFunctionBody) {
      throw this.createError(ErrorMessages.ILLEGAL_RETURN);
    }

    if (this.hasLineTerminatorBeforeNext) {
      return { type: "ReturnStatement", expression };
    }

    if (!this.match(TokenType.SEMICOLON)) {
      if (!this.match(TokenType.RBRACE) && !this.eof()) {
        expression = this.parseExpression();
      }
    }

    this.consumeSemicolon();
    return { type: "ReturnStatement", expression };
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

    return { type: "WithStatement", object, body };
  }

  parseSwitchStatement() {
    this.expect(TokenType.SWITCH);
    this.expect(TokenType.LPAREN);
    let discriminant = this.parseExpression();
    this.expect(TokenType.RPAREN);
    this.expect(TokenType.LBRACE);

    if (this.eat(TokenType.RBRACE)) {
      return { type: "SwitchStatement", discriminant, cases: [] };
    }
    let oldInSwitch = this.inSwitch;
    this.inSwitch = true;
    return this.wrapVDN(() => {
      let cases = this.parseSwitchCases();
      if (this.match(TokenType.DEFAULT)) {
        let defaultCase = this.parseSwitchDefault();
        let postDefaultCases = this.parseSwitchCases();
        if (this.match(TokenType.DEFAULT)) {
          throw this.createError(ErrorMessages.MULTIPLE_DEFAULTS_IN_SWITCH);
        }
        this.inSwitch = oldInSwitch;
        this.expect(TokenType.RBRACE);
        return {
          type: "SwitchStatementWithDefault",
          discriminant,
          preDefaultCases: cases,
          defaultCase,
          postDefaultCases
        };
      } else {
        this.inSwitch = oldInSwitch;
        this.expect(TokenType.RBRACE);
        return { type: "SwitchStatement", discriminant, cases };
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
    return this.markLocation({
      type: "SwitchCase",
      test: this.parseExpression(),
      consequent: this.parseSwitchCaseBody()
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
    let token = this.expect(TokenType.THROW);

    if (this.hasLineTerminatorBeforeNext) {
      throw this.createErrorWithLocation(token, ErrorMessages.NEWLINE_AFTER_THROW);
    }

    let expression = this.parseExpression();

    this.consumeSemicolon();

    return { type: "ThrowStatement", expression };
  }

  parseTryStatement() {
    this.expect(TokenType.TRY);
    let body = this.wrapVDN(this.parseBlock, this.checkBlockScope);

    if (this.match(TokenType.CATCH)) {
      let catchClause = this.parseCatchClause();
      if (this.eat(TokenType.FINALLY)) {
        let finalizer = this.wrapVDN(this.parseBlock, this.checkBlockScope);
        return { type: "TryFinallyStatement", body, catchClause, finalizer };
      }
      return { type: "TryCatchStatement", body, catchClause };
    }

    if (this.eat(TokenType.FINALLY)) {
      let finalizer = this.wrapVDN(this.parseBlock, this.checkBlockScope);
      return { type: "TryFinallyStatement", body, catchClause: null, finalizer };
    } else {
      throw this.createError(ErrorMessages.NO_CATCH_OR_FINALLY);
    }
  }

  parseVariableDeclarationStatement() {
    let declaration = this.parseVariableDeclaration();
    this.consumeSemicolon();
    return { type: "VariableDeclarationStatement", declaration };
  }

  parseWhileStatement() {
    this.expect(TokenType.WHILE);
    this.expect(TokenType.LPAREN);
    return { type: "WhileStatement", test: this.parseExpression(), body: this.getIteratorStatementEpilogue() };
  }

  parseCatchClause() {
    let startLocation = this.getLocation();

    this.expect(TokenType.CATCH);
    this.expect(TokenType.LPAREN);
    let token = this.lookahead;
    if (this.match(TokenType.RPAREN) || this.match(TokenType.LPAREN)) {
      throw this.createUnexpected(token);
    }

    let binding = this.parseBindingTarget();

    let bound = Parser.boundNames(binding);
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

  parseVariableDeclaration({inFor = false, boundNames = []} = {}) {
    let startLocation = this.getLocation();
    let token = this.lex();

    // Preceded by this.match(TokenSubType.VAR) || this.match(TokenSubType.LET);
    let kind = token.type === TokenType.VAR ? "var" : token.type === TokenType.CONST ? "const" : "let";
    let declarators = this.parseVariableDeclaratorList(kind, {inFor, boundNames});
    return this.markLocation({ type: "VariableDeclaration", kind, declarators }, startLocation);
  }

  parseVariableDeclaratorList(kind, {inFor, boundNames}) {
    let result = [];
    let [varDecl, allBound] = this.parseVariableDeclarator(kind, {inFor, allowConstWithoutBinding: inFor});
    result.push(varDecl);
    if (inFor && kind === "const" && varDecl.init === null) {
      return result;
    }

    while (this.eat(TokenType.COMMA)) {
      let [nextVarDecl, bound] = this.parseVariableDeclarator(kind, {inFor, allowConstWithoutBinding: false});
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

  parseVariableDeclarator(kind, {inFor, allowConstWithoutBinding}) {
    let startLocation = this.getLocation();
    let token = this.lookahead;

    if (this.match(TokenType.LPAREN)) {
      throw this.createUnexpected(this.lookahead);
    }

    let binding = this.parseBindingTarget();
    if (!inFor && binding.type !== 'BindingIdentifier' && !this.match(TokenType.ASSIGN)) {
      this.expect(TokenType.ASSIGN);
    }
    let bound = Parser.boundNames(binding);

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
    return [this.markLocation({ type: "VariableDeclarator", binding, init }, startLocation), bound];
  }

  isolateCoverGrammar(parser) {
    var oldIsBindingElement = this.isBindingElement,
      oldIsAssignmentTarget = this.isAssignmentTarget,
      oldFirstExprError = this.firstExprError,
      result;
    this.isBindingElement = true;
    this.isAssignmentTarget = true;
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
    this.isBindingElement = true;
    this.isAssignmentTarget = true;
    this.firstExprError = null;
    result = parser.call(this);
    this.isBindingElement = this.isBindingElement && oldIsBindingElement;
    this.isAssignmentTarget = this.isAssignmentTarget && oldIsAssignmentTarget;
    this.firstExprError = oldFirstExprError || this.firstExprError;
    return result;
  }

  static transformDestructuring(node) {
    switch (node.type) {
      case "ObjectExpression":
        return copyLocation(node, {
          type: "ObjectBinding",
          properties: node.properties.map(Parser.transformDestructuring)
        });
      case "DataProperty":
        return copyLocation(node, {
          type: "BindingPropertyProperty",
          name: node.name,
          binding: Parser.transformDestructuring(node.expression)
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
            elements: node.elements.slice(0, -1).map(e => e && Parser.transformDestructuring(e)),
            restElement: copyLocation(last.expression, Parser.transformDestructuring(last.expression))
          });
        } else {
          return copyLocation(node, {
            type: "ArrayBinding",
            elements: node.elements.map(e => e && Parser.transformDestructuring(e)),
            restElement: null
          });
        }
      case "AssignmentExpression":
        return copyLocation(node, {
          type: "BindingWithDefault",
          binding: Parser.transformDestructuring(node.binding),
          init: node.expression
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


  parseExpression() {
    let startLocation = this.getLocation();

    let group = this.parseAssignmentExpression();
    if (this.match(TokenType.COMMA)) {
      while (!this.eof()) {
        if (!this.match(TokenType.COMMA)) {
          break;
        }
        this.lex();
        let expr = this.parseAssignmentExpression();
        group = this.markLocation({ type: "BinaryExpression", left: group, operator: ",", right: expr }, startLocation);
      }
    }
    return group;
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
        params = [Parser.transformDestructuring(head)];
      } else {
        throw this.createUnexpected(arrow);
      }
    }

    let paramsNode = this.markLocation({ type: "FormalParameters", items: params, rest }, startLocation);

    if (this.match(TokenType.LBRACE)) {
      let previousYield = this.allowYieldExpression;
      this.allowYieldExpression = false;
      let boundParams = [].concat.apply([], params.map(Parser.boundNames));
      let [body] = this.parseFunctionBody(boundParams);
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
    let token = this.lookahead;
    let startLocation = this.getLocation();

    if (this.allowYieldExpression && !this.inGeneratorParameter && this.lookahead.type === TokenType.YIELD) {
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
      if (!this.isAssignmentTarget || !Parser.isValidSimpleAssignmentTarget(expr)) {
        throw this.createError(ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
      }
      expr = Parser.transformDestructuring(expr);
      if (expr.type === "BindingIdentifier") {
        if (this.strict && isRestrictedWord(expr.name)) {
          throw this.createErrorWithLocation(token, ErrorMessages.STRICT_LHS_ASSIGNMENT);
        }
      }
    } else if (operator.type === TokenType.ASSIGN) {
      if (!this.isAssignmentTarget) {
        throw this.createError(ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
      }
      expr = Parser.transformDestructuring(expr);
      let bound = Parser.boundNames(expr);
        if (this.strict && bound.some(isRestrictedWord)) {
          throw this.createErrorWithLocation(token, ErrorMessages.STRICT_LHS_ASSIGNMENT);
        }
    } else {
      return expr;
    }

    this.lex();
    let previousInGeneratorParameter = this.inGeneratorParameter;
    this.inGeneratorParameter = false;
    let rhs = this.parseAssignmentExpression();

    this.inGeneratorParameter = previousInGeneratorParameter;
    this.firstExprError = null;
    return this.markLocation({
        type: "AssignmentExpression",
      binding: expr,
        operator: operator.type.name,
        expression: rhs
    }, startLocation);
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
      return this.markLocation({ type: "YieldExpression", expression: null }, startLocation);
    }
    let isGenerator = !!this.eat(TokenType.MUL);
    let previousYield = this.allowYieldExpression;
    let expr = null;
    if (isGenerator || this.lookaheadAssignmentExpression()) {
      expr = this.parseAssignmentExpression();
    }
    this.allowYieldExpression = previousYield;
    let type = isGenerator ? "YieldGeneratorExpression" : "YieldExpression";
    return this.markLocation({type, expression: expr}, startLocation);
  }

  parseConditionalExpression() {
    let startLocation = this.getLocation();
    let test = this.parseBinaryExpression();
    if (this.firstExprError) {
      return test;
    }
    if (this.eat(TokenType.CONDITIONAL)) {
      let previousAllowIn = this.allowIn;
      this.allowIn = true;
      let consequent = this.isolateCoverGrammar(this.parseAssignmentExpression);
      this.allowIn = previousAllowIn;
      this.expect(TokenType.COLON);
      let alternate = this.isolateCoverGrammar(this.parseAssignmentExpression);
      return this.markLocation({
          type: "ConditionalExpression",
        test,
          consequent,
          alternate
      }, startLocation);
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
    let location = this.getLocation();
    let left = this.parseUnaryExpression();
    if (this.firstExprError) {
      return left;
    }

    let operator = this.lookahead.type;

    let isBinaryOperator = this.isBinaryOperator(operator);
    if (!isBinaryOperator) {
      return left;
    }

    this.isBindingElement = this.isAssignmentTarget = false;

    this.lex();
    let stack = [];
    stack.push({location, left, operator, precedence: BinaryPrecedence[operator.name]});
    location = this.getLocation();
    let right = this.isolateCoverGrammar(this.parseUnaryExpression);
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
        right = this.markLocation({ type: "BinaryExpression", left, operator: stackOperator.name, right }, location);
      }

      this.lex();
      stack.push({location, left: right, operator, precedence});
      location = this.getLocation();

      right = this.isolateCoverGrammar(this.parseUnaryExpression);

      operator = this.lookahead.type;
      isBinaryOperator = this.isBinaryOperator(operator);
    }

    // Final reduce to clean-up the stack.
    return stack.reduceRight((expr, stackItem) =>
        this.markLocation({
          type: "BinaryExpression",
          left: stackItem.left,
          operator: stackItem.operator.name,
          right: expr
        }, stackItem.location),
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
    this.isBindingElement = this.isAssignmentTarget = false;
    let expr = this.isolateCoverGrammar(this.parseUnaryExpression);
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

    return this.markLocation({ type: "PrefixExpression", operator: operator.value, operand: expr }, startLocation);
  }

  parsePostfixExpression() {
    let startLocation = this.getLocation();

    let operand = this.parseLeftHandSideExpression({ allowCall: true });
    if (this.firstExprError) return operand;

    if (this.hasLineTerminatorBeforeNext) {
      return operand;
    }

    let operator = this.lookahead;
    if (operator.type !== TokenType.INC && operator.type !== TokenType.DEC) {
      return operand;
    }

    if (!this.isAssignmentTarget) {
      throw this.createError(ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
    }

    if (!Parser.isValidSimpleAssignmentTarget(operand)) {
      throw this.createError(ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
    }

    this.lex();

    // 11.3.1, 11.3.2;
    if (operand.type === "IdentifierExpression") {
      if (this.strict && isRestrictedWord(operand.name)) {
        throw this.createError(ErrorMessages.STRICT_LHS_POSTFIX);
      }
    }

    return this.markLocation({ type: "PostfixExpression", operand, operator: operator.value }, startLocation);
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
          if (this.inConstructor && !this.inParameter) {
            expr = this.markLocation({
              type: "CallExpression",
              callee: expr,
              arguments: this.parseArgumentList()
            }, startLocation);
          } else {
            throw this.createErrorWithLocation(startLocation, ErrorMessages.UNEXPECTED_SUPER_CALL);
          }
        } else {
          throw this.createUnexpected(token);
        }
      } else if (this.match(TokenType.LBRACK)) {
        if (this.inMethod && !this.inParameter) {
          expr = this.markLocation({
            type: "ComputedMemberExpression",
            object: expr,
            expression: this.parseComputedMember()
          }, startLocation);
          this.isAssignmentTarget = true;
        } else {
          throw this.createErrorWithLocation(startLocation, ErrorMessages.UNEXPECTED_SUPER_PROPERTY);
        }
      } else if (this.match(TokenType.PERIOD)) {
        if (this.inMethod && !this.inParameter) {
          expr = this.markLocation({
            type: "StaticMemberExpression",
            object: expr,
            property: this.parseNonComputedMember()
          }, startLocation);
          this.isAssignmentTarget = true;
        } else {
          throw this.createErrorWithLocation(startLocation, ErrorMessages.UNEXPECTED_SUPER_PROPERTY);
        }
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
        this.isBindingElement = false;
        this.isAssignmentTarget = false;
        expr = this.markLocation({
          type: "CallExpression",
          callee: expr,
          arguments: this.parseArgumentList()
        }, startLocation);
      } else if (this.match(TokenType.LBRACK)) {
        this.isBindingElement = false;
        this.isAssignmentTarget = true;
        expr = this.markLocation({
          type: "ComputedMemberExpression",
          object: expr,
          expression: this.parseComputedMember()
        }, startLocation);
      } else if (this.match(TokenType.PERIOD)) {
        this.isBindingElement = false;
        this.isAssignmentTarget = true;
        expr = this.markLocation({
          type: "StaticMemberExpression",
          object: expr,
          property: this.parseNonComputedMember()
        }, startLocation);
      } else if (this.match(TokenType.TEMPLATE)) {
        this.isBindingElement = false;
        this.isAssignmentTarget = false;
        expr = this.markLocation({
          type: "TemplateExpression",
          tag: expr,
          elements: this.parseTemplateElements()
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
      this.markLocation({ type: "TemplateElement", rawValue: this.lex().slice.text.slice(1, -2) }, startLocation)
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
      return this.markLocation({ type: "NewTargetExpression" }, startLocation);
    }
    let callee = this.isolateCoverGrammar(() => this.parseLeftHandSideExpression({ allowCall: false }));
    return this.markLocation({
      type: "NewExpression",
      callee,
      arguments: this.match(TokenType.LPAREN) ? this.parseArgumentList() : []
    }, startLocation);
  }

  parsePrimaryExpression() {
    if (this.match(TokenType.LPAREN)) {
      return this.parseGroupExpression();
    }

    let startLocation = this.getLocation();

    switch (this.lookahead.type) {
      case TokenType.YIELD:
      case TokenType.IDENTIFIER:
      {
        return this.markLocation({ type: "IdentifierExpression", name: this.parseIdentifier() }, startLocation);
      }
      case TokenType.STRING:
        this.isBindingElement = false;
        this.isAssignmentTarget = false;
        return this.parseStringLiteral();
      case TokenType.NUMBER:
        this.isBindingElement = false;
        this.isAssignmentTarget = false;
        return this.parseNumericLiteral();
      case TokenType.THIS:
        this.lex();
        this.isBindingElement = false;
        this.isAssignmentTarget = false;
        return this.markLocation({ type: "ThisExpression" }, startLocation);
      case TokenType.FUNCTION:
        this.isBindingElement = false;
        this.isAssignmentTarget = false;
        return this.markLocation(this.parseFunction({ isExpr: true }), startLocation);
      case TokenType.TRUE:
        this.lex();
        this.isBindingElement = false;
        this.isAssignmentTarget = false;
        return this.markLocation({ type: "LiteralBooleanExpression", value: true }, startLocation);
      case TokenType.FALSE:
        this.lex();
        this.isBindingElement = false;
        this.isAssignmentTarget = false;
        return this.markLocation({ type: "LiteralBooleanExpression", value: false }, startLocation);
      case TokenType.NULL:
        this.lex();
        this.isBindingElement = false;
        this.isAssignmentTarget = false;
        return this.markLocation({ type: "LiteralNullExpression" }, startLocation);
      case TokenType.LBRACK:
        return this.parseArrayExpression();
      case TokenType.LBRACE:
        return this.parseObjectExpression();
      case TokenType.TEMPLATE:
        this.isBindingElement = false;
        this.isAssignmentTarget = false;
        return this.markLocation({
          type: "TemplateExpression",
          tag: null,
          elements: this.parseTemplateElements()
        }, startLocation);
      case TokenType.DIV:
      case TokenType.ASSIGN_DIV:
        this.isBindingElement = false;
        this.isAssignmentTarget = false;
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
        return this.markLocation({ type: "LiteralRegExpExpression", pattern, flags }, startLocation);
      case TokenType.CLASS:
        this.isBindingElement = false;
        this.isAssignmentTarget = false;
        return this.parseClass({ isExpr: true });
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
    let node = token2.value === 1 / 0 ? {
      type: "LiteralInfinityExpression"
    } : {
      type: "LiteralNumericExpression",
      value: token2.value
    };
    return this.markLocation(node, startLocation);
  }

  parseStringLiteral() {
    let startLocation = this.getLocation();
    if (this.strict && this.lookahead.octal) {
      throw this.createErrorWithLocation(this.lookahead, ErrorMessages.STRICT_OCTAL_LITERAL);
    }
    let token2 = this.lex();
    return this.markLocation({ type: "LiteralStringExpression", value: token2.str }, startLocation);
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
        arg = this.markLocation({ type: "SpreadElement", expression: this.parseAssignmentExpression() }, startLocation);
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
    // At this point, we need to parse 3 things:
    //  1. Group expression
    //  2. Assignment target of assignment expression
    //  3. Parameter list of arrow function
    let rest = null;
    let start = this.expect(TokenType.LPAREN);
    if (this.eat(TokenType.RPAREN)) {
      this.ensureArrow();
      this.isBindingElement = false;
      this.isAssignmentTarget = false;
      return {
          type: ARROW_EXPRESSION_PARAMS,
          params: [],
          rest: null
      };
    } else if (this.eat(TokenType.ELLIPSIS)) {
      rest = this.parseBindingIdentifier();
      this.expect(TokenType.RPAREN);
      this.ensureArrow();
      this.isBindingElement = false;
      this.isAssignmentTarget = false;
      return {
        type: ARROW_EXPRESSION_PARAMS,
        params: [],
        rest: rest
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
        let nextLocation = this.getLocation();
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
            right: expr
          }, startLocation);
        }
      }
    }

    this.expect(TokenType.RPAREN);

    if (!this.hasLineTerminatorBeforeNext && this.match(TokenType.ARROW)) {
      if (!this.isBindingElement) {
        throw this.createErrorWithLocation(start, ErrorMessages.ILLEGAL_ARROW_FUNCTION_PARAMS);
      }
      // check dup params
      let allBoundNames = [];

      params = params.map(Parser.transformDestructuring);

      params.forEach(expr => {
        allBoundNames = allBoundNames.concat(Parser.boundNames(expr));
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

    this.expect(TokenType.LBRACK);

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
            this.isAssignmentTarget = this.isBindingElement = false;
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

    this.expect(TokenType.LBRACE);

    let properties = [];
    let has__proto__ = [false];
    while (!this.match(TokenType.RBRACE)) {
      let property = this.inheritCoverGrammar(() => this.parsePropertyDefinition(has__proto__));
      properties.push(property);
      if (!this.match(TokenType.RBRACE)) {
        this.expect(TokenType.COMMA);
      }
    }
    this.expect(TokenType.RBRACE);
    return this.markLocation({ type: "ObjectExpression", properties }, startLocation);
  }

  parsePropertyDefinition(has__proto__) {
    let startLocation = this.getLocation();
    let token = this.lookahead;

    let {methodOrKey, kind} = this.parseMethodDefinition(false);
    switch (kind) {
      case "method":
        this.isBindingElement = this.isAssignmentTarget = false;
        return methodOrKey;
      case "identifier": // IdentifierReference,
        if (this.eat(TokenType.ASSIGN)) {
          // CoverInitializedName
          if (methodOrKey.value === "yield" &&
            (this.strict || this.allowYieldExpression || this.inGeneratorBody || this.inGeneratorParameter)) {
            throw this.createUnexpected(token);
          }
          let init = this.isolateCoverGrammar(this.parseAssignmentExpression);
          this.firstExprError = this.createErrorWithLocation(startLocation, ErrorMessages.ILLEGAL_PROPERTY);
          return this.markLocation({
            type: "BindingPropertyIdentifier",
            binding: Parser.transformDestructuring(methodOrKey),
            init
          }, startLocation);
        } else if (!this.match(TokenType.COLON)) {
          if (token.type !== TokenType.IDENTIFIER && token.type !== TokenType.YIELD ||
            (this.strict || this.allowYieldExpression) && methodOrKey.value === "yield") {
            throw this.createUnexpected(token);
          }
          return this.markLocation({ type: "ShorthandProperty", name: methodOrKey.value }, startLocation);
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
            value: this.parseStringLiteral().value
          }, startLocation),
          binding: null
        };
      case TokenType.NUMBER:
        let numLiteral = this.parseNumericLiteral();
        return {
          name: this.markLocation({
            type: "StaticPropertyName",
            value: "" + (numLiteral.type === "LiteralInfinityExpression" ? 1 / 0 : numLiteral.value)
          }, startLocation),
          binding: null
        };
      case TokenType.LBRACK:
        let previousYield = this.allowYieldExpression;
        if (this.inGeneratorParameter) {
          this.allowYieldExpression = false;
        }
        this.expect(TokenType.LBRACK);
        let expr = this.parseAssignmentExpression();
        this.expect(TokenType.RBRACK);
        this.allowYieldExpression = previousYield;
        return { name: this.markLocation({ type: "ComputedPropertyName", expression: expr }, startLocation), binding: null };
    }

    let name = this.parseIdentifierName();
    return {
      name: this.markLocation({ type: "StaticPropertyName", value: name }, startLocation),
      binding: this.markLocation({ type: "BindingIdentifier", name }, startLocation),
    }
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
   * @returns {{methodOrKey: (Method|PropertyName), kind: string}}
   */
  parseMethodDefinition(isClassProtoMethod) {
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
          let previousInConstructor = this.inConstructor;
          this.inConstructor = false;
          let previousInMethod = this.inMethod;
          this.inMethod = true;
          let [body] = this.parseFunctionBody([]);
          this.inConstructor = previousInConstructor;
          this.inMethod = previousInMethod;
          return {
            methodOrKey: this.markLocation({ type: "Getter", name, body }, startLocation),
            kind: "method"
          };
        } else if (name === "set" && this.lookaheadPropertyName()) {
          ({name} = this.parsePropertyName());
          this.expect(TokenType.LPAREN);
          let param = this.parseBindingElement();
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
            methodOrKey: this.markLocation({ type: "Setter", name, param, body }, startLocation),
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
      let paramsLocation = this.getLocation();
      let paramInfo = this.parseParams(null);
      this.inGeneratorParameter = previousInGeneratorParameter;
      this.allowYieldExpression = previousYield;
      let previousInGeneratorBody = this.inGeneratorBody;
      let previousInConstructor = this.inConstructor;
      let previousInMethod = this.inMethod;
      this.allowYieldExpression = isGenerator;
      this.inConstructor =
        isClassProtoMethod && !isGenerator && this.hasClassHeritage &&
        name.type === "StaticPropertyName" && name.value === "constructor";
      this.inMethod = true;

      if (isGenerator) {
        this.inGeneratorBody = true;
      }
      let boundParams = [].concat.apply([], paramInfo.params.map(Parser.boundNames));

      let params = this.markLocation({ type: "FormalParameters", items: paramInfo.params, rest: paramInfo.rest }, paramsLocation);

      let [body] = this.parseFunctionBody(boundParams);
      this.allowYieldExpression = previousYield;
      this.inGeneratorBody = previousInGeneratorBody;
      this.inConstructor = previousInConstructor;
      this.inMethod = previousInMethod;

      if (paramInfo.firstRestricted) {
        throw this.createErrorWithLocation(paramInfo.firstRestricted, paramInfo.message);
      }

      return {
        methodOrKey: this.markLocation({ type: "Method", isGenerator, name, params, body }, startLocation),
        kind: "method"
      };
    }

    return {
      methodOrKey: name,
      kind: token.type.klass.isIdentifierName ? "identifier" : "property",
      binding: binding
    };
  }

  parseClass({isExpr, inDefault = false}) {
    let location = this.getLocation();
    this.expect(TokenType.CLASS);
    let name = null;
    let heritage = null;

    if (this.match(TokenType.IDENTIFIER)) {
      let idLocation = this.getLocation();
      name = this.parseBindingIdentifier();
    } else if (!isExpr) {
      if (inDefault) {
        name = this.markLocation({ type: "BindingIdentifier", name: "*default*" }, location);
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
      heritage = this.isolateCoverGrammar(() => this.parseLeftHandSideExpression({ allowCall: true }));
    }

    this.expect(TokenType.LBRACE);
    let originalStrict = this.strict;
    this.strict = true;
    let elements = [];
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
              throw this.createErrorWithLocation(methodToken, "Static class methods cannot be named \"prototype\"");
            }
          }
          elements.push(copyLocation(methodOrKey, { type: "ClassElement", isStatic, method: methodOrKey }));
          break;
        default:
          throw this.createError("Only methods are allowed in classes");
      }
    }
    if (!isExpr) {
      this.VDN["$" + name.name] = true;
    }
    this.strict = originalStrict;
    this.allowYieldExpression = previousParamYield;
    this.inGeneratorParameter = previousInGeneratorParameter;
    this.hasClassHeritage = previousHasClassHeritage;
    return this.markLocation({ type: isExpr ? "ClassExpression" : "ClassDeclaration", name, super: heritage, elements }, location);
  }

  parseFunction({isExpr, isTopLevel, inDefault = false, allowGenerator = true}) {
    let startLocation = this.getLocation();

    this.expect(TokenType.FUNCTION);

    let name = null;
    let message = null;
    let firstRestricted = null;
    let isGenerator = allowGenerator && !!this.eat(TokenType.MUL);
    let previousGeneratorParameter = this.inGeneratorParameter;
    let previousYield = this.allowYieldExpression;
    let previousInGeneratorBody = this.inGeneratorBody;

    if (!this.match(TokenType.LPAREN)) {
      let token = this.lookahead;
      let identifierLocation = this.getLocation();
      name = this.parseIdentifier();
      if (this.strict || isGenerator) {
        if (isRestrictedWord(name)) {
          throw this.createErrorWithLocation(token, ErrorMessages.STRICT_FUNCTION_NAME);
        }
      } else {
        if (isRestrictedWord(name)) {
          firstRestricted = token;
          message = ErrorMessages.STRICT_FUNCTION_NAME;
        } else if (isStrictModeReservedWord(name)) {
          firstRestricted = token;
          message = ErrorMessages.STRICT_RESERVED_WORD;
        }
      }
      name = this.markLocation({ type: "BindingIdentifier", name: name }, identifierLocation);
    } else if (!isExpr) {
      if (inDefault) {
        name = this.markLocation({type: "BindingIdentifier", name: "*default*" }, startLocation);
      } else {
        throw this.createUnexpected(this.lookahead);
      }
    }

    let paramsLocation = this.getLocation();

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

    let params = this.markLocation({ type: "FormalParameters", items: info.params, rest: info.rest }, paramsLocation);

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
    if (!isExpr) {
      if (isTopLevel) {
        this.VDN["$" + name.name] = true;
      } else {
        this.LDN.push(name.name);
      }

    }

    return this.markLocation(
      { type: isExpr ? "FunctionExpression" : "FunctionDeclaration", isGenerator, name, params, body }, startLocation);
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
    if ((token.type === TokenType.IDENTIFIER || token.type === TokenType.YIELD) && name.type === 'StaticPropertyName') {
      if (!this.match(TokenType.COLON)) {
        if (token.type === TokenType.YIELD && (this.allowYieldExpression || this.inGeneratorParameter || this.inGeneratorBody)) {
          throw this.createUnexpected(token);
        }
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
          init: defaultValue
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
    let originalInParameter = this.inParameter;
    this.inParameter = true;
    let param = this.parseBindingElement();
    this.inParameter = originalInParameter;
    return param;
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
