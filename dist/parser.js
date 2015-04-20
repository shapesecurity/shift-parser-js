// istanbul ignore next
"use strict";

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

// istanbul ignore next

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

// istanbul ignore next

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

// istanbul ignore next

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

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

var _ErrorMessages = require("./errors");

var _Tokenizer$TokenClass$TokenType = require("./tokenizer");

// Empty parameter list for ArrowExpression
var ARROW_EXPRESSION_PARAMS = "CoverParenthesizedExpressionAndArrowParameterList";

var Precedence = {
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
  Primary: 19 };

var BinaryPrecedence = {
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
  "/": Precedence.Multiplicative };

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
        properties: node.properties.map(transformDestructuring) });
    case "DataProperty":
      return copyLocation(node, {
        type: "BindingPropertyProperty",
        name: node.name,
        binding: transformDestructuring(node.expression) });
    case "ShorthandProperty":
      return copyLocation(node, {
        type: "BindingPropertyIdentifier",
        binding: copyLocation(node, { type: "BindingIdentifier", name: node.name }),
        init: null });
    case "ArrayExpression":
      var last = node.elements[node.elements.length - 1];
      if (last != null && last.type === "SpreadElement") {
        return copyLocation(node, {
          type: "ArrayBinding",
          elements: node.elements.slice(0, -1).map(function (e) {
            return e && transformDestructuring(e);
          }),
          restElement: copyLocation(last.expression, transformDestructuring(last.expression)) });
      } else {
        return copyLocation(node, {
          type: "ArrayBinding",
          elements: node.elements.map(function (e) {
            return e && transformDestructuring(e);
          }),
          restElement: null });
      }
      /* istanbul ignore next */
      break;
    case "AssignmentExpression":
      return copyLocation(node, {
        type: "BindingWithDefault",
        binding: transformDestructuring(node.binding),
        init: node.expression });
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

function isPrefixOperator(type) {
  switch (type) {
    case _Tokenizer$TokenClass$TokenType.TokenType.INC:
    case _Tokenizer$TokenClass$TokenType.TokenType.DEC:
    case _Tokenizer$TokenClass$TokenType.TokenType.ADD:
    case _Tokenizer$TokenClass$TokenType.TokenType.SUB:
    case _Tokenizer$TokenClass$TokenType.TokenType.BIT_NOT:
    case _Tokenizer$TokenClass$TokenType.TokenType.NOT:
    case _Tokenizer$TokenClass$TokenType.TokenType.DELETE:
    case _Tokenizer$TokenClass$TokenType.TokenType.VOID:
    case _Tokenizer$TokenClass$TokenType.TokenType.TYPEOF:
      return true;
  }
  return false;
}

