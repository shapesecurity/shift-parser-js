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
//# sourceMappingURL=data:application/json;base64,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RTtBQUN0QyxpQ0FBaUIsR0FBRyxLQUFLLENBQUM7ZUFDM0I7YUFDRjs7QUFFRCxnQkFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQzs7QUFFM0MsZ0JBQUksUUFBUSxFQUFFO0FBQ1osa0JBQUksQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDO0FBQ2xCLG9CQUFNO2FBQ1A7QUFDRCxnQkFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDeEIsZ0JBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUU7QUFDaEMsb0JBQU07YUFDUDtBQUNELGdCQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztXQUM5QjtTQUNGOztBQUVELFlBQUksQ0FBQyxpQkFBaUIsRUFBRTtBQUN0QixjQUFJLElBQUksQ0FBQyxPQUFPLEtBQUssYUFBYSxDQUFDLGlCQUFpQixFQUFFO0FBQ3BELGtCQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1dBQ3RDO1NBQ0Y7O0FBRUQsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUIsZUFBTyxJQUFJLENBQUM7T0FDYjs7Ozs7O1NBMy9FVSxNQUFNO0dBQVMsU0FBUyIsImZpbGUiOiJzcmMvcGFyc2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3B5cmlnaHQgMjAxNCBTaGFwZSBTZWN1cml0eSwgSW5jLlxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIilcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICovXG5cbmltcG9ydCAqIGFzIFNoaWZ0IGZyb20gXCJzaGlmdC1hc3RcIjtcblxuaW1wb3J0IHtpc1Jlc3RyaWN0ZWRXb3JkLCBpc1N0cmljdE1vZGVSZXNlcnZlZFdvcmR9IGZyb20gXCIuL3V0aWxzXCI7XG5cbmltcG9ydCB7RXJyb3JNZXNzYWdlc30gZnJvbSBcIi4vZXJyb3JzXCI7XG5cbmltcG9ydCBUb2tlbml6ZXIsIHsgVG9rZW5DbGFzcywgVG9rZW5UeXBlIH0gZnJvbSBcIi4vdG9rZW5pemVyXCI7XG5cbi8vIEVtcHR5IHBhcmFtZXRlciBsaXN0IGZvciBBcnJvd0V4cHJlc3Npb25cbmNvbnN0IEFSUk9XX0VYUFJFU1NJT05fUEFSQU1TID0gXCJDb3ZlclBhcmVudGhlc2l6ZWRFeHByZXNzaW9uQW5kQXJyb3dQYXJhbWV0ZXJMaXN0XCI7XG5cbmNvbnN0IFNUUklDVF9NT0RFX1JFU0VSVkVEX1dPUkQgPSB7XG4gIFwiaW1wbGVtZW50c1wiOiBudWxsLCBcImludGVyZmFjZVwiOiBudWxsLCBcInBhY2thZ2VcIjogbnVsbCwgXCJwcml2YXRlXCI6IG51bGwsIFwicHJvdGVjdGVkXCI6IG51bGwsXG4gIFwicHVibGljXCI6IG51bGwsIFwic3RhdGljXCI6IG51bGwsIFwieWllbGRcIjogbnVsbCwgXCJsZXRcIjogbnVsbFxufTtcblxuY29uc3QgUHJlY2VkZW5jZSA9IHtcbiAgU2VxdWVuY2U6IDAsXG4gIFlpZWxkOiAxLFxuICBBc3NpZ25tZW50OiAxLFxuICBDb25kaXRpb25hbDogMixcbiAgQXJyb3dGdW5jdGlvbjogMixcbiAgTG9naWNhbE9SOiAzLFxuICBMb2dpY2FsQU5EOiA0LFxuICBCaXR3aXNlT1I6IDUsXG4gIEJpdHdpc2VYT1I6IDYsXG4gIEJpdHdpc2VBTkQ6IDcsXG4gIEVxdWFsaXR5OiA4LFxuICBSZWxhdGlvbmFsOiA5LFxuICBCaXR3aXNlU0hJRlQ6IDEwLFxuICBBZGRpdGl2ZTogMTEsXG4gIE11bHRpcGxpY2F0aXZlOiAxMixcbiAgVW5hcnk6IDEzLFxuICBQb3N0Zml4OiAxNCxcbiAgQ2FsbDogMTUsXG4gIE5ldzogMTYsXG4gIFRhZ2dlZFRlbXBsYXRlOiAxNyxcbiAgTWVtYmVyOiAxOCxcbiAgUHJpbWFyeTogMTlcbn07XG5cbmNvbnN0IEJpbmFyeVByZWNlZGVuY2UgPSB7XG4gIFwifHxcIjogUHJlY2VkZW5jZS5Mb2dpY2FsT1IsXG4gIFwiJiZcIjogUHJlY2VkZW5jZS5Mb2dpY2FsQU5ELFxuICBcInxcIjogUHJlY2VkZW5jZS5CaXR3aXNlT1IsXG4gIFwiXlwiOiBQcmVjZWRlbmNlLkJpdHdpc2VYT1IsXG4gIFwiJlwiOiBQcmVjZWRlbmNlLkJpdHdpc2VBTkQsXG4gIFwiPT1cIjogUHJlY2VkZW5jZS5FcXVhbGl0eSxcbiAgXCIhPVwiOiBQcmVjZWRlbmNlLkVxdWFsaXR5LFxuICBcIj09PVwiOiBQcmVjZWRlbmNlLkVxdWFsaXR5LFxuICBcIiE9PVwiOiBQcmVjZWRlbmNlLkVxdWFsaXR5LFxuICBcIjxcIjogUHJlY2VkZW5jZS5SZWxhdGlvbmFsLFxuICBcIj5cIjogUHJlY2VkZW5jZS5SZWxhdGlvbmFsLFxuICBcIjw9XCI6IFByZWNlZGVuY2UuUmVsYXRpb25hbCxcbiAgXCI+PVwiOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gIFwiaW5cIjogUHJlY2VkZW5jZS5SZWxhdGlvbmFsLFxuICBcImluc3RhbmNlb2ZcIjogUHJlY2VkZW5jZS5SZWxhdGlvbmFsLFxuICBcIjw8XCI6IFByZWNlZGVuY2UuQml0d2lzZVNISUZULFxuICBcIj4+XCI6IFByZWNlZGVuY2UuQml0d2lzZVNISUZULFxuICBcIj4+PlwiOiBQcmVjZWRlbmNlLkJpdHdpc2VTSElGVCxcbiAgXCIrXCI6IFByZWNlZGVuY2UuQWRkaXRpdmUsXG4gIFwiLVwiOiBQcmVjZWRlbmNlLkFkZGl0aXZlLFxuICBcIipcIjogUHJlY2VkZW5jZS5NdWx0aXBsaWNhdGl2ZSxcbiAgXCIlXCI6IFByZWNlZGVuY2UuTXVsdGlwbGljYXRpdmUsXG4gIFwiL1wiOiBQcmVjZWRlbmNlLk11bHRpcGxpY2F0aXZlLFxufTtcblxuY29uc3QgRk9SX09GX1ZBUiA9IHt9O1xuXG5mdW5jdGlvbiBjb3B5TG9jYXRpb24oZnJvbSwgdG8pIHtcbiAgaWYgKFwibG9jXCIgaW4gZnJvbSkge1xuICAgIHRvLmxvYyA9IGZyb20ubG9jO1xuICB9XG4gIHJldHVybiB0bztcbn1cblxuLyoqXG4gKlxuICogQHBhcmFtIHtbc3RyaW5nXX0gc3RyaW5nc1xuICogQHJldHVybnMge3N0cmluZz99XG4gKi9cbmZ1bmN0aW9uIGZpcnN0RHVwbGljYXRlKHN0cmluZ3MpIHtcbiAgaWYgKHN0cmluZ3MubGVuZ3RoIDwgMikgcmV0dXJuIG51bGw7XG4gIGxldCBtYXAgPSB7fTtcbiAgZm9yIChsZXQgY3Vyc29yID0gMDsgY3Vyc29yIDwgc3RyaW5ncy5sZW5ndGg7IGN1cnNvcisrKSB7XG4gICAgbGV0IGlkID0gXCIkXCIgKyBzdHJpbmdzW2N1cnNvcl07XG4gICAgaWYgKG1hcC5oYXNPd25Qcm9wZXJ0eShpZCkpIHtcbiAgICAgIHJldHVybiBzdHJpbmdzW2N1cnNvcl07XG4gICAgfVxuICAgIG1hcFtpZF0gPSB0cnVlO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBoYXNTdHJpY3RNb2RlUmVzZXJ2ZWRXb3JkKGlkcykge1xuICByZXR1cm4gaWRzLnNvbWUoaWQgPT4gU1RSSUNUX01PREVfUkVTRVJWRURfV09SRC5oYXNPd25Qcm9wZXJ0eShpZCkpO1xufVxuXG5leHBvcnQgY2xhc3MgUGFyc2VyIGV4dGVuZHMgVG9rZW5pemVyIHtcbiAgY29uc3RydWN0b3Ioc291cmNlKSB7XG4gICAgc3VwZXIoc291cmNlKTtcbiAgICB0aGlzLmxhYmVsU2V0ID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICB0aGlzLkxETiA9IFtdO1xuICAgIHRoaXMuVkROID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICB0aGlzLmFsbG93SW4gPSB0cnVlO1xuICAgIHRoaXMuaW5JdGVyYXRpb24gPSBmYWxzZTtcbiAgICB0aGlzLmluU3dpdGNoID0gZmFsc2U7XG4gICAgdGhpcy5pbkZ1bmN0aW9uQm9keSA9IGZhbHNlO1xuICAgIHRoaXMuaW5NZXRob2QgPSBmYWxzZTtcbiAgICB0aGlzLmluQ29uc3RydWN0b3IgPSBmYWxzZTtcbiAgICB0aGlzLmhhc0NsYXNzSGVyaXRhZ2UgPSBmYWxzZTtcbiAgICB0aGlzLmluR2VuZXJhdG9yUGFyYW1ldGVyID0gZmFsc2U7XG4gICAgdGhpcy5pblBhcmFtZXRlciA9IGZhbHNlO1xuICAgIHRoaXMuaW5HZW5lcmF0b3JCb2R5ID0gZmFsc2U7XG4gICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IGZhbHNlO1xuICAgIHRoaXMuYWxsb3dMYWJlbGVkRnVuY3Rpb24gPSB0cnVlO1xuICAgIHRoaXMubW9kdWxlID0gZmFsc2U7XG4gICAgdGhpcy5zdHJpY3QgPSBmYWxzZTtcbiAgICB0aGlzLmFsbG93QmluZGluZ1BhdHRlcm4gPSBmYWxzZTtcbiAgfVxuXG4gIGVhdCh0b2tlblR5cGUpIHtcbiAgICBpZiAodGhpcy5sb29rYWhlYWQudHlwZSA9PT0gdG9rZW5UeXBlKSB7XG4gICAgICByZXR1cm4gdGhpcy5sZXgoKTtcbiAgICB9XG4gIH1cblxuICBleHBlY3QodG9rZW5UeXBlKSB7XG4gICAgaWYgKHRoaXMubG9va2FoZWFkLnR5cGUgPT09IHRva2VuVHlwZSkge1xuICAgICAgcmV0dXJuIHRoaXMubGV4KCk7XG4gICAgfVxuICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gIH1cblxuICBtYXRjaENvbnRleHR1YWxLZXl3b3JkKGtleXdvcmQpIHtcbiAgICByZXR1cm4gdGhpcy5sb29rYWhlYWQudHlwZSA9PT0gVG9rZW5UeXBlLklERU5USUZJRVIgJiYgdGhpcy5sb29rYWhlYWQudmFsdWUgPT09IGtleXdvcmQ7XG4gIH1cblxuICBleHBlY3RDb250ZXh0dWFsS2V5d29yZChrZXl3b3JkKSB7XG4gICAgaWYgKHRoaXMubWF0Y2hDb250ZXh0dWFsS2V5d29yZChrZXl3b3JkKSkge1xuICAgICAgcmV0dXJuIHRoaXMubGV4KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgfVxuICB9XG5cbiAgZWF0Q29udGV4dHVhbEtleXdvcmQoa2V5d29yZCkge1xuICAgIGlmICh0aGlzLm1hdGNoQ29udGV4dHVhbEtleXdvcmQoa2V5d29yZCkpIHtcbiAgICAgIHJldHVybiB0aGlzLmxleCgpO1xuICAgIH1cbiAgfVxuXG4gIG1hdGNoKHN1YlR5cGUpIHtcbiAgICByZXR1cm4gdGhpcy5sb29rYWhlYWQudHlwZSA9PT0gc3ViVHlwZTtcbiAgfVxuXG4gIGNvbnN1bWVTZW1pY29sb24oKSB7XG4gICAgaWYgKHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5TRU1JQ09MT04pKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmVvZigpICYmICF0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0UpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuICAgIH1cbiAgfVxuXG4gIC8vIHRoaXMgaXMgYSBuby1vcCwgcmVzZXJ2ZWQgZm9yIGZ1dHVyZSB1c2VcbiAgbWFya0xvY2F0aW9uKG5vZGUsIHN0YXJ0TG9jYXRpb24pIHtcbiAgICByZXR1cm4gbm9kZTtcbiAgfVxuXG4gIHdyYXBWRE4oZiwgcG9zdCkge1xuICAgIGxldCBvcmlnaW5hbFZETiA9IHRoaXMuVkROO1xuICAgIHRoaXMuVkROID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICBsZXQgcmVzdWx0ID0gZi5jYWxsKHRoaXMpO1xuICAgIGlmIChwb3N0KSBwb3N0LmNhbGwodGhpcyk7XG5cbiAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy5WRE4pIHtcbiAgICAgIG9yaWdpbmFsVkROW2tleV0gPSB0aGlzLlZETltrZXldO1xuICAgIH1cbiAgICB0aGlzLlZETiA9IG9yaWdpbmFsVkROO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBjaGVja0Jsb2NrU2NvcGUoKSB7XG4gICAgbGV0IGR1cGxpY2F0ZSA9IGZpcnN0RHVwbGljYXRlKHRoaXMuTEROKTtcbiAgICBpZiAoZHVwbGljYXRlICE9PSBudWxsKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuRFVQTElDQVRFX0JJTkRJTkcsIGR1cGxpY2F0ZSk7XG4gICAgfVxuICAgIHRoaXMuTEROLmZvckVhY2gobmFtZSA9PiB7XG4gICAgICBpZiAoe30uaGFzT3duUHJvcGVydHkuY2FsbCh0aGlzLlZETiwgXCIkXCIgKyBuYW1lKSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuRFVQTElDQVRFX0JJTkRJTkcsIG5hbWUpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgcGFyc2VNb2R1bGUoKSB7XG4gICAgdGhpcy5tb2R1bGUgPSB0cnVlO1xuICAgIHRoaXMuc3RyaWN0ID0gdHJ1ZTtcblxuICAgIHRoaXMubG9va2FoZWFkID0gdGhpcy5hZHZhbmNlKCk7XG4gICAgbGV0IGxvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCBleHBvcnRlZE5hbWVzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICBsZXQgZXhwb3J0ZWRCaW5kaW5ncyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgbGV0IGl0ZW1zID0gW107XG4gICAgd2hpbGUgKCF0aGlzLmVvZigpKSB7XG4gICAgICBpdGVtcy5wdXNoKHRoaXMucGFyc2VNb2R1bGVJdGVtKGV4cG9ydGVkTmFtZXMsIGV4cG9ydGVkQmluZGluZ3MpKTtcbiAgICB9XG4gICAgZm9yIChsZXQga2V5IGluIGV4cG9ydGVkQmluZGluZ3MpIHtcbiAgICAgIGlmICghe30uaGFzT3duUHJvcGVydHkuY2FsbCh0aGlzLlZETiwga2V5KSAmJiB0aGlzLkxETi5pbmRleE9mKGtleS5zbGljZSgxKSkgPT09IC0xKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5NT0RVTEVfRVhQT1JUX1VOREVGSU5FRCwga2V5LnNsaWNlKDEpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5jaGVja0Jsb2NrU2NvcGUoKTtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0Lk1vZHVsZShpdGVtcyksIGxvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlU2NyaXB0KCkge1xuICAgIHRoaXMubG9va2FoZWFkID0gdGhpcy5hZHZhbmNlKCk7XG5cbiAgICBsZXQgbG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IG9yaWdpbmFsTEROID0gdGhpcy5MRE47XG4gICAgdGhpcy5MRE4gPSBbXTtcblxuICAgIGxldCBbYm9keV0gPSB0aGlzLnBhcnNlQm9keSgpO1xuICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuRU9TKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICB9XG4gICAgdGhpcy5jaGVja0Jsb2NrU2NvcGUoKTtcbiAgICB0aGlzLkxETiA9IG9yaWdpbmFsTEROO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuU2NyaXB0KGJvZHkpLCBsb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZUZ1bmN0aW9uQm9keShib3VuZFBhcmFtcykge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuXG4gICAgbGV0IG9sZFZETiA9IHRoaXMuVkROO1xuICAgIHRoaXMuVkROID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICAgIGxldCBvcmlnaW5hbExETiA9IHRoaXMuTEROO1xuICAgIHRoaXMuTEROID0gW107XG5cbiAgICBib3VuZFBhcmFtcy5mb3JFYWNoKG5hbWUgPT4gdGhpcy5WRE5bXCIkXCIgKyBuYW1lXSA9IHRydWUpO1xuXG4gICAgbGV0IG9sZExhYmVsU2V0ID0gdGhpcy5sYWJlbFNldDtcbiAgICBsZXQgb2xkSW5JdGVyYXRpb24gPSB0aGlzLmluSXRlcmF0aW9uO1xuICAgIGxldCBvbGRJblN3aXRjaCA9IHRoaXMuaW5Td2l0Y2g7XG4gICAgbGV0IG9sZEluRnVuY3Rpb25Cb2R5ID0gdGhpcy5pbkZ1bmN0aW9uQm9keTtcbiAgICBsZXQgcHJldmlvdXNTdHJpY3QgPSB0aGlzLnN0cmljdDtcbiAgICBsZXQgb2xkTW9kdWxlID0gdGhpcy5tb2R1bGU7XG5cbiAgICB0aGlzLmxhYmVsU2V0ID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICB0aGlzLmluSXRlcmF0aW9uID0gZmFsc2U7XG4gICAgdGhpcy5pblN3aXRjaCA9IGZhbHNlO1xuICAgIHRoaXMuaW5GdW5jdGlvbkJvZHkgPSB0cnVlO1xuICAgIHRoaXMubW9kdWxlID0gZmFsc2U7XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTEJSQUNFKTtcbiAgICBsZXQgW2JvZHksIGlzU3RyaWN0XSA9IHRoaXMucGFyc2VCb2R5KCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJCUkFDRSk7XG5cbiAgICB0aGlzLmNoZWNrQmxvY2tTY29wZSgpO1xuXG4gICAgdGhpcy5WRE4gPSBvbGRWRE47XG4gICAgdGhpcy5MRE4gPSBvcmlnaW5hbExETjtcblxuICAgIGJvZHkgPSB0aGlzLm1hcmtMb2NhdGlvbihib2R5LCBzdGFydExvY2F0aW9uKTtcblxuICAgIHRoaXMubGFiZWxTZXQgPSBvbGRMYWJlbFNldDtcbiAgICB0aGlzLmluSXRlcmF0aW9uID0gb2xkSW5JdGVyYXRpb247XG4gICAgdGhpcy5pblN3aXRjaCA9IG9sZEluU3dpdGNoO1xuICAgIHRoaXMuaW5GdW5jdGlvbkJvZHkgPSBvbGRJbkZ1bmN0aW9uQm9keTtcbiAgICB0aGlzLnN0cmljdCA9IHByZXZpb3VzU3RyaWN0O1xuICAgIHRoaXMubW9kdWxlID0gb2xkTW9kdWxlO1xuICAgIHJldHVybiBbYm9keSwgaXNTdHJpY3RdO1xuICB9XG5cbiAgcGFyc2VCb2R5KCkge1xuICAgIGxldCBsb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgZGlyZWN0aXZlcyA9IFtdO1xuICAgIGxldCBzdGF0ZW1lbnRzID0gW107XG4gICAgbGV0IHBhcnNpbmdEaXJlY3RpdmVzID0gdHJ1ZTtcbiAgICBsZXQgaXNTdHJpY3QgPSB0aGlzLnN0cmljdDtcbiAgICBsZXQgZmlyc3RSZXN0cmljdGVkID0gbnVsbDtcbiAgICB0aGlzLndyYXBWRE4oKCkgPT4ge1xuICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgaWYgKHRoaXMuZW9mKCkgfHwgdGhpcy5tYXRjaChUb2tlblR5cGUuUkJSQUNFKSkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGxldCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgICAgICBsZXQgdGV4dCA9IHRva2VuLnNsaWNlLnRleHQ7XG4gICAgICAgIGxldCBpc1N0cmluZ0xpdGVyYWwgPSB0b2tlbi50eXBlID09PSBUb2tlblR5cGUuU1RSSU5HO1xuICAgICAgICBsZXQgZGlyZWN0aXZlTG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgICAgIGxldCBzdG10ID0gdGhpcy5wYXJzZVN0YXRlbWVudExpc3RJdGVtKHtpc1RvcExldmVsOiB0cnVlfSk7XG4gICAgICAgIGlmIChwYXJzaW5nRGlyZWN0aXZlcykge1xuICAgICAgICAgIGlmIChpc1N0cmluZ0xpdGVyYWwgJiYgc3RtdC50eXBlID09PSBcIkV4cHJlc3Npb25TdGF0ZW1lbnRcIiAmJlxuICAgICAgICAgICAgc3RtdC5leHByZXNzaW9uLnR5cGUgPT09IFwiTGl0ZXJhbFN0cmluZ0V4cHJlc3Npb25cIikge1xuICAgICAgICAgICAgaWYgKHRleHQgPT09IFwiXFxcInVzZSBzdHJpY3RcXFwiXCIgfHwgdGV4dCA9PT0gXCIndXNlIHN0cmljdCdcIikge1xuICAgICAgICAgICAgICBpc1N0cmljdCA9IHRydWU7XG4gICAgICAgICAgICAgIHRoaXMuc3RyaWN0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgaWYgKGZpcnN0UmVzdHJpY3RlZCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbihmaXJzdFJlc3RyaWN0ZWQsIEVycm9yTWVzc2FnZXMuU1RSSUNUX09DVEFMX0xJVEVSQUwpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpcnN0UmVzdHJpY3RlZCA9PSBudWxsICYmIHRva2VuLm9jdGFsKSB7XG4gICAgICAgICAgICAgIGZpcnN0UmVzdHJpY3RlZCA9IHRva2VuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZGlyZWN0aXZlcy5wdXNoKHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5EaXJlY3RpdmUodGV4dC5zbGljZSgxLCAtMSkpLCBkaXJlY3RpdmVMb2NhdGlvbikpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwYXJzaW5nRGlyZWN0aXZlcyA9IGZhbHNlO1xuICAgICAgICAgICAgc3RhdGVtZW50cy5wdXNoKHN0bXQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdGF0ZW1lbnRzLnB1c2goc3RtdCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LCAoKSA9PiB7XG5cbiAgICB9KTtcbiAgICByZXR1cm4gW3RoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5GdW5jdGlvbkJvZHkoZGlyZWN0aXZlcywgc3RhdGVtZW50cyksIGxvY2F0aW9uKSwgaXNTdHJpY3RdO1xuICB9XG5cbiAgcGFyc2VJbXBvcnRTcGVjaWZpZXIoYm91bmROYW1lcykge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpLCBpZGVudGlmaWVyO1xuICAgIGlmICh0aGlzLmxvb2thaGVhZC50eXBlID09PSBUb2tlblR5cGUuSURFTlRJRklFUikge1xuICAgICAgaWRlbnRpZmllciA9IHRoaXMucGFyc2VJZGVudGlmaWVyKCk7XG4gICAgICBpZiAoIXRoaXMuZWF0Q29udGV4dHVhbEtleXdvcmQoXCJhc1wiKSkge1xuICAgICAgICBpZiAoe30uaGFzT3duUHJvcGVydHkuY2FsbChib3VuZE5hbWVzLCBcIiRcIiArIGlkZW50aWZpZXIpKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbihzdGFydExvY2F0aW9uLCBFcnJvck1lc3NhZ2VzLklNUE9SVF9EVVBFKTtcbiAgICAgICAgfVxuICAgICAgICBib3VuZE5hbWVzW1wiJFwiICsgaWRlbnRpZmllcl0gPSB0cnVlO1xuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24oXG4gICAgICAgICAgbmV3IFNoaWZ0LkltcG9ydFNwZWNpZmllcihcbiAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgICB0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiQmluZGluZ0lkZW50aWZpZXJcIiwgbmFtZTogaWRlbnRpZmllciB9LCBzdGFydExvY2F0aW9uKSksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodGhpcy5sb29rYWhlYWQudHlwZS5rbGFzcy5pc0lkZW50aWZpZXJOYW1lKSB7XG4gICAgICBpZGVudGlmaWVyID0gdGhpcy5wYXJzZUlkZW50aWZpZXJOYW1lKCk7XG4gICAgICB0aGlzLmV4cGVjdENvbnRleHR1YWxLZXl3b3JkKFwiYXNcIik7XG4gICAgfVxuXG4gICAgbGV0IGxvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCBib3VuZE5hbWUgPSB0aGlzLnBhcnNlSWRlbnRpZmllcigpO1xuICAgIGlmICh7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGJvdW5kTmFtZXMsIFwiJFwiICsgYm91bmROYW1lKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbihsb2NhdGlvbiwgRXJyb3JNZXNzYWdlcy5JTVBPUlRfRFVQRSk7XG4gICAgfVxuICAgIGJvdW5kTmFtZXNbXCIkXCIgKyBib3VuZE5hbWVdID0gdHJ1ZTtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24oXG4gICAgICBuZXcgU2hpZnQuSW1wb3J0U3BlY2lmaWVyKFxuICAgICAgICBpZGVudGlmaWVyLFxuICAgICAgICB0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiQmluZGluZ0lkZW50aWZpZXJcIiwgbmFtZTogYm91bmROYW1lIH0sIGxvY2F0aW9uKSksXG4gICAgICBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlTmFtZVNwYWNlQmluZGluZyhib3VuZE5hbWVzKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLk1VTCk7XG4gICAgdGhpcy5leHBlY3RDb250ZXh0dWFsS2V5d29yZChcImFzXCIpO1xuICAgIGxldCBpZGVudGlmaWVyTG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IGlkZW50aWZpZXIgPSB0aGlzLnBhcnNlSWRlbnRpZmllcigpO1xuICAgIGlmICh7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGJvdW5kTmFtZXMsIFwiJFwiICsgaWRlbnRpZmllcikpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24oaWRlbnRpZmllckxvY2F0aW9uLCBFcnJvck1lc3NhZ2VzLklNUE9SVF9EVVBFKTtcbiAgICB9XG4gICAgYm91bmROYW1lc1tcIiRcIiArIGlkZW50aWZpZXJdID0gdHJ1ZTtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIkJpbmRpbmdJZGVudGlmaWVyXCIsIG5hbWU6IGlkZW50aWZpZXIgfSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZU5hbWVkSW1wb3J0cyhib3VuZE5hbWVzKSB7XG4gICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MQlJBQ0UpO1xuICAgIHdoaWxlICghdGhpcy5lYXQoVG9rZW5UeXBlLlJCUkFDRSkpIHtcbiAgICAgIHJlc3VsdC5wdXNoKHRoaXMucGFyc2VJbXBvcnRTcGVjaWZpZXIoYm91bmROYW1lcykpO1xuICAgICAgaWYgKCF0aGlzLmVhdChUb2tlblR5cGUuQ09NTUEpKSB7XG4gICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SQlJBQ0UpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHBhcnNlRnJvbUNsYXVzZSgpIHtcbiAgICB0aGlzLmV4cGVjdENvbnRleHR1YWxLZXl3b3JkKFwiZnJvbVwiKTtcbiAgICBsZXQgdmFsdWUgPSB0aGlzLmV4cGVjdChUb2tlblR5cGUuU1RSSU5HKS5fdmFsdWU7XG4gICAgdGhpcy5jb25zdW1lU2VtaWNvbG9uKCk7XG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG5cbiAgcGFyc2VJbXBvcnREZWNsYXJhdGlvbigpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKSwgZGVmYXVsdEJpbmRpbmcgPSBudWxsLCBtb2R1bGVTcGVjaWZpZXIsIGJvdW5kTmFtZXMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5JTVBPUlQpO1xuICAgIHN3aXRjaCAodGhpcy5sb29rYWhlYWQudHlwZSkge1xuICAgICAgY2FzZSBUb2tlblR5cGUuU1RSSU5HOlxuICAgICAgICBtb2R1bGVTcGVjaWZpZXIgPSB0aGlzLmxleCgpLl92YWx1ZTtcbiAgICAgICAgdGhpcy5jb25zdW1lU2VtaWNvbG9uKCk7XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuSW1wb3J0KG51bGwsIFtdLCBtb2R1bGVTcGVjaWZpZXIpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLklERU5USUZJRVI6XG4gICAgICAgIGRlZmF1bHRCaW5kaW5nID0gdGhpcy5leHBlY3QoVG9rZW5UeXBlLklERU5USUZJRVIpLnZhbHVlO1xuICAgICAgICBib3VuZE5hbWVzW1wiJFwiICsgZGVmYXVsdEJpbmRpbmddID0gdHJ1ZTtcbiAgICAgICAgaWYgKCF0aGlzLmVhdChUb2tlblR5cGUuQ09NTUEpKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5JbXBvcnQoZGVmYXVsdEJpbmRpbmcsIFtdLCB0aGlzLnBhcnNlRnJvbUNsYXVzZSgpKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5NVUwpKSB7XG4gICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkltcG9ydE5hbWVzcGFjZShkZWZhdWx0QmluZGluZywgdGhpcy5wYXJzZU5hbWVTcGFjZUJpbmRpbmcoYm91bmROYW1lcyksIHRoaXMucGFyc2VGcm9tQ2xhdXNlKCkpLCBzdGFydExvY2F0aW9uKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkxCUkFDRSkpIHtcbiAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuSW1wb3J0KGRlZmF1bHRCaW5kaW5nLCB0aGlzLnBhcnNlTmFtZWRJbXBvcnRzKGJvdW5kTmFtZXMpLCB0aGlzLnBhcnNlRnJvbUNsYXVzZSgpKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgfVxuICB9XG5cbiAgcGFyc2VFeHBvcnRTcGVjaWZpZXIoZXhwb3J0ZWROYW1lcywgZXhwb3J0ZWRCaW5kaW5ncykge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCBuYW1lID0gdGhpcy5wYXJzZUlkZW50aWZpZXIoKTtcbiAgICBleHBvcnRlZEJpbmRpbmdzW1wiJFwiICsgbmFtZV0gPSB0cnVlO1xuICAgIGlmICh0aGlzLmVhdENvbnRleHR1YWxLZXl3b3JkKFwiYXNcIikpIHtcbiAgICAgIGxldCBleHBvcnRlZE5hbWUgPSB0aGlzLnBhcnNlSWRlbnRpZmllck5hbWUoKTtcbiAgICAgIGlmICh7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGV4cG9ydGVkTmFtZXMsIFwiJFwiICsgZXhwb3J0ZWROYW1lKSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuRFVQTElDQVRFX0VYUE9SVEVEX05BTUUsIGV4cG9ydGVkTmFtZSk7XG4gICAgICB9XG4gICAgICBleHBvcnRlZE5hbWVzW1wiJFwiICsgZXhwb3J0ZWROYW1lXSA9IHRydWU7XG4gICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkV4cG9ydFNwZWNpZmllcihuYW1lLCBleHBvcnRlZE5hbWUpLCBzdGFydExvY2F0aW9uKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHt9Lmhhc093blByb3BlcnR5LmNhbGwoZXhwb3J0ZWROYW1lcywgXCIkXCIgKyBuYW1lKSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuRFVQTElDQVRFX0VYUE9SVEVEX05BTUUsIG5hbWUpO1xuICAgICAgfVxuICAgICAgZXhwb3J0ZWROYW1lc1tcIiRcIiArIG5hbWVdID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5FeHBvcnRTcGVjaWZpZXIobnVsbCwgbmFtZSksIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VFeHBvcnRDbGF1c2UoZXhwb3J0ZWROYW1lcywgZXhwb3J0ZWRCaW5kaW5ncykge1xuICAgIGxldCByZXN1bHQgPSBbXTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTEJSQUNFKTtcbiAgICB3aGlsZSAoIXRoaXMuZWF0KFRva2VuVHlwZS5SQlJBQ0UpKSB7XG4gICAgICByZXN1bHQucHVzaCh0aGlzLnBhcnNlRXhwb3J0U3BlY2lmaWVyKGV4cG9ydGVkTmFtZXMsIGV4cG9ydGVkQmluZGluZ3MpKTtcbiAgICAgIGlmICghdGhpcy5lYXQoVG9rZW5UeXBlLkNPTU1BKSkge1xuICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUkJSQUNFKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBwYXJzZUV4cG9ydERlY2xhcmF0aW9uKGV4cG9ydGVkTmFtZXMsIGV4cG9ydGVkQmluZGluZ3MpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKSwgZGVjbDtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuRVhQT1JUKTtcbiAgICBsZXQgaXNWYXIgPSBmYWxzZSwga2V5LCBvbGRMRE4gPSB0aGlzLkxETiwgb2xkVkROID0gdGhpcy5WRE47XG4gICAgdGhpcy5MRE4gPSBbXTtcbiAgICB0aGlzLlZETiA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgc3dpdGNoICh0aGlzLmxvb2thaGVhZC50eXBlKSB7XG4gICAgICBjYXNlIFRva2VuVHlwZS5NVUw6XG4gICAgICAgIHRoaXMubGV4KCk7XG4gICAgICAgIC8vIGV4cG9ydCAqIEZyb21DbGF1c2UgO1xuICAgICAgICBkZWNsID0gbmV3IFNoaWZ0LkV4cG9ydEFsbEZyb20odGhpcy5wYXJzZUZyb21DbGF1c2UoKSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBUb2tlblR5cGUuTEJSQUNFOlxuICAgICAgICAvLyBleHBvcnQgRXhwb3J0Q2xhdXNlIEZyb21DbGF1c2UgO1xuICAgICAgICAvLyBleHBvcnQgRXhwb3J0Q2xhdXNlIDtcbiAgICAgICAgbGV0IG5hbWVkRXhwb3J0cyA9IHRoaXMucGFyc2VFeHBvcnRDbGF1c2UoZXhwb3J0ZWROYW1lcywgZXhwb3J0ZWRCaW5kaW5ncyk7XG4gICAgICAgIGxldCBmcm9tQ2xhdXNlID0gbnVsbDtcbiAgICAgICAgaWYgKHRoaXMubWF0Y2hDb250ZXh0dWFsS2V5d29yZChcImZyb21cIikpIHtcbiAgICAgICAgICBmcm9tQ2xhdXNlID0gdGhpcy5wYXJzZUZyb21DbGF1c2UoKTtcbiAgICAgICAgfVxuICAgICAgICBkZWNsID0gbmV3IFNoaWZ0LkV4cG9ydEZyb20obmFtZWRFeHBvcnRzLCBmcm9tQ2xhdXNlKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFRva2VuVHlwZS5DTEFTUzpcbiAgICAgICAgLy8gZXhwb3J0IENsYXNzRGVjbGFyYXRpb25cbiAgICAgICAgZGVjbCA9IG5ldyBTaGlmdC5FeHBvcnQodGhpcy5wYXJzZUNsYXNzKHtpc0V4cHI6IGZhbHNlfSkpO1xuICAgICAgICBpZiAoe30uaGFzT3duUHJvcGVydHkuY2FsbChleHBvcnRlZE5hbWVzLCBcIiRcIiArIGRlY2wuZGVjbGFyYXRpb24ubmFtZS5uYW1lKSkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5EVVBMSUNBVEVfRVhQT1JURURfTkFNRSwgZGVjbC5kZWNsYXJhdGlvbi5uYW1lLm5hbWUpO1xuICAgICAgICB9XG4gICAgICAgIGtleSA9IGRlY2wuZGVjbGFyYXRpb24ubmFtZS5uYW1lO1xuICAgICAgICBleHBvcnRlZE5hbWVzW1wiJFwiICsga2V5XSA9IHRydWU7XG4gICAgICAgIGV4cG9ydGVkQmluZGluZ3NbXCIkXCIgKyBrZXldID0gdHJ1ZTtcbiAgICAgICAgb2xkTEROLnB1c2goa2V5KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFRva2VuVHlwZS5GVU5DVElPTjpcbiAgICAgICAgLy8gZXhwb3J0IEhvaXN0YWJsZURlY2xhcmF0aW9uXG4gICAgICAgIGRlY2wgPSBuZXcgU2hpZnQuRXhwb3J0KHRoaXMucGFyc2VGdW5jdGlvbih7aXNFeHByOiBmYWxzZSwgaXNUb3BMZXZlbDogdHJ1ZX0pKTtcbiAgICAgICAgaWYgKHt9Lmhhc093blByb3BlcnR5LmNhbGwoZXhwb3J0ZWROYW1lcywgXCIkXCIgKyBkZWNsLmRlY2xhcmF0aW9uLm5hbWUubmFtZSkpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuRFVQTElDQVRFX0VYUE9SVEVEX05BTUUsIGRlY2wuZGVjbGFyYXRpb24ubmFtZS5uYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBrZXkgPSBkZWNsLmRlY2xhcmF0aW9uLm5hbWUubmFtZTtcbiAgICAgICAgZXhwb3J0ZWROYW1lc1tcIiRcIiArIGtleV0gPSB0cnVlO1xuICAgICAgICBleHBvcnRlZEJpbmRpbmdzW1wiJFwiICsga2V5XSA9IHRydWU7XG4gICAgICAgIG9sZExETi5wdXNoKGtleSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBUb2tlblR5cGUuREVGQVVMVDpcbiAgICAgICAgaWYgKHt9Lmhhc093blByb3BlcnR5LmNhbGwoZXhwb3J0ZWROYW1lcywgXCIkZGVmYXVsdFwiKSkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5EVVBMSUNBVEVfRVhQT1JURURfTkFNRSwgXCJkZWZhdWx0XCIpO1xuICAgICAgICB9XG4gICAgICAgIGV4cG9ydGVkTmFtZXMuJGRlZmF1bHQgPSB0cnVlO1xuICAgICAgICB0aGlzLmxleCgpO1xuICAgICAgICBzd2l0Y2ggKHRoaXMubG9va2FoZWFkLnR5cGUpIHtcbiAgICAgICAgICBjYXNlIFRva2VuVHlwZS5GVU5DVElPTjpcbiAgICAgICAgICAgIC8vIGV4cG9ydCBkZWZhdWx0IEhvaXN0YWJsZURlY2xhcmF0aW9uW0RlZmF1bHRdXG4gICAgICAgICAgICBkZWNsID0gbmV3IFNoaWZ0LkV4cG9ydERlZmF1bHQodGhpcy5wYXJzZUZ1bmN0aW9uKHtpc0V4cHI6IGZhbHNlLCBpbkRlZmF1bHQ6IHRydWUsIGlzVG9wTGV2ZWw6IHRydWV9KSk7XG4gICAgICAgICAgICBrZXkgPSBkZWNsLmJvZHkubmFtZS5uYW1lO1xuICAgICAgICAgICAgaWYgKGtleSAhPT0gXCIqZGVmYXVsdCpcIikge1xuICAgICAgICAgICAgICBleHBvcnRlZEJpbmRpbmdzW1wiJFwiICsga2V5XSA9IHRydWU7XG4gICAgICAgICAgICAgIG9sZExETi5wdXNoKGtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFRva2VuVHlwZS5DTEFTUzpcbiAgICAgICAgICAgIC8vIGV4cG9ydCBkZWZhdWx0IENsYXNzRGVjbGFyYXRpb25bRGVmYXVsdF1cbiAgICAgICAgICAgIGRlY2wgPSBuZXcgU2hpZnQuRXhwb3J0RGVmYXVsdCh0aGlzLnBhcnNlQ2xhc3Moe2lzRXhwcjogZmFsc2UsIGluRGVmYXVsdDogdHJ1ZX0pKTtcbiAgICAgICAgICAgIGtleSA9IGRlY2wuYm9keS5uYW1lLm5hbWU7XG4gICAgICAgICAgICBpZiAoa2V5ICE9PSBcIipkZWZhdWx0KlwiKSB7XG4gICAgICAgICAgICAgIGV4cG9ydGVkQmluZGluZ3NbXCIkXCIgKyBrZXldID0gdHJ1ZTtcbiAgICAgICAgICAgICAgb2xkTEROLnB1c2goa2V5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAge1xuICAgICAgICAgICAgLy8gZXhwb3J0IGRlZmF1bHQgW2xvb2thaGVhZCDiiIkge2Z1bmN0aW9uLCBjbGFzc31dIEFzc2lnbm1lbnRFeHByZXNzaW9uW0luXSA7XG4gICAgICAgICAgICBkZWNsID0gbmV3IFNoaWZ0LkV4cG9ydERlZmF1bHQodGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCkpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBUb2tlblR5cGUuVkFSOlxuICAgICAgICBpc1ZhciA9IHRydWU7XG4gICAgICAgIC8vIGZhbGxzIHRocm91Z2hcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkxFVDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkNPTlNUOlxuICAgICAgICAvLyBleHBvcnQgTGV4aWNhbERlY2xhcmF0aW9uXG4gICAgICB7XG4gICAgICAgIGxldCBib3VuZE5hbWVzID0gW107XG4gICAgICAgIGRlY2wgPSBuZXcgU2hpZnQuRXhwb3J0KHRoaXMucGFyc2VWYXJpYWJsZURlY2xhcmF0aW9uKHtib3VuZE5hbWVzfSkpO1xuICAgICAgICBib3VuZE5hbWVzLmZvckVhY2gobmFtZSA9PiB7XG4gICAgICAgICAgICBpZiAoe30uaGFzT3duUHJvcGVydHkuY2FsbChleHBvcnRlZE5hbWVzLCBcIiRcIiArIG5hbWUpKSB7XG4gICAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5EVVBMSUNBVEVfRVhQT1JURURfTkFNRSwgbmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBleHBvcnRlZE5hbWVzW1wiJFwiICsgbmFtZV0gPSB0cnVlO1xuICAgICAgICAgICAgZXhwb3J0ZWRCaW5kaW5nc1tcIiRcIiArIG5hbWVdID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICAgIGlmIChpc1Zhcikge1xuICAgICAgICAgIGJvdW5kTmFtZXMuZm9yRWFjaChuYW1lID0+IG9sZFZETltcIiRcIiArIG5hbWVdID0gdHJ1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgW10ucHVzaC5hcHBseShvbGRMRE4sIGJvdW5kTmFtZXMpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY29uc3VtZVNlbWljb2xvbigpO1xuICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgfVxuICAgIHRoaXMuTEROID0gb2xkTEROO1xuICAgIHRoaXMuVkROID0gb2xkVkROO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihkZWNsLCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlTW9kdWxlSXRlbShleHBvcnRlZE5hbWVzLCBleHBvcnRlZEJpbmRpbmdzKSB7XG4gICAgc3dpdGNoICh0aGlzLmxvb2thaGVhZC50eXBlKSB7XG4gICAgICBjYXNlIFRva2VuVHlwZS5JTVBPUlQ6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlSW1wb3J0RGVjbGFyYXRpb24oKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkVYUE9SVDpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VFeHBvcnREZWNsYXJhdGlvbihleHBvcnRlZE5hbWVzLCBleHBvcnRlZEJpbmRpbmdzKTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlU3RhdGVtZW50TGlzdEl0ZW0oKTtcbiAgICB9XG4gIH1cblxuICBsb29rYWhlYWRMZXhpY2FsRGVjbGFyYXRpb24oKSB7XG4gICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkxFVCkgfHwgdGhpcy5tYXRjaChUb2tlblR5cGUuQ09OU1QpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLklERU5USUZJRVIpICYmIHRoaXMubG9va2FoZWFkLnZhbHVlID09PSBcImxldFwiKSB7XG4gICAgICBsZXQgbGV4ZXJTdGF0ZSA9IHRoaXMuc2F2ZUxleGVyU3RhdGUoKTtcbiAgICAgIHRoaXMubGV4KCk7XG4gICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuWUlFTEQpIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLklERU5USUZJRVIpIHx8XG4gICAgICAgIHRoaXMubWF0Y2goVG9rZW5UeXBlLkxCUkFDRSkgfHwgdGhpcy5tYXRjaChUb2tlblR5cGUuTEJSQUNLKSkge1xuICAgICAgICB0aGlzLnJlc3RvcmVMZXhlclN0YXRlKGxleGVyU3RhdGUpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucmVzdG9yZUxleGVyU3RhdGUobGV4ZXJTdGF0ZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHBhcnNlU3RhdGVtZW50TGlzdEl0ZW0oe2lzVG9wTGV2ZWwgPSBmYWxzZX0gPSB7fSkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGlmICh0aGlzLmVvZigpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuICAgIH1cblxuICAgIGxldCBkZWNsID0gdGhpcy53cmFwVkROKCgpID0+IHtcbiAgICAgIHN3aXRjaCAodGhpcy5sb29rYWhlYWQudHlwZSkge1xuICAgICAgICBjYXNlIFRva2VuVHlwZS5GVU5DVElPTjpcbiAgICAgICAgICByZXR1cm4gdGhpcy5wYXJzZUZ1bmN0aW9uKHtpc0V4cHI6IGZhbHNlLCBpc1RvcExldmVsfSk7XG4gICAgICAgIGNhc2UgVG9rZW5UeXBlLkNMQVNTOlxuICAgICAgICAgIHJldHVybiB0aGlzLnBhcnNlQ2xhc3Moe2lzRXhwcjogZmFsc2V9KTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBpZiAodGhpcy5sb29rYWhlYWRMZXhpY2FsRGVjbGFyYXRpb24oKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VWYXJpYWJsZURlY2xhcmF0aW9uU3RhdGVtZW50KCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB0aGlzLnBhcnNlU3RhdGVtZW50KHthbGxvd0xhYmVsZWRGdW5jdGlvbjogdHJ1ZSwgaXNUb3BMZXZlbH0pO1xuICAgICAgfVxuICAgIH0sIHRoaXMuY2hlY2tCbG9ja1Njb3BlKTtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24oZGVjbCwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZVN0YXRlbWVudCh7YWxsb3dMYWJlbGVkRnVuY3Rpb24gPSBmYWxzZSwgaXNUb3BMZXZlbCA9IGZhbHNlfSA9IHt9KSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IG9yaWdpbmFsTEROID0gdGhpcy5MRE47XG4gICAgdGhpcy5MRE4gPSBbXTtcbiAgICB2YXIgc3RtdCA9IHRoaXMud3JhcFZETigoKSA9PiB0aGlzLnBhcnNlU3RhdGVtZW50SGVscGVyKGFsbG93TGFiZWxlZEZ1bmN0aW9uLCBvcmlnaW5hbExETiwgaXNUb3BMZXZlbCkpO1xuICAgIHRoaXMuTEROID0gb3JpZ2luYWxMRE47XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHN0bXQsIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VTdGF0ZW1lbnRIZWxwZXIoYWxsb3dMYWJlbGVkRnVuY3Rpb24sIG9yaWdpbmFsTEROLCBpc1RvcExldmVsKSB7XG4gICAgaWYgKHRoaXMuZW9mKCkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgfVxuXG4gICAgc3dpdGNoICh0aGlzLmxvb2thaGVhZC50eXBlKSB7XG4gICAgICBjYXNlIFRva2VuVHlwZS5TRU1JQ09MT046XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlRW1wdHlTdGF0ZW1lbnQoKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkxCUkFDRTpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VCbG9ja1N0YXRlbWVudCgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuTFBBUkVOOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZUV4cHJlc3Npb25TdGF0ZW1lbnQoKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkJSRUFLOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZUJyZWFrU3RhdGVtZW50KCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5DT05USU5VRTpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VDb250aW51ZVN0YXRlbWVudCgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuREVCVUdHRVI6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlRGVidWdnZXJTdGF0ZW1lbnQoKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkRPOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZURvV2hpbGVTdGF0ZW1lbnQoKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkZPUjpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VGb3JTdGF0ZW1lbnQoKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLklGOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZUlmU3RhdGVtZW50KCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5SRVRVUk46XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlUmV0dXJuU3RhdGVtZW50KCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5TV0lUQ0g6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlU3dpdGNoU3RhdGVtZW50KCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5USFJPVzpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VUaHJvd1N0YXRlbWVudCgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuVFJZOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZVRyeVN0YXRlbWVudCgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuVkFSOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZVZhcmlhYmxlRGVjbGFyYXRpb25TdGF0ZW1lbnQoKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLldISUxFOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZVdoaWxlU3RhdGVtZW50KCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5XSVRIOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZVdpdGhTdGF0ZW1lbnQoKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkZVTkNUSU9OOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQ0xBU1M6XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG5cbiAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgaWYgKHRoaXMubG9va2FoZWFkTGV4aWNhbERlY2xhcmF0aW9uKCkpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuICAgICAgICB9XG4gICAgICAgIGxldCBleHByID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgICAgLy8gMTIuMTIgTGFiZWxsZWQgU3RhdGVtZW50cztcbiAgICAgICAgaWYgKGV4cHIudHlwZSA9PT0gXCJJZGVudGlmaWVyRXhwcmVzc2lvblwiICYmIHRoaXMuZWF0KFRva2VuVHlwZS5DT0xPTikpIHtcbiAgICAgICAgICBsZXQga2V5ID0gXCIkXCIgKyBleHByLm5hbWU7XG4gICAgICAgICAgaWYgKHt9Lmhhc093blByb3BlcnR5LmNhbGwodGhpcy5sYWJlbFNldCwga2V5KSkge1xuICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLkxBQkVMX1JFREVDTEFSQVRJT04sIGV4cHIubmFtZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuTEROID0gb3JpZ2luYWxMRE47XG4gICAgICAgICAgdGhpcy5sYWJlbFNldFtrZXldID0gdHJ1ZTtcbiAgICAgICAgICBsZXQgbGFiZWxlZEJvZHk7XG4gICAgICAgICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkZVTkNUSU9OKSkge1xuICAgICAgICAgICAgaWYgKHRoaXMuc3RyaWN0IHx8ICFhbGxvd0xhYmVsZWRGdW5jdGlvbikge1xuICAgICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGFiZWxlZEJvZHkgPSB0aGlzLnBhcnNlRnVuY3Rpb24oe2lzRXhwcjogZmFsc2UsIGFsbG93R2VuZXJhdG9yOiBmYWxzZSwgaXNUb3BMZXZlbH0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsYWJlbGVkQm9keSA9IHRoaXMucGFyc2VTdGF0ZW1lbnQoe2FsbG93TGFiZWxlZEZ1bmN0aW9uLCBpc1RvcExldmVsfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGRlbGV0ZSB0aGlzLmxhYmVsU2V0W2tleV07XG4gICAgICAgICAgcmV0dXJuIG5ldyBTaGlmdC5MYWJlbGVkU3RhdGVtZW50KGV4cHIubmFtZSwgbGFiZWxlZEJvZHkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuY29uc3VtZVNlbWljb2xvbigpO1xuICAgICAgICAgIHJldHVybiBuZXcgU2hpZnQuRXhwcmVzc2lvblN0YXRlbWVudChleHByKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHBhcnNlRW1wdHlTdGF0ZW1lbnQoKSB7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlNFTUlDT0xPTik7XG4gICAgcmV0dXJuIG5ldyBTaGlmdC5FbXB0eVN0YXRlbWVudDtcbiAgfVxuXG4gIHBhcnNlQmxvY2tTdGF0ZW1lbnQoKSB7XG4gICAgbGV0IHN0bXQgPSBuZXcgU2hpZnQuQmxvY2tTdGF0ZW1lbnQodGhpcy5wYXJzZUJsb2NrKCkpO1xuICAgIHRoaXMuY2hlY2tCbG9ja1Njb3BlKCk7XG4gICAgcmV0dXJuIHN0bXQ7XG4gIH1cblxuICBwYXJzZUV4cHJlc3Npb25TdGF0ZW1lbnQoKSB7XG4gICAgbGV0IGV4cHIgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgIHRoaXMuY29uc3VtZVNlbWljb2xvbigpO1xuICAgIHJldHVybiBuZXcgU2hpZnQuRXhwcmVzc2lvblN0YXRlbWVudChleHByKTtcbiAgfVxuXG4gIHBhcnNlQnJlYWtTdGF0ZW1lbnQoKSB7XG4gICAgbGV0IHRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkJSRUFLKTtcblxuICAgIC8vIENhdGNoIHRoZSB2ZXJ5IGNvbW1vbiBjYXNlIGZpcnN0OiBpbW1lZGlhdGVseSBhIHNlbWljb2xvbiAoVSswMDNCKS5cbiAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLlNFTUlDT0xPTikpIHtcbiAgICAgIGlmICghKHRoaXMuaW5JdGVyYXRpb24gfHwgdGhpcy5pblN3aXRjaCkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5JTExFR0FMX0JSRUFLKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5ldyBTaGlmdC5CcmVha1N0YXRlbWVudChudWxsKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQpIHtcbiAgICAgIGlmICghKHRoaXMuaW5JdGVyYXRpb24gfHwgdGhpcy5pblN3aXRjaCkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5JTExFR0FMX0JSRUFLKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5ldyBTaGlmdC5CcmVha1N0YXRlbWVudChudWxsKTtcbiAgICB9XG5cbiAgICBsZXQgbGFiZWwgPSBudWxsO1xuICAgIGlmICh0aGlzLmxvb2thaGVhZC50eXBlID09PSBUb2tlblR5cGUuSURFTlRJRklFUikge1xuICAgICAgbGFiZWwgPSB0aGlzLnBhcnNlSWRlbnRpZmllcigpO1xuXG4gICAgICBsZXQga2V5ID0gXCIkXCIgKyBsYWJlbDtcbiAgICAgIGlmICghe30uaGFzT3duUHJvcGVydHkuY2FsbCh0aGlzLmxhYmVsU2V0LCBrZXkpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTktOT1dOX0xBQkVMLCBsYWJlbCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5jb25zdW1lU2VtaWNvbG9uKCk7XG5cbiAgICBpZiAobGFiZWwgPT0gbnVsbCAmJiAhKHRoaXMuaW5JdGVyYXRpb24gfHwgdGhpcy5pblN3aXRjaCkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuSUxMRUdBTF9CUkVBSyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBTaGlmdC5CcmVha1N0YXRlbWVudChsYWJlbCk7XG4gIH1cblxuICBwYXJzZUNvbnRpbnVlU3RhdGVtZW50KCkge1xuICAgIGxldCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5DT05USU5VRSk7XG5cbiAgICAvLyBDYXRjaCB0aGUgdmVyeSBjb21tb24gY2FzZSBmaXJzdDogaW1tZWRpYXRlbHkgYSBzZW1pY29sb24gKFUrMDAzQikuXG4gICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5TRU1JQ09MT04pKSB7XG4gICAgICBpZiAoIXRoaXMuaW5JdGVyYXRpb24pIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5JTExFR0FMX0NPTlRJTlVFKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5ldyBTaGlmdC5Db250aW51ZVN0YXRlbWVudChudWxsKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQpIHtcbiAgICAgIGlmICghdGhpcy5pbkl0ZXJhdGlvbikge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLklMTEVHQUxfQ09OVElOVUUpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbmV3IFNoaWZ0LkNvbnRpbnVlU3RhdGVtZW50KG51bGwpO1xuICAgIH1cblxuICAgIGxldCBsYWJlbCA9IG51bGw7XG4gICAgaWYgKHRoaXMubG9va2FoZWFkLnR5cGUgPT09IFRva2VuVHlwZS5JREVOVElGSUVSKSB7XG4gICAgICBsYWJlbCA9IHRoaXMucGFyc2VJZGVudGlmaWVyKCk7XG5cbiAgICAgIGxldCBrZXkgPSBcIiRcIiArIGxhYmVsO1xuICAgICAgaWYgKCF7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRoaXMubGFiZWxTZXQsIGtleSkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlVOS05PV05fTEFCRUwsIGxhYmVsKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmNvbnN1bWVTZW1pY29sb24oKTtcbiAgICBpZiAoIXRoaXMuaW5JdGVyYXRpb24pIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuSUxMRUdBTF9DT05USU5VRSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBTaGlmdC5Db250aW51ZVN0YXRlbWVudChsYWJlbCk7XG4gIH1cblxuXG4gIHBhcnNlRGVidWdnZXJTdGF0ZW1lbnQoKSB7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkRFQlVHR0VSKTtcbiAgICB0aGlzLmNvbnN1bWVTZW1pY29sb24oKTtcbiAgICByZXR1cm4gbmV3IFNoaWZ0LkRlYnVnZ2VyU3RhdGVtZW50O1xuICB9XG5cbiAgcGFyc2VEb1doaWxlU3RhdGVtZW50KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5ETyk7XG4gICAgbGV0IG9sZEluSXRlcmF0aW9uID0gdGhpcy5pbkl0ZXJhdGlvbjtcbiAgICB0aGlzLmluSXRlcmF0aW9uID0gdHJ1ZTtcbiAgICBsZXQgYm9keSA9IHRoaXMucGFyc2VTdGF0ZW1lbnQoKTtcbiAgICB0aGlzLmluSXRlcmF0aW9uID0gb2xkSW5JdGVyYXRpb247XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuV0hJTEUpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MUEFSRU4pO1xuICAgIGxldCB0ZXN0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcbiAgICB0aGlzLmVhdChUb2tlblR5cGUuU0VNSUNPTE9OKTtcblxuICAgIHJldHVybiBuZXcgU2hpZnQuRG9XaGlsZVN0YXRlbWVudChib2R5LCB0ZXN0KTtcbiAgfVxuXG4gIHN0YXRpYyB0cmFuc2Zvcm1EZXN0cnVjdHVyaW5nKG5vZGUpIHtcbiAgICBzd2l0Y2ggKG5vZGUudHlwZSkge1xuICAgICAgY2FzZSBcIk9iamVjdEV4cHJlc3Npb25cIjpcbiAgICAgICAgcmV0dXJuIGNvcHlMb2NhdGlvbihub2RlLCBuZXcgU2hpZnQuT2JqZWN0QmluZGluZyhcbiAgICAgICAgICBub2RlLnByb3BlcnRpZXMubWFwKFBhcnNlci50cmFuc2Zvcm1EZXN0cnVjdHVyaW5nKVxuICAgICAgICApKTtcbiAgICAgIGNhc2UgXCJEYXRhUHJvcGVydHlcIjpcbiAgICAgICAgcmV0dXJuIGNvcHlMb2NhdGlvbihub2RlLCBuZXcgU2hpZnQuQmluZGluZ1Byb3BlcnR5UHJvcGVydHkoXG4gICAgICAgICAgbm9kZS5uYW1lLFxuICAgICAgICAgIFBhcnNlci50cmFuc2Zvcm1EZXN0cnVjdHVyaW5nKG5vZGUuZXhwcmVzc2lvbilcbiAgICAgICAgKSk7XG4gICAgICBjYXNlIFwiU2hvcnRoYW5kUHJvcGVydHlcIjpcbiAgICAgICAgcmV0dXJuIGNvcHlMb2NhdGlvbihub2RlLCB7IHR5cGU6IFwiQmluZGluZ1Byb3BlcnR5SWRlbnRpZmllclwiLFxuICAgICAgICAgIGJpbmRpbmc6IGNvcHlMb2NhdGlvbihub2RlLCB7IHR5cGU6IFwiQmluZGluZ0lkZW50aWZpZXJcIiwgbmFtZTogbm9kZS5uYW1lIH0pLFxuICAgICAgICAgIGluaXQ6IG51bGwsXG4gICAgICAgIH0pO1xuICAgICAgY2FzZSBcIkFycmF5RXhwcmVzc2lvblwiOlxuICAgICAgICBsZXQgbGFzdCA9IG5vZGUuZWxlbWVudHNbbm9kZS5lbGVtZW50cy5sZW5ndGggLSAxXTtcbiAgICAgICAgaWYgKGxhc3QgIT0gbnVsbCAmJiBsYXN0LnR5cGUgPT09IFwiU3ByZWFkRWxlbWVudFwiKSB7XG4gICAgICAgICAgcmV0dXJuIGNvcHlMb2NhdGlvbihub2RlLCBuZXcgU2hpZnQuQXJyYXlCaW5kaW5nKFxuICAgICAgICAgICAgbm9kZS5lbGVtZW50cy5zbGljZSgwLCAtMSkubWFwKGUgPT4gZSAmJiBQYXJzZXIudHJhbnNmb3JtRGVzdHJ1Y3R1cmluZyhlKSksXG4gICAgICAgICAgICBjb3B5TG9jYXRpb24obGFzdC5leHByZXNzaW9uLCBQYXJzZXIudHJhbnNmb3JtRGVzdHJ1Y3R1cmluZyhsYXN0LmV4cHJlc3Npb24pKVxuICAgICAgICAgICkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBjb3B5TG9jYXRpb24obm9kZSwgbmV3IFNoaWZ0LkFycmF5QmluZGluZyhcbiAgICAgICAgICAgIG5vZGUuZWxlbWVudHMubWFwKGUgPT4gZSAmJiBQYXJzZXIudHJhbnNmb3JtRGVzdHJ1Y3R1cmluZyhlKSksXG4gICAgICAgICAgICBudWxsXG4gICAgICAgICAgKSk7XG4gICAgICAgIH1cbiAgICAgIGNhc2UgXCJBc3NpZ25tZW50RXhwcmVzc2lvblwiOlxuICAgICAgICByZXR1cm4gY29weUxvY2F0aW9uKG5vZGUsIG5ldyBTaGlmdC5CaW5kaW5nV2l0aERlZmF1bHQoXG4gICAgICAgICAgUGFyc2VyLnRyYW5zZm9ybURlc3RydWN0dXJpbmcobm9kZS5iaW5kaW5nKSxcbiAgICAgICAgICBub2RlLmV4cHJlc3Npb25cbiAgICAgICAgKSk7XG4gICAgICBjYXNlIFwiSWRlbnRpZmllckV4cHJlc3Npb25cIjpcbiAgICAgICAgcmV0dXJuIGNvcHlMb2NhdGlvbihub2RlLCB7IHR5cGU6IFwiQmluZGluZ0lkZW50aWZpZXJcIiwgbmFtZTogbm9kZS5uYW1lIH0pO1xuICAgICAgY2FzZSBcIkNvbXB1dGVkTWVtYmVyRXhwcmVzc2lvblwiOlxuICAgICAgY2FzZSBcIlN0YXRpY01lbWJlckV4cHJlc3Npb25cIjpcbiAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICBjYXNlIFwiQXJyYXlCaW5kaW5nXCI6XG4gICAgICBjYXNlIFwiQmluZGluZ0lkZW50aWZpZXJcIjpcbiAgICAgIGNhc2UgXCJCaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyXCI6XG4gICAgICBjYXNlIFwiQmluZGluZ1Byb3BlcnR5UHJvcGVydHlcIjpcbiAgICAgIGNhc2UgXCJCaW5kaW5nV2l0aERlZmF1bHRcIjpcbiAgICAgIGNhc2UgXCJPYmplY3RCaW5kaW5nXCI6XG4gICAgICAgIHJldHVybiBub2RlO1xuICAgIH1cbiAgfVxuXG4gIHN0YXRpYyBpc0Rlc3RydWN0dXJpbmdUYXJnZXQobm9kZSwgaXNMZWFmTm9kZSkge1xuICAgIHN3aXRjaCAobm9kZS50eXBlKSB7XG4gICAgICBjYXNlIFwiT2JqZWN0RXhwcmVzc2lvblwiOlxuICAgICAgICByZXR1cm4gbm9kZS5wcm9wZXJ0aWVzLmV2ZXJ5KHAgPT5cbiAgICAgICAgICBwLnR5cGUgPT09IFwiQmluZGluZ1Byb3BlcnR5SWRlbnRpZmllclwiIHx8XG4gICAgICAgICAgcC50eXBlID09PSBcIlNob3J0aGFuZFByb3BlcnR5XCIgfHxcbiAgICAgICAgICBwLnR5cGUgPT09IFwiRGF0YVByb3BlcnR5XCIgJiZcbiAgICAgICAgICBQYXJzZXIuaXNEZXN0cnVjdHVyaW5nVGFyZ2V0V2l0aERlZmF1bHQocC5leHByZXNzaW9uLCBpc0xlYWZOb2RlKVxuICAgICAgICApO1xuICAgICAgY2FzZSBcIkFycmF5RXhwcmVzc2lvblwiOlxuICAgICAgICBpZiAobm9kZS5lbGVtZW50cy5sZW5ndGggPT09IDApIHJldHVybiBmYWxzZTtcbiAgICAgICAgaWYgKCFub2RlLmVsZW1lbnRzLnNsaWNlKDAsIC0xKVxuICAgICAgICAgICAgLmZpbHRlcihlID0+IGUgIT0gbnVsbClcbiAgICAgICAgICAgIC5ldmVyeShlID0+IFBhcnNlci5pc0Rlc3RydWN0dXJpbmdUYXJnZXRXaXRoRGVmYXVsdChlLCBpc0xlYWZOb2RlKSkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgbGV0IGxhc3QgPSBub2RlLmVsZW1lbnRzW25vZGUuZWxlbWVudHMubGVuZ3RoIC0gMV07XG4gICAgICAgIHJldHVybiBsYXN0ID09IG51bGwgfHxcbiAgICAgICAgICBsYXN0LnR5cGUgPT09IFwiU3ByZWFkRWxlbWVudFwiICYmIFBhcnNlci5pc0Rlc3RydWN0dXJpbmdUYXJnZXQobGFzdC5leHByZXNzaW9uLCBpc0xlYWZOb2RlKSB8fFxuICAgICAgICAgIFBhcnNlci5pc0Rlc3RydWN0dXJpbmdUYXJnZXRXaXRoRGVmYXVsdChsYXN0LCBpc0xlYWZOb2RlKTtcbiAgICAgIGNhc2UgXCJBcnJheUJpbmRpbmdcIjpcbiAgICAgIGNhc2UgXCJCaW5kaW5nSWRlbnRpZmllclwiOlxuICAgICAgY2FzZSBcIkJpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXJcIjpcbiAgICAgIGNhc2UgXCJCaW5kaW5nUHJvcGVydHlQcm9wZXJ0eVwiOlxuICAgICAgY2FzZSBcIkJpbmRpbmdXaXRoRGVmYXVsdFwiOlxuICAgICAgY2FzZSBcIk9iamVjdEJpbmRpbmdcIjpcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBpc0xlYWZOb2RlKG5vZGUpO1xuICB9XG5cbiAgc3RhdGljIGlzRGVzdHJ1Y3R1cmluZ1RhcmdldFdpdGhEZWZhdWx0KG5vZGUsIGlzTGVhZk5vZGUpIHtcbiAgICByZXR1cm4gbm9kZS50eXBlID09PSBcIkFzc2lnbm1lbnRFeHByZXNzaW9uXCIgJiYgbm9kZS5vcGVyYXRvciA9PT0gXCI9XCIgP1xuICAgICAgUGFyc2VyLmlzRGVzdHJ1Y3R1cmluZ1RhcmdldChub2RlLmJpbmRpbmcsIGlzTGVhZk5vZGUpIDpcbiAgICAgIFBhcnNlci5pc0Rlc3RydWN0dXJpbmdUYXJnZXQobm9kZSwgaXNMZWFmTm9kZSk7XG4gIH1cblxuICBzdGF0aWMgaXNWYWxpZFNpbXBsZUJpbmRpbmdUYXJnZXQobm9kZSkge1xuICAgIHJldHVybiBub2RlLnR5cGUgPT09IFwiSWRlbnRpZmllckV4cHJlc3Npb25cIjtcbiAgfVxuXG4gIHN0YXRpYyBpc1ZhbGlkU2ltcGxlQXNzaWdubWVudFRhcmdldChub2RlKSB7XG4gICAgc3dpdGNoIChub2RlLnR5cGUpIHtcbiAgICAgIGNhc2UgXCJJZGVudGlmaWVyRXhwcmVzc2lvblwiOlxuICAgICAgY2FzZSBcIkNvbXB1dGVkTWVtYmVyRXhwcmVzc2lvblwiOlxuICAgICAgY2FzZSBcIlN0YXRpY01lbWJlckV4cHJlc3Npb25cIjpcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHN0YXRpYyBib3VuZE5hbWVzKG5vZGUpIHtcbiAgICBzd2l0Y2ggKG5vZGUudHlwZSkge1xuICAgICAgY2FzZSBcIkJpbmRpbmdJZGVudGlmaWVyXCI6XG4gICAgICAgIHJldHVybiBbbm9kZS5uYW1lXTtcbiAgICAgIGNhc2UgXCJCaW5kaW5nV2l0aERlZmF1bHRcIjpcbiAgICAgICAgcmV0dXJuIFBhcnNlci5ib3VuZE5hbWVzKG5vZGUuYmluZGluZyk7XG4gICAgICBjYXNlIFwiQXJyYXlCaW5kaW5nXCI6IHtcbiAgICAgICAgbGV0IG5hbWVzID0gW107XG4gICAgICAgIG5vZGUuZWxlbWVudHMuZmlsdGVyKGUgPT4gZSAhPSBudWxsKS5mb3JFYWNoKGUgPT4gW10ucHVzaC5hcHBseShuYW1lcywgUGFyc2VyLmJvdW5kTmFtZXMoZSkpKTtcbiAgICAgICAgaWYgKG5vZGUucmVzdEVsZW1lbnQgIT0gbnVsbCkge1xuICAgICAgICAgIFtdLnB1c2guYXBwbHkobmFtZXMsIFBhcnNlci5ib3VuZE5hbWVzKG5vZGUucmVzdEVsZW1lbnQpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmFtZXM7XG4gICAgICB9XG4gICAgICBjYXNlIFwiT2JqZWN0QmluZGluZ1wiOiB7XG4gICAgICAgIGxldCBuYW1lcyA9IFtdO1xuICAgICAgICBub2RlLnByb3BlcnRpZXMuZm9yRWFjaChwID0+IHtcbiAgICAgICAgICBzd2l0Y2ggKHAudHlwZSkge1xuICAgICAgICAgICAgY2FzZSBcIkJpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXJcIjpcbiAgICAgICAgICAgICAgbmFtZXMucHVzaChwLmJpbmRpbmcubmFtZSk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIkJpbmRpbmdQcm9wZXJ0eVByb3BlcnR5XCI6XG4gICAgICAgICAgICAgIFtdLnB1c2guYXBwbHkobmFtZXMsIFBhcnNlci5ib3VuZE5hbWVzKHAuYmluZGluZykpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIC8vIGlzdGFuYnVsIGlnbm9yZSBuZXh0XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJib3VuZE5hbWVzIGNhbGxlZCBvbiBPYmplY3RCaW5kaW5nIHdpdGggaW52YWxpZCBwcm9wZXJ0eTogXCIgKyBwLnR5cGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBuYW1lcztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJDb21wdXRlZE1lbWJlckV4cHJlc3Npb25cIjpcbiAgICAgIGNhc2UgXCJTdGF0aWNNZW1iZXJFeHByZXNzaW9uXCI6XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgLy8gaXN0YW5idWwgaWdub3JlIG5leHRcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJib3VuZE5hbWVzIGNhbGxlZCBvbiBpbnZhbGlkIGFzc2lnbm1lbnQgdGFyZ2V0OiBcIiArIG5vZGUudHlwZSk7XG4gIH1cblxuICBwYXJzZUZvclN0YXRlbWVudCgpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuRk9SKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTFBBUkVOKTtcbiAgICBsZXQgdGVzdCA9IG51bGw7XG4gICAgbGV0IHJpZ2h0ID0gbnVsbDtcbiAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLlNFTUlDT0xPTikpIHtcbiAgICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuU0VNSUNPTE9OKSkge1xuICAgICAgICB0ZXN0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5TRU1JQ09MT04pO1xuICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5SUEFSRU4pKSB7XG4gICAgICAgIHJpZ2h0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgU2hpZnQuRm9yU3RhdGVtZW50KFxuICAgICAgICAgIG51bGwsXG4gICAgICAgICAgdGVzdCxcbiAgICAgICAgICByaWdodCxcbiAgICAgICAgICB0aGlzLmdldEl0ZXJhdG9yU3RhdGVtZW50RXBpbG9ndWUoKVxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IHN0YXJ0c1dpdGhMZXQgPSB0aGlzLm1hdGNoKFRva2VuVHlwZS5MRVQpIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLklERU5USUZJRVIpICYmIHRoaXMubG9va2FoZWFkLnZhbHVlID09PSBcImxldFwiO1xuICAgICAgbGV0IGlzRm9yRGVjbCA9IHRoaXMubG9va2FoZWFkTGV4aWNhbERlY2xhcmF0aW9uKCk7XG4gICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuVkFSKSB8fCBpc0ZvckRlY2wpIHtcbiAgICAgICAgbGV0IHByZXZpb3VzQWxsb3dJbiA9IHRoaXMuYWxsb3dJbjtcbiAgICAgICAgdGhpcy5hbGxvd0luID0gZmFsc2U7XG4gICAgICAgIGxldCBpbml0RGVjbCA9IHRoaXMucGFyc2VWYXJpYWJsZURlY2xhcmF0aW9uKHtpbkZvcjogdHJ1ZX0pO1xuICAgICAgICB0aGlzLmFsbG93SW4gPSBwcmV2aW91c0FsbG93SW47XG5cbiAgICAgICAgaWYgKGluaXREZWNsLmRlY2xhcmF0b3JzLmxlbmd0aCA9PT0gMSAmJiAodGhpcy5tYXRjaChUb2tlblR5cGUuSU4pIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLk9GKSkpIHtcbiAgICAgICAgICBsZXQgQ3RvcjtcblxuICAgICAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5JTikpIHtcbiAgICAgICAgICAgIGlmIChpbml0RGVjbC5kZWNsYXJhdG9yc1swXS5pbml0ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLklOVkFMSURfVkFSX0lOSVRfRk9SX0lOKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIEN0b3IgPSBTaGlmdC5Gb3JJblN0YXRlbWVudDtcbiAgICAgICAgICAgIHRoaXMubGV4KCk7XG4gICAgICAgICAgICByaWdodCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChpbml0RGVjbC5kZWNsYXJhdG9yc1swXS5pbml0ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLklOVkFMSURfVkFSX0lOSVRfRk9SX09GKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIEN0b3IgPSBTaGlmdC5Gb3JPZlN0YXRlbWVudDtcbiAgICAgICAgICAgIGZvciAobGV0IGtleSBpbiB0aGlzLlZETikge1xuICAgICAgICAgICAgICB0aGlzLlZETltrZXldID0gRk9SX09GX1ZBUjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5sZXgoKTtcbiAgICAgICAgICAgIHJpZ2h0ID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGV0IGVwaWxvZ3VlID0gdGhpcy53cmFwVkROKHRoaXMuZ2V0SXRlcmF0b3JTdGF0ZW1lbnRFcGlsb2d1ZSwgaXNGb3JEZWNsICYmIHRoaXMuY2hlY2tCbG9ja1Njb3BlKTtcblxuICAgICAgICAgIHJldHVybiBuZXcgQ3Rvcihpbml0RGVjbCwgcmlnaHQsIGVwaWxvZ3VlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuU0VNSUNPTE9OKTtcbiAgICAgICAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlNFTUlDT0xPTikpIHtcbiAgICAgICAgICAgIHRlc3QgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuU0VNSUNPTE9OKTtcbiAgICAgICAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJQQVJFTikpIHtcbiAgICAgICAgICAgIHJpZ2h0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIG5ldyBTaGlmdC5Gb3JTdGF0ZW1lbnQoaW5pdERlY2wsIHRlc3QsIHJpZ2h0LCB0aGlzLndyYXBWRE4odGhpcy5nZXRJdGVyYXRvclN0YXRlbWVudEVwaWxvZ3VlLCBpc0ZvckRlY2wgJiYgdGhpcy5jaGVja0Jsb2NrU2NvcGUpKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGV0IHByZXZpb3VzQWxsb3dJbiA9IHRoaXMuYWxsb3dJbjtcbiAgICAgICAgdGhpcy5hbGxvd0luID0gZmFsc2U7XG4gICAgICAgIGxldCBpbml0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgICAgdGhpcy5hbGxvd0luID0gcHJldmlvdXNBbGxvd0luO1xuXG4gICAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5JTikgfHwgIXN0YXJ0c1dpdGhMZXQgJiYgdGhpcy5tYXRjaChUb2tlblR5cGUuT0YpKSB7XG4gICAgICAgICAgaWYgKCFQYXJzZXIuaXNWYWxpZFNpbXBsZUFzc2lnbm1lbnRUYXJnZXQoaW5pdCkpIHtcbiAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5JTlZBTElEX0xIU19JTl9GT1JfSU4pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGxldCBDdG9yID0gdGhpcy5tYXRjaChUb2tlblR5cGUuSU4pID8gU2hpZnQuRm9ySW5TdGF0ZW1lbnQgOiBTaGlmdC5Gb3JPZlN0YXRlbWVudDtcblxuICAgICAgICAgIHRoaXMubGV4KCk7XG4gICAgICAgICAgcmlnaHQgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuXG4gICAgICAgICAgcmV0dXJuIG5ldyBDdG9yKGluaXQsIHJpZ2h0LCB0aGlzLmdldEl0ZXJhdG9yU3RhdGVtZW50RXBpbG9ndWUoKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlNFTUlDT0xPTik7XG4gICAgICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5TRU1JQ09MT04pKSB7XG4gICAgICAgICAgICB0ZXN0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlNFTUlDT0xPTik7XG4gICAgICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5SUEFSRU4pKSB7XG4gICAgICAgICAgICByaWdodCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBuZXcgU2hpZnQuRm9yU3RhdGVtZW50KGluaXQsIHRlc3QsIHJpZ2h0LCB0aGlzLmdldEl0ZXJhdG9yU3RhdGVtZW50RXBpbG9ndWUoKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBnZXRJdGVyYXRvclN0YXRlbWVudEVwaWxvZ3VlKCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgIGxldCBvbGRJbkl0ZXJhdGlvbiA9IHRoaXMuaW5JdGVyYXRpb247XG4gICAgdGhpcy5pbkl0ZXJhdGlvbiA9IHRydWU7XG4gICAgbGV0IGJvZHkgPSB0aGlzLnBhcnNlU3RhdGVtZW50KCk7XG4gICAgdGhpcy5pbkl0ZXJhdGlvbiA9IG9sZEluSXRlcmF0aW9uO1xuICAgIHJldHVybiBib2R5O1xuICB9XG5cbiAgcGFyc2VJZlN0YXRlbWVudCgpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuSUYpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MUEFSRU4pO1xuICAgIGxldCB0ZXN0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgIGxldCBjb25zZXF1ZW50ID0gdGhpcy5wYXJzZVN0YXRlbWVudCgpO1xuICAgIGxldCBhbHRlcm5hdGUgPSBudWxsO1xuICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuRUxTRSkpIHtcbiAgICAgIGFsdGVybmF0ZSA9IHRoaXMucGFyc2VTdGF0ZW1lbnQoKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBTaGlmdC5JZlN0YXRlbWVudCh0ZXN0LCBjb25zZXF1ZW50LCBhbHRlcm5hdGUpO1xuICB9XG5cbiAgcGFyc2VSZXR1cm5TdGF0ZW1lbnQoKSB7XG4gICAgbGV0IGFyZ3VtZW50ID0gbnVsbDtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SRVRVUk4pO1xuICAgIGlmICghdGhpcy5pbkZ1bmN0aW9uQm9keSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLklMTEVHQUxfUkVUVVJOKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQpIHtcbiAgICAgIHJldHVybiBuZXcgU2hpZnQuUmV0dXJuU3RhdGVtZW50KG51bGwpO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuU0VNSUNPTE9OKSkge1xuICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0UpICYmICF0aGlzLmVvZigpKSB7XG4gICAgICAgIGFyZ3VtZW50ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmNvbnN1bWVTZW1pY29sb24oKTtcbiAgICByZXR1cm4gbmV3IFNoaWZ0LlJldHVyblN0YXRlbWVudChhcmd1bWVudCk7XG4gIH1cblxuICBwYXJzZVdpdGhTdGF0ZW1lbnQoKSB7XG4gICAgaWYgKHRoaXMuc3RyaWN0KSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX01PREVfV0lUSCk7XG4gICAgfVxuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLldJVEgpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MUEFSRU4pO1xuICAgIGxldCBvYmplY3QgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgIGxldCBib2R5ID0gdGhpcy5wYXJzZVN0YXRlbWVudCgpO1xuXG4gICAgcmV0dXJuIG5ldyBTaGlmdC5XaXRoU3RhdGVtZW50KG9iamVjdCwgYm9keSk7XG4gIH1cblxuICBwYXJzZVN3aXRjaFN0YXRlbWVudCgpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuU1dJVENIKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTFBBUkVOKTtcbiAgICBsZXQgZGlzY3JpbWluYW50ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTEJSQUNFKTtcblxuICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuUkJSQUNFKSkge1xuICAgICAgcmV0dXJuIG5ldyBTaGlmdC5Td2l0Y2hTdGF0ZW1lbnQoZGlzY3JpbWluYW50LCBbXSk7XG4gICAgfVxuICAgIGxldCBvbGRJblN3aXRjaCA9IHRoaXMuaW5Td2l0Y2g7XG4gICAgdGhpcy5pblN3aXRjaCA9IHRydWU7XG4gICAgcmV0dXJuIHRoaXMud3JhcFZETigoKSA9PiB7XG4gICAgICBsZXQgY2FzZXMgPSB0aGlzLnBhcnNlU3dpdGNoQ2FzZXMoKTtcbiAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5ERUZBVUxUKSkge1xuICAgICAgICBsZXQgc3dpdGNoRGVmYXVsdCA9IHRoaXMucGFyc2VTd2l0Y2hEZWZhdWx0KCk7XG4gICAgICAgIGxldCBwb3N0RGVmYXVsdENhc2VzID0gdGhpcy5wYXJzZVN3aXRjaENhc2VzKCk7XG4gICAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5ERUZBVUxUKSkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5NVUxUSVBMRV9ERUZBVUxUU19JTl9TV0lUQ0gpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaW5Td2l0Y2ggPSBvbGRJblN3aXRjaDtcbiAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJCUkFDRSk7XG4gICAgICAgIHJldHVybiBuZXcgU2hpZnQuU3dpdGNoU3RhdGVtZW50V2l0aERlZmF1bHQoZGlzY3JpbWluYW50LCBjYXNlcywgc3dpdGNoRGVmYXVsdCwgcG9zdERlZmF1bHRDYXNlcyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmluU3dpdGNoID0gb2xkSW5Td2l0Y2g7XG4gICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SQlJBQ0UpO1xuICAgICAgICByZXR1cm4gbmV3IFNoaWZ0LlN3aXRjaFN0YXRlbWVudChkaXNjcmltaW5hbnQsIGNhc2VzKTtcbiAgICAgIH1cbiAgICB9LCB0aGlzLmNoZWNrQmxvY2tTY29wZSk7XG4gIH1cblxuICBwYXJzZVN3aXRjaENhc2VzKCkge1xuICAgIGxldCByZXN1bHQgPSBbXTtcbiAgICB3aGlsZSAoISh0aGlzLmVvZigpIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLlJCUkFDRSkgfHwgdGhpcy5tYXRjaChUb2tlblR5cGUuREVGQVVMVCkpKSB7XG4gICAgICByZXN1bHQucHVzaCh0aGlzLnBhcnNlU3dpdGNoQ2FzZSgpKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHBhcnNlU3dpdGNoQ2FzZSgpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuQ0FTRSk7XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5Td2l0Y2hDYXNlKHRoaXMucGFyc2VFeHByZXNzaW9uKCksIHRoaXMucGFyc2VTd2l0Y2hDYXNlQm9keSgpKSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZVN3aXRjaERlZmF1bHQoKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkRFRkFVTFQpO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuU3dpdGNoRGVmYXVsdCh0aGlzLnBhcnNlU3dpdGNoQ2FzZUJvZHkoKSksIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VTd2l0Y2hDYXNlQm9keSgpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuQ09MT04pO1xuICAgIHJldHVybiB0aGlzLnBhcnNlU3RhdGVtZW50TGlzdEluU3dpdGNoQ2FzZUJvZHkoKTtcbiAgfVxuXG4gIHBhcnNlU3RhdGVtZW50TGlzdEluU3dpdGNoQ2FzZUJvZHkoKSB7XG4gICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgIHdoaWxlICghKHRoaXMuZW9mKCkgfHwgdGhpcy5tYXRjaChUb2tlblR5cGUuUkJSQUNFKSB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5ERUZBVUxUKSB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5DQVNFKSkpIHtcbiAgICAgIHJlc3VsdC5wdXNoKHRoaXMucGFyc2VTdGF0ZW1lbnRMaXN0SXRlbSgpKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHBhcnNlVGhyb3dTdGF0ZW1lbnQoKSB7XG4gICAgbGV0IHRva2VuID0gdGhpcy5leHBlY3QoVG9rZW5UeXBlLlRIUk9XKTtcblxuICAgIGlmICh0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5ORVdMSU5FX0FGVEVSX1RIUk9XKTtcbiAgICB9XG5cbiAgICBsZXQgYXJndW1lbnQgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuXG4gICAgdGhpcy5jb25zdW1lU2VtaWNvbG9uKCk7XG5cbiAgICByZXR1cm4gbmV3IFNoaWZ0LlRocm93U3RhdGVtZW50KGFyZ3VtZW50KTtcbiAgfVxuXG4gIHBhcnNlVHJ5U3RhdGVtZW50KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5UUlkpO1xuICAgIGxldCBibG9jayA9IHRoaXMud3JhcFZETih0aGlzLnBhcnNlQmxvY2ssIHRoaXMuY2hlY2tCbG9ja1Njb3BlKTtcblxuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5DQVRDSCkpIHtcbiAgICAgIGxldCBoYW5kbGVyID0gdGhpcy5wYXJzZUNhdGNoQ2xhdXNlKCk7XG4gICAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLkZJTkFMTFkpKSB7XG4gICAgICAgIGxldCBmaW5hbGl6ZXIgPSB0aGlzLndyYXBWRE4odGhpcy5wYXJzZUJsb2NrLCB0aGlzLmNoZWNrQmxvY2tTY29wZSk7XG4gICAgICAgIHJldHVybiBuZXcgU2hpZnQuVHJ5RmluYWxseVN0YXRlbWVudChibG9jaywgaGFuZGxlciwgZmluYWxpemVyKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgU2hpZnQuVHJ5Q2F0Y2hTdGF0ZW1lbnQoYmxvY2ssIGhhbmRsZXIpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuRklOQUxMWSkpIHtcbiAgICAgIGxldCBmaW5hbGl6ZXIgPSB0aGlzLndyYXBWRE4odGhpcy5wYXJzZUJsb2NrLCB0aGlzLmNoZWNrQmxvY2tTY29wZSk7XG4gICAgICByZXR1cm4gbmV3IFNoaWZ0LlRyeUZpbmFsbHlTdGF0ZW1lbnQoYmxvY2ssIG51bGwsIGZpbmFsaXplcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5OT19DQVRDSF9PUl9GSU5BTExZKTtcbiAgICB9XG4gIH1cblxuICBwYXJzZVZhcmlhYmxlRGVjbGFyYXRpb25TdGF0ZW1lbnQoKSB7XG4gICAgbGV0IGRlY2xhcmF0aW9uID0gdGhpcy5wYXJzZVZhcmlhYmxlRGVjbGFyYXRpb24oKTtcbiAgICB0aGlzLmNvbnN1bWVTZW1pY29sb24oKTtcbiAgICByZXR1cm4gbmV3IFNoaWZ0LlZhcmlhYmxlRGVjbGFyYXRpb25TdGF0ZW1lbnQoZGVjbGFyYXRpb24pO1xuICB9XG5cbiAgcGFyc2VXaGlsZVN0YXRlbWVudCgpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuV0hJTEUpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MUEFSRU4pO1xuICAgIHJldHVybiBuZXcgU2hpZnQuV2hpbGVTdGF0ZW1lbnQodGhpcy5wYXJzZUV4cHJlc3Npb24oKSwgdGhpcy5nZXRJdGVyYXRvclN0YXRlbWVudEVwaWxvZ3VlKCkpO1xuICB9XG5cbiAgcGFyc2VDYXRjaENsYXVzZSgpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5DQVRDSCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgbGV0IHRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLlJQQVJFTikgfHwgdGhpcy5tYXRjaChUb2tlblR5cGUuTFBBUkVOKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRva2VuKTtcbiAgICB9XG5cbiAgICBsZXQgcGFyYW0gPSB0aGlzLnBhcnNlTGVmdEhhbmRTaWRlRXhwcmVzc2lvbih7YWxsb3dDYWxsOiBmYWxzZX0pO1xuXG4gICAgaWYgKCFQYXJzZXIuaXNEZXN0cnVjdHVyaW5nVGFyZ2V0KHBhcmFtLCBQYXJzZXIuaXNWYWxpZFNpbXBsZUJpbmRpbmdUYXJnZXQpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodG9rZW4pO1xuICAgIH1cbiAgICBwYXJhbSA9IFBhcnNlci50cmFuc2Zvcm1EZXN0cnVjdHVyaW5nKHBhcmFtKTtcblxuICAgIGxldCBib3VuZCA9IFBhcnNlci5ib3VuZE5hbWVzKHBhcmFtKTtcbiAgICBpZiAoZmlyc3REdXBsaWNhdGUoYm91bmQpICE9IG51bGwpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuRFVQTElDQVRFX0JJTkRJTkcsIGZpcnN0RHVwbGljYXRlKGJvdW5kKSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuc3RyaWN0ICYmIGJvdW5kLnNvbWUoaXNSZXN0cmljdGVkV29yZCkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuU1RSSUNUX0NBVENIX1ZBUklBQkxFKTtcbiAgICB9XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcblxuICAgIGxldCBib2R5ID0gdGhpcy53cmFwVkROKHRoaXMucGFyc2VCbG9jaywgdGhpcy5jaGVja0Jsb2NrU2NvcGUpO1xuXG4gICAgdGhpcy5MRE4uZm9yRWFjaChuYW1lID0+IHtcbiAgICAgIGlmIChib3VuZC5pbmRleE9mKG5hbWUpID49IDApIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5EVVBMSUNBVEVfQklORElORywgbmFtZSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgZm9yIChsZXQga2V5IGluIHRoaXMuVkROKSB7XG4gICAgICBpZiAodGhpcy5WRE5ba2V5XSA9PT0gRk9SX09GX1ZBUiAmJiBib3VuZC5pbmRleE9mKGtleS5zbGljZSgxKSkgPj0gMCkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuRFVQTElDQVRFX0NBVENIX0JJTkRJTkcsIGtleS5zbGljZSgxKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQ2F0Y2hDbGF1c2UocGFyYW0sIGJvZHkpLCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlQmxvY2soKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxCUkFDRSk7XG5cbiAgICBsZXQgYm9keSA9IFtdO1xuICAgIHdoaWxlICghdGhpcy5tYXRjaChUb2tlblR5cGUuUkJSQUNFKSkge1xuICAgICAgYm9keS5wdXNoKHRoaXMucGFyc2VTdGF0ZW1lbnRMaXN0SXRlbSgpKTtcbiAgICB9XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJCUkFDRSk7XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5CbG9jayhib2R5KSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZVZhcmlhYmxlRGVjbGFyYXRpb24oe2luRm9yID0gZmFsc2UsIGJvdW5kTmFtZXMgPSBbXX0gPSB7fSkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCB0b2tlbiA9IHRoaXMubGV4KCk7XG5cbiAgICAvLyBQcmVjZWRlZCBieSB0aGlzLm1hdGNoKFRva2VuU3ViVHlwZS5WQVIpIHx8IHRoaXMubWF0Y2goVG9rZW5TdWJUeXBlLkxFVCk7XG4gICAgbGV0IGtpbmQgPSB0b2tlbi50eXBlID09PSBUb2tlblR5cGUuVkFSID8gXCJ2YXJcIiA6IHRva2VuLnR5cGUgPT09IFRva2VuVHlwZS5DT05TVCA/IFwiY29uc3RcIiA6IFwibGV0XCI7XG4gICAgbGV0IGRlY2xhcmF0b3JzID0gdGhpcy5wYXJzZVZhcmlhYmxlRGVjbGFyYXRvckxpc3Qoa2luZCwge2luRm9yLCBib3VuZE5hbWVzfSk7XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5WYXJpYWJsZURlY2xhcmF0aW9uKGtpbmQsIGRlY2xhcmF0b3JzKSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZVZhcmlhYmxlRGVjbGFyYXRvckxpc3Qoa2luZCwge2luRm9yLCBib3VuZE5hbWVzfSkge1xuICAgIGxldCByZXN1bHQgPSBbXTtcbiAgICBsZXQgW3ZhckRlY2wsIGFsbEJvdW5kXSA9IHRoaXMucGFyc2VWYXJpYWJsZURlY2xhcmF0b3Ioa2luZCwge2FsbG93Q29uc3RXaXRob3V0QmluZGluZzogaW5Gb3J9KTtcbiAgICByZXN1bHQucHVzaCh2YXJEZWNsKTtcbiAgICBpZiAoaW5Gb3IgJiYga2luZCA9PT0gXCJjb25zdFwiICYmIHZhckRlY2wuaW5pdCA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICB3aGlsZSAodGhpcy5lYXQoVG9rZW5UeXBlLkNPTU1BKSkge1xuICAgICAgbGV0IFtuZXh0VmFyRGVjbCwgYm91bmRdID0gdGhpcy5wYXJzZVZhcmlhYmxlRGVjbGFyYXRvcihraW5kLCB7YWxsb3dDb25zdFdpdGhvdXRCaW5kaW5nOiBmYWxzZX0pO1xuICAgICAgcmVzdWx0LnB1c2gobmV4dFZhckRlY2wpO1xuICAgICAgaWYgKGtpbmQgIT09IFwidmFyXCIpIHtcbiAgICAgICAgYWxsQm91bmQgPSBhbGxCb3VuZC5jb25jYXQoYm91bmQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0aGlzLnN0cmljdCAmJiBhbGxCb3VuZC5zb21lKGlzUmVzdHJpY3RlZFdvcmQpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRoaXMubG9va2FoZWFkLCBFcnJvck1lc3NhZ2VzLlNUUklDVF9WQVJfTkFNRSk7XG4gICAgfVxuXG4gICAgaWYgKGtpbmQgIT09IFwidmFyXCIpIHtcbiAgICAgIGxldCBkdXBlID0gZmlyc3REdXBsaWNhdGUoYWxsQm91bmQpO1xuICAgICAgaWYgKGR1cGUgIT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLkRVUExJQ0FURV9CSU5ESU5HLCBkdXBlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgW10ucHVzaC5hcHBseShib3VuZE5hbWVzLCBhbGxCb3VuZCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHBhcnNlVmFyaWFibGVEZWNsYXJhdG9yKGtpbmQsIHthbGxvd0NvbnN0V2l0aG91dEJpbmRpbmd9KSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IHRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG5cbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuTFBBUkVOKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICB9XG5cbiAgICBsZXQgcHJldmlvdXNBbGxvd0JpbmRpbmdQYXR0ZXJuID0gdGhpcy5hbGxvd0JpbmRpbmdQYXR0ZXJuO1xuICAgIHRoaXMuYWxsb3dCaW5kaW5nUGF0dGVybiA9IHRydWU7XG5cbiAgICBsZXQgaWQgPSB0aGlzLnBhcnNlTGVmdEhhbmRTaWRlRXhwcmVzc2lvbih7YWxsb3dDYWxsOiBmYWxzZX0pO1xuXG4gICAgdGhpcy5hbGxvd0JpbmRpbmdQYXR0ZXJuID0gcHJldmlvdXNBbGxvd0JpbmRpbmdQYXR0ZXJuO1xuXG4gICAgaWYgKCFQYXJzZXIuaXNEZXN0cnVjdHVyaW5nVGFyZ2V0KGlkLCBQYXJzZXIuaXNWYWxpZFNpbXBsZUJpbmRpbmdUYXJnZXQpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodG9rZW4pO1xuICAgIH1cbiAgICBpZCA9IFBhcnNlci50cmFuc2Zvcm1EZXN0cnVjdHVyaW5nKGlkKTtcblxuICAgIGxldCBib3VuZCA9IFBhcnNlci5ib3VuZE5hbWVzKGlkKTtcblxuICAgIGxldCBpbml0ID0gbnVsbDtcbiAgICBpZiAoa2luZCA9PT0gXCJjb25zdFwiKSB7XG4gICAgICBpZiAoIWFsbG93Q29uc3RXaXRob3V0QmluZGluZyB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5BU1NJR04pKSB7XG4gICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5BU1NJR04pO1xuICAgICAgICBpbml0ID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0aGlzLmVhdChUb2tlblR5cGUuQVNTSUdOKSkge1xuICAgICAgaW5pdCA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgIH1cblxuICAgIGlmIChraW5kID09PSBcInZhclwiKSB7XG4gICAgICBib3VuZC5mb3JFYWNoKG5hbWUgPT4gdGhpcy5WRE5bXCIkXCIgKyBuYW1lXSA9IHRydWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoYm91bmQuaW5kZXhPZihcImxldFwiKSA+PSAwKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuTEVYSUNBTExZX0JPVU5EX0xFVCk7XG4gICAgICB9XG4gICAgICBbXS5wdXNoLmFwcGx5KHRoaXMuTEROLCBib3VuZCk7XG4gICAgfVxuICAgIHJldHVybiBbdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlZhcmlhYmxlRGVjbGFyYXRvcihpZCwgaW5pdCksIHN0YXJ0TG9jYXRpb24pLCBib3VuZF07XG4gIH1cblxuICBwYXJzZUV4cHJlc3Npb24oKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICBsZXQgZXhwciA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuXG4gICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkNPTU1BKSkge1xuICAgICAgd2hpbGUgKCF0aGlzLmVvZigpKSB7XG4gICAgICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuQ09NTUEpKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5sZXgoKTtcbiAgICAgICAgZXhwciA9IHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5CaW5hcnlFeHByZXNzaW9uKFwiLFwiLCBleHByLCB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKSksXG4gICAgICAgICAgICBzdGFydExvY2F0aW9uKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGV4cHI7XG4gIH1cblxuICBwYXJzZUFycm93RXhwcmVzc2lvblRhaWwoaGVhZCwgc3RhcnRMb2NhdGlvbikge1xuICAgIGxldCBhcnJvdyA9IHRoaXMuZXhwZWN0KFRva2VuVHlwZS5BUlJPVyk7XG5cbiAgICAvLyBDb252ZXJ0IHBhcmFtIGxpc3QuXG4gICAgbGV0IHtwYXJhbXMgPSBudWxsLCByZXN0ID0gbnVsbH0gPSBoZWFkO1xuICAgIGlmIChoZWFkLnR5cGUgIT09IEFSUk9XX0VYUFJFU1NJT05fUEFSQU1TKSB7XG4gICAgICBpZiAoaGVhZC50eXBlID09PSBcIklkZW50aWZpZXJFeHByZXNzaW9uXCIpIHtcbiAgICAgICAgbGV0IG5hbWUgPSBoZWFkLm5hbWU7XG4gICAgICAgIGlmIChTVFJJQ1RfTU9ERV9SRVNFUlZFRF9XT1JELmhhc093blByb3BlcnR5KG5hbWUpKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlNUUklDVF9SRVNFUlZFRF9XT1JEKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNSZXN0cmljdGVkV29yZChuYW1lKSkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUEFSQU1fTkFNRSk7XG4gICAgICAgIH1cbiAgICAgICAgaGVhZCA9IFBhcnNlci50cmFuc2Zvcm1EZXN0cnVjdHVyaW5nKGhlYWQpO1xuICAgICAgICBwYXJhbXMgPSBbaGVhZF07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQoYXJyb3cpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5MQlJBQ0UpKSB7XG4gICAgICBsZXQgcHJldmlvdXNZaWVsZCA9IHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb247XG4gICAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gZmFsc2U7XG4gICAgICBsZXQgYm91bmRQYXJhbXMgPSBbXS5jb25jYXQuYXBwbHkoW10sIHBhcmFtcy5tYXAoUGFyc2VyLmJvdW5kTmFtZXMpKTtcbiAgICAgIGxldCBbYm9keV0gPSB0aGlzLnBhcnNlRnVuY3Rpb25Cb2R5KGJvdW5kUGFyYW1zKTtcbiAgICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBwcmV2aW91c1lpZWxkO1xuICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5BcnJvd0V4cHJlc3Npb24ocGFyYW1zLCByZXN0LCBib2R5KSwgc3RhcnRMb2NhdGlvbik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBib2R5ID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkFycm93RXhwcmVzc2lvbihwYXJhbXMsIHJlc3QsIGJvZHkpLCBzdGFydExvY2F0aW9uKTtcbiAgICB9XG4gIH1cblxuICAvLyBUT0RPOiB0aGlzIGlzIGdyb3NzIGFuZCB3ZSBzaG91bGRuJ3QgYWN0dWFsbHkgZG8gdGhpc1xuICBzdGF0aWMgY29udGFpbnNCaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyKG5vZGUpIHtcbiAgICBzd2l0Y2gobm9kZS50eXBlKSB7XG4gICAgICBjYXNlIFwiQmluZGluZ1Byb3BlcnR5SWRlbnRpZmllclwiOlxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIGNhc2UgXCJPYmplY3RFeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiT2JqZWN0QmluZGluZ1wiOlxuICAgICAgICByZXR1cm4gbm9kZS5wcm9wZXJ0aWVzLnNvbWUoUGFyc2VyLmNvbnRhaW5zQmluZGluZ1Byb3BlcnR5SWRlbnRpZmllcik7XG4gICAgICBjYXNlIFwiQXJyYXlFeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiQXJyYXlCaW5kaW5nXCI6XG4gICAgICAgIHJldHVybiBub2RlLmVsZW1lbnRzLnNvbWUoZSA9PiBlICE9IG51bGwgJiYgUGFyc2VyLmNvbnRhaW5zQmluZGluZ1Byb3BlcnR5SWRlbnRpZmllcihlKSk7XG4gICAgICBjYXNlIFwiU2hvcnRoYW5kUHJvcGVydHlcIjpcbiAgICAgIGNhc2UgXCJNZXRob2RcIjpcbiAgICAgIGNhc2UgXCJHZXR0ZXJcIjpcbiAgICAgIGNhc2UgXCJTZXR0ZXJcIjpcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgY2FzZSBcIlNwcmVhZEVsZW1lbnRcIjpcbiAgICAgICAgcmV0dXJuIFBhcnNlci5jb250YWluc0JpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXIobm9kZS5leHByZXNzaW9uKTtcblxuICAgICAgY2FzZSBcIkFycm93RXhwcmVzc2lvblwiOlxuICAgICAgY2FzZSBcIkZ1bmN0aW9uRXhwcmVzc2lvblwiOlxuICAgICAgY2FzZSBcIklkZW50aWZpZXJFeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiTGl0ZXJhbEJvb2xlYW5FeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiTGl0ZXJhbEluZmluaXR5RXhwcmVzc2lvblwiOlxuICAgICAgY2FzZSBcIkxpdGVyYWxOdWxsRXhwcmVzc2lvblwiOlxuICAgICAgY2FzZSBcIkxpdGVyYWxOdW1lcmljRXhwcmVzc2lvblwiOlxuICAgICAgY2FzZSBcIkxpdGVyYWxSZWdFeHBFeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiTGl0ZXJhbFN0cmluZ0V4cHJlc3Npb25cIjpcbiAgICAgIGNhc2UgXCJOZXdUYXJnZXRFeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiU3VwZXJcIjpcbiAgICAgIGNhc2UgXCJUaGlzRXhwcmVzc2lvblwiOlxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICBjYXNlIFwiQXNzaWdubWVudEV4cHJlc3Npb25cIjpcbiAgICAgICAgcmV0dXJuIFBhcnNlci5jb250YWluc0JpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXIobm9kZS5leHByZXNzaW9uKTtcbiAgICAgIGNhc2UgXCJCaW5hcnlFeHByZXNzaW9uXCI6XG4gICAgICAgIHJldHVybiBQYXJzZXIuY29udGFpbnNCaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyKG5vZGUubGVmdClcbiAgICAgICAgICB8fCBQYXJzZXIuY29udGFpbnNCaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyKG5vZGUucmlnaHQpO1xuICAgICAgY2FzZSBcIkNhbGxFeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiTmV3RXhwcmVzc2lvblwiOlxuICAgICAgICByZXR1cm4gUGFyc2VyLmNvbnRhaW5zQmluZGluZ1Byb3BlcnR5SWRlbnRpZmllcihub2RlLmNhbGxlZSlcbiAgICAgICAgICB8fCBub2RlLmFyZ3VtZW50cy5zb21lKFBhcnNlci5jb250YWluc0JpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXIpO1xuICAgICAgY2FzZSBcIkNsYXNzRXhwcmVzc2lvblwiOlxuICAgICAgICByZXR1cm4gbm9kZS5zdXBlciAhPSBudWxsICYmIFBhcnNlci5jb250YWluc0JpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXIobm9kZS5zdXBlcik7XG4gICAgICBjYXNlIFwiQ29tcHV0ZWRNZW1iZXJFeHByZXNzaW9uXCI6XG4gICAgICAgIHJldHVybiBQYXJzZXIuY29udGFpbnNCaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyKG5vZGUub2JqZWN0KVxuICAgICAgICAgIHx8IFBhcnNlci5jb250YWluc0JpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXIobm9kZS5leHByZXNzaW9uKTtcbiAgICAgIGNhc2UgXCJDb25kaXRpb25hbEV4cHJlc3Npb25cIjpcbiAgICAgICAgcmV0dXJuIFBhcnNlci5jb250YWluc0JpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXIobm9kZS50ZXN0KVxuICAgICAgICAgIHx8IFBhcnNlci5jb250YWluc0JpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXIobm9kZS5jb25zZXF1ZW50KVxuICAgICAgICAgIHx8IFBhcnNlci5jb250YWluc0JpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXIobm9kZS5hbHRlcm5hdGUpO1xuICAgICAgY2FzZSBcIlByZWZpeEV4cHJlc3Npb25cIjpcbiAgICAgIGNhc2UgXCJQb3N0Zml4RXhwcmVzc2lvblwiOlxuICAgICAgICByZXR1cm4gUGFyc2VyLmNvbnRhaW5zQmluZGluZ1Byb3BlcnR5SWRlbnRpZmllcihub2RlLm9wZXJhbmQpO1xuICAgICAgY2FzZSBcIlN0YXRpY01lbWJlckV4cHJlc3Npb25cIjpcbiAgICAgICAgcmV0dXJuIFBhcnNlci5jb250YWluc0JpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXIobm9kZS5vYmplY3QpO1xuICAgICAgY2FzZSBcIlRlbXBsYXRlRXhwcmVzc2lvblwiOlxuICAgICAgICByZXR1cm4gbm9kZS5lbGVtZW50cy5zb21lKGUgPT4gZS50eXBlICE9PSBcIlRlbXBsYXRlRWxlbWVudFwiICYmIFBhcnNlci5jb250YWluc0JpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXIoZSkpO1xuICAgICAgY2FzZSBcIllpZWxkRXhwcmVzc2lvblwiOlxuICAgICAgICByZXR1cm4gbm9kZS5leHByZXNzaW9uICE9IG51bGwgJiYgUGFyc2VyLmNvbnRhaW5zQmluZGluZ1Byb3BlcnR5SWRlbnRpZmllcihub2RlLmV4cHJlc3Npb24pO1xuICAgICAgY2FzZSBcIllpZWxkR2VuZXJhdG9yRXhwcmVzc2lvblwiOlxuICAgICAgY2FzZSBcIkRhdGFQcm9wZXJ0eVwiOlxuICAgICAgICByZXR1cm4gUGFyc2VyLmNvbnRhaW5zQmluZGluZ1Byb3BlcnR5SWRlbnRpZmllcihub2RlLmV4cHJlc3Npb24pO1xuICAgIH1cbiAgfVxuXG4gIHBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKSB7XG4gICAgbGV0IHRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICBpZiAodGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiAmJiAhdGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlciAmJiB0aGlzLmxvb2thaGVhZC52YWx1ZSA9PT0gXCJ5aWVsZFwiKSB7XG4gICAgICByZXR1cm4gdGhpcy5wYXJzZVlpZWxkRXhwcmVzc2lvbigpO1xuICAgIH1cblxuICAgIGxldCBwcmV2aW91c0FsbG93QmluZGluZ1BhdHRlcm4gPSB0aGlzLmFsbG93QmluZGluZ1BhdHRlcm47XG4gICAgdGhpcy5hbGxvd0JpbmRpbmdQYXR0ZXJuID0gdHJ1ZTtcblxuICAgIGxldCBub2RlID0gdGhpcy5wYXJzZUNvbmRpdGlvbmFsRXhwcmVzc2lvbigpO1xuXG4gICAgdGhpcy5hbGxvd0JpbmRpbmdQYXR0ZXJuID0gcHJldmlvdXNBbGxvd0JpbmRpbmdQYXR0ZXJuO1xuXG4gICAgaWYgKCF0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCAmJiB0aGlzLm1hdGNoKFRva2VuVHlwZS5BUlJPVykpIHtcbiAgICAgIHJldHVybiB0aGlzLnBhcnNlQXJyb3dFeHByZXNzaW9uVGFpbChub2RlLCBzdGFydExvY2F0aW9uKTtcbiAgICB9XG5cbiAgICBsZXQgaXNBc3NpZ25tZW50T3BlcmF0b3IgPSBmYWxzZTtcbiAgICBsZXQgb3BlcmF0b3IgPSB0aGlzLmxvb2thaGVhZDtcbiAgICBzd2l0Y2ggKG9wZXJhdG9yLnR5cGUpIHtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9CSVRfT1I6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fQklUX1hPUjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9CSVRfQU5EOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX1NITDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9TSFI6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fU0hSX1VOU0lHTkVEOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX0FERDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9TVUI6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fTVVMOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX0RJVjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9NT0Q6XG4gICAgICAgIGlzQXNzaWdubWVudE9wZXJhdG9yID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGlmIChpc0Fzc2lnbm1lbnRPcGVyYXRvcikge1xuICAgICAgaWYgKCFQYXJzZXIuaXNWYWxpZFNpbXBsZUFzc2lnbm1lbnRUYXJnZXQobm9kZSkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLklOVkFMSURfTEhTX0lOX0FTU0lHTk1FTlQpO1xuICAgICAgfVxuICAgICAgaWYgKG5vZGUudHlwZSA9PT0gXCJJZGVudGlmaWVyRXhwcmVzc2lvblwiKSB7XG4gICAgICAgIGlmICh0aGlzLnN0cmljdCAmJiBpc1Jlc3RyaWN0ZWRXb3JkKG5vZGUubmFtZSkpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLlNUUklDVF9MSFNfQVNTSUdOTUVOVCk7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZSA9IFBhcnNlci50cmFuc2Zvcm1EZXN0cnVjdHVyaW5nKG5vZGUpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAob3BlcmF0b3IudHlwZSA9PT0gVG9rZW5UeXBlLkFTU0lHTikge1xuICAgICAgaWYgKCFQYXJzZXIuaXNEZXN0cnVjdHVyaW5nVGFyZ2V0KG5vZGUsIFBhcnNlci5pc1ZhbGlkU2ltcGxlQXNzaWdubWVudFRhcmdldCkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLklOVkFMSURfTEhTX0lOX0FTU0lHTk1FTlQpO1xuICAgICAgfVxuICAgICAgbm9kZSA9IFBhcnNlci50cmFuc2Zvcm1EZXN0cnVjdHVyaW5nKG5vZGUpO1xuXG4gICAgICBsZXQgYm91bmQgPSBQYXJzZXIuYm91bmROYW1lcyhub2RlKTtcbiAgICAgIGlmICh0aGlzLnN0cmljdCAmJiBib3VuZC5zb21lKGlzUmVzdHJpY3RlZFdvcmQpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuU1RSSUNUX0xIU19BU1NJR05NRU5UKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKCF0aGlzLmFsbG93QmluZGluZ1BhdHRlcm4gJiYgUGFyc2VyLmNvbnRhaW5zQmluZGluZ1Byb3BlcnR5SWRlbnRpZmllcihub2RlKSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQob3BlcmF0b3IpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfVxuXG4gICAgdGhpcy5sZXgoKTtcbiAgICBsZXQgcHJldmlvdXNJbkdlbmVyYXRvclBhcmFtZXRlciA9IHRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXI7XG4gICAgdGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlciA9IGZhbHNlO1xuICAgIGxldCByaWdodCA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgIHRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXIgPSBwcmV2aW91c0luR2VuZXJhdG9yUGFyYW1ldGVyO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQXNzaWdubWVudEV4cHJlc3Npb24ob3BlcmF0b3IudHlwZS5uYW1lLCBub2RlLCByaWdodCksIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgbG9va2FoZWFkQXNzaWdubWVudEV4cHJlc3Npb24oKSB7XG4gICAgc3dpdGNoICh0aGlzLmxvb2thaGVhZC50eXBlKSB7XG4gICAgICBjYXNlIFRva2VuVHlwZS5BREQ6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fRElWOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQ0xBU1M6XG4gICAgICBjYXNlIFRva2VuVHlwZS5ERUM6XG4gICAgICBjYXNlIFRva2VuVHlwZS5ESVY6XG4gICAgICBjYXNlIFRva2VuVHlwZS5GQUxTRTpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkZVTkNUSU9OOlxuICAgICAgY2FzZSBUb2tlblR5cGUuSURFTlRJRklFUjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkxCUkFDRTpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkxCUkFDSzpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkxQQVJFTjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk5FVzpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk5PVDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk5VTEw6XG4gICAgICBjYXNlIFRva2VuVHlwZS5OVU1CRVI6XG4gICAgICBjYXNlIFRva2VuVHlwZS5TVFJJTkc6XG4gICAgICBjYXNlIFRva2VuVHlwZS5TVUI6XG4gICAgICBjYXNlIFRva2VuVHlwZS5USElTOlxuICAgICAgY2FzZSBUb2tlblR5cGUuVFJVRTpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLllJRUxEOlxuICAgICAgY2FzZSBUb2tlblR5cGUuVEVNUExBVEU6XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwYXJzZVlpZWxkRXhwcmVzc2lvbigpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcblxuICAgIHRoaXMubGV4KCk7XG4gICAgaWYgKHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0KSB7XG4gICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LllpZWxkRXhwcmVzc2lvbihudWxsKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgfVxuICAgIGxldCBpc0dlbmVyYXRvciA9ICEhdGhpcy5lYXQoVG9rZW5UeXBlLk1VTCk7XG4gICAgbGV0IHByZXZpb3VzWWllbGQgPSB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uO1xuICAgIGxldCBleHByID0gbnVsbDtcbiAgICBpZiAoaXNHZW5lcmF0b3IgfHwgdGhpcy5sb29rYWhlYWRBc3NpZ25tZW50RXhwcmVzc2lvbigpKSB7XG4gICAgICBleHByID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgfVxuICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBwcmV2aW91c1lpZWxkO1xuICAgIGxldCBDdG9yID0gaXNHZW5lcmF0b3IgPyBTaGlmdC5ZaWVsZEdlbmVyYXRvckV4cHJlc3Npb24gOiBTaGlmdC5ZaWVsZEV4cHJlc3Npb247XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBDdG9yKGV4cHIpLCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlQ29uZGl0aW9uYWxFeHByZXNzaW9uKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCBleHByID0gdGhpcy5wYXJzZUJpbmFyeUV4cHJlc3Npb24oKTtcbiAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLkNPTkRJVElPTkFMKSkge1xuICAgICAgbGV0IHByZXZpb3VzQWxsb3dJbiA9IHRoaXMuYWxsb3dJbjtcbiAgICAgIHRoaXMuYWxsb3dJbiA9IHRydWU7XG4gICAgICBsZXQgY29uc2VxdWVudCA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgdGhpcy5hbGxvd0luID0gcHJldmlvdXNBbGxvd0luO1xuICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNPTE9OKTtcbiAgICAgIGxldCBhbHRlcm5hdGUgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQ29uZGl0aW9uYWxFeHByZXNzaW9uKGV4cHIsIGNvbnNlcXVlbnQsIGFsdGVybmF0ZSksIHN0YXJ0TG9jYXRpb24pO1xuICAgIH1cblxuICAgIHJldHVybiBleHByO1xuICB9XG5cbiAgaXNCaW5hcnlPcGVyYXRvcih0eXBlKSB7XG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICBjYXNlIFRva2VuVHlwZS5PUjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFORDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkJJVF9PUjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkJJVF9YT1I6XG4gICAgICBjYXNlIFRva2VuVHlwZS5CSVRfQU5EOlxuICAgICAgY2FzZSBUb2tlblR5cGUuRVE6XG4gICAgICBjYXNlIFRva2VuVHlwZS5ORTpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkVRX1NUUklDVDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk5FX1NUUklDVDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkxUOlxuICAgICAgY2FzZSBUb2tlblR5cGUuR1Q6XG4gICAgICBjYXNlIFRva2VuVHlwZS5MVEU6XG4gICAgICBjYXNlIFRva2VuVHlwZS5HVEU6XG4gICAgICBjYXNlIFRva2VuVHlwZS5JTlNUQU5DRU9GOlxuICAgICAgY2FzZSBUb2tlblR5cGUuU0hMOlxuICAgICAgY2FzZSBUb2tlblR5cGUuU0hSOlxuICAgICAgY2FzZSBUb2tlblR5cGUuU0hSX1VOU0lHTkVEOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQUREOlxuICAgICAgY2FzZSBUb2tlblR5cGUuU1VCOlxuICAgICAgY2FzZSBUb2tlblR5cGUuTVVMOlxuICAgICAgY2FzZSBUb2tlblR5cGUuRElWOlxuICAgICAgY2FzZSBUb2tlblR5cGUuTU9EOlxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLklOOlxuICAgICAgICByZXR1cm4gdGhpcy5hbGxvd0luO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHBhcnNlQmluYXJ5RXhwcmVzc2lvbigpIHtcbiAgICBsZXQgbG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IGxlZnQgPSB0aGlzLnBhcnNlVW5hcnlFeHByZXNzaW9uKCk7XG4gICAgbGV0IG9wZXJhdG9yID0gdGhpcy5sb29rYWhlYWQudHlwZTtcblxuICAgIGxldCBpc0JpbmFyeU9wZXJhdG9yID0gdGhpcy5pc0JpbmFyeU9wZXJhdG9yKG9wZXJhdG9yKTtcbiAgICBpZiAoIWlzQmluYXJ5T3BlcmF0b3IpIHtcbiAgICAgIHJldHVybiBsZWZ0O1xuICAgIH1cblxuICAgIHRoaXMubGV4KCk7XG4gICAgbGV0IHN0YWNrID0gW107XG4gICAgc3RhY2sucHVzaCh7bG9jYXRpb24sIGxlZnQsIG9wZXJhdG9yLCBwcmVjZWRlbmNlOiBCaW5hcnlQcmVjZWRlbmNlW29wZXJhdG9yLm5hbWVdfSk7XG4gICAgbG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IHJpZ2h0ID0gdGhpcy5wYXJzZVVuYXJ5RXhwcmVzc2lvbigpO1xuXG4gICAgb3BlcmF0b3IgPSB0aGlzLmxvb2thaGVhZC50eXBlO1xuICAgIGlzQmluYXJ5T3BlcmF0b3IgPSB0aGlzLmlzQmluYXJ5T3BlcmF0b3IodGhpcy5sb29rYWhlYWQudHlwZSk7XG4gICAgd2hpbGUgKGlzQmluYXJ5T3BlcmF0b3IpIHtcbiAgICAgIGxldCBwcmVjZWRlbmNlID0gQmluYXJ5UHJlY2VkZW5jZVtvcGVyYXRvci5uYW1lXTtcbiAgICAgIC8vIFJlZHVjZTogbWFrZSBhIGJpbmFyeSBleHByZXNzaW9uIGZyb20gdGhlIHRocmVlIHRvcG1vc3QgZW50cmllcy5cbiAgICAgIHdoaWxlIChzdGFjay5sZW5ndGggJiYgcHJlY2VkZW5jZSA8PSBzdGFja1tzdGFjay5sZW5ndGggLSAxXS5wcmVjZWRlbmNlKSB7XG4gICAgICAgIGxldCBzdGFja0l0ZW0gPSBzdGFja1tzdGFjay5sZW5ndGggLSAxXTtcbiAgICAgICAgbGV0IHN0YWNrT3BlcmF0b3IgPSBzdGFja0l0ZW0ub3BlcmF0b3I7XG4gICAgICAgIGxlZnQgPSBzdGFja0l0ZW0ubGVmdDtcbiAgICAgICAgc3RhY2sucG9wKCk7XG4gICAgICAgIGxvY2F0aW9uID0gc3RhY2tJdGVtLmxvY2F0aW9uO1xuICAgICAgICByaWdodCA9IHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5CaW5hcnlFeHByZXNzaW9uKHN0YWNrT3BlcmF0b3IubmFtZSwgbGVmdCwgcmlnaHQpLCBsb2NhdGlvbik7XG4gICAgICB9XG5cbiAgICAgIC8vIFNoaWZ0LlxuICAgICAgdGhpcy5sZXgoKTtcbiAgICAgIHN0YWNrLnB1c2goe2xvY2F0aW9uLCBsZWZ0OiByaWdodCwgb3BlcmF0b3IsIHByZWNlZGVuY2V9KTtcbiAgICAgIGxvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgICAgcmlnaHQgPSB0aGlzLnBhcnNlVW5hcnlFeHByZXNzaW9uKCk7XG5cbiAgICAgIG9wZXJhdG9yID0gdGhpcy5sb29rYWhlYWQudHlwZTtcbiAgICAgIGlzQmluYXJ5T3BlcmF0b3IgPSB0aGlzLmlzQmluYXJ5T3BlcmF0b3Iob3BlcmF0b3IpO1xuICAgIH1cblxuICAgIC8vIEZpbmFsIHJlZHVjZSB0byBjbGVhbi11cCB0aGUgc3RhY2suXG4gICAgcmV0dXJuIHN0YWNrLnJlZHVjZVJpZ2h0KChleHByLCBzdGFja0l0ZW0pID0+XG4gICAgICB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQmluYXJ5RXhwcmVzc2lvbihzdGFja0l0ZW0ub3BlcmF0b3IubmFtZSwgc3RhY2tJdGVtLmxlZnQsIGV4cHIpLCBzdGFja0l0ZW0ubG9jYXRpb24pLFxuICAgICAgcmlnaHQpO1xuICB9XG5cbiAgc3RhdGljIGlzUHJlZml4T3BlcmF0b3IodHlwZSkge1xuICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgY2FzZSBUb2tlblR5cGUuSU5DOlxuICAgICAgY2FzZSBUb2tlblR5cGUuREVDOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQUREOlxuICAgICAgY2FzZSBUb2tlblR5cGUuU1VCOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQklUX05PVDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk5PVDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkRFTEVURTpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlZPSUQ6XG4gICAgICBjYXNlIFRva2VuVHlwZS5UWVBFT0Y6XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwYXJzZVVuYXJ5RXhwcmVzc2lvbigpIHtcbiAgICBpZiAodGhpcy5sb29rYWhlYWQudHlwZS5rbGFzcyAhPT0gVG9rZW5DbGFzcy5QdW5jdHVhdG9yICYmIHRoaXMubG9va2FoZWFkLnR5cGUua2xhc3MgIT09IFRva2VuQ2xhc3MuS2V5d29yZCkge1xuICAgICAgcmV0dXJuIHRoaXMucGFyc2VQb3N0Zml4RXhwcmVzc2lvbigpO1xuICAgIH1cbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgb3BlcmF0b3IgPSB0aGlzLmxvb2thaGVhZDtcbiAgICBpZiAoIVBhcnNlci5pc1ByZWZpeE9wZXJhdG9yKG9wZXJhdG9yLnR5cGUpKSB7XG4gICAgICByZXR1cm4gdGhpcy5wYXJzZVBvc3RmaXhFeHByZXNzaW9uKCk7XG4gICAgfVxuICAgIHRoaXMubGV4KCk7XG4gICAgbGV0IGV4cHIgPSB0aGlzLnBhcnNlVW5hcnlFeHByZXNzaW9uKCk7XG4gICAgc3dpdGNoIChvcGVyYXRvci50eXBlKSB7XG4gICAgICBjYXNlIFRva2VuVHlwZS5JTkM6XG4gICAgICBjYXNlIFRva2VuVHlwZS5ERUM6XG4gICAgICAgIC8vIDExLjQuNCwgMTEuNC41O1xuICAgICAgICBpZiAoZXhwci50eXBlID09PSBcIklkZW50aWZpZXJFeHByZXNzaW9uXCIpIHtcbiAgICAgICAgICBpZiAodGhpcy5zdHJpY3QgJiYgaXNSZXN0cmljdGVkV29yZChleHByLm5hbWUpKSB7XG4gICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX0xIU19QUkVGSVgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghUGFyc2VyLmlzVmFsaWRTaW1wbGVBc3NpZ25tZW50VGFyZ2V0KGV4cHIpKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLklOVkFMSURfTEhTX0lOX0FTU0lHTk1FTlQpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBUb2tlblR5cGUuREVMRVRFOlxuICAgICAgICBpZiAoZXhwci50eXBlID09PSBcIklkZW50aWZpZXJFeHByZXNzaW9uXCIgJiYgdGhpcy5zdHJpY3QpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX0RFTEVURSk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlByZWZpeEV4cHJlc3Npb24ob3BlcmF0b3IudmFsdWUsIGV4cHIpLCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlUG9zdGZpeEV4cHJlc3Npb24oKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICBsZXQgZXhwciA9IHRoaXMucGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uKHthbGxvd0NhbGw6IHRydWV9KTtcblxuICAgIGlmICh0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCkge1xuICAgICAgcmV0dXJuIGV4cHI7XG4gICAgfVxuXG4gICAgbGV0IG9wZXJhdG9yID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgaWYgKG9wZXJhdG9yLnR5cGUgIT09IFRva2VuVHlwZS5JTkMgJiYgb3BlcmF0b3IudHlwZSAhPT0gVG9rZW5UeXBlLkRFQykge1xuICAgICAgcmV0dXJuIGV4cHI7XG4gICAgfVxuICAgIHRoaXMubGV4KCk7XG4gICAgLy8gMTEuMy4xLCAxMS4zLjI7XG4gICAgaWYgKGV4cHIudHlwZSA9PT0gXCJJZGVudGlmaWVyRXhwcmVzc2lvblwiKSB7XG4gICAgICBpZiAodGhpcy5zdHJpY3QgJiYgaXNSZXN0cmljdGVkV29yZChleHByLm5hbWUpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5TVFJJQ1RfTEhTX1BPU1RGSVgpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIVBhcnNlci5pc1ZhbGlkU2ltcGxlQXNzaWdubWVudFRhcmdldChleHByKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLklOVkFMSURfTEhTX0lOX0FTU0lHTk1FTlQpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlBvc3RmaXhFeHByZXNzaW9uKGV4cHIsIG9wZXJhdG9yLnZhbHVlKSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZUxlZnRIYW5kU2lkZUV4cHJlc3Npb24oe2FsbG93Q2FsbH0pIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgcHJldmlvdXNBbGxvd0luID0gdGhpcy5hbGxvd0luO1xuICAgIHRoaXMuYWxsb3dJbiA9IGFsbG93Q2FsbDtcblxuICAgIGxldCBleHByLCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuXG4gICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5TVVBFUikpIHtcbiAgICAgIGV4cHIgPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuU3VwZXIsIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkxQQVJFTikpIHtcbiAgICAgICAgaWYgKGFsbG93Q2FsbCkge1xuICAgICAgICAgIGlmICh0aGlzLmluQ29uc3RydWN0b3IgJiYgIXRoaXMuaW5QYXJhbWV0ZXIpIHtcbiAgICAgICAgICAgIGV4cHIgPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQ2FsbEV4cHJlc3Npb24oZXhwciwgdGhpcy5wYXJzZUFyZ3VtZW50TGlzdCgpKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24oc3RhcnRMb2NhdGlvbiwgRXJyb3JNZXNzYWdlcy5VTkVYUEVDVEVEX1NVUEVSX0NBTEwpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodG9rZW4pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkxCUkFDSykpIHtcbiAgICAgICAgaWYgKHRoaXMuaW5NZXRob2QgJiYgIXRoaXMuaW5QYXJhbWV0ZXIpIHtcbiAgICAgICAgICBleHByID0gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkNvbXB1dGVkTWVtYmVyRXhwcmVzc2lvbihleHByLCB0aGlzLnBhcnNlQ29tcHV0ZWRNZW1iZXIoKSksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24oc3RhcnRMb2NhdGlvbiwgRXJyb3JNZXNzYWdlcy5VTkVYUEVDVEVEX1NVUEVSX1BST1BFUlRZKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5QRVJJT0QpKSB7XG4gICAgICAgIGlmICh0aGlzLmluTWV0aG9kICYmICF0aGlzLmluUGFyYW1ldGVyKSB7XG4gICAgICAgICAgZXhwciA9IHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5TdGF0aWNNZW1iZXJFeHByZXNzaW9uKGV4cHIsIHRoaXMucGFyc2VOb25Db21wdXRlZE1lbWJlcigpKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbihzdGFydExvY2F0aW9uLCBFcnJvck1lc3NhZ2VzLlVORVhQRUNURURfU1VQRVJfUFJPUEVSVFkpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodG9rZW4pO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuTkVXKSkge1xuICAgICAgZXhwciA9IHRoaXMucGFyc2VOZXdFeHByZXNzaW9uKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGV4cHIgPSB0aGlzLnBhcnNlUHJpbWFyeUV4cHJlc3Npb24oKTtcbiAgICB9XG5cbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgaWYgKGFsbG93Q2FsbCAmJiB0aGlzLm1hdGNoKFRva2VuVHlwZS5MUEFSRU4pKSB7XG4gICAgICAgIGV4cHIgPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQ2FsbEV4cHJlc3Npb24oZXhwciwgdGhpcy5wYXJzZUFyZ3VtZW50TGlzdCgpKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkxCUkFDSykpIHtcbiAgICAgICAgZXhwciA9IHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5Db21wdXRlZE1lbWJlckV4cHJlc3Npb24oZXhwciwgdGhpcy5wYXJzZUNvbXB1dGVkTWVtYmVyKCkpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuUEVSSU9EKSkge1xuICAgICAgICBleHByID0gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlN0YXRpY01lbWJlckV4cHJlc3Npb24oZXhwciwgdGhpcy5wYXJzZU5vbkNvbXB1dGVkTWVtYmVyKCkpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuVEVNUExBVEUpKSB7XG4gICAgICAgIGV4cHIgPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuVGVtcGxhdGVFeHByZXNzaW9uKGV4cHIsIHRoaXMucGFyc2VUZW1wbGF0ZUVsZW1lbnRzKCkpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuYWxsb3dJbiA9IHByZXZpb3VzQWxsb3dJbjtcblxuICAgIHJldHVybiBleHByO1xuICB9XG5cbiAgcGFyc2VUZW1wbGF0ZUVsZW1lbnRzKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgIGlmICh0b2tlbi50YWlsKSB7XG4gICAgICB0aGlzLmxleCgpO1xuICAgICAgcmV0dXJuIFt0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuVGVtcGxhdGVFbGVtZW50KHRva2VuLnZhbHVlLnNsaWNlKDEsIC0xKSksIHN0YXJ0TG9jYXRpb24pXTtcbiAgICB9XG4gICAgbGV0IHJlc3VsdCA9IFt0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuVGVtcGxhdGVFbGVtZW50KHRoaXMubGV4KCkudmFsdWUuc2xpY2UoMSwgLTIpKSwgc3RhcnRMb2NhdGlvbildO1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICByZXN1bHQucHVzaCh0aGlzLnBhcnNlRXhwcmVzc2lvbigpKTtcbiAgICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuUkJSQUNFKSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuaW5kZXggPSB0aGlzLnN0YXJ0SW5kZXg7XG4gICAgICB0aGlzLmxpbmUgPSB0aGlzLnN0YXJ0TGluZTtcbiAgICAgIHRoaXMubGluZVN0YXJ0ID0gdGhpcy5zdGFydExpbmVTdGFydDtcbiAgICAgIHRoaXMubG9va2FoZWFkID0gdGhpcy5zY2FuVGVtcGxhdGVFbGVtZW50KCk7XG4gICAgICBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgICAgdG9rZW4gPSB0aGlzLmxleCgpO1xuICAgICAgaWYgKHRva2VuLnRhaWwpIHtcbiAgICAgICAgcmVzdWx0LnB1c2godGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlRlbXBsYXRlRWxlbWVudCh0b2tlbi52YWx1ZS5zbGljZSgxLCAtMSkpLCBzdGFydExvY2F0aW9uKSk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHQucHVzaCh0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuVGVtcGxhdGVFbGVtZW50KHRva2VuLnZhbHVlLnNsaWNlKDEsIC0yKSksIHN0YXJ0TG9jYXRpb24pKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwYXJzZU5vbkNvbXB1dGVkTWVtYmVyKCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5QRVJJT0QpO1xuICAgIGlmICghdGhpcy5sb29rYWhlYWQudHlwZS5rbGFzcy5pc0lkZW50aWZpZXJOYW1lKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5sZXgoKS52YWx1ZTtcbiAgICB9XG4gIH1cblxuICBwYXJzZUNvbXB1dGVkTWVtYmVyKCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MQlJBQ0spO1xuICAgIGxldCBleHByID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUkJSQUNLKTtcbiAgICByZXR1cm4gZXhwcjtcbiAgfVxuXG4gIHBhcnNlTmV3RXhwcmVzc2lvbigpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTkVXKTtcbiAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLlBFUklPRCkpIHtcbiAgICAgIGxldCBpZGVudCA9IHRoaXMuZXhwZWN0KFRva2VuVHlwZS5JREVOVElGSUVSKTtcbiAgICAgIGlmIChpZGVudC52YWx1ZSAhPT0gXCJ0YXJnZXRcIikge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQoaWRlbnQpO1xuICAgICAgfSBlbHNlIGlmICghdGhpcy5pbkZ1bmN0aW9uQm9keSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHN0YXJ0TG9jYXRpb24sIEVycm9yTWVzc2FnZXMuVU5FWFBFQ1RFRF9ORVdfVEFSR0VUKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuTmV3VGFyZ2V0RXhwcmVzc2lvbiwgc3RhcnRMb2NhdGlvbik7XG4gICAgfVxuICAgIGxldCBjYWxsZWUgPSB0aGlzLnBhcnNlTGVmdEhhbmRTaWRlRXhwcmVzc2lvbih7YWxsb3dDYWxsOiBmYWxzZX0pO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuTmV3RXhwcmVzc2lvbihcbiAgICAgIGNhbGxlZSxcbiAgICAgIHRoaXMubWF0Y2goVG9rZW5UeXBlLkxQQVJFTikgPyB0aGlzLnBhcnNlQXJndW1lbnRMaXN0KCkgOiBbXVxuICAgICksIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VQcmltYXJ5RXhwcmVzc2lvbigpIHtcbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuTFBBUkVOKSkge1xuICAgICAgcmV0dXJuIHRoaXMucGFyc2VHcm91cEV4cHJlc3Npb24oKTtcbiAgICB9XG5cbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcblxuICAgIHN3aXRjaCAodGhpcy5sb29rYWhlYWQudHlwZSkge1xuICAgICAgY2FzZSBUb2tlblR5cGUuWUlFTEQ6XG4gICAgICBjYXNlIFRva2VuVHlwZS5JREVOVElGSUVSOlxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIklkZW50aWZpZXJFeHByZXNzaW9uXCIsIG5hbWU6IHRoaXMucGFyc2VJZGVudGlmaWVyKCkgfSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICBjYXNlIFRva2VuVHlwZS5TVFJJTkc6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlU3RyaW5nTGl0ZXJhbCgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuTlVNQkVSOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZU51bWVyaWNMaXRlcmFsKCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5USElTOlxuICAgICAgICB0aGlzLmxleCgpO1xuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlRoaXNFeHByZXNzaW9uLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkZVTkNUSU9OOlxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24odGhpcy5wYXJzZUZ1bmN0aW9uKHtpc0V4cHI6IHRydWV9KSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICBjYXNlIFRva2VuVHlwZS5UUlVFOlxuICAgICAgICB0aGlzLmxleCgpO1xuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkxpdGVyYWxCb29sZWFuRXhwcmVzc2lvbih0cnVlKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICBjYXNlIFRva2VuVHlwZS5GQUxTRTpcbiAgICAgICAgdGhpcy5sZXgoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5MaXRlcmFsQm9vbGVhbkV4cHJlc3Npb24oZmFsc2UpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk5VTEw6XG4gICAgICAgIHRoaXMubGV4KCk7XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuTGl0ZXJhbE51bGxFeHByZXNzaW9uLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkxCUkFDSzpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VBcnJheUV4cHJlc3Npb24oKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkxCUkFDRTpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VPYmplY3RFeHByZXNzaW9uKCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5URU1QTEFURTpcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5UZW1wbGF0ZUV4cHJlc3Npb24obnVsbCwgdGhpcy5wYXJzZVRlbXBsYXRlRWxlbWVudHMoKSksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgY2FzZSBUb2tlblR5cGUuRElWOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX0RJVjpcbiAgICAgICAgdGhpcy5sb29rYWhlYWQgPSB0aGlzLnNjYW5SZWdFeHAodGhpcy5sb29rYWhlYWQudHlwZSA9PT0gVG9rZW5UeXBlLkRJViA/IFwiL1wiIDogXCIvPVwiKTtcbiAgICAgICAgbGV0IHRva2VuID0gdGhpcy5sZXgoKTtcbiAgICAgICAgbGV0IGxhc3RTbGFzaCA9IHRva2VuLnZhbHVlLmxhc3RJbmRleE9mKFwiL1wiKTtcbiAgICAgICAgbGV0IHBhdHRlcm4gPSB0b2tlbi52YWx1ZS5zbGljZSgxLCBsYXN0U2xhc2gpLnJlcGxhY2UoXCJcXFxcL1wiLCBcIi9cIik7XG4gICAgICAgIGxldCBmbGFncyA9IHRva2VuLnZhbHVlLnNsaWNlKGxhc3RTbGFzaCArIDEpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIFJlZ0V4cChwYXR0ZXJuLCBmbGFncyk7XG4gICAgICAgIH0gY2F0Y2ggKHVudXNlZCkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuSU5WQUxJRF9SRUdVTEFSX0VYUFJFU1NJT04pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuTGl0ZXJhbFJlZ0V4cEV4cHJlc3Npb24ocGF0dGVybiwgZmxhZ3MpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkNMQVNTOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZUNsYXNzKHtpc0V4cHI6IHRydWV9KTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxleCgpKTtcbiAgICB9XG4gIH1cblxuICBwYXJzZU51bWVyaWNMaXRlcmFsKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGlmICh0aGlzLnN0cmljdCAmJiB0aGlzLmxvb2thaGVhZC5vY3RhbCkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0aGlzLmxvb2thaGVhZCwgRXJyb3JNZXNzYWdlcy5TVFJJQ1RfT0NUQUxfTElURVJBTCk7XG4gICAgfVxuICAgIGxldCB0b2tlbjIgPSB0aGlzLmxleCgpO1xuICAgIGxldCBub2RlID0gdG9rZW4yLl92YWx1ZSA9PT0gMS8wXG4gICAgICA/IG5ldyBTaGlmdC5MaXRlcmFsSW5maW5pdHlFeHByZXNzaW9uXG4gICAgICA6IG5ldyBTaGlmdC5MaXRlcmFsTnVtZXJpY0V4cHJlc3Npb24odG9rZW4yLl92YWx1ZSk7XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5vZGUsIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VTdHJpbmdMaXRlcmFsKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGlmICh0aGlzLnN0cmljdCAmJiB0aGlzLmxvb2thaGVhZC5vY3RhbCkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0aGlzLmxvb2thaGVhZCwgRXJyb3JNZXNzYWdlcy5TVFJJQ1RfT0NUQUxfTElURVJBTCk7XG4gICAgfVxuICAgIGxldCB0b2tlbjIgPSB0aGlzLmxleCgpO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuTGl0ZXJhbFN0cmluZ0V4cHJlc3Npb24odG9rZW4yLl92YWx1ZSwgdG9rZW4yLnNsaWNlLnRleHQpLFxuICAgICAgICBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlSWRlbnRpZmllck5hbWUoKSB7XG4gICAgaWYgKHRoaXMubG9va2FoZWFkLnR5cGUua2xhc3MuaXNJZGVudGlmaWVyTmFtZSkge1xuICAgICAgcmV0dXJuIHRoaXMubGV4KCkudmFsdWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgfVxuICB9XG5cbiAgcGFyc2VCaW5kaW5nSWRlbnRpZmllcigpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIkJpbmRpbmdJZGVudGlmaWVyXCIsIG5hbWU6IHRoaXMucGFyc2VJZGVudGlmaWVyKCkgfSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZUlkZW50aWZpZXIoKSB7XG4gICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLllJRUxEKSkge1xuICAgICAgaWYgKHRoaXMuc3RyaWN0KSB7XG4gICAgICAgIHRoaXMubG9va2FoZWFkLnR5cGUgPSBUb2tlblR5cGUuWUlFTEQ7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24pIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5pbkdlbmVyYXRvckJvZHkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxleCgpLnZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5leHBlY3QoVG9rZW5UeXBlLklERU5USUZJRVIpLnZhbHVlO1xuICB9XG5cbiAgcGFyc2VBcmd1bWVudExpc3QoKSB7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgbGV0IGFyZ3MgPSB0aGlzLnBhcnNlQXJndW1lbnRzKCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJQQVJFTik7XG4gICAgcmV0dXJuIGFyZ3M7XG4gIH1cblxuICBwYXJzZUFyZ3VtZW50cygpIHtcbiAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5SUEFSRU4pIHx8IHRoaXMuZW9mKCkpIHtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH1cbiAgICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgICAgbGV0IGFyZztcbiAgICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuRUxMSVBTSVMpKSB7XG4gICAgICAgIGFyZyA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgICBhcmcgPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuU3ByZWFkRWxlbWVudChhcmcpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFyZyA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgfVxuICAgICAgcmVzdWx0LnB1c2goYXJnKTtcbiAgICAgIGlmICghdGhpcy5lYXQoVG9rZW5UeXBlLkNPTU1BKSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8vIDExLjIgTGVmdC1IYW5kLVNpZGUgRXhwcmVzc2lvbnM7XG5cbiAgZW5zdXJlQXJyb3coKSB7XG4gICAgaWYgKHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0KSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5FWFBFQ1RFRF9MSU5FX1RFUk1JTkFUT1IpO1xuICAgIH1cbiAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLkFSUk9XKSkge1xuICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkFSUk9XKTtcbiAgICB9XG4gIH1cblxuICBwYXJzZUdyb3VwRXhwcmVzc2lvbigpIHtcbiAgICBsZXQgcmVzdCA9IG51bGw7XG4gICAgbGV0IHN0YXJ0ID0gdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5SUEFSRU4pKSB7XG4gICAgICB0aGlzLmVuc3VyZUFycm93KCk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiBBUlJPV19FWFBSRVNTSU9OX1BBUkFNUyxcbiAgICAgICAgcGFyYW1zOiBbXSxcbiAgICAgICAgcmVzdDogbnVsbFxuICAgICAgfTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5FTExJUFNJUykpIHtcbiAgICAgIHJlc3QgPSB0aGlzLnBhcnNlQmluZGluZ0lkZW50aWZpZXIoKTtcbiAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgICAgdGhpcy5lbnN1cmVBcnJvdygpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogQVJST1dfRVhQUkVTU0lPTl9QQVJBTVMsXG4gICAgICAgIHBhcmFtczogW10sXG4gICAgICAgIHJlc3Q6IHJlc3RcbiAgICAgIH07XG4gICAgfVxuXG4gICAgbGV0IHBvc3NpYmxlQmluZGluZ3MgPSAhdGhpcy5tYXRjaChUb2tlblR5cGUuTFBBUkVOKTtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgZ3JvdXAgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICBsZXQgcGFyYW1zID0gW2dyb3VwXTtcblxuICAgIHdoaWxlICh0aGlzLmVhdChUb2tlblR5cGUuQ09NTUEpKSB7XG4gICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuRUxMSVBTSVMpKSB7XG4gICAgICAgIGlmICghcG9zc2libGVCaW5kaW5ncykge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5sZXgoKTtcbiAgICAgICAgcmVzdCA9IHRoaXMucGFyc2VCaW5kaW5nSWRlbnRpZmllcigpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHBvc3NpYmxlQmluZGluZ3MgPSBwb3NzaWJsZUJpbmRpbmdzICYmICF0aGlzLm1hdGNoKFRva2VuVHlwZS5MUEFSRU4pO1xuICAgICAgbGV0IGV4cHIgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgIHBhcmFtcy5wdXNoKGV4cHIpO1xuICAgICAgZ3JvdXAgPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQmluYXJ5RXhwcmVzc2lvbihcIixcIiwgZ3JvdXAsIGV4cHIpLCBzdGFydExvY2F0aW9uKTtcbiAgICB9XG5cbiAgICBpZiAocG9zc2libGVCaW5kaW5ncykge1xuICAgICAgcG9zc2libGVCaW5kaW5ncyA9IHBhcmFtcy5ldmVyeShlID0+XG4gICAgICAgIFBhcnNlci5pc0Rlc3RydWN0dXJpbmdUYXJnZXRXaXRoRGVmYXVsdChlLCBQYXJzZXIuaXNWYWxpZFNpbXBsZUJpbmRpbmdUYXJnZXQpKTtcbiAgICB9XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcblxuICAgIGlmICghdGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQgJiYgdGhpcy5tYXRjaChUb2tlblR5cGUuQVJST1cpKSB7XG4gICAgICBpZiAoIXBvc3NpYmxlQmluZGluZ3MpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbihzdGFydCwgRXJyb3JNZXNzYWdlcy5JTExFR0FMX0FSUk9XX0ZVTkNUSU9OX1BBUkFNUyk7XG4gICAgICB9XG4gICAgICAvLyBjaGVjayBkdXAgcGFyYW1zXG4gICAgICBwYXJhbXMgPSBwYXJhbXMubWFwKFBhcnNlci50cmFuc2Zvcm1EZXN0cnVjdHVyaW5nKTtcbiAgICAgIGxldCBhbGxCb3VuZE5hbWVzID0gW107XG4gICAgICBwYXJhbXMuZm9yRWFjaChleHByID0+IHtcbiAgICAgICAgbGV0IGJvdW5kTmFtZXMgPSBQYXJzZXIuYm91bmROYW1lcyhleHByKTtcbiAgICAgICAgbGV0IGR1cCA9IGZpcnN0RHVwbGljYXRlKGJvdW5kTmFtZXMpO1xuICAgICAgICBpZiAoZHVwKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLkRVUExJQ0FURV9CSU5ESU5HLCBkdXApO1xuICAgICAgICB9XG4gICAgICAgIGFsbEJvdW5kTmFtZXMgPSBhbGxCb3VuZE5hbWVzLmNvbmNhdChib3VuZE5hbWVzKTtcbiAgICAgIH0pO1xuICAgICAgaWYgKHJlc3QpIHtcbiAgICAgICAgYWxsQm91bmROYW1lcy5wdXNoKHJlc3QubmFtZSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChmaXJzdER1cGxpY2F0ZShhbGxCb3VuZE5hbWVzKSAhPSBudWxsKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUEFSQU1fRFVQRSk7XG4gICAgICB9XG5cbiAgICAgIGxldCBzdHJpY3RSZXN0cmljdGVkV29yZCA9IGFsbEJvdW5kTmFtZXMuc29tZShpc1Jlc3RyaWN0ZWRXb3JkKTtcbiAgICAgIGlmIChzdHJpY3RSZXN0cmljdGVkV29yZCkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX1BBUkFNX05BTUUpO1xuICAgICAgfVxuXG4gICAgICBsZXQgc3RyaWN0UmVzZXJ2ZWRXb3JkID0gaGFzU3RyaWN0TW9kZVJlc2VydmVkV29yZChhbGxCb3VuZE5hbWVzKTtcbiAgICAgIGlmIChzdHJpY3RSZXNlcnZlZFdvcmQpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlNUUklDVF9SRVNFUlZFRF9XT1JEKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogQVJST1dfRVhQUkVTU0lPTl9QQVJBTVMsXG4gICAgICAgIHBhcmFtcyxcbiAgICAgICAgcmVzdFxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHJlc3QpIHtcbiAgICAgICAgdGhpcy5lbnN1cmVBcnJvdygpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGdyb3VwO1xuICAgIH1cbiAgfVxuXG5cbiAgcGFyc2VBcnJheUV4cHJlc3Npb24oKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTEJSQUNLKTtcblxuICAgIGxldCBlbGVtZW50cyA9IHRoaXMucGFyc2VBcnJheUV4cHJlc3Npb25FbGVtZW50cygpO1xuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJCUkFDSyk7XG5cbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkFycmF5RXhwcmVzc2lvbihlbGVtZW50cyksIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VBcnJheUV4cHJlc3Npb25FbGVtZW50cygpIHtcbiAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0spKSB7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9XG4gICAgICBsZXQgZWw7XG5cbiAgICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuQ09NTUEpKSB7XG4gICAgICAgIGVsID0gbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgICAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLkVMTElQU0lTKSkge1xuICAgICAgICAgIGVsID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgICAgICAgZWwgPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuU3ByZWFkRWxlbWVudChlbCksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVsID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0spKSB7XG4gICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNPTU1BKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmVzdWx0LnB1c2goZWwpO1xuICAgIH1cbiAgfVxuXG4gIHBhcnNlT2JqZWN0RXhwcmVzc2lvbigpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MQlJBQ0UpO1xuXG4gICAgbGV0IHByb3BlcnRpZXMgPSB0aGlzLnBhcnNlT2JqZWN0RXhwcmVzc2lvbkl0ZW1zKCk7XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUkJSQUNFKTtcblxuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuT2JqZWN0RXhwcmVzc2lvbihwcm9wZXJ0aWVzKSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuXG4gIHBhcnNlT2JqZWN0RXhwcmVzc2lvbkl0ZW1zKCkge1xuICAgIGxldCByZXN1bHQgPSBbXTtcbiAgICBsZXQgaGFzX19wcm90b19fID0gW2ZhbHNlXTtcbiAgICB3aGlsZSAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJCUkFDRSkpIHtcbiAgICAgIHJlc3VsdC5wdXNoKHRoaXMucGFyc2VQcm9wZXJ0eURlZmluaXRpb24oaGFzX19wcm90b19fKSk7XG4gICAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJCUkFDRSkpIHtcbiAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNPTU1BKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHBhcnNlUHJvcGVydHlEZWZpbml0aW9uKGhhc19fcHJvdG9fXykge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuXG4gICAgbGV0IHttZXRob2RPcktleSwga2luZH0gPSB0aGlzLnBhcnNlTWV0aG9kRGVmaW5pdGlvbihmYWxzZSk7XG4gICAgc3dpdGNoIChraW5kKSB7XG4gICAgICBjYXNlIFwibWV0aG9kXCI6XG4gICAgICAgIHJldHVybiBtZXRob2RPcktleTtcbiAgICAgIGNhc2UgXCJpZGVudGlmaWVyXCI6IC8vIElkZW50aWZpZXJSZWZlcmVuY2UsXG4gICAgICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuQVNTSUdOKSkge1xuICAgICAgICAgIC8vIENvdmVySW5pdGlhbGl6ZWROYW1lXG4gICAgICAgICAgaWYgKCh0aGlzLnN0cmljdCB8fCB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uKSAmJiBtZXRob2RPcktleS52YWx1ZSA9PT0gXCJ5aWVsZFwiKSB7XG4gICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodG9rZW4pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIkJpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXJcIixcbiAgICAgICAgICAgIGJpbmRpbmc6IHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJCaW5kaW5nSWRlbnRpZmllclwiLCBuYW1lOiBtZXRob2RPcktleS52YWx1ZSB9LCBzdGFydExvY2F0aW9uKSxcbiAgICAgICAgICAgIGluaXQ6IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpLFxuICAgICAgICAgIH0sIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgICB9IGVsc2UgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5DT0xPTikpIHtcbiAgICAgICAgICBpZiAodG9rZW4udHlwZSAhPT0gVG9rZW5UeXBlLklERU5USUZJRVIgJiYgdG9rZW4udHlwZSAhPT0gVG9rZW5UeXBlLllJRUxEIHx8XG4gICAgICAgICAgICAodGhpcy5zdHJpY3QgfHwgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbikgJiYgbWV0aG9kT3JLZXkudmFsdWUgPT09IFwieWllbGRcIikge1xuICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRva2VuKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5TaG9ydGhhbmRQcm9wZXJ0eShtZXRob2RPcktleS52YWx1ZSksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gRGF0YVByb3BlcnR5XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNPTE9OKTtcbiAgICBpZiAobWV0aG9kT3JLZXkudHlwZSA9PT0gXCJTdGF0aWNQcm9wZXJ0eU5hbWVcIikge1xuICAgICAgaWYgKG1ldGhvZE9yS2V5LnZhbHVlID09PSBcIl9fcHJvdG9fX1wiKSB7XG4gICAgICAgIGlmICghaGFzX19wcm90b19fWzBdKSB7XG4gICAgICAgICAgaGFzX19wcm90b19fWzBdID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLkRVUExJQ0FURV9QUk9UT19QUk9QRVJUWSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5EYXRhUHJvcGVydHkoXG4gICAgICAgIG1ldGhvZE9yS2V5LFxuICAgICAgICB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKSksXG4gICAgICBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlUHJvcGVydHlOYW1lKCkge1xuICAgIC8vIFByb3BlcnR5TmFtZVtZaWVsZCxHZW5lcmF0b3JQYXJhbWV0ZXJdOlxuICAgIGxldCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuXG4gICAgaWYgKHRoaXMuZW9mKCkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0b2tlbik7XG4gICAgfVxuXG4gICAgc3dpdGNoICh0b2tlbi50eXBlKSB7XG4gICAgICBjYXNlIFRva2VuVHlwZS5TVFJJTkc6XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuU3RhdGljUHJvcGVydHlOYW1lKHRoaXMucGFyc2VTdHJpbmdMaXRlcmFsKCkudmFsdWUpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk5VTUJFUjpcbiAgICAgICAgbGV0IG51bUxpdGVyYWwgPSB0aGlzLnBhcnNlTnVtZXJpY0xpdGVyYWwoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5TdGF0aWNQcm9wZXJ0eU5hbWUoXCJcIiArIChudW1MaXRlcmFsLnR5cGUgPT09IFwiTGl0ZXJhbEluZmluaXR5RXhwcmVzc2lvblwiID8gMSAvIDAgOiBudW1MaXRlcmFsLnZhbHVlKSksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgY2FzZSBUb2tlblR5cGUuTEJSQUNLOlxuICAgICAgICBsZXQgcHJldmlvdXNZaWVsZCA9IHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb247XG4gICAgICAgIGlmICh0aGlzLmluR2VuZXJhdG9yUGFyYW1ldGVyKSB7XG4gICAgICAgICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MQlJBQ0spO1xuICAgICAgICBsZXQgZXhwciA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUkJSQUNLKTtcbiAgICAgICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IHByZXZpb3VzWWllbGQ7XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQ29tcHV0ZWRQcm9wZXJ0eU5hbWUoZXhwciksIHN0YXJ0TG9jYXRpb24pO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuU3RhdGljUHJvcGVydHlOYW1lKHRoaXMucGFyc2VJZGVudGlmaWVyTmFtZSgpKSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICAvKipcbiAgICogVGVzdCBpZiBsb29rYWhlYWQgY2FuIGJlIHRoZSBiZWdpbm5pbmcgb2YgYSBgUHJvcGVydHlOYW1lYC5cbiAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAqL1xuICBsb29rYWhlYWRQcm9wZXJ0eU5hbWUoKSB7XG4gICAgc3dpdGNoICh0aGlzLmxvb2thaGVhZC50eXBlKSB7XG4gICAgICBjYXNlIFRva2VuVHlwZS5OVU1CRVI6XG4gICAgICBjYXNlIFRva2VuVHlwZS5TVFJJTkc6XG4gICAgICBjYXNlIFRva2VuVHlwZS5MQlJBQ0s6XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHRoaXMubG9va2FoZWFkLnR5cGUua2xhc3MuaXNJZGVudGlmaWVyTmFtZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVHJ5IHRvIHBhcnNlIGEgbWV0aG9kIGRlZmluaXRpb24uXG4gICAqXG4gICAqIElmIGl0IHR1cm5zIG91dCB0byBiZSBvbmUgb2Y6XG4gICAqICAqIGBJZGVudGlmaWVyUmVmZXJlbmNlYFxuICAgKiAgKiBgQ292ZXJJbml0aWFsaXplZE5hbWVgIChgSWRlbnRpZmllclJlZmVyZW5jZSBcIj1cIiBBc3NpZ25tZW50RXhwcmVzc2lvbmApXG4gICAqICAqIGBQcm9wZXJ0eU5hbWUgOiBBc3NpZ25tZW50RXhwcmVzc2lvbmBcbiAgICogVGhlIHRoZSBwYXJzZXIgd2lsbCBzdG9wIGF0IHRoZSBlbmQgb2YgdGhlIGxlYWRpbmcgYElkZW50aWZpZXJgIG9yIGBQcm9wZXJ0eU5hbWVgIGFuZCByZXR1cm4gaXQuXG4gICAqXG4gICAqIEByZXR1cm5zIHt7bWV0aG9kT3JLZXk6IChTaGlmdC5NZXRob2R8U2hpZnQuUHJvcGVydHlOYW1lKSwga2luZDogc3RyaW5nfX1cbiAgICovXG4gIHBhcnNlTWV0aG9kRGVmaW5pdGlvbihpc0NsYXNzUHJvdG9NZXRob2QpIHtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcblxuICAgIGxldCBpc0dlbmVyYXRvciA9ICEhdGhpcy5lYXQoVG9rZW5UeXBlLk1VTCk7XG5cbiAgICBsZXQga2V5ID0gdGhpcy5wYXJzZVByb3BlcnR5TmFtZSgpO1xuXG4gICAgaWYgKCFpc0dlbmVyYXRvciAmJiB0b2tlbi50eXBlID09PSBUb2tlblR5cGUuSURFTlRJRklFUikge1xuICAgICAgbGV0IG5hbWUgPSB0b2tlbi52YWx1ZTtcbiAgICAgIGlmIChuYW1lLmxlbmd0aCA9PT0gMykge1xuICAgICAgICAvLyBQcm9wZXJ0eSBBc3NpZ25tZW50OiBHZXR0ZXIgYW5kIFNldHRlci5cbiAgICAgICAgaWYgKG5hbWUgPT09IFwiZ2V0XCIgJiYgdGhpcy5sb29rYWhlYWRQcm9wZXJ0eU5hbWUoKSkge1xuICAgICAgICAgIGtleSA9IHRoaXMucGFyc2VQcm9wZXJ0eU5hbWUoKTtcbiAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTFBBUkVOKTtcbiAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcbiAgICAgICAgICBsZXQgcHJldmlvdXNJbkNvbnN0cnVjdG9yID0gdGhpcy5pbkNvbnN0cnVjdG9yO1xuICAgICAgICAgIHRoaXMuaW5Db25zdHJ1Y3RvciA9IGZhbHNlO1xuICAgICAgICAgIGxldCBwcmV2aW91c0luTWV0aG9kID0gdGhpcy5pbk1ldGhvZDtcbiAgICAgICAgICB0aGlzLmluTWV0aG9kID0gdHJ1ZTtcbiAgICAgICAgICBsZXQgW2JvZHldID0gdGhpcy5wYXJzZUZ1bmN0aW9uQm9keShbXSk7XG4gICAgICAgICAgdGhpcy5pbkNvbnN0cnVjdG9yID0gcHJldmlvdXNJbkNvbnN0cnVjdG9yO1xuICAgICAgICAgIHRoaXMuaW5NZXRob2QgPSBwcmV2aW91c0luTWV0aG9kO1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBtZXRob2RPcktleTogdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkdldHRlcihrZXksIGJvZHkpLCBzdGFydExvY2F0aW9uKSxcbiAgICAgICAgICAgIGtpbmQ6IFwibWV0aG9kXCJcbiAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2UgaWYgKG5hbWUgPT09IFwic2V0XCIgJiYgdGhpcy5sb29rYWhlYWRQcm9wZXJ0eU5hbWUoKSkge1xuICAgICAgICAgIGtleSA9IHRoaXMucGFyc2VQcm9wZXJ0eU5hbWUoKTtcbiAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTFBBUkVOKTtcbiAgICAgICAgICBsZXQgcGFyYW0gPSB0aGlzLnBhcnNlUGFyYW0oKTtcbiAgICAgICAgICBsZXQgaW5mbyA9IHt9O1xuICAgICAgICAgIHRoaXMuY2hlY2tQYXJhbShwYXJhbSwgdG9rZW4sIFtdLCBpbmZvKTtcbiAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcbiAgICAgICAgICBsZXQgcHJldmlvdXNZaWVsZCA9IHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb247XG4gICAgICAgICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IGZhbHNlO1xuICAgICAgICAgIGxldCBwcmV2aW91c0luQ29uc3RydWN0b3IgPSB0aGlzLmluQ29uc3RydWN0b3I7XG4gICAgICAgICAgdGhpcy5pbkNvbnN0cnVjdG9yID0gZmFsc2U7XG4gICAgICAgICAgbGV0IHByZXZpb3VzSW5NZXRob2QgPSB0aGlzLmluTWV0aG9kO1xuICAgICAgICAgIHRoaXMuaW5NZXRob2QgPSB0cnVlO1xuICAgICAgICAgIGxldCBib3VuZFBhcmFtcyA9IFBhcnNlci5ib3VuZE5hbWVzKHBhcmFtKTtcbiAgICAgICAgICBsZXQgW2JvZHksIGlzU3RyaWN0XSA9IHRoaXMucGFyc2VGdW5jdGlvbkJvZHkoYm91bmRQYXJhbXMpO1xuICAgICAgICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBwcmV2aW91c1lpZWxkO1xuICAgICAgICAgIHRoaXMuaW5Db25zdHJ1Y3RvciA9IHByZXZpb3VzSW5Db25zdHJ1Y3RvcjtcbiAgICAgICAgICB0aGlzLmluTWV0aG9kID0gcHJldmlvdXNJbk1ldGhvZDtcbiAgICAgICAgICBpZiAoaXNTdHJpY3QpIHtcbiAgICAgICAgICAgIGlmIChpbmZvLmZpcnN0UmVzdHJpY3RlZCkge1xuICAgICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKGluZm8uZmlyc3RSZXN0cmljdGVkLCBpbmZvLm1lc3NhZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbWV0aG9kT3JLZXk6IHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5TZXR0ZXIoa2V5LCBwYXJhbSwgYm9keSksIHN0YXJ0TG9jYXRpb24pLFxuICAgICAgICAgICAga2luZDogXCJtZXRob2RcIlxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuTFBBUkVOKSkge1xuICAgICAgbGV0IHByZXZpb3VzWWllbGQgPSB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uO1xuICAgICAgbGV0IHByZXZpb3VzSW5HZW5lcmF0b3JQYXJhbWV0ZXIgPSB0aGlzLmluR2VuZXJhdG9yUGFyYW1ldGVyO1xuICAgICAgdGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlciA9IGlzR2VuZXJhdG9yO1xuICAgICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IGlzR2VuZXJhdG9yO1xuICAgICAgbGV0IHBhcmFtSW5mbyA9IHRoaXMucGFyc2VQYXJhbXMobnVsbCk7XG4gICAgICB0aGlzLmluR2VuZXJhdG9yUGFyYW1ldGVyID0gcHJldmlvdXNJbkdlbmVyYXRvclBhcmFtZXRlcjtcbiAgICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBwcmV2aW91c1lpZWxkO1xuICAgICAgbGV0IHByZXZpb3VzSW5HZW5lcmF0b3JCb2R5ID0gdGhpcy5pbkdlbmVyYXRvckJvZHk7XG4gICAgICBsZXQgcHJldmlvdXNJbkNvbnN0cnVjdG9yID0gdGhpcy5pbkNvbnN0cnVjdG9yO1xuICAgICAgbGV0IHByZXZpb3VzSW5NZXRob2QgPSB0aGlzLmluTWV0aG9kO1xuICAgICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IGlzR2VuZXJhdG9yO1xuICAgICAgdGhpcy5pbkNvbnN0cnVjdG9yID1cbiAgICAgICAgaXNDbGFzc1Byb3RvTWV0aG9kICYmICFpc0dlbmVyYXRvciAmJiB0aGlzLmhhc0NsYXNzSGVyaXRhZ2UgJiZcbiAgICAgICAga2V5LnR5cGUgPT09IFwiU3RhdGljUHJvcGVydHlOYW1lXCIgJiYga2V5LnZhbHVlID09PSBcImNvbnN0cnVjdG9yXCI7XG4gICAgICB0aGlzLmluTWV0aG9kID0gdHJ1ZTtcblxuICAgICAgaWYgKGlzR2VuZXJhdG9yKSB7XG4gICAgICAgIHRoaXMuaW5HZW5lcmF0b3JCb2R5ID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGxldCBib3VuZFBhcmFtcyA9IFtdLmNvbmNhdC5hcHBseShbXSwgcGFyYW1JbmZvLnBhcmFtcy5tYXAoUGFyc2VyLmJvdW5kTmFtZXMpKTtcbiAgICAgIGxldCBbYm9keV0gPSB0aGlzLnBhcnNlRnVuY3Rpb25Cb2R5KGJvdW5kUGFyYW1zKTtcbiAgICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBwcmV2aW91c1lpZWxkO1xuICAgICAgdGhpcy5pbkdlbmVyYXRvckJvZHkgPSBwcmV2aW91c0luR2VuZXJhdG9yQm9keTtcbiAgICAgIHRoaXMuaW5Db25zdHJ1Y3RvciA9IHByZXZpb3VzSW5Db25zdHJ1Y3RvcjtcbiAgICAgIHRoaXMuaW5NZXRob2QgPSBwcmV2aW91c0luTWV0aG9kO1xuXG4gICAgICBpZiAocGFyYW1JbmZvLmZpcnN0UmVzdHJpY3RlZCkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHBhcmFtSW5mby5maXJzdFJlc3RyaWN0ZWQsIHBhcmFtSW5mby5tZXNzYWdlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB7XG4gICAgICAgIG1ldGhvZE9yS2V5OiB0aGlzLm1hcmtMb2NhdGlvbihcbiAgICAgICAgICBuZXcgU2hpZnQuTWV0aG9kKGlzR2VuZXJhdG9yLCBrZXksIHBhcmFtSW5mby5wYXJhbXMsIHBhcmFtSW5mby5yZXN0LCBib2R5KSwgc3RhcnRMb2NhdGlvbiksXG4gICAgICAgIGtpbmQ6IFwibWV0aG9kXCJcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIG1ldGhvZE9yS2V5OiBrZXksXG4gICAgICBraW5kOiB0b2tlbi50eXBlLmtsYXNzLmlzSWRlbnRpZmllck5hbWUgPyBcImlkZW50aWZpZXJcIiA6IFwicHJvcGVydHlcIlxuICAgIH07XG4gIH1cblxuICBwYXJzZUNsYXNzKHtpc0V4cHIsIGluRGVmYXVsdCA9IGZhbHNlfSkge1xuICAgIGxldCBsb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuQ0xBU1MpO1xuICAgIGxldCBpZCA9IG51bGw7XG4gICAgbGV0IGhlcml0YWdlID0gbnVsbDtcblxuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5JREVOVElGSUVSKSkge1xuICAgICAgbGV0IGlkTG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgICBpZCA9IHRoaXMucGFyc2VCaW5kaW5nSWRlbnRpZmllcigpO1xuICAgIH0gZWxzZSBpZiAoIWlzRXhwcikge1xuICAgICAgaWYgKGluRGVmYXVsdCkge1xuICAgICAgICBpZCA9IHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJCaW5kaW5nSWRlbnRpZmllclwiLCBuYW1lOiBcIipkZWZhdWx0KlwiIH0sIGxvY2F0aW9uKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IHByZXZpb3VzSW5HZW5lcmF0b3JQYXJhbWV0ZXIgPSB0aGlzLmluR2VuZXJhdG9yUGFyYW1ldGVyO1xuICAgIGxldCBwcmV2aW91c1BhcmFtWWllbGQgPSB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uO1xuICAgIGxldCBwcmV2aW91c0hhc0NsYXNzSGVyaXRhZ2UgPSB0aGlzLmhhc0NsYXNzSGVyaXRhZ2U7XG4gICAgaWYgKGlzRXhwcikge1xuICAgICAgdGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlciA9IGZhbHNlO1xuICAgICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IGZhbHNlO1xuICAgIH1cbiAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLkVYVEVORFMpKSB7XG4gICAgICBoZXJpdGFnZSA9IHRoaXMucGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uKHthbGxvd0NhbGw6IHRydWV9KTtcbiAgICB9XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTEJSQUNFKTtcbiAgICBsZXQgb3JpZ2luYWxTdHJpY3QgPSB0aGlzLnN0cmljdDtcbiAgICB0aGlzLnN0cmljdCA9IHRydWU7XG4gICAgbGV0IG1ldGhvZHMgPSBbXTtcbiAgICBsZXQgaGFzQ29uc3RydWN0b3IgPSBmYWxzZTtcbiAgICB0aGlzLmhhc0NsYXNzSGVyaXRhZ2UgPSBoZXJpdGFnZSAhPSBudWxsO1xuICAgIHdoaWxlICghdGhpcy5lYXQoVG9rZW5UeXBlLlJCUkFDRSkpIHtcbiAgICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuU0VNSUNPTE9OKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGxldCBtZXRob2RUb2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgICAgbGV0IGlzU3RhdGljID0gZmFsc2U7XG4gICAgICBsZXQge21ldGhvZE9yS2V5LCBraW5kfSA9IHRoaXMucGFyc2VNZXRob2REZWZpbml0aW9uKHRydWUpO1xuICAgICAgaWYgKGtpbmQgPT09IFwiaWRlbnRpZmllclwiICYmIG1ldGhvZE9yS2V5LnZhbHVlID09PSBcInN0YXRpY1wiKSB7XG4gICAgICAgIGlzU3RhdGljID0gdHJ1ZTtcbiAgICAgICAgKHttZXRob2RPcktleSwga2luZH0gPSB0aGlzLnBhcnNlTWV0aG9kRGVmaW5pdGlvbihmYWxzZSkpO1xuICAgICAgfVxuICAgICAgc3dpdGNoIChraW5kKSB7XG4gICAgICAgIGNhc2UgXCJtZXRob2RcIjpcbiAgICAgICAgICBsZXQga2V5ID0gbWV0aG9kT3JLZXkubmFtZTtcbiAgICAgICAgICBpZiAoIWlzU3RhdGljKSB7XG4gICAgICAgICAgICBpZiAoa2V5LnR5cGUgPT09IFwiU3RhdGljUHJvcGVydHlOYW1lXCIgJiYga2V5LnZhbHVlID09PSBcImNvbnN0cnVjdG9yXCIpIHtcbiAgICAgICAgICAgICAgaWYgKG1ldGhvZE9yS2V5LnR5cGUgIT09IFwiTWV0aG9kXCIgfHwgbWV0aG9kT3JLZXkuaXNHZW5lcmF0b3IpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKG1ldGhvZFRva2VuLCBcIkNvbnN0cnVjdG9ycyBjYW5ub3QgYmUgZ2VuZXJhdG9ycywgZ2V0dGVycyBvciBzZXR0ZXJzXCIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChoYXNDb25zdHJ1Y3Rvcikge1xuICAgICAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24obWV0aG9kVG9rZW4sIFwiT25seSBvbmUgY29uc3RydWN0b3IgaXMgYWxsb3dlZCBpbiBhIGNsYXNzXCIpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGhhc0NvbnN0cnVjdG9yID0gdHJ1ZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoa2V5LnR5cGUgPT09IFwiU3RhdGljUHJvcGVydHlOYW1lXCIgJiYga2V5LnZhbHVlID09PSBcInByb3RvdHlwZVwiKSB7XG4gICAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24obWV0aG9kVG9rZW4sIFwiU3RhdGljIGNsYXNzIG1ldGhvZHMgY2Fubm90IGJlIG5hbWVkICdwcm90b3R5cGUnXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBtZXRob2RzLnB1c2goY29weUxvY2F0aW9uKG1ldGhvZE9yS2V5LCBuZXcgU2hpZnQuQ2xhc3NFbGVtZW50KGlzU3RhdGljLCBtZXRob2RPcktleSkpKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKFwiT25seSBtZXRob2RzIGFyZSBhbGxvd2VkIGluIGNsYXNzZXNcIik7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghaXNFeHByKSB7XG4gICAgICB0aGlzLlZETltcIiRcIiArIGlkLm5hbWVdID0gdHJ1ZTtcbiAgICB9XG4gICAgdGhpcy5zdHJpY3QgPSBvcmlnaW5hbFN0cmljdDtcbiAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gcHJldmlvdXNQYXJhbVlpZWxkO1xuICAgIHRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXIgPSBwcmV2aW91c0luR2VuZXJhdG9yUGFyYW1ldGVyO1xuICAgIHRoaXMuaGFzQ2xhc3NIZXJpdGFnZSA9IHByZXZpb3VzSGFzQ2xhc3NIZXJpdGFnZTtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IChpc0V4cHIgPyBTaGlmdC5DbGFzc0V4cHJlc3Npb24gOiBTaGlmdC5DbGFzc0RlY2xhcmF0aW9uKShpZCwgaGVyaXRhZ2UsIG1ldGhvZHMpLCBsb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZUZ1bmN0aW9uKHtpc0V4cHIsIGlzVG9wTGV2ZWwsIGluRGVmYXVsdCA9IGZhbHNlLCBhbGxvd0dlbmVyYXRvciA9IHRydWV9KSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuRlVOQ1RJT04pO1xuXG4gICAgbGV0IGlkID0gbnVsbDtcbiAgICBsZXQgbWVzc2FnZSA9IG51bGw7XG4gICAgbGV0IGZpcnN0UmVzdHJpY3RlZCA9IG51bGw7XG4gICAgbGV0IGlzR2VuZXJhdG9yID0gYWxsb3dHZW5lcmF0b3IgJiYgISF0aGlzLmVhdChUb2tlblR5cGUuTVVMKTtcbiAgICBsZXQgcHJldmlvdXNHZW5lcmF0b3JQYXJhbWV0ZXIgPSB0aGlzLmluR2VuZXJhdG9yUGFyYW1ldGVyO1xuICAgIGxldCBwcmV2aW91c1lpZWxkID0gdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbjtcbiAgICBsZXQgcHJldmlvdXNJbkdlbmVyYXRvckJvZHkgPSB0aGlzLmluR2VuZXJhdG9yQm9keTtcblxuICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuTFBBUkVOKSkge1xuICAgICAgbGV0IHRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgICBsZXQgaWRlbnRpZmllckxvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgICAgaWQgPSB0aGlzLnBhcnNlSWRlbnRpZmllcigpO1xuICAgICAgaWYgKHRoaXMuc3RyaWN0IHx8IGlzR2VuZXJhdG9yKSB7XG4gICAgICAgIGlmIChpc1Jlc3RyaWN0ZWRXb3JkKGlkKSkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuU1RSSUNUX0ZVTkNUSU9OX05BTUUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoaXNSZXN0cmljdGVkV29yZChpZCkpIHtcbiAgICAgICAgICBmaXJzdFJlc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgICBtZXNzYWdlID0gRXJyb3JNZXNzYWdlcy5TVFJJQ1RfRlVOQ1RJT05fTkFNRTtcbiAgICAgICAgfSBlbHNlIGlmIChpc1N0cmljdE1vZGVSZXNlcnZlZFdvcmQoaWQpKSB7XG4gICAgICAgICAgZmlyc3RSZXN0cmljdGVkID0gdG9rZW47XG4gICAgICAgICAgbWVzc2FnZSA9IEVycm9yTWVzc2FnZXMuU1RSSUNUX1JFU0VSVkVEX1dPUkQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlkID0gdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIkJpbmRpbmdJZGVudGlmaWVyXCIsIG5hbWU6IGlkIH0sIGlkZW50aWZpZXJMb2NhdGlvbik7XG4gICAgfSBlbHNlIGlmICghaXNFeHByKSB7XG4gICAgICBpZiAoaW5EZWZhdWx0KSB7XG4gICAgICAgIGlkID0gdGhpcy5tYXJrTG9jYXRpb24oe3R5cGU6IFwiQmluZGluZ0lkZW50aWZpZXJcIiwgbmFtZTogXCIqZGVmYXVsdCpcIiB9LCBzdGFydExvY2F0aW9uKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXIgPSBpc0dlbmVyYXRvcjtcbiAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gaXNHZW5lcmF0b3I7XG4gICAgbGV0IGluZm8gPSB0aGlzLnBhcnNlUGFyYW1zKGZpcnN0UmVzdHJpY3RlZCk7XG4gICAgdGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlciA9IHByZXZpb3VzR2VuZXJhdG9yUGFyYW1ldGVyO1xuICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBwcmV2aW91c1lpZWxkO1xuXG4gICAgaWYgKGluZm8ubWVzc2FnZSAhPSBudWxsKSB7XG4gICAgICBtZXNzYWdlID0gaW5mby5tZXNzYWdlO1xuICAgIH1cblxuICAgIGxldCBwcmV2aW91c1N0cmljdCA9IHRoaXMuc3RyaWN0O1xuICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBpc0dlbmVyYXRvcjtcbiAgICBpZiAoaXNHZW5lcmF0b3IpIHtcbiAgICAgIHRoaXMuaW5HZW5lcmF0b3JCb2R5ID0gdHJ1ZTtcbiAgICB9XG4gICAgbGV0IHByZXZpb3VzSW5Db25zdHJ1Y3RvciA9IHRoaXMuaW5Db25zdHJ1Y3RvcjtcbiAgICB0aGlzLmluQ29uc3RydWN0b3IgPSBmYWxzZTtcbiAgICBsZXQgcHJldmlvdXNJbk1ldGhvZCA9IHRoaXMuaW5NZXRob2Q7XG4gICAgdGhpcy5pbk1ldGhvZCA9IGZhbHNlO1xuICAgIGxldCBib3VuZFBhcmFtcyA9IFtdLmNvbmNhdC5hcHBseShbXSwgaW5mby5wYXJhbXMubWFwKFBhcnNlci5ib3VuZE5hbWVzKSk7XG4gICAgbGV0IFtib2R5LCBpc1N0cmljdF0gPSB0aGlzLnBhcnNlRnVuY3Rpb25Cb2R5KGJvdW5kUGFyYW1zKTtcbiAgICB0aGlzLmluR2VuZXJhdG9yQm9keSA9IHByZXZpb3VzSW5HZW5lcmF0b3JCb2R5O1xuICAgIHRoaXMuaW5Db25zdHJ1Y3RvciA9IHByZXZpb3VzSW5Db25zdHJ1Y3RvcjtcbiAgICB0aGlzLmluTWV0aG9kID0gcHJldmlvdXNJbk1ldGhvZDtcblxuICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBwcmV2aW91c1lpZWxkO1xuICAgIGlmIChtZXNzYWdlICE9IG51bGwpIHtcbiAgICAgIGlmICgodGhpcy5zdHJpY3QgfHwgaXNTdHJpY3QpICYmIGluZm8uZmlyc3RSZXN0cmljdGVkICE9IG51bGwpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbihpbmZvLmZpcnN0UmVzdHJpY3RlZCwgbWVzc2FnZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuc3RyaWN0ID0gcHJldmlvdXNTdHJpY3Q7XG4gICAgbGV0IEN0b3IgPSBpc0V4cHIgPyBTaGlmdC5GdW5jdGlvbkV4cHJlc3Npb24gOiBTaGlmdC5GdW5jdGlvbkRlY2xhcmF0aW9uO1xuICAgIGlmICghaXNFeHByKSB7XG4gICAgICBpZiAoaXNUb3BMZXZlbCkge1xuICAgICAgICB0aGlzLlZETltcIiRcIiArIGlkLm5hbWVdID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuTEROLnB1c2goaWQubmFtZSk7XG4gICAgICB9XG5cbiAgICB9XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKFxuICAgICAgbmV3IEN0b3IoaXNHZW5lcmF0b3IsIGlkLCBpbmZvLnBhcmFtcywgaW5mby5yZXN0LCBib2R5KSxcbiAgICAgIHN0YXJ0TG9jYXRpb25cbiAgICApO1xuICB9XG5cbiAgcGFyc2VQYXJhbSgpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICBsZXQgb3JpZ2luYWxJblBhcmFtZXRlciA9IHRoaXMuaW5QYXJhbWV0ZXI7XG4gICAgdGhpcy5pblBhcmFtZXRlciA9IHRydWU7XG4gICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkxQQVJFTikpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgfVxuICAgIGxldCBwYXJhbSA9IHRoaXMucGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uKHthbGxvd0NhbGw6IGZhbHNlfSk7XG4gICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5BU1NJR04pKSB7XG4gICAgICBsZXQgcHJldmlvdXNJbkdlbmVyYXRvclBhcmFtZXRlciA9IHRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXI7XG4gICAgICBsZXQgcHJldmlvdXNZaWVsZEV4cHJlc3Npb24gPSB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uO1xuICAgICAgaWYgKHRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXIpIHtcbiAgICAgICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgdGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlciA9IGZhbHNlO1xuICAgICAgcGFyYW0gPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQXNzaWdubWVudEV4cHJlc3Npb24oXCI9XCIsIHBhcmFtLCB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKSksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgdGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlciA9IHByZXZpb3VzSW5HZW5lcmF0b3JQYXJhbWV0ZXI7XG4gICAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gcHJldmlvdXNZaWVsZEV4cHJlc3Npb247XG4gICAgfVxuICAgIGlmICghUGFyc2VyLmlzRGVzdHJ1Y3R1cmluZ1RhcmdldFdpdGhEZWZhdWx0KHBhcmFtLCBQYXJzZXIuaXNWYWxpZFNpbXBsZUJpbmRpbmdUYXJnZXQpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodG9rZW4pO1xuICAgIH1cbiAgICB0aGlzLmluUGFyYW1ldGVyID0gb3JpZ2luYWxJblBhcmFtZXRlcjtcbiAgICByZXR1cm4gUGFyc2VyLnRyYW5zZm9ybURlc3RydWN0dXJpbmcocGFyYW0pO1xuICB9XG5cbiAgY2hlY2tQYXJhbShwYXJhbSwgdG9rZW4sIGJvdW5kLCBpbmZvKSB7XG4gICAgbGV0IG5ld0JvdW5kID0gUGFyc2VyLmJvdW5kTmFtZXMocGFyYW0pO1xuICAgIFtdLnB1c2guYXBwbHkoYm91bmQsIG5ld0JvdW5kKTtcblxuICAgIGlmIChmaXJzdER1cGxpY2F0ZShuZXdCb3VuZCkgIT0gbnVsbCkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5EVVBMSUNBVEVfQklORElORywgZmlyc3REdXBsaWNhdGUobmV3Qm91bmQpKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5zdHJpY3QpIHtcbiAgICAgIGlmIChuZXdCb3VuZC5zb21lKGlzUmVzdHJpY3RlZFdvcmQpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuU1RSSUNUX1BBUkFNX05BTUUpO1xuICAgICAgfSBlbHNlIGlmIChmaXJzdER1cGxpY2F0ZShib3VuZCkgIT0gbnVsbCkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLlNUUklDVF9QQVJBTV9EVVBFKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGluZm8uZmlyc3RSZXN0cmljdGVkID09IG51bGwpIHtcbiAgICAgIGlmIChuZXdCb3VuZC5zb21lKGlzUmVzdHJpY3RlZFdvcmQpKSB7XG4gICAgICAgIGluZm8uZmlyc3RSZXN0cmljdGVkID0gdG9rZW47XG4gICAgICAgIGluZm8ubWVzc2FnZSA9IEVycm9yTWVzc2FnZXMuU1RSSUNUX1BBUkFNX05BTUU7XG4gICAgICB9IGVsc2UgaWYgKGhhc1N0cmljdE1vZGVSZXNlcnZlZFdvcmQobmV3Qm91bmQpKSB7XG4gICAgICAgIGluZm8uZmlyc3RSZXN0cmljdGVkID0gdG9rZW47XG4gICAgICAgIGluZm8ubWVzc2FnZSA9IEVycm9yTWVzc2FnZXMuU1RSSUNUX1JFU0VSVkVEX1dPUkQ7XG4gICAgICB9IGVsc2UgaWYgKGZpcnN0RHVwbGljYXRlKGJvdW5kKSAhPSBudWxsKSB7XG4gICAgICAgIGluZm8uZmlyc3RSZXN0cmljdGVkID0gdG9rZW47XG4gICAgICAgIGluZm8ubWVzc2FnZSA9IEVycm9yTWVzc2FnZXMuU1RSSUNUX1BBUkFNX0RVUEU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcGFyc2VQYXJhbXMoZnIpIHtcbiAgICBsZXQgaW5mbyA9IHtwYXJhbXM6IFtdLCByZXN0OiBudWxsfSwgaXNTaW1wbGVQYXJhbWV0ZXIgPSB0cnVlO1xuICAgIGluZm8uZmlyc3RSZXN0cmljdGVkID0gZnI7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG5cbiAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJQQVJFTikpIHtcbiAgICAgIGxldCBib3VuZCA9IFtdO1xuICAgICAgbGV0IHNlZW5SZXN0ID0gZmFsc2U7XG5cbiAgICAgIHdoaWxlICghdGhpcy5lb2YoKSkge1xuICAgICAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICAgICAgbGV0IHBhcmFtO1xuICAgICAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLkVMTElQU0lTKSkge1xuICAgICAgICAgIGlzU2ltcGxlUGFyYW1ldGVyID0gZmFsc2U7XG4gICAgICAgICAgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICAgICAgICBwYXJhbSA9IHRoaXMucGFyc2VCaW5kaW5nSWRlbnRpZmllcigpO1xuICAgICAgICAgIHNlZW5SZXN0ID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwYXJhbSA9IHRoaXMucGFyc2VQYXJhbSgpO1xuICAgICAgICAgIGlmIChwYXJhbS50eXBlICE9PSBcIkJpbmRpbmdJZGVudGlmaWVyXCIpIHtcbiAgICAgICAgICAgIGlzU2ltcGxlUGFyYW1ldGVyID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jaGVja1BhcmFtKHBhcmFtLCB0b2tlbiwgYm91bmQsIGluZm8pO1xuXG4gICAgICAgIGlmIChzZWVuUmVzdCkge1xuICAgICAgICAgIGluZm8ucmVzdCA9IHBhcmFtO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGluZm8ucGFyYW1zLnB1c2gocGFyYW0pO1xuICAgICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuUlBBUkVOKSkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5DT01NQSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFpc1NpbXBsZVBhcmFtZXRlcikge1xuICAgICAgaWYgKGluZm8ubWVzc2FnZSA9PT0gRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUEFSQU1fRFVQRSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKGluZm8ubWVzc2FnZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJQQVJFTik7XG4gICAgcmV0dXJuIGluZm87XG4gIH1cbn1cbiJdfQ==