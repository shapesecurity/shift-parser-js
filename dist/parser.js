"use strict";

var _slicedToArray = function (arr, i) { if (Array.isArray(arr)) { return arr; } else { var _arr = []; for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) { _arr.push(_step.value); if (i && _arr.length === i) break; } return _arr; } };

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

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

var Shift = require("shift-ast");

var _utils = require("./utils");

var isRestrictedWord = _utils.isRestrictedWord;
var isStrictModeReservedWordES5 = _utils.isStrictModeReservedWordES5;
var ErrorMessages = require("./errors").ErrorMessages;
var _tokenizer = require("./tokenizer");

var Tokenizer = _tokenizer["default"];
var TokenClass = _tokenizer.TokenClass;
var TokenType = _tokenizer.TokenType;
var IdentifierToken = _tokenizer.IdentifierToken;
var IdentifierLikeToken = _tokenizer.IdentifierLikeToken;
var NumericLiteralToken = _tokenizer.NumericLiteralToken;
var StringLiteralToken = _tokenizer.StringLiteralToken;


var INIT_MASK = 1;
var GETTER_MASK = 2;
var SETTER_MASK = 4;

var STRICT_MODE_RESERVED_WORD = ["implements", "interface", "package", "private", "protected", "public", "static", "yield", "let"];

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

