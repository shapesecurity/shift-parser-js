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

// Empty parameter list for ArrowExpression
var ARROW_EXPRESSION_PARAMS = "CoverParenthesizedExpressionAndArrowParameterList";

var STRICT_MODE_RESERVED_WORD = {
  "implements": null, "interface": null, "package": null, "private": null, "protected": null,
  "public": null, "static": null, "yield": null, "let": null
};

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

/**
 *
 * @param {[string]} strings
 * @returns {string?}
 */
function firstDuplicate(strings) {
  if (strings.length < 2) return null;
  var map = {};
  for (var cursor = 0; cursor < strings.length; cursor++) {
    var id = "$" + strings[cursor];
    if (map.hasOwnProperty(id)) {
      return strings[cursor];
    }
    map[id] = true;
  }
  return null;
}

function hasStrictModeReservedWord(ids) {
  return ids.some(function (id) {
    return STRICT_MODE_RESERVED_WORD.hasOwnProperty(id);
  });
}

var Parser = exports.Parser = (function (Tokenizer) {
  function Parser(source) {
    _classCallCheck(this, Parser);

    _get(Object.getPrototypeOf(Parser.prototype), "constructor", this).call(this, source);
    this.labelSet = Object.create(null);
    this.allowIn = true;
    this.inIteration = false;
    this.inSwitch = false;
    this.inFunctionBody = false;
    this.paramGeneratorParameter = false;
    this.paramYield = false;
  }

  _inherits(Parser, Tokenizer);

  _prototypeProperties(Parser, {
    transformDestructuringAssignment: {
      value: function transformDestructuringAssignment(node) {
        switch (node.type) {
          case "ObjectExpression":
            return new Shift.ObjectBinding(node.properties.map(Parser.transformDestructuringAssignment));
          case "DataProperty":
            return new Shift.BindingPropertyProperty(node.name, Parser.transformDestructuringAssignment(node.expression));
          case "ShorthandProperty":
            return new Shift.BindingPropertyIdentifier(new Shift.BindingIdentifier(node.name), null);
          case "ArrayExpression":
            var last = node.elements[node.elements.length - 1];
            if (last != null && last.type === "SpreadElement") {
              return new Shift.ArrayBinding(node.elements.slice(0, -1).map(function (e) {
                return e && Parser.transformDestructuringAssignment(e);
              }), new Shift.BindingIdentifier(last.expression.identifier));
            } else {
              return new Shift.ArrayBinding(node.elements.map(function (e) {
                return e && Parser.transformDestructuringAssignment(e);
              }), null);
            }
          case "AssignmentExpression":
            return new Shift.BindingWithDefault(Parser.transformDestructuringAssignment(node.binding), node.expression);
          case "IdentifierExpression":
            return new Shift.BindingIdentifier(node.identifier);
        }
        return node;
      },
      writable: true,
      configurable: true
    },
    isDestructuringAssignmentTarget: {
      value: function isDestructuringAssignmentTarget(node) {
        switch (node.type) {
          case "ObjectExpression":
            return node.properties.every(function (p) {
              return p.type === "BindingPropertyIdentifier" || p.type === "ShorthandProperty" || p.type === "DataProperty" && Parser.isDestructuringAssignmentTargetWithDefault(p.expression);
            });
          case "ArrayExpression":
            if (node.elements.length === 0) return false;
            if (!node.elements.slice(0, -1).filter(function (e) {
              return e != null;
            }).every(Parser.isDestructuringAssignmentTargetWithDefault)) return false;
            var last = node.elements[node.elements.length - 1];
            return last != null && last.type === "SpreadElement" ? last.expression.type === "IdentifierExpression" : last == null || Parser.isDestructuringAssignmentTargetWithDefault(last);
          case "ArrayBinding":
          case "BindingIdentifier":
          case "BindingPropertyIdentifier":
          case "BindingPropertyProperty":
          case "BindingWithDefault":
          case "IdentifierExpression":
          case "ObjectBinding":
            return true;
        }
        return false;
      },
      writable: true,
      configurable: true
    },
    isDestructuringAssignmentTargetWithDefault: {
      value: function isDestructuringAssignmentTargetWithDefault(node) {
        return Parser.isDestructuringAssignmentTarget(node) || node.type === "AssignmentExpression" && node.operator === "=" && Parser.isDestructuringAssignmentTarget(node.binding);
      },
      writable: true,
      configurable: true
    },
    isValidSimpleAssignmentTarget: {
      value: function isValidSimpleAssignmentTarget(node) {
        switch (node.type) {
          case "BindingIdentifier":
          case "IdentifierExpression":
          case "ComputedMemberExpression":
          case "StaticMemberExpression":
            return true;
        }
        return false;
      },
      writable: true,
      configurable: true
    },
    boundNames: {
      value: function boundNames(node) {
        switch (node.type) {
          case "BindingIdentifier":
            return [node.identifier.name];
          case "BindingWithDefault":
            return Parser.boundNames(node.binding);
          case "ArrayBinding":
            {
              var _ret = (function () {
                var names = [];
                node.elements.filter(function (e) {
                  return e != null;
                }).forEach(function (e) {
                  return [].push.apply(names, Parser.boundNames(e));
                });
                if (node.restElement != null) {
                  names.push(node.restElement.identifier.name);
                }
                return {
                  v: names
                };
              })();

              if (typeof _ret === "object") return _ret.v;
            }
          case "ObjectBinding":
            {
              var _ret2 = (function () {
                var names = [];
                node.properties.forEach(function (p) {
                  switch (p.type) {
                    case "BindingPropertyIdentifier":
                      names.push(p.identifier.identifier.name);
                      break;
                    case "BindingPropertyProperty":
                      [].push.apply(names, Parser.boundNames(p.binding));
                      break;
                    // istanbul ignore next
                    default:
                      throw new Error("boundNames called on ObjectBinding with invalid property: " + p.type);
                  }
                });
                return {
                  v: names
                };
              })();

              if (typeof _ret2 === "object") return _ret2.v;
            }
          case "ComputedMemberExpression":
          case "StaticMemberExpression":
            return [];
        }
        // istanbul ignore next
        throw new Error("boundNames called on invalid assignment target: " + node.type);
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
        // Catch the very common case first: immediately a semicolon (U+003B).
        if (this.index < this.source.length && this.source.charAt(this.index) == ";") {
          this.lex();
          return;
        }

        this.index = this.lookahead.slice.start;
        if (this.hasLineTerminatorBeforeNext) {
          return;
        }

        if (this.match(TokenType.SEMICOLON)) {
          this.lex();
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
      value: function markLocation(node, startTokenIndex) {
        var endTokenIndex = arguments[2] === undefined ? this.tokenIndex : arguments[2];
        // TODO: mark the source locations.
        return node;
      },
      writable: true,
      configurable: true
    },
    parseScript: {
      value: function parseScript() {
        var _parseBody = this.parseBody(true);

        var _parseBody2 = _slicedToArray(_parseBody, 1);

        var body = _parseBody2[0];
        return new Shift.Script(this.markLocation(body, 0));
      },
      writable: true,
      configurable: true
    },
    parseFunctionBody: {
      value: function parseFunctionBody() {
        var previousStrict = this.strict;
        var startTokenIndex = this.tokenIndex;

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

        body = this.markLocation(body, startTokenIndex);

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
          var stmt = this.parseStatement();
          if (parsingDirectives) {
            if (isStringLiteral && stmt.type === "ExpressionStatement" && stmt.expression.type === "LiteralStringExpression") {
              if (text === "\"use strict\"" || text === "'use strict'") {
                isStrict = true;
                this.strict = true;
                if (firstRestricted != null) {
                  throw this.createErrorWithToken(firstRestricted, ErrorMessages.STRICT_OCTAL_LITERAL);
                }
              } else if (firstRestricted == null && token.octal) {
                firstRestricted = token;
              }
              directives.push(new Shift.Directive(text.slice(1, -1)));
            } else {
              parsingDirectives = false;
              statements.push(stmt);
            }
          } else {
            statements.push(stmt);
          }
        }

        return [new Shift.FunctionBody(directives, statements), isStrict];
      },
      writable: true,
      configurable: true
    },
    parseStatement: {
      value: function parseStatement() {
        var startTokenIndex = this.tokenIndex;
        if (this.eof()) {
          throw this.createUnexpected(this.lookahead);
        }
        switch (this.lookahead.type) {
          case TokenType.SEMICOLON:
            return this.markLocation(this.parseEmptyStatement(), startTokenIndex);
          case TokenType.LBRACE:
            return this.markLocation(this.parseBlockStatement(), startTokenIndex);
          case TokenType.LPAREN:
            return this.markLocation(this.parseExpressionStatement(), startTokenIndex);
          case TokenType.BREAK:
            return this.markLocation(this.parseBreakStatement(), startTokenIndex);
          case TokenType.CONTINUE:
            return this.markLocation(this.parseContinueStatement(), startTokenIndex);
          case TokenType.DEBUGGER:
            return this.markLocation(this.parseDebuggerStatement(), startTokenIndex);
          case TokenType.DO:
            return this.markLocation(this.parseDoWhileStatement(), startTokenIndex);
          case TokenType.FOR:
            return this.markLocation(this.parseForStatement(), startTokenIndex);
          case TokenType.FUNCTION:
            return this.markLocation(this.parseFunction(false), startTokenIndex);
          case TokenType.IF:
            return this.markLocation(this.parseIfStatement(), startTokenIndex);
          case TokenType.RETURN:
            return this.markLocation(this.parseReturnStatement(), startTokenIndex);
          case TokenType.SWITCH:
            return this.markLocation(this.parseSwitchStatement(), startTokenIndex);
          case TokenType.THROW:
            return this.markLocation(this.parseThrowStatement(), startTokenIndex);
          case TokenType.TRY:
            return this.markLocation(this.parseTryStatement(), startTokenIndex);
          case TokenType.VAR:
          case TokenType.LET:
          case TokenType.CONST:
            return this.markLocation(this.parseVariableDeclarationStatement(), startTokenIndex);
          case TokenType.WHILE:
            return this.markLocation(this.parseWhileStatement(), startTokenIndex);
          case TokenType.WITH:
            return this.markLocation(this.parseWithStatement(), startTokenIndex);
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
                return this.markLocation(new Shift.LabeledStatement(expr.identifier, labeledBody), startTokenIndex);
              } else {
                this.consumeSemicolon();
                return this.markLocation(new Shift.ExpressionStatement(expr), startTokenIndex);
              }
            }
        }
      },
      writable: true,
      configurable: true
    },
    parseVariableIdentifier: {
      value: function parseVariableIdentifier() {
        var startTokenIndex = this.tokenIndex;

        var token = this.lex();
        if (!(token instanceof IdentifierToken)) {
          throw this.createUnexpected(token);
        }

        return this.markLocation(new Shift.Identifier(token.value), startTokenIndex);
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
            throw this.createErrorWithToken(token, ErrorMessages.ILLEGAL_BREAK);
          }

          return new Shift.BreakStatement(null);
        }

        if (this.hasLineTerminatorBeforeNext) {
          if (!(this.inIteration || this.inSwitch)) {
            throw this.createErrorWithToken(token, ErrorMessages.ILLEGAL_BREAK);
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
          throw this.createErrorWithToken(token, ErrorMessages.ILLEGAL_BREAK);
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
            throw this.createErrorWithToken(token, ErrorMessages.ILLEGAL_CONTINUE);
          }

          return new Shift.ContinueStatement(null);
        }

        if (this.hasLineTerminatorBeforeNext) {
          if (!this.inIteration) {
            throw this.createErrorWithToken(token, ErrorMessages.ILLEGAL_CONTINUE);
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
          throw this.createErrorWithToken(token, ErrorMessages.ILLEGAL_CONTINUE);
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
        if (this.match(TokenType.SEMICOLON)) {
          this.lex();
        }

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

            if (initDecl.declarators.length === 1 && (this.match(TokenType.IN) || this.match(TokenType.OF))) {
              var type = this.match(TokenType.IN) ? Shift.ForInStatement : Shift.ForOfStatement;
              if (initDecl.declarators[0].init != null) {
                throw type == Shift.ForInStatement ? this.createError(ErrorMessages.INVALID_VAR_INIT_FOR_IN) : this.createError(ErrorMessages.INVALID_VAR_INIT_FOR_OF);
              }
              this.lex();
              right = this.parseExpression();
              return new type(initDecl, right, this.getIteratorStatementEpilogue());
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

            if (this.match(TokenType.IN) || this.match(TokenType.OF)) {
              if (!Parser.isValidSimpleAssignmentTarget(init)) {
                throw this.createError(ErrorMessages.INVALID_LHS_IN_FOR_IN);
              }

              var type = this.match(TokenType.IN) ? Shift.ForInStatement : Shift.ForOfStatement;

              this.lex();
              right = this.parseExpression();

              return new type(init, right, this.getIteratorStatementEpilogue());
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
        var startTokenIndex = this.tokenIndex;
        this.expect(TokenType.CASE);
        return this.markLocation(new Shift.SwitchCase(this.parseExpression(), this.parseSwitchCaseBody()), startTokenIndex);
      },
      writable: true,
      configurable: true
    },
    parseSwitchDefault: {
      value: function parseSwitchDefault() {
        var startTokenIndex = this.tokenIndex;
        this.expect(TokenType.DEFAULT);
        return this.markLocation(new Shift.SwitchDefault(this.parseSwitchCaseBody()), startTokenIndex);
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
          throw this.createErrorWithToken(token, ErrorMessages.NEWLINE_AFTER_THROW);
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
        var startTokenIndex = this.tokenIndex;

        this.expect(TokenType.CATCH);
        this.expect(TokenType.LPAREN);
        var token = this.lookahead;
        if (this.match(TokenType.RPAREN) || this.match(TokenType.LPAREN)) {
          throw this.createUnexpected(token);
        }

        var param = this.parseLeftHandSideExpression();

        if (!Parser.isDestructuringAssignmentTarget(param)) {
          throw this.createUnexpected(token);
        }
        param = Parser.transformDestructuringAssignment(param);

        var bound = Parser.boundNames(param);
        if (firstDuplicate(bound) != null) {
          throw this.createErrorWithToken(token, ErrorMessages.DUPLICATE_BINDING, firstDuplicate(bound));
        }

        if (this.strict && bound.some(isRestrictedWord)) {
          throw this.createErrorWithToken(token, ErrorMessages.STRICT_CATCH_VARIABLE);
        }

        this.expect(TokenType.RPAREN);

        var body = this.parseBlock();

        return this.markLocation(new Shift.CatchClause(param, body), startTokenIndex);
      },
      writable: true,
      configurable: true
    },
    parseBlock: {
      value: function parseBlock() {
        var startTokenIndex = this.tokenIndex;
        this.expect(TokenType.LBRACE);

        var body = [];
        while (!this.match(TokenType.RBRACE)) {
          body.push(this.parseStatement());
        }
        this.expect(TokenType.RBRACE);

        return this.markLocation(new Shift.Block(body), startTokenIndex);
      },
      writable: true,
      configurable: true
    },
    parseVariableDeclaration: {
      value: function parseVariableDeclaration() {
        var startTokenIndex = this.tokenIndex;
        var token = this.lex();

        // Preceded by this.match(TokenSubType.VAR) || this.match(TokenSubType.LET);
        var kind = token.type == TokenType.VAR ? "var" : token.type === TokenType.CONST ? "const" : "let";
        var declarators = this.parseVariableDeclaratorList(kind);
        return this.markLocation(new Shift.VariableDeclaration(kind, declarators), startTokenIndex);
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
        var startTokenIndex = this.tokenIndex;
        var token = this.lookahead;

        if (this.match(TokenType.LPAREN)) {
          throw this.createUnexpected(this.lookahead);
        }
        var id = this.parseLeftHandSideExpression();

        if (!Parser.isDestructuringAssignmentTarget(id)) {
          throw this.createUnexpected(token);
        }
        id = Parser.transformDestructuringAssignment(id);

        var bound = Parser.boundNames(id);
        if (firstDuplicate(bound) != null) {
          throw this.createErrorWithToken(token, ErrorMessages.DUPLICATE_BINDING, firstDuplicate(bound));
        }

        if (this.strict && bound.some(isRestrictedWord)) {
          throw this.createErrorWithToken(token, ErrorMessages.STRICT_VAR_NAME);
        }

        var init = null;
        if (kind == "const") {
          this.expect(TokenType.ASSIGN);
          init = this.parseAssignmentExpression();
        } else if (this.match(TokenType.ASSIGN)) {
          this.lex();
          init = this.parseAssignmentExpression();
        }
        return this.markLocation(new Shift.VariableDeclarator(id, init), startTokenIndex);
      },
      writable: true,
      configurable: true
    },
    parseExpression: {
      value: function parseExpression() {
        var startTokenIndex = this.tokenIndex;

        var expr = this.parseAssignmentExpression();

        if (this.match(TokenType.COMMA)) {
          while (!this.eof()) {
            if (!this.match(TokenType.COMMA)) {
              break;
            }
            this.lex();
            expr = this.markLocation(new Shift.BinaryExpression(",", expr, this.parseAssignmentExpression()), startTokenIndex);
          }
        }
        return expr;
      },
      writable: true,
      configurable: true
    },
    parseArrowExpressionTail: {
      value: function parseArrowExpressionTail(head, startTokenIndex) {
        var arrow = this.expect(TokenType.ARROW);

        // Convert param list.
        var _head$params = head.params;
        var params = _head$params === undefined ? null : _head$params;
        var _head$rest = head.rest;
        var rest = _head$rest === undefined ? null : _head$rest;
        var _head$dup = head.dup;
        var dup = _head$dup === undefined ? null : _head$dup;
        var _head$strict_reserved_word = head.strict_reserved_word;
        var strict_reserved_word = _head$strict_reserved_word === undefined ? false : _head$strict_reserved_word;
        var _head$strict_restricted_word = head.strict_restricted_word;
        var strict_restricted_word = _head$strict_restricted_word === undefined ? false : _head$strict_restricted_word;
        if (head.type !== ARROW_EXPRESSION_PARAMS) {
          if (head.type === "IdentifierExpression") {
            var _name = head.identifier.name;
            if (STRICT_MODE_RESERVED_WORD.hasOwnProperty(_name)) {
              strict_reserved_word = true;
              if (this.strict) {
                throw this.createError(ErrorMessages.STRICT_RESERVED_WORD);
              }
            }
            if (isRestrictedWord(_name)) {
              strict_restricted_word = true;
              if (this.strict) {
                throw this.createError(ErrorMessages.STRICT_PARAM_NAME);
              }
            }
            head = Parser.transformDestructuringAssignment(head);
            params = [head];
          } else {
            throw this.createUnexpected(arrow);
          }
        }

        if (this.eat(TokenType.LBRACE)) {
          var _parseBody = this.parseBody();

          var _parseBody2 = _slicedToArray(_parseBody, 2);

          var body = _parseBody2[0];
          var isStrict = _parseBody2[1];
          if (isStrict) {
            if (dup) {
              throw this.createError(ErrorMessages.STRICT_PARAM_DUPE);
            }
            if (strict_reserved_word) {
              throw this.createError(ErrorMessages.STRICT_RESERVED_WORD);
            }
            if (strict_restricted_word) {
              throw this.createError(ErrorMessages.STRICT_PARAM_NAME);
            }
          }
          this.expect(TokenType.RBRACE);
          return this.markLocation(new Shift.ArrowExpression(params, rest, body), startTokenIndex);
        } else {
          var body = this.parseAssignmentExpression();
          return this.markLocation(new Shift.ArrowExpression(params, rest, body), startTokenIndex);
        }
      },
      writable: true,
      configurable: true
    },
    parseAssignmentExpression: {
      value: function parseAssignmentExpression() {
        var token = this.lookahead;
        var startTokenIndex = this.tokenIndex;

        var node = this.parseConditionalExpression();

        if (!this.hasLineTerminatorBeforeNext && this.match(TokenType.ARROW)) {
          return this.parseArrowExpressionTail(node, startTokenIndex);
        }

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
          if (!Parser.isDestructuringAssignmentTarget(node) && node.type !== "ComputedMemberExpression" && node.type !== "StaticMemberExpression") {
            throw this.createError(ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
          }
          node = Parser.transformDestructuringAssignment(node);

          var bound = Parser.boundNames(node);
          if (firstDuplicate(bound) != null) {
            throw this.createErrorWithToken(token, ErrorMessages.DUPLICATE_BINDING, firstDuplicate(bound));
          }

          if (this.strict && bound.some(isRestrictedWord)) {
            throw this.createErrorWithToken(token, ErrorMessages.STRICT_LHS_ASSIGNMENT);
          }

          this.lex();
          var right = this.parseAssignmentExpression();
          return this.markLocation(new Shift.AssignmentExpression(operator.type.name, node, right), startTokenIndex);
        }

        if (node.type === "ObjectExpression" && node.properties.some(function (p) {
          return p.type === "BindingPropertyIdentifier";
        })) {
          throw this.createUnexpected(operator);
        }

        return node;
      },
      writable: true,
      configurable: true
    },
    parseConditionalExpression: {
      value: function parseConditionalExpression() {
        var startTokenIndex = this.tokenIndex;
        var expr = this.parseBinaryExpression();
        if (this.match(TokenType.CONDITIONAL)) {
          this.lex();
          var previousAllowIn = this.allowIn;
          this.allowIn = true;
          var consequent = this.parseAssignmentExpression();
          this.allowIn = previousAllowIn;
          this.expect(TokenType.COLON);
          var alternate = this.parseAssignmentExpression();
          return this.markLocation(new Shift.ConditionalExpression(expr, consequent, alternate), startTokenIndex);
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
        var left = this.parseUnaryExpression();
        var operator = this.lookahead.type;

        var isBinaryOperator = this.isBinaryOperator(operator);
        if (!isBinaryOperator) {
          return left;
        }

        this.lex();
        var stack = [];
        stack.push({ startIndex: this.tokenIndex, left: left, operator: operator, precedence: BinaryPrecedence[operator.name] });
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
            right = this.markLocation(new Shift.BinaryExpression(stackOperator.name, left, right), stackItem.startIndex, this.tokenIndex);
          }

          // Shift.
          this.lex();
          stack.push({ startIndex: this.tokenIndex, left: right, operator: operator, precedence: precedence });
          right = this.parseUnaryExpression();

          operator = this.lookahead.type;
          isBinaryOperator = this.isBinaryOperator(operator);
        }

        // Final reduce to clean-up the stack.
        return stack.reduceRight(function (expr, stackItem) {
          return _this.markLocation(new Shift.BinaryExpression(stackItem.operator.name, stackItem.left, expr), stackItem.startIndex, _this.tokenIndex);
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
        var startTokenIndex = this.tokenIndex;
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

        return this.markLocation(new Shift.PrefixExpression(operator.value, expr), startTokenIndex);
      },
      writable: true,
      configurable: true
    },
    parsePostfixExpression: {
      value: function parsePostfixExpression() {
        var startTokenIndex = this.tokenIndex;

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
        if (!Parser.isValidSimpleAssignmentTarget(expr)) {
          throw this.createError(ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
        }
        return this.markLocation(new Shift.PostfixExpression(expr, operator.value), startTokenIndex);
      },
      writable: true,
      configurable: true
    },
    parseLeftHandSideExpressionAllowCall: {
      value: function parseLeftHandSideExpressionAllowCall() {
        var startTokenIndex = this.tokenIndex;
        var previousAllowIn = this.allowIn;
        this.allowIn = true;
        var expr = this.match(TokenType.NEW) ? this.parseNewExpression() : this.parsePrimaryExpression();

        while (true) {
          if (this.match(TokenType.LPAREN)) {
            expr = this.markLocation(new Shift.CallExpression(expr, this.parseArgumentList()), startTokenIndex);
          } else if (this.match(TokenType.LBRACK)) {
            expr = this.markLocation(new Shift.ComputedMemberExpression(expr, this.parseComputedMember()), startTokenIndex);
          } else if (this.match(TokenType.PERIOD)) {
            expr = this.markLocation(new Shift.StaticMemberExpression(expr, this.parseNonComputedMember()), startTokenIndex);
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
        var startTokenIndex = this.tokenIndex;

        var expr = this.match(TokenType.NEW) ? this.parseNewExpression() : this.parsePrimaryExpression();

        while (this.match(TokenType.PERIOD) || this.match(TokenType.LBRACK)) {
          expr = this.markLocation(this.match(TokenType.LBRACK) ? new Shift.ComputedMemberExpression(expr, this.parseComputedMember()) : new Shift.StaticMemberExpression(expr, this.parseNonComputedMember()), startTokenIndex);
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
        var startTokenIndex = this.tokenIndex;
        this.expect(TokenType.NEW);
        var callee = this.parseLeftHandSideExpression();
        return this.markLocation(new Shift.NewExpression(callee, this.match(TokenType.LPAREN) ? this.parseArgumentList() : []), startTokenIndex);
      },
      writable: true,
      configurable: true
    },
    parsePrimaryExpression: {
      value: function parsePrimaryExpression() {
        if (this.match(TokenType.LPAREN)) {
          return this.parseGroupExpression();
        }

        var startTokenIndex = this.tokenIndex;

        switch (this.lookahead.type.klass) {
          case TokenClass.Ident:
            return this.markLocation(new Shift.IdentifierExpression(this.parseIdentifier()), startTokenIndex);
          case TokenClass.StringLiteral:
            return this.parseStringLiteral();
          case TokenClass.NumericLiteral:
            return this.parseNumericLiteral();
          case TokenClass.Keyword:
            {
              if (this.match(TokenType.THIS)) {
                this.lex();
                return this.markLocation(new Shift.ThisExpression(), startTokenIndex);
              }
              if (this.match(TokenType.FUNCTION)) {
                return this.markLocation(this.parseFunction(true), startTokenIndex);
              }
              break;
            }
          case TokenClass.BooleanLiteral:
            {
              var token = this.lex();
              return this.markLocation(new Shift.LiteralBooleanExpression(token.type == TokenType.TRUE_LITERAL), startTokenIndex);
            }
          case TokenClass.NullLiteral:
            {
              this.lex();
              return this.markLocation(new Shift.LiteralNullExpression(), startTokenIndex);
            }
          default:
            if (this.match(TokenType.LBRACK)) {
              return this.parseArrayExpression();
            } else if (this.match(TokenType.LBRACE)) {
              return this.parseObjectExpression();
            } else if (this.match(TokenType.DIV) || this.match(TokenType.ASSIGN_DIV)) {
              this.skipComment();
              this.lookahead = this.scanRegExp();
              var token = this.lex();
              try {
                var lastSlash = token.value.lastIndexOf("/");
                RegExp(token.value.slice(1, lastSlash), token.value.slice(lastSlash + 1));
              } catch (unused) {
                throw this.createErrorWithToken(token, ErrorMessages.INVALID_REGULAR_EXPRESSION);
              }
              return this.markLocation(new Shift.LiteralRegExpExpression(token.value), startTokenIndex);
            }
        }

        throw this.createUnexpected(this.lex());
      },
      writable: true,
      configurable: true
    },
    parseNumericLiteral: {
      value: function parseNumericLiteral() {
        var startTokenIndex = this.tokenIndex;
        if (this.strict && this.lookahead.octal) {
          throw this.createErrorWithToken(this.lookahead, ErrorMessages.STRICT_OCTAL_LITERAL);
        }
        var token2 = this.lex();
        var node = token2._value === 1 / 0 ? new Shift.LiteralInfinityExpression() : new Shift.LiteralNumericExpression(token2._value);
        return this.markLocation(node, startTokenIndex);
      },
      writable: true,
      configurable: true
    },
    parseStringLiteral: {
      value: function parseStringLiteral() {
        var startTokenIndex = this.tokenIndex;
        if (this.strict && this.lookahead.octal) {
          throw this.createErrorWithToken(this.lookahead, ErrorMessages.STRICT_OCTAL_LITERAL);
        }
        var token2 = this.lex();
        return this.markLocation(new Shift.LiteralStringExpression(token2._value, token2.slice.text), startTokenIndex);
      },
      writable: true,
      configurable: true
    },
    parseIdentifier: {
      value: function parseIdentifier() {
        var startTokenIndex = this.tokenIndex;
        return this.markLocation(new Shift.Identifier(this.lex().value), startTokenIndex);
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
          var startTokenIndex = this.tokenIndex;
          var arg = undefined;
          if (this.eat(TokenType.ELLIPSIS)) {
            arg = this.parseAssignmentExpression();
            arg = this.markLocation(new Shift.SpreadElement(arg), startTokenIndex);
          } else {
            arg = this.parseAssignmentExpression();
          }
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
        var startTokenIndex = this.tokenIndex;

        var token = this.lex();

        if (!(token instanceof IdentifierLikeToken)) {
          throw this.createUnexpected(token);
        } else {
          return this.markLocation(new Shift.Identifier(token.value), startTokenIndex);
        }
      },
      writable: true,
      configurable: true
    },
    ensureArrow: {
      value: function ensureArrow() {
        if (this.hasLineTerminatorBeforeNext) {
          throw this.createError(ErrorMessages.UNEXPECTED_LINE_TERMINATOR);
        }
        if (!this.match(TokenType.ARROW)) {
          this.expect(TokenType.ARROW);
        }
      },
      writable: true,
      configurable: true
    },
    parseGroupExpression: {
      value: function parseGroupExpression() {
        var _this = this;
        var rest = null;
        var start = this.expect(TokenType.LPAREN);
        if (this.eat(TokenType.RPAREN)) {
          this.ensureArrow();
          return {
            type: ARROW_EXPRESSION_PARAMS,
            params: [],
            rest: null
          };
        } else if (this.eat(TokenType.ELLIPSIS)) {
          rest = new Shift.BindingIdentifier(this.parseIdentifier());
          this.expect(TokenType.RPAREN);
          this.ensureArrow();
          return {
            type: ARROW_EXPRESSION_PARAMS,
            params: [],
            rest: rest
          };
        }

        var possibleBindings = !this.match(TokenType.LPAREN);
        var startTokenIndex = this.tokenIndex;
        var group = this.parseAssignmentExpression();
        var params = [group];

        while (this.eat(TokenType.COMMA)) {
          if (this.match(TokenType.ELLIPSIS)) {
            if (!possibleBindings) {
              throw this.createUnexpected(this.lookahead);
            }
            this.lex();
            rest = new Shift.BindingIdentifier(this.parseIdentifier());
            break;
          }
          possibleBindings = possibleBindings && !this.match(TokenType.LPAREN);
          var expr = this.parseAssignmentExpression();
          params.push(expr);
          group = this.markLocation(new Shift.BinaryExpression(",", group, expr), startTokenIndex);
        }

        if (possibleBindings) {
          possibleBindings = params.every(Parser.isDestructuringAssignmentTargetWithDefault);
        }

        this.expect(TokenType.RPAREN);

        if (!this.hasLineTerminatorBeforeNext && this.match(TokenType.ARROW)) {
          var _ret = (function () {
            if (!possibleBindings) {
              throw _this.createErrorWithToken(start, ErrorMessages.ILLEGAL_ARROW_FUNCTION_PARAMS);
            }
            // check dup params
            params = params.map(Parser.transformDestructuringAssignment);
            var allBoundNames = [];
            params.forEach(function (expr) {
              var boundNames = Parser.boundNames(expr);
              var dup = firstDuplicate(boundNames);
              if (dup) {
                throw _this.createError(ErrorMessages.DUPLICATE_BINDING, dup);
              }
              allBoundNames = allBoundNames.concat(boundNames);
            });
            if (rest) {
              allBoundNames.push(rest.identifier.name);
            }

            var dup = firstDuplicate(allBoundNames);
            if (_this.strict && dup) {
              throw _this.createError(ErrorMessages.STRICT_PARAM_DUPE);
            }

            var strict_restricted_word = allBoundNames.some(isRestrictedWord);
            if (_this.strict && strict_restricted_word) {
              throw _this.createError(ErrorMessages.STRICT_PARAM_NAME);
            }

            var strict_reserved_word = hasStrictModeReservedWord(allBoundNames);
            if (_this.strict && strict_reserved_word) {
              throw _this.createError(ErrorMessages.STRICT_RESERVED_WORD);
            }

            return {
              v: {
                type: ARROW_EXPRESSION_PARAMS,
                params: params,
                rest: rest,
                dup: dup,
                strict_reserved_word: strict_reserved_word,
                strict_restricted_word: strict_restricted_word }
            };
          })();

          if (typeof _ret === "object") return _ret.v;
        } else {
          if (rest) {
            this.ensureArrow();
          }
          return group;
        }
      },
      writable: true,
      configurable: true
    },
    parseArrayExpression: {
      value: function parseArrayExpression() {
        var startTokenIndex = this.tokenIndex;

        this.expect(TokenType.LBRACK);

        var elements = this.parseArrayExpressionElements();

        this.expect(TokenType.RBRACK);

        return this.markLocation(new Shift.ArrayExpression(elements), startTokenIndex);
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
            var startTokenIndex = this.tokenIndex;
            if (this.eat(TokenType.ELLIPSIS)) {
              el = this.parseAssignmentExpression();
              el = this.markLocation(new Shift.SpreadElement(el), startTokenIndex);
            } else {
              el = this.parseAssignmentExpression();
            }
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
        var startTokenIndex = this.tokenIndex;

        this.expect(TokenType.LBRACE);

        var propertyMap = Object.create(null);
        var properties = this.parseObjectExpressionItems(propertyMap);

        this.expect(TokenType.RBRACE);

        return this.markLocation(new Shift.ObjectExpression(properties), startTokenIndex);
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
        var key = "$" + (type === "BindingPropertyIdentifier" ? property.identifier.identifier.name : property.name.value);
        var value = ({}).hasOwnProperty.call(propertyMap, key) ? propertyMap[key] : 0;

        if (({}).hasOwnProperty.call(propertyMap, key)) {
          if ((value & INIT_MASK) !== 0) {
            if (type === "DataProperty" && key === "$__proto__") {
              throw this.createError(ErrorMessages.DUPLICATE_PROTO_PROPERTY);
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
        // PropertyName[Yield,GeneratorParameter]:
        var token = this.lookahead;

        if (this.eof()) {
          throw this.createUnexpected(token);
        }

        if (token instanceof StringLiteralToken) {
          return new Shift.StaticPropertyName(this.parseStringLiteral().value);
        }
        if (token instanceof NumericLiteralToken) {
          var numLiteral = this.parseNumericLiteral();
          return new Shift.StaticPropertyName("" + (numLiteral.type === "LiteralInfinityExpression" ? 1 / 0 : numLiteral.value));
        }
        if (token instanceof IdentifierLikeToken) {
          return new Shift.StaticPropertyName(this.parseIdentifier().name);
        }
        if (token.type == TokenType.LBRACK) {
          var previousGeneratorParameter = this.paramGeneratorParameter;
          var previousYield = this.paramYield;
          this.expect(TokenType.LBRACK);
          if (this.paramGeneratorParameter) {
            // [+GeneratorParameter] ComputedPropertyName
            this.paramGeneratorParameter = false;
            this.paramYield = false;
          } // else [~GeneratorParameter] ComputedPropertyName[?Yield]
          var expr = this.parseAssignmentExpression();
          this.expect(TokenType.RBRACK);
          this.paramGeneratorParameter = previousGeneratorParameter;
          this.paramYield = previousYield;
          return new Shift.ComputedPropertyName(expr);
        }

        throw this.createError(ErrorMessages.INVALID_PROPERTY_NAME);
      },
      writable: true,
      configurable: true
    },
    parseObjectProperty: {
      value: function parseObjectProperty() {
        var token = this.lookahead;
        var startTokenIndex = this.tokenIndex;

        if (token.type === TokenType.IDENTIFIER) {
          var _key = this.parseObjectPropertyKey();
          var _name = token.value;
          if (_name.length === 3) {
            // Property Assignment: Getter and Setter.
            if ("get" === _name && !this.match(TokenType.COLON)) {
              _key = this.parseObjectPropertyKey();
              this.expect(TokenType.LPAREN);
              this.expect(TokenType.RPAREN);
              var _parseFunctionBody = this.parseFunctionBody();

              var _parseFunctionBody2 = _slicedToArray(_parseFunctionBody, 2);

              var body = _parseFunctionBody2[0];
              var isStrict = _parseFunctionBody2[1];
              return this.markLocation(new Shift.Getter(_key, body), startTokenIndex);
            } else if ("set" === _name && !this.match(TokenType.COLON)) {
              _key = this.parseObjectPropertyKey();
              this.expect(TokenType.LPAREN);
              token = this.lookahead;
              if (token.type !== TokenType.IDENTIFIER) {
                this.expect(TokenType.RPAREN);
                throw this.createErrorWithToken(token, ErrorMessages.UNEXPECTED_TOKEN, token.type.name);
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
                return this.markLocation(new Shift.Setter(_key, param, body), startTokenIndex);
              }
            }
          }

          if (this.eat(TokenType.COLON)) {
            var value = this.parseAssignmentExpression();
            return this.markLocation(new Shift.DataProperty(_key, value), startTokenIndex);
          } else if (this.eat(TokenType.ASSIGN)) {
            return this.markLocation(new Shift.BindingPropertyIdentifier(new Shift.BindingIdentifier(new Shift.Identifier(_key.value)), this.parseAssignmentExpression()), startTokenIndex);
          } else if (this.match(TokenType.LPAREN)) {
            return this.parseMethod(_key, startTokenIndex);
          } else {
            return this.markLocation(new Shift.ShorthandProperty(new Shift.Identifier(_key.value)), startTokenIndex);
          }
        }

        var key = this.parseObjectPropertyKey();
        if (this.eat(TokenType.COLON)) {
          // PropertyName[?Yield] : AssignmentExpression[In,?Yield]
          var value = this.parseAssignmentExpression();
          return this.markLocation(new Shift.DataProperty(key, value), startTokenIndex);
        }
        this.match(TokenType.LPAREN);
        return this.parseMethod(key, startTokenIndex);
      },
      writable: true,
      configurable: true
    },
    parseMethod: {
      value: function parseMethod(key, startTokenIndex) {
        var parmInfo = this.parseParams(null);
        var _parseFunctionBody = this.parseFunctionBody();

        var _parseFunctionBody2 = _slicedToArray(_parseFunctionBody, 1);

        var body /*, isStrict*/ = _parseFunctionBody2[0];
        return this.markLocation(new Shift.Method(false, key, parmInfo.params, parmInfo.rest, body), startTokenIndex);
      },
      writable: true,
      configurable: true
    },
    parseFunction: {
      value: function parseFunction(isExpression) {
        var startTokenIndex = this.tokenIndex;

        this.expect(TokenType.FUNCTION);

        var id = null;
        var message = null;
        var firstRestricted = null;
        if (!isExpression || !this.match(TokenType.LPAREN)) {
          var token = this.lookahead;
          id = this.parseVariableIdentifier();
          if (this.strict) {
            if (isRestrictedWord(id.name)) {
              throw this.createErrorWithToken(token, ErrorMessages.STRICT_FUNCTION_NAME);
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
            throw this.createErrorWithToken(info.firstRestricted, message);
          }
          if ((this.strict || isStrict) && info.stricted != null) {
            throw this.createErrorWithToken(info.stricted, message);
          }
        }
        this.strict = previousStrict;
        return this.markLocation(new (isExpression ? Shift.FunctionExpression : Shift.FunctionDeclaration)(false, id, info.params, info.rest, body), startTokenIndex);
      },
      writable: true,
      configurable: true
    },
    parseParams: {
      value: function parseParams(fr) {
        var info = { params: [], rest: null };
        info.firstRestricted = fr;
        this.expect(TokenType.LPAREN);

        if (!this.match(TokenType.RPAREN)) {
          var bound = [];
          var seenRest = false;

          while (!this.eof()) {
            var token = this.lookahead;
            var startTokenIndex = this.tokenIndex;
            var param = undefined;
            if (this.eat(TokenType.ELLIPSIS)) {
              token = this.lookahead;
              param = new Shift.BindingIdentifier(this.parseIdentifier());
              seenRest = true;
            } else {
              if (this.match(TokenType.LPAREN)) {
                throw this.createUnexpected(this.lookahead);
              }
              param = this.parseLeftHandSideExpression();
              if (this.eat(TokenType.ASSIGN)) {
                param = this.markLocation(new Shift.AssignmentExpression("=", param, this.parseAssignmentExpression()));
              }
            }

            if (!Parser.isDestructuringAssignmentTargetWithDefault(param)) {
              throw this.createUnexpected(token);
            }
            param = Parser.transformDestructuringAssignment(param);

            var newBound = Parser.boundNames(param);
            [].push.apply(bound, newBound);

            if (firstDuplicate(newBound) != null) {
              throw this.createErrorWithToken(token, ErrorMessages.DUPLICATE_BINDING, firstDuplicate(newBound));
            }
            if (this.strict) {
              if (newBound.some(isRestrictedWord)) {
                info.stricted = token;
                info.message = ErrorMessages.STRICT_PARAM_NAME;
              } else if (firstDuplicate(bound) != null) {
                info.stricted = token;
                info.message = ErrorMessages.STRICT_PARAM_DUPE;
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

        this.expect(TokenType.RPAREN);
        return info;
      },
      writable: true,
      configurable: true
    }
  });

  return Parser;
})(Tokenizer);
//# sourceMappingURL=data:application/json;base64,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a0JBQUksUUFBUSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFO0FBQ25DLG9CQUFJLENBQUMsZUFBZSxHQUFHLEtBQUssQ0FBQztBQUM3QixvQkFBSSxDQUFDLE9BQU8sR0FBRyxhQUFhLENBQUMsaUJBQWlCLENBQUM7ZUFDaEQsTUFBTSxJQUFJLHlCQUF5QixDQUFDLFFBQVEsQ0FBQyxFQUFFO0FBQzlDLG9CQUFJLENBQUMsZUFBZSxHQUFHLEtBQUssQ0FBQztBQUM3QixvQkFBSSxDQUFDLE9BQU8sR0FBRyxhQUFhLENBQUMsb0JBQW9CLENBQUM7ZUFDbkQsTUFBTSxJQUFJLGNBQWMsQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLEVBQUU7QUFDeEMsb0JBQUksQ0FBQyxlQUFlLEdBQUcsS0FBSyxDQUFDO0FBQzdCLG9CQUFJLENBQUMsT0FBTyxHQUFHLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBQztlQUNoRDthQUNGOztBQUVELGdCQUFJLFFBQVEsRUFBRTtBQUNaLGtCQUFJLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQztBQUNsQixvQkFBTTthQUNQO0FBQ0QsZ0JBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3hCLGdCQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQ2hDLG9CQUFNO2FBQ1A7QUFDRCxnQkFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7V0FDOUI7U0FDRjs7QUFFRCxZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM5QixlQUFPLElBQUksQ0FBQztPQUNiOzs7Ozs7U0F4c0RVLE1BQU07R0FBUyxTQUFTIiwiZmlsZSI6InNyYy9wYXJzZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAyMDE0IFNoYXBlIFNlY3VyaXR5LCBJbmMuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKVxuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0ICogYXMgU2hpZnQgZnJvbSBcInNoaWZ0LWFzdFwiO1xuXG5pbXBvcnQge2lzUmVzdHJpY3RlZFdvcmQsIGlzU3RyaWN0TW9kZVJlc2VydmVkV29yZEVTNX0gZnJvbSBcIi4vdXRpbHNcIjtcblxuaW1wb3J0IHtFcnJvck1lc3NhZ2VzfSBmcm9tIFwiLi9lcnJvcnNcIjtcblxuaW1wb3J0IFRva2VuaXplciwge1xuICAgIFRva2VuQ2xhc3MsXG4gICAgVG9rZW5UeXBlLFxuICAgIElkZW50aWZpZXJUb2tlbixcbiAgICBJZGVudGlmaWVyTGlrZVRva2VuLFxuICAgIE51bWVyaWNMaXRlcmFsVG9rZW4sXG4gICAgU3RyaW5nTGl0ZXJhbFRva2VufSBmcm9tIFwiLi90b2tlbml6ZXJcIjtcblxuY29uc3QgSU5JVF9NQVNLID0gMTtcbmNvbnN0IEdFVFRFUl9NQVNLID0gMjtcbmNvbnN0IFNFVFRFUl9NQVNLID0gNDtcblxuLy8gRW1wdHkgcGFyYW1ldGVyIGxpc3QgZm9yIEFycm93RXhwcmVzc2lvblxuY29uc3QgQVJST1dfRVhQUkVTU0lPTl9QQVJBTVMgPSBcIkNvdmVyUGFyZW50aGVzaXplZEV4cHJlc3Npb25BbmRBcnJvd1BhcmFtZXRlckxpc3RcIjtcblxuY29uc3QgU1RSSUNUX01PREVfUkVTRVJWRURfV09SRCA9IHtcbiAgXCJpbXBsZW1lbnRzXCI6IG51bGwsIFwiaW50ZXJmYWNlXCI6IG51bGwsIFwicGFja2FnZVwiOiBudWxsLCBcInByaXZhdGVcIjogbnVsbCwgXCJwcm90ZWN0ZWRcIjogbnVsbCxcbiAgXCJwdWJsaWNcIjogbnVsbCwgXCJzdGF0aWNcIjogbnVsbCwgXCJ5aWVsZFwiOiBudWxsLCBcImxldFwiOiBudWxsXG59O1xuXG5jb25zdCBQcmVjZWRlbmNlID0ge1xuICBTZXF1ZW5jZTogMCxcbiAgWWllbGQ6IDEsXG4gIEFzc2lnbm1lbnQ6IDEsXG4gIENvbmRpdGlvbmFsOiAyLFxuICBBcnJvd0Z1bmN0aW9uOiAyLFxuICBMb2dpY2FsT1I6IDMsXG4gIExvZ2ljYWxBTkQ6IDQsXG4gIEJpdHdpc2VPUjogNSxcbiAgQml0d2lzZVhPUjogNixcbiAgQml0d2lzZUFORDogNyxcbiAgRXF1YWxpdHk6IDgsXG4gIFJlbGF0aW9uYWw6IDksXG4gIEJpdHdpc2VTSElGVDogMTAsXG4gIEFkZGl0aXZlOiAxMSxcbiAgTXVsdGlwbGljYXRpdmU6IDEyLFxuICBVbmFyeTogMTMsXG4gIFBvc3RmaXg6IDE0LFxuICBDYWxsOiAxNSxcbiAgTmV3OiAxNixcbiAgVGFnZ2VkVGVtcGxhdGU6IDE3LFxuICBNZW1iZXI6IDE4LFxuICBQcmltYXJ5OiAxOVxufTtcblxuY29uc3QgQmluYXJ5UHJlY2VkZW5jZSA9IHtcbiAgXCJ8fFwiOiBQcmVjZWRlbmNlLkxvZ2ljYWxPUixcbiAgXCImJlwiOiBQcmVjZWRlbmNlLkxvZ2ljYWxBTkQsXG4gIFwifFwiOiBQcmVjZWRlbmNlLkJpdHdpc2VPUixcbiAgXCJeXCI6IFByZWNlZGVuY2UuQml0d2lzZVhPUixcbiAgXCImXCI6IFByZWNlZGVuY2UuQml0d2lzZUFORCxcbiAgXCI9PVwiOiBQcmVjZWRlbmNlLkVxdWFsaXR5LFxuICBcIiE9XCI6IFByZWNlZGVuY2UuRXF1YWxpdHksXG4gIFwiPT09XCI6IFByZWNlZGVuY2UuRXF1YWxpdHksXG4gIFwiIT09XCI6IFByZWNlZGVuY2UuRXF1YWxpdHksXG4gIFwiPFwiOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gIFwiPlwiOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gIFwiPD1cIjogUHJlY2VkZW5jZS5SZWxhdGlvbmFsLFxuICBcIj49XCI6IFByZWNlZGVuY2UuUmVsYXRpb25hbCxcbiAgXCJpblwiOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gIFwiaW5zdGFuY2VvZlwiOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gIFwiPDxcIjogUHJlY2VkZW5jZS5CaXR3aXNlU0hJRlQsXG4gIFwiPj5cIjogUHJlY2VkZW5jZS5CaXR3aXNlU0hJRlQsXG4gIFwiPj4+XCI6IFByZWNlZGVuY2UuQml0d2lzZVNISUZULFxuICBcIitcIjogUHJlY2VkZW5jZS5BZGRpdGl2ZSxcbiAgXCItXCI6IFByZWNlZGVuY2UuQWRkaXRpdmUsXG4gIFwiKlwiOiBQcmVjZWRlbmNlLk11bHRpcGxpY2F0aXZlLFxuICBcIiVcIjogUHJlY2VkZW5jZS5NdWx0aXBsaWNhdGl2ZSxcbiAgXCIvXCI6IFByZWNlZGVuY2UuTXVsdGlwbGljYXRpdmUsXG59O1xuXG4vKipcbiAqXG4gKiBAcGFyYW0ge1tzdHJpbmddfSBzdHJpbmdzXG4gKiBAcmV0dXJucyB7c3RyaW5nP31cbiAqL1xuZnVuY3Rpb24gZmlyc3REdXBsaWNhdGUoc3RyaW5ncykge1xuICBpZiAoc3RyaW5ncy5sZW5ndGggPCAyKVxuICAgIHJldHVybiBudWxsO1xuICBsZXQgbWFwID0ge307XG4gIGZvciAobGV0IGN1cnNvciA9IDA7IGN1cnNvciA8IHN0cmluZ3MubGVuZ3RoOyBjdXJzb3IrKykge1xuICAgIGxldCBpZCA9ICckJyArIHN0cmluZ3NbY3Vyc29yXTtcbiAgICBpZiAobWFwLmhhc093blByb3BlcnR5KGlkKSkge1xuICAgICAgcmV0dXJuIHN0cmluZ3NbY3Vyc29yXTtcbiAgICB9XG4gICAgbWFwW2lkXSA9IHRydWU7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGhhc1N0cmljdE1vZGVSZXNlcnZlZFdvcmQoaWRzKSB7XG4gIHJldHVybiBpZHMuc29tZShpZCA9PiBTVFJJQ1RfTU9ERV9SRVNFUlZFRF9XT1JELmhhc093blByb3BlcnR5KGlkKSk7XG59XG5cbmV4cG9ydCBjbGFzcyBQYXJzZXIgZXh0ZW5kcyBUb2tlbml6ZXIge1xuICBjb25zdHJ1Y3Rvcihzb3VyY2UpIHtcbiAgICBzdXBlcihzb3VyY2UpO1xuICAgIHRoaXMubGFiZWxTZXQgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIHRoaXMuYWxsb3dJbiA9IHRydWU7XG4gICAgdGhpcy5pbkl0ZXJhdGlvbiA9IGZhbHNlO1xuICAgIHRoaXMuaW5Td2l0Y2ggPSBmYWxzZTtcbiAgICB0aGlzLmluRnVuY3Rpb25Cb2R5ID0gZmFsc2U7XG4gICAgdGhpcy5wYXJhbUdlbmVyYXRvclBhcmFtZXRlciA9IGZhbHNlO1xuICAgIHRoaXMucGFyYW1ZaWVsZCA9IGZhbHNlO1xuICB9XG5cbiAgZWF0KHRva2VuVHlwZSkge1xuICAgIGlmICh0aGlzLmxvb2thaGVhZC50eXBlID09PSB0b2tlblR5cGUpIHtcbiAgICAgIHJldHVybiB0aGlzLmxleCgpO1xuICAgIH1cbiAgfVxuXG4gIGV4cGVjdCh0b2tlblR5cGUpIHtcbiAgICBpZiAodGhpcy5sb29rYWhlYWQudHlwZSA9PT0gdG9rZW5UeXBlKSB7XG4gICAgICByZXR1cm4gdGhpcy5sZXgoKTtcbiAgICB9XG4gICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgfVxuXG4gIG1hdGNoKHN1YlR5cGUpIHtcbiAgICByZXR1cm4gdGhpcy5sb29rYWhlYWQudHlwZSA9PT0gc3ViVHlwZTtcbiAgfVxuXG4gIGNvbnN1bWVTZW1pY29sb24oKSB7XG4gICAgLy8gQ2F0Y2ggdGhlIHZlcnkgY29tbW9uIGNhc2UgZmlyc3Q6IGltbWVkaWF0ZWx5IGEgc2VtaWNvbG9uIChVKzAwM0IpLlxuICAgIGlmICh0aGlzLmluZGV4IDwgdGhpcy5zb3VyY2UubGVuZ3RoICYmIHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KSA9PSBcIjtcIikge1xuICAgICAgdGhpcy5sZXgoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmluZGV4ID0gdGhpcy5sb29rYWhlYWQuc2xpY2Uuc3RhcnQ7XG4gICAgaWYgKHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLlNFTUlDT0xPTikpIHtcbiAgICAgIHRoaXMubGV4KCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmVvZigpICYmICF0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0UpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuICAgIH1cbiAgfVxuXG4gIC8vIHRoaXMgaXMgYSBuby1vcCwgcmVzZXJ2ZWQgZm9yIGZ1dHVyZSB1c2VcbiAgbWFya0xvY2F0aW9uKG5vZGUsIHN0YXJ0VG9rZW5JbmRleCwgZW5kVG9rZW5JbmRleCA9IHRoaXMudG9rZW5JbmRleCkge1xuICAgIC8vIFRPRE86IG1hcmsgdGhlIHNvdXJjZSBsb2NhdGlvbnMuXG4gICAgcmV0dXJuIG5vZGU7XG4gIH1cblxuICBwYXJzZVNjcmlwdCgpIHtcbiAgICBsZXQgW2JvZHldID0gdGhpcy5wYXJzZUJvZHkodHJ1ZSk7XG4gICAgcmV0dXJuIG5ldyBTaGlmdC5TY3JpcHQodGhpcy5tYXJrTG9jYXRpb24oYm9keSwgMCkpO1xuICB9XG5cbiAgcGFyc2VGdW5jdGlvbkJvZHkoKSB7XG4gICAgbGV0IHByZXZpb3VzU3RyaWN0ID0gdGhpcy5zdHJpY3Q7XG4gICAgbGV0IHN0YXJ0VG9rZW5JbmRleCA9IHRoaXMudG9rZW5JbmRleDtcblxuICAgIGxldCBvbGRMYWJlbFNldCA9IHRoaXMubGFiZWxTZXQ7XG4gICAgbGV0IG9sZEluSXRlcmF0aW9uID0gdGhpcy5pbkl0ZXJhdGlvbjtcbiAgICBsZXQgb2xkSW5Td2l0Y2ggPSB0aGlzLmluU3dpdGNoO1xuICAgIGxldCBvbGRJbkZ1bmN0aW9uQm9keSA9IHRoaXMuaW5GdW5jdGlvbkJvZHk7XG5cbiAgICB0aGlzLmxhYmVsU2V0ID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICB0aGlzLmluSXRlcmF0aW9uID0gZmFsc2U7XG4gICAgdGhpcy5pblN3aXRjaCA9IGZhbHNlO1xuICAgIHRoaXMuaW5GdW5jdGlvbkJvZHkgPSB0cnVlO1xuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxCUkFDRSk7XG4gICAgbGV0IFtib2R5LCBpc1N0cmljdF0gPSB0aGlzLnBhcnNlQm9keSgpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SQlJBQ0UpO1xuXG4gICAgYm9keSA9IHRoaXMubWFya0xvY2F0aW9uKGJvZHksIHN0YXJ0VG9rZW5JbmRleCk7XG5cbiAgICB0aGlzLmxhYmVsU2V0ID0gb2xkTGFiZWxTZXQ7XG4gICAgdGhpcy5pbkl0ZXJhdGlvbiA9IG9sZEluSXRlcmF0aW9uO1xuICAgIHRoaXMuaW5Td2l0Y2ggPSBvbGRJblN3aXRjaDtcbiAgICB0aGlzLmluRnVuY3Rpb25Cb2R5ID0gb2xkSW5GdW5jdGlvbkJvZHk7XG4gICAgdGhpcy5zdHJpY3QgPSBwcmV2aW91c1N0cmljdDtcbiAgICByZXR1cm4gW2JvZHksIGlzU3RyaWN0XTtcbiAgfVxuXG4gIHBhcnNlQm9keShhY2NlcHRFT0YgPSBmYWxzZSkge1xuICAgIGxldCBkaXJlY3RpdmVzID0gW107XG4gICAgbGV0IHN0YXRlbWVudHMgPSBbXTtcbiAgICBsZXQgcGFyc2luZ0RpcmVjdGl2ZXMgPSB0cnVlO1xuICAgIGxldCBpc1N0cmljdCA9IHRoaXMuc3RyaWN0O1xuICAgIGxldCBmaXJzdFJlc3RyaWN0ZWQgPSBudWxsO1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBpZiAoYWNjZXB0RU9GKSB7XG4gICAgICAgIGlmICh0aGlzLmVvZigpKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0UpKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGxldCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgICAgbGV0IHRleHQgPSB0b2tlbi5zbGljZS50ZXh0O1xuICAgICAgbGV0IGlzU3RyaW5nTGl0ZXJhbCA9IHRva2VuIGluc3RhbmNlb2YgU3RyaW5nTGl0ZXJhbFRva2VuO1xuICAgICAgbGV0IHN0bXQgPSB0aGlzLnBhcnNlU3RhdGVtZW50KCk7XG4gICAgICBpZiAocGFyc2luZ0RpcmVjdGl2ZXMpIHtcbiAgICAgICAgaWYgKGlzU3RyaW5nTGl0ZXJhbCAmJiBzdG10LnR5cGUgPT09IFwiRXhwcmVzc2lvblN0YXRlbWVudFwiICYmXG4gICAgICAgICAgICBzdG10LmV4cHJlc3Npb24udHlwZSA9PT0gXCJMaXRlcmFsU3RyaW5nRXhwcmVzc2lvblwiKSB7XG4gICAgICAgICAgaWYgKHRleHQgPT09IFwiXFxcInVzZSBzdHJpY3RcXFwiXCIgfHwgdGV4dCA9PT0gXCIndXNlIHN0cmljdCdcIikge1xuICAgICAgICAgICAgaXNTdHJpY3QgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5zdHJpY3QgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKGZpcnN0UmVzdHJpY3RlZCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoVG9rZW4oZmlyc3RSZXN0cmljdGVkLCBFcnJvck1lc3NhZ2VzLlNUUklDVF9PQ1RBTF9MSVRFUkFMKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKGZpcnN0UmVzdHJpY3RlZCA9PSBudWxsICYmIHRva2VuLm9jdGFsKSB7XG4gICAgICAgICAgICBmaXJzdFJlc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgICB9XG4gICAgICAgICAgZGlyZWN0aXZlcy5wdXNoKG5ldyBTaGlmdC5EaXJlY3RpdmUodGV4dC5zbGljZSgxLCAtMSkpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwYXJzaW5nRGlyZWN0aXZlcyA9IGZhbHNlO1xuICAgICAgICAgIHN0YXRlbWVudHMucHVzaChzdG10KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RhdGVtZW50cy5wdXNoKHN0bXQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBbbmV3IFNoaWZ0LkZ1bmN0aW9uQm9keShkaXJlY3RpdmVzLCBzdGF0ZW1lbnRzKSwgaXNTdHJpY3RdO1xuICB9XG5cblxuICBwYXJzZVN0YXRlbWVudCgpIHtcbiAgICBsZXQgc3RhcnRUb2tlbkluZGV4ID0gdGhpcy50b2tlbkluZGV4O1xuICAgIGlmICh0aGlzLmVvZigpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuICAgIH1cbiAgICBzd2l0Y2ggKHRoaXMubG9va2FoZWFkLnR5cGUpIHtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlNFTUlDT0xPTjpcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHRoaXMucGFyc2VFbXB0eVN0YXRlbWVudCgpLCBzdGFydFRva2VuSW5kZXgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuTEJSQUNFOlxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24odGhpcy5wYXJzZUJsb2NrU3RhdGVtZW50KCksIHN0YXJ0VG9rZW5JbmRleCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5MUEFSRU46XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih0aGlzLnBhcnNlRXhwcmVzc2lvblN0YXRlbWVudCgpLCBzdGFydFRva2VuSW5kZXgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuQlJFQUs6XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih0aGlzLnBhcnNlQnJlYWtTdGF0ZW1lbnQoKSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkNPTlRJTlVFOlxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24odGhpcy5wYXJzZUNvbnRpbnVlU3RhdGVtZW50KCksIHN0YXJ0VG9rZW5JbmRleCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5ERUJVR0dFUjpcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHRoaXMucGFyc2VEZWJ1Z2dlclN0YXRlbWVudCgpLCBzdGFydFRva2VuSW5kZXgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuRE86XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih0aGlzLnBhcnNlRG9XaGlsZVN0YXRlbWVudCgpLCBzdGFydFRva2VuSW5kZXgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuRk9SOlxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24odGhpcy5wYXJzZUZvclN0YXRlbWVudCgpLCBzdGFydFRva2VuSW5kZXgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuRlVOQ1RJT046XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih0aGlzLnBhcnNlRnVuY3Rpb24oZmFsc2UpLCBzdGFydFRva2VuSW5kZXgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuSUY6XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih0aGlzLnBhcnNlSWZTdGF0ZW1lbnQoKSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlJFVFVSTjpcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHRoaXMucGFyc2VSZXR1cm5TdGF0ZW1lbnQoKSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlNXSVRDSDpcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHRoaXMucGFyc2VTd2l0Y2hTdGF0ZW1lbnQoKSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlRIUk9XOlxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24odGhpcy5wYXJzZVRocm93U3RhdGVtZW50KCksIHN0YXJ0VG9rZW5JbmRleCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5UUlk6XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih0aGlzLnBhcnNlVHJ5U3RhdGVtZW50KCksIHN0YXJ0VG9rZW5JbmRleCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5WQVI6XG4gICAgICBjYXNlIFRva2VuVHlwZS5MRVQ6XG4gICAgICBjYXNlIFRva2VuVHlwZS5DT05TVDpcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHRoaXMucGFyc2VWYXJpYWJsZURlY2xhcmF0aW9uU3RhdGVtZW50KCksIHN0YXJ0VG9rZW5JbmRleCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5XSElMRTpcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHRoaXMucGFyc2VXaGlsZVN0YXRlbWVudCgpLCBzdGFydFRva2VuSW5kZXgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuV0lUSDpcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHRoaXMucGFyc2VXaXRoU3RhdGVtZW50KCksIHN0YXJ0VG9rZW5JbmRleCk7XG4gICAgICBkZWZhdWx0OlxuICAgICAge1xuICAgICAgICBsZXQgZXhwciA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG5cbiAgICAgICAgLy8gMTIuMTIgTGFiZWxsZWQgU3RhdGVtZW50cztcbiAgICAgICAgaWYgKGV4cHIudHlwZSA9PT0gXCJJZGVudGlmaWVyRXhwcmVzc2lvblwiICYmIHRoaXMubWF0Y2goVG9rZW5UeXBlLkNPTE9OKSkge1xuICAgICAgICAgIHRoaXMubGV4KCk7XG4gICAgICAgICAgbGV0IGtleSA9IFwiJFwiICsgZXhwci5pZGVudGlmaWVyLm5hbWU7XG4gICAgICAgICAgaWYgKHt9Lmhhc093blByb3BlcnR5LmNhbGwodGhpcy5sYWJlbFNldCwga2V5KSkge1xuICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLkxBQkVMX1JFREVDTEFSQVRJT04sIGV4cHIuaWRlbnRpZmllci5uYW1lKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLmxhYmVsU2V0W2tleV0gPSB0cnVlO1xuICAgICAgICAgIGxldCBsYWJlbGVkQm9keSA9IHRoaXMucGFyc2VTdGF0ZW1lbnQoKTtcbiAgICAgICAgICBkZWxldGUgdGhpcy5sYWJlbFNldFtrZXldO1xuICAgICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuTGFiZWxlZFN0YXRlbWVudChleHByLmlkZW50aWZpZXIsIGxhYmVsZWRCb2R5KSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmNvbnN1bWVTZW1pY29sb24oKTtcbiAgICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkV4cHJlc3Npb25TdGF0ZW1lbnQoZXhwciksIHN0YXJ0VG9rZW5JbmRleCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgfVxuXG4gIHBhcnNlVmFyaWFibGVJZGVudGlmaWVyKCkge1xuICAgIGxldCBzdGFydFRva2VuSW5kZXggPSB0aGlzLnRva2VuSW5kZXg7XG5cbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxleCgpO1xuICAgIGlmICghKHRva2VuIGluc3RhbmNlb2YgSWRlbnRpZmllclRva2VuKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRva2VuKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LklkZW50aWZpZXIodG9rZW4udmFsdWUpLCBzdGFydFRva2VuSW5kZXgpO1xuICB9XG5cbiAgcGFyc2VFbXB0eVN0YXRlbWVudCgpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuU0VNSUNPTE9OKTtcbiAgICByZXR1cm4gbmV3IFNoaWZ0LkVtcHR5U3RhdGVtZW50O1xuICB9XG5cbiAgcGFyc2VCbG9ja1N0YXRlbWVudCgpIHtcbiAgICByZXR1cm4gbmV3IFNoaWZ0LkJsb2NrU3RhdGVtZW50KHRoaXMucGFyc2VCbG9jaygpKTtcbiAgfVxuXG4gIHBhcnNlRXhwcmVzc2lvblN0YXRlbWVudCgpIHtcbiAgICBsZXQgZXhwciA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgdGhpcy5jb25zdW1lU2VtaWNvbG9uKCk7XG4gICAgcmV0dXJuIG5ldyBTaGlmdC5FeHByZXNzaW9uU3RhdGVtZW50KGV4cHIpO1xuICB9XG5cbiAgcGFyc2VCcmVha1N0YXRlbWVudCgpIHtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuQlJFQUspO1xuXG4gICAgLy8gQ2F0Y2ggdGhlIHZlcnkgY29tbW9uIGNhc2UgZmlyc3Q6IGltbWVkaWF0ZWx5IGEgc2VtaWNvbG9uIChVKzAwM0IpLlxuICAgIGlmICh0aGlzLmxvb2thaGVhZC50eXBlID09IFRva2VuVHlwZS5TRU1JQ09MT04pIHtcbiAgICAgIHRoaXMubGV4KCk7XG5cbiAgICAgIGlmICghKHRoaXMuaW5JdGVyYXRpb24gfHwgdGhpcy5pblN3aXRjaCkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhUb2tlbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5JTExFR0FMX0JSRUFLKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5ldyBTaGlmdC5CcmVha1N0YXRlbWVudChudWxsKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQpIHtcbiAgICAgIGlmICghKHRoaXMuaW5JdGVyYXRpb24gfHwgdGhpcy5pblN3aXRjaCkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhUb2tlbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5JTExFR0FMX0JSRUFLKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5ldyBTaGlmdC5CcmVha1N0YXRlbWVudChudWxsKTtcbiAgICB9XG5cbiAgICBsZXQgbGFiZWwgPSBudWxsO1xuICAgIGlmICh0aGlzLmxvb2thaGVhZC50eXBlID09IFRva2VuVHlwZS5JREVOVElGSUVSKSB7XG4gICAgICBsYWJlbCA9IHRoaXMucGFyc2VWYXJpYWJsZUlkZW50aWZpZXIoKTtcblxuICAgICAgbGV0IGtleSA9IFwiJFwiICsgbGFiZWwubmFtZTtcbiAgICAgIGlmICghe30uaGFzT3duUHJvcGVydHkuY2FsbCh0aGlzLmxhYmVsU2V0LCBrZXkpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTktOT1dOX0xBQkVMLCBsYWJlbC5uYW1lKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmNvbnN1bWVTZW1pY29sb24oKTtcblxuICAgIGlmIChsYWJlbCA9PSBudWxsICYmICEodGhpcy5pbkl0ZXJhdGlvbiB8fCB0aGlzLmluU3dpdGNoKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhUb2tlbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5JTExFR0FMX0JSRUFLKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFNoaWZ0LkJyZWFrU3RhdGVtZW50KGxhYmVsKTtcbiAgfVxuXG4gIHBhcnNlQ29udGludWVTdGF0ZW1lbnQoKSB7XG4gICAgbGV0IHRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNPTlRJTlVFKTtcblxuICAgIC8vIENhdGNoIHRoZSB2ZXJ5IGNvbW1vbiBjYXNlIGZpcnN0OiBpbW1lZGlhdGVseSBhIHNlbWljb2xvbiAoVSswMDNCKS5cbiAgICBpZiAodGhpcy5sb29rYWhlYWQudHlwZSA9PSBUb2tlblR5cGUuU0VNSUNPTE9OKSB7XG4gICAgICB0aGlzLmxleCgpO1xuICAgICAgaWYgKCF0aGlzLmluSXRlcmF0aW9uKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoVG9rZW4odG9rZW4sIEVycm9yTWVzc2FnZXMuSUxMRUdBTF9DT05USU5VRSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuZXcgU2hpZnQuQ29udGludWVTdGF0ZW1lbnQobnVsbCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0KSB7XG4gICAgICBpZiAoIXRoaXMuaW5JdGVyYXRpb24pIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhUb2tlbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5JTExFR0FMX0NPTlRJTlVFKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5ldyBTaGlmdC5Db250aW51ZVN0YXRlbWVudChudWxsKTtcbiAgICB9XG5cbiAgICBsZXQgbGFiZWwgPSBudWxsO1xuICAgIGlmICh0aGlzLmxvb2thaGVhZC50eXBlID09IFRva2VuVHlwZS5JREVOVElGSUVSKSB7XG4gICAgICBsYWJlbCA9IHRoaXMucGFyc2VWYXJpYWJsZUlkZW50aWZpZXIoKTtcblxuICAgICAgbGV0IGtleSA9IFwiJFwiICsgbGFiZWwubmFtZTtcbiAgICAgIGlmICghe30uaGFzT3duUHJvcGVydHkuY2FsbCh0aGlzLmxhYmVsU2V0LCBrZXkpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTktOT1dOX0xBQkVMLCBsYWJlbC5uYW1lKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmNvbnN1bWVTZW1pY29sb24oKTtcbiAgICBpZiAoIXRoaXMuaW5JdGVyYXRpb24pIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoVG9rZW4odG9rZW4sIEVycm9yTWVzc2FnZXMuSUxMRUdBTF9DT05USU5VRSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBTaGlmdC5Db250aW51ZVN0YXRlbWVudChsYWJlbCk7XG4gIH1cblxuXG4gIHBhcnNlRGVidWdnZXJTdGF0ZW1lbnQoKSB7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkRFQlVHR0VSKTtcbiAgICB0aGlzLmNvbnN1bWVTZW1pY29sb24oKTtcbiAgICByZXR1cm4gbmV3IFNoaWZ0LkRlYnVnZ2VyU3RhdGVtZW50O1xuICB9XG5cbiAgcGFyc2VEb1doaWxlU3RhdGVtZW50KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5ETyk7XG4gICAgbGV0IG9sZEluSXRlcmF0aW9uID0gdGhpcy5pbkl0ZXJhdGlvbjtcbiAgICB0aGlzLmluSXRlcmF0aW9uID0gdHJ1ZTtcblxuICAgIGxldCBib2R5ID0gdGhpcy5wYXJzZVN0YXRlbWVudCgpO1xuICAgIHRoaXMuaW5JdGVyYXRpb24gPSBvbGRJbkl0ZXJhdGlvbjtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5XSElMRSk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgbGV0IHRlc3QgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5TRU1JQ09MT04pKSB7XG4gICAgICB0aGlzLmxleCgpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgU2hpZnQuRG9XaGlsZVN0YXRlbWVudChib2R5LCB0ZXN0KTtcbiAgfVxuXG4gIHN0YXRpYyB0cmFuc2Zvcm1EZXN0cnVjdHVyaW5nQXNzaWdubWVudChub2RlKSB7XG4gICAgc3dpdGNoIChub2RlLnR5cGUpIHtcbiAgICAgIGNhc2UgXCJPYmplY3RFeHByZXNzaW9uXCI6XG4gICAgICAgIHJldHVybiBuZXcgU2hpZnQuT2JqZWN0QmluZGluZyhcbiAgICAgICAgICBub2RlLnByb3BlcnRpZXMubWFwKFBhcnNlci50cmFuc2Zvcm1EZXN0cnVjdHVyaW5nQXNzaWdubWVudClcbiAgICAgICAgKTtcbiAgICAgIGNhc2UgXCJEYXRhUHJvcGVydHlcIjpcbiAgICAgICAgcmV0dXJuIG5ldyBTaGlmdC5CaW5kaW5nUHJvcGVydHlQcm9wZXJ0eShcbiAgICAgICAgICBub2RlLm5hbWUsXG4gICAgICAgICAgUGFyc2VyLnRyYW5zZm9ybURlc3RydWN0dXJpbmdBc3NpZ25tZW50KG5vZGUuZXhwcmVzc2lvbilcbiAgICAgICAgKTtcbiAgICAgIGNhc2UgXCJTaG9ydGhhbmRQcm9wZXJ0eVwiOlxuICAgICAgICByZXR1cm4gbmV3IFNoaWZ0LkJpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXIoXG4gICAgICAgICAgbmV3IFNoaWZ0LkJpbmRpbmdJZGVudGlmaWVyKG5vZGUubmFtZSksXG4gICAgICAgICAgbnVsbFxuICAgICAgICApO1xuICAgICAgY2FzZSBcIkFycmF5RXhwcmVzc2lvblwiOlxuICAgICAgICBsZXQgbGFzdCA9IG5vZGUuZWxlbWVudHNbbm9kZS5lbGVtZW50cy5sZW5ndGggLSAxXTtcbiAgICAgICAgaWYgKGxhc3QgIT0gbnVsbCAmJiBsYXN0LnR5cGUgPT09IFwiU3ByZWFkRWxlbWVudFwiKSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBTaGlmdC5BcnJheUJpbmRpbmcoXG4gICAgICAgICAgICBub2RlLmVsZW1lbnRzLnNsaWNlKDAsIC0xKS5tYXAoZSA9PiBlICYmIFBhcnNlci50cmFuc2Zvcm1EZXN0cnVjdHVyaW5nQXNzaWdubWVudChlKSksXG4gICAgICAgICAgICBuZXcgU2hpZnQuQmluZGluZ0lkZW50aWZpZXIobGFzdC5leHByZXNzaW9uLmlkZW50aWZpZXIpXG4gICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gbmV3IFNoaWZ0LkFycmF5QmluZGluZyhcbiAgICAgICAgICAgIG5vZGUuZWxlbWVudHMubWFwKGUgPT4gZSAmJiBQYXJzZXIudHJhbnNmb3JtRGVzdHJ1Y3R1cmluZ0Fzc2lnbm1lbnQoZSkpLFxuICAgICAgICAgICAgbnVsbFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIGNhc2UgXCJBc3NpZ25tZW50RXhwcmVzc2lvblwiOlxuICAgICAgICByZXR1cm4gbmV3IFNoaWZ0LkJpbmRpbmdXaXRoRGVmYXVsdChcbiAgICAgICAgICBQYXJzZXIudHJhbnNmb3JtRGVzdHJ1Y3R1cmluZ0Fzc2lnbm1lbnQobm9kZS5iaW5kaW5nKSxcbiAgICAgICAgICBub2RlLmV4cHJlc3Npb25cbiAgICAgICAgKTtcbiAgICAgIGNhc2UgXCJJZGVudGlmaWVyRXhwcmVzc2lvblwiOlxuICAgICAgICByZXR1cm4gbmV3IFNoaWZ0LkJpbmRpbmdJZGVudGlmaWVyKG5vZGUuaWRlbnRpZmllcik7XG4gICAgfVxuICAgIHJldHVybiBub2RlO1xuICB9XG5cbiAgc3RhdGljIGlzRGVzdHJ1Y3R1cmluZ0Fzc2lnbm1lbnRUYXJnZXQobm9kZSkge1xuICAgIHN3aXRjaCAobm9kZS50eXBlKSB7XG4gICAgICBjYXNlIFwiT2JqZWN0RXhwcmVzc2lvblwiOlxuICAgICAgICByZXR1cm4gbm9kZS5wcm9wZXJ0aWVzLmV2ZXJ5KHAgPT5cbiAgICAgICAgICBwLnR5cGUgPT09IFwiQmluZGluZ1Byb3BlcnR5SWRlbnRpZmllclwiIHx8XG4gICAgICAgICAgcC50eXBlID09PSBcIlNob3J0aGFuZFByb3BlcnR5XCIgfHxcbiAgICAgICAgICBwLnR5cGUgPT09IFwiRGF0YVByb3BlcnR5XCIgJiZcbiAgICAgICAgICAgIFBhcnNlci5pc0Rlc3RydWN0dXJpbmdBc3NpZ25tZW50VGFyZ2V0V2l0aERlZmF1bHQocC5leHByZXNzaW9uKVxuICAgICAgICApO1xuICAgICAgY2FzZSBcIkFycmF5RXhwcmVzc2lvblwiOlxuICAgICAgICBpZiAobm9kZS5lbGVtZW50cy5sZW5ndGggPT09IDApXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICBpZiAoIW5vZGUuZWxlbWVudHMuc2xpY2UoMCwgLTEpLmZpbHRlcihlID0+IGUgIT0gbnVsbCkuZXZlcnkoUGFyc2VyLmlzRGVzdHJ1Y3R1cmluZ0Fzc2lnbm1lbnRUYXJnZXRXaXRoRGVmYXVsdCkpXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICBsZXQgbGFzdCA9IG5vZGUuZWxlbWVudHNbbm9kZS5lbGVtZW50cy5sZW5ndGggLSAxXTtcbiAgICAgICAgcmV0dXJuIGxhc3QgIT0gbnVsbCAmJiBsYXN0LnR5cGUgPT09IFwiU3ByZWFkRWxlbWVudFwiXG4gICAgICAgICAgPyBsYXN0LmV4cHJlc3Npb24udHlwZSA9PT0gXCJJZGVudGlmaWVyRXhwcmVzc2lvblwiXG4gICAgICAgICAgOiBsYXN0ID09IG51bGwgfHwgUGFyc2VyLmlzRGVzdHJ1Y3R1cmluZ0Fzc2lnbm1lbnRUYXJnZXRXaXRoRGVmYXVsdChsYXN0KTtcbiAgICAgIGNhc2UgXCJBcnJheUJpbmRpbmdcIjpcbiAgICAgIGNhc2UgXCJCaW5kaW5nSWRlbnRpZmllclwiOlxuICAgICAgY2FzZSBcIkJpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXJcIjpcbiAgICAgIGNhc2UgXCJCaW5kaW5nUHJvcGVydHlQcm9wZXJ0eVwiOlxuICAgICAgY2FzZSBcIkJpbmRpbmdXaXRoRGVmYXVsdFwiOlxuICAgICAgY2FzZSBcIklkZW50aWZpZXJFeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiT2JqZWN0QmluZGluZ1wiOlxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgc3RhdGljIGlzRGVzdHJ1Y3R1cmluZ0Fzc2lnbm1lbnRUYXJnZXRXaXRoRGVmYXVsdChub2RlKSB7XG4gICAgcmV0dXJuIFBhcnNlci5pc0Rlc3RydWN0dXJpbmdBc3NpZ25tZW50VGFyZ2V0KG5vZGUpIHx8XG4gICAgICBub2RlLnR5cGUgPT09IFwiQXNzaWdubWVudEV4cHJlc3Npb25cIiAmJiBub2RlLm9wZXJhdG9yID09PSBcIj1cIiAmJlxuICAgICAgUGFyc2VyLmlzRGVzdHJ1Y3R1cmluZ0Fzc2lnbm1lbnRUYXJnZXQobm9kZS5iaW5kaW5nKTtcbiAgfVxuXG4gIHN0YXRpYyBpc1ZhbGlkU2ltcGxlQXNzaWdubWVudFRhcmdldChub2RlKSB7XG4gICAgc3dpdGNoIChub2RlLnR5cGUpIHtcbiAgICAgIGNhc2UgXCJCaW5kaW5nSWRlbnRpZmllclwiOlxuICAgICAgY2FzZSBcIklkZW50aWZpZXJFeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiQ29tcHV0ZWRNZW1iZXJFeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiU3RhdGljTWVtYmVyRXhwcmVzc2lvblwiOlxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgc3RhdGljIGJvdW5kTmFtZXMobm9kZSkge1xuICAgIHN3aXRjaChub2RlLnR5cGUpIHtcbiAgICAgIGNhc2UgXCJCaW5kaW5nSWRlbnRpZmllclwiOlxuICAgICAgICByZXR1cm4gW25vZGUuaWRlbnRpZmllci5uYW1lXTtcbiAgICAgIGNhc2UgXCJCaW5kaW5nV2l0aERlZmF1bHRcIjpcbiAgICAgICAgcmV0dXJuIFBhcnNlci5ib3VuZE5hbWVzKG5vZGUuYmluZGluZyk7XG4gICAgICBjYXNlIFwiQXJyYXlCaW5kaW5nXCI6IHtcbiAgICAgICAgbGV0IG5hbWVzID0gW107XG4gICAgICAgIG5vZGUuZWxlbWVudHMuZmlsdGVyKGUgPT4gZSAhPSBudWxsKS5mb3JFYWNoKGUgPT4gW10ucHVzaC5hcHBseShuYW1lcywgUGFyc2VyLmJvdW5kTmFtZXMoZSkpKTtcbiAgICAgICAgaWYgKG5vZGUucmVzdEVsZW1lbnQgIT0gbnVsbCkge1xuICAgICAgICAgIG5hbWVzLnB1c2gobm9kZS5yZXN0RWxlbWVudC5pZGVudGlmaWVyLm5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuYW1lcztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJPYmplY3RCaW5kaW5nXCI6IHtcbiAgICAgICAgbGV0IG5hbWVzID0gW107XG4gICAgICAgIG5vZGUucHJvcGVydGllcy5mb3JFYWNoKHAgPT4ge1xuICAgICAgICAgIHN3aXRjaCAocC50eXBlKSB7XG4gICAgICAgICAgICBjYXNlIFwiQmluZGluZ1Byb3BlcnR5SWRlbnRpZmllclwiOlxuICAgICAgICAgICAgICBuYW1lcy5wdXNoKHAuaWRlbnRpZmllci5pZGVudGlmaWVyLm5hbWUpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJCaW5kaW5nUHJvcGVydHlQcm9wZXJ0eVwiOlxuICAgICAgICAgICAgICBbXS5wdXNoLmFwcGx5KG5hbWVzLCBQYXJzZXIuYm91bmROYW1lcyhwLmJpbmRpbmcpKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAvLyBpc3RhbmJ1bCBpZ25vcmUgbmV4dFxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiYm91bmROYW1lcyBjYWxsZWQgb24gT2JqZWN0QmluZGluZyB3aXRoIGludmFsaWQgcHJvcGVydHk6IFwiICsgcC50eXBlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gbmFtZXM7XG4gICAgICB9XG4gICAgICBjYXNlIFwiQ29tcHV0ZWRNZW1iZXJFeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiU3RhdGljTWVtYmVyRXhwcmVzc2lvblwiOlxuICAgICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIC8vIGlzdGFuYnVsIGlnbm9yZSBuZXh0XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiYm91bmROYW1lcyBjYWxsZWQgb24gaW52YWxpZCBhc3NpZ25tZW50IHRhcmdldDogXCIgKyBub2RlLnR5cGUpO1xuICB9XG5cbiAgcGFyc2VGb3JTdGF0ZW1lbnQoKSB7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkZPUik7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgbGV0IHRlc3QgPSBudWxsO1xuICAgIGxldCByaWdodCA9IG51bGw7XG4gICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLlNFTUlDT0xPTikpIHtcbiAgICAgIHRoaXMubGV4KCk7XG4gICAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlNFTUlDT0xPTikpIHtcbiAgICAgICAgdGVzdCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICB9XG4gICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuU0VNSUNPTE9OKTtcbiAgICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuUlBBUkVOKSkge1xuICAgICAgICByaWdodCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbmV3IFNoaWZ0LkZvclN0YXRlbWVudChcbiAgICAgICAgICBudWxsLFxuICAgICAgICAgIHRlc3QsXG4gICAgICAgICAgcmlnaHQsXG4gICAgICAgICAgdGhpcy5nZXRJdGVyYXRvclN0YXRlbWVudEVwaWxvZ3VlKClcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5WQVIpIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLkxFVCkpIHtcbiAgICAgICAgbGV0IHByZXZpb3VzQWxsb3dJbiA9IHRoaXMuYWxsb3dJbjtcbiAgICAgICAgdGhpcy5hbGxvd0luID0gZmFsc2U7XG4gICAgICAgIGxldCBpbml0RGVjbCA9IHRoaXMucGFyc2VWYXJpYWJsZURlY2xhcmF0aW9uKCk7XG4gICAgICAgIHRoaXMuYWxsb3dJbiA9IHByZXZpb3VzQWxsb3dJbjtcblxuICAgICAgICBpZiAoaW5pdERlY2wuZGVjbGFyYXRvcnMubGVuZ3RoID09PSAxICYmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5JTikgfHwgdGhpcy5tYXRjaChUb2tlblR5cGUuT0YpKSkge1xuICAgICAgICAgIGxldCB0eXBlID0gdGhpcy5tYXRjaChUb2tlblR5cGUuSU4pID9cbiAgICAgICAgICAgIFNoaWZ0LkZvckluU3RhdGVtZW50IDogU2hpZnQuRm9yT2ZTdGF0ZW1lbnQ7XG4gICAgICAgICAgaWYgKGluaXREZWNsLmRlY2xhcmF0b3JzWzBdLmluaXQgIT0gbnVsbCkge1xuICAgICAgICAgICAgdGhyb3cgdHlwZSA9PSBTaGlmdC5Gb3JJblN0YXRlbWVudCA/IFxuICAgICAgICAgICAgICB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuSU5WQUxJRF9WQVJfSU5JVF9GT1JfSU4pIDpcbiAgICAgICAgICAgICAgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLklOVkFMSURfVkFSX0lOSVRfRk9SX09GKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5sZXgoKTtcbiAgICAgICAgICByaWdodCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICAgICAgcmV0dXJuIG5ldyB0eXBlKGluaXREZWNsLCByaWdodCwgdGhpcy5nZXRJdGVyYXRvclN0YXRlbWVudEVwaWxvZ3VlKCkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5TRU1JQ09MT04pO1xuICAgICAgICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuU0VNSUNPTE9OKSkge1xuICAgICAgICAgICAgdGVzdCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5TRU1JQ09MT04pO1xuICAgICAgICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuUlBBUkVOKSkge1xuICAgICAgICAgICAgcmlnaHQgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gbmV3IFNoaWZ0LkZvclN0YXRlbWVudChpbml0RGVjbCwgdGVzdCwgcmlnaHQsIHRoaXMuZ2V0SXRlcmF0b3JTdGF0ZW1lbnRFcGlsb2d1ZSgpKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGV0IHByZXZpb3VzQWxsb3dJbiA9IHRoaXMuYWxsb3dJbjtcbiAgICAgICAgdGhpcy5hbGxvd0luID0gZmFsc2U7XG4gICAgICAgIGxldCBpbml0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgICAgdGhpcy5hbGxvd0luID0gcHJldmlvdXNBbGxvd0luO1xuXG4gICAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5JTikgfHwgdGhpcy5tYXRjaChUb2tlblR5cGUuT0YpKSB7XG4gICAgICAgICAgaWYgKCFQYXJzZXIuaXNWYWxpZFNpbXBsZUFzc2lnbm1lbnRUYXJnZXQoaW5pdCkpIHtcbiAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5JTlZBTElEX0xIU19JTl9GT1JfSU4pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGxldCB0eXBlID0gdGhpcy5tYXRjaChUb2tlblR5cGUuSU4pID9cbiAgICAgICAgICAgIFNoaWZ0LkZvckluU3RhdGVtZW50IDogU2hpZnQuRm9yT2ZTdGF0ZW1lbnQ7XG5cbiAgICAgICAgICB0aGlzLmxleCgpO1xuICAgICAgICAgIHJpZ2h0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcblxuICAgICAgICAgIHJldHVybiBuZXcgdHlwZShpbml0LCByaWdodCwgdGhpcy5nZXRJdGVyYXRvclN0YXRlbWVudEVwaWxvZ3VlKCkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5TRU1JQ09MT04pO1xuICAgICAgICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuU0VNSUNPTE9OKSkge1xuICAgICAgICAgICAgdGVzdCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5TRU1JQ09MT04pO1xuICAgICAgICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuUlBBUkVOKSkge1xuICAgICAgICAgICAgcmlnaHQgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gbmV3IFNoaWZ0LkZvclN0YXRlbWVudChpbml0LCB0ZXN0LCByaWdodCwgdGhpcy5nZXRJdGVyYXRvclN0YXRlbWVudEVwaWxvZ3VlKCkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZ2V0SXRlcmF0b3JTdGF0ZW1lbnRFcGlsb2d1ZSgpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcbiAgICBsZXQgb2xkSW5JdGVyYXRpb24gPSB0aGlzLmluSXRlcmF0aW9uO1xuICAgIHRoaXMuaW5JdGVyYXRpb24gPSB0cnVlO1xuICAgIGxldCBib2R5ID0gdGhpcy5wYXJzZVN0YXRlbWVudCgpO1xuICAgIHRoaXMuaW5JdGVyYXRpb24gPSBvbGRJbkl0ZXJhdGlvbjtcbiAgICByZXR1cm4gYm9keTtcbiAgfVxuXG4gIHBhcnNlSWZTdGF0ZW1lbnQoKSB7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLklGKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTFBBUkVOKTtcbiAgICBsZXQgdGVzdCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcbiAgICBsZXQgY29uc2VxdWVudCA9IHRoaXMucGFyc2VTdGF0ZW1lbnQoKTtcbiAgICBsZXQgYWx0ZXJuYXRlID0gbnVsbDtcbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuRUxTRSkpIHtcbiAgICAgIHRoaXMubGV4KCk7XG4gICAgICBhbHRlcm5hdGUgPSB0aGlzLnBhcnNlU3RhdGVtZW50KCk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgU2hpZnQuSWZTdGF0ZW1lbnQodGVzdCwgY29uc2VxdWVudCwgYWx0ZXJuYXRlKTtcbiAgfVxuXG4gIHBhcnNlUmV0dXJuU3RhdGVtZW50KCkge1xuICAgIGxldCBhcmd1bWVudCA9IG51bGw7XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUkVUVVJOKTtcbiAgICBpZiAoIXRoaXMuaW5GdW5jdGlvbkJvZHkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5JTExFR0FMX1JFVFVSTik7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0KSB7XG4gICAgICByZXR1cm4gbmV3IFNoaWZ0LlJldHVyblN0YXRlbWVudChudWxsKTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlNFTUlDT0xPTikpIHtcbiAgICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuUkJSQUNFKSAmJiAhdGhpcy5lb2YoKSkge1xuICAgICAgICBhcmd1bWVudCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5jb25zdW1lU2VtaWNvbG9uKCk7XG4gICAgcmV0dXJuIG5ldyBTaGlmdC5SZXR1cm5TdGF0ZW1lbnQoYXJndW1lbnQpO1xuICB9XG5cbiAgcGFyc2VXaXRoU3RhdGVtZW50KCkge1xuICAgIGlmICh0aGlzLnN0cmljdCkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlNUUklDVF9NT0RFX1dJVEgpO1xuICAgIH1cblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5XSVRIKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTFBBUkVOKTtcbiAgICBsZXQgb2JqZWN0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcbiAgICBsZXQgYm9keSA9IHRoaXMucGFyc2VTdGF0ZW1lbnQoKTtcblxuICAgIHJldHVybiBuZXcgU2hpZnQuV2l0aFN0YXRlbWVudChvYmplY3QsIGJvZHkpO1xuICB9XG5cbiAgcGFyc2VTd2l0Y2hTdGF0ZW1lbnQoKSB7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlNXSVRDSCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgbGV0IGRpc2NyaW1pbmFudCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJQQVJFTik7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxCUkFDRSk7XG5cbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuUkJSQUNFKSkge1xuICAgICAgdGhpcy5sZXgoKTtcbiAgICAgIHJldHVybiBuZXcgU2hpZnQuU3dpdGNoU3RhdGVtZW50KGRpc2NyaW1pbmFudCwgW10pO1xuICAgIH1cbiAgICBsZXQgb2xkSW5Td2l0Y2ggPSB0aGlzLmluU3dpdGNoO1xuICAgIHRoaXMuaW5Td2l0Y2ggPSB0cnVlO1xuXG4gICAgbGV0IGNhc2VzID0gdGhpcy5wYXJzZVN3aXRjaENhc2VzKCk7XG5cbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuREVGQVVMVCkpIHtcbiAgICAgIGxldCBzd2l0Y2hEZWZhdWx0ID0gdGhpcy5wYXJzZVN3aXRjaERlZmF1bHQoKTtcbiAgICAgIGxldCBwb3N0RGVmYXVsdENhc2VzID0gdGhpcy5wYXJzZVN3aXRjaENhc2VzKCk7XG4gICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuREVGQVVMVCkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLk1VTFRJUExFX0RFRkFVTFRTX0lOX1NXSVRDSCk7XG4gICAgICB9XG4gICAgICB0aGlzLmluU3dpdGNoID0gb2xkSW5Td2l0Y2g7XG4gICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUkJSQUNFKTtcbiAgICAgIHJldHVybiBuZXcgU2hpZnQuU3dpdGNoU3RhdGVtZW50V2l0aERlZmF1bHQoZGlzY3JpbWluYW50LCBjYXNlcywgc3dpdGNoRGVmYXVsdCwgcG9zdERlZmF1bHRDYXNlcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuaW5Td2l0Y2ggPSBvbGRJblN3aXRjaDtcbiAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SQlJBQ0UpO1xuICAgICAgcmV0dXJuIG5ldyBTaGlmdC5Td2l0Y2hTdGF0ZW1lbnQoZGlzY3JpbWluYW50LCBjYXNlcyk7XG4gICAgfVxuICB9XG5cbiAgcGFyc2VTd2l0Y2hDYXNlcygpIHtcbiAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgd2hpbGUgKCEodGhpcy5lb2YoKSB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0UpIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLkRFRkFVTFQpKSkge1xuICAgICAgcmVzdWx0LnB1c2godGhpcy5wYXJzZVN3aXRjaENhc2UoKSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBwYXJzZVN3aXRjaENhc2UoKSB7XG4gICAgbGV0IHN0YXJ0VG9rZW5JbmRleCA9IHRoaXMudG9rZW5JbmRleDtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuQ0FTRSk7XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5Td2l0Y2hDYXNlKHRoaXMucGFyc2VFeHByZXNzaW9uKCksIHRoaXMucGFyc2VTd2l0Y2hDYXNlQm9keSgpKSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgfVxuXG4gIHBhcnNlU3dpdGNoRGVmYXVsdCgpIHtcbiAgICBsZXQgc3RhcnRUb2tlbkluZGV4ID0gdGhpcy50b2tlbkluZGV4O1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5ERUZBVUxUKTtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlN3aXRjaERlZmF1bHQodGhpcy5wYXJzZVN3aXRjaENhc2VCb2R5KCkpLCBzdGFydFRva2VuSW5kZXgpO1xuICB9XG5cbiAgcGFyc2VTd2l0Y2hDYXNlQm9keSgpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuQ09MT04pO1xuICAgIHJldHVybiB0aGlzLnBhcnNlU3RhdGVtZW50TGlzdEluU3dpdGNoQ2FzZUJvZHkoKTtcbiAgfVxuXG4gIHBhcnNlU3RhdGVtZW50TGlzdEluU3dpdGNoQ2FzZUJvZHkoKSB7XG4gICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgIHdoaWxlICghKHRoaXMuZW9mKCkgfHwgdGhpcy5tYXRjaChUb2tlblR5cGUuUkJSQUNFKSB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5ERUZBVUxUKVxuICAgIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLkNBU0UpKSkge1xuICAgICAgcmVzdWx0LnB1c2godGhpcy5wYXJzZVN0YXRlbWVudCgpKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHBhcnNlVGhyb3dTdGF0ZW1lbnQoKSB7XG4gICAgbGV0IHRva2VuID0gdGhpcy5leHBlY3QoVG9rZW5UeXBlLlRIUk9XKTtcblxuICAgIGlmICh0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhUb2tlbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5ORVdMSU5FX0FGVEVSX1RIUk9XKTtcbiAgICB9XG5cbiAgICBsZXQgYXJndW1lbnQgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuXG4gICAgdGhpcy5jb25zdW1lU2VtaWNvbG9uKCk7XG5cbiAgICByZXR1cm4gbmV3IFNoaWZ0LlRocm93U3RhdGVtZW50KGFyZ3VtZW50KTtcbiAgfVxuXG4gIHBhcnNlVHJ5U3RhdGVtZW50KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5UUlkpO1xuICAgIGxldCBibG9jayA9IHRoaXMucGFyc2VCbG9jaygpO1xuXG4gICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkNBVENIKSkge1xuICAgICAgbGV0IGhhbmRsZXIgPSB0aGlzLnBhcnNlQ2F0Y2hDbGF1c2UoKTtcbiAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5GSU5BTExZKSkge1xuICAgICAgICB0aGlzLmxleCgpO1xuICAgICAgICBsZXQgZmluYWxpemVyID0gdGhpcy5wYXJzZUJsb2NrKCk7XG4gICAgICAgIHJldHVybiBuZXcgU2hpZnQuVHJ5RmluYWxseVN0YXRlbWVudChibG9jaywgaGFuZGxlciwgZmluYWxpemVyKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgU2hpZnQuVHJ5Q2F0Y2hTdGF0ZW1lbnQoYmxvY2ssIGhhbmRsZXIpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5GSU5BTExZKSkge1xuICAgICAgdGhpcy5sZXgoKTtcbiAgICAgIGxldCBmaW5hbGl6ZXIgPSB0aGlzLnBhcnNlQmxvY2soKTtcbiAgICAgIHJldHVybiBuZXcgU2hpZnQuVHJ5RmluYWxseVN0YXRlbWVudChibG9jaywgbnVsbCwgZmluYWxpemVyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLk5PX0NBVENIX09SX0ZJTkFMTFkpO1xuICAgIH1cbiAgfVxuXG4gIHBhcnNlVmFyaWFibGVEZWNsYXJhdGlvblN0YXRlbWVudCgpIHtcbiAgICBsZXQgZGVjbGFyYXRpb24gPSB0aGlzLnBhcnNlVmFyaWFibGVEZWNsYXJhdGlvbigpO1xuICAgIHRoaXMuY29uc3VtZVNlbWljb2xvbigpO1xuICAgIHJldHVybiBuZXcgU2hpZnQuVmFyaWFibGVEZWNsYXJhdGlvblN0YXRlbWVudChkZWNsYXJhdGlvbik7XG4gIH1cblxuICBwYXJzZVdoaWxlU3RhdGVtZW50KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5XSElMRSk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgcmV0dXJuIG5ldyBTaGlmdC5XaGlsZVN0YXRlbWVudCh0aGlzLnBhcnNlRXhwcmVzc2lvbigpLCB0aGlzLmdldEl0ZXJhdG9yU3RhdGVtZW50RXBpbG9ndWUoKSk7XG4gIH1cblxuICBwYXJzZUNhdGNoQ2xhdXNlKCkge1xuICAgIGxldCBzdGFydFRva2VuSW5kZXggPSB0aGlzLnRva2VuSW5kZXg7XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuQ0FUQ0gpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MUEFSRU4pO1xuICAgIGxldCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5SUEFSRU4pIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLkxQQVJFTikpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0b2tlbik7XG4gICAgfVxuXG4gICAgbGV0IHBhcmFtID0gdGhpcy5wYXJzZUxlZnRIYW5kU2lkZUV4cHJlc3Npb24oKTtcblxuICAgIGlmICghUGFyc2VyLmlzRGVzdHJ1Y3R1cmluZ0Fzc2lnbm1lbnRUYXJnZXQocGFyYW0pKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodG9rZW4pO1xuICAgIH1cbiAgICBwYXJhbSA9IFBhcnNlci50cmFuc2Zvcm1EZXN0cnVjdHVyaW5nQXNzaWdubWVudChwYXJhbSk7XG5cbiAgICBsZXQgYm91bmQgPSBQYXJzZXIuYm91bmROYW1lcyhwYXJhbSk7XG4gICAgaWYgKGZpcnN0RHVwbGljYXRlKGJvdW5kKSAhPSBudWxsKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aFRva2VuKHRva2VuLCBFcnJvck1lc3NhZ2VzLkRVUExJQ0FURV9CSU5ESU5HLCBmaXJzdER1cGxpY2F0ZShib3VuZCkpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnN0cmljdCAmJiBib3VuZC5zb21lKGlzUmVzdHJpY3RlZFdvcmQpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aFRva2VuKHRva2VuLCBFcnJvck1lc3NhZ2VzLlNUUklDVF9DQVRDSF9WQVJJQUJMRSk7XG4gICAgfVxuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJQQVJFTik7XG5cbiAgICBsZXQgYm9keSA9IHRoaXMucGFyc2VCbG9jaygpO1xuXG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5DYXRjaENsYXVzZShwYXJhbSwgYm9keSksIHN0YXJ0VG9rZW5JbmRleCk7XG4gIH1cblxuICBwYXJzZUJsb2NrKCkge1xuICAgIGxldCBzdGFydFRva2VuSW5kZXggPSB0aGlzLnRva2VuSW5kZXg7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxCUkFDRSk7XG5cbiAgICBsZXQgYm9keSA9IFtdO1xuICAgIHdoaWxlICghdGhpcy5tYXRjaChUb2tlblR5cGUuUkJSQUNFKSkge1xuICAgICAgYm9keS5wdXNoKHRoaXMucGFyc2VTdGF0ZW1lbnQoKSk7XG4gICAgfVxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SQlJBQ0UpO1xuXG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5CbG9jayhib2R5KSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgfVxuXG4gIHBhcnNlVmFyaWFibGVEZWNsYXJhdGlvbigpIHtcbiAgICBsZXQgc3RhcnRUb2tlbkluZGV4ID0gdGhpcy50b2tlbkluZGV4O1xuICAgIGxldCB0b2tlbiA9IHRoaXMubGV4KCk7XG5cbiAgICAvLyBQcmVjZWRlZCBieSB0aGlzLm1hdGNoKFRva2VuU3ViVHlwZS5WQVIpIHx8IHRoaXMubWF0Y2goVG9rZW5TdWJUeXBlLkxFVCk7XG4gICAgbGV0IGtpbmQgPSB0b2tlbi50eXBlID09IFRva2VuVHlwZS5WQVIgPyBcInZhclwiIDogdG9rZW4udHlwZSA9PT0gVG9rZW5UeXBlLkNPTlNUID8gXCJjb25zdFwiIDogXCJsZXRcIjtcbiAgICBsZXQgZGVjbGFyYXRvcnMgPSB0aGlzLnBhcnNlVmFyaWFibGVEZWNsYXJhdG9yTGlzdChraW5kKTtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlZhcmlhYmxlRGVjbGFyYXRpb24oa2luZCwgZGVjbGFyYXRvcnMpLCBzdGFydFRva2VuSW5kZXgpO1xuICB9XG5cbiAgcGFyc2VWYXJpYWJsZURlY2xhcmF0b3JMaXN0KGtpbmQpIHtcbiAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIHJlc3VsdC5wdXNoKHRoaXMucGFyc2VWYXJpYWJsZURlY2xhcmF0b3Ioa2luZCkpO1xuICAgICAgaWYgKCF0aGlzLmVhdChUb2tlblR5cGUuQ09NTUEpKSB7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcGFyc2VWYXJpYWJsZURlY2xhcmF0b3Ioa2luZCkge1xuICAgIGxldCBzdGFydFRva2VuSW5kZXggPSB0aGlzLnRva2VuSW5kZXg7XG4gICAgbGV0IHRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG5cbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuTFBBUkVOKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICB9XG4gICAgbGV0IGlkID0gdGhpcy5wYXJzZUxlZnRIYW5kU2lkZUV4cHJlc3Npb24oKTtcblxuICAgIGlmICghUGFyc2VyLmlzRGVzdHJ1Y3R1cmluZ0Fzc2lnbm1lbnRUYXJnZXQoaWQpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodG9rZW4pO1xuICAgIH1cbiAgICBpZCA9IFBhcnNlci50cmFuc2Zvcm1EZXN0cnVjdHVyaW5nQXNzaWdubWVudChpZCk7XG5cbiAgICBsZXQgYm91bmQgPSBQYXJzZXIuYm91bmROYW1lcyhpZCk7XG4gICAgaWYgKGZpcnN0RHVwbGljYXRlKGJvdW5kKSAhPSBudWxsKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aFRva2VuKHRva2VuLCBFcnJvck1lc3NhZ2VzLkRVUExJQ0FURV9CSU5ESU5HLCBmaXJzdER1cGxpY2F0ZShib3VuZCkpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnN0cmljdCAmJiBib3VuZC5zb21lKGlzUmVzdHJpY3RlZFdvcmQpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aFRva2VuKHRva2VuLCBFcnJvck1lc3NhZ2VzLlNUUklDVF9WQVJfTkFNRSk7XG4gICAgfVxuXG4gICAgbGV0IGluaXQgPSBudWxsO1xuICAgIGlmIChraW5kID09IFwiY29uc3RcIikge1xuICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkFTU0lHTik7XG4gICAgICBpbml0ID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgfSBlbHNlIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5BU1NJR04pKSB7XG4gICAgICB0aGlzLmxleCgpO1xuICAgICAgaW5pdCA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlZhcmlhYmxlRGVjbGFyYXRvcihpZCwgaW5pdCksIHN0YXJ0VG9rZW5JbmRleCk7XG4gIH1cblxuICBwYXJzZUV4cHJlc3Npb24oKSB7XG4gICAgbGV0IHN0YXJ0VG9rZW5JbmRleCA9IHRoaXMudG9rZW5JbmRleDtcblxuICAgIGxldCBleHByID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG5cbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuQ09NTUEpKSB7XG4gICAgICB3aGlsZSAoIXRoaXMuZW9mKCkpIHtcbiAgICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5DT01NQSkpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxleCgpO1xuICAgICAgICBleHByID0gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkJpbmFyeUV4cHJlc3Npb24oXCIsXCIsIGV4cHIsIHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpKSxcbiAgICAgICAgICAgIHN0YXJ0VG9rZW5JbmRleCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBleHByO1xuICB9XG5cbiAgcGFyc2VBcnJvd0V4cHJlc3Npb25UYWlsKGhlYWQsIHN0YXJ0VG9rZW5JbmRleCkge1xuICAgIGxldCBhcnJvdyA9IHRoaXMuZXhwZWN0KFRva2VuVHlwZS5BUlJPVyk7XG5cbiAgICAvLyBDb252ZXJ0IHBhcmFtIGxpc3QuXG4gICAgbGV0IHtwYXJhbXMgPSBudWxsLCByZXN0ID0gbnVsbCwgZHVwID0gbnVsbCwgc3RyaWN0X3Jlc2VydmVkX3dvcmQgPSBmYWxzZSwgc3RyaWN0X3Jlc3RyaWN0ZWRfd29yZCA9IGZhbHNlfSA9IGhlYWQ7XG4gICAgaWYgKGhlYWQudHlwZSAhPT0gQVJST1dfRVhQUkVTU0lPTl9QQVJBTVMpIHtcbiAgICAgIGlmIChoZWFkLnR5cGUgPT09IFwiSWRlbnRpZmllckV4cHJlc3Npb25cIikge1xuICAgICAgICBsZXQgbmFtZSA9IGhlYWQuaWRlbnRpZmllci5uYW1lO1xuICAgICAgICBpZiAoU1RSSUNUX01PREVfUkVTRVJWRURfV09SRC5oYXNPd25Qcm9wZXJ0eShuYW1lKSkge1xuICAgICAgICAgIHN0cmljdF9yZXNlcnZlZF93b3JkID0gdHJ1ZTtcbiAgICAgICAgICBpZiAodGhpcy5zdHJpY3QpIHtcbiAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUkVTRVJWRURfV09SRCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChpc1Jlc3RyaWN0ZWRXb3JkKG5hbWUpKSB7XG4gICAgICAgICAgc3RyaWN0X3Jlc3RyaWN0ZWRfd29yZCA9IHRydWU7XG4gICAgICAgICAgaWYgKHRoaXMuc3RyaWN0KSB7XG4gICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX1BBUkFNX05BTUUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBoZWFkID0gUGFyc2VyLnRyYW5zZm9ybURlc3RydWN0dXJpbmdBc3NpZ25tZW50KGhlYWQpO1xuICAgICAgICBwYXJhbXMgPSBbaGVhZF07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQoYXJyb3cpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuTEJSQUNFKSkge1xuICAgICAgbGV0IFtib2R5LCBpc1N0cmljdF0gPSB0aGlzLnBhcnNlQm9keSgpO1xuICAgICAgaWYgKGlzU3RyaWN0KSB7XG4gICAgICAgIGlmIChkdXApIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX1BBUkFNX0RVUEUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdHJpY3RfcmVzZXJ2ZWRfd29yZCkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUkVTRVJWRURfV09SRCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0cmljdF9yZXN0cmljdGVkX3dvcmQpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX1BBUkFNX05BTUUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUkJSQUNFKTtcbiAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQXJyb3dFeHByZXNzaW9uKHBhcmFtcywgcmVzdCwgYm9keSksIHN0YXJ0VG9rZW5JbmRleCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBib2R5ID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkFycm93RXhwcmVzc2lvbihwYXJhbXMsIHJlc3QsIGJvZHkpLCBzdGFydFRva2VuSW5kZXgpO1xuICAgIH1cbiAgfVxuXG4gIHBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKSB7XG4gICAgbGV0IHRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgbGV0IHN0YXJ0VG9rZW5JbmRleCA9IHRoaXMudG9rZW5JbmRleDtcblxuICAgIGxldCBub2RlID0gdGhpcy5wYXJzZUNvbmRpdGlvbmFsRXhwcmVzc2lvbigpO1xuXG4gICAgaWYgKCF0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCAmJiB0aGlzLm1hdGNoKFRva2VuVHlwZS5BUlJPVykpIHtcbiAgICAgIHJldHVybiB0aGlzLnBhcnNlQXJyb3dFeHByZXNzaW9uVGFpbChub2RlLCBzdGFydFRva2VuSW5kZXgpXG4gICAgfVxuXG4gICAgbGV0IGlzT3BlcmF0b3IgPSBmYWxzZTtcbiAgICBsZXQgb3BlcmF0b3IgPSB0aGlzLmxvb2thaGVhZDtcbiAgICBzd2l0Y2ggKG9wZXJhdG9yLnR5cGUpIHtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9CSVRfT1I6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fQklUX1hPUjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9CSVRfQU5EOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX1NITDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9TSFI6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fU0hSX1VOU0lHTkVEOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX0FERDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9TVUI6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fTVVMOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX0RJVjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9NT0Q6XG4gICAgICAgIGlzT3BlcmF0b3IgPSB0cnVlO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICBpZiAoaXNPcGVyYXRvcikge1xuICAgICAgaWYgKCFQYXJzZXIuaXNEZXN0cnVjdHVyaW5nQXNzaWdubWVudFRhcmdldChub2RlKSAmJiBub2RlLnR5cGUgIT09IFwiQ29tcHV0ZWRNZW1iZXJFeHByZXNzaW9uXCIgJiYgbm9kZS50eXBlICE9PSBcIlN0YXRpY01lbWJlckV4cHJlc3Npb25cIikge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuSU5WQUxJRF9MSFNfSU5fQVNTSUdOTUVOVCk7XG4gICAgICB9XG4gICAgICBub2RlID0gUGFyc2VyLnRyYW5zZm9ybURlc3RydWN0dXJpbmdBc3NpZ25tZW50KG5vZGUpO1xuXG4gICAgICBsZXQgYm91bmQgPSBQYXJzZXIuYm91bmROYW1lcyhub2RlKTtcbiAgICAgIGlmIChmaXJzdER1cGxpY2F0ZShib3VuZCkgIT0gbnVsbCkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aFRva2VuKHRva2VuLCBFcnJvck1lc3NhZ2VzLkRVUExJQ0FURV9CSU5ESU5HLCBmaXJzdER1cGxpY2F0ZShib3VuZCkpO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5zdHJpY3QgJiYgYm91bmQuc29tZShpc1Jlc3RyaWN0ZWRXb3JkKSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aFRva2VuKHRva2VuLCBFcnJvck1lc3NhZ2VzLlNUUklDVF9MSFNfQVNTSUdOTUVOVCk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMubGV4KCk7XG4gICAgICBsZXQgcmlnaHQgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQXNzaWdubWVudEV4cHJlc3Npb24ob3BlcmF0b3IudHlwZS5uYW1lLCBub2RlLCByaWdodCksIHN0YXJ0VG9rZW5JbmRleCk7XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgbm9kZS50eXBlID09PSBcIk9iamVjdEV4cHJlc3Npb25cIiAmJlxuICAgICAgbm9kZS5wcm9wZXJ0aWVzLnNvbWUocCA9PiBwLnR5cGUgPT09IFwiQmluZGluZ1Byb3BlcnR5SWRlbnRpZmllclwiKVxuICAgICkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKG9wZXJhdG9yKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbm9kZTtcbiAgfVxuXG4gIHBhcnNlQ29uZGl0aW9uYWxFeHByZXNzaW9uKCkge1xuICAgIGxldCBzdGFydFRva2VuSW5kZXggPSB0aGlzLnRva2VuSW5kZXg7XG4gICAgbGV0IGV4cHIgPSB0aGlzLnBhcnNlQmluYXJ5RXhwcmVzc2lvbigpO1xuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5DT05ESVRJT05BTCkpIHtcbiAgICAgIHRoaXMubGV4KCk7XG4gICAgICBsZXQgcHJldmlvdXNBbGxvd0luID0gdGhpcy5hbGxvd0luO1xuICAgICAgdGhpcy5hbGxvd0luID0gdHJ1ZTtcbiAgICAgIGxldCBjb25zZXF1ZW50ID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgICB0aGlzLmFsbG93SW4gPSBwcmV2aW91c0FsbG93SW47XG4gICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuQ09MT04pO1xuICAgICAgbGV0IGFsdGVybmF0ZSA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5Db25kaXRpb25hbEV4cHJlc3Npb24oZXhwciwgY29uc2VxdWVudCwgYWx0ZXJuYXRlKSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgICB9XG5cbiAgICByZXR1cm4gZXhwcjtcbiAgfVxuXG4gIGlzQmluYXJ5T3BlcmF0b3IodHlwZSkge1xuICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgY2FzZSBUb2tlblR5cGUuT1I6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BTkQ6XG4gICAgICBjYXNlIFRva2VuVHlwZS5CSVRfT1I6XG4gICAgICBjYXNlIFRva2VuVHlwZS5CSVRfWE9SOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQklUX0FORDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkVROlxuICAgICAgY2FzZSBUb2tlblR5cGUuTkU6XG4gICAgICBjYXNlIFRva2VuVHlwZS5FUV9TVFJJQ1Q6XG4gICAgICBjYXNlIFRva2VuVHlwZS5ORV9TVFJJQ1Q6XG4gICAgICBjYXNlIFRva2VuVHlwZS5MVDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkdUOlxuICAgICAgY2FzZSBUb2tlblR5cGUuTFRFOlxuICAgICAgY2FzZSBUb2tlblR5cGUuR1RFOlxuICAgICAgY2FzZSBUb2tlblR5cGUuSU5TVEFOQ0VPRjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlNITDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlNIUjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlNIUl9VTlNJR05FRDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFERDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlNVQjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk1VTDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkRJVjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk1PRDpcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICBjYXNlIFRva2VuVHlwZS5JTjpcbiAgICAgICAgcmV0dXJuIHRoaXMuYWxsb3dJbjtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBwYXJzZUJpbmFyeUV4cHJlc3Npb24oKSB7XG4gICAgbGV0IGxlZnQgPSB0aGlzLnBhcnNlVW5hcnlFeHByZXNzaW9uKCk7XG4gICAgbGV0IG9wZXJhdG9yID0gdGhpcy5sb29rYWhlYWQudHlwZTtcblxuICAgIGxldCBpc0JpbmFyeU9wZXJhdG9yID0gdGhpcy5pc0JpbmFyeU9wZXJhdG9yKG9wZXJhdG9yKTtcbiAgICBpZiAoIWlzQmluYXJ5T3BlcmF0b3IpIHtcbiAgICAgIHJldHVybiBsZWZ0O1xuICAgIH1cblxuICAgIHRoaXMubGV4KCk7XG4gICAgbGV0IHN0YWNrID0gW107XG4gICAgc3RhY2sucHVzaCh7c3RhcnRJbmRleDogdGhpcy50b2tlbkluZGV4LCBsZWZ0LCBvcGVyYXRvciwgcHJlY2VkZW5jZTogQmluYXJ5UHJlY2VkZW5jZVtvcGVyYXRvci5uYW1lXX0pO1xuICAgIGxldCByaWdodCA9IHRoaXMucGFyc2VVbmFyeUV4cHJlc3Npb24oKTtcblxuICAgIG9wZXJhdG9yID0gdGhpcy5sb29rYWhlYWQudHlwZTtcbiAgICBpc0JpbmFyeU9wZXJhdG9yID0gdGhpcy5pc0JpbmFyeU9wZXJhdG9yKHRoaXMubG9va2FoZWFkLnR5cGUpO1xuICAgIHdoaWxlIChpc0JpbmFyeU9wZXJhdG9yKSB7XG4gICAgICBsZXQgcHJlY2VkZW5jZSA9IEJpbmFyeVByZWNlZGVuY2Vbb3BlcmF0b3IubmFtZV07XG4gICAgICAvLyBSZWR1Y2U6IG1ha2UgYSBiaW5hcnkgZXhwcmVzc2lvbiBmcm9tIHRoZSB0aHJlZSB0b3Btb3N0IGVudHJpZXMuXG4gICAgICB3aGlsZSAoc3RhY2subGVuZ3RoICYmIChwcmVjZWRlbmNlIDw9IHN0YWNrW3N0YWNrLmxlbmd0aCAtIDFdLnByZWNlZGVuY2UpKSB7XG4gICAgICAgIGxldCBzdGFja0l0ZW0gPSBzdGFja1tzdGFjay5sZW5ndGggLSAxXTtcbiAgICAgICAgbGV0IHN0YWNrT3BlcmF0b3IgPSBzdGFja0l0ZW0ub3BlcmF0b3I7XG4gICAgICAgIGxlZnQgPSBzdGFja0l0ZW0ubGVmdDtcbiAgICAgICAgc3RhY2sucG9wKCk7XG4gICAgICAgIHJpZ2h0ID0gdGhpcy5tYXJrTG9jYXRpb24oXG4gICAgICAgICAgICBuZXcgU2hpZnQuQmluYXJ5RXhwcmVzc2lvbihzdGFja09wZXJhdG9yLm5hbWUsIGxlZnQsIHJpZ2h0KSxcbiAgICAgICAgICAgIHN0YWNrSXRlbS5zdGFydEluZGV4LFxuICAgICAgICAgICAgdGhpcy50b2tlbkluZGV4KTtcbiAgICAgIH1cblxuICAgICAgLy8gU2hpZnQuXG4gICAgICB0aGlzLmxleCgpO1xuICAgICAgc3RhY2sucHVzaCh7c3RhcnRJbmRleDogdGhpcy50b2tlbkluZGV4LCBsZWZ0OiByaWdodCwgb3BlcmF0b3IsIHByZWNlZGVuY2V9KTtcbiAgICAgIHJpZ2h0ID0gdGhpcy5wYXJzZVVuYXJ5RXhwcmVzc2lvbigpO1xuXG4gICAgICBvcGVyYXRvciA9IHRoaXMubG9va2FoZWFkLnR5cGU7XG4gICAgICBpc0JpbmFyeU9wZXJhdG9yID0gdGhpcy5pc0JpbmFyeU9wZXJhdG9yKG9wZXJhdG9yKTtcbiAgICB9XG5cbiAgICAvLyBGaW5hbCByZWR1Y2UgdG8gY2xlYW4tdXAgdGhlIHN0YWNrLlxuICAgIHJldHVybiBzdGFjay5yZWR1Y2VSaWdodChcbiAgICAgICAgKGV4cHIsIHN0YWNrSXRlbSkgPT4gdGhpcy5tYXJrTG9jYXRpb24oXG4gICAgICAgICAgICBuZXcgU2hpZnQuQmluYXJ5RXhwcmVzc2lvbihzdGFja0l0ZW0ub3BlcmF0b3IubmFtZSwgc3RhY2tJdGVtLmxlZnQsIGV4cHIpLFxuICAgICAgICAgICAgc3RhY2tJdGVtLnN0YXJ0SW5kZXgsXG4gICAgICAgICAgICB0aGlzLnRva2VuSW5kZXgpLFxuICAgICAgICByaWdodCk7XG4gIH1cblxuICBzdGF0aWMgaXNQcmVmaXhPcGVyYXRvcih0eXBlKSB7XG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICBjYXNlIFRva2VuVHlwZS5JTkM6XG4gICAgICBjYXNlIFRva2VuVHlwZS5ERUM6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BREQ6XG4gICAgICBjYXNlIFRva2VuVHlwZS5TVUI6XG4gICAgICBjYXNlIFRva2VuVHlwZS5CSVRfTk9UOlxuICAgICAgY2FzZSBUb2tlblR5cGUuTk9UOlxuICAgICAgY2FzZSBUb2tlblR5cGUuREVMRVRFOlxuICAgICAgY2FzZSBUb2tlblR5cGUuVk9JRDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlRZUEVPRjpcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHBhcnNlVW5hcnlFeHByZXNzaW9uKCkge1xuICAgIGlmICh0aGlzLmxvb2thaGVhZC50eXBlLmtsYXNzICE9IFRva2VuQ2xhc3MuUHVuY3R1YXRvciAmJiB0aGlzLmxvb2thaGVhZC50eXBlLmtsYXNzICE9IFRva2VuQ2xhc3MuS2V5d29yZCkge1xuICAgICAgcmV0dXJuIHRoaXMucGFyc2VQb3N0Zml4RXhwcmVzc2lvbigpO1xuICAgIH1cbiAgICBsZXQgc3RhcnRUb2tlbkluZGV4ID0gdGhpcy50b2tlbkluZGV4O1xuICAgIGxldCBvcGVyYXRvciA9IHRoaXMubG9va2FoZWFkO1xuICAgIGlmICghUGFyc2VyLmlzUHJlZml4T3BlcmF0b3Iob3BlcmF0b3IudHlwZSkpIHtcbiAgICAgIHJldHVybiB0aGlzLnBhcnNlUG9zdGZpeEV4cHJlc3Npb24oKTtcbiAgICB9XG4gICAgdGhpcy5sZXgoKTtcbiAgICBsZXQgZXhwciA9IHRoaXMucGFyc2VVbmFyeUV4cHJlc3Npb24oKTtcbiAgICBzd2l0Y2ggKG9wZXJhdG9yLnR5cGUpIHtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLklOQzpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkRFQzpcbiAgICAgICAgLy8gMTEuNC40LCAxMS40LjU7XG4gICAgICAgIGlmIChleHByLnR5cGUgPT09IFwiSWRlbnRpZmllckV4cHJlc3Npb25cIikge1xuICAgICAgICAgIGlmICh0aGlzLnN0cmljdCAmJiBpc1Jlc3RyaWN0ZWRXb3JkKGV4cHIuaWRlbnRpZmllci5uYW1lKSkge1xuICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlNUUklDVF9MSFNfUFJFRklYKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIVBhcnNlci5pc1ZhbGlkU2ltcGxlQXNzaWdubWVudFRhcmdldChleHByKSkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5JTlZBTElEX0xIU19JTl9BU1NJR05NRU5UKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkRFTEVURTpcbiAgICAgICAgaWYgKGV4cHIudHlwZSA9PT0gXCJJZGVudGlmaWVyRXhwcmVzc2lvblwiICYmIHRoaXMuc3RyaWN0KSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlNUUklDVF9ERUxFVEUpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5QcmVmaXhFeHByZXNzaW9uKG9wZXJhdG9yLnZhbHVlLCBleHByKSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgfVxuXG4gIHBhcnNlUG9zdGZpeEV4cHJlc3Npb24oKSB7XG4gICAgbGV0IHN0YXJ0VG9rZW5JbmRleCA9IHRoaXMudG9rZW5JbmRleDtcblxuICAgIGxldCBleHByID0gdGhpcy5wYXJzZUxlZnRIYW5kU2lkZUV4cHJlc3Npb25BbGxvd0NhbGwoKTtcblxuICAgIGlmICh0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCkge1xuICAgICAgcmV0dXJuIGV4cHI7XG4gICAgfVxuXG4gICAgbGV0IG9wZXJhdG9yID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgaWYgKChvcGVyYXRvci50eXBlICE9PSBUb2tlblR5cGUuSU5DKSAmJiAob3BlcmF0b3IudHlwZSAhPT0gVG9rZW5UeXBlLkRFQykpIHtcbiAgICAgIHJldHVybiBleHByO1xuICAgIH1cbiAgICB0aGlzLmxleCgpO1xuICAgIC8vIDExLjMuMSwgMTEuMy4yO1xuICAgIGlmIChleHByLnR5cGUgPT09IFwiSWRlbnRpZmllckV4cHJlc3Npb25cIikge1xuICAgICAgaWYgKHRoaXMuc3RyaWN0ICYmIGlzUmVzdHJpY3RlZFdvcmQoZXhwci5pZGVudGlmaWVyLm5hbWUpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5TVFJJQ1RfTEhTX1BPU1RGSVgpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIVBhcnNlci5pc1ZhbGlkU2ltcGxlQXNzaWdubWVudFRhcmdldChleHByKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLklOVkFMSURfTEhTX0lOX0FTU0lHTk1FTlQpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlBvc3RmaXhFeHByZXNzaW9uKGV4cHIsIG9wZXJhdG9yLnZhbHVlKSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgfVxuXG4gIHBhcnNlTGVmdEhhbmRTaWRlRXhwcmVzc2lvbkFsbG93Q2FsbCgpIHtcbiAgICBsZXQgc3RhcnRUb2tlbkluZGV4ID0gdGhpcy50b2tlbkluZGV4O1xuICAgIGxldCBwcmV2aW91c0FsbG93SW4gPSB0aGlzLmFsbG93SW47XG4gICAgdGhpcy5hbGxvd0luID0gdHJ1ZTtcbiAgICBsZXQgZXhwciA9IHRoaXMubWF0Y2goVG9rZW5UeXBlLk5FVykgPyB0aGlzLnBhcnNlTmV3RXhwcmVzc2lvbigpIDogdGhpcy5wYXJzZVByaW1hcnlFeHByZXNzaW9uKCk7XG5cbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkxQQVJFTikpIHtcbiAgICAgICAgZXhwciA9IHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5DYWxsRXhwcmVzc2lvbihleHByLCB0aGlzLnBhcnNlQXJndW1lbnRMaXN0KCkpLCBzdGFydFRva2VuSW5kZXgpO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5MQlJBQ0spKSB7XG4gICAgICAgIGV4cHIgPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQ29tcHV0ZWRNZW1iZXJFeHByZXNzaW9uKGV4cHIsIHRoaXMucGFyc2VDb21wdXRlZE1lbWJlcigpKSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuUEVSSU9EKSkge1xuICAgICAgICBleHByID0gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlN0YXRpY01lbWJlckV4cHJlc3Npb24oZXhwciwgdGhpcy5wYXJzZU5vbkNvbXB1dGVkTWVtYmVyKCkpLCBzdGFydFRva2VuSW5kZXgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5hbGxvd0luID0gcHJldmlvdXNBbGxvd0luO1xuXG4gICAgcmV0dXJuIGV4cHI7XG4gIH1cblxuICBwYXJzZUxlZnRIYW5kU2lkZUV4cHJlc3Npb24oKSB7XG4gICAgbGV0IHN0YXJ0VG9rZW5JbmRleCA9IHRoaXMudG9rZW5JbmRleDtcblxuICAgIGxldCBleHByID0gdGhpcy5tYXRjaChUb2tlblR5cGUuTkVXKSA/IHRoaXMucGFyc2VOZXdFeHByZXNzaW9uKCkgOiB0aGlzLnBhcnNlUHJpbWFyeUV4cHJlc3Npb24oKTtcblxuICAgIHdoaWxlICh0aGlzLm1hdGNoKFRva2VuVHlwZS5QRVJJT0QpIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLkxCUkFDSykpIHtcbiAgICAgIGV4cHIgPSB0aGlzLm1hcmtMb2NhdGlvbihcbiAgICAgICAgICB0aGlzLm1hdGNoKFRva2VuVHlwZS5MQlJBQ0spID9cbiAgICAgICAgICAgICAgbmV3IFNoaWZ0LkNvbXB1dGVkTWVtYmVyRXhwcmVzc2lvbihleHByLCB0aGlzLnBhcnNlQ29tcHV0ZWRNZW1iZXIoKSkgOlxuICAgICAgICAgICAgICBuZXcgU2hpZnQuU3RhdGljTWVtYmVyRXhwcmVzc2lvbihleHByLCB0aGlzLnBhcnNlTm9uQ29tcHV0ZWRNZW1iZXIoKSksIHN0YXJ0VG9rZW5JbmRleCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGV4cHI7XG4gIH1cblxuICBwYXJzZU5vbkNvbXB1dGVkTWVtYmVyKCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5QRVJJT0QpO1xuICAgIHJldHVybiB0aGlzLnBhcnNlTm9uQ29tcHV0ZWRQcm9wZXJ0eSgpO1xuICB9XG5cbiAgcGFyc2VDb21wdXRlZE1lbWJlcigpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTEJSQUNLKTtcbiAgICBsZXQgZXhwciA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJCUkFDSyk7XG4gICAgcmV0dXJuIGV4cHI7XG4gIH1cblxuICBwYXJzZU5ld0V4cHJlc3Npb24oKSB7XG4gICAgbGV0IHN0YXJ0VG9rZW5JbmRleCA9IHRoaXMudG9rZW5JbmRleDtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTkVXKTtcbiAgICBsZXQgY2FsbGVlID0gdGhpcy5wYXJzZUxlZnRIYW5kU2lkZUV4cHJlc3Npb24oKTtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0Lk5ld0V4cHJlc3Npb24oY2FsbGVlLCB0aGlzLm1hdGNoKFRva2VuVHlwZS5MUEFSRU4pID8gdGhpcy5wYXJzZUFyZ3VtZW50TGlzdCgpIDpcbiAgICAgICAgW10pLCBzdGFydFRva2VuSW5kZXgpO1xuICB9XG5cbiAgcGFyc2VQcmltYXJ5RXhwcmVzc2lvbigpIHtcbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuTFBBUkVOKSkge1xuICAgICAgcmV0dXJuIHRoaXMucGFyc2VHcm91cEV4cHJlc3Npb24oKTtcbiAgICB9XG5cbiAgICBsZXQgc3RhcnRUb2tlbkluZGV4ID0gdGhpcy50b2tlbkluZGV4O1xuXG4gICAgc3dpdGNoICh0aGlzLmxvb2thaGVhZC50eXBlLmtsYXNzKSB7XG4gICAgICBjYXNlIFRva2VuQ2xhc3MuSWRlbnQ6XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuSWRlbnRpZmllckV4cHJlc3Npb24odGhpcy5wYXJzZUlkZW50aWZpZXIoKSksIHN0YXJ0VG9rZW5JbmRleCk7XG4gICAgICBjYXNlIFRva2VuQ2xhc3MuU3RyaW5nTGl0ZXJhbDpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VTdHJpbmdMaXRlcmFsKCk7XG4gICAgICBjYXNlIFRva2VuQ2xhc3MuTnVtZXJpY0xpdGVyYWw6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlTnVtZXJpY0xpdGVyYWwoKTtcbiAgICAgIGNhc2UgVG9rZW5DbGFzcy5LZXl3b3JkOlxuICAgICAge1xuICAgICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuVEhJUykpIHtcbiAgICAgICAgICB0aGlzLmxleCgpO1xuICAgICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuVGhpc0V4cHJlc3Npb24sIHN0YXJ0VG9rZW5JbmRleCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkZVTkNUSU9OKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih0aGlzLnBhcnNlRnVuY3Rpb24odHJ1ZSksIHN0YXJ0VG9rZW5JbmRleCk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIFRva2VuQ2xhc3MuQm9vbGVhbkxpdGVyYWw6XG4gICAgICB7XG4gICAgICAgIGxldCB0b2tlbiA9IHRoaXMubGV4KCk7XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuTGl0ZXJhbEJvb2xlYW5FeHByZXNzaW9uKHRva2VuLnR5cGUgPT0gVG9rZW5UeXBlLlRSVUVfTElURVJBTCksIHN0YXJ0VG9rZW5JbmRleCk7XG4gICAgICB9XG4gICAgICBjYXNlIFRva2VuQ2xhc3MuTnVsbExpdGVyYWw6XG4gICAgICB7XG4gICAgICAgIHRoaXMubGV4KCk7XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuTGl0ZXJhbE51bGxFeHByZXNzaW9uLCBzdGFydFRva2VuSW5kZXgpO1xuICAgICAgfVxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkxCUkFDSykpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5wYXJzZUFycmF5RXhwcmVzc2lvbigpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkxCUkFDRSkpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5wYXJzZU9iamVjdEV4cHJlc3Npb24oKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5ESVYpIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLkFTU0lHTl9ESVYpKSB7XG4gICAgICAgICAgdGhpcy5za2lwQ29tbWVudCgpO1xuICAgICAgICAgIHRoaXMubG9va2FoZWFkID0gdGhpcy5zY2FuUmVnRXhwKCk7XG4gICAgICAgICAgbGV0IHRva2VuID0gdGhpcy5sZXgoKTtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgbGV0IGxhc3RTbGFzaCA9IHRva2VuLnZhbHVlLmxhc3RJbmRleE9mKFwiL1wiKTtcbiAgICAgICAgICAgIFJlZ0V4cCh0b2tlbi52YWx1ZS5zbGljZSgxLCBsYXN0U2xhc2gpLCB0b2tlbi52YWx1ZS5zbGljZShsYXN0U2xhc2ggKyAxKSk7XG4gICAgICAgICAgfSBjYXRjaCAodW51c2VkKSB7XG4gICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aFRva2VuKHRva2VuLCBFcnJvck1lc3NhZ2VzLklOVkFMSURfUkVHVUxBUl9FWFBSRVNTSU9OKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5MaXRlcmFsUmVnRXhwRXhwcmVzc2lvbih0b2tlbi52YWx1ZSksIHN0YXJ0VG9rZW5JbmRleCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sZXgoKSk7XG4gIH1cblxuICBwYXJzZU51bWVyaWNMaXRlcmFsKCkge1xuICAgIGxldCBzdGFydFRva2VuSW5kZXggPSB0aGlzLnRva2VuSW5kZXg7XG4gICAgaWYgKHRoaXMuc3RyaWN0ICYmIHRoaXMubG9va2FoZWFkLm9jdGFsKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aFRva2VuKHRoaXMubG9va2FoZWFkLCBFcnJvck1lc3NhZ2VzLlNUUklDVF9PQ1RBTF9MSVRFUkFMKTtcbiAgICB9XG4gICAgbGV0IHRva2VuMiA9IHRoaXMubGV4KCk7XG4gICAgbGV0IG5vZGUgPSB0b2tlbjIuX3ZhbHVlID09PSAxLzBcbiAgICAgID8gbmV3IFNoaWZ0LkxpdGVyYWxJbmZpbml0eUV4cHJlc3Npb25cbiAgICAgIDogbmV3IFNoaWZ0LkxpdGVyYWxOdW1lcmljRXhwcmVzc2lvbih0b2tlbjIuX3ZhbHVlKTtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obm9kZSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgfVxuXG4gIHBhcnNlU3RyaW5nTGl0ZXJhbCgpIHtcbiAgICBsZXQgc3RhcnRUb2tlbkluZGV4ID0gdGhpcy50b2tlbkluZGV4O1xuICAgIGlmICh0aGlzLnN0cmljdCAmJiB0aGlzLmxvb2thaGVhZC5vY3RhbCkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhUb2tlbih0aGlzLmxvb2thaGVhZCwgRXJyb3JNZXNzYWdlcy5TVFJJQ1RfT0NUQUxfTElURVJBTCk7XG4gICAgfVxuICAgIGxldCB0b2tlbjIgPSB0aGlzLmxleCgpO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuTGl0ZXJhbFN0cmluZ0V4cHJlc3Npb24odG9rZW4yLl92YWx1ZSwgdG9rZW4yLnNsaWNlLnRleHQpLFxuICAgICAgICBzdGFydFRva2VuSW5kZXgpO1xuICB9XG5cbiAgcGFyc2VJZGVudGlmaWVyKCkge1xuICAgIGxldCBzdGFydFRva2VuSW5kZXggPSB0aGlzLnRva2VuSW5kZXg7XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5JZGVudGlmaWVyKHRoaXMubGV4KCkudmFsdWUpLCBzdGFydFRva2VuSW5kZXgpO1xuICB9XG5cbiAgcGFyc2VBcmd1bWVudExpc3QoKSB7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgbGV0IGFyZ3MgPSB0aGlzLnBhcnNlQXJndW1lbnRzKCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJQQVJFTik7XG4gICAgcmV0dXJuIGFyZ3M7XG4gIH1cblxuICBwYXJzZUFyZ3VtZW50cygpIHtcbiAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5SUEFSRU4pIHx8IHRoaXMuZW9mKCkpIHtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH1cbiAgICAgIGxldCBzdGFydFRva2VuSW5kZXggPSB0aGlzLnRva2VuSW5kZXg7XG4gICAgICBsZXQgYXJnO1xuICAgICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5FTExJUFNJUykpIHtcbiAgICAgICAgYXJnID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgICAgIGFyZyA9IHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5TcHJlYWRFbGVtZW50KGFyZyksIHN0YXJ0VG9rZW5JbmRleCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhcmcgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgIH1cbiAgICAgIHJlc3VsdC5wdXNoKGFyZyk7XG4gICAgICBpZiAoIXRoaXMuZWF0KFRva2VuVHlwZS5DT01NQSkpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvLyAxMS4yIExlZnQtSGFuZC1TaWRlIEV4cHJlc3Npb25zO1xuXG4gIHBhcnNlTm9uQ29tcHV0ZWRQcm9wZXJ0eSgpIHtcbiAgICBsZXQgc3RhcnRUb2tlbkluZGV4ID0gdGhpcy50b2tlbkluZGV4O1xuXG4gICAgbGV0IHRva2VuID0gdGhpcy5sZXgoKTtcblxuICAgIGlmICghKHRva2VuIGluc3RhbmNlb2YgSWRlbnRpZmllckxpa2VUb2tlbikpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0b2tlbik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuSWRlbnRpZmllcih0b2tlbi52YWx1ZSksIHN0YXJ0VG9rZW5JbmRleCk7XG4gICAgfVxuICB9XG5cbiAgZW5zdXJlQXJyb3coKSB7XG4gICAgaWYgKHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0KSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5FWFBFQ1RFRF9MSU5FX1RFUk1JTkFUT1IpO1xuICAgIH1cbiAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLkFSUk9XKSkge1xuICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkFSUk9XKTtcbiAgICB9XG4gIH1cblxuICBwYXJzZUdyb3VwRXhwcmVzc2lvbigpIHtcbiAgICBsZXQgcmVzdCA9IG51bGw7XG4gICAgbGV0IHN0YXJ0ID0gdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5SUEFSRU4pKSB7XG4gICAgICB0aGlzLmVuc3VyZUFycm93KCk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiBBUlJPV19FWFBSRVNTSU9OX1BBUkFNUyxcbiAgICAgICAgcGFyYW1zOiBbXSxcbiAgICAgICAgcmVzdDogbnVsbFxuICAgICAgfTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5FTExJUFNJUykpIHtcbiAgICAgIHJlc3QgPSBuZXcgU2hpZnQuQmluZGluZ0lkZW50aWZpZXIodGhpcy5wYXJzZUlkZW50aWZpZXIoKSk7XG4gICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcbiAgICAgIHRoaXMuZW5zdXJlQXJyb3coKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6IEFSUk9XX0VYUFJFU1NJT05fUEFSQU1TLFxuICAgICAgICBwYXJhbXM6IFtdLFxuICAgICAgICByZXN0OiByZXN0XG4gICAgICB9O1xuICAgIH1cblxuICAgIGxldCBwb3NzaWJsZUJpbmRpbmdzID0gIXRoaXMubWF0Y2goVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgbGV0IHN0YXJ0VG9rZW5JbmRleCA9IHRoaXMudG9rZW5JbmRleDtcbiAgICBsZXQgZ3JvdXAgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICBsZXQgcGFyYW1zID0gW2dyb3VwXTtcblxuICAgIHdoaWxlICh0aGlzLmVhdChUb2tlblR5cGUuQ09NTUEpKSB7XG4gICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuRUxMSVBTSVMpKSB7XG4gICAgICAgIGlmICghcG9zc2libGVCaW5kaW5ncykge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5sZXgoKTtcbiAgICAgICAgcmVzdCA9IG5ldyBTaGlmdC5CaW5kaW5nSWRlbnRpZmllcih0aGlzLnBhcnNlSWRlbnRpZmllcigpKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBwb3NzaWJsZUJpbmRpbmdzID0gcG9zc2libGVCaW5kaW5ncyAmJiAhdGhpcy5tYXRjaChUb2tlblR5cGUuTFBBUkVOKTtcbiAgICAgIGxldCBleHByID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgICBwYXJhbXMucHVzaChleHByKTtcbiAgICAgIGdyb3VwID0gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkJpbmFyeUV4cHJlc3Npb24oXCIsXCIsIGdyb3VwLCBleHByKSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgICB9XG5cbiAgICBpZiAocG9zc2libGVCaW5kaW5ncykge1xuICAgICAgcG9zc2libGVCaW5kaW5ncyA9IHBhcmFtcy5ldmVyeShQYXJzZXIuaXNEZXN0cnVjdHVyaW5nQXNzaWdubWVudFRhcmdldFdpdGhEZWZhdWx0KTtcbiAgICB9XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcblxuICAgIGlmICghdGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQgJiYgdGhpcy5tYXRjaChUb2tlblR5cGUuQVJST1cpKSB7XG4gICAgICBpZiAoIXBvc3NpYmxlQmluZGluZ3MpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhUb2tlbihzdGFydCwgRXJyb3JNZXNzYWdlcy5JTExFR0FMX0FSUk9XX0ZVTkNUSU9OX1BBUkFNUyk7XG4gICAgICB9XG4gICAgICAvLyBjaGVjayBkdXAgcGFyYW1zXG4gICAgICBwYXJhbXMgPSBwYXJhbXMubWFwKFBhcnNlci50cmFuc2Zvcm1EZXN0cnVjdHVyaW5nQXNzaWdubWVudCk7XG4gICAgICBsZXQgYWxsQm91bmROYW1lcyA9IFtdO1xuICAgICAgcGFyYW1zLmZvckVhY2goZXhwciA9PiB7XG4gICAgICAgIGxldCBib3VuZE5hbWVzID0gUGFyc2VyLmJvdW5kTmFtZXMoZXhwcik7XG4gICAgICAgIGxldCBkdXAgPSBmaXJzdER1cGxpY2F0ZShib3VuZE5hbWVzKTtcbiAgICAgICAgaWYgKGR1cCkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5EVVBMSUNBVEVfQklORElORywgZHVwKTtcbiAgICAgICAgfVxuICAgICAgICBhbGxCb3VuZE5hbWVzID0gYWxsQm91bmROYW1lcy5jb25jYXQoYm91bmROYW1lcylcbiAgICAgIH0pO1xuICAgICAgaWYgKHJlc3QpIHtcbiAgICAgICAgYWxsQm91bmROYW1lcy5wdXNoKHJlc3QuaWRlbnRpZmllci5uYW1lKTtcbiAgICAgIH1cblxuICAgICAgbGV0IGR1cCA9IGZpcnN0RHVwbGljYXRlKGFsbEJvdW5kTmFtZXMpO1xuICAgICAgaWYgKHRoaXMuc3RyaWN0ICYmIGR1cCkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX1BBUkFNX0RVUEUpO1xuICAgICAgfVxuXG4gICAgICBsZXQgc3RyaWN0X3Jlc3RyaWN0ZWRfd29yZCA9IGFsbEJvdW5kTmFtZXMuc29tZShpc1Jlc3RyaWN0ZWRXb3JkKTtcbiAgICAgIGlmICh0aGlzLnN0cmljdCAmJiBzdHJpY3RfcmVzdHJpY3RlZF93b3JkKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUEFSQU1fTkFNRSk7XG4gICAgICB9XG5cbiAgICAgIGxldCBzdHJpY3RfcmVzZXJ2ZWRfd29yZCA9IGhhc1N0cmljdE1vZGVSZXNlcnZlZFdvcmQoYWxsQm91bmROYW1lcyk7XG4gICAgICBpZiAodGhpcy5zdHJpY3QgJiYgc3RyaWN0X3Jlc2VydmVkX3dvcmQpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlNUUklDVF9SRVNFUlZFRF9XT1JEKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogQVJST1dfRVhQUkVTU0lPTl9QQVJBTVMsXG4gICAgICAgIHBhcmFtcyxcbiAgICAgICAgcmVzdCxcbiAgICAgICAgZHVwLFxuICAgICAgICBzdHJpY3RfcmVzZXJ2ZWRfd29yZCxcbiAgICAgICAgc3RyaWN0X3Jlc3RyaWN0ZWRfd29yZH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChyZXN0KSB7XG4gICAgICAgIHRoaXMuZW5zdXJlQXJyb3coKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBncm91cDtcbiAgICB9XG4gIH1cblxuXG4gIHBhcnNlQXJyYXlFeHByZXNzaW9uKCkge1xuICAgIGxldCBzdGFydFRva2VuSW5kZXggPSB0aGlzLnRva2VuSW5kZXg7XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTEJSQUNLKTtcblxuICAgIGxldCBlbGVtZW50cyA9IHRoaXMucGFyc2VBcnJheUV4cHJlc3Npb25FbGVtZW50cygpO1xuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJCUkFDSyk7XG5cbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkFycmF5RXhwcmVzc2lvbihlbGVtZW50cyksIHN0YXJ0VG9rZW5JbmRleCk7XG4gIH1cblxuICBwYXJzZUFycmF5RXhwcmVzc2lvbkVsZW1lbnRzKCkge1xuICAgIGxldCByZXN1bHQgPSBbXTtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLlJCUkFDSykpIHtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH1cbiAgICAgIGxldCBlbDtcblxuICAgICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkNPTU1BKSkge1xuICAgICAgICB0aGlzLmxleCgpO1xuICAgICAgICBlbCA9IG51bGw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsZXQgc3RhcnRUb2tlbkluZGV4ID0gdGhpcy50b2tlbkluZGV4O1xuICAgICAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLkVMTElQU0lTKSkge1xuICAgICAgICAgIGVsID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgICAgICAgZWwgPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuU3ByZWFkRWxlbWVudChlbCksIHN0YXJ0VG9rZW5JbmRleCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZWwgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJCUkFDSykpIHtcbiAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuQ09NTUEpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXN1bHQucHVzaChlbCk7XG4gICAgfVxuICB9XG5cbiAgcGFyc2VPYmplY3RFeHByZXNzaW9uKCkge1xuICAgIGxldCBzdGFydFRva2VuSW5kZXggPSB0aGlzLnRva2VuSW5kZXg7XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTEJSQUNFKTtcblxuICAgIGxldCBwcm9wZXJ0eU1hcCA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgbGV0IHByb3BlcnRpZXMgPSB0aGlzLnBhcnNlT2JqZWN0RXhwcmVzc2lvbkl0ZW1zKHByb3BlcnR5TWFwKTtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SQlJBQ0UpO1xuXG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5PYmplY3RFeHByZXNzaW9uKHByb3BlcnRpZXMpLCBzdGFydFRva2VuSW5kZXgpO1xuICB9XG5cblxuICBwYXJzZU9iamVjdEV4cHJlc3Npb25JdGVtcyhwcm9wZXJ0eU1hcCkge1xuICAgIGxldCByZXN1bHQgPSBbXTtcbiAgICB3aGlsZSAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJCUkFDRSkpIHtcbiAgICAgIHJlc3VsdC5wdXNoKHRoaXMucGFyc2VPYmplY3RFeHByZXNzaW9uSXRlbShwcm9wZXJ0eU1hcCkpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgcGFyc2VPYmplY3RFeHByZXNzaW9uSXRlbShwcm9wZXJ0eU1hcCkge1xuICAgIGxldCBwcm9wZXJ0eSA9IHRoaXMucGFyc2VPYmplY3RQcm9wZXJ0eSgpO1xuICAgIGxldCB0eXBlID0gcHJvcGVydHkudHlwZTtcbiAgICBsZXQga2V5ID0gXCIkXCIgKyAodHlwZSA9PT0gXCJCaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyXCIgPyBwcm9wZXJ0eS5pZGVudGlmaWVyLmlkZW50aWZpZXIubmFtZSA6IHByb3BlcnR5Lm5hbWUudmFsdWUpO1xuICAgIGxldCB2YWx1ZSA9IHt9Lmhhc093blByb3BlcnR5LmNhbGwocHJvcGVydHlNYXAsIGtleSkgPyBwcm9wZXJ0eU1hcFtrZXldIDogMDtcblxuICAgIGlmICh7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHByb3BlcnR5TWFwLCBrZXkpKSB7XG4gICAgICBpZiAoKHZhbHVlICYgSU5JVF9NQVNLKSAhPT0gMCkge1xuICAgICAgICBpZiAodHlwZSA9PT0gXCJEYXRhUHJvcGVydHlcIiAmJiBrZXkgPT09IFwiJF9fcHJvdG9fX1wiKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLkRVUExJQ0FURV9QUk9UT19QUk9QRVJUWSk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZSAhPT0gXCJEYXRhUHJvcGVydHlcIikge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5BQ0NFU1NPUl9EQVRBX1BST1BFUlRZKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHR5cGUgPT09IFwiRGF0YVByb3BlcnR5XCIpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuQUNDRVNTT1JfREFUQV9QUk9QRVJUWSk7XG4gICAgICAgIH0gZWxzZSBpZiAoKHZhbHVlICYgR0VUVEVSX01BU0spICE9PSAwICYmIHR5cGUgPT0gXCJHZXR0ZXJcIlxuICAgICAgICAgICAgfHwgKHZhbHVlICYgU0VUVEVSX01BU0spICE9PSAwICYmIHR5cGUgPT0gXCJTZXR0ZXJcIikge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5BQ0NFU1NPUl9HRVRfU0VUKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgXCJEYXRhUHJvcGVydHlcIjpcbiAgICAgICAgcHJvcGVydHlNYXBba2V5XSA9IHZhbHVlIHwgSU5JVF9NQVNLO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJHZXR0ZXJcIjpcbiAgICAgICAgcHJvcGVydHlNYXBba2V5XSA9IHZhbHVlIHwgR0VUVEVSX01BU0s7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIlNldHRlclwiOlxuICAgICAgICBwcm9wZXJ0eU1hcFtrZXldID0gdmFsdWUgfCBTRVRURVJfTUFTSztcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0UpKSB7XG4gICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuQ09NTUEpO1xuICAgIH1cbiAgICByZXR1cm4gcHJvcGVydHk7XG4gIH1cblxuICBwYXJzZU9iamVjdFByb3BlcnR5S2V5KCkge1xuICAgIC8vIFByb3BlcnR5TmFtZVtZaWVsZCxHZW5lcmF0b3JQYXJhbWV0ZXJdOlxuICAgIGxldCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuXG4gICAgaWYgKHRoaXMuZW9mKCkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0b2tlbik7XG4gICAgfVxuXG4gICAgaWYgKHRva2VuIGluc3RhbmNlb2YgU3RyaW5nTGl0ZXJhbFRva2VuKSB7XG4gICAgICByZXR1cm4gbmV3IFNoaWZ0LlN0YXRpY1Byb3BlcnR5TmFtZSh0aGlzLnBhcnNlU3RyaW5nTGl0ZXJhbCgpLnZhbHVlKTtcbiAgICB9XG4gICAgaWYgKHRva2VuIGluc3RhbmNlb2YgTnVtZXJpY0xpdGVyYWxUb2tlbikge1xuICAgICAgbGV0IG51bUxpdGVyYWwgPSB0aGlzLnBhcnNlTnVtZXJpY0xpdGVyYWwoKTtcbiAgICAgIHJldHVybiBuZXcgU2hpZnQuU3RhdGljUHJvcGVydHlOYW1lKFwiXCIgKyAobnVtTGl0ZXJhbC50eXBlID09PSBcIkxpdGVyYWxJbmZpbml0eUV4cHJlc3Npb25cIiA/IDEgLyAwIDogbnVtTGl0ZXJhbC52YWx1ZSkpO1xuICAgIH1cbiAgICBpZiAodG9rZW4gaW5zdGFuY2VvZiBJZGVudGlmaWVyTGlrZVRva2VuKSB7XG4gICAgICByZXR1cm4gbmV3IFNoaWZ0LlN0YXRpY1Byb3BlcnR5TmFtZSh0aGlzLnBhcnNlSWRlbnRpZmllcigpLm5hbWUpO1xuICAgIH1cbiAgICBpZiAodG9rZW4udHlwZSA9PSBUb2tlblR5cGUuTEJSQUNLKSB7XG4gICAgICBsZXQgcHJldmlvdXNHZW5lcmF0b3JQYXJhbWV0ZXIgPSB0aGlzLnBhcmFtR2VuZXJhdG9yUGFyYW1ldGVyO1xuICAgICAgbGV0IHByZXZpb3VzWWllbGQgPSB0aGlzLnBhcmFtWWllbGQ7XG4gICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTEJSQUNLKTtcbiAgICAgIGlmICh0aGlzLnBhcmFtR2VuZXJhdG9yUGFyYW1ldGVyKSB7XG4gICAgICAgIC8vIFsrR2VuZXJhdG9yUGFyYW1ldGVyXSBDb21wdXRlZFByb3BlcnR5TmFtZVxuICAgICAgICB0aGlzLnBhcmFtR2VuZXJhdG9yUGFyYW1ldGVyID0gZmFsc2U7XG4gICAgICAgIHRoaXMucGFyYW1ZaWVsZCA9IGZhbHNlO1xuICAgICAgfSAvLyBlbHNlIFt+R2VuZXJhdG9yUGFyYW1ldGVyXSBDb21wdXRlZFByb3BlcnR5TmFtZVs/WWllbGRdXG4gICAgICBsZXQgZXhwciA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJCUkFDSyk7XG4gICAgICB0aGlzLnBhcmFtR2VuZXJhdG9yUGFyYW1ldGVyID0gcHJldmlvdXNHZW5lcmF0b3JQYXJhbWV0ZXI7XG4gICAgICB0aGlzLnBhcmFtWWllbGQgPSBwcmV2aW91c1lpZWxkO1xuICAgICAgcmV0dXJuIG5ldyBTaGlmdC5Db21wdXRlZFByb3BlcnR5TmFtZShleHByKTtcbiAgICB9XG5cbiAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuSU5WQUxJRF9QUk9QRVJUWV9OQU1FKTtcbiAgfVxuXG4gIHBhcnNlT2JqZWN0UHJvcGVydHkoKSB7XG4gICAgbGV0IHRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgbGV0IHN0YXJ0VG9rZW5JbmRleCA9IHRoaXMudG9rZW5JbmRleDtcblxuICAgIGlmICh0b2tlbi50eXBlID09PSBUb2tlblR5cGUuSURFTlRJRklFUikge1xuICAgICAgbGV0IGtleSA9IHRoaXMucGFyc2VPYmplY3RQcm9wZXJ0eUtleSgpO1xuICAgICAgbGV0IG5hbWUgPSB0b2tlbi52YWx1ZTtcbiAgICAgIGlmIChuYW1lLmxlbmd0aCA9PT0gMykge1xuICAgICAgICAvLyBQcm9wZXJ0eSBBc3NpZ25tZW50OiBHZXR0ZXIgYW5kIFNldHRlci5cbiAgICAgICAgaWYgKFwiZ2V0XCIgPT09IG5hbWUgJiYgIXRoaXMubWF0Y2goVG9rZW5UeXBlLkNPTE9OKSkge1xuICAgICAgICAgIGtleSA9IHRoaXMucGFyc2VPYmplY3RQcm9wZXJ0eUtleSgpO1xuICAgICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MUEFSRU4pO1xuICAgICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgICAgICAgIGxldCBbYm9keSwgaXNTdHJpY3RdID0gdGhpcy5wYXJzZUZ1bmN0aW9uQm9keSgpO1xuICAgICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuR2V0dGVyKGtleSwgYm9keSksIHN0YXJ0VG9rZW5JbmRleCk7XG4gICAgICAgIH0gZWxzZSBpZiAoXCJzZXRcIiA9PT0gbmFtZSAmJiAhdGhpcy5tYXRjaChUb2tlblR5cGUuQ09MT04pKSB7XG4gICAgICAgICAga2V5ID0gdGhpcy5wYXJzZU9iamVjdFByb3BlcnR5S2V5KCk7XG4gICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgICAgICAgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICAgICAgICBpZiAodG9rZW4udHlwZSAhPT0gVG9rZW5UeXBlLklERU5USUZJRVIpIHtcbiAgICAgICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhUb2tlbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5VTkVYUEVDVEVEX1RPS0VOLCB0b2tlbi50eXBlLm5hbWUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsZXQgcGFyYW0gPSB0aGlzLnBhcnNlVmFyaWFibGVJZGVudGlmaWVyKCk7XG4gICAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcbiAgICAgICAgICAgIGxldCBbYm9keSwgaXNTdHJpY3RdID0gdGhpcy5wYXJzZUZ1bmN0aW9uQm9keSgpO1xuICAgICAgICAgICAgaWYgKCh0aGlzLnN0cmljdCB8fCBpc1N0cmljdCkgJiYgaXNSZXN0cmljdGVkV29yZChwYXJhbS5uYW1lKSkge1xuICAgICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX1BBUkFNX05BTUUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5TZXR0ZXIoa2V5LCBwYXJhbSwgYm9keSksIHN0YXJ0VG9rZW5JbmRleCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuQ09MT04pKSB7XG4gICAgICAgIGxldCB2YWx1ZSA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkRhdGFQcm9wZXJ0eShrZXksIHZhbHVlKSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgICAgIH0gZWxzZSBpZih0aGlzLmVhdChUb2tlblR5cGUuQVNTSUdOKSkge1xuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkJpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXIoXG4gICAgICAgICAgbmV3IFNoaWZ0LkJpbmRpbmdJZGVudGlmaWVyKG5ldyBTaGlmdC5JZGVudGlmaWVyKGtleS52YWx1ZSkpLFxuICAgICAgICAgIHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpXG4gICAgICAgICksIHN0YXJ0VG9rZW5JbmRleCk7XG5cbiAgICAgIH0gZWxzZSBpZih0aGlzLm1hdGNoKFRva2VuVHlwZS5MUEFSRU4pKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlTWV0aG9kKGtleSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuU2hvcnRoYW5kUHJvcGVydHkobmV3IFNoaWZ0LklkZW50aWZpZXIoa2V5LnZhbHVlKSksIHN0YXJ0VG9rZW5JbmRleCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IGtleSA9IHRoaXMucGFyc2VPYmplY3RQcm9wZXJ0eUtleSgpO1xuICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuQ09MT04pKSB7XG4gICAgICAvLyBQcm9wZXJ0eU5hbWVbP1lpZWxkXSA6IEFzc2lnbm1lbnRFeHByZXNzaW9uW0luLD9ZaWVsZF1cbiAgICAgIGxldCB2YWx1ZSA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5EYXRhUHJvcGVydHkoa2V5LCB2YWx1ZSksIHN0YXJ0VG9rZW5JbmRleCk7XG4gICAgfVxuICAgIHRoaXMubWF0Y2goVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgcmV0dXJuIHRoaXMucGFyc2VNZXRob2Qoa2V5LCBzdGFydFRva2VuSW5kZXgpO1xuICB9XG5cbiAgcGFyc2VNZXRob2Qoa2V5LCBzdGFydFRva2VuSW5kZXgpIHtcbiAgICBsZXQgcGFybUluZm8gPSB0aGlzLnBhcnNlUGFyYW1zKG51bGwpO1xuICAgIGxldCBbYm9keS8qLCBpc1N0cmljdCovXSA9IHRoaXMucGFyc2VGdW5jdGlvbkJvZHkoKTtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0Lk1ldGhvZChmYWxzZSwga2V5LCBwYXJtSW5mby5wYXJhbXMsIHBhcm1JbmZvLnJlc3QsIGJvZHkpLCBzdGFydFRva2VuSW5kZXgpO1xuICB9XG5cbiAgcGFyc2VGdW5jdGlvbihpc0V4cHJlc3Npb24pIHtcbiAgICBsZXQgc3RhcnRUb2tlbkluZGV4ID0gdGhpcy50b2tlbkluZGV4O1xuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkZVTkNUSU9OKTtcblxuICAgIGxldCBpZCA9IG51bGw7XG4gICAgbGV0IG1lc3NhZ2UgPSBudWxsO1xuICAgIGxldCBmaXJzdFJlc3RyaWN0ZWQgPSBudWxsO1xuICAgIGlmICghaXNFeHByZXNzaW9uIHx8ICF0aGlzLm1hdGNoKFRva2VuVHlwZS5MUEFSRU4pKSB7XG4gICAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICAgIGlkID0gdGhpcy5wYXJzZVZhcmlhYmxlSWRlbnRpZmllcigpO1xuICAgICAgaWYgKHRoaXMuc3RyaWN0KSB7XG4gICAgICAgIGlmIChpc1Jlc3RyaWN0ZWRXb3JkKGlkLm5hbWUpKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhUb2tlbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5TVFJJQ1RfRlVOQ1RJT05fTkFNRSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChpc1Jlc3RyaWN0ZWRXb3JkKGlkLm5hbWUpKSB7XG4gICAgICAgICAgZmlyc3RSZXN0cmljdGVkID0gdG9rZW47XG4gICAgICAgICAgbWVzc2FnZSA9IEVycm9yTWVzc2FnZXMuU1RSSUNUX0ZVTkNUSU9OX05BTUU7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNTdHJpY3RNb2RlUmVzZXJ2ZWRXb3JkRVM1KGlkLm5hbWUpKSB7XG4gICAgICAgICAgZmlyc3RSZXN0cmljdGVkID0gdG9rZW47XG4gICAgICAgICAgbWVzc2FnZSA9IEVycm9yTWVzc2FnZXMuU1RSSUNUX1JFU0VSVkVEX1dPUkQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgbGV0IGluZm8gPSB0aGlzLnBhcnNlUGFyYW1zKGZpcnN0UmVzdHJpY3RlZCk7XG5cbiAgICBpZiAoaW5mby5tZXNzYWdlICE9IG51bGwpIHtcbiAgICAgIG1lc3NhZ2UgPSBpbmZvLm1lc3NhZ2U7XG4gICAgfVxuXG4gICAgbGV0IHByZXZpb3VzU3RyaWN0ID0gdGhpcy5zdHJpY3Q7XG4gICAgbGV0IFtib2R5LCBpc1N0cmljdF0gPSB0aGlzLnBhcnNlRnVuY3Rpb25Cb2R5KCk7XG4gICAgaWYgKG1lc3NhZ2UgIT0gbnVsbCkge1xuICAgICAgaWYgKCh0aGlzLnN0cmljdCB8fCBpc1N0cmljdCkgJiYgaW5mby5maXJzdFJlc3RyaWN0ZWQgIT0gbnVsbCkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aFRva2VuKGluZm8uZmlyc3RSZXN0cmljdGVkLCBtZXNzYWdlKTtcbiAgICAgIH1cbiAgICAgIGlmICgodGhpcy5zdHJpY3QgfHwgaXNTdHJpY3QpICYmIGluZm8uc3RyaWN0ZWQgIT0gbnVsbCkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aFRva2VuKGluZm8uc3RyaWN0ZWQsIG1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnN0cmljdCA9IHByZXZpb3VzU3RyaWN0O1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgKGlzRXhwcmVzc2lvbiA/IFNoaWZ0LkZ1bmN0aW9uRXhwcmVzc2lvbiA6IFNoaWZ0LkZ1bmN0aW9uRGVjbGFyYXRpb24pKGZhbHNlLCBpZCwgaW5mby5wYXJhbXMsIGluZm8ucmVzdCwgYm9keSksXG4gICAgICAgIHN0YXJ0VG9rZW5JbmRleCk7XG4gIH1cblxuXG4gIHBhcnNlUGFyYW1zKGZyKSB7XG4gICAgbGV0IGluZm8gPSB7cGFyYW1zOiBbXSwgcmVzdDogbnVsbH07XG4gICAgaW5mby5maXJzdFJlc3RyaWN0ZWQgPSBmcjtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTFBBUkVOKTtcblxuICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuUlBBUkVOKSkge1xuICAgICAgbGV0IGJvdW5kID0gW107XG4gICAgICBsZXQgc2VlblJlc3QgPSBmYWxzZTtcblxuICAgICAgd2hpbGUgKCF0aGlzLmVvZigpKSB7XG4gICAgICAgIGxldCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgICAgICBsZXQgc3RhcnRUb2tlbkluZGV4ID0gdGhpcy50b2tlbkluZGV4O1xuICAgICAgICBsZXQgcGFyYW07XG4gICAgICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuRUxMSVBTSVMpKSB7XG4gICAgICAgICAgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICAgICAgICBwYXJhbSA9IG5ldyBTaGlmdC5CaW5kaW5nSWRlbnRpZmllcih0aGlzLnBhcnNlSWRlbnRpZmllcigpKTtcbiAgICAgICAgICBzZWVuUmVzdCA9IHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkxQQVJFTikpIHtcbiAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHBhcmFtID0gdGhpcy5wYXJzZUxlZnRIYW5kU2lkZUV4cHJlc3Npb24oKTtcbiAgICAgICAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLkFTU0lHTikpIHtcbiAgICAgICAgICAgIHBhcmFtID0gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkFzc2lnbm1lbnRFeHByZXNzaW9uKFwiPVwiLCBwYXJhbSwgdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCkpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIVBhcnNlci5pc0Rlc3RydWN0dXJpbmdBc3NpZ25tZW50VGFyZ2V0V2l0aERlZmF1bHQocGFyYW0pKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRva2VuKTtcbiAgICAgICAgfVxuICAgICAgICBwYXJhbSA9IFBhcnNlci50cmFuc2Zvcm1EZXN0cnVjdHVyaW5nQXNzaWdubWVudChwYXJhbSk7XG5cbiAgICAgICAgbGV0IG5ld0JvdW5kID0gUGFyc2VyLmJvdW5kTmFtZXMocGFyYW0pO1xuICAgICAgICBbXS5wdXNoLmFwcGx5KGJvdW5kLCBuZXdCb3VuZCk7XG5cbiAgICAgICAgaWYgKGZpcnN0RHVwbGljYXRlKG5ld0JvdW5kKSAhPSBudWxsKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhUb2tlbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5EVVBMSUNBVEVfQklORElORywgZmlyc3REdXBsaWNhdGUobmV3Qm91bmQpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5zdHJpY3QpIHtcbiAgICAgICAgICBpZiAobmV3Qm91bmQuc29tZShpc1Jlc3RyaWN0ZWRXb3JkKSkge1xuICAgICAgICAgICAgaW5mby5zdHJpY3RlZCA9IHRva2VuO1xuICAgICAgICAgICAgaW5mby5tZXNzYWdlID0gRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUEFSQU1fTkFNRTtcbiAgICAgICAgICB9IGVsc2UgaWYgKGZpcnN0RHVwbGljYXRlKGJvdW5kKSAhPSBudWxsKSB7XG4gICAgICAgICAgICBpbmZvLnN0cmljdGVkID0gdG9rZW47XG4gICAgICAgICAgICBpbmZvLm1lc3NhZ2UgPSBFcnJvck1lc3NhZ2VzLlNUUklDVF9QQVJBTV9EVVBFO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChpbmZvLmZpcnN0UmVzdHJpY3RlZCA9PSBudWxsKSB7XG4gICAgICAgICAgaWYgKG5ld0JvdW5kLnNvbWUoaXNSZXN0cmljdGVkV29yZCkpIHtcbiAgICAgICAgICAgIGluZm8uZmlyc3RSZXN0cmljdGVkID0gdG9rZW47XG4gICAgICAgICAgICBpbmZvLm1lc3NhZ2UgPSBFcnJvck1lc3NhZ2VzLlNUUklDVF9QQVJBTV9OQU1FO1xuICAgICAgICAgIH0gZWxzZSBpZiAoaGFzU3RyaWN0TW9kZVJlc2VydmVkV29yZChuZXdCb3VuZCkpIHtcbiAgICAgICAgICAgIGluZm8uZmlyc3RSZXN0cmljdGVkID0gdG9rZW47XG4gICAgICAgICAgICBpbmZvLm1lc3NhZ2UgPSBFcnJvck1lc3NhZ2VzLlNUUklDVF9SRVNFUlZFRF9XT1JEO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZmlyc3REdXBsaWNhdGUoYm91bmQpICE9IG51bGwpIHtcbiAgICAgICAgICAgIGluZm8uZmlyc3RSZXN0cmljdGVkID0gdG9rZW47XG4gICAgICAgICAgICBpbmZvLm1lc3NhZ2UgPSBFcnJvck1lc3NhZ2VzLlNUUklDVF9QQVJBTV9EVVBFO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzZWVuUmVzdCkge1xuICAgICAgICAgIGluZm8ucmVzdCA9IHBhcmFtO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGluZm8ucGFyYW1zLnB1c2gocGFyYW0pO1xuICAgICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuUlBBUkVOKSkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5DT01NQSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJQQVJFTik7XG4gICAgcmV0dXJuIGluZm87XG4gIH1cblxuXG59XG4iXX0=