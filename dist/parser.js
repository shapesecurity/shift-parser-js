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

        var paramsNode = this.markLocation({ type: "FormalParameters", items: params, rest: rest }, startLocation);

        if (this.match(TokenType.LBRACE)) {
          var previousYield = this.allowYieldExpression;
          this.allowYieldExpression = false;
          var boundParams = [].concat.apply([], params.map(Parser.boundNames));
          var _parseFunctionBody = this.parseFunctionBody(boundParams);

          var _parseFunctionBody2 = _slicedToArray(_parseFunctionBody, 1);

          var body = _parseFunctionBody2[0];
          this.allowYieldExpression = previousYield;
          return this.markLocation({ type: "ArrowExpression", params: paramsNode, body: body }, startLocation);
        } else {
          var body = this.parseAssignmentExpression();
          return this.markLocation({ type: "ArrowExpression", params: paramsNode, body: body }, startLocation);
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
                methodOrKey: this.markLocation({ type: "Setter", name: key, param: param, body: body }, startLocation),
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
          var paramsLocation = this.getLocation();
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

          var params = this.markLocation({ type: "FormalParameters", items: paramInfo.params, rest: paramInfo.rest }, paramsLocation);

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
            methodOrKey: this.markLocation({ type: "Method", isGenerator: isGenerator, name: key, params: params, body: body }, startLocation),
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

        var name = null;
        var message = null;
        var firstRestricted = null;
        var isGenerator = allowGenerator && !!this.eat(TokenType.MUL);
        var previousGeneratorParameter = this.inGeneratorParameter;
        var previousYield = this.allowYieldExpression;
        var previousInGeneratorBody = this.inGeneratorBody;

        if (!this.match(TokenType.LPAREN)) {
          var token = this.lookahead;
          var identifierLocation = this.getLocation();
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
            name = this.markLocation({ type: "BindingIdentifier", name: "*default*" }, startLocation);
          } else {
            throw this.createUnexpected(this.lookahead);
          }
        }

        var paramsLocation = this.getLocation();

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

        var params = this.markLocation({ type: "FormalParameters", items: info.params, rest: info.rest }, paramsLocation);

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
        if (!isExpr) {
          if (isTopLevel) {
            this.VDN["$" + name.name] = true;
          } else {
            this.LDN.push(name.name);
          }
        }

        return this.markLocation({ type: isExpr ? "FunctionExpression" : "FunctionDeclaration", isGenerator: isGenerator, name: name, params: params, body: body }, startLocation);
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
//# sourceMappingURL=data:application/json;base64,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U0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1dBQzlCO1NBQ0Y7O0FBRUQsWUFBSSxDQUFDLGlCQUFpQixFQUFFO0FBQ3RCLGNBQUksSUFBSSxDQUFDLE9BQU8sS0FBSyxhQUFhLENBQUMsaUJBQWlCLEVBQUU7QUFDcEQsa0JBQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7V0FDdEM7U0FDRjs7QUFFRCxZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM5QixlQUFPLElBQUksQ0FBQztPQUNiOzs7Ozs7U0F4Z0ZVLE1BQU07R0FBUyxTQUFTIiwiZmlsZSI6InNyYy9wYXJzZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAyMDE0IFNoYXBlIFNlY3VyaXR5LCBJbmMuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKVxuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0ICogYXMgU2hpZnQgZnJvbSBcInNoaWZ0LWFzdFwiO1xuXG5pbXBvcnQge2lzUmVzdHJpY3RlZFdvcmQsIGlzU3RyaWN0TW9kZVJlc2VydmVkV29yZH0gZnJvbSBcIi4vdXRpbHNcIjtcblxuaW1wb3J0IHtFcnJvck1lc3NhZ2VzfSBmcm9tIFwiLi9lcnJvcnNcIjtcblxuaW1wb3J0IFRva2VuaXplciwgeyBUb2tlbkNsYXNzLCBUb2tlblR5cGUgfSBmcm9tIFwiLi90b2tlbml6ZXJcIjtcblxuLy8gRW1wdHkgcGFyYW1ldGVyIGxpc3QgZm9yIEFycm93RXhwcmVzc2lvblxuY29uc3QgQVJST1dfRVhQUkVTU0lPTl9QQVJBTVMgPSBcIkNvdmVyUGFyZW50aGVzaXplZEV4cHJlc3Npb25BbmRBcnJvd1BhcmFtZXRlckxpc3RcIjtcblxuY29uc3QgU1RSSUNUX01PREVfUkVTRVJWRURfV09SRCA9IHtcbiAgXCJpbXBsZW1lbnRzXCI6IG51bGwsIFwiaW50ZXJmYWNlXCI6IG51bGwsIFwicGFja2FnZVwiOiBudWxsLCBcInByaXZhdGVcIjogbnVsbCwgXCJwcm90ZWN0ZWRcIjogbnVsbCxcbiAgXCJwdWJsaWNcIjogbnVsbCwgXCJzdGF0aWNcIjogbnVsbCwgXCJ5aWVsZFwiOiBudWxsLCBcImxldFwiOiBudWxsXG59O1xuXG5jb25zdCBQcmVjZWRlbmNlID0ge1xuICBTZXF1ZW5jZTogMCxcbiAgWWllbGQ6IDEsXG4gIEFzc2lnbm1lbnQ6IDEsXG4gIENvbmRpdGlvbmFsOiAyLFxuICBBcnJvd0Z1bmN0aW9uOiAyLFxuICBMb2dpY2FsT1I6IDMsXG4gIExvZ2ljYWxBTkQ6IDQsXG4gIEJpdHdpc2VPUjogNSxcbiAgQml0d2lzZVhPUjogNixcbiAgQml0d2lzZUFORDogNyxcbiAgRXF1YWxpdHk6IDgsXG4gIFJlbGF0aW9uYWw6IDksXG4gIEJpdHdpc2VTSElGVDogMTAsXG4gIEFkZGl0aXZlOiAxMSxcbiAgTXVsdGlwbGljYXRpdmU6IDEyLFxuICBVbmFyeTogMTMsXG4gIFBvc3RmaXg6IDE0LFxuICBDYWxsOiAxNSxcbiAgTmV3OiAxNixcbiAgVGFnZ2VkVGVtcGxhdGU6IDE3LFxuICBNZW1iZXI6IDE4LFxuICBQcmltYXJ5OiAxOVxufTtcblxuY29uc3QgQmluYXJ5UHJlY2VkZW5jZSA9IHtcbiAgXCJ8fFwiOiBQcmVjZWRlbmNlLkxvZ2ljYWxPUixcbiAgXCImJlwiOiBQcmVjZWRlbmNlLkxvZ2ljYWxBTkQsXG4gIFwifFwiOiBQcmVjZWRlbmNlLkJpdHdpc2VPUixcbiAgXCJeXCI6IFByZWNlZGVuY2UuQml0d2lzZVhPUixcbiAgXCImXCI6IFByZWNlZGVuY2UuQml0d2lzZUFORCxcbiAgXCI9PVwiOiBQcmVjZWRlbmNlLkVxdWFsaXR5LFxuICBcIiE9XCI6IFByZWNlZGVuY2UuRXF1YWxpdHksXG4gIFwiPT09XCI6IFByZWNlZGVuY2UuRXF1YWxpdHksXG4gIFwiIT09XCI6IFByZWNlZGVuY2UuRXF1YWxpdHksXG4gIFwiPFwiOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gIFwiPlwiOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gIFwiPD1cIjogUHJlY2VkZW5jZS5SZWxhdGlvbmFsLFxuICBcIj49XCI6IFByZWNlZGVuY2UuUmVsYXRpb25hbCxcbiAgXCJpblwiOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gIFwiaW5zdGFuY2VvZlwiOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gIFwiPDxcIjogUHJlY2VkZW5jZS5CaXR3aXNlU0hJRlQsXG4gIFwiPj5cIjogUHJlY2VkZW5jZS5CaXR3aXNlU0hJRlQsXG4gIFwiPj4+XCI6IFByZWNlZGVuY2UuQml0d2lzZVNISUZULFxuICBcIitcIjogUHJlY2VkZW5jZS5BZGRpdGl2ZSxcbiAgXCItXCI6IFByZWNlZGVuY2UuQWRkaXRpdmUsXG4gIFwiKlwiOiBQcmVjZWRlbmNlLk11bHRpcGxpY2F0aXZlLFxuICBcIiVcIjogUHJlY2VkZW5jZS5NdWx0aXBsaWNhdGl2ZSxcbiAgXCIvXCI6IFByZWNlZGVuY2UuTXVsdGlwbGljYXRpdmUsXG59O1xuXG5jb25zdCBGT1JfT0ZfVkFSID0ge307XG5cbmZ1bmN0aW9uIGNvcHlMb2NhdGlvbihmcm9tLCB0bykge1xuICBpZiAoXCJsb2NcIiBpbiBmcm9tKSB7XG4gICAgdG8ubG9jID0gZnJvbS5sb2M7XG4gIH1cbiAgcmV0dXJuIHRvO1xufVxuXG4vKipcbiAqXG4gKiBAcGFyYW0ge1tzdHJpbmddfSBzdHJpbmdzXG4gKiBAcmV0dXJucyB7c3RyaW5nP31cbiAqL1xuZnVuY3Rpb24gZmlyc3REdXBsaWNhdGUoc3RyaW5ncykge1xuICBpZiAoc3RyaW5ncy5sZW5ndGggPCAyKSByZXR1cm4gbnVsbDtcbiAgbGV0IG1hcCA9IHt9O1xuICBmb3IgKGxldCBjdXJzb3IgPSAwOyBjdXJzb3IgPCBzdHJpbmdzLmxlbmd0aDsgY3Vyc29yKyspIHtcbiAgICBsZXQgaWQgPSBcIiRcIiArIHN0cmluZ3NbY3Vyc29yXTtcbiAgICBpZiAobWFwLmhhc093blByb3BlcnR5KGlkKSkge1xuICAgICAgcmV0dXJuIHN0cmluZ3NbY3Vyc29yXTtcbiAgICB9XG4gICAgbWFwW2lkXSA9IHRydWU7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGhhc1N0cmljdE1vZGVSZXNlcnZlZFdvcmQoaWRzKSB7XG4gIHJldHVybiBpZHMuc29tZShpZCA9PiBTVFJJQ1RfTU9ERV9SRVNFUlZFRF9XT1JELmhhc093blByb3BlcnR5KGlkKSk7XG59XG5cbmV4cG9ydCBjbGFzcyBQYXJzZXIgZXh0ZW5kcyBUb2tlbml6ZXIge1xuICBjb25zdHJ1Y3Rvcihzb3VyY2UpIHtcbiAgICBzdXBlcihzb3VyY2UpO1xuICAgIHRoaXMubGFiZWxTZXQgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIHRoaXMuTEROID0gW107XG4gICAgdGhpcy5WRE4gPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIHRoaXMuYWxsb3dJbiA9IHRydWU7XG4gICAgdGhpcy5pbkl0ZXJhdGlvbiA9IGZhbHNlO1xuICAgIHRoaXMuaW5Td2l0Y2ggPSBmYWxzZTtcbiAgICB0aGlzLmluRnVuY3Rpb25Cb2R5ID0gZmFsc2U7XG4gICAgdGhpcy5pbk1ldGhvZCA9IGZhbHNlO1xuICAgIHRoaXMuaW5Db25zdHJ1Y3RvciA9IGZhbHNlO1xuICAgIHRoaXMuaGFzQ2xhc3NIZXJpdGFnZSA9IGZhbHNlO1xuICAgIHRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXIgPSBmYWxzZTtcbiAgICB0aGlzLmluUGFyYW1ldGVyID0gZmFsc2U7XG4gICAgdGhpcy5pbkdlbmVyYXRvckJvZHkgPSBmYWxzZTtcbiAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gZmFsc2U7XG4gICAgdGhpcy5hbGxvd0xhYmVsZWRGdW5jdGlvbiA9IHRydWU7XG4gICAgdGhpcy5tb2R1bGUgPSBmYWxzZTtcbiAgICB0aGlzLnN0cmljdCA9IGZhbHNlO1xuICAgIHRoaXMuYWxsb3dCaW5kaW5nUGF0dGVybiA9IGZhbHNlO1xuICB9XG5cbiAgZWF0KHRva2VuVHlwZSkge1xuICAgIGlmICh0aGlzLmxvb2thaGVhZC50eXBlID09PSB0b2tlblR5cGUpIHtcbiAgICAgIHJldHVybiB0aGlzLmxleCgpO1xuICAgIH1cbiAgfVxuXG4gIGV4cGVjdCh0b2tlblR5cGUpIHtcbiAgICBpZiAodGhpcy5sb29rYWhlYWQudHlwZSA9PT0gdG9rZW5UeXBlKSB7XG4gICAgICByZXR1cm4gdGhpcy5sZXgoKTtcbiAgICB9XG4gICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgfVxuXG4gIG1hdGNoQ29udGV4dHVhbEtleXdvcmQoa2V5d29yZCkge1xuICAgIHJldHVybiB0aGlzLmxvb2thaGVhZC50eXBlID09PSBUb2tlblR5cGUuSURFTlRJRklFUiAmJiB0aGlzLmxvb2thaGVhZC52YWx1ZSA9PT0ga2V5d29yZDtcbiAgfVxuXG4gIGV4cGVjdENvbnRleHR1YWxLZXl3b3JkKGtleXdvcmQpIHtcbiAgICBpZiAodGhpcy5tYXRjaENvbnRleHR1YWxLZXl3b3JkKGtleXdvcmQpKSB7XG4gICAgICByZXR1cm4gdGhpcy5sZXgoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICB9XG4gIH1cblxuICBlYXRDb250ZXh0dWFsS2V5d29yZChrZXl3b3JkKSB7XG4gICAgaWYgKHRoaXMubWF0Y2hDb250ZXh0dWFsS2V5d29yZChrZXl3b3JkKSkge1xuICAgICAgcmV0dXJuIHRoaXMubGV4KCk7XG4gICAgfVxuICB9XG5cbiAgbWF0Y2goc3ViVHlwZSkge1xuICAgIHJldHVybiB0aGlzLmxvb2thaGVhZC50eXBlID09PSBzdWJUeXBlO1xuICB9XG5cbiAgY29uc3VtZVNlbWljb2xvbigpIHtcbiAgICBpZiAodGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLlNFTUlDT0xPTikpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuZW9mKCkgJiYgIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJCUkFDRSkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgfVxuICB9XG5cbiAgLy8gdGhpcyBpcyBhIG5vLW9wLCByZXNlcnZlZCBmb3IgZnV0dXJlIHVzZVxuICBtYXJrTG9jYXRpb24obm9kZSwgc3RhcnRMb2NhdGlvbikge1xuICAgIHJldHVybiBub2RlO1xuICB9XG5cbiAgd3JhcFZETihmLCBwb3N0KSB7XG4gICAgbGV0IG9yaWdpbmFsVkROID0gdGhpcy5WRE47XG4gICAgdGhpcy5WRE4gPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIGxldCByZXN1bHQgPSBmLmNhbGwodGhpcyk7XG4gICAgaWYgKHBvc3QpIHBvc3QuY2FsbCh0aGlzKTtcblxuICAgIGZvciAobGV0IGtleSBpbiB0aGlzLlZETikge1xuICAgICAgb3JpZ2luYWxWRE5ba2V5XSA9IHRoaXMuVkROW2tleV07XG4gICAgfVxuICAgIHRoaXMuVkROID0gb3JpZ2luYWxWRE47XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGNoZWNrQmxvY2tTY29wZSgpIHtcbiAgICBsZXQgZHVwbGljYXRlID0gZmlyc3REdXBsaWNhdGUodGhpcy5MRE4pO1xuICAgIGlmIChkdXBsaWNhdGUgIT09IG51bGwpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5EVVBMSUNBVEVfQklORElORywgZHVwbGljYXRlKTtcbiAgICB9XG4gICAgdGhpcy5MRE4uZm9yRWFjaChuYW1lID0+IHtcbiAgICAgIGlmICh7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRoaXMuVkROLCBcIiRcIiArIG5hbWUpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5EVVBMSUNBVEVfQklORElORywgbmFtZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBwYXJzZU1vZHVsZSgpIHtcbiAgICB0aGlzLm1vZHVsZSA9IHRydWU7XG4gICAgdGhpcy5zdHJpY3QgPSB0cnVlO1xuXG4gICAgdGhpcy5sb29rYWhlYWQgPSB0aGlzLmFkdmFuY2UoKTtcbiAgICBsZXQgbG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IGV4cG9ydGVkTmFtZXMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIGxldCBleHBvcnRlZEJpbmRpbmdzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICBsZXQgaXRlbXMgPSBbXTtcbiAgICB3aGlsZSAoIXRoaXMuZW9mKCkpIHtcbiAgICAgIGl0ZW1zLnB1c2godGhpcy5wYXJzZU1vZHVsZUl0ZW0oZXhwb3J0ZWROYW1lcywgZXhwb3J0ZWRCaW5kaW5ncykpO1xuICAgIH1cbiAgICBmb3IgKGxldCBrZXkgaW4gZXhwb3J0ZWRCaW5kaW5ncykge1xuICAgICAgaWYgKCF7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRoaXMuVkROLCBrZXkpICYmIHRoaXMuTEROLmluZGV4T2Yoa2V5LnNsaWNlKDEpKSA9PT0gLTEpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLk1PRFVMRV9FWFBPUlRfVU5ERUZJTkVELCBrZXkuc2xpY2UoMSkpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmNoZWNrQmxvY2tTY29wZSgpO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuTW9kdWxlKGl0ZW1zKSwgbG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VTY3JpcHQoKSB7XG4gICAgdGhpcy5sb29rYWhlYWQgPSB0aGlzLmFkdmFuY2UoKTtcblxuICAgIGxldCBsb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgb3JpZ2luYWxMRE4gPSB0aGlzLkxETjtcbiAgICB0aGlzLkxETiA9IFtdO1xuXG4gICAgbGV0IFtib2R5XSA9IHRoaXMucGFyc2VCb2R5KCk7XG4gICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5FT1MpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuICAgIH1cbiAgICB0aGlzLmNoZWNrQmxvY2tTY29wZSgpO1xuICAgIHRoaXMuTEROID0gb3JpZ2luYWxMRE47XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5TY3JpcHQoYm9keSksIGxvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlRnVuY3Rpb25Cb2R5KGJvdW5kUGFyYW1zKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICBsZXQgb2xkVkROID0gdGhpcy5WRE47XG4gICAgdGhpcy5WRE4gPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4gICAgbGV0IG9yaWdpbmFsTEROID0gdGhpcy5MRE47XG4gICAgdGhpcy5MRE4gPSBbXTtcblxuICAgIGJvdW5kUGFyYW1zLmZvckVhY2gobmFtZSA9PiB0aGlzLlZETltcIiRcIiArIG5hbWVdID0gdHJ1ZSk7XG5cbiAgICBsZXQgb2xkTGFiZWxTZXQgPSB0aGlzLmxhYmVsU2V0O1xuICAgIGxldCBvbGRJbkl0ZXJhdGlvbiA9IHRoaXMuaW5JdGVyYXRpb247XG4gICAgbGV0IG9sZEluU3dpdGNoID0gdGhpcy5pblN3aXRjaDtcbiAgICBsZXQgb2xkSW5GdW5jdGlvbkJvZHkgPSB0aGlzLmluRnVuY3Rpb25Cb2R5O1xuICAgIGxldCBwcmV2aW91c1N0cmljdCA9IHRoaXMuc3RyaWN0O1xuICAgIGxldCBvbGRNb2R1bGUgPSB0aGlzLm1vZHVsZTtcblxuICAgIHRoaXMubGFiZWxTZXQgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIHRoaXMuaW5JdGVyYXRpb24gPSBmYWxzZTtcbiAgICB0aGlzLmluU3dpdGNoID0gZmFsc2U7XG4gICAgdGhpcy5pbkZ1bmN0aW9uQm9keSA9IHRydWU7XG4gICAgdGhpcy5tb2R1bGUgPSBmYWxzZTtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MQlJBQ0UpO1xuICAgIGxldCBbYm9keSwgaXNTdHJpY3RdID0gdGhpcy5wYXJzZUJvZHkoKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUkJSQUNFKTtcblxuICAgIHRoaXMuY2hlY2tCbG9ja1Njb3BlKCk7XG5cbiAgICB0aGlzLlZETiA9IG9sZFZETjtcbiAgICB0aGlzLkxETiA9IG9yaWdpbmFsTEROO1xuXG4gICAgYm9keSA9IHRoaXMubWFya0xvY2F0aW9uKGJvZHksIHN0YXJ0TG9jYXRpb24pO1xuXG4gICAgdGhpcy5sYWJlbFNldCA9IG9sZExhYmVsU2V0O1xuICAgIHRoaXMuaW5JdGVyYXRpb24gPSBvbGRJbkl0ZXJhdGlvbjtcbiAgICB0aGlzLmluU3dpdGNoID0gb2xkSW5Td2l0Y2g7XG4gICAgdGhpcy5pbkZ1bmN0aW9uQm9keSA9IG9sZEluRnVuY3Rpb25Cb2R5O1xuICAgIHRoaXMuc3RyaWN0ID0gcHJldmlvdXNTdHJpY3Q7XG4gICAgdGhpcy5tb2R1bGUgPSBvbGRNb2R1bGU7XG4gICAgcmV0dXJuIFtib2R5LCBpc1N0cmljdF07XG4gIH1cblxuICBwYXJzZUJvZHkoKSB7XG4gICAgbGV0IGxvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCBkaXJlY3RpdmVzID0gW107XG4gICAgbGV0IHN0YXRlbWVudHMgPSBbXTtcbiAgICBsZXQgcGFyc2luZ0RpcmVjdGl2ZXMgPSB0cnVlO1xuICAgIGxldCBpc1N0cmljdCA9IHRoaXMuc3RyaWN0O1xuICAgIGxldCBmaXJzdFJlc3RyaWN0ZWQgPSBudWxsO1xuICAgIHRoaXMud3JhcFZETigoKSA9PiB7XG4gICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICBpZiAodGhpcy5lb2YoKSB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0UpKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgICAgIGxldCB0ZXh0ID0gdG9rZW4uc2xpY2UudGV4dDtcbiAgICAgICAgbGV0IGlzU3RyaW5nTGl0ZXJhbCA9IHRva2VuLnR5cGUgPT09IFRva2VuVHlwZS5TVFJJTkc7XG4gICAgICAgIGxldCBkaXJlY3RpdmVMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICAgICAgbGV0IHN0bXQgPSB0aGlzLnBhcnNlU3RhdGVtZW50TGlzdEl0ZW0oe2lzVG9wTGV2ZWw6IHRydWV9KTtcbiAgICAgICAgaWYgKHBhcnNpbmdEaXJlY3RpdmVzKSB7XG4gICAgICAgICAgaWYgKGlzU3RyaW5nTGl0ZXJhbCAmJiBzdG10LnR5cGUgPT09IFwiRXhwcmVzc2lvblN0YXRlbWVudFwiICYmXG4gICAgICAgICAgICBzdG10LmV4cHJlc3Npb24udHlwZSA9PT0gXCJMaXRlcmFsU3RyaW5nRXhwcmVzc2lvblwiKSB7XG4gICAgICAgICAgICBpZiAodGV4dCA9PT0gXCJcXFwidXNlIHN0cmljdFxcXCJcIiB8fCB0ZXh0ID09PSBcIid1c2Ugc3RyaWN0J1wiKSB7XG4gICAgICAgICAgICAgIGlzU3RyaWN0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgdGhpcy5zdHJpY3QgPSB0cnVlO1xuICAgICAgICAgICAgICBpZiAoZmlyc3RSZXN0cmljdGVkICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKGZpcnN0UmVzdHJpY3RlZCwgRXJyb3JNZXNzYWdlcy5TVFJJQ1RfT0NUQUxfTElURVJBTCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmlyc3RSZXN0cmljdGVkID09IG51bGwgJiYgdG9rZW4ub2N0YWwpIHtcbiAgICAgICAgICAgICAgZmlyc3RSZXN0cmljdGVkID0gdG9rZW47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkaXJlY3RpdmVzLnB1c2godGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkRpcmVjdGl2ZSh0ZXh0LnNsaWNlKDEsIC0xKSksIGRpcmVjdGl2ZUxvY2F0aW9uKSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBhcnNpbmdEaXJlY3RpdmVzID0gZmFsc2U7XG4gICAgICAgICAgICBzdGF0ZW1lbnRzLnB1c2goc3RtdCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0YXRlbWVudHMucHVzaChzdG10KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sICgpID0+IHtcblxuICAgIH0pO1xuICAgIHJldHVybiBbdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkZ1bmN0aW9uQm9keShkaXJlY3RpdmVzLCBzdGF0ZW1lbnRzKSwgbG9jYXRpb24pLCBpc1N0cmljdF07XG4gIH1cblxuICBwYXJzZUltcG9ydFNwZWNpZmllcihib3VuZE5hbWVzKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCksIGlkZW50aWZpZXI7XG4gICAgaWYgKHRoaXMubG9va2FoZWFkLnR5cGUgPT09IFRva2VuVHlwZS5JREVOVElGSUVSKSB7XG4gICAgICBpZGVudGlmaWVyID0gdGhpcy5wYXJzZUlkZW50aWZpZXIoKTtcbiAgICAgIGlmICghdGhpcy5lYXRDb250ZXh0dWFsS2V5d29yZChcImFzXCIpKSB7XG4gICAgICAgIGlmICh7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGJvdW5kTmFtZXMsIFwiJFwiICsgaWRlbnRpZmllcikpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHN0YXJ0TG9jYXRpb24sIEVycm9yTWVzc2FnZXMuSU1QT1JUX0RVUEUpO1xuICAgICAgICB9XG4gICAgICAgIGJvdW5kTmFtZXNbXCIkXCIgKyBpZGVudGlmaWVyXSA9IHRydWU7XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihcbiAgICAgICAgICBuZXcgU2hpZnQuSW1wb3J0U3BlY2lmaWVyKFxuICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgIHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJCaW5kaW5nSWRlbnRpZmllclwiLCBuYW1lOiBpZGVudGlmaWVyIH0sIHN0YXJ0TG9jYXRpb24pKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0aGlzLmxvb2thaGVhZC50eXBlLmtsYXNzLmlzSWRlbnRpZmllck5hbWUpIHtcbiAgICAgIGlkZW50aWZpZXIgPSB0aGlzLnBhcnNlSWRlbnRpZmllck5hbWUoKTtcbiAgICAgIHRoaXMuZXhwZWN0Q29udGV4dHVhbEtleXdvcmQoXCJhc1wiKTtcbiAgICB9XG5cbiAgICBsZXQgbG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IGJvdW5kTmFtZSA9IHRoaXMucGFyc2VJZGVudGlmaWVyKCk7XG4gICAgaWYgKHt9Lmhhc093blByb3BlcnR5LmNhbGwoYm91bmROYW1lcywgXCIkXCIgKyBib3VuZE5hbWUpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKGxvY2F0aW9uLCBFcnJvck1lc3NhZ2VzLklNUE9SVF9EVVBFKTtcbiAgICB9XG4gICAgYm91bmROYW1lc1tcIiRcIiArIGJvdW5kTmFtZV0gPSB0cnVlO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihcbiAgICAgIG5ldyBTaGlmdC5JbXBvcnRTcGVjaWZpZXIoXG4gICAgICAgIGlkZW50aWZpZXIsXG4gICAgICAgIHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJCaW5kaW5nSWRlbnRpZmllclwiLCBuYW1lOiBib3VuZE5hbWUgfSwgbG9jYXRpb24pKSxcbiAgICAgIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VOYW1lU3BhY2VCaW5kaW5nKGJvdW5kTmFtZXMpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTVVMKTtcbiAgICB0aGlzLmV4cGVjdENvbnRleHR1YWxLZXl3b3JkKFwiYXNcIik7XG4gICAgbGV0IGlkZW50aWZpZXJMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgaWRlbnRpZmllciA9IHRoaXMucGFyc2VJZGVudGlmaWVyKCk7XG4gICAgaWYgKHt9Lmhhc093blByb3BlcnR5LmNhbGwoYm91bmROYW1lcywgXCIkXCIgKyBpZGVudGlmaWVyKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbihpZGVudGlmaWVyTG9jYXRpb24sIEVycm9yTWVzc2FnZXMuSU1QT1JUX0RVUEUpO1xuICAgIH1cbiAgICBib3VuZE5hbWVzW1wiJFwiICsgaWRlbnRpZmllcl0gPSB0cnVlO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiQmluZGluZ0lkZW50aWZpZXJcIiwgbmFtZTogaWRlbnRpZmllciB9LCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlTmFtZWRJbXBvcnRzKGJvdW5kTmFtZXMpIHtcbiAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxCUkFDRSk7XG4gICAgd2hpbGUgKCF0aGlzLmVhdChUb2tlblR5cGUuUkJSQUNFKSkge1xuICAgICAgcmVzdWx0LnB1c2godGhpcy5wYXJzZUltcG9ydFNwZWNpZmllcihib3VuZE5hbWVzKSk7XG4gICAgICBpZiAoIXRoaXMuZWF0KFRva2VuVHlwZS5DT01NQSkpIHtcbiAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJCUkFDRSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgcGFyc2VGcm9tQ2xhdXNlKCkge1xuICAgIHRoaXMuZXhwZWN0Q29udGV4dHVhbEtleXdvcmQoXCJmcm9tXCIpO1xuICAgIGxldCB2YWx1ZSA9IHRoaXMuZXhwZWN0KFRva2VuVHlwZS5TVFJJTkcpLl92YWx1ZTtcbiAgICB0aGlzLmNvbnN1bWVTZW1pY29sb24oKTtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICBwYXJzZUltcG9ydERlY2xhcmF0aW9uKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpLCBkZWZhdWx0QmluZGluZyA9IG51bGwsIG1vZHVsZVNwZWNpZmllciwgYm91bmROYW1lcyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLklNUE9SVCk7XG4gICAgc3dpdGNoICh0aGlzLmxvb2thaGVhZC50eXBlKSB7XG4gICAgICBjYXNlIFRva2VuVHlwZS5TVFJJTkc6XG4gICAgICAgIG1vZHVsZVNwZWNpZmllciA9IHRoaXMubGV4KCkuX3ZhbHVlO1xuICAgICAgICB0aGlzLmNvbnN1bWVTZW1pY29sb24oKTtcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5JbXBvcnQobnVsbCwgW10sIG1vZHVsZVNwZWNpZmllciksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgY2FzZSBUb2tlblR5cGUuSURFTlRJRklFUjpcbiAgICAgICAgZGVmYXVsdEJpbmRpbmcgPSB0aGlzLmV4cGVjdChUb2tlblR5cGUuSURFTlRJRklFUikudmFsdWU7XG4gICAgICAgIGJvdW5kTmFtZXNbXCIkXCIgKyBkZWZhdWx0QmluZGluZ10gPSB0cnVlO1xuICAgICAgICBpZiAoIXRoaXMuZWF0KFRva2VuVHlwZS5DT01NQSkpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkltcG9ydChkZWZhdWx0QmluZGluZywgW10sIHRoaXMucGFyc2VGcm9tQ2xhdXNlKCkpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICB9XG4gICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLk1VTCkpIHtcbiAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuSW1wb3J0TmFtZXNwYWNlKGRlZmF1bHRCaW5kaW5nLCB0aGlzLnBhcnNlTmFtZVNwYWNlQmluZGluZyhib3VuZE5hbWVzKSwgdGhpcy5wYXJzZUZyb21DbGF1c2UoKSksIHN0YXJ0TG9jYXRpb24pO1xuICAgIH0gZWxzZSBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuTEJSQUNFKSkge1xuICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5JbXBvcnQoZGVmYXVsdEJpbmRpbmcsIHRoaXMucGFyc2VOYW1lZEltcG9ydHMoYm91bmROYW1lcyksIHRoaXMucGFyc2VGcm9tQ2xhdXNlKCkpLCBzdGFydExvY2F0aW9uKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICB9XG4gIH1cblxuICBwYXJzZUV4cG9ydFNwZWNpZmllcihleHBvcnRlZE5hbWVzLCBleHBvcnRlZEJpbmRpbmdzKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IG5hbWUgPSB0aGlzLnBhcnNlSWRlbnRpZmllcigpO1xuICAgIGV4cG9ydGVkQmluZGluZ3NbXCIkXCIgKyBuYW1lXSA9IHRydWU7XG4gICAgaWYgKHRoaXMuZWF0Q29udGV4dHVhbEtleXdvcmQoXCJhc1wiKSkge1xuICAgICAgbGV0IGV4cG9ydGVkTmFtZSA9IHRoaXMucGFyc2VJZGVudGlmaWVyTmFtZSgpO1xuICAgICAgaWYgKHt9Lmhhc093blByb3BlcnR5LmNhbGwoZXhwb3J0ZWROYW1lcywgXCIkXCIgKyBleHBvcnRlZE5hbWUpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5EVVBMSUNBVEVfRVhQT1JURURfTkFNRSwgZXhwb3J0ZWROYW1lKTtcbiAgICAgIH1cbiAgICAgIGV4cG9ydGVkTmFtZXNbXCIkXCIgKyBleHBvcnRlZE5hbWVdID0gdHJ1ZTtcbiAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuRXhwb3J0U3BlY2lmaWVyKG5hbWUsIGV4cG9ydGVkTmFtZSksIHN0YXJ0TG9jYXRpb24pO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoe30uaGFzT3duUHJvcGVydHkuY2FsbChleHBvcnRlZE5hbWVzLCBcIiRcIiArIG5hbWUpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5EVVBMSUNBVEVfRVhQT1JURURfTkFNRSwgbmFtZSk7XG4gICAgICB9XG4gICAgICBleHBvcnRlZE5hbWVzW1wiJFwiICsgbmFtZV0gPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkV4cG9ydFNwZWNpZmllcihudWxsLCBuYW1lKSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZUV4cG9ydENsYXVzZShleHBvcnRlZE5hbWVzLCBleHBvcnRlZEJpbmRpbmdzKSB7XG4gICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MQlJBQ0UpO1xuICAgIHdoaWxlICghdGhpcy5lYXQoVG9rZW5UeXBlLlJCUkFDRSkpIHtcbiAgICAgIHJlc3VsdC5wdXNoKHRoaXMucGFyc2VFeHBvcnRTcGVjaWZpZXIoZXhwb3J0ZWROYW1lcywgZXhwb3J0ZWRCaW5kaW5ncykpO1xuICAgICAgaWYgKCF0aGlzLmVhdChUb2tlblR5cGUuQ09NTUEpKSB7XG4gICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SQlJBQ0UpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHBhcnNlRXhwb3J0RGVjbGFyYXRpb24oZXhwb3J0ZWROYW1lcywgZXhwb3J0ZWRCaW5kaW5ncykge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpLCBkZWNsO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5FWFBPUlQpO1xuICAgIGxldCBpc1ZhciA9IGZhbHNlLCBrZXksIG9sZExETiA9IHRoaXMuTEROLCBvbGRWRE4gPSB0aGlzLlZETjtcbiAgICB0aGlzLkxETiA9IFtdO1xuICAgIHRoaXMuVkROID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICBzd2l0Y2ggKHRoaXMubG9va2FoZWFkLnR5cGUpIHtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk1VTDpcbiAgICAgICAgdGhpcy5sZXgoKTtcbiAgICAgICAgLy8gZXhwb3J0ICogRnJvbUNsYXVzZSA7XG4gICAgICAgIGRlY2wgPSBuZXcgU2hpZnQuRXhwb3J0QWxsRnJvbSh0aGlzLnBhcnNlRnJvbUNsYXVzZSgpKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFRva2VuVHlwZS5MQlJBQ0U6XG4gICAgICAgIC8vIGV4cG9ydCBFeHBvcnRDbGF1c2UgRnJvbUNsYXVzZSA7XG4gICAgICAgIC8vIGV4cG9ydCBFeHBvcnRDbGF1c2UgO1xuICAgICAgICBsZXQgbmFtZWRFeHBvcnRzID0gdGhpcy5wYXJzZUV4cG9ydENsYXVzZShleHBvcnRlZE5hbWVzLCBleHBvcnRlZEJpbmRpbmdzKTtcbiAgICAgICAgbGV0IGZyb21DbGF1c2UgPSBudWxsO1xuICAgICAgICBpZiAodGhpcy5tYXRjaENvbnRleHR1YWxLZXl3b3JkKFwiZnJvbVwiKSkge1xuICAgICAgICAgIGZyb21DbGF1c2UgPSB0aGlzLnBhcnNlRnJvbUNsYXVzZSgpO1xuICAgICAgICB9XG4gICAgICAgIGRlY2wgPSBuZXcgU2hpZnQuRXhwb3J0RnJvbShuYW1lZEV4cG9ydHMsIGZyb21DbGF1c2UpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkNMQVNTOlxuICAgICAgICAvLyBleHBvcnQgQ2xhc3NEZWNsYXJhdGlvblxuICAgICAgICBkZWNsID0gbmV3IFNoaWZ0LkV4cG9ydCh0aGlzLnBhcnNlQ2xhc3Moe2lzRXhwcjogZmFsc2V9KSk7XG4gICAgICAgIGlmICh7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGV4cG9ydGVkTmFtZXMsIFwiJFwiICsgZGVjbC5kZWNsYXJhdGlvbi5uYW1lLm5hbWUpKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLkRVUExJQ0FURV9FWFBPUlRFRF9OQU1FLCBkZWNsLmRlY2xhcmF0aW9uLm5hbWUubmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAga2V5ID0gZGVjbC5kZWNsYXJhdGlvbi5uYW1lLm5hbWU7XG4gICAgICAgIGV4cG9ydGVkTmFtZXNbXCIkXCIgKyBrZXldID0gdHJ1ZTtcbiAgICAgICAgZXhwb3J0ZWRCaW5kaW5nc1tcIiRcIiArIGtleV0gPSB0cnVlO1xuICAgICAgICBvbGRMRE4ucHVzaChrZXkpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkZVTkNUSU9OOlxuICAgICAgICAvLyBleHBvcnQgSG9pc3RhYmxlRGVjbGFyYXRpb25cbiAgICAgICAgZGVjbCA9IG5ldyBTaGlmdC5FeHBvcnQodGhpcy5wYXJzZUZ1bmN0aW9uKHtpc0V4cHI6IGZhbHNlLCBpc1RvcExldmVsOiB0cnVlfSkpO1xuICAgICAgICBpZiAoe30uaGFzT3duUHJvcGVydHkuY2FsbChleHBvcnRlZE5hbWVzLCBcIiRcIiArIGRlY2wuZGVjbGFyYXRpb24ubmFtZS5uYW1lKSkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5EVVBMSUNBVEVfRVhQT1JURURfTkFNRSwgZGVjbC5kZWNsYXJhdGlvbi5uYW1lLm5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIGtleSA9IGRlY2wuZGVjbGFyYXRpb24ubmFtZS5uYW1lO1xuICAgICAgICBleHBvcnRlZE5hbWVzW1wiJFwiICsga2V5XSA9IHRydWU7XG4gICAgICAgIGV4cG9ydGVkQmluZGluZ3NbXCIkXCIgKyBrZXldID0gdHJ1ZTtcbiAgICAgICAgb2xkTEROLnB1c2goa2V5KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFRva2VuVHlwZS5ERUZBVUxUOlxuICAgICAgICBpZiAoe30uaGFzT3duUHJvcGVydHkuY2FsbChleHBvcnRlZE5hbWVzLCBcIiRkZWZhdWx0XCIpKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLkRVUExJQ0FURV9FWFBPUlRFRF9OQU1FLCBcImRlZmF1bHRcIik7XG4gICAgICAgIH1cbiAgICAgICAgZXhwb3J0ZWROYW1lcy4kZGVmYXVsdCA9IHRydWU7XG4gICAgICAgIHRoaXMubGV4KCk7XG4gICAgICAgIHN3aXRjaCAodGhpcy5sb29rYWhlYWQudHlwZSkge1xuICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLkZVTkNUSU9OOlxuICAgICAgICAgICAgLy8gZXhwb3J0IGRlZmF1bHQgSG9pc3RhYmxlRGVjbGFyYXRpb25bRGVmYXVsdF1cbiAgICAgICAgICAgIGRlY2wgPSBuZXcgU2hpZnQuRXhwb3J0RGVmYXVsdCh0aGlzLnBhcnNlRnVuY3Rpb24oe2lzRXhwcjogZmFsc2UsIGluRGVmYXVsdDogdHJ1ZSwgaXNUb3BMZXZlbDogdHJ1ZX0pKTtcbiAgICAgICAgICAgIGtleSA9IGRlY2wuYm9keS5uYW1lLm5hbWU7XG4gICAgICAgICAgICBpZiAoa2V5ICE9PSBcIipkZWZhdWx0KlwiKSB7XG4gICAgICAgICAgICAgIGV4cG9ydGVkQmluZGluZ3NbXCIkXCIgKyBrZXldID0gdHJ1ZTtcbiAgICAgICAgICAgICAgb2xkTEROLnB1c2goa2V5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLkNMQVNTOlxuICAgICAgICAgICAgLy8gZXhwb3J0IGRlZmF1bHQgQ2xhc3NEZWNsYXJhdGlvbltEZWZhdWx0XVxuICAgICAgICAgICAgZGVjbCA9IG5ldyBTaGlmdC5FeHBvcnREZWZhdWx0KHRoaXMucGFyc2VDbGFzcyh7aXNFeHByOiBmYWxzZSwgaW5EZWZhdWx0OiB0cnVlfSkpO1xuICAgICAgICAgICAga2V5ID0gZGVjbC5ib2R5Lm5hbWUubmFtZTtcbiAgICAgICAgICAgIGlmIChrZXkgIT09IFwiKmRlZmF1bHQqXCIpIHtcbiAgICAgICAgICAgICAgZXhwb3J0ZWRCaW5kaW5nc1tcIiRcIiArIGtleV0gPSB0cnVlO1xuICAgICAgICAgICAgICBvbGRMRE4ucHVzaChrZXkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB7XG4gICAgICAgICAgICAvLyBleHBvcnQgZGVmYXVsdCBbbG9va2FoZWFkIOKIiSB7ZnVuY3Rpb24sIGNsYXNzfV0gQXNzaWdubWVudEV4cHJlc3Npb25bSW5dIDtcbiAgICAgICAgICAgIGRlY2wgPSBuZXcgU2hpZnQuRXhwb3J0RGVmYXVsdCh0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFRva2VuVHlwZS5WQVI6XG4gICAgICAgIGlzVmFyID0gdHJ1ZTtcbiAgICAgICAgLy8gZmFsbHMgdGhyb3VnaFxuICAgICAgY2FzZSBUb2tlblR5cGUuTEVUOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQ09OU1Q6XG4gICAgICAgIC8vIGV4cG9ydCBMZXhpY2FsRGVjbGFyYXRpb25cbiAgICAgIHtcbiAgICAgICAgbGV0IGJvdW5kTmFtZXMgPSBbXTtcbiAgICAgICAgZGVjbCA9IG5ldyBTaGlmdC5FeHBvcnQodGhpcy5wYXJzZVZhcmlhYmxlRGVjbGFyYXRpb24oe2JvdW5kTmFtZXN9KSk7XG4gICAgICAgIGJvdW5kTmFtZXMuZm9yRWFjaChuYW1lID0+IHtcbiAgICAgICAgICAgIGlmICh7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGV4cG9ydGVkTmFtZXMsIFwiJFwiICsgbmFtZSkpIHtcbiAgICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLkRVUExJQ0FURV9FWFBPUlRFRF9OQU1FLCBuYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGV4cG9ydGVkTmFtZXNbXCIkXCIgKyBuYW1lXSA9IHRydWU7XG4gICAgICAgICAgICBleHBvcnRlZEJpbmRpbmdzW1wiJFwiICsgbmFtZV0gPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgICAgaWYgKGlzVmFyKSB7XG4gICAgICAgICAgYm91bmROYW1lcy5mb3JFYWNoKG5hbWUgPT4gb2xkVkROW1wiJFwiICsgbmFtZV0gPSB0cnVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBbXS5wdXNoLmFwcGx5KG9sZExETiwgYm91bmROYW1lcyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jb25zdW1lU2VtaWNvbG9uKCk7XG4gICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICB9XG4gICAgdGhpcy5MRE4gPSBvbGRMRE47XG4gICAgdGhpcy5WRE4gPSBvbGRWRE47XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKGRlY2wsIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VNb2R1bGVJdGVtKGV4cG9ydGVkTmFtZXMsIGV4cG9ydGVkQmluZGluZ3MpIHtcbiAgICBzd2l0Y2ggKHRoaXMubG9va2FoZWFkLnR5cGUpIHtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLklNUE9SVDpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VJbXBvcnREZWNsYXJhdGlvbigpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuRVhQT1JUOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZUV4cG9ydERlY2xhcmF0aW9uKGV4cG9ydGVkTmFtZXMsIGV4cG9ydGVkQmluZGluZ3MpO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VTdGF0ZW1lbnRMaXN0SXRlbSgpO1xuICAgIH1cbiAgfVxuXG4gIGxvb2thaGVhZExleGljYWxEZWNsYXJhdGlvbigpIHtcbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuTEVUKSB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5DT05TVCkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuSURFTlRJRklFUikgJiYgdGhpcy5sb29rYWhlYWQudmFsdWUgPT09IFwibGV0XCIpIHtcbiAgICAgIGxldCBsZXhlclN0YXRlID0gdGhpcy5zYXZlTGV4ZXJTdGF0ZSgpO1xuICAgICAgdGhpcy5sZXgoKTtcbiAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5ZSUVMRCkgfHwgdGhpcy5tYXRjaChUb2tlblR5cGUuSURFTlRJRklFUikgfHxcbiAgICAgICAgdGhpcy5tYXRjaChUb2tlblR5cGUuTEJSQUNFKSB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5MQlJBQ0spKSB7XG4gICAgICAgIHRoaXMucmVzdG9yZUxleGVyU3RhdGUobGV4ZXJTdGF0ZSk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5yZXN0b3JlTGV4ZXJTdGF0ZShsZXhlclN0YXRlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcGFyc2VTdGF0ZW1lbnRMaXN0SXRlbSh7aXNUb3BMZXZlbCA9IGZhbHNlfSA9IHt9KSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgaWYgKHRoaXMuZW9mKCkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgfVxuXG4gICAgbGV0IGRlY2wgPSB0aGlzLndyYXBWRE4oKCkgPT4ge1xuICAgICAgc3dpdGNoICh0aGlzLmxvb2thaGVhZC50eXBlKSB7XG4gICAgICAgIGNhc2UgVG9rZW5UeXBlLkZVTkNUSU9OOlxuICAgICAgICAgIHJldHVybiB0aGlzLnBhcnNlRnVuY3Rpb24oe2lzRXhwcjogZmFsc2UsIGlzVG9wTGV2ZWx9KTtcbiAgICAgICAgY2FzZSBUb2tlblR5cGUuQ0xBU1M6XG4gICAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VDbGFzcyh7aXNFeHByOiBmYWxzZX0pO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGlmICh0aGlzLmxvb2thaGVhZExleGljYWxEZWNsYXJhdGlvbigpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJzZVZhcmlhYmxlRGVjbGFyYXRpb25TdGF0ZW1lbnQoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VTdGF0ZW1lbnQoe2FsbG93TGFiZWxlZEZ1bmN0aW9uOiB0cnVlLCBpc1RvcExldmVsfSk7XG4gICAgICB9XG4gICAgfSwgdGhpcy5jaGVja0Jsb2NrU2NvcGUpO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihkZWNsLCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlU3RhdGVtZW50KHthbGxvd0xhYmVsZWRGdW5jdGlvbiA9IGZhbHNlLCBpc1RvcExldmVsID0gZmFsc2V9ID0ge30pIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgb3JpZ2luYWxMRE4gPSB0aGlzLkxETjtcbiAgICB0aGlzLkxETiA9IFtdO1xuICAgIHZhciBzdG10ID0gdGhpcy53cmFwVkROKCgpID0+IHRoaXMucGFyc2VTdGF0ZW1lbnRIZWxwZXIoYWxsb3dMYWJlbGVkRnVuY3Rpb24sIG9yaWdpbmFsTEROLCBpc1RvcExldmVsKSk7XG4gICAgdGhpcy5MRE4gPSBvcmlnaW5hbExETjtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24oc3RtdCwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZVN0YXRlbWVudEhlbHBlcihhbGxvd0xhYmVsZWRGdW5jdGlvbiwgb3JpZ2luYWxMRE4sIGlzVG9wTGV2ZWwpIHtcbiAgICBpZiAodGhpcy5lb2YoKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICB9XG5cbiAgICBzd2l0Y2ggKHRoaXMubG9va2FoZWFkLnR5cGUpIHtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlNFTUlDT0xPTjpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VFbXB0eVN0YXRlbWVudCgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuTEJSQUNFOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZUJsb2NrU3RhdGVtZW50KCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5MUEFSRU46XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlRXhwcmVzc2lvblN0YXRlbWVudCgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuQlJFQUs6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlQnJlYWtTdGF0ZW1lbnQoKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkNPTlRJTlVFOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZUNvbnRpbnVlU3RhdGVtZW50KCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5ERUJVR0dFUjpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VEZWJ1Z2dlclN0YXRlbWVudCgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuRE86XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlRG9XaGlsZVN0YXRlbWVudCgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuRk9SOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZUZvclN0YXRlbWVudCgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuSUY6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlSWZTdGF0ZW1lbnQoKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlJFVFVSTjpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VSZXR1cm5TdGF0ZW1lbnQoKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlNXSVRDSDpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VTd2l0Y2hTdGF0ZW1lbnQoKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlRIUk9XOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZVRocm93U3RhdGVtZW50KCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5UUlk6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlVHJ5U3RhdGVtZW50KCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5WQVI6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlVmFyaWFibGVEZWNsYXJhdGlvblN0YXRlbWVudCgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuV0hJTEU6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlV2hpbGVTdGF0ZW1lbnQoKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLldJVEg6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlV2l0aFN0YXRlbWVudCgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuRlVOQ1RJT046XG4gICAgICBjYXNlIFRva2VuVHlwZS5DTEFTUzpcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcblxuICAgICAgZGVmYXVsdDoge1xuICAgICAgICBpZiAodGhpcy5sb29rYWhlYWRMZXhpY2FsRGVjbGFyYXRpb24oKSkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGV4cHIgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgICAvLyAxMi4xMiBMYWJlbGxlZCBTdGF0ZW1lbnRzO1xuICAgICAgICBpZiAoZXhwci50eXBlID09PSBcIklkZW50aWZpZXJFeHByZXNzaW9uXCIgJiYgdGhpcy5lYXQoVG9rZW5UeXBlLkNPTE9OKSkge1xuICAgICAgICAgIGxldCBrZXkgPSBcIiRcIiArIGV4cHIubmFtZTtcbiAgICAgICAgICBpZiAoe30uaGFzT3duUHJvcGVydHkuY2FsbCh0aGlzLmxhYmVsU2V0LCBrZXkpKSB7XG4gICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuTEFCRUxfUkVERUNMQVJBVElPTiwgZXhwci5uYW1lKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5MRE4gPSBvcmlnaW5hbExETjtcbiAgICAgICAgICB0aGlzLmxhYmVsU2V0W2tleV0gPSB0cnVlO1xuICAgICAgICAgIGxldCBsYWJlbGVkQm9keTtcbiAgICAgICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuRlVOQ1RJT04pKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5zdHJpY3QgfHwgIWFsbG93TGFiZWxlZEZ1bmN0aW9uKSB7XG4gICAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsYWJlbGVkQm9keSA9IHRoaXMucGFyc2VGdW5jdGlvbih7aXNFeHByOiBmYWxzZSwgYWxsb3dHZW5lcmF0b3I6IGZhbHNlLCBpc1RvcExldmVsfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxhYmVsZWRCb2R5ID0gdGhpcy5wYXJzZVN0YXRlbWVudCh7YWxsb3dMYWJlbGVkRnVuY3Rpb24sIGlzVG9wTGV2ZWx9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZGVsZXRlIHRoaXMubGFiZWxTZXRba2V5XTtcbiAgICAgICAgICByZXR1cm4gbmV3IFNoaWZ0LkxhYmVsZWRTdGF0ZW1lbnQoZXhwci5uYW1lLCBsYWJlbGVkQm9keSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5jb25zdW1lU2VtaWNvbG9uKCk7XG4gICAgICAgICAgcmV0dXJuIG5ldyBTaGlmdC5FeHByZXNzaW9uU3RhdGVtZW50KGV4cHIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcGFyc2VFbXB0eVN0YXRlbWVudCgpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuU0VNSUNPTE9OKTtcbiAgICByZXR1cm4gbmV3IFNoaWZ0LkVtcHR5U3RhdGVtZW50O1xuICB9XG5cbiAgcGFyc2VCbG9ja1N0YXRlbWVudCgpIHtcbiAgICBsZXQgc3RtdCA9IG5ldyBTaGlmdC5CbG9ja1N0YXRlbWVudCh0aGlzLnBhcnNlQmxvY2soKSk7XG4gICAgdGhpcy5jaGVja0Jsb2NrU2NvcGUoKTtcbiAgICByZXR1cm4gc3RtdDtcbiAgfVxuXG4gIHBhcnNlRXhwcmVzc2lvblN0YXRlbWVudCgpIHtcbiAgICBsZXQgZXhwciA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgdGhpcy5jb25zdW1lU2VtaWNvbG9uKCk7XG4gICAgcmV0dXJuIG5ldyBTaGlmdC5FeHByZXNzaW9uU3RhdGVtZW50KGV4cHIpO1xuICB9XG5cbiAgcGFyc2VCcmVha1N0YXRlbWVudCgpIHtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuQlJFQUspO1xuXG4gICAgLy8gQ2F0Y2ggdGhlIHZlcnkgY29tbW9uIGNhc2UgZmlyc3Q6IGltbWVkaWF0ZWx5IGEgc2VtaWNvbG9uIChVKzAwM0IpLlxuICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuU0VNSUNPTE9OKSkge1xuICAgICAgaWYgKCEodGhpcy5pbkl0ZXJhdGlvbiB8fCB0aGlzLmluU3dpdGNoKSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLklMTEVHQUxfQlJFQUspO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbmV3IFNoaWZ0LkJyZWFrU3RhdGVtZW50KG51bGwpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCkge1xuICAgICAgaWYgKCEodGhpcy5pbkl0ZXJhdGlvbiB8fCB0aGlzLmluU3dpdGNoKSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLklMTEVHQUxfQlJFQUspO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbmV3IFNoaWZ0LkJyZWFrU3RhdGVtZW50KG51bGwpO1xuICAgIH1cblxuICAgIGxldCBsYWJlbCA9IG51bGw7XG4gICAgaWYgKHRoaXMubG9va2FoZWFkLnR5cGUgPT09IFRva2VuVHlwZS5JREVOVElGSUVSKSB7XG4gICAgICBsYWJlbCA9IHRoaXMucGFyc2VJZGVudGlmaWVyKCk7XG5cbiAgICAgIGxldCBrZXkgPSBcIiRcIiArIGxhYmVsO1xuICAgICAgaWYgKCF7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRoaXMubGFiZWxTZXQsIGtleSkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlVOS05PV05fTEFCRUwsIGxhYmVsKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmNvbnN1bWVTZW1pY29sb24oKTtcblxuICAgIGlmIChsYWJlbCA9PSBudWxsICYmICEodGhpcy5pbkl0ZXJhdGlvbiB8fCB0aGlzLmluU3dpdGNoKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5JTExFR0FMX0JSRUFLKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFNoaWZ0LkJyZWFrU3RhdGVtZW50KGxhYmVsKTtcbiAgfVxuXG4gIHBhcnNlQ29udGludWVTdGF0ZW1lbnQoKSB7XG4gICAgbGV0IHRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNPTlRJTlVFKTtcblxuICAgIC8vIENhdGNoIHRoZSB2ZXJ5IGNvbW1vbiBjYXNlIGZpcnN0OiBpbW1lZGlhdGVseSBhIHNlbWljb2xvbiAoVSswMDNCKS5cbiAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLlNFTUlDT0xPTikpIHtcbiAgICAgIGlmICghdGhpcy5pbkl0ZXJhdGlvbikge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLklMTEVHQUxfQ09OVElOVUUpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbmV3IFNoaWZ0LkNvbnRpbnVlU3RhdGVtZW50KG51bGwpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCkge1xuICAgICAgaWYgKCF0aGlzLmluSXRlcmF0aW9uKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuSUxMRUdBTF9DT05USU5VRSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuZXcgU2hpZnQuQ29udGludWVTdGF0ZW1lbnQobnVsbCk7XG4gICAgfVxuXG4gICAgbGV0IGxhYmVsID0gbnVsbDtcbiAgICBpZiAodGhpcy5sb29rYWhlYWQudHlwZSA9PT0gVG9rZW5UeXBlLklERU5USUZJRVIpIHtcbiAgICAgIGxhYmVsID0gdGhpcy5wYXJzZUlkZW50aWZpZXIoKTtcblxuICAgICAgbGV0IGtleSA9IFwiJFwiICsgbGFiZWw7XG4gICAgICBpZiAoIXt9Lmhhc093blByb3BlcnR5LmNhbGwodGhpcy5sYWJlbFNldCwga2V5KSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5LTk9XTl9MQUJFTCwgbGFiZWwpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuY29uc3VtZVNlbWljb2xvbigpO1xuICAgIGlmICghdGhpcy5pbkl0ZXJhdGlvbikge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5JTExFR0FMX0NPTlRJTlVFKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFNoaWZ0LkNvbnRpbnVlU3RhdGVtZW50KGxhYmVsKTtcbiAgfVxuXG5cbiAgcGFyc2VEZWJ1Z2dlclN0YXRlbWVudCgpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuREVCVUdHRVIpO1xuICAgIHRoaXMuY29uc3VtZVNlbWljb2xvbigpO1xuICAgIHJldHVybiBuZXcgU2hpZnQuRGVidWdnZXJTdGF0ZW1lbnQ7XG4gIH1cblxuICBwYXJzZURvV2hpbGVTdGF0ZW1lbnQoKSB7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkRPKTtcbiAgICBsZXQgb2xkSW5JdGVyYXRpb24gPSB0aGlzLmluSXRlcmF0aW9uO1xuICAgIHRoaXMuaW5JdGVyYXRpb24gPSB0cnVlO1xuICAgIGxldCBib2R5ID0gdGhpcy5wYXJzZVN0YXRlbWVudCgpO1xuICAgIHRoaXMuaW5JdGVyYXRpb24gPSBvbGRJbkl0ZXJhdGlvbjtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5XSElMRSk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgbGV0IHRlc3QgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgIHRoaXMuZWF0KFRva2VuVHlwZS5TRU1JQ09MT04pO1xuXG4gICAgcmV0dXJuIG5ldyBTaGlmdC5Eb1doaWxlU3RhdGVtZW50KGJvZHksIHRlc3QpO1xuICB9XG5cbiAgc3RhdGljIHRyYW5zZm9ybURlc3RydWN0dXJpbmcobm9kZSkge1xuICAgIHN3aXRjaCAobm9kZS50eXBlKSB7XG4gICAgICBjYXNlIFwiT2JqZWN0RXhwcmVzc2lvblwiOlxuICAgICAgICByZXR1cm4gY29weUxvY2F0aW9uKG5vZGUsIG5ldyBTaGlmdC5PYmplY3RCaW5kaW5nKFxuICAgICAgICAgIG5vZGUucHJvcGVydGllcy5tYXAoUGFyc2VyLnRyYW5zZm9ybURlc3RydWN0dXJpbmcpXG4gICAgICAgICkpO1xuICAgICAgY2FzZSBcIkRhdGFQcm9wZXJ0eVwiOlxuICAgICAgICByZXR1cm4gY29weUxvY2F0aW9uKG5vZGUsIG5ldyBTaGlmdC5CaW5kaW5nUHJvcGVydHlQcm9wZXJ0eShcbiAgICAgICAgICBub2RlLm5hbWUsXG4gICAgICAgICAgUGFyc2VyLnRyYW5zZm9ybURlc3RydWN0dXJpbmcobm9kZS5leHByZXNzaW9uKVxuICAgICAgICApKTtcbiAgICAgIGNhc2UgXCJTaG9ydGhhbmRQcm9wZXJ0eVwiOlxuICAgICAgICByZXR1cm4gY29weUxvY2F0aW9uKG5vZGUsIHsgdHlwZTogXCJCaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyXCIsXG4gICAgICAgICAgYmluZGluZzogY29weUxvY2F0aW9uKG5vZGUsIHsgdHlwZTogXCJCaW5kaW5nSWRlbnRpZmllclwiLCBuYW1lOiBub2RlLm5hbWUgfSksXG4gICAgICAgICAgaW5pdDogbnVsbCxcbiAgICAgICAgfSk7XG4gICAgICBjYXNlIFwiQXJyYXlFeHByZXNzaW9uXCI6XG4gICAgICAgIGxldCBsYXN0ID0gbm9kZS5lbGVtZW50c1tub2RlLmVsZW1lbnRzLmxlbmd0aCAtIDFdO1xuICAgICAgICBpZiAobGFzdCAhPSBudWxsICYmIGxhc3QudHlwZSA9PT0gXCJTcHJlYWRFbGVtZW50XCIpIHtcbiAgICAgICAgICByZXR1cm4gY29weUxvY2F0aW9uKG5vZGUsIG5ldyBTaGlmdC5BcnJheUJpbmRpbmcoXG4gICAgICAgICAgICBub2RlLmVsZW1lbnRzLnNsaWNlKDAsIC0xKS5tYXAoZSA9PiBlICYmIFBhcnNlci50cmFuc2Zvcm1EZXN0cnVjdHVyaW5nKGUpKSxcbiAgICAgICAgICAgIGNvcHlMb2NhdGlvbihsYXN0LmV4cHJlc3Npb24sIFBhcnNlci50cmFuc2Zvcm1EZXN0cnVjdHVyaW5nKGxhc3QuZXhwcmVzc2lvbikpXG4gICAgICAgICAgKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGNvcHlMb2NhdGlvbihub2RlLCBuZXcgU2hpZnQuQXJyYXlCaW5kaW5nKFxuICAgICAgICAgICAgbm9kZS5lbGVtZW50cy5tYXAoZSA9PiBlICYmIFBhcnNlci50cmFuc2Zvcm1EZXN0cnVjdHVyaW5nKGUpKSxcbiAgICAgICAgICAgIG51bGxcbiAgICAgICAgICApKTtcbiAgICAgICAgfVxuICAgICAgY2FzZSBcIkFzc2lnbm1lbnRFeHByZXNzaW9uXCI6XG4gICAgICAgIHJldHVybiBjb3B5TG9jYXRpb24obm9kZSwgbmV3IFNoaWZ0LkJpbmRpbmdXaXRoRGVmYXVsdChcbiAgICAgICAgICBQYXJzZXIudHJhbnNmb3JtRGVzdHJ1Y3R1cmluZyhub2RlLmJpbmRpbmcpLFxuICAgICAgICAgIG5vZGUuZXhwcmVzc2lvblxuICAgICAgICApKTtcbiAgICAgIGNhc2UgXCJJZGVudGlmaWVyRXhwcmVzc2lvblwiOlxuICAgICAgICByZXR1cm4gY29weUxvY2F0aW9uKG5vZGUsIHsgdHlwZTogXCJCaW5kaW5nSWRlbnRpZmllclwiLCBuYW1lOiBub2RlLm5hbWUgfSk7XG4gICAgICBjYXNlIFwiQ29tcHV0ZWRNZW1iZXJFeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiU3RhdGljTWVtYmVyRXhwcmVzc2lvblwiOlxuICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgIGNhc2UgXCJBcnJheUJpbmRpbmdcIjpcbiAgICAgIGNhc2UgXCJCaW5kaW5nSWRlbnRpZmllclwiOlxuICAgICAgY2FzZSBcIkJpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXJcIjpcbiAgICAgIGNhc2UgXCJCaW5kaW5nUHJvcGVydHlQcm9wZXJ0eVwiOlxuICAgICAgY2FzZSBcIkJpbmRpbmdXaXRoRGVmYXVsdFwiOlxuICAgICAgY2FzZSBcIk9iamVjdEJpbmRpbmdcIjpcbiAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfVxuICB9XG5cbiAgc3RhdGljIGlzRGVzdHJ1Y3R1cmluZ1RhcmdldChub2RlLCBpc0xlYWZOb2RlKSB7XG4gICAgc3dpdGNoIChub2RlLnR5cGUpIHtcbiAgICAgIGNhc2UgXCJPYmplY3RFeHByZXNzaW9uXCI6XG4gICAgICAgIHJldHVybiBub2RlLnByb3BlcnRpZXMuZXZlcnkocCA9PlxuICAgICAgICAgIHAudHlwZSA9PT0gXCJCaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyXCIgfHxcbiAgICAgICAgICBwLnR5cGUgPT09IFwiU2hvcnRoYW5kUHJvcGVydHlcIiB8fFxuICAgICAgICAgIHAudHlwZSA9PT0gXCJEYXRhUHJvcGVydHlcIiAmJlxuICAgICAgICAgIFBhcnNlci5pc0Rlc3RydWN0dXJpbmdUYXJnZXRXaXRoRGVmYXVsdChwLmV4cHJlc3Npb24sIGlzTGVhZk5vZGUpXG4gICAgICAgICk7XG4gICAgICBjYXNlIFwiQXJyYXlFeHByZXNzaW9uXCI6XG4gICAgICAgIGlmIChub2RlLmVsZW1lbnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBpZiAoIW5vZGUuZWxlbWVudHMuc2xpY2UoMCwgLTEpXG4gICAgICAgICAgICAuZmlsdGVyKGUgPT4gZSAhPSBudWxsKVxuICAgICAgICAgICAgLmV2ZXJ5KGUgPT4gUGFyc2VyLmlzRGVzdHJ1Y3R1cmluZ1RhcmdldFdpdGhEZWZhdWx0KGUsIGlzTGVhZk5vZGUpKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBsZXQgbGFzdCA9IG5vZGUuZWxlbWVudHNbbm9kZS5lbGVtZW50cy5sZW5ndGggLSAxXTtcbiAgICAgICAgcmV0dXJuIGxhc3QgPT0gbnVsbCB8fFxuICAgICAgICAgIGxhc3QudHlwZSA9PT0gXCJTcHJlYWRFbGVtZW50XCIgJiYgUGFyc2VyLmlzRGVzdHJ1Y3R1cmluZ1RhcmdldChsYXN0LmV4cHJlc3Npb24sIGlzTGVhZk5vZGUpIHx8XG4gICAgICAgICAgUGFyc2VyLmlzRGVzdHJ1Y3R1cmluZ1RhcmdldFdpdGhEZWZhdWx0KGxhc3QsIGlzTGVhZk5vZGUpO1xuICAgICAgY2FzZSBcIkFycmF5QmluZGluZ1wiOlxuICAgICAgY2FzZSBcIkJpbmRpbmdJZGVudGlmaWVyXCI6XG4gICAgICBjYXNlIFwiQmluZGluZ1Byb3BlcnR5SWRlbnRpZmllclwiOlxuICAgICAgY2FzZSBcIkJpbmRpbmdQcm9wZXJ0eVByb3BlcnR5XCI6XG4gICAgICBjYXNlIFwiQmluZGluZ1dpdGhEZWZhdWx0XCI6XG4gICAgICBjYXNlIFwiT2JqZWN0QmluZGluZ1wiOlxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGlzTGVhZk5vZGUobm9kZSk7XG4gIH1cblxuICBzdGF0aWMgaXNEZXN0cnVjdHVyaW5nVGFyZ2V0V2l0aERlZmF1bHQobm9kZSwgaXNMZWFmTm9kZSkge1xuICAgIHJldHVybiBub2RlLnR5cGUgPT09IFwiQXNzaWdubWVudEV4cHJlc3Npb25cIiAmJiBub2RlLm9wZXJhdG9yID09PSBcIj1cIiA/XG4gICAgICBQYXJzZXIuaXNEZXN0cnVjdHVyaW5nVGFyZ2V0KG5vZGUuYmluZGluZywgaXNMZWFmTm9kZSkgOlxuICAgICAgUGFyc2VyLmlzRGVzdHJ1Y3R1cmluZ1RhcmdldChub2RlLCBpc0xlYWZOb2RlKTtcbiAgfVxuXG4gIHN0YXRpYyBpc1ZhbGlkU2ltcGxlQmluZGluZ1RhcmdldChub2RlKSB7XG4gICAgcmV0dXJuIG5vZGUudHlwZSA9PT0gXCJJZGVudGlmaWVyRXhwcmVzc2lvblwiO1xuICB9XG5cbiAgc3RhdGljIGlzVmFsaWRTaW1wbGVBc3NpZ25tZW50VGFyZ2V0KG5vZGUpIHtcbiAgICBzd2l0Y2ggKG5vZGUudHlwZSkge1xuICAgICAgY2FzZSBcIklkZW50aWZpZXJFeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiQ29tcHV0ZWRNZW1iZXJFeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiU3RhdGljTWVtYmVyRXhwcmVzc2lvblwiOlxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgc3RhdGljIGJvdW5kTmFtZXMobm9kZSkge1xuICAgIHN3aXRjaCAobm9kZS50eXBlKSB7XG4gICAgICBjYXNlIFwiQmluZGluZ0lkZW50aWZpZXJcIjpcbiAgICAgICAgcmV0dXJuIFtub2RlLm5hbWVdO1xuICAgICAgY2FzZSBcIkJpbmRpbmdXaXRoRGVmYXVsdFwiOlxuICAgICAgICByZXR1cm4gUGFyc2VyLmJvdW5kTmFtZXMobm9kZS5iaW5kaW5nKTtcbiAgICAgIGNhc2UgXCJBcnJheUJpbmRpbmdcIjoge1xuICAgICAgICBsZXQgbmFtZXMgPSBbXTtcbiAgICAgICAgbm9kZS5lbGVtZW50cy5maWx0ZXIoZSA9PiBlICE9IG51bGwpLmZvckVhY2goZSA9PiBbXS5wdXNoLmFwcGx5KG5hbWVzLCBQYXJzZXIuYm91bmROYW1lcyhlKSkpO1xuICAgICAgICBpZiAobm9kZS5yZXN0RWxlbWVudCAhPSBudWxsKSB7XG4gICAgICAgICAgW10ucHVzaC5hcHBseShuYW1lcywgUGFyc2VyLmJvdW5kTmFtZXMobm9kZS5yZXN0RWxlbWVudCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuYW1lcztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJPYmplY3RCaW5kaW5nXCI6IHtcbiAgICAgICAgbGV0IG5hbWVzID0gW107XG4gICAgICAgIG5vZGUucHJvcGVydGllcy5mb3JFYWNoKHAgPT4ge1xuICAgICAgICAgIHN3aXRjaCAocC50eXBlKSB7XG4gICAgICAgICAgICBjYXNlIFwiQmluZGluZ1Byb3BlcnR5SWRlbnRpZmllclwiOlxuICAgICAgICAgICAgICBuYW1lcy5wdXNoKHAuYmluZGluZy5uYW1lKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiQmluZGluZ1Byb3BlcnR5UHJvcGVydHlcIjpcbiAgICAgICAgICAgICAgW10ucHVzaC5hcHBseShuYW1lcywgUGFyc2VyLmJvdW5kTmFtZXMocC5iaW5kaW5nKSk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgLy8gaXN0YW5idWwgaWdub3JlIG5leHRcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImJvdW5kTmFtZXMgY2FsbGVkIG9uIE9iamVjdEJpbmRpbmcgd2l0aCBpbnZhbGlkIHByb3BlcnR5OiBcIiArIHAudHlwZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG5hbWVzO1xuICAgICAgfVxuICAgICAgY2FzZSBcIkNvbXB1dGVkTWVtYmVyRXhwcmVzc2lvblwiOlxuICAgICAgY2FzZSBcIlN0YXRpY01lbWJlckV4cHJlc3Npb25cIjpcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICAvLyBpc3RhbmJ1bCBpZ25vcmUgbmV4dFxuICAgIHRocm93IG5ldyBFcnJvcihcImJvdW5kTmFtZXMgY2FsbGVkIG9uIGludmFsaWQgYXNzaWdubWVudCB0YXJnZXQ6IFwiICsgbm9kZS50eXBlKTtcbiAgfVxuXG4gIHBhcnNlRm9yU3RhdGVtZW50KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5GT1IpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MUEFSRU4pO1xuICAgIGxldCB0ZXN0ID0gbnVsbDtcbiAgICBsZXQgcmlnaHQgPSBudWxsO1xuICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuU0VNSUNPTE9OKSkge1xuICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5TRU1JQ09MT04pKSB7XG4gICAgICAgIHRlc3QgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgfVxuICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlNFTUlDT0xPTik7XG4gICAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJQQVJFTikpIHtcbiAgICAgICAgcmlnaHQgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBTaGlmdC5Gb3JTdGF0ZW1lbnQoXG4gICAgICAgICAgbnVsbCxcbiAgICAgICAgICB0ZXN0LFxuICAgICAgICAgIHJpZ2h0LFxuICAgICAgICAgIHRoaXMuZ2V0SXRlcmF0b3JTdGF0ZW1lbnRFcGlsb2d1ZSgpXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgc3RhcnRzV2l0aExldCA9IHRoaXMubWF0Y2goVG9rZW5UeXBlLkxFVCkgfHwgdGhpcy5tYXRjaChUb2tlblR5cGUuSURFTlRJRklFUikgJiYgdGhpcy5sb29rYWhlYWQudmFsdWUgPT09IFwibGV0XCI7XG4gICAgICBsZXQgaXNGb3JEZWNsID0gdGhpcy5sb29rYWhlYWRMZXhpY2FsRGVjbGFyYXRpb24oKTtcbiAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5WQVIpIHx8IGlzRm9yRGVjbCkge1xuICAgICAgICBsZXQgcHJldmlvdXNBbGxvd0luID0gdGhpcy5hbGxvd0luO1xuICAgICAgICB0aGlzLmFsbG93SW4gPSBmYWxzZTtcbiAgICAgICAgbGV0IGluaXREZWNsID0gdGhpcy5wYXJzZVZhcmlhYmxlRGVjbGFyYXRpb24oe2luRm9yOiB0cnVlfSk7XG4gICAgICAgIHRoaXMuYWxsb3dJbiA9IHByZXZpb3VzQWxsb3dJbjtcblxuICAgICAgICBpZiAoaW5pdERlY2wuZGVjbGFyYXRvcnMubGVuZ3RoID09PSAxICYmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5JTikgfHwgdGhpcy5tYXRjaChUb2tlblR5cGUuT0YpKSkge1xuICAgICAgICAgIGxldCBDdG9yO1xuXG4gICAgICAgICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLklOKSkge1xuICAgICAgICAgICAgaWYgKGluaXREZWNsLmRlY2xhcmF0b3JzWzBdLmluaXQgIT0gbnVsbCkge1xuICAgICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuSU5WQUxJRF9WQVJfSU5JVF9GT1JfSU4pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgQ3RvciA9IFNoaWZ0LkZvckluU3RhdGVtZW50O1xuICAgICAgICAgICAgdGhpcy5sZXgoKTtcbiAgICAgICAgICAgIHJpZ2h0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKGluaXREZWNsLmRlY2xhcmF0b3JzWzBdLmluaXQgIT0gbnVsbCkge1xuICAgICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuSU5WQUxJRF9WQVJfSU5JVF9GT1JfT0YpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgQ3RvciA9IFNoaWZ0LkZvck9mU3RhdGVtZW50O1xuICAgICAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMuVkROKSB7XG4gICAgICAgICAgICAgIHRoaXMuVkROW2tleV0gPSBGT1JfT0ZfVkFSO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmxleCgpO1xuICAgICAgICAgICAgcmlnaHQgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsZXQgZXBpbG9ndWUgPSB0aGlzLndyYXBWRE4odGhpcy5nZXRJdGVyYXRvclN0YXRlbWVudEVwaWxvZ3VlLCBpc0ZvckRlY2wgJiYgdGhpcy5jaGVja0Jsb2NrU2NvcGUpO1xuXG4gICAgICAgICAgcmV0dXJuIG5ldyBDdG9yKGluaXREZWNsLCByaWdodCwgZXBpbG9ndWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5TRU1JQ09MT04pO1xuICAgICAgICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuU0VNSUNPTE9OKSkge1xuICAgICAgICAgICAgdGVzdCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5TRU1JQ09MT04pO1xuICAgICAgICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuUlBBUkVOKSkge1xuICAgICAgICAgICAgcmlnaHQgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gbmV3IFNoaWZ0LkZvclN0YXRlbWVudChpbml0RGVjbCwgdGVzdCwgcmlnaHQsIHRoaXMud3JhcFZETih0aGlzLmdldEl0ZXJhdG9yU3RhdGVtZW50RXBpbG9ndWUsIGlzRm9yRGVjbCAmJiB0aGlzLmNoZWNrQmxvY2tTY29wZSkpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsZXQgcHJldmlvdXNBbGxvd0luID0gdGhpcy5hbGxvd0luO1xuICAgICAgICB0aGlzLmFsbG93SW4gPSBmYWxzZTtcbiAgICAgICAgbGV0IGluaXQgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgICB0aGlzLmFsbG93SW4gPSBwcmV2aW91c0FsbG93SW47XG5cbiAgICAgICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLklOKSB8fCAhc3RhcnRzV2l0aExldCAmJiB0aGlzLm1hdGNoKFRva2VuVHlwZS5PRikpIHtcbiAgICAgICAgICBpZiAoIVBhcnNlci5pc1ZhbGlkU2ltcGxlQXNzaWdubWVudFRhcmdldChpbml0KSkge1xuICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLklOVkFMSURfTEhTX0lOX0ZPUl9JTik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGV0IEN0b3IgPSB0aGlzLm1hdGNoKFRva2VuVHlwZS5JTikgPyBTaGlmdC5Gb3JJblN0YXRlbWVudCA6IFNoaWZ0LkZvck9mU3RhdGVtZW50O1xuXG4gICAgICAgICAgdGhpcy5sZXgoKTtcbiAgICAgICAgICByaWdodCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG5cbiAgICAgICAgICByZXR1cm4gbmV3IEN0b3IoaW5pdCwgcmlnaHQsIHRoaXMuZ2V0SXRlcmF0b3JTdGF0ZW1lbnRFcGlsb2d1ZSgpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuU0VNSUNPTE9OKTtcbiAgICAgICAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlNFTUlDT0xPTikpIHtcbiAgICAgICAgICAgIHRlc3QgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuU0VNSUNPTE9OKTtcbiAgICAgICAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJQQVJFTikpIHtcbiAgICAgICAgICAgIHJpZ2h0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIG5ldyBTaGlmdC5Gb3JTdGF0ZW1lbnQoaW5pdCwgdGVzdCwgcmlnaHQsIHRoaXMuZ2V0SXRlcmF0b3JTdGF0ZW1lbnRFcGlsb2d1ZSgpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGdldEl0ZXJhdG9yU3RhdGVtZW50RXBpbG9ndWUoKSB7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJQQVJFTik7XG4gICAgbGV0IG9sZEluSXRlcmF0aW9uID0gdGhpcy5pbkl0ZXJhdGlvbjtcbiAgICB0aGlzLmluSXRlcmF0aW9uID0gdHJ1ZTtcbiAgICBsZXQgYm9keSA9IHRoaXMucGFyc2VTdGF0ZW1lbnQoKTtcbiAgICB0aGlzLmluSXRlcmF0aW9uID0gb2xkSW5JdGVyYXRpb247XG4gICAgcmV0dXJuIGJvZHk7XG4gIH1cblxuICBwYXJzZUlmU3RhdGVtZW50KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5JRik7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgbGV0IHRlc3QgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJQQVJFTik7XG4gICAgbGV0IGNvbnNlcXVlbnQgPSB0aGlzLnBhcnNlU3RhdGVtZW50KCk7XG4gICAgbGV0IGFsdGVybmF0ZSA9IG51bGw7XG4gICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5FTFNFKSkge1xuICAgICAgYWx0ZXJuYXRlID0gdGhpcy5wYXJzZVN0YXRlbWVudCgpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IFNoaWZ0LklmU3RhdGVtZW50KHRlc3QsIGNvbnNlcXVlbnQsIGFsdGVybmF0ZSk7XG4gIH1cblxuICBwYXJzZVJldHVyblN0YXRlbWVudCgpIHtcbiAgICBsZXQgYXJndW1lbnQgPSBudWxsO1xuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJFVFVSTik7XG4gICAgaWYgKCF0aGlzLmluRnVuY3Rpb25Cb2R5KSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuSUxMRUdBTF9SRVRVUk4pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCkge1xuICAgICAgcmV0dXJuIG5ldyBTaGlmdC5SZXR1cm5TdGF0ZW1lbnQobnVsbCk7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5TRU1JQ09MT04pKSB7XG4gICAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJCUkFDRSkgJiYgIXRoaXMuZW9mKCkpIHtcbiAgICAgICAgYXJndW1lbnQgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuY29uc3VtZVNlbWljb2xvbigpO1xuICAgIHJldHVybiBuZXcgU2hpZnQuUmV0dXJuU3RhdGVtZW50KGFyZ3VtZW50KTtcbiAgfVxuXG4gIHBhcnNlV2l0aFN0YXRlbWVudCgpIHtcbiAgICBpZiAodGhpcy5zdHJpY3QpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5TVFJJQ1RfTU9ERV9XSVRIKTtcbiAgICB9XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuV0lUSCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgbGV0IG9iamVjdCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJQQVJFTik7XG4gICAgbGV0IGJvZHkgPSB0aGlzLnBhcnNlU3RhdGVtZW50KCk7XG5cbiAgICByZXR1cm4gbmV3IFNoaWZ0LldpdGhTdGF0ZW1lbnQob2JqZWN0LCBib2R5KTtcbiAgfVxuXG4gIHBhcnNlU3dpdGNoU3RhdGVtZW50KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5TV0lUQ0gpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MUEFSRU4pO1xuICAgIGxldCBkaXNjcmltaW5hbnQgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MQlJBQ0UpO1xuXG4gICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5SQlJBQ0UpKSB7XG4gICAgICByZXR1cm4gbmV3IFNoaWZ0LlN3aXRjaFN0YXRlbWVudChkaXNjcmltaW5hbnQsIFtdKTtcbiAgICB9XG4gICAgbGV0IG9sZEluU3dpdGNoID0gdGhpcy5pblN3aXRjaDtcbiAgICB0aGlzLmluU3dpdGNoID0gdHJ1ZTtcbiAgICByZXR1cm4gdGhpcy53cmFwVkROKCgpID0+IHtcbiAgICAgIGxldCBjYXNlcyA9IHRoaXMucGFyc2VTd2l0Y2hDYXNlcygpO1xuICAgICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkRFRkFVTFQpKSB7XG4gICAgICAgIGxldCBzd2l0Y2hEZWZhdWx0ID0gdGhpcy5wYXJzZVN3aXRjaERlZmF1bHQoKTtcbiAgICAgICAgbGV0IHBvc3REZWZhdWx0Q2FzZXMgPSB0aGlzLnBhcnNlU3dpdGNoQ2FzZXMoKTtcbiAgICAgICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkRFRkFVTFQpKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLk1VTFRJUExFX0RFRkFVTFRTX0lOX1NXSVRDSCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pblN3aXRjaCA9IG9sZEluU3dpdGNoO1xuICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUkJSQUNFKTtcbiAgICAgICAgcmV0dXJuIG5ldyBTaGlmdC5Td2l0Y2hTdGF0ZW1lbnRXaXRoRGVmYXVsdChkaXNjcmltaW5hbnQsIGNhc2VzLCBzd2l0Y2hEZWZhdWx0LCBwb3N0RGVmYXVsdENhc2VzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuaW5Td2l0Y2ggPSBvbGRJblN3aXRjaDtcbiAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJCUkFDRSk7XG4gICAgICAgIHJldHVybiBuZXcgU2hpZnQuU3dpdGNoU3RhdGVtZW50KGRpc2NyaW1pbmFudCwgY2FzZXMpO1xuICAgICAgfVxuICAgIH0sIHRoaXMuY2hlY2tCbG9ja1Njb3BlKTtcbiAgfVxuXG4gIHBhcnNlU3dpdGNoQ2FzZXMoKSB7XG4gICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgIHdoaWxlICghKHRoaXMuZW9mKCkgfHwgdGhpcy5tYXRjaChUb2tlblR5cGUuUkJSQUNFKSB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5ERUZBVUxUKSkpIHtcbiAgICAgIHJlc3VsdC5wdXNoKHRoaXMucGFyc2VTd2l0Y2hDYXNlKCkpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgcGFyc2VTd2l0Y2hDYXNlKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5DQVNFKTtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlN3aXRjaENhc2UodGhpcy5wYXJzZUV4cHJlc3Npb24oKSwgdGhpcy5wYXJzZVN3aXRjaENhc2VCb2R5KCkpLCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlU3dpdGNoRGVmYXVsdCgpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuREVGQVVMVCk7XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5Td2l0Y2hEZWZhdWx0KHRoaXMucGFyc2VTd2l0Y2hDYXNlQm9keSgpKSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZVN3aXRjaENhc2VCb2R5KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5DT0xPTik7XG4gICAgcmV0dXJuIHRoaXMucGFyc2VTdGF0ZW1lbnRMaXN0SW5Td2l0Y2hDYXNlQm9keSgpO1xuICB9XG5cbiAgcGFyc2VTdGF0ZW1lbnRMaXN0SW5Td2l0Y2hDYXNlQm9keSgpIHtcbiAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgd2hpbGUgKCEodGhpcy5lb2YoKSB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0UpIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLkRFRkFVTFQpIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLkNBU0UpKSkge1xuICAgICAgcmVzdWx0LnB1c2godGhpcy5wYXJzZVN0YXRlbWVudExpc3RJdGVtKCkpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgcGFyc2VUaHJvd1N0YXRlbWVudCgpIHtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmV4cGVjdChUb2tlblR5cGUuVEhST1cpO1xuXG4gICAgaWYgKHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0KSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLk5FV0xJTkVfQUZURVJfVEhST1cpO1xuICAgIH1cblxuICAgIGxldCBhcmd1bWVudCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG5cbiAgICB0aGlzLmNvbnN1bWVTZW1pY29sb24oKTtcblxuICAgIHJldHVybiBuZXcgU2hpZnQuVGhyb3dTdGF0ZW1lbnQoYXJndW1lbnQpO1xuICB9XG5cbiAgcGFyc2VUcnlTdGF0ZW1lbnQoKSB7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlRSWSk7XG4gICAgbGV0IGJsb2NrID0gdGhpcy53cmFwVkROKHRoaXMucGFyc2VCbG9jaywgdGhpcy5jaGVja0Jsb2NrU2NvcGUpO1xuXG4gICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkNBVENIKSkge1xuICAgICAgbGV0IGhhbmRsZXIgPSB0aGlzLnBhcnNlQ2F0Y2hDbGF1c2UoKTtcbiAgICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuRklOQUxMWSkpIHtcbiAgICAgICAgbGV0IGZpbmFsaXplciA9IHRoaXMud3JhcFZETih0aGlzLnBhcnNlQmxvY2ssIHRoaXMuY2hlY2tCbG9ja1Njb3BlKTtcbiAgICAgICAgcmV0dXJuIG5ldyBTaGlmdC5UcnlGaW5hbGx5U3RhdGVtZW50KGJsb2NrLCBoYW5kbGVyLCBmaW5hbGl6ZXIpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBTaGlmdC5UcnlDYXRjaFN0YXRlbWVudChibG9jaywgaGFuZGxlcik7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5GSU5BTExZKSkge1xuICAgICAgbGV0IGZpbmFsaXplciA9IHRoaXMud3JhcFZETih0aGlzLnBhcnNlQmxvY2ssIHRoaXMuY2hlY2tCbG9ja1Njb3BlKTtcbiAgICAgIHJldHVybiBuZXcgU2hpZnQuVHJ5RmluYWxseVN0YXRlbWVudChibG9jaywgbnVsbCwgZmluYWxpemVyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLk5PX0NBVENIX09SX0ZJTkFMTFkpO1xuICAgIH1cbiAgfVxuXG4gIHBhcnNlVmFyaWFibGVEZWNsYXJhdGlvblN0YXRlbWVudCgpIHtcbiAgICBsZXQgZGVjbGFyYXRpb24gPSB0aGlzLnBhcnNlVmFyaWFibGVEZWNsYXJhdGlvbigpO1xuICAgIHRoaXMuY29uc3VtZVNlbWljb2xvbigpO1xuICAgIHJldHVybiBuZXcgU2hpZnQuVmFyaWFibGVEZWNsYXJhdGlvblN0YXRlbWVudChkZWNsYXJhdGlvbik7XG4gIH1cblxuICBwYXJzZVdoaWxlU3RhdGVtZW50KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5XSElMRSk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgcmV0dXJuIG5ldyBTaGlmdC5XaGlsZVN0YXRlbWVudCh0aGlzLnBhcnNlRXhwcmVzc2lvbigpLCB0aGlzLmdldEl0ZXJhdG9yU3RhdGVtZW50RXBpbG9ndWUoKSk7XG4gIH1cblxuICBwYXJzZUNhdGNoQ2xhdXNlKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNBVENIKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTFBBUkVOKTtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuUlBBUkVOKSB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5MUEFSRU4pKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodG9rZW4pO1xuICAgIH1cblxuICAgIGxldCBwYXJhbSA9IHRoaXMucGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uKHthbGxvd0NhbGw6IGZhbHNlfSk7XG5cbiAgICBpZiAoIVBhcnNlci5pc0Rlc3RydWN0dXJpbmdUYXJnZXQocGFyYW0sIFBhcnNlci5pc1ZhbGlkU2ltcGxlQmluZGluZ1RhcmdldCkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0b2tlbik7XG4gICAgfVxuICAgIHBhcmFtID0gUGFyc2VyLnRyYW5zZm9ybURlc3RydWN0dXJpbmcocGFyYW0pO1xuXG4gICAgbGV0IGJvdW5kID0gUGFyc2VyLmJvdW5kTmFtZXMocGFyYW0pO1xuICAgIGlmIChmaXJzdER1cGxpY2F0ZShib3VuZCkgIT0gbnVsbCkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5EVVBMSUNBVEVfQklORElORywgZmlyc3REdXBsaWNhdGUoYm91bmQpKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5zdHJpY3QgJiYgYm91bmQuc29tZShpc1Jlc3RyaWN0ZWRXb3JkKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5TVFJJQ1RfQ0FUQ0hfVkFSSUFCTEUpO1xuICAgIH1cblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuXG4gICAgbGV0IGJvZHkgPSB0aGlzLndyYXBWRE4odGhpcy5wYXJzZUJsb2NrLCB0aGlzLmNoZWNrQmxvY2tTY29wZSk7XG5cbiAgICB0aGlzLkxETi5mb3JFYWNoKG5hbWUgPT4ge1xuICAgICAgaWYgKGJvdW5kLmluZGV4T2YobmFtZSkgPj0gMCkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLkRVUExJQ0FURV9CSU5ESU5HLCBuYW1lKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy5WRE4pIHtcbiAgICAgIGlmICh0aGlzLlZETltrZXldID09PSBGT1JfT0ZfVkFSICYmIGJvdW5kLmluZGV4T2Yoa2V5LnNsaWNlKDEpKSA+PSAwKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5EVVBMSUNBVEVfQ0FUQ0hfQklORElORywga2V5LnNsaWNlKDEpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5DYXRjaENsYXVzZShwYXJhbSwgYm9keSksIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VCbG9jaygpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTEJSQUNFKTtcblxuICAgIGxldCBib2R5ID0gW107XG4gICAgd2hpbGUgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0UpKSB7XG4gICAgICBib2R5LnB1c2godGhpcy5wYXJzZVN0YXRlbWVudExpc3RJdGVtKCkpO1xuICAgIH1cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUkJSQUNFKTtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkJsb2NrKGJvZHkpLCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlVmFyaWFibGVEZWNsYXJhdGlvbih7aW5Gb3IgPSBmYWxzZSwgYm91bmROYW1lcyA9IFtdfSA9IHt9KSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IHRva2VuID0gdGhpcy5sZXgoKTtcblxuICAgIC8vIFByZWNlZGVkIGJ5IHRoaXMubWF0Y2goVG9rZW5TdWJUeXBlLlZBUikgfHwgdGhpcy5tYXRjaChUb2tlblN1YlR5cGUuTEVUKTtcbiAgICBsZXQga2luZCA9IHRva2VuLnR5cGUgPT09IFRva2VuVHlwZS5WQVIgPyBcInZhclwiIDogdG9rZW4udHlwZSA9PT0gVG9rZW5UeXBlLkNPTlNUID8gXCJjb25zdFwiIDogXCJsZXRcIjtcbiAgICBsZXQgZGVjbGFyYXRvcnMgPSB0aGlzLnBhcnNlVmFyaWFibGVEZWNsYXJhdG9yTGlzdChraW5kLCB7aW5Gb3IsIGJvdW5kTmFtZXN9KTtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlZhcmlhYmxlRGVjbGFyYXRpb24oa2luZCwgZGVjbGFyYXRvcnMpLCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlVmFyaWFibGVEZWNsYXJhdG9yTGlzdChraW5kLCB7aW5Gb3IsIGJvdW5kTmFtZXN9KSB7XG4gICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgIGxldCBbdmFyRGVjbCwgYWxsQm91bmRdID0gdGhpcy5wYXJzZVZhcmlhYmxlRGVjbGFyYXRvcihraW5kLCB7YWxsb3dDb25zdFdpdGhvdXRCaW5kaW5nOiBpbkZvcn0pO1xuICAgIHJlc3VsdC5wdXNoKHZhckRlY2wpO1xuICAgIGlmIChpbkZvciAmJiBraW5kID09PSBcImNvbnN0XCIgJiYgdmFyRGVjbC5pbml0ID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHdoaWxlICh0aGlzLmVhdChUb2tlblR5cGUuQ09NTUEpKSB7XG4gICAgICBsZXQgW25leHRWYXJEZWNsLCBib3VuZF0gPSB0aGlzLnBhcnNlVmFyaWFibGVEZWNsYXJhdG9yKGtpbmQsIHthbGxvd0NvbnN0V2l0aG91dEJpbmRpbmc6IGZhbHNlfSk7XG4gICAgICByZXN1bHQucHVzaChuZXh0VmFyRGVjbCk7XG4gICAgICBpZiAoa2luZCAhPT0gXCJ2YXJcIikge1xuICAgICAgICBhbGxCb3VuZCA9IGFsbEJvdW5kLmNvbmNhdChib3VuZCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuc3RyaWN0ICYmIGFsbEJvdW5kLnNvbWUoaXNSZXN0cmljdGVkV29yZCkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odGhpcy5sb29rYWhlYWQsIEVycm9yTWVzc2FnZXMuU1RSSUNUX1ZBUl9OQU1FKTtcbiAgICB9XG5cbiAgICBpZiAoa2luZCAhPT0gXCJ2YXJcIikge1xuICAgICAgbGV0IGR1cGUgPSBmaXJzdER1cGxpY2F0ZShhbGxCb3VuZCk7XG4gICAgICBpZiAoZHVwZSAhPT0gbnVsbCkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuRFVQTElDQVRFX0JJTkRJTkcsIGR1cGUpO1xuICAgICAgfVxuICAgIH1cbiAgICBbXS5wdXNoLmFwcGx5KGJvdW5kTmFtZXMsIGFsbEJvdW5kKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgcGFyc2VWYXJpYWJsZURlY2xhcmF0b3Ioa2luZCwge2FsbG93Q29uc3RXaXRob3V0QmluZGluZ30pIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcblxuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5MUEFSRU4pKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuICAgIH1cblxuICAgIGxldCBwcmV2aW91c0FsbG93QmluZGluZ1BhdHRlcm4gPSB0aGlzLmFsbG93QmluZGluZ1BhdHRlcm47XG4gICAgdGhpcy5hbGxvd0JpbmRpbmdQYXR0ZXJuID0gdHJ1ZTtcblxuICAgIGxldCBpZCA9IHRoaXMucGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uKHthbGxvd0NhbGw6IGZhbHNlfSk7XG5cbiAgICB0aGlzLmFsbG93QmluZGluZ1BhdHRlcm4gPSBwcmV2aW91c0FsbG93QmluZGluZ1BhdHRlcm47XG5cbiAgICBpZiAoIVBhcnNlci5pc0Rlc3RydWN0dXJpbmdUYXJnZXQoaWQsIFBhcnNlci5pc1ZhbGlkU2ltcGxlQmluZGluZ1RhcmdldCkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0b2tlbik7XG4gICAgfVxuICAgIGlkID0gUGFyc2VyLnRyYW5zZm9ybURlc3RydWN0dXJpbmcoaWQpO1xuXG4gICAgbGV0IGJvdW5kID0gUGFyc2VyLmJvdW5kTmFtZXMoaWQpO1xuXG4gICAgbGV0IGluaXQgPSBudWxsO1xuICAgIGlmIChraW5kID09PSBcImNvbnN0XCIpIHtcbiAgICAgIGlmICghYWxsb3dDb25zdFdpdGhvdXRCaW5kaW5nIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLkFTU0lHTikpIHtcbiAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkFTU0lHTik7XG4gICAgICAgIGluaXQgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5BU1NJR04pKSB7XG4gICAgICBpbml0ID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgfVxuXG4gICAgaWYgKGtpbmQgPT09IFwidmFyXCIpIHtcbiAgICAgIGJvdW5kLmZvckVhY2gobmFtZSA9PiB0aGlzLlZETltcIiRcIiArIG5hbWVdID0gdHJ1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChib3VuZC5pbmRleE9mKFwibGV0XCIpID49IDApIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5MRVhJQ0FMTFlfQk9VTkRfTEVUKTtcbiAgICAgIH1cbiAgICAgIFtdLnB1c2guYXBwbHkodGhpcy5MRE4sIGJvdW5kKTtcbiAgICB9XG4gICAgcmV0dXJuIFt0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuVmFyaWFibGVEZWNsYXJhdG9yKGlkLCBpbml0KSwgc3RhcnRMb2NhdGlvbiksIGJvdW5kXTtcbiAgfVxuXG4gIHBhcnNlRXhwcmVzc2lvbigpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcblxuICAgIGxldCBleHByID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG5cbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuQ09NTUEpKSB7XG4gICAgICB3aGlsZSAoIXRoaXMuZW9mKCkpIHtcbiAgICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5DT01NQSkpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxleCgpO1xuICAgICAgICBleHByID0gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkJpbmFyeUV4cHJlc3Npb24oXCIsXCIsIGV4cHIsIHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpKSxcbiAgICAgICAgICAgIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZXhwcjtcbiAgfVxuXG4gIHBhcnNlQXJyb3dFeHByZXNzaW9uVGFpbChoZWFkLCBzdGFydExvY2F0aW9uKSB7XG4gICAgbGV0IGFycm93ID0gdGhpcy5leHBlY3QoVG9rZW5UeXBlLkFSUk9XKTtcblxuICAgIC8vIENvbnZlcnQgcGFyYW0gbGlzdC5cbiAgICBsZXQge3BhcmFtcyA9IG51bGwsIHJlc3QgPSBudWxsfSA9IGhlYWQ7XG4gICAgaWYgKGhlYWQudHlwZSAhPT0gQVJST1dfRVhQUkVTU0lPTl9QQVJBTVMpIHtcbiAgICAgIGlmIChoZWFkLnR5cGUgPT09IFwiSWRlbnRpZmllckV4cHJlc3Npb25cIikge1xuICAgICAgICBsZXQgbmFtZSA9IGhlYWQubmFtZTtcbiAgICAgICAgaWYgKFNUUklDVF9NT0RFX1JFU0VSVkVEX1dPUkQuaGFzT3duUHJvcGVydHkobmFtZSkpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX1JFU0VSVkVEX1dPUkQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpc1Jlc3RyaWN0ZWRXb3JkKG5hbWUpKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlNUUklDVF9QQVJBTV9OQU1FKTtcbiAgICAgICAgfVxuICAgICAgICBoZWFkID0gUGFyc2VyLnRyYW5zZm9ybURlc3RydWN0dXJpbmcoaGVhZCk7XG4gICAgICAgIHBhcmFtcyA9IFtoZWFkXTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZChhcnJvdyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IHBhcmFtc05vZGUgPSB0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiRm9ybWFsUGFyYW1ldGVyc1wiLCBpdGVtczogcGFyYW1zLCByZXN0IH0sIHN0YXJ0TG9jYXRpb24pO1xuXG4gICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkxCUkFDRSkpIHtcbiAgICAgIGxldCBwcmV2aW91c1lpZWxkID0gdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbjtcbiAgICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBmYWxzZTtcbiAgICAgIGxldCBib3VuZFBhcmFtcyA9IFtdLmNvbmNhdC5hcHBseShbXSwgcGFyYW1zLm1hcChQYXJzZXIuYm91bmROYW1lcykpO1xuICAgICAgbGV0IFtib2R5XSA9IHRoaXMucGFyc2VGdW5jdGlvbkJvZHkoYm91bmRQYXJhbXMpO1xuICAgICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IHByZXZpb3VzWWllbGQ7XG4gICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIkFycm93RXhwcmVzc2lvblwiLCBwYXJhbXM6IHBhcmFtc05vZGUsIGJvZHkgfSwgc3RhcnRMb2NhdGlvbik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBib2R5ID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIkFycm93RXhwcmVzc2lvblwiLCBwYXJhbXM6IHBhcmFtc05vZGUsIGJvZHkgfSwgc3RhcnRMb2NhdGlvbik7XG4gICAgfVxuICB9XG5cbiAgLy8gVE9ETzogdGhpcyBpcyBncm9zcyBhbmQgd2Ugc2hvdWxkbid0IGFjdHVhbGx5IGRvIHRoaXNcbiAgc3RhdGljIGNvbnRhaW5zQmluZGluZ1Byb3BlcnR5SWRlbnRpZmllcihub2RlKSB7XG4gICAgc3dpdGNoKG5vZGUudHlwZSkge1xuICAgICAgY2FzZSBcIkJpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXJcIjpcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICBjYXNlIFwiT2JqZWN0RXhwcmVzc2lvblwiOlxuICAgICAgY2FzZSBcIk9iamVjdEJpbmRpbmdcIjpcbiAgICAgICAgcmV0dXJuIG5vZGUucHJvcGVydGllcy5zb21lKFBhcnNlci5jb250YWluc0JpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXIpO1xuICAgICAgY2FzZSBcIkFycmF5RXhwcmVzc2lvblwiOlxuICAgICAgY2FzZSBcIkFycmF5QmluZGluZ1wiOlxuICAgICAgICByZXR1cm4gbm9kZS5lbGVtZW50cy5zb21lKGUgPT4gZSAhPSBudWxsICYmIFBhcnNlci5jb250YWluc0JpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXIoZSkpO1xuICAgICAgY2FzZSBcIlNob3J0aGFuZFByb3BlcnR5XCI6XG4gICAgICBjYXNlIFwiTWV0aG9kXCI6XG4gICAgICBjYXNlIFwiR2V0dGVyXCI6XG4gICAgICBjYXNlIFwiU2V0dGVyXCI6XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIGNhc2UgXCJTcHJlYWRFbGVtZW50XCI6XG4gICAgICAgIHJldHVybiBQYXJzZXIuY29udGFpbnNCaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyKG5vZGUuZXhwcmVzc2lvbik7XG5cbiAgICAgIGNhc2UgXCJBcnJvd0V4cHJlc3Npb25cIjpcbiAgICAgIGNhc2UgXCJGdW5jdGlvbkV4cHJlc3Npb25cIjpcbiAgICAgIGNhc2UgXCJJZGVudGlmaWVyRXhwcmVzc2lvblwiOlxuICAgICAgY2FzZSBcIkxpdGVyYWxCb29sZWFuRXhwcmVzc2lvblwiOlxuICAgICAgY2FzZSBcIkxpdGVyYWxJbmZpbml0eUV4cHJlc3Npb25cIjpcbiAgICAgIGNhc2UgXCJMaXRlcmFsTnVsbEV4cHJlc3Npb25cIjpcbiAgICAgIGNhc2UgXCJMaXRlcmFsTnVtZXJpY0V4cHJlc3Npb25cIjpcbiAgICAgIGNhc2UgXCJMaXRlcmFsUmVnRXhwRXhwcmVzc2lvblwiOlxuICAgICAgY2FzZSBcIkxpdGVyYWxTdHJpbmdFeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiTmV3VGFyZ2V0RXhwcmVzc2lvblwiOlxuICAgICAgY2FzZSBcIlN1cGVyXCI6XG4gICAgICBjYXNlIFwiVGhpc0V4cHJlc3Npb25cIjpcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgY2FzZSBcIkFzc2lnbm1lbnRFeHByZXNzaW9uXCI6XG4gICAgICAgIHJldHVybiBQYXJzZXIuY29udGFpbnNCaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyKG5vZGUuZXhwcmVzc2lvbik7XG4gICAgICBjYXNlIFwiQmluYXJ5RXhwcmVzc2lvblwiOlxuICAgICAgICByZXR1cm4gUGFyc2VyLmNvbnRhaW5zQmluZGluZ1Byb3BlcnR5SWRlbnRpZmllcihub2RlLmxlZnQpXG4gICAgICAgICAgfHwgUGFyc2VyLmNvbnRhaW5zQmluZGluZ1Byb3BlcnR5SWRlbnRpZmllcihub2RlLnJpZ2h0KTtcbiAgICAgIGNhc2UgXCJDYWxsRXhwcmVzc2lvblwiOlxuICAgICAgY2FzZSBcIk5ld0V4cHJlc3Npb25cIjpcbiAgICAgICAgcmV0dXJuIFBhcnNlci5jb250YWluc0JpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXIobm9kZS5jYWxsZWUpXG4gICAgICAgICAgfHwgbm9kZS5hcmd1bWVudHMuc29tZShQYXJzZXIuY29udGFpbnNCaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyKTtcbiAgICAgIGNhc2UgXCJDbGFzc0V4cHJlc3Npb25cIjpcbiAgICAgICAgcmV0dXJuIG5vZGUuc3VwZXIgIT0gbnVsbCAmJiBQYXJzZXIuY29udGFpbnNCaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyKG5vZGUuc3VwZXIpO1xuICAgICAgY2FzZSBcIkNvbXB1dGVkTWVtYmVyRXhwcmVzc2lvblwiOlxuICAgICAgICByZXR1cm4gUGFyc2VyLmNvbnRhaW5zQmluZGluZ1Byb3BlcnR5SWRlbnRpZmllcihub2RlLm9iamVjdClcbiAgICAgICAgICB8fCBQYXJzZXIuY29udGFpbnNCaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyKG5vZGUuZXhwcmVzc2lvbik7XG4gICAgICBjYXNlIFwiQ29uZGl0aW9uYWxFeHByZXNzaW9uXCI6XG4gICAgICAgIHJldHVybiBQYXJzZXIuY29udGFpbnNCaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyKG5vZGUudGVzdClcbiAgICAgICAgICB8fCBQYXJzZXIuY29udGFpbnNCaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyKG5vZGUuY29uc2VxdWVudClcbiAgICAgICAgICB8fCBQYXJzZXIuY29udGFpbnNCaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyKG5vZGUuYWx0ZXJuYXRlKTtcbiAgICAgIGNhc2UgXCJQcmVmaXhFeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiUG9zdGZpeEV4cHJlc3Npb25cIjpcbiAgICAgICAgcmV0dXJuIFBhcnNlci5jb250YWluc0JpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXIobm9kZS5vcGVyYW5kKTtcbiAgICAgIGNhc2UgXCJTdGF0aWNNZW1iZXJFeHByZXNzaW9uXCI6XG4gICAgICAgIHJldHVybiBQYXJzZXIuY29udGFpbnNCaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyKG5vZGUub2JqZWN0KTtcbiAgICAgIGNhc2UgXCJUZW1wbGF0ZUV4cHJlc3Npb25cIjpcbiAgICAgICAgcmV0dXJuIG5vZGUuZWxlbWVudHMuc29tZShlID0+IGUudHlwZSAhPT0gXCJUZW1wbGF0ZUVsZW1lbnRcIiAmJiBQYXJzZXIuY29udGFpbnNCaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyKGUpKTtcbiAgICAgIGNhc2UgXCJZaWVsZEV4cHJlc3Npb25cIjpcbiAgICAgICAgcmV0dXJuIG5vZGUuZXhwcmVzc2lvbiAhPSBudWxsICYmIFBhcnNlci5jb250YWluc0JpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXIobm9kZS5leHByZXNzaW9uKTtcbiAgICAgIGNhc2UgXCJZaWVsZEdlbmVyYXRvckV4cHJlc3Npb25cIjpcbiAgICAgIGNhc2UgXCJEYXRhUHJvcGVydHlcIjpcbiAgICAgICAgcmV0dXJuIFBhcnNlci5jb250YWluc0JpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXIobm9kZS5leHByZXNzaW9uKTtcbiAgICB9XG4gIH1cblxuICBwYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCkge1xuICAgIGxldCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuXG4gICAgaWYgKHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gJiYgIXRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXIgJiYgdGhpcy5sb29rYWhlYWQudmFsdWUgPT09IFwieWllbGRcIikge1xuICAgICAgcmV0dXJuIHRoaXMucGFyc2VZaWVsZEV4cHJlc3Npb24oKTtcbiAgICB9XG5cbiAgICBsZXQgcHJldmlvdXNBbGxvd0JpbmRpbmdQYXR0ZXJuID0gdGhpcy5hbGxvd0JpbmRpbmdQYXR0ZXJuO1xuICAgIHRoaXMuYWxsb3dCaW5kaW5nUGF0dGVybiA9IHRydWU7XG5cbiAgICBsZXQgbm9kZSA9IHRoaXMucGFyc2VDb25kaXRpb25hbEV4cHJlc3Npb24oKTtcblxuICAgIHRoaXMuYWxsb3dCaW5kaW5nUGF0dGVybiA9IHByZXZpb3VzQWxsb3dCaW5kaW5nUGF0dGVybjtcblxuICAgIGlmICghdGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQgJiYgdGhpcy5tYXRjaChUb2tlblR5cGUuQVJST1cpKSB7XG4gICAgICByZXR1cm4gdGhpcy5wYXJzZUFycm93RXhwcmVzc2lvblRhaWwobm9kZSwgc3RhcnRMb2NhdGlvbik7XG4gICAgfVxuXG4gICAgbGV0IGlzQXNzaWdubWVudE9wZXJhdG9yID0gZmFsc2U7XG4gICAgbGV0IG9wZXJhdG9yID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgc3dpdGNoIChvcGVyYXRvci50eXBlKSB7XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fQklUX09SOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX0JJVF9YT1I6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fQklUX0FORDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9TSEw6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fU0hSOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX1NIUl9VTlNJR05FRDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9BREQ6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fU1VCOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX01VTDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9ESVY6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fTU9EOlxuICAgICAgICBpc0Fzc2lnbm1lbnRPcGVyYXRvciA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBpZiAoaXNBc3NpZ25tZW50T3BlcmF0b3IpIHtcbiAgICAgIGlmICghUGFyc2VyLmlzVmFsaWRTaW1wbGVBc3NpZ25tZW50VGFyZ2V0KG5vZGUpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5JTlZBTElEX0xIU19JTl9BU1NJR05NRU5UKTtcbiAgICAgIH1cbiAgICAgIGlmIChub2RlLnR5cGUgPT09IFwiSWRlbnRpZmllckV4cHJlc3Npb25cIikge1xuICAgICAgICBpZiAodGhpcy5zdHJpY3QgJiYgaXNSZXN0cmljdGVkV29yZChub2RlLm5hbWUpKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5TVFJJQ1RfTEhTX0FTU0lHTk1FTlQpO1xuICAgICAgICB9XG4gICAgICAgIG5vZGUgPSBQYXJzZXIudHJhbnNmb3JtRGVzdHJ1Y3R1cmluZyhub2RlKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG9wZXJhdG9yLnR5cGUgPT09IFRva2VuVHlwZS5BU1NJR04pIHtcbiAgICAgIGlmICghUGFyc2VyLmlzRGVzdHJ1Y3R1cmluZ1RhcmdldChub2RlLCBQYXJzZXIuaXNWYWxpZFNpbXBsZUFzc2lnbm1lbnRUYXJnZXQpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5JTlZBTElEX0xIU19JTl9BU1NJR05NRU5UKTtcbiAgICAgIH1cbiAgICAgIG5vZGUgPSBQYXJzZXIudHJhbnNmb3JtRGVzdHJ1Y3R1cmluZyhub2RlKTtcblxuICAgICAgbGV0IGJvdW5kID0gUGFyc2VyLmJvdW5kTmFtZXMobm9kZSk7XG4gICAgICBpZiAodGhpcy5zdHJpY3QgJiYgYm91bmQuc29tZShpc1Jlc3RyaWN0ZWRXb3JkKSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLlNUUklDVF9MSFNfQVNTSUdOTUVOVCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICghdGhpcy5hbGxvd0JpbmRpbmdQYXR0ZXJuICYmIFBhcnNlci5jb250YWluc0JpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXIobm9kZSkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKG9wZXJhdG9yKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBub2RlO1xuICAgIH1cblxuICAgIHRoaXMubGV4KCk7XG4gICAgbGV0IHByZXZpb3VzSW5HZW5lcmF0b3JQYXJhbWV0ZXIgPSB0aGlzLmluR2VuZXJhdG9yUGFyYW1ldGVyO1xuICAgIHRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXIgPSBmYWxzZTtcbiAgICBsZXQgcmlnaHQgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICB0aGlzLmluR2VuZXJhdG9yUGFyYW1ldGVyID0gcHJldmlvdXNJbkdlbmVyYXRvclBhcmFtZXRlcjtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkFzc2lnbm1lbnRFeHByZXNzaW9uKG9wZXJhdG9yLnR5cGUubmFtZSwgbm9kZSwgcmlnaHQpLCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIGxvb2thaGVhZEFzc2lnbm1lbnRFeHByZXNzaW9uKCkge1xuICAgIHN3aXRjaCAodGhpcy5sb29rYWhlYWQudHlwZSkge1xuICAgICAgY2FzZSBUb2tlblR5cGUuQUREOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX0RJVjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkNMQVNTOlxuICAgICAgY2FzZSBUb2tlblR5cGUuREVDOlxuICAgICAgY2FzZSBUb2tlblR5cGUuRElWOlxuICAgICAgY2FzZSBUb2tlblR5cGUuRkFMU0U6XG4gICAgICBjYXNlIFRva2VuVHlwZS5GVU5DVElPTjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLklERU5USUZJRVI6XG4gICAgICBjYXNlIFRva2VuVHlwZS5MQlJBQ0U6XG4gICAgICBjYXNlIFRva2VuVHlwZS5MQlJBQ0s6XG4gICAgICBjYXNlIFRva2VuVHlwZS5MUEFSRU46XG4gICAgICBjYXNlIFRva2VuVHlwZS5ORVc6XG4gICAgICBjYXNlIFRva2VuVHlwZS5OT1Q6XG4gICAgICBjYXNlIFRva2VuVHlwZS5OVUxMOlxuICAgICAgY2FzZSBUb2tlblR5cGUuTlVNQkVSOlxuICAgICAgY2FzZSBUb2tlblR5cGUuU1RSSU5HOlxuICAgICAgY2FzZSBUb2tlblR5cGUuU1VCOlxuICAgICAgY2FzZSBUb2tlblR5cGUuVEhJUzpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlRSVUU6XG4gICAgICBjYXNlIFRva2VuVHlwZS5ZSUVMRDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlRFTVBMQVRFOlxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcGFyc2VZaWVsZEV4cHJlc3Npb24oKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICB0aGlzLmxleCgpO1xuICAgIGlmICh0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCkge1xuICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5ZaWVsZEV4cHJlc3Npb24obnVsbCksIHN0YXJ0TG9jYXRpb24pO1xuICAgIH1cbiAgICBsZXQgaXNHZW5lcmF0b3IgPSAhIXRoaXMuZWF0KFRva2VuVHlwZS5NVUwpO1xuICAgIGxldCBwcmV2aW91c1lpZWxkID0gdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbjtcbiAgICBsZXQgZXhwciA9IG51bGw7XG4gICAgaWYgKGlzR2VuZXJhdG9yIHx8IHRoaXMubG9va2FoZWFkQXNzaWdubWVudEV4cHJlc3Npb24oKSkge1xuICAgICAgZXhwciA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgIH1cbiAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gcHJldmlvdXNZaWVsZDtcbiAgICBsZXQgQ3RvciA9IGlzR2VuZXJhdG9yID8gU2hpZnQuWWllbGRHZW5lcmF0b3JFeHByZXNzaW9uIDogU2hpZnQuWWllbGRFeHByZXNzaW9uO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgQ3RvcihleHByKSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZUNvbmRpdGlvbmFsRXhwcmVzc2lvbigpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgZXhwciA9IHRoaXMucGFyc2VCaW5hcnlFeHByZXNzaW9uKCk7XG4gICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5DT05ESVRJT05BTCkpIHtcbiAgICAgIGxldCBwcmV2aW91c0FsbG93SW4gPSB0aGlzLmFsbG93SW47XG4gICAgICB0aGlzLmFsbG93SW4gPSB0cnVlO1xuICAgICAgbGV0IGNvbnNlcXVlbnQgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgIHRoaXMuYWxsb3dJbiA9IHByZXZpb3VzQWxsb3dJbjtcbiAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5DT0xPTik7XG4gICAgICBsZXQgYWx0ZXJuYXRlID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkNvbmRpdGlvbmFsRXhwcmVzc2lvbihleHByLCBjb25zZXF1ZW50LCBhbHRlcm5hdGUpLCBzdGFydExvY2F0aW9uKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZXhwcjtcbiAgfVxuXG4gIGlzQmluYXJ5T3BlcmF0b3IodHlwZSkge1xuICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgY2FzZSBUb2tlblR5cGUuT1I6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BTkQ6XG4gICAgICBjYXNlIFRva2VuVHlwZS5CSVRfT1I6XG4gICAgICBjYXNlIFRva2VuVHlwZS5CSVRfWE9SOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQklUX0FORDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkVROlxuICAgICAgY2FzZSBUb2tlblR5cGUuTkU6XG4gICAgICBjYXNlIFRva2VuVHlwZS5FUV9TVFJJQ1Q6XG4gICAgICBjYXNlIFRva2VuVHlwZS5ORV9TVFJJQ1Q6XG4gICAgICBjYXNlIFRva2VuVHlwZS5MVDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkdUOlxuICAgICAgY2FzZSBUb2tlblR5cGUuTFRFOlxuICAgICAgY2FzZSBUb2tlblR5cGUuR1RFOlxuICAgICAgY2FzZSBUb2tlblR5cGUuSU5TVEFOQ0VPRjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlNITDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlNIUjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlNIUl9VTlNJR05FRDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFERDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlNVQjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk1VTDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkRJVjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk1PRDpcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICBjYXNlIFRva2VuVHlwZS5JTjpcbiAgICAgICAgcmV0dXJuIHRoaXMuYWxsb3dJbjtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBwYXJzZUJpbmFyeUV4cHJlc3Npb24oKSB7XG4gICAgbGV0IGxvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCBsZWZ0ID0gdGhpcy5wYXJzZVVuYXJ5RXhwcmVzc2lvbigpO1xuICAgIGxldCBvcGVyYXRvciA9IHRoaXMubG9va2FoZWFkLnR5cGU7XG5cbiAgICBsZXQgaXNCaW5hcnlPcGVyYXRvciA9IHRoaXMuaXNCaW5hcnlPcGVyYXRvcihvcGVyYXRvcik7XG4gICAgaWYgKCFpc0JpbmFyeU9wZXJhdG9yKSB7XG4gICAgICByZXR1cm4gbGVmdDtcbiAgICB9XG5cbiAgICB0aGlzLmxleCgpO1xuICAgIGxldCBzdGFjayA9IFtdO1xuICAgIHN0YWNrLnB1c2goe2xvY2F0aW9uLCBsZWZ0LCBvcGVyYXRvciwgcHJlY2VkZW5jZTogQmluYXJ5UHJlY2VkZW5jZVtvcGVyYXRvci5uYW1lXX0pO1xuICAgIGxvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCByaWdodCA9IHRoaXMucGFyc2VVbmFyeUV4cHJlc3Npb24oKTtcblxuICAgIG9wZXJhdG9yID0gdGhpcy5sb29rYWhlYWQudHlwZTtcbiAgICBpc0JpbmFyeU9wZXJhdG9yID0gdGhpcy5pc0JpbmFyeU9wZXJhdG9yKHRoaXMubG9va2FoZWFkLnR5cGUpO1xuICAgIHdoaWxlIChpc0JpbmFyeU9wZXJhdG9yKSB7XG4gICAgICBsZXQgcHJlY2VkZW5jZSA9IEJpbmFyeVByZWNlZGVuY2Vbb3BlcmF0b3IubmFtZV07XG4gICAgICAvLyBSZWR1Y2U6IG1ha2UgYSBiaW5hcnkgZXhwcmVzc2lvbiBmcm9tIHRoZSB0aHJlZSB0b3Btb3N0IGVudHJpZXMuXG4gICAgICB3aGlsZSAoc3RhY2subGVuZ3RoICYmIHByZWNlZGVuY2UgPD0gc3RhY2tbc3RhY2subGVuZ3RoIC0gMV0ucHJlY2VkZW5jZSkge1xuICAgICAgICBsZXQgc3RhY2tJdGVtID0gc3RhY2tbc3RhY2subGVuZ3RoIC0gMV07XG4gICAgICAgIGxldCBzdGFja09wZXJhdG9yID0gc3RhY2tJdGVtLm9wZXJhdG9yO1xuICAgICAgICBsZWZ0ID0gc3RhY2tJdGVtLmxlZnQ7XG4gICAgICAgIHN0YWNrLnBvcCgpO1xuICAgICAgICBsb2NhdGlvbiA9IHN0YWNrSXRlbS5sb2NhdGlvbjtcbiAgICAgICAgcmlnaHQgPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQmluYXJ5RXhwcmVzc2lvbihzdGFja09wZXJhdG9yLm5hbWUsIGxlZnQsIHJpZ2h0KSwgbG9jYXRpb24pO1xuICAgICAgfVxuXG4gICAgICAvLyBTaGlmdC5cbiAgICAgIHRoaXMubGV4KCk7XG4gICAgICBzdGFjay5wdXNoKHtsb2NhdGlvbiwgbGVmdDogcmlnaHQsIG9wZXJhdG9yLCBwcmVjZWRlbmNlfSk7XG4gICAgICBsb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICAgIHJpZ2h0ID0gdGhpcy5wYXJzZVVuYXJ5RXhwcmVzc2lvbigpO1xuXG4gICAgICBvcGVyYXRvciA9IHRoaXMubG9va2FoZWFkLnR5cGU7XG4gICAgICBpc0JpbmFyeU9wZXJhdG9yID0gdGhpcy5pc0JpbmFyeU9wZXJhdG9yKG9wZXJhdG9yKTtcbiAgICB9XG5cbiAgICAvLyBGaW5hbCByZWR1Y2UgdG8gY2xlYW4tdXAgdGhlIHN0YWNrLlxuICAgIHJldHVybiBzdGFjay5yZWR1Y2VSaWdodCgoZXhwciwgc3RhY2tJdGVtKSA9PlxuICAgICAgdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkJpbmFyeUV4cHJlc3Npb24oc3RhY2tJdGVtLm9wZXJhdG9yLm5hbWUsIHN0YWNrSXRlbS5sZWZ0LCBleHByKSwgc3RhY2tJdGVtLmxvY2F0aW9uKSxcbiAgICAgIHJpZ2h0KTtcbiAgfVxuXG4gIHN0YXRpYyBpc1ByZWZpeE9wZXJhdG9yKHR5cGUpIHtcbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLklOQzpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkRFQzpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFERDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlNVQjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkJJVF9OT1Q6XG4gICAgICBjYXNlIFRva2VuVHlwZS5OT1Q6XG4gICAgICBjYXNlIFRva2VuVHlwZS5ERUxFVEU6XG4gICAgICBjYXNlIFRva2VuVHlwZS5WT0lEOlxuICAgICAgY2FzZSBUb2tlblR5cGUuVFlQRU9GOlxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcGFyc2VVbmFyeUV4cHJlc3Npb24oKSB7XG4gICAgaWYgKHRoaXMubG9va2FoZWFkLnR5cGUua2xhc3MgIT09IFRva2VuQ2xhc3MuUHVuY3R1YXRvciAmJiB0aGlzLmxvb2thaGVhZC50eXBlLmtsYXNzICE9PSBUb2tlbkNsYXNzLktleXdvcmQpIHtcbiAgICAgIHJldHVybiB0aGlzLnBhcnNlUG9zdGZpeEV4cHJlc3Npb24oKTtcbiAgICB9XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IG9wZXJhdG9yID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgaWYgKCFQYXJzZXIuaXNQcmVmaXhPcGVyYXRvcihvcGVyYXRvci50eXBlKSkge1xuICAgICAgcmV0dXJuIHRoaXMucGFyc2VQb3N0Zml4RXhwcmVzc2lvbigpO1xuICAgIH1cbiAgICB0aGlzLmxleCgpO1xuICAgIGxldCBleHByID0gdGhpcy5wYXJzZVVuYXJ5RXhwcmVzc2lvbigpO1xuICAgIHN3aXRjaCAob3BlcmF0b3IudHlwZSkge1xuICAgICAgY2FzZSBUb2tlblR5cGUuSU5DOlxuICAgICAgY2FzZSBUb2tlblR5cGUuREVDOlxuICAgICAgICAvLyAxMS40LjQsIDExLjQuNTtcbiAgICAgICAgaWYgKGV4cHIudHlwZSA9PT0gXCJJZGVudGlmaWVyRXhwcmVzc2lvblwiKSB7XG4gICAgICAgICAgaWYgKHRoaXMuc3RyaWN0ICYmIGlzUmVzdHJpY3RlZFdvcmQoZXhwci5uYW1lKSkge1xuICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlNUUklDVF9MSFNfUFJFRklYKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIVBhcnNlci5pc1ZhbGlkU2ltcGxlQXNzaWdubWVudFRhcmdldChleHByKSkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5JTlZBTElEX0xIU19JTl9BU1NJR05NRU5UKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkRFTEVURTpcbiAgICAgICAgaWYgKGV4cHIudHlwZSA9PT0gXCJJZGVudGlmaWVyRXhwcmVzc2lvblwiICYmIHRoaXMuc3RyaWN0KSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlNUUklDVF9ERUxFVEUpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5QcmVmaXhFeHByZXNzaW9uKG9wZXJhdG9yLnZhbHVlLCBleHByKSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZVBvc3RmaXhFeHByZXNzaW9uKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuXG4gICAgbGV0IGV4cHIgPSB0aGlzLnBhcnNlTGVmdEhhbmRTaWRlRXhwcmVzc2lvbih7YWxsb3dDYWxsOiB0cnVlfSk7XG5cbiAgICBpZiAodGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQpIHtcbiAgICAgIHJldHVybiBleHByO1xuICAgIH1cblxuICAgIGxldCBvcGVyYXRvciA9IHRoaXMubG9va2FoZWFkO1xuICAgIGlmIChvcGVyYXRvci50eXBlICE9PSBUb2tlblR5cGUuSU5DICYmIG9wZXJhdG9yLnR5cGUgIT09IFRva2VuVHlwZS5ERUMpIHtcbiAgICAgIHJldHVybiBleHByO1xuICAgIH1cbiAgICB0aGlzLmxleCgpO1xuICAgIC8vIDExLjMuMSwgMTEuMy4yO1xuICAgIGlmIChleHByLnR5cGUgPT09IFwiSWRlbnRpZmllckV4cHJlc3Npb25cIikge1xuICAgICAgaWYgKHRoaXMuc3RyaWN0ICYmIGlzUmVzdHJpY3RlZFdvcmQoZXhwci5uYW1lKSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX0xIU19QT1NURklYKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFQYXJzZXIuaXNWYWxpZFNpbXBsZUFzc2lnbm1lbnRUYXJnZXQoZXhwcikpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5JTlZBTElEX0xIU19JTl9BU1NJR05NRU5UKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5Qb3N0Zml4RXhwcmVzc2lvbihleHByLCBvcGVyYXRvci52YWx1ZSksIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uKHthbGxvd0NhbGx9KSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IHByZXZpb3VzQWxsb3dJbiA9IHRoaXMuYWxsb3dJbjtcbiAgICB0aGlzLmFsbG93SW4gPSBhbGxvd0NhbGw7XG5cbiAgICBsZXQgZXhwciwgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcblxuICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuU1VQRVIpKSB7XG4gICAgICBleHByID0gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlN1cGVyLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5MUEFSRU4pKSB7XG4gICAgICAgIGlmIChhbGxvd0NhbGwpIHtcbiAgICAgICAgICBpZiAodGhpcy5pbkNvbnN0cnVjdG9yICYmICF0aGlzLmluUGFyYW1ldGVyKSB7XG4gICAgICAgICAgICBleHByID0gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkNhbGxFeHByZXNzaW9uKGV4cHIsIHRoaXMucGFyc2VBcmd1bWVudExpc3QoKSksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHN0YXJ0TG9jYXRpb24sIEVycm9yTWVzc2FnZXMuVU5FWFBFQ1RFRF9TVVBFUl9DQUxMKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRva2VuKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5MQlJBQ0spKSB7XG4gICAgICAgIGlmICh0aGlzLmluTWV0aG9kICYmICF0aGlzLmluUGFyYW1ldGVyKSB7XG4gICAgICAgICAgZXhwciA9IHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5Db21wdXRlZE1lbWJlckV4cHJlc3Npb24oZXhwciwgdGhpcy5wYXJzZUNvbXB1dGVkTWVtYmVyKCkpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHN0YXJ0TG9jYXRpb24sIEVycm9yTWVzc2FnZXMuVU5FWFBFQ1RFRF9TVVBFUl9QUk9QRVJUWSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuUEVSSU9EKSkge1xuICAgICAgICBpZiAodGhpcy5pbk1ldGhvZCAmJiAhdGhpcy5pblBhcmFtZXRlcikge1xuICAgICAgICAgIGV4cHIgPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuU3RhdGljTWVtYmVyRXhwcmVzc2lvbihleHByLCB0aGlzLnBhcnNlTm9uQ29tcHV0ZWRNZW1iZXIoKSksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24oc3RhcnRMb2NhdGlvbiwgRXJyb3JNZXNzYWdlcy5VTkVYUEVDVEVEX1NVUEVSX1BST1BFUlRZKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRva2VuKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLk5FVykpIHtcbiAgICAgIGV4cHIgPSB0aGlzLnBhcnNlTmV3RXhwcmVzc2lvbigpO1xuICAgIH0gZWxzZSB7XG4gICAgICBleHByID0gdGhpcy5wYXJzZVByaW1hcnlFeHByZXNzaW9uKCk7XG4gICAgfVxuXG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGlmIChhbGxvd0NhbGwgJiYgdGhpcy5tYXRjaChUb2tlblR5cGUuTFBBUkVOKSkge1xuICAgICAgICBleHByID0gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkNhbGxFeHByZXNzaW9uKGV4cHIsIHRoaXMucGFyc2VBcmd1bWVudExpc3QoKSksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5MQlJBQ0spKSB7XG4gICAgICAgIGV4cHIgPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQ29tcHV0ZWRNZW1iZXJFeHByZXNzaW9uKGV4cHIsIHRoaXMucGFyc2VDb21wdXRlZE1lbWJlcigpKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLlBFUklPRCkpIHtcbiAgICAgICAgZXhwciA9IHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5TdGF0aWNNZW1iZXJFeHByZXNzaW9uKGV4cHIsIHRoaXMucGFyc2VOb25Db21wdXRlZE1lbWJlcigpKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLlRFTVBMQVRFKSkge1xuICAgICAgICBleHByID0gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlRlbXBsYXRlRXhwcmVzc2lvbihleHByLCB0aGlzLnBhcnNlVGVtcGxhdGVFbGVtZW50cygpKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmFsbG93SW4gPSBwcmV2aW91c0FsbG93SW47XG5cbiAgICByZXR1cm4gZXhwcjtcbiAgfVxuXG4gIHBhcnNlVGVtcGxhdGVFbGVtZW50cygpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICBpZiAodG9rZW4udGFpbCkge1xuICAgICAgdGhpcy5sZXgoKTtcbiAgICAgIHJldHVybiBbdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlRlbXBsYXRlRWxlbWVudCh0b2tlbi52YWx1ZS5zbGljZSgxLCAtMSkpLCBzdGFydExvY2F0aW9uKV07XG4gICAgfVxuICAgIGxldCByZXN1bHQgPSBbdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlRlbXBsYXRlRWxlbWVudCh0aGlzLmxleCgpLnZhbHVlLnNsaWNlKDEsIC0yKSksIHN0YXJ0TG9jYXRpb24pXTtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgcmVzdWx0LnB1c2godGhpcy5wYXJzZUV4cHJlc3Npb24oKSk7XG4gICAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJCUkFDRSkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICB9XG4gICAgICB0aGlzLmluZGV4ID0gdGhpcy5zdGFydEluZGV4O1xuICAgICAgdGhpcy5saW5lID0gdGhpcy5zdGFydExpbmU7XG4gICAgICB0aGlzLmxpbmVTdGFydCA9IHRoaXMuc3RhcnRMaW5lU3RhcnQ7XG4gICAgICB0aGlzLmxvb2thaGVhZCA9IHRoaXMuc2NhblRlbXBsYXRlRWxlbWVudCgpO1xuICAgICAgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICAgIHRva2VuID0gdGhpcy5sZXgoKTtcbiAgICAgIGlmICh0b2tlbi50YWlsKSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5UZW1wbGF0ZUVsZW1lbnQodG9rZW4udmFsdWUuc2xpY2UoMSwgLTEpKSwgc3RhcnRMb2NhdGlvbikpO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0LnB1c2godGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlRlbXBsYXRlRWxlbWVudCh0b2tlbi52YWx1ZS5zbGljZSgxLCAtMikpLCBzdGFydExvY2F0aW9uKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcGFyc2VOb25Db21wdXRlZE1lbWJlcigpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUEVSSU9EKTtcbiAgICBpZiAoIXRoaXMubG9va2FoZWFkLnR5cGUua2xhc3MuaXNJZGVudGlmaWVyTmFtZSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMubGV4KCkudmFsdWU7XG4gICAgfVxuICB9XG5cbiAgcGFyc2VDb21wdXRlZE1lbWJlcigpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTEJSQUNLKTtcbiAgICBsZXQgZXhwciA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJCUkFDSyk7XG4gICAgcmV0dXJuIGV4cHI7XG4gIH1cblxuICBwYXJzZU5ld0V4cHJlc3Npb24oKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLk5FVyk7XG4gICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5QRVJJT0QpKSB7XG4gICAgICBsZXQgaWRlbnQgPSB0aGlzLmV4cGVjdChUb2tlblR5cGUuSURFTlRJRklFUik7XG4gICAgICBpZiAoaWRlbnQudmFsdWUgIT09IFwidGFyZ2V0XCIpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKGlkZW50KTtcbiAgICAgIH0gZWxzZSBpZiAoIXRoaXMuaW5GdW5jdGlvbkJvZHkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbihzdGFydExvY2F0aW9uLCBFcnJvck1lc3NhZ2VzLlVORVhQRUNURURfTkVXX1RBUkdFVCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0Lk5ld1RhcmdldEV4cHJlc3Npb24sIHN0YXJ0TG9jYXRpb24pO1xuICAgIH1cbiAgICBsZXQgY2FsbGVlID0gdGhpcy5wYXJzZUxlZnRIYW5kU2lkZUV4cHJlc3Npb24oe2FsbG93Q2FsbDogZmFsc2V9KTtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0Lk5ld0V4cHJlc3Npb24oXG4gICAgICBjYWxsZWUsXG4gICAgICB0aGlzLm1hdGNoKFRva2VuVHlwZS5MUEFSRU4pID8gdGhpcy5wYXJzZUFyZ3VtZW50TGlzdCgpIDogW11cbiAgICApLCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlUHJpbWFyeUV4cHJlc3Npb24oKSB7XG4gICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkxQQVJFTikpIHtcbiAgICAgIHJldHVybiB0aGlzLnBhcnNlR3JvdXBFeHByZXNzaW9uKCk7XG4gICAgfVxuXG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICBzd2l0Y2ggKHRoaXMubG9va2FoZWFkLnR5cGUpIHtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLllJRUxEOlxuICAgICAgY2FzZSBUb2tlblR5cGUuSURFTlRJRklFUjpcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJJZGVudGlmaWVyRXhwcmVzc2lvblwiLCBuYW1lOiB0aGlzLnBhcnNlSWRlbnRpZmllcigpIH0sIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgY2FzZSBUb2tlblR5cGUuU1RSSU5HOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZVN0cmluZ0xpdGVyYWwoKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk5VTUJFUjpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VOdW1lcmljTGl0ZXJhbCgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuVEhJUzpcbiAgICAgICAgdGhpcy5sZXgoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5UaGlzRXhwcmVzc2lvbiwgc3RhcnRMb2NhdGlvbik7XG4gICAgICBjYXNlIFRva2VuVHlwZS5GVU5DVElPTjpcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHRoaXMucGFyc2VGdW5jdGlvbih7aXNFeHByOiB0cnVlfSksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgY2FzZSBUb2tlblR5cGUuVFJVRTpcbiAgICAgICAgdGhpcy5sZXgoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5MaXRlcmFsQm9vbGVhbkV4cHJlc3Npb24odHJ1ZSksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgY2FzZSBUb2tlblR5cGUuRkFMU0U6XG4gICAgICAgIHRoaXMubGV4KCk7XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuTGl0ZXJhbEJvb2xlYW5FeHByZXNzaW9uKGZhbHNlKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICBjYXNlIFRva2VuVHlwZS5OVUxMOlxuICAgICAgICB0aGlzLmxleCgpO1xuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkxpdGVyYWxOdWxsRXhwcmVzc2lvbiwgc3RhcnRMb2NhdGlvbik7XG4gICAgICBjYXNlIFRva2VuVHlwZS5MQlJBQ0s6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlQXJyYXlFeHByZXNzaW9uKCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5MQlJBQ0U6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlT2JqZWN0RXhwcmVzc2lvbigpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuVEVNUExBVEU6XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuVGVtcGxhdGVFeHByZXNzaW9uKG51bGwsIHRoaXMucGFyc2VUZW1wbGF0ZUVsZW1lbnRzKCkpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkRJVjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9ESVY6XG4gICAgICAgIHRoaXMubG9va2FoZWFkID0gdGhpcy5zY2FuUmVnRXhwKHRoaXMubG9va2FoZWFkLnR5cGUgPT09IFRva2VuVHlwZS5ESVYgPyBcIi9cIiA6IFwiLz1cIik7XG4gICAgICAgIGxldCB0b2tlbiA9IHRoaXMubGV4KCk7XG4gICAgICAgIGxldCBsYXN0U2xhc2ggPSB0b2tlbi52YWx1ZS5sYXN0SW5kZXhPZihcIi9cIik7XG4gICAgICAgIGxldCBwYXR0ZXJuID0gdG9rZW4udmFsdWUuc2xpY2UoMSwgbGFzdFNsYXNoKS5yZXBsYWNlKFwiXFxcXC9cIiwgXCIvXCIpO1xuICAgICAgICBsZXQgZmxhZ3MgPSB0b2tlbi52YWx1ZS5zbGljZShsYXN0U2xhc2ggKyAxKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBSZWdFeHAocGF0dGVybiwgZmxhZ3MpO1xuICAgICAgICB9IGNhdGNoICh1bnVzZWQpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLklOVkFMSURfUkVHVUxBUl9FWFBSRVNTSU9OKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkxpdGVyYWxSZWdFeHBFeHByZXNzaW9uKHBhdHRlcm4sIGZsYWdzKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICBjYXNlIFRva2VuVHlwZS5DTEFTUzpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VDbGFzcyh7aXNFeHByOiB0cnVlfSk7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sZXgoKSk7XG4gICAgfVxuICB9XG5cbiAgcGFyc2VOdW1lcmljTGl0ZXJhbCgpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBpZiAodGhpcy5zdHJpY3QgJiYgdGhpcy5sb29rYWhlYWQub2N0YWwpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odGhpcy5sb29rYWhlYWQsIEVycm9yTWVzc2FnZXMuU1RSSUNUX09DVEFMX0xJVEVSQUwpO1xuICAgIH1cbiAgICBsZXQgdG9rZW4yID0gdGhpcy5sZXgoKTtcbiAgICBsZXQgbm9kZSA9IHRva2VuMi5fdmFsdWUgPT09IDEvMFxuICAgICAgPyBuZXcgU2hpZnQuTGl0ZXJhbEluZmluaXR5RXhwcmVzc2lvblxuICAgICAgOiBuZXcgU2hpZnQuTGl0ZXJhbE51bWVyaWNFeHByZXNzaW9uKHRva2VuMi5fdmFsdWUpO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihub2RlLCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlU3RyaW5nTGl0ZXJhbCgpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBpZiAodGhpcy5zdHJpY3QgJiYgdGhpcy5sb29rYWhlYWQub2N0YWwpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odGhpcy5sb29rYWhlYWQsIEVycm9yTWVzc2FnZXMuU1RSSUNUX09DVEFMX0xJVEVSQUwpO1xuICAgIH1cbiAgICBsZXQgdG9rZW4yID0gdGhpcy5sZXgoKTtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkxpdGVyYWxTdHJpbmdFeHByZXNzaW9uKHRva2VuMi5fdmFsdWUsIHRva2VuMi5zbGljZS50ZXh0KSxcbiAgICAgICAgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZUlkZW50aWZpZXJOYW1lKCkge1xuICAgIGlmICh0aGlzLmxvb2thaGVhZC50eXBlLmtsYXNzLmlzSWRlbnRpZmllck5hbWUpIHtcbiAgICAgIHJldHVybiB0aGlzLmxleCgpLnZhbHVlO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuICAgIH1cbiAgfVxuXG4gIHBhcnNlQmluZGluZ0lkZW50aWZpZXIoKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJCaW5kaW5nSWRlbnRpZmllclwiLCBuYW1lOiB0aGlzLnBhcnNlSWRlbnRpZmllcigpIH0sIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VJZGVudGlmaWVyKCkge1xuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5ZSUVMRCkpIHtcbiAgICAgIGlmICh0aGlzLnN0cmljdCkge1xuICAgICAgICB0aGlzLmxvb2thaGVhZC50eXBlID0gVG9rZW5UeXBlLllJRUxEO1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuaW5HZW5lcmF0b3JCb2R5KSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5sZXgoKS52YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5JREVOVElGSUVSKS52YWx1ZTtcbiAgfVxuXG4gIHBhcnNlQXJndW1lbnRMaXN0KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MUEFSRU4pO1xuICAgIGxldCBhcmdzID0gdGhpcy5wYXJzZUFyZ3VtZW50cygpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgIHJldHVybiBhcmdzO1xuICB9XG5cbiAgcGFyc2VBcmd1bWVudHMoKSB7XG4gICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuUlBBUkVOKSB8fCB0aGlzLmVvZigpKSB7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9XG4gICAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICAgIGxldCBhcmc7XG4gICAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLkVMTElQU0lTKSkge1xuICAgICAgICBhcmcgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgICAgYXJnID0gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlNwcmVhZEVsZW1lbnQoYXJnKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhcmcgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgIH1cbiAgICAgIHJlc3VsdC5wdXNoKGFyZyk7XG4gICAgICBpZiAoIXRoaXMuZWF0KFRva2VuVHlwZS5DT01NQSkpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvLyAxMS4yIExlZnQtSGFuZC1TaWRlIEV4cHJlc3Npb25zO1xuXG4gIGVuc3VyZUFycm93KCkge1xuICAgIGlmICh0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlVORVhQRUNURURfTElORV9URVJNSU5BVE9SKTtcbiAgICB9XG4gICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5BUlJPVykpIHtcbiAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5BUlJPVyk7XG4gICAgfVxuICB9XG5cbiAgcGFyc2VHcm91cEV4cHJlc3Npb24oKSB7XG4gICAgbGV0IHJlc3QgPSBudWxsO1xuICAgIGxldCBzdGFydCA9IHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MUEFSRU4pO1xuICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuUlBBUkVOKSkge1xuICAgICAgdGhpcy5lbnN1cmVBcnJvdygpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogQVJST1dfRVhQUkVTU0lPTl9QQVJBTVMsXG4gICAgICAgIHBhcmFtczogW10sXG4gICAgICAgIHJlc3Q6IG51bGxcbiAgICAgIH07XG4gICAgfSBlbHNlIGlmICh0aGlzLmVhdChUb2tlblR5cGUuRUxMSVBTSVMpKSB7XG4gICAgICByZXN0ID0gdGhpcy5wYXJzZUJpbmRpbmdJZGVudGlmaWVyKCk7XG4gICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcbiAgICAgIHRoaXMuZW5zdXJlQXJyb3coKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6IEFSUk9XX0VYUFJFU1NJT05fUEFSQU1TLFxuICAgICAgICBwYXJhbXM6IFtdLFxuICAgICAgICByZXN0OiByZXN0XG4gICAgICB9O1xuICAgIH1cblxuICAgIGxldCBwb3NzaWJsZUJpbmRpbmdzID0gIXRoaXMubWF0Y2goVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IGdyb3VwID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgbGV0IHBhcmFtcyA9IFtncm91cF07XG5cbiAgICB3aGlsZSAodGhpcy5lYXQoVG9rZW5UeXBlLkNPTU1BKSkge1xuICAgICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkVMTElQU0lTKSkge1xuICAgICAgICBpZiAoIXBvc3NpYmxlQmluZGluZ3MpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubGV4KCk7XG4gICAgICAgIHJlc3QgPSB0aGlzLnBhcnNlQmluZGluZ0lkZW50aWZpZXIoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBwb3NzaWJsZUJpbmRpbmdzID0gcG9zc2libGVCaW5kaW5ncyAmJiAhdGhpcy5tYXRjaChUb2tlblR5cGUuTFBBUkVOKTtcbiAgICAgIGxldCBleHByID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgICBwYXJhbXMucHVzaChleHByKTtcbiAgICAgIGdyb3VwID0gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkJpbmFyeUV4cHJlc3Npb24oXCIsXCIsIGdyb3VwLCBleHByKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgfVxuXG4gICAgaWYgKHBvc3NpYmxlQmluZGluZ3MpIHtcbiAgICAgIHBvc3NpYmxlQmluZGluZ3MgPSBwYXJhbXMuZXZlcnkoZSA9PlxuICAgICAgICBQYXJzZXIuaXNEZXN0cnVjdHVyaW5nVGFyZ2V0V2l0aERlZmF1bHQoZSwgUGFyc2VyLmlzVmFsaWRTaW1wbGVCaW5kaW5nVGFyZ2V0KSk7XG4gICAgfVxuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJQQVJFTik7XG5cbiAgICBpZiAoIXRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0ICYmIHRoaXMubWF0Y2goVG9rZW5UeXBlLkFSUk9XKSkge1xuICAgICAgaWYgKCFwb3NzaWJsZUJpbmRpbmdzKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24oc3RhcnQsIEVycm9yTWVzc2FnZXMuSUxMRUdBTF9BUlJPV19GVU5DVElPTl9QQVJBTVMpO1xuICAgICAgfVxuICAgICAgLy8gY2hlY2sgZHVwIHBhcmFtc1xuICAgICAgcGFyYW1zID0gcGFyYW1zLm1hcChQYXJzZXIudHJhbnNmb3JtRGVzdHJ1Y3R1cmluZyk7XG4gICAgICBsZXQgYWxsQm91bmROYW1lcyA9IFtdO1xuICAgICAgcGFyYW1zLmZvckVhY2goZXhwciA9PiB7XG4gICAgICAgIGxldCBib3VuZE5hbWVzID0gUGFyc2VyLmJvdW5kTmFtZXMoZXhwcik7XG4gICAgICAgIGxldCBkdXAgPSBmaXJzdER1cGxpY2F0ZShib3VuZE5hbWVzKTtcbiAgICAgICAgaWYgKGR1cCkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5EVVBMSUNBVEVfQklORElORywgZHVwKTtcbiAgICAgICAgfVxuICAgICAgICBhbGxCb3VuZE5hbWVzID0gYWxsQm91bmROYW1lcy5jb25jYXQoYm91bmROYW1lcyk7XG4gICAgICB9KTtcbiAgICAgIGlmIChyZXN0KSB7XG4gICAgICAgIGFsbEJvdW5kTmFtZXMucHVzaChyZXN0Lm5hbWUpO1xuICAgICAgfVxuXG4gICAgICBpZiAoZmlyc3REdXBsaWNhdGUoYWxsQm91bmROYW1lcykgIT0gbnVsbCkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX1BBUkFNX0RVUEUpO1xuICAgICAgfVxuXG4gICAgICBsZXQgc3RyaWN0UmVzdHJpY3RlZFdvcmQgPSBhbGxCb3VuZE5hbWVzLnNvbWUoaXNSZXN0cmljdGVkV29yZCk7XG4gICAgICBpZiAoc3RyaWN0UmVzdHJpY3RlZFdvcmQpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlNUUklDVF9QQVJBTV9OQU1FKTtcbiAgICAgIH1cblxuICAgICAgbGV0IHN0cmljdFJlc2VydmVkV29yZCA9IGhhc1N0cmljdE1vZGVSZXNlcnZlZFdvcmQoYWxsQm91bmROYW1lcyk7XG4gICAgICBpZiAoc3RyaWN0UmVzZXJ2ZWRXb3JkKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUkVTRVJWRURfV09SRCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6IEFSUk9XX0VYUFJFU1NJT05fUEFSQU1TLFxuICAgICAgICBwYXJhbXMsXG4gICAgICAgIHJlc3RcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChyZXN0KSB7XG4gICAgICAgIHRoaXMuZW5zdXJlQXJyb3coKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBncm91cDtcbiAgICB9XG4gIH1cblxuXG4gIHBhcnNlQXJyYXlFeHByZXNzaW9uKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxCUkFDSyk7XG5cbiAgICBsZXQgZWxlbWVudHMgPSB0aGlzLnBhcnNlQXJyYXlFeHByZXNzaW9uRWxlbWVudHMoKTtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SQlJBQ0spO1xuXG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5BcnJheUV4cHJlc3Npb24oZWxlbWVudHMpLCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlQXJyYXlFeHByZXNzaW9uRWxlbWVudHMoKSB7XG4gICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuUkJSQUNLKSkge1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfVxuICAgICAgbGV0IGVsO1xuXG4gICAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLkNPTU1BKSkge1xuICAgICAgICBlbCA9IG51bGw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICAgICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5FTExJUFNJUykpIHtcbiAgICAgICAgICBlbCA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgICAgIGVsID0gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlNwcmVhZEVsZW1lbnQoZWwpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbCA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuUkJSQUNLKSkge1xuICAgICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5DT01NQSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJlc3VsdC5wdXNoKGVsKTtcbiAgICB9XG4gIH1cblxuICBwYXJzZU9iamVjdEV4cHJlc3Npb24oKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTEJSQUNFKTtcblxuICAgIGxldCBwcm9wZXJ0aWVzID0gdGhpcy5wYXJzZU9iamVjdEV4cHJlc3Npb25JdGVtcygpO1xuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJCUkFDRSk7XG5cbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0Lk9iamVjdEV4cHJlc3Npb24ocHJvcGVydGllcyksIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cblxuICBwYXJzZU9iamVjdEV4cHJlc3Npb25JdGVtcygpIHtcbiAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgbGV0IGhhc19fcHJvdG9fXyA9IFtmYWxzZV07XG4gICAgd2hpbGUgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0UpKSB7XG4gICAgICByZXN1bHQucHVzaCh0aGlzLnBhcnNlUHJvcGVydHlEZWZpbml0aW9uKGhhc19fcHJvdG9fXykpO1xuICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0UpKSB7XG4gICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5DT01NQSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBwYXJzZVByb3BlcnR5RGVmaW5pdGlvbihoYXNfX3Byb3RvX18pIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcblxuICAgIGxldCB7bWV0aG9kT3JLZXksIGtpbmR9ID0gdGhpcy5wYXJzZU1ldGhvZERlZmluaXRpb24oZmFsc2UpO1xuICAgIHN3aXRjaCAoa2luZCkge1xuICAgICAgY2FzZSBcIm1ldGhvZFwiOlxuICAgICAgICByZXR1cm4gbWV0aG9kT3JLZXk7XG4gICAgICBjYXNlIFwiaWRlbnRpZmllclwiOiAvLyBJZGVudGlmaWVyUmVmZXJlbmNlLFxuICAgICAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLkFTU0lHTikpIHtcbiAgICAgICAgICAvLyBDb3ZlckluaXRpYWxpemVkTmFtZVxuICAgICAgICAgIGlmICgodGhpcy5zdHJpY3QgfHwgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbikgJiYgbWV0aG9kT3JLZXkudmFsdWUgPT09IFwieWllbGRcIikge1xuICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRva2VuKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJCaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyXCIsXG4gICAgICAgICAgICBiaW5kaW5nOiB0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiQmluZGluZ0lkZW50aWZpZXJcIiwgbmFtZTogbWV0aG9kT3JLZXkudmFsdWUgfSwgc3RhcnRMb2NhdGlvbiksXG4gICAgICAgICAgICBpbml0OiB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKSxcbiAgICAgICAgICB9LCBzdGFydExvY2F0aW9uKTtcbiAgICAgICAgfSBlbHNlIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuQ09MT04pKSB7XG4gICAgICAgICAgaWYgKHRva2VuLnR5cGUgIT09IFRva2VuVHlwZS5JREVOVElGSUVSICYmIHRva2VuLnR5cGUgIT09IFRva2VuVHlwZS5ZSUVMRCB8fFxuICAgICAgICAgICAgKHRoaXMuc3RyaWN0IHx8IHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24pICYmIG1ldGhvZE9yS2V5LnZhbHVlID09PSBcInlpZWxkXCIpIHtcbiAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0b2tlbik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuU2hvcnRoYW5kUHJvcGVydHkobWV0aG9kT3JLZXkudmFsdWUpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIERhdGFQcm9wZXJ0eVxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5DT0xPTik7XG4gICAgaWYgKG1ldGhvZE9yS2V5LnR5cGUgPT09IFwiU3RhdGljUHJvcGVydHlOYW1lXCIpIHtcbiAgICAgIGlmIChtZXRob2RPcktleS52YWx1ZSA9PT0gXCJfX3Byb3RvX19cIikge1xuICAgICAgICBpZiAoIWhhc19fcHJvdG9fX1swXSkge1xuICAgICAgICAgIGhhc19fcHJvdG9fX1swXSA9IHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5EVVBMSUNBVEVfUFJPVE9fUFJPUEVSVFkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuRGF0YVByb3BlcnR5KFxuICAgICAgICBtZXRob2RPcktleSxcbiAgICAgICAgdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCkpLFxuICAgICAgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZVByb3BlcnR5TmFtZSgpIHtcbiAgICAvLyBQcm9wZXJ0eU5hbWVbWWllbGQsR2VuZXJhdG9yUGFyYW1ldGVyXTpcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcblxuICAgIGlmICh0aGlzLmVvZigpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodG9rZW4pO1xuICAgIH1cblxuICAgIHN3aXRjaCAodG9rZW4udHlwZSkge1xuICAgICAgY2FzZSBUb2tlblR5cGUuU1RSSU5HOlxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlN0YXRpY1Byb3BlcnR5TmFtZSh0aGlzLnBhcnNlU3RyaW5nTGl0ZXJhbCgpLnZhbHVlKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICBjYXNlIFRva2VuVHlwZS5OVU1CRVI6XG4gICAgICAgIGxldCBudW1MaXRlcmFsID0gdGhpcy5wYXJzZU51bWVyaWNMaXRlcmFsKCk7XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuU3RhdGljUHJvcGVydHlOYW1lKFwiXCIgKyAobnVtTGl0ZXJhbC50eXBlID09PSBcIkxpdGVyYWxJbmZpbml0eUV4cHJlc3Npb25cIiA/IDEgLyAwIDogbnVtTGl0ZXJhbC52YWx1ZSkpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkxCUkFDSzpcbiAgICAgICAgbGV0IHByZXZpb3VzWWllbGQgPSB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uO1xuICAgICAgICBpZiAodGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlcikge1xuICAgICAgICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTEJSQUNLKTtcbiAgICAgICAgbGV0IGV4cHIgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJCUkFDSyk7XG4gICAgICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBwcmV2aW91c1lpZWxkO1xuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkNvbXB1dGVkUHJvcGVydHlOYW1lKGV4cHIpLCBzdGFydExvY2F0aW9uKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlN0YXRpY1Byb3BlcnR5TmFtZSh0aGlzLnBhcnNlSWRlbnRpZmllck5hbWUoKSksIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgLyoqXG4gICAqIFRlc3QgaWYgbG9va2FoZWFkIGNhbiBiZSB0aGUgYmVnaW5uaW5nIG9mIGEgYFByb3BlcnR5TmFtZWAuXG4gICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgKi9cbiAgbG9va2FoZWFkUHJvcGVydHlOYW1lKCkge1xuICAgIHN3aXRjaCAodGhpcy5sb29rYWhlYWQudHlwZSkge1xuICAgICAgY2FzZSBUb2tlblR5cGUuTlVNQkVSOlxuICAgICAgY2FzZSBUb2tlblR5cGUuU1RSSU5HOlxuICAgICAgY2FzZSBUb2tlblR5cGUuTEJSQUNLOlxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB0aGlzLmxvb2thaGVhZC50eXBlLmtsYXNzLmlzSWRlbnRpZmllck5hbWU7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRyeSB0byBwYXJzZSBhIG1ldGhvZCBkZWZpbml0aW9uLlxuICAgKlxuICAgKiBJZiBpdCB0dXJucyBvdXQgdG8gYmUgb25lIG9mOlxuICAgKiAgKiBgSWRlbnRpZmllclJlZmVyZW5jZWBcbiAgICogICogYENvdmVySW5pdGlhbGl6ZWROYW1lYCAoYElkZW50aWZpZXJSZWZlcmVuY2UgXCI9XCIgQXNzaWdubWVudEV4cHJlc3Npb25gKVxuICAgKiAgKiBgUHJvcGVydHlOYW1lIDogQXNzaWdubWVudEV4cHJlc3Npb25gXG4gICAqIFRoZSB0aGUgcGFyc2VyIHdpbGwgc3RvcCBhdCB0aGUgZW5kIG9mIHRoZSBsZWFkaW5nIGBJZGVudGlmaWVyYCBvciBgUHJvcGVydHlOYW1lYCBhbmQgcmV0dXJuIGl0LlxuICAgKlxuICAgKiBAcmV0dXJucyB7e21ldGhvZE9yS2V5OiAoU2hpZnQuTWV0aG9kfFNoaWZ0LlByb3BlcnR5TmFtZSksIGtpbmQ6IHN0cmluZ319XG4gICAqL1xuICBwYXJzZU1ldGhvZERlZmluaXRpb24oaXNDbGFzc1Byb3RvTWV0aG9kKSB7XG4gICAgbGV0IHRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICBsZXQgaXNHZW5lcmF0b3IgPSAhIXRoaXMuZWF0KFRva2VuVHlwZS5NVUwpO1xuXG4gICAgbGV0IGtleSA9IHRoaXMucGFyc2VQcm9wZXJ0eU5hbWUoKTtcblxuICAgIGlmICghaXNHZW5lcmF0b3IgJiYgdG9rZW4udHlwZSA9PT0gVG9rZW5UeXBlLklERU5USUZJRVIpIHtcbiAgICAgIGxldCBuYW1lID0gdG9rZW4udmFsdWU7XG4gICAgICBpZiAobmFtZS5sZW5ndGggPT09IDMpIHtcbiAgICAgICAgLy8gUHJvcGVydHkgQXNzaWdubWVudDogR2V0dGVyIGFuZCBTZXR0ZXIuXG4gICAgICAgIGlmIChuYW1lID09PSBcImdldFwiICYmIHRoaXMubG9va2FoZWFkUHJvcGVydHlOYW1lKCkpIHtcbiAgICAgICAgICBrZXkgPSB0aGlzLnBhcnNlUHJvcGVydHlOYW1lKCk7XG4gICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJQQVJFTik7XG4gICAgICAgICAgbGV0IHByZXZpb3VzSW5Db25zdHJ1Y3RvciA9IHRoaXMuaW5Db25zdHJ1Y3RvcjtcbiAgICAgICAgICB0aGlzLmluQ29uc3RydWN0b3IgPSBmYWxzZTtcbiAgICAgICAgICBsZXQgcHJldmlvdXNJbk1ldGhvZCA9IHRoaXMuaW5NZXRob2Q7XG4gICAgICAgICAgdGhpcy5pbk1ldGhvZCA9IHRydWU7XG4gICAgICAgICAgbGV0IFtib2R5XSA9IHRoaXMucGFyc2VGdW5jdGlvbkJvZHkoW10pO1xuICAgICAgICAgIHRoaXMuaW5Db25zdHJ1Y3RvciA9IHByZXZpb3VzSW5Db25zdHJ1Y3RvcjtcbiAgICAgICAgICB0aGlzLmluTWV0aG9kID0gcHJldmlvdXNJbk1ldGhvZDtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbWV0aG9kT3JLZXk6IHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5HZXR0ZXIoa2V5LCBib2R5KSwgc3RhcnRMb2NhdGlvbiksXG4gICAgICAgICAgICBraW5kOiBcIm1ldGhvZFwiXG4gICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIGlmIChuYW1lID09PSBcInNldFwiICYmIHRoaXMubG9va2FoZWFkUHJvcGVydHlOYW1lKCkpIHtcbiAgICAgICAgICBrZXkgPSB0aGlzLnBhcnNlUHJvcGVydHlOYW1lKCk7XG4gICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgICAgICAgbGV0IHBhcmFtID0gdGhpcy5wYXJzZVBhcmFtKCk7XG4gICAgICAgICAgbGV0IGluZm8gPSB7fTtcbiAgICAgICAgICB0aGlzLmNoZWNrUGFyYW0ocGFyYW0sIHRva2VuLCBbXSwgaW5mbyk7XG4gICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJQQVJFTik7XG4gICAgICAgICAgbGV0IHByZXZpb3VzWWllbGQgPSB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uO1xuICAgICAgICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBmYWxzZTtcbiAgICAgICAgICBsZXQgcHJldmlvdXNJbkNvbnN0cnVjdG9yID0gdGhpcy5pbkNvbnN0cnVjdG9yO1xuICAgICAgICAgIHRoaXMuaW5Db25zdHJ1Y3RvciA9IGZhbHNlO1xuICAgICAgICAgIGxldCBwcmV2aW91c0luTWV0aG9kID0gdGhpcy5pbk1ldGhvZDtcbiAgICAgICAgICB0aGlzLmluTWV0aG9kID0gdHJ1ZTtcbiAgICAgICAgICBsZXQgYm91bmRQYXJhbXMgPSBQYXJzZXIuYm91bmROYW1lcyhwYXJhbSk7XG4gICAgICAgICAgbGV0IFtib2R5LCBpc1N0cmljdF0gPSB0aGlzLnBhcnNlRnVuY3Rpb25Cb2R5KGJvdW5kUGFyYW1zKTtcbiAgICAgICAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gcHJldmlvdXNZaWVsZDtcbiAgICAgICAgICB0aGlzLmluQ29uc3RydWN0b3IgPSBwcmV2aW91c0luQ29uc3RydWN0b3I7XG4gICAgICAgICAgdGhpcy5pbk1ldGhvZCA9IHByZXZpb3VzSW5NZXRob2Q7XG4gICAgICAgICAgaWYgKGlzU3RyaWN0KSB7XG4gICAgICAgICAgICBpZiAoaW5mby5maXJzdFJlc3RyaWN0ZWQpIHtcbiAgICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbihpbmZvLmZpcnN0UmVzdHJpY3RlZCwgaW5mby5tZXNzYWdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG1ldGhvZE9yS2V5OiB0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiU2V0dGVyXCIsIG5hbWU6IGtleSwgcGFyYW0sIGJvZHkgfSwgc3RhcnRMb2NhdGlvbiksXG4gICAgICAgICAgICBraW5kOiBcIm1ldGhvZFwiXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5MUEFSRU4pKSB7XG4gICAgICBsZXQgcHJldmlvdXNZaWVsZCA9IHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb247XG4gICAgICBsZXQgcHJldmlvdXNJbkdlbmVyYXRvclBhcmFtZXRlciA9IHRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXI7XG4gICAgICB0aGlzLmluR2VuZXJhdG9yUGFyYW1ldGVyID0gaXNHZW5lcmF0b3I7XG4gICAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gaXNHZW5lcmF0b3I7XG4gICAgICBsZXQgcGFyYW1zTG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgICBsZXQgcGFyYW1JbmZvID0gdGhpcy5wYXJzZVBhcmFtcyhudWxsKTtcbiAgICAgIHRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXIgPSBwcmV2aW91c0luR2VuZXJhdG9yUGFyYW1ldGVyO1xuICAgICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IHByZXZpb3VzWWllbGQ7XG4gICAgICBsZXQgcHJldmlvdXNJbkdlbmVyYXRvckJvZHkgPSB0aGlzLmluR2VuZXJhdG9yQm9keTtcbiAgICAgIGxldCBwcmV2aW91c0luQ29uc3RydWN0b3IgPSB0aGlzLmluQ29uc3RydWN0b3I7XG4gICAgICBsZXQgcHJldmlvdXNJbk1ldGhvZCA9IHRoaXMuaW5NZXRob2Q7XG4gICAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gaXNHZW5lcmF0b3I7XG4gICAgICB0aGlzLmluQ29uc3RydWN0b3IgPVxuICAgICAgICBpc0NsYXNzUHJvdG9NZXRob2QgJiYgIWlzR2VuZXJhdG9yICYmIHRoaXMuaGFzQ2xhc3NIZXJpdGFnZSAmJlxuICAgICAgICBrZXkudHlwZSA9PT0gXCJTdGF0aWNQcm9wZXJ0eU5hbWVcIiAmJiBrZXkudmFsdWUgPT09IFwiY29uc3RydWN0b3JcIjtcbiAgICAgIHRoaXMuaW5NZXRob2QgPSB0cnVlO1xuXG4gICAgICBpZiAoaXNHZW5lcmF0b3IpIHtcbiAgICAgICAgdGhpcy5pbkdlbmVyYXRvckJvZHkgPSB0cnVlO1xuICAgICAgfVxuICAgICAgbGV0IGJvdW5kUGFyYW1zID0gW10uY29uY2F0LmFwcGx5KFtdLCBwYXJhbUluZm8ucGFyYW1zLm1hcChQYXJzZXIuYm91bmROYW1lcykpO1xuXG4gICAgICBsZXQgcGFyYW1zID0gdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIkZvcm1hbFBhcmFtZXRlcnNcIiwgaXRlbXM6IHBhcmFtSW5mby5wYXJhbXMsIHJlc3Q6IHBhcmFtSW5mby5yZXN0IH0sIHBhcmFtc0xvY2F0aW9uKTtcblxuICAgICAgbGV0IFtib2R5XSA9IHRoaXMucGFyc2VGdW5jdGlvbkJvZHkoYm91bmRQYXJhbXMpO1xuICAgICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IHByZXZpb3VzWWllbGQ7XG4gICAgICB0aGlzLmluR2VuZXJhdG9yQm9keSA9IHByZXZpb3VzSW5HZW5lcmF0b3JCb2R5O1xuICAgICAgdGhpcy5pbkNvbnN0cnVjdG9yID0gcHJldmlvdXNJbkNvbnN0cnVjdG9yO1xuICAgICAgdGhpcy5pbk1ldGhvZCA9IHByZXZpb3VzSW5NZXRob2Q7XG5cbiAgICAgIGlmIChwYXJhbUluZm8uZmlyc3RSZXN0cmljdGVkKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24ocGFyYW1JbmZvLmZpcnN0UmVzdHJpY3RlZCwgcGFyYW1JbmZvLm1lc3NhZ2UpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBtZXRob2RPcktleTogdGhpcy5tYXJrTG9jYXRpb24oXG4gICAgICAgICAgeyB0eXBlOiBcIk1ldGhvZFwiLCBpc0dlbmVyYXRvciwgbmFtZToga2V5LCBwYXJhbXMsIGJvZHkgfSwgc3RhcnRMb2NhdGlvbiksXG4gICAgICAgIGtpbmQ6IFwibWV0aG9kXCJcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIG1ldGhvZE9yS2V5OiBrZXksXG4gICAgICBraW5kOiB0b2tlbi50eXBlLmtsYXNzLmlzSWRlbnRpZmllck5hbWUgPyBcImlkZW50aWZpZXJcIiA6IFwicHJvcGVydHlcIlxuICAgIH07XG4gIH1cblxuICBwYXJzZUNsYXNzKHtpc0V4cHIsIGluRGVmYXVsdCA9IGZhbHNlfSkge1xuICAgIGxldCBsb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuQ0xBU1MpO1xuICAgIGxldCBpZCA9IG51bGw7XG4gICAgbGV0IGhlcml0YWdlID0gbnVsbDtcblxuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5JREVOVElGSUVSKSkge1xuICAgICAgbGV0IGlkTG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgICBpZCA9IHRoaXMucGFyc2VCaW5kaW5nSWRlbnRpZmllcigpO1xuICAgIH0gZWxzZSBpZiAoIWlzRXhwcikge1xuICAgICAgaWYgKGluRGVmYXVsdCkge1xuICAgICAgICBpZCA9IHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJCaW5kaW5nSWRlbnRpZmllclwiLCBuYW1lOiBcIipkZWZhdWx0KlwiIH0sIGxvY2F0aW9uKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IHByZXZpb3VzSW5HZW5lcmF0b3JQYXJhbWV0ZXIgPSB0aGlzLmluR2VuZXJhdG9yUGFyYW1ldGVyO1xuICAgIGxldCBwcmV2aW91c1BhcmFtWWllbGQgPSB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uO1xuICAgIGxldCBwcmV2aW91c0hhc0NsYXNzSGVyaXRhZ2UgPSB0aGlzLmhhc0NsYXNzSGVyaXRhZ2U7XG4gICAgaWYgKGlzRXhwcikge1xuICAgICAgdGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlciA9IGZhbHNlO1xuICAgICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IGZhbHNlO1xuICAgIH1cbiAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLkVYVEVORFMpKSB7XG4gICAgICBoZXJpdGFnZSA9IHRoaXMucGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uKHthbGxvd0NhbGw6IHRydWV9KTtcbiAgICB9XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTEJSQUNFKTtcbiAgICBsZXQgb3JpZ2luYWxTdHJpY3QgPSB0aGlzLnN0cmljdDtcbiAgICB0aGlzLnN0cmljdCA9IHRydWU7XG4gICAgbGV0IG1ldGhvZHMgPSBbXTtcbiAgICBsZXQgaGFzQ29uc3RydWN0b3IgPSBmYWxzZTtcbiAgICB0aGlzLmhhc0NsYXNzSGVyaXRhZ2UgPSBoZXJpdGFnZSAhPSBudWxsO1xuICAgIHdoaWxlICghdGhpcy5lYXQoVG9rZW5UeXBlLlJCUkFDRSkpIHtcbiAgICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuU0VNSUNPTE9OKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGxldCBtZXRob2RUb2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgICAgbGV0IGlzU3RhdGljID0gZmFsc2U7XG4gICAgICBsZXQge21ldGhvZE9yS2V5LCBraW5kfSA9IHRoaXMucGFyc2VNZXRob2REZWZpbml0aW9uKHRydWUpO1xuICAgICAgaWYgKGtpbmQgPT09IFwiaWRlbnRpZmllclwiICYmIG1ldGhvZE9yS2V5LnZhbHVlID09PSBcInN0YXRpY1wiKSB7XG4gICAgICAgIGlzU3RhdGljID0gdHJ1ZTtcbiAgICAgICAgKHttZXRob2RPcktleSwga2luZH0gPSB0aGlzLnBhcnNlTWV0aG9kRGVmaW5pdGlvbihmYWxzZSkpO1xuICAgICAgfVxuICAgICAgc3dpdGNoIChraW5kKSB7XG4gICAgICAgIGNhc2UgXCJtZXRob2RcIjpcbiAgICAgICAgICBsZXQga2V5ID0gbWV0aG9kT3JLZXkubmFtZTtcbiAgICAgICAgICBpZiAoIWlzU3RhdGljKSB7XG4gICAgICAgICAgICBpZiAoa2V5LnR5cGUgPT09IFwiU3RhdGljUHJvcGVydHlOYW1lXCIgJiYga2V5LnZhbHVlID09PSBcImNvbnN0cnVjdG9yXCIpIHtcbiAgICAgICAgICAgICAgaWYgKG1ldGhvZE9yS2V5LnR5cGUgIT09IFwiTWV0aG9kXCIgfHwgbWV0aG9kT3JLZXkuaXNHZW5lcmF0b3IpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKG1ldGhvZFRva2VuLCBcIkNvbnN0cnVjdG9ycyBjYW5ub3QgYmUgZ2VuZXJhdG9ycywgZ2V0dGVycyBvciBzZXR0ZXJzXCIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChoYXNDb25zdHJ1Y3Rvcikge1xuICAgICAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24obWV0aG9kVG9rZW4sIFwiT25seSBvbmUgY29uc3RydWN0b3IgaXMgYWxsb3dlZCBpbiBhIGNsYXNzXCIpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGhhc0NvbnN0cnVjdG9yID0gdHJ1ZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoa2V5LnR5cGUgPT09IFwiU3RhdGljUHJvcGVydHlOYW1lXCIgJiYga2V5LnZhbHVlID09PSBcInByb3RvdHlwZVwiKSB7XG4gICAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24obWV0aG9kVG9rZW4sIFwiU3RhdGljIGNsYXNzIG1ldGhvZHMgY2Fubm90IGJlIG5hbWVkICdwcm90b3R5cGUnXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBtZXRob2RzLnB1c2goY29weUxvY2F0aW9uKG1ldGhvZE9yS2V5LCBuZXcgU2hpZnQuQ2xhc3NFbGVtZW50KGlzU3RhdGljLCBtZXRob2RPcktleSkpKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKFwiT25seSBtZXRob2RzIGFyZSBhbGxvd2VkIGluIGNsYXNzZXNcIik7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghaXNFeHByKSB7XG4gICAgICB0aGlzLlZETltcIiRcIiArIGlkLm5hbWVdID0gdHJ1ZTtcbiAgICB9XG4gICAgdGhpcy5zdHJpY3QgPSBvcmlnaW5hbFN0cmljdDtcbiAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gcHJldmlvdXNQYXJhbVlpZWxkO1xuICAgIHRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXIgPSBwcmV2aW91c0luR2VuZXJhdG9yUGFyYW1ldGVyO1xuICAgIHRoaXMuaGFzQ2xhc3NIZXJpdGFnZSA9IHByZXZpb3VzSGFzQ2xhc3NIZXJpdGFnZTtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IChpc0V4cHIgPyBTaGlmdC5DbGFzc0V4cHJlc3Npb24gOiBTaGlmdC5DbGFzc0RlY2xhcmF0aW9uKShpZCwgaGVyaXRhZ2UsIG1ldGhvZHMpLCBsb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZUZ1bmN0aW9uKHtpc0V4cHIsIGlzVG9wTGV2ZWwsIGluRGVmYXVsdCA9IGZhbHNlLCBhbGxvd0dlbmVyYXRvciA9IHRydWV9KSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuRlVOQ1RJT04pO1xuXG4gICAgbGV0IG5hbWUgPSBudWxsO1xuICAgIGxldCBtZXNzYWdlID0gbnVsbDtcbiAgICBsZXQgZmlyc3RSZXN0cmljdGVkID0gbnVsbDtcbiAgICBsZXQgaXNHZW5lcmF0b3IgPSBhbGxvd0dlbmVyYXRvciAmJiAhIXRoaXMuZWF0KFRva2VuVHlwZS5NVUwpO1xuICAgIGxldCBwcmV2aW91c0dlbmVyYXRvclBhcmFtZXRlciA9IHRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXI7XG4gICAgbGV0IHByZXZpb3VzWWllbGQgPSB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uO1xuICAgIGxldCBwcmV2aW91c0luR2VuZXJhdG9yQm9keSA9IHRoaXMuaW5HZW5lcmF0b3JCb2R5O1xuXG4gICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5MUEFSRU4pKSB7XG4gICAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICAgIGxldCBpZGVudGlmaWVyTG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgICBuYW1lID0gdGhpcy5wYXJzZUlkZW50aWZpZXIoKTtcbiAgICAgIGlmICh0aGlzLnN0cmljdCB8fCBpc0dlbmVyYXRvcikge1xuICAgICAgICBpZiAoaXNSZXN0cmljdGVkV29yZChuYW1lKSkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuU1RSSUNUX0ZVTkNUSU9OX05BTUUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoaXNSZXN0cmljdGVkV29yZChuYW1lKSkge1xuICAgICAgICAgIGZpcnN0UmVzdHJpY3RlZCA9IHRva2VuO1xuICAgICAgICAgIG1lc3NhZ2UgPSBFcnJvck1lc3NhZ2VzLlNUUklDVF9GVU5DVElPTl9OQU1FO1xuICAgICAgICB9IGVsc2UgaWYgKGlzU3RyaWN0TW9kZVJlc2VydmVkV29yZChuYW1lKSkge1xuICAgICAgICAgIGZpcnN0UmVzdHJpY3RlZCA9IHRva2VuO1xuICAgICAgICAgIG1lc3NhZ2UgPSBFcnJvck1lc3NhZ2VzLlNUUklDVF9SRVNFUlZFRF9XT1JEO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBuYW1lID0gdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIkJpbmRpbmdJZGVudGlmaWVyXCIsIG5hbWU6IG5hbWUgfSwgaWRlbnRpZmllckxvY2F0aW9uKTtcbiAgICB9IGVsc2UgaWYgKCFpc0V4cHIpIHtcbiAgICAgIGlmIChpbkRlZmF1bHQpIHtcbiAgICAgICAgbmFtZSA9IHRoaXMubWFya0xvY2F0aW9uKHt0eXBlOiBcIkJpbmRpbmdJZGVudGlmaWVyXCIsIG5hbWU6IFwiKmRlZmF1bHQqXCIgfSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGxldCBwYXJhbXNMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcblxuICAgIHRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXIgPSBpc0dlbmVyYXRvcjtcbiAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gaXNHZW5lcmF0b3I7XG4gICAgbGV0IGluZm8gPSB0aGlzLnBhcnNlUGFyYW1zKGZpcnN0UmVzdHJpY3RlZCk7XG4gICAgdGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlciA9IHByZXZpb3VzR2VuZXJhdG9yUGFyYW1ldGVyO1xuICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBwcmV2aW91c1lpZWxkO1xuXG4gICAgaWYgKGluZm8ubWVzc2FnZSAhPSBudWxsKSB7XG4gICAgICBtZXNzYWdlID0gaW5mby5tZXNzYWdlO1xuICAgIH1cblxuICAgIGxldCBwcmV2aW91c1N0cmljdCA9IHRoaXMuc3RyaWN0O1xuICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBpc0dlbmVyYXRvcjtcbiAgICBpZiAoaXNHZW5lcmF0b3IpIHtcbiAgICAgIHRoaXMuaW5HZW5lcmF0b3JCb2R5ID0gdHJ1ZTtcbiAgICB9XG4gICAgbGV0IHByZXZpb3VzSW5Db25zdHJ1Y3RvciA9IHRoaXMuaW5Db25zdHJ1Y3RvcjtcbiAgICB0aGlzLmluQ29uc3RydWN0b3IgPSBmYWxzZTtcbiAgICBsZXQgcHJldmlvdXNJbk1ldGhvZCA9IHRoaXMuaW5NZXRob2Q7XG4gICAgdGhpcy5pbk1ldGhvZCA9IGZhbHNlO1xuICAgIGxldCBib3VuZFBhcmFtcyA9IFtdLmNvbmNhdC5hcHBseShbXSwgaW5mby5wYXJhbXMubWFwKFBhcnNlci5ib3VuZE5hbWVzKSk7XG5cbiAgICBsZXQgcGFyYW1zID0gdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIkZvcm1hbFBhcmFtZXRlcnNcIiwgaXRlbXM6IGluZm8ucGFyYW1zLCByZXN0OiBpbmZvLnJlc3QgfSwgcGFyYW1zTG9jYXRpb24pO1xuXG4gICAgbGV0IFtib2R5LCBpc1N0cmljdF0gPSB0aGlzLnBhcnNlRnVuY3Rpb25Cb2R5KGJvdW5kUGFyYW1zKTtcbiAgICB0aGlzLmluR2VuZXJhdG9yQm9keSA9IHByZXZpb3VzSW5HZW5lcmF0b3JCb2R5O1xuICAgIHRoaXMuaW5Db25zdHJ1Y3RvciA9IHByZXZpb3VzSW5Db25zdHJ1Y3RvcjtcbiAgICB0aGlzLmluTWV0aG9kID0gcHJldmlvdXNJbk1ldGhvZDtcblxuICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBwcmV2aW91c1lpZWxkO1xuICAgIGlmIChtZXNzYWdlICE9IG51bGwpIHtcbiAgICAgIGlmICgodGhpcy5zdHJpY3QgfHwgaXNTdHJpY3QpICYmIGluZm8uZmlyc3RSZXN0cmljdGVkICE9IG51bGwpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbihpbmZvLmZpcnN0UmVzdHJpY3RlZCwgbWVzc2FnZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuc3RyaWN0ID0gcHJldmlvdXNTdHJpY3Q7XG4gICAgaWYgKCFpc0V4cHIpIHtcbiAgICAgIGlmIChpc1RvcExldmVsKSB7XG4gICAgICAgIHRoaXMuVkROW1wiJFwiICsgbmFtZS5uYW1lXSA9IHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLkxETi5wdXNoKG5hbWUubmFtZSk7XG4gICAgICB9XG5cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24oXG4gICAgICB7IHR5cGU6IGlzRXhwciA/IFwiRnVuY3Rpb25FeHByZXNzaW9uXCIgOiBcIkZ1bmN0aW9uRGVjbGFyYXRpb25cIiwgaXNHZW5lcmF0b3IsIG5hbWUsIHBhcmFtcywgYm9keSB9LFxuICAgICAgc3RhcnRMb2NhdGlvblxuICAgICk7XG4gIH1cblxuICBwYXJzZVBhcmFtKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgIGxldCBvcmlnaW5hbEluUGFyYW1ldGVyID0gdGhpcy5pblBhcmFtZXRlcjtcbiAgICB0aGlzLmluUGFyYW1ldGVyID0gdHJ1ZTtcbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuTFBBUkVOKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICB9XG4gICAgbGV0IHBhcmFtID0gdGhpcy5wYXJzZUxlZnRIYW5kU2lkZUV4cHJlc3Npb24oe2FsbG93Q2FsbDogZmFsc2V9KTtcbiAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLkFTU0lHTikpIHtcbiAgICAgIGxldCBwcmV2aW91c0luR2VuZXJhdG9yUGFyYW1ldGVyID0gdGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlcjtcbiAgICAgIGxldCBwcmV2aW91c1lpZWxkRXhwcmVzc2lvbiA9IHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb247XG4gICAgICBpZiAodGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlcikge1xuICAgICAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gZmFsc2U7XG4gICAgICB9XG4gICAgICB0aGlzLmluR2VuZXJhdG9yUGFyYW1ldGVyID0gZmFsc2U7XG4gICAgICBwYXJhbSA9IHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5Bc3NpZ25tZW50RXhwcmVzc2lvbihcIj1cIiwgcGFyYW0sIHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICB0aGlzLmluR2VuZXJhdG9yUGFyYW1ldGVyID0gcHJldmlvdXNJbkdlbmVyYXRvclBhcmFtZXRlcjtcbiAgICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBwcmV2aW91c1lpZWxkRXhwcmVzc2lvbjtcbiAgICB9XG4gICAgaWYgKCFQYXJzZXIuaXNEZXN0cnVjdHVyaW5nVGFyZ2V0V2l0aERlZmF1bHQocGFyYW0sIFBhcnNlci5pc1ZhbGlkU2ltcGxlQmluZGluZ1RhcmdldCkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0b2tlbik7XG4gICAgfVxuICAgIHRoaXMuaW5QYXJhbWV0ZXIgPSBvcmlnaW5hbEluUGFyYW1ldGVyO1xuICAgIHJldHVybiBQYXJzZXIudHJhbnNmb3JtRGVzdHJ1Y3R1cmluZyhwYXJhbSk7XG4gIH1cblxuICBjaGVja1BhcmFtKHBhcmFtLCB0b2tlbiwgYm91bmQsIGluZm8pIHtcbiAgICBsZXQgbmV3Qm91bmQgPSBQYXJzZXIuYm91bmROYW1lcyhwYXJhbSk7XG4gICAgW10ucHVzaC5hcHBseShib3VuZCwgbmV3Qm91bmQpO1xuXG4gICAgaWYgKGZpcnN0RHVwbGljYXRlKG5ld0JvdW5kKSAhPSBudWxsKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLkRVUExJQ0FURV9CSU5ESU5HLCBmaXJzdER1cGxpY2F0ZShuZXdCb3VuZCkpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnN0cmljdCkge1xuICAgICAgaWYgKG5ld0JvdW5kLnNvbWUoaXNSZXN0cmljdGVkV29yZCkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUEFSQU1fTkFNRSk7XG4gICAgICB9IGVsc2UgaWYgKGZpcnN0RHVwbGljYXRlKGJvdW5kKSAhPSBudWxsKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuU1RSSUNUX1BBUkFNX0RVUEUpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoaW5mby5maXJzdFJlc3RyaWN0ZWQgPT0gbnVsbCkge1xuICAgICAgaWYgKG5ld0JvdW5kLnNvbWUoaXNSZXN0cmljdGVkV29yZCkpIHtcbiAgICAgICAgaW5mby5maXJzdFJlc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgaW5mby5tZXNzYWdlID0gRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUEFSQU1fTkFNRTtcbiAgICAgIH0gZWxzZSBpZiAoaGFzU3RyaWN0TW9kZVJlc2VydmVkV29yZChuZXdCb3VuZCkpIHtcbiAgICAgICAgaW5mby5maXJzdFJlc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgaW5mby5tZXNzYWdlID0gRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUkVTRVJWRURfV09SRDtcbiAgICAgIH0gZWxzZSBpZiAoZmlyc3REdXBsaWNhdGUoYm91bmQpICE9IG51bGwpIHtcbiAgICAgICAgaW5mby5maXJzdFJlc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgaW5mby5tZXNzYWdlID0gRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUEFSQU1fRFVQRTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwYXJzZVBhcmFtcyhmcikge1xuICAgIGxldCBpbmZvID0ge3BhcmFtczogW10sIHJlc3Q6IG51bGx9LCBpc1NpbXBsZVBhcmFtZXRlciA9IHRydWU7XG4gICAgaW5mby5maXJzdFJlc3RyaWN0ZWQgPSBmcjtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTFBBUkVOKTtcblxuICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuUlBBUkVOKSkge1xuICAgICAgbGV0IGJvdW5kID0gW107XG4gICAgICBsZXQgc2VlblJlc3QgPSBmYWxzZTtcblxuICAgICAgd2hpbGUgKCF0aGlzLmVvZigpKSB7XG4gICAgICAgIGxldCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgICAgICBsZXQgcGFyYW07XG4gICAgICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuRUxMSVBTSVMpKSB7XG4gICAgICAgICAgaXNTaW1wbGVQYXJhbWV0ZXIgPSBmYWxzZTtcbiAgICAgICAgICB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgICAgICAgIHBhcmFtID0gdGhpcy5wYXJzZUJpbmRpbmdJZGVudGlmaWVyKCk7XG4gICAgICAgICAgc2VlblJlc3QgPSB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBhcmFtID0gdGhpcy5wYXJzZVBhcmFtKCk7XG4gICAgICAgICAgaWYgKHBhcmFtLnR5cGUgIT09IFwiQmluZGluZ0lkZW50aWZpZXJcIikge1xuICAgICAgICAgICAgaXNTaW1wbGVQYXJhbWV0ZXIgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNoZWNrUGFyYW0ocGFyYW0sIHRva2VuLCBib3VuZCwgaW5mbyk7XG5cbiAgICAgICAgaWYgKHNlZW5SZXN0KSB7XG4gICAgICAgICAgaW5mby5yZXN0ID0gcGFyYW07XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgaW5mby5wYXJhbXMucHVzaChwYXJhbSk7XG4gICAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5SUEFSRU4pKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNPTU1BKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWlzU2ltcGxlUGFyYW1ldGVyKSB7XG4gICAgICBpZiAoaW5mby5tZXNzYWdlID09PSBFcnJvck1lc3NhZ2VzLlNUUklDVF9QQVJBTV9EVVBFKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoaW5mby5tZXNzYWdlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcbiAgICByZXR1cm4gaW5mbztcbiAgfVxufVxuIl19