var Parser = exports.Parser = (function (Tokenizer) {
  function Parser(source) {
    _classCallCheck(this, Parser);

    _get(Object.getPrototypeOf(Parser.prototype), "constructor", this).call(this, source);
    this.labelSet = Object.create(null);
    this.allowIn = true;
    this.inIteration = false;
    this.inSwitch = false;
    this.inFunctionBody = false;
  }

  _inherits(Parser, Tokenizer);

  _prototypeProperties(Parser, {
    isLeftHandSide: {
      value: function isLeftHandSide(expr) {
        switch (expr.type) {
          case "CallExpression":
          case "NewExpression":
          case "StaticMemberExpression":
          case "ComputedMemberExpression":
          case "ArrayExpression":
          case "FunctionExpression":
          case "IdentifierExpression":
          case "LiteralBooleanExpression":
          case "LiteralStringExpression":
          case "LiteralNullExpression":
          case "LiteralRegExpExpression":
          case "ObjectExpression":
          case "ThisExpression":
            return true;
        }
        return false;
      },
      writable: true,
      configurable: true
    },
    isPrefixOperator: {
      value: function isPrefixOperator(type) {
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
      },
      writable: true,
      configurable: true
    }
  }, {
    eat: {
      value: function eat(tokenType) {
        if (this.lookahead.type === tokenType) {
          return this.lex();
        }
      },
      writable: true,
      configurable: true
    },
    expect: {
      value: function expect(tokenType) {
        if (this.lookahead.type === tokenType) {
          return this.lex();
        }
        throw this.createUnexpected(this.lookahead);
      },
      writable: true,
      configurable: true
    },
    match: {
      value: function match(subType) {
        return this.lookahead.type === subType;
      },
      writable: true,
      configurable: true
    },
    consumeSemicolon: {
      value: function consumeSemicolon() {
        if (this.hasLineTerminatorBeforeNext) {
          return;
        }

        if (this.eat(TokenType.SEMICOLON)) {
          return;
        }

        if (!this.eof() && !this.match(TokenType.RBRACE)) {
          throw this.createUnexpected(this.lookahead);
        }
      },
      writable: true,
      configurable: true
    },
    markLocation: {

      // this is a no-op, reserved for future use
      value: function markLocation(node, startLocation) {
        return node;
      },
      writable: true,
      configurable: true
    },
    parseScript: {
      value: function parseScript() {
        var location = this.getLocation();
        var _parseBody = this.parseBody(true);

        var _parseBody2 = _slicedToArray(_parseBody, 1);

        var body = _parseBody2[0];
        return this.markLocation(new Shift.Script(body), location);
      },
      writable: true,
      configurable: true
    },
    parseFunctionBody: {
      value: function parseFunctionBody() {
        var previousStrict = this.strict;
        var startLocation = this.getLocation();

        var oldLabelSet = this.labelSet;
        var oldInIteration = this.inIteration;
        var oldInSwitch = this.inSwitch;
        var oldInFunctionBody = this.inFunctionBody;

        this.labelSet = Object.create(null);
        this.inIteration = false;
        this.inSwitch = false;
        this.inFunctionBody = true;

        this.expect(TokenType.LBRACE);
        var _parseBody = this.parseBody();

        var _parseBody2 = _slicedToArray(_parseBody, 2);

        var body = _parseBody2[0];
        var isStrict = _parseBody2[1];
        this.expect(TokenType.RBRACE);

        body = this.markLocation(body, startLocation);

        this.labelSet = oldLabelSet;
        this.inIteration = oldInIteration;
        this.inSwitch = oldInSwitch;
        this.inFunctionBody = oldInFunctionBody;
        this.strict = previousStrict;
        return [body, isStrict];
      },
      writable: true,
      configurable: true
    },
    parseBody: {
      value: function parseBody() {
        var acceptEOF = arguments[0] === undefined ? false : arguments[0];
        var location = this.getLocation();
        var directives = [];
        var statements = [];
        var parsingDirectives = true;
        var isStrict = this.strict;
        var firstRestricted = null;
        while (true) {
          if (acceptEOF) {
            if (this.eof()) {
              break;
            }
          } else {
            if (this.match(TokenType.RBRACE)) {
              break;
            }
          }
          var token = this.lookahead;
          var text = token.slice.text;
          var isStringLiteral = token instanceof StringLiteralToken;
          var directiveLocation = this.getLocation();
          var stmt = this.parseStatement();
          if (parsingDirectives) {
            if (isStringLiteral && stmt.type === "ExpressionStatement" && stmt.expression.type === "LiteralStringExpression") {
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

        return [this.markLocation(new Shift.FunctionBody(directives, statements), location), isStrict];
      },
      writable: true,
      configurable: true
    },
    parseStatement: {
      value: function parseStatement() {
        var startLocation = this.getLocation();
        if (this.eof()) {
          throw this.createUnexpected(this.lookahead);
        }
        switch (this.lookahead.type) {
          case TokenType.SEMICOLON:
            return this.markLocation(this.parseEmptyStatement(), startLocation);
          case TokenType.LBRACE:
            return this.markLocation(this.parseBlockStatement(), startLocation);
          case TokenType.LPAREN:
            return this.markLocation(this.parseExpressionStatement(), startLocation);
          case TokenType.BREAK:
            return this.markLocation(this.parseBreakStatement(), startLocation);
          case TokenType.CONTINUE:
            return this.markLocation(this.parseContinueStatement(), startLocation);
          case TokenType.DEBUGGER:
            return this.markLocation(this.parseDebuggerStatement(), startLocation);
          case TokenType.DO:
            return this.markLocation(this.parseDoWhileStatement(), startLocation);
          case TokenType.FOR:
            return this.markLocation(this.parseForStatement(), startLocation);
          case TokenType.FUNCTION:
            return this.markLocation(this.parseFunction(false), startLocation);
          case TokenType.IF:
            return this.markLocation(this.parseIfStatement(), startLocation);
          case TokenType.RETURN:
            return this.markLocation(this.parseReturnStatement(), startLocation);
          case TokenType.SWITCH:
            return this.markLocation(this.parseSwitchStatement(), startLocation);
          case TokenType.THROW:
            return this.markLocation(this.parseThrowStatement(), startLocation);
          case TokenType.TRY:
            return this.markLocation(this.parseTryStatement(), startLocation);
          case TokenType.VAR:
          case TokenType.LET:
          case TokenType.CONST:
            return this.markLocation(this.parseVariableDeclarationStatement(), startLocation);
          case TokenType.WHILE:
            return this.markLocation(this.parseWhileStatement(), startLocation);
          case TokenType.WITH:
            return this.markLocation(this.parseWithStatement(), startLocation);
          default:
            {
              var expr = this.parseExpression();

              // 12.12 Labelled Statements;
              if (expr.type === "IdentifierExpression" && this.match(TokenType.COLON)) {
                this.lex();
                var key = "$" + expr.identifier.name;
                if (({}).hasOwnProperty.call(this.labelSet, key)) {
                  throw this.createError(ErrorMessages.LABEL_REDECLARATION, expr.identifier.name);
                }

                this.labelSet[key] = true;
                var labeledBody = this.parseStatement();
                delete this.labelSet[key];
                return this.markLocation(new Shift.LabeledStatement(expr.identifier, labeledBody), startLocation);
              } else {
                this.consumeSemicolon();
                return this.markLocation(new Shift.ExpressionStatement(expr), startLocation);
              }
            }
        }
      },
      writable: true,
      configurable: true
    },
    parseVariableIdentifier: {
      value: function parseVariableIdentifier() {
        var startLocation = this.getLocation();

        var token = this.lex();
        if (!(token instanceof IdentifierToken)) {
          throw this.createUnexpected(token);
        }

        return this.markLocation(new Shift.Identifier(token.value), startLocation);
      },
      writable: true,
      configurable: true
    },
    parseEmptyStatement: {
      value: function parseEmptyStatement() {
        this.expect(TokenType.SEMICOLON);
        return new Shift.EmptyStatement();
      },
      writable: true,
      configurable: true
    },
    parseBlockStatement: {
      value: function parseBlockStatement() {
        return new Shift.BlockStatement(this.parseBlock());
      },
      writable: true,
      configurable: true
    },
    parseExpressionStatement: {
      value: function parseExpressionStatement() {
        var expr = this.parseExpression();
        this.consumeSemicolon();
        return new Shift.ExpressionStatement(expr);
      },
      writable: true,
      configurable: true
    },
    parseBreakStatement: {
      value: function parseBreakStatement() {
        var token = this.lookahead;
        this.expect(TokenType.BREAK);

        // Catch the very common case first: immediately a semicolon (U+003B).
        if (this.lookahead.type == TokenType.SEMICOLON) {
          this.lex();

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

        var label = null;
        if (this.lookahead.type == TokenType.IDENTIFIER) {
          label = this.parseVariableIdentifier();

          var key = "$" + label.name;
          if (!({}).hasOwnProperty.call(this.labelSet, key)) {
            throw this.createError(ErrorMessages.UNKNOWN_LABEL, label.name);
          }
        }

        this.consumeSemicolon();

        if (label == null && !(this.inIteration || this.inSwitch)) {
          throw this.createErrorWithLocation(token, ErrorMessages.ILLEGAL_BREAK);
        }

        return new Shift.BreakStatement(label);
      },
      writable: true,
      configurable: true
    },
    parseContinueStatement: {
      value: function parseContinueStatement() {
        var token = this.lookahead;
        this.expect(TokenType.CONTINUE);

        // Catch the very common case first: immediately a semicolon (U+003B).
        if (this.lookahead.type == TokenType.SEMICOLON) {
          this.lex();
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

        var label = null;
        if (this.lookahead.type == TokenType.IDENTIFIER) {
          label = this.parseVariableIdentifier();

          var key = "$" + label.name;
          if (!({}).hasOwnProperty.call(this.labelSet, key)) {
            throw this.createError(ErrorMessages.UNKNOWN_LABEL, label.name);
          }
        }

        this.consumeSemicolon();
        if (!this.inIteration) {
          throw this.createErrorWithLocation(token, ErrorMessages.ILLEGAL_CONTINUE);
        }

        return new Shift.ContinueStatement(label);
      },
      writable: true,
      configurable: true
    },
    parseDebuggerStatement: {
      value: function parseDebuggerStatement() {
        this.expect(TokenType.DEBUGGER);
        this.consumeSemicolon();
        return new Shift.DebuggerStatement();
      },
      writable: true,
      configurable: true
    },
    parseDoWhileStatement: {
      value: function parseDoWhileStatement() {
        this.expect(TokenType.DO);
        var oldInIteration = this.inIteration;
        this.inIteration = true;

        var body = this.parseStatement();
        this.inIteration = oldInIteration;

        this.expect(TokenType.WHILE);
        this.expect(TokenType.LPAREN);
        var test = this.parseExpression();
        this.expect(TokenType.RPAREN);
        this.consumeSemicolon();

        return new Shift.DoWhileStatement(body, test);
      },
      writable: true,
      configurable: true
    },
    parseForStatement: {
      value: function parseForStatement() {
        this.expect(TokenType.FOR);
        this.expect(TokenType.LPAREN);
        var test = null;
        var right = null;
        if (this.match(TokenType.SEMICOLON)) {
          this.lex();
          if (!this.match(TokenType.SEMICOLON)) {
            test = this.parseExpression();
          }
          this.expect(TokenType.SEMICOLON);
          if (!this.match(TokenType.RPAREN)) {
            right = this.parseExpression();
          }
          return new Shift.ForStatement(null, test, right, this.getIteratorStatementEpilogue());
        } else {
          if (this.match(TokenType.VAR) || this.match(TokenType.LET)) {
            var previousAllowIn = this.allowIn;
            this.allowIn = false;
            var initDecl = this.parseVariableDeclaration();
            this.allowIn = previousAllowIn;

            if (initDecl.declarators.length === 1 && this.match(TokenType.IN)) {
              this.lex();
              right = this.parseExpression();
              return new Shift.ForInStatement(initDecl, right, this.getIteratorStatementEpilogue());
            } else {
              this.expect(TokenType.SEMICOLON);
              if (!this.match(TokenType.SEMICOLON)) {
                test = this.parseExpression();
              }
              this.expect(TokenType.SEMICOLON);
              if (!this.match(TokenType.RPAREN)) {
                right = this.parseExpression();
              }
              return new Shift.ForStatement(initDecl, test, right, this.getIteratorStatementEpilogue());
            }
          } else {
            var previousAllowIn = this.allowIn;
            this.allowIn = false;
            var init = this.parseExpression();
            this.allowIn = previousAllowIn;

            if (this.match(TokenType.IN)) {
              if (!Parser.isLeftHandSide(init)) {
                throw this.createError(ErrorMessages.INVALID_LHS_IN_FOR_IN);
              }

              this.lex();
              right = this.parseExpression();
              return new Shift.ForInStatement(init, right, this.getIteratorStatementEpilogue());
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
      },
      writable: true,
      configurable: true
    },
    getIteratorStatementEpilogue: {
      value: function getIteratorStatementEpilogue() {
        this.expect(TokenType.RPAREN);
        var oldInIteration = this.inIteration;
        this.inIteration = true;
        var body = this.parseStatement();
        this.inIteration = oldInIteration;
        return body;
      },
      writable: true,
      configurable: true
    },
    parseIfStatement: {
      value: function parseIfStatement() {
        this.expect(TokenType.IF);
        this.expect(TokenType.LPAREN);
        var test = this.parseExpression();

        this.expect(TokenType.RPAREN);
        var consequent = this.parseStatement();
        var alternate = null;
        if (this.match(TokenType.ELSE)) {
          this.lex();
          alternate = this.parseStatement();
        }
        return new Shift.IfStatement(test, consequent, alternate);
      },
      writable: true,
      configurable: true
    },
    parseReturnStatement: {
      value: function parseReturnStatement() {
        var argument = null;

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
      },
      writable: true,
      configurable: true
    },
    parseWithStatement: {
      value: function parseWithStatement() {
        if (this.strict) {
          throw this.createError(ErrorMessages.STRICT_MODE_WITH);
        }

        this.expect(TokenType.WITH);
        this.expect(TokenType.LPAREN);
        var object = this.parseExpression();
        this.expect(TokenType.RPAREN);
        var body = this.parseStatement();

        return new Shift.WithStatement(object, body);
      },
      writable: true,
      configurable: true
    },
    parseSwitchStatement: {
      value: function parseSwitchStatement() {
        this.expect(TokenType.SWITCH);
        this.expect(TokenType.LPAREN);
        var discriminant = this.parseExpression();
        this.expect(TokenType.RPAREN);
        this.expect(TokenType.LBRACE);

        if (this.match(TokenType.RBRACE)) {
          this.lex();
          return new Shift.SwitchStatement(discriminant, []);
        }
        var oldInSwitch = this.inSwitch;
        this.inSwitch = true;

        var cases = this.parseSwitchCases();

        if (this.match(TokenType.DEFAULT)) {
          var switchDefault = this.parseSwitchDefault();
          var postDefaultCases = this.parseSwitchCases();
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
      },
      writable: true,
      configurable: true
    },
    parseSwitchCases: {
      value: function parseSwitchCases() {
        var result = [];
        while (!(this.eof() || this.match(TokenType.RBRACE) || this.match(TokenType.DEFAULT))) {
          result.push(this.parseSwitchCase());
        }
        return result;
      },
      writable: true,
      configurable: true
    },
    parseSwitchCase: {
      value: function parseSwitchCase() {
        var startLocation = this.getLocation();
        this.expect(TokenType.CASE);
        return this.markLocation(new Shift.SwitchCase(this.parseExpression(), this.parseSwitchCaseBody()), startLocation);
      },
      writable: true,
      configurable: true
    },
    parseSwitchDefault: {
      value: function parseSwitchDefault() {
        var startLocation = this.getLocation();
        this.expect(TokenType.DEFAULT);
        return this.markLocation(new Shift.SwitchDefault(this.parseSwitchCaseBody()), startLocation);
      },
      writable: true,
      configurable: true
    },
    parseSwitchCaseBody: {
      value: function parseSwitchCaseBody() {
        this.expect(TokenType.COLON);
        return this.parseStatementListInSwitchCaseBody();
      },
      writable: true,
      configurable: true
    },
    parseStatementListInSwitchCaseBody: {
      value: function parseStatementListInSwitchCaseBody() {
        var result = [];
        while (!(this.eof() || this.match(TokenType.RBRACE) || this.match(TokenType.DEFAULT) || this.match(TokenType.CASE))) {
          result.push(this.parseStatement());
        }
        return result;
      },
      writable: true,
      configurable: true
    },
    parseThrowStatement: {
      value: function parseThrowStatement() {
        var token = this.expect(TokenType.THROW);

        if (this.hasLineTerminatorBeforeNext) {
          throw this.createErrorWithLocation(token, ErrorMessages.NEWLINE_AFTER_THROW);
        }

        var argument = this.parseExpression();

        this.consumeSemicolon();

        return new Shift.ThrowStatement(argument);
      },
      writable: true,
      configurable: true
    },
    parseTryStatement: {
      value: function parseTryStatement() {
        this.expect(TokenType.TRY);
        var block = this.parseBlock();

        if (this.match(TokenType.CATCH)) {
          var handler = this.parseCatchClause();
          if (this.match(TokenType.FINALLY)) {
            this.lex();
            var finalizer = this.parseBlock();
            return new Shift.TryFinallyStatement(block, handler, finalizer);
          }
          return new Shift.TryCatchStatement(block, handler);
        }

        if (this.match(TokenType.FINALLY)) {
          this.lex();
          var finalizer = this.parseBlock();
          return new Shift.TryFinallyStatement(block, null, finalizer);
        } else {
          throw this.createError(ErrorMessages.NO_CATCH_OR_FINALLY);
        }
      },
      writable: true,
      configurable: true
    },
    parseVariableDeclarationStatement: {
      value: function parseVariableDeclarationStatement() {
        var declaration = this.parseVariableDeclaration();
        this.consumeSemicolon();
        return new Shift.VariableDeclarationStatement(declaration);
      },
      writable: true,
      configurable: true
    },
    parseWhileStatement: {
      value: function parseWhileStatement() {
        this.expect(TokenType.WHILE);
        this.expect(TokenType.LPAREN);
        return new Shift.WhileStatement(this.parseExpression(), this.getIteratorStatementEpilogue());
      },
      writable: true,
      configurable: true
    },
    parseCatchClause: {
      value: function parseCatchClause() {
        var startLocation = this.getLocation();

        this.expect(TokenType.CATCH);
        this.expect(TokenType.LPAREN);
        if (this.match(TokenType.RPAREN)) {
          throw this.createUnexpected(this.lookahead);
        }

        var param = this.parseVariableIdentifier();

        // 12.14.1;
        if (this.strict && isRestrictedWord(param.name)) {
          throw this.createError(ErrorMessages.STRICT_CATCH_VARIABLE);
        }

        this.expect(TokenType.RPAREN);

        var body = this.parseBlock();

        return this.markLocation(new Shift.CatchClause(param, body), startLocation);
      },
      writable: true,
      configurable: true
    },
    parseBlock: {
      value: function parseBlock() {
        var startLocation = this.getLocation();
        this.expect(TokenType.LBRACE);

        var body = [];
        while (!this.match(TokenType.RBRACE)) {
          body.push(this.parseStatement());
        }
        this.expect(TokenType.RBRACE);

        return this.markLocation(new Shift.Block(body), startLocation);
      },
      writable: true,
      configurable: true
    },
    parseVariableDeclaration: {
      value: function parseVariableDeclaration() {
        var startLocation = this.getLocation();
        var token = this.lex();

        // Preceded by this.match(TokenSubType.VAR) || this.match(TokenSubType.LET);
        var kind = token.type == TokenType.VAR ? "var" : token.type === TokenType.CONST ? "const" : "let";
        var declarators = this.parseVariableDeclaratorList(kind);
        return this.markLocation(new Shift.VariableDeclaration(kind, declarators), startLocation);
      },
      writable: true,
      configurable: true
    },
    parseVariableDeclaratorList: {
      value: function parseVariableDeclaratorList(kind) {
        var result = [];
        while (true) {
          result.push(this.parseVariableDeclarator(kind));
          if (!this.eat(TokenType.COMMA)) {
            return result;
          }
        }
      },
      writable: true,
      configurable: true
    },
    parseVariableDeclarator: {
      value: function parseVariableDeclarator(kind) {
        var startLocation = this.getLocation();

        var id = this.parseVariableIdentifier();

        // 12.2.1;
        if (this.strict && isRestrictedWord(id.name)) {
          throw this.createError(ErrorMessages.STRICT_VAR_NAME);
        }

        var init = null;
        if (kind == "const") {
          this.expect(TokenType.ASSIGN);
          init = this.parseAssignmentExpression();
        } else if (this.match(TokenType.ASSIGN)) {
          this.lex();
          init = this.parseAssignmentExpression();
        }
        return this.markLocation(new Shift.VariableDeclarator(id, init), startLocation);
      },
      writable: true,
      configurable: true
    },
    parseExpression: {
      value: function parseExpression() {
        var startLocation = this.getLocation();

        var expr = this.parseAssignmentExpression();

        if (this.match(TokenType.COMMA)) {
          while (!this.eof()) {
            if (!this.match(TokenType.COMMA)) {
              break;
            }
            this.lex();
            expr = this.markLocation(new Shift.BinaryExpression(",", expr, this.parseAssignmentExpression()), startLocation);
          }
        }
        return expr;
      },
      writable: true,
      configurable: true
    },
    parseAssignmentExpression: {
      value: function parseAssignmentExpression() {
        var token = this.lookahead;
        var startLocation = this.getLocation();

        var isParenthesised = token.type === TokenType.LPAREN;
        var node = this.parseConditionalExpression();

        var isOperator = false;
        var operator = this.lookahead;
        switch (operator.type) {
          case TokenType.ASSIGN:
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
            isOperator = true;
            break;
        }

        if (isOperator) {
          if (!isParenthesised && !Parser.isLeftHandSide(node)) {
            throw this.createError(ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
          }

          // 11.13.1;
          if (node.type === "IdentifierExpression") {
            if (this.strict && isRestrictedWord(node.identifier.name)) {
              throw this.createErrorWithLocation(token, ErrorMessages.STRICT_LHS_ASSIGNMENT);
            }
          }

          this.lex();
          var right = this.parseAssignmentExpression();
          return this.markLocation(new Shift.AssignmentExpression(operator.type.name, node, right), startLocation);
        }
        return node;
      },
      writable: true,
      configurable: true
    },
    parseConditionalExpression: {
      value: function parseConditionalExpression() {
        var startLocation = this.getLocation();
        var expr = this.parseBinaryExpression();
        if (this.match(TokenType.CONDITIONAL)) {
          this.lex();
          var previousAllowIn = this.allowIn;
          this.allowIn = true;
          var consequent = this.parseAssignmentExpression();
          this.allowIn = previousAllowIn;
          this.expect(TokenType.COLON);
          var alternate = this.parseAssignmentExpression();
          return this.markLocation(new Shift.ConditionalExpression(expr, consequent, alternate), startLocation);
        }

        return expr;
      },
      writable: true,
      configurable: true
    },
    isBinaryOperator: {
      value: function isBinaryOperator(type) {
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
      },
      writable: true,
      configurable: true
    },
    parseBinaryExpression: {
      value: function parseBinaryExpression() {
        var _this = this;
        var location = this.getLocation();
        var left = this.parseUnaryExpression();
        var operator = this.lookahead.type;

        var isBinaryOperator = this.isBinaryOperator(operator);
        if (!isBinaryOperator) {
          return left;
        }

        this.lex();
        var stack = [];
        stack.push({ location: location, left: left, operator: operator, precedence: BinaryPrecedence[operator.name] });
        location = this.getLocation();
        var right = this.parseUnaryExpression();

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
            right = this.markLocation(new Shift.BinaryExpression(stackOperator.name, left, right), location);
          }

          // Shift.
          this.lex();
          stack.push({ location: location, left: right, operator: operator, precedence: precedence });
          location = this.getLocation();
          right = this.parseUnaryExpression();

          operator = this.lookahead.type;
          isBinaryOperator = this.isBinaryOperator(operator);
        }

        // Final reduce to clean-up the stack.
        return stack.reduceRight(function (expr, stackItem) {
          return _this.markLocation(new Shift.BinaryExpression(stackItem.operator.name, stackItem.left, expr), stackItem.location);
        }, right);
      },
      writable: true,
      configurable: true
    },
    parseUnaryExpression: {
      value: function parseUnaryExpression() {
        if (this.lookahead.type.klass != TokenClass.Punctuator && this.lookahead.type.klass != TokenClass.Keyword) {
          return this.parsePostfixExpression();
        }
        var startLocation = this.getLocation();
        var operator = this.lookahead;
        if (!Parser.isPrefixOperator(operator.type)) {
          return this.parsePostfixExpression();
        }
        this.lex();
        var expr = this.parseUnaryExpression();
        switch (operator.type) {
          case TokenType.INC:
          case TokenType.DEC:
            // 11.4.4, 11.4.5;
            if (expr.type === "IdentifierExpression") {
              if (this.strict && isRestrictedWord(expr.identifier.name)) {
                throw this.createError(ErrorMessages.STRICT_LHS_PREFIX);
              }
            }

            if (!Parser.isLeftHandSide(expr)) {
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
      },
      writable: true,
      configurable: true
    },
    parsePostfixExpression: {
      value: function parsePostfixExpression() {
        var startLocation = this.getLocation();

        var expr = this.parseLeftHandSideExpressionAllowCall();

        if (this.hasLineTerminatorBeforeNext) {
          return expr;
        }

        var operator = this.lookahead;
        if (operator.type !== TokenType.INC && operator.type !== TokenType.DEC) {
          return expr;
        }
        this.lex();
        // 11.3.1, 11.3.2;
        if (expr.type === "IdentifierExpression") {
          if (this.strict && isRestrictedWord(expr.identifier.name)) {
            throw this.createError(ErrorMessages.STRICT_LHS_POSTFIX);
          }
        }
        if (!Parser.isLeftHandSide(expr)) {
          throw this.createError(ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
        }
        return this.markLocation(new Shift.PostfixExpression(expr, operator.value), startLocation);
      },
      writable: true,
      configurable: true
    },
    parseLeftHandSideExpressionAllowCall: {
      value: function parseLeftHandSideExpressionAllowCall() {
        var startLocation = this.getLocation();
        var previousAllowIn = this.allowIn;
        this.allowIn = true;
        var expr = this.match(TokenType.NEW) ? this.parseNewExpression() : this.parsePrimaryExpression();

        while (true) {
          if (this.match(TokenType.LPAREN)) {
            expr = this.markLocation(new Shift.CallExpression(expr, this.parseArgumentList()), startLocation);
          } else if (this.match(TokenType.LBRACK)) {
            expr = this.markLocation(new Shift.ComputedMemberExpression(expr, this.parseComputedMember()), startLocation);
          } else if (this.match(TokenType.PERIOD)) {
            expr = this.markLocation(new Shift.StaticMemberExpression(expr, this.parseNonComputedMember()), startLocation);
          } else {
            break;
          }
        }

        this.allowIn = previousAllowIn;

        return expr;
      },
      writable: true,
      configurable: true
    },
    parseLeftHandSideExpression: {
      value: function parseLeftHandSideExpression() {
        var startLocation = this.getLocation();

        var expr = this.match(TokenType.NEW) ? this.parseNewExpression() : this.parsePrimaryExpression();

        while (this.match(TokenType.PERIOD) || this.match(TokenType.LBRACK)) {
          expr = this.markLocation(this.match(TokenType.LBRACK) ? new Shift.ComputedMemberExpression(expr, this.parseComputedMember()) : new Shift.StaticMemberExpression(expr, this.parseNonComputedMember()), startLocation);
        }

        return expr;
      },
      writable: true,
      configurable: true
    },
    parseNonComputedMember: {
      value: function parseNonComputedMember() {
        this.expect(TokenType.PERIOD);
        return this.parseNonComputedProperty();
      },
      writable: true,
      configurable: true
    },
    parseComputedMember: {
      value: function parseComputedMember() {
        this.expect(TokenType.LBRACK);
        var expr = this.parseExpression();
        this.expect(TokenType.RBRACK);
        return expr;
      },
      writable: true,
      configurable: true
    },
    parseNewExpression: {
      value: function parseNewExpression() {
        var startLocation = this.getLocation();
        this.expect(TokenType.NEW);
        var callee = this.parseLeftHandSideExpression();
        return this.markLocation(new Shift.NewExpression(callee, this.match(TokenType.LPAREN) ? this.parseArgumentList() : []), startLocation);
      },
      writable: true,
      configurable: true
    },
    parsePrimaryExpression: {
      value: function parsePrimaryExpression() {
        if (this.match(TokenType.LPAREN)) {
          return this.parseGroupExpression();
        }

        var startLocation = this.getLocation();

        switch (this.lookahead.type.klass) {
          case TokenClass.Ident:
            return this.markLocation(new Shift.IdentifierExpression(this.parseIdentifier()), startLocation);
          case TokenClass.StringLiteral:
            return this.parseStringLiteral();
          case TokenClass.NumericLiteral:
            return this.parseNumericLiteral();
          case TokenClass.Keyword:
            {
              if (this.match(TokenType.THIS)) {
                this.lex();
                return this.markLocation(new Shift.ThisExpression(), startLocation);
              }
              if (this.match(TokenType.FUNCTION)) {
                return this.markLocation(this.parseFunction(true), startLocation);
              }
              break;
            }
          case TokenClass.BooleanLiteral:
            {
              var token = this.lex();
              return this.markLocation(new Shift.LiteralBooleanExpression(token.type == TokenType.TRUE_LITERAL), startLocation);
            }
          case TokenClass.NullLiteral:
            {
              this.lex();
              return this.markLocation(new Shift.LiteralNullExpression(), startLocation);
            }
          default:
            if (this.match(TokenType.LBRACK)) {
              return this.parseArrayExpression();
            } else if (this.match(TokenType.LBRACE)) {
              return this.parseObjectExpression();
            } else if (this.match(TokenType.DIV) || this.match(TokenType.ASSIGN_DIV)) {
              this.index = this.startIndex;
              this.line = this.startLine;
              this.lineStart = this.startLineStart;
              this.lookahead = this.scanRegExp();
              var token = this.lex();
              try {
                var lastSlash = token.value.lastIndexOf("/");
                RegExp(token.value.slice(1, lastSlash), token.value.slice(lastSlash + 1));
              } catch (unused) {
                throw this.createErrorWithLocation(token, ErrorMessages.INVALID_REGULAR_EXPRESSION);
              }
              return this.markLocation(new Shift.LiteralRegExpExpression(token.value), startLocation);
            }
        }

        throw this.createUnexpected(this.lex());
      },
      writable: true,
      configurable: true
    },
    parseNumericLiteral: {
      value: function parseNumericLiteral() {
        var startLocation = this.getLocation();
        if (this.strict && this.lookahead.octal) {
          throw this.createErrorWithLocation(this.lookahead, ErrorMessages.STRICT_OCTAL_LITERAL);
        }
        var token2 = this.lex();
        var node = token2._value === 1 / 0 ? new Shift.LiteralInfinityExpression() : new Shift.LiteralNumericExpression(token2._value);
        return this.markLocation(node, startLocation);
      },
      writable: true,
      configurable: true
    },
    parseStringLiteral: {
      value: function parseStringLiteral() {
        var startLocation = this.getLocation();
        if (this.strict && this.lookahead.octal) {
          throw this.createErrorWithLocation(this.lookahead, ErrorMessages.STRICT_OCTAL_LITERAL);
        }
        var token2 = this.lex();
        return this.markLocation(new Shift.LiteralStringExpression(token2._value, token2.slice.text), startLocation);
      },
      writable: true,
      configurable: true
    },
    parseIdentifier: {
      value: function parseIdentifier() {
        var startLocation = this.getLocation();
        return this.markLocation(new Shift.Identifier(this.lex().value), startLocation);
      },
      writable: true,
      configurable: true
    },
    parseArgumentList: {
      value: function parseArgumentList() {
        this.expect(TokenType.LPAREN);
        var args = this.parseArguments();
        this.expect(TokenType.RPAREN);
        return args;
      },
      writable: true,
      configurable: true
    },
    parseArguments: {
      value: function parseArguments() {
        var result = [];
        while (true) {
          if (this.match(TokenType.RPAREN) || this.eof()) {
            return result;
          }
          var arg = this.parseAssignmentExpression();
          result.push(arg);
          if (!this.eat(TokenType.COMMA)) {
            break;
          }
        }
        return result;
      },
      writable: true,
      configurable: true
    },
    parseNonComputedProperty: {

      // 11.2 Left-Hand-Side Expressions;

      value: function parseNonComputedProperty() {
        var startLocation = this.getLocation();

        var token = this.lex();

        if (!(token instanceof IdentifierLikeToken)) {
          throw this.createUnexpected(token);
        } else {
          return this.markLocation(new Shift.Identifier(token.value), startLocation);
        }
      },
      writable: true,
      configurable: true
    },
    parseGroupExpression: {
      value: function parseGroupExpression() {
        this.expect(TokenType.LPAREN);
        var expr = this.parseExpression();
        this.expect(TokenType.RPAREN);
        return expr;
      },
      writable: true,
      configurable: true
    },
    parseArrayExpression: {
      value: function parseArrayExpression() {
        var startLocation = this.getLocation();

        this.expect(TokenType.LBRACK);

        var elements = this.parseArrayExpressionElements();

        this.expect(TokenType.RBRACK);

        return this.markLocation(new Shift.ArrayExpression(elements), startLocation);
      },
      writable: true,
      configurable: true
    },
    parseArrayExpressionElements: {
      value: function parseArrayExpressionElements() {
        var result = [];
        while (true) {
          if (this.match(TokenType.RBRACK)) {
            return result;
          }
          var el = undefined;

          if (this.match(TokenType.COMMA)) {
            this.lex();
            el = null;
          } else {
            el = this.parseAssignmentExpression();
            if (!this.match(TokenType.RBRACK)) {
              this.expect(TokenType.COMMA);
            }
          }
          result.push(el);
        }
      },
      writable: true,
      configurable: true
    },
    parseObjectExpression: {
      value: function parseObjectExpression() {
        var startLocation = this.getLocation();

        this.expect(TokenType.LBRACE);

        var propertyMap = Object.create(null);
        var properties = this.parseObjectExpressionItems(propertyMap);

        this.expect(TokenType.RBRACE);

        return this.markLocation(new Shift.ObjectExpression(properties), startLocation);
      },
      writable: true,
      configurable: true
    },
    parseObjectExpressionItems: {
      value: function parseObjectExpressionItems(propertyMap) {
        var result = [];
        while (!this.match(TokenType.RBRACE)) {
          result.push(this.parseObjectExpressionItem(propertyMap));
        }
        return result;
      },
      writable: true,
      configurable: true
    },
    parseObjectExpressionItem: {
      value: function parseObjectExpressionItem(propertyMap) {
        var property = this.parseObjectProperty();
        var type = property.type;
        var key = "$" + property.name.value;
        var value = ({}).hasOwnProperty.call(propertyMap, key) ? propertyMap[key] : 0;

        if (({}).hasOwnProperty.call(propertyMap, key)) {
          if ((value & INIT_MASK) !== 0) {
            if (this.strict && type === "DataProperty") {
              throw this.createError(ErrorMessages.STRICT_DUPLICATE_PROPERTY);
            } else if (type !== "DataProperty") {
              throw this.createError(ErrorMessages.ACCESSOR_DATA_PROPERTY);
            }
          } else {
            if (type === "DataProperty") {
              throw this.createError(ErrorMessages.ACCESSOR_DATA_PROPERTY);
            } else if ((value & GETTER_MASK) !== 0 && type == "Getter" || (value & SETTER_MASK) !== 0 && type == "Setter") {
              throw this.createError(ErrorMessages.ACCESSOR_GET_SET);
            }
          }
        }
        switch (type) {
          case "DataProperty":
            propertyMap[key] = value | INIT_MASK;
            break;
          case "Getter":
            propertyMap[key] = value | GETTER_MASK;
            break;
          case "Setter":
            propertyMap[key] = value | SETTER_MASK;
            break;
        }

        if (!this.match(TokenType.RBRACE)) {
          this.expect(TokenType.COMMA);
        }
        return property;
      },
      writable: true,
      configurable: true
    },
    parseObjectPropertyKey: {
      value: function parseObjectPropertyKey() {
        var token = this.lookahead;
        var location = this.getLocation();

        // Note: This function is called only from parseObjectProperty(), where;
        // Eof and Punctuator tokens are already filtered out.

        if (token instanceof StringLiteralToken) {
          return this.markLocation(new Shift.StaticPropertyName(this.parseStringLiteral().value), location);
        }
        if (token instanceof NumericLiteralToken) {
          var numLiteral = this.parseNumericLiteral();
          return this.markLocation(new Shift.StaticPropertyName("" + (numLiteral.type === "LiteralInfinityExpression" ? 1 / 0 : numLiteral.value)), location);
        }
        if (token instanceof IdentifierLikeToken) {
          return this.markLocation(new Shift.StaticPropertyName(this.parseIdentifier().name), location);
        }

        throw this.createError(ErrorMessages.INVALID_PROPERTY_NAME);
      },
      writable: true,
      configurable: true
    },
    parseObjectProperty: {
      value: function parseObjectProperty() {
        var token = this.lookahead;
        var startLocation = this.getLocation();

        if (token.type === TokenType.IDENTIFIER) {
          var key = this.parseObjectPropertyKey();
          var _name = token.value;
          if (_name.length === 3) {
            // Property Assignment: Getter and Setter.
            if ("get" === _name && !this.match(TokenType.COLON)) {
              key = this.parseObjectPropertyKey();
              this.expect(TokenType.LPAREN);
              this.expect(TokenType.RPAREN);
              var _parseFunctionBody = this.parseFunctionBody();

              var _parseFunctionBody2 = _slicedToArray(_parseFunctionBody, 2);

              var body = _parseFunctionBody2[0];
              var isStrict = _parseFunctionBody2[1];
              return this.markLocation(new Shift.Getter(key, body), startLocation);
            } else if ("set" === _name && !this.match(TokenType.COLON)) {
              key = this.parseObjectPropertyKey();
              this.expect(TokenType.LPAREN);
              token = this.lookahead;
              if (token.type !== TokenType.IDENTIFIER) {
                this.expect(TokenType.RPAREN);
                throw this.createErrorWithLocation(token, ErrorMessages.UNEXPECTED_TOKEN, token.type.name);
              } else {
                var param = this.parseVariableIdentifier();
                this.expect(TokenType.RPAREN);
                var _parseFunctionBody3 = this.parseFunctionBody();

                var _parseFunctionBody32 = _slicedToArray(_parseFunctionBody3, 2);

                var body = _parseFunctionBody32[0];
                var isStrict = _parseFunctionBody32[1];
                if ((this.strict || isStrict) && isRestrictedWord(param.name)) {
                  throw this.createError(ErrorMessages.STRICT_PARAM_NAME);
                }
                return this.markLocation(new Shift.Setter(key, param, body), startLocation);
              }
            }
          }

          if (this.eat(TokenType.COLON)) {
            var value = this.parseAssignmentExpression();
            return this.markLocation(new Shift.DataProperty(key, value), startLocation);
          } else {
            return this.markLocation(new Shift.ShorthandProperty(new Shift.Identifier(key.value)), startLocation);
          }
        }
        if (this.eof() || token.type.klass == TokenClass.Punctuator) {
          throw this.createUnexpected(token);
        } else {
          var key = this.parseObjectPropertyKey();
          this.expect(TokenType.COLON);
          var value = this.parseAssignmentExpression();
          return this.markLocation(new Shift.DataProperty(key, value), startLocation);
        }
      },
      writable: true,
      configurable: true
    },
    parseFunction: {
      value: function parseFunction(isExpression) {
        var startLocation = this.getLocation();

        this.expect(TokenType.FUNCTION);

        var id = null;
        var message = null;
        var firstRestricted = null;
        if (!isExpression || !this.match(TokenType.LPAREN)) {
          var token = this.lookahead;
          id = this.parseVariableIdentifier();
          if (this.strict) {
            if (isRestrictedWord(id.name)) {
              throw this.createErrorWithLocation(token, ErrorMessages.STRICT_FUNCTION_NAME);
            }
          } else {
            if (isRestrictedWord(id.name)) {
              firstRestricted = token;
              message = ErrorMessages.STRICT_FUNCTION_NAME;
            } else if (isStrictModeReservedWordES5(id.name)) {
              firstRestricted = token;
              message = ErrorMessages.STRICT_RESERVED_WORD;
            }
          }
        }
        var info = this.parseParams(firstRestricted);

        if (info.message != null) {
          message = info.message;
        }

        var previousStrict = this.strict;
        var _parseFunctionBody = this.parseFunctionBody();

        var _parseFunctionBody2 = _slicedToArray(_parseFunctionBody, 2);

        var body = _parseFunctionBody2[0];
        var isStrict = _parseFunctionBody2[1];
        if (message != null) {
          if ((this.strict || isStrict) && info.firstRestricted != null) {
            throw this.createErrorWithLocation(info.firstRestricted, message);
          }
          if ((this.strict || isStrict) && info.stricted != null) {
            throw this.createErrorWithLocation(info.stricted, message);
          }
        }
        this.strict = previousStrict;
        return this.markLocation(new (isExpression ? Shift.FunctionExpression : Shift.FunctionDeclaration)(false, id, info.params, null, body), startLocation);
      },
      writable: true,
      configurable: true
    },
    parseParams: {
      value: function parseParams(fr) {
        var info = { params: [] };
        info.firstRestricted = fr;
        this.expect(TokenType.LPAREN);

        if (!this.match(TokenType.RPAREN)) {
          var paramSet = Object.create(null);

          while (!this.eof()) {
            var token = this.lookahead;
            var param = this.parseVariableIdentifier();
            var key = "$" + param.name;
            if (this.strict) {
              if (token instanceof IdentifierLikeToken && isRestrictedWord(param.name)) {
                info.stricted = token;
                info.message = ErrorMessages.STRICT_PARAM_NAME;
              }
              if (({}).hasOwnProperty.call(paramSet, key)) {
                info.stricted = token;
                info.message = ErrorMessages.STRICT_PARAM_DUPE;
              }
            } else if (info.firstRestricted == null) {
              if (token instanceof IdentifierLikeToken && isRestrictedWord(param.name)) {
                info.firstRestricted = token;
                info.message = ErrorMessages.STRICT_PARAM_NAME;
              } else if (STRICT_MODE_RESERVED_WORD.indexOf(param.name) !== -1) {
                info.firstRestricted = token;
                info.message = ErrorMessages.STRICT_RESERVED_WORD;
              } else if (({}).hasOwnProperty.call(paramSet, key)) {
                info.firstRestricted = token;
                info.message = ErrorMessages.STRICT_PARAM_DUPE;
              }
            }
            info.params.push(param);
            paramSet[key] = true;
            if (this.match(TokenType.RPAREN)) {
              break;
            }
            this.expect(TokenType.COMMA);
          }
        }

        this.expect(TokenType.RPAREN);
        return info;
      },
      writable: true,
      configurable: true
    }
  });

  return Parser;
})(Tokenizer);
//# sourceMappingURL=data:application/json;base64,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LEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUN4RSxvQkFBSSxDQUFDLGVBQWUsR0FBRyxLQUFLLENBQUM7QUFDN0Isb0JBQUksQ0FBQyxPQUFPLEdBQUcsYUFBYSxDQUFDLGlCQUFpQixDQUFDO2VBQ2hELE1BQU0sSUFBSSx5QkFBeUIsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFO0FBQy9ELG9CQUFJLENBQUMsZUFBZSxHQUFHLEtBQUssQ0FBQztBQUM3QixvQkFBSSxDQUFDLE9BQU8sR0FBRyxhQUFhLENBQUMsb0JBQW9CLENBQUM7ZUFDbkQsTUFBTSxJQUFJLENBQUEsR0FBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxFQUFFO0FBQ2hELG9CQUFJLENBQUMsZUFBZSxHQUFHLEtBQUssQ0FBQztBQUM3QixvQkFBSSxDQUFDLE9BQU8sR0FBRyxhQUFhLENBQUMsaUJBQWlCLENBQUM7ZUFDaEQ7YUFDRjtBQUNELGdCQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN4QixvQkFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQztBQUNyQixnQkFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUNoQyxvQkFBTTthQUNQO0FBQ0QsZ0JBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1dBQzlCO1NBQ0Y7O0FBRUQsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUIsZUFBTyxJQUFJLENBQUM7T0FDYjs7Ozs7O1NBMzBDVSxNQUFNO0dBQVMsU0FBUyIsImZpbGUiOiJzcmMvcGFyc2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3B5cmlnaHQgMjAxNCBTaGFwZSBTZWN1cml0eSwgSW5jLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIilcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCAqIGFzIFNoaWZ0IGZyb20gXCJzaGlmdC1hc3RcIjtcblxuaW1wb3J0IHtpc1Jlc3RyaWN0ZWRXb3JkLCBpc1N0cmljdE1vZGVSZXNlcnZlZFdvcmRFUzV9IGZyb20gXCIuL3V0aWxzXCI7XG5cbmltcG9ydCB7RXJyb3JNZXNzYWdlc30gZnJvbSBcIi4vZXJyb3JzXCI7XG5cbmltcG9ydCBUb2tlbml6ZXIsIHtcbiAgICBUb2tlbkNsYXNzLFxuICAgIFRva2VuVHlwZSxcbiAgICBJZGVudGlmaWVyVG9rZW4sXG4gICAgSWRlbnRpZmllckxpa2VUb2tlbixcbiAgICBOdW1lcmljTGl0ZXJhbFRva2VuLFxuICAgIFN0cmluZ0xpdGVyYWxUb2tlbn0gZnJvbSBcIi4vdG9rZW5pemVyXCI7XG5cbmNvbnN0IElOSVRfTUFTSyA9IDE7XG5jb25zdCBHRVRURVJfTUFTSyA9IDI7XG5jb25zdCBTRVRURVJfTUFTSyA9IDQ7XG5cbmNvbnN0IFNUUklDVF9NT0RFX1JFU0VSVkVEX1dPUkQgPSBbXG4gIFwiaW1wbGVtZW50c1wiLCBcImludGVyZmFjZVwiLCBcInBhY2thZ2VcIiwgXCJwcml2YXRlXCIsIFwicHJvdGVjdGVkXCIsIFwicHVibGljXCIsIFwic3RhdGljXCIsIFwieWllbGRcIiwgXCJsZXRcIl07XG5cbmNvbnN0IFByZWNlZGVuY2UgPSB7XG4gIFNlcXVlbmNlOiAwLFxuICBZaWVsZDogMSxcbiAgQXNzaWdubWVudDogMSxcbiAgQ29uZGl0aW9uYWw6IDIsXG4gIEFycm93RnVuY3Rpb246IDIsXG4gIExvZ2ljYWxPUjogMyxcbiAgTG9naWNhbEFORDogNCxcbiAgQml0d2lzZU9SOiA1LFxuICBCaXR3aXNlWE9SOiA2LFxuICBCaXR3aXNlQU5EOiA3LFxuICBFcXVhbGl0eTogOCxcbiAgUmVsYXRpb25hbDogOSxcbiAgQml0d2lzZVNISUZUOiAxMCxcbiAgQWRkaXRpdmU6IDExLFxuICBNdWx0aXBsaWNhdGl2ZTogMTIsXG4gIFVuYXJ5OiAxMyxcbiAgUG9zdGZpeDogMTQsXG4gIENhbGw6IDE1LFxuICBOZXc6IDE2LFxuICBUYWdnZWRUZW1wbGF0ZTogMTcsXG4gIE1lbWJlcjogMTgsXG4gIFByaW1hcnk6IDE5XG59O1xuXG5jb25zdCBCaW5hcnlQcmVjZWRlbmNlID0ge1xuICBcInx8XCI6IFByZWNlZGVuY2UuTG9naWNhbE9SLFxuICBcIiYmXCI6IFByZWNlZGVuY2UuTG9naWNhbEFORCxcbiAgXCJ8XCI6IFByZWNlZGVuY2UuQml0d2lzZU9SLFxuICBcIl5cIjogUHJlY2VkZW5jZS5CaXR3aXNlWE9SLFxuICBcIiZcIjogUHJlY2VkZW5jZS5CaXR3aXNlQU5ELFxuICBcIj09XCI6IFByZWNlZGVuY2UuRXF1YWxpdHksXG4gIFwiIT1cIjogUHJlY2VkZW5jZS5FcXVhbGl0eSxcbiAgXCI9PT1cIjogUHJlY2VkZW5jZS5FcXVhbGl0eSxcbiAgXCIhPT1cIjogUHJlY2VkZW5jZS5FcXVhbGl0eSxcbiAgXCI8XCI6IFByZWNlZGVuY2UuUmVsYXRpb25hbCxcbiAgXCI+XCI6IFByZWNlZGVuY2UuUmVsYXRpb25hbCxcbiAgXCI8PVwiOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gIFwiPj1cIjogUHJlY2VkZW5jZS5SZWxhdGlvbmFsLFxuICBcImluXCI6IFByZWNlZGVuY2UuUmVsYXRpb25hbCxcbiAgXCJpbnN0YW5jZW9mXCI6IFByZWNlZGVuY2UuUmVsYXRpb25hbCxcbiAgXCI8PFwiOiBQcmVjZWRlbmNlLkJpdHdpc2VTSElGVCxcbiAgXCI+PlwiOiBQcmVjZWRlbmNlLkJpdHdpc2VTSElGVCxcbiAgXCI+Pj5cIjogUHJlY2VkZW5jZS5CaXR3aXNlU0hJRlQsXG4gIFwiK1wiOiBQcmVjZWRlbmNlLkFkZGl0aXZlLFxuICBcIi1cIjogUHJlY2VkZW5jZS5BZGRpdGl2ZSxcbiAgXCIqXCI6IFByZWNlZGVuY2UuTXVsdGlwbGljYXRpdmUsXG4gIFwiJVwiOiBQcmVjZWRlbmNlLk11bHRpcGxpY2F0aXZlLFxuICBcIi9cIjogUHJlY2VkZW5jZS5NdWx0aXBsaWNhdGl2ZSxcbn07XG5cbmV4cG9ydCBjbGFzcyBQYXJzZXIgZXh0ZW5kcyBUb2tlbml6ZXIge1xuICBjb25zdHJ1Y3Rvcihzb3VyY2UpIHtcbiAgICBzdXBlcihzb3VyY2UpO1xuICAgIHRoaXMubGFiZWxTZXQgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIHRoaXMuYWxsb3dJbiA9IHRydWU7XG4gICAgdGhpcy5pbkl0ZXJhdGlvbiA9IGZhbHNlO1xuICAgIHRoaXMuaW5Td2l0Y2ggPSBmYWxzZTtcbiAgICB0aGlzLmluRnVuY3Rpb25Cb2R5ID0gZmFsc2U7XG4gIH1cblxuICBlYXQodG9rZW5UeXBlKSB7XG4gICAgaWYgKHRoaXMubG9va2FoZWFkLnR5cGUgPT09IHRva2VuVHlwZSkge1xuICAgICAgcmV0dXJuIHRoaXMubGV4KCk7XG4gICAgfVxuICB9XG5cbiAgZXhwZWN0KHRva2VuVHlwZSkge1xuICAgIGlmICh0aGlzLmxvb2thaGVhZC50eXBlID09PSB0b2tlblR5cGUpIHtcbiAgICAgIHJldHVybiB0aGlzLmxleCgpO1xuICAgIH1cbiAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuICB9XG5cbiAgbWF0Y2goc3ViVHlwZSkge1xuICAgIHJldHVybiB0aGlzLmxvb2thaGVhZC50eXBlID09PSBzdWJUeXBlO1xuICB9XG5cbiAgY29uc3VtZVNlbWljb2xvbigpIHtcbiAgICBpZiAodGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLlNFTUlDT0xPTikpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuZW9mKCkgJiYgIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJCUkFDRSkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgfVxuICB9XG5cbiAgLy8gdGhpcyBpcyBhIG5vLW9wLCByZXNlcnZlZCBmb3IgZnV0dXJlIHVzZVxuICBtYXJrTG9jYXRpb24obm9kZSwgc3RhcnRMb2NhdGlvbikge1xuICAgIHJldHVybiBub2RlO1xuICB9XG5cbiAgcGFyc2VTY3JpcHQoKSB7XG4gICAgbGV0IGxvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCBbYm9keV0gPSB0aGlzLnBhcnNlQm9keSh0cnVlKTtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlNjcmlwdChib2R5KSwgbG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VGdW5jdGlvbkJvZHkoKSB7XG4gICAgbGV0IHByZXZpb3VzU3RyaWN0ID0gdGhpcy5zdHJpY3Q7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICBsZXQgb2xkTGFiZWxTZXQgPSB0aGlzLmxhYmVsU2V0O1xuICAgIGxldCBvbGRJbkl0ZXJhdGlvbiA9IHRoaXMuaW5JdGVyYXRpb247XG4gICAgbGV0IG9sZEluU3dpdGNoID0gdGhpcy5pblN3aXRjaDtcbiAgICBsZXQgb2xkSW5GdW5jdGlvbkJvZHkgPSB0aGlzLmluRnVuY3Rpb25Cb2R5O1xuXG4gICAgdGhpcy5sYWJlbFNldCA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgdGhpcy5pbkl0ZXJhdGlvbiA9IGZhbHNlO1xuICAgIHRoaXMuaW5Td2l0Y2ggPSBmYWxzZTtcbiAgICB0aGlzLmluRnVuY3Rpb25Cb2R5ID0gdHJ1ZTtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MQlJBQ0UpO1xuICAgIGxldCBbYm9keSwgaXNTdHJpY3RdID0gdGhpcy5wYXJzZUJvZHkoKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUkJSQUNFKTtcblxuICAgIGJvZHkgPSB0aGlzLm1hcmtMb2NhdGlvbihib2R5LCBzdGFydExvY2F0aW9uKTtcblxuICAgIHRoaXMubGFiZWxTZXQgPSBvbGRMYWJlbFNldDtcbiAgICB0aGlzLmluSXRlcmF0aW9uID0gb2xkSW5JdGVyYXRpb247XG4gICAgdGhpcy5pblN3aXRjaCA9IG9sZEluU3dpdGNoO1xuICAgIHRoaXMuaW5GdW5jdGlvbkJvZHkgPSBvbGRJbkZ1bmN0aW9uQm9keTtcbiAgICB0aGlzLnN0cmljdCA9IHByZXZpb3VzU3RyaWN0O1xuICAgIHJldHVybiBbYm9keSwgaXNTdHJpY3RdO1xuICB9XG5cbiAgcGFyc2VCb2R5KGFjY2VwdEVPRiA9IGZhbHNlKSB7XG4gICAgbGV0IGxvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCBkaXJlY3RpdmVzID0gW107XG4gICAgbGV0IHN0YXRlbWVudHMgPSBbXTtcbiAgICBsZXQgcGFyc2luZ0RpcmVjdGl2ZXMgPSB0cnVlO1xuICAgIGxldCBpc1N0cmljdCA9IHRoaXMuc3RyaWN0O1xuICAgIGxldCBmaXJzdFJlc3RyaWN0ZWQgPSBudWxsO1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBpZiAoYWNjZXB0RU9GKSB7XG4gICAgICAgIGlmICh0aGlzLmVvZigpKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0UpKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGxldCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgICAgbGV0IHRleHQgPSB0b2tlbi5zbGljZS50ZXh0O1xuICAgICAgbGV0IGlzU3RyaW5nTGl0ZXJhbCA9IHRva2VuIGluc3RhbmNlb2YgU3RyaW5nTGl0ZXJhbFRva2VuO1xuICAgICAgbGV0IGRpcmVjdGl2ZUxvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgICAgbGV0IHN0bXQgPSB0aGlzLnBhcnNlU3RhdGVtZW50KCk7XG4gICAgICBpZiAocGFyc2luZ0RpcmVjdGl2ZXMpIHtcbiAgICAgICAgaWYgKGlzU3RyaW5nTGl0ZXJhbCAmJiBzdG10LnR5cGUgPT09IFwiRXhwcmVzc2lvblN0YXRlbWVudFwiICYmXG4gICAgICAgICAgICBzdG10LmV4cHJlc3Npb24udHlwZSA9PT0gXCJMaXRlcmFsU3RyaW5nRXhwcmVzc2lvblwiKSB7XG4gICAgICAgICAgaWYgKHRleHQgPT09IFwiXFxcInVzZSBzdHJpY3RcXFwiXCIgfHwgdGV4dCA9PT0gXCIndXNlIHN0cmljdCdcIikge1xuICAgICAgICAgICAgaXNTdHJpY3QgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5zdHJpY3QgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKGZpcnN0UmVzdHJpY3RlZCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24oZmlyc3RSZXN0cmljdGVkLCBFcnJvck1lc3NhZ2VzLlNUUklDVF9PQ1RBTF9MSVRFUkFMKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKGZpcnN0UmVzdHJpY3RlZCA9PSBudWxsICYmIHRva2VuLm9jdGFsKSB7XG4gICAgICAgICAgICBmaXJzdFJlc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgICB9XG4gICAgICAgICAgZGlyZWN0aXZlcy5wdXNoKHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5EaXJlY3RpdmUodGV4dC5zbGljZSgxLCAtMSkpLCBkaXJlY3RpdmVMb2NhdGlvbikpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBhcnNpbmdEaXJlY3RpdmVzID0gZmFsc2U7XG4gICAgICAgICAgc3RhdGVtZW50cy5wdXNoKHN0bXQpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdGF0ZW1lbnRzLnB1c2goc3RtdCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIFt0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuRnVuY3Rpb25Cb2R5KGRpcmVjdGl2ZXMsIHN0YXRlbWVudHMpLCBsb2NhdGlvbiksIGlzU3RyaWN0XTtcbiAgfVxuXG5cbiAgcGFyc2VTdGF0ZW1lbnQoKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgaWYgKHRoaXMuZW9mKCkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgfVxuICAgIHN3aXRjaCAodGhpcy5sb29rYWhlYWQudHlwZSkge1xuICAgICAgY2FzZSBUb2tlblR5cGUuU0VNSUNPTE9OOlxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24odGhpcy5wYXJzZUVtcHR5U3RhdGVtZW50KCksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgY2FzZSBUb2tlblR5cGUuTEJSQUNFOlxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24odGhpcy5wYXJzZUJsb2NrU3RhdGVtZW50KCksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgY2FzZSBUb2tlblR5cGUuTFBBUkVOOlxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24odGhpcy5wYXJzZUV4cHJlc3Npb25TdGF0ZW1lbnQoKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICBjYXNlIFRva2VuVHlwZS5CUkVBSzpcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHRoaXMucGFyc2VCcmVha1N0YXRlbWVudCgpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkNPTlRJTlVFOlxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24odGhpcy5wYXJzZUNvbnRpbnVlU3RhdGVtZW50KCksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgY2FzZSBUb2tlblR5cGUuREVCVUdHRVI6XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih0aGlzLnBhcnNlRGVidWdnZXJTdGF0ZW1lbnQoKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICBjYXNlIFRva2VuVHlwZS5ETzpcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHRoaXMucGFyc2VEb1doaWxlU3RhdGVtZW50KCksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgY2FzZSBUb2tlblR5cGUuRk9SOlxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24odGhpcy5wYXJzZUZvclN0YXRlbWVudCgpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkZVTkNUSU9OOlxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24odGhpcy5wYXJzZUZ1bmN0aW9uKGZhbHNlKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICBjYXNlIFRva2VuVHlwZS5JRjpcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHRoaXMucGFyc2VJZlN0YXRlbWVudCgpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlJFVFVSTjpcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHRoaXMucGFyc2VSZXR1cm5TdGF0ZW1lbnQoKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICBjYXNlIFRva2VuVHlwZS5TV0lUQ0g6XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih0aGlzLnBhcnNlU3dpdGNoU3RhdGVtZW50KCksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgY2FzZSBUb2tlblR5cGUuVEhST1c6XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih0aGlzLnBhcnNlVGhyb3dTdGF0ZW1lbnQoKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICBjYXNlIFRva2VuVHlwZS5UUlk6XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih0aGlzLnBhcnNlVHJ5U3RhdGVtZW50KCksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgY2FzZSBUb2tlblR5cGUuVkFSOlxuICAgICAgY2FzZSBUb2tlblR5cGUuTEVUOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQ09OU1Q6XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih0aGlzLnBhcnNlVmFyaWFibGVEZWNsYXJhdGlvblN0YXRlbWVudCgpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLldISUxFOlxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24odGhpcy5wYXJzZVdoaWxlU3RhdGVtZW50KCksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgY2FzZSBUb2tlblR5cGUuV0lUSDpcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHRoaXMucGFyc2VXaXRoU3RhdGVtZW50KCksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgZGVmYXVsdDpcbiAgICAgIHtcbiAgICAgICAgbGV0IGV4cHIgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuXG4gICAgICAgIC8vIDEyLjEyIExhYmVsbGVkIFN0YXRlbWVudHM7XG4gICAgICAgIGlmIChleHByLnR5cGUgPT09IFwiSWRlbnRpZmllckV4cHJlc3Npb25cIiAmJiB0aGlzLm1hdGNoKFRva2VuVHlwZS5DT0xPTikpIHtcbiAgICAgICAgICB0aGlzLmxleCgpO1xuICAgICAgICAgIGxldCBrZXkgPSBcIiRcIiArIGV4cHIuaWRlbnRpZmllci5uYW1lO1xuICAgICAgICAgIGlmICh7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRoaXMubGFiZWxTZXQsIGtleSkpIHtcbiAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5MQUJFTF9SRURFQ0xBUkFUSU9OLCBleHByLmlkZW50aWZpZXIubmFtZSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy5sYWJlbFNldFtrZXldID0gdHJ1ZTtcbiAgICAgICAgICBsZXQgbGFiZWxlZEJvZHkgPSB0aGlzLnBhcnNlU3RhdGVtZW50KCk7XG4gICAgICAgICAgZGVsZXRlIHRoaXMubGFiZWxTZXRba2V5XTtcbiAgICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkxhYmVsZWRTdGF0ZW1lbnQoZXhwci5pZGVudGlmaWVyLCBsYWJlbGVkQm9keSksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuY29uc3VtZVNlbWljb2xvbigpO1xuICAgICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuRXhwcmVzc2lvblN0YXRlbWVudChleHByKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgfVxuXG4gIHBhcnNlVmFyaWFibGVJZGVudGlmaWVyKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuXG4gICAgbGV0IHRva2VuID0gdGhpcy5sZXgoKTtcbiAgICBpZiAoISh0b2tlbiBpbnN0YW5jZW9mIElkZW50aWZpZXJUb2tlbikpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0b2tlbik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5JZGVudGlmaWVyKHRva2VuLnZhbHVlKSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZUVtcHR5U3RhdGVtZW50KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5TRU1JQ09MT04pO1xuICAgIHJldHVybiBuZXcgU2hpZnQuRW1wdHlTdGF0ZW1lbnQ7XG4gIH1cblxuICBwYXJzZUJsb2NrU3RhdGVtZW50KCkge1xuICAgIHJldHVybiBuZXcgU2hpZnQuQmxvY2tTdGF0ZW1lbnQodGhpcy5wYXJzZUJsb2NrKCkpO1xuICB9XG5cbiAgcGFyc2VFeHByZXNzaW9uU3RhdGVtZW50KCkge1xuICAgIGxldCBleHByID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICB0aGlzLmNvbnN1bWVTZW1pY29sb24oKTtcbiAgICByZXR1cm4gbmV3IFNoaWZ0LkV4cHJlc3Npb25TdGF0ZW1lbnQoZXhwcik7XG4gIH1cblxuICBwYXJzZUJyZWFrU3RhdGVtZW50KCkge1xuICAgIGxldCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5CUkVBSyk7XG5cbiAgICAvLyBDYXRjaCB0aGUgdmVyeSBjb21tb24gY2FzZSBmaXJzdDogaW1tZWRpYXRlbHkgYSBzZW1pY29sb24gKFUrMDAzQikuXG4gICAgaWYgKHRoaXMubG9va2FoZWFkLnR5cGUgPT0gVG9rZW5UeXBlLlNFTUlDT0xPTikge1xuICAgICAgdGhpcy5sZXgoKTtcblxuICAgICAgaWYgKCEodGhpcy5pbkl0ZXJhdGlvbiB8fCB0aGlzLmluU3dpdGNoKSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLklMTEVHQUxfQlJFQUspO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbmV3IFNoaWZ0LkJyZWFrU3RhdGVtZW50KG51bGwpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCkge1xuICAgICAgaWYgKCEodGhpcy5pbkl0ZXJhdGlvbiB8fCB0aGlzLmluU3dpdGNoKSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLklMTEVHQUxfQlJFQUspO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbmV3IFNoaWZ0LkJyZWFrU3RhdGVtZW50KG51bGwpO1xuICAgIH1cblxuICAgIGxldCBsYWJlbCA9IG51bGw7XG4gICAgaWYgKHRoaXMubG9va2FoZWFkLnR5cGUgPT0gVG9rZW5UeXBlLklERU5USUZJRVIpIHtcbiAgICAgIGxhYmVsID0gdGhpcy5wYXJzZVZhcmlhYmxlSWRlbnRpZmllcigpO1xuXG4gICAgICBsZXQga2V5ID0gXCIkXCIgKyBsYWJlbC5uYW1lO1xuICAgICAgaWYgKCF7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRoaXMubGFiZWxTZXQsIGtleSkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlVOS05PV05fTEFCRUwsIGxhYmVsLm5hbWUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuY29uc3VtZVNlbWljb2xvbigpO1xuXG4gICAgaWYgKGxhYmVsID09IG51bGwgJiYgISh0aGlzLmluSXRlcmF0aW9uIHx8IHRoaXMuaW5Td2l0Y2gpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLklMTEVHQUxfQlJFQUspO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgU2hpZnQuQnJlYWtTdGF0ZW1lbnQobGFiZWwpO1xuICB9XG5cbiAgcGFyc2VDb250aW51ZVN0YXRlbWVudCgpIHtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuQ09OVElOVUUpO1xuXG4gICAgLy8gQ2F0Y2ggdGhlIHZlcnkgY29tbW9uIGNhc2UgZmlyc3Q6IGltbWVkaWF0ZWx5IGEgc2VtaWNvbG9uIChVKzAwM0IpLlxuICAgIGlmICh0aGlzLmxvb2thaGVhZC50eXBlID09IFRva2VuVHlwZS5TRU1JQ09MT04pIHtcbiAgICAgIHRoaXMubGV4KCk7XG4gICAgICBpZiAoIXRoaXMuaW5JdGVyYXRpb24pIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5JTExFR0FMX0NPTlRJTlVFKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5ldyBTaGlmdC5Db250aW51ZVN0YXRlbWVudChudWxsKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQpIHtcbiAgICAgIGlmICghdGhpcy5pbkl0ZXJhdGlvbikge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLklMTEVHQUxfQ09OVElOVUUpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbmV3IFNoaWZ0LkNvbnRpbnVlU3RhdGVtZW50KG51bGwpO1xuICAgIH1cblxuICAgIGxldCBsYWJlbCA9IG51bGw7XG4gICAgaWYgKHRoaXMubG9va2FoZWFkLnR5cGUgPT0gVG9rZW5UeXBlLklERU5USUZJRVIpIHtcbiAgICAgIGxhYmVsID0gdGhpcy5wYXJzZVZhcmlhYmxlSWRlbnRpZmllcigpO1xuXG4gICAgICBsZXQga2V5ID0gXCIkXCIgKyBsYWJlbC5uYW1lO1xuICAgICAgaWYgKCF7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRoaXMubGFiZWxTZXQsIGtleSkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlVOS05PV05fTEFCRUwsIGxhYmVsLm5hbWUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuY29uc3VtZVNlbWljb2xvbigpO1xuICAgIGlmICghdGhpcy5pbkl0ZXJhdGlvbikge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5JTExFR0FMX0NPTlRJTlVFKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFNoaWZ0LkNvbnRpbnVlU3RhdGVtZW50KGxhYmVsKTtcbiAgfVxuXG5cbiAgcGFyc2VEZWJ1Z2dlclN0YXRlbWVudCgpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuREVCVUdHRVIpO1xuICAgIHRoaXMuY29uc3VtZVNlbWljb2xvbigpO1xuICAgIHJldHVybiBuZXcgU2hpZnQuRGVidWdnZXJTdGF0ZW1lbnQ7XG4gIH1cblxuICBwYXJzZURvV2hpbGVTdGF0ZW1lbnQoKSB7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkRPKTtcbiAgICBsZXQgb2xkSW5JdGVyYXRpb24gPSB0aGlzLmluSXRlcmF0aW9uO1xuICAgIHRoaXMuaW5JdGVyYXRpb24gPSB0cnVlO1xuXG4gICAgbGV0IGJvZHkgPSB0aGlzLnBhcnNlU3RhdGVtZW50KCk7XG4gICAgdGhpcy5pbkl0ZXJhdGlvbiA9IG9sZEluSXRlcmF0aW9uO1xuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLldISUxFKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTFBBUkVOKTtcbiAgICBsZXQgdGVzdCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJQQVJFTik7XG4gICAgdGhpcy5jb25zdW1lU2VtaWNvbG9uKCk7XG5cbiAgICByZXR1cm4gbmV3IFNoaWZ0LkRvV2hpbGVTdGF0ZW1lbnQoYm9keSwgdGVzdCk7XG4gIH1cblxuICBzdGF0aWMgaXNMZWZ0SGFuZFNpZGUoZXhwcikge1xuICAgIHN3aXRjaCAoZXhwci50eXBlKSB7XG4gICAgICBjYXNlIFwiQ2FsbEV4cHJlc3Npb25cIjpcbiAgICAgIGNhc2UgXCJOZXdFeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiU3RhdGljTWVtYmVyRXhwcmVzc2lvblwiOlxuICAgICAgY2FzZSBcIkNvbXB1dGVkTWVtYmVyRXhwcmVzc2lvblwiOlxuICAgICAgY2FzZSBcIkFycmF5RXhwcmVzc2lvblwiOlxuICAgICAgY2FzZSBcIkZ1bmN0aW9uRXhwcmVzc2lvblwiOlxuICAgICAgY2FzZSBcIklkZW50aWZpZXJFeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiTGl0ZXJhbEJvb2xlYW5FeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiTGl0ZXJhbFN0cmluZ0V4cHJlc3Npb25cIjpcbiAgICAgIGNhc2UgXCJMaXRlcmFsTnVsbEV4cHJlc3Npb25cIjpcbiAgICAgIGNhc2UgXCJMaXRlcmFsUmVnRXhwRXhwcmVzc2lvblwiOlxuICAgICAgY2FzZSBcIk9iamVjdEV4cHJlc3Npb25cIjpcbiAgICAgIGNhc2UgXCJUaGlzRXhwcmVzc2lvblwiOlxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcGFyc2VGb3JTdGF0ZW1lbnQoKSB7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkZPUik7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgbGV0IHRlc3QgPSBudWxsO1xuICAgIGxldCByaWdodCA9IG51bGw7XG4gICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLlNFTUlDT0xPTikpIHtcbiAgICAgIHRoaXMubGV4KCk7XG4gICAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlNFTUlDT0xPTikpIHtcbiAgICAgICAgdGVzdCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICB9XG4gICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuU0VNSUNPTE9OKTtcbiAgICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuUlBBUkVOKSkge1xuICAgICAgICByaWdodCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbmV3IFNoaWZ0LkZvclN0YXRlbWVudChcbiAgICAgICAgICBudWxsLFxuICAgICAgICAgIHRlc3QsXG4gICAgICAgICAgcmlnaHQsXG4gICAgICAgICAgdGhpcy5nZXRJdGVyYXRvclN0YXRlbWVudEVwaWxvZ3VlKClcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5WQVIpIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLkxFVCkpIHtcbiAgICAgICAgbGV0IHByZXZpb3VzQWxsb3dJbiA9IHRoaXMuYWxsb3dJbjtcbiAgICAgICAgdGhpcy5hbGxvd0luID0gZmFsc2U7XG4gICAgICAgIGxldCBpbml0RGVjbCA9IHRoaXMucGFyc2VWYXJpYWJsZURlY2xhcmF0aW9uKCk7XG4gICAgICAgIHRoaXMuYWxsb3dJbiA9IHByZXZpb3VzQWxsb3dJbjtcblxuICAgICAgICBpZiAoaW5pdERlY2wuZGVjbGFyYXRvcnMubGVuZ3RoID09PSAxICYmIHRoaXMubWF0Y2goVG9rZW5UeXBlLklOKSkge1xuICAgICAgICAgIHRoaXMubGV4KCk7XG4gICAgICAgICAgcmlnaHQgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgICAgIHJldHVybiBuZXcgU2hpZnQuRm9ySW5TdGF0ZW1lbnQoaW5pdERlY2wsIHJpZ2h0LCB0aGlzLmdldEl0ZXJhdG9yU3RhdGVtZW50RXBpbG9ndWUoKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlNFTUlDT0xPTik7XG4gICAgICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5TRU1JQ09MT04pKSB7XG4gICAgICAgICAgICB0ZXN0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlNFTUlDT0xPTik7XG4gICAgICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5SUEFSRU4pKSB7XG4gICAgICAgICAgICByaWdodCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBuZXcgU2hpZnQuRm9yU3RhdGVtZW50KGluaXREZWNsLCB0ZXN0LCByaWdodCwgdGhpcy5nZXRJdGVyYXRvclN0YXRlbWVudEVwaWxvZ3VlKCkpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsZXQgcHJldmlvdXNBbGxvd0luID0gdGhpcy5hbGxvd0luO1xuICAgICAgICB0aGlzLmFsbG93SW4gPSBmYWxzZTtcbiAgICAgICAgbGV0IGluaXQgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgICB0aGlzLmFsbG93SW4gPSBwcmV2aW91c0FsbG93SW47XG5cbiAgICAgICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLklOKSkge1xuICAgICAgICAgIGlmICghUGFyc2VyLmlzTGVmdEhhbmRTaWRlKGluaXQpKSB7XG4gICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuSU5WQUxJRF9MSFNfSU5fRk9SX0lOKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLmxleCgpO1xuICAgICAgICAgIHJpZ2h0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgICAgICByZXR1cm4gbmV3IFNoaWZ0LkZvckluU3RhdGVtZW50KGluaXQsIHJpZ2h0LCB0aGlzLmdldEl0ZXJhdG9yU3RhdGVtZW50RXBpbG9ndWUoKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlNFTUlDT0xPTik7XG4gICAgICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5TRU1JQ09MT04pKSB7XG4gICAgICAgICAgICB0ZXN0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlNFTUlDT0xPTik7XG4gICAgICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5SUEFSRU4pKSB7XG4gICAgICAgICAgICByaWdodCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBuZXcgU2hpZnQuRm9yU3RhdGVtZW50KGluaXQsIHRlc3QsIHJpZ2h0LCB0aGlzLmdldEl0ZXJhdG9yU3RhdGVtZW50RXBpbG9ndWUoKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBnZXRJdGVyYXRvclN0YXRlbWVudEVwaWxvZ3VlKCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgIGxldCBvbGRJbkl0ZXJhdGlvbiA9IHRoaXMuaW5JdGVyYXRpb247XG4gICAgdGhpcy5pbkl0ZXJhdGlvbiA9IHRydWU7XG4gICAgbGV0IGJvZHkgPSB0aGlzLnBhcnNlU3RhdGVtZW50KCk7XG4gICAgdGhpcy5pbkl0ZXJhdGlvbiA9IG9sZEluSXRlcmF0aW9uO1xuICAgIHJldHVybiBib2R5O1xuICB9XG5cbiAgcGFyc2VJZlN0YXRlbWVudCgpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuSUYpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MUEFSRU4pO1xuICAgIGxldCB0ZXN0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgIGxldCBjb25zZXF1ZW50ID0gdGhpcy5wYXJzZVN0YXRlbWVudCgpO1xuICAgIGxldCBhbHRlcm5hdGUgPSBudWxsO1xuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5FTFNFKSkge1xuICAgICAgdGhpcy5sZXgoKTtcbiAgICAgIGFsdGVybmF0ZSA9IHRoaXMucGFyc2VTdGF0ZW1lbnQoKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBTaGlmdC5JZlN0YXRlbWVudCh0ZXN0LCBjb25zZXF1ZW50LCBhbHRlcm5hdGUpO1xuICB9XG5cbiAgcGFyc2VSZXR1cm5TdGF0ZW1lbnQoKSB7XG4gICAgbGV0IGFyZ3VtZW50ID0gbnVsbDtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SRVRVUk4pO1xuICAgIGlmICghdGhpcy5pbkZ1bmN0aW9uQm9keSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLklMTEVHQUxfUkVUVVJOKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQpIHtcbiAgICAgIHJldHVybiBuZXcgU2hpZnQuUmV0dXJuU3RhdGVtZW50KG51bGwpO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuU0VNSUNPTE9OKSkge1xuICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0UpICYmICF0aGlzLmVvZigpKSB7XG4gICAgICAgIGFyZ3VtZW50ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmNvbnN1bWVTZW1pY29sb24oKTtcbiAgICByZXR1cm4gbmV3IFNoaWZ0LlJldHVyblN0YXRlbWVudChhcmd1bWVudCk7XG4gIH1cblxuICBwYXJzZVdpdGhTdGF0ZW1lbnQoKSB7XG4gICAgaWYgKHRoaXMuc3RyaWN0KSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX01PREVfV0lUSCk7XG4gICAgfVxuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLldJVEgpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MUEFSRU4pO1xuICAgIGxldCBvYmplY3QgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgIGxldCBib2R5ID0gdGhpcy5wYXJzZVN0YXRlbWVudCgpO1xuXG4gICAgcmV0dXJuIG5ldyBTaGlmdC5XaXRoU3RhdGVtZW50KG9iamVjdCwgYm9keSk7XG4gIH1cblxuICBwYXJzZVN3aXRjaFN0YXRlbWVudCgpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuU1dJVENIKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTFBBUkVOKTtcbiAgICBsZXQgZGlzY3JpbWluYW50ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTEJSQUNFKTtcblxuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0UpKSB7XG4gICAgICB0aGlzLmxleCgpO1xuICAgICAgcmV0dXJuIG5ldyBTaGlmdC5Td2l0Y2hTdGF0ZW1lbnQoZGlzY3JpbWluYW50LCBbXSk7XG4gICAgfVxuICAgIGxldCBvbGRJblN3aXRjaCA9IHRoaXMuaW5Td2l0Y2g7XG4gICAgdGhpcy5pblN3aXRjaCA9IHRydWU7XG5cbiAgICBsZXQgY2FzZXMgPSB0aGlzLnBhcnNlU3dpdGNoQ2FzZXMoKTtcblxuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5ERUZBVUxUKSkge1xuICAgICAgbGV0IHN3aXRjaERlZmF1bHQgPSB0aGlzLnBhcnNlU3dpdGNoRGVmYXVsdCgpO1xuICAgICAgbGV0IHBvc3REZWZhdWx0Q2FzZXMgPSB0aGlzLnBhcnNlU3dpdGNoQ2FzZXMoKTtcbiAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5ERUZBVUxUKSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuTVVMVElQTEVfREVGQVVMVFNfSU5fU1dJVENIKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuaW5Td2l0Y2ggPSBvbGRJblN3aXRjaDtcbiAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SQlJBQ0UpO1xuICAgICAgcmV0dXJuIG5ldyBTaGlmdC5Td2l0Y2hTdGF0ZW1lbnRXaXRoRGVmYXVsdChkaXNjcmltaW5hbnQsIGNhc2VzLCBzd2l0Y2hEZWZhdWx0LCBwb3N0RGVmYXVsdENhc2VzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5pblN3aXRjaCA9IG9sZEluU3dpdGNoO1xuICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJCUkFDRSk7XG4gICAgICByZXR1cm4gbmV3IFNoaWZ0LlN3aXRjaFN0YXRlbWVudChkaXNjcmltaW5hbnQsIGNhc2VzKTtcbiAgICB9XG4gIH1cblxuICBwYXJzZVN3aXRjaENhc2VzKCkge1xuICAgIGxldCByZXN1bHQgPSBbXTtcbiAgICB3aGlsZSAoISh0aGlzLmVvZigpIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLlJCUkFDRSkgfHwgdGhpcy5tYXRjaChUb2tlblR5cGUuREVGQVVMVCkpKSB7XG4gICAgICByZXN1bHQucHVzaCh0aGlzLnBhcnNlU3dpdGNoQ2FzZSgpKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHBhcnNlU3dpdGNoQ2FzZSgpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuQ0FTRSk7XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5Td2l0Y2hDYXNlKHRoaXMucGFyc2VFeHByZXNzaW9uKCksIHRoaXMucGFyc2VTd2l0Y2hDYXNlQm9keSgpKSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZVN3aXRjaERlZmF1bHQoKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkRFRkFVTFQpO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuU3dpdGNoRGVmYXVsdCh0aGlzLnBhcnNlU3dpdGNoQ2FzZUJvZHkoKSksIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VTd2l0Y2hDYXNlQm9keSgpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuQ09MT04pO1xuICAgIHJldHVybiB0aGlzLnBhcnNlU3RhdGVtZW50TGlzdEluU3dpdGNoQ2FzZUJvZHkoKTtcbiAgfVxuXG4gIHBhcnNlU3RhdGVtZW50TGlzdEluU3dpdGNoQ2FzZUJvZHkoKSB7XG4gICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgIHdoaWxlICghKHRoaXMuZW9mKCkgfHwgdGhpcy5tYXRjaChUb2tlblR5cGUuUkJSQUNFKSB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5ERUZBVUxUKVxuICAgIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLkNBU0UpKSkge1xuICAgICAgcmVzdWx0LnB1c2godGhpcy5wYXJzZVN0YXRlbWVudCgpKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHBhcnNlVGhyb3dTdGF0ZW1lbnQoKSB7XG4gICAgbGV0IHRva2VuID0gdGhpcy5leHBlY3QoVG9rZW5UeXBlLlRIUk9XKTtcblxuICAgIGlmICh0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5ORVdMSU5FX0FGVEVSX1RIUk9XKTtcbiAgICB9XG5cbiAgICBsZXQgYXJndW1lbnQgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuXG4gICAgdGhpcy5jb25zdW1lU2VtaWNvbG9uKCk7XG5cbiAgICByZXR1cm4gbmV3IFNoaWZ0LlRocm93U3RhdGVtZW50KGFyZ3VtZW50KTtcbiAgfVxuXG4gIHBhcnNlVHJ5U3RhdGVtZW50KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5UUlkpO1xuICAgIGxldCBibG9jayA9IHRoaXMucGFyc2VCbG9jaygpO1xuXG4gICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkNBVENIKSkge1xuICAgICAgbGV0IGhhbmRsZXIgPSB0aGlzLnBhcnNlQ2F0Y2hDbGF1c2UoKTtcbiAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5GSU5BTExZKSkge1xuICAgICAgICB0aGlzLmxleCgpO1xuICAgICAgICBsZXQgZmluYWxpemVyID0gdGhpcy5wYXJzZUJsb2NrKCk7XG4gICAgICAgIHJldHVybiBuZXcgU2hpZnQuVHJ5RmluYWxseVN0YXRlbWVudChibG9jaywgaGFuZGxlciwgZmluYWxpemVyKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgU2hpZnQuVHJ5Q2F0Y2hTdGF0ZW1lbnQoYmxvY2ssIGhhbmRsZXIpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5GSU5BTExZKSkge1xuICAgICAgdGhpcy5sZXgoKTtcbiAgICAgIGxldCBmaW5hbGl6ZXIgPSB0aGlzLnBhcnNlQmxvY2soKTtcbiAgICAgIHJldHVybiBuZXcgU2hpZnQuVHJ5RmluYWxseVN0YXRlbWVudChibG9jaywgbnVsbCwgZmluYWxpemVyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLk5PX0NBVENIX09SX0ZJTkFMTFkpO1xuICAgIH1cbiAgfVxuXG4gIHBhcnNlVmFyaWFibGVEZWNsYXJhdGlvblN0YXRlbWVudCgpIHtcbiAgICBsZXQgZGVjbGFyYXRpb24gPSB0aGlzLnBhcnNlVmFyaWFibGVEZWNsYXJhdGlvbigpO1xuICAgIHRoaXMuY29uc3VtZVNlbWljb2xvbigpO1xuICAgIHJldHVybiBuZXcgU2hpZnQuVmFyaWFibGVEZWNsYXJhdGlvblN0YXRlbWVudChkZWNsYXJhdGlvbik7XG4gIH1cblxuICBwYXJzZVdoaWxlU3RhdGVtZW50KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5XSElMRSk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgcmV0dXJuIG5ldyBTaGlmdC5XaGlsZVN0YXRlbWVudCh0aGlzLnBhcnNlRXhwcmVzc2lvbigpLCB0aGlzLmdldEl0ZXJhdG9yU3RhdGVtZW50RXBpbG9ndWUoKSk7XG4gIH1cblxuICBwYXJzZUNhdGNoQ2xhdXNlKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNBVENIKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTFBBUkVOKTtcbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuUlBBUkVOKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICB9XG5cbiAgICBsZXQgcGFyYW0gPSB0aGlzLnBhcnNlVmFyaWFibGVJZGVudGlmaWVyKCk7XG5cbiAgICAvLyAxMi4xNC4xO1xuICAgIGlmICh0aGlzLnN0cmljdCAmJiBpc1Jlc3RyaWN0ZWRXb3JkKHBhcmFtLm5hbWUpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX0NBVENIX1ZBUklBQkxFKTtcbiAgICB9XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcblxuICAgIGxldCBib2R5ID0gdGhpcy5wYXJzZUJsb2NrKCk7XG5cbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkNhdGNoQ2xhdXNlKHBhcmFtLCBib2R5KSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZUJsb2NrKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MQlJBQ0UpO1xuXG4gICAgbGV0IGJvZHkgPSBbXTtcbiAgICB3aGlsZSAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJCUkFDRSkpIHtcbiAgICAgIGJvZHkucHVzaCh0aGlzLnBhcnNlU3RhdGVtZW50KCkpO1xuICAgIH1cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUkJSQUNFKTtcblxuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQmxvY2soYm9keSksIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VWYXJpYWJsZURlY2xhcmF0aW9uKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCB0b2tlbiA9IHRoaXMubGV4KCk7XG5cbiAgICAvLyBQcmVjZWRlZCBieSB0aGlzLm1hdGNoKFRva2VuU3ViVHlwZS5WQVIpIHx8IHRoaXMubWF0Y2goVG9rZW5TdWJUeXBlLkxFVCk7XG4gICAgbGV0IGtpbmQgPSB0b2tlbi50eXBlID09IFRva2VuVHlwZS5WQVIgPyBcInZhclwiIDogdG9rZW4udHlwZSA9PT0gVG9rZW5UeXBlLkNPTlNUID8gXCJjb25zdFwiIDogXCJsZXRcIjtcbiAgICBsZXQgZGVjbGFyYXRvcnMgPSB0aGlzLnBhcnNlVmFyaWFibGVEZWNsYXJhdG9yTGlzdChraW5kKTtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlZhcmlhYmxlRGVjbGFyYXRpb24oa2luZCwgZGVjbGFyYXRvcnMpLCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlVmFyaWFibGVEZWNsYXJhdG9yTGlzdChraW5kKSB7XG4gICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICByZXN1bHQucHVzaCh0aGlzLnBhcnNlVmFyaWFibGVEZWNsYXJhdG9yKGtpbmQpKTtcbiAgICAgIGlmICghdGhpcy5lYXQoVG9rZW5UeXBlLkNPTU1BKSkge1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHBhcnNlVmFyaWFibGVEZWNsYXJhdG9yKGtpbmQpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcblxuICAgIGxldCBpZCA9IHRoaXMucGFyc2VWYXJpYWJsZUlkZW50aWZpZXIoKTtcblxuICAgIC8vIDEyLjIuMTtcbiAgICBpZiAodGhpcy5zdHJpY3QgJiYgaXNSZXN0cmljdGVkV29yZChpZC5uYW1lKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlNUUklDVF9WQVJfTkFNRSk7XG4gICAgfVxuXG4gICAgbGV0IGluaXQgPSBudWxsO1xuICAgIGlmIChraW5kID09IFwiY29uc3RcIikge1xuICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkFTU0lHTik7XG4gICAgICBpbml0ID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgfSBlbHNlIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5BU1NJR04pKSB7XG4gICAgICB0aGlzLmxleCgpO1xuICAgICAgaW5pdCA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlZhcmlhYmxlRGVjbGFyYXRvcihpZCwgaW5pdCksIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VFeHByZXNzaW9uKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuXG4gICAgbGV0IGV4cHIgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcblxuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5DT01NQSkpIHtcbiAgICAgIHdoaWxlICghdGhpcy5lb2YoKSkge1xuICAgICAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLkNPTU1BKSkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubGV4KCk7XG4gICAgICAgIGV4cHIgPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQmluYXJ5RXhwcmVzc2lvbihcIixcIiwgZXhwciwgdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCkpLFxuICAgICAgICAgICAgc3RhcnRMb2NhdGlvbik7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBleHByO1xuICB9XG5cbiAgcGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpIHtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcblxuICAgIGxldCBpc1BhcmVudGhlc2lzZWQgPSB0b2tlbi50eXBlID09PSBUb2tlblR5cGUuTFBBUkVOO1xuICAgIGxldCBub2RlID0gdGhpcy5wYXJzZUNvbmRpdGlvbmFsRXhwcmVzc2lvbigpO1xuXG4gICAgbGV0IGlzT3BlcmF0b3IgPSBmYWxzZTtcbiAgICBsZXQgb3BlcmF0b3IgPSB0aGlzLmxvb2thaGVhZDtcbiAgICBzd2l0Y2ggKG9wZXJhdG9yLnR5cGUpIHtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9CSVRfT1I6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fQklUX1hPUjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9CSVRfQU5EOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX1NITDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9TSFI6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fU0hSX1VOU0lHTkVEOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX0FERDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9TVUI6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fTVVMOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX0RJVjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9NT0Q6XG4gICAgICAgIGlzT3BlcmF0b3IgPSB0cnVlO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICBpZiAoaXNPcGVyYXRvcikge1xuICAgICAgaWYgKCFpc1BhcmVudGhlc2lzZWQgJiYgIVBhcnNlci5pc0xlZnRIYW5kU2lkZShub2RlKSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuSU5WQUxJRF9MSFNfSU5fQVNTSUdOTUVOVCk7XG4gICAgICB9XG5cbiAgICAgIC8vIDExLjEzLjE7XG4gICAgICBpZiAobm9kZS50eXBlID09PSBcIklkZW50aWZpZXJFeHByZXNzaW9uXCIpIHtcbiAgICAgICAgaWYgKHRoaXMuc3RyaWN0ICYmIGlzUmVzdHJpY3RlZFdvcmQobm9kZS5pZGVudGlmaWVyLm5hbWUpKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5TVFJJQ1RfTEhTX0FTU0lHTk1FTlQpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRoaXMubGV4KCk7XG4gICAgICBsZXQgcmlnaHQgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQXNzaWdubWVudEV4cHJlc3Npb24ob3BlcmF0b3IudHlwZS5uYW1lLCBub2RlLCByaWdodCksIHN0YXJ0TG9jYXRpb24pO1xuICAgIH1cbiAgICByZXR1cm4gbm9kZTtcbiAgfVxuXG4gIHBhcnNlQ29uZGl0aW9uYWxFeHByZXNzaW9uKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCBleHByID0gdGhpcy5wYXJzZUJpbmFyeUV4cHJlc3Npb24oKTtcbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuQ09ORElUSU9OQUwpKSB7XG4gICAgICB0aGlzLmxleCgpO1xuICAgICAgbGV0IHByZXZpb3VzQWxsb3dJbiA9IHRoaXMuYWxsb3dJbjtcbiAgICAgIHRoaXMuYWxsb3dJbiA9IHRydWU7XG4gICAgICBsZXQgY29uc2VxdWVudCA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgdGhpcy5hbGxvd0luID0gcHJldmlvdXNBbGxvd0luO1xuICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNPTE9OKTtcbiAgICAgIGxldCBhbHRlcm5hdGUgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQ29uZGl0aW9uYWxFeHByZXNzaW9uKGV4cHIsIGNvbnNlcXVlbnQsIGFsdGVybmF0ZSksIHN0YXJ0TG9jYXRpb24pO1xuICAgIH1cblxuICAgIHJldHVybiBleHByO1xuICB9XG5cbiAgaXNCaW5hcnlPcGVyYXRvcih0eXBlKSB7XG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICBjYXNlIFRva2VuVHlwZS5PUjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFORDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkJJVF9PUjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkJJVF9YT1I6XG4gICAgICBjYXNlIFRva2VuVHlwZS5CSVRfQU5EOlxuICAgICAgY2FzZSBUb2tlblR5cGUuRVE6XG4gICAgICBjYXNlIFRva2VuVHlwZS5ORTpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkVRX1NUUklDVDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk5FX1NUUklDVDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkxUOlxuICAgICAgY2FzZSBUb2tlblR5cGUuR1Q6XG4gICAgICBjYXNlIFRva2VuVHlwZS5MVEU6XG4gICAgICBjYXNlIFRva2VuVHlwZS5HVEU6XG4gICAgICBjYXNlIFRva2VuVHlwZS5JTlNUQU5DRU9GOlxuICAgICAgY2FzZSBUb2tlblR5cGUuU0hMOlxuICAgICAgY2FzZSBUb2tlblR5cGUuU0hSOlxuICAgICAgY2FzZSBUb2tlblR5cGUuU0hSX1VOU0lHTkVEOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQUREOlxuICAgICAgY2FzZSBUb2tlblR5cGUuU1VCOlxuICAgICAgY2FzZSBUb2tlblR5cGUuTVVMOlxuICAgICAgY2FzZSBUb2tlblR5cGUuRElWOlxuICAgICAgY2FzZSBUb2tlblR5cGUuTU9EOlxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLklOOlxuICAgICAgICByZXR1cm4gdGhpcy5hbGxvd0luO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHBhcnNlQmluYXJ5RXhwcmVzc2lvbigpIHtcbiAgICBsZXQgbG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IGxlZnQgPSB0aGlzLnBhcnNlVW5hcnlFeHByZXNzaW9uKCk7XG4gICAgbGV0IG9wZXJhdG9yID0gdGhpcy5sb29rYWhlYWQudHlwZTtcblxuICAgIGxldCBpc0JpbmFyeU9wZXJhdG9yID0gdGhpcy5pc0JpbmFyeU9wZXJhdG9yKG9wZXJhdG9yKTtcbiAgICBpZiAoIWlzQmluYXJ5T3BlcmF0b3IpIHtcbiAgICAgIHJldHVybiBsZWZ0O1xuICAgIH1cblxuICAgIHRoaXMubGV4KCk7XG4gICAgbGV0IHN0YWNrID0gW107XG4gICAgc3RhY2sucHVzaCh7bG9jYXRpb24sIGxlZnQsIG9wZXJhdG9yLCBwcmVjZWRlbmNlOiBCaW5hcnlQcmVjZWRlbmNlW29wZXJhdG9yLm5hbWVdfSk7XG4gICAgbG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IHJpZ2h0ID0gdGhpcy5wYXJzZVVuYXJ5RXhwcmVzc2lvbigpO1xuXG4gICAgb3BlcmF0b3IgPSB0aGlzLmxvb2thaGVhZC50eXBlO1xuICAgIGlzQmluYXJ5T3BlcmF0b3IgPSB0aGlzLmlzQmluYXJ5T3BlcmF0b3IodGhpcy5sb29rYWhlYWQudHlwZSk7XG4gICAgd2hpbGUgKGlzQmluYXJ5T3BlcmF0b3IpIHtcbiAgICAgIGxldCBwcmVjZWRlbmNlID0gQmluYXJ5UHJlY2VkZW5jZVtvcGVyYXRvci5uYW1lXTtcbiAgICAgIC8vIFJlZHVjZTogbWFrZSBhIGJpbmFyeSBleHByZXNzaW9uIGZyb20gdGhlIHRocmVlIHRvcG1vc3QgZW50cmllcy5cbiAgICAgIHdoaWxlIChzdGFjay5sZW5ndGggJiYgKHByZWNlZGVuY2UgPD0gc3RhY2tbc3RhY2subGVuZ3RoIC0gMV0ucHJlY2VkZW5jZSkpIHtcbiAgICAgICAgbGV0IHN0YWNrSXRlbSA9IHN0YWNrW3N0YWNrLmxlbmd0aCAtIDFdO1xuICAgICAgICBsZXQgc3RhY2tPcGVyYXRvciA9IHN0YWNrSXRlbS5vcGVyYXRvcjtcbiAgICAgICAgbGVmdCA9IHN0YWNrSXRlbS5sZWZ0O1xuICAgICAgICBzdGFjay5wb3AoKTtcbiAgICAgICAgbG9jYXRpb24gPSBzdGFja0l0ZW0ubG9jYXRpb247XG4gICAgICAgIHJpZ2h0ID0gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkJpbmFyeUV4cHJlc3Npb24oc3RhY2tPcGVyYXRvci5uYW1lLCBsZWZ0LCByaWdodCksIGxvY2F0aW9uKTtcbiAgICAgIH1cblxuICAgICAgLy8gU2hpZnQuXG4gICAgICB0aGlzLmxleCgpO1xuICAgICAgc3RhY2sucHVzaCh7bG9jYXRpb24sIGxlZnQ6IHJpZ2h0LCBvcGVyYXRvciwgcHJlY2VkZW5jZX0pO1xuICAgICAgbG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgICByaWdodCA9IHRoaXMucGFyc2VVbmFyeUV4cHJlc3Npb24oKTtcblxuICAgICAgb3BlcmF0b3IgPSB0aGlzLmxvb2thaGVhZC50eXBlO1xuICAgICAgaXNCaW5hcnlPcGVyYXRvciA9IHRoaXMuaXNCaW5hcnlPcGVyYXRvcihvcGVyYXRvcik7XG4gICAgfVxuXG4gICAgLy8gRmluYWwgcmVkdWNlIHRvIGNsZWFuLXVwIHRoZSBzdGFjay5cbiAgICByZXR1cm4gc3RhY2sucmVkdWNlUmlnaHQoKGV4cHIsIHN0YWNrSXRlbSkgPT5cbiAgICAgIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5CaW5hcnlFeHByZXNzaW9uKHN0YWNrSXRlbS5vcGVyYXRvci5uYW1lLCBzdGFja0l0ZW0ubGVmdCwgZXhwciksIHN0YWNrSXRlbS5sb2NhdGlvbiksXG4gICAgICByaWdodCk7XG4gIH1cblxuICBzdGF0aWMgaXNQcmVmaXhPcGVyYXRvcih0eXBlKSB7XG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICBjYXNlIFRva2VuVHlwZS5JTkM6XG4gICAgICBjYXNlIFRva2VuVHlwZS5ERUM6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BREQ6XG4gICAgICBjYXNlIFRva2VuVHlwZS5TVUI6XG4gICAgICBjYXNlIFRva2VuVHlwZS5CSVRfTk9UOlxuICAgICAgY2FzZSBUb2tlblR5cGUuTk9UOlxuICAgICAgY2FzZSBUb2tlblR5cGUuREVMRVRFOlxuICAgICAgY2FzZSBUb2tlblR5cGUuVk9JRDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlRZUEVPRjpcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHBhcnNlVW5hcnlFeHByZXNzaW9uKCkge1xuICAgIGlmICh0aGlzLmxvb2thaGVhZC50eXBlLmtsYXNzICE9IFRva2VuQ2xhc3MuUHVuY3R1YXRvciAmJiB0aGlzLmxvb2thaGVhZC50eXBlLmtsYXNzICE9IFRva2VuQ2xhc3MuS2V5d29yZCkge1xuICAgICAgcmV0dXJuIHRoaXMucGFyc2VQb3N0Zml4RXhwcmVzc2lvbigpO1xuICAgIH1cbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgb3BlcmF0b3IgPSB0aGlzLmxvb2thaGVhZDtcbiAgICBpZiAoIVBhcnNlci5pc1ByZWZpeE9wZXJhdG9yKG9wZXJhdG9yLnR5cGUpKSB7XG4gICAgICByZXR1cm4gdGhpcy5wYXJzZVBvc3RmaXhFeHByZXNzaW9uKCk7XG4gICAgfVxuICAgIHRoaXMubGV4KCk7XG4gICAgbGV0IGV4cHIgPSB0aGlzLnBhcnNlVW5hcnlFeHByZXNzaW9uKCk7XG4gICAgc3dpdGNoIChvcGVyYXRvci50eXBlKSB7XG4gICAgICBjYXNlIFRva2VuVHlwZS5JTkM6XG4gICAgICBjYXNlIFRva2VuVHlwZS5ERUM6XG4gICAgICAgIC8vIDExLjQuNCwgMTEuNC41O1xuICAgICAgICBpZiAoZXhwci50eXBlID09PSBcIklkZW50aWZpZXJFeHByZXNzaW9uXCIpIHtcbiAgICAgICAgICBpZiAodGhpcy5zdHJpY3QgJiYgaXNSZXN0cmljdGVkV29yZChleHByLmlkZW50aWZpZXIubmFtZSkpIHtcbiAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5TVFJJQ1RfTEhTX1BSRUZJWCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFQYXJzZXIuaXNMZWZ0SGFuZFNpZGUoZXhwcikpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuSU5WQUxJRF9MSFNfSU5fQVNTSUdOTUVOVCk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFRva2VuVHlwZS5ERUxFVEU6XG4gICAgICAgIGlmIChleHByLnR5cGUgPT09IFwiSWRlbnRpZmllckV4cHJlc3Npb25cIiAmJiB0aGlzLnN0cmljdCkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5TVFJJQ1RfREVMRVRFKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuUHJlZml4RXhwcmVzc2lvbihvcGVyYXRvci52YWx1ZSwgZXhwciksIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VQb3N0Zml4RXhwcmVzc2lvbigpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcblxuICAgIGxldCBleHByID0gdGhpcy5wYXJzZUxlZnRIYW5kU2lkZUV4cHJlc3Npb25BbGxvd0NhbGwoKTtcblxuICAgIGlmICh0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCkge1xuICAgICAgcmV0dXJuIGV4cHI7XG4gICAgfVxuXG4gICAgbGV0IG9wZXJhdG9yID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgaWYgKChvcGVyYXRvci50eXBlICE9PSBUb2tlblR5cGUuSU5DKSAmJiAob3BlcmF0b3IudHlwZSAhPT0gVG9rZW5UeXBlLkRFQykpIHtcbiAgICAgIHJldHVybiBleHByO1xuICAgIH1cbiAgICB0aGlzLmxleCgpO1xuICAgIC8vIDExLjMuMSwgMTEuMy4yO1xuICAgIGlmIChleHByLnR5cGUgPT09IFwiSWRlbnRpZmllckV4cHJlc3Npb25cIikge1xuICAgICAgaWYgKHRoaXMuc3RyaWN0ICYmIGlzUmVzdHJpY3RlZFdvcmQoZXhwci5pZGVudGlmaWVyLm5hbWUpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5TVFJJQ1RfTEhTX1BPU1RGSVgpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIVBhcnNlci5pc0xlZnRIYW5kU2lkZShleHByKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLklOVkFMSURfTEhTX0lOX0FTU0lHTk1FTlQpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlBvc3RmaXhFeHByZXNzaW9uKGV4cHIsIG9wZXJhdG9yLnZhbHVlKSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZUxlZnRIYW5kU2lkZUV4cHJlc3Npb25BbGxvd0NhbGwoKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IHByZXZpb3VzQWxsb3dJbiA9IHRoaXMuYWxsb3dJbjtcbiAgICB0aGlzLmFsbG93SW4gPSB0cnVlO1xuICAgIGxldCBleHByID0gdGhpcy5tYXRjaChUb2tlblR5cGUuTkVXKSA/IHRoaXMucGFyc2VOZXdFeHByZXNzaW9uKCkgOiB0aGlzLnBhcnNlUHJpbWFyeUV4cHJlc3Npb24oKTtcblxuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuTFBBUkVOKSkge1xuICAgICAgICBleHByID0gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkNhbGxFeHByZXNzaW9uKGV4cHIsIHRoaXMucGFyc2VBcmd1bWVudExpc3QoKSksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5MQlJBQ0spKSB7XG4gICAgICAgIGV4cHIgPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQ29tcHV0ZWRNZW1iZXJFeHByZXNzaW9uKGV4cHIsIHRoaXMucGFyc2VDb21wdXRlZE1lbWJlcigpKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLlBFUklPRCkpIHtcbiAgICAgICAgZXhwciA9IHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5TdGF0aWNNZW1iZXJFeHByZXNzaW9uKGV4cHIsIHRoaXMucGFyc2VOb25Db21wdXRlZE1lbWJlcigpKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmFsbG93SW4gPSBwcmV2aW91c0FsbG93SW47XG5cbiAgICByZXR1cm4gZXhwcjtcbiAgfVxuXG4gIHBhcnNlTGVmdEhhbmRTaWRlRXhwcmVzc2lvbigpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcblxuICAgIGxldCBleHByID0gdGhpcy5tYXRjaChUb2tlblR5cGUuTkVXKSA/IHRoaXMucGFyc2VOZXdFeHByZXNzaW9uKCkgOiB0aGlzLnBhcnNlUHJpbWFyeUV4cHJlc3Npb24oKTtcblxuICAgIHdoaWxlICh0aGlzLm1hdGNoKFRva2VuVHlwZS5QRVJJT0QpIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLkxCUkFDSykpIHtcbiAgICAgIGV4cHIgPSB0aGlzLm1hcmtMb2NhdGlvbihcbiAgICAgICAgICB0aGlzLm1hdGNoKFRva2VuVHlwZS5MQlJBQ0spID9cbiAgICAgICAgICAgICAgbmV3IFNoaWZ0LkNvbXB1dGVkTWVtYmVyRXhwcmVzc2lvbihleHByLCB0aGlzLnBhcnNlQ29tcHV0ZWRNZW1iZXIoKSkgOlxuICAgICAgICAgICAgICBuZXcgU2hpZnQuU3RhdGljTWVtYmVyRXhwcmVzc2lvbihleHByLCB0aGlzLnBhcnNlTm9uQ29tcHV0ZWRNZW1iZXIoKSksIHN0YXJ0TG9jYXRpb24pO1xuICAgIH1cblxuICAgIHJldHVybiBleHByO1xuICB9XG5cbiAgcGFyc2VOb25Db21wdXRlZE1lbWJlcigpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUEVSSU9EKTtcbiAgICByZXR1cm4gdGhpcy5wYXJzZU5vbkNvbXB1dGVkUHJvcGVydHkoKTtcbiAgfVxuXG4gIHBhcnNlQ29tcHV0ZWRNZW1iZXIoKSB7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxCUkFDSyk7XG4gICAgbGV0IGV4cHIgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SQlJBQ0spO1xuICAgIHJldHVybiBleHByO1xuICB9XG5cbiAgcGFyc2VOZXdFeHByZXNzaW9uKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5ORVcpO1xuICAgIGxldCBjYWxsZWUgPSB0aGlzLnBhcnNlTGVmdEhhbmRTaWRlRXhwcmVzc2lvbigpO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuTmV3RXhwcmVzc2lvbihjYWxsZWUsIHRoaXMubWF0Y2goVG9rZW5UeXBlLkxQQVJFTikgPyB0aGlzLnBhcnNlQXJndW1lbnRMaXN0KCkgOlxuICAgICAgICBbXSksIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VQcmltYXJ5RXhwcmVzc2lvbigpIHtcbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuTFBBUkVOKSkge1xuICAgICAgcmV0dXJuIHRoaXMucGFyc2VHcm91cEV4cHJlc3Npb24oKTtcbiAgICB9XG5cbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcblxuICAgIHN3aXRjaCAodGhpcy5sb29rYWhlYWQudHlwZS5rbGFzcykge1xuICAgICAgY2FzZSBUb2tlbkNsYXNzLklkZW50OlxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LklkZW50aWZpZXJFeHByZXNzaW9uKHRoaXMucGFyc2VJZGVudGlmaWVyKCkpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIGNhc2UgVG9rZW5DbGFzcy5TdHJpbmdMaXRlcmFsOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZVN0cmluZ0xpdGVyYWwoKTtcbiAgICAgIGNhc2UgVG9rZW5DbGFzcy5OdW1lcmljTGl0ZXJhbDpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VOdW1lcmljTGl0ZXJhbCgpO1xuICAgICAgY2FzZSBUb2tlbkNsYXNzLktleXdvcmQ6XG4gICAgICB7XG4gICAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5USElTKSkge1xuICAgICAgICAgIHRoaXMubGV4KCk7XG4gICAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5UaGlzRXhwcmVzc2lvbiwgc3RhcnRMb2NhdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkZVTkNUSU9OKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih0aGlzLnBhcnNlRnVuY3Rpb24odHJ1ZSksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBUb2tlbkNsYXNzLkJvb2xlYW5MaXRlcmFsOlxuICAgICAge1xuICAgICAgICBsZXQgdG9rZW4gPSB0aGlzLmxleCgpO1xuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkxpdGVyYWxCb29sZWFuRXhwcmVzc2lvbih0b2tlbi50eXBlID09IFRva2VuVHlwZS5UUlVFX0xJVEVSQUwpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIH1cbiAgICAgIGNhc2UgVG9rZW5DbGFzcy5OdWxsTGl0ZXJhbDpcbiAgICAgIHtcbiAgICAgICAgdGhpcy5sZXgoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5MaXRlcmFsTnVsbEV4cHJlc3Npb24sIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgfVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkxCUkFDSykpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5wYXJzZUFycmF5RXhwcmVzc2lvbigpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkxCUkFDRSkpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5wYXJzZU9iamVjdEV4cHJlc3Npb24oKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5ESVYpIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLkFTU0lHTl9ESVYpKSB7XG4gICAgICAgICAgdGhpcy5pbmRleCA9IHRoaXMuc3RhcnRJbmRleDtcbiAgICAgICAgICB0aGlzLmxpbmUgPSB0aGlzLnN0YXJ0TGluZTtcbiAgICAgICAgICB0aGlzLmxpbmVTdGFydCA9IHRoaXMuc3RhcnRMaW5lU3RhcnQ7XG4gICAgICAgICAgdGhpcy5sb29rYWhlYWQgPSB0aGlzLnNjYW5SZWdFeHAoKTtcbiAgICAgICAgICBsZXQgdG9rZW4gPSB0aGlzLmxleCgpO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgbGFzdFNsYXNoID0gdG9rZW4udmFsdWUubGFzdEluZGV4T2YoXCIvXCIpO1xuICAgICAgICAgICAgUmVnRXhwKHRva2VuLnZhbHVlLnNsaWNlKDEsIGxhc3RTbGFzaCksIHRva2VuLnZhbHVlLnNsaWNlKGxhc3RTbGFzaCArIDEpKTtcbiAgICAgICAgICB9IGNhdGNoICh1bnVzZWQpIHtcbiAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuSU5WQUxJRF9SRUdVTEFSX0VYUFJFU1NJT04pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkxpdGVyYWxSZWdFeHBFeHByZXNzaW9uKHRva2VuLnZhbHVlKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sZXgoKSk7XG4gIH1cblxuICBwYXJzZU51bWVyaWNMaXRlcmFsKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGlmICh0aGlzLnN0cmljdCAmJiB0aGlzLmxvb2thaGVhZC5vY3RhbCkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0aGlzLmxvb2thaGVhZCwgRXJyb3JNZXNzYWdlcy5TVFJJQ1RfT0NUQUxfTElURVJBTCk7XG4gICAgfVxuICAgIGxldCB0b2tlbjIgPSB0aGlzLmxleCgpO1xuICAgIGxldCBub2RlID0gdG9rZW4yLl92YWx1ZSA9PT0gMS8wXG4gICAgICA/IG5ldyBTaGlmdC5MaXRlcmFsSW5maW5pdHlFeHByZXNzaW9uXG4gICAgICA6IG5ldyBTaGlmdC5MaXRlcmFsTnVtZXJpY0V4cHJlc3Npb24odG9rZW4yLl92YWx1ZSk7XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5vZGUsIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VTdHJpbmdMaXRlcmFsKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGlmICh0aGlzLnN0cmljdCAmJiB0aGlzLmxvb2thaGVhZC5vY3RhbCkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0aGlzLmxvb2thaGVhZCwgRXJyb3JNZXNzYWdlcy5TVFJJQ1RfT0NUQUxfTElURVJBTCk7XG4gICAgfVxuICAgIGxldCB0b2tlbjIgPSB0aGlzLmxleCgpO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuTGl0ZXJhbFN0cmluZ0V4cHJlc3Npb24odG9rZW4yLl92YWx1ZSwgdG9rZW4yLnNsaWNlLnRleHQpLFxuICAgICAgICBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlSWRlbnRpZmllcigpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LklkZW50aWZpZXIodGhpcy5sZXgoKS52YWx1ZSksIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VBcmd1bWVudExpc3QoKSB7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgbGV0IGFyZ3MgPSB0aGlzLnBhcnNlQXJndW1lbnRzKCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJQQVJFTik7XG4gICAgcmV0dXJuIGFyZ3M7XG4gIH1cblxuICBwYXJzZUFyZ3VtZW50cygpIHtcbiAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5SUEFSRU4pIHx8IHRoaXMuZW9mKCkpIHtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH1cbiAgICAgIGxldCBhcmcgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgIHJlc3VsdC5wdXNoKGFyZyk7XG4gICAgICBpZiAoIXRoaXMuZWF0KFRva2VuVHlwZS5DT01NQSkpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvLyAxMS4yIExlZnQtSGFuZC1TaWRlIEV4cHJlc3Npb25zO1xuXG4gIHBhcnNlTm9uQ29tcHV0ZWRQcm9wZXJ0eSgpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcblxuICAgIGxldCB0b2tlbiA9IHRoaXMubGV4KCk7XG5cbiAgICBpZiAoISh0b2tlbiBpbnN0YW5jZW9mIElkZW50aWZpZXJMaWtlVG9rZW4pKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodG9rZW4pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LklkZW50aWZpZXIodG9rZW4udmFsdWUpLCBzdGFydExvY2F0aW9uKTtcbiAgICB9XG4gIH1cblxuICBwYXJzZUdyb3VwRXhwcmVzc2lvbigpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTFBBUkVOKTtcbiAgICBsZXQgZXhwciA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJQQVJFTik7XG4gICAgcmV0dXJuIGV4cHI7XG4gIH1cblxuXG4gIHBhcnNlQXJyYXlFeHByZXNzaW9uKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxCUkFDSyk7XG5cbiAgICBsZXQgZWxlbWVudHMgPSB0aGlzLnBhcnNlQXJyYXlFeHByZXNzaW9uRWxlbWVudHMoKTtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SQlJBQ0spO1xuXG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5BcnJheUV4cHJlc3Npb24oZWxlbWVudHMpLCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlQXJyYXlFeHByZXNzaW9uRWxlbWVudHMoKSB7XG4gICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuUkJSQUNLKSkge1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfVxuICAgICAgbGV0IGVsO1xuXG4gICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuQ09NTUEpKSB7XG4gICAgICAgIHRoaXMubGV4KCk7XG4gICAgICAgIGVsID0gbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVsID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuUkJSQUNLKSkge1xuICAgICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5DT01NQSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJlc3VsdC5wdXNoKGVsKTtcbiAgICB9XG4gIH1cblxuICBwYXJzZU9iamVjdEV4cHJlc3Npb24oKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTEJSQUNFKTtcblxuICAgIGxldCBwcm9wZXJ0eU1hcCA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgbGV0IHByb3BlcnRpZXMgPSB0aGlzLnBhcnNlT2JqZWN0RXhwcmVzc2lvbkl0ZW1zKHByb3BlcnR5TWFwKTtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SQlJBQ0UpO1xuXG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5PYmplY3RFeHByZXNzaW9uKHByb3BlcnRpZXMpLCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG5cbiAgcGFyc2VPYmplY3RFeHByZXNzaW9uSXRlbXMocHJvcGVydHlNYXApIHtcbiAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgd2hpbGUgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0UpKSB7XG4gICAgICByZXN1bHQucHVzaCh0aGlzLnBhcnNlT2JqZWN0RXhwcmVzc2lvbkl0ZW0ocHJvcGVydHlNYXApKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHBhcnNlT2JqZWN0RXhwcmVzc2lvbkl0ZW0ocHJvcGVydHlNYXApIHtcbiAgICBsZXQgcHJvcGVydHkgPSB0aGlzLnBhcnNlT2JqZWN0UHJvcGVydHkoKTtcbiAgICBsZXQgdHlwZSA9IHByb3BlcnR5LnR5cGU7XG4gICAgbGV0IGtleSA9IFwiJFwiICsgcHJvcGVydHkubmFtZS52YWx1ZTtcbiAgICBsZXQgdmFsdWUgPSB7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHByb3BlcnR5TWFwLCBrZXkpID8gcHJvcGVydHlNYXBba2V5XSA6IDA7XG5cbiAgICBpZiAoe30uaGFzT3duUHJvcGVydHkuY2FsbChwcm9wZXJ0eU1hcCwga2V5KSkge1xuICAgICAgaWYgKCh2YWx1ZSAmIElOSVRfTUFTSykgIT09IDApIHtcbiAgICAgICAgaWYgKHRoaXMuc3RyaWN0ICYmIHR5cGUgPT09IFwiRGF0YVByb3BlcnR5XCIpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX0RVUExJQ0FURV9QUk9QRVJUWSk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZSAhPT0gXCJEYXRhUHJvcGVydHlcIikge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5BQ0NFU1NPUl9EQVRBX1BST1BFUlRZKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHR5cGUgPT09IFwiRGF0YVByb3BlcnR5XCIpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuQUNDRVNTT1JfREFUQV9QUk9QRVJUWSk7XG4gICAgICAgIH0gZWxzZSBpZiAoKHZhbHVlICYgR0VUVEVSX01BU0spICE9PSAwICYmIHR5cGUgPT0gXCJHZXR0ZXJcIlxuICAgICAgICAgICAgfHwgKHZhbHVlICYgU0VUVEVSX01BU0spICE9PSAwICYmIHR5cGUgPT0gXCJTZXR0ZXJcIikge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5BQ0NFU1NPUl9HRVRfU0VUKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgXCJEYXRhUHJvcGVydHlcIjpcbiAgICAgICAgcHJvcGVydHlNYXBba2V5XSA9IHZhbHVlIHwgSU5JVF9NQVNLO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJHZXR0ZXJcIjpcbiAgICAgICAgcHJvcGVydHlNYXBba2V5XSA9IHZhbHVlIHwgR0VUVEVSX01BU0s7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIlNldHRlclwiOlxuICAgICAgICBwcm9wZXJ0eU1hcFtrZXldID0gdmFsdWUgfCBTRVRURVJfTUFTSztcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0UpKSB7XG4gICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuQ09NTUEpO1xuICAgIH1cbiAgICByZXR1cm4gcHJvcGVydHk7XG4gIH1cblxuICBwYXJzZU9iamVjdFByb3BlcnR5S2V5KCkge1xuICAgIGxldCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgIGxldCBsb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcblxuICAgIC8vIE5vdGU6IFRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIG9ubHkgZnJvbSBwYXJzZU9iamVjdFByb3BlcnR5KCksIHdoZXJlO1xuICAgIC8vIEVvZiBhbmQgUHVuY3R1YXRvciB0b2tlbnMgYXJlIGFscmVhZHkgZmlsdGVyZWQgb3V0LlxuXG4gICAgaWYgKHRva2VuIGluc3RhbmNlb2YgU3RyaW5nTGl0ZXJhbFRva2VuKSB7XG4gICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlN0YXRpY1Byb3BlcnR5TmFtZSh0aGlzLnBhcnNlU3RyaW5nTGl0ZXJhbCgpLnZhbHVlKSwgbG9jYXRpb24pO1xuICAgIH1cbiAgICBpZiAodG9rZW4gaW5zdGFuY2VvZiBOdW1lcmljTGl0ZXJhbFRva2VuKSB7XG4gICAgICBsZXQgbnVtTGl0ZXJhbCA9IHRoaXMucGFyc2VOdW1lcmljTGl0ZXJhbCgpO1xuICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5TdGF0aWNQcm9wZXJ0eU5hbWUoXCJcIiArIChudW1MaXRlcmFsLnR5cGUgPT09IFwiTGl0ZXJhbEluZmluaXR5RXhwcmVzc2lvblwiID8gMSAvIDAgOiBudW1MaXRlcmFsLnZhbHVlKSksIGxvY2F0aW9uKTtcbiAgICB9XG4gICAgaWYgKHRva2VuIGluc3RhbmNlb2YgSWRlbnRpZmllckxpa2VUb2tlbikge1xuICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5TdGF0aWNQcm9wZXJ0eU5hbWUodGhpcy5wYXJzZUlkZW50aWZpZXIoKS5uYW1lKSwgbG9jYXRpb24pO1xuICAgIH1cblxuICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5JTlZBTElEX1BST1BFUlRZX05BTUUpO1xuICB9XG5cbiAgcGFyc2VPYmplY3RQcm9wZXJ0eSgpIHtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcblxuICAgIGlmICh0b2tlbi50eXBlID09PSBUb2tlblR5cGUuSURFTlRJRklFUikge1xuICAgICAgbGV0IGtleSA9IHRoaXMucGFyc2VPYmplY3RQcm9wZXJ0eUtleSgpO1xuICAgICAgbGV0IG5hbWUgPSB0b2tlbi52YWx1ZTtcbiAgICAgIGlmIChuYW1lLmxlbmd0aCA9PT0gMykge1xuICAgICAgICAvLyBQcm9wZXJ0eSBBc3NpZ25tZW50OiBHZXR0ZXIgYW5kIFNldHRlci5cbiAgICAgICAgaWYgKFwiZ2V0XCIgPT09IG5hbWUgJiYgIXRoaXMubWF0Y2goVG9rZW5UeXBlLkNPTE9OKSkge1xuICAgICAgICAgIGtleSA9IHRoaXMucGFyc2VPYmplY3RQcm9wZXJ0eUtleSgpO1xuICAgICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MUEFSRU4pO1xuICAgICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgICAgICAgIGxldCBbYm9keSwgaXNTdHJpY3RdID0gdGhpcy5wYXJzZUZ1bmN0aW9uQm9keSgpO1xuICAgICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuR2V0dGVyKGtleSwgYm9keSksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgICB9IGVsc2UgaWYgKFwic2V0XCIgPT09IG5hbWUgJiYgIXRoaXMubWF0Y2goVG9rZW5UeXBlLkNPTE9OKSkge1xuICAgICAgICAgIGtleSA9IHRoaXMucGFyc2VPYmplY3RQcm9wZXJ0eUtleSgpO1xuICAgICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MUEFSRU4pO1xuICAgICAgICAgIHRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgICAgICAgaWYgKHRva2VuLnR5cGUgIT09IFRva2VuVHlwZS5JREVOVElGSUVSKSB7XG4gICAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcbiAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuVU5FWFBFQ1RFRF9UT0tFTiwgdG9rZW4udHlwZS5uYW1lKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGV0IHBhcmFtID0gdGhpcy5wYXJzZVZhcmlhYmxlSWRlbnRpZmllcigpO1xuICAgICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJQQVJFTik7XG4gICAgICAgICAgICBsZXQgW2JvZHksIGlzU3RyaWN0XSA9IHRoaXMucGFyc2VGdW5jdGlvbkJvZHkoKTtcbiAgICAgICAgICAgIGlmICgodGhpcy5zdHJpY3QgfHwgaXNTdHJpY3QpICYmIGlzUmVzdHJpY3RlZFdvcmQocGFyYW0ubmFtZSkpIHtcbiAgICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlNUUklDVF9QQVJBTV9OQU1FKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuU2V0dGVyKGtleSwgcGFyYW0sIGJvZHkpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5DT0xPTikpIHtcbiAgICAgICAgbGV0IHZhbHVlID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuRGF0YVByb3BlcnR5KGtleSwgdmFsdWUpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuU2hvcnRoYW5kUHJvcGVydHkobmV3IFNoaWZ0LklkZW50aWZpZXIoa2V5LnZhbHVlKSksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodGhpcy5lb2YoKSB8fCB0b2tlbi50eXBlLmtsYXNzID09IFRva2VuQ2xhc3MuUHVuY3R1YXRvcikge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRva2VuKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IGtleSA9IHRoaXMucGFyc2VPYmplY3RQcm9wZXJ0eUtleSgpO1xuICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNPTE9OKTtcbiAgICAgIGxldCB2YWx1ZSA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5EYXRhUHJvcGVydHkoa2V5LCB2YWx1ZSksIHN0YXJ0TG9jYXRpb24pO1xuICAgIH1cbiAgfVxuXG4gIHBhcnNlRnVuY3Rpb24oaXNFeHByZXNzaW9uKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuRlVOQ1RJT04pO1xuXG4gICAgbGV0IGlkID0gbnVsbDtcbiAgICBsZXQgbWVzc2FnZSA9IG51bGw7XG4gICAgbGV0IGZpcnN0UmVzdHJpY3RlZCA9IG51bGw7XG4gICAgaWYgKCFpc0V4cHJlc3Npb24gfHwgIXRoaXMubWF0Y2goVG9rZW5UeXBlLkxQQVJFTikpIHtcbiAgICAgIGxldCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgICAgaWQgPSB0aGlzLnBhcnNlVmFyaWFibGVJZGVudGlmaWVyKCk7XG4gICAgICBpZiAodGhpcy5zdHJpY3QpIHtcbiAgICAgICAgaWYgKGlzUmVzdHJpY3RlZFdvcmQoaWQubmFtZSkpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLlNUUklDVF9GVU5DVElPTl9OQU1FKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGlzUmVzdHJpY3RlZFdvcmQoaWQubmFtZSkpIHtcbiAgICAgICAgICBmaXJzdFJlc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgICBtZXNzYWdlID0gRXJyb3JNZXNzYWdlcy5TVFJJQ1RfRlVOQ1RJT05fTkFNRTtcbiAgICAgICAgfSBlbHNlIGlmIChpc1N0cmljdE1vZGVSZXNlcnZlZFdvcmRFUzUoaWQubmFtZSkpIHtcbiAgICAgICAgICBmaXJzdFJlc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgICBtZXNzYWdlID0gRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUkVTRVJWRURfV09SRDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBsZXQgaW5mbyA9IHRoaXMucGFyc2VQYXJhbXMoZmlyc3RSZXN0cmljdGVkKTtcblxuICAgIGlmIChpbmZvLm1lc3NhZ2UgIT0gbnVsbCkge1xuICAgICAgbWVzc2FnZSA9IGluZm8ubWVzc2FnZTtcbiAgICB9XG5cbiAgICBsZXQgcHJldmlvdXNTdHJpY3QgPSB0aGlzLnN0cmljdDtcbiAgICBsZXQgW2JvZHksIGlzU3RyaWN0XSA9IHRoaXMucGFyc2VGdW5jdGlvbkJvZHkoKTtcbiAgICBpZiAobWVzc2FnZSAhPSBudWxsKSB7XG4gICAgICBpZiAoKHRoaXMuc3RyaWN0IHx8IGlzU3RyaWN0KSAmJiBpbmZvLmZpcnN0UmVzdHJpY3RlZCAhPSBudWxsKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24oaW5mby5maXJzdFJlc3RyaWN0ZWQsIG1lc3NhZ2UpO1xuICAgICAgfVxuICAgICAgaWYgKCh0aGlzLnN0cmljdCB8fCBpc1N0cmljdCkgJiYgaW5mby5zdHJpY3RlZCAhPSBudWxsKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24oaW5mby5zdHJpY3RlZCwgbWVzc2FnZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuc3RyaWN0ID0gcHJldmlvdXNTdHJpY3Q7XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKFxuICAgICAgbmV3IChpc0V4cHJlc3Npb24gPyBTaGlmdC5GdW5jdGlvbkV4cHJlc3Npb24gOiBTaGlmdC5GdW5jdGlvbkRlY2xhcmF0aW9uKShmYWxzZSwgaWQsIGluZm8ucGFyYW1zLCBudWxsLCBib2R5KSxcbiAgICAgIHN0YXJ0TG9jYXRpb25cbiAgICApO1xuICB9XG5cblxuICBwYXJzZVBhcmFtcyhmcikge1xuICAgIGxldCBpbmZvID0ge3BhcmFtczogW119O1xuICAgIGluZm8uZmlyc3RSZXN0cmljdGVkID0gZnI7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG5cbiAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJQQVJFTikpIHtcbiAgICAgIGxldCBwYXJhbVNldCA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbiAgICAgIHdoaWxlICghdGhpcy5lb2YoKSkge1xuICAgICAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICAgICAgbGV0IHBhcmFtID0gdGhpcy5wYXJzZVZhcmlhYmxlSWRlbnRpZmllcigpO1xuICAgICAgICBsZXQga2V5ID0gXCIkXCIgKyBwYXJhbS5uYW1lO1xuICAgICAgICBpZiAodGhpcy5zdHJpY3QpIHtcbiAgICAgICAgICBpZiAodG9rZW4gaW5zdGFuY2VvZiBJZGVudGlmaWVyTGlrZVRva2VuICYmIGlzUmVzdHJpY3RlZFdvcmQocGFyYW0ubmFtZSkpIHtcbiAgICAgICAgICAgIGluZm8uc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgICAgIGluZm8ubWVzc2FnZSA9IEVycm9yTWVzc2FnZXMuU1RSSUNUX1BBUkFNX05BTUU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHBhcmFtU2V0LCBrZXkpKSB7XG4gICAgICAgICAgICBpbmZvLnN0cmljdGVkID0gdG9rZW47XG4gICAgICAgICAgICBpbmZvLm1lc3NhZ2UgPSBFcnJvck1lc3NhZ2VzLlNUUklDVF9QQVJBTV9EVVBFO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChpbmZvLmZpcnN0UmVzdHJpY3RlZCA9PSBudWxsKSB7XG4gICAgICAgICAgaWYgKHRva2VuIGluc3RhbmNlb2YgSWRlbnRpZmllckxpa2VUb2tlbiAmJiBpc1Jlc3RyaWN0ZWRXb3JkKHBhcmFtLm5hbWUpKSB7XG4gICAgICAgICAgICBpbmZvLmZpcnN0UmVzdHJpY3RlZCA9IHRva2VuO1xuICAgICAgICAgICAgaW5mby5tZXNzYWdlID0gRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUEFSQU1fTkFNRTtcbiAgICAgICAgICB9IGVsc2UgaWYgKFNUUklDVF9NT0RFX1JFU0VSVkVEX1dPUkQuaW5kZXhPZihwYXJhbS5uYW1lKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIGluZm8uZmlyc3RSZXN0cmljdGVkID0gdG9rZW47XG4gICAgICAgICAgICBpbmZvLm1lc3NhZ2UgPSBFcnJvck1lc3NhZ2VzLlNUUklDVF9SRVNFUlZFRF9XT1JEO1xuICAgICAgICAgIH0gZWxzZSBpZiAoe30uaGFzT3duUHJvcGVydHkuY2FsbChwYXJhbVNldCwga2V5KSkge1xuICAgICAgICAgICAgaW5mby5maXJzdFJlc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgICAgIGluZm8ubWVzc2FnZSA9IEVycm9yTWVzc2FnZXMuU1RSSUNUX1BBUkFNX0RVUEU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGluZm8ucGFyYW1zLnB1c2gocGFyYW0pO1xuICAgICAgICBwYXJhbVNldFtrZXldID0gdHJ1ZTtcbiAgICAgICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLlJQQVJFTikpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuQ09NTUEpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgIHJldHVybiBpbmZvO1xuICB9XG5cblxufVxuIl19