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
  Primary: 19
};

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

var FOR_OF_VAR = {};

function copyLocation(from, to) {
  if ("loc" in from) {
    to.loc = from.loc;
  }
  return to;
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
      if (this.matchContextualKeyword(keyword)) {
        return this.lex();
      } else {
        throw this.createUnexpected(this.lookahead);
      }
    }
  }, {
    key: "eatContextualKeyword",
    value: function eatContextualKeyword(keyword) {
      if (this.matchContextualKeyword(keyword)) {
        return this.lex();
      }
    }
  }, {
    key: "match",
    value: function match(subType) {
      return this.lookahead.type === subType;
    }
  }, {
    key: "consumeSemicolon",
    value: function consumeSemicolon() {
      if (this.hasLineTerminatorBeforeNext) {
        return;
      }

      if (this.eat(_Tokenizer$TokenClass$TokenType.TokenType.SEMICOLON)) {
        return;
      }

      if (!this.eof() && !this.match(_Tokenizer$TokenClass$TokenType.TokenType.RBRACE)) {
        throw this.createUnexpected(this.lookahead);
      }
    }
  }, {
    key: "markLocation",

    // this is a no-op, reserved for future use
    value: function markLocation(node, startLocation) {
      return node;
    }
  }, {
    key: "parseModule",
    value: function parseModule() {
      this.module = true;

      this.lookahead = this.advance();
      var location = this.getLocation();
      var items = [];
      while (!this.eof()) {
        items.push(this.parseModuleItem());
      }
      return this.markLocation({ type: "Module", items: items }, location);
    }
  }, {
    key: "parseScript",
    value: function parseScript() {
      this.lookahead = this.advance();

      var location = this.getLocation();

      var body = this.parseBody();
      if (!this.match(_Tokenizer$TokenClass$TokenType.TokenType.EOS)) {
        throw this.createUnexpected(this.lookahead);
      }
      return this.markLocation({ type: "Script", body: body }, location);
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
      var body = this.parseBody();
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.RBRACE);

      body = this.markLocation(body, startLocation);

      this.inFunctionBody = oldInFunctionBody;
      this.module = oldModule;
      return body;
    }
  }, {
    key: "parseBody",
    value: function parseBody() {
      var location = this.getLocation();
      var directives = [];
      var statements = [];
      var parsingDirectives = true;

      while (true) {
        if (this.eof() || this.match(_Tokenizer$TokenClass$TokenType.TokenType.RBRACE)) {
          break;
        }
        var token = this.lookahead;
        var text = token.slice.text;
        var isStringLiteral = token.type === _Tokenizer$TokenClass$TokenType.TokenType.STRING;
        var directiveLocation = this.getLocation();
        var stmt = this.parseStatementListItem({ isTopLevel: true });
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

      return this.markLocation({ type: "FunctionBody", directives: directives, statements: statements }, location);
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
            binding: this.markLocation({ type: "BindingIdentifier", name: name }, startLocation)
          }, startLocation);
        }
      } else if (this.lookahead.type.klass.isIdentifierName) {
        name = this.parseIdentifierName();
        this.expectContextualKeyword("as");
      }

      var location = this.getLocation();
      var boundName = this.parseIdentifier();
      return this.markLocation({
        type: "ImportSpecifier",
        name: name,
        binding: this.markLocation({ type: "BindingIdentifier", name: boundName }, location) }, startLocation);
    }
  }, {
    key: "parseNameSpaceBinding",
    value: function parseNameSpaceBinding() {
      var startLocation = this.getLocation();
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.MUL);
      this.expectContextualKeyword("as");
      var identifierLocation = this.getLocation();
      var identifier = this.parseIdentifier();
      return this.markLocation({ type: "BindingIdentifier", name: identifier }, startLocation);
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
      var result = [];
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.LBRACE);
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
      var isVar = false,
          key = undefined;
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
          decl = { type: "Export", declaration: this.parseClass({ isExpr: false }) };
          break;
        case _Tokenizer$TokenClass$TokenType.TokenType.FUNCTION:
          // export HoistableDeclaration
          decl = { type: "Export", declaration: this.parseFunction({ isExpr: false, isTopLevel: true }) };
          break;
        case _Tokenizer$TokenClass$TokenType.TokenType.DEFAULT:
          this.lex();
          switch (this.lookahead.type) {
            case _Tokenizer$TokenClass$TokenType.TokenType.FUNCTION:
              // export default HoistableDeclaration[Default]
              decl = {
                type: "ExportDefault",
                body: this.parseFunction({ isExpr: false, inDefault: true, isTopLevel: true })
              };
              key = decl.body.name.name;
              break;
            case _Tokenizer$TokenClass$TokenType.TokenType.CLASS:
              // export default ClassDeclaration[Default]
              decl = { type: "ExportDefault", body: this.parseClass({ isExpr: false, inDefault: true }) };
              key = decl.body.name.name;
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
          isVar = true;
        // falls through
        case _Tokenizer$TokenClass$TokenType.TokenType.LET:
        case _Tokenizer$TokenClass$TokenType.TokenType.CONST:
          // export LexicalDeclaration
          decl = { type: "Export", declaration: this.parseVariableDeclaration() };
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
      var _ref = arguments[0] === undefined ? {} : arguments[0];

      var _ref$isTopLevel = _ref.isTopLevel;
      var isTopLevel = _ref$isTopLevel === undefined ? false : _ref$isTopLevel;

      var startLocation = this.getLocation();
      if (this.eof()) {
        throw this.createUnexpected(this.lookahead);
      }

      var decl = undefined;
      switch (this.lookahead.type) {
        case _Tokenizer$TokenClass$TokenType.TokenType.FUNCTION:
          decl = this.parseFunction({ isExpr: false, isTopLevel: isTopLevel });
          break;
        case _Tokenizer$TokenClass$TokenType.TokenType.CLASS:
          decl = this.parseClass({ isExpr: false });
          break;
        default:
          if (this.lookaheadLexicalDeclaration()) {
            decl = this.parseVariableDeclarationStatement();
          } else {
            decl = this.parseStatement({ isTopLevel: isTopLevel });
          }
      }

      return this.markLocation(decl, startLocation);
    }
  }, {
    key: "parseStatement",
    value: function parseStatement() {
      var _this = this;

      var _ref2 = arguments[0] === undefined ? {} : arguments[0];

      var _ref2$isTopLevel = _ref2.isTopLevel;
      var isTopLevel = _ref2$isTopLevel === undefined ? false : _ref2$isTopLevel;

      var startLocation = this.getLocation();
      var stmt = this.isolateCoverGrammar(function () {
        return _this.parseStatementHelper(isTopLevel);
      });
      return this.markLocation(stmt, startLocation);
    }
  }, {
    key: "parseStatementHelper",
    value: function parseStatementHelper(isTopLevel) {
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
            var expr = this.parseExpression();
            // 12.12 Labelled Statements;
            if (expr.type === "IdentifierExpression" && this.eat(_Tokenizer$TokenClass$TokenType.TokenType.COLON)) {
              var key = "$" + expr.name;
              var labeledBody = undefined;
              if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.FUNCTION)) {
                labeledBody = this.parseFunction({ isExpr: false, allowGenerator: false, isTopLevel: isTopLevel });
              } else {
                labeledBody = this.parseStatement({ isTopLevel: isTopLevel });
              }
              return { type: "LabeledStatement", label: expr.name, body: labeledBody };
            } else {
              this.consumeSemicolon();
              return { type: "ExpressionStatement", expression: expr };
            }
          }
      }
    }
  }, {
    key: "parseEmptyStatement",
    value: function parseEmptyStatement() {
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.SEMICOLON);
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
      var token = this.lookahead;
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.BREAK);

      // Catch the very common case first: immediately a semicolon (U+003B).
      if (this.eat(_Tokenizer$TokenClass$TokenType.TokenType.SEMICOLON)) {
        return { type: "BreakStatement", label: null };
      }

      if (this.hasLineTerminatorBeforeNext) {
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
      var token = this.lookahead;
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.CONTINUE);

      // Catch the very common case first: immediately a semicolon (U+003B).
      if (this.eat(_Tokenizer$TokenClass$TokenType.TokenType.SEMICOLON)) {
        return { type: "ContinueStatement", label: null };
      }

      if (this.hasLineTerminatorBeforeNext) {
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
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.DEBUGGER);
      this.consumeSemicolon();
      return { type: "DebuggerStatement" };
    }
  }, {
    key: "parseDoWhileStatement",
    value: function parseDoWhileStatement() {
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.DO);
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
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.FOR);
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
        return {
          type: "ForStatement",
          init: null,
          test: test,
          update: right,
          body: this.getIteratorStatementEpilogue()
        };
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
            return {
              type: "ForStatement",
              init: init,
              test: test,
              update: right,
              body: this.getIteratorStatementEpilogue()
            };
          }
        } else {
          var previousAllowIn = this.allowIn;
          this.allowIn = false;
          var expr = this.inheritCoverGrammar(this.parseAssignmentExpressionOrBindingElement);
          this.allowIn = previousAllowIn;

          if (this.isAssignmentTarget && expr.type !== "AssignmentExpression" && (this.match(_Tokenizer$TokenClass$TokenType.TokenType.IN) || this.matchContextualKeyword("of"))) {
            if (startsWithLet && this.matchContextualKeyword("of")) {
              throw this.createError(_ErrorMessages.ErrorMessages.INVALID_LHS_IN_FOR_OF);
            }
            var type = this.match(_Tokenizer$TokenClass$TokenType.TokenType.IN) ? "ForInStatement" : "ForOfStatement";

            this.lex();
            right = this.parseExpression();

            return { type: type, left: Parser.transformDestructuring(expr), right: right, body: this.getIteratorStatementEpilogue() };
          } else {
            if (this.firstExprError) {
              throw this.firstExprError;
            }
            while (this.eat(_Tokenizer$TokenClass$TokenType.TokenType.COMMA)) {
              var rhs = this.parseAssignmentExpression();
              expr = this.markLocation({ type: "BinaryExpression", left: expr, operator: ",", right: rhs }, leftLocation);
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
            return { type: "ForStatement", init: expr, test: test, update: right, body: this.getIteratorStatementEpilogue() };
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
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.IF);
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
      var expression = null;

      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.RETURN);
      if (!this.inFunctionBody) {
        throw this.createError(_ErrorMessages.ErrorMessages.ILLEGAL_RETURN);
      }

      if (this.hasLineTerminatorBeforeNext) {
        return { type: "ReturnStatement", expression: expression };
      }

      if (!this.match(_Tokenizer$TokenClass$TokenType.TokenType.SEMICOLON)) {
        if (!this.match(_Tokenizer$TokenClass$TokenType.TokenType.RBRACE) && !this.eof()) {
          expression = this.parseExpression();
        }
      }

      this.consumeSemicolon();
      return { type: "ReturnStatement", expression: expression };
    }
  }, {
    key: "parseWithStatement",
    value: function parseWithStatement() {
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.WITH);
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.LPAREN);
      var object = this.parseExpression();
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.RPAREN);
      var body = this.parseStatement();

      return { type: "WithStatement", object: object, body: body };
    }
  }, {
    key: "parseSwitchStatement",
    value: function parseSwitchStatement() {
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.SWITCH);
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
          postDefaultCases: postDefaultCases
        };
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
        consequent: this.parseSwitchCaseBody()
      }, startLocation);
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
      var token = this.expect(_Tokenizer$TokenClass$TokenType.TokenType.THROW);

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
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.TRY);
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
      var declaration = this.parseVariableDeclaration();
      this.consumeSemicolon();
      return { type: "VariableDeclarationStatement", declaration: declaration };
    }
  }, {
    key: "parseWhileStatement",
    value: function parseWhileStatement() {
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.WHILE);
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.LPAREN);
      return { type: "WhileStatement", test: this.parseExpression(), body: this.getIteratorStatementEpilogue() };
    }
  }, {
    key: "parseCatchClause",
    value: function parseCatchClause() {
      var startLocation = this.getLocation();

      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.CATCH);
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.LPAREN);
      var token = this.lookahead;
      if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.RPAREN) || this.match(_Tokenizer$TokenClass$TokenType.TokenType.LPAREN)) {
        throw this.createUnexpected(token);
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
    value: function parseVariableDeclaration() {
      var bindingPatternsMustHaveInit = arguments[0] === undefined ? true : arguments[0];

      var startLocation = this.getLocation();
      var token = this.lex();

      // Preceded by this.match(TokenSubType.VAR) || this.match(TokenSubType.LET);
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
      var token = this.lookahead;

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
  }, {
    key: "inheritCoverGrammar",
    value: function inheritCoverGrammar(parser) {
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
  }, {
    key: "parseExpression",
    value: function parseExpression() {
      var startLocation = this.getLocation();

      var group = this.parseAssignmentExpression();
      if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.COMMA)) {
        while (!this.eof()) {
          if (!this.match(_Tokenizer$TokenClass$TokenType.TokenType.COMMA)) {
            break;
          }
          this.lex();
          var expr = this.parseAssignmentExpression();
          group = this.markLocation({ type: "BinaryExpression", left: group, operator: ",", right: expr }, startLocation);
        }
      }
      return group;
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
          var _name = head.name;
          params = [Parser.transformDestructuring(head)];
        } else {
          throw this.createUnexpected(arrow);
        }
      }

      var paramsNode = this.markLocation({ type: "FormalParameters", items: params, rest: rest }, startLocation);

      if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.LBRACE)) {
        var previousYield = this.allowYieldExpression;
        this.allowYieldExpression = false;
        var body = this.parseFunctionBody();
        this.allowYieldExpression = previousYield;
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
      var token = this.lookahead;
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
        if (!this.isAssignmentTarget || !Parser.isValidSimpleAssignmentTarget(expr)) {
          throw this.createError(_ErrorMessages.ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
        }
        expr = Parser.transformDestructuring(expr);
      } else if (operator.type === _Tokenizer$TokenClass$TokenType.TokenType.ASSIGN) {
        if (!this.isAssignmentTarget) {
          throw this.createError(_ErrorMessages.ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
        }
        expr = Parser.transformDestructuring(expr);
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
        expression: rhs
      }, startLocation);
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
      }
      if (this.eat(_Tokenizer$TokenClass$TokenType.TokenType.CONDITIONAL)) {
        var previousAllowIn = this.allowIn;
        this.allowIn = true;
        var consequent = this.isolateCoverGrammar(this.parseAssignmentExpression);
        this.allowIn = previousAllowIn;
        this.expect(_Tokenizer$TokenClass$TokenType.TokenType.COLON);
        var alternate = this.isolateCoverGrammar(this.parseAssignmentExpression);
        return this.markLocation({
          type: "ConditionalExpression",
          test: test,
          consequent: consequent,
          alternate: alternate
        }, startLocation);
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
      var _this2 = this;

      var location = this.getLocation();
      var left = this.parseUnaryExpression();
      if (this.firstExprError) {
        return left;
      }

      var operator = this.lookahead.type;

      var isBinaryOperator = this.isBinaryOperator(operator);
      if (!isBinaryOperator) {
        return left;
      }

      this.isBindingElement = this.isAssignmentTarget = false;

      this.lex();
      var stack = [];
      stack.push({ location: location, left: left, operator: operator, precedence: BinaryPrecedence[operator.name] });
      location = this.getLocation();
      var right = this.isolateCoverGrammar(this.parseUnaryExpression);
      operator = this.lookahead.type;
      isBinaryOperator = this.isBinaryOperator(this.lookahead.type);
      while (isBinaryOperator) {
        var precedence = BinaryPrecedence[operator.name];
        // Reduce: make a binary expression from the three topmost entries.
        while (stack.length && precedence <= stack[stack.length - 1].precedence) {
          var stackItem = stack[stack.length - 1];
          var stackOperator = stackItem.operator;
          left = stackItem.left;
          stack.pop();
          location = stackItem.location;
          right = this.markLocation({ type: "BinaryExpression", left: left, operator: stackOperator.name, right: right }, location);
        }

        this.lex();
        stack.push({ location: location, left: right, operator: operator, precedence: precedence });
        location = this.getLocation();

        right = this.isolateCoverGrammar(this.parseUnaryExpression);

        operator = this.lookahead.type;
        isBinaryOperator = this.isBinaryOperator(operator);
      }

      // Final reduce to clean-up the stack.
      return stack.reduceRight(function (expr, stackItem) {
        return _this2.markLocation({
          type: "BinaryExpression",
          left: stackItem.left,
          operator: stackItem.operator.name,
          right: expr
        }, stackItem.location);
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
      if (!Parser.isPrefixOperator(operator.type)) {
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
      if (this.firstExprError) {
        return operand;
      }if (this.hasLineTerminatorBeforeNext) {
        return operand;
      }

      var operator = this.lookahead;
      if (operator.type !== _Tokenizer$TokenClass$TokenType.TokenType.INC && operator.type !== _Tokenizer$TokenClass$TokenType.TokenType.DEC) {
        return operand;
      }

      this.lex();

      return this.markLocation({ type: "PostfixExpression", operand: operand, operator: operator.value }, startLocation);
    }
  }, {
    key: "parseLeftHandSideExpression",
    value: function parseLeftHandSideExpression(_ref3) {
      var allowCall = _ref3.allowCall;

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
              arguments: this.parseArgumentList()
            }, startLocation);
          } else {
            throw this.createUnexpected(token);
          }
        } else if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.LBRACK)) {
          expr = this.markLocation({
            type: "ComputedMemberExpression",
            object: expr,
            expression: this.parseComputedMember()
          }, startLocation);
          this.isAssignmentTarget = true;
        } else if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.PERIOD)) {
          expr = this.markLocation({
            type: "StaticMemberExpression",
            object: expr,
            property: this.parseNonComputedMember()
          }, startLocation);
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
          this.isBindingElement = false;
          this.isAssignmentTarget = false;
          expr = this.markLocation({
            type: "CallExpression",
            callee: expr,
            arguments: this.parseArgumentList()
          }, startLocation);
        } else if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.LBRACK)) {
          this.isBindingElement = false;
          this.isAssignmentTarget = true;
          expr = this.markLocation({
            type: "ComputedMemberExpression",
            object: expr,
            expression: this.parseComputedMember()
          }, startLocation);
        } else if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.PERIOD)) {
          this.isBindingElement = false;
          this.isAssignmentTarget = true;
          expr = this.markLocation({
            type: "StaticMemberExpression",
            object: expr,
            property: this.parseNonComputedMember()
          }, startLocation);
        } else if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.TEMPLATE)) {
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
    key: "parseNonComputedMember",
    value: function parseNonComputedMember() {
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.PERIOD);
      if (!this.lookahead.type.klass.isIdentifierName) {
        throw this.createUnexpected(this.lookahead);
      } else {
        return this.lex().value;
      }
    }
  }, {
    key: "parseComputedMember",
    value: function parseComputedMember() {
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.LBRACK);
      var expr = this.parseExpression();
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.RBRACK);
      return expr;
    }
  }, {
    key: "parseNewExpression",
    value: function parseNewExpression() {
      var _this3 = this;

      var startLocation = this.getLocation();
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.NEW);
      if (this.eat(_Tokenizer$TokenClass$TokenType.TokenType.PERIOD)) {
        var ident = this.expect(_Tokenizer$TokenClass$TokenType.TokenType.IDENTIFIER);
        if (ident.value !== "target") {
          throw this.createUnexpected(ident);
        }
        return this.markLocation({ type: "NewTargetExpression" }, startLocation);
      }
      var callee = this.isolateCoverGrammar(function () {
        return _this3.parseLeftHandSideExpression({ allowCall: false });
      });
      return this.markLocation({
        type: "NewExpression",
        callee: callee,
        arguments: this.match(_Tokenizer$TokenClass$TokenType.TokenType.LPAREN) ? this.parseArgumentList() : []
      }, startLocation);
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
          this.isBindingElement = false;
          this.isAssignmentTarget = false;
          return this.parseStringLiteral();
        case _Tokenizer$TokenClass$TokenType.TokenType.NUMBER:
          this.isBindingElement = false;
          this.isAssignmentTarget = false;
          return this.parseNumericLiteral();
        case _Tokenizer$TokenClass$TokenType.TokenType.THIS:
          this.lex();
          this.isBindingElement = false;
          this.isAssignmentTarget = false;
          return this.markLocation({ type: "ThisExpression" }, startLocation);
        case _Tokenizer$TokenClass$TokenType.TokenType.FUNCTION:
          this.isBindingElement = false;
          this.isAssignmentTarget = false;
          return this.markLocation(this.parseFunction({ isExpr: true }), startLocation);
        case _Tokenizer$TokenClass$TokenType.TokenType.TRUE:
          this.lex();
          this.isBindingElement = false;
          this.isAssignmentTarget = false;
          return this.markLocation({ type: "LiteralBooleanExpression", value: true }, startLocation);
        case _Tokenizer$TokenClass$TokenType.TokenType.FALSE:
          this.lex();
          this.isBindingElement = false;
          this.isAssignmentTarget = false;
          return this.markLocation({ type: "LiteralBooleanExpression", value: false }, startLocation);
        case _Tokenizer$TokenClass$TokenType.TokenType.NULL:
          this.lex();
          this.isBindingElement = false;
          this.isAssignmentTarget = false;
          return this.markLocation({ type: "LiteralNullExpression" }, startLocation);
        case _Tokenizer$TokenClass$TokenType.TokenType.LBRACK:
          return this.parseArrayExpression();
        case _Tokenizer$TokenClass$TokenType.TokenType.LBRACE:
          return this.parseObjectExpression();
        case _Tokenizer$TokenClass$TokenType.TokenType.TEMPLATE:
          this.isBindingElement = false;
          this.isAssignmentTarget = false;
          return this.markLocation({
            type: "TemplateExpression",
            tag: null,
            elements: this.parseTemplateElements()
          }, startLocation);
        case _Tokenizer$TokenClass$TokenType.TokenType.DIV:
        case _Tokenizer$TokenClass$TokenType.TokenType.ASSIGN_DIV:
          this.isBindingElement = false;
          this.isAssignmentTarget = false;
          this.lookahead = this.scanRegExp(this.match(_Tokenizer$TokenClass$TokenType.TokenType.DIV) ? "/" : "/=");
          var token = this.lex();
          var lastSlash = token.value.lastIndexOf("/");
          var pattern = token.value.slice(1, lastSlash);
          var flags = token.value.slice(lastSlash + 1);
          return this.markLocation({ type: "LiteralRegExpExpression", pattern: pattern, flags: flags }, startLocation);
        case _Tokenizer$TokenClass$TokenType.TokenType.CLASS:
          this.isBindingElement = false;
          this.isAssignmentTarget = false;
          return this.parseClass({ isExpr: true });
        default:
          throw this.createUnexpected(this.lex());
      }
    }
  }, {
    key: "parseNumericLiteral",
    value: function parseNumericLiteral() {
      var startLocation = this.getLocation();
      var token2 = this.lex();
      var node = token2.value === 1 / 0 ? {
        type: "LiteralInfinityExpression"
      } : {
        type: "LiteralNumericExpression",
        value: token2.value
      };
      return this.markLocation(node, startLocation);
    }
  }, {
    key: "parseStringLiteral",
    value: function parseStringLiteral() {
      var startLocation = this.getLocation();
      var token2 = this.lex();
      return this.markLocation({ type: "LiteralStringExpression", value: token2.str }, startLocation);
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
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.LPAREN);
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
        var startLocation = this.getLocation();
        var arg = undefined;
        if (this.eat(_Tokenizer$TokenClass$TokenType.TokenType.ELLIPSIS)) {
          arg = this.markLocation({ type: "SpreadElement", expression: this.parseAssignmentExpression() }, startLocation);
        } else {
          arg = this.parseAssignmentExpression();
        }
        result.push(arg);
        if (!this.eat(_Tokenizer$TokenClass$TokenType.TokenType.COMMA)) {
          break;
        }
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
        this.isBindingElement = false;
        this.isAssignmentTarget = false;
        return {
          type: ARROW_EXPRESSION_PARAMS,
          params: [],
          rest: null
        };
      } else if (this.eat(_Tokenizer$TokenClass$TokenType.TokenType.ELLIPSIS)) {
        rest = this.parseBindingIdentifier();
        this.expect(_Tokenizer$TokenClass$TokenType.TokenType.RPAREN);
        this.ensureArrow();
        this.isBindingElement = false;
        this.isAssignmentTarget = false;
        return {
          type: ARROW_EXPRESSION_PARAMS,
          params: [],
          rest: rest
        };
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
          var nextLocation = this.getLocation();
          // Can be either binding element or assignment target.
          var expr = this.inheritCoverGrammar(this.parseAssignmentExpressionOrBindingElement);
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

      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.RPAREN);

      if (!this.hasLineTerminatorBeforeNext && this.match(_Tokenizer$TokenClass$TokenType.TokenType.ARROW)) {
        if (!this.isBindingElement) {
          throw this.createErrorWithLocation(start, _ErrorMessages.ErrorMessages.ILLEGAL_ARROW_FUNCTION_PARAMS);
        }

        params = params.map(Parser.transformDestructuring);

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

      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.LBRACK);

      var exprs = [];

      while (true) {
        if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.RBRACK)) {
          break;
        }
        if (this.eat(_Tokenizer$TokenClass$TokenType.TokenType.COMMA)) {
          exprs.push(null);
        } else {
          var elementLocation = this.getLocation();
          var expr = undefined;
          if (this.eat(_Tokenizer$TokenClass$TokenType.TokenType.ELLIPSIS)) {
            // Spread/Rest element
            expr = this.inheritCoverGrammar(this.parseAssignmentExpressionOrBindingElement);
            if (!this.isAssignmentTarget && this.firstExprError) {
              throw this.firstExprError;
            }
            expr = this.markLocation({ type: "SpreadElement", expression: expr }, elementLocation);
            if (!this.match(_Tokenizer$TokenClass$TokenType.TokenType.RBRACK)) {
              this.isAssignmentTarget = this.isBindingElement = false;
            }
          } else {
            expr = this.inheritCoverGrammar(this.parseAssignmentExpressionOrBindingElement);
            if (!this.isAssignmentTarget && this.firstExprError) {
              throw this.firstExprError;
            }
          }
          exprs.push(expr);

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
      var _this4 = this;

      var startLocation = this.getLocation();

      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.LBRACE);

      var properties = [];
      while (!this.match(_Tokenizer$TokenClass$TokenType.TokenType.RBRACE)) {
        var property = this.inheritCoverGrammar(function () {
          return _this4.parsePropertyDefinition();
        });
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

      var _parseMethodDefinition = this.parseMethodDefinition(false);

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
              binding: Parser.transformDestructuring(methodOrKey),
              init: init
            }, startLocation);
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
              value: this.parseStringLiteral().value
            }, startLocation),
            binding: null
          };
        case _Tokenizer$TokenClass$TokenType.TokenType.NUMBER:
          var numLiteral = this.parseNumericLiteral();
          return {
            name: this.markLocation({
              type: "StaticPropertyName",
              value: "" + (numLiteral.type === "LiteralInfinityExpression" ? 1 / 0 : numLiteral.value)
            }, startLocation),
            binding: null
          };
        case _Tokenizer$TokenClass$TokenType.TokenType.LBRACK:
          var previousYield = this.allowYieldExpression;
          if (this.inGeneratorParameter) {
            this.allowYieldExpression = false;
          }
          this.expect(_Tokenizer$TokenClass$TokenType.TokenType.LBRACK);
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
     * The the parser will stop at the end of the leading `Identifier` or `PropertyName` and return it.
     *
     * @returns {{methodOrKey: (Method|PropertyName), kind: string}}
     */
    value: function parseMethodDefinition(isClassProtoMethod) {
      var token = this.lookahead;
      var startLocation = this.getLocation();

      var isGenerator = !!this.eat(_Tokenizer$TokenClass$TokenType.TokenType.MUL);

      var _parsePropertyName = this.parsePropertyName();

      var name = _parsePropertyName.name;
      var binding = _parsePropertyName.binding;

      if (!isGenerator && token.type === _Tokenizer$TokenClass$TokenType.TokenType.IDENTIFIER) {
        var _name2 = token.value;
        if (_name2.length === 3) {
          // Property Assignment: Getter and Setter.
          if (_name2 === "get" && this.lookaheadPropertyName()) {
            var _parsePropertyName2 = this.parsePropertyName();

            _name2 = _parsePropertyName2.name;

            this.expect(_Tokenizer$TokenClass$TokenType.TokenType.LPAREN);
            this.expect(_Tokenizer$TokenClass$TokenType.TokenType.RPAREN);
            var body = this.parseFunctionBody();
            return {
              methodOrKey: this.markLocation({ type: "Getter", name: _name2, body: body }, startLocation),
              kind: "method"
            };
          } else if (_name2 === "set" && this.lookaheadPropertyName()) {
            var _parsePropertyName3 = this.parsePropertyName();

            _name2 = _parsePropertyName3.name;

            this.expect(_Tokenizer$TokenClass$TokenType.TokenType.LPAREN);
            var param = this.parseBindingElement();
            this.expect(_Tokenizer$TokenClass$TokenType.TokenType.RPAREN);
            var previousYield = this.allowYieldExpression;
            this.allowYieldExpression = false;
            var body = this.parseFunctionBody();
            this.allowYieldExpression = previousYield;
            return {
              methodOrKey: this.markLocation({ type: "Setter", name: _name2, param: param, body: body }, startLocation),
              kind: "method"
            };
          }
        }
      }

      if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.LPAREN)) {
        var previousYield = this.allowYieldExpression;
        var previousInGeneratorParameter = this.inGeneratorParameter;
        this.inGeneratorParameter = isGenerator;
        this.allowYieldExpression = isGenerator;
        var params = this.parseParams();
        this.inGeneratorParameter = previousInGeneratorParameter;
        this.allowYieldExpression = previousYield;
        var previousInGeneratorBody = this.inGeneratorBody;
        this.allowYieldExpression = isGenerator;

        if (isGenerator) {
          this.inGeneratorBody = true;
        }

        var body = this.parseFunctionBody();
        this.allowYieldExpression = previousYield;
        this.inGeneratorBody = previousInGeneratorBody;

        return {
          methodOrKey: this.markLocation({ type: "Method", isGenerator: isGenerator, name: name, params: params, body: body }, startLocation),
          kind: "method"
        };
      }

      return {
        methodOrKey: name,
        kind: token.type.klass.isIdentifierName ? "identifier" : "property",
        binding: binding
      };
    }
  }, {
    key: "parseClass",
    value: function parseClass(_ref4) {
      var _this5 = this;

      var isExpr = _ref4.isExpr;
      var _ref4$inDefault = _ref4.inDefault;
      var inDefault = _ref4$inDefault === undefined ? false : _ref4$inDefault;

      var location = this.getLocation();
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.CLASS);
      var name = null;
      var heritage = null;

      if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.IDENTIFIER)) {
        var idLocation = this.getLocation();
        name = this.parseBindingIdentifier();
      } else if (!isExpr) {
        if (inDefault) {
          name = this.markLocation({ type: "BindingIdentifier", name: "*default*" }, location);
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
          return _this5.parseLeftHandSideExpression({ allowCall: true });
        });
      }

      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.LBRACE);
      var elements = [];
      while (!this.eat(_Tokenizer$TokenClass$TokenType.TokenType.RBRACE)) {
        if (this.eat(_Tokenizer$TokenClass$TokenType.TokenType.SEMICOLON)) {
          continue;
        }
        var methodToken = this.lookahead;
        var isStatic = false;

        var _parseMethodDefinition2 = this.parseMethodDefinition(true);

        var methodOrKey = _parseMethodDefinition2.methodOrKey;
        var kind = _parseMethodDefinition2.kind;

        if (kind === "identifier" && methodOrKey.value === "static") {
          isStatic = true;

          var _parseMethodDefinition3 = this.parseMethodDefinition(false);

          methodOrKey = _parseMethodDefinition3.methodOrKey;
          kind = _parseMethodDefinition3.kind;
        }
        switch (kind) {
          case "method":
            var key = methodOrKey.name;
            elements.push(copyLocation(methodOrKey, { type: "ClassElement", isStatic: isStatic, method: methodOrKey }));
            break;
          default:
            throw this.createError("Only methods are allowed in classes");
        }
      }
      this.allowYieldExpression = previousParamYield;
      this.inGeneratorParameter = previousInGeneratorParameter;
      return this.markLocation({ type: isExpr ? "ClassExpression" : "ClassDeclaration", name: name, "super": heritage, elements: elements }, location);
    }
  }, {
    key: "parseFunction",
    value: function parseFunction(_ref5) {
      var isExpr = _ref5.isExpr;
      var isTopLevel = _ref5.isTopLevel;
      var _ref5$inDefault = _ref5.inDefault;
      var inDefault = _ref5$inDefault === undefined ? false : _ref5$inDefault;
      var _ref5$allowGenerator = _ref5.allowGenerator;
      var allowGenerator = _ref5$allowGenerator === undefined ? true : _ref5$allowGenerator;

      var startLocation = this.getLocation();

      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.FUNCTION);

      var name = null;
      var message = null;
      var isGenerator = allowGenerator && !!this.eat(_Tokenizer$TokenClass$TokenType.TokenType.MUL);
      var previousGeneratorParameter = this.inGeneratorParameter;
      var previousYield = this.allowYieldExpression;
      var previousInGeneratorBody = this.inGeneratorBody;

      if (!this.match(_Tokenizer$TokenClass$TokenType.TokenType.LPAREN)) {
        var token = this.lookahead;
        var identifierLocation = this.getLocation();
        name = this.parseIdentifier();
        name = this.markLocation({ type: "BindingIdentifier", name: name }, identifierLocation);
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
      this.allowYieldExpression = previousYield;

      this.allowYieldExpression = isGenerator;
      if (isGenerator) {
        this.inGeneratorBody = true;
      }

      var body = this.parseFunctionBody();
      this.inGeneratorBody = previousInGeneratorBody;
      this.allowYieldExpression = previousYield;

      return this.markLocation({ type: isExpr ? "FunctionExpression" : "FunctionDeclaration", isGenerator: isGenerator, name: name, params: params, body: body }, startLocation);
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
            var expr = this.parseAssignmentExpression();
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
      var originalInParameter = this.inParameter;
      this.inParameter = true;
      var param = this.parseBindingElement();
      this.inParameter = originalInParameter;
      return param;
    }
  }, {
    key: "parseParams",
    value: function parseParams() {
      var paramsLocation = this.getLocation();

      var items = [],
          rest = null;
      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.LPAREN);

      if (!this.match(_Tokenizer$TokenClass$TokenType.TokenType.RPAREN)) {
        var seenRest = false;

        while (!this.eof()) {
          var token = this.lookahead;
          var param = undefined;
          if (this.eat(_Tokenizer$TokenClass$TokenType.TokenType.ELLIPSIS)) {
            token = this.lookahead;
            param = this.parseBindingIdentifier();
            seenRest = true;
          } else {
            param = this.parseParam();
          }

          if (seenRest) {
            rest = param;
            break;
          }
          items.push(param);
          if (this.match(_Tokenizer$TokenClass$TokenType.TokenType.RPAREN)) {
            break;
          }
          this.expect(_Tokenizer$TokenClass$TokenType.TokenType.COMMA);
        }
      }

      this.expect(_Tokenizer$TokenClass$TokenType.TokenType.RPAREN);

      return this.markLocation({ type: "FormalParameters", items: items, rest: rest }, paramsLocation);
    }
  }], [{
    key: "isValidSimpleAssignmentTarget",
    value: function isValidSimpleAssignmentTarget(node) {
      switch (node.type) {
        case "IdentifierExpression":
        case "ComputedMemberExpression":
        case "StaticMemberExpression":
          return true;
      }
      return false;
    }
  }, {
    key: "transformDestructuring",
    value: function transformDestructuring(node) {
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
            init: null });
        case "ArrayExpression":
          var last = node.elements[node.elements.length - 1];
          if (last != null && last.type === "SpreadElement") {
            return copyLocation(node, {
              type: "ArrayBinding",
              elements: node.elements.slice(0, -1).map(function (e) {
                return e && Parser.transformDestructuring(e);
              }),
              restElement: copyLocation(last.expression, Parser.transformDestructuring(last.expression))
            });
          } else {
            return copyLocation(node, {
              type: "ArrayBinding",
              elements: node.elements.map(function (e) {
                return e && Parser.transformDestructuring(e);
              }),
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
  }, {
    key: "isPrefixOperator",
    value: function isPrefixOperator(type) {
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
  }]);

  return Parser;
})(_Tokenizer$TokenClass$TokenType["default"]);

exports.Parser = Parser;