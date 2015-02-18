"use strict";

var _slicedToArray = function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) { _arr.push(_step.value); if (i && _arr.length === i) break; } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } };

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

function cpLoc(from, to) {
  if ("loc" in from) to.loc = from.loc;
  return to;
}

/**
 *
 * @param {[string]} strings
 * @returns {string?}
 */
function firstDuplicate(strings) {
  if (strings.length < 2) {
    return null;
  }var map = {};
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
            return cpLoc(node, new Shift.ObjectBinding(node.properties.map(Parser.transformDestructuringAssignment)));
          case "DataProperty":
            return cpLoc(node, new Shift.BindingPropertyProperty(node.name, Parser.transformDestructuringAssignment(node.expression)));
          case "ShorthandProperty":
            return cpLoc(node, new Shift.BindingPropertyIdentifier(cpLoc(node, new Shift.BindingIdentifier(node.name)), null));
          case "ArrayExpression":
            var last = node.elements[node.elements.length - 1];
            if (last != null && last.type === "SpreadElement") {
              return cpLoc(node, new Shift.ArrayBinding(node.elements.slice(0, -1).map(function (e) {
                return e && Parser.transformDestructuringAssignment(e);
              }), cpLoc(last.expression, new Shift.BindingIdentifier(last.expression.identifier))));
            } else {
              return cpLoc(node, new Shift.ArrayBinding(node.elements.map(function (e) {
                return e && Parser.transformDestructuringAssignment(e);
              }), null));
            }
          case "AssignmentExpression":
            return cpLoc(node, new Shift.BindingWithDefault(Parser.transformDestructuringAssignment(node.binding), node.expression));
          case "IdentifierExpression":
            return cpLoc(node, new Shift.BindingIdentifier(node.identifier));
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
            if (node.elements.length === 0) {
              return false;
            }if (!node.elements.slice(0, -1).filter(function (e) {
              return e != null;
            }).every(Parser.isDestructuringAssignmentTargetWithDefault)) {
              return false;
            }var last = node.elements[node.elements.length - 1];
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

              if (typeof _ret === "object") {
                return _ret.v;
              }
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

              if (typeof _ret2 === "object") {
                return _ret2.v;
              }
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
          var isStringLiteral = token.type === TokenType.STRING;
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
          case TokenType.CLASS:
            return this.parseClass(false);
          default:
            {
              var expr = this.parseExpression();

              // 12.12 Labelled Statements;
              if (expr.type === "IdentifierExpression" && this.eat(TokenType.COLON)) {
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
        return this.markLocation(new Shift.Identifier(this.expect(TokenType.IDENTIFIER).value), startLocation);
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
        this.eat(TokenType.SEMICOLON);

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
        if (this.eat(TokenType.SEMICOLON)) {
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
        if (this.eat(TokenType.ELSE)) {
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

        if (this.eat(TokenType.RBRACE)) {
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
          if (this.eat(TokenType.FINALLY)) {
            var finalizer = this.parseBlock();
            return new Shift.TryFinallyStatement(block, handler, finalizer);
          }
          return new Shift.TryCatchStatement(block, handler);
        }

        if (this.eat(TokenType.FINALLY)) {
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
          throw this.createErrorWithLocation(token, ErrorMessages.DUPLICATE_BINDING, firstDuplicate(bound));
        }

        if (this.strict && bound.some(isRestrictedWord)) {
          throw this.createErrorWithLocation(token, ErrorMessages.STRICT_CATCH_VARIABLE);
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
          throw this.createErrorWithLocation(token, ErrorMessages.DUPLICATE_BINDING, firstDuplicate(bound));
        }

        if (this.strict && bound.some(isRestrictedWord)) {
          throw this.createErrorWithLocation(token, ErrorMessages.STRICT_VAR_NAME);
        }

        var init = null;
        if (kind == "const") {
          this.expect(TokenType.ASSIGN);
          init = this.parseAssignmentExpression();
        } else if (this.eat(TokenType.ASSIGN)) {
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
    parseArrowExpressionTail: {
      value: function parseArrowExpressionTail(head, startLocation) {
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
          return this.markLocation(new Shift.ArrowExpression(params, rest, body), startLocation);
        } else {
          var body = this.parseAssignmentExpression();
          return this.markLocation(new Shift.ArrowExpression(params, rest, body), startLocation);
        }
      },
      writable: true,
      configurable: true
    },
    parseAssignmentExpression: {
      value: function parseAssignmentExpression() {
        var token = this.lookahead;
        var startLocation = this.getLocation();

        var node = this.parseConditionalExpression();

        if (!this.hasLineTerminatorBeforeNext && this.match(TokenType.ARROW)) {
          return this.parseArrowExpressionTail(node, startLocation);
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
            throw this.createErrorWithLocation(token, ErrorMessages.DUPLICATE_BINDING, firstDuplicate(bound));
          }

          if (this.strict && bound.some(isRestrictedWord)) {
            throw this.createErrorWithLocation(token, ErrorMessages.STRICT_LHS_ASSIGNMENT);
          }

          this.lex();
          var right = this.parseAssignmentExpression();
          return this.markLocation(new Shift.AssignmentExpression(operator.type.name, node, right), startLocation);
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
        var startLocation = this.getLocation();
        var expr = this.parseBinaryExpression();
        if (this.eat(TokenType.CONDITIONAL)) {
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
        if (!Parser.isValidSimpleAssignmentTarget(expr)) {
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
        if (!this.lookahead.type.klass.isIdentifierName) {
          throw this.createUnexpected(this.lookahead);
        } else {
          return this.lex().value;
        }
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

        switch (this.lookahead.type) {
          case TokenType.IDENTIFIER:
            return this.markLocation(new Shift.IdentifierExpression(this.parseIdentifier()), startLocation);
          case TokenType.STRING:
            return this.parseStringLiteral();
          case TokenType.NUMBER:
            return this.parseNumericLiteral();
          case TokenType.THIS:
            this.lex();
            return this.markLocation(new Shift.ThisExpression(), startLocation);
          case TokenType.FUNCTION:
            return this.markLocation(this.parseFunction(true), startLocation);
          case TokenType.TRUE:
            this.lex();
            return this.markLocation(new Shift.LiteralBooleanExpression(true), startLocation);
          case TokenType.FALSE:
            this.lex();
            return this.markLocation(new Shift.LiteralBooleanExpression(false), startLocation);
          case TokenType.NULL:
            this.lex();
            return this.markLocation(new Shift.LiteralNullExpression(), startLocation);
          case TokenType.LBRACK:
            return this.parseArrayExpression();
          case TokenType.LBRACE:
            return this.parseObjectExpression();
          case TokenType.DIV:
          case TokenType.ASSIGN_DIV:
            this.lookahead = this.scanRegExp(this.lookahead.type === TokenType.DIV ? "/" : "/=");
            var token = this.lex();
            var lastSlash = token.value.lastIndexOf("/");
            var pattern = token.value.slice(1, lastSlash).replace("\\/", "/");
            var flags = token.value.slice(lastSlash + 1);
            try {
              RegExp(pattern, flags);
            } catch (unused) {
              throw this.createErrorWithLocation(token, ErrorMessages.INVALID_REGULAR_EXPRESSION);
            }
            return this.markLocation(new Shift.LiteralRegExpExpression(pattern, flags), startLocation);
          case TokenType.CLASS:
            return this.parseClass(true);
          default:
            throw this.createUnexpected(this.lex());
        }
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
    parseIdentifierName: {
      value: function parseIdentifierName() {
        var startLocation = this.getLocation();
        if (this.lookahead.type.klass.isIdentifierName) {
          return this.markLocation(new Shift.Identifier(this.lex().value), startLocation);
        } else {
          throw this.createUnexpected(this.lookahead);
        }
      },
      writable: true,
      configurable: true
    },
    parseIdentifier: {
      value: function parseIdentifier() {
        var startLocation = this.getLocation();
        return this.markLocation(new Shift.Identifier(this.expect(TokenType.IDENTIFIER).value), startLocation);
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
          var startLocation = this.getLocation();
          var arg = undefined;
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
      },
      writable: true,
      configurable: true
    },
    ensureArrow: {

      // 11.2 Left-Hand-Side Expressions;

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
        var startLocation = this.getLocation();
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
          group = this.markLocation(new Shift.BinaryExpression(",", group, expr), startLocation);
        }

        if (possibleBindings) {
          possibleBindings = params.every(Parser.isDestructuringAssignmentTargetWithDefault);
        }

        this.expect(TokenType.RPAREN);

        if (!this.hasLineTerminatorBeforeNext && this.match(TokenType.ARROW)) {
          var _ret = (function () {
            if (!possibleBindings) {
              throw _this.createErrorWithLocation(start, ErrorMessages.ILLEGAL_ARROW_FUNCTION_PARAMS);
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

          if (typeof _ret === "object") {
            return _ret.v;
          }
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

          if (this.eat(TokenType.COMMA)) {
            el = null;
          } else {
            var startLocation = this.getLocation();
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
      },
      writable: true,
      configurable: true
    },
    parseObjectExpression: {
      value: function parseObjectExpression() {
        var startLocation = this.getLocation();

        this.expect(TokenType.LBRACE);

        var properties = this.parseObjectExpressionItems();

        this.expect(TokenType.RBRACE);

        return this.markLocation(new Shift.ObjectExpression(properties), startLocation);
      },
      writable: true,
      configurable: true
    },
    parseObjectExpressionItems: {
      value: function parseObjectExpressionItems() {
        var result = [];
        var has__proto__ = [false];
        while (!this.match(TokenType.RBRACE)) {
          result.push(this.parseObjectExpressionItem(has__proto__));
          if (!this.match(TokenType.RBRACE)) {
            this.expect(TokenType.COMMA);
          }
        }
        return result;
      },
      writable: true,
      configurable: true
    },
    parseObjectExpressionItem: {
      value: function parseObjectExpressionItem(has__proto__) {
        var startLocation = this.getLocation();
        var token = this.lookahead;
        var _parseMethodDefinition = this.parseMethodDefinition();

        var methodOrKey = _parseMethodDefinition.methodOrKey;
        var kind = _parseMethodDefinition.kind;
        switch (kind) {
          case "method":
            return methodOrKey;
          case "identifier":
            // IdentifierReference,
            if (this.eat(TokenType.ASSIGN)) {
              // CoverInitializedName
              return this.markLocation(new Shift.BindingPropertyIdentifier(new Shift.BindingIdentifier(new Shift.Identifier(methodOrKey.value)), this.parseAssignmentExpression()), startLocation);
            } else if (!this.match(TokenType.COLON)) {
              return this.markLocation(new Shift.ShorthandProperty(new Shift.Identifier(methodOrKey.value)), startLocation);
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
        return this.markLocation(new Shift.DataProperty(methodOrKey, this.parseAssignmentExpression()), startLocation);
      },
      writable: true,
      configurable: true
    },
    parsePropertyName: {
      value: function parsePropertyName() {
        // PropertyName[Yield,GeneratorParameter]:
        var token = this.lookahead;
        var startLocation = this.getLocation();

        if (this.eof()) {
          throw this.createUnexpected(token);
        }

        switch (token.type) {
          case TokenType.STRING:
            return this.markLocation(new Shift.StaticPropertyName(this.parseStringLiteral().value), startLocation);
          case TokenType.NUMBER:
            var numLiteral = this.parseNumericLiteral();
            return this.markLocation(new Shift.StaticPropertyName("" + (numLiteral.type === "LiteralInfinityExpression" ? 1 / 0 : numLiteral.value)), startLocation);
          case TokenType.LBRACK:
            var previousGeneratorParameter = this.paramGeneratorParameter;
            var previousYield = this.paramYield;
            this.expect(TokenType.LBRACK);
            // TODO(bzhang): generator support
            // istanbul ignore next
            if (this.paramGeneratorParameter) {
              // [+GeneratorParameter] ComputedPropertyName
              this.paramGeneratorParameter = false;
              this.paramYield = false;
            } // else [~GeneratorParameter] ComputedPropertyName[?Yield]
            var expr = this.parseAssignmentExpression();
            this.expect(TokenType.RBRACK);
            this.paramGeneratorParameter = previousGeneratorParameter;
            this.paramYield = previousYield;
            return this.markLocation(new Shift.ComputedPropertyName(expr), startLocation);
        }

        return this.markLocation(new Shift.StaticPropertyName(this.parseIdentifierName().name), startLocation);
      },
      writable: true,
      configurable: true
    },
    lookaheadPropertyName: {

      /**
       * Test if lookahead can be the beginning of a `PropertyName`.
       * @returns {boolean}
       */
      value: function lookaheadPropertyName() {
        switch (this.lookahead.type) {
          case TokenType.NUMBER:
          case TokenType.STRING:
          case TokenType.LBRACK:
            return true;
          default:
            return this.lookahead.type.klass.isIdentifierName;
        }
      },
      writable: true,
      configurable: true
    },
    parseMethodDefinition: {

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
      value: function parseMethodDefinition() {
        var token = this.lookahead;
        var startLocation = this.getLocation();

        // TODO(bzhang): GeneratorMethod (lookahead='*')

        var key = this.parsePropertyName();

        if (token.type === TokenType.IDENTIFIER) {
          var _name = token.value;
          if (_name.length === 3) {
            // Property Assignment: Getter and Setter.
            if ("get" === _name && this.lookaheadPropertyName()) {
              key = this.parsePropertyName();
              this.expect(TokenType.LPAREN);
              this.expect(TokenType.RPAREN);
              var _parseFunctionBody = this.parseFunctionBody();

              var _parseFunctionBody2 = _slicedToArray(_parseFunctionBody, 1);

              var body = _parseFunctionBody2[0];
              return {
                methodOrKey: this.markLocation(new Shift.Getter(key, body), startLocation),
                kind: "method"
              };
            } else if ("set" === _name && this.lookaheadPropertyName()) {
              key = this.parsePropertyName();
              this.expect(TokenType.LPAREN);
              var param = this.parseParam();
              var info = {};
              this.checkParam(param, token, [], info);
              this.expect(TokenType.RPAREN);
              var _parseFunctionBody3 = this.parseFunctionBody();

              var _parseFunctionBody32 = _slicedToArray(_parseFunctionBody3, 2);

              var body = _parseFunctionBody32[0];
              var isStrict = _parseFunctionBody32[1];
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
          var paramInfo = this.parseParams(null);
          var _parseFunctionBody4 = this.parseFunctionBody();

          var _parseFunctionBody42 = _slicedToArray(_parseFunctionBody4, 2);

          var body = _parseFunctionBody42[0];
          var isStrict = _parseFunctionBody42[1];
          if (isStrict) {
            if (paramInfo.firstRestricted) {
              throw this.createErrorWithLocation(paramInfo.firstRestricted, paramInfo.message);
            }
          }
          return {
            methodOrKey: this.markLocation(new Shift.Method(false, key, paramInfo.params, paramInfo.rest, body), startLocation),
            kind: "method"
          };
        }

        return {
          methodOrKey: key,
          kind: token.type === TokenType.IDENTIFIER ? "identifier" : "property"
        };
      },
      writable: true,
      configurable: true
    },
    parseClass: {
      value: function parseClass(isExpr) {
        var location = this.getLocation();
        this.expect(TokenType.CLASS);
        var id = null;
        var heritage = null;
        if (!isExpr || this.match(TokenType.IDENTIFIER)) {
          id = this.parseVariableIdentifier();
        }


        var oldParamYield = this.paramYield;
        // TODO(bzhang): generator support
        // istanbul ignore next
        if (this.paramGeneratorParameter) {
          this.paramYield = false;
        }
        if (this.eat(TokenType.EXTENDS)) {
          heritage = this.parseLeftHandSideExpressionAllowCall();
        }

        this.expect(TokenType.LBRACE);
        var originalStrict = this.strict;
        this.strict = true;
        var methods = [];
        var hasConstructor = false;
        while (!this.eat(TokenType.RBRACE)) {
          if (this.eat(TokenType.SEMICOLON)) {
            continue;
          }
          var methodToken = this.lookahead;
          var isStatic = false;
          var _parseMethodDefinition = this.parseMethodDefinition();

          var methodOrKey = _parseMethodDefinition.methodOrKey;
          var kind = _parseMethodDefinition.kind;
          if (kind === "identifier" && methodOrKey.value === "static") {
            isStatic = true;
            var _ref = this.parseMethodDefinition();

            methodOrKey = _ref.methodOrKey;
            kind = _ref.kind;
          }
          switch (kind) {
            case "method":
              var key = methodOrKey.name;
              if (!isStatic) {
                if (key.type === "StaticPropertyName" && key.value === "constructor") {
                  if (methodOrKey.type !== "Method") {
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
        this.strict = originalStrict;
        this.paramYield = oldParamYield;
        return this.markLocation(new (isExpr ? Shift.ClassExpression : Shift.ClassDeclaration)(id, heritage, methods), location);
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
        return this.markLocation(new (isExpression ? Shift.FunctionExpression : Shift.FunctionDeclaration)(false, id, info.params, info.rest, body), startLocation);
      },
      writable: true,
      configurable: true
    },
    parseParam: {
      value: function parseParam(bound, info) {
        var token = this.lookahead;
        if (this.match(TokenType.LPAREN)) {
          throw this.createUnexpected(this.lookahead);
        }
        var param = this.parseLeftHandSideExpression();
        if (this.eat(TokenType.ASSIGN)) {
          param = this.markLocation(new Shift.AssignmentExpression("=", param, this.parseAssignmentExpression()));
        }
        if (!Parser.isDestructuringAssignmentTargetWithDefault(param)) {
          throw this.createUnexpected(token);
        }
        return Parser.transformDestructuringAssignment(param);
      },
      writable: true,
      configurable: true
    },
    checkParam: {
      value: function checkParam(param, token, bound, info) {
        var newBound = Parser.boundNames(param);
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
            var startLocation = this.getLocation();
            var param = undefined;
            if (this.eat(TokenType.ELLIPSIS)) {
              token = this.lookahead;
              param = new Shift.BindingIdentifier(this.parseIdentifier());
              cpLoc(param.identifier, param);
              seenRest = true;
            } else {
              param = this.parseParam();
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

        this.expect(TokenType.RPAREN);
        return info;
      },
      writable: true,
      configurable: true
    }
  });

  return Parser;
})(Tokenizer);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9wYXJzZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWdCWSxLQUFLLFdBQU0sV0FBVzs7cUJBRTBCLFNBQVM7O0lBQTdELGdCQUFnQixVQUFoQixnQkFBZ0I7SUFBRSwyQkFBMkIsVUFBM0IsMkJBQTJCO0lBRTdDLGFBQWEsV0FBTyxVQUFVLEVBQTlCLGFBQWE7eUJBUVEsYUFBYTs7SUFObkMsU0FBUztJQUNaLFVBQVUsY0FBVixVQUFVO0lBQ1YsU0FBUyxjQUFULFNBQVM7SUFDVCxlQUFlLGNBQWYsZUFBZTtJQUNmLG1CQUFtQixjQUFuQixtQkFBbUI7SUFDbkIsbUJBQW1CLGNBQW5CLG1CQUFtQjtJQUNuQixrQkFBa0IsY0FBbEIsa0JBQWtCOzs7O0FBR3RCLElBQU0sdUJBQXVCLEdBQUcsbURBQW1ELENBQUM7O0FBRXBGLElBQU0seUJBQXlCLEdBQUc7QUFDaEMsY0FBWSxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsSUFBSTtBQUMxRixVQUFRLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSTtDQUMzRCxDQUFDOztBQUVGLElBQU0sVUFBVSxHQUFHO0FBQ2pCLFVBQVEsRUFBRSxDQUFDO0FBQ1gsT0FBSyxFQUFFLENBQUM7QUFDUixZQUFVLEVBQUUsQ0FBQztBQUNiLGFBQVcsRUFBRSxDQUFDO0FBQ2QsZUFBYSxFQUFFLENBQUM7QUFDaEIsV0FBUyxFQUFFLENBQUM7QUFDWixZQUFVLEVBQUUsQ0FBQztBQUNiLFdBQVMsRUFBRSxDQUFDO0FBQ1osWUFBVSxFQUFFLENBQUM7QUFDYixZQUFVLEVBQUUsQ0FBQztBQUNiLFVBQVEsRUFBRSxDQUFDO0FBQ1gsWUFBVSxFQUFFLENBQUM7QUFDYixjQUFZLEVBQUUsRUFBRTtBQUNoQixVQUFRLEVBQUUsRUFBRTtBQUNaLGdCQUFjLEVBQUUsRUFBRTtBQUNsQixPQUFLLEVBQUUsRUFBRTtBQUNULFNBQU8sRUFBRSxFQUFFO0FBQ1gsTUFBSSxFQUFFLEVBQUU7QUFDUixLQUFHLEVBQUUsRUFBRTtBQUNQLGdCQUFjLEVBQUUsRUFBRTtBQUNsQixRQUFNLEVBQUUsRUFBRTtBQUNWLFNBQU8sRUFBRSxFQUFFO0NBQ1osQ0FBQzs7QUFFRixJQUFNLGdCQUFnQixHQUFHO0FBQ3ZCLE1BQUksRUFBRSxVQUFVLENBQUMsU0FBUztBQUMxQixNQUFJLEVBQUUsVUFBVSxDQUFDLFVBQVU7QUFDM0IsS0FBRyxFQUFFLFVBQVUsQ0FBQyxTQUFTO0FBQ3pCLEtBQUcsRUFBRSxVQUFVLENBQUMsVUFBVTtBQUMxQixLQUFHLEVBQUUsVUFBVSxDQUFDLFVBQVU7QUFDMUIsTUFBSSxFQUFFLFVBQVUsQ0FBQyxRQUFRO0FBQ3pCLE1BQUksRUFBRSxVQUFVLENBQUMsUUFBUTtBQUN6QixPQUFLLEVBQUUsVUFBVSxDQUFDLFFBQVE7QUFDMUIsT0FBSyxFQUFFLFVBQVUsQ0FBQyxRQUFRO0FBQzFCLEtBQUcsRUFBRSxVQUFVLENBQUMsVUFBVTtBQUMxQixLQUFHLEVBQUUsVUFBVSxDQUFDLFVBQVU7QUFDMUIsTUFBSSxFQUFFLFVBQVUsQ0FBQyxVQUFVO0FBQzNCLE1BQUksRUFBRSxVQUFVLENBQUMsVUFBVTtBQUMzQixNQUFJLEVBQUUsVUFBVSxDQUFDLFVBQVU7QUFDM0IsY0FBWSxFQUFFLFVBQVUsQ0FBQyxVQUFVO0FBQ25DLE1BQUksRUFBRSxVQUFVLENBQUMsWUFBWTtBQUM3QixNQUFJLEVBQUUsVUFBVSxDQUFDLFlBQVk7QUFDN0IsT0FBSyxFQUFFLFVBQVUsQ0FBQyxZQUFZO0FBQzlCLEtBQUcsRUFBRSxVQUFVLENBQUMsUUFBUTtBQUN4QixLQUFHLEVBQUUsVUFBVSxDQUFDLFFBQVE7QUFDeEIsS0FBRyxFQUFFLFVBQVUsQ0FBQyxjQUFjO0FBQzlCLEtBQUcsRUFBRSxVQUFVLENBQUMsY0FBYztBQUM5QixLQUFHLEVBQUUsVUFBVSxDQUFDLGNBQWMsRUFDL0IsQ0FBQzs7QUFFRixTQUFTLEtBQUssQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFO0FBQ3ZCLE1BQUksS0FBSyxJQUFJLElBQUksRUFDZixFQUFFLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUE7QUFDbkIsU0FBTyxFQUFFLENBQUM7Q0FDWDs7Ozs7OztBQU9ELFNBQVMsY0FBYyxDQUFDLE9BQU8sRUFBRTtBQUMvQixNQUFJLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQztBQUNwQixXQUFPLElBQUksQ0FBQztHQUFBLEFBQ2QsSUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDO0FBQ2IsT0FBSyxJQUFJLE1BQU0sR0FBRyxDQUFDLEVBQUUsTUFBTSxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLEVBQUU7QUFDdEQsUUFBSSxFQUFFLEdBQUcsR0FBRyxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUMvQixRQUFJLEdBQUcsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFDMUIsYUFBTyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7S0FDeEI7QUFDRCxPQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDO0dBQ2hCO0FBQ0QsU0FBTyxJQUFJLENBQUM7Q0FDYjs7QUFFRCxTQUFTLHlCQUF5QixDQUFDLEdBQUcsRUFBRTtBQUN0QyxTQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUMsVUFBQSxFQUFFO1dBQUkseUJBQXlCLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQztHQUFBLENBQUMsQ0FBQztDQUNyRTs7SUFFWSxNQUFNLFdBQU4sTUFBTSxjQUFTLFNBQVM7QUFDeEIsV0FEQSxNQUFNLENBQ0wsTUFBTTswQkFEUCxNQUFNOztBQUVmLCtCQUZTLE1BQU0sNkNBRVQsTUFBTSxFQUFFO0FBQ2QsUUFBSSxDQUFDLFFBQVEsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3BDLFFBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO0FBQ3BCLFFBQUksQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDO0FBQ3pCLFFBQUksQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDO0FBQ3RCLFFBQUksQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDO0FBQzVCLFFBQUksQ0FBQyx1QkFBdUIsR0FBRyxLQUFLLENBQUM7QUFDckMsUUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7R0FDekI7O1lBVlUsTUFBTSxFQUFTLFNBQVM7O3VCQUF4QixNQUFNO0FBZ1VWLG9DQUFnQzthQUFBLDBDQUFDLElBQUksRUFBRTtBQUM1QyxnQkFBUSxJQUFJLENBQUMsSUFBSTtBQUNmLGVBQUssa0JBQWtCO0FBQ3JCLG1CQUFPLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxLQUFLLENBQUMsYUFBYSxDQUN4QyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsZ0NBQWdDLENBQUMsQ0FDN0QsQ0FBQyxDQUFDO0FBQUEsQUFDTCxlQUFLLGNBQWM7QUFDakIsbUJBQU8sS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLEtBQUssQ0FBQyx1QkFBdUIsQ0FDbEQsSUFBSSxDQUFDLElBQUksRUFDVCxNQUFNLENBQUMsZ0NBQWdDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUN6RCxDQUFDLENBQUM7QUFBQSxBQUNMLGVBQUssbUJBQW1CO0FBQ3RCLG1CQUFPLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQ3BELEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQ25ELElBQUksQ0FDTCxDQUFDLENBQUM7QUFBQSxBQUNMLGVBQUssaUJBQWlCO0FBQ3BCLGdCQUFJLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ25ELGdCQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxlQUFlLEVBQUU7QUFDakQscUJBQU8sS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLEtBQUssQ0FBQyxZQUFZLENBQ3ZDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxVQUFBLENBQUM7dUJBQUksQ0FBQyxJQUFJLE1BQU0sQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDLENBQUM7ZUFBQSxDQUFDLEVBQ3BGLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FDaEYsQ0FBQyxDQUFDO2FBQ0osTUFBTTtBQUNMLHFCQUFPLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxLQUFLLENBQUMsWUFBWSxDQUN2QyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxVQUFBLENBQUM7dUJBQUksQ0FBQyxJQUFJLE1BQU0sQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDLENBQUM7ZUFBQSxDQUFDLEVBQ3ZFLElBQUksQ0FDTCxDQUFDLENBQUM7YUFDSjtBQUFBLEFBQ0gsZUFBSyxzQkFBc0I7QUFDekIsbUJBQU8sS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLEtBQUssQ0FBQyxrQkFBa0IsQ0FDN0MsTUFBTSxDQUFDLGdDQUFnQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFDckQsSUFBSSxDQUFDLFVBQVUsQ0FDaEIsQ0FBQyxDQUFDO0FBQUEsQUFDTCxlQUFLLHNCQUFzQjtBQUN6QixtQkFBTyxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0FBQUEsU0FDcEU7QUFDRCxlQUFPLElBQUksQ0FBQztPQUNiOzs7O0FBRU0sbUNBQStCO2FBQUEseUNBQUMsSUFBSSxFQUFFO0FBQzNDLGdCQUFRLElBQUksQ0FBQyxJQUFJO0FBQ2YsZUFBSyxrQkFBa0I7QUFDckIsbUJBQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsVUFBQSxDQUFDO3FCQUM1QixDQUFDLENBQUMsSUFBSSxLQUFLLDJCQUEyQixJQUN0QyxDQUFDLENBQUMsSUFBSSxLQUFLLG1CQUFtQixJQUM5QixDQUFDLENBQUMsSUFBSSxLQUFLLGNBQWMsSUFDdkIsTUFBTSxDQUFDLDBDQUEwQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUM7YUFBQSxDQUNsRSxDQUFDO0FBQUEsQUFDSixlQUFLLGlCQUFpQjtBQUNwQixnQkFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sS0FBSyxDQUFDO0FBQzVCLHFCQUFPLEtBQUssQ0FBQzthQUFBLEFBQ2YsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFBLENBQUM7cUJBQUksQ0FBQyxJQUFJLElBQUk7YUFBQSxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQywwQ0FBMEMsQ0FBQztBQUM3RyxxQkFBTyxLQUFLLENBQUM7YUFBQSxBQUNmLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDbkQsbUJBQU8sSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLGVBQWUsR0FDaEQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEtBQUssc0JBQXNCLEdBQy9DLElBQUksSUFBSSxJQUFJLElBQUksTUFBTSxDQUFDLDBDQUEwQyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQUEsQUFDOUUsZUFBSyxjQUFjO0FBQUMsQUFDcEIsZUFBSyxtQkFBbUI7QUFBQyxBQUN6QixlQUFLLDJCQUEyQjtBQUFDLEFBQ2pDLGVBQUsseUJBQXlCO0FBQUMsQUFDL0IsZUFBSyxvQkFBb0I7QUFBQyxBQUMxQixlQUFLLHNCQUFzQjtBQUFDLEFBQzVCLGVBQUssZUFBZTtBQUNsQixtQkFBTyxJQUFJLENBQUM7QUFBQSxTQUNmO0FBQ0QsZUFBTyxLQUFLLENBQUM7T0FDZDs7OztBQUVNLDhDQUEwQzthQUFBLG9EQUFDLElBQUksRUFBRTtBQUN0RCxlQUFPLE1BQU0sQ0FBQywrQkFBK0IsQ0FBQyxJQUFJLENBQUMsSUFDakQsSUFBSSxDQUFDLElBQUksS0FBSyxzQkFBc0IsSUFBSSxJQUFJLENBQUMsUUFBUSxLQUFLLEdBQUcsSUFDN0QsTUFBTSxDQUFDLCtCQUErQixDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztPQUN4RDs7OztBQUVNLGlDQUE2QjthQUFBLHVDQUFDLElBQUksRUFBRTtBQUN6QyxnQkFBUSxJQUFJLENBQUMsSUFBSTtBQUNmLGVBQUssc0JBQXNCO0FBQUMsQUFDNUIsZUFBSywwQkFBMEI7QUFBQyxBQUNoQyxlQUFLLHdCQUF3QjtBQUMzQixtQkFBTyxJQUFJLENBQUM7QUFBQSxTQUNmO0FBQ0QsZUFBTyxLQUFLLENBQUM7T0FDZDs7OztBQUVNLGNBQVU7YUFBQSxvQkFBQyxJQUFJLEVBQUU7QUFDdEIsZ0JBQU8sSUFBSSxDQUFDLElBQUk7QUFDZCxlQUFLLG1CQUFtQjtBQUN0QixtQkFBTyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7QUFBQSxBQUNoQyxlQUFLLG9CQUFvQjtBQUN2QixtQkFBTyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUFBLEFBQ3pDLGVBQUssY0FBYztBQUFFOztBQUNuQixvQkFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ2Ysb0JBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLFVBQUEsQ0FBQzt5QkFBSSxDQUFDLElBQUksSUFBSTtpQkFBQSxDQUFDLENBQUMsT0FBTyxDQUFDLFVBQUEsQ0FBQzt5QkFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFBQSxDQUFDLENBQUM7QUFDOUYsb0JBQUksSUFBSSxDQUFDLFdBQVcsSUFBSSxJQUFJLEVBQUU7QUFDNUIsdUJBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7aUJBQzlDO0FBQ0Q7cUJBQU8sS0FBSztrQkFBQzs7Ozs7O2FBQ2Q7QUFBQSxBQUNELGVBQUssZUFBZTtBQUFFOztBQUNwQixvQkFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ2Ysb0JBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLFVBQUEsQ0FBQyxFQUFJO0FBQzNCLDBCQUFRLENBQUMsQ0FBQyxJQUFJO0FBQ1oseUJBQUssMkJBQTJCO0FBQzlCLDJCQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3pDLDRCQUFNO0FBQUEsQUFDUix5QkFBSyx5QkFBeUI7QUFDNUIsd0JBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQ25ELDRCQUFNO0FBQUE7QUFFUjtBQUNFLDRCQUFNLElBQUksS0FBSyxDQUFDLDREQUE0RCxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUFBLG1CQUMxRjtpQkFDRixDQUFDLENBQUM7QUFDSDtxQkFBTyxLQUFLO2tCQUFDOzs7Ozs7YUFDZDtBQUFBLEFBQ0QsZUFBSywwQkFBMEI7QUFBQyxBQUNoQyxlQUFLLHdCQUF3QjtBQUMzQixtQkFBTyxFQUFFLENBQUM7QUFBQSxTQUNiOztBQUVELGNBQU0sSUFBSSxLQUFLLENBQUMsa0RBQWtELEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO09BQ2pGOzs7O0FBNGpCTSxvQkFBZ0I7YUFBQSwwQkFBQyxJQUFJLEVBQUU7QUFDNUIsZ0JBQVEsSUFBSTtBQUNWLGVBQUssU0FBUyxDQUFDLEdBQUc7QUFBQyxBQUNuQixlQUFLLFNBQVMsQ0FBQyxHQUFHO0FBQUMsQUFDbkIsZUFBSyxTQUFTLENBQUMsR0FBRztBQUFDLEFBQ25CLGVBQUssU0FBUyxDQUFDLEdBQUc7QUFBQyxBQUNuQixlQUFLLFNBQVMsQ0FBQyxPQUFPO0FBQUMsQUFDdkIsZUFBSyxTQUFTLENBQUMsR0FBRztBQUFDLEFBQ25CLGVBQUssU0FBUyxDQUFDLE1BQU07QUFBQyxBQUN0QixlQUFLLFNBQVMsQ0FBQyxJQUFJO0FBQUMsQUFDcEIsZUFBSyxTQUFTLENBQUMsTUFBTTtBQUNuQixtQkFBTyxJQUFJLENBQUM7QUFBQSxTQUNmO0FBQ0QsZUFBTyxLQUFLLENBQUM7T0FDZDs7Ozs7QUF6L0JELE9BQUc7YUFBQSxhQUFDLFNBQVMsRUFBRTtBQUNiLFlBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEtBQUssU0FBUyxFQUFFO0FBQ3JDLGlCQUFPLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztTQUNuQjtPQUNGOzs7O0FBRUQsVUFBTTthQUFBLGdCQUFDLFNBQVMsRUFBRTtBQUNoQixZQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxLQUFLLFNBQVMsRUFBRTtBQUNyQyxpQkFBTyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7U0FDbkI7QUFDRCxjQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7T0FDN0M7Ozs7QUFFRCxTQUFLO2FBQUEsZUFBQyxPQUFPLEVBQUU7QUFDYixlQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxLQUFLLE9BQU8sQ0FBQztPQUN4Qzs7OztBQUVELG9CQUFnQjthQUFBLDRCQUFHO0FBQ2pCLFlBQUksSUFBSSxDQUFDLDJCQUEyQixFQUFFO0FBQ3BDLGlCQUFPO1NBQ1I7O0FBRUQsWUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsRUFBRTtBQUNqQyxpQkFBTztTQUNSOztBQUVELFlBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUNoRCxnQkFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQzdDO09BQ0Y7Ozs7QUFHRCxnQkFBWTs7O2FBQUEsc0JBQUMsSUFBSSxFQUFFLGFBQWEsRUFBRTtBQUNoQyxlQUFPLElBQUksQ0FBQztPQUNiOzs7O0FBRUQsZUFBVzthQUFBLHVCQUFHO0FBQ1osWUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO3lCQUNyQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQzs7OztZQUE1QixJQUFJO0FBQ1QsZUFBTyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztPQUM1RDs7OztBQUVELHFCQUFpQjthQUFBLDZCQUFHO0FBQ2xCLFlBQUksY0FBYyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7QUFDakMsWUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDOztBQUV2QyxZQUFJLFdBQVcsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO0FBQ2hDLFlBQUksY0FBYyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUM7QUFDdEMsWUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztBQUNoQyxZQUFJLGlCQUFpQixHQUFHLElBQUksQ0FBQyxjQUFjLENBQUM7O0FBRTVDLFlBQUksQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNwQyxZQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztBQUN6QixZQUFJLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztBQUN0QixZQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQzs7QUFFM0IsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7eUJBQ1AsSUFBSSxDQUFDLFNBQVMsRUFBRTs7OztZQUFsQyxJQUFJO1lBQUUsUUFBUTtBQUNuQixZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQzs7QUFFOUIsWUFBSSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLGFBQWEsQ0FBQyxDQUFDOztBQUU5QyxZQUFJLENBQUMsUUFBUSxHQUFHLFdBQVcsQ0FBQztBQUM1QixZQUFJLENBQUMsV0FBVyxHQUFHLGNBQWMsQ0FBQztBQUNsQyxZQUFJLENBQUMsUUFBUSxHQUFHLFdBQVcsQ0FBQztBQUM1QixZQUFJLENBQUMsY0FBYyxHQUFHLGlCQUFpQixDQUFDO0FBQ3hDLFlBQUksQ0FBQyxNQUFNLEdBQUcsY0FBYyxDQUFDO0FBQzdCLGVBQU8sQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7T0FDekI7Ozs7QUFFRCxhQUFTO2FBQUEscUJBQW9CO1lBQW5CLFNBQVMsZ0NBQUcsS0FBSztBQUN6QixZQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDbEMsWUFBSSxVQUFVLEdBQUcsRUFBRSxDQUFDO0FBQ3BCLFlBQUksVUFBVSxHQUFHLEVBQUUsQ0FBQztBQUNwQixZQUFJLGlCQUFpQixHQUFHLElBQUksQ0FBQztBQUM3QixZQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQzNCLFlBQUksZUFBZSxHQUFHLElBQUksQ0FBQztBQUMzQixlQUFPLElBQUksRUFBRTtBQUNYLGNBQUksU0FBUyxFQUFFO0FBQ2IsZ0JBQUksSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFO0FBQ2Qsb0JBQU07YUFDUDtXQUNGLE1BQU07QUFDTCxnQkFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUNoQyxvQkFBTTthQUNQO1dBQ0Y7QUFDRCxjQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO0FBQzNCLGNBQUksSUFBSSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDO0FBQzVCLGNBQUksZUFBZSxHQUFHLEtBQUssQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUN0RCxjQUFJLGlCQUFpQixHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUMzQyxjQUFJLElBQUksR0FBRyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDakMsY0FBSSxpQkFBaUIsRUFBRTtBQUNyQixnQkFBSSxlQUFlLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxxQkFBcUIsSUFDdEQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEtBQUsseUJBQXlCLEVBQUU7QUFDdEQsa0JBQUksSUFBSSxLQUFLLGdCQUFnQixJQUFJLElBQUksS0FBSyxjQUFjLEVBQUU7QUFDeEQsd0JBQVEsR0FBRyxJQUFJLENBQUM7QUFDaEIsb0JBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO0FBQ25CLG9CQUFJLGVBQWUsSUFBSSxJQUFJLEVBQUU7QUFDM0Isd0JBQU0sSUFBSSxDQUFDLHVCQUF1QixDQUFDLGVBQWUsRUFBRSxhQUFhLENBQUMsb0JBQW9CLENBQUMsQ0FBQztpQkFDekY7ZUFDRixNQUFNLElBQUksZUFBZSxJQUFJLElBQUksSUFBSSxLQUFLLENBQUMsS0FBSyxFQUFFO0FBQ2pELCtCQUFlLEdBQUcsS0FBSyxDQUFDO2VBQ3pCO0FBQ0Qsd0JBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLGlCQUFpQixDQUFDLENBQUMsQ0FBQzthQUMvRixNQUFNO0FBQ0wsK0JBQWlCLEdBQUcsS0FBSyxDQUFDO0FBQzFCLHdCQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ3ZCO1dBQ0YsTUFBTTtBQUNMLHNCQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1dBQ3ZCO1NBQ0Y7O0FBRUQsZUFBTyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxLQUFLLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSxVQUFVLENBQUMsRUFBRSxRQUFRLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztPQUNoRzs7OztBQUdELGtCQUFjO2FBQUEsMEJBQUc7QUFDZixZQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDdkMsWUFBSSxJQUFJLENBQUMsR0FBRyxFQUFFLEVBQUU7QUFDZCxnQkFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQzdDO0FBQ0QsZ0JBQVEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJO0FBQ3pCLGVBQUssU0FBUyxDQUFDLFNBQVM7QUFDdEIsbUJBQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxhQUFhLENBQUMsQ0FBQztBQUFBLEFBQ3RFLGVBQUssU0FBUyxDQUFDLE1BQU07QUFDbkIsbUJBQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxhQUFhLENBQUMsQ0FBQztBQUFBLEFBQ3RFLGVBQUssU0FBUyxDQUFDLE1BQU07QUFDbkIsbUJBQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsRUFBRSxhQUFhLENBQUMsQ0FBQztBQUFBLEFBQzNFLGVBQUssU0FBUyxDQUFDLEtBQUs7QUFDbEIsbUJBQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxhQUFhLENBQUMsQ0FBQztBQUFBLEFBQ3RFLGVBQUssU0FBUyxDQUFDLFFBQVE7QUFDckIsbUJBQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsRUFBRSxhQUFhLENBQUMsQ0FBQztBQUFBLEFBQ3pFLGVBQUssU0FBUyxDQUFDLFFBQVE7QUFDckIsbUJBQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsRUFBRSxhQUFhLENBQUMsQ0FBQztBQUFBLEFBQ3pFLGVBQUssU0FBUyxDQUFDLEVBQUU7QUFDZixtQkFBTyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxFQUFFLGFBQWEsQ0FBQyxDQUFDO0FBQUEsQUFDeEUsZUFBSyxTQUFTLENBQUMsR0FBRztBQUNoQixtQkFBTyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxFQUFFLGFBQWEsQ0FBQyxDQUFDO0FBQUEsQUFDcEUsZUFBSyxTQUFTLENBQUMsUUFBUTtBQUNyQixtQkFBTyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUM7QUFBQSxBQUNyRSxlQUFLLFNBQVMsQ0FBQyxFQUFFO0FBQ2YsbUJBQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSxhQUFhLENBQUMsQ0FBQztBQUFBLEFBQ25FLGVBQUssU0FBUyxDQUFDLE1BQU07QUFDbkIsbUJBQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsRUFBRSxhQUFhLENBQUMsQ0FBQztBQUFBLEFBQ3ZFLGVBQUssU0FBUyxDQUFDLE1BQU07QUFDbkIsbUJBQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsRUFBRSxhQUFhLENBQUMsQ0FBQztBQUFBLEFBQ3ZFLGVBQUssU0FBUyxDQUFDLEtBQUs7QUFDbEIsbUJBQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxhQUFhLENBQUMsQ0FBQztBQUFBLEFBQ3RFLGVBQUssU0FBUyxDQUFDLEdBQUc7QUFDaEIsbUJBQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsRUFBRSxhQUFhLENBQUMsQ0FBQztBQUFBLEFBQ3BFLGVBQUssU0FBUyxDQUFDLEdBQUc7QUFBQyxBQUNuQixlQUFLLFNBQVMsQ0FBQyxHQUFHO0FBQUMsQUFDbkIsZUFBSyxTQUFTLENBQUMsS0FBSztBQUNsQixtQkFBTyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxpQ0FBaUMsRUFBRSxFQUFFLGFBQWEsQ0FBQyxDQUFDO0FBQUEsQUFDcEYsZUFBSyxTQUFTLENBQUMsS0FBSztBQUNsQixtQkFBTyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxFQUFFLGFBQWEsQ0FBQyxDQUFDO0FBQUEsQUFDdEUsZUFBSyxTQUFTLENBQUMsSUFBSTtBQUNqQixtQkFBTyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxFQUFFLGFBQWEsQ0FBQyxDQUFDO0FBQUEsQUFDckUsZUFBSyxTQUFTLENBQUMsS0FBSztBQUNsQixtQkFBTyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQUEsQUFDaEM7QUFBUztBQUNQLGtCQUFJLElBQUksR0FBRyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7OztBQUdsQyxrQkFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLHNCQUFzQixJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFO0FBQ3JFLG9CQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUM7QUFDckMsb0JBQUksQ0FBQSxHQUFFLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxFQUFFO0FBQzlDLHdCQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLG1CQUFtQixFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7aUJBQ2pGOztBQUVELG9CQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQztBQUMxQixvQkFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQ3hDLHVCQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDMUIsdUJBQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO2VBQ25HLE1BQU07QUFDTCxvQkFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7QUFDeEIsdUJBQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQztlQUM5RTthQUNGO0FBQUEsU0FDRjtPQUVGOzs7O0FBRUQsMkJBQXVCO2FBQUEsbUNBQUc7QUFDeEIsWUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ3ZDLGVBQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUM7T0FDeEc7Ozs7QUFFRCx1QkFBbUI7YUFBQSwrQkFBRztBQUNwQixZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNqQyxlQUFPLElBQUksS0FBSyxDQUFDLGNBQWMsRUFBQSxDQUFDO09BQ2pDOzs7O0FBRUQsdUJBQW1CO2FBQUEsK0JBQUc7QUFDcEIsZUFBTyxJQUFJLEtBQUssQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7T0FDcEQ7Ozs7QUFFRCw0QkFBd0I7YUFBQSxvQ0FBRztBQUN6QixZQUFJLElBQUksR0FBRyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7QUFDbEMsWUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7QUFDeEIsZUFBTyxJQUFJLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztPQUM1Qzs7OztBQUVELHVCQUFtQjthQUFBLCtCQUFHO0FBQ3BCLFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7QUFDM0IsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7OztBQUc3QixZQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxFQUFFO0FBQ2pDLGNBQUksRUFBRSxJQUFJLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUEsQUFBQyxFQUFFO0FBQ3hDLGtCQUFNLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1dBQ3hFOztBQUVELGlCQUFPLElBQUksS0FBSyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUN2Qzs7QUFFRCxZQUFJLElBQUksQ0FBQywyQkFBMkIsRUFBRTtBQUNwQyxjQUFJLEVBQUUsSUFBSSxDQUFDLFdBQVcsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFBLEFBQUMsRUFBRTtBQUN4QyxrQkFBTSxJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxhQUFhLENBQUMsQ0FBQztXQUN4RTs7QUFFRCxpQkFBTyxJQUFJLEtBQUssQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDdkM7O0FBRUQsWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDO0FBQ2pCLFlBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLElBQUksU0FBUyxDQUFDLFVBQVUsRUFBRTtBQUMvQyxlQUFLLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUM7O0FBRXZDLGNBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO0FBQzNCLGNBQUksQ0FBQyxDQUFBLEdBQUUsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLEVBQUU7QUFDL0Msa0JBQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztXQUNqRTtTQUNGOztBQUVELFlBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDOztBQUV4QixZQUFJLEtBQUssSUFBSSxJQUFJLElBQUksRUFBRSxJQUFJLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUEsQUFBQyxFQUFFO0FBQ3pELGdCQUFNLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1NBQ3hFOztBQUVELGVBQU8sSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO09BQ3hDOzs7O0FBRUQsMEJBQXNCO2FBQUEsa0NBQUc7QUFDdkIsWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztBQUMzQixZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQzs7O0FBR2hDLFlBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEVBQUU7QUFDakMsY0FBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUU7QUFDckIsa0JBQU0sSUFBSSxDQUFDLHVCQUF1QixDQUFDLEtBQUssRUFBRSxhQUFhLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztXQUMzRTs7QUFFRCxpQkFBTyxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUMxQzs7QUFFRCxZQUFJLElBQUksQ0FBQywyQkFBMkIsRUFBRTtBQUNwQyxjQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRTtBQUNyQixrQkFBTSxJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1dBQzNFOztBQUVELGlCQUFPLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO1NBQzFDOztBQUVELFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQztBQUNqQixZQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxJQUFJLFNBQVMsQ0FBQyxVQUFVLEVBQUU7QUFDL0MsZUFBSyxHQUFHLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFDOztBQUV2QyxjQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztBQUMzQixjQUFJLENBQUMsQ0FBQSxHQUFFLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxFQUFFO0FBQy9DLGtCQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLGFBQWEsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7V0FDakU7U0FDRjs7QUFFRCxZQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztBQUN4QixZQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRTtBQUNyQixnQkFBTSxJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1NBQzNFOztBQUVELGVBQU8sSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLENBQUM7T0FDM0M7Ozs7QUFHRCwwQkFBc0I7YUFBQSxrQ0FBRztBQUN2QixZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNoQyxZQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztBQUN4QixlQUFPLElBQUksS0FBSyxDQUFDLGlCQUFpQixFQUFBLENBQUM7T0FDcEM7Ozs7QUFFRCx5QkFBcUI7YUFBQSxpQ0FBRztBQUN0QixZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUMxQixZQUFJLGNBQWMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDO0FBQ3RDLFlBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDOztBQUV4QixZQUFJLElBQUksR0FBRyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDakMsWUFBSSxDQUFDLFdBQVcsR0FBRyxjQUFjLENBQUM7O0FBRWxDLFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzdCLFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlCLFlBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztBQUNsQyxZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM5QixZQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQzs7QUFFOUIsZUFBTyxJQUFJLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7T0FDL0M7Ozs7QUErSEQscUJBQWlCO2FBQUEsNkJBQUc7QUFDbEIsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDM0IsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUIsWUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDO0FBQ2hCLFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQztBQUNqQixZQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxFQUFFO0FBQ2pDLGNBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsRUFBRTtBQUNwQyxnQkFBSSxHQUFHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztXQUMvQjtBQUNELGNBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ2pDLGNBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUNqQyxpQkFBSyxHQUFHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztXQUNoQztBQUNELGlCQUFPLElBQUksS0FBSyxDQUFDLFlBQVksQ0FDekIsSUFBSSxFQUNKLElBQUksRUFDSixLQUFLLEVBQ0wsSUFBSSxDQUFDLDRCQUE0QixFQUFFLENBQ3RDLENBQUM7U0FDSCxNQUFNO0FBQ0wsY0FBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRTtBQUMxRCxnQkFBSSxlQUFlLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztBQUNuQyxnQkFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7QUFDckIsZ0JBQUksUUFBUSxHQUFHLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO0FBQy9DLGdCQUFJLENBQUMsT0FBTyxHQUFHLGVBQWUsQ0FBQzs7QUFFL0IsZ0JBQUksUUFBUSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEtBQUssQ0FBQyxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFBLEFBQUMsRUFBRTtBQUMvRixrQkFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLEdBQ2pDLEtBQUssQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQztBQUM5QyxrQkFBSSxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxJQUFJLEVBQUU7QUFDeEMsc0JBQU0sSUFBSSxJQUFJLEtBQUssQ0FBQyxjQUFjLEdBQ2hDLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLHVCQUF1QixDQUFDLEdBQ3ZELElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLHVCQUF1QixDQUFDLENBQUM7ZUFDM0Q7QUFDRCxrQkFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ1gsbUJBQUssR0FBRyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7QUFDL0IscUJBQU8sSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsNEJBQTRCLEVBQUUsQ0FBQyxDQUFDO2FBQ3ZFLE1BQU07QUFDTCxrQkFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDakMsa0JBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsRUFBRTtBQUNwQyxvQkFBSSxHQUFHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztlQUMvQjtBQUNELGtCQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNqQyxrQkFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQ2pDLHFCQUFLLEdBQUcsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO2VBQ2hDO0FBQ0QscUJBQU8sSUFBSSxLQUFLLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyw0QkFBNEIsRUFBRSxDQUFDLENBQUM7YUFDM0Y7V0FDRixNQUFNO0FBQ0wsZ0JBQUksZUFBZSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7QUFDbkMsZ0JBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO0FBQ3JCLGdCQUFJLElBQUksR0FBRyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7QUFDbEMsZ0JBQUksQ0FBQyxPQUFPLEdBQUcsZUFBZSxDQUFDOztBQUUvQixnQkFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsRUFBRTtBQUN4RCxrQkFBSSxDQUFDLE1BQU0sQ0FBQyw2QkFBNkIsQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUMvQyxzQkFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO2VBQzdEOztBQUVELGtCQUFJLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsR0FDakMsS0FBSyxDQUFDLGNBQWMsR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDOztBQUU5QyxrQkFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ1gsbUJBQUssR0FBRyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7O0FBRS9CLHFCQUFPLElBQUksSUFBSSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLDRCQUE0QixFQUFFLENBQUMsQ0FBQzthQUNuRSxNQUFNO0FBQ0wsa0JBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ2pDLGtCQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEVBQUU7QUFDcEMsb0JBQUksR0FBRyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7ZUFDL0I7QUFDRCxrQkFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDakMsa0JBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUNqQyxxQkFBSyxHQUFHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztlQUNoQztBQUNELHFCQUFPLElBQUksS0FBSyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsNEJBQTRCLEVBQUUsQ0FBQyxDQUFDO2FBQ3ZGO1dBQ0Y7U0FDRjtPQUNGOzs7O0FBRUQsZ0NBQTRCO2FBQUEsd0NBQUc7QUFDN0IsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUIsWUFBSSxjQUFjLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQztBQUN0QyxZQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztBQUN4QixZQUFJLElBQUksR0FBRyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDakMsWUFBSSxDQUFDLFdBQVcsR0FBRyxjQUFjLENBQUM7QUFDbEMsZUFBTyxJQUFJLENBQUM7T0FDYjs7OztBQUVELG9CQUFnQjthQUFBLDRCQUFHO0FBQ2pCLFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQzFCLFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlCLFlBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQzs7QUFFbEMsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUIsWUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQ3ZDLFlBQUksU0FBUyxHQUFHLElBQUksQ0FBQztBQUNyQixZQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQzVCLG1CQUFTLEdBQUcsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1NBQ25DO0FBQ0QsZUFBTyxJQUFJLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxTQUFTLENBQUMsQ0FBQztPQUMzRDs7OztBQUVELHdCQUFvQjthQUFBLGdDQUFHO0FBQ3JCLFlBQUksUUFBUSxHQUFHLElBQUksQ0FBQzs7QUFFcEIsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUIsWUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUU7QUFDeEIsZ0JBQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsY0FBYyxDQUFDLENBQUM7U0FDdEQ7O0FBRUQsWUFBSSxJQUFJLENBQUMsMkJBQTJCLEVBQUU7QUFDcEMsaUJBQU8sSUFBSSxLQUFLLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3hDOztBQUVELFlBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsRUFBRTtBQUNwQyxjQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEVBQUU7QUFDaEQsb0JBQVEsR0FBRyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7V0FDbkM7U0FDRjs7QUFFRCxZQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztBQUN4QixlQUFPLElBQUksS0FBSyxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQztPQUM1Qzs7OztBQUVELHNCQUFrQjthQUFBLDhCQUFHO0FBQ25CLFlBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtBQUNmLGdCQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLGdCQUFnQixDQUFDLENBQUM7U0FDeEQ7O0FBRUQsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDNUIsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUIsWUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO0FBQ3BDLFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlCLFlBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQzs7QUFFakMsZUFBTyxJQUFJLEtBQUssQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO09BQzlDOzs7O0FBRUQsd0JBQW9CO2FBQUEsZ0NBQUc7QUFDckIsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUIsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUIsWUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO0FBQzFDLFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlCLFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDOztBQUU5QixZQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQzlCLGlCQUFPLElBQUksS0FBSyxDQUFDLGVBQWUsQ0FBQyxZQUFZLEVBQUUsRUFBRSxDQUFDLENBQUM7U0FDcEQ7QUFDRCxZQUFJLFdBQVcsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO0FBQ2hDLFlBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDOztBQUVyQixZQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQzs7QUFFcEMsWUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsRUFBRTtBQUNqQyxjQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztBQUM5QyxjQUFJLGdCQUFnQixHQUFHLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0FBQy9DLGNBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEVBQUU7QUFDakMsa0JBQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsMkJBQTJCLENBQUMsQ0FBQztXQUNuRTtBQUNELGNBQUksQ0FBQyxRQUFRLEdBQUcsV0FBVyxDQUFDO0FBQzVCLGNBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlCLGlCQUFPLElBQUksS0FBSyxDQUFDLDBCQUEwQixDQUFDLFlBQVksRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLGdCQUFnQixDQUFDLENBQUM7U0FDbkcsTUFBTTtBQUNMLGNBQUksQ0FBQyxRQUFRLEdBQUcsV0FBVyxDQUFDO0FBQzVCLGNBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlCLGlCQUFPLElBQUksS0FBSyxDQUFDLGVBQWUsQ0FBQyxZQUFZLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDdkQ7T0FDRjs7OztBQUVELG9CQUFnQjthQUFBLDRCQUFHO0FBQ2pCLFlBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztBQUNoQixlQUFPLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFBLEFBQUMsRUFBRTtBQUNyRixnQkFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQztTQUNyQztBQUNELGVBQU8sTUFBTSxDQUFDO09BQ2Y7Ozs7QUFFRCxtQkFBZTthQUFBLDJCQUFHO0FBQ2hCLFlBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUN2QyxZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM1QixlQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxLQUFLLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsRUFBRSxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO09BQ25IOzs7O0FBRUQsc0JBQWtCO2FBQUEsOEJBQUc7QUFDbkIsWUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ3ZDLFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQy9CLGVBQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEtBQUssQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQztPQUM5Rjs7OztBQUVELHVCQUFtQjthQUFBLCtCQUFHO0FBQ3BCLFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzdCLGVBQU8sSUFBSSxDQUFDLGtDQUFrQyxFQUFFLENBQUM7T0FDbEQ7Ozs7QUFFRCxzQ0FBa0M7YUFBQSw4Q0FBRztBQUNuQyxZQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7QUFDaEIsZUFBTyxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsSUFDakYsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUEsQUFBQyxFQUFFO0FBQzlCLGdCQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDO1NBQ3BDO0FBQ0QsZUFBTyxNQUFNLENBQUM7T0FDZjs7OztBQUVELHVCQUFtQjthQUFBLCtCQUFHO0FBQ3BCLFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDOztBQUV6QyxZQUFJLElBQUksQ0FBQywyQkFBMkIsRUFBRTtBQUNwQyxnQkFBTSxJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1NBQzlFOztBQUVELFlBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQzs7QUFFdEMsWUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7O0FBRXhCLGVBQU8sSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDO09BQzNDOzs7O0FBRUQscUJBQWlCO2FBQUEsNkJBQUc7QUFDbEIsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDM0IsWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDOztBQUU5QixZQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFO0FBQy9CLGNBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0FBQ3RDLGNBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEVBQUU7QUFDL0IsZ0JBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztBQUNsQyxtQkFBTyxJQUFJLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1dBQ2pFO0FBQ0QsaUJBQU8sSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQ3BEOztBQUVELFlBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEVBQUU7QUFDL0IsY0FBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQ2xDLGlCQUFPLElBQUksS0FBSyxDQUFDLG1CQUFtQixDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7U0FDOUQsTUFBTTtBQUNMLGdCQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLG1CQUFtQixDQUFDLENBQUM7U0FDM0Q7T0FDRjs7OztBQUVELHFDQUFpQzthQUFBLDZDQUFHO0FBQ2xDLFlBQUksV0FBVyxHQUFHLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO0FBQ2xELFlBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0FBQ3hCLGVBQU8sSUFBSSxLQUFLLENBQUMsNEJBQTRCLENBQUMsV0FBVyxDQUFDLENBQUM7T0FDNUQ7Ozs7QUFFRCx1QkFBbUI7YUFBQSwrQkFBRztBQUNwQixZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUM3QixZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM5QixlQUFPLElBQUksS0FBSyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLEVBQUUsSUFBSSxDQUFDLDRCQUE0QixFQUFFLENBQUMsQ0FBQztPQUM5Rjs7OztBQUVELG9CQUFnQjthQUFBLDRCQUFHO0FBQ2pCLFlBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQzs7QUFFdkMsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDN0IsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUIsWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztBQUMzQixZQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQ2hFLGdCQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUNwQzs7QUFFRCxZQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsMkJBQTJCLEVBQUUsQ0FBQzs7QUFFL0MsWUFBSSxDQUFDLE1BQU0sQ0FBQywrQkFBK0IsQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUNsRCxnQkFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDcEM7QUFDRCxhQUFLLEdBQUcsTUFBTSxDQUFDLGdDQUFnQyxDQUFDLEtBQUssQ0FBQyxDQUFDOztBQUV2RCxZQUFJLEtBQUssR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3JDLFlBQUksY0FBYyxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksRUFBRTtBQUNqQyxnQkFBTSxJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxpQkFBaUIsRUFBRSxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztTQUNuRzs7QUFFRCxZQUFJLElBQUksQ0FBQyxNQUFNLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFO0FBQy9DLGdCQUFNLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLHFCQUFxQixDQUFDLENBQUM7U0FDaEY7O0FBRUQsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7O0FBRTlCLFlBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQzs7QUFFN0IsZUFBTyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksS0FBSyxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUM7T0FDN0U7Ozs7QUFFRCxjQUFVO2FBQUEsc0JBQUc7QUFDWCxZQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDdkMsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7O0FBRTlCLFlBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQztBQUNkLGVBQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUNwQyxjQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDO1NBQ2xDO0FBQ0QsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7O0FBRTlCLGVBQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUM7T0FDaEU7Ozs7QUFFRCw0QkFBd0I7YUFBQSxvQ0FBRztBQUN6QixZQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDdkMsWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDOzs7QUFHdkIsWUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLElBQUksSUFBSSxTQUFTLENBQUMsR0FBRyxHQUFHLEtBQUssR0FBRyxLQUFLLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQyxLQUFLLEdBQUcsT0FBTyxHQUFHLEtBQUssQ0FBQztBQUNsRyxZQUFJLFdBQVcsR0FBRyxJQUFJLENBQUMsMkJBQTJCLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDekQsZUFBTyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksS0FBSyxDQUFDLG1CQUFtQixDQUFDLElBQUksRUFBRSxXQUFXLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQztPQUMzRjs7OztBQUVELCtCQUEyQjthQUFBLHFDQUFDLElBQUksRUFBRTtBQUNoQyxZQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7QUFDaEIsZUFBTyxJQUFJLEVBQUU7QUFDWCxnQkFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUNoRCxjQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDOUIsbUJBQU8sTUFBTSxDQUFDO1dBQ2Y7U0FDRjtPQUNGOzs7O0FBRUQsMkJBQXVCO2FBQUEsaUNBQUMsSUFBSSxFQUFFO0FBQzVCLFlBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUN2QyxZQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDOztBQUUzQixZQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQ2hDLGdCQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDN0M7QUFDRCxZQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsMkJBQTJCLEVBQUUsQ0FBQzs7QUFFNUMsWUFBSSxDQUFDLE1BQU0sQ0FBQywrQkFBK0IsQ0FBQyxFQUFFLENBQUMsRUFBRTtBQUMvQyxnQkFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDcEM7QUFDRCxVQUFFLEdBQUcsTUFBTSxDQUFDLGdDQUFnQyxDQUFDLEVBQUUsQ0FBQyxDQUFDOztBQUVqRCxZQUFJLEtBQUssR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ2xDLFlBQUksY0FBYyxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksRUFBRTtBQUNqQyxnQkFBTSxJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxpQkFBaUIsRUFBRSxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztTQUNuRzs7QUFFRCxZQUFJLElBQUksQ0FBQyxNQUFNLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFO0FBQy9DLGdCQUFNLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1NBQzFFOztBQUVELFlBQUksSUFBSSxHQUFHLElBQUksQ0FBQztBQUNoQixZQUFJLElBQUksSUFBSSxPQUFPLEVBQUU7QUFDbkIsY0FBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUIsY0FBSSxHQUFHLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO1NBQ3pDLE1BQU0sSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUNyQyxjQUFJLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUM7U0FDekM7QUFDRCxlQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxLQUFLLENBQUMsa0JBQWtCLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO09BQ2pGOzs7O0FBRUQsbUJBQWU7YUFBQSwyQkFBRztBQUNoQixZQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7O0FBRXZDLFlBQUksSUFBSSxHQUFHLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxDQUFDOztBQUU1QyxZQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFO0FBQy9CLGlCQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFO0FBQ2xCLGdCQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDaEMsb0JBQU07YUFDUDtBQUNELGdCQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDWCxnQkFBSSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQyxFQUM1RixhQUFhLENBQUMsQ0FBQztXQUNwQjtTQUNGO0FBQ0QsZUFBTyxJQUFJLENBQUM7T0FDYjs7OztBQUVELDRCQUF3QjthQUFBLGtDQUFDLElBQUksRUFBRSxhQUFhLEVBQUU7QUFDNUMsWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7OzsyQkFHb0UsSUFBSSxDQUE1RyxNQUFNO1lBQU4sTUFBTSxnQ0FBRyxJQUFJO3lCQUEyRixJQUFJLENBQTdGLElBQUk7WUFBSixJQUFJLDhCQUFHLElBQUk7d0JBQThFLElBQUksQ0FBaEYsR0FBRztZQUFILEdBQUcsNkJBQUcsSUFBSTt5Q0FBa0UsSUFBSSxDQUFwRSxvQkFBb0I7WUFBcEIsb0JBQW9CLDhDQUFHLEtBQUs7MkNBQW9DLElBQUksQ0FBdEMsc0JBQXNCO1lBQXRCLHNCQUFzQixnREFBRyxLQUFLO0FBQ3pHLFlBQUksSUFBSSxDQUFDLElBQUksS0FBSyx1QkFBdUIsRUFBRTtBQUN6QyxjQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssc0JBQXNCLEVBQUU7QUFDeEMsZ0JBQUksS0FBSSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDO0FBQ2hDLGdCQUFJLHlCQUF5QixDQUFDLGNBQWMsQ0FBQyxLQUFJLENBQUMsRUFBRTtBQUNsRCxrQ0FBb0IsR0FBRyxJQUFJLENBQUM7QUFDNUIsa0JBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtBQUNmLHNCQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLG9CQUFvQixDQUFDLENBQUM7ZUFDNUQ7YUFDRjtBQUNELGdCQUFJLGdCQUFnQixDQUFDLEtBQUksQ0FBQyxFQUFFO0FBQzFCLG9DQUFzQixHQUFHLElBQUksQ0FBQztBQUM5QixrQkFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO0FBQ2Ysc0JBQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsaUJBQWlCLENBQUMsQ0FBQztlQUN6RDthQUNGO0FBQ0QsZ0JBQUksR0FBRyxNQUFNLENBQUMsZ0NBQWdDLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDckQsa0JBQU0sR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1dBQ2pCLE1BQU07QUFDTCxrQkFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7V0FDcEM7U0FDRjs7QUFFRCxZQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFOzJCQUNQLElBQUksQ0FBQyxTQUFTLEVBQUU7Ozs7Y0FBbEMsSUFBSTtjQUFFLFFBQVE7QUFDbkIsY0FBSSxRQUFRLEVBQUU7QUFDWixnQkFBSSxHQUFHLEVBQUU7QUFDUCxvQkFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO2FBQ3pEO0FBQ0QsZ0JBQUksb0JBQW9CLEVBQUU7QUFDeEIsb0JBQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsb0JBQW9CLENBQUMsQ0FBQzthQUM1RDtBQUNELGdCQUFJLHNCQUFzQixFQUFFO0FBQzFCLG9CQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLGlCQUFpQixDQUFDLENBQUM7YUFDekQ7V0FDRjtBQUNELGNBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlCLGlCQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxLQUFLLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUM7U0FDeEYsTUFBTTtBQUNMLGNBQUksSUFBSSxHQUFHLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO0FBQzVDLGlCQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxLQUFLLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUM7U0FDeEY7T0FDRjs7OztBQUVELDZCQUF5QjthQUFBLHFDQUFHO0FBQzFCLFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7QUFDM0IsWUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDOztBQUV2QyxZQUFJLElBQUksR0FBRyxJQUFJLENBQUMsMEJBQTBCLEVBQUUsQ0FBQzs7QUFFN0MsWUFBSSxDQUFDLElBQUksQ0FBQywyQkFBMkIsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUNwRSxpQkFBTyxJQUFJLENBQUMsd0JBQXdCLENBQUMsSUFBSSxFQUFFLGFBQWEsQ0FBQyxDQUFBO1NBQzFEOztBQUVELFlBQUksVUFBVSxHQUFHLEtBQUssQ0FBQztBQUN2QixZQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO0FBQzlCLGdCQUFRLFFBQVEsQ0FBQyxJQUFJO0FBQ25CLGVBQUssU0FBUyxDQUFDLE1BQU07QUFBQyxBQUN0QixlQUFLLFNBQVMsQ0FBQyxhQUFhO0FBQUMsQUFDN0IsZUFBSyxTQUFTLENBQUMsY0FBYztBQUFDLEFBQzlCLGVBQUssU0FBUyxDQUFDLGNBQWM7QUFBQyxBQUM5QixlQUFLLFNBQVMsQ0FBQyxVQUFVO0FBQUMsQUFDMUIsZUFBSyxTQUFTLENBQUMsVUFBVTtBQUFDLEFBQzFCLGVBQUssU0FBUyxDQUFDLG1CQUFtQjtBQUFDLEFBQ25DLGVBQUssU0FBUyxDQUFDLFVBQVU7QUFBQyxBQUMxQixlQUFLLFNBQVMsQ0FBQyxVQUFVO0FBQUMsQUFDMUIsZUFBSyxTQUFTLENBQUMsVUFBVTtBQUFDLEFBQzFCLGVBQUssU0FBUyxDQUFDLFVBQVU7QUFBQyxBQUMxQixlQUFLLFNBQVMsQ0FBQyxVQUFVO0FBQ3ZCLHNCQUFVLEdBQUcsSUFBSSxDQUFDO0FBQ2xCLGtCQUFNO0FBQUEsU0FDVDs7QUFFRCxZQUFJLFVBQVUsRUFBRTtBQUNkLGNBQUksQ0FBQyxNQUFNLENBQUMsK0JBQStCLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksS0FBSywwQkFBMEIsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLHdCQUF3QixFQUFFO0FBQ3ZJLGtCQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLHlCQUF5QixDQUFDLENBQUM7V0FDakU7QUFDRCxjQUFJLEdBQUcsTUFBTSxDQUFDLGdDQUFnQyxDQUFDLElBQUksQ0FBQyxDQUFDOztBQUVyRCxjQUFJLEtBQUssR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3BDLGNBQUksY0FBYyxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksRUFBRTtBQUNqQyxrQkFBTSxJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxpQkFBaUIsRUFBRSxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztXQUNuRzs7QUFFRCxjQUFJLElBQUksQ0FBQyxNQUFNLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFO0FBQy9DLGtCQUFNLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLHFCQUFxQixDQUFDLENBQUM7V0FDaEY7O0FBRUQsY0FBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ1gsY0FBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUM7QUFDN0MsaUJBQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUM7U0FDMUc7O0FBRUQsWUFDRSxJQUFJLENBQUMsSUFBSSxLQUFLLGtCQUFrQixJQUNoQyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxVQUFBLENBQUM7aUJBQUksQ0FBQyxDQUFDLElBQUksS0FBSywyQkFBMkI7U0FBQSxDQUFDLEVBQ2pFO0FBQ0EsZ0JBQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQ3ZDOztBQUVELGVBQU8sSUFBSSxDQUFDO09BQ2I7Ozs7QUFFRCw4QkFBMEI7YUFBQSxzQ0FBRztBQUMzQixZQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDdkMsWUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7QUFDeEMsWUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsRUFBRTtBQUNuQyxjQUFJLGVBQWUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO0FBQ25DLGNBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO0FBQ3BCLGNBQUksVUFBVSxHQUFHLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO0FBQ2xELGNBQUksQ0FBQyxPQUFPLEdBQUcsZUFBZSxDQUFDO0FBQy9CLGNBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzdCLGNBQUksU0FBUyxHQUFHLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO0FBQ2pELGlCQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxLQUFLLENBQUMscUJBQXFCLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxTQUFTLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQztTQUN2Rzs7QUFFRCxlQUFPLElBQUksQ0FBQztPQUNiOzs7O0FBRUQsb0JBQWdCO2FBQUEsMEJBQUMsSUFBSSxFQUFFO0FBQ3JCLGdCQUFRLElBQUk7QUFDVixlQUFLLFNBQVMsQ0FBQyxFQUFFO0FBQUMsQUFDbEIsZUFBSyxTQUFTLENBQUMsR0FBRztBQUFDLEFBQ25CLGVBQUssU0FBUyxDQUFDLE1BQU07QUFBQyxBQUN0QixlQUFLLFNBQVMsQ0FBQyxPQUFPO0FBQUMsQUFDdkIsZUFBSyxTQUFTLENBQUMsT0FBTztBQUFDLEFBQ3ZCLGVBQUssU0FBUyxDQUFDLEVBQUU7QUFBQyxBQUNsQixlQUFLLFNBQVMsQ0FBQyxFQUFFO0FBQUMsQUFDbEIsZUFBSyxTQUFTLENBQUMsU0FBUztBQUFDLEFBQ3pCLGVBQUssU0FBUyxDQUFDLFNBQVM7QUFBQyxBQUN6QixlQUFLLFNBQVMsQ0FBQyxFQUFFO0FBQUMsQUFDbEIsZUFBSyxTQUFTLENBQUMsRUFBRTtBQUFDLEFBQ2xCLGVBQUssU0FBUyxDQUFDLEdBQUc7QUFBQyxBQUNuQixlQUFLLFNBQVMsQ0FBQyxHQUFHO0FBQUMsQUFDbkIsZUFBSyxTQUFTLENBQUMsVUFBVTtBQUFDLEFBQzFCLGVBQUssU0FBUyxDQUFDLEdBQUc7QUFBQyxBQUNuQixlQUFLLFNBQVMsQ0FBQyxHQUFHO0FBQUMsQUFDbkIsZUFBSyxTQUFTLENBQUMsWUFBWTtBQUFDLEFBQzVCLGVBQUssU0FBUyxDQUFDLEdBQUc7QUFBQyxBQUNuQixlQUFLLFNBQVMsQ0FBQyxHQUFHO0FBQUMsQUFDbkIsZUFBSyxTQUFTLENBQUMsR0FBRztBQUFDLEFBQ25CLGVBQUssU0FBUyxDQUFDLEdBQUc7QUFBQyxBQUNuQixlQUFLLFNBQVMsQ0FBQyxHQUFHO0FBQ2hCLG1CQUFPLElBQUksQ0FBQztBQUFBLEFBQ2QsZUFBSyxTQUFTLENBQUMsRUFBRTtBQUNmLG1CQUFPLElBQUksQ0FBQyxPQUFPLENBQUM7QUFBQSxBQUN0QjtBQUNFLG1CQUFPLEtBQUssQ0FBQztBQUFBLFNBQ2hCO09BQ0Y7Ozs7QUFFRCx5QkFBcUI7YUFBQSxpQ0FBRzs7QUFDdEIsWUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ2xDLFlBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO0FBQ3ZDLFlBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDOztBQUVuQyxZQUFJLGdCQUFnQixHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUN2RCxZQUFJLENBQUMsZ0JBQWdCLEVBQUU7QUFDckIsaUJBQU8sSUFBSSxDQUFDO1NBQ2I7O0FBRUQsWUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ1gsWUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDO0FBQ2YsYUFBSyxDQUFDLElBQUksQ0FBQyxFQUFDLFFBQVEsRUFBUixRQUFRLEVBQUUsSUFBSSxFQUFKLElBQUksRUFBRSxRQUFRLEVBQVIsUUFBUSxFQUFFLFVBQVUsRUFBRSxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUMsQ0FBQyxDQUFDO0FBQ3BGLGdCQUFRLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQzlCLFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDOztBQUV4QyxnQkFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDO0FBQy9CLHdCQUFnQixHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzlELGVBQU8sZ0JBQWdCLEVBQUU7QUFDdkIsY0FBSSxVQUFVLEdBQUcsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDOztBQUVqRCxpQkFBTyxLQUFLLENBQUMsTUFBTSxJQUFLLFVBQVUsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxVQUFVLEFBQUMsRUFBRTtBQUN6RSxnQkFBSSxTQUFTLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDeEMsZ0JBQUksYUFBYSxHQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUM7QUFDdkMsZ0JBQUksR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDO0FBQ3RCLGlCQUFLLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDWixvQkFBUSxHQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUM7QUFDOUIsaUJBQUssR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksS0FBSyxDQUFDLGdCQUFnQixDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1dBQ2xHOzs7QUFHRCxjQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDWCxlQUFLLENBQUMsSUFBSSxDQUFDLEVBQUMsUUFBUSxFQUFSLFFBQVEsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBUixRQUFRLEVBQUUsVUFBVSxFQUFWLFVBQVUsRUFBQyxDQUFDLENBQUM7QUFDMUQsa0JBQVEsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDOUIsZUFBSyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDOztBQUVwQyxrQkFBUSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDO0FBQy9CLDBCQUFnQixHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUNwRDs7O0FBR0QsZUFBTyxLQUFLLENBQUMsV0FBVyxDQUFDLFVBQUMsSUFBSSxFQUFFLFNBQVM7aUJBQ3ZDLE1BQUssWUFBWSxDQUFDLElBQUksS0FBSyxDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUUsU0FBUyxDQUFDLFFBQVEsQ0FBQztTQUFBLEVBQ2hILEtBQUssQ0FBQyxDQUFDO09BQ1Y7Ozs7QUFrQkQsd0JBQW9CO2FBQUEsZ0NBQUc7QUFDckIsWUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksVUFBVSxDQUFDLFVBQVUsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksVUFBVSxDQUFDLE9BQU8sRUFBRTtBQUN6RyxpQkFBTyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztTQUN0QztBQUNELFlBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUN2QyxZQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO0FBQzlCLFlBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQzNDLGlCQUFPLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO1NBQ3RDO0FBQ0QsWUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ1gsWUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7QUFDdkMsZ0JBQVEsUUFBUSxDQUFDLElBQUk7QUFDbkIsZUFBSyxTQUFTLENBQUMsR0FBRztBQUFDLEFBQ25CLGVBQUssU0FBUyxDQUFDLEdBQUc7O0FBRWhCLGdCQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssc0JBQXNCLEVBQUU7QUFDeEMsa0JBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQ3pELHNCQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLGlCQUFpQixDQUFDLENBQUM7ZUFDekQ7YUFDRjs7QUFFRCxnQkFBSSxDQUFDLE1BQU0sQ0FBQyw2QkFBNkIsQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUMvQyxvQkFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO2FBQ2pFO0FBQ0Qsa0JBQU07QUFBQSxBQUNSLGVBQUssU0FBUyxDQUFDLE1BQU07QUFDbkIsZ0JBQUksSUFBSSxDQUFDLElBQUksS0FBSyxzQkFBc0IsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO0FBQ3ZELG9CQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxDQUFDO2FBQ3JEO0FBQ0Qsa0JBQU07QUFBQSxBQUNSO0FBQ0Usa0JBQU07QUFBQSxTQUNUOztBQUVELGVBQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO09BQzNGOzs7O0FBRUQsMEJBQXNCO2FBQUEsa0NBQUc7QUFDdkIsWUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDOztBQUV2QyxZQUFJLElBQUksR0FBRyxJQUFJLENBQUMsb0NBQW9DLEVBQUUsQ0FBQzs7QUFFdkQsWUFBSSxJQUFJLENBQUMsMkJBQTJCLEVBQUU7QUFDcEMsaUJBQU8sSUFBSSxDQUFDO1NBQ2I7O0FBRUQsWUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztBQUM5QixZQUFJLEFBQUMsUUFBUSxDQUFDLElBQUksS0FBSyxTQUFTLENBQUMsR0FBRyxJQUFNLFFBQVEsQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDLEdBQUcsQUFBQyxFQUFFO0FBQzFFLGlCQUFPLElBQUksQ0FBQztTQUNiO0FBQ0QsWUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDOztBQUVYLFlBQUksSUFBSSxDQUFDLElBQUksS0FBSyxzQkFBc0IsRUFBRTtBQUN4QyxjQUFJLElBQUksQ0FBQyxNQUFNLElBQUksZ0JBQWdCLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUN6RCxrQkFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1dBQzFEO1NBQ0Y7QUFDRCxZQUFJLENBQUMsTUFBTSxDQUFDLDZCQUE2QixDQUFDLElBQUksQ0FBQyxFQUFFO0FBQy9DLGdCQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLHlCQUF5QixDQUFDLENBQUM7U0FDakU7QUFDRCxlQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQztPQUM1Rjs7OztBQUVELHdDQUFvQzthQUFBLGdEQUFHO0FBQ3JDLFlBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUN2QyxZQUFJLGVBQWUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO0FBQ25DLFlBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO0FBQ3BCLFlBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDOztBQUVqRyxlQUFPLElBQUksRUFBRTtBQUNYLGNBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUU7QUFDaEMsZ0JBQUksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksS0FBSyxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQztXQUNuRyxNQUFNLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUU7QUFDdkMsZ0JBQUksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksS0FBSyxDQUFDLHdCQUF3QixDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1dBQy9HLE1BQU0sSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUN2QyxnQkFBSSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxLQUFLLENBQUMsc0JBQXNCLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUM7V0FDaEgsTUFBTTtBQUNMLGtCQUFNO1dBQ1A7U0FDRjs7QUFFRCxZQUFJLENBQUMsT0FBTyxHQUFHLGVBQWUsQ0FBQzs7QUFFL0IsZUFBTyxJQUFJLENBQUM7T0FDYjs7OztBQUVELCtCQUEyQjthQUFBLHVDQUFHO0FBQzVCLFlBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQzs7QUFFdkMsWUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixFQUFFLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7O0FBRWpHLGVBQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUU7QUFDbkUsY0FBSSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQ3BCLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxHQUN4QixJQUFJLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUMsR0FDcEUsSUFBSSxLQUFLLENBQUMsc0JBQXNCLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUM7U0FDL0Y7O0FBRUQsZUFBTyxJQUFJLENBQUM7T0FDYjs7OztBQUVELDBCQUFzQjthQUFBLGtDQUFHO0FBQ3ZCLFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlCLFlBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLEVBQUU7QUFDL0MsZ0JBQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUM3QyxNQUFNO0FBQ0wsaUJBQU8sSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQztTQUN6QjtPQUNGOzs7O0FBRUQsdUJBQW1CO2FBQUEsK0JBQUc7QUFDcEIsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUIsWUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO0FBQ2xDLFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlCLGVBQU8sSUFBSSxDQUFDO09BQ2I7Ozs7QUFFRCxzQkFBa0I7YUFBQSw4QkFBRztBQUNuQixZQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDdkMsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDM0IsWUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLDJCQUEyQixFQUFFLENBQUM7QUFDaEQsZUFBTyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksS0FBSyxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixFQUFFLEdBQzVHLEVBQUUsQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO09BQ3pCOzs7O0FBRUQsMEJBQXNCO2FBQUEsa0NBQUc7QUFDdkIsWUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUNoQyxpQkFBTyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztTQUNwQzs7QUFFRCxZQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7O0FBRXZDLGdCQUFRLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSTtBQUN6QixlQUFLLFNBQVMsQ0FBQyxVQUFVO0FBQ3ZCLG1CQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxLQUFLLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUM7QUFBQSxBQUNsRyxlQUFLLFNBQVMsQ0FBQyxNQUFNO0FBQ25CLG1CQUFPLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO0FBQUEsQUFDbkMsZUFBSyxTQUFTLENBQUMsTUFBTTtBQUNuQixtQkFBTyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztBQUFBLEFBQ3BDLGVBQUssU0FBUyxDQUFDLElBQUk7QUFDakIsZ0JBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUNYLG1CQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxLQUFLLENBQUMsY0FBYyxFQUFBLEVBQUUsYUFBYSxDQUFDLENBQUM7QUFBQSxBQUNwRSxlQUFLLFNBQVMsQ0FBQyxRQUFRO0FBQ3JCLG1CQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQztBQUFBLEFBQ3BFLGVBQUssU0FBUyxDQUFDLElBQUk7QUFDakIsZ0JBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUNYLG1CQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxLQUFLLENBQUMsd0JBQXdCLENBQUMsSUFBSSxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUM7QUFBQSxBQUNwRixlQUFLLFNBQVMsQ0FBQyxLQUFLO0FBQ2xCLGdCQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDWCxtQkFBTyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksS0FBSyxDQUFDLHdCQUF3QixDQUFDLEtBQUssQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO0FBQUEsQUFDckYsZUFBSyxTQUFTLENBQUMsSUFBSTtBQUNqQixnQkFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ1gsbUJBQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEtBQUssQ0FBQyxxQkFBcUIsRUFBQSxFQUFFLGFBQWEsQ0FBQyxDQUFDO0FBQUEsQUFDM0UsZUFBSyxTQUFTLENBQUMsTUFBTTtBQUNuQixtQkFBTyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztBQUFBLEFBQ3JDLGVBQUssU0FBUyxDQUFDLE1BQU07QUFDbkIsbUJBQU8sSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7QUFBQSxBQUN0QyxlQUFLLFNBQVMsQ0FBQyxHQUFHO0FBQUMsQUFDbkIsZUFBSyxTQUFTLENBQUMsVUFBVTtBQUN2QixnQkFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDO0FBQ3JGLGdCQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDdkIsZ0JBQUksU0FBUyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzdDLGdCQUFJLE9BQU8sR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztBQUNsRSxnQkFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQzdDLGdCQUFJO0FBQ0Ysb0JBQU0sQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7YUFDeEIsQ0FBQyxPQUFPLE1BQU0sRUFBRTtBQUNmLG9CQUFNLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLDBCQUEwQixDQUFDLENBQUM7YUFDckY7QUFDRCxtQkFBTyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksS0FBSyxDQUFDLHVCQUF1QixDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQztBQUFBLEFBQzdGLGVBQUssU0FBUyxDQUFDLEtBQUs7QUFDbEIsbUJBQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUFBLEFBQy9CO0FBQ0Usa0JBQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO0FBQUEsU0FDM0M7T0FDRjs7OztBQUVELHVCQUFtQjthQUFBLCtCQUFHO0FBQ3BCLFlBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUN2QyxZQUFJLElBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUU7QUFDdkMsZ0JBQU0sSUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsYUFBYSxDQUFDLG9CQUFvQixDQUFDLENBQUM7U0FDeEY7QUFDRCxZQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDeEIsWUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLE1BQU0sS0FBSyxDQUFDLEdBQUMsQ0FBQyxHQUM1QixJQUFJLEtBQUssQ0FBQyx5QkFBeUIsRUFBQSxHQUNuQyxJQUFJLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDdEQsZUFBTyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxhQUFhLENBQUMsQ0FBQztPQUMvQzs7OztBQUVELHNCQUFrQjthQUFBLDhCQUFHO0FBQ25CLFlBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUN2QyxZQUFJLElBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUU7QUFDdkMsZ0JBQU0sSUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsYUFBYSxDQUFDLG9CQUFvQixDQUFDLENBQUM7U0FDeEY7QUFDRCxZQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDeEIsZUFBTyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksS0FBSyxDQUFDLHVCQUF1QixDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFDeEYsYUFBYSxDQUFDLENBQUM7T0FDcEI7Ozs7QUFFRCx1QkFBbUI7YUFBQSwrQkFBRztBQUNwQixZQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDdkMsWUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLEVBQUU7QUFDOUMsaUJBQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEtBQUssQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1NBQ2pGLE1BQU07QUFDTCxnQkFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQzdDO09BQ0Y7Ozs7QUFFRCxtQkFBZTthQUFBLDJCQUFHO0FBQ2hCLFlBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUN2QyxlQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxLQUFLLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO09BQ3hHOzs7O0FBRUQscUJBQWlCO2FBQUEsNkJBQUc7QUFDbEIsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUIsWUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQ2pDLFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlCLGVBQU8sSUFBSSxDQUFDO09BQ2I7Ozs7QUFFRCxrQkFBYzthQUFBLDBCQUFHO0FBQ2YsWUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO0FBQ2hCLGVBQU8sSUFBSSxFQUFFO0FBQ1gsY0FBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsR0FBRyxFQUFFLEVBQUU7QUFDOUMsbUJBQU8sTUFBTSxDQUFDO1dBQ2Y7QUFDRCxjQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDdkMsY0FBSSxHQUFHLFlBQUEsQ0FBQztBQUNSLGNBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLEVBQUU7QUFDaEMsZUFBRyxHQUFHLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO0FBQ3ZDLGVBQUcsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksS0FBSyxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQztXQUN0RSxNQUFNO0FBQ0wsZUFBRyxHQUFHLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO1dBQ3hDO0FBQ0QsZ0JBQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDakIsY0FBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFO0FBQzlCLGtCQUFNO1dBQ1A7U0FDRjtBQUNELGVBQU8sTUFBTSxDQUFDO09BQ2Y7Ozs7QUFJRCxlQUFXOzs7O2FBQUEsdUJBQUc7QUFDWixZQUFJLElBQUksQ0FBQywyQkFBMkIsRUFBRTtBQUNwQyxnQkFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1NBQ2xFO0FBQ0QsWUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFO0FBQ2hDLGNBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQzlCO09BQ0Y7Ozs7QUFFRCx3QkFBb0I7YUFBQSxnQ0FBRzs7QUFDckIsWUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDO0FBQ2hCLFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzFDLFlBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUU7QUFDOUIsY0FBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ25CLGlCQUFPO0FBQ0wsZ0JBQUksRUFBRSx1QkFBdUI7QUFDN0Isa0JBQU0sRUFBRSxFQUFFO0FBQ1YsZ0JBQUksRUFBRSxJQUFJO1dBQ1gsQ0FBQztTQUNILE1BQU0sSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsRUFBRTtBQUN2QyxjQUFJLEdBQUcsSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUM7QUFDM0QsY0FBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUIsY0FBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ25CLGlCQUFPO0FBQ0wsZ0JBQUksRUFBRSx1QkFBdUI7QUFDN0Isa0JBQU0sRUFBRSxFQUFFO0FBQ1YsZ0JBQUksRUFBRSxJQUFJO1dBQ1gsQ0FBQztTQUNIOztBQUVELFlBQUksZ0JBQWdCLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNyRCxZQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDdkMsWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUM7QUFDN0MsWUFBSSxNQUFNLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQzs7QUFFckIsZUFBTyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUNoQyxjQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxFQUFFO0FBQ2xDLGdCQUFJLENBQUMsZ0JBQWdCLEVBQUU7QUFDckIsb0JBQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQzthQUM3QztBQUNELGdCQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDWCxnQkFBSSxHQUFHLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDO0FBQzNELGtCQUFNO1dBQ1A7QUFDRCwwQkFBZ0IsR0FBRyxnQkFBZ0IsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3JFLGNBQUksSUFBSSxHQUFHLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO0FBQzVDLGdCQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2xCLGVBQUssR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksS0FBSyxDQUFDLGdCQUFnQixDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUM7U0FDeEY7O0FBRUQsWUFBSSxnQkFBZ0IsRUFBRTtBQUNwQiwwQkFBZ0IsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQywwQ0FBMEMsQ0FBQyxDQUFDO1NBQ3BGOztBQUVELFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDOztBQUU5QixZQUFJLENBQUMsSUFBSSxDQUFDLDJCQUEyQixJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFOztBQUNwRSxnQkFBSSxDQUFDLGdCQUFnQixFQUFFO0FBQ3JCLG9CQUFNLE1BQUssdUJBQXVCLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO2FBQ3hGOztBQUVELGtCQUFNLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztBQUM3RCxnQkFBSSxhQUFhLEdBQUcsRUFBRSxDQUFDO0FBQ3ZCLGtCQUFNLENBQUMsT0FBTyxDQUFDLFVBQUEsSUFBSSxFQUFJO0FBQ3JCLGtCQUFJLFVBQVUsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3pDLGtCQUFJLEdBQUcsR0FBRyxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDckMsa0JBQUksR0FBRyxFQUFFO0FBQ1Asc0JBQU0sTUFBSyxXQUFXLENBQUMsYUFBYSxDQUFDLGlCQUFpQixFQUFFLEdBQUcsQ0FBQyxDQUFDO2VBQzlEO0FBQ0QsMkJBQWEsR0FBRyxhQUFhLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFBO2FBQ2pELENBQUMsQ0FBQztBQUNILGdCQUFJLElBQUksRUFBRTtBQUNSLDJCQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDMUM7O0FBRUQsZ0JBQUksR0FBRyxHQUFHLGNBQWMsQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUN4QyxnQkFBSSxNQUFLLE1BQU0sSUFBSSxHQUFHLEVBQUU7QUFDdEIsb0JBQU0sTUFBSyxXQUFXLENBQUMsYUFBYSxDQUFDLGlCQUFpQixDQUFDLENBQUM7YUFDekQ7O0FBRUQsZ0JBQUksc0JBQXNCLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0FBQ2xFLGdCQUFJLE1BQUssTUFBTSxJQUFJLHNCQUFzQixFQUFFO0FBQ3pDLG9CQUFNLE1BQUssV0FBVyxDQUFDLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO2FBQ3pEOztBQUVELGdCQUFJLG9CQUFvQixHQUFHLHlCQUF5QixDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQ3BFLGdCQUFJLE1BQUssTUFBTSxJQUFJLG9CQUFvQixFQUFFO0FBQ3ZDLG9CQUFNLE1BQUssV0FBVyxDQUFDLGFBQWEsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO2FBQzVEOztBQUVEO2lCQUFPO0FBQ0wsb0JBQUksRUFBRSx1QkFBdUI7QUFDN0Isc0JBQU0sRUFBTixNQUFNO0FBQ04sb0JBQUksRUFBSixJQUFJO0FBQ0osbUJBQUcsRUFBSCxHQUFHO0FBQ0gsb0NBQW9CLEVBQXBCLG9CQUFvQjtBQUNwQixzQ0FBc0IsRUFBdEIsc0JBQXNCLEVBQUM7Y0FBQzs7Ozs7O1NBQzNCLE1BQU07QUFDTCxjQUFJLElBQUksRUFBRTtBQUNSLGdCQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7V0FDcEI7QUFDRCxpQkFBTyxLQUFLLENBQUM7U0FDZDtPQUNGOzs7O0FBR0Qsd0JBQW9CO2FBQUEsZ0NBQUc7QUFDckIsWUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDOztBQUV2QyxZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQzs7QUFFOUIsWUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLDRCQUE0QixFQUFFLENBQUM7O0FBRW5ELFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDOztBQUU5QixlQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxLQUFLLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO09BQzlFOzs7O0FBRUQsZ0NBQTRCO2FBQUEsd0NBQUc7QUFDN0IsWUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO0FBQ2hCLGVBQU8sSUFBSSxFQUFFO0FBQ1gsY0FBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUNoQyxtQkFBTyxNQUFNLENBQUM7V0FDZjtBQUNELGNBQUksRUFBRSxZQUFBLENBQUM7O0FBRVAsY0FBSSxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUM3QixjQUFFLEdBQUcsSUFBSSxDQUFDO1dBQ1gsTUFBTTtBQUNMLGdCQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDdkMsZ0JBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLEVBQUU7QUFDaEMsZ0JBQUUsR0FBRyxJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQztBQUN0QyxnQkFBRSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxLQUFLLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO2FBQ3BFLE1BQU07QUFDTCxnQkFBRSxHQUFHLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO2FBQ3ZDO0FBQ0QsZ0JBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUNqQyxrQkFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDOUI7V0FDRjtBQUNELGdCQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1NBQ2pCO09BQ0Y7Ozs7QUFFRCx5QkFBcUI7YUFBQSxpQ0FBRztBQUN0QixZQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7O0FBRXZDLFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDOztBQUU5QixZQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsMEJBQTBCLEVBQUUsQ0FBQzs7QUFFbkQsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7O0FBRTlCLGVBQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQztPQUNqRjs7OztBQUdELDhCQUEwQjthQUFBLHNDQUFHO0FBQzNCLFlBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztBQUNoQixZQUFJLFlBQVksR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzNCLGVBQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUNwQyxnQkFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMseUJBQXlCLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztBQUMxRCxjQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUU7QUFDakMsZ0JBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1dBQzlCO1NBQ0Y7QUFDRCxlQUFPLE1BQU0sQ0FBQztPQUNmOzs7O0FBRUQsNkJBQXlCO2FBQUEsbUNBQUMsWUFBWSxFQUFFO0FBQ3RDLFlBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUN2QyxZQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO3FDQUNELElBQUksQ0FBQyxxQkFBcUIsRUFBRTs7WUFBakQsV0FBVywwQkFBWCxXQUFXO1lBQUUsSUFBSSwwQkFBSixJQUFJO0FBQ3RCLGdCQUFRLElBQUk7QUFDVixlQUFLLFFBQVE7QUFDWCxtQkFBTyxXQUFXLENBQUM7QUFBQSxBQUNyQixlQUFLLFlBQVk7O0FBQ2YsZ0JBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUU7O0FBRTlCLHFCQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxLQUFLLENBQUMseUJBQXlCLENBQ3hELElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLElBQUksS0FBSyxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsRUFDcEUsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUMsRUFDbkMsYUFBYSxDQUFDLENBQUM7YUFDbEIsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDdkMscUJBQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEtBQUssQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUM7YUFDL0c7QUFBQSxTQUNKOzs7QUFHRCxZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUM3QixZQUFJLFdBQVcsQ0FBQyxJQUFJLEtBQUssb0JBQW9CLEVBQUU7QUFDN0MsY0FBSSxXQUFXLENBQUMsS0FBSyxLQUFLLFdBQVcsRUFBRTtBQUNyQyxnQkFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsRUFBRTtBQUNwQiwwQkFBWSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQzthQUN4QixNQUFNO0FBQ0wsb0JBQU0sSUFBSSxDQUFDLHVCQUF1QixDQUFDLEtBQUssRUFBRSxhQUFhLENBQUMsd0JBQXdCLENBQUMsQ0FBQzthQUNuRjtXQUNGO1NBQ0Y7QUFDRCxlQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxLQUFLLENBQUMsWUFBWSxDQUMzQyxXQUFXLEVBQ1gsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUMsRUFDbkMsYUFBYSxDQUFDLENBQUM7T0FDbEI7Ozs7QUFFRCxxQkFBaUI7YUFBQSw2QkFBRzs7QUFFbEIsWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztBQUMzQixZQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7O0FBRXZDLFlBQUksSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFO0FBQ2QsZ0JBQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ3BDOztBQUVELGdCQUFRLEtBQUssQ0FBQyxJQUFJO0FBQ2hCLGVBQUssU0FBUyxDQUFDLE1BQU07QUFDbkIsbUJBQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQztBQUFBLEFBQ3pHLGVBQUssU0FBUyxDQUFDLE1BQU07QUFDbkIsZ0JBQUksVUFBVSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO0FBQzVDLG1CQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxLQUFLLENBQUMsa0JBQWtCLENBQUMsRUFBRSxJQUFJLFVBQVUsQ0FBQyxJQUFJLEtBQUssMkJBQTJCLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFBLEFBQUMsQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO0FBQUEsQUFDM0osZUFBSyxTQUFTLENBQUMsTUFBTTtBQUNuQixnQkFBSSwwQkFBMEIsR0FBRyxJQUFJLENBQUMsdUJBQXVCLENBQUM7QUFDOUQsZ0JBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7QUFDcEMsZ0JBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDOzs7QUFHOUIsZ0JBQUksSUFBSSxDQUFDLHVCQUF1QixFQUFFOztBQUVoQyxrQkFBSSxDQUFDLHVCQUF1QixHQUFHLEtBQUssQ0FBQztBQUNyQyxrQkFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7YUFDekI7QUFDRCxnQkFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUM7QUFDNUMsZ0JBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlCLGdCQUFJLENBQUMsdUJBQXVCLEdBQUcsMEJBQTBCLENBQUM7QUFDMUQsZ0JBQUksQ0FBQyxVQUFVLEdBQUcsYUFBYSxDQUFDO0FBQ2hDLG1CQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxLQUFLLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUM7QUFBQSxTQUNqRjs7QUFFRCxlQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxLQUFLLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUM7T0FDeEc7Ozs7QUFNRCx5QkFBcUI7Ozs7OzthQUFBLGlDQUFHO0FBQ3RCLGdCQUFRLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSTtBQUN6QixlQUFLLFNBQVMsQ0FBQyxNQUFNO0FBQUMsQUFDdEIsZUFBSyxTQUFTLENBQUMsTUFBTTtBQUFDLEFBQ3RCLGVBQUssU0FBUyxDQUFDLE1BQU07QUFDbkIsbUJBQU8sSUFBSSxDQUFDO0FBQUEsQUFDZDtBQUNFLG1CQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQztBQUFBLFNBQ3JEO09BQ0Y7Ozs7QUFhRCx5QkFBcUI7Ozs7Ozs7Ozs7Ozs7YUFBQSxpQ0FBRztBQUN0QixZQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO0FBQzNCLFlBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQzs7OztBQUl2QyxZQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQzs7QUFFbkMsWUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQyxVQUFVLEVBQUU7QUFDdkMsY0FBSSxLQUFJLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQztBQUN2QixjQUFJLEtBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFOztBQUVyQixnQkFBSSxLQUFLLEtBQUssS0FBSSxJQUFJLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxFQUFFO0FBQ2xELGlCQUFHLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7QUFDL0Isa0JBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlCLGtCQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQzt1Q0FDakIsSUFBSSxDQUFDLGlCQUFpQixFQUFFOzs7O2tCQUFoQyxJQUFJO0FBQ1QscUJBQU87QUFDTCwyQkFBVyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsRUFBRSxhQUFhLENBQUM7QUFDMUUsb0JBQUksRUFBRSxRQUFRO2VBQ2YsQ0FBQzthQUNILE1BQU0sSUFBSSxLQUFLLEtBQUssS0FBSSxJQUFJLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxFQUFFO0FBQ3pELGlCQUFHLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7QUFDL0Isa0JBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlCLGtCQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDOUIsa0JBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQztBQUNkLGtCQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3hDLGtCQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQzt3Q0FDUCxJQUFJLENBQUMsaUJBQWlCLEVBQUU7Ozs7a0JBQTFDLElBQUk7a0JBQUUsUUFBUTtBQUNuQixrQkFBSSxRQUFRLEVBQUU7QUFDWixvQkFBSSxJQUFJLENBQUMsZUFBZSxFQUFFO0FBQ3hCLHdCQUFNLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztpQkFDeEU7ZUFDRjtBQUNELHFCQUFPO0FBQ0wsMkJBQVcsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxFQUFFLGFBQWEsQ0FBQztBQUNqRixvQkFBSSxFQUFFLFFBQVE7ZUFDZixDQUFDO2FBQ0g7V0FDRjtTQUNGOztBQUVELFlBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUU7QUFDaEMsY0FBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQ0FDaEIsSUFBSSxDQUFDLGlCQUFpQixFQUFFOzs7O2NBQTFDLElBQUk7Y0FBRSxRQUFRO0FBQ25CLGNBQUksUUFBUSxFQUFFO0FBQ1osZ0JBQUksU0FBUyxDQUFDLGVBQWUsRUFBRTtBQUM3QixvQkFBTSxJQUFJLENBQUMsdUJBQXVCLENBQUMsU0FBUyxDQUFDLGVBQWUsRUFBRSxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7YUFDbEY7V0FDRjtBQUNELGlCQUFPO0FBQ0wsdUJBQVcsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLFNBQVMsQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsRUFBRSxhQUFhLENBQUM7QUFDbkgsZ0JBQUksRUFBRSxRQUFRO1dBQ2YsQ0FBQztTQUNIOztBQUVELGVBQU87QUFDTCxxQkFBVyxFQUFFLEdBQUc7QUFDaEIsY0FBSSxFQUFFLEtBQUssQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDLFVBQVUsR0FBRyxZQUFZLEdBQUcsVUFBVTtTQUN0RSxDQUFDO09BQ0g7Ozs7QUFFRCxjQUFVO2FBQUEsb0JBQUMsTUFBTSxFQUFFO0FBQ2pCLFlBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUNsQyxZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUM3QixZQUFJLEVBQUUsR0FBRyxJQUFJLENBQUM7QUFDZCxZQUFJLFFBQVEsR0FBRyxJQUFJLENBQUM7QUFDcEIsWUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsRUFBRTtBQUMvQyxZQUFFLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUM7U0FDckM7OztBQUdELFlBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7OztBQUdwQyxZQUFJLElBQUksQ0FBQyx1QkFBdUIsRUFBRTtBQUNoQyxjQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztTQUN6QjtBQUNELFlBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEVBQUU7QUFDL0Isa0JBQVEsR0FBRyxJQUFJLENBQUMsb0NBQW9DLEVBQUUsQ0FBQztTQUN4RDs7QUFFRCxZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM5QixZQUFJLGNBQWMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQ2pDLFlBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO0FBQ25CLFlBQUksT0FBTyxHQUFHLEVBQUUsQ0FBQztBQUNqQixZQUFJLGNBQWMsR0FBRyxLQUFLLENBQUM7QUFDM0IsZUFBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQ2xDLGNBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEVBQUU7QUFDakMscUJBQVM7V0FDVjtBQUNELGNBQUksV0FBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7QUFDakMsY0FBSSxRQUFRLEdBQUcsS0FBSyxDQUFDO3VDQUNLLElBQUksQ0FBQyxxQkFBcUIsRUFBRTs7Y0FBakQsV0FBVywwQkFBWCxXQUFXO2NBQUUsSUFBSSwwQkFBSixJQUFJO0FBQ3RCLGNBQUksSUFBSSxLQUFLLFlBQVksSUFBSSxXQUFXLENBQUMsS0FBSyxLQUFLLFFBQVEsRUFBRTtBQUMzRCxvQkFBUSxHQUFHLElBQUksQ0FBQzt1QkFDTyxJQUFJLENBQUMscUJBQXFCLEVBQUU7O0FBQWpELHVCQUFXLFFBQVgsV0FBVztBQUFFLGdCQUFJLFFBQUosSUFBSTtXQUNwQjtBQUNELGtCQUFRLElBQUk7QUFDVixpQkFBSyxRQUFRO0FBQ1gsa0JBQUksR0FBRyxHQUFHLFdBQVcsQ0FBQyxJQUFJLENBQUM7QUFDM0Isa0JBQUksQ0FBQyxRQUFRLEVBQUU7QUFDYixvQkFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLG9CQUFvQixJQUFJLEdBQUcsQ0FBQyxLQUFLLEtBQUssYUFBYSxFQUFFO0FBQ3BFLHNCQUFJLFdBQVcsQ0FBQyxJQUFJLEtBQUssUUFBUSxFQUFFO0FBQ2pDLDBCQUFNLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxXQUFXLEVBQUUsdURBQXVELENBQUMsQ0FBQzttQkFDMUc7QUFDRCxzQkFBSSxjQUFjLEVBQUU7QUFDbEIsMEJBQU0sSUFBSSxDQUFDLHVCQUF1QixDQUFDLFdBQVcsRUFBRSw0Q0FBNEMsQ0FBQyxDQUFDO21CQUMvRixNQUFNO0FBQ0wsa0NBQWMsR0FBRyxJQUFJLENBQUM7bUJBQ3ZCO2lCQUNGO2VBQ0YsTUFBTTtBQUNMLG9CQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssb0JBQW9CLElBQUksR0FBRyxDQUFDLEtBQUssS0FBSyxXQUFXLEVBQUU7QUFDbEUsd0JBQU0sSUFBSSxDQUFDLHVCQUF1QixDQUFDLFdBQVcsRUFBRSxrREFBa0QsQ0FBQyxDQUFDO2lCQUNyRztlQUNGO0FBQ0QscUJBQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDO0FBQzVELG9CQUFNO0FBQUEsQUFDUjtBQUNFLG9CQUFNLElBQUksQ0FBQyxXQUFXLENBQUMscUNBQXFDLENBQUMsQ0FBQztBQUFBLFdBQ2pFO1NBQ0Y7QUFDRCxZQUFJLENBQUMsTUFBTSxHQUFHLGNBQWMsQ0FBQztBQUM3QixZQUFJLENBQUMsVUFBVSxHQUFHLGFBQWEsQ0FBQztBQUNoQyxlQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxNQUFNLEdBQUcsS0FBSyxDQUFDLGVBQWUsR0FBRyxLQUFLLENBQUMsZ0JBQWdCLENBQUEsQ0FBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO09BQzFIOzs7O0FBRUQsaUJBQWE7YUFBQSx1QkFBQyxZQUFZLEVBQUU7QUFDMUIsWUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDOztBQUV2QyxZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQzs7QUFFaEMsWUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDO0FBQ2QsWUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDO0FBQ25CLFlBQUksZUFBZSxHQUFHLElBQUksQ0FBQztBQUMzQixZQUFJLENBQUMsWUFBWSxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUU7QUFDbEQsY0FBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztBQUMzQixZQUFFLEdBQUcsSUFBSSxDQUFDLHVCQUF1QixFQUFFLENBQUM7QUFDcEMsY0FBSSxJQUFJLENBQUMsTUFBTSxFQUFFO0FBQ2YsZ0JBQUksZ0JBQWdCLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQzdCLG9CQUFNLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLG9CQUFvQixDQUFDLENBQUM7YUFDL0U7V0FDRixNQUFNO0FBQ0wsZ0JBQUksZ0JBQWdCLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQzdCLDZCQUFlLEdBQUcsS0FBSyxDQUFDO0FBQ3hCLHFCQUFPLEdBQUcsYUFBYSxDQUFDLG9CQUFvQixDQUFDO2FBQzlDLE1BQU0sSUFBSSwyQkFBMkIsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDL0MsNkJBQWUsR0FBRyxLQUFLLENBQUM7QUFDeEIscUJBQU8sR0FBRyxhQUFhLENBQUMsb0JBQW9CLENBQUM7YUFDOUM7V0FDRjtTQUNGO0FBQ0QsWUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxlQUFlLENBQUMsQ0FBQzs7QUFFN0MsWUFBSSxJQUFJLENBQUMsT0FBTyxJQUFJLElBQUksRUFBRTtBQUN4QixpQkFBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7U0FDeEI7O0FBRUQsWUFBSSxjQUFjLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztpQ0FDVixJQUFJLENBQUMsaUJBQWlCLEVBQUU7Ozs7WUFBMUMsSUFBSTtZQUFFLFFBQVE7QUFDbkIsWUFBSSxPQUFPLElBQUksSUFBSSxFQUFFO0FBQ25CLGNBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxJQUFJLFFBQVEsQ0FBQSxJQUFLLElBQUksQ0FBQyxlQUFlLElBQUksSUFBSSxFQUFFO0FBQzdELGtCQUFNLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1dBQ25FO0FBQ0QsY0FBSSxDQUFDLElBQUksQ0FBQyxNQUFNLElBQUksUUFBUSxDQUFBLElBQUssSUFBSSxDQUFDLFFBQVEsSUFBSSxJQUFJLEVBQUU7QUFDdEQsa0JBQU0sSUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7V0FDNUQ7U0FDRjtBQUNELFlBQUksQ0FBQyxNQUFNLEdBQUcsY0FBYyxDQUFDO0FBQzdCLGVBQU8sSUFBSSxDQUFDLFlBQVksQ0FDdEIsS0FBSyxZQUFZLEdBQUcsS0FBSyxDQUFDLGtCQUFrQixHQUFHLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQSxDQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUNsSCxhQUFhLENBQ2QsQ0FBQztPQUNIOzs7O0FBRUQsY0FBVTthQUFBLG9CQUFDLEtBQUssRUFBRSxJQUFJLEVBQUU7QUFDdEIsWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztBQUMzQixZQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQ2hDLGdCQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDN0M7QUFDRCxZQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsMkJBQTJCLEVBQUUsQ0FBQztBQUMvQyxZQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQzlCLGVBQUssR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksS0FBSyxDQUFDLG9CQUFvQixDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUMsQ0FBQyxDQUFDO1NBQ3pHO0FBQ0QsWUFBSSxDQUFDLE1BQU0sQ0FBQywwQ0FBMEMsQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUM3RCxnQkFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDcEM7QUFDRCxlQUFPLE1BQU0sQ0FBQyxnQ0FBZ0MsQ0FBQyxLQUFLLENBQUMsQ0FBQztPQUN2RDs7OztBQUVELGNBQVU7YUFBQSxvQkFBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUU7QUFDcEMsWUFBSSxRQUFRLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN4QyxVQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7O0FBRS9CLFlBQUksY0FBYyxDQUFDLFFBQVEsQ0FBQyxJQUFJLElBQUksRUFBRTtBQUNwQyxnQkFBTSxJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxpQkFBaUIsRUFBRSxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztTQUN0RztBQUNELFlBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtBQUNmLGNBQUksUUFBUSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFO0FBQ25DLGtCQUFNLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLGlCQUFpQixDQUFDLENBQUM7V0FDNUUsTUFBTSxJQUFJLGNBQWMsQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLEVBQUU7QUFDeEMsa0JBQU0sSUFBSSxDQUFDLHVCQUF1QixDQUFDLEtBQUssRUFBRSxhQUFhLENBQUMsaUJBQWlCLENBQUMsQ0FBQztXQUM1RTtTQUNGLE1BQU0sSUFBSSxJQUFJLENBQUMsZUFBZSxJQUFJLElBQUksRUFBRTtBQUN2QyxjQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsRUFBRTtBQUNuQyxnQkFBSSxDQUFDLGVBQWUsR0FBRyxLQUFLLENBQUM7QUFDN0IsZ0JBQUksQ0FBQyxPQUFPLEdBQUcsYUFBYSxDQUFDLGlCQUFpQixDQUFDO1dBQ2hELE1BQU0sSUFBSSx5QkFBeUIsQ0FBQyxRQUFRLENBQUMsRUFBRTtBQUM5QyxnQkFBSSxDQUFDLGVBQWUsR0FBRyxLQUFLLENBQUM7QUFDN0IsZ0JBQUksQ0FBQyxPQUFPLEdBQUcsYUFBYSxDQUFDLG9CQUFvQixDQUFDO1dBQ25ELE1BQU0sSUFBSSxjQUFjLENBQUMsS0FBSyxDQUFDLElBQUksSUFBSSxFQUFFO0FBQ3hDLGdCQUFJLENBQUMsZUFBZSxHQUFHLEtBQUssQ0FBQztBQUM3QixnQkFBSSxDQUFDLE9BQU8sR0FBRyxhQUFhLENBQUMsaUJBQWlCLENBQUM7V0FDaEQ7U0FDRjtPQUNGOzs7O0FBRUQsZUFBVzthQUFBLHFCQUFDLEVBQUUsRUFBRTtBQUNkLFlBQUksSUFBSSxHQUFHLEVBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDLENBQUM7QUFDcEMsWUFBSSxDQUFDLGVBQWUsR0FBRyxFQUFFLENBQUM7QUFDMUIsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7O0FBRTlCLFlBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUNqQyxjQUFJLEtBQUssR0FBRyxFQUFFLENBQUM7QUFDZixjQUFJLFFBQVEsR0FBRyxLQUFLLENBQUM7O0FBRXJCLGlCQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFO0FBQ2xCLGdCQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO0FBQzNCLGdCQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDdkMsZ0JBQUksS0FBSyxZQUFBLENBQUM7QUFDVixnQkFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsRUFBRTtBQUNoQyxtQkFBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7QUFDdkIsbUJBQUssR0FBRyxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQztBQUM1RCxtQkFBSyxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDL0Isc0JBQVEsR0FBRyxJQUFJLENBQUM7YUFDakIsTUFBTTtBQUNMLG1CQUFLLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO2FBQzNCOztBQUVELGdCQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDOztBQUUzQyxnQkFBSSxRQUFRLEVBQUU7QUFDWixrQkFBSSxDQUFDLElBQUksR0FBRyxLQUFLLENBQUM7QUFDbEIsb0JBQU07YUFDUDtBQUNELGdCQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN4QixnQkFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUNoQyxvQkFBTTthQUNQO0FBQ0QsZ0JBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1dBQzlCO1NBQ0Y7O0FBRUQsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUIsZUFBTyxJQUFJLENBQUM7T0FDYjs7Ozs7O1NBdHdEVSxNQUFNO0dBQVMsU0FBUyIsImZpbGUiOiJzcmMvcGFyc2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3B5cmlnaHQgMjAxNCBTaGFwZSBTZWN1cml0eSwgSW5jLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIilcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCAqIGFzIFNoaWZ0IGZyb20gXCJzaGlmdC1hc3RcIjtcblxuaW1wb3J0IHtpc1Jlc3RyaWN0ZWRXb3JkLCBpc1N0cmljdE1vZGVSZXNlcnZlZFdvcmRFUzV9IGZyb20gXCIuL3V0aWxzXCI7XG5cbmltcG9ydCB7RXJyb3JNZXNzYWdlc30gZnJvbSBcIi4vZXJyb3JzXCI7XG5cbmltcG9ydCBUb2tlbml6ZXIsIHtcbiAgICBUb2tlbkNsYXNzLFxuICAgIFRva2VuVHlwZSxcbiAgICBJZGVudGlmaWVyVG9rZW4sXG4gICAgSWRlbnRpZmllckxpa2VUb2tlbixcbiAgICBOdW1lcmljTGl0ZXJhbFRva2VuLFxuICAgIFN0cmluZ0xpdGVyYWxUb2tlbn0gZnJvbSBcIi4vdG9rZW5pemVyXCI7XG5cbi8vIEVtcHR5IHBhcmFtZXRlciBsaXN0IGZvciBBcnJvd0V4cHJlc3Npb25cbmNvbnN0IEFSUk9XX0VYUFJFU1NJT05fUEFSQU1TID0gXCJDb3ZlclBhcmVudGhlc2l6ZWRFeHByZXNzaW9uQW5kQXJyb3dQYXJhbWV0ZXJMaXN0XCI7XG5cbmNvbnN0IFNUUklDVF9NT0RFX1JFU0VSVkVEX1dPUkQgPSB7XG4gIFwiaW1wbGVtZW50c1wiOiBudWxsLCBcImludGVyZmFjZVwiOiBudWxsLCBcInBhY2thZ2VcIjogbnVsbCwgXCJwcml2YXRlXCI6IG51bGwsIFwicHJvdGVjdGVkXCI6IG51bGwsXG4gIFwicHVibGljXCI6IG51bGwsIFwic3RhdGljXCI6IG51bGwsIFwieWllbGRcIjogbnVsbCwgXCJsZXRcIjogbnVsbFxufTtcblxuY29uc3QgUHJlY2VkZW5jZSA9IHtcbiAgU2VxdWVuY2U6IDAsXG4gIFlpZWxkOiAxLFxuICBBc3NpZ25tZW50OiAxLFxuICBDb25kaXRpb25hbDogMixcbiAgQXJyb3dGdW5jdGlvbjogMixcbiAgTG9naWNhbE9SOiAzLFxuICBMb2dpY2FsQU5EOiA0LFxuICBCaXR3aXNlT1I6IDUsXG4gIEJpdHdpc2VYT1I6IDYsXG4gIEJpdHdpc2VBTkQ6IDcsXG4gIEVxdWFsaXR5OiA4LFxuICBSZWxhdGlvbmFsOiA5LFxuICBCaXR3aXNlU0hJRlQ6IDEwLFxuICBBZGRpdGl2ZTogMTEsXG4gIE11bHRpcGxpY2F0aXZlOiAxMixcbiAgVW5hcnk6IDEzLFxuICBQb3N0Zml4OiAxNCxcbiAgQ2FsbDogMTUsXG4gIE5ldzogMTYsXG4gIFRhZ2dlZFRlbXBsYXRlOiAxNyxcbiAgTWVtYmVyOiAxOCxcbiAgUHJpbWFyeTogMTlcbn07XG5cbmNvbnN0IEJpbmFyeVByZWNlZGVuY2UgPSB7XG4gIFwifHxcIjogUHJlY2VkZW5jZS5Mb2dpY2FsT1IsXG4gIFwiJiZcIjogUHJlY2VkZW5jZS5Mb2dpY2FsQU5ELFxuICBcInxcIjogUHJlY2VkZW5jZS5CaXR3aXNlT1IsXG4gIFwiXlwiOiBQcmVjZWRlbmNlLkJpdHdpc2VYT1IsXG4gIFwiJlwiOiBQcmVjZWRlbmNlLkJpdHdpc2VBTkQsXG4gIFwiPT1cIjogUHJlY2VkZW5jZS5FcXVhbGl0eSxcbiAgXCIhPVwiOiBQcmVjZWRlbmNlLkVxdWFsaXR5LFxuICBcIj09PVwiOiBQcmVjZWRlbmNlLkVxdWFsaXR5LFxuICBcIiE9PVwiOiBQcmVjZWRlbmNlLkVxdWFsaXR5LFxuICBcIjxcIjogUHJlY2VkZW5jZS5SZWxhdGlvbmFsLFxuICBcIj5cIjogUHJlY2VkZW5jZS5SZWxhdGlvbmFsLFxuICBcIjw9XCI6IFByZWNlZGVuY2UuUmVsYXRpb25hbCxcbiAgXCI+PVwiOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gIFwiaW5cIjogUHJlY2VkZW5jZS5SZWxhdGlvbmFsLFxuICBcImluc3RhbmNlb2ZcIjogUHJlY2VkZW5jZS5SZWxhdGlvbmFsLFxuICBcIjw8XCI6IFByZWNlZGVuY2UuQml0d2lzZVNISUZULFxuICBcIj4+XCI6IFByZWNlZGVuY2UuQml0d2lzZVNISUZULFxuICBcIj4+PlwiOiBQcmVjZWRlbmNlLkJpdHdpc2VTSElGVCxcbiAgXCIrXCI6IFByZWNlZGVuY2UuQWRkaXRpdmUsXG4gIFwiLVwiOiBQcmVjZWRlbmNlLkFkZGl0aXZlLFxuICBcIipcIjogUHJlY2VkZW5jZS5NdWx0aXBsaWNhdGl2ZSxcbiAgXCIlXCI6IFByZWNlZGVuY2UuTXVsdGlwbGljYXRpdmUsXG4gIFwiL1wiOiBQcmVjZWRlbmNlLk11bHRpcGxpY2F0aXZlLFxufTtcblxuZnVuY3Rpb24gY3BMb2MoZnJvbSwgdG8pIHtcbiAgaWYgKFwibG9jXCIgaW4gZnJvbSlcbiAgICB0by5sb2MgPSBmcm9tLmxvY1xuICByZXR1cm4gdG87XG59XG5cbi8qKlxuICpcbiAqIEBwYXJhbSB7W3N0cmluZ119IHN0cmluZ3NcbiAqIEByZXR1cm5zIHtzdHJpbmc/fVxuICovXG5mdW5jdGlvbiBmaXJzdER1cGxpY2F0ZShzdHJpbmdzKSB7XG4gIGlmIChzdHJpbmdzLmxlbmd0aCA8IDIpXG4gICAgcmV0dXJuIG51bGw7XG4gIGxldCBtYXAgPSB7fTtcbiAgZm9yIChsZXQgY3Vyc29yID0gMDsgY3Vyc29yIDwgc3RyaW5ncy5sZW5ndGg7IGN1cnNvcisrKSB7XG4gICAgbGV0IGlkID0gJyQnICsgc3RyaW5nc1tjdXJzb3JdO1xuICAgIGlmIChtYXAuaGFzT3duUHJvcGVydHkoaWQpKSB7XG4gICAgICByZXR1cm4gc3RyaW5nc1tjdXJzb3JdO1xuICAgIH1cbiAgICBtYXBbaWRdID0gdHJ1ZTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gaGFzU3RyaWN0TW9kZVJlc2VydmVkV29yZChpZHMpIHtcbiAgcmV0dXJuIGlkcy5zb21lKGlkID0+IFNUUklDVF9NT0RFX1JFU0VSVkVEX1dPUkQuaGFzT3duUHJvcGVydHkoaWQpKTtcbn1cblxuZXhwb3J0IGNsYXNzIFBhcnNlciBleHRlbmRzIFRva2VuaXplciB7XG4gIGNvbnN0cnVjdG9yKHNvdXJjZSkge1xuICAgIHN1cGVyKHNvdXJjZSk7XG4gICAgdGhpcy5sYWJlbFNldCA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgdGhpcy5hbGxvd0luID0gdHJ1ZTtcbiAgICB0aGlzLmluSXRlcmF0aW9uID0gZmFsc2U7XG4gICAgdGhpcy5pblN3aXRjaCA9IGZhbHNlO1xuICAgIHRoaXMuaW5GdW5jdGlvbkJvZHkgPSBmYWxzZTtcbiAgICB0aGlzLnBhcmFtR2VuZXJhdG9yUGFyYW1ldGVyID0gZmFsc2U7XG4gICAgdGhpcy5wYXJhbVlpZWxkID0gZmFsc2U7XG4gIH1cblxuICBlYXQodG9rZW5UeXBlKSB7XG4gICAgaWYgKHRoaXMubG9va2FoZWFkLnR5cGUgPT09IHRva2VuVHlwZSkge1xuICAgICAgcmV0dXJuIHRoaXMubGV4KCk7XG4gICAgfVxuICB9XG5cbiAgZXhwZWN0KHRva2VuVHlwZSkge1xuICAgIGlmICh0aGlzLmxvb2thaGVhZC50eXBlID09PSB0b2tlblR5cGUpIHtcbiAgICAgIHJldHVybiB0aGlzLmxleCgpO1xuICAgIH1cbiAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuICB9XG5cbiAgbWF0Y2goc3ViVHlwZSkge1xuICAgIHJldHVybiB0aGlzLmxvb2thaGVhZC50eXBlID09PSBzdWJUeXBlO1xuICB9XG5cbiAgY29uc3VtZVNlbWljb2xvbigpIHtcbiAgICBpZiAodGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLlNFTUlDT0xPTikpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuZW9mKCkgJiYgIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJCUkFDRSkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgfVxuICB9XG5cbiAgLy8gdGhpcyBpcyBhIG5vLW9wLCByZXNlcnZlZCBmb3IgZnV0dXJlIHVzZVxuICBtYXJrTG9jYXRpb24obm9kZSwgc3RhcnRMb2NhdGlvbikge1xuICAgIHJldHVybiBub2RlO1xuICB9XG5cbiAgcGFyc2VTY3JpcHQoKSB7XG4gICAgbGV0IGxvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCBbYm9keV0gPSB0aGlzLnBhcnNlQm9keSh0cnVlKTtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlNjcmlwdChib2R5KSwgbG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VGdW5jdGlvbkJvZHkoKSB7XG4gICAgbGV0IHByZXZpb3VzU3RyaWN0ID0gdGhpcy5zdHJpY3Q7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICBsZXQgb2xkTGFiZWxTZXQgPSB0aGlzLmxhYmVsU2V0O1xuICAgIGxldCBvbGRJbkl0ZXJhdGlvbiA9IHRoaXMuaW5JdGVyYXRpb247XG4gICAgbGV0IG9sZEluU3dpdGNoID0gdGhpcy5pblN3aXRjaDtcbiAgICBsZXQgb2xkSW5GdW5jdGlvbkJvZHkgPSB0aGlzLmluRnVuY3Rpb25Cb2R5O1xuXG4gICAgdGhpcy5sYWJlbFNldCA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgdGhpcy5pbkl0ZXJhdGlvbiA9IGZhbHNlO1xuICAgIHRoaXMuaW5Td2l0Y2ggPSBmYWxzZTtcbiAgICB0aGlzLmluRnVuY3Rpb25Cb2R5ID0gdHJ1ZTtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MQlJBQ0UpO1xuICAgIGxldCBbYm9keSwgaXNTdHJpY3RdID0gdGhpcy5wYXJzZUJvZHkoKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUkJSQUNFKTtcblxuICAgIGJvZHkgPSB0aGlzLm1hcmtMb2NhdGlvbihib2R5LCBzdGFydExvY2F0aW9uKTtcblxuICAgIHRoaXMubGFiZWxTZXQgPSBvbGRMYWJlbFNldDtcbiAgICB0aGlzLmluSXRlcmF0aW9uID0gb2xkSW5JdGVyYXRpb247XG4gICAgdGhpcy5pblN3aXRjaCA9IG9sZEluU3dpdGNoO1xuICAgIHRoaXMuaW5GdW5jdGlvbkJvZHkgPSBvbGRJbkZ1bmN0aW9uQm9keTtcbiAgICB0aGlzLnN0cmljdCA9IHByZXZpb3VzU3RyaWN0O1xuICAgIHJldHVybiBbYm9keSwgaXNTdHJpY3RdO1xuICB9XG5cbiAgcGFyc2VCb2R5KGFjY2VwdEVPRiA9IGZhbHNlKSB7XG4gICAgbGV0IGxvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCBkaXJlY3RpdmVzID0gW107XG4gICAgbGV0IHN0YXRlbWVudHMgPSBbXTtcbiAgICBsZXQgcGFyc2luZ0RpcmVjdGl2ZXMgPSB0cnVlO1xuICAgIGxldCBpc1N0cmljdCA9IHRoaXMuc3RyaWN0O1xuICAgIGxldCBmaXJzdFJlc3RyaWN0ZWQgPSBudWxsO1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBpZiAoYWNjZXB0RU9GKSB7XG4gICAgICAgIGlmICh0aGlzLmVvZigpKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0UpKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGxldCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgICAgbGV0IHRleHQgPSB0b2tlbi5zbGljZS50ZXh0O1xuICAgICAgbGV0IGlzU3RyaW5nTGl0ZXJhbCA9IHRva2VuLnR5cGUgPT09IFRva2VuVHlwZS5TVFJJTkc7XG4gICAgICBsZXQgZGlyZWN0aXZlTG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgICBsZXQgc3RtdCA9IHRoaXMucGFyc2VTdGF0ZW1lbnQoKTtcbiAgICAgIGlmIChwYXJzaW5nRGlyZWN0aXZlcykge1xuICAgICAgICBpZiAoaXNTdHJpbmdMaXRlcmFsICYmIHN0bXQudHlwZSA9PT0gXCJFeHByZXNzaW9uU3RhdGVtZW50XCIgJiZcbiAgICAgICAgICAgIHN0bXQuZXhwcmVzc2lvbi50eXBlID09PSBcIkxpdGVyYWxTdHJpbmdFeHByZXNzaW9uXCIpIHtcbiAgICAgICAgICBpZiAodGV4dCA9PT0gXCJcXFwidXNlIHN0cmljdFxcXCJcIiB8fCB0ZXh0ID09PSBcIid1c2Ugc3RyaWN0J1wiKSB7XG4gICAgICAgICAgICBpc1N0cmljdCA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLnN0cmljdCA9IHRydWU7XG4gICAgICAgICAgICBpZiAoZmlyc3RSZXN0cmljdGVkICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbihmaXJzdFJlc3RyaWN0ZWQsIEVycm9yTWVzc2FnZXMuU1RSSUNUX09DVEFMX0xJVEVSQUwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSBpZiAoZmlyc3RSZXN0cmljdGVkID09IG51bGwgJiYgdG9rZW4ub2N0YWwpIHtcbiAgICAgICAgICAgIGZpcnN0UmVzdHJpY3RlZCA9IHRva2VuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBkaXJlY3RpdmVzLnB1c2godGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkRpcmVjdGl2ZSh0ZXh0LnNsaWNlKDEsIC0xKSksIGRpcmVjdGl2ZUxvY2F0aW9uKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGFyc2luZ0RpcmVjdGl2ZXMgPSBmYWxzZTtcbiAgICAgICAgICBzdGF0ZW1lbnRzLnB1c2goc3RtdCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0YXRlbWVudHMucHVzaChzdG10KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gW3RoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5GdW5jdGlvbkJvZHkoZGlyZWN0aXZlcywgc3RhdGVtZW50cyksIGxvY2F0aW9uKSwgaXNTdHJpY3RdO1xuICB9XG5cblxuICBwYXJzZVN0YXRlbWVudCgpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBpZiAodGhpcy5lb2YoKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICB9XG4gICAgc3dpdGNoICh0aGlzLmxvb2thaGVhZC50eXBlKSB7XG4gICAgICBjYXNlIFRva2VuVHlwZS5TRU1JQ09MT046XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih0aGlzLnBhcnNlRW1wdHlTdGF0ZW1lbnQoKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICBjYXNlIFRva2VuVHlwZS5MQlJBQ0U6XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih0aGlzLnBhcnNlQmxvY2tTdGF0ZW1lbnQoKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICBjYXNlIFRva2VuVHlwZS5MUEFSRU46XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih0aGlzLnBhcnNlRXhwcmVzc2lvblN0YXRlbWVudCgpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkJSRUFLOlxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24odGhpcy5wYXJzZUJyZWFrU3RhdGVtZW50KCksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgY2FzZSBUb2tlblR5cGUuQ09OVElOVUU6XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih0aGlzLnBhcnNlQ29udGludWVTdGF0ZW1lbnQoKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICBjYXNlIFRva2VuVHlwZS5ERUJVR0dFUjpcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHRoaXMucGFyc2VEZWJ1Z2dlclN0YXRlbWVudCgpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkRPOlxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24odGhpcy5wYXJzZURvV2hpbGVTdGF0ZW1lbnQoKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICBjYXNlIFRva2VuVHlwZS5GT1I6XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih0aGlzLnBhcnNlRm9yU3RhdGVtZW50KCksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgY2FzZSBUb2tlblR5cGUuRlVOQ1RJT046XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih0aGlzLnBhcnNlRnVuY3Rpb24oZmFsc2UpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLklGOlxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24odGhpcy5wYXJzZUlmU3RhdGVtZW50KCksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgY2FzZSBUb2tlblR5cGUuUkVUVVJOOlxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24odGhpcy5wYXJzZVJldHVyblN0YXRlbWVudCgpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlNXSVRDSDpcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHRoaXMucGFyc2VTd2l0Y2hTdGF0ZW1lbnQoKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICBjYXNlIFRva2VuVHlwZS5USFJPVzpcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHRoaXMucGFyc2VUaHJvd1N0YXRlbWVudCgpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlRSWTpcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHRoaXMucGFyc2VUcnlTdGF0ZW1lbnQoKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICBjYXNlIFRva2VuVHlwZS5WQVI6XG4gICAgICBjYXNlIFRva2VuVHlwZS5MRVQ6XG4gICAgICBjYXNlIFRva2VuVHlwZS5DT05TVDpcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHRoaXMucGFyc2VWYXJpYWJsZURlY2xhcmF0aW9uU3RhdGVtZW50KCksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgY2FzZSBUb2tlblR5cGUuV0hJTEU6XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih0aGlzLnBhcnNlV2hpbGVTdGF0ZW1lbnQoKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICBjYXNlIFRva2VuVHlwZS5XSVRIOlxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24odGhpcy5wYXJzZVdpdGhTdGF0ZW1lbnQoKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICBjYXNlIFRva2VuVHlwZS5DTEFTUzpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VDbGFzcyhmYWxzZSk7XG4gICAgICBkZWZhdWx0OiB7XG4gICAgICAgIGxldCBleHByID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcblxuICAgICAgICAvLyAxMi4xMiBMYWJlbGxlZCBTdGF0ZW1lbnRzO1xuICAgICAgICBpZiAoZXhwci50eXBlID09PSBcIklkZW50aWZpZXJFeHByZXNzaW9uXCIgJiYgdGhpcy5lYXQoVG9rZW5UeXBlLkNPTE9OKSkge1xuICAgICAgICAgIGxldCBrZXkgPSBcIiRcIiArIGV4cHIuaWRlbnRpZmllci5uYW1lO1xuICAgICAgICAgIGlmICh7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRoaXMubGFiZWxTZXQsIGtleSkpIHtcbiAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5MQUJFTF9SRURFQ0xBUkFUSU9OLCBleHByLmlkZW50aWZpZXIubmFtZSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy5sYWJlbFNldFtrZXldID0gdHJ1ZTtcbiAgICAgICAgICBsZXQgbGFiZWxlZEJvZHkgPSB0aGlzLnBhcnNlU3RhdGVtZW50KCk7XG4gICAgICAgICAgZGVsZXRlIHRoaXMubGFiZWxTZXRba2V5XTtcbiAgICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkxhYmVsZWRTdGF0ZW1lbnQoZXhwci5pZGVudGlmaWVyLCBsYWJlbGVkQm9keSksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuY29uc3VtZVNlbWljb2xvbigpO1xuICAgICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuRXhwcmVzc2lvblN0YXRlbWVudChleHByKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgfVxuXG4gIHBhcnNlVmFyaWFibGVJZGVudGlmaWVyKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuSWRlbnRpZmllcih0aGlzLmV4cGVjdChUb2tlblR5cGUuSURFTlRJRklFUikudmFsdWUpLCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlRW1wdHlTdGF0ZW1lbnQoKSB7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlNFTUlDT0xPTik7XG4gICAgcmV0dXJuIG5ldyBTaGlmdC5FbXB0eVN0YXRlbWVudDtcbiAgfVxuXG4gIHBhcnNlQmxvY2tTdGF0ZW1lbnQoKSB7XG4gICAgcmV0dXJuIG5ldyBTaGlmdC5CbG9ja1N0YXRlbWVudCh0aGlzLnBhcnNlQmxvY2soKSk7XG4gIH1cblxuICBwYXJzZUV4cHJlc3Npb25TdGF0ZW1lbnQoKSB7XG4gICAgbGV0IGV4cHIgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgIHRoaXMuY29uc3VtZVNlbWljb2xvbigpO1xuICAgIHJldHVybiBuZXcgU2hpZnQuRXhwcmVzc2lvblN0YXRlbWVudChleHByKTtcbiAgfVxuXG4gIHBhcnNlQnJlYWtTdGF0ZW1lbnQoKSB7XG4gICAgbGV0IHRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkJSRUFLKTtcblxuICAgIC8vIENhdGNoIHRoZSB2ZXJ5IGNvbW1vbiBjYXNlIGZpcnN0OiBpbW1lZGlhdGVseSBhIHNlbWljb2xvbiAoVSswMDNCKS5cbiAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLlNFTUlDT0xPTikpIHtcbiAgICAgIGlmICghKHRoaXMuaW5JdGVyYXRpb24gfHwgdGhpcy5pblN3aXRjaCkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5JTExFR0FMX0JSRUFLKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5ldyBTaGlmdC5CcmVha1N0YXRlbWVudChudWxsKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQpIHtcbiAgICAgIGlmICghKHRoaXMuaW5JdGVyYXRpb24gfHwgdGhpcy5pblN3aXRjaCkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5JTExFR0FMX0JSRUFLKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5ldyBTaGlmdC5CcmVha1N0YXRlbWVudChudWxsKTtcbiAgICB9XG5cbiAgICBsZXQgbGFiZWwgPSBudWxsO1xuICAgIGlmICh0aGlzLmxvb2thaGVhZC50eXBlID09IFRva2VuVHlwZS5JREVOVElGSUVSKSB7XG4gICAgICBsYWJlbCA9IHRoaXMucGFyc2VWYXJpYWJsZUlkZW50aWZpZXIoKTtcblxuICAgICAgbGV0IGtleSA9IFwiJFwiICsgbGFiZWwubmFtZTtcbiAgICAgIGlmICghe30uaGFzT3duUHJvcGVydHkuY2FsbCh0aGlzLmxhYmVsU2V0LCBrZXkpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTktOT1dOX0xBQkVMLCBsYWJlbC5uYW1lKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmNvbnN1bWVTZW1pY29sb24oKTtcblxuICAgIGlmIChsYWJlbCA9PSBudWxsICYmICEodGhpcy5pbkl0ZXJhdGlvbiB8fCB0aGlzLmluU3dpdGNoKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5JTExFR0FMX0JSRUFLKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFNoaWZ0LkJyZWFrU3RhdGVtZW50KGxhYmVsKTtcbiAgfVxuXG4gIHBhcnNlQ29udGludWVTdGF0ZW1lbnQoKSB7XG4gICAgbGV0IHRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNPTlRJTlVFKTtcblxuICAgIC8vIENhdGNoIHRoZSB2ZXJ5IGNvbW1vbiBjYXNlIGZpcnN0OiBpbW1lZGlhdGVseSBhIHNlbWljb2xvbiAoVSswMDNCKS5cbiAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLlNFTUlDT0xPTikpIHtcbiAgICAgIGlmICghdGhpcy5pbkl0ZXJhdGlvbikge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLklMTEVHQUxfQ09OVElOVUUpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbmV3IFNoaWZ0LkNvbnRpbnVlU3RhdGVtZW50KG51bGwpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCkge1xuICAgICAgaWYgKCF0aGlzLmluSXRlcmF0aW9uKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuSUxMRUdBTF9DT05USU5VRSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuZXcgU2hpZnQuQ29udGludWVTdGF0ZW1lbnQobnVsbCk7XG4gICAgfVxuXG4gICAgbGV0IGxhYmVsID0gbnVsbDtcbiAgICBpZiAodGhpcy5sb29rYWhlYWQudHlwZSA9PSBUb2tlblR5cGUuSURFTlRJRklFUikge1xuICAgICAgbGFiZWwgPSB0aGlzLnBhcnNlVmFyaWFibGVJZGVudGlmaWVyKCk7XG5cbiAgICAgIGxldCBrZXkgPSBcIiRcIiArIGxhYmVsLm5hbWU7XG4gICAgICBpZiAoIXt9Lmhhc093blByb3BlcnR5LmNhbGwodGhpcy5sYWJlbFNldCwga2V5KSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5LTk9XTl9MQUJFTCwgbGFiZWwubmFtZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5jb25zdW1lU2VtaWNvbG9uKCk7XG4gICAgaWYgKCF0aGlzLmluSXRlcmF0aW9uKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLklMTEVHQUxfQ09OVElOVUUpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgU2hpZnQuQ29udGludWVTdGF0ZW1lbnQobGFiZWwpO1xuICB9XG5cblxuICBwYXJzZURlYnVnZ2VyU3RhdGVtZW50KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5ERUJVR0dFUik7XG4gICAgdGhpcy5jb25zdW1lU2VtaWNvbG9uKCk7XG4gICAgcmV0dXJuIG5ldyBTaGlmdC5EZWJ1Z2dlclN0YXRlbWVudDtcbiAgfVxuXG4gIHBhcnNlRG9XaGlsZVN0YXRlbWVudCgpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuRE8pO1xuICAgIGxldCBvbGRJbkl0ZXJhdGlvbiA9IHRoaXMuaW5JdGVyYXRpb247XG4gICAgdGhpcy5pbkl0ZXJhdGlvbiA9IHRydWU7XG5cbiAgICBsZXQgYm9keSA9IHRoaXMucGFyc2VTdGF0ZW1lbnQoKTtcbiAgICB0aGlzLmluSXRlcmF0aW9uID0gb2xkSW5JdGVyYXRpb247XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuV0hJTEUpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MUEFSRU4pO1xuICAgIGxldCB0ZXN0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcbiAgICB0aGlzLmVhdChUb2tlblR5cGUuU0VNSUNPTE9OKTtcblxuICAgIHJldHVybiBuZXcgU2hpZnQuRG9XaGlsZVN0YXRlbWVudChib2R5LCB0ZXN0KTtcbiAgfVxuXG4gIHN0YXRpYyB0cmFuc2Zvcm1EZXN0cnVjdHVyaW5nQXNzaWdubWVudChub2RlKSB7XG4gICAgc3dpdGNoIChub2RlLnR5cGUpIHtcbiAgICAgIGNhc2UgXCJPYmplY3RFeHByZXNzaW9uXCI6XG4gICAgICAgIHJldHVybiBjcExvYyhub2RlLCBuZXcgU2hpZnQuT2JqZWN0QmluZGluZyhcbiAgICAgICAgICBub2RlLnByb3BlcnRpZXMubWFwKFBhcnNlci50cmFuc2Zvcm1EZXN0cnVjdHVyaW5nQXNzaWdubWVudClcbiAgICAgICAgKSk7XG4gICAgICBjYXNlIFwiRGF0YVByb3BlcnR5XCI6XG4gICAgICAgIHJldHVybiBjcExvYyhub2RlLCBuZXcgU2hpZnQuQmluZGluZ1Byb3BlcnR5UHJvcGVydHkoXG4gICAgICAgICAgbm9kZS5uYW1lLFxuICAgICAgICAgIFBhcnNlci50cmFuc2Zvcm1EZXN0cnVjdHVyaW5nQXNzaWdubWVudChub2RlLmV4cHJlc3Npb24pXG4gICAgICAgICkpO1xuICAgICAgY2FzZSBcIlNob3J0aGFuZFByb3BlcnR5XCI6XG4gICAgICAgIHJldHVybiBjcExvYyhub2RlLCBuZXcgU2hpZnQuQmluZGluZ1Byb3BlcnR5SWRlbnRpZmllcihcbiAgICAgICAgICBjcExvYyhub2RlLCBuZXcgU2hpZnQuQmluZGluZ0lkZW50aWZpZXIobm9kZS5uYW1lKSksXG4gICAgICAgICAgbnVsbFxuICAgICAgICApKTtcbiAgICAgIGNhc2UgXCJBcnJheUV4cHJlc3Npb25cIjpcbiAgICAgICAgbGV0IGxhc3QgPSBub2RlLmVsZW1lbnRzW25vZGUuZWxlbWVudHMubGVuZ3RoIC0gMV07XG4gICAgICAgIGlmIChsYXN0ICE9IG51bGwgJiYgbGFzdC50eXBlID09PSBcIlNwcmVhZEVsZW1lbnRcIikge1xuICAgICAgICAgIHJldHVybiBjcExvYyhub2RlLCBuZXcgU2hpZnQuQXJyYXlCaW5kaW5nKFxuICAgICAgICAgICAgbm9kZS5lbGVtZW50cy5zbGljZSgwLCAtMSkubWFwKGUgPT4gZSAmJiBQYXJzZXIudHJhbnNmb3JtRGVzdHJ1Y3R1cmluZ0Fzc2lnbm1lbnQoZSkpLFxuICAgICAgICAgICAgY3BMb2MobGFzdC5leHByZXNzaW9uLCBuZXcgU2hpZnQuQmluZGluZ0lkZW50aWZpZXIobGFzdC5leHByZXNzaW9uLmlkZW50aWZpZXIpKVxuICAgICAgICAgICkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBjcExvYyhub2RlLCBuZXcgU2hpZnQuQXJyYXlCaW5kaW5nKFxuICAgICAgICAgICAgbm9kZS5lbGVtZW50cy5tYXAoZSA9PiBlICYmIFBhcnNlci50cmFuc2Zvcm1EZXN0cnVjdHVyaW5nQXNzaWdubWVudChlKSksXG4gICAgICAgICAgICBudWxsXG4gICAgICAgICAgKSk7XG4gICAgICAgIH1cbiAgICAgIGNhc2UgXCJBc3NpZ25tZW50RXhwcmVzc2lvblwiOlxuICAgICAgICByZXR1cm4gY3BMb2Mobm9kZSwgbmV3IFNoaWZ0LkJpbmRpbmdXaXRoRGVmYXVsdChcbiAgICAgICAgICBQYXJzZXIudHJhbnNmb3JtRGVzdHJ1Y3R1cmluZ0Fzc2lnbm1lbnQobm9kZS5iaW5kaW5nKSxcbiAgICAgICAgICBub2RlLmV4cHJlc3Npb25cbiAgICAgICAgKSk7XG4gICAgICBjYXNlIFwiSWRlbnRpZmllckV4cHJlc3Npb25cIjpcbiAgICAgICAgcmV0dXJuIGNwTG9jKG5vZGUsIG5ldyBTaGlmdC5CaW5kaW5nSWRlbnRpZmllcihub2RlLmlkZW50aWZpZXIpKTtcbiAgICB9XG4gICAgcmV0dXJuIG5vZGU7XG4gIH1cblxuICBzdGF0aWMgaXNEZXN0cnVjdHVyaW5nQXNzaWdubWVudFRhcmdldChub2RlKSB7XG4gICAgc3dpdGNoIChub2RlLnR5cGUpIHtcbiAgICAgIGNhc2UgXCJPYmplY3RFeHByZXNzaW9uXCI6XG4gICAgICAgIHJldHVybiBub2RlLnByb3BlcnRpZXMuZXZlcnkocCA9PlxuICAgICAgICAgIHAudHlwZSA9PT0gXCJCaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyXCIgfHxcbiAgICAgICAgICBwLnR5cGUgPT09IFwiU2hvcnRoYW5kUHJvcGVydHlcIiB8fFxuICAgICAgICAgIHAudHlwZSA9PT0gXCJEYXRhUHJvcGVydHlcIiAmJlxuICAgICAgICAgICAgUGFyc2VyLmlzRGVzdHJ1Y3R1cmluZ0Fzc2lnbm1lbnRUYXJnZXRXaXRoRGVmYXVsdChwLmV4cHJlc3Npb24pXG4gICAgICAgICk7XG4gICAgICBjYXNlIFwiQXJyYXlFeHByZXNzaW9uXCI6XG4gICAgICAgIGlmIChub2RlLmVsZW1lbnRzLmxlbmd0aCA9PT0gMClcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIGlmICghbm9kZS5lbGVtZW50cy5zbGljZSgwLCAtMSkuZmlsdGVyKGUgPT4gZSAhPSBudWxsKS5ldmVyeShQYXJzZXIuaXNEZXN0cnVjdHVyaW5nQXNzaWdubWVudFRhcmdldFdpdGhEZWZhdWx0KSlcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIGxldCBsYXN0ID0gbm9kZS5lbGVtZW50c1tub2RlLmVsZW1lbnRzLmxlbmd0aCAtIDFdO1xuICAgICAgICByZXR1cm4gbGFzdCAhPSBudWxsICYmIGxhc3QudHlwZSA9PT0gXCJTcHJlYWRFbGVtZW50XCJcbiAgICAgICAgICA/IGxhc3QuZXhwcmVzc2lvbi50eXBlID09PSBcIklkZW50aWZpZXJFeHByZXNzaW9uXCJcbiAgICAgICAgICA6IGxhc3QgPT0gbnVsbCB8fCBQYXJzZXIuaXNEZXN0cnVjdHVyaW5nQXNzaWdubWVudFRhcmdldFdpdGhEZWZhdWx0KGxhc3QpO1xuICAgICAgY2FzZSBcIkFycmF5QmluZGluZ1wiOlxuICAgICAgY2FzZSBcIkJpbmRpbmdJZGVudGlmaWVyXCI6XG4gICAgICBjYXNlIFwiQmluZGluZ1Byb3BlcnR5SWRlbnRpZmllclwiOlxuICAgICAgY2FzZSBcIkJpbmRpbmdQcm9wZXJ0eVByb3BlcnR5XCI6XG4gICAgICBjYXNlIFwiQmluZGluZ1dpdGhEZWZhdWx0XCI6XG4gICAgICBjYXNlIFwiSWRlbnRpZmllckV4cHJlc3Npb25cIjpcbiAgICAgIGNhc2UgXCJPYmplY3RCaW5kaW5nXCI6XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBzdGF0aWMgaXNEZXN0cnVjdHVyaW5nQXNzaWdubWVudFRhcmdldFdpdGhEZWZhdWx0KG5vZGUpIHtcbiAgICByZXR1cm4gUGFyc2VyLmlzRGVzdHJ1Y3R1cmluZ0Fzc2lnbm1lbnRUYXJnZXQobm9kZSkgfHxcbiAgICAgIG5vZGUudHlwZSA9PT0gXCJBc3NpZ25tZW50RXhwcmVzc2lvblwiICYmIG5vZGUub3BlcmF0b3IgPT09IFwiPVwiICYmXG4gICAgICBQYXJzZXIuaXNEZXN0cnVjdHVyaW5nQXNzaWdubWVudFRhcmdldChub2RlLmJpbmRpbmcpO1xuICB9XG5cbiAgc3RhdGljIGlzVmFsaWRTaW1wbGVBc3NpZ25tZW50VGFyZ2V0KG5vZGUpIHtcbiAgICBzd2l0Y2ggKG5vZGUudHlwZSkge1xuICAgICAgY2FzZSBcIklkZW50aWZpZXJFeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiQ29tcHV0ZWRNZW1iZXJFeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiU3RhdGljTWVtYmVyRXhwcmVzc2lvblwiOlxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgc3RhdGljIGJvdW5kTmFtZXMobm9kZSkge1xuICAgIHN3aXRjaChub2RlLnR5cGUpIHtcbiAgICAgIGNhc2UgXCJCaW5kaW5nSWRlbnRpZmllclwiOlxuICAgICAgICByZXR1cm4gW25vZGUuaWRlbnRpZmllci5uYW1lXTtcbiAgICAgIGNhc2UgXCJCaW5kaW5nV2l0aERlZmF1bHRcIjpcbiAgICAgICAgcmV0dXJuIFBhcnNlci5ib3VuZE5hbWVzKG5vZGUuYmluZGluZyk7XG4gICAgICBjYXNlIFwiQXJyYXlCaW5kaW5nXCI6IHtcbiAgICAgICAgbGV0IG5hbWVzID0gW107XG4gICAgICAgIG5vZGUuZWxlbWVudHMuZmlsdGVyKGUgPT4gZSAhPSBudWxsKS5mb3JFYWNoKGUgPT4gW10ucHVzaC5hcHBseShuYW1lcywgUGFyc2VyLmJvdW5kTmFtZXMoZSkpKTtcbiAgICAgICAgaWYgKG5vZGUucmVzdEVsZW1lbnQgIT0gbnVsbCkge1xuICAgICAgICAgIG5hbWVzLnB1c2gobm9kZS5yZXN0RWxlbWVudC5pZGVudGlmaWVyLm5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuYW1lcztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJPYmplY3RCaW5kaW5nXCI6IHtcbiAgICAgICAgbGV0IG5hbWVzID0gW107XG4gICAgICAgIG5vZGUucHJvcGVydGllcy5mb3JFYWNoKHAgPT4ge1xuICAgICAgICAgIHN3aXRjaCAocC50eXBlKSB7XG4gICAgICAgICAgICBjYXNlIFwiQmluZGluZ1Byb3BlcnR5SWRlbnRpZmllclwiOlxuICAgICAgICAgICAgICBuYW1lcy5wdXNoKHAuaWRlbnRpZmllci5pZGVudGlmaWVyLm5hbWUpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJCaW5kaW5nUHJvcGVydHlQcm9wZXJ0eVwiOlxuICAgICAgICAgICAgICBbXS5wdXNoLmFwcGx5KG5hbWVzLCBQYXJzZXIuYm91bmROYW1lcyhwLmJpbmRpbmcpKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAvLyBpc3RhbmJ1bCBpZ25vcmUgbmV4dFxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiYm91bmROYW1lcyBjYWxsZWQgb24gT2JqZWN0QmluZGluZyB3aXRoIGludmFsaWQgcHJvcGVydHk6IFwiICsgcC50eXBlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gbmFtZXM7XG4gICAgICB9XG4gICAgICBjYXNlIFwiQ29tcHV0ZWRNZW1iZXJFeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiU3RhdGljTWVtYmVyRXhwcmVzc2lvblwiOlxuICAgICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIC8vIGlzdGFuYnVsIGlnbm9yZSBuZXh0XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiYm91bmROYW1lcyBjYWxsZWQgb24gaW52YWxpZCBhc3NpZ25tZW50IHRhcmdldDogXCIgKyBub2RlLnR5cGUpO1xuICB9XG5cbiAgcGFyc2VGb3JTdGF0ZW1lbnQoKSB7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkZPUik7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgbGV0IHRlc3QgPSBudWxsO1xuICAgIGxldCByaWdodCA9IG51bGw7XG4gICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5TRU1JQ09MT04pKSB7XG4gICAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlNFTUlDT0xPTikpIHtcbiAgICAgICAgdGVzdCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICB9XG4gICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuU0VNSUNPTE9OKTtcbiAgICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuUlBBUkVOKSkge1xuICAgICAgICByaWdodCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbmV3IFNoaWZ0LkZvclN0YXRlbWVudChcbiAgICAgICAgICBudWxsLFxuICAgICAgICAgIHRlc3QsXG4gICAgICAgICAgcmlnaHQsXG4gICAgICAgICAgdGhpcy5nZXRJdGVyYXRvclN0YXRlbWVudEVwaWxvZ3VlKClcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5WQVIpIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLkxFVCkpIHtcbiAgICAgICAgbGV0IHByZXZpb3VzQWxsb3dJbiA9IHRoaXMuYWxsb3dJbjtcbiAgICAgICAgdGhpcy5hbGxvd0luID0gZmFsc2U7XG4gICAgICAgIGxldCBpbml0RGVjbCA9IHRoaXMucGFyc2VWYXJpYWJsZURlY2xhcmF0aW9uKCk7XG4gICAgICAgIHRoaXMuYWxsb3dJbiA9IHByZXZpb3VzQWxsb3dJbjtcblxuICAgICAgICBpZiAoaW5pdERlY2wuZGVjbGFyYXRvcnMubGVuZ3RoID09PSAxICYmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5JTikgfHwgdGhpcy5tYXRjaChUb2tlblR5cGUuT0YpKSkge1xuICAgICAgICAgIGxldCB0eXBlID0gdGhpcy5tYXRjaChUb2tlblR5cGUuSU4pID9cbiAgICAgICAgICAgIFNoaWZ0LkZvckluU3RhdGVtZW50IDogU2hpZnQuRm9yT2ZTdGF0ZW1lbnQ7XG4gICAgICAgICAgaWYgKGluaXREZWNsLmRlY2xhcmF0b3JzWzBdLmluaXQgIT0gbnVsbCkge1xuICAgICAgICAgICAgdGhyb3cgdHlwZSA9PSBTaGlmdC5Gb3JJblN0YXRlbWVudCA/XG4gICAgICAgICAgICAgIHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5JTlZBTElEX1ZBUl9JTklUX0ZPUl9JTikgOlxuICAgICAgICAgICAgICB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuSU5WQUxJRF9WQVJfSU5JVF9GT1JfT0YpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLmxleCgpO1xuICAgICAgICAgIHJpZ2h0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgICAgICByZXR1cm4gbmV3IHR5cGUoaW5pdERlY2wsIHJpZ2h0LCB0aGlzLmdldEl0ZXJhdG9yU3RhdGVtZW50RXBpbG9ndWUoKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlNFTUlDT0xPTik7XG4gICAgICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5TRU1JQ09MT04pKSB7XG4gICAgICAgICAgICB0ZXN0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlNFTUlDT0xPTik7XG4gICAgICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5SUEFSRU4pKSB7XG4gICAgICAgICAgICByaWdodCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBuZXcgU2hpZnQuRm9yU3RhdGVtZW50KGluaXREZWNsLCB0ZXN0LCByaWdodCwgdGhpcy5nZXRJdGVyYXRvclN0YXRlbWVudEVwaWxvZ3VlKCkpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsZXQgcHJldmlvdXNBbGxvd0luID0gdGhpcy5hbGxvd0luO1xuICAgICAgICB0aGlzLmFsbG93SW4gPSBmYWxzZTtcbiAgICAgICAgbGV0IGluaXQgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgICB0aGlzLmFsbG93SW4gPSBwcmV2aW91c0FsbG93SW47XG5cbiAgICAgICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLklOKSB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5PRikpIHtcbiAgICAgICAgICBpZiAoIVBhcnNlci5pc1ZhbGlkU2ltcGxlQXNzaWdubWVudFRhcmdldChpbml0KSkge1xuICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLklOVkFMSURfTEhTX0lOX0ZPUl9JTik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGV0IHR5cGUgPSB0aGlzLm1hdGNoKFRva2VuVHlwZS5JTikgP1xuICAgICAgICAgICAgU2hpZnQuRm9ySW5TdGF0ZW1lbnQgOiBTaGlmdC5Gb3JPZlN0YXRlbWVudDtcblxuICAgICAgICAgIHRoaXMubGV4KCk7XG4gICAgICAgICAgcmlnaHQgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuXG4gICAgICAgICAgcmV0dXJuIG5ldyB0eXBlKGluaXQsIHJpZ2h0LCB0aGlzLmdldEl0ZXJhdG9yU3RhdGVtZW50RXBpbG9ndWUoKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlNFTUlDT0xPTik7XG4gICAgICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5TRU1JQ09MT04pKSB7XG4gICAgICAgICAgICB0ZXN0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlNFTUlDT0xPTik7XG4gICAgICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5SUEFSRU4pKSB7XG4gICAgICAgICAgICByaWdodCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBuZXcgU2hpZnQuRm9yU3RhdGVtZW50KGluaXQsIHRlc3QsIHJpZ2h0LCB0aGlzLmdldEl0ZXJhdG9yU3RhdGVtZW50RXBpbG9ndWUoKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBnZXRJdGVyYXRvclN0YXRlbWVudEVwaWxvZ3VlKCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgIGxldCBvbGRJbkl0ZXJhdGlvbiA9IHRoaXMuaW5JdGVyYXRpb247XG4gICAgdGhpcy5pbkl0ZXJhdGlvbiA9IHRydWU7XG4gICAgbGV0IGJvZHkgPSB0aGlzLnBhcnNlU3RhdGVtZW50KCk7XG4gICAgdGhpcy5pbkl0ZXJhdGlvbiA9IG9sZEluSXRlcmF0aW9uO1xuICAgIHJldHVybiBib2R5O1xuICB9XG5cbiAgcGFyc2VJZlN0YXRlbWVudCgpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuSUYpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MUEFSRU4pO1xuICAgIGxldCB0ZXN0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgIGxldCBjb25zZXF1ZW50ID0gdGhpcy5wYXJzZVN0YXRlbWVudCgpO1xuICAgIGxldCBhbHRlcm5hdGUgPSBudWxsO1xuICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuRUxTRSkpIHtcbiAgICAgIGFsdGVybmF0ZSA9IHRoaXMucGFyc2VTdGF0ZW1lbnQoKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBTaGlmdC5JZlN0YXRlbWVudCh0ZXN0LCBjb25zZXF1ZW50LCBhbHRlcm5hdGUpO1xuICB9XG5cbiAgcGFyc2VSZXR1cm5TdGF0ZW1lbnQoKSB7XG4gICAgbGV0IGFyZ3VtZW50ID0gbnVsbDtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SRVRVUk4pO1xuICAgIGlmICghdGhpcy5pbkZ1bmN0aW9uQm9keSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLklMTEVHQUxfUkVUVVJOKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQpIHtcbiAgICAgIHJldHVybiBuZXcgU2hpZnQuUmV0dXJuU3RhdGVtZW50KG51bGwpO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuU0VNSUNPTE9OKSkge1xuICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0UpICYmICF0aGlzLmVvZigpKSB7XG4gICAgICAgIGFyZ3VtZW50ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmNvbnN1bWVTZW1pY29sb24oKTtcbiAgICByZXR1cm4gbmV3IFNoaWZ0LlJldHVyblN0YXRlbWVudChhcmd1bWVudCk7XG4gIH1cblxuICBwYXJzZVdpdGhTdGF0ZW1lbnQoKSB7XG4gICAgaWYgKHRoaXMuc3RyaWN0KSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX01PREVfV0lUSCk7XG4gICAgfVxuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLldJVEgpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MUEFSRU4pO1xuICAgIGxldCBvYmplY3QgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgIGxldCBib2R5ID0gdGhpcy5wYXJzZVN0YXRlbWVudCgpO1xuXG4gICAgcmV0dXJuIG5ldyBTaGlmdC5XaXRoU3RhdGVtZW50KG9iamVjdCwgYm9keSk7XG4gIH1cblxuICBwYXJzZVN3aXRjaFN0YXRlbWVudCgpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuU1dJVENIKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTFBBUkVOKTtcbiAgICBsZXQgZGlzY3JpbWluYW50ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTEJSQUNFKTtcblxuICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuUkJSQUNFKSkge1xuICAgICAgcmV0dXJuIG5ldyBTaGlmdC5Td2l0Y2hTdGF0ZW1lbnQoZGlzY3JpbWluYW50LCBbXSk7XG4gICAgfVxuICAgIGxldCBvbGRJblN3aXRjaCA9IHRoaXMuaW5Td2l0Y2g7XG4gICAgdGhpcy5pblN3aXRjaCA9IHRydWU7XG5cbiAgICBsZXQgY2FzZXMgPSB0aGlzLnBhcnNlU3dpdGNoQ2FzZXMoKTtcblxuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5ERUZBVUxUKSkge1xuICAgICAgbGV0IHN3aXRjaERlZmF1bHQgPSB0aGlzLnBhcnNlU3dpdGNoRGVmYXVsdCgpO1xuICAgICAgbGV0IHBvc3REZWZhdWx0Q2FzZXMgPSB0aGlzLnBhcnNlU3dpdGNoQ2FzZXMoKTtcbiAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5ERUZBVUxUKSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuTVVMVElQTEVfREVGQVVMVFNfSU5fU1dJVENIKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuaW5Td2l0Y2ggPSBvbGRJblN3aXRjaDtcbiAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SQlJBQ0UpO1xuICAgICAgcmV0dXJuIG5ldyBTaGlmdC5Td2l0Y2hTdGF0ZW1lbnRXaXRoRGVmYXVsdChkaXNjcmltaW5hbnQsIGNhc2VzLCBzd2l0Y2hEZWZhdWx0LCBwb3N0RGVmYXVsdENhc2VzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5pblN3aXRjaCA9IG9sZEluU3dpdGNoO1xuICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJCUkFDRSk7XG4gICAgICByZXR1cm4gbmV3IFNoaWZ0LlN3aXRjaFN0YXRlbWVudChkaXNjcmltaW5hbnQsIGNhc2VzKTtcbiAgICB9XG4gIH1cblxuICBwYXJzZVN3aXRjaENhc2VzKCkge1xuICAgIGxldCByZXN1bHQgPSBbXTtcbiAgICB3aGlsZSAoISh0aGlzLmVvZigpIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLlJCUkFDRSkgfHwgdGhpcy5tYXRjaChUb2tlblR5cGUuREVGQVVMVCkpKSB7XG4gICAgICByZXN1bHQucHVzaCh0aGlzLnBhcnNlU3dpdGNoQ2FzZSgpKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHBhcnNlU3dpdGNoQ2FzZSgpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuQ0FTRSk7XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5Td2l0Y2hDYXNlKHRoaXMucGFyc2VFeHByZXNzaW9uKCksIHRoaXMucGFyc2VTd2l0Y2hDYXNlQm9keSgpKSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZVN3aXRjaERlZmF1bHQoKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkRFRkFVTFQpO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuU3dpdGNoRGVmYXVsdCh0aGlzLnBhcnNlU3dpdGNoQ2FzZUJvZHkoKSksIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VTd2l0Y2hDYXNlQm9keSgpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuQ09MT04pO1xuICAgIHJldHVybiB0aGlzLnBhcnNlU3RhdGVtZW50TGlzdEluU3dpdGNoQ2FzZUJvZHkoKTtcbiAgfVxuXG4gIHBhcnNlU3RhdGVtZW50TGlzdEluU3dpdGNoQ2FzZUJvZHkoKSB7XG4gICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgIHdoaWxlICghKHRoaXMuZW9mKCkgfHwgdGhpcy5tYXRjaChUb2tlblR5cGUuUkJSQUNFKSB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5ERUZBVUxUKVxuICAgIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLkNBU0UpKSkge1xuICAgICAgcmVzdWx0LnB1c2godGhpcy5wYXJzZVN0YXRlbWVudCgpKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHBhcnNlVGhyb3dTdGF0ZW1lbnQoKSB7XG4gICAgbGV0IHRva2VuID0gdGhpcy5leHBlY3QoVG9rZW5UeXBlLlRIUk9XKTtcblxuICAgIGlmICh0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5ORVdMSU5FX0FGVEVSX1RIUk9XKTtcbiAgICB9XG5cbiAgICBsZXQgYXJndW1lbnQgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuXG4gICAgdGhpcy5jb25zdW1lU2VtaWNvbG9uKCk7XG5cbiAgICByZXR1cm4gbmV3IFNoaWZ0LlRocm93U3RhdGVtZW50KGFyZ3VtZW50KTtcbiAgfVxuXG4gIHBhcnNlVHJ5U3RhdGVtZW50KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5UUlkpO1xuICAgIGxldCBibG9jayA9IHRoaXMucGFyc2VCbG9jaygpO1xuXG4gICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkNBVENIKSkge1xuICAgICAgbGV0IGhhbmRsZXIgPSB0aGlzLnBhcnNlQ2F0Y2hDbGF1c2UoKTtcbiAgICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuRklOQUxMWSkpIHtcbiAgICAgICAgbGV0IGZpbmFsaXplciA9IHRoaXMucGFyc2VCbG9jaygpO1xuICAgICAgICByZXR1cm4gbmV3IFNoaWZ0LlRyeUZpbmFsbHlTdGF0ZW1lbnQoYmxvY2ssIGhhbmRsZXIsIGZpbmFsaXplcik7XG4gICAgICB9XG4gICAgICByZXR1cm4gbmV3IFNoaWZ0LlRyeUNhdGNoU3RhdGVtZW50KGJsb2NrLCBoYW5kbGVyKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLkZJTkFMTFkpKSB7XG4gICAgICBsZXQgZmluYWxpemVyID0gdGhpcy5wYXJzZUJsb2NrKCk7XG4gICAgICByZXR1cm4gbmV3IFNoaWZ0LlRyeUZpbmFsbHlTdGF0ZW1lbnQoYmxvY2ssIG51bGwsIGZpbmFsaXplcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5OT19DQVRDSF9PUl9GSU5BTExZKTtcbiAgICB9XG4gIH1cblxuICBwYXJzZVZhcmlhYmxlRGVjbGFyYXRpb25TdGF0ZW1lbnQoKSB7XG4gICAgbGV0IGRlY2xhcmF0aW9uID0gdGhpcy5wYXJzZVZhcmlhYmxlRGVjbGFyYXRpb24oKTtcbiAgICB0aGlzLmNvbnN1bWVTZW1pY29sb24oKTtcbiAgICByZXR1cm4gbmV3IFNoaWZ0LlZhcmlhYmxlRGVjbGFyYXRpb25TdGF0ZW1lbnQoZGVjbGFyYXRpb24pO1xuICB9XG5cbiAgcGFyc2VXaGlsZVN0YXRlbWVudCgpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuV0hJTEUpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MUEFSRU4pO1xuICAgIHJldHVybiBuZXcgU2hpZnQuV2hpbGVTdGF0ZW1lbnQodGhpcy5wYXJzZUV4cHJlc3Npb24oKSwgdGhpcy5nZXRJdGVyYXRvclN0YXRlbWVudEVwaWxvZ3VlKCkpO1xuICB9XG5cbiAgcGFyc2VDYXRjaENsYXVzZSgpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5DQVRDSCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgbGV0IHRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLlJQQVJFTikgfHwgdGhpcy5tYXRjaChUb2tlblR5cGUuTFBBUkVOKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRva2VuKTtcbiAgICB9XG5cbiAgICBsZXQgcGFyYW0gPSB0aGlzLnBhcnNlTGVmdEhhbmRTaWRlRXhwcmVzc2lvbigpO1xuXG4gICAgaWYgKCFQYXJzZXIuaXNEZXN0cnVjdHVyaW5nQXNzaWdubWVudFRhcmdldChwYXJhbSkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0b2tlbik7XG4gICAgfVxuICAgIHBhcmFtID0gUGFyc2VyLnRyYW5zZm9ybURlc3RydWN0dXJpbmdBc3NpZ25tZW50KHBhcmFtKTtcblxuICAgIGxldCBib3VuZCA9IFBhcnNlci5ib3VuZE5hbWVzKHBhcmFtKTtcbiAgICBpZiAoZmlyc3REdXBsaWNhdGUoYm91bmQpICE9IG51bGwpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuRFVQTElDQVRFX0JJTkRJTkcsIGZpcnN0RHVwbGljYXRlKGJvdW5kKSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuc3RyaWN0ICYmIGJvdW5kLnNvbWUoaXNSZXN0cmljdGVkV29yZCkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuU1RSSUNUX0NBVENIX1ZBUklBQkxFKTtcbiAgICB9XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcblxuICAgIGxldCBib2R5ID0gdGhpcy5wYXJzZUJsb2NrKCk7XG5cbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkNhdGNoQ2xhdXNlKHBhcmFtLCBib2R5KSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZUJsb2NrKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MQlJBQ0UpO1xuXG4gICAgbGV0IGJvZHkgPSBbXTtcbiAgICB3aGlsZSAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJCUkFDRSkpIHtcbiAgICAgIGJvZHkucHVzaCh0aGlzLnBhcnNlU3RhdGVtZW50KCkpO1xuICAgIH1cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUkJSQUNFKTtcblxuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQmxvY2soYm9keSksIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VWYXJpYWJsZURlY2xhcmF0aW9uKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCB0b2tlbiA9IHRoaXMubGV4KCk7XG5cbiAgICAvLyBQcmVjZWRlZCBieSB0aGlzLm1hdGNoKFRva2VuU3ViVHlwZS5WQVIpIHx8IHRoaXMubWF0Y2goVG9rZW5TdWJUeXBlLkxFVCk7XG4gICAgbGV0IGtpbmQgPSB0b2tlbi50eXBlID09IFRva2VuVHlwZS5WQVIgPyBcInZhclwiIDogdG9rZW4udHlwZSA9PT0gVG9rZW5UeXBlLkNPTlNUID8gXCJjb25zdFwiIDogXCJsZXRcIjtcbiAgICBsZXQgZGVjbGFyYXRvcnMgPSB0aGlzLnBhcnNlVmFyaWFibGVEZWNsYXJhdG9yTGlzdChraW5kKTtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlZhcmlhYmxlRGVjbGFyYXRpb24oa2luZCwgZGVjbGFyYXRvcnMpLCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlVmFyaWFibGVEZWNsYXJhdG9yTGlzdChraW5kKSB7XG4gICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICByZXN1bHQucHVzaCh0aGlzLnBhcnNlVmFyaWFibGVEZWNsYXJhdG9yKGtpbmQpKTtcbiAgICAgIGlmICghdGhpcy5lYXQoVG9rZW5UeXBlLkNPTU1BKSkge1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHBhcnNlVmFyaWFibGVEZWNsYXJhdG9yKGtpbmQpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcblxuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5MUEFSRU4pKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuICAgIH1cbiAgICBsZXQgaWQgPSB0aGlzLnBhcnNlTGVmdEhhbmRTaWRlRXhwcmVzc2lvbigpO1xuXG4gICAgaWYgKCFQYXJzZXIuaXNEZXN0cnVjdHVyaW5nQXNzaWdubWVudFRhcmdldChpZCkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0b2tlbik7XG4gICAgfVxuICAgIGlkID0gUGFyc2VyLnRyYW5zZm9ybURlc3RydWN0dXJpbmdBc3NpZ25tZW50KGlkKTtcblxuICAgIGxldCBib3VuZCA9IFBhcnNlci5ib3VuZE5hbWVzKGlkKTtcbiAgICBpZiAoZmlyc3REdXBsaWNhdGUoYm91bmQpICE9IG51bGwpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuRFVQTElDQVRFX0JJTkRJTkcsIGZpcnN0RHVwbGljYXRlKGJvdW5kKSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuc3RyaWN0ICYmIGJvdW5kLnNvbWUoaXNSZXN0cmljdGVkV29yZCkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuU1RSSUNUX1ZBUl9OQU1FKTtcbiAgICB9XG5cbiAgICBsZXQgaW5pdCA9IG51bGw7XG4gICAgaWYgKGtpbmQgPT0gXCJjb25zdFwiKSB7XG4gICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuQVNTSUdOKTtcbiAgICAgIGluaXQgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5BU1NJR04pKSB7XG4gICAgICBpbml0ID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuVmFyaWFibGVEZWNsYXJhdG9yKGlkLCBpbml0KSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZUV4cHJlc3Npb24oKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICBsZXQgZXhwciA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuXG4gICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkNPTU1BKSkge1xuICAgICAgd2hpbGUgKCF0aGlzLmVvZigpKSB7XG4gICAgICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuQ09NTUEpKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5sZXgoKTtcbiAgICAgICAgZXhwciA9IHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5CaW5hcnlFeHByZXNzaW9uKFwiLFwiLCBleHByLCB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKSksXG4gICAgICAgICAgICBzdGFydExvY2F0aW9uKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGV4cHI7XG4gIH1cblxuICBwYXJzZUFycm93RXhwcmVzc2lvblRhaWwoaGVhZCwgc3RhcnRMb2NhdGlvbikge1xuICAgIGxldCBhcnJvdyA9IHRoaXMuZXhwZWN0KFRva2VuVHlwZS5BUlJPVyk7XG5cbiAgICAvLyBDb252ZXJ0IHBhcmFtIGxpc3QuXG4gICAgbGV0IHtwYXJhbXMgPSBudWxsLCByZXN0ID0gbnVsbCwgZHVwID0gbnVsbCwgc3RyaWN0X3Jlc2VydmVkX3dvcmQgPSBmYWxzZSwgc3RyaWN0X3Jlc3RyaWN0ZWRfd29yZCA9IGZhbHNlfSA9IGhlYWQ7XG4gICAgaWYgKGhlYWQudHlwZSAhPT0gQVJST1dfRVhQUkVTU0lPTl9QQVJBTVMpIHtcbiAgICAgIGlmIChoZWFkLnR5cGUgPT09IFwiSWRlbnRpZmllckV4cHJlc3Npb25cIikge1xuICAgICAgICBsZXQgbmFtZSA9IGhlYWQuaWRlbnRpZmllci5uYW1lO1xuICAgICAgICBpZiAoU1RSSUNUX01PREVfUkVTRVJWRURfV09SRC5oYXNPd25Qcm9wZXJ0eShuYW1lKSkge1xuICAgICAgICAgIHN0cmljdF9yZXNlcnZlZF93b3JkID0gdHJ1ZTtcbiAgICAgICAgICBpZiAodGhpcy5zdHJpY3QpIHtcbiAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUkVTRVJWRURfV09SRCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChpc1Jlc3RyaWN0ZWRXb3JkKG5hbWUpKSB7XG4gICAgICAgICAgc3RyaWN0X3Jlc3RyaWN0ZWRfd29yZCA9IHRydWU7XG4gICAgICAgICAgaWYgKHRoaXMuc3RyaWN0KSB7XG4gICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX1BBUkFNX05BTUUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBoZWFkID0gUGFyc2VyLnRyYW5zZm9ybURlc3RydWN0dXJpbmdBc3NpZ25tZW50KGhlYWQpO1xuICAgICAgICBwYXJhbXMgPSBbaGVhZF07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQoYXJyb3cpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuTEJSQUNFKSkge1xuICAgICAgbGV0IFtib2R5LCBpc1N0cmljdF0gPSB0aGlzLnBhcnNlQm9keSgpO1xuICAgICAgaWYgKGlzU3RyaWN0KSB7XG4gICAgICAgIGlmIChkdXApIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX1BBUkFNX0RVUEUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdHJpY3RfcmVzZXJ2ZWRfd29yZCkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUkVTRVJWRURfV09SRCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0cmljdF9yZXN0cmljdGVkX3dvcmQpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX1BBUkFNX05BTUUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUkJSQUNFKTtcbiAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQXJyb3dFeHByZXNzaW9uKHBhcmFtcywgcmVzdCwgYm9keSksIHN0YXJ0TG9jYXRpb24pO1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgYm9keSA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5BcnJvd0V4cHJlc3Npb24ocGFyYW1zLCByZXN0LCBib2R5KSwgc3RhcnRMb2NhdGlvbik7XG4gICAgfVxuICB9XG5cbiAgcGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpIHtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcblxuICAgIGxldCBub2RlID0gdGhpcy5wYXJzZUNvbmRpdGlvbmFsRXhwcmVzc2lvbigpO1xuXG4gICAgaWYgKCF0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCAmJiB0aGlzLm1hdGNoKFRva2VuVHlwZS5BUlJPVykpIHtcbiAgICAgIHJldHVybiB0aGlzLnBhcnNlQXJyb3dFeHByZXNzaW9uVGFpbChub2RlLCBzdGFydExvY2F0aW9uKVxuICAgIH1cblxuICAgIGxldCBpc09wZXJhdG9yID0gZmFsc2U7XG4gICAgbGV0IG9wZXJhdG9yID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgc3dpdGNoIChvcGVyYXRvci50eXBlKSB7XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR046XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fQklUX09SOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX0JJVF9YT1I6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fQklUX0FORDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9TSEw6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fU0hSOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX1NIUl9VTlNJR05FRDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9BREQ6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fU1VCOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX01VTDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9ESVY6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fTU9EOlxuICAgICAgICBpc09wZXJhdG9yID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgaWYgKGlzT3BlcmF0b3IpIHtcbiAgICAgIGlmICghUGFyc2VyLmlzRGVzdHJ1Y3R1cmluZ0Fzc2lnbm1lbnRUYXJnZXQobm9kZSkgJiYgbm9kZS50eXBlICE9PSBcIkNvbXB1dGVkTWVtYmVyRXhwcmVzc2lvblwiICYmIG5vZGUudHlwZSAhPT0gXCJTdGF0aWNNZW1iZXJFeHByZXNzaW9uXCIpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLklOVkFMSURfTEhTX0lOX0FTU0lHTk1FTlQpO1xuICAgICAgfVxuICAgICAgbm9kZSA9IFBhcnNlci50cmFuc2Zvcm1EZXN0cnVjdHVyaW5nQXNzaWdubWVudChub2RlKTtcblxuICAgICAgbGV0IGJvdW5kID0gUGFyc2VyLmJvdW5kTmFtZXMobm9kZSk7XG4gICAgICBpZiAoZmlyc3REdXBsaWNhdGUoYm91bmQpICE9IG51bGwpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5EVVBMSUNBVEVfQklORElORywgZmlyc3REdXBsaWNhdGUoYm91bmQpKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuc3RyaWN0ICYmIGJvdW5kLnNvbWUoaXNSZXN0cmljdGVkV29yZCkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5TVFJJQ1RfTEhTX0FTU0lHTk1FTlQpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmxleCgpO1xuICAgICAgbGV0IHJpZ2h0ID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkFzc2lnbm1lbnRFeHByZXNzaW9uKG9wZXJhdG9yLnR5cGUubmFtZSwgbm9kZSwgcmlnaHQpLCBzdGFydExvY2F0aW9uKTtcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICBub2RlLnR5cGUgPT09IFwiT2JqZWN0RXhwcmVzc2lvblwiICYmXG4gICAgICBub2RlLnByb3BlcnRpZXMuc29tZShwID0+IHAudHlwZSA9PT0gXCJCaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyXCIpXG4gICAgKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQob3BlcmF0b3IpO1xuICAgIH1cblxuICAgIHJldHVybiBub2RlO1xuICB9XG5cbiAgcGFyc2VDb25kaXRpb25hbEV4cHJlc3Npb24oKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IGV4cHIgPSB0aGlzLnBhcnNlQmluYXJ5RXhwcmVzc2lvbigpO1xuICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuQ09ORElUSU9OQUwpKSB7XG4gICAgICBsZXQgcHJldmlvdXNBbGxvd0luID0gdGhpcy5hbGxvd0luO1xuICAgICAgdGhpcy5hbGxvd0luID0gdHJ1ZTtcbiAgICAgIGxldCBjb25zZXF1ZW50ID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgICB0aGlzLmFsbG93SW4gPSBwcmV2aW91c0FsbG93SW47XG4gICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuQ09MT04pO1xuICAgICAgbGV0IGFsdGVybmF0ZSA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5Db25kaXRpb25hbEV4cHJlc3Npb24oZXhwciwgY29uc2VxdWVudCwgYWx0ZXJuYXRlKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgfVxuXG4gICAgcmV0dXJuIGV4cHI7XG4gIH1cblxuICBpc0JpbmFyeU9wZXJhdG9yKHR5cGUpIHtcbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk9SOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQU5EOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQklUX09SOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQklUX1hPUjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkJJVF9BTkQ6XG4gICAgICBjYXNlIFRva2VuVHlwZS5FUTpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk5FOlxuICAgICAgY2FzZSBUb2tlblR5cGUuRVFfU1RSSUNUOlxuICAgICAgY2FzZSBUb2tlblR5cGUuTkVfU1RSSUNUOlxuICAgICAgY2FzZSBUb2tlblR5cGUuTFQ6XG4gICAgICBjYXNlIFRva2VuVHlwZS5HVDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkxURTpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkdURTpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLklOU1RBTkNFT0Y6XG4gICAgICBjYXNlIFRva2VuVHlwZS5TSEw6XG4gICAgICBjYXNlIFRva2VuVHlwZS5TSFI6XG4gICAgICBjYXNlIFRva2VuVHlwZS5TSFJfVU5TSUdORUQ6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BREQ6XG4gICAgICBjYXNlIFRva2VuVHlwZS5TVUI6XG4gICAgICBjYXNlIFRva2VuVHlwZS5NVUw6XG4gICAgICBjYXNlIFRva2VuVHlwZS5ESVY6XG4gICAgICBjYXNlIFRva2VuVHlwZS5NT0Q6XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgY2FzZSBUb2tlblR5cGUuSU46XG4gICAgICAgIHJldHVybiB0aGlzLmFsbG93SW47XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgcGFyc2VCaW5hcnlFeHByZXNzaW9uKCkge1xuICAgIGxldCBsb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgbGVmdCA9IHRoaXMucGFyc2VVbmFyeUV4cHJlc3Npb24oKTtcbiAgICBsZXQgb3BlcmF0b3IgPSB0aGlzLmxvb2thaGVhZC50eXBlO1xuXG4gICAgbGV0IGlzQmluYXJ5T3BlcmF0b3IgPSB0aGlzLmlzQmluYXJ5T3BlcmF0b3Iob3BlcmF0b3IpO1xuICAgIGlmICghaXNCaW5hcnlPcGVyYXRvcikge1xuICAgICAgcmV0dXJuIGxlZnQ7XG4gICAgfVxuXG4gICAgdGhpcy5sZXgoKTtcbiAgICBsZXQgc3RhY2sgPSBbXTtcbiAgICBzdGFjay5wdXNoKHtsb2NhdGlvbiwgbGVmdCwgb3BlcmF0b3IsIHByZWNlZGVuY2U6IEJpbmFyeVByZWNlZGVuY2Vbb3BlcmF0b3IubmFtZV19KTtcbiAgICBsb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgcmlnaHQgPSB0aGlzLnBhcnNlVW5hcnlFeHByZXNzaW9uKCk7XG5cbiAgICBvcGVyYXRvciA9IHRoaXMubG9va2FoZWFkLnR5cGU7XG4gICAgaXNCaW5hcnlPcGVyYXRvciA9IHRoaXMuaXNCaW5hcnlPcGVyYXRvcih0aGlzLmxvb2thaGVhZC50eXBlKTtcbiAgICB3aGlsZSAoaXNCaW5hcnlPcGVyYXRvcikge1xuICAgICAgbGV0IHByZWNlZGVuY2UgPSBCaW5hcnlQcmVjZWRlbmNlW29wZXJhdG9yLm5hbWVdO1xuICAgICAgLy8gUmVkdWNlOiBtYWtlIGEgYmluYXJ5IGV4cHJlc3Npb24gZnJvbSB0aGUgdGhyZWUgdG9wbW9zdCBlbnRyaWVzLlxuICAgICAgd2hpbGUgKHN0YWNrLmxlbmd0aCAmJiAocHJlY2VkZW5jZSA8PSBzdGFja1tzdGFjay5sZW5ndGggLSAxXS5wcmVjZWRlbmNlKSkge1xuICAgICAgICBsZXQgc3RhY2tJdGVtID0gc3RhY2tbc3RhY2subGVuZ3RoIC0gMV07XG4gICAgICAgIGxldCBzdGFja09wZXJhdG9yID0gc3RhY2tJdGVtLm9wZXJhdG9yO1xuICAgICAgICBsZWZ0ID0gc3RhY2tJdGVtLmxlZnQ7XG4gICAgICAgIHN0YWNrLnBvcCgpO1xuICAgICAgICBsb2NhdGlvbiA9IHN0YWNrSXRlbS5sb2NhdGlvbjtcbiAgICAgICAgcmlnaHQgPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQmluYXJ5RXhwcmVzc2lvbihzdGFja09wZXJhdG9yLm5hbWUsIGxlZnQsIHJpZ2h0KSwgbG9jYXRpb24pO1xuICAgICAgfVxuXG4gICAgICAvLyBTaGlmdC5cbiAgICAgIHRoaXMubGV4KCk7XG4gICAgICBzdGFjay5wdXNoKHtsb2NhdGlvbiwgbGVmdDogcmlnaHQsIG9wZXJhdG9yLCBwcmVjZWRlbmNlfSk7XG4gICAgICBsb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICAgIHJpZ2h0ID0gdGhpcy5wYXJzZVVuYXJ5RXhwcmVzc2lvbigpO1xuXG4gICAgICBvcGVyYXRvciA9IHRoaXMubG9va2FoZWFkLnR5cGU7XG4gICAgICBpc0JpbmFyeU9wZXJhdG9yID0gdGhpcy5pc0JpbmFyeU9wZXJhdG9yKG9wZXJhdG9yKTtcbiAgICB9XG5cbiAgICAvLyBGaW5hbCByZWR1Y2UgdG8gY2xlYW4tdXAgdGhlIHN0YWNrLlxuICAgIHJldHVybiBzdGFjay5yZWR1Y2VSaWdodCgoZXhwciwgc3RhY2tJdGVtKSA9PlxuICAgICAgdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkJpbmFyeUV4cHJlc3Npb24oc3RhY2tJdGVtLm9wZXJhdG9yLm5hbWUsIHN0YWNrSXRlbS5sZWZ0LCBleHByKSwgc3RhY2tJdGVtLmxvY2F0aW9uKSxcbiAgICAgIHJpZ2h0KTtcbiAgfVxuXG4gIHN0YXRpYyBpc1ByZWZpeE9wZXJhdG9yKHR5cGUpIHtcbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLklOQzpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkRFQzpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFERDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlNVQjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkJJVF9OT1Q6XG4gICAgICBjYXNlIFRva2VuVHlwZS5OT1Q6XG4gICAgICBjYXNlIFRva2VuVHlwZS5ERUxFVEU6XG4gICAgICBjYXNlIFRva2VuVHlwZS5WT0lEOlxuICAgICAgY2FzZSBUb2tlblR5cGUuVFlQRU9GOlxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcGFyc2VVbmFyeUV4cHJlc3Npb24oKSB7XG4gICAgaWYgKHRoaXMubG9va2FoZWFkLnR5cGUua2xhc3MgIT0gVG9rZW5DbGFzcy5QdW5jdHVhdG9yICYmIHRoaXMubG9va2FoZWFkLnR5cGUua2xhc3MgIT0gVG9rZW5DbGFzcy5LZXl3b3JkKSB7XG4gICAgICByZXR1cm4gdGhpcy5wYXJzZVBvc3RmaXhFeHByZXNzaW9uKCk7XG4gICAgfVxuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCBvcGVyYXRvciA9IHRoaXMubG9va2FoZWFkO1xuICAgIGlmICghUGFyc2VyLmlzUHJlZml4T3BlcmF0b3Iob3BlcmF0b3IudHlwZSkpIHtcbiAgICAgIHJldHVybiB0aGlzLnBhcnNlUG9zdGZpeEV4cHJlc3Npb24oKTtcbiAgICB9XG4gICAgdGhpcy5sZXgoKTtcbiAgICBsZXQgZXhwciA9IHRoaXMucGFyc2VVbmFyeUV4cHJlc3Npb24oKTtcbiAgICBzd2l0Y2ggKG9wZXJhdG9yLnR5cGUpIHtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLklOQzpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkRFQzpcbiAgICAgICAgLy8gMTEuNC40LCAxMS40LjU7XG4gICAgICAgIGlmIChleHByLnR5cGUgPT09IFwiSWRlbnRpZmllckV4cHJlc3Npb25cIikge1xuICAgICAgICAgIGlmICh0aGlzLnN0cmljdCAmJiBpc1Jlc3RyaWN0ZWRXb3JkKGV4cHIuaWRlbnRpZmllci5uYW1lKSkge1xuICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlNUUklDVF9MSFNfUFJFRklYKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIVBhcnNlci5pc1ZhbGlkU2ltcGxlQXNzaWdubWVudFRhcmdldChleHByKSkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5JTlZBTElEX0xIU19JTl9BU1NJR05NRU5UKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkRFTEVURTpcbiAgICAgICAgaWYgKGV4cHIudHlwZSA9PT0gXCJJZGVudGlmaWVyRXhwcmVzc2lvblwiICYmIHRoaXMuc3RyaWN0KSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlNUUklDVF9ERUxFVEUpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5QcmVmaXhFeHByZXNzaW9uKG9wZXJhdG9yLnZhbHVlLCBleHByKSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZVBvc3RmaXhFeHByZXNzaW9uKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuXG4gICAgbGV0IGV4cHIgPSB0aGlzLnBhcnNlTGVmdEhhbmRTaWRlRXhwcmVzc2lvbkFsbG93Q2FsbCgpO1xuXG4gICAgaWYgKHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0KSB7XG4gICAgICByZXR1cm4gZXhwcjtcbiAgICB9XG5cbiAgICBsZXQgb3BlcmF0b3IgPSB0aGlzLmxvb2thaGVhZDtcbiAgICBpZiAoKG9wZXJhdG9yLnR5cGUgIT09IFRva2VuVHlwZS5JTkMpICYmIChvcGVyYXRvci50eXBlICE9PSBUb2tlblR5cGUuREVDKSkge1xuICAgICAgcmV0dXJuIGV4cHI7XG4gICAgfVxuICAgIHRoaXMubGV4KCk7XG4gICAgLy8gMTEuMy4xLCAxMS4zLjI7XG4gICAgaWYgKGV4cHIudHlwZSA9PT0gXCJJZGVudGlmaWVyRXhwcmVzc2lvblwiKSB7XG4gICAgICBpZiAodGhpcy5zdHJpY3QgJiYgaXNSZXN0cmljdGVkV29yZChleHByLmlkZW50aWZpZXIubmFtZSkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlNUUklDVF9MSFNfUE9TVEZJWCk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghUGFyc2VyLmlzVmFsaWRTaW1wbGVBc3NpZ25tZW50VGFyZ2V0KGV4cHIpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuSU5WQUxJRF9MSFNfSU5fQVNTSUdOTUVOVCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuUG9zdGZpeEV4cHJlc3Npb24oZXhwciwgb3BlcmF0b3IudmFsdWUpLCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlTGVmdEhhbmRTaWRlRXhwcmVzc2lvbkFsbG93Q2FsbCgpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgcHJldmlvdXNBbGxvd0luID0gdGhpcy5hbGxvd0luO1xuICAgIHRoaXMuYWxsb3dJbiA9IHRydWU7XG4gICAgbGV0IGV4cHIgPSB0aGlzLm1hdGNoKFRva2VuVHlwZS5ORVcpID8gdGhpcy5wYXJzZU5ld0V4cHJlc3Npb24oKSA6IHRoaXMucGFyc2VQcmltYXJ5RXhwcmVzc2lvbigpO1xuXG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5MUEFSRU4pKSB7XG4gICAgICAgIGV4cHIgPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQ2FsbEV4cHJlc3Npb24oZXhwciwgdGhpcy5wYXJzZUFyZ3VtZW50TGlzdCgpKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkxCUkFDSykpIHtcbiAgICAgICAgZXhwciA9IHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5Db21wdXRlZE1lbWJlckV4cHJlc3Npb24oZXhwciwgdGhpcy5wYXJzZUNvbXB1dGVkTWVtYmVyKCkpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuUEVSSU9EKSkge1xuICAgICAgICBleHByID0gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlN0YXRpY01lbWJlckV4cHJlc3Npb24oZXhwciwgdGhpcy5wYXJzZU5vbkNvbXB1dGVkTWVtYmVyKCkpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuYWxsb3dJbiA9IHByZXZpb3VzQWxsb3dJbjtcblxuICAgIHJldHVybiBleHByO1xuICB9XG5cbiAgcGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuXG4gICAgbGV0IGV4cHIgPSB0aGlzLm1hdGNoKFRva2VuVHlwZS5ORVcpID8gdGhpcy5wYXJzZU5ld0V4cHJlc3Npb24oKSA6IHRoaXMucGFyc2VQcmltYXJ5RXhwcmVzc2lvbigpO1xuXG4gICAgd2hpbGUgKHRoaXMubWF0Y2goVG9rZW5UeXBlLlBFUklPRCkgfHwgdGhpcy5tYXRjaChUb2tlblR5cGUuTEJSQUNLKSkge1xuICAgICAgZXhwciA9IHRoaXMubWFya0xvY2F0aW9uKFxuICAgICAgICAgIHRoaXMubWF0Y2goVG9rZW5UeXBlLkxCUkFDSykgP1xuICAgICAgICAgICAgICBuZXcgU2hpZnQuQ29tcHV0ZWRNZW1iZXJFeHByZXNzaW9uKGV4cHIsIHRoaXMucGFyc2VDb21wdXRlZE1lbWJlcigpKSA6XG4gICAgICAgICAgICAgIG5ldyBTaGlmdC5TdGF0aWNNZW1iZXJFeHByZXNzaW9uKGV4cHIsIHRoaXMucGFyc2VOb25Db21wdXRlZE1lbWJlcigpKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgfVxuXG4gICAgcmV0dXJuIGV4cHI7XG4gIH1cblxuICBwYXJzZU5vbkNvbXB1dGVkTWVtYmVyKCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5QRVJJT0QpO1xuICAgIGlmICghdGhpcy5sb29rYWhlYWQudHlwZS5rbGFzcy5pc0lkZW50aWZpZXJOYW1lKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5sZXgoKS52YWx1ZTtcbiAgICB9XG4gIH1cblxuICBwYXJzZUNvbXB1dGVkTWVtYmVyKCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MQlJBQ0spO1xuICAgIGxldCBleHByID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUkJSQUNLKTtcbiAgICByZXR1cm4gZXhwcjtcbiAgfVxuXG4gIHBhcnNlTmV3RXhwcmVzc2lvbigpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTkVXKTtcbiAgICBsZXQgY2FsbGVlID0gdGhpcy5wYXJzZUxlZnRIYW5kU2lkZUV4cHJlc3Npb24oKTtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0Lk5ld0V4cHJlc3Npb24oY2FsbGVlLCB0aGlzLm1hdGNoKFRva2VuVHlwZS5MUEFSRU4pID8gdGhpcy5wYXJzZUFyZ3VtZW50TGlzdCgpIDpcbiAgICAgICAgW10pLCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlUHJpbWFyeUV4cHJlc3Npb24oKSB7XG4gICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkxQQVJFTikpIHtcbiAgICAgIHJldHVybiB0aGlzLnBhcnNlR3JvdXBFeHByZXNzaW9uKCk7XG4gICAgfVxuXG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICBzd2l0Y2ggKHRoaXMubG9va2FoZWFkLnR5cGUpIHtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLklERU5USUZJRVI6XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuSWRlbnRpZmllckV4cHJlc3Npb24odGhpcy5wYXJzZUlkZW50aWZpZXIoKSksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgY2FzZSBUb2tlblR5cGUuU1RSSU5HOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZVN0cmluZ0xpdGVyYWwoKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk5VTUJFUjpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VOdW1lcmljTGl0ZXJhbCgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuVEhJUzpcbiAgICAgICAgdGhpcy5sZXgoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5UaGlzRXhwcmVzc2lvbiwgc3RhcnRMb2NhdGlvbik7XG4gICAgICBjYXNlIFRva2VuVHlwZS5GVU5DVElPTjpcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHRoaXMucGFyc2VGdW5jdGlvbih0cnVlKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICBjYXNlIFRva2VuVHlwZS5UUlVFOlxuICAgICAgICB0aGlzLmxleCgpO1xuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkxpdGVyYWxCb29sZWFuRXhwcmVzc2lvbih0cnVlKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICBjYXNlIFRva2VuVHlwZS5GQUxTRTpcbiAgICAgICAgdGhpcy5sZXgoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5MaXRlcmFsQm9vbGVhbkV4cHJlc3Npb24oZmFsc2UpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk5VTEw6XG4gICAgICAgIHRoaXMubGV4KCk7XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuTGl0ZXJhbE51bGxFeHByZXNzaW9uLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkxCUkFDSzpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VBcnJheUV4cHJlc3Npb24oKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkxCUkFDRTpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VPYmplY3RFeHByZXNzaW9uKCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5ESVY6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fRElWOlxuICAgICAgICB0aGlzLmxvb2thaGVhZCA9IHRoaXMuc2NhblJlZ0V4cCh0aGlzLmxvb2thaGVhZC50eXBlID09PSBUb2tlblR5cGUuRElWID8gXCIvXCIgOiBcIi89XCIpO1xuICAgICAgICBsZXQgdG9rZW4gPSB0aGlzLmxleCgpO1xuICAgICAgICBsZXQgbGFzdFNsYXNoID0gdG9rZW4udmFsdWUubGFzdEluZGV4T2YoXCIvXCIpO1xuICAgICAgICBsZXQgcGF0dGVybiA9IHRva2VuLnZhbHVlLnNsaWNlKDEsIGxhc3RTbGFzaCkucmVwbGFjZShcIlxcXFwvXCIsIFwiL1wiKTtcbiAgICAgICAgbGV0IGZsYWdzID0gdG9rZW4udmFsdWUuc2xpY2UobGFzdFNsYXNoICsgMSk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgUmVnRXhwKHBhdHRlcm4sIGZsYWdzKTtcbiAgICAgICAgfSBjYXRjaCAodW51c2VkKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5JTlZBTElEX1JFR1VMQVJfRVhQUkVTU0lPTik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5MaXRlcmFsUmVnRXhwRXhwcmVzc2lvbihwYXR0ZXJuLCBmbGFncyksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgY2FzZSBUb2tlblR5cGUuQ0xBU1M6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlQ2xhc3ModHJ1ZSk7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sZXgoKSk7XG4gICAgfVxuICB9XG5cbiAgcGFyc2VOdW1lcmljTGl0ZXJhbCgpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBpZiAodGhpcy5zdHJpY3QgJiYgdGhpcy5sb29rYWhlYWQub2N0YWwpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odGhpcy5sb29rYWhlYWQsIEVycm9yTWVzc2FnZXMuU1RSSUNUX09DVEFMX0xJVEVSQUwpO1xuICAgIH1cbiAgICBsZXQgdG9rZW4yID0gdGhpcy5sZXgoKTtcbiAgICBsZXQgbm9kZSA9IHRva2VuMi5fdmFsdWUgPT09IDEvMFxuICAgICAgPyBuZXcgU2hpZnQuTGl0ZXJhbEluZmluaXR5RXhwcmVzc2lvblxuICAgICAgOiBuZXcgU2hpZnQuTGl0ZXJhbE51bWVyaWNFeHByZXNzaW9uKHRva2VuMi5fdmFsdWUpO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihub2RlLCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlU3RyaW5nTGl0ZXJhbCgpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBpZiAodGhpcy5zdHJpY3QgJiYgdGhpcy5sb29rYWhlYWQub2N0YWwpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odGhpcy5sb29rYWhlYWQsIEVycm9yTWVzc2FnZXMuU1RSSUNUX09DVEFMX0xJVEVSQUwpO1xuICAgIH1cbiAgICBsZXQgdG9rZW4yID0gdGhpcy5sZXgoKTtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkxpdGVyYWxTdHJpbmdFeHByZXNzaW9uKHRva2VuMi5fdmFsdWUsIHRva2VuMi5zbGljZS50ZXh0KSxcbiAgICAgICAgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZUlkZW50aWZpZXJOYW1lKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGlmICh0aGlzLmxvb2thaGVhZC50eXBlLmtsYXNzLmlzSWRlbnRpZmllck5hbWUpIHtcbiAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuSWRlbnRpZmllcih0aGlzLmxleCgpLnZhbHVlKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgfVxuICB9XG5cbiAgcGFyc2VJZGVudGlmaWVyKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuSWRlbnRpZmllcih0aGlzLmV4cGVjdChUb2tlblR5cGUuSURFTlRJRklFUikudmFsdWUpLCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlQXJndW1lbnRMaXN0KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MUEFSRU4pO1xuICAgIGxldCBhcmdzID0gdGhpcy5wYXJzZUFyZ3VtZW50cygpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgIHJldHVybiBhcmdzO1xuICB9XG5cbiAgcGFyc2VBcmd1bWVudHMoKSB7XG4gICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuUlBBUkVOKSB8fCB0aGlzLmVvZigpKSB7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9XG4gICAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICAgIGxldCBhcmc7XG4gICAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLkVMTElQU0lTKSkge1xuICAgICAgICBhcmcgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgICAgYXJnID0gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlNwcmVhZEVsZW1lbnQoYXJnKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhcmcgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgIH1cbiAgICAgIHJlc3VsdC5wdXNoKGFyZyk7XG4gICAgICBpZiAoIXRoaXMuZWF0KFRva2VuVHlwZS5DT01NQSkpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvLyAxMS4yIExlZnQtSGFuZC1TaWRlIEV4cHJlc3Npb25zO1xuXG4gIGVuc3VyZUFycm93KCkge1xuICAgIGlmICh0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlVORVhQRUNURURfTElORV9URVJNSU5BVE9SKTtcbiAgICB9XG4gICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5BUlJPVykpIHtcbiAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5BUlJPVyk7XG4gICAgfVxuICB9XG5cbiAgcGFyc2VHcm91cEV4cHJlc3Npb24oKSB7XG4gICAgbGV0IHJlc3QgPSBudWxsO1xuICAgIGxldCBzdGFydCA9IHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MUEFSRU4pO1xuICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuUlBBUkVOKSkge1xuICAgICAgdGhpcy5lbnN1cmVBcnJvdygpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogQVJST1dfRVhQUkVTU0lPTl9QQVJBTVMsXG4gICAgICAgIHBhcmFtczogW10sXG4gICAgICAgIHJlc3Q6IG51bGxcbiAgICAgIH07XG4gICAgfSBlbHNlIGlmICh0aGlzLmVhdChUb2tlblR5cGUuRUxMSVBTSVMpKSB7XG4gICAgICByZXN0ID0gbmV3IFNoaWZ0LkJpbmRpbmdJZGVudGlmaWVyKHRoaXMucGFyc2VJZGVudGlmaWVyKCkpO1xuICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJQQVJFTik7XG4gICAgICB0aGlzLmVuc3VyZUFycm93KCk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiBBUlJPV19FWFBSRVNTSU9OX1BBUkFNUyxcbiAgICAgICAgcGFyYW1zOiBbXSxcbiAgICAgICAgcmVzdDogcmVzdFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBsZXQgcG9zc2libGVCaW5kaW5ncyA9ICF0aGlzLm1hdGNoKFRva2VuVHlwZS5MUEFSRU4pO1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCBncm91cCA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgIGxldCBwYXJhbXMgPSBbZ3JvdXBdO1xuXG4gICAgd2hpbGUgKHRoaXMuZWF0KFRva2VuVHlwZS5DT01NQSkpIHtcbiAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5FTExJUFNJUykpIHtcbiAgICAgICAgaWYgKCFwb3NzaWJsZUJpbmRpbmdzKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxleCgpO1xuICAgICAgICByZXN0ID0gbmV3IFNoaWZ0LkJpbmRpbmdJZGVudGlmaWVyKHRoaXMucGFyc2VJZGVudGlmaWVyKCkpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHBvc3NpYmxlQmluZGluZ3MgPSBwb3NzaWJsZUJpbmRpbmdzICYmICF0aGlzLm1hdGNoKFRva2VuVHlwZS5MUEFSRU4pO1xuICAgICAgbGV0IGV4cHIgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgIHBhcmFtcy5wdXNoKGV4cHIpO1xuICAgICAgZ3JvdXAgPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQmluYXJ5RXhwcmVzc2lvbihcIixcIiwgZ3JvdXAsIGV4cHIpLCBzdGFydExvY2F0aW9uKTtcbiAgICB9XG5cbiAgICBpZiAocG9zc2libGVCaW5kaW5ncykge1xuICAgICAgcG9zc2libGVCaW5kaW5ncyA9IHBhcmFtcy5ldmVyeShQYXJzZXIuaXNEZXN0cnVjdHVyaW5nQXNzaWdubWVudFRhcmdldFdpdGhEZWZhdWx0KTtcbiAgICB9XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcblxuICAgIGlmICghdGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQgJiYgdGhpcy5tYXRjaChUb2tlblR5cGUuQVJST1cpKSB7XG4gICAgICBpZiAoIXBvc3NpYmxlQmluZGluZ3MpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbihzdGFydCwgRXJyb3JNZXNzYWdlcy5JTExFR0FMX0FSUk9XX0ZVTkNUSU9OX1BBUkFNUyk7XG4gICAgICB9XG4gICAgICAvLyBjaGVjayBkdXAgcGFyYW1zXG4gICAgICBwYXJhbXMgPSBwYXJhbXMubWFwKFBhcnNlci50cmFuc2Zvcm1EZXN0cnVjdHVyaW5nQXNzaWdubWVudCk7XG4gICAgICBsZXQgYWxsQm91bmROYW1lcyA9IFtdO1xuICAgICAgcGFyYW1zLmZvckVhY2goZXhwciA9PiB7XG4gICAgICAgIGxldCBib3VuZE5hbWVzID0gUGFyc2VyLmJvdW5kTmFtZXMoZXhwcik7XG4gICAgICAgIGxldCBkdXAgPSBmaXJzdER1cGxpY2F0ZShib3VuZE5hbWVzKTtcbiAgICAgICAgaWYgKGR1cCkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5EVVBMSUNBVEVfQklORElORywgZHVwKTtcbiAgICAgICAgfVxuICAgICAgICBhbGxCb3VuZE5hbWVzID0gYWxsQm91bmROYW1lcy5jb25jYXQoYm91bmROYW1lcylcbiAgICAgIH0pO1xuICAgICAgaWYgKHJlc3QpIHtcbiAgICAgICAgYWxsQm91bmROYW1lcy5wdXNoKHJlc3QuaWRlbnRpZmllci5uYW1lKTtcbiAgICAgIH1cblxuICAgICAgbGV0IGR1cCA9IGZpcnN0RHVwbGljYXRlKGFsbEJvdW5kTmFtZXMpO1xuICAgICAgaWYgKHRoaXMuc3RyaWN0ICYmIGR1cCkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX1BBUkFNX0RVUEUpO1xuICAgICAgfVxuXG4gICAgICBsZXQgc3RyaWN0X3Jlc3RyaWN0ZWRfd29yZCA9IGFsbEJvdW5kTmFtZXMuc29tZShpc1Jlc3RyaWN0ZWRXb3JkKTtcbiAgICAgIGlmICh0aGlzLnN0cmljdCAmJiBzdHJpY3RfcmVzdHJpY3RlZF93b3JkKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUEFSQU1fTkFNRSk7XG4gICAgICB9XG5cbiAgICAgIGxldCBzdHJpY3RfcmVzZXJ2ZWRfd29yZCA9IGhhc1N0cmljdE1vZGVSZXNlcnZlZFdvcmQoYWxsQm91bmROYW1lcyk7XG4gICAgICBpZiAodGhpcy5zdHJpY3QgJiYgc3RyaWN0X3Jlc2VydmVkX3dvcmQpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlNUUklDVF9SRVNFUlZFRF9XT1JEKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogQVJST1dfRVhQUkVTU0lPTl9QQVJBTVMsXG4gICAgICAgIHBhcmFtcyxcbiAgICAgICAgcmVzdCxcbiAgICAgICAgZHVwLFxuICAgICAgICBzdHJpY3RfcmVzZXJ2ZWRfd29yZCxcbiAgICAgICAgc3RyaWN0X3Jlc3RyaWN0ZWRfd29yZH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChyZXN0KSB7XG4gICAgICAgIHRoaXMuZW5zdXJlQXJyb3coKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBncm91cDtcbiAgICB9XG4gIH1cblxuXG4gIHBhcnNlQXJyYXlFeHByZXNzaW9uKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxCUkFDSyk7XG5cbiAgICBsZXQgZWxlbWVudHMgPSB0aGlzLnBhcnNlQXJyYXlFeHByZXNzaW9uRWxlbWVudHMoKTtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SQlJBQ0spO1xuXG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5BcnJheUV4cHJlc3Npb24oZWxlbWVudHMpLCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlQXJyYXlFeHByZXNzaW9uRWxlbWVudHMoKSB7XG4gICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuUkJSQUNLKSkge1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfVxuICAgICAgbGV0IGVsO1xuXG4gICAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLkNPTU1BKSkge1xuICAgICAgICBlbCA9IG51bGw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICAgICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5FTExJUFNJUykpIHtcbiAgICAgICAgICBlbCA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgICAgIGVsID0gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlNwcmVhZEVsZW1lbnQoZWwpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbCA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuUkJSQUNLKSkge1xuICAgICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5DT01NQSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJlc3VsdC5wdXNoKGVsKTtcbiAgICB9XG4gIH1cblxuICBwYXJzZU9iamVjdEV4cHJlc3Npb24oKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTEJSQUNFKTtcblxuICAgIGxldCBwcm9wZXJ0aWVzID0gdGhpcy5wYXJzZU9iamVjdEV4cHJlc3Npb25JdGVtcygpO1xuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJCUkFDRSk7XG5cbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0Lk9iamVjdEV4cHJlc3Npb24ocHJvcGVydGllcyksIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cblxuICBwYXJzZU9iamVjdEV4cHJlc3Npb25JdGVtcygpIHtcbiAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgbGV0IGhhc19fcHJvdG9fXyA9IFtmYWxzZV07XG4gICAgd2hpbGUgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0UpKSB7XG4gICAgICByZXN1bHQucHVzaCh0aGlzLnBhcnNlT2JqZWN0RXhwcmVzc2lvbkl0ZW0oaGFzX19wcm90b19fKSk7XG4gICAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJCUkFDRSkpIHtcbiAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNPTU1BKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHBhcnNlT2JqZWN0RXhwcmVzc2lvbkl0ZW0oaGFzX19wcm90b19fKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IHRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgbGV0IHttZXRob2RPcktleSwga2luZH0gPSB0aGlzLnBhcnNlTWV0aG9kRGVmaW5pdGlvbigpO1xuICAgIHN3aXRjaCAoa2luZCkge1xuICAgICAgY2FzZSBcIm1ldGhvZFwiOlxuICAgICAgICByZXR1cm4gbWV0aG9kT3JLZXk7XG4gICAgICBjYXNlIFwiaWRlbnRpZmllclwiOiAvLyBJZGVudGlmaWVyUmVmZXJlbmNlLFxuICAgICAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLkFTU0lHTikpIHtcbiAgICAgICAgICAvLyBDb3ZlckluaXRpYWxpemVkTmFtZVxuICAgICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQmluZGluZ1Byb3BlcnR5SWRlbnRpZmllcihcbiAgICAgICAgICAgICAgbmV3IFNoaWZ0LkJpbmRpbmdJZGVudGlmaWVyKG5ldyBTaGlmdC5JZGVudGlmaWVyKG1ldGhvZE9yS2V5LnZhbHVlKSksXG4gICAgICAgICAgICAgIHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpKSxcbiAgICAgICAgICAgIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgICB9IGVsc2UgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5DT0xPTikpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlNob3J0aGFuZFByb3BlcnR5KG5ldyBTaGlmdC5JZGVudGlmaWVyKG1ldGhvZE9yS2V5LnZhbHVlKSksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gRGF0YVByb3BlcnR5XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNPTE9OKTtcbiAgICBpZiAobWV0aG9kT3JLZXkudHlwZSA9PT0gXCJTdGF0aWNQcm9wZXJ0eU5hbWVcIikge1xuICAgICAgaWYgKG1ldGhvZE9yS2V5LnZhbHVlID09PSBcIl9fcHJvdG9fX1wiKSB7XG4gICAgICAgIGlmICghaGFzX19wcm90b19fWzBdKSB7XG4gICAgICAgICAgaGFzX19wcm90b19fWzBdID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLkRVUExJQ0FURV9QUk9UT19QUk9QRVJUWSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5EYXRhUHJvcGVydHkoXG4gICAgICAgIG1ldGhvZE9yS2V5LFxuICAgICAgICB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKSksXG4gICAgICBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlUHJvcGVydHlOYW1lKCkge1xuICAgIC8vIFByb3BlcnR5TmFtZVtZaWVsZCxHZW5lcmF0b3JQYXJhbWV0ZXJdOlxuICAgIGxldCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuXG4gICAgaWYgKHRoaXMuZW9mKCkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0b2tlbik7XG4gICAgfVxuXG4gICAgc3dpdGNoICh0b2tlbi50eXBlKSB7XG4gICAgICBjYXNlIFRva2VuVHlwZS5TVFJJTkc6XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuU3RhdGljUHJvcGVydHlOYW1lKHRoaXMucGFyc2VTdHJpbmdMaXRlcmFsKCkudmFsdWUpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk5VTUJFUjpcbiAgICAgICAgbGV0IG51bUxpdGVyYWwgPSB0aGlzLnBhcnNlTnVtZXJpY0xpdGVyYWwoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5TdGF0aWNQcm9wZXJ0eU5hbWUoXCJcIiArIChudW1MaXRlcmFsLnR5cGUgPT09IFwiTGl0ZXJhbEluZmluaXR5RXhwcmVzc2lvblwiID8gMSAvIDAgOiBudW1MaXRlcmFsLnZhbHVlKSksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgY2FzZSBUb2tlblR5cGUuTEJSQUNLOlxuICAgICAgICBsZXQgcHJldmlvdXNHZW5lcmF0b3JQYXJhbWV0ZXIgPSB0aGlzLnBhcmFtR2VuZXJhdG9yUGFyYW1ldGVyO1xuICAgICAgICBsZXQgcHJldmlvdXNZaWVsZCA9IHRoaXMucGFyYW1ZaWVsZDtcbiAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxCUkFDSyk7XG4gICAgICAgIC8vIFRPRE8oYnpoYW5nKTogZ2VuZXJhdG9yIHN1cHBvcnRcbiAgICAgICAgLy8gaXN0YW5idWwgaWdub3JlIG5leHRcbiAgICAgICAgaWYgKHRoaXMucGFyYW1HZW5lcmF0b3JQYXJhbWV0ZXIpIHtcbiAgICAgICAgICAvLyBbK0dlbmVyYXRvclBhcmFtZXRlcl0gQ29tcHV0ZWRQcm9wZXJ0eU5hbWVcbiAgICAgICAgICB0aGlzLnBhcmFtR2VuZXJhdG9yUGFyYW1ldGVyID0gZmFsc2U7XG4gICAgICAgICAgdGhpcy5wYXJhbVlpZWxkID0gZmFsc2U7XG4gICAgICAgIH0gLy8gZWxzZSBbfkdlbmVyYXRvclBhcmFtZXRlcl0gQ29tcHV0ZWRQcm9wZXJ0eU5hbWVbP1lpZWxkXVxuICAgICAgICBsZXQgZXhwciA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUkJSQUNLKTtcbiAgICAgICAgdGhpcy5wYXJhbUdlbmVyYXRvclBhcmFtZXRlciA9IHByZXZpb3VzR2VuZXJhdG9yUGFyYW1ldGVyO1xuICAgICAgICB0aGlzLnBhcmFtWWllbGQgPSBwcmV2aW91c1lpZWxkO1xuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkNvbXB1dGVkUHJvcGVydHlOYW1lKGV4cHIpLCBzdGFydExvY2F0aW9uKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlN0YXRpY1Byb3BlcnR5TmFtZSh0aGlzLnBhcnNlSWRlbnRpZmllck5hbWUoKS5uYW1lKSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICAvKipcbiAgICogVGVzdCBpZiBsb29rYWhlYWQgY2FuIGJlIHRoZSBiZWdpbm5pbmcgb2YgYSBgUHJvcGVydHlOYW1lYC5cbiAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAqL1xuICBsb29rYWhlYWRQcm9wZXJ0eU5hbWUoKSB7XG4gICAgc3dpdGNoICh0aGlzLmxvb2thaGVhZC50eXBlKSB7XG4gICAgICBjYXNlIFRva2VuVHlwZS5OVU1CRVI6XG4gICAgICBjYXNlIFRva2VuVHlwZS5TVFJJTkc6XG4gICAgICBjYXNlIFRva2VuVHlwZS5MQlJBQ0s6XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHRoaXMubG9va2FoZWFkLnR5cGUua2xhc3MuaXNJZGVudGlmaWVyTmFtZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVHJ5IHRvIHBhcnNlIGEgbWV0aG9kIGRlZmluaXRpb24uXG4gICAqXG4gICAqIElmIGl0IHR1cm5zIG91dCB0byBiZSBvbmUgb2Y6XG4gICAqICAqIGBJZGVudGlmaWVyUmVmZXJlbmNlYFxuICAgKiAgKiBgQ292ZXJJbml0aWFsaXplZE5hbWVgIChgSWRlbnRpZmllclJlZmVyZW5jZSBcIj1cIiBBc3NpZ25tZW50RXhwcmVzc2lvbmApXG4gICAqICAqIGBQcm9wZXJ0eU5hbWUgOiBBc3NpZ25tZW50RXhwcmVzc2lvbmBcbiAgICogVGhlIHRoZSBwYXJzZXIgd2lsbCBzdG9wIGF0IHRoZSBlbmQgb2YgdGhlIGxlYWRpbmcgYElkZW50aWZpZXJgIG9yIGBQcm9wZXJ0eU5hbWVgIGFuZCByZXR1cm4gaXQuXG4gICAqXG4gICAqIEByZXR1cm5zIHt7bWV0aG9kT3JLZXk6IChTaGlmdC5NZXRob2R8U2hpZnQuUHJvcGVydHlOYW1lKSwga2luZDogc3RyaW5nfX1cbiAgICovXG4gIHBhcnNlTWV0aG9kRGVmaW5pdGlvbigpIHtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcblxuICAgIC8vIFRPRE8oYnpoYW5nKTogR2VuZXJhdG9yTWV0aG9kIChsb29rYWhlYWQ9JyonKVxuXG4gICAgbGV0IGtleSA9IHRoaXMucGFyc2VQcm9wZXJ0eU5hbWUoKTtcblxuICAgIGlmICh0b2tlbi50eXBlID09PSBUb2tlblR5cGUuSURFTlRJRklFUikge1xuICAgICAgbGV0IG5hbWUgPSB0b2tlbi52YWx1ZTtcbiAgICAgIGlmIChuYW1lLmxlbmd0aCA9PT0gMykge1xuICAgICAgICAvLyBQcm9wZXJ0eSBBc3NpZ25tZW50OiBHZXR0ZXIgYW5kIFNldHRlci5cbiAgICAgICAgaWYgKFwiZ2V0XCIgPT09IG5hbWUgJiYgdGhpcy5sb29rYWhlYWRQcm9wZXJ0eU5hbWUoKSkge1xuICAgICAgICAgIGtleSA9IHRoaXMucGFyc2VQcm9wZXJ0eU5hbWUoKTtcbiAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTFBBUkVOKTtcbiAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcbiAgICAgICAgICBsZXQgW2JvZHldID0gdGhpcy5wYXJzZUZ1bmN0aW9uQm9keSgpO1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBtZXRob2RPcktleTogdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkdldHRlcihrZXksIGJvZHkpLCBzdGFydExvY2F0aW9uKSxcbiAgICAgICAgICAgIGtpbmQ6IFwibWV0aG9kXCJcbiAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2UgaWYgKFwic2V0XCIgPT09IG5hbWUgJiYgdGhpcy5sb29rYWhlYWRQcm9wZXJ0eU5hbWUoKSkge1xuICAgICAgICAgIGtleSA9IHRoaXMucGFyc2VQcm9wZXJ0eU5hbWUoKTtcbiAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTFBBUkVOKTtcbiAgICAgICAgICBsZXQgcGFyYW0gPSB0aGlzLnBhcnNlUGFyYW0oKTtcbiAgICAgICAgICBsZXQgaW5mbyA9IHt9O1xuICAgICAgICAgIHRoaXMuY2hlY2tQYXJhbShwYXJhbSwgdG9rZW4sIFtdLCBpbmZvKTtcbiAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcbiAgICAgICAgICBsZXQgW2JvZHksIGlzU3RyaWN0XSA9IHRoaXMucGFyc2VGdW5jdGlvbkJvZHkoKTtcbiAgICAgICAgICBpZiAoaXNTdHJpY3QpIHtcbiAgICAgICAgICAgIGlmIChpbmZvLmZpcnN0UmVzdHJpY3RlZCkge1xuICAgICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKGluZm8uZmlyc3RSZXN0cmljdGVkLCBpbmZvLm1lc3NhZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbWV0aG9kT3JLZXk6IHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5TZXR0ZXIoa2V5LCBwYXJhbSwgYm9keSksIHN0YXJ0TG9jYXRpb24pLFxuICAgICAgICAgICAga2luZDogXCJtZXRob2RcIlxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuTFBBUkVOKSkge1xuICAgICAgbGV0IHBhcmFtSW5mbyA9IHRoaXMucGFyc2VQYXJhbXMobnVsbCk7XG4gICAgICBsZXQgW2JvZHksIGlzU3RyaWN0XSA9IHRoaXMucGFyc2VGdW5jdGlvbkJvZHkoKTtcbiAgICAgIGlmIChpc1N0cmljdCkge1xuICAgICAgICBpZiAocGFyYW1JbmZvLmZpcnN0UmVzdHJpY3RlZCkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24ocGFyYW1JbmZvLmZpcnN0UmVzdHJpY3RlZCwgcGFyYW1JbmZvLm1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4ge1xuICAgICAgICBtZXRob2RPcktleTogdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0Lk1ldGhvZChmYWxzZSwga2V5LCBwYXJhbUluZm8ucGFyYW1zLCBwYXJhbUluZm8ucmVzdCwgYm9keSksIHN0YXJ0TG9jYXRpb24pLFxuICAgICAgICBraW5kOiBcIm1ldGhvZFwiXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBtZXRob2RPcktleToga2V5LFxuICAgICAga2luZDogdG9rZW4udHlwZSA9PT0gVG9rZW5UeXBlLklERU5USUZJRVIgPyBcImlkZW50aWZpZXJcIiA6IFwicHJvcGVydHlcIlxuICAgIH07XG4gIH1cblxuICBwYXJzZUNsYXNzKGlzRXhwcikge1xuICAgIGxldCBsb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuQ0xBU1MpO1xuICAgIGxldCBpZCA9IG51bGw7XG4gICAgbGV0IGhlcml0YWdlID0gbnVsbDtcbiAgICBpZiAoIWlzRXhwciB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5JREVOVElGSUVSKSkge1xuICAgICAgaWQgPSB0aGlzLnBhcnNlVmFyaWFibGVJZGVudGlmaWVyKCk7XG4gICAgfVxuXG5cbiAgICBsZXQgb2xkUGFyYW1ZaWVsZCA9IHRoaXMucGFyYW1ZaWVsZDtcbiAgICAvLyBUT0RPKGJ6aGFuZyk6IGdlbmVyYXRvciBzdXBwb3J0XG4gICAgLy8gaXN0YW5idWwgaWdub3JlIG5leHRcbiAgICBpZiAodGhpcy5wYXJhbUdlbmVyYXRvclBhcmFtZXRlcikge1xuICAgICAgdGhpcy5wYXJhbVlpZWxkID0gZmFsc2U7XG4gICAgfVxuICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuRVhURU5EUykpIHtcbiAgICAgIGhlcml0YWdlID0gdGhpcy5wYXJzZUxlZnRIYW5kU2lkZUV4cHJlc3Npb25BbGxvd0NhbGwoKTtcbiAgICB9XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTEJSQUNFKTtcbiAgICBsZXQgb3JpZ2luYWxTdHJpY3QgPSB0aGlzLnN0cmljdDtcbiAgICB0aGlzLnN0cmljdCA9IHRydWU7XG4gICAgbGV0IG1ldGhvZHMgPSBbXTtcbiAgICBsZXQgaGFzQ29uc3RydWN0b3IgPSBmYWxzZTtcbiAgICB3aGlsZSAoIXRoaXMuZWF0KFRva2VuVHlwZS5SQlJBQ0UpKSB7XG4gICAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLlNFTUlDT0xPTikpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBsZXQgbWV0aG9kVG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICAgIGxldCBpc1N0YXRpYyA9IGZhbHNlO1xuICAgICAgbGV0IHttZXRob2RPcktleSwga2luZH0gPSB0aGlzLnBhcnNlTWV0aG9kRGVmaW5pdGlvbigpO1xuICAgICAgaWYgKGtpbmQgPT09ICdpZGVudGlmaWVyJyAmJiBtZXRob2RPcktleS52YWx1ZSA9PT0gJ3N0YXRpYycpIHtcbiAgICAgICAgaXNTdGF0aWMgPSB0cnVlO1xuICAgICAgICAoe21ldGhvZE9yS2V5LCBraW5kfSA9IHRoaXMucGFyc2VNZXRob2REZWZpbml0aW9uKCkpO1xuICAgICAgfVxuICAgICAgc3dpdGNoIChraW5kKSB7XG4gICAgICAgIGNhc2UgXCJtZXRob2RcIjpcbiAgICAgICAgICBsZXQga2V5ID0gbWV0aG9kT3JLZXkubmFtZTtcbiAgICAgICAgICBpZiAoIWlzU3RhdGljKSB7XG4gICAgICAgICAgICBpZiAoa2V5LnR5cGUgPT09IFwiU3RhdGljUHJvcGVydHlOYW1lXCIgJiYga2V5LnZhbHVlID09PSBcImNvbnN0cnVjdG9yXCIpIHtcbiAgICAgICAgICAgICAgaWYgKG1ldGhvZE9yS2V5LnR5cGUgIT09IFwiTWV0aG9kXCIpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKG1ldGhvZFRva2VuLCBcIkNvbnN0cnVjdG9ycyBjYW5ub3QgYmUgZ2VuZXJhdG9ycywgZ2V0dGVycyBvciBzZXR0ZXJzXCIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChoYXNDb25zdHJ1Y3Rvcikge1xuICAgICAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24obWV0aG9kVG9rZW4sIFwiT25seSBvbmUgY29uc3RydWN0b3IgaXMgYWxsb3dlZCBpbiBhIGNsYXNzXCIpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGhhc0NvbnN0cnVjdG9yID0gdHJ1ZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoa2V5LnR5cGUgPT09IFwiU3RhdGljUHJvcGVydHlOYW1lXCIgJiYga2V5LnZhbHVlID09PSBcInByb3RvdHlwZVwiKSB7XG4gICAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24obWV0aG9kVG9rZW4sIFwiU3RhdGljIGNsYXNzIG1ldGhvZHMgY2Fubm90IGJlIG5hbWVkICdwcm90b3R5cGUnXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBtZXRob2RzLnB1c2gobmV3IFNoaWZ0LkNsYXNzRWxlbWVudChpc1N0YXRpYywgbWV0aG9kT3JLZXkpKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKFwiT25seSBtZXRob2RzIGFyZSBhbGxvd2VkIGluIGNsYXNzZXNcIik7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuc3RyaWN0ID0gb3JpZ2luYWxTdHJpY3Q7XG4gICAgdGhpcy5wYXJhbVlpZWxkID0gb2xkUGFyYW1ZaWVsZDtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IChpc0V4cHIgPyBTaGlmdC5DbGFzc0V4cHJlc3Npb24gOiBTaGlmdC5DbGFzc0RlY2xhcmF0aW9uKShpZCwgaGVyaXRhZ2UsIG1ldGhvZHMpLCBsb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZUZ1bmN0aW9uKGlzRXhwcmVzc2lvbikge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkZVTkNUSU9OKTtcblxuICAgIGxldCBpZCA9IG51bGw7XG4gICAgbGV0IG1lc3NhZ2UgPSBudWxsO1xuICAgIGxldCBmaXJzdFJlc3RyaWN0ZWQgPSBudWxsO1xuICAgIGlmICghaXNFeHByZXNzaW9uIHx8ICF0aGlzLm1hdGNoKFRva2VuVHlwZS5MUEFSRU4pKSB7XG4gICAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICAgIGlkID0gdGhpcy5wYXJzZVZhcmlhYmxlSWRlbnRpZmllcigpO1xuICAgICAgaWYgKHRoaXMuc3RyaWN0KSB7XG4gICAgICAgIGlmIChpc1Jlc3RyaWN0ZWRXb3JkKGlkLm5hbWUpKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5TVFJJQ1RfRlVOQ1RJT05fTkFNRSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChpc1Jlc3RyaWN0ZWRXb3JkKGlkLm5hbWUpKSB7XG4gICAgICAgICAgZmlyc3RSZXN0cmljdGVkID0gdG9rZW47XG4gICAgICAgICAgbWVzc2FnZSA9IEVycm9yTWVzc2FnZXMuU1RSSUNUX0ZVTkNUSU9OX05BTUU7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNTdHJpY3RNb2RlUmVzZXJ2ZWRXb3JkRVM1KGlkLm5hbWUpKSB7XG4gICAgICAgICAgZmlyc3RSZXN0cmljdGVkID0gdG9rZW47XG4gICAgICAgICAgbWVzc2FnZSA9IEVycm9yTWVzc2FnZXMuU1RSSUNUX1JFU0VSVkVEX1dPUkQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgbGV0IGluZm8gPSB0aGlzLnBhcnNlUGFyYW1zKGZpcnN0UmVzdHJpY3RlZCk7XG5cbiAgICBpZiAoaW5mby5tZXNzYWdlICE9IG51bGwpIHtcbiAgICAgIG1lc3NhZ2UgPSBpbmZvLm1lc3NhZ2U7XG4gICAgfVxuXG4gICAgbGV0IHByZXZpb3VzU3RyaWN0ID0gdGhpcy5zdHJpY3Q7XG4gICAgbGV0IFtib2R5LCBpc1N0cmljdF0gPSB0aGlzLnBhcnNlRnVuY3Rpb25Cb2R5KCk7XG4gICAgaWYgKG1lc3NhZ2UgIT0gbnVsbCkge1xuICAgICAgaWYgKCh0aGlzLnN0cmljdCB8fCBpc1N0cmljdCkgJiYgaW5mby5maXJzdFJlc3RyaWN0ZWQgIT0gbnVsbCkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKGluZm8uZmlyc3RSZXN0cmljdGVkLCBtZXNzYWdlKTtcbiAgICAgIH1cbiAgICAgIGlmICgodGhpcy5zdHJpY3QgfHwgaXNTdHJpY3QpICYmIGluZm8uc3RyaWN0ZWQgIT0gbnVsbCkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKGluZm8uc3RyaWN0ZWQsIG1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnN0cmljdCA9IHByZXZpb3VzU3RyaWN0O1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihcbiAgICAgIG5ldyAoaXNFeHByZXNzaW9uID8gU2hpZnQuRnVuY3Rpb25FeHByZXNzaW9uIDogU2hpZnQuRnVuY3Rpb25EZWNsYXJhdGlvbikoZmFsc2UsIGlkLCBpbmZvLnBhcmFtcywgaW5mby5yZXN0LCBib2R5KSxcbiAgICAgIHN0YXJ0TG9jYXRpb25cbiAgICApO1xuICB9XG5cbiAgcGFyc2VQYXJhbShib3VuZCwgaW5mbykge1xuICAgIGxldCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5MUEFSRU4pKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuICAgIH1cbiAgICBsZXQgcGFyYW0gPSB0aGlzLnBhcnNlTGVmdEhhbmRTaWRlRXhwcmVzc2lvbigpO1xuICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuQVNTSUdOKSkge1xuICAgICAgcGFyYW0gPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQXNzaWdubWVudEV4cHJlc3Npb24oXCI9XCIsIHBhcmFtLCB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKSkpO1xuICAgIH1cbiAgICBpZiAoIVBhcnNlci5pc0Rlc3RydWN0dXJpbmdBc3NpZ25tZW50VGFyZ2V0V2l0aERlZmF1bHQocGFyYW0pKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodG9rZW4pO1xuICAgIH1cbiAgICByZXR1cm4gUGFyc2VyLnRyYW5zZm9ybURlc3RydWN0dXJpbmdBc3NpZ25tZW50KHBhcmFtKTtcbiAgfVxuXG4gIGNoZWNrUGFyYW0ocGFyYW0sIHRva2VuLCBib3VuZCwgaW5mbykge1xuICAgIGxldCBuZXdCb3VuZCA9IFBhcnNlci5ib3VuZE5hbWVzKHBhcmFtKTtcbiAgICBbXS5wdXNoLmFwcGx5KGJvdW5kLCBuZXdCb3VuZCk7XG5cbiAgICBpZiAoZmlyc3REdXBsaWNhdGUobmV3Qm91bmQpICE9IG51bGwpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuRFVQTElDQVRFX0JJTkRJTkcsIGZpcnN0RHVwbGljYXRlKG5ld0JvdW5kKSk7XG4gICAgfVxuICAgIGlmICh0aGlzLnN0cmljdCkge1xuICAgICAgaWYgKG5ld0JvdW5kLnNvbWUoaXNSZXN0cmljdGVkV29yZCkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUEFSQU1fTkFNRSk7XG4gICAgICB9IGVsc2UgaWYgKGZpcnN0RHVwbGljYXRlKGJvdW5kKSAhPSBudWxsKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuU1RSSUNUX1BBUkFNX0RVUEUpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoaW5mby5maXJzdFJlc3RyaWN0ZWQgPT0gbnVsbCkge1xuICAgICAgaWYgKG5ld0JvdW5kLnNvbWUoaXNSZXN0cmljdGVkV29yZCkpIHtcbiAgICAgICAgaW5mby5maXJzdFJlc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgaW5mby5tZXNzYWdlID0gRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUEFSQU1fTkFNRTtcbiAgICAgIH0gZWxzZSBpZiAoaGFzU3RyaWN0TW9kZVJlc2VydmVkV29yZChuZXdCb3VuZCkpIHtcbiAgICAgICAgaW5mby5maXJzdFJlc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgaW5mby5tZXNzYWdlID0gRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUkVTRVJWRURfV09SRDtcbiAgICAgIH0gZWxzZSBpZiAoZmlyc3REdXBsaWNhdGUoYm91bmQpICE9IG51bGwpIHtcbiAgICAgICAgaW5mby5maXJzdFJlc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgaW5mby5tZXNzYWdlID0gRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUEFSQU1fRFVQRTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwYXJzZVBhcmFtcyhmcikge1xuICAgIGxldCBpbmZvID0ge3BhcmFtczogW10sIHJlc3Q6IG51bGx9O1xuICAgIGluZm8uZmlyc3RSZXN0cmljdGVkID0gZnI7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG5cbiAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJQQVJFTikpIHtcbiAgICAgIGxldCBib3VuZCA9IFtdO1xuICAgICAgbGV0IHNlZW5SZXN0ID0gZmFsc2U7XG5cbiAgICAgIHdoaWxlICghdGhpcy5lb2YoKSkge1xuICAgICAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICAgICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgICAgIGxldCBwYXJhbTtcbiAgICAgICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5FTExJUFNJUykpIHtcbiAgICAgICAgICB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgICAgICAgIHBhcmFtID0gbmV3IFNoaWZ0LkJpbmRpbmdJZGVudGlmaWVyKHRoaXMucGFyc2VJZGVudGlmaWVyKCkpO1xuICAgICAgICAgIGNwTG9jKHBhcmFtLmlkZW50aWZpZXIsIHBhcmFtKTtcbiAgICAgICAgICBzZWVuUmVzdCA9IHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGFyYW0gPSB0aGlzLnBhcnNlUGFyYW0oKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY2hlY2tQYXJhbShwYXJhbSwgdG9rZW4sIGJvdW5kLCBpbmZvKTtcblxuICAgICAgICBpZiAoc2VlblJlc3QpIHtcbiAgICAgICAgICBpbmZvLnJlc3QgPSBwYXJhbTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBpbmZvLnBhcmFtcy5wdXNoKHBhcmFtKTtcbiAgICAgICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLlJQQVJFTikpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuQ09NTUEpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgIHJldHVybiBpbmZvO1xuICB9XG59XG4iXX0=