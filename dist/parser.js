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
        if (Parser.isValidSimpleAssignmentTarget(node)) return true;
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
          if (!Parser.isDestructuringAssignmentTarget(node)) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9wYXJzZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWdCWSxLQUFLLFdBQU0sV0FBVzs7cUJBRTBCLFNBQVM7O0lBQTdELGdCQUFnQixVQUFoQixnQkFBZ0I7SUFBRSwyQkFBMkIsVUFBM0IsMkJBQTJCO0lBRTdDLGFBQWEsV0FBTyxVQUFVLEVBQTlCLGFBQWE7eUJBUVEsYUFBYTs7SUFObkMsU0FBUztJQUNaLFVBQVUsY0FBVixVQUFVO0lBQ1YsU0FBUyxjQUFULFNBQVM7SUFDVCxlQUFlLGNBQWYsZUFBZTtJQUNmLG1CQUFtQixjQUFuQixtQkFBbUI7SUFDbkIsbUJBQW1CLGNBQW5CLG1CQUFtQjtJQUNuQixrQkFBa0IsY0FBbEIsa0JBQWtCOzs7QUFFdEIsSUFBTSxTQUFTLEdBQUcsQ0FBQyxDQUFDO0FBQ3BCLElBQU0sV0FBVyxHQUFHLENBQUMsQ0FBQztBQUN0QixJQUFNLFdBQVcsR0FBRyxDQUFDLENBQUM7OztBQUd0QixJQUFNLHVCQUF1QixHQUFHLG1EQUFtRCxDQUFDOztBQUVwRixJQUFNLHlCQUF5QixHQUFHO0FBQ2hDLGNBQVksRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUk7QUFDMUYsVUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUk7Q0FDM0QsQ0FBQzs7QUFFRixJQUFNLFVBQVUsR0FBRztBQUNqQixVQUFRLEVBQUUsQ0FBQztBQUNYLE9BQUssRUFBRSxDQUFDO0FBQ1IsWUFBVSxFQUFFLENBQUM7QUFDYixhQUFXLEVBQUUsQ0FBQztBQUNkLGVBQWEsRUFBRSxDQUFDO0FBQ2hCLFdBQVMsRUFBRSxDQUFDO0FBQ1osWUFBVSxFQUFFLENBQUM7QUFDYixXQUFTLEVBQUUsQ0FBQztBQUNaLFlBQVUsRUFBRSxDQUFDO0FBQ2IsWUFBVSxFQUFFLENBQUM7QUFDYixVQUFRLEVBQUUsQ0FBQztBQUNYLFlBQVUsRUFBRSxDQUFDO0FBQ2IsY0FBWSxFQUFFLEVBQUU7QUFDaEIsVUFBUSxFQUFFLEVBQUU7QUFDWixnQkFBYyxFQUFFLEVBQUU7QUFDbEIsT0FBSyxFQUFFLEVBQUU7QUFDVCxTQUFPLEVBQUUsRUFBRTtBQUNYLE1BQUksRUFBRSxFQUFFO0FBQ1IsS0FBRyxFQUFFLEVBQUU7QUFDUCxnQkFBYyxFQUFFLEVBQUU7QUFDbEIsUUFBTSxFQUFFLEVBQUU7QUFDVixTQUFPLEVBQUUsRUFBRTtDQUNaLENBQUM7O0FBRUYsSUFBTSxnQkFBZ0IsR0FBRztBQUN2QixNQUFJLEVBQUUsVUFBVSxDQUFDLFNBQVM7QUFDMUIsTUFBSSxFQUFFLFVBQVUsQ0FBQyxVQUFVO0FBQzNCLEtBQUcsRUFBRSxVQUFVLENBQUMsU0FBUztBQUN6QixLQUFHLEVBQUUsVUFBVSxDQUFDLFVBQVU7QUFDMUIsS0FBRyxFQUFFLFVBQVUsQ0FBQyxVQUFVO0FBQzFCLE1BQUksRUFBRSxVQUFVLENBQUMsUUFBUTtBQUN6QixNQUFJLEVBQUUsVUFBVSxDQUFDLFFBQVE7QUFDekIsT0FBSyxFQUFFLFVBQVUsQ0FBQyxRQUFRO0FBQzFCLE9BQUssRUFBRSxVQUFVLENBQUMsUUFBUTtBQUMxQixLQUFHLEVBQUUsVUFBVSxDQUFDLFVBQVU7QUFDMUIsS0FBRyxFQUFFLFVBQVUsQ0FBQyxVQUFVO0FBQzFCLE1BQUksRUFBRSxVQUFVLENBQUMsVUFBVTtBQUMzQixNQUFJLEVBQUUsVUFBVSxDQUFDLFVBQVU7QUFDM0IsTUFBSSxFQUFFLFVBQVUsQ0FBQyxVQUFVO0FBQzNCLGNBQVksRUFBRSxVQUFVLENBQUMsVUFBVTtBQUNuQyxNQUFJLEVBQUUsVUFBVSxDQUFDLFlBQVk7QUFDN0IsTUFBSSxFQUFFLFVBQVUsQ0FBQyxZQUFZO0FBQzdCLE9BQUssRUFBRSxVQUFVLENBQUMsWUFBWTtBQUM5QixLQUFHLEVBQUUsVUFBVSxDQUFDLFFBQVE7QUFDeEIsS0FBRyxFQUFFLFVBQVUsQ0FBQyxRQUFRO0FBQ3hCLEtBQUcsRUFBRSxVQUFVLENBQUMsY0FBYztBQUM5QixLQUFHLEVBQUUsVUFBVSxDQUFDLGNBQWM7QUFDOUIsS0FBRyxFQUFFLFVBQVUsQ0FBQyxjQUFjLEVBQy9CLENBQUM7Ozs7Ozs7QUFPRixTQUFTLGNBQWMsQ0FBQyxPQUFPLEVBQUU7QUFDL0IsTUFBSSxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsRUFDcEIsT0FBTyxJQUFJLENBQUM7QUFDZCxNQUFJLEdBQUcsR0FBRyxFQUFFLENBQUM7QUFDYixPQUFLLElBQUksTUFBTSxHQUFHLENBQUMsRUFBRSxNQUFNLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsRUFBRTtBQUN0RCxRQUFJLEVBQUUsR0FBRyxHQUFHLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQy9CLFFBQUksR0FBRyxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUMsRUFBRTtBQUMxQixhQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztLQUN4QjtBQUNELE9BQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUM7R0FDaEI7QUFDRCxTQUFPLElBQUksQ0FBQztDQUNiOztBQUVELFNBQVMseUJBQXlCLENBQUMsR0FBRyxFQUFFO0FBQ3RDLFNBQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFBLEVBQUU7V0FBSSx5QkFBeUIsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDO0dBQUEsQ0FBQyxDQUFDO0NBQ3JFOztJQUVZLE1BQU0sV0FBTixNQUFNLGNBQVMsU0FBUztBQUN4QixXQURBLE1BQU0sQ0FDTCxNQUFNOzBCQURQLE1BQU07O0FBRWYsK0JBRlMsTUFBTSw2Q0FFVCxNQUFNLEVBQUU7QUFDZCxRQUFJLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDcEMsUUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7QUFDcEIsUUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7QUFDekIsUUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7QUFDdEIsUUFBSSxDQUFDLGNBQWMsR0FBRyxLQUFLLENBQUM7QUFDNUIsUUFBSSxDQUFDLHVCQUF1QixHQUFHLEtBQUssQ0FBQztBQUNyQyxRQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztHQUN6Qjs7WUFWVSxNQUFNLEVBQVMsU0FBUzs7dUJBQXhCLE1BQU07QUFpVlYsb0NBQWdDO2FBQUEsMENBQUMsSUFBSSxFQUFFO0FBQzVDLGdCQUFRLElBQUksQ0FBQyxJQUFJO0FBQ2YsZUFBSyxrQkFBa0I7QUFDckIsbUJBQU8sSUFBSSxLQUFLLENBQUMsYUFBYSxDQUM1QixJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsZ0NBQWdDLENBQUMsQ0FDN0QsQ0FBQztBQUFBLEFBQ0osZUFBSyxjQUFjO0FBQ2pCLG1CQUFPLElBQUksS0FBSyxDQUFDLHVCQUF1QixDQUN0QyxJQUFJLENBQUMsSUFBSSxFQUNULE1BQU0sQ0FBQyxnQ0FBZ0MsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQ3pELENBQUM7QUFBQSxBQUNKLGVBQUssbUJBQW1CO0FBQ3RCLG1CQUFPLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUN4QyxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQ3RDLElBQUksQ0FDTCxDQUFDO0FBQUEsQUFDSixlQUFLLGlCQUFpQjtBQUNwQixnQkFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztBQUNuRCxnQkFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssZUFBZSxFQUFFO0FBQ2pELHFCQUFPLElBQUksS0FBSyxDQUFDLFlBQVksQ0FDM0IsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLFVBQUEsQ0FBQzt1QkFBSSxDQUFDLElBQUksTUFBTSxDQUFDLGdDQUFnQyxDQUFDLENBQUMsQ0FBQztlQUFBLENBQUMsRUFDcEYsSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FDeEQsQ0FBQzthQUNILE1BQU07QUFDTCxxQkFBTyxJQUFJLEtBQUssQ0FBQyxZQUFZLENBQzNCLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFVBQUEsQ0FBQzt1QkFBSSxDQUFDLElBQUksTUFBTSxDQUFDLGdDQUFnQyxDQUFDLENBQUMsQ0FBQztlQUFBLENBQUMsRUFDdkUsSUFBSSxDQUNMLENBQUM7YUFDSDtBQUFBLEFBQ0gsZUFBSyxzQkFBc0I7QUFDekIsbUJBQU8sSUFBSSxLQUFLLENBQUMsa0JBQWtCLENBQ2pDLE1BQU0sQ0FBQyxnQ0FBZ0MsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQ3JELElBQUksQ0FBQyxVQUFVLENBQ2hCLENBQUM7QUFBQSxBQUNKLGVBQUssc0JBQXNCO0FBQ3pCLG1CQUFPLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUFBLFNBQ3ZEO0FBQ0QsZUFBTyxJQUFJLENBQUM7T0FDYjs7OztBQUVNLG1DQUErQjthQUFBLHlDQUFDLElBQUksRUFBRTtBQUMzQyxZQUFJLE1BQU0sQ0FBQyw2QkFBNkIsQ0FBQyxJQUFJLENBQUMsRUFDMUMsT0FBTyxJQUFJLENBQUM7QUFDaEIsZ0JBQVEsSUFBSSxDQUFDLElBQUk7QUFDZixlQUFLLGtCQUFrQjtBQUNyQixtQkFBTyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxVQUFBLENBQUM7cUJBQzVCLENBQUMsQ0FBQyxJQUFJLEtBQUssMkJBQTJCLElBQ3RDLENBQUMsQ0FBQyxJQUFJLEtBQUssbUJBQW1CLElBQzlCLENBQUMsQ0FBQyxJQUFJLEtBQUssY0FBYyxJQUN2QixNQUFNLENBQUMsMENBQTBDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQzthQUFBLENBQ2xFLENBQUM7QUFBQSxBQUNKLGVBQUssaUJBQWlCO0FBQ3BCLGdCQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUMsRUFDNUIsT0FBTyxLQUFLLENBQUM7QUFDZixnQkFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFBLENBQUM7cUJBQUksQ0FBQyxJQUFJLElBQUk7YUFBQSxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQywwQ0FBMEMsQ0FBQyxFQUM3RyxPQUFPLEtBQUssQ0FBQztBQUNmLGdCQUFJLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ25ELG1CQUFPLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxlQUFlLEdBQ2hELElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxLQUFLLHNCQUFzQixHQUMvQyxJQUFJLElBQUksSUFBSSxJQUFJLE1BQU0sQ0FBQywwQ0FBMEMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUFBLEFBQzlFLGVBQUssY0FBYztBQUFDLEFBQ3BCLGVBQUssbUJBQW1CO0FBQUMsQUFDekIsZUFBSywyQkFBMkI7QUFBQyxBQUNqQyxlQUFLLHlCQUF5QjtBQUFDLEFBQy9CLGVBQUssb0JBQW9CO0FBQUMsQUFDMUIsZUFBSyxlQUFlO0FBQ2xCLG1CQUFPLElBQUksQ0FBQztBQUFBLFNBQ2Y7QUFDRCxlQUFPLEtBQUssQ0FBQztPQUNkOzs7O0FBRU0sOENBQTBDO2FBQUEsb0RBQUMsSUFBSSxFQUFFO0FBQ3RELGVBQU8sTUFBTSxDQUFDLCtCQUErQixDQUFDLElBQUksQ0FBQyxJQUNqRCxJQUFJLENBQUMsSUFBSSxLQUFLLHNCQUFzQixJQUFJLElBQUksQ0FBQyxRQUFRLEtBQUssR0FBRyxJQUM3RCxNQUFNLENBQUMsK0JBQStCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO09BQ3hEOzs7O0FBRU0saUNBQTZCO2FBQUEsdUNBQUMsSUFBSSxFQUFFO0FBQ3pDLGdCQUFRLElBQUksQ0FBQyxJQUFJO0FBQ2YsZUFBSyxtQkFBbUI7QUFBQyxBQUN6QixlQUFLLHNCQUFzQjtBQUFDLEFBQzVCLGVBQUssMEJBQTBCO0FBQUMsQUFDaEMsZUFBSyx3QkFBd0I7QUFDM0IsbUJBQU8sSUFBSSxDQUFDO0FBQUEsU0FDZjtBQUNELGVBQU8sS0FBSyxDQUFDO09BQ2Q7Ozs7QUFFTSxjQUFVO2FBQUEsb0JBQUMsSUFBSSxFQUFFO0FBQ3RCLGdCQUFPLElBQUksQ0FBQyxJQUFJO0FBQ2QsZUFBSyxtQkFBbUI7QUFDdEIsbUJBQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQUEsQUFDaEMsZUFBSyxvQkFBb0I7QUFDdkIsbUJBQU8sTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7QUFBQSxBQUN6QyxlQUFLLGNBQWM7QUFBRTs7QUFDbkIsb0JBQUksS0FBSyxHQUFHLEVBQUUsQ0FBQztBQUNmLG9CQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxVQUFBLENBQUM7eUJBQUksQ0FBQyxJQUFJLElBQUk7aUJBQUEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFBLENBQUM7eUJBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQUEsQ0FBQyxDQUFDO0FBQzlGLG9CQUFJLElBQUksQ0FBQyxXQUFXLElBQUksSUFBSSxFQUFFO0FBQzVCLHVCQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO2lCQUM5QztBQUNEO3FCQUFPLEtBQUs7a0JBQUM7Ozs7YUFDZDtBQUFBLEFBQ0QsZUFBSyxlQUFlO0FBQUU7O0FBQ3BCLG9CQUFJLEtBQUssR0FBRyxFQUFFLENBQUM7QUFDZixvQkFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsVUFBQSxDQUFDLEVBQUk7QUFDM0IsMEJBQVEsQ0FBQyxDQUFDLElBQUk7QUFDWix5QkFBSywyQkFBMkI7QUFDOUIsMkJBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDekMsNEJBQU07QUFBQSxBQUNSLHlCQUFLLHlCQUF5QjtBQUM1Qix3QkFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDbkQsNEJBQU07QUFBQTtBQUVSO0FBQ0UsNEJBQU0sSUFBSSxLQUFLLENBQUMsNERBQTRELEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQUEsbUJBQzFGO2lCQUNGLENBQUMsQ0FBQztBQUNIO3FCQUFPLEtBQUs7a0JBQUM7Ozs7YUFDZDtBQUFBLEFBQ0QsZUFBSywwQkFBMEI7QUFBQyxBQUNoQyxlQUFLLHdCQUF3QjtBQUMzQixtQkFBTyxFQUFFLENBQUM7QUFBQSxTQUNiOztBQUVELGNBQU0sSUFBSSxLQUFLLENBQUMsa0RBQWtELEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO09BQ2pGOzs7O0FBcWtCTSxvQkFBZ0I7YUFBQSwwQkFBQyxJQUFJLEVBQUU7QUFDNUIsZ0JBQVEsSUFBSTtBQUNWLGVBQUssU0FBUyxDQUFDLEdBQUc7QUFBQyxBQUNuQixlQUFLLFNBQVMsQ0FBQyxHQUFHO0FBQUMsQUFDbkIsZUFBSyxTQUFTLENBQUMsR0FBRztBQUFDLEFBQ25CLGVBQUssU0FBUyxDQUFDLEdBQUc7QUFBQyxBQUNuQixlQUFLLFNBQVMsQ0FBQyxPQUFPO0FBQUMsQUFDdkIsZUFBSyxTQUFTLENBQUMsR0FBRztBQUFDLEFBQ25CLGVBQUssU0FBUyxDQUFDLE1BQU07QUFBQyxBQUN0QixlQUFLLFNBQVMsQ0FBQyxJQUFJO0FBQUMsQUFDcEIsZUFBSyxTQUFTLENBQUMsTUFBTTtBQUNuQixtQkFBTyxJQUFJLENBQUM7QUFBQSxTQUNmO0FBQ0QsZUFBTyxLQUFLLENBQUM7T0FDZDs7Ozs7QUFyaENELE9BQUc7YUFBQSxhQUFDLFNBQVMsRUFBRTtBQUNiLFlBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEtBQUssU0FBUyxFQUFFO0FBQ3JDLGlCQUFPLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztTQUNuQjtPQUNGOzs7O0FBRUQsVUFBTTthQUFBLGdCQUFDLFNBQVMsRUFBRTtBQUNoQixZQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxLQUFLLFNBQVMsRUFBRTtBQUNyQyxpQkFBTyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7U0FDbkI7QUFDRCxjQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7T0FDN0M7Ozs7QUFFRCxTQUFLO2FBQUEsZUFBQyxPQUFPLEVBQUU7QUFDYixlQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxLQUFLLE9BQU8sQ0FBQztPQUN4Qzs7OztBQUVELG9CQUFnQjthQUFBLDRCQUFHOztBQUVqQixZQUFJLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsRUFBRTtBQUM1RSxjQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDWCxpQkFBTztTQUNSOztBQUVELFlBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDO0FBQ3hDLFlBQUksSUFBSSxDQUFDLDJCQUEyQixFQUFFO0FBQ3BDLGlCQUFPO1NBQ1I7O0FBRUQsWUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsRUFBRTtBQUNuQyxjQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDWCxpQkFBTztTQUNSOztBQUVELFlBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUNoRCxnQkFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQzdDO09BQ0Y7Ozs7QUFHRCxnQkFBWTs7O2FBQUEsc0JBQUMsSUFBSSxFQUFFLGVBQWUsRUFBbUM7WUFBakMsYUFBYSxnQ0FBRyxJQUFJLENBQUMsVUFBVTs7QUFFakUsZUFBTyxJQUFJLENBQUM7T0FDYjs7OztBQUVELGVBQVc7YUFBQSx1QkFBRzt5QkFDQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQzs7OztZQUE1QixJQUFJO0FBQ1QsZUFBTyxJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztPQUNyRDs7OztBQUVELHFCQUFpQjthQUFBLDZCQUFHO0FBQ2xCLFlBQUksY0FBYyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7QUFDakMsWUFBSSxlQUFlLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQzs7QUFFdEMsWUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztBQUNoQyxZQUFJLGNBQWMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDO0FBQ3RDLFlBQUksV0FBVyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7QUFDaEMsWUFBSSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDOztBQUU1QyxZQUFJLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDcEMsWUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7QUFDekIsWUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7QUFDdEIsWUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUM7O0FBRTNCLFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO3lCQUNQLElBQUksQ0FBQyxTQUFTLEVBQUU7Ozs7WUFBbEMsSUFBSTtZQUFFLFFBQVE7QUFDbkIsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7O0FBRTlCLFlBQUksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxlQUFlLENBQUMsQ0FBQzs7QUFFaEQsWUFBSSxDQUFDLFFBQVEsR0FBRyxXQUFXLENBQUM7QUFDNUIsWUFBSSxDQUFDLFdBQVcsR0FBRyxjQUFjLENBQUM7QUFDbEMsWUFBSSxDQUFDLFFBQVEsR0FBRyxXQUFXLENBQUM7QUFDNUIsWUFBSSxDQUFDLGNBQWMsR0FBRyxpQkFBaUIsQ0FBQztBQUN4QyxZQUFJLENBQUMsTUFBTSxHQUFHLGNBQWMsQ0FBQztBQUM3QixlQUFPLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO09BQ3pCOzs7O0FBRUQsYUFBUzthQUFBLHFCQUFvQjtZQUFuQixTQUFTLGdDQUFHLEtBQUs7QUFDekIsWUFBSSxVQUFVLEdBQUcsRUFBRSxDQUFDO0FBQ3BCLFlBQUksVUFBVSxHQUFHLEVBQUUsQ0FBQztBQUNwQixZQUFJLGlCQUFpQixHQUFHLElBQUksQ0FBQztBQUM3QixZQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQzNCLFlBQUksZUFBZSxHQUFHLElBQUksQ0FBQztBQUMzQixlQUFPLElBQUksRUFBRTtBQUNYLGNBQUksU0FBUyxFQUFFO0FBQ2IsZ0JBQUksSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFO0FBQ2Qsb0JBQU07YUFDUDtXQUNGLE1BQU07QUFDTCxnQkFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUNoQyxvQkFBTTthQUNQO1dBQ0Y7QUFDRCxjQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO0FBQzNCLGNBQUksSUFBSSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDO0FBQzVCLGNBQUksZUFBZSxHQUFHLEtBQUssWUFBWSxrQkFBa0IsQ0FBQztBQUMxRCxjQUFJLElBQUksR0FBRyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDakMsY0FBSSxpQkFBaUIsRUFBRTtBQUNyQixnQkFBSSxlQUFlLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxxQkFBcUIsSUFDdEQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEtBQUsseUJBQXlCLEVBQUU7QUFDdEQsa0JBQUksSUFBSSxLQUFLLGdCQUFnQixJQUFJLElBQUksS0FBSyxjQUFjLEVBQUU7QUFDeEQsd0JBQVEsR0FBRyxJQUFJLENBQUM7QUFDaEIsb0JBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO0FBQ25CLG9CQUFJLGVBQWUsSUFBSSxJQUFJLEVBQUU7QUFDM0Isd0JBQU0sSUFBSSxDQUFDLG9CQUFvQixDQUFDLGVBQWUsRUFBRSxhQUFhLENBQUMsb0JBQW9CLENBQUMsQ0FBQztpQkFDdEY7ZUFDRixNQUFNLElBQUksZUFBZSxJQUFJLElBQUksSUFBSSxLQUFLLENBQUMsS0FBSyxFQUFFO0FBQ2pELCtCQUFlLEdBQUcsS0FBSyxDQUFDO2VBQ3pCO0FBQ0Qsd0JBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ3pELE1BQU07QUFDTCwrQkFBaUIsR0FBRyxLQUFLLENBQUM7QUFDMUIsd0JBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDdkI7V0FDRixNQUFNO0FBQ0wsc0JBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7V0FDdkI7U0FDRjs7QUFFRCxlQUFPLENBQUMsSUFBSSxLQUFLLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSxVQUFVLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztPQUNuRTs7OztBQUdELGtCQUFjO2FBQUEsMEJBQUc7QUFDZixZQUFJLGVBQWUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDO0FBQ3RDLFlBQUksSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFO0FBQ2QsZ0JBQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUM3QztBQUNELGdCQUFRLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSTtBQUN6QixlQUFLLFNBQVMsQ0FBQyxTQUFTO0FBQ3RCLG1CQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLEVBQUUsZUFBZSxDQUFDLENBQUM7QUFBQSxBQUN4RSxlQUFLLFNBQVMsQ0FBQyxNQUFNO0FBQ25CLG1CQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLEVBQUUsZUFBZSxDQUFDLENBQUM7QUFBQSxBQUN4RSxlQUFLLFNBQVMsQ0FBQyxNQUFNO0FBQ25CLG1CQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLHdCQUF3QixFQUFFLEVBQUUsZUFBZSxDQUFDLENBQUM7QUFBQSxBQUM3RSxlQUFLLFNBQVMsQ0FBQyxLQUFLO0FBQ2xCLG1CQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLEVBQUUsZUFBZSxDQUFDLENBQUM7QUFBQSxBQUN4RSxlQUFLLFNBQVMsQ0FBQyxRQUFRO0FBQ3JCLG1CQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLHNCQUFzQixFQUFFLEVBQUUsZUFBZSxDQUFDLENBQUM7QUFBQSxBQUMzRSxlQUFLLFNBQVMsQ0FBQyxRQUFRO0FBQ3JCLG1CQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLHNCQUFzQixFQUFFLEVBQUUsZUFBZSxDQUFDLENBQUM7QUFBQSxBQUMzRSxlQUFLLFNBQVMsQ0FBQyxFQUFFO0FBQ2YsbUJBQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMscUJBQXFCLEVBQUUsRUFBRSxlQUFlLENBQUMsQ0FBQztBQUFBLEFBQzFFLGVBQUssU0FBUyxDQUFDLEdBQUc7QUFDaEIsbUJBQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsRUFBRSxlQUFlLENBQUMsQ0FBQztBQUFBLEFBQ3RFLGVBQUssU0FBUyxDQUFDLFFBQVE7QUFDckIsbUJBQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxFQUFFLGVBQWUsQ0FBQyxDQUFDO0FBQUEsQUFDdkUsZUFBSyxTQUFTLENBQUMsRUFBRTtBQUNmLG1CQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLEVBQUUsZUFBZSxDQUFDLENBQUM7QUFBQSxBQUNyRSxlQUFLLFNBQVMsQ0FBQyxNQUFNO0FBQ25CLG1CQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLEVBQUUsZUFBZSxDQUFDLENBQUM7QUFBQSxBQUN6RSxlQUFLLFNBQVMsQ0FBQyxNQUFNO0FBQ25CLG1CQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLEVBQUUsZUFBZSxDQUFDLENBQUM7QUFBQSxBQUN6RSxlQUFLLFNBQVMsQ0FBQyxLQUFLO0FBQ2xCLG1CQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLEVBQUUsZUFBZSxDQUFDLENBQUM7QUFBQSxBQUN4RSxlQUFLLFNBQVMsQ0FBQyxHQUFHO0FBQ2hCLG1CQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLEVBQUUsZUFBZSxDQUFDLENBQUM7QUFBQSxBQUN0RSxlQUFLLFNBQVMsQ0FBQyxHQUFHO0FBQUMsQUFDbkIsZUFBSyxTQUFTLENBQUMsR0FBRztBQUFDLEFBQ25CLGVBQUssU0FBUyxDQUFDLEtBQUs7QUFDbEIsbUJBQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsaUNBQWlDLEVBQUUsRUFBRSxlQUFlLENBQUMsQ0FBQztBQUFBLEFBQ3RGLGVBQUssU0FBUyxDQUFDLEtBQUs7QUFDbEIsbUJBQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxlQUFlLENBQUMsQ0FBQztBQUFBLEFBQ3hFLGVBQUssU0FBUyxDQUFDLElBQUk7QUFDakIsbUJBQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsRUFBRSxlQUFlLENBQUMsQ0FBQztBQUFBLEFBQ3ZFO0FBQ0E7QUFDRSxrQkFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDOzs7QUFHbEMsa0JBQUksSUFBSSxDQUFDLElBQUksS0FBSyxzQkFBc0IsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUN2RSxvQkFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ1gsb0JBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQztBQUNyQyxvQkFBSSxDQUFBLEdBQUUsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLEVBQUU7QUFDOUMsd0JBQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztpQkFDakY7O0FBRUQsb0JBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDO0FBQzFCLG9CQUFJLFdBQVcsR0FBRyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDeEMsdUJBQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUMxQix1QkFBTyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksS0FBSyxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsV0FBVyxDQUFDLEVBQUUsZUFBZSxDQUFDLENBQUM7ZUFDckcsTUFBTTtBQUNMLG9CQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztBQUN4Qix1QkFBTyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksS0FBSyxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxFQUFFLGVBQWUsQ0FBQyxDQUFDO2VBQ2hGO2FBQ0Y7QUFBQSxTQUNGO09BRUY7Ozs7QUFFRCwyQkFBdUI7YUFBQSxtQ0FBRztBQUN4QixZQUFJLGVBQWUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDOztBQUV0QyxZQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDdkIsWUFBSSxFQUFFLEtBQUssWUFBWSxlQUFlLENBQUEsQUFBQyxFQUFFO0FBQ3ZDLGdCQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUNwQzs7QUFFRCxlQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxLQUFLLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxlQUFlLENBQUMsQ0FBQztPQUM5RTs7OztBQUVELHVCQUFtQjthQUFBLCtCQUFHO0FBQ3BCLFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ2pDLGVBQU8sSUFBSSxLQUFLLENBQUMsY0FBYyxFQUFBLENBQUM7T0FDakM7Ozs7QUFFRCx1QkFBbUI7YUFBQSwrQkFBRztBQUNwQixlQUFPLElBQUksS0FBSyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztPQUNwRDs7OztBQUVELDRCQUF3QjthQUFBLG9DQUFHO0FBQ3pCLFlBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztBQUNsQyxZQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztBQUN4QixlQUFPLElBQUksS0FBSyxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxDQUFDO09BQzVDOzs7O0FBRUQsdUJBQW1CO2FBQUEsK0JBQUc7QUFDcEIsWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztBQUMzQixZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQzs7O0FBRzdCLFlBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLElBQUksU0FBUyxDQUFDLFNBQVMsRUFBRTtBQUM5QyxjQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7O0FBRVgsY0FBSSxFQUFFLElBQUksQ0FBQyxXQUFXLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQSxBQUFDLEVBQUU7QUFDeEMsa0JBQU0sSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssRUFBRSxhQUFhLENBQUMsYUFBYSxDQUFDLENBQUM7V0FDckU7O0FBRUQsaUJBQU8sSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3ZDOztBQUVELFlBQUksSUFBSSxDQUFDLDJCQUEyQixFQUFFO0FBQ3BDLGNBQUksRUFBRSxJQUFJLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUEsQUFBQyxFQUFFO0FBQ3hDLGtCQUFNLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1dBQ3JFOztBQUVELGlCQUFPLElBQUksS0FBSyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUN2Qzs7QUFFRCxZQUFJLEtBQUssR0FBRyxJQUFJLENBQUM7QUFDakIsWUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksSUFBSSxTQUFTLENBQUMsVUFBVSxFQUFFO0FBQy9DLGVBQUssR0FBRyxJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQzs7QUFFdkMsY0FBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUM7QUFDM0IsY0FBSSxDQUFDLENBQUEsR0FBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsRUFBRTtBQUMvQyxrQkFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1dBQ2pFO1NBQ0Y7O0FBRUQsWUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7O0FBRXhCLFlBQUksS0FBSyxJQUFJLElBQUksSUFBSSxFQUFFLElBQUksQ0FBQyxXQUFXLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQSxBQUFDLEVBQUU7QUFDekQsZ0JBQU0sSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssRUFBRSxhQUFhLENBQUMsYUFBYSxDQUFDLENBQUM7U0FDckU7O0FBRUQsZUFBTyxJQUFJLEtBQUssQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7T0FDeEM7Ozs7QUFFRCwwQkFBc0I7YUFBQSxrQ0FBRztBQUN2QixZQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO0FBQzNCLFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDOzs7QUFHaEMsWUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksSUFBSSxTQUFTLENBQUMsU0FBUyxFQUFFO0FBQzlDLGNBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUNYLGNBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFO0FBQ3JCLGtCQUFNLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLGdCQUFnQixDQUFDLENBQUM7V0FDeEU7O0FBRUQsaUJBQU8sSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDMUM7O0FBRUQsWUFBSSxJQUFJLENBQUMsMkJBQTJCLEVBQUU7QUFDcEMsY0FBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUU7QUFDckIsa0JBQU0sSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssRUFBRSxhQUFhLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztXQUN4RTs7QUFFRCxpQkFBTyxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUMxQzs7QUFFRCxZQUFJLEtBQUssR0FBRyxJQUFJLENBQUM7QUFDakIsWUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksSUFBSSxTQUFTLENBQUMsVUFBVSxFQUFFO0FBQy9DLGVBQUssR0FBRyxJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQzs7QUFFdkMsY0FBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUM7QUFDM0IsY0FBSSxDQUFDLENBQUEsR0FBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsRUFBRTtBQUMvQyxrQkFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1dBQ2pFO1NBQ0Y7O0FBRUQsWUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7QUFDeEIsWUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUU7QUFDckIsZ0JBQU0sSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssRUFBRSxhQUFhLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztTQUN4RTs7QUFFRCxlQUFPLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFDO09BQzNDOzs7O0FBR0QsMEJBQXNCO2FBQUEsa0NBQUc7QUFDdkIsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDaEMsWUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7QUFDeEIsZUFBTyxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsRUFBQSxDQUFDO09BQ3BDOzs7O0FBRUQseUJBQXFCO2FBQUEsaUNBQUc7QUFDdEIsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDMUIsWUFBSSxjQUFjLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQztBQUN0QyxZQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQzs7QUFFeEIsWUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQ2pDLFlBQUksQ0FBQyxXQUFXLEdBQUcsY0FBYyxDQUFDOztBQUVsQyxZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUM3QixZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM5QixZQUFJLElBQUksR0FBRyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7QUFDbEMsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUIsWUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsRUFBRTtBQUNuQyxjQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7U0FDWjs7QUFFRCxlQUFPLElBQUksS0FBSyxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztPQUMvQzs7OztBQWlJRCxxQkFBaUI7YUFBQSw2QkFBRztBQUNsQixZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUMzQixZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM5QixZQUFJLElBQUksR0FBRyxJQUFJLENBQUM7QUFDaEIsWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDO0FBQ2pCLFlBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEVBQUU7QUFDbkMsY0FBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ1gsY0FBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxFQUFFO0FBQ3BDLGdCQUFJLEdBQUcsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1dBQy9CO0FBQ0QsY0FBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDakMsY0FBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQ2pDLGlCQUFLLEdBQUcsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1dBQ2hDO0FBQ0QsaUJBQU8sSUFBSSxLQUFLLENBQUMsWUFBWSxDQUN6QixJQUFJLEVBQ0osSUFBSSxFQUNKLEtBQUssRUFDTCxJQUFJLENBQUMsNEJBQTRCLEVBQUUsQ0FDdEMsQ0FBQztTQUNILE1BQU07QUFDTCxjQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFO0FBQzFELGdCQUFJLGVBQWUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO0FBQ25DLGdCQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztBQUNyQixnQkFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUM7QUFDL0MsZ0JBQUksQ0FBQyxPQUFPLEdBQUcsZUFBZSxDQUFDOztBQUUvQixnQkFBSSxRQUFRLENBQUMsV0FBVyxDQUFDLE1BQU0sS0FBSyxDQUFDLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUEsQUFBQyxFQUFFO0FBQy9GLGtCQUFJLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsR0FDakMsS0FBSyxDQUFDLGNBQWMsR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDO0FBQzlDLGtCQUFJLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLElBQUksRUFBRTtBQUN4QyxzQkFBTSxJQUFJLElBQUksS0FBSyxDQUFDLGNBQWMsR0FDaEMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsdUJBQXVCLENBQUMsR0FDdkQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsdUJBQXVCLENBQUMsQ0FBQztlQUMzRDtBQUNELGtCQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDWCxtQkFBSyxHQUFHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztBQUMvQixxQkFBTyxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyw0QkFBNEIsRUFBRSxDQUFDLENBQUM7YUFDdkUsTUFBTTtBQUNMLGtCQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNqQyxrQkFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxFQUFFO0FBQ3BDLG9CQUFJLEdBQUcsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO2VBQy9CO0FBQ0Qsa0JBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ2pDLGtCQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUU7QUFDakMscUJBQUssR0FBRyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7ZUFDaEM7QUFDRCxxQkFBTyxJQUFJLEtBQUssQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLDRCQUE0QixFQUFFLENBQUMsQ0FBQzthQUMzRjtXQUNGLE1BQU07QUFDTCxnQkFBSSxlQUFlLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztBQUNuQyxnQkFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7QUFDckIsZ0JBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztBQUNsQyxnQkFBSSxDQUFDLE9BQU8sR0FBRyxlQUFlLENBQUM7O0FBRS9CLGdCQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxFQUFFO0FBQ3hELGtCQUFJLENBQUMsTUFBTSxDQUFDLDZCQUE2QixDQUFDLElBQUksQ0FBQyxFQUFFO0FBQy9DLHNCQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLHFCQUFxQixDQUFDLENBQUM7ZUFDN0Q7O0FBRUQsa0JBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxHQUNqQyxLQUFLLENBQUMsY0FBYyxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUM7O0FBRTlDLGtCQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDWCxtQkFBSyxHQUFHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQzs7QUFFL0IscUJBQU8sSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsNEJBQTRCLEVBQUUsQ0FBQyxDQUFDO2FBQ25FLE1BQU07QUFDTCxrQkFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDakMsa0JBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsRUFBRTtBQUNwQyxvQkFBSSxHQUFHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztlQUMvQjtBQUNELGtCQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNqQyxrQkFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQ2pDLHFCQUFLLEdBQUcsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO2VBQ2hDO0FBQ0QscUJBQU8sSUFBSSxLQUFLLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyw0QkFBNEIsRUFBRSxDQUFDLENBQUM7YUFDdkY7V0FDRjtTQUNGO09BQ0Y7Ozs7QUFFRCxnQ0FBNEI7YUFBQSx3Q0FBRztBQUM3QixZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM5QixZQUFJLGNBQWMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDO0FBQ3RDLFlBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO0FBQ3hCLFlBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztBQUNqQyxZQUFJLENBQUMsV0FBVyxHQUFHLGNBQWMsQ0FBQztBQUNsQyxlQUFPLElBQUksQ0FBQztPQUNiOzs7O0FBRUQsb0JBQWdCO2FBQUEsNEJBQUc7QUFDakIsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDMUIsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUIsWUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDOztBQUVsQyxZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM5QixZQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDdkMsWUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDO0FBQ3JCLFlBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDOUIsY0FBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ1gsbUJBQVMsR0FBRyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7U0FDbkM7QUFDRCxlQUFPLElBQUksS0FBSyxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLFNBQVMsQ0FBQyxDQUFDO09BQzNEOzs7O0FBRUQsd0JBQW9CO2FBQUEsZ0NBQUc7QUFDckIsWUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDOztBQUVwQixZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM5QixZQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRTtBQUN4QixnQkFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxjQUFjLENBQUMsQ0FBQztTQUN0RDs7QUFFRCxZQUFJLElBQUksQ0FBQywyQkFBMkIsRUFBRTtBQUNwQyxpQkFBTyxJQUFJLEtBQUssQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDeEM7O0FBRUQsWUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxFQUFFO0FBQ3BDLGNBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRTtBQUNoRCxvQkFBUSxHQUFHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztXQUNuQztTQUNGOztBQUVELFlBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0FBQ3hCLGVBQU8sSUFBSSxLQUFLLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDO09BQzVDOzs7O0FBRUQsc0JBQWtCO2FBQUEsOEJBQUc7QUFDbkIsWUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO0FBQ2YsZ0JBQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztTQUN4RDs7QUFFRCxZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM1QixZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM5QixZQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7QUFDcEMsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUIsWUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDOztBQUVqQyxlQUFPLElBQUksS0FBSyxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7T0FDOUM7Ozs7QUFFRCx3QkFBb0I7YUFBQSxnQ0FBRztBQUNyQixZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM5QixZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM5QixZQUFJLFlBQVksR0FBRyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7QUFDMUMsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUIsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7O0FBRTlCLFlBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUU7QUFDaEMsY0FBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ1gsaUJBQU8sSUFBSSxLQUFLLENBQUMsZUFBZSxDQUFDLFlBQVksRUFBRSxFQUFFLENBQUMsQ0FBQztTQUNwRDtBQUNELFlBQUksV0FBVyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7QUFDaEMsWUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7O0FBRXJCLFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDOztBQUVwQyxZQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxFQUFFO0FBQ2pDLGNBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO0FBQzlDLGNBQUksZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7QUFDL0MsY0FBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsRUFBRTtBQUNqQyxrQkFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO1dBQ25FO0FBQ0QsY0FBSSxDQUFDLFFBQVEsR0FBRyxXQUFXLENBQUM7QUFDNUIsY0FBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUIsaUJBQU8sSUFBSSxLQUFLLENBQUMsMEJBQTBCLENBQUMsWUFBWSxFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztTQUNuRyxNQUFNO0FBQ0wsY0FBSSxDQUFDLFFBQVEsR0FBRyxXQUFXLENBQUM7QUFDNUIsY0FBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUIsaUJBQU8sSUFBSSxLQUFLLENBQUMsZUFBZSxDQUFDLFlBQVksRUFBRSxLQUFLLENBQUMsQ0FBQztTQUN2RDtPQUNGOzs7O0FBRUQsb0JBQWdCO2FBQUEsNEJBQUc7QUFDakIsWUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO0FBQ2hCLGVBQU8sRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUEsQUFBQyxFQUFFO0FBQ3JGLGdCQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDO1NBQ3JDO0FBQ0QsZUFBTyxNQUFNLENBQUM7T0FDZjs7OztBQUVELG1CQUFlO2FBQUEsMkJBQUc7QUFDaEIsWUFBSSxlQUFlLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztBQUN0QyxZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM1QixlQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxLQUFLLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsRUFBRSxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxFQUFFLGVBQWUsQ0FBQyxDQUFDO09BQ3JIOzs7O0FBRUQsc0JBQWtCO2FBQUEsOEJBQUc7QUFDbkIsWUFBSSxlQUFlLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztBQUN0QyxZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUMvQixlQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxLQUFLLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLEVBQUUsZUFBZSxDQUFDLENBQUM7T0FDaEc7Ozs7QUFFRCx1QkFBbUI7YUFBQSwrQkFBRztBQUNwQixZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUM3QixlQUFPLElBQUksQ0FBQyxrQ0FBa0MsRUFBRSxDQUFDO09BQ2xEOzs7O0FBRUQsc0NBQWtDO2FBQUEsOENBQUc7QUFDbkMsWUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO0FBQ2hCLGVBQU8sRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLElBQ2pGLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFBLEFBQUMsRUFBRTtBQUM5QixnQkFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FBQztTQUNwQztBQUNELGVBQU8sTUFBTSxDQUFDO09BQ2Y7Ozs7QUFFRCx1QkFBbUI7YUFBQSwrQkFBRztBQUNwQixZQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQzs7QUFFekMsWUFBSSxJQUFJLENBQUMsMkJBQTJCLEVBQUU7QUFDcEMsZ0JBQU0sSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssRUFBRSxhQUFhLENBQUMsbUJBQW1CLENBQUMsQ0FBQztTQUMzRTs7QUFFRCxZQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7O0FBRXRDLFlBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDOztBQUV4QixlQUFPLElBQUksS0FBSyxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQztPQUMzQzs7OztBQUVELHFCQUFpQjthQUFBLDZCQUFHO0FBQ2xCLFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzNCLFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQzs7QUFFOUIsWUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUMvQixjQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztBQUN0QyxjQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxFQUFFO0FBQ2pDLGdCQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDWCxnQkFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQ2xDLG1CQUFPLElBQUksS0FBSyxDQUFDLG1CQUFtQixDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUM7V0FDakU7QUFDRCxpQkFBTyxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7U0FDcEQ7O0FBRUQsWUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsRUFBRTtBQUNqQyxjQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDWCxjQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDbEMsaUJBQU8sSUFBSSxLQUFLLENBQUMsbUJBQW1CLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztTQUM5RCxNQUFNO0FBQ0wsZ0JBQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsbUJBQW1CLENBQUMsQ0FBQztTQUMzRDtPQUNGOzs7O0FBRUQscUNBQWlDO2FBQUEsNkNBQUc7QUFDbEMsWUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUM7QUFDbEQsWUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7QUFDeEIsZUFBTyxJQUFJLEtBQUssQ0FBQyw0QkFBNEIsQ0FBQyxXQUFXLENBQUMsQ0FBQztPQUM1RDs7OztBQUVELHVCQUFtQjthQUFBLCtCQUFHO0FBQ3BCLFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzdCLFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlCLGVBQU8sSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsRUFBRSxJQUFJLENBQUMsNEJBQTRCLEVBQUUsQ0FBQyxDQUFDO09BQzlGOzs7O0FBRUQsb0JBQWdCO2FBQUEsNEJBQUc7QUFDakIsWUFBSSxlQUFlLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQzs7QUFFdEMsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDN0IsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUIsWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztBQUMzQixZQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQ2hFLGdCQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUNwQzs7QUFFRCxZQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsMkJBQTJCLEVBQUUsQ0FBQzs7QUFFL0MsWUFBSSxDQUFDLE1BQU0sQ0FBQywrQkFBK0IsQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUNsRCxnQkFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDcEM7QUFDRCxhQUFLLEdBQUcsTUFBTSxDQUFDLGdDQUFnQyxDQUFDLEtBQUssQ0FBQyxDQUFDOztBQUV2RCxZQUFJLEtBQUssR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3JDLFlBQUksY0FBYyxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksRUFBRTtBQUNqQyxnQkFBTSxJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxpQkFBaUIsRUFBRSxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztTQUNoRzs7QUFFRCxZQUFJLElBQUksQ0FBQyxNQUFNLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFO0FBQy9DLGdCQUFNLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLHFCQUFxQixDQUFDLENBQUM7U0FDN0U7O0FBRUQsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7O0FBRTlCLFlBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQzs7QUFFN0IsZUFBTyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksS0FBSyxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEVBQUUsZUFBZSxDQUFDLENBQUM7T0FDL0U7Ozs7QUFFRCxjQUFVO2FBQUEsc0JBQUc7QUFDWCxZQUFJLGVBQWUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDO0FBQ3RDLFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDOztBQUU5QixZQUFJLElBQUksR0FBRyxFQUFFLENBQUM7QUFDZCxlQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUU7QUFDcEMsY0FBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUMsQ0FBQztTQUNsQztBQUNELFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDOztBQUU5QixlQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLGVBQWUsQ0FBQyxDQUFDO09BQ2xFOzs7O0FBRUQsNEJBQXdCO2FBQUEsb0NBQUc7QUFDekIsWUFBSSxlQUFlLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztBQUN0QyxZQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7OztBQUd2QixZQUFJLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxJQUFJLFNBQVMsQ0FBQyxHQUFHLEdBQUcsS0FBSyxHQUFHLEtBQUssQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDLEtBQUssR0FBRyxPQUFPLEdBQUcsS0FBSyxDQUFDO0FBQ2xHLFlBQUksV0FBVyxHQUFHLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN6RCxlQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxLQUFLLENBQUMsbUJBQW1CLENBQUMsSUFBSSxFQUFFLFdBQVcsQ0FBQyxFQUFFLGVBQWUsQ0FBQyxDQUFDO09BQzdGOzs7O0FBRUQsK0JBQTJCO2FBQUEscUNBQUMsSUFBSSxFQUFFO0FBQ2hDLFlBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztBQUNoQixlQUFPLElBQUksRUFBRTtBQUNYLGdCQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQ2hELGNBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUM5QixtQkFBTyxNQUFNLENBQUM7V0FDZjtTQUNGO09BQ0Y7Ozs7QUFFRCwyQkFBdUI7YUFBQSxpQ0FBQyxJQUFJLEVBQUU7QUFDNUIsWUFBSSxlQUFlLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztBQUN0QyxZQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDOztBQUUzQixZQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQ2hDLGdCQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDN0M7QUFDRCxZQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsMkJBQTJCLEVBQUUsQ0FBQzs7QUFFNUMsWUFBSSxDQUFDLE1BQU0sQ0FBQywrQkFBK0IsQ0FBQyxFQUFFLENBQUMsRUFBRTtBQUMvQyxnQkFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDcEM7QUFDRCxVQUFFLEdBQUcsTUFBTSxDQUFDLGdDQUFnQyxDQUFDLEVBQUUsQ0FBQyxDQUFDOztBQUVqRCxZQUFJLEtBQUssR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ2xDLFlBQUksY0FBYyxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksRUFBRTtBQUNqQyxnQkFBTSxJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxpQkFBaUIsRUFBRSxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztTQUNoRzs7QUFFRCxZQUFJLElBQUksQ0FBQyxNQUFNLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFO0FBQy9DLGdCQUFNLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1NBQ3ZFOztBQUVELFlBQUksSUFBSSxHQUFHLElBQUksQ0FBQztBQUNoQixZQUFJLElBQUksSUFBSSxPQUFPLEVBQUU7QUFDbkIsY0FBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUIsY0FBSSxHQUFHLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO1NBQ3pDLE1BQU0sSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUN2QyxjQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDWCxjQUFJLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUM7U0FDekM7QUFDRCxlQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxLQUFLLENBQUMsa0JBQWtCLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxFQUFFLGVBQWUsQ0FBQyxDQUFDO09BQ25GOzs7O0FBRUQsbUJBQWU7YUFBQSwyQkFBRztBQUNoQixZQUFJLGVBQWUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDOztBQUV0QyxZQUFJLElBQUksR0FBRyxJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQzs7QUFFNUMsWUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUMvQixpQkFBTyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRTtBQUNsQixnQkFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFO0FBQ2hDLG9CQUFNO2FBQ1A7QUFDRCxnQkFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ1gsZ0JBQUksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksS0FBSyxDQUFDLGdCQUFnQixDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUMsRUFDNUYsZUFBZSxDQUFDLENBQUM7V0FDdEI7U0FDRjtBQUNELGVBQU8sSUFBSSxDQUFDO09BQ2I7Ozs7QUFFRCw0QkFBd0I7YUFBQSxrQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFO0FBQzlDLFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDOzs7MkJBR29FLElBQUksQ0FBNUcsTUFBTTtZQUFOLE1BQU0sZ0NBQUcsSUFBSTt5QkFBMkYsSUFBSSxDQUE3RixJQUFJO1lBQUosSUFBSSw4QkFBRyxJQUFJO3dCQUE4RSxJQUFJLENBQWhGLEdBQUc7WUFBSCxHQUFHLDZCQUFHLElBQUk7eUNBQWtFLElBQUksQ0FBcEUsb0JBQW9CO1lBQXBCLG9CQUFvQiw4Q0FBRyxLQUFLOzJDQUFvQyxJQUFJLENBQXRDLHNCQUFzQjtZQUF0QixzQkFBc0IsZ0RBQUcsS0FBSztBQUN6RyxZQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssdUJBQXVCLEVBQUU7QUFDekMsY0FBSSxJQUFJLENBQUMsSUFBSSxLQUFLLHNCQUFzQixFQUFFO0FBQ3hDLGdCQUFJLEtBQUksR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQztBQUNoQyxnQkFBSSx5QkFBeUIsQ0FBQyxjQUFjLENBQUMsS0FBSSxDQUFDLEVBQUU7QUFDbEQsa0NBQW9CLEdBQUcsSUFBSSxDQUFDO0FBQzVCLGtCQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7QUFDZixzQkFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO2VBQzVEO2FBQ0Y7QUFDRCxnQkFBSSxnQkFBZ0IsQ0FBQyxLQUFJLENBQUMsRUFBRTtBQUMxQixvQ0FBc0IsR0FBRyxJQUFJLENBQUM7QUFDOUIsa0JBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtBQUNmLHNCQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLGlCQUFpQixDQUFDLENBQUM7ZUFDekQ7YUFDRjtBQUNELGdCQUFJLEdBQUcsTUFBTSxDQUFDLGdDQUFnQyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3JELGtCQUFNLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztXQUNqQixNQUFNO0FBQ0wsa0JBQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDO1dBQ3BDO1NBQ0Y7O0FBRUQsWUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRTsyQkFDUCxJQUFJLENBQUMsU0FBUyxFQUFFOzs7O2NBQWxDLElBQUk7Y0FBRSxRQUFRO0FBQ25CLGNBQUksUUFBUSxFQUFFO0FBQ1osZ0JBQUksR0FBRyxFQUFFO0FBQ1Asb0JBQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsaUJBQWlCLENBQUMsQ0FBQzthQUN6RDtBQUNELGdCQUFJLG9CQUFvQixFQUFFO0FBQ3hCLG9CQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLG9CQUFvQixDQUFDLENBQUM7YUFDNUQ7QUFDRCxnQkFBSSxzQkFBc0IsRUFBRTtBQUMxQixvQkFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO2FBQ3pEO1dBQ0Y7QUFDRCxjQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM5QixpQkFBTyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksS0FBSyxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFLGVBQWUsQ0FBQyxDQUFDO1NBQzFGLE1BQU07QUFDTCxjQUFJLElBQUksR0FBRyxJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQztBQUM1QyxpQkFBTyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksS0FBSyxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFLGVBQWUsQ0FBQyxDQUFDO1NBQzFGO09BQ0Y7Ozs7QUFFRCw2QkFBeUI7YUFBQSxxQ0FBRztBQUMxQixZQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO0FBQzNCLFlBQUksZUFBZSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7O0FBRXRDLFlBQUksSUFBSSxHQUFHLElBQUksQ0FBQywwQkFBMEIsRUFBRSxDQUFDOztBQUU3QyxZQUFJLENBQUMsSUFBSSxDQUFDLDJCQUEyQixJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFO0FBQ3BFLGlCQUFPLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLEVBQUUsZUFBZSxDQUFDLENBQUE7U0FDNUQ7O0FBRUQsWUFBSSxVQUFVLEdBQUcsS0FBSyxDQUFDO0FBQ3ZCLFlBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7QUFDOUIsZ0JBQVEsUUFBUSxDQUFDLElBQUk7QUFDbkIsZUFBSyxTQUFTLENBQUMsTUFBTTtBQUFDLEFBQ3RCLGVBQUssU0FBUyxDQUFDLGFBQWE7QUFBQyxBQUM3QixlQUFLLFNBQVMsQ0FBQyxjQUFjO0FBQUMsQUFDOUIsZUFBSyxTQUFTLENBQUMsY0FBYztBQUFDLEFBQzlCLGVBQUssU0FBUyxDQUFDLFVBQVU7QUFBQyxBQUMxQixlQUFLLFNBQVMsQ0FBQyxVQUFVO0FBQUMsQUFDMUIsZUFBSyxTQUFTLENBQUMsbUJBQW1CO0FBQUMsQUFDbkMsZUFBSyxTQUFTLENBQUMsVUFBVTtBQUFDLEFBQzFCLGVBQUssU0FBUyxDQUFDLFVBQVU7QUFBQyxBQUMxQixlQUFLLFNBQVMsQ0FBQyxVQUFVO0FBQUMsQUFDMUIsZUFBSyxTQUFTLENBQUMsVUFBVTtBQUFDLEFBQzFCLGVBQUssU0FBUyxDQUFDLFVBQVU7QUFDdkIsc0JBQVUsR0FBRyxJQUFJLENBQUM7QUFDbEIsa0JBQU07QUFBQSxTQUNUOztBQUVELFlBQUksVUFBVSxFQUFFO0FBQ2QsY0FBSSxDQUFDLE1BQU0sQ0FBQywrQkFBK0IsQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUNqRCxrQkFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1dBQ2pFO0FBQ0QsY0FBSSxHQUFHLE1BQU0sQ0FBQyxnQ0FBZ0MsQ0FBQyxJQUFJLENBQUMsQ0FBQzs7QUFFckQsY0FBSSxLQUFLLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNwQyxjQUFJLGNBQWMsQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLEVBQUU7QUFDakMsa0JBQU0sSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssRUFBRSxhQUFhLENBQUMsaUJBQWlCLEVBQUUsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7V0FDaEc7O0FBRUQsY0FBSSxJQUFJLENBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsRUFBRTtBQUMvQyxrQkFBTSxJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1dBQzdFOztBQUVELGNBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUNYLGNBQUksS0FBSyxHQUFHLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO0FBQzdDLGlCQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxLQUFLLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxFQUFFLGVBQWUsQ0FBQyxDQUFDO1NBQzVHOztBQUVELFlBQ0UsSUFBSSxDQUFDLElBQUksS0FBSyxrQkFBa0IsSUFDaEMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsVUFBQSxDQUFDO2lCQUFJLENBQUMsQ0FBQyxJQUFJLEtBQUssMkJBQTJCO1NBQUEsQ0FBQyxFQUNqRTtBQUNBLGdCQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUN2Qzs7QUFFRCxlQUFPLElBQUksQ0FBQztPQUNiOzs7O0FBRUQsOEJBQTBCO2FBQUEsc0NBQUc7QUFDM0IsWUFBSSxlQUFlLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztBQUN0QyxZQUFJLElBQUksR0FBRyxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztBQUN4QyxZQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxFQUFFO0FBQ3JDLGNBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUNYLGNBQUksZUFBZSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7QUFDbkMsY0FBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7QUFDcEIsY0FBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUM7QUFDbEQsY0FBSSxDQUFDLE9BQU8sR0FBRyxlQUFlLENBQUM7QUFDL0IsY0FBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDN0IsY0FBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUM7QUFDakQsaUJBQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLFNBQVMsQ0FBQyxFQUFFLGVBQWUsQ0FBQyxDQUFDO1NBQ3pHOztBQUVELGVBQU8sSUFBSSxDQUFDO09BQ2I7Ozs7QUFFRCxvQkFBZ0I7YUFBQSwwQkFBQyxJQUFJLEVBQUU7QUFDckIsZ0JBQVEsSUFBSTtBQUNWLGVBQUssU0FBUyxDQUFDLEVBQUU7QUFBQyxBQUNsQixlQUFLLFNBQVMsQ0FBQyxHQUFHO0FBQUMsQUFDbkIsZUFBSyxTQUFTLENBQUMsTUFBTTtBQUFDLEFBQ3RCLGVBQUssU0FBUyxDQUFDLE9BQU87QUFBQyxBQUN2QixlQUFLLFNBQVMsQ0FBQyxPQUFPO0FBQUMsQUFDdkIsZUFBSyxTQUFTLENBQUMsRUFBRTtBQUFDLEFBQ2xCLGVBQUssU0FBUyxDQUFDLEVBQUU7QUFBQyxBQUNsQixlQUFLLFNBQVMsQ0FBQyxTQUFTO0FBQUMsQUFDekIsZUFBSyxTQUFTLENBQUMsU0FBUztBQUFDLEFBQ3pCLGVBQUssU0FBUyxDQUFDLEVBQUU7QUFBQyxBQUNsQixlQUFLLFNBQVMsQ0FBQyxFQUFFO0FBQUMsQUFDbEIsZUFBSyxTQUFTLENBQUMsR0FBRztBQUFDLEFBQ25CLGVBQUssU0FBUyxDQUFDLEdBQUc7QUFBQyxBQUNuQixlQUFLLFNBQVMsQ0FBQyxVQUFVO0FBQUMsQUFDMUIsZUFBSyxTQUFTLENBQUMsR0FBRztBQUFDLEFBQ25CLGVBQUssU0FBUyxDQUFDLEdBQUc7QUFBQyxBQUNuQixlQUFLLFNBQVMsQ0FBQyxZQUFZO0FBQUMsQUFDNUIsZUFBSyxTQUFTLENBQUMsR0FBRztBQUFDLEFBQ25CLGVBQUssU0FBUyxDQUFDLEdBQUc7QUFBQyxBQUNuQixlQUFLLFNBQVMsQ0FBQyxHQUFHO0FBQUMsQUFDbkIsZUFBSyxTQUFTLENBQUMsR0FBRztBQUFDLEFBQ25CLGVBQUssU0FBUyxDQUFDLEdBQUc7QUFDaEIsbUJBQU8sSUFBSSxDQUFDO0FBQUEsQUFDZCxlQUFLLFNBQVMsQ0FBQyxFQUFFO0FBQ2YsbUJBQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztBQUFBLEFBQ3RCO0FBQ0UsbUJBQU8sS0FBSyxDQUFDO0FBQUEsU0FDaEI7T0FDRjs7OztBQUVELHlCQUFxQjthQUFBLGlDQUFHOztBQUN0QixZQUFJLElBQUksR0FBRyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztBQUN2QyxZQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQzs7QUFFbkMsWUFBSSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDdkQsWUFBSSxDQUFDLGdCQUFnQixFQUFFO0FBQ3JCLGlCQUFPLElBQUksQ0FBQztTQUNiOztBQUVELFlBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUNYLFlBQUksS0FBSyxHQUFHLEVBQUUsQ0FBQztBQUNmLGFBQUssQ0FBQyxJQUFJLENBQUMsRUFBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUosSUFBSSxFQUFFLFFBQVEsRUFBUixRQUFRLEVBQUUsVUFBVSxFQUFFLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBQyxDQUFDLENBQUM7QUFDdkcsWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7O0FBRXhDLGdCQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUM7QUFDL0Isd0JBQWdCLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDOUQsZUFBTyxnQkFBZ0IsRUFBRTtBQUN2QixjQUFJLFVBQVUsR0FBRyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7O0FBRWpELGlCQUFPLEtBQUssQ0FBQyxNQUFNLElBQUssVUFBVSxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLFVBQVUsQUFBQyxFQUFFO0FBQ3pFLGdCQUFJLFNBQVMsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztBQUN4QyxnQkFBSSxhQUFhLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQztBQUN2QyxnQkFBSSxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUM7QUFDdEIsaUJBQUssQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUNaLGlCQUFLLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FDckIsSUFBSSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLEVBQzNELFNBQVMsQ0FBQyxVQUFVLEVBQ3BCLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztXQUN0Qjs7O0FBR0QsY0FBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ1gsZUFBSyxDQUFDLElBQUksQ0FBQyxFQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFSLFFBQVEsRUFBRSxVQUFVLEVBQVYsVUFBVSxFQUFDLENBQUMsQ0FBQztBQUM3RSxlQUFLLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7O0FBRXBDLGtCQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUM7QUFDL0IsMEJBQWdCLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQ3BEOzs7QUFHRCxlQUFPLEtBQUssQ0FBQyxXQUFXLENBQ3BCLFVBQUMsSUFBSSxFQUFFLFNBQVM7aUJBQUssTUFBSyxZQUFZLENBQ2xDLElBQUksS0FBSyxDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQ3pFLFNBQVMsQ0FBQyxVQUFVLEVBQ3BCLE1BQUssVUFBVSxDQUFDO1NBQUEsRUFDcEIsS0FBSyxDQUFDLENBQUM7T0FDWjs7OztBQWtCRCx3QkFBb0I7YUFBQSxnQ0FBRztBQUNyQixZQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssSUFBSSxVQUFVLENBQUMsVUFBVSxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssSUFBSSxVQUFVLENBQUMsT0FBTyxFQUFFO0FBQ3pHLGlCQUFPLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO1NBQ3RDO0FBQ0QsWUFBSSxlQUFlLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztBQUN0QyxZQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO0FBQzlCLFlBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQzNDLGlCQUFPLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO1NBQ3RDO0FBQ0QsWUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ1gsWUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7QUFDdkMsZ0JBQVEsUUFBUSxDQUFDLElBQUk7QUFDbkIsZUFBSyxTQUFTLENBQUMsR0FBRztBQUFDLEFBQ25CLGVBQUssU0FBUyxDQUFDLEdBQUc7O0FBRWhCLGdCQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssc0JBQXNCLEVBQUU7QUFDeEMsa0JBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQ3pELHNCQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLGlCQUFpQixDQUFDLENBQUM7ZUFDekQ7YUFDRjs7QUFFRCxnQkFBSSxDQUFDLE1BQU0sQ0FBQyw2QkFBNkIsQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUMvQyxvQkFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO2FBQ2pFO0FBQ0Qsa0JBQU07QUFBQSxBQUNSLGVBQUssU0FBUyxDQUFDLE1BQU07QUFDbkIsZ0JBQUksSUFBSSxDQUFDLElBQUksS0FBSyxzQkFBc0IsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO0FBQ3ZELG9CQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxDQUFDO2FBQ3JEO0FBQ0Qsa0JBQU07QUFBQSxBQUNSO0FBQ0Usa0JBQU07QUFBQSxTQUNUOztBQUVELGVBQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxFQUFFLGVBQWUsQ0FBQyxDQUFDO09BQzdGOzs7O0FBRUQsMEJBQXNCO2FBQUEsa0NBQUc7QUFDdkIsWUFBSSxlQUFlLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQzs7QUFFdEMsWUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLG9DQUFvQyxFQUFFLENBQUM7O0FBRXZELFlBQUksSUFBSSxDQUFDLDJCQUEyQixFQUFFO0FBQ3BDLGlCQUFPLElBQUksQ0FBQztTQUNiOztBQUVELFlBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7QUFDOUIsWUFBSSxBQUFDLFFBQVEsQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDLEdBQUcsSUFBTSxRQUFRLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQyxHQUFHLEFBQUMsRUFBRTtBQUMxRSxpQkFBTyxJQUFJLENBQUM7U0FDYjtBQUNELFlBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQzs7QUFFWCxZQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssc0JBQXNCLEVBQUU7QUFDeEMsY0FBSSxJQUFJLENBQUMsTUFBTSxJQUFJLGdCQUFnQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDekQsa0JBQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsa0JBQWtCLENBQUMsQ0FBQztXQUMxRDtTQUNGO0FBQ0QsWUFBSSxDQUFDLE1BQU0sQ0FBQyw2QkFBNkIsQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUMvQyxnQkFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1NBQ2pFO0FBQ0QsZUFBTyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUUsZUFBZSxDQUFDLENBQUM7T0FDOUY7Ozs7QUFFRCx3Q0FBb0M7YUFBQSxnREFBRztBQUNyQyxZQUFJLGVBQWUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDO0FBQ3RDLFlBQUksZUFBZSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7QUFDbkMsWUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7QUFDcEIsWUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixFQUFFLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7O0FBRWpHLGVBQU8sSUFBSSxFQUFFO0FBQ1gsY0FBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUNoQyxnQkFBSSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxFQUFFLGVBQWUsQ0FBQyxDQUFDO1dBQ3JHLE1BQU0sSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUN2QyxnQkFBSSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxLQUFLLENBQUMsd0JBQXdCLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLEVBQUUsZUFBZSxDQUFDLENBQUM7V0FDakgsTUFBTSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQ3ZDLGdCQUFJLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEtBQUssQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUMsRUFBRSxlQUFlLENBQUMsQ0FBQztXQUNsSCxNQUFNO0FBQ0wsa0JBQU07V0FDUDtTQUNGOztBQUVELFlBQUksQ0FBQyxPQUFPLEdBQUcsZUFBZSxDQUFDOztBQUUvQixlQUFPLElBQUksQ0FBQztPQUNiOzs7O0FBRUQsK0JBQTJCO2FBQUEsdUNBQUc7QUFDNUIsWUFBSSxlQUFlLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQzs7QUFFdEMsWUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixFQUFFLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7O0FBRWpHLGVBQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUU7QUFDbkUsY0FBSSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQ3BCLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxHQUN4QixJQUFJLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUMsR0FDcEUsSUFBSSxLQUFLLENBQUMsc0JBQXNCLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDLEVBQUUsZUFBZSxDQUFDLENBQUM7U0FDakc7O0FBRUQsZUFBTyxJQUFJLENBQUM7T0FDYjs7OztBQUVELDBCQUFzQjthQUFBLGtDQUFHO0FBQ3ZCLFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlCLGVBQU8sSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUM7T0FDeEM7Ozs7QUFFRCx1QkFBbUI7YUFBQSwrQkFBRztBQUNwQixZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM5QixZQUFJLElBQUksR0FBRyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7QUFDbEMsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUIsZUFBTyxJQUFJLENBQUM7T0FDYjs7OztBQUVELHNCQUFrQjthQUFBLDhCQUFHO0FBQ25CLFlBQUksZUFBZSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7QUFDdEMsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDM0IsWUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLDJCQUEyQixFQUFFLENBQUM7QUFDaEQsZUFBTyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksS0FBSyxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixFQUFFLEdBQzVHLEVBQUUsQ0FBQyxFQUFFLGVBQWUsQ0FBQyxDQUFDO09BQzNCOzs7O0FBRUQsMEJBQXNCO2FBQUEsa0NBQUc7QUFDdkIsWUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUNoQyxpQkFBTyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztTQUNwQzs7QUFFRCxZQUFJLGVBQWUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDOztBQUV0QyxnQkFBUSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLO0FBQy9CLGVBQUssVUFBVSxDQUFDLEtBQUs7QUFDbkIsbUJBQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUMsRUFBRSxlQUFlLENBQUMsQ0FBQztBQUFBLEFBQ3BHLGVBQUssVUFBVSxDQUFDLGFBQWE7QUFDM0IsbUJBQU8sSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7QUFBQSxBQUNuQyxlQUFLLFVBQVUsQ0FBQyxjQUFjO0FBQzVCLG1CQUFPLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO0FBQUEsQUFDcEMsZUFBSyxVQUFVLENBQUMsT0FBTztBQUN2QjtBQUNFLGtCQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQzlCLG9CQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDWCx1QkFBTyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksS0FBSyxDQUFDLGNBQWMsRUFBQSxFQUFFLGVBQWUsQ0FBQyxDQUFDO2VBQ3JFO0FBQ0Qsa0JBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLEVBQUU7QUFDbEMsdUJBQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxFQUFFLGVBQWUsQ0FBQyxDQUFDO2VBQ3JFO0FBQ0Qsb0JBQU07YUFDUDtBQUFBLEFBQ0QsZUFBSyxVQUFVLENBQUMsY0FBYztBQUM5QjtBQUNFLGtCQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDdkIscUJBQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLFNBQVMsQ0FBQyxZQUFZLENBQUMsRUFBRSxlQUFlLENBQUMsQ0FBQzthQUNySDtBQUFBLEFBQ0QsZUFBSyxVQUFVLENBQUMsV0FBVztBQUMzQjtBQUNFLGtCQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDWCxxQkFBTyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksS0FBSyxDQUFDLHFCQUFxQixFQUFBLEVBQUUsZUFBZSxDQUFDLENBQUM7YUFDNUU7QUFBQSxBQUNEO0FBQ0UsZ0JBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUU7QUFDaEMscUJBQU8sSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7YUFDcEMsTUFBTSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQ3ZDLHFCQUFPLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO2FBQ3JDLE1BQU0sSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsRUFBRTtBQUN4RSxrQkFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ25CLGtCQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztBQUNuQyxrQkFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ3ZCLGtCQUFJO0FBQ0Ysb0JBQUksU0FBUyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzdDLHNCQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO2VBQzNFLENBQUMsT0FBTyxNQUFNLEVBQUU7QUFDZixzQkFBTSxJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO2VBQ2xGO0FBQ0QscUJBQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUUsZUFBZSxDQUFDLENBQUM7YUFDM0Y7QUFBQSxTQUNKOztBQUVELGNBQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO09BQ3pDOzs7O0FBRUQsdUJBQW1CO2FBQUEsK0JBQUc7QUFDcEIsWUFBSSxlQUFlLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztBQUN0QyxZQUFJLElBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUU7QUFDdkMsZ0JBQU0sSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsYUFBYSxDQUFDLG9CQUFvQixDQUFDLENBQUM7U0FDckY7QUFDRCxZQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDeEIsWUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLE1BQU0sS0FBSyxDQUFDLEdBQUMsQ0FBQyxHQUM1QixJQUFJLEtBQUssQ0FBQyx5QkFBeUIsRUFBQSxHQUNuQyxJQUFJLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDdEQsZUFBTyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxlQUFlLENBQUMsQ0FBQztPQUNqRDs7OztBQUVELHNCQUFrQjthQUFBLDhCQUFHO0FBQ25CLFlBQUksZUFBZSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7QUFDdEMsWUFBSSxJQUFJLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFO0FBQ3ZDLGdCQUFNLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLGFBQWEsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1NBQ3JGO0FBQ0QsWUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ3hCLGVBQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQ3hGLGVBQWUsQ0FBQyxDQUFDO09BQ3RCOzs7O0FBRUQsbUJBQWU7YUFBQSwyQkFBRztBQUNoQixZQUFJLGVBQWUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDO0FBQ3RDLGVBQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLGVBQWUsQ0FBQyxDQUFDO09BQ25GOzs7O0FBRUQscUJBQWlCO2FBQUEsNkJBQUc7QUFDbEIsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUIsWUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQ2pDLFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlCLGVBQU8sSUFBSSxDQUFDO09BQ2I7Ozs7QUFFRCxrQkFBYzthQUFBLDBCQUFHO0FBQ2YsWUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO0FBQ2hCLGVBQU8sSUFBSSxFQUFFO0FBQ1gsY0FBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsR0FBRyxFQUFFLEVBQUU7QUFDOUMsbUJBQU8sTUFBTSxDQUFDO1dBQ2Y7QUFDRCxjQUFJLGVBQWUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDO0FBQ3RDLGNBQUksR0FBRyxZQUFBLENBQUM7QUFDUixjQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxFQUFFO0FBQ2hDLGVBQUcsR0FBRyxJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQztBQUN2QyxlQUFHLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEtBQUssQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLEVBQUUsZUFBZSxDQUFDLENBQUM7V0FDeEUsTUFBTTtBQUNMLGVBQUcsR0FBRyxJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQztXQUN4QztBQUNELGdCQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ2pCLGNBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUM5QixrQkFBTTtXQUNQO1NBQ0Y7QUFDRCxlQUFPLE1BQU0sQ0FBQztPQUNmOzs7O0FBSUQsNEJBQXdCOzs7O2FBQUEsb0NBQUc7QUFDekIsWUFBSSxlQUFlLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQzs7QUFFdEMsWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDOztBQUV2QixZQUFJLEVBQUUsS0FBSyxZQUFZLG1CQUFtQixDQUFBLEFBQUMsRUFBRTtBQUMzQyxnQkFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDcEMsTUFBTTtBQUNMLGlCQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxLQUFLLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxlQUFlLENBQUMsQ0FBQztTQUM5RTtPQUNGOzs7O0FBRUQsZUFBVzthQUFBLHVCQUFHO0FBQ1osWUFBSSxJQUFJLENBQUMsMkJBQTJCLEVBQUU7QUFDcEMsZ0JBQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsMEJBQTBCLENBQUMsQ0FBQztTQUNsRTtBQUNELFlBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUNoQyxjQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUM5QjtPQUNGOzs7O0FBRUQsd0JBQW9CO2FBQUEsZ0NBQUc7O0FBQ3JCLFlBQUksSUFBSSxHQUFHLElBQUksQ0FBQztBQUNoQixZQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUMxQyxZQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQzlCLGNBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUNuQixpQkFBTztBQUNMLGdCQUFJLEVBQUUsdUJBQXVCO0FBQzdCLGtCQUFNLEVBQUUsRUFBRTtBQUNWLGdCQUFJLEVBQUUsSUFBSTtXQUNYLENBQUM7U0FDSCxNQUFNLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLEVBQUU7QUFDdkMsY0FBSSxHQUFHLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDO0FBQzNELGNBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlCLGNBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUNuQixpQkFBTztBQUNMLGdCQUFJLEVBQUUsdUJBQXVCO0FBQzdCLGtCQUFNLEVBQUUsRUFBRTtBQUNWLGdCQUFJLEVBQUUsSUFBSTtXQUNYLENBQUM7U0FDSDs7QUFFRCxZQUFJLGdCQUFnQixHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDckQsWUFBSSxlQUFlLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztBQUN0QyxZQUFJLEtBQUssR0FBRyxJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQztBQUM3QyxZQUFJLE1BQU0sR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDOztBQUVyQixlQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFO0FBQ2hDLGNBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLEVBQUU7QUFDbEMsZ0JBQUksQ0FBQyxnQkFBZ0IsRUFBRTtBQUNyQixvQkFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2FBQzdDO0FBQ0QsZ0JBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUNYLGdCQUFJLEdBQUcsSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUM7QUFDM0Qsa0JBQU07V0FDUDtBQUNELDBCQUFnQixHQUFHLGdCQUFnQixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDckUsY0FBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUM7QUFDNUMsZ0JBQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDbEIsZUFBSyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsRUFBRSxlQUFlLENBQUMsQ0FBQztTQUMxRjs7QUFFRCxZQUFJLGdCQUFnQixFQUFFO0FBQ3BCLDBCQUFnQixHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLDBDQUEwQyxDQUFDLENBQUM7U0FDcEY7O0FBRUQsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7O0FBRTlCLFlBQUksQ0FBQyxJQUFJLENBQUMsMkJBQTJCLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUU7O0FBQ3BFLGdCQUFJLENBQUMsZ0JBQWdCLEVBQUU7QUFDckIsb0JBQU0sTUFBSyxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLDZCQUE2QixDQUFDLENBQUM7YUFDckY7O0FBRUQsa0JBQU0sR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDO0FBQzdELGdCQUFJLGFBQWEsR0FBRyxFQUFFLENBQUM7QUFDdkIsa0JBQU0sQ0FBQyxPQUFPLENBQUMsVUFBQSxJQUFJLEVBQUk7QUFDckIsa0JBQUksVUFBVSxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDekMsa0JBQUksR0FBRyxHQUFHLGNBQWMsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUNyQyxrQkFBSSxHQUFHLEVBQUU7QUFDUCxzQkFBTSxNQUFLLFdBQVcsQ0FBQyxhQUFhLENBQUMsaUJBQWlCLEVBQUUsR0FBRyxDQUFDLENBQUM7ZUFDOUQ7QUFDRCwyQkFBYSxHQUFHLGFBQWEsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUE7YUFDakQsQ0FBQyxDQUFDO0FBQ0gsZ0JBQUksSUFBSSxFQUFFO0FBQ1IsMkJBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUMxQzs7QUFFRCxnQkFBSSxHQUFHLEdBQUcsY0FBYyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQ3hDLGdCQUFJLE1BQUssTUFBTSxJQUFJLEdBQUcsRUFBRTtBQUN0QixvQkFBTSxNQUFLLFdBQVcsQ0FBQyxhQUFhLENBQUMsaUJBQWlCLENBQUMsQ0FBQzthQUN6RDs7QUFFRCxnQkFBSSxzQkFBc0IsR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFDbEUsZ0JBQUksTUFBSyxNQUFNLElBQUksc0JBQXNCLEVBQUU7QUFDekMsb0JBQU0sTUFBSyxXQUFXLENBQUMsYUFBYSxDQUFDLGlCQUFpQixDQUFDLENBQUM7YUFDekQ7O0FBRUQsZ0JBQUksb0JBQW9CLEdBQUcseUJBQXlCLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDcEUsZ0JBQUksTUFBSyxNQUFNLElBQUksb0JBQW9CLEVBQUU7QUFDdkMsb0JBQU0sTUFBSyxXQUFXLENBQUMsYUFBYSxDQUFDLG9CQUFvQixDQUFDLENBQUM7YUFDNUQ7O0FBRUQ7aUJBQU87QUFDTCxvQkFBSSxFQUFFLHVCQUF1QjtBQUM3QixzQkFBTSxFQUFOLE1BQU07QUFDTixvQkFBSSxFQUFKLElBQUk7QUFDSixtQkFBRyxFQUFILEdBQUc7QUFDSCxvQ0FBb0IsRUFBcEIsb0JBQW9CO0FBQ3BCLHNDQUFzQixFQUF0QixzQkFBc0IsRUFBQztjQUFDOzs7O1NBQzNCLE1BQU07QUFDTCxjQUFJLElBQUksRUFBRTtBQUNSLGdCQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7V0FDcEI7QUFDRCxpQkFBTyxLQUFLLENBQUM7U0FDZDtPQUNGOzs7O0FBR0Qsd0JBQW9CO2FBQUEsZ0NBQUc7QUFDckIsWUFBSSxlQUFlLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQzs7QUFFdEMsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7O0FBRTlCLFlBQUksUUFBUSxHQUFHLElBQUksQ0FBQyw0QkFBNEIsRUFBRSxDQUFDOztBQUVuRCxZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQzs7QUFFOUIsZUFBTyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksS0FBSyxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsRUFBRSxlQUFlLENBQUMsQ0FBQztPQUNoRjs7OztBQUVELGdDQUE0QjthQUFBLHdDQUFHO0FBQzdCLFlBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztBQUNoQixlQUFPLElBQUksRUFBRTtBQUNYLGNBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUU7QUFDaEMsbUJBQU8sTUFBTSxDQUFDO1dBQ2Y7QUFDRCxjQUFJLEVBQUUsWUFBQSxDQUFDOztBQUVQLGNBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDL0IsZ0JBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUNYLGNBQUUsR0FBRyxJQUFJLENBQUM7V0FDWCxNQUFNO0FBQ0wsZ0JBQUksZUFBZSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7QUFDdEMsZ0JBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLEVBQUU7QUFDaEMsZ0JBQUUsR0FBRyxJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQztBQUN0QyxnQkFBRSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxLQUFLLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxFQUFFLGVBQWUsQ0FBQyxDQUFDO2FBQ3RFLE1BQU07QUFDTCxnQkFBRSxHQUFHLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO2FBQ3ZDO0FBQ0QsZ0JBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUNqQyxrQkFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDOUI7V0FDRjtBQUNELGdCQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1NBQ2pCO09BQ0Y7Ozs7QUFFRCx5QkFBcUI7YUFBQSxpQ0FBRztBQUN0QixZQUFJLGVBQWUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDOztBQUV0QyxZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQzs7QUFFOUIsWUFBSSxXQUFXLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN0QyxZQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsMEJBQTBCLENBQUMsV0FBVyxDQUFDLENBQUM7O0FBRTlELFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDOztBQUU5QixlQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLEVBQUUsZUFBZSxDQUFDLENBQUM7T0FDbkY7Ozs7QUFHRCw4QkFBMEI7YUFBQSxvQ0FBQyxXQUFXLEVBQUU7QUFDdEMsWUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO0FBQ2hCLGVBQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUNwQyxnQkFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMseUJBQXlCLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztTQUMxRDtBQUNELGVBQU8sTUFBTSxDQUFDO09BQ2Y7Ozs7QUFFRCw2QkFBeUI7YUFBQSxtQ0FBQyxXQUFXLEVBQUU7QUFDckMsWUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7QUFDMUMsWUFBSSxJQUFJLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQztBQUN6QixZQUFJLEdBQUcsR0FBRyxHQUFHLElBQUksSUFBSSxLQUFLLDJCQUEyQixHQUFHLFFBQVEsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLElBQUksR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQSxBQUFDLENBQUM7QUFDbkgsWUFBSSxLQUFLLEdBQUcsQ0FBQSxHQUFFLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsR0FBRyxDQUFDLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQzs7QUFFNUUsWUFBSSxDQUFBLEdBQUUsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsRUFBRTtBQUM1QyxjQUFJLENBQUMsS0FBSyxHQUFHLFNBQVMsQ0FBQSxLQUFNLENBQUMsRUFBRTtBQUM3QixnQkFBSSxJQUFJLEtBQUssY0FBYyxJQUFJLEdBQUcsS0FBSyxZQUFZLEVBQUU7QUFDbkQsb0JBQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsd0JBQXdCLENBQUMsQ0FBQzthQUNoRSxNQUFNLElBQUksSUFBSSxLQUFLLGNBQWMsRUFBRTtBQUNsQyxvQkFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO2FBQzlEO1dBQ0YsTUFBTTtBQUNMLGdCQUFJLElBQUksS0FBSyxjQUFjLEVBQUU7QUFDM0Isb0JBQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsc0JBQXNCLENBQUMsQ0FBQzthQUM5RCxNQUFNLElBQUksQ0FBQyxLQUFLLEdBQUcsV0FBVyxDQUFBLEtBQU0sQ0FBQyxJQUFJLElBQUksSUFBSSxRQUFRLElBQ25ELENBQUMsS0FBSyxHQUFHLFdBQVcsQ0FBQSxLQUFNLENBQUMsSUFBSSxJQUFJLElBQUksUUFBUSxFQUFFO0FBQ3RELG9CQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLGdCQUFnQixDQUFDLENBQUM7YUFDeEQ7V0FDRjtTQUNGO0FBQ0QsZ0JBQVEsSUFBSTtBQUNWLGVBQUssY0FBYztBQUNqQix1QkFBVyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssR0FBRyxTQUFTLENBQUM7QUFDckMsa0JBQU07QUFBQSxBQUNSLGVBQUssUUFBUTtBQUNYLHVCQUFXLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxHQUFHLFdBQVcsQ0FBQztBQUN2QyxrQkFBTTtBQUFBLEFBQ1IsZUFBSyxRQUFRO0FBQ1gsdUJBQVcsQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLLEdBQUcsV0FBVyxDQUFDO0FBQ3ZDLGtCQUFNO0FBQUEsU0FDVDs7QUFFRCxZQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUU7QUFDakMsY0FBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDOUI7QUFDRCxlQUFPLFFBQVEsQ0FBQztPQUNqQjs7OztBQUVELDBCQUFzQjthQUFBLGtDQUFHOztBQUV2QixZQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDOztBQUUzQixZQUFJLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRTtBQUNkLGdCQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUNwQzs7QUFFRCxZQUFJLEtBQUssWUFBWSxrQkFBa0IsRUFBRTtBQUN2QyxpQkFBTyxJQUFJLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUN0RTtBQUNELFlBQUksS0FBSyxZQUFZLG1CQUFtQixFQUFFO0FBQ3hDLGNBQUksVUFBVSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO0FBQzVDLGlCQUFPLElBQUksS0FBSyxDQUFDLGtCQUFrQixDQUFDLEVBQUUsSUFBSSxVQUFVLENBQUMsSUFBSSxLQUFLLDJCQUEyQixHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQSxBQUFDLENBQUMsQ0FBQztTQUN4SDtBQUNELFlBQUksS0FBSyxZQUFZLG1CQUFtQixFQUFFO0FBQ3hDLGlCQUFPLElBQUksS0FBSyxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUNsRTtBQUNELFlBQUksS0FBSyxDQUFDLElBQUksSUFBSSxTQUFTLENBQUMsTUFBTSxFQUFFO0FBQ2xDLGNBQUksMEJBQTBCLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixDQUFDO0FBQzlELGNBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7QUFDcEMsY0FBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUIsY0FBSSxJQUFJLENBQUMsdUJBQXVCLEVBQUU7O0FBRWhDLGdCQUFJLENBQUMsdUJBQXVCLEdBQUcsS0FBSyxDQUFDO0FBQ3JDLGdCQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztXQUN6QjtBQUNELGNBQUksSUFBSSxHQUFHLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO0FBQzVDLGNBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlCLGNBQUksQ0FBQyx1QkFBdUIsR0FBRywwQkFBMEIsQ0FBQztBQUMxRCxjQUFJLENBQUMsVUFBVSxHQUFHLGFBQWEsQ0FBQztBQUNoQyxpQkFBTyxJQUFJLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUM3Qzs7QUFFRCxjQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLHFCQUFxQixDQUFDLENBQUM7T0FDN0Q7Ozs7QUFFRCx1QkFBbUI7YUFBQSwrQkFBRztBQUNwQixZQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO0FBQzNCLFlBQUksZUFBZSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7O0FBRXRDLFlBQUksS0FBSyxDQUFDLElBQUksS0FBSyxTQUFTLENBQUMsVUFBVSxFQUFFO0FBQ3ZDLGNBQUksSUFBRyxHQUFHLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO0FBQ3hDLGNBQUksS0FBSSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUM7QUFDdkIsY0FBSSxLQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTs7QUFFckIsZ0JBQUksS0FBSyxLQUFLLEtBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFO0FBQ2xELGtCQUFHLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7QUFDcEMsa0JBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlCLGtCQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQzt1Q0FDUCxJQUFJLENBQUMsaUJBQWlCLEVBQUU7Ozs7a0JBQTFDLElBQUk7a0JBQUUsUUFBUTtBQUNuQixxQkFBTyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFHLEVBQUUsSUFBSSxDQUFDLEVBQUUsZUFBZSxDQUFDLENBQUM7YUFDeEUsTUFBTSxJQUFJLEtBQUssS0FBSyxLQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUN6RCxrQkFBRyxHQUFHLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO0FBQ3BDLGtCQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM5QixtQkFBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7QUFDdkIsa0JBQUksS0FBSyxDQUFDLElBQUksS0FBSyxTQUFTLENBQUMsVUFBVSxFQUFFO0FBQ3ZDLG9CQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM5QixzQkFBTSxJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxnQkFBZ0IsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2VBQ3pGLE1BQU07QUFDTCxvQkFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUM7QUFDM0Msb0JBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDOzBDQUNQLElBQUksQ0FBQyxpQkFBaUIsRUFBRTs7OztvQkFBMUMsSUFBSTtvQkFBRSxRQUFRO0FBQ25CLG9CQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sSUFBSSxRQUFRLENBQUEsSUFBSyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDN0Qsd0JBQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsaUJBQWlCLENBQUMsQ0FBQztpQkFDekQ7QUFDRCx1QkFBTyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFHLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxFQUFFLGVBQWUsQ0FBQyxDQUFDO2VBQy9FO2FBQ0Y7V0FDRjs7QUFFRCxjQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFO0FBQzdCLGdCQUFJLEtBQUssR0FBRyxJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQztBQUM3QyxtQkFBTyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksS0FBSyxDQUFDLFlBQVksQ0FBQyxJQUFHLEVBQUUsS0FBSyxDQUFDLEVBQUUsZUFBZSxDQUFDLENBQUM7V0FDL0UsTUFBTSxJQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQ3BDLG1CQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQzFELElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLElBQUksS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsRUFDNUQsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQ2pDLEVBQUUsZUFBZSxDQUFDLENBQUM7V0FFckIsTUFBTSxJQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQ3RDLG1CQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBRyxFQUFFLGVBQWUsQ0FBQyxDQUFDO1dBQy9DLE1BQU07QUFDTCxtQkFBTyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLElBQUksS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxlQUFlLENBQUMsQ0FBQztXQUN6RztTQUNGOztBQUVELFlBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO0FBQ3hDLFlBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUU7O0FBRTdCLGNBQUksS0FBSyxHQUFHLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO0FBQzdDLGlCQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxLQUFLLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsRUFBRSxlQUFlLENBQUMsQ0FBQztTQUMvRTtBQUNELFlBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzdCLGVBQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsZUFBZSxDQUFDLENBQUM7T0FDL0M7Ozs7QUFFRCxlQUFXO2FBQUEscUJBQUMsR0FBRyxFQUFFLGVBQWUsRUFBRTtBQUNoQyxZQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO2lDQUNYLElBQUksQ0FBQyxpQkFBaUIsRUFBRTs7OztZQUE5QyxJQUFJO0FBQ1QsZUFBTyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLFFBQVEsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsRUFBRSxlQUFlLENBQUMsQ0FBQztPQUMvRzs7OztBQUVELGlCQUFhO2FBQUEsdUJBQUMsWUFBWSxFQUFFO0FBQzFCLFlBQUksZUFBZSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7O0FBRXRDLFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDOztBQUVoQyxZQUFJLEVBQUUsR0FBRyxJQUFJLENBQUM7QUFDZCxZQUFJLE9BQU8sR0FBRyxJQUFJLENBQUM7QUFDbkIsWUFBSSxlQUFlLEdBQUcsSUFBSSxDQUFDO0FBQzNCLFlBQUksQ0FBQyxZQUFZLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUNsRCxjQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO0FBQzNCLFlBQUUsR0FBRyxJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztBQUNwQyxjQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7QUFDZixnQkFBSSxnQkFBZ0IsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDN0Isb0JBQU0sSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssRUFBRSxhQUFhLENBQUMsb0JBQW9CLENBQUMsQ0FBQzthQUM1RTtXQUNGLE1BQU07QUFDTCxnQkFBSSxnQkFBZ0IsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDN0IsNkJBQWUsR0FBRyxLQUFLLENBQUM7QUFDeEIscUJBQU8sR0FBRyxhQUFhLENBQUMsb0JBQW9CLENBQUM7YUFDOUMsTUFBTSxJQUFJLDJCQUEyQixDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUMvQyw2QkFBZSxHQUFHLEtBQUssQ0FBQztBQUN4QixxQkFBTyxHQUFHLGFBQWEsQ0FBQyxvQkFBb0IsQ0FBQzthQUM5QztXQUNGO1NBQ0Y7QUFDRCxZQUFJLElBQUksR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLGVBQWUsQ0FBQyxDQUFDOztBQUU3QyxZQUFJLElBQUksQ0FBQyxPQUFPLElBQUksSUFBSSxFQUFFO0FBQ3hCLGlCQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztTQUN4Qjs7QUFFRCxZQUFJLGNBQWMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO2lDQUNWLElBQUksQ0FBQyxpQkFBaUIsRUFBRTs7OztZQUExQyxJQUFJO1lBQUUsUUFBUTtBQUNuQixZQUFJLE9BQU8sSUFBSSxJQUFJLEVBQUU7QUFDbkIsY0FBSSxDQUFDLElBQUksQ0FBQyxNQUFNLElBQUksUUFBUSxDQUFBLElBQUssSUFBSSxDQUFDLGVBQWUsSUFBSSxJQUFJLEVBQUU7QUFDN0Qsa0JBQU0sSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsT0FBTyxDQUFDLENBQUM7V0FDaEU7QUFDRCxjQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sSUFBSSxRQUFRLENBQUEsSUFBSyxJQUFJLENBQUMsUUFBUSxJQUFJLElBQUksRUFBRTtBQUN0RCxrQkFBTSxJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztXQUN6RDtTQUNGO0FBQ0QsWUFBSSxDQUFDLE1BQU0sR0FBRyxjQUFjLENBQUM7QUFDN0IsZUFBTyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssWUFBWSxHQUFHLEtBQUssQ0FBQyxrQkFBa0IsR0FBRyxLQUFLLENBQUMsbUJBQW1CLENBQUEsQ0FBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsRUFDdkksZUFBZSxDQUFDLENBQUM7T0FDdEI7Ozs7QUFHRCxlQUFXO2FBQUEscUJBQUMsRUFBRSxFQUFFO0FBQ2QsWUFBSSxJQUFJLEdBQUcsRUFBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUMsQ0FBQztBQUNwQyxZQUFJLENBQUMsZUFBZSxHQUFHLEVBQUUsQ0FBQztBQUMxQixZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQzs7QUFFOUIsWUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQ2pDLGNBQUksS0FBSyxHQUFHLEVBQUUsQ0FBQztBQUNmLGNBQUksUUFBUSxHQUFHLEtBQUssQ0FBQzs7QUFFckIsaUJBQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEVBQUU7QUFDbEIsZ0JBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7QUFDM0IsZ0JBQUksZUFBZSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7QUFDdEMsZ0JBQUksS0FBSyxZQUFBLENBQUM7QUFDVixnQkFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsRUFBRTtBQUNoQyxtQkFBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7QUFDdkIsbUJBQUssR0FBRyxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQztBQUM1RCxzQkFBUSxHQUFHLElBQUksQ0FBQzthQUNqQixNQUFNO0FBQ0wsa0JBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUU7QUFDaEMsc0JBQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztlQUM3QztBQUNELG1CQUFLLEdBQUcsSUFBSSxDQUFDLDJCQUEyQixFQUFFLENBQUM7QUFDM0Msa0JBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUU7QUFDOUIscUJBQUssR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksS0FBSyxDQUFDLG9CQUFvQixDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUMsQ0FBQyxDQUFDO2VBQ3pHO2FBQ0Y7O0FBRUQsZ0JBQUksQ0FBQyxNQUFNLENBQUMsMENBQTBDLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDN0Qsb0JBQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDO2FBQ3BDO0FBQ0QsaUJBQUssR0FBRyxNQUFNLENBQUMsZ0NBQWdDLENBQUMsS0FBSyxDQUFDLENBQUM7O0FBRXZELGdCQUFJLFFBQVEsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3hDLGNBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQzs7QUFFL0IsZ0JBQUksY0FBYyxDQUFDLFFBQVEsQ0FBQyxJQUFJLElBQUksRUFBRTtBQUNwQyxvQkFBTSxJQUFJLENBQUMsb0JBQW9CLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxpQkFBaUIsRUFBRSxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQzthQUNuRztBQUNELGdCQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7QUFDZixrQkFBSSxRQUFRLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEVBQUU7QUFDbkMsb0JBQUksQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDO0FBQ3RCLG9CQUFJLENBQUMsT0FBTyxHQUFHLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBQztlQUNoRCxNQUFNLElBQUksY0FBYyxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksRUFBRTtBQUN4QyxvQkFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7QUFDdEIsb0JBQUksQ0FBQyxPQUFPLEdBQUcsYUFBYSxDQUFDLGlCQUFpQixDQUFDO2VBQ2hEO2FBQ0YsTUFBTSxJQUFJLElBQUksQ0FBQyxlQUFlLElBQUksSUFBSSxFQUFFO0FBQ3ZDLGtCQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsRUFBRTtBQUNuQyxvQkFBSSxDQUFDLGVBQWUsR0FBRyxLQUFLLENBQUM7QUFDN0Isb0JBQUksQ0FBQyxPQUFPLEdBQUcsYUFBYSxDQUFDLGlCQUFpQixDQUFDO2VBQ2hELE1BQU0sSUFBSSx5QkFBeUIsQ0FBQyxRQUFRLENBQUMsRUFBRTtBQUM5QyxvQkFBSSxDQUFDLGVBQWUsR0FBRyxLQUFLLENBQUM7QUFDN0Isb0JBQUksQ0FBQyxPQUFPLEdBQUcsYUFBYSxDQUFDLG9CQUFvQixDQUFDO2VBQ25ELE1BQU0sSUFBSSxjQUFjLENBQUMsS0FBSyxDQUFDLElBQUksSUFBSSxFQUFFO0FBQ3hDLG9CQUFJLENBQUMsZUFBZSxHQUFHLEtBQUssQ0FBQztBQUM3QixvQkFBSSxDQUFDLE9BQU8sR0FBRyxhQUFhLENBQUMsaUJBQWlCLENBQUM7ZUFDaEQ7YUFDRjs7QUFFRCxnQkFBSSxRQUFRLEVBQUU7QUFDWixrQkFBSSxDQUFDLElBQUksR0FBRyxLQUFLLENBQUM7QUFDbEIsb0JBQU07YUFDUDtBQUNELGdCQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN4QixnQkFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUNoQyxvQkFBTTthQUNQO0FBQ0QsZ0JBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1dBQzlCO1NBQ0Y7O0FBRUQsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUIsZUFBTyxJQUFJLENBQUM7T0FDYjs7Ozs7O1NBenNEVSxNQUFNO0dBQVMsU0FBUyIsImZpbGUiOiJzcmMvcGFyc2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3B5cmlnaHQgMjAxNCBTaGFwZSBTZWN1cml0eSwgSW5jLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIilcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCAqIGFzIFNoaWZ0IGZyb20gXCJzaGlmdC1hc3RcIjtcblxuaW1wb3J0IHtpc1Jlc3RyaWN0ZWRXb3JkLCBpc1N0cmljdE1vZGVSZXNlcnZlZFdvcmRFUzV9IGZyb20gXCIuL3V0aWxzXCI7XG5cbmltcG9ydCB7RXJyb3JNZXNzYWdlc30gZnJvbSBcIi4vZXJyb3JzXCI7XG5cbmltcG9ydCBUb2tlbml6ZXIsIHtcbiAgICBUb2tlbkNsYXNzLFxuICAgIFRva2VuVHlwZSxcbiAgICBJZGVudGlmaWVyVG9rZW4sXG4gICAgSWRlbnRpZmllckxpa2VUb2tlbixcbiAgICBOdW1lcmljTGl0ZXJhbFRva2VuLFxuICAgIFN0cmluZ0xpdGVyYWxUb2tlbn0gZnJvbSBcIi4vdG9rZW5pemVyXCI7XG5cbmNvbnN0IElOSVRfTUFTSyA9IDE7XG5jb25zdCBHRVRURVJfTUFTSyA9IDI7XG5jb25zdCBTRVRURVJfTUFTSyA9IDQ7XG5cbi8vIEVtcHR5IHBhcmFtZXRlciBsaXN0IGZvciBBcnJvd0V4cHJlc3Npb25cbmNvbnN0IEFSUk9XX0VYUFJFU1NJT05fUEFSQU1TID0gXCJDb3ZlclBhcmVudGhlc2l6ZWRFeHByZXNzaW9uQW5kQXJyb3dQYXJhbWV0ZXJMaXN0XCI7XG5cbmNvbnN0IFNUUklDVF9NT0RFX1JFU0VSVkVEX1dPUkQgPSB7XG4gIFwiaW1wbGVtZW50c1wiOiBudWxsLCBcImludGVyZmFjZVwiOiBudWxsLCBcInBhY2thZ2VcIjogbnVsbCwgXCJwcml2YXRlXCI6IG51bGwsIFwicHJvdGVjdGVkXCI6IG51bGwsXG4gIFwicHVibGljXCI6IG51bGwsIFwic3RhdGljXCI6IG51bGwsIFwieWllbGRcIjogbnVsbCwgXCJsZXRcIjogbnVsbFxufTtcblxuY29uc3QgUHJlY2VkZW5jZSA9IHtcbiAgU2VxdWVuY2U6IDAsXG4gIFlpZWxkOiAxLFxuICBBc3NpZ25tZW50OiAxLFxuICBDb25kaXRpb25hbDogMixcbiAgQXJyb3dGdW5jdGlvbjogMixcbiAgTG9naWNhbE9SOiAzLFxuICBMb2dpY2FsQU5EOiA0LFxuICBCaXR3aXNlT1I6IDUsXG4gIEJpdHdpc2VYT1I6IDYsXG4gIEJpdHdpc2VBTkQ6IDcsXG4gIEVxdWFsaXR5OiA4LFxuICBSZWxhdGlvbmFsOiA5LFxuICBCaXR3aXNlU0hJRlQ6IDEwLFxuICBBZGRpdGl2ZTogMTEsXG4gIE11bHRpcGxpY2F0aXZlOiAxMixcbiAgVW5hcnk6IDEzLFxuICBQb3N0Zml4OiAxNCxcbiAgQ2FsbDogMTUsXG4gIE5ldzogMTYsXG4gIFRhZ2dlZFRlbXBsYXRlOiAxNyxcbiAgTWVtYmVyOiAxOCxcbiAgUHJpbWFyeTogMTlcbn07XG5cbmNvbnN0IEJpbmFyeVByZWNlZGVuY2UgPSB7XG4gIFwifHxcIjogUHJlY2VkZW5jZS5Mb2dpY2FsT1IsXG4gIFwiJiZcIjogUHJlY2VkZW5jZS5Mb2dpY2FsQU5ELFxuICBcInxcIjogUHJlY2VkZW5jZS5CaXR3aXNlT1IsXG4gIFwiXlwiOiBQcmVjZWRlbmNlLkJpdHdpc2VYT1IsXG4gIFwiJlwiOiBQcmVjZWRlbmNlLkJpdHdpc2VBTkQsXG4gIFwiPT1cIjogUHJlY2VkZW5jZS5FcXVhbGl0eSxcbiAgXCIhPVwiOiBQcmVjZWRlbmNlLkVxdWFsaXR5LFxuICBcIj09PVwiOiBQcmVjZWRlbmNlLkVxdWFsaXR5LFxuICBcIiE9PVwiOiBQcmVjZWRlbmNlLkVxdWFsaXR5LFxuICBcIjxcIjogUHJlY2VkZW5jZS5SZWxhdGlvbmFsLFxuICBcIj5cIjogUHJlY2VkZW5jZS5SZWxhdGlvbmFsLFxuICBcIjw9XCI6IFByZWNlZGVuY2UuUmVsYXRpb25hbCxcbiAgXCI+PVwiOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gIFwiaW5cIjogUHJlY2VkZW5jZS5SZWxhdGlvbmFsLFxuICBcImluc3RhbmNlb2ZcIjogUHJlY2VkZW5jZS5SZWxhdGlvbmFsLFxuICBcIjw8XCI6IFByZWNlZGVuY2UuQml0d2lzZVNISUZULFxuICBcIj4+XCI6IFByZWNlZGVuY2UuQml0d2lzZVNISUZULFxuICBcIj4+PlwiOiBQcmVjZWRlbmNlLkJpdHdpc2VTSElGVCxcbiAgXCIrXCI6IFByZWNlZGVuY2UuQWRkaXRpdmUsXG4gIFwiLVwiOiBQcmVjZWRlbmNlLkFkZGl0aXZlLFxuICBcIipcIjogUHJlY2VkZW5jZS5NdWx0aXBsaWNhdGl2ZSxcbiAgXCIlXCI6IFByZWNlZGVuY2UuTXVsdGlwbGljYXRpdmUsXG4gIFwiL1wiOiBQcmVjZWRlbmNlLk11bHRpcGxpY2F0aXZlLFxufTtcblxuLyoqXG4gKlxuICogQHBhcmFtIHtbc3RyaW5nXX0gc3RyaW5nc1xuICogQHJldHVybnMge3N0cmluZz99XG4gKi9cbmZ1bmN0aW9uIGZpcnN0RHVwbGljYXRlKHN0cmluZ3MpIHtcbiAgaWYgKHN0cmluZ3MubGVuZ3RoIDwgMilcbiAgICByZXR1cm4gbnVsbDtcbiAgbGV0IG1hcCA9IHt9O1xuICBmb3IgKGxldCBjdXJzb3IgPSAwOyBjdXJzb3IgPCBzdHJpbmdzLmxlbmd0aDsgY3Vyc29yKyspIHtcbiAgICBsZXQgaWQgPSAnJCcgKyBzdHJpbmdzW2N1cnNvcl07XG4gICAgaWYgKG1hcC5oYXNPd25Qcm9wZXJ0eShpZCkpIHtcbiAgICAgIHJldHVybiBzdHJpbmdzW2N1cnNvcl07XG4gICAgfVxuICAgIG1hcFtpZF0gPSB0cnVlO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBoYXNTdHJpY3RNb2RlUmVzZXJ2ZWRXb3JkKGlkcykge1xuICByZXR1cm4gaWRzLnNvbWUoaWQgPT4gU1RSSUNUX01PREVfUkVTRVJWRURfV09SRC5oYXNPd25Qcm9wZXJ0eShpZCkpO1xufVxuXG5leHBvcnQgY2xhc3MgUGFyc2VyIGV4dGVuZHMgVG9rZW5pemVyIHtcbiAgY29uc3RydWN0b3Ioc291cmNlKSB7XG4gICAgc3VwZXIoc291cmNlKTtcbiAgICB0aGlzLmxhYmVsU2V0ID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICB0aGlzLmFsbG93SW4gPSB0cnVlO1xuICAgIHRoaXMuaW5JdGVyYXRpb24gPSBmYWxzZTtcbiAgICB0aGlzLmluU3dpdGNoID0gZmFsc2U7XG4gICAgdGhpcy5pbkZ1bmN0aW9uQm9keSA9IGZhbHNlO1xuICAgIHRoaXMucGFyYW1HZW5lcmF0b3JQYXJhbWV0ZXIgPSBmYWxzZTtcbiAgICB0aGlzLnBhcmFtWWllbGQgPSBmYWxzZTtcbiAgfVxuXG4gIGVhdCh0b2tlblR5cGUpIHtcbiAgICBpZiAodGhpcy5sb29rYWhlYWQudHlwZSA9PT0gdG9rZW5UeXBlKSB7XG4gICAgICByZXR1cm4gdGhpcy5sZXgoKTtcbiAgICB9XG4gIH1cblxuICBleHBlY3QodG9rZW5UeXBlKSB7XG4gICAgaWYgKHRoaXMubG9va2FoZWFkLnR5cGUgPT09IHRva2VuVHlwZSkge1xuICAgICAgcmV0dXJuIHRoaXMubGV4KCk7XG4gICAgfVxuICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gIH1cblxuICBtYXRjaChzdWJUeXBlKSB7XG4gICAgcmV0dXJuIHRoaXMubG9va2FoZWFkLnR5cGUgPT09IHN1YlR5cGU7XG4gIH1cblxuICBjb25zdW1lU2VtaWNvbG9uKCkge1xuICAgIC8vIENhdGNoIHRoZSB2ZXJ5IGNvbW1vbiBjYXNlIGZpcnN0OiBpbW1lZGlhdGVseSBhIHNlbWljb2xvbiAoVSswMDNCKS5cbiAgICBpZiAodGhpcy5pbmRleCA8IHRoaXMuc291cmNlLmxlbmd0aCAmJiB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCkgPT0gXCI7XCIpIHtcbiAgICAgIHRoaXMubGV4KCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5pbmRleCA9IHRoaXMubG9va2FoZWFkLnNsaWNlLnN0YXJ0O1xuICAgIGlmICh0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5TRU1JQ09MT04pKSB7XG4gICAgICB0aGlzLmxleCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5lb2YoKSAmJiAhdGhpcy5tYXRjaChUb2tlblR5cGUuUkJSQUNFKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICB9XG4gIH1cblxuICAvLyB0aGlzIGlzIGEgbm8tb3AsIHJlc2VydmVkIGZvciBmdXR1cmUgdXNlXG4gIG1hcmtMb2NhdGlvbihub2RlLCBzdGFydFRva2VuSW5kZXgsIGVuZFRva2VuSW5kZXggPSB0aGlzLnRva2VuSW5kZXgpIHtcbiAgICAvLyBUT0RPOiBtYXJrIHRoZSBzb3VyY2UgbG9jYXRpb25zLlxuICAgIHJldHVybiBub2RlO1xuICB9XG5cbiAgcGFyc2VTY3JpcHQoKSB7XG4gICAgbGV0IFtib2R5XSA9IHRoaXMucGFyc2VCb2R5KHRydWUpO1xuICAgIHJldHVybiBuZXcgU2hpZnQuU2NyaXB0KHRoaXMubWFya0xvY2F0aW9uKGJvZHksIDApKTtcbiAgfVxuXG4gIHBhcnNlRnVuY3Rpb25Cb2R5KCkge1xuICAgIGxldCBwcmV2aW91c1N0cmljdCA9IHRoaXMuc3RyaWN0O1xuICAgIGxldCBzdGFydFRva2VuSW5kZXggPSB0aGlzLnRva2VuSW5kZXg7XG5cbiAgICBsZXQgb2xkTGFiZWxTZXQgPSB0aGlzLmxhYmVsU2V0O1xuICAgIGxldCBvbGRJbkl0ZXJhdGlvbiA9IHRoaXMuaW5JdGVyYXRpb247XG4gICAgbGV0IG9sZEluU3dpdGNoID0gdGhpcy5pblN3aXRjaDtcbiAgICBsZXQgb2xkSW5GdW5jdGlvbkJvZHkgPSB0aGlzLmluRnVuY3Rpb25Cb2R5O1xuXG4gICAgdGhpcy5sYWJlbFNldCA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgdGhpcy5pbkl0ZXJhdGlvbiA9IGZhbHNlO1xuICAgIHRoaXMuaW5Td2l0Y2ggPSBmYWxzZTtcbiAgICB0aGlzLmluRnVuY3Rpb25Cb2R5ID0gdHJ1ZTtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MQlJBQ0UpO1xuICAgIGxldCBbYm9keSwgaXNTdHJpY3RdID0gdGhpcy5wYXJzZUJvZHkoKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUkJSQUNFKTtcblxuICAgIGJvZHkgPSB0aGlzLm1hcmtMb2NhdGlvbihib2R5LCBzdGFydFRva2VuSW5kZXgpO1xuXG4gICAgdGhpcy5sYWJlbFNldCA9IG9sZExhYmVsU2V0O1xuICAgIHRoaXMuaW5JdGVyYXRpb24gPSBvbGRJbkl0ZXJhdGlvbjtcbiAgICB0aGlzLmluU3dpdGNoID0gb2xkSW5Td2l0Y2g7XG4gICAgdGhpcy5pbkZ1bmN0aW9uQm9keSA9IG9sZEluRnVuY3Rpb25Cb2R5O1xuICAgIHRoaXMuc3RyaWN0ID0gcHJldmlvdXNTdHJpY3Q7XG4gICAgcmV0dXJuIFtib2R5LCBpc1N0cmljdF07XG4gIH1cblxuICBwYXJzZUJvZHkoYWNjZXB0RU9GID0gZmFsc2UpIHtcbiAgICBsZXQgZGlyZWN0aXZlcyA9IFtdO1xuICAgIGxldCBzdGF0ZW1lbnRzID0gW107XG4gICAgbGV0IHBhcnNpbmdEaXJlY3RpdmVzID0gdHJ1ZTtcbiAgICBsZXQgaXNTdHJpY3QgPSB0aGlzLnN0cmljdDtcbiAgICBsZXQgZmlyc3RSZXN0cmljdGVkID0gbnVsbDtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgaWYgKGFjY2VwdEVPRikge1xuICAgICAgICBpZiAodGhpcy5lb2YoKSkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuUkJSQUNFKSkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICAgIGxldCB0ZXh0ID0gdG9rZW4uc2xpY2UudGV4dDtcbiAgICAgIGxldCBpc1N0cmluZ0xpdGVyYWwgPSB0b2tlbiBpbnN0YW5jZW9mIFN0cmluZ0xpdGVyYWxUb2tlbjtcbiAgICAgIGxldCBzdG10ID0gdGhpcy5wYXJzZVN0YXRlbWVudCgpO1xuICAgICAgaWYgKHBhcnNpbmdEaXJlY3RpdmVzKSB7XG4gICAgICAgIGlmIChpc1N0cmluZ0xpdGVyYWwgJiYgc3RtdC50eXBlID09PSBcIkV4cHJlc3Npb25TdGF0ZW1lbnRcIiAmJlxuICAgICAgICAgICAgc3RtdC5leHByZXNzaW9uLnR5cGUgPT09IFwiTGl0ZXJhbFN0cmluZ0V4cHJlc3Npb25cIikge1xuICAgICAgICAgIGlmICh0ZXh0ID09PSBcIlxcXCJ1c2Ugc3RyaWN0XFxcIlwiIHx8IHRleHQgPT09IFwiJ3VzZSBzdHJpY3QnXCIpIHtcbiAgICAgICAgICAgIGlzU3RyaWN0ID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuc3RyaWN0ID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmIChmaXJzdFJlc3RyaWN0ZWQgIT0gbnVsbCkge1xuICAgICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aFRva2VuKGZpcnN0UmVzdHJpY3RlZCwgRXJyb3JNZXNzYWdlcy5TVFJJQ1RfT0NUQUxfTElURVJBTCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChmaXJzdFJlc3RyaWN0ZWQgPT0gbnVsbCAmJiB0b2tlbi5vY3RhbCkge1xuICAgICAgICAgICAgZmlyc3RSZXN0cmljdGVkID0gdG9rZW47XG4gICAgICAgICAgfVxuICAgICAgICAgIGRpcmVjdGl2ZXMucHVzaChuZXcgU2hpZnQuRGlyZWN0aXZlKHRleHQuc2xpY2UoMSwgLTEpKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGFyc2luZ0RpcmVjdGl2ZXMgPSBmYWxzZTtcbiAgICAgICAgICBzdGF0ZW1lbnRzLnB1c2goc3RtdCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0YXRlbWVudHMucHVzaChzdG10KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gW25ldyBTaGlmdC5GdW5jdGlvbkJvZHkoZGlyZWN0aXZlcywgc3RhdGVtZW50cyksIGlzU3RyaWN0XTtcbiAgfVxuXG5cbiAgcGFyc2VTdGF0ZW1lbnQoKSB7XG4gICAgbGV0IHN0YXJ0VG9rZW5JbmRleCA9IHRoaXMudG9rZW5JbmRleDtcbiAgICBpZiAodGhpcy5lb2YoKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICB9XG4gICAgc3dpdGNoICh0aGlzLmxvb2thaGVhZC50eXBlKSB7XG4gICAgICBjYXNlIFRva2VuVHlwZS5TRU1JQ09MT046XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih0aGlzLnBhcnNlRW1wdHlTdGF0ZW1lbnQoKSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkxCUkFDRTpcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHRoaXMucGFyc2VCbG9ja1N0YXRlbWVudCgpLCBzdGFydFRva2VuSW5kZXgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuTFBBUkVOOlxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24odGhpcy5wYXJzZUV4cHJlc3Npb25TdGF0ZW1lbnQoKSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkJSRUFLOlxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24odGhpcy5wYXJzZUJyZWFrU3RhdGVtZW50KCksIHN0YXJ0VG9rZW5JbmRleCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5DT05USU5VRTpcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHRoaXMucGFyc2VDb250aW51ZVN0YXRlbWVudCgpLCBzdGFydFRva2VuSW5kZXgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuREVCVUdHRVI6XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih0aGlzLnBhcnNlRGVidWdnZXJTdGF0ZW1lbnQoKSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkRPOlxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24odGhpcy5wYXJzZURvV2hpbGVTdGF0ZW1lbnQoKSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkZPUjpcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHRoaXMucGFyc2VGb3JTdGF0ZW1lbnQoKSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkZVTkNUSU9OOlxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24odGhpcy5wYXJzZUZ1bmN0aW9uKGZhbHNlKSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLklGOlxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24odGhpcy5wYXJzZUlmU3RhdGVtZW50KCksIHN0YXJ0VG9rZW5JbmRleCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5SRVRVUk46XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih0aGlzLnBhcnNlUmV0dXJuU3RhdGVtZW50KCksIHN0YXJ0VG9rZW5JbmRleCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5TV0lUQ0g6XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih0aGlzLnBhcnNlU3dpdGNoU3RhdGVtZW50KCksIHN0YXJ0VG9rZW5JbmRleCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5USFJPVzpcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHRoaXMucGFyc2VUaHJvd1N0YXRlbWVudCgpLCBzdGFydFRva2VuSW5kZXgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuVFJZOlxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24odGhpcy5wYXJzZVRyeVN0YXRlbWVudCgpLCBzdGFydFRva2VuSW5kZXgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuVkFSOlxuICAgICAgY2FzZSBUb2tlblR5cGUuTEVUOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQ09OU1Q6XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih0aGlzLnBhcnNlVmFyaWFibGVEZWNsYXJhdGlvblN0YXRlbWVudCgpLCBzdGFydFRva2VuSW5kZXgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuV0hJTEU6XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih0aGlzLnBhcnNlV2hpbGVTdGF0ZW1lbnQoKSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLldJVEg6XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih0aGlzLnBhcnNlV2l0aFN0YXRlbWVudCgpLCBzdGFydFRva2VuSW5kZXgpO1xuICAgICAgZGVmYXVsdDpcbiAgICAgIHtcbiAgICAgICAgbGV0IGV4cHIgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuXG4gICAgICAgIC8vIDEyLjEyIExhYmVsbGVkIFN0YXRlbWVudHM7XG4gICAgICAgIGlmIChleHByLnR5cGUgPT09IFwiSWRlbnRpZmllckV4cHJlc3Npb25cIiAmJiB0aGlzLm1hdGNoKFRva2VuVHlwZS5DT0xPTikpIHtcbiAgICAgICAgICB0aGlzLmxleCgpO1xuICAgICAgICAgIGxldCBrZXkgPSBcIiRcIiArIGV4cHIuaWRlbnRpZmllci5uYW1lO1xuICAgICAgICAgIGlmICh7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRoaXMubGFiZWxTZXQsIGtleSkpIHtcbiAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5MQUJFTF9SRURFQ0xBUkFUSU9OLCBleHByLmlkZW50aWZpZXIubmFtZSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy5sYWJlbFNldFtrZXldID0gdHJ1ZTtcbiAgICAgICAgICBsZXQgbGFiZWxlZEJvZHkgPSB0aGlzLnBhcnNlU3RhdGVtZW50KCk7XG4gICAgICAgICAgZGVsZXRlIHRoaXMubGFiZWxTZXRba2V5XTtcbiAgICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkxhYmVsZWRTdGF0ZW1lbnQoZXhwci5pZGVudGlmaWVyLCBsYWJlbGVkQm9keSksIHN0YXJ0VG9rZW5JbmRleCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5jb25zdW1lU2VtaWNvbG9uKCk7XG4gICAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5FeHByZXNzaW9uU3RhdGVtZW50KGV4cHIpLCBzdGFydFRva2VuSW5kZXgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gIH1cblxuICBwYXJzZVZhcmlhYmxlSWRlbnRpZmllcigpIHtcbiAgICBsZXQgc3RhcnRUb2tlbkluZGV4ID0gdGhpcy50b2tlbkluZGV4O1xuXG4gICAgbGV0IHRva2VuID0gdGhpcy5sZXgoKTtcbiAgICBpZiAoISh0b2tlbiBpbnN0YW5jZW9mIElkZW50aWZpZXJUb2tlbikpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0b2tlbik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5JZGVudGlmaWVyKHRva2VuLnZhbHVlKSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgfVxuXG4gIHBhcnNlRW1wdHlTdGF0ZW1lbnQoKSB7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlNFTUlDT0xPTik7XG4gICAgcmV0dXJuIG5ldyBTaGlmdC5FbXB0eVN0YXRlbWVudDtcbiAgfVxuXG4gIHBhcnNlQmxvY2tTdGF0ZW1lbnQoKSB7XG4gICAgcmV0dXJuIG5ldyBTaGlmdC5CbG9ja1N0YXRlbWVudCh0aGlzLnBhcnNlQmxvY2soKSk7XG4gIH1cblxuICBwYXJzZUV4cHJlc3Npb25TdGF0ZW1lbnQoKSB7XG4gICAgbGV0IGV4cHIgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgIHRoaXMuY29uc3VtZVNlbWljb2xvbigpO1xuICAgIHJldHVybiBuZXcgU2hpZnQuRXhwcmVzc2lvblN0YXRlbWVudChleHByKTtcbiAgfVxuXG4gIHBhcnNlQnJlYWtTdGF0ZW1lbnQoKSB7XG4gICAgbGV0IHRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkJSRUFLKTtcblxuICAgIC8vIENhdGNoIHRoZSB2ZXJ5IGNvbW1vbiBjYXNlIGZpcnN0OiBpbW1lZGlhdGVseSBhIHNlbWljb2xvbiAoVSswMDNCKS5cbiAgICBpZiAodGhpcy5sb29rYWhlYWQudHlwZSA9PSBUb2tlblR5cGUuU0VNSUNPTE9OKSB7XG4gICAgICB0aGlzLmxleCgpO1xuXG4gICAgICBpZiAoISh0aGlzLmluSXRlcmF0aW9uIHx8IHRoaXMuaW5Td2l0Y2gpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoVG9rZW4odG9rZW4sIEVycm9yTWVzc2FnZXMuSUxMRUdBTF9CUkVBSyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuZXcgU2hpZnQuQnJlYWtTdGF0ZW1lbnQobnVsbCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0KSB7XG4gICAgICBpZiAoISh0aGlzLmluSXRlcmF0aW9uIHx8IHRoaXMuaW5Td2l0Y2gpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoVG9rZW4odG9rZW4sIEVycm9yTWVzc2FnZXMuSUxMRUdBTF9CUkVBSyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuZXcgU2hpZnQuQnJlYWtTdGF0ZW1lbnQobnVsbCk7XG4gICAgfVxuXG4gICAgbGV0IGxhYmVsID0gbnVsbDtcbiAgICBpZiAodGhpcy5sb29rYWhlYWQudHlwZSA9PSBUb2tlblR5cGUuSURFTlRJRklFUikge1xuICAgICAgbGFiZWwgPSB0aGlzLnBhcnNlVmFyaWFibGVJZGVudGlmaWVyKCk7XG5cbiAgICAgIGxldCBrZXkgPSBcIiRcIiArIGxhYmVsLm5hbWU7XG4gICAgICBpZiAoIXt9Lmhhc093blByb3BlcnR5LmNhbGwodGhpcy5sYWJlbFNldCwga2V5KSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5LTk9XTl9MQUJFTCwgbGFiZWwubmFtZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5jb25zdW1lU2VtaWNvbG9uKCk7XG5cbiAgICBpZiAobGFiZWwgPT0gbnVsbCAmJiAhKHRoaXMuaW5JdGVyYXRpb24gfHwgdGhpcy5pblN3aXRjaCkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoVG9rZW4odG9rZW4sIEVycm9yTWVzc2FnZXMuSUxMRUdBTF9CUkVBSyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBTaGlmdC5CcmVha1N0YXRlbWVudChsYWJlbCk7XG4gIH1cblxuICBwYXJzZUNvbnRpbnVlU3RhdGVtZW50KCkge1xuICAgIGxldCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5DT05USU5VRSk7XG5cbiAgICAvLyBDYXRjaCB0aGUgdmVyeSBjb21tb24gY2FzZSBmaXJzdDogaW1tZWRpYXRlbHkgYSBzZW1pY29sb24gKFUrMDAzQikuXG4gICAgaWYgKHRoaXMubG9va2FoZWFkLnR5cGUgPT0gVG9rZW5UeXBlLlNFTUlDT0xPTikge1xuICAgICAgdGhpcy5sZXgoKTtcbiAgICAgIGlmICghdGhpcy5pbkl0ZXJhdGlvbikge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aFRva2VuKHRva2VuLCBFcnJvck1lc3NhZ2VzLklMTEVHQUxfQ09OVElOVUUpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbmV3IFNoaWZ0LkNvbnRpbnVlU3RhdGVtZW50KG51bGwpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCkge1xuICAgICAgaWYgKCF0aGlzLmluSXRlcmF0aW9uKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoVG9rZW4odG9rZW4sIEVycm9yTWVzc2FnZXMuSUxMRUdBTF9DT05USU5VRSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuZXcgU2hpZnQuQ29udGludWVTdGF0ZW1lbnQobnVsbCk7XG4gICAgfVxuXG4gICAgbGV0IGxhYmVsID0gbnVsbDtcbiAgICBpZiAodGhpcy5sb29rYWhlYWQudHlwZSA9PSBUb2tlblR5cGUuSURFTlRJRklFUikge1xuICAgICAgbGFiZWwgPSB0aGlzLnBhcnNlVmFyaWFibGVJZGVudGlmaWVyKCk7XG5cbiAgICAgIGxldCBrZXkgPSBcIiRcIiArIGxhYmVsLm5hbWU7XG4gICAgICBpZiAoIXt9Lmhhc093blByb3BlcnR5LmNhbGwodGhpcy5sYWJlbFNldCwga2V5KSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5LTk9XTl9MQUJFTCwgbGFiZWwubmFtZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5jb25zdW1lU2VtaWNvbG9uKCk7XG4gICAgaWYgKCF0aGlzLmluSXRlcmF0aW9uKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aFRva2VuKHRva2VuLCBFcnJvck1lc3NhZ2VzLklMTEVHQUxfQ09OVElOVUUpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgU2hpZnQuQ29udGludWVTdGF0ZW1lbnQobGFiZWwpO1xuICB9XG5cblxuICBwYXJzZURlYnVnZ2VyU3RhdGVtZW50KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5ERUJVR0dFUik7XG4gICAgdGhpcy5jb25zdW1lU2VtaWNvbG9uKCk7XG4gICAgcmV0dXJuIG5ldyBTaGlmdC5EZWJ1Z2dlclN0YXRlbWVudDtcbiAgfVxuXG4gIHBhcnNlRG9XaGlsZVN0YXRlbWVudCgpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuRE8pO1xuICAgIGxldCBvbGRJbkl0ZXJhdGlvbiA9IHRoaXMuaW5JdGVyYXRpb247XG4gICAgdGhpcy5pbkl0ZXJhdGlvbiA9IHRydWU7XG5cbiAgICBsZXQgYm9keSA9IHRoaXMucGFyc2VTdGF0ZW1lbnQoKTtcbiAgICB0aGlzLmluSXRlcmF0aW9uID0gb2xkSW5JdGVyYXRpb247XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuV0hJTEUpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MUEFSRU4pO1xuICAgIGxldCB0ZXN0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuU0VNSUNPTE9OKSkge1xuICAgICAgdGhpcy5sZXgoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFNoaWZ0LkRvV2hpbGVTdGF0ZW1lbnQoYm9keSwgdGVzdCk7XG4gIH1cblxuICBzdGF0aWMgdHJhbnNmb3JtRGVzdHJ1Y3R1cmluZ0Fzc2lnbm1lbnQobm9kZSkge1xuICAgIHN3aXRjaCAobm9kZS50eXBlKSB7XG4gICAgICBjYXNlIFwiT2JqZWN0RXhwcmVzc2lvblwiOlxuICAgICAgICByZXR1cm4gbmV3IFNoaWZ0Lk9iamVjdEJpbmRpbmcoXG4gICAgICAgICAgbm9kZS5wcm9wZXJ0aWVzLm1hcChQYXJzZXIudHJhbnNmb3JtRGVzdHJ1Y3R1cmluZ0Fzc2lnbm1lbnQpXG4gICAgICAgICk7XG4gICAgICBjYXNlIFwiRGF0YVByb3BlcnR5XCI6XG4gICAgICAgIHJldHVybiBuZXcgU2hpZnQuQmluZGluZ1Byb3BlcnR5UHJvcGVydHkoXG4gICAgICAgICAgbm9kZS5uYW1lLFxuICAgICAgICAgIFBhcnNlci50cmFuc2Zvcm1EZXN0cnVjdHVyaW5nQXNzaWdubWVudChub2RlLmV4cHJlc3Npb24pXG4gICAgICAgICk7XG4gICAgICBjYXNlIFwiU2hvcnRoYW5kUHJvcGVydHlcIjpcbiAgICAgICAgcmV0dXJuIG5ldyBTaGlmdC5CaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyKFxuICAgICAgICAgIG5ldyBTaGlmdC5CaW5kaW5nSWRlbnRpZmllcihub2RlLm5hbWUpLFxuICAgICAgICAgIG51bGxcbiAgICAgICAgKTtcbiAgICAgIGNhc2UgXCJBcnJheUV4cHJlc3Npb25cIjpcbiAgICAgICAgbGV0IGxhc3QgPSBub2RlLmVsZW1lbnRzW25vZGUuZWxlbWVudHMubGVuZ3RoIC0gMV07XG4gICAgICAgIGlmIChsYXN0ICE9IG51bGwgJiYgbGFzdC50eXBlID09PSBcIlNwcmVhZEVsZW1lbnRcIikge1xuICAgICAgICAgIHJldHVybiBuZXcgU2hpZnQuQXJyYXlCaW5kaW5nKFxuICAgICAgICAgICAgbm9kZS5lbGVtZW50cy5zbGljZSgwLCAtMSkubWFwKGUgPT4gZSAmJiBQYXJzZXIudHJhbnNmb3JtRGVzdHJ1Y3R1cmluZ0Fzc2lnbm1lbnQoZSkpLFxuICAgICAgICAgICAgbmV3IFNoaWZ0LkJpbmRpbmdJZGVudGlmaWVyKGxhc3QuZXhwcmVzc2lvbi5pZGVudGlmaWVyKVxuICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBTaGlmdC5BcnJheUJpbmRpbmcoXG4gICAgICAgICAgICBub2RlLmVsZW1lbnRzLm1hcChlID0+IGUgJiYgUGFyc2VyLnRyYW5zZm9ybURlc3RydWN0dXJpbmdBc3NpZ25tZW50KGUpKSxcbiAgICAgICAgICAgIG51bGxcbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICBjYXNlIFwiQXNzaWdubWVudEV4cHJlc3Npb25cIjpcbiAgICAgICAgcmV0dXJuIG5ldyBTaGlmdC5CaW5kaW5nV2l0aERlZmF1bHQoXG4gICAgICAgICAgUGFyc2VyLnRyYW5zZm9ybURlc3RydWN0dXJpbmdBc3NpZ25tZW50KG5vZGUuYmluZGluZyksXG4gICAgICAgICAgbm9kZS5leHByZXNzaW9uXG4gICAgICAgICk7XG4gICAgICBjYXNlIFwiSWRlbnRpZmllckV4cHJlc3Npb25cIjpcbiAgICAgICAgcmV0dXJuIG5ldyBTaGlmdC5CaW5kaW5nSWRlbnRpZmllcihub2RlLmlkZW50aWZpZXIpO1xuICAgIH1cbiAgICByZXR1cm4gbm9kZTtcbiAgfVxuXG4gIHN0YXRpYyBpc0Rlc3RydWN0dXJpbmdBc3NpZ25tZW50VGFyZ2V0KG5vZGUpIHtcbiAgICBpZiAoUGFyc2VyLmlzVmFsaWRTaW1wbGVBc3NpZ25tZW50VGFyZ2V0KG5vZGUpKVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICBzd2l0Y2ggKG5vZGUudHlwZSkge1xuICAgICAgY2FzZSBcIk9iamVjdEV4cHJlc3Npb25cIjpcbiAgICAgICAgcmV0dXJuIG5vZGUucHJvcGVydGllcy5ldmVyeShwID0+XG4gICAgICAgICAgcC50eXBlID09PSBcIkJpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXJcIiB8fFxuICAgICAgICAgIHAudHlwZSA9PT0gXCJTaG9ydGhhbmRQcm9wZXJ0eVwiIHx8XG4gICAgICAgICAgcC50eXBlID09PSBcIkRhdGFQcm9wZXJ0eVwiICYmXG4gICAgICAgICAgICBQYXJzZXIuaXNEZXN0cnVjdHVyaW5nQXNzaWdubWVudFRhcmdldFdpdGhEZWZhdWx0KHAuZXhwcmVzc2lvbilcbiAgICAgICAgKTtcbiAgICAgIGNhc2UgXCJBcnJheUV4cHJlc3Npb25cIjpcbiAgICAgICAgaWYgKG5vZGUuZWxlbWVudHMubGVuZ3RoID09PSAwKVxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgaWYgKCFub2RlLmVsZW1lbnRzLnNsaWNlKDAsIC0xKS5maWx0ZXIoZSA9PiBlICE9IG51bGwpLmV2ZXJ5KFBhcnNlci5pc0Rlc3RydWN0dXJpbmdBc3NpZ25tZW50VGFyZ2V0V2l0aERlZmF1bHQpKVxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgbGV0IGxhc3QgPSBub2RlLmVsZW1lbnRzW25vZGUuZWxlbWVudHMubGVuZ3RoIC0gMV07XG4gICAgICAgIHJldHVybiBsYXN0ICE9IG51bGwgJiYgbGFzdC50eXBlID09PSBcIlNwcmVhZEVsZW1lbnRcIlxuICAgICAgICAgID8gbGFzdC5leHByZXNzaW9uLnR5cGUgPT09IFwiSWRlbnRpZmllckV4cHJlc3Npb25cIlxuICAgICAgICAgIDogbGFzdCA9PSBudWxsIHx8IFBhcnNlci5pc0Rlc3RydWN0dXJpbmdBc3NpZ25tZW50VGFyZ2V0V2l0aERlZmF1bHQobGFzdCk7XG4gICAgICBjYXNlIFwiQXJyYXlCaW5kaW5nXCI6XG4gICAgICBjYXNlIFwiQmluZGluZ0lkZW50aWZpZXJcIjpcbiAgICAgIGNhc2UgXCJCaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyXCI6XG4gICAgICBjYXNlIFwiQmluZGluZ1Byb3BlcnR5UHJvcGVydHlcIjpcbiAgICAgIGNhc2UgXCJCaW5kaW5nV2l0aERlZmF1bHRcIjpcbiAgICAgIGNhc2UgXCJPYmplY3RCaW5kaW5nXCI6XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBzdGF0aWMgaXNEZXN0cnVjdHVyaW5nQXNzaWdubWVudFRhcmdldFdpdGhEZWZhdWx0KG5vZGUpIHtcbiAgICByZXR1cm4gUGFyc2VyLmlzRGVzdHJ1Y3R1cmluZ0Fzc2lnbm1lbnRUYXJnZXQobm9kZSkgfHxcbiAgICAgIG5vZGUudHlwZSA9PT0gXCJBc3NpZ25tZW50RXhwcmVzc2lvblwiICYmIG5vZGUub3BlcmF0b3IgPT09IFwiPVwiICYmXG4gICAgICBQYXJzZXIuaXNEZXN0cnVjdHVyaW5nQXNzaWdubWVudFRhcmdldChub2RlLmJpbmRpbmcpO1xuICB9XG5cbiAgc3RhdGljIGlzVmFsaWRTaW1wbGVBc3NpZ25tZW50VGFyZ2V0KG5vZGUpIHtcbiAgICBzd2l0Y2ggKG5vZGUudHlwZSkge1xuICAgICAgY2FzZSBcIkJpbmRpbmdJZGVudGlmaWVyXCI6XG4gICAgICBjYXNlIFwiSWRlbnRpZmllckV4cHJlc3Npb25cIjpcbiAgICAgIGNhc2UgXCJDb21wdXRlZE1lbWJlckV4cHJlc3Npb25cIjpcbiAgICAgIGNhc2UgXCJTdGF0aWNNZW1iZXJFeHByZXNzaW9uXCI6XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBzdGF0aWMgYm91bmROYW1lcyhub2RlKSB7XG4gICAgc3dpdGNoKG5vZGUudHlwZSkge1xuICAgICAgY2FzZSBcIkJpbmRpbmdJZGVudGlmaWVyXCI6XG4gICAgICAgIHJldHVybiBbbm9kZS5pZGVudGlmaWVyLm5hbWVdO1xuICAgICAgY2FzZSBcIkJpbmRpbmdXaXRoRGVmYXVsdFwiOlxuICAgICAgICByZXR1cm4gUGFyc2VyLmJvdW5kTmFtZXMobm9kZS5iaW5kaW5nKTtcbiAgICAgIGNhc2UgXCJBcnJheUJpbmRpbmdcIjoge1xuICAgICAgICBsZXQgbmFtZXMgPSBbXTtcbiAgICAgICAgbm9kZS5lbGVtZW50cy5maWx0ZXIoZSA9PiBlICE9IG51bGwpLmZvckVhY2goZSA9PiBbXS5wdXNoLmFwcGx5KG5hbWVzLCBQYXJzZXIuYm91bmROYW1lcyhlKSkpO1xuICAgICAgICBpZiAobm9kZS5yZXN0RWxlbWVudCAhPSBudWxsKSB7XG4gICAgICAgICAgbmFtZXMucHVzaChub2RlLnJlc3RFbGVtZW50LmlkZW50aWZpZXIubmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5hbWVzO1xuICAgICAgfVxuICAgICAgY2FzZSBcIk9iamVjdEJpbmRpbmdcIjoge1xuICAgICAgICBsZXQgbmFtZXMgPSBbXTtcbiAgICAgICAgbm9kZS5wcm9wZXJ0aWVzLmZvckVhY2gocCA9PiB7XG4gICAgICAgICAgc3dpdGNoIChwLnR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJCaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyXCI6XG4gICAgICAgICAgICAgIG5hbWVzLnB1c2gocC5pZGVudGlmaWVyLmlkZW50aWZpZXIubmFtZSk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIkJpbmRpbmdQcm9wZXJ0eVByb3BlcnR5XCI6XG4gICAgICAgICAgICAgIFtdLnB1c2guYXBwbHkobmFtZXMsIFBhcnNlci5ib3VuZE5hbWVzKHAuYmluZGluZykpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIC8vIGlzdGFuYnVsIGlnbm9yZSBuZXh0XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJib3VuZE5hbWVzIGNhbGxlZCBvbiBPYmplY3RCaW5kaW5nIHdpdGggaW52YWxpZCBwcm9wZXJ0eTogXCIgKyBwLnR5cGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBuYW1lcztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJDb21wdXRlZE1lbWJlckV4cHJlc3Npb25cIjpcbiAgICAgIGNhc2UgXCJTdGF0aWNNZW1iZXJFeHByZXNzaW9uXCI6XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgLy8gaXN0YW5idWwgaWdub3JlIG5leHRcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJib3VuZE5hbWVzIGNhbGxlZCBvbiBpbnZhbGlkIGFzc2lnbm1lbnQgdGFyZ2V0OiBcIiArIG5vZGUudHlwZSk7XG4gIH1cblxuICBwYXJzZUZvclN0YXRlbWVudCgpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuRk9SKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTFBBUkVOKTtcbiAgICBsZXQgdGVzdCA9IG51bGw7XG4gICAgbGV0IHJpZ2h0ID0gbnVsbDtcbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuU0VNSUNPTE9OKSkge1xuICAgICAgdGhpcy5sZXgoKTtcbiAgICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuU0VNSUNPTE9OKSkge1xuICAgICAgICB0ZXN0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5TRU1JQ09MT04pO1xuICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5SUEFSRU4pKSB7XG4gICAgICAgIHJpZ2h0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgU2hpZnQuRm9yU3RhdGVtZW50KFxuICAgICAgICAgIG51bGwsXG4gICAgICAgICAgdGVzdCxcbiAgICAgICAgICByaWdodCxcbiAgICAgICAgICB0aGlzLmdldEl0ZXJhdG9yU3RhdGVtZW50RXBpbG9ndWUoKVxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLlZBUikgfHwgdGhpcy5tYXRjaChUb2tlblR5cGUuTEVUKSkge1xuICAgICAgICBsZXQgcHJldmlvdXNBbGxvd0luID0gdGhpcy5hbGxvd0luO1xuICAgICAgICB0aGlzLmFsbG93SW4gPSBmYWxzZTtcbiAgICAgICAgbGV0IGluaXREZWNsID0gdGhpcy5wYXJzZVZhcmlhYmxlRGVjbGFyYXRpb24oKTtcbiAgICAgICAgdGhpcy5hbGxvd0luID0gcHJldmlvdXNBbGxvd0luO1xuXG4gICAgICAgIGlmIChpbml0RGVjbC5kZWNsYXJhdG9ycy5sZW5ndGggPT09IDEgJiYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLklOKSB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5PRikpKSB7XG4gICAgICAgICAgbGV0IHR5cGUgPSB0aGlzLm1hdGNoKFRva2VuVHlwZS5JTikgP1xuICAgICAgICAgICAgU2hpZnQuRm9ySW5TdGF0ZW1lbnQgOiBTaGlmdC5Gb3JPZlN0YXRlbWVudDtcbiAgICAgICAgICBpZiAoaW5pdERlY2wuZGVjbGFyYXRvcnNbMF0uaW5pdCAhPSBudWxsKSB7XG4gICAgICAgICAgICB0aHJvdyB0eXBlID09IFNoaWZ0LkZvckluU3RhdGVtZW50ID8gXG4gICAgICAgICAgICAgIHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5JTlZBTElEX1ZBUl9JTklUX0ZPUl9JTikgOlxuICAgICAgICAgICAgICB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuSU5WQUxJRF9WQVJfSU5JVF9GT1JfT0YpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLmxleCgpO1xuICAgICAgICAgIHJpZ2h0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgICAgICByZXR1cm4gbmV3IHR5cGUoaW5pdERlY2wsIHJpZ2h0LCB0aGlzLmdldEl0ZXJhdG9yU3RhdGVtZW50RXBpbG9ndWUoKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlNFTUlDT0xPTik7XG4gICAgICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5TRU1JQ09MT04pKSB7XG4gICAgICAgICAgICB0ZXN0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlNFTUlDT0xPTik7XG4gICAgICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5SUEFSRU4pKSB7XG4gICAgICAgICAgICByaWdodCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBuZXcgU2hpZnQuRm9yU3RhdGVtZW50KGluaXREZWNsLCB0ZXN0LCByaWdodCwgdGhpcy5nZXRJdGVyYXRvclN0YXRlbWVudEVwaWxvZ3VlKCkpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsZXQgcHJldmlvdXNBbGxvd0luID0gdGhpcy5hbGxvd0luO1xuICAgICAgICB0aGlzLmFsbG93SW4gPSBmYWxzZTtcbiAgICAgICAgbGV0IGluaXQgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgICB0aGlzLmFsbG93SW4gPSBwcmV2aW91c0FsbG93SW47XG5cbiAgICAgICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLklOKSB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5PRikpIHtcbiAgICAgICAgICBpZiAoIVBhcnNlci5pc1ZhbGlkU2ltcGxlQXNzaWdubWVudFRhcmdldChpbml0KSkge1xuICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLklOVkFMSURfTEhTX0lOX0ZPUl9JTik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGV0IHR5cGUgPSB0aGlzLm1hdGNoKFRva2VuVHlwZS5JTikgP1xuICAgICAgICAgICAgU2hpZnQuRm9ySW5TdGF0ZW1lbnQgOiBTaGlmdC5Gb3JPZlN0YXRlbWVudDtcblxuICAgICAgICAgIHRoaXMubGV4KCk7XG4gICAgICAgICAgcmlnaHQgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuXG4gICAgICAgICAgcmV0dXJuIG5ldyB0eXBlKGluaXQsIHJpZ2h0LCB0aGlzLmdldEl0ZXJhdG9yU3RhdGVtZW50RXBpbG9ndWUoKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlNFTUlDT0xPTik7XG4gICAgICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5TRU1JQ09MT04pKSB7XG4gICAgICAgICAgICB0ZXN0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlNFTUlDT0xPTik7XG4gICAgICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5SUEFSRU4pKSB7XG4gICAgICAgICAgICByaWdodCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBuZXcgU2hpZnQuRm9yU3RhdGVtZW50KGluaXQsIHRlc3QsIHJpZ2h0LCB0aGlzLmdldEl0ZXJhdG9yU3RhdGVtZW50RXBpbG9ndWUoKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBnZXRJdGVyYXRvclN0YXRlbWVudEVwaWxvZ3VlKCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgIGxldCBvbGRJbkl0ZXJhdGlvbiA9IHRoaXMuaW5JdGVyYXRpb247XG4gICAgdGhpcy5pbkl0ZXJhdGlvbiA9IHRydWU7XG4gICAgbGV0IGJvZHkgPSB0aGlzLnBhcnNlU3RhdGVtZW50KCk7XG4gICAgdGhpcy5pbkl0ZXJhdGlvbiA9IG9sZEluSXRlcmF0aW9uO1xuICAgIHJldHVybiBib2R5O1xuICB9XG5cbiAgcGFyc2VJZlN0YXRlbWVudCgpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuSUYpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MUEFSRU4pO1xuICAgIGxldCB0ZXN0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgIGxldCBjb25zZXF1ZW50ID0gdGhpcy5wYXJzZVN0YXRlbWVudCgpO1xuICAgIGxldCBhbHRlcm5hdGUgPSBudWxsO1xuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5FTFNFKSkge1xuICAgICAgdGhpcy5sZXgoKTtcbiAgICAgIGFsdGVybmF0ZSA9IHRoaXMucGFyc2VTdGF0ZW1lbnQoKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBTaGlmdC5JZlN0YXRlbWVudCh0ZXN0LCBjb25zZXF1ZW50LCBhbHRlcm5hdGUpO1xuICB9XG5cbiAgcGFyc2VSZXR1cm5TdGF0ZW1lbnQoKSB7XG4gICAgbGV0IGFyZ3VtZW50ID0gbnVsbDtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SRVRVUk4pO1xuICAgIGlmICghdGhpcy5pbkZ1bmN0aW9uQm9keSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLklMTEVHQUxfUkVUVVJOKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQpIHtcbiAgICAgIHJldHVybiBuZXcgU2hpZnQuUmV0dXJuU3RhdGVtZW50KG51bGwpO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuU0VNSUNPTE9OKSkge1xuICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0UpICYmICF0aGlzLmVvZigpKSB7XG4gICAgICAgIGFyZ3VtZW50ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmNvbnN1bWVTZW1pY29sb24oKTtcbiAgICByZXR1cm4gbmV3IFNoaWZ0LlJldHVyblN0YXRlbWVudChhcmd1bWVudCk7XG4gIH1cblxuICBwYXJzZVdpdGhTdGF0ZW1lbnQoKSB7XG4gICAgaWYgKHRoaXMuc3RyaWN0KSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX01PREVfV0lUSCk7XG4gICAgfVxuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLldJVEgpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MUEFSRU4pO1xuICAgIGxldCBvYmplY3QgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgIGxldCBib2R5ID0gdGhpcy5wYXJzZVN0YXRlbWVudCgpO1xuXG4gICAgcmV0dXJuIG5ldyBTaGlmdC5XaXRoU3RhdGVtZW50KG9iamVjdCwgYm9keSk7XG4gIH1cblxuICBwYXJzZVN3aXRjaFN0YXRlbWVudCgpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuU1dJVENIKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTFBBUkVOKTtcbiAgICBsZXQgZGlzY3JpbWluYW50ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTEJSQUNFKTtcblxuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0UpKSB7XG4gICAgICB0aGlzLmxleCgpO1xuICAgICAgcmV0dXJuIG5ldyBTaGlmdC5Td2l0Y2hTdGF0ZW1lbnQoZGlzY3JpbWluYW50LCBbXSk7XG4gICAgfVxuICAgIGxldCBvbGRJblN3aXRjaCA9IHRoaXMuaW5Td2l0Y2g7XG4gICAgdGhpcy5pblN3aXRjaCA9IHRydWU7XG5cbiAgICBsZXQgY2FzZXMgPSB0aGlzLnBhcnNlU3dpdGNoQ2FzZXMoKTtcblxuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5ERUZBVUxUKSkge1xuICAgICAgbGV0IHN3aXRjaERlZmF1bHQgPSB0aGlzLnBhcnNlU3dpdGNoRGVmYXVsdCgpO1xuICAgICAgbGV0IHBvc3REZWZhdWx0Q2FzZXMgPSB0aGlzLnBhcnNlU3dpdGNoQ2FzZXMoKTtcbiAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5ERUZBVUxUKSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuTVVMVElQTEVfREVGQVVMVFNfSU5fU1dJVENIKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuaW5Td2l0Y2ggPSBvbGRJblN3aXRjaDtcbiAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SQlJBQ0UpO1xuICAgICAgcmV0dXJuIG5ldyBTaGlmdC5Td2l0Y2hTdGF0ZW1lbnRXaXRoRGVmYXVsdChkaXNjcmltaW5hbnQsIGNhc2VzLCBzd2l0Y2hEZWZhdWx0LCBwb3N0RGVmYXVsdENhc2VzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5pblN3aXRjaCA9IG9sZEluU3dpdGNoO1xuICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJCUkFDRSk7XG4gICAgICByZXR1cm4gbmV3IFNoaWZ0LlN3aXRjaFN0YXRlbWVudChkaXNjcmltaW5hbnQsIGNhc2VzKTtcbiAgICB9XG4gIH1cblxuICBwYXJzZVN3aXRjaENhc2VzKCkge1xuICAgIGxldCByZXN1bHQgPSBbXTtcbiAgICB3aGlsZSAoISh0aGlzLmVvZigpIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLlJCUkFDRSkgfHwgdGhpcy5tYXRjaChUb2tlblR5cGUuREVGQVVMVCkpKSB7XG4gICAgICByZXN1bHQucHVzaCh0aGlzLnBhcnNlU3dpdGNoQ2FzZSgpKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHBhcnNlU3dpdGNoQ2FzZSgpIHtcbiAgICBsZXQgc3RhcnRUb2tlbkluZGV4ID0gdGhpcy50b2tlbkluZGV4O1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5DQVNFKTtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlN3aXRjaENhc2UodGhpcy5wYXJzZUV4cHJlc3Npb24oKSwgdGhpcy5wYXJzZVN3aXRjaENhc2VCb2R5KCkpLCBzdGFydFRva2VuSW5kZXgpO1xuICB9XG5cbiAgcGFyc2VTd2l0Y2hEZWZhdWx0KCkge1xuICAgIGxldCBzdGFydFRva2VuSW5kZXggPSB0aGlzLnRva2VuSW5kZXg7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkRFRkFVTFQpO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuU3dpdGNoRGVmYXVsdCh0aGlzLnBhcnNlU3dpdGNoQ2FzZUJvZHkoKSksIHN0YXJ0VG9rZW5JbmRleCk7XG4gIH1cblxuICBwYXJzZVN3aXRjaENhc2VCb2R5KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5DT0xPTik7XG4gICAgcmV0dXJuIHRoaXMucGFyc2VTdGF0ZW1lbnRMaXN0SW5Td2l0Y2hDYXNlQm9keSgpO1xuICB9XG5cbiAgcGFyc2VTdGF0ZW1lbnRMaXN0SW5Td2l0Y2hDYXNlQm9keSgpIHtcbiAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgd2hpbGUgKCEodGhpcy5lb2YoKSB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0UpIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLkRFRkFVTFQpXG4gICAgfHwgdGhpcy5tYXRjaChUb2tlblR5cGUuQ0FTRSkpKSB7XG4gICAgICByZXN1bHQucHVzaCh0aGlzLnBhcnNlU3RhdGVtZW50KCkpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgcGFyc2VUaHJvd1N0YXRlbWVudCgpIHtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmV4cGVjdChUb2tlblR5cGUuVEhST1cpO1xuXG4gICAgaWYgKHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0KSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aFRva2VuKHRva2VuLCBFcnJvck1lc3NhZ2VzLk5FV0xJTkVfQUZURVJfVEhST1cpO1xuICAgIH1cblxuICAgIGxldCBhcmd1bWVudCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG5cbiAgICB0aGlzLmNvbnN1bWVTZW1pY29sb24oKTtcblxuICAgIHJldHVybiBuZXcgU2hpZnQuVGhyb3dTdGF0ZW1lbnQoYXJndW1lbnQpO1xuICB9XG5cbiAgcGFyc2VUcnlTdGF0ZW1lbnQoKSB7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlRSWSk7XG4gICAgbGV0IGJsb2NrID0gdGhpcy5wYXJzZUJsb2NrKCk7XG5cbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuQ0FUQ0gpKSB7XG4gICAgICBsZXQgaGFuZGxlciA9IHRoaXMucGFyc2VDYXRjaENsYXVzZSgpO1xuICAgICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkZJTkFMTFkpKSB7XG4gICAgICAgIHRoaXMubGV4KCk7XG4gICAgICAgIGxldCBmaW5hbGl6ZXIgPSB0aGlzLnBhcnNlQmxvY2soKTtcbiAgICAgICAgcmV0dXJuIG5ldyBTaGlmdC5UcnlGaW5hbGx5U3RhdGVtZW50KGJsb2NrLCBoYW5kbGVyLCBmaW5hbGl6ZXIpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBTaGlmdC5UcnlDYXRjaFN0YXRlbWVudChibG9jaywgaGFuZGxlcik7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkZJTkFMTFkpKSB7XG4gICAgICB0aGlzLmxleCgpO1xuICAgICAgbGV0IGZpbmFsaXplciA9IHRoaXMucGFyc2VCbG9jaygpO1xuICAgICAgcmV0dXJuIG5ldyBTaGlmdC5UcnlGaW5hbGx5U3RhdGVtZW50KGJsb2NrLCBudWxsLCBmaW5hbGl6ZXIpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuTk9fQ0FUQ0hfT1JfRklOQUxMWSk7XG4gICAgfVxuICB9XG5cbiAgcGFyc2VWYXJpYWJsZURlY2xhcmF0aW9uU3RhdGVtZW50KCkge1xuICAgIGxldCBkZWNsYXJhdGlvbiA9IHRoaXMucGFyc2VWYXJpYWJsZURlY2xhcmF0aW9uKCk7XG4gICAgdGhpcy5jb25zdW1lU2VtaWNvbG9uKCk7XG4gICAgcmV0dXJuIG5ldyBTaGlmdC5WYXJpYWJsZURlY2xhcmF0aW9uU3RhdGVtZW50KGRlY2xhcmF0aW9uKTtcbiAgfVxuXG4gIHBhcnNlV2hpbGVTdGF0ZW1lbnQoKSB7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLldISUxFKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTFBBUkVOKTtcbiAgICByZXR1cm4gbmV3IFNoaWZ0LldoaWxlU3RhdGVtZW50KHRoaXMucGFyc2VFeHByZXNzaW9uKCksIHRoaXMuZ2V0SXRlcmF0b3JTdGF0ZW1lbnRFcGlsb2d1ZSgpKTtcbiAgfVxuXG4gIHBhcnNlQ2F0Y2hDbGF1c2UoKSB7XG4gICAgbGV0IHN0YXJ0VG9rZW5JbmRleCA9IHRoaXMudG9rZW5JbmRleDtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5DQVRDSCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgbGV0IHRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLlJQQVJFTikgfHwgdGhpcy5tYXRjaChUb2tlblR5cGUuTFBBUkVOKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRva2VuKTtcbiAgICB9XG5cbiAgICBsZXQgcGFyYW0gPSB0aGlzLnBhcnNlTGVmdEhhbmRTaWRlRXhwcmVzc2lvbigpO1xuXG4gICAgaWYgKCFQYXJzZXIuaXNEZXN0cnVjdHVyaW5nQXNzaWdubWVudFRhcmdldChwYXJhbSkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0b2tlbik7XG4gICAgfVxuICAgIHBhcmFtID0gUGFyc2VyLnRyYW5zZm9ybURlc3RydWN0dXJpbmdBc3NpZ25tZW50KHBhcmFtKTtcblxuICAgIGxldCBib3VuZCA9IFBhcnNlci5ib3VuZE5hbWVzKHBhcmFtKTtcbiAgICBpZiAoZmlyc3REdXBsaWNhdGUoYm91bmQpICE9IG51bGwpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoVG9rZW4odG9rZW4sIEVycm9yTWVzc2FnZXMuRFVQTElDQVRFX0JJTkRJTkcsIGZpcnN0RHVwbGljYXRlKGJvdW5kKSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuc3RyaWN0ICYmIGJvdW5kLnNvbWUoaXNSZXN0cmljdGVkV29yZCkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoVG9rZW4odG9rZW4sIEVycm9yTWVzc2FnZXMuU1RSSUNUX0NBVENIX1ZBUklBQkxFKTtcbiAgICB9XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcblxuICAgIGxldCBib2R5ID0gdGhpcy5wYXJzZUJsb2NrKCk7XG5cbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkNhdGNoQ2xhdXNlKHBhcmFtLCBib2R5KSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgfVxuXG4gIHBhcnNlQmxvY2soKSB7XG4gICAgbGV0IHN0YXJ0VG9rZW5JbmRleCA9IHRoaXMudG9rZW5JbmRleDtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTEJSQUNFKTtcblxuICAgIGxldCBib2R5ID0gW107XG4gICAgd2hpbGUgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0UpKSB7XG4gICAgICBib2R5LnB1c2godGhpcy5wYXJzZVN0YXRlbWVudCgpKTtcbiAgICB9XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJCUkFDRSk7XG5cbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkJsb2NrKGJvZHkpLCBzdGFydFRva2VuSW5kZXgpO1xuICB9XG5cbiAgcGFyc2VWYXJpYWJsZURlY2xhcmF0aW9uKCkge1xuICAgIGxldCBzdGFydFRva2VuSW5kZXggPSB0aGlzLnRva2VuSW5kZXg7XG4gICAgbGV0IHRva2VuID0gdGhpcy5sZXgoKTtcblxuICAgIC8vIFByZWNlZGVkIGJ5IHRoaXMubWF0Y2goVG9rZW5TdWJUeXBlLlZBUikgfHwgdGhpcy5tYXRjaChUb2tlblN1YlR5cGUuTEVUKTtcbiAgICBsZXQga2luZCA9IHRva2VuLnR5cGUgPT0gVG9rZW5UeXBlLlZBUiA/IFwidmFyXCIgOiB0b2tlbi50eXBlID09PSBUb2tlblR5cGUuQ09OU1QgPyBcImNvbnN0XCIgOiBcImxldFwiO1xuICAgIGxldCBkZWNsYXJhdG9ycyA9IHRoaXMucGFyc2VWYXJpYWJsZURlY2xhcmF0b3JMaXN0KGtpbmQpO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuVmFyaWFibGVEZWNsYXJhdGlvbihraW5kLCBkZWNsYXJhdG9ycyksIHN0YXJ0VG9rZW5JbmRleCk7XG4gIH1cblxuICBwYXJzZVZhcmlhYmxlRGVjbGFyYXRvckxpc3Qoa2luZCkge1xuICAgIGxldCByZXN1bHQgPSBbXTtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgcmVzdWx0LnB1c2godGhpcy5wYXJzZVZhcmlhYmxlRGVjbGFyYXRvcihraW5kKSk7XG4gICAgICBpZiAoIXRoaXMuZWF0KFRva2VuVHlwZS5DT01NQSkpIHtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwYXJzZVZhcmlhYmxlRGVjbGFyYXRvcihraW5kKSB7XG4gICAgbGV0IHN0YXJ0VG9rZW5JbmRleCA9IHRoaXMudG9rZW5JbmRleDtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcblxuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5MUEFSRU4pKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuICAgIH1cbiAgICBsZXQgaWQgPSB0aGlzLnBhcnNlTGVmdEhhbmRTaWRlRXhwcmVzc2lvbigpO1xuXG4gICAgaWYgKCFQYXJzZXIuaXNEZXN0cnVjdHVyaW5nQXNzaWdubWVudFRhcmdldChpZCkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0b2tlbik7XG4gICAgfVxuICAgIGlkID0gUGFyc2VyLnRyYW5zZm9ybURlc3RydWN0dXJpbmdBc3NpZ25tZW50KGlkKTtcblxuICAgIGxldCBib3VuZCA9IFBhcnNlci5ib3VuZE5hbWVzKGlkKTtcbiAgICBpZiAoZmlyc3REdXBsaWNhdGUoYm91bmQpICE9IG51bGwpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoVG9rZW4odG9rZW4sIEVycm9yTWVzc2FnZXMuRFVQTElDQVRFX0JJTkRJTkcsIGZpcnN0RHVwbGljYXRlKGJvdW5kKSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuc3RyaWN0ICYmIGJvdW5kLnNvbWUoaXNSZXN0cmljdGVkV29yZCkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoVG9rZW4odG9rZW4sIEVycm9yTWVzc2FnZXMuU1RSSUNUX1ZBUl9OQU1FKTtcbiAgICB9XG5cbiAgICBsZXQgaW5pdCA9IG51bGw7XG4gICAgaWYgKGtpbmQgPT0gXCJjb25zdFwiKSB7XG4gICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuQVNTSUdOKTtcbiAgICAgIGluaXQgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkFTU0lHTikpIHtcbiAgICAgIHRoaXMubGV4KCk7XG4gICAgICBpbml0ID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuVmFyaWFibGVEZWNsYXJhdG9yKGlkLCBpbml0KSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgfVxuXG4gIHBhcnNlRXhwcmVzc2lvbigpIHtcbiAgICBsZXQgc3RhcnRUb2tlbkluZGV4ID0gdGhpcy50b2tlbkluZGV4O1xuXG4gICAgbGV0IGV4cHIgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcblxuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5DT01NQSkpIHtcbiAgICAgIHdoaWxlICghdGhpcy5lb2YoKSkge1xuICAgICAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLkNPTU1BKSkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubGV4KCk7XG4gICAgICAgIGV4cHIgPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQmluYXJ5RXhwcmVzc2lvbihcIixcIiwgZXhwciwgdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCkpLFxuICAgICAgICAgICAgc3RhcnRUb2tlbkluZGV4KTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGV4cHI7XG4gIH1cblxuICBwYXJzZUFycm93RXhwcmVzc2lvblRhaWwoaGVhZCwgc3RhcnRUb2tlbkluZGV4KSB7XG4gICAgbGV0IGFycm93ID0gdGhpcy5leHBlY3QoVG9rZW5UeXBlLkFSUk9XKTtcblxuICAgIC8vIENvbnZlcnQgcGFyYW0gbGlzdC5cbiAgICBsZXQge3BhcmFtcyA9IG51bGwsIHJlc3QgPSBudWxsLCBkdXAgPSBudWxsLCBzdHJpY3RfcmVzZXJ2ZWRfd29yZCA9IGZhbHNlLCBzdHJpY3RfcmVzdHJpY3RlZF93b3JkID0gZmFsc2V9ID0gaGVhZDtcbiAgICBpZiAoaGVhZC50eXBlICE9PSBBUlJPV19FWFBSRVNTSU9OX1BBUkFNUykge1xuICAgICAgaWYgKGhlYWQudHlwZSA9PT0gXCJJZGVudGlmaWVyRXhwcmVzc2lvblwiKSB7XG4gICAgICAgIGxldCBuYW1lID0gaGVhZC5pZGVudGlmaWVyLm5hbWU7XG4gICAgICAgIGlmIChTVFJJQ1RfTU9ERV9SRVNFUlZFRF9XT1JELmhhc093blByb3BlcnR5KG5hbWUpKSB7XG4gICAgICAgICAgc3RyaWN0X3Jlc2VydmVkX3dvcmQgPSB0cnVlO1xuICAgICAgICAgIGlmICh0aGlzLnN0cmljdCkge1xuICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlNUUklDVF9SRVNFUlZFRF9XT1JEKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzUmVzdHJpY3RlZFdvcmQobmFtZSkpIHtcbiAgICAgICAgICBzdHJpY3RfcmVzdHJpY3RlZF93b3JkID0gdHJ1ZTtcbiAgICAgICAgICBpZiAodGhpcy5zdHJpY3QpIHtcbiAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUEFSQU1fTkFNRSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGhlYWQgPSBQYXJzZXIudHJhbnNmb3JtRGVzdHJ1Y3R1cmluZ0Fzc2lnbm1lbnQoaGVhZCk7XG4gICAgICAgIHBhcmFtcyA9IFtoZWFkXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZChhcnJvdyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5MQlJBQ0UpKSB7XG4gICAgICBsZXQgW2JvZHksIGlzU3RyaWN0XSA9IHRoaXMucGFyc2VCb2R5KCk7XG4gICAgICBpZiAoaXNTdHJpY3QpIHtcbiAgICAgICAgaWYgKGR1cCkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUEFSQU1fRFVQRSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0cmljdF9yZXNlcnZlZF93b3JkKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlNUUklDVF9SRVNFUlZFRF9XT1JEKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc3RyaWN0X3Jlc3RyaWN0ZWRfd29yZCkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUEFSQU1fTkFNRSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SQlJBQ0UpO1xuICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5BcnJvd0V4cHJlc3Npb24ocGFyYW1zLCByZXN0LCBib2R5KSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IGJvZHkgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQXJyb3dFeHByZXNzaW9uKHBhcmFtcywgcmVzdCwgYm9keSksIHN0YXJ0VG9rZW5JbmRleCk7XG4gICAgfVxuICB9XG5cbiAgcGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpIHtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICBsZXQgc3RhcnRUb2tlbkluZGV4ID0gdGhpcy50b2tlbkluZGV4O1xuXG4gICAgbGV0IG5vZGUgPSB0aGlzLnBhcnNlQ29uZGl0aW9uYWxFeHByZXNzaW9uKCk7XG5cbiAgICBpZiAoIXRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0ICYmIHRoaXMubWF0Y2goVG9rZW5UeXBlLkFSUk9XKSkge1xuICAgICAgcmV0dXJuIHRoaXMucGFyc2VBcnJvd0V4cHJlc3Npb25UYWlsKG5vZGUsIHN0YXJ0VG9rZW5JbmRleClcbiAgICB9XG5cbiAgICBsZXQgaXNPcGVyYXRvciA9IGZhbHNlO1xuICAgIGxldCBvcGVyYXRvciA9IHRoaXMubG9va2FoZWFkO1xuICAgIHN3aXRjaCAob3BlcmF0b3IudHlwZSkge1xuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX0JJVF9PUjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9CSVRfWE9SOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX0JJVF9BTkQ6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fU0hMOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX1NIUjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9TSFJfVU5TSUdORUQ6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fQUREOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX1NVQjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9NVUw6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fRElWOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX01PRDpcbiAgICAgICAgaXNPcGVyYXRvciA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGlmIChpc09wZXJhdG9yKSB7XG4gICAgICBpZiAoIVBhcnNlci5pc0Rlc3RydWN0dXJpbmdBc3NpZ25tZW50VGFyZ2V0KG5vZGUpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5JTlZBTElEX0xIU19JTl9BU1NJR05NRU5UKTtcbiAgICAgIH1cbiAgICAgIG5vZGUgPSBQYXJzZXIudHJhbnNmb3JtRGVzdHJ1Y3R1cmluZ0Fzc2lnbm1lbnQobm9kZSk7XG5cbiAgICAgIGxldCBib3VuZCA9IFBhcnNlci5ib3VuZE5hbWVzKG5vZGUpO1xuICAgICAgaWYgKGZpcnN0RHVwbGljYXRlKGJvdW5kKSAhPSBudWxsKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoVG9rZW4odG9rZW4sIEVycm9yTWVzc2FnZXMuRFVQTElDQVRFX0JJTkRJTkcsIGZpcnN0RHVwbGljYXRlKGJvdW5kKSk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLnN0cmljdCAmJiBib3VuZC5zb21lKGlzUmVzdHJpY3RlZFdvcmQpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoVG9rZW4odG9rZW4sIEVycm9yTWVzc2FnZXMuU1RSSUNUX0xIU19BU1NJR05NRU5UKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5sZXgoKTtcbiAgICAgIGxldCByaWdodCA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5Bc3NpZ25tZW50RXhwcmVzc2lvbihvcGVyYXRvci50eXBlLm5hbWUsIG5vZGUsIHJpZ2h0KSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICBub2RlLnR5cGUgPT09IFwiT2JqZWN0RXhwcmVzc2lvblwiICYmXG4gICAgICBub2RlLnByb3BlcnRpZXMuc29tZShwID0+IHAudHlwZSA9PT0gXCJCaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyXCIpXG4gICAgKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQob3BlcmF0b3IpO1xuICAgIH1cblxuICAgIHJldHVybiBub2RlO1xuICB9XG5cbiAgcGFyc2VDb25kaXRpb25hbEV4cHJlc3Npb24oKSB7XG4gICAgbGV0IHN0YXJ0VG9rZW5JbmRleCA9IHRoaXMudG9rZW5JbmRleDtcbiAgICBsZXQgZXhwciA9IHRoaXMucGFyc2VCaW5hcnlFeHByZXNzaW9uKCk7XG4gICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkNPTkRJVElPTkFMKSkge1xuICAgICAgdGhpcy5sZXgoKTtcbiAgICAgIGxldCBwcmV2aW91c0FsbG93SW4gPSB0aGlzLmFsbG93SW47XG4gICAgICB0aGlzLmFsbG93SW4gPSB0cnVlO1xuICAgICAgbGV0IGNvbnNlcXVlbnQgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgIHRoaXMuYWxsb3dJbiA9IHByZXZpb3VzQWxsb3dJbjtcbiAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5DT0xPTik7XG4gICAgICBsZXQgYWx0ZXJuYXRlID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkNvbmRpdGlvbmFsRXhwcmVzc2lvbihleHByLCBjb25zZXF1ZW50LCBhbHRlcm5hdGUpLCBzdGFydFRva2VuSW5kZXgpO1xuICAgIH1cblxuICAgIHJldHVybiBleHByO1xuICB9XG5cbiAgaXNCaW5hcnlPcGVyYXRvcih0eXBlKSB7XG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICBjYXNlIFRva2VuVHlwZS5PUjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFORDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkJJVF9PUjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkJJVF9YT1I6XG4gICAgICBjYXNlIFRva2VuVHlwZS5CSVRfQU5EOlxuICAgICAgY2FzZSBUb2tlblR5cGUuRVE6XG4gICAgICBjYXNlIFRva2VuVHlwZS5ORTpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkVRX1NUUklDVDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk5FX1NUUklDVDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkxUOlxuICAgICAgY2FzZSBUb2tlblR5cGUuR1Q6XG4gICAgICBjYXNlIFRva2VuVHlwZS5MVEU6XG4gICAgICBjYXNlIFRva2VuVHlwZS5HVEU6XG4gICAgICBjYXNlIFRva2VuVHlwZS5JTlNUQU5DRU9GOlxuICAgICAgY2FzZSBUb2tlblR5cGUuU0hMOlxuICAgICAgY2FzZSBUb2tlblR5cGUuU0hSOlxuICAgICAgY2FzZSBUb2tlblR5cGUuU0hSX1VOU0lHTkVEOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQUREOlxuICAgICAgY2FzZSBUb2tlblR5cGUuU1VCOlxuICAgICAgY2FzZSBUb2tlblR5cGUuTVVMOlxuICAgICAgY2FzZSBUb2tlblR5cGUuRElWOlxuICAgICAgY2FzZSBUb2tlblR5cGUuTU9EOlxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLklOOlxuICAgICAgICByZXR1cm4gdGhpcy5hbGxvd0luO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHBhcnNlQmluYXJ5RXhwcmVzc2lvbigpIHtcbiAgICBsZXQgbGVmdCA9IHRoaXMucGFyc2VVbmFyeUV4cHJlc3Npb24oKTtcbiAgICBsZXQgb3BlcmF0b3IgPSB0aGlzLmxvb2thaGVhZC50eXBlO1xuXG4gICAgbGV0IGlzQmluYXJ5T3BlcmF0b3IgPSB0aGlzLmlzQmluYXJ5T3BlcmF0b3Iob3BlcmF0b3IpO1xuICAgIGlmICghaXNCaW5hcnlPcGVyYXRvcikge1xuICAgICAgcmV0dXJuIGxlZnQ7XG4gICAgfVxuXG4gICAgdGhpcy5sZXgoKTtcbiAgICBsZXQgc3RhY2sgPSBbXTtcbiAgICBzdGFjay5wdXNoKHtzdGFydEluZGV4OiB0aGlzLnRva2VuSW5kZXgsIGxlZnQsIG9wZXJhdG9yLCBwcmVjZWRlbmNlOiBCaW5hcnlQcmVjZWRlbmNlW29wZXJhdG9yLm5hbWVdfSk7XG4gICAgbGV0IHJpZ2h0ID0gdGhpcy5wYXJzZVVuYXJ5RXhwcmVzc2lvbigpO1xuXG4gICAgb3BlcmF0b3IgPSB0aGlzLmxvb2thaGVhZC50eXBlO1xuICAgIGlzQmluYXJ5T3BlcmF0b3IgPSB0aGlzLmlzQmluYXJ5T3BlcmF0b3IodGhpcy5sb29rYWhlYWQudHlwZSk7XG4gICAgd2hpbGUgKGlzQmluYXJ5T3BlcmF0b3IpIHtcbiAgICAgIGxldCBwcmVjZWRlbmNlID0gQmluYXJ5UHJlY2VkZW5jZVtvcGVyYXRvci5uYW1lXTtcbiAgICAgIC8vIFJlZHVjZTogbWFrZSBhIGJpbmFyeSBleHByZXNzaW9uIGZyb20gdGhlIHRocmVlIHRvcG1vc3QgZW50cmllcy5cbiAgICAgIHdoaWxlIChzdGFjay5sZW5ndGggJiYgKHByZWNlZGVuY2UgPD0gc3RhY2tbc3RhY2subGVuZ3RoIC0gMV0ucHJlY2VkZW5jZSkpIHtcbiAgICAgICAgbGV0IHN0YWNrSXRlbSA9IHN0YWNrW3N0YWNrLmxlbmd0aCAtIDFdO1xuICAgICAgICBsZXQgc3RhY2tPcGVyYXRvciA9IHN0YWNrSXRlbS5vcGVyYXRvcjtcbiAgICAgICAgbGVmdCA9IHN0YWNrSXRlbS5sZWZ0O1xuICAgICAgICBzdGFjay5wb3AoKTtcbiAgICAgICAgcmlnaHQgPSB0aGlzLm1hcmtMb2NhdGlvbihcbiAgICAgICAgICAgIG5ldyBTaGlmdC5CaW5hcnlFeHByZXNzaW9uKHN0YWNrT3BlcmF0b3IubmFtZSwgbGVmdCwgcmlnaHQpLFxuICAgICAgICAgICAgc3RhY2tJdGVtLnN0YXJ0SW5kZXgsXG4gICAgICAgICAgICB0aGlzLnRva2VuSW5kZXgpO1xuICAgICAgfVxuXG4gICAgICAvLyBTaGlmdC5cbiAgICAgIHRoaXMubGV4KCk7XG4gICAgICBzdGFjay5wdXNoKHtzdGFydEluZGV4OiB0aGlzLnRva2VuSW5kZXgsIGxlZnQ6IHJpZ2h0LCBvcGVyYXRvciwgcHJlY2VkZW5jZX0pO1xuICAgICAgcmlnaHQgPSB0aGlzLnBhcnNlVW5hcnlFeHByZXNzaW9uKCk7XG5cbiAgICAgIG9wZXJhdG9yID0gdGhpcy5sb29rYWhlYWQudHlwZTtcbiAgICAgIGlzQmluYXJ5T3BlcmF0b3IgPSB0aGlzLmlzQmluYXJ5T3BlcmF0b3Iob3BlcmF0b3IpO1xuICAgIH1cblxuICAgIC8vIEZpbmFsIHJlZHVjZSB0byBjbGVhbi11cCB0aGUgc3RhY2suXG4gICAgcmV0dXJuIHN0YWNrLnJlZHVjZVJpZ2h0KFxuICAgICAgICAoZXhwciwgc3RhY2tJdGVtKSA9PiB0aGlzLm1hcmtMb2NhdGlvbihcbiAgICAgICAgICAgIG5ldyBTaGlmdC5CaW5hcnlFeHByZXNzaW9uKHN0YWNrSXRlbS5vcGVyYXRvci5uYW1lLCBzdGFja0l0ZW0ubGVmdCwgZXhwciksXG4gICAgICAgICAgICBzdGFja0l0ZW0uc3RhcnRJbmRleCxcbiAgICAgICAgICAgIHRoaXMudG9rZW5JbmRleCksXG4gICAgICAgIHJpZ2h0KTtcbiAgfVxuXG4gIHN0YXRpYyBpc1ByZWZpeE9wZXJhdG9yKHR5cGUpIHtcbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLklOQzpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkRFQzpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFERDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlNVQjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkJJVF9OT1Q6XG4gICAgICBjYXNlIFRva2VuVHlwZS5OT1Q6XG4gICAgICBjYXNlIFRva2VuVHlwZS5ERUxFVEU6XG4gICAgICBjYXNlIFRva2VuVHlwZS5WT0lEOlxuICAgICAgY2FzZSBUb2tlblR5cGUuVFlQRU9GOlxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcGFyc2VVbmFyeUV4cHJlc3Npb24oKSB7XG4gICAgaWYgKHRoaXMubG9va2FoZWFkLnR5cGUua2xhc3MgIT0gVG9rZW5DbGFzcy5QdW5jdHVhdG9yICYmIHRoaXMubG9va2FoZWFkLnR5cGUua2xhc3MgIT0gVG9rZW5DbGFzcy5LZXl3b3JkKSB7XG4gICAgICByZXR1cm4gdGhpcy5wYXJzZVBvc3RmaXhFeHByZXNzaW9uKCk7XG4gICAgfVxuICAgIGxldCBzdGFydFRva2VuSW5kZXggPSB0aGlzLnRva2VuSW5kZXg7XG4gICAgbGV0IG9wZXJhdG9yID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgaWYgKCFQYXJzZXIuaXNQcmVmaXhPcGVyYXRvcihvcGVyYXRvci50eXBlKSkge1xuICAgICAgcmV0dXJuIHRoaXMucGFyc2VQb3N0Zml4RXhwcmVzc2lvbigpO1xuICAgIH1cbiAgICB0aGlzLmxleCgpO1xuICAgIGxldCBleHByID0gdGhpcy5wYXJzZVVuYXJ5RXhwcmVzc2lvbigpO1xuICAgIHN3aXRjaCAob3BlcmF0b3IudHlwZSkge1xuICAgICAgY2FzZSBUb2tlblR5cGUuSU5DOlxuICAgICAgY2FzZSBUb2tlblR5cGUuREVDOlxuICAgICAgICAvLyAxMS40LjQsIDExLjQuNTtcbiAgICAgICAgaWYgKGV4cHIudHlwZSA9PT0gXCJJZGVudGlmaWVyRXhwcmVzc2lvblwiKSB7XG4gICAgICAgICAgaWYgKHRoaXMuc3RyaWN0ICYmIGlzUmVzdHJpY3RlZFdvcmQoZXhwci5pZGVudGlmaWVyLm5hbWUpKSB7XG4gICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX0xIU19QUkVGSVgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghUGFyc2VyLmlzVmFsaWRTaW1wbGVBc3NpZ25tZW50VGFyZ2V0KGV4cHIpKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLklOVkFMSURfTEhTX0lOX0FTU0lHTk1FTlQpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBUb2tlblR5cGUuREVMRVRFOlxuICAgICAgICBpZiAoZXhwci50eXBlID09PSBcIklkZW50aWZpZXJFeHByZXNzaW9uXCIgJiYgdGhpcy5zdHJpY3QpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX0RFTEVURSk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlByZWZpeEV4cHJlc3Npb24ob3BlcmF0b3IudmFsdWUsIGV4cHIpLCBzdGFydFRva2VuSW5kZXgpO1xuICB9XG5cbiAgcGFyc2VQb3N0Zml4RXhwcmVzc2lvbigpIHtcbiAgICBsZXQgc3RhcnRUb2tlbkluZGV4ID0gdGhpcy50b2tlbkluZGV4O1xuXG4gICAgbGV0IGV4cHIgPSB0aGlzLnBhcnNlTGVmdEhhbmRTaWRlRXhwcmVzc2lvbkFsbG93Q2FsbCgpO1xuXG4gICAgaWYgKHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0KSB7XG4gICAgICByZXR1cm4gZXhwcjtcbiAgICB9XG5cbiAgICBsZXQgb3BlcmF0b3IgPSB0aGlzLmxvb2thaGVhZDtcbiAgICBpZiAoKG9wZXJhdG9yLnR5cGUgIT09IFRva2VuVHlwZS5JTkMpICYmIChvcGVyYXRvci50eXBlICE9PSBUb2tlblR5cGUuREVDKSkge1xuICAgICAgcmV0dXJuIGV4cHI7XG4gICAgfVxuICAgIHRoaXMubGV4KCk7XG4gICAgLy8gMTEuMy4xLCAxMS4zLjI7XG4gICAgaWYgKGV4cHIudHlwZSA9PT0gXCJJZGVudGlmaWVyRXhwcmVzc2lvblwiKSB7XG4gICAgICBpZiAodGhpcy5zdHJpY3QgJiYgaXNSZXN0cmljdGVkV29yZChleHByLmlkZW50aWZpZXIubmFtZSkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlNUUklDVF9MSFNfUE9TVEZJWCk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghUGFyc2VyLmlzVmFsaWRTaW1wbGVBc3NpZ25tZW50VGFyZ2V0KGV4cHIpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuSU5WQUxJRF9MSFNfSU5fQVNTSUdOTUVOVCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuUG9zdGZpeEV4cHJlc3Npb24oZXhwciwgb3BlcmF0b3IudmFsdWUpLCBzdGFydFRva2VuSW5kZXgpO1xuICB9XG5cbiAgcGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uQWxsb3dDYWxsKCkge1xuICAgIGxldCBzdGFydFRva2VuSW5kZXggPSB0aGlzLnRva2VuSW5kZXg7XG4gICAgbGV0IHByZXZpb3VzQWxsb3dJbiA9IHRoaXMuYWxsb3dJbjtcbiAgICB0aGlzLmFsbG93SW4gPSB0cnVlO1xuICAgIGxldCBleHByID0gdGhpcy5tYXRjaChUb2tlblR5cGUuTkVXKSA/IHRoaXMucGFyc2VOZXdFeHByZXNzaW9uKCkgOiB0aGlzLnBhcnNlUHJpbWFyeUV4cHJlc3Npb24oKTtcblxuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuTFBBUkVOKSkge1xuICAgICAgICBleHByID0gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkNhbGxFeHByZXNzaW9uKGV4cHIsIHRoaXMucGFyc2VBcmd1bWVudExpc3QoKSksIHN0YXJ0VG9rZW5JbmRleCk7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkxCUkFDSykpIHtcbiAgICAgICAgZXhwciA9IHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5Db21wdXRlZE1lbWJlckV4cHJlc3Npb24oZXhwciwgdGhpcy5wYXJzZUNvbXB1dGVkTWVtYmVyKCkpLCBzdGFydFRva2VuSW5kZXgpO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5QRVJJT0QpKSB7XG4gICAgICAgIGV4cHIgPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuU3RhdGljTWVtYmVyRXhwcmVzc2lvbihleHByLCB0aGlzLnBhcnNlTm9uQ29tcHV0ZWRNZW1iZXIoKSksIHN0YXJ0VG9rZW5JbmRleCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmFsbG93SW4gPSBwcmV2aW91c0FsbG93SW47XG5cbiAgICByZXR1cm4gZXhwcjtcbiAgfVxuXG4gIHBhcnNlTGVmdEhhbmRTaWRlRXhwcmVzc2lvbigpIHtcbiAgICBsZXQgc3RhcnRUb2tlbkluZGV4ID0gdGhpcy50b2tlbkluZGV4O1xuXG4gICAgbGV0IGV4cHIgPSB0aGlzLm1hdGNoKFRva2VuVHlwZS5ORVcpID8gdGhpcy5wYXJzZU5ld0V4cHJlc3Npb24oKSA6IHRoaXMucGFyc2VQcmltYXJ5RXhwcmVzc2lvbigpO1xuXG4gICAgd2hpbGUgKHRoaXMubWF0Y2goVG9rZW5UeXBlLlBFUklPRCkgfHwgdGhpcy5tYXRjaChUb2tlblR5cGUuTEJSQUNLKSkge1xuICAgICAgZXhwciA9IHRoaXMubWFya0xvY2F0aW9uKFxuICAgICAgICAgIHRoaXMubWF0Y2goVG9rZW5UeXBlLkxCUkFDSykgP1xuICAgICAgICAgICAgICBuZXcgU2hpZnQuQ29tcHV0ZWRNZW1iZXJFeHByZXNzaW9uKGV4cHIsIHRoaXMucGFyc2VDb21wdXRlZE1lbWJlcigpKSA6XG4gICAgICAgICAgICAgIG5ldyBTaGlmdC5TdGF0aWNNZW1iZXJFeHByZXNzaW9uKGV4cHIsIHRoaXMucGFyc2VOb25Db21wdXRlZE1lbWJlcigpKSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgICB9XG5cbiAgICByZXR1cm4gZXhwcjtcbiAgfVxuXG4gIHBhcnNlTm9uQ29tcHV0ZWRNZW1iZXIoKSB7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlBFUklPRCk7XG4gICAgcmV0dXJuIHRoaXMucGFyc2VOb25Db21wdXRlZFByb3BlcnR5KCk7XG4gIH1cblxuICBwYXJzZUNvbXB1dGVkTWVtYmVyKCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MQlJBQ0spO1xuICAgIGxldCBleHByID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUkJSQUNLKTtcbiAgICByZXR1cm4gZXhwcjtcbiAgfVxuXG4gIHBhcnNlTmV3RXhwcmVzc2lvbigpIHtcbiAgICBsZXQgc3RhcnRUb2tlbkluZGV4ID0gdGhpcy50b2tlbkluZGV4O1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5ORVcpO1xuICAgIGxldCBjYWxsZWUgPSB0aGlzLnBhcnNlTGVmdEhhbmRTaWRlRXhwcmVzc2lvbigpO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuTmV3RXhwcmVzc2lvbihjYWxsZWUsIHRoaXMubWF0Y2goVG9rZW5UeXBlLkxQQVJFTikgPyB0aGlzLnBhcnNlQXJndW1lbnRMaXN0KCkgOlxuICAgICAgICBbXSksIHN0YXJ0VG9rZW5JbmRleCk7XG4gIH1cblxuICBwYXJzZVByaW1hcnlFeHByZXNzaW9uKCkge1xuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5MUEFSRU4pKSB7XG4gICAgICByZXR1cm4gdGhpcy5wYXJzZUdyb3VwRXhwcmVzc2lvbigpO1xuICAgIH1cblxuICAgIGxldCBzdGFydFRva2VuSW5kZXggPSB0aGlzLnRva2VuSW5kZXg7XG5cbiAgICBzd2l0Y2ggKHRoaXMubG9va2FoZWFkLnR5cGUua2xhc3MpIHtcbiAgICAgIGNhc2UgVG9rZW5DbGFzcy5JZGVudDpcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5JZGVudGlmaWVyRXhwcmVzc2lvbih0aGlzLnBhcnNlSWRlbnRpZmllcigpKSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgICAgIGNhc2UgVG9rZW5DbGFzcy5TdHJpbmdMaXRlcmFsOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZVN0cmluZ0xpdGVyYWwoKTtcbiAgICAgIGNhc2UgVG9rZW5DbGFzcy5OdW1lcmljTGl0ZXJhbDpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VOdW1lcmljTGl0ZXJhbCgpO1xuICAgICAgY2FzZSBUb2tlbkNsYXNzLktleXdvcmQ6XG4gICAgICB7XG4gICAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5USElTKSkge1xuICAgICAgICAgIHRoaXMubGV4KCk7XG4gICAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5UaGlzRXhwcmVzc2lvbiwgc3RhcnRUb2tlbkluZGV4KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuRlVOQ1RJT04pKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHRoaXMucGFyc2VGdW5jdGlvbih0cnVlKSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNhc2UgVG9rZW5DbGFzcy5Cb29sZWFuTGl0ZXJhbDpcbiAgICAgIHtcbiAgICAgICAgbGV0IHRva2VuID0gdGhpcy5sZXgoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5MaXRlcmFsQm9vbGVhbkV4cHJlc3Npb24odG9rZW4udHlwZSA9PSBUb2tlblR5cGUuVFJVRV9MSVRFUkFMKSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgICAgIH1cbiAgICAgIGNhc2UgVG9rZW5DbGFzcy5OdWxsTGl0ZXJhbDpcbiAgICAgIHtcbiAgICAgICAgdGhpcy5sZXgoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5MaXRlcmFsTnVsbEV4cHJlc3Npb24sIHN0YXJ0VG9rZW5JbmRleCk7XG4gICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuTEJSQUNLKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLnBhcnNlQXJyYXlFeHByZXNzaW9uKCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuTEJSQUNFKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLnBhcnNlT2JqZWN0RXhwcmVzc2lvbigpO1xuICAgICAgICB9IGVsc2UgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkRJVikgfHwgdGhpcy5tYXRjaChUb2tlblR5cGUuQVNTSUdOX0RJVikpIHtcbiAgICAgICAgICB0aGlzLnNraXBDb21tZW50KCk7XG4gICAgICAgICAgdGhpcy5sb29rYWhlYWQgPSB0aGlzLnNjYW5SZWdFeHAoKTtcbiAgICAgICAgICBsZXQgdG9rZW4gPSB0aGlzLmxleCgpO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgbGFzdFNsYXNoID0gdG9rZW4udmFsdWUubGFzdEluZGV4T2YoXCIvXCIpO1xuICAgICAgICAgICAgUmVnRXhwKHRva2VuLnZhbHVlLnNsaWNlKDEsIGxhc3RTbGFzaCksIHRva2VuLnZhbHVlLnNsaWNlKGxhc3RTbGFzaCArIDEpKTtcbiAgICAgICAgICB9IGNhdGNoICh1bnVzZWQpIHtcbiAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoVG9rZW4odG9rZW4sIEVycm9yTWVzc2FnZXMuSU5WQUxJRF9SRUdVTEFSX0VYUFJFU1NJT04pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkxpdGVyYWxSZWdFeHBFeHByZXNzaW9uKHRva2VuLnZhbHVlKSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxleCgpKTtcbiAgfVxuXG4gIHBhcnNlTnVtZXJpY0xpdGVyYWwoKSB7XG4gICAgbGV0IHN0YXJ0VG9rZW5JbmRleCA9IHRoaXMudG9rZW5JbmRleDtcbiAgICBpZiAodGhpcy5zdHJpY3QgJiYgdGhpcy5sb29rYWhlYWQub2N0YWwpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoVG9rZW4odGhpcy5sb29rYWhlYWQsIEVycm9yTWVzc2FnZXMuU1RSSUNUX09DVEFMX0xJVEVSQUwpO1xuICAgIH1cbiAgICBsZXQgdG9rZW4yID0gdGhpcy5sZXgoKTtcbiAgICBsZXQgbm9kZSA9IHRva2VuMi5fdmFsdWUgPT09IDEvMFxuICAgICAgPyBuZXcgU2hpZnQuTGl0ZXJhbEluZmluaXR5RXhwcmVzc2lvblxuICAgICAgOiBuZXcgU2hpZnQuTGl0ZXJhbE51bWVyaWNFeHByZXNzaW9uKHRva2VuMi5fdmFsdWUpO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihub2RlLCBzdGFydFRva2VuSW5kZXgpO1xuICB9XG5cbiAgcGFyc2VTdHJpbmdMaXRlcmFsKCkge1xuICAgIGxldCBzdGFydFRva2VuSW5kZXggPSB0aGlzLnRva2VuSW5kZXg7XG4gICAgaWYgKHRoaXMuc3RyaWN0ICYmIHRoaXMubG9va2FoZWFkLm9jdGFsKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aFRva2VuKHRoaXMubG9va2FoZWFkLCBFcnJvck1lc3NhZ2VzLlNUUklDVF9PQ1RBTF9MSVRFUkFMKTtcbiAgICB9XG4gICAgbGV0IHRva2VuMiA9IHRoaXMubGV4KCk7XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5MaXRlcmFsU3RyaW5nRXhwcmVzc2lvbih0b2tlbjIuX3ZhbHVlLCB0b2tlbjIuc2xpY2UudGV4dCksXG4gICAgICAgIHN0YXJ0VG9rZW5JbmRleCk7XG4gIH1cblxuICBwYXJzZUlkZW50aWZpZXIoKSB7XG4gICAgbGV0IHN0YXJ0VG9rZW5JbmRleCA9IHRoaXMudG9rZW5JbmRleDtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LklkZW50aWZpZXIodGhpcy5sZXgoKS52YWx1ZSksIHN0YXJ0VG9rZW5JbmRleCk7XG4gIH1cblxuICBwYXJzZUFyZ3VtZW50TGlzdCgpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTFBBUkVOKTtcbiAgICBsZXQgYXJncyA9IHRoaXMucGFyc2VBcmd1bWVudHMoKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcbiAgICByZXR1cm4gYXJncztcbiAgfVxuXG4gIHBhcnNlQXJndW1lbnRzKCkge1xuICAgIGxldCByZXN1bHQgPSBbXTtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLlJQQVJFTikgfHwgdGhpcy5lb2YoKSkge1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfVxuICAgICAgbGV0IHN0YXJ0VG9rZW5JbmRleCA9IHRoaXMudG9rZW5JbmRleDtcbiAgICAgIGxldCBhcmc7XG4gICAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLkVMTElQU0lTKSkge1xuICAgICAgICBhcmcgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgICAgYXJnID0gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlNwcmVhZEVsZW1lbnQoYXJnKSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFyZyA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgfVxuICAgICAgcmVzdWx0LnB1c2goYXJnKTtcbiAgICAgIGlmICghdGhpcy5lYXQoVG9rZW5UeXBlLkNPTU1BKSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8vIDExLjIgTGVmdC1IYW5kLVNpZGUgRXhwcmVzc2lvbnM7XG5cbiAgcGFyc2VOb25Db21wdXRlZFByb3BlcnR5KCkge1xuICAgIGxldCBzdGFydFRva2VuSW5kZXggPSB0aGlzLnRva2VuSW5kZXg7XG5cbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxleCgpO1xuXG4gICAgaWYgKCEodG9rZW4gaW5zdGFuY2VvZiBJZGVudGlmaWVyTGlrZVRva2VuKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRva2VuKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5JZGVudGlmaWVyKHRva2VuLnZhbHVlKSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgICB9XG4gIH1cblxuICBlbnN1cmVBcnJvdygpIHtcbiAgICBpZiAodGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTkVYUEVDVEVEX0xJTkVfVEVSTUlOQVRPUik7XG4gICAgfVxuICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuQVJST1cpKSB7XG4gICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuQVJST1cpO1xuICAgIH1cbiAgfVxuXG4gIHBhcnNlR3JvdXBFeHByZXNzaW9uKCkge1xuICAgIGxldCByZXN0ID0gbnVsbDtcbiAgICBsZXQgc3RhcnQgPSB0aGlzLmV4cGVjdChUb2tlblR5cGUuTFBBUkVOKTtcbiAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLlJQQVJFTikpIHtcbiAgICAgIHRoaXMuZW5zdXJlQXJyb3coKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6IEFSUk9XX0VYUFJFU1NJT05fUEFSQU1TLFxuICAgICAgICBwYXJhbXM6IFtdLFxuICAgICAgICByZXN0OiBudWxsXG4gICAgICB9O1xuICAgIH0gZWxzZSBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLkVMTElQU0lTKSkge1xuICAgICAgcmVzdCA9IG5ldyBTaGlmdC5CaW5kaW5nSWRlbnRpZmllcih0aGlzLnBhcnNlSWRlbnRpZmllcigpKTtcbiAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgICAgdGhpcy5lbnN1cmVBcnJvdygpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogQVJST1dfRVhQUkVTU0lPTl9QQVJBTVMsXG4gICAgICAgIHBhcmFtczogW10sXG4gICAgICAgIHJlc3Q6IHJlc3RcbiAgICAgIH07XG4gICAgfVxuXG4gICAgbGV0IHBvc3NpYmxlQmluZGluZ3MgPSAhdGhpcy5tYXRjaChUb2tlblR5cGUuTFBBUkVOKTtcbiAgICBsZXQgc3RhcnRUb2tlbkluZGV4ID0gdGhpcy50b2tlbkluZGV4O1xuICAgIGxldCBncm91cCA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgIGxldCBwYXJhbXMgPSBbZ3JvdXBdO1xuXG4gICAgd2hpbGUgKHRoaXMuZWF0KFRva2VuVHlwZS5DT01NQSkpIHtcbiAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5FTExJUFNJUykpIHtcbiAgICAgICAgaWYgKCFwb3NzaWJsZUJpbmRpbmdzKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxleCgpO1xuICAgICAgICByZXN0ID0gbmV3IFNoaWZ0LkJpbmRpbmdJZGVudGlmaWVyKHRoaXMucGFyc2VJZGVudGlmaWVyKCkpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHBvc3NpYmxlQmluZGluZ3MgPSBwb3NzaWJsZUJpbmRpbmdzICYmICF0aGlzLm1hdGNoKFRva2VuVHlwZS5MUEFSRU4pO1xuICAgICAgbGV0IGV4cHIgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgIHBhcmFtcy5wdXNoKGV4cHIpO1xuICAgICAgZ3JvdXAgPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQmluYXJ5RXhwcmVzc2lvbihcIixcIiwgZ3JvdXAsIGV4cHIpLCBzdGFydFRva2VuSW5kZXgpO1xuICAgIH1cblxuICAgIGlmIChwb3NzaWJsZUJpbmRpbmdzKSB7XG4gICAgICBwb3NzaWJsZUJpbmRpbmdzID0gcGFyYW1zLmV2ZXJ5KFBhcnNlci5pc0Rlc3RydWN0dXJpbmdBc3NpZ25tZW50VGFyZ2V0V2l0aERlZmF1bHQpO1xuICAgIH1cblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuXG4gICAgaWYgKCF0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCAmJiB0aGlzLm1hdGNoKFRva2VuVHlwZS5BUlJPVykpIHtcbiAgICAgIGlmICghcG9zc2libGVCaW5kaW5ncykge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aFRva2VuKHN0YXJ0LCBFcnJvck1lc3NhZ2VzLklMTEVHQUxfQVJST1dfRlVOQ1RJT05fUEFSQU1TKTtcbiAgICAgIH1cbiAgICAgIC8vIGNoZWNrIGR1cCBwYXJhbXNcbiAgICAgIHBhcmFtcyA9IHBhcmFtcy5tYXAoUGFyc2VyLnRyYW5zZm9ybURlc3RydWN0dXJpbmdBc3NpZ25tZW50KTtcbiAgICAgIGxldCBhbGxCb3VuZE5hbWVzID0gW107XG4gICAgICBwYXJhbXMuZm9yRWFjaChleHByID0+IHtcbiAgICAgICAgbGV0IGJvdW5kTmFtZXMgPSBQYXJzZXIuYm91bmROYW1lcyhleHByKTtcbiAgICAgICAgbGV0IGR1cCA9IGZpcnN0RHVwbGljYXRlKGJvdW5kTmFtZXMpO1xuICAgICAgICBpZiAoZHVwKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLkRVUExJQ0FURV9CSU5ESU5HLCBkdXApO1xuICAgICAgICB9XG4gICAgICAgIGFsbEJvdW5kTmFtZXMgPSBhbGxCb3VuZE5hbWVzLmNvbmNhdChib3VuZE5hbWVzKVxuICAgICAgfSk7XG4gICAgICBpZiAocmVzdCkge1xuICAgICAgICBhbGxCb3VuZE5hbWVzLnB1c2gocmVzdC5pZGVudGlmaWVyLm5hbWUpO1xuICAgICAgfVxuXG4gICAgICBsZXQgZHVwID0gZmlyc3REdXBsaWNhdGUoYWxsQm91bmROYW1lcyk7XG4gICAgICBpZiAodGhpcy5zdHJpY3QgJiYgZHVwKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUEFSQU1fRFVQRSk7XG4gICAgICB9XG5cbiAgICAgIGxldCBzdHJpY3RfcmVzdHJpY3RlZF93b3JkID0gYWxsQm91bmROYW1lcy5zb21lKGlzUmVzdHJpY3RlZFdvcmQpO1xuICAgICAgaWYgKHRoaXMuc3RyaWN0ICYmIHN0cmljdF9yZXN0cmljdGVkX3dvcmQpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlNUUklDVF9QQVJBTV9OQU1FKTtcbiAgICAgIH1cblxuICAgICAgbGV0IHN0cmljdF9yZXNlcnZlZF93b3JkID0gaGFzU3RyaWN0TW9kZVJlc2VydmVkV29yZChhbGxCb3VuZE5hbWVzKTtcbiAgICAgIGlmICh0aGlzLnN0cmljdCAmJiBzdHJpY3RfcmVzZXJ2ZWRfd29yZCkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX1JFU0VSVkVEX1dPUkQpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiBBUlJPV19FWFBSRVNTSU9OX1BBUkFNUyxcbiAgICAgICAgcGFyYW1zLFxuICAgICAgICByZXN0LFxuICAgICAgICBkdXAsXG4gICAgICAgIHN0cmljdF9yZXNlcnZlZF93b3JkLFxuICAgICAgICBzdHJpY3RfcmVzdHJpY3RlZF93b3JkfTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHJlc3QpIHtcbiAgICAgICAgdGhpcy5lbnN1cmVBcnJvdygpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGdyb3VwO1xuICAgIH1cbiAgfVxuXG5cbiAgcGFyc2VBcnJheUV4cHJlc3Npb24oKSB7XG4gICAgbGV0IHN0YXJ0VG9rZW5JbmRleCA9IHRoaXMudG9rZW5JbmRleDtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MQlJBQ0spO1xuXG4gICAgbGV0IGVsZW1lbnRzID0gdGhpcy5wYXJzZUFycmF5RXhwcmVzc2lvbkVsZW1lbnRzKCk7XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUkJSQUNLKTtcblxuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQXJyYXlFeHByZXNzaW9uKGVsZW1lbnRzKSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgfVxuXG4gIHBhcnNlQXJyYXlFeHByZXNzaW9uRWxlbWVudHMoKSB7XG4gICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuUkJSQUNLKSkge1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfVxuICAgICAgbGV0IGVsO1xuXG4gICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuQ09NTUEpKSB7XG4gICAgICAgIHRoaXMubGV4KCk7XG4gICAgICAgIGVsID0gbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBzdGFydFRva2VuSW5kZXggPSB0aGlzLnRva2VuSW5kZXg7XG4gICAgICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuRUxMSVBTSVMpKSB7XG4gICAgICAgICAgZWwgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgICAgICBlbCA9IHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5TcHJlYWRFbGVtZW50KGVsKSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbCA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuUkJSQUNLKSkge1xuICAgICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5DT01NQSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJlc3VsdC5wdXNoKGVsKTtcbiAgICB9XG4gIH1cblxuICBwYXJzZU9iamVjdEV4cHJlc3Npb24oKSB7XG4gICAgbGV0IHN0YXJ0VG9rZW5JbmRleCA9IHRoaXMudG9rZW5JbmRleDtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MQlJBQ0UpO1xuXG4gICAgbGV0IHByb3BlcnR5TWFwID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICBsZXQgcHJvcGVydGllcyA9IHRoaXMucGFyc2VPYmplY3RFeHByZXNzaW9uSXRlbXMocHJvcGVydHlNYXApO1xuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJCUkFDRSk7XG5cbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0Lk9iamVjdEV4cHJlc3Npb24ocHJvcGVydGllcyksIHN0YXJ0VG9rZW5JbmRleCk7XG4gIH1cblxuXG4gIHBhcnNlT2JqZWN0RXhwcmVzc2lvbkl0ZW1zKHByb3BlcnR5TWFwKSB7XG4gICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgIHdoaWxlICghdGhpcy5tYXRjaChUb2tlblR5cGUuUkJSQUNFKSkge1xuICAgICAgcmVzdWx0LnB1c2godGhpcy5wYXJzZU9iamVjdEV4cHJlc3Npb25JdGVtKHByb3BlcnR5TWFwKSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBwYXJzZU9iamVjdEV4cHJlc3Npb25JdGVtKHByb3BlcnR5TWFwKSB7XG4gICAgbGV0IHByb3BlcnR5ID0gdGhpcy5wYXJzZU9iamVjdFByb3BlcnR5KCk7XG4gICAgbGV0IHR5cGUgPSBwcm9wZXJ0eS50eXBlO1xuICAgIGxldCBrZXkgPSBcIiRcIiArICh0eXBlID09PSBcIkJpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXJcIiA/IHByb3BlcnR5LmlkZW50aWZpZXIuaWRlbnRpZmllci5uYW1lIDogcHJvcGVydHkubmFtZS52YWx1ZSk7XG4gICAgbGV0IHZhbHVlID0ge30uaGFzT3duUHJvcGVydHkuY2FsbChwcm9wZXJ0eU1hcCwga2V5KSA/IHByb3BlcnR5TWFwW2tleV0gOiAwO1xuXG4gICAgaWYgKHt9Lmhhc093blByb3BlcnR5LmNhbGwocHJvcGVydHlNYXAsIGtleSkpIHtcbiAgICAgIGlmICgodmFsdWUgJiBJTklUX01BU0spICE9PSAwKSB7XG4gICAgICAgIGlmICh0eXBlID09PSBcIkRhdGFQcm9wZXJ0eVwiICYmIGtleSA9PT0gXCIkX19wcm90b19fXCIpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuRFVQTElDQVRFX1BST1RPX1BST1BFUlRZKTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlICE9PSBcIkRhdGFQcm9wZXJ0eVwiKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLkFDQ0VTU09SX0RBVEFfUFJPUEVSVFkpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodHlwZSA9PT0gXCJEYXRhUHJvcGVydHlcIikge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5BQ0NFU1NPUl9EQVRBX1BST1BFUlRZKTtcbiAgICAgICAgfSBlbHNlIGlmICgodmFsdWUgJiBHRVRURVJfTUFTSykgIT09IDAgJiYgdHlwZSA9PSBcIkdldHRlclwiXG4gICAgICAgICAgICB8fCAodmFsdWUgJiBTRVRURVJfTUFTSykgIT09IDAgJiYgdHlwZSA9PSBcIlNldHRlclwiKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLkFDQ0VTU09SX0dFVF9TRVQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgY2FzZSBcIkRhdGFQcm9wZXJ0eVwiOlxuICAgICAgICBwcm9wZXJ0eU1hcFtrZXldID0gdmFsdWUgfCBJTklUX01BU0s7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIkdldHRlclwiOlxuICAgICAgICBwcm9wZXJ0eU1hcFtrZXldID0gdmFsdWUgfCBHRVRURVJfTUFTSztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiU2V0dGVyXCI6XG4gICAgICAgIHByb3BlcnR5TWFwW2tleV0gPSB2YWx1ZSB8IFNFVFRFUl9NQVNLO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJCUkFDRSkpIHtcbiAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5DT01NQSk7XG4gICAgfVxuICAgIHJldHVybiBwcm9wZXJ0eTtcbiAgfVxuXG4gIHBhcnNlT2JqZWN0UHJvcGVydHlLZXkoKSB7XG4gICAgLy8gUHJvcGVydHlOYW1lW1lpZWxkLEdlbmVyYXRvclBhcmFtZXRlcl06XG4gICAgbGV0IHRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG5cbiAgICBpZiAodGhpcy5lb2YoKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRva2VuKTtcbiAgICB9XG5cbiAgICBpZiAodG9rZW4gaW5zdGFuY2VvZiBTdHJpbmdMaXRlcmFsVG9rZW4pIHtcbiAgICAgIHJldHVybiBuZXcgU2hpZnQuU3RhdGljUHJvcGVydHlOYW1lKHRoaXMucGFyc2VTdHJpbmdMaXRlcmFsKCkudmFsdWUpO1xuICAgIH1cbiAgICBpZiAodG9rZW4gaW5zdGFuY2VvZiBOdW1lcmljTGl0ZXJhbFRva2VuKSB7XG4gICAgICBsZXQgbnVtTGl0ZXJhbCA9IHRoaXMucGFyc2VOdW1lcmljTGl0ZXJhbCgpO1xuICAgICAgcmV0dXJuIG5ldyBTaGlmdC5TdGF0aWNQcm9wZXJ0eU5hbWUoXCJcIiArIChudW1MaXRlcmFsLnR5cGUgPT09IFwiTGl0ZXJhbEluZmluaXR5RXhwcmVzc2lvblwiID8gMSAvIDAgOiBudW1MaXRlcmFsLnZhbHVlKSk7XG4gICAgfVxuICAgIGlmICh0b2tlbiBpbnN0YW5jZW9mIElkZW50aWZpZXJMaWtlVG9rZW4pIHtcbiAgICAgIHJldHVybiBuZXcgU2hpZnQuU3RhdGljUHJvcGVydHlOYW1lKHRoaXMucGFyc2VJZGVudGlmaWVyKCkubmFtZSk7XG4gICAgfVxuICAgIGlmICh0b2tlbi50eXBlID09IFRva2VuVHlwZS5MQlJBQ0spIHtcbiAgICAgIGxldCBwcmV2aW91c0dlbmVyYXRvclBhcmFtZXRlciA9IHRoaXMucGFyYW1HZW5lcmF0b3JQYXJhbWV0ZXI7XG4gICAgICBsZXQgcHJldmlvdXNZaWVsZCA9IHRoaXMucGFyYW1ZaWVsZDtcbiAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MQlJBQ0spO1xuICAgICAgaWYgKHRoaXMucGFyYW1HZW5lcmF0b3JQYXJhbWV0ZXIpIHtcbiAgICAgICAgLy8gWytHZW5lcmF0b3JQYXJhbWV0ZXJdIENvbXB1dGVkUHJvcGVydHlOYW1lXG4gICAgICAgIHRoaXMucGFyYW1HZW5lcmF0b3JQYXJhbWV0ZXIgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5wYXJhbVlpZWxkID0gZmFsc2U7XG4gICAgICB9IC8vIGVsc2UgW35HZW5lcmF0b3JQYXJhbWV0ZXJdIENvbXB1dGVkUHJvcGVydHlOYW1lWz9ZaWVsZF1cbiAgICAgIGxldCBleHByID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUkJSQUNLKTtcbiAgICAgIHRoaXMucGFyYW1HZW5lcmF0b3JQYXJhbWV0ZXIgPSBwcmV2aW91c0dlbmVyYXRvclBhcmFtZXRlcjtcbiAgICAgIHRoaXMucGFyYW1ZaWVsZCA9IHByZXZpb3VzWWllbGQ7XG4gICAgICByZXR1cm4gbmV3IFNoaWZ0LkNvbXB1dGVkUHJvcGVydHlOYW1lKGV4cHIpO1xuICAgIH1cblxuICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5JTlZBTElEX1BST1BFUlRZX05BTUUpO1xuICB9XG5cbiAgcGFyc2VPYmplY3RQcm9wZXJ0eSgpIHtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICBsZXQgc3RhcnRUb2tlbkluZGV4ID0gdGhpcy50b2tlbkluZGV4O1xuXG4gICAgaWYgKHRva2VuLnR5cGUgPT09IFRva2VuVHlwZS5JREVOVElGSUVSKSB7XG4gICAgICBsZXQga2V5ID0gdGhpcy5wYXJzZU9iamVjdFByb3BlcnR5S2V5KCk7XG4gICAgICBsZXQgbmFtZSA9IHRva2VuLnZhbHVlO1xuICAgICAgaWYgKG5hbWUubGVuZ3RoID09PSAzKSB7XG4gICAgICAgIC8vIFByb3BlcnR5IEFzc2lnbm1lbnQ6IEdldHRlciBhbmQgU2V0dGVyLlxuICAgICAgICBpZiAoXCJnZXRcIiA9PT0gbmFtZSAmJiAhdGhpcy5tYXRjaChUb2tlblR5cGUuQ09MT04pKSB7XG4gICAgICAgICAga2V5ID0gdGhpcy5wYXJzZU9iamVjdFByb3BlcnR5S2V5KCk7XG4gICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJQQVJFTik7XG4gICAgICAgICAgbGV0IFtib2R5LCBpc1N0cmljdF0gPSB0aGlzLnBhcnNlRnVuY3Rpb25Cb2R5KCk7XG4gICAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5HZXR0ZXIoa2V5LCBib2R5KSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgICAgICAgfSBlbHNlIGlmIChcInNldFwiID09PSBuYW1lICYmICF0aGlzLm1hdGNoKFRva2VuVHlwZS5DT0xPTikpIHtcbiAgICAgICAgICBrZXkgPSB0aGlzLnBhcnNlT2JqZWN0UHJvcGVydHlLZXkoKTtcbiAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTFBBUkVOKTtcbiAgICAgICAgICB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgICAgICAgIGlmICh0b2tlbi50eXBlICE9PSBUb2tlblR5cGUuSURFTlRJRklFUikge1xuICAgICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJQQVJFTik7XG4gICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aFRva2VuKHRva2VuLCBFcnJvck1lc3NhZ2VzLlVORVhQRUNURURfVE9LRU4sIHRva2VuLnR5cGUubmFtZSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxldCBwYXJhbSA9IHRoaXMucGFyc2VWYXJpYWJsZUlkZW50aWZpZXIoKTtcbiAgICAgICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgICAgICAgICAgbGV0IFtib2R5LCBpc1N0cmljdF0gPSB0aGlzLnBhcnNlRnVuY3Rpb25Cb2R5KCk7XG4gICAgICAgICAgICBpZiAoKHRoaXMuc3RyaWN0IHx8IGlzU3RyaWN0KSAmJiBpc1Jlc3RyaWN0ZWRXb3JkKHBhcmFtLm5hbWUpKSB7XG4gICAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUEFSQU1fTkFNRSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlNldHRlcihrZXksIHBhcmFtLCBib2R5KSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5DT0xPTikpIHtcbiAgICAgICAgbGV0IHZhbHVlID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuRGF0YVByb3BlcnR5KGtleSwgdmFsdWUpLCBzdGFydFRva2VuSW5kZXgpO1xuICAgICAgfSBlbHNlIGlmKHRoaXMuZWF0KFRva2VuVHlwZS5BU1NJR04pKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQmluZGluZ1Byb3BlcnR5SWRlbnRpZmllcihcbiAgICAgICAgICBuZXcgU2hpZnQuQmluZGluZ0lkZW50aWZpZXIobmV3IFNoaWZ0LklkZW50aWZpZXIoa2V5LnZhbHVlKSksXG4gICAgICAgICAgdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKClcbiAgICAgICAgKSwgc3RhcnRUb2tlbkluZGV4KTtcblxuICAgICAgfSBlbHNlIGlmKHRoaXMubWF0Y2goVG9rZW5UeXBlLkxQQVJFTikpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VNZXRob2Qoa2V5LCBzdGFydFRva2VuSW5kZXgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5TaG9ydGhhbmRQcm9wZXJ0eShuZXcgU2hpZnQuSWRlbnRpZmllcihrZXkudmFsdWUpKSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQga2V5ID0gdGhpcy5wYXJzZU9iamVjdFByb3BlcnR5S2V5KCk7XG4gICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5DT0xPTikpIHtcbiAgICAgIC8vIFByb3BlcnR5TmFtZVs/WWllbGRdIDogQXNzaWdubWVudEV4cHJlc3Npb25bSW4sP1lpZWxkXVxuICAgICAgbGV0IHZhbHVlID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkRhdGFQcm9wZXJ0eShrZXksIHZhbHVlKSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgICB9XG4gICAgdGhpcy5tYXRjaChUb2tlblR5cGUuTFBBUkVOKTtcbiAgICByZXR1cm4gdGhpcy5wYXJzZU1ldGhvZChrZXksIHN0YXJ0VG9rZW5JbmRleCk7XG4gIH1cblxuICBwYXJzZU1ldGhvZChrZXksIHN0YXJ0VG9rZW5JbmRleCkge1xuICAgIGxldCBwYXJtSW5mbyA9IHRoaXMucGFyc2VQYXJhbXMobnVsbCk7XG4gICAgbGV0IFtib2R5LyosIGlzU3RyaWN0Ki9dID0gdGhpcy5wYXJzZUZ1bmN0aW9uQm9keSgpO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuTWV0aG9kKGZhbHNlLCBrZXksIHBhcm1JbmZvLnBhcmFtcywgcGFybUluZm8ucmVzdCwgYm9keSksIHN0YXJ0VG9rZW5JbmRleCk7XG4gIH1cblxuICBwYXJzZUZ1bmN0aW9uKGlzRXhwcmVzc2lvbikge1xuICAgIGxldCBzdGFydFRva2VuSW5kZXggPSB0aGlzLnRva2VuSW5kZXg7XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuRlVOQ1RJT04pO1xuXG4gICAgbGV0IGlkID0gbnVsbDtcbiAgICBsZXQgbWVzc2FnZSA9IG51bGw7XG4gICAgbGV0IGZpcnN0UmVzdHJpY3RlZCA9IG51bGw7XG4gICAgaWYgKCFpc0V4cHJlc3Npb24gfHwgIXRoaXMubWF0Y2goVG9rZW5UeXBlLkxQQVJFTikpIHtcbiAgICAgIGxldCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgICAgaWQgPSB0aGlzLnBhcnNlVmFyaWFibGVJZGVudGlmaWVyKCk7XG4gICAgICBpZiAodGhpcy5zdHJpY3QpIHtcbiAgICAgICAgaWYgKGlzUmVzdHJpY3RlZFdvcmQoaWQubmFtZSkpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aFRva2VuKHRva2VuLCBFcnJvck1lc3NhZ2VzLlNUUklDVF9GVU5DVElPTl9OQU1FKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGlzUmVzdHJpY3RlZFdvcmQoaWQubmFtZSkpIHtcbiAgICAgICAgICBmaXJzdFJlc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgICBtZXNzYWdlID0gRXJyb3JNZXNzYWdlcy5TVFJJQ1RfRlVOQ1RJT05fTkFNRTtcbiAgICAgICAgfSBlbHNlIGlmIChpc1N0cmljdE1vZGVSZXNlcnZlZFdvcmRFUzUoaWQubmFtZSkpIHtcbiAgICAgICAgICBmaXJzdFJlc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgICBtZXNzYWdlID0gRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUkVTRVJWRURfV09SRDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICBsZXQgaW5mbyA9IHRoaXMucGFyc2VQYXJhbXMoZmlyc3RSZXN0cmljdGVkKTtcblxuICAgIGlmIChpbmZvLm1lc3NhZ2UgIT0gbnVsbCkge1xuICAgICAgbWVzc2FnZSA9IGluZm8ubWVzc2FnZTtcbiAgICB9XG5cbiAgICBsZXQgcHJldmlvdXNTdHJpY3QgPSB0aGlzLnN0cmljdDtcbiAgICBsZXQgW2JvZHksIGlzU3RyaWN0XSA9IHRoaXMucGFyc2VGdW5jdGlvbkJvZHkoKTtcbiAgICBpZiAobWVzc2FnZSAhPSBudWxsKSB7XG4gICAgICBpZiAoKHRoaXMuc3RyaWN0IHx8IGlzU3RyaWN0KSAmJiBpbmZvLmZpcnN0UmVzdHJpY3RlZCAhPSBudWxsKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoVG9rZW4oaW5mby5maXJzdFJlc3RyaWN0ZWQsIG1lc3NhZ2UpO1xuICAgICAgfVxuICAgICAgaWYgKCh0aGlzLnN0cmljdCB8fCBpc1N0cmljdCkgJiYgaW5mby5zdHJpY3RlZCAhPSBudWxsKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoVG9rZW4oaW5mby5zdHJpY3RlZCwgbWVzc2FnZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuc3RyaWN0ID0gcHJldmlvdXNTdHJpY3Q7XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyAoaXNFeHByZXNzaW9uID8gU2hpZnQuRnVuY3Rpb25FeHByZXNzaW9uIDogU2hpZnQuRnVuY3Rpb25EZWNsYXJhdGlvbikoZmFsc2UsIGlkLCBpbmZvLnBhcmFtcywgaW5mby5yZXN0LCBib2R5KSxcbiAgICAgICAgc3RhcnRUb2tlbkluZGV4KTtcbiAgfVxuXG5cbiAgcGFyc2VQYXJhbXMoZnIpIHtcbiAgICBsZXQgaW5mbyA9IHtwYXJhbXM6IFtdLCByZXN0OiBudWxsfTtcbiAgICBpbmZvLmZpcnN0UmVzdHJpY3RlZCA9IGZyO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MUEFSRU4pO1xuXG4gICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5SUEFSRU4pKSB7XG4gICAgICBsZXQgYm91bmQgPSBbXTtcbiAgICAgIGxldCBzZWVuUmVzdCA9IGZhbHNlO1xuXG4gICAgICB3aGlsZSAoIXRoaXMuZW9mKCkpIHtcbiAgICAgICAgbGV0IHRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgICAgIGxldCBzdGFydFRva2VuSW5kZXggPSB0aGlzLnRva2VuSW5kZXg7XG4gICAgICAgIGxldCBwYXJhbTtcbiAgICAgICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5FTExJUFNJUykpIHtcbiAgICAgICAgICB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgICAgICAgIHBhcmFtID0gbmV3IFNoaWZ0LkJpbmRpbmdJZGVudGlmaWVyKHRoaXMucGFyc2VJZGVudGlmaWVyKCkpO1xuICAgICAgICAgIHNlZW5SZXN0ID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuTFBBUkVOKSkge1xuICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcGFyYW0gPSB0aGlzLnBhcnNlTGVmdEhhbmRTaWRlRXhwcmVzc2lvbigpO1xuICAgICAgICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuQVNTSUdOKSkge1xuICAgICAgICAgICAgcGFyYW0gPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQXNzaWdubWVudEV4cHJlc3Npb24oXCI9XCIsIHBhcmFtLCB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghUGFyc2VyLmlzRGVzdHJ1Y3R1cmluZ0Fzc2lnbm1lbnRUYXJnZXRXaXRoRGVmYXVsdChwYXJhbSkpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodG9rZW4pO1xuICAgICAgICB9XG4gICAgICAgIHBhcmFtID0gUGFyc2VyLnRyYW5zZm9ybURlc3RydWN0dXJpbmdBc3NpZ25tZW50KHBhcmFtKTtcblxuICAgICAgICBsZXQgbmV3Qm91bmQgPSBQYXJzZXIuYm91bmROYW1lcyhwYXJhbSk7XG4gICAgICAgIFtdLnB1c2guYXBwbHkoYm91bmQsIG5ld0JvdW5kKTtcblxuICAgICAgICBpZiAoZmlyc3REdXBsaWNhdGUobmV3Qm91bmQpICE9IG51bGwpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aFRva2VuKHRva2VuLCBFcnJvck1lc3NhZ2VzLkRVUExJQ0FURV9CSU5ESU5HLCBmaXJzdER1cGxpY2F0ZShuZXdCb3VuZCkpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnN0cmljdCkge1xuICAgICAgICAgIGlmIChuZXdCb3VuZC5zb21lKGlzUmVzdHJpY3RlZFdvcmQpKSB7XG4gICAgICAgICAgICBpbmZvLnN0cmljdGVkID0gdG9rZW47XG4gICAgICAgICAgICBpbmZvLm1lc3NhZ2UgPSBFcnJvck1lc3NhZ2VzLlNUUklDVF9QQVJBTV9OQU1FO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZmlyc3REdXBsaWNhdGUoYm91bmQpICE9IG51bGwpIHtcbiAgICAgICAgICAgIGluZm8uc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgICAgIGluZm8ubWVzc2FnZSA9IEVycm9yTWVzc2FnZXMuU1RSSUNUX1BBUkFNX0RVUEU7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGluZm8uZmlyc3RSZXN0cmljdGVkID09IG51bGwpIHtcbiAgICAgICAgICBpZiAobmV3Qm91bmQuc29tZShpc1Jlc3RyaWN0ZWRXb3JkKSkge1xuICAgICAgICAgICAgaW5mby5maXJzdFJlc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgICAgIGluZm8ubWVzc2FnZSA9IEVycm9yTWVzc2FnZXMuU1RSSUNUX1BBUkFNX05BTUU7XG4gICAgICAgICAgfSBlbHNlIGlmIChoYXNTdHJpY3RNb2RlUmVzZXJ2ZWRXb3JkKG5ld0JvdW5kKSkge1xuICAgICAgICAgICAgaW5mby5maXJzdFJlc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgICAgIGluZm8ubWVzc2FnZSA9IEVycm9yTWVzc2FnZXMuU1RSSUNUX1JFU0VSVkVEX1dPUkQ7XG4gICAgICAgICAgfSBlbHNlIGlmIChmaXJzdER1cGxpY2F0ZShib3VuZCkgIT0gbnVsbCkge1xuICAgICAgICAgICAgaW5mby5maXJzdFJlc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgICAgIGluZm8ubWVzc2FnZSA9IEVycm9yTWVzc2FnZXMuU1RSSUNUX1BBUkFNX0RVUEU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNlZW5SZXN0KSB7XG4gICAgICAgICAgaW5mby5yZXN0ID0gcGFyYW07XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgaW5mby5wYXJhbXMucHVzaChwYXJhbSk7XG4gICAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5SUEFSRU4pKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNPTU1BKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcbiAgICByZXR1cm4gaW5mbztcbiAgfVxuXG5cbn1cbiJdfQ==