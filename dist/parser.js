"use strict";

// istanbul ignore next
var _slicedToArray = function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) { _arr.push(_step.value); if (i && _arr.length === i) break; } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } };

// istanbul ignore next
var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

// istanbul ignore next
var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

// istanbul ignore next
var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

// istanbul ignore next
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
    this.inMethod = false;
    this.inConstructor = false;
    this.hasClassHeritage = false;
    this.inGeneratorParameter = false;
    this.inGeneratorBody = false;
    this.allowYieldExpression = false;
    this.module = false;
    this.strict = false;
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

              // istanbul ignore next
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

              // istanbul ignore next
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
    parse: {
      value: function parse() {
        this.strict = this.module;
        var location = this.getLocation();
        var _parseBody = this.parseBody();

        var _parseBody2 = _slicedToArray(_parseBody, 1);

        var body = _parseBody2[0];
        if (!this.match(TokenType.EOS)) {
          throw this.createUnexpected(this.lookahead);
        }
        return this.markLocation(new (this.module ? Shift.Module : Shift.Script)(body), location);
      },
      writable: true,
      configurable: true
    },
    parseFunctionBody: {
      value: function parseFunctionBody() {
        var startLocation = this.getLocation();

        var oldLabelSet = this.labelSet;
        var oldInIteration = this.inIteration;
        var oldInSwitch = this.inSwitch;
        var oldInFunctionBody = this.inFunctionBody;
        var previousStrict = this.strict;
        var oldModule = this.module;

        this.labelSet = Object.create(null);
        this.inIteration = false;
        this.inSwitch = false;
        this.inFunctionBody = true;
        this.module = false;

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
        this.module = oldModule;
        return [body, isStrict];
      },
      writable: true,
      configurable: true
    },
    parseBody: {
      value: function parseBody() {
        var location = this.getLocation();
        var directives = [];
        var statements = [];
        var parsingDirectives = true;
        var isStrict = this.strict;
        var firstRestricted = null;
        while (true) {
          if (this.eof() || this.match(TokenType.RBRACE)) {
            break;
          }
          var token = this.lookahead;
          var text = token.slice.text;
          var isStringLiteral = token.type === TokenType.STRING;
          var directiveLocation = this.getLocation();
          var stmt = this.parseStatementListItem();
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
    parseStatementListItem: {
      value: function parseStatementListItem() {
        var startLocation = this.getLocation();
        if (this.eof()) {
          throw this.createUnexpected(this.lookahead);
        }
        switch (this.lookahead.type) {
          case TokenType.FUNCTION:
            return this.markLocation(this.parseFunction(false), startLocation);
          case TokenType.CONST:
            return this.markLocation(this.parseVariableDeclarationStatement(), startLocation);
          case TokenType.CLASS:
            return this.parseClass(false);
          default:
            if (this.lookahead.value === "let") {
              return this.markLocation(this.parseVariableDeclarationStatement(), startLocation);
            }
            return this.parseStatement();
        }
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
            return this.markLocation(this.parseVariableDeclarationStatement(), startLocation);
          case TokenType.WHILE:
            return this.markLocation(this.parseWhileStatement(), startLocation);
          case TokenType.WITH:
            return this.markLocation(this.parseWithStatement(), startLocation);
          case TokenType.CONST:
          case TokenType.FUNCTION:
          case TokenType.CLASS:
            throw this.createUnexpected(this.lookahead);

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
                var labeledBody = undefined;
                if (this.match(TokenType.FUNCTION)) {
                  labeledBody = this.parseFunction(false, false);
                } else {
                  labeledBody = this.parseStatement();
                }
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
          label = this.parseIdentifier();

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
          label = this.parseIdentifier();

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
          if (this.match(TokenType.VAR) || this.match(TokenType.IDENTIFIER) && this.lookahead.value === "let") {
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
          body.push(this.parseStatementListItem());
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
        if (head.type !== ARROW_EXPRESSION_PARAMS) {
          if (head.type === "IdentifierExpression") {
            var _name = head.identifier.name;
            if (STRICT_MODE_RESERVED_WORD.hasOwnProperty(_name)) {
              throw this.createError(ErrorMessages.STRICT_RESERVED_WORD);
            }
            if (isRestrictedWord(_name)) {
              throw this.createError(ErrorMessages.STRICT_PARAM_NAME);
            }
            head = Parser.transformDestructuringAssignment(head);
            params = [head];
          } else {
            throw this.createUnexpected(arrow);
          }
        }

        if (this.match(TokenType.LBRACE)) {
          var previousYield = this.allowYieldExpression;
          this.allowYieldExpression = false;
          var _parseFunctionBody = this.parseFunctionBody();

          var _parseFunctionBody2 = _slicedToArray(_parseFunctionBody, 1);

          var body = _parseFunctionBody2[0];
          this.allowYieldExpression = previousYield;
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

        if (this.allowYieldExpression && !this.inGeneratorParameter && this.lookahead.value === "yield") {
          return this.parseYieldExpression();
        }

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
          var previousInGeneratorParameter = this.inGeneratorParameter;
          this.inGeneratorParameter = false;
          var right = this.parseAssignmentExpression();
          this.inGeneratorParameter = previousInGeneratorParameter;
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
    lookaheadAssignmentExpression: {
      value: function lookaheadAssignmentExpression() {
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
      },
      writable: true,
      configurable: true
    },
    parseYieldExpression: {
      value: function parseYieldExpression() {
        var startLocation = this.getLocation();

        this.lex();
        if (this.hasLineTerminatorBeforeNext) {
          return this.markLocation(new Shift.YieldExpression(null), startLocation);
        }
        var isGenerator = !!this.eat(TokenType.MUL);
        var previousYield = this.allowYieldExpression;
        var expr = null;
        if (isGenerator || this.lookaheadAssignmentExpression()) {
          expr = this.parseAssignmentExpression();
        }
        this.allowYieldExpression = previousYield;
        var cons = isGenerator ? Shift.YieldGeneratorExpression : Shift.YieldExpression;
        return this.markLocation(new cons(expr), startLocation);
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

        var expr = this.parseLeftHandSideExpression(true);

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
    parseLeftHandSideExpression: {
      value: function parseLeftHandSideExpression(allowCall) {
        var startLocation = this.getLocation();
        var previousAllowIn = this.allowIn;
        this.allowIn = allowCall;

        var expr = undefined,
            token = this.lookahead;

        if (this.eat(TokenType.SUPER)) {
          expr = this.markLocation(new Shift.Super(), startLocation);
          if (allowCall && this.inConstructor && this.match(TokenType.LPAREN)) {
            expr = this.markLocation(new Shift.CallExpression(expr, this.parseArgumentList()), startLocation);
          } else if (this.inMethod && this.match(TokenType.LBRACK)) {
            expr = this.markLocation(new Shift.ComputedMemberExpression(expr, this.parseComputedMember()), startLocation);
          } else if (this.inMethod && this.match(TokenType.PERIOD)) {
            expr = this.markLocation(new Shift.StaticMemberExpression(expr, this.parseNonComputedMember()), startLocation);
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
            expr = this.markLocation(new Shift.TemplateString(expr, this.parseTemplateElements()), startLocation);
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
    parseTemplateElements: {
      value: function parseTemplateElements() {
        var startLocation = this.getLocation();
        var token = this.lookahead;
        if (token.tail) {
          this.lex();
          return [this.markLocation(new Shift.TemplateLiteral(token.value.slice(1, -1)), startLocation)];
        }
        var result = [this.markLocation(new Shift.TemplateLiteral(this.lex().value.slice(1, -2)), startLocation)];
        while (true) {
          result.push(this.parseExpression());
          if (!this.match(TokenType.RBRACE)) {
            throw this.createILLEGAL();
          }
          this.index = this.startIndex;
          this.line = this.startLine;
          this.lineStart = this.startLineStart;
          this.lookahead = this.scanTemplateLiteral();
          startLocation = this.getLocation();
          token = this.lex();
          if (token.tail) {
            result.push(this.markLocation(new Shift.TemplateLiteral(token.value.slice(1, -1)), startLocation));
            return result;
          } else {
            result.push(this.markLocation(new Shift.TemplateLiteral(token.value.slice(1, -2)), startLocation));
          }
        }
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
        if (this.inFunctionBody && this.eat(TokenType.PERIOD)) {
          var ident = this.expect(TokenType.IDENTIFIER);
          if (ident.value !== "target") {
            throw this.createUnexpected(ident);
          }
          return this.markLocation(new Shift.NewTargetExpression(), startLocation);
        }
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
          case TokenType.YIELD:
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
          case TokenType.TEMPLATE:
            return this.markLocation(new Shift.TemplateString(null, this.parseTemplateElements()), startLocation);
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
        if (this.match(TokenType.YIELD)) {
          if (this.strict) {
            this.lookahead.type = TokenType.FUTURE_STRICT_RESERVED_WORD;
            throw this.createUnexpected(this.lookahead);
          } else if (this.allowYieldExpression) {
            throw this.createUnexpected(this.lookahead);
          } else if (this.inGeneratorBody) {
            throw this.createUnexpected(this.lookahead);
          } else {
            return this.markLocation(new Shift.Identifier(this.lex().value), startLocation);
          }
        }
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
            if (dup) {
              throw _this.createError(ErrorMessages.STRICT_PARAM_DUPE);
            }

            var strict_restricted_word = allBoundNames.some(isRestrictedWord);
            if (strict_restricted_word) {
              throw _this.createError(ErrorMessages.STRICT_PARAM_NAME);
            }

            var strict_reserved_word = hasStrictModeReservedWord(allBoundNames);
            if (strict_reserved_word) {
              throw _this.createError(ErrorMessages.STRICT_RESERVED_WORD);
            }

            return {
              v: {
                type: ARROW_EXPRESSION_PARAMS,
                params: params,
                rest: rest
              }
            };
          })();

          // istanbul ignore next
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
          result.push(this.parsePropertyDefinition(has__proto__));
          if (!this.match(TokenType.RBRACE)) {
            this.expect(TokenType.COMMA);
          }
        }
        return result;
      },
      writable: true,
      configurable: true
    },
    parsePropertyDefinition: {
      value: function parsePropertyDefinition(has__proto__) {
        var startLocation = this.getLocation();
        var token = this.lookahead;

        var _parseMethodDefinition = this.parseMethodDefinition(false);

        var methodOrKey = _parseMethodDefinition.methodOrKey;
        var kind = _parseMethodDefinition.kind;
        switch (kind) {
          case "method":
            return methodOrKey;
          case "identifier":
            // IdentifierReference,
            if (this.eat(TokenType.ASSIGN)) {
              // CoverInitializedName
              if ((this.strict || this.allowYieldExpression) && methodOrKey.value === "yield") {
                throw this.createUnexpected(token);
              }
              return this.markLocation(new Shift.BindingPropertyIdentifier(new Shift.BindingIdentifier(new Shift.Identifier(methodOrKey.value)), this.parseAssignmentExpression()), startLocation);
            } else if (!this.match(TokenType.COLON)) {
              if (token.type !== TokenType.IDENTIFIER && token.type !== TokenType.YIELD || (this.strict || this.allowYieldExpression) && methodOrKey.value === "yield") {
                throw this.createUnexpected(token);
              }
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
            var previousYield = this.allowYieldExpression;
            if (this.inGeneratorParameter) {
              this.allowYieldExpression = false;
            }
            this.expect(TokenType.LBRACK);
            var expr = this.parseAssignmentExpression();
            this.expect(TokenType.RBRACK);
            this.allowYieldExpression = previousYield;
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
      value: function parseMethodDefinition(isClassProtoMethod) {
        var token = this.lookahead;
        var startLocation = this.getLocation();

        var isGenerator = !!this.eat(TokenType.MUL);

        var key = this.parsePropertyName();

        if (!isGenerator && token.type === TokenType.IDENTIFIER) {
          var _name = token.value;
          if (_name.length === 3) {
            // Property Assignment: Getter and Setter.
            if ("get" === _name && this.lookaheadPropertyName()) {
              key = this.parsePropertyName();
              this.expect(TokenType.LPAREN);
              this.expect(TokenType.RPAREN);
              var previousInConstructor = this.inConstructor;
              this.inConstructor = false;
              var previousInMethod = this.inMethod;
              this.inMethod = true;
              var _parseFunctionBody = this.parseFunctionBody();

              var _parseFunctionBody2 = _slicedToArray(_parseFunctionBody, 1);

              var body = _parseFunctionBody2[0];
              this.inConstructor = previousInConstructor;
              this.inMethod = previousInMethod;
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
              var previousYield = this.allowYieldExpression;
              this.allowYieldExpression = false;
              var previousInConstructor = this.inConstructor;
              this.inConstructor = false;
              var previousInMethod = this.inMethod;
              this.inMethod = true;
              var _parseFunctionBody3 = this.parseFunctionBody();

              var _parseFunctionBody32 = _slicedToArray(_parseFunctionBody3, 2);

              var body = _parseFunctionBody32[0];
              var isStrict = _parseFunctionBody32[1];
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
          var previousYield = this.allowYieldExpression;
          var previousInGeneratorParameter = this.inGeneratorParameter;
          this.inGeneratorParameter = isGenerator;
          this.allowYieldExpression = isGenerator;
          var paramInfo = this.parseParams(null);
          this.inGeneratorParameter = previousInGeneratorParameter;
          this.allowYieldExpression = previousYield;

          var previousInGeneratorBody = this.inGeneratorBody;
          var previousInConstructor = this.inConstructor;
          var previousInMethod = this.inMethod;
          this.allowYieldExpression = isGenerator;
          this.inConstructor = isClassProtoMethod && !isGenerator && this.hasClassHeritage && key.type === "StaticPropertyName" && key.value === "constructor";
          this.inMethod = true;

          if (isGenerator) {
            this.inGeneratorBody = true;
          }
          var _parseFunctionBody4 = this.parseFunctionBody();

          var _parseFunctionBody42 = _slicedToArray(_parseFunctionBody4, 1);

          var body = _parseFunctionBody42[0];
          this.allowYieldExpression = previousYield;
          this.inGeneratorBody = previousInGeneratorBody;
          this.inConstructor = previousInConstructor;
          this.inMethod = previousInMethod;

          if (paramInfo.firstRestricted) {
            throw this.createErrorWithLocation(paramInfo.firstRestricted, paramInfo.message);
          }
          return {
            methodOrKey: this.markLocation(new Shift.Method(isGenerator, key, paramInfo.params, paramInfo.rest, body), startLocation),
            kind: "method"
          };
        }

        return {
          methodOrKey: key,
          kind: token.type.klass.isIdentifierName ? "identifier" : "property"
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
          var _location = this.getLocation();
          id = this.markLocation(new Shift.BindingIdentifier(this.parseIdentifier()), _location);
        }

        var previousInGeneratorParameter = this.inGeneratorParameter;
        var previousParamYield = this.allowYieldExpression;
        var previousHasClassHeritage = this.hasClassHeritage;
        if (isExpr) {
          this.inGeneratorParameter = false;
          this.allowYieldExpression = false;
        }
        if (this.eat(TokenType.EXTENDS)) {
          heritage = this.parseLeftHandSideExpression(true);
        }

        this.expect(TokenType.LBRACE);
        var originalStrict = this.strict;
        this.strict = true;
        var methods = [];
        var hasConstructor = false;
        this.hasClassHeritage = heritage != null;
        while (!this.eat(TokenType.RBRACE)) {
          if (this.eat(TokenType.SEMICOLON)) {
            continue;
          }
          var methodToken = this.lookahead;
          var isStatic = false;
          var _parseMethodDefinition = this.parseMethodDefinition(true);

          var methodOrKey = _parseMethodDefinition.methodOrKey;
          var kind = _parseMethodDefinition.kind;
          if (kind === "identifier" && methodOrKey.value === "static") {
            isStatic = true;
            var _ref = this.parseMethodDefinition(false);

            methodOrKey = _ref.methodOrKey;
            kind = _ref.kind;
          }
          switch (kind) {
            case "method":
              var key = methodOrKey.name;
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
        this.strict = originalStrict;
        this.allowYieldExpression = previousParamYield;
        this.inGeneratorParameter = previousInGeneratorParameter;
        return this.markLocation(new (isExpr ? Shift.ClassExpression : Shift.ClassDeclaration)(id, heritage, methods), location);
      },
      writable: true,
      configurable: true
    },
    parseFunction: {
      value: function parseFunction(isExpr) {
        var allowGenerator = arguments[1] === undefined ? true : arguments[1];
        var startLocation = this.getLocation();

        this.expect(TokenType.FUNCTION);

        var id = null;
        var message = null;
        var firstRestricted = null;
        var isGenerator = allowGenerator && !!this.eat(TokenType.MUL);
        var previousGeneratorParameter = this.inGeneratorParameter;
        var previousYield = this.allowYieldExpression;
        var previousInGeneratorBody = this.inGeneratorBody;

        if (!isExpr || !this.match(TokenType.LPAREN)) {
          var token = this.lookahead;
          var _startLocation = this.getLocation();
          id = this.parseIdentifier();
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
          id = this.markLocation(new Shift.BindingIdentifier(id), _startLocation);
        }
        this.inGeneratorParameter = isGenerator;
        this.allowYieldExpression = isGenerator;
        var info = this.parseParams(firstRestricted);
        this.inGeneratorParameter = previousGeneratorParameter;
        this.allowYieldExpression = previousYield;

        if (info.message != null) {
          message = info.message;
        }

        var previousStrict = this.strict;
        this.allowYieldExpression = isGenerator;
        if (isGenerator) {
          this.inGeneratorBody = true;
        }
        var previousInConstructor = this.inConstructor;
        this.inConstructor = false;
        var previousInMethod = this.inMethod;
        this.inMethod = false;
        var _parseFunctionBody = this.parseFunctionBody();

        var _parseFunctionBody2 = _slicedToArray(_parseFunctionBody, 2);

        var body = _parseFunctionBody2[0];
        var isStrict = _parseFunctionBody2[1];
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
        var cons = isExpr ? Shift.FunctionExpression : Shift.FunctionDeclaration;
        return this.markLocation(new cons(isGenerator, id, info.params, info.rest, body), startLocation);
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
          var previousInGeneratorParameter = this.inGeneratorParameter;
          var previousYieldExpression = this.allowYieldExpression;
          if (this.inGeneratorParameter) {
            this.allowYieldExpression = false;
          }
          this.inGeneratorParameter = false;
          param = this.markLocation(new Shift.AssignmentExpression("=", param, this.parseAssignmentExpression()));
          this.inGeneratorParameter = previousInGeneratorParameter;
          this.allowYieldExpression = previousYieldExpression;
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
//# sourceMappingURL=data:application/json;base64,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LE1BQU0sQ0FBQyxFQUFFO0FBQ2hDLG9CQUFNO2FBQ1A7QUFDRCxnQkFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7V0FDOUI7U0FDRjs7QUFFRCxZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM5QixlQUFPLElBQUksQ0FBQztPQUNiOzs7Ozs7U0F0OERVLE1BQU07R0FBUyxTQUFTIiwiZmlsZSI6InNyYy9wYXJzZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAyMDE0IFNoYXBlIFNlY3VyaXR5LCBJbmMuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKVxuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0ICogYXMgU2hpZnQgZnJvbSBcInNoaWZ0LWFzdFwiO1xuXG5pbXBvcnQge2lzUmVzdHJpY3RlZFdvcmQsIGlzU3RyaWN0TW9kZVJlc2VydmVkV29yZEVTNX0gZnJvbSBcIi4vdXRpbHNcIjtcblxuaW1wb3J0IHtFcnJvck1lc3NhZ2VzfSBmcm9tIFwiLi9lcnJvcnNcIjtcblxuaW1wb3J0IFRva2VuaXplciwge1xuICAgIFRva2VuQ2xhc3MsXG4gICAgVG9rZW5UeXBlLFxuICAgIElkZW50aWZpZXJUb2tlbixcbiAgICBJZGVudGlmaWVyTGlrZVRva2VuLFxuICAgIE51bWVyaWNMaXRlcmFsVG9rZW4sXG4gICAgU3RyaW5nTGl0ZXJhbFRva2VufSBmcm9tIFwiLi90b2tlbml6ZXJcIjtcblxuLy8gRW1wdHkgcGFyYW1ldGVyIGxpc3QgZm9yIEFycm93RXhwcmVzc2lvblxuY29uc3QgQVJST1dfRVhQUkVTU0lPTl9QQVJBTVMgPSBcIkNvdmVyUGFyZW50aGVzaXplZEV4cHJlc3Npb25BbmRBcnJvd1BhcmFtZXRlckxpc3RcIjtcblxuY29uc3QgU1RSSUNUX01PREVfUkVTRVJWRURfV09SRCA9IHtcbiAgXCJpbXBsZW1lbnRzXCI6IG51bGwsIFwiaW50ZXJmYWNlXCI6IG51bGwsIFwicGFja2FnZVwiOiBudWxsLCBcInByaXZhdGVcIjogbnVsbCwgXCJwcm90ZWN0ZWRcIjogbnVsbCxcbiAgXCJwdWJsaWNcIjogbnVsbCwgXCJzdGF0aWNcIjogbnVsbCwgXCJ5aWVsZFwiOiBudWxsLCBcImxldFwiOiBudWxsXG59O1xuXG5jb25zdCBQcmVjZWRlbmNlID0ge1xuICBTZXF1ZW5jZTogMCxcbiAgWWllbGQ6IDEsXG4gIEFzc2lnbm1lbnQ6IDEsXG4gIENvbmRpdGlvbmFsOiAyLFxuICBBcnJvd0Z1bmN0aW9uOiAyLFxuICBMb2dpY2FsT1I6IDMsXG4gIExvZ2ljYWxBTkQ6IDQsXG4gIEJpdHdpc2VPUjogNSxcbiAgQml0d2lzZVhPUjogNixcbiAgQml0d2lzZUFORDogNyxcbiAgRXF1YWxpdHk6IDgsXG4gIFJlbGF0aW9uYWw6IDksXG4gIEJpdHdpc2VTSElGVDogMTAsXG4gIEFkZGl0aXZlOiAxMSxcbiAgTXVsdGlwbGljYXRpdmU6IDEyLFxuICBVbmFyeTogMTMsXG4gIFBvc3RmaXg6IDE0LFxuICBDYWxsOiAxNSxcbiAgTmV3OiAxNixcbiAgVGFnZ2VkVGVtcGxhdGU6IDE3LFxuICBNZW1iZXI6IDE4LFxuICBQcmltYXJ5OiAxOVxufTtcblxuY29uc3QgQmluYXJ5UHJlY2VkZW5jZSA9IHtcbiAgXCJ8fFwiOiBQcmVjZWRlbmNlLkxvZ2ljYWxPUixcbiAgXCImJlwiOiBQcmVjZWRlbmNlLkxvZ2ljYWxBTkQsXG4gIFwifFwiOiBQcmVjZWRlbmNlLkJpdHdpc2VPUixcbiAgXCJeXCI6IFByZWNlZGVuY2UuQml0d2lzZVhPUixcbiAgXCImXCI6IFByZWNlZGVuY2UuQml0d2lzZUFORCxcbiAgXCI9PVwiOiBQcmVjZWRlbmNlLkVxdWFsaXR5LFxuICBcIiE9XCI6IFByZWNlZGVuY2UuRXF1YWxpdHksXG4gIFwiPT09XCI6IFByZWNlZGVuY2UuRXF1YWxpdHksXG4gIFwiIT09XCI6IFByZWNlZGVuY2UuRXF1YWxpdHksXG4gIFwiPFwiOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gIFwiPlwiOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gIFwiPD1cIjogUHJlY2VkZW5jZS5SZWxhdGlvbmFsLFxuICBcIj49XCI6IFByZWNlZGVuY2UuUmVsYXRpb25hbCxcbiAgXCJpblwiOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gIFwiaW5zdGFuY2VvZlwiOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gIFwiPDxcIjogUHJlY2VkZW5jZS5CaXR3aXNlU0hJRlQsXG4gIFwiPj5cIjogUHJlY2VkZW5jZS5CaXR3aXNlU0hJRlQsXG4gIFwiPj4+XCI6IFByZWNlZGVuY2UuQml0d2lzZVNISUZULFxuICBcIitcIjogUHJlY2VkZW5jZS5BZGRpdGl2ZSxcbiAgXCItXCI6IFByZWNlZGVuY2UuQWRkaXRpdmUsXG4gIFwiKlwiOiBQcmVjZWRlbmNlLk11bHRpcGxpY2F0aXZlLFxuICBcIiVcIjogUHJlY2VkZW5jZS5NdWx0aXBsaWNhdGl2ZSxcbiAgXCIvXCI6IFByZWNlZGVuY2UuTXVsdGlwbGljYXRpdmUsXG59O1xuXG5mdW5jdGlvbiBjcExvYyhmcm9tLCB0bykge1xuICBpZiAoXCJsb2NcIiBpbiBmcm9tKVxuICAgIHRvLmxvYyA9IGZyb20ubG9jXG4gIHJldHVybiB0bztcbn1cblxuLyoqXG4gKlxuICogQHBhcmFtIHtbc3RyaW5nXX0gc3RyaW5nc1xuICogQHJldHVybnMge3N0cmluZz99XG4gKi9cbmZ1bmN0aW9uIGZpcnN0RHVwbGljYXRlKHN0cmluZ3MpIHtcbiAgaWYgKHN0cmluZ3MubGVuZ3RoIDwgMilcbiAgICByZXR1cm4gbnVsbDtcbiAgbGV0IG1hcCA9IHt9O1xuICBmb3IgKGxldCBjdXJzb3IgPSAwOyBjdXJzb3IgPCBzdHJpbmdzLmxlbmd0aDsgY3Vyc29yKyspIHtcbiAgICBsZXQgaWQgPSAnJCcgKyBzdHJpbmdzW2N1cnNvcl07XG4gICAgaWYgKG1hcC5oYXNPd25Qcm9wZXJ0eShpZCkpIHtcbiAgICAgIHJldHVybiBzdHJpbmdzW2N1cnNvcl07XG4gICAgfVxuICAgIG1hcFtpZF0gPSB0cnVlO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBoYXNTdHJpY3RNb2RlUmVzZXJ2ZWRXb3JkKGlkcykge1xuICByZXR1cm4gaWRzLnNvbWUoaWQgPT4gU1RSSUNUX01PREVfUkVTRVJWRURfV09SRC5oYXNPd25Qcm9wZXJ0eShpZCkpO1xufVxuXG5leHBvcnQgY2xhc3MgUGFyc2VyIGV4dGVuZHMgVG9rZW5pemVyIHtcbiAgY29uc3RydWN0b3Ioc291cmNlKSB7XG4gICAgc3VwZXIoc291cmNlKTtcbiAgICB0aGlzLmxhYmVsU2V0ID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICB0aGlzLmFsbG93SW4gPSB0cnVlO1xuICAgIHRoaXMuaW5JdGVyYXRpb24gPSBmYWxzZTtcbiAgICB0aGlzLmluU3dpdGNoID0gZmFsc2U7XG4gICAgdGhpcy5pbkZ1bmN0aW9uQm9keSA9IGZhbHNlO1xuICAgIHRoaXMuaW5NZXRob2QgPSBmYWxzZTtcbiAgICB0aGlzLmluQ29uc3RydWN0b3IgPSBmYWxzZTtcbiAgICB0aGlzLmhhc0NsYXNzSGVyaXRhZ2UgPSBmYWxzZTtcbiAgICB0aGlzLmluR2VuZXJhdG9yUGFyYW1ldGVyID0gZmFsc2U7XG4gICAgdGhpcy5pbkdlbmVyYXRvckJvZHkgPSBmYWxzZTtcbiAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gZmFsc2U7XG4gICAgdGhpcy5tb2R1bGUgPSBmYWxzZTtcbiAgICB0aGlzLnN0cmljdCA9IGZhbHNlO1xuICB9XG5cbiAgZWF0KHRva2VuVHlwZSkge1xuICAgIGlmICh0aGlzLmxvb2thaGVhZC50eXBlID09PSB0b2tlblR5cGUpIHtcbiAgICAgIHJldHVybiB0aGlzLmxleCgpO1xuICAgIH1cbiAgfVxuXG4gIGV4cGVjdCh0b2tlblR5cGUpIHtcbiAgICBpZiAodGhpcy5sb29rYWhlYWQudHlwZSA9PT0gdG9rZW5UeXBlKSB7XG4gICAgICByZXR1cm4gdGhpcy5sZXgoKTtcbiAgICB9XG4gICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgfVxuXG4gIG1hdGNoKHN1YlR5cGUpIHtcbiAgICByZXR1cm4gdGhpcy5sb29rYWhlYWQudHlwZSA9PT0gc3ViVHlwZTtcbiAgfVxuXG4gIGNvbnN1bWVTZW1pY29sb24oKSB7XG4gICAgaWYgKHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5TRU1JQ09MT04pKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmVvZigpICYmICF0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0UpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuICAgIH1cbiAgfVxuXG4gIC8vIHRoaXMgaXMgYSBuby1vcCwgcmVzZXJ2ZWQgZm9yIGZ1dHVyZSB1c2VcbiAgbWFya0xvY2F0aW9uKG5vZGUsIHN0YXJ0TG9jYXRpb24pIHtcbiAgICByZXR1cm4gbm9kZTtcbiAgfVxuXG4gIHBhcnNlKCkge1xuICAgIHRoaXMuc3RyaWN0ID0gdGhpcy5tb2R1bGU7XG4gICAgbGV0IGxvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCBbYm9keV0gPSB0aGlzLnBhcnNlQm9keSgpO1xuICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuRU9TKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyAodGhpcy5tb2R1bGUgPyBTaGlmdC5Nb2R1bGUgOiBTaGlmdC5TY3JpcHQpKGJvZHkpLCBsb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZUZ1bmN0aW9uQm9keSgpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcblxuICAgIGxldCBvbGRMYWJlbFNldCA9IHRoaXMubGFiZWxTZXQ7XG4gICAgbGV0IG9sZEluSXRlcmF0aW9uID0gdGhpcy5pbkl0ZXJhdGlvbjtcbiAgICBsZXQgb2xkSW5Td2l0Y2ggPSB0aGlzLmluU3dpdGNoO1xuICAgIGxldCBvbGRJbkZ1bmN0aW9uQm9keSA9IHRoaXMuaW5GdW5jdGlvbkJvZHk7XG4gICAgbGV0IHByZXZpb3VzU3RyaWN0ID0gdGhpcy5zdHJpY3Q7XG4gICAgbGV0IG9sZE1vZHVsZSA9IHRoaXMubW9kdWxlO1xuXG4gICAgdGhpcy5sYWJlbFNldCA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgdGhpcy5pbkl0ZXJhdGlvbiA9IGZhbHNlO1xuICAgIHRoaXMuaW5Td2l0Y2ggPSBmYWxzZTtcbiAgICB0aGlzLmluRnVuY3Rpb25Cb2R5ID0gdHJ1ZTtcbiAgICB0aGlzLm1vZHVsZSA9IGZhbHNlO1xuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxCUkFDRSk7XG4gICAgbGV0IFtib2R5LCBpc1N0cmljdF0gPSB0aGlzLnBhcnNlQm9keSgpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SQlJBQ0UpO1xuXG4gICAgYm9keSA9IHRoaXMubWFya0xvY2F0aW9uKGJvZHksIHN0YXJ0TG9jYXRpb24pO1xuXG4gICAgdGhpcy5sYWJlbFNldCA9IG9sZExhYmVsU2V0O1xuICAgIHRoaXMuaW5JdGVyYXRpb24gPSBvbGRJbkl0ZXJhdGlvbjtcbiAgICB0aGlzLmluU3dpdGNoID0gb2xkSW5Td2l0Y2g7XG4gICAgdGhpcy5pbkZ1bmN0aW9uQm9keSA9IG9sZEluRnVuY3Rpb25Cb2R5O1xuICAgIHRoaXMuc3RyaWN0ID0gcHJldmlvdXNTdHJpY3Q7XG4gICAgdGhpcy5tb2R1bGUgPSBvbGRNb2R1bGU7XG4gICAgcmV0dXJuIFtib2R5LCBpc1N0cmljdF07XG4gIH1cblxuICBwYXJzZUJvZHkoKSB7XG4gICAgbGV0IGxvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCBkaXJlY3RpdmVzID0gW107XG4gICAgbGV0IHN0YXRlbWVudHMgPSBbXTtcbiAgICBsZXQgcGFyc2luZ0RpcmVjdGl2ZXMgPSB0cnVlO1xuICAgIGxldCBpc1N0cmljdCA9IHRoaXMuc3RyaWN0O1xuICAgIGxldCBmaXJzdFJlc3RyaWN0ZWQgPSBudWxsO1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBpZiAodGhpcy5lb2YoKSB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0UpKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgbGV0IHRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgICBsZXQgdGV4dCA9IHRva2VuLnNsaWNlLnRleHQ7XG4gICAgICBsZXQgaXNTdHJpbmdMaXRlcmFsID0gdG9rZW4udHlwZSA9PT0gVG9rZW5UeXBlLlNUUklORztcbiAgICAgIGxldCBkaXJlY3RpdmVMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICAgIGxldCBzdG10ID0gdGhpcy5wYXJzZVN0YXRlbWVudExpc3RJdGVtKCk7XG4gICAgICBpZiAocGFyc2luZ0RpcmVjdGl2ZXMpIHtcbiAgICAgICAgaWYgKGlzU3RyaW5nTGl0ZXJhbCAmJiBzdG10LnR5cGUgPT09IFwiRXhwcmVzc2lvblN0YXRlbWVudFwiICYmXG4gICAgICAgICAgICBzdG10LmV4cHJlc3Npb24udHlwZSA9PT0gXCJMaXRlcmFsU3RyaW5nRXhwcmVzc2lvblwiKSB7XG4gICAgICAgICAgaWYgKHRleHQgPT09IFwiXFxcInVzZSBzdHJpY3RcXFwiXCIgfHwgdGV4dCA9PT0gXCIndXNlIHN0cmljdCdcIikge1xuICAgICAgICAgICAgaXNTdHJpY3QgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5zdHJpY3QgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKGZpcnN0UmVzdHJpY3RlZCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24oZmlyc3RSZXN0cmljdGVkLCBFcnJvck1lc3NhZ2VzLlNUUklDVF9PQ1RBTF9MSVRFUkFMKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKGZpcnN0UmVzdHJpY3RlZCA9PSBudWxsICYmIHRva2VuLm9jdGFsKSB7XG4gICAgICAgICAgICBmaXJzdFJlc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgICB9XG4gICAgICAgICAgZGlyZWN0aXZlcy5wdXNoKHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5EaXJlY3RpdmUodGV4dC5zbGljZSgxLCAtMSkpLCBkaXJlY3RpdmVMb2NhdGlvbikpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBhcnNpbmdEaXJlY3RpdmVzID0gZmFsc2U7XG4gICAgICAgICAgc3RhdGVtZW50cy5wdXNoKHN0bXQpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdGF0ZW1lbnRzLnB1c2goc3RtdCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIFt0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuRnVuY3Rpb25Cb2R5KGRpcmVjdGl2ZXMsIHN0YXRlbWVudHMpLCBsb2NhdGlvbiksIGlzU3RyaWN0XTtcbiAgfVxuXG4gIHBhcnNlU3RhdGVtZW50TGlzdEl0ZW0oKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgaWYgKHRoaXMuZW9mKCkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgfVxuICAgIHN3aXRjaCAodGhpcy5sb29rYWhlYWQudHlwZSkge1xuICAgICAgY2FzZSBUb2tlblR5cGUuRlVOQ1RJT046XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih0aGlzLnBhcnNlRnVuY3Rpb24oZmFsc2UpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkNPTlNUOlxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24odGhpcy5wYXJzZVZhcmlhYmxlRGVjbGFyYXRpb25TdGF0ZW1lbnQoKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICBjYXNlIFRva2VuVHlwZS5DTEFTUzpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VDbGFzcyhmYWxzZSk7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAodGhpcy5sb29rYWhlYWQudmFsdWUgPT09ICdsZXQnKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHRoaXMucGFyc2VWYXJpYWJsZURlY2xhcmF0aW9uU3RhdGVtZW50KCksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlU3RhdGVtZW50KCk7XG4gICAgfVxuICB9XG5cbiAgcGFyc2VTdGF0ZW1lbnQoKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgaWYgKHRoaXMuZW9mKCkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgfVxuICAgIHN3aXRjaCAodGhpcy5sb29rYWhlYWQudHlwZSkge1xuICAgICAgY2FzZSBUb2tlblR5cGUuU0VNSUNPTE9OOlxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24odGhpcy5wYXJzZUVtcHR5U3RhdGVtZW50KCksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgY2FzZSBUb2tlblR5cGUuTEJSQUNFOlxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24odGhpcy5wYXJzZUJsb2NrU3RhdGVtZW50KCksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgY2FzZSBUb2tlblR5cGUuTFBBUkVOOlxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24odGhpcy5wYXJzZUV4cHJlc3Npb25TdGF0ZW1lbnQoKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICBjYXNlIFRva2VuVHlwZS5CUkVBSzpcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHRoaXMucGFyc2VCcmVha1N0YXRlbWVudCgpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkNPTlRJTlVFOlxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24odGhpcy5wYXJzZUNvbnRpbnVlU3RhdGVtZW50KCksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgY2FzZSBUb2tlblR5cGUuREVCVUdHRVI6XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih0aGlzLnBhcnNlRGVidWdnZXJTdGF0ZW1lbnQoKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICBjYXNlIFRva2VuVHlwZS5ETzpcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHRoaXMucGFyc2VEb1doaWxlU3RhdGVtZW50KCksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgY2FzZSBUb2tlblR5cGUuRk9SOlxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24odGhpcy5wYXJzZUZvclN0YXRlbWVudCgpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLklGOlxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24odGhpcy5wYXJzZUlmU3RhdGVtZW50KCksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgY2FzZSBUb2tlblR5cGUuUkVUVVJOOlxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24odGhpcy5wYXJzZVJldHVyblN0YXRlbWVudCgpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlNXSVRDSDpcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHRoaXMucGFyc2VTd2l0Y2hTdGF0ZW1lbnQoKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICBjYXNlIFRva2VuVHlwZS5USFJPVzpcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHRoaXMucGFyc2VUaHJvd1N0YXRlbWVudCgpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlRSWTpcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHRoaXMucGFyc2VUcnlTdGF0ZW1lbnQoKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICBjYXNlIFRva2VuVHlwZS5WQVI6XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih0aGlzLnBhcnNlVmFyaWFibGVEZWNsYXJhdGlvblN0YXRlbWVudCgpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLldISUxFOlxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24odGhpcy5wYXJzZVdoaWxlU3RhdGVtZW50KCksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgY2FzZSBUb2tlblR5cGUuV0lUSDpcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHRoaXMucGFyc2VXaXRoU3RhdGVtZW50KCksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgY2FzZSBUb2tlblR5cGUuQ09OU1Q6XG4gICAgICBjYXNlIFRva2VuVHlwZS5GVU5DVElPTjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkNMQVNTOlxuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuXG4gICAgICBkZWZhdWx0OiB7XG4gICAgICAgIGxldCBleHByID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcblxuICAgICAgICAvLyAxMi4xMiBMYWJlbGxlZCBTdGF0ZW1lbnRzO1xuICAgICAgICBpZiAoZXhwci50eXBlID09PSBcIklkZW50aWZpZXJFeHByZXNzaW9uXCIgJiYgdGhpcy5lYXQoVG9rZW5UeXBlLkNPTE9OKSkge1xuICAgICAgICAgIGxldCBrZXkgPSBcIiRcIiArIGV4cHIuaWRlbnRpZmllci5uYW1lO1xuICAgICAgICAgIGlmICh7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRoaXMubGFiZWxTZXQsIGtleSkpIHtcbiAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5MQUJFTF9SRURFQ0xBUkFUSU9OLCBleHByLmlkZW50aWZpZXIubmFtZSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdGhpcy5sYWJlbFNldFtrZXldID0gdHJ1ZTtcbiAgICAgICAgICBsZXQgbGFiZWxlZEJvZHk7XG4gICAgICAgICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkZVTkNUSU9OKSkge1xuICAgICAgICAgICAgbGFiZWxlZEJvZHkgPSB0aGlzLnBhcnNlRnVuY3Rpb24oZmFsc2UsIGZhbHNlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGFiZWxlZEJvZHkgPSB0aGlzLnBhcnNlU3RhdGVtZW50KCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGRlbGV0ZSB0aGlzLmxhYmVsU2V0W2tleV07XG4gICAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5MYWJlbGVkU3RhdGVtZW50KGV4cHIuaWRlbnRpZmllciwgbGFiZWxlZEJvZHkpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmNvbnN1bWVTZW1pY29sb24oKTtcbiAgICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkV4cHJlc3Npb25TdGF0ZW1lbnQoZXhwciksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gIH1cblxuICBwYXJzZUVtcHR5U3RhdGVtZW50KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5TRU1JQ09MT04pO1xuICAgIHJldHVybiBuZXcgU2hpZnQuRW1wdHlTdGF0ZW1lbnQ7XG4gIH1cblxuICBwYXJzZUJsb2NrU3RhdGVtZW50KCkge1xuICAgIHJldHVybiBuZXcgU2hpZnQuQmxvY2tTdGF0ZW1lbnQodGhpcy5wYXJzZUJsb2NrKCkpO1xuICB9XG5cbiAgcGFyc2VFeHByZXNzaW9uU3RhdGVtZW50KCkge1xuICAgIGxldCBleHByID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICB0aGlzLmNvbnN1bWVTZW1pY29sb24oKTtcbiAgICByZXR1cm4gbmV3IFNoaWZ0LkV4cHJlc3Npb25TdGF0ZW1lbnQoZXhwcik7XG4gIH1cblxuICBwYXJzZUJyZWFrU3RhdGVtZW50KCkge1xuICAgIGxldCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5CUkVBSyk7XG5cbiAgICAvLyBDYXRjaCB0aGUgdmVyeSBjb21tb24gY2FzZSBmaXJzdDogaW1tZWRpYXRlbHkgYSBzZW1pY29sb24gKFUrMDAzQikuXG4gICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5TRU1JQ09MT04pKSB7XG4gICAgICBpZiAoISh0aGlzLmluSXRlcmF0aW9uIHx8IHRoaXMuaW5Td2l0Y2gpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuSUxMRUdBTF9CUkVBSyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuZXcgU2hpZnQuQnJlYWtTdGF0ZW1lbnQobnVsbCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0KSB7XG4gICAgICBpZiAoISh0aGlzLmluSXRlcmF0aW9uIHx8IHRoaXMuaW5Td2l0Y2gpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuSUxMRUdBTF9CUkVBSyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuZXcgU2hpZnQuQnJlYWtTdGF0ZW1lbnQobnVsbCk7XG4gICAgfVxuXG4gICAgbGV0IGxhYmVsID0gbnVsbDtcbiAgICBpZiAodGhpcy5sb29rYWhlYWQudHlwZSA9PSBUb2tlblR5cGUuSURFTlRJRklFUikge1xuICAgICAgbGFiZWwgPSB0aGlzLnBhcnNlSWRlbnRpZmllcigpO1xuXG4gICAgICBsZXQga2V5ID0gXCIkXCIgKyBsYWJlbC5uYW1lO1xuICAgICAgaWYgKCF7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRoaXMubGFiZWxTZXQsIGtleSkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlVOS05PV05fTEFCRUwsIGxhYmVsLm5hbWUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuY29uc3VtZVNlbWljb2xvbigpO1xuXG4gICAgaWYgKGxhYmVsID09IG51bGwgJiYgISh0aGlzLmluSXRlcmF0aW9uIHx8IHRoaXMuaW5Td2l0Y2gpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLklMTEVHQUxfQlJFQUspO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgU2hpZnQuQnJlYWtTdGF0ZW1lbnQobGFiZWwpO1xuICB9XG5cbiAgcGFyc2VDb250aW51ZVN0YXRlbWVudCgpIHtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuQ09OVElOVUUpO1xuXG4gICAgLy8gQ2F0Y2ggdGhlIHZlcnkgY29tbW9uIGNhc2UgZmlyc3Q6IGltbWVkaWF0ZWx5IGEgc2VtaWNvbG9uIChVKzAwM0IpLlxuICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuU0VNSUNPTE9OKSkge1xuICAgICAgaWYgKCF0aGlzLmluSXRlcmF0aW9uKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuSUxMRUdBTF9DT05USU5VRSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuZXcgU2hpZnQuQ29udGludWVTdGF0ZW1lbnQobnVsbCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0KSB7XG4gICAgICBpZiAoIXRoaXMuaW5JdGVyYXRpb24pIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5JTExFR0FMX0NPTlRJTlVFKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5ldyBTaGlmdC5Db250aW51ZVN0YXRlbWVudChudWxsKTtcbiAgICB9XG5cbiAgICBsZXQgbGFiZWwgPSBudWxsO1xuICAgIGlmICh0aGlzLmxvb2thaGVhZC50eXBlID09IFRva2VuVHlwZS5JREVOVElGSUVSKSB7XG4gICAgICBsYWJlbCA9IHRoaXMucGFyc2VJZGVudGlmaWVyKCk7XG5cbiAgICAgIGxldCBrZXkgPSBcIiRcIiArIGxhYmVsLm5hbWU7XG4gICAgICBpZiAoIXt9Lmhhc093blByb3BlcnR5LmNhbGwodGhpcy5sYWJlbFNldCwga2V5KSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5LTk9XTl9MQUJFTCwgbGFiZWwubmFtZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5jb25zdW1lU2VtaWNvbG9uKCk7XG4gICAgaWYgKCF0aGlzLmluSXRlcmF0aW9uKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLklMTEVHQUxfQ09OVElOVUUpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgU2hpZnQuQ29udGludWVTdGF0ZW1lbnQobGFiZWwpO1xuICB9XG5cblxuICBwYXJzZURlYnVnZ2VyU3RhdGVtZW50KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5ERUJVR0dFUik7XG4gICAgdGhpcy5jb25zdW1lU2VtaWNvbG9uKCk7XG4gICAgcmV0dXJuIG5ldyBTaGlmdC5EZWJ1Z2dlclN0YXRlbWVudDtcbiAgfVxuXG4gIHBhcnNlRG9XaGlsZVN0YXRlbWVudCgpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuRE8pO1xuICAgIGxldCBvbGRJbkl0ZXJhdGlvbiA9IHRoaXMuaW5JdGVyYXRpb247XG4gICAgdGhpcy5pbkl0ZXJhdGlvbiA9IHRydWU7XG5cbiAgICBsZXQgYm9keSA9IHRoaXMucGFyc2VTdGF0ZW1lbnQoKTtcbiAgICB0aGlzLmluSXRlcmF0aW9uID0gb2xkSW5JdGVyYXRpb247XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuV0hJTEUpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MUEFSRU4pO1xuICAgIGxldCB0ZXN0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcbiAgICB0aGlzLmVhdChUb2tlblR5cGUuU0VNSUNPTE9OKTtcblxuICAgIHJldHVybiBuZXcgU2hpZnQuRG9XaGlsZVN0YXRlbWVudChib2R5LCB0ZXN0KTtcbiAgfVxuXG4gIHN0YXRpYyB0cmFuc2Zvcm1EZXN0cnVjdHVyaW5nQXNzaWdubWVudChub2RlKSB7XG4gICAgc3dpdGNoIChub2RlLnR5cGUpIHtcbiAgICAgIGNhc2UgXCJPYmplY3RFeHByZXNzaW9uXCI6XG4gICAgICAgIHJldHVybiBjcExvYyhub2RlLCBuZXcgU2hpZnQuT2JqZWN0QmluZGluZyhcbiAgICAgICAgICBub2RlLnByb3BlcnRpZXMubWFwKFBhcnNlci50cmFuc2Zvcm1EZXN0cnVjdHVyaW5nQXNzaWdubWVudClcbiAgICAgICAgKSk7XG4gICAgICBjYXNlIFwiRGF0YVByb3BlcnR5XCI6XG4gICAgICAgIHJldHVybiBjcExvYyhub2RlLCBuZXcgU2hpZnQuQmluZGluZ1Byb3BlcnR5UHJvcGVydHkoXG4gICAgICAgICAgbm9kZS5uYW1lLFxuICAgICAgICAgIFBhcnNlci50cmFuc2Zvcm1EZXN0cnVjdHVyaW5nQXNzaWdubWVudChub2RlLmV4cHJlc3Npb24pXG4gICAgICAgICkpO1xuICAgICAgY2FzZSBcIlNob3J0aGFuZFByb3BlcnR5XCI6XG4gICAgICAgIHJldHVybiBjcExvYyhub2RlLCBuZXcgU2hpZnQuQmluZGluZ1Byb3BlcnR5SWRlbnRpZmllcihcbiAgICAgICAgICBjcExvYyhub2RlLCBuZXcgU2hpZnQuQmluZGluZ0lkZW50aWZpZXIobm9kZS5uYW1lKSksXG4gICAgICAgICAgbnVsbFxuICAgICAgICApKTtcbiAgICAgIGNhc2UgXCJBcnJheUV4cHJlc3Npb25cIjpcbiAgICAgICAgbGV0IGxhc3QgPSBub2RlLmVsZW1lbnRzW25vZGUuZWxlbWVudHMubGVuZ3RoIC0gMV07XG4gICAgICAgIGlmIChsYXN0ICE9IG51bGwgJiYgbGFzdC50eXBlID09PSBcIlNwcmVhZEVsZW1lbnRcIikge1xuICAgICAgICAgIHJldHVybiBjcExvYyhub2RlLCBuZXcgU2hpZnQuQXJyYXlCaW5kaW5nKFxuICAgICAgICAgICAgbm9kZS5lbGVtZW50cy5zbGljZSgwLCAtMSkubWFwKGUgPT4gZSAmJiBQYXJzZXIudHJhbnNmb3JtRGVzdHJ1Y3R1cmluZ0Fzc2lnbm1lbnQoZSkpLFxuICAgICAgICAgICAgY3BMb2MobGFzdC5leHByZXNzaW9uLCBuZXcgU2hpZnQuQmluZGluZ0lkZW50aWZpZXIobGFzdC5leHByZXNzaW9uLmlkZW50aWZpZXIpKVxuICAgICAgICAgICkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBjcExvYyhub2RlLCBuZXcgU2hpZnQuQXJyYXlCaW5kaW5nKFxuICAgICAgICAgICAgbm9kZS5lbGVtZW50cy5tYXAoZSA9PiBlICYmIFBhcnNlci50cmFuc2Zvcm1EZXN0cnVjdHVyaW5nQXNzaWdubWVudChlKSksXG4gICAgICAgICAgICBudWxsXG4gICAgICAgICAgKSk7XG4gICAgICAgIH1cbiAgICAgIGNhc2UgXCJBc3NpZ25tZW50RXhwcmVzc2lvblwiOlxuICAgICAgICByZXR1cm4gY3BMb2Mobm9kZSwgbmV3IFNoaWZ0LkJpbmRpbmdXaXRoRGVmYXVsdChcbiAgICAgICAgICBQYXJzZXIudHJhbnNmb3JtRGVzdHJ1Y3R1cmluZ0Fzc2lnbm1lbnQobm9kZS5iaW5kaW5nKSxcbiAgICAgICAgICBub2RlLmV4cHJlc3Npb25cbiAgICAgICAgKSk7XG4gICAgICBjYXNlIFwiSWRlbnRpZmllckV4cHJlc3Npb25cIjpcbiAgICAgICAgcmV0dXJuIGNwTG9jKG5vZGUsIG5ldyBTaGlmdC5CaW5kaW5nSWRlbnRpZmllcihub2RlLmlkZW50aWZpZXIpKTtcbiAgICB9XG4gICAgcmV0dXJuIG5vZGU7XG4gIH1cblxuICBzdGF0aWMgaXNEZXN0cnVjdHVyaW5nQXNzaWdubWVudFRhcmdldChub2RlKSB7XG4gICAgc3dpdGNoIChub2RlLnR5cGUpIHtcbiAgICAgIGNhc2UgXCJPYmplY3RFeHByZXNzaW9uXCI6XG4gICAgICAgIHJldHVybiBub2RlLnByb3BlcnRpZXMuZXZlcnkocCA9PlxuICAgICAgICAgIHAudHlwZSA9PT0gXCJCaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyXCIgfHxcbiAgICAgICAgICBwLnR5cGUgPT09IFwiU2hvcnRoYW5kUHJvcGVydHlcIiB8fFxuICAgICAgICAgIHAudHlwZSA9PT0gXCJEYXRhUHJvcGVydHlcIiAmJlxuICAgICAgICAgICAgUGFyc2VyLmlzRGVzdHJ1Y3R1cmluZ0Fzc2lnbm1lbnRUYXJnZXRXaXRoRGVmYXVsdChwLmV4cHJlc3Npb24pXG4gICAgICAgICk7XG4gICAgICBjYXNlIFwiQXJyYXlFeHByZXNzaW9uXCI6XG4gICAgICAgIGlmIChub2RlLmVsZW1lbnRzLmxlbmd0aCA9PT0gMClcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIGlmICghbm9kZS5lbGVtZW50cy5zbGljZSgwLCAtMSkuZmlsdGVyKGUgPT4gZSAhPSBudWxsKS5ldmVyeShQYXJzZXIuaXNEZXN0cnVjdHVyaW5nQXNzaWdubWVudFRhcmdldFdpdGhEZWZhdWx0KSlcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIGxldCBsYXN0ID0gbm9kZS5lbGVtZW50c1tub2RlLmVsZW1lbnRzLmxlbmd0aCAtIDFdO1xuICAgICAgICByZXR1cm4gbGFzdCAhPSBudWxsICYmIGxhc3QudHlwZSA9PT0gXCJTcHJlYWRFbGVtZW50XCJcbiAgICAgICAgICA/IGxhc3QuZXhwcmVzc2lvbi50eXBlID09PSBcIklkZW50aWZpZXJFeHByZXNzaW9uXCJcbiAgICAgICAgICA6IGxhc3QgPT0gbnVsbCB8fCBQYXJzZXIuaXNEZXN0cnVjdHVyaW5nQXNzaWdubWVudFRhcmdldFdpdGhEZWZhdWx0KGxhc3QpO1xuICAgICAgY2FzZSBcIkFycmF5QmluZGluZ1wiOlxuICAgICAgY2FzZSBcIkJpbmRpbmdJZGVudGlmaWVyXCI6XG4gICAgICBjYXNlIFwiQmluZGluZ1Byb3BlcnR5SWRlbnRpZmllclwiOlxuICAgICAgY2FzZSBcIkJpbmRpbmdQcm9wZXJ0eVByb3BlcnR5XCI6XG4gICAgICBjYXNlIFwiQmluZGluZ1dpdGhEZWZhdWx0XCI6XG4gICAgICBjYXNlIFwiSWRlbnRpZmllckV4cHJlc3Npb25cIjpcbiAgICAgIGNhc2UgXCJPYmplY3RCaW5kaW5nXCI6XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBzdGF0aWMgaXNEZXN0cnVjdHVyaW5nQXNzaWdubWVudFRhcmdldFdpdGhEZWZhdWx0KG5vZGUpIHtcbiAgICByZXR1cm4gUGFyc2VyLmlzRGVzdHJ1Y3R1cmluZ0Fzc2lnbm1lbnRUYXJnZXQobm9kZSkgfHxcbiAgICAgIG5vZGUudHlwZSA9PT0gXCJBc3NpZ25tZW50RXhwcmVzc2lvblwiICYmIG5vZGUub3BlcmF0b3IgPT09IFwiPVwiICYmXG4gICAgICBQYXJzZXIuaXNEZXN0cnVjdHVyaW5nQXNzaWdubWVudFRhcmdldChub2RlLmJpbmRpbmcpO1xuICB9XG5cbiAgc3RhdGljIGlzVmFsaWRTaW1wbGVBc3NpZ25tZW50VGFyZ2V0KG5vZGUpIHtcbiAgICBzd2l0Y2ggKG5vZGUudHlwZSkge1xuICAgICAgY2FzZSBcIklkZW50aWZpZXJFeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiQ29tcHV0ZWRNZW1iZXJFeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiU3RhdGljTWVtYmVyRXhwcmVzc2lvblwiOlxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgc3RhdGljIGJvdW5kTmFtZXMobm9kZSkge1xuICAgIHN3aXRjaChub2RlLnR5cGUpIHtcbiAgICAgIGNhc2UgXCJCaW5kaW5nSWRlbnRpZmllclwiOlxuICAgICAgICByZXR1cm4gW25vZGUuaWRlbnRpZmllci5uYW1lXTtcbiAgICAgIGNhc2UgXCJCaW5kaW5nV2l0aERlZmF1bHRcIjpcbiAgICAgICAgcmV0dXJuIFBhcnNlci5ib3VuZE5hbWVzKG5vZGUuYmluZGluZyk7XG4gICAgICBjYXNlIFwiQXJyYXlCaW5kaW5nXCI6IHtcbiAgICAgICAgbGV0IG5hbWVzID0gW107XG4gICAgICAgIG5vZGUuZWxlbWVudHMuZmlsdGVyKGUgPT4gZSAhPSBudWxsKS5mb3JFYWNoKGUgPT4gW10ucHVzaC5hcHBseShuYW1lcywgUGFyc2VyLmJvdW5kTmFtZXMoZSkpKTtcbiAgICAgICAgaWYgKG5vZGUucmVzdEVsZW1lbnQgIT0gbnVsbCkge1xuICAgICAgICAgIG5hbWVzLnB1c2gobm9kZS5yZXN0RWxlbWVudC5pZGVudGlmaWVyLm5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuYW1lcztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJPYmplY3RCaW5kaW5nXCI6IHtcbiAgICAgICAgbGV0IG5hbWVzID0gW107XG4gICAgICAgIG5vZGUucHJvcGVydGllcy5mb3JFYWNoKHAgPT4ge1xuICAgICAgICAgIHN3aXRjaCAocC50eXBlKSB7XG4gICAgICAgICAgICBjYXNlIFwiQmluZGluZ1Byb3BlcnR5SWRlbnRpZmllclwiOlxuICAgICAgICAgICAgICBuYW1lcy5wdXNoKHAuaWRlbnRpZmllci5pZGVudGlmaWVyLm5hbWUpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJCaW5kaW5nUHJvcGVydHlQcm9wZXJ0eVwiOlxuICAgICAgICAgICAgICBbXS5wdXNoLmFwcGx5KG5hbWVzLCBQYXJzZXIuYm91bmROYW1lcyhwLmJpbmRpbmcpKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAvLyBpc3RhbmJ1bCBpZ25vcmUgbmV4dFxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiYm91bmROYW1lcyBjYWxsZWQgb24gT2JqZWN0QmluZGluZyB3aXRoIGludmFsaWQgcHJvcGVydHk6IFwiICsgcC50eXBlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gbmFtZXM7XG4gICAgICB9XG4gICAgICBjYXNlIFwiQ29tcHV0ZWRNZW1iZXJFeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiU3RhdGljTWVtYmVyRXhwcmVzc2lvblwiOlxuICAgICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIC8vIGlzdGFuYnVsIGlnbm9yZSBuZXh0XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiYm91bmROYW1lcyBjYWxsZWQgb24gaW52YWxpZCBhc3NpZ25tZW50IHRhcmdldDogXCIgKyBub2RlLnR5cGUpO1xuICB9XG5cbiAgcGFyc2VGb3JTdGF0ZW1lbnQoKSB7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkZPUik7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgbGV0IHRlc3QgPSBudWxsO1xuICAgIGxldCByaWdodCA9IG51bGw7XG4gICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5TRU1JQ09MT04pKSB7XG4gICAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlNFTUlDT0xPTikpIHtcbiAgICAgICAgdGVzdCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICB9XG4gICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuU0VNSUNPTE9OKTtcbiAgICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuUlBBUkVOKSkge1xuICAgICAgICByaWdodCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbmV3IFNoaWZ0LkZvclN0YXRlbWVudChcbiAgICAgICAgICBudWxsLFxuICAgICAgICAgIHRlc3QsXG4gICAgICAgICAgcmlnaHQsXG4gICAgICAgICAgdGhpcy5nZXRJdGVyYXRvclN0YXRlbWVudEVwaWxvZ3VlKClcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5WQVIpIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLklERU5USUZJRVIpICYmIHRoaXMubG9va2FoZWFkLnZhbHVlID09PSAnbGV0Jykge1xuICAgICAgICBsZXQgcHJldmlvdXNBbGxvd0luID0gdGhpcy5hbGxvd0luO1xuICAgICAgICB0aGlzLmFsbG93SW4gPSBmYWxzZTtcbiAgICAgICAgbGV0IGluaXREZWNsID0gdGhpcy5wYXJzZVZhcmlhYmxlRGVjbGFyYXRpb24oKTtcbiAgICAgICAgdGhpcy5hbGxvd0luID0gcHJldmlvdXNBbGxvd0luO1xuXG4gICAgICAgIGlmIChpbml0RGVjbC5kZWNsYXJhdG9ycy5sZW5ndGggPT09IDEgJiYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLklOKSB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5PRikpKSB7XG4gICAgICAgICAgbGV0IHR5cGUgPSB0aGlzLm1hdGNoKFRva2VuVHlwZS5JTikgP1xuICAgICAgICAgICAgU2hpZnQuRm9ySW5TdGF0ZW1lbnQgOiBTaGlmdC5Gb3JPZlN0YXRlbWVudDtcbiAgICAgICAgICBpZiAoaW5pdERlY2wuZGVjbGFyYXRvcnNbMF0uaW5pdCAhPSBudWxsKSB7XG4gICAgICAgICAgICB0aHJvdyB0eXBlID09IFNoaWZ0LkZvckluU3RhdGVtZW50ID9cbiAgICAgICAgICAgICAgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLklOVkFMSURfVkFSX0lOSVRfRk9SX0lOKSA6XG4gICAgICAgICAgICAgIHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5JTlZBTElEX1ZBUl9JTklUX0ZPUl9PRik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMubGV4KCk7XG4gICAgICAgICAgcmlnaHQgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgICAgIHJldHVybiBuZXcgdHlwZShpbml0RGVjbCwgcmlnaHQsIHRoaXMuZ2V0SXRlcmF0b3JTdGF0ZW1lbnRFcGlsb2d1ZSgpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuU0VNSUNPTE9OKTtcbiAgICAgICAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlNFTUlDT0xPTikpIHtcbiAgICAgICAgICAgIHRlc3QgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuU0VNSUNPTE9OKTtcbiAgICAgICAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJQQVJFTikpIHtcbiAgICAgICAgICAgIHJpZ2h0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIG5ldyBTaGlmdC5Gb3JTdGF0ZW1lbnQoaW5pdERlY2wsIHRlc3QsIHJpZ2h0LCB0aGlzLmdldEl0ZXJhdG9yU3RhdGVtZW50RXBpbG9ndWUoKSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBwcmV2aW91c0FsbG93SW4gPSB0aGlzLmFsbG93SW47XG4gICAgICAgIHRoaXMuYWxsb3dJbiA9IGZhbHNlO1xuICAgICAgICBsZXQgaW5pdCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICAgIHRoaXMuYWxsb3dJbiA9IHByZXZpb3VzQWxsb3dJbjtcblxuICAgICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuSU4pIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLk9GKSkge1xuICAgICAgICAgIGlmICghUGFyc2VyLmlzVmFsaWRTaW1wbGVBc3NpZ25tZW50VGFyZ2V0KGluaXQpKSB7XG4gICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuSU5WQUxJRF9MSFNfSU5fRk9SX0lOKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsZXQgdHlwZSA9IHRoaXMubWF0Y2goVG9rZW5UeXBlLklOKSA/XG4gICAgICAgICAgICBTaGlmdC5Gb3JJblN0YXRlbWVudCA6IFNoaWZ0LkZvck9mU3RhdGVtZW50O1xuXG4gICAgICAgICAgdGhpcy5sZXgoKTtcbiAgICAgICAgICByaWdodCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG5cbiAgICAgICAgICByZXR1cm4gbmV3IHR5cGUoaW5pdCwgcmlnaHQsIHRoaXMuZ2V0SXRlcmF0b3JTdGF0ZW1lbnRFcGlsb2d1ZSgpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuU0VNSUNPTE9OKTtcbiAgICAgICAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlNFTUlDT0xPTikpIHtcbiAgICAgICAgICAgIHRlc3QgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuU0VNSUNPTE9OKTtcbiAgICAgICAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJQQVJFTikpIHtcbiAgICAgICAgICAgIHJpZ2h0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIG5ldyBTaGlmdC5Gb3JTdGF0ZW1lbnQoaW5pdCwgdGVzdCwgcmlnaHQsIHRoaXMuZ2V0SXRlcmF0b3JTdGF0ZW1lbnRFcGlsb2d1ZSgpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGdldEl0ZXJhdG9yU3RhdGVtZW50RXBpbG9ndWUoKSB7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJQQVJFTik7XG4gICAgbGV0IG9sZEluSXRlcmF0aW9uID0gdGhpcy5pbkl0ZXJhdGlvbjtcbiAgICB0aGlzLmluSXRlcmF0aW9uID0gdHJ1ZTtcbiAgICBsZXQgYm9keSA9IHRoaXMucGFyc2VTdGF0ZW1lbnQoKTtcbiAgICB0aGlzLmluSXRlcmF0aW9uID0gb2xkSW5JdGVyYXRpb247XG4gICAgcmV0dXJuIGJvZHk7XG4gIH1cblxuICBwYXJzZUlmU3RhdGVtZW50KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5JRik7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgbGV0IHRlc3QgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJQQVJFTik7XG4gICAgbGV0IGNvbnNlcXVlbnQgPSB0aGlzLnBhcnNlU3RhdGVtZW50KCk7XG4gICAgbGV0IGFsdGVybmF0ZSA9IG51bGw7XG4gICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5FTFNFKSkge1xuICAgICAgYWx0ZXJuYXRlID0gdGhpcy5wYXJzZVN0YXRlbWVudCgpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IFNoaWZ0LklmU3RhdGVtZW50KHRlc3QsIGNvbnNlcXVlbnQsIGFsdGVybmF0ZSk7XG4gIH1cblxuICBwYXJzZVJldHVyblN0YXRlbWVudCgpIHtcbiAgICBsZXQgYXJndW1lbnQgPSBudWxsO1xuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJFVFVSTik7XG4gICAgaWYgKCF0aGlzLmluRnVuY3Rpb25Cb2R5KSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuSUxMRUdBTF9SRVRVUk4pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCkge1xuICAgICAgcmV0dXJuIG5ldyBTaGlmdC5SZXR1cm5TdGF0ZW1lbnQobnVsbCk7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5TRU1JQ09MT04pKSB7XG4gICAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJCUkFDRSkgJiYgIXRoaXMuZW9mKCkpIHtcbiAgICAgICAgYXJndW1lbnQgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuY29uc3VtZVNlbWljb2xvbigpO1xuICAgIHJldHVybiBuZXcgU2hpZnQuUmV0dXJuU3RhdGVtZW50KGFyZ3VtZW50KTtcbiAgfVxuXG4gIHBhcnNlV2l0aFN0YXRlbWVudCgpIHtcbiAgICBpZiAodGhpcy5zdHJpY3QpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5TVFJJQ1RfTU9ERV9XSVRIKTtcbiAgICB9XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuV0lUSCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgbGV0IG9iamVjdCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJQQVJFTik7XG4gICAgbGV0IGJvZHkgPSB0aGlzLnBhcnNlU3RhdGVtZW50KCk7XG5cbiAgICByZXR1cm4gbmV3IFNoaWZ0LldpdGhTdGF0ZW1lbnQob2JqZWN0LCBib2R5KTtcbiAgfVxuXG4gIHBhcnNlU3dpdGNoU3RhdGVtZW50KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5TV0lUQ0gpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MUEFSRU4pO1xuICAgIGxldCBkaXNjcmltaW5hbnQgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MQlJBQ0UpO1xuXG4gICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5SQlJBQ0UpKSB7XG4gICAgICByZXR1cm4gbmV3IFNoaWZ0LlN3aXRjaFN0YXRlbWVudChkaXNjcmltaW5hbnQsIFtdKTtcbiAgICB9XG4gICAgbGV0IG9sZEluU3dpdGNoID0gdGhpcy5pblN3aXRjaDtcbiAgICB0aGlzLmluU3dpdGNoID0gdHJ1ZTtcblxuICAgIGxldCBjYXNlcyA9IHRoaXMucGFyc2VTd2l0Y2hDYXNlcygpO1xuXG4gICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkRFRkFVTFQpKSB7XG4gICAgICBsZXQgc3dpdGNoRGVmYXVsdCA9IHRoaXMucGFyc2VTd2l0Y2hEZWZhdWx0KCk7XG4gICAgICBsZXQgcG9zdERlZmF1bHRDYXNlcyA9IHRoaXMucGFyc2VTd2l0Y2hDYXNlcygpO1xuICAgICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkRFRkFVTFQpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5NVUxUSVBMRV9ERUZBVUxUU19JTl9TV0lUQ0gpO1xuICAgICAgfVxuICAgICAgdGhpcy5pblN3aXRjaCA9IG9sZEluU3dpdGNoO1xuICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJCUkFDRSk7XG4gICAgICByZXR1cm4gbmV3IFNoaWZ0LlN3aXRjaFN0YXRlbWVudFdpdGhEZWZhdWx0KGRpc2NyaW1pbmFudCwgY2FzZXMsIHN3aXRjaERlZmF1bHQsIHBvc3REZWZhdWx0Q2FzZXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmluU3dpdGNoID0gb2xkSW5Td2l0Y2g7XG4gICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUkJSQUNFKTtcbiAgICAgIHJldHVybiBuZXcgU2hpZnQuU3dpdGNoU3RhdGVtZW50KGRpc2NyaW1pbmFudCwgY2FzZXMpO1xuICAgIH1cbiAgfVxuXG4gIHBhcnNlU3dpdGNoQ2FzZXMoKSB7XG4gICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgIHdoaWxlICghKHRoaXMuZW9mKCkgfHwgdGhpcy5tYXRjaChUb2tlblR5cGUuUkJSQUNFKSB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5ERUZBVUxUKSkpIHtcbiAgICAgIHJlc3VsdC5wdXNoKHRoaXMucGFyc2VTd2l0Y2hDYXNlKCkpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgcGFyc2VTd2l0Y2hDYXNlKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5DQVNFKTtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlN3aXRjaENhc2UodGhpcy5wYXJzZUV4cHJlc3Npb24oKSwgdGhpcy5wYXJzZVN3aXRjaENhc2VCb2R5KCkpLCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlU3dpdGNoRGVmYXVsdCgpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuREVGQVVMVCk7XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5Td2l0Y2hEZWZhdWx0KHRoaXMucGFyc2VTd2l0Y2hDYXNlQm9keSgpKSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZVN3aXRjaENhc2VCb2R5KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5DT0xPTik7XG4gICAgcmV0dXJuIHRoaXMucGFyc2VTdGF0ZW1lbnRMaXN0SW5Td2l0Y2hDYXNlQm9keSgpO1xuICB9XG5cbiAgcGFyc2VTdGF0ZW1lbnRMaXN0SW5Td2l0Y2hDYXNlQm9keSgpIHtcbiAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgd2hpbGUgKCEodGhpcy5lb2YoKSB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0UpIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLkRFRkFVTFQpXG4gICAgfHwgdGhpcy5tYXRjaChUb2tlblR5cGUuQ0FTRSkpKSB7XG4gICAgICByZXN1bHQucHVzaCh0aGlzLnBhcnNlU3RhdGVtZW50KCkpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgcGFyc2VUaHJvd1N0YXRlbWVudCgpIHtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmV4cGVjdChUb2tlblR5cGUuVEhST1cpO1xuXG4gICAgaWYgKHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0KSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLk5FV0xJTkVfQUZURVJfVEhST1cpO1xuICAgIH1cblxuICAgIGxldCBhcmd1bWVudCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG5cbiAgICB0aGlzLmNvbnN1bWVTZW1pY29sb24oKTtcblxuICAgIHJldHVybiBuZXcgU2hpZnQuVGhyb3dTdGF0ZW1lbnQoYXJndW1lbnQpO1xuICB9XG5cbiAgcGFyc2VUcnlTdGF0ZW1lbnQoKSB7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlRSWSk7XG4gICAgbGV0IGJsb2NrID0gdGhpcy5wYXJzZUJsb2NrKCk7XG5cbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuQ0FUQ0gpKSB7XG4gICAgICBsZXQgaGFuZGxlciA9IHRoaXMucGFyc2VDYXRjaENsYXVzZSgpO1xuICAgICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5GSU5BTExZKSkge1xuICAgICAgICBsZXQgZmluYWxpemVyID0gdGhpcy5wYXJzZUJsb2NrKCk7XG4gICAgICAgIHJldHVybiBuZXcgU2hpZnQuVHJ5RmluYWxseVN0YXRlbWVudChibG9jaywgaGFuZGxlciwgZmluYWxpemVyKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgU2hpZnQuVHJ5Q2F0Y2hTdGF0ZW1lbnQoYmxvY2ssIGhhbmRsZXIpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuRklOQUxMWSkpIHtcbiAgICAgIGxldCBmaW5hbGl6ZXIgPSB0aGlzLnBhcnNlQmxvY2soKTtcbiAgICAgIHJldHVybiBuZXcgU2hpZnQuVHJ5RmluYWxseVN0YXRlbWVudChibG9jaywgbnVsbCwgZmluYWxpemVyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLk5PX0NBVENIX09SX0ZJTkFMTFkpO1xuICAgIH1cbiAgfVxuXG4gIHBhcnNlVmFyaWFibGVEZWNsYXJhdGlvblN0YXRlbWVudCgpIHtcbiAgICBsZXQgZGVjbGFyYXRpb24gPSB0aGlzLnBhcnNlVmFyaWFibGVEZWNsYXJhdGlvbigpO1xuICAgIHRoaXMuY29uc3VtZVNlbWljb2xvbigpO1xuICAgIHJldHVybiBuZXcgU2hpZnQuVmFyaWFibGVEZWNsYXJhdGlvblN0YXRlbWVudChkZWNsYXJhdGlvbik7XG4gIH1cblxuICBwYXJzZVdoaWxlU3RhdGVtZW50KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5XSElMRSk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgcmV0dXJuIG5ldyBTaGlmdC5XaGlsZVN0YXRlbWVudCh0aGlzLnBhcnNlRXhwcmVzc2lvbigpLCB0aGlzLmdldEl0ZXJhdG9yU3RhdGVtZW50RXBpbG9ndWUoKSk7XG4gIH1cblxuICBwYXJzZUNhdGNoQ2xhdXNlKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNBVENIKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTFBBUkVOKTtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuUlBBUkVOKSB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5MUEFSRU4pKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodG9rZW4pO1xuICAgIH1cblxuICAgIGxldCBwYXJhbSA9IHRoaXMucGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uKCk7XG5cbiAgICBpZiAoIVBhcnNlci5pc0Rlc3RydWN0dXJpbmdBc3NpZ25tZW50VGFyZ2V0KHBhcmFtKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRva2VuKTtcbiAgICB9XG4gICAgcGFyYW0gPSBQYXJzZXIudHJhbnNmb3JtRGVzdHJ1Y3R1cmluZ0Fzc2lnbm1lbnQocGFyYW0pO1xuXG4gICAgbGV0IGJvdW5kID0gUGFyc2VyLmJvdW5kTmFtZXMocGFyYW0pO1xuICAgIGlmIChmaXJzdER1cGxpY2F0ZShib3VuZCkgIT0gbnVsbCkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5EVVBMSUNBVEVfQklORElORywgZmlyc3REdXBsaWNhdGUoYm91bmQpKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5zdHJpY3QgJiYgYm91bmQuc29tZShpc1Jlc3RyaWN0ZWRXb3JkKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5TVFJJQ1RfQ0FUQ0hfVkFSSUFCTEUpO1xuICAgIH1cblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuXG4gICAgbGV0IGJvZHkgPSB0aGlzLnBhcnNlQmxvY2soKTtcblxuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQ2F0Y2hDbGF1c2UocGFyYW0sIGJvZHkpLCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlQmxvY2soKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxCUkFDRSk7XG5cbiAgICBsZXQgYm9keSA9IFtdO1xuICAgIHdoaWxlICghdGhpcy5tYXRjaChUb2tlblR5cGUuUkJSQUNFKSkge1xuICAgICAgYm9keS5wdXNoKHRoaXMucGFyc2VTdGF0ZW1lbnRMaXN0SXRlbSgpKTtcbiAgICB9XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJCUkFDRSk7XG5cbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkJsb2NrKGJvZHkpLCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlVmFyaWFibGVEZWNsYXJhdGlvbigpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxleCgpO1xuXG4gICAgLy8gUHJlY2VkZWQgYnkgdGhpcy5tYXRjaChUb2tlblN1YlR5cGUuVkFSKSB8fCB0aGlzLm1hdGNoKFRva2VuU3ViVHlwZS5MRVQpO1xuICAgIGxldCBraW5kID0gdG9rZW4udHlwZSA9PSBUb2tlblR5cGUuVkFSID8gXCJ2YXJcIiA6IHRva2VuLnR5cGUgPT09IFRva2VuVHlwZS5DT05TVCA/IFwiY29uc3RcIiA6IFwibGV0XCI7XG4gICAgbGV0IGRlY2xhcmF0b3JzID0gdGhpcy5wYXJzZVZhcmlhYmxlRGVjbGFyYXRvckxpc3Qoa2luZCk7XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5WYXJpYWJsZURlY2xhcmF0aW9uKGtpbmQsIGRlY2xhcmF0b3JzKSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZVZhcmlhYmxlRGVjbGFyYXRvckxpc3Qoa2luZCkge1xuICAgIGxldCByZXN1bHQgPSBbXTtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgcmVzdWx0LnB1c2godGhpcy5wYXJzZVZhcmlhYmxlRGVjbGFyYXRvcihraW5kKSk7XG4gICAgICBpZiAoIXRoaXMuZWF0KFRva2VuVHlwZS5DT01NQSkpIHtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwYXJzZVZhcmlhYmxlRGVjbGFyYXRvcihraW5kKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IHRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG5cbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuTFBBUkVOKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICB9XG4gICAgbGV0IGlkID0gdGhpcy5wYXJzZUxlZnRIYW5kU2lkZUV4cHJlc3Npb24oKTtcblxuICAgIGlmICghUGFyc2VyLmlzRGVzdHJ1Y3R1cmluZ0Fzc2lnbm1lbnRUYXJnZXQoaWQpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodG9rZW4pO1xuICAgIH1cbiAgICBpZCA9IFBhcnNlci50cmFuc2Zvcm1EZXN0cnVjdHVyaW5nQXNzaWdubWVudChpZCk7XG5cbiAgICBsZXQgYm91bmQgPSBQYXJzZXIuYm91bmROYW1lcyhpZCk7XG4gICAgaWYgKGZpcnN0RHVwbGljYXRlKGJvdW5kKSAhPSBudWxsKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLkRVUExJQ0FURV9CSU5ESU5HLCBmaXJzdER1cGxpY2F0ZShib3VuZCkpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnN0cmljdCAmJiBib3VuZC5zb21lKGlzUmVzdHJpY3RlZFdvcmQpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLlNUUklDVF9WQVJfTkFNRSk7XG4gICAgfVxuXG4gICAgbGV0IGluaXQgPSBudWxsO1xuICAgIGlmIChraW5kID09IFwiY29uc3RcIikge1xuICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkFTU0lHTik7XG4gICAgICBpbml0ID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgfSBlbHNlIGlmICh0aGlzLmVhdChUb2tlblR5cGUuQVNTSUdOKSkge1xuICAgICAgaW5pdCA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlZhcmlhYmxlRGVjbGFyYXRvcihpZCwgaW5pdCksIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VFeHByZXNzaW9uKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuXG4gICAgbGV0IGV4cHIgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcblxuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5DT01NQSkpIHtcbiAgICAgIHdoaWxlICghdGhpcy5lb2YoKSkge1xuICAgICAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLkNPTU1BKSkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubGV4KCk7XG4gICAgICAgIGV4cHIgPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQmluYXJ5RXhwcmVzc2lvbihcIixcIiwgZXhwciwgdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCkpLFxuICAgICAgICAgICAgc3RhcnRMb2NhdGlvbik7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBleHByO1xuICB9XG5cbiAgcGFyc2VBcnJvd0V4cHJlc3Npb25UYWlsKGhlYWQsIHN0YXJ0TG9jYXRpb24pIHtcbiAgICBsZXQgYXJyb3cgPSB0aGlzLmV4cGVjdChUb2tlblR5cGUuQVJST1cpO1xuXG4gICAgLy8gQ29udmVydCBwYXJhbSBsaXN0LlxuICAgIGxldCB7cGFyYW1zID0gbnVsbCwgcmVzdCA9IG51bGx9ID0gaGVhZDtcbiAgICBpZiAoaGVhZC50eXBlICE9PSBBUlJPV19FWFBSRVNTSU9OX1BBUkFNUykge1xuICAgICAgaWYgKGhlYWQudHlwZSA9PT0gXCJJZGVudGlmaWVyRXhwcmVzc2lvblwiKSB7XG4gICAgICAgIGxldCBuYW1lID0gaGVhZC5pZGVudGlmaWVyLm5hbWU7XG4gICAgICAgIGlmIChTVFJJQ1RfTU9ERV9SRVNFUlZFRF9XT1JELmhhc093blByb3BlcnR5KG5hbWUpKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlNUUklDVF9SRVNFUlZFRF9XT1JEKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNSZXN0cmljdGVkV29yZChuYW1lKSkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUEFSQU1fTkFNRSk7XG4gICAgICAgIH1cbiAgICAgICAgaGVhZCA9IFBhcnNlci50cmFuc2Zvcm1EZXN0cnVjdHVyaW5nQXNzaWdubWVudChoZWFkKTtcbiAgICAgICAgcGFyYW1zID0gW2hlYWRdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKGFycm93KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuTEJSQUNFKSkge1xuICAgICAgbGV0IHByZXZpb3VzWWllbGQgPSB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uO1xuICAgICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IGZhbHNlO1xuICAgICAgbGV0IFtib2R5XSA9IHRoaXMucGFyc2VGdW5jdGlvbkJvZHkoKTtcbiAgICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBwcmV2aW91c1lpZWxkO1xuICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5BcnJvd0V4cHJlc3Npb24ocGFyYW1zLCByZXN0LCBib2R5KSwgc3RhcnRMb2NhdGlvbik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBib2R5ID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkFycm93RXhwcmVzc2lvbihwYXJhbXMsIHJlc3QsIGJvZHkpLCBzdGFydExvY2F0aW9uKTtcbiAgICB9XG4gIH1cblxuICBwYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCkge1xuICAgIGxldCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuXG4gICAgaWYgKHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gJiYgIXRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXIgJiYgdGhpcy5sb29rYWhlYWQudmFsdWUgPT09ICd5aWVsZCcpIHtcbiAgICAgIHJldHVybiB0aGlzLnBhcnNlWWllbGRFeHByZXNzaW9uKCk7XG4gICAgfVxuXG4gICAgbGV0IG5vZGUgPSB0aGlzLnBhcnNlQ29uZGl0aW9uYWxFeHByZXNzaW9uKCk7XG5cbiAgICBpZiAoIXRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0ICYmIHRoaXMubWF0Y2goVG9rZW5UeXBlLkFSUk9XKSkge1xuICAgICAgcmV0dXJuIHRoaXMucGFyc2VBcnJvd0V4cHJlc3Npb25UYWlsKG5vZGUsIHN0YXJ0TG9jYXRpb24pXG4gICAgfVxuXG4gICAgbGV0IGlzT3BlcmF0b3IgPSBmYWxzZTtcbiAgICBsZXQgb3BlcmF0b3IgPSB0aGlzLmxvb2thaGVhZDtcbiAgICBzd2l0Y2ggKG9wZXJhdG9yLnR5cGUpIHtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9CSVRfT1I6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fQklUX1hPUjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9CSVRfQU5EOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX1NITDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9TSFI6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fU0hSX1VOU0lHTkVEOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX0FERDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9TVUI6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fTVVMOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX0RJVjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9NT0Q6XG4gICAgICAgIGlzT3BlcmF0b3IgPSB0cnVlO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gICAgaWYgKGlzT3BlcmF0b3IpIHtcbiAgICAgIGlmICghUGFyc2VyLmlzRGVzdHJ1Y3R1cmluZ0Fzc2lnbm1lbnRUYXJnZXQobm9kZSkgJiYgbm9kZS50eXBlICE9PSBcIkNvbXB1dGVkTWVtYmVyRXhwcmVzc2lvblwiICYmIG5vZGUudHlwZSAhPT0gXCJTdGF0aWNNZW1iZXJFeHByZXNzaW9uXCIpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLklOVkFMSURfTEhTX0lOX0FTU0lHTk1FTlQpO1xuICAgICAgfVxuICAgICAgbm9kZSA9IFBhcnNlci50cmFuc2Zvcm1EZXN0cnVjdHVyaW5nQXNzaWdubWVudChub2RlKTtcblxuICAgICAgbGV0IGJvdW5kID0gUGFyc2VyLmJvdW5kTmFtZXMobm9kZSk7XG4gICAgICBpZiAoZmlyc3REdXBsaWNhdGUoYm91bmQpICE9IG51bGwpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5EVVBMSUNBVEVfQklORElORywgZmlyc3REdXBsaWNhdGUoYm91bmQpKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuc3RyaWN0ICYmIGJvdW5kLnNvbWUoaXNSZXN0cmljdGVkV29yZCkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5TVFJJQ1RfTEhTX0FTU0lHTk1FTlQpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmxleCgpO1xuICAgICAgbGV0IHByZXZpb3VzSW5HZW5lcmF0b3JQYXJhbWV0ZXIgPSB0aGlzLmluR2VuZXJhdG9yUGFyYW1ldGVyO1xuICAgICAgdGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlciA9IGZhbHNlO1xuICAgICAgbGV0IHJpZ2h0ID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgICB0aGlzLmluR2VuZXJhdG9yUGFyYW1ldGVyID0gcHJldmlvdXNJbkdlbmVyYXRvclBhcmFtZXRlcjtcbiAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQXNzaWdubWVudEV4cHJlc3Npb24ob3BlcmF0b3IudHlwZS5uYW1lLCBub2RlLCByaWdodCksIHN0YXJ0TG9jYXRpb24pO1xuICAgIH1cblxuICAgIGlmIChcbiAgICAgIG5vZGUudHlwZSA9PT0gXCJPYmplY3RFeHByZXNzaW9uXCIgJiZcbiAgICAgIG5vZGUucHJvcGVydGllcy5zb21lKHAgPT4gcC50eXBlID09PSBcIkJpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXJcIilcbiAgICApIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZChvcGVyYXRvcik7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5vZGU7XG4gIH1cblxuICBsb29rYWhlYWRBc3NpZ25tZW50RXhwcmVzc2lvbigpIHtcbiAgICBzd2l0Y2ggKHRoaXMubG9va2FoZWFkLnR5cGUpIHtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFERDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9ESVY6XG4gICAgICBjYXNlIFRva2VuVHlwZS5DTEFTUzpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkRFQzpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkRJVjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkZBTFNFOlxuICAgICAgY2FzZSBUb2tlblR5cGUuRlVOQ1RJT046XG4gICAgICBjYXNlIFRva2VuVHlwZS5JREVOVElGSUVSOlxuICAgICAgY2FzZSBUb2tlblR5cGUuTEJSQUNFOlxuICAgICAgY2FzZSBUb2tlblR5cGUuTEJSQUNLOlxuICAgICAgY2FzZSBUb2tlblR5cGUuTFBBUkVOOlxuICAgICAgY2FzZSBUb2tlblR5cGUuTkVXOlxuICAgICAgY2FzZSBUb2tlblR5cGUuTk9UOlxuICAgICAgY2FzZSBUb2tlblR5cGUuTlVMTDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk5VTUJFUjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlNUUklORzpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlNVQjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlRISVM6XG4gICAgICBjYXNlIFRva2VuVHlwZS5UUlVFOlxuICAgICAgY2FzZSBUb2tlblR5cGUuWUlFTEQ6XG4gICAgICBjYXNlIFRva2VuVHlwZS5URU1QTEFURTpcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHBhcnNlWWllbGRFeHByZXNzaW9uKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuXG4gICAgdGhpcy5sZXgoKTtcbiAgICBpZiAodGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQpIHtcbiAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuWWllbGRFeHByZXNzaW9uKG51bGwpLCBzdGFydExvY2F0aW9uKTtcbiAgICB9XG4gICAgbGV0IGlzR2VuZXJhdG9yID0gISF0aGlzLmVhdChUb2tlblR5cGUuTVVMKTtcbiAgICBsZXQgcHJldmlvdXNZaWVsZCA9IHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb247XG4gICAgbGV0IGV4cHIgPSBudWxsO1xuICAgIGlmIChpc0dlbmVyYXRvciB8fCB0aGlzLmxvb2thaGVhZEFzc2lnbm1lbnRFeHByZXNzaW9uKCkpIHtcbiAgICAgIGV4cHIgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICB9XG4gICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IHByZXZpb3VzWWllbGQ7XG4gICAgbGV0IGNvbnMgPSBpc0dlbmVyYXRvciA/IFNoaWZ0LllpZWxkR2VuZXJhdG9yRXhwcmVzc2lvbiA6IFNoaWZ0LllpZWxkRXhwcmVzc2lvbjtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IGNvbnMoZXhwciksIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VDb25kaXRpb25hbEV4cHJlc3Npb24oKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IGV4cHIgPSB0aGlzLnBhcnNlQmluYXJ5RXhwcmVzc2lvbigpO1xuICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuQ09ORElUSU9OQUwpKSB7XG4gICAgICBsZXQgcHJldmlvdXNBbGxvd0luID0gdGhpcy5hbGxvd0luO1xuICAgICAgdGhpcy5hbGxvd0luID0gdHJ1ZTtcbiAgICAgIGxldCBjb25zZXF1ZW50ID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgICB0aGlzLmFsbG93SW4gPSBwcmV2aW91c0FsbG93SW47XG4gICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuQ09MT04pO1xuICAgICAgbGV0IGFsdGVybmF0ZSA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5Db25kaXRpb25hbEV4cHJlc3Npb24oZXhwciwgY29uc2VxdWVudCwgYWx0ZXJuYXRlKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgfVxuXG4gICAgcmV0dXJuIGV4cHI7XG4gIH1cblxuICBpc0JpbmFyeU9wZXJhdG9yKHR5cGUpIHtcbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk9SOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQU5EOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQklUX09SOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQklUX1hPUjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkJJVF9BTkQ6XG4gICAgICBjYXNlIFRva2VuVHlwZS5FUTpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk5FOlxuICAgICAgY2FzZSBUb2tlblR5cGUuRVFfU1RSSUNUOlxuICAgICAgY2FzZSBUb2tlblR5cGUuTkVfU1RSSUNUOlxuICAgICAgY2FzZSBUb2tlblR5cGUuTFQ6XG4gICAgICBjYXNlIFRva2VuVHlwZS5HVDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkxURTpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkdURTpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLklOU1RBTkNFT0Y6XG4gICAgICBjYXNlIFRva2VuVHlwZS5TSEw6XG4gICAgICBjYXNlIFRva2VuVHlwZS5TSFI6XG4gICAgICBjYXNlIFRva2VuVHlwZS5TSFJfVU5TSUdORUQ6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BREQ6XG4gICAgICBjYXNlIFRva2VuVHlwZS5TVUI6XG4gICAgICBjYXNlIFRva2VuVHlwZS5NVUw6XG4gICAgICBjYXNlIFRva2VuVHlwZS5ESVY6XG4gICAgICBjYXNlIFRva2VuVHlwZS5NT0Q6XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgY2FzZSBUb2tlblR5cGUuSU46XG4gICAgICAgIHJldHVybiB0aGlzLmFsbG93SW47XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgcGFyc2VCaW5hcnlFeHByZXNzaW9uKCkge1xuICAgIGxldCBsb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgbGVmdCA9IHRoaXMucGFyc2VVbmFyeUV4cHJlc3Npb24oKTtcbiAgICBsZXQgb3BlcmF0b3IgPSB0aGlzLmxvb2thaGVhZC50eXBlO1xuXG4gICAgbGV0IGlzQmluYXJ5T3BlcmF0b3IgPSB0aGlzLmlzQmluYXJ5T3BlcmF0b3Iob3BlcmF0b3IpO1xuICAgIGlmICghaXNCaW5hcnlPcGVyYXRvcikge1xuICAgICAgcmV0dXJuIGxlZnQ7XG4gICAgfVxuXG4gICAgdGhpcy5sZXgoKTtcbiAgICBsZXQgc3RhY2sgPSBbXTtcbiAgICBzdGFjay5wdXNoKHtsb2NhdGlvbiwgbGVmdCwgb3BlcmF0b3IsIHByZWNlZGVuY2U6IEJpbmFyeVByZWNlZGVuY2Vbb3BlcmF0b3IubmFtZV19KTtcbiAgICBsb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgcmlnaHQgPSB0aGlzLnBhcnNlVW5hcnlFeHByZXNzaW9uKCk7XG5cbiAgICBvcGVyYXRvciA9IHRoaXMubG9va2FoZWFkLnR5cGU7XG4gICAgaXNCaW5hcnlPcGVyYXRvciA9IHRoaXMuaXNCaW5hcnlPcGVyYXRvcih0aGlzLmxvb2thaGVhZC50eXBlKTtcbiAgICB3aGlsZSAoaXNCaW5hcnlPcGVyYXRvcikge1xuICAgICAgbGV0IHByZWNlZGVuY2UgPSBCaW5hcnlQcmVjZWRlbmNlW29wZXJhdG9yLm5hbWVdO1xuICAgICAgLy8gUmVkdWNlOiBtYWtlIGEgYmluYXJ5IGV4cHJlc3Npb24gZnJvbSB0aGUgdGhyZWUgdG9wbW9zdCBlbnRyaWVzLlxuICAgICAgd2hpbGUgKHN0YWNrLmxlbmd0aCAmJiAocHJlY2VkZW5jZSA8PSBzdGFja1tzdGFjay5sZW5ndGggLSAxXS5wcmVjZWRlbmNlKSkge1xuICAgICAgICBsZXQgc3RhY2tJdGVtID0gc3RhY2tbc3RhY2subGVuZ3RoIC0gMV07XG4gICAgICAgIGxldCBzdGFja09wZXJhdG9yID0gc3RhY2tJdGVtLm9wZXJhdG9yO1xuICAgICAgICBsZWZ0ID0gc3RhY2tJdGVtLmxlZnQ7XG4gICAgICAgIHN0YWNrLnBvcCgpO1xuICAgICAgICBsb2NhdGlvbiA9IHN0YWNrSXRlbS5sb2NhdGlvbjtcbiAgICAgICAgcmlnaHQgPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQmluYXJ5RXhwcmVzc2lvbihzdGFja09wZXJhdG9yLm5hbWUsIGxlZnQsIHJpZ2h0KSwgbG9jYXRpb24pO1xuICAgICAgfVxuXG4gICAgICAvLyBTaGlmdC5cbiAgICAgIHRoaXMubGV4KCk7XG4gICAgICBzdGFjay5wdXNoKHtsb2NhdGlvbiwgbGVmdDogcmlnaHQsIG9wZXJhdG9yLCBwcmVjZWRlbmNlfSk7XG4gICAgICBsb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICAgIHJpZ2h0ID0gdGhpcy5wYXJzZVVuYXJ5RXhwcmVzc2lvbigpO1xuXG4gICAgICBvcGVyYXRvciA9IHRoaXMubG9va2FoZWFkLnR5cGU7XG4gICAgICBpc0JpbmFyeU9wZXJhdG9yID0gdGhpcy5pc0JpbmFyeU9wZXJhdG9yKG9wZXJhdG9yKTtcbiAgICB9XG5cbiAgICAvLyBGaW5hbCByZWR1Y2UgdG8gY2xlYW4tdXAgdGhlIHN0YWNrLlxuICAgIHJldHVybiBzdGFjay5yZWR1Y2VSaWdodCgoZXhwciwgc3RhY2tJdGVtKSA9PlxuICAgICAgdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkJpbmFyeUV4cHJlc3Npb24oc3RhY2tJdGVtLm9wZXJhdG9yLm5hbWUsIHN0YWNrSXRlbS5sZWZ0LCBleHByKSwgc3RhY2tJdGVtLmxvY2F0aW9uKSxcbiAgICAgIHJpZ2h0KTtcbiAgfVxuXG4gIHN0YXRpYyBpc1ByZWZpeE9wZXJhdG9yKHR5cGUpIHtcbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLklOQzpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkRFQzpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFERDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlNVQjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkJJVF9OT1Q6XG4gICAgICBjYXNlIFRva2VuVHlwZS5OT1Q6XG4gICAgICBjYXNlIFRva2VuVHlwZS5ERUxFVEU6XG4gICAgICBjYXNlIFRva2VuVHlwZS5WT0lEOlxuICAgICAgY2FzZSBUb2tlblR5cGUuVFlQRU9GOlxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcGFyc2VVbmFyeUV4cHJlc3Npb24oKSB7XG4gICAgaWYgKHRoaXMubG9va2FoZWFkLnR5cGUua2xhc3MgIT0gVG9rZW5DbGFzcy5QdW5jdHVhdG9yICYmIHRoaXMubG9va2FoZWFkLnR5cGUua2xhc3MgIT0gVG9rZW5DbGFzcy5LZXl3b3JkKSB7XG4gICAgICByZXR1cm4gdGhpcy5wYXJzZVBvc3RmaXhFeHByZXNzaW9uKCk7XG4gICAgfVxuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCBvcGVyYXRvciA9IHRoaXMubG9va2FoZWFkO1xuICAgIGlmICghUGFyc2VyLmlzUHJlZml4T3BlcmF0b3Iob3BlcmF0b3IudHlwZSkpIHtcbiAgICAgIHJldHVybiB0aGlzLnBhcnNlUG9zdGZpeEV4cHJlc3Npb24oKTtcbiAgICB9XG4gICAgdGhpcy5sZXgoKTtcbiAgICBsZXQgZXhwciA9IHRoaXMucGFyc2VVbmFyeUV4cHJlc3Npb24oKTtcbiAgICBzd2l0Y2ggKG9wZXJhdG9yLnR5cGUpIHtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLklOQzpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkRFQzpcbiAgICAgICAgLy8gMTEuNC40LCAxMS40LjU7XG4gICAgICAgIGlmIChleHByLnR5cGUgPT09IFwiSWRlbnRpZmllckV4cHJlc3Npb25cIikge1xuICAgICAgICAgIGlmICh0aGlzLnN0cmljdCAmJiBpc1Jlc3RyaWN0ZWRXb3JkKGV4cHIuaWRlbnRpZmllci5uYW1lKSkge1xuICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlNUUklDVF9MSFNfUFJFRklYKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIVBhcnNlci5pc1ZhbGlkU2ltcGxlQXNzaWdubWVudFRhcmdldChleHByKSkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5JTlZBTElEX0xIU19JTl9BU1NJR05NRU5UKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkRFTEVURTpcbiAgICAgICAgaWYgKGV4cHIudHlwZSA9PT0gXCJJZGVudGlmaWVyRXhwcmVzc2lvblwiICYmIHRoaXMuc3RyaWN0KSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlNUUklDVF9ERUxFVEUpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5QcmVmaXhFeHByZXNzaW9uKG9wZXJhdG9yLnZhbHVlLCBleHByKSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZVBvc3RmaXhFeHByZXNzaW9uKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuXG4gICAgbGV0IGV4cHIgPSB0aGlzLnBhcnNlTGVmdEhhbmRTaWRlRXhwcmVzc2lvbih0cnVlKTtcblxuICAgIGlmICh0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCkge1xuICAgICAgcmV0dXJuIGV4cHI7XG4gICAgfVxuXG4gICAgbGV0IG9wZXJhdG9yID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgaWYgKChvcGVyYXRvci50eXBlICE9PSBUb2tlblR5cGUuSU5DKSAmJiAob3BlcmF0b3IudHlwZSAhPT0gVG9rZW5UeXBlLkRFQykpIHtcbiAgICAgIHJldHVybiBleHByO1xuICAgIH1cbiAgICB0aGlzLmxleCgpO1xuICAgIC8vIDExLjMuMSwgMTEuMy4yO1xuICAgIGlmIChleHByLnR5cGUgPT09IFwiSWRlbnRpZmllckV4cHJlc3Npb25cIikge1xuICAgICAgaWYgKHRoaXMuc3RyaWN0ICYmIGlzUmVzdHJpY3RlZFdvcmQoZXhwci5pZGVudGlmaWVyLm5hbWUpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5TVFJJQ1RfTEhTX1BPU1RGSVgpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIVBhcnNlci5pc1ZhbGlkU2ltcGxlQXNzaWdubWVudFRhcmdldChleHByKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLklOVkFMSURfTEhTX0lOX0FTU0lHTk1FTlQpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlBvc3RmaXhFeHByZXNzaW9uKGV4cHIsIG9wZXJhdG9yLnZhbHVlKSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZUxlZnRIYW5kU2lkZUV4cHJlc3Npb24oYWxsb3dDYWxsKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IHByZXZpb3VzQWxsb3dJbiA9IHRoaXMuYWxsb3dJbjtcbiAgICB0aGlzLmFsbG93SW4gPSBhbGxvd0NhbGw7XG5cbiAgICBsZXQgZXhwciwgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcblxuICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuU1VQRVIpKSB7XG4gICAgICBleHByID0gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlN1cGVyLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIGlmIChhbGxvd0NhbGwgJiYgdGhpcy5pbkNvbnN0cnVjdG9yICYmIHRoaXMubWF0Y2goVG9rZW5UeXBlLkxQQVJFTikpIHtcbiAgICAgICAgZXhwciA9IHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5DYWxsRXhwcmVzc2lvbihleHByLCB0aGlzLnBhcnNlQXJndW1lbnRMaXN0KCkpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5pbk1ldGhvZCAmJiB0aGlzLm1hdGNoKFRva2VuVHlwZS5MQlJBQ0spKSB7XG4gICAgICAgIGV4cHIgPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQ29tcHV0ZWRNZW1iZXJFeHByZXNzaW9uKGV4cHIsIHRoaXMucGFyc2VDb21wdXRlZE1lbWJlcigpKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuaW5NZXRob2QgJiYgdGhpcy5tYXRjaChUb2tlblR5cGUuUEVSSU9EKSkge1xuICAgICAgICBleHByID0gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlN0YXRpY01lbWJlckV4cHJlc3Npb24oZXhwciwgdGhpcy5wYXJzZU5vbkNvbXB1dGVkTWVtYmVyKCkpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0b2tlbik7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5ORVcpKSB7XG4gICAgICBleHByID0gdGhpcy5wYXJzZU5ld0V4cHJlc3Npb24oKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXhwciA9IHRoaXMucGFyc2VQcmltYXJ5RXhwcmVzc2lvbigpO1xuICAgIH1cblxuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBpZiAoYWxsb3dDYWxsICYmIHRoaXMubWF0Y2goVG9rZW5UeXBlLkxQQVJFTikpIHtcbiAgICAgICAgZXhwciA9IHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5DYWxsRXhwcmVzc2lvbihleHByLCB0aGlzLnBhcnNlQXJndW1lbnRMaXN0KCkpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuTEJSQUNLKSkge1xuICAgICAgICBleHByID0gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkNvbXB1dGVkTWVtYmVyRXhwcmVzc2lvbihleHByLCB0aGlzLnBhcnNlQ29tcHV0ZWRNZW1iZXIoKSksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5QRVJJT0QpKSB7XG4gICAgICAgIGV4cHIgPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuU3RhdGljTWVtYmVyRXhwcmVzc2lvbihleHByLCB0aGlzLnBhcnNlTm9uQ29tcHV0ZWRNZW1iZXIoKSksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5URU1QTEFURSkpIHtcbiAgICAgICAgZXhwciA9IHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5UZW1wbGF0ZVN0cmluZyhleHByLCB0aGlzLnBhcnNlVGVtcGxhdGVFbGVtZW50cygpKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmFsbG93SW4gPSBwcmV2aW91c0FsbG93SW47XG5cbiAgICByZXR1cm4gZXhwcjtcbiAgfVxuXG4gIHBhcnNlVGVtcGxhdGVFbGVtZW50cygpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICBpZiAodG9rZW4udGFpbCkge1xuICAgICAgdGhpcy5sZXgoKTtcbiAgICAgIHJldHVybiBbdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlRlbXBsYXRlTGl0ZXJhbCh0b2tlbi52YWx1ZS5zbGljZSgxLCAtMSkpLCBzdGFydExvY2F0aW9uKV07XG4gICAgfVxuICAgIGxldCByZXN1bHQgPSBbdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlRlbXBsYXRlTGl0ZXJhbCh0aGlzLmxleCgpLnZhbHVlLnNsaWNlKDEsIC0yKSksIHN0YXJ0TG9jYXRpb24pXTtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgcmVzdWx0LnB1c2godGhpcy5wYXJzZUV4cHJlc3Npb24oKSk7XG4gICAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJCUkFDRSkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICB9XG4gICAgICB0aGlzLmluZGV4ID0gdGhpcy5zdGFydEluZGV4O1xuICAgICAgdGhpcy5saW5lID0gdGhpcy5zdGFydExpbmU7XG4gICAgICB0aGlzLmxpbmVTdGFydCA9IHRoaXMuc3RhcnRMaW5lU3RhcnQ7XG4gICAgICB0aGlzLmxvb2thaGVhZCA9IHRoaXMuc2NhblRlbXBsYXRlTGl0ZXJhbCgpO1xuICAgICAgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICAgIHRva2VuID0gdGhpcy5sZXgoKTtcbiAgICAgIGlmICh0b2tlbi50YWlsKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5UZW1wbGF0ZUxpdGVyYWwodG9rZW4udmFsdWUuc2xpY2UoMSwgLTEpKSwgc3RhcnRMb2NhdGlvbikpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0LnB1c2godGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlRlbXBsYXRlTGl0ZXJhbCh0b2tlbi52YWx1ZS5zbGljZSgxLCAtMikpLCBzdGFydExvY2F0aW9uKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcGFyc2VOb25Db21wdXRlZE1lbWJlcigpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUEVSSU9EKTtcbiAgICBpZiAoIXRoaXMubG9va2FoZWFkLnR5cGUua2xhc3MuaXNJZGVudGlmaWVyTmFtZSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMubGV4KCkudmFsdWU7XG4gICAgfVxuICB9XG5cbiAgcGFyc2VDb21wdXRlZE1lbWJlcigpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTEJSQUNLKTtcbiAgICBsZXQgZXhwciA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJCUkFDSyk7XG4gICAgcmV0dXJuIGV4cHI7XG4gIH1cblxuICBwYXJzZU5ld0V4cHJlc3Npb24oKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLk5FVyk7XG4gICAgaWYgKHRoaXMuaW5GdW5jdGlvbkJvZHkgJiYgdGhpcy5lYXQoVG9rZW5UeXBlLlBFUklPRCkpIHtcbiAgICAgIGxldCBpZGVudCA9IHRoaXMuZXhwZWN0KFRva2VuVHlwZS5JREVOVElGSUVSKTtcbiAgICAgIGlmIChpZGVudC52YWx1ZSAhPT0gXCJ0YXJnZXRcIikge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQoaWRlbnQpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5OZXdUYXJnZXRFeHByZXNzaW9uLCBzdGFydExvY2F0aW9uKTtcbiAgICB9XG4gICAgbGV0IGNhbGxlZSA9IHRoaXMucGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uKCk7XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5OZXdFeHByZXNzaW9uKFxuICAgICAgY2FsbGVlLFxuICAgICAgdGhpcy5tYXRjaChUb2tlblR5cGUuTFBBUkVOKSA/IHRoaXMucGFyc2VBcmd1bWVudExpc3QoKSA6IFtdXG4gICAgKSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZVByaW1hcnlFeHByZXNzaW9uKCkge1xuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5MUEFSRU4pKSB7XG4gICAgICByZXR1cm4gdGhpcy5wYXJzZUdyb3VwRXhwcmVzc2lvbigpO1xuICAgIH1cblxuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuXG4gICAgc3dpdGNoICh0aGlzLmxvb2thaGVhZC50eXBlKSB7XG4gICAgICBjYXNlIFRva2VuVHlwZS5ZSUVMRDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLklERU5USUZJRVI6XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuSWRlbnRpZmllckV4cHJlc3Npb24odGhpcy5wYXJzZUlkZW50aWZpZXIoKSksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgY2FzZSBUb2tlblR5cGUuU1RSSU5HOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZVN0cmluZ0xpdGVyYWwoKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk5VTUJFUjpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VOdW1lcmljTGl0ZXJhbCgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuVEhJUzpcbiAgICAgICAgdGhpcy5sZXgoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5UaGlzRXhwcmVzc2lvbiwgc3RhcnRMb2NhdGlvbik7XG4gICAgICBjYXNlIFRva2VuVHlwZS5GVU5DVElPTjpcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHRoaXMucGFyc2VGdW5jdGlvbih0cnVlKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICBjYXNlIFRva2VuVHlwZS5UUlVFOlxuICAgICAgICB0aGlzLmxleCgpO1xuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkxpdGVyYWxCb29sZWFuRXhwcmVzc2lvbih0cnVlKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICBjYXNlIFRva2VuVHlwZS5GQUxTRTpcbiAgICAgICAgdGhpcy5sZXgoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5MaXRlcmFsQm9vbGVhbkV4cHJlc3Npb24oZmFsc2UpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk5VTEw6XG4gICAgICAgIHRoaXMubGV4KCk7XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuTGl0ZXJhbE51bGxFeHByZXNzaW9uLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkxCUkFDSzpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VBcnJheUV4cHJlc3Npb24oKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkxCUkFDRTpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VPYmplY3RFeHByZXNzaW9uKCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5URU1QTEFURTpcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5UZW1wbGF0ZVN0cmluZyhudWxsLCB0aGlzLnBhcnNlVGVtcGxhdGVFbGVtZW50cygpKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICBjYXNlIFRva2VuVHlwZS5ESVY6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fRElWOlxuICAgICAgICB0aGlzLmxvb2thaGVhZCA9IHRoaXMuc2NhblJlZ0V4cCh0aGlzLmxvb2thaGVhZC50eXBlID09PSBUb2tlblR5cGUuRElWID8gXCIvXCIgOiBcIi89XCIpO1xuICAgICAgICBsZXQgdG9rZW4gPSB0aGlzLmxleCgpO1xuICAgICAgICBsZXQgbGFzdFNsYXNoID0gdG9rZW4udmFsdWUubGFzdEluZGV4T2YoXCIvXCIpO1xuICAgICAgICBsZXQgcGF0dGVybiA9IHRva2VuLnZhbHVlLnNsaWNlKDEsIGxhc3RTbGFzaCkucmVwbGFjZShcIlxcXFwvXCIsIFwiL1wiKTtcbiAgICAgICAgbGV0IGZsYWdzID0gdG9rZW4udmFsdWUuc2xpY2UobGFzdFNsYXNoICsgMSk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgUmVnRXhwKHBhdHRlcm4sIGZsYWdzKTtcbiAgICAgICAgfSBjYXRjaCAodW51c2VkKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5JTlZBTElEX1JFR1VMQVJfRVhQUkVTU0lPTik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5MaXRlcmFsUmVnRXhwRXhwcmVzc2lvbihwYXR0ZXJuLCBmbGFncyksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgY2FzZSBUb2tlblR5cGUuQ0xBU1M6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlQ2xhc3ModHJ1ZSk7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sZXgoKSk7XG4gICAgfVxuICB9XG5cbiAgcGFyc2VOdW1lcmljTGl0ZXJhbCgpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBpZiAodGhpcy5zdHJpY3QgJiYgdGhpcy5sb29rYWhlYWQub2N0YWwpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odGhpcy5sb29rYWhlYWQsIEVycm9yTWVzc2FnZXMuU1RSSUNUX09DVEFMX0xJVEVSQUwpO1xuICAgIH1cbiAgICBsZXQgdG9rZW4yID0gdGhpcy5sZXgoKTtcbiAgICBsZXQgbm9kZSA9IHRva2VuMi5fdmFsdWUgPT09IDEvMFxuICAgICAgPyBuZXcgU2hpZnQuTGl0ZXJhbEluZmluaXR5RXhwcmVzc2lvblxuICAgICAgOiBuZXcgU2hpZnQuTGl0ZXJhbE51bWVyaWNFeHByZXNzaW9uKHRva2VuMi5fdmFsdWUpO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihub2RlLCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlU3RyaW5nTGl0ZXJhbCgpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBpZiAodGhpcy5zdHJpY3QgJiYgdGhpcy5sb29rYWhlYWQub2N0YWwpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odGhpcy5sb29rYWhlYWQsIEVycm9yTWVzc2FnZXMuU1RSSUNUX09DVEFMX0xJVEVSQUwpO1xuICAgIH1cbiAgICBsZXQgdG9rZW4yID0gdGhpcy5sZXgoKTtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkxpdGVyYWxTdHJpbmdFeHByZXNzaW9uKHRva2VuMi5fdmFsdWUsIHRva2VuMi5zbGljZS50ZXh0KSxcbiAgICAgICAgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZUlkZW50aWZpZXJOYW1lKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGlmICh0aGlzLmxvb2thaGVhZC50eXBlLmtsYXNzLmlzSWRlbnRpZmllck5hbWUpIHtcbiAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuSWRlbnRpZmllcih0aGlzLmxleCgpLnZhbHVlKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgfVxuICB9XG5cbiAgcGFyc2VJZGVudGlmaWVyKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5ZSUVMRCkpIHtcbiAgICAgIGlmICh0aGlzLnN0cmljdCkge1xuICAgICAgICB0aGlzLmxvb2thaGVhZC50eXBlID0gVG9rZW5UeXBlLkZVVFVSRV9TVFJJQ1RfUkVTRVJWRURfV09SRDtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbikge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLmluR2VuZXJhdG9yQm9keSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuSWRlbnRpZmllcih0aGlzLmxleCgpLnZhbHVlKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuSWRlbnRpZmllcih0aGlzLmV4cGVjdChUb2tlblR5cGUuSURFTlRJRklFUikudmFsdWUpLCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlQXJndW1lbnRMaXN0KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MUEFSRU4pO1xuICAgIGxldCBhcmdzID0gdGhpcy5wYXJzZUFyZ3VtZW50cygpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgIHJldHVybiBhcmdzO1xuICB9XG5cbiAgcGFyc2VBcmd1bWVudHMoKSB7XG4gICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuUlBBUkVOKSB8fCB0aGlzLmVvZigpKSB7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9XG4gICAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICAgIGxldCBhcmc7XG4gICAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLkVMTElQU0lTKSkge1xuICAgICAgICBhcmcgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgICAgYXJnID0gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlNwcmVhZEVsZW1lbnQoYXJnKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhcmcgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgIH1cbiAgICAgIHJlc3VsdC5wdXNoKGFyZyk7XG4gICAgICBpZiAoIXRoaXMuZWF0KFRva2VuVHlwZS5DT01NQSkpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvLyAxMS4yIExlZnQtSGFuZC1TaWRlIEV4cHJlc3Npb25zO1xuXG4gIGVuc3VyZUFycm93KCkge1xuICAgIGlmICh0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlVORVhQRUNURURfTElORV9URVJNSU5BVE9SKTtcbiAgICB9XG4gICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5BUlJPVykpIHtcbiAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5BUlJPVyk7XG4gICAgfVxuICB9XG5cbiAgcGFyc2VHcm91cEV4cHJlc3Npb24oKSB7XG4gICAgbGV0IHJlc3QgPSBudWxsO1xuICAgIGxldCBzdGFydCA9IHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MUEFSRU4pO1xuICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuUlBBUkVOKSkge1xuICAgICAgdGhpcy5lbnN1cmVBcnJvdygpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogQVJST1dfRVhQUkVTU0lPTl9QQVJBTVMsXG4gICAgICAgIHBhcmFtczogW10sXG4gICAgICAgIHJlc3Q6IG51bGxcbiAgICAgIH07XG4gICAgfSBlbHNlIGlmICh0aGlzLmVhdChUb2tlblR5cGUuRUxMSVBTSVMpKSB7XG4gICAgICByZXN0ID0gbmV3IFNoaWZ0LkJpbmRpbmdJZGVudGlmaWVyKHRoaXMucGFyc2VJZGVudGlmaWVyKCkpO1xuICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJQQVJFTik7XG4gICAgICB0aGlzLmVuc3VyZUFycm93KCk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiBBUlJPV19FWFBSRVNTSU9OX1BBUkFNUyxcbiAgICAgICAgcGFyYW1zOiBbXSxcbiAgICAgICAgcmVzdDogcmVzdFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBsZXQgcG9zc2libGVCaW5kaW5ncyA9ICF0aGlzLm1hdGNoKFRva2VuVHlwZS5MUEFSRU4pO1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCBncm91cCA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgIGxldCBwYXJhbXMgPSBbZ3JvdXBdO1xuXG4gICAgd2hpbGUgKHRoaXMuZWF0KFRva2VuVHlwZS5DT01NQSkpIHtcbiAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5FTExJUFNJUykpIHtcbiAgICAgICAgaWYgKCFwb3NzaWJsZUJpbmRpbmdzKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxleCgpO1xuICAgICAgICByZXN0ID0gbmV3IFNoaWZ0LkJpbmRpbmdJZGVudGlmaWVyKHRoaXMucGFyc2VJZGVudGlmaWVyKCkpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHBvc3NpYmxlQmluZGluZ3MgPSBwb3NzaWJsZUJpbmRpbmdzICYmICF0aGlzLm1hdGNoKFRva2VuVHlwZS5MUEFSRU4pO1xuICAgICAgbGV0IGV4cHIgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgIHBhcmFtcy5wdXNoKGV4cHIpO1xuICAgICAgZ3JvdXAgPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQmluYXJ5RXhwcmVzc2lvbihcIixcIiwgZ3JvdXAsIGV4cHIpLCBzdGFydExvY2F0aW9uKTtcbiAgICB9XG5cbiAgICBpZiAocG9zc2libGVCaW5kaW5ncykge1xuICAgICAgcG9zc2libGVCaW5kaW5ncyA9IHBhcmFtcy5ldmVyeShQYXJzZXIuaXNEZXN0cnVjdHVyaW5nQXNzaWdubWVudFRhcmdldFdpdGhEZWZhdWx0KTtcbiAgICB9XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcblxuICAgIGlmICghdGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQgJiYgdGhpcy5tYXRjaChUb2tlblR5cGUuQVJST1cpKSB7XG4gICAgICBpZiAoIXBvc3NpYmxlQmluZGluZ3MpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbihzdGFydCwgRXJyb3JNZXNzYWdlcy5JTExFR0FMX0FSUk9XX0ZVTkNUSU9OX1BBUkFNUyk7XG4gICAgICB9XG4gICAgICAvLyBjaGVjayBkdXAgcGFyYW1zXG4gICAgICBwYXJhbXMgPSBwYXJhbXMubWFwKFBhcnNlci50cmFuc2Zvcm1EZXN0cnVjdHVyaW5nQXNzaWdubWVudCk7XG4gICAgICBsZXQgYWxsQm91bmROYW1lcyA9IFtdO1xuICAgICAgcGFyYW1zLmZvckVhY2goZXhwciA9PiB7XG4gICAgICAgIGxldCBib3VuZE5hbWVzID0gUGFyc2VyLmJvdW5kTmFtZXMoZXhwcik7XG4gICAgICAgIGxldCBkdXAgPSBmaXJzdER1cGxpY2F0ZShib3VuZE5hbWVzKTtcbiAgICAgICAgaWYgKGR1cCkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5EVVBMSUNBVEVfQklORElORywgZHVwKTtcbiAgICAgICAgfVxuICAgICAgICBhbGxCb3VuZE5hbWVzID0gYWxsQm91bmROYW1lcy5jb25jYXQoYm91bmROYW1lcylcbiAgICAgIH0pO1xuICAgICAgaWYgKHJlc3QpIHtcbiAgICAgICAgYWxsQm91bmROYW1lcy5wdXNoKHJlc3QuaWRlbnRpZmllci5uYW1lKTtcbiAgICAgIH1cblxuICAgICAgbGV0IGR1cCA9IGZpcnN0RHVwbGljYXRlKGFsbEJvdW5kTmFtZXMpO1xuICAgICAgaWYgKGR1cCkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX1BBUkFNX0RVUEUpO1xuICAgICAgfVxuXG4gICAgICBsZXQgc3RyaWN0X3Jlc3RyaWN0ZWRfd29yZCA9IGFsbEJvdW5kTmFtZXMuc29tZShpc1Jlc3RyaWN0ZWRXb3JkKTtcbiAgICAgIGlmIChzdHJpY3RfcmVzdHJpY3RlZF93b3JkKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUEFSQU1fTkFNRSk7XG4gICAgICB9XG5cbiAgICAgIGxldCBzdHJpY3RfcmVzZXJ2ZWRfd29yZCA9IGhhc1N0cmljdE1vZGVSZXNlcnZlZFdvcmQoYWxsQm91bmROYW1lcyk7XG4gICAgICBpZiAoc3RyaWN0X3Jlc2VydmVkX3dvcmQpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlNUUklDVF9SRVNFUlZFRF9XT1JEKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogQVJST1dfRVhQUkVTU0lPTl9QQVJBTVMsXG4gICAgICAgIHBhcmFtcyxcbiAgICAgICAgcmVzdFxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHJlc3QpIHtcbiAgICAgICAgdGhpcy5lbnN1cmVBcnJvdygpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGdyb3VwO1xuICAgIH1cbiAgfVxuXG5cbiAgcGFyc2VBcnJheUV4cHJlc3Npb24oKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTEJSQUNLKTtcblxuICAgIGxldCBlbGVtZW50cyA9IHRoaXMucGFyc2VBcnJheUV4cHJlc3Npb25FbGVtZW50cygpO1xuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJCUkFDSyk7XG5cbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkFycmF5RXhwcmVzc2lvbihlbGVtZW50cyksIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VBcnJheUV4cHJlc3Npb25FbGVtZW50cygpIHtcbiAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0spKSB7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9XG4gICAgICBsZXQgZWw7XG5cbiAgICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuQ09NTUEpKSB7XG4gICAgICAgIGVsID0gbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgICAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLkVMTElQU0lTKSkge1xuICAgICAgICAgIGVsID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgICAgICAgZWwgPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuU3ByZWFkRWxlbWVudChlbCksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVsID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0spKSB7XG4gICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNPTU1BKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmVzdWx0LnB1c2goZWwpO1xuICAgIH1cbiAgfVxuXG4gIHBhcnNlT2JqZWN0RXhwcmVzc2lvbigpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MQlJBQ0UpO1xuXG4gICAgbGV0IHByb3BlcnRpZXMgPSB0aGlzLnBhcnNlT2JqZWN0RXhwcmVzc2lvbkl0ZW1zKCk7XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUkJSQUNFKTtcblxuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuT2JqZWN0RXhwcmVzc2lvbihwcm9wZXJ0aWVzKSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuXG4gIHBhcnNlT2JqZWN0RXhwcmVzc2lvbkl0ZW1zKCkge1xuICAgIGxldCByZXN1bHQgPSBbXTtcbiAgICBsZXQgaGFzX19wcm90b19fID0gW2ZhbHNlXTtcbiAgICB3aGlsZSAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJCUkFDRSkpIHtcbiAgICAgIHJlc3VsdC5wdXNoKHRoaXMucGFyc2VQcm9wZXJ0eURlZmluaXRpb24oaGFzX19wcm90b19fKSk7XG4gICAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJCUkFDRSkpIHtcbiAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNPTU1BKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHBhcnNlUHJvcGVydHlEZWZpbml0aW9uKGhhc19fcHJvdG9fXykge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuXG4gICAgbGV0IHttZXRob2RPcktleSwga2luZH0gPSB0aGlzLnBhcnNlTWV0aG9kRGVmaW5pdGlvbihmYWxzZSk7XG4gICAgc3dpdGNoIChraW5kKSB7XG4gICAgICBjYXNlIFwibWV0aG9kXCI6XG4gICAgICAgIHJldHVybiBtZXRob2RPcktleTtcbiAgICAgIGNhc2UgXCJpZGVudGlmaWVyXCI6IC8vIElkZW50aWZpZXJSZWZlcmVuY2UsXG4gICAgICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuQVNTSUdOKSkge1xuICAgICAgICAgIC8vIENvdmVySW5pdGlhbGl6ZWROYW1lXG4gICAgICAgICAgaWYgKCh0aGlzLnN0cmljdCB8fCB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uKSAmJiBtZXRob2RPcktleS52YWx1ZSA9PT0gJ3lpZWxkJykge1xuICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRva2VuKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5CaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyKFxuICAgICAgICAgICAgICBuZXcgU2hpZnQuQmluZGluZ0lkZW50aWZpZXIobmV3IFNoaWZ0LklkZW50aWZpZXIobWV0aG9kT3JLZXkudmFsdWUpKSxcbiAgICAgICAgICAgICAgdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCkpLFxuICAgICAgICAgICAgc3RhcnRMb2NhdGlvbik7XG4gICAgICAgIH0gZWxzZSBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLkNPTE9OKSkge1xuICAgICAgICAgIGlmICh0b2tlbi50eXBlICE9PSBUb2tlblR5cGUuSURFTlRJRklFUiAmJiB0b2tlbi50eXBlICE9PSBUb2tlblR5cGUuWUlFTEQgfHxcbiAgICAgICAgICAgICh0aGlzLnN0cmljdCB8fCB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uKSAmJiBtZXRob2RPcktleS52YWx1ZSA9PT0gJ3lpZWxkJykge1xuICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRva2VuKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5TaG9ydGhhbmRQcm9wZXJ0eShuZXcgU2hpZnQuSWRlbnRpZmllcihtZXRob2RPcktleS52YWx1ZSkpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIERhdGFQcm9wZXJ0eVxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5DT0xPTik7XG4gICAgaWYgKG1ldGhvZE9yS2V5LnR5cGUgPT09IFwiU3RhdGljUHJvcGVydHlOYW1lXCIpIHtcbiAgICAgIGlmIChtZXRob2RPcktleS52YWx1ZSA9PT0gXCJfX3Byb3RvX19cIikge1xuICAgICAgICBpZiAoIWhhc19fcHJvdG9fX1swXSkge1xuICAgICAgICAgIGhhc19fcHJvdG9fX1swXSA9IHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5EVVBMSUNBVEVfUFJPVE9fUFJPUEVSVFkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuRGF0YVByb3BlcnR5KFxuICAgICAgICBtZXRob2RPcktleSxcbiAgICAgICAgdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCkpLFxuICAgICAgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZVByb3BlcnR5TmFtZSgpIHtcbiAgICAvLyBQcm9wZXJ0eU5hbWVbWWllbGQsR2VuZXJhdG9yUGFyYW1ldGVyXTpcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcblxuICAgIGlmICh0aGlzLmVvZigpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodG9rZW4pO1xuICAgIH1cblxuICAgIHN3aXRjaCAodG9rZW4udHlwZSkge1xuICAgICAgY2FzZSBUb2tlblR5cGUuU1RSSU5HOlxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlN0YXRpY1Byb3BlcnR5TmFtZSh0aGlzLnBhcnNlU3RyaW5nTGl0ZXJhbCgpLnZhbHVlKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICBjYXNlIFRva2VuVHlwZS5OVU1CRVI6XG4gICAgICAgIGxldCBudW1MaXRlcmFsID0gdGhpcy5wYXJzZU51bWVyaWNMaXRlcmFsKCk7XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuU3RhdGljUHJvcGVydHlOYW1lKFwiXCIgKyAobnVtTGl0ZXJhbC50eXBlID09PSBcIkxpdGVyYWxJbmZpbml0eUV4cHJlc3Npb25cIiA/IDEgLyAwIDogbnVtTGl0ZXJhbC52YWx1ZSkpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkxCUkFDSzpcbiAgICAgICAgbGV0IHByZXZpb3VzWWllbGQgPSB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uO1xuICAgICAgICBpZiAodGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlcikge1xuICAgICAgICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTEJSQUNLKTtcbiAgICAgICAgbGV0IGV4cHIgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJCUkFDSyk7XG4gICAgICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBwcmV2aW91c1lpZWxkO1xuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkNvbXB1dGVkUHJvcGVydHlOYW1lKGV4cHIpLCBzdGFydExvY2F0aW9uKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlN0YXRpY1Byb3BlcnR5TmFtZSh0aGlzLnBhcnNlSWRlbnRpZmllck5hbWUoKS5uYW1lKSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICAvKipcbiAgICogVGVzdCBpZiBsb29rYWhlYWQgY2FuIGJlIHRoZSBiZWdpbm5pbmcgb2YgYSBgUHJvcGVydHlOYW1lYC5cbiAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAqL1xuICBsb29rYWhlYWRQcm9wZXJ0eU5hbWUoKSB7XG4gICAgc3dpdGNoICh0aGlzLmxvb2thaGVhZC50eXBlKSB7XG4gICAgICBjYXNlIFRva2VuVHlwZS5OVU1CRVI6XG4gICAgICBjYXNlIFRva2VuVHlwZS5TVFJJTkc6XG4gICAgICBjYXNlIFRva2VuVHlwZS5MQlJBQ0s6XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHRoaXMubG9va2FoZWFkLnR5cGUua2xhc3MuaXNJZGVudGlmaWVyTmFtZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVHJ5IHRvIHBhcnNlIGEgbWV0aG9kIGRlZmluaXRpb24uXG4gICAqXG4gICAqIElmIGl0IHR1cm5zIG91dCB0byBiZSBvbmUgb2Y6XG4gICAqICAqIGBJZGVudGlmaWVyUmVmZXJlbmNlYFxuICAgKiAgKiBgQ292ZXJJbml0aWFsaXplZE5hbWVgIChgSWRlbnRpZmllclJlZmVyZW5jZSBcIj1cIiBBc3NpZ25tZW50RXhwcmVzc2lvbmApXG4gICAqICAqIGBQcm9wZXJ0eU5hbWUgOiBBc3NpZ25tZW50RXhwcmVzc2lvbmBcbiAgICogVGhlIHRoZSBwYXJzZXIgd2lsbCBzdG9wIGF0IHRoZSBlbmQgb2YgdGhlIGxlYWRpbmcgYElkZW50aWZpZXJgIG9yIGBQcm9wZXJ0eU5hbWVgIGFuZCByZXR1cm4gaXQuXG4gICAqXG4gICAqIEByZXR1cm5zIHt7bWV0aG9kT3JLZXk6IChTaGlmdC5NZXRob2R8U2hpZnQuUHJvcGVydHlOYW1lKSwga2luZDogc3RyaW5nfX1cbiAgICovXG4gIHBhcnNlTWV0aG9kRGVmaW5pdGlvbihpc0NsYXNzUHJvdG9NZXRob2QpIHtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcblxuICAgIGxldCBpc0dlbmVyYXRvciA9ICEhdGhpcy5lYXQoVG9rZW5UeXBlLk1VTCk7XG5cbiAgICBsZXQga2V5ID0gdGhpcy5wYXJzZVByb3BlcnR5TmFtZSgpO1xuXG4gICAgaWYgKCFpc0dlbmVyYXRvciAmJiB0b2tlbi50eXBlID09PSBUb2tlblR5cGUuSURFTlRJRklFUikge1xuICAgICAgbGV0IG5hbWUgPSB0b2tlbi52YWx1ZTtcbiAgICAgIGlmIChuYW1lLmxlbmd0aCA9PT0gMykge1xuICAgICAgICAvLyBQcm9wZXJ0eSBBc3NpZ25tZW50OiBHZXR0ZXIgYW5kIFNldHRlci5cbiAgICAgICAgaWYgKFwiZ2V0XCIgPT09IG5hbWUgJiYgdGhpcy5sb29rYWhlYWRQcm9wZXJ0eU5hbWUoKSkge1xuICAgICAgICAgIGtleSA9IHRoaXMucGFyc2VQcm9wZXJ0eU5hbWUoKTtcbiAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTFBBUkVOKTtcbiAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcbiAgICAgICAgICBsZXQgcHJldmlvdXNJbkNvbnN0cnVjdG9yID0gdGhpcy5pbkNvbnN0cnVjdG9yO1xuICAgICAgICAgIHRoaXMuaW5Db25zdHJ1Y3RvciA9IGZhbHNlO1xuICAgICAgICAgIGxldCBwcmV2aW91c0luTWV0aG9kID0gdGhpcy5pbk1ldGhvZDtcbiAgICAgICAgICB0aGlzLmluTWV0aG9kID0gdHJ1ZTtcbiAgICAgICAgICBsZXQgW2JvZHldID0gdGhpcy5wYXJzZUZ1bmN0aW9uQm9keSgpO1xuICAgICAgICAgIHRoaXMuaW5Db25zdHJ1Y3RvciA9IHByZXZpb3VzSW5Db25zdHJ1Y3RvcjtcbiAgICAgICAgICB0aGlzLmluTWV0aG9kID0gcHJldmlvdXNJbk1ldGhvZDtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbWV0aG9kT3JLZXk6IHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5HZXR0ZXIoa2V5LCBib2R5KSwgc3RhcnRMb2NhdGlvbiksXG4gICAgICAgICAgICBraW5kOiBcIm1ldGhvZFwiXG4gICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIGlmIChcInNldFwiID09PSBuYW1lICYmIHRoaXMubG9va2FoZWFkUHJvcGVydHlOYW1lKCkpIHtcbiAgICAgICAgICBrZXkgPSB0aGlzLnBhcnNlUHJvcGVydHlOYW1lKCk7XG4gICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgICAgICAgbGV0IHBhcmFtID0gdGhpcy5wYXJzZVBhcmFtKCk7XG4gICAgICAgICAgbGV0IGluZm8gPSB7fTtcbiAgICAgICAgICB0aGlzLmNoZWNrUGFyYW0ocGFyYW0sIHRva2VuLCBbXSwgaW5mbyk7XG4gICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJQQVJFTik7XG4gICAgICAgICAgbGV0IHByZXZpb3VzWWllbGQgPSB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uO1xuICAgICAgICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBmYWxzZTtcbiAgICAgICAgICBsZXQgcHJldmlvdXNJbkNvbnN0cnVjdG9yID0gdGhpcy5pbkNvbnN0cnVjdG9yO1xuICAgICAgICAgIHRoaXMuaW5Db25zdHJ1Y3RvciA9IGZhbHNlO1xuICAgICAgICAgIGxldCBwcmV2aW91c0luTWV0aG9kID0gdGhpcy5pbk1ldGhvZDtcbiAgICAgICAgICB0aGlzLmluTWV0aG9kID0gdHJ1ZTtcbiAgICAgICAgICBsZXQgW2JvZHksIGlzU3RyaWN0XSA9IHRoaXMucGFyc2VGdW5jdGlvbkJvZHkoKTtcbiAgICAgICAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gcHJldmlvdXNZaWVsZDtcbiAgICAgICAgICB0aGlzLmluQ29uc3RydWN0b3IgPSBwcmV2aW91c0luQ29uc3RydWN0b3I7XG4gICAgICAgICAgdGhpcy5pbk1ldGhvZCA9IHByZXZpb3VzSW5NZXRob2Q7XG4gICAgICAgICAgaWYgKGlzU3RyaWN0KSB7XG4gICAgICAgICAgICBpZiAoaW5mby5maXJzdFJlc3RyaWN0ZWQpIHtcbiAgICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbihpbmZvLmZpcnN0UmVzdHJpY3RlZCwgaW5mby5tZXNzYWdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG1ldGhvZE9yS2V5OiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuU2V0dGVyKGtleSwgcGFyYW0sIGJvZHkpLCBzdGFydExvY2F0aW9uKSxcbiAgICAgICAgICAgIGtpbmQ6IFwibWV0aG9kXCJcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkxQQVJFTikpIHtcbiAgICAgIGxldCBwcmV2aW91c1lpZWxkID0gdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbjtcbiAgICAgIGxldCBwcmV2aW91c0luR2VuZXJhdG9yUGFyYW1ldGVyID0gdGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlcjtcbiAgICAgIHRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXIgPSBpc0dlbmVyYXRvcjtcbiAgICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBpc0dlbmVyYXRvcjtcbiAgICAgIGxldCBwYXJhbUluZm8gPSB0aGlzLnBhcnNlUGFyYW1zKG51bGwpO1xuICAgICAgdGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlciA9IHByZXZpb3VzSW5HZW5lcmF0b3JQYXJhbWV0ZXI7XG4gICAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gcHJldmlvdXNZaWVsZDtcblxuICAgICAgbGV0IHByZXZpb3VzSW5HZW5lcmF0b3JCb2R5ID0gdGhpcy5pbkdlbmVyYXRvckJvZHk7XG4gICAgICBsZXQgcHJldmlvdXNJbkNvbnN0cnVjdG9yID0gdGhpcy5pbkNvbnN0cnVjdG9yO1xuICAgICAgbGV0IHByZXZpb3VzSW5NZXRob2QgPSB0aGlzLmluTWV0aG9kO1xuICAgICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IGlzR2VuZXJhdG9yO1xuICAgICAgdGhpcy5pbkNvbnN0cnVjdG9yID1cbiAgICAgICAgaXNDbGFzc1Byb3RvTWV0aG9kICYmICFpc0dlbmVyYXRvciAmJiB0aGlzLmhhc0NsYXNzSGVyaXRhZ2UgJiZcbiAgICAgICAga2V5LnR5cGUgPT09IFwiU3RhdGljUHJvcGVydHlOYW1lXCIgJiYga2V5LnZhbHVlID09PSBcImNvbnN0cnVjdG9yXCI7XG4gICAgICB0aGlzLmluTWV0aG9kID0gdHJ1ZTtcblxuICAgICAgaWYgKGlzR2VuZXJhdG9yKSB7XG4gICAgICAgIHRoaXMuaW5HZW5lcmF0b3JCb2R5ID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGxldCBbYm9keV0gPSB0aGlzLnBhcnNlRnVuY3Rpb25Cb2R5KCk7XG4gICAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gcHJldmlvdXNZaWVsZDtcbiAgICAgIHRoaXMuaW5HZW5lcmF0b3JCb2R5ID0gcHJldmlvdXNJbkdlbmVyYXRvckJvZHk7XG4gICAgICB0aGlzLmluQ29uc3RydWN0b3IgPSBwcmV2aW91c0luQ29uc3RydWN0b3I7XG4gICAgICB0aGlzLmluTWV0aG9kID0gcHJldmlvdXNJbk1ldGhvZDtcblxuICAgICAgaWYgKHBhcmFtSW5mby5maXJzdFJlc3RyaWN0ZWQpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbihwYXJhbUluZm8uZmlyc3RSZXN0cmljdGVkLCBwYXJhbUluZm8ubWVzc2FnZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4ge1xuICAgICAgICBtZXRob2RPcktleTogdGhpcy5tYXJrTG9jYXRpb24oXG4gICAgICAgICAgbmV3IFNoaWZ0Lk1ldGhvZChpc0dlbmVyYXRvciwga2V5LCBwYXJhbUluZm8ucGFyYW1zLCBwYXJhbUluZm8ucmVzdCwgYm9keSksIHN0YXJ0TG9jYXRpb24pLFxuICAgICAgICBraW5kOiBcIm1ldGhvZFwiXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBtZXRob2RPcktleToga2V5LFxuICAgICAga2luZDogdG9rZW4udHlwZS5rbGFzcy5pc0lkZW50aWZpZXJOYW1lID8gXCJpZGVudGlmaWVyXCIgOiBcInByb3BlcnR5XCJcbiAgICB9O1xuICB9XG5cbiAgcGFyc2VDbGFzcyhpc0V4cHIpIHtcbiAgICBsZXQgbG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNMQVNTKTtcbiAgICBsZXQgaWQgPSBudWxsO1xuICAgIGxldCBoZXJpdGFnZSA9IG51bGw7XG4gICAgaWYgKCFpc0V4cHIgfHwgdGhpcy5tYXRjaChUb2tlblR5cGUuSURFTlRJRklFUikpIHtcbiAgICAgIGxldCBsb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICAgIGlkID0gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkJpbmRpbmdJZGVudGlmaWVyKHRoaXMucGFyc2VJZGVudGlmaWVyKCkpLCBsb2NhdGlvbik7XG4gICAgfVxuXG4gICAgbGV0IHByZXZpb3VzSW5HZW5lcmF0b3JQYXJhbWV0ZXIgPSB0aGlzLmluR2VuZXJhdG9yUGFyYW1ldGVyO1xuICAgIGxldCBwcmV2aW91c1BhcmFtWWllbGQgPSB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uO1xuICAgIGxldCBwcmV2aW91c0hhc0NsYXNzSGVyaXRhZ2UgPSB0aGlzLmhhc0NsYXNzSGVyaXRhZ2U7XG4gICAgaWYgKGlzRXhwcikge1xuICAgICAgdGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlciA9IGZhbHNlO1xuICAgICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IGZhbHNlO1xuICAgIH1cbiAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLkVYVEVORFMpKSB7XG4gICAgICBoZXJpdGFnZSA9IHRoaXMucGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uKHRydWUpO1xuICAgIH1cblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MQlJBQ0UpO1xuICAgIGxldCBvcmlnaW5hbFN0cmljdCA9IHRoaXMuc3RyaWN0O1xuICAgIHRoaXMuc3RyaWN0ID0gdHJ1ZTtcbiAgICBsZXQgbWV0aG9kcyA9IFtdO1xuICAgIGxldCBoYXNDb25zdHJ1Y3RvciA9IGZhbHNlO1xuICAgIHRoaXMuaGFzQ2xhc3NIZXJpdGFnZSA9IGhlcml0YWdlICE9IG51bGw7XG4gICAgd2hpbGUgKCF0aGlzLmVhdChUb2tlblR5cGUuUkJSQUNFKSkge1xuICAgICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5TRU1JQ09MT04pKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgbGV0IG1ldGhvZFRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgICBsZXQgaXNTdGF0aWMgPSBmYWxzZTtcbiAgICAgIGxldCB7bWV0aG9kT3JLZXksIGtpbmR9ID0gdGhpcy5wYXJzZU1ldGhvZERlZmluaXRpb24odHJ1ZSk7XG4gICAgICBpZiAoa2luZCA9PT0gJ2lkZW50aWZpZXInICYmIG1ldGhvZE9yS2V5LnZhbHVlID09PSAnc3RhdGljJykge1xuICAgICAgICBpc1N0YXRpYyA9IHRydWU7XG4gICAgICAgICh7bWV0aG9kT3JLZXksIGtpbmR9ID0gdGhpcy5wYXJzZU1ldGhvZERlZmluaXRpb24oZmFsc2UpKTtcbiAgICAgIH1cbiAgICAgIHN3aXRjaCAoa2luZCkge1xuICAgICAgICBjYXNlIFwibWV0aG9kXCI6XG4gICAgICAgICAgbGV0IGtleSA9IG1ldGhvZE9yS2V5Lm5hbWU7XG4gICAgICAgICAgaWYgKCFpc1N0YXRpYykge1xuICAgICAgICAgICAgaWYgKGtleS50eXBlID09PSBcIlN0YXRpY1Byb3BlcnR5TmFtZVwiICYmIGtleS52YWx1ZSA9PT0gXCJjb25zdHJ1Y3RvclwiKSB7XG4gICAgICAgICAgICAgIGlmIChtZXRob2RPcktleS50eXBlICE9PSBcIk1ldGhvZFwiIHx8IG1ldGhvZE9yS2V5LmlzR2VuZXJhdG9yKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbihtZXRob2RUb2tlbiwgXCJDb25zdHJ1Y3RvcnMgY2Fubm90IGJlIGdlbmVyYXRvcnMsIGdldHRlcnMgb3Igc2V0dGVyc1wiKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoaGFzQ29uc3RydWN0b3IpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKG1ldGhvZFRva2VuLCBcIk9ubHkgb25lIGNvbnN0cnVjdG9yIGlzIGFsbG93ZWQgaW4gYSBjbGFzc1wiKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBoYXNDb25zdHJ1Y3RvciA9IHRydWU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKGtleS50eXBlID09PSBcIlN0YXRpY1Byb3BlcnR5TmFtZVwiICYmIGtleS52YWx1ZSA9PT0gXCJwcm90b3R5cGVcIikge1xuICAgICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKG1ldGhvZFRva2VuLCBcIlN0YXRpYyBjbGFzcyBtZXRob2RzIGNhbm5vdCBiZSBuYW1lZCAncHJvdG90eXBlJ1wiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgbWV0aG9kcy5wdXNoKG5ldyBTaGlmdC5DbGFzc0VsZW1lbnQoaXNTdGF0aWMsIG1ldGhvZE9yS2V5KSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihcIk9ubHkgbWV0aG9kcyBhcmUgYWxsb3dlZCBpbiBjbGFzc2VzXCIpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnN0cmljdCA9IG9yaWdpbmFsU3RyaWN0O1xuICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBwcmV2aW91c1BhcmFtWWllbGQ7XG4gICAgdGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlciA9IHByZXZpb3VzSW5HZW5lcmF0b3JQYXJhbWV0ZXI7XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyAoaXNFeHByID8gU2hpZnQuQ2xhc3NFeHByZXNzaW9uIDogU2hpZnQuQ2xhc3NEZWNsYXJhdGlvbikoaWQsIGhlcml0YWdlLCBtZXRob2RzKSwgbG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VGdW5jdGlvbihpc0V4cHIsIGFsbG93R2VuZXJhdG9yID0gdHJ1ZSkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkZVTkNUSU9OKTtcblxuICAgIGxldCBpZCA9IG51bGw7XG4gICAgbGV0IG1lc3NhZ2UgPSBudWxsO1xuICAgIGxldCBmaXJzdFJlc3RyaWN0ZWQgPSBudWxsO1xuICAgIGxldCBpc0dlbmVyYXRvciA9IGFsbG93R2VuZXJhdG9yICYmICEhdGhpcy5lYXQoVG9rZW5UeXBlLk1VTCk7XG4gICAgbGV0IHByZXZpb3VzR2VuZXJhdG9yUGFyYW1ldGVyID0gdGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlcjtcbiAgICBsZXQgcHJldmlvdXNZaWVsZCA9IHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb247XG4gICAgbGV0IHByZXZpb3VzSW5HZW5lcmF0b3JCb2R5ID0gdGhpcy5pbkdlbmVyYXRvckJvZHk7XG5cbiAgICBpZiAoIWlzRXhwciB8fCAhdGhpcy5tYXRjaChUb2tlblR5cGUuTFBBUkVOKSkge1xuICAgICAgbGV0IHRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICAgIGlkID0gdGhpcy5wYXJzZUlkZW50aWZpZXIoKTtcbiAgICAgIGlmICh0aGlzLnN0cmljdCkge1xuICAgICAgICBpZiAoaXNSZXN0cmljdGVkV29yZChpZC5uYW1lKSkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuU1RSSUNUX0ZVTkNUSU9OX05BTUUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoaXNSZXN0cmljdGVkV29yZChpZC5uYW1lKSkge1xuICAgICAgICAgIGZpcnN0UmVzdHJpY3RlZCA9IHRva2VuO1xuICAgICAgICAgIG1lc3NhZ2UgPSBFcnJvck1lc3NhZ2VzLlNUUklDVF9GVU5DVElPTl9OQU1FO1xuICAgICAgICB9IGVsc2UgaWYgKGlzU3RyaWN0TW9kZVJlc2VydmVkV29yZEVTNShpZC5uYW1lKSkge1xuICAgICAgICAgIGZpcnN0UmVzdHJpY3RlZCA9IHRva2VuO1xuICAgICAgICAgIG1lc3NhZ2UgPSBFcnJvck1lc3NhZ2VzLlNUUklDVF9SRVNFUlZFRF9XT1JEO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZCA9IHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5CaW5kaW5nSWRlbnRpZmllcihpZCksIHN0YXJ0TG9jYXRpb24pO1xuICAgIH1cbiAgICB0aGlzLmluR2VuZXJhdG9yUGFyYW1ldGVyID0gaXNHZW5lcmF0b3I7XG4gICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IGlzR2VuZXJhdG9yO1xuICAgIGxldCBpbmZvID0gdGhpcy5wYXJzZVBhcmFtcyhmaXJzdFJlc3RyaWN0ZWQpO1xuICAgIHRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXIgPSBwcmV2aW91c0dlbmVyYXRvclBhcmFtZXRlcjtcbiAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gcHJldmlvdXNZaWVsZDtcblxuICAgIGlmIChpbmZvLm1lc3NhZ2UgIT0gbnVsbCkge1xuICAgICAgbWVzc2FnZSA9IGluZm8ubWVzc2FnZTtcbiAgICB9XG5cbiAgICBsZXQgcHJldmlvdXNTdHJpY3QgPSB0aGlzLnN0cmljdDtcbiAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gaXNHZW5lcmF0b3I7XG4gICAgaWYgKGlzR2VuZXJhdG9yKSB7XG4gICAgICB0aGlzLmluR2VuZXJhdG9yQm9keSA9IHRydWU7XG4gICAgfVxuICAgIGxldCBwcmV2aW91c0luQ29uc3RydWN0b3IgPSB0aGlzLmluQ29uc3RydWN0b3I7XG4gICAgdGhpcy5pbkNvbnN0cnVjdG9yID0gZmFsc2U7XG4gICAgbGV0IHByZXZpb3VzSW5NZXRob2QgPSB0aGlzLmluTWV0aG9kO1xuICAgIHRoaXMuaW5NZXRob2QgPSBmYWxzZTtcbiAgICBsZXQgW2JvZHksIGlzU3RyaWN0XSA9IHRoaXMucGFyc2VGdW5jdGlvbkJvZHkoKTtcbiAgICB0aGlzLmluR2VuZXJhdG9yQm9keSA9IHByZXZpb3VzSW5HZW5lcmF0b3JCb2R5O1xuICAgIHRoaXMuaW5Db25zdHJ1Y3RvciA9IHByZXZpb3VzSW5Db25zdHJ1Y3RvcjtcbiAgICB0aGlzLmluTWV0aG9kID0gcHJldmlvdXNJbk1ldGhvZDtcblxuICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBwcmV2aW91c1lpZWxkO1xuICAgIGlmIChtZXNzYWdlICE9IG51bGwpIHtcbiAgICAgIGlmICgodGhpcy5zdHJpY3QgfHwgaXNTdHJpY3QpICYmIGluZm8uZmlyc3RSZXN0cmljdGVkICE9IG51bGwpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbihpbmZvLmZpcnN0UmVzdHJpY3RlZCwgbWVzc2FnZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuc3RyaWN0ID0gcHJldmlvdXNTdHJpY3Q7XG4gICAgbGV0IGNvbnMgPSBpc0V4cHIgPyBTaGlmdC5GdW5jdGlvbkV4cHJlc3Npb24gOiBTaGlmdC5GdW5jdGlvbkRlY2xhcmF0aW9uO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihcbiAgICAgIG5ldyBjb25zKGlzR2VuZXJhdG9yLCBpZCwgaW5mby5wYXJhbXMsIGluZm8ucmVzdCwgYm9keSksXG4gICAgICBzdGFydExvY2F0aW9uXG4gICAgKTtcbiAgfVxuXG4gIHBhcnNlUGFyYW0oYm91bmQsIGluZm8pIHtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuTFBBUkVOKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICB9XG4gICAgbGV0IHBhcmFtID0gdGhpcy5wYXJzZUxlZnRIYW5kU2lkZUV4cHJlc3Npb24oKTtcbiAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLkFTU0lHTikpIHtcbiAgICAgIGxldCBwcmV2aW91c0luR2VuZXJhdG9yUGFyYW1ldGVyID0gdGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlcjtcbiAgICAgIGxldCBwcmV2aW91c1lpZWxkRXhwcmVzc2lvbiA9IHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb247XG4gICAgICBpZiAodGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlcikge1xuICAgICAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gZmFsc2U7XG4gICAgICB9XG4gICAgICB0aGlzLmluR2VuZXJhdG9yUGFyYW1ldGVyID0gZmFsc2U7XG4gICAgICBwYXJhbSA9IHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5Bc3NpZ25tZW50RXhwcmVzc2lvbihcIj1cIiwgcGFyYW0sIHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpKSk7XG4gICAgICB0aGlzLmluR2VuZXJhdG9yUGFyYW1ldGVyID0gcHJldmlvdXNJbkdlbmVyYXRvclBhcmFtZXRlcjtcbiAgICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBwcmV2aW91c1lpZWxkRXhwcmVzc2lvbjtcbiAgICB9XG4gICAgaWYgKCFQYXJzZXIuaXNEZXN0cnVjdHVyaW5nQXNzaWdubWVudFRhcmdldFdpdGhEZWZhdWx0KHBhcmFtKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRva2VuKTtcbiAgICB9XG4gICAgcmV0dXJuIFBhcnNlci50cmFuc2Zvcm1EZXN0cnVjdHVyaW5nQXNzaWdubWVudChwYXJhbSk7XG4gIH1cblxuICBjaGVja1BhcmFtKHBhcmFtLCB0b2tlbiwgYm91bmQsIGluZm8pIHtcbiAgICBsZXQgbmV3Qm91bmQgPSBQYXJzZXIuYm91bmROYW1lcyhwYXJhbSk7XG4gICAgW10ucHVzaC5hcHBseShib3VuZCwgbmV3Qm91bmQpO1xuXG4gICAgaWYgKGZpcnN0RHVwbGljYXRlKG5ld0JvdW5kKSAhPSBudWxsKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLkRVUExJQ0FURV9CSU5ESU5HLCBmaXJzdER1cGxpY2F0ZShuZXdCb3VuZCkpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnN0cmljdCkge1xuICAgICAgaWYgKG5ld0JvdW5kLnNvbWUoaXNSZXN0cmljdGVkV29yZCkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUEFSQU1fTkFNRSk7XG4gICAgICB9IGVsc2UgaWYgKGZpcnN0RHVwbGljYXRlKGJvdW5kKSAhPSBudWxsKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuU1RSSUNUX1BBUkFNX0RVUEUpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoaW5mby5maXJzdFJlc3RyaWN0ZWQgPT0gbnVsbCkge1xuICAgICAgaWYgKG5ld0JvdW5kLnNvbWUoaXNSZXN0cmljdGVkV29yZCkpIHtcbiAgICAgICAgaW5mby5maXJzdFJlc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgaW5mby5tZXNzYWdlID0gRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUEFSQU1fTkFNRTtcbiAgICAgIH0gZWxzZSBpZiAoaGFzU3RyaWN0TW9kZVJlc2VydmVkV29yZChuZXdCb3VuZCkpIHtcbiAgICAgICAgaW5mby5maXJzdFJlc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgaW5mby5tZXNzYWdlID0gRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUkVTRVJWRURfV09SRDtcbiAgICAgIH0gZWxzZSBpZiAoZmlyc3REdXBsaWNhdGUoYm91bmQpICE9IG51bGwpIHtcbiAgICAgICAgaW5mby5maXJzdFJlc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgaW5mby5tZXNzYWdlID0gRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUEFSQU1fRFVQRTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwYXJzZVBhcmFtcyhmcikge1xuICAgIGxldCBpbmZvID0ge3BhcmFtczogW10sIHJlc3Q6IG51bGx9O1xuICAgIGluZm8uZmlyc3RSZXN0cmljdGVkID0gZnI7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG5cbiAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJQQVJFTikpIHtcbiAgICAgIGxldCBib3VuZCA9IFtdO1xuICAgICAgbGV0IHNlZW5SZXN0ID0gZmFsc2U7XG5cbiAgICAgIHdoaWxlICghdGhpcy5lb2YoKSkge1xuICAgICAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICAgICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgICAgIGxldCBwYXJhbTtcbiAgICAgICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5FTExJUFNJUykpIHtcbiAgICAgICAgICB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgICAgICAgIHBhcmFtID0gbmV3IFNoaWZ0LkJpbmRpbmdJZGVudGlmaWVyKHRoaXMucGFyc2VJZGVudGlmaWVyKCkpO1xuICAgICAgICAgIGNwTG9jKHBhcmFtLmlkZW50aWZpZXIsIHBhcmFtKTtcbiAgICAgICAgICBzZWVuUmVzdCA9IHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGFyYW0gPSB0aGlzLnBhcnNlUGFyYW0oKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY2hlY2tQYXJhbShwYXJhbSwgdG9rZW4sIGJvdW5kLCBpbmZvKTtcblxuICAgICAgICBpZiAoc2VlblJlc3QpIHtcbiAgICAgICAgICBpbmZvLnJlc3QgPSBwYXJhbTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBpbmZvLnBhcmFtcy5wdXNoKHBhcmFtKTtcbiAgICAgICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLlJQQVJFTikpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuQ09NTUEpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgIHJldHVybiBpbmZvO1xuICB9XG59XG4iXX0=