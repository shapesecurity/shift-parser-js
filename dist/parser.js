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
var isStrictModeReservedWord = _utils.isStrictModeReservedWord;
var ErrorMessages = require("./errors").ErrorMessages;
var _tokenizer = require("./tokenizer");

var Tokenizer = _tokenizer["default"];
var TokenClass = _tokenizer.TokenClass;
var TokenType = _tokenizer.TokenType;


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

var FOR_OF_VAR = {};

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
    this.allowBindingPattern = false;
  }

  _inherits(Parser, Tokenizer);

  _prototypeProperties(Parser, {
    transformDestructuring: {
      value: function transformDestructuring(node) {
        switch (node.type) {
          case "ObjectExpression":
            return copyLocation(node, new Shift.ObjectBinding(node.properties.map(Parser.transformDestructuring)));
          case "DataProperty":
            return copyLocation(node, new Shift.BindingPropertyProperty(node.name, Parser.transformDestructuring(node.expression)));
          case "ShorthandProperty":
            return copyLocation(node, { type: "BindingPropertyIdentifier",
              binding: copyLocation(node, { type: "BindingIdentifier", name: node.name }),
              init: null });
          case "ArrayExpression":
            var last = node.elements[node.elements.length - 1];
            if (last != null && last.type === "SpreadElement") {
              return copyLocation(node, new Shift.ArrayBinding(node.elements.slice(0, -1).map(function (e) {
                return e && Parser.transformDestructuring(e);
              }), copyLocation(last.expression, Parser.transformDestructuring(last.expression))));
            } else {
              return copyLocation(node, new Shift.ArrayBinding(node.elements.map(function (e) {
                return e && Parser.transformDestructuring(e);
              }), null));
            }
          case "AssignmentExpression":
            return copyLocation(node, new Shift.BindingWithDefault(Parser.transformDestructuring(node.binding), node.expression));
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
      },
      writable: true,
      configurable: true
    },
    isDestructuringTarget: {
      value: function isDestructuringTarget(node, isLeafNode) {
        switch (node.type) {
          case "ObjectExpression":
            return node.properties.every(function (p) {
              return p.type === "BindingPropertyIdentifier" || p.type === "ShorthandProperty" || p.type === "DataProperty" && Parser.isDestructuringTargetWithDefault(p.expression, isLeafNode);
            });
          case "ArrayExpression":
            if (node.elements.length === 0) {
              return false;
            }if (!node.elements.slice(0, -1).filter(function (e) {
              return e != null;
            }).every(function (e) {
              return Parser.isDestructuringTargetWithDefault(e, isLeafNode);
            })) {
              return false;
            }var last = node.elements[node.elements.length - 1];
            return last == null || last.type === "SpreadElement" && Parser.isDestructuringTarget(last.expression, isLeafNode) || Parser.isDestructuringTargetWithDefault(last, isLeafNode);
          case "ArrayBinding":
          case "BindingIdentifier":
          case "BindingPropertyIdentifier":
          case "BindingPropertyProperty":
          case "BindingWithDefault":
          case "ObjectBinding":
            return true;
        }
        return isLeafNode(node);
      },
      writable: true,
      configurable: true
    },
    isDestructuringTargetWithDefault: {
      value: function isDestructuringTargetWithDefault(node, isLeafNode) {
        return node.type === "AssignmentExpression" && node.operator === "=" ? Parser.isDestructuringTarget(node.binding, isLeafNode) : Parser.isDestructuringTarget(node, isLeafNode);
      },
      writable: true,
      configurable: true
    },
    isValidSimpleBindingTarget: {
      value: function isValidSimpleBindingTarget(node) {
        return node.type === "IdentifierExpression";
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
            return [node.name];
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
                  [].push.apply(names, Parser.boundNames(node.restElement));
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
    containsBindingPropertyIdentifier: {

      // TODO: this is gross and we shouldn't actually do this
      value: function containsBindingPropertyIdentifier(node) {
        switch (node.type) {
          case "BindingPropertyIdentifier":
            return true;
          case "ObjectExpression":
          case "ObjectBinding":
            return node.properties.some(Parser.containsBindingPropertyIdentifier);
          case "ArrayExpression":
          case "ArrayBinding":
            return node.elements.some(function (e) {
              return e != null && Parser.containsBindingPropertyIdentifier(e);
            });
          case "BindingPropertyProperty":
          case "BindingWithDefault":
            return Parser.containsBindingPropertyIdentifier(node.binding);
          case "BindingIdentifier":
          case "ShorthandProperty":
          case "Method":
          case "Getter":
          case "Setter":
            return false;
          case "SpreadElement":
            return Parser.containsBindingPropertyIdentifier(node.expression);

          case "ArrowExpression":
          case "FunctionExpression":
          case "IdentifierExpression":
          case "LiteralBooleanExpression":
          case "LiteralInfinityExpression":
          case "LiteralNullExpression":
          case "LiteralNumericExpression":
          case "LiteralRegExpExpression":
          case "LiteralStringExpression":
          case "NewTargetExpression":
          case "Super":
          case "ThisExpression":
            return false;
          case "AssignmentExpression":
            return Parser.containsBindingPropertyIdentifier(node.expression);
          case "BinaryExpression":
            return Parser.containsBindingPropertyIdentifier(node.left) || Parser.containsBindingPropertyIdentifier(node.right);
          case "CallExpression":
          case "NewExpression":
            return Parser.containsBindingPropertyIdentifier(node.callee) || node.arguments.some(Parser.containsBindingPropertyIdentifier);
          case "ClassExpression":
            return node["super"] != null && Parser.containsBindingPropertyIdentifier(node["super"]);
          case "ComputedMemberExpression":
            return Parser.containsBindingPropertyIdentifier(node.object) || Parser.containsBindingPropertyIdentifier(node.expression);
          case "ConditionalExpression":
            return Parser.containsBindingPropertyIdentifier(node.test) || Parser.containsBindingPropertyIdentifier(node.consequent) || Parser.containsBindingPropertyIdentifier(node.alternate);
          case "PrefixExpression":
          case "PostfixExpression":
            return Parser.containsBindingPropertyIdentifier(node.operand);
          case "StaticMemberExpression":
            return Parser.containsBindingPropertyIdentifier(node.object);
          case "TemplateExpression":
            return node.elements.some(function (e) {
              return e.type !== "TemplateElement" && Parser.containsBindingPropertyIdentifier(e);
            });
          case "YieldExpression":
            return node.expression != null && Parser.containsBindingPropertyIdentifier(node.expression);
          case "YieldGeneratorExpression":
          case "DataProperty":
            return Parser.containsBindingPropertyIdentifier(node.expression);
        }
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
    matchContextualKeyword: {
      value: function matchContextualKeyword(keyword) {
        return this.lookahead.type === TokenType.IDENTIFIER && this.lookahead.value === keyword;
      },
      writable: true,
      configurable: true
    },
    expectContextualKeyword: {
      value: function expectContextualKeyword(keyword) {
        if (this.matchContextualKeyword(keyword)) {
          return this.lex();
        } else {
          throw this.createUnexpected(this.lookahead);
        }
      },
      writable: true,
      configurable: true
    },
    eatContextualKeyword: {
      value: function eatContextualKeyword(keyword) {
        if (this.matchContextualKeyword(keyword)) {
          return this.lex();
        }
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
    wrapVDN: {
      value: function wrapVDN(f, post) {
        var originalVDN = this.VDN;
        this.VDN = Object.create(null);
        var result = f.call(this);
        if (post) post.call(this);

        for (var key in this.VDN) {
          originalVDN[key] = this.VDN[key];
        }
        this.VDN = originalVDN;
        return result;
      },
      writable: true,
      configurable: true
    },
    checkBlockScope: {
      value: function checkBlockScope() {
        var _this = this;
        var duplicate = firstDuplicate(this.LDN);
        if (duplicate !== null) {
          throw this.createError(ErrorMessages.DUPLICATE_BINDING, duplicate);
        }
        this.LDN.forEach(function (name) {
          if (({}).hasOwnProperty.call(_this.VDN, "$" + name)) {
            throw _this.createError(ErrorMessages.DUPLICATE_BINDING, name);
          }
        });
      },
      writable: true,
      configurable: true
    },
    parseModule: {
      value: function parseModule() {
        this.module = true;
        this.strict = true;

        this.lookahead = this.advance();
        var location = this.getLocation();
        var exportedNames = Object.create(null);
        var exportedBindings = Object.create(null);
        var items = [];
        while (!this.eof()) {
          items.push(this.parseModuleItem(exportedNames, exportedBindings));
        }
        for (var key in exportedBindings) {
          if (!({}).hasOwnProperty.call(this.VDN, key) && this.LDN.indexOf(key.slice(1)) === -1) {
            throw this.createError(ErrorMessages.MODULE_EXPORT_UNDEFINED, key.slice(1));
          }
        }
        this.checkBlockScope();
        return this.markLocation(new Shift.Module(items), location);
      },
      writable: true,
      configurable: true
    },
    parseScript: {
      value: function parseScript() {
        this.lookahead = this.advance();

        var location = this.getLocation();
        var originalLDN = this.LDN;
        this.LDN = [];

        var _parseBody = this.parseBody();

        var _parseBody2 = _slicedToArray(_parseBody, 1);

        var body = _parseBody2[0];
        if (!this.match(TokenType.EOS)) {
          throw this.createUnexpected(this.lookahead);
        }
        this.checkBlockScope();
        this.LDN = originalLDN;
        return this.markLocation(new Shift.Script(body), location);
      },
      writable: true,
      configurable: true
    },
    parseFunctionBody: {
      value: function parseFunctionBody(boundParams) {
        var _this = this;
        var startLocation = this.getLocation();

        var oldVDN = this.VDN;
        this.VDN = Object.create(null);

        var originalLDN = this.LDN;
        this.LDN = [];

        boundParams.forEach(function (name) {
          return _this.VDN["$" + name] = true;
        });

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
      },
      writable: true,
      configurable: true
    },
    parseBody: {
      value: function parseBody() {
        var _this = this;
        var location = this.getLocation();
        var directives = [];
        var statements = [];
        var parsingDirectives = true;
        var isStrict = this.strict;
        var firstRestricted = null;
        this.wrapVDN(function () {
          while (true) {
            if (_this.eof() || _this.match(TokenType.RBRACE)) {
              break;
            }
            var token = _this.lookahead;
            var text = token.slice.text;
            var isStringLiteral = token.type === TokenType.STRING;
            var directiveLocation = _this.getLocation();
            var stmt = _this.parseStatementListItem({ isTopLevel: true });
            if (parsingDirectives) {
              if (isStringLiteral && stmt.type === "ExpressionStatement" && stmt.expression.type === "LiteralStringExpression") {
                if (text === "\"use strict\"" || text === "'use strict'") {
                  isStrict = true;
                  _this.strict = true;
                  if (firstRestricted != null) {
                    throw _this.createErrorWithLocation(firstRestricted, ErrorMessages.STRICT_OCTAL_LITERAL);
                  }
                } else if (firstRestricted == null && token.octal) {
                  firstRestricted = token;
                }
                directives.push(_this.markLocation(new Shift.Directive(text.slice(1, -1)), directiveLocation));
              } else {
                parsingDirectives = false;
                statements.push(stmt);
              }
            } else {
              statements.push(stmt);
            }
          }
        }, function () {});
        return [this.markLocation(new Shift.FunctionBody(directives, statements), location), isStrict];
      },
      writable: true,
      configurable: true
    },
    parseImportSpecifier: {
      value: function parseImportSpecifier(boundNames) {
        var startLocation = this.getLocation(),
            identifier = undefined;
        if (this.lookahead.type === TokenType.IDENTIFIER) {
          identifier = this.parseIdentifier();
          if (!this.eatContextualKeyword("as")) {
            if (({}).hasOwnProperty.call(boundNames, "$" + identifier)) {
              throw this.createErrorWithLocation(startLocation, ErrorMessages.IMPORT_DUPE);
            }
            boundNames["$" + identifier] = true;
            return this.markLocation(new Shift.ImportSpecifier(null, this.markLocation({ type: "BindingIdentifier", name: identifier }, startLocation)), startLocation);
          }
        } else if (this.lookahead.type.klass.isIdentifierName) {
          identifier = this.parseIdentifierName();
          this.expectContextualKeyword("as");
        }

        var location = this.getLocation();
        var boundName = this.parseIdentifier();
        if (({}).hasOwnProperty.call(boundNames, "$" + boundName)) {
          throw this.createErrorWithLocation(location, ErrorMessages.IMPORT_DUPE);
        }
        boundNames["$" + boundName] = true;
        return this.markLocation(new Shift.ImportSpecifier(identifier, this.markLocation({ type: "BindingIdentifier", name: boundName }, location)), startLocation);
      },
      writable: true,
      configurable: true
    },
    parseNameSpaceBinding: {
      value: function parseNameSpaceBinding(boundNames) {
        var startLocation = this.getLocation();
        this.expect(TokenType.MUL);
        this.expectContextualKeyword("as");
        var identifierLocation = this.getLocation();
        var identifier = this.parseIdentifier();
        if (({}).hasOwnProperty.call(boundNames, "$" + identifier)) {
          throw this.createErrorWithLocation(identifierLocation, ErrorMessages.IMPORT_DUPE);
        }
        boundNames["$" + identifier] = true;
        return this.markLocation({ type: "BindingIdentifier", name: identifier }, startLocation);
      },
      writable: true,
      configurable: true
    },
    parseNamedImports: {
      value: function parseNamedImports(boundNames) {
        var result = [];
        this.expect(TokenType.LBRACE);
        while (!this.eat(TokenType.RBRACE)) {
          result.push(this.parseImportSpecifier(boundNames));
          if (!this.eat(TokenType.COMMA)) {
            this.expect(TokenType.RBRACE);
            break;
          }
        }
        return result;
      },
      writable: true,
      configurable: true
    },
    parseFromClause: {
      value: function parseFromClause() {
        this.expectContextualKeyword("from");
        var value = this.expect(TokenType.STRING)._value;
        this.consumeSemicolon();
        return value;
      },
      writable: true,
      configurable: true
    },
    parseImportDeclaration: {
      value: function parseImportDeclaration() {
        var startLocation = this.getLocation(),
            defaultBinding = null,
            moduleSpecifier = undefined,
            boundNames = Object.create(null);
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
      },
      writable: true,
      configurable: true
    },
    parseExportSpecifier: {
      value: function parseExportSpecifier(exportedNames, exportedBindings) {
        var startLocation = this.getLocation();
        var name = this.parseIdentifier();
        exportedBindings["$" + name] = true;
        if (this.eatContextualKeyword("as")) {
          var exportedName = this.parseIdentifierName();
          if (({}).hasOwnProperty.call(exportedNames, "$" + exportedName)) {
            throw this.createError(ErrorMessages.DUPLICATE_EXPORTED_NAME, exportedName);
          }
          exportedNames["$" + exportedName] = true;
          return this.markLocation(new Shift.ExportSpecifier(name, exportedName), startLocation);
        } else {
          if (({}).hasOwnProperty.call(exportedNames, "$" + name)) {
            throw this.createError(ErrorMessages.DUPLICATE_EXPORTED_NAME, name);
          }
          exportedNames["$" + name] = true;
        }
        return this.markLocation(new Shift.ExportSpecifier(null, name), startLocation);
      },
      writable: true,
      configurable: true
    },
    parseExportClause: {
      value: function parseExportClause(exportedNames, exportedBindings) {
        var result = [];
        this.expect(TokenType.LBRACE);
        while (!this.eat(TokenType.RBRACE)) {
          result.push(this.parseExportSpecifier(exportedNames, exportedBindings));
          if (!this.eat(TokenType.COMMA)) {
            this.expect(TokenType.RBRACE);
            break;
          }
        }
        return result;
      },
      writable: true,
      configurable: true
    },
    parseExportDeclaration: {
      value: function parseExportDeclaration(exportedNames, exportedBindings) {
        var _this = this;
        var startLocation = this.getLocation(),
            decl = undefined;
        this.expect(TokenType.EXPORT);
        var isVar = false,
            key = undefined,
            oldLDN = this.LDN,
            oldVDN = this.VDN;
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
            var namedExports = this.parseExportClause(exportedNames, exportedBindings);
            var fromClause = null;
            if (this.matchContextualKeyword("from")) {
              fromClause = this.parseFromClause();
            }
            decl = new Shift.ExportFrom(namedExports, fromClause);
            break;
          case TokenType.CLASS:
            // export ClassDeclaration
            decl = new Shift.Export(this.parseClass({ isExpr: false }));
            if (({}).hasOwnProperty.call(exportedNames, "$" + decl.declaration.name.name)) {
              throw this.createError(ErrorMessages.DUPLICATE_EXPORTED_NAME, decl.declaration.name.name);
            }
            key = decl.declaration.name.name;
            exportedNames["$" + key] = true;
            exportedBindings["$" + key] = true;
            oldLDN.push(key);
            break;
          case TokenType.FUNCTION:
            // export HoistableDeclaration
            decl = new Shift.Export(this.parseFunction({ isExpr: false, isTopLevel: true }));
            if (({}).hasOwnProperty.call(exportedNames, "$" + decl.declaration.name.name)) {
              throw this.createError(ErrorMessages.DUPLICATE_EXPORTED_NAME, decl.declaration.name.name);
            }
            key = decl.declaration.name.name;
            exportedNames["$" + key] = true;
            exportedBindings["$" + key] = true;
            oldLDN.push(key);
            break;
          case TokenType.DEFAULT:
            if (({}).hasOwnProperty.call(exportedNames, "$default")) {
              throw this.createError(ErrorMessages.DUPLICATE_EXPORTED_NAME, "default");
            }
            exportedNames.$default = true;
            this.lex();
            switch (this.lookahead.type) {
              case TokenType.FUNCTION:
                // export default HoistableDeclaration[Default]
                decl = new Shift.ExportDefault(this.parseFunction({ isExpr: false, inDefault: true, isTopLevel: true }));
                key = decl.body.name.name;
                if (key !== "*default*") {
                  exportedBindings["$" + key] = true;
                  oldLDN.push(key);
                }
                break;
              case TokenType.CLASS:
                // export default ClassDeclaration[Default]
                decl = new Shift.ExportDefault(this.parseClass({ isExpr: false, inDefault: true }));
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
              var boundNames = [];
              decl = new Shift.Export(this.parseVariableDeclaration({ boundNames: boundNames }));
              boundNames.forEach(function (name) {
                if (({}).hasOwnProperty.call(exportedNames, "$" + name)) {
                  throw _this.createError(ErrorMessages.DUPLICATE_EXPORTED_NAME, name);
                }
                exportedNames["$" + name] = true;
                exportedBindings["$" + name] = true;
              });
              if (isVar) {
                boundNames.forEach(function (name) {
                  return oldVDN["$" + name] = true;
                });
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
      },
      writable: true,
      configurable: true
    },
    parseModuleItem: {
      value: function parseModuleItem(exportedNames, exportedBindings) {
        switch (this.lookahead.type) {
          case TokenType.IMPORT:
            return this.parseImportDeclaration();
          case TokenType.EXPORT:
            return this.parseExportDeclaration(exportedNames, exportedBindings);
          default:
            return this.parseStatementListItem();
        }
      },
      writable: true,
      configurable: true
    },
    lookaheadLexicalDeclaration: {
      value: function lookaheadLexicalDeclaration() {
        if (this.match(TokenType.LET) || this.match(TokenType.CONST)) {
          return true;
        }
        if (this.match(TokenType.IDENTIFIER) && this.lookahead.value === "let") {
          var lexerState = this.saveLexerState();
          this.lex();
          if (this.match(TokenType.YIELD) || this.match(TokenType.IDENTIFIER) || this.match(TokenType.LBRACE) || this.match(TokenType.LBRACK)) {
            this.restoreLexerState(lexerState);
            return true;
          } else {
            this.restoreLexerState(lexerState);
          }
        }
        return false;
      },
      writable: true,
      configurable: true
    },
    parseStatementListItem: {
      value: function parseStatementListItem() {
        var _this = this;
        var _ref = arguments[0] === undefined ? {} : arguments[0];
        var _ref$isTopLevel = _ref.isTopLevel;
        var isTopLevel = _ref$isTopLevel === undefined ? false : _ref$isTopLevel;
        var startLocation = this.getLocation();
        if (this.eof()) {
          throw this.createUnexpected(this.lookahead);
        }

        var decl = this.wrapVDN(function () {
          switch (_this.lookahead.type) {
            case TokenType.FUNCTION:
              return _this.parseFunction({ isExpr: false, isTopLevel: isTopLevel });
            case TokenType.CLASS:
              return _this.parseClass({ isExpr: false });
            default:
              if (_this.lookaheadLexicalDeclaration()) {
                return _this.parseVariableDeclarationStatement();
              }
              return _this.parseStatement({ allowLabeledFunction: true, isTopLevel: isTopLevel });
          }
        }, this.checkBlockScope);
        return this.markLocation(decl, startLocation);
      },
      writable: true,
      configurable: true
    },
    parseStatement: {
      value: function parseStatement() {
        var _this = this;
        var _ref = arguments[0] === undefined ? {} : arguments[0];
        var _ref$allowLabeledFunction = _ref.allowLabeledFunction;
        var allowLabeledFunction = _ref$allowLabeledFunction === undefined ? false : _ref$allowLabeledFunction;
        var _ref$isTopLevel = _ref.isTopLevel;
        var isTopLevel = _ref$isTopLevel === undefined ? false : _ref$isTopLevel;
        var startLocation = this.getLocation();
        var originalLDN = this.LDN;
        this.LDN = [];
        var stmt = this.wrapVDN(function () {
          return _this.parseStatementHelper(allowLabeledFunction, originalLDN, isTopLevel);
        });
        this.LDN = originalLDN;
        return this.markLocation(stmt, startLocation);
      },
      writable: true,
      configurable: true
    },
    parseStatementHelper: {
      value: function parseStatementHelper(allowLabeledFunction, originalLDN, isTopLevel) {
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

          default:
            {
              if (this.lookaheadLexicalDeclaration()) {
                throw this.createUnexpected(this.lookahead);
              }
              var expr = this.parseExpression();
              // 12.12 Labelled Statements;
              if (expr.type === "IdentifierExpression" && this.eat(TokenType.COLON)) {
                var key = "$" + expr.name;
                if (({}).hasOwnProperty.call(this.labelSet, key)) {
                  throw this.createError(ErrorMessages.LABEL_REDECLARATION, expr.name);
                }
                this.LDN = originalLDN;
                this.labelSet[key] = true;
                var labeledBody = undefined;
                if (this.match(TokenType.FUNCTION)) {
                  if (this.strict || !allowLabeledFunction) {
                    throw this.createUnexpected(this.lookahead);
                  }
                  labeledBody = this.parseFunction({ isExpr: false, allowGenerator: false, isTopLevel: isTopLevel });
                } else {
                  labeledBody = this.parseStatement({ allowLabeledFunction: allowLabeledFunction, isTopLevel: isTopLevel });
                }
                delete this.labelSet[key];
                return new Shift.LabeledStatement(expr.name, labeledBody);
              } else {
                this.consumeSemicolon();
                return new Shift.ExpressionStatement(expr);
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
        var stmt = new Shift.BlockStatement(this.parseBlock());
        this.checkBlockScope();
        return stmt;
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
        if (this.lookahead.type === TokenType.IDENTIFIER) {
          label = this.parseIdentifier();

          var key = "$" + label;
          if (!({}).hasOwnProperty.call(this.labelSet, key)) {
            throw this.createError(ErrorMessages.UNKNOWN_LABEL, label);
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
        if (this.lookahead.type === TokenType.IDENTIFIER) {
          label = this.parseIdentifier();

          var key = "$" + label;
          if (!({}).hasOwnProperty.call(this.labelSet, key)) {
            throw this.createError(ErrorMessages.UNKNOWN_LABEL, label);
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
          var startsWithLet = this.match(TokenType.LET) || this.match(TokenType.IDENTIFIER) && this.lookahead.value === "let";
          var isForDecl = this.lookaheadLexicalDeclaration();
          if (this.match(TokenType.VAR) || isForDecl) {
            var previousAllowIn = this.allowIn;
            this.allowIn = false;
            var initDecl = this.parseVariableDeclaration({ inFor: true });
            this.allowIn = previousAllowIn;

            if (initDecl.declarators.length === 1 && (this.match(TokenType.IN) || this.match(TokenType.OF))) {
              var Ctor = undefined;

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
                for (var key in this.VDN) {
                  this.VDN[key] = FOR_OF_VAR;
                }

                this.lex();
                right = this.parseAssignmentExpression();
              }

              var epilogue = this.wrapVDN(this.getIteratorStatementEpilogue, isForDecl && this.checkBlockScope);

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
            var previousAllowIn = this.allowIn;
            this.allowIn = false;
            var init = this.parseExpression();
            this.allowIn = previousAllowIn;

            if (this.match(TokenType.IN) || !startsWithLet && this.match(TokenType.OF)) {
              if (!Parser.isValidSimpleAssignmentTarget(init)) {
                throw this.createError(ErrorMessages.INVALID_LHS_IN_FOR_IN);
              }

              var Ctor = this.match(TokenType.IN) ? Shift.ForInStatement : Shift.ForOfStatement;

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
        var _this = this;
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
        return this.wrapVDN(function () {
          var cases = _this.parseSwitchCases();
          if (_this.match(TokenType.DEFAULT)) {
            var switchDefault = _this.parseSwitchDefault();
            var postDefaultCases = _this.parseSwitchCases();
            if (_this.match(TokenType.DEFAULT)) {
              throw _this.createError(ErrorMessages.MULTIPLE_DEFAULTS_IN_SWITCH);
            }
            _this.inSwitch = oldInSwitch;
            _this.expect(TokenType.RBRACE);
            return new Shift.SwitchStatementWithDefault(discriminant, cases, switchDefault, postDefaultCases);
          } else {
            _this.inSwitch = oldInSwitch;
            _this.expect(TokenType.RBRACE);
            return new Shift.SwitchStatement(discriminant, cases);
          }
        }, this.checkBlockScope);
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
          result.push(this.parseStatementListItem());
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
        var block = this.wrapVDN(this.parseBlock, this.checkBlockScope);

        if (this.match(TokenType.CATCH)) {
          var handler = this.parseCatchClause();
          if (this.eat(TokenType.FINALLY)) {
            var finalizer = this.wrapVDN(this.parseBlock, this.checkBlockScope);
            return new Shift.TryFinallyStatement(block, handler, finalizer);
          }
          return new Shift.TryCatchStatement(block, handler);
        }

        if (this.eat(TokenType.FINALLY)) {
          var finalizer = this.wrapVDN(this.parseBlock, this.checkBlockScope);
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
        var _this = this;
        var startLocation = this.getLocation();

        this.expect(TokenType.CATCH);
        this.expect(TokenType.LPAREN);
        var token = this.lookahead;
        if (this.match(TokenType.RPAREN) || this.match(TokenType.LPAREN)) {
          throw this.createUnexpected(token);
        }

        var param = this.parseLeftHandSideExpression({ allowCall: false });

        if (!Parser.isDestructuringTarget(param, Parser.isValidSimpleBindingTarget)) {
          throw this.createUnexpected(token);
        }
        param = Parser.transformDestructuring(param);

        var bound = Parser.boundNames(param);
        if (firstDuplicate(bound) != null) {
          throw this.createErrorWithLocation(token, ErrorMessages.DUPLICATE_BINDING, firstDuplicate(bound));
        }

        if (this.strict && bound.some(isRestrictedWord)) {
          throw this.createErrorWithLocation(token, ErrorMessages.STRICT_CATCH_VARIABLE);
        }

        this.expect(TokenType.RPAREN);

        var body = this.wrapVDN(this.parseBlock, this.checkBlockScope);

        this.LDN.forEach(function (name) {
          if (bound.indexOf(name) >= 0) {
            throw _this.createErrorWithLocation(token, ErrorMessages.DUPLICATE_BINDING, name);
          }
        });
        for (var key in this.VDN) {
          if (this.VDN[key] === FOR_OF_VAR && bound.indexOf(key.slice(1)) >= 0) {
            throw this.createError(ErrorMessages.DUPLICATE_CATCH_BINDING, key.slice(1));
          }
        }
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
        var _ref = arguments[0] === undefined ? {} : arguments[0];
        var _ref$inFor = _ref.inFor;
        var inFor = _ref$inFor === undefined ? false : _ref$inFor;
        var _ref$boundNames = _ref.boundNames;
        var boundNames = _ref$boundNames === undefined ? [] : _ref$boundNames;
        var startLocation = this.getLocation();
        var token = this.lex();

        // Preceded by this.match(TokenSubType.VAR) || this.match(TokenSubType.LET);
        var kind = token.type === TokenType.VAR ? "var" : token.type === TokenType.CONST ? "const" : "let";
        var declarators = this.parseVariableDeclaratorList(kind, { inFor: inFor, boundNames: boundNames });
        return this.markLocation(new Shift.VariableDeclaration(kind, declarators), startLocation);
      },
      writable: true,
      configurable: true
    },
    parseVariableDeclaratorList: {
      value: function parseVariableDeclaratorList(kind, _ref) {
        var inFor = _ref.inFor;
        var boundNames = _ref.boundNames;
        var result = [];
        var _parseVariableDeclarator = this.parseVariableDeclarator(kind, { allowConstWithoutBinding: inFor });

        var _parseVariableDeclarator2 = _slicedToArray(_parseVariableDeclarator, 2);

        var varDecl = _parseVariableDeclarator2[0];
        var allBound = _parseVariableDeclarator2[1];
        result.push(varDecl);
        if (inFor && kind === "const" && varDecl.init === null) {
          return result;
        }

        while (this.eat(TokenType.COMMA)) {
          var _parseVariableDeclarator3 = this.parseVariableDeclarator(kind, { allowConstWithoutBinding: false });

          var _parseVariableDeclarator32 = _slicedToArray(_parseVariableDeclarator3, 2);

          var nextVarDecl = _parseVariableDeclarator32[0];
          var bound = _parseVariableDeclarator32[1];
          result.push(nextVarDecl);
          if (kind !== "var") {
            allBound = allBound.concat(bound);
          }
        }

        if (this.strict && allBound.some(isRestrictedWord)) {
          throw this.createErrorWithLocation(this.lookahead, ErrorMessages.STRICT_VAR_NAME);
        }

        if (kind !== "var") {
          var dupe = firstDuplicate(allBound);
          if (dupe !== null) {
            throw this.createError(ErrorMessages.DUPLICATE_BINDING, dupe);
          }
        }
        [].push.apply(boundNames, allBound);
        return result;
      },
      writable: true,
      configurable: true
    },
    parseVariableDeclarator: {
      value: function parseVariableDeclarator(kind, _ref) {
        var _this = this;
        var allowConstWithoutBinding = _ref.allowConstWithoutBinding;
        var startLocation = this.getLocation();
        var token = this.lookahead;

        if (this.match(TokenType.LPAREN)) {
          throw this.createUnexpected(this.lookahead);
        }

        var previousAllowBindingPattern = this.allowBindingPattern;
        this.allowBindingPattern = true;

        var id = this.parseLeftHandSideExpression({ allowCall: false });

        this.allowBindingPattern = previousAllowBindingPattern;

        if (!Parser.isDestructuringTarget(id, Parser.isValidSimpleBindingTarget)) {
          throw this.createUnexpected(token);
        }
        id = Parser.transformDestructuring(id);

        var bound = Parser.boundNames(id);

        var init = null;
        if (kind === "const") {
          if (!allowConstWithoutBinding || this.match(TokenType.ASSIGN)) {
            this.expect(TokenType.ASSIGN);
            init = this.parseAssignmentExpression();
          }
        } else if (this.eat(TokenType.ASSIGN)) {
          init = this.parseAssignmentExpression();
        }

        if (kind === "var") {
          bound.forEach(function (name) {
            return _this.VDN["$" + name] = true;
          });
        } else {
          if (bound.indexOf("let") >= 0) {
            throw this.createErrorWithLocation(token, ErrorMessages.LEXICALLY_BOUND_LET);
          }
          [].push.apply(this.LDN, bound);
        }
        return [this.markLocation(new Shift.VariableDeclarator(id, init), startLocation), bound];
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
            var _name = head.name;
            if (STRICT_MODE_RESERVED_WORD.hasOwnProperty(_name)) {
              throw this.createError(ErrorMessages.STRICT_RESERVED_WORD);
            }
            if (isRestrictedWord(_name)) {
              throw this.createError(ErrorMessages.STRICT_PARAM_NAME);
            }
            head = Parser.transformDestructuring(head);
            params = [head];
          } else {
            throw this.createUnexpected(arrow);
          }
        }

        if (this.match(TokenType.LBRACE)) {
          var previousYield = this.allowYieldExpression;
          this.allowYieldExpression = false;
          var boundParams = [].concat.apply([], params.map(Parser.boundNames));
          var _parseFunctionBody = this.parseFunctionBody(boundParams);

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

        var previousAllowBindingPattern = this.allowBindingPattern;
        this.allowBindingPattern = true;

        var node = this.parseConditionalExpression();

        this.allowBindingPattern = previousAllowBindingPattern;

        if (!this.hasLineTerminatorBeforeNext && this.match(TokenType.ARROW)) {
          return this.parseArrowExpressionTail(node, startLocation);
        }

        var isAssignmentOperator = false;
        var operator = this.lookahead;
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

          var bound = Parser.boundNames(node);
          if (this.strict && bound.some(isRestrictedWord)) {
            throw this.createErrorWithLocation(token, ErrorMessages.STRICT_LHS_ASSIGNMENT);
          }
        } else {
          if (!this.allowBindingPattern && Parser.containsBindingPropertyIdentifier(node)) {
            throw this.createUnexpected(operator);
          }
          return node;
        }

        this.lex();
        var previousInGeneratorParameter = this.inGeneratorParameter;
        this.inGeneratorParameter = false;
        var right = this.parseAssignmentExpression();
        this.inGeneratorParameter = previousInGeneratorParameter;
        return this.markLocation(new Shift.AssignmentExpression(operator.type.name, node, right), startLocation);
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
        var Ctor = isGenerator ? Shift.YieldGeneratorExpression : Shift.YieldExpression;
        return this.markLocation(new Ctor(expr), startLocation);
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
        if (this.lookahead.type.klass !== TokenClass.Punctuator && this.lookahead.type.klass !== TokenClass.Keyword) {
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
      },
      writable: true,
      configurable: true
    },
    parsePostfixExpression: {
      value: function parsePostfixExpression() {
        var startLocation = this.getLocation();

        var expr = this.parseLeftHandSideExpression({ allowCall: true });

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
          if (this.strict && isRestrictedWord(expr.name)) {
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
      value: function parseLeftHandSideExpression(_ref) {
        var allowCall = _ref.allowCall;
        var startLocation = this.getLocation();
        var previousAllowIn = this.allowIn;
        this.allowIn = allowCall;

        var expr = undefined,
            token = this.lookahead;

        if (this.eat(TokenType.SUPER)) {
          expr = this.markLocation(new Shift.Super(), startLocation);
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
          return [this.markLocation(new Shift.TemplateElement(token.value.slice(1, -1)), startLocation)];
        }
        var result = [this.markLocation(new Shift.TemplateElement(this.lex().value.slice(1, -2)), startLocation)];
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
        if (this.eat(TokenType.PERIOD)) {
          var ident = this.expect(TokenType.IDENTIFIER);
          if (ident.value !== "target") {
            throw this.createUnexpected(ident);
          } else if (!this.inFunctionBody) {
            throw this.createErrorWithLocation(startLocation, ErrorMessages.UNEXPECTED_NEW_TARGET);
          }
          return this.markLocation(new Shift.NewTargetExpression(), startLocation);
        }
        var callee = this.parseLeftHandSideExpression({ allowCall: false });
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
            return this.markLocation({ type: "IdentifierExpression", name: this.parseIdentifier() }, startLocation);
          case TokenType.STRING:
            return this.parseStringLiteral();
          case TokenType.NUMBER:
            return this.parseNumericLiteral();
          case TokenType.THIS:
            this.lex();
            return this.markLocation(new Shift.ThisExpression(), startLocation);
          case TokenType.FUNCTION:
            return this.markLocation(this.parseFunction({ isExpr: true }), startLocation);
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
            return this.markLocation(new Shift.TemplateExpression(null, this.parseTemplateElements()), startLocation);
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
            return this.parseClass({ isExpr: true });
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
        if (this.lookahead.type.klass.isIdentifierName) {
          return this.lex().value;
        } else {
          throw this.createUnexpected(this.lookahead);
        }
      },
      writable: true,
      configurable: true
    },
    parseBindingIdentifier: {
      value: function parseBindingIdentifier() {
        var startLocation = this.getLocation();
        return this.markLocation({ type: "BindingIdentifier", name: this.parseIdentifier() }, startLocation);
      },
      writable: true,
      configurable: true
    },
    parseIdentifier: {
      value: function parseIdentifier() {
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
          rest = this.parseBindingIdentifier();
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
            rest = this.parseBindingIdentifier();
            break;
          }
          possibleBindings = possibleBindings && !this.match(TokenType.LPAREN);
          var expr = this.parseAssignmentExpression();
          params.push(expr);
          group = this.markLocation(new Shift.BinaryExpression(",", group, expr), startLocation);
        }

        if (possibleBindings) {
          possibleBindings = params.every(function (e) {
            return Parser.isDestructuringTargetWithDefault(e, Parser.isValidSimpleBindingTarget);
          });
        }

        this.expect(TokenType.RPAREN);

        if (!this.hasLineTerminatorBeforeNext && this.match(TokenType.ARROW)) {
          var _ret = (function () {
            if (!possibleBindings) {
              throw _this.createErrorWithLocation(start, ErrorMessages.ILLEGAL_ARROW_FUNCTION_PARAMS);
            }
            // check dup params
            params = params.map(Parser.transformDestructuring);
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
              allBoundNames.push(rest.name);
            }

            if (firstDuplicate(allBoundNames) != null) {
              throw _this.createError(ErrorMessages.STRICT_PARAM_DUPE);
            }

            var strictRestrictedWord = allBoundNames.some(isRestrictedWord);
            if (strictRestrictedWord) {
              throw _this.createError(ErrorMessages.STRICT_PARAM_NAME);
            }

            var strictReservedWord = hasStrictModeReservedWord(allBoundNames);
            if (strictReservedWord) {
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
              return this.markLocation({ type: "BindingPropertyIdentifier",
                binding: this.markLocation({ type: "BindingIdentifier", name: methodOrKey.value }, startLocation),
                init: this.parseAssignmentExpression() }, startLocation);
            } else if (!this.match(TokenType.COLON)) {
              if (token.type !== TokenType.IDENTIFIER && token.type !== TokenType.YIELD || (this.strict || this.allowYieldExpression) && methodOrKey.value === "yield") {
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

        return this.markLocation(new Shift.StaticPropertyName(this.parseIdentifierName()), startLocation);
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
            if (_name === "get" && this.lookaheadPropertyName()) {
              key = this.parsePropertyName();
              this.expect(TokenType.LPAREN);
              this.expect(TokenType.RPAREN);
              var previousInConstructor = this.inConstructor;
              this.inConstructor = false;
              var previousInMethod = this.inMethod;
              this.inMethod = true;
              var _parseFunctionBody = this.parseFunctionBody([]);

              var _parseFunctionBody2 = _slicedToArray(_parseFunctionBody, 1);

              var body = _parseFunctionBody2[0];
              this.inConstructor = previousInConstructor;
              this.inMethod = previousInMethod;
              return {
                methodOrKey: this.markLocation(new Shift.Getter(key, body), startLocation),
                kind: "method"
              };
            } else if (_name === "set" && this.lookaheadPropertyName()) {
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
              var boundParams = Parser.boundNames(param);
              var _parseFunctionBody3 = this.parseFunctionBody(boundParams);

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
          var boundParams = [].concat.apply([], paramInfo.params.map(Parser.boundNames));
          var _parseFunctionBody4 = this.parseFunctionBody(boundParams);

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
      value: function parseClass(_ref) {
        var isExpr = _ref.isExpr;
        var _ref$inDefault = _ref.inDefault;
        var inDefault = _ref$inDefault === undefined ? false : _ref$inDefault;
        var location = this.getLocation();
        this.expect(TokenType.CLASS);
        var id = null;
        var heritage = null;

        if (this.match(TokenType.IDENTIFIER)) {
          var idLocation = this.getLocation();
          id = this.parseBindingIdentifier();
        } else if (!isExpr) {
          if (inDefault) {
            id = this.markLocation({ type: "BindingIdentifier", name: "*default*" }, location);
          } else {
            throw this.createUnexpected(this.lookahead);
          }
        }

        var previousInGeneratorParameter = this.inGeneratorParameter;
        var previousParamYield = this.allowYieldExpression;
        var previousHasClassHeritage = this.hasClassHeritage;
        if (isExpr) {
          this.inGeneratorParameter = false;
          this.allowYieldExpression = false;
        }
        if (this.eat(TokenType.EXTENDS)) {
          heritage = this.parseLeftHandSideExpression({ allowCall: true });
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
            var _ref2 = this.parseMethodDefinition(false);

            methodOrKey = _ref2.methodOrKey;
            kind = _ref2.kind;
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
              methods.push(copyLocation(methodOrKey, new Shift.ClassElement(isStatic, methodOrKey)));
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
      },
      writable: true,
      configurable: true
    },
    parseFunction: {
      value: function parseFunction(_ref) {
        var isExpr = _ref.isExpr;
        var isTopLevel = _ref.isTopLevel;
        var _ref$inDefault = _ref.inDefault;
        var inDefault = _ref$inDefault === undefined ? false : _ref$inDefault;
        var _ref$allowGenerator = _ref.allowGenerator;
        var allowGenerator = _ref$allowGenerator === undefined ? true : _ref$allowGenerator;
        var startLocation = this.getLocation();

        this.expect(TokenType.FUNCTION);

        var id = null;
        var message = null;
        var firstRestricted = null;
        var isGenerator = allowGenerator && !!this.eat(TokenType.MUL);
        var previousGeneratorParameter = this.inGeneratorParameter;
        var previousYield = this.allowYieldExpression;
        var previousInGeneratorBody = this.inGeneratorBody;

        if (!this.match(TokenType.LPAREN)) {
          var token = this.lookahead;
          var identifierLocation = this.getLocation();
          id = this.parseIdentifier();
          if (this.strict || isGenerator) {
            if (isRestrictedWord(id)) {
              throw this.createErrorWithLocation(token, ErrorMessages.STRICT_FUNCTION_NAME);
            }
          } else {
            if (isRestrictedWord(id)) {
              firstRestricted = token;
              message = ErrorMessages.STRICT_FUNCTION_NAME;
            } else if (isStrictModeReservedWord(id)) {
              firstRestricted = token;
              message = ErrorMessages.STRICT_RESERVED_WORD;
            }
          }
          id = this.markLocation({ type: "BindingIdentifier", name: id }, identifierLocation);
        } else if (!isExpr) {
          if (inDefault) {
            id = this.markLocation({ type: "BindingIdentifier", name: "*default*" }, startLocation);
          } else {
            throw this.createUnexpected(this.lookahead);
          }
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
        var boundParams = [].concat.apply([], info.params.map(Parser.boundNames));
        var _parseFunctionBody = this.parseFunctionBody(boundParams);

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
        var Ctor = isExpr ? Shift.FunctionExpression : Shift.FunctionDeclaration;
        if (!isExpr) {
          if (isTopLevel) {
            this.VDN["$" + id.name] = true;
          } else {
            this.LDN.push(id.name);
          }
        }
        return this.markLocation(new Ctor(isGenerator, id, info.params, info.rest, body), startLocation);
      },
      writable: true,
      configurable: true
    },
    parseParam: {
      value: function parseParam() {
        var startLocation = this.getLocation();
        var token = this.lookahead;
        var originalInParameter = this.inParameter;
        this.inParameter = true;
        if (this.match(TokenType.LPAREN)) {
          throw this.createUnexpected(this.lookahead);
        }
        var param = this.parseLeftHandSideExpression({ allowCall: false });
        if (this.eat(TokenType.ASSIGN)) {
          var previousInGeneratorParameter = this.inGeneratorParameter;
          var previousYieldExpression = this.allowYieldExpression;
          if (this.inGeneratorParameter) {
            this.allowYieldExpression = false;
          }
          this.inGeneratorParameter = false;
          param = this.markLocation(new Shift.AssignmentExpression("=", param, this.parseAssignmentExpression()), startLocation);
          this.inGeneratorParameter = previousInGeneratorParameter;
          this.allowYieldExpression = previousYieldExpression;
        }
        if (!Parser.isDestructuringTargetWithDefault(param, Parser.isValidSimpleBindingTarget)) {
          throw this.createUnexpected(token);
        }
        this.inParameter = originalInParameter;
        return Parser.transformDestructuring(param);
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
        var info = { params: [], rest: null },
            isSimpleParameter = true;
        info.firstRestricted = fr;
        this.expect(TokenType.LPAREN);

        if (!this.match(TokenType.RPAREN)) {
          var bound = [];
          var seenRest = false;

          while (!this.eof()) {
            var token = this.lookahead;
            var param = undefined;
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
      },
      writable: true,
      configurable: true
    }
  });

  return Parser;
})(Tokenizer);
//# sourceMappingURL=data:application/json;base64,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RSxDQUFDO0FBQ3RDLHNCQUFRLEdBQUcsSUFBSSxDQUFDO2FBQ2pCLE1BQU07QUFDTCxtQkFBSyxHQUFHLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztBQUMxQixrQkFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLG1CQUFtQixFQUFFO0FBQ3RDLGlDQUFpQixHQUFHLEtBQUssQ0FBQztlQUMzQjthQUNGOztBQUVELGdCQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDOztBQUUzQyxnQkFBSSxRQUFRLEVBQUU7QUFDWixrQkFBSSxDQUFDLElBQUksR0FBRyxLQUFLLENBQUM7QUFDbEIsb0JBQU07YUFDUDtBQUNELGdCQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN4QixnQkFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUNoQyxvQkFBTTthQUNQO0FBQ0QsZ0JBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1dBQzlCO1NBQ0Y7O0FBRUQsWUFBSSxDQUFDLGlCQUFpQixFQUFFO0FBQ3RCLGNBQUksSUFBSSxDQUFDLE9BQU8sS0FBSyxhQUFhLENBQUMsaUJBQWlCLEVBQUU7QUFDcEQsa0JBQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7V0FDdEM7U0FDRjs7QUFFRCxZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM5QixlQUFPLElBQUksQ0FBQztPQUNiOzs7Ozs7U0EvL0VVLE1BQU07R0FBUyxTQUFTIiwiZmlsZSI6InNyYy9wYXJzZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAyMDE0IFNoYXBlIFNlY3VyaXR5LCBJbmMuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKVxuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0ICogYXMgU2hpZnQgZnJvbSBcInNoaWZ0LWFzdFwiO1xuXG5pbXBvcnQge2lzUmVzdHJpY3RlZFdvcmQsIGlzU3RyaWN0TW9kZVJlc2VydmVkV29yZH0gZnJvbSBcIi4vdXRpbHNcIjtcblxuaW1wb3J0IHtFcnJvck1lc3NhZ2VzfSBmcm9tIFwiLi9lcnJvcnNcIjtcblxuaW1wb3J0IFRva2VuaXplciwgeyBUb2tlbkNsYXNzLCBUb2tlblR5cGUgfSBmcm9tIFwiLi90b2tlbml6ZXJcIjtcblxuLy8gRW1wdHkgcGFyYW1ldGVyIGxpc3QgZm9yIEFycm93RXhwcmVzc2lvblxuY29uc3QgQVJST1dfRVhQUkVTU0lPTl9QQVJBTVMgPSBcIkNvdmVyUGFyZW50aGVzaXplZEV4cHJlc3Npb25BbmRBcnJvd1BhcmFtZXRlckxpc3RcIjtcblxuY29uc3QgU1RSSUNUX01PREVfUkVTRVJWRURfV09SRCA9IHtcbiAgXCJpbXBsZW1lbnRzXCI6IG51bGwsIFwiaW50ZXJmYWNlXCI6IG51bGwsIFwicGFja2FnZVwiOiBudWxsLCBcInByaXZhdGVcIjogbnVsbCwgXCJwcm90ZWN0ZWRcIjogbnVsbCxcbiAgXCJwdWJsaWNcIjogbnVsbCwgXCJzdGF0aWNcIjogbnVsbCwgXCJ5aWVsZFwiOiBudWxsLCBcImxldFwiOiBudWxsXG59O1xuXG5jb25zdCBQcmVjZWRlbmNlID0ge1xuICBTZXF1ZW5jZTogMCxcbiAgWWllbGQ6IDEsXG4gIEFzc2lnbm1lbnQ6IDEsXG4gIENvbmRpdGlvbmFsOiAyLFxuICBBcnJvd0Z1bmN0aW9uOiAyLFxuICBMb2dpY2FsT1I6IDMsXG4gIExvZ2ljYWxBTkQ6IDQsXG4gIEJpdHdpc2VPUjogNSxcbiAgQml0d2lzZVhPUjogNixcbiAgQml0d2lzZUFORDogNyxcbiAgRXF1YWxpdHk6IDgsXG4gIFJlbGF0aW9uYWw6IDksXG4gIEJpdHdpc2VTSElGVDogMTAsXG4gIEFkZGl0aXZlOiAxMSxcbiAgTXVsdGlwbGljYXRpdmU6IDEyLFxuICBVbmFyeTogMTMsXG4gIFBvc3RmaXg6IDE0LFxuICBDYWxsOiAxNSxcbiAgTmV3OiAxNixcbiAgVGFnZ2VkVGVtcGxhdGU6IDE3LFxuICBNZW1iZXI6IDE4LFxuICBQcmltYXJ5OiAxOVxufTtcblxuY29uc3QgQmluYXJ5UHJlY2VkZW5jZSA9IHtcbiAgXCJ8fFwiOiBQcmVjZWRlbmNlLkxvZ2ljYWxPUixcbiAgXCImJlwiOiBQcmVjZWRlbmNlLkxvZ2ljYWxBTkQsXG4gIFwifFwiOiBQcmVjZWRlbmNlLkJpdHdpc2VPUixcbiAgXCJeXCI6IFByZWNlZGVuY2UuQml0d2lzZVhPUixcbiAgXCImXCI6IFByZWNlZGVuY2UuQml0d2lzZUFORCxcbiAgXCI9PVwiOiBQcmVjZWRlbmNlLkVxdWFsaXR5LFxuICBcIiE9XCI6IFByZWNlZGVuY2UuRXF1YWxpdHksXG4gIFwiPT09XCI6IFByZWNlZGVuY2UuRXF1YWxpdHksXG4gIFwiIT09XCI6IFByZWNlZGVuY2UuRXF1YWxpdHksXG4gIFwiPFwiOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gIFwiPlwiOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gIFwiPD1cIjogUHJlY2VkZW5jZS5SZWxhdGlvbmFsLFxuICBcIj49XCI6IFByZWNlZGVuY2UuUmVsYXRpb25hbCxcbiAgXCJpblwiOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gIFwiaW5zdGFuY2VvZlwiOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gIFwiPDxcIjogUHJlY2VkZW5jZS5CaXR3aXNlU0hJRlQsXG4gIFwiPj5cIjogUHJlY2VkZW5jZS5CaXR3aXNlU0hJRlQsXG4gIFwiPj4+XCI6IFByZWNlZGVuY2UuQml0d2lzZVNISUZULFxuICBcIitcIjogUHJlY2VkZW5jZS5BZGRpdGl2ZSxcbiAgXCItXCI6IFByZWNlZGVuY2UuQWRkaXRpdmUsXG4gIFwiKlwiOiBQcmVjZWRlbmNlLk11bHRpcGxpY2F0aXZlLFxuICBcIiVcIjogUHJlY2VkZW5jZS5NdWx0aXBsaWNhdGl2ZSxcbiAgXCIvXCI6IFByZWNlZGVuY2UuTXVsdGlwbGljYXRpdmUsXG59O1xuXG5jb25zdCBGT1JfT0ZfVkFSID0ge307XG5cbmZ1bmN0aW9uIGNvcHlMb2NhdGlvbihmcm9tLCB0bykge1xuICBpZiAoXCJsb2NcIiBpbiBmcm9tKSB7XG4gICAgdG8ubG9jID0gZnJvbS5sb2M7XG4gIH1cbiAgcmV0dXJuIHRvO1xufVxuXG4vKipcbiAqXG4gKiBAcGFyYW0ge1tzdHJpbmddfSBzdHJpbmdzXG4gKiBAcmV0dXJucyB7c3RyaW5nP31cbiAqL1xuZnVuY3Rpb24gZmlyc3REdXBsaWNhdGUoc3RyaW5ncykge1xuICBpZiAoc3RyaW5ncy5sZW5ndGggPCAyKSByZXR1cm4gbnVsbDtcbiAgbGV0IG1hcCA9IHt9O1xuICBmb3IgKGxldCBjdXJzb3IgPSAwOyBjdXJzb3IgPCBzdHJpbmdzLmxlbmd0aDsgY3Vyc29yKyspIHtcbiAgICBsZXQgaWQgPSBcIiRcIiArIHN0cmluZ3NbY3Vyc29yXTtcbiAgICBpZiAobWFwLmhhc093blByb3BlcnR5KGlkKSkge1xuICAgICAgcmV0dXJuIHN0cmluZ3NbY3Vyc29yXTtcbiAgICB9XG4gICAgbWFwW2lkXSA9IHRydWU7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGhhc1N0cmljdE1vZGVSZXNlcnZlZFdvcmQoaWRzKSB7XG4gIHJldHVybiBpZHMuc29tZShpZCA9PiBTVFJJQ1RfTU9ERV9SRVNFUlZFRF9XT1JELmhhc093blByb3BlcnR5KGlkKSk7XG59XG5cbmV4cG9ydCBjbGFzcyBQYXJzZXIgZXh0ZW5kcyBUb2tlbml6ZXIge1xuICBjb25zdHJ1Y3Rvcihzb3VyY2UpIHtcbiAgICBzdXBlcihzb3VyY2UpO1xuICAgIHRoaXMubGFiZWxTZXQgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIHRoaXMuTEROID0gW107XG4gICAgdGhpcy5WRE4gPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIHRoaXMuYWxsb3dJbiA9IHRydWU7XG4gICAgdGhpcy5pbkl0ZXJhdGlvbiA9IGZhbHNlO1xuICAgIHRoaXMuaW5Td2l0Y2ggPSBmYWxzZTtcbiAgICB0aGlzLmluRnVuY3Rpb25Cb2R5ID0gZmFsc2U7XG4gICAgdGhpcy5pbk1ldGhvZCA9IGZhbHNlO1xuICAgIHRoaXMuaW5Db25zdHJ1Y3RvciA9IGZhbHNlO1xuICAgIHRoaXMuaGFzQ2xhc3NIZXJpdGFnZSA9IGZhbHNlO1xuICAgIHRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXIgPSBmYWxzZTtcbiAgICB0aGlzLmluUGFyYW1ldGVyID0gZmFsc2U7XG4gICAgdGhpcy5pbkdlbmVyYXRvckJvZHkgPSBmYWxzZTtcbiAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gZmFsc2U7XG4gICAgdGhpcy5hbGxvd0xhYmVsZWRGdW5jdGlvbiA9IHRydWU7XG4gICAgdGhpcy5tb2R1bGUgPSBmYWxzZTtcbiAgICB0aGlzLnN0cmljdCA9IGZhbHNlO1xuICAgIHRoaXMuYWxsb3dCaW5kaW5nUGF0dGVybiA9IGZhbHNlO1xuICB9XG5cbiAgZWF0KHRva2VuVHlwZSkge1xuICAgIGlmICh0aGlzLmxvb2thaGVhZC50eXBlID09PSB0b2tlblR5cGUpIHtcbiAgICAgIHJldHVybiB0aGlzLmxleCgpO1xuICAgIH1cbiAgfVxuXG4gIGV4cGVjdCh0b2tlblR5cGUpIHtcbiAgICBpZiAodGhpcy5sb29rYWhlYWQudHlwZSA9PT0gdG9rZW5UeXBlKSB7XG4gICAgICByZXR1cm4gdGhpcy5sZXgoKTtcbiAgICB9XG4gICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgfVxuXG4gIG1hdGNoQ29udGV4dHVhbEtleXdvcmQoa2V5d29yZCkge1xuICAgIHJldHVybiB0aGlzLmxvb2thaGVhZC50eXBlID09PSBUb2tlblR5cGUuSURFTlRJRklFUiAmJiB0aGlzLmxvb2thaGVhZC52YWx1ZSA9PT0ga2V5d29yZDtcbiAgfVxuXG4gIGV4cGVjdENvbnRleHR1YWxLZXl3b3JkKGtleXdvcmQpIHtcbiAgICBpZiAodGhpcy5tYXRjaENvbnRleHR1YWxLZXl3b3JkKGtleXdvcmQpKSB7XG4gICAgICByZXR1cm4gdGhpcy5sZXgoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICB9XG4gIH1cblxuICBlYXRDb250ZXh0dWFsS2V5d29yZChrZXl3b3JkKSB7XG4gICAgaWYgKHRoaXMubWF0Y2hDb250ZXh0dWFsS2V5d29yZChrZXl3b3JkKSkge1xuICAgICAgcmV0dXJuIHRoaXMubGV4KCk7XG4gICAgfVxuICB9XG5cbiAgbWF0Y2goc3ViVHlwZSkge1xuICAgIHJldHVybiB0aGlzLmxvb2thaGVhZC50eXBlID09PSBzdWJUeXBlO1xuICB9XG5cbiAgY29uc3VtZVNlbWljb2xvbigpIHtcbiAgICBpZiAodGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLlNFTUlDT0xPTikpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuZW9mKCkgJiYgIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJCUkFDRSkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgfVxuICB9XG5cbiAgLy8gdGhpcyBpcyBhIG5vLW9wLCByZXNlcnZlZCBmb3IgZnV0dXJlIHVzZVxuICBtYXJrTG9jYXRpb24obm9kZSwgc3RhcnRMb2NhdGlvbikge1xuICAgIHJldHVybiBub2RlO1xuICB9XG5cbiAgd3JhcFZETihmLCBwb3N0KSB7XG4gICAgbGV0IG9yaWdpbmFsVkROID0gdGhpcy5WRE47XG4gICAgdGhpcy5WRE4gPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIGxldCByZXN1bHQgPSBmLmNhbGwodGhpcyk7XG4gICAgaWYgKHBvc3QpIHBvc3QuY2FsbCh0aGlzKTtcblxuICAgIGZvciAobGV0IGtleSBpbiB0aGlzLlZETikge1xuICAgICAgb3JpZ2luYWxWRE5ba2V5XSA9IHRoaXMuVkROW2tleV07XG4gICAgfVxuICAgIHRoaXMuVkROID0gb3JpZ2luYWxWRE47XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGNoZWNrQmxvY2tTY29wZSgpIHtcbiAgICBsZXQgZHVwbGljYXRlID0gZmlyc3REdXBsaWNhdGUodGhpcy5MRE4pO1xuICAgIGlmIChkdXBsaWNhdGUgIT09IG51bGwpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5EVVBMSUNBVEVfQklORElORywgZHVwbGljYXRlKTtcbiAgICB9XG4gICAgdGhpcy5MRE4uZm9yRWFjaChuYW1lID0+IHtcbiAgICAgIGlmICh7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRoaXMuVkROLCBcIiRcIiArIG5hbWUpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5EVVBMSUNBVEVfQklORElORywgbmFtZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBwYXJzZU1vZHVsZSgpIHtcbiAgICB0aGlzLm1vZHVsZSA9IHRydWU7XG4gICAgdGhpcy5zdHJpY3QgPSB0cnVlO1xuXG4gICAgdGhpcy5sb29rYWhlYWQgPSB0aGlzLmFkdmFuY2UoKTtcbiAgICBsZXQgbG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IGV4cG9ydGVkTmFtZXMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIGxldCBleHBvcnRlZEJpbmRpbmdzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICBsZXQgaXRlbXMgPSBbXTtcbiAgICB3aGlsZSAoIXRoaXMuZW9mKCkpIHtcbiAgICAgIGl0ZW1zLnB1c2godGhpcy5wYXJzZU1vZHVsZUl0ZW0oZXhwb3J0ZWROYW1lcywgZXhwb3J0ZWRCaW5kaW5ncykpO1xuICAgIH1cbiAgICBmb3IgKGxldCBrZXkgaW4gZXhwb3J0ZWRCaW5kaW5ncykge1xuICAgICAgaWYgKCF7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRoaXMuVkROLCBrZXkpICYmIHRoaXMuTEROLmluZGV4T2Yoa2V5LnNsaWNlKDEpKSA9PT0gLTEpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLk1PRFVMRV9FWFBPUlRfVU5ERUZJTkVELCBrZXkuc2xpY2UoMSkpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmNoZWNrQmxvY2tTY29wZSgpO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuTW9kdWxlKGl0ZW1zKSwgbG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VTY3JpcHQoKSB7XG4gICAgdGhpcy5sb29rYWhlYWQgPSB0aGlzLmFkdmFuY2UoKTtcblxuICAgIGxldCBsb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgb3JpZ2luYWxMRE4gPSB0aGlzLkxETjtcbiAgICB0aGlzLkxETiA9IFtdO1xuXG4gICAgbGV0IFtib2R5XSA9IHRoaXMucGFyc2VCb2R5KCk7XG4gICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5FT1MpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuICAgIH1cbiAgICB0aGlzLmNoZWNrQmxvY2tTY29wZSgpO1xuICAgIHRoaXMuTEROID0gb3JpZ2luYWxMRE47XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5TY3JpcHQoYm9keSksIGxvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlRnVuY3Rpb25Cb2R5KGJvdW5kUGFyYW1zKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICBsZXQgb2xkVkROID0gdGhpcy5WRE47XG4gICAgdGhpcy5WRE4gPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4gICAgbGV0IG9yaWdpbmFsTEROID0gdGhpcy5MRE47XG4gICAgdGhpcy5MRE4gPSBbXTtcblxuICAgIGJvdW5kUGFyYW1zLmZvckVhY2gobmFtZSA9PiB0aGlzLlZETltcIiRcIiArIG5hbWVdID0gdHJ1ZSk7XG5cbiAgICBsZXQgb2xkTGFiZWxTZXQgPSB0aGlzLmxhYmVsU2V0O1xuICAgIGxldCBvbGRJbkl0ZXJhdGlvbiA9IHRoaXMuaW5JdGVyYXRpb247XG4gICAgbGV0IG9sZEluU3dpdGNoID0gdGhpcy5pblN3aXRjaDtcbiAgICBsZXQgb2xkSW5GdW5jdGlvbkJvZHkgPSB0aGlzLmluRnVuY3Rpb25Cb2R5O1xuICAgIGxldCBwcmV2aW91c1N0cmljdCA9IHRoaXMuc3RyaWN0O1xuICAgIGxldCBvbGRNb2R1bGUgPSB0aGlzLm1vZHVsZTtcblxuICAgIHRoaXMubGFiZWxTZXQgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIHRoaXMuaW5JdGVyYXRpb24gPSBmYWxzZTtcbiAgICB0aGlzLmluU3dpdGNoID0gZmFsc2U7XG4gICAgdGhpcy5pbkZ1bmN0aW9uQm9keSA9IHRydWU7XG4gICAgdGhpcy5tb2R1bGUgPSBmYWxzZTtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MQlJBQ0UpO1xuICAgIGxldCBbYm9keSwgaXNTdHJpY3RdID0gdGhpcy5wYXJzZUJvZHkoKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUkJSQUNFKTtcblxuICAgIHRoaXMuY2hlY2tCbG9ja1Njb3BlKCk7XG5cbiAgICB0aGlzLlZETiA9IG9sZFZETjtcbiAgICB0aGlzLkxETiA9IG9yaWdpbmFsTEROO1xuXG4gICAgYm9keSA9IHRoaXMubWFya0xvY2F0aW9uKGJvZHksIHN0YXJ0TG9jYXRpb24pO1xuXG4gICAgdGhpcy5sYWJlbFNldCA9IG9sZExhYmVsU2V0O1xuICAgIHRoaXMuaW5JdGVyYXRpb24gPSBvbGRJbkl0ZXJhdGlvbjtcbiAgICB0aGlzLmluU3dpdGNoID0gb2xkSW5Td2l0Y2g7XG4gICAgdGhpcy5pbkZ1bmN0aW9uQm9keSA9IG9sZEluRnVuY3Rpb25Cb2R5O1xuICAgIHRoaXMuc3RyaWN0ID0gcHJldmlvdXNTdHJpY3Q7XG4gICAgdGhpcy5tb2R1bGUgPSBvbGRNb2R1bGU7XG4gICAgcmV0dXJuIFtib2R5LCBpc1N0cmljdF07XG4gIH1cblxuICBwYXJzZUJvZHkoKSB7XG4gICAgbGV0IGxvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCBkaXJlY3RpdmVzID0gW107XG4gICAgbGV0IHN0YXRlbWVudHMgPSBbXTtcbiAgICBsZXQgcGFyc2luZ0RpcmVjdGl2ZXMgPSB0cnVlO1xuICAgIGxldCBpc1N0cmljdCA9IHRoaXMuc3RyaWN0O1xuICAgIGxldCBmaXJzdFJlc3RyaWN0ZWQgPSBudWxsO1xuICAgIHRoaXMud3JhcFZETigoKSA9PiB7XG4gICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICBpZiAodGhpcy5lb2YoKSB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0UpKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgICAgIGxldCB0ZXh0ID0gdG9rZW4uc2xpY2UudGV4dDtcbiAgICAgICAgbGV0IGlzU3RyaW5nTGl0ZXJhbCA9IHRva2VuLnR5cGUgPT09IFRva2VuVHlwZS5TVFJJTkc7XG4gICAgICAgIGxldCBkaXJlY3RpdmVMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICAgICAgbGV0IHN0bXQgPSB0aGlzLnBhcnNlU3RhdGVtZW50TGlzdEl0ZW0oe2lzVG9wTGV2ZWw6IHRydWV9KTtcbiAgICAgICAgaWYgKHBhcnNpbmdEaXJlY3RpdmVzKSB7XG4gICAgICAgICAgaWYgKGlzU3RyaW5nTGl0ZXJhbCAmJiBzdG10LnR5cGUgPT09IFwiRXhwcmVzc2lvblN0YXRlbWVudFwiICYmXG4gICAgICAgICAgICBzdG10LmV4cHJlc3Npb24udHlwZSA9PT0gXCJMaXRlcmFsU3RyaW5nRXhwcmVzc2lvblwiKSB7XG4gICAgICAgICAgICBpZiAodGV4dCA9PT0gXCJcXFwidXNlIHN0cmljdFxcXCJcIiB8fCB0ZXh0ID09PSBcIid1c2Ugc3RyaWN0J1wiKSB7XG4gICAgICAgICAgICAgIGlzU3RyaWN0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgdGhpcy5zdHJpY3QgPSB0cnVlO1xuICAgICAgICAgICAgICBpZiAoZmlyc3RSZXN0cmljdGVkICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKGZpcnN0UmVzdHJpY3RlZCwgRXJyb3JNZXNzYWdlcy5TVFJJQ1RfT0NUQUxfTElURVJBTCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmlyc3RSZXN0cmljdGVkID09IG51bGwgJiYgdG9rZW4ub2N0YWwpIHtcbiAgICAgICAgICAgICAgZmlyc3RSZXN0cmljdGVkID0gdG9rZW47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkaXJlY3RpdmVzLnB1c2godGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkRpcmVjdGl2ZSh0ZXh0LnNsaWNlKDEsIC0xKSksIGRpcmVjdGl2ZUxvY2F0aW9uKSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBhcnNpbmdEaXJlY3RpdmVzID0gZmFsc2U7XG4gICAgICAgICAgICBzdGF0ZW1lbnRzLnB1c2goc3RtdCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0YXRlbWVudHMucHVzaChzdG10KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sICgpID0+IHtcblxuICAgIH0pO1xuICAgIHJldHVybiBbdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkZ1bmN0aW9uQm9keShkaXJlY3RpdmVzLCBzdGF0ZW1lbnRzKSwgbG9jYXRpb24pLCBpc1N0cmljdF07XG4gIH1cblxuICBwYXJzZUltcG9ydFNwZWNpZmllcihib3VuZE5hbWVzKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCksIGlkZW50aWZpZXI7XG4gICAgaWYgKHRoaXMubG9va2FoZWFkLnR5cGUgPT09IFRva2VuVHlwZS5JREVOVElGSUVSKSB7XG4gICAgICBpZGVudGlmaWVyID0gdGhpcy5wYXJzZUlkZW50aWZpZXIoKTtcbiAgICAgIGlmICghdGhpcy5lYXRDb250ZXh0dWFsS2V5d29yZChcImFzXCIpKSB7XG4gICAgICAgIGlmICh7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGJvdW5kTmFtZXMsIFwiJFwiICsgaWRlbnRpZmllcikpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHN0YXJ0TG9jYXRpb24sIEVycm9yTWVzc2FnZXMuSU1QT1JUX0RVUEUpO1xuICAgICAgICB9XG4gICAgICAgIGJvdW5kTmFtZXNbXCIkXCIgKyBpZGVudGlmaWVyXSA9IHRydWU7XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihcbiAgICAgICAgICBuZXcgU2hpZnQuSW1wb3J0U3BlY2lmaWVyKFxuICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgIHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJCaW5kaW5nSWRlbnRpZmllclwiLCBuYW1lOiBpZGVudGlmaWVyIH0sIHN0YXJ0TG9jYXRpb24pKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0aGlzLmxvb2thaGVhZC50eXBlLmtsYXNzLmlzSWRlbnRpZmllck5hbWUpIHtcbiAgICAgIGlkZW50aWZpZXIgPSB0aGlzLnBhcnNlSWRlbnRpZmllck5hbWUoKTtcbiAgICAgIHRoaXMuZXhwZWN0Q29udGV4dHVhbEtleXdvcmQoXCJhc1wiKTtcbiAgICB9XG5cbiAgICBsZXQgbG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IGJvdW5kTmFtZSA9IHRoaXMucGFyc2VJZGVudGlmaWVyKCk7XG4gICAgaWYgKHt9Lmhhc093blByb3BlcnR5LmNhbGwoYm91bmROYW1lcywgXCIkXCIgKyBib3VuZE5hbWUpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKGxvY2F0aW9uLCBFcnJvck1lc3NhZ2VzLklNUE9SVF9EVVBFKTtcbiAgICB9XG4gICAgYm91bmROYW1lc1tcIiRcIiArIGJvdW5kTmFtZV0gPSB0cnVlO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihcbiAgICAgIG5ldyBTaGlmdC5JbXBvcnRTcGVjaWZpZXIoXG4gICAgICAgIGlkZW50aWZpZXIsXG4gICAgICAgIHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJCaW5kaW5nSWRlbnRpZmllclwiLCBuYW1lOiBib3VuZE5hbWUgfSwgbG9jYXRpb24pKSxcbiAgICAgIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VOYW1lU3BhY2VCaW5kaW5nKGJvdW5kTmFtZXMpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTVVMKTtcbiAgICB0aGlzLmV4cGVjdENvbnRleHR1YWxLZXl3b3JkKFwiYXNcIik7XG4gICAgbGV0IGlkZW50aWZpZXJMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgaWRlbnRpZmllciA9IHRoaXMucGFyc2VJZGVudGlmaWVyKCk7XG4gICAgaWYgKHt9Lmhhc093blByb3BlcnR5LmNhbGwoYm91bmROYW1lcywgXCIkXCIgKyBpZGVudGlmaWVyKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbihpZGVudGlmaWVyTG9jYXRpb24sIEVycm9yTWVzc2FnZXMuSU1QT1JUX0RVUEUpO1xuICAgIH1cbiAgICBib3VuZE5hbWVzW1wiJFwiICsgaWRlbnRpZmllcl0gPSB0cnVlO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiQmluZGluZ0lkZW50aWZpZXJcIiwgbmFtZTogaWRlbnRpZmllciB9LCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlTmFtZWRJbXBvcnRzKGJvdW5kTmFtZXMpIHtcbiAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxCUkFDRSk7XG4gICAgd2hpbGUgKCF0aGlzLmVhdChUb2tlblR5cGUuUkJSQUNFKSkge1xuICAgICAgcmVzdWx0LnB1c2godGhpcy5wYXJzZUltcG9ydFNwZWNpZmllcihib3VuZE5hbWVzKSk7XG4gICAgICBpZiAoIXRoaXMuZWF0KFRva2VuVHlwZS5DT01NQSkpIHtcbiAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJCUkFDRSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgcGFyc2VGcm9tQ2xhdXNlKCkge1xuICAgIHRoaXMuZXhwZWN0Q29udGV4dHVhbEtleXdvcmQoXCJmcm9tXCIpO1xuICAgIGxldCB2YWx1ZSA9IHRoaXMuZXhwZWN0KFRva2VuVHlwZS5TVFJJTkcpLl92YWx1ZTtcbiAgICB0aGlzLmNvbnN1bWVTZW1pY29sb24oKTtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICBwYXJzZUltcG9ydERlY2xhcmF0aW9uKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpLCBkZWZhdWx0QmluZGluZyA9IG51bGwsIG1vZHVsZVNwZWNpZmllciwgYm91bmROYW1lcyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLklNUE9SVCk7XG4gICAgc3dpdGNoICh0aGlzLmxvb2thaGVhZC50eXBlKSB7XG4gICAgICBjYXNlIFRva2VuVHlwZS5TVFJJTkc6XG4gICAgICAgIG1vZHVsZVNwZWNpZmllciA9IHRoaXMubGV4KCkuX3ZhbHVlO1xuICAgICAgICB0aGlzLmNvbnN1bWVTZW1pY29sb24oKTtcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5JbXBvcnQobnVsbCwgW10sIG1vZHVsZVNwZWNpZmllciksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgY2FzZSBUb2tlblR5cGUuSURFTlRJRklFUjpcbiAgICAgICAgZGVmYXVsdEJpbmRpbmcgPSB0aGlzLmV4cGVjdChUb2tlblR5cGUuSURFTlRJRklFUikudmFsdWU7XG4gICAgICAgIGJvdW5kTmFtZXNbXCIkXCIgKyBkZWZhdWx0QmluZGluZ10gPSB0cnVlO1xuICAgICAgICBpZiAoIXRoaXMuZWF0KFRva2VuVHlwZS5DT01NQSkpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkltcG9ydChkZWZhdWx0QmluZGluZywgW10sIHRoaXMucGFyc2VGcm9tQ2xhdXNlKCkpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICB9XG4gICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLk1VTCkpIHtcbiAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuSW1wb3J0TmFtZXNwYWNlKGRlZmF1bHRCaW5kaW5nLCB0aGlzLnBhcnNlTmFtZVNwYWNlQmluZGluZyhib3VuZE5hbWVzKSwgdGhpcy5wYXJzZUZyb21DbGF1c2UoKSksIHN0YXJ0TG9jYXRpb24pO1xuICAgIH0gZWxzZSBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuTEJSQUNFKSkge1xuICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5JbXBvcnQoZGVmYXVsdEJpbmRpbmcsIHRoaXMucGFyc2VOYW1lZEltcG9ydHMoYm91bmROYW1lcyksIHRoaXMucGFyc2VGcm9tQ2xhdXNlKCkpLCBzdGFydExvY2F0aW9uKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICB9XG4gIH1cblxuICBwYXJzZUV4cG9ydFNwZWNpZmllcihleHBvcnRlZE5hbWVzLCBleHBvcnRlZEJpbmRpbmdzKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IG5hbWUgPSB0aGlzLnBhcnNlSWRlbnRpZmllcigpO1xuICAgIGV4cG9ydGVkQmluZGluZ3NbXCIkXCIgKyBuYW1lXSA9IHRydWU7XG4gICAgaWYgKHRoaXMuZWF0Q29udGV4dHVhbEtleXdvcmQoXCJhc1wiKSkge1xuICAgICAgbGV0IGV4cG9ydGVkTmFtZSA9IHRoaXMucGFyc2VJZGVudGlmaWVyTmFtZSgpO1xuICAgICAgaWYgKHt9Lmhhc093blByb3BlcnR5LmNhbGwoZXhwb3J0ZWROYW1lcywgXCIkXCIgKyBleHBvcnRlZE5hbWUpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5EVVBMSUNBVEVfRVhQT1JURURfTkFNRSwgZXhwb3J0ZWROYW1lKTtcbiAgICAgIH1cbiAgICAgIGV4cG9ydGVkTmFtZXNbXCIkXCIgKyBleHBvcnRlZE5hbWVdID0gdHJ1ZTtcbiAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuRXhwb3J0U3BlY2lmaWVyKG5hbWUsIGV4cG9ydGVkTmFtZSksIHN0YXJ0TG9jYXRpb24pO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoe30uaGFzT3duUHJvcGVydHkuY2FsbChleHBvcnRlZE5hbWVzLCBcIiRcIiArIG5hbWUpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5EVVBMSUNBVEVfRVhQT1JURURfTkFNRSwgbmFtZSk7XG4gICAgICB9XG4gICAgICBleHBvcnRlZE5hbWVzW1wiJFwiICsgbmFtZV0gPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkV4cG9ydFNwZWNpZmllcihudWxsLCBuYW1lKSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZUV4cG9ydENsYXVzZShleHBvcnRlZE5hbWVzLCBleHBvcnRlZEJpbmRpbmdzKSB7XG4gICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MQlJBQ0UpO1xuICAgIHdoaWxlICghdGhpcy5lYXQoVG9rZW5UeXBlLlJCUkFDRSkpIHtcbiAgICAgIHJlc3VsdC5wdXNoKHRoaXMucGFyc2VFeHBvcnRTcGVjaWZpZXIoZXhwb3J0ZWROYW1lcywgZXhwb3J0ZWRCaW5kaW5ncykpO1xuICAgICAgaWYgKCF0aGlzLmVhdChUb2tlblR5cGUuQ09NTUEpKSB7XG4gICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SQlJBQ0UpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHBhcnNlRXhwb3J0RGVjbGFyYXRpb24oZXhwb3J0ZWROYW1lcywgZXhwb3J0ZWRCaW5kaW5ncykge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpLCBkZWNsO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5FWFBPUlQpO1xuICAgIGxldCBpc1ZhciA9IGZhbHNlLCBrZXksIG9sZExETiA9IHRoaXMuTEROLCBvbGRWRE4gPSB0aGlzLlZETjtcbiAgICB0aGlzLkxETiA9IFtdO1xuICAgIHRoaXMuVkROID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICBzd2l0Y2ggKHRoaXMubG9va2FoZWFkLnR5cGUpIHtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk1VTDpcbiAgICAgICAgdGhpcy5sZXgoKTtcbiAgICAgICAgLy8gZXhwb3J0ICogRnJvbUNsYXVzZSA7XG4gICAgICAgIGRlY2wgPSBuZXcgU2hpZnQuRXhwb3J0QWxsRnJvbSh0aGlzLnBhcnNlRnJvbUNsYXVzZSgpKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFRva2VuVHlwZS5MQlJBQ0U6XG4gICAgICAgIC8vIGV4cG9ydCBFeHBvcnRDbGF1c2UgRnJvbUNsYXVzZSA7XG4gICAgICAgIC8vIGV4cG9ydCBFeHBvcnRDbGF1c2UgO1xuICAgICAgICBsZXQgbmFtZWRFeHBvcnRzID0gdGhpcy5wYXJzZUV4cG9ydENsYXVzZShleHBvcnRlZE5hbWVzLCBleHBvcnRlZEJpbmRpbmdzKTtcbiAgICAgICAgbGV0IGZyb21DbGF1c2UgPSBudWxsO1xuICAgICAgICBpZiAodGhpcy5tYXRjaENvbnRleHR1YWxLZXl3b3JkKFwiZnJvbVwiKSkge1xuICAgICAgICAgIGZyb21DbGF1c2UgPSB0aGlzLnBhcnNlRnJvbUNsYXVzZSgpO1xuICAgICAgICB9XG4gICAgICAgIGRlY2wgPSBuZXcgU2hpZnQuRXhwb3J0RnJvbShuYW1lZEV4cG9ydHMsIGZyb21DbGF1c2UpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkNMQVNTOlxuICAgICAgICAvLyBleHBvcnQgQ2xhc3NEZWNsYXJhdGlvblxuICAgICAgICBkZWNsID0gbmV3IFNoaWZ0LkV4cG9ydCh0aGlzLnBhcnNlQ2xhc3Moe2lzRXhwcjogZmFsc2V9KSk7XG4gICAgICAgIGlmICh7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGV4cG9ydGVkTmFtZXMsIFwiJFwiICsgZGVjbC5kZWNsYXJhdGlvbi5uYW1lLm5hbWUpKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLkRVUExJQ0FURV9FWFBPUlRFRF9OQU1FLCBkZWNsLmRlY2xhcmF0aW9uLm5hbWUubmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAga2V5ID0gZGVjbC5kZWNsYXJhdGlvbi5uYW1lLm5hbWU7XG4gICAgICAgIGV4cG9ydGVkTmFtZXNbXCIkXCIgKyBrZXldID0gdHJ1ZTtcbiAgICAgICAgZXhwb3J0ZWRCaW5kaW5nc1tcIiRcIiArIGtleV0gPSB0cnVlO1xuICAgICAgICBvbGRMRE4ucHVzaChrZXkpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkZVTkNUSU9OOlxuICAgICAgICAvLyBleHBvcnQgSG9pc3RhYmxlRGVjbGFyYXRpb25cbiAgICAgICAgZGVjbCA9IG5ldyBTaGlmdC5FeHBvcnQodGhpcy5wYXJzZUZ1bmN0aW9uKHtpc0V4cHI6IGZhbHNlLCBpc1RvcExldmVsOiB0cnVlfSkpO1xuICAgICAgICBpZiAoe30uaGFzT3duUHJvcGVydHkuY2FsbChleHBvcnRlZE5hbWVzLCBcIiRcIiArIGRlY2wuZGVjbGFyYXRpb24ubmFtZS5uYW1lKSkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5EVVBMSUNBVEVfRVhQT1JURURfTkFNRSwgZGVjbC5kZWNsYXJhdGlvbi5uYW1lLm5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIGtleSA9IGRlY2wuZGVjbGFyYXRpb24ubmFtZS5uYW1lO1xuICAgICAgICBleHBvcnRlZE5hbWVzW1wiJFwiICsga2V5XSA9IHRydWU7XG4gICAgICAgIGV4cG9ydGVkQmluZGluZ3NbXCIkXCIgKyBrZXldID0gdHJ1ZTtcbiAgICAgICAgb2xkTEROLnB1c2goa2V5KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFRva2VuVHlwZS5ERUZBVUxUOlxuICAgICAgICBpZiAoe30uaGFzT3duUHJvcGVydHkuY2FsbChleHBvcnRlZE5hbWVzLCBcIiRkZWZhdWx0XCIpKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLkRVUExJQ0FURV9FWFBPUlRFRF9OQU1FLCBcImRlZmF1bHRcIik7XG4gICAgICAgIH1cbiAgICAgICAgZXhwb3J0ZWROYW1lcy4kZGVmYXVsdCA9IHRydWU7XG4gICAgICAgIHRoaXMubGV4KCk7XG4gICAgICAgIHN3aXRjaCAodGhpcy5sb29rYWhlYWQudHlwZSkge1xuICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLkZVTkNUSU9OOlxuICAgICAgICAgICAgLy8gZXhwb3J0IGRlZmF1bHQgSG9pc3RhYmxlRGVjbGFyYXRpb25bRGVmYXVsdF1cbiAgICAgICAgICAgIGRlY2wgPSBuZXcgU2hpZnQuRXhwb3J0RGVmYXVsdCh0aGlzLnBhcnNlRnVuY3Rpb24oe2lzRXhwcjogZmFsc2UsIGluRGVmYXVsdDogdHJ1ZSwgaXNUb3BMZXZlbDogdHJ1ZX0pKTtcbiAgICAgICAgICAgIGtleSA9IGRlY2wuYm9keS5uYW1lLm5hbWU7XG4gICAgICAgICAgICBpZiAoa2V5ICE9PSBcIipkZWZhdWx0KlwiKSB7XG4gICAgICAgICAgICAgIGV4cG9ydGVkQmluZGluZ3NbXCIkXCIgKyBrZXldID0gdHJ1ZTtcbiAgICAgICAgICAgICAgb2xkTEROLnB1c2goa2V5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLkNMQVNTOlxuICAgICAgICAgICAgLy8gZXhwb3J0IGRlZmF1bHQgQ2xhc3NEZWNsYXJhdGlvbltEZWZhdWx0XVxuICAgICAgICAgICAgZGVjbCA9IG5ldyBTaGlmdC5FeHBvcnREZWZhdWx0KHRoaXMucGFyc2VDbGFzcyh7aXNFeHByOiBmYWxzZSwgaW5EZWZhdWx0OiB0cnVlfSkpO1xuICAgICAgICAgICAga2V5ID0gZGVjbC5ib2R5Lm5hbWUubmFtZTtcbiAgICAgICAgICAgIGlmIChrZXkgIT09IFwiKmRlZmF1bHQqXCIpIHtcbiAgICAgICAgICAgICAgZXhwb3J0ZWRCaW5kaW5nc1tcIiRcIiArIGtleV0gPSB0cnVlO1xuICAgICAgICAgICAgICBvbGRMRE4ucHVzaChrZXkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB7XG4gICAgICAgICAgICAvLyBleHBvcnQgZGVmYXVsdCBbbG9va2FoZWFkIOKIiSB7ZnVuY3Rpb24sIGNsYXNzfV0gQXNzaWdubWVudEV4cHJlc3Npb25bSW5dIDtcbiAgICAgICAgICAgIGRlY2wgPSBuZXcgU2hpZnQuRXhwb3J0RGVmYXVsdCh0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFRva2VuVHlwZS5WQVI6XG4gICAgICAgIGlzVmFyID0gdHJ1ZTtcbiAgICAgICAgLy8gZmFsbHMgdGhyb3VnaFxuICAgICAgY2FzZSBUb2tlblR5cGUuTEVUOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQ09OU1Q6XG4gICAgICAgIC8vIGV4cG9ydCBMZXhpY2FsRGVjbGFyYXRpb25cbiAgICAgIHtcbiAgICAgICAgbGV0IGJvdW5kTmFtZXMgPSBbXTtcbiAgICAgICAgZGVjbCA9IG5ldyBTaGlmdC5FeHBvcnQodGhpcy5wYXJzZVZhcmlhYmxlRGVjbGFyYXRpb24oe2JvdW5kTmFtZXN9KSk7XG4gICAgICAgIGJvdW5kTmFtZXMuZm9yRWFjaChuYW1lID0+IHtcbiAgICAgICAgICAgIGlmICh7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGV4cG9ydGVkTmFtZXMsIFwiJFwiICsgbmFtZSkpIHtcbiAgICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLkRVUExJQ0FURV9FWFBPUlRFRF9OQU1FLCBuYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGV4cG9ydGVkTmFtZXNbXCIkXCIgKyBuYW1lXSA9IHRydWU7XG4gICAgICAgICAgICBleHBvcnRlZEJpbmRpbmdzW1wiJFwiICsgbmFtZV0gPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgICAgaWYgKGlzVmFyKSB7XG4gICAgICAgICAgYm91bmROYW1lcy5mb3JFYWNoKG5hbWUgPT4gb2xkVkROW1wiJFwiICsgbmFtZV0gPSB0cnVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBbXS5wdXNoLmFwcGx5KG9sZExETiwgYm91bmROYW1lcyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jb25zdW1lU2VtaWNvbG9uKCk7XG4gICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICB9XG4gICAgdGhpcy5MRE4gPSBvbGRMRE47XG4gICAgdGhpcy5WRE4gPSBvbGRWRE47XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKGRlY2wsIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VNb2R1bGVJdGVtKGV4cG9ydGVkTmFtZXMsIGV4cG9ydGVkQmluZGluZ3MpIHtcbiAgICBzd2l0Y2ggKHRoaXMubG9va2FoZWFkLnR5cGUpIHtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLklNUE9SVDpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VJbXBvcnREZWNsYXJhdGlvbigpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuRVhQT1JUOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZUV4cG9ydERlY2xhcmF0aW9uKGV4cG9ydGVkTmFtZXMsIGV4cG9ydGVkQmluZGluZ3MpO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VTdGF0ZW1lbnRMaXN0SXRlbSgpO1xuICAgIH1cbiAgfVxuXG4gIGxvb2thaGVhZExleGljYWxEZWNsYXJhdGlvbigpIHtcbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuTEVUKSB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5DT05TVCkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuSURFTlRJRklFUikgJiYgdGhpcy5sb29rYWhlYWQudmFsdWUgPT09IFwibGV0XCIpIHtcbiAgICAgIGxldCBsZXhlclN0YXRlID0gdGhpcy5zYXZlTGV4ZXJTdGF0ZSgpO1xuICAgICAgdGhpcy5sZXgoKTtcbiAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5ZSUVMRCkgfHwgdGhpcy5tYXRjaChUb2tlblR5cGUuSURFTlRJRklFUikgfHxcbiAgICAgICAgdGhpcy5tYXRjaChUb2tlblR5cGUuTEJSQUNFKSB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5MQlJBQ0spKSB7XG4gICAgICAgIHRoaXMucmVzdG9yZUxleGVyU3RhdGUobGV4ZXJTdGF0ZSk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5yZXN0b3JlTGV4ZXJTdGF0ZShsZXhlclN0YXRlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcGFyc2VTdGF0ZW1lbnRMaXN0SXRlbSh7aXNUb3BMZXZlbCA9IGZhbHNlfSA9IHt9KSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgaWYgKHRoaXMuZW9mKCkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgfVxuXG4gICAgbGV0IGRlY2wgPSB0aGlzLndyYXBWRE4oKCkgPT4ge1xuICAgICAgc3dpdGNoICh0aGlzLmxvb2thaGVhZC50eXBlKSB7XG4gICAgICAgIGNhc2UgVG9rZW5UeXBlLkZVTkNUSU9OOlxuICAgICAgICAgIHJldHVybiB0aGlzLnBhcnNlRnVuY3Rpb24oe2lzRXhwcjogZmFsc2UsIGlzVG9wTGV2ZWx9KTtcbiAgICAgICAgY2FzZSBUb2tlblR5cGUuQ0xBU1M6XG4gICAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VDbGFzcyh7aXNFeHByOiBmYWxzZX0pO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGlmICh0aGlzLmxvb2thaGVhZExleGljYWxEZWNsYXJhdGlvbigpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJzZVZhcmlhYmxlRGVjbGFyYXRpb25TdGF0ZW1lbnQoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VTdGF0ZW1lbnQoe2FsbG93TGFiZWxlZEZ1bmN0aW9uOiB0cnVlLCBpc1RvcExldmVsfSk7XG4gICAgICB9XG4gICAgfSwgdGhpcy5jaGVja0Jsb2NrU2NvcGUpO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihkZWNsLCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlU3RhdGVtZW50KHthbGxvd0xhYmVsZWRGdW5jdGlvbiA9IGZhbHNlLCBpc1RvcExldmVsID0gZmFsc2V9ID0ge30pIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgb3JpZ2luYWxMRE4gPSB0aGlzLkxETjtcbiAgICB0aGlzLkxETiA9IFtdO1xuICAgIHZhciBzdG10ID0gdGhpcy53cmFwVkROKCgpID0+IHRoaXMucGFyc2VTdGF0ZW1lbnRIZWxwZXIoYWxsb3dMYWJlbGVkRnVuY3Rpb24sIG9yaWdpbmFsTEROLCBpc1RvcExldmVsKSk7XG4gICAgdGhpcy5MRE4gPSBvcmlnaW5hbExETjtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24oc3RtdCwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZVN0YXRlbWVudEhlbHBlcihhbGxvd0xhYmVsZWRGdW5jdGlvbiwgb3JpZ2luYWxMRE4sIGlzVG9wTGV2ZWwpIHtcbiAgICBpZiAodGhpcy5lb2YoKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICB9XG5cbiAgICBzd2l0Y2ggKHRoaXMubG9va2FoZWFkLnR5cGUpIHtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlNFTUlDT0xPTjpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VFbXB0eVN0YXRlbWVudCgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuTEJSQUNFOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZUJsb2NrU3RhdGVtZW50KCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5MUEFSRU46XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlRXhwcmVzc2lvblN0YXRlbWVudCgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuQlJFQUs6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlQnJlYWtTdGF0ZW1lbnQoKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkNPTlRJTlVFOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZUNvbnRpbnVlU3RhdGVtZW50KCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5ERUJVR0dFUjpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VEZWJ1Z2dlclN0YXRlbWVudCgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuRE86XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlRG9XaGlsZVN0YXRlbWVudCgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuRk9SOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZUZvclN0YXRlbWVudCgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuSUY6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlSWZTdGF0ZW1lbnQoKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlJFVFVSTjpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VSZXR1cm5TdGF0ZW1lbnQoKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlNXSVRDSDpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VTd2l0Y2hTdGF0ZW1lbnQoKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlRIUk9XOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZVRocm93U3RhdGVtZW50KCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5UUlk6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlVHJ5U3RhdGVtZW50KCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5WQVI6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlVmFyaWFibGVEZWNsYXJhdGlvblN0YXRlbWVudCgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuV0hJTEU6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlV2hpbGVTdGF0ZW1lbnQoKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLldJVEg6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlV2l0aFN0YXRlbWVudCgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuRlVOQ1RJT046XG4gICAgICBjYXNlIFRva2VuVHlwZS5DTEFTUzpcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcblxuICAgICAgZGVmYXVsdDoge1xuICAgICAgICBpZiAodGhpcy5sb29rYWhlYWRMZXhpY2FsRGVjbGFyYXRpb24oKSkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGV4cHIgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgICAvLyAxMi4xMiBMYWJlbGxlZCBTdGF0ZW1lbnRzO1xuICAgICAgICBpZiAoZXhwci50eXBlID09PSBcIklkZW50aWZpZXJFeHByZXNzaW9uXCIgJiYgdGhpcy5lYXQoVG9rZW5UeXBlLkNPTE9OKSkge1xuICAgICAgICAgIGxldCBrZXkgPSBcIiRcIiArIGV4cHIubmFtZTtcbiAgICAgICAgICBpZiAoe30uaGFzT3duUHJvcGVydHkuY2FsbCh0aGlzLmxhYmVsU2V0LCBrZXkpKSB7XG4gICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuTEFCRUxfUkVERUNMQVJBVElPTiwgZXhwci5uYW1lKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5MRE4gPSBvcmlnaW5hbExETjtcbiAgICAgICAgICB0aGlzLmxhYmVsU2V0W2tleV0gPSB0cnVlO1xuICAgICAgICAgIGxldCBsYWJlbGVkQm9keTtcbiAgICAgICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuRlVOQ1RJT04pKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5zdHJpY3QgfHwgIWFsbG93TGFiZWxlZEZ1bmN0aW9uKSB7XG4gICAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsYWJlbGVkQm9keSA9IHRoaXMucGFyc2VGdW5jdGlvbih7aXNFeHByOiBmYWxzZSwgYWxsb3dHZW5lcmF0b3I6IGZhbHNlLCBpc1RvcExldmVsfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxhYmVsZWRCb2R5ID0gdGhpcy5wYXJzZVN0YXRlbWVudCh7YWxsb3dMYWJlbGVkRnVuY3Rpb24sIGlzVG9wTGV2ZWx9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZGVsZXRlIHRoaXMubGFiZWxTZXRba2V5XTtcbiAgICAgICAgICByZXR1cm4gbmV3IFNoaWZ0LkxhYmVsZWRTdGF0ZW1lbnQoZXhwci5uYW1lLCBsYWJlbGVkQm9keSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5jb25zdW1lU2VtaWNvbG9uKCk7XG4gICAgICAgICAgcmV0dXJuIG5ldyBTaGlmdC5FeHByZXNzaW9uU3RhdGVtZW50KGV4cHIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcGFyc2VFbXB0eVN0YXRlbWVudCgpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuU0VNSUNPTE9OKTtcbiAgICByZXR1cm4gbmV3IFNoaWZ0LkVtcHR5U3RhdGVtZW50O1xuICB9XG5cbiAgcGFyc2VCbG9ja1N0YXRlbWVudCgpIHtcbiAgICBsZXQgc3RtdCA9IG5ldyBTaGlmdC5CbG9ja1N0YXRlbWVudCh0aGlzLnBhcnNlQmxvY2soKSk7XG4gICAgdGhpcy5jaGVja0Jsb2NrU2NvcGUoKTtcbiAgICByZXR1cm4gc3RtdDtcbiAgfVxuXG4gIHBhcnNlRXhwcmVzc2lvblN0YXRlbWVudCgpIHtcbiAgICBsZXQgZXhwciA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgdGhpcy5jb25zdW1lU2VtaWNvbG9uKCk7XG4gICAgcmV0dXJuIG5ldyBTaGlmdC5FeHByZXNzaW9uU3RhdGVtZW50KGV4cHIpO1xuICB9XG5cbiAgcGFyc2VCcmVha1N0YXRlbWVudCgpIHtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuQlJFQUspO1xuXG4gICAgLy8gQ2F0Y2ggdGhlIHZlcnkgY29tbW9uIGNhc2UgZmlyc3Q6IGltbWVkaWF0ZWx5IGEgc2VtaWNvbG9uIChVKzAwM0IpLlxuICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuU0VNSUNPTE9OKSkge1xuICAgICAgaWYgKCEodGhpcy5pbkl0ZXJhdGlvbiB8fCB0aGlzLmluU3dpdGNoKSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLklMTEVHQUxfQlJFQUspO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbmV3IFNoaWZ0LkJyZWFrU3RhdGVtZW50KG51bGwpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCkge1xuICAgICAgaWYgKCEodGhpcy5pbkl0ZXJhdGlvbiB8fCB0aGlzLmluU3dpdGNoKSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLklMTEVHQUxfQlJFQUspO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbmV3IFNoaWZ0LkJyZWFrU3RhdGVtZW50KG51bGwpO1xuICAgIH1cblxuICAgIGxldCBsYWJlbCA9IG51bGw7XG4gICAgaWYgKHRoaXMubG9va2FoZWFkLnR5cGUgPT09IFRva2VuVHlwZS5JREVOVElGSUVSKSB7XG4gICAgICBsYWJlbCA9IHRoaXMucGFyc2VJZGVudGlmaWVyKCk7XG5cbiAgICAgIGxldCBrZXkgPSBcIiRcIiArIGxhYmVsO1xuICAgICAgaWYgKCF7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRoaXMubGFiZWxTZXQsIGtleSkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlVOS05PV05fTEFCRUwsIGxhYmVsKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmNvbnN1bWVTZW1pY29sb24oKTtcblxuICAgIGlmIChsYWJlbCA9PSBudWxsICYmICEodGhpcy5pbkl0ZXJhdGlvbiB8fCB0aGlzLmluU3dpdGNoKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5JTExFR0FMX0JSRUFLKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFNoaWZ0LkJyZWFrU3RhdGVtZW50KGxhYmVsKTtcbiAgfVxuXG4gIHBhcnNlQ29udGludWVTdGF0ZW1lbnQoKSB7XG4gICAgbGV0IHRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNPTlRJTlVFKTtcblxuICAgIC8vIENhdGNoIHRoZSB2ZXJ5IGNvbW1vbiBjYXNlIGZpcnN0OiBpbW1lZGlhdGVseSBhIHNlbWljb2xvbiAoVSswMDNCKS5cbiAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLlNFTUlDT0xPTikpIHtcbiAgICAgIGlmICghdGhpcy5pbkl0ZXJhdGlvbikge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLklMTEVHQUxfQ09OVElOVUUpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbmV3IFNoaWZ0LkNvbnRpbnVlU3RhdGVtZW50KG51bGwpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCkge1xuICAgICAgaWYgKCF0aGlzLmluSXRlcmF0aW9uKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuSUxMRUdBTF9DT05USU5VRSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuZXcgU2hpZnQuQ29udGludWVTdGF0ZW1lbnQobnVsbCk7XG4gICAgfVxuXG4gICAgbGV0IGxhYmVsID0gbnVsbDtcbiAgICBpZiAodGhpcy5sb29rYWhlYWQudHlwZSA9PT0gVG9rZW5UeXBlLklERU5USUZJRVIpIHtcbiAgICAgIGxhYmVsID0gdGhpcy5wYXJzZUlkZW50aWZpZXIoKTtcblxuICAgICAgbGV0IGtleSA9IFwiJFwiICsgbGFiZWw7XG4gICAgICBpZiAoIXt9Lmhhc093blByb3BlcnR5LmNhbGwodGhpcy5sYWJlbFNldCwga2V5KSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5LTk9XTl9MQUJFTCwgbGFiZWwpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuY29uc3VtZVNlbWljb2xvbigpO1xuICAgIGlmICghdGhpcy5pbkl0ZXJhdGlvbikge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5JTExFR0FMX0NPTlRJTlVFKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFNoaWZ0LkNvbnRpbnVlU3RhdGVtZW50KGxhYmVsKTtcbiAgfVxuXG5cbiAgcGFyc2VEZWJ1Z2dlclN0YXRlbWVudCgpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuREVCVUdHRVIpO1xuICAgIHRoaXMuY29uc3VtZVNlbWljb2xvbigpO1xuICAgIHJldHVybiBuZXcgU2hpZnQuRGVidWdnZXJTdGF0ZW1lbnQ7XG4gIH1cblxuICBwYXJzZURvV2hpbGVTdGF0ZW1lbnQoKSB7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkRPKTtcbiAgICBsZXQgb2xkSW5JdGVyYXRpb24gPSB0aGlzLmluSXRlcmF0aW9uO1xuICAgIHRoaXMuaW5JdGVyYXRpb24gPSB0cnVlO1xuICAgIGxldCBib2R5ID0gdGhpcy5wYXJzZVN0YXRlbWVudCgpO1xuICAgIHRoaXMuaW5JdGVyYXRpb24gPSBvbGRJbkl0ZXJhdGlvbjtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5XSElMRSk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgbGV0IHRlc3QgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgIHRoaXMuZWF0KFRva2VuVHlwZS5TRU1JQ09MT04pO1xuXG4gICAgcmV0dXJuIG5ldyBTaGlmdC5Eb1doaWxlU3RhdGVtZW50KGJvZHksIHRlc3QpO1xuICB9XG5cbiAgc3RhdGljIHRyYW5zZm9ybURlc3RydWN0dXJpbmcobm9kZSkge1xuICAgIHN3aXRjaCAobm9kZS50eXBlKSB7XG4gICAgICBjYXNlIFwiT2JqZWN0RXhwcmVzc2lvblwiOlxuICAgICAgICByZXR1cm4gY29weUxvY2F0aW9uKG5vZGUsIG5ldyBTaGlmdC5PYmplY3RCaW5kaW5nKFxuICAgICAgICAgIG5vZGUucHJvcGVydGllcy5tYXAoUGFyc2VyLnRyYW5zZm9ybURlc3RydWN0dXJpbmcpXG4gICAgICAgICkpO1xuICAgICAgY2FzZSBcIkRhdGFQcm9wZXJ0eVwiOlxuICAgICAgICByZXR1cm4gY29weUxvY2F0aW9uKG5vZGUsIG5ldyBTaGlmdC5CaW5kaW5nUHJvcGVydHlQcm9wZXJ0eShcbiAgICAgICAgICBub2RlLm5hbWUsXG4gICAgICAgICAgUGFyc2VyLnRyYW5zZm9ybURlc3RydWN0dXJpbmcobm9kZS5leHByZXNzaW9uKVxuICAgICAgICApKTtcbiAgICAgIGNhc2UgXCJTaG9ydGhhbmRQcm9wZXJ0eVwiOlxuICAgICAgICByZXR1cm4gY29weUxvY2F0aW9uKG5vZGUsIHsgdHlwZTogXCJCaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyXCIsXG4gICAgICAgICAgYmluZGluZzogY29weUxvY2F0aW9uKG5vZGUsIHsgdHlwZTogXCJCaW5kaW5nSWRlbnRpZmllclwiLCBuYW1lOiBub2RlLm5hbWUgfSksXG4gICAgICAgICAgaW5pdDogbnVsbCxcbiAgICAgICAgfSk7XG4gICAgICBjYXNlIFwiQXJyYXlFeHByZXNzaW9uXCI6XG4gICAgICAgIGxldCBsYXN0ID0gbm9kZS5lbGVtZW50c1tub2RlLmVsZW1lbnRzLmxlbmd0aCAtIDFdO1xuICAgICAgICBpZiAobGFzdCAhPSBudWxsICYmIGxhc3QudHlwZSA9PT0gXCJTcHJlYWRFbGVtZW50XCIpIHtcbiAgICAgICAgICByZXR1cm4gY29weUxvY2F0aW9uKG5vZGUsIG5ldyBTaGlmdC5BcnJheUJpbmRpbmcoXG4gICAgICAgICAgICBub2RlLmVsZW1lbnRzLnNsaWNlKDAsIC0xKS5tYXAoZSA9PiBlICYmIFBhcnNlci50cmFuc2Zvcm1EZXN0cnVjdHVyaW5nKGUpKSxcbiAgICAgICAgICAgIGNvcHlMb2NhdGlvbihsYXN0LmV4cHJlc3Npb24sIFBhcnNlci50cmFuc2Zvcm1EZXN0cnVjdHVyaW5nKGxhc3QuZXhwcmVzc2lvbikpXG4gICAgICAgICAgKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGNvcHlMb2NhdGlvbihub2RlLCBuZXcgU2hpZnQuQXJyYXlCaW5kaW5nKFxuICAgICAgICAgICAgbm9kZS5lbGVtZW50cy5tYXAoZSA9PiBlICYmIFBhcnNlci50cmFuc2Zvcm1EZXN0cnVjdHVyaW5nKGUpKSxcbiAgICAgICAgICAgIG51bGxcbiAgICAgICAgICApKTtcbiAgICAgICAgfVxuICAgICAgY2FzZSBcIkFzc2lnbm1lbnRFeHByZXNzaW9uXCI6XG4gICAgICAgIHJldHVybiBjb3B5TG9jYXRpb24obm9kZSwgbmV3IFNoaWZ0LkJpbmRpbmdXaXRoRGVmYXVsdChcbiAgICAgICAgICBQYXJzZXIudHJhbnNmb3JtRGVzdHJ1Y3R1cmluZyhub2RlLmJpbmRpbmcpLFxuICAgICAgICAgIG5vZGUuZXhwcmVzc2lvblxuICAgICAgICApKTtcbiAgICAgIGNhc2UgXCJJZGVudGlmaWVyRXhwcmVzc2lvblwiOlxuICAgICAgICByZXR1cm4gY29weUxvY2F0aW9uKG5vZGUsIHsgdHlwZTogXCJCaW5kaW5nSWRlbnRpZmllclwiLCBuYW1lOiBub2RlLm5hbWUgfSk7XG4gICAgICBjYXNlIFwiQ29tcHV0ZWRNZW1iZXJFeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiU3RhdGljTWVtYmVyRXhwcmVzc2lvblwiOlxuICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgIGNhc2UgXCJBcnJheUJpbmRpbmdcIjpcbiAgICAgIGNhc2UgXCJCaW5kaW5nSWRlbnRpZmllclwiOlxuICAgICAgY2FzZSBcIkJpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXJcIjpcbiAgICAgIGNhc2UgXCJCaW5kaW5nUHJvcGVydHlQcm9wZXJ0eVwiOlxuICAgICAgY2FzZSBcIkJpbmRpbmdXaXRoRGVmYXVsdFwiOlxuICAgICAgY2FzZSBcIk9iamVjdEJpbmRpbmdcIjpcbiAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfVxuICB9XG5cbiAgc3RhdGljIGlzRGVzdHJ1Y3R1cmluZ1RhcmdldChub2RlLCBpc0xlYWZOb2RlKSB7XG4gICAgc3dpdGNoIChub2RlLnR5cGUpIHtcbiAgICAgIGNhc2UgXCJPYmplY3RFeHByZXNzaW9uXCI6XG4gICAgICAgIHJldHVybiBub2RlLnByb3BlcnRpZXMuZXZlcnkocCA9PlxuICAgICAgICAgIHAudHlwZSA9PT0gXCJCaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyXCIgfHxcbiAgICAgICAgICBwLnR5cGUgPT09IFwiU2hvcnRoYW5kUHJvcGVydHlcIiB8fFxuICAgICAgICAgIHAudHlwZSA9PT0gXCJEYXRhUHJvcGVydHlcIiAmJlxuICAgICAgICAgIFBhcnNlci5pc0Rlc3RydWN0dXJpbmdUYXJnZXRXaXRoRGVmYXVsdChwLmV4cHJlc3Npb24sIGlzTGVhZk5vZGUpXG4gICAgICAgICk7XG4gICAgICBjYXNlIFwiQXJyYXlFeHByZXNzaW9uXCI6XG4gICAgICAgIGlmIChub2RlLmVsZW1lbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBpZiAoIW5vZGUuZWxlbWVudHMuc2xpY2UoMCwgLTEpXG4gICAgICAgICAgICAuZmlsdGVyKGUgPT4gZSAhPSBudWxsKVxuICAgICAgICAgICAgLmV2ZXJ5KGUgPT4gUGFyc2VyLmlzRGVzdHJ1Y3R1cmluZ1RhcmdldFdpdGhEZWZhdWx0KGUsIGlzTGVhZk5vZGUpKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBsZXQgbGFzdCA9IG5vZGUuZWxlbWVudHNbbm9kZS5lbGVtZW50cy5sZW5ndGggLSAxXTtcbiAgICAgICAgcmV0dXJuIGxhc3QgPT0gbnVsbCB8fFxuICAgICAgICAgIGxhc3QudHlwZSA9PT0gXCJTcHJlYWRFbGVtZW50XCIgJiYgUGFyc2VyLmlzRGVzdHJ1Y3R1cmluZ1RhcmdldChsYXN0LmV4cHJlc3Npb24sIGlzTGVhZk5vZGUpIHx8XG4gICAgICAgICAgUGFyc2VyLmlzRGVzdHJ1Y3R1cmluZ1RhcmdldFdpdGhEZWZhdWx0KGxhc3QsIGlzTGVhZk5vZGUpO1xuICAgICAgY2FzZSBcIkFycmF5QmluZGluZ1wiOlxuICAgICAgY2FzZSBcIkJpbmRpbmdJZGVudGlmaWVyXCI6XG4gICAgICBjYXNlIFwiQmluZGluZ1Byb3BlcnR5SWRlbnRpZmllclwiOlxuICAgICAgY2FzZSBcIkJpbmRpbmdQcm9wZXJ0eVByb3BlcnR5XCI6XG4gICAgICBjYXNlIFwiQmluZGluZ1dpdGhEZWZhdWx0XCI6XG4gICAgICBjYXNlIFwiT2JqZWN0QmluZGluZ1wiOlxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGlzTGVhZk5vZGUobm9kZSk7XG4gIH1cblxuICBzdGF0aWMgaXNEZXN0cnVjdHVyaW5nVGFyZ2V0V2l0aERlZmF1bHQobm9kZSwgaXNMZWFmTm9kZSkge1xuICAgIHJldHVybiBub2RlLnR5cGUgPT09IFwiQXNzaWdubWVudEV4cHJlc3Npb25cIiAmJiBub2RlLm9wZXJhdG9yID09PSBcIj1cIiA/XG4gICAgICBQYXJzZXIuaXNEZXN0cnVjdHVyaW5nVGFyZ2V0KG5vZGUuYmluZGluZywgaXNMZWFmTm9kZSkgOlxuICAgICAgUGFyc2VyLmlzRGVzdHJ1Y3R1cmluZ1RhcmdldChub2RlLCBpc0xlYWZOb2RlKTtcbiAgfVxuXG4gIHN0YXRpYyBpc1ZhbGlkU2ltcGxlQmluZGluZ1RhcmdldChub2RlKSB7XG4gICAgcmV0dXJuIG5vZGUudHlwZSA9PT0gXCJJZGVudGlmaWVyRXhwcmVzc2lvblwiO1xuICB9XG5cbiAgc3RhdGljIGlzVmFsaWRTaW1wbGVBc3NpZ25tZW50VGFyZ2V0KG5vZGUpIHtcbiAgICBzd2l0Y2ggKG5vZGUudHlwZSkge1xuICAgICAgY2FzZSBcIklkZW50aWZpZXJFeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiQ29tcHV0ZWRNZW1iZXJFeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiU3RhdGljTWVtYmVyRXhwcmVzc2lvblwiOlxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgc3RhdGljIGJvdW5kTmFtZXMobm9kZSkge1xuICAgIHN3aXRjaCAobm9kZS50eXBlKSB7XG4gICAgICBjYXNlIFwiQmluZGluZ0lkZW50aWZpZXJcIjpcbiAgICAgICAgcmV0dXJuIFtub2RlLm5hbWVdO1xuICAgICAgY2FzZSBcIkJpbmRpbmdXaXRoRGVmYXVsdFwiOlxuICAgICAgICByZXR1cm4gUGFyc2VyLmJvdW5kTmFtZXMobm9kZS5iaW5kaW5nKTtcbiAgICAgIGNhc2UgXCJBcnJheUJpbmRpbmdcIjoge1xuICAgICAgICBsZXQgbmFtZXMgPSBbXTtcbiAgICAgICAgbm9kZS5lbGVtZW50cy5maWx0ZXIoZSA9PiBlICE9IG51bGwpLmZvckVhY2goZSA9PiBbXS5wdXNoLmFwcGx5KG5hbWVzLCBQYXJzZXIuYm91bmROYW1lcyhlKSkpO1xuICAgICAgICBpZiAobm9kZS5yZXN0RWxlbWVudCAhPSBudWxsKSB7XG4gICAgICAgICAgW10ucHVzaC5hcHBseShuYW1lcywgUGFyc2VyLmJvdW5kTmFtZXMobm9kZS5yZXN0RWxlbWVudCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuYW1lcztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJPYmplY3RCaW5kaW5nXCI6IHtcbiAgICAgICAgbGV0IG5hbWVzID0gW107XG4gICAgICAgIG5vZGUucHJvcGVydGllcy5mb3JFYWNoKHAgPT4ge1xuICAgICAgICAgIHN3aXRjaCAocC50eXBlKSB7XG4gICAgICAgICAgICBjYXNlIFwiQmluZGluZ1Byb3BlcnR5SWRlbnRpZmllclwiOlxuICAgICAgICAgICAgICBuYW1lcy5wdXNoKHAuYmluZGluZy5uYW1lKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiQmluZGluZ1Byb3BlcnR5UHJvcGVydHlcIjpcbiAgICAgICAgICAgICAgW10ucHVzaC5hcHBseShuYW1lcywgUGFyc2VyLmJvdW5kTmFtZXMocC5iaW5kaW5nKSk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgLy8gaXN0YW5idWwgaWdub3JlIG5leHRcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImJvdW5kTmFtZXMgY2FsbGVkIG9uIE9iamVjdEJpbmRpbmcgd2l0aCBpbnZhbGlkIHByb3BlcnR5OiBcIiArIHAudHlwZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG5hbWVzO1xuICAgICAgfVxuICAgICAgY2FzZSBcIkNvbXB1dGVkTWVtYmVyRXhwcmVzc2lvblwiOlxuICAgICAgY2FzZSBcIlN0YXRpY01lbWJlckV4cHJlc3Npb25cIjpcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICAvLyBpc3RhbmJ1bCBpZ25vcmUgbmV4dFxuICAgIHRocm93IG5ldyBFcnJvcihcImJvdW5kTmFtZXMgY2FsbGVkIG9uIGludmFsaWQgYXNzaWdubWVudCB0YXJnZXQ6IFwiICsgbm9kZS50eXBlKTtcbiAgfVxuXG4gIHBhcnNlRm9yU3RhdGVtZW50KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5GT1IpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MUEFSRU4pO1xuICAgIGxldCB0ZXN0ID0gbnVsbDtcbiAgICBsZXQgcmlnaHQgPSBudWxsO1xuICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuU0VNSUNPTE9OKSkge1xuICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5TRU1JQ09MT04pKSB7XG4gICAgICAgIHRlc3QgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgfVxuICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlNFTUlDT0xPTik7XG4gICAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJQQVJFTikpIHtcbiAgICAgICAgcmlnaHQgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBTaGlmdC5Gb3JTdGF0ZW1lbnQoXG4gICAgICAgICAgbnVsbCxcbiAgICAgICAgICB0ZXN0LFxuICAgICAgICAgIHJpZ2h0LFxuICAgICAgICAgIHRoaXMuZ2V0SXRlcmF0b3JTdGF0ZW1lbnRFcGlsb2d1ZSgpXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgc3RhcnRzV2l0aExldCA9IHRoaXMubWF0Y2goVG9rZW5UeXBlLkxFVCkgfHwgdGhpcy5tYXRjaChUb2tlblR5cGUuSURFTlRJRklFUikgJiYgdGhpcy5sb29rYWhlYWQudmFsdWUgPT09IFwibGV0XCI7XG4gICAgICBsZXQgaXNGb3JEZWNsID0gdGhpcy5sb29rYWhlYWRMZXhpY2FsRGVjbGFyYXRpb24oKTtcbiAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5WQVIpIHx8IGlzRm9yRGVjbCkge1xuICAgICAgICBsZXQgcHJldmlvdXNBbGxvd0luID0gdGhpcy5hbGxvd0luO1xuICAgICAgICB0aGlzLmFsbG93SW4gPSBmYWxzZTtcbiAgICAgICAgbGV0IGluaXREZWNsID0gdGhpcy5wYXJzZVZhcmlhYmxlRGVjbGFyYXRpb24oe2luRm9yOiB0cnVlfSk7XG4gICAgICAgIHRoaXMuYWxsb3dJbiA9IHByZXZpb3VzQWxsb3dJbjtcblxuICAgICAgICBpZiAoaW5pdERlY2wuZGVjbGFyYXRvcnMubGVuZ3RoID09PSAxICYmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5JTikgfHwgdGhpcy5tYXRjaChUb2tlblR5cGUuT0YpKSkge1xuICAgICAgICAgIGxldCBDdG9yO1xuXG4gICAgICAgICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLklOKSkge1xuICAgICAgICAgICAgaWYgKGluaXREZWNsLmRlY2xhcmF0b3JzWzBdLmluaXQgIT0gbnVsbCkge1xuICAgICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuSU5WQUxJRF9WQVJfSU5JVF9GT1JfSU4pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgQ3RvciA9IFNoaWZ0LkZvckluU3RhdGVtZW50O1xuICAgICAgICAgICAgdGhpcy5sZXgoKTtcbiAgICAgICAgICAgIHJpZ2h0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKGluaXREZWNsLmRlY2xhcmF0b3JzWzBdLmluaXQgIT0gbnVsbCkge1xuICAgICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuSU5WQUxJRF9WQVJfSU5JVF9GT1JfT0YpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgQ3RvciA9IFNoaWZ0LkZvck9mU3RhdGVtZW50O1xuICAgICAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMuVkROKSB7XG4gICAgICAgICAgICAgIHRoaXMuVkROW2tleV0gPSBGT1JfT0ZfVkFSO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmxleCgpO1xuICAgICAgICAgICAgcmlnaHQgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsZXQgZXBpbG9ndWUgPSB0aGlzLndyYXBWRE4odGhpcy5nZXRJdGVyYXRvclN0YXRlbWVudEVwaWxvZ3VlLCBpc0ZvckRlY2wgJiYgdGhpcy5jaGVja0Jsb2NrU2NvcGUpO1xuXG4gICAgICAgICAgcmV0dXJuIG5ldyBDdG9yKGluaXREZWNsLCByaWdodCwgZXBpbG9ndWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5TRU1JQ09MT04pO1xuICAgICAgICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuU0VNSUNPTE9OKSkge1xuICAgICAgICAgICAgdGVzdCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5TRU1JQ09MT04pO1xuICAgICAgICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuUlBBUkVOKSkge1xuICAgICAgICAgICAgcmlnaHQgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gbmV3IFNoaWZ0LkZvclN0YXRlbWVudChpbml0RGVjbCwgdGVzdCwgcmlnaHQsIHRoaXMud3JhcFZETih0aGlzLmdldEl0ZXJhdG9yU3RhdGVtZW50RXBpbG9ndWUsIGlzRm9yRGVjbCAmJiB0aGlzLmNoZWNrQmxvY2tTY29wZSkpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsZXQgcHJldmlvdXNBbGxvd0luID0gdGhpcy5hbGxvd0luO1xuICAgICAgICB0aGlzLmFsbG93SW4gPSBmYWxzZTtcbiAgICAgICAgbGV0IGluaXQgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgICB0aGlzLmFsbG93SW4gPSBwcmV2aW91c0FsbG93SW47XG5cbiAgICAgICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLklOKSB8fCAhc3RhcnRzV2l0aExldCAmJiB0aGlzLm1hdGNoKFRva2VuVHlwZS5PRikpIHtcbiAgICAgICAgICBpZiAoIVBhcnNlci5pc1ZhbGlkU2ltcGxlQXNzaWdubWVudFRhcmdldChpbml0KSkge1xuICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLklOVkFMSURfTEhTX0lOX0ZPUl9JTik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGV0IEN0b3IgPSB0aGlzLm1hdGNoKFRva2VuVHlwZS5JTikgPyBTaGlmdC5Gb3JJblN0YXRlbWVudCA6IFNoaWZ0LkZvck9mU3RhdGVtZW50O1xuXG4gICAgICAgICAgdGhpcy5sZXgoKTtcbiAgICAgICAgICByaWdodCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG5cbiAgICAgICAgICByZXR1cm4gbmV3IEN0b3IoaW5pdCwgcmlnaHQsIHRoaXMuZ2V0SXRlcmF0b3JTdGF0ZW1lbnRFcGlsb2d1ZSgpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuU0VNSUNPTE9OKTtcbiAgICAgICAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlNFTUlDT0xPTikpIHtcbiAgICAgICAgICAgIHRlc3QgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuU0VNSUNPTE9OKTtcbiAgICAgICAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJQQVJFTikpIHtcbiAgICAgICAgICAgIHJpZ2h0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIG5ldyBTaGlmdC5Gb3JTdGF0ZW1lbnQoaW5pdCwgdGVzdCwgcmlnaHQsIHRoaXMuZ2V0SXRlcmF0b3JTdGF0ZW1lbnRFcGlsb2d1ZSgpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGdldEl0ZXJhdG9yU3RhdGVtZW50RXBpbG9ndWUoKSB7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJQQVJFTik7XG4gICAgbGV0IG9sZEluSXRlcmF0aW9uID0gdGhpcy5pbkl0ZXJhdGlvbjtcbiAgICB0aGlzLmluSXRlcmF0aW9uID0gdHJ1ZTtcbiAgICBsZXQgYm9keSA9IHRoaXMucGFyc2VTdGF0ZW1lbnQoKTtcbiAgICB0aGlzLmluSXRlcmF0aW9uID0gb2xkSW5JdGVyYXRpb247XG4gICAgcmV0dXJuIGJvZHk7XG4gIH1cblxuICBwYXJzZUlmU3RhdGVtZW50KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5JRik7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgbGV0IHRlc3QgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJQQVJFTik7XG4gICAgbGV0IGNvbnNlcXVlbnQgPSB0aGlzLnBhcnNlU3RhdGVtZW50KCk7XG4gICAgbGV0IGFsdGVybmF0ZSA9IG51bGw7XG4gICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5FTFNFKSkge1xuICAgICAgYWx0ZXJuYXRlID0gdGhpcy5wYXJzZVN0YXRlbWVudCgpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IFNoaWZ0LklmU3RhdGVtZW50KHRlc3QsIGNvbnNlcXVlbnQsIGFsdGVybmF0ZSk7XG4gIH1cblxuICBwYXJzZVJldHVyblN0YXRlbWVudCgpIHtcbiAgICBsZXQgYXJndW1lbnQgPSBudWxsO1xuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJFVFVSTik7XG4gICAgaWYgKCF0aGlzLmluRnVuY3Rpb25Cb2R5KSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuSUxMRUdBTF9SRVRVUk4pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCkge1xuICAgICAgcmV0dXJuIG5ldyBTaGlmdC5SZXR1cm5TdGF0ZW1lbnQobnVsbCk7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5TRU1JQ09MT04pKSB7XG4gICAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJCUkFDRSkgJiYgIXRoaXMuZW9mKCkpIHtcbiAgICAgICAgYXJndW1lbnQgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuY29uc3VtZVNlbWljb2xvbigpO1xuICAgIHJldHVybiBuZXcgU2hpZnQuUmV0dXJuU3RhdGVtZW50KGFyZ3VtZW50KTtcbiAgfVxuXG4gIHBhcnNlV2l0aFN0YXRlbWVudCgpIHtcbiAgICBpZiAodGhpcy5zdHJpY3QpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5TVFJJQ1RfTU9ERV9XSVRIKTtcbiAgICB9XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuV0lUSCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgbGV0IG9iamVjdCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJQQVJFTik7XG4gICAgbGV0IGJvZHkgPSB0aGlzLnBhcnNlU3RhdGVtZW50KCk7XG5cbiAgICByZXR1cm4gbmV3IFNoaWZ0LldpdGhTdGF0ZW1lbnQob2JqZWN0LCBib2R5KTtcbiAgfVxuXG4gIHBhcnNlU3dpdGNoU3RhdGVtZW50KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5TV0lUQ0gpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MUEFSRU4pO1xuICAgIGxldCBkaXNjcmltaW5hbnQgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MQlJBQ0UpO1xuXG4gICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5SQlJBQ0UpKSB7XG4gICAgICByZXR1cm4gbmV3IFNoaWZ0LlN3aXRjaFN0YXRlbWVudChkaXNjcmltaW5hbnQsIFtdKTtcbiAgICB9XG4gICAgbGV0IG9sZEluU3dpdGNoID0gdGhpcy5pblN3aXRjaDtcbiAgICB0aGlzLmluU3dpdGNoID0gdHJ1ZTtcbiAgICByZXR1cm4gdGhpcy53cmFwVkROKCgpID0+IHtcbiAgICAgIGxldCBjYXNlcyA9IHRoaXMucGFyc2VTd2l0Y2hDYXNlcygpO1xuICAgICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkRFRkFVTFQpKSB7XG4gICAgICAgIGxldCBzd2l0Y2hEZWZhdWx0ID0gdGhpcy5wYXJzZVN3aXRjaERlZmF1bHQoKTtcbiAgICAgICAgbGV0IHBvc3REZWZhdWx0Q2FzZXMgPSB0aGlzLnBhcnNlU3dpdGNoQ2FzZXMoKTtcbiAgICAgICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkRFRkFVTFQpKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLk1VTFRJUExFX0RFRkFVTFRTX0lOX1NXSVRDSCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pblN3aXRjaCA9IG9sZEluU3dpdGNoO1xuICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUkJSQUNFKTtcbiAgICAgICAgcmV0dXJuIG5ldyBTaGlmdC5Td2l0Y2hTdGF0ZW1lbnRXaXRoRGVmYXVsdChkaXNjcmltaW5hbnQsIGNhc2VzLCBzd2l0Y2hEZWZhdWx0LCBwb3N0RGVmYXVsdENhc2VzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuaW5Td2l0Y2ggPSBvbGRJblN3aXRjaDtcbiAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJCUkFDRSk7XG4gICAgICAgIHJldHVybiBuZXcgU2hpZnQuU3dpdGNoU3RhdGVtZW50KGRpc2NyaW1pbmFudCwgY2FzZXMpO1xuICAgICAgfVxuICAgIH0sIHRoaXMuY2hlY2tCbG9ja1Njb3BlKTtcbiAgfVxuXG4gIHBhcnNlU3dpdGNoQ2FzZXMoKSB7XG4gICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgIHdoaWxlICghKHRoaXMuZW9mKCkgfHwgdGhpcy5tYXRjaChUb2tlblR5cGUuUkJSQUNFKSB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5ERUZBVUxUKSkpIHtcbiAgICAgIHJlc3VsdC5wdXNoKHRoaXMucGFyc2VTd2l0Y2hDYXNlKCkpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgcGFyc2VTd2l0Y2hDYXNlKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5DQVNFKTtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlN3aXRjaENhc2UodGhpcy5wYXJzZUV4cHJlc3Npb24oKSwgdGhpcy5wYXJzZVN3aXRjaENhc2VCb2R5KCkpLCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlU3dpdGNoRGVmYXVsdCgpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuREVGQVVMVCk7XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5Td2l0Y2hEZWZhdWx0KHRoaXMucGFyc2VTd2l0Y2hDYXNlQm9keSgpKSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZVN3aXRjaENhc2VCb2R5KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5DT0xPTik7XG4gICAgcmV0dXJuIHRoaXMucGFyc2VTdGF0ZW1lbnRMaXN0SW5Td2l0Y2hDYXNlQm9keSgpO1xuICB9XG5cbiAgcGFyc2VTdGF0ZW1lbnRMaXN0SW5Td2l0Y2hDYXNlQm9keSgpIHtcbiAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgd2hpbGUgKCEodGhpcy5lb2YoKSB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0UpIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLkRFRkFVTFQpIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLkNBU0UpKSkge1xuICAgICAgcmVzdWx0LnB1c2godGhpcy5wYXJzZVN0YXRlbWVudExpc3RJdGVtKCkpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgcGFyc2VUaHJvd1N0YXRlbWVudCgpIHtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmV4cGVjdChUb2tlblR5cGUuVEhST1cpO1xuXG4gICAgaWYgKHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0KSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLk5FV0xJTkVfQUZURVJfVEhST1cpO1xuICAgIH1cblxuICAgIGxldCBhcmd1bWVudCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG5cbiAgICB0aGlzLmNvbnN1bWVTZW1pY29sb24oKTtcblxuICAgIHJldHVybiBuZXcgU2hpZnQuVGhyb3dTdGF0ZW1lbnQoYXJndW1lbnQpO1xuICB9XG5cbiAgcGFyc2VUcnlTdGF0ZW1lbnQoKSB7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlRSWSk7XG4gICAgbGV0IGJsb2NrID0gdGhpcy53cmFwVkROKHRoaXMucGFyc2VCbG9jaywgdGhpcy5jaGVja0Jsb2NrU2NvcGUpO1xuXG4gICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkNBVENIKSkge1xuICAgICAgbGV0IGhhbmRsZXIgPSB0aGlzLnBhcnNlQ2F0Y2hDbGF1c2UoKTtcbiAgICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuRklOQUxMWSkpIHtcbiAgICAgICAgbGV0IGZpbmFsaXplciA9IHRoaXMud3JhcFZETih0aGlzLnBhcnNlQmxvY2ssIHRoaXMuY2hlY2tCbG9ja1Njb3BlKTtcbiAgICAgICAgcmV0dXJuIG5ldyBTaGlmdC5UcnlGaW5hbGx5U3RhdGVtZW50KGJsb2NrLCBoYW5kbGVyLCBmaW5hbGl6ZXIpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBTaGlmdC5UcnlDYXRjaFN0YXRlbWVudChibG9jaywgaGFuZGxlcik7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5GSU5BTExZKSkge1xuICAgICAgbGV0IGZpbmFsaXplciA9IHRoaXMud3JhcFZETih0aGlzLnBhcnNlQmxvY2ssIHRoaXMuY2hlY2tCbG9ja1Njb3BlKTtcbiAgICAgIHJldHVybiBuZXcgU2hpZnQuVHJ5RmluYWxseVN0YXRlbWVudChibG9jaywgbnVsbCwgZmluYWxpemVyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLk5PX0NBVENIX09SX0ZJTkFMTFkpO1xuICAgIH1cbiAgfVxuXG4gIHBhcnNlVmFyaWFibGVEZWNsYXJhdGlvblN0YXRlbWVudCgpIHtcbiAgICBsZXQgZGVjbGFyYXRpb24gPSB0aGlzLnBhcnNlVmFyaWFibGVEZWNsYXJhdGlvbigpO1xuICAgIHRoaXMuY29uc3VtZVNlbWljb2xvbigpO1xuICAgIHJldHVybiBuZXcgU2hpZnQuVmFyaWFibGVEZWNsYXJhdGlvblN0YXRlbWVudChkZWNsYXJhdGlvbik7XG4gIH1cblxuICBwYXJzZVdoaWxlU3RhdGVtZW50KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5XSElMRSk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgcmV0dXJuIG5ldyBTaGlmdC5XaGlsZVN0YXRlbWVudCh0aGlzLnBhcnNlRXhwcmVzc2lvbigpLCB0aGlzLmdldEl0ZXJhdG9yU3RhdGVtZW50RXBpbG9ndWUoKSk7XG4gIH1cblxuICBwYXJzZUNhdGNoQ2xhdXNlKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNBVENIKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTFBBUkVOKTtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuUlBBUkVOKSB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5MUEFSRU4pKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodG9rZW4pO1xuICAgIH1cblxuICAgIGxldCBwYXJhbSA9IHRoaXMucGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uKHthbGxvd0NhbGw6IGZhbHNlfSk7XG5cbiAgICBpZiAoIVBhcnNlci5pc0Rlc3RydWN0dXJpbmdUYXJnZXQocGFyYW0sIFBhcnNlci5pc1ZhbGlkU2ltcGxlQmluZGluZ1RhcmdldCkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0b2tlbik7XG4gICAgfVxuICAgIHBhcmFtID0gUGFyc2VyLnRyYW5zZm9ybURlc3RydWN0dXJpbmcocGFyYW0pO1xuXG4gICAgbGV0IGJvdW5kID0gUGFyc2VyLmJvdW5kTmFtZXMocGFyYW0pO1xuICAgIGlmIChmaXJzdER1cGxpY2F0ZShib3VuZCkgIT0gbnVsbCkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5EVVBMSUNBVEVfQklORElORywgZmlyc3REdXBsaWNhdGUoYm91bmQpKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5zdHJpY3QgJiYgYm91bmQuc29tZShpc1Jlc3RyaWN0ZWRXb3JkKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5TVFJJQ1RfQ0FUQ0hfVkFSSUFCTEUpO1xuICAgIH1cblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuXG4gICAgbGV0IGJvZHkgPSB0aGlzLndyYXBWRE4odGhpcy5wYXJzZUJsb2NrLCB0aGlzLmNoZWNrQmxvY2tTY29wZSk7XG5cbiAgICB0aGlzLkxETi5mb3JFYWNoKG5hbWUgPT4ge1xuICAgICAgaWYgKGJvdW5kLmluZGV4T2YobmFtZSkgPj0gMCkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLkRVUExJQ0FURV9CSU5ESU5HLCBuYW1lKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy5WRE4pIHtcbiAgICAgIGlmICh0aGlzLlZETltrZXldID09PSBGT1JfT0ZfVkFSICYmIGJvdW5kLmluZGV4T2Yoa2V5LnNsaWNlKDEpKSA+PSAwKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5EVVBMSUNBVEVfQ0FUQ0hfQklORElORywga2V5LnNsaWNlKDEpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5DYXRjaENsYXVzZShwYXJhbSwgYm9keSksIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VCbG9jaygpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTEJSQUNFKTtcblxuICAgIGxldCBib2R5ID0gW107XG4gICAgd2hpbGUgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0UpKSB7XG4gICAgICBib2R5LnB1c2godGhpcy5wYXJzZVN0YXRlbWVudExpc3RJdGVtKCkpO1xuICAgIH1cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUkJSQUNFKTtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkJsb2NrKGJvZHkpLCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlVmFyaWFibGVEZWNsYXJhdGlvbih7aW5Gb3IgPSBmYWxzZSwgYm91bmROYW1lcyA9IFtdfSA9IHt9KSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IHRva2VuID0gdGhpcy5sZXgoKTtcblxuICAgIC8vIFByZWNlZGVkIGJ5IHRoaXMubWF0Y2goVG9rZW5TdWJUeXBlLlZBUikgfHwgdGhpcy5tYXRjaChUb2tlblN1YlR5cGUuTEVUKTtcbiAgICBsZXQga2luZCA9IHRva2VuLnR5cGUgPT09IFRva2VuVHlwZS5WQVIgPyBcInZhclwiIDogdG9rZW4udHlwZSA9PT0gVG9rZW5UeXBlLkNPTlNUID8gXCJjb25zdFwiIDogXCJsZXRcIjtcbiAgICBsZXQgZGVjbGFyYXRvcnMgPSB0aGlzLnBhcnNlVmFyaWFibGVEZWNsYXJhdG9yTGlzdChraW5kLCB7aW5Gb3IsIGJvdW5kTmFtZXN9KTtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlZhcmlhYmxlRGVjbGFyYXRpb24oa2luZCwgZGVjbGFyYXRvcnMpLCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlVmFyaWFibGVEZWNsYXJhdG9yTGlzdChraW5kLCB7aW5Gb3IsIGJvdW5kTmFtZXN9KSB7XG4gICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgIGxldCBbdmFyRGVjbCwgYWxsQm91bmRdID0gdGhpcy5wYXJzZVZhcmlhYmxlRGVjbGFyYXRvcihraW5kLCB7YWxsb3dDb25zdFdpdGhvdXRCaW5kaW5nOiBpbkZvcn0pO1xuICAgIHJlc3VsdC5wdXNoKHZhckRlY2wpO1xuICAgIGlmIChpbkZvciAmJiBraW5kID09PSBcImNvbnN0XCIgJiYgdmFyRGVjbC5pbml0ID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHdoaWxlICh0aGlzLmVhdChUb2tlblR5cGUuQ09NTUEpKSB7XG4gICAgICBsZXQgW25leHRWYXJEZWNsLCBib3VuZF0gPSB0aGlzLnBhcnNlVmFyaWFibGVEZWNsYXJhdG9yKGtpbmQsIHthbGxvd0NvbnN0V2l0aG91dEJpbmRpbmc6IGZhbHNlfSk7XG4gICAgICByZXN1bHQucHVzaChuZXh0VmFyRGVjbCk7XG4gICAgICBpZiAoa2luZCAhPT0gXCJ2YXJcIikge1xuICAgICAgICBhbGxCb3VuZCA9IGFsbEJvdW5kLmNvbmNhdChib3VuZCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuc3RyaWN0ICYmIGFsbEJvdW5kLnNvbWUoaXNSZXN0cmljdGVkV29yZCkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odGhpcy5sb29rYWhlYWQsIEVycm9yTWVzc2FnZXMuU1RSSUNUX1ZBUl9OQU1FKTtcbiAgICB9XG5cbiAgICBpZiAoa2luZCAhPT0gXCJ2YXJcIikge1xuICAgICAgbGV0IGR1cGUgPSBmaXJzdER1cGxpY2F0ZShhbGxCb3VuZCk7XG4gICAgICBpZiAoZHVwZSAhPT0gbnVsbCkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuRFVQTElDQVRFX0JJTkRJTkcsIGR1cGUpO1xuICAgICAgfVxuICAgIH1cbiAgICBbXS5wdXNoLmFwcGx5KGJvdW5kTmFtZXMsIGFsbEJvdW5kKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgcGFyc2VWYXJpYWJsZURlY2xhcmF0b3Ioa2luZCwge2FsbG93Q29uc3RXaXRob3V0QmluZGluZ30pIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcblxuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5MUEFSRU4pKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuICAgIH1cblxuICAgIGxldCBwcmV2aW91c0FsbG93QmluZGluZ1BhdHRlcm4gPSB0aGlzLmFsbG93QmluZGluZ1BhdHRlcm47XG4gICAgdGhpcy5hbGxvd0JpbmRpbmdQYXR0ZXJuID0gdHJ1ZTtcblxuICAgIGxldCBpZCA9IHRoaXMucGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uKHthbGxvd0NhbGw6IGZhbHNlfSk7XG5cbiAgICB0aGlzLmFsbG93QmluZGluZ1BhdHRlcm4gPSBwcmV2aW91c0FsbG93QmluZGluZ1BhdHRlcm47XG5cbiAgICBpZiAoIVBhcnNlci5pc0Rlc3RydWN0dXJpbmdUYXJnZXQoaWQsIFBhcnNlci5pc1ZhbGlkU2ltcGxlQmluZGluZ1RhcmdldCkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0b2tlbik7XG4gICAgfVxuICAgIGlkID0gUGFyc2VyLnRyYW5zZm9ybURlc3RydWN0dXJpbmcoaWQpO1xuXG4gICAgbGV0IGJvdW5kID0gUGFyc2VyLmJvdW5kTmFtZXMoaWQpO1xuXG4gICAgbGV0IGluaXQgPSBudWxsO1xuICAgIGlmIChraW5kID09PSBcImNvbnN0XCIpIHtcbiAgICAgIGlmICghYWxsb3dDb25zdFdpdGhvdXRCaW5kaW5nIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLkFTU0lHTikpIHtcbiAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkFTU0lHTik7XG4gICAgICAgIGluaXQgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5BU1NJR04pKSB7XG4gICAgICBpbml0ID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgfVxuXG4gICAgaWYgKGtpbmQgPT09IFwidmFyXCIpIHtcbiAgICAgIGJvdW5kLmZvckVhY2gobmFtZSA9PiB0aGlzLlZETltcIiRcIiArIG5hbWVdID0gdHJ1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChib3VuZC5pbmRleE9mKFwibGV0XCIpID49IDApIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5MRVhJQ0FMTFlfQk9VTkRfTEVUKTtcbiAgICAgIH1cbiAgICAgIFtdLnB1c2guYXBwbHkodGhpcy5MRE4sIGJvdW5kKTtcbiAgICB9XG4gICAgcmV0dXJuIFt0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuVmFyaWFibGVEZWNsYXJhdG9yKGlkLCBpbml0KSwgc3RhcnRMb2NhdGlvbiksIGJvdW5kXTtcbiAgfVxuXG4gIHBhcnNlRXhwcmVzc2lvbigpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcblxuICAgIGxldCBleHByID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG5cbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuQ09NTUEpKSB7XG4gICAgICB3aGlsZSAoIXRoaXMuZW9mKCkpIHtcbiAgICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5DT01NQSkpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxleCgpO1xuICAgICAgICBleHByID0gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkJpbmFyeUV4cHJlc3Npb24oXCIsXCIsIGV4cHIsIHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpKSxcbiAgICAgICAgICAgIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZXhwcjtcbiAgfVxuXG4gIHBhcnNlQXJyb3dFeHByZXNzaW9uVGFpbChoZWFkLCBzdGFydExvY2F0aW9uKSB7XG4gICAgbGV0IGFycm93ID0gdGhpcy5leHBlY3QoVG9rZW5UeXBlLkFSUk9XKTtcblxuICAgIC8vIENvbnZlcnQgcGFyYW0gbGlzdC5cbiAgICBsZXQge3BhcmFtcyA9IG51bGwsIHJlc3QgPSBudWxsfSA9IGhlYWQ7XG4gICAgaWYgKGhlYWQudHlwZSAhPT0gQVJST1dfRVhQUkVTU0lPTl9QQVJBTVMpIHtcbiAgICAgIGlmIChoZWFkLnR5cGUgPT09IFwiSWRlbnRpZmllckV4cHJlc3Npb25cIikge1xuICAgICAgICBsZXQgbmFtZSA9IGhlYWQubmFtZTtcbiAgICAgICAgaWYgKFNUUklDVF9NT0RFX1JFU0VSVkVEX1dPUkQuaGFzT3duUHJvcGVydHkobmFtZSkpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX1JFU0VSVkVEX1dPUkQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpc1Jlc3RyaWN0ZWRXb3JkKG5hbWUpKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlNUUklDVF9QQVJBTV9OQU1FKTtcbiAgICAgICAgfVxuICAgICAgICBoZWFkID0gUGFyc2VyLnRyYW5zZm9ybURlc3RydWN0dXJpbmcoaGVhZCk7XG4gICAgICAgIHBhcmFtcyA9IFtoZWFkXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZChhcnJvdyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkxCUkFDRSkpIHtcbiAgICAgIGxldCBwcmV2aW91c1lpZWxkID0gdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbjtcbiAgICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBmYWxzZTtcbiAgICAgIGxldCBib3VuZFBhcmFtcyA9IFtdLmNvbmNhdC5hcHBseShbXSwgcGFyYW1zLm1hcChQYXJzZXIuYm91bmROYW1lcykpO1xuICAgICAgbGV0IFtib2R5XSA9IHRoaXMucGFyc2VGdW5jdGlvbkJvZHkoYm91bmRQYXJhbXMpO1xuICAgICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IHByZXZpb3VzWWllbGQ7XG4gICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkFycm93RXhwcmVzc2lvbihwYXJhbXMsIHJlc3QsIGJvZHkpLCBzdGFydExvY2F0aW9uKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IGJvZHkgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQXJyb3dFeHByZXNzaW9uKHBhcmFtcywgcmVzdCwgYm9keSksIHN0YXJ0TG9jYXRpb24pO1xuICAgIH1cbiAgfVxuXG4gIC8vIFRPRE86IHRoaXMgaXMgZ3Jvc3MgYW5kIHdlIHNob3VsZG4ndCBhY3R1YWxseSBkbyB0aGlzXG4gIHN0YXRpYyBjb250YWluc0JpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXIobm9kZSkge1xuICAgIHN3aXRjaChub2RlLnR5cGUpIHtcbiAgICAgIGNhc2UgXCJCaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyXCI6XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgY2FzZSBcIk9iamVjdEV4cHJlc3Npb25cIjpcbiAgICAgIGNhc2UgXCJPYmplY3RCaW5kaW5nXCI6XG4gICAgICAgIHJldHVybiBub2RlLnByb3BlcnRpZXMuc29tZShQYXJzZXIuY29udGFpbnNCaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyKTtcbiAgICAgIGNhc2UgXCJBcnJheUV4cHJlc3Npb25cIjpcbiAgICAgIGNhc2UgXCJBcnJheUJpbmRpbmdcIjpcbiAgICAgICAgcmV0dXJuIG5vZGUuZWxlbWVudHMuc29tZShlID0+IGUgIT0gbnVsbCAmJiBQYXJzZXIuY29udGFpbnNCaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyKGUpKTtcbiAgICAgIGNhc2UgXCJCaW5kaW5nUHJvcGVydHlQcm9wZXJ0eVwiOlxuICAgICAgY2FzZSBcIkJpbmRpbmdXaXRoRGVmYXVsdFwiOlxuICAgICAgICByZXR1cm4gUGFyc2VyLmNvbnRhaW5zQmluZGluZ1Byb3BlcnR5SWRlbnRpZmllcihub2RlLmJpbmRpbmcpO1xuICAgICAgY2FzZSBcIkJpbmRpbmdJZGVudGlmaWVyXCI6XG4gICAgICBjYXNlIFwiU2hvcnRoYW5kUHJvcGVydHlcIjpcbiAgICAgIGNhc2UgXCJNZXRob2RcIjpcbiAgICAgIGNhc2UgXCJHZXR0ZXJcIjpcbiAgICAgIGNhc2UgXCJTZXR0ZXJcIjpcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgY2FzZSBcIlNwcmVhZEVsZW1lbnRcIjpcbiAgICAgICAgcmV0dXJuIFBhcnNlci5jb250YWluc0JpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXIobm9kZS5leHByZXNzaW9uKTtcblxuICAgICAgY2FzZSBcIkFycm93RXhwcmVzc2lvblwiOlxuICAgICAgY2FzZSBcIkZ1bmN0aW9uRXhwcmVzc2lvblwiOlxuICAgICAgY2FzZSBcIklkZW50aWZpZXJFeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiTGl0ZXJhbEJvb2xlYW5FeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiTGl0ZXJhbEluZmluaXR5RXhwcmVzc2lvblwiOlxuICAgICAgY2FzZSBcIkxpdGVyYWxOdWxsRXhwcmVzc2lvblwiOlxuICAgICAgY2FzZSBcIkxpdGVyYWxOdW1lcmljRXhwcmVzc2lvblwiOlxuICAgICAgY2FzZSBcIkxpdGVyYWxSZWdFeHBFeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiTGl0ZXJhbFN0cmluZ0V4cHJlc3Npb25cIjpcbiAgICAgIGNhc2UgXCJOZXdUYXJnZXRFeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiU3VwZXJcIjpcbiAgICAgIGNhc2UgXCJUaGlzRXhwcmVzc2lvblwiOlxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICBjYXNlIFwiQXNzaWdubWVudEV4cHJlc3Npb25cIjpcbiAgICAgICAgcmV0dXJuIFBhcnNlci5jb250YWluc0JpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXIobm9kZS5leHByZXNzaW9uKTtcbiAgICAgIGNhc2UgXCJCaW5hcnlFeHByZXNzaW9uXCI6XG4gICAgICAgIHJldHVybiBQYXJzZXIuY29udGFpbnNCaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyKG5vZGUubGVmdClcbiAgICAgICAgICB8fCBQYXJzZXIuY29udGFpbnNCaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyKG5vZGUucmlnaHQpO1xuICAgICAgY2FzZSBcIkNhbGxFeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiTmV3RXhwcmVzc2lvblwiOlxuICAgICAgICByZXR1cm4gUGFyc2VyLmNvbnRhaW5zQmluZGluZ1Byb3BlcnR5SWRlbnRpZmllcihub2RlLmNhbGxlZSlcbiAgICAgICAgICB8fCBub2RlLmFyZ3VtZW50cy5zb21lKFBhcnNlci5jb250YWluc0JpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXIpO1xuICAgICAgY2FzZSBcIkNsYXNzRXhwcmVzc2lvblwiOlxuICAgICAgICByZXR1cm4gbm9kZS5zdXBlciAhPSBudWxsICYmIFBhcnNlci5jb250YWluc0JpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXIobm9kZS5zdXBlcik7XG4gICAgICBjYXNlIFwiQ29tcHV0ZWRNZW1iZXJFeHByZXNzaW9uXCI6XG4gICAgICAgIHJldHVybiBQYXJzZXIuY29udGFpbnNCaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyKG5vZGUub2JqZWN0KVxuICAgICAgICAgIHx8IFBhcnNlci5jb250YWluc0JpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXIobm9kZS5leHByZXNzaW9uKTtcbiAgICAgIGNhc2UgXCJDb25kaXRpb25hbEV4cHJlc3Npb25cIjpcbiAgICAgICAgcmV0dXJuIFBhcnNlci5jb250YWluc0JpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXIobm9kZS50ZXN0KVxuICAgICAgICAgIHx8IFBhcnNlci5jb250YWluc0JpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXIobm9kZS5jb25zZXF1ZW50KVxuICAgICAgICAgIHx8IFBhcnNlci5jb250YWluc0JpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXIobm9kZS5hbHRlcm5hdGUpO1xuICAgICAgY2FzZSBcIlByZWZpeEV4cHJlc3Npb25cIjpcbiAgICAgIGNhc2UgXCJQb3N0Zml4RXhwcmVzc2lvblwiOlxuICAgICAgICByZXR1cm4gUGFyc2VyLmNvbnRhaW5zQmluZGluZ1Byb3BlcnR5SWRlbnRpZmllcihub2RlLm9wZXJhbmQpO1xuICAgICAgY2FzZSBcIlN0YXRpY01lbWJlckV4cHJlc3Npb25cIjpcbiAgICAgICAgcmV0dXJuIFBhcnNlci5jb250YWluc0JpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXIobm9kZS5vYmplY3QpO1xuICAgICAgY2FzZSBcIlRlbXBsYXRlRXhwcmVzc2lvblwiOlxuICAgICAgICByZXR1cm4gbm9kZS5lbGVtZW50cy5zb21lKGUgPT4gZS50eXBlICE9PSBcIlRlbXBsYXRlRWxlbWVudFwiICYmIFBhcnNlci5jb250YWluc0JpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXIoZSkpO1xuICAgICAgY2FzZSBcIllpZWxkRXhwcmVzc2lvblwiOlxuICAgICAgICByZXR1cm4gbm9kZS5leHByZXNzaW9uICE9IG51bGwgJiYgUGFyc2VyLmNvbnRhaW5zQmluZGluZ1Byb3BlcnR5SWRlbnRpZmllcihub2RlLmV4cHJlc3Npb24pO1xuICAgICAgY2FzZSBcIllpZWxkR2VuZXJhdG9yRXhwcmVzc2lvblwiOlxuICAgICAgY2FzZSBcIkRhdGFQcm9wZXJ0eVwiOlxuICAgICAgICByZXR1cm4gUGFyc2VyLmNvbnRhaW5zQmluZGluZ1Byb3BlcnR5SWRlbnRpZmllcihub2RlLmV4cHJlc3Npb24pO1xuICAgIH1cbiAgfVxuXG4gIHBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKSB7XG4gICAgbGV0IHRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICBpZiAodGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiAmJiAhdGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlciAmJiB0aGlzLmxvb2thaGVhZC52YWx1ZSA9PT0gXCJ5aWVsZFwiKSB7XG4gICAgICByZXR1cm4gdGhpcy5wYXJzZVlpZWxkRXhwcmVzc2lvbigpO1xuICAgIH1cblxuICAgIGxldCBwcmV2aW91c0FsbG93QmluZGluZ1BhdHRlcm4gPSB0aGlzLmFsbG93QmluZGluZ1BhdHRlcm47XG4gICAgdGhpcy5hbGxvd0JpbmRpbmdQYXR0ZXJuID0gdHJ1ZTtcblxuICAgIGxldCBub2RlID0gdGhpcy5wYXJzZUNvbmRpdGlvbmFsRXhwcmVzc2lvbigpO1xuXG4gICAgdGhpcy5hbGxvd0JpbmRpbmdQYXR0ZXJuID0gcHJldmlvdXNBbGxvd0JpbmRpbmdQYXR0ZXJuO1xuXG4gICAgaWYgKCF0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCAmJiB0aGlzLm1hdGNoKFRva2VuVHlwZS5BUlJPVykpIHtcbiAgICAgIHJldHVybiB0aGlzLnBhcnNlQXJyb3dFeHByZXNzaW9uVGFpbChub2RlLCBzdGFydExvY2F0aW9uKTtcbiAgICB9XG5cbiAgICBsZXQgaXNBc3NpZ25tZW50T3BlcmF0b3IgPSBmYWxzZTtcbiAgICBsZXQgb3BlcmF0b3IgPSB0aGlzLmxvb2thaGVhZDtcbiAgICBzd2l0Y2ggKG9wZXJhdG9yLnR5cGUpIHtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9CSVRfT1I6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fQklUX1hPUjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9CSVRfQU5EOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX1NITDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9TSFI6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fU0hSX1VOU0lHTkVEOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX0FERDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9TVUI6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fTVVMOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX0RJVjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9NT0Q6XG4gICAgICAgIGlzQXNzaWdubWVudE9wZXJhdG9yID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGlmIChpc0Fzc2lnbm1lbnRPcGVyYXRvcikge1xuICAgICAgaWYgKCFQYXJzZXIuaXNWYWxpZFNpbXBsZUFzc2lnbm1lbnRUYXJnZXQobm9kZSkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLklOVkFMSURfTEhTX0lOX0FTU0lHTk1FTlQpO1xuICAgICAgfVxuICAgICAgaWYgKG5vZGUudHlwZSA9PT0gXCJJZGVudGlmaWVyRXhwcmVzc2lvblwiKSB7XG4gICAgICAgIGlmICh0aGlzLnN0cmljdCAmJiBpc1Jlc3RyaWN0ZWRXb3JkKG5vZGUubmFtZSkpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLlNUUklDVF9MSFNfQVNTSUdOTUVOVCk7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZSA9IFBhcnNlci50cmFuc2Zvcm1EZXN0cnVjdHVyaW5nKG5vZGUpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAob3BlcmF0b3IudHlwZSA9PT0gVG9rZW5UeXBlLkFTU0lHTikge1xuICAgICAgaWYgKCFQYXJzZXIuaXNEZXN0cnVjdHVyaW5nVGFyZ2V0KG5vZGUsIFBhcnNlci5pc1ZhbGlkU2ltcGxlQXNzaWdubWVudFRhcmdldCkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLklOVkFMSURfTEhTX0lOX0FTU0lHTk1FTlQpO1xuICAgICAgfVxuICAgICAgbm9kZSA9IFBhcnNlci50cmFuc2Zvcm1EZXN0cnVjdHVyaW5nKG5vZGUpO1xuXG4gICAgICBsZXQgYm91bmQgPSBQYXJzZXIuYm91bmROYW1lcyhub2RlKTtcbiAgICAgIGlmICh0aGlzLnN0cmljdCAmJiBib3VuZC5zb21lKGlzUmVzdHJpY3RlZFdvcmQpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuU1RSSUNUX0xIU19BU1NJR05NRU5UKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKCF0aGlzLmFsbG93QmluZGluZ1BhdHRlcm4gJiYgUGFyc2VyLmNvbnRhaW5zQmluZGluZ1Byb3BlcnR5SWRlbnRpZmllcihub2RlKSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQob3BlcmF0b3IpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfVxuXG4gICAgdGhpcy5sZXgoKTtcbiAgICBsZXQgcHJldmlvdXNJbkdlbmVyYXRvclBhcmFtZXRlciA9IHRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXI7XG4gICAgdGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlciA9IGZhbHNlO1xuICAgIGxldCByaWdodCA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgIHRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXIgPSBwcmV2aW91c0luR2VuZXJhdG9yUGFyYW1ldGVyO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQXNzaWdubWVudEV4cHJlc3Npb24ob3BlcmF0b3IudHlwZS5uYW1lLCBub2RlLCByaWdodCksIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgbG9va2FoZWFkQXNzaWdubWVudEV4cHJlc3Npb24oKSB7XG4gICAgc3dpdGNoICh0aGlzLmxvb2thaGVhZC50eXBlKSB7XG4gICAgICBjYXNlIFRva2VuVHlwZS5BREQ6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fRElWOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQ0xBU1M6XG4gICAgICBjYXNlIFRva2VuVHlwZS5ERUM6XG4gICAgICBjYXNlIFRva2VuVHlwZS5ESVY6XG4gICAgICBjYXNlIFRva2VuVHlwZS5GQUxTRTpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkZVTkNUSU9OOlxuICAgICAgY2FzZSBUb2tlblR5cGUuSURFTlRJRklFUjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkxCUkFDRTpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkxCUkFDSzpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkxQQVJFTjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk5FVzpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk5PVDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk5VTEw6XG4gICAgICBjYXNlIFRva2VuVHlwZS5OVU1CRVI6XG4gICAgICBjYXNlIFRva2VuVHlwZS5TVFJJTkc6XG4gICAgICBjYXNlIFRva2VuVHlwZS5TVUI6XG4gICAgICBjYXNlIFRva2VuVHlwZS5USElTOlxuICAgICAgY2FzZSBUb2tlblR5cGUuVFJVRTpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLllJRUxEOlxuICAgICAgY2FzZSBUb2tlblR5cGUuVEVNUExBVEU6XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwYXJzZVlpZWxkRXhwcmVzc2lvbigpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcblxuICAgIHRoaXMubGV4KCk7XG4gICAgaWYgKHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0KSB7XG4gICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LllpZWxkRXhwcmVzc2lvbihudWxsKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgfVxuICAgIGxldCBpc0dlbmVyYXRvciA9ICEhdGhpcy5lYXQoVG9rZW5UeXBlLk1VTCk7XG4gICAgbGV0IHByZXZpb3VzWWllbGQgPSB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uO1xuICAgIGxldCBleHByID0gbnVsbDtcbiAgICBpZiAoaXNHZW5lcmF0b3IgfHwgdGhpcy5sb29rYWhlYWRBc3NpZ25tZW50RXhwcmVzc2lvbigpKSB7XG4gICAgICBleHByID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgfVxuICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBwcmV2aW91c1lpZWxkO1xuICAgIGxldCBDdG9yID0gaXNHZW5lcmF0b3IgPyBTaGlmdC5ZaWVsZEdlbmVyYXRvckV4cHJlc3Npb24gOiBTaGlmdC5ZaWVsZEV4cHJlc3Npb247XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBDdG9yKGV4cHIpLCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlQ29uZGl0aW9uYWxFeHByZXNzaW9uKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCBleHByID0gdGhpcy5wYXJzZUJpbmFyeUV4cHJlc3Npb24oKTtcbiAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLkNPTkRJVElPTkFMKSkge1xuICAgICAgbGV0IHByZXZpb3VzQWxsb3dJbiA9IHRoaXMuYWxsb3dJbjtcbiAgICAgIHRoaXMuYWxsb3dJbiA9IHRydWU7XG4gICAgICBsZXQgY29uc2VxdWVudCA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgdGhpcy5hbGxvd0luID0gcHJldmlvdXNBbGxvd0luO1xuICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNPTE9OKTtcbiAgICAgIGxldCBhbHRlcm5hdGUgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQ29uZGl0aW9uYWxFeHByZXNzaW9uKGV4cHIsIGNvbnNlcXVlbnQsIGFsdGVybmF0ZSksIHN0YXJ0TG9jYXRpb24pO1xuICAgIH1cblxuICAgIHJldHVybiBleHByO1xuICB9XG5cbiAgaXNCaW5hcnlPcGVyYXRvcih0eXBlKSB7XG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICBjYXNlIFRva2VuVHlwZS5PUjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFORDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkJJVF9PUjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkJJVF9YT1I6XG4gICAgICBjYXNlIFRva2VuVHlwZS5CSVRfQU5EOlxuICAgICAgY2FzZSBUb2tlblR5cGUuRVE6XG4gICAgICBjYXNlIFRva2VuVHlwZS5ORTpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkVRX1NUUklDVDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk5FX1NUUklDVDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkxUOlxuICAgICAgY2FzZSBUb2tlblR5cGUuR1Q6XG4gICAgICBjYXNlIFRva2VuVHlwZS5MVEU6XG4gICAgICBjYXNlIFRva2VuVHlwZS5HVEU6XG4gICAgICBjYXNlIFRva2VuVHlwZS5JTlNUQU5DRU9GOlxuICAgICAgY2FzZSBUb2tlblR5cGUuU0hMOlxuICAgICAgY2FzZSBUb2tlblR5cGUuU0hSOlxuICAgICAgY2FzZSBUb2tlblR5cGUuU0hSX1VOU0lHTkVEOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQUREOlxuICAgICAgY2FzZSBUb2tlblR5cGUuU1VCOlxuICAgICAgY2FzZSBUb2tlblR5cGUuTVVMOlxuICAgICAgY2FzZSBUb2tlblR5cGUuRElWOlxuICAgICAgY2FzZSBUb2tlblR5cGUuTU9EOlxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLklOOlxuICAgICAgICByZXR1cm4gdGhpcy5hbGxvd0luO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHBhcnNlQmluYXJ5RXhwcmVzc2lvbigpIHtcbiAgICBsZXQgbG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IGxlZnQgPSB0aGlzLnBhcnNlVW5hcnlFeHByZXNzaW9uKCk7XG4gICAgbGV0IG9wZXJhdG9yID0gdGhpcy5sb29rYWhlYWQudHlwZTtcblxuICAgIGxldCBpc0JpbmFyeU9wZXJhdG9yID0gdGhpcy5pc0JpbmFyeU9wZXJhdG9yKG9wZXJhdG9yKTtcbiAgICBpZiAoIWlzQmluYXJ5T3BlcmF0b3IpIHtcbiAgICAgIHJldHVybiBsZWZ0O1xuICAgIH1cblxuICAgIHRoaXMubGV4KCk7XG4gICAgbGV0IHN0YWNrID0gW107XG4gICAgc3RhY2sucHVzaCh7bG9jYXRpb24sIGxlZnQsIG9wZXJhdG9yLCBwcmVjZWRlbmNlOiBCaW5hcnlQcmVjZWRlbmNlW29wZXJhdG9yLm5hbWVdfSk7XG4gICAgbG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IHJpZ2h0ID0gdGhpcy5wYXJzZVVuYXJ5RXhwcmVzc2lvbigpO1xuXG4gICAgb3BlcmF0b3IgPSB0aGlzLmxvb2thaGVhZC50eXBlO1xuICAgIGlzQmluYXJ5T3BlcmF0b3IgPSB0aGlzLmlzQmluYXJ5T3BlcmF0b3IodGhpcy5sb29rYWhlYWQudHlwZSk7XG4gICAgd2hpbGUgKGlzQmluYXJ5T3BlcmF0b3IpIHtcbiAgICAgIGxldCBwcmVjZWRlbmNlID0gQmluYXJ5UHJlY2VkZW5jZVtvcGVyYXRvci5uYW1lXTtcbiAgICAgIC8vIFJlZHVjZTogbWFrZSBhIGJpbmFyeSBleHByZXNzaW9uIGZyb20gdGhlIHRocmVlIHRvcG1vc3QgZW50cmllcy5cbiAgICAgIHdoaWxlIChzdGFjay5sZW5ndGggJiYgcHJlY2VkZW5jZSA8PSBzdGFja1tzdGFjay5sZW5ndGggLSAxXS5wcmVjZWRlbmNlKSB7XG4gICAgICAgIGxldCBzdGFja0l0ZW0gPSBzdGFja1tzdGFjay5sZW5ndGggLSAxXTtcbiAgICAgICAgbGV0IHN0YWNrT3BlcmF0b3IgPSBzdGFja0l0ZW0ub3BlcmF0b3I7XG4gICAgICAgIGxlZnQgPSBzdGFja0l0ZW0ubGVmdDtcbiAgICAgICAgc3RhY2sucG9wKCk7XG4gICAgICAgIGxvY2F0aW9uID0gc3RhY2tJdGVtLmxvY2F0aW9uO1xuICAgICAgICByaWdodCA9IHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5CaW5hcnlFeHByZXNzaW9uKHN0YWNrT3BlcmF0b3IubmFtZSwgbGVmdCwgcmlnaHQpLCBsb2NhdGlvbik7XG4gICAgICB9XG5cbiAgICAgIC8vIFNoaWZ0LlxuICAgICAgdGhpcy5sZXgoKTtcbiAgICAgIHN0YWNrLnB1c2goe2xvY2F0aW9uLCBsZWZ0OiByaWdodCwgb3BlcmF0b3IsIHByZWNlZGVuY2V9KTtcbiAgICAgIGxvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgICAgcmlnaHQgPSB0aGlzLnBhcnNlVW5hcnlFeHByZXNzaW9uKCk7XG5cbiAgICAgIG9wZXJhdG9yID0gdGhpcy5sb29rYWhlYWQudHlwZTtcbiAgICAgIGlzQmluYXJ5T3BlcmF0b3IgPSB0aGlzLmlzQmluYXJ5T3BlcmF0b3Iob3BlcmF0b3IpO1xuICAgIH1cblxuICAgIC8vIEZpbmFsIHJlZHVjZSB0byBjbGVhbi11cCB0aGUgc3RhY2suXG4gICAgcmV0dXJuIHN0YWNrLnJlZHVjZVJpZ2h0KChleHByLCBzdGFja0l0ZW0pID0+XG4gICAgICB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQmluYXJ5RXhwcmVzc2lvbihzdGFja0l0ZW0ub3BlcmF0b3IubmFtZSwgc3RhY2tJdGVtLmxlZnQsIGV4cHIpLCBzdGFja0l0ZW0ubG9jYXRpb24pLFxuICAgICAgcmlnaHQpO1xuICB9XG5cbiAgc3RhdGljIGlzUHJlZml4T3BlcmF0b3IodHlwZSkge1xuICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgY2FzZSBUb2tlblR5cGUuSU5DOlxuICAgICAgY2FzZSBUb2tlblR5cGUuREVDOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQUREOlxuICAgICAgY2FzZSBUb2tlblR5cGUuU1VCOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQklUX05PVDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk5PVDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkRFTEVURTpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlZPSUQ6XG4gICAgICBjYXNlIFRva2VuVHlwZS5UWVBFT0Y6XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwYXJzZVVuYXJ5RXhwcmVzc2lvbigpIHtcbiAgICBpZiAodGhpcy5sb29rYWhlYWQudHlwZS5rbGFzcyAhPT0gVG9rZW5DbGFzcy5QdW5jdHVhdG9yICYmIHRoaXMubG9va2FoZWFkLnR5cGUua2xhc3MgIT09IFRva2VuQ2xhc3MuS2V5d29yZCkge1xuICAgICAgcmV0dXJuIHRoaXMucGFyc2VQb3N0Zml4RXhwcmVzc2lvbigpO1xuICAgIH1cbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgb3BlcmF0b3IgPSB0aGlzLmxvb2thaGVhZDtcbiAgICBpZiAoIVBhcnNlci5pc1ByZWZpeE9wZXJhdG9yKG9wZXJhdG9yLnR5cGUpKSB7XG4gICAgICByZXR1cm4gdGhpcy5wYXJzZVBvc3RmaXhFeHByZXNzaW9uKCk7XG4gICAgfVxuICAgIHRoaXMubGV4KCk7XG4gICAgbGV0IGV4cHIgPSB0aGlzLnBhcnNlVW5hcnlFeHByZXNzaW9uKCk7XG4gICAgc3dpdGNoIChvcGVyYXRvci50eXBlKSB7XG4gICAgICBjYXNlIFRva2VuVHlwZS5JTkM6XG4gICAgICBjYXNlIFRva2VuVHlwZS5ERUM6XG4gICAgICAgIC8vIDExLjQuNCwgMTEuNC41O1xuICAgICAgICBpZiAoZXhwci50eXBlID09PSBcIklkZW50aWZpZXJFeHByZXNzaW9uXCIpIHtcbiAgICAgICAgICBpZiAodGhpcy5zdHJpY3QgJiYgaXNSZXN0cmljdGVkV29yZChleHByLm5hbWUpKSB7XG4gICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX0xIU19QUkVGSVgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghUGFyc2VyLmlzVmFsaWRTaW1wbGVBc3NpZ25tZW50VGFyZ2V0KGV4cHIpKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLklOVkFMSURfTEhTX0lOX0FTU0lHTk1FTlQpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBUb2tlblR5cGUuREVMRVRFOlxuICAgICAgICBpZiAoZXhwci50eXBlID09PSBcIklkZW50aWZpZXJFeHByZXNzaW9uXCIgJiYgdGhpcy5zdHJpY3QpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX0RFTEVURSk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlByZWZpeEV4cHJlc3Npb24ob3BlcmF0b3IudmFsdWUsIGV4cHIpLCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlUG9zdGZpeEV4cHJlc3Npb24oKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICBsZXQgZXhwciA9IHRoaXMucGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uKHthbGxvd0NhbGw6IHRydWV9KTtcblxuICAgIGlmICh0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCkge1xuICAgICAgcmV0dXJuIGV4cHI7XG4gICAgfVxuXG4gICAgbGV0IG9wZXJhdG9yID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgaWYgKG9wZXJhdG9yLnR5cGUgIT09IFRva2VuVHlwZS5JTkMgJiYgb3BlcmF0b3IudHlwZSAhPT0gVG9rZW5UeXBlLkRFQykge1xuICAgICAgcmV0dXJuIGV4cHI7XG4gICAgfVxuICAgIHRoaXMubGV4KCk7XG4gICAgLy8gMTEuMy4xLCAxMS4zLjI7XG4gICAgaWYgKGV4cHIudHlwZSA9PT0gXCJJZGVudGlmaWVyRXhwcmVzc2lvblwiKSB7XG4gICAgICBpZiAodGhpcy5zdHJpY3QgJiYgaXNSZXN0cmljdGVkV29yZChleHByLm5hbWUpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5TVFJJQ1RfTEhTX1BPU1RGSVgpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIVBhcnNlci5pc1ZhbGlkU2ltcGxlQXNzaWdubWVudFRhcmdldChleHByKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLklOVkFMSURfTEhTX0lOX0FTU0lHTk1FTlQpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlBvc3RmaXhFeHByZXNzaW9uKGV4cHIsIG9wZXJhdG9yLnZhbHVlKSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZUxlZnRIYW5kU2lkZUV4cHJlc3Npb24oe2FsbG93Q2FsbH0pIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgcHJldmlvdXNBbGxvd0luID0gdGhpcy5hbGxvd0luO1xuICAgIHRoaXMuYWxsb3dJbiA9IGFsbG93Q2FsbDtcblxuICAgIGxldCBleHByLCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuXG4gICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5TVVBFUikpIHtcbiAgICAgIGV4cHIgPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuU3VwZXIsIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkxQQVJFTikpIHtcbiAgICAgICAgaWYgKGFsbG93Q2FsbCkge1xuICAgICAgICAgIGlmICh0aGlzLmluQ29uc3RydWN0b3IgJiYgIXRoaXMuaW5QYXJhbWV0ZXIpIHtcbiAgICAgICAgICAgIGV4cHIgPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQ2FsbEV4cHJlc3Npb24oZXhwciwgdGhpcy5wYXJzZUFyZ3VtZW50TGlzdCgpKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24oc3RhcnRMb2NhdGlvbiwgRXJyb3JNZXNzYWdlcy5VTkVYUEVDVEVEX1NVUEVSX0NBTEwpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodG9rZW4pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkxCUkFDSykpIHtcbiAgICAgICAgaWYgKHRoaXMuaW5NZXRob2QgJiYgIXRoaXMuaW5QYXJhbWV0ZXIpIHtcbiAgICAgICAgICBleHByID0gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkNvbXB1dGVkTWVtYmVyRXhwcmVzc2lvbihleHByLCB0aGlzLnBhcnNlQ29tcHV0ZWRNZW1iZXIoKSksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24oc3RhcnRMb2NhdGlvbiwgRXJyb3JNZXNzYWdlcy5VTkVYUEVDVEVEX1NVUEVSX1BST1BFUlRZKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5QRVJJT0QpKSB7XG4gICAgICAgIGlmICh0aGlzLmluTWV0aG9kICYmICF0aGlzLmluUGFyYW1ldGVyKSB7XG4gICAgICAgICAgZXhwciA9IHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5TdGF0aWNNZW1iZXJFeHByZXNzaW9uKGV4cHIsIHRoaXMucGFyc2VOb25Db21wdXRlZE1lbWJlcigpKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbihzdGFydExvY2F0aW9uLCBFcnJvck1lc3NhZ2VzLlVORVhQRUNURURfU1VQRVJfUFJPUEVSVFkpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodG9rZW4pO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuTkVXKSkge1xuICAgICAgZXhwciA9IHRoaXMucGFyc2VOZXdFeHByZXNzaW9uKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGV4cHIgPSB0aGlzLnBhcnNlUHJpbWFyeUV4cHJlc3Npb24oKTtcbiAgICB9XG5cbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgaWYgKGFsbG93Q2FsbCAmJiB0aGlzLm1hdGNoKFRva2VuVHlwZS5MUEFSRU4pKSB7XG4gICAgICAgIGV4cHIgPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQ2FsbEV4cHJlc3Npb24oZXhwciwgdGhpcy5wYXJzZUFyZ3VtZW50TGlzdCgpKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkxCUkFDSykpIHtcbiAgICAgICAgZXhwciA9IHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5Db21wdXRlZE1lbWJlckV4cHJlc3Npb24oZXhwciwgdGhpcy5wYXJzZUNvbXB1dGVkTWVtYmVyKCkpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuUEVSSU9EKSkge1xuICAgICAgICBleHByID0gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlN0YXRpY01lbWJlckV4cHJlc3Npb24oZXhwciwgdGhpcy5wYXJzZU5vbkNvbXB1dGVkTWVtYmVyKCkpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuVEVNUExBVEUpKSB7XG4gICAgICAgIGV4cHIgPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuVGVtcGxhdGVFeHByZXNzaW9uKGV4cHIsIHRoaXMucGFyc2VUZW1wbGF0ZUVsZW1lbnRzKCkpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuYWxsb3dJbiA9IHByZXZpb3VzQWxsb3dJbjtcblxuICAgIHJldHVybiBleHByO1xuICB9XG5cbiAgcGFyc2VUZW1wbGF0ZUVsZW1lbnRzKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgIGlmICh0b2tlbi50YWlsKSB7XG4gICAgICB0aGlzLmxleCgpO1xuICAgICAgcmV0dXJuIFt0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuVGVtcGxhdGVFbGVtZW50KHRva2VuLnZhbHVlLnNsaWNlKDEsIC0xKSksIHN0YXJ0TG9jYXRpb24pXTtcbiAgICB9XG4gICAgbGV0IHJlc3VsdCA9IFt0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuVGVtcGxhdGVFbGVtZW50KHRoaXMubGV4KCkudmFsdWUuc2xpY2UoMSwgLTIpKSwgc3RhcnRMb2NhdGlvbildO1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICByZXN1bHQucHVzaCh0aGlzLnBhcnNlRXhwcmVzc2lvbigpKTtcbiAgICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuUkJSQUNFKSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuaW5kZXggPSB0aGlzLnN0YXJ0SW5kZXg7XG4gICAgICB0aGlzLmxpbmUgPSB0aGlzLnN0YXJ0TGluZTtcbiAgICAgIHRoaXMubGluZVN0YXJ0ID0gdGhpcy5zdGFydExpbmVTdGFydDtcbiAgICAgIHRoaXMubG9va2FoZWFkID0gdGhpcy5zY2FuVGVtcGxhdGVFbGVtZW50KCk7XG4gICAgICBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgICAgdG9rZW4gPSB0aGlzLmxleCgpO1xuICAgICAgaWYgKHRva2VuLnRhaWwpIHtcbiAgICAgICAgcmVzdWx0LnB1c2godGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlRlbXBsYXRlRWxlbWVudCh0b2tlbi52YWx1ZS5zbGljZSgxLCAtMSkpLCBzdGFydExvY2F0aW9uKSk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHQucHVzaCh0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuVGVtcGxhdGVFbGVtZW50KHRva2VuLnZhbHVlLnNsaWNlKDEsIC0yKSksIHN0YXJ0TG9jYXRpb24pKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwYXJzZU5vbkNvbXB1dGVkTWVtYmVyKCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5QRVJJT0QpO1xuICAgIGlmICghdGhpcy5sb29rYWhlYWQudHlwZS5rbGFzcy5pc0lkZW50aWZpZXJOYW1lKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5sZXgoKS52YWx1ZTtcbiAgICB9XG4gIH1cblxuICBwYXJzZUNvbXB1dGVkTWVtYmVyKCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MQlJBQ0spO1xuICAgIGxldCBleHByID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUkJSQUNLKTtcbiAgICByZXR1cm4gZXhwcjtcbiAgfVxuXG4gIHBhcnNlTmV3RXhwcmVzc2lvbigpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTkVXKTtcbiAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLlBFUklPRCkpIHtcbiAgICAgIGxldCBpZGVudCA9IHRoaXMuZXhwZWN0KFRva2VuVHlwZS5JREVOVElGSUVSKTtcbiAgICAgIGlmIChpZGVudC52YWx1ZSAhPT0gXCJ0YXJnZXRcIikge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQoaWRlbnQpO1xuICAgICAgfSBlbHNlIGlmICghdGhpcy5pbkZ1bmN0aW9uQm9keSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHN0YXJ0TG9jYXRpb24sIEVycm9yTWVzc2FnZXMuVU5FWFBFQ1RFRF9ORVdfVEFSR0VUKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuTmV3VGFyZ2V0RXhwcmVzc2lvbiwgc3RhcnRMb2NhdGlvbik7XG4gICAgfVxuICAgIGxldCBjYWxsZWUgPSB0aGlzLnBhcnNlTGVmdEhhbmRTaWRlRXhwcmVzc2lvbih7YWxsb3dDYWxsOiBmYWxzZX0pO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuTmV3RXhwcmVzc2lvbihcbiAgICAgIGNhbGxlZSxcbiAgICAgIHRoaXMubWF0Y2goVG9rZW5UeXBlLkxQQVJFTikgPyB0aGlzLnBhcnNlQXJndW1lbnRMaXN0KCkgOiBbXVxuICAgICksIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VQcmltYXJ5RXhwcmVzc2lvbigpIHtcbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuTFBBUkVOKSkge1xuICAgICAgcmV0dXJuIHRoaXMucGFyc2VHcm91cEV4cHJlc3Npb24oKTtcbiAgICB9XG5cbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcblxuICAgIHN3aXRjaCAodGhpcy5sb29rYWhlYWQudHlwZSkge1xuICAgICAgY2FzZSBUb2tlblR5cGUuWUlFTEQ6XG4gICAgICBjYXNlIFRva2VuVHlwZS5JREVOVElGSUVSOlxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIklkZW50aWZpZXJFeHByZXNzaW9uXCIsIG5hbWU6IHRoaXMucGFyc2VJZGVudGlmaWVyKCkgfSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICBjYXNlIFRva2VuVHlwZS5TVFJJTkc6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlU3RyaW5nTGl0ZXJhbCgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuTlVNQkVSOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZU51bWVyaWNMaXRlcmFsKCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5USElTOlxuICAgICAgICB0aGlzLmxleCgpO1xuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlRoaXNFeHByZXNzaW9uLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkZVTkNUSU9OOlxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24odGhpcy5wYXJzZUZ1bmN0aW9uKHtpc0V4cHI6IHRydWV9KSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICBjYXNlIFRva2VuVHlwZS5UUlVFOlxuICAgICAgICB0aGlzLmxleCgpO1xuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkxpdGVyYWxCb29sZWFuRXhwcmVzc2lvbih0cnVlKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICBjYXNlIFRva2VuVHlwZS5GQUxTRTpcbiAgICAgICAgdGhpcy5sZXgoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5MaXRlcmFsQm9vbGVhbkV4cHJlc3Npb24oZmFsc2UpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk5VTEw6XG4gICAgICAgIHRoaXMubGV4KCk7XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuTGl0ZXJhbE51bGxFeHByZXNzaW9uLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkxCUkFDSzpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VBcnJheUV4cHJlc3Npb24oKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkxCUkFDRTpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VPYmplY3RFeHByZXNzaW9uKCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5URU1QTEFURTpcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5UZW1wbGF0ZUV4cHJlc3Npb24obnVsbCwgdGhpcy5wYXJzZVRlbXBsYXRlRWxlbWVudHMoKSksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgY2FzZSBUb2tlblR5cGUuRElWOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX0RJVjpcbiAgICAgICAgdGhpcy5sb29rYWhlYWQgPSB0aGlzLnNjYW5SZWdFeHAodGhpcy5sb29rYWhlYWQudHlwZSA9PT0gVG9rZW5UeXBlLkRJViA/IFwiL1wiIDogXCIvPVwiKTtcbiAgICAgICAgbGV0IHRva2VuID0gdGhpcy5sZXgoKTtcbiAgICAgICAgbGV0IGxhc3RTbGFzaCA9IHRva2VuLnZhbHVlLmxhc3RJbmRleE9mKFwiL1wiKTtcbiAgICAgICAgbGV0IHBhdHRlcm4gPSB0b2tlbi52YWx1ZS5zbGljZSgxLCBsYXN0U2xhc2gpLnJlcGxhY2UoXCJcXFxcL1wiLCBcIi9cIik7XG4gICAgICAgIGxldCBmbGFncyA9IHRva2VuLnZhbHVlLnNsaWNlKGxhc3RTbGFzaCArIDEpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIFJlZ0V4cChwYXR0ZXJuLCBmbGFncyk7XG4gICAgICAgIH0gY2F0Y2ggKHVudXNlZCkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuSU5WQUxJRF9SRUdVTEFSX0VYUFJFU1NJT04pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuTGl0ZXJhbFJlZ0V4cEV4cHJlc3Npb24ocGF0dGVybiwgZmxhZ3MpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkNMQVNTOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZUNsYXNzKHtpc0V4cHI6IHRydWV9KTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxleCgpKTtcbiAgICB9XG4gIH1cblxuICBwYXJzZU51bWVyaWNMaXRlcmFsKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGlmICh0aGlzLnN0cmljdCAmJiB0aGlzLmxvb2thaGVhZC5vY3RhbCkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0aGlzLmxvb2thaGVhZCwgRXJyb3JNZXNzYWdlcy5TVFJJQ1RfT0NUQUxfTElURVJBTCk7XG4gICAgfVxuICAgIGxldCB0b2tlbjIgPSB0aGlzLmxleCgpO1xuICAgIGxldCBub2RlID0gdG9rZW4yLl92YWx1ZSA9PT0gMS8wXG4gICAgICA/IG5ldyBTaGlmdC5MaXRlcmFsSW5maW5pdHlFeHByZXNzaW9uXG4gICAgICA6IG5ldyBTaGlmdC5MaXRlcmFsTnVtZXJpY0V4cHJlc3Npb24odG9rZW4yLl92YWx1ZSk7XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5vZGUsIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VTdHJpbmdMaXRlcmFsKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGlmICh0aGlzLnN0cmljdCAmJiB0aGlzLmxvb2thaGVhZC5vY3RhbCkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0aGlzLmxvb2thaGVhZCwgRXJyb3JNZXNzYWdlcy5TVFJJQ1RfT0NUQUxfTElURVJBTCk7XG4gICAgfVxuICAgIGxldCB0b2tlbjIgPSB0aGlzLmxleCgpO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuTGl0ZXJhbFN0cmluZ0V4cHJlc3Npb24odG9rZW4yLl92YWx1ZSwgdG9rZW4yLnNsaWNlLnRleHQpLFxuICAgICAgICBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlSWRlbnRpZmllck5hbWUoKSB7XG4gICAgaWYgKHRoaXMubG9va2FoZWFkLnR5cGUua2xhc3MuaXNJZGVudGlmaWVyTmFtZSkge1xuICAgICAgcmV0dXJuIHRoaXMubGV4KCkudmFsdWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgfVxuICB9XG5cbiAgcGFyc2VCaW5kaW5nSWRlbnRpZmllcigpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIkJpbmRpbmdJZGVudGlmaWVyXCIsIG5hbWU6IHRoaXMucGFyc2VJZGVudGlmaWVyKCkgfSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZUlkZW50aWZpZXIoKSB7XG4gICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLllJRUxEKSkge1xuICAgICAgaWYgKHRoaXMuc3RyaWN0KSB7XG4gICAgICAgIHRoaXMubG9va2FoZWFkLnR5cGUgPSBUb2tlblR5cGUuWUlFTEQ7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24pIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5pbkdlbmVyYXRvckJvZHkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxleCgpLnZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5leHBlY3QoVG9rZW5UeXBlLklERU5USUZJRVIpLnZhbHVlO1xuICB9XG5cbiAgcGFyc2VBcmd1bWVudExpc3QoKSB7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgbGV0IGFyZ3MgPSB0aGlzLnBhcnNlQXJndW1lbnRzKCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJQQVJFTik7XG4gICAgcmV0dXJuIGFyZ3M7XG4gIH1cblxuICBwYXJzZUFyZ3VtZW50cygpIHtcbiAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5SUEFSRU4pIHx8IHRoaXMuZW9mKCkpIHtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH1cbiAgICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgICAgbGV0IGFyZztcbiAgICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuRUxMSVBTSVMpKSB7XG4gICAgICAgIGFyZyA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgICBhcmcgPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuU3ByZWFkRWxlbWVudChhcmcpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFyZyA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgfVxuICAgICAgcmVzdWx0LnB1c2goYXJnKTtcbiAgICAgIGlmICghdGhpcy5lYXQoVG9rZW5UeXBlLkNPTU1BKSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8vIDExLjIgTGVmdC1IYW5kLVNpZGUgRXhwcmVzc2lvbnM7XG5cbiAgZW5zdXJlQXJyb3coKSB7XG4gICAgaWYgKHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0KSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5FWFBFQ1RFRF9MSU5FX1RFUk1JTkFUT1IpO1xuICAgIH1cbiAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLkFSUk9XKSkge1xuICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkFSUk9XKTtcbiAgICB9XG4gIH1cblxuICBwYXJzZUdyb3VwRXhwcmVzc2lvbigpIHtcbiAgICBsZXQgcmVzdCA9IG51bGw7XG4gICAgbGV0IHN0YXJ0ID0gdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5SUEFSRU4pKSB7XG4gICAgICB0aGlzLmVuc3VyZUFycm93KCk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiBBUlJPV19FWFBSRVNTSU9OX1BBUkFNUyxcbiAgICAgICAgcGFyYW1zOiBbXSxcbiAgICAgICAgcmVzdDogbnVsbFxuICAgICAgfTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5FTExJUFNJUykpIHtcbiAgICAgIHJlc3QgPSB0aGlzLnBhcnNlQmluZGluZ0lkZW50aWZpZXIoKTtcbiAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgICAgdGhpcy5lbnN1cmVBcnJvdygpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogQVJST1dfRVhQUkVTU0lPTl9QQVJBTVMsXG4gICAgICAgIHBhcmFtczogW10sXG4gICAgICAgIHJlc3Q6IHJlc3RcbiAgICAgIH07XG4gICAgfVxuXG4gICAgbGV0IHBvc3NpYmxlQmluZGluZ3MgPSAhdGhpcy5tYXRjaChUb2tlblR5cGUuTFBBUkVOKTtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgZ3JvdXAgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICBsZXQgcGFyYW1zID0gW2dyb3VwXTtcblxuICAgIHdoaWxlICh0aGlzLmVhdChUb2tlblR5cGUuQ09NTUEpKSB7XG4gICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuRUxMSVBTSVMpKSB7XG4gICAgICAgIGlmICghcG9zc2libGVCaW5kaW5ncykge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5sZXgoKTtcbiAgICAgICAgcmVzdCA9IHRoaXMucGFyc2VCaW5kaW5nSWRlbnRpZmllcigpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHBvc3NpYmxlQmluZGluZ3MgPSBwb3NzaWJsZUJpbmRpbmdzICYmICF0aGlzLm1hdGNoKFRva2VuVHlwZS5MUEFSRU4pO1xuICAgICAgbGV0IGV4cHIgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgIHBhcmFtcy5wdXNoKGV4cHIpO1xuICAgICAgZ3JvdXAgPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQmluYXJ5RXhwcmVzc2lvbihcIixcIiwgZ3JvdXAsIGV4cHIpLCBzdGFydExvY2F0aW9uKTtcbiAgICB9XG5cbiAgICBpZiAocG9zc2libGVCaW5kaW5ncykge1xuICAgICAgcG9zc2libGVCaW5kaW5ncyA9IHBhcmFtcy5ldmVyeShlID0+XG4gICAgICAgIFBhcnNlci5pc0Rlc3RydWN0dXJpbmdUYXJnZXRXaXRoRGVmYXVsdChlLCBQYXJzZXIuaXNWYWxpZFNpbXBsZUJpbmRpbmdUYXJnZXQpKTtcbiAgICB9XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcblxuICAgIGlmICghdGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQgJiYgdGhpcy5tYXRjaChUb2tlblR5cGUuQVJST1cpKSB7XG4gICAgICBpZiAoIXBvc3NpYmxlQmluZGluZ3MpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbihzdGFydCwgRXJyb3JNZXNzYWdlcy5JTExFR0FMX0FSUk9XX0ZVTkNUSU9OX1BBUkFNUyk7XG4gICAgICB9XG4gICAgICAvLyBjaGVjayBkdXAgcGFyYW1zXG4gICAgICBwYXJhbXMgPSBwYXJhbXMubWFwKFBhcnNlci50cmFuc2Zvcm1EZXN0cnVjdHVyaW5nKTtcbiAgICAgIGxldCBhbGxCb3VuZE5hbWVzID0gW107XG4gICAgICBwYXJhbXMuZm9yRWFjaChleHByID0+IHtcbiAgICAgICAgbGV0IGJvdW5kTmFtZXMgPSBQYXJzZXIuYm91bmROYW1lcyhleHByKTtcbiAgICAgICAgbGV0IGR1cCA9IGZpcnN0RHVwbGljYXRlKGJvdW5kTmFtZXMpO1xuICAgICAgICBpZiAoZHVwKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLkRVUExJQ0FURV9CSU5ESU5HLCBkdXApO1xuICAgICAgICB9XG4gICAgICAgIGFsbEJvdW5kTmFtZXMgPSBhbGxCb3VuZE5hbWVzLmNvbmNhdChib3VuZE5hbWVzKTtcbiAgICAgIH0pO1xuICAgICAgaWYgKHJlc3QpIHtcbiAgICAgICAgYWxsQm91bmROYW1lcy5wdXNoKHJlc3QubmFtZSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChmaXJzdER1cGxpY2F0ZShhbGxCb3VuZE5hbWVzKSAhPSBudWxsKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUEFSQU1fRFVQRSk7XG4gICAgICB9XG5cbiAgICAgIGxldCBzdHJpY3RSZXN0cmljdGVkV29yZCA9IGFsbEJvdW5kTmFtZXMuc29tZShpc1Jlc3RyaWN0ZWRXb3JkKTtcbiAgICAgIGlmIChzdHJpY3RSZXN0cmljdGVkV29yZCkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX1BBUkFNX05BTUUpO1xuICAgICAgfVxuXG4gICAgICBsZXQgc3RyaWN0UmVzZXJ2ZWRXb3JkID0gaGFzU3RyaWN0TW9kZVJlc2VydmVkV29yZChhbGxCb3VuZE5hbWVzKTtcbiAgICAgIGlmIChzdHJpY3RSZXNlcnZlZFdvcmQpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlNUUklDVF9SRVNFUlZFRF9XT1JEKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogQVJST1dfRVhQUkVTU0lPTl9QQVJBTVMsXG4gICAgICAgIHBhcmFtcyxcbiAgICAgICAgcmVzdFxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHJlc3QpIHtcbiAgICAgICAgdGhpcy5lbnN1cmVBcnJvdygpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGdyb3VwO1xuICAgIH1cbiAgfVxuXG5cbiAgcGFyc2VBcnJheUV4cHJlc3Npb24oKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTEJSQUNLKTtcblxuICAgIGxldCBlbGVtZW50cyA9IHRoaXMucGFyc2VBcnJheUV4cHJlc3Npb25FbGVtZW50cygpO1xuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJCUkFDSyk7XG5cbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkFycmF5RXhwcmVzc2lvbihlbGVtZW50cyksIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VBcnJheUV4cHJlc3Npb25FbGVtZW50cygpIHtcbiAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0spKSB7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9XG4gICAgICBsZXQgZWw7XG5cbiAgICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuQ09NTUEpKSB7XG4gICAgICAgIGVsID0gbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgICAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLkVMTElQU0lTKSkge1xuICAgICAgICAgIGVsID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgICAgICAgZWwgPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuU3ByZWFkRWxlbWVudChlbCksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVsID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0spKSB7XG4gICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNPTU1BKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmVzdWx0LnB1c2goZWwpO1xuICAgIH1cbiAgfVxuXG4gIHBhcnNlT2JqZWN0RXhwcmVzc2lvbigpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MQlJBQ0UpO1xuXG4gICAgbGV0IHByb3BlcnRpZXMgPSB0aGlzLnBhcnNlT2JqZWN0RXhwcmVzc2lvbkl0ZW1zKCk7XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUkJSQUNFKTtcblxuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuT2JqZWN0RXhwcmVzc2lvbihwcm9wZXJ0aWVzKSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuXG4gIHBhcnNlT2JqZWN0RXhwcmVzc2lvbkl0ZW1zKCkge1xuICAgIGxldCByZXN1bHQgPSBbXTtcbiAgICBsZXQgaGFzX19wcm90b19fID0gW2ZhbHNlXTtcbiAgICB3aGlsZSAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJCUkFDRSkpIHtcbiAgICAgIHJlc3VsdC5wdXNoKHRoaXMucGFyc2VQcm9wZXJ0eURlZmluaXRpb24oaGFzX19wcm90b19fKSk7XG4gICAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJCUkFDRSkpIHtcbiAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNPTU1BKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHBhcnNlUHJvcGVydHlEZWZpbml0aW9uKGhhc19fcHJvdG9fXykge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuXG4gICAgbGV0IHttZXRob2RPcktleSwga2luZH0gPSB0aGlzLnBhcnNlTWV0aG9kRGVmaW5pdGlvbihmYWxzZSk7XG4gICAgc3dpdGNoIChraW5kKSB7XG4gICAgICBjYXNlIFwibWV0aG9kXCI6XG4gICAgICAgIHJldHVybiBtZXRob2RPcktleTtcbiAgICAgIGNhc2UgXCJpZGVudGlmaWVyXCI6IC8vIElkZW50aWZpZXJSZWZlcmVuY2UsXG4gICAgICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuQVNTSUdOKSkge1xuICAgICAgICAgIC8vIENvdmVySW5pdGlhbGl6ZWROYW1lXG4gICAgICAgICAgaWYgKCh0aGlzLnN0cmljdCB8fCB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uKSAmJiBtZXRob2RPcktleS52YWx1ZSA9PT0gXCJ5aWVsZFwiKSB7XG4gICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodG9rZW4pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIkJpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXJcIixcbiAgICAgICAgICAgIGJpbmRpbmc6IHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJCaW5kaW5nSWRlbnRpZmllclwiLCBuYW1lOiBtZXRob2RPcktleS52YWx1ZSB9LCBzdGFydExvY2F0aW9uKSxcbiAgICAgICAgICAgIGluaXQ6IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpLFxuICAgICAgICAgIH0sIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgICB9IGVsc2UgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5DT0xPTikpIHtcbiAgICAgICAgICBpZiAodG9rZW4udHlwZSAhPT0gVG9rZW5UeXBlLklERU5USUZJRVIgJiYgdG9rZW4udHlwZSAhPT0gVG9rZW5UeXBlLllJRUxEIHx8XG4gICAgICAgICAgICAodGhpcy5zdHJpY3QgfHwgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbikgJiYgbWV0aG9kT3JLZXkudmFsdWUgPT09IFwieWllbGRcIikge1xuICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRva2VuKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5TaG9ydGhhbmRQcm9wZXJ0eShtZXRob2RPcktleS52YWx1ZSksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gRGF0YVByb3BlcnR5XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNPTE9OKTtcbiAgICBpZiAobWV0aG9kT3JLZXkudHlwZSA9PT0gXCJTdGF0aWNQcm9wZXJ0eU5hbWVcIikge1xuICAgICAgaWYgKG1ldGhvZE9yS2V5LnZhbHVlID09PSBcIl9fcHJvdG9fX1wiKSB7XG4gICAgICAgIGlmICghaGFzX19wcm90b19fWzBdKSB7XG4gICAgICAgICAgaGFzX19wcm90b19fWzBdID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLkRVUExJQ0FURV9QUk9UT19QUk9QRVJUWSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5EYXRhUHJvcGVydHkoXG4gICAgICAgIG1ldGhvZE9yS2V5LFxuICAgICAgICB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKSksXG4gICAgICBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlUHJvcGVydHlOYW1lKCkge1xuICAgIC8vIFByb3BlcnR5TmFtZVtZaWVsZCxHZW5lcmF0b3JQYXJhbWV0ZXJdOlxuICAgIGxldCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuXG4gICAgaWYgKHRoaXMuZW9mKCkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0b2tlbik7XG4gICAgfVxuXG4gICAgc3dpdGNoICh0b2tlbi50eXBlKSB7XG4gICAgICBjYXNlIFRva2VuVHlwZS5TVFJJTkc6XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuU3RhdGljUHJvcGVydHlOYW1lKHRoaXMucGFyc2VTdHJpbmdMaXRlcmFsKCkudmFsdWUpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk5VTUJFUjpcbiAgICAgICAgbGV0IG51bUxpdGVyYWwgPSB0aGlzLnBhcnNlTnVtZXJpY0xpdGVyYWwoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5TdGF0aWNQcm9wZXJ0eU5hbWUoXCJcIiArIChudW1MaXRlcmFsLnR5cGUgPT09IFwiTGl0ZXJhbEluZmluaXR5RXhwcmVzc2lvblwiID8gMSAvIDAgOiBudW1MaXRlcmFsLnZhbHVlKSksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgY2FzZSBUb2tlblR5cGUuTEJSQUNLOlxuICAgICAgICBsZXQgcHJldmlvdXNZaWVsZCA9IHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb247XG4gICAgICAgIGlmICh0aGlzLmluR2VuZXJhdG9yUGFyYW1ldGVyKSB7XG4gICAgICAgICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MQlJBQ0spO1xuICAgICAgICBsZXQgZXhwciA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUkJSQUNLKTtcbiAgICAgICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IHByZXZpb3VzWWllbGQ7XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQ29tcHV0ZWRQcm9wZXJ0eU5hbWUoZXhwciksIHN0YXJ0TG9jYXRpb24pO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuU3RhdGljUHJvcGVydHlOYW1lKHRoaXMucGFyc2VJZGVudGlmaWVyTmFtZSgpKSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICAvKipcbiAgICogVGVzdCBpZiBsb29rYWhlYWQgY2FuIGJlIHRoZSBiZWdpbm5pbmcgb2YgYSBgUHJvcGVydHlOYW1lYC5cbiAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAqL1xuICBsb29rYWhlYWRQcm9wZXJ0eU5hbWUoKSB7XG4gICAgc3dpdGNoICh0aGlzLmxvb2thaGVhZC50eXBlKSB7XG4gICAgICBjYXNlIFRva2VuVHlwZS5OVU1CRVI6XG4gICAgICBjYXNlIFRva2VuVHlwZS5TVFJJTkc6XG4gICAgICBjYXNlIFRva2VuVHlwZS5MQlJBQ0s6XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHRoaXMubG9va2FoZWFkLnR5cGUua2xhc3MuaXNJZGVudGlmaWVyTmFtZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVHJ5IHRvIHBhcnNlIGEgbWV0aG9kIGRlZmluaXRpb24uXG4gICAqXG4gICAqIElmIGl0IHR1cm5zIG91dCB0byBiZSBvbmUgb2Y6XG4gICAqICAqIGBJZGVudGlmaWVyUmVmZXJlbmNlYFxuICAgKiAgKiBgQ292ZXJJbml0aWFsaXplZE5hbWVgIChgSWRlbnRpZmllclJlZmVyZW5jZSBcIj1cIiBBc3NpZ25tZW50RXhwcmVzc2lvbmApXG4gICAqICAqIGBQcm9wZXJ0eU5hbWUgOiBBc3NpZ25tZW50RXhwcmVzc2lvbmBcbiAgICogVGhlIHRoZSBwYXJzZXIgd2lsbCBzdG9wIGF0IHRoZSBlbmQgb2YgdGhlIGxlYWRpbmcgYElkZW50aWZpZXJgIG9yIGBQcm9wZXJ0eU5hbWVgIGFuZCByZXR1cm4gaXQuXG4gICAqXG4gICAqIEByZXR1cm5zIHt7bWV0aG9kT3JLZXk6IChTaGlmdC5NZXRob2R8U2hpZnQuUHJvcGVydHlOYW1lKSwga2luZDogc3RyaW5nfX1cbiAgICovXG4gIHBhcnNlTWV0aG9kRGVmaW5pdGlvbihpc0NsYXNzUHJvdG9NZXRob2QpIHtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcblxuICAgIGxldCBpc0dlbmVyYXRvciA9ICEhdGhpcy5lYXQoVG9rZW5UeXBlLk1VTCk7XG5cbiAgICBsZXQga2V5ID0gdGhpcy5wYXJzZVByb3BlcnR5TmFtZSgpO1xuXG4gICAgaWYgKCFpc0dlbmVyYXRvciAmJiB0b2tlbi50eXBlID09PSBUb2tlblR5cGUuSURFTlRJRklFUikge1xuICAgICAgbGV0IG5hbWUgPSB0b2tlbi52YWx1ZTtcbiAgICAgIGlmIChuYW1lLmxlbmd0aCA9PT0gMykge1xuICAgICAgICAvLyBQcm9wZXJ0eSBBc3NpZ25tZW50OiBHZXR0ZXIgYW5kIFNldHRlci5cbiAgICAgICAgaWYgKG5hbWUgPT09IFwiZ2V0XCIgJiYgdGhpcy5sb29rYWhlYWRQcm9wZXJ0eU5hbWUoKSkge1xuICAgICAgICAgIGtleSA9IHRoaXMucGFyc2VQcm9wZXJ0eU5hbWUoKTtcbiAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTFBBUkVOKTtcbiAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcbiAgICAgICAgICBsZXQgcHJldmlvdXNJbkNvbnN0cnVjdG9yID0gdGhpcy5pbkNvbnN0cnVjdG9yO1xuICAgICAgICAgIHRoaXMuaW5Db25zdHJ1Y3RvciA9IGZhbHNlO1xuICAgICAgICAgIGxldCBwcmV2aW91c0luTWV0aG9kID0gdGhpcy5pbk1ldGhvZDtcbiAgICAgICAgICB0aGlzLmluTWV0aG9kID0gdHJ1ZTtcbiAgICAgICAgICBsZXQgW2JvZHldID0gdGhpcy5wYXJzZUZ1bmN0aW9uQm9keShbXSk7XG4gICAgICAgICAgdGhpcy5pbkNvbnN0cnVjdG9yID0gcHJldmlvdXNJbkNvbnN0cnVjdG9yO1xuICAgICAgICAgIHRoaXMuaW5NZXRob2QgPSBwcmV2aW91c0luTWV0aG9kO1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBtZXRob2RPcktleTogdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkdldHRlcihrZXksIGJvZHkpLCBzdGFydExvY2F0aW9uKSxcbiAgICAgICAgICAgIGtpbmQ6IFwibWV0aG9kXCJcbiAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2UgaWYgKG5hbWUgPT09IFwic2V0XCIgJiYgdGhpcy5sb29rYWhlYWRQcm9wZXJ0eU5hbWUoKSkge1xuICAgICAgICAgIGtleSA9IHRoaXMucGFyc2VQcm9wZXJ0eU5hbWUoKTtcbiAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTFBBUkVOKTtcbiAgICAgICAgICBsZXQgcGFyYW0gPSB0aGlzLnBhcnNlUGFyYW0oKTtcbiAgICAgICAgICBsZXQgaW5mbyA9IHt9O1xuICAgICAgICAgIHRoaXMuY2hlY2tQYXJhbShwYXJhbSwgdG9rZW4sIFtdLCBpbmZvKTtcbiAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcbiAgICAgICAgICBsZXQgcHJldmlvdXNZaWVsZCA9IHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb247XG4gICAgICAgICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IGZhbHNlO1xuICAgICAgICAgIGxldCBwcmV2aW91c0luQ29uc3RydWN0b3IgPSB0aGlzLmluQ29uc3RydWN0b3I7XG4gICAgICAgICAgdGhpcy5pbkNvbnN0cnVjdG9yID0gZmFsc2U7XG4gICAgICAgICAgbGV0IHByZXZpb3VzSW5NZXRob2QgPSB0aGlzLmluTWV0aG9kO1xuICAgICAgICAgIHRoaXMuaW5NZXRob2QgPSB0cnVlO1xuICAgICAgICAgIGxldCBib3VuZFBhcmFtcyA9IFBhcnNlci5ib3VuZE5hbWVzKHBhcmFtKTtcbiAgICAgICAgICBsZXQgW2JvZHksIGlzU3RyaWN0XSA9IHRoaXMucGFyc2VGdW5jdGlvbkJvZHkoYm91bmRQYXJhbXMpO1xuICAgICAgICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBwcmV2aW91c1lpZWxkO1xuICAgICAgICAgIHRoaXMuaW5Db25zdHJ1Y3RvciA9IHByZXZpb3VzSW5Db25zdHJ1Y3RvcjtcbiAgICAgICAgICB0aGlzLmluTWV0aG9kID0gcHJldmlvdXNJbk1ldGhvZDtcbiAgICAgICAgICBpZiAoaXNTdHJpY3QpIHtcbiAgICAgICAgICAgIGlmIChpbmZvLmZpcnN0UmVzdHJpY3RlZCkge1xuICAgICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKGluZm8uZmlyc3RSZXN0cmljdGVkLCBpbmZvLm1lc3NhZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbWV0aG9kT3JLZXk6IHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5TZXR0ZXIoa2V5LCBwYXJhbSwgYm9keSksIHN0YXJ0TG9jYXRpb24pLFxuICAgICAgICAgICAga2luZDogXCJtZXRob2RcIlxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuTFBBUkVOKSkge1xuICAgICAgbGV0IHByZXZpb3VzWWllbGQgPSB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uO1xuICAgICAgbGV0IHByZXZpb3VzSW5HZW5lcmF0b3JQYXJhbWV0ZXIgPSB0aGlzLmluR2VuZXJhdG9yUGFyYW1ldGVyO1xuICAgICAgdGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlciA9IGlzR2VuZXJhdG9yO1xuICAgICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IGlzR2VuZXJhdG9yO1xuICAgICAgbGV0IHBhcmFtSW5mbyA9IHRoaXMucGFyc2VQYXJhbXMobnVsbCk7XG4gICAgICB0aGlzLmluR2VuZXJhdG9yUGFyYW1ldGVyID0gcHJldmlvdXNJbkdlbmVyYXRvclBhcmFtZXRlcjtcbiAgICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBwcmV2aW91c1lpZWxkO1xuICAgICAgbGV0IHByZXZpb3VzSW5HZW5lcmF0b3JCb2R5ID0gdGhpcy5pbkdlbmVyYXRvckJvZHk7XG4gICAgICBsZXQgcHJldmlvdXNJbkNvbnN0cnVjdG9yID0gdGhpcy5pbkNvbnN0cnVjdG9yO1xuICAgICAgbGV0IHByZXZpb3VzSW5NZXRob2QgPSB0aGlzLmluTWV0aG9kO1xuICAgICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IGlzR2VuZXJhdG9yO1xuICAgICAgdGhpcy5pbkNvbnN0cnVjdG9yID1cbiAgICAgICAgaXNDbGFzc1Byb3RvTWV0aG9kICYmICFpc0dlbmVyYXRvciAmJiB0aGlzLmhhc0NsYXNzSGVyaXRhZ2UgJiZcbiAgICAgICAga2V5LnR5cGUgPT09IFwiU3RhdGljUHJvcGVydHlOYW1lXCIgJiYga2V5LnZhbHVlID09PSBcImNvbnN0cnVjdG9yXCI7XG4gICAgICB0aGlzLmluTWV0aG9kID0gdHJ1ZTtcblxuICAgICAgaWYgKGlzR2VuZXJhdG9yKSB7XG4gICAgICAgIHRoaXMuaW5HZW5lcmF0b3JCb2R5ID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGxldCBib3VuZFBhcmFtcyA9IFtdLmNvbmNhdC5hcHBseShbXSwgcGFyYW1JbmZvLnBhcmFtcy5tYXAoUGFyc2VyLmJvdW5kTmFtZXMpKTtcbiAgICAgIGxldCBbYm9keV0gPSB0aGlzLnBhcnNlRnVuY3Rpb25Cb2R5KGJvdW5kUGFyYW1zKTtcbiAgICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBwcmV2aW91c1lpZWxkO1xuICAgICAgdGhpcy5pbkdlbmVyYXRvckJvZHkgPSBwcmV2aW91c0luR2VuZXJhdG9yQm9keTtcbiAgICAgIHRoaXMuaW5Db25zdHJ1Y3RvciA9IHByZXZpb3VzSW5Db25zdHJ1Y3RvcjtcbiAgICAgIHRoaXMuaW5NZXRob2QgPSBwcmV2aW91c0luTWV0aG9kO1xuXG4gICAgICBpZiAocGFyYW1JbmZvLmZpcnN0UmVzdHJpY3RlZCkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHBhcmFtSW5mby5maXJzdFJlc3RyaWN0ZWQsIHBhcmFtSW5mby5tZXNzYWdlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB7XG4gICAgICAgIG1ldGhvZE9yS2V5OiB0aGlzLm1hcmtMb2NhdGlvbihcbiAgICAgICAgICBuZXcgU2hpZnQuTWV0aG9kKGlzR2VuZXJhdG9yLCBrZXksIHBhcmFtSW5mby5wYXJhbXMsIHBhcmFtSW5mby5yZXN0LCBib2R5KSwgc3RhcnRMb2NhdGlvbiksXG4gICAgICAgIGtpbmQ6IFwibWV0aG9kXCJcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIG1ldGhvZE9yS2V5OiBrZXksXG4gICAgICBraW5kOiB0b2tlbi50eXBlLmtsYXNzLmlzSWRlbnRpZmllck5hbWUgPyBcImlkZW50aWZpZXJcIiA6IFwicHJvcGVydHlcIlxuICAgIH07XG4gIH1cblxuICBwYXJzZUNsYXNzKHtpc0V4cHIsIGluRGVmYXVsdCA9IGZhbHNlfSkge1xuICAgIGxldCBsb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuQ0xBU1MpO1xuICAgIGxldCBpZCA9IG51bGw7XG4gICAgbGV0IGhlcml0YWdlID0gbnVsbDtcblxuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5JREVOVElGSUVSKSkge1xuICAgICAgbGV0IGlkTG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgICBpZCA9IHRoaXMucGFyc2VCaW5kaW5nSWRlbnRpZmllcigpO1xuICAgIH0gZWxzZSBpZiAoIWlzRXhwcikge1xuICAgICAgaWYgKGluRGVmYXVsdCkge1xuICAgICAgICBpZCA9IHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJCaW5kaW5nSWRlbnRpZmllclwiLCBuYW1lOiBcIipkZWZhdWx0KlwiIH0sIGxvY2F0aW9uKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IHByZXZpb3VzSW5HZW5lcmF0b3JQYXJhbWV0ZXIgPSB0aGlzLmluR2VuZXJhdG9yUGFyYW1ldGVyO1xuICAgIGxldCBwcmV2aW91c1BhcmFtWWllbGQgPSB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uO1xuICAgIGxldCBwcmV2aW91c0hhc0NsYXNzSGVyaXRhZ2UgPSB0aGlzLmhhc0NsYXNzSGVyaXRhZ2U7XG4gICAgaWYgKGlzRXhwcikge1xuICAgICAgdGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlciA9IGZhbHNlO1xuICAgICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IGZhbHNlO1xuICAgIH1cbiAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLkVYVEVORFMpKSB7XG4gICAgICBoZXJpdGFnZSA9IHRoaXMucGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uKHthbGxvd0NhbGw6IHRydWV9KTtcbiAgICB9XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTEJSQUNFKTtcbiAgICBsZXQgb3JpZ2luYWxTdHJpY3QgPSB0aGlzLnN0cmljdDtcbiAgICB0aGlzLnN0cmljdCA9IHRydWU7XG4gICAgbGV0IG1ldGhvZHMgPSBbXTtcbiAgICBsZXQgaGFzQ29uc3RydWN0b3IgPSBmYWxzZTtcbiAgICB0aGlzLmhhc0NsYXNzSGVyaXRhZ2UgPSBoZXJpdGFnZSAhPSBudWxsO1xuICAgIHdoaWxlICghdGhpcy5lYXQoVG9rZW5UeXBlLlJCUkFDRSkpIHtcbiAgICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuU0VNSUNPTE9OKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGxldCBtZXRob2RUb2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgICAgbGV0IGlzU3RhdGljID0gZmFsc2U7XG4gICAgICBsZXQge21ldGhvZE9yS2V5LCBraW5kfSA9IHRoaXMucGFyc2VNZXRob2REZWZpbml0aW9uKHRydWUpO1xuICAgICAgaWYgKGtpbmQgPT09IFwiaWRlbnRpZmllclwiICYmIG1ldGhvZE9yS2V5LnZhbHVlID09PSBcInN0YXRpY1wiKSB7XG4gICAgICAgIGlzU3RhdGljID0gdHJ1ZTtcbiAgICAgICAgKHttZXRob2RPcktleSwga2luZH0gPSB0aGlzLnBhcnNlTWV0aG9kRGVmaW5pdGlvbihmYWxzZSkpO1xuICAgICAgfVxuICAgICAgc3dpdGNoIChraW5kKSB7XG4gICAgICAgIGNhc2UgXCJtZXRob2RcIjpcbiAgICAgICAgICBsZXQga2V5ID0gbWV0aG9kT3JLZXkubmFtZTtcbiAgICAgICAgICBpZiAoIWlzU3RhdGljKSB7XG4gICAgICAgICAgICBpZiAoa2V5LnR5cGUgPT09IFwiU3RhdGljUHJvcGVydHlOYW1lXCIgJiYga2V5LnZhbHVlID09PSBcImNvbnN0cnVjdG9yXCIpIHtcbiAgICAgICAgICAgICAgaWYgKG1ldGhvZE9yS2V5LnR5cGUgIT09IFwiTWV0aG9kXCIgfHwgbWV0aG9kT3JLZXkuaXNHZW5lcmF0b3IpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKG1ldGhvZFRva2VuLCBcIkNvbnN0cnVjdG9ycyBjYW5ub3QgYmUgZ2VuZXJhdG9ycywgZ2V0dGVycyBvciBzZXR0ZXJzXCIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChoYXNDb25zdHJ1Y3Rvcikge1xuICAgICAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24obWV0aG9kVG9rZW4sIFwiT25seSBvbmUgY29uc3RydWN0b3IgaXMgYWxsb3dlZCBpbiBhIGNsYXNzXCIpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGhhc0NvbnN0cnVjdG9yID0gdHJ1ZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoa2V5LnR5cGUgPT09IFwiU3RhdGljUHJvcGVydHlOYW1lXCIgJiYga2V5LnZhbHVlID09PSBcInByb3RvdHlwZVwiKSB7XG4gICAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24obWV0aG9kVG9rZW4sIFwiU3RhdGljIGNsYXNzIG1ldGhvZHMgY2Fubm90IGJlIG5hbWVkICdwcm90b3R5cGUnXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBtZXRob2RzLnB1c2goY29weUxvY2F0aW9uKG1ldGhvZE9yS2V5LCBuZXcgU2hpZnQuQ2xhc3NFbGVtZW50KGlzU3RhdGljLCBtZXRob2RPcktleSkpKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKFwiT25seSBtZXRob2RzIGFyZSBhbGxvd2VkIGluIGNsYXNzZXNcIik7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghaXNFeHByKSB7XG4gICAgICB0aGlzLlZETltcIiRcIiArIGlkLm5hbWVdID0gdHJ1ZTtcbiAgICB9XG4gICAgdGhpcy5zdHJpY3QgPSBvcmlnaW5hbFN0cmljdDtcbiAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gcHJldmlvdXNQYXJhbVlpZWxkO1xuICAgIHRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXIgPSBwcmV2aW91c0luR2VuZXJhdG9yUGFyYW1ldGVyO1xuICAgIHRoaXMuaGFzQ2xhc3NIZXJpdGFnZSA9IHByZXZpb3VzSGFzQ2xhc3NIZXJpdGFnZTtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IChpc0V4cHIgPyBTaGlmdC5DbGFzc0V4cHJlc3Npb24gOiBTaGlmdC5DbGFzc0RlY2xhcmF0aW9uKShpZCwgaGVyaXRhZ2UsIG1ldGhvZHMpLCBsb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZUZ1bmN0aW9uKHtpc0V4cHIsIGlzVG9wTGV2ZWwsIGluRGVmYXVsdCA9IGZhbHNlLCBhbGxvd0dlbmVyYXRvciA9IHRydWV9KSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuRlVOQ1RJT04pO1xuXG4gICAgbGV0IGlkID0gbnVsbDtcbiAgICBsZXQgbWVzc2FnZSA9IG51bGw7XG4gICAgbGV0IGZpcnN0UmVzdHJpY3RlZCA9IG51bGw7XG4gICAgbGV0IGlzR2VuZXJhdG9yID0gYWxsb3dHZW5lcmF0b3IgJiYgISF0aGlzLmVhdChUb2tlblR5cGUuTVVMKTtcbiAgICBsZXQgcHJldmlvdXNHZW5lcmF0b3JQYXJhbWV0ZXIgPSB0aGlzLmluR2VuZXJhdG9yUGFyYW1ldGVyO1xuICAgIGxldCBwcmV2aW91c1lpZWxkID0gdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbjtcbiAgICBsZXQgcHJldmlvdXNJbkdlbmVyYXRvckJvZHkgPSB0aGlzLmluR2VuZXJhdG9yQm9keTtcblxuICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuTFBBUkVOKSkge1xuICAgICAgbGV0IHRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgICBsZXQgaWRlbnRpZmllckxvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgICAgaWQgPSB0aGlzLnBhcnNlSWRlbnRpZmllcigpO1xuICAgICAgaWYgKHRoaXMuc3RyaWN0IHx8IGlzR2VuZXJhdG9yKSB7XG4gICAgICAgIGlmIChpc1Jlc3RyaWN0ZWRXb3JkKGlkKSkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuU1RSSUNUX0ZVTkNUSU9OX05BTUUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoaXNSZXN0cmljdGVkV29yZChpZCkpIHtcbiAgICAgICAgICBmaXJzdFJlc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgICBtZXNzYWdlID0gRXJyb3JNZXNzYWdlcy5TVFJJQ1RfRlVOQ1RJT05fTkFNRTtcbiAgICAgICAgfSBlbHNlIGlmIChpc1N0cmljdE1vZGVSZXNlcnZlZFdvcmQoaWQpKSB7XG4gICAgICAgICAgZmlyc3RSZXN0cmljdGVkID0gdG9rZW47XG4gICAgICAgICAgbWVzc2FnZSA9IEVycm9yTWVzc2FnZXMuU1RSSUNUX1JFU0VSVkVEX1dPUkQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlkID0gdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIkJpbmRpbmdJZGVudGlmaWVyXCIsIG5hbWU6IGlkIH0sIGlkZW50aWZpZXJMb2NhdGlvbik7XG4gICAgfSBlbHNlIGlmICghaXNFeHByKSB7XG4gICAgICBpZiAoaW5EZWZhdWx0KSB7XG4gICAgICAgIGlkID0gdGhpcy5tYXJrTG9jYXRpb24oe3R5cGU6IFwiQmluZGluZ0lkZW50aWZpZXJcIiwgbmFtZTogXCIqZGVmYXVsdCpcIiB9LCBzdGFydExvY2F0aW9uKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXIgPSBpc0dlbmVyYXRvcjtcbiAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gaXNHZW5lcmF0b3I7XG4gICAgbGV0IGluZm8gPSB0aGlzLnBhcnNlUGFyYW1zKGZpcnN0UmVzdHJpY3RlZCk7XG4gICAgdGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlciA9IHByZXZpb3VzR2VuZXJhdG9yUGFyYW1ldGVyO1xuICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBwcmV2aW91c1lpZWxkO1xuXG4gICAgaWYgKGluZm8ubWVzc2FnZSAhPSBudWxsKSB7XG4gICAgICBtZXNzYWdlID0gaW5mby5tZXNzYWdlO1xuICAgIH1cblxuICAgIGxldCBwcmV2aW91c1N0cmljdCA9IHRoaXMuc3RyaWN0O1xuICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBpc0dlbmVyYXRvcjtcbiAgICBpZiAoaXNHZW5lcmF0b3IpIHtcbiAgICAgIHRoaXMuaW5HZW5lcmF0b3JCb2R5ID0gdHJ1ZTtcbiAgICB9XG4gICAgbGV0IHByZXZpb3VzSW5Db25zdHJ1Y3RvciA9IHRoaXMuaW5Db25zdHJ1Y3RvcjtcbiAgICB0aGlzLmluQ29uc3RydWN0b3IgPSBmYWxzZTtcbiAgICBsZXQgcHJldmlvdXNJbk1ldGhvZCA9IHRoaXMuaW5NZXRob2Q7XG4gICAgdGhpcy5pbk1ldGhvZCA9IGZhbHNlO1xuICAgIGxldCBib3VuZFBhcmFtcyA9IFtdLmNvbmNhdC5hcHBseShbXSwgaW5mby5wYXJhbXMubWFwKFBhcnNlci5ib3VuZE5hbWVzKSk7XG4gICAgbGV0IFtib2R5LCBpc1N0cmljdF0gPSB0aGlzLnBhcnNlRnVuY3Rpb25Cb2R5KGJvdW5kUGFyYW1zKTtcbiAgICB0aGlzLmluR2VuZXJhdG9yQm9keSA9IHByZXZpb3VzSW5HZW5lcmF0b3JCb2R5O1xuICAgIHRoaXMuaW5Db25zdHJ1Y3RvciA9IHByZXZpb3VzSW5Db25zdHJ1Y3RvcjtcbiAgICB0aGlzLmluTWV0aG9kID0gcHJldmlvdXNJbk1ldGhvZDtcblxuICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBwcmV2aW91c1lpZWxkO1xuICAgIGlmIChtZXNzYWdlICE9IG51bGwpIHtcbiAgICAgIGlmICgodGhpcy5zdHJpY3QgfHwgaXNTdHJpY3QpICYmIGluZm8uZmlyc3RSZXN0cmljdGVkICE9IG51bGwpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbihpbmZvLmZpcnN0UmVzdHJpY3RlZCwgbWVzc2FnZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuc3RyaWN0ID0gcHJldmlvdXNTdHJpY3Q7XG4gICAgbGV0IEN0b3IgPSBpc0V4cHIgPyBTaGlmdC5GdW5jdGlvbkV4cHJlc3Npb24gOiBTaGlmdC5GdW5jdGlvbkRlY2xhcmF0aW9uO1xuICAgIGlmICghaXNFeHByKSB7XG4gICAgICBpZiAoaXNUb3BMZXZlbCkge1xuICAgICAgICB0aGlzLlZETltcIiRcIiArIGlkLm5hbWVdID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuTEROLnB1c2goaWQubmFtZSk7XG4gICAgICB9XG5cbiAgICB9XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKFxuICAgICAgbmV3IEN0b3IoaXNHZW5lcmF0b3IsIGlkLCBpbmZvLnBhcmFtcywgaW5mby5yZXN0LCBib2R5KSxcbiAgICAgIHN0YXJ0TG9jYXRpb25cbiAgICApO1xuICB9XG5cbiAgcGFyc2VQYXJhbSgpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICBsZXQgb3JpZ2luYWxJblBhcmFtZXRlciA9IHRoaXMuaW5QYXJhbWV0ZXI7XG4gICAgdGhpcy5pblBhcmFtZXRlciA9IHRydWU7XG4gICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkxQQVJFTikpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgfVxuICAgIGxldCBwYXJhbSA9IHRoaXMucGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uKHthbGxvd0NhbGw6IGZhbHNlfSk7XG4gICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5BU1NJR04pKSB7XG4gICAgICBsZXQgcHJldmlvdXNJbkdlbmVyYXRvclBhcmFtZXRlciA9IHRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXI7XG4gICAgICBsZXQgcHJldmlvdXNZaWVsZEV4cHJlc3Npb24gPSB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uO1xuICAgICAgaWYgKHRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXIpIHtcbiAgICAgICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgdGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlciA9IGZhbHNlO1xuICAgICAgcGFyYW0gPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQXNzaWdubWVudEV4cHJlc3Npb24oXCI9XCIsIHBhcmFtLCB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKSksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgdGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlciA9IHByZXZpb3VzSW5HZW5lcmF0b3JQYXJhbWV0ZXI7XG4gICAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gcHJldmlvdXNZaWVsZEV4cHJlc3Npb247XG4gICAgfVxuICAgIGlmICghUGFyc2VyLmlzRGVzdHJ1Y3R1cmluZ1RhcmdldFdpdGhEZWZhdWx0KHBhcmFtLCBQYXJzZXIuaXNWYWxpZFNpbXBsZUJpbmRpbmdUYXJnZXQpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodG9rZW4pO1xuICAgIH1cbiAgICB0aGlzLmluUGFyYW1ldGVyID0gb3JpZ2luYWxJblBhcmFtZXRlcjtcbiAgICByZXR1cm4gUGFyc2VyLnRyYW5zZm9ybURlc3RydWN0dXJpbmcocGFyYW0pO1xuICB9XG5cbiAgY2hlY2tQYXJhbShwYXJhbSwgdG9rZW4sIGJvdW5kLCBpbmZvKSB7XG4gICAgbGV0IG5ld0JvdW5kID0gUGFyc2VyLmJvdW5kTmFtZXMocGFyYW0pO1xuICAgIFtdLnB1c2guYXBwbHkoYm91bmQsIG5ld0JvdW5kKTtcblxuICAgIGlmIChmaXJzdER1cGxpY2F0ZShuZXdCb3VuZCkgIT0gbnVsbCkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5EVVBMSUNBVEVfQklORElORywgZmlyc3REdXBsaWNhdGUobmV3Qm91bmQpKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5zdHJpY3QpIHtcbiAgICAgIGlmIChuZXdCb3VuZC5zb21lKGlzUmVzdHJpY3RlZFdvcmQpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuU1RSSUNUX1BBUkFNX05BTUUpO1xuICAgICAgfSBlbHNlIGlmIChmaXJzdER1cGxpY2F0ZShib3VuZCkgIT0gbnVsbCkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLlNUUklDVF9QQVJBTV9EVVBFKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGluZm8uZmlyc3RSZXN0cmljdGVkID09IG51bGwpIHtcbiAgICAgIGlmIChuZXdCb3VuZC5zb21lKGlzUmVzdHJpY3RlZFdvcmQpKSB7XG4gICAgICAgIGluZm8uZmlyc3RSZXN0cmljdGVkID0gdG9rZW47XG4gICAgICAgIGluZm8ubWVzc2FnZSA9IEVycm9yTWVzc2FnZXMuU1RSSUNUX1BBUkFNX05BTUU7XG4gICAgICB9IGVsc2UgaWYgKGhhc1N0cmljdE1vZGVSZXNlcnZlZFdvcmQobmV3Qm91bmQpKSB7XG4gICAgICAgIGluZm8uZmlyc3RSZXN0cmljdGVkID0gdG9rZW47XG4gICAgICAgIGluZm8ubWVzc2FnZSA9IEVycm9yTWVzc2FnZXMuU1RSSUNUX1JFU0VSVkVEX1dPUkQ7XG4gICAgICB9IGVsc2UgaWYgKGZpcnN0RHVwbGljYXRlKGJvdW5kKSAhPSBudWxsKSB7XG4gICAgICAgIGluZm8uZmlyc3RSZXN0cmljdGVkID0gdG9rZW47XG4gICAgICAgIGluZm8ubWVzc2FnZSA9IEVycm9yTWVzc2FnZXMuU1RSSUNUX1BBUkFNX0RVUEU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcGFyc2VQYXJhbXMoZnIpIHtcbiAgICBsZXQgaW5mbyA9IHtwYXJhbXM6IFtdLCByZXN0OiBudWxsfSwgaXNTaW1wbGVQYXJhbWV0ZXIgPSB0cnVlO1xuICAgIGluZm8uZmlyc3RSZXN0cmljdGVkID0gZnI7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG5cbiAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJQQVJFTikpIHtcbiAgICAgIGxldCBib3VuZCA9IFtdO1xuICAgICAgbGV0IHNlZW5SZXN0ID0gZmFsc2U7XG5cbiAgICAgIHdoaWxlICghdGhpcy5lb2YoKSkge1xuICAgICAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICAgICAgbGV0IHBhcmFtO1xuICAgICAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLkVMTElQU0lTKSkge1xuICAgICAgICAgIGlzU2ltcGxlUGFyYW1ldGVyID0gZmFsc2U7XG4gICAgICAgICAgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICAgICAgICBwYXJhbSA9IHRoaXMucGFyc2VCaW5kaW5nSWRlbnRpZmllcigpO1xuICAgICAgICAgIHNlZW5SZXN0ID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwYXJhbSA9IHRoaXMucGFyc2VQYXJhbSgpO1xuICAgICAgICAgIGlmIChwYXJhbS50eXBlICE9PSBcIkJpbmRpbmdJZGVudGlmaWVyXCIpIHtcbiAgICAgICAgICAgIGlzU2ltcGxlUGFyYW1ldGVyID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jaGVja1BhcmFtKHBhcmFtLCB0b2tlbiwgYm91bmQsIGluZm8pO1xuXG4gICAgICAgIGlmIChzZWVuUmVzdCkge1xuICAgICAgICAgIGluZm8ucmVzdCA9IHBhcmFtO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGluZm8ucGFyYW1zLnB1c2gocGFyYW0pO1xuICAgICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuUlBBUkVOKSkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5DT01NQSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFpc1NpbXBsZVBhcmFtZXRlcikge1xuICAgICAgaWYgKGluZm8ubWVzc2FnZSA9PT0gRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUEFSQU1fRFVQRSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKGluZm8ubWVzc2FnZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJQQVJFTik7XG4gICAgcmV0dXJuIGluZm87XG4gIH1cbn1cbiJdfQ==