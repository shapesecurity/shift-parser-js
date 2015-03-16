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
  }

  _inherits(Parser, Tokenizer);

  _prototypeProperties(Parser, {
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
    getExpr: {
      value: function getExpr(_ref) {
        var expr = _ref.expr;
        var exprError = _ref.exprError;
        if (!expr) throw exprError;
        return expr;
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
        return this.markLocation({ type: "Module", items: items }, location);
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
        return this.markLocation({ type: "Script", body: body }, location);
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
                directives.push(_this.markLocation({ type: "Directive", rawValue: text.slice(1, -1) }, directiveLocation));
              } else {
                parsingDirectives = false;
                statements.push(stmt);
              }
            } else {
              statements.push(stmt);
            }
          }
        }, function () {});
        return [this.markLocation({ type: "FunctionBody", directives: directives, statements: statements }, location), isStrict];
      },
      writable: true,
      configurable: true
    },
    parseImportSpecifier: {
      value: function parseImportSpecifier(boundNames) {
        var startLocation = this.getLocation(),
            name = undefined;
        if (this.lookahead.type === TokenType.IDENTIFIER) {
          name = this.parseIdentifier();
          if (!this.eatContextualKeyword("as")) {
            if (({}).hasOwnProperty.call(boundNames, "$" + name)) {
              throw this.createErrorWithLocation(startLocation, ErrorMessages.IMPORT_DUPE);
            }
            boundNames["$" + name] = true;
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
        if (({}).hasOwnProperty.call(boundNames, "$" + boundName)) {
          throw this.createErrorWithLocation(location, ErrorMessages.IMPORT_DUPE);
        }
        boundNames["$" + boundName] = true;
        return this.markLocation({
          type: "ImportSpecifier",
          name: name,
          binding: this.markLocation({ type: "BindingIdentifier", name: boundName }, location) }, startLocation);
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
            return this.markLocation({ type: "Import", defaultBinding: null, namedImports: [], moduleSpecifier: moduleSpecifier }, startLocation);
          case TokenType.IDENTIFIER:
            defaultBinding = this.parseBindingIdentifier();
            boundNames["$" + defaultBinding.name] = true;
            if (!this.eat(TokenType.COMMA)) {
              return this.markLocation({ type: "Import", defaultBinding: defaultBinding, namedImports: [], moduleSpecifier: this.parseFromClause() }, startLocation);
            }
            break;
        }
        if (this.match(TokenType.MUL)) {
          return this.markLocation({
            type: "ImportNamespace",
            defaultBinding: defaultBinding,
            namespaceBinding: this.parseNameSpaceBinding(boundNames),
            moduleSpecifier: this.parseFromClause() }, startLocation);
        } else if (this.match(TokenType.LBRACE)) {
          return this.markLocation({
            type: "Import",
            defaultBinding: defaultBinding,
            namedImports: this.parseNamedImports(boundNames),
            moduleSpecifier: this.parseFromClause() }, startLocation);
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
          return this.markLocation({ type: "ExportSpecifier", name: name, exportedName: exportedName }, startLocation);
        } else {
          if (({}).hasOwnProperty.call(exportedNames, "$" + name)) {
            throw this.createError(ErrorMessages.DUPLICATE_EXPORTED_NAME, name);
          }
          exportedNames["$" + name] = true;
        }
        return this.markLocation({ type: "ExportSpecifier", name: null, exportedName: name }, startLocation);
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
            decl = { type: "ExportAllFrom", moduleSpecifier: this.parseFromClause() };
            break;
          case TokenType.LBRACE:
            // export ExportClause FromClause ;
            // export ExportClause ;
            var namedExports = this.parseExportClause(exportedNames, exportedBindings);
            var moduleSpecifier = null;
            if (this.matchContextualKeyword("from")) {
              moduleSpecifier = this.parseFromClause();
            }
            decl = { type: "ExportFrom", namedExports: namedExports, moduleSpecifier: moduleSpecifier };
            break;
          case TokenType.CLASS:
            // export ClassDeclaration
            decl = { type: "Export", declaration: this.parseClass({ isExpr: false }) };
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
            decl = { type: "Export", declaration: this.parseFunction({ isExpr: false, isTopLevel: true }) };
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
                decl = {
                  type: "ExportDefault",
                  body: this.parseFunction({ isExpr: false, inDefault: true, isTopLevel: true })
                };
                key = decl.body.name.name;
                if (key !== "*default*") {
                  exportedBindings["$" + key] = true;
                  oldLDN.push(key);
                }
                break;
              case TokenType.CLASS:
                // export default ClassDeclaration[Default]
                decl = { type: "ExportDefault", body: this.parseClass({ isExpr: false, inDefault: true }) };
                key = decl.body.name.name;
                if (key !== "*default*") {
                  exportedBindings["$" + key] = true;
                  oldLDN.push(key);
                }
                break;
              default:
                {
                  // export default [lookahead ∉ {function, class}] AssignmentExpression[In] ;
                  decl = { type: "ExportDefault", body: this.parseAssignmentExpression() };
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
              decl = { type: "Export", declaration: this.parseVariableDeclaration({ boundNames: boundNames }) };
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
                return { type: "LabeledStatement", label: expr.name, body: labeledBody };
              } else {
                this.consumeSemicolon();
                return { type: "ExpressionStatement", expression: expr };
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
        return { type: "EmptyStatement" };
      },
      writable: true,
      configurable: true
    },
    parseBlockStatement: {
      value: function parseBlockStatement() {
        var stmt = { type: "BlockStatement", block: this.parseBlock() };
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
        return { type: "ExpressionStatement", expression: expr };
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

          return { type: "BreakStatement", label: null };
        }

        if (this.hasLineTerminatorBeforeNext) {
          if (!(this.inIteration || this.inSwitch)) {
            throw this.createErrorWithLocation(token, ErrorMessages.ILLEGAL_BREAK);
          }

          return { type: "BreakStatement", label: null };
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

        return { type: "BreakStatement", label: label };
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

          return { type: "ContinueStatement", label: null };
        }

        if (this.hasLineTerminatorBeforeNext) {
          if (!this.inIteration) {
            throw this.createErrorWithLocation(token, ErrorMessages.ILLEGAL_CONTINUE);
          }

          return { type: "ContinueStatement", label: null };
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

        return { type: "ContinueStatement", label: label };
      },
      writable: true,
      configurable: true
    },
    parseDebuggerStatement: {
      value: function parseDebuggerStatement() {
        this.expect(TokenType.DEBUGGER);
        this.consumeSemicolon();
        return { type: "DebuggerStatement" };
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

        return { type: "DoWhileStatement", body: body, test: test };
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
          return {
            type: "ForStatement",
            init: null,
            test: test,
            update: right,
            body: this.getIteratorStatementEpilogue()
          };
        } else {
          var startsWithLet = this.match(TokenType.LET) || this.match(TokenType.IDENTIFIER) && this.lookahead.value === "let";
          var isForDecl = this.lookaheadLexicalDeclaration();
          var leftLocation = this.getLocation();
          if (this.match(TokenType.VAR) || isForDecl) {
            var previousAllowIn = this.allowIn;
            this.allowIn = false;
            var init = this.parseVariableDeclaration({ inFor: true });
            this.allowIn = previousAllowIn;

            if (init.declarators.length === 1 && (this.match(TokenType.IN) || this.matchContextualKeyword("of"))) {
              var type = undefined;

              if (this.match(TokenType.IN)) {
                if (init.declarators[0].init != null) {
                  throw this.createError(ErrorMessages.INVALID_VAR_INIT_FOR_IN);
                }
                type = "ForInStatement";
                this.lex();
                right = this.parseExpression();
              } else {
                if (init.declarators[0].init != null) {
                  throw this.createError(ErrorMessages.INVALID_VAR_INIT_FOR_OF);
                }
                type = "ForOfStatement";
                for (var key in this.VDN) {
                  this.VDN[key] = FOR_OF_VAR;
                }

                this.lex();
                right = this.parseAssignmentExpression();
              }

              var body = this.wrapVDN(this.getIteratorStatementEpilogue, isForDecl && this.checkBlockScope);

              return { type: type, left: init, right: right, body: body };
            } else {
              this.expect(TokenType.SEMICOLON);
              if (!this.match(TokenType.SEMICOLON)) {
                test = this.parseExpression();
              }
              this.expect(TokenType.SEMICOLON);
              if (!this.match(TokenType.RPAREN)) {
                right = this.parseExpression();
              }
              return {
                type: "ForStatement",
                init: init,
                test: test,
                update: right,
                body: this.wrapVDN(this.getIteratorStatementEpilogue, isForDecl && this.checkBlockScope)
              };
            }
          } else {
            var previousAllowIn = this.allowIn;
            this.allowIn = false;
            var _parseAssignmentExpressionOrBindingElement = this.parseAssignmentExpressionOrBindingElement();

            var expr = _parseAssignmentExpressionOrBindingElement.expr;
            var pattern = _parseAssignmentExpressionOrBindingElement.pattern;
            var exprError = _parseAssignmentExpressionOrBindingElement.exprError;
            this.allowIn = previousAllowIn;

            if (pattern && (this.match(TokenType.IN) || this.matchContextualKeyword("of"))) {
              if (startsWithLet && this.matchContextualKeyword("of")) {
                throw this.createError(ErrorMessages.INVALID_VAR_LHS_FOR_OF);
              }
              var type = this.match(TokenType.IN) ? "ForInStatement" : "ForOfStatement";

              this.lex();
              right = this.parseExpression();

              return { type: type, left: pattern, right: right, body: this.getIteratorStatementEpilogue() };
            } else {
              if (!expr) {
                throw exprError;
              }
              while (this.eat(TokenType.COMMA)) {
                var rhs = this.parseAssignmentExpression();
                expr = this.markLocation({ type: "BinaryExpression", left: expr, operator: ",", right: rhs }, leftLocation);
              }
              if (this.match(TokenType.IN) || this.matchContextualKeyword("of")) {
                throw this.createError(ErrorMessages.INVALID_LHS_IN_FOR_IN);
              }
              this.expect(TokenType.SEMICOLON);
              if (!this.match(TokenType.SEMICOLON)) {
                test = this.parseExpression();
              }
              this.expect(TokenType.SEMICOLON);
              if (!this.match(TokenType.RPAREN)) {
                right = this.parseExpression();
              }
              return { type: "ForStatement", init: expr, test: test, update: right, body: this.getIteratorStatementEpilogue() };
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
        return { type: "IfStatement", test: test, consequent: consequent, alternate: alternate };
      },
      writable: true,
      configurable: true
    },
    parseReturnStatement: {
      value: function parseReturnStatement() {
        var expression = null;

        this.expect(TokenType.RETURN);
        if (!this.inFunctionBody) {
          throw this.createError(ErrorMessages.ILLEGAL_RETURN);
        }

        if (this.hasLineTerminatorBeforeNext) {
          return { type: "ReturnStatement", expression: expression };
        }

        if (!this.match(TokenType.SEMICOLON)) {
          if (!this.match(TokenType.RBRACE) && !this.eof()) {
            expression = this.parseExpression();
          }
        }

        this.consumeSemicolon();
        return { type: "ReturnStatement", expression: expression };
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

        return { type: "WithStatement", object: object, body: body };
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
          return { type: "SwitchStatement", discriminant: discriminant, cases: [] };
        }
        var oldInSwitch = this.inSwitch;
        this.inSwitch = true;
        return this.wrapVDN(function () {
          var cases = _this.parseSwitchCases();
          if (_this.match(TokenType.DEFAULT)) {
            var defaultCase = _this.parseSwitchDefault();
            var postDefaultCases = _this.parseSwitchCases();
            if (_this.match(TokenType.DEFAULT)) {
              throw _this.createError(ErrorMessages.MULTIPLE_DEFAULTS_IN_SWITCH);
            }
            _this.inSwitch = oldInSwitch;
            _this.expect(TokenType.RBRACE);
            return {
              type: "SwitchStatementWithDefault",
              discriminant: discriminant,
              preDefaultCases: cases,
              defaultCase: defaultCase,
              postDefaultCases: postDefaultCases
            };
          } else {
            _this.inSwitch = oldInSwitch;
            _this.expect(TokenType.RBRACE);
            return { type: "SwitchStatement", discriminant: discriminant, cases: cases };
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
        return this.markLocation({
          type: "SwitchCase",
          test: this.parseExpression(),
          consequent: this.parseSwitchCaseBody()
        }, startLocation);
      },
      writable: true,
      configurable: true
    },
    parseSwitchDefault: {
      value: function parseSwitchDefault() {
        var startLocation = this.getLocation();
        this.expect(TokenType.DEFAULT);
        return this.markLocation({ type: "SwitchDefault", consequent: this.parseSwitchCaseBody() }, startLocation);
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

        var expression = this.parseExpression();

        this.consumeSemicolon();

        return { type: "ThrowStatement", expression: expression };
      },
      writable: true,
      configurable: true
    },
    parseTryStatement: {
      value: function parseTryStatement() {
        this.expect(TokenType.TRY);
        var body = this.wrapVDN(this.parseBlock, this.checkBlockScope);

        if (this.match(TokenType.CATCH)) {
          var catchClause = this.parseCatchClause();
          if (this.eat(TokenType.FINALLY)) {
            var finalizer = this.wrapVDN(this.parseBlock, this.checkBlockScope);
            return { type: "TryFinallyStatement", body: body, catchClause: catchClause, finalizer: finalizer };
          }
          return { type: "TryCatchStatement", body: body, catchClause: catchClause };
        }

        if (this.eat(TokenType.FINALLY)) {
          var finalizer = this.wrapVDN(this.parseBlock, this.checkBlockScope);
          return { type: "TryFinallyStatement", body: body, catchClause: null, finalizer: finalizer };
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
        return { type: "VariableDeclarationStatement", declaration: declaration };
      },
      writable: true,
      configurable: true
    },
    parseWhileStatement: {
      value: function parseWhileStatement() {
        this.expect(TokenType.WHILE);
        this.expect(TokenType.LPAREN);
        return { type: "WhileStatement", test: this.parseExpression(), body: this.getIteratorStatementEpilogue() };
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

        var binding = this.parseBindingTarget();

        var bound = Parser.boundNames(binding);
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
        return this.markLocation({ type: "CatchClause", binding: binding, body: body }, startLocation);
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
        return this.markLocation({ type: "Block", statements: body }, startLocation);
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
        return this.markLocation({ type: "VariableDeclaration", kind: kind, declarators: declarators }, startLocation);
      },
      writable: true,
      configurable: true
    },
    parseVariableDeclaratorList: {
      value: function parseVariableDeclaratorList(kind, _ref) {
        var inFor = _ref.inFor;
        var boundNames = _ref.boundNames;
        var result = [];
        var _parseVariableDeclarator = this.parseVariableDeclarator(kind, { inFor: inFor, allowConstWithoutBinding: inFor });

        var _parseVariableDeclarator2 = _slicedToArray(_parseVariableDeclarator, 2);

        var varDecl = _parseVariableDeclarator2[0];
        var allBound = _parseVariableDeclarator2[1];
        result.push(varDecl);
        if (inFor && kind === "const" && varDecl.init === null) {
          return result;
        }

        while (this.eat(TokenType.COMMA)) {
          var _parseVariableDeclarator3 = this.parseVariableDeclarator(kind, { inFor: inFor, allowConstWithoutBinding: false });

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
        var inFor = _ref.inFor;
        var allowConstWithoutBinding = _ref.allowConstWithoutBinding;
        var startLocation = this.getLocation();
        var token = this.lookahead;

        if (this.match(TokenType.LPAREN)) {
          throw this.createUnexpected(this.lookahead);
        }

        var binding = this.parseBindingTarget();
        if (!inFor && binding.type !== "BindingIdentifier" && !this.match(TokenType.ASSIGN)) {
          this.expect(TokenType.ASSIGN);
        }
        var bound = Parser.boundNames(binding);

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
        return [this.markLocation({ type: "VariableDeclarator", binding: binding, init: init }, startLocation), bound];
      },
      writable: true,
      configurable: true
    },
    parseExpression: {
      value: function parseExpression() {
        var startLocation = this.getLocation();

        var group = this.parseAssignmentExpression();
        if (this.match(TokenType.COMMA)) {
          while (!this.eof()) {
            if (!this.match(TokenType.COMMA)) {
              break;
            }
            this.lex();
            var expr = this.parseAssignmentExpression();
            group = this.markLocation({ type: "BinaryExpression", left: group, operator: ",", right: expr }, startLocation);
          }
        }
        return group;
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
          if (head.type === "BindingIdentifier") {
            var _name = head.name;
            if (STRICT_MODE_RESERVED_WORD.hasOwnProperty(_name)) {
              throw this.createError(ErrorMessages.STRICT_RESERVED_WORD);
            }
            if (isRestrictedWord(_name)) {
              throw this.createError(ErrorMessages.STRICT_PARAM_NAME);
            }
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
        return Parser.getExpr(this.parseAssignmentExpressionOrBindingElement());
      },
      writable: true,
      configurable: true
    },
    parseAssignmentExpressionOrBindingElement: {
      value: function parseAssignmentExpressionOrBindingElement() {
        var token = this.lookahead;
        var startLocation = this.getLocation();

        if (this.allowYieldExpression && !this.inGeneratorParameter && this.lookahead.type === TokenType.YIELD) {
          return { expr: this.parseYieldExpression(), pattern: null, isBindingElement: false };
        }

        var _parseConditionalExpression = this.parseConditionalExpression();

        var expr = _parseConditionalExpression.expr;
        var pattern = _parseConditionalExpression.pattern;
        var isBindingElement = _parseConditionalExpression.isBindingElement;
        var exprError = _parseConditionalExpression.exprError;


        if (!this.hasLineTerminatorBeforeNext && this.match(TokenType.ARROW)) {
          return { expr: this.parseArrowExpressionTail(pattern, startLocation), pattern: null, isBindingElement: false };
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
          if (!pattern || !Parser.isValidSimpleAssignmentTarget(pattern)) {
            throw this.createError(ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
          }
          if (pattern.type === "BindingIdentifier") {
            if (this.strict && isRestrictedWord(pattern.name)) {
              throw this.createErrorWithLocation(token, ErrorMessages.STRICT_LHS_ASSIGNMENT);
            }
          }
        } else if (operator.type === TokenType.ASSIGN) {
          if (!pattern) {
            throw this.createError(ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
          }
          var bound = Parser.boundNames(pattern);
          if (this.strict && bound.some(isRestrictedWord)) {
            throw this.createErrorWithLocation(token, ErrorMessages.STRICT_LHS_ASSIGNMENT);
          }
        } else {
          return { expr: expr, pattern: pattern, isBindingElement: isBindingElement, exprError: exprError };
        }

        this.lex();
        var previousInGeneratorParameter = this.inGeneratorParameter;
        this.inGeneratorParameter = false;
        var rhs = this.parseAssignmentExpression();

        this.inGeneratorParameter = previousInGeneratorParameter;
        return {
          expr: pattern && this.markLocation({
            type: "AssignmentExpression",
            binding: pattern,
            operator: operator.type.name,
            expression: rhs
          }, startLocation),
          pattern: pattern && this.markLocation({
            type: "BindingWithDefault",
            binding: pattern,
            init: rhs
          }, startLocation),
          isBindingElement: isBindingElement,
          exprError: exprError
        };
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
          return this.markLocation({ type: "YieldExpression", expression: null }, startLocation);
        }
        var isGenerator = !!this.eat(TokenType.MUL);
        var previousYield = this.allowYieldExpression;
        var expr = null;
        if (isGenerator || this.lookaheadAssignmentExpression()) {
          expr = this.parseAssignmentExpression();
        }
        this.allowYieldExpression = previousYield;
        var type = isGenerator ? "YieldGeneratorExpression" : "YieldExpression";
        return this.markLocation({ type: type, expression: expr }, startLocation);
      },
      writable: true,
      configurable: true
    },
    parseConditionalExpression: {
      value: function parseConditionalExpression() {
        var startLocation = this.getLocation();
        var test = this.parseBinaryExpression();
        if (!test.expr) {
          return test;
        }if (this.eat(TokenType.CONDITIONAL)) {
          var previousAllowIn = this.allowIn;
          this.allowIn = true;
          var consequent = this.parseAssignmentExpression();
          this.allowIn = previousAllowIn;
          this.expect(TokenType.COLON);
          var alternate = this.parseAssignmentExpression();
          return {
            expr: this.markLocation({
              type: "ConditionalExpression",
              test: test.expr,
              consequent: consequent,
              alternate: alternate
            }, startLocation),
            pattern: null,
            isBindingElement: false,
            exprError: null
          };
        }

        return test;
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
        var unary = this.parseUnaryExpression();
        if (!unary.expr) {
          return unary;
        }

        var operator = this.lookahead.type;

        var isBinaryOperator = this.isBinaryOperator(operator);
        if (!isBinaryOperator) {
          return unary;
        }

        var left = unary.expr;

        this.lex();
        var stack = [];
        stack.push({ location: location, left: left, operator: operator, precedence: BinaryPrecedence[operator.name] });
        location = this.getLocation();
        var right = Parser.getExpr(this.parseUnaryExpression());
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

          right = Parser.getExpr(this.parseUnaryExpression());

          operator = this.lookahead.type;
          isBinaryOperator = this.isBinaryOperator(operator);
        }

        // Final reduce to clean-up the stack.
        return {
          expr: stack.reduceRight(function (expr, stackItem) {
            return _this.markLocation({
              type: "BinaryExpression",
              left: stackItem.left,
              operator: stackItem.operator.name,
              right: expr
            }, stackItem.location);
          }, right),
          pattern: null,
          isBindingElement: false,
          exprError: null
        };
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
        var expr = Parser.getExpr(this.parseUnaryExpression());
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

        return {
          expr: this.markLocation({ type: "PrefixExpression", operator: operator.value, operand: expr }, startLocation),
          pattern: null,
          isBindingElement: false,
          exprError: null };
      },
      writable: true,
      configurable: true
    },
    parsePostfixExpression: {
      value: function parsePostfixExpression() {
        var startLocation = this.getLocation();

        var lhs = this.parseLeftHandSideExpression({ allowCall: true });
        if (!lhs.expr) {
          return lhs;
        }if (this.hasLineTerminatorBeforeNext) {
          return lhs;
        }

        var operator = this.lookahead;
        if (operator.type !== TokenType.INC && operator.type !== TokenType.DEC) {
          return lhs;
        }

        var operand = Parser.getExpr(lhs);

        if (!Parser.isValidSimpleAssignmentTarget(operand)) {
          throw this.createError(ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
        }

        this.lex();

        // 11.3.1, 11.3.2;
        if (operand.type === "IdentifierExpression") {
          if (this.strict && isRestrictedWord(operand.name)) {
            throw this.createError(ErrorMessages.STRICT_LHS_POSTFIX);
          }
        }

        return {
          expr: this.markLocation({ type: "PostfixExpression", operand: operand, operator: operator.value }, startLocation),
          pattern: null,
          isBindingElement: false,
          exprError: null
        };
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
            pattern = undefined,
            isBindingElement = undefined,
            exprError = undefined,
            token = this.lookahead;

        if (this.eat(TokenType.SUPER)) {
          isBindingElement = false;
          expr = this.markLocation({ type: "Super" }, startLocation);
          if (this.match(TokenType.LPAREN)) {
            if (allowCall) {
              if (this.inConstructor && !this.inParameter) {
                expr = this.markLocation({
                  type: "CallExpression",
                  callee: expr,
                  arguments: this.parseArgumentList()
                }, startLocation);
              } else {
                throw this.createErrorWithLocation(startLocation, ErrorMessages.UNEXPECTED_SUPER_CALL);
              }
            } else {
              throw this.createUnexpected(token);
            }
          } else if (this.match(TokenType.LBRACK)) {
            if (this.inMethod && !this.inParameter) {
              expr = this.markLocation({
                type: "ComputedMemberExpression",
                object: expr,
                expression: this.parseComputedMember()
              }, startLocation);
              pattern = expr;
            } else {
              throw this.createErrorWithLocation(startLocation, ErrorMessages.UNEXPECTED_SUPER_PROPERTY);
            }
          } else if (this.match(TokenType.PERIOD)) {
            if (this.inMethod && !this.inParameter) {
              expr = this.markLocation({
                type: "StaticMemberExpression",
                object: expr,
                property: this.parseNonComputedMember()
              }, startLocation);
              pattern = expr;
            } else {
              throw this.createErrorWithLocation(startLocation, ErrorMessages.UNEXPECTED_SUPER_PROPERTY);
            }
          } else {
            throw this.createUnexpected(token);
          }
        } else if (this.match(TokenType.NEW)) {
          expr = this.parseNewExpression();
        } else {
          var pe = this.parsePrimaryExpression();
          if (!pe.expr) {
            return pe;
          }
          var _ref2 = pe;
          expr = _ref2.expr;
          pattern = _ref2.pattern;
          isBindingElement = _ref2.isBindingElement;
          exprError = _ref2.exprError;
        }

        while (true) {
          if (allowCall && this.match(TokenType.LPAREN)) {
            isBindingElement = false;
            expr = this.markLocation({
              type: "CallExpression",
              callee: expr,
              arguments: this.parseArgumentList()
            }, startLocation);
            pattern = null;
          } else if (this.match(TokenType.LBRACK)) {
            isBindingElement = false;
            expr = this.markLocation({
              type: "ComputedMemberExpression",
              object: expr,
              expression: this.parseComputedMember()
            }, startLocation);
            pattern = expr;
          } else if (this.match(TokenType.PERIOD)) {
            isBindingElement = false;
            expr = this.markLocation({
              type: "StaticMemberExpression",
              object: expr,
              property: this.parseNonComputedMember()
            }, startLocation);
            pattern = expr;
          } else if (this.match(TokenType.TEMPLATE)) {
            isBindingElement = false;
            expr = this.markLocation({
              type: "TemplateExpression",
              tag: expr,
              elements: this.parseTemplateElements()
            }, startLocation);
            pattern = null;
          } else {
            break;
          }
        }

        this.allowIn = previousAllowIn;

        return { expr: expr, pattern: pattern, isBindingElement: isBindingElement, exprError: exprError };
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
          return [this.markLocation({ type: "TemplateElement", rawValue: token.value.slice(1, -1) }, startLocation)];
        }
        var result = [this.markLocation({ type: "TemplateElement", rawValue: this.lex().value.slice(1, -2) }, startLocation)];
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
            result.push(this.markLocation({ type: "TemplateElement", rawValue: token.value.slice(1, -1) }, startLocation));
            return result;
          } else {
            result.push(this.markLocation({ type: "TemplateElement", rawValue: token.value.slice(1, -2) }, startLocation));
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
          return this.markLocation({ type: "NewTargetExpression" }, startLocation);
        }
        var callee = Parser.getExpr(this.parseLeftHandSideExpression({ allowCall: false }));
        return this.markLocation({
          type: "NewExpression",
          callee: callee,
          arguments: this.match(TokenType.LPAREN) ? this.parseArgumentList() : []
        }, startLocation);
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

        function primary(expr) {
          return { expr: expr, pattern: null, isBindingElement: false, exprError: null };
        }
        switch (this.lookahead.type) {
          case TokenType.YIELD:
          case TokenType.IDENTIFIER:
            {
              var expr = this.markLocation({ type: "IdentifierExpression", name: this.parseIdentifier() }, startLocation);
              var _pattern = this.markLocation({ type: "BindingIdentifier", name: expr.name }, startLocation);
              return { expr: expr, pattern: _pattern, isBindingElement: true, exprError: null };
            }
          case TokenType.STRING:
            return primary(this.parseStringLiteral());
          case TokenType.NUMBER:
            return primary(this.parseNumericLiteral());
          case TokenType.THIS:
            this.lex();
            return primary(this.markLocation({ type: "ThisExpression" }, startLocation));
          case TokenType.FUNCTION:
            return primary(this.markLocation(this.parseFunction({ isExpr: true }), startLocation));
          case TokenType.TRUE:
            this.lex();
            return primary(this.markLocation({ type: "LiteralBooleanExpression", value: true }, startLocation));
          case TokenType.FALSE:
            this.lex();
            return primary(this.markLocation({ type: "LiteralBooleanExpression", value: false }, startLocation));
          case TokenType.NULL:
            this.lex();
            return primary(this.markLocation({ type: "LiteralNullExpression" }, startLocation));
          case TokenType.LBRACK:
            return this.parseArrayExpression();
          case TokenType.LBRACE:
            return this.parseObjectExpression();
          case TokenType.TEMPLATE:
            return primary(this.markLocation({
              type: "TemplateExpression",
              tag: null,
              elements: this.parseTemplateElements()
            }, startLocation));
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
            return primary(this.markLocation({ type: "LiteralRegExpExpression", pattern: pattern, flags: flags }, startLocation));
          case TokenType.CLASS:
            return primary(this.parseClass({ isExpr: true }));
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
        var node = token2._value === 1 / 0 ? {
          type: "LiteralInfinityExpression"
        } : {
          type: "LiteralNumericExpression",
          value: token2._value
        };
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
        return this.markLocation({ type: "LiteralStringExpression", value: token2._value }, startLocation);
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
            arg = this.markLocation({ type: "SpreadElement", expression: this.parseAssignmentExpression() }, startLocation);
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
        // At this point, we need to parse 3 things:
        //  1. Group expression
        //  2. Assignment target of assignment expression
        //  3. Parameter list of arrow function
        var rest = null;
        var start = this.expect(TokenType.LPAREN);
        var token = this.lookahead;
        if (this.eat(TokenType.RPAREN)) {
          this.ensureArrow();
          return {
            expr: null,
            pattern: {
              type: ARROW_EXPRESSION_PARAMS,
              params: [],
              rest: null
            },
            isBindingElement: false,
            exprError: this.createUnexpected(token) };
        } else if (this.eat(TokenType.ELLIPSIS)) {
          rest = this.parseBindingIdentifier();
          this.expect(TokenType.RPAREN);
          this.ensureArrow();
          return {
            expr: null,
            pattern: {
              type: ARROW_EXPRESSION_PARAMS,
              params: [],
              rest: rest
            },
            isBindingElement: false,
            exprError: this.createUnexpected(token) };
        }


        var startLocation = this.getLocation();
        var _parseAssignmentExpressionOrBindingElement = this.parseAssignmentExpressionOrBindingElement();

        var group = _parseAssignmentExpressionOrBindingElement.expr;
        var assignmentTarget = _parseAssignmentExpressionOrBindingElement.pattern;
        var possibleBindings = _parseAssignmentExpressionOrBindingElement.isBindingElement;
        var firstExprError = _parseAssignmentExpressionOrBindingElement.exprError;


        var params = possibleBindings ? [assignmentTarget] : null;

        while (this.eat(TokenType.COMMA)) {
          assignmentTarget = null;
          if (this.match(TokenType.ELLIPSIS)) {
            if (!possibleBindings) {
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
            var _parseAssignmentExpressionOrBindingElement2 = this.parseAssignmentExpressionOrBindingElement();

            var expr = _parseAssignmentExpressionOrBindingElement2.expr;
            var pattern = _parseAssignmentExpressionOrBindingElement2.pattern;
            var isBindingElement = _parseAssignmentExpressionOrBindingElement2.isBindingElement;
            var exprError = _parseAssignmentExpressionOrBindingElement2.exprError;
            if (!isBindingElement) {
              possibleBindings = false;
              params = null;
            } else if (params) {
              params.push(pattern);
            }
            if (!expr) {
              firstExprError = firstExprError || exprError;
              group = null;
              if (!params) {
                throw firstExprError;
              }
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

        this.expect(TokenType.RPAREN);

        if (!this.hasLineTerminatorBeforeNext && this.match(TokenType.ARROW)) {
          var _ret = (function () {
            if (!possibleBindings) {
              throw _this.createErrorWithLocation(start, ErrorMessages.ILLEGAL_ARROW_FUNCTION_PARAMS);
            }
            // check dup params
            var allBoundNames = [];

            params.forEach(function (expr) {
              allBoundNames = allBoundNames.concat(Parser.boundNames(expr));
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
                expr: null,
                pattern: { type: ARROW_EXPRESSION_PARAMS, params: params, rest: rest },
                isBindingElement: false,
                exprError: _this.createUnexpected(_this.lookahead) }
            };
          })();

          // istanbul ignore next
          if (typeof _ret === "object") {
            return _ret.v;
          }
        } else {
          // Ensure assignment pattern:
          if (rest) {
            this.ensureArrow();
          }
          if (!group) {
            throw firstExprError;
          }
          return {
            expr: group,
            pattern: assignmentTarget,
            isBindingElement: false,
            exprError: null
          };
        }
      },
      writable: true,
      configurable: true
    },
    parseArrayExpression: {
      value: function parseArrayExpression() {
        var startLocation = this.getLocation();

        this.expect(TokenType.LBRACK);

        var exprs = [],
            patterns = [],
            restElement = null,
            allBindingElements = true,
            firstExprError = null;

        while (true) {
          if (this.match(TokenType.RBRACK)) {
            break;
          }
          if (this.eat(TokenType.COMMA)) {
            exprs && exprs.push(null);
            patterns && patterns.push(null);
          } else {
            var elementLocation = this.getLocation();
            if (this.eat(TokenType.ELLIPSIS)) {
              // Spread/Rest element
              var _parseAssignmentExpressionOrBindingElement = this.parseAssignmentExpressionOrBindingElement();

              var expr = _parseAssignmentExpressionOrBindingElement.expr;
              var pattern = _parseAssignmentExpressionOrBindingElement.pattern;
              var isBindingElement = _parseAssignmentExpressionOrBindingElement.isBindingElement;
              var exprError = _parseAssignmentExpressionOrBindingElement.exprError;
              firstExprError = firstExprError || exprError;

              allBindingElements = allBindingElements && isBindingElement;

              if (!expr) {
                exprs = null;
                if (!patterns) {
                  throw firstExprError;
                }
              } else {
                expr = this.markLocation({ type: "SpreadElement", expression: expr }, elementLocation);
              }

              if (!pattern) {
                patterns = null;
                if (!exprs) {
                  throw firstExprError;
                }
              } else if (patterns) {
                // When isBindingElementNext is true, patternNext is present.
                restElement = pattern;
              }

              exprs && exprs.push(expr);
            } else {
              var _parseAssignmentExpressionOrBindingElement2 = this.parseAssignmentExpressionOrBindingElement();

              var expr = _parseAssignmentExpressionOrBindingElement2.expr;
              var pattern = _parseAssignmentExpressionOrBindingElement2.pattern;
              var isBindingElement = _parseAssignmentExpressionOrBindingElement2.isBindingElement;
              var exprError = _parseAssignmentExpressionOrBindingElement2.exprError;


              allBindingElements = allBindingElements && isBindingElement;

              if (!expr) {
                firstExprError = firstExprError || exprError;
                exprs = null;
                if (!patterns) {
                  throw exprError;
                }
              }
              if (!pattern) {
                patterns = null;
                if (!exprs) {
                  throw firstExprError;
                }
              }
              exprs && exprs.push(expr);
              patterns && patterns.push(pattern);
            }

            if (!this.match(TokenType.RBRACK)) {
              this.expect(TokenType.COMMA);
              if (restElement) {
                patterns = null;
                allBindingElements = false;
              }
            }
          }
        }

        this.expect(TokenType.RBRACK);

        return {
          expr: exprs && this.markLocation({ type: "ArrayExpression", elements: exprs }, startLocation),
          pattern: patterns && this.markLocation({ type: "ArrayBinding", elements: patterns, restElement: restElement }, startLocation),
          isBindingElement: allBindingElements,
          exprError: firstExprError
        };
      },
      writable: true,
      configurable: true
    },
    parseObjectExpression: {
      value: function parseObjectExpression() {
        var startLocation = this.getLocation();

        this.expect(TokenType.LBRACE);

        var properties = [],
            bindingProperties = [],
            isBindingElement = true,
            exprError = null;
        var has__proto__ = [false];
        while (!this.match(TokenType.RBRACE)) {
          var _parsePropertyDefinition = this.parsePropertyDefinition(has__proto__);

          var property = _parsePropertyDefinition.property;
          var bindingProperty = _parsePropertyDefinition.bindingProperty;
          var isBindingElementNext = _parsePropertyDefinition.isBindingElement;
          var exprErrorNext = _parsePropertyDefinition.exprError;
          if (properties) {
            if (property) {
              properties.push(property);
            } else {
              exprError = exprError || exprErrorNext;
              properties = null;
            }
          }

          if (bindingProperties) {
            if (bindingProperty) {
              bindingProperties.push(bindingProperty);
              isBindingElement = isBindingElement && isBindingElementNext;
            } else {
              bindingProperties = false;
              isBindingElement = false;
            }
          }

          if (!this.match(TokenType.RBRACE)) {
            this.expect(TokenType.COMMA);
          }
        }

        this.expect(TokenType.RBRACE);

        return {
          expr: properties && this.markLocation({ type: "ObjectExpression", properties: properties }, startLocation),
          pattern: bindingProperties && this.markLocation({
            type: "ObjectBinding",
            properties: bindingProperties
          }, startLocation),
          isBindingElement: isBindingElement,
          exprError: exprError
        };
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
        var binding = _parseMethodDefinition.binding;
        switch (kind) {
          case "method":
            return {
              property: methodOrKey,
              bindingProperty: null,
              isBindingElement: false,
              exprError: null };
          case "identifier":
            // IdentifierReference,
            if (this.eat(TokenType.ASSIGN)) {
              // CoverInitializedName
              if (methodOrKey.value === "yield" && (this.strict || this.allowYieldExpression || this.inGeneratorBody || this.inGeneratorParameter)) {
                throw this.createUnexpected(token);
              }
              var init = this.parseAssignmentExpression();
              return {
                property: null,
                bindingProperty: this.markLocation({ type: "BindingPropertyIdentifier", binding: binding, init: init }, startLocation),
                isBindingElement: true,
                exprError: this.createErrorWithLocation(startLocation, ErrorMessages.ILLEGAL_PROPERTY)
              };
            } else if (!this.match(TokenType.COLON)) {
              if (token.type !== TokenType.IDENTIFIER && token.type !== TokenType.YIELD || (this.strict || this.allowYieldExpression) && methodOrKey.value === "yield") {
                throw this.createUnexpected(token);
              }
              return {
                property: this.markLocation({ type: "ShorthandProperty", name: methodOrKey.value }, startLocation),
                bindingProperty: this.markLocation({
                  type: "BindingPropertyIdentifier",
                  binding: binding,
                  init: null }, startLocation),
                isBindingElement: true,
                exprError: null
              };
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

        var _parseAssignmentExpressionOrBindingElement = this.parseAssignmentExpressionOrBindingElement();

        var expr = _parseAssignmentExpressionOrBindingElement.expr;
        var pattern = _parseAssignmentExpressionOrBindingElement.pattern;
        var isBindingElement = _parseAssignmentExpressionOrBindingElement.isBindingElement;
        var exprError = _parseAssignmentExpressionOrBindingElement.exprError;
        return {
          property: expr && this.markLocation({
            type: "DataProperty", name: methodOrKey, expression: expr
          }, startLocation),
          bindingProperty: pattern && this.markLocation({
            type: "BindingPropertyProperty",
            name: methodOrKey,
            binding: pattern
          }, startLocation),
          isBindingElement: isBindingElement,
          exprError: exprError };
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
            return {
              name: this.markLocation({
                type: "StaticPropertyName",
                value: this.parseStringLiteral().value
              }, startLocation),
              binding: null
            };
          case TokenType.NUMBER:
            var numLiteral = this.parseNumericLiteral();
            return {
              name: this.markLocation({
                type: "StaticPropertyName",
                value: "" + (numLiteral.type === "LiteralInfinityExpression" ? 1 / 0 : numLiteral.value)
              }, startLocation),
              binding: null
            };
          case TokenType.LBRACK:
            var previousYield = this.allowYieldExpression;
            if (this.inGeneratorParameter) {
              this.allowYieldExpression = false;
            }
            this.expect(TokenType.LBRACK);
            var expr = this.parseAssignmentExpression();
            this.expect(TokenType.RBRACK);
            this.allowYieldExpression = previousYield;
            return { name: this.markLocation({ type: "ComputedPropertyName", expression: expr }, startLocation), binding: null };
        }

        var name = this.parseIdentifierName();
        return {
          name: this.markLocation({ type: "StaticPropertyName", value: name }, startLocation),
          binding: this.markLocation({ type: "BindingIdentifier", name: name }, startLocation) };
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
       * @returns {{methodOrKey: (Method|PropertyName), kind: string}}
       */
      value: function parseMethodDefinition(isClassProtoMethod) {
        var token = this.lookahead;
        var startLocation = this.getLocation();

        var isGenerator = !!this.eat(TokenType.MUL);

        var _parsePropertyName = this.parsePropertyName();

        var name = _parsePropertyName.name;
        var binding = _parsePropertyName.binding;


        if (!isGenerator && token.type === TokenType.IDENTIFIER) {
          var _name = token.value;
          if (_name.length === 3) {
            // Property Assignment: Getter and Setter.
            if (_name === "get" && this.lookaheadPropertyName()) {
              var _ref = this.parsePropertyName();

              _name = _ref.name;
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
                methodOrKey: this.markLocation({ type: "Getter", name: _name, body: body }, startLocation),
                kind: "method"
              };
            } else if (_name === "set" && this.lookaheadPropertyName()) {
              var _ref2 = this.parsePropertyName();

              _name = _ref2.name;
              this.expect(TokenType.LPAREN);
              var param = this.parseBindingElement();
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
                methodOrKey: this.markLocation({ type: "Setter", name: _name, param: param, body: body }, startLocation),
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
          this.inConstructor = isClassProtoMethod && !isGenerator && this.hasClassHeritage && name.type === "StaticPropertyName" && name.value === "constructor";
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
            methodOrKey: this.markLocation({ type: "Method", isGenerator: isGenerator, name: name, params: params, body: body }, startLocation),
            kind: "method"
          };
        }

        return {
          methodOrKey: name,
          kind: token.type.klass.isIdentifierName ? "identifier" : "property",
          binding: binding
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
        var name = null;
        var heritage = null;

        if (this.match(TokenType.IDENTIFIER)) {
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
        var previousHasClassHeritage = this.hasClassHeritage;
        if (isExpr) {
          this.inGeneratorParameter = false;
          this.allowYieldExpression = false;
        }
        if (this.eat(TokenType.EXTENDS)) {
          heritage = Parser.getExpr(this.parseLeftHandSideExpression({ allowCall: true }));
        }

        this.expect(TokenType.LBRACE);
        var originalStrict = this.strict;
        this.strict = true;
        var elements = [];
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
              elements.push(copyLocation(methodOrKey, { type: "ClassElement", isStatic: isStatic, method: methodOrKey }));
              break;
            default:
              throw this.createError("Only methods are allowed in classes");
          }
        }
        if (!isExpr) {
          this.VDN["$" + name.name] = true;
        }
        this.strict = originalStrict;
        this.allowYieldExpression = previousParamYield;
        this.inGeneratorParameter = previousInGeneratorParameter;
        this.hasClassHeritage = previousHasClassHeritage;
        return this.markLocation({ type: isExpr ? "ClassExpression" : "ClassDeclaration", name: name, "super": heritage, elements: elements }, location);
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
    parseArrayBinding: {
      value: function parseArrayBinding() {
        var startLocation = this.getLocation();

        this.expect(TokenType.LBRACK);

        var elements = [],
            restElement = null;

        while (true) {
          if (this.match(TokenType.RBRACK)) {
            break;
          }
          var el = undefined;

          if (this.eat(TokenType.COMMA)) {
            el = null;
          } else {
            if (this.eat(TokenType.ELLIPSIS)) {
              restElement = this.parseBindingIdentifier();
              break;
            } else {
              el = this.parseBindingElement();
            }
            if (!this.match(TokenType.RBRACK)) {
              this.expect(TokenType.COMMA);
            }
          }
          elements.push(el);
        }

        this.expect(TokenType.RBRACK);

        return this.markLocation({ type: "ArrayBinding", elements: elements, restElement: restElement }, startLocation);
      },
      writable: true,
      configurable: true
    },
    parseBindingProperty: {
      value: function parseBindingProperty() {
        var startLocation = this.getLocation();
        var token = this.lookahead;
        var _parsePropertyName = this.parsePropertyName();

        var name = _parsePropertyName.name;
        var binding = _parsePropertyName.binding;
        if ((token.type === TokenType.IDENTIFIER || token.type === TokenType.YIELD) && name.type === "StaticPropertyName") {
          if (!this.match(TokenType.COLON)) {
            if (token.type === TokenType.YIELD && (this.allowYieldExpression || this.inGeneratorParameter || this.inGeneratorBody)) {
              throw this.createUnexpected(token);
            }
            var defaultValue = null;
            if (this.eat(TokenType.ASSIGN)) {
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
        this.expect(TokenType.COLON);
        binding = this.parseBindingElement();
        return this.markLocation({ type: "BindingPropertyProperty", name: name, binding: binding }, startLocation);
      },
      writable: true,
      configurable: true
    },
    parseObjectBinding: {
      value: function parseObjectBinding() {
        var startLocation = this.getLocation();

        this.expect(TokenType.LBRACE);

        var properties = [];
        while (!this.match(TokenType.RBRACE)) {
          properties.push(this.parseBindingProperty());
          if (!this.match(TokenType.RBRACE)) {
            this.expect(TokenType.COMMA);
          }
        }

        this.expect(TokenType.RBRACE);

        return this.markLocation({ type: "ObjectBinding", properties: properties }, startLocation);
      },
      writable: true,
      configurable: true
    },
    parseBindingTarget: {
      value: function parseBindingTarget() {
        switch (this.lookahead.type) {
          case TokenType.IDENTIFIER:
          case TokenType.YIELD:
            return this.parseBindingIdentifier();
          case TokenType.LBRACK:
            return this.parseArrayBinding();
          case TokenType.LBRACE:
            return this.parseObjectBinding();
        }
        throw this.createUnexpected(this.lookahead);
      },
      writable: true,
      configurable: true
    },
    parseBindingElement: {
      value: function parseBindingElement() {
        var startLocation = this.getLocation();
        var binding = this.parseBindingTarget();

        if (this.eat(TokenType.ASSIGN)) {
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
      },
      writable: true,
      configurable: true
    },
    parseParam: {
      value: function parseParam() {
        var originalInParameter = this.inParameter;
        this.inParameter = true;
        var param = this.parseBindingElement();
        this.inParameter = originalInParameter;
        return param;
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
// if it is a possible expression
// if it can be an assignment pattern
// if it can be an binding element, it can be part of arrow expression
//# sourceMappingURL=data:application/json;base64,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V0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztXQUN0QztTQUNGOztBQUVELFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlCLGVBQU8sSUFBSSxDQUFDO09BQ2I7Ozs7OztTQWh3RlUsTUFBTTtHQUFTLFNBQVMiLCJmaWxlIjoic3JjL3BhcnNlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29weXJpZ2h0IDIwMTQgU2hhcGUgU2VjdXJpdHksIEluYy5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpXG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQge2lzUmVzdHJpY3RlZFdvcmQsIGlzU3RyaWN0TW9kZVJlc2VydmVkV29yZH0gZnJvbSBcIi4vdXRpbHNcIjtcblxuaW1wb3J0IHtFcnJvck1lc3NhZ2VzfSBmcm9tIFwiLi9lcnJvcnNcIjtcblxuaW1wb3J0IFRva2VuaXplciwgeyBUb2tlbkNsYXNzLCBUb2tlblR5cGUgfSBmcm9tIFwiLi90b2tlbml6ZXJcIjtcblxuLy8gRW1wdHkgcGFyYW1ldGVyIGxpc3QgZm9yIEFycm93RXhwcmVzc2lvblxuY29uc3QgQVJST1dfRVhQUkVTU0lPTl9QQVJBTVMgPSBcIkNvdmVyUGFyZW50aGVzaXplZEV4cHJlc3Npb25BbmRBcnJvd1BhcmFtZXRlckxpc3RcIjtcblxuY29uc3QgU1RSSUNUX01PREVfUkVTRVJWRURfV09SRCA9IHtcbiAgXCJpbXBsZW1lbnRzXCI6IG51bGwsIFwiaW50ZXJmYWNlXCI6IG51bGwsIFwicGFja2FnZVwiOiBudWxsLCBcInByaXZhdGVcIjogbnVsbCwgXCJwcm90ZWN0ZWRcIjogbnVsbCxcbiAgXCJwdWJsaWNcIjogbnVsbCwgXCJzdGF0aWNcIjogbnVsbCwgXCJ5aWVsZFwiOiBudWxsLCBcImxldFwiOiBudWxsXG59O1xuXG5jb25zdCBQcmVjZWRlbmNlID0ge1xuICBTZXF1ZW5jZTogMCxcbiAgWWllbGQ6IDEsXG4gIEFzc2lnbm1lbnQ6IDEsXG4gIENvbmRpdGlvbmFsOiAyLFxuICBBcnJvd0Z1bmN0aW9uOiAyLFxuICBMb2dpY2FsT1I6IDMsXG4gIExvZ2ljYWxBTkQ6IDQsXG4gIEJpdHdpc2VPUjogNSxcbiAgQml0d2lzZVhPUjogNixcbiAgQml0d2lzZUFORDogNyxcbiAgRXF1YWxpdHk6IDgsXG4gIFJlbGF0aW9uYWw6IDksXG4gIEJpdHdpc2VTSElGVDogMTAsXG4gIEFkZGl0aXZlOiAxMSxcbiAgTXVsdGlwbGljYXRpdmU6IDEyLFxuICBVbmFyeTogMTMsXG4gIFBvc3RmaXg6IDE0LFxuICBDYWxsOiAxNSxcbiAgTmV3OiAxNixcbiAgVGFnZ2VkVGVtcGxhdGU6IDE3LFxuICBNZW1iZXI6IDE4LFxuICBQcmltYXJ5OiAxOVxufTtcblxuY29uc3QgQmluYXJ5UHJlY2VkZW5jZSA9IHtcbiAgXCJ8fFwiOiBQcmVjZWRlbmNlLkxvZ2ljYWxPUixcbiAgXCImJlwiOiBQcmVjZWRlbmNlLkxvZ2ljYWxBTkQsXG4gIFwifFwiOiBQcmVjZWRlbmNlLkJpdHdpc2VPUixcbiAgXCJeXCI6IFByZWNlZGVuY2UuQml0d2lzZVhPUixcbiAgXCImXCI6IFByZWNlZGVuY2UuQml0d2lzZUFORCxcbiAgXCI9PVwiOiBQcmVjZWRlbmNlLkVxdWFsaXR5LFxuICBcIiE9XCI6IFByZWNlZGVuY2UuRXF1YWxpdHksXG4gIFwiPT09XCI6IFByZWNlZGVuY2UuRXF1YWxpdHksXG4gIFwiIT09XCI6IFByZWNlZGVuY2UuRXF1YWxpdHksXG4gIFwiPFwiOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gIFwiPlwiOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gIFwiPD1cIjogUHJlY2VkZW5jZS5SZWxhdGlvbmFsLFxuICBcIj49XCI6IFByZWNlZGVuY2UuUmVsYXRpb25hbCxcbiAgXCJpblwiOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gIFwiaW5zdGFuY2VvZlwiOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gIFwiPDxcIjogUHJlY2VkZW5jZS5CaXR3aXNlU0hJRlQsXG4gIFwiPj5cIjogUHJlY2VkZW5jZS5CaXR3aXNlU0hJRlQsXG4gIFwiPj4+XCI6IFByZWNlZGVuY2UuQml0d2lzZVNISUZULFxuICBcIitcIjogUHJlY2VkZW5jZS5BZGRpdGl2ZSxcbiAgXCItXCI6IFByZWNlZGVuY2UuQWRkaXRpdmUsXG4gIFwiKlwiOiBQcmVjZWRlbmNlLk11bHRpcGxpY2F0aXZlLFxuICBcIiVcIjogUHJlY2VkZW5jZS5NdWx0aXBsaWNhdGl2ZSxcbiAgXCIvXCI6IFByZWNlZGVuY2UuTXVsdGlwbGljYXRpdmUsXG59O1xuXG5jb25zdCBGT1JfT0ZfVkFSID0ge307XG5cbmZ1bmN0aW9uIGNvcHlMb2NhdGlvbihmcm9tLCB0bykge1xuICBpZiAoXCJsb2NcIiBpbiBmcm9tKSB7XG4gICAgdG8ubG9jID0gZnJvbS5sb2M7XG4gIH1cbiAgcmV0dXJuIHRvO1xufVxuXG4vKipcbiAqXG4gKiBAcGFyYW0ge1tzdHJpbmddfSBzdHJpbmdzXG4gKiBAcmV0dXJucyB7c3RyaW5nP31cbiAqL1xuZnVuY3Rpb24gZmlyc3REdXBsaWNhdGUoc3RyaW5ncykge1xuICBpZiAoc3RyaW5ncy5sZW5ndGggPCAyKSByZXR1cm4gbnVsbDtcbiAgbGV0IG1hcCA9IHt9O1xuICBmb3IgKGxldCBjdXJzb3IgPSAwOyBjdXJzb3IgPCBzdHJpbmdzLmxlbmd0aDsgY3Vyc29yKyspIHtcbiAgICBsZXQgaWQgPSBcIiRcIiArIHN0cmluZ3NbY3Vyc29yXTtcbiAgICBpZiAobWFwLmhhc093blByb3BlcnR5KGlkKSkge1xuICAgICAgcmV0dXJuIHN0cmluZ3NbY3Vyc29yXTtcbiAgICB9XG4gICAgbWFwW2lkXSA9IHRydWU7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGhhc1N0cmljdE1vZGVSZXNlcnZlZFdvcmQoaWRzKSB7XG4gIHJldHVybiBpZHMuc29tZShpZCA9PiBTVFJJQ1RfTU9ERV9SRVNFUlZFRF9XT1JELmhhc093blByb3BlcnR5KGlkKSk7XG59XG5cbmV4cG9ydCBjbGFzcyBQYXJzZXIgZXh0ZW5kcyBUb2tlbml6ZXIge1xuICBjb25zdHJ1Y3Rvcihzb3VyY2UpIHtcbiAgICBzdXBlcihzb3VyY2UpO1xuICAgIHRoaXMubGFiZWxTZXQgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIHRoaXMuTEROID0gW107XG4gICAgdGhpcy5WRE4gPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIHRoaXMuYWxsb3dJbiA9IHRydWU7XG4gICAgdGhpcy5pbkl0ZXJhdGlvbiA9IGZhbHNlO1xuICAgIHRoaXMuaW5Td2l0Y2ggPSBmYWxzZTtcbiAgICB0aGlzLmluRnVuY3Rpb25Cb2R5ID0gZmFsc2U7XG4gICAgdGhpcy5pbk1ldGhvZCA9IGZhbHNlO1xuICAgIHRoaXMuaW5Db25zdHJ1Y3RvciA9IGZhbHNlO1xuICAgIHRoaXMuaGFzQ2xhc3NIZXJpdGFnZSA9IGZhbHNlO1xuICAgIHRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXIgPSBmYWxzZTtcbiAgICB0aGlzLmluUGFyYW1ldGVyID0gZmFsc2U7XG4gICAgdGhpcy5pbkdlbmVyYXRvckJvZHkgPSBmYWxzZTtcbiAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gZmFsc2U7XG4gICAgdGhpcy5hbGxvd0xhYmVsZWRGdW5jdGlvbiA9IHRydWU7XG4gICAgdGhpcy5tb2R1bGUgPSBmYWxzZTtcbiAgICB0aGlzLnN0cmljdCA9IGZhbHNlO1xuICB9XG5cbiAgZWF0KHRva2VuVHlwZSkge1xuICAgIGlmICh0aGlzLmxvb2thaGVhZC50eXBlID09PSB0b2tlblR5cGUpIHtcbiAgICAgIHJldHVybiB0aGlzLmxleCgpO1xuICAgIH1cbiAgfVxuXG4gIGV4cGVjdCh0b2tlblR5cGUpIHtcbiAgICBpZiAodGhpcy5sb29rYWhlYWQudHlwZSA9PT0gdG9rZW5UeXBlKSB7XG4gICAgICByZXR1cm4gdGhpcy5sZXgoKTtcbiAgICB9XG4gICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgfVxuXG4gIG1hdGNoQ29udGV4dHVhbEtleXdvcmQoa2V5d29yZCkge1xuICAgIHJldHVybiB0aGlzLmxvb2thaGVhZC50eXBlID09PSBUb2tlblR5cGUuSURFTlRJRklFUiAmJiB0aGlzLmxvb2thaGVhZC52YWx1ZSA9PT0ga2V5d29yZDtcbiAgfVxuXG4gIGV4cGVjdENvbnRleHR1YWxLZXl3b3JkKGtleXdvcmQpIHtcbiAgICBpZiAodGhpcy5tYXRjaENvbnRleHR1YWxLZXl3b3JkKGtleXdvcmQpKSB7XG4gICAgICByZXR1cm4gdGhpcy5sZXgoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICB9XG4gIH1cblxuICBlYXRDb250ZXh0dWFsS2V5d29yZChrZXl3b3JkKSB7XG4gICAgaWYgKHRoaXMubWF0Y2hDb250ZXh0dWFsS2V5d29yZChrZXl3b3JkKSkge1xuICAgICAgcmV0dXJuIHRoaXMubGV4KCk7XG4gICAgfVxuICB9XG5cbiAgbWF0Y2goc3ViVHlwZSkge1xuICAgIHJldHVybiB0aGlzLmxvb2thaGVhZC50eXBlID09PSBzdWJUeXBlO1xuICB9XG5cbiAgY29uc3VtZVNlbWljb2xvbigpIHtcbiAgICBpZiAodGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLlNFTUlDT0xPTikpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuZW9mKCkgJiYgIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJCUkFDRSkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgfVxuICB9XG5cbiAgLy8gdGhpcyBpcyBhIG5vLW9wLCByZXNlcnZlZCBmb3IgZnV0dXJlIHVzZVxuICBtYXJrTG9jYXRpb24obm9kZSwgc3RhcnRMb2NhdGlvbikge1xuICAgIHJldHVybiBub2RlO1xuICB9XG5cbiAgd3JhcFZETihmLCBwb3N0KSB7XG4gICAgbGV0IG9yaWdpbmFsVkROID0gdGhpcy5WRE47XG4gICAgdGhpcy5WRE4gPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIGxldCByZXN1bHQgPSBmLmNhbGwodGhpcyk7XG4gICAgaWYgKHBvc3QpIHBvc3QuY2FsbCh0aGlzKTtcblxuICAgIGZvciAobGV0IGtleSBpbiB0aGlzLlZETikge1xuICAgICAgb3JpZ2luYWxWRE5ba2V5XSA9IHRoaXMuVkROW2tleV07XG4gICAgfVxuICAgIHRoaXMuVkROID0gb3JpZ2luYWxWRE47XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGNoZWNrQmxvY2tTY29wZSgpIHtcbiAgICBsZXQgZHVwbGljYXRlID0gZmlyc3REdXBsaWNhdGUodGhpcy5MRE4pO1xuICAgIGlmIChkdXBsaWNhdGUgIT09IG51bGwpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5EVVBMSUNBVEVfQklORElORywgZHVwbGljYXRlKTtcbiAgICB9XG4gICAgdGhpcy5MRE4uZm9yRWFjaChuYW1lID0+IHtcbiAgICAgIGlmICh7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRoaXMuVkROLCBcIiRcIiArIG5hbWUpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5EVVBMSUNBVEVfQklORElORywgbmFtZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBwYXJzZU1vZHVsZSgpIHtcbiAgICB0aGlzLm1vZHVsZSA9IHRydWU7XG4gICAgdGhpcy5zdHJpY3QgPSB0cnVlO1xuXG4gICAgdGhpcy5sb29rYWhlYWQgPSB0aGlzLmFkdmFuY2UoKTtcbiAgICBsZXQgbG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IGV4cG9ydGVkTmFtZXMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIGxldCBleHBvcnRlZEJpbmRpbmdzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICBsZXQgaXRlbXMgPSBbXTtcbiAgICB3aGlsZSAoIXRoaXMuZW9mKCkpIHtcbiAgICAgIGl0ZW1zLnB1c2godGhpcy5wYXJzZU1vZHVsZUl0ZW0oZXhwb3J0ZWROYW1lcywgZXhwb3J0ZWRCaW5kaW5ncykpO1xuICAgIH1cbiAgICBmb3IgKGxldCBrZXkgaW4gZXhwb3J0ZWRCaW5kaW5ncykge1xuICAgICAgaWYgKCF7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRoaXMuVkROLCBrZXkpICYmIHRoaXMuTEROLmluZGV4T2Yoa2V5LnNsaWNlKDEpKSA9PT0gLTEpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLk1PRFVMRV9FWFBPUlRfVU5ERUZJTkVELCBrZXkuc2xpY2UoMSkpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmNoZWNrQmxvY2tTY29wZSgpO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiTW9kdWxlXCIsIGl0ZW1zOiBpdGVtcyB9LCBsb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZVNjcmlwdCgpIHtcbiAgICB0aGlzLmxvb2thaGVhZCA9IHRoaXMuYWR2YW5jZSgpO1xuXG4gICAgbGV0IGxvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCBvcmlnaW5hbExETiA9IHRoaXMuTEROO1xuICAgIHRoaXMuTEROID0gW107XG5cbiAgICBsZXQgW2JvZHldID0gdGhpcy5wYXJzZUJvZHkoKTtcbiAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLkVPUykpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgfVxuICAgIHRoaXMuY2hlY2tCbG9ja1Njb3BlKCk7XG4gICAgdGhpcy5MRE4gPSBvcmlnaW5hbExETjtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIlNjcmlwdFwiLCBib2R5IH0sIGxvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlRnVuY3Rpb25Cb2R5KGJvdW5kUGFyYW1zKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICBsZXQgb2xkVkROID0gdGhpcy5WRE47XG4gICAgdGhpcy5WRE4gPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4gICAgbGV0IG9yaWdpbmFsTEROID0gdGhpcy5MRE47XG4gICAgdGhpcy5MRE4gPSBbXTtcblxuICAgIGJvdW5kUGFyYW1zLmZvckVhY2gobmFtZSA9PiB0aGlzLlZETltcIiRcIiArIG5hbWVdID0gdHJ1ZSk7XG5cbiAgICBsZXQgb2xkTGFiZWxTZXQgPSB0aGlzLmxhYmVsU2V0O1xuICAgIGxldCBvbGRJbkl0ZXJhdGlvbiA9IHRoaXMuaW5JdGVyYXRpb247XG4gICAgbGV0IG9sZEluU3dpdGNoID0gdGhpcy5pblN3aXRjaDtcbiAgICBsZXQgb2xkSW5GdW5jdGlvbkJvZHkgPSB0aGlzLmluRnVuY3Rpb25Cb2R5O1xuICAgIGxldCBwcmV2aW91c1N0cmljdCA9IHRoaXMuc3RyaWN0O1xuICAgIGxldCBvbGRNb2R1bGUgPSB0aGlzLm1vZHVsZTtcblxuICAgIHRoaXMubGFiZWxTZXQgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIHRoaXMuaW5JdGVyYXRpb24gPSBmYWxzZTtcbiAgICB0aGlzLmluU3dpdGNoID0gZmFsc2U7XG4gICAgdGhpcy5pbkZ1bmN0aW9uQm9keSA9IHRydWU7XG4gICAgdGhpcy5tb2R1bGUgPSBmYWxzZTtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MQlJBQ0UpO1xuICAgIGxldCBbYm9keSwgaXNTdHJpY3RdID0gdGhpcy5wYXJzZUJvZHkoKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUkJSQUNFKTtcblxuICAgIHRoaXMuY2hlY2tCbG9ja1Njb3BlKCk7XG5cbiAgICB0aGlzLlZETiA9IG9sZFZETjtcbiAgICB0aGlzLkxETiA9IG9yaWdpbmFsTEROO1xuXG4gICAgYm9keSA9IHRoaXMubWFya0xvY2F0aW9uKGJvZHksIHN0YXJ0TG9jYXRpb24pO1xuXG4gICAgdGhpcy5sYWJlbFNldCA9IG9sZExhYmVsU2V0O1xuICAgIHRoaXMuaW5JdGVyYXRpb24gPSBvbGRJbkl0ZXJhdGlvbjtcbiAgICB0aGlzLmluU3dpdGNoID0gb2xkSW5Td2l0Y2g7XG4gICAgdGhpcy5pbkZ1bmN0aW9uQm9keSA9IG9sZEluRnVuY3Rpb25Cb2R5O1xuICAgIHRoaXMuc3RyaWN0ID0gcHJldmlvdXNTdHJpY3Q7XG4gICAgdGhpcy5tb2R1bGUgPSBvbGRNb2R1bGU7XG4gICAgcmV0dXJuIFtib2R5LCBpc1N0cmljdF07XG4gIH1cblxuICBwYXJzZUJvZHkoKSB7XG4gICAgbGV0IGxvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCBkaXJlY3RpdmVzID0gW107XG4gICAgbGV0IHN0YXRlbWVudHMgPSBbXTtcbiAgICBsZXQgcGFyc2luZ0RpcmVjdGl2ZXMgPSB0cnVlO1xuICAgIGxldCBpc1N0cmljdCA9IHRoaXMuc3RyaWN0O1xuICAgIGxldCBmaXJzdFJlc3RyaWN0ZWQgPSBudWxsO1xuICAgIHRoaXMud3JhcFZETigoKSA9PiB7XG4gICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICBpZiAodGhpcy5lb2YoKSB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0UpKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgICAgIGxldCB0ZXh0ID0gdG9rZW4uc2xpY2UudGV4dDtcbiAgICAgICAgbGV0IGlzU3RyaW5nTGl0ZXJhbCA9IHRva2VuLnR5cGUgPT09IFRva2VuVHlwZS5TVFJJTkc7XG4gICAgICAgIGxldCBkaXJlY3RpdmVMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICAgICAgbGV0IHN0bXQgPSB0aGlzLnBhcnNlU3RhdGVtZW50TGlzdEl0ZW0oe2lzVG9wTGV2ZWw6IHRydWV9KTtcbiAgICAgICAgaWYgKHBhcnNpbmdEaXJlY3RpdmVzKSB7XG4gICAgICAgICAgaWYgKGlzU3RyaW5nTGl0ZXJhbCAmJiBzdG10LnR5cGUgPT09IFwiRXhwcmVzc2lvblN0YXRlbWVudFwiICYmXG4gICAgICAgICAgICBzdG10LmV4cHJlc3Npb24udHlwZSA9PT0gXCJMaXRlcmFsU3RyaW5nRXhwcmVzc2lvblwiKSB7XG4gICAgICAgICAgICBpZiAodGV4dCA9PT0gXCJcXFwidXNlIHN0cmljdFxcXCJcIiB8fCB0ZXh0ID09PSBcIid1c2Ugc3RyaWN0J1wiKSB7XG4gICAgICAgICAgICAgIGlzU3RyaWN0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgdGhpcy5zdHJpY3QgPSB0cnVlO1xuICAgICAgICAgICAgICBpZiAoZmlyc3RSZXN0cmljdGVkICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKGZpcnN0UmVzdHJpY3RlZCwgRXJyb3JNZXNzYWdlcy5TVFJJQ1RfT0NUQUxfTElURVJBTCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmlyc3RSZXN0cmljdGVkID09IG51bGwgJiYgdG9rZW4ub2N0YWwpIHtcbiAgICAgICAgICAgICAgZmlyc3RSZXN0cmljdGVkID0gdG9rZW47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkaXJlY3RpdmVzLnB1c2godGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIkRpcmVjdGl2ZVwiLCByYXdWYWx1ZTp0ZXh0LnNsaWNlKDEsIC0xKX0sIGRpcmVjdGl2ZUxvY2F0aW9uKSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBhcnNpbmdEaXJlY3RpdmVzID0gZmFsc2U7XG4gICAgICAgICAgICBzdGF0ZW1lbnRzLnB1c2goc3RtdCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0YXRlbWVudHMucHVzaChzdG10KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sICgpID0+IHtcblxuICAgIH0pO1xuICAgIHJldHVybiBbdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIkZ1bmN0aW9uQm9keVwiLCBkaXJlY3RpdmVzLCBzdGF0ZW1lbnRzIH0sIGxvY2F0aW9uKSwgaXNTdHJpY3RdO1xuICB9XG5cbiAgcGFyc2VJbXBvcnRTcGVjaWZpZXIoYm91bmROYW1lcykge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpLCBuYW1lO1xuICAgIGlmICh0aGlzLmxvb2thaGVhZC50eXBlID09PSBUb2tlblR5cGUuSURFTlRJRklFUikge1xuICAgICAgbmFtZSA9IHRoaXMucGFyc2VJZGVudGlmaWVyKCk7XG4gICAgICBpZiAoIXRoaXMuZWF0Q29udGV4dHVhbEtleXdvcmQoXCJhc1wiKSkge1xuICAgICAgICBpZiAoe30uaGFzT3duUHJvcGVydHkuY2FsbChib3VuZE5hbWVzLCBcIiRcIiArIG5hbWUpKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbihzdGFydExvY2F0aW9uLCBFcnJvck1lc3NhZ2VzLklNUE9SVF9EVVBFKTtcbiAgICAgICAgfVxuICAgICAgICBib3VuZE5hbWVzW1wiJFwiICsgbmFtZV0gPSB0cnVlO1xuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24oXG4gICAgICAgICAge1xuICAgICAgICAgICAgdHlwZTogXCJJbXBvcnRTcGVjaWZpZXJcIixcbiAgICAgICAgICAgIG5hbWU6IG51bGwsXG4gICAgICAgICAgICBiaW5kaW5nOiB0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiQmluZGluZ0lkZW50aWZpZXJcIiwgbmFtZTogbmFtZSB9LCBzdGFydExvY2F0aW9uKVxuICAgICAgICAgIH0sIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodGhpcy5sb29rYWhlYWQudHlwZS5rbGFzcy5pc0lkZW50aWZpZXJOYW1lKSB7XG4gICAgICBuYW1lID0gdGhpcy5wYXJzZUlkZW50aWZpZXJOYW1lKCk7XG4gICAgICB0aGlzLmV4cGVjdENvbnRleHR1YWxLZXl3b3JkKFwiYXNcIik7XG4gICAgfVxuXG4gICAgbGV0IGxvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCBib3VuZE5hbWUgPSB0aGlzLnBhcnNlSWRlbnRpZmllcigpO1xuICAgIGlmICh7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGJvdW5kTmFtZXMsIFwiJFwiICsgYm91bmROYW1lKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbihsb2NhdGlvbiwgRXJyb3JNZXNzYWdlcy5JTVBPUlRfRFVQRSk7XG4gICAgfVxuICAgIGJvdW5kTmFtZXNbXCIkXCIgKyBib3VuZE5hbWVdID0gdHJ1ZTtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24oXG4gICAgICB7XG4gICAgICAgIHR5cGU6IFwiSW1wb3J0U3BlY2lmaWVyXCIsXG4gICAgICAgIG5hbWUsXG4gICAgICAgIGJpbmRpbmc6IHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJCaW5kaW5nSWRlbnRpZmllclwiLCBuYW1lOiBib3VuZE5hbWUgfSwgbG9jYXRpb24pLFxuICAgICAgfSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZU5hbWVTcGFjZUJpbmRpbmcoYm91bmROYW1lcykge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5NVUwpO1xuICAgIHRoaXMuZXhwZWN0Q29udGV4dHVhbEtleXdvcmQoXCJhc1wiKTtcbiAgICBsZXQgaWRlbnRpZmllckxvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCBpZGVudGlmaWVyID0gdGhpcy5wYXJzZUlkZW50aWZpZXIoKTtcbiAgICBpZiAoe30uaGFzT3duUHJvcGVydHkuY2FsbChib3VuZE5hbWVzLCBcIiRcIiArIGlkZW50aWZpZXIpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKGlkZW50aWZpZXJMb2NhdGlvbiwgRXJyb3JNZXNzYWdlcy5JTVBPUlRfRFVQRSk7XG4gICAgfVxuICAgIGJvdW5kTmFtZXNbXCIkXCIgKyBpZGVudGlmaWVyXSA9IHRydWU7XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJCaW5kaW5nSWRlbnRpZmllclwiLCBuYW1lOiBpZGVudGlmaWVyIH0sIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VOYW1lZEltcG9ydHMoYm91bmROYW1lcykge1xuICAgIGxldCByZXN1bHQgPSBbXTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTEJSQUNFKTtcbiAgICB3aGlsZSAoIXRoaXMuZWF0KFRva2VuVHlwZS5SQlJBQ0UpKSB7XG4gICAgICByZXN1bHQucHVzaCh0aGlzLnBhcnNlSW1wb3J0U3BlY2lmaWVyKGJvdW5kTmFtZXMpKTtcbiAgICAgIGlmICghdGhpcy5lYXQoVG9rZW5UeXBlLkNPTU1BKSkge1xuICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUkJSQUNFKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBwYXJzZUZyb21DbGF1c2UoKSB7XG4gICAgdGhpcy5leHBlY3RDb250ZXh0dWFsS2V5d29yZChcImZyb21cIik7XG4gICAgbGV0IHZhbHVlID0gdGhpcy5leHBlY3QoVG9rZW5UeXBlLlNUUklORykuX3ZhbHVlO1xuICAgIHRoaXMuY29uc3VtZVNlbWljb2xvbigpO1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIHBhcnNlSW1wb3J0RGVjbGFyYXRpb24oKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCksIGRlZmF1bHRCaW5kaW5nID0gbnVsbCwgbW9kdWxlU3BlY2lmaWVyLCBib3VuZE5hbWVzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuSU1QT1JUKTtcbiAgICBzd2l0Y2ggKHRoaXMubG9va2FoZWFkLnR5cGUpIHtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlNUUklORzpcbiAgICAgICAgbW9kdWxlU3BlY2lmaWVyID0gdGhpcy5sZXgoKS5fdmFsdWU7XG4gICAgICAgIHRoaXMuY29uc3VtZVNlbWljb2xvbigpO1xuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIkltcG9ydFwiLCBkZWZhdWx0QmluZGluZzogbnVsbCwgbmFtZWRJbXBvcnRzOiBbXSwgbW9kdWxlU3BlY2lmaWVyIH0sIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgY2FzZSBUb2tlblR5cGUuSURFTlRJRklFUjpcbiAgICAgICAgZGVmYXVsdEJpbmRpbmcgPSB0aGlzLnBhcnNlQmluZGluZ0lkZW50aWZpZXIoKTtcbiAgICAgICAgYm91bmROYW1lc1tcIiRcIiArIGRlZmF1bHRCaW5kaW5nLm5hbWVdID0gdHJ1ZTtcbiAgICAgICAgaWYgKCF0aGlzLmVhdChUb2tlblR5cGUuQ09NTUEpKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJJbXBvcnRcIiwgZGVmYXVsdEJpbmRpbmcsIG5hbWVkSW1wb3J0czogW10sIG1vZHVsZVNwZWNpZmllcjogdGhpcy5wYXJzZUZyb21DbGF1c2UoKSB9LCBzdGFydExvY2F0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICB9XG4gICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLk1VTCkpIHtcbiAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih7XG4gICAgICAgIHR5cGU6IFwiSW1wb3J0TmFtZXNwYWNlXCIsXG4gICAgICAgIGRlZmF1bHRCaW5kaW5nLFxuICAgICAgICBuYW1lc3BhY2VCaW5kaW5nOiB0aGlzLnBhcnNlTmFtZVNwYWNlQmluZGluZyhib3VuZE5hbWVzKSxcbiAgICAgICAgbW9kdWxlU3BlY2lmaWVyOiB0aGlzLnBhcnNlRnJvbUNsYXVzZSgpIH0sIHN0YXJ0TG9jYXRpb24pO1xuICAgIH0gZWxzZSBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuTEJSQUNFKSkge1xuICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHtcbiAgICAgICAgdHlwZTogXCJJbXBvcnRcIixcbiAgICAgICAgZGVmYXVsdEJpbmRpbmcsXG4gICAgICAgIG5hbWVkSW1wb3J0czogdGhpcy5wYXJzZU5hbWVkSW1wb3J0cyhib3VuZE5hbWVzKSxcbiAgICAgICAgbW9kdWxlU3BlY2lmaWVyOiB0aGlzLnBhcnNlRnJvbUNsYXVzZSgpIH0sIHN0YXJ0TG9jYXRpb24pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuICAgIH1cbiAgfVxuXG4gIHBhcnNlRXhwb3J0U3BlY2lmaWVyKGV4cG9ydGVkTmFtZXMsIGV4cG9ydGVkQmluZGluZ3MpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgbmFtZSA9IHRoaXMucGFyc2VJZGVudGlmaWVyKCk7XG4gICAgZXhwb3J0ZWRCaW5kaW5nc1tcIiRcIiArIG5hbWVdID0gdHJ1ZTtcbiAgICBpZiAodGhpcy5lYXRDb250ZXh0dWFsS2V5d29yZChcImFzXCIpKSB7XG4gICAgICBsZXQgZXhwb3J0ZWROYW1lID0gdGhpcy5wYXJzZUlkZW50aWZpZXJOYW1lKCk7XG4gICAgICBpZiAoe30uaGFzT3duUHJvcGVydHkuY2FsbChleHBvcnRlZE5hbWVzLCBcIiRcIiArIGV4cG9ydGVkTmFtZSkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLkRVUExJQ0FURV9FWFBPUlRFRF9OQU1FLCBleHBvcnRlZE5hbWUpO1xuICAgICAgfVxuICAgICAgZXhwb3J0ZWROYW1lc1tcIiRcIiArIGV4cG9ydGVkTmFtZV0gPSB0cnVlO1xuICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJFeHBvcnRTcGVjaWZpZXJcIiwgbmFtZSwgZXhwb3J0ZWROYW1lIH0sIHN0YXJ0TG9jYXRpb24pO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoe30uaGFzT3duUHJvcGVydHkuY2FsbChleHBvcnRlZE5hbWVzLCBcIiRcIiArIG5hbWUpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5EVVBMSUNBVEVfRVhQT1JURURfTkFNRSwgbmFtZSk7XG4gICAgICB9XG4gICAgICBleHBvcnRlZE5hbWVzW1wiJFwiICsgbmFtZV0gPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIkV4cG9ydFNwZWNpZmllclwiLCBuYW1lOiBudWxsLCBleHBvcnRlZE5hbWU6IG5hbWUgfSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZUV4cG9ydENsYXVzZShleHBvcnRlZE5hbWVzLCBleHBvcnRlZEJpbmRpbmdzKSB7XG4gICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MQlJBQ0UpO1xuICAgIHdoaWxlICghdGhpcy5lYXQoVG9rZW5UeXBlLlJCUkFDRSkpIHtcbiAgICAgIHJlc3VsdC5wdXNoKHRoaXMucGFyc2VFeHBvcnRTcGVjaWZpZXIoZXhwb3J0ZWROYW1lcywgZXhwb3J0ZWRCaW5kaW5ncykpO1xuICAgICAgaWYgKCF0aGlzLmVhdChUb2tlblR5cGUuQ09NTUEpKSB7XG4gICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SQlJBQ0UpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIHBhcnNlRXhwb3J0RGVjbGFyYXRpb24oZXhwb3J0ZWROYW1lcywgZXhwb3J0ZWRCaW5kaW5ncykge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpLCBkZWNsO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5FWFBPUlQpO1xuICAgIGxldCBpc1ZhciA9IGZhbHNlLCBrZXksIG9sZExETiA9IHRoaXMuTEROLCBvbGRWRE4gPSB0aGlzLlZETjtcbiAgICB0aGlzLkxETiA9IFtdO1xuICAgIHRoaXMuVkROID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICBzd2l0Y2ggKHRoaXMubG9va2FoZWFkLnR5cGUpIHtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk1VTDpcbiAgICAgICAgdGhpcy5sZXgoKTtcbiAgICAgICAgLy8gZXhwb3J0ICogRnJvbUNsYXVzZSA7XG4gICAgICAgIGRlY2wgPSB7IHR5cGU6IFwiRXhwb3J0QWxsRnJvbVwiLCBtb2R1bGVTcGVjaWZpZXI6IHRoaXMucGFyc2VGcm9tQ2xhdXNlKCkgfTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFRva2VuVHlwZS5MQlJBQ0U6XG4gICAgICAgIC8vIGV4cG9ydCBFeHBvcnRDbGF1c2UgRnJvbUNsYXVzZSA7XG4gICAgICAgIC8vIGV4cG9ydCBFeHBvcnRDbGF1c2UgO1xuICAgICAgICBsZXQgbmFtZWRFeHBvcnRzID0gdGhpcy5wYXJzZUV4cG9ydENsYXVzZShleHBvcnRlZE5hbWVzLCBleHBvcnRlZEJpbmRpbmdzKTtcbiAgICAgICAgbGV0IG1vZHVsZVNwZWNpZmllciA9IG51bGw7XG4gICAgICAgIGlmICh0aGlzLm1hdGNoQ29udGV4dHVhbEtleXdvcmQoXCJmcm9tXCIpKSB7XG4gICAgICAgICAgbW9kdWxlU3BlY2lmaWVyID0gdGhpcy5wYXJzZUZyb21DbGF1c2UoKTtcbiAgICAgICAgfVxuICAgICAgICBkZWNsID0geyB0eXBlOiBcIkV4cG9ydEZyb21cIiwgbmFtZWRFeHBvcnRzLCBtb2R1bGVTcGVjaWZpZXIgfTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFRva2VuVHlwZS5DTEFTUzpcbiAgICAgICAgLy8gZXhwb3J0IENsYXNzRGVjbGFyYXRpb25cbiAgICAgICAgZGVjbCA9IHsgdHlwZTogXCJFeHBvcnRcIiwgZGVjbGFyYXRpb246IHRoaXMucGFyc2VDbGFzcyh7aXNFeHByOiBmYWxzZX0pIH07XG4gICAgICAgIGlmICh7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGV4cG9ydGVkTmFtZXMsIFwiJFwiICsgZGVjbC5kZWNsYXJhdGlvbi5uYW1lLm5hbWUpKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLkRVUExJQ0FURV9FWFBPUlRFRF9OQU1FLCBkZWNsLmRlY2xhcmF0aW9uLm5hbWUubmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAga2V5ID0gZGVjbC5kZWNsYXJhdGlvbi5uYW1lLm5hbWU7XG4gICAgICAgIGV4cG9ydGVkTmFtZXNbXCIkXCIgKyBrZXldID0gdHJ1ZTtcbiAgICAgICAgZXhwb3J0ZWRCaW5kaW5nc1tcIiRcIiArIGtleV0gPSB0cnVlO1xuICAgICAgICBvbGRMRE4ucHVzaChrZXkpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkZVTkNUSU9OOlxuICAgICAgICAvLyBleHBvcnQgSG9pc3RhYmxlRGVjbGFyYXRpb25cbiAgICAgICAgZGVjbCA9IHsgdHlwZTogXCJFeHBvcnRcIiwgZGVjbGFyYXRpb246IHRoaXMucGFyc2VGdW5jdGlvbih7aXNFeHByOiBmYWxzZSwgaXNUb3BMZXZlbDogdHJ1ZX0pIH07XG4gICAgICAgIGlmICh7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGV4cG9ydGVkTmFtZXMsIFwiJFwiICsgZGVjbC5kZWNsYXJhdGlvbi5uYW1lLm5hbWUpKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLkRVUExJQ0FURV9FWFBPUlRFRF9OQU1FLCBkZWNsLmRlY2xhcmF0aW9uLm5hbWUubmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAga2V5ID0gZGVjbC5kZWNsYXJhdGlvbi5uYW1lLm5hbWU7XG4gICAgICAgIGV4cG9ydGVkTmFtZXNbXCIkXCIgKyBrZXldID0gdHJ1ZTtcbiAgICAgICAgZXhwb3J0ZWRCaW5kaW5nc1tcIiRcIiArIGtleV0gPSB0cnVlO1xuICAgICAgICBvbGRMRE4ucHVzaChrZXkpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkRFRkFVTFQ6XG4gICAgICAgIGlmICh7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGV4cG9ydGVkTmFtZXMsIFwiJGRlZmF1bHRcIikpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuRFVQTElDQVRFX0VYUE9SVEVEX05BTUUsIFwiZGVmYXVsdFwiKTtcbiAgICAgICAgfVxuICAgICAgICBleHBvcnRlZE5hbWVzLiRkZWZhdWx0ID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5sZXgoKTtcbiAgICAgICAgc3dpdGNoICh0aGlzLmxvb2thaGVhZC50eXBlKSB7XG4gICAgICAgICAgY2FzZSBUb2tlblR5cGUuRlVOQ1RJT046XG4gICAgICAgICAgICAvLyBleHBvcnQgZGVmYXVsdCBIb2lzdGFibGVEZWNsYXJhdGlvbltEZWZhdWx0XVxuICAgICAgICAgICAgZGVjbCA9IHtcbiAgICAgICAgICAgICAgdHlwZTogXCJFeHBvcnREZWZhdWx0XCIsXG4gICAgICAgICAgICAgIGJvZHk6IHRoaXMucGFyc2VGdW5jdGlvbih7IGlzRXhwcjogZmFsc2UsIGluRGVmYXVsdDogdHJ1ZSwgaXNUb3BMZXZlbDogdHJ1ZSB9KVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGtleSA9IGRlY2wuYm9keS5uYW1lLm5hbWU7XG4gICAgICAgICAgICBpZiAoa2V5ICE9PSBcIipkZWZhdWx0KlwiKSB7XG4gICAgICAgICAgICAgIGV4cG9ydGVkQmluZGluZ3NbXCIkXCIgKyBrZXldID0gdHJ1ZTtcbiAgICAgICAgICAgICAgb2xkTEROLnB1c2goa2V5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLkNMQVNTOlxuICAgICAgICAgICAgLy8gZXhwb3J0IGRlZmF1bHQgQ2xhc3NEZWNsYXJhdGlvbltEZWZhdWx0XVxuICAgICAgICAgICAgZGVjbCA9IHsgdHlwZTogXCJFeHBvcnREZWZhdWx0XCIsIGJvZHk6IHRoaXMucGFyc2VDbGFzcyh7IGlzRXhwcjogZmFsc2UsIGluRGVmYXVsdDogdHJ1ZSB9KSB9O1xuICAgICAgICAgICAga2V5ID0gZGVjbC5ib2R5Lm5hbWUubmFtZTtcbiAgICAgICAgICAgIGlmIChrZXkgIT09IFwiKmRlZmF1bHQqXCIpIHtcbiAgICAgICAgICAgICAgZXhwb3J0ZWRCaW5kaW5nc1tcIiRcIiArIGtleV0gPSB0cnVlO1xuICAgICAgICAgICAgICBvbGRMRE4ucHVzaChrZXkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICB7XG4gICAgICAgICAgICAvLyBleHBvcnQgZGVmYXVsdCBbbG9va2FoZWFkIOKIiSB7ZnVuY3Rpb24sIGNsYXNzfV0gQXNzaWdubWVudEV4cHJlc3Npb25bSW5dIDtcbiAgICAgICAgICAgIGRlY2wgPSB7IHR5cGU6IFwiRXhwb3J0RGVmYXVsdFwiLCBib2R5OiB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKSB9O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBUb2tlblR5cGUuVkFSOlxuICAgICAgICBpc1ZhciA9IHRydWU7XG4gICAgICAgIC8vIGZhbGxzIHRocm91Z2hcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkxFVDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkNPTlNUOlxuICAgICAgICAvLyBleHBvcnQgTGV4aWNhbERlY2xhcmF0aW9uXG4gICAgICB7XG4gICAgICAgIGxldCBib3VuZE5hbWVzID0gW107XG4gICAgICAgIGRlY2wgPSB7IHR5cGU6IFwiRXhwb3J0XCIsIGRlY2xhcmF0aW9uOiB0aGlzLnBhcnNlVmFyaWFibGVEZWNsYXJhdGlvbih7Ym91bmROYW1lc30pIH07XG4gICAgICAgIGJvdW5kTmFtZXMuZm9yRWFjaChuYW1lID0+IHtcbiAgICAgICAgICAgIGlmICh7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGV4cG9ydGVkTmFtZXMsIFwiJFwiICsgbmFtZSkpIHtcbiAgICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLkRVUExJQ0FURV9FWFBPUlRFRF9OQU1FLCBuYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGV4cG9ydGVkTmFtZXNbXCIkXCIgKyBuYW1lXSA9IHRydWU7XG4gICAgICAgICAgICBleHBvcnRlZEJpbmRpbmdzW1wiJFwiICsgbmFtZV0gPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgICAgaWYgKGlzVmFyKSB7XG4gICAgICAgICAgYm91bmROYW1lcy5mb3JFYWNoKG5hbWUgPT4gb2xkVkROW1wiJFwiICsgbmFtZV0gPSB0cnVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBbXS5wdXNoLmFwcGx5KG9sZExETiwgYm91bmROYW1lcyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jb25zdW1lU2VtaWNvbG9uKCk7XG4gICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICB9XG4gICAgdGhpcy5MRE4gPSBvbGRMRE47XG4gICAgdGhpcy5WRE4gPSBvbGRWRE47XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKGRlY2wsIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VNb2R1bGVJdGVtKGV4cG9ydGVkTmFtZXMsIGV4cG9ydGVkQmluZGluZ3MpIHtcbiAgICBzd2l0Y2ggKHRoaXMubG9va2FoZWFkLnR5cGUpIHtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLklNUE9SVDpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VJbXBvcnREZWNsYXJhdGlvbigpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuRVhQT1JUOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZUV4cG9ydERlY2xhcmF0aW9uKGV4cG9ydGVkTmFtZXMsIGV4cG9ydGVkQmluZGluZ3MpO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VTdGF0ZW1lbnRMaXN0SXRlbSgpO1xuICAgIH1cbiAgfVxuXG4gIGxvb2thaGVhZExleGljYWxEZWNsYXJhdGlvbigpIHtcbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuTEVUKSB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5DT05TVCkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuSURFTlRJRklFUikgJiYgdGhpcy5sb29rYWhlYWQudmFsdWUgPT09IFwibGV0XCIpIHtcbiAgICAgIGxldCBsZXhlclN0YXRlID0gdGhpcy5zYXZlTGV4ZXJTdGF0ZSgpO1xuICAgICAgdGhpcy5sZXgoKTtcbiAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5ZSUVMRCkgfHwgdGhpcy5tYXRjaChUb2tlblR5cGUuSURFTlRJRklFUikgfHxcbiAgICAgICAgdGhpcy5tYXRjaChUb2tlblR5cGUuTEJSQUNFKSB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5MQlJBQ0spKSB7XG4gICAgICAgIHRoaXMucmVzdG9yZUxleGVyU3RhdGUobGV4ZXJTdGF0ZSk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5yZXN0b3JlTGV4ZXJTdGF0ZShsZXhlclN0YXRlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcGFyc2VTdGF0ZW1lbnRMaXN0SXRlbSh7aXNUb3BMZXZlbCA9IGZhbHNlfSA9IHt9KSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgaWYgKHRoaXMuZW9mKCkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgfVxuXG4gICAgbGV0IGRlY2wgPSB0aGlzLndyYXBWRE4oKCkgPT4ge1xuICAgICAgc3dpdGNoICh0aGlzLmxvb2thaGVhZC50eXBlKSB7XG4gICAgICAgIGNhc2UgVG9rZW5UeXBlLkZVTkNUSU9OOlxuICAgICAgICAgIHJldHVybiB0aGlzLnBhcnNlRnVuY3Rpb24oe2lzRXhwcjogZmFsc2UsIGlzVG9wTGV2ZWx9KTtcbiAgICAgICAgY2FzZSBUb2tlblR5cGUuQ0xBU1M6XG4gICAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VDbGFzcyh7aXNFeHByOiBmYWxzZX0pO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGlmICh0aGlzLmxvb2thaGVhZExleGljYWxEZWNsYXJhdGlvbigpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wYXJzZVZhcmlhYmxlRGVjbGFyYXRpb25TdGF0ZW1lbnQoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VTdGF0ZW1lbnQoe2FsbG93TGFiZWxlZEZ1bmN0aW9uOiB0cnVlLCBpc1RvcExldmVsfSk7XG4gICAgICB9XG4gICAgfSwgdGhpcy5jaGVja0Jsb2NrU2NvcGUpO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihkZWNsLCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlU3RhdGVtZW50KHthbGxvd0xhYmVsZWRGdW5jdGlvbiA9IGZhbHNlLCBpc1RvcExldmVsID0gZmFsc2V9ID0ge30pIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgb3JpZ2luYWxMRE4gPSB0aGlzLkxETjtcbiAgICB0aGlzLkxETiA9IFtdO1xuICAgIHZhciBzdG10ID0gdGhpcy53cmFwVkROKCgpID0+IHRoaXMucGFyc2VTdGF0ZW1lbnRIZWxwZXIoYWxsb3dMYWJlbGVkRnVuY3Rpb24sIG9yaWdpbmFsTEROLCBpc1RvcExldmVsKSk7XG4gICAgdGhpcy5MRE4gPSBvcmlnaW5hbExETjtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24oc3RtdCwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZVN0YXRlbWVudEhlbHBlcihhbGxvd0xhYmVsZWRGdW5jdGlvbiwgb3JpZ2luYWxMRE4sIGlzVG9wTGV2ZWwpIHtcbiAgICBpZiAodGhpcy5lb2YoKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICB9XG5cbiAgICBzd2l0Y2ggKHRoaXMubG9va2FoZWFkLnR5cGUpIHtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlNFTUlDT0xPTjpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VFbXB0eVN0YXRlbWVudCgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuTEJSQUNFOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZUJsb2NrU3RhdGVtZW50KCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5MUEFSRU46XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlRXhwcmVzc2lvblN0YXRlbWVudCgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuQlJFQUs6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlQnJlYWtTdGF0ZW1lbnQoKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkNPTlRJTlVFOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZUNvbnRpbnVlU3RhdGVtZW50KCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5ERUJVR0dFUjpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VEZWJ1Z2dlclN0YXRlbWVudCgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuRE86XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlRG9XaGlsZVN0YXRlbWVudCgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuRk9SOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZUZvclN0YXRlbWVudCgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuSUY6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlSWZTdGF0ZW1lbnQoKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlJFVFVSTjpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VSZXR1cm5TdGF0ZW1lbnQoKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlNXSVRDSDpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VTd2l0Y2hTdGF0ZW1lbnQoKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlRIUk9XOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZVRocm93U3RhdGVtZW50KCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5UUlk6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlVHJ5U3RhdGVtZW50KCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5WQVI6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlVmFyaWFibGVEZWNsYXJhdGlvblN0YXRlbWVudCgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuV0hJTEU6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlV2hpbGVTdGF0ZW1lbnQoKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLldJVEg6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlV2l0aFN0YXRlbWVudCgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuRlVOQ1RJT046XG4gICAgICBjYXNlIFRva2VuVHlwZS5DTEFTUzpcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcblxuICAgICAgZGVmYXVsdDoge1xuICAgICAgICBpZiAodGhpcy5sb29rYWhlYWRMZXhpY2FsRGVjbGFyYXRpb24oKSkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGV4cHIgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgICAvLyAxMi4xMiBMYWJlbGxlZCBTdGF0ZW1lbnRzO1xuICAgICAgICBpZiAoZXhwci50eXBlID09PSBcIklkZW50aWZpZXJFeHByZXNzaW9uXCIgJiYgdGhpcy5lYXQoVG9rZW5UeXBlLkNPTE9OKSkge1xuICAgICAgICAgIGxldCBrZXkgPSBcIiRcIiArIGV4cHIubmFtZTtcbiAgICAgICAgICBpZiAoe30uaGFzT3duUHJvcGVydHkuY2FsbCh0aGlzLmxhYmVsU2V0LCBrZXkpKSB7XG4gICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuTEFCRUxfUkVERUNMQVJBVElPTiwgZXhwci5uYW1lKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5MRE4gPSBvcmlnaW5hbExETjtcbiAgICAgICAgICB0aGlzLmxhYmVsU2V0W2tleV0gPSB0cnVlO1xuICAgICAgICAgIGxldCBsYWJlbGVkQm9keTtcbiAgICAgICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuRlVOQ1RJT04pKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5zdHJpY3QgfHwgIWFsbG93TGFiZWxlZEZ1bmN0aW9uKSB7XG4gICAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsYWJlbGVkQm9keSA9IHRoaXMucGFyc2VGdW5jdGlvbih7aXNFeHByOiBmYWxzZSwgYWxsb3dHZW5lcmF0b3I6IGZhbHNlLCBpc1RvcExldmVsfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGxhYmVsZWRCb2R5ID0gdGhpcy5wYXJzZVN0YXRlbWVudCh7YWxsb3dMYWJlbGVkRnVuY3Rpb24sIGlzVG9wTGV2ZWx9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZGVsZXRlIHRoaXMubGFiZWxTZXRba2V5XTtcbiAgICAgICAgICByZXR1cm4geyB0eXBlOiBcIkxhYmVsZWRTdGF0ZW1lbnRcIiwgbGFiZWw6IGV4cHIubmFtZSwgYm9keTogbGFiZWxlZEJvZHkgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmNvbnN1bWVTZW1pY29sb24oKTtcbiAgICAgICAgICByZXR1cm4geyB0eXBlOiBcIkV4cHJlc3Npb25TdGF0ZW1lbnRcIiwgZXhwcmVzc2lvbjogZXhwciB9O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcGFyc2VFbXB0eVN0YXRlbWVudCgpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuU0VNSUNPTE9OKTtcbiAgICByZXR1cm4geyB0eXBlOiBcIkVtcHR5U3RhdGVtZW50XCIgfTtcbiAgfVxuXG4gIHBhcnNlQmxvY2tTdGF0ZW1lbnQoKSB7XG4gICAgbGV0IHN0bXQgPSB7IHR5cGU6IFwiQmxvY2tTdGF0ZW1lbnRcIiwgYmxvY2s6IHRoaXMucGFyc2VCbG9jaygpIH07XG4gICAgdGhpcy5jaGVja0Jsb2NrU2NvcGUoKTtcbiAgICByZXR1cm4gc3RtdDtcbiAgfVxuXG4gIHBhcnNlRXhwcmVzc2lvblN0YXRlbWVudCgpIHtcbiAgICBsZXQgZXhwciA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgdGhpcy5jb25zdW1lU2VtaWNvbG9uKCk7XG4gICAgcmV0dXJuIHsgdHlwZTogXCJFeHByZXNzaW9uU3RhdGVtZW50XCIsIGV4cHJlc3Npb246IGV4cHIgfTtcbiAgfVxuXG4gIHBhcnNlQnJlYWtTdGF0ZW1lbnQoKSB7XG4gICAgbGV0IHRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkJSRUFLKTtcblxuICAgIC8vIENhdGNoIHRoZSB2ZXJ5IGNvbW1vbiBjYXNlIGZpcnN0OiBpbW1lZGlhdGVseSBhIHNlbWljb2xvbiAoVSswMDNCKS5cbiAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLlNFTUlDT0xPTikpIHtcbiAgICAgIGlmICghKHRoaXMuaW5JdGVyYXRpb24gfHwgdGhpcy5pblN3aXRjaCkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5JTExFR0FMX0JSRUFLKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHsgdHlwZTogXCJCcmVha1N0YXRlbWVudFwiLCBsYWJlbDogbnVsbCB9O1xuICAgIH1cblxuICAgIGlmICh0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCkge1xuICAgICAgaWYgKCEodGhpcy5pbkl0ZXJhdGlvbiB8fCB0aGlzLmluU3dpdGNoKSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLklMTEVHQUxfQlJFQUspO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4geyB0eXBlOiBcIkJyZWFrU3RhdGVtZW50XCIsIGxhYmVsOiBudWxsIH07XG4gICAgfVxuXG4gICAgbGV0IGxhYmVsID0gbnVsbDtcbiAgICBpZiAodGhpcy5sb29rYWhlYWQudHlwZSA9PT0gVG9rZW5UeXBlLklERU5USUZJRVIpIHtcbiAgICAgIGxhYmVsID0gdGhpcy5wYXJzZUlkZW50aWZpZXIoKTtcblxuICAgICAgbGV0IGtleSA9IFwiJFwiICsgbGFiZWw7XG4gICAgICBpZiAoIXt9Lmhhc093blByb3BlcnR5LmNhbGwodGhpcy5sYWJlbFNldCwga2V5KSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5LTk9XTl9MQUJFTCwgbGFiZWwpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuY29uc3VtZVNlbWljb2xvbigpO1xuXG4gICAgaWYgKGxhYmVsID09IG51bGwgJiYgISh0aGlzLmluSXRlcmF0aW9uIHx8IHRoaXMuaW5Td2l0Y2gpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLklMTEVHQUxfQlJFQUspO1xuICAgIH1cblxuICAgIHJldHVybiB7IHR5cGU6IFwiQnJlYWtTdGF0ZW1lbnRcIiwgbGFiZWwgfTtcbiAgfVxuXG4gIHBhcnNlQ29udGludWVTdGF0ZW1lbnQoKSB7XG4gICAgbGV0IHRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNPTlRJTlVFKTtcblxuICAgIC8vIENhdGNoIHRoZSB2ZXJ5IGNvbW1vbiBjYXNlIGZpcnN0OiBpbW1lZGlhdGVseSBhIHNlbWljb2xvbiAoVSswMDNCKS5cbiAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLlNFTUlDT0xPTikpIHtcbiAgICAgIGlmICghdGhpcy5pbkl0ZXJhdGlvbikge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLklMTEVHQUxfQ09OVElOVUUpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4geyB0eXBlOiBcIkNvbnRpbnVlU3RhdGVtZW50XCIsIGxhYmVsOiBudWxsIH07XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0KSB7XG4gICAgICBpZiAoIXRoaXMuaW5JdGVyYXRpb24pIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5JTExFR0FMX0NPTlRJTlVFKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHsgdHlwZTogXCJDb250aW51ZVN0YXRlbWVudFwiLCBsYWJlbDogbnVsbCB9O1xuICAgIH1cblxuICAgIGxldCBsYWJlbCA9IG51bGw7XG4gICAgaWYgKHRoaXMubG9va2FoZWFkLnR5cGUgPT09IFRva2VuVHlwZS5JREVOVElGSUVSKSB7XG4gICAgICBsYWJlbCA9IHRoaXMucGFyc2VJZGVudGlmaWVyKCk7XG5cbiAgICAgIGxldCBrZXkgPSBcIiRcIiArIGxhYmVsO1xuICAgICAgaWYgKCF7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRoaXMubGFiZWxTZXQsIGtleSkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlVOS05PV05fTEFCRUwsIGxhYmVsKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmNvbnN1bWVTZW1pY29sb24oKTtcbiAgICBpZiAoIXRoaXMuaW5JdGVyYXRpb24pIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuSUxMRUdBTF9DT05USU5VRSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgdHlwZTogXCJDb250aW51ZVN0YXRlbWVudFwiLCBsYWJlbCB9O1xuICB9XG5cblxuICBwYXJzZURlYnVnZ2VyU3RhdGVtZW50KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5ERUJVR0dFUik7XG4gICAgdGhpcy5jb25zdW1lU2VtaWNvbG9uKCk7XG4gICAgcmV0dXJuIHsgdHlwZTogXCJEZWJ1Z2dlclN0YXRlbWVudFwiIH07XG4gIH1cblxuICBwYXJzZURvV2hpbGVTdGF0ZW1lbnQoKSB7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkRPKTtcbiAgICBsZXQgb2xkSW5JdGVyYXRpb24gPSB0aGlzLmluSXRlcmF0aW9uO1xuICAgIHRoaXMuaW5JdGVyYXRpb24gPSB0cnVlO1xuICAgIGxldCBib2R5ID0gdGhpcy5wYXJzZVN0YXRlbWVudCgpO1xuICAgIHRoaXMuaW5JdGVyYXRpb24gPSBvbGRJbkl0ZXJhdGlvbjtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5XSElMRSk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgbGV0IHRlc3QgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgIHRoaXMuZWF0KFRva2VuVHlwZS5TRU1JQ09MT04pO1xuXG4gICAgcmV0dXJuIHsgdHlwZTogXCJEb1doaWxlU3RhdGVtZW50XCIsIGJvZHksIHRlc3QgfTtcbiAgfVxuXG4gIHN0YXRpYyBpc1ZhbGlkU2ltcGxlQXNzaWdubWVudFRhcmdldChub2RlKSB7XG4gICAgc3dpdGNoIChub2RlLnR5cGUpIHtcbiAgICAgIGNhc2UgXCJCaW5kaW5nSWRlbnRpZmllclwiOlxuICAgICAgY2FzZSBcIklkZW50aWZpZXJFeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiQ29tcHV0ZWRNZW1iZXJFeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiU3RhdGljTWVtYmVyRXhwcmVzc2lvblwiOlxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgc3RhdGljIGJvdW5kTmFtZXMobm9kZSkge1xuICAgIHN3aXRjaCAobm9kZS50eXBlKSB7XG4gICAgICBjYXNlIFwiQmluZGluZ0lkZW50aWZpZXJcIjpcbiAgICAgICAgcmV0dXJuIFtub2RlLm5hbWVdO1xuICAgICAgY2FzZSBcIkJpbmRpbmdXaXRoRGVmYXVsdFwiOlxuICAgICAgICByZXR1cm4gUGFyc2VyLmJvdW5kTmFtZXMobm9kZS5iaW5kaW5nKTtcbiAgICAgIGNhc2UgXCJBcnJheUJpbmRpbmdcIjoge1xuICAgICAgICBsZXQgbmFtZXMgPSBbXTtcbiAgICAgICAgbm9kZS5lbGVtZW50cy5maWx0ZXIoZSA9PiBlICE9IG51bGwpLmZvckVhY2goZSA9PiBbXS5wdXNoLmFwcGx5KG5hbWVzLCBQYXJzZXIuYm91bmROYW1lcyhlKSkpO1xuICAgICAgICBpZiAobm9kZS5yZXN0RWxlbWVudCAhPSBudWxsKSB7XG4gICAgICAgICAgW10ucHVzaC5hcHBseShuYW1lcywgUGFyc2VyLmJvdW5kTmFtZXMobm9kZS5yZXN0RWxlbWVudCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuYW1lcztcbiAgICAgIH1cbiAgICAgIGNhc2UgXCJPYmplY3RCaW5kaW5nXCI6IHtcbiAgICAgICAgbGV0IG5hbWVzID0gW107XG4gICAgICAgIG5vZGUucHJvcGVydGllcy5mb3JFYWNoKHAgPT4ge1xuICAgICAgICAgIHN3aXRjaCAocC50eXBlKSB7XG4gICAgICAgICAgICBjYXNlIFwiQmluZGluZ1Byb3BlcnR5SWRlbnRpZmllclwiOlxuICAgICAgICAgICAgICBuYW1lcy5wdXNoKHAuYmluZGluZy5uYW1lKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiQmluZGluZ1Byb3BlcnR5UHJvcGVydHlcIjpcbiAgICAgICAgICAgICAgW10ucHVzaC5hcHBseShuYW1lcywgUGFyc2VyLmJvdW5kTmFtZXMocC5iaW5kaW5nKSk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgLy8gaXN0YW5idWwgaWdub3JlIG5leHRcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImJvdW5kTmFtZXMgY2FsbGVkIG9uIE9iamVjdEJpbmRpbmcgd2l0aCBpbnZhbGlkIHByb3BlcnR5OiBcIiArIHAudHlwZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG5hbWVzO1xuICAgICAgfVxuICAgICAgY2FzZSBcIkNvbXB1dGVkTWVtYmVyRXhwcmVzc2lvblwiOlxuICAgICAgY2FzZSBcIlN0YXRpY01lbWJlckV4cHJlc3Npb25cIjpcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICAvLyBpc3RhbmJ1bCBpZ25vcmUgbmV4dFxuICAgIHRocm93IG5ldyBFcnJvcihcImJvdW5kTmFtZXMgY2FsbGVkIG9uIGludmFsaWQgYXNzaWdubWVudCB0YXJnZXQ6IFwiICsgbm9kZS50eXBlKTtcbiAgfVxuXG4gIHBhcnNlRm9yU3RhdGVtZW50KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5GT1IpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MUEFSRU4pO1xuICAgIGxldCB0ZXN0ID0gbnVsbDtcbiAgICBsZXQgcmlnaHQgPSBudWxsO1xuICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuU0VNSUNPTE9OKSkge1xuICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5TRU1JQ09MT04pKSB7XG4gICAgICAgIHRlc3QgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgfVxuICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlNFTUlDT0xPTik7XG4gICAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJQQVJFTikpIHtcbiAgICAgICAgcmlnaHQgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogXCJGb3JTdGF0ZW1lbnRcIixcbiAgICAgICAgaW5pdDogbnVsbCxcbiAgICAgICAgdGVzdCxcbiAgICAgICAgdXBkYXRlOiByaWdodCxcbiAgICAgICAgYm9keTogdGhpcy5nZXRJdGVyYXRvclN0YXRlbWVudEVwaWxvZ3VlKClcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBzdGFydHNXaXRoTGV0ID0gdGhpcy5tYXRjaChUb2tlblR5cGUuTEVUKSB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5JREVOVElGSUVSKSAmJiB0aGlzLmxvb2thaGVhZC52YWx1ZSA9PT0gXCJsZXRcIjtcbiAgICAgIGxldCBpc0ZvckRlY2wgPSB0aGlzLmxvb2thaGVhZExleGljYWxEZWNsYXJhdGlvbigpO1xuICAgICAgbGV0IGxlZnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5WQVIpIHx8IGlzRm9yRGVjbCkge1xuICAgICAgICBsZXQgcHJldmlvdXNBbGxvd0luID0gdGhpcy5hbGxvd0luO1xuICAgICAgICB0aGlzLmFsbG93SW4gPSBmYWxzZTtcbiAgICAgICAgbGV0IGluaXQgPSB0aGlzLnBhcnNlVmFyaWFibGVEZWNsYXJhdGlvbih7aW5Gb3I6IHRydWV9KTtcbiAgICAgICAgdGhpcy5hbGxvd0luID0gcHJldmlvdXNBbGxvd0luO1xuXG4gICAgICAgIGlmIChpbml0LmRlY2xhcmF0b3JzLmxlbmd0aCA9PT0gMSAmJiAodGhpcy5tYXRjaChUb2tlblR5cGUuSU4pIHx8IHRoaXMubWF0Y2hDb250ZXh0dWFsS2V5d29yZChcIm9mXCIpKSkge1xuICAgICAgICAgIGxldCB0eXBlO1xuXG4gICAgICAgICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLklOKSkge1xuICAgICAgICAgICAgaWYgKGluaXQuZGVjbGFyYXRvcnNbMF0uaW5pdCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5JTlZBTElEX1ZBUl9JTklUX0ZPUl9JTik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0eXBlID0gXCJGb3JJblN0YXRlbWVudFwiO1xuICAgICAgICAgICAgdGhpcy5sZXgoKTtcbiAgICAgICAgICAgIHJpZ2h0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKGluaXQuZGVjbGFyYXRvcnNbMF0uaW5pdCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5JTlZBTElEX1ZBUl9JTklUX0ZPUl9PRik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0eXBlID0gXCJGb3JPZlN0YXRlbWVudFwiO1xuICAgICAgICAgICAgZm9yIChsZXQga2V5IGluIHRoaXMuVkROKSB7XG4gICAgICAgICAgICAgIHRoaXMuVkROW2tleV0gPSBGT1JfT0ZfVkFSO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmxleCgpO1xuICAgICAgICAgICAgcmlnaHQgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsZXQgYm9keSA9IHRoaXMud3JhcFZETih0aGlzLmdldEl0ZXJhdG9yU3RhdGVtZW50RXBpbG9ndWUsIGlzRm9yRGVjbCAmJiB0aGlzLmNoZWNrQmxvY2tTY29wZSk7XG5cbiAgICAgICAgICByZXR1cm4geyB0eXBlLCBsZWZ0OiBpbml0LCByaWdodCwgYm9keSB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5TRU1JQ09MT04pO1xuICAgICAgICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuU0VNSUNPTE9OKSkge1xuICAgICAgICAgICAgdGVzdCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5TRU1JQ09MT04pO1xuICAgICAgICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuUlBBUkVOKSkge1xuICAgICAgICAgICAgcmlnaHQgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogXCJGb3JTdGF0ZW1lbnRcIixcbiAgICAgICAgICAgIGluaXQsXG4gICAgICAgICAgICB0ZXN0LFxuICAgICAgICAgICAgdXBkYXRlOiByaWdodCxcbiAgICAgICAgICAgIGJvZHk6IHRoaXMud3JhcFZETih0aGlzLmdldEl0ZXJhdG9yU3RhdGVtZW50RXBpbG9ndWUsIGlzRm9yRGVjbCAmJiB0aGlzLmNoZWNrQmxvY2tTY29wZSlcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsZXQgcHJldmlvdXNBbGxvd0luID0gdGhpcy5hbGxvd0luO1xuICAgICAgICB0aGlzLmFsbG93SW4gPSBmYWxzZTtcbiAgICAgICAgbGV0IHtleHByLCBwYXR0ZXJuLCBleHByRXJyb3J9ID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uT3JCaW5kaW5nRWxlbWVudCgpO1xuICAgICAgICB0aGlzLmFsbG93SW4gPSBwcmV2aW91c0FsbG93SW47XG5cbiAgICAgICAgaWYgKHBhdHRlcm4gJiYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLklOKSB8fCB0aGlzLm1hdGNoQ29udGV4dHVhbEtleXdvcmQoXCJvZlwiKSkpIHtcbiAgICAgICAgICBpZiAoc3RhcnRzV2l0aExldCAmJiB0aGlzLm1hdGNoQ29udGV4dHVhbEtleXdvcmQoXCJvZlwiKSkge1xuICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLklOVkFMSURfVkFSX0xIU19GT1JfT0YpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBsZXQgdHlwZSA9IHRoaXMubWF0Y2goVG9rZW5UeXBlLklOKSA/IFwiRm9ySW5TdGF0ZW1lbnRcIiA6IFwiRm9yT2ZTdGF0ZW1lbnRcIjtcblxuICAgICAgICAgIHRoaXMubGV4KCk7XG4gICAgICAgICAgcmlnaHQgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuXG4gICAgICAgICAgcmV0dXJuIHsgdHlwZSwgbGVmdDogcGF0dGVybiwgcmlnaHQsIGJvZHk6IHRoaXMuZ2V0SXRlcmF0b3JTdGF0ZW1lbnRFcGlsb2d1ZSgpIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKCFleHByKSB7XG4gICAgICAgICAgICB0aHJvdyBleHByRXJyb3I7XG4gICAgICAgICAgfVxuICAgICAgICAgIHdoaWxlICh0aGlzLmVhdChUb2tlblR5cGUuQ09NTUEpKSB7XG4gICAgICAgICAgICBsZXQgcmhzID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgICAgICAgICBleHByID0gdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIkJpbmFyeUV4cHJlc3Npb25cIiwgbGVmdDogZXhwciwgb3BlcmF0b3I6IFwiLFwiLCByaWdodDogcmhzfSwgbGVmdExvY2F0aW9uKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKCh0aGlzLm1hdGNoKFRva2VuVHlwZS5JTikgfHwgdGhpcy5tYXRjaENvbnRleHR1YWxLZXl3b3JkKFwib2ZcIikpKSB7XG4gICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuSU5WQUxJRF9MSFNfSU5fRk9SX0lOKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlNFTUlDT0xPTik7XG4gICAgICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5TRU1JQ09MT04pKSB7XG4gICAgICAgICAgICB0ZXN0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlNFTUlDT0xPTik7XG4gICAgICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5SUEFSRU4pKSB7XG4gICAgICAgICAgICByaWdodCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB7IHR5cGU6IFwiRm9yU3RhdGVtZW50XCIsIGluaXQ6IGV4cHIsIHRlc3QsIHVwZGF0ZTogcmlnaHQsIGJvZHk6IHRoaXMuZ2V0SXRlcmF0b3JTdGF0ZW1lbnRFcGlsb2d1ZSgpIH07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBnZXRJdGVyYXRvclN0YXRlbWVudEVwaWxvZ3VlKCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgIGxldCBvbGRJbkl0ZXJhdGlvbiA9IHRoaXMuaW5JdGVyYXRpb247XG4gICAgdGhpcy5pbkl0ZXJhdGlvbiA9IHRydWU7XG4gICAgbGV0IGJvZHkgPSB0aGlzLnBhcnNlU3RhdGVtZW50KCk7XG4gICAgdGhpcy5pbkl0ZXJhdGlvbiA9IG9sZEluSXRlcmF0aW9uO1xuICAgIHJldHVybiBib2R5O1xuICB9XG5cbiAgcGFyc2VJZlN0YXRlbWVudCgpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuSUYpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MUEFSRU4pO1xuICAgIGxldCB0ZXN0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgIGxldCBjb25zZXF1ZW50ID0gdGhpcy5wYXJzZVN0YXRlbWVudCgpO1xuICAgIGxldCBhbHRlcm5hdGUgPSBudWxsO1xuICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuRUxTRSkpIHtcbiAgICAgIGFsdGVybmF0ZSA9IHRoaXMucGFyc2VTdGF0ZW1lbnQoKTtcbiAgICB9XG4gICAgcmV0dXJuIHsgdHlwZTogXCJJZlN0YXRlbWVudFwiLCB0ZXN0LCBjb25zZXF1ZW50LCBhbHRlcm5hdGUgfTtcbiAgfVxuXG4gIHBhcnNlUmV0dXJuU3RhdGVtZW50KCkge1xuICAgIGxldCBleHByZXNzaW9uID0gbnVsbDtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SRVRVUk4pO1xuICAgIGlmICghdGhpcy5pbkZ1bmN0aW9uQm9keSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLklMTEVHQUxfUkVUVVJOKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQpIHtcbiAgICAgIHJldHVybiB7IHR5cGU6IFwiUmV0dXJuU3RhdGVtZW50XCIsIGV4cHJlc3Npb24gfTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlNFTUlDT0xPTikpIHtcbiAgICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuUkJSQUNFKSAmJiAhdGhpcy5lb2YoKSkge1xuICAgICAgICBleHByZXNzaW9uID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmNvbnN1bWVTZW1pY29sb24oKTtcbiAgICByZXR1cm4geyB0eXBlOiBcIlJldHVyblN0YXRlbWVudFwiLCBleHByZXNzaW9uIH07XG4gIH1cblxuICBwYXJzZVdpdGhTdGF0ZW1lbnQoKSB7XG4gICAgaWYgKHRoaXMuc3RyaWN0KSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX01PREVfV0lUSCk7XG4gICAgfVxuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLldJVEgpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MUEFSRU4pO1xuICAgIGxldCBvYmplY3QgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgIGxldCBib2R5ID0gdGhpcy5wYXJzZVN0YXRlbWVudCgpO1xuXG4gICAgcmV0dXJuIHsgdHlwZTogXCJXaXRoU3RhdGVtZW50XCIsIG9iamVjdCwgYm9keSB9O1xuICB9XG5cbiAgcGFyc2VTd2l0Y2hTdGF0ZW1lbnQoKSB7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlNXSVRDSCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgbGV0IGRpc2NyaW1pbmFudCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJQQVJFTik7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxCUkFDRSk7XG5cbiAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLlJCUkFDRSkpIHtcbiAgICAgIHJldHVybiB7IHR5cGU6IFwiU3dpdGNoU3RhdGVtZW50XCIsIGRpc2NyaW1pbmFudCwgY2FzZXM6IFtdIH07XG4gICAgfVxuICAgIGxldCBvbGRJblN3aXRjaCA9IHRoaXMuaW5Td2l0Y2g7XG4gICAgdGhpcy5pblN3aXRjaCA9IHRydWU7XG4gICAgcmV0dXJuIHRoaXMud3JhcFZETigoKSA9PiB7XG4gICAgICBsZXQgY2FzZXMgPSB0aGlzLnBhcnNlU3dpdGNoQ2FzZXMoKTtcbiAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5ERUZBVUxUKSkge1xuICAgICAgICBsZXQgZGVmYXVsdENhc2UgPSB0aGlzLnBhcnNlU3dpdGNoRGVmYXVsdCgpO1xuICAgICAgICBsZXQgcG9zdERlZmF1bHRDYXNlcyA9IHRoaXMucGFyc2VTd2l0Y2hDYXNlcygpO1xuICAgICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuREVGQVVMVCkpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuTVVMVElQTEVfREVGQVVMVFNfSU5fU1dJVENIKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmluU3dpdGNoID0gb2xkSW5Td2l0Y2g7XG4gICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SQlJBQ0UpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHR5cGU6IFwiU3dpdGNoU3RhdGVtZW50V2l0aERlZmF1bHRcIixcbiAgICAgICAgICBkaXNjcmltaW5hbnQsXG4gICAgICAgICAgcHJlRGVmYXVsdENhc2VzOiBjYXNlcyxcbiAgICAgICAgICBkZWZhdWx0Q2FzZSxcbiAgICAgICAgICBwb3N0RGVmYXVsdENhc2VzXG4gICAgICAgIH07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmluU3dpdGNoID0gb2xkSW5Td2l0Y2g7XG4gICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SQlJBQ0UpO1xuICAgICAgICByZXR1cm4geyB0eXBlOiBcIlN3aXRjaFN0YXRlbWVudFwiLCBkaXNjcmltaW5hbnQsIGNhc2VzIH07XG4gICAgICB9XG4gICAgfSwgdGhpcy5jaGVja0Jsb2NrU2NvcGUpO1xuICB9XG5cbiAgcGFyc2VTd2l0Y2hDYXNlcygpIHtcbiAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgd2hpbGUgKCEodGhpcy5lb2YoKSB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0UpIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLkRFRkFVTFQpKSkge1xuICAgICAgcmVzdWx0LnB1c2godGhpcy5wYXJzZVN3aXRjaENhc2UoKSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBwYXJzZVN3aXRjaENhc2UoKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNBU0UpO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih7XG4gICAgICB0eXBlOiBcIlN3aXRjaENhc2VcIixcbiAgICAgIHRlc3Q6IHRoaXMucGFyc2VFeHByZXNzaW9uKCksXG4gICAgICBjb25zZXF1ZW50OiB0aGlzLnBhcnNlU3dpdGNoQ2FzZUJvZHkoKVxuICAgIH0sIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VTd2l0Y2hEZWZhdWx0KCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5ERUZBVUxUKTtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIlN3aXRjaERlZmF1bHRcIiwgY29uc2VxdWVudDogdGhpcy5wYXJzZVN3aXRjaENhc2VCb2R5KCkgfSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZVN3aXRjaENhc2VCb2R5KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5DT0xPTik7XG4gICAgcmV0dXJuIHRoaXMucGFyc2VTdGF0ZW1lbnRMaXN0SW5Td2l0Y2hDYXNlQm9keSgpO1xuICB9XG5cbiAgcGFyc2VTdGF0ZW1lbnRMaXN0SW5Td2l0Y2hDYXNlQm9keSgpIHtcbiAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgd2hpbGUgKCEodGhpcy5lb2YoKSB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0UpIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLkRFRkFVTFQpIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLkNBU0UpKSkge1xuICAgICAgcmVzdWx0LnB1c2godGhpcy5wYXJzZVN0YXRlbWVudExpc3RJdGVtKCkpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgcGFyc2VUaHJvd1N0YXRlbWVudCgpIHtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmV4cGVjdChUb2tlblR5cGUuVEhST1cpO1xuXG4gICAgaWYgKHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0KSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLk5FV0xJTkVfQUZURVJfVEhST1cpO1xuICAgIH1cblxuICAgIGxldCBleHByZXNzaW9uID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcblxuICAgIHRoaXMuY29uc3VtZVNlbWljb2xvbigpO1xuXG4gICAgcmV0dXJuIHsgdHlwZTogXCJUaHJvd1N0YXRlbWVudFwiLCBleHByZXNzaW9uIH07XG4gIH1cblxuICBwYXJzZVRyeVN0YXRlbWVudCgpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuVFJZKTtcbiAgICBsZXQgYm9keSA9IHRoaXMud3JhcFZETih0aGlzLnBhcnNlQmxvY2ssIHRoaXMuY2hlY2tCbG9ja1Njb3BlKTtcblxuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5DQVRDSCkpIHtcbiAgICAgIGxldCBjYXRjaENsYXVzZSA9IHRoaXMucGFyc2VDYXRjaENsYXVzZSgpO1xuICAgICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5GSU5BTExZKSkge1xuICAgICAgICBsZXQgZmluYWxpemVyID0gdGhpcy53cmFwVkROKHRoaXMucGFyc2VCbG9jaywgdGhpcy5jaGVja0Jsb2NrU2NvcGUpO1xuICAgICAgICByZXR1cm4geyB0eXBlOiBcIlRyeUZpbmFsbHlTdGF0ZW1lbnRcIiwgYm9keSwgY2F0Y2hDbGF1c2UsIGZpbmFsaXplciB9O1xuICAgICAgfVxuICAgICAgcmV0dXJuIHsgdHlwZTogXCJUcnlDYXRjaFN0YXRlbWVudFwiLCBib2R5LCBjYXRjaENsYXVzZSB9O1xuICAgIH1cblxuICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuRklOQUxMWSkpIHtcbiAgICAgIGxldCBmaW5hbGl6ZXIgPSB0aGlzLndyYXBWRE4odGhpcy5wYXJzZUJsb2NrLCB0aGlzLmNoZWNrQmxvY2tTY29wZSk7XG4gICAgICByZXR1cm4geyB0eXBlOiBcIlRyeUZpbmFsbHlTdGF0ZW1lbnRcIiwgYm9keSwgY2F0Y2hDbGF1c2U6IG51bGwsIGZpbmFsaXplciB9O1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuTk9fQ0FUQ0hfT1JfRklOQUxMWSk7XG4gICAgfVxuICB9XG5cbiAgcGFyc2VWYXJpYWJsZURlY2xhcmF0aW9uU3RhdGVtZW50KCkge1xuICAgIGxldCBkZWNsYXJhdGlvbiA9IHRoaXMucGFyc2VWYXJpYWJsZURlY2xhcmF0aW9uKCk7XG4gICAgdGhpcy5jb25zdW1lU2VtaWNvbG9uKCk7XG4gICAgcmV0dXJuIHsgdHlwZTogXCJWYXJpYWJsZURlY2xhcmF0aW9uU3RhdGVtZW50XCIsIGRlY2xhcmF0aW9uIH07XG4gIH1cblxuICBwYXJzZVdoaWxlU3RhdGVtZW50KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5XSElMRSk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgcmV0dXJuIHsgdHlwZTogXCJXaGlsZVN0YXRlbWVudFwiLCB0ZXN0OiB0aGlzLnBhcnNlRXhwcmVzc2lvbigpLCBib2R5OiB0aGlzLmdldEl0ZXJhdG9yU3RhdGVtZW50RXBpbG9ndWUoKSB9O1xuICB9XG5cbiAgcGFyc2VDYXRjaENsYXVzZSgpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5DQVRDSCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgbGV0IHRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLlJQQVJFTikgfHwgdGhpcy5tYXRjaChUb2tlblR5cGUuTFBBUkVOKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRva2VuKTtcbiAgICB9XG5cbiAgICBsZXQgYmluZGluZyA9IHRoaXMucGFyc2VCaW5kaW5nVGFyZ2V0KCk7XG5cbiAgICBsZXQgYm91bmQgPSBQYXJzZXIuYm91bmROYW1lcyhiaW5kaW5nKTtcbiAgICBpZiAoZmlyc3REdXBsaWNhdGUoYm91bmQpICE9IG51bGwpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuRFVQTElDQVRFX0JJTkRJTkcsIGZpcnN0RHVwbGljYXRlKGJvdW5kKSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuc3RyaWN0ICYmIGJvdW5kLnNvbWUoaXNSZXN0cmljdGVkV29yZCkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuU1RSSUNUX0NBVENIX1ZBUklBQkxFKTtcbiAgICB9XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcblxuICAgIGxldCBib2R5ID0gdGhpcy53cmFwVkROKHRoaXMucGFyc2VCbG9jaywgdGhpcy5jaGVja0Jsb2NrU2NvcGUpO1xuXG4gICAgdGhpcy5MRE4uZm9yRWFjaChuYW1lID0+IHtcbiAgICAgIGlmIChib3VuZC5pbmRleE9mKG5hbWUpID49IDApIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5EVVBMSUNBVEVfQklORElORywgbmFtZSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgZm9yIChsZXQga2V5IGluIHRoaXMuVkROKSB7XG4gICAgICBpZiAodGhpcy5WRE5ba2V5XSA9PT0gRk9SX09GX1ZBUiAmJiBib3VuZC5pbmRleE9mKGtleS5zbGljZSgxKSkgPj0gMCkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuRFVQTElDQVRFX0NBVENIX0JJTkRJTkcsIGtleS5zbGljZSgxKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiQ2F0Y2hDbGF1c2VcIiwgYmluZGluZywgYm9keSB9LCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlQmxvY2soKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxCUkFDRSk7XG5cbiAgICBsZXQgYm9keSA9IFtdO1xuICAgIHdoaWxlICghdGhpcy5tYXRjaChUb2tlblR5cGUuUkJSQUNFKSkge1xuICAgICAgYm9keS5wdXNoKHRoaXMucGFyc2VTdGF0ZW1lbnRMaXN0SXRlbSgpKTtcbiAgICB9XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJCUkFDRSk7XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJCbG9ja1wiLCBzdGF0ZW1lbnRzOiBib2R5IH0sIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VWYXJpYWJsZURlY2xhcmF0aW9uKHtpbkZvciA9IGZhbHNlLCBib3VuZE5hbWVzID0gW119ID0ge30pIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxleCgpO1xuXG4gICAgLy8gUHJlY2VkZWQgYnkgdGhpcy5tYXRjaChUb2tlblN1YlR5cGUuVkFSKSB8fCB0aGlzLm1hdGNoKFRva2VuU3ViVHlwZS5MRVQpO1xuICAgIGxldCBraW5kID0gdG9rZW4udHlwZSA9PT0gVG9rZW5UeXBlLlZBUiA/IFwidmFyXCIgOiB0b2tlbi50eXBlID09PSBUb2tlblR5cGUuQ09OU1QgPyBcImNvbnN0XCIgOiBcImxldFwiO1xuICAgIGxldCBkZWNsYXJhdG9ycyA9IHRoaXMucGFyc2VWYXJpYWJsZURlY2xhcmF0b3JMaXN0KGtpbmQsIHtpbkZvciwgYm91bmROYW1lc30pO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiVmFyaWFibGVEZWNsYXJhdGlvblwiLCBraW5kLCBkZWNsYXJhdG9ycyB9LCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlVmFyaWFibGVEZWNsYXJhdG9yTGlzdChraW5kLCB7aW5Gb3IsIGJvdW5kTmFtZXN9KSB7XG4gICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgIGxldCBbdmFyRGVjbCwgYWxsQm91bmRdID0gdGhpcy5wYXJzZVZhcmlhYmxlRGVjbGFyYXRvcihraW5kLCB7aW5Gb3IsIGFsbG93Q29uc3RXaXRob3V0QmluZGluZzogaW5Gb3J9KTtcbiAgICByZXN1bHQucHVzaCh2YXJEZWNsKTtcbiAgICBpZiAoaW5Gb3IgJiYga2luZCA9PT0gXCJjb25zdFwiICYmIHZhckRlY2wuaW5pdCA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICB3aGlsZSAodGhpcy5lYXQoVG9rZW5UeXBlLkNPTU1BKSkge1xuICAgICAgbGV0IFtuZXh0VmFyRGVjbCwgYm91bmRdID0gdGhpcy5wYXJzZVZhcmlhYmxlRGVjbGFyYXRvcihraW5kLCB7aW5Gb3IsIGFsbG93Q29uc3RXaXRob3V0QmluZGluZzogZmFsc2V9KTtcbiAgICAgIHJlc3VsdC5wdXNoKG5leHRWYXJEZWNsKTtcbiAgICAgIGlmIChraW5kICE9PSBcInZhclwiKSB7XG4gICAgICAgIGFsbEJvdW5kID0gYWxsQm91bmQuY29uY2F0KGJvdW5kKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5zdHJpY3QgJiYgYWxsQm91bmQuc29tZShpc1Jlc3RyaWN0ZWRXb3JkKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0aGlzLmxvb2thaGVhZCwgRXJyb3JNZXNzYWdlcy5TVFJJQ1RfVkFSX05BTUUpO1xuICAgIH1cblxuICAgIGlmIChraW5kICE9PSBcInZhclwiKSB7XG4gICAgICBsZXQgZHVwZSA9IGZpcnN0RHVwbGljYXRlKGFsbEJvdW5kKTtcbiAgICAgIGlmIChkdXBlICE9PSBudWxsKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5EVVBMSUNBVEVfQklORElORywgZHVwZSk7XG4gICAgICB9XG4gICAgfVxuICAgIFtdLnB1c2guYXBwbHkoYm91bmROYW1lcywgYWxsQm91bmQpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBwYXJzZVZhcmlhYmxlRGVjbGFyYXRvcihraW5kLCB7aW5Gb3IsIGFsbG93Q29uc3RXaXRob3V0QmluZGluZ30pIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcblxuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5MUEFSRU4pKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuICAgIH1cblxuICAgIGxldCBiaW5kaW5nID0gdGhpcy5wYXJzZUJpbmRpbmdUYXJnZXQoKTtcbiAgICBpZiAoIWluRm9yICYmIGJpbmRpbmcudHlwZSAhPT0gJ0JpbmRpbmdJZGVudGlmaWVyJyAmJiAhdGhpcy5tYXRjaChUb2tlblR5cGUuQVNTSUdOKSkge1xuICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkFTU0lHTik7XG4gICAgfVxuICAgIGxldCBib3VuZCA9IFBhcnNlci5ib3VuZE5hbWVzKGJpbmRpbmcpO1xuXG4gICAgbGV0IGluaXQgPSBudWxsO1xuICAgIGlmIChraW5kID09PSBcImNvbnN0XCIpIHtcbiAgICAgIGlmICghYWxsb3dDb25zdFdpdGhvdXRCaW5kaW5nIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLkFTU0lHTikpIHtcbiAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkFTU0lHTik7XG4gICAgICAgIGluaXQgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5BU1NJR04pKSB7XG4gICAgICBpbml0ID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgfVxuXG4gICAgaWYgKGtpbmQgPT09IFwidmFyXCIpIHtcbiAgICAgIGJvdW5kLmZvckVhY2gobmFtZSA9PiB0aGlzLlZETltcIiRcIiArIG5hbWVdID0gdHJ1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChib3VuZC5pbmRleE9mKFwibGV0XCIpID49IDApIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5MRVhJQ0FMTFlfQk9VTkRfTEVUKTtcbiAgICAgIH1cbiAgICAgIFtdLnB1c2guYXBwbHkodGhpcy5MRE4sIGJvdW5kKTtcbiAgICB9XG4gICAgcmV0dXJuIFt0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiVmFyaWFibGVEZWNsYXJhdG9yXCIsIGJpbmRpbmcsIGluaXQgfSwgc3RhcnRMb2NhdGlvbiksIGJvdW5kXTtcbiAgfVxuXG4gIHN0YXRpYyBnZXRFeHByKHtleHByLCBleHByRXJyb3J9KSB7XG4gICAgaWYgKCFleHByKSB0aHJvdyBleHByRXJyb3I7XG4gICAgcmV0dXJuIGV4cHI7XG4gIH1cblxuICBwYXJzZUV4cHJlc3Npb24oKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICBsZXQgZ3JvdXAgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuQ09NTUEpKSB7XG4gICAgICB3aGlsZSAoIXRoaXMuZW9mKCkpIHtcbiAgICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5DT01NQSkpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxleCgpO1xuICAgICAgICBsZXQgZXhwciA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgICBncm91cCA9IHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJCaW5hcnlFeHByZXNzaW9uXCIsIGxlZnQ6IGdyb3VwLCBvcGVyYXRvcjogXCIsXCIsIHJpZ2h0OiBleHByIH0sIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZ3JvdXA7XG4gIH1cblxuICBwYXJzZUFycm93RXhwcmVzc2lvblRhaWwoaGVhZCwgc3RhcnRMb2NhdGlvbikge1xuICAgIGxldCBhcnJvdyA9IHRoaXMuZXhwZWN0KFRva2VuVHlwZS5BUlJPVyk7XG5cbiAgICAvLyBDb252ZXJ0IHBhcmFtIGxpc3QuXG4gICAgbGV0IHtwYXJhbXMgPSBudWxsLCByZXN0ID0gbnVsbH0gPSBoZWFkO1xuICAgIGlmIChoZWFkLnR5cGUgIT09IEFSUk9XX0VYUFJFU1NJT05fUEFSQU1TKSB7XG4gICAgICBpZiAoaGVhZC50eXBlID09PSBcIkJpbmRpbmdJZGVudGlmaWVyXCIpIHtcbiAgICAgICAgbGV0IG5hbWUgPSBoZWFkLm5hbWU7XG4gICAgICAgIGlmIChTVFJJQ1RfTU9ERV9SRVNFUlZFRF9XT1JELmhhc093blByb3BlcnR5KG5hbWUpKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlNUUklDVF9SRVNFUlZFRF9XT1JEKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNSZXN0cmljdGVkV29yZChuYW1lKSkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUEFSQU1fTkFNRSk7XG4gICAgICAgIH1cbiAgICAgICAgcGFyYW1zID0gW2hlYWRdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKGFycm93KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgcGFyYW1zTm9kZSA9IHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJGb3JtYWxQYXJhbWV0ZXJzXCIsIGl0ZW1zOiBwYXJhbXMsIHJlc3QgfSwgc3RhcnRMb2NhdGlvbik7XG5cbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuTEJSQUNFKSkge1xuICAgICAgbGV0IHByZXZpb3VzWWllbGQgPSB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uO1xuICAgICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IGZhbHNlO1xuICAgICAgbGV0IGJvdW5kUGFyYW1zID0gW10uY29uY2F0LmFwcGx5KFtdLCBwYXJhbXMubWFwKFBhcnNlci5ib3VuZE5hbWVzKSk7XG4gICAgICBsZXQgW2JvZHldID0gdGhpcy5wYXJzZUZ1bmN0aW9uQm9keShib3VuZFBhcmFtcyk7XG4gICAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gcHJldmlvdXNZaWVsZDtcbiAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiQXJyb3dFeHByZXNzaW9uXCIsIHBhcmFtczogcGFyYW1zTm9kZSwgYm9keSB9LCBzdGFydExvY2F0aW9uKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IGJvZHkgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiQXJyb3dFeHByZXNzaW9uXCIsIHBhcmFtczogcGFyYW1zTm9kZSwgYm9keSB9LCBzdGFydExvY2F0aW9uKTtcbiAgICB9XG4gIH1cblxuICBwYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCkge1xuICAgIHJldHVybiBQYXJzZXIuZ2V0RXhwcih0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb25PckJpbmRpbmdFbGVtZW50KCkpO1xuICB9XG5cbiAgcGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbk9yQmluZGluZ0VsZW1lbnQoKSB7XG4gICAgbGV0IHRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICBpZiAodGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiAmJiAhdGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlciAmJiB0aGlzLmxvb2thaGVhZC50eXBlID09PSBUb2tlblR5cGUuWUlFTEQpIHtcbiAgICAgIHJldHVybiB7IGV4cHI6IHRoaXMucGFyc2VZaWVsZEV4cHJlc3Npb24oKSwgcGF0dGVybjogbnVsbCwgaXNCaW5kaW5nRWxlbWVudDogZmFsc2UgfTtcbiAgICB9XG5cbiAgICBsZXQgeyBleHByLCBwYXR0ZXJuLCBpc0JpbmRpbmdFbGVtZW50LCBleHByRXJyb3IgfSA9IHRoaXMucGFyc2VDb25kaXRpb25hbEV4cHJlc3Npb24oKTtcblxuICAgIGlmICghdGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQgJiYgdGhpcy5tYXRjaChUb2tlblR5cGUuQVJST1cpKSB7XG4gICAgICByZXR1cm4geyBleHByOiB0aGlzLnBhcnNlQXJyb3dFeHByZXNzaW9uVGFpbChwYXR0ZXJuLCBzdGFydExvY2F0aW9uKSwgcGF0dGVybjogbnVsbCwgaXNCaW5kaW5nRWxlbWVudDogZmFsc2UgfTtcbiAgICB9XG5cbiAgICBsZXQgaXNBc3NpZ25tZW50T3BlcmF0b3IgPSBmYWxzZTtcbiAgICBsZXQgb3BlcmF0b3IgPSB0aGlzLmxvb2thaGVhZDtcbiAgICBzd2l0Y2ggKG9wZXJhdG9yLnR5cGUpIHtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9CSVRfT1I6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fQklUX1hPUjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9CSVRfQU5EOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX1NITDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9TSFI6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fU0hSX1VOU0lHTkVEOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX0FERDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9TVUI6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fTVVMOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX0RJVjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9NT0Q6XG4gICAgICAgIGlzQXNzaWdubWVudE9wZXJhdG9yID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGlmIChpc0Fzc2lnbm1lbnRPcGVyYXRvcikge1xuICAgICAgaWYgKCFwYXR0ZXJuIHx8ICFQYXJzZXIuaXNWYWxpZFNpbXBsZUFzc2lnbm1lbnRUYXJnZXQocGF0dGVybikpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLklOVkFMSURfTEhTX0lOX0FTU0lHTk1FTlQpO1xuICAgICAgfVxuICAgICAgaWYgKHBhdHRlcm4udHlwZSA9PT0gXCJCaW5kaW5nSWRlbnRpZmllclwiKSB7XG4gICAgICAgIGlmICh0aGlzLnN0cmljdCAmJiBpc1Jlc3RyaWN0ZWRXb3JkKHBhdHRlcm4ubmFtZSkpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLlNUUklDVF9MSFNfQVNTSUdOTUVOVCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG9wZXJhdG9yLnR5cGUgPT09IFRva2VuVHlwZS5BU1NJR04pIHtcbiAgICAgIGlmICghcGF0dGVybikge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuSU5WQUxJRF9MSFNfSU5fQVNTSUdOTUVOVCk7XG4gICAgICB9XG4gICAgICBsZXQgYm91bmQgPSBQYXJzZXIuYm91bmROYW1lcyhwYXR0ZXJuKTtcbiAgICAgICAgaWYgKHRoaXMuc3RyaWN0ICYmIGJvdW5kLnNvbWUoaXNSZXN0cmljdGVkV29yZCkpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLlNUUklDVF9MSFNfQVNTSUdOTUVOVCk7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHsgZXhwciwgcGF0dGVybiwgaXNCaW5kaW5nRWxlbWVudCwgZXhwckVycm9yIH07XG4gICAgfVxuXG4gICAgdGhpcy5sZXgoKTtcbiAgICBsZXQgcHJldmlvdXNJbkdlbmVyYXRvclBhcmFtZXRlciA9IHRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXI7XG4gICAgdGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlciA9IGZhbHNlO1xuICAgIGxldCByaHMgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcblxuICAgIHRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXIgPSBwcmV2aW91c0luR2VuZXJhdG9yUGFyYW1ldGVyO1xuICAgIHJldHVybiB7XG4gICAgICBleHByOiBwYXR0ZXJuICYmIHRoaXMubWFya0xvY2F0aW9uKHtcbiAgICAgICAgdHlwZTogXCJBc3NpZ25tZW50RXhwcmVzc2lvblwiLFxuICAgICAgICBiaW5kaW5nOiBwYXR0ZXJuLFxuICAgICAgICBvcGVyYXRvcjogb3BlcmF0b3IudHlwZS5uYW1lLFxuICAgICAgICBleHByZXNzaW9uOiByaHNcbiAgICAgIH0sIHN0YXJ0TG9jYXRpb24pLFxuICAgICAgcGF0dGVybjogcGF0dGVybiAmJiB0aGlzLm1hcmtMb2NhdGlvbih7XG4gICAgICAgIHR5cGU6IFwiQmluZGluZ1dpdGhEZWZhdWx0XCIsXG4gICAgICAgIGJpbmRpbmc6IHBhdHRlcm4sXG4gICAgICAgIGluaXQ6IHJoc1xuICAgICAgfSwgc3RhcnRMb2NhdGlvbiksXG4gICAgICBpc0JpbmRpbmdFbGVtZW50LFxuICAgICAgZXhwckVycm9yXG4gICAgfTtcbiAgfVxuXG4gIGxvb2thaGVhZEFzc2lnbm1lbnRFeHByZXNzaW9uKCkge1xuICAgIHN3aXRjaCAodGhpcy5sb29rYWhlYWQudHlwZSkge1xuICAgICAgY2FzZSBUb2tlblR5cGUuQUREOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX0RJVjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkNMQVNTOlxuICAgICAgY2FzZSBUb2tlblR5cGUuREVDOlxuICAgICAgY2FzZSBUb2tlblR5cGUuRElWOlxuICAgICAgY2FzZSBUb2tlblR5cGUuRkFMU0U6XG4gICAgICBjYXNlIFRva2VuVHlwZS5GVU5DVElPTjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLklERU5USUZJRVI6XG4gICAgICBjYXNlIFRva2VuVHlwZS5MQlJBQ0U6XG4gICAgICBjYXNlIFRva2VuVHlwZS5MQlJBQ0s6XG4gICAgICBjYXNlIFRva2VuVHlwZS5MUEFSRU46XG4gICAgICBjYXNlIFRva2VuVHlwZS5ORVc6XG4gICAgICBjYXNlIFRva2VuVHlwZS5OT1Q6XG4gICAgICBjYXNlIFRva2VuVHlwZS5OVUxMOlxuICAgICAgY2FzZSBUb2tlblR5cGUuTlVNQkVSOlxuICAgICAgY2FzZSBUb2tlblR5cGUuU1RSSU5HOlxuICAgICAgY2FzZSBUb2tlblR5cGUuU1VCOlxuICAgICAgY2FzZSBUb2tlblR5cGUuVEhJUzpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlRSVUU6XG4gICAgICBjYXNlIFRva2VuVHlwZS5ZSUVMRDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlRFTVBMQVRFOlxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcGFyc2VZaWVsZEV4cHJlc3Npb24oKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICB0aGlzLmxleCgpO1xuICAgIGlmICh0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCkge1xuICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJZaWVsZEV4cHJlc3Npb25cIiwgZXhwcmVzc2lvbjogbnVsbCB9LCBzdGFydExvY2F0aW9uKTtcbiAgICB9XG4gICAgbGV0IGlzR2VuZXJhdG9yID0gISF0aGlzLmVhdChUb2tlblR5cGUuTVVMKTtcbiAgICBsZXQgcHJldmlvdXNZaWVsZCA9IHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb247XG4gICAgbGV0IGV4cHIgPSBudWxsO1xuICAgIGlmIChpc0dlbmVyYXRvciB8fCB0aGlzLmxvb2thaGVhZEFzc2lnbm1lbnRFeHByZXNzaW9uKCkpIHtcbiAgICAgIGV4cHIgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICB9XG4gICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IHByZXZpb3VzWWllbGQ7XG4gICAgbGV0IHR5cGUgPSBpc0dlbmVyYXRvciA/IFwiWWllbGRHZW5lcmF0b3JFeHByZXNzaW9uXCIgOiBcIllpZWxkRXhwcmVzc2lvblwiO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih7dHlwZSwgZXhwcmVzc2lvbjogZXhwcn0sIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VDb25kaXRpb25hbEV4cHJlc3Npb24oKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IHRlc3QgPSB0aGlzLnBhcnNlQmluYXJ5RXhwcmVzc2lvbigpO1xuICAgIGlmICghdGVzdC5leHByKSByZXR1cm4gdGVzdDtcbiAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLkNPTkRJVElPTkFMKSkge1xuICAgICAgbGV0IHByZXZpb3VzQWxsb3dJbiA9IHRoaXMuYWxsb3dJbjtcbiAgICAgIHRoaXMuYWxsb3dJbiA9IHRydWU7XG4gICAgICBsZXQgY29uc2VxdWVudCA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgdGhpcy5hbGxvd0luID0gcHJldmlvdXNBbGxvd0luO1xuICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNPTE9OKTtcbiAgICAgIGxldCBhbHRlcm5hdGUgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGV4cHI6IHRoaXMubWFya0xvY2F0aW9uKHtcbiAgICAgICAgICB0eXBlOiBcIkNvbmRpdGlvbmFsRXhwcmVzc2lvblwiLFxuICAgICAgICAgIHRlc3Q6IHRlc3QuZXhwcixcbiAgICAgICAgICBjb25zZXF1ZW50LFxuICAgICAgICAgIGFsdGVybmF0ZVxuICAgICAgICB9LCBzdGFydExvY2F0aW9uKSxcbiAgICAgICAgcGF0dGVybjogbnVsbCxcbiAgICAgICAgaXNCaW5kaW5nRWxlbWVudDogZmFsc2UsXG4gICAgICAgIGV4cHJFcnJvcjogbnVsbFxuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGVzdDtcbiAgfVxuXG4gIGlzQmluYXJ5T3BlcmF0b3IodHlwZSkge1xuICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgY2FzZSBUb2tlblR5cGUuT1I6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BTkQ6XG4gICAgICBjYXNlIFRva2VuVHlwZS5CSVRfT1I6XG4gICAgICBjYXNlIFRva2VuVHlwZS5CSVRfWE9SOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQklUX0FORDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkVROlxuICAgICAgY2FzZSBUb2tlblR5cGUuTkU6XG4gICAgICBjYXNlIFRva2VuVHlwZS5FUV9TVFJJQ1Q6XG4gICAgICBjYXNlIFRva2VuVHlwZS5ORV9TVFJJQ1Q6XG4gICAgICBjYXNlIFRva2VuVHlwZS5MVDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkdUOlxuICAgICAgY2FzZSBUb2tlblR5cGUuTFRFOlxuICAgICAgY2FzZSBUb2tlblR5cGUuR1RFOlxuICAgICAgY2FzZSBUb2tlblR5cGUuSU5TVEFOQ0VPRjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlNITDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlNIUjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlNIUl9VTlNJR05FRDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFERDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlNVQjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk1VTDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkRJVjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk1PRDpcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICBjYXNlIFRva2VuVHlwZS5JTjpcbiAgICAgICAgcmV0dXJuIHRoaXMuYWxsb3dJbjtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBwYXJzZUJpbmFyeUV4cHJlc3Npb24oKSB7XG4gICAgbGV0IGxvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCB1bmFyeSA9IHRoaXMucGFyc2VVbmFyeUV4cHJlc3Npb24oKTtcbiAgICBpZiAoIXVuYXJ5LmV4cHIpIHtcbiAgICAgIHJldHVybiB1bmFyeTtcbiAgICB9XG5cbiAgICBsZXQgb3BlcmF0b3IgPSB0aGlzLmxvb2thaGVhZC50eXBlO1xuXG4gICAgbGV0IGlzQmluYXJ5T3BlcmF0b3IgPSB0aGlzLmlzQmluYXJ5T3BlcmF0b3Iob3BlcmF0b3IpO1xuICAgIGlmICghaXNCaW5hcnlPcGVyYXRvcikge1xuICAgICAgcmV0dXJuIHVuYXJ5O1xuICAgIH1cblxuICAgIGxldCBsZWZ0ID0gdW5hcnkuZXhwcjtcblxuICAgIHRoaXMubGV4KCk7XG4gICAgbGV0IHN0YWNrID0gW107XG4gICAgc3RhY2sucHVzaCh7bG9jYXRpb24sIGxlZnQsIG9wZXJhdG9yLCBwcmVjZWRlbmNlOiBCaW5hcnlQcmVjZWRlbmNlW29wZXJhdG9yLm5hbWVdfSk7XG4gICAgbG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IHJpZ2h0ID0gUGFyc2VyLmdldEV4cHIodGhpcy5wYXJzZVVuYXJ5RXhwcmVzc2lvbigpKTtcbiAgICBvcGVyYXRvciA9IHRoaXMubG9va2FoZWFkLnR5cGU7XG4gICAgaXNCaW5hcnlPcGVyYXRvciA9IHRoaXMuaXNCaW5hcnlPcGVyYXRvcih0aGlzLmxvb2thaGVhZC50eXBlKTtcbiAgICB3aGlsZSAoaXNCaW5hcnlPcGVyYXRvcikge1xuICAgICAgbGV0IHByZWNlZGVuY2UgPSBCaW5hcnlQcmVjZWRlbmNlW29wZXJhdG9yLm5hbWVdO1xuICAgICAgLy8gUmVkdWNlOiBtYWtlIGEgYmluYXJ5IGV4cHJlc3Npb24gZnJvbSB0aGUgdGhyZWUgdG9wbW9zdCBlbnRyaWVzLlxuICAgICAgd2hpbGUgKHN0YWNrLmxlbmd0aCAmJiBwcmVjZWRlbmNlIDw9IHN0YWNrW3N0YWNrLmxlbmd0aCAtIDFdLnByZWNlZGVuY2UpIHtcbiAgICAgICAgbGV0IHN0YWNrSXRlbSA9IHN0YWNrW3N0YWNrLmxlbmd0aCAtIDFdO1xuICAgICAgICBsZXQgc3RhY2tPcGVyYXRvciA9IHN0YWNrSXRlbS5vcGVyYXRvcjtcbiAgICAgICAgbGVmdCA9IHN0YWNrSXRlbS5sZWZ0O1xuICAgICAgICBzdGFjay5wb3AoKTtcbiAgICAgICAgbG9jYXRpb24gPSBzdGFja0l0ZW0ubG9jYXRpb247XG4gICAgICAgIHJpZ2h0ID0gdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIkJpbmFyeUV4cHJlc3Npb25cIiwgbGVmdCwgb3BlcmF0b3I6IHN0YWNrT3BlcmF0b3IubmFtZSwgcmlnaHQgfSwgbG9jYXRpb24pO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmxleCgpO1xuICAgICAgc3RhY2sucHVzaCh7bG9jYXRpb24sIGxlZnQ6IHJpZ2h0LCBvcGVyYXRvciwgcHJlY2VkZW5jZX0pO1xuICAgICAgbG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICAgIHJpZ2h0ID0gUGFyc2VyLmdldEV4cHIodGhpcy5wYXJzZVVuYXJ5RXhwcmVzc2lvbigpKTtcblxuICAgICAgb3BlcmF0b3IgPSB0aGlzLmxvb2thaGVhZC50eXBlO1xuICAgICAgaXNCaW5hcnlPcGVyYXRvciA9IHRoaXMuaXNCaW5hcnlPcGVyYXRvcihvcGVyYXRvcik7XG4gICAgfVxuXG4gICAgLy8gRmluYWwgcmVkdWNlIHRvIGNsZWFuLXVwIHRoZSBzdGFjay5cbiAgICByZXR1cm4ge1xuICAgICAgZXhwcjogc3RhY2sucmVkdWNlUmlnaHQoKGV4cHIsIHN0YWNrSXRlbSkgPT5cbiAgICAgICAgICB0aGlzLm1hcmtMb2NhdGlvbih7XG4gICAgICAgICAgICB0eXBlOiBcIkJpbmFyeUV4cHJlc3Npb25cIixcbiAgICAgICAgICAgIGxlZnQ6IHN0YWNrSXRlbS5sZWZ0LFxuICAgICAgICAgICAgb3BlcmF0b3I6IHN0YWNrSXRlbS5vcGVyYXRvci5uYW1lLFxuICAgICAgICAgICAgcmlnaHQ6IGV4cHJcbiAgICAgICAgICB9LCBzdGFja0l0ZW0ubG9jYXRpb24pLFxuICAgICAgICByaWdodCksXG4gICAgICBwYXR0ZXJuOiBudWxsLFxuICAgICAgaXNCaW5kaW5nRWxlbWVudDogZmFsc2UsXG4gICAgICBleHByRXJyb3I6IG51bGxcbiAgICB9O1xuICB9XG5cbiAgc3RhdGljIGlzUHJlZml4T3BlcmF0b3IodHlwZSkge1xuICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgY2FzZSBUb2tlblR5cGUuSU5DOlxuICAgICAgY2FzZSBUb2tlblR5cGUuREVDOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQUREOlxuICAgICAgY2FzZSBUb2tlblR5cGUuU1VCOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQklUX05PVDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk5PVDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkRFTEVURTpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlZPSUQ6XG4gICAgICBjYXNlIFRva2VuVHlwZS5UWVBFT0Y6XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwYXJzZVVuYXJ5RXhwcmVzc2lvbigpIHtcbiAgICBpZiAodGhpcy5sb29rYWhlYWQudHlwZS5rbGFzcyAhPT0gVG9rZW5DbGFzcy5QdW5jdHVhdG9yICYmIHRoaXMubG9va2FoZWFkLnR5cGUua2xhc3MgIT09IFRva2VuQ2xhc3MuS2V5d29yZCkge1xuICAgICAgcmV0dXJuIHRoaXMucGFyc2VQb3N0Zml4RXhwcmVzc2lvbigpO1xuICAgIH1cbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgb3BlcmF0b3IgPSB0aGlzLmxvb2thaGVhZDtcbiAgICBpZiAoIVBhcnNlci5pc1ByZWZpeE9wZXJhdG9yKG9wZXJhdG9yLnR5cGUpKSB7XG4gICAgICByZXR1cm4gdGhpcy5wYXJzZVBvc3RmaXhFeHByZXNzaW9uKCk7XG4gICAgfVxuXG4gICAgdGhpcy5sZXgoKTtcbiAgICBsZXQgZXhwciA9IFBhcnNlci5nZXRFeHByKHRoaXMucGFyc2VVbmFyeUV4cHJlc3Npb24oKSk7XG4gICAgc3dpdGNoIChvcGVyYXRvci50eXBlKSB7XG4gICAgICBjYXNlIFRva2VuVHlwZS5JTkM6XG4gICAgICBjYXNlIFRva2VuVHlwZS5ERUM6XG4gICAgICAgIC8vIDExLjQuNCwgMTEuNC41O1xuICAgICAgICBpZiAoZXhwci50eXBlID09PSBcIklkZW50aWZpZXJFeHByZXNzaW9uXCIpIHtcbiAgICAgICAgICBpZiAodGhpcy5zdHJpY3QgJiYgaXNSZXN0cmljdGVkV29yZChleHByLm5hbWUpKSB7XG4gICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX0xIU19QUkVGSVgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghUGFyc2VyLmlzVmFsaWRTaW1wbGVBc3NpZ25tZW50VGFyZ2V0KGV4cHIpKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLklOVkFMSURfTEhTX0lOX0FTU0lHTk1FTlQpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBUb2tlblR5cGUuREVMRVRFOlxuICAgICAgICBpZiAoZXhwci50eXBlID09PSBcIklkZW50aWZpZXJFeHByZXNzaW9uXCIgJiYgdGhpcy5zdHJpY3QpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX0RFTEVURSk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgZXhwcjogdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIlByZWZpeEV4cHJlc3Npb25cIiwgb3BlcmF0b3I6IG9wZXJhdG9yLnZhbHVlLCBvcGVyYW5kOiBleHByIH0sIHN0YXJ0TG9jYXRpb24pLFxuICAgICAgcGF0dGVybjogbnVsbCxcbiAgICAgIGlzQmluZGluZ0VsZW1lbnQ6IGZhbHNlLFxuICAgICAgZXhwckVycm9yOiBudWxsLFxuICAgIH07XG4gIH1cblxuICBwYXJzZVBvc3RmaXhFeHByZXNzaW9uKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuXG4gICAgbGV0IGxocyA9IHRoaXMucGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uKHsgYWxsb3dDYWxsOiB0cnVlIH0pO1xuICAgIGlmICghbGhzLmV4cHIpIHJldHVybiBsaHM7XG5cbiAgICBpZiAodGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQpIHtcbiAgICAgIHJldHVybiBsaHM7XG4gICAgfVxuXG4gICAgbGV0IG9wZXJhdG9yID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgaWYgKG9wZXJhdG9yLnR5cGUgIT09IFRva2VuVHlwZS5JTkMgJiYgb3BlcmF0b3IudHlwZSAhPT0gVG9rZW5UeXBlLkRFQykge1xuICAgICAgcmV0dXJuIGxocztcbiAgICB9XG5cbiAgICBsZXQgb3BlcmFuZCA9IFBhcnNlci5nZXRFeHByKGxocyk7XG5cbiAgICBpZiAoIVBhcnNlci5pc1ZhbGlkU2ltcGxlQXNzaWdubWVudFRhcmdldChvcGVyYW5kKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLklOVkFMSURfTEhTX0lOX0FTU0lHTk1FTlQpO1xuICAgIH1cblxuICAgIHRoaXMubGV4KCk7XG5cbiAgICAvLyAxMS4zLjEsIDExLjMuMjtcbiAgICBpZiAob3BlcmFuZC50eXBlID09PSBcIklkZW50aWZpZXJFeHByZXNzaW9uXCIpIHtcbiAgICAgIGlmICh0aGlzLnN0cmljdCAmJiBpc1Jlc3RyaWN0ZWRXb3JkKG9wZXJhbmQubmFtZSkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlNUUklDVF9MSFNfUE9TVEZJWCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGV4cHI6IHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJQb3N0Zml4RXhwcmVzc2lvblwiLCBvcGVyYW5kLCBvcGVyYXRvcjogb3BlcmF0b3IudmFsdWUgfSwgc3RhcnRMb2NhdGlvbiksXG4gICAgICBwYXR0ZXJuOiBudWxsLFxuICAgICAgaXNCaW5kaW5nRWxlbWVudDogZmFsc2UsXG4gICAgICBleHByRXJyb3I6IG51bGxcbiAgICB9O1xuICB9XG5cbiAgcGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uKHthbGxvd0NhbGx9KSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IHByZXZpb3VzQWxsb3dJbiA9IHRoaXMuYWxsb3dJbjtcbiAgICB0aGlzLmFsbG93SW4gPSBhbGxvd0NhbGw7XG5cbiAgICBsZXQgZXhwciwgcGF0dGVybiwgaXNCaW5kaW5nRWxlbWVudCwgZXhwckVycm9yLCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuXG4gICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5TVVBFUikpIHtcbiAgICAgIGlzQmluZGluZ0VsZW1lbnQgPSBmYWxzZTtcbiAgICAgIGV4cHIgPSB0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiU3VwZXJcIiB9LCBzdGFydExvY2F0aW9uKTtcbiAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5MUEFSRU4pKSB7XG4gICAgICAgIGlmIChhbGxvd0NhbGwpIHtcbiAgICAgICAgICBpZiAodGhpcy5pbkNvbnN0cnVjdG9yICYmICF0aGlzLmluUGFyYW1ldGVyKSB7XG4gICAgICAgICAgICBleHByID0gdGhpcy5tYXJrTG9jYXRpb24oe1xuICAgICAgICAgICAgICB0eXBlOiBcIkNhbGxFeHByZXNzaW9uXCIsXG4gICAgICAgICAgICAgIGNhbGxlZTogZXhwcixcbiAgICAgICAgICAgICAgYXJndW1lbnRzOiB0aGlzLnBhcnNlQXJndW1lbnRMaXN0KClcbiAgICAgICAgICAgIH0sIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHN0YXJ0TG9jYXRpb24sIEVycm9yTWVzc2FnZXMuVU5FWFBFQ1RFRF9TVVBFUl9DQUxMKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRva2VuKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5MQlJBQ0spKSB7XG4gICAgICAgIGlmICh0aGlzLmluTWV0aG9kICYmICF0aGlzLmluUGFyYW1ldGVyKSB7XG4gICAgICAgICAgZXhwciA9IHRoaXMubWFya0xvY2F0aW9uKHtcbiAgICAgICAgICAgIHR5cGU6IFwiQ29tcHV0ZWRNZW1iZXJFeHByZXNzaW9uXCIsXG4gICAgICAgICAgICBvYmplY3Q6IGV4cHIsXG4gICAgICAgICAgICBleHByZXNzaW9uOiB0aGlzLnBhcnNlQ29tcHV0ZWRNZW1iZXIoKVxuICAgICAgICAgIH0sIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgICAgIHBhdHRlcm4gPSBleHByO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24oc3RhcnRMb2NhdGlvbiwgRXJyb3JNZXNzYWdlcy5VTkVYUEVDVEVEX1NVUEVSX1BST1BFUlRZKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5QRVJJT0QpKSB7XG4gICAgICAgIGlmICh0aGlzLmluTWV0aG9kICYmICF0aGlzLmluUGFyYW1ldGVyKSB7XG4gICAgICAgICAgZXhwciA9IHRoaXMubWFya0xvY2F0aW9uKHtcbiAgICAgICAgICAgIHR5cGU6IFwiU3RhdGljTWVtYmVyRXhwcmVzc2lvblwiLFxuICAgICAgICAgICAgb2JqZWN0OiBleHByLFxuICAgICAgICAgICAgcHJvcGVydHk6IHRoaXMucGFyc2VOb25Db21wdXRlZE1lbWJlcigpXG4gICAgICAgICAgfSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICAgICAgcGF0dGVybiA9IGV4cHI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbihzdGFydExvY2F0aW9uLCBFcnJvck1lc3NhZ2VzLlVORVhQRUNURURfU1VQRVJfUFJPUEVSVFkpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodG9rZW4pO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuTkVXKSkge1xuICAgICAgZXhwciA9IHRoaXMucGFyc2VOZXdFeHByZXNzaW9uKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBwZSA9IHRoaXMucGFyc2VQcmltYXJ5RXhwcmVzc2lvbigpO1xuICAgICAgaWYgKCFwZS5leHByKSB7XG4gICAgICAgIHJldHVybiBwZTtcbiAgICAgIH1cbiAgICAgICh7IGV4cHIsIHBhdHRlcm4sIGlzQmluZGluZ0VsZW1lbnQsIGV4cHJFcnJvciB9ID0gcGUpO1xuICAgIH1cblxuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBpZiAoYWxsb3dDYWxsICYmIHRoaXMubWF0Y2goVG9rZW5UeXBlLkxQQVJFTikpIHtcbiAgICAgICAgaXNCaW5kaW5nRWxlbWVudCA9IGZhbHNlO1xuICAgICAgICBleHByID0gdGhpcy5tYXJrTG9jYXRpb24oe1xuICAgICAgICAgIHR5cGU6IFwiQ2FsbEV4cHJlc3Npb25cIixcbiAgICAgICAgICBjYWxsZWU6IGV4cHIsXG4gICAgICAgICAgYXJndW1lbnRzOiB0aGlzLnBhcnNlQXJndW1lbnRMaXN0KClcbiAgICAgICAgfSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICAgIHBhdHRlcm4gPSBudWxsO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5MQlJBQ0spKSB7XG4gICAgICAgIGlzQmluZGluZ0VsZW1lbnQgPSBmYWxzZTtcbiAgICAgICAgZXhwciA9IHRoaXMubWFya0xvY2F0aW9uKHtcbiAgICAgICAgICB0eXBlOiBcIkNvbXB1dGVkTWVtYmVyRXhwcmVzc2lvblwiLFxuICAgICAgICAgIG9iamVjdDogZXhwcixcbiAgICAgICAgICBleHByZXNzaW9uOiB0aGlzLnBhcnNlQ29tcHV0ZWRNZW1iZXIoKVxuICAgICAgICB9LCBzdGFydExvY2F0aW9uKTtcbiAgICAgICAgcGF0dGVybiA9IGV4cHI7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLlBFUklPRCkpIHtcbiAgICAgICAgaXNCaW5kaW5nRWxlbWVudCA9IGZhbHNlO1xuICAgICAgICBleHByID0gdGhpcy5tYXJrTG9jYXRpb24oe1xuICAgICAgICAgIHR5cGU6IFwiU3RhdGljTWVtYmVyRXhwcmVzc2lvblwiLFxuICAgICAgICAgIG9iamVjdDogZXhwcixcbiAgICAgICAgICBwcm9wZXJ0eTogdGhpcy5wYXJzZU5vbkNvbXB1dGVkTWVtYmVyKClcbiAgICAgICAgfSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICAgIHBhdHRlcm4gPSBleHByO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5URU1QTEFURSkpIHtcbiAgICAgICAgaXNCaW5kaW5nRWxlbWVudCA9IGZhbHNlO1xuICAgICAgICBleHByID0gdGhpcy5tYXJrTG9jYXRpb24oe1xuICAgICAgICAgIHR5cGU6IFwiVGVtcGxhdGVFeHByZXNzaW9uXCIsXG4gICAgICAgICAgdGFnOiBleHByLFxuICAgICAgICAgIGVsZW1lbnRzOiB0aGlzLnBhcnNlVGVtcGxhdGVFbGVtZW50cygpXG4gICAgICAgIH0sIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgICBwYXR0ZXJuID0gbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuYWxsb3dJbiA9IHByZXZpb3VzQWxsb3dJbjtcblxuICAgIHJldHVybiB7IGV4cHIsIHBhdHRlcm4sIGlzQmluZGluZ0VsZW1lbnQsIGV4cHJFcnJvciB9O1xuICB9XG5cbiAgcGFyc2VUZW1wbGF0ZUVsZW1lbnRzKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgIGlmICh0b2tlbi50YWlsKSB7XG4gICAgICB0aGlzLmxleCgpO1xuICAgICAgcmV0dXJuIFt0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiVGVtcGxhdGVFbGVtZW50XCIsIHJhd1ZhbHVlOiB0b2tlbi52YWx1ZS5zbGljZSgxLCAtMSkgfSwgc3RhcnRMb2NhdGlvbildO1xuICAgIH1cbiAgICBsZXQgcmVzdWx0ID0gW1xuICAgICAgdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIlRlbXBsYXRlRWxlbWVudFwiLCByYXdWYWx1ZTogdGhpcy5sZXgoKS52YWx1ZS5zbGljZSgxLCAtMikgfSwgc3RhcnRMb2NhdGlvbilcbiAgICBdO1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICByZXN1bHQucHVzaCh0aGlzLnBhcnNlRXhwcmVzc2lvbigpKTtcbiAgICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuUkJSQUNFKSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuaW5kZXggPSB0aGlzLnN0YXJ0SW5kZXg7XG4gICAgICB0aGlzLmxpbmUgPSB0aGlzLnN0YXJ0TGluZTtcbiAgICAgIHRoaXMubGluZVN0YXJ0ID0gdGhpcy5zdGFydExpbmVTdGFydDtcbiAgICAgIHRoaXMubG9va2FoZWFkID0gdGhpcy5zY2FuVGVtcGxhdGVFbGVtZW50KCk7XG4gICAgICBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgICAgdG9rZW4gPSB0aGlzLmxleCgpO1xuICAgICAgaWYgKHRva2VuLnRhaWwpIHtcbiAgICAgICAgcmVzdWx0LnB1c2godGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIlRlbXBsYXRlRWxlbWVudFwiLCByYXdWYWx1ZTogdG9rZW4udmFsdWUuc2xpY2UoMSwgLTEpIH0sIHN0YXJ0TG9jYXRpb24pKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJUZW1wbGF0ZUVsZW1lbnRcIiwgcmF3VmFsdWU6IHRva2VuLnZhbHVlLnNsaWNlKDEsIC0yKSB9LCBzdGFydExvY2F0aW9uKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcGFyc2VOb25Db21wdXRlZE1lbWJlcigpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUEVSSU9EKTtcbiAgICBpZiAoIXRoaXMubG9va2FoZWFkLnR5cGUua2xhc3MuaXNJZGVudGlmaWVyTmFtZSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMubGV4KCkudmFsdWU7XG4gICAgfVxuICB9XG5cbiAgcGFyc2VDb21wdXRlZE1lbWJlcigpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTEJSQUNLKTtcbiAgICBsZXQgZXhwciA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJCUkFDSyk7XG4gICAgcmV0dXJuIGV4cHI7XG4gIH1cblxuICBwYXJzZU5ld0V4cHJlc3Npb24oKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLk5FVyk7XG4gICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5QRVJJT0QpKSB7XG4gICAgICBsZXQgaWRlbnQgPSB0aGlzLmV4cGVjdChUb2tlblR5cGUuSURFTlRJRklFUik7XG4gICAgICBpZiAoaWRlbnQudmFsdWUgIT09IFwidGFyZ2V0XCIpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKGlkZW50KTtcbiAgICAgIH0gZWxzZSBpZiAoIXRoaXMuaW5GdW5jdGlvbkJvZHkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbihzdGFydExvY2F0aW9uLCBFcnJvck1lc3NhZ2VzLlVORVhQRUNURURfTkVXX1RBUkdFVCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIk5ld1RhcmdldEV4cHJlc3Npb25cIiB9LCBzdGFydExvY2F0aW9uKTtcbiAgICB9XG4gICAgbGV0IGNhbGxlZSA9IFBhcnNlci5nZXRFeHByKHRoaXMucGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uKHsgYWxsb3dDYWxsOiBmYWxzZSB9KSk7XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHtcbiAgICAgIHR5cGU6IFwiTmV3RXhwcmVzc2lvblwiLFxuICAgICAgY2FsbGVlLFxuICAgICAgYXJndW1lbnRzOiB0aGlzLm1hdGNoKFRva2VuVHlwZS5MUEFSRU4pID8gdGhpcy5wYXJzZUFyZ3VtZW50TGlzdCgpIDogW11cbiAgICB9LCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlUHJpbWFyeUV4cHJlc3Npb24oKSB7XG4gICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkxQQVJFTikpIHtcbiAgICAgIHJldHVybiB0aGlzLnBhcnNlR3JvdXBFeHByZXNzaW9uKCk7XG4gICAgfVxuXG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICBmdW5jdGlvbiBwcmltYXJ5KGV4cHIpIHtcbiAgICAgIHJldHVybiB7IGV4cHIsIHBhdHRlcm46IG51bGwsIGlzQmluZGluZ0VsZW1lbnQ6IGZhbHNlLCBleHByRXJyb3I6IG51bGwgfVxuICAgIH1cbiAgICBzd2l0Y2ggKHRoaXMubG9va2FoZWFkLnR5cGUpIHtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLllJRUxEOlxuICAgICAgY2FzZSBUb2tlblR5cGUuSURFTlRJRklFUjpcbiAgICAgIHtcbiAgICAgICAgbGV0IGV4cHIgPSB0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiSWRlbnRpZmllckV4cHJlc3Npb25cIiwgbmFtZTogdGhpcy5wYXJzZUlkZW50aWZpZXIoKSB9LCBzdGFydExvY2F0aW9uKTtcbiAgICAgICAgbGV0IHBhdHRlcm4gPSB0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiQmluZGluZ0lkZW50aWZpZXJcIiwgbmFtZTogZXhwci5uYW1lIH0sIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgICByZXR1cm4geyBleHByLCBwYXR0ZXJuLCBpc0JpbmRpbmdFbGVtZW50OiB0cnVlLCBleHByRXJyb3I6IG51bGwgfTtcbiAgICAgIH1cbiAgICAgIGNhc2UgVG9rZW5UeXBlLlNUUklORzpcbiAgICAgICAgcmV0dXJuIHByaW1hcnkodGhpcy5wYXJzZVN0cmluZ0xpdGVyYWwoKSk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5OVU1CRVI6XG4gICAgICAgIHJldHVybiBwcmltYXJ5KHRoaXMucGFyc2VOdW1lcmljTGl0ZXJhbCgpKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlRISVM6XG4gICAgICAgIHRoaXMubGV4KCk7XG4gICAgICAgIHJldHVybiBwcmltYXJ5KHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJUaGlzRXhwcmVzc2lvblwiIH0sIHN0YXJ0TG9jYXRpb24pKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkZVTkNUSU9OOlxuICAgICAgICByZXR1cm4gcHJpbWFyeSh0aGlzLm1hcmtMb2NhdGlvbih0aGlzLnBhcnNlRnVuY3Rpb24oeyBpc0V4cHI6IHRydWUgfSksIHN0YXJ0TG9jYXRpb24pKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlRSVUU6XG4gICAgICAgIHRoaXMubGV4KCk7XG4gICAgICAgIHJldHVybiBwcmltYXJ5KHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJMaXRlcmFsQm9vbGVhbkV4cHJlc3Npb25cIiwgdmFsdWU6IHRydWUgfSwgc3RhcnRMb2NhdGlvbikpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuRkFMU0U6XG4gICAgICAgIHRoaXMubGV4KCk7XG4gICAgICAgIHJldHVybiBwcmltYXJ5KHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJMaXRlcmFsQm9vbGVhbkV4cHJlc3Npb25cIiwgdmFsdWU6IGZhbHNlIH0sIHN0YXJ0TG9jYXRpb24pKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk5VTEw6XG4gICAgICAgIHRoaXMubGV4KCk7XG4gICAgICAgIHJldHVybiBwcmltYXJ5KHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJMaXRlcmFsTnVsbEV4cHJlc3Npb25cIiB9LCBzdGFydExvY2F0aW9uKSk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5MQlJBQ0s6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlQXJyYXlFeHByZXNzaW9uKCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5MQlJBQ0U6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlT2JqZWN0RXhwcmVzc2lvbigpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuVEVNUExBVEU6XG4gICAgICAgIHJldHVybiBwcmltYXJ5KHRoaXMubWFya0xvY2F0aW9uKHtcbiAgICAgICAgICB0eXBlOiBcIlRlbXBsYXRlRXhwcmVzc2lvblwiLFxuICAgICAgICAgIHRhZzogbnVsbCxcbiAgICAgICAgICBlbGVtZW50czogdGhpcy5wYXJzZVRlbXBsYXRlRWxlbWVudHMoKVxuICAgICAgICB9LCBzdGFydExvY2F0aW9uKSk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5ESVY6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fRElWOlxuICAgICAgICB0aGlzLmxvb2thaGVhZCA9IHRoaXMuc2NhblJlZ0V4cCh0aGlzLmxvb2thaGVhZC50eXBlID09PSBUb2tlblR5cGUuRElWID8gXCIvXCIgOiBcIi89XCIpO1xuICAgICAgICBsZXQgdG9rZW4gPSB0aGlzLmxleCgpO1xuICAgICAgICBsZXQgbGFzdFNsYXNoID0gdG9rZW4udmFsdWUubGFzdEluZGV4T2YoXCIvXCIpO1xuICAgICAgICBsZXQgcGF0dGVybiA9IHRva2VuLnZhbHVlLnNsaWNlKDEsIGxhc3RTbGFzaCkucmVwbGFjZShcIlxcXFwvXCIsIFwiL1wiKTtcbiAgICAgICAgbGV0IGZsYWdzID0gdG9rZW4udmFsdWUuc2xpY2UobGFzdFNsYXNoICsgMSk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgUmVnRXhwKHBhdHRlcm4sIGZsYWdzKTtcbiAgICAgICAgfSBjYXRjaCAodW51c2VkKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5JTlZBTElEX1JFR1VMQVJfRVhQUkVTU0lPTik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHByaW1hcnkodGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIkxpdGVyYWxSZWdFeHBFeHByZXNzaW9uXCIsIHBhdHRlcm4sIGZsYWdzIH0sIHN0YXJ0TG9jYXRpb24pKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkNMQVNTOlxuICAgICAgICByZXR1cm4gcHJpbWFyeSh0aGlzLnBhcnNlQ2xhc3MoeyBpc0V4cHI6IHRydWUgfSkpO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubGV4KCkpO1xuICAgIH1cbiAgfVxuXG4gIHBhcnNlTnVtZXJpY0xpdGVyYWwoKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgaWYgKHRoaXMuc3RyaWN0ICYmIHRoaXMubG9va2FoZWFkLm9jdGFsKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRoaXMubG9va2FoZWFkLCBFcnJvck1lc3NhZ2VzLlNUUklDVF9PQ1RBTF9MSVRFUkFMKTtcbiAgICB9XG4gICAgbGV0IHRva2VuMiA9IHRoaXMubGV4KCk7XG4gICAgbGV0IG5vZGUgPSB0b2tlbjIuX3ZhbHVlID09PSAxIC8gMCA/IHtcbiAgICAgIHR5cGU6IFwiTGl0ZXJhbEluZmluaXR5RXhwcmVzc2lvblwiXG4gICAgfSA6IHtcbiAgICAgIHR5cGU6IFwiTGl0ZXJhbE51bWVyaWNFeHByZXNzaW9uXCIsXG4gICAgICB2YWx1ZTogdG9rZW4yLl92YWx1ZVxuICAgIH07XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5vZGUsIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VTdHJpbmdMaXRlcmFsKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGlmICh0aGlzLnN0cmljdCAmJiB0aGlzLmxvb2thaGVhZC5vY3RhbCkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0aGlzLmxvb2thaGVhZCwgRXJyb3JNZXNzYWdlcy5TVFJJQ1RfT0NUQUxfTElURVJBTCk7XG4gICAgfVxuICAgIGxldCB0b2tlbjIgPSB0aGlzLmxleCgpO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiTGl0ZXJhbFN0cmluZ0V4cHJlc3Npb25cIiwgdmFsdWU6IHRva2VuMi5fdmFsdWUgfSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZUlkZW50aWZpZXJOYW1lKCkge1xuICAgIGlmICh0aGlzLmxvb2thaGVhZC50eXBlLmtsYXNzLmlzSWRlbnRpZmllck5hbWUpIHtcbiAgICAgIHJldHVybiB0aGlzLmxleCgpLnZhbHVlO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuICAgIH1cbiAgfVxuXG4gIHBhcnNlQmluZGluZ0lkZW50aWZpZXIoKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJCaW5kaW5nSWRlbnRpZmllclwiLCBuYW1lOiB0aGlzLnBhcnNlSWRlbnRpZmllcigpIH0sIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VJZGVudGlmaWVyKCkge1xuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5ZSUVMRCkpIHtcbiAgICAgIGlmICh0aGlzLnN0cmljdCkge1xuICAgICAgICB0aGlzLmxvb2thaGVhZC50eXBlID0gVG9rZW5UeXBlLllJRUxEO1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuaW5HZW5lcmF0b3JCb2R5KSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5sZXgoKS52YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5JREVOVElGSUVSKS52YWx1ZTtcbiAgfVxuXG4gIHBhcnNlQXJndW1lbnRMaXN0KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MUEFSRU4pO1xuICAgIGxldCBhcmdzID0gdGhpcy5wYXJzZUFyZ3VtZW50cygpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgIHJldHVybiBhcmdzO1xuICB9XG5cbiAgcGFyc2VBcmd1bWVudHMoKSB7XG4gICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuUlBBUkVOKSB8fCB0aGlzLmVvZigpKSB7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9XG4gICAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICAgIGxldCBhcmc7XG4gICAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLkVMTElQU0lTKSkge1xuICAgICAgICBhcmcgPSB0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiU3ByZWFkRWxlbWVudFwiLCBleHByZXNzaW9uOiB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKSB9LCBzdGFydExvY2F0aW9uKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFyZyA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgfVxuICAgICAgcmVzdWx0LnB1c2goYXJnKTtcbiAgICAgIGlmICghdGhpcy5lYXQoVG9rZW5UeXBlLkNPTU1BKSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8vIDExLjIgTGVmdC1IYW5kLVNpZGUgRXhwcmVzc2lvbnM7XG5cbiAgZW5zdXJlQXJyb3coKSB7XG4gICAgaWYgKHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0KSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5FWFBFQ1RFRF9MSU5FX1RFUk1JTkFUT1IpO1xuICAgIH1cbiAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLkFSUk9XKSkge1xuICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkFSUk9XKTtcbiAgICB9XG4gIH1cblxuICBwYXJzZUdyb3VwRXhwcmVzc2lvbigpIHtcbiAgICAvLyBBdCB0aGlzIHBvaW50LCB3ZSBuZWVkIHRvIHBhcnNlIDMgdGhpbmdzOlxuICAgIC8vICAxLiBHcm91cCBleHByZXNzaW9uXG4gICAgLy8gIDIuIEFzc2lnbm1lbnQgdGFyZ2V0IG9mIGFzc2lnbm1lbnQgZXhwcmVzc2lvblxuICAgIC8vICAzLiBQYXJhbWV0ZXIgbGlzdCBvZiBhcnJvdyBmdW5jdGlvblxuICAgIGxldCByZXN0ID0gbnVsbDtcbiAgICBsZXQgc3RhcnQgPSB0aGlzLmV4cGVjdChUb2tlblR5cGUuTFBBUkVOKTtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLlJQQVJFTikpIHtcbiAgICAgIHRoaXMuZW5zdXJlQXJyb3coKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGV4cHI6IG51bGwsXG4gICAgICAgIHBhdHRlcm46IHtcbiAgICAgICAgICB0eXBlOiBBUlJPV19FWFBSRVNTSU9OX1BBUkFNUyxcbiAgICAgICAgICBwYXJhbXM6IFtdLFxuICAgICAgICAgIHJlc3Q6IG51bGxcbiAgICAgICAgfSxcbiAgICAgICAgaXNCaW5kaW5nRWxlbWVudDogZmFsc2UsXG4gICAgICAgIGV4cHJFcnJvcjogdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRva2VuKSxcbiAgICAgIH07XG4gICAgfSBlbHNlIGlmICh0aGlzLmVhdChUb2tlblR5cGUuRUxMSVBTSVMpKSB7XG4gICAgICByZXN0ID0gdGhpcy5wYXJzZUJpbmRpbmdJZGVudGlmaWVyKCk7XG4gICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcbiAgICAgIHRoaXMuZW5zdXJlQXJyb3coKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGV4cHI6IG51bGwsXG4gICAgICAgIHBhdHRlcm46IHtcbiAgICAgICAgICB0eXBlOiBBUlJPV19FWFBSRVNTSU9OX1BBUkFNUyxcbiAgICAgICAgICBwYXJhbXM6IFtdLFxuICAgICAgICAgIHJlc3Q6IHJlc3RcbiAgICAgICAgfSxcbiAgICAgICAgaXNCaW5kaW5nRWxlbWVudDogZmFsc2UsXG4gICAgICAgIGV4cHJFcnJvcjogdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRva2VuKSxcbiAgICAgIH07XG4gICAgfVxuXG5cbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQge1xuICAgICAgZXhwcjogZ3JvdXAsICAvLyBpZiBpdCBpcyBhIHBvc3NpYmxlIGV4cHJlc3Npb25cbiAgICAgIHBhdHRlcm46IGFzc2lnbm1lbnRUYXJnZXQsICAvLyBpZiBpdCBjYW4gYmUgYW4gYXNzaWdubWVudCBwYXR0ZXJuXG4gICAgICBpc0JpbmRpbmdFbGVtZW50OiBwb3NzaWJsZUJpbmRpbmdzLCAgLy8gaWYgaXQgY2FuIGJlIGFuIGJpbmRpbmcgZWxlbWVudCwgaXQgY2FuIGJlIHBhcnQgb2YgYXJyb3cgZXhwcmVzc2lvblxuICAgICAgZXhwckVycm9yOiBmaXJzdEV4cHJFcnJvcixcbiAgICAgIH0gPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb25PckJpbmRpbmdFbGVtZW50KCk7XG5cbiAgICBsZXQgcGFyYW1zID0gcG9zc2libGVCaW5kaW5ncyA/IFthc3NpZ25tZW50VGFyZ2V0XSA6IG51bGw7XG5cbiAgICB3aGlsZSAodGhpcy5lYXQoVG9rZW5UeXBlLkNPTU1BKSkge1xuICAgICAgYXNzaWdubWVudFRhcmdldCA9IG51bGw7XG4gICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuRUxMSVBTSVMpKSB7XG4gICAgICAgIGlmICghcG9zc2libGVCaW5kaW5ncykge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5sZXgoKTtcbiAgICAgICAgcmVzdCA9IHRoaXMucGFyc2VCaW5kaW5nSWRlbnRpZmllcigpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgaWYgKCFncm91cCkge1xuICAgICAgICAvLyBDYW4gYmUgb25seSBiaW5kaW5nIGVsZW1lbnRzLlxuICAgICAgICBsZXQgYmluZGluZyA9IHRoaXMucGFyc2VCaW5kaW5nRWxlbWVudCgpO1xuICAgICAgICBwYXJhbXMucHVzaChiaW5kaW5nKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBuZXh0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgICAgIC8vIENhbiBiZSBlaXRoZXIgYmluZGluZyBlbGVtZW50IG9yIGFzc2lnbm1lbnQgdGFyZ2V0LlxuICAgICAgICBsZXQgeyBleHByLCBwYXR0ZXJuLCBpc0JpbmRpbmdFbGVtZW50LCBleHByRXJyb3IgfSA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbk9yQmluZGluZ0VsZW1lbnQoKTtcbiAgICAgICAgaWYgKCFpc0JpbmRpbmdFbGVtZW50KSB7XG4gICAgICAgICAgcG9zc2libGVCaW5kaW5ncyA9IGZhbHNlO1xuICAgICAgICAgIHBhcmFtcyA9IG51bGw7XG4gICAgICAgIH0gZWxzZSBpZiAocGFyYW1zKSB7XG4gICAgICAgICAgcGFyYW1zLnB1c2gocGF0dGVybik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFleHByKSB7XG4gICAgICAgICAgZmlyc3RFeHByRXJyb3IgPSBmaXJzdEV4cHJFcnJvciB8fCBleHByRXJyb3I7XG4gICAgICAgICAgZ3JvdXAgPSBudWxsO1xuICAgICAgICAgIGlmICghcGFyYW1zKSB7XG4gICAgICAgICAgICB0aHJvdyBmaXJzdEV4cHJFcnJvcjtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZ3JvdXAgPSB0aGlzLm1hcmtMb2NhdGlvbih7XG4gICAgICAgICAgICB0eXBlOiBcIkJpbmFyeUV4cHJlc3Npb25cIixcbiAgICAgICAgICAgIGxlZnQ6IGdyb3VwLFxuICAgICAgICAgICAgb3BlcmF0b3I6IFwiLFwiLFxuICAgICAgICAgICAgcmlnaHQ6IGV4cHJcbiAgICAgICAgICB9LCBzdGFydExvY2F0aW9uKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuXG4gICAgaWYgKCF0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCAmJiB0aGlzLm1hdGNoKFRva2VuVHlwZS5BUlJPVykpIHtcbiAgICAgIGlmICghcG9zc2libGVCaW5kaW5ncykge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHN0YXJ0LCBFcnJvck1lc3NhZ2VzLklMTEVHQUxfQVJST1dfRlVOQ1RJT05fUEFSQU1TKTtcbiAgICAgIH1cbiAgICAgIC8vIGNoZWNrIGR1cCBwYXJhbXNcbiAgICAgIGxldCBhbGxCb3VuZE5hbWVzID0gW107XG5cbiAgICAgIHBhcmFtcy5mb3JFYWNoKGV4cHIgPT4ge1xuICAgICAgICBhbGxCb3VuZE5hbWVzID0gYWxsQm91bmROYW1lcy5jb25jYXQoUGFyc2VyLmJvdW5kTmFtZXMoZXhwcikpO1xuICAgICAgfSk7XG5cbiAgICAgIGlmIChyZXN0KSB7XG4gICAgICAgIGFsbEJvdW5kTmFtZXMucHVzaChyZXN0Lm5hbWUpO1xuICAgICAgfVxuXG4gICAgICBpZiAoZmlyc3REdXBsaWNhdGUoYWxsQm91bmROYW1lcykgIT0gbnVsbCkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX1BBUkFNX0RVUEUpO1xuICAgICAgfVxuXG4gICAgICBsZXQgc3RyaWN0UmVzdHJpY3RlZFdvcmQgPSBhbGxCb3VuZE5hbWVzLnNvbWUoaXNSZXN0cmljdGVkV29yZCk7XG4gICAgICBpZiAoc3RyaWN0UmVzdHJpY3RlZFdvcmQpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlNUUklDVF9QQVJBTV9OQU1FKTtcbiAgICAgIH1cblxuICAgICAgbGV0IHN0cmljdFJlc2VydmVkV29yZCA9IGhhc1N0cmljdE1vZGVSZXNlcnZlZFdvcmQoYWxsQm91bmROYW1lcyk7XG4gICAgICBpZiAoc3RyaWN0UmVzZXJ2ZWRXb3JkKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUkVTRVJWRURfV09SRCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGV4cHI6IG51bGwsXG4gICAgICAgIHBhdHRlcm46IHsgdHlwZTogQVJST1dfRVhQUkVTU0lPTl9QQVJBTVMsIHBhcmFtcywgcmVzdCB9LFxuICAgICAgICBpc0JpbmRpbmdFbGVtZW50OiBmYWxzZSxcbiAgICAgICAgZXhwckVycm9yOiB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpLFxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gRW5zdXJlIGFzc2lnbm1lbnQgcGF0dGVybjpcbiAgICAgIGlmIChyZXN0KSB7XG4gICAgICAgIHRoaXMuZW5zdXJlQXJyb3coKTtcbiAgICAgIH1cbiAgICAgIGlmICghZ3JvdXApIHtcbiAgICAgICAgdGhyb3cgZmlyc3RFeHByRXJyb3I7XG4gICAgICB9XG4gICAgICByZXR1cm4ge1xuICAgICAgICBleHByOiBncm91cCxcbiAgICAgICAgcGF0dGVybjogYXNzaWdubWVudFRhcmdldCxcbiAgICAgICAgaXNCaW5kaW5nRWxlbWVudDogZmFsc2UsXG4gICAgICAgIGV4cHJFcnJvcjogbnVsbFxuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICBwYXJzZUFycmF5RXhwcmVzc2lvbigpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MQlJBQ0spO1xuXG4gICAgbGV0IGV4cHJzID0gW10sIHBhdHRlcm5zID0gW10sIHJlc3RFbGVtZW50ID0gbnVsbCwgYWxsQmluZGluZ0VsZW1lbnRzID0gdHJ1ZSwgZmlyc3RFeHByRXJyb3IgPSBudWxsO1xuXG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0spKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5DT01NQSkpIHtcbiAgICAgICAgZXhwcnMgJiYgZXhwcnMucHVzaChudWxsKTtcbiAgICAgICAgcGF0dGVybnMgJiYgcGF0dGVybnMucHVzaChudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBlbGVtZW50TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuRUxMSVBTSVMpKSB7XG4gICAgICAgICAgLy8gU3ByZWFkL1Jlc3QgZWxlbWVudFxuICAgICAgICAgIGxldCB7IGV4cHIsIHBhdHRlcm4sIGlzQmluZGluZ0VsZW1lbnQsIGV4cHJFcnJvciB9ID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uT3JCaW5kaW5nRWxlbWVudCgpO1xuICAgICAgICAgIGZpcnN0RXhwckVycm9yID0gZmlyc3RFeHByRXJyb3IgfHwgZXhwckVycm9yO1xuXG4gICAgICAgICAgYWxsQmluZGluZ0VsZW1lbnRzID0gYWxsQmluZGluZ0VsZW1lbnRzICYmIGlzQmluZGluZ0VsZW1lbnQ7XG5cbiAgICAgICAgICBpZiAoIWV4cHIpIHtcbiAgICAgICAgICAgIGV4cHJzID0gbnVsbDtcbiAgICAgICAgICAgIGlmICghcGF0dGVybnMpIHtcbiAgICAgICAgICAgICAgdGhyb3cgZmlyc3RFeHByRXJyb3I7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGV4cHIgPSB0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiU3ByZWFkRWxlbWVudFwiLCBleHByZXNzaW9uOiBleHByIH0sIGVsZW1lbnRMb2NhdGlvbik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFwYXR0ZXJuKSB7XG4gICAgICAgICAgICBwYXR0ZXJucyA9IG51bGw7XG4gICAgICAgICAgICBpZiAoIWV4cHJzKSB7XG4gICAgICAgICAgICAgIHRocm93IGZpcnN0RXhwckVycm9yO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSBpZiAocGF0dGVybnMpIHtcbiAgICAgICAgICAgIC8vIFdoZW4gaXNCaW5kaW5nRWxlbWVudE5leHQgaXMgdHJ1ZSwgcGF0dGVybk5leHQgaXMgcHJlc2VudC5cbiAgICAgICAgICAgIHJlc3RFbGVtZW50ID0gcGF0dGVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBleHBycyAmJiBleHBycy5wdXNoKGV4cHIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxldCB7IGV4cHIsIHBhdHRlcm4sIGlzQmluZGluZ0VsZW1lbnQsIGV4cHJFcnJvciB9ID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uT3JCaW5kaW5nRWxlbWVudCgpO1xuXG4gICAgICAgICAgYWxsQmluZGluZ0VsZW1lbnRzID0gYWxsQmluZGluZ0VsZW1lbnRzICYmIGlzQmluZGluZ0VsZW1lbnQ7XG5cbiAgICAgICAgICBpZiAoIWV4cHIpIHtcbiAgICAgICAgICAgIGZpcnN0RXhwckVycm9yID0gZmlyc3RFeHByRXJyb3IgfHwgZXhwckVycm9yO1xuICAgICAgICAgICAgZXhwcnMgPSBudWxsO1xuICAgICAgICAgICAgaWYgKCFwYXR0ZXJucykge1xuICAgICAgICAgICAgICB0aHJvdyBleHByRXJyb3I7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghcGF0dGVybikge1xuICAgICAgICAgICAgcGF0dGVybnMgPSBudWxsO1xuICAgICAgICAgICAgaWYgKCFleHBycykge1xuICAgICAgICAgICAgICB0aHJvdyBmaXJzdEV4cHJFcnJvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgZXhwcnMgJiYgZXhwcnMucHVzaChleHByKTtcbiAgICAgICAgICBwYXR0ZXJucyAmJiBwYXR0ZXJucy5wdXNoKHBhdHRlcm4pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0spKSB7XG4gICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNPTU1BKTtcbiAgICAgICAgICBpZiAocmVzdEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHBhdHRlcm5zID0gbnVsbDtcbiAgICAgICAgICAgIGFsbEJpbmRpbmdFbGVtZW50cyA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SQlJBQ0spO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGV4cHI6IGV4cHJzICYmIHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJBcnJheUV4cHJlc3Npb25cIiwgZWxlbWVudHM6IGV4cHJzIH0sIHN0YXJ0TG9jYXRpb24pLFxuICAgICAgcGF0dGVybjogcGF0dGVybnMgJiYgdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIkFycmF5QmluZGluZ1wiLCBlbGVtZW50czogcGF0dGVybnMsIHJlc3RFbGVtZW50IH0sIHN0YXJ0TG9jYXRpb24pLFxuICAgICAgaXNCaW5kaW5nRWxlbWVudDogYWxsQmluZGluZ0VsZW1lbnRzLFxuICAgICAgZXhwckVycm9yOiBmaXJzdEV4cHJFcnJvclxuICAgIH07XG4gIH1cblxuICBwYXJzZU9iamVjdEV4cHJlc3Npb24oKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTEJSQUNFKTtcblxuICAgIGxldCBwcm9wZXJ0aWVzID0gW10sIGJpbmRpbmdQcm9wZXJ0aWVzID0gW10sIGlzQmluZGluZ0VsZW1lbnQgPSB0cnVlLCBleHByRXJyb3IgPSBudWxsO1xuICAgIGxldCBoYXNfX3Byb3RvX18gPSBbZmFsc2VdO1xuICAgIHdoaWxlICghdGhpcy5tYXRjaChUb2tlblR5cGUuUkJSQUNFKSkge1xuICAgICAgbGV0IHtcbiAgICAgICAgcHJvcGVydHksXG4gICAgICAgIGJpbmRpbmdQcm9wZXJ0eSxcbiAgICAgICAgaXNCaW5kaW5nRWxlbWVudDogaXNCaW5kaW5nRWxlbWVudE5leHQsXG4gICAgICAgIGV4cHJFcnJvcjogZXhwckVycm9yTmV4dFxuICAgICAgICB9ID0gdGhpcy5wYXJzZVByb3BlcnR5RGVmaW5pdGlvbihoYXNfX3Byb3RvX18pO1xuICAgICAgaWYgKHByb3BlcnRpZXMpIHtcbiAgICAgICAgaWYgKHByb3BlcnR5KSB7XG4gICAgICAgICAgcHJvcGVydGllcy5wdXNoKHByb3BlcnR5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBleHByRXJyb3IgPSBleHByRXJyb3IgfHwgZXhwckVycm9yTmV4dDtcbiAgICAgICAgICBwcm9wZXJ0aWVzID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoYmluZGluZ1Byb3BlcnRpZXMpIHtcbiAgICAgICAgaWYgKGJpbmRpbmdQcm9wZXJ0eSkge1xuICAgICAgICAgIGJpbmRpbmdQcm9wZXJ0aWVzLnB1c2goYmluZGluZ1Byb3BlcnR5KTtcbiAgICAgICAgICBpc0JpbmRpbmdFbGVtZW50ID0gaXNCaW5kaW5nRWxlbWVudCAmJiBpc0JpbmRpbmdFbGVtZW50TmV4dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBiaW5kaW5nUHJvcGVydGllcyA9IGZhbHNlO1xuICAgICAgICAgIGlzQmluZGluZ0VsZW1lbnQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJCUkFDRSkpIHtcbiAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNPTU1BKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUkJSQUNFKTtcblxuICAgIHJldHVybiB7XG4gICAgICBleHByOiBwcm9wZXJ0aWVzICYmIHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJPYmplY3RFeHByZXNzaW9uXCIsIHByb3BlcnRpZXMgfSwgc3RhcnRMb2NhdGlvbiksXG4gICAgICBwYXR0ZXJuOiBiaW5kaW5nUHJvcGVydGllcyAmJiB0aGlzLm1hcmtMb2NhdGlvbih7XG4gICAgICAgIHR5cGU6IFwiT2JqZWN0QmluZGluZ1wiLFxuICAgICAgICBwcm9wZXJ0aWVzOiBiaW5kaW5nUHJvcGVydGllc1xuICAgICAgfSwgc3RhcnRMb2NhdGlvbiksXG4gICAgICBpc0JpbmRpbmdFbGVtZW50LFxuICAgICAgZXhwckVycm9yXG4gICAgfTtcbiAgfVxuXG4gIHBhcnNlUHJvcGVydHlEZWZpbml0aW9uKGhhc19fcHJvdG9fXykge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuXG4gICAgbGV0IHttZXRob2RPcktleSwga2luZCwgYmluZGluZ30gPSB0aGlzLnBhcnNlTWV0aG9kRGVmaW5pdGlvbihmYWxzZSk7XG4gICAgc3dpdGNoIChraW5kKSB7XG4gICAgICBjYXNlIFwibWV0aG9kXCI6XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgcHJvcGVydHk6IG1ldGhvZE9yS2V5LFxuICAgICAgICAgIGJpbmRpbmdQcm9wZXJ0eTogbnVsbCxcbiAgICAgICAgICBpc0JpbmRpbmdFbGVtZW50OiBmYWxzZSxcbiAgICAgICAgICBleHByRXJyb3I6IG51bGwsXG4gICAgICAgIH07XG4gICAgICBjYXNlIFwiaWRlbnRpZmllclwiOiAvLyBJZGVudGlmaWVyUmVmZXJlbmNlLFxuICAgICAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLkFTU0lHTikpIHtcbiAgICAgICAgICAvLyBDb3ZlckluaXRpYWxpemVkTmFtZVxuICAgICAgICAgIGlmIChtZXRob2RPcktleS52YWx1ZSA9PT0gXCJ5aWVsZFwiICYmXG4gICAgICAgICAgICAodGhpcy5zdHJpY3QgfHwgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiB8fCB0aGlzLmluR2VuZXJhdG9yQm9keSB8fCB0aGlzLmluR2VuZXJhdG9yUGFyYW1ldGVyKSkge1xuICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRva2VuKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgbGV0IGluaXQgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcHJvcGVydHk6IG51bGwsXG4gICAgICAgICAgICBiaW5kaW5nUHJvcGVydHk6IHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJCaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyXCIsIGJpbmRpbmcsIGluaXQsIH0sIHN0YXJ0TG9jYXRpb24pLFxuICAgICAgICAgICAgaXNCaW5kaW5nRWxlbWVudDogdHJ1ZSxcbiAgICAgICAgICAgIGV4cHJFcnJvcjogdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbihzdGFydExvY2F0aW9uLCBFcnJvck1lc3NhZ2VzLklMTEVHQUxfUFJPUEVSVFkpXG4gICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuQ09MT04pKSB7XG4gICAgICAgICAgaWYgKHRva2VuLnR5cGUgIT09IFRva2VuVHlwZS5JREVOVElGSUVSICYmIHRva2VuLnR5cGUgIT09IFRva2VuVHlwZS5ZSUVMRCB8fFxuICAgICAgICAgICAgKHRoaXMuc3RyaWN0IHx8IHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24pICYmIG1ldGhvZE9yS2V5LnZhbHVlID09PSBcInlpZWxkXCIpIHtcbiAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0b2tlbik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBwcm9wZXJ0eTogdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIlNob3J0aGFuZFByb3BlcnR5XCIsIG5hbWU6IG1ldGhvZE9yS2V5LnZhbHVlIH0sIHN0YXJ0TG9jYXRpb24pLFxuICAgICAgICAgICAgYmluZGluZ1Byb3BlcnR5OiB0aGlzLm1hcmtMb2NhdGlvbih7XG4gICAgICAgICAgICAgIHR5cGU6IFwiQmluZGluZ1Byb3BlcnR5SWRlbnRpZmllclwiLFxuICAgICAgICAgICAgICBiaW5kaW5nOiBiaW5kaW5nLFxuICAgICAgICAgICAgICBpbml0OiBudWxsLFxuICAgICAgICAgICAgfSwgc3RhcnRMb2NhdGlvbiksXG4gICAgICAgICAgICBpc0JpbmRpbmdFbGVtZW50OiB0cnVlLFxuICAgICAgICAgICAgZXhwckVycm9yOiBudWxsXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gRGF0YVByb3BlcnR5XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNPTE9OKTtcbiAgICBpZiAobWV0aG9kT3JLZXkudHlwZSA9PT0gXCJTdGF0aWNQcm9wZXJ0eU5hbWVcIikge1xuICAgICAgaWYgKG1ldGhvZE9yS2V5LnZhbHVlID09PSBcIl9fcHJvdG9fX1wiKSB7XG4gICAgICAgIGlmICghaGFzX19wcm90b19fWzBdKSB7XG4gICAgICAgICAgaGFzX19wcm90b19fWzBdID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLkRVUExJQ0FURV9QUk9UT19QUk9QRVJUWSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgeyBleHByLCBwYXR0ZXJuLCBpc0JpbmRpbmdFbGVtZW50LCBleHByRXJyb3IgfSA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbk9yQmluZGluZ0VsZW1lbnQoKTtcbiAgICByZXR1cm4ge1xuICAgICAgcHJvcGVydHk6IGV4cHIgJiYgdGhpcy5tYXJrTG9jYXRpb24oe1xuICAgICAgICB0eXBlOiBcIkRhdGFQcm9wZXJ0eVwiLCBuYW1lOiBtZXRob2RPcktleSwgZXhwcmVzc2lvbjogZXhwclxuICAgICAgfSwgc3RhcnRMb2NhdGlvbiksXG4gICAgICBiaW5kaW5nUHJvcGVydHk6IHBhdHRlcm4gJiYgdGhpcy5tYXJrTG9jYXRpb24oe1xuICAgICAgICB0eXBlOiBcIkJpbmRpbmdQcm9wZXJ0eVByb3BlcnR5XCIsXG4gICAgICAgIG5hbWU6IG1ldGhvZE9yS2V5LFxuICAgICAgICBiaW5kaW5nOiBwYXR0ZXJuXG4gICAgICB9LCBzdGFydExvY2F0aW9uKSxcbiAgICAgIGlzQmluZGluZ0VsZW1lbnQsXG4gICAgICBleHByRXJyb3IsXG4gICAgfTtcbiAgfVxuXG4gIHBhcnNlUHJvcGVydHlOYW1lKCkge1xuICAgIC8vIFByb3BlcnR5TmFtZVtZaWVsZCxHZW5lcmF0b3JQYXJhbWV0ZXJdOlxuICAgIGxldCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuXG4gICAgaWYgKHRoaXMuZW9mKCkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0b2tlbik7XG4gICAgfVxuXG4gICAgc3dpdGNoICh0b2tlbi50eXBlKSB7XG4gICAgICBjYXNlIFRva2VuVHlwZS5TVFJJTkc6XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgbmFtZTogdGhpcy5tYXJrTG9jYXRpb24oe1xuICAgICAgICAgICAgdHlwZTogXCJTdGF0aWNQcm9wZXJ0eU5hbWVcIixcbiAgICAgICAgICAgIHZhbHVlOiB0aGlzLnBhcnNlU3RyaW5nTGl0ZXJhbCgpLnZhbHVlXG4gICAgICAgICAgfSwgc3RhcnRMb2NhdGlvbiksXG4gICAgICAgICAgYmluZGluZzogbnVsbFxuICAgICAgICB9O1xuICAgICAgY2FzZSBUb2tlblR5cGUuTlVNQkVSOlxuICAgICAgICBsZXQgbnVtTGl0ZXJhbCA9IHRoaXMucGFyc2VOdW1lcmljTGl0ZXJhbCgpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIG5hbWU6IHRoaXMubWFya0xvY2F0aW9uKHtcbiAgICAgICAgICAgIHR5cGU6IFwiU3RhdGljUHJvcGVydHlOYW1lXCIsXG4gICAgICAgICAgICB2YWx1ZTogXCJcIiArIChudW1MaXRlcmFsLnR5cGUgPT09IFwiTGl0ZXJhbEluZmluaXR5RXhwcmVzc2lvblwiID8gMSAvIDAgOiBudW1MaXRlcmFsLnZhbHVlKVxuICAgICAgICAgIH0sIHN0YXJ0TG9jYXRpb24pLFxuICAgICAgICAgIGJpbmRpbmc6IG51bGxcbiAgICAgICAgfTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkxCUkFDSzpcbiAgICAgICAgbGV0IHByZXZpb3VzWWllbGQgPSB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uO1xuICAgICAgICBpZiAodGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlcikge1xuICAgICAgICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTEJSQUNLKTtcbiAgICAgICAgbGV0IGV4cHIgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJCUkFDSyk7XG4gICAgICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBwcmV2aW91c1lpZWxkO1xuICAgICAgICByZXR1cm4geyBuYW1lOiB0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiQ29tcHV0ZWRQcm9wZXJ0eU5hbWVcIiwgZXhwcmVzc2lvbjogZXhwciB9LCBzdGFydExvY2F0aW9uKSwgYmluZGluZzogbnVsbCB9O1xuICAgIH1cblxuICAgIGxldCBuYW1lID0gdGhpcy5wYXJzZUlkZW50aWZpZXJOYW1lKCk7XG4gICAgcmV0dXJuIHtcbiAgICAgIG5hbWU6IHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJTdGF0aWNQcm9wZXJ0eU5hbWVcIiwgdmFsdWU6IG5hbWUgfSwgc3RhcnRMb2NhdGlvbiksXG4gICAgICBiaW5kaW5nOiB0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiQmluZGluZ0lkZW50aWZpZXJcIiwgbmFtZSB9LCBzdGFydExvY2F0aW9uKSxcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVGVzdCBpZiBsb29rYWhlYWQgY2FuIGJlIHRoZSBiZWdpbm5pbmcgb2YgYSBgUHJvcGVydHlOYW1lYC5cbiAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAqL1xuICBsb29rYWhlYWRQcm9wZXJ0eU5hbWUoKSB7XG4gICAgc3dpdGNoICh0aGlzLmxvb2thaGVhZC50eXBlKSB7XG4gICAgICBjYXNlIFRva2VuVHlwZS5OVU1CRVI6XG4gICAgICBjYXNlIFRva2VuVHlwZS5TVFJJTkc6XG4gICAgICBjYXNlIFRva2VuVHlwZS5MQlJBQ0s6XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIHRoaXMubG9va2FoZWFkLnR5cGUua2xhc3MuaXNJZGVudGlmaWVyTmFtZTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVHJ5IHRvIHBhcnNlIGEgbWV0aG9kIGRlZmluaXRpb24uXG4gICAqXG4gICAqIElmIGl0IHR1cm5zIG91dCB0byBiZSBvbmUgb2Y6XG4gICAqICAqIGBJZGVudGlmaWVyUmVmZXJlbmNlYFxuICAgKiAgKiBgQ292ZXJJbml0aWFsaXplZE5hbWVgIChgSWRlbnRpZmllclJlZmVyZW5jZSBcIj1cIiBBc3NpZ25tZW50RXhwcmVzc2lvbmApXG4gICAqICAqIGBQcm9wZXJ0eU5hbWUgOiBBc3NpZ25tZW50RXhwcmVzc2lvbmBcbiAgICogVGhlIHRoZSBwYXJzZXIgd2lsbCBzdG9wIGF0IHRoZSBlbmQgb2YgdGhlIGxlYWRpbmcgYElkZW50aWZpZXJgIG9yIGBQcm9wZXJ0eU5hbWVgIGFuZCByZXR1cm4gaXQuXG4gICAqXG4gICAqIEByZXR1cm5zIHt7bWV0aG9kT3JLZXk6IChNZXRob2R8UHJvcGVydHlOYW1lKSwga2luZDogc3RyaW5nfX1cbiAgICovXG4gIHBhcnNlTWV0aG9kRGVmaW5pdGlvbihpc0NsYXNzUHJvdG9NZXRob2QpIHtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcblxuICAgIGxldCBpc0dlbmVyYXRvciA9ICEhdGhpcy5lYXQoVG9rZW5UeXBlLk1VTCk7XG5cbiAgICBsZXQge25hbWUsIGJpbmRpbmd9ID0gdGhpcy5wYXJzZVByb3BlcnR5TmFtZSgpO1xuXG4gICAgaWYgKCFpc0dlbmVyYXRvciAmJiB0b2tlbi50eXBlID09PSBUb2tlblR5cGUuSURFTlRJRklFUikge1xuICAgICAgbGV0IG5hbWUgPSB0b2tlbi52YWx1ZTtcbiAgICAgIGlmIChuYW1lLmxlbmd0aCA9PT0gMykge1xuICAgICAgICAvLyBQcm9wZXJ0eSBBc3NpZ25tZW50OiBHZXR0ZXIgYW5kIFNldHRlci5cbiAgICAgICAgaWYgKG5hbWUgPT09IFwiZ2V0XCIgJiYgdGhpcy5sb29rYWhlYWRQcm9wZXJ0eU5hbWUoKSkge1xuICAgICAgICAgICh7bmFtZX0gPSB0aGlzLnBhcnNlUHJvcGVydHlOYW1lKCkpO1xuICAgICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MUEFSRU4pO1xuICAgICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgICAgICAgIGxldCBwcmV2aW91c0luQ29uc3RydWN0b3IgPSB0aGlzLmluQ29uc3RydWN0b3I7XG4gICAgICAgICAgdGhpcy5pbkNvbnN0cnVjdG9yID0gZmFsc2U7XG4gICAgICAgICAgbGV0IHByZXZpb3VzSW5NZXRob2QgPSB0aGlzLmluTWV0aG9kO1xuICAgICAgICAgIHRoaXMuaW5NZXRob2QgPSB0cnVlO1xuICAgICAgICAgIGxldCBbYm9keV0gPSB0aGlzLnBhcnNlRnVuY3Rpb25Cb2R5KFtdKTtcbiAgICAgICAgICB0aGlzLmluQ29uc3RydWN0b3IgPSBwcmV2aW91c0luQ29uc3RydWN0b3I7XG4gICAgICAgICAgdGhpcy5pbk1ldGhvZCA9IHByZXZpb3VzSW5NZXRob2Q7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG1ldGhvZE9yS2V5OiB0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiR2V0dGVyXCIsIG5hbWUsIGJvZHkgfSwgc3RhcnRMb2NhdGlvbiksXG4gICAgICAgICAgICBraW5kOiBcIm1ldGhvZFwiXG4gICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIGlmIChuYW1lID09PSBcInNldFwiICYmIHRoaXMubG9va2FoZWFkUHJvcGVydHlOYW1lKCkpIHtcbiAgICAgICAgICAoe25hbWV9ID0gdGhpcy5wYXJzZVByb3BlcnR5TmFtZSgpKTtcbiAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTFBBUkVOKTtcbiAgICAgICAgICBsZXQgcGFyYW0gPSB0aGlzLnBhcnNlQmluZGluZ0VsZW1lbnQoKTtcbiAgICAgICAgICBsZXQgaW5mbyA9IHt9O1xuICAgICAgICAgIHRoaXMuY2hlY2tQYXJhbShwYXJhbSwgdG9rZW4sIFtdLCBpbmZvKTtcbiAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcbiAgICAgICAgICBsZXQgcHJldmlvdXNZaWVsZCA9IHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb247XG4gICAgICAgICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IGZhbHNlO1xuICAgICAgICAgIGxldCBwcmV2aW91c0luQ29uc3RydWN0b3IgPSB0aGlzLmluQ29uc3RydWN0b3I7XG4gICAgICAgICAgdGhpcy5pbkNvbnN0cnVjdG9yID0gZmFsc2U7XG4gICAgICAgICAgbGV0IHByZXZpb3VzSW5NZXRob2QgPSB0aGlzLmluTWV0aG9kO1xuICAgICAgICAgIHRoaXMuaW5NZXRob2QgPSB0cnVlO1xuICAgICAgICAgIGxldCBib3VuZFBhcmFtcyA9IFBhcnNlci5ib3VuZE5hbWVzKHBhcmFtKTtcbiAgICAgICAgICBsZXQgW2JvZHksIGlzU3RyaWN0XSA9IHRoaXMucGFyc2VGdW5jdGlvbkJvZHkoYm91bmRQYXJhbXMpO1xuICAgICAgICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBwcmV2aW91c1lpZWxkO1xuICAgICAgICAgIHRoaXMuaW5Db25zdHJ1Y3RvciA9IHByZXZpb3VzSW5Db25zdHJ1Y3RvcjtcbiAgICAgICAgICB0aGlzLmluTWV0aG9kID0gcHJldmlvdXNJbk1ldGhvZDtcbiAgICAgICAgICBpZiAoaXNTdHJpY3QpIHtcbiAgICAgICAgICAgIGlmIChpbmZvLmZpcnN0UmVzdHJpY3RlZCkge1xuICAgICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKGluZm8uZmlyc3RSZXN0cmljdGVkLCBpbmZvLm1lc3NhZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbWV0aG9kT3JLZXk6IHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJTZXR0ZXJcIiwgbmFtZSwgcGFyYW0sIGJvZHkgfSwgc3RhcnRMb2NhdGlvbiksXG4gICAgICAgICAgICBraW5kOiBcIm1ldGhvZFwiXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5MUEFSRU4pKSB7XG4gICAgICBsZXQgcHJldmlvdXNZaWVsZCA9IHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb247XG4gICAgICBsZXQgcHJldmlvdXNJbkdlbmVyYXRvclBhcmFtZXRlciA9IHRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXI7XG4gICAgICB0aGlzLmluR2VuZXJhdG9yUGFyYW1ldGVyID0gaXNHZW5lcmF0b3I7XG4gICAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gaXNHZW5lcmF0b3I7XG4gICAgICBsZXQgcGFyYW1zTG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgICBsZXQgcGFyYW1JbmZvID0gdGhpcy5wYXJzZVBhcmFtcyhudWxsKTtcbiAgICAgIHRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXIgPSBwcmV2aW91c0luR2VuZXJhdG9yUGFyYW1ldGVyO1xuICAgICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IHByZXZpb3VzWWllbGQ7XG4gICAgICBsZXQgcHJldmlvdXNJbkdlbmVyYXRvckJvZHkgPSB0aGlzLmluR2VuZXJhdG9yQm9keTtcbiAgICAgIGxldCBwcmV2aW91c0luQ29uc3RydWN0b3IgPSB0aGlzLmluQ29uc3RydWN0b3I7XG4gICAgICBsZXQgcHJldmlvdXNJbk1ldGhvZCA9IHRoaXMuaW5NZXRob2Q7XG4gICAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gaXNHZW5lcmF0b3I7XG4gICAgICB0aGlzLmluQ29uc3RydWN0b3IgPVxuICAgICAgICBpc0NsYXNzUHJvdG9NZXRob2QgJiYgIWlzR2VuZXJhdG9yICYmIHRoaXMuaGFzQ2xhc3NIZXJpdGFnZSAmJlxuICAgICAgICBuYW1lLnR5cGUgPT09IFwiU3RhdGljUHJvcGVydHlOYW1lXCIgJiYgbmFtZS52YWx1ZSA9PT0gXCJjb25zdHJ1Y3RvclwiO1xuICAgICAgdGhpcy5pbk1ldGhvZCA9IHRydWU7XG5cbiAgICAgIGlmIChpc0dlbmVyYXRvcikge1xuICAgICAgICB0aGlzLmluR2VuZXJhdG9yQm9keSA9IHRydWU7XG4gICAgICB9XG4gICAgICBsZXQgYm91bmRQYXJhbXMgPSBbXS5jb25jYXQuYXBwbHkoW10sIHBhcmFtSW5mby5wYXJhbXMubWFwKFBhcnNlci5ib3VuZE5hbWVzKSk7XG5cbiAgICAgIGxldCBwYXJhbXMgPSB0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiRm9ybWFsUGFyYW1ldGVyc1wiLCBpdGVtczogcGFyYW1JbmZvLnBhcmFtcywgcmVzdDogcGFyYW1JbmZvLnJlc3QgfSwgcGFyYW1zTG9jYXRpb24pO1xuXG4gICAgICBsZXQgW2JvZHldID0gdGhpcy5wYXJzZUZ1bmN0aW9uQm9keShib3VuZFBhcmFtcyk7XG4gICAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gcHJldmlvdXNZaWVsZDtcbiAgICAgIHRoaXMuaW5HZW5lcmF0b3JCb2R5ID0gcHJldmlvdXNJbkdlbmVyYXRvckJvZHk7XG4gICAgICB0aGlzLmluQ29uc3RydWN0b3IgPSBwcmV2aW91c0luQ29uc3RydWN0b3I7XG4gICAgICB0aGlzLmluTWV0aG9kID0gcHJldmlvdXNJbk1ldGhvZDtcblxuICAgICAgaWYgKHBhcmFtSW5mby5maXJzdFJlc3RyaWN0ZWQpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbihwYXJhbUluZm8uZmlyc3RSZXN0cmljdGVkLCBwYXJhbUluZm8ubWVzc2FnZSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIG1ldGhvZE9yS2V5OiB0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiTWV0aG9kXCIsIGlzR2VuZXJhdG9yLCBuYW1lLCBwYXJhbXMsIGJvZHkgfSwgc3RhcnRMb2NhdGlvbiksXG4gICAgICAgIGtpbmQ6IFwibWV0aG9kXCJcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIG1ldGhvZE9yS2V5OiBuYW1lLFxuICAgICAga2luZDogdG9rZW4udHlwZS5rbGFzcy5pc0lkZW50aWZpZXJOYW1lID8gXCJpZGVudGlmaWVyXCIgOiBcInByb3BlcnR5XCIsXG4gICAgICBiaW5kaW5nOiBiaW5kaW5nXG4gICAgfTtcbiAgfVxuXG4gIHBhcnNlQ2xhc3Moe2lzRXhwciwgaW5EZWZhdWx0ID0gZmFsc2V9KSB7XG4gICAgbGV0IGxvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5DTEFTUyk7XG4gICAgbGV0IG5hbWUgPSBudWxsO1xuICAgIGxldCBoZXJpdGFnZSA9IG51bGw7XG5cbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuSURFTlRJRklFUikpIHtcbiAgICAgIGxldCBpZExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgICAgbmFtZSA9IHRoaXMucGFyc2VCaW5kaW5nSWRlbnRpZmllcigpO1xuICAgIH0gZWxzZSBpZiAoIWlzRXhwcikge1xuICAgICAgaWYgKGluRGVmYXVsdCkge1xuICAgICAgICBuYW1lID0gdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIkJpbmRpbmdJZGVudGlmaWVyXCIsIG5hbWU6IFwiKmRlZmF1bHQqXCIgfSwgbG9jYXRpb24pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgcHJldmlvdXNJbkdlbmVyYXRvclBhcmFtZXRlciA9IHRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXI7XG4gICAgbGV0IHByZXZpb3VzUGFyYW1ZaWVsZCA9IHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb247XG4gICAgbGV0IHByZXZpb3VzSGFzQ2xhc3NIZXJpdGFnZSA9IHRoaXMuaGFzQ2xhc3NIZXJpdGFnZTtcbiAgICBpZiAoaXNFeHByKSB7XG4gICAgICB0aGlzLmluR2VuZXJhdG9yUGFyYW1ldGVyID0gZmFsc2U7XG4gICAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gZmFsc2U7XG4gICAgfVxuICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuRVhURU5EUykpIHtcbiAgICAgIGhlcml0YWdlID0gUGFyc2VyLmdldEV4cHIodGhpcy5wYXJzZUxlZnRIYW5kU2lkZUV4cHJlc3Npb24oeyBhbGxvd0NhbGw6IHRydWUgfSkpO1xuICAgIH1cblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MQlJBQ0UpO1xuICAgIGxldCBvcmlnaW5hbFN0cmljdCA9IHRoaXMuc3RyaWN0O1xuICAgIHRoaXMuc3RyaWN0ID0gdHJ1ZTtcbiAgICBsZXQgZWxlbWVudHMgPSBbXTtcbiAgICBsZXQgaGFzQ29uc3RydWN0b3IgPSBmYWxzZTtcbiAgICB0aGlzLmhhc0NsYXNzSGVyaXRhZ2UgPSBoZXJpdGFnZSAhPSBudWxsO1xuICAgIHdoaWxlICghdGhpcy5lYXQoVG9rZW5UeXBlLlJCUkFDRSkpIHtcbiAgICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuU0VNSUNPTE9OKSkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGxldCBtZXRob2RUb2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgICAgbGV0IGlzU3RhdGljID0gZmFsc2U7XG4gICAgICBsZXQge21ldGhvZE9yS2V5LCBraW5kfSA9IHRoaXMucGFyc2VNZXRob2REZWZpbml0aW9uKHRydWUpO1xuICAgICAgaWYgKGtpbmQgPT09IFwiaWRlbnRpZmllclwiICYmIG1ldGhvZE9yS2V5LnZhbHVlID09PSBcInN0YXRpY1wiKSB7XG4gICAgICAgIGlzU3RhdGljID0gdHJ1ZTtcbiAgICAgICAgKHttZXRob2RPcktleSwga2luZH0gPSB0aGlzLnBhcnNlTWV0aG9kRGVmaW5pdGlvbihmYWxzZSkpO1xuICAgICAgfVxuICAgICAgc3dpdGNoIChraW5kKSB7XG4gICAgICAgIGNhc2UgXCJtZXRob2RcIjpcbiAgICAgICAgICBsZXQga2V5ID0gbWV0aG9kT3JLZXkubmFtZTtcbiAgICAgICAgICBpZiAoIWlzU3RhdGljKSB7XG4gICAgICAgICAgICBpZiAoa2V5LnR5cGUgPT09IFwiU3RhdGljUHJvcGVydHlOYW1lXCIgJiYga2V5LnZhbHVlID09PSBcImNvbnN0cnVjdG9yXCIpIHtcbiAgICAgICAgICAgICAgaWYgKG1ldGhvZE9yS2V5LnR5cGUgIT09IFwiTWV0aG9kXCIgfHwgbWV0aG9kT3JLZXkuaXNHZW5lcmF0b3IpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKG1ldGhvZFRva2VuLCBcIkNvbnN0cnVjdG9ycyBjYW5ub3QgYmUgZ2VuZXJhdG9ycywgZ2V0dGVycyBvciBzZXR0ZXJzXCIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChoYXNDb25zdHJ1Y3Rvcikge1xuICAgICAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24obWV0aG9kVG9rZW4sIFwiT25seSBvbmUgY29uc3RydWN0b3IgaXMgYWxsb3dlZCBpbiBhIGNsYXNzXCIpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGhhc0NvbnN0cnVjdG9yID0gdHJ1ZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoa2V5LnR5cGUgPT09IFwiU3RhdGljUHJvcGVydHlOYW1lXCIgJiYga2V5LnZhbHVlID09PSBcInByb3RvdHlwZVwiKSB7XG4gICAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24obWV0aG9kVG9rZW4sIFwiU3RhdGljIGNsYXNzIG1ldGhvZHMgY2Fubm90IGJlIG5hbWVkICdwcm90b3R5cGUnXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBlbGVtZW50cy5wdXNoKGNvcHlMb2NhdGlvbihtZXRob2RPcktleSwgeyB0eXBlOiBcIkNsYXNzRWxlbWVudFwiLCBpc1N0YXRpYywgbWV0aG9kOiBtZXRob2RPcktleSB9KSk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihcIk9ubHkgbWV0aG9kcyBhcmUgYWxsb3dlZCBpbiBjbGFzc2VzXCIpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIWlzRXhwcikge1xuICAgICAgdGhpcy5WRE5bXCIkXCIgKyBuYW1lLm5hbWVdID0gdHJ1ZTtcbiAgICB9XG4gICAgdGhpcy5zdHJpY3QgPSBvcmlnaW5hbFN0cmljdDtcbiAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gcHJldmlvdXNQYXJhbVlpZWxkO1xuICAgIHRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXIgPSBwcmV2aW91c0luR2VuZXJhdG9yUGFyYW1ldGVyO1xuICAgIHRoaXMuaGFzQ2xhc3NIZXJpdGFnZSA9IHByZXZpb3VzSGFzQ2xhc3NIZXJpdGFnZTtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBpc0V4cHIgPyBcIkNsYXNzRXhwcmVzc2lvblwiIDogXCJDbGFzc0RlY2xhcmF0aW9uXCIsIG5hbWUsIHN1cGVyOiBoZXJpdGFnZSwgZWxlbWVudHMgfSwgbG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VGdW5jdGlvbih7aXNFeHByLCBpc1RvcExldmVsLCBpbkRlZmF1bHQgPSBmYWxzZSwgYWxsb3dHZW5lcmF0b3IgPSB0cnVlfSkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkZVTkNUSU9OKTtcblxuICAgIGxldCBuYW1lID0gbnVsbDtcbiAgICBsZXQgbWVzc2FnZSA9IG51bGw7XG4gICAgbGV0IGZpcnN0UmVzdHJpY3RlZCA9IG51bGw7XG4gICAgbGV0IGlzR2VuZXJhdG9yID0gYWxsb3dHZW5lcmF0b3IgJiYgISF0aGlzLmVhdChUb2tlblR5cGUuTVVMKTtcbiAgICBsZXQgcHJldmlvdXNHZW5lcmF0b3JQYXJhbWV0ZXIgPSB0aGlzLmluR2VuZXJhdG9yUGFyYW1ldGVyO1xuICAgIGxldCBwcmV2aW91c1lpZWxkID0gdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbjtcbiAgICBsZXQgcHJldmlvdXNJbkdlbmVyYXRvckJvZHkgPSB0aGlzLmluR2VuZXJhdG9yQm9keTtcblxuICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuTFBBUkVOKSkge1xuICAgICAgbGV0IHRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgICBsZXQgaWRlbnRpZmllckxvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgICAgbmFtZSA9IHRoaXMucGFyc2VJZGVudGlmaWVyKCk7XG4gICAgICBpZiAodGhpcy5zdHJpY3QgfHwgaXNHZW5lcmF0b3IpIHtcbiAgICAgICAgaWYgKGlzUmVzdHJpY3RlZFdvcmQobmFtZSkpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLlNUUklDVF9GVU5DVElPTl9OQU1FKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGlzUmVzdHJpY3RlZFdvcmQobmFtZSkpIHtcbiAgICAgICAgICBmaXJzdFJlc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgICBtZXNzYWdlID0gRXJyb3JNZXNzYWdlcy5TVFJJQ1RfRlVOQ1RJT05fTkFNRTtcbiAgICAgICAgfSBlbHNlIGlmIChpc1N0cmljdE1vZGVSZXNlcnZlZFdvcmQobmFtZSkpIHtcbiAgICAgICAgICBmaXJzdFJlc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgICBtZXNzYWdlID0gRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUkVTRVJWRURfV09SRDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgbmFtZSA9IHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJCaW5kaW5nSWRlbnRpZmllclwiLCBuYW1lOiBuYW1lIH0sIGlkZW50aWZpZXJMb2NhdGlvbik7XG4gICAgfSBlbHNlIGlmICghaXNFeHByKSB7XG4gICAgICBpZiAoaW5EZWZhdWx0KSB7XG4gICAgICAgIG5hbWUgPSB0aGlzLm1hcmtMb2NhdGlvbih7dHlwZTogXCJCaW5kaW5nSWRlbnRpZmllclwiLCBuYW1lOiBcIipkZWZhdWx0KlwiIH0sIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgcGFyYW1zTG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICB0aGlzLmluR2VuZXJhdG9yUGFyYW1ldGVyID0gaXNHZW5lcmF0b3I7XG4gICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IGlzR2VuZXJhdG9yO1xuICAgIGxldCBpbmZvID0gdGhpcy5wYXJzZVBhcmFtcyhmaXJzdFJlc3RyaWN0ZWQpO1xuICAgIHRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXIgPSBwcmV2aW91c0dlbmVyYXRvclBhcmFtZXRlcjtcbiAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gcHJldmlvdXNZaWVsZDtcblxuICAgIGlmIChpbmZvLm1lc3NhZ2UgIT0gbnVsbCkge1xuICAgICAgbWVzc2FnZSA9IGluZm8ubWVzc2FnZTtcbiAgICB9XG5cbiAgICBsZXQgcHJldmlvdXNTdHJpY3QgPSB0aGlzLnN0cmljdDtcbiAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gaXNHZW5lcmF0b3I7XG4gICAgaWYgKGlzR2VuZXJhdG9yKSB7XG4gICAgICB0aGlzLmluR2VuZXJhdG9yQm9keSA9IHRydWU7XG4gICAgfVxuICAgIGxldCBwcmV2aW91c0luQ29uc3RydWN0b3IgPSB0aGlzLmluQ29uc3RydWN0b3I7XG4gICAgdGhpcy5pbkNvbnN0cnVjdG9yID0gZmFsc2U7XG4gICAgbGV0IHByZXZpb3VzSW5NZXRob2QgPSB0aGlzLmluTWV0aG9kO1xuICAgIHRoaXMuaW5NZXRob2QgPSBmYWxzZTtcbiAgICBsZXQgYm91bmRQYXJhbXMgPSBbXS5jb25jYXQuYXBwbHkoW10sIGluZm8ucGFyYW1zLm1hcChQYXJzZXIuYm91bmROYW1lcykpO1xuXG4gICAgbGV0IHBhcmFtcyA9IHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJGb3JtYWxQYXJhbWV0ZXJzXCIsIGl0ZW1zOiBpbmZvLnBhcmFtcywgcmVzdDogaW5mby5yZXN0IH0sIHBhcmFtc0xvY2F0aW9uKTtcblxuICAgIGxldCBbYm9keSwgaXNTdHJpY3RdID0gdGhpcy5wYXJzZUZ1bmN0aW9uQm9keShib3VuZFBhcmFtcyk7XG4gICAgdGhpcy5pbkdlbmVyYXRvckJvZHkgPSBwcmV2aW91c0luR2VuZXJhdG9yQm9keTtcbiAgICB0aGlzLmluQ29uc3RydWN0b3IgPSBwcmV2aW91c0luQ29uc3RydWN0b3I7XG4gICAgdGhpcy5pbk1ldGhvZCA9IHByZXZpb3VzSW5NZXRob2Q7XG5cbiAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gcHJldmlvdXNZaWVsZDtcbiAgICBpZiAobWVzc2FnZSAhPSBudWxsKSB7XG4gICAgICBpZiAoKHRoaXMuc3RyaWN0IHx8IGlzU3RyaWN0KSAmJiBpbmZvLmZpcnN0UmVzdHJpY3RlZCAhPSBudWxsKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24oaW5mby5maXJzdFJlc3RyaWN0ZWQsIG1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnN0cmljdCA9IHByZXZpb3VzU3RyaWN0O1xuICAgIGlmICghaXNFeHByKSB7XG4gICAgICBpZiAoaXNUb3BMZXZlbCkge1xuICAgICAgICB0aGlzLlZETltcIiRcIiArIG5hbWUubmFtZV0gPSB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5MRE4ucHVzaChuYW1lLm5hbWUpO1xuICAgICAgfVxuXG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKFxuICAgICAgeyB0eXBlOiBpc0V4cHIgPyBcIkZ1bmN0aW9uRXhwcmVzc2lvblwiIDogXCJGdW5jdGlvbkRlY2xhcmF0aW9uXCIsIGlzR2VuZXJhdG9yLCBuYW1lLCBwYXJhbXMsIGJvZHkgfSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZUFycmF5QmluZGluZygpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MQlJBQ0spO1xuXG4gICAgbGV0IGVsZW1lbnRzID0gW10sIHJlc3RFbGVtZW50ID0gbnVsbDtcblxuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuUkJSQUNLKSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGxldCBlbDtcblxuICAgICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5DT01NQSkpIHtcbiAgICAgICAgZWwgPSBudWxsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5FTExJUFNJUykpIHtcbiAgICAgICAgICByZXN0RWxlbWVudCA9IHRoaXMucGFyc2VCaW5kaW5nSWRlbnRpZmllcigpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGVsID0gdGhpcy5wYXJzZUJpbmRpbmdFbGVtZW50KCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0spKSB7XG4gICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNPTU1BKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxlbWVudHMucHVzaChlbCk7XG4gICAgfVxuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJCUkFDSyk7XG5cbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIkFycmF5QmluZGluZ1wiLCBlbGVtZW50cywgcmVzdEVsZW1lbnQgfSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZUJpbmRpbmdQcm9wZXJ0eSgpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICBsZXQge25hbWUsIGJpbmRpbmd9ID0gdGhpcy5wYXJzZVByb3BlcnR5TmFtZSgpO1xuICAgIGlmICgodG9rZW4udHlwZSA9PT0gVG9rZW5UeXBlLklERU5USUZJRVIgfHwgdG9rZW4udHlwZSA9PT0gVG9rZW5UeXBlLllJRUxEKSAmJiBuYW1lLnR5cGUgPT09ICdTdGF0aWNQcm9wZXJ0eU5hbWUnKSB7XG4gICAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLkNPTE9OKSkge1xuICAgICAgICBpZiAodG9rZW4udHlwZSA9PT0gVG9rZW5UeXBlLllJRUxEICYmICh0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uIHx8IHRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXIgfHwgdGhpcy5pbkdlbmVyYXRvckJvZHkpKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRva2VuKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgZGVmYXVsdFZhbHVlID0gbnVsbDtcbiAgICAgICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5BU1NJR04pKSB7XG4gICAgICAgICAgbGV0IHByZXZpb3VzQWxsb3dZaWVsZEV4cHJlc3Npb24gPSB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uO1xuICAgICAgICAgIGlmICh0aGlzLmluR2VuZXJhdG9yUGFyYW1ldGVyKSB7XG4gICAgICAgICAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIGxldCBleHByID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgICAgICAgZGVmYXVsdFZhbHVlID0gZXhwcjtcbiAgICAgICAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gcHJldmlvdXNBbGxvd1lpZWxkRXhwcmVzc2lvbjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24oe1xuICAgICAgICAgIHR5cGU6IFwiQmluZGluZ1Byb3BlcnR5SWRlbnRpZmllclwiLFxuICAgICAgICAgIGJpbmRpbmc6IGJpbmRpbmcsXG4gICAgICAgICAgaW5pdDogZGVmYXVsdFZhbHVlXG4gICAgICAgIH0sIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuQ09MT04pO1xuICAgIGJpbmRpbmcgPSB0aGlzLnBhcnNlQmluZGluZ0VsZW1lbnQoKTtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIkJpbmRpbmdQcm9wZXJ0eVByb3BlcnR5XCIsIG5hbWUsIGJpbmRpbmcgfSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZU9iamVjdEJpbmRpbmcoKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTEJSQUNFKTtcblxuICAgIGxldCBwcm9wZXJ0aWVzID0gW107XG4gICAgd2hpbGUgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0UpKSB7XG4gICAgICBwcm9wZXJ0aWVzLnB1c2godGhpcy5wYXJzZUJpbmRpbmdQcm9wZXJ0eSgpKTtcbiAgICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuUkJSQUNFKSkge1xuICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuQ09NTUEpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SQlJBQ0UpO1xuXG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJPYmplY3RCaW5kaW5nXCIsIHByb3BlcnRpZXMgfSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZUJpbmRpbmdUYXJnZXQoKSB7XG4gICAgc3dpdGNoICh0aGlzLmxvb2thaGVhZC50eXBlKSB7XG4gICAgICBjYXNlIFRva2VuVHlwZS5JREVOVElGSUVSOlxuICAgICAgY2FzZSBUb2tlblR5cGUuWUlFTEQ6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlQmluZGluZ0lkZW50aWZpZXIoKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkxCUkFDSzpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VBcnJheUJpbmRpbmcoKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkxCUkFDRTpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VPYmplY3RCaW5kaW5nKCk7XG4gICAgfVxuICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gIH1cblxuICBwYXJzZUJpbmRpbmdFbGVtZW50KCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCBiaW5kaW5nID0gdGhpcy5wYXJzZUJpbmRpbmdUYXJnZXQoKTtcblxuICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuQVNTSUdOKSkge1xuICAgICAgbGV0IHByZXZpb3VzSW5HZW5lcmF0b3JQYXJhbWV0ZXIgPSB0aGlzLmluR2VuZXJhdG9yUGFyYW1ldGVyO1xuICAgICAgbGV0IHByZXZpb3VzWWllbGRFeHByZXNzaW9uID0gdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbjtcbiAgICAgIGlmICh0aGlzLmluR2VuZXJhdG9yUGFyYW1ldGVyKSB7XG4gICAgICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXIgPSBmYWxzZTtcbiAgICAgIGxldCBpbml0ID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgICBiaW5kaW5nID0gdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIkJpbmRpbmdXaXRoRGVmYXVsdFwiLCBiaW5kaW5nLCBpbml0IH0sIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgdGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlciA9IHByZXZpb3VzSW5HZW5lcmF0b3JQYXJhbWV0ZXI7XG4gICAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gcHJldmlvdXNZaWVsZEV4cHJlc3Npb247XG5cbiAgICB9XG4gICAgcmV0dXJuIGJpbmRpbmc7XG4gIH1cblxuICBwYXJzZVBhcmFtKCkge1xuICAgIGxldCBvcmlnaW5hbEluUGFyYW1ldGVyID0gdGhpcy5pblBhcmFtZXRlcjtcbiAgICB0aGlzLmluUGFyYW1ldGVyID0gdHJ1ZTtcbiAgICBsZXQgcGFyYW0gPSB0aGlzLnBhcnNlQmluZGluZ0VsZW1lbnQoKTtcbiAgICB0aGlzLmluUGFyYW1ldGVyID0gb3JpZ2luYWxJblBhcmFtZXRlcjtcbiAgICByZXR1cm4gcGFyYW07XG4gIH1cblxuICBjaGVja1BhcmFtKHBhcmFtLCB0b2tlbiwgYm91bmQsIGluZm8pIHtcbiAgICBsZXQgbmV3Qm91bmQgPSBQYXJzZXIuYm91bmROYW1lcyhwYXJhbSk7XG4gICAgW10ucHVzaC5hcHBseShib3VuZCwgbmV3Qm91bmQpO1xuXG4gICAgaWYgKGZpcnN0RHVwbGljYXRlKG5ld0JvdW5kKSAhPSBudWxsKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLkRVUExJQ0FURV9CSU5ESU5HLCBmaXJzdER1cGxpY2F0ZShuZXdCb3VuZCkpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnN0cmljdCkge1xuICAgICAgaWYgKG5ld0JvdW5kLnNvbWUoaXNSZXN0cmljdGVkV29yZCkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUEFSQU1fTkFNRSk7XG4gICAgICB9IGVsc2UgaWYgKGZpcnN0RHVwbGljYXRlKGJvdW5kKSAhPSBudWxsKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuU1RSSUNUX1BBUkFNX0RVUEUpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoaW5mby5maXJzdFJlc3RyaWN0ZWQgPT0gbnVsbCkge1xuICAgICAgaWYgKG5ld0JvdW5kLnNvbWUoaXNSZXN0cmljdGVkV29yZCkpIHtcbiAgICAgICAgaW5mby5maXJzdFJlc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgaW5mby5tZXNzYWdlID0gRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUEFSQU1fTkFNRTtcbiAgICAgIH0gZWxzZSBpZiAoaGFzU3RyaWN0TW9kZVJlc2VydmVkV29yZChuZXdCb3VuZCkpIHtcbiAgICAgICAgaW5mby5maXJzdFJlc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgaW5mby5tZXNzYWdlID0gRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUkVTRVJWRURfV09SRDtcbiAgICAgIH0gZWxzZSBpZiAoZmlyc3REdXBsaWNhdGUoYm91bmQpICE9IG51bGwpIHtcbiAgICAgICAgaW5mby5maXJzdFJlc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgaW5mby5tZXNzYWdlID0gRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUEFSQU1fRFVQRTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwYXJzZVBhcmFtcyhmcikge1xuICAgIGxldCBpbmZvID0ge3BhcmFtczogW10sIHJlc3Q6IG51bGx9LCBpc1NpbXBsZVBhcmFtZXRlciA9IHRydWU7XG4gICAgaW5mby5maXJzdFJlc3RyaWN0ZWQgPSBmcjtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTFBBUkVOKTtcblxuICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuUlBBUkVOKSkge1xuICAgICAgbGV0IGJvdW5kID0gW107XG4gICAgICBsZXQgc2VlblJlc3QgPSBmYWxzZTtcblxuICAgICAgd2hpbGUgKCF0aGlzLmVvZigpKSB7XG4gICAgICAgIGxldCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgICAgICBsZXQgcGFyYW07XG4gICAgICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuRUxMSVBTSVMpKSB7XG4gICAgICAgICAgaXNTaW1wbGVQYXJhbWV0ZXIgPSBmYWxzZTtcbiAgICAgICAgICB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgICAgICAgIHBhcmFtID0gdGhpcy5wYXJzZUJpbmRpbmdJZGVudGlmaWVyKCk7XG4gICAgICAgICAgc2VlblJlc3QgPSB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBhcmFtID0gdGhpcy5wYXJzZVBhcmFtKCk7XG4gICAgICAgICAgaWYgKHBhcmFtLnR5cGUgIT09IFwiQmluZGluZ0lkZW50aWZpZXJcIikge1xuICAgICAgICAgICAgaXNTaW1wbGVQYXJhbWV0ZXIgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNoZWNrUGFyYW0ocGFyYW0sIHRva2VuLCBib3VuZCwgaW5mbyk7XG5cbiAgICAgICAgaWYgKHNlZW5SZXN0KSB7XG4gICAgICAgICAgaW5mby5yZXN0ID0gcGFyYW07XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgaW5mby5wYXJhbXMucHVzaChwYXJhbSk7XG4gICAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5SUEFSRU4pKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNPTU1BKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWlzU2ltcGxlUGFyYW1ldGVyKSB7XG4gICAgICBpZiAoaW5mby5tZXNzYWdlID09PSBFcnJvck1lc3NhZ2VzLlNUUklDVF9QQVJBTV9EVVBFKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoaW5mby5tZXNzYWdlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcbiAgICByZXR1cm4gaW5mbztcbiAgfVxufVxuIl19