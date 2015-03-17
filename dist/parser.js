// istanbul ignore next
"use strict";

var _slicedToArray = function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) { _arr.push(_step.value); if (i && _arr.length === i) break; } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } };

// istanbul ignore next

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

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

var Parser = exports.Parser = (function (_Tokenizer) {
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

  _inherits(Parser, _Tokenizer);

  _createClass(Parser, {
    eat: {
      value: function eat(tokenType) {
        if (this.lookahead.type === tokenType) {
          return this.lex();
        }
      }
    },
    expect: {
      value: function expect(tokenType) {
        if (this.lookahead.type === tokenType) {
          return this.lex();
        }
        throw this.createUnexpected(this.lookahead);
      }
    },
    matchContextualKeyword: {
      value: function matchContextualKeyword(keyword) {
        return this.lookahead.type === TokenType.IDENTIFIER && this.lookahead.value === keyword;
      }
    },
    expectContextualKeyword: {
      value: function expectContextualKeyword(keyword) {
        if (this.matchContextualKeyword(keyword)) {
          return this.lex();
        } else {
          throw this.createUnexpected(this.lookahead);
        }
      }
    },
    eatContextualKeyword: {
      value: function eatContextualKeyword(keyword) {
        if (this.matchContextualKeyword(keyword)) {
          return this.lex();
        }
      }
    },
    match: {
      value: function match(subType) {
        return this.lookahead.type === subType;
      }
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
      }
    },
    markLocation: {

      // this is a no-op, reserved for future use

      value: function markLocation(node, startLocation) {
        return node;
      }
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
      }
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
      }
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
      }
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
      }
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
      }
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
      }
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
      }
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
      }
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
      }
    },
    parseFromClause: {
      value: function parseFromClause() {
        this.expectContextualKeyword("from");
        var value = this.expect(TokenType.STRING)._value;
        this.consumeSemicolon();
        return value;
      }
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
            defaultBinding = this.expect(TokenType.IDENTIFIER).value;
            boundNames["$" + defaultBinding] = true;
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
      }
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
      }
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
      }
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
      }
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
      }
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
      }
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
      }
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
      }
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
      }
    },
    parseEmptyStatement: {
      value: function parseEmptyStatement() {
        this.expect(TokenType.SEMICOLON);
        return { type: "EmptyStatement" };
      }
    },
    parseBlockStatement: {
      value: function parseBlockStatement() {
        var stmt = { type: "BlockStatement", block: this.parseBlock() };
        this.checkBlockScope();
        return stmt;
      }
    },
    parseExpressionStatement: {
      value: function parseExpressionStatement() {
        var expr = this.parseExpression();
        this.consumeSemicolon();
        return { type: "ExpressionStatement", expression: expr };
      }
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
      }
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
      }
    },
    parseDebuggerStatement: {
      value: function parseDebuggerStatement() {
        this.expect(TokenType.DEBUGGER);
        this.consumeSemicolon();
        return { type: "DebuggerStatement" };
      }
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
      }
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
          if (this.match(TokenType.VAR) || isForDecl) {
            var previousAllowIn = this.allowIn;
            this.allowIn = false;
            var init = this.parseVariableDeclaration({ inFor: true });
            this.allowIn = previousAllowIn;

            if (init.declarators.length === 1 && (this.match(TokenType.IN) || this.match(TokenType.OF))) {
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
            var init = this.parseExpression();
            this.allowIn = previousAllowIn;

            if (this.match(TokenType.IN) || !startsWithLet && this.match(TokenType.OF)) {
              if (!Parser.isValidSimpleAssignmentTarget(init)) {
                throw this.createError(ErrorMessages.INVALID_LHS_IN_FOR_IN);
              }

              var type = this.match(TokenType.IN) ? "ForInStatement" : "ForOfStatement";

              this.lex();
              right = this.parseExpression();

              return { type: type, left: init, right: right, body: this.getIteratorStatementEpilogue() };
            } else {
              this.expect(TokenType.SEMICOLON);
              if (!this.match(TokenType.SEMICOLON)) {
                test = this.parseExpression();
              }
              this.expect(TokenType.SEMICOLON);
              if (!this.match(TokenType.RPAREN)) {
                right = this.parseExpression();
              }
              return { type: "ForStatement", init: init, test: test, update: right, body: this.getIteratorStatementEpilogue() };
            }
          }
        }
      }
    },
    getIteratorStatementEpilogue: {
      value: function getIteratorStatementEpilogue() {
        this.expect(TokenType.RPAREN);
        var oldInIteration = this.inIteration;
        this.inIteration = true;
        var body = this.parseStatement();
        this.inIteration = oldInIteration;
        return body;
      }
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
      }
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
      }
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
      }
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
      }
    },
    parseSwitchCases: {
      value: function parseSwitchCases() {
        var result = [];
        while (!(this.eof() || this.match(TokenType.RBRACE) || this.match(TokenType.DEFAULT))) {
          result.push(this.parseSwitchCase());
        }
        return result;
      }
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
      }
    },
    parseSwitchDefault: {
      value: function parseSwitchDefault() {
        var startLocation = this.getLocation();
        this.expect(TokenType.DEFAULT);
        return this.markLocation({ type: "SwitchDefault", consequent: this.parseSwitchCaseBody() }, startLocation);
      }
    },
    parseSwitchCaseBody: {
      value: function parseSwitchCaseBody() {
        this.expect(TokenType.COLON);
        return this.parseStatementListInSwitchCaseBody();
      }
    },
    parseStatementListInSwitchCaseBody: {
      value: function parseStatementListInSwitchCaseBody() {
        var result = [];
        while (!(this.eof() || this.match(TokenType.RBRACE) || this.match(TokenType.DEFAULT) || this.match(TokenType.CASE))) {
          result.push(this.parseStatementListItem());
        }
        return result;
      }
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
      }
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
      }
    },
    parseVariableDeclarationStatement: {
      value: function parseVariableDeclarationStatement() {
        var declaration = this.parseVariableDeclaration();
        this.consumeSemicolon();
        return { type: "VariableDeclarationStatement", declaration: declaration };
      }
    },
    parseWhileStatement: {
      value: function parseWhileStatement() {
        this.expect(TokenType.WHILE);
        this.expect(TokenType.LPAREN);
        return { type: "WhileStatement", test: this.parseExpression(), body: this.getIteratorStatementEpilogue() };
      }
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
      }
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
      }
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
      }
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
      }
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
      }
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
      }
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
      }
    },
    parseAssignmentExpression: {
      value: function parseAssignmentExpression() {
        return Parser.getExpr(this.parseAssignmentExpressionOrBindingElement());
      }
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
      }
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
      }
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
      }
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
      }
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
      }
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
      }
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
      }
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
      }
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
      }
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
      }
    },
    parseNonComputedMember: {
      value: function parseNonComputedMember() {
        this.expect(TokenType.PERIOD);
        if (!this.lookahead.type.klass.isIdentifierName) {
          throw this.createUnexpected(this.lookahead);
        } else {
          return this.lex().value;
        }
      }
    },
    parseComputedMember: {
      value: function parseComputedMember() {
        this.expect(TokenType.LBRACK);
        var expr = this.parseExpression();
        this.expect(TokenType.RBRACK);
        return expr;
      }
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
      }
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
      }
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
      }
    },
    parseStringLiteral: {
      value: function parseStringLiteral() {
        var startLocation = this.getLocation();
        if (this.strict && this.lookahead.octal) {
          throw this.createErrorWithLocation(this.lookahead, ErrorMessages.STRICT_OCTAL_LITERAL);
        }
        var token2 = this.lex();
        return this.markLocation({ type: "LiteralStringExpression", value: token2._value }, startLocation);
      }
    },
    parseIdentifierName: {
      value: function parseIdentifierName() {
        if (this.lookahead.type.klass.isIdentifierName) {
          return this.lex().value;
        } else {
          throw this.createUnexpected(this.lookahead);
        }
      }
    },
    parseBindingIdentifier: {
      value: function parseBindingIdentifier() {
        var startLocation = this.getLocation();
        return this.markLocation({ type: "BindingIdentifier", name: this.parseIdentifier() }, startLocation);
      }
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
      }
    },
    parseArgumentList: {
      value: function parseArgumentList() {
        this.expect(TokenType.LPAREN);
        var args = this.parseArguments();
        this.expect(TokenType.RPAREN);
        return args;
      }
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
      }
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
      }
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
      }
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
      }
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
      }
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
      }
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
                value: numLiteral.type === "LiteralInfinityExpression" ? "" + 1 / 0 : numLiteral.value
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
      }
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
      }
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
      }
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
      }
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
      }
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
      }
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
      }
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
      }
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
      }
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
      }
    },
    parseParam: {
      value: function parseParam() {
        var originalInParameter = this.inParameter;
        this.inParameter = true;
        var param = this.parseBindingElement();
        this.inParameter = originalInParameter;
        return param;
      }
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
      }
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
      }
    }
  }, {
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
      }
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
      }
    },
    getExpr: {
      value: function getExpr(_ref) {
        var expr = _ref.expr;
        var exprError = _ref.exprError;

        if (!expr) throw exprError;
        return expr;
      }
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
      }
    }
  });

  return Parser;
})(Tokenizer);

// if it is a possible expression
// if it can be an assignment pattern
// if it can be an binding element, it can be part of arrow expression
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9wYXJzZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztxQkFnQnlELFNBQVM7O0lBQTFELGdCQUFnQixVQUFoQixnQkFBZ0I7SUFBRSx3QkFBd0IsVUFBeEIsd0JBQXdCOztJQUUxQyxhQUFhLFdBQU8sVUFBVSxFQUE5QixhQUFhOzt5QkFFNEIsYUFBYTs7SUFBdkQsU0FBUztJQUFJLFVBQVUsY0FBVixVQUFVO0lBQUUsU0FBUyxjQUFULFNBQVM7OztBQUd6QyxJQUFNLHVCQUF1QixHQUFHLG1EQUFtRCxDQUFDOztBQUVwRixJQUFNLHlCQUF5QixHQUFHO0FBQ2hDLGNBQVksRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUk7QUFDMUYsVUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUk7Q0FDM0QsQ0FBQzs7QUFFRixJQUFNLFVBQVUsR0FBRztBQUNqQixVQUFRLEVBQUUsQ0FBQztBQUNYLE9BQUssRUFBRSxDQUFDO0FBQ1IsWUFBVSxFQUFFLENBQUM7QUFDYixhQUFXLEVBQUUsQ0FBQztBQUNkLGVBQWEsRUFBRSxDQUFDO0FBQ2hCLFdBQVMsRUFBRSxDQUFDO0FBQ1osWUFBVSxFQUFFLENBQUM7QUFDYixXQUFTLEVBQUUsQ0FBQztBQUNaLFlBQVUsRUFBRSxDQUFDO0FBQ2IsWUFBVSxFQUFFLENBQUM7QUFDYixVQUFRLEVBQUUsQ0FBQztBQUNYLFlBQVUsRUFBRSxDQUFDO0FBQ2IsY0FBWSxFQUFFLEVBQUU7QUFDaEIsVUFBUSxFQUFFLEVBQUU7QUFDWixnQkFBYyxFQUFFLEVBQUU7QUFDbEIsT0FBSyxFQUFFLEVBQUU7QUFDVCxTQUFPLEVBQUUsRUFBRTtBQUNYLE1BQUksRUFBRSxFQUFFO0FBQ1IsS0FBRyxFQUFFLEVBQUU7QUFDUCxnQkFBYyxFQUFFLEVBQUU7QUFDbEIsUUFBTSxFQUFFLEVBQUU7QUFDVixTQUFPLEVBQUUsRUFBRTtDQUNaLENBQUM7O0FBRUYsSUFBTSxnQkFBZ0IsR0FBRztBQUN2QixNQUFJLEVBQUUsVUFBVSxDQUFDLFNBQVM7QUFDMUIsTUFBSSxFQUFFLFVBQVUsQ0FBQyxVQUFVO0FBQzNCLEtBQUcsRUFBRSxVQUFVLENBQUMsU0FBUztBQUN6QixLQUFHLEVBQUUsVUFBVSxDQUFDLFVBQVU7QUFDMUIsS0FBRyxFQUFFLFVBQVUsQ0FBQyxVQUFVO0FBQzFCLE1BQUksRUFBRSxVQUFVLENBQUMsUUFBUTtBQUN6QixNQUFJLEVBQUUsVUFBVSxDQUFDLFFBQVE7QUFDekIsT0FBSyxFQUFFLFVBQVUsQ0FBQyxRQUFRO0FBQzFCLE9BQUssRUFBRSxVQUFVLENBQUMsUUFBUTtBQUMxQixLQUFHLEVBQUUsVUFBVSxDQUFDLFVBQVU7QUFDMUIsS0FBRyxFQUFFLFVBQVUsQ0FBQyxVQUFVO0FBQzFCLE1BQUksRUFBRSxVQUFVLENBQUMsVUFBVTtBQUMzQixNQUFJLEVBQUUsVUFBVSxDQUFDLFVBQVU7QUFDM0IsTUFBSSxFQUFFLFVBQVUsQ0FBQyxVQUFVO0FBQzNCLGNBQVksRUFBRSxVQUFVLENBQUMsVUFBVTtBQUNuQyxNQUFJLEVBQUUsVUFBVSxDQUFDLFlBQVk7QUFDN0IsTUFBSSxFQUFFLFVBQVUsQ0FBQyxZQUFZO0FBQzdCLE9BQUssRUFBRSxVQUFVLENBQUMsWUFBWTtBQUM5QixLQUFHLEVBQUUsVUFBVSxDQUFDLFFBQVE7QUFDeEIsS0FBRyxFQUFFLFVBQVUsQ0FBQyxRQUFRO0FBQ3hCLEtBQUcsRUFBRSxVQUFVLENBQUMsY0FBYztBQUM5QixLQUFHLEVBQUUsVUFBVSxDQUFDLGNBQWM7QUFDOUIsS0FBRyxFQUFFLFVBQVUsQ0FBQyxjQUFjLEVBQy9CLENBQUM7O0FBRUYsSUFBTSxVQUFVLEdBQUcsRUFBRSxDQUFDOztBQUV0QixTQUFTLFlBQVksQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFO0FBQzlCLE1BQUksS0FBSyxJQUFJLElBQUksRUFBRTtBQUNqQixNQUFFLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7R0FDbkI7QUFDRCxTQUFPLEVBQUUsQ0FBQztDQUNYOzs7Ozs7O0FBT0QsU0FBUyxjQUFjLENBQUMsT0FBTyxFQUFFO0FBQy9CLE1BQUksT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDO0FBQUUsV0FBTyxJQUFJLENBQUM7R0FBQSxBQUNwQyxJQUFJLEdBQUcsR0FBRyxFQUFFLENBQUM7QUFDYixPQUFLLElBQUksTUFBTSxHQUFHLENBQUMsRUFBRSxNQUFNLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsRUFBRTtBQUN0RCxRQUFJLEVBQUUsR0FBRyxHQUFHLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQy9CLFFBQUksR0FBRyxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUMsRUFBRTtBQUMxQixhQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztLQUN4QjtBQUNELE9BQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUM7R0FDaEI7QUFDRCxTQUFPLElBQUksQ0FBQztDQUNiOztBQUVELFNBQVMseUJBQXlCLENBQUMsR0FBRyxFQUFFO0FBQ3RDLFNBQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFBLEVBQUU7V0FBSSx5QkFBeUIsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDO0dBQUEsQ0FBQyxDQUFDO0NBQ3JFOztJQUVZLE1BQU0sV0FBTixNQUFNO0FBQ04sV0FEQSxNQUFNLENBQ0wsTUFBTSxFQUFFOzBCQURULE1BQU07O0FBRWYsK0JBRlMsTUFBTSw2Q0FFVCxNQUFNLEVBQUU7QUFDZCxRQUFJLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDcEMsUUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUM7QUFDZCxRQUFJLENBQUMsR0FBRyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDL0IsUUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7QUFDcEIsUUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7QUFDekIsUUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7QUFDdEIsUUFBSSxDQUFDLGNBQWMsR0FBRyxLQUFLLENBQUM7QUFDNUIsUUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7QUFDdEIsUUFBSSxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUM7QUFDM0IsUUFBSSxDQUFDLGdCQUFnQixHQUFHLEtBQUssQ0FBQztBQUM5QixRQUFJLENBQUMsb0JBQW9CLEdBQUcsS0FBSyxDQUFDO0FBQ2xDLFFBQUksQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDO0FBQ3pCLFFBQUksQ0FBQyxlQUFlLEdBQUcsS0FBSyxDQUFDO0FBQzdCLFFBQUksQ0FBQyxvQkFBb0IsR0FBRyxLQUFLLENBQUM7QUFDbEMsUUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQztBQUNqQyxRQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztBQUNwQixRQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztHQUNyQjs7WUFwQlUsTUFBTTs7ZUFBTixNQUFNO0FBc0JqQixPQUFHO2FBQUEsYUFBQyxTQUFTLEVBQUU7QUFDYixZQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxLQUFLLFNBQVMsRUFBRTtBQUNyQyxpQkFBTyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7U0FDbkI7T0FDRjs7QUFFRCxVQUFNO2FBQUEsZ0JBQUMsU0FBUyxFQUFFO0FBQ2hCLFlBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEtBQUssU0FBUyxFQUFFO0FBQ3JDLGlCQUFPLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztTQUNuQjtBQUNELGNBQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztPQUM3Qzs7QUFFRCwwQkFBc0I7YUFBQSxnQ0FBQyxPQUFPLEVBQUU7QUFDOUIsZUFBTyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksS0FBSyxTQUFTLENBQUMsVUFBVSxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxLQUFLLE9BQU8sQ0FBQztPQUN6Rjs7QUFFRCwyQkFBdUI7YUFBQSxpQ0FBQyxPQUFPLEVBQUU7QUFDL0IsWUFBSSxJQUFJLENBQUMsc0JBQXNCLENBQUMsT0FBTyxDQUFDLEVBQUU7QUFDeEMsaUJBQU8sSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1NBQ25CLE1BQU07QUFDTCxnQkFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQzdDO09BQ0Y7O0FBRUQsd0JBQW9CO2FBQUEsOEJBQUMsT0FBTyxFQUFFO0FBQzVCLFlBQUksSUFBSSxDQUFDLHNCQUFzQixDQUFDLE9BQU8sQ0FBQyxFQUFFO0FBQ3hDLGlCQUFPLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztTQUNuQjtPQUNGOztBQUVELFNBQUs7YUFBQSxlQUFDLE9BQU8sRUFBRTtBQUNiLGVBQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEtBQUssT0FBTyxDQUFDO09BQ3hDOztBQUVELG9CQUFnQjthQUFBLDRCQUFHO0FBQ2pCLFlBQUksSUFBSSxDQUFDLDJCQUEyQixFQUFFO0FBQ3BDLGlCQUFPO1NBQ1I7O0FBRUQsWUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsRUFBRTtBQUNqQyxpQkFBTztTQUNSOztBQUVELFlBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUNoRCxnQkFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQzdDO09BQ0Y7O0FBR0QsZ0JBQVk7Ozs7YUFBQSxzQkFBQyxJQUFJLEVBQUUsYUFBYSxFQUFFO0FBQ2hDLGVBQU8sSUFBSSxDQUFDO09BQ2I7O0FBRUQsV0FBTzthQUFBLGlCQUFDLENBQUMsRUFBRSxJQUFJLEVBQUU7QUFDZixZQUFJLFdBQVcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDO0FBQzNCLFlBQUksQ0FBQyxHQUFHLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUMvQixZQUFJLE1BQU0sR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzFCLFlBQUksSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7O0FBRTFCLGFBQUssSUFBSSxHQUFHLElBQUksSUFBSSxDQUFDLEdBQUcsRUFBRTtBQUN4QixxQkFBVyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDbEM7QUFDRCxZQUFJLENBQUMsR0FBRyxHQUFHLFdBQVcsQ0FBQztBQUN2QixlQUFPLE1BQU0sQ0FBQztPQUNmOztBQUVELG1CQUFlO2FBQUEsMkJBQUc7OztBQUNoQixZQUFJLFNBQVMsR0FBRyxjQUFjLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3pDLFlBQUksU0FBUyxLQUFLLElBQUksRUFBRTtBQUN0QixnQkFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxpQkFBaUIsRUFBRSxTQUFTLENBQUMsQ0FBQztTQUNwRTtBQUNELFlBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLFVBQUEsSUFBSSxFQUFJO0FBQ3ZCLGNBQUksQ0FBQSxHQUFFLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxNQUFLLEdBQUcsRUFBRSxHQUFHLEdBQUcsSUFBSSxDQUFDLEVBQUU7QUFDaEQsa0JBQU0sTUFBSyxXQUFXLENBQUMsYUFBYSxDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxDQUFDO1dBQy9EO1NBQ0YsQ0FBQyxDQUFDO09BQ0o7O0FBRUQsZUFBVzthQUFBLHVCQUFHO0FBQ1osWUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7QUFDbkIsWUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7O0FBRW5CLFlBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ2hDLFlBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUNsQyxZQUFJLGFBQWEsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3hDLFlBQUksZ0JBQWdCLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUMzQyxZQUFJLEtBQUssR0FBRyxFQUFFLENBQUM7QUFDZixlQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFO0FBQ2xCLGVBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxhQUFhLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1NBQ25FO0FBQ0QsYUFBSyxJQUFJLEdBQUcsSUFBSSxnQkFBZ0IsRUFBRTtBQUNoQyxjQUFJLENBQUMsQ0FBQSxHQUFFLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRTtBQUNuRixrQkFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyx1QkFBdUIsRUFBRSxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7V0FDN0U7U0FDRjtBQUNELFlBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztBQUN2QixlQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQztPQUN0RTs7QUFFRCxlQUFXO2FBQUEsdUJBQUc7QUFDWixZQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQzs7QUFFaEMsWUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ2xDLFlBQUksV0FBVyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7QUFDM0IsWUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUM7O3lCQUVELElBQUksQ0FBQyxTQUFTLEVBQUU7Ozs7WUFBeEIsSUFBSTs7QUFDVCxZQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUU7QUFDOUIsZ0JBQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUM3QztBQUNELFlBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztBQUN2QixZQUFJLENBQUMsR0FBRyxHQUFHLFdBQVcsQ0FBQztBQUN2QixlQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBSixJQUFJLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQztPQUM5RDs7QUFFRCxxQkFBaUI7YUFBQSwyQkFBQyxXQUFXLEVBQUU7OztBQUM3QixZQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7O0FBRXZDLFlBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7QUFDdEIsWUFBSSxDQUFDLEdBQUcsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDOztBQUUvQixZQUFJLFdBQVcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDO0FBQzNCLFlBQUksQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDOztBQUVkLG1CQUFXLENBQUMsT0FBTyxDQUFDLFVBQUEsSUFBSTtpQkFBSSxNQUFLLEdBQUcsQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsSUFBSTtTQUFBLENBQUMsQ0FBQzs7QUFFekQsWUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztBQUNoQyxZQUFJLGNBQWMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDO0FBQ3RDLFlBQUksV0FBVyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7QUFDaEMsWUFBSSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDO0FBQzVDLFlBQUksY0FBYyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7QUFDakMsWUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQzs7QUFFNUIsWUFBSSxDQUFDLFFBQVEsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3BDLFlBQUksQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDO0FBQ3pCLFlBQUksQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDO0FBQ3RCLFlBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDO0FBQzNCLFlBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDOztBQUVwQixZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQzs7eUJBQ1AsSUFBSSxDQUFDLFNBQVMsRUFBRTs7OztZQUFsQyxJQUFJO1lBQUUsUUFBUTs7QUFDbkIsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7O0FBRTlCLFlBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQzs7QUFFdkIsWUFBSSxDQUFDLEdBQUcsR0FBRyxNQUFNLENBQUM7QUFDbEIsWUFBSSxDQUFDLEdBQUcsR0FBRyxXQUFXLENBQUM7O0FBRXZCLFlBQUksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxhQUFhLENBQUMsQ0FBQzs7QUFFOUMsWUFBSSxDQUFDLFFBQVEsR0FBRyxXQUFXLENBQUM7QUFDNUIsWUFBSSxDQUFDLFdBQVcsR0FBRyxjQUFjLENBQUM7QUFDbEMsWUFBSSxDQUFDLFFBQVEsR0FBRyxXQUFXLENBQUM7QUFDNUIsWUFBSSxDQUFDLGNBQWMsR0FBRyxpQkFBaUIsQ0FBQztBQUN4QyxZQUFJLENBQUMsTUFBTSxHQUFHLGNBQWMsQ0FBQztBQUM3QixZQUFJLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQztBQUN4QixlQUFPLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO09BQ3pCOztBQUVELGFBQVM7YUFBQSxxQkFBRzs7O0FBQ1YsWUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ2xDLFlBQUksVUFBVSxHQUFHLEVBQUUsQ0FBQztBQUNwQixZQUFJLFVBQVUsR0FBRyxFQUFFLENBQUM7QUFDcEIsWUFBSSxpQkFBaUIsR0FBRyxJQUFJLENBQUM7QUFDN0IsWUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztBQUMzQixZQUFJLGVBQWUsR0FBRyxJQUFJLENBQUM7QUFDM0IsWUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFNO0FBQ2pCLGlCQUFPLElBQUksRUFBRTtBQUNYLGdCQUFJLE1BQUssR0FBRyxFQUFFLElBQUksTUFBSyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQzlDLG9CQUFNO2FBQ1A7QUFDRCxnQkFBSSxLQUFLLEdBQUcsTUFBSyxTQUFTLENBQUM7QUFDM0IsZ0JBQUksSUFBSSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDO0FBQzVCLGdCQUFJLGVBQWUsR0FBRyxLQUFLLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFDdEQsZ0JBQUksaUJBQWlCLEdBQUcsTUFBSyxXQUFXLEVBQUUsQ0FBQztBQUMzQyxnQkFBSSxJQUFJLEdBQUcsTUFBSyxzQkFBc0IsQ0FBQyxFQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO0FBQzNELGdCQUFJLGlCQUFpQixFQUFFO0FBQ3JCLGtCQUFJLGVBQWUsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLHFCQUFxQixJQUN4RCxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksS0FBSyx5QkFBeUIsRUFBRTtBQUNwRCxvQkFBSSxJQUFJLEtBQUssZ0JBQWdCLElBQUksSUFBSSxLQUFLLGNBQWMsRUFBRTtBQUN4RCwwQkFBUSxHQUFHLElBQUksQ0FBQztBQUNoQix3QkFBSyxNQUFNLEdBQUcsSUFBSSxDQUFDO0FBQ25CLHNCQUFJLGVBQWUsSUFBSSxJQUFJLEVBQUU7QUFDM0IsMEJBQU0sTUFBSyx1QkFBdUIsQ0FBQyxlQUFlLEVBQUUsYUFBYSxDQUFDLG9CQUFvQixDQUFDLENBQUM7bUJBQ3pGO2lCQUNGLE1BQU0sSUFBSSxlQUFlLElBQUksSUFBSSxJQUFJLEtBQUssQ0FBQyxLQUFLLEVBQUU7QUFDakQsaUNBQWUsR0FBRyxLQUFLLENBQUM7aUJBQ3pCO0FBQ0QsMEJBQVUsQ0FBQyxJQUFJLENBQUMsTUFBSyxZQUFZLENBQUMsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFDLEVBQUUsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO2VBQ3pHLE1BQU07QUFDTCxpQ0FBaUIsR0FBRyxLQUFLLENBQUM7QUFDMUIsMEJBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7ZUFDdkI7YUFDRixNQUFNO0FBQ0wsd0JBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDdkI7V0FDRjtTQUNGLEVBQUUsWUFBTSxFQUVSLENBQUMsQ0FBQztBQUNILGVBQU8sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxVQUFVLEVBQVYsVUFBVSxFQUFFLFVBQVUsRUFBVixVQUFVLEVBQUUsRUFBRSxRQUFRLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztPQUNsRzs7QUFFRCx3QkFBb0I7YUFBQSw4QkFBQyxVQUFVLEVBQUU7QUFDL0IsWUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUFFLElBQUksWUFBQSxDQUFDO0FBQzdDLFlBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDLFVBQVUsRUFBRTtBQUNoRCxjQUFJLEdBQUcsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO0FBQzlCLGNBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDcEMsZ0JBQUksQ0FBQSxHQUFFLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsR0FBRyxHQUFHLElBQUksQ0FBQyxFQUFFO0FBQ2xELG9CQUFNLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDLFdBQVcsQ0FBQyxDQUFDO2FBQzlFO0FBQ0Qsc0JBQVUsQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDO0FBQzlCLG1CQUFPLElBQUksQ0FBQyxZQUFZLENBQ3RCO0FBQ0Usa0JBQUksRUFBRSxpQkFBaUI7QUFDdkIsa0JBQUksRUFBRSxJQUFJO0FBQ1YscUJBQU8sRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsSUFBSSxFQUFFLG1CQUFtQixFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsRUFBRSxhQUFhLENBQUM7YUFDckYsRUFBRSxhQUFhLENBQUMsQ0FBQztXQUNyQjtTQUNGLE1BQU0sSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLEVBQUU7QUFDckQsY0FBSSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO0FBQ2xDLGNBQUksQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUNwQzs7QUFFRCxZQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDbEMsWUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO0FBQ3ZDLFlBQUksQ0FBQSxHQUFFLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsR0FBRyxHQUFHLFNBQVMsQ0FBQyxFQUFFO0FBQ3ZELGdCQUFNLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxRQUFRLEVBQUUsYUFBYSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1NBQ3pFO0FBQ0Qsa0JBQVUsQ0FBQyxHQUFHLEdBQUcsU0FBUyxDQUFDLEdBQUcsSUFBSSxDQUFDO0FBQ25DLGVBQU8sSUFBSSxDQUFDLFlBQVksQ0FDdEI7QUFDRSxjQUFJLEVBQUUsaUJBQWlCO0FBQ3ZCLGNBQUksRUFBSixJQUFJO0FBQ0osaUJBQU8sRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsSUFBSSxFQUFFLG1CQUFtQixFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsRUFBRSxRQUFRLENBQUMsRUFDckYsRUFBRSxhQUFhLENBQUMsQ0FBQztPQUNyQjs7QUFFRCx5QkFBcUI7YUFBQSwrQkFBQyxVQUFVLEVBQUU7QUFDaEMsWUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ3ZDLFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzNCLFlBQUksQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNuQyxZQUFJLGtCQUFrQixHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUM1QyxZQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7QUFDeEMsWUFBSSxDQUFBLEdBQUUsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxHQUFHLEdBQUcsVUFBVSxDQUFDLEVBQUU7QUFDeEQsZ0JBQU0sSUFBSSxDQUFDLHVCQUF1QixDQUFDLGtCQUFrQixFQUFFLGFBQWEsQ0FBQyxXQUFXLENBQUMsQ0FBQztTQUNuRjtBQUNELGtCQUFVLENBQUMsR0FBRyxHQUFHLFVBQVUsQ0FBQyxHQUFHLElBQUksQ0FBQztBQUNwQyxlQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxJQUFJLEVBQUUsbUJBQW1CLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxFQUFFLGFBQWEsQ0FBQyxDQUFDO09BQzFGOztBQUVELHFCQUFpQjthQUFBLDJCQUFDLFVBQVUsRUFBRTtBQUM1QixZQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7QUFDaEIsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUIsZUFBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQ2xDLGdCQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0FBQ25ELGNBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUM5QixnQkFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUIsa0JBQU07V0FDUDtTQUNGO0FBQ0QsZUFBTyxNQUFNLENBQUM7T0FDZjs7QUFFRCxtQkFBZTthQUFBLDJCQUFHO0FBQ2hCLFlBQUksQ0FBQyx1QkFBdUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNyQyxZQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLENBQUM7QUFDakQsWUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7QUFDeEIsZUFBTyxLQUFLLENBQUM7T0FDZDs7QUFFRCwwQkFBc0I7YUFBQSxrQ0FBRztBQUN2QixZQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFO1lBQUUsY0FBYyxHQUFHLElBQUk7WUFBRSxlQUFlLFlBQUE7WUFBRSxVQUFVLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNqSCxZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM5QixnQkFBUSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUk7QUFDekIsZUFBSyxTQUFTLENBQUMsTUFBTTtBQUNuQiwyQkFBZSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUM7QUFDcEMsZ0JBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0FBQ3hCLG1CQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLEVBQUUsRUFBRSxlQUFlLEVBQWYsZUFBZSxFQUFFLEVBQUUsYUFBYSxDQUFDLENBQUM7QUFBQSxBQUN2SCxlQUFLLFNBQVMsQ0FBQyxVQUFVO0FBQ3ZCLDBCQUFjLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsS0FBSyxDQUFDO0FBQ3pELHNCQUFVLENBQUMsR0FBRyxHQUFHLGNBQWMsQ0FBQyxHQUFHLElBQUksQ0FBQztBQUN4QyxnQkFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFO0FBQzlCLHFCQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLGNBQWMsRUFBZCxjQUFjLEVBQUUsWUFBWSxFQUFFLEVBQUUsRUFBRSxlQUFlLEVBQUUsSUFBSSxDQUFDLGVBQWUsRUFBRSxFQUFFLEVBQUUsYUFBYSxDQUFDLENBQUM7YUFDeEk7QUFDRCxrQkFBTTtBQUFBLFNBQ1Q7QUFDRCxZQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFO0FBQzdCLGlCQUFPLElBQUksQ0FBQyxZQUFZLENBQUM7QUFDdkIsZ0JBQUksRUFBRSxpQkFBaUI7QUFDdkIsMEJBQWMsRUFBZCxjQUFjO0FBQ2QsNEJBQWdCLEVBQUUsSUFBSSxDQUFDLHFCQUFxQixDQUFDLFVBQVUsQ0FBQztBQUN4RCwyQkFBZSxFQUFFLElBQUksQ0FBQyxlQUFlLEVBQUUsRUFBRSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1NBQzdELE1BQU0sSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUN2QyxpQkFBTyxJQUFJLENBQUMsWUFBWSxDQUFDO0FBQ3ZCLGdCQUFJLEVBQUUsUUFBUTtBQUNkLDBCQUFjLEVBQWQsY0FBYztBQUNkLHdCQUFZLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFVBQVUsQ0FBQztBQUNoRCwyQkFBZSxFQUFFLElBQUksQ0FBQyxlQUFlLEVBQUUsRUFBRSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1NBQzdELE1BQU07QUFDTCxnQkFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQzdDO09BQ0Y7O0FBRUQsd0JBQW9CO2FBQUEsOEJBQUMsYUFBYSxFQUFFLGdCQUFnQixFQUFFO0FBQ3BELFlBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUN2QyxZQUFJLElBQUksR0FBRyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7QUFDbEMsd0JBQWdCLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQztBQUNwQyxZQUFJLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUNuQyxjQUFJLFlBQVksR0FBRyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztBQUM5QyxjQUFJLENBQUEsR0FBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLEdBQUcsR0FBRyxZQUFZLENBQUMsRUFBRTtBQUM3RCxrQkFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyx1QkFBdUIsRUFBRSxZQUFZLENBQUMsQ0FBQztXQUM3RTtBQUNELHVCQUFhLENBQUMsR0FBRyxHQUFHLFlBQVksQ0FBQyxHQUFHLElBQUksQ0FBQztBQUN6QyxpQkFBTyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsSUFBSSxFQUFFLGlCQUFpQixFQUFFLElBQUksRUFBSixJQUFJLEVBQUUsWUFBWSxFQUFaLFlBQVksRUFBRSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1NBQzFGLE1BQU07QUFDTCxjQUFJLENBQUEsR0FBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLEdBQUcsR0FBRyxJQUFJLENBQUMsRUFBRTtBQUNyRCxrQkFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyx1QkFBdUIsRUFBRSxJQUFJLENBQUMsQ0FBQztXQUNyRTtBQUNELHVCQUFhLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQztTQUNsQztBQUNELGVBQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLElBQUksRUFBRSxpQkFBaUIsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsRUFBRSxhQUFhLENBQUMsQ0FBQztPQUN0Rzs7QUFFRCxxQkFBaUI7YUFBQSwyQkFBQyxhQUFhLEVBQUUsZ0JBQWdCLEVBQUU7QUFDakQsWUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO0FBQ2hCLFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlCLGVBQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUNsQyxnQkFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsYUFBYSxFQUFFLGdCQUFnQixDQUFDLENBQUMsQ0FBQztBQUN4RSxjQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDOUIsZ0JBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlCLGtCQUFNO1dBQ1A7U0FDRjtBQUNELGVBQU8sTUFBTSxDQUFDO09BQ2Y7O0FBRUQsMEJBQXNCO2FBQUEsZ0NBQUMsYUFBYSxFQUFFLGdCQUFnQixFQUFFOzs7QUFDdEQsWUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUFFLElBQUksWUFBQSxDQUFDO0FBQzdDLFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlCLFlBQUksS0FBSyxHQUFHLEtBQUs7WUFBRSxHQUFHLFlBQUE7WUFBRSxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUc7WUFBRSxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztBQUM3RCxZQUFJLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQztBQUNkLFlBQUksQ0FBQyxHQUFHLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUMvQixnQkFBUSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUk7QUFDekIsZUFBSyxTQUFTLENBQUMsR0FBRztBQUNoQixnQkFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDOztBQUVYLGdCQUFJLEdBQUcsRUFBRSxJQUFJLEVBQUUsZUFBZSxFQUFFLGVBQWUsRUFBRSxJQUFJLENBQUMsZUFBZSxFQUFFLEVBQUUsQ0FBQztBQUMxRSxrQkFBTTtBQUFBLEFBQ1IsZUFBSyxTQUFTLENBQUMsTUFBTTs7O0FBR25CLGdCQUFJLFlBQVksR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsYUFBYSxFQUFFLGdCQUFnQixDQUFDLENBQUM7QUFDM0UsZ0JBQUksZUFBZSxHQUFHLElBQUksQ0FBQztBQUMzQixnQkFBSSxJQUFJLENBQUMsc0JBQXNCLENBQUMsTUFBTSxDQUFDLEVBQUU7QUFDdkMsNkJBQWUsR0FBRyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7YUFDMUM7QUFDRCxnQkFBSSxHQUFHLEVBQUUsSUFBSSxFQUFFLFlBQVksRUFBRSxZQUFZLEVBQVosWUFBWSxFQUFFLGVBQWUsRUFBZixlQUFlLEVBQUUsQ0FBQztBQUM3RCxrQkFBTTtBQUFBLEFBQ1IsZUFBSyxTQUFTLENBQUMsS0FBSzs7QUFFbEIsZ0JBQUksR0FBRyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBQyxNQUFNLEVBQUUsS0FBSyxFQUFDLENBQUMsRUFBRSxDQUFDO0FBQ3pFLGdCQUFJLENBQUEsR0FBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLEdBQUcsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUMzRSxvQkFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyx1QkFBdUIsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUMzRjtBQUNELGVBQUcsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7QUFDakMseUJBQWEsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDO0FBQ2hDLDRCQUFnQixDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUM7QUFDbkMsa0JBQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDakIsa0JBQU07QUFBQSxBQUNSLGVBQUssU0FBUyxDQUFDLFFBQVE7O0FBRXJCLGdCQUFJLEdBQUcsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFDLENBQUMsRUFBRSxDQUFDO0FBQzlGLGdCQUFJLENBQUEsR0FBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLEdBQUcsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUMzRSxvQkFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyx1QkFBdUIsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUMzRjtBQUNELGVBQUcsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7QUFDakMseUJBQWEsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDO0FBQ2hDLDRCQUFnQixDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUM7QUFDbkMsa0JBQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDakIsa0JBQU07QUFBQSxBQUNSLGVBQUssU0FBUyxDQUFDLE9BQU87QUFDcEIsZ0JBQUksQ0FBQSxHQUFFLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsVUFBVSxDQUFDLEVBQUU7QUFDckQsb0JBQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsdUJBQXVCLEVBQUUsU0FBUyxDQUFDLENBQUM7YUFDMUU7QUFDRCx5QkFBYSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7QUFDOUIsZ0JBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUNYLG9CQUFRLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSTtBQUN6QixtQkFBSyxTQUFTLENBQUMsUUFBUTs7QUFFckIsb0JBQUksR0FBRztBQUNMLHNCQUFJLEVBQUUsZUFBZTtBQUNyQixzQkFBSSxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxDQUFDO2lCQUMvRSxDQUFDO0FBQ0YsbUJBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7QUFDMUIsb0JBQUksR0FBRyxLQUFLLFdBQVcsRUFBRTtBQUN2QixrQ0FBZ0IsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDO0FBQ25DLHdCQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2lCQUNsQjtBQUNELHNCQUFNO0FBQUEsQUFDUixtQkFBSyxTQUFTLENBQUMsS0FBSzs7QUFFbEIsb0JBQUksR0FBRyxFQUFFLElBQUksRUFBRSxlQUFlLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUM7QUFDNUYsbUJBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7QUFDMUIsb0JBQUksR0FBRyxLQUFLLFdBQVcsRUFBRTtBQUN2QixrQ0FBZ0IsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDO0FBQ25DLHdCQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2lCQUNsQjtBQUNELHNCQUFNO0FBQUEsQUFDUjtBQUNBOztBQUVFLHNCQUFJLEdBQUcsRUFBRSxJQUFJLEVBQUUsZUFBZSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMseUJBQXlCLEVBQUUsRUFBRSxDQUFDO0FBQ3pFLHdCQUFNO2lCQUNQO0FBQUEsYUFDRjtBQUNELGtCQUFNO0FBQUEsQUFDUixlQUFLLFNBQVMsQ0FBQyxHQUFHO0FBQ2hCLGlCQUFLLEdBQUcsSUFBSSxDQUFDO0FBQUE7QUFFZixlQUFLLFNBQVMsQ0FBQyxHQUFHLENBQUM7QUFDbkIsZUFBSyxTQUFTLENBQUMsS0FBSzs7QUFFcEI7QUFDRSxrQkFBSSxVQUFVLEdBQUcsRUFBRSxDQUFDO0FBQ3BCLGtCQUFJLEdBQUcsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsd0JBQXdCLENBQUMsRUFBQyxVQUFVLEVBQVYsVUFBVSxFQUFDLENBQUMsRUFBRSxDQUFDO0FBQ3BGLHdCQUFVLENBQUMsT0FBTyxDQUFDLFVBQUEsSUFBSSxFQUFJO0FBQ3ZCLG9CQUFJLENBQUEsR0FBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLEdBQUcsR0FBRyxJQUFJLENBQUMsRUFBRTtBQUNyRCx3QkFBTSxNQUFLLFdBQVcsQ0FBQyxhQUFhLENBQUMsdUJBQXVCLEVBQUUsSUFBSSxDQUFDLENBQUM7aUJBQ3JFO0FBQ0QsNkJBQWEsQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDO0FBQ2pDLGdDQUFnQixDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUM7ZUFDckMsQ0FDRixDQUFDO0FBQ0Ysa0JBQUksS0FBSyxFQUFFO0FBQ1QsMEJBQVUsQ0FBQyxPQUFPLENBQUMsVUFBQSxJQUFJO3lCQUFJLE1BQU0sQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsSUFBSTtpQkFBQSxDQUFDLENBQUM7ZUFDdkQsTUFBTTtBQUNMLGtCQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7ZUFDbkM7QUFDRCxrQkFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7YUFDekI7QUFDQyxrQkFBTTtBQUFBLEFBQ1I7QUFDRSxrQkFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQUEsU0FDL0M7QUFDRCxZQUFJLENBQUMsR0FBRyxHQUFHLE1BQU0sQ0FBQztBQUNsQixZQUFJLENBQUMsR0FBRyxHQUFHLE1BQU0sQ0FBQztBQUNsQixlQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLGFBQWEsQ0FBQyxDQUFDO09BQy9DOztBQUVELG1CQUFlO2FBQUEseUJBQUMsYUFBYSxFQUFFLGdCQUFnQixFQUFFO0FBQy9DLGdCQUFRLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSTtBQUN6QixlQUFLLFNBQVMsQ0FBQyxNQUFNO0FBQ25CLG1CQUFPLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO0FBQUEsQUFDdkMsZUFBSyxTQUFTLENBQUMsTUFBTTtBQUNuQixtQkFBTyxJQUFJLENBQUMsc0JBQXNCLENBQUMsYUFBYSxFQUFFLGdCQUFnQixDQUFDLENBQUM7QUFBQSxBQUN0RTtBQUNFLG1CQUFPLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO0FBQUEsU0FDeEM7T0FDRjs7QUFFRCwrQkFBMkI7YUFBQSx1Q0FBRztBQUM1QixZQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFO0FBQzVELGlCQUFPLElBQUksQ0FBQztTQUNiO0FBQ0QsWUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssS0FBSyxLQUFLLEVBQUU7QUFDdEUsY0FBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQ3ZDLGNBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUNYLGNBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLElBQ2pFLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQzlELGdCQUFJLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDbkMsbUJBQU8sSUFBSSxDQUFDO1dBQ2IsTUFBTTtBQUNMLGdCQUFJLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLENBQUM7V0FDcEM7U0FDRjtBQUNELGVBQU8sS0FBSyxDQUFDO09BQ2Q7O0FBRUQsMEJBQXNCO2FBQUEsa0NBQTRCOzs7Z0RBQUosRUFBRTs7bUNBQXhCLFVBQVU7WUFBVixVQUFVLG1DQUFHLEtBQUs7O0FBQ3hDLFlBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUN2QyxZQUFJLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRTtBQUNkLGdCQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDN0M7O0FBRUQsWUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFNO0FBQzVCLGtCQUFRLE1BQUssU0FBUyxDQUFDLElBQUk7QUFDekIsaUJBQUssU0FBUyxDQUFDLFFBQVE7QUFDckIscUJBQU8sTUFBSyxhQUFhLENBQUMsRUFBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBVixVQUFVLEVBQUMsQ0FBQyxDQUFDO0FBQUEsQUFDekQsaUJBQUssU0FBUyxDQUFDLEtBQUs7QUFDbEIscUJBQU8sTUFBSyxVQUFVLENBQUMsRUFBQyxNQUFNLEVBQUUsS0FBSyxFQUFDLENBQUMsQ0FBQztBQUFBLEFBQzFDO0FBQ0Usa0JBQUksTUFBSywyQkFBMkIsRUFBRSxFQUFFO0FBQ3RDLHVCQUFPLE1BQUssaUNBQWlDLEVBQUUsQ0FBQztlQUNqRDtBQUNELHFCQUFPLE1BQUssY0FBYyxDQUFDLEVBQUMsb0JBQW9CLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBVixVQUFVLEVBQUMsQ0FBQyxDQUFDO0FBQUEsV0FDeEU7U0FDRixFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztBQUN6QixlQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLGFBQWEsQ0FBQyxDQUFDO09BQy9DOztBQUVELGtCQUFjO2FBQUEsMEJBQTBEOzs7Z0RBQUosRUFBRTs7NkNBQXRELG9CQUFvQjtZQUFwQixvQkFBb0IsNkNBQUcsS0FBSzttQ0FBRSxVQUFVO1lBQVYsVUFBVSxtQ0FBRyxLQUFLOztBQUM5RCxZQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDdkMsWUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztBQUMzQixZQUFJLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQztBQUNkLFlBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7aUJBQU0sTUFBSyxvQkFBb0IsQ0FBQyxvQkFBb0IsRUFBRSxXQUFXLEVBQUUsVUFBVSxDQUFDO1NBQUEsQ0FBQyxDQUFDO0FBQ3hHLFlBQUksQ0FBQyxHQUFHLEdBQUcsV0FBVyxDQUFDO0FBQ3ZCLGVBQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsYUFBYSxDQUFDLENBQUM7T0FDL0M7O0FBRUQsd0JBQW9CO2FBQUEsOEJBQUMsb0JBQW9CLEVBQUUsV0FBVyxFQUFFLFVBQVUsRUFBRTtBQUNsRSxZQUFJLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRTtBQUNkLGdCQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDN0M7O0FBRUQsZ0JBQVEsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJO0FBQ3pCLGVBQUssU0FBUyxDQUFDLFNBQVM7QUFDdEIsbUJBQU8sSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7QUFBQSxBQUNwQyxlQUFLLFNBQVMsQ0FBQyxNQUFNO0FBQ25CLG1CQUFPLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO0FBQUEsQUFDcEMsZUFBSyxTQUFTLENBQUMsTUFBTTtBQUNuQixtQkFBTyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztBQUFBLEFBQ3pDLGVBQUssU0FBUyxDQUFDLEtBQUs7QUFDbEIsbUJBQU8sSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7QUFBQSxBQUNwQyxlQUFLLFNBQVMsQ0FBQyxRQUFRO0FBQ3JCLG1CQUFPLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO0FBQUEsQUFDdkMsZUFBSyxTQUFTLENBQUMsUUFBUTtBQUNyQixtQkFBTyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztBQUFBLEFBQ3ZDLGVBQUssU0FBUyxDQUFDLEVBQUU7QUFDZixtQkFBTyxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztBQUFBLEFBQ3RDLGVBQUssU0FBUyxDQUFDLEdBQUc7QUFDaEIsbUJBQU8sSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7QUFBQSxBQUNsQyxlQUFLLFNBQVMsQ0FBQyxFQUFFO0FBQ2YsbUJBQU8sSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7QUFBQSxBQUNqQyxlQUFLLFNBQVMsQ0FBQyxNQUFNO0FBQ25CLG1CQUFPLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO0FBQUEsQUFDckMsZUFBSyxTQUFTLENBQUMsTUFBTTtBQUNuQixtQkFBTyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztBQUFBLEFBQ3JDLGVBQUssU0FBUyxDQUFDLEtBQUs7QUFDbEIsbUJBQU8sSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7QUFBQSxBQUNwQyxlQUFLLFNBQVMsQ0FBQyxHQUFHO0FBQ2hCLG1CQUFPLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO0FBQUEsQUFDbEMsZUFBSyxTQUFTLENBQUMsR0FBRztBQUNoQixtQkFBTyxJQUFJLENBQUMsaUNBQWlDLEVBQUUsQ0FBQztBQUFBLEFBQ2xELGVBQUssU0FBUyxDQUFDLEtBQUs7QUFDbEIsbUJBQU8sSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7QUFBQSxBQUNwQyxlQUFLLFNBQVMsQ0FBQyxJQUFJO0FBQ2pCLG1CQUFPLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO0FBQUEsQUFDbkMsZUFBSyxTQUFTLENBQUMsUUFBUSxDQUFDO0FBQ3hCLGVBQUssU0FBUyxDQUFDLEtBQUs7QUFDbEIsa0JBQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQzs7QUFBQSxBQUU5QztBQUFTO0FBQ1Asa0JBQUksSUFBSSxDQUFDLDJCQUEyQixFQUFFLEVBQUU7QUFDdEMsc0JBQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztlQUM3QztBQUNELGtCQUFJLElBQUksR0FBRyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7O0FBRWxDLGtCQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssc0JBQXNCLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDckUsb0JBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO0FBQzFCLG9CQUFJLENBQUEsR0FBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsRUFBRTtBQUM5Qyx3QkFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxtQkFBbUIsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7aUJBQ3RFO0FBQ0Qsb0JBQUksQ0FBQyxHQUFHLEdBQUcsV0FBVyxDQUFDO0FBQ3ZCLG9CQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQztBQUMxQixvQkFBSSxXQUFXLFlBQUEsQ0FBQztBQUNoQixvQkFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsRUFBRTtBQUNsQyxzQkFBSSxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsb0JBQW9CLEVBQUU7QUFDeEMsMEJBQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQzttQkFDN0M7QUFDRCw2QkFBVyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLGNBQWMsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFWLFVBQVUsRUFBQyxDQUFDLENBQUM7aUJBQ3RGLE1BQU07QUFDTCw2QkFBVyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsRUFBQyxvQkFBb0IsRUFBcEIsb0JBQW9CLEVBQUUsVUFBVSxFQUFWLFVBQVUsRUFBQyxDQUFDLENBQUM7aUJBQ3ZFO0FBQ0QsdUJBQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUMxQix1QkFBTyxFQUFFLElBQUksRUFBRSxrQkFBa0IsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLENBQUM7ZUFDMUUsTUFBTTtBQUNMLG9CQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztBQUN4Qix1QkFBTyxFQUFFLElBQUksRUFBRSxxQkFBcUIsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLENBQUM7ZUFDMUQ7YUFDRjtBQUFBLFNBQ0Y7T0FDRjs7QUFFRCx1QkFBbUI7YUFBQSwrQkFBRztBQUNwQixZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNqQyxlQUFPLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixFQUFFLENBQUM7T0FDbkM7O0FBRUQsdUJBQW1CO2FBQUEsK0JBQUc7QUFDcEIsWUFBSSxJQUFJLEdBQUcsRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDO0FBQ2hFLFlBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztBQUN2QixlQUFPLElBQUksQ0FBQztPQUNiOztBQUVELDRCQUF3QjthQUFBLG9DQUFHO0FBQ3pCLFlBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztBQUNsQyxZQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztBQUN4QixlQUFPLEVBQUUsSUFBSSxFQUFFLHFCQUFxQixFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsQ0FBQztPQUMxRDs7QUFFRCx1QkFBbUI7YUFBQSwrQkFBRztBQUNwQixZQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO0FBQzNCLFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDOzs7QUFHN0IsWUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsRUFBRTtBQUNqQyxjQUFJLEVBQUUsSUFBSSxDQUFDLFdBQVcsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFBLEFBQUMsRUFBRTtBQUN4QyxrQkFBTSxJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxhQUFhLENBQUMsQ0FBQztXQUN4RTs7QUFFRCxpQkFBTyxFQUFFLElBQUksRUFBRSxnQkFBZ0IsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUM7U0FDaEQ7O0FBRUQsWUFBSSxJQUFJLENBQUMsMkJBQTJCLEVBQUU7QUFDcEMsY0FBSSxFQUFFLElBQUksQ0FBQyxXQUFXLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQSxBQUFDLEVBQUU7QUFDeEMsa0JBQU0sSUFBSSxDQUFDLHVCQUF1QixDQUFDLEtBQUssRUFBRSxhQUFhLENBQUMsYUFBYSxDQUFDLENBQUM7V0FDeEU7O0FBRUQsaUJBQU8sRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDO1NBQ2hEOztBQUVELFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQztBQUNqQixZQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQyxVQUFVLEVBQUU7QUFDaEQsZUFBSyxHQUFHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQzs7QUFFL0IsY0FBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLEtBQUssQ0FBQztBQUN0QixjQUFJLENBQUMsQ0FBQSxHQUFFLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxFQUFFO0FBQy9DLGtCQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLGFBQWEsRUFBRSxLQUFLLENBQUMsQ0FBQztXQUM1RDtTQUNGOztBQUVELFlBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDOztBQUV4QixZQUFJLEtBQUssSUFBSSxJQUFJLElBQUksRUFBRSxJQUFJLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUEsQUFBQyxFQUFFO0FBQ3pELGdCQUFNLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1NBQ3hFOztBQUVELGVBQU8sRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsS0FBSyxFQUFMLEtBQUssRUFBRSxDQUFDO09BQzFDOztBQUVELDBCQUFzQjthQUFBLGtDQUFHO0FBQ3ZCLFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7QUFDM0IsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUM7OztBQUdoQyxZQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxFQUFFO0FBQ2pDLGNBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFO0FBQ3JCLGtCQUFNLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLGdCQUFnQixDQUFDLENBQUM7V0FDM0U7O0FBRUQsaUJBQU8sRUFBRSxJQUFJLEVBQUUsbUJBQW1CLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDO1NBQ25EOztBQUVELFlBQUksSUFBSSxDQUFDLDJCQUEyQixFQUFFO0FBQ3BDLGNBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFO0FBQ3JCLGtCQUFNLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLGdCQUFnQixDQUFDLENBQUM7V0FDM0U7O0FBRUQsaUJBQU8sRUFBRSxJQUFJLEVBQUUsbUJBQW1CLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDO1NBQ25EOztBQUVELFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQztBQUNqQixZQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQyxVQUFVLEVBQUU7QUFDaEQsZUFBSyxHQUFHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQzs7QUFFL0IsY0FBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLEtBQUssQ0FBQztBQUN0QixjQUFJLENBQUMsQ0FBQSxHQUFFLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxFQUFFO0FBQy9DLGtCQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLGFBQWEsRUFBRSxLQUFLLENBQUMsQ0FBQztXQUM1RDtTQUNGOztBQUVELFlBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0FBQ3hCLFlBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFO0FBQ3JCLGdCQUFNLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLGdCQUFnQixDQUFDLENBQUM7U0FDM0U7O0FBRUQsZUFBTyxFQUFFLElBQUksRUFBRSxtQkFBbUIsRUFBRSxLQUFLLEVBQUwsS0FBSyxFQUFFLENBQUM7T0FDN0M7O0FBR0QsMEJBQXNCO2FBQUEsa0NBQUc7QUFDdkIsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDaEMsWUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7QUFDeEIsZUFBTyxFQUFFLElBQUksRUFBRSxtQkFBbUIsRUFBRSxDQUFDO09BQ3RDOztBQUVELHlCQUFxQjthQUFBLGlDQUFHO0FBQ3RCLFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQzFCLFlBQUksY0FBYyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUM7QUFDdEMsWUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7QUFDeEIsWUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQ2pDLFlBQUksQ0FBQyxXQUFXLEdBQUcsY0FBYyxDQUFDOztBQUVsQyxZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUM3QixZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM5QixZQUFJLElBQUksR0FBRyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7QUFDbEMsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUIsWUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7O0FBRTlCLGVBQU8sRUFBRSxJQUFJLEVBQUUsa0JBQWtCLEVBQUUsSUFBSSxFQUFKLElBQUksRUFBRSxJQUFJLEVBQUosSUFBSSxFQUFFLENBQUM7T0FDakQ7O0FBb0RELHFCQUFpQjthQUFBLDZCQUFHO0FBQ2xCLFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzNCLFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlCLFlBQUksSUFBSSxHQUFHLElBQUksQ0FBQztBQUNoQixZQUFJLEtBQUssR0FBRyxJQUFJLENBQUM7QUFDakIsWUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsRUFBRTtBQUNqQyxjQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEVBQUU7QUFDcEMsZ0JBQUksR0FBRyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7V0FDL0I7QUFDRCxjQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNqQyxjQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUU7QUFDakMsaUJBQUssR0FBRyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7V0FDaEM7QUFDRCxpQkFBTztBQUNMLGdCQUFJLEVBQUUsY0FBYztBQUNwQixnQkFBSSxFQUFFLElBQUk7QUFDVixnQkFBSSxFQUFKLElBQUk7QUFDSixrQkFBTSxFQUFFLEtBQUs7QUFDYixnQkFBSSxFQUFFLElBQUksQ0FBQyw0QkFBNEIsRUFBRTtXQUMxQyxDQUFDO1NBQ0gsTUFBTTtBQUNMLGNBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxLQUFLLEtBQUssQ0FBQztBQUNwSCxjQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsMkJBQTJCLEVBQUUsQ0FBQztBQUNuRCxjQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLFNBQVMsRUFBRTtBQUMxQyxnQkFBSSxlQUFlLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztBQUNuQyxnQkFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7QUFDckIsZ0JBQUksSUFBSSxHQUFHLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxFQUFDLEtBQUssRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO0FBQ3hELGdCQUFJLENBQUMsT0FBTyxHQUFHLGVBQWUsQ0FBQzs7QUFFL0IsZ0JBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEtBQUssQ0FBQyxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFBLEFBQUMsRUFBRTtBQUMzRixrQkFBSSxJQUFJLFlBQUEsQ0FBQzs7QUFFVCxrQkFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsRUFBRTtBQUM1QixvQkFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxJQUFJLEVBQUU7QUFDcEMsd0JBQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsdUJBQXVCLENBQUMsQ0FBQztpQkFDL0Q7QUFDRCxvQkFBSSxHQUFHLGdCQUFnQixDQUFDO0FBQ3hCLG9CQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDWCxxQkFBSyxHQUFHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztlQUNoQyxNQUFNO0FBQ0wsb0JBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksSUFBSSxFQUFFO0FBQ3BDLHdCQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLHVCQUF1QixDQUFDLENBQUM7aUJBQy9EO0FBQ0Qsb0JBQUksR0FBRyxnQkFBZ0IsQ0FBQztBQUN4QixxQkFBSyxJQUFJLEdBQUcsSUFBSSxJQUFJLENBQUMsR0FBRyxFQUFFO0FBQ3hCLHNCQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQztpQkFDNUI7O0FBRUQsb0JBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUNYLHFCQUFLLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUM7ZUFDMUM7O0FBRUQsa0JBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLDRCQUE0QixFQUFFLFNBQVMsSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7O0FBRTlGLHFCQUFPLEVBQUUsSUFBSSxFQUFKLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBTCxLQUFLLEVBQUUsSUFBSSxFQUFKLElBQUksRUFBRSxDQUFDO2FBQzFDLE1BQU07QUFDTCxrQkFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDakMsa0JBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsRUFBRTtBQUNwQyxvQkFBSSxHQUFHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztlQUMvQjtBQUNELGtCQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNqQyxrQkFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQ2pDLHFCQUFLLEdBQUcsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO2VBQ2hDO0FBQ0QscUJBQU87QUFDTCxvQkFBSSxFQUFFLGNBQWM7QUFDcEIsb0JBQUksRUFBSixJQUFJO0FBQ0osb0JBQUksRUFBSixJQUFJO0FBQ0osc0JBQU0sRUFBRSxLQUFLO0FBQ2Isb0JBQUksRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyw0QkFBNEIsRUFBRSxTQUFTLElBQUksSUFBSSxDQUFDLGVBQWUsQ0FBQztlQUN6RixDQUFDO2FBQ0g7V0FDRixNQUFNO0FBQ0wsZ0JBQUksZUFBZSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7QUFDbkMsZ0JBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO0FBQ3JCLGdCQUFJLElBQUksR0FBRyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7QUFDbEMsZ0JBQUksQ0FBQyxPQUFPLEdBQUcsZUFBZSxDQUFDOztBQUUvQixnQkFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsRUFBRTtBQUMxRSxrQkFBSSxDQUFDLE1BQU0sQ0FBQyw2QkFBNkIsQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUMvQyxzQkFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO2VBQzdEOztBQUVELGtCQUFJLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsR0FBRyxnQkFBZ0IsR0FBRyxnQkFBZ0IsQ0FBQzs7QUFFMUUsa0JBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUNYLG1CQUFLLEdBQUcsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDOztBQUUvQixxQkFBTyxFQUFFLElBQUksRUFBSixJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUwsS0FBSyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsNEJBQTRCLEVBQUUsRUFBRSxDQUFDO2FBQy9FLE1BQU07QUFDTCxrQkFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDakMsa0JBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsRUFBRTtBQUNwQyxvQkFBSSxHQUFHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztlQUMvQjtBQUNELGtCQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNqQyxrQkFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQ2pDLHFCQUFLLEdBQUcsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO2VBQ2hDO0FBQ0QscUJBQU8sRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBSixJQUFJLEVBQUUsSUFBSSxFQUFKLElBQUksRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsNEJBQTRCLEVBQUUsRUFBRSxDQUFDO2FBQ3ZHO1dBQ0Y7U0FDRjtPQUNGOztBQUVELGdDQUE0QjthQUFBLHdDQUFHO0FBQzdCLFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlCLFlBQUksY0FBYyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUM7QUFDdEMsWUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7QUFDeEIsWUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQ2pDLFlBQUksQ0FBQyxXQUFXLEdBQUcsY0FBYyxDQUFDO0FBQ2xDLGVBQU8sSUFBSSxDQUFDO09BQ2I7O0FBRUQsb0JBQWdCO2FBQUEsNEJBQUc7QUFDakIsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDMUIsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUIsWUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDOztBQUVsQyxZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM5QixZQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDdkMsWUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDO0FBQ3JCLFlBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDNUIsbUJBQVMsR0FBRyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7U0FDbkM7QUFDRCxlQUFPLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUosSUFBSSxFQUFFLFVBQVUsRUFBVixVQUFVLEVBQUUsU0FBUyxFQUFULFNBQVMsRUFBRSxDQUFDO09BQzdEOztBQUVELHdCQUFvQjthQUFBLGdDQUFHO0FBQ3JCLFlBQUksVUFBVSxHQUFHLElBQUksQ0FBQzs7QUFFdEIsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUIsWUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUU7QUFDeEIsZ0JBQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsY0FBYyxDQUFDLENBQUM7U0FDdEQ7O0FBRUQsWUFBSSxJQUFJLENBQUMsMkJBQTJCLEVBQUU7QUFDcEMsaUJBQU8sRUFBRSxJQUFJLEVBQUUsaUJBQWlCLEVBQUUsVUFBVSxFQUFWLFVBQVUsRUFBRSxDQUFDO1NBQ2hEOztBQUVELFlBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsRUFBRTtBQUNwQyxjQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEVBQUU7QUFDaEQsc0JBQVUsR0FBRyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7V0FDckM7U0FDRjs7QUFFRCxZQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztBQUN4QixlQUFPLEVBQUUsSUFBSSxFQUFFLGlCQUFpQixFQUFFLFVBQVUsRUFBVixVQUFVLEVBQUUsQ0FBQztPQUNoRDs7QUFFRCxzQkFBa0I7YUFBQSw4QkFBRztBQUNuQixZQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7QUFDZixnQkFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1NBQ3hEOztBQUVELFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzVCLFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlCLFlBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztBQUNwQyxZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM5QixZQUFJLElBQUksR0FBRyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7O0FBRWpDLGVBQU8sRUFBRSxJQUFJLEVBQUUsZUFBZSxFQUFFLE1BQU0sRUFBTixNQUFNLEVBQUUsSUFBSSxFQUFKLElBQUksRUFBRSxDQUFDO09BQ2hEOztBQUVELHdCQUFvQjthQUFBLGdDQUFHOzs7QUFDckIsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUIsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUIsWUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO0FBQzFDLFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlCLFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDOztBQUU5QixZQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQzlCLGlCQUFPLEVBQUUsSUFBSSxFQUFFLGlCQUFpQixFQUFFLFlBQVksRUFBWixZQUFZLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxDQUFDO1NBQzdEO0FBQ0QsWUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztBQUNoQyxZQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztBQUNyQixlQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsWUFBTTtBQUN4QixjQUFJLEtBQUssR0FBRyxNQUFLLGdCQUFnQixFQUFFLENBQUM7QUFDcEMsY0FBSSxNQUFLLEtBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEVBQUU7QUFDakMsZ0JBQUksV0FBVyxHQUFHLE1BQUssa0JBQWtCLEVBQUUsQ0FBQztBQUM1QyxnQkFBSSxnQkFBZ0IsR0FBRyxNQUFLLGdCQUFnQixFQUFFLENBQUM7QUFDL0MsZ0JBQUksTUFBSyxLQUFLLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxFQUFFO0FBQ2pDLG9CQUFNLE1BQUssV0FBVyxDQUFDLGFBQWEsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO2FBQ25FO0FBQ0Qsa0JBQUssUUFBUSxHQUFHLFdBQVcsQ0FBQztBQUM1QixrQkFBSyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlCLG1CQUFPO0FBQ0wsa0JBQUksRUFBRSw0QkFBNEI7QUFDbEMsMEJBQVksRUFBWixZQUFZO0FBQ1osNkJBQWUsRUFBRSxLQUFLO0FBQ3RCLHlCQUFXLEVBQVgsV0FBVztBQUNYLDhCQUFnQixFQUFoQixnQkFBZ0I7YUFDakIsQ0FBQztXQUNILE1BQU07QUFDTCxrQkFBSyxRQUFRLEdBQUcsV0FBVyxDQUFDO0FBQzVCLGtCQUFLLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUIsbUJBQU8sRUFBRSxJQUFJLEVBQUUsaUJBQWlCLEVBQUUsWUFBWSxFQUFaLFlBQVksRUFBRSxLQUFLLEVBQUwsS0FBSyxFQUFFLENBQUM7V0FDekQ7U0FDRixFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztPQUMxQjs7QUFFRCxvQkFBZ0I7YUFBQSw0QkFBRztBQUNqQixZQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7QUFDaEIsZUFBTyxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQSxBQUFDLEVBQUU7QUFDckYsZ0JBQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUM7U0FDckM7QUFDRCxlQUFPLE1BQU0sQ0FBQztPQUNmOztBQUVELG1CQUFlO2FBQUEsMkJBQUc7QUFDaEIsWUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ3ZDLFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzVCLGVBQU8sSUFBSSxDQUFDLFlBQVksQ0FBQztBQUN2QixjQUFJLEVBQUUsWUFBWTtBQUNsQixjQUFJLEVBQUUsSUFBSSxDQUFDLGVBQWUsRUFBRTtBQUM1QixvQkFBVSxFQUFFLElBQUksQ0FBQyxtQkFBbUIsRUFBRTtTQUN2QyxFQUFFLGFBQWEsQ0FBQyxDQUFDO09BQ25COztBQUVELHNCQUFrQjthQUFBLDhCQUFHO0FBQ25CLFlBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUN2QyxZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUMvQixlQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxJQUFJLEVBQUUsZUFBZSxFQUFFLFVBQVUsRUFBRSxJQUFJLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxFQUFFLGFBQWEsQ0FBQyxDQUFDO09BQzVHOztBQUVELHVCQUFtQjthQUFBLCtCQUFHO0FBQ3BCLFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzdCLGVBQU8sSUFBSSxDQUFDLGtDQUFrQyxFQUFFLENBQUM7T0FDbEQ7O0FBRUQsc0NBQWtDO2FBQUEsOENBQUc7QUFDbkMsWUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO0FBQ2hCLGVBQU8sRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUEsQUFBQyxFQUFFO0FBQ25ILGdCQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDLENBQUM7U0FDNUM7QUFDRCxlQUFPLE1BQU0sQ0FBQztPQUNmOztBQUVELHVCQUFtQjthQUFBLCtCQUFHO0FBQ3BCLFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDOztBQUV6QyxZQUFJLElBQUksQ0FBQywyQkFBMkIsRUFBRTtBQUNwQyxnQkFBTSxJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1NBQzlFOztBQUVELFlBQUksVUFBVSxHQUFHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQzs7QUFFeEMsWUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7O0FBRXhCLGVBQU8sRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsVUFBVSxFQUFWLFVBQVUsRUFBRSxDQUFDO09BQy9DOztBQUVELHFCQUFpQjthQUFBLDZCQUFHO0FBQ2xCLFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzNCLFlBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7O0FBRS9ELFlBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDL0IsY0FBSSxXQUFXLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7QUFDMUMsY0FBSSxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsRUFBRTtBQUMvQixnQkFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztBQUNwRSxtQkFBTyxFQUFFLElBQUksRUFBRSxxQkFBcUIsRUFBRSxJQUFJLEVBQUosSUFBSSxFQUFFLFdBQVcsRUFBWCxXQUFXLEVBQUUsU0FBUyxFQUFULFNBQVMsRUFBRSxDQUFDO1dBQ3RFO0FBQ0QsaUJBQU8sRUFBRSxJQUFJLEVBQUUsbUJBQW1CLEVBQUUsSUFBSSxFQUFKLElBQUksRUFBRSxXQUFXLEVBQVgsV0FBVyxFQUFFLENBQUM7U0FDekQ7O0FBRUQsWUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsRUFBRTtBQUMvQixjQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO0FBQ3BFLGlCQUFPLEVBQUUsSUFBSSxFQUFFLHFCQUFxQixFQUFFLElBQUksRUFBSixJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQVQsU0FBUyxFQUFFLENBQUM7U0FDNUUsTUFBTTtBQUNMLGdCQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLG1CQUFtQixDQUFDLENBQUM7U0FDM0Q7T0FDRjs7QUFFRCxxQ0FBaUM7YUFBQSw2Q0FBRztBQUNsQyxZQUFJLFdBQVcsR0FBRyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztBQUNsRCxZQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztBQUN4QixlQUFPLEVBQUUsSUFBSSxFQUFFLDhCQUE4QixFQUFFLFdBQVcsRUFBWCxXQUFXLEVBQUUsQ0FBQztPQUM5RDs7QUFFRCx1QkFBbUI7YUFBQSwrQkFBRztBQUNwQixZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUM3QixZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM5QixlQUFPLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsZUFBZSxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyw0QkFBNEIsRUFBRSxFQUFFLENBQUM7T0FDNUc7O0FBRUQsb0JBQWdCO2FBQUEsNEJBQUc7OztBQUNqQixZQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7O0FBRXZDLFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzdCLFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlCLFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7QUFDM0IsWUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUNoRSxnQkFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDcEM7O0FBRUQsWUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7O0FBRXhDLFlBQUksS0FBSyxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDdkMsWUFBSSxjQUFjLENBQUMsS0FBSyxDQUFDLElBQUksSUFBSSxFQUFFO0FBQ2pDLGdCQUFNLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLGlCQUFpQixFQUFFLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1NBQ25HOztBQUVELFlBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEVBQUU7QUFDL0MsZ0JBQU0sSUFBSSxDQUFDLHVCQUF1QixDQUFDLEtBQUssRUFBRSxhQUFhLENBQUMscUJBQXFCLENBQUMsQ0FBQztTQUNoRjs7QUFFRCxZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQzs7QUFFOUIsWUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQzs7QUFFL0QsWUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsVUFBQSxJQUFJLEVBQUk7QUFDdkIsY0FBSSxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUM1QixrQkFBTSxNQUFLLHVCQUF1QixDQUFDLEtBQUssRUFBRSxhQUFhLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLENBQUM7V0FDbEY7U0FDRixDQUFDLENBQUM7QUFDSCxhQUFLLElBQUksR0FBRyxJQUFJLElBQUksQ0FBQyxHQUFHLEVBQUU7QUFDeEIsY0FBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLFVBQVUsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDcEUsa0JBQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsdUJBQXVCLEVBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1dBQzdFO1NBQ0Y7QUFDRCxlQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLE9BQU8sRUFBUCxPQUFPLEVBQUUsSUFBSSxFQUFKLElBQUksRUFBRSxFQUFFLGFBQWEsQ0FBQyxDQUFDO09BQ2pGOztBQUVELGNBQVU7YUFBQSxzQkFBRztBQUNYLFlBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUN2QyxZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQzs7QUFFOUIsWUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDO0FBQ2QsZUFBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQ3BDLGNBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUMsQ0FBQztTQUMxQztBQUNELFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlCLGVBQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxFQUFFLGFBQWEsQ0FBQyxDQUFDO09BQzlFOztBQUVELDRCQUF3QjthQUFBLG9DQUF3QztnREFBSixFQUFFOzs4QkFBcEMsS0FBSztZQUFMLEtBQUssOEJBQUcsS0FBSzttQ0FBRSxVQUFVO1lBQVYsVUFBVSxtQ0FBRyxFQUFFOztBQUN0RCxZQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDdkMsWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDOzs7QUFHdkIsWUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLElBQUksS0FBSyxTQUFTLENBQUMsR0FBRyxHQUFHLEtBQUssR0FBRyxLQUFLLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQyxLQUFLLEdBQUcsT0FBTyxHQUFHLEtBQUssQ0FBQztBQUNuRyxZQUFJLFdBQVcsR0FBRyxJQUFJLENBQUMsMkJBQTJCLENBQUMsSUFBSSxFQUFFLEVBQUMsS0FBSyxFQUFMLEtBQUssRUFBRSxVQUFVLEVBQVYsVUFBVSxFQUFDLENBQUMsQ0FBQztBQUM5RSxlQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxJQUFJLEVBQUUscUJBQXFCLEVBQUUsSUFBSSxFQUFKLElBQUksRUFBRSxXQUFXLEVBQVgsV0FBVyxFQUFFLEVBQUUsYUFBYSxDQUFDLENBQUM7T0FDN0Y7O0FBRUQsK0JBQTJCO2FBQUEscUNBQUMsSUFBSSxRQUF1QjtZQUFwQixLQUFLLFFBQUwsS0FBSztZQUFFLFVBQVUsUUFBVixVQUFVOztBQUNsRCxZQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7O3VDQUNVLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLEVBQUUsRUFBQyxLQUFLLEVBQUwsS0FBSyxFQUFFLHdCQUF3QixFQUFFLEtBQUssRUFBQyxDQUFDOzs7O1lBQWpHLE9BQU87WUFBRSxRQUFROztBQUN0QixjQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3JCLFlBQUksS0FBSyxJQUFJLElBQUksS0FBSyxPQUFPLElBQUksT0FBTyxDQUFDLElBQUksS0FBSyxJQUFJLEVBQUU7QUFDdEQsaUJBQU8sTUFBTSxDQUFDO1NBQ2Y7O0FBRUQsZUFBTyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRTswQ0FDTCxJQUFJLENBQUMsdUJBQXVCLENBQUMsSUFBSSxFQUFFLEVBQUMsS0FBSyxFQUFMLEtBQUssRUFBRSx3QkFBd0IsRUFBRSxLQUFLLEVBQUMsQ0FBQzs7OztjQUFsRyxXQUFXO2NBQUUsS0FBSzs7QUFDdkIsZ0JBQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7QUFDekIsY0FBSSxJQUFJLEtBQUssS0FBSyxFQUFFO0FBQ2xCLG9CQUFRLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztXQUNuQztTQUNGOztBQUVELFlBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxRQUFRLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEVBQUU7QUFDbEQsZ0JBQU0sSUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsYUFBYSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1NBQ25GOztBQUVELFlBQUksSUFBSSxLQUFLLEtBQUssRUFBRTtBQUNsQixjQUFJLElBQUksR0FBRyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDcEMsY0FBSSxJQUFJLEtBQUssSUFBSSxFQUFFO0FBQ2pCLGtCQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxDQUFDO1dBQy9EO1NBQ0Y7QUFDRCxVQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDcEMsZUFBTyxNQUFNLENBQUM7T0FDZjs7QUFFRCwyQkFBdUI7YUFBQSxpQ0FBQyxJQUFJLFFBQXFDOzs7WUFBbEMsS0FBSyxRQUFMLEtBQUs7WUFBRSx3QkFBd0IsUUFBeEIsd0JBQXdCOztBQUM1RCxZQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDdkMsWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQzs7QUFFM0IsWUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUNoQyxnQkFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQzdDOztBQUVELFlBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO0FBQ3hDLFlBQUksQ0FBQyxLQUFLLElBQUksT0FBTyxDQUFDLElBQUksS0FBSyxtQkFBbUIsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQ25GLGNBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQy9CO0FBQ0QsWUFBSSxLQUFLLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQzs7QUFFdkMsWUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDO0FBQ2hCLFlBQUksSUFBSSxLQUFLLE9BQU8sRUFBRTtBQUNwQixjQUFJLENBQUMsd0JBQXdCLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUU7QUFDN0QsZ0JBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlCLGdCQUFJLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUM7V0FDekM7U0FDRixNQUFNLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUU7QUFDckMsY0FBSSxHQUFHLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO1NBQ3pDOztBQUVELFlBQUksSUFBSSxLQUFLLEtBQUssRUFBRTtBQUNsQixlQUFLLENBQUMsT0FBTyxDQUFDLFVBQUEsSUFBSTttQkFBSSxNQUFLLEdBQUcsQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsSUFBSTtXQUFBLENBQUMsQ0FBQztTQUNwRCxNQUFNO0FBQ0wsY0FBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUM3QixrQkFBTSxJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1dBQzlFO0FBQ0QsWUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztTQUNoQztBQUNELGVBQU8sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsSUFBSSxFQUFFLG9CQUFvQixFQUFFLE9BQU8sRUFBUCxPQUFPLEVBQUUsSUFBSSxFQUFKLElBQUksRUFBRSxFQUFFLGFBQWEsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO09BQ2pHOztBQU9ELG1CQUFlO2FBQUEsMkJBQUc7QUFDaEIsWUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDOztBQUV2QyxZQUFJLEtBQUssR0FBRyxJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQztBQUM3QyxZQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFO0FBQy9CLGlCQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFO0FBQ2xCLGdCQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDaEMsb0JBQU07YUFDUDtBQUNELGdCQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDWCxnQkFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUM7QUFDNUMsaUJBQUssR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsSUFBSSxFQUFFLGtCQUFrQixFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEVBQUUsYUFBYSxDQUFDLENBQUM7V0FDakg7U0FDRjtBQUNELGVBQU8sS0FBSyxDQUFDO09BQ2Q7O0FBRUQsNEJBQXdCO2FBQUEsa0NBQUMsSUFBSSxFQUFFLGFBQWEsRUFBRTtBQUM1QyxZQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQzs7OzJCQUdOLElBQUksQ0FBbEMsTUFBTTtZQUFOLE1BQU0sZ0NBQUcsSUFBSTt5QkFBaUIsSUFBSSxDQUFuQixJQUFJO1lBQUosSUFBSSw4QkFBRyxJQUFJOztBQUMvQixZQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssdUJBQXVCLEVBQUU7QUFDekMsY0FBSSxJQUFJLENBQUMsSUFBSSxLQUFLLG1CQUFtQixFQUFFO0FBQ3JDLGdCQUFJLEtBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO0FBQ3JCLGdCQUFJLHlCQUF5QixDQUFDLGNBQWMsQ0FBQyxLQUFJLENBQUMsRUFBRTtBQUNsRCxvQkFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO2FBQzVEO0FBQ0QsZ0JBQUksZ0JBQWdCLENBQUMsS0FBSSxDQUFDLEVBQUU7QUFDMUIsb0JBQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsaUJBQWlCLENBQUMsQ0FBQzthQUN6RDtBQUNELGtCQUFNLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztXQUNqQixNQUFNO0FBQ0wsa0JBQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDO1dBQ3BDO1NBQ0Y7O0FBRUQsWUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLElBQUksRUFBRSxrQkFBa0IsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBSixJQUFJLEVBQUUsRUFBRSxhQUFhLENBQUMsQ0FBQzs7QUFFckcsWUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUNoQyxjQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUM7QUFDOUMsY0FBSSxDQUFDLG9CQUFvQixHQUFHLEtBQUssQ0FBQztBQUNsQyxjQUFJLFdBQVcsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQzs7bUNBQ3hELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxXQUFXLENBQUM7Ozs7Y0FBM0MsSUFBSTs7QUFDVCxjQUFJLENBQUMsb0JBQW9CLEdBQUcsYUFBYSxDQUFDO0FBQzFDLGlCQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxJQUFJLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUosSUFBSSxFQUFFLEVBQUUsYUFBYSxDQUFDLENBQUM7U0FDaEcsTUFBTTtBQUNMLGNBQUksSUFBSSxHQUFHLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO0FBQzVDLGlCQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxJQUFJLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUosSUFBSSxFQUFFLEVBQUUsYUFBYSxDQUFDLENBQUM7U0FDaEc7T0FDRjs7QUFFRCw2QkFBeUI7YUFBQSxxQ0FBRztBQUMxQixlQUFPLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLHlDQUF5QyxFQUFFLENBQUMsQ0FBQztPQUN6RTs7QUFFRCw2Q0FBeUM7YUFBQSxxREFBRztBQUMxQyxZQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO0FBQzNCLFlBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQzs7QUFFdkMsWUFBSSxJQUFJLENBQUMsb0JBQW9CLElBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDLEtBQUssRUFBRTtBQUN0RyxpQkFBTyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsb0JBQW9CLEVBQUUsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixFQUFFLEtBQUssRUFBRSxDQUFDO1NBQ3RGOzswQ0FFb0QsSUFBSSxDQUFDLDBCQUEwQixFQUFFOztZQUFoRixJQUFJLCtCQUFKLElBQUk7WUFBRSxPQUFPLCtCQUFQLE9BQU87WUFBRSxnQkFBZ0IsK0JBQWhCLGdCQUFnQjtZQUFFLFNBQVMsK0JBQVQsU0FBUzs7QUFFaEQsWUFBSSxDQUFDLElBQUksQ0FBQywyQkFBMkIsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUNwRSxpQkFBTyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsd0JBQXdCLENBQUMsT0FBTyxFQUFFLGFBQWEsQ0FBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsS0FBSyxFQUFFLENBQUM7U0FDaEg7O0FBRUQsWUFBSSxvQkFBb0IsR0FBRyxLQUFLLENBQUM7QUFDakMsWUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztBQUM5QixnQkFBUSxRQUFRLENBQUMsSUFBSTtBQUNuQixlQUFLLFNBQVMsQ0FBQyxhQUFhLENBQUM7QUFDN0IsZUFBSyxTQUFTLENBQUMsY0FBYyxDQUFDO0FBQzlCLGVBQUssU0FBUyxDQUFDLGNBQWMsQ0FBQztBQUM5QixlQUFLLFNBQVMsQ0FBQyxVQUFVLENBQUM7QUFDMUIsZUFBSyxTQUFTLENBQUMsVUFBVSxDQUFDO0FBQzFCLGVBQUssU0FBUyxDQUFDLG1CQUFtQixDQUFDO0FBQ25DLGVBQUssU0FBUyxDQUFDLFVBQVUsQ0FBQztBQUMxQixlQUFLLFNBQVMsQ0FBQyxVQUFVLENBQUM7QUFDMUIsZUFBSyxTQUFTLENBQUMsVUFBVSxDQUFDO0FBQzFCLGVBQUssU0FBUyxDQUFDLFVBQVUsQ0FBQztBQUMxQixlQUFLLFNBQVMsQ0FBQyxVQUFVO0FBQ3ZCLGdDQUFvQixHQUFHLElBQUksQ0FBQztBQUM1QixrQkFBTTtBQUFBLFNBQ1Q7QUFDRCxZQUFJLG9CQUFvQixFQUFFO0FBQ3hCLGNBQUksQ0FBQyxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsNkJBQTZCLENBQUMsT0FBTyxDQUFDLEVBQUU7QUFDOUQsa0JBQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMseUJBQXlCLENBQUMsQ0FBQztXQUNqRTtBQUNELGNBQUksT0FBTyxDQUFDLElBQUksS0FBSyxtQkFBbUIsRUFBRTtBQUN4QyxnQkFBSSxJQUFJLENBQUMsTUFBTSxJQUFJLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUNqRCxvQkFBTSxJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO2FBQ2hGO1dBQ0Y7U0FDRixNQUFNLElBQUksUUFBUSxDQUFDLElBQUksS0FBSyxTQUFTLENBQUMsTUFBTSxFQUFFO0FBQzdDLGNBQUksQ0FBQyxPQUFPLEVBQUU7QUFDWixrQkFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1dBQ2pFO0FBQ0QsY0FBSSxLQUFLLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUNyQyxjQUFJLElBQUksQ0FBQyxNQUFNLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFO0FBQy9DLGtCQUFNLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLHFCQUFxQixDQUFDLENBQUM7V0FDaEY7U0FDSixNQUFNO0FBQ0wsaUJBQU8sRUFBRSxJQUFJLEVBQUosSUFBSSxFQUFFLE9BQU8sRUFBUCxPQUFPLEVBQUUsZ0JBQWdCLEVBQWhCLGdCQUFnQixFQUFFLFNBQVMsRUFBVCxTQUFTLEVBQUUsQ0FBQztTQUN2RDs7QUFFRCxZQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDWCxZQUFJLDRCQUE0QixHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQztBQUM3RCxZQUFJLENBQUMsb0JBQW9CLEdBQUcsS0FBSyxDQUFDO0FBQ2xDLFlBQUksR0FBRyxHQUFHLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxDQUFDOztBQUUzQyxZQUFJLENBQUMsb0JBQW9CLEdBQUcsNEJBQTRCLENBQUM7QUFDekQsZUFBTztBQUNMLGNBQUksRUFBRSxPQUFPLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQztBQUNqQyxnQkFBSSxFQUFFLHNCQUFzQjtBQUM1QixtQkFBTyxFQUFFLE9BQU87QUFDaEIsb0JBQVEsRUFBRSxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUk7QUFDNUIsc0JBQVUsRUFBRSxHQUFHO1dBQ2hCLEVBQUUsYUFBYSxDQUFDO0FBQ2pCLGlCQUFPLEVBQUUsT0FBTyxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUM7QUFDcEMsZ0JBQUksRUFBRSxvQkFBb0I7QUFDMUIsbUJBQU8sRUFBRSxPQUFPO0FBQ2hCLGdCQUFJLEVBQUUsR0FBRztXQUNWLEVBQUUsYUFBYSxDQUFDO0FBQ2pCLDBCQUFnQixFQUFoQixnQkFBZ0I7QUFDaEIsbUJBQVMsRUFBVCxTQUFTO1NBQ1YsQ0FBQztPQUNIOztBQUVELGlDQUE2QjthQUFBLHlDQUFHO0FBQzlCLGdCQUFRLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSTtBQUN6QixlQUFLLFNBQVMsQ0FBQyxHQUFHLENBQUM7QUFDbkIsZUFBSyxTQUFTLENBQUMsVUFBVSxDQUFDO0FBQzFCLGVBQUssU0FBUyxDQUFDLEtBQUssQ0FBQztBQUNyQixlQUFLLFNBQVMsQ0FBQyxHQUFHLENBQUM7QUFDbkIsZUFBSyxTQUFTLENBQUMsR0FBRyxDQUFDO0FBQ25CLGVBQUssU0FBUyxDQUFDLEtBQUssQ0FBQztBQUNyQixlQUFLLFNBQVMsQ0FBQyxRQUFRLENBQUM7QUFDeEIsZUFBSyxTQUFTLENBQUMsVUFBVSxDQUFDO0FBQzFCLGVBQUssU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUN0QixlQUFLLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFDdEIsZUFBSyxTQUFTLENBQUMsTUFBTSxDQUFDO0FBQ3RCLGVBQUssU0FBUyxDQUFDLEdBQUcsQ0FBQztBQUNuQixlQUFLLFNBQVMsQ0FBQyxHQUFHLENBQUM7QUFDbkIsZUFBSyxTQUFTLENBQUMsSUFBSSxDQUFDO0FBQ3BCLGVBQUssU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUN0QixlQUFLLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFDdEIsZUFBSyxTQUFTLENBQUMsR0FBRyxDQUFDO0FBQ25CLGVBQUssU0FBUyxDQUFDLElBQUksQ0FBQztBQUNwQixlQUFLLFNBQVMsQ0FBQyxJQUFJLENBQUM7QUFDcEIsZUFBSyxTQUFTLENBQUMsS0FBSyxDQUFDO0FBQ3JCLGVBQUssU0FBUyxDQUFDLFFBQVE7QUFDckIsbUJBQU8sSUFBSSxDQUFDO0FBQUEsU0FDZjtBQUNELGVBQU8sS0FBSyxDQUFDO09BQ2Q7O0FBRUQsd0JBQW9CO2FBQUEsZ0NBQUc7QUFDckIsWUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDOztBQUV2QyxZQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDWCxZQUFJLElBQUksQ0FBQywyQkFBMkIsRUFBRTtBQUNwQyxpQkFBTyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsSUFBSSxFQUFFLGlCQUFpQixFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsRUFBRSxhQUFhLENBQUMsQ0FBQztTQUN4RjtBQUNELFlBQUksV0FBVyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUM1QyxZQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUM7QUFDOUMsWUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDO0FBQ2hCLFlBQUksV0FBVyxJQUFJLElBQUksQ0FBQyw2QkFBNkIsRUFBRSxFQUFFO0FBQ3ZELGNBQUksR0FBRyxJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQztTQUN6QztBQUNELFlBQUksQ0FBQyxvQkFBb0IsR0FBRyxhQUFhLENBQUM7QUFDMUMsWUFBSSxJQUFJLEdBQUcsV0FBVyxHQUFHLDBCQUEwQixHQUFHLGlCQUFpQixDQUFDO0FBQ3hFLGVBQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFDLElBQUksRUFBSixJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO09BQ25FOztBQUVELDhCQUEwQjthQUFBLHNDQUFHO0FBQzNCLFlBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUN2QyxZQUFJLElBQUksR0FBRyxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztBQUN4QyxZQUFJLENBQUMsSUFBSSxDQUFDLElBQUk7QUFBRSxpQkFBTyxJQUFJLENBQUM7U0FBQSxBQUM1QixJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQyxFQUFFO0FBQ25DLGNBQUksZUFBZSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7QUFDbkMsY0FBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7QUFDcEIsY0FBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUM7QUFDbEQsY0FBSSxDQUFDLE9BQU8sR0FBRyxlQUFlLENBQUM7QUFDL0IsY0FBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDN0IsY0FBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUM7QUFDakQsaUJBQU87QUFDTCxnQkFBSSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUM7QUFDdEIsa0JBQUksRUFBRSx1QkFBdUI7QUFDN0Isa0JBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtBQUNmLHdCQUFVLEVBQVYsVUFBVTtBQUNWLHVCQUFTLEVBQVQsU0FBUzthQUNWLEVBQUUsYUFBYSxDQUFDO0FBQ2pCLG1CQUFPLEVBQUUsSUFBSTtBQUNiLDRCQUFnQixFQUFFLEtBQUs7QUFDdkIscUJBQVMsRUFBRSxJQUFJO1dBQ2hCLENBQUM7U0FDSDs7QUFFRCxlQUFPLElBQUksQ0FBQztPQUNiOztBQUVELG9CQUFnQjthQUFBLDBCQUFDLElBQUksRUFBRTtBQUNyQixnQkFBUSxJQUFJO0FBQ1YsZUFBSyxTQUFTLENBQUMsRUFBRSxDQUFDO0FBQ2xCLGVBQUssU0FBUyxDQUFDLEdBQUcsQ0FBQztBQUNuQixlQUFLLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFDdEIsZUFBSyxTQUFTLENBQUMsT0FBTyxDQUFDO0FBQ3ZCLGVBQUssU0FBUyxDQUFDLE9BQU8sQ0FBQztBQUN2QixlQUFLLFNBQVMsQ0FBQyxFQUFFLENBQUM7QUFDbEIsZUFBSyxTQUFTLENBQUMsRUFBRSxDQUFDO0FBQ2xCLGVBQUssU0FBUyxDQUFDLFNBQVMsQ0FBQztBQUN6QixlQUFLLFNBQVMsQ0FBQyxTQUFTLENBQUM7QUFDekIsZUFBSyxTQUFTLENBQUMsRUFBRSxDQUFDO0FBQ2xCLGVBQUssU0FBUyxDQUFDLEVBQUUsQ0FBQztBQUNsQixlQUFLLFNBQVMsQ0FBQyxHQUFHLENBQUM7QUFDbkIsZUFBSyxTQUFTLENBQUMsR0FBRyxDQUFDO0FBQ25CLGVBQUssU0FBUyxDQUFDLFVBQVUsQ0FBQztBQUMxQixlQUFLLFNBQVMsQ0FBQyxHQUFHLENBQUM7QUFDbkIsZUFBSyxTQUFTLENBQUMsR0FBRyxDQUFDO0FBQ25CLGVBQUssU0FBUyxDQUFDLFlBQVksQ0FBQztBQUM1QixlQUFLLFNBQVMsQ0FBQyxHQUFHLENBQUM7QUFDbkIsZUFBSyxTQUFTLENBQUMsR0FBRyxDQUFDO0FBQ25CLGVBQUssU0FBUyxDQUFDLEdBQUcsQ0FBQztBQUNuQixlQUFLLFNBQVMsQ0FBQyxHQUFHLENBQUM7QUFDbkIsZUFBSyxTQUFTLENBQUMsR0FBRztBQUNoQixtQkFBTyxJQUFJLENBQUM7QUFBQSxBQUNkLGVBQUssU0FBUyxDQUFDLEVBQUU7QUFDZixtQkFBTyxJQUFJLENBQUMsT0FBTyxDQUFDO0FBQUEsQUFDdEI7QUFDRSxtQkFBTyxLQUFLLENBQUM7QUFBQSxTQUNoQjtPQUNGOztBQUVELHlCQUFxQjthQUFBLGlDQUFHOzs7QUFDdEIsWUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ2xDLFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO0FBQ3hDLFlBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFO0FBQ2YsaUJBQU8sS0FBSyxDQUFDO1NBQ2Q7O0FBRUQsWUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUM7O0FBRW5DLFlBQUksZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3ZELFlBQUksQ0FBQyxnQkFBZ0IsRUFBRTtBQUNyQixpQkFBTyxLQUFLLENBQUM7U0FDZDs7QUFFRCxZQUFJLElBQUksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDOztBQUV0QixZQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDWCxZQUFJLEtBQUssR0FBRyxFQUFFLENBQUM7QUFDZixhQUFLLENBQUMsSUFBSSxDQUFDLEVBQUMsUUFBUSxFQUFSLFFBQVEsRUFBRSxJQUFJLEVBQUosSUFBSSxFQUFFLFFBQVEsRUFBUixRQUFRLEVBQUUsVUFBVSxFQUFFLGdCQUFnQixDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBQyxDQUFDLENBQUM7QUFDcEYsZ0JBQVEsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDOUIsWUFBSSxLQUFLLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxDQUFDO0FBQ3hELGdCQUFRLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUM7QUFDL0Isd0JBQWdCLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDOUQsZUFBTyxnQkFBZ0IsRUFBRTtBQUN2QixjQUFJLFVBQVUsR0FBRyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7O0FBRWpELGlCQUFPLEtBQUssQ0FBQyxNQUFNLElBQUksVUFBVSxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLFVBQVUsRUFBRTtBQUN2RSxnQkFBSSxTQUFTLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDeEMsZ0JBQUksYUFBYSxHQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUM7QUFDdkMsZ0JBQUksR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDO0FBQ3RCLGlCQUFLLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDWixvQkFBUSxHQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUM7QUFDOUIsaUJBQUssR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsSUFBSSxFQUFFLGtCQUFrQixFQUFFLElBQUksRUFBSixJQUFJLEVBQUUsUUFBUSxFQUFFLGFBQWEsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFMLEtBQUssRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1dBQzlHOztBQUVELGNBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUNYLGVBQUssQ0FBQyxJQUFJLENBQUMsRUFBQyxRQUFRLEVBQVIsUUFBUSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFSLFFBQVEsRUFBRSxVQUFVLEVBQVYsVUFBVSxFQUFDLENBQUMsQ0FBQztBQUMxRCxrQkFBUSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQzs7QUFFOUIsZUFBSyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUMsQ0FBQzs7QUFFcEQsa0JBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQztBQUMvQiwwQkFBZ0IsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDcEQ7OztBQUdELGVBQU87QUFDTCxjQUFJLEVBQUUsS0FBSyxDQUFDLFdBQVcsQ0FBQyxVQUFDLElBQUksRUFBRSxTQUFTO21CQUNwQyxNQUFLLFlBQVksQ0FBQztBQUNoQixrQkFBSSxFQUFFLGtCQUFrQjtBQUN4QixrQkFBSSxFQUFFLFNBQVMsQ0FBQyxJQUFJO0FBQ3BCLHNCQUFRLEVBQUUsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJO0FBQ2pDLG1CQUFLLEVBQUUsSUFBSTthQUNaLEVBQUUsU0FBUyxDQUFDLFFBQVEsQ0FBQztXQUFBLEVBQ3hCLEtBQUssQ0FBQztBQUNSLGlCQUFPLEVBQUUsSUFBSTtBQUNiLDBCQUFnQixFQUFFLEtBQUs7QUFDdkIsbUJBQVMsRUFBRSxJQUFJO1NBQ2hCLENBQUM7T0FDSDs7QUFrQkQsd0JBQW9CO2FBQUEsZ0NBQUc7QUFDckIsWUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLEtBQUssVUFBVSxDQUFDLFVBQVUsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLEtBQUssVUFBVSxDQUFDLE9BQU8sRUFBRTtBQUMzRyxpQkFBTyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztTQUN0QztBQUNELFlBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUN2QyxZQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO0FBQzlCLFlBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQzNDLGlCQUFPLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO1NBQ3RDOztBQUVELFlBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUNYLFlBQUksSUFBSSxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUMsQ0FBQztBQUN2RCxnQkFBUSxRQUFRLENBQUMsSUFBSTtBQUNuQixlQUFLLFNBQVMsQ0FBQyxHQUFHLENBQUM7QUFDbkIsZUFBSyxTQUFTLENBQUMsR0FBRzs7QUFFaEIsZ0JBQUksSUFBSSxDQUFDLElBQUksS0FBSyxzQkFBc0IsRUFBRTtBQUN4QyxrQkFBSSxJQUFJLENBQUMsTUFBTSxJQUFJLGdCQUFnQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUM5QyxzQkFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO2VBQ3pEO2FBQ0Y7O0FBRUQsZ0JBQUksQ0FBQyxNQUFNLENBQUMsNkJBQTZCLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDL0Msb0JBQU0sSUFBSSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMseUJBQXlCLENBQUMsQ0FBQzthQUNqRTtBQUNELGtCQUFNO0FBQUEsQUFDUixlQUFLLFNBQVMsQ0FBQyxNQUFNO0FBQ25CLGdCQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssc0JBQXNCLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtBQUN2RCxvQkFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsQ0FBQzthQUNyRDtBQUNELGtCQUFNO0FBQUEsQUFDUjtBQUNFLGtCQUFNO0FBQUEsU0FDVDs7QUFFRCxlQUFPO0FBQ0wsY0FBSSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxJQUFJLEVBQUUsa0JBQWtCLEVBQUUsUUFBUSxFQUFFLFFBQVEsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxFQUFFLGFBQWEsQ0FBQztBQUM3RyxpQkFBTyxFQUFFLElBQUk7QUFDYiwwQkFBZ0IsRUFBRSxLQUFLO0FBQ3ZCLG1CQUFTLEVBQUUsSUFBSSxFQUNoQixDQUFDO09BQ0g7O0FBRUQsMEJBQXNCO2FBQUEsa0NBQUc7QUFDdkIsWUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDOztBQUV2QyxZQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsMkJBQTJCLENBQUMsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztBQUNoRSxZQUFJLENBQUMsR0FBRyxDQUFDLElBQUk7QUFBRSxpQkFBTyxHQUFHLENBQUM7U0FBQSxBQUUxQixJQUFJLElBQUksQ0FBQywyQkFBMkIsRUFBRTtBQUNwQyxpQkFBTyxHQUFHLENBQUM7U0FDWjs7QUFFRCxZQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO0FBQzlCLFlBQUksUUFBUSxDQUFDLElBQUksS0FBSyxTQUFTLENBQUMsR0FBRyxJQUFJLFFBQVEsQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDLEdBQUcsRUFBRTtBQUN0RSxpQkFBTyxHQUFHLENBQUM7U0FDWjs7QUFFRCxZQUFJLE9BQU8sR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDOztBQUVsQyxZQUFJLENBQUMsTUFBTSxDQUFDLDZCQUE2QixDQUFDLE9BQU8sQ0FBQyxFQUFFO0FBQ2xELGdCQUFNLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLHlCQUF5QixDQUFDLENBQUM7U0FDakU7O0FBRUQsWUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDOzs7QUFHWCxZQUFJLE9BQU8sQ0FBQyxJQUFJLEtBQUssc0JBQXNCLEVBQUU7QUFDM0MsY0FBSSxJQUFJLENBQUMsTUFBTSxJQUFJLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUNqRCxrQkFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1dBQzFEO1NBQ0Y7O0FBRUQsZUFBTztBQUNMLGNBQUksRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsSUFBSSxFQUFFLG1CQUFtQixFQUFFLE9BQU8sRUFBUCxPQUFPLEVBQUUsUUFBUSxFQUFFLFFBQVEsQ0FBQyxLQUFLLEVBQUUsRUFBRSxhQUFhLENBQUM7QUFDeEcsaUJBQU8sRUFBRSxJQUFJO0FBQ2IsMEJBQWdCLEVBQUUsS0FBSztBQUN2QixtQkFBUyxFQUFFLElBQUk7U0FDaEIsQ0FBQztPQUNIOztBQUVELCtCQUEyQjthQUFBLDJDQUFjO1lBQVosU0FBUyxRQUFULFNBQVM7O0FBQ3BDLFlBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUN2QyxZQUFJLGVBQWUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO0FBQ25DLFlBQUksQ0FBQyxPQUFPLEdBQUcsU0FBUyxDQUFDOztBQUV6QixZQUFJLElBQUksWUFBQTtZQUFFLE9BQU8sWUFBQTtZQUFFLGdCQUFnQixZQUFBO1lBQUUsU0FBUyxZQUFBO1lBQUUsS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7O0FBRXZFLFlBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDN0IsMEJBQWdCLEdBQUcsS0FBSyxDQUFDO0FBQ3pCLGNBQUksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxFQUFFLGFBQWEsQ0FBQyxDQUFDO0FBQzNELGNBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUU7QUFDaEMsZ0JBQUksU0FBUyxFQUFFO0FBQ2Isa0JBQUksSUFBSSxDQUFDLGFBQWEsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUU7QUFDM0Msb0JBQUksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDO0FBQ3ZCLHNCQUFJLEVBQUUsZ0JBQWdCO0FBQ3RCLHdCQUFNLEVBQUUsSUFBSTtBQUNaLDJCQUFTLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixFQUFFO2lCQUNwQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO2VBQ25CLE1BQU07QUFDTCxzQkFBTSxJQUFJLENBQUMsdUJBQXVCLENBQUMsYUFBYSxFQUFFLGFBQWEsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO2VBQ3hGO2FBQ0YsTUFBTTtBQUNMLG9CQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUNwQztXQUNGLE1BQU0sSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUN2QyxnQkFBSSxJQUFJLENBQUMsUUFBUSxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRTtBQUN0QyxrQkFBSSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUM7QUFDdkIsb0JBQUksRUFBRSwwQkFBMEI7QUFDaEMsc0JBQU0sRUFBRSxJQUFJO0FBQ1osMEJBQVUsRUFBRSxJQUFJLENBQUMsbUJBQW1CLEVBQUU7ZUFDdkMsRUFBRSxhQUFhLENBQUMsQ0FBQztBQUNsQixxQkFBTyxHQUFHLElBQUksQ0FBQzthQUNoQixNQUFNO0FBQ0wsb0JBQU0sSUFBSSxDQUFDLHVCQUF1QixDQUFDLGFBQWEsRUFBRSxhQUFhLENBQUMseUJBQXlCLENBQUMsQ0FBQzthQUM1RjtXQUNGLE1BQU0sSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUN2QyxnQkFBSSxJQUFJLENBQUMsUUFBUSxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRTtBQUN0QyxrQkFBSSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUM7QUFDdkIsb0JBQUksRUFBRSx3QkFBd0I7QUFDOUIsc0JBQU0sRUFBRSxJQUFJO0FBQ1osd0JBQVEsRUFBRSxJQUFJLENBQUMsc0JBQXNCLEVBQUU7ZUFDeEMsRUFBRSxhQUFhLENBQUMsQ0FBQztBQUNsQixxQkFBTyxHQUFHLElBQUksQ0FBQzthQUNoQixNQUFNO0FBQ0wsb0JBQU0sSUFBSSxDQUFDLHVCQUF1QixDQUFDLGFBQWEsRUFBRSxhQUFhLENBQUMseUJBQXlCLENBQUMsQ0FBQzthQUM1RjtXQUNGLE1BQU07QUFDTCxrQkFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7V0FDcEM7U0FDRixNQUFNLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUU7QUFDcEMsY0FBSSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1NBQ2xDLE1BQU07QUFDTCxjQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztBQUN2QyxjQUFJLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRTtBQUNaLG1CQUFPLEVBQUUsQ0FBQztXQUNYO3NCQUNpRCxFQUFFO0FBQWpELGNBQUksU0FBSixJQUFJO0FBQUUsaUJBQU8sU0FBUCxPQUFPO0FBQUUsMEJBQWdCLFNBQWhCLGdCQUFnQjtBQUFFLG1CQUFTLFNBQVQsU0FBUztTQUM5Qzs7QUFFRCxlQUFPLElBQUksRUFBRTtBQUNYLGNBQUksU0FBUyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQzdDLDRCQUFnQixHQUFHLEtBQUssQ0FBQztBQUN6QixnQkFBSSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUM7QUFDdkIsa0JBQUksRUFBRSxnQkFBZ0I7QUFDdEIsb0JBQU0sRUFBRSxJQUFJO0FBQ1osdUJBQVMsRUFBRSxJQUFJLENBQUMsaUJBQWlCLEVBQUU7YUFDcEMsRUFBRSxhQUFhLENBQUMsQ0FBQztBQUNsQixtQkFBTyxHQUFHLElBQUksQ0FBQztXQUNoQixNQUFNLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUU7QUFDdkMsNEJBQWdCLEdBQUcsS0FBSyxDQUFDO0FBQ3pCLGdCQUFJLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQztBQUN2QixrQkFBSSxFQUFFLDBCQUEwQjtBQUNoQyxvQkFBTSxFQUFFLElBQUk7QUFDWix3QkFBVSxFQUFFLElBQUksQ0FBQyxtQkFBbUIsRUFBRTthQUN2QyxFQUFFLGFBQWEsQ0FBQyxDQUFDO0FBQ2xCLG1CQUFPLEdBQUcsSUFBSSxDQUFDO1dBQ2hCLE1BQU0sSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUN2Qyw0QkFBZ0IsR0FBRyxLQUFLLENBQUM7QUFDekIsZ0JBQUksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDO0FBQ3ZCLGtCQUFJLEVBQUUsd0JBQXdCO0FBQzlCLG9CQUFNLEVBQUUsSUFBSTtBQUNaLHNCQUFRLEVBQUUsSUFBSSxDQUFDLHNCQUFzQixFQUFFO2FBQ3hDLEVBQUUsYUFBYSxDQUFDLENBQUM7QUFDbEIsbUJBQU8sR0FBRyxJQUFJLENBQUM7V0FDaEIsTUFBTSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxFQUFFO0FBQ3pDLDRCQUFnQixHQUFHLEtBQUssQ0FBQztBQUN6QixnQkFBSSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUM7QUFDdkIsa0JBQUksRUFBRSxvQkFBb0I7QUFDMUIsaUJBQUcsRUFBRSxJQUFJO0FBQ1Qsc0JBQVEsRUFBRSxJQUFJLENBQUMscUJBQXFCLEVBQUU7YUFDdkMsRUFBRSxhQUFhLENBQUMsQ0FBQztBQUNsQixtQkFBTyxHQUFHLElBQUksQ0FBQztXQUNoQixNQUFNO0FBQ0wsa0JBQU07V0FDUDtTQUNGOztBQUVELFlBQUksQ0FBQyxPQUFPLEdBQUcsZUFBZSxDQUFDOztBQUUvQixlQUFPLEVBQUUsSUFBSSxFQUFKLElBQUksRUFBRSxPQUFPLEVBQVAsT0FBTyxFQUFFLGdCQUFnQixFQUFoQixnQkFBZ0IsRUFBRSxTQUFTLEVBQVQsU0FBUyxFQUFFLENBQUM7T0FDdkQ7O0FBRUQseUJBQXFCO2FBQUEsaUNBQUc7QUFDdEIsWUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ3ZDLFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7QUFDM0IsWUFBSSxLQUFLLENBQUMsSUFBSSxFQUFFO0FBQ2QsY0FBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ1gsaUJBQU8sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsSUFBSSxFQUFFLGlCQUFpQixFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUM7U0FDNUc7QUFDRCxZQUFJLE1BQU0sR0FBRyxDQUNYLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxJQUFJLEVBQUUsaUJBQWlCLEVBQUUsUUFBUSxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsYUFBYSxDQUFDLENBQ3ZHLENBQUM7QUFDRixlQUFPLElBQUksRUFBRTtBQUNYLGdCQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDO0FBQ3BDLGNBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUNqQyxrQkFBTSxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7V0FDNUI7QUFDRCxjQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7QUFDN0IsY0FBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO0FBQzNCLGNBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQztBQUNyQyxjQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO0FBQzVDLHVCQUFhLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ25DLGVBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDbkIsY0FBSSxLQUFLLENBQUMsSUFBSSxFQUFFO0FBQ2Qsa0JBQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLElBQUksRUFBRSxpQkFBaUIsRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxhQUFhLENBQUMsQ0FBQyxDQUFDO0FBQy9HLG1CQUFPLE1BQU0sQ0FBQztXQUNmLE1BQU07QUFDTCxrQkFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsSUFBSSxFQUFFLGlCQUFpQixFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUM7V0FDaEg7U0FDRjtPQUNGOztBQUVELDBCQUFzQjthQUFBLGtDQUFHO0FBQ3ZCLFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlCLFlBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLEVBQUU7QUFDL0MsZ0JBQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUM3QyxNQUFNO0FBQ0wsaUJBQU8sSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQztTQUN6QjtPQUNGOztBQUVELHVCQUFtQjthQUFBLCtCQUFHO0FBQ3BCLFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlCLFlBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztBQUNsQyxZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM5QixlQUFPLElBQUksQ0FBQztPQUNiOztBQUVELHNCQUFrQjthQUFBLDhCQUFHO0FBQ25CLFlBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUN2QyxZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUMzQixZQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQzlCLGNBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQzlDLGNBQUksS0FBSyxDQUFDLEtBQUssS0FBSyxRQUFRLEVBQUU7QUFDNUIsa0JBQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDO1dBQ3BDLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUU7QUFDL0Isa0JBQU0sSUFBSSxDQUFDLHVCQUF1QixDQUFDLGFBQWEsRUFBRSxhQUFhLENBQUMscUJBQXFCLENBQUMsQ0FBQztXQUN4RjtBQUNELGlCQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxJQUFJLEVBQUUscUJBQXFCLEVBQUUsRUFBRSxhQUFhLENBQUMsQ0FBQztTQUMxRTtBQUNELFlBQUksTUFBTSxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLDJCQUEyQixDQUFDLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztBQUNwRixlQUFPLElBQUksQ0FBQyxZQUFZLENBQUM7QUFDdkIsY0FBSSxFQUFFLGVBQWU7QUFDckIsZ0JBQU0sRUFBTixNQUFNO0FBQ04sbUJBQVMsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsR0FBRyxFQUFFO1NBQ3hFLEVBQUUsYUFBYSxDQUFDLENBQUM7T0FDbkI7O0FBRUQsMEJBQXNCO2FBQUEsa0NBQUc7QUFDdkIsWUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUNoQyxpQkFBTyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztTQUNwQzs7QUFFRCxZQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7O0FBRXZDLGlCQUFTLE9BQU8sQ0FBQyxJQUFJLEVBQUU7QUFDckIsaUJBQU8sRUFBRSxJQUFJLEVBQUosSUFBSSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQTtTQUN6RTtBQUNELGdCQUFRLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSTtBQUN6QixlQUFLLFNBQVMsQ0FBQyxLQUFLLENBQUM7QUFDckIsZUFBSyxTQUFTLENBQUMsVUFBVTtBQUN6QjtBQUNFLGtCQUFJLElBQUksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsSUFBSSxFQUFFLHNCQUFzQixFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsZUFBZSxFQUFFLEVBQUUsRUFBRSxhQUFhLENBQUMsQ0FBQztBQUM1RyxrQkFBSSxRQUFPLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLElBQUksRUFBRSxtQkFBbUIsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxFQUFFLGFBQWEsQ0FBQyxDQUFDO0FBQy9GLHFCQUFPLEVBQUUsSUFBSSxFQUFKLElBQUksRUFBRSxPQUFPLEVBQVAsUUFBTyxFQUFFLGdCQUFnQixFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLENBQUM7YUFDbkU7QUFBQSxBQUNELGVBQUssU0FBUyxDQUFDLE1BQU07QUFDbkIsbUJBQU8sT0FBTyxDQUFDLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLENBQUM7QUFBQSxBQUM1QyxlQUFLLFNBQVMsQ0FBQyxNQUFNO0FBQ25CLG1CQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDO0FBQUEsQUFDN0MsZUFBSyxTQUFTLENBQUMsSUFBSTtBQUNqQixnQkFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ1gsbUJBQU8sT0FBTyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsRUFBRSxhQUFhLENBQUMsQ0FBQyxDQUFDO0FBQUEsQUFDL0UsZUFBSyxTQUFTLENBQUMsUUFBUTtBQUNyQixtQkFBTyxPQUFPLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQztBQUFBLEFBQ3pGLGVBQUssU0FBUyxDQUFDLElBQUk7QUFDakIsZ0JBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUNYLG1CQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsSUFBSSxFQUFFLDBCQUEwQixFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsRUFBRSxhQUFhLENBQUMsQ0FBQyxDQUFDO0FBQUEsQUFDdEcsZUFBSyxTQUFTLENBQUMsS0FBSztBQUNsQixnQkFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ1gsbUJBQU8sT0FBTyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxJQUFJLEVBQUUsMEJBQTBCLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxFQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUM7QUFBQSxBQUN2RyxlQUFLLFNBQVMsQ0FBQyxJQUFJO0FBQ2pCLGdCQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDWCxtQkFBTyxPQUFPLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLElBQUksRUFBRSx1QkFBdUIsRUFBRSxFQUFFLGFBQWEsQ0FBQyxDQUFDLENBQUM7QUFBQSxBQUN0RixlQUFLLFNBQVMsQ0FBQyxNQUFNO0FBQ25CLG1CQUFPLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO0FBQUEsQUFDckMsZUFBSyxTQUFTLENBQUMsTUFBTTtBQUNuQixtQkFBTyxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztBQUFBLEFBQ3RDLGVBQUssU0FBUyxDQUFDLFFBQVE7QUFDckIsbUJBQU8sT0FBTyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUM7QUFDL0Isa0JBQUksRUFBRSxvQkFBb0I7QUFDMUIsaUJBQUcsRUFBRSxJQUFJO0FBQ1Qsc0JBQVEsRUFBRSxJQUFJLENBQUMscUJBQXFCLEVBQUU7YUFDdkMsRUFBRSxhQUFhLENBQUMsQ0FBQyxDQUFDO0FBQUEsQUFDckIsZUFBSyxTQUFTLENBQUMsR0FBRyxDQUFDO0FBQ25CLGVBQUssU0FBUyxDQUFDLFVBQVU7QUFDdkIsZ0JBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksS0FBSyxTQUFTLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQztBQUNyRixnQkFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ3ZCLGdCQUFJLFNBQVMsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUM3QyxnQkFBSSxPQUFPLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDbEUsZ0JBQUksS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUM3QyxnQkFBSTtBQUNGLG9CQUFNLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO2FBQ3hCLENBQUMsT0FBTyxNQUFNLEVBQUU7QUFDZixvQkFBTSxJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO2FBQ3JGO0FBQ0QsbUJBQU8sT0FBTyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxJQUFJLEVBQUUseUJBQXlCLEVBQUUsT0FBTyxFQUFQLE9BQU8sRUFBRSxLQUFLLEVBQUwsS0FBSyxFQUFFLEVBQUUsYUFBYSxDQUFDLENBQUMsQ0FBQztBQUFBLEFBQ3hHLGVBQUssU0FBUyxDQUFDLEtBQUs7QUFDbEIsbUJBQU8sT0FBTyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQUEsQUFDcEQ7QUFDRSxrQkFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7QUFBQSxTQUMzQztPQUNGOztBQUVELHVCQUFtQjthQUFBLCtCQUFHO0FBQ3BCLFlBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUN2QyxZQUFJLElBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUU7QUFDdkMsZ0JBQU0sSUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsYUFBYSxDQUFDLG9CQUFvQixDQUFDLENBQUM7U0FDeEY7QUFDRCxZQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDeEIsWUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLE1BQU0sS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHO0FBQ25DLGNBQUksRUFBRSwyQkFBMkI7U0FDbEMsR0FBRztBQUNGLGNBQUksRUFBRSwwQkFBMEI7QUFDaEMsZUFBSyxFQUFFLE1BQU0sQ0FBQyxNQUFNO1NBQ3JCLENBQUM7QUFDRixlQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLGFBQWEsQ0FBQyxDQUFDO09BQy9DOztBQUVELHNCQUFrQjthQUFBLDhCQUFHO0FBQ25CLFlBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUN2QyxZQUFJLElBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUU7QUFDdkMsZ0JBQU0sSUFBSSxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsYUFBYSxDQUFDLG9CQUFvQixDQUFDLENBQUM7U0FDeEY7QUFDRCxZQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDeEIsZUFBTyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsSUFBSSxFQUFFLHlCQUF5QixFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsTUFBTSxFQUFFLEVBQUUsYUFBYSxDQUFDLENBQUM7T0FDcEc7O0FBRUQsdUJBQW1CO2FBQUEsK0JBQUc7QUFDcEIsWUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLEVBQUU7QUFDOUMsaUJBQU8sSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQztTQUN6QixNQUFNO0FBQ0wsZ0JBQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUM3QztPQUNGOztBQUVELDBCQUFzQjthQUFBLGtDQUFHO0FBQ3ZCLFlBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUN2QyxlQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxJQUFJLEVBQUUsbUJBQW1CLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxlQUFlLEVBQUUsRUFBRSxFQUFFLGFBQWEsQ0FBQyxDQUFDO09BQ3RHOztBQUVELG1CQUFlO2FBQUEsMkJBQUc7QUFDaEIsWUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUMvQixjQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7QUFDZixnQkFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQztBQUN0QyxrQkFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1dBQzdDLE1BQU0sSUFBSSxJQUFJLENBQUMsb0JBQW9CLEVBQUU7QUFDcEMsa0JBQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztXQUM3QyxNQUFNLElBQUksSUFBSSxDQUFDLGVBQWUsRUFBRTtBQUMvQixrQkFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1dBQzdDLE1BQU07QUFDTCxtQkFBTyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDO1dBQ3pCO1NBQ0Y7QUFDRCxlQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLEtBQUssQ0FBQztPQUNoRDs7QUFFRCxxQkFBaUI7YUFBQSw2QkFBRztBQUNsQixZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM5QixZQUFJLElBQUksR0FBRyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDakMsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUIsZUFBTyxJQUFJLENBQUM7T0FDYjs7QUFFRCxrQkFBYzthQUFBLDBCQUFHO0FBQ2YsWUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDO0FBQ2hCLGVBQU8sSUFBSSxFQUFFO0FBQ1gsY0FBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsR0FBRyxFQUFFLEVBQUU7QUFDOUMsbUJBQU8sTUFBTSxDQUFDO1dBQ2Y7QUFDRCxjQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDdkMsY0FBSSxHQUFHLFlBQUEsQ0FBQztBQUNSLGNBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLEVBQUU7QUFDaEMsZUFBRyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxJQUFJLEVBQUUsZUFBZSxFQUFFLFVBQVUsRUFBRSxJQUFJLENBQUMseUJBQXlCLEVBQUUsRUFBRSxFQUFFLGFBQWEsQ0FBQyxDQUFDO1dBQ2pILE1BQU07QUFDTCxlQUFHLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUM7V0FDeEM7QUFDRCxnQkFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNqQixjQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDOUIsa0JBQU07V0FDUDtTQUNGO0FBQ0QsZUFBTyxNQUFNLENBQUM7T0FDZjs7QUFJRCxlQUFXOzs7O2FBQUEsdUJBQUc7QUFDWixZQUFJLElBQUksQ0FBQywyQkFBMkIsRUFBRTtBQUNwQyxnQkFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1NBQ2xFO0FBQ0QsWUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFO0FBQ2hDLGNBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQzlCO09BQ0Y7O0FBRUQsd0JBQW9CO2FBQUEsZ0NBQUc7Ozs7Ozs7QUFLckIsWUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDO0FBQ2hCLFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzFDLFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7QUFDM0IsWUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUM5QixjQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDbkIsaUJBQU87QUFDTCxnQkFBSSxFQUFFLElBQUk7QUFDVixtQkFBTyxFQUFFO0FBQ1Asa0JBQUksRUFBRSx1QkFBdUI7QUFDN0Isb0JBQU0sRUFBRSxFQUFFO0FBQ1Ysa0JBQUksRUFBRSxJQUFJO2FBQ1g7QUFDRCw0QkFBZ0IsRUFBRSxLQUFLO0FBQ3ZCLHFCQUFTLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxFQUN4QyxDQUFDO1NBQ0gsTUFBTSxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxFQUFFO0FBQ3ZDLGNBQUksR0FBRyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztBQUNyQyxjQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM5QixjQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7QUFDbkIsaUJBQU87QUFDTCxnQkFBSSxFQUFFLElBQUk7QUFDVixtQkFBTyxFQUFFO0FBQ1Asa0JBQUksRUFBRSx1QkFBdUI7QUFDN0Isb0JBQU0sRUFBRSxFQUFFO0FBQ1Ysa0JBQUksRUFBRSxJQUFJO2FBQ1g7QUFDRCw0QkFBZ0IsRUFBRSxLQUFLO0FBQ3ZCLHFCQUFTLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxFQUN4QyxDQUFDO1NBQ0g7O0FBR0QsWUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDOzt5REFNakMsSUFBSSxDQUFDLHlDQUF5QyxFQUFFOztZQUo5QyxLQUFLLDhDQUFYLElBQUk7WUFDSyxnQkFBZ0IsOENBQXpCLE9BQU87WUFDVyxnQkFBZ0IsOENBQWxDLGdCQUFnQjtZQUNMLGNBQWMsOENBQXpCLFNBQVM7O0FBR1gsWUFBSSxNQUFNLEdBQUcsZ0JBQWdCLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLElBQUksQ0FBQzs7QUFFMUQsZUFBTyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUNoQywwQkFBZ0IsR0FBRyxJQUFJLENBQUM7QUFDeEIsY0FBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsRUFBRTtBQUNsQyxnQkFBSSxDQUFDLGdCQUFnQixFQUFFO0FBQ3JCLG9CQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7YUFDN0M7QUFDRCxnQkFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ1gsZ0JBQUksR0FBRyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztBQUNyQyxrQkFBTTtXQUNQOztBQUVELGNBQUksQ0FBQyxLQUFLLEVBQUU7O0FBRVYsZ0JBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO0FBQ3pDLGtCQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1dBQ3RCLE1BQU07QUFDTCxnQkFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDOzs7OERBRWUsSUFBSSxDQUFDLHlDQUF5QyxFQUFFOztnQkFBL0YsSUFBSSwrQ0FBSixJQUFJO2dCQUFFLE9BQU8sK0NBQVAsT0FBTztnQkFBRSxnQkFBZ0IsK0NBQWhCLGdCQUFnQjtnQkFBRSxTQUFTLCtDQUFULFNBQVM7O0FBQ2hELGdCQUFJLENBQUMsZ0JBQWdCLEVBQUU7QUFDckIsOEJBQWdCLEdBQUcsS0FBSyxDQUFDO0FBQ3pCLG9CQUFNLEdBQUcsSUFBSSxDQUFDO2FBQ2YsTUFBTSxJQUFJLE1BQU0sRUFBRTtBQUNqQixvQkFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQzthQUN0QjtBQUNELGdCQUFJLENBQUMsSUFBSSxFQUFFO0FBQ1QsNEJBQWMsR0FBRyxjQUFjLElBQUksU0FBUyxDQUFDO0FBQzdDLG1CQUFLLEdBQUcsSUFBSSxDQUFDO0FBQ2Isa0JBQUksQ0FBQyxNQUFNLEVBQUU7QUFDWCxzQkFBTSxjQUFjLENBQUM7ZUFDdEI7YUFDRixNQUFNO0FBQ0wsbUJBQUssR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDO0FBQ3hCLG9CQUFJLEVBQUUsa0JBQWtCO0FBQ3hCLG9CQUFJLEVBQUUsS0FBSztBQUNYLHdCQUFRLEVBQUUsR0FBRztBQUNiLHFCQUFLLEVBQUUsSUFBSTtlQUNaLEVBQUUsYUFBYSxDQUFDLENBQUM7YUFDbkI7V0FDRjtTQUNGOztBQUVELFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDOztBQUU5QixZQUFJLENBQUMsSUFBSSxDQUFDLDJCQUEyQixJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFOztBQUNwRSxnQkFBSSxDQUFDLGdCQUFnQixFQUFFO0FBQ3JCLG9CQUFNLE1BQUssdUJBQXVCLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO2FBQ3hGOztBQUVELGdCQUFJLGFBQWEsR0FBRyxFQUFFLENBQUM7O0FBRXZCLGtCQUFNLENBQUMsT0FBTyxDQUFDLFVBQUEsSUFBSSxFQUFJO0FBQ3JCLDJCQUFhLEdBQUcsYUFBYSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7YUFDL0QsQ0FBQyxDQUFDOztBQUVILGdCQUFJLElBQUksRUFBRTtBQUNSLDJCQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUMvQjs7QUFFRCxnQkFBSSxjQUFjLENBQUMsYUFBYSxDQUFDLElBQUksSUFBSSxFQUFFO0FBQ3pDLG9CQUFNLE1BQUssV0FBVyxDQUFDLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO2FBQ3pEOztBQUVELGdCQUFJLG9CQUFvQixHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUNoRSxnQkFBSSxvQkFBb0IsRUFBRTtBQUN4QixvQkFBTSxNQUFLLFdBQVcsQ0FBQyxhQUFhLENBQUMsaUJBQWlCLENBQUMsQ0FBQzthQUN6RDs7QUFFRCxnQkFBSSxrQkFBa0IsR0FBRyx5QkFBeUIsQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUNsRSxnQkFBSSxrQkFBa0IsRUFBRTtBQUN0QixvQkFBTSxNQUFLLFdBQVcsQ0FBQyxhQUFhLENBQUMsb0JBQW9CLENBQUMsQ0FBQzthQUM1RDs7QUFFRDtpQkFBTztBQUNMLG9CQUFJLEVBQUUsSUFBSTtBQUNWLHVCQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsdUJBQXVCLEVBQUUsTUFBTSxFQUFOLE1BQU0sRUFBRSxJQUFJLEVBQUosSUFBSSxFQUFFO0FBQ3hELGdDQUFnQixFQUFFLEtBQUs7QUFDdkIseUJBQVMsRUFBRSxNQUFLLGdCQUFnQixDQUFDLE1BQUssU0FBUyxDQUFDLEVBQ2pEO2NBQUM7Ozs7Ozs7O1NBQ0gsTUFBTTs7QUFFTCxjQUFJLElBQUksRUFBRTtBQUNSLGdCQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7V0FDcEI7QUFDRCxjQUFJLENBQUMsS0FBSyxFQUFFO0FBQ1Ysa0JBQU0sY0FBYyxDQUFDO1dBQ3RCO0FBQ0QsaUJBQU87QUFDTCxnQkFBSSxFQUFFLEtBQUs7QUFDWCxtQkFBTyxFQUFFLGdCQUFnQjtBQUN6Qiw0QkFBZ0IsRUFBRSxLQUFLO0FBQ3ZCLHFCQUFTLEVBQUUsSUFBSTtXQUNoQixDQUFDO1NBQ0g7T0FDRjs7QUFFRCx3QkFBb0I7YUFBQSxnQ0FBRztBQUNyQixZQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7O0FBRXZDLFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDOztBQUU5QixZQUFJLEtBQUssR0FBRyxFQUFFO1lBQUUsUUFBUSxHQUFHLEVBQUU7WUFBRSxXQUFXLEdBQUcsSUFBSTtZQUFFLGtCQUFrQixHQUFHLElBQUk7WUFBRSxjQUFjLEdBQUcsSUFBSSxDQUFDOztBQUVwRyxlQUFPLElBQUksRUFBRTtBQUNYLGNBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUU7QUFDaEMsa0JBQU07V0FDUDtBQUNELGNBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDN0IsaUJBQUssSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzFCLG9CQUFRLElBQUksUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztXQUNqQyxNQUFNO0FBQ0wsZ0JBQUksZUFBZSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUN6QyxnQkFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsRUFBRTs7OytEQUVxQixJQUFJLENBQUMseUNBQXlDLEVBQUU7O2tCQUEvRixJQUFJLDhDQUFKLElBQUk7a0JBQUUsT0FBTyw4Q0FBUCxPQUFPO2tCQUFFLGdCQUFnQiw4Q0FBaEIsZ0JBQWdCO2tCQUFFLFNBQVMsOENBQVQsU0FBUzs7QUFDaEQsNEJBQWMsR0FBRyxjQUFjLElBQUksU0FBUyxDQUFDOztBQUU3QyxnQ0FBa0IsR0FBRyxrQkFBa0IsSUFBSSxnQkFBZ0IsQ0FBQzs7QUFFNUQsa0JBQUksQ0FBQyxJQUFJLEVBQUU7QUFDVCxxQkFBSyxHQUFHLElBQUksQ0FBQztBQUNiLG9CQUFJLENBQUMsUUFBUSxFQUFFO0FBQ2Isd0JBQU0sY0FBYyxDQUFDO2lCQUN0QjtlQUNGLE1BQU07QUFDTCxvQkFBSSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxJQUFJLEVBQUUsZUFBZSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsRUFBRSxlQUFlLENBQUMsQ0FBQztlQUN4Rjs7QUFFRCxrQkFBSSxDQUFDLE9BQU8sRUFBRTtBQUNaLHdCQUFRLEdBQUcsSUFBSSxDQUFDO0FBQ2hCLG9CQUFJLENBQUMsS0FBSyxFQUFFO0FBQ1Ysd0JBQU0sY0FBYyxDQUFDO2lCQUN0QjtlQUNGLE1BQU0sSUFBSSxRQUFRLEVBQUU7O0FBRW5CLDJCQUFXLEdBQUcsT0FBTyxDQUFDO2VBQ3ZCOztBQUVELG1CQUFLLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUMzQixNQUFNO2dFQUNnRCxJQUFJLENBQUMseUNBQXlDLEVBQUU7O2tCQUEvRixJQUFJLCtDQUFKLElBQUk7a0JBQUUsT0FBTywrQ0FBUCxPQUFPO2tCQUFFLGdCQUFnQiwrQ0FBaEIsZ0JBQWdCO2tCQUFFLFNBQVMsK0NBQVQsU0FBUzs7QUFFaEQsZ0NBQWtCLEdBQUcsa0JBQWtCLElBQUksZ0JBQWdCLENBQUM7O0FBRTVELGtCQUFJLENBQUMsSUFBSSxFQUFFO0FBQ1QsOEJBQWMsR0FBRyxjQUFjLElBQUksU0FBUyxDQUFDO0FBQzdDLHFCQUFLLEdBQUcsSUFBSSxDQUFDO0FBQ2Isb0JBQUksQ0FBQyxRQUFRLEVBQUU7QUFDYix3QkFBTSxTQUFTLENBQUM7aUJBQ2pCO2VBQ0Y7QUFDRCxrQkFBSSxDQUFDLE9BQU8sRUFBRTtBQUNaLHdCQUFRLEdBQUcsSUFBSSxDQUFDO0FBQ2hCLG9CQUFJLENBQUMsS0FBSyxFQUFFO0FBQ1Ysd0JBQU0sY0FBYyxDQUFDO2lCQUN0QjtlQUNGO0FBQ0QsbUJBQUssSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzFCLHNCQUFRLElBQUksUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQzthQUNwQzs7QUFFRCxnQkFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQ2pDLGtCQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUM3QixrQkFBSSxXQUFXLEVBQUU7QUFDZix3QkFBUSxHQUFHLElBQUksQ0FBQztBQUNoQixrQ0FBa0IsR0FBRyxLQUFLLENBQUM7ZUFDNUI7YUFDRjtXQUNGO1NBQ0Y7O0FBRUQsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7O0FBRTlCLGVBQU87QUFDTCxjQUFJLEVBQUUsS0FBSyxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxJQUFJLEVBQUUsaUJBQWlCLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxFQUFFLGFBQWEsQ0FBQztBQUM3RixpQkFBTyxFQUFFLFFBQVEsSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBWCxXQUFXLEVBQUUsRUFBRSxhQUFhLENBQUM7QUFDaEgsMEJBQWdCLEVBQUUsa0JBQWtCO0FBQ3BDLG1CQUFTLEVBQUUsY0FBYztTQUMxQixDQUFDO09BQ0g7O0FBRUQseUJBQXFCO2FBQUEsaUNBQUc7QUFDdEIsWUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDOztBQUV2QyxZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQzs7QUFFOUIsWUFBSSxVQUFVLEdBQUcsRUFBRTtZQUFFLGlCQUFpQixHQUFHLEVBQUU7WUFBRSxnQkFBZ0IsR0FBRyxJQUFJO1lBQUUsU0FBUyxHQUFHLElBQUksQ0FBQztBQUN2RixZQUFJLFlBQVksR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzNCLGVBQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRTt5Q0FNOUIsSUFBSSxDQUFDLHVCQUF1QixDQUFDLFlBQVksQ0FBQzs7Y0FKOUMsUUFBUSw0QkFBUixRQUFRO2NBQ1IsZUFBZSw0QkFBZixlQUFlO2NBQ0csb0JBQW9CLDRCQUF0QyxnQkFBZ0I7Y0FDTCxhQUFhLDRCQUF4QixTQUFTOztBQUVYLGNBQUksVUFBVSxFQUFFO0FBQ2QsZ0JBQUksUUFBUSxFQUFFO0FBQ1osd0JBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7YUFDM0IsTUFBTTtBQUNMLHVCQUFTLEdBQUcsU0FBUyxJQUFJLGFBQWEsQ0FBQztBQUN2Qyx3QkFBVSxHQUFHLElBQUksQ0FBQzthQUNuQjtXQUNGOztBQUVELGNBQUksaUJBQWlCLEVBQUU7QUFDckIsZ0JBQUksZUFBZSxFQUFFO0FBQ25CLCtCQUFpQixDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztBQUN4Qyw4QkFBZ0IsR0FBRyxnQkFBZ0IsSUFBSSxvQkFBb0IsQ0FBQzthQUM3RCxNQUFNO0FBQ0wsK0JBQWlCLEdBQUcsS0FBSyxDQUFDO0FBQzFCLDhCQUFnQixHQUFHLEtBQUssQ0FBQzthQUMxQjtXQUNGOztBQUVELGNBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUNqQyxnQkFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7V0FDOUI7U0FDRjs7QUFFRCxZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQzs7QUFFOUIsZUFBTztBQUNMLGNBQUksRUFBRSxVQUFVLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLElBQUksRUFBRSxrQkFBa0IsRUFBRSxVQUFVLEVBQVYsVUFBVSxFQUFFLEVBQUUsYUFBYSxDQUFDO0FBQzlGLGlCQUFPLEVBQUUsaUJBQWlCLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQztBQUM5QyxnQkFBSSxFQUFFLGVBQWU7QUFDckIsc0JBQVUsRUFBRSxpQkFBaUI7V0FDOUIsRUFBRSxhQUFhLENBQUM7QUFDakIsMEJBQWdCLEVBQWhCLGdCQUFnQjtBQUNoQixtQkFBUyxFQUFULFNBQVM7U0FDVixDQUFDO09BQ0g7O0FBRUQsMkJBQXVCO2FBQUEsaUNBQUMsWUFBWSxFQUFFO0FBQ3BDLFlBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUN2QyxZQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDOztxQ0FFUSxJQUFJLENBQUMscUJBQXFCLENBQUMsS0FBSyxDQUFDOztZQUEvRCxXQUFXLDBCQUFYLFdBQVc7WUFBRSxJQUFJLDBCQUFKLElBQUk7WUFBRSxPQUFPLDBCQUFQLE9BQU87O0FBQy9CLGdCQUFRLElBQUk7QUFDVixlQUFLLFFBQVE7QUFDWCxtQkFBTztBQUNMLHNCQUFRLEVBQUUsV0FBVztBQUNyQiw2QkFBZSxFQUFFLElBQUk7QUFDckIsOEJBQWdCLEVBQUUsS0FBSztBQUN2Qix1QkFBUyxFQUFFLElBQUksRUFDaEIsQ0FBQztBQUFBLEFBQ0osZUFBSyxZQUFZOztBQUNmLGdCQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFOztBQUU5QixrQkFBSSxXQUFXLENBQUMsS0FBSyxLQUFLLE9BQU8sS0FDOUIsSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsb0JBQW9CLElBQUksSUFBSSxDQUFDLGVBQWUsSUFBSSxJQUFJLENBQUMsb0JBQW9CLENBQUEsQUFBQyxFQUFFO0FBQ2pHLHNCQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztlQUNwQztBQUNELGtCQUFJLElBQUksR0FBRyxJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQztBQUM1QyxxQkFBTztBQUNMLHdCQUFRLEVBQUUsSUFBSTtBQUNkLCtCQUFlLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLElBQUksRUFBRSwyQkFBMkIsRUFBRSxPQUFPLEVBQVAsT0FBTyxFQUFFLElBQUksRUFBSixJQUFJLEVBQUcsRUFBRSxhQUFhLENBQUM7QUFDeEcsZ0NBQWdCLEVBQUUsSUFBSTtBQUN0Qix5QkFBUyxFQUFFLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxhQUFhLEVBQUUsYUFBYSxDQUFDLGdCQUFnQixDQUFDO2VBQ3ZGLENBQUM7YUFDSCxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUN2QyxrQkFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQyxVQUFVLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxTQUFTLENBQUMsS0FBSyxJQUN2RSxDQUFDLElBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLG9CQUFvQixDQUFBLElBQUssV0FBVyxDQUFDLEtBQUssS0FBSyxPQUFPLEVBQUU7QUFDN0Usc0JBQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDO2VBQ3BDO0FBQ0QscUJBQU87QUFDTCx3QkFBUSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxJQUFJLEVBQUUsbUJBQW1CLEVBQUUsSUFBSSxFQUFFLFdBQVcsQ0FBQyxLQUFLLEVBQUUsRUFBRSxhQUFhLENBQUM7QUFDbEcsK0JBQWUsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDO0FBQ2pDLHNCQUFJLEVBQUUsMkJBQTJCO0FBQ2pDLHlCQUFPLEVBQUUsT0FBTztBQUNoQixzQkFBSSxFQUFFLElBQUksRUFDWCxFQUFFLGFBQWEsQ0FBQztBQUNqQixnQ0FBZ0IsRUFBRSxJQUFJO0FBQ3RCLHlCQUFTLEVBQUUsSUFBSTtlQUNoQixDQUFBO2FBQ0Y7QUFBQSxTQUNKOzs7QUFHRCxZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUM3QixZQUFJLFdBQVcsQ0FBQyxJQUFJLEtBQUssb0JBQW9CLEVBQUU7QUFDN0MsY0FBSSxXQUFXLENBQUMsS0FBSyxLQUFLLFdBQVcsRUFBRTtBQUNyQyxnQkFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsRUFBRTtBQUNwQiwwQkFBWSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQzthQUN4QixNQUFNO0FBQ0wsb0JBQU0sSUFBSSxDQUFDLHVCQUF1QixDQUFDLEtBQUssRUFBRSxhQUFhLENBQUMsd0JBQXdCLENBQUMsQ0FBQzthQUNuRjtXQUNGO1NBQ0Y7O3lEQUVvRCxJQUFJLENBQUMseUNBQXlDLEVBQUU7O1lBQS9GLElBQUksOENBQUosSUFBSTtZQUFFLE9BQU8sOENBQVAsT0FBTztZQUFFLGdCQUFnQiw4Q0FBaEIsZ0JBQWdCO1lBQUUsU0FBUyw4Q0FBVCxTQUFTOztBQUNoRCxlQUFPO0FBQ0wsa0JBQVEsRUFBRSxJQUFJLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQztBQUNsQyxnQkFBSSxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLFVBQVUsRUFBRSxJQUFJO1dBQzFELEVBQUUsYUFBYSxDQUFDO0FBQ2pCLHlCQUFlLEVBQUUsT0FBTyxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUM7QUFDNUMsZ0JBQUksRUFBRSx5QkFBeUI7QUFDL0IsZ0JBQUksRUFBRSxXQUFXO0FBQ2pCLG1CQUFPLEVBQUUsT0FBTztXQUNqQixFQUFFLGFBQWEsQ0FBQztBQUNqQiwwQkFBZ0IsRUFBaEIsZ0JBQWdCO0FBQ2hCLG1CQUFTLEVBQVQsU0FBUyxFQUNWLENBQUM7T0FDSDs7QUFFRCxxQkFBaUI7YUFBQSw2QkFBRzs7QUFFbEIsWUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztBQUMzQixZQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7O0FBRXZDLFlBQUksSUFBSSxDQUFDLEdBQUcsRUFBRSxFQUFFO0FBQ2QsZ0JBQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ3BDOztBQUVELGdCQUFRLEtBQUssQ0FBQyxJQUFJO0FBQ2hCLGVBQUssU0FBUyxDQUFDLE1BQU07QUFDbkIsbUJBQU87QUFDTCxrQkFBSSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUM7QUFDdEIsb0JBQUksRUFBRSxvQkFBb0I7QUFDMUIscUJBQUssRUFBRSxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQyxLQUFLO2VBQ3ZDLEVBQUUsYUFBYSxDQUFDO0FBQ2pCLHFCQUFPLEVBQUUsSUFBSTthQUNkLENBQUM7QUFBQSxBQUNKLGVBQUssU0FBUyxDQUFDLE1BQU07QUFDbkIsZ0JBQUksVUFBVSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO0FBQzVDLG1CQUFPO0FBQ0wsa0JBQUksRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDO0FBQ3RCLG9CQUFJLEVBQUUsb0JBQW9CO0FBQzFCLHFCQUFLLEVBQUUsVUFBVSxDQUFDLElBQUksS0FBSywyQkFBMkIsR0FBRyxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxVQUFVLENBQUMsS0FBSztlQUN2RixFQUFFLGFBQWEsQ0FBQztBQUNqQixxQkFBTyxFQUFFLElBQUk7YUFDZCxDQUFDO0FBQUEsQUFDSixlQUFLLFNBQVMsQ0FBQyxNQUFNO0FBQ25CLGdCQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsb0JBQW9CLENBQUM7QUFDOUMsZ0JBQUksSUFBSSxDQUFDLG9CQUFvQixFQUFFO0FBQzdCLGtCQUFJLENBQUMsb0JBQW9CLEdBQUcsS0FBSyxDQUFDO2FBQ25DO0FBQ0QsZ0JBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlCLGdCQUFJLElBQUksR0FBRyxJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQztBQUM1QyxnQkFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUIsZ0JBQUksQ0FBQyxvQkFBb0IsR0FBRyxhQUFhLENBQUM7QUFDMUMsbUJBQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLElBQUksRUFBRSxzQkFBc0IsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLEVBQUUsYUFBYSxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDO0FBQUEsU0FDeEg7O0FBRUQsWUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7QUFDdEMsZUFBTztBQUNMLGNBQUksRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsSUFBSSxFQUFFLG9CQUFvQixFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsRUFBRSxhQUFhLENBQUM7QUFDbkYsaUJBQU8sRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsSUFBSSxFQUFFLG1CQUFtQixFQUFFLElBQUksRUFBSixJQUFJLEVBQUUsRUFBRSxhQUFhLENBQUMsRUFDL0UsQ0FBQTtPQUNGOztBQU1ELHlCQUFxQjs7Ozs7OzthQUFBLGlDQUFHO0FBQ3RCLGdCQUFRLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSTtBQUN6QixlQUFLLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFDdEIsZUFBSyxTQUFTLENBQUMsTUFBTSxDQUFDO0FBQ3RCLGVBQUssU0FBUyxDQUFDLE1BQU07QUFDbkIsbUJBQU8sSUFBSSxDQUFDO0FBQUEsQUFDZDtBQUNFLG1CQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQztBQUFBLFNBQ3JEO09BQ0Y7O0FBYUQseUJBQXFCOzs7Ozs7Ozs7Ozs7OzthQUFBLCtCQUFDLGtCQUFrQixFQUFFO0FBQ3hDLFlBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7QUFDM0IsWUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDOztBQUV2QyxZQUFJLFdBQVcsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7O2lDQUV0QixJQUFJLENBQUMsaUJBQWlCLEVBQUU7O1lBQXpDLElBQUksc0JBQUosSUFBSTtZQUFFLE9BQU8sc0JBQVAsT0FBTzs7QUFFbEIsWUFBSSxDQUFDLFdBQVcsSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQyxVQUFVLEVBQUU7QUFDdkQsY0FBSSxLQUFJLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQztBQUN2QixjQUFJLEtBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFOztBQUVyQixnQkFBSSxLQUFJLEtBQUssS0FBSyxJQUFJLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxFQUFFO3lCQUN4QyxJQUFJLENBQUMsaUJBQWlCLEVBQUU7O0FBQWhDLG1CQUFJLFFBQUosSUFBSTs7QUFDTixrQkFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUIsa0JBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlCLGtCQUFJLHFCQUFxQixHQUFHLElBQUksQ0FBQyxhQUFhLENBQUM7QUFDL0Msa0JBQUksQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDO0FBQzNCLGtCQUFJLGdCQUFnQixHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7QUFDckMsa0JBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDOzt1Q0FDUixJQUFJLENBQUMsaUJBQWlCLENBQUMsRUFBRSxDQUFDOzs7O2tCQUFsQyxJQUFJOztBQUNULGtCQUFJLENBQUMsYUFBYSxHQUFHLHFCQUFxQixDQUFDO0FBQzNDLGtCQUFJLENBQUMsUUFBUSxHQUFHLGdCQUFnQixDQUFDO0FBQ2pDLHFCQUFPO0FBQ0wsMkJBQVcsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUosS0FBSSxFQUFFLElBQUksRUFBSixJQUFJLEVBQUUsRUFBRSxhQUFhLENBQUM7QUFDN0Usb0JBQUksRUFBRSxRQUFRO2VBQ2YsQ0FBQzthQUNILE1BQU0sSUFBSSxLQUFJLEtBQUssS0FBSyxJQUFJLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxFQUFFOzBCQUMvQyxJQUFJLENBQUMsaUJBQWlCLEVBQUU7O0FBQWhDLG1CQUFJLFNBQUosSUFBSTs7QUFDTixrQkFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUIsa0JBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO0FBQ3ZDLGtCQUFJLElBQUksR0FBRyxFQUFFLENBQUM7QUFDZCxrQkFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUN4QyxrQkFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUIsa0JBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQztBQUM5QyxrQkFBSSxDQUFDLG9CQUFvQixHQUFHLEtBQUssQ0FBQztBQUNsQyxrQkFBSSxxQkFBcUIsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDO0FBQy9DLGtCQUFJLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQztBQUMzQixrQkFBSSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO0FBQ3JDLGtCQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztBQUNyQixrQkFBSSxXQUFXLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQzs7d0NBQ3BCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxXQUFXLENBQUM7Ozs7a0JBQXJELElBQUk7a0JBQUUsUUFBUTs7QUFDbkIsa0JBQUksQ0FBQyxvQkFBb0IsR0FBRyxhQUFhLENBQUM7QUFDMUMsa0JBQUksQ0FBQyxhQUFhLEdBQUcscUJBQXFCLENBQUM7QUFDM0Msa0JBQUksQ0FBQyxRQUFRLEdBQUcsZ0JBQWdCLENBQUM7QUFDakMsa0JBQUksUUFBUSxFQUFFO0FBQ1osb0JBQUksSUFBSSxDQUFDLGVBQWUsRUFBRTtBQUN4Qix3QkFBTSxJQUFJLENBQUMsdUJBQXVCLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7aUJBQ3hFO2VBQ0Y7QUFDRCxxQkFBTztBQUNMLDJCQUFXLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFKLEtBQUksRUFBRSxLQUFLLEVBQUwsS0FBSyxFQUFFLElBQUksRUFBSixJQUFJLEVBQUUsRUFBRSxhQUFhLENBQUM7QUFDcEYsb0JBQUksRUFBRSxRQUFRO2VBQ2YsQ0FBQzthQUNIO1dBQ0Y7U0FDRjs7QUFFRCxZQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQ2hDLGNBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQztBQUM5QyxjQUFJLDRCQUE0QixHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQztBQUM3RCxjQUFJLENBQUMsb0JBQW9CLEdBQUcsV0FBVyxDQUFDO0FBQ3hDLGNBQUksQ0FBQyxvQkFBb0IsR0FBRyxXQUFXLENBQUM7QUFDeEMsY0FBSSxjQUFjLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ3hDLGNBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDdkMsY0FBSSxDQUFDLG9CQUFvQixHQUFHLDRCQUE0QixDQUFDO0FBQ3pELGNBQUksQ0FBQyxvQkFBb0IsR0FBRyxhQUFhLENBQUM7QUFDMUMsY0FBSSx1QkFBdUIsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDO0FBQ25ELGNBQUkscUJBQXFCLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQztBQUMvQyxjQUFJLGdCQUFnQixHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7QUFDckMsY0FBSSxDQUFDLG9CQUFvQixHQUFHLFdBQVcsQ0FBQztBQUN4QyxjQUFJLENBQUMsYUFBYSxHQUNoQixrQkFBa0IsSUFBSSxDQUFDLFdBQVcsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLElBQzNELElBQUksQ0FBQyxJQUFJLEtBQUssb0JBQW9CLElBQUksSUFBSSxDQUFDLEtBQUssS0FBSyxhQUFhLENBQUM7QUFDckUsY0FBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7O0FBRXJCLGNBQUksV0FBVyxFQUFFO0FBQ2YsZ0JBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDO1dBQzdCO0FBQ0QsY0FBSSxXQUFXLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLFNBQVMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDOztBQUUvRSxjQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsSUFBSSxFQUFFLGtCQUFrQixFQUFFLEtBQUssRUFBRSxTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxTQUFTLENBQUMsSUFBSSxFQUFFLEVBQUUsY0FBYyxDQUFDLENBQUM7O29DQUUvRyxJQUFJLENBQUMsaUJBQWlCLENBQUMsV0FBVyxDQUFDOzs7O2NBQTNDLElBQUk7O0FBQ1QsY0FBSSxDQUFDLG9CQUFvQixHQUFHLGFBQWEsQ0FBQztBQUMxQyxjQUFJLENBQUMsZUFBZSxHQUFHLHVCQUF1QixDQUFDO0FBQy9DLGNBQUksQ0FBQyxhQUFhLEdBQUcscUJBQXFCLENBQUM7QUFDM0MsY0FBSSxDQUFDLFFBQVEsR0FBRyxnQkFBZ0IsQ0FBQzs7QUFFakMsY0FBSSxTQUFTLENBQUMsZUFBZSxFQUFFO0FBQzdCLGtCQUFNLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxTQUFTLENBQUMsZUFBZSxFQUFFLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztXQUNsRjs7QUFFRCxpQkFBTztBQUNMLHVCQUFXLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsV0FBVyxFQUFYLFdBQVcsRUFBRSxJQUFJLEVBQUosSUFBSSxFQUFFLE1BQU0sRUFBTixNQUFNLEVBQUUsSUFBSSxFQUFKLElBQUksRUFBRSxFQUFFLGFBQWEsQ0FBQztBQUNsRyxnQkFBSSxFQUFFLFFBQVE7V0FDZixDQUFDO1NBQ0g7O0FBRUQsZUFBTztBQUNMLHFCQUFXLEVBQUUsSUFBSTtBQUNqQixjQUFJLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLEdBQUcsWUFBWSxHQUFHLFVBQVU7QUFDbkUsaUJBQU8sRUFBRSxPQUFPO1NBQ2pCLENBQUM7T0FDSDs7QUFFRCxjQUFVO2FBQUEsMEJBQThCO1lBQTVCLE1BQU0sUUFBTixNQUFNO2tDQUFFLFNBQVM7WUFBVCxTQUFTLGtDQUFHLEtBQUs7O0FBQ25DLFlBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUNsQyxZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUM3QixZQUFJLElBQUksR0FBRyxJQUFJLENBQUM7QUFDaEIsWUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDOztBQUVwQixZQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxFQUFFO0FBQ3BDLGNBQUksVUFBVSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUNwQyxjQUFJLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7U0FDdEMsTUFBTSxJQUFJLENBQUMsTUFBTSxFQUFFO0FBQ2xCLGNBQUksU0FBUyxFQUFFO0FBQ2IsZ0JBQUksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsSUFBSSxFQUFFLG1CQUFtQixFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQztXQUN0RixNQUFNO0FBQ0wsa0JBQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztXQUM3QztTQUNGOztBQUVELFlBQUksNEJBQTRCLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDO0FBQzdELFlBQUksa0JBQWtCLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDO0FBQ25ELFlBQUksd0JBQXdCLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDO0FBQ3JELFlBQUksTUFBTSxFQUFFO0FBQ1YsY0FBSSxDQUFDLG9CQUFvQixHQUFHLEtBQUssQ0FBQztBQUNsQyxjQUFJLENBQUMsb0JBQW9CLEdBQUcsS0FBSyxDQUFDO1NBQ25DO0FBQ0QsWUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsRUFBRTtBQUMvQixrQkFBUSxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLDJCQUEyQixDQUFDLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztTQUNsRjs7QUFFRCxZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM5QixZQUFJLGNBQWMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQ2pDLFlBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO0FBQ25CLFlBQUksUUFBUSxHQUFHLEVBQUUsQ0FBQztBQUNsQixZQUFJLGNBQWMsR0FBRyxLQUFLLENBQUM7QUFDM0IsWUFBSSxDQUFDLGdCQUFnQixHQUFHLFFBQVEsSUFBSSxJQUFJLENBQUM7QUFDekMsZUFBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQ2xDLGNBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEVBQUU7QUFDakMscUJBQVM7V0FDVjtBQUNELGNBQUksV0FBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7QUFDakMsY0FBSSxRQUFRLEdBQUcsS0FBSyxDQUFDOzt1Q0FDSyxJQUFJLENBQUMscUJBQXFCLENBQUMsSUFBSSxDQUFDOztjQUFyRCxXQUFXLDBCQUFYLFdBQVc7Y0FBRSxJQUFJLDBCQUFKLElBQUk7O0FBQ3RCLGNBQUksSUFBSSxLQUFLLFlBQVksSUFBSSxXQUFXLENBQUMsS0FBSyxLQUFLLFFBQVEsRUFBRTtBQUMzRCxvQkFBUSxHQUFHLElBQUksQ0FBQzs7d0JBQ08sSUFBSSxDQUFDLHFCQUFxQixDQUFDLEtBQUssQ0FBQzs7QUFBdEQsdUJBQVcsU0FBWCxXQUFXO0FBQUUsZ0JBQUksU0FBSixJQUFJO1dBQ3BCO0FBQ0Qsa0JBQVEsSUFBSTtBQUNWLGlCQUFLLFFBQVE7QUFDWCxrQkFBSSxHQUFHLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQztBQUMzQixrQkFBSSxDQUFDLFFBQVEsRUFBRTtBQUNiLG9CQUFJLEdBQUcsQ0FBQyxJQUFJLEtBQUssb0JBQW9CLElBQUksR0FBRyxDQUFDLEtBQUssS0FBSyxhQUFhLEVBQUU7QUFDcEUsc0JBQUksV0FBVyxDQUFDLElBQUksS0FBSyxRQUFRLElBQUksV0FBVyxDQUFDLFdBQVcsRUFBRTtBQUM1RCwwQkFBTSxJQUFJLENBQUMsdUJBQXVCLENBQUMsV0FBVyxFQUFFLHVEQUF1RCxDQUFDLENBQUM7bUJBQzFHO0FBQ0Qsc0JBQUksY0FBYyxFQUFFO0FBQ2xCLDBCQUFNLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxXQUFXLEVBQUUsNENBQTRDLENBQUMsQ0FBQzttQkFDL0YsTUFBTTtBQUNMLGtDQUFjLEdBQUcsSUFBSSxDQUFDO21CQUN2QjtpQkFDRjtlQUNGLE1BQU07QUFDTCxvQkFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLG9CQUFvQixJQUFJLEdBQUcsQ0FBQyxLQUFLLEtBQUssV0FBVyxFQUFFO0FBQ2xFLHdCQUFNLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxXQUFXLEVBQUUsa0RBQWtELENBQUMsQ0FBQztpQkFDckc7ZUFDRjtBQUNELHNCQUFRLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLEVBQUUsRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLFFBQVEsRUFBUixRQUFRLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUNsRyxvQkFBTTtBQUFBLEFBQ1I7QUFDRSxvQkFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLHFDQUFxQyxDQUFDLENBQUM7QUFBQSxXQUNqRTtTQUNGO0FBQ0QsWUFBSSxDQUFDLE1BQU0sRUFBRTtBQUNYLGNBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUM7U0FDbEM7QUFDRCxZQUFJLENBQUMsTUFBTSxHQUFHLGNBQWMsQ0FBQztBQUM3QixZQUFJLENBQUMsb0JBQW9CLEdBQUcsa0JBQWtCLENBQUM7QUFDL0MsWUFBSSxDQUFDLG9CQUFvQixHQUFHLDRCQUE0QixDQUFDO0FBQ3pELFlBQUksQ0FBQyxnQkFBZ0IsR0FBRyx3QkFBd0IsQ0FBQztBQUNqRCxlQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxJQUFJLEVBQUUsTUFBTSxHQUFHLGlCQUFpQixHQUFHLGtCQUFrQixFQUFFLElBQUksRUFBSixJQUFJLEVBQUUsU0FBTyxRQUFRLEVBQUUsUUFBUSxFQUFSLFFBQVEsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDO09BQ2hJOztBQUVELGlCQUFhO2FBQUEsNkJBQWlFO1lBQS9ELE1BQU0sUUFBTixNQUFNO1lBQUUsVUFBVSxRQUFWLFVBQVU7a0NBQUUsU0FBUztZQUFULFNBQVMsa0NBQUcsS0FBSzt1Q0FBRSxjQUFjO1lBQWQsY0FBYyx1Q0FBRyxJQUFJOztBQUN6RSxZQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7O0FBRXZDLFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDOztBQUVoQyxZQUFJLElBQUksR0FBRyxJQUFJLENBQUM7QUFDaEIsWUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDO0FBQ25CLFlBQUksZUFBZSxHQUFHLElBQUksQ0FBQztBQUMzQixZQUFJLFdBQVcsR0FBRyxjQUFjLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzlELFlBQUksMEJBQTBCLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDO0FBQzNELFlBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQztBQUM5QyxZQUFJLHVCQUF1QixHQUFHLElBQUksQ0FBQyxlQUFlLENBQUM7O0FBRW5ELFlBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUNqQyxjQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO0FBQzNCLGNBQUksa0JBQWtCLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQzVDLGNBQUksR0FBRyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7QUFDOUIsY0FBSSxJQUFJLENBQUMsTUFBTSxJQUFJLFdBQVcsRUFBRTtBQUM5QixnQkFBSSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUMxQixvQkFBTSxJQUFJLENBQUMsdUJBQXVCLENBQUMsS0FBSyxFQUFFLGFBQWEsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO2FBQy9FO1dBQ0YsTUFBTTtBQUNMLGdCQUFJLGdCQUFnQixDQUFDLElBQUksQ0FBQyxFQUFFO0FBQzFCLDZCQUFlLEdBQUcsS0FBSyxDQUFDO0FBQ3hCLHFCQUFPLEdBQUcsYUFBYSxDQUFDLG9CQUFvQixDQUFDO2FBQzlDLE1BQU0sSUFBSSx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUN6Qyw2QkFBZSxHQUFHLEtBQUssQ0FBQztBQUN4QixxQkFBTyxHQUFHLGFBQWEsQ0FBQyxvQkFBb0IsQ0FBQzthQUM5QztXQUNGO0FBQ0QsY0FBSSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxJQUFJLEVBQUUsbUJBQW1CLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxFQUFFLGtCQUFrQixDQUFDLENBQUM7U0FDekYsTUFBTSxJQUFJLENBQUMsTUFBTSxFQUFFO0FBQ2xCLGNBQUksU0FBUyxFQUFFO0FBQ2IsZ0JBQUksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUMsSUFBSSxFQUFFLG1CQUFtQixFQUFFLElBQUksRUFBRSxXQUFXLEVBQUUsRUFBRSxhQUFhLENBQUMsQ0FBQztXQUMxRixNQUFNO0FBQ0wsa0JBQU0sSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztXQUM3QztTQUNGOztBQUVELFlBQUksY0FBYyxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQzs7QUFFeEMsWUFBSSxDQUFDLG9CQUFvQixHQUFHLFdBQVcsQ0FBQztBQUN4QyxZQUFJLENBQUMsb0JBQW9CLEdBQUcsV0FBVyxDQUFDO0FBQ3hDLFlBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsZUFBZSxDQUFDLENBQUM7QUFDN0MsWUFBSSxDQUFDLG9CQUFvQixHQUFHLDBCQUEwQixDQUFDO0FBQ3ZELFlBQUksQ0FBQyxvQkFBb0IsR0FBRyxhQUFhLENBQUM7O0FBRTFDLFlBQUksSUFBSSxDQUFDLE9BQU8sSUFBSSxJQUFJLEVBQUU7QUFDeEIsaUJBQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO1NBQ3hCOztBQUVELFlBQUksY0FBYyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7QUFDakMsWUFBSSxDQUFDLG9CQUFvQixHQUFHLFdBQVcsQ0FBQztBQUN4QyxZQUFJLFdBQVcsRUFBRTtBQUNmLGNBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDO1NBQzdCO0FBQ0QsWUFBSSxxQkFBcUIsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDO0FBQy9DLFlBQUksQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDO0FBQzNCLFlBQUksZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztBQUNyQyxZQUFJLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztBQUN0QixZQUFJLFdBQVcsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7O0FBRTFFLFlBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxJQUFJLEVBQUUsa0JBQWtCLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsRUFBRSxjQUFjLENBQUMsQ0FBQzs7aUNBRTNGLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxXQUFXLENBQUM7Ozs7WUFBckQsSUFBSTtZQUFFLFFBQVE7O0FBQ25CLFlBQUksQ0FBQyxlQUFlLEdBQUcsdUJBQXVCLENBQUM7QUFDL0MsWUFBSSxDQUFDLGFBQWEsR0FBRyxxQkFBcUIsQ0FBQztBQUMzQyxZQUFJLENBQUMsUUFBUSxHQUFHLGdCQUFnQixDQUFDOztBQUVqQyxZQUFJLENBQUMsb0JBQW9CLEdBQUcsYUFBYSxDQUFDO0FBQzFDLFlBQUksT0FBTyxJQUFJLElBQUksRUFBRTtBQUNuQixjQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sSUFBSSxRQUFRLENBQUEsSUFBSyxJQUFJLENBQUMsZUFBZSxJQUFJLElBQUksRUFBRTtBQUM3RCxrQkFBTSxJQUFJLENBQUMsdUJBQXVCLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxPQUFPLENBQUMsQ0FBQztXQUNuRTtTQUNGO0FBQ0QsWUFBSSxDQUFDLE1BQU0sR0FBRyxjQUFjLENBQUM7QUFDN0IsWUFBSSxDQUFDLE1BQU0sRUFBRTtBQUNYLGNBQUksVUFBVSxFQUFFO0FBQ2QsZ0JBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUM7V0FDbEMsTUFBTTtBQUNMLGdCQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7V0FDMUI7U0FFRjs7QUFFRCxlQUFPLElBQUksQ0FBQyxZQUFZLENBQ3RCLEVBQUUsSUFBSSxFQUFFLE1BQU0sR0FBRyxvQkFBb0IsR0FBRyxxQkFBcUIsRUFBRSxXQUFXLEVBQVgsV0FBVyxFQUFFLElBQUksRUFBSixJQUFJLEVBQUUsTUFBTSxFQUFOLE1BQU0sRUFBRSxJQUFJLEVBQUosSUFBSSxFQUFFLEVBQUUsYUFBYSxDQUFDLENBQUM7T0FDcEg7O0FBRUQscUJBQWlCO2FBQUEsNkJBQUc7QUFDbEIsWUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDOztBQUV2QyxZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQzs7QUFFOUIsWUFBSSxRQUFRLEdBQUcsRUFBRTtZQUFFLFdBQVcsR0FBRyxJQUFJLENBQUM7O0FBRXRDLGVBQU8sSUFBSSxFQUFFO0FBQ1gsY0FBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUNoQyxrQkFBTTtXQUNQO0FBQ0QsY0FBSSxFQUFFLFlBQUEsQ0FBQzs7QUFFUCxjQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFO0FBQzdCLGNBQUUsR0FBRyxJQUFJLENBQUM7V0FDWCxNQUFNO0FBQ0wsZ0JBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLEVBQUU7QUFDaEMseUJBQVcsR0FBRyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztBQUM1QyxvQkFBTTthQUNQLE1BQU07QUFDTCxnQkFBRSxHQUFHLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO2FBQ2pDO0FBQ0QsZ0JBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUNqQyxrQkFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDOUI7V0FDRjtBQUNELGtCQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1NBQ25COztBQUVELFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDOztBQUU5QixlQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLFFBQVEsRUFBUixRQUFRLEVBQUUsV0FBVyxFQUFYLFdBQVcsRUFBRSxFQUFFLGFBQWEsQ0FBQyxDQUFDO09BQzFGOztBQUVELHdCQUFvQjthQUFBLGdDQUFHO0FBQ3JCLFlBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUN2QyxZQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDOztpQ0FDTCxJQUFJLENBQUMsaUJBQWlCLEVBQUU7O1lBQXpDLElBQUksc0JBQUosSUFBSTtZQUFFLE9BQU8sc0JBQVAsT0FBTzs7QUFDbEIsWUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDLFVBQVUsSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQyxLQUFLLENBQUEsSUFBSyxJQUFJLENBQUMsSUFBSSxLQUFLLG9CQUFvQixFQUFFO0FBQ2pILGNBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUNoQyxnQkFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQyxLQUFLLEtBQUssSUFBSSxDQUFDLG9CQUFvQixJQUFJLElBQUksQ0FBQyxvQkFBb0IsSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFBLEFBQUMsRUFBRTtBQUN0SCxvQkFBTSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDcEM7QUFDRCxnQkFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDO0FBQ3hCLGdCQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQzlCLGtCQUFJLDRCQUE0QixHQUFHLElBQUksQ0FBQyxvQkFBb0IsQ0FBQztBQUM3RCxrQkFBSSxJQUFJLENBQUMsb0JBQW9CLEVBQUU7QUFDN0Isb0JBQUksQ0FBQyxvQkFBb0IsR0FBRyxLQUFLLENBQUM7ZUFDbkM7QUFDRCxrQkFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUM7QUFDNUMsMEJBQVksR0FBRyxJQUFJLENBQUM7QUFDcEIsa0JBQUksQ0FBQyxvQkFBb0IsR0FBRyw0QkFBNEIsQ0FBQzthQUMxRDtBQUNELG1CQUFPLElBQUksQ0FBQyxZQUFZLENBQUM7QUFDdkIsa0JBQUksRUFBRSwyQkFBMkI7QUFDakMscUJBQU8sRUFBRSxPQUFPO0FBQ2hCLGtCQUFJLEVBQUUsWUFBWTthQUNuQixFQUFFLGFBQWEsQ0FBQyxDQUFDO1dBQ25CO1NBQ0Y7QUFDRCxZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUM3QixlQUFPLEdBQUcsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUM7QUFDckMsZUFBTyxJQUFJLENBQUMsWUFBWSxDQUFDLEVBQUUsSUFBSSxFQUFFLHlCQUF5QixFQUFFLElBQUksRUFBSixJQUFJLEVBQUUsT0FBTyxFQUFQLE9BQU8sRUFBRSxFQUFFLGFBQWEsQ0FBQyxDQUFDO09BQzdGOztBQUVELHNCQUFrQjthQUFBLDhCQUFHO0FBQ25CLFlBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQzs7QUFFdkMsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7O0FBRTlCLFlBQUksVUFBVSxHQUFHLEVBQUUsQ0FBQztBQUNwQixlQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUU7QUFDcEMsb0JBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUMsQ0FBQztBQUM3QyxjQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUU7QUFDakMsZ0JBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1dBQzlCO1NBQ0Y7O0FBRUQsWUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7O0FBRTlCLGVBQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxFQUFFLElBQUksRUFBRSxlQUFlLEVBQUUsVUFBVSxFQUFWLFVBQVUsRUFBRSxFQUFFLGFBQWEsQ0FBQyxDQUFDO09BQ2hGOztBQUVELHNCQUFrQjthQUFBLDhCQUFHO0FBQ25CLGdCQUFRLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSTtBQUN6QixlQUFLLFNBQVMsQ0FBQyxVQUFVLENBQUM7QUFDMUIsZUFBSyxTQUFTLENBQUMsS0FBSztBQUNsQixtQkFBTyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztBQUFBLEFBQ3ZDLGVBQUssU0FBUyxDQUFDLE1BQU07QUFDbkIsbUJBQU8sSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7QUFBQSxBQUNsQyxlQUFLLFNBQVMsQ0FBQyxNQUFNO0FBQ25CLG1CQUFPLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO0FBQUEsU0FDcEM7QUFDRCxjQUFNLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7T0FDN0M7O0FBRUQsdUJBQW1CO2FBQUEsK0JBQUc7QUFDcEIsWUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ3ZDLFlBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDOztBQUV4QyxZQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQzlCLGNBQUksNEJBQTRCLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDO0FBQzdELGNBQUksdUJBQXVCLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDO0FBQ3hELGNBQUksSUFBSSxDQUFDLG9CQUFvQixFQUFFO0FBQzdCLGdCQUFJLENBQUMsb0JBQW9CLEdBQUcsS0FBSyxDQUFDO1dBQ25DO0FBQ0QsY0FBSSxDQUFDLG9CQUFvQixHQUFHLEtBQUssQ0FBQztBQUNsQyxjQUFJLElBQUksR0FBRyxJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQztBQUM1QyxpQkFBTyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsRUFBRSxJQUFJLEVBQUUsb0JBQW9CLEVBQUUsT0FBTyxFQUFQLE9BQU8sRUFBRSxJQUFJLEVBQUosSUFBSSxFQUFFLEVBQUUsYUFBYSxDQUFDLENBQUM7QUFDMUYsY0FBSSxDQUFDLG9CQUFvQixHQUFHLDRCQUE0QixDQUFDO0FBQ3pELGNBQUksQ0FBQyxvQkFBb0IsR0FBRyx1QkFBdUIsQ0FBQztTQUVyRDtBQUNELGVBQU8sT0FBTyxDQUFDO09BQ2hCOztBQUVELGNBQVU7YUFBQSxzQkFBRztBQUNYLFlBQUksbUJBQW1CLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQztBQUMzQyxZQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztBQUN4QixZQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztBQUN2QyxZQUFJLENBQUMsV0FBVyxHQUFHLG1CQUFtQixDQUFDO0FBQ3ZDLGVBQU8sS0FBSyxDQUFDO09BQ2Q7O0FBRUQsY0FBVTthQUFBLG9CQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRTtBQUNwQyxZQUFJLFFBQVEsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3hDLFVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQzs7QUFFL0IsWUFBSSxjQUFjLENBQUMsUUFBUSxDQUFDLElBQUksSUFBSSxFQUFFO0FBQ3BDLGdCQUFNLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLGlCQUFpQixFQUFFLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1NBQ3RHOztBQUVELFlBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtBQUNmLGNBQUksUUFBUSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFO0FBQ25DLGtCQUFNLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLGlCQUFpQixDQUFDLENBQUM7V0FDNUUsTUFBTSxJQUFJLGNBQWMsQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLEVBQUU7QUFDeEMsa0JBQU0sSUFBSSxDQUFDLHVCQUF1QixDQUFDLEtBQUssRUFBRSxhQUFhLENBQUMsaUJBQWlCLENBQUMsQ0FBQztXQUM1RTtTQUNGLE1BQU0sSUFBSSxJQUFJLENBQUMsZUFBZSxJQUFJLElBQUksRUFBRTtBQUN2QyxjQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsRUFBRTtBQUNuQyxnQkFBSSxDQUFDLGVBQWUsR0FBRyxLQUFLLENBQUM7QUFDN0IsZ0JBQUksQ0FBQyxPQUFPLEdBQUcsYUFBYSxDQUFDLGlCQUFpQixDQUFDO1dBQ2hELE1BQU0sSUFBSSx5QkFBeUIsQ0FBQyxRQUFRLENBQUMsRUFBRTtBQUM5QyxnQkFBSSxDQUFDLGVBQWUsR0FBRyxLQUFLLENBQUM7QUFDN0IsZ0JBQUksQ0FBQyxPQUFPLEdBQUcsYUFBYSxDQUFDLG9CQUFvQixDQUFDO1dBQ25ELE1BQU0sSUFBSSxjQUFjLENBQUMsS0FBSyxDQUFDLElBQUksSUFBSSxFQUFFO0FBQ3hDLGdCQUFJLENBQUMsZUFBZSxHQUFHLEtBQUssQ0FBQztBQUM3QixnQkFBSSxDQUFDLE9BQU8sR0FBRyxhQUFhLENBQUMsaUJBQWlCLENBQUM7V0FDaEQ7U0FDRjtPQUNGOztBQUVELGVBQVc7YUFBQSxxQkFBQyxFQUFFLEVBQUU7QUFDZCxZQUFJLElBQUksR0FBRyxFQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztZQUFFLGlCQUFpQixHQUFHLElBQUksQ0FBQztBQUM5RCxZQUFJLENBQUMsZUFBZSxHQUFHLEVBQUUsQ0FBQztBQUMxQixZQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQzs7QUFFOUIsWUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQ2pDLGNBQUksS0FBSyxHQUFHLEVBQUUsQ0FBQztBQUNmLGNBQUksUUFBUSxHQUFHLEtBQUssQ0FBQzs7QUFFckIsaUJBQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEVBQUU7QUFDbEIsZ0JBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7QUFDM0IsZ0JBQUksS0FBSyxZQUFBLENBQUM7QUFDVixnQkFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsRUFBRTtBQUNoQywrQkFBaUIsR0FBRyxLQUFLLENBQUM7QUFDMUIsbUJBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO0FBQ3ZCLG1CQUFLLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixFQUFFLENBQUM7QUFDdEMsc0JBQVEsR0FBRyxJQUFJLENBQUM7YUFDakIsTUFBTTtBQUNMLG1CQUFLLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQzFCLGtCQUFJLEtBQUssQ0FBQyxJQUFJLEtBQUssbUJBQW1CLEVBQUU7QUFDdEMsaUNBQWlCLEdBQUcsS0FBSyxDQUFDO2VBQzNCO2FBQ0Y7O0FBRUQsZ0JBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7O0FBRTNDLGdCQUFJLFFBQVEsRUFBRTtBQUNaLGtCQUFJLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQztBQUNsQixvQkFBTTthQUNQO0FBQ0QsZ0JBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ3hCLGdCQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQ2hDLG9CQUFNO2FBQ1A7QUFDRCxnQkFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7V0FDOUI7U0FDRjs7QUFFRCxZQUFJLENBQUMsaUJBQWlCLEVBQUU7QUFDdEIsY0FBSSxJQUFJLENBQUMsT0FBTyxLQUFLLGFBQWEsQ0FBQyxpQkFBaUIsRUFBRTtBQUNwRCxrQkFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztXQUN0QztTQUNGOztBQUVELFlBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlCLGVBQU8sSUFBSSxDQUFDO09BQ2I7OztBQWhpRU0saUNBQTZCO2FBQUEsdUNBQUMsSUFBSSxFQUFFO0FBQ3pDLGdCQUFRLElBQUksQ0FBQyxJQUFJO0FBQ2YsZUFBSyxtQkFBbUIsQ0FBQztBQUN6QixlQUFLLHNCQUFzQixDQUFDO0FBQzVCLGVBQUssMEJBQTBCLENBQUM7QUFDaEMsZUFBSyx3QkFBd0I7QUFDM0IsbUJBQU8sSUFBSSxDQUFDO0FBQUEsU0FDZjtBQUNELGVBQU8sS0FBSyxDQUFDO09BQ2Q7O0FBRU0sY0FBVTthQUFBLG9CQUFDLElBQUksRUFBRTtBQUN0QixnQkFBUSxJQUFJLENBQUMsSUFBSTtBQUNmLGVBQUssbUJBQW1CO0FBQ3RCLG1CQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQUEsQUFDckIsZUFBSyxvQkFBb0I7QUFDdkIsbUJBQU8sTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7QUFBQSxBQUN6QyxlQUFLLGNBQWM7QUFBRTs7QUFDbkIsb0JBQUksS0FBSyxHQUFHLEVBQUUsQ0FBQztBQUNmLG9CQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxVQUFBLENBQUM7eUJBQUksQ0FBQyxJQUFJLElBQUk7aUJBQUEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFBLENBQUM7eUJBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQUEsQ0FBQyxDQUFDO0FBQzlGLG9CQUFJLElBQUksQ0FBQyxXQUFXLElBQUksSUFBSSxFQUFFO0FBQzVCLG9CQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztpQkFDM0Q7QUFDRDtxQkFBTyxLQUFLO2tCQUFDOzs7Ozs7OzthQUNkO0FBQUEsQUFDRCxlQUFLLGVBQWU7QUFBRTs7QUFDcEIsb0JBQUksS0FBSyxHQUFHLEVBQUUsQ0FBQztBQUNmLG9CQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxVQUFBLENBQUMsRUFBSTtBQUMzQiwwQkFBUSxDQUFDLENBQUMsSUFBSTtBQUNaLHlCQUFLLDJCQUEyQjtBQUM5QiwyQkFBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzNCLDRCQUFNO0FBQUEsQUFDUix5QkFBSyx5QkFBeUI7QUFDNUIsd0JBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQ25ELDRCQUFNO0FBQUE7QUFFUjtBQUNFLDRCQUFNLElBQUksS0FBSyxDQUFDLDREQUE0RCxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUFBLG1CQUMxRjtpQkFDRixDQUFDLENBQUM7QUFDSDtxQkFBTyxLQUFLO2tCQUFDOzs7Ozs7OzthQUNkO0FBQUEsQUFDRCxlQUFLLDBCQUEwQixDQUFDO0FBQ2hDLGVBQUssd0JBQXdCO0FBQzNCLG1CQUFPLEVBQUUsQ0FBQztBQUFBLFNBQ2I7O0FBRUQsY0FBTSxJQUFJLEtBQUssQ0FBQyxrREFBa0QsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7T0FDakY7O0FBMlpNLFdBQU87YUFBQSx1QkFBb0I7WUFBbEIsSUFBSSxRQUFKLElBQUk7WUFBRSxTQUFTLFFBQVQsU0FBUzs7QUFDN0IsWUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLFNBQVMsQ0FBQztBQUMzQixlQUFPLElBQUksQ0FBQztPQUNiOztBQTJTTSxvQkFBZ0I7YUFBQSwwQkFBQyxJQUFJLEVBQUU7QUFDNUIsZ0JBQVEsSUFBSTtBQUNWLGVBQUssU0FBUyxDQUFDLEdBQUcsQ0FBQztBQUNuQixlQUFLLFNBQVMsQ0FBQyxHQUFHLENBQUM7QUFDbkIsZUFBSyxTQUFTLENBQUMsR0FBRyxDQUFDO0FBQ25CLGVBQUssU0FBUyxDQUFDLEdBQUcsQ0FBQztBQUNuQixlQUFLLFNBQVMsQ0FBQyxPQUFPLENBQUM7QUFDdkIsZUFBSyxTQUFTLENBQUMsR0FBRyxDQUFDO0FBQ25CLGVBQUssU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUN0QixlQUFLLFNBQVMsQ0FBQyxJQUFJLENBQUM7QUFDcEIsZUFBSyxTQUFTLENBQUMsTUFBTTtBQUNuQixtQkFBTyxJQUFJLENBQUM7QUFBQSxTQUNmO0FBQ0QsZUFBTyxLQUFLLENBQUM7T0FDZDs7OztTQTc5Q1UsTUFBTTtHQUFTLFNBQVMiLCJmaWxlIjoic3JjL3BhcnNlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29weXJpZ2h0IDIwMTQgU2hhcGUgU2VjdXJpdHksIEluYy5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpXG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQge2lzUmVzdHJpY3RlZFdvcmQsIGlzU3RyaWN0TW9kZVJlc2VydmVkV29yZH0gZnJvbSBcIi4vdXRpbHNcIjtcblxuaW1wb3J0IHtFcnJvck1lc3NhZ2VzfSBmcm9tIFwiLi9lcnJvcnNcIjtcblxuaW1wb3J0IFRva2VuaXplciwgeyBUb2tlbkNsYXNzLCBUb2tlblR5cGUgfSBmcm9tIFwiLi90b2tlbml6ZXJcIjtcblxuLy8gRW1wdHkgcGFyYW1ldGVyIGxpc3QgZm9yIEFycm93RXhwcmVzc2lvblxuY29uc3QgQVJST1dfRVhQUkVTU0lPTl9QQVJBTVMgPSBcIkNvdmVyUGFyZW50aGVzaXplZEV4cHJlc3Npb25BbmRBcnJvd1BhcmFtZXRlckxpc3RcIjtcblxuY29uc3QgU1RSSUNUX01PREVfUkVTRVJWRURfV09SRCA9IHtcbiAgXCJpbXBsZW1lbnRzXCI6IG51bGwsIFwiaW50ZXJmYWNlXCI6IG51bGwsIFwicGFja2FnZVwiOiBudWxsLCBcInByaXZhdGVcIjogbnVsbCwgXCJwcm90ZWN0ZWRcIjogbnVsbCxcbiAgXCJwdWJsaWNcIjogbnVsbCwgXCJzdGF0aWNcIjogbnVsbCwgXCJ5aWVsZFwiOiBudWxsLCBcImxldFwiOiBudWxsXG59O1xuXG5jb25zdCBQcmVjZWRlbmNlID0ge1xuICBTZXF1ZW5jZTogMCxcbiAgWWllbGQ6IDEsXG4gIEFzc2lnbm1lbnQ6IDEsXG4gIENvbmRpdGlvbmFsOiAyLFxuICBBcnJvd0Z1bmN0aW9uOiAyLFxuICBMb2dpY2FsT1I6IDMsXG4gIExvZ2ljYWxBTkQ6IDQsXG4gIEJpdHdpc2VPUjogNSxcbiAgQml0d2lzZVhPUjogNixcbiAgQml0d2lzZUFORDogNyxcbiAgRXF1YWxpdHk6IDgsXG4gIFJlbGF0aW9uYWw6IDksXG4gIEJpdHdpc2VTSElGVDogMTAsXG4gIEFkZGl0aXZlOiAxMSxcbiAgTXVsdGlwbGljYXRpdmU6IDEyLFxuICBVbmFyeTogMTMsXG4gIFBvc3RmaXg6IDE0LFxuICBDYWxsOiAxNSxcbiAgTmV3OiAxNixcbiAgVGFnZ2VkVGVtcGxhdGU6IDE3LFxuICBNZW1iZXI6IDE4LFxuICBQcmltYXJ5OiAxOVxufTtcblxuY29uc3QgQmluYXJ5UHJlY2VkZW5jZSA9IHtcbiAgXCJ8fFwiOiBQcmVjZWRlbmNlLkxvZ2ljYWxPUixcbiAgXCImJlwiOiBQcmVjZWRlbmNlLkxvZ2ljYWxBTkQsXG4gIFwifFwiOiBQcmVjZWRlbmNlLkJpdHdpc2VPUixcbiAgXCJeXCI6IFByZWNlZGVuY2UuQml0d2lzZVhPUixcbiAgXCImXCI6IFByZWNlZGVuY2UuQml0d2lzZUFORCxcbiAgXCI9PVwiOiBQcmVjZWRlbmNlLkVxdWFsaXR5LFxuICBcIiE9XCI6IFByZWNlZGVuY2UuRXF1YWxpdHksXG4gIFwiPT09XCI6IFByZWNlZGVuY2UuRXF1YWxpdHksXG4gIFwiIT09XCI6IFByZWNlZGVuY2UuRXF1YWxpdHksXG4gIFwiPFwiOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gIFwiPlwiOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gIFwiPD1cIjogUHJlY2VkZW5jZS5SZWxhdGlvbmFsLFxuICBcIj49XCI6IFByZWNlZGVuY2UuUmVsYXRpb25hbCxcbiAgXCJpblwiOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gIFwiaW5zdGFuY2VvZlwiOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gIFwiPDxcIjogUHJlY2VkZW5jZS5CaXR3aXNlU0hJRlQsXG4gIFwiPj5cIjogUHJlY2VkZW5jZS5CaXR3aXNlU0hJRlQsXG4gIFwiPj4+XCI6IFByZWNlZGVuY2UuQml0d2lzZVNISUZULFxuICBcIitcIjogUHJlY2VkZW5jZS5BZGRpdGl2ZSxcbiAgXCItXCI6IFByZWNlZGVuY2UuQWRkaXRpdmUsXG4gIFwiKlwiOiBQcmVjZWRlbmNlLk11bHRpcGxpY2F0aXZlLFxuICBcIiVcIjogUHJlY2VkZW5jZS5NdWx0aXBsaWNhdGl2ZSxcbiAgXCIvXCI6IFByZWNlZGVuY2UuTXVsdGlwbGljYXRpdmUsXG59O1xuXG5jb25zdCBGT1JfT0ZfVkFSID0ge307XG5cbmZ1bmN0aW9uIGNvcHlMb2NhdGlvbihmcm9tLCB0bykge1xuICBpZiAoXCJsb2NcIiBpbiBmcm9tKSB7XG4gICAgdG8ubG9jID0gZnJvbS5sb2M7XG4gIH1cbiAgcmV0dXJuIHRvO1xufVxuXG4vKipcbiAqXG4gKiBAcGFyYW0ge1tzdHJpbmddfSBzdHJpbmdzXG4gKiBAcmV0dXJucyB7c3RyaW5nP31cbiAqL1xuZnVuY3Rpb24gZmlyc3REdXBsaWNhdGUoc3RyaW5ncykge1xuICBpZiAoc3RyaW5ncy5sZW5ndGggPCAyKSByZXR1cm4gbnVsbDtcbiAgbGV0IG1hcCA9IHt9O1xuICBmb3IgKGxldCBjdXJzb3IgPSAwOyBjdXJzb3IgPCBzdHJpbmdzLmxlbmd0aDsgY3Vyc29yKyspIHtcbiAgICBsZXQgaWQgPSBcIiRcIiArIHN0cmluZ3NbY3Vyc29yXTtcbiAgICBpZiAobWFwLmhhc093blByb3BlcnR5KGlkKSkge1xuICAgICAgcmV0dXJuIHN0cmluZ3NbY3Vyc29yXTtcbiAgICB9XG4gICAgbWFwW2lkXSA9IHRydWU7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGhhc1N0cmljdE1vZGVSZXNlcnZlZFdvcmQoaWRzKSB7XG4gIHJldHVybiBpZHMuc29tZShpZCA9PiBTVFJJQ1RfTU9ERV9SRVNFUlZFRF9XT1JELmhhc093blByb3BlcnR5KGlkKSk7XG59XG5cbmV4cG9ydCBjbGFzcyBQYXJzZXIgZXh0ZW5kcyBUb2tlbml6ZXIge1xuICBjb25zdHJ1Y3Rvcihzb3VyY2UpIHtcbiAgICBzdXBlcihzb3VyY2UpO1xuICAgIHRoaXMubGFiZWxTZXQgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIHRoaXMuTEROID0gW107XG4gICAgdGhpcy5WRE4gPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIHRoaXMuYWxsb3dJbiA9IHRydWU7XG4gICAgdGhpcy5pbkl0ZXJhdGlvbiA9IGZhbHNlO1xuICAgIHRoaXMuaW5Td2l0Y2ggPSBmYWxzZTtcbiAgICB0aGlzLmluRnVuY3Rpb25Cb2R5ID0gZmFsc2U7XG4gICAgdGhpcy5pbk1ldGhvZCA9IGZhbHNlO1xuICAgIHRoaXMuaW5Db25zdHJ1Y3RvciA9IGZhbHNlO1xuICAgIHRoaXMuaGFzQ2xhc3NIZXJpdGFnZSA9IGZhbHNlO1xuICAgIHRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXIgPSBmYWxzZTtcbiAgICB0aGlzLmluUGFyYW1ldGVyID0gZmFsc2U7XG4gICAgdGhpcy5pbkdlbmVyYXRvckJvZHkgPSBmYWxzZTtcbiAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gZmFsc2U7XG4gICAgdGhpcy5hbGxvd0xhYmVsZWRGdW5jdGlvbiA9IHRydWU7XG4gICAgdGhpcy5tb2R1bGUgPSBmYWxzZTtcbiAgICB0aGlzLnN0cmljdCA9IGZhbHNlO1xuICB9XG5cbiAgZWF0KHRva2VuVHlwZSkge1xuICAgIGlmICh0aGlzLmxvb2thaGVhZC50eXBlID09PSB0b2tlblR5cGUpIHtcbiAgICAgIHJldHVybiB0aGlzLmxleCgpO1xuICAgIH1cbiAgfVxuXG4gIGV4cGVjdCh0b2tlblR5cGUpIHtcbiAgICBpZiAodGhpcy5sb29rYWhlYWQudHlwZSA9PT0gdG9rZW5UeXBlKSB7XG4gICAgICByZXR1cm4gdGhpcy5sZXgoKTtcbiAgICB9XG4gICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgfVxuXG4gIG1hdGNoQ29udGV4dHVhbEtleXdvcmQoa2V5d29yZCkge1xuICAgIHJldHVybiB0aGlzLmxvb2thaGVhZC50eXBlID09PSBUb2tlblR5cGUuSURFTlRJRklFUiAmJiB0aGlzLmxvb2thaGVhZC52YWx1ZSA9PT0ga2V5d29yZDtcbiAgfVxuXG4gIGV4cGVjdENvbnRleHR1YWxLZXl3b3JkKGtleXdvcmQpIHtcbiAgICBpZiAodGhpcy5tYXRjaENvbnRleHR1YWxLZXl3b3JkKGtleXdvcmQpKSB7XG4gICAgICByZXR1cm4gdGhpcy5sZXgoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICB9XG4gIH1cblxuICBlYXRDb250ZXh0dWFsS2V5d29yZChrZXl3b3JkKSB7XG4gICAgaWYgKHRoaXMubWF0Y2hDb250ZXh0dWFsS2V5d29yZChrZXl3b3JkKSkge1xuICAgICAgcmV0dXJuIHRoaXMubGV4KCk7XG4gICAgfVxuICB9XG5cbiAgbWF0Y2goc3ViVHlwZSkge1xuICAgIHJldHVybiB0aGlzLmxvb2thaGVhZC50eXBlID09PSBzdWJUeXBlO1xuICB9XG5cbiAgY29uc3VtZVNlbWljb2xvbigpIHtcbiAgICBpZiAodGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLlNFTUlDT0xPTikpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuZW9mKCkgJiYgIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJCUkFDRSkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgfVxuICB9XG5cbiAgLy8gdGhpcyBpcyBhIG5vLW9wLCByZXNlcnZlZCBmb3IgZnV0dXJlIHVzZVxuICBtYXJrTG9jYXRpb24obm9kZSwgc3RhcnRMb2NhdGlvbikge1xuICAgIHJldHVybiBub2RlO1xuICB9XG5cbiAgd3JhcFZETihmLCBwb3N0KSB7XG4gICAgbGV0IG9yaWdpbmFsVkROID0gdGhpcy5WRE47XG4gICAgdGhpcy5WRE4gPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIGxldCByZXN1bHQgPSBmLmNhbGwodGhpcyk7XG4gICAgaWYgKHBvc3QpIHBvc3QuY2FsbCh0aGlzKTtcblxuICAgIGZvciAobGV0IGtleSBpbiB0aGlzLlZETikge1xuICAgICAgb3JpZ2luYWxWRE5ba2V5XSA9IHRoaXMuVkROW2tleV07XG4gICAgfVxuICAgIHRoaXMuVkROID0gb3JpZ2luYWxWRE47XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGNoZWNrQmxvY2tTY29wZSgpIHtcbiAgICBsZXQgZHVwbGljYXRlID0gZmlyc3REdXBsaWNhdGUodGhpcy5MRE4pO1xuICAgIGlmIChkdXBsaWNhdGUgIT09IG51bGwpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5EVVBMSUNBVEVfQklORElORywgZHVwbGljYXRlKTtcbiAgICB9XG4gICAgdGhpcy5MRE4uZm9yRWFjaChuYW1lID0+IHtcbiAgICAgIGlmICh7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRoaXMuVkROLCBcIiRcIiArIG5hbWUpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5EVVBMSUNBVEVfQklORElORywgbmFtZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBwYXJzZU1vZHVsZSgpIHtcbiAgICB0aGlzLm1vZHVsZSA9IHRydWU7XG4gICAgdGhpcy5zdHJpY3QgPSB0cnVlO1xuXG4gICAgdGhpcy5sb29rYWhlYWQgPSB0aGlzLmFkdmFuY2UoKTtcbiAgICBsZXQgbG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IGV4cG9ydGVkTmFtZXMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIGxldCBleHBvcnRlZEJpbmRpbmdzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICBsZXQgaXRlbXMgPSBbXTtcbiAgICB3aGlsZSAoIXRoaXMuZW9mKCkpIHtcbiAgICAgIGl0ZW1zLnB1c2godGhpcy5wYXJzZU1vZHVsZUl0ZW0oZXhwb3J0ZWROYW1lcywgZXhwb3J0ZWRCaW5kaW5ncykpO1xuICAgIH1cbiAgICBmb3IgKGxldCBrZXkgaW4gZXhwb3J0ZWRCaW5kaW5ncykge1xuICAgICAgaWYgKCF7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRoaXMuVkROLCBrZXkpICYmIHRoaXMuTEROLmluZGV4T2Yoa2V5LnNsaWNlKDEpKSA9PT0gLTEpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLk1PRFVMRV9FWFBPUlRfVU5ERUZJTkVELCBrZXkuc2xpY2UoMSkpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmNoZWNrQmxvY2tTY29wZSgpO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiTW9kdWxlXCIsIGl0ZW1zOiBpdGVtcyB9LCBsb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZVNjcmlwdCgpIHtcbiAgICB0aGlzLmxvb2thaGVhZCA9IHRoaXMuYWR2YW5jZSgpO1xuXG4gICAgbGV0IGxvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCBvcmlnaW5hbExETiA9IHRoaXMuTEROO1xuICAgIHRoaXMuTEROID0gW107XG5cbiAgICBsZXQgW2JvZHldID0gdGhpcy5wYXJzZUJvZHkoKTtcbiAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLkVPUykpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgfVxuICAgIHRoaXMuY2hlY2tCbG9ja1Njb3BlKCk7XG4gICAgdGhpcy5MRE4gPSBvcmlnaW5hbExETjtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIlNjcmlwdFwiLCBib2R5IH0sIGxvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlRnVuY3Rpb25Cb2R5KGJvdW5kUGFyYW1zKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICBsZXQgb2xkVkROID0gdGhpcy5WRE47XG4gICAgdGhpcy5WRE4gPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuXG4gICAgbGV0IG9yaWdpbmFsTEROID0gdGhpcy5MRE47XG4gICAgdGhpcy5MRE4gPSBbXTtcblxuICAgIGJvdW5kUGFyYW1zLmZvckVhY2gobmFtZSA9PiB0aGlzLlZETltcIiRcIiArIG5hbWVdID0gdHJ1ZSk7XG5cbiAgICBsZXQgb2xkTGFiZWxTZXQgPSB0aGlzLmxhYmVsU2V0O1xuICAgIGxldCBvbGRJbkl0ZXJhdGlvbiA9IHRoaXMuaW5JdGVyYXRpb247XG4gICAgbGV0IG9sZEluU3dpdGNoID0gdGhpcy5pblN3aXRjaDtcbiAgICBsZXQgb2xkSW5GdW5jdGlvbkJvZHkgPSB0aGlzLmluRnVuY3Rpb25Cb2R5O1xuICAgIGxldCBwcmV2aW91c1N0cmljdCA9IHRoaXMuc3RyaWN0O1xuICAgIGxldCBvbGRNb2R1bGUgPSB0aGlzLm1vZHVsZTtcblxuICAgIHRoaXMubGFiZWxTZXQgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIHRoaXMuaW5JdGVyYXRpb24gPSBmYWxzZTtcbiAgICB0aGlzLmluU3dpdGNoID0gZmFsc2U7XG4gICAgdGhpcy5pbkZ1bmN0aW9uQm9keSA9IHRydWU7XG4gICAgdGhpcy5tb2R1bGUgPSBmYWxzZTtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MQlJBQ0UpO1xuICAgIGxldCBbYm9keSwgaXNTdHJpY3RdID0gdGhpcy5wYXJzZUJvZHkoKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUkJSQUNFKTtcblxuICAgIHRoaXMuY2hlY2tCbG9ja1Njb3BlKCk7XG5cbiAgICB0aGlzLlZETiA9IG9sZFZETjtcbiAgICB0aGlzLkxETiA9IG9yaWdpbmFsTEROO1xuXG4gICAgYm9keSA9IHRoaXMubWFya0xvY2F0aW9uKGJvZHksIHN0YXJ0TG9jYXRpb24pO1xuXG4gICAgdGhpcy5sYWJlbFNldCA9IG9sZExhYmVsU2V0O1xuICAgIHRoaXMuaW5JdGVyYXRpb24gPSBvbGRJbkl0ZXJhdGlvbjtcbiAgICB0aGlzLmluU3dpdGNoID0gb2xkSW5Td2l0Y2g7XG4gICAgdGhpcy5pbkZ1bmN0aW9uQm9keSA9IG9sZEluRnVuY3Rpb25Cb2R5O1xuICAgIHRoaXMuc3RyaWN0ID0gcHJldmlvdXNTdHJpY3Q7XG4gICAgdGhpcy5tb2R1bGUgPSBvbGRNb2R1bGU7XG4gICAgcmV0dXJuIFtib2R5LCBpc1N0cmljdF07XG4gIH1cblxuICBwYXJzZUJvZHkoKSB7XG4gICAgbGV0IGxvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCBkaXJlY3RpdmVzID0gW107XG4gICAgbGV0IHN0YXRlbWVudHMgPSBbXTtcbiAgICBsZXQgcGFyc2luZ0RpcmVjdGl2ZXMgPSB0cnVlO1xuICAgIGxldCBpc1N0cmljdCA9IHRoaXMuc3RyaWN0O1xuICAgIGxldCBmaXJzdFJlc3RyaWN0ZWQgPSBudWxsO1xuICAgIHRoaXMud3JhcFZETigoKSA9PiB7XG4gICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICBpZiAodGhpcy5lb2YoKSB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0UpKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgICAgIGxldCB0ZXh0ID0gdG9rZW4uc2xpY2UudGV4dDtcbiAgICAgICAgbGV0IGlzU3RyaW5nTGl0ZXJhbCA9IHRva2VuLnR5cGUgPT09IFRva2VuVHlwZS5TVFJJTkc7XG4gICAgICAgIGxldCBkaXJlY3RpdmVMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICAgICAgbGV0IHN0bXQgPSB0aGlzLnBhcnNlU3RhdGVtZW50TGlzdEl0ZW0oe2lzVG9wTGV2ZWw6IHRydWV9KTtcbiAgICAgICAgaWYgKHBhcnNpbmdEaXJlY3RpdmVzKSB7XG4gICAgICAgICAgaWYgKGlzU3RyaW5nTGl0ZXJhbCAmJiBzdG10LnR5cGUgPT09IFwiRXhwcmVzc2lvblN0YXRlbWVudFwiICYmXG4gICAgICAgICAgICBzdG10LmV4cHJlc3Npb24udHlwZSA9PT0gXCJMaXRlcmFsU3RyaW5nRXhwcmVzc2lvblwiKSB7XG4gICAgICAgICAgICBpZiAodGV4dCA9PT0gXCJcXFwidXNlIHN0cmljdFxcXCJcIiB8fCB0ZXh0ID09PSBcIid1c2Ugc3RyaWN0J1wiKSB7XG4gICAgICAgICAgICAgIGlzU3RyaWN0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgdGhpcy5zdHJpY3QgPSB0cnVlO1xuICAgICAgICAgICAgICBpZiAoZmlyc3RSZXN0cmljdGVkICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKGZpcnN0UmVzdHJpY3RlZCwgRXJyb3JNZXNzYWdlcy5TVFJJQ1RfT0NUQUxfTElURVJBTCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmlyc3RSZXN0cmljdGVkID09IG51bGwgJiYgdG9rZW4ub2N0YWwpIHtcbiAgICAgICAgICAgICAgZmlyc3RSZXN0cmljdGVkID0gdG9rZW47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkaXJlY3RpdmVzLnB1c2godGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIkRpcmVjdGl2ZVwiLCByYXdWYWx1ZTp0ZXh0LnNsaWNlKDEsIC0xKX0sIGRpcmVjdGl2ZUxvY2F0aW9uKSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBhcnNpbmdEaXJlY3RpdmVzID0gZmFsc2U7XG4gICAgICAgICAgICBzdGF0ZW1lbnRzLnB1c2goc3RtdCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0YXRlbWVudHMucHVzaChzdG10KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sICgpID0+IHtcblxuICAgIH0pO1xuICAgIHJldHVybiBbdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIkZ1bmN0aW9uQm9keVwiLCBkaXJlY3RpdmVzLCBzdGF0ZW1lbnRzIH0sIGxvY2F0aW9uKSwgaXNTdHJpY3RdO1xuICB9XG5cbiAgcGFyc2VJbXBvcnRTcGVjaWZpZXIoYm91bmROYW1lcykge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpLCBuYW1lO1xuICAgIGlmICh0aGlzLmxvb2thaGVhZC50eXBlID09PSBUb2tlblR5cGUuSURFTlRJRklFUikge1xuICAgICAgbmFtZSA9IHRoaXMucGFyc2VJZGVudGlmaWVyKCk7XG4gICAgICBpZiAoIXRoaXMuZWF0Q29udGV4dHVhbEtleXdvcmQoXCJhc1wiKSkge1xuICAgICAgICBpZiAoe30uaGFzT3duUHJvcGVydHkuY2FsbChib3VuZE5hbWVzLCBcIiRcIiArIG5hbWUpKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbihzdGFydExvY2F0aW9uLCBFcnJvck1lc3NhZ2VzLklNUE9SVF9EVVBFKTtcbiAgICAgICAgfVxuICAgICAgICBib3VuZE5hbWVzW1wiJFwiICsgbmFtZV0gPSB0cnVlO1xuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24oXG4gICAgICAgICAge1xuICAgICAgICAgICAgdHlwZTogXCJJbXBvcnRTcGVjaWZpZXJcIixcbiAgICAgICAgICAgIG5hbWU6IG51bGwsXG4gICAgICAgICAgICBiaW5kaW5nOiB0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiQmluZGluZ0lkZW50aWZpZXJcIiwgbmFtZTogbmFtZSB9LCBzdGFydExvY2F0aW9uKVxuICAgICAgICAgIH0sIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodGhpcy5sb29rYWhlYWQudHlwZS5rbGFzcy5pc0lkZW50aWZpZXJOYW1lKSB7XG4gICAgICBuYW1lID0gdGhpcy5wYXJzZUlkZW50aWZpZXJOYW1lKCk7XG4gICAgICB0aGlzLmV4cGVjdENvbnRleHR1YWxLZXl3b3JkKFwiYXNcIik7XG4gICAgfVxuXG4gICAgbGV0IGxvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCBib3VuZE5hbWUgPSB0aGlzLnBhcnNlSWRlbnRpZmllcigpO1xuICAgIGlmICh7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGJvdW5kTmFtZXMsIFwiJFwiICsgYm91bmROYW1lKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbihsb2NhdGlvbiwgRXJyb3JNZXNzYWdlcy5JTVBPUlRfRFVQRSk7XG4gICAgfVxuICAgIGJvdW5kTmFtZXNbXCIkXCIgKyBib3VuZE5hbWVdID0gdHJ1ZTtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24oXG4gICAgICB7XG4gICAgICAgIHR5cGU6IFwiSW1wb3J0U3BlY2lmaWVyXCIsXG4gICAgICAgIG5hbWUsXG4gICAgICAgIGJpbmRpbmc6IHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJCaW5kaW5nSWRlbnRpZmllclwiLCBuYW1lOiBib3VuZE5hbWUgfSwgbG9jYXRpb24pLFxuICAgICAgfSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZU5hbWVTcGFjZUJpbmRpbmcoYm91bmROYW1lcykge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5NVUwpO1xuICAgIHRoaXMuZXhwZWN0Q29udGV4dHVhbEtleXdvcmQoXCJhc1wiKTtcbiAgICBsZXQgaWRlbnRpZmllckxvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCBpZGVudGlmaWVyID0gdGhpcy5wYXJzZUlkZW50aWZpZXIoKTtcbiAgICBpZiAoe30uaGFzT3duUHJvcGVydHkuY2FsbChib3VuZE5hbWVzLCBcIiRcIiArIGlkZW50aWZpZXIpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKGlkZW50aWZpZXJMb2NhdGlvbiwgRXJyb3JNZXNzYWdlcy5JTVBPUlRfRFVQRSk7XG4gICAgfVxuICAgIGJvdW5kTmFtZXNbXCIkXCIgKyBpZGVudGlmaWVyXSA9IHRydWU7XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJCaW5kaW5nSWRlbnRpZmllclwiLCBuYW1lOiBpZGVudGlmaWVyIH0sIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VOYW1lZEltcG9ydHMoYm91bmROYW1lcykge1xuICAgIGxldCByZXN1bHQgPSBbXTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTEJSQUNFKTtcbiAgICB3aGlsZSAoIXRoaXMuZWF0KFRva2VuVHlwZS5SQlJBQ0UpKSB7XG4gICAgICByZXN1bHQucHVzaCh0aGlzLnBhcnNlSW1wb3J0U3BlY2lmaWVyKGJvdW5kTmFtZXMpKTtcbiAgICAgIGlmICghdGhpcy5lYXQoVG9rZW5UeXBlLkNPTU1BKSkge1xuICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUkJSQUNFKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBwYXJzZUZyb21DbGF1c2UoKSB7XG4gICAgdGhpcy5leHBlY3RDb250ZXh0dWFsS2V5d29yZChcImZyb21cIik7XG4gICAgbGV0IHZhbHVlID0gdGhpcy5leHBlY3QoVG9rZW5UeXBlLlNUUklORykuX3ZhbHVlO1xuICAgIHRoaXMuY29uc3VtZVNlbWljb2xvbigpO1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfVxuXG4gIHBhcnNlSW1wb3J0RGVjbGFyYXRpb24oKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCksIGRlZmF1bHRCaW5kaW5nID0gbnVsbCwgbW9kdWxlU3BlY2lmaWVyLCBib3VuZE5hbWVzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuSU1QT1JUKTtcbiAgICBzd2l0Y2ggKHRoaXMubG9va2FoZWFkLnR5cGUpIHtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlNUUklORzpcbiAgICAgICAgbW9kdWxlU3BlY2lmaWVyID0gdGhpcy5sZXgoKS5fdmFsdWU7XG4gICAgICAgIHRoaXMuY29uc3VtZVNlbWljb2xvbigpO1xuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIkltcG9ydFwiLCBkZWZhdWx0QmluZGluZzogbnVsbCwgbmFtZWRJbXBvcnRzOiBbXSwgbW9kdWxlU3BlY2lmaWVyIH0sIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgY2FzZSBUb2tlblR5cGUuSURFTlRJRklFUjpcbiAgICAgICAgZGVmYXVsdEJpbmRpbmcgPSB0aGlzLmV4cGVjdChUb2tlblR5cGUuSURFTlRJRklFUikudmFsdWU7XG4gICAgICAgIGJvdW5kTmFtZXNbXCIkXCIgKyBkZWZhdWx0QmluZGluZ10gPSB0cnVlO1xuICAgICAgICBpZiAoIXRoaXMuZWF0KFRva2VuVHlwZS5DT01NQSkpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIkltcG9ydFwiLCBkZWZhdWx0QmluZGluZywgbmFtZWRJbXBvcnRzOiBbXSwgbW9kdWxlU3BlY2lmaWVyOiB0aGlzLnBhcnNlRnJvbUNsYXVzZSgpIH0sIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuTVVMKSkge1xuICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHtcbiAgICAgICAgdHlwZTogXCJJbXBvcnROYW1lc3BhY2VcIixcbiAgICAgICAgZGVmYXVsdEJpbmRpbmcsXG4gICAgICAgIG5hbWVzcGFjZUJpbmRpbmc6IHRoaXMucGFyc2VOYW1lU3BhY2VCaW5kaW5nKGJvdW5kTmFtZXMpLFxuICAgICAgICBtb2R1bGVTcGVjaWZpZXI6IHRoaXMucGFyc2VGcm9tQ2xhdXNlKCkgfSwgc3RhcnRMb2NhdGlvbik7XG4gICAgfSBlbHNlIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5MQlJBQ0UpKSB7XG4gICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24oe1xuICAgICAgICB0eXBlOiBcIkltcG9ydFwiLFxuICAgICAgICBkZWZhdWx0QmluZGluZyxcbiAgICAgICAgbmFtZWRJbXBvcnRzOiB0aGlzLnBhcnNlTmFtZWRJbXBvcnRzKGJvdW5kTmFtZXMpLFxuICAgICAgICBtb2R1bGVTcGVjaWZpZXI6IHRoaXMucGFyc2VGcm9tQ2xhdXNlKCkgfSwgc3RhcnRMb2NhdGlvbik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgfVxuICB9XG5cbiAgcGFyc2VFeHBvcnRTcGVjaWZpZXIoZXhwb3J0ZWROYW1lcywgZXhwb3J0ZWRCaW5kaW5ncykge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCBuYW1lID0gdGhpcy5wYXJzZUlkZW50aWZpZXIoKTtcbiAgICBleHBvcnRlZEJpbmRpbmdzW1wiJFwiICsgbmFtZV0gPSB0cnVlO1xuICAgIGlmICh0aGlzLmVhdENvbnRleHR1YWxLZXl3b3JkKFwiYXNcIikpIHtcbiAgICAgIGxldCBleHBvcnRlZE5hbWUgPSB0aGlzLnBhcnNlSWRlbnRpZmllck5hbWUoKTtcbiAgICAgIGlmICh7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGV4cG9ydGVkTmFtZXMsIFwiJFwiICsgZXhwb3J0ZWROYW1lKSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuRFVQTElDQVRFX0VYUE9SVEVEX05BTUUsIGV4cG9ydGVkTmFtZSk7XG4gICAgICB9XG4gICAgICBleHBvcnRlZE5hbWVzW1wiJFwiICsgZXhwb3J0ZWROYW1lXSA9IHRydWU7XG4gICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIkV4cG9ydFNwZWNpZmllclwiLCBuYW1lLCBleHBvcnRlZE5hbWUgfSwgc3RhcnRMb2NhdGlvbik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGV4cG9ydGVkTmFtZXMsIFwiJFwiICsgbmFtZSkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLkRVUExJQ0FURV9FWFBPUlRFRF9OQU1FLCBuYW1lKTtcbiAgICAgIH1cbiAgICAgIGV4cG9ydGVkTmFtZXNbXCIkXCIgKyBuYW1lXSA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiRXhwb3J0U3BlY2lmaWVyXCIsIG5hbWU6IG51bGwsIGV4cG9ydGVkTmFtZTogbmFtZSB9LCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlRXhwb3J0Q2xhdXNlKGV4cG9ydGVkTmFtZXMsIGV4cG9ydGVkQmluZGluZ3MpIHtcbiAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxCUkFDRSk7XG4gICAgd2hpbGUgKCF0aGlzLmVhdChUb2tlblR5cGUuUkJSQUNFKSkge1xuICAgICAgcmVzdWx0LnB1c2godGhpcy5wYXJzZUV4cG9ydFNwZWNpZmllcihleHBvcnRlZE5hbWVzLCBleHBvcnRlZEJpbmRpbmdzKSk7XG4gICAgICBpZiAoIXRoaXMuZWF0KFRva2VuVHlwZS5DT01NQSkpIHtcbiAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJCUkFDRSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgcGFyc2VFeHBvcnREZWNsYXJhdGlvbihleHBvcnRlZE5hbWVzLCBleHBvcnRlZEJpbmRpbmdzKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCksIGRlY2w7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkVYUE9SVCk7XG4gICAgbGV0IGlzVmFyID0gZmFsc2UsIGtleSwgb2xkTEROID0gdGhpcy5MRE4sIG9sZFZETiA9IHRoaXMuVkROO1xuICAgIHRoaXMuTEROID0gW107XG4gICAgdGhpcy5WRE4gPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIHN3aXRjaCAodGhpcy5sb29rYWhlYWQudHlwZSkge1xuICAgICAgY2FzZSBUb2tlblR5cGUuTVVMOlxuICAgICAgICB0aGlzLmxleCgpO1xuICAgICAgICAvLyBleHBvcnQgKiBGcm9tQ2xhdXNlIDtcbiAgICAgICAgZGVjbCA9IHsgdHlwZTogXCJFeHBvcnRBbGxGcm9tXCIsIG1vZHVsZVNwZWNpZmllcjogdGhpcy5wYXJzZUZyb21DbGF1c2UoKSB9O1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkxCUkFDRTpcbiAgICAgICAgLy8gZXhwb3J0IEV4cG9ydENsYXVzZSBGcm9tQ2xhdXNlIDtcbiAgICAgICAgLy8gZXhwb3J0IEV4cG9ydENsYXVzZSA7XG4gICAgICAgIGxldCBuYW1lZEV4cG9ydHMgPSB0aGlzLnBhcnNlRXhwb3J0Q2xhdXNlKGV4cG9ydGVkTmFtZXMsIGV4cG9ydGVkQmluZGluZ3MpO1xuICAgICAgICBsZXQgbW9kdWxlU3BlY2lmaWVyID0gbnVsbDtcbiAgICAgICAgaWYgKHRoaXMubWF0Y2hDb250ZXh0dWFsS2V5d29yZChcImZyb21cIikpIHtcbiAgICAgICAgICBtb2R1bGVTcGVjaWZpZXIgPSB0aGlzLnBhcnNlRnJvbUNsYXVzZSgpO1xuICAgICAgICB9XG4gICAgICAgIGRlY2wgPSB7IHR5cGU6IFwiRXhwb3J0RnJvbVwiLCBuYW1lZEV4cG9ydHMsIG1vZHVsZVNwZWNpZmllciB9O1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkNMQVNTOlxuICAgICAgICAvLyBleHBvcnQgQ2xhc3NEZWNsYXJhdGlvblxuICAgICAgICBkZWNsID0geyB0eXBlOiBcIkV4cG9ydFwiLCBkZWNsYXJhdGlvbjogdGhpcy5wYXJzZUNsYXNzKHtpc0V4cHI6IGZhbHNlfSkgfTtcbiAgICAgICAgaWYgKHt9Lmhhc093blByb3BlcnR5LmNhbGwoZXhwb3J0ZWROYW1lcywgXCIkXCIgKyBkZWNsLmRlY2xhcmF0aW9uLm5hbWUubmFtZSkpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuRFVQTElDQVRFX0VYUE9SVEVEX05BTUUsIGRlY2wuZGVjbGFyYXRpb24ubmFtZS5uYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBrZXkgPSBkZWNsLmRlY2xhcmF0aW9uLm5hbWUubmFtZTtcbiAgICAgICAgZXhwb3J0ZWROYW1lc1tcIiRcIiArIGtleV0gPSB0cnVlO1xuICAgICAgICBleHBvcnRlZEJpbmRpbmdzW1wiJFwiICsga2V5XSA9IHRydWU7XG4gICAgICAgIG9sZExETi5wdXNoKGtleSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBUb2tlblR5cGUuRlVOQ1RJT046XG4gICAgICAgIC8vIGV4cG9ydCBIb2lzdGFibGVEZWNsYXJhdGlvblxuICAgICAgICBkZWNsID0geyB0eXBlOiBcIkV4cG9ydFwiLCBkZWNsYXJhdGlvbjogdGhpcy5wYXJzZUZ1bmN0aW9uKHtpc0V4cHI6IGZhbHNlLCBpc1RvcExldmVsOiB0cnVlfSkgfTtcbiAgICAgICAgaWYgKHt9Lmhhc093blByb3BlcnR5LmNhbGwoZXhwb3J0ZWROYW1lcywgXCIkXCIgKyBkZWNsLmRlY2xhcmF0aW9uLm5hbWUubmFtZSkpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuRFVQTElDQVRFX0VYUE9SVEVEX05BTUUsIGRlY2wuZGVjbGFyYXRpb24ubmFtZS5uYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBrZXkgPSBkZWNsLmRlY2xhcmF0aW9uLm5hbWUubmFtZTtcbiAgICAgICAgZXhwb3J0ZWROYW1lc1tcIiRcIiArIGtleV0gPSB0cnVlO1xuICAgICAgICBleHBvcnRlZEJpbmRpbmdzW1wiJFwiICsga2V5XSA9IHRydWU7XG4gICAgICAgIG9sZExETi5wdXNoKGtleSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBUb2tlblR5cGUuREVGQVVMVDpcbiAgICAgICAgaWYgKHt9Lmhhc093blByb3BlcnR5LmNhbGwoZXhwb3J0ZWROYW1lcywgXCIkZGVmYXVsdFwiKSkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5EVVBMSUNBVEVfRVhQT1JURURfTkFNRSwgXCJkZWZhdWx0XCIpO1xuICAgICAgICB9XG4gICAgICAgIGV4cG9ydGVkTmFtZXMuJGRlZmF1bHQgPSB0cnVlO1xuICAgICAgICB0aGlzLmxleCgpO1xuICAgICAgICBzd2l0Y2ggKHRoaXMubG9va2FoZWFkLnR5cGUpIHtcbiAgICAgICAgICBjYXNlIFRva2VuVHlwZS5GVU5DVElPTjpcbiAgICAgICAgICAgIC8vIGV4cG9ydCBkZWZhdWx0IEhvaXN0YWJsZURlY2xhcmF0aW9uW0RlZmF1bHRdXG4gICAgICAgICAgICBkZWNsID0ge1xuICAgICAgICAgICAgICB0eXBlOiBcIkV4cG9ydERlZmF1bHRcIixcbiAgICAgICAgICAgICAgYm9keTogdGhpcy5wYXJzZUZ1bmN0aW9uKHsgaXNFeHByOiBmYWxzZSwgaW5EZWZhdWx0OiB0cnVlLCBpc1RvcExldmVsOiB0cnVlIH0pXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAga2V5ID0gZGVjbC5ib2R5Lm5hbWUubmFtZTtcbiAgICAgICAgICAgIGlmIChrZXkgIT09IFwiKmRlZmF1bHQqXCIpIHtcbiAgICAgICAgICAgICAgZXhwb3J0ZWRCaW5kaW5nc1tcIiRcIiArIGtleV0gPSB0cnVlO1xuICAgICAgICAgICAgICBvbGRMRE4ucHVzaChrZXkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBUb2tlblR5cGUuQ0xBU1M6XG4gICAgICAgICAgICAvLyBleHBvcnQgZGVmYXVsdCBDbGFzc0RlY2xhcmF0aW9uW0RlZmF1bHRdXG4gICAgICAgICAgICBkZWNsID0geyB0eXBlOiBcIkV4cG9ydERlZmF1bHRcIiwgYm9keTogdGhpcy5wYXJzZUNsYXNzKHsgaXNFeHByOiBmYWxzZSwgaW5EZWZhdWx0OiB0cnVlIH0pIH07XG4gICAgICAgICAgICBrZXkgPSBkZWNsLmJvZHkubmFtZS5uYW1lO1xuICAgICAgICAgICAgaWYgKGtleSAhPT0gXCIqZGVmYXVsdCpcIikge1xuICAgICAgICAgICAgICBleHBvcnRlZEJpbmRpbmdzW1wiJFwiICsga2V5XSA9IHRydWU7XG4gICAgICAgICAgICAgIG9sZExETi5wdXNoKGtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHtcbiAgICAgICAgICAgIC8vIGV4cG9ydCBkZWZhdWx0IFtsb29rYWhlYWQg4oiJIHtmdW5jdGlvbiwgY2xhc3N9XSBBc3NpZ25tZW50RXhwcmVzc2lvbltJbl0gO1xuICAgICAgICAgICAgZGVjbCA9IHsgdHlwZTogXCJFeHBvcnREZWZhdWx0XCIsIGJvZHk6IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpIH07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFRva2VuVHlwZS5WQVI6XG4gICAgICAgIGlzVmFyID0gdHJ1ZTtcbiAgICAgICAgLy8gZmFsbHMgdGhyb3VnaFxuICAgICAgY2FzZSBUb2tlblR5cGUuTEVUOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQ09OU1Q6XG4gICAgICAgIC8vIGV4cG9ydCBMZXhpY2FsRGVjbGFyYXRpb25cbiAgICAgIHtcbiAgICAgICAgbGV0IGJvdW5kTmFtZXMgPSBbXTtcbiAgICAgICAgZGVjbCA9IHsgdHlwZTogXCJFeHBvcnRcIiwgZGVjbGFyYXRpb246IHRoaXMucGFyc2VWYXJpYWJsZURlY2xhcmF0aW9uKHtib3VuZE5hbWVzfSkgfTtcbiAgICAgICAgYm91bmROYW1lcy5mb3JFYWNoKG5hbWUgPT4ge1xuICAgICAgICAgICAgaWYgKHt9Lmhhc093blByb3BlcnR5LmNhbGwoZXhwb3J0ZWROYW1lcywgXCIkXCIgKyBuYW1lKSkge1xuICAgICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuRFVQTElDQVRFX0VYUE9SVEVEX05BTUUsIG5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZXhwb3J0ZWROYW1lc1tcIiRcIiArIG5hbWVdID0gdHJ1ZTtcbiAgICAgICAgICAgIGV4cG9ydGVkQmluZGluZ3NbXCIkXCIgKyBuYW1lXSA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgICBpZiAoaXNWYXIpIHtcbiAgICAgICAgICBib3VuZE5hbWVzLmZvckVhY2gobmFtZSA9PiBvbGRWRE5bXCIkXCIgKyBuYW1lXSA9IHRydWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIFtdLnB1c2guYXBwbHkob2xkTEROLCBib3VuZE5hbWVzKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNvbnN1bWVTZW1pY29sb24oKTtcbiAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuICAgIH1cbiAgICB0aGlzLkxETiA9IG9sZExETjtcbiAgICB0aGlzLlZETiA9IG9sZFZETjtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24oZGVjbCwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZU1vZHVsZUl0ZW0oZXhwb3J0ZWROYW1lcywgZXhwb3J0ZWRCaW5kaW5ncykge1xuICAgIHN3aXRjaCAodGhpcy5sb29rYWhlYWQudHlwZSkge1xuICAgICAgY2FzZSBUb2tlblR5cGUuSU1QT1JUOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZUltcG9ydERlY2xhcmF0aW9uKCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5FWFBPUlQ6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlRXhwb3J0RGVjbGFyYXRpb24oZXhwb3J0ZWROYW1lcywgZXhwb3J0ZWRCaW5kaW5ncyk7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZVN0YXRlbWVudExpc3RJdGVtKCk7XG4gICAgfVxuICB9XG5cbiAgbG9va2FoZWFkTGV4aWNhbERlY2xhcmF0aW9uKCkge1xuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5MRVQpIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLkNPTlNUKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5JREVOVElGSUVSKSAmJiB0aGlzLmxvb2thaGVhZC52YWx1ZSA9PT0gXCJsZXRcIikge1xuICAgICAgbGV0IGxleGVyU3RhdGUgPSB0aGlzLnNhdmVMZXhlclN0YXRlKCk7XG4gICAgICB0aGlzLmxleCgpO1xuICAgICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLllJRUxEKSB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5JREVOVElGSUVSKSB8fFxuICAgICAgICB0aGlzLm1hdGNoKFRva2VuVHlwZS5MQlJBQ0UpIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLkxCUkFDSykpIHtcbiAgICAgICAgdGhpcy5yZXN0b3JlTGV4ZXJTdGF0ZShsZXhlclN0YXRlKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnJlc3RvcmVMZXhlclN0YXRlKGxleGVyU3RhdGUpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwYXJzZVN0YXRlbWVudExpc3RJdGVtKHtpc1RvcExldmVsID0gZmFsc2V9ID0ge30pIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBpZiAodGhpcy5lb2YoKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICB9XG5cbiAgICBsZXQgZGVjbCA9IHRoaXMud3JhcFZETigoKSA9PiB7XG4gICAgICBzd2l0Y2ggKHRoaXMubG9va2FoZWFkLnR5cGUpIHtcbiAgICAgICAgY2FzZSBUb2tlblR5cGUuRlVOQ1RJT046XG4gICAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VGdW5jdGlvbih7aXNFeHByOiBmYWxzZSwgaXNUb3BMZXZlbH0pO1xuICAgICAgICBjYXNlIFRva2VuVHlwZS5DTEFTUzpcbiAgICAgICAgICByZXR1cm4gdGhpcy5wYXJzZUNsYXNzKHtpc0V4cHI6IGZhbHNlfSk7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgaWYgKHRoaXMubG9va2FoZWFkTGV4aWNhbERlY2xhcmF0aW9uKCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnBhcnNlVmFyaWFibGVEZWNsYXJhdGlvblN0YXRlbWVudCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gdGhpcy5wYXJzZVN0YXRlbWVudCh7YWxsb3dMYWJlbGVkRnVuY3Rpb246IHRydWUsIGlzVG9wTGV2ZWx9KTtcbiAgICAgIH1cbiAgICB9LCB0aGlzLmNoZWNrQmxvY2tTY29wZSk7XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKGRlY2wsIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VTdGF0ZW1lbnQoe2FsbG93TGFiZWxlZEZ1bmN0aW9uID0gZmFsc2UsIGlzVG9wTGV2ZWwgPSBmYWxzZX0gPSB7fSkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCBvcmlnaW5hbExETiA9IHRoaXMuTEROO1xuICAgIHRoaXMuTEROID0gW107XG4gICAgdmFyIHN0bXQgPSB0aGlzLndyYXBWRE4oKCkgPT4gdGhpcy5wYXJzZVN0YXRlbWVudEhlbHBlcihhbGxvd0xhYmVsZWRGdW5jdGlvbiwgb3JpZ2luYWxMRE4sIGlzVG9wTGV2ZWwpKTtcbiAgICB0aGlzLkxETiA9IG9yaWdpbmFsTEROO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihzdG10LCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlU3RhdGVtZW50SGVscGVyKGFsbG93TGFiZWxlZEZ1bmN0aW9uLCBvcmlnaW5hbExETiwgaXNUb3BMZXZlbCkge1xuICAgIGlmICh0aGlzLmVvZigpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuICAgIH1cblxuICAgIHN3aXRjaCAodGhpcy5sb29rYWhlYWQudHlwZSkge1xuICAgICAgY2FzZSBUb2tlblR5cGUuU0VNSUNPTE9OOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZUVtcHR5U3RhdGVtZW50KCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5MQlJBQ0U6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlQmxvY2tTdGF0ZW1lbnQoKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkxQQVJFTjpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VFeHByZXNzaW9uU3RhdGVtZW50KCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5CUkVBSzpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VCcmVha1N0YXRlbWVudCgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuQ09OVElOVUU6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlQ29udGludWVTdGF0ZW1lbnQoKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkRFQlVHR0VSOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZURlYnVnZ2VyU3RhdGVtZW50KCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5ETzpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VEb1doaWxlU3RhdGVtZW50KCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5GT1I6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlRm9yU3RhdGVtZW50KCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5JRjpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VJZlN0YXRlbWVudCgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuUkVUVVJOOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZVJldHVyblN0YXRlbWVudCgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuU1dJVENIOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZVN3aXRjaFN0YXRlbWVudCgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuVEhST1c6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlVGhyb3dTdGF0ZW1lbnQoKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlRSWTpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VUcnlTdGF0ZW1lbnQoKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlZBUjpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VWYXJpYWJsZURlY2xhcmF0aW9uU3RhdGVtZW50KCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5XSElMRTpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VXaGlsZVN0YXRlbWVudCgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuV0lUSDpcbiAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VXaXRoU3RhdGVtZW50KCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5GVU5DVElPTjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkNMQVNTOlxuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuXG4gICAgICBkZWZhdWx0OiB7XG4gICAgICAgIGlmICh0aGlzLmxvb2thaGVhZExleGljYWxEZWNsYXJhdGlvbigpKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgZXhwciA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICAgIC8vIDEyLjEyIExhYmVsbGVkIFN0YXRlbWVudHM7XG4gICAgICAgIGlmIChleHByLnR5cGUgPT09IFwiSWRlbnRpZmllckV4cHJlc3Npb25cIiAmJiB0aGlzLmVhdChUb2tlblR5cGUuQ09MT04pKSB7XG4gICAgICAgICAgbGV0IGtleSA9IFwiJFwiICsgZXhwci5uYW1lO1xuICAgICAgICAgIGlmICh7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHRoaXMubGFiZWxTZXQsIGtleSkpIHtcbiAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5MQUJFTF9SRURFQ0xBUkFUSU9OLCBleHByLm5hbWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLkxETiA9IG9yaWdpbmFsTEROO1xuICAgICAgICAgIHRoaXMubGFiZWxTZXRba2V5XSA9IHRydWU7XG4gICAgICAgICAgbGV0IGxhYmVsZWRCb2R5O1xuICAgICAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5GVU5DVElPTikpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnN0cmljdCB8fCAhYWxsb3dMYWJlbGVkRnVuY3Rpb24pIHtcbiAgICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxhYmVsZWRCb2R5ID0gdGhpcy5wYXJzZUZ1bmN0aW9uKHtpc0V4cHI6IGZhbHNlLCBhbGxvd0dlbmVyYXRvcjogZmFsc2UsIGlzVG9wTGV2ZWx9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbGFiZWxlZEJvZHkgPSB0aGlzLnBhcnNlU3RhdGVtZW50KHthbGxvd0xhYmVsZWRGdW5jdGlvbiwgaXNUb3BMZXZlbH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICBkZWxldGUgdGhpcy5sYWJlbFNldFtrZXldO1xuICAgICAgICAgIHJldHVybiB7IHR5cGU6IFwiTGFiZWxlZFN0YXRlbWVudFwiLCBsYWJlbDogZXhwci5uYW1lLCBib2R5OiBsYWJlbGVkQm9keSB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuY29uc3VtZVNlbWljb2xvbigpO1xuICAgICAgICAgIHJldHVybiB7IHR5cGU6IFwiRXhwcmVzc2lvblN0YXRlbWVudFwiLCBleHByZXNzaW9uOiBleHByIH07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwYXJzZUVtcHR5U3RhdGVtZW50KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5TRU1JQ09MT04pO1xuICAgIHJldHVybiB7IHR5cGU6IFwiRW1wdHlTdGF0ZW1lbnRcIiB9O1xuICB9XG5cbiAgcGFyc2VCbG9ja1N0YXRlbWVudCgpIHtcbiAgICBsZXQgc3RtdCA9IHsgdHlwZTogXCJCbG9ja1N0YXRlbWVudFwiLCBibG9jazogdGhpcy5wYXJzZUJsb2NrKCkgfTtcbiAgICB0aGlzLmNoZWNrQmxvY2tTY29wZSgpO1xuICAgIHJldHVybiBzdG10O1xuICB9XG5cbiAgcGFyc2VFeHByZXNzaW9uU3RhdGVtZW50KCkge1xuICAgIGxldCBleHByID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICB0aGlzLmNvbnN1bWVTZW1pY29sb24oKTtcbiAgICByZXR1cm4geyB0eXBlOiBcIkV4cHJlc3Npb25TdGF0ZW1lbnRcIiwgZXhwcmVzc2lvbjogZXhwciB9O1xuICB9XG5cbiAgcGFyc2VCcmVha1N0YXRlbWVudCgpIHtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuQlJFQUspO1xuXG4gICAgLy8gQ2F0Y2ggdGhlIHZlcnkgY29tbW9uIGNhc2UgZmlyc3Q6IGltbWVkaWF0ZWx5IGEgc2VtaWNvbG9uIChVKzAwM0IpLlxuICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuU0VNSUNPTE9OKSkge1xuICAgICAgaWYgKCEodGhpcy5pbkl0ZXJhdGlvbiB8fCB0aGlzLmluU3dpdGNoKSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLklMTEVHQUxfQlJFQUspO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4geyB0eXBlOiBcIkJyZWFrU3RhdGVtZW50XCIsIGxhYmVsOiBudWxsIH07XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0KSB7XG4gICAgICBpZiAoISh0aGlzLmluSXRlcmF0aW9uIHx8IHRoaXMuaW5Td2l0Y2gpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuSUxMRUdBTF9CUkVBSyk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7IHR5cGU6IFwiQnJlYWtTdGF0ZW1lbnRcIiwgbGFiZWw6IG51bGwgfTtcbiAgICB9XG5cbiAgICBsZXQgbGFiZWwgPSBudWxsO1xuICAgIGlmICh0aGlzLmxvb2thaGVhZC50eXBlID09PSBUb2tlblR5cGUuSURFTlRJRklFUikge1xuICAgICAgbGFiZWwgPSB0aGlzLnBhcnNlSWRlbnRpZmllcigpO1xuXG4gICAgICBsZXQga2V5ID0gXCIkXCIgKyBsYWJlbDtcbiAgICAgIGlmICghe30uaGFzT3duUHJvcGVydHkuY2FsbCh0aGlzLmxhYmVsU2V0LCBrZXkpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTktOT1dOX0xBQkVMLCBsYWJlbCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5jb25zdW1lU2VtaWNvbG9uKCk7XG5cbiAgICBpZiAobGFiZWwgPT0gbnVsbCAmJiAhKHRoaXMuaW5JdGVyYXRpb24gfHwgdGhpcy5pblN3aXRjaCkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuSUxMRUdBTF9CUkVBSyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgdHlwZTogXCJCcmVha1N0YXRlbWVudFwiLCBsYWJlbCB9O1xuICB9XG5cbiAgcGFyc2VDb250aW51ZVN0YXRlbWVudCgpIHtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuQ09OVElOVUUpO1xuXG4gICAgLy8gQ2F0Y2ggdGhlIHZlcnkgY29tbW9uIGNhc2UgZmlyc3Q6IGltbWVkaWF0ZWx5IGEgc2VtaWNvbG9uIChVKzAwM0IpLlxuICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuU0VNSUNPTE9OKSkge1xuICAgICAgaWYgKCF0aGlzLmluSXRlcmF0aW9uKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuSUxMRUdBTF9DT05USU5VRSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7IHR5cGU6IFwiQ29udGludWVTdGF0ZW1lbnRcIiwgbGFiZWw6IG51bGwgfTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQpIHtcbiAgICAgIGlmICghdGhpcy5pbkl0ZXJhdGlvbikge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLklMTEVHQUxfQ09OVElOVUUpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4geyB0eXBlOiBcIkNvbnRpbnVlU3RhdGVtZW50XCIsIGxhYmVsOiBudWxsIH07XG4gICAgfVxuXG4gICAgbGV0IGxhYmVsID0gbnVsbDtcbiAgICBpZiAodGhpcy5sb29rYWhlYWQudHlwZSA9PT0gVG9rZW5UeXBlLklERU5USUZJRVIpIHtcbiAgICAgIGxhYmVsID0gdGhpcy5wYXJzZUlkZW50aWZpZXIoKTtcblxuICAgICAgbGV0IGtleSA9IFwiJFwiICsgbGFiZWw7XG4gICAgICBpZiAoIXt9Lmhhc093blByb3BlcnR5LmNhbGwodGhpcy5sYWJlbFNldCwga2V5KSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5LTk9XTl9MQUJFTCwgbGFiZWwpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuY29uc3VtZVNlbWljb2xvbigpO1xuICAgIGlmICghdGhpcy5pbkl0ZXJhdGlvbikge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5JTExFR0FMX0NPTlRJTlVFKTtcbiAgICB9XG5cbiAgICByZXR1cm4geyB0eXBlOiBcIkNvbnRpbnVlU3RhdGVtZW50XCIsIGxhYmVsIH07XG4gIH1cblxuXG4gIHBhcnNlRGVidWdnZXJTdGF0ZW1lbnQoKSB7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkRFQlVHR0VSKTtcbiAgICB0aGlzLmNvbnN1bWVTZW1pY29sb24oKTtcbiAgICByZXR1cm4geyB0eXBlOiBcIkRlYnVnZ2VyU3RhdGVtZW50XCIgfTtcbiAgfVxuXG4gIHBhcnNlRG9XaGlsZVN0YXRlbWVudCgpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuRE8pO1xuICAgIGxldCBvbGRJbkl0ZXJhdGlvbiA9IHRoaXMuaW5JdGVyYXRpb247XG4gICAgdGhpcy5pbkl0ZXJhdGlvbiA9IHRydWU7XG4gICAgbGV0IGJvZHkgPSB0aGlzLnBhcnNlU3RhdGVtZW50KCk7XG4gICAgdGhpcy5pbkl0ZXJhdGlvbiA9IG9sZEluSXRlcmF0aW9uO1xuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLldISUxFKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTFBBUkVOKTtcbiAgICBsZXQgdGVzdCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJQQVJFTik7XG4gICAgdGhpcy5lYXQoVG9rZW5UeXBlLlNFTUlDT0xPTik7XG5cbiAgICByZXR1cm4geyB0eXBlOiBcIkRvV2hpbGVTdGF0ZW1lbnRcIiwgYm9keSwgdGVzdCB9O1xuICB9XG5cbiAgc3RhdGljIGlzVmFsaWRTaW1wbGVBc3NpZ25tZW50VGFyZ2V0KG5vZGUpIHtcbiAgICBzd2l0Y2ggKG5vZGUudHlwZSkge1xuICAgICAgY2FzZSBcIkJpbmRpbmdJZGVudGlmaWVyXCI6XG4gICAgICBjYXNlIFwiSWRlbnRpZmllckV4cHJlc3Npb25cIjpcbiAgICAgIGNhc2UgXCJDb21wdXRlZE1lbWJlckV4cHJlc3Npb25cIjpcbiAgICAgIGNhc2UgXCJTdGF0aWNNZW1iZXJFeHByZXNzaW9uXCI6XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBzdGF0aWMgYm91bmROYW1lcyhub2RlKSB7XG4gICAgc3dpdGNoIChub2RlLnR5cGUpIHtcbiAgICAgIGNhc2UgXCJCaW5kaW5nSWRlbnRpZmllclwiOlxuICAgICAgICByZXR1cm4gW25vZGUubmFtZV07XG4gICAgICBjYXNlIFwiQmluZGluZ1dpdGhEZWZhdWx0XCI6XG4gICAgICAgIHJldHVybiBQYXJzZXIuYm91bmROYW1lcyhub2RlLmJpbmRpbmcpO1xuICAgICAgY2FzZSBcIkFycmF5QmluZGluZ1wiOiB7XG4gICAgICAgIGxldCBuYW1lcyA9IFtdO1xuICAgICAgICBub2RlLmVsZW1lbnRzLmZpbHRlcihlID0+IGUgIT0gbnVsbCkuZm9yRWFjaChlID0+IFtdLnB1c2guYXBwbHkobmFtZXMsIFBhcnNlci5ib3VuZE5hbWVzKGUpKSk7XG4gICAgICAgIGlmIChub2RlLnJlc3RFbGVtZW50ICE9IG51bGwpIHtcbiAgICAgICAgICBbXS5wdXNoLmFwcGx5KG5hbWVzLCBQYXJzZXIuYm91bmROYW1lcyhub2RlLnJlc3RFbGVtZW50KSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5hbWVzO1xuICAgICAgfVxuICAgICAgY2FzZSBcIk9iamVjdEJpbmRpbmdcIjoge1xuICAgICAgICBsZXQgbmFtZXMgPSBbXTtcbiAgICAgICAgbm9kZS5wcm9wZXJ0aWVzLmZvckVhY2gocCA9PiB7XG4gICAgICAgICAgc3dpdGNoIChwLnR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgXCJCaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyXCI6XG4gICAgICAgICAgICAgIG5hbWVzLnB1c2gocC5iaW5kaW5nLm5hbWUpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJCaW5kaW5nUHJvcGVydHlQcm9wZXJ0eVwiOlxuICAgICAgICAgICAgICBbXS5wdXNoLmFwcGx5KG5hbWVzLCBQYXJzZXIuYm91bmROYW1lcyhwLmJpbmRpbmcpKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAvLyBpc3RhbmJ1bCBpZ25vcmUgbmV4dFxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiYm91bmROYW1lcyBjYWxsZWQgb24gT2JqZWN0QmluZGluZyB3aXRoIGludmFsaWQgcHJvcGVydHk6IFwiICsgcC50eXBlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gbmFtZXM7XG4gICAgICB9XG4gICAgICBjYXNlIFwiQ29tcHV0ZWRNZW1iZXJFeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiU3RhdGljTWVtYmVyRXhwcmVzc2lvblwiOlxuICAgICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIC8vIGlzdGFuYnVsIGlnbm9yZSBuZXh0XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiYm91bmROYW1lcyBjYWxsZWQgb24gaW52YWxpZCBhc3NpZ25tZW50IHRhcmdldDogXCIgKyBub2RlLnR5cGUpO1xuICB9XG5cbiAgcGFyc2VGb3JTdGF0ZW1lbnQoKSB7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkZPUik7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgbGV0IHRlc3QgPSBudWxsO1xuICAgIGxldCByaWdodCA9IG51bGw7XG4gICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5TRU1JQ09MT04pKSB7XG4gICAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlNFTUlDT0xPTikpIHtcbiAgICAgICAgdGVzdCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICB9XG4gICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuU0VNSUNPTE9OKTtcbiAgICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuUlBBUkVOKSkge1xuICAgICAgICByaWdodCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiBcIkZvclN0YXRlbWVudFwiLFxuICAgICAgICBpbml0OiBudWxsLFxuICAgICAgICB0ZXN0LFxuICAgICAgICB1cGRhdGU6IHJpZ2h0LFxuICAgICAgICBib2R5OiB0aGlzLmdldEl0ZXJhdG9yU3RhdGVtZW50RXBpbG9ndWUoKVxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IHN0YXJ0c1dpdGhMZXQgPSB0aGlzLm1hdGNoKFRva2VuVHlwZS5MRVQpIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLklERU5USUZJRVIpICYmIHRoaXMubG9va2FoZWFkLnZhbHVlID09PSBcImxldFwiO1xuICAgICAgbGV0IGlzRm9yRGVjbCA9IHRoaXMubG9va2FoZWFkTGV4aWNhbERlY2xhcmF0aW9uKCk7XG4gICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuVkFSKSB8fCBpc0ZvckRlY2wpIHtcbiAgICAgICAgbGV0IHByZXZpb3VzQWxsb3dJbiA9IHRoaXMuYWxsb3dJbjtcbiAgICAgICAgdGhpcy5hbGxvd0luID0gZmFsc2U7XG4gICAgICAgIGxldCBpbml0ID0gdGhpcy5wYXJzZVZhcmlhYmxlRGVjbGFyYXRpb24oe2luRm9yOiB0cnVlfSk7XG4gICAgICAgIHRoaXMuYWxsb3dJbiA9IHByZXZpb3VzQWxsb3dJbjtcblxuICAgICAgICBpZiAoaW5pdC5kZWNsYXJhdG9ycy5sZW5ndGggPT09IDEgJiYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLklOKSB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5PRikpKSB7XG4gICAgICAgICAgbGV0IHR5cGU7XG5cbiAgICAgICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuSU4pKSB7XG4gICAgICAgICAgICBpZiAoaW5pdC5kZWNsYXJhdG9yc1swXS5pbml0ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLklOVkFMSURfVkFSX0lOSVRfRk9SX0lOKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHR5cGUgPSBcIkZvckluU3RhdGVtZW50XCI7XG4gICAgICAgICAgICB0aGlzLmxleCgpO1xuICAgICAgICAgICAgcmlnaHQgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoaW5pdC5kZWNsYXJhdG9yc1swXS5pbml0ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLklOVkFMSURfVkFSX0lOSVRfRk9SX09GKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHR5cGUgPSBcIkZvck9mU3RhdGVtZW50XCI7XG4gICAgICAgICAgICBmb3IgKGxldCBrZXkgaW4gdGhpcy5WRE4pIHtcbiAgICAgICAgICAgICAgdGhpcy5WRE5ba2V5XSA9IEZPUl9PRl9WQVI7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMubGV4KCk7XG4gICAgICAgICAgICByaWdodCA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGxldCBib2R5ID0gdGhpcy53cmFwVkROKHRoaXMuZ2V0SXRlcmF0b3JTdGF0ZW1lbnRFcGlsb2d1ZSwgaXNGb3JEZWNsICYmIHRoaXMuY2hlY2tCbG9ja1Njb3BlKTtcblxuICAgICAgICAgIHJldHVybiB7IHR5cGUsIGxlZnQ6IGluaXQsIHJpZ2h0LCBib2R5IH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlNFTUlDT0xPTik7XG4gICAgICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5TRU1JQ09MT04pKSB7XG4gICAgICAgICAgICB0ZXN0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlNFTUlDT0xPTik7XG4gICAgICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5SUEFSRU4pKSB7XG4gICAgICAgICAgICByaWdodCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiBcIkZvclN0YXRlbWVudFwiLFxuICAgICAgICAgICAgaW5pdCxcbiAgICAgICAgICAgIHRlc3QsXG4gICAgICAgICAgICB1cGRhdGU6IHJpZ2h0LFxuICAgICAgICAgICAgYm9keTogdGhpcy53cmFwVkROKHRoaXMuZ2V0SXRlcmF0b3JTdGF0ZW1lbnRFcGlsb2d1ZSwgaXNGb3JEZWNsICYmIHRoaXMuY2hlY2tCbG9ja1Njb3BlKVxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBwcmV2aW91c0FsbG93SW4gPSB0aGlzLmFsbG93SW47XG4gICAgICAgIHRoaXMuYWxsb3dJbiA9IGZhbHNlO1xuICAgICAgICBsZXQgaW5pdCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICAgIHRoaXMuYWxsb3dJbiA9IHByZXZpb3VzQWxsb3dJbjtcblxuICAgICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuSU4pIHx8ICFzdGFydHNXaXRoTGV0ICYmIHRoaXMubWF0Y2goVG9rZW5UeXBlLk9GKSkge1xuICAgICAgICAgIGlmICghUGFyc2VyLmlzVmFsaWRTaW1wbGVBc3NpZ25tZW50VGFyZ2V0KGluaXQpKSB7XG4gICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuSU5WQUxJRF9MSFNfSU5fRk9SX0lOKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBsZXQgdHlwZSA9IHRoaXMubWF0Y2goVG9rZW5UeXBlLklOKSA/IFwiRm9ySW5TdGF0ZW1lbnRcIiA6IFwiRm9yT2ZTdGF0ZW1lbnRcIjtcblxuICAgICAgICAgIHRoaXMubGV4KCk7XG4gICAgICAgICAgcmlnaHQgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuXG4gICAgICAgICAgcmV0dXJuIHsgdHlwZSwgbGVmdDogaW5pdCwgcmlnaHQsIGJvZHk6IHRoaXMuZ2V0SXRlcmF0b3JTdGF0ZW1lbnRFcGlsb2d1ZSgpIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlNFTUlDT0xPTik7XG4gICAgICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5TRU1JQ09MT04pKSB7XG4gICAgICAgICAgICB0ZXN0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlNFTUlDT0xPTik7XG4gICAgICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5SUEFSRU4pKSB7XG4gICAgICAgICAgICByaWdodCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB7IHR5cGU6IFwiRm9yU3RhdGVtZW50XCIsIGluaXQsIHRlc3QsIHVwZGF0ZTogcmlnaHQsIGJvZHk6IHRoaXMuZ2V0SXRlcmF0b3JTdGF0ZW1lbnRFcGlsb2d1ZSgpIH07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBnZXRJdGVyYXRvclN0YXRlbWVudEVwaWxvZ3VlKCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgIGxldCBvbGRJbkl0ZXJhdGlvbiA9IHRoaXMuaW5JdGVyYXRpb247XG4gICAgdGhpcy5pbkl0ZXJhdGlvbiA9IHRydWU7XG4gICAgbGV0IGJvZHkgPSB0aGlzLnBhcnNlU3RhdGVtZW50KCk7XG4gICAgdGhpcy5pbkl0ZXJhdGlvbiA9IG9sZEluSXRlcmF0aW9uO1xuICAgIHJldHVybiBib2R5O1xuICB9XG5cbiAgcGFyc2VJZlN0YXRlbWVudCgpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuSUYpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MUEFSRU4pO1xuICAgIGxldCB0ZXN0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgIGxldCBjb25zZXF1ZW50ID0gdGhpcy5wYXJzZVN0YXRlbWVudCgpO1xuICAgIGxldCBhbHRlcm5hdGUgPSBudWxsO1xuICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuRUxTRSkpIHtcbiAgICAgIGFsdGVybmF0ZSA9IHRoaXMucGFyc2VTdGF0ZW1lbnQoKTtcbiAgICB9XG4gICAgcmV0dXJuIHsgdHlwZTogXCJJZlN0YXRlbWVudFwiLCB0ZXN0LCBjb25zZXF1ZW50LCBhbHRlcm5hdGUgfTtcbiAgfVxuXG4gIHBhcnNlUmV0dXJuU3RhdGVtZW50KCkge1xuICAgIGxldCBleHByZXNzaW9uID0gbnVsbDtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SRVRVUk4pO1xuICAgIGlmICghdGhpcy5pbkZ1bmN0aW9uQm9keSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLklMTEVHQUxfUkVUVVJOKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQpIHtcbiAgICAgIHJldHVybiB7IHR5cGU6IFwiUmV0dXJuU3RhdGVtZW50XCIsIGV4cHJlc3Npb24gfTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlNFTUlDT0xPTikpIHtcbiAgICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuUkJSQUNFKSAmJiAhdGhpcy5lb2YoKSkge1xuICAgICAgICBleHByZXNzaW9uID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmNvbnN1bWVTZW1pY29sb24oKTtcbiAgICByZXR1cm4geyB0eXBlOiBcIlJldHVyblN0YXRlbWVudFwiLCBleHByZXNzaW9uIH07XG4gIH1cblxuICBwYXJzZVdpdGhTdGF0ZW1lbnQoKSB7XG4gICAgaWYgKHRoaXMuc3RyaWN0KSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX01PREVfV0lUSCk7XG4gICAgfVxuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLldJVEgpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MUEFSRU4pO1xuICAgIGxldCBvYmplY3QgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgIGxldCBib2R5ID0gdGhpcy5wYXJzZVN0YXRlbWVudCgpO1xuXG4gICAgcmV0dXJuIHsgdHlwZTogXCJXaXRoU3RhdGVtZW50XCIsIG9iamVjdCwgYm9keSB9O1xuICB9XG5cbiAgcGFyc2VTd2l0Y2hTdGF0ZW1lbnQoKSB7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlNXSVRDSCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgbGV0IGRpc2NyaW1pbmFudCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJQQVJFTik7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxCUkFDRSk7XG5cbiAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLlJCUkFDRSkpIHtcbiAgICAgIHJldHVybiB7IHR5cGU6IFwiU3dpdGNoU3RhdGVtZW50XCIsIGRpc2NyaW1pbmFudCwgY2FzZXM6IFtdIH07XG4gICAgfVxuICAgIGxldCBvbGRJblN3aXRjaCA9IHRoaXMuaW5Td2l0Y2g7XG4gICAgdGhpcy5pblN3aXRjaCA9IHRydWU7XG4gICAgcmV0dXJuIHRoaXMud3JhcFZETigoKSA9PiB7XG4gICAgICBsZXQgY2FzZXMgPSB0aGlzLnBhcnNlU3dpdGNoQ2FzZXMoKTtcbiAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5ERUZBVUxUKSkge1xuICAgICAgICBsZXQgZGVmYXVsdENhc2UgPSB0aGlzLnBhcnNlU3dpdGNoRGVmYXVsdCgpO1xuICAgICAgICBsZXQgcG9zdERlZmF1bHRDYXNlcyA9IHRoaXMucGFyc2VTd2l0Y2hDYXNlcygpO1xuICAgICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuREVGQVVMVCkpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuTVVMVElQTEVfREVGQVVMVFNfSU5fU1dJVENIKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmluU3dpdGNoID0gb2xkSW5Td2l0Y2g7XG4gICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SQlJBQ0UpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHR5cGU6IFwiU3dpdGNoU3RhdGVtZW50V2l0aERlZmF1bHRcIixcbiAgICAgICAgICBkaXNjcmltaW5hbnQsXG4gICAgICAgICAgcHJlRGVmYXVsdENhc2VzOiBjYXNlcyxcbiAgICAgICAgICBkZWZhdWx0Q2FzZSxcbiAgICAgICAgICBwb3N0RGVmYXVsdENhc2VzXG4gICAgICAgIH07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmluU3dpdGNoID0gb2xkSW5Td2l0Y2g7XG4gICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SQlJBQ0UpO1xuICAgICAgICByZXR1cm4geyB0eXBlOiBcIlN3aXRjaFN0YXRlbWVudFwiLCBkaXNjcmltaW5hbnQsIGNhc2VzIH07XG4gICAgICB9XG4gICAgfSwgdGhpcy5jaGVja0Jsb2NrU2NvcGUpO1xuICB9XG5cbiAgcGFyc2VTd2l0Y2hDYXNlcygpIHtcbiAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgd2hpbGUgKCEodGhpcy5lb2YoKSB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0UpIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLkRFRkFVTFQpKSkge1xuICAgICAgcmVzdWx0LnB1c2godGhpcy5wYXJzZVN3aXRjaENhc2UoKSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBwYXJzZVN3aXRjaENhc2UoKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNBU0UpO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih7XG4gICAgICB0eXBlOiBcIlN3aXRjaENhc2VcIixcbiAgICAgIHRlc3Q6IHRoaXMucGFyc2VFeHByZXNzaW9uKCksXG4gICAgICBjb25zZXF1ZW50OiB0aGlzLnBhcnNlU3dpdGNoQ2FzZUJvZHkoKVxuICAgIH0sIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VTd2l0Y2hEZWZhdWx0KCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5ERUZBVUxUKTtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIlN3aXRjaERlZmF1bHRcIiwgY29uc2VxdWVudDogdGhpcy5wYXJzZVN3aXRjaENhc2VCb2R5KCkgfSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZVN3aXRjaENhc2VCb2R5KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5DT0xPTik7XG4gICAgcmV0dXJuIHRoaXMucGFyc2VTdGF0ZW1lbnRMaXN0SW5Td2l0Y2hDYXNlQm9keSgpO1xuICB9XG5cbiAgcGFyc2VTdGF0ZW1lbnRMaXN0SW5Td2l0Y2hDYXNlQm9keSgpIHtcbiAgICBsZXQgcmVzdWx0ID0gW107XG4gICAgd2hpbGUgKCEodGhpcy5lb2YoKSB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0UpIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLkRFRkFVTFQpIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLkNBU0UpKSkge1xuICAgICAgcmVzdWx0LnB1c2godGhpcy5wYXJzZVN0YXRlbWVudExpc3RJdGVtKCkpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgcGFyc2VUaHJvd1N0YXRlbWVudCgpIHtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmV4cGVjdChUb2tlblR5cGUuVEhST1cpO1xuXG4gICAgaWYgKHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0KSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLk5FV0xJTkVfQUZURVJfVEhST1cpO1xuICAgIH1cblxuICAgIGxldCBleHByZXNzaW9uID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcblxuICAgIHRoaXMuY29uc3VtZVNlbWljb2xvbigpO1xuXG4gICAgcmV0dXJuIHsgdHlwZTogXCJUaHJvd1N0YXRlbWVudFwiLCBleHByZXNzaW9uIH07XG4gIH1cblxuICBwYXJzZVRyeVN0YXRlbWVudCgpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuVFJZKTtcbiAgICBsZXQgYm9keSA9IHRoaXMud3JhcFZETih0aGlzLnBhcnNlQmxvY2ssIHRoaXMuY2hlY2tCbG9ja1Njb3BlKTtcblxuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5DQVRDSCkpIHtcbiAgICAgIGxldCBjYXRjaENsYXVzZSA9IHRoaXMucGFyc2VDYXRjaENsYXVzZSgpO1xuICAgICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5GSU5BTExZKSkge1xuICAgICAgICBsZXQgZmluYWxpemVyID0gdGhpcy53cmFwVkROKHRoaXMucGFyc2VCbG9jaywgdGhpcy5jaGVja0Jsb2NrU2NvcGUpO1xuICAgICAgICByZXR1cm4geyB0eXBlOiBcIlRyeUZpbmFsbHlTdGF0ZW1lbnRcIiwgYm9keSwgY2F0Y2hDbGF1c2UsIGZpbmFsaXplciB9O1xuICAgICAgfVxuICAgICAgcmV0dXJuIHsgdHlwZTogXCJUcnlDYXRjaFN0YXRlbWVudFwiLCBib2R5LCBjYXRjaENsYXVzZSB9O1xuICAgIH1cblxuICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuRklOQUxMWSkpIHtcbiAgICAgIGxldCBmaW5hbGl6ZXIgPSB0aGlzLndyYXBWRE4odGhpcy5wYXJzZUJsb2NrLCB0aGlzLmNoZWNrQmxvY2tTY29wZSk7XG4gICAgICByZXR1cm4geyB0eXBlOiBcIlRyeUZpbmFsbHlTdGF0ZW1lbnRcIiwgYm9keSwgY2F0Y2hDbGF1c2U6IG51bGwsIGZpbmFsaXplciB9O1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuTk9fQ0FUQ0hfT1JfRklOQUxMWSk7XG4gICAgfVxuICB9XG5cbiAgcGFyc2VWYXJpYWJsZURlY2xhcmF0aW9uU3RhdGVtZW50KCkge1xuICAgIGxldCBkZWNsYXJhdGlvbiA9IHRoaXMucGFyc2VWYXJpYWJsZURlY2xhcmF0aW9uKCk7XG4gICAgdGhpcy5jb25zdW1lU2VtaWNvbG9uKCk7XG4gICAgcmV0dXJuIHsgdHlwZTogXCJWYXJpYWJsZURlY2xhcmF0aW9uU3RhdGVtZW50XCIsIGRlY2xhcmF0aW9uIH07XG4gIH1cblxuICBwYXJzZVdoaWxlU3RhdGVtZW50KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5XSElMRSk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgcmV0dXJuIHsgdHlwZTogXCJXaGlsZVN0YXRlbWVudFwiLCB0ZXN0OiB0aGlzLnBhcnNlRXhwcmVzc2lvbigpLCBib2R5OiB0aGlzLmdldEl0ZXJhdG9yU3RhdGVtZW50RXBpbG9ndWUoKSB9O1xuICB9XG5cbiAgcGFyc2VDYXRjaENsYXVzZSgpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5DQVRDSCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgbGV0IHRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLlJQQVJFTikgfHwgdGhpcy5tYXRjaChUb2tlblR5cGUuTFBBUkVOKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRva2VuKTtcbiAgICB9XG5cbiAgICBsZXQgYmluZGluZyA9IHRoaXMucGFyc2VCaW5kaW5nVGFyZ2V0KCk7XG5cbiAgICBsZXQgYm91bmQgPSBQYXJzZXIuYm91bmROYW1lcyhiaW5kaW5nKTtcbiAgICBpZiAoZmlyc3REdXBsaWNhdGUoYm91bmQpICE9IG51bGwpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuRFVQTElDQVRFX0JJTkRJTkcsIGZpcnN0RHVwbGljYXRlKGJvdW5kKSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuc3RyaWN0ICYmIGJvdW5kLnNvbWUoaXNSZXN0cmljdGVkV29yZCkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuU1RSSUNUX0NBVENIX1ZBUklBQkxFKTtcbiAgICB9XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcblxuICAgIGxldCBib2R5ID0gdGhpcy53cmFwVkROKHRoaXMucGFyc2VCbG9jaywgdGhpcy5jaGVja0Jsb2NrU2NvcGUpO1xuXG4gICAgdGhpcy5MRE4uZm9yRWFjaChuYW1lID0+IHtcbiAgICAgIGlmIChib3VuZC5pbmRleE9mKG5hbWUpID49IDApIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5EVVBMSUNBVEVfQklORElORywgbmFtZSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgZm9yIChsZXQga2V5IGluIHRoaXMuVkROKSB7XG4gICAgICBpZiAodGhpcy5WRE5ba2V5XSA9PT0gRk9SX09GX1ZBUiAmJiBib3VuZC5pbmRleE9mKGtleS5zbGljZSgxKSkgPj0gMCkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuRFVQTElDQVRFX0NBVENIX0JJTkRJTkcsIGtleS5zbGljZSgxKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiQ2F0Y2hDbGF1c2VcIiwgYmluZGluZywgYm9keSB9LCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlQmxvY2soKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxCUkFDRSk7XG5cbiAgICBsZXQgYm9keSA9IFtdO1xuICAgIHdoaWxlICghdGhpcy5tYXRjaChUb2tlblR5cGUuUkJSQUNFKSkge1xuICAgICAgYm9keS5wdXNoKHRoaXMucGFyc2VTdGF0ZW1lbnRMaXN0SXRlbSgpKTtcbiAgICB9XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJCUkFDRSk7XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJCbG9ja1wiLCBzdGF0ZW1lbnRzOiBib2R5IH0sIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VWYXJpYWJsZURlY2xhcmF0aW9uKHtpbkZvciA9IGZhbHNlLCBib3VuZE5hbWVzID0gW119ID0ge30pIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxleCgpO1xuXG4gICAgLy8gUHJlY2VkZWQgYnkgdGhpcy5tYXRjaChUb2tlblN1YlR5cGUuVkFSKSB8fCB0aGlzLm1hdGNoKFRva2VuU3ViVHlwZS5MRVQpO1xuICAgIGxldCBraW5kID0gdG9rZW4udHlwZSA9PT0gVG9rZW5UeXBlLlZBUiA/IFwidmFyXCIgOiB0b2tlbi50eXBlID09PSBUb2tlblR5cGUuQ09OU1QgPyBcImNvbnN0XCIgOiBcImxldFwiO1xuICAgIGxldCBkZWNsYXJhdG9ycyA9IHRoaXMucGFyc2VWYXJpYWJsZURlY2xhcmF0b3JMaXN0KGtpbmQsIHtpbkZvciwgYm91bmROYW1lc30pO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiVmFyaWFibGVEZWNsYXJhdGlvblwiLCBraW5kLCBkZWNsYXJhdG9ycyB9LCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlVmFyaWFibGVEZWNsYXJhdG9yTGlzdChraW5kLCB7aW5Gb3IsIGJvdW5kTmFtZXN9KSB7XG4gICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgIGxldCBbdmFyRGVjbCwgYWxsQm91bmRdID0gdGhpcy5wYXJzZVZhcmlhYmxlRGVjbGFyYXRvcihraW5kLCB7aW5Gb3IsIGFsbG93Q29uc3RXaXRob3V0QmluZGluZzogaW5Gb3J9KTtcbiAgICByZXN1bHQucHVzaCh2YXJEZWNsKTtcbiAgICBpZiAoaW5Gb3IgJiYga2luZCA9PT0gXCJjb25zdFwiICYmIHZhckRlY2wuaW5pdCA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICB3aGlsZSAodGhpcy5lYXQoVG9rZW5UeXBlLkNPTU1BKSkge1xuICAgICAgbGV0IFtuZXh0VmFyRGVjbCwgYm91bmRdID0gdGhpcy5wYXJzZVZhcmlhYmxlRGVjbGFyYXRvcihraW5kLCB7aW5Gb3IsIGFsbG93Q29uc3RXaXRob3V0QmluZGluZzogZmFsc2V9KTtcbiAgICAgIHJlc3VsdC5wdXNoKG5leHRWYXJEZWNsKTtcbiAgICAgIGlmIChraW5kICE9PSBcInZhclwiKSB7XG4gICAgICAgIGFsbEJvdW5kID0gYWxsQm91bmQuY29uY2F0KGJvdW5kKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5zdHJpY3QgJiYgYWxsQm91bmQuc29tZShpc1Jlc3RyaWN0ZWRXb3JkKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0aGlzLmxvb2thaGVhZCwgRXJyb3JNZXNzYWdlcy5TVFJJQ1RfVkFSX05BTUUpO1xuICAgIH1cblxuICAgIGlmIChraW5kICE9PSBcInZhclwiKSB7XG4gICAgICBsZXQgZHVwZSA9IGZpcnN0RHVwbGljYXRlKGFsbEJvdW5kKTtcbiAgICAgIGlmIChkdXBlICE9PSBudWxsKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5EVVBMSUNBVEVfQklORElORywgZHVwZSk7XG4gICAgICB9XG4gICAgfVxuICAgIFtdLnB1c2guYXBwbHkoYm91bmROYW1lcywgYWxsQm91bmQpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBwYXJzZVZhcmlhYmxlRGVjbGFyYXRvcihraW5kLCB7aW5Gb3IsIGFsbG93Q29uc3RXaXRob3V0QmluZGluZ30pIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcblxuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5MUEFSRU4pKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuICAgIH1cblxuICAgIGxldCBiaW5kaW5nID0gdGhpcy5wYXJzZUJpbmRpbmdUYXJnZXQoKTtcbiAgICBpZiAoIWluRm9yICYmIGJpbmRpbmcudHlwZSAhPT0gJ0JpbmRpbmdJZGVudGlmaWVyJyAmJiAhdGhpcy5tYXRjaChUb2tlblR5cGUuQVNTSUdOKSkge1xuICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkFTU0lHTik7XG4gICAgfVxuICAgIGxldCBib3VuZCA9IFBhcnNlci5ib3VuZE5hbWVzKGJpbmRpbmcpO1xuXG4gICAgbGV0IGluaXQgPSBudWxsO1xuICAgIGlmIChraW5kID09PSBcImNvbnN0XCIpIHtcbiAgICAgIGlmICghYWxsb3dDb25zdFdpdGhvdXRCaW5kaW5nIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLkFTU0lHTikpIHtcbiAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkFTU0lHTik7XG4gICAgICAgIGluaXQgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5BU1NJR04pKSB7XG4gICAgICBpbml0ID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgfVxuXG4gICAgaWYgKGtpbmQgPT09IFwidmFyXCIpIHtcbiAgICAgIGJvdW5kLmZvckVhY2gobmFtZSA9PiB0aGlzLlZETltcIiRcIiArIG5hbWVdID0gdHJ1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChib3VuZC5pbmRleE9mKFwibGV0XCIpID49IDApIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5MRVhJQ0FMTFlfQk9VTkRfTEVUKTtcbiAgICAgIH1cbiAgICAgIFtdLnB1c2guYXBwbHkodGhpcy5MRE4sIGJvdW5kKTtcbiAgICB9XG4gICAgcmV0dXJuIFt0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiVmFyaWFibGVEZWNsYXJhdG9yXCIsIGJpbmRpbmcsIGluaXQgfSwgc3RhcnRMb2NhdGlvbiksIGJvdW5kXTtcbiAgfVxuXG4gIHN0YXRpYyBnZXRFeHByKHtleHByLCBleHByRXJyb3J9KSB7XG4gICAgaWYgKCFleHByKSB0aHJvdyBleHByRXJyb3I7XG4gICAgcmV0dXJuIGV4cHI7XG4gIH1cblxuICBwYXJzZUV4cHJlc3Npb24oKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICBsZXQgZ3JvdXAgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuQ09NTUEpKSB7XG4gICAgICB3aGlsZSAoIXRoaXMuZW9mKCkpIHtcbiAgICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5DT01NQSkpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxleCgpO1xuICAgICAgICBsZXQgZXhwciA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgICBncm91cCA9IHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJCaW5hcnlFeHByZXNzaW9uXCIsIGxlZnQ6IGdyb3VwLCBvcGVyYXRvcjogXCIsXCIsIHJpZ2h0OiBleHByIH0sIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZ3JvdXA7XG4gIH1cblxuICBwYXJzZUFycm93RXhwcmVzc2lvblRhaWwoaGVhZCwgc3RhcnRMb2NhdGlvbikge1xuICAgIGxldCBhcnJvdyA9IHRoaXMuZXhwZWN0KFRva2VuVHlwZS5BUlJPVyk7XG5cbiAgICAvLyBDb252ZXJ0IHBhcmFtIGxpc3QuXG4gICAgbGV0IHtwYXJhbXMgPSBudWxsLCByZXN0ID0gbnVsbH0gPSBoZWFkO1xuICAgIGlmIChoZWFkLnR5cGUgIT09IEFSUk9XX0VYUFJFU1NJT05fUEFSQU1TKSB7XG4gICAgICBpZiAoaGVhZC50eXBlID09PSBcIkJpbmRpbmdJZGVudGlmaWVyXCIpIHtcbiAgICAgICAgbGV0IG5hbWUgPSBoZWFkLm5hbWU7XG4gICAgICAgIGlmIChTVFJJQ1RfTU9ERV9SRVNFUlZFRF9XT1JELmhhc093blByb3BlcnR5KG5hbWUpKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlNUUklDVF9SRVNFUlZFRF9XT1JEKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNSZXN0cmljdGVkV29yZChuYW1lKSkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUEFSQU1fTkFNRSk7XG4gICAgICAgIH1cbiAgICAgICAgcGFyYW1zID0gW2hlYWRdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKGFycm93KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgcGFyYW1zTm9kZSA9IHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJGb3JtYWxQYXJhbWV0ZXJzXCIsIGl0ZW1zOiBwYXJhbXMsIHJlc3QgfSwgc3RhcnRMb2NhdGlvbik7XG5cbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuTEJSQUNFKSkge1xuICAgICAgbGV0IHByZXZpb3VzWWllbGQgPSB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uO1xuICAgICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IGZhbHNlO1xuICAgICAgbGV0IGJvdW5kUGFyYW1zID0gW10uY29uY2F0LmFwcGx5KFtdLCBwYXJhbXMubWFwKFBhcnNlci5ib3VuZE5hbWVzKSk7XG4gICAgICBsZXQgW2JvZHldID0gdGhpcy5wYXJzZUZ1bmN0aW9uQm9keShib3VuZFBhcmFtcyk7XG4gICAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gcHJldmlvdXNZaWVsZDtcbiAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiQXJyb3dFeHByZXNzaW9uXCIsIHBhcmFtczogcGFyYW1zTm9kZSwgYm9keSB9LCBzdGFydExvY2F0aW9uKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IGJvZHkgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiQXJyb3dFeHByZXNzaW9uXCIsIHBhcmFtczogcGFyYW1zTm9kZSwgYm9keSB9LCBzdGFydExvY2F0aW9uKTtcbiAgICB9XG4gIH1cblxuICBwYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCkge1xuICAgIHJldHVybiBQYXJzZXIuZ2V0RXhwcih0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb25PckJpbmRpbmdFbGVtZW50KCkpO1xuICB9XG5cbiAgcGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbk9yQmluZGluZ0VsZW1lbnQoKSB7XG4gICAgbGV0IHRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICBpZiAodGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiAmJiAhdGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlciAmJiB0aGlzLmxvb2thaGVhZC50eXBlID09PSBUb2tlblR5cGUuWUlFTEQpIHtcbiAgICAgIHJldHVybiB7IGV4cHI6IHRoaXMucGFyc2VZaWVsZEV4cHJlc3Npb24oKSwgcGF0dGVybjogbnVsbCwgaXNCaW5kaW5nRWxlbWVudDogZmFsc2UgfTtcbiAgICB9XG5cbiAgICBsZXQgeyBleHByLCBwYXR0ZXJuLCBpc0JpbmRpbmdFbGVtZW50LCBleHByRXJyb3IgfSA9IHRoaXMucGFyc2VDb25kaXRpb25hbEV4cHJlc3Npb24oKTtcblxuICAgIGlmICghdGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQgJiYgdGhpcy5tYXRjaChUb2tlblR5cGUuQVJST1cpKSB7XG4gICAgICByZXR1cm4geyBleHByOiB0aGlzLnBhcnNlQXJyb3dFeHByZXNzaW9uVGFpbChwYXR0ZXJuLCBzdGFydExvY2F0aW9uKSwgcGF0dGVybjogbnVsbCwgaXNCaW5kaW5nRWxlbWVudDogZmFsc2UgfTtcbiAgICB9XG5cbiAgICBsZXQgaXNBc3NpZ25tZW50T3BlcmF0b3IgPSBmYWxzZTtcbiAgICBsZXQgb3BlcmF0b3IgPSB0aGlzLmxvb2thaGVhZDtcbiAgICBzd2l0Y2ggKG9wZXJhdG9yLnR5cGUpIHtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9CSVRfT1I6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fQklUX1hPUjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9CSVRfQU5EOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX1NITDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9TSFI6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fU0hSX1VOU0lHTkVEOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX0FERDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9TVUI6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fTVVMOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX0RJVjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9NT0Q6XG4gICAgICAgIGlzQXNzaWdubWVudE9wZXJhdG9yID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGlmIChpc0Fzc2lnbm1lbnRPcGVyYXRvcikge1xuICAgICAgaWYgKCFwYXR0ZXJuIHx8ICFQYXJzZXIuaXNWYWxpZFNpbXBsZUFzc2lnbm1lbnRUYXJnZXQocGF0dGVybikpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLklOVkFMSURfTEhTX0lOX0FTU0lHTk1FTlQpO1xuICAgICAgfVxuICAgICAgaWYgKHBhdHRlcm4udHlwZSA9PT0gXCJCaW5kaW5nSWRlbnRpZmllclwiKSB7XG4gICAgICAgIGlmICh0aGlzLnN0cmljdCAmJiBpc1Jlc3RyaWN0ZWRXb3JkKHBhdHRlcm4ubmFtZSkpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLlNUUklDVF9MSFNfQVNTSUdOTUVOVCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG9wZXJhdG9yLnR5cGUgPT09IFRva2VuVHlwZS5BU1NJR04pIHtcbiAgICAgIGlmICghcGF0dGVybikge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuSU5WQUxJRF9MSFNfSU5fQVNTSUdOTUVOVCk7XG4gICAgICB9XG4gICAgICBsZXQgYm91bmQgPSBQYXJzZXIuYm91bmROYW1lcyhwYXR0ZXJuKTtcbiAgICAgICAgaWYgKHRoaXMuc3RyaWN0ICYmIGJvdW5kLnNvbWUoaXNSZXN0cmljdGVkV29yZCkpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLlNUUklDVF9MSFNfQVNTSUdOTUVOVCk7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHsgZXhwciwgcGF0dGVybiwgaXNCaW5kaW5nRWxlbWVudCwgZXhwckVycm9yIH07XG4gICAgfVxuXG4gICAgdGhpcy5sZXgoKTtcbiAgICBsZXQgcHJldmlvdXNJbkdlbmVyYXRvclBhcmFtZXRlciA9IHRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXI7XG4gICAgdGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlciA9IGZhbHNlO1xuICAgIGxldCByaHMgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcblxuICAgIHRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXIgPSBwcmV2aW91c0luR2VuZXJhdG9yUGFyYW1ldGVyO1xuICAgIHJldHVybiB7XG4gICAgICBleHByOiBwYXR0ZXJuICYmIHRoaXMubWFya0xvY2F0aW9uKHtcbiAgICAgICAgdHlwZTogXCJBc3NpZ25tZW50RXhwcmVzc2lvblwiLFxuICAgICAgICBiaW5kaW5nOiBwYXR0ZXJuLFxuICAgICAgICBvcGVyYXRvcjogb3BlcmF0b3IudHlwZS5uYW1lLFxuICAgICAgICBleHByZXNzaW9uOiByaHNcbiAgICAgIH0sIHN0YXJ0TG9jYXRpb24pLFxuICAgICAgcGF0dGVybjogcGF0dGVybiAmJiB0aGlzLm1hcmtMb2NhdGlvbih7XG4gICAgICAgIHR5cGU6IFwiQmluZGluZ1dpdGhEZWZhdWx0XCIsXG4gICAgICAgIGJpbmRpbmc6IHBhdHRlcm4sXG4gICAgICAgIGluaXQ6IHJoc1xuICAgICAgfSwgc3RhcnRMb2NhdGlvbiksXG4gICAgICBpc0JpbmRpbmdFbGVtZW50LFxuICAgICAgZXhwckVycm9yXG4gICAgfTtcbiAgfVxuXG4gIGxvb2thaGVhZEFzc2lnbm1lbnRFeHByZXNzaW9uKCkge1xuICAgIHN3aXRjaCAodGhpcy5sb29rYWhlYWQudHlwZSkge1xuICAgICAgY2FzZSBUb2tlblR5cGUuQUREOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX0RJVjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkNMQVNTOlxuICAgICAgY2FzZSBUb2tlblR5cGUuREVDOlxuICAgICAgY2FzZSBUb2tlblR5cGUuRElWOlxuICAgICAgY2FzZSBUb2tlblR5cGUuRkFMU0U6XG4gICAgICBjYXNlIFRva2VuVHlwZS5GVU5DVElPTjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLklERU5USUZJRVI6XG4gICAgICBjYXNlIFRva2VuVHlwZS5MQlJBQ0U6XG4gICAgICBjYXNlIFRva2VuVHlwZS5MQlJBQ0s6XG4gICAgICBjYXNlIFRva2VuVHlwZS5MUEFSRU46XG4gICAgICBjYXNlIFRva2VuVHlwZS5ORVc6XG4gICAgICBjYXNlIFRva2VuVHlwZS5OT1Q6XG4gICAgICBjYXNlIFRva2VuVHlwZS5OVUxMOlxuICAgICAgY2FzZSBUb2tlblR5cGUuTlVNQkVSOlxuICAgICAgY2FzZSBUb2tlblR5cGUuU1RSSU5HOlxuICAgICAgY2FzZSBUb2tlblR5cGUuU1VCOlxuICAgICAgY2FzZSBUb2tlblR5cGUuVEhJUzpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlRSVUU6XG4gICAgICBjYXNlIFRva2VuVHlwZS5ZSUVMRDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlRFTVBMQVRFOlxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcGFyc2VZaWVsZEV4cHJlc3Npb24oKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICB0aGlzLmxleCgpO1xuICAgIGlmICh0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCkge1xuICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJZaWVsZEV4cHJlc3Npb25cIiwgZXhwcmVzc2lvbjogbnVsbCB9LCBzdGFydExvY2F0aW9uKTtcbiAgICB9XG4gICAgbGV0IGlzR2VuZXJhdG9yID0gISF0aGlzLmVhdChUb2tlblR5cGUuTVVMKTtcbiAgICBsZXQgcHJldmlvdXNZaWVsZCA9IHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb247XG4gICAgbGV0IGV4cHIgPSBudWxsO1xuICAgIGlmIChpc0dlbmVyYXRvciB8fCB0aGlzLmxvb2thaGVhZEFzc2lnbm1lbnRFeHByZXNzaW9uKCkpIHtcbiAgICAgIGV4cHIgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICB9XG4gICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IHByZXZpb3VzWWllbGQ7XG4gICAgbGV0IHR5cGUgPSBpc0dlbmVyYXRvciA/IFwiWWllbGRHZW5lcmF0b3JFeHByZXNzaW9uXCIgOiBcIllpZWxkRXhwcmVzc2lvblwiO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih7dHlwZSwgZXhwcmVzc2lvbjogZXhwcn0sIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VDb25kaXRpb25hbEV4cHJlc3Npb24oKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IHRlc3QgPSB0aGlzLnBhcnNlQmluYXJ5RXhwcmVzc2lvbigpO1xuICAgIGlmICghdGVzdC5leHByKSByZXR1cm4gdGVzdDtcbiAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLkNPTkRJVElPTkFMKSkge1xuICAgICAgbGV0IHByZXZpb3VzQWxsb3dJbiA9IHRoaXMuYWxsb3dJbjtcbiAgICAgIHRoaXMuYWxsb3dJbiA9IHRydWU7XG4gICAgICBsZXQgY29uc2VxdWVudCA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgdGhpcy5hbGxvd0luID0gcHJldmlvdXNBbGxvd0luO1xuICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNPTE9OKTtcbiAgICAgIGxldCBhbHRlcm5hdGUgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGV4cHI6IHRoaXMubWFya0xvY2F0aW9uKHtcbiAgICAgICAgICB0eXBlOiBcIkNvbmRpdGlvbmFsRXhwcmVzc2lvblwiLFxuICAgICAgICAgIHRlc3Q6IHRlc3QuZXhwcixcbiAgICAgICAgICBjb25zZXF1ZW50LFxuICAgICAgICAgIGFsdGVybmF0ZVxuICAgICAgICB9LCBzdGFydExvY2F0aW9uKSxcbiAgICAgICAgcGF0dGVybjogbnVsbCxcbiAgICAgICAgaXNCaW5kaW5nRWxlbWVudDogZmFsc2UsXG4gICAgICAgIGV4cHJFcnJvcjogbnVsbFxuICAgICAgfTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGVzdDtcbiAgfVxuXG4gIGlzQmluYXJ5T3BlcmF0b3IodHlwZSkge1xuICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgY2FzZSBUb2tlblR5cGUuT1I6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BTkQ6XG4gICAgICBjYXNlIFRva2VuVHlwZS5CSVRfT1I6XG4gICAgICBjYXNlIFRva2VuVHlwZS5CSVRfWE9SOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQklUX0FORDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkVROlxuICAgICAgY2FzZSBUb2tlblR5cGUuTkU6XG4gICAgICBjYXNlIFRva2VuVHlwZS5FUV9TVFJJQ1Q6XG4gICAgICBjYXNlIFRva2VuVHlwZS5ORV9TVFJJQ1Q6XG4gICAgICBjYXNlIFRva2VuVHlwZS5MVDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkdUOlxuICAgICAgY2FzZSBUb2tlblR5cGUuTFRFOlxuICAgICAgY2FzZSBUb2tlblR5cGUuR1RFOlxuICAgICAgY2FzZSBUb2tlblR5cGUuSU5TVEFOQ0VPRjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlNITDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlNIUjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlNIUl9VTlNJR05FRDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFERDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlNVQjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk1VTDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkRJVjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk1PRDpcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICBjYXNlIFRva2VuVHlwZS5JTjpcbiAgICAgICAgcmV0dXJuIHRoaXMuYWxsb3dJbjtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBwYXJzZUJpbmFyeUV4cHJlc3Npb24oKSB7XG4gICAgbGV0IGxvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCB1bmFyeSA9IHRoaXMucGFyc2VVbmFyeUV4cHJlc3Npb24oKTtcbiAgICBpZiAoIXVuYXJ5LmV4cHIpIHtcbiAgICAgIHJldHVybiB1bmFyeTtcbiAgICB9XG5cbiAgICBsZXQgb3BlcmF0b3IgPSB0aGlzLmxvb2thaGVhZC50eXBlO1xuXG4gICAgbGV0IGlzQmluYXJ5T3BlcmF0b3IgPSB0aGlzLmlzQmluYXJ5T3BlcmF0b3Iob3BlcmF0b3IpO1xuICAgIGlmICghaXNCaW5hcnlPcGVyYXRvcikge1xuICAgICAgcmV0dXJuIHVuYXJ5O1xuICAgIH1cblxuICAgIGxldCBsZWZ0ID0gdW5hcnkuZXhwcjtcblxuICAgIHRoaXMubGV4KCk7XG4gICAgbGV0IHN0YWNrID0gW107XG4gICAgc3RhY2sucHVzaCh7bG9jYXRpb24sIGxlZnQsIG9wZXJhdG9yLCBwcmVjZWRlbmNlOiBCaW5hcnlQcmVjZWRlbmNlW29wZXJhdG9yLm5hbWVdfSk7XG4gICAgbG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IHJpZ2h0ID0gUGFyc2VyLmdldEV4cHIodGhpcy5wYXJzZVVuYXJ5RXhwcmVzc2lvbigpKTtcbiAgICBvcGVyYXRvciA9IHRoaXMubG9va2FoZWFkLnR5cGU7XG4gICAgaXNCaW5hcnlPcGVyYXRvciA9IHRoaXMuaXNCaW5hcnlPcGVyYXRvcih0aGlzLmxvb2thaGVhZC50eXBlKTtcbiAgICB3aGlsZSAoaXNCaW5hcnlPcGVyYXRvcikge1xuICAgICAgbGV0IHByZWNlZGVuY2UgPSBCaW5hcnlQcmVjZWRlbmNlW29wZXJhdG9yLm5hbWVdO1xuICAgICAgLy8gUmVkdWNlOiBtYWtlIGEgYmluYXJ5IGV4cHJlc3Npb24gZnJvbSB0aGUgdGhyZWUgdG9wbW9zdCBlbnRyaWVzLlxuICAgICAgd2hpbGUgKHN0YWNrLmxlbmd0aCAmJiBwcmVjZWRlbmNlIDw9IHN0YWNrW3N0YWNrLmxlbmd0aCAtIDFdLnByZWNlZGVuY2UpIHtcbiAgICAgICAgbGV0IHN0YWNrSXRlbSA9IHN0YWNrW3N0YWNrLmxlbmd0aCAtIDFdO1xuICAgICAgICBsZXQgc3RhY2tPcGVyYXRvciA9IHN0YWNrSXRlbS5vcGVyYXRvcjtcbiAgICAgICAgbGVmdCA9IHN0YWNrSXRlbS5sZWZ0O1xuICAgICAgICBzdGFjay5wb3AoKTtcbiAgICAgICAgbG9jYXRpb24gPSBzdGFja0l0ZW0ubG9jYXRpb247XG4gICAgICAgIHJpZ2h0ID0gdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIkJpbmFyeUV4cHJlc3Npb25cIiwgbGVmdCwgb3BlcmF0b3I6IHN0YWNrT3BlcmF0b3IubmFtZSwgcmlnaHQgfSwgbG9jYXRpb24pO1xuICAgICAgfVxuXG4gICAgICB0aGlzLmxleCgpO1xuICAgICAgc3RhY2sucHVzaCh7bG9jYXRpb24sIGxlZnQ6IHJpZ2h0LCBvcGVyYXRvciwgcHJlY2VkZW5jZX0pO1xuICAgICAgbG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICAgIHJpZ2h0ID0gUGFyc2VyLmdldEV4cHIodGhpcy5wYXJzZVVuYXJ5RXhwcmVzc2lvbigpKTtcblxuICAgICAgb3BlcmF0b3IgPSB0aGlzLmxvb2thaGVhZC50eXBlO1xuICAgICAgaXNCaW5hcnlPcGVyYXRvciA9IHRoaXMuaXNCaW5hcnlPcGVyYXRvcihvcGVyYXRvcik7XG4gICAgfVxuXG4gICAgLy8gRmluYWwgcmVkdWNlIHRvIGNsZWFuLXVwIHRoZSBzdGFjay5cbiAgICByZXR1cm4ge1xuICAgICAgZXhwcjogc3RhY2sucmVkdWNlUmlnaHQoKGV4cHIsIHN0YWNrSXRlbSkgPT5cbiAgICAgICAgICB0aGlzLm1hcmtMb2NhdGlvbih7XG4gICAgICAgICAgICB0eXBlOiBcIkJpbmFyeUV4cHJlc3Npb25cIixcbiAgICAgICAgICAgIGxlZnQ6IHN0YWNrSXRlbS5sZWZ0LFxuICAgICAgICAgICAgb3BlcmF0b3I6IHN0YWNrSXRlbS5vcGVyYXRvci5uYW1lLFxuICAgICAgICAgICAgcmlnaHQ6IGV4cHJcbiAgICAgICAgICB9LCBzdGFja0l0ZW0ubG9jYXRpb24pLFxuICAgICAgICByaWdodCksXG4gICAgICBwYXR0ZXJuOiBudWxsLFxuICAgICAgaXNCaW5kaW5nRWxlbWVudDogZmFsc2UsXG4gICAgICBleHByRXJyb3I6IG51bGxcbiAgICB9O1xuICB9XG5cbiAgc3RhdGljIGlzUHJlZml4T3BlcmF0b3IodHlwZSkge1xuICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgY2FzZSBUb2tlblR5cGUuSU5DOlxuICAgICAgY2FzZSBUb2tlblR5cGUuREVDOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQUREOlxuICAgICAgY2FzZSBUb2tlblR5cGUuU1VCOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQklUX05PVDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk5PVDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkRFTEVURTpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlZPSUQ6XG4gICAgICBjYXNlIFRva2VuVHlwZS5UWVBFT0Y6XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwYXJzZVVuYXJ5RXhwcmVzc2lvbigpIHtcbiAgICBpZiAodGhpcy5sb29rYWhlYWQudHlwZS5rbGFzcyAhPT0gVG9rZW5DbGFzcy5QdW5jdHVhdG9yICYmIHRoaXMubG9va2FoZWFkLnR5cGUua2xhc3MgIT09IFRva2VuQ2xhc3MuS2V5d29yZCkge1xuICAgICAgcmV0dXJuIHRoaXMucGFyc2VQb3N0Zml4RXhwcmVzc2lvbigpO1xuICAgIH1cbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgb3BlcmF0b3IgPSB0aGlzLmxvb2thaGVhZDtcbiAgICBpZiAoIVBhcnNlci5pc1ByZWZpeE9wZXJhdG9yKG9wZXJhdG9yLnR5cGUpKSB7XG4gICAgICByZXR1cm4gdGhpcy5wYXJzZVBvc3RmaXhFeHByZXNzaW9uKCk7XG4gICAgfVxuXG4gICAgdGhpcy5sZXgoKTtcbiAgICBsZXQgZXhwciA9IFBhcnNlci5nZXRFeHByKHRoaXMucGFyc2VVbmFyeUV4cHJlc3Npb24oKSk7XG4gICAgc3dpdGNoIChvcGVyYXRvci50eXBlKSB7XG4gICAgICBjYXNlIFRva2VuVHlwZS5JTkM6XG4gICAgICBjYXNlIFRva2VuVHlwZS5ERUM6XG4gICAgICAgIC8vIDExLjQuNCwgMTEuNC41O1xuICAgICAgICBpZiAoZXhwci50eXBlID09PSBcIklkZW50aWZpZXJFeHByZXNzaW9uXCIpIHtcbiAgICAgICAgICBpZiAodGhpcy5zdHJpY3QgJiYgaXNSZXN0cmljdGVkV29yZChleHByLm5hbWUpKSB7XG4gICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX0xIU19QUkVGSVgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghUGFyc2VyLmlzVmFsaWRTaW1wbGVBc3NpZ25tZW50VGFyZ2V0KGV4cHIpKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLklOVkFMSURfTEhTX0lOX0FTU0lHTk1FTlQpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBUb2tlblR5cGUuREVMRVRFOlxuICAgICAgICBpZiAoZXhwci50eXBlID09PSBcIklkZW50aWZpZXJFeHByZXNzaW9uXCIgJiYgdGhpcy5zdHJpY3QpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX0RFTEVURSk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgZXhwcjogdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIlByZWZpeEV4cHJlc3Npb25cIiwgb3BlcmF0b3I6IG9wZXJhdG9yLnZhbHVlLCBvcGVyYW5kOiBleHByIH0sIHN0YXJ0TG9jYXRpb24pLFxuICAgICAgcGF0dGVybjogbnVsbCxcbiAgICAgIGlzQmluZGluZ0VsZW1lbnQ6IGZhbHNlLFxuICAgICAgZXhwckVycm9yOiBudWxsLFxuICAgIH07XG4gIH1cblxuICBwYXJzZVBvc3RmaXhFeHByZXNzaW9uKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuXG4gICAgbGV0IGxocyA9IHRoaXMucGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uKHsgYWxsb3dDYWxsOiB0cnVlIH0pO1xuICAgIGlmICghbGhzLmV4cHIpIHJldHVybiBsaHM7XG5cbiAgICBpZiAodGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQpIHtcbiAgICAgIHJldHVybiBsaHM7XG4gICAgfVxuXG4gICAgbGV0IG9wZXJhdG9yID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgaWYgKG9wZXJhdG9yLnR5cGUgIT09IFRva2VuVHlwZS5JTkMgJiYgb3BlcmF0b3IudHlwZSAhPT0gVG9rZW5UeXBlLkRFQykge1xuICAgICAgcmV0dXJuIGxocztcbiAgICB9XG5cbiAgICBsZXQgb3BlcmFuZCA9IFBhcnNlci5nZXRFeHByKGxocyk7XG5cbiAgICBpZiAoIVBhcnNlci5pc1ZhbGlkU2ltcGxlQXNzaWdubWVudFRhcmdldChvcGVyYW5kKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLklOVkFMSURfTEhTX0lOX0FTU0lHTk1FTlQpO1xuICAgIH1cblxuICAgIHRoaXMubGV4KCk7XG5cbiAgICAvLyAxMS4zLjEsIDExLjMuMjtcbiAgICBpZiAob3BlcmFuZC50eXBlID09PSBcIklkZW50aWZpZXJFeHByZXNzaW9uXCIpIHtcbiAgICAgIGlmICh0aGlzLnN0cmljdCAmJiBpc1Jlc3RyaWN0ZWRXb3JkKG9wZXJhbmQubmFtZSkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlNUUklDVF9MSFNfUE9TVEZJWCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGV4cHI6IHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJQb3N0Zml4RXhwcmVzc2lvblwiLCBvcGVyYW5kLCBvcGVyYXRvcjogb3BlcmF0b3IudmFsdWUgfSwgc3RhcnRMb2NhdGlvbiksXG4gICAgICBwYXR0ZXJuOiBudWxsLFxuICAgICAgaXNCaW5kaW5nRWxlbWVudDogZmFsc2UsXG4gICAgICBleHByRXJyb3I6IG51bGxcbiAgICB9O1xuICB9XG5cbiAgcGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uKHthbGxvd0NhbGx9KSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IHByZXZpb3VzQWxsb3dJbiA9IHRoaXMuYWxsb3dJbjtcbiAgICB0aGlzLmFsbG93SW4gPSBhbGxvd0NhbGw7XG5cbiAgICBsZXQgZXhwciwgcGF0dGVybiwgaXNCaW5kaW5nRWxlbWVudCwgZXhwckVycm9yLCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuXG4gICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5TVVBFUikpIHtcbiAgICAgIGlzQmluZGluZ0VsZW1lbnQgPSBmYWxzZTtcbiAgICAgIGV4cHIgPSB0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiU3VwZXJcIiB9LCBzdGFydExvY2F0aW9uKTtcbiAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5MUEFSRU4pKSB7XG4gICAgICAgIGlmIChhbGxvd0NhbGwpIHtcbiAgICAgICAgICBpZiAodGhpcy5pbkNvbnN0cnVjdG9yICYmICF0aGlzLmluUGFyYW1ldGVyKSB7XG4gICAgICAgICAgICBleHByID0gdGhpcy5tYXJrTG9jYXRpb24oe1xuICAgICAgICAgICAgICB0eXBlOiBcIkNhbGxFeHByZXNzaW9uXCIsXG4gICAgICAgICAgICAgIGNhbGxlZTogZXhwcixcbiAgICAgICAgICAgICAgYXJndW1lbnRzOiB0aGlzLnBhcnNlQXJndW1lbnRMaXN0KClcbiAgICAgICAgICAgIH0sIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHN0YXJ0TG9jYXRpb24sIEVycm9yTWVzc2FnZXMuVU5FWFBFQ1RFRF9TVVBFUl9DQUxMKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRva2VuKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5MQlJBQ0spKSB7XG4gICAgICAgIGlmICh0aGlzLmluTWV0aG9kICYmICF0aGlzLmluUGFyYW1ldGVyKSB7XG4gICAgICAgICAgZXhwciA9IHRoaXMubWFya0xvY2F0aW9uKHtcbiAgICAgICAgICAgIHR5cGU6IFwiQ29tcHV0ZWRNZW1iZXJFeHByZXNzaW9uXCIsXG4gICAgICAgICAgICBvYmplY3Q6IGV4cHIsXG4gICAgICAgICAgICBleHByZXNzaW9uOiB0aGlzLnBhcnNlQ29tcHV0ZWRNZW1iZXIoKVxuICAgICAgICAgIH0sIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgICAgIHBhdHRlcm4gPSBleHByO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24oc3RhcnRMb2NhdGlvbiwgRXJyb3JNZXNzYWdlcy5VTkVYUEVDVEVEX1NVUEVSX1BST1BFUlRZKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5QRVJJT0QpKSB7XG4gICAgICAgIGlmICh0aGlzLmluTWV0aG9kICYmICF0aGlzLmluUGFyYW1ldGVyKSB7XG4gICAgICAgICAgZXhwciA9IHRoaXMubWFya0xvY2F0aW9uKHtcbiAgICAgICAgICAgIHR5cGU6IFwiU3RhdGljTWVtYmVyRXhwcmVzc2lvblwiLFxuICAgICAgICAgICAgb2JqZWN0OiBleHByLFxuICAgICAgICAgICAgcHJvcGVydHk6IHRoaXMucGFyc2VOb25Db21wdXRlZE1lbWJlcigpXG4gICAgICAgICAgfSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICAgICAgcGF0dGVybiA9IGV4cHI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbihzdGFydExvY2F0aW9uLCBFcnJvck1lc3NhZ2VzLlVORVhQRUNURURfU1VQRVJfUFJPUEVSVFkpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodG9rZW4pO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuTkVXKSkge1xuICAgICAgZXhwciA9IHRoaXMucGFyc2VOZXdFeHByZXNzaW9uKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBwZSA9IHRoaXMucGFyc2VQcmltYXJ5RXhwcmVzc2lvbigpO1xuICAgICAgaWYgKCFwZS5leHByKSB7XG4gICAgICAgIHJldHVybiBwZTtcbiAgICAgIH1cbiAgICAgICh7IGV4cHIsIHBhdHRlcm4sIGlzQmluZGluZ0VsZW1lbnQsIGV4cHJFcnJvciB9ID0gcGUpO1xuICAgIH1cblxuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBpZiAoYWxsb3dDYWxsICYmIHRoaXMubWF0Y2goVG9rZW5UeXBlLkxQQVJFTikpIHtcbiAgICAgICAgaXNCaW5kaW5nRWxlbWVudCA9IGZhbHNlO1xuICAgICAgICBleHByID0gdGhpcy5tYXJrTG9jYXRpb24oe1xuICAgICAgICAgIHR5cGU6IFwiQ2FsbEV4cHJlc3Npb25cIixcbiAgICAgICAgICBjYWxsZWU6IGV4cHIsXG4gICAgICAgICAgYXJndW1lbnRzOiB0aGlzLnBhcnNlQXJndW1lbnRMaXN0KClcbiAgICAgICAgfSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICAgIHBhdHRlcm4gPSBudWxsO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5MQlJBQ0spKSB7XG4gICAgICAgIGlzQmluZGluZ0VsZW1lbnQgPSBmYWxzZTtcbiAgICAgICAgZXhwciA9IHRoaXMubWFya0xvY2F0aW9uKHtcbiAgICAgICAgICB0eXBlOiBcIkNvbXB1dGVkTWVtYmVyRXhwcmVzc2lvblwiLFxuICAgICAgICAgIG9iamVjdDogZXhwcixcbiAgICAgICAgICBleHByZXNzaW9uOiB0aGlzLnBhcnNlQ29tcHV0ZWRNZW1iZXIoKVxuICAgICAgICB9LCBzdGFydExvY2F0aW9uKTtcbiAgICAgICAgcGF0dGVybiA9IGV4cHI7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLlBFUklPRCkpIHtcbiAgICAgICAgaXNCaW5kaW5nRWxlbWVudCA9IGZhbHNlO1xuICAgICAgICBleHByID0gdGhpcy5tYXJrTG9jYXRpb24oe1xuICAgICAgICAgIHR5cGU6IFwiU3RhdGljTWVtYmVyRXhwcmVzc2lvblwiLFxuICAgICAgICAgIG9iamVjdDogZXhwcixcbiAgICAgICAgICBwcm9wZXJ0eTogdGhpcy5wYXJzZU5vbkNvbXB1dGVkTWVtYmVyKClcbiAgICAgICAgfSwgc3RhcnRMb2NhdGlvbik7XG4gICAgICAgIHBhdHRlcm4gPSBleHByO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5URU1QTEFURSkpIHtcbiAgICAgICAgaXNCaW5kaW5nRWxlbWVudCA9IGZhbHNlO1xuICAgICAgICBleHByID0gdGhpcy5tYXJrTG9jYXRpb24oe1xuICAgICAgICAgIHR5cGU6IFwiVGVtcGxhdGVFeHByZXNzaW9uXCIsXG4gICAgICAgICAgdGFnOiBleHByLFxuICAgICAgICAgIGVsZW1lbnRzOiB0aGlzLnBhcnNlVGVtcGxhdGVFbGVtZW50cygpXG4gICAgICAgIH0sIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgICBwYXR0ZXJuID0gbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuYWxsb3dJbiA9IHByZXZpb3VzQWxsb3dJbjtcblxuICAgIHJldHVybiB7IGV4cHIsIHBhdHRlcm4sIGlzQmluZGluZ0VsZW1lbnQsIGV4cHJFcnJvciB9O1xuICB9XG5cbiAgcGFyc2VUZW1wbGF0ZUVsZW1lbnRzKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgIGlmICh0b2tlbi50YWlsKSB7XG4gICAgICB0aGlzLmxleCgpO1xuICAgICAgcmV0dXJuIFt0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiVGVtcGxhdGVFbGVtZW50XCIsIHJhd1ZhbHVlOiB0b2tlbi52YWx1ZS5zbGljZSgxLCAtMSkgfSwgc3RhcnRMb2NhdGlvbildO1xuICAgIH1cbiAgICBsZXQgcmVzdWx0ID0gW1xuICAgICAgdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIlRlbXBsYXRlRWxlbWVudFwiLCByYXdWYWx1ZTogdGhpcy5sZXgoKS52YWx1ZS5zbGljZSgxLCAtMikgfSwgc3RhcnRMb2NhdGlvbilcbiAgICBdO1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICByZXN1bHQucHVzaCh0aGlzLnBhcnNlRXhwcmVzc2lvbigpKTtcbiAgICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuUkJSQUNFKSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuaW5kZXggPSB0aGlzLnN0YXJ0SW5kZXg7XG4gICAgICB0aGlzLmxpbmUgPSB0aGlzLnN0YXJ0TGluZTtcbiAgICAgIHRoaXMubGluZVN0YXJ0ID0gdGhpcy5zdGFydExpbmVTdGFydDtcbiAgICAgIHRoaXMubG9va2FoZWFkID0gdGhpcy5zY2FuVGVtcGxhdGVFbGVtZW50KCk7XG4gICAgICBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgICAgdG9rZW4gPSB0aGlzLmxleCgpO1xuICAgICAgaWYgKHRva2VuLnRhaWwpIHtcbiAgICAgICAgcmVzdWx0LnB1c2godGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIlRlbXBsYXRlRWxlbWVudFwiLCByYXdWYWx1ZTogdG9rZW4udmFsdWUuc2xpY2UoMSwgLTEpIH0sIHN0YXJ0TG9jYXRpb24pKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdC5wdXNoKHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJUZW1wbGF0ZUVsZW1lbnRcIiwgcmF3VmFsdWU6IHRva2VuLnZhbHVlLnNsaWNlKDEsIC0yKSB9LCBzdGFydExvY2F0aW9uKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcGFyc2VOb25Db21wdXRlZE1lbWJlcigpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUEVSSU9EKTtcbiAgICBpZiAoIXRoaXMubG9va2FoZWFkLnR5cGUua2xhc3MuaXNJZGVudGlmaWVyTmFtZSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMubGV4KCkudmFsdWU7XG4gICAgfVxuICB9XG5cbiAgcGFyc2VDb21wdXRlZE1lbWJlcigpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTEJSQUNLKTtcbiAgICBsZXQgZXhwciA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJCUkFDSyk7XG4gICAgcmV0dXJuIGV4cHI7XG4gIH1cblxuICBwYXJzZU5ld0V4cHJlc3Npb24oKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLk5FVyk7XG4gICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5QRVJJT0QpKSB7XG4gICAgICBsZXQgaWRlbnQgPSB0aGlzLmV4cGVjdChUb2tlblR5cGUuSURFTlRJRklFUik7XG4gICAgICBpZiAoaWRlbnQudmFsdWUgIT09IFwidGFyZ2V0XCIpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKGlkZW50KTtcbiAgICAgIH0gZWxzZSBpZiAoIXRoaXMuaW5GdW5jdGlvbkJvZHkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbihzdGFydExvY2F0aW9uLCBFcnJvck1lc3NhZ2VzLlVORVhQRUNURURfTkVXX1RBUkdFVCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIk5ld1RhcmdldEV4cHJlc3Npb25cIiB9LCBzdGFydExvY2F0aW9uKTtcbiAgICB9XG4gICAgbGV0IGNhbGxlZSA9IFBhcnNlci5nZXRFeHByKHRoaXMucGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uKHsgYWxsb3dDYWxsOiBmYWxzZSB9KSk7XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHtcbiAgICAgIHR5cGU6IFwiTmV3RXhwcmVzc2lvblwiLFxuICAgICAgY2FsbGVlLFxuICAgICAgYXJndW1lbnRzOiB0aGlzLm1hdGNoKFRva2VuVHlwZS5MUEFSRU4pID8gdGhpcy5wYXJzZUFyZ3VtZW50TGlzdCgpIDogW11cbiAgICB9LCBzdGFydExvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlUHJpbWFyeUV4cHJlc3Npb24oKSB7XG4gICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkxQQVJFTikpIHtcbiAgICAgIHJldHVybiB0aGlzLnBhcnNlR3JvdXBFeHByZXNzaW9uKCk7XG4gICAgfVxuXG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICBmdW5jdGlvbiBwcmltYXJ5KGV4cHIpIHtcbiAgICAgIHJldHVybiB7IGV4cHIsIHBhdHRlcm46IG51bGwsIGlzQmluZGluZ0VsZW1lbnQ6IGZhbHNlLCBleHByRXJyb3I6IG51bGwgfVxuICAgIH1cbiAgICBzd2l0Y2ggKHRoaXMubG9va2FoZWFkLnR5cGUpIHtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLllJRUxEOlxuICAgICAgY2FzZSBUb2tlblR5cGUuSURFTlRJRklFUjpcbiAgICAgIHtcbiAgICAgICAgbGV0IGV4cHIgPSB0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiSWRlbnRpZmllckV4cHJlc3Npb25cIiwgbmFtZTogdGhpcy5wYXJzZUlkZW50aWZpZXIoKSB9LCBzdGFydExvY2F0aW9uKTtcbiAgICAgICAgbGV0IHBhdHRlcm4gPSB0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiQmluZGluZ0lkZW50aWZpZXJcIiwgbmFtZTogZXhwci5uYW1lIH0sIHN0YXJ0TG9jYXRpb24pO1xuICAgICAgICByZXR1cm4geyBleHByLCBwYXR0ZXJuLCBpc0JpbmRpbmdFbGVtZW50OiB0cnVlLCBleHByRXJyb3I6IG51bGwgfTtcbiAgICAgIH1cbiAgICAgIGNhc2UgVG9rZW5UeXBlLlNUUklORzpcbiAgICAgICAgcmV0dXJuIHByaW1hcnkodGhpcy5wYXJzZVN0cmluZ0xpdGVyYWwoKSk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5OVU1CRVI6XG4gICAgICAgIHJldHVybiBwcmltYXJ5KHRoaXMucGFyc2VOdW1lcmljTGl0ZXJhbCgpKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlRISVM6XG4gICAgICAgIHRoaXMubGV4KCk7XG4gICAgICAgIHJldHVybiBwcmltYXJ5KHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJUaGlzRXhwcmVzc2lvblwiIH0sIHN0YXJ0TG9jYXRpb24pKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkZVTkNUSU9OOlxuICAgICAgICByZXR1cm4gcHJpbWFyeSh0aGlzLm1hcmtMb2NhdGlvbih0aGlzLnBhcnNlRnVuY3Rpb24oeyBpc0V4cHI6IHRydWUgfSksIHN0YXJ0TG9jYXRpb24pKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlRSVUU6XG4gICAgICAgIHRoaXMubGV4KCk7XG4gICAgICAgIHJldHVybiBwcmltYXJ5KHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJMaXRlcmFsQm9vbGVhbkV4cHJlc3Npb25cIiwgdmFsdWU6IHRydWUgfSwgc3RhcnRMb2NhdGlvbikpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuRkFMU0U6XG4gICAgICAgIHRoaXMubGV4KCk7XG4gICAgICAgIHJldHVybiBwcmltYXJ5KHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJMaXRlcmFsQm9vbGVhbkV4cHJlc3Npb25cIiwgdmFsdWU6IGZhbHNlIH0sIHN0YXJ0TG9jYXRpb24pKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk5VTEw6XG4gICAgICAgIHRoaXMubGV4KCk7XG4gICAgICAgIHJldHVybiBwcmltYXJ5KHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJMaXRlcmFsTnVsbEV4cHJlc3Npb25cIiB9LCBzdGFydExvY2F0aW9uKSk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5MQlJBQ0s6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlQXJyYXlFeHByZXNzaW9uKCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5MQlJBQ0U6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlT2JqZWN0RXhwcmVzc2lvbigpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuVEVNUExBVEU6XG4gICAgICAgIHJldHVybiBwcmltYXJ5KHRoaXMubWFya0xvY2F0aW9uKHtcbiAgICAgICAgICB0eXBlOiBcIlRlbXBsYXRlRXhwcmVzc2lvblwiLFxuICAgICAgICAgIHRhZzogbnVsbCxcbiAgICAgICAgICBlbGVtZW50czogdGhpcy5wYXJzZVRlbXBsYXRlRWxlbWVudHMoKVxuICAgICAgICB9LCBzdGFydExvY2F0aW9uKSk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5ESVY6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fRElWOlxuICAgICAgICB0aGlzLmxvb2thaGVhZCA9IHRoaXMuc2NhblJlZ0V4cCh0aGlzLmxvb2thaGVhZC50eXBlID09PSBUb2tlblR5cGUuRElWID8gXCIvXCIgOiBcIi89XCIpO1xuICAgICAgICBsZXQgdG9rZW4gPSB0aGlzLmxleCgpO1xuICAgICAgICBsZXQgbGFzdFNsYXNoID0gdG9rZW4udmFsdWUubGFzdEluZGV4T2YoXCIvXCIpO1xuICAgICAgICBsZXQgcGF0dGVybiA9IHRva2VuLnZhbHVlLnNsaWNlKDEsIGxhc3RTbGFzaCkucmVwbGFjZShcIlxcXFwvXCIsIFwiL1wiKTtcbiAgICAgICAgbGV0IGZsYWdzID0gdG9rZW4udmFsdWUuc2xpY2UobGFzdFNsYXNoICsgMSk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgUmVnRXhwKHBhdHRlcm4sIGZsYWdzKTtcbiAgICAgICAgfSBjYXRjaCAodW51c2VkKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5JTlZBTElEX1JFR1VMQVJfRVhQUkVTU0lPTik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHByaW1hcnkodGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIkxpdGVyYWxSZWdFeHBFeHByZXNzaW9uXCIsIHBhdHRlcm4sIGZsYWdzIH0sIHN0YXJ0TG9jYXRpb24pKTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkNMQVNTOlxuICAgICAgICByZXR1cm4gcHJpbWFyeSh0aGlzLnBhcnNlQ2xhc3MoeyBpc0V4cHI6IHRydWUgfSkpO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubGV4KCkpO1xuICAgIH1cbiAgfVxuXG4gIHBhcnNlTnVtZXJpY0xpdGVyYWwoKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgaWYgKHRoaXMuc3RyaWN0ICYmIHRoaXMubG9va2FoZWFkLm9jdGFsKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRoaXMubG9va2FoZWFkLCBFcnJvck1lc3NhZ2VzLlNUUklDVF9PQ1RBTF9MSVRFUkFMKTtcbiAgICB9XG4gICAgbGV0IHRva2VuMiA9IHRoaXMubGV4KCk7XG4gICAgbGV0IG5vZGUgPSB0b2tlbjIuX3ZhbHVlID09PSAxIC8gMCA/IHtcbiAgICAgIHR5cGU6IFwiTGl0ZXJhbEluZmluaXR5RXhwcmVzc2lvblwiXG4gICAgfSA6IHtcbiAgICAgIHR5cGU6IFwiTGl0ZXJhbE51bWVyaWNFeHByZXNzaW9uXCIsXG4gICAgICB2YWx1ZTogdG9rZW4yLl92YWx1ZVxuICAgIH07XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5vZGUsIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VTdHJpbmdMaXRlcmFsKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGlmICh0aGlzLnN0cmljdCAmJiB0aGlzLmxvb2thaGVhZC5vY3RhbCkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0aGlzLmxvb2thaGVhZCwgRXJyb3JNZXNzYWdlcy5TVFJJQ1RfT0NUQUxfTElURVJBTCk7XG4gICAgfVxuICAgIGxldCB0b2tlbjIgPSB0aGlzLmxleCgpO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiTGl0ZXJhbFN0cmluZ0V4cHJlc3Npb25cIiwgdmFsdWU6IHRva2VuMi5fdmFsdWUgfSwgc3RhcnRMb2NhdGlvbik7XG4gIH1cblxuICBwYXJzZUlkZW50aWZpZXJOYW1lKCkge1xuICAgIGlmICh0aGlzLmxvb2thaGVhZC50eXBlLmtsYXNzLmlzSWRlbnRpZmllck5hbWUpIHtcbiAgICAgIHJldHVybiB0aGlzLmxleCgpLnZhbHVlO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuICAgIH1cbiAgfVxuXG4gIHBhcnNlQmluZGluZ0lkZW50aWZpZXIoKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJCaW5kaW5nSWRlbnRpZmllclwiLCBuYW1lOiB0aGlzLnBhcnNlSWRlbnRpZmllcigpIH0sIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VJZGVudGlmaWVyKCkge1xuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5ZSUVMRCkpIHtcbiAgICAgIGlmICh0aGlzLnN0cmljdCkge1xuICAgICAgICB0aGlzLmxvb2thaGVhZC50eXBlID0gVG9rZW5UeXBlLllJRUxEO1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuICAgICAgfSBlbHNlIGlmICh0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMuaW5HZW5lcmF0b3JCb2R5KSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy5sZXgoKS52YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5JREVOVElGSUVSKS52YWx1ZTtcbiAgfVxuXG4gIHBhcnNlQXJndW1lbnRMaXN0KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MUEFSRU4pO1xuICAgIGxldCBhcmdzID0gdGhpcy5wYXJzZUFyZ3VtZW50cygpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgIHJldHVybiBhcmdzO1xuICB9XG5cbiAgcGFyc2VBcmd1bWVudHMoKSB7XG4gICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuUlBBUkVOKSB8fCB0aGlzLmVvZigpKSB7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9XG4gICAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICAgIGxldCBhcmc7XG4gICAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLkVMTElQU0lTKSkge1xuICAgICAgICBhcmcgPSB0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiU3ByZWFkRWxlbWVudFwiLCBleHByZXNzaW9uOiB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKSB9LCBzdGFydExvY2F0aW9uKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFyZyA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgfVxuICAgICAgcmVzdWx0LnB1c2goYXJnKTtcbiAgICAgIGlmICghdGhpcy5lYXQoVG9rZW5UeXBlLkNPTU1BKSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8vIDExLjIgTGVmdC1IYW5kLVNpZGUgRXhwcmVzc2lvbnM7XG5cbiAgZW5zdXJlQXJyb3coKSB7XG4gICAgaWYgKHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0KSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5FWFBFQ1RFRF9MSU5FX1RFUk1JTkFUT1IpO1xuICAgIH1cbiAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLkFSUk9XKSkge1xuICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkFSUk9XKTtcbiAgICB9XG4gIH1cblxuICBwYXJzZUdyb3VwRXhwcmVzc2lvbigpIHtcbiAgICAvLyBBdCB0aGlzIHBvaW50LCB3ZSBuZWVkIHRvIHBhcnNlIDMgdGhpbmdzOlxuICAgIC8vICAxLiBHcm91cCBleHByZXNzaW9uXG4gICAgLy8gIDIuIEFzc2lnbm1lbnQgdGFyZ2V0IG9mIGFzc2lnbm1lbnQgZXhwcmVzc2lvblxuICAgIC8vICAzLiBQYXJhbWV0ZXIgbGlzdCBvZiBhcnJvdyBmdW5jdGlvblxuICAgIGxldCByZXN0ID0gbnVsbDtcbiAgICBsZXQgc3RhcnQgPSB0aGlzLmV4cGVjdChUb2tlblR5cGUuTFBBUkVOKTtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLlJQQVJFTikpIHtcbiAgICAgIHRoaXMuZW5zdXJlQXJyb3coKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGV4cHI6IG51bGwsXG4gICAgICAgIHBhdHRlcm46IHtcbiAgICAgICAgICB0eXBlOiBBUlJPV19FWFBSRVNTSU9OX1BBUkFNUyxcbiAgICAgICAgICBwYXJhbXM6IFtdLFxuICAgICAgICAgIHJlc3Q6IG51bGxcbiAgICAgICAgfSxcbiAgICAgICAgaXNCaW5kaW5nRWxlbWVudDogZmFsc2UsXG4gICAgICAgIGV4cHJFcnJvcjogdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRva2VuKSxcbiAgICAgIH07XG4gICAgfSBlbHNlIGlmICh0aGlzLmVhdChUb2tlblR5cGUuRUxMSVBTSVMpKSB7XG4gICAgICByZXN0ID0gdGhpcy5wYXJzZUJpbmRpbmdJZGVudGlmaWVyKCk7XG4gICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcbiAgICAgIHRoaXMuZW5zdXJlQXJyb3coKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGV4cHI6IG51bGwsXG4gICAgICAgIHBhdHRlcm46IHtcbiAgICAgICAgICB0eXBlOiBBUlJPV19FWFBSRVNTSU9OX1BBUkFNUyxcbiAgICAgICAgICBwYXJhbXM6IFtdLFxuICAgICAgICAgIHJlc3Q6IHJlc3RcbiAgICAgICAgfSxcbiAgICAgICAgaXNCaW5kaW5nRWxlbWVudDogZmFsc2UsXG4gICAgICAgIGV4cHJFcnJvcjogdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRva2VuKSxcbiAgICAgIH07XG4gICAgfVxuXG5cbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQge1xuICAgICAgZXhwcjogZ3JvdXAsICAvLyBpZiBpdCBpcyBhIHBvc3NpYmxlIGV4cHJlc3Npb25cbiAgICAgIHBhdHRlcm46IGFzc2lnbm1lbnRUYXJnZXQsICAvLyBpZiBpdCBjYW4gYmUgYW4gYXNzaWdubWVudCBwYXR0ZXJuXG4gICAgICBpc0JpbmRpbmdFbGVtZW50OiBwb3NzaWJsZUJpbmRpbmdzLCAgLy8gaWYgaXQgY2FuIGJlIGFuIGJpbmRpbmcgZWxlbWVudCwgaXQgY2FuIGJlIHBhcnQgb2YgYXJyb3cgZXhwcmVzc2lvblxuICAgICAgZXhwckVycm9yOiBmaXJzdEV4cHJFcnJvcixcbiAgICAgIH0gPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb25PckJpbmRpbmdFbGVtZW50KCk7XG5cbiAgICBsZXQgcGFyYW1zID0gcG9zc2libGVCaW5kaW5ncyA/IFthc3NpZ25tZW50VGFyZ2V0XSA6IG51bGw7XG5cbiAgICB3aGlsZSAodGhpcy5lYXQoVG9rZW5UeXBlLkNPTU1BKSkge1xuICAgICAgYXNzaWdubWVudFRhcmdldCA9IG51bGw7XG4gICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuRUxMSVBTSVMpKSB7XG4gICAgICAgIGlmICghcG9zc2libGVCaW5kaW5ncykge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5sZXgoKTtcbiAgICAgICAgcmVzdCA9IHRoaXMucGFyc2VCaW5kaW5nSWRlbnRpZmllcigpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgaWYgKCFncm91cCkge1xuICAgICAgICAvLyBDYW4gYmUgb25seSBiaW5kaW5nIGVsZW1lbnRzLlxuICAgICAgICBsZXQgYmluZGluZyA9IHRoaXMucGFyc2VCaW5kaW5nRWxlbWVudCgpO1xuICAgICAgICBwYXJhbXMucHVzaChiaW5kaW5nKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBuZXh0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgICAgIC8vIENhbiBiZSBlaXRoZXIgYmluZGluZyBlbGVtZW50IG9yIGFzc2lnbm1lbnQgdGFyZ2V0LlxuICAgICAgICBsZXQgeyBleHByLCBwYXR0ZXJuLCBpc0JpbmRpbmdFbGVtZW50LCBleHByRXJyb3IgfSA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbk9yQmluZGluZ0VsZW1lbnQoKTtcbiAgICAgICAgaWYgKCFpc0JpbmRpbmdFbGVtZW50KSB7XG4gICAgICAgICAgcG9zc2libGVCaW5kaW5ncyA9IGZhbHNlO1xuICAgICAgICAgIHBhcmFtcyA9IG51bGw7XG4gICAgICAgIH0gZWxzZSBpZiAocGFyYW1zKSB7XG4gICAgICAgICAgcGFyYW1zLnB1c2gocGF0dGVybik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFleHByKSB7XG4gICAgICAgICAgZmlyc3RFeHByRXJyb3IgPSBmaXJzdEV4cHJFcnJvciB8fCBleHByRXJyb3I7XG4gICAgICAgICAgZ3JvdXAgPSBudWxsO1xuICAgICAgICAgIGlmICghcGFyYW1zKSB7XG4gICAgICAgICAgICB0aHJvdyBmaXJzdEV4cHJFcnJvcjtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZ3JvdXAgPSB0aGlzLm1hcmtMb2NhdGlvbih7XG4gICAgICAgICAgICB0eXBlOiBcIkJpbmFyeUV4cHJlc3Npb25cIixcbiAgICAgICAgICAgIGxlZnQ6IGdyb3VwLFxuICAgICAgICAgICAgb3BlcmF0b3I6IFwiLFwiLFxuICAgICAgICAgICAgcmlnaHQ6IGV4cHJcbiAgICAgICAgICB9LCBzdGFydExvY2F0aW9uKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuXG4gICAgaWYgKCF0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCAmJiB0aGlzLm1hdGNoKFRva2VuVHlwZS5BUlJPVykpIHtcbiAgICAgIGlmICghcG9zc2libGVCaW5kaW5ncykge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHN0YXJ0LCBFcnJvck1lc3NhZ2VzLklMTEVHQUxfQVJST1dfRlVOQ1RJT05fUEFSQU1TKTtcbiAgICAgIH1cbiAgICAgIC8vIGNoZWNrIGR1cCBwYXJhbXNcbiAgICAgIGxldCBhbGxCb3VuZE5hbWVzID0gW107XG5cbiAgICAgIHBhcmFtcy5mb3JFYWNoKGV4cHIgPT4ge1xuICAgICAgICBhbGxCb3VuZE5hbWVzID0gYWxsQm91bmROYW1lcy5jb25jYXQoUGFyc2VyLmJvdW5kTmFtZXMoZXhwcikpO1xuICAgICAgfSk7XG5cbiAgICAgIGlmIChyZXN0KSB7XG4gICAgICAgIGFsbEJvdW5kTmFtZXMucHVzaChyZXN0Lm5hbWUpO1xuICAgICAgfVxuXG4gICAgICBpZiAoZmlyc3REdXBsaWNhdGUoYWxsQm91bmROYW1lcykgIT0gbnVsbCkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX1BBUkFNX0RVUEUpO1xuICAgICAgfVxuXG4gICAgICBsZXQgc3RyaWN0UmVzdHJpY3RlZFdvcmQgPSBhbGxCb3VuZE5hbWVzLnNvbWUoaXNSZXN0cmljdGVkV29yZCk7XG4gICAgICBpZiAoc3RyaWN0UmVzdHJpY3RlZFdvcmQpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlNUUklDVF9QQVJBTV9OQU1FKTtcbiAgICAgIH1cblxuICAgICAgbGV0IHN0cmljdFJlc2VydmVkV29yZCA9IGhhc1N0cmljdE1vZGVSZXNlcnZlZFdvcmQoYWxsQm91bmROYW1lcyk7XG4gICAgICBpZiAoc3RyaWN0UmVzZXJ2ZWRXb3JkKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUkVTRVJWRURfV09SRCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIGV4cHI6IG51bGwsXG4gICAgICAgIHBhdHRlcm46IHsgdHlwZTogQVJST1dfRVhQUkVTU0lPTl9QQVJBTVMsIHBhcmFtcywgcmVzdCB9LFxuICAgICAgICBpc0JpbmRpbmdFbGVtZW50OiBmYWxzZSxcbiAgICAgICAgZXhwckVycm9yOiB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpLFxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gRW5zdXJlIGFzc2lnbm1lbnQgcGF0dGVybjpcbiAgICAgIGlmIChyZXN0KSB7XG4gICAgICAgIHRoaXMuZW5zdXJlQXJyb3coKTtcbiAgICAgIH1cbiAgICAgIGlmICghZ3JvdXApIHtcbiAgICAgICAgdGhyb3cgZmlyc3RFeHByRXJyb3I7XG4gICAgICB9XG4gICAgICByZXR1cm4ge1xuICAgICAgICBleHByOiBncm91cCxcbiAgICAgICAgcGF0dGVybjogYXNzaWdubWVudFRhcmdldCxcbiAgICAgICAgaXNCaW5kaW5nRWxlbWVudDogZmFsc2UsXG4gICAgICAgIGV4cHJFcnJvcjogbnVsbFxuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICBwYXJzZUFycmF5RXhwcmVzc2lvbigpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MQlJBQ0spO1xuXG4gICAgbGV0IGV4cHJzID0gW10sIHBhdHRlcm5zID0gW10sIHJlc3RFbGVtZW50ID0gbnVsbCwgYWxsQmluZGluZ0VsZW1lbnRzID0gdHJ1ZSwgZmlyc3RFeHByRXJyb3IgPSBudWxsO1xuXG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0spKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuZWF0KFRva2VuVHlwZS5DT01NQSkpIHtcbiAgICAgICAgZXhwcnMgJiYgZXhwcnMucHVzaChudWxsKTtcbiAgICAgICAgcGF0dGVybnMgJiYgcGF0dGVybnMucHVzaChudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBlbGVtZW50TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuRUxMSVBTSVMpKSB7XG4gICAgICAgICAgLy8gU3ByZWFkL1Jlc3QgZWxlbWVudFxuICAgICAgICAgIGxldCB7IGV4cHIsIHBhdHRlcm4sIGlzQmluZGluZ0VsZW1lbnQsIGV4cHJFcnJvciB9ID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uT3JCaW5kaW5nRWxlbWVudCgpO1xuICAgICAgICAgIGZpcnN0RXhwckVycm9yID0gZmlyc3RFeHByRXJyb3IgfHwgZXhwckVycm9yO1xuXG4gICAgICAgICAgYWxsQmluZGluZ0VsZW1lbnRzID0gYWxsQmluZGluZ0VsZW1lbnRzICYmIGlzQmluZGluZ0VsZW1lbnQ7XG5cbiAgICAgICAgICBpZiAoIWV4cHIpIHtcbiAgICAgICAgICAgIGV4cHJzID0gbnVsbDtcbiAgICAgICAgICAgIGlmICghcGF0dGVybnMpIHtcbiAgICAgICAgICAgICAgdGhyb3cgZmlyc3RFeHByRXJyb3I7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGV4cHIgPSB0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiU3ByZWFkRWxlbWVudFwiLCBleHByZXNzaW9uOiBleHByIH0sIGVsZW1lbnRMb2NhdGlvbik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCFwYXR0ZXJuKSB7XG4gICAgICAgICAgICBwYXR0ZXJucyA9IG51bGw7XG4gICAgICAgICAgICBpZiAoIWV4cHJzKSB7XG4gICAgICAgICAgICAgIHRocm93IGZpcnN0RXhwckVycm9yO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSBpZiAocGF0dGVybnMpIHtcbiAgICAgICAgICAgIC8vIFdoZW4gaXNCaW5kaW5nRWxlbWVudE5leHQgaXMgdHJ1ZSwgcGF0dGVybk5leHQgaXMgcHJlc2VudC5cbiAgICAgICAgICAgIHJlc3RFbGVtZW50ID0gcGF0dGVybjtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBleHBycyAmJiBleHBycy5wdXNoKGV4cHIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxldCB7IGV4cHIsIHBhdHRlcm4sIGlzQmluZGluZ0VsZW1lbnQsIGV4cHJFcnJvciB9ID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uT3JCaW5kaW5nRWxlbWVudCgpO1xuXG4gICAgICAgICAgYWxsQmluZGluZ0VsZW1lbnRzID0gYWxsQmluZGluZ0VsZW1lbnRzICYmIGlzQmluZGluZ0VsZW1lbnQ7XG5cbiAgICAgICAgICBpZiAoIWV4cHIpIHtcbiAgICAgICAgICAgIGZpcnN0RXhwckVycm9yID0gZmlyc3RFeHByRXJyb3IgfHwgZXhwckVycm9yO1xuICAgICAgICAgICAgZXhwcnMgPSBudWxsO1xuICAgICAgICAgICAgaWYgKCFwYXR0ZXJucykge1xuICAgICAgICAgICAgICB0aHJvdyBleHByRXJyb3I7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghcGF0dGVybikge1xuICAgICAgICAgICAgcGF0dGVybnMgPSBudWxsO1xuICAgICAgICAgICAgaWYgKCFleHBycykge1xuICAgICAgICAgICAgICB0aHJvdyBmaXJzdEV4cHJFcnJvcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgZXhwcnMgJiYgZXhwcnMucHVzaChleHByKTtcbiAgICAgICAgICBwYXR0ZXJucyAmJiBwYXR0ZXJucy5wdXNoKHBhdHRlcm4pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0spKSB7XG4gICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNPTU1BKTtcbiAgICAgICAgICBpZiAocmVzdEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHBhdHRlcm5zID0gbnVsbDtcbiAgICAgICAgICAgIGFsbEJpbmRpbmdFbGVtZW50cyA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SQlJBQ0spO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGV4cHI6IGV4cHJzICYmIHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJBcnJheUV4cHJlc3Npb25cIiwgZWxlbWVudHM6IGV4cHJzIH0sIHN0YXJ0TG9jYXRpb24pLFxuICAgICAgcGF0dGVybjogcGF0dGVybnMgJiYgdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIkFycmF5QmluZGluZ1wiLCBlbGVtZW50czogcGF0dGVybnMsIHJlc3RFbGVtZW50IH0sIHN0YXJ0TG9jYXRpb24pLFxuICAgICAgaXNCaW5kaW5nRWxlbWVudDogYWxsQmluZGluZ0VsZW1lbnRzLFxuICAgICAgZXhwckVycm9yOiBmaXJzdEV4cHJFcnJvclxuICAgIH07XG4gIH1cblxuICBwYXJzZU9iamVjdEV4cHJlc3Npb24oKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTEJSQUNFKTtcblxuICAgIGxldCBwcm9wZXJ0aWVzID0gW10sIGJpbmRpbmdQcm9wZXJ0aWVzID0gW10sIGlzQmluZGluZ0VsZW1lbnQgPSB0cnVlLCBleHByRXJyb3IgPSBudWxsO1xuICAgIGxldCBoYXNfX3Byb3RvX18gPSBbZmFsc2VdO1xuICAgIHdoaWxlICghdGhpcy5tYXRjaChUb2tlblR5cGUuUkJSQUNFKSkge1xuICAgICAgbGV0IHtcbiAgICAgICAgcHJvcGVydHksXG4gICAgICAgIGJpbmRpbmdQcm9wZXJ0eSxcbiAgICAgICAgaXNCaW5kaW5nRWxlbWVudDogaXNCaW5kaW5nRWxlbWVudE5leHQsXG4gICAgICAgIGV4cHJFcnJvcjogZXhwckVycm9yTmV4dFxuICAgICAgICB9ID0gdGhpcy5wYXJzZVByb3BlcnR5RGVmaW5pdGlvbihoYXNfX3Byb3RvX18pO1xuICAgICAgaWYgKHByb3BlcnRpZXMpIHtcbiAgICAgICAgaWYgKHByb3BlcnR5KSB7XG4gICAgICAgICAgcHJvcGVydGllcy5wdXNoKHByb3BlcnR5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBleHByRXJyb3IgPSBleHByRXJyb3IgfHwgZXhwckVycm9yTmV4dDtcbiAgICAgICAgICBwcm9wZXJ0aWVzID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoYmluZGluZ1Byb3BlcnRpZXMpIHtcbiAgICAgICAgaWYgKGJpbmRpbmdQcm9wZXJ0eSkge1xuICAgICAgICAgIGJpbmRpbmdQcm9wZXJ0aWVzLnB1c2goYmluZGluZ1Byb3BlcnR5KTtcbiAgICAgICAgICBpc0JpbmRpbmdFbGVtZW50ID0gaXNCaW5kaW5nRWxlbWVudCAmJiBpc0JpbmRpbmdFbGVtZW50TmV4dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBiaW5kaW5nUHJvcGVydGllcyA9IGZhbHNlO1xuICAgICAgICAgIGlzQmluZGluZ0VsZW1lbnQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJCUkFDRSkpIHtcbiAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNPTU1BKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUkJSQUNFKTtcblxuICAgIHJldHVybiB7XG4gICAgICBleHByOiBwcm9wZXJ0aWVzICYmIHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJPYmplY3RFeHByZXNzaW9uXCIsIHByb3BlcnRpZXMgfSwgc3RhcnRMb2NhdGlvbiksXG4gICAgICBwYXR0ZXJuOiBiaW5kaW5nUHJvcGVydGllcyAmJiB0aGlzLm1hcmtMb2NhdGlvbih7XG4gICAgICAgIHR5cGU6IFwiT2JqZWN0QmluZGluZ1wiLFxuICAgICAgICBwcm9wZXJ0aWVzOiBiaW5kaW5nUHJvcGVydGllc1xuICAgICAgfSwgc3RhcnRMb2NhdGlvbiksXG4gICAgICBpc0JpbmRpbmdFbGVtZW50LFxuICAgICAgZXhwckVycm9yXG4gICAgfTtcbiAgfVxuXG4gIHBhcnNlUHJvcGVydHlEZWZpbml0aW9uKGhhc19fcHJvdG9fXykge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgIGxldCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuXG4gICAgbGV0IHttZXRob2RPcktleSwga2luZCwgYmluZGluZ30gPSB0aGlzLnBhcnNlTWV0aG9kRGVmaW5pdGlvbihmYWxzZSk7XG4gICAgc3dpdGNoIChraW5kKSB7XG4gICAgICBjYXNlIFwibWV0aG9kXCI6XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgcHJvcGVydHk6IG1ldGhvZE9yS2V5LFxuICAgICAgICAgIGJpbmRpbmdQcm9wZXJ0eTogbnVsbCxcbiAgICAgICAgICBpc0JpbmRpbmdFbGVtZW50OiBmYWxzZSxcbiAgICAgICAgICBleHByRXJyb3I6IG51bGwsXG4gICAgICAgIH07XG4gICAgICBjYXNlIFwiaWRlbnRpZmllclwiOiAvLyBJZGVudGlmaWVyUmVmZXJlbmNlLFxuICAgICAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLkFTU0lHTikpIHtcbiAgICAgICAgICAvLyBDb3ZlckluaXRpYWxpemVkTmFtZVxuICAgICAgICAgIGlmIChtZXRob2RPcktleS52YWx1ZSA9PT0gXCJ5aWVsZFwiICYmXG4gICAgICAgICAgICAodGhpcy5zdHJpY3QgfHwgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiB8fCB0aGlzLmluR2VuZXJhdG9yQm9keSB8fCB0aGlzLmluR2VuZXJhdG9yUGFyYW1ldGVyKSkge1xuICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRva2VuKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgbGV0IGluaXQgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcHJvcGVydHk6IG51bGwsXG4gICAgICAgICAgICBiaW5kaW5nUHJvcGVydHk6IHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJCaW5kaW5nUHJvcGVydHlJZGVudGlmaWVyXCIsIGJpbmRpbmcsIGluaXQsIH0sIHN0YXJ0TG9jYXRpb24pLFxuICAgICAgICAgICAgaXNCaW5kaW5nRWxlbWVudDogdHJ1ZSxcbiAgICAgICAgICAgIGV4cHJFcnJvcjogdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbihzdGFydExvY2F0aW9uLCBFcnJvck1lc3NhZ2VzLklMTEVHQUxfUFJPUEVSVFkpXG4gICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuQ09MT04pKSB7XG4gICAgICAgICAgaWYgKHRva2VuLnR5cGUgIT09IFRva2VuVHlwZS5JREVOVElGSUVSICYmIHRva2VuLnR5cGUgIT09IFRva2VuVHlwZS5ZSUVMRCB8fFxuICAgICAgICAgICAgKHRoaXMuc3RyaWN0IHx8IHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24pICYmIG1ldGhvZE9yS2V5LnZhbHVlID09PSBcInlpZWxkXCIpIHtcbiAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0b2tlbik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBwcm9wZXJ0eTogdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIlNob3J0aGFuZFByb3BlcnR5XCIsIG5hbWU6IG1ldGhvZE9yS2V5LnZhbHVlIH0sIHN0YXJ0TG9jYXRpb24pLFxuICAgICAgICAgICAgYmluZGluZ1Byb3BlcnR5OiB0aGlzLm1hcmtMb2NhdGlvbih7XG4gICAgICAgICAgICAgIHR5cGU6IFwiQmluZGluZ1Byb3BlcnR5SWRlbnRpZmllclwiLFxuICAgICAgICAgICAgICBiaW5kaW5nOiBiaW5kaW5nLFxuICAgICAgICAgICAgICBpbml0OiBudWxsLFxuICAgICAgICAgICAgfSwgc3RhcnRMb2NhdGlvbiksXG4gICAgICAgICAgICBpc0JpbmRpbmdFbGVtZW50OiB0cnVlLFxuICAgICAgICAgICAgZXhwckVycm9yOiBudWxsXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gRGF0YVByb3BlcnR5XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNPTE9OKTtcbiAgICBpZiAobWV0aG9kT3JLZXkudHlwZSA9PT0gXCJTdGF0aWNQcm9wZXJ0eU5hbWVcIikge1xuICAgICAgaWYgKG1ldGhvZE9yS2V5LnZhbHVlID09PSBcIl9fcHJvdG9fX1wiKSB7XG4gICAgICAgIGlmICghaGFzX19wcm90b19fWzBdKSB7XG4gICAgICAgICAgaGFzX19wcm90b19fWzBdID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLkRVUExJQ0FURV9QUk9UT19QUk9QRVJUWSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgeyBleHByLCBwYXR0ZXJuLCBpc0JpbmRpbmdFbGVtZW50LCBleHByRXJyb3IgfSA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbk9yQmluZGluZ0VsZW1lbnQoKTtcbiAgICByZXR1cm4ge1xuICAgICAgcHJvcGVydHk6IGV4cHIgJiYgdGhpcy5tYXJrTG9jYXRpb24oe1xuICAgICAgICB0eXBlOiBcIkRhdGFQcm9wZXJ0eVwiLCBuYW1lOiBtZXRob2RPcktleSwgZXhwcmVzc2lvbjogZXhwclxuICAgICAgfSwgc3RhcnRMb2NhdGlvbiksXG4gICAgICBiaW5kaW5nUHJvcGVydHk6IHBhdHRlcm4gJiYgdGhpcy5tYXJrTG9jYXRpb24oe1xuICAgICAgICB0eXBlOiBcIkJpbmRpbmdQcm9wZXJ0eVByb3BlcnR5XCIsXG4gICAgICAgIG5hbWU6IG1ldGhvZE9yS2V5LFxuICAgICAgICBiaW5kaW5nOiBwYXR0ZXJuXG4gICAgICB9LCBzdGFydExvY2F0aW9uKSxcbiAgICAgIGlzQmluZGluZ0VsZW1lbnQsXG4gICAgICBleHByRXJyb3IsXG4gICAgfTtcbiAgfVxuXG4gIHBhcnNlUHJvcGVydHlOYW1lKCkge1xuICAgIC8vIFByb3BlcnR5TmFtZVtZaWVsZCxHZW5lcmF0b3JQYXJhbWV0ZXJdOlxuICAgIGxldCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuXG4gICAgaWYgKHRoaXMuZW9mKCkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0b2tlbik7XG4gICAgfVxuXG4gICAgc3dpdGNoICh0b2tlbi50eXBlKSB7XG4gICAgICBjYXNlIFRva2VuVHlwZS5TVFJJTkc6XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgbmFtZTogdGhpcy5tYXJrTG9jYXRpb24oe1xuICAgICAgICAgICAgdHlwZTogXCJTdGF0aWNQcm9wZXJ0eU5hbWVcIixcbiAgICAgICAgICAgIHZhbHVlOiB0aGlzLnBhcnNlU3RyaW5nTGl0ZXJhbCgpLnZhbHVlXG4gICAgICAgICAgfSwgc3RhcnRMb2NhdGlvbiksXG4gICAgICAgICAgYmluZGluZzogbnVsbFxuICAgICAgICB9O1xuICAgICAgY2FzZSBUb2tlblR5cGUuTlVNQkVSOlxuICAgICAgICBsZXQgbnVtTGl0ZXJhbCA9IHRoaXMucGFyc2VOdW1lcmljTGl0ZXJhbCgpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIG5hbWU6IHRoaXMubWFya0xvY2F0aW9uKHtcbiAgICAgICAgICAgIHR5cGU6IFwiU3RhdGljUHJvcGVydHlOYW1lXCIsXG4gICAgICAgICAgICB2YWx1ZTogbnVtTGl0ZXJhbC50eXBlID09PSBcIkxpdGVyYWxJbmZpbml0eUV4cHJlc3Npb25cIiA/IFwiXCIgKyAxIC8gMCA6IG51bUxpdGVyYWwudmFsdWVcbiAgICAgICAgICB9LCBzdGFydExvY2F0aW9uKSxcbiAgICAgICAgICBiaW5kaW5nOiBudWxsXG4gICAgICAgIH07XG4gICAgICBjYXNlIFRva2VuVHlwZS5MQlJBQ0s6XG4gICAgICAgIGxldCBwcmV2aW91c1lpZWxkID0gdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbjtcbiAgICAgICAgaWYgKHRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXIpIHtcbiAgICAgICAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxCUkFDSyk7XG4gICAgICAgIGxldCBleHByID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SQlJBQ0spO1xuICAgICAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gcHJldmlvdXNZaWVsZDtcbiAgICAgICAgcmV0dXJuIHsgbmFtZTogdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIkNvbXB1dGVkUHJvcGVydHlOYW1lXCIsIGV4cHJlc3Npb246IGV4cHIgfSwgc3RhcnRMb2NhdGlvbiksIGJpbmRpbmc6IG51bGwgfTtcbiAgICB9XG5cbiAgICBsZXQgbmFtZSA9IHRoaXMucGFyc2VJZGVudGlmaWVyTmFtZSgpO1xuICAgIHJldHVybiB7XG4gICAgICBuYW1lOiB0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiU3RhdGljUHJvcGVydHlOYW1lXCIsIHZhbHVlOiBuYW1lIH0sIHN0YXJ0TG9jYXRpb24pLFxuICAgICAgYmluZGluZzogdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIkJpbmRpbmdJZGVudGlmaWVyXCIsIG5hbWUgfSwgc3RhcnRMb2NhdGlvbiksXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRlc3QgaWYgbG9va2FoZWFkIGNhbiBiZSB0aGUgYmVnaW5uaW5nIG9mIGEgYFByb3BlcnR5TmFtZWAuXG4gICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgKi9cbiAgbG9va2FoZWFkUHJvcGVydHlOYW1lKCkge1xuICAgIHN3aXRjaCAodGhpcy5sb29rYWhlYWQudHlwZSkge1xuICAgICAgY2FzZSBUb2tlblR5cGUuTlVNQkVSOlxuICAgICAgY2FzZSBUb2tlblR5cGUuU1RSSU5HOlxuICAgICAgY2FzZSBUb2tlblR5cGUuTEJSQUNLOlxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB0aGlzLmxvb2thaGVhZC50eXBlLmtsYXNzLmlzSWRlbnRpZmllck5hbWU7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRyeSB0byBwYXJzZSBhIG1ldGhvZCBkZWZpbml0aW9uLlxuICAgKlxuICAgKiBJZiBpdCB0dXJucyBvdXQgdG8gYmUgb25lIG9mOlxuICAgKiAgKiBgSWRlbnRpZmllclJlZmVyZW5jZWBcbiAgICogICogYENvdmVySW5pdGlhbGl6ZWROYW1lYCAoYElkZW50aWZpZXJSZWZlcmVuY2UgXCI9XCIgQXNzaWdubWVudEV4cHJlc3Npb25gKVxuICAgKiAgKiBgUHJvcGVydHlOYW1lIDogQXNzaWdubWVudEV4cHJlc3Npb25gXG4gICAqIFRoZSB0aGUgcGFyc2VyIHdpbGwgc3RvcCBhdCB0aGUgZW5kIG9mIHRoZSBsZWFkaW5nIGBJZGVudGlmaWVyYCBvciBgUHJvcGVydHlOYW1lYCBhbmQgcmV0dXJuIGl0LlxuICAgKlxuICAgKiBAcmV0dXJucyB7e21ldGhvZE9yS2V5OiAoTWV0aG9kfFByb3BlcnR5TmFtZSksIGtpbmQ6IHN0cmluZ319XG4gICAqL1xuICBwYXJzZU1ldGhvZERlZmluaXRpb24oaXNDbGFzc1Byb3RvTWV0aG9kKSB7XG4gICAgbGV0IHRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICBsZXQgaXNHZW5lcmF0b3IgPSAhIXRoaXMuZWF0KFRva2VuVHlwZS5NVUwpO1xuXG4gICAgbGV0IHtuYW1lLCBiaW5kaW5nfSA9IHRoaXMucGFyc2VQcm9wZXJ0eU5hbWUoKTtcblxuICAgIGlmICghaXNHZW5lcmF0b3IgJiYgdG9rZW4udHlwZSA9PT0gVG9rZW5UeXBlLklERU5USUZJRVIpIHtcbiAgICAgIGxldCBuYW1lID0gdG9rZW4udmFsdWU7XG4gICAgICBpZiAobmFtZS5sZW5ndGggPT09IDMpIHtcbiAgICAgICAgLy8gUHJvcGVydHkgQXNzaWdubWVudDogR2V0dGVyIGFuZCBTZXR0ZXIuXG4gICAgICAgIGlmIChuYW1lID09PSBcImdldFwiICYmIHRoaXMubG9va2FoZWFkUHJvcGVydHlOYW1lKCkpIHtcbiAgICAgICAgICAoe25hbWV9ID0gdGhpcy5wYXJzZVByb3BlcnR5TmFtZSgpKTtcbiAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTFBBUkVOKTtcbiAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcbiAgICAgICAgICBsZXQgcHJldmlvdXNJbkNvbnN0cnVjdG9yID0gdGhpcy5pbkNvbnN0cnVjdG9yO1xuICAgICAgICAgIHRoaXMuaW5Db25zdHJ1Y3RvciA9IGZhbHNlO1xuICAgICAgICAgIGxldCBwcmV2aW91c0luTWV0aG9kID0gdGhpcy5pbk1ldGhvZDtcbiAgICAgICAgICB0aGlzLmluTWV0aG9kID0gdHJ1ZTtcbiAgICAgICAgICBsZXQgW2JvZHldID0gdGhpcy5wYXJzZUZ1bmN0aW9uQm9keShbXSk7XG4gICAgICAgICAgdGhpcy5pbkNvbnN0cnVjdG9yID0gcHJldmlvdXNJbkNvbnN0cnVjdG9yO1xuICAgICAgICAgIHRoaXMuaW5NZXRob2QgPSBwcmV2aW91c0luTWV0aG9kO1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBtZXRob2RPcktleTogdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIkdldHRlclwiLCBuYW1lLCBib2R5IH0sIHN0YXJ0TG9jYXRpb24pLFxuICAgICAgICAgICAga2luZDogXCJtZXRob2RcIlxuICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSBpZiAobmFtZSA9PT0gXCJzZXRcIiAmJiB0aGlzLmxvb2thaGVhZFByb3BlcnR5TmFtZSgpKSB7XG4gICAgICAgICAgKHtuYW1lfSA9IHRoaXMucGFyc2VQcm9wZXJ0eU5hbWUoKSk7XG4gICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgICAgICAgbGV0IHBhcmFtID0gdGhpcy5wYXJzZUJpbmRpbmdFbGVtZW50KCk7XG4gICAgICAgICAgbGV0IGluZm8gPSB7fTtcbiAgICAgICAgICB0aGlzLmNoZWNrUGFyYW0ocGFyYW0sIHRva2VuLCBbXSwgaW5mbyk7XG4gICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJQQVJFTik7XG4gICAgICAgICAgbGV0IHByZXZpb3VzWWllbGQgPSB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uO1xuICAgICAgICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBmYWxzZTtcbiAgICAgICAgICBsZXQgcHJldmlvdXNJbkNvbnN0cnVjdG9yID0gdGhpcy5pbkNvbnN0cnVjdG9yO1xuICAgICAgICAgIHRoaXMuaW5Db25zdHJ1Y3RvciA9IGZhbHNlO1xuICAgICAgICAgIGxldCBwcmV2aW91c0luTWV0aG9kID0gdGhpcy5pbk1ldGhvZDtcbiAgICAgICAgICB0aGlzLmluTWV0aG9kID0gdHJ1ZTtcbiAgICAgICAgICBsZXQgYm91bmRQYXJhbXMgPSBQYXJzZXIuYm91bmROYW1lcyhwYXJhbSk7XG4gICAgICAgICAgbGV0IFtib2R5LCBpc1N0cmljdF0gPSB0aGlzLnBhcnNlRnVuY3Rpb25Cb2R5KGJvdW5kUGFyYW1zKTtcbiAgICAgICAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gcHJldmlvdXNZaWVsZDtcbiAgICAgICAgICB0aGlzLmluQ29uc3RydWN0b3IgPSBwcmV2aW91c0luQ29uc3RydWN0b3I7XG4gICAgICAgICAgdGhpcy5pbk1ldGhvZCA9IHByZXZpb3VzSW5NZXRob2Q7XG4gICAgICAgICAgaWYgKGlzU3RyaWN0KSB7XG4gICAgICAgICAgICBpZiAoaW5mby5maXJzdFJlc3RyaWN0ZWQpIHtcbiAgICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbihpbmZvLmZpcnN0UmVzdHJpY3RlZCwgaW5mby5tZXNzYWdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIG1ldGhvZE9yS2V5OiB0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiU2V0dGVyXCIsIG5hbWUsIHBhcmFtLCBib2R5IH0sIHN0YXJ0TG9jYXRpb24pLFxuICAgICAgICAgICAga2luZDogXCJtZXRob2RcIlxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuTFBBUkVOKSkge1xuICAgICAgbGV0IHByZXZpb3VzWWllbGQgPSB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uO1xuICAgICAgbGV0IHByZXZpb3VzSW5HZW5lcmF0b3JQYXJhbWV0ZXIgPSB0aGlzLmluR2VuZXJhdG9yUGFyYW1ldGVyO1xuICAgICAgdGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlciA9IGlzR2VuZXJhdG9yO1xuICAgICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IGlzR2VuZXJhdG9yO1xuICAgICAgbGV0IHBhcmFtc0xvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuICAgICAgbGV0IHBhcmFtSW5mbyA9IHRoaXMucGFyc2VQYXJhbXMobnVsbCk7XG4gICAgICB0aGlzLmluR2VuZXJhdG9yUGFyYW1ldGVyID0gcHJldmlvdXNJbkdlbmVyYXRvclBhcmFtZXRlcjtcbiAgICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBwcmV2aW91c1lpZWxkO1xuICAgICAgbGV0IHByZXZpb3VzSW5HZW5lcmF0b3JCb2R5ID0gdGhpcy5pbkdlbmVyYXRvckJvZHk7XG4gICAgICBsZXQgcHJldmlvdXNJbkNvbnN0cnVjdG9yID0gdGhpcy5pbkNvbnN0cnVjdG9yO1xuICAgICAgbGV0IHByZXZpb3VzSW5NZXRob2QgPSB0aGlzLmluTWV0aG9kO1xuICAgICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IGlzR2VuZXJhdG9yO1xuICAgICAgdGhpcy5pbkNvbnN0cnVjdG9yID1cbiAgICAgICAgaXNDbGFzc1Byb3RvTWV0aG9kICYmICFpc0dlbmVyYXRvciAmJiB0aGlzLmhhc0NsYXNzSGVyaXRhZ2UgJiZcbiAgICAgICAgbmFtZS50eXBlID09PSBcIlN0YXRpY1Byb3BlcnR5TmFtZVwiICYmIG5hbWUudmFsdWUgPT09IFwiY29uc3RydWN0b3JcIjtcbiAgICAgIHRoaXMuaW5NZXRob2QgPSB0cnVlO1xuXG4gICAgICBpZiAoaXNHZW5lcmF0b3IpIHtcbiAgICAgICAgdGhpcy5pbkdlbmVyYXRvckJvZHkgPSB0cnVlO1xuICAgICAgfVxuICAgICAgbGV0IGJvdW5kUGFyYW1zID0gW10uY29uY2F0LmFwcGx5KFtdLCBwYXJhbUluZm8ucGFyYW1zLm1hcChQYXJzZXIuYm91bmROYW1lcykpO1xuXG4gICAgICBsZXQgcGFyYW1zID0gdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIkZvcm1hbFBhcmFtZXRlcnNcIiwgaXRlbXM6IHBhcmFtSW5mby5wYXJhbXMsIHJlc3Q6IHBhcmFtSW5mby5yZXN0IH0sIHBhcmFtc0xvY2F0aW9uKTtcblxuICAgICAgbGV0IFtib2R5XSA9IHRoaXMucGFyc2VGdW5jdGlvbkJvZHkoYm91bmRQYXJhbXMpO1xuICAgICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IHByZXZpb3VzWWllbGQ7XG4gICAgICB0aGlzLmluR2VuZXJhdG9yQm9keSA9IHByZXZpb3VzSW5HZW5lcmF0b3JCb2R5O1xuICAgICAgdGhpcy5pbkNvbnN0cnVjdG9yID0gcHJldmlvdXNJbkNvbnN0cnVjdG9yO1xuICAgICAgdGhpcy5pbk1ldGhvZCA9IHByZXZpb3VzSW5NZXRob2Q7XG5cbiAgICAgIGlmIChwYXJhbUluZm8uZmlyc3RSZXN0cmljdGVkKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24ocGFyYW1JbmZvLmZpcnN0UmVzdHJpY3RlZCwgcGFyYW1JbmZvLm1lc3NhZ2UpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBtZXRob2RPcktleTogdGhpcy5tYXJrTG9jYXRpb24oeyB0eXBlOiBcIk1ldGhvZFwiLCBpc0dlbmVyYXRvciwgbmFtZSwgcGFyYW1zLCBib2R5IH0sIHN0YXJ0TG9jYXRpb24pLFxuICAgICAgICBraW5kOiBcIm1ldGhvZFwiXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBtZXRob2RPcktleTogbmFtZSxcbiAgICAgIGtpbmQ6IHRva2VuLnR5cGUua2xhc3MuaXNJZGVudGlmaWVyTmFtZSA/IFwiaWRlbnRpZmllclwiIDogXCJwcm9wZXJ0eVwiLFxuICAgICAgYmluZGluZzogYmluZGluZ1xuICAgIH07XG4gIH1cblxuICBwYXJzZUNsYXNzKHtpc0V4cHIsIGluRGVmYXVsdCA9IGZhbHNlfSkge1xuICAgIGxldCBsb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuQ0xBU1MpO1xuICAgIGxldCBuYW1lID0gbnVsbDtcbiAgICBsZXQgaGVyaXRhZ2UgPSBudWxsO1xuXG4gICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLklERU5USUZJRVIpKSB7XG4gICAgICBsZXQgaWRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICAgIG5hbWUgPSB0aGlzLnBhcnNlQmluZGluZ0lkZW50aWZpZXIoKTtcbiAgICB9IGVsc2UgaWYgKCFpc0V4cHIpIHtcbiAgICAgIGlmIChpbkRlZmF1bHQpIHtcbiAgICAgICAgbmFtZSA9IHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJCaW5kaW5nSWRlbnRpZmllclwiLCBuYW1lOiBcIipkZWZhdWx0KlwiIH0sIGxvY2F0aW9uKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IHByZXZpb3VzSW5HZW5lcmF0b3JQYXJhbWV0ZXIgPSB0aGlzLmluR2VuZXJhdG9yUGFyYW1ldGVyO1xuICAgIGxldCBwcmV2aW91c1BhcmFtWWllbGQgPSB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uO1xuICAgIGxldCBwcmV2aW91c0hhc0NsYXNzSGVyaXRhZ2UgPSB0aGlzLmhhc0NsYXNzSGVyaXRhZ2U7XG4gICAgaWYgKGlzRXhwcikge1xuICAgICAgdGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlciA9IGZhbHNlO1xuICAgICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IGZhbHNlO1xuICAgIH1cbiAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLkVYVEVORFMpKSB7XG4gICAgICBoZXJpdGFnZSA9IFBhcnNlci5nZXRFeHByKHRoaXMucGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uKHsgYWxsb3dDYWxsOiB0cnVlIH0pKTtcbiAgICB9XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTEJSQUNFKTtcbiAgICBsZXQgb3JpZ2luYWxTdHJpY3QgPSB0aGlzLnN0cmljdDtcbiAgICB0aGlzLnN0cmljdCA9IHRydWU7XG4gICAgbGV0IGVsZW1lbnRzID0gW107XG4gICAgbGV0IGhhc0NvbnN0cnVjdG9yID0gZmFsc2U7XG4gICAgdGhpcy5oYXNDbGFzc0hlcml0YWdlID0gaGVyaXRhZ2UgIT0gbnVsbDtcbiAgICB3aGlsZSAoIXRoaXMuZWF0KFRva2VuVHlwZS5SQlJBQ0UpKSB7XG4gICAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLlNFTUlDT0xPTikpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBsZXQgbWV0aG9kVG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICAgIGxldCBpc1N0YXRpYyA9IGZhbHNlO1xuICAgICAgbGV0IHttZXRob2RPcktleSwga2luZH0gPSB0aGlzLnBhcnNlTWV0aG9kRGVmaW5pdGlvbih0cnVlKTtcbiAgICAgIGlmIChraW5kID09PSBcImlkZW50aWZpZXJcIiAmJiBtZXRob2RPcktleS52YWx1ZSA9PT0gXCJzdGF0aWNcIikge1xuICAgICAgICBpc1N0YXRpYyA9IHRydWU7XG4gICAgICAgICh7bWV0aG9kT3JLZXksIGtpbmR9ID0gdGhpcy5wYXJzZU1ldGhvZERlZmluaXRpb24oZmFsc2UpKTtcbiAgICAgIH1cbiAgICAgIHN3aXRjaCAoa2luZCkge1xuICAgICAgICBjYXNlIFwibWV0aG9kXCI6XG4gICAgICAgICAgbGV0IGtleSA9IG1ldGhvZE9yS2V5Lm5hbWU7XG4gICAgICAgICAgaWYgKCFpc1N0YXRpYykge1xuICAgICAgICAgICAgaWYgKGtleS50eXBlID09PSBcIlN0YXRpY1Byb3BlcnR5TmFtZVwiICYmIGtleS52YWx1ZSA9PT0gXCJjb25zdHJ1Y3RvclwiKSB7XG4gICAgICAgICAgICAgIGlmIChtZXRob2RPcktleS50eXBlICE9PSBcIk1ldGhvZFwiIHx8IG1ldGhvZE9yS2V5LmlzR2VuZXJhdG9yKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbihtZXRob2RUb2tlbiwgXCJDb25zdHJ1Y3RvcnMgY2Fubm90IGJlIGdlbmVyYXRvcnMsIGdldHRlcnMgb3Igc2V0dGVyc1wiKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoaGFzQ29uc3RydWN0b3IpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKG1ldGhvZFRva2VuLCBcIk9ubHkgb25lIGNvbnN0cnVjdG9yIGlzIGFsbG93ZWQgaW4gYSBjbGFzc1wiKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBoYXNDb25zdHJ1Y3RvciA9IHRydWU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKGtleS50eXBlID09PSBcIlN0YXRpY1Byb3BlcnR5TmFtZVwiICYmIGtleS52YWx1ZSA9PT0gXCJwcm90b3R5cGVcIikge1xuICAgICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKG1ldGhvZFRva2VuLCBcIlN0YXRpYyBjbGFzcyBtZXRob2RzIGNhbm5vdCBiZSBuYW1lZCAncHJvdG90eXBlJ1wiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgZWxlbWVudHMucHVzaChjb3B5TG9jYXRpb24obWV0aG9kT3JLZXksIHsgdHlwZTogXCJDbGFzc0VsZW1lbnRcIiwgaXNTdGF0aWMsIG1ldGhvZDogbWV0aG9kT3JLZXkgfSkpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoXCJPbmx5IG1ldGhvZHMgYXJlIGFsbG93ZWQgaW4gY2xhc3Nlc1wiKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFpc0V4cHIpIHtcbiAgICAgIHRoaXMuVkROW1wiJFwiICsgbmFtZS5uYW1lXSA9IHRydWU7XG4gICAgfVxuICAgIHRoaXMuc3RyaWN0ID0gb3JpZ2luYWxTdHJpY3Q7XG4gICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IHByZXZpb3VzUGFyYW1ZaWVsZDtcbiAgICB0aGlzLmluR2VuZXJhdG9yUGFyYW1ldGVyID0gcHJldmlvdXNJbkdlbmVyYXRvclBhcmFtZXRlcjtcbiAgICB0aGlzLmhhc0NsYXNzSGVyaXRhZ2UgPSBwcmV2aW91c0hhc0NsYXNzSGVyaXRhZ2U7XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogaXNFeHByID8gXCJDbGFzc0V4cHJlc3Npb25cIiA6IFwiQ2xhc3NEZWNsYXJhdGlvblwiLCBuYW1lLCBzdXBlcjogaGVyaXRhZ2UsIGVsZW1lbnRzIH0sIGxvY2F0aW9uKTtcbiAgfVxuXG4gIHBhcnNlRnVuY3Rpb24oe2lzRXhwciwgaXNUb3BMZXZlbCwgaW5EZWZhdWx0ID0gZmFsc2UsIGFsbG93R2VuZXJhdG9yID0gdHJ1ZX0pIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5GVU5DVElPTik7XG5cbiAgICBsZXQgbmFtZSA9IG51bGw7XG4gICAgbGV0IG1lc3NhZ2UgPSBudWxsO1xuICAgIGxldCBmaXJzdFJlc3RyaWN0ZWQgPSBudWxsO1xuICAgIGxldCBpc0dlbmVyYXRvciA9IGFsbG93R2VuZXJhdG9yICYmICEhdGhpcy5lYXQoVG9rZW5UeXBlLk1VTCk7XG4gICAgbGV0IHByZXZpb3VzR2VuZXJhdG9yUGFyYW1ldGVyID0gdGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlcjtcbiAgICBsZXQgcHJldmlvdXNZaWVsZCA9IHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb247XG4gICAgbGV0IHByZXZpb3VzSW5HZW5lcmF0b3JCb2R5ID0gdGhpcy5pbkdlbmVyYXRvckJvZHk7XG5cbiAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLkxQQVJFTikpIHtcbiAgICAgIGxldCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgICAgbGV0IGlkZW50aWZpZXJMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICAgIG5hbWUgPSB0aGlzLnBhcnNlSWRlbnRpZmllcigpO1xuICAgICAgaWYgKHRoaXMuc3RyaWN0IHx8IGlzR2VuZXJhdG9yKSB7XG4gICAgICAgIGlmIChpc1Jlc3RyaWN0ZWRXb3JkKG5hbWUpKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5TVFJJQ1RfRlVOQ1RJT05fTkFNRSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChpc1Jlc3RyaWN0ZWRXb3JkKG5hbWUpKSB7XG4gICAgICAgICAgZmlyc3RSZXN0cmljdGVkID0gdG9rZW47XG4gICAgICAgICAgbWVzc2FnZSA9IEVycm9yTWVzc2FnZXMuU1RSSUNUX0ZVTkNUSU9OX05BTUU7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNTdHJpY3RNb2RlUmVzZXJ2ZWRXb3JkKG5hbWUpKSB7XG4gICAgICAgICAgZmlyc3RSZXN0cmljdGVkID0gdG9rZW47XG4gICAgICAgICAgbWVzc2FnZSA9IEVycm9yTWVzc2FnZXMuU1RSSUNUX1JFU0VSVkVEX1dPUkQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIG5hbWUgPSB0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiQmluZGluZ0lkZW50aWZpZXJcIiwgbmFtZTogbmFtZSB9LCBpZGVudGlmaWVyTG9jYXRpb24pO1xuICAgIH0gZWxzZSBpZiAoIWlzRXhwcikge1xuICAgICAgaWYgKGluRGVmYXVsdCkge1xuICAgICAgICBuYW1lID0gdGhpcy5tYXJrTG9jYXRpb24oe3R5cGU6IFwiQmluZGluZ0lkZW50aWZpZXJcIiwgbmFtZTogXCIqZGVmYXVsdCpcIiB9LCBzdGFydExvY2F0aW9uKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgbGV0IHBhcmFtc0xvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuXG4gICAgdGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlciA9IGlzR2VuZXJhdG9yO1xuICAgIHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb24gPSBpc0dlbmVyYXRvcjtcbiAgICBsZXQgaW5mbyA9IHRoaXMucGFyc2VQYXJhbXMoZmlyc3RSZXN0cmljdGVkKTtcbiAgICB0aGlzLmluR2VuZXJhdG9yUGFyYW1ldGVyID0gcHJldmlvdXNHZW5lcmF0b3JQYXJhbWV0ZXI7XG4gICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IHByZXZpb3VzWWllbGQ7XG5cbiAgICBpZiAoaW5mby5tZXNzYWdlICE9IG51bGwpIHtcbiAgICAgIG1lc3NhZ2UgPSBpbmZvLm1lc3NhZ2U7XG4gICAgfVxuXG4gICAgbGV0IHByZXZpb3VzU3RyaWN0ID0gdGhpcy5zdHJpY3Q7XG4gICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IGlzR2VuZXJhdG9yO1xuICAgIGlmIChpc0dlbmVyYXRvcikge1xuICAgICAgdGhpcy5pbkdlbmVyYXRvckJvZHkgPSB0cnVlO1xuICAgIH1cbiAgICBsZXQgcHJldmlvdXNJbkNvbnN0cnVjdG9yID0gdGhpcy5pbkNvbnN0cnVjdG9yO1xuICAgIHRoaXMuaW5Db25zdHJ1Y3RvciA9IGZhbHNlO1xuICAgIGxldCBwcmV2aW91c0luTWV0aG9kID0gdGhpcy5pbk1ldGhvZDtcbiAgICB0aGlzLmluTWV0aG9kID0gZmFsc2U7XG4gICAgbGV0IGJvdW5kUGFyYW1zID0gW10uY29uY2F0LmFwcGx5KFtdLCBpbmZvLnBhcmFtcy5tYXAoUGFyc2VyLmJvdW5kTmFtZXMpKTtcblxuICAgIGxldCBwYXJhbXMgPSB0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiRm9ybWFsUGFyYW1ldGVyc1wiLCBpdGVtczogaW5mby5wYXJhbXMsIHJlc3Q6IGluZm8ucmVzdCB9LCBwYXJhbXNMb2NhdGlvbik7XG5cbiAgICBsZXQgW2JvZHksIGlzU3RyaWN0XSA9IHRoaXMucGFyc2VGdW5jdGlvbkJvZHkoYm91bmRQYXJhbXMpO1xuICAgIHRoaXMuaW5HZW5lcmF0b3JCb2R5ID0gcHJldmlvdXNJbkdlbmVyYXRvckJvZHk7XG4gICAgdGhpcy5pbkNvbnN0cnVjdG9yID0gcHJldmlvdXNJbkNvbnN0cnVjdG9yO1xuICAgIHRoaXMuaW5NZXRob2QgPSBwcmV2aW91c0luTWV0aG9kO1xuXG4gICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IHByZXZpb3VzWWllbGQ7XG4gICAgaWYgKG1lc3NhZ2UgIT0gbnVsbCkge1xuICAgICAgaWYgKCh0aGlzLnN0cmljdCB8fCBpc1N0cmljdCkgJiYgaW5mby5maXJzdFJlc3RyaWN0ZWQgIT0gbnVsbCkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKGluZm8uZmlyc3RSZXN0cmljdGVkLCBtZXNzYWdlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5zdHJpY3QgPSBwcmV2aW91c1N0cmljdDtcbiAgICBpZiAoIWlzRXhwcikge1xuICAgICAgaWYgKGlzVG9wTGV2ZWwpIHtcbiAgICAgICAgdGhpcy5WRE5bXCIkXCIgKyBuYW1lLm5hbWVdID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuTEROLnB1c2gobmFtZS5uYW1lKTtcbiAgICAgIH1cblxuICAgIH1cblxuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihcbiAgICAgIHsgdHlwZTogaXNFeHByID8gXCJGdW5jdGlvbkV4cHJlc3Npb25cIiA6IFwiRnVuY3Rpb25EZWNsYXJhdGlvblwiLCBpc0dlbmVyYXRvciwgbmFtZSwgcGFyYW1zLCBib2R5IH0sIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VBcnJheUJpbmRpbmcoKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTEJSQUNLKTtcblxuICAgIGxldCBlbGVtZW50cyA9IFtdLCByZXN0RWxlbWVudCA9IG51bGw7XG5cbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLlJCUkFDSykpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBsZXQgZWw7XG5cbiAgICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuQ09NTUEpKSB7XG4gICAgICAgIGVsID0gbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuRUxMSVBTSVMpKSB7XG4gICAgICAgICAgcmVzdEVsZW1lbnQgPSB0aGlzLnBhcnNlQmluZGluZ0lkZW50aWZpZXIoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbCA9IHRoaXMucGFyc2VCaW5kaW5nRWxlbWVudCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuUkJSQUNLKSkge1xuICAgICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5DT01NQSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsZW1lbnRzLnB1c2goZWwpO1xuICAgIH1cblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SQlJBQ0spO1xuXG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJBcnJheUJpbmRpbmdcIiwgZWxlbWVudHMsIHJlc3RFbGVtZW50IH0sIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VCaW5kaW5nUHJvcGVydHkoKSB7XG4gICAgbGV0IHN0YXJ0TG9jYXRpb24gPSB0aGlzLmdldExvY2F0aW9uKCk7XG4gICAgbGV0IHRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgbGV0IHtuYW1lLCBiaW5kaW5nfSA9IHRoaXMucGFyc2VQcm9wZXJ0eU5hbWUoKTtcbiAgICBpZiAoKHRva2VuLnR5cGUgPT09IFRva2VuVHlwZS5JREVOVElGSUVSIHx8IHRva2VuLnR5cGUgPT09IFRva2VuVHlwZS5ZSUVMRCkgJiYgbmFtZS50eXBlID09PSAnU3RhdGljUHJvcGVydHlOYW1lJykge1xuICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5DT0xPTikpIHtcbiAgICAgICAgaWYgKHRva2VuLnR5cGUgPT09IFRva2VuVHlwZS5ZSUVMRCAmJiAodGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiB8fCB0aGlzLmluR2VuZXJhdG9yUGFyYW1ldGVyIHx8IHRoaXMuaW5HZW5lcmF0b3JCb2R5KSkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0b2tlbik7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGRlZmF1bHRWYWx1ZSA9IG51bGw7XG4gICAgICAgIGlmICh0aGlzLmVhdChUb2tlblR5cGUuQVNTSUdOKSkge1xuICAgICAgICAgIGxldCBwcmV2aW91c0FsbG93WWllbGRFeHByZXNzaW9uID0gdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbjtcbiAgICAgICAgICBpZiAodGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlcikge1xuICAgICAgICAgICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBsZXQgZXhwciA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgICAgIGRlZmF1bHRWYWx1ZSA9IGV4cHI7XG4gICAgICAgICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IHByZXZpb3VzQWxsb3dZaWVsZEV4cHJlc3Npb247XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHtcbiAgICAgICAgICB0eXBlOiBcIkJpbmRpbmdQcm9wZXJ0eUlkZW50aWZpZXJcIixcbiAgICAgICAgICBiaW5kaW5nOiBiaW5kaW5nLFxuICAgICAgICAgIGluaXQ6IGRlZmF1bHRWYWx1ZVxuICAgICAgICB9LCBzdGFydExvY2F0aW9uKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNPTE9OKTtcbiAgICBiaW5kaW5nID0gdGhpcy5wYXJzZUJpbmRpbmdFbGVtZW50KCk7XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJCaW5kaW5nUHJvcGVydHlQcm9wZXJ0eVwiLCBuYW1lLCBiaW5kaW5nIH0sIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VPYmplY3RCaW5kaW5nKCkge1xuICAgIGxldCBzdGFydExvY2F0aW9uID0gdGhpcy5nZXRMb2NhdGlvbigpO1xuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxCUkFDRSk7XG5cbiAgICBsZXQgcHJvcGVydGllcyA9IFtdO1xuICAgIHdoaWxlICghdGhpcy5tYXRjaChUb2tlblR5cGUuUkJSQUNFKSkge1xuICAgICAgcHJvcGVydGllcy5wdXNoKHRoaXMucGFyc2VCaW5kaW5nUHJvcGVydHkoKSk7XG4gICAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJCUkFDRSkpIHtcbiAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNPTU1BKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUkJSQUNFKTtcblxuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih7IHR5cGU6IFwiT2JqZWN0QmluZGluZ1wiLCBwcm9wZXJ0aWVzIH0sIHN0YXJ0TG9jYXRpb24pO1xuICB9XG5cbiAgcGFyc2VCaW5kaW5nVGFyZ2V0KCkge1xuICAgIHN3aXRjaCAodGhpcy5sb29rYWhlYWQudHlwZSkge1xuICAgICAgY2FzZSBUb2tlblR5cGUuSURFTlRJRklFUjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLllJRUxEOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZUJpbmRpbmdJZGVudGlmaWVyKCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5MQlJBQ0s6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlQXJyYXlCaW5kaW5nKCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5MQlJBQ0U6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlT2JqZWN0QmluZGluZygpO1xuICAgIH1cbiAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuICB9XG5cbiAgcGFyc2VCaW5kaW5nRWxlbWVudCgpIHtcbiAgICBsZXQgc3RhcnRMb2NhdGlvbiA9IHRoaXMuZ2V0TG9jYXRpb24oKTtcbiAgICBsZXQgYmluZGluZyA9IHRoaXMucGFyc2VCaW5kaW5nVGFyZ2V0KCk7XG5cbiAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLkFTU0lHTikpIHtcbiAgICAgIGxldCBwcmV2aW91c0luR2VuZXJhdG9yUGFyYW1ldGVyID0gdGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlcjtcbiAgICAgIGxldCBwcmV2aW91c1lpZWxkRXhwcmVzc2lvbiA9IHRoaXMuYWxsb3dZaWVsZEV4cHJlc3Npb247XG4gICAgICBpZiAodGhpcy5pbkdlbmVyYXRvclBhcmFtZXRlcikge1xuICAgICAgICB0aGlzLmFsbG93WWllbGRFeHByZXNzaW9uID0gZmFsc2U7XG4gICAgICB9XG4gICAgICB0aGlzLmluR2VuZXJhdG9yUGFyYW1ldGVyID0gZmFsc2U7XG4gICAgICBsZXQgaW5pdCA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgYmluZGluZyA9IHRoaXMubWFya0xvY2F0aW9uKHsgdHlwZTogXCJCaW5kaW5nV2l0aERlZmF1bHRcIiwgYmluZGluZywgaW5pdCB9LCBzdGFydExvY2F0aW9uKTtcbiAgICAgIHRoaXMuaW5HZW5lcmF0b3JQYXJhbWV0ZXIgPSBwcmV2aW91c0luR2VuZXJhdG9yUGFyYW1ldGVyO1xuICAgICAgdGhpcy5hbGxvd1lpZWxkRXhwcmVzc2lvbiA9IHByZXZpb3VzWWllbGRFeHByZXNzaW9uO1xuXG4gICAgfVxuICAgIHJldHVybiBiaW5kaW5nO1xuICB9XG5cbiAgcGFyc2VQYXJhbSgpIHtcbiAgICBsZXQgb3JpZ2luYWxJblBhcmFtZXRlciA9IHRoaXMuaW5QYXJhbWV0ZXI7XG4gICAgdGhpcy5pblBhcmFtZXRlciA9IHRydWU7XG4gICAgbGV0IHBhcmFtID0gdGhpcy5wYXJzZUJpbmRpbmdFbGVtZW50KCk7XG4gICAgdGhpcy5pblBhcmFtZXRlciA9IG9yaWdpbmFsSW5QYXJhbWV0ZXI7XG4gICAgcmV0dXJuIHBhcmFtO1xuICB9XG5cbiAgY2hlY2tQYXJhbShwYXJhbSwgdG9rZW4sIGJvdW5kLCBpbmZvKSB7XG4gICAgbGV0IG5ld0JvdW5kID0gUGFyc2VyLmJvdW5kTmFtZXMocGFyYW0pO1xuICAgIFtdLnB1c2guYXBwbHkoYm91bmQsIG5ld0JvdW5kKTtcblxuICAgIGlmIChmaXJzdER1cGxpY2F0ZShuZXdCb3VuZCkgIT0gbnVsbCkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhMb2NhdGlvbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5EVVBMSUNBVEVfQklORElORywgZmlyc3REdXBsaWNhdGUobmV3Qm91bmQpKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5zdHJpY3QpIHtcbiAgICAgIGlmIChuZXdCb3VuZC5zb21lKGlzUmVzdHJpY3RlZFdvcmQpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoTG9jYXRpb24odG9rZW4sIEVycm9yTWVzc2FnZXMuU1RSSUNUX1BBUkFNX05BTUUpO1xuICAgICAgfSBlbHNlIGlmIChmaXJzdER1cGxpY2F0ZShib3VuZCkgIT0gbnVsbCkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aExvY2F0aW9uKHRva2VuLCBFcnJvck1lc3NhZ2VzLlNUUklDVF9QQVJBTV9EVVBFKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGluZm8uZmlyc3RSZXN0cmljdGVkID09IG51bGwpIHtcbiAgICAgIGlmIChuZXdCb3VuZC5zb21lKGlzUmVzdHJpY3RlZFdvcmQpKSB7XG4gICAgICAgIGluZm8uZmlyc3RSZXN0cmljdGVkID0gdG9rZW47XG4gICAgICAgIGluZm8ubWVzc2FnZSA9IEVycm9yTWVzc2FnZXMuU1RSSUNUX1BBUkFNX05BTUU7XG4gICAgICB9IGVsc2UgaWYgKGhhc1N0cmljdE1vZGVSZXNlcnZlZFdvcmQobmV3Qm91bmQpKSB7XG4gICAgICAgIGluZm8uZmlyc3RSZXN0cmljdGVkID0gdG9rZW47XG4gICAgICAgIGluZm8ubWVzc2FnZSA9IEVycm9yTWVzc2FnZXMuU1RSSUNUX1JFU0VSVkVEX1dPUkQ7XG4gICAgICB9IGVsc2UgaWYgKGZpcnN0RHVwbGljYXRlKGJvdW5kKSAhPSBudWxsKSB7XG4gICAgICAgIGluZm8uZmlyc3RSZXN0cmljdGVkID0gdG9rZW47XG4gICAgICAgIGluZm8ubWVzc2FnZSA9IEVycm9yTWVzc2FnZXMuU1RSSUNUX1BBUkFNX0RVUEU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcGFyc2VQYXJhbXMoZnIpIHtcbiAgICBsZXQgaW5mbyA9IHtwYXJhbXM6IFtdLCByZXN0OiBudWxsfSwgaXNTaW1wbGVQYXJhbWV0ZXIgPSB0cnVlO1xuICAgIGluZm8uZmlyc3RSZXN0cmljdGVkID0gZnI7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG5cbiAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJQQVJFTikpIHtcbiAgICAgIGxldCBib3VuZCA9IFtdO1xuICAgICAgbGV0IHNlZW5SZXN0ID0gZmFsc2U7XG5cbiAgICAgIHdoaWxlICghdGhpcy5lb2YoKSkge1xuICAgICAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICAgICAgbGV0IHBhcmFtO1xuICAgICAgICBpZiAodGhpcy5lYXQoVG9rZW5UeXBlLkVMTElQU0lTKSkge1xuICAgICAgICAgIGlzU2ltcGxlUGFyYW1ldGVyID0gZmFsc2U7XG4gICAgICAgICAgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICAgICAgICBwYXJhbSA9IHRoaXMucGFyc2VCaW5kaW5nSWRlbnRpZmllcigpO1xuICAgICAgICAgIHNlZW5SZXN0ID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwYXJhbSA9IHRoaXMucGFyc2VQYXJhbSgpO1xuICAgICAgICAgIGlmIChwYXJhbS50eXBlICE9PSBcIkJpbmRpbmdJZGVudGlmaWVyXCIpIHtcbiAgICAgICAgICAgIGlzU2ltcGxlUGFyYW1ldGVyID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jaGVja1BhcmFtKHBhcmFtLCB0b2tlbiwgYm91bmQsIGluZm8pO1xuXG4gICAgICAgIGlmIChzZWVuUmVzdCkge1xuICAgICAgICAgIGluZm8ucmVzdCA9IHBhcmFtO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGluZm8ucGFyYW1zLnB1c2gocGFyYW0pO1xuICAgICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuUlBBUkVOKSkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5DT01NQSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFpc1NpbXBsZVBhcmFtZXRlcikge1xuICAgICAgaWYgKGluZm8ubWVzc2FnZSA9PT0gRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUEFSQU1fRFVQRSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKGluZm8ubWVzc2FnZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJQQVJFTik7XG4gICAgcmV0dXJuIGluZm87XG4gIH1cbn1cbiJdfQ==