var Parser = (function (_Tokenizer) {
  function Parser(source) {
    _classCallCheck(this, Parser);

    _get(Object.getPrototypeOf(Parser.prototype), "constructor", this).call(this, source);
    this.allowIn = true;
    this.inFunctionBody = false;
    this.inGeneratorParameter = false;
    this.inParameter = false;
    this.inGeneratorBody = false;
    this.allowYieldExpression = false;
    this.module = false;

    // Cover grammar
    this.isBindingElement = true;
    this.isAssignmentTarget = true;
    this.firstExprError = null;
  }

  _inherits(Parser, _Tokenizer);

  _createClass(Parser, [{
    key: "match",
    value: function match(subType) {
      return this.lookahead.type === subType;
    }
  }, {
    key: "eat",
    value: function eat(tokenType) {
      if (this.lookahead.type === tokenType) {
        return this.lex();
      }
    }
  }, {
    key: "expect",
    value: function expect(tokenType) {
      if (this.lookahead.type === tokenType) {
        return this.lex();
      }
      throw this.createUnexpected(this.lookahead);
    }
  }, {
    key: "matchContextualKeyword",
    value: function matchContextualKeyword(keyword) {
      return this.lookahead.type === _Tokenizer$TokenClass$TokenType.TokenType.IDENTIFIER && this.lookahead.value === keyword;
    }
  }, {
    key: "expectContextualKeyword",
    value: function expectContextualKeyword(keyword) {
      if (this.lookahead.type === _Tokenizer$TokenClass$TokenType.TokenType.IDENTIFIER && this.lookahead.value === keyword) {
        return this.lex();
      } else {
        throw this.createUnexpected(this.lookahead);
      }
    }
  }, {
    key: "eatContextualKeyword",
    value: function eatContextualKeyword(keyword) {
      if (this.lookahead.type === _Tokenizer$TokenClass$TokenType.TokenType.IDENTIFIER && this.lookahead.value === keyword) {
        return this.lex();
      }
    }
  }, {
    key: "consumeSemicolon",
    value: function consumeSemicolon() {
      if (this.hasLineTerminatorBeforeNext) {
        return;
      }if (this.eat(_Tokenizer$TokenClass$TokenType.TokenType.SEMICOLON)) {
        return;
      }if (!this.eof() && !this.match(_Tokenizer$TokenClass$TokenType.TokenType.RBRACE)) {
        throw this.createUnexpected(this.lookahead);
      }
    }
  }, {
    key: "markLocation",

    // this is a no-op, reserved for future use
    value: function markLocation(node /*, startLocation*/) {
      return node;
    }
  }, {
    key: "parseModule",
    value: function parseModule() {
      this.module = true;
      this.lookahead = this.advance();

      var startLocation = this.getLocation();
      var items = [];
      while (!this.eof()) {
        items.push(this.parseModuleItem());
      }
      return this.markLocation({ type: "Module", items: items }, startLocation);
    }
  }, {
    key: "parseScript",
    value: function parseScript() {
      this.lookahead = this.advance();

      var startLocation = this.getLocation();
      var body = this.parseBody();
      if (!this.match(_Tokenizer$TokenClass$TokenType.TokenType.EOS)) {
        throw this.createUnexpected(this.lookahead);
      }
      return this.markLocation({ type: "Script", body: body }, startLocation);
    }
  }, {
    key: "parseFunctionBody",
    value: function parseFunctionBody() {
      var startLocation = this.getLocation();

      var oldInFunctionBody = this.inFunctionBody;
      var oldModule = this.module;
      this.inFunctionBody = true;
      this.module = false;

      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.LBRACE);
      var body = this.markLocation(this.parseBody(), startLocation);
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.RBRACE);

      this.inFunctionBody = oldInFunctionBody;
      this.module = oldModule;

      return body;
    }
  }, {
    key: "parseBody",
    value: function parseBody() {
      var startLocation = this.getLocation();

      var directives = [],
          statements = [],
          parsingDirectives = true;

      while (true) {
        if (this.eof() || this.match(_Tokenizer$TokenClass$TokenType.TokenType.RBRACE)) break;
        var _token = this.lookahead;
        var text = _token.slice.text;
        var isStringLiteral = _token.type === _Tokenizer$TokenClass$TokenType.TokenType.STRING;
        var directiveLocation = this.getLocation();
        var stmt = this.parseStatementListItem();
        if (parsingDirectives) {
          if (isStringLiteral && stmt.type === "ExpressionStatement" && stmt.expression.type === "LiteralStringExpression") {
            directives.push(this.markLocation({ type: "Directive", rawValue: text.slice(1, -1) }, directiveLocation));
          } else {
            parsingDirectives = false;
            statements.push(stmt);
          }
        } else {
          statements.push(stmt);
        }
      }

      return this.markLocation({ type: "FunctionBody", directives: directives, statements: statements }, startLocation);
    }
  }, {
    key: "parseImportSpecifier",
    value: function parseImportSpecifier() {
      var startLocation = this.getLocation(),
          name = undefined;
      if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.IDENTIFIER) || this.match(_Tokenizer$TokenClass$TokenType.TokenType.YIELD) || this.match(_Tokenizer$TokenClass$TokenType.TokenType.LET)) {
        name = this.parseIdentifier();
        if (!this.eatContextualKeyword("as")) {
          return this.markLocation({
            type: "ImportSpecifier",
            name: null,
            binding: this.markLocation({ type: "BindingIdentifier", name: name }, startLocation) }, startLocation);
        }
      } else if (this.lookahead.type.klass.isIdentifierName) {
        name = this.parseIdentifierName();
        this.expectContextualKeyword("as");
      }

      return this.markLocation({ type: "ImportSpecifier", name: name, binding: this.parseBindingIdentifier() }, startLocation);
    }
  }, {
    key: "parseNameSpaceBinding",
    value: function parseNameSpaceBinding() {
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.MUL);
      this.expectContextualKeyword("as");
      return this.parseBindingIdentifier();
    }
  }, {
    key: "parseNamedImports",
    value: function parseNamedImports() {
      var result = [];
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.LBRACE);
      while (!this.eat(_Tokenizer$TokenClass$TokenType.TokenType.RBRACE)) {
        result.push(this.parseImportSpecifier());
        if (!this.eat(_Tokenizer$TokenClass$TokenType.TokenType.COMMA)) {
          this.expect(_Tokenizer$TokenClass$TokenType.TokenType.RBRACE);
          break;
        }
      }
      return result;
    }
  }, {
    key: "parseFromClause",
    value: function parseFromClause() {
      this.expectContextualKeyword("from");
      var value = this.expect(_Tokenizer$TokenClass$TokenType.TokenType.STRING).str;
      this.consumeSemicolon();
      return value;
    }
  }, {
    key: "parseImportDeclaration",
    value: function parseImportDeclaration() {
      var startLocation = this.getLocation(),
          defaultBinding = null,
          moduleSpecifier = undefined;
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.IMPORT);
      switch (this.lookahead.type) {
        case _Tokenizer$TokenClass$TokenType.TokenType.STRING:
          moduleSpecifier = this.lex().str;
          this.consumeSemicolon();
          return this.markLocation({ type: "Import", defaultBinding: null, namedImports: [], moduleSpecifier: moduleSpecifier }, startLocation);
        case _Tokenizer$TokenClass$TokenType.TokenType.IDENTIFIER:
        case _Tokenizer$TokenClass$TokenType.TokenType.YIELD:
        case _Tokenizer$TokenClass$TokenType.TokenType.LET:
          defaultBinding = this.parseBindingIdentifier();
          if (!this.eat(_Tokenizer$TokenClass$TokenType.TokenType.COMMA)) {
            return this.markLocation({ type: "Import", defaultBinding: defaultBinding, namedImports: [], moduleSpecifier: this.parseFromClause() }, startLocation);
          }
          break;
      }
      if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.MUL)) {
        return this.markLocation({
          type: "ImportNamespace",
          defaultBinding: defaultBinding,
          namespaceBinding: this.parseNameSpaceBinding(),
          moduleSpecifier: this.parseFromClause() }, startLocation);
      } else if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.LBRACE)) {
        return this.markLocation({
          type: "Import",
          defaultBinding: defaultBinding,
          namedImports: this.parseNamedImports(),
          moduleSpecifier: this.parseFromClause() }, startLocation);
      } else {
        throw this.createUnexpected(this.lookahead);
      }
    }
  }, {
    key: "parseExportSpecifier",
    value: function parseExportSpecifier() {
      var startLocation = this.getLocation();
      var name = this.parseIdentifier();
      if (this.eatContextualKeyword("as")) {
        var exportedName = this.parseIdentifierName();
        return this.markLocation({ type: "ExportSpecifier", name: name, exportedName: exportedName }, startLocation);
      }
      return this.markLocation({ type: "ExportSpecifier", name: null, exportedName: name }, startLocation);
    }
  }, {
    key: "parseExportClause",
    value: function parseExportClause() {
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.LBRACE);
      var result = [];
      while (!this.eat(_Tokenizer$TokenClass$TokenType.TokenType.RBRACE)) {
        result.push(this.parseExportSpecifier());
        if (!this.eat(_Tokenizer$TokenClass$TokenType.TokenType.COMMA)) {
          this.expect(_Tokenizer$TokenClass$TokenType.TokenType.RBRACE);
          break;
        }
      }
      return result;
    }
  }, {
    key: "parseExportDeclaration",
    value: function parseExportDeclaration() {
      var startLocation = this.getLocation(),
          decl = undefined;
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.EXPORT);
      switch (this.lookahead.type) {
        case _Tokenizer$TokenClass$TokenType.TokenType.MUL:
          this.lex();
          // export * FromClause ;
          decl = { type: "ExportAllFrom", moduleSpecifier: this.parseFromClause() };
          break;
        case _Tokenizer$TokenClass$TokenType.TokenType.LBRACE:
          // export ExportClause FromClause ;
          // export ExportClause ;
          var namedExports = this.parseExportClause();
          var moduleSpecifier = null;
          if (this.matchContextualKeyword("from")) {
            moduleSpecifier = this.parseFromClause();
          }
          decl = { type: "ExportFrom", namedExports: namedExports, moduleSpecifier: moduleSpecifier };
          break;
        case _Tokenizer$TokenClass$TokenType.TokenType.CLASS:
          // export ClassDeclaration
          decl = { type: "Export", declaration: this.parseClass({ isExpr: false, inDefault: false }) };
          break;
        case _Tokenizer$TokenClass$TokenType.TokenType.FUNCTION:
          // export HoistableDeclaration
          decl = { type: "Export", declaration: this.parseFunction({ isExpr: false, inDefault: false, allowGenerator: true }) };
          break;
        case _Tokenizer$TokenClass$TokenType.TokenType.DEFAULT:
          this.lex();
          switch (this.lookahead.type) {
            case _Tokenizer$TokenClass$TokenType.TokenType.FUNCTION:
              // export default HoistableDeclaration[Default]
              decl = {
                type: "ExportDefault",
                body: this.parseFunction({ isExpr: false, inDefault: true, allowGenerator: true }) };
              break;
            case _Tokenizer$TokenClass$TokenType.TokenType.CLASS:
              // export default ClassDeclaration[Default]
              decl = { type: "ExportDefault", body: this.parseClass({ isExpr: false, inDefault: true }) };
              break;
            default:
              {
                // export default [lookahead ∉ {function, class}] AssignmentExpression[In] ;
                decl = { type: "ExportDefault", body: this.parseAssignmentExpression() };
                break;
              }
          }
          break;
        case _Tokenizer$TokenClass$TokenType.TokenType.VAR:
        case _Tokenizer$TokenClass$TokenType.TokenType.LET:
        case _Tokenizer$TokenClass$TokenType.TokenType.CONST:
          // export LexicalDeclaration
          decl = { type: "Export", declaration: this.parseVariableDeclaration(true) };
          this.consumeSemicolon();
          break;
        default:
          throw this.createUnexpected(this.lookahead);
      }
      return this.markLocation(decl, startLocation);
    }
  }, {
    key: "parseModuleItem",
    value: function parseModuleItem() {
      switch (this.lookahead.type) {
        case _Tokenizer$TokenClass$TokenType.TokenType.IMPORT:
          return this.parseImportDeclaration();
        case _Tokenizer$TokenClass$TokenType.TokenType.EXPORT:
          return this.parseExportDeclaration();
        default:
          return this.parseStatementListItem();
      }
    }
  }, {
    key: "lookaheadLexicalDeclaration",
    value: function lookaheadLexicalDeclaration() {
      if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.LET) || this.match(_Tokenizer$TokenClass$TokenType.TokenType.CONST)) {
        var lexerState = this.saveLexerState();
        this.lex();
        if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.IDENTIFIER) || this.match(_Tokenizer$TokenClass$TokenType.TokenType.YIELD) || this.match(_Tokenizer$TokenClass$TokenType.TokenType.LET) || this.match(_Tokenizer$TokenClass$TokenType.TokenType.LBRACE) || this.match(_Tokenizer$TokenClass$TokenType.TokenType.LBRACK)) {
          this.restoreLexerState(lexerState);
          return true;
        } else {
          this.restoreLexerState(lexerState);
        }
      }
      return false;
    }
  }, {
    key: "parseStatementListItem",
    value: function parseStatementListItem() {
      if (this.eof()) throw this.createUnexpected(this.lookahead);

      switch (this.lookahead.type) {
        case _Tokenizer$TokenClass$TokenType.TokenType.FUNCTION:
          return this.parseFunction({ isExpr: false, inDefault: false, allowGenerator: true });
        case _Tokenizer$TokenClass$TokenType.TokenType.CLASS:
          return this.parseClass({ isExpr: false, inDefault: false });
        default:
          if (this.lookaheadLexicalDeclaration()) {
            var startLocation = this.getLocation();
            return this.markLocation(this.parseVariableDeclarationStatement(), startLocation);
          } else {
            return this.parseStatement();
          }
      }
    }
  }, {
    key: "parseStatement",
    value: function parseStatement() {
      var startLocation = this.getLocation();
      var stmt = this.isolateCoverGrammar(this.parseStatementHelper);
      return this.markLocation(stmt, startLocation);
    }
  }, {
    key: "parseStatementHelper",
    value: function parseStatementHelper() {
      if (this.eof()) {
        throw this.createUnexpected(this.lookahead);
      }

      switch (this.lookahead.type) {
        case _Tokenizer$TokenClass$TokenType.TokenType.SEMICOLON:
          return this.parseEmptyStatement();
        case _Tokenizer$TokenClass$TokenType.TokenType.LBRACE:
          return this.parseBlockStatement();
        case _Tokenizer$TokenClass$TokenType.TokenType.LPAREN:
          return this.parseExpressionStatement();
        case _Tokenizer$TokenClass$TokenType.TokenType.BREAK:
          return this.parseBreakStatement();
        case _Tokenizer$TokenClass$TokenType.TokenType.CONTINUE:
          return this.parseContinueStatement();
        case _Tokenizer$TokenClass$TokenType.TokenType.DEBUGGER:
          return this.parseDebuggerStatement();
        case _Tokenizer$TokenClass$TokenType.TokenType.DO:
          return this.parseDoWhileStatement();
        case _Tokenizer$TokenClass$TokenType.TokenType.FOR:
          return this.parseForStatement();
        case _Tokenizer$TokenClass$TokenType.TokenType.IF:
          return this.parseIfStatement();
        case _Tokenizer$TokenClass$TokenType.TokenType.RETURN:
          return this.parseReturnStatement();
        case _Tokenizer$TokenClass$TokenType.TokenType.SWITCH:
          return this.parseSwitchStatement();
        case _Tokenizer$TokenClass$TokenType.TokenType.THROW:
          return this.parseThrowStatement();
        case _Tokenizer$TokenClass$TokenType.TokenType.TRY:
          return this.parseTryStatement();
        case _Tokenizer$TokenClass$TokenType.TokenType.VAR:
          return this.parseVariableDeclarationStatement();
        case _Tokenizer$TokenClass$TokenType.TokenType.WHILE:
          return this.parseWhileStatement();
        case _Tokenizer$TokenClass$TokenType.TokenType.WITH:
          return this.parseWithStatement();
        case _Tokenizer$TokenClass$TokenType.TokenType.FUNCTION:
        case _Tokenizer$TokenClass$TokenType.TokenType.CLASS:
          throw this.createUnexpected(this.lookahead);

        default:
          {
            if (this.lookaheadLexicalDeclaration()) {
              throw this.createUnexpected(this.lookahead);
            }
            var _expr = this.parseExpression();
            // 12.12 Labelled Statements;
            if (_expr.type === "IdentifierExpression" && this.eat(_Tokenizer$TokenClass$TokenType.TokenType.COLON)) {
              var labeledBody = this.match(_Tokenizer$TokenClass$TokenType.TokenType.FUNCTION) ? this.parseFunction({ isExpr: false, inDefault: false, allowGenerator: false }) : this.parseStatement();
              return { type: "LabeledStatement", label: _expr.name, body: labeledBody };
            } else {
              this.consumeSemicolon();
              return { type: "ExpressionStatement", expression: _expr };
            }
          }
      }
    }
  }, {
    key: "parseEmptyStatement",
    value: function parseEmptyStatement() {
      this.lex();
      return { type: "EmptyStatement" };
    }
  }, {
    key: "parseBlockStatement",
    value: function parseBlockStatement() {
      return { type: "BlockStatement", block: this.parseBlock() };
    }
  }, {
    key: "parseExpressionStatement",
    value: function parseExpressionStatement() {
      var expr = this.parseExpression();
      this.consumeSemicolon();
      return { type: "ExpressionStatement", expression: expr };
    }
  }, {
    key: "parseBreakStatement",
    value: function parseBreakStatement() {
      this.lex();

      // Catch the very common case first: immediately a semicolon (U+003B).
      if (this.eat(_Tokenizer$TokenClass$TokenType.TokenType.SEMICOLON) || this.hasLineTerminatorBeforeNext) {
        return { type: "BreakStatement", label: null };
      }

      var label = null;
      if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.IDENTIFIER) || this.match(_Tokenizer$TokenClass$TokenType.TokenType.YIELD) || this.match(_Tokenizer$TokenClass$TokenType.TokenType.LET)) {
        label = this.parseIdentifier();
      }

      this.consumeSemicolon();

      return { type: "BreakStatement", label: label };
    }
  }, {
    key: "parseContinueStatement",
    value: function parseContinueStatement() {
      this.lex();

      // Catch the very common case first: immediately a semicolon (U+003B).
      if (this.eat(_Tokenizer$TokenClass$TokenType.TokenType.SEMICOLON) || this.hasLineTerminatorBeforeNext) {
        return { type: "ContinueStatement", label: null };
      }

      var label = null;
      if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.IDENTIFIER) || this.match(_Tokenizer$TokenClass$TokenType.TokenType.YIELD) || this.match(_Tokenizer$TokenClass$TokenType.TokenType.LET)) {
        label = this.parseIdentifier();
      }

      this.consumeSemicolon();

      return { type: "ContinueStatement", label: label };
    }
  }, {
    key: "parseDebuggerStatement",
    value: function parseDebuggerStatement() {
      this.lex();
      this.consumeSemicolon();
      return { type: "DebuggerStatement" };
    }
  }, {
    key: "parseDoWhileStatement",
    value: function parseDoWhileStatement() {
      this.lex();
      var body = this.parseStatement();
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.WHILE);
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.LPAREN);
      var test = this.parseExpression();
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.RPAREN);
      this.eat(_Tokenizer$TokenClass$TokenType.TokenType.SEMICOLON);
      return { type: "DoWhileStatement", body: body, test: test };
    }
  }, {
    key: "parseForStatement",
    value: function parseForStatement() {
      this.lex();
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.LPAREN);
      var test = null;
      var right = null;
      if (this.eat(_Tokenizer$TokenClass$TokenType.TokenType.SEMICOLON)) {
        if (!this.match(_Tokenizer$TokenClass$TokenType.TokenType.SEMICOLON)) {
          test = this.parseExpression();
        }
        this.expect(_Tokenizer$TokenClass$TokenType.TokenType.SEMICOLON);
        if (!this.match(_Tokenizer$TokenClass$TokenType.TokenType.RPAREN)) {
          right = this.parseExpression();
        }
        return { type: "ForStatement", init: null, test: test, update: right, body: this.getIteratorStatementEpilogue() };
      } else {
        var startsWithLet = this.match(_Tokenizer$TokenClass$TokenType.TokenType.LET);
        var isForDecl = this.lookaheadLexicalDeclaration();
        var leftLocation = this.getLocation();
        if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.VAR) || isForDecl) {
          var previousAllowIn = this.allowIn;
          this.allowIn = false;
          var init = this.parseVariableDeclaration(false);
          this.allowIn = previousAllowIn;

          if (init.declarators.length === 1 && (this.match(_Tokenizer$TokenClass$TokenType.TokenType.IN) || this.matchContextualKeyword("of"))) {
            var type = undefined;

            if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.IN)) {
              if (init.declarators[0].init != null) {
                throw this.createError(_ErrorMessages.ErrorMessages.INVALID_VAR_INIT_FOR_IN);
              }
              type = "ForInStatement";
              this.lex();
              right = this.parseExpression();
            } else {
              if (init.declarators[0].init != null) {
                throw this.createError(_ErrorMessages.ErrorMessages.INVALID_VAR_INIT_FOR_OF);
              }
              type = "ForOfStatement";
              this.lex();
              right = this.parseAssignmentExpression();
            }

            var body = this.getIteratorStatementEpilogue();

            return { type: type, left: init, right: right, body: body };
          } else {
            this.expect(_Tokenizer$TokenClass$TokenType.TokenType.SEMICOLON);
            if (!this.match(_Tokenizer$TokenClass$TokenType.TokenType.SEMICOLON)) {
              test = this.parseExpression();
            }
            this.expect(_Tokenizer$TokenClass$TokenType.TokenType.SEMICOLON);
            if (!this.match(_Tokenizer$TokenClass$TokenType.TokenType.RPAREN)) {
              right = this.parseExpression();
            }
            return { type: "ForStatement", init: init, test: test, update: right, body: this.getIteratorStatementEpilogue() };
          }
        } else {
          var previousAllowIn = this.allowIn;
          this.allowIn = false;
          var _expr2 = this.inheritCoverGrammar(this.parseAssignmentExpressionOrBindingElement);
          this.allowIn = previousAllowIn;

          if (this.isAssignmentTarget && _expr2.type !== "AssignmentExpression" && (this.match(_Tokenizer$TokenClass$TokenType.TokenType.IN) || this.matchContextualKeyword("of"))) {
            if (startsWithLet && this.matchContextualKeyword("of")) {
              throw this.createError(_ErrorMessages.ErrorMessages.INVALID_LHS_IN_FOR_OF);
            }
            var type = this.match(_Tokenizer$TokenClass$TokenType.TokenType.IN) ? "ForInStatement" : "ForOfStatement";

            this.lex();
            right = this.parseExpression();

            return { type: type, left: transformDestructuring(_expr2), right: right, body: this.getIteratorStatementEpilogue() };
          } else {
            if (this.firstExprError) {
              throw this.firstExprError;
            }
            while (this.eat(_Tokenizer$TokenClass$TokenType.TokenType.COMMA)) {
              var rhs = this.parseAssignmentExpression();
              _expr2 = this.markLocation({ type: "BinaryExpression", left: _expr2, operator: ",", right: rhs }, leftLocation);
            }
            if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.IN)) {
              throw this.createError(_ErrorMessages.ErrorMessages.INVALID_LHS_IN_FOR_IN);
            }
            if (this.matchContextualKeyword("of")) {
              throw this.createError(_ErrorMessages.ErrorMessages.INVALID_LHS_IN_FOR_OF);
            }
            this.expect(_Tokenizer$TokenClass$TokenType.TokenType.SEMICOLON);
            if (!this.match(_Tokenizer$TokenClass$TokenType.TokenType.SEMICOLON)) {
              test = this.parseExpression();
            }
            this.expect(_Tokenizer$TokenClass$TokenType.TokenType.SEMICOLON);
            if (!this.match(_Tokenizer$TokenClass$TokenType.TokenType.RPAREN)) {
              right = this.parseExpression();
            }
            return { type: "ForStatement", init: _expr2, test: test, update: right, body: this.getIteratorStatementEpilogue() };
          }
        }
      }
    }
  }, {
    key: "getIteratorStatementEpilogue",
    value: function getIteratorStatementEpilogue() {
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.RPAREN);
      var body = this.parseStatement();
      return body;
    }
  }, {
    key: "parseIfStatement",
    value: function parseIfStatement() {
      this.lex();
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.LPAREN);
      var test = this.parseExpression();
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.RPAREN);
      var consequent = this.parseStatement();
      var alternate = null;
      if (this.eat(_Tokenizer$TokenClass$TokenType.TokenType.ELSE)) {
        alternate = this.parseStatement();
      }
      return { type: "IfStatement", test: test, consequent: consequent, alternate: alternate };
    }
  }, {
    key: "parseReturnStatement",
    value: function parseReturnStatement() {
      if (!this.inFunctionBody) {
        throw this.createError(_ErrorMessages.ErrorMessages.ILLEGAL_RETURN);
      }

      this.lex();

      if (this.hasLineTerminatorBeforeNext) {
        return { type: "ReturnStatement", expression: null };
      }

      var expression = null;
      if (!this.match(_Tokenizer$TokenClass$TokenType.TokenType.SEMICOLON)) {
        if (!this.match(_Tokenizer$TokenClass$TokenType.TokenType.RBRACE) && !this.eof()) {
          expression = this.parseExpression();
        }
      }

      this.consumeSemicolon();
      return { type: "ReturnStatement", expression: expression };
    }
  }, {
    key: "parseSwitchStatement",
    value: function parseSwitchStatement() {
      this.lex();
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.LPAREN);
      var discriminant = this.parseExpression();
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.RPAREN);
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.LBRACE);

      if (this.eat(_Tokenizer$TokenClass$TokenType.TokenType.RBRACE)) {
        return { type: "SwitchStatement", discriminant: discriminant, cases: [] };
      }

      var cases = this.parseSwitchCases();
      if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.DEFAULT)) {
        var defaultCase = this.parseSwitchDefault();
        var postDefaultCases = this.parseSwitchCases();
        if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.DEFAULT)) {
          throw this.createError(_ErrorMessages.ErrorMessages.MULTIPLE_DEFAULTS_IN_SWITCH);
        }
        this.expect(_Tokenizer$TokenClass$TokenType.TokenType.RBRACE);
        return {
          type: "SwitchStatementWithDefault",
          discriminant: discriminant,
          preDefaultCases: cases,
          defaultCase: defaultCase,
          postDefaultCases: postDefaultCases };
      } else {
        this.expect(_Tokenizer$TokenClass$TokenType.TokenType.RBRACE);
        return { type: "SwitchStatement", discriminant: discriminant, cases: cases };
      }
    }
  }, {
    key: "parseSwitchCases",
    value: function parseSwitchCases() {
      var result = [];
      while (!(this.eof() || this.match(_Tokenizer$TokenClass$TokenType.TokenType.RBRACE) || this.match(_Tokenizer$TokenClass$TokenType.TokenType.DEFAULT))) {
        result.push(this.parseSwitchCase());
      }
      return result;
    }
  }, {
    key: "parseSwitchCase",
    value: function parseSwitchCase() {
      var startLocation = this.getLocation();
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.CASE);
      return this.markLocation({
        type: "SwitchCase",
        test: this.parseExpression(),
        consequent: this.parseSwitchCaseBody() }, startLocation);
    }
  }, {
    key: "parseSwitchDefault",
    value: function parseSwitchDefault() {
      var startLocation = this.getLocation();
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.DEFAULT);
      return this.markLocation({ type: "SwitchDefault", consequent: this.parseSwitchCaseBody() }, startLocation);
    }
  }, {
    key: "parseSwitchCaseBody",
    value: function parseSwitchCaseBody() {
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.COLON);
      return this.parseStatementListInSwitchCaseBody();
    }
  }, {
    key: "parseStatementListInSwitchCaseBody",
    value: function parseStatementListInSwitchCaseBody() {
      var result = [];
      while (!(this.eof() || this.match(_Tokenizer$TokenClass$TokenType.TokenType.RBRACE) || this.match(_Tokenizer$TokenClass$TokenType.TokenType.DEFAULT) || this.match(_Tokenizer$TokenClass$TokenType.TokenType.CASE))) {
        result.push(this.parseStatementListItem());
      }
      return result;
    }
  }, {
    key: "parseThrowStatement",
    value: function parseThrowStatement() {
      var token = this.lex();
      if (this.hasLineTerminatorBeforeNext) {
        throw this.createErrorWithLocation(token, _ErrorMessages.ErrorMessages.NEWLINE_AFTER_THROW);
      }
      var expression = this.parseExpression();
      this.consumeSemicolon();
      return { type: "ThrowStatement", expression: expression };
    }
  }, {
    key: "parseTryStatement",
    value: function parseTryStatement() {
      this.lex();
      var body = this.parseBlock();

      if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.CATCH)) {
        var catchClause = this.parseCatchClause();
        if (this.eat(_Tokenizer$TokenClass$TokenType.TokenType.FINALLY)) {
          var finalizer = this.parseBlock();
          return { type: "TryFinallyStatement", body: body, catchClause: catchClause, finalizer: finalizer };
        }
        return { type: "TryCatchStatement", body: body, catchClause: catchClause };
      }

      if (this.eat(_Tokenizer$TokenClass$TokenType.TokenType.FINALLY)) {
        var finalizer = this.parseBlock();
        return { type: "TryFinallyStatement", body: body, catchClause: null, finalizer: finalizer };
      } else {
        throw this.createError(_ErrorMessages.ErrorMessages.NO_CATCH_OR_FINALLY);
      }
    }
  }, {
    key: "parseVariableDeclarationStatement",
    value: function parseVariableDeclarationStatement() {
      var declaration = this.parseVariableDeclaration(true);
      this.consumeSemicolon();
      return { type: "VariableDeclarationStatement", declaration: declaration };
    }
  }, {
    key: "parseWhileStatement",
    value: function parseWhileStatement() {
      this.lex();
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.LPAREN);
      var test = this.parseExpression();
      var body = this.getIteratorStatementEpilogue();
      return { type: "WhileStatement", test: test, body: body };
    }
  }, {
    key: "parseWithStatement",
    value: function parseWithStatement() {
      this.lex();
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.LPAREN);
      var object = this.parseExpression();
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.RPAREN);
      var body = this.parseStatement();
      return { type: "WithStatement", object: object, body: body };
    }
  }, {
    key: "parseCatchClause",
    value: function parseCatchClause() {
      var startLocation = this.getLocation();

      this.lex();
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.LPAREN);
      if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.RPAREN) || this.match(_Tokenizer$TokenClass$TokenType.TokenType.LPAREN)) {
        throw this.createUnexpected(this.lookahead);
      }
      var binding = this.parseBindingTarget();
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.RPAREN);
      var body = this.parseBlock();

      return this.markLocation({ type: "CatchClause", binding: binding, body: body }, startLocation);
    }
  }, {
    key: "parseBlock",
    value: function parseBlock() {
      var startLocation = this.getLocation();
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.LBRACE);
      var body = [];
      while (!this.match(_Tokenizer$TokenClass$TokenType.TokenType.RBRACE)) {
        body.push(this.parseStatementListItem());
      }
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.RBRACE);
      return this.markLocation({ type: "Block", statements: body }, startLocation);
    }
  }, {
    key: "parseVariableDeclaration",
    value: function parseVariableDeclaration(bindingPatternsMustHaveInit) {
      var startLocation = this.getLocation();
      var token = this.lex();

      // preceded by this.match(TokenSubType.VAR) || this.match(TokenSubType.LET);
      var kind = token.type === _Tokenizer$TokenClass$TokenType.TokenType.VAR ? "var" : token.type === _Tokenizer$TokenClass$TokenType.TokenType.CONST ? "const" : "let";
      var declarators = this.parseVariableDeclaratorList(bindingPatternsMustHaveInit);
      return this.markLocation({ type: "VariableDeclaration", kind: kind, declarators: declarators }, startLocation);
    }
  }, {
    key: "parseVariableDeclaratorList",
    value: function parseVariableDeclaratorList(bindingPatternsMustHaveInit) {
      var result = [];
      do {
        result.push(this.parseVariableDeclarator(bindingPatternsMustHaveInit));
      } while (this.eat(_Tokenizer$TokenClass$TokenType.TokenType.COMMA));
      return result;
    }
  }, {
    key: "parseVariableDeclarator",
    value: function parseVariableDeclarator(bindingPatternsMustHaveInit) {
      var startLocation = this.getLocation();

      if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.LPAREN)) {
        throw this.createUnexpected(this.lookahead);
      }

      var binding = this.parseBindingTarget();
      if (bindingPatternsMustHaveInit && binding.type !== "BindingIdentifier" && !this.match(_Tokenizer$TokenClass$TokenType.TokenType.ASSIGN)) {
        this.expect(_Tokenizer$TokenClass$TokenType.TokenType.ASSIGN);
      }

      var init = null;
      if (this.eat(_Tokenizer$TokenClass$TokenType.TokenType.ASSIGN)) {
        init = this.parseAssignmentExpression();
      }

      return this.markLocation({ type: "VariableDeclarator", binding: binding, init: init }, startLocation);
    }
  }, {
    key: "isolateCoverGrammar",
    value: function isolateCoverGrammar(parser) {
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
  }, {
    key: "inheritCoverGrammar",
    value: function inheritCoverGrammar(parser) {
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
  }, {
    key: "parseExpression",
    value: function parseExpression() {
      var startLocation = this.getLocation();

      var left = this.parseAssignmentExpression();
      if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.COMMA)) {
        while (!this.eof()) {
          if (!this.match(_Tokenizer$TokenClass$TokenType.TokenType.COMMA)) break;
          this.lex();
          var right = this.parseAssignmentExpression();
          left = this.markLocation({ type: "BinaryExpression", left: left, operator: ",", right: right }, startLocation);
        }
      }
      return left;
    }
  }, {
    key: "parseArrowExpressionTail",
    value: function parseArrowExpressionTail(head, startLocation) {
      var arrow = this.expect(_Tokenizer$TokenClass$TokenType.TokenType.ARROW);

      // Convert param list.
      var _head$params = head.params;
      var params = _head$params === undefined ? null : _head$params;
      var _head$rest = head.rest;
      var rest = _head$rest === undefined ? null : _head$rest;

      if (head.type !== ARROW_EXPRESSION_PARAMS) {
        if (head.type === "IdentifierExpression") {
          params = [transformDestructuring(head)];
        } else {
          throw this.createUnexpected(arrow);
        }
      }

      var paramsNode = this.markLocation({ type: "FormalParameters", items: params, rest: rest }, startLocation);

      if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.LBRACE)) {
        var _previousYield = this.allowYieldExpression;
        this.allowYieldExpression = false;
        var body = this.parseFunctionBody();
        this.allowYieldExpression = _previousYield;
        return this.markLocation({ type: "ArrowExpression", params: paramsNode, body: body }, startLocation);
      } else {
        var body = this.parseAssignmentExpression();
        return this.markLocation({ type: "ArrowExpression", params: paramsNode, body: body }, startLocation);
      }
    }
  }, {
    key: "parseAssignmentExpression",
    value: function parseAssignmentExpression() {
      return this.isolateCoverGrammar(this.parseAssignmentExpressionOrBindingElement);
    }
  }, {
    key: "parseAssignmentExpressionOrBindingElement",
    value: function parseAssignmentExpressionOrBindingElement() {
      var startLocation = this.getLocation();

      if (this.allowYieldExpression && !this.inGeneratorParameter && this.match(_Tokenizer$TokenClass$TokenType.TokenType.YIELD)) {
        this.isBindingElement = this.isAssignmentTarget = false;
        return this.parseYieldExpression();
      }

      var expr = this.parseConditionalExpression();

      if (!this.hasLineTerminatorBeforeNext && this.match(_Tokenizer$TokenClass$TokenType.TokenType.ARROW)) {
        this.isBindingElement = this.isAssignmentTarget = false;
        this.firstExprError = null;
        return this.parseArrowExpressionTail(expr, startLocation);
      }

      var isAssignmentOperator = false;
      var operator = this.lookahead;
      switch (operator.type) {
        case _Tokenizer$TokenClass$TokenType.TokenType.ASSIGN_BIT_OR:
        case _Tokenizer$TokenClass$TokenType.TokenType.ASSIGN_BIT_XOR:
        case _Tokenizer$TokenClass$TokenType.TokenType.ASSIGN_BIT_AND:
        case _Tokenizer$TokenClass$TokenType.TokenType.ASSIGN_SHL:
        case _Tokenizer$TokenClass$TokenType.TokenType.ASSIGN_SHR:
        case _Tokenizer$TokenClass$TokenType.TokenType.ASSIGN_SHR_UNSIGNED:
        case _Tokenizer$TokenClass$TokenType.TokenType.ASSIGN_ADD:
        case _Tokenizer$TokenClass$TokenType.TokenType.ASSIGN_SUB:
        case _Tokenizer$TokenClass$TokenType.TokenType.ASSIGN_MUL:
        case _Tokenizer$TokenClass$TokenType.TokenType.ASSIGN_DIV:
        case _Tokenizer$TokenClass$TokenType.TokenType.ASSIGN_MOD:
          isAssignmentOperator = true;
          break;
      }
      if (isAssignmentOperator) {
        if (!this.isAssignmentTarget || !isValidSimpleAssignmentTarget(expr)) {
          throw this.createError(_ErrorMessages.ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
        }
        expr = transformDestructuring(expr);
      } else if (operator.type === _Tokenizer$TokenClass$TokenType.TokenType.ASSIGN) {
        if (!this.isAssignmentTarget) {
          throw this.createError(_ErrorMessages.ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
        }
        expr = transformDestructuring(expr);
      } else {
        return expr;
      }

      this.lex();
      var previousInGeneratorParameter = this.inGeneratorParameter;
      this.inGeneratorParameter = false;
      var rhs = this.parseAssignmentExpression();

      this.inGeneratorParameter = previousInGeneratorParameter;
      this.firstExprError = null;
      return this.markLocation({
        type: "AssignmentExpression",
        binding: expr,
        operator: operator.type.name,
        expression: rhs }, startLocation);
    }
  }, {
    key: "lookaheadAssignmentExpression",
    value: function lookaheadAssignmentExpression() {
      switch (this.lookahead.type) {
        case _Tokenizer$TokenClass$TokenType.TokenType.ADD:
        case _Tokenizer$TokenClass$TokenType.TokenType.ASSIGN_DIV:
        case _Tokenizer$TokenClass$TokenType.TokenType.CLASS:
        case _Tokenizer$TokenClass$TokenType.TokenType.DEC:
        case _Tokenizer$TokenClass$TokenType.TokenType.DIV:
        case _Tokenizer$TokenClass$TokenType.TokenType.FALSE:
        case _Tokenizer$TokenClass$TokenType.TokenType.FUNCTION:
        case _Tokenizer$TokenClass$TokenType.TokenType.IDENTIFIER:
        case _Tokenizer$TokenClass$TokenType.TokenType.LET:
        case _Tokenizer$TokenClass$TokenType.TokenType.LBRACE:
        case _Tokenizer$TokenClass$TokenType.TokenType.LBRACK:
        case _Tokenizer$TokenClass$TokenType.TokenType.LPAREN:
        case _Tokenizer$TokenClass$TokenType.TokenType.NEW:
        case _Tokenizer$TokenClass$TokenType.TokenType.NOT:
        case _Tokenizer$TokenClass$TokenType.TokenType.NULL:
        case _Tokenizer$TokenClass$TokenType.TokenType.NUMBER:
        case _Tokenizer$TokenClass$TokenType.TokenType.STRING:
        case _Tokenizer$TokenClass$TokenType.TokenType.SUB:
        case _Tokenizer$TokenClass$TokenType.TokenType.THIS:
        case _Tokenizer$TokenClass$TokenType.TokenType.TRUE:
        case _Tokenizer$TokenClass$TokenType.TokenType.YIELD:
        case _Tokenizer$TokenClass$TokenType.TokenType.TEMPLATE:
          return true;
      }
      return false;
    }
  }, {
    key: "parseYieldExpression",
    value: function parseYieldExpression() {
      var startLocation = this.getLocation();

      this.lex();
      if (this.hasLineTerminatorBeforeNext) {
        return this.markLocation({ type: "YieldExpression", expression: null }, startLocation);
      }
      var isGenerator = !!this.eat(_Tokenizer$TokenClass$TokenType.TokenType.MUL);
      var previousYield = this.allowYieldExpression;
      var expr = null;
      if (isGenerator || this.lookaheadAssignmentExpression()) {
        expr = this.parseAssignmentExpression();
      }
      this.allowYieldExpression = previousYield;
      var type = isGenerator ? "YieldGeneratorExpression" : "YieldExpression";
      return this.markLocation({ type: type, expression: expr }, startLocation);
    }
  }, {
    key: "parseConditionalExpression",
    value: function parseConditionalExpression() {
      var startLocation = this.getLocation();
      var test = this.parseBinaryExpression();
      if (this.firstExprError) {
        return test;
      }if (this.eat(_Tokenizer$TokenClass$TokenType.TokenType.CONDITIONAL)) {
        var previousAllowIn = this.allowIn;
        this.allowIn = true;
        var consequent = this.isolateCoverGrammar(this.parseAssignmentExpression);
        this.allowIn = previousAllowIn;
        this.expect(_Tokenizer$TokenClass$TokenType.TokenType.COLON);
        var alternate = this.isolateCoverGrammar(this.parseAssignmentExpression);
        return this.markLocation({ type: "ConditionalExpression", test: test, consequent: consequent, alternate: alternate }, startLocation);
      }
      return test;
    }
  }, {
    key: "isBinaryOperator",
    value: function isBinaryOperator(type) {
      switch (type) {
        case _Tokenizer$TokenClass$TokenType.TokenType.OR:
        case _Tokenizer$TokenClass$TokenType.TokenType.AND:
        case _Tokenizer$TokenClass$TokenType.TokenType.BIT_OR:
        case _Tokenizer$TokenClass$TokenType.TokenType.BIT_XOR:
        case _Tokenizer$TokenClass$TokenType.TokenType.BIT_AND:
        case _Tokenizer$TokenClass$TokenType.TokenType.EQ:
        case _Tokenizer$TokenClass$TokenType.TokenType.NE:
        case _Tokenizer$TokenClass$TokenType.TokenType.EQ_STRICT:
        case _Tokenizer$TokenClass$TokenType.TokenType.NE_STRICT:
        case _Tokenizer$TokenClass$TokenType.TokenType.LT:
        case _Tokenizer$TokenClass$TokenType.TokenType.GT:
        case _Tokenizer$TokenClass$TokenType.TokenType.LTE:
        case _Tokenizer$TokenClass$TokenType.TokenType.GTE:
        case _Tokenizer$TokenClass$TokenType.TokenType.INSTANCEOF:
        case _Tokenizer$TokenClass$TokenType.TokenType.SHL:
        case _Tokenizer$TokenClass$TokenType.TokenType.SHR:
        case _Tokenizer$TokenClass$TokenType.TokenType.SHR_UNSIGNED:
        case _Tokenizer$TokenClass$TokenType.TokenType.ADD:
        case _Tokenizer$TokenClass$TokenType.TokenType.SUB:
        case _Tokenizer$TokenClass$TokenType.TokenType.MUL:
        case _Tokenizer$TokenClass$TokenType.TokenType.DIV:
        case _Tokenizer$TokenClass$TokenType.TokenType.MOD:
          return true;
        case _Tokenizer$TokenClass$TokenType.TokenType.IN:
          return this.allowIn;
        default:
          return false;
      }
    }
  }, {
    key: "parseBinaryExpression",
    value: function parseBinaryExpression() {
      var _this = this;

      var startLocation = this.getLocation();
      var left = this.parseUnaryExpression();
      if (this.firstExprError) {
        return left;
      }

      var operator = this.lookahead.type;

      if (!this.isBinaryOperator(operator)) {
        return left;
      }this.isBindingElement = this.isAssignmentTarget = false;

      this.lex();
      var stack = [];
      stack.push({ startLocation: startLocation, left: left, operator: operator, precedence: BinaryPrecedence[operator.name] });
      startLocation = this.getLocation();
      var right = this.isolateCoverGrammar(this.parseUnaryExpression);
      operator = this.lookahead.type;
      while (this.isBinaryOperator(operator)) {
        var precedence = BinaryPrecedence[operator.name];
        // Reduce: make a binary expression from the three topmost entries.
        while (stack.length && precedence <= stack[stack.length - 1].precedence) {
          var stackItem = stack[stack.length - 1];
          var stackOperator = stackItem.operator;
          left = stackItem.left;
          stack.pop();
          startLocation = stackItem.startLocation;
          right = this.markLocation({ type: "BinaryExpression", left: left, operator: stackOperator.name, right: right }, startLocation);
        }

        this.lex();
        stack.push({ startLocation: startLocation, left: right, operator: operator, precedence: precedence });

        startLocation = this.getLocation();
        right = this.isolateCoverGrammar(this.parseUnaryExpression);
        operator = this.lookahead.type;
      }

      // Final reduce to clean-up the stack.
      return stack.reduceRight(function (expr, stackItem) {
        return _this.markLocation({
          type: "BinaryExpression",
          left: stackItem.left,
          operator: stackItem.operator.name,
          right: expr }, stackItem.startLocation);
      }, right);
    }
  }, {
    key: "parseUnaryExpression",
    value: function parseUnaryExpression() {
      if (this.lookahead.type.klass !== _Tokenizer$TokenClass$TokenType.TokenClass.Punctuator && this.lookahead.type.klass !== _Tokenizer$TokenClass$TokenType.TokenClass.Keyword) {
        return this.parsePostfixExpression();
      }
      var startLocation = this.getLocation();
      var operator = this.lookahead;
      if (!isPrefixOperator(operator.type)) {
        return this.parsePostfixExpression();
      }

      this.lex();
      this.isBindingElement = this.isAssignmentTarget = false;
      var expr = this.isolateCoverGrammar(this.parseUnaryExpression);

      return this.markLocation({ type: "PrefixExpression", operator: operator.value, operand: expr }, startLocation);
    }
  }, {
    key: "parsePostfixExpression",
    value: function parsePostfixExpression() {
      var startLocation = this.getLocation();

      var operand = this.parseLeftHandSideExpression({ allowCall: true });
      if (this.firstExprError || this.hasLineTerminatorBeforeNext) {
        return operand;
      }var operator = this.lookahead;
      if (operator.type !== _Tokenizer$TokenClass$TokenType.TokenType.INC && operator.type !== _Tokenizer$TokenClass$TokenType.TokenType.DEC) {
        return operand;
      }this.lex();

      return this.markLocation({ type: "PostfixExpression", operand: operand, operator: operator.value }, startLocation);
    }
  }, {
    key: "parseLeftHandSideExpression",
    value: function parseLeftHandSideExpression(_ref) {
      var allowCall = _ref.allowCall;

      var startLocation = this.getLocation();
      var previousAllowIn = this.allowIn;
      this.allowIn = allowCall;

      var expr = undefined,
          token = this.lookahead;

      if (this.eat(_Tokenizer$TokenClass$TokenType.TokenType.SUPER)) {
        this.isBindingElement = false;
        this.isAssignmentTarget = false;
        expr = this.markLocation({ type: "Super" }, startLocation);
        if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.LPAREN)) {
          if (allowCall) {
            expr = this.markLocation({
              type: "CallExpression",
              callee: expr,
              arguments: this.parseArgumentList() }, startLocation);
          } else {
            throw this.createUnexpected(token);
          }
        } else if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.LBRACK)) {
          expr = this.markLocation({
            type: "ComputedMemberExpression",
            object: expr,
            expression: this.parseComputedMember() }, startLocation);
          this.isAssignmentTarget = true;
        } else if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.PERIOD)) {
          expr = this.markLocation({
            type: "StaticMemberExpression",
            object: expr,
            property: this.parseStaticMember() }, startLocation);
          this.isAssignmentTarget = true;
        } else {
          throw this.createUnexpected(token);
        }
      } else if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.NEW)) {
        this.isBindingElement = this.isAssignmentTarget = false;
        expr = this.parseNewExpression();
      } else {
        expr = this.parsePrimaryExpression();
        if (this.firstExprError) {
          return expr;
        }
      }

      while (true) {
        if (allowCall && this.match(_Tokenizer$TokenClass$TokenType.TokenType.LPAREN)) {
          this.isBindingElement = this.isAssignmentTarget = false;
          expr = this.markLocation({
            type: "CallExpression",
            callee: expr,
            arguments: this.parseArgumentList() }, startLocation);
        } else if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.LBRACK)) {
          this.isBindingElement = false;
          this.isAssignmentTarget = true;
          expr = this.markLocation({
            type: "ComputedMemberExpression",
            object: expr,
            expression: this.parseComputedMember() }, startLocation);
        } else if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.PERIOD)) {
          this.isBindingElement = false;
          this.isAssignmentTarget = true;
          expr = this.markLocation({
            type: "StaticMemberExpression",
            object: expr,
            property: this.parseStaticMember() }, startLocation);
        } else if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.TEMPLATE)) {
          this.isBindingElement = this.isAssignmentTarget = false;
          expr = this.markLocation({
            type: "TemplateExpression",
            tag: expr,
            elements: this.parseTemplateElements() }, startLocation);
        } else {
          break;
        }
      }

      this.allowIn = previousAllowIn;

      return expr;
    }
  }, {
    key: "parseTemplateElements",
    value: function parseTemplateElements() {
      var startLocation = this.getLocation();
      var token = this.lookahead;
      if (token.tail) {
        this.lex();
        return [this.markLocation({ type: "TemplateElement", rawValue: token.slice.text.slice(1, -1) }, startLocation)];
      }
      var result = [this.markLocation({ type: "TemplateElement", rawValue: this.lex().slice.text.slice(1, -2) }, startLocation)];
      while (true) {
        result.push(this.parseExpression());
        if (!this.match(_Tokenizer$TokenClass$TokenType.TokenType.RBRACE)) {
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
  }, {
    key: "parseStaticMember",
    value: function parseStaticMember() {
      this.lex();
      if (!this.lookahead.type.klass.isIdentifierName) {
        throw this.createUnexpected(this.lookahead);
      } else {
        return this.lex().value;
      }
    }
  }, {
    key: "parseComputedMember",
    value: function parseComputedMember() {
      this.lex();
      var expr = this.parseExpression();
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.RBRACK);
      return expr;
    }
  }, {
    key: "parseNewExpression",
    value: function parseNewExpression() {
      var _this2 = this;

      var startLocation = this.getLocation();
      this.lex();
      if (this.eat(_Tokenizer$TokenClass$TokenType.TokenType.PERIOD)) {
        var ident = this.expect(_Tokenizer$TokenClass$TokenType.TokenType.IDENTIFIER);
        if (ident.value !== "target") {
          throw this.createUnexpected(ident);
        }
        return this.markLocation({ type: "NewTargetExpression" }, startLocation);
      }
      var callee = this.isolateCoverGrammar(function () {
        return _this2.parseLeftHandSideExpression({ allowCall: false });
      });
      return this.markLocation({
        type: "NewExpression",
        callee: callee,
        arguments: this.match(_Tokenizer$TokenClass$TokenType.TokenType.LPAREN) ? this.parseArgumentList() : [] }, startLocation);
    }
  }, {
    key: "parsePrimaryExpression",
    value: function parsePrimaryExpression() {
      if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.LPAREN)) {
        return this.parseGroupExpression();
      }

      var startLocation = this.getLocation();

      switch (this.lookahead.type) {
        case _Tokenizer$TokenClass$TokenType.TokenType.IDENTIFIER:
        case _Tokenizer$TokenClass$TokenType.TokenType.YIELD:
        case _Tokenizer$TokenClass$TokenType.TokenType.LET:
          return this.markLocation({ type: "IdentifierExpression", name: this.parseIdentifier() }, startLocation);
        case _Tokenizer$TokenClass$TokenType.TokenType.STRING:
          this.isBindingElement = this.isAssignmentTarget = false;
          return this.parseStringLiteral();
        case _Tokenizer$TokenClass$TokenType.TokenType.NUMBER:
          this.isBindingElement = this.isAssignmentTarget = false;
          return this.parseNumericLiteral();
        case _Tokenizer$TokenClass$TokenType.TokenType.THIS:
          this.lex();
          this.isBindingElement = this.isAssignmentTarget = false;
          return this.markLocation({ type: "ThisExpression" }, startLocation);
        case _Tokenizer$TokenClass$TokenType.TokenType.FUNCTION:
          this.isBindingElement = this.isAssignmentTarget = false;
          return this.markLocation(this.parseFunction({ isExpr: true, inDefault: false, allowGenerator: true }), startLocation);
        case _Tokenizer$TokenClass$TokenType.TokenType.TRUE:
          this.lex();
          this.isBindingElement = this.isAssignmentTarget = false;
          return this.markLocation({ type: "LiteralBooleanExpression", value: true }, startLocation);
        case _Tokenizer$TokenClass$TokenType.TokenType.FALSE:
          this.lex();
          this.isBindingElement = this.isAssignmentTarget = false;
          return this.markLocation({ type: "LiteralBooleanExpression", value: false }, startLocation);
        case _Tokenizer$TokenClass$TokenType.TokenType.NULL:
          this.lex();
          this.isBindingElement = this.isAssignmentTarget = false;
          return this.markLocation({ type: "LiteralNullExpression" }, startLocation);
        case _Tokenizer$TokenClass$TokenType.TokenType.LBRACK:
          return this.parseArrayExpression();
        case _Tokenizer$TokenClass$TokenType.TokenType.LBRACE:
          return this.parseObjectExpression();
        case _Tokenizer$TokenClass$TokenType.TokenType.TEMPLATE:
          this.isBindingElement = this.isAssignmentTarget = false;
          return this.markLocation({ type: "TemplateExpression", tag: null, elements: this.parseTemplateElements() }, startLocation);
        case _Tokenizer$TokenClass$TokenType.TokenType.DIV:
        case _Tokenizer$TokenClass$TokenType.TokenType.ASSIGN_DIV:
          this.isBindingElement = this.isAssignmentTarget = false;
          this.lookahead = this.scanRegExp(this.match(_Tokenizer$TokenClass$TokenType.TokenType.DIV) ? "/" : "/=");
          var token = this.lex();
          var lastSlash = token.value.lastIndexOf("/");
          var pattern = token.value.slice(1, lastSlash);
          var flags = token.value.slice(lastSlash + 1);
          return this.markLocation({ type: "LiteralRegExpExpression", pattern: pattern, flags: flags }, startLocation);
        case _Tokenizer$TokenClass$TokenType.TokenType.CLASS:
          this.isBindingElement = this.isAssignmentTarget = false;
          return this.parseClass({ isExpr: true, inDefault: false });
        default:
          throw this.createUnexpected(this.lookahead);
      }
    }
  }, {
    key: "parseNumericLiteral",
    value: function parseNumericLiteral() {
      var startLocation = this.getLocation();
      var token = this.lex();
      var node = token.value === 1 / 0 ? { type: "LiteralInfinityExpression" } : { type: "LiteralNumericExpression", value: token.value };
      return this.markLocation(node, startLocation);
    }
  }, {
    key: "parseStringLiteral",
    value: function parseStringLiteral() {
      var startLocation = this.getLocation();
      return this.markLocation({ type: "LiteralStringExpression", value: this.lex().str }, startLocation);
    }
  }, {
    key: "parseIdentifierName",
    value: function parseIdentifierName() {
      if (this.lookahead.type.klass.isIdentifierName) {
        return this.lex().value;
      } else {
        throw this.createUnexpected(this.lookahead);
      }
    }
  }, {
    key: "parseBindingIdentifier",
    value: function parseBindingIdentifier() {
      var startLocation = this.getLocation();
      return this.markLocation({ type: "BindingIdentifier", name: this.parseIdentifier() }, startLocation);
    }
  }, {
    key: "parseIdentifier",
    value: function parseIdentifier() {
      if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.IDENTIFIER) || this.match(_Tokenizer$TokenClass$TokenType.TokenType.YIELD) || this.match(_Tokenizer$TokenClass$TokenType.TokenType.LET)) {
        return this.lex().value;
      } else {
        throw this.createUnexpected(this.lookahead);
      }
    }
  }, {
    key: "parseArgumentList",
    value: function parseArgumentList() {
      this.lex();
      var args = this.parseArguments();
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.RPAREN);
      return args;
    }
  }, {
    key: "parseArguments",
    value: function parseArguments() {
      var result = [];
      while (true) {
        if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.RPAREN) || this.eof()) {
          return result;
        }
        var arg = undefined;
        if (this.eat(_Tokenizer$TokenClass$TokenType.TokenType.ELLIPSIS)) {
          var startLocation = this.getLocation();
          arg = this.markLocation({ type: "SpreadElement", expression: this.parseAssignmentExpression() }, startLocation);
        } else {
          arg = this.parseAssignmentExpression();
        }
        result.push(arg);
        if (!this.eat(_Tokenizer$TokenClass$TokenType.TokenType.COMMA)) break;
      }
      return result;
    }
  }, {
    key: "ensureArrow",

    // 11.2 Left-Hand-Side Expressions;

    value: function ensureArrow() {
      if (this.hasLineTerminatorBeforeNext) {
        throw this.createError(_ErrorMessages.ErrorMessages.UNEXPECTED_LINE_TERMINATOR);
      }
      if (!this.match(_Tokenizer$TokenClass$TokenType.TokenType.ARROW)) {
        this.expect(_Tokenizer$TokenClass$TokenType.TokenType.ARROW);
      }
    }
  }, {
    key: "parseGroupExpression",
    value: function parseGroupExpression() {
      // At this point, we need to parse 3 things:
      //  1. Group expression
      //  2. Assignment target of assignment expression
      //  3. Parameter list of arrow function
      var rest = null;
      var start = this.expect(_Tokenizer$TokenClass$TokenType.TokenType.LPAREN);
      if (this.eat(_Tokenizer$TokenClass$TokenType.TokenType.RPAREN)) {
        this.ensureArrow();
        this.isBindingElement = this.isAssignmentTarget = false;
        return {
          type: ARROW_EXPRESSION_PARAMS,
          params: [],
          rest: null };
      } else if (this.eat(_Tokenizer$TokenClass$TokenType.TokenType.ELLIPSIS)) {
        rest = this.parseBindingIdentifier();
        this.expect(_Tokenizer$TokenClass$TokenType.TokenType.RPAREN);
        this.ensureArrow();
        this.isBindingElement = this.isAssignmentTarget = false;
        return {
          type: ARROW_EXPRESSION_PARAMS,
          params: [],
          rest: rest };
      }

      var startLocation = this.getLocation();
      var group = this.inheritCoverGrammar(this.parseAssignmentExpressionOrBindingElement);

      var params = this.isBindingElement ? [group] : null;

      while (this.eat(_Tokenizer$TokenClass$TokenType.TokenType.COMMA)) {
        this.isAssignmentTarget = false;
        if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.ELLIPSIS)) {
          if (!this.isBindingElement) {
            throw this.createUnexpected(this.lookahead);
          }
          this.lex();
          rest = this.parseBindingIdentifier();
          break;
        }

        if (!group) {
          // Can be only binding elements.
          var binding = this.parseBindingElement();
          params.push(binding);
        } else {
          // Can be either binding element or assignment target.
          var _expr3 = this.inheritCoverGrammar(this.parseAssignmentExpressionOrBindingElement);
          if (!this.isBindingElement) {
            params = null;
          } else {
            params.push(_expr3);
          }

          if (this.firstExprError) {
            group = null;
          } else {
            group = this.markLocation({
              type: "BinaryExpression",
              left: group,
              operator: ",",
              right: _expr3 }, startLocation);
          }
        }
      }

      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.RPAREN);

      if (!this.hasLineTerminatorBeforeNext && this.match(_Tokenizer$TokenClass$TokenType.TokenType.ARROW)) {
        if (!this.isBindingElement) {
          throw this.createErrorWithLocation(start, _ErrorMessages.ErrorMessages.ILLEGAL_ARROW_FUNCTION_PARAMS);
        }

        params = params.map(transformDestructuring);

        this.isBindingElement = false;
        return { type: ARROW_EXPRESSION_PARAMS, params: params, rest: rest };
      } else {
        // Ensure assignment pattern:
        if (rest) {
          this.ensureArrow();
        }
        this.isBindingElement = false;
        return group;
      }
    }
  }, {
    key: "parseArrayExpression",
    value: function parseArrayExpression() {
      var startLocation = this.getLocation();

      this.lex();

      var exprs = [];

      while (true) {
        if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.RBRACK)) {
          break;
        }
        if (this.eat(_Tokenizer$TokenClass$TokenType.TokenType.COMMA)) {
          exprs.push(null);
        } else {
          var elementLocation = this.getLocation();
          var _expr4 = undefined;
          if (this.eat(_Tokenizer$TokenClass$TokenType.TokenType.ELLIPSIS)) {
            // Spread/Rest element
            _expr4 = this.inheritCoverGrammar(this.parseAssignmentExpressionOrBindingElement);
            if (!this.isAssignmentTarget && this.firstExprError) {
              throw this.firstExprError;
            }
            _expr4 = this.markLocation({ type: "SpreadElement", expression: _expr4 }, elementLocation);
            if (!this.match(_Tokenizer$TokenClass$TokenType.TokenType.RBRACK)) {
              this.isBindingElement = this.isAssignmentTarget = false;
            }
          } else {
            _expr4 = this.inheritCoverGrammar(this.parseAssignmentExpressionOrBindingElement);
            if (!this.isAssignmentTarget && this.firstExprError) {
              throw this.firstExprError;
            }
          }
          exprs.push(_expr4);

          if (!this.match(_Tokenizer$TokenClass$TokenType.TokenType.RBRACK)) {
            this.expect(_Tokenizer$TokenClass$TokenType.TokenType.COMMA);
          }
        }
      }

      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.RBRACK);

      return this.markLocation({ type: "ArrayExpression", elements: exprs }, startLocation);
    }
  }, {
    key: "parseObjectExpression",
    value: function parseObjectExpression() {
      var startLocation = this.getLocation();

      this.lex();

      var properties = [];
      while (!this.match(_Tokenizer$TokenClass$TokenType.TokenType.RBRACE)) {
        var property = this.inheritCoverGrammar(this.parsePropertyDefinition);
        properties.push(property);
        if (!this.match(_Tokenizer$TokenClass$TokenType.TokenType.RBRACE)) {
          this.expect(_Tokenizer$TokenClass$TokenType.TokenType.COMMA);
        }
      }
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.RBRACE);
      return this.markLocation({ type: "ObjectExpression", properties: properties }, startLocation);
    }
  }, {
    key: "parsePropertyDefinition",
    value: function parsePropertyDefinition() {
      var startLocation = this.getLocation();
      var token = this.lookahead;

      var _parseMethodDefinition = this.parseMethodDefinition();

      var methodOrKey = _parseMethodDefinition.methodOrKey;
      var kind = _parseMethodDefinition.kind;

      switch (kind) {
        case "method":
          this.isBindingElement = this.isAssignmentTarget = false;
          return methodOrKey;
        case "identifier":
          // IdentifierReference,
          if (this.eat(_Tokenizer$TokenClass$TokenType.TokenType.ASSIGN)) {
            // CoverInitializedName
            var init = this.isolateCoverGrammar(this.parseAssignmentExpression);
            this.firstExprError = this.createErrorWithLocation(startLocation, _ErrorMessages.ErrorMessages.ILLEGAL_PROPERTY);
            return this.markLocation({
              type: "BindingPropertyIdentifier",
              binding: transformDestructuring(methodOrKey),
              init: init }, startLocation);
          } else if (!this.match(_Tokenizer$TokenClass$TokenType.TokenType.COLON)) {
            if (token.type !== _Tokenizer$TokenClass$TokenType.TokenType.IDENTIFIER && token.type !== _Tokenizer$TokenClass$TokenType.TokenType.YIELD && token.type !== _Tokenizer$TokenClass$TokenType.TokenType.LET) {
              throw this.createUnexpected(token);
            }
            return this.markLocation({ type: "ShorthandProperty", name: methodOrKey.value }, startLocation);
          }
      }

      // DataProperty
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.COLON);

      var expr = this.inheritCoverGrammar(this.parseAssignmentExpressionOrBindingElement);
      return this.markLocation({ type: "DataProperty", name: methodOrKey, expression: expr }, startLocation);
    }
  }, {
    key: "parsePropertyName",
    value: function parsePropertyName() {
      // PropertyName[Yield,GeneratorParameter]:
      var token = this.lookahead;
      var startLocation = this.getLocation();

      if (this.eof()) {
        throw this.createUnexpected(token);
      }

      switch (token.type) {
        case _Tokenizer$TokenClass$TokenType.TokenType.STRING:
          return {
            name: this.markLocation({
              type: "StaticPropertyName",
              value: this.parseStringLiteral().value }, startLocation),
            binding: null };
        case _Tokenizer$TokenClass$TokenType.TokenType.NUMBER:
          var numLiteral = this.parseNumericLiteral();
          return {
            name: this.markLocation({
              type: "StaticPropertyName",
              value: "" + (numLiteral.type === "LiteralInfinityExpression" ? 1 / 0 : numLiteral.value) }, startLocation),
            binding: null };
        case _Tokenizer$TokenClass$TokenType.TokenType.LBRACK:
          var previousYield = this.allowYieldExpression;
          if (this.inGeneratorParameter) {
            this.allowYieldExpression = false;
          }
          this.lex();
          var expr = this.parseAssignmentExpression();
          this.expect(_Tokenizer$TokenClass$TokenType.TokenType.RBRACK);
          this.allowYieldExpression = previousYield;
          return { name: this.markLocation({ type: "ComputedPropertyName", expression: expr }, startLocation), binding: null };
      }

      var name = this.parseIdentifierName();
      return {
        name: this.markLocation({ type: "StaticPropertyName", value: name }, startLocation),
        binding: this.markLocation({ type: "BindingIdentifier", name: name }, startLocation) };
    }
  }, {
    key: "lookaheadPropertyName",

    /**
     * Test if lookahead can be the beginning of a `PropertyName`.
     * @returns {boolean}
     */
    value: function lookaheadPropertyName() {
      switch (this.lookahead.type) {
        case _Tokenizer$TokenClass$TokenType.TokenType.NUMBER:
        case _Tokenizer$TokenClass$TokenType.TokenType.STRING:
        case _Tokenizer$TokenClass$TokenType.TokenType.LBRACK:
          return true;
        default:
          return this.lookahead.type.klass.isIdentifierName;
      }
    }
  }, {
    key: "parseMethodDefinition",

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
    value: function parseMethodDefinition() {
      var token = this.lookahead;
      var startLocation = this.getLocation();

      var isGenerator = !!this.eat(_Tokenizer$TokenClass$TokenType.TokenType.MUL);

      var _parsePropertyName = this.parsePropertyName();

      var name = _parsePropertyName.name;
      var binding = _parsePropertyName.binding;

      if (!isGenerator && token.type === _Tokenizer$TokenClass$TokenType.TokenType.IDENTIFIER) {
        var _name = token.value;
        if (_name.length === 3) {
          // Property Assignment: Getter and Setter.
          if (_name === "get" && this.lookaheadPropertyName()) {
            var _parsePropertyName2 = this.parsePropertyName();

            _name = _parsePropertyName2.name;

            this.expect(_Tokenizer$TokenClass$TokenType.TokenType.LPAREN);
            this.expect(_Tokenizer$TokenClass$TokenType.TokenType.RPAREN);
            var body = this.parseFunctionBody();
            return {
              methodOrKey: this.markLocation({ type: "Getter", name: _name, body: body }, startLocation),
              kind: "method" };
          } else if (_name === "set" && this.lookaheadPropertyName()) {
            var _parsePropertyName3 = this.parsePropertyName();

            _name = _parsePropertyName3.name;

            this.expect(_Tokenizer$TokenClass$TokenType.TokenType.LPAREN);
            var param = this.parseBindingElement();
            this.expect(_Tokenizer$TokenClass$TokenType.TokenType.RPAREN);
            var _previousYield2 = this.allowYieldExpression;
            this.allowYieldExpression = false;
            var body = this.parseFunctionBody();
            this.allowYieldExpression = _previousYield2;
            return {
              methodOrKey: this.markLocation({ type: "Setter", name: _name, param: param, body: body }, startLocation),
              kind: "method" };
          }
        }
      }

      if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.LPAREN)) {
        var _previousYield3 = this.allowYieldExpression;
        var previousInGeneratorParameter = this.inGeneratorParameter;
        this.inGeneratorParameter = isGenerator;
        this.allowYieldExpression = isGenerator;
        var params = this.parseParams();
        this.inGeneratorParameter = previousInGeneratorParameter;
        this.allowYieldExpression = _previousYield3;
        var previousInGeneratorBody = this.inGeneratorBody;
        this.allowYieldExpression = isGenerator;

        if (isGenerator) {
          this.inGeneratorBody = true;
        }

        var body = this.parseFunctionBody();
        this.allowYieldExpression = _previousYield3;
        this.inGeneratorBody = previousInGeneratorBody;

        return {
          methodOrKey: this.markLocation({ type: "Method", isGenerator: isGenerator, name: name, params: params, body: body }, startLocation),
          kind: "method" };
      }

      if (isGenerator && this.match(_Tokenizer$TokenClass$TokenType.TokenType.COLON)) {
        throw this.createUnexpected(this.lookahead);
      }

      return {
        methodOrKey: name,
        kind: token.type.klass.isIdentifierName ? "identifier" : "property",
        binding: binding };
    }
  }, {
    key: "parseClass",
    value: function parseClass(_ref2) {
      var _this3 = this;

      var isExpr = _ref2.isExpr;
      var inDefault = _ref2.inDefault;

      var startLocation = this.getLocation();

      this.lex();
      var name = null;
      var heritage = null;

      if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.IDENTIFIER)) {
        name = this.parseBindingIdentifier();
      } else if (!isExpr) {
        if (inDefault) {
          name = this.markLocation({ type: "BindingIdentifier", name: "*default*" }, startLocation);
        } else {
          throw this.createUnexpected(this.lookahead);
        }
      }

      var previousInGeneratorParameter = this.inGeneratorParameter;
      var previousParamYield = this.allowYieldExpression;
      if (isExpr) {
        this.inGeneratorParameter = false;
        this.allowYieldExpression = false;
      }
      if (this.eat(_Tokenizer$TokenClass$TokenType.TokenType.EXTENDS)) {
        heritage = this.isolateCoverGrammar(function () {
          return _this3.parseLeftHandSideExpression({ allowCall: true });
        });
      }

      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.LBRACE);
      var elements = [];
      while (!this.eat(_Tokenizer$TokenClass$TokenType.TokenType.RBRACE)) {
        if (this.eat(_Tokenizer$TokenClass$TokenType.TokenType.SEMICOLON)) {
          continue;
        }
        var isStatic = false;

        var _parseMethodDefinition2 = this.parseMethodDefinition();

        var methodOrKey = _parseMethodDefinition2.methodOrKey;
        var kind = _parseMethodDefinition2.kind;

        if (kind === "identifier" && methodOrKey.value === "static") {
          isStatic = true;

          var _parseMethodDefinition3 = this.parseMethodDefinition();

          methodOrKey = _parseMethodDefinition3.methodOrKey;
          kind = _parseMethodDefinition3.kind;
        }
        if (kind === "method") {
          elements.push(copyLocation(methodOrKey, { type: "ClassElement", isStatic: isStatic, method: methodOrKey }));
        } else {
          throw this.createError("Only methods are allowed in classes");
        }
      }
      this.allowYieldExpression = previousParamYield;
      this.inGeneratorParameter = previousInGeneratorParameter;
      return this.markLocation({ type: isExpr ? "ClassExpression" : "ClassDeclaration", name: name, "super": heritage, elements: elements }, startLocation);
    }
  }, {
    key: "parseFunction",
    value: function parseFunction(_ref3) {
      var isExpr = _ref3.isExpr;
      var inDefault = _ref3.inDefault;
      var allowGenerator = _ref3.allowGenerator;

      var startLocation = this.getLocation();

      this.lex();

      var name = null;
      var isGenerator = allowGenerator && !!this.eat(_Tokenizer$TokenClass$TokenType.TokenType.MUL);
      var previousGeneratorParameter = this.inGeneratorParameter;
      var previousYield = this.allowYieldExpression;
      var previousInGeneratorBody = this.inGeneratorBody;

      if (!this.match(_Tokenizer$TokenClass$TokenType.TokenType.LPAREN)) {
        name = this.parseBindingIdentifier();
      } else if (!isExpr) {
        if (inDefault) {
          name = this.markLocation({ type: "BindingIdentifier", name: "*default*" }, startLocation);
        } else {
          throw this.createUnexpected(this.lookahead);
        }
      }

      this.inGeneratorParameter = isGenerator;
      this.allowYieldExpression = isGenerator;
      var params = this.parseParams();
      this.inGeneratorParameter = previousGeneratorParameter;

      this.allowYieldExpression = isGenerator;

      if (isGenerator) {
        this.inGeneratorBody = true;
      }

      var body = this.parseFunctionBody();
      this.inGeneratorBody = previousInGeneratorBody;
      this.allowYieldExpression = previousYield;

      var type = isExpr ? "FunctionExpression" : "FunctionDeclaration";
      return this.markLocation({ type: type, isGenerator: isGenerator, name: name, params: params, body: body }, startLocation);
    }
  }, {
    key: "parseArrayBinding",
    value: function parseArrayBinding() {
      var startLocation = this.getLocation();

      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.LBRACK);

      var elements = [],
          restElement = null;

      while (true) {
        if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.RBRACK)) {
          break;
        }
        var el = undefined;

        if (this.eat(_Tokenizer$TokenClass$TokenType.TokenType.COMMA)) {
          el = null;
        } else {
          if (this.eat(_Tokenizer$TokenClass$TokenType.TokenType.ELLIPSIS)) {
            restElement = this.parseBindingIdentifier();
            break;
          } else {
            el = this.parseBindingElement();
          }
          if (!this.match(_Tokenizer$TokenClass$TokenType.TokenType.RBRACK)) {
            this.expect(_Tokenizer$TokenClass$TokenType.TokenType.COMMA);
          }
        }
        elements.push(el);
      }

      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.RBRACK);

      return this.markLocation({ type: "ArrayBinding", elements: elements, restElement: restElement }, startLocation);
    }
  }, {
    key: "parseBindingProperty",
    value: function parseBindingProperty() {
      var startLocation = this.getLocation();
      var token = this.lookahead;

      var _parsePropertyName4 = this.parsePropertyName();

      var name = _parsePropertyName4.name;
      var binding = _parsePropertyName4.binding;

      if ((token.type === _Tokenizer$TokenClass$TokenType.TokenType.IDENTIFIER || token.type === _Tokenizer$TokenClass$TokenType.TokenType.YIELD) && name.type === "StaticPropertyName") {
        if (!this.match(_Tokenizer$TokenClass$TokenType.TokenType.COLON)) {
          var defaultValue = null;
          if (this.eat(_Tokenizer$TokenClass$TokenType.TokenType.ASSIGN)) {
            var previousAllowYieldExpression = this.allowYieldExpression;
            if (this.inGeneratorParameter) {
              this.allowYieldExpression = false;
            }
            var _expr5 = this.parseAssignmentExpression();
            defaultValue = _expr5;
            this.allowYieldExpression = previousAllowYieldExpression;
          }
          return this.markLocation({
            type: "BindingPropertyIdentifier",
            binding: binding,
            init: defaultValue }, startLocation);
        }
      }
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.COLON);
      binding = this.parseBindingElement();
      return this.markLocation({ type: "BindingPropertyProperty", name: name, binding: binding }, startLocation);
    }
  }, {
    key: "parseObjectBinding",
    value: function parseObjectBinding() {
      var startLocation = this.getLocation();

      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.LBRACE);

      var properties = [];
      while (!this.match(_Tokenizer$TokenClass$TokenType.TokenType.RBRACE)) {
        properties.push(this.parseBindingProperty());
        if (!this.match(_Tokenizer$TokenClass$TokenType.TokenType.RBRACE)) {
          this.expect(_Tokenizer$TokenClass$TokenType.TokenType.COMMA);
        }
      }

      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.RBRACE);

      return this.markLocation({ type: "ObjectBinding", properties: properties }, startLocation);
    }
  }, {
    key: "parseBindingTarget",
    value: function parseBindingTarget() {
      switch (this.lookahead.type) {
        case _Tokenizer$TokenClass$TokenType.TokenType.IDENTIFIER:
        case _Tokenizer$TokenClass$TokenType.TokenType.LET:
        case _Tokenizer$TokenClass$TokenType.TokenType.YIELD:
          return this.parseBindingIdentifier();
        case _Tokenizer$TokenClass$TokenType.TokenType.LBRACK:
          return this.parseArrayBinding();
        case _Tokenizer$TokenClass$TokenType.TokenType.LBRACE:
          return this.parseObjectBinding();
      }
      throw this.createUnexpected(this.lookahead);
    }
  }, {
    key: "parseBindingElement",
    value: function parseBindingElement() {
      var startLocation = this.getLocation();
      var binding = this.parseBindingTarget();

      if (this.eat(_Tokenizer$TokenClass$TokenType.TokenType.ASSIGN)) {
        var previousInGeneratorParameter = this.inGeneratorParameter;
        var previousYieldExpression = this.allowYieldExpression;
        if (this.inGeneratorParameter) {
          this.allowYieldExpression = false;
        }
        this.inGeneratorParameter = false;
        var init = this.parseAssignmentExpression();
        binding = this.markLocation({ type: "BindingWithDefault", binding: binding, init: init }, startLocation);
        this.inGeneratorParameter = previousInGeneratorParameter;
        this.allowYieldExpression = previousYieldExpression;
      }
      return binding;
    }
  }, {
    key: "parseParam",
    value: function parseParam() {
      var previousInParameter = this.inParameter;
      this.inParameter = true;
      var param = this.parseBindingElement();
      this.inParameter = previousInParameter;
      return param;
    }
  }, {
    key: "parseParams",
    value: function parseParams() {
      var paramsLocation = this.getLocation();

      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.LPAREN);

      var items = [],
          rest = null;
      if (!this.match(_Tokenizer$TokenClass$TokenType.TokenType.RPAREN)) {
        while (!this.eof()) {
          if (this.eat(_Tokenizer$TokenClass$TokenType.TokenType.ELLIPSIS)) {
            rest = this.parseBindingIdentifier();
            break;
          }
          items.push(this.parseParam());
          if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.RPAREN)) break;
          this.expect(_Tokenizer$TokenClass$TokenType.TokenType.COMMA);
        }
      }

      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.RPAREN);

      return this.markLocation({ type: "FormalParameters", items: items, rest: rest }, paramsLocation);
    }
  }]);

  return Parser;
})(_Tokenizer$TokenClass$TokenType["default"]);

exports.Parser = Parser;