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
        }
        return node;
      },
      writable: true,
      configurable: true
    },
    isDestructuringTarget: {
      value: function isDestructuringTarget(node, _ref) {
        var isAssignment = _ref.isAssignment;
        switch (node.type) {
          case "ObjectExpression":
            return node.properties.every(function (p) {
              return p.type === "BindingPropertyIdentifier" || p.type === "ShorthandProperty" || p.type === "DataProperty" && Parser.isDestructuringTargetWithDefault(p.expression, { isAssignment: isAssignment });
            });
          case "ArrayExpression":
            if (node.elements.length === 0) {
              return false;
            }if (!node.elements.slice(0, -1).filter(function (e) {
              return e != null;
            }).every(function (e) {
              return Parser.isDestructuringTargetWithDefault(e, { isAssignment: isAssignment });
            })) {
              return false;
            }var last = node.elements[node.elements.length - 1];
            return last == null || last.type === "SpreadElement" && Parser.isDestructuringTarget(last.expression, { isAssignment: isAssignment }) || Parser.isDestructuringTargetWithDefault(last, { isAssignment: isAssignment });
          case "ArrayBinding":
          case "BindingIdentifier":
          case "BindingPropertyIdentifier":
          case "BindingPropertyProperty":
          case "BindingWithDefault":
          case "IdentifierExpression":
          case "ObjectBinding":
            return true;
          case "ComputedMemberExpression":
          case "StaticMemberExpression":
            return isAssignment;
        }
        return false;
      },
      writable: true,
      configurable: true
    },
    isDestructuringTargetWithDefault: {
      value: function isDestructuringTargetWithDefault(node, _ref) {
        var isAssignment = _ref.isAssignment;
        return node.type === "AssignmentExpression" && node.operator === "=" ? Parser.isDestructuringTarget(node.binding, { isAssignment: isAssignment }) : Parser.isDestructuringTarget(node, { isAssignment: isAssignment });
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

        if (!Parser.isDestructuringTarget(param, { isAssignment: false })) {
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
        var id = this.parseLeftHandSideExpression({ allowCall: false });

        if (!Parser.isDestructuringTarget(id, { isAssignment: false })) {
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

        var node = this.parseConditionalExpression();

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
          if (!Parser.isDestructuringTarget(node, { isAssignment: true })) {
            throw this.createError(ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
          }
          node = Parser.transformDestructuring(node);

          var bound = Parser.boundNames(node);
          if (this.strict && bound.some(isRestrictedWord)) {
            throw this.createErrorWithLocation(token, ErrorMessages.STRICT_LHS_ASSIGNMENT);
          }
        } else {
          if (node.type === "ObjectExpression" && node.properties.some(function (p) {
            return p.type === "BindingPropertyIdentifier";
          })) {
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
            return Parser.isDestructuringTargetWithDefault(e, { isAssignment: false });
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
              methods.push(new Shift.ClassElement(isStatic, methodOrKey));
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
            } else if (isStrictModeReservedWordES5(id)) {
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
          param = this.markLocation(new Shift.AssignmentExpression("=", param, this.parseAssignmentExpression()));
          this.inGeneratorParameter = previousInGeneratorParameter;
          this.allowYieldExpression = previousYieldExpression;
        }
        if (!Parser.isDestructuringTargetWithDefault(param, { isAssignment: false })) {
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
//# sourceMappingURL=data:application/json;base64,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QUFFLENBQUM7QUFDdEMsc0JBQVEsR0FBRyxJQUFJLENBQUM7YUFDakIsTUFBTTtBQUNMLG1CQUFLLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQzFCLGtCQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssbUJBQW1CLEVBQUU7QUFDdEMsaUNBQWlCLEdBQUcsS0FBSyxDQUFDO2VBQzNCO2FBQ0Y7O0FBRUQsZ0JBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7O0FBRTNDLGdCQUFJLFFBQVEsRUFBRTtBQUNaLGtCQUFJLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQztBQUNsQixvQkFBTTthQUNQO0FBQ0QsZ0JBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3hCLGdCQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQ2hDLG9CQUFNO2FBQ1A7QUFDRCxnQkFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7V0FDOUI7U0FDRjs7QUFFRCxZQUFJLENBQUMsaUJBQWlCLEVBQUU7QUFDdEIsY0FBSSxJQUFJLENBQUMsT0FBTyxLQUFLLGFBQWEsQ0FBQyxpQkFBaUIsRUFBRTtBQUNwRCxrQkFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztXQUN0QztTQUNGOztBQUVELFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlCLGVBQU8sSUFBSSxDQUFDO09BQ2I7Ozs7OztTQXA2RVUsTUFBTTtHQUFTLFNBQVMiLCJmaWxlIjoic3JjL3BhcnNlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29weXJpZ2h0IDIwMTQgU2hhcGUgU2VjdXJpdHksIEluYy5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpXG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgKiBhcyBTaGlmdCBmcm9tIFwic2hpZnQtYXN0XCI7XG5cbmltcG9ydCB7aXNSZXN0cmljdGVkV29yZCwgaXNTdHJpY3RNb2RlUmVzZXJ2ZWRXb3JkRVM1fSBmcm9tIFwiLi91dGlsc1wiO1xuXG5pbXBvcnQge0Vycm9yTWVzc2FnZXN9IGZyb20gXCIuL2Vycm9yc1wiO1xuXG5pbXBvcnQgVG9rZW5pemVyLCB7IFRva2VuQ2xhc3MsIFRva2VuVHlwZSB9IGZyb20gXCIuL3Rva2VuaXplclwiO1xuXG4vLyBFbXB0eSBwYXJhbWV0ZXIgbGlzdCBmb3IgQXJyb3dFeHByZXNzaW9uXG5jb25zdCBBUlJPV19FWFBSRVNTSU9OX1BBUkFNUyA9IFwiQ292ZXJQYXJlbnRoZXNpemVkRXhwcmVzc2lvbkFuZEFycm93UGFyYW1ldGVyTGlzdFwiO1xuXG5jb25zdCBTVFJJQ1RfTU9ERV9SRVNFUlZFRF9XT1JEID0ge1xuICBcImltcGxlbWVudHNcIjogbnVsbCwgXCJpbnRlcmZhY2VcIjogbnVsbCwgXCJwYWNrYWdlXCI6IG51bGwsIFwicHJpdmF0ZVwiOiBudWxsLCBcInByb3RlY3RlZFwiOiBudWxsLFxuICBcInB1YmxpY1wiOiBudWxsLCBcInN0YXRpY1wiOiBudWxsLCBcInlpZWxkXCI6IG51bGwsIFwibGV0XCI6IG51bGxcbn07XG5cbmNvbnN0IFByZWNlZGVuY2UgPSB7XG4gIFNlcXVlbmNlOiAwLFxuICBZaWVsZDogMSxcbiAgQXNzaWdubWVudDogMSxcbiAgQ29uZGl0aW9uYWw6IDIsXG4gIEFycm93RnVuY3Rpb246IDIsXG4gIExvZ2ljYWxPUjogMyxcbiAgTG9naWNhbEFORDogNCxcbiAgQml0d2lzZU9SOiA1LFxuICBCaXR3aXNlWE9SOiA2LFxuICBCaXR3aXNlQU5EOiA3LFxuICBFcXVhbGl0eTogOCxcbiAgUmVsYXRpb25hbDogOSxcbiAgQml0d2lzZVNISUZUOiAxMCxcbiAgQWRkaXRpdmU6IDExLFxuICBNdWx0aXBsaWNhdGl2ZTogMTIsXG4gIFVuYXJ5OiAxMyxcbiAgUG9zdGZpeDogMTQsXG4gIENhbGw6IDE1LFxuICBOZXc6IDE2LFxuICBUYWdnZWRUZW1wbGF0ZTogMTcsXG4gIE1lbWJlcjogMTgsXG4gIFByaW1hcnk6IDE5XG59O1xuXG5jb25zdCBCaW5hcnlQcmVjZWRlbmNlID0ge1xuICBcInx8XCI6IFByZWNlZGVuY2UuTG9naWNhbE9SLFxuICBcIiYmXCI6IFByZWNlZGVuY2UuTG9naWNhbEFORCxcbiAgXCJ8XCI6IFByZWNlZGVuY2UuQml0d2lzZU9SLFxuICBcIl5cIjogUHJlY2VkZW5jZS5CaXR3aXNlWE9SLFxuICBcIiZcIjogUHJlY2VkZW5jZS5CaXR3aXNlQU5ELFxuICBcIj09XCI6IFByZWNlZGVuY2UuRXF1YWxpdHksXG4gIFwiIT1cIjogUHJlY2VkZW5jZS5FcXVhbGl0eSxcbiAgXCI9PT1cIjogUHJlY2VkZW5jZS5FcXVhbGl0eSxcbiAgXCIhPT1cIjogUHJlY2VkZW5jZS5FcXVhbGl0eSxcbiAgXCI8XCI6IFByZWNlZGVuY2UuUmVsYXRpb25hbCxcbiAgXCI+XCI6IFByZWNlZGVuY2UuUmVsYXRpb25hbCxcbiAgXCI8PVwiOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gIFwiPj1cIjogUHJlY2VkZW5jZS5SZWxhdGlvbmFsLFxuICBcImluXCI6IFByZWNlZGVuY2UuUmVsYXRpb25hbCxcbiAgXCJpbnN0YW5jZW9mXCI6IFByZWNlZGVuY2UuUmVsYXRpb25hbCxcbiAgXCI8PFwiOiBQcmVjZWRlbmNlLkJpdHdpc2VTSElGVCxcbiAgXCI+PlwiOiBQcmVjZWRlbmNlLkJpdHdpc2VTSElGVCxcbiAgXCI+Pj5cIjogUHJlY2VkZW5jZS5CaXR3aXNlU0hJRlQsXG4gIFwiK1wiOiBQcmVjZWRlbmNlLkFkZGl0aXZlLFxuICBcIi1cIjogUHJlY2VkZW5jZS5BZGRpdGl2ZSxcbiAgXCIqXCI6IFByZWNlZGVuY2UuTXVsdGlwbGljYXRpdmUsXG4gIFwiJVwiOiBQcmVjZWRlbmNlLk11bHRpcGxpY2F0aXZlLFxuICBcIi9cIjogUHJlY2VkZW5jZS5NdWx0aXBsaWNhdGl2ZSxcbn07XG5cbmNvbnN0IEZPUl9PRl9WQVIgPSB7fTtcblxuZnVuY3Rpb24gY29weUxvY2F0aW9uKGZyb20sIHRvKSB7XG4gIGlmIChcImxvY1wiIGluIGZyb20pIHtcbiAgICB0by5sb2MgPSBmcm9tLmxvYztcbiAgfVxuICByZXR1cm4gdG87XG59XG5cbi8qKlxuICpcbiAqIEBwYXJhbSB7W3N0cmluZ119IHN0cmluZ3NcbiAqIEByZXR1cm5zIHtzdHJpbmc/fVxuICovXG5mdW5jdGlvbiBmaXJzdER1cGxpY2F0ZShzdHJpbmdzKSB7XG4gIGlmIChzdHJpbmdzLmxlbmd0aCA8IDIpIHJldHVybiBudWxsO1xuICBsZXQgbWFwID0ge307XG4gIGZvciAobGV0IGN1cnNvciA9IDA7IGN1cnNvciA8IHN0cmluZ3MubGVuZ3RoOyBjdXJzb3IrKykge1xuICAgIGxldCBpZCA9IFwiJFwiICsgc3RyaW5nc1tjdXJzb3JdO1xuICAgIGlmIChtYXAuaGFzT3duUHJvcGVydHkoaWQpKSB7XG4gICAgICByZXR1cm4gc3RyaW5nc1tjdXJzb3JdO1xuICAgIH1cbiAgICBtYXBbaWRdID0gdHJ1ZTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gaGFzU3RyaWN0TW9kZVJlc2VydmVkV29yZChpZHMpIHtcbiAgcmV0dXJuIGlkcy5zb21lKGlkID0+IFNUUklDVF9NT0RFX1JFU0VSVkVEX1dPUkQuaGFzT3duUHJvcGVydHkoaWQpKTtcbn1cblxuZXhwb3J0IGNsYXNzIFBhcnNlciBleHRlbmRzIFRva2VuaXplciB7XG4gIGNvbnN0cnVjdG9yKHNvdXJjZSkge1xuICAgIHN1cGVyKHNvdXJjZSk7XG4gICAgdGhpcy5sYWJlbFNldCA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgdGhpcy5MRE4gPSBbXTtcbiAgICB0aGlzLlZETiA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgdGhpcy5hbGxvd0luID0gdHJ1ZTtcbiAgICB0aGlzLmluSXRlcmF0aW9uID0gZmFsc2U7XG4gICAgdGhpcy5pblN3aXRjaCA9IGZhbHNlO1xuICAgIHRoaXMuaW5GdW5jdGlvbkJvZHkgPSBmYWxzZTtcbiAgICB0aGlzLmluTWV0aG9kID0gZmFsc2U7XG4gICAgdGhpcy5pbkNvbnN0cnVjdG9yID0gZmFsc2U7XG4gICAgdGhpcy5oYXNDbGFzc0hlcml0YWdlID0gZmFsc2U7XG4gICAgdGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlciA9IGZhbHNlO1xuICAgIHRoaXMuaW5QYXJhbWV0ZXIgPSBmYWxzZTtcbiAgICB0aGlzLmluR2VuZXJhdG9yQm9keSA9IGZhbHNlO1xuICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBmYWxzZTtcbiAgICB0aGlzLmFsbG93TGFiZWxlZEZ1bmN0aW9uID0gdHJ1ZTtcbiAgICB0aGlzLm1vZHVsZSA9IGZhbHNlO1xuICAgIHRoaXMuc3RyaWN0ID0gZmFsc2U7XG4gIH1cblxuICBlYXQodG9rZW5UeXBlKSB7XG4gICAgaWYgKHRoaXMubG9va2FoZWFkLnR5cGUgPT09IHRva2VuVHlwZSkge1xuICAgICAgcmV0dXJuIHRoaXMubGV4KCk7XG4gICAgfVxuICB9XG5cbiAgZXhwZWN0KHRva2VuVHlwZSkge1xuICAgIGlmICh0aGlzLmxvb2thaGVhZC50eXBlID09PSB0b2tlblR5cGUpIHtcbiAgICAgIHJldHVybiB0aGlzLmxleCgpO1xuICAgIH1cbiAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuICB9XG5cbiAgbWF0Y2hDb250ZXh0dWFsS2V5d29yZChrZXl3b3JkKSB7XG4gICAgcmV0dXJuIHRoaXMubG9va2FoZWFkLnR5cGUgPT09IFRva2VuVHlwZS5JREVOVElGSUVSICYmIHRoaXMubG9va2FoZWFkLnZhbHVlID09PSBrZXl3b3JkO1xuICB9XG5cbiAgZXhwZWN0Q29udGV4dHVhbEtleXdvcmQoa2V5d29yZCkge1xuICAgIGlmICh0aGlzLm1hdGNoQ29udGV4dHVhbEtleXdvcmQoa2V5d29yZCkpIHtcbiAgICAgIHJldHVybiB0aGlzLmxleCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuICAgIH1cbiAgfVxuXG4gIGVhdENvbnRleHR1YWxLZXl3b3JkKGtleXdvcmQpIHtcbiAgICBpZiAodGhpcy5tYXRjaENvbnRleHR1YWxLZXl3b3JkKGtleXdvcmQpKSB7XG4gICAgICByZXR1cm4gdGhpcy5sZXgoKTtcbiAgICB9XG4gIH1cblxuICBtYXRjaChzdWJUeXBlKSB7XG4gICAgcmV0dXJuIHRoaXMubG9va2FoZWFkLnR5cGUgPT09IHN1YlR5cGU7XG4gIH1cblxuICBjb25zdW1lU2VtaWNvbG9uKCkge1xuICAgIGlmICh0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuU0VNSUNPTE9OKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5lb2YoKSAmJiAhdGhpcy5tYXRjaChUb2tlblR5cGUuUkJSQUNFKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICB9XG4gIH1cblxuICAvLyB0aGlzIGlzIGEgbm8tb3AsIHJlc2VydmVkIGZvciBmdXR1cmUgdXNlXG4gIG1hcmtMb2NhdGlvbihub2RlLCBzdGFydExvY2F0aW9uKSB7XG4gICAgcmV0dXJuIG5vZGU7XG4gIH1cblxuICB3cmFwVkROKGYsIHBvc3QpIHtcbiAgICBsZXQgb3JpZ2luYWxWRE4gPSB0aGlzLlZETjtcbiAgICB0aGlzLlZETiA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgbGV0IHJlc3VsdCA9IGYuY2FsbCh0aGlzKTtcbiAgICBpZiAocG9zdCkgcG9zdC5jYWxsKHRoaXMpO1xuXG4gICAgZm9yIChsZXQga2V5IGluIHRoaXMuVkROKSB7XG4gICAgICBvcmlnaW5hbFZETltrZXldID0gdGhpcy5WRE5ba2V5XTtcbiAgICB9XG4gICAgdGhpcy5WRE4gPSBvcmlnaW5hbFZETjtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgY2hlY2tCbG9ja1Njb3BlKCkge1xuICAgIGxldCBkdXBsaWNhdGUgPSBmaXJzdER1cGxpY2F0ZSh0aGlzLkxETik7XG4gICAgaWYgKGR1cGxpY2F0ZSAhPT0gbnVsbCkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLkRVUExJQ0FURV9CSU5ESU5HLCBkdXBsaWNhdGUpO1xuICAgIH1cbiAgICB0aGlzLkxETi5mb3JFYWNoKG5hbWUgPT4ge1xuICAgICAgaWYgKHt9Lmhhc093blByb3BlcnR5LmNhbGwodGhpcy5WRE4sIFwiJFwiICsgbmFtZSkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLkRVUExJQ0FURV9CSU5ESU5HLCBuYW1lKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHBhcnNlTW9kdWxlKCkge1xuICAgIHRoaXMubW9kdWxlID0gdHJ1ZTtcbiAgICB0aGlzLnN0cmljdCA9IHRydWU7XG5cbiAgICB0aGlzLmxvb2thaGVhZCA9IHRoaXMuYWR2YW5jZSgpO1xuICAgIGxldCBsb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgZXhwb3J0ZWROYW1lcyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgbGV0IGV4cG9ydGVkQmluZGluZ3MgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIGxldCBpdGVtcyA9IFtdO1xuICAgIHdoaWxlICghdGhpcy5lb2YoKSkge1xuICAgICAgaXRlbXMucHVzaCh0aGlzLnBhcnNlTW9kdWxlSXRlbShleHBvcnRlZE5hbWVzLCBleHBvcnRlZEJpbmRpbmdzKSk7XG4gICAgfVxuICAgIGZvciAobGV0IGtleSBpbiBleHBvcnRlZEJpbmRpbmdzKSB7XG4gICAgICBpZiAoIXt9Lmhhc093blByb3BlcnR5LmNhbGwodGhpcy5WRE4sIGtleSkgJiYgdGhpcy5MRE4uaW5kZXhPZihrZXkuc2xpY2UoMSkpID09PSAtMSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuTU9EVUxFX0VYUE9SVF9VTkRFRklORUQsIGtleS5zbGljZSgxKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuY2hlY2tCbG9ja1Njb3BlKCk7XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5Nb2R1bGUoaXRlbXMpLCBsb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZVNjcmlwdCgpIHtcbiAgICB0aGlzLmxvb2thaGVhZCA9IHRoaXMuYWR2YW5jZSgpO1xuXG4gICAgbGV0IGxvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCBvcmlnaW5hbExETiA9IHRoaXMuTEROO1xuICAgIHRoaXMuTEROID0gW107XG5cbiAgICBsZXQgW2JvZHldID0gdGhpcy5wYXJzZUJvZHkoKTtcbiAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLkVPUykpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgfVxuICAgIHRoaXMuY2hlY2tCbG9ja1Njb3BlKCk7XG4gICAgdGhpcy5MRE4gPSBvcmlnaW5hbExETjtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlNjcmlwdChib2R5KSwgbG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VGdW5jdGlvbkJvZHkoYm91bmRQYXJhbXMpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcblxuICAgIGxldCBvbGRWRE4gPSB0aGlzLlZETjtcbiAgICB0aGlzLlZETiA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbiAgICBsZXQgb3JpZ2luYWxMRE4gPSB0aGlzLkxETjtcbiAgICB0aGlzLkxETiA9IFtdO1xuXG4gICAgYm91bmRQYXJhbXMuZm9yRWFjaChuYW1lID0+IHRoaXMuVkROW1wiJFwiICsgbmFtZV0gPSB0cnVlKTtcblxuICAgIGxldCBvbGRMYWJlbFNldCA9IHRoaXMubGFiZWxTZXQ7XG4gICAgbGV0IG9sZEluSXRlcmF0aW9uID0gdGhpcy5pbkl0ZXJhdGlvbjtcbiAgICBsZXQgb2xkSW5Td2l0Y2ggPSB0aGlzLmluU3dpdGNoO1xuICAgIGxldCBvbGRJbkZ1bmN0aW9uQm9keSA9IHRoaXMuaW5GdW5jdGlvbkJvZHk7XG4gICAgbGV0IHByZXZpb3VzU3RyaWN0ID0gdGhpcy5zdHJpY3Q7XG4gICAgbGV0IG9sZE1vZHVsZSA9IHRoaXMubW9kdWxlO1xuXG4gICAgdGhpcy5sYWJlbFNldCA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgdGhpcy5pbkl0ZXJhdGlvbiA9IGZhbHNlO1xuICAgIHRoaXMuaW5Td2l0Y2ggPSBmYWxzZTtcbiAgICB0aGlzLmluRnVuY3Rpb25Cb2R5ID0gdHJ1ZTtcbiAgICB0aGlzLm1vZHVsZSA9IGZhbHNlO1xuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxCUkFDRSk7XG4gICAgbGV0IFtib2R5LCBpc1N0cmljdF0gPSB0aGlzLnBhcnNlQm9keSgpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SQlJBQ0UpO1xuXG4gICAgdGhpcy5jaGVja0Jsb2NrU2NvcGUoKTtcblxuICAgIHRoaXMuVkROID0gb2xkVkROO1xuICAgIHRoaXMuTEROID0gb3JpZ2luYWxMRE47XG5cbiAgICBib2R5ID0gdGhpcy5tYXJrTG9jYXRpb24oYm9keSwgc3RhcnRMb2NhdGlvbik7XG5cbiAgICB0aGlzLmxhYmVsU2V0ID0gb2xkTGFiZWxTZXQ7XG4gICAgdGhpcy5pbkl0ZXJhdGlvbiA9IG9sZEluSXRlcmF0aW9uO1xuICAgIHRoaXMuaW5Td2l0Y2ggPSBvbGRJblN3aXRjaDtcbiAgICB0aGlzLmluRnVuY3Rpb25Cb2R5ID0gb2xkSW5GdW5jdGlvbkJvZHk7XG4gICAgdGhpcy5zdHJpY3QgPSBwcmV2aW91c1N0cmljdDtcbiAgICB0aGlzLm1vZHVsZSA9IG9sZE1vZHVsZTtcbiAgICByZXR1cm4gW2JvZHksIGlzU3RyaWN0XTtcbiAgfVxuXG4gIHBhcnNlQm9keSgpIHtcbiAgICBsZXQgbG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IGRpcmVjdGl2ZXMgPSBbXTtcbiAgICBsZXQgc3RhdGVtZW50cyA9IFtdO1xuICAgIGxldCBwYXJzaW5nRGlyZWN0aXZlcyA9IHRydWU7XG4gICAgbGV0IGlzU3RyaWN0ID0gdGhpcy5zdHJpY3Q7XG4gICAgbGV0IGZpcnN0UmVzdHJpY3RlZCA9IG51bGw7XG4gICAgdGhpcy53cmFwVkROKCgpID0+IHtcbiAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgIGlmICh0aGlzLmVvZigpIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLlJCUkFDRSkpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICAgICAgbGV0IHRleHQgPSB0b2tlbi5zbGljZS50ZXh0O1xuICAgICAgICBsZXQgaXNTdHJpbmdMaXRlcmFsID0gdG9rZW4udHlwZSA9PT0gVG9rZW5UeXBlLlNUUklORztcbiAgICAgICAgbGV0IGRpcmVjdGl2ZUxvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgICAgICBsZXQgc3RtdCA9IHRoaXMucGFyc2VTdGF0ZW1lbnRMaXN0SXRlbSh7aXNUb3BMZXZlbDogdHJ1ZX0pO1xuICAgICAgICBpZiAocGFyc2luZ0RpcmVjdGl2ZXMpIHtcbiAgICAgICAgICBpZiAoaXNTdHJpbmdMaXRlcmFsICYmIHN0bXQudHlwZSA9PT0gXCJFeHByZXNzaW9uU3RhdGVtZW50XCIgJiZcbiAgICAgICAgICAgIHN0bXQuZXhwcmVzc2lvbi50eXBlID09PSBcIkxpdGVyYWxTdHJpbmdFeHByZXNzaW9uXCIpIHtcbiAgICAgICAgICAgIGlmICh0ZXh0ID09PSBcIlxcXCJ1c2Ugc3RyaWN0XFxcIlwiIHx8IHRleHQgPT09IFwiJ3VzZSBzdHJpY3QnXCIpIHtcbiAgICAgICAgICAgICAgaXNTdHJpY3QgPSB0cnVlO1xuICAgICAgICAgICAgICB0aGlzLnN0cmljdCA9IHRydWU7XG4gICAgICAgICAgICAgIGlmIChmaXJzdFJlc3RyaWN0ZWQgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24oZmlyc3RSZXN0cmljdGVkLCBFcnJvck1lc3NhZ2VzLlNUUklDVF9PQ1RBTF9MSVRFUkFMKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChmaXJzdFJlc3RyaWN0ZWQgPT0gbnVsbCAmJiB0b2tlbi5vY3RhbCkge1xuICAgICAgICAgICAgICBmaXJzdFJlc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRpcmVjdGl2ZXMucHVzaCh0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuRGlyZWN0aXZlKHRleHQuc2xpY2UoMSwgLTEpKSwgZGlyZWN0aXZlTG9jYXRpb24pKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcGFyc2luZ0RpcmVjdGl2ZXMgPSBmYWxzZTtcbiAgICAgICAgICAgIHN0YXRlbWVudHMucHVzaChzdG10KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RhdGVtZW50cy5wdXNoKHN0bXQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSwgKCkgPT4ge1xuXG4gICAgfSk7XG4gICAgcmV0dXJuIFt0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuRnVuY3Rpb25Cb2R5KGRpcmVjdGl2ZXMsIHN0YXRlbWVudHMpLCBsb2NhdGlvbiksIGlzU3RyaWN0XTtcbiAgfVxuXG4gIHBhcnNlSW1wb3J0U3BlY2lmaWVyKGJvdW5kTmFtZXMpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKSwgaWRlbnRpZmllcjtcbiAgICBpZiAodGhpcy5sb29rYWhlYWQudHlwZSA9PT0gVG9rZW5UeXBlLklERU5USUZJRVIpIHtcbiAgICAgIGlkZW50aWZpZXIgPSB0aGlzLnBhcnNlSWRlbnRpZmllcigpO1xuICAgICAgaWYgKCF0aGlzLmVhdENvbnRleHR1YWxLZXl3b3JkKFwiYXNcIikpIHtcbiAgICAgICAgaWYgKHt9Lmhhc093blByb3BlcnR5LmNhbGwoYm91bmROYW1lcywgXCIkXCIgKyBpZGVudGlmaWVyKSkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24oc3RhcnRMb2NhdGlvbiwgRXJyb3JNZXNzYWdlcy5JTVBPUlRfRFVQRSk7XG4gICAgICAgIH1cbiAgICAgICAgYm91bmROYW1lc1tcIiRcIiArIGlkZW50aWZpZXJdID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKFxuICAgICAgICAgIG5ldyBTaGlmdC5JbXBvcnRTcGVjaWZpZXIoXG4gICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIkJpbmRpbmdJZGVudGlmaWVyXCIsIG5hbWU6IGlkZW50aWZpZXIgfSwgc3RhcnRMb2NhdGlvbikpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHRoaXMubG9va2FoZWFkLnR5cGUua2xhc3MuaXNJZGVudGlmaWVyTmFtZSkge1xuICAgICAgaWRlbnRpZmllciA9IHRoaXMucGFyc2VJZGVudGlmaWVyTmFtZSgpO1xuICAgICAgdGhpcy5leHBlY3RDb250ZXh0dWFsS2V5d29yZChcImFzXCIpO1xuICAgIH1cblxuICAgIGxldCBsb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgYm91bmROYW1lID0gdGhpcy5wYXJzZUlkZW50aWZpZXIoKTtcbiAgICBpZiAoe30uaGFzT3duUHJvcGVydHkuY2FsbChib3VuZE5hbWVzLCBcIiRcIiArIGJvdW5kTmFtZSkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24obG9jYXRpb24sIEVycm9yTWVzc2FnZXMuSU1QT1JUX0RVUEUpO1xuICAgIH1cbiAgICBib3VuZE5hbWVzW1wiJFwiICsgYm91bmROYW1lXSA9IHRydWU7XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKFxuICAgICAgbmV3IFNoaWZ0LkltcG9ydFNwZWNpZmllcihcbiAgICAgICAgaWRlbnRpZmllcixcbiAgICAgICAgdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIkJpbmRpbmdJZGVudGlmaWVyXCIsIG5hbWU6IGJvdW5kTmFtZSB9LCBsb2NhdGlvbikpLFxuICAgICAgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZU5hbWVTcGFjZUJpbmRpbmcoYm91bmROYW1lcykge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5NVUwpO1xuICAgIHRoaXMuZXhwZWN0Q29udGV4dHVhbEtleXdvcmQoXCJhc1wiKTtcbiAgICBsZXQgaWRlbnRpZmllckxvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCBpZGVudGlmaWVyID0gdGhpcy5wYXJzZUlkZW50aWZpZXIoKTtcbiAgICBpZiAoe30uaGFzT3duUHJvcGVydHkuY2FsbChib3VuZE5hbWVzLCBcIiRcIiArIGlkZW50aWZpZXIpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKGlkZW50aWZpZXJMb2NhdGlvbiwgRXJyb3JNZXNzYWdlcy5JTVBPUlRfRFVQRSk7XG4gICAgfVxuICAgIGJvdW5kTmFtZXNbXCIkXCIgKyBpZGVudGlmaWVyXSA9IHRydWU7XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJCaW5kaW5nSWRlbnRpZmllclwiLCBuYW1lOiBpZGVudGlmaWVyIH0sIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VOYW1lZEltcG9ydHMoYm91bmROYW1lcykge1xuICAgIGxldCByZXN1bHQgPSBbXTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTEJSQUNFKTtcbiAgICB3aGlsZSAoIXRoaXMuZWF0KFRva2VuVHlwZS5SQlJBQ0UpKSB7XG4gICAgICByZXN1bHQucHVzaCh0aGlzLnBhcnNlSW1wb3J0U3BlY2lmaWVyKGJvdW5kTmFtZXMpKTtcbiAgICAgIGlmICghdGhpcy5lYXQoVG9rZW5UeXBlLkNPTU1BKSkge1xuICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUkJSQUNFKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBwYXJzZUZyb21DbGF1c2UoKSB7XG4gICAgdGhpcy5leHBlY3RDb250ZXh0dWFsS2V5d29yZChcImZyb21cIik7XG4gICAgbGV0IHZhbHVlID0gdGhpcy5leHBlY3QoVG9rZW5UeXBlLlNUUklORykuX3ZhbHVlO1xuICAgIHRoaXMuY29uc3VtZVNlbWljb2xvbigpO1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIHBhcnNlSW1wb3J0RGVjbGFyYXRpb24oKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCksIGRlZmF1bHRCaW5kaW5nID0gbnVsbCwgbW9kdWxlU3BlY2lmaWVyLCBib3VuZE5hbWVzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuSU1QT1JUKTtcbiAgICBzd2l0Y2ggKHRoaXMubG9va2FoZWFkLnR5cGUpIHtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlNUUklORzpcbiAgICAgICAgbW9kdWxlU3BlY2lmaWVyID0gdGhpcy5sZXgoKS5fdmFsdWU7XG4gICAgICAgIHRoaXMuY29uc3VtZVNlbWljb2xvbigpO1xuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkltcG9ydChudWxsLCBbXSwgbW9kdWxlU3BlY2lmaWVyKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICBjYXNlIFRva2VuVHlwZS5JREVOVElGSUVSOlxuICAgICAgICBkZWZhdWx0QmluZGluZyA9IHRoaXMuZXhwZWN0KFRva2VuVHlwZS5JREVOVElGSUVSKS52YWx1ZTtcbiAgICAgICAgYm91bmROYW1lc1tcIiRcIiArIGRlZmF1bHRCaW5kaW5nXSA9IHRydWU7XG4gICAgICAgIGlmICghdGhpcy5lYXQoVG9rZW5UeXBlLkNPTU1BKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuSW1wb3J0KGRlZmF1bHRCaW5kaW5nLCBbXSwgdGhpcy5wYXJzZUZyb21DbGF1c2UoKSksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuTVVMKSkge1xuICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5JbXBvcnROYW1lc3BhY2UoZGVmYXVsdEJpbmRpbmcsIHRoaXMucGFyc2VOYW1lU3BhY2VCaW5kaW5nKGJvdW5kTmFtZXMpLCB0aGlzLnBhcnNlRnJvbUNsYXVzZSgpKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgfSBlbHNlIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5MQlJBQ0UpKSB7XG4gICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkltcG9ydChkZWZhdWx0QmluZGluZywgdGhpcy5wYXJzZU5hbWVkSW1wb3J0cyhib3VuZE5hbWVzKSwgdGhpcy5wYXJzZUZyb21DbGF1c2UoKSksIHN0YXJ0TG9jYXRpb24pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuICAgIH1cbiAgfVxuXG4gIHBhcnNlRXhwb3J0U3BlY2lmaWVyKGV4cG9ydGVkTmFtZXMsIGV4cG9ydGVkQmluZGluZ3MpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgbmFtZSA9IHRoaXMucGFyc2VJZGVudGlmaWVyKCk7XG4gICAgZXhwb3J0ZWRCaW5kaW5nc1tcIiRcIiArIG5hbWVdID0gdHJ1ZTtcbiAgICBpZiAodGhpcy5lYXRDb250ZXh0dWFsS2V5d29yZChcImFzXCIpKSB7XG4gICAgICBsZXQgZXhwb3J0ZWROYW1lID0gdGhpcy5wYXJzZUlkZW50aWZpZXJOYW1lKCk7XG4gICAgICBpZiAoe30uaGFzT3duUHJvcGVydHkuY2FsbChleHBvcnRlZE5hbWVzLCBcIiRcIiArIGV4cG9ydGVkTmFtZSkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLkRVUExJQ0FURV9FWFBPUlRFRF9OQU1FLCBleHBvcnRlZE5hbWUpO1xuICAgICAgfVxuICAgICAgZXhwb3J0ZWROYW1lc1tcIiRcIiArIGV4cG9ydGVkTmFtZV0gPSB0cnVlO1xuICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5FeHBvcnRTcGVjaWZpZXIobmFtZSwgZXhwb3J0ZWROYW1lKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGV4cG9ydGVkTmFtZXMsIFwiJFwiICsgbmFtZSkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLkRVUExJQ0FURV9FWFBPUlRFRF9OQU1FLCBuYW1lKTtcbiAgICAgIH1cbiAgICAgIGV4cG9ydGVkTmFtZXNbXCIkXCIgKyBuYW1lXSA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuRXhwb3J0U3BlY2lmaWVyKG51bGwsIG5hbWUpLCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlRXhwb3J0Q2xhdXNlKGV4cG9ydGVkTmFtZXMsIGV4cG9ydGVkQmluZGluZ3MpIHtcbiAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxCUkFDRSk7XG4gICAgd2hpbGUgKCF0aGlzLmVhdChUb2tlblR5cGUuUkJSQUNFKSkge1xuICAgICAgcmVzdWx0LnB1c2godGhpcy5wYXJzZUV4cG9ydFNwZWNpZmllcihleHBvcnRlZE5hbWVzLCBleHBvcnRlZEJpbmRpbmdzKSk7XG4gICAgICBpZiAoIXRoaXMuZWF0KFRva2VuVHlwZS5DT01NQSkpIHtcbiAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJCUkFDRSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgcGFyc2VFeHBvcnREZWNsYXJhdGlvbihleHBvcnRlZE5hbWVzLCBleHBvcnRlZEJpbmRpbmdzKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCksIGRlY2w7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkVYUE9SVCk7XG4gICAgbGV0IGlzVmFyID0gZmFsc2UsIGtleSwgb2xkTEROID0gdGhpcy5MRE4sIG9sZFZETiA9IHRoaXMuVkROO1xuICAgIHRoaXMuTEROID0gW107XG4gICAgdGhpcy5WRE4gPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIHN3aXRjaCAodGhpcy5sb29rYWhlYWQudHlwZSkge1xuICAgICAgY2FzZSBUb2tlblR5cGUuTVVMOlxuICAgICAgICB0aGlzLmxleCgpO1xuICAgICAgICAvLyBleHBvcnQgKiBGcm9tQ2xhdXNlIDtcbiAgICAgICAgZGVjbCA9IG5ldyBTaGlmdC5FeHBvcnRBbGxGcm9tKHRoaXMucGFyc2VGcm9tQ2xhdXNlKCkpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkxCUkFDRTpcbiAgICAgICAgLy8gZXhwb3J0IEV4cG9ydENsYXVzZSBGcm9tQ2xhdXNlIDtcbiAgICAgICAgLy8gZXhwb3J0IEV4cG9ydENsYXVzZSA7XG4gICAgICAgIGxldCBuYW1lZEV4cG9ydHMgPSB0aGlzLnBhcnNlRXhwb3J0Q2xhdXNlKGV4cG9ydGVkTmFtZXMsIGV4cG9ydGVkQmluZGluZ3MpO1xuICAgICAgICBsZXQgZnJvbUNsYXVzZSA9IG51bGw7XG4gICAgICAgIGlmICh0aGlzLm1hdGNoQ29udGV4dHVhbEtleXdvcmQoXCJmcm9tXCIpKSB7XG4gICAgICAgICAgZnJvbUNsYXVzZSA9IHRoaXMucGFyc2VGcm9tQ2xhdXNlKCk7XG4gICAgICAgIH1cbiAgICAgICAgZGVjbCA9IG5ldyBTaGlmdC5FeHBvcnRGcm9tKG5hbWVkRXhwb3J0cywgZnJvbUNsYXVzZSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBUb2tlblR5cGUuQ0xBU1M6XG4gICAgICAgIC8vIGV4cG9ydCBDbGFzc0RlY2xhcmF0aW9uXG4gICAgICAgIGRlY2wgPSBuZXcgU2hpZnQuRXhwb3J0KHRoaXMucGFyc2VDbGFzcyh7aXNFeHByOiBmYWxzZX0pKTtcbiAgICAgICAgaWYgKHt9Lmhhc093blByb3BlcnR5LmNhbGwoZXhwb3J0ZWROYW1lcywgXCIkXCIgKyBkZWNsLmRlY2xhcmF0aW9uLm5hbWUubmFtZSkpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuRFVQTElDQVRFX0VYUE9SVEVEX05BTUUsIGRlY2wuZGVjbGFyYXRpb24ubmFtZS5uYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBrZXkgPSBkZWNsLmRlY2xhcmF0aW9uLm5hbWUubmFtZTtcbiAgICAgICAgZXhwb3J0ZWROYW1lc1tcIiRcIiArIGtleV0gPSB0cnVlO1xuICAgICAgICBleHBvcnRlZEJpbmRpbmdzW1wiJFwiICsga2V5XSA9IHRydWU7XG4gICAgICAgIG9sZExETi5wdXNoKGtleSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBUb2tlblR5cGUuRlVOQ1RJT046XG4gICAgICAgIC8vIGV4cG9ydCBIb2lzdGFibGVEZWNsYXJhdGlvblxuICAgICAgICBkZWNsID0gbmV3IFNoaWZ0LkV4cG9ydCh0aGlzLnBhcnNlRnVuY3Rpb24oe2lzRXhwcjogZmFsc2UsIGlzVG9wTGV2ZWw6IHRydWV9KSk7XG4gICAgICAgIGlmICh7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGV4cG9ydGVkTmFtZXMsIFwiJFwiICsgZGVjbC5kZWNsYXJhdGlvbi5uYW1lLm5hbWUpKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLkRVUExJQ0FURV9FWFBPUlRFRF9OQU1FLCBkZWNsLmRlY2xhcmF0aW9uLm5hbWUubmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAga2V5ID0gZGVjbC5kZWNsYXJhdGlvbi5uYW1lLm5hbWU7XG4gICAgICAgIGV4cG9ydGVkTmFtZXNbXCIkXCIgKyBrZXldID0gdHJ1ZTtcbiAgICAgICAgZXhwb3J0ZWRCaW5kaW5nc1tcIiRcIiArIGtleV0gPSB0cnVlO1xuICAgICAgICBvbGRMRE4ucHVzaChrZXkpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkRFRkFVTFQ6XG4gICAgICAgIGlmICh7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGV4cG9ydGVkTmFtZXMsIFwiJGRlZmF1bHRcIikpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuRFVQTElDQVRFX0VYUE9SVEVEX05BTUUsIFwiZGVmYXVsdFwiKTtcbiAgICAgICAgfVxuICAgICAgICBleHBvcnRlZE5hbWVzLiRkZWZhdWx0ID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5sZXgoKTtcbiAgICAgICAgc3dpdGNoICh0aGlzLmxvb2thaGVhZC50eXBlKSB7XG4gICAgICAgICAgY2FzZSBUb2tlblR5cGUuRlVOQ1RJT046XG4gICAgICAgICAgICAvLyBleHBvcnQgZGVmYXVsdCBIb2lzdGFibGVEZWNsYXJhdGlvbltEZWZhdWx0XVxuICAgICAgICAgICAgZGVjbCA9IG5ldyBTaGlmdC5FeHBvcnREZWZhdWx0KHRoaXMucGFyc2VGdW5jdGlvbih7aXNFeHByOiBmYWxzZSwgaW5EZWZhdWx0OiB0cnVlLCBpc1RvcExldmVsOiB0cnVlfSkpO1xuICAgICAgICAgICAga2V5ID0gZGVjbC5ib2R5Lm5hbWUubmFtZTtcbiAgICAgICAgICAgIGlmIChrZXkgIT09IFwiKmRlZmF1bHQqXCIpIHtcbiAgICAgICAgICAgICAgZXhwb3J0ZWRCaW5kaW5nc1tcIiRcIiArIGtleV0gPSB0cnVlO1xuICAgICAgICAgICAgICBvbGRMRE4ucHVzaChrZXkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBUb2tlblR5cGUuQ0xBU1M6XG4gICAgICAgICAgICAvLyBleHBvcnQgZGVmYXVsdCBDbGFzc0RlY2xhcmF0aW9uW0RlZmF1bHRdXG4gICAgICAgICAgICBkZWNsID0gbmV3IFNoaWZ0LkV4cG9ydERlZmF1bHQodGhpcy5wYXJzZUNsYXNzKHtpc0V4cHI6IGZhbHNlLCBpbkRlZmF1bHQ6IHRydWV9KSk7XG4gICAgICAgICAgICBrZXkgPSBkZWNsLmJvZHkubmFtZS5uYW1lO1xuICAgICAgICAgICAgaWYgKGtleSAhPT0gXCIqZGVmYXVsdCpcIikge1xuICAgICAgICAgICAgICBleHBvcnRlZEJpbmRpbmdzW1wiJFwiICsga2V5XSA9IHRydWU7XG4gICAgICAgICAgICAgIG9sZExETi5wdXNoKGtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHtcbiAgICAgICAgICAgIC8vIGV4cG9ydCBkZWZhdWx0IFtsb29rYWhlYWQg4oiJIHtmdW5jdGlvbiwgY2xhc3N9XSBBc3NpZ25tZW50RXhwcmVzc2lvbltJbl0gO1xuICAgICAgICAgICAgZGVjbCA9IG5ldyBTaGlmdC5FeHBvcnREZWZhdWx0KHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlZBUjpcbiAgICAgICAgaXNWYXIgPSB0cnVlO1xuICAgICAgICAvLyBmYWxscyB0aHJvdWdoXG4gICAgICBjYXNlIFRva2VuVHlwZS5MRVQ6XG4gICAgICBjYXNlIFRva2VuVHlwZS5DT05TVDpcbiAgICAgICAgLy8gZXhwb3J0IExleGljYWxEZWNsYXJhdGlvblxuICAgICAge1xuICAgICAgICBsZXQgYm91bmROYW1lcyA9IFtdO1xuICAgICAgICBkZWNsID0gbmV3IFNoaWZ0LkV4cG9ydCh0aGlzLnBhcnNlVmFyaWFibGVEZWNsYXJhdGlvbih7Ym91bmROYW1lc30pKTtcbiAgICAgICAgYm91bmROYW1lcy5mb3JFYWNoKG5hbWUgPT4ge1xuICAgICAgICAgICAgaWYgKHt9Lmhhc093blByb3BlcnR5LmNhbGwoZXhwb3J0ZWROYW1lcywgXCIkXCIgKyBuYW1lKSkge1xuICAgICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuRFVQTElDQVRFX0VYUE9SVEVEX05BTUUsIG5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZXhwb3J0ZWROYW1lc1tcIiRcIiArIG5hbWVdID0gdHJ1ZTtcbiAgICAgICAgICAgIGV4cG9ydGVkQmluZGluZ3NbXCIkXCIgKyBuYW1lXSA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgICBpZiAoaXNWYXIpIHtcbiAgICAgICAgICBib3VuZE5hbWVzLmZvckVhY2gobmFtZSA9PiBvbGRWRE5bXCIkXCIgKyBuYW1lXSA9IHRydWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIFtdLnB1c2guYXBwbHkob2xkTEROLCBib3VuZE5hbWVzKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNvbnN1bWVTZW1pY29sb24oKTtcbiAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuICAgIH1cbiAgICB0aGlzLkxETiA9IG9sZExETjtcbiAgICB0aGlzLlZETiA9IG9sZFZETjtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24oZGVjbCwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZU1vZHVsZUl0ZW0oZXhwb3J0ZWROYW1lcywgZXhwb3J0ZWRCaW5kaW5ncykge1xuICAgIHN3aXRjaCAodGhpcy5sb29rYWhlYWQudHlwZSkge1xuICAgICAgY2FzZSBUb2tlblR5cGUuSU1QT1JUOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZUltcG9ydERlY2xhcmF0aW9uKCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5FWFBPUlQ6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlRXhwb3J0RGVjbGFyYXRpb24oZXhwb3J0ZWROYW1lcywgZXhwb3J0ZWRCaW5kaW5ncyk7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZVN0YXRlbWVudExpc3RJdGVtKCk7XG4gICAgfVxuICB9XG5cbiAgbG9va2FoZWFkTGV4aWNhbERlY2xhcmF0aW9uKCkge1xuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5MRVQpIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLkNPTlNUKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5JREVOVElGSUVSKSAmJiB0aGlzLmxvb2thaGVhZC52YWx1ZSA9PT0gXCJsZXRcIikge1xuICAgICAgbGV0IGxleGVyU3RhdGUgPSB0aGlzLnNhdmVMZXhlclN0YXRlKCk7XG4gICAgICB0aGlzLmxleCgpO1xuICAgICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLllJRUxEKSB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5JREVOVElGSUVSKSB8fFxuICAgICAgICB0aGlzLm1hdGNoKFRva2VuVHlwZS5MQlJBQ0UpIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLkxCUkFDSykpIHtcbiAgICAgICAgdGhpcy5yZXN0b3JlTGV4ZXJTdGF0ZShsZXhlclN0YXRlKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnJlc3RvcmVMZXhlclN0YXRlKGxleGVyU3RhdGUpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwYXJzZVN0YXRlbWVudExpc3RJdGVtKHtpc1RvcExldmVsID0gZmFsc2V9ID0ge30pIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBpZiAodGhpcy5lb2YoKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICB9XG5cbiAgICBsZXQgZGVjbCA9IHRoaXMud3JhcFZETigoKSA9PiB7XG4gICAgICBzd2l0Y2ggKHRoaXMubG9va2FoZWFkLnR5cGUpIHtcbiAgICAgICAgY2FzZSBUb2tlblR5cGUuRlVOQ1RJT046XG4gICAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VGdW5jdGlvbih7aXNFeHByOiBmYWxzZSwgaXNUb3BMZXZlbH0pO1xuICAgICAgICBjYXNlIFRva2VuVHlwZS5DTEFTUzpcbiAgICAgICAgICByZXR1cm4gdGhpcy5wYXJzZUNsYXNzKHtpc0V4cHI6IGZhbHNlfSk7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgaWYgKHRoaXMubG9va2FoZWFkTGV4aWNhbERlY2xhcmF0aW9uKCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcnNlVmFyaWFibGVEZWNsYXJhdGlvblN0YXRlbWVudCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdGhpcy5wYXJzZVN0YXRlbWVudCh7YWxsb3dMYWJlbGVkRnVuY3Rpb246IHRydWUsIGlzVG9wTGV2ZWx9KTtcbiAgICAgIH1cbiAgICB9LCB0aGlzLmNoZWNrQmxvY2tTY29wZSk7XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKGRlY2wsIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VTdGF0ZW1lbnQoe2FsbG93TGFiZWxlZEZ1bmN0aW9uID0gZmFsc2UsIGlzVG9wTGV2ZWwgPSBmYWxzZX0gPSB7fSkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCBvcmlnaW5hbExETiA9IHRoaXMuTEROO1xuICAgIHRoaXMuTEROID0gW107XG4gICAgdmFyIHN0bXQgPSB0aGlzLndyYXBWRE4oKCkgPT4gdGhpcy5wYXJzZVN0YXRlbWVudEhlbHBlcihhbGxvd0xhYmVsZWRGdW5jdGlvbiwgb3JpZ2luYWxMRE4sIGlzVG9wTGV2ZWwpKTtcbiAgICB0aGlzLkxETiA9IG9yaWdpbmFsTEROO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihzdG10LCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlU3RhdGVtZW50SGVscGVyKGFsbG93TGFiZWxlZEZ1bmN0aW9uLCBvcmlnaW5hbExETiwgaXNUb3BMZXZlbCkge1xuICAgIGlmICh0aGlzLmVvZigpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuICAgIH1cblxuICAgIHN3aXRjaCAodGhpcy5sb29rYWhlYWQudHlwZSkge1xuICAgICAgY2FzZSBUb2tlblR5cGUuU0VNSUNPTE9OOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZUVtcHR5U3RhdGVtZW50KCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5MQlJBQ0U6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlQmxvY2tTdGF0ZW1lbnQoKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkxQQVJFTjpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VFeHByZXNzaW9uU3RhdGVtZW50KCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5CUkVBSzpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VCcmVha1N0YXRlbWVudCgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuQ09OVElOVUU6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlQ29udGludWVTdGF0ZW1lbnQoKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkRFQlVHR0VSOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZURlYnVnZ2VyU3RhdGVtZW50KCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5ETzpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VEb1doaWxlU3RhdGVtZW50KCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5GT1I6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlRm9yU3RhdGVtZW50KCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5JRjpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VJZlN0YXRlbWVudCgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuUkVUVVJOOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZVJldHVyblN0YXRlbWVudCgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuU1dJVENIOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZVN3aXRjaFN0YXRlbWVudCgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuVEhST1c6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlVGhyb3dTdGF0ZW1lbnQoKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlRSWTpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VUcnlTdGF0ZW1lbnQoKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlZBUjpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VWYXJpYWJsZURlY2xhcmF0aW9uU3RhdGVtZW50KCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5XSElMRTpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VXaGlsZVN0YXRlbWVudCgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuV0lUSDpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VXaXRoU3RhdGVtZW50KCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5GVU5DVElPTjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkNMQVNTOlxuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuXG4gICAgICBkZWZhdWx0OiB7XG4gICAgICAgIGlmICh0aGlzLmxvb2thaGVhZExleGljYWxEZWNsYXJhdGlvbigpKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgZXhwciA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICAgIC8vIDEyLjEyIExhYmVsbGVkIFN0YXRlbWVudHM7XG4gICAgICAgIGlmIChleHByLnR5cGUgPT09IFwiSWRlbnRpZmllckV4cHJlc3Npb25cIiAmJiB0aGlzLmVhdChUb2tlblR5cGUuQ09MT04pKSB7XG4gICAgICAgICAgbGV0IGtleSA9IFwiJFwiICsgZXhwci5uYW1lO1xuICAgICAgICAgIGlmICh7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRoaXMubGFiZWxTZXQsIGtleSkpIHtcbiAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5MQUJFTF9SRURFQ0xBUkFUSU9OLCBleHByLm5hbWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLkxETiA9IG9yaWdpbmFsTEROO1xuICAgICAgICAgIHRoaXMubGFiZWxTZXRba2V5XSA9IHRydWU7XG4gICAgICAgICAgbGV0IGxhYmVsZWRCb2R5O1xuICAgICAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5GVU5DVElPTikpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnN0cmljdCB8fCAhYWxsb3dMYWJlbGVkRnVuY3Rpb24pIHtcbiAgICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxhYmVsZWRCb2R5ID0gdGhpcy5wYXJzZUZ1bmN0aW9uKHtpc0V4cHI6IGZhbHNlLCBhbGxvd0dlbmVyYXRvcjogZmFsc2UsIGlzVG9wTGV2ZWx9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGFiZWxlZEJvZHkgPSB0aGlzLnBhcnNlU3RhdGVtZW50KHthbGxvd0xhYmVsZWRGdW5jdGlvbiwgaXNUb3BMZXZlbH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBkZWxldGUgdGhpcy5sYWJlbFNldFtrZXldO1xuICAgICAgICAgIHJldHVybiBuZXcgU2hpZnQuTGFiZWxlZFN0YXRlbWVudChleHByLm5hbWUsIGxhYmVsZWRCb2R5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmNvbnN1bWVTZW1pY29sb24oKTtcbiAgICAgICAgICByZXR1cm4gbmV3IFNoaWZ0LkV4cHJlc3Npb25TdGF0ZW1lbnQoZXhwcik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwYXJzZUVtcHR5U3RhdGVtZW50KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5TRU1JQ09MT04pO1xuICAgIHJldHVybiBuZXcgU2hpZnQuRW1wdHlTdGF0ZW1lbnQ7XG4gIH1cblxuICBwYXJzZUJsb2NrU3RhdGVtZW50KCkge1xuICAgIGxldCBzdG10ID0gbmV3IFNoaWZ0LkJsb2NrU3RhdGVtZW50KHRoaXMucGFyc2VCbG9jaygpKTtcbiAgICB0aGlzLmNoZWNrQmxvY2tTY29wZSgpO1xuICAgIHJldHVybiBzdG10O1xuICB9XG5cbiAgcGFyc2VFeHByZXNzaW9uU3RhdGVtZW50KCkge1xuICAgIGxldCBleHByID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICB0aGlzLmNvbnN1bWVTZW1pY29sb24oKTtcbiAgICByZXR1cm4gbmV3IFNoaWZ0LkV4cHJlc3Npb25TdGF0ZW1lbnQoZXhwcik7XG4gIH1cblxuICBwYXJzZUJyZWFrU3RhdGVtZW50KCkge1xuICAgIGxldCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5CUkVBSyk7XG5cbiAgICAvLyBDYXRjaCB0aGUgdmVyeSBjb21tb24gY2FzZSBmaXJzdDogaW1tZWRpYXRlbHkgYSBzZW1pY29sb24gKFUrMDAzQikuXG4gICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5TRU1JQ09MT04pKSB7XG4gICAgICBpZiAoISh0aGlzLmluSXRlcmF0aW9uIHx8IHRoaXMuaW5Td2l0Y2gpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuSUxMRUdBTF9CUkVBSyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuZXcgU2hpZnQuQnJlYWtTdGF0ZW1lbnQobnVsbCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0KSB7XG4gICAgICBpZiAoISh0aGlzLmluSXRlcmF0aW9uIHx8IHRoaXMuaW5Td2l0Y2gpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuSUxMRUdBTF9CUkVBSyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuZXcgU2hpZnQuQnJlYWtTdGF0ZW1lbnQobnVsbCk7XG4gICAgfVxuXG4gICAgbGV0IGxhYmVsID0gbnVsbDtcbiAgICBpZiAodGhpcy5sb29rYWhlYWQudHlwZSA9PT0gVG9rZW5UeXBlLklERU5USUZJRVIpIHtcbiAgICAgIGxhYmVsID0gdGhpcy5wYXJzZUlkZW50aWZpZXIoKTtcblxuICAgICAgbGV0IGtleSA9IFwiJFwiICsgbGFiZWw7XG4gICAgICBpZiAoIXt9Lmhhc093blByb3BlcnR5LmNhbGwodGhpcy5sYWJlbFNldCwga2V5KSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5LTk9XTl9MQUJFTCwgbGFiZWwpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuY29uc3VtZVNlbWljb2xvbigpO1xuXG4gICAgaWYgKGxhYmVsID09IG51bGwgJiYgISh0aGlzLmluSXRlcmF0aW9uIHx8IHRoaXMuaW5Td2l0Y2gpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLklMTEVHQUxfQlJFQUspO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgU2hpZnQuQnJlYWtTdGF0ZW1lbnQobGFiZWwpO1xuICB9XG5cbiAgcGFyc2VDb250aW51ZVN0YXRlbWVudCgpIHtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuQ09OVElOVUUpO1xuXG4gICAgLy8gQ2F0Y2ggdGhlIHZlcnkgY29tbW9uIGNhc2UgZmlyc3Q6IGltbWVkaWF0ZWx5IGEgc2VtaWNvbG9uIChVKzAwM0IpLlxuICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuU0VNSUNPTE9OKSkge1xuICAgICAgaWYgKCF0aGlzLmluSXRlcmF0aW9uKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuSUxMRUdBTF9DT05USU5VRSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuZXcgU2hpZnQuQ29udGludWVTdGF0ZW1lbnQobnVsbCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0KSB7XG4gICAgICBpZiAoIXRoaXMuaW5JdGVyYXRpb24pIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5JTExFR0FMX0NPTlRJTlVFKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5ldyBTaGlmdC5Db250aW51ZVN0YXRlbWVudChudWxsKTtcbiAgICB9XG5cbiAgICBsZXQgbGFiZWwgPSBudWxsO1xuICAgIGlmICh0aGlzLmxvb2thaGVhZC50eXBlID09PSBUb2tlblR5cGUuSURFTlRJRklFUikge1xuICAgICAgbGFiZWwgPSB0aGlzLnBhcnNlSWRlbnRpZmllcigpO1xuXG4gICAgICBsZXQga2V5ID0gXCIkXCIgKyBsYWJlbDtcbiAgICAgIGlmICghe30uaGFzT3duUHJvcGVydHkuY2FsbCh0aGlzLmxhYmVsU2V0LCBrZXkpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTktOT1dOX0xBQkVMLCBsYWJlbCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5jb25zdW1lU2VtaWNvbG9uKCk7XG4gICAgaWYgKCF0aGlzLmluSXRlcmF0aW9uKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLklMTEVHQUxfQ09OVElOVUUpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgU2hpZnQuQ29udGludWVTdGF0ZW1lbnQobGFiZWwpO1xuICB9XG5cblxuICBwYXJzZURlYnVnZ2VyU3RhdGVtZW50KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5ERUJVR0dFUik7XG4gICAgdGhpcy5jb25zdW1lU2VtaWNvbG9uKCk7XG4gICAgcmV0dXJuIG5ldyBTaGlmdC5EZWJ1Z2dlclN0YXRlbWVudDtcbiAgfVxuXG4gIHBhcnNlRG9XaGlsZVN0YXRlbWVudCgpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuRE8pO1xuICAgIGxldCBvbGRJbkl0ZXJhdGlvbiA9IHRoaXMuaW5JdGVyYXRpb247XG4gICAgdGhpcy5pbkl0ZXJhdGlvbiA9IHRydWU7XG4gICAgbGV0IGJvZHkgPSB0aGlzLnBhcnNlU3RhdGVtZW50KCk7XG4gICAgdGhpcy5pbkl0ZXJhdGlvbiA9IG9sZEluSXRlcmF0aW9uO1xuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLldISUxFKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTFBBUkVOKTtcbiAgICBsZXQgdGVzdCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJQQVJFTik7XG4gICAgdGhpcy5lYXQoVG9rZW5UeXBlLlNFTUlDT0xPTik7XG5cbiAgICByZXR1cm4gbmV3IFNoaWZ0LkRvV2hpbGVTdGF0ZW1lbnQoYm9keSwgdGVzdCk7XG4gIH1cblxuICBzdGF0aWMgdHJhbnNmb3JtRGVzdHJ1Y3R1cmluZyhub2RlKSB7XG4gICAgc3dpdGNoIChub2RlLnR5cGUpIHtcbiAgICAgIGNhc2UgXCJPYmplY3RFeHByZXNzaW9uXCI6XG4gICAgICAgIHJldHVybiBjb3B5TG9jYXRpb24obm9kZSwgbmV3IFNoaWZ0Lk9iamVjdEJpbmRpbmcoXG4gICAgICAgICAgbm9kZS5wcm9wZXJ0aWVzLm1hcChQYXJzZXIudHJhbnNmb3JtRGVzdHJ1Y3R1cmluZylcbiAgICAgICAgKSk7XG4gICAgICBjYXNlIFwiRGF0YVByb3BlcnR5XCI6XG4gICAgICAgIHJldHVybiBjb3B5TG9jYXRpb24obm9kZSwgbmV3IFNoaWZ0LkJpbmRpbmdQcm9wZXJ0eVByb3BlcnR5KFxuICAgICAgICAgIG5vZGUubmFtZSxcbiAgICAgICAgICBQYXJzZXIudHJhbnNmb3JtRGVzdHJ1Y3R1cmluZyhub2RlLmV4cHJlc3Npb24pXG4gICAgICAgICkpO1xuICAgICAgY2FzZSBcIlNob3J0aGFuZFByb3BlcnR5XCI6XG4gICAgICAgIHJldHVybiBjb3B5TG9jYXRpb24obm9kZSwgeyB0eXBlOiBcIkJpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXJcIixcbiAgICAgICAgICBiaW5kaW5nOiBjb3B5TG9jYXRpb24obm9kZSwgeyB0eXBlOiBcIkJpbmRpbmdJZGVudGlmaWVyXCIsIG5hbWU6IG5vZGUubmFtZSB9KSxcbiAgICAgICAgICBpbml0OiBudWxsLFxuICAgICAgICB9KTtcbiAgICAgIGNhc2UgXCJBcnJheUV4cHJlc3Npb25cIjpcbiAgICAgICAgbGV0IGxhc3QgPSBub2RlLmVsZW1lbnRzW25vZGUuZWxlbWVudHMubGVuZ3RoIC0gMV07XG4gICAgICAgIGlmIChsYXN0ICE9IG51bGwgJiYgbGFzdC50eXBlID09PSBcIlNwcmVhZEVsZW1lbnRcIikge1xuICAgICAgICAgIHJldHVybiBjb3B5TG9jYXRpb24obm9kZSwgbmV3IFNoaWZ0LkFycmF5QmluZGluZyhcbiAgICAgICAgICAgIG5vZGUuZWxlbWVudHMuc2xpY2UoMCwgLTEpLm1hcChlID0+IGUgJiYgUGFyc2VyLnRyYW5zZm9ybURlc3RydWN0dXJpbmcoZSkpLFxuICAgICAgICAgICAgY29weUxvY2F0aW9uKGxhc3QuZXhwcmVzc2lvbiwgUGFyc2VyLnRyYW5zZm9ybURlc3RydWN0dXJpbmcobGFzdC5leHByZXNzaW9uKSlcbiAgICAgICAgICApKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gY29weUxvY2F0aW9uKG5vZGUsIG5ldyBTaGlmdC5BcnJheUJpbmRpbmcoXG4gICAgICAgICAgICBub2RlLmVsZW1lbnRzLm1hcChlID0+IGUgJiYgUGFyc2VyLnRyYW5zZm9ybURlc3RydWN0dXJpbmcoZSkpLFxuICAgICAgICAgICAgbnVsbFxuICAgICAgICAgICkpO1xuICAgICAgICB9XG4gICAgICBjYXNlIFwiQXNzaWdubWVudEV4cHJlc3Npb25cIjpcbiAgICAgICAgcmV0dXJuIGNvcHlMb2NhdGlvbihub2RlLCBuZXcgU2hpZnQuQmluZGluZ1dpdGhEZWZhdWx0KFxuICAgICAgICAgIFBhcnNlci50cmFuc2Zvcm1EZXN0cnVjdHVyaW5nKG5vZGUuYmluZGluZyksXG4gICAgICAgICAgbm9kZS5leHByZXNzaW9uXG4gICAgICAgICkpO1xuICAgICAgY2FzZSBcIklkZW50aWZpZXJFeHByZXNzaW9uXCI6XG4gICAgICAgIHJldHVybiBjb3B5TG9jYXRpb24obm9kZSwgeyB0eXBlOiBcIkJpbmRpbmdJZGVudGlmaWVyXCIsIG5hbWU6IG5vZGUubmFtZSB9KTtcbiAgICB9XG4gICAgcmV0dXJuIG5vZGU7XG4gIH1cblxuICBzdGF0aWMgaXNEZXN0cnVjdHVyaW5nVGFyZ2V0KG5vZGUsIHtpc0Fzc2lnbm1lbnR9KSB7XG4gICAgc3dpdGNoIChub2RlLnR5cGUpIHtcbiAgICAgIGNhc2UgXCJPYmplY3RFeHByZXNzaW9uXCI6XG4gICAgICAgIHJldHVybiBub2RlLnByb3BlcnRpZXMuZXZlcnkocCA9PlxuICAgICAgICAgIHAudHlwZSA9PT0gXCJCaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyXCIgfHxcbiAgICAgICAgICBwLnR5cGUgPT09IFwiU2hvcnRoYW5kUHJvcGVydHlcIiB8fFxuICAgICAgICAgIHAudHlwZSA9PT0gXCJEYXRhUHJvcGVydHlcIiAmJlxuICAgICAgICAgIFBhcnNlci5pc0Rlc3RydWN0dXJpbmdUYXJnZXRXaXRoRGVmYXVsdChwLmV4cHJlc3Npb24sIHtpc0Fzc2lnbm1lbnR9KVxuICAgICAgICApO1xuICAgICAgY2FzZSBcIkFycmF5RXhwcmVzc2lvblwiOlxuICAgICAgICBpZiAobm9kZS5lbGVtZW50cy5sZW5ndGggPT09IDApIHJldHVybiBmYWxzZTtcbiAgICAgICAgaWYgKCFub2RlLmVsZW1lbnRzLnNsaWNlKDAsIC0xKVxuICAgICAgICAgICAgLmZpbHRlcihlID0+IGUgIT0gbnVsbClcbiAgICAgICAgICAgIC5ldmVyeShlID0+IFBhcnNlci5pc0Rlc3RydWN0dXJpbmdUYXJnZXRXaXRoRGVmYXVsdChlLCB7aXNBc3NpZ25tZW50fSkpKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGxldCBsYXN0ID0gbm9kZS5lbGVtZW50c1tub2RlLmVsZW1lbnRzLmxlbmd0aCAtIDFdO1xuICAgICAgICByZXR1cm4gbGFzdCA9PSBudWxsIHx8XG4gICAgICAgICAgbGFzdC50eXBlID09PSBcIlNwcmVhZEVsZW1lbnRcIiAmJiBQYXJzZXIuaXNEZXN0cnVjdHVyaW5nVGFyZ2V0KGxhc3QuZXhwcmVzc2lvbiwge2lzQXNzaWdubWVudH0pIHx8XG4gICAgICAgICAgUGFyc2VyLmlzRGVzdHJ1Y3R1cmluZ1RhcmdldFdpdGhEZWZhdWx0KGxhc3QsIHtpc0Fzc2lnbm1lbnR9KTtcbiAgICAgIGNhc2UgXCJBcnJheUJpbmRpbmdcIjpcbiAgICAgIGNhc2UgXCJCaW5kaW5nSWRlbnRpZmllclwiOlxuICAgICAgY2FzZSBcIkJpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXJcIjpcbiAgICAgIGNhc2UgXCJCaW5kaW5nUHJvcGVydHlQcm9wZXJ0eVwiOlxuICAgICAgY2FzZSBcIkJpbmRpbmdXaXRoRGVmYXVsdFwiOlxuICAgICAgY2FzZSBcIklkZW50aWZpZXJFeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiT2JqZWN0QmluZGluZ1wiOlxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIGNhc2UgXCJDb21wdXRlZE1lbWJlckV4cHJlc3Npb25cIjpcbiAgICAgIGNhc2UgXCJTdGF0aWNNZW1iZXJFeHByZXNzaW9uXCI6XG4gICAgICAgIHJldHVybiBpc0Fzc2lnbm1lbnQ7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHN0YXRpYyBpc0Rlc3RydWN0dXJpbmdUYXJnZXRXaXRoRGVmYXVsdChub2RlLCB7aXNBc3NpZ25tZW50fSkge1xuICAgIHJldHVybiBub2RlLnR5cGUgPT09IFwiQXNzaWdubWVudEV4cHJlc3Npb25cIiAmJiBub2RlLm9wZXJhdG9yID09PSBcIj1cIiA/XG4gICAgICBQYXJzZXIuaXNEZXN0cnVjdHVyaW5nVGFyZ2V0KG5vZGUuYmluZGluZywge2lzQXNzaWdubWVudH0pIDpcbiAgICAgIFBhcnNlci5pc0Rlc3RydWN0dXJpbmdUYXJnZXQobm9kZSwge2lzQXNzaWdubWVudH0pO1xuICB9XG5cbiAgc3RhdGljIGlzVmFsaWRTaW1wbGVBc3NpZ25tZW50VGFyZ2V0KG5vZGUpIHtcbiAgICBzd2l0Y2ggKG5vZGUudHlwZSkge1xuICAgICAgY2FzZSBcIklkZW50aWZpZXJFeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiQ29tcHV0ZWRNZW1iZXJFeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiU3RhdGljTWVtYmVyRXhwcmVzc2lvblwiOlxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgc3RhdGljIGJvdW5kTmFtZXMobm9kZSkge1xuICAgIHN3aXRjaCAobm9kZS50eXBlKSB7XG4gICAgICBjYXNlIFwiQmluZGluZ0lkZW50aWZpZXJcIjpcbiAgICAgICAgcmV0dXJuIFtub2RlLm5hbWVdO1xuICAgICAgY2FzZSBcIkJpbmRpbmdXaXRoRGVmYXVsdFwiOlxuICAgICAgICByZXR1cm4gUGFyc2VyLmJvdW5kTmFtZXMobm9kZS5iaW5kaW5nKTtcbiAgICAgIGNhc2UgXCJBcnJheUJpbmRpbmdcIjoge1xuICAgICAgICBsZXQgbmFtZXMgPSBbXTtcbiAgICAgICAgbm9kZS5lbGVtZW50cy5maWx0ZXIoZSA9PiBlICE9IG51bGwpLmZvckVhY2goZSA9PiBbXS5wdXNoLmFwcGx5KG5hbWVzLCBQYXJzZXIuYm91bmROYW1lcyhlKSkpO1xuICAgICAgICBpZiAobm9kZS5yZXN0RWxlbWVudCAhPSBudWxsKSB7XG4gICAgICAgICAgW10ucHVzaC5hcHBseShuYW1lcywgUGFyc2VyLmJvdW5kTmFtZXMobm9kZS5yZXN0RWxlbWVudCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuYW1lcztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJPYmplY3RCaW5kaW5nXCI6IHtcbiAgICAgICAgbGV0IG5hbWVzID0gW107XG4gICAgICAgIG5vZGUucHJvcGVydGllcy5mb3JFYWNoKHAgPT4ge1xuICAgICAgICAgIHN3aXRjaCAocC50eXBlKSB7XG4gICAgICAgICAgICBjYXNlIFwiQmluZGluZ1Byb3BlcnR5SWRlbnRpZmllclwiOlxuICAgICAgICAgICAgICBuYW1lcy5wdXNoKHAuYmluZGluZy5uYW1lKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiQmluZGluZ1Byb3BlcnR5UHJvcGVydHlcIjpcbiAgICAgICAgICAgICAgW10ucHVzaC5hcHBseShuYW1lcywgUGFyc2VyLmJvdW5kTmFtZXMocC5iaW5kaW5nKSk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgLy8gaXN0YW5idWwgaWdub3JlIG5leHRcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImJvdW5kTmFtZXMgY2FsbGVkIG9uIE9iamVjdEJpbmRpbmcgd2l0aCBpbnZhbGlkIHByb3BlcnR5OiBcIiArIHAudHlwZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG5hbWVzO1xuICAgICAgfVxuICAgICAgY2FzZSBcIkNvbXB1dGVkTWVtYmVyRXhwcmVzc2lvblwiOlxuICAgICAgY2FzZSBcIlN0YXRpY01lbWJlckV4cHJlc3Npb25cIjpcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICAvLyBpc3RhbmJ1bCBpZ25vcmUgbmV4dFxuICAgIHRocm93IG5ldyBFcnJvcihcImJvdW5kTmFtZXMgY2FsbGVkIG9uIGludmFsaWQgYXNzaWdubWVudCB0YXJnZXQ6IFwiICsgbm9kZS50eXBlKTtcbiAgfVxuXG4gIHBhcnNlRm9yU3RhdGVtZW50KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5GT1IpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MUEFSRU4pO1xuICAgIGxldCB0ZXN0ID0gbnVsbDtcbiAgICBsZXQgcmlnaHQgPSBudWxsO1xuICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuU0VNSUNPTE9OKSkge1xuICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5TRU1JQ09MT04pKSB7XG4gICAgICAgIHRlc3QgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgfVxuICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlNFTUlDT0xPTik7XG4gICAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJQQVJFTikpIHtcbiAgICAgICAgcmlnaHQgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBTaGlmdC5Gb3JTdGF0ZW1lbnQoXG4gICAgICAgICAgbnVsbCxcbiAgICAgICAgICB0ZXN0LFxuICAgICAgICAgIHJpZ2h0LFxuICAgICAgICAgIHRoaXMuZ2V0SXRlcmF0b3JTdGF0ZW1lbnRFcGlsb2d1ZSgpXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgc3RhcnRzV2l0aExldCA9IHRoaXMubWF0Y2goVG9rZW5UeXBlLkxFVCkgfHwgdGhpcy5tYXRjaChUb2tlblR5cGUuSURFTlRJRklFUikgJiYgdGhpcy5sb29rYWhlYWQudmFsdWUgPT09IFwibGV0XCI7XG4gICAgICBsZXQgaXNGb3JEZWNsID0gdGhpcy5sb29rYWhlYWRMZXhpY2FsRGVjbGFyYXRpb24oKTtcbiAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5WQVIpIHx8IGlzRm9yRGVjbCkge1xuICAgICAgICBsZXQgcHJldmlvdXNBbGxvd0luID0gdGhpcy5hbGxvd0luO1xuICAgICAgICB0aGlzLmFsbG93SW4gPSBmYWxzZTtcbiAgICAgICAgbGV0IGluaXREZWNsID0gdGhpcy5wYXJzZVZhcmlhYmxlRGVjbGFyYXRpb24oe2luRm9yOiB0cnVlfSk7XG4gICAgICAgIHRoaXMuYWxsb3dJbiA9IHByZXZpb3VzQWxsb3dJbjtcblxuICAgICAgICBpZiAoaW5pdERlY2wuZGVjbGFyYXRvcnMubGVuZ3RoID09PSAxICYmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5JTikgfHwgdGhpcy5tYXRjaChUb2tlblR5cGUuT0YpKSkge1xuICAgICAgICAgIGxldCBDdG9yO1xuXG4gICAgICAgICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLklOKSkge1xuICAgICAgICAgICAgaWYgKGluaXREZWNsLmRlY2xhcmF0b3JzWzBdLmluaXQgIT0gbnVsbCkge1xuICAgICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuSU5WQUxJRF9WQVJfSU5JVF9GT1JfSU4pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgQ3RvciA9IFNoaWZ0LkZvckluU3RhdGVtZW50O1xuICAgICAgICAgICAgdGhpcy5sZXgoKTtcbiAgICAgICAgICAgIHJpZ2h0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKGluaXREZWNsLmRlY2xhcmF0b3JzWzBdLmluaXQgIT0gbnVsbCkge1xuICAgICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuSU5WQUxJRF9WQVJfSU5JVF9GT1JfT0YpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgQ3RvciA9IFNoaWZ0LkZvck9mU3RhdGVtZW50O1xuICAgICAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMuVkROKSB7XG4gICAgICAgICAgICAgIHRoaXMuVkROW2tleV0gPSBGT1JfT0ZfVkFSO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmxleCgpO1xuICAgICAgICAgICAgcmlnaHQgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsZXQgZXBpbG9ndWUgPSB0aGlzLndyYXBWRE4odGhpcy5nZXRJdGVyYXRvclN0YXRlbWVudEVwaWxvZ3VlLCBpc0ZvckRlY2wgJiYgdGhpcy5jaGVja0Jsb2NrU2NvcGUpO1xuXG4gICAgICAgICAgcmV0dXJuIG5ldyBDdG9yKGluaXREZWNsLCByaWdodCwgZXBpbG9ndWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5TRU1JQ09MT04pO1xuICAgICAgICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuU0VNSUNPTE9OKSkge1xuICAgICAgICAgICAgdGVzdCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5TRU1JQ09MT04pO1xuICAgICAgICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuUlBBUkVOKSkge1xuICAgICAgICAgICAgcmlnaHQgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gbmV3IFNoaWZ0LkZvclN0YXRlbWVudChpbml0RGVjbCwgdGVzdCwgcmlnaHQsIHRoaXMud3JhcFZETih0aGlzLmdldEl0ZXJhdG9yU3RhdGVtZW50RXBpbG9ndWUsIGlzRm9yRGVjbCAmJiB0aGlzLmNoZWNrQmxvY2tTY29wZSkpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsZXQgcHJldmlvdXNBbGxvd0luID0gdGhpcy5hbGxvd0luO1xuICAgICAgICB0aGlzLmFsbG93SW4gPSBmYWxzZTtcbiAgICAgICAgbGV0IGluaXQgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgICB0aGlzLmFsbG93SW4gPSBwcmV2aW91c0FsbG93SW47XG5cbiAgICAgICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLklOKSB8fCAhc3RhcnRzV2l0aExldCAmJiB0aGlzLm1hdGNoKFRva2VuVHlwZS5PRikpIHtcbiAgICAgICAgICBpZiAoIVBhcnNlci5pc1ZhbGlkU2ltcGxlQXNzaWdubWVudFRhcmdldChpbml0KSkge1xuICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLklOVkFMSURfTEhTX0lOX0ZPUl9JTik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGV0IEN0b3IgPSB0aGlzLm1hdGNoKFRva2VuVHlwZS5JTikgPyBTaGlmdC5Gb3JJblN0YXRlbWVudCA6IFNoaWZ0LkZvck9mU3RhdGVtZW50O1xuXG4gICAgICAgICAgdGhpcy5sZXgoKTtcbiAgICAgICAgICByaWdodCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG5cbiAgICAgICAgICByZXR1cm4gbmV3IEN0b3IoaW5pdCwgcmlnaHQsIHRoaXMuZ2V0SXRlcmF0b3JTdGF0ZW1lbnRFcGlsb2d1ZSgpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuU0VNSUNPTE9OKTtcbiAgICAgICAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlNFTUlDT0xPTikpIHtcbiAgICAgICAgICAgIHRlc3QgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuU0VNSUNPTE9OKTtcbiAgICAgICAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJQQVJFTikpIHtcbiAgICAgICAgICAgIHJpZ2h0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIG5ldyBTaGlmdC5Gb3JTdGF0ZW1lbnQoaW5pdCwgdGVzdCwgcmlnaHQsIHRoaXMuZ2V0SXRlcmF0b3JTdGF0ZW1lbnRFcGlsb2d1ZSgpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGdldEl0ZXJhdG9yU3RhdGVtZW50RXBpbG9ndWUoKSB7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJQQVJFTik7XG4gICAgbGV0IG9sZEluSXRlcmF0aW9uID0gdGhpcy5pbkl0ZXJhdGlvbjtcbiAgICB0aGlzLmluSXRlcmF0aW9uID0gdHJ1ZTtcbiAgICBsZXQgYm9keSA9IHRoaXMucGFyc2VTdGF0ZW1lbnQoKTtcbiAgICB0aGlzLmluSXRlcmF0aW9uID0gb2xkSW5JdGVyYXRpb247XG4gICAgcmV0dXJuIGJvZHk7XG4gIH1cblxuICBwYXJzZUlmU3RhdGVtZW50KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5JRik7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgbGV0IHRlc3QgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJQQVJFTik7XG4gICAgbGV0IGNvbnNlcXVlbnQgPSB0aGlzLnBhcnNlU3RhdGVtZW50KCk7XG4gICAgbGV0IGFsdGVybmF0ZSA9IG51bGw7XG4gICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5FTFNFKSkge1xuICAgICAgYWx0ZXJuYXRlID0gdGhpcy5wYXJzZVN0YXRlbWVudCgpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IFNoaWZ0LklmU3RhdGVtZW50KHRlc3QsIGNvbnNlcXVlbnQsIGFsdGVybmF0ZSk7XG4gIH1cblxuICBwYXJzZVJldHVyblN0YXRlbWVudCgpIHtcbiAgICBsZXQgYXJndW1lbnQgPSBudWxsO1xuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJFVFVSTik7XG4gICAgaWYgKCF0aGlzLmluRnVuY3Rpb25Cb2R5KSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuSUxMRUdBTF9SRVRVUk4pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCkge1xuICAgICAgcmV0dXJuIG5ldyBTaGlmdC5SZXR1cm5TdGF0ZW1lbnQobnVsbCk7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5TRU1JQ09MT04pKSB7XG4gICAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJCUkFDRSkgJiYgIXRoaXMuZW9mKCkpIHtcbiAgICAgICAgYXJndW1lbnQgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuY29uc3VtZVNlbWljb2xvbigpO1xuICAgIHJldHVybiBuZXcgU2hpZnQuUmV0dXJuU3RhdGVtZW50KGFyZ3VtZW50KTtcbiAgfVxuXG4gIHBhcnNlV2l0aFN0YXRlbWVudCgpIHtcbiAgICBpZiAodGhpcy5zdHJpY3QpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5TVFJJQ1RfTU9ERV9XSVRIKTtcbiAgICB9XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuV0lUSCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgbGV0IG9iamVjdCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJQQVJFTik7XG4gICAgbGV0IGJvZHkgPSB0aGlzLnBhcnNlU3RhdGVtZW50KCk7XG5cbiAgICByZXR1cm4gbmV3IFNoaWZ0LldpdGhTdGF0ZW1lbnQob2JqZWN0LCBib2R5KTtcbiAgfVxuXG4gIHBhcnNlU3dpdGNoU3RhdGVtZW50KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5TV0lUQ0gpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MUEFSRU4pO1xuICAgIGxldCBkaXNjcmltaW5hbnQgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MQlJBQ0UpO1xuXG4gICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5SQlJBQ0UpKSB7XG4gICAgICByZXR1cm4gbmV3IFNoaWZ0LlN3aXRjaFN0YXRlbWVudChkaXNjcmltaW5hbnQsIFtdKTtcbiAgICB9XG4gICAgbGV0IG9sZEluU3dpdGNoID0gdGhpcy5pblN3aXRjaDtcbiAgICB0aGlzLmluU3dpdGNoID0gdHJ1ZTtcbiAgICByZXR1cm4gdGhpcy53cmFwVkROKCgpID0+IHtcbiAgICAgIGxldCBjYXNlcyA9IHRoaXMucGFyc2VTd2l0Y2hDYXNlcygpO1xuICAgICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkRFRkFVTFQpKSB7XG4gICAgICAgIGxldCBzd2l0Y2hEZWZhdWx0ID0gdGhpcy5wYXJzZVN3aXRjaERlZmF1bHQoKTtcbiAgICAgICAgbGV0IHBvc3REZWZhdWx0Q2FzZXMgPSB0aGlzLnBhcnNlU3dpdGNoQ2FzZXMoKTtcbiAgICAgICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkRFRkFVTFQpKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLk1VTFRJUExFX0RFRkFVTFRTX0lOX1NXSVRDSCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5pblN3aXRjaCA9IG9sZEluU3dpdGNoO1xuICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUkJSQUNFKTtcbiAgICAgICAgcmV0dXJuIG5ldyBTaGlmdC5Td2l0Y2hTdGF0ZW1lbnRXaXRoRGVmYXVsdChkaXNjcmltaW5hbnQsIGNhc2VzLCBzd2l0Y2hEZWZhdWx0LCBwb3N0RGVmYXVsdENhc2VzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuaW5Td2l0Y2ggPSBvbGRJblN3aXRjaDtcbiAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJCUkFDRSk7XG4gICAgICAgIHJldHVybiBuZXcgU2hpZnQuU3dpdGNoU3RhdGVtZW50KGRpc2NyaW1pbmFudCwgY2FzZXMpO1xuICAgICAgfVxuICAgIH0sIHRoaXMuY2hlY2tCbG9ja1Njb3BlKTtcbiAgfVxuXG4gIHBhcnNlU3dpdGNoQ2FzZXMoKSB7XG4gICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgIHdoaWxlICghKHRoaXMuZW9mKCkgfHwgdGhpcy5tYXRjaChUb2tlblR5cGUuUkJSQUNFKSB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5ERUZBVUxUKSkpIHtcbiAgICAgIHJlc3VsdC5wdXNoKHRoaXMucGFyc2VTd2l0Y2hDYXNlKCkpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgcGFyc2VTd2l0Y2hDYXNlKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5DQVNFKTtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlN3aXRjaENhc2UodGhpcy5wYXJzZUV4cHJlc3Npb24oKSwgdGhpcy5wYXJzZVN3aXRjaENhc2VCb2R5KCkpLCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlU3dpdGNoRGVmYXVsdCgpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuREVGQVVMVCk7XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5Td2l0Y2hEZWZhdWx0KHRoaXMucGFyc2VTd2l0Y2hDYXNlQm9keSgpKSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZVN3aXRjaENhc2VCb2R5KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5DT0xPTik7XG4gICAgcmV0dXJuIHRoaXMucGFyc2VTdGF0ZW1lbnRMaXN0SW5Td2l0Y2hDYXNlQm9keSgpO1xuICB9XG5cbiAgcGFyc2VTdGF0ZW1lbnRMaXN0SW5Td2l0Y2hDYXNlQm9keSgpIHtcbiAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgd2hpbGUgKCEodGhpcy5lb2YoKSB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0UpIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLkRFRkFVTFQpIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLkNBU0UpKSkge1xuICAgICAgcmVzdWx0LnB1c2godGhpcy5wYXJzZVN0YXRlbWVudExpc3RJdGVtKCkpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgcGFyc2VUaHJvd1N0YXRlbWVudCgpIHtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmV4cGVjdChUb2tlblR5cGUuVEhST1cpO1xuXG4gICAgaWYgKHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0KSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLk5FV0xJTkVfQUZURVJfVEhST1cpO1xuICAgIH1cblxuICAgIGxldCBhcmd1bWVudCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG5cbiAgICB0aGlzLmNvbnN1bWVTZW1pY29sb24oKTtcblxuICAgIHJldHVybiBuZXcgU2hpZnQuVGhyb3dTdGF0ZW1lbnQoYXJndW1lbnQpO1xuICB9XG5cbiAgcGFyc2VUcnlTdGF0ZW1lbnQoKSB7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlRSWSk7XG4gICAgbGV0IGJsb2NrID0gdGhpcy53cmFwVkROKHRoaXMucGFyc2VCbG9jaywgdGhpcy5jaGVja0Jsb2NrU2NvcGUpO1xuXG4gICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkNBVENIKSkge1xuICAgICAgbGV0IGhhbmRsZXIgPSB0aGlzLnBhcnNlQ2F0Y2hDbGF1c2UoKTtcbiAgICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuRklOQUxMWSkpIHtcbiAgICAgICAgbGV0IGZpbmFsaXplciA9IHRoaXMud3JhcFZETih0aGlzLnBhcnNlQmxvY2ssIHRoaXMuY2hlY2tCbG9ja1Njb3BlKTtcbiAgICAgICAgcmV0dXJuIG5ldyBTaGlmdC5UcnlGaW5hbGx5U3RhdGVtZW50KGJsb2NrLCBoYW5kbGVyLCBmaW5hbGl6ZXIpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBTaGlmdC5UcnlDYXRjaFN0YXRlbWVudChibG9jaywgaGFuZGxlcik7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5GSU5BTExZKSkge1xuICAgICAgbGV0IGZpbmFsaXplciA9IHRoaXMud3JhcFZETih0aGlzLnBhcnNlQmxvY2ssIHRoaXMuY2hlY2tCbG9ja1Njb3BlKTtcbiAgICAgIHJldHVybiBuZXcgU2hpZnQuVHJ5RmluYWxseVN0YXRlbWVudChibG9jaywgbnVsbCwgZmluYWxpemVyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLk5PX0NBVENIX09SX0ZJTkFMTFkpO1xuICAgIH1cbiAgfVxuXG4gIHBhcnNlVmFyaWFibGVEZWNsYXJhdGlvblN0YXRlbWVudCgpIHtcbiAgICBsZXQgZGVjbGFyYXRpb24gPSB0aGlzLnBhcnNlVmFyaWFibGVEZWNsYXJhdGlvbigpO1xuICAgIHRoaXMuY29uc3VtZVNlbWljb2xvbigpO1xuICAgIHJldHVybiBuZXcgU2hpZnQuVmFyaWFibGVEZWNsYXJhdGlvblN0YXRlbWVudChkZWNsYXJhdGlvbik7XG4gIH1cblxuICBwYXJzZVdoaWxlU3RhdGVtZW50KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5XSElMRSk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgcmV0dXJuIG5ldyBTaGlmdC5XaGlsZVN0YXRlbWVudCh0aGlzLnBhcnNlRXhwcmVzc2lvbigpLCB0aGlzLmdldEl0ZXJhdG9yU3RhdGVtZW50RXBpbG9ndWUoKSk7XG4gIH1cblxuICBwYXJzZUNhdGNoQ2xhdXNlKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNBVENIKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTFBBUkVOKTtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuUlBBUkVOKSB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5MUEFSRU4pKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodG9rZW4pO1xuICAgIH1cblxuICAgIGxldCBwYXJhbSA9IHRoaXMucGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uKHthbGxvd0NhbGw6IGZhbHNlfSk7XG5cbiAgICBpZiAoIVBhcnNlci5pc0Rlc3RydWN0dXJpbmdUYXJnZXQocGFyYW0sIHtpc0Fzc2lnbm1lbnQ6IGZhbHNlfSkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0b2tlbik7XG4gICAgfVxuICAgIHBhcmFtID0gUGFyc2VyLnRyYW5zZm9ybURlc3RydWN0dXJpbmcocGFyYW0pO1xuXG4gICAgbGV0IGJvdW5kID0gUGFyc2VyLmJvdW5kTmFtZXMocGFyYW0pO1xuICAgIGlmIChmaXJzdER1cGxpY2F0ZShib3VuZCkgIT0gbnVsbCkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5EVVBMSUNBVEVfQklORElORywgZmlyc3REdXBsaWNhdGUoYm91bmQpKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5zdHJpY3QgJiYgYm91bmQuc29tZShpc1Jlc3RyaWN0ZWRXb3JkKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5TVFJJQ1RfQ0FUQ0hfVkFSSUFCTEUpO1xuICAgIH1cblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuXG4gICAgbGV0IGJvZHkgPSB0aGlzLndyYXBWRE4odGhpcy5wYXJzZUJsb2NrLCB0aGlzLmNoZWNrQmxvY2tTY29wZSk7XG5cbiAgICB0aGlzLkxETi5mb3JFYWNoKG5hbWUgPT4ge1xuICAgICAgaWYgKGJvdW5kLmluZGV4T2YobmFtZSkgPj0gMCkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLkRVUExJQ0FURV9CSU5ESU5HLCBuYW1lKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy5WRE4pIHtcbiAgICAgIGlmICh0aGlzLlZETltrZXldID09PSBGT1JfT0ZfVkFSICYmIGJvdW5kLmluZGV4T2Yoa2V5LnNsaWNlKDEpKSA+PSAwKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5EVVBMSUNBVEVfQ0FUQ0hfQklORElORywga2V5LnNsaWNlKDEpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5DYXRjaENsYXVzZShwYXJhbSwgYm9keSksIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VCbG9jaygpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTEJSQUNFKTtcblxuICAgIGxldCBib2R5ID0gW107XG4gICAgd2hpbGUgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0UpKSB7XG4gICAgICBib2R5LnB1c2godGhpcy5wYXJzZVN0YXRlbWVudExpc3RJdGVtKCkpO1xuICAgIH1cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUkJSQUNFKTtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkJsb2NrKGJvZHkpLCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlVmFyaWFibGVEZWNsYXJhdGlvbih7aW5Gb3IgPSBmYWxzZSwgYm91bmROYW1lcyA9IFtdfSA9IHt9KSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IHRva2VuID0gdGhpcy5sZXgoKTtcblxuICAgIC8vIFByZWNlZGVkIGJ5IHRoaXMubWF0Y2goVG9rZW5TdWJUeXBlLlZBUikgfHwgdGhpcy5tYXRjaChUb2tlblN1YlR5cGUuTEVUKTtcbiAgICBsZXQga2luZCA9IHRva2VuLnR5cGUgPT09IFRva2VuVHlwZS5WQVIgPyBcInZhclwiIDogdG9rZW4udHlwZSA9PT0gVG9rZW5UeXBlLkNPTlNUID8gXCJjb25zdFwiIDogXCJsZXRcIjtcbiAgICBsZXQgZGVjbGFyYXRvcnMgPSB0aGlzLnBhcnNlVmFyaWFibGVEZWNsYXJhdG9yTGlzdChraW5kLCB7aW5Gb3IsIGJvdW5kTmFtZXN9KTtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlZhcmlhYmxlRGVjbGFyYXRpb24oa2luZCwgZGVjbGFyYXRvcnMpLCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlVmFyaWFibGVEZWNsYXJhdG9yTGlzdChraW5kLCB7aW5Gb3IsIGJvdW5kTmFtZXN9KSB7XG4gICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgIGxldCBbdmFyRGVjbCwgYWxsQm91bmRdID0gdGhpcy5wYXJzZVZhcmlhYmxlRGVjbGFyYXRvcihraW5kLCB7YWxsb3dDb25zdFdpdGhvdXRCaW5kaW5nOiBpbkZvcn0pO1xuICAgIHJlc3VsdC5wdXNoKHZhckRlY2wpO1xuICAgIGlmIChpbkZvciAmJiBraW5kID09PSBcImNvbnN0XCIgJiYgdmFyRGVjbC5pbml0ID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHdoaWxlICh0aGlzLmVhdChUb2tlblR5cGUuQ09NTUEpKSB7XG4gICAgICBsZXQgW25leHRWYXJEZWNsLCBib3VuZF0gPSB0aGlzLnBhcnNlVmFyaWFibGVEZWNsYXJhdG9yKGtpbmQsIHthbGxvd0NvbnN0V2l0aG91dEJpbmRpbmc6IGZhbHNlfSk7XG4gICAgICByZXN1bHQucHVzaChuZXh0VmFyRGVjbCk7XG4gICAgICBpZiAoa2luZCAhPT0gXCJ2YXJcIikge1xuICAgICAgICBhbGxCb3VuZCA9IGFsbEJvdW5kLmNvbmNhdChib3VuZCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuc3RyaWN0ICYmIGFsbEJvdW5kLnNvbWUoaXNSZXN0cmljdGVkV29yZCkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odGhpcy5sb29rYWhlYWQsIEVycm9yTWVzc2FnZXMuU1RSSUNUX1ZBUl9OQU1FKTtcbiAgICB9XG5cbiAgICBpZiAoa2luZCAhPT0gXCJ2YXJcIikge1xuICAgICAgbGV0IGR1cGUgPSBmaXJzdER1cGxpY2F0ZShhbGxCb3VuZCk7XG4gICAgICBpZiAoZHVwZSAhPT0gbnVsbCkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuRFVQTElDQVRFX0JJTkRJTkcsIGR1cGUpO1xuICAgICAgfVxuICAgIH1cbiAgICBbXS5wdXNoLmFwcGx5KGJvdW5kTmFtZXMsIGFsbEJvdW5kKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgcGFyc2VWYXJpYWJsZURlY2xhcmF0b3Ioa2luZCwge2FsbG93Q29uc3RXaXRob3V0QmluZGluZ30pIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcblxuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5MUEFSRU4pKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuICAgIH1cbiAgICBsZXQgaWQgPSB0aGlzLnBhcnNlTGVmdEhhbmRTaWRlRXhwcmVzc2lvbih7YWxsb3dDYWxsOiBmYWxzZX0pO1xuXG4gICAgaWYgKCFQYXJzZXIuaXNEZXN0cnVjdHVyaW5nVGFyZ2V0KGlkLCB7aXNBc3NpZ25tZW50OiBmYWxzZX0pKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodG9rZW4pO1xuICAgIH1cbiAgICBpZCA9IFBhcnNlci50cmFuc2Zvcm1EZXN0cnVjdHVyaW5nKGlkKTtcblxuICAgIGxldCBib3VuZCA9IFBhcnNlci5ib3VuZE5hbWVzKGlkKTtcblxuICAgIGxldCBpbml0ID0gbnVsbDtcbiAgICBpZiAoa2luZCA9PT0gXCJjb25zdFwiKSB7XG4gICAgICBpZiAoIWFsbG93Q29uc3RXaXRob3V0QmluZGluZyB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5BU1NJR04pKSB7XG4gICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5BU1NJR04pO1xuICAgICAgICBpbml0ID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0aGlzLmVhdChUb2tlblR5cGUuQVNTSUdOKSkge1xuICAgICAgaW5pdCA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgIH1cblxuICAgIGlmIChraW5kID09PSBcInZhclwiKSB7XG4gICAgICBib3VuZC5mb3JFYWNoKG5hbWUgPT4gdGhpcy5WRE5bXCIkXCIgKyBuYW1lXSA9IHRydWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoYm91bmQuaW5kZXhPZihcImxldFwiKSA+PSAwKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuTEVYSUNBTExZX0JPVU5EX0xFVCk7XG4gICAgICB9XG4gICAgICBbXS5wdXNoLmFwcGx5KHRoaXMuTEROLCBib3VuZCk7XG4gICAgfVxuICAgIHJldHVybiBbdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlZhcmlhYmxlRGVjbGFyYXRvcihpZCwgaW5pdCksIHN0YXJ0TG9jYXRpb24pLCBib3VuZF07XG4gIH1cblxuICBwYXJzZUV4cHJlc3Npb24oKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICBsZXQgZXhwciA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuXG4gICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkNPTU1BKSkge1xuICAgICAgd2hpbGUgKCF0aGlzLmVvZigpKSB7XG4gICAgICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuQ09NTUEpKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5sZXgoKTtcbiAgICAgICAgZXhwciA9IHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5CaW5hcnlFeHByZXNzaW9uKFwiLFwiLCBleHByLCB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKSksXG4gICAgICAgICAgICBzdGFydExvY2F0aW9uKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGV4cHI7XG4gIH1cblxuICBwYXJzZUFycm93RXhwcmVzc2lvblRhaWwoaGVhZCwgc3RhcnRMb2NhdGlvbikge1xuICAgIGxldCBhcnJvdyA9IHRoaXMuZXhwZWN0KFRva2VuVHlwZS5BUlJPVyk7XG5cbiAgICAvLyBDb252ZXJ0IHBhcmFtIGxpc3QuXG4gICAgbGV0IHtwYXJhbXMgPSBudWxsLCByZXN0ID0gbnVsbH0gPSBoZWFkO1xuICAgIGlmIChoZWFkLnR5cGUgIT09IEFSUk9XX0VYUFJFU1NJT05fUEFSQU1TKSB7XG4gICAgICBpZiAoaGVhZC50eXBlID09PSBcIklkZW50aWZpZXJFeHByZXNzaW9uXCIpIHtcbiAgICAgICAgbGV0IG5hbWUgPSBoZWFkLm5hbWU7XG4gICAgICAgIGlmIChTVFJJQ1RfTU9ERV9SRVNFUlZFRF9XT1JELmhhc093blByb3BlcnR5KG5hbWUpKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlNUUklDVF9SRVNFUlZFRF9XT1JEKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNSZXN0cmljdGVkV29yZChuYW1lKSkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUEFSQU1fTkFNRSk7XG4gICAgICAgIH1cbiAgICAgICAgaGVhZCA9IFBhcnNlci50cmFuc2Zvcm1EZXN0cnVjdHVyaW5nKGhlYWQpO1xuICAgICAgICBwYXJhbXMgPSBbaGVhZF07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQoYXJyb3cpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5MQlJBQ0UpKSB7XG4gICAgICBsZXQgcHJldmlvdXNZaWVsZCA9IHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb247XG4gICAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gZmFsc2U7XG4gICAgICBsZXQgYm91bmRQYXJhbXMgPSBbXS5jb25jYXQuYXBwbHkoW10sIHBhcmFtcy5tYXAoUGFyc2VyLmJvdW5kTmFtZXMpKTtcbiAgICAgIGxldCBbYm9keV0gPSB0aGlzLnBhcnNlRnVuY3Rpb25Cb2R5KGJvdW5kUGFyYW1zKTtcbiAgICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBwcmV2aW91c1lpZWxkO1xuICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5BcnJvd0V4cHJlc3Npb24ocGFyYW1zLCByZXN0LCBib2R5KSwgc3RhcnRMb2NhdGlvbik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBib2R5ID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkFycm93RXhwcmVzc2lvbihwYXJhbXMsIHJlc3QsIGJvZHkpLCBzdGFydExvY2F0aW9uKTtcbiAgICB9XG4gIH1cblxuICBwYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCkge1xuICAgIGxldCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuXG4gICAgaWYgKHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gJiYgIXRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXIgJiYgdGhpcy5sb29rYWhlYWQudmFsdWUgPT09IFwieWllbGRcIikge1xuICAgICAgcmV0dXJuIHRoaXMucGFyc2VZaWVsZEV4cHJlc3Npb24oKTtcbiAgICB9XG5cbiAgICBsZXQgbm9kZSA9IHRoaXMucGFyc2VDb25kaXRpb25hbEV4cHJlc3Npb24oKTtcblxuICAgIGlmICghdGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQgJiYgdGhpcy5tYXRjaChUb2tlblR5cGUuQVJST1cpKSB7XG4gICAgICByZXR1cm4gdGhpcy5wYXJzZUFycm93RXhwcmVzc2lvblRhaWwobm9kZSwgc3RhcnRMb2NhdGlvbik7XG4gICAgfVxuXG4gICAgbGV0IGlzQXNzaWdubWVudE9wZXJhdG9yID0gZmFsc2U7XG4gICAgbGV0IG9wZXJhdG9yID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgc3dpdGNoIChvcGVyYXRvci50eXBlKSB7XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fQklUX09SOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX0JJVF9YT1I6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fQklUX0FORDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9TSEw6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fU0hSOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX1NIUl9VTlNJR05FRDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9BREQ6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fU1VCOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX01VTDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9ESVY6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fTU9EOlxuICAgICAgICBpc0Fzc2lnbm1lbnRPcGVyYXRvciA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBpZiAoaXNBc3NpZ25tZW50T3BlcmF0b3IpIHtcbiAgICAgIGlmICghUGFyc2VyLmlzVmFsaWRTaW1wbGVBc3NpZ25tZW50VGFyZ2V0KG5vZGUpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5JTlZBTElEX0xIU19JTl9BU1NJR05NRU5UKTtcbiAgICAgIH1cbiAgICAgIGlmIChub2RlLnR5cGUgPT09IFwiSWRlbnRpZmllckV4cHJlc3Npb25cIikge1xuICAgICAgICBpZiAodGhpcy5zdHJpY3QgJiYgaXNSZXN0cmljdGVkV29yZChub2RlLm5hbWUpKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5TVFJJQ1RfTEhTX0FTU0lHTk1FTlQpO1xuICAgICAgICB9XG4gICAgICAgIG5vZGUgPSBQYXJzZXIudHJhbnNmb3JtRGVzdHJ1Y3R1cmluZyhub2RlKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG9wZXJhdG9yLnR5cGUgPT09IFRva2VuVHlwZS5BU1NJR04pIHtcbiAgICAgIGlmICghUGFyc2VyLmlzRGVzdHJ1Y3R1cmluZ1RhcmdldChub2RlLCB7aXNBc3NpZ25tZW50OiB0cnVlfSkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLklOVkFMSURfTEhTX0lOX0FTU0lHTk1FTlQpO1xuICAgICAgfVxuICAgICAgbm9kZSA9IFBhcnNlci50cmFuc2Zvcm1EZXN0cnVjdHVyaW5nKG5vZGUpO1xuXG4gICAgICBsZXQgYm91bmQgPSBQYXJzZXIuYm91bmROYW1lcyhub2RlKTtcbiAgICAgIGlmICh0aGlzLnN0cmljdCAmJiBib3VuZC5zb21lKGlzUmVzdHJpY3RlZFdvcmQpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuU1RSSUNUX0xIU19BU1NJR05NRU5UKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKG5vZGUudHlwZSA9PT0gXCJPYmplY3RFeHByZXNzaW9uXCIgJiYgbm9kZS5wcm9wZXJ0aWVzLnNvbWUocCA9PiBwLnR5cGUgPT09IFwiQmluZGluZ1Byb3BlcnR5SWRlbnRpZmllclwiKSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQob3BlcmF0b3IpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfVxuXG4gICAgdGhpcy5sZXgoKTtcbiAgICBsZXQgcHJldmlvdXNJbkdlbmVyYXRvclBhcmFtZXRlciA9IHRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXI7XG4gICAgdGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlciA9IGZhbHNlO1xuICAgIGxldCByaWdodCA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgIHRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXIgPSBwcmV2aW91c0luR2VuZXJhdG9yUGFyYW1ldGVyO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQXNzaWdubWVudEV4cHJlc3Npb24ob3BlcmF0b3IudHlwZS5uYW1lLCBub2RlLCByaWdodCksIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgbG9va2FoZWFkQXNzaWdubWVudEV4cHJlc3Npb24oKSB7XG4gICAgc3dpdGNoICh0aGlzLmxvb2thaGVhZC50eXBlKSB7XG4gICAgICBjYXNlIFRva2VuVHlwZS5BREQ6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fRElWOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQ0xBU1M6XG4gICAgICBjYXNlIFRva2VuVHlwZS5ERUM6XG4gICAgICBjYXNlIFRva2VuVHlwZS5ESVY6XG4gICAgICBjYXNlIFRva2VuVHlwZS5GQUxTRTpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkZVTkNUSU9OOlxuICAgICAgY2FzZSBUb2tlblR5cGUuSURFTlRJRklFUjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkxCUkFDRTpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkxCUkFDSzpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkxQQVJFTjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk5FVzpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk5PVDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk5VTEw6XG4gICAgICBjYXNlIFRva2VuVHlwZS5OVU1CRVI6XG4gICAgICBjYXNlIFRva2VuVHlwZS5TVFJJTkc6XG4gICAgICBjYXNlIFRva2VuVHlwZS5TVUI6XG4gICAgICBjYXNlIFRva2VuVHlwZS5USElTOlxuICAgICAgY2FzZSBUb2tlblR5cGUuVFJVRTpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLllJRUxEOlxuICAgICAgY2FzZSBUb2tlblR5cGUuVEVNUExBVEU6XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwYXJzZVlpZWxkRXhwcmVzc2lvbigpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcblxuICAgIHRoaXMubGV4KCk7XG4gICAgaWYgKHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0KSB7XG4gICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LllpZWxkRXhwcmVzc2lvbihudWxsKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgfVxuICAgIGxldCBpc0dlbmVyYXRvciA9ICEhdGhpcy5lYXQoVG9rZW5UeXBlLk1VTCk7XG4gICAgbGV0IHByZXZpb3VzWWllbGQgPSB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uO1xuICAgIGxldCBleHByID0gbnVsbDtcbiAgICBpZiAoaXNHZW5lcmF0b3IgfHwgdGhpcy5sb29rYWhlYWRBc3NpZ25tZW50RXhwcmVzc2lvbigpKSB7XG4gICAgICBleHByID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgfVxuICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBwcmV2aW91c1lpZWxkO1xuICAgIGxldCBDdG9yID0gaXNHZW5lcmF0b3IgPyBTaGlmdC5ZaWVsZEdlbmVyYXRvckV4cHJlc3Npb24gOiBTaGlmdC5ZaWVsZEV4cHJlc3Npb247XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBDdG9yKGV4cHIpLCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlQ29uZGl0aW9uYWxFeHByZXNzaW9uKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCBleHByID0gdGhpcy5wYXJzZUJpbmFyeUV4cHJlc3Npb24oKTtcbiAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLkNPTkRJVElPTkFMKSkge1xuICAgICAgbGV0IHByZXZpb3VzQWxsb3dJbiA9IHRoaXMuYWxsb3dJbjtcbiAgICAgIHRoaXMuYWxsb3dJbiA9IHRydWU7XG4gICAgICBsZXQgY29uc2VxdWVudCA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgdGhpcy5hbGxvd0luID0gcHJldmlvdXNBbGxvd0luO1xuICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNPTE9OKTtcbiAgICAgIGxldCBhbHRlcm5hdGUgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQ29uZGl0aW9uYWxFeHByZXNzaW9uKGV4cHIsIGNvbnNlcXVlbnQsIGFsdGVybmF0ZSksIHN0YXJ0TG9jYXRpb24pO1xuICAgIH1cblxuICAgIHJldHVybiBleHByO1xuICB9XG5cbiAgaXNCaW5hcnlPcGVyYXRvcih0eXBlKSB7XG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICBjYXNlIFRva2VuVHlwZS5PUjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFORDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkJJVF9PUjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkJJVF9YT1I6XG4gICAgICBjYXNlIFRva2VuVHlwZS5CSVRfQU5EOlxuICAgICAgY2FzZSBUb2tlblR5cGUuRVE6XG4gICAgICBjYXNlIFRva2VuVHlwZS5ORTpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkVRX1NUUklDVDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk5FX1NUUklDVDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkxUOlxuICAgICAgY2FzZSBUb2tlblR5cGUuR1Q6XG4gICAgICBjYXNlIFRva2VuVHlwZS5MVEU6XG4gICAgICBjYXNlIFRva2VuVHlwZS5HVEU6XG4gICAgICBjYXNlIFRva2VuVHlwZS5JTlNUQU5DRU9GOlxuICAgICAgY2FzZSBUb2tlblR5cGUuU0hMOlxuICAgICAgY2FzZSBUb2tlblR5cGUuU0hSOlxuICAgICAgY2FzZSBUb2tlblR5cGUuU0hSX1VOU0lHTkVEOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQUREOlxuICAgICAgY2FzZSBUb2tlblR5cGUuU1VCOlxuICAgICAgY2FzZSBUb2tlblR5cGUuTVVMOlxuICAgICAgY2FzZSBUb2tlblR5cGUuRElWOlxuICAgICAgY2FzZSBUb2tlblR5cGUuTU9EOlxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLklOOlxuICAgICAgICByZXR1cm4gdGhpcy5hbGxvd0luO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHBhcnNlQmluYXJ5RXhwcmVzc2lvbigpIHtcbiAgICBsZXQgbG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IGxlZnQgPSB0aGlzLnBhcnNlVW5hcnlFeHByZXNzaW9uKCk7XG4gICAgbGV0IG9wZXJhdG9yID0gdGhpcy5sb29rYWhlYWQudHlwZTtcblxuICAgIGxldCBpc0JpbmFyeU9wZXJhdG9yID0gdGhpcy5pc0JpbmFyeU9wZXJhdG9yKG9wZXJhdG9yKTtcbiAgICBpZiAoIWlzQmluYXJ5T3BlcmF0b3IpIHtcbiAgICAgIHJldHVybiBsZWZ0O1xuICAgIH1cblxuICAgIHRoaXMubGV4KCk7XG4gICAgbGV0IHN0YWNrID0gW107XG4gICAgc3RhY2sucHVzaCh7bG9jYXRpb24sIGxlZnQsIG9wZXJhdG9yLCBwcmVjZWRlbmNlOiBCaW5hcnlQcmVjZWRlbmNlW29wZXJhdG9yLm5hbWVdfSk7XG4gICAgbG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IHJpZ2h0ID0gdGhpcy5wYXJzZVVuYXJ5RXhwcmVzc2lvbigpO1xuXG4gICAgb3BlcmF0b3IgPSB0aGlzLmxvb2thaGVhZC50eXBlO1xuICAgIGlzQmluYXJ5T3BlcmF0b3IgPSB0aGlzLmlzQmluYXJ5T3BlcmF0b3IodGhpcy5sb29rYWhlYWQudHlwZSk7XG4gICAgd2hpbGUgKGlzQmluYXJ5T3BlcmF0b3IpIHtcbiAgICAgIGxldCBwcmVjZWRlbmNlID0gQmluYXJ5UHJlY2VkZW5jZVtvcGVyYXRvci5uYW1lXTtcbiAgICAgIC8vIFJlZHVjZTogbWFrZSBhIGJpbmFyeSBleHByZXNzaW9uIGZyb20gdGhlIHRocmVlIHRvcG1vc3QgZW50cmllcy5cbiAgICAgIHdoaWxlIChzdGFjay5sZW5ndGggJiYgcHJlY2VkZW5jZSA8PSBzdGFja1tzdGFjay5sZW5ndGggLSAxXS5wcmVjZWRlbmNlKSB7XG4gICAgICAgIGxldCBzdGFja0l0ZW0gPSBzdGFja1tzdGFjay5sZW5ndGggLSAxXTtcbiAgICAgICAgbGV0IHN0YWNrT3BlcmF0b3IgPSBzdGFja0l0ZW0ub3BlcmF0b3I7XG4gICAgICAgIGxlZnQgPSBzdGFja0l0ZW0ubGVmdDtcbiAgICAgICAgc3RhY2sucG9wKCk7XG4gICAgICAgIGxvY2F0aW9uID0gc3RhY2tJdGVtLmxvY2F0aW9uO1xuICAgICAgICByaWdodCA9IHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5CaW5hcnlFeHByZXNzaW9uKHN0YWNrT3BlcmF0b3IubmFtZSwgbGVmdCwgcmlnaHQpLCBsb2NhdGlvbik7XG4gICAgICB9XG5cbiAgICAgIC8vIFNoaWZ0LlxuICAgICAgdGhpcy5sZXgoKTtcbiAgICAgIHN0YWNrLnB1c2goe2xvY2F0aW9uLCBsZWZ0OiByaWdodCwgb3BlcmF0b3IsIHByZWNlZGVuY2V9KTtcbiAgICAgIGxvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgICAgcmlnaHQgPSB0aGlzLnBhcnNlVW5hcnlFeHByZXNzaW9uKCk7XG5cbiAgICAgIG9wZXJhdG9yID0gdGhpcy5sb29rYWhlYWQudHlwZTtcbiAgICAgIGlzQmluYXJ5T3BlcmF0b3IgPSB0aGlzLmlzQmluYXJ5T3BlcmF0b3Iob3BlcmF0b3IpO1xuICAgIH1cblxuICAgIC8vIEZpbmFsIHJlZHVjZSB0byBjbGVhbi11cCB0aGUgc3RhY2suXG4gICAgcmV0dXJuIHN0YWNrLnJlZHVjZVJpZ2h0KChleHByLCBzdGFja0l0ZW0pID0+XG4gICAgICB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQmluYXJ5RXhwcmVzc2lvbihzdGFja0l0ZW0ub3BlcmF0b3IubmFtZSwgc3RhY2tJdGVtLmxlZnQsIGV4cHIpLCBzdGFja0l0ZW0ubG9jYXRpb24pLFxuICAgICAgcmlnaHQpO1xuICB9XG5cbiAgc3RhdGljIGlzUHJlZml4T3BlcmF0b3IodHlwZSkge1xuICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgY2FzZSBUb2tlblR5cGUuSU5DOlxuICAgICAgY2FzZSBUb2tlblR5cGUuREVDOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQUREOlxuICAgICAgY2FzZSBUb2tlblR5cGUuU1VCOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQklUX05PVDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk5PVDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkRFTEVURTpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlZPSUQ6XG4gICAgICBjYXNlIFRva2VuVHlwZS5UWVBFT0Y6XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwYXJzZVVuYXJ5RXhwcmVzc2lvbigpIHtcbiAgICBpZiAodGhpcy5sb29rYWhlYWQudHlwZS5rbGFzcyAhPT0gVG9rZW5DbGFzcy5QdW5jdHVhdG9yICYmIHRoaXMubG9va2FoZWFkLnR5cGUua2xhc3MgIT09IFRva2VuQ2xhc3MuS2V5d29yZCkge1xuICAgICAgcmV0dXJuIHRoaXMucGFyc2VQb3N0Zml4RXhwcmVzc2lvbigpO1xuICAgIH1cbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgb3BlcmF0b3IgPSB0aGlzLmxvb2thaGVhZDtcbiAgICBpZiAoIVBhcnNlci5pc1ByZWZpeE9wZXJhdG9yKG9wZXJhdG9yLnR5cGUpKSB7XG4gICAgICByZXR1cm4gdGhpcy5wYXJzZVBvc3RmaXhFeHByZXNzaW9uKCk7XG4gICAgfVxuICAgIHRoaXMubGV4KCk7XG4gICAgbGV0IGV4cHIgPSB0aGlzLnBhcnNlVW5hcnlFeHByZXNzaW9uKCk7XG4gICAgc3dpdGNoIChvcGVyYXRvci50eXBlKSB7XG4gICAgICBjYXNlIFRva2VuVHlwZS5JTkM6XG4gICAgICBjYXNlIFRva2VuVHlwZS5ERUM6XG4gICAgICAgIC8vIDExLjQuNCwgMTEuNC41O1xuICAgICAgICBpZiAoZXhwci50eXBlID09PSBcIklkZW50aWZpZXJFeHByZXNzaW9uXCIpIHtcbiAgICAgICAgICBpZiAodGhpcy5zdHJpY3QgJiYgaXNSZXN0cmljdGVkV29yZChleHByLm5hbWUpKSB7XG4gICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX0xIU19QUkVGSVgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghUGFyc2VyLmlzVmFsaWRTaW1wbGVBc3NpZ25tZW50VGFyZ2V0KGV4cHIpKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLklOVkFMSURfTEhTX0lOX0FTU0lHTk1FTlQpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBUb2tlblR5cGUuREVMRVRFOlxuICAgICAgICBpZiAoZXhwci50eXBlID09PSBcIklkZW50aWZpZXJFeHByZXNzaW9uXCIgJiYgdGhpcy5zdHJpY3QpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX0RFTEVURSk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlByZWZpeEV4cHJlc3Npb24ob3BlcmF0b3IudmFsdWUsIGV4cHIpLCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlUG9zdGZpeEV4cHJlc3Npb24oKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICBsZXQgZXhwciA9IHRoaXMucGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uKHthbGxvd0NhbGw6IHRydWV9KTtcblxuICAgIGlmICh0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCkge1xuICAgICAgcmV0dXJuIGV4cHI7XG4gICAgfVxuXG4gICAgbGV0IG9wZXJhdG9yID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgaWYgKG9wZXJhdG9yLnR5cGUgIT09IFRva2VuVHlwZS5JTkMgJiYgb3BlcmF0b3IudHlwZSAhPT0gVG9rZW5UeXBlLkRFQykge1xuICAgICAgcmV0dXJuIGV4cHI7XG4gICAgfVxuICAgIHRoaXMubGV4KCk7XG4gICAgLy8gMTEuMy4xLCAxMS4zLjI7XG4gICAgaWYgKGV4cHIudHlwZSA9PT0gXCJJZGVudGlmaWVyRXhwcmVzc2lvblwiKSB7XG4gICAgICBpZiAodGhpcy5zdHJpY3QgJiYgaXNSZXN0cmljdGVkV29yZChleHByLm5hbWUpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5TVFJJQ1RfTEhTX1BPU1RGSVgpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIVBhcnNlci5pc1ZhbGlkU2ltcGxlQXNzaWdubWVudFRhcmdldChleHByKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLklOVkFMSURfTEhTX0lOX0FTU0lHTk1FTlQpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlBvc3RmaXhFeHByZXNzaW9uKGV4cHIsIG9wZXJhdG9yLnZhbHVlKSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZUxlZnRIYW5kU2lkZUV4cHJlc3Npb24oe2FsbG93Q2FsbH0pIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgcHJldmlvdXNBbGxvd0luID0gdGhpcy5hbGxvd0luO1xuICAgIHRoaXMuYWxsb3dJbiA9IGFsbG93Q2FsbDtcblxuICAgIGxldCBleHByLCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuXG4gICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5TVVBFUikpIHtcbiAgICAgIGV4cHIgPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuU3VwZXIsIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkxQQVJFTikpIHtcbiAgICAgICAgaWYgKGFsbG93Q2FsbCkge1xuICAgICAgICAgIGlmICh0aGlzLmluQ29uc3RydWN0b3IgJiYgIXRoaXMuaW5QYXJhbWV0ZXIpIHtcbiAgICAgICAgICAgIGV4cHIgPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQ2FsbEV4cHJlc3Npb24oZXhwciwgdGhpcy5wYXJzZUFyZ3VtZW50TGlzdCgpKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24oc3RhcnRMb2NhdGlvbiwgRXJyb3JNZXNzYWdlcy5VTkVYUEVDVEVEX1NVUEVSX0NBTEwpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodG9rZW4pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkxCUkFDSykpIHtcbiAgICAgICAgaWYgKHRoaXMuaW5NZXRob2QgJiYgIXRoaXMuaW5QYXJhbWV0ZXIpIHtcbiAgICAgICAgICBleHByID0gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkNvbXB1dGVkTWVtYmVyRXhwcmVzc2lvbihleHByLCB0aGlzLnBhcnNlQ29tcHV0ZWRNZW1iZXIoKSksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24oc3RhcnRMb2NhdGlvbiwgRXJyb3JNZXNzYWdlcy5VTkVYUEVDVEVEX1NVUEVSX1BST1BFUlRZKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5QRVJJT0QpKSB7XG4gICAgICAgIGlmICh0aGlzLmluTWV0aG9kICYmICF0aGlzLmluUGFyYW1ldGVyKSB7XG4gICAgICAgICAgZXhwciA9IHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5TdGF0aWNNZW1iZXJFeHByZXNzaW9uKGV4cHIsIHRoaXMucGFyc2VOb25Db21wdXRlZE1lbWJlcigpKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbihzdGFydExvY2F0aW9uLCBFcnJvck1lc3NhZ2VzLlVORVhQRUNURURfU1VQRVJfUFJPUEVSVFkpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodG9rZW4pO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuTkVXKSkge1xuICAgICAgZXhwciA9IHRoaXMucGFyc2VOZXdFeHByZXNzaW9uKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGV4cHIgPSB0aGlzLnBhcnNlUHJpbWFyeUV4cHJlc3Npb24oKTtcbiAgICB9XG5cbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgaWYgKGFsbG93Q2FsbCAmJiB0aGlzLm1hdGNoKFRva2VuVHlwZS5MUEFSRU4pKSB7XG4gICAgICAgIGV4cHIgPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQ2FsbEV4cHJlc3Npb24oZXhwciwgdGhpcy5wYXJzZUFyZ3VtZW50TGlzdCgpKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkxCUkFDSykpIHtcbiAgICAgICAgZXhwciA9IHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5Db21wdXRlZE1lbWJlckV4cHJlc3Npb24oZXhwciwgdGhpcy5wYXJzZUNvbXB1dGVkTWVtYmVyKCkpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuUEVSSU9EKSkge1xuICAgICAgICBleHByID0gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlN0YXRpY01lbWJlckV4cHJlc3Npb24oZXhwciwgdGhpcy5wYXJzZU5vbkNvbXB1dGVkTWVtYmVyKCkpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuVEVNUExBVEUpKSB7XG4gICAgICAgIGV4cHIgPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuVGVtcGxhdGVFeHByZXNzaW9uKGV4cHIsIHRoaXMucGFyc2VUZW1wbGF0ZUVsZW1lbnRzKCkpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuYWxsb3dJbiA9IHByZXZpb3VzQWxsb3dJbjtcblxuICAgIHJldHVybiBleHByO1xuICB9XG5cbiAgcGFyc2VUZW1wbGF0ZUVsZW1lbnRzKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgIGlmICh0b2tlbi50YWlsKSB7XG4gICAgICB0aGlzLmxleCgpO1xuICAgICAgcmV0dXJuIFt0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuVGVtcGxhdGVFbGVtZW50KHRva2VuLnZhbHVlLnNsaWNlKDEsIC0xKSksIHN0YXJ0TG9jYXRpb24pXTtcbiAgICB9XG4gICAgbGV0IHJlc3VsdCA9IFt0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuVGVtcGxhdGVFbGVtZW50KHRoaXMubGV4KCkudmFsdWUuc2xpY2UoMSwgLTIpKSwgc3RhcnRMb2NhdGlvbildO1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICByZXN1bHQucHVzaCh0aGlzLnBhcnNlRXhwcmVzc2lvbigpKTtcbiAgICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuUkJSQUNFKSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuaW5kZXggPSB0aGlzLnN0YXJ0SW5kZXg7XG4gICAgICB0aGlzLmxpbmUgPSB0aGlzLnN0YXJ0TGluZTtcbiAgICAgIHRoaXMubGluZVN0YXJ0ID0gdGhpcy5zdGFydExpbmVTdGFydDtcbiAgICAgIHRoaXMubG9va2FoZWFkID0gdGhpcy5zY2FuVGVtcGxhdGVFbGVtZW50KCk7XG4gICAgICBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgICAgdG9rZW4gPSB0aGlzLmxleCgpO1xuICAgICAgaWYgKHRva2VuLnRhaWwpIHtcbiAgICAgICAgcmVzdWx0LnB1c2godGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlRlbXBsYXRlRWxlbWVudCh0b2tlbi52YWx1ZS5zbGljZSgxLCAtMSkpLCBzdGFydExvY2F0aW9uKSk7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXN1bHQucHVzaCh0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuVGVtcGxhdGVFbGVtZW50KHRva2VuLnZhbHVlLnNsaWNlKDEsIC0yKSksIHN0YXJ0TG9jYXRpb24pKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwYXJzZU5vbkNvbXB1dGVkTWVtYmVyKCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5QRVJJT0QpO1xuICAgIGlmICghdGhpcy5sb29rYWhlYWQudHlwZS5rbGFzcy5pc0lkZW50aWZpZXJOYW1lKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5sZXgoKS52YWx1ZTtcbiAgICB9XG4gIH1cblxuICBwYXJzZUNvbXB1dGVkTWVtYmVyKCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MQlJBQ0spO1xuICAgIGxldCBleHByID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUkJSQUNLKTtcbiAgICByZXR1cm4gZXhwcjtcbiAgfVxuXG4gIHBhcnNlTmV3RXhwcmVzc2lvbigpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTkVXKTtcbiAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLlBFUklPRCkpIHtcbiAgICAgIGxldCBpZGVudCA9IHRoaXMuZXhwZWN0KFRva2VuVHlwZS5JREVOVElGSUVSKTtcbiAgICAgIGlmIChpZGVudC52YWx1ZSAhPT0gXCJ0YXJnZXRcIikge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQoaWRlbnQpO1xuICAgICAgfSBlbHNlIGlmICghdGhpcy5pbkZ1bmN0aW9uQm9keSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHN0YXJ0TG9jYXRpb24sIEVycm9yTWVzc2FnZXMuVU5FWFBFQ1RFRF9ORVdfVEFSR0VUKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuTmV3VGFyZ2V0RXhwcmVzc2lvbiwgc3RhcnRMb2NhdGlvbik7XG4gICAgfVxuICAgIGxldCBjYWxsZWUgPSB0aGlzLnBhcnNlTGVmdEhhbmRTaWRlRXhwcmVzc2lvbih7YWxsb3dDYWxsOiBmYWxzZX0pO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuTmV3RXhwcmVzc2lvbihcbiAgICAgIGNhbGxlZSxcbiAgICAgIHRoaXMubWF0Y2goVG9rZW5UeXBlLkxQQVJFTikgPyB0aGlzLnBhcnNlQXJndW1lbnRMaXN0KCkgOiBbXVxuICAgICksIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VQcmltYXJ5RXhwcmVzc2lvbigpIHtcbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuTFBBUkVOKSkge1xuICAgICAgcmV0dXJuIHRoaXMucGFyc2VHcm91cEV4cHJlc3Npb24oKTtcbiAgICB9XG5cbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcblxuICAgIHN3aXRjaCAodGhpcy5sb29rYWhlYWQudHlwZSkge1xuICAgICAgY2FzZSBUb2tlblR5cGUuWUlFTEQ6XG4gICAgICBjYXNlIFRva2VuVHlwZS5JREVOVElGSUVSOlxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIklkZW50aWZpZXJFeHByZXNzaW9uXCIsIG5hbWU6IHRoaXMucGFyc2VJZGVudGlmaWVyKCkgfSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICBjYXNlIFRva2VuVHlwZS5TVFJJTkc6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlU3RyaW5nTGl0ZXJhbCgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuTlVNQkVSOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZU51bWVyaWNMaXRlcmFsKCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5USElTOlxuICAgICAgICB0aGlzLmxleCgpO1xuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlRoaXNFeHByZXNzaW9uLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkZVTkNUSU9OOlxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24odGhpcy5wYXJzZUZ1bmN0aW9uKHtpc0V4cHI6IHRydWV9KSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICBjYXNlIFRva2VuVHlwZS5UUlVFOlxuICAgICAgICB0aGlzLmxleCgpO1xuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkxpdGVyYWxCb29sZWFuRXhwcmVzc2lvbih0cnVlKSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICBjYXNlIFRva2VuVHlwZS5GQUxTRTpcbiAgICAgICAgdGhpcy5sZXgoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5MaXRlcmFsQm9vbGVhbkV4cHJlc3Npb24oZmFsc2UpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk5VTEw6XG4gICAgICAgIHRoaXMubGV4KCk7XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuTGl0ZXJhbE51bGxFeHByZXNzaW9uLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkxCUkFDSzpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VBcnJheUV4cHJlc3Npb24oKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkxCUkFDRTpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VPYmplY3RFeHByZXNzaW9uKCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5URU1QTEFURTpcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5UZW1wbGF0ZUV4cHJlc3Npb24obnVsbCwgdGhpcy5wYXJzZVRlbXBsYXRlRWxlbWVudHMoKSksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgY2FzZSBUb2tlblR5cGUuRElWOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX0RJVjpcbiAgICAgICAgdGhpcy5sb29rYWhlYWQgPSB0aGlzLnNjYW5SZWdFeHAodGhpcy5sb29rYWhlYWQudHlwZSA9PT0gVG9rZW5UeXBlLkRJViA/IFwiL1wiIDogXCIvPVwiKTtcbiAgICAgICAgbGV0IHRva2VuID0gdGhpcy5sZXgoKTtcbiAgICAgICAgbGV0IGxhc3RTbGFzaCA9IHRva2VuLnZhbHVlLmxhc3RJbmRleE9mKFwiL1wiKTtcbiAgICAgICAgbGV0IHBhdHRlcm4gPSB0b2tlbi52YWx1ZS5zbGljZSgxLCBsYXN0U2xhc2gpLnJlcGxhY2UoXCJcXFxcL1wiLCBcIi9cIik7XG4gICAgICAgIGxldCBmbGFncyA9IHRva2VuLnZhbHVlLnNsaWNlKGxhc3RTbGFzaCArIDEpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIFJlZ0V4cChwYXR0ZXJuLCBmbGFncyk7XG4gICAgICAgIH0gY2F0Y2ggKHVudXNlZCkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuSU5WQUxJRF9SRUdVTEFSX0VYUFJFU1NJT04pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuTGl0ZXJhbFJlZ0V4cEV4cHJlc3Npb24ocGF0dGVybiwgZmxhZ3MpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkNMQVNTOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZUNsYXNzKHtpc0V4cHI6IHRydWV9KTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxleCgpKTtcbiAgICB9XG4gIH1cblxuICBwYXJzZU51bWVyaWNMaXRlcmFsKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGlmICh0aGlzLnN0cmljdCAmJiB0aGlzLmxvb2thaGVhZC5vY3RhbCkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0aGlzLmxvb2thaGVhZCwgRXJyb3JNZXNzYWdlcy5TVFJJQ1RfT0NUQUxfTElURVJBTCk7XG4gICAgfVxuICAgIGxldCB0b2tlbjIgPSB0aGlzLmxleCgpO1xuICAgIGxldCBub2RlID0gdG9rZW4yLl92YWx1ZSA9PT0gMS8wXG4gICAgICA/IG5ldyBTaGlmdC5MaXRlcmFsSW5maW5pdHlFeHByZXNzaW9uXG4gICAgICA6IG5ldyBTaGlmdC5MaXRlcmFsTnVtZXJpY0V4cHJlc3Npb24odG9rZW4yLl92YWx1ZSk7XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5vZGUsIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VTdHJpbmdMaXRlcmFsKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGlmICh0aGlzLnN0cmljdCAmJiB0aGlzLmxvb2thaGVhZC5vY3RhbCkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0aGlzLmxvb2thaGVhZCwgRXJyb3JNZXNzYWdlcy5TVFJJQ1RfT0NUQUxfTElURVJBTCk7XG4gICAgfVxuICAgIGxldCB0b2tlbjIgPSB0aGlzLmxleCgpO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuTGl0ZXJhbFN0cmluZ0V4cHJlc3Npb24odG9rZW4yLl92YWx1ZSwgdG9rZW4yLnNsaWNlLnRleHQpLFxuICAgICAgICBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlSWRlbnRpZmllck5hbWUoKSB7XG4gICAgaWYgKHRoaXMubG9va2FoZWFkLnR5cGUua2xhc3MuaXNJZGVudGlmaWVyTmFtZSkge1xuICAgICAgcmV0dXJuIHRoaXMubGV4KCkudmFsdWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgfVxuICB9XG5cbiAgcGFyc2VCaW5kaW5nSWRlbnRpZmllcigpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIkJpbmRpbmdJZGVudGlmaWVyXCIsIG5hbWU6IHRoaXMucGFyc2VJZGVudGlmaWVyKCkgfSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZUlkZW50aWZpZXIoKSB7XG4gICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLllJRUxEKSkge1xuICAgICAgaWYgKHRoaXMuc3RyaWN0KSB7XG4gICAgICAgIHRoaXMubG9va2FoZWFkLnR5cGUgPSBUb2tlblR5cGUuWUlFTEQ7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24pIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5pbkdlbmVyYXRvckJvZHkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aGlzLmxleCgpLnZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdGhpcy5leHBlY3QoVG9rZW5UeXBlLklERU5USUZJRVIpLnZhbHVlO1xuICB9XG5cbiAgcGFyc2VBcmd1bWVudExpc3QoKSB7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgbGV0IGFyZ3MgPSB0aGlzLnBhcnNlQXJndW1lbnRzKCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJQQVJFTik7XG4gICAgcmV0dXJuIGFyZ3M7XG4gIH1cblxuICBwYXJzZUFyZ3VtZW50cygpIHtcbiAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5SUEFSRU4pIHx8IHRoaXMuZW9mKCkpIHtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH1cbiAgICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgICAgbGV0IGFyZztcbiAgICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuRUxMSVBTSVMpKSB7XG4gICAgICAgIGFyZyA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgICBhcmcgPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuU3ByZWFkRWxlbWVudChhcmcpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFyZyA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgfVxuICAgICAgcmVzdWx0LnB1c2goYXJnKTtcbiAgICAgIGlmICghdGhpcy5lYXQoVG9rZW5UeXBlLkNPTU1BKSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8vIDExLjIgTGVmdC1IYW5kLVNpZGUgRXhwcmVzc2lvbnM7XG5cbiAgZW5zdXJlQXJyb3coKSB7XG4gICAgaWYgKHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0KSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5FWFBFQ1RFRF9MSU5FX1RFUk1JTkFUT1IpO1xuICAgIH1cbiAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLkFSUk9XKSkge1xuICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkFSUk9XKTtcbiAgICB9XG4gIH1cblxuICBwYXJzZUdyb3VwRXhwcmVzc2lvbigpIHtcbiAgICBsZXQgcmVzdCA9IG51bGw7XG4gICAgbGV0IHN0YXJ0ID0gdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5SUEFSRU4pKSB7XG4gICAgICB0aGlzLmVuc3VyZUFycm93KCk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiBBUlJPV19FWFBSRVNTSU9OX1BBUkFNUyxcbiAgICAgICAgcGFyYW1zOiBbXSxcbiAgICAgICAgcmVzdDogbnVsbFxuICAgICAgfTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5FTExJUFNJUykpIHtcbiAgICAgIHJlc3QgPSB0aGlzLnBhcnNlQmluZGluZ0lkZW50aWZpZXIoKTtcbiAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgICAgdGhpcy5lbnN1cmVBcnJvdygpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogQVJST1dfRVhQUkVTU0lPTl9QQVJBTVMsXG4gICAgICAgIHBhcmFtczogW10sXG4gICAgICAgIHJlc3Q6IHJlc3RcbiAgICAgIH07XG4gICAgfVxuXG4gICAgbGV0IHBvc3NpYmxlQmluZGluZ3MgPSAhdGhpcy5tYXRjaChUb2tlblR5cGUuTFBBUkVOKTtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgZ3JvdXAgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICBsZXQgcGFyYW1zID0gW2dyb3VwXTtcblxuICAgIHdoaWxlICh0aGlzLmVhdChUb2tlblR5cGUuQ09NTUEpKSB7XG4gICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuRUxMSVBTSVMpKSB7XG4gICAgICAgIGlmICghcG9zc2libGVCaW5kaW5ncykge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5sZXgoKTtcbiAgICAgICAgcmVzdCA9IHRoaXMucGFyc2VCaW5kaW5nSWRlbnRpZmllcigpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIHBvc3NpYmxlQmluZGluZ3MgPSBwb3NzaWJsZUJpbmRpbmdzICYmICF0aGlzLm1hdGNoKFRva2VuVHlwZS5MUEFSRU4pO1xuICAgICAgbGV0IGV4cHIgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgIHBhcmFtcy5wdXNoKGV4cHIpO1xuICAgICAgZ3JvdXAgPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQmluYXJ5RXhwcmVzc2lvbihcIixcIiwgZ3JvdXAsIGV4cHIpLCBzdGFydExvY2F0aW9uKTtcbiAgICB9XG5cbiAgICBpZiAocG9zc2libGVCaW5kaW5ncykge1xuICAgICAgcG9zc2libGVCaW5kaW5ncyA9IHBhcmFtcy5ldmVyeShlID0+XG4gICAgICAgIFBhcnNlci5pc0Rlc3RydWN0dXJpbmdUYXJnZXRXaXRoRGVmYXVsdChlLCB7aXNBc3NpZ25tZW50OiBmYWxzZX0pKTtcbiAgICB9XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcblxuICAgIGlmICghdGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQgJiYgdGhpcy5tYXRjaChUb2tlblR5cGUuQVJST1cpKSB7XG4gICAgICBpZiAoIXBvc3NpYmxlQmluZGluZ3MpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbihzdGFydCwgRXJyb3JNZXNzYWdlcy5JTExFR0FMX0FSUk9XX0ZVTkNUSU9OX1BBUkFNUyk7XG4gICAgICB9XG4gICAgICAvLyBjaGVjayBkdXAgcGFyYW1zXG4gICAgICBwYXJhbXMgPSBwYXJhbXMubWFwKFBhcnNlci50cmFuc2Zvcm1EZXN0cnVjdHVyaW5nKTtcbiAgICAgIGxldCBhbGxCb3VuZE5hbWVzID0gW107XG4gICAgICBwYXJhbXMuZm9yRWFjaChleHByID0+IHtcbiAgICAgICAgbGV0IGJvdW5kTmFtZXMgPSBQYXJzZXIuYm91bmROYW1lcyhleHByKTtcbiAgICAgICAgbGV0IGR1cCA9IGZpcnN0RHVwbGljYXRlKGJvdW5kTmFtZXMpO1xuICAgICAgICBpZiAoZHVwKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLkRVUExJQ0FURV9CSU5ESU5HLCBkdXApO1xuICAgICAgICB9XG4gICAgICAgIGFsbEJvdW5kTmFtZXMgPSBhbGxCb3VuZE5hbWVzLmNvbmNhdChib3VuZE5hbWVzKTtcbiAgICAgIH0pO1xuICAgICAgaWYgKHJlc3QpIHtcbiAgICAgICAgYWxsQm91bmROYW1lcy5wdXNoKHJlc3QubmFtZSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChmaXJzdER1cGxpY2F0ZShhbGxCb3VuZE5hbWVzKSAhPSBudWxsKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUEFSQU1fRFVQRSk7XG4gICAgICB9XG5cbiAgICAgIGxldCBzdHJpY3RSZXN0cmljdGVkV29yZCA9IGFsbEJvdW5kTmFtZXMuc29tZShpc1Jlc3RyaWN0ZWRXb3JkKTtcbiAgICAgIGlmIChzdHJpY3RSZXN0cmljdGVkV29yZCkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX1BBUkFNX05BTUUpO1xuICAgICAgfVxuXG4gICAgICBsZXQgc3RyaWN0UmVzZXJ2ZWRXb3JkID0gaGFzU3RyaWN0TW9kZVJlc2VydmVkV29yZChhbGxCb3VuZE5hbWVzKTtcbiAgICAgIGlmIChzdHJpY3RSZXNlcnZlZFdvcmQpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlNUUklDVF9SRVNFUlZFRF9XT1JEKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogQVJST1dfRVhQUkVTU0lPTl9QQVJBTVMsXG4gICAgICAgIHBhcmFtcyxcbiAgICAgICAgcmVzdFxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHJlc3QpIHtcbiAgICAgICAgdGhpcy5lbnN1cmVBcnJvdygpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGdyb3VwO1xuICAgIH1cbiAgfVxuXG5cbiAgcGFyc2VBcnJheUV4cHJlc3Npb24oKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTEJSQUNLKTtcblxuICAgIGxldCBlbGVtZW50cyA9IHRoaXMucGFyc2VBcnJheUV4cHJlc3Npb25FbGVtZW50cygpO1xuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJCUkFDSyk7XG5cbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkFycmF5RXhwcmVzc2lvbihlbGVtZW50cyksIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VBcnJheUV4cHJlc3Npb25FbGVtZW50cygpIHtcbiAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0spKSB7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9XG4gICAgICBsZXQgZWw7XG5cbiAgICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuQ09NTUEpKSB7XG4gICAgICAgIGVsID0gbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgICAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLkVMTElQU0lTKSkge1xuICAgICAgICAgIGVsID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgICAgICAgZWwgPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuU3ByZWFkRWxlbWVudChlbCksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVsID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0spKSB7XG4gICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNPTU1BKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmVzdWx0LnB1c2goZWwpO1xuICAgIH1cbiAgfVxuXG4gIHBhcnNlT2JqZWN0RXhwcmVzc2lvbigpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MQlJBQ0UpO1xuXG4gICAgbGV0IHByb3BlcnRpZXMgPSB0aGlzLnBhcnNlT2JqZWN0RXhwcmVzc2lvbkl0ZW1zKCk7XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUkJSQUNFKTtcblxuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuT2JqZWN0RXhwcmVzc2lvbihwcm9wZXJ0aWVzKSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuXG4gIHBhcnNlT2JqZWN0RXhwcmVzc2lvbkl0ZW1zKCkge1xuICAgIGxldCByZXN1bHQgPSBbXTtcbiAgICBsZXQgaGFzX19wcm90b19fID0gW2ZhbHNlXTtcbiAgICB3aGlsZSAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJCUkFDRSkpIHtcbiAgICAgIHJlc3VsdC5wdXNoKHRoaXMucGFyc2VQcm9wZXJ0eURlZmluaXRpb24oaGFzX19wcm90b19fKSk7XG4gICAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJCUkFDRSkpIHtcbiAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNPTU1BKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHBhcnNlUHJvcGVydHlEZWZpbml0aW9uKGhhc19fcHJvdG9fXykge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuXG4gICAgbGV0IHttZXRob2RPcktleSwga2luZH0gPSB0aGlzLnBhcnNlTWV0aG9kRGVmaW5pdGlvbihmYWxzZSk7XG4gICAgc3dpdGNoIChraW5kKSB7XG4gICAgICBjYXNlIFwibWV0aG9kXCI6XG4gICAgICAgIHJldHVybiBtZXRob2RPcktleTtcbiAgICAgIGNhc2UgXCJpZGVudGlmaWVyXCI6IC8vIElkZW50aWZpZXJSZWZlcmVuY2UsXG4gICAgICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuQVNTSUdOKSkge1xuICAgICAgICAgIC8vIENvdmVySW5pdGlhbGl6ZWROYW1lXG4gICAgICAgICAgaWYgKCh0aGlzLnN0cmljdCB8fCB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uKSAmJiBtZXRob2RPcktleS52YWx1ZSA9PT0gXCJ5aWVsZFwiKSB7XG4gICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodG9rZW4pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIkJpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXJcIixcbiAgICAgICAgICAgIGJpbmRpbmc6IHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJCaW5kaW5nSWRlbnRpZmllclwiLCBuYW1lOiBtZXRob2RPcktleS52YWx1ZSB9LCBzdGFydExvY2F0aW9uKSxcbiAgICAgICAgICAgIGluaXQ6IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpLFxuICAgICAgICAgIH0sIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgICB9IGVsc2UgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5DT0xPTikpIHtcbiAgICAgICAgICBpZiAodG9rZW4udHlwZSAhPT0gVG9rZW5UeXBlLklERU5USUZJRVIgJiYgdG9rZW4udHlwZSAhPT0gVG9rZW5UeXBlLllJRUxEIHx8XG4gICAgICAgICAgICAodGhpcy5zdHJpY3QgfHwgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbikgJiYgbWV0aG9kT3JLZXkudmFsdWUgPT09IFwieWllbGRcIikge1xuICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRva2VuKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5TaG9ydGhhbmRQcm9wZXJ0eShtZXRob2RPcktleS52YWx1ZSksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gRGF0YVByb3BlcnR5XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNPTE9OKTtcbiAgICBpZiAobWV0aG9kT3JLZXkudHlwZSA9PT0gXCJTdGF0aWNQcm9wZXJ0eU5hbWVcIikge1xuICAgICAgaWYgKG1ldGhvZE9yS2V5LnZhbHVlID09PSBcIl9fcHJvdG9fX1wiKSB7XG4gICAgICAgIGlmICghaGFzX19wcm90b19fWzBdKSB7XG4gICAgICAgICAgaGFzX19wcm90b19fWzBdID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLkRVUExJQ0FURV9QUk9UT19QUk9QRVJUWSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5EYXRhUHJvcGVydHkoXG4gICAgICAgIG1ldGhvZE9yS2V5LFxuICAgICAgICB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKSksXG4gICAgICBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlUHJvcGVydHlOYW1lKCkge1xuICAgIC8vIFByb3BlcnR5TmFtZVtZaWVsZCxHZW5lcmF0b3JQYXJhbWV0ZXJdOlxuICAgIGxldCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuXG4gICAgaWYgKHRoaXMuZW9mKCkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0b2tlbik7XG4gICAgfVxuXG4gICAgc3dpdGNoICh0b2tlbi50eXBlKSB7XG4gICAgICBjYXNlIFRva2VuVHlwZS5TVFJJTkc6XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuU3RhdGljUHJvcGVydHlOYW1lKHRoaXMucGFyc2VTdHJpbmdMaXRlcmFsKCkudmFsdWUpLCBzdGFydExvY2F0aW9uKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk5VTUJFUjpcbiAgICAgICAgbGV0IG51bUxpdGVyYWwgPSB0aGlzLnBhcnNlTnVtZXJpY0xpdGVyYWwoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5TdGF0aWNQcm9wZXJ0eU5hbWUoXCJcIiArIChudW1MaXRlcmFsLnR5cGUgPT09IFwiTGl0ZXJhbEluZmluaXR5RXhwcmVzc2lvblwiID8gMSAvIDAgOiBudW1MaXRlcmFsLnZhbHVlKSksIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgY2FzZSBUb2tlblR5cGUuTEJSQUNLOlxuICAgICAgICBsZXQgcHJldmlvdXNZaWVsZCA9IHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb247XG4gICAgICAgIGlmICh0aGlzLmluR2VuZXJhdG9yUGFyYW1ldGVyKSB7XG4gICAgICAgICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MQlJBQ0spO1xuICAgICAgICBsZXQgZXhwciA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUkJSQUNLKTtcbiAgICAgICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IHByZXZpb3VzWWllbGQ7XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQ29tcHV0ZWRQcm9wZXJ0eU5hbWUoZXhwciksIHN0YXJ0TG9jYXRpb24pO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuU3RhdGljUHJvcGVydHlOYW1lKHRoaXMucGFyc2VJZGVudGlmaWVyTmFtZSgpKSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICAvKipcbiAgICogVGVzdCBpZiBsb29rYWhlYWQgY2FuIGJlIHRoZSBiZWdpbm5pbmcgb2YgYSBgUHJvcGVydHlOYW1lYC5cbiAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAqL1xuICBsb29rYWhlYWRQcm9wZXJ0eU5hbWUoKSB7XG4gICAgc3dpdGNoICh0aGlzLmxvb2thaGVhZC50eXBlKSB7XG4gICAgICBjYXNlIFRva2VuVHlwZS5OVU1CRVI6XG4gICAgICBjYXNlIFRva2VuVHlwZS5TVFJJTkc6XG4gICAgICBjYXNlIFRva2VuVHlwZS5MQlJBQ0s6XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHRoaXMubG9va2FoZWFkLnR5cGUua2xhc3MuaXNJZGVudGlmaWVyTmFtZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVHJ5IHRvIHBhcnNlIGEgbWV0aG9kIGRlZmluaXRpb24uXG4gICAqXG4gICAqIElmIGl0IHR1cm5zIG91dCB0byBiZSBvbmUgb2Y6XG4gICAqICAqIGBJZGVudGlmaWVyUmVmZXJlbmNlYFxuICAgKiAgKiBgQ292ZXJJbml0aWFsaXplZE5hbWVgIChgSWRlbnRpZmllclJlZmVyZW5jZSBcIj1cIiBBc3NpZ25tZW50RXhwcmVzc2lvbmApXG4gICAqICAqIGBQcm9wZXJ0eU5hbWUgOiBBc3NpZ25tZW50RXhwcmVzc2lvbmBcbiAgICogVGhlIHRoZSBwYXJzZXIgd2lsbCBzdG9wIGF0IHRoZSBlbmQgb2YgdGhlIGxlYWRpbmcgYElkZW50aWZpZXJgIG9yIGBQcm9wZXJ0eU5hbWVgIGFuZCByZXR1cm4gaXQuXG4gICAqXG4gICAqIEByZXR1cm5zIHt7bWV0aG9kT3JLZXk6IChTaGlmdC5NZXRob2R8U2hpZnQuUHJvcGVydHlOYW1lKSwga2luZDogc3RyaW5nfX1cbiAgICovXG4gIHBhcnNlTWV0aG9kRGVmaW5pdGlvbihpc0NsYXNzUHJvdG9NZXRob2QpIHtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcblxuICAgIGxldCBpc0dlbmVyYXRvciA9ICEhdGhpcy5lYXQoVG9rZW5UeXBlLk1VTCk7XG5cbiAgICBsZXQga2V5ID0gdGhpcy5wYXJzZVByb3BlcnR5TmFtZSgpO1xuXG4gICAgaWYgKCFpc0dlbmVyYXRvciAmJiB0b2tlbi50eXBlID09PSBUb2tlblR5cGUuSURFTlRJRklFUikge1xuICAgICAgbGV0IG5hbWUgPSB0b2tlbi52YWx1ZTtcbiAgICAgIGlmIChuYW1lLmxlbmd0aCA9PT0gMykge1xuICAgICAgICAvLyBQcm9wZXJ0eSBBc3NpZ25tZW50OiBHZXR0ZXIgYW5kIFNldHRlci5cbiAgICAgICAgaWYgKG5hbWUgPT09IFwiZ2V0XCIgJiYgdGhpcy5sb29rYWhlYWRQcm9wZXJ0eU5hbWUoKSkge1xuICAgICAgICAgIGtleSA9IHRoaXMucGFyc2VQcm9wZXJ0eU5hbWUoKTtcbiAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTFBBUkVOKTtcbiAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcbiAgICAgICAgICBsZXQgcHJldmlvdXNJbkNvbnN0cnVjdG9yID0gdGhpcy5pbkNvbnN0cnVjdG9yO1xuICAgICAgICAgIHRoaXMuaW5Db25zdHJ1Y3RvciA9IGZhbHNlO1xuICAgICAgICAgIGxldCBwcmV2aW91c0luTWV0aG9kID0gdGhpcy5pbk1ldGhvZDtcbiAgICAgICAgICB0aGlzLmluTWV0aG9kID0gdHJ1ZTtcbiAgICAgICAgICBsZXQgW2JvZHldID0gdGhpcy5wYXJzZUZ1bmN0aW9uQm9keShbXSk7XG4gICAgICAgICAgdGhpcy5pbkNvbnN0cnVjdG9yID0gcHJldmlvdXNJbkNvbnN0cnVjdG9yO1xuICAgICAgICAgIHRoaXMuaW5NZXRob2QgPSBwcmV2aW91c0luTWV0aG9kO1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBtZXRob2RPcktleTogdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkdldHRlcihrZXksIGJvZHkpLCBzdGFydExvY2F0aW9uKSxcbiAgICAgICAgICAgIGtpbmQ6IFwibWV0aG9kXCJcbiAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2UgaWYgKG5hbWUgPT09IFwic2V0XCIgJiYgdGhpcy5sb29rYWhlYWRQcm9wZXJ0eU5hbWUoKSkge1xuICAgICAgICAgIGtleSA9IHRoaXMucGFyc2VQcm9wZXJ0eU5hbWUoKTtcbiAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTFBBUkVOKTtcbiAgICAgICAgICBsZXQgcGFyYW0gPSB0aGlzLnBhcnNlUGFyYW0oKTtcbiAgICAgICAgICBsZXQgaW5mbyA9IHt9O1xuICAgICAgICAgIHRoaXMuY2hlY2tQYXJhbShwYXJhbSwgdG9rZW4sIFtdLCBpbmZvKTtcbiAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcbiAgICAgICAgICBsZXQgcHJldmlvdXNZaWVsZCA9IHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb247XG4gICAgICAgICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IGZhbHNlO1xuICAgICAgICAgIGxldCBwcmV2aW91c0luQ29uc3RydWN0b3IgPSB0aGlzLmluQ29uc3RydWN0b3I7XG4gICAgICAgICAgdGhpcy5pbkNvbnN0cnVjdG9yID0gZmFsc2U7XG4gICAgICAgICAgbGV0IHByZXZpb3VzSW5NZXRob2QgPSB0aGlzLmluTWV0aG9kO1xuICAgICAgICAgIHRoaXMuaW5NZXRob2QgPSB0cnVlO1xuICAgICAgICAgIGxldCBib3VuZFBhcmFtcyA9IFBhcnNlci5ib3VuZE5hbWVzKHBhcmFtKTtcbiAgICAgICAgICBsZXQgW2JvZHksIGlzU3RyaWN0XSA9IHRoaXMucGFyc2VGdW5jdGlvbkJvZHkoYm91bmRQYXJhbXMpO1xuICAgICAgICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBwcmV2aW91c1lpZWxkO1xuICAgICAgICAgIHRoaXMuaW5Db25zdHJ1Y3RvciA9IHByZXZpb3VzSW5Db25zdHJ1Y3RvcjtcbiAgICAgICAgICB0aGlzLmluTWV0aG9kID0gcHJldmlvdXNJbk1ldGhvZDtcbiAgICAgICAgICBpZiAoaXNTdHJpY3QpIHtcbiAgICAgICAgICAgIGlmIChpbmZvLmZpcnN0UmVzdHJpY3RlZCkge1xuICAgICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKGluZm8uZmlyc3RSZXN0cmljdGVkLCBpbmZvLm1lc3NhZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbWV0aG9kT3JLZXk6IHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5TZXR0ZXIoa2V5LCBwYXJhbSwgYm9keSksIHN0YXJ0TG9jYXRpb24pLFxuICAgICAgICAgICAga2luZDogXCJtZXRob2RcIlxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuTFBBUkVOKSkge1xuICAgICAgbGV0IHByZXZpb3VzWWllbGQgPSB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uO1xuICAgICAgbGV0IHByZXZpb3VzSW5HZW5lcmF0b3JQYXJhbWV0ZXIgPSB0aGlzLmluR2VuZXJhdG9yUGFyYW1ldGVyO1xuICAgICAgdGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlciA9IGlzR2VuZXJhdG9yO1xuICAgICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IGlzR2VuZXJhdG9yO1xuICAgICAgbGV0IHBhcmFtSW5mbyA9IHRoaXMucGFyc2VQYXJhbXMobnVsbCk7XG4gICAgICB0aGlzLmluR2VuZXJhdG9yUGFyYW1ldGVyID0gcHJldmlvdXNJbkdlbmVyYXRvclBhcmFtZXRlcjtcbiAgICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBwcmV2aW91c1lpZWxkO1xuICAgICAgbGV0IHByZXZpb3VzSW5HZW5lcmF0b3JCb2R5ID0gdGhpcy5pbkdlbmVyYXRvckJvZHk7XG4gICAgICBsZXQgcHJldmlvdXNJbkNvbnN0cnVjdG9yID0gdGhpcy5pbkNvbnN0cnVjdG9yO1xuICAgICAgbGV0IHByZXZpb3VzSW5NZXRob2QgPSB0aGlzLmluTWV0aG9kO1xuICAgICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IGlzR2VuZXJhdG9yO1xuICAgICAgdGhpcy5pbkNvbnN0cnVjdG9yID1cbiAgICAgICAgaXNDbGFzc1Byb3RvTWV0aG9kICYmICFpc0dlbmVyYXRvciAmJiB0aGlzLmhhc0NsYXNzSGVyaXRhZ2UgJiZcbiAgICAgICAga2V5LnR5cGUgPT09IFwiU3RhdGljUHJvcGVydHlOYW1lXCIgJiYga2V5LnZhbHVlID09PSBcImNvbnN0cnVjdG9yXCI7XG4gICAgICB0aGlzLmluTWV0aG9kID0gdHJ1ZTtcblxuICAgICAgaWYgKGlzR2VuZXJhdG9yKSB7XG4gICAgICAgIHRoaXMuaW5HZW5lcmF0b3JCb2R5ID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGxldCBib3VuZFBhcmFtcyA9IFtdLmNvbmNhdC5hcHBseShbXSwgcGFyYW1JbmZvLnBhcmFtcy5tYXAoUGFyc2VyLmJvdW5kTmFtZXMpKTtcbiAgICAgIGxldCBbYm9keV0gPSB0aGlzLnBhcnNlRnVuY3Rpb25Cb2R5KGJvdW5kUGFyYW1zKTtcbiAgICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBwcmV2aW91c1lpZWxkO1xuICAgICAgdGhpcy5pbkdlbmVyYXRvckJvZHkgPSBwcmV2aW91c0luR2VuZXJhdG9yQm9keTtcbiAgICAgIHRoaXMuaW5Db25zdHJ1Y3RvciA9IHByZXZpb3VzSW5Db25zdHJ1Y3RvcjtcbiAgICAgIHRoaXMuaW5NZXRob2QgPSBwcmV2aW91c0luTWV0aG9kO1xuXG4gICAgICBpZiAocGFyYW1JbmZvLmZpcnN0UmVzdHJpY3RlZCkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHBhcmFtSW5mby5maXJzdFJlc3RyaWN0ZWQsIHBhcmFtSW5mby5tZXNzYWdlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB7XG4gICAgICAgIG1ldGhvZE9yS2V5OiB0aGlzLm1hcmtMb2NhdGlvbihcbiAgICAgICAgICBuZXcgU2hpZnQuTWV0aG9kKGlzR2VuZXJhdG9yLCBrZXksIHBhcmFtSW5mby5wYXJhbXMsIHBhcmFtSW5mby5yZXN0LCBib2R5KSwgc3RhcnRMb2NhdGlvbiksXG4gICAgICAgIGtpbmQ6IFwibWV0aG9kXCJcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIG1ldGhvZE9yS2V5OiBrZXksXG4gICAgICBraW5kOiB0b2tlbi50eXBlLmtsYXNzLmlzSWRlbnRpZmllck5hbWUgPyBcImlkZW50aWZpZXJcIiA6IFwicHJvcGVydHlcIlxuICAgIH07XG4gIH1cblxuICBwYXJzZUNsYXNzKHtpc0V4cHIsIGluRGVmYXVsdCA9IGZhbHNlfSkge1xuICAgIGxldCBsb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuQ0xBU1MpO1xuICAgIGxldCBpZCA9IG51bGw7XG4gICAgbGV0IGhlcml0YWdlID0gbnVsbDtcblxuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5JREVOVElGSUVSKSkge1xuICAgICAgbGV0IGlkTG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgICBpZCA9IHRoaXMucGFyc2VCaW5kaW5nSWRlbnRpZmllcigpO1xuICAgIH0gZWxzZSBpZiAoIWlzRXhwcikge1xuICAgICAgaWYgKGluRGVmYXVsdCkge1xuICAgICAgICBpZCA9IHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJCaW5kaW5nSWRlbnRpZmllclwiLCBuYW1lOiBcIipkZWZhdWx0KlwiIH0sIGxvY2F0aW9uKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IHByZXZpb3VzSW5HZW5lcmF0b3JQYXJhbWV0ZXIgPSB0aGlzLmluR2VuZXJhdG9yUGFyYW1ldGVyO1xuICAgIGxldCBwcmV2aW91c1BhcmFtWWllbGQgPSB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uO1xuICAgIGxldCBwcmV2aW91c0hhc0NsYXNzSGVyaXRhZ2UgPSB0aGlzLmhhc0NsYXNzSGVyaXRhZ2U7XG4gICAgaWYgKGlzRXhwcikge1xuICAgICAgdGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlciA9IGZhbHNlO1xuICAgICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IGZhbHNlO1xuICAgIH1cbiAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLkVYVEVORFMpKSB7XG4gICAgICBoZXJpdGFnZSA9IHRoaXMucGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uKHthbGxvd0NhbGw6IHRydWV9KTtcbiAgICB9XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTEJSQUNFKTtcbiAgICBsZXQgb3JpZ2luYWxTdHJpY3QgPSB0aGlzLnN0cmljdDtcbiAgICB0aGlzLnN0cmljdCA9IHRydWU7XG4gICAgbGV0IG1ldGhvZHMgPSBbXTtcbiAgICBsZXQgaGFzQ29uc3RydWN0b3IgPSBmYWxzZTtcbiAgICB0aGlzLmhhc0NsYXNzSGVyaXRhZ2UgPSBoZXJpdGFnZSAhPSBudWxsO1xuICAgIHdoaWxlICghdGhpcy5lYXQoVG9rZW5UeXBlLlJCUkFDRSkpIHtcbiAgICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuU0VNSUNPTE9OKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGxldCBtZXRob2RUb2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgICAgbGV0IGlzU3RhdGljID0gZmFsc2U7XG4gICAgICBsZXQge21ldGhvZE9yS2V5LCBraW5kfSA9IHRoaXMucGFyc2VNZXRob2REZWZpbml0aW9uKHRydWUpO1xuICAgICAgaWYgKGtpbmQgPT09IFwiaWRlbnRpZmllclwiICYmIG1ldGhvZE9yS2V5LnZhbHVlID09PSBcInN0YXRpY1wiKSB7XG4gICAgICAgIGlzU3RhdGljID0gdHJ1ZTtcbiAgICAgICAgKHttZXRob2RPcktleSwga2luZH0gPSB0aGlzLnBhcnNlTWV0aG9kRGVmaW5pdGlvbihmYWxzZSkpO1xuICAgICAgfVxuICAgICAgc3dpdGNoIChraW5kKSB7XG4gICAgICAgIGNhc2UgXCJtZXRob2RcIjpcbiAgICAgICAgICBsZXQga2V5ID0gbWV0aG9kT3JLZXkubmFtZTtcbiAgICAgICAgICBpZiAoIWlzU3RhdGljKSB7XG4gICAgICAgICAgICBpZiAoa2V5LnR5cGUgPT09IFwiU3RhdGljUHJvcGVydHlOYW1lXCIgJiYga2V5LnZhbHVlID09PSBcImNvbnN0cnVjdG9yXCIpIHtcbiAgICAgICAgICAgICAgaWYgKG1ldGhvZE9yS2V5LnR5cGUgIT09IFwiTWV0aG9kXCIgfHwgbWV0aG9kT3JLZXkuaXNHZW5lcmF0b3IpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKG1ldGhvZFRva2VuLCBcIkNvbnN0cnVjdG9ycyBjYW5ub3QgYmUgZ2VuZXJhdG9ycywgZ2V0dGVycyBvciBzZXR0ZXJzXCIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChoYXNDb25zdHJ1Y3Rvcikge1xuICAgICAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24obWV0aG9kVG9rZW4sIFwiT25seSBvbmUgY29uc3RydWN0b3IgaXMgYWxsb3dlZCBpbiBhIGNsYXNzXCIpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGhhc0NvbnN0cnVjdG9yID0gdHJ1ZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoa2V5LnR5cGUgPT09IFwiU3RhdGljUHJvcGVydHlOYW1lXCIgJiYga2V5LnZhbHVlID09PSBcInByb3RvdHlwZVwiKSB7XG4gICAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24obWV0aG9kVG9rZW4sIFwiU3RhdGljIGNsYXNzIG1ldGhvZHMgY2Fubm90IGJlIG5hbWVkICdwcm90b3R5cGUnXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBtZXRob2RzLnB1c2gobmV3IFNoaWZ0LkNsYXNzRWxlbWVudChpc1N0YXRpYywgbWV0aG9kT3JLZXkpKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKFwiT25seSBtZXRob2RzIGFyZSBhbGxvd2VkIGluIGNsYXNzZXNcIik7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghaXNFeHByKSB7XG4gICAgICB0aGlzLlZETltcIiRcIiArIGlkLm5hbWVdID0gdHJ1ZTtcbiAgICB9XG4gICAgdGhpcy5zdHJpY3QgPSBvcmlnaW5hbFN0cmljdDtcbiAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gcHJldmlvdXNQYXJhbVlpZWxkO1xuICAgIHRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXIgPSBwcmV2aW91c0luR2VuZXJhdG9yUGFyYW1ldGVyO1xuICAgIHRoaXMuaGFzQ2xhc3NIZXJpdGFnZSA9IHByZXZpb3VzSGFzQ2xhc3NIZXJpdGFnZTtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IChpc0V4cHIgPyBTaGlmdC5DbGFzc0V4cHJlc3Npb24gOiBTaGlmdC5DbGFzc0RlY2xhcmF0aW9uKShpZCwgaGVyaXRhZ2UsIG1ldGhvZHMpLCBsb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZUZ1bmN0aW9uKHtpc0V4cHIsIGlzVG9wTGV2ZWwsIGluRGVmYXVsdCA9IGZhbHNlLCBhbGxvd0dlbmVyYXRvciA9IHRydWV9KSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuRlVOQ1RJT04pO1xuXG4gICAgbGV0IGlkID0gbnVsbDtcbiAgICBsZXQgbWVzc2FnZSA9IG51bGw7XG4gICAgbGV0IGZpcnN0UmVzdHJpY3RlZCA9IG51bGw7XG4gICAgbGV0IGlzR2VuZXJhdG9yID0gYWxsb3dHZW5lcmF0b3IgJiYgISF0aGlzLmVhdChUb2tlblR5cGUuTVVMKTtcbiAgICBsZXQgcHJldmlvdXNHZW5lcmF0b3JQYXJhbWV0ZXIgPSB0aGlzLmluR2VuZXJhdG9yUGFyYW1ldGVyO1xuICAgIGxldCBwcmV2aW91c1lpZWxkID0gdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbjtcbiAgICBsZXQgcHJldmlvdXNJbkdlbmVyYXRvckJvZHkgPSB0aGlzLmluR2VuZXJhdG9yQm9keTtcblxuICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuTFBBUkVOKSkge1xuICAgICAgbGV0IHRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgICBsZXQgaWRlbnRpZmllckxvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgICAgaWQgPSB0aGlzLnBhcnNlSWRlbnRpZmllcigpO1xuICAgICAgaWYgKHRoaXMuc3RyaWN0IHx8IGlzR2VuZXJhdG9yKSB7XG4gICAgICAgIGlmIChpc1Jlc3RyaWN0ZWRXb3JkKGlkKSkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuU1RSSUNUX0ZVTkNUSU9OX05BTUUpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoaXNSZXN0cmljdGVkV29yZChpZCkpIHtcbiAgICAgICAgICBmaXJzdFJlc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgICBtZXNzYWdlID0gRXJyb3JNZXNzYWdlcy5TVFJJQ1RfRlVOQ1RJT05fTkFNRTtcbiAgICAgICAgfSBlbHNlIGlmIChpc1N0cmljdE1vZGVSZXNlcnZlZFdvcmRFUzUoaWQpKSB7XG4gICAgICAgICAgZmlyc3RSZXN0cmljdGVkID0gdG9rZW47XG4gICAgICAgICAgbWVzc2FnZSA9IEVycm9yTWVzc2FnZXMuU1RSSUNUX1JFU0VSVkVEX1dPUkQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlkID0gdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIkJpbmRpbmdJZGVudGlmaWVyXCIsIG5hbWU6IGlkIH0sIGlkZW50aWZpZXJMb2NhdGlvbik7XG4gICAgfSBlbHNlIGlmICghaXNFeHByKSB7XG4gICAgICBpZiAoaW5EZWZhdWx0KSB7XG4gICAgICAgIGlkID0gdGhpcy5tYXJrTG9jYXRpb24oe3R5cGU6IFwiQmluZGluZ0lkZW50aWZpZXJcIiwgbmFtZTogXCIqZGVmYXVsdCpcIiB9LCBzdGFydExvY2F0aW9uKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXIgPSBpc0dlbmVyYXRvcjtcbiAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gaXNHZW5lcmF0b3I7XG4gICAgbGV0IGluZm8gPSB0aGlzLnBhcnNlUGFyYW1zKGZpcnN0UmVzdHJpY3RlZCk7XG4gICAgdGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlciA9IHByZXZpb3VzR2VuZXJhdG9yUGFyYW1ldGVyO1xuICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBwcmV2aW91c1lpZWxkO1xuXG4gICAgaWYgKGluZm8ubWVzc2FnZSAhPSBudWxsKSB7XG4gICAgICBtZXNzYWdlID0gaW5mby5tZXNzYWdlO1xuICAgIH1cblxuICAgIGxldCBwcmV2aW91c1N0cmljdCA9IHRoaXMuc3RyaWN0O1xuICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBpc0dlbmVyYXRvcjtcbiAgICBpZiAoaXNHZW5lcmF0b3IpIHtcbiAgICAgIHRoaXMuaW5HZW5lcmF0b3JCb2R5ID0gdHJ1ZTtcbiAgICB9XG4gICAgbGV0IHByZXZpb3VzSW5Db25zdHJ1Y3RvciA9IHRoaXMuaW5Db25zdHJ1Y3RvcjtcbiAgICB0aGlzLmluQ29uc3RydWN0b3IgPSBmYWxzZTtcbiAgICBsZXQgcHJldmlvdXNJbk1ldGhvZCA9IHRoaXMuaW5NZXRob2Q7XG4gICAgdGhpcy5pbk1ldGhvZCA9IGZhbHNlO1xuICAgIGxldCBib3VuZFBhcmFtcyA9IFtdLmNvbmNhdC5hcHBseShbXSwgaW5mby5wYXJhbXMubWFwKFBhcnNlci5ib3VuZE5hbWVzKSk7XG4gICAgbGV0IFtib2R5LCBpc1N0cmljdF0gPSB0aGlzLnBhcnNlRnVuY3Rpb25Cb2R5KGJvdW5kUGFyYW1zKTtcbiAgICB0aGlzLmluR2VuZXJhdG9yQm9keSA9IHByZXZpb3VzSW5HZW5lcmF0b3JCb2R5O1xuICAgIHRoaXMuaW5Db25zdHJ1Y3RvciA9IHByZXZpb3VzSW5Db25zdHJ1Y3RvcjtcbiAgICB0aGlzLmluTWV0aG9kID0gcHJldmlvdXNJbk1ldGhvZDtcblxuICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBwcmV2aW91c1lpZWxkO1xuICAgIGlmIChtZXNzYWdlICE9IG51bGwpIHtcbiAgICAgIGlmICgodGhpcy5zdHJpY3QgfHwgaXNTdHJpY3QpICYmIGluZm8uZmlyc3RSZXN0cmljdGVkICE9IG51bGwpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbihpbmZvLmZpcnN0UmVzdHJpY3RlZCwgbWVzc2FnZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuc3RyaWN0ID0gcHJldmlvdXNTdHJpY3Q7XG4gICAgbGV0IEN0b3IgPSBpc0V4cHIgPyBTaGlmdC5GdW5jdGlvbkV4cHJlc3Npb24gOiBTaGlmdC5GdW5jdGlvbkRlY2xhcmF0aW9uO1xuICAgIGlmICghaXNFeHByKSB7XG4gICAgICBpZiAoaXNUb3BMZXZlbCkge1xuICAgICAgICB0aGlzLlZETltcIiRcIiArIGlkLm5hbWVdID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuTEROLnB1c2goaWQubmFtZSk7XG4gICAgICB9XG5cbiAgICB9XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKFxuICAgICAgbmV3IEN0b3IoaXNHZW5lcmF0b3IsIGlkLCBpbmZvLnBhcmFtcywgaW5mby5yZXN0LCBib2R5KSxcbiAgICAgIHN0YXJ0TG9jYXRpb25cbiAgICApO1xuICB9XG5cbiAgcGFyc2VQYXJhbSgpIHtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICBsZXQgb3JpZ2luYWxJblBhcmFtZXRlciA9IHRoaXMuaW5QYXJhbWV0ZXI7XG4gICAgdGhpcy5pblBhcmFtZXRlciA9IHRydWU7XG4gICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkxQQVJFTikpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgfVxuICAgIGxldCBwYXJhbSA9IHRoaXMucGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uKHthbGxvd0NhbGw6IGZhbHNlfSk7XG4gICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5BU1NJR04pKSB7XG4gICAgICBsZXQgcHJldmlvdXNJbkdlbmVyYXRvclBhcmFtZXRlciA9IHRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXI7XG4gICAgICBsZXQgcHJldmlvdXNZaWVsZEV4cHJlc3Npb24gPSB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uO1xuICAgICAgaWYgKHRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXIpIHtcbiAgICAgICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgdGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlciA9IGZhbHNlO1xuICAgICAgcGFyYW0gPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQXNzaWdubWVudEV4cHJlc3Npb24oXCI9XCIsIHBhcmFtLCB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKSkpO1xuICAgICAgdGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlciA9IHByZXZpb3VzSW5HZW5lcmF0b3JQYXJhbWV0ZXI7XG4gICAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gcHJldmlvdXNZaWVsZEV4cHJlc3Npb247XG4gICAgfVxuICAgIGlmICghUGFyc2VyLmlzRGVzdHJ1Y3R1cmluZ1RhcmdldFdpdGhEZWZhdWx0KHBhcmFtLCB7aXNBc3NpZ25tZW50OiBmYWxzZX0pKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodG9rZW4pO1xuICAgIH1cbiAgICB0aGlzLmluUGFyYW1ldGVyID0gb3JpZ2luYWxJblBhcmFtZXRlcjtcbiAgICByZXR1cm4gUGFyc2VyLnRyYW5zZm9ybURlc3RydWN0dXJpbmcocGFyYW0pO1xuICB9XG5cbiAgY2hlY2tQYXJhbShwYXJhbSwgdG9rZW4sIGJvdW5kLCBpbmZvKSB7XG4gICAgbGV0IG5ld0JvdW5kID0gUGFyc2VyLmJvdW5kTmFtZXMocGFyYW0pO1xuICAgIFtdLnB1c2guYXBwbHkoYm91bmQsIG5ld0JvdW5kKTtcblxuICAgIGlmIChmaXJzdER1cGxpY2F0ZShuZXdCb3VuZCkgIT0gbnVsbCkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5EVVBMSUNBVEVfQklORElORywgZmlyc3REdXBsaWNhdGUobmV3Qm91bmQpKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5zdHJpY3QpIHtcbiAgICAgIGlmIChuZXdCb3VuZC5zb21lKGlzUmVzdHJpY3RlZFdvcmQpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuU1RSSUNUX1BBUkFNX05BTUUpO1xuICAgICAgfSBlbHNlIGlmIChmaXJzdER1cGxpY2F0ZShib3VuZCkgIT0gbnVsbCkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLlNUUklDVF9QQVJBTV9EVVBFKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGluZm8uZmlyc3RSZXN0cmljdGVkID09IG51bGwpIHtcbiAgICAgIGlmIChuZXdCb3VuZC5zb21lKGlzUmVzdHJpY3RlZFdvcmQpKSB7XG4gICAgICAgIGluZm8uZmlyc3RSZXN0cmljdGVkID0gdG9rZW47XG4gICAgICAgIGluZm8ubWVzc2FnZSA9IEVycm9yTWVzc2FnZXMuU1RSSUNUX1BBUkFNX05BTUU7XG4gICAgICB9IGVsc2UgaWYgKGhhc1N0cmljdE1vZGVSZXNlcnZlZFdvcmQobmV3Qm91bmQpKSB7XG4gICAgICAgIGluZm8uZmlyc3RSZXN0cmljdGVkID0gdG9rZW47XG4gICAgICAgIGluZm8ubWVzc2FnZSA9IEVycm9yTWVzc2FnZXMuU1RSSUNUX1JFU0VSVkVEX1dPUkQ7XG4gICAgICB9IGVsc2UgaWYgKGZpcnN0RHVwbGljYXRlKGJvdW5kKSAhPSBudWxsKSB7XG4gICAgICAgIGluZm8uZmlyc3RSZXN0cmljdGVkID0gdG9rZW47XG4gICAgICAgIGluZm8ubWVzc2FnZSA9IEVycm9yTWVzc2FnZXMuU1RSSUNUX1BBUkFNX0RVUEU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcGFyc2VQYXJhbXMoZnIpIHtcbiAgICBsZXQgaW5mbyA9IHtwYXJhbXM6IFtdLCByZXN0OiBudWxsfSwgaXNTaW1wbGVQYXJhbWV0ZXIgPSB0cnVlO1xuICAgIGluZm8uZmlyc3RSZXN0cmljdGVkID0gZnI7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG5cbiAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJQQVJFTikpIHtcbiAgICAgIGxldCBib3VuZCA9IFtdO1xuICAgICAgbGV0IHNlZW5SZXN0ID0gZmFsc2U7XG5cbiAgICAgIHdoaWxlICghdGhpcy5lb2YoKSkge1xuICAgICAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICAgICAgbGV0IHBhcmFtO1xuICAgICAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLkVMTElQU0lTKSkge1xuICAgICAgICAgIGlzU2ltcGxlUGFyYW1ldGVyID0gZmFsc2U7XG4gICAgICAgICAgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICAgICAgICBwYXJhbSA9IHRoaXMucGFyc2VCaW5kaW5nSWRlbnRpZmllcigpO1xuICAgICAgICAgIHNlZW5SZXN0ID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwYXJhbSA9IHRoaXMucGFyc2VQYXJhbSgpO1xuICAgICAgICAgIGlmIChwYXJhbS50eXBlICE9PSBcIkJpbmRpbmdJZGVudGlmaWVyXCIpIHtcbiAgICAgICAgICAgIGlzU2ltcGxlUGFyYW1ldGVyID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jaGVja1BhcmFtKHBhcmFtLCB0b2tlbiwgYm91bmQsIGluZm8pO1xuXG4gICAgICAgIGlmIChzZWVuUmVzdCkge1xuICAgICAgICAgIGluZm8ucmVzdCA9IHBhcmFtO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGluZm8ucGFyYW1zLnB1c2gocGFyYW0pO1xuICAgICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuUlBBUkVOKSkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5DT01NQSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFpc1NpbXBsZVBhcmFtZXRlcikge1xuICAgICAgaWYgKGluZm8ubWVzc2FnZSA9PT0gRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUEFSQU1fRFVQRSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKGluZm8ubWVzc2FnZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJQQVJFTik7XG4gICAgcmV0dXJuIGluZm87XG4gIH1cbn1cbiJdfQ==