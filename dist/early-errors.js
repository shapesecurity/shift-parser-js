// istanbul ignore next
"use strict";

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

// istanbul ignore next

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

// istanbul ignore next

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

// istanbul ignore next

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

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

var _reduce$MonoidalReducer = require("shift-reducer");

var _isRestrictedWord$isStrictModeReservedWord = require("./utils");

var _EarlyErrorState$EarlyError = require("./early-error-state");

function isStrictFunctionBody(_ref) {
  var directives = _ref.directives;

  return directives.some(function (directive) {
    return directive.rawValue === "use strict";
  });
}

function containsDuplicates(list) {
  var uniqs = [];
  for (var i = 0, l = list.length; i < l; ++i) {
    var item = list[i];
    if (uniqs.indexOf(item) >= 0) {
      return true;
    }
    uniqs.push(item);
  }
  return false;
}

/*
function duplicates(list) {
  let duplicates = [];
  let uniqs = [];
  for (let i = 0, l = list.length; i < l; ++i) {
    let item = list[i];
    if (uniqs.indexOf(item) >= 0) {
      if (duplicates.indexOf(item) < 0) {
        duplicates.push(item);
      }
    }
    uniqs.push(item);
  }
  return duplicates;
}
*/

function isValidSimpleAssignmentTarget(node) {
  switch (node.type) {
    case "IdentifierExpression":
    case "ComputedMemberExpression":
    case "StaticMemberExpression":
      return true;
  }
  return false;
}

function isLabelledFunction(_x3) {
  var _left;

  var _again = true;

  _function: while (_again) {
    _again = false;
    var node = _x3;

    if (!(_left = node.type === "LabeledStatement")) {
      return _left;
    }

    if (_left = node.body.type === "FunctionDeclaration") {
      return _left;
    }

    _x3 = node.body;
    _again = true;
    continue _function;
  }
}

function isIterationStatement(_x4) {
  var _again2 = true;

  _function2: while (_again2) {
    _again2 = false;
    var node = _x4;

    switch (node.type) {
      case "LabeledStatement":
        _x4 = node.body;
        _again2 = true;
        continue _function2;

      case "DoWhileStatement":
      case "ForInStatement":
      case "ForOfStatement":
      case "ForStatement":
      case "WhileStatement":
        return true;
    }
    return false;
  }
}

function isSpecialMethod(methodDefinition) {
  if (methodDefinition.name.type !== "StaticPropertyName" || methodDefinition.name.value !== "constructor") {
    return false;
  }switch (methodDefinition.type) {
    case "Getter":
    case "Setter":
      return true;
    case "Method":
      return methodDefinition.isGenerator;
  }
  /* istanbul ignore next */
  throw new Error("not reached");
}

var PatternAcceptor = (function () {
  function PatternAcceptor(pattern) {
    var u = arguments[1] === undefined ? false : arguments[1];

    _classCallCheck(this, PatternAcceptor);

    this.index = 0;
    this.nCapturingParens = 0;
    // constants
    this.length = pattern.length;
    this.pattern = pattern;
    this.u = u;
  }

  _createClass(PatternAcceptor, [{
    key: "eat",
    value: function eat(ch) {
      if (this.index >= this.length || this.pattern[this.index] !== ch) {
        return false;
      }++this.index;
      return true;
    }
  }, {
    key: "eatRegExp",
    value: function eatRegExp(r) {
      if (this.index >= this.length || !r.test(this.pattern[this.index])) {
        return false;
      }++this.index;
      return true;
    }
  }, {
    key: "eatN",
    value: function eatN(n, r) {
      if (this.index + n <= this.length && r.test(this.pattern.slice(this.index, this.index + n))) {
        this.index += n;
        return true;
      }
      return false;
    }
  }, {
    key: "match",
    value: function match(ch) {
      return this.index < this.length && this.pattern[this.index] === ch;
    }
  }, {
    key: "matchRegExp",
    value: function matchRegExp(r) {
      return this.index < this.length && r.test(this.pattern[this.index]);
    }
  }, {
    key: "trackback",
    value: function trackback(start, result) {
      if (result) {
        return true;
      }this.index = start;
      return false;
    }
  }, {
    key: "readDisjunction",
    value: function readDisjunction() {
      return this.readAlternative() && (this.eat("|") ? this.readDisjunction() : true);
    }
  }, {
    key: "readAlternative",
    value: function readAlternative() {
      var savedIndex = this.index;
      while (this.readTerm()) {
        savedIndex = this.index;
      }
      this.index = savedIndex;
      return true;
    }
  }, {
    key: "readTerm",
    value: function readTerm() {
      if (!this.u) {
        return this.readExtendedTerm();
      }return this.readAssertion() || this.readQuantifiableAssertion() || this.readAtom() && (this.readQuantifier(), true);
    }
  }, {
    key: "readExtendedTerm",
    value: function readExtendedTerm() {
      return this.readQuantifiableAssertion() && (this.readQuantifier(), true) || this.readAssertion() || this.readAtomNoBrace() && (this.readQuantifier(), true) || this.readAtom();
    }
  }, {
    key: "readAssertion",
    value: function readAssertion() {
      return this.eat("^") || this.eat("$") || this.eatN(2, /^\\[bB]$/);
    }
  }, {
    key: "readQuantifiableAssertion",
    value: function readQuantifiableAssertion() {
      var start = this.index;
      return this.eatN(3, /^\(\?[=!]$/) && this.trackback(start, this.readDisjunction() && this.eat(")"));
    }
  }, {
    key: "readQuantifier",
    value: function readQuantifier() {
      return this.readQuantifierPrefix() && (this.eat("?"), true);
    }
  }, {
    key: "readQuantifierPrefix",
    value: function readQuantifierPrefix() {
      if (this.eat("*") || this.eat("+") || this.eat("?")) {
        return true;
      }if (this.eat("{") && this.readDecimalDigits()) {
        if (this.eat(",")) this.readDecimalDigits();
        return this.eat("}");
      }
      return false;
    }
  }, {
    key: "readDecimalDigits",
    value: function readDecimalDigits() {
      var start = this.index;
      while (this.eatRegExp(/^\d$/));
      return this.index > start;
    }
  }, {
    key: "readAtomNoBrace",
    value: function readAtomNoBrace() {
      var start = this.index;
      var startingParens = this.nCapturingParens;
      if (this.readPatternCharacterNoBrace() || this.eat(".")) {
        return true;
      }if (this.eat("\\")) {
        return this.trackback(start, this.readAtomEscape());
      }if (this.readCharacterClass()) {
        return true;
      }if (this.eat("(")) {
        if (!this.eatN(2, /^\?:$/)) ++this.nCapturingParens;
        if (this.readDisjunction() && this.eat(")")) {
          return true;
        }this.nCapturingParens = startingParens;
        this.index = start;
        return false;
      }
      return false;
    }
  }, {
    key: "readAtom",
    value: function readAtom() {
      return this.readAtomNoBrace() || this.eat("{") || this.eat("}");
    }
  }, {
    key: "readSyntaxCharacter",
    value: function readSyntaxCharacter() {
      return this.eatRegExp(/^[\^$\\.*+?()[\]{}|]$/);
    }
  }, {
    key: "readPatternCharacter",
    value: function readPatternCharacter() {
      return this.eatRegExp(/^[^\^$\\.*+?()[\]|]$/);
    }
  }, {
    key: "readPatternCharacterNoBrace",
    value: function readPatternCharacterNoBrace() {
      return this.eatRegExp(/^[^\^$\\.*+?()[\]{}|]$/);
    }
  }, {
    key: "readAtomEscape",
    value: function readAtomEscape() {
      return this.readDecimalEscape() || this.readCharacterEscape() || this.readCharacterClassEscape();
    }
  }, {
    key: "readCharacterEscape",
    value: function readCharacterEscape() {
      return this.readControlEscape() || this.eat("c") && this.readControlLetter() || this.readHexEscapeSequence() || this.readRegExpUnicodeEscapeSequence() || this.readIdentityEscape();
    }
  }, {
    key: "readControlEscape",
    value: function readControlEscape() {
      return this.eatRegExp(/^[fnrtv]$/);
    }
  }, {
    key: "readControlLetter",
    value: function readControlLetter() {
      return this.eatRegExp(/^[a-zA-Z]$/);
    }
  }, {
    key: "readHexEscapeSequence",
    value: function readHexEscapeSequence() {
      return this.eat("x") && this.readHexDigit() && this.readHexDigit();
    }
  }, {
    key: "readHexDigit",
    value: function readHexDigit() {
      return this.eatRegExp(/^[a-fA-F0-9]$/);
    }
  }, {
    key: "readRegExpUnicodeEscapeSequence",
    value: function readRegExpUnicodeEscapeSequence() {
      if (!this.eat("u")) {
        return false;
      }if (this.u) {
        if (this.eatN(4, /^D[abAB89][a-fA-F0-9]{2}$/)) {
          this.eatN(6, /^\\u[dD][c-fC-F0-9][a-fA-F0-9]{2}$/);
          return true;
        }
        return this.readHex4Digits() || this.eat("{") && this.readHexDigits() && this.eat("}");
      } else {
        return this.readHex4Digits();
      }
    }
  }, {
    key: "readHex4Digits",
    value: function readHex4Digits() {
      var k = 4;
      while (k > 0) {
        --k;
        if (!this.readHexDigit()) {
          return false;
        }
      }
      return true;
    }
  }, {
    key: "readHexDigits",
    value: function readHexDigits() {
      var start = this.index;
      while (this.readHexDigit());
      return this.index > start;
    }
  }, {
    key: "readIdentityEscape",
    value: function readIdentityEscape() {
      if (this.u) {
        return this.readSyntaxCharacter() || this.eat("/");
      } else {
        return this.eatRegExp(/^[^a-zA-Z0-9_]$/); // TODO: SourceCharacter but not UnicodeIDContinue
      }
    }
  }, {
    key: "readDecimalEscape",
    value: function readDecimalEscape() {
      if (this.eat("0")) {
        if (!this.matchRegExp(/^\d$/)) {
          return true;
        }--this.index;
        return false;
      }
      var start = this.index;
      while (this.eatRegExp(/^\d$/));
      return this.trackback(start, this.index > start && (this.u || +this.pattern.slice(start, this.index) <= this.nCapturingParens));
    }
  }, {
    key: "readCharacterClassEscape",
    value: function readCharacterClassEscape() {
      return this.eatRegExp(/^[dDsSwW]$/);
    }
  }, {
    key: "readCharacterClass",
    value: function readCharacterClass() {
      var start = this.index;
      return this.eat("[") && this.trackback(start, (this.eat("^"), true) && this.readClassRanges() && this.eat("]"));
    }
  }, {
    key: "readClassRanges",
    value: function readClassRanges() {
      var start = this.index;
      if (!this.readNonemptyClassRanges()) {
        this.index = start;
      }
      return true;
    }
  }, {
    key: "readNonemptyClassRanges",
    value: function readNonemptyClassRanges() {
      if (this.readClassAtom()) {
        if (this.match("]")) {
          return true;
        }if (this.eat("-")) {
          if (this.match("]")) {
            return true;
          }return this.readClassAtom() && this.readClassRanges();
        }
        return this.readNonemptyClassRangesNoDash();
      }
      return false;
    }
  }, {
    key: "readNonemptyClassRangesNoDash",
    value: function readNonemptyClassRangesNoDash() {
      if (this.eat("-")) {
        return true;
      }if (this.readClassAtomNoDash()) {
        if (this.match("]")) {
          return true;
        }if (this.eat("-")) {
          if (this.match("]")) {
            return true;
          }return this.readClassAtom() && this.readClassRanges();
        }
        return this.readNonemptyClassRangesNoDash();
      }
      return false;
    }
  }, {
    key: "readClassAtom",
    value: function readClassAtom() {
      return this.eat("-") || this.readClassAtomNoDash();
    }
  }, {
    key: "readClassAtomNoDash",
    value: function readClassAtomNoDash() {
      return this.eatRegExp(/^[^\\\]-]$/) || this.eat("\\") && this.readClassEscape();
    }
  }, {
    key: "readClassEscape",
    value: function readClassEscape() {
      return this.readDecimalEscape() || this.eat("b") || this.u && this.eat("-") || this.readCharacterEscape() || this.readCharacterClassEscape();
    }
  }], [{
    key: "test",
    value: function test(pattern) {
      var u = arguments[1] === undefined ? false : arguments[1];

      var acceptor = new PatternAcceptor(pattern, u);
      return acceptor.readDisjunction() && acceptor.index === acceptor.length;
    }
  }]);

  return PatternAcceptor;
})();

var SUPERCALL_ERROR = function SUPERCALL_ERROR(node) {
  return new _EarlyErrorState$EarlyError.EarlyError(node, "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
};
var SUPERPROPERTY_ERROR = function SUPERPROPERTY_ERROR(node) {
  return new _EarlyErrorState$EarlyError.EarlyError(node, "Member access on super must be in a method");
};

var EarlyErrorChecker = (function (_MonoidalReducer) {
  function EarlyErrorChecker() {
    _classCallCheck(this, EarlyErrorChecker);

    _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "constructor", this).call(this, _EarlyErrorState$EarlyError.EarlyErrorState);
  }

  _inherits(EarlyErrorChecker, _MonoidalReducer);

  _createClass(EarlyErrorChecker, [{
    key: "reduceAssignmentExpression",
    value: function reduceAssignmentExpression() {
      return _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceAssignmentExpression", this).apply(this, arguments).clearBoundNames();
      return _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceAssignmentExpression", this).apply(this, arguments).clearBoundNames();
    }
  }, {
    key: "reduceArrowExpression",
    value: function reduceArrowExpression(node, _ref2) {
      var params = _ref2.params;
      var body = _ref2.body;

      params.lexicallyDeclaredNames.forEachEntry(function (nodes, name) {
        if (nodes.length > 1) {
          nodes.slice(1).forEach(function (dupeNode) {
            params = params.addError(new _EarlyErrorState$EarlyError.EarlyError(dupeNode, "Duplicate binding " + JSON.stringify(name)));
          });
        }
      });
      if (node.body.type === "FunctionBody") {
        body.lexicallyDeclaredNames.forEachEntry(function (nodes, name) {
          if (params.lexicallyDeclaredNames.has(name)) {
            nodes.forEach(function (dupeNode) {
              body = body.addError(new _EarlyErrorState$EarlyError.EarlyError(dupeNode, "Duplicate binding " + JSON.stringify(name)));
            });
          }
        });
        if (isStrictFunctionBody(node.body)) {
          params = params.enforceStrictErrors();
          body = body.enforceStrictErrors();
        }
      }
      return _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceArrowExpression", this).call(this, node, { params: params, body: body }).observeVarBoundary();
    }
  }, {
    key: "reduceBindingIdentifier",
    value: function reduceBindingIdentifier(node) {
      var s = this.identity;
      var name = node.name;

      if (_isRestrictedWord$isStrictModeReservedWord.isRestrictedWord(name) || _isRestrictedWord$isStrictModeReservedWord.isStrictModeReservedWord(name)) {
        s = s.addStrictError(new _EarlyErrorState$EarlyError.EarlyError(node, "The identifier " + JSON.stringify(name) + " must not be in binding position in strict mode"));
      }
      return s.bindName(name, node);
    }
  }, {
    key: "reduceBindingPropertyIdentifier",
    value: function reduceBindingPropertyIdentifier(node) {
      var s = _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceBindingPropertyIdentifier", this).apply(this, arguments);
      var name = node.binding.name;

      if (_isRestrictedWord$isStrictModeReservedWord.isRestrictedWord(name) || _isRestrictedWord$isStrictModeReservedWord.isStrictModeReservedWord(name)) {
        s = s.addStrictError(new _EarlyErrorState$EarlyError.EarlyError(node, "The identifier " + JSON.stringify(name) + " must not be in binding position in strict mode"));
      }
      if (name === "yield") {
        s = s.observeYieldIdentifierExpression(node);
      }
      return s;
    }
  }, {
    key: "reduceBlock",
    value: function reduceBlock() {
      var s = _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceBlock", this).apply(this, arguments).functionDeclarationNamesAreLexical();
      s.lexicallyDeclaredNames.forEachEntry(function (nodes, name) {
        if (nodes.length > 1) {
          nodes.slice(1).forEach(function (dupeNode) {
            s = s.addError(new _EarlyErrorState$EarlyError.EarlyError(dupeNode, "Duplicate binding " + JSON.stringify(name)));
          });
        }
        if (s.varDeclaredNames.has(name)) {
          nodes.forEach(function (dupeNode) {
            s = s.addError(new _EarlyErrorState$EarlyError.EarlyError(dupeNode, "Duplicate binding " + JSON.stringify(name)));
          });
        }
      });
      return s.observeLexicalBoundary();
    }
  }, {
    key: "reduceBreakStatement",
    value: function reduceBreakStatement(node) {
      var s = _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceBreakStatement", this).apply(this, arguments);
      s = node.label == null ? s.addFreeBreakStatement(node) : s.addFreeLabeledBreakStatement(node);
      return s;
    }
  }, {
    key: "reduceCallExpression",
    value: function reduceCallExpression(node) {
      var s = _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceCallExpression", this).apply(this, arguments);
      if (node.callee.type === "Super") {
        s = s.observeSuperCallExpression(node);
      }
      return s;
    }
  }, {
    key: "reduceCatchClause",
    value: function reduceCatchClause(node, _ref3) {
      var binding = _ref3.binding;
      var body = _ref3.body;

      binding = binding.observeLexicalDeclaration();
      binding.lexicallyDeclaredNames.forEachEntry(function (nodes, name) {
        if (nodes.length > 1) {
          nodes.slice(1).forEach(function (dupeNode) {
            binding = binding.addError(new _EarlyErrorState$EarlyError.EarlyError(dupeNode, "Duplicate binding " + JSON.stringify(name)));
          });
        }
        if (body.previousLexicallyDeclaredNames.has(name)) {
          nodes.forEach(function (dupeNode) {
            binding = binding.addError(new _EarlyErrorState$EarlyError.EarlyError(dupeNode, "Duplicate binding " + JSON.stringify(name)));
          });
        }
        if (body.varDeclaredNames.has(name)) {
          body.varDeclaredNames.get(name).forEach(function (dupeNode) {
            if (body.forOfVarDeclaredNames.indexOf(dupeNode) >= 0) {
              binding = binding.addError(new _EarlyErrorState$EarlyError.EarlyError(dupeNode, "Duplicate binding " + JSON.stringify(name)));
            }
          });
        }
      });
      var s = _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceCatchClause", this).call(this, node, { binding: binding, body: body });
      s = s.observeLexicalBoundary();
      return s;
    }
  }, {
    key: "reduceClassDeclaration",
    value: function reduceClassDeclaration(node, _ref4) {
      var name = _ref4.name;
      var _super = _ref4["super"];
      var elements = _ref4.elements;

      var s = name;
      var sElements = this.fold(elements);
      sElements = sElements.enforceStrictErrors();
      if (node["super"] != null) {
        s = this.append(s, _super);
        sElements = sElements.clearSuperCallExpressionsInConstructorMethod();
      }
      sElements = sElements.enforceSuperCallExpressions(SUPERCALL_ERROR);
      sElements = sElements.enforceSuperPropertyExpressions(SUPERPROPERTY_ERROR);
      s = this.append(s, sElements);
      var ctors = node.elements.filter(function (e) {
        return !e.isStatic && e.method.type === "Method" && !e.method.isGenerator && e.method.name.type === "StaticPropertyName" && e.method.name.value === "constructor";
      });
      if (ctors.length > 1) {
        ctors.slice(1).forEach(function (ctor) {
          s = s.addError(new _EarlyErrorState$EarlyError.EarlyError(ctor, "Duplicate constructor method in class"));
        });
      }
      s = s.observeLexicalDeclaration();
      return s;
    }
  }, {
    key: "reduceClassElement",
    value: function reduceClassElement(node) {
      var s = _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceClassElement", this).apply(this, arguments);
      if (!node.isStatic && isSpecialMethod(node.method)) {
        s = s.addError(new _EarlyErrorState$EarlyError.EarlyError(node, "Constructors cannot be generators, getters or setters"));
      }
      if (node.isStatic && node.method.name.type === "StaticPropertyName" && node.method.name.value === "prototype") {
        s = s.addError(new _EarlyErrorState$EarlyError.EarlyError(node, "Static class methods cannot be named \"prototype\""));
      }
      return s;
    }
  }, {
    key: "reduceClassExpression",
    value: function reduceClassExpression(node, _ref5) {
      var name = _ref5.name;
      var _super = _ref5["super"];
      var elements = _ref5.elements;

      var s = node.name == null ? this.identity : name;
      var sElements = this.fold(elements);
      sElements = sElements.enforceStrictErrors();
      if (node["super"] != null) {
        s = this.append(s, _super);
        sElements = sElements.clearSuperCallExpressionsInConstructorMethod();
      }
      sElements = sElements.enforceSuperCallExpressions(SUPERCALL_ERROR);
      sElements = sElements.enforceSuperPropertyExpressions(SUPERPROPERTY_ERROR);
      s = this.append(s, sElements);
      var ctors = node.elements.filter(function (e) {
        return !e.isStatic && e.method.type === "Method" && !e.method.isGenerator && e.method.name.type === "StaticPropertyName" && e.method.name.value === "constructor";
      });
      if (ctors.length > 1) {
        ctors.slice(1).forEach(function (ctor) {
          s = s.addError(new _EarlyErrorState$EarlyError.EarlyError(ctor, "Duplicate constructor method in class"));
        });
      }
      return s;
    }
  }, {
    key: "reduceComputedMemberExpression",
    value: function reduceComputedMemberExpression(node) {
      var s = _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceComputedMemberExpression", this).apply(this, arguments);
      if (node.object.type === "Super") {
        s = s.observeSuperPropertyExpression(node);
      }
      return s;
    }
  }, {
    key: "reduceContinueStatement",
    value: function reduceContinueStatement(node) {
      var s = _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceContinueStatement", this).apply(this, arguments);
      s = node.label == null ? s.addFreeContinueStatement(node) : s.addFreeLabeledContinueStatement(node);
      return s;
    }
  }, {
    key: "reduceDoWhileStatement",
    value: function reduceDoWhileStatement(node) {
      var s = _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceDoWhileStatement", this).apply(this, arguments);
      if (isLabelledFunction(node.body)) {
        s = s.addError(new _EarlyErrorState$EarlyError.EarlyError(node.body, "The body of a do-while statement must not be a labeled function declaration"));
      }
      s = s.clearFreeContinueStatements().clearFreeBreakStatements();
      return s;
    }
  }, {
    key: "reduceExport",
    value: function reduceExport() {
      return _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceExport", this).apply(this, arguments).functionDeclarationNamesAreLexical().exportDeclaredNames();
    }
  }, {
    key: "reduceExportSpecifier",
    value: function reduceExportSpecifier(node) {
      return _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceExportSpecifier", this).apply(this, arguments).exportName(node.exportedName, node).exportBinding(node.name || node.exportedName, node);
    }
  }, {
    key: "reduceExportDefault",
    value: function reduceExportDefault(node) {
      var s = _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceExportDefault", this).apply(this, arguments).functionDeclarationNamesAreLexical();
      switch (node.body.type) {
        case "FunctionDeclaration":
        case "ClassDeclaration":
          if (node.body.name.name !== "*default*") {
            s = s.exportDeclaredNames();
          }
          break;
      }
      s = s.exportName("*default*", node);
      return s;
    }
  }, {
    key: "reduceFormalParameters",
    value: function reduceFormalParameters(node) {
      var s = _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceFormalParameters", this).apply(this, arguments).observeLexicalDeclaration();
      var isSimpleParameterList = node.rest == null && node.items.every(function (i) {
        return i.type === "BindingIdentifier";
      });
      var addError = s[isSimpleParameterList ? "addStrictError" : "addError"];
      s.lexicallyDeclaredNames.forEachEntry(function (nodes, name) {
        if (nodes.length > 1) {
          nodes.slice(1).forEach(function (dupeNode) {
            s = addError.call(s, new _EarlyErrorState$EarlyError.EarlyError(dupeNode, "Duplicate binding " + JSON.stringify(name)));
          });
        }
      });
      return s;
    }
  }, {
    key: "reduceForStatement",
    value: function reduceForStatement(node, _ref6) {
      var init = _ref6.init;
      var test = _ref6.test;
      var update = _ref6.update;
      var body = _ref6.body;

      if (init != null) {
        init.lexicallyDeclaredNames.forEachEntry(function (nodes, name) {
          if (body.varDeclaredNames.has(name)) {
            nodes.forEach(function (node) {
              init = init.addError(new _EarlyErrorState$EarlyError.EarlyError(node, "Duplicate binding " + JSON.stringify(name)));
            });
          }
        });
      }
      var s = _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceForStatement", this).call(this, node, { init: init, test: test, update: update, body: body });
      if (isLabelledFunction(node.body)) {
        s = s.addError(new _EarlyErrorState$EarlyError.EarlyError(node.body, "The body of a for statement must not be a labeled function declaration"));
      }
      s = s.clearFreeContinueStatements().clearFreeBreakStatements();
      return s.observeLexicalBoundary();
    }
  }, {
    key: "reduceForInStatement",
    value: function reduceForInStatement(node, _ref7) {
      var left = _ref7.left;
      var right = _ref7.right;
      var body = _ref7.body;

      left.lexicallyDeclaredNames.forEachEntry(function (nodes, name) {
        if (nodes.length > 1) {
          nodes.slice(1).forEach(function (dupeNode) {
            left = left.addError(new _EarlyErrorState$EarlyError.EarlyError(dupeNode, "Duplicate binding " + JSON.stringify(name)));
          });
        }
        if (body.varDeclaredNames.has(name)) {
          nodes.forEach(function (node) {
            left = left.addError(new _EarlyErrorState$EarlyError.EarlyError(node, "Duplicate binding " + JSON.stringify(name)));
          });
        }
      });
      var s = _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceForInStatement", this).call(this, node, { left: left, right: right, body: body });
      if (isLabelledFunction(node.body)) {
        s = s.addError(new _EarlyErrorState$EarlyError.EarlyError(node.body, "The body of a for-in statement must not be a labeled function declaration"));
      }
      s = s.clearFreeContinueStatements().clearFreeBreakStatements();
      return s.observeLexicalBoundary();
    }
  }, {
    key: "reduceForOfStatement",
    value: function reduceForOfStatement(node, _ref8) {
      var left = _ref8.left;
      var right = _ref8.right;
      var body = _ref8.body;

      left = left.recordForOfVars();
      left.lexicallyDeclaredNames.forEachEntry(function (nodes, name) {
        if (nodes.length > 1) {
          nodes.slice(1).forEach(function (dupeNode) {
            left = left.addError(new _EarlyErrorState$EarlyError.EarlyError(dupeNode, "Duplicate binding " + JSON.stringify(name)));
          });
        }
        if (body.varDeclaredNames.has(name)) {
          nodes.forEach(function (node) {
            left = left.addError(new _EarlyErrorState$EarlyError.EarlyError(node, "Duplicate binding " + JSON.stringify(name)));
          });
        }
      });
      var s = _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceForOfStatement", this).call(this, node, { left: left, right: right, body: body });
      if (isLabelledFunction(node.body)) {
        s = s.addError(new _EarlyErrorState$EarlyError.EarlyError(node.body, "The body of a for-of statement must not be a labeled function declaration"));
      }
      s = s.clearFreeContinueStatements().clearFreeBreakStatements();
      return s.observeLexicalBoundary();
    }
  }, {
    key: "reduceFunctionBody",
    value: function reduceFunctionBody(node) {
      var s = _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceFunctionBody", this).apply(this, arguments);
      s.lexicallyDeclaredNames.forEachEntry(function (nodes, name) {
        if (nodes.length > 1) {
          nodes.slice(1).forEach(function (dupeNode) {
            s = s.addError(new _EarlyErrorState$EarlyError.EarlyError(dupeNode, "Duplicate binding " + JSON.stringify(name)));
          });
        }
        if (s.varDeclaredNames.has(name)) {
          nodes.forEach(function (dupeNode) {
            s = s.addError(new _EarlyErrorState$EarlyError.EarlyError(dupeNode, "Duplicate binding " + JSON.stringify(name)));
          });
        }
      });
      s = s.enforceFreeContinueStatementErrors(function (node) {
        return new _EarlyErrorState$EarlyError.EarlyError(node, "Continue statement must be nested within an iteration statement");
      });
      s = s.enforceFreeLabeledContinueStatementErrors(function (node) {
        return new _EarlyErrorState$EarlyError.EarlyError(node, "Continue statement must be nested within an iteration statement with label " + JSON.stringify(node.label));
      });
      s = s.enforceFreeBreakStatementErrors(function (node) {
        return new _EarlyErrorState$EarlyError.EarlyError(node, "Break statement must be nested within an iteration statement or a switch statement");
      });
      s = s.enforceFreeLabeledBreakStatementErrors(function (node) {
        return new _EarlyErrorState$EarlyError.EarlyError(node, "Break statement must be nested within a statement with label " + JSON.stringify(node.label));
      });
      s = s.clearUsedLabelNames();
      if (isStrictFunctionBody(node)) {
        s = s.enforceStrictErrors();
      }
      return s;
    }
  }, {
    key: "reduceFunctionDeclaration",
    value: function reduceFunctionDeclaration(node, _ref9) {
      var name = _ref9.name;
      var params = _ref9.params;
      var body = _ref9.body;

      if (node.isGenerator) {
        if (params.lexicallyDeclaredNames.has("yield")) {
          params.lexicallyDeclaredNames.get("yield").forEach(function (yieldDecl) {
            return params = params.addError(new _EarlyErrorState$EarlyError.EarlyError(yieldDecl, "Generator functions must not have parameters named \"yield\""));
          });
        }
        body = body.enforceYieldIdentifierExpression(function (node) {
          return new _EarlyErrorState$EarlyError.EarlyError(node, "The identifier " + JSON.stringify(node.name) + " must not be in expression position in generator bodies");
        });
      }
      body.lexicallyDeclaredNames.forEachEntry(function (nodes, name) {
        if (params.lexicallyDeclaredNames.has(name)) {
          nodes.forEach(function (dupeNode) {
            body = body.addError(new _EarlyErrorState$EarlyError.EarlyError(dupeNode, "Duplicate binding " + JSON.stringify(name)));
          });
        }
      });
      body = body.enforceSuperCallExpressions(SUPERCALL_ERROR).enforceSuperPropertyExpressions(SUPERPROPERTY_ERROR);
      params = params.enforceSuperCallExpressions(SUPERCALL_ERROR).enforceSuperPropertyExpressions(SUPERPROPERTY_ERROR);
      body = body.clearNewTargetExpressions();
      if (isStrictFunctionBody(node.body)) {
        params = params.enforceStrictErrors();
        body = body.enforceStrictErrors();
      }
      return _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceFunctionDeclaration", this).call(this, node, { name: name, params: params, body: body }).observeFunctionDeclaration();
    }
  }, {
    key: "reduceFunctionExpression",
    value: function reduceFunctionExpression(node, _ref10) {
      var name = _ref10.name;
      var params = _ref10.params;
      var body = _ref10.body;

      if (node.isGenerator) {
        if (params.lexicallyDeclaredNames.has("yield")) {
          params.lexicallyDeclaredNames.get("yield").forEach(function (yieldDecl) {
            return params = params.addError(new _EarlyErrorState$EarlyError.EarlyError(yieldDecl, "Generator functions must not have parameters named \"yield\""));
          });
        }
        body = body.enforceYieldIdentifierExpression(function (node) {
          return new _EarlyErrorState$EarlyError.EarlyError(node, "The identifier " + JSON.stringify(node.name) + " must not be in expression position in generator bodies");
        });
      }
      body.lexicallyDeclaredNames.forEachEntry(function (nodes, name) {
        if (params.lexicallyDeclaredNames.has(name)) {
          nodes.forEach(function (dupeNode) {
            body = body.addError(new _EarlyErrorState$EarlyError.EarlyError(dupeNode, "Duplicate binding " + JSON.stringify(name)));
          });
        }
      });
      body = body.enforceSuperCallExpressions(SUPERCALL_ERROR).enforceSuperPropertyExpressions(SUPERPROPERTY_ERROR);
      params = params.enforceSuperCallExpressions(SUPERCALL_ERROR).enforceSuperPropertyExpressions(SUPERPROPERTY_ERROR);
      body = body.clearNewTargetExpressions();
      if (isStrictFunctionBody(node.body)) {
        params = params.enforceStrictErrors();
        body = body.enforceStrictErrors();
      }
      return _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceFunctionExpression", this).call(this, node, { name: name, params: params, body: body }).clearBoundNames().observeVarBoundary();
    }
  }, {
    key: "reduceGetter",
    value: function reduceGetter(node, _ref11) {
      var name = _ref11.name;
      var body = _ref11.body;

      body = body.enforceSuperCallExpressions(SUPERCALL_ERROR).clearSuperPropertyExpressions();
      body = body.clearNewTargetExpressions();
      if (isStrictFunctionBody(node.body)) {
        body = body.enforceStrictErrors();
      }
      return _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceGetter", this).call(this, node, { name: name, body: body }).observeVarBoundary();
    }
  }, {
    key: "reduceIdentifierExpression",
    value: function reduceIdentifierExpression(node) {
      var s = this.identity;
      var name = node.name;

      if (_isRestrictedWord$isStrictModeReservedWord.isStrictModeReservedWord(name)) {
        s = s.addStrictError(new _EarlyErrorState$EarlyError.EarlyError(node, "The identifier " + JSON.stringify(name) + " must not be in expression position in strict mode"));
      }
      if (name === "yield") {
        s = s.observeYieldIdentifierExpression(node);
      }
      return s;
    }
  }, {
    key: "reduceIfStatement",
    value: function reduceIfStatement(node) {
      var s = _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceIfStatement", this).apply(this, arguments);
      if (isLabelledFunction(node.consequent)) {
        s = s.addError(new _EarlyErrorState$EarlyError.EarlyError(node.consequent, "The consequent of an if statement must not be a labeled function declaration"));
      }
      if (node.alternate != null && isLabelledFunction(node.alternate)) {
        s = s.addError(new _EarlyErrorState$EarlyError.EarlyError(node.alternate, "The alternate of an if statement must not be a labeled function declaration"));
      }
      return s;
    }
  }, {
    key: "reduceImport",
    value: function reduceImport() {
      return _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceImport", this).apply(this, arguments).observeLexicalDeclaration();
    }
  }, {
    key: "reduceImportNamespace",
    value: function reduceImportNamespace() {
      return _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceImportNamespace", this).apply(this, arguments).observeLexicalDeclaration();
    }
  }, {
    key: "reduceLabeledStatement",
    value: function reduceLabeledStatement(node) {
      var s = _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceLabeledStatement", this).apply(this, arguments);
      var label = node.label;

      if (label === "yield") {
        s = s.addStrictError(new _EarlyErrorState$EarlyError.EarlyError(node, "The identifier " + JSON.stringify(label) + " must not be in label position in strict mode"));
      }
      if (s.usedLabelNames.indexOf(label) >= 0) {
        s = s.addError(new _EarlyErrorState$EarlyError.EarlyError(node, "Label " + JSON.stringify(label) + " has already been declared"));
      }
      if (node.body.type === "FunctionDeclaration") {
        s = s.addStrictError(new _EarlyErrorState$EarlyError.EarlyError(node, "Labeled FunctionDeclarations are disallowed in strict mode"));
      }
      s = isIterationStatement(node.body) ? s.observeIterationLabel(node.label) : s.observeNonIterationLabel(node.label);
      return s;
    }
  }, {
    key: "reduceLiteralRegExpExpression",
    value: function reduceLiteralRegExpExpression(node) {
      var s = this.identity;
      var pattern = node.pattern;
      var flags = node.flags;

      if (!PatternAcceptor.test(pattern, flags.indexOf("u") >= 0)) {
        s = s.addError(new _EarlyErrorState$EarlyError.EarlyError(node, "Invalid regular expression pattern"));
      }
      if (!/^[igmyu]*$/.test(flags) || containsDuplicates(flags)) {
        s = s.addError(new _EarlyErrorState$EarlyError.EarlyError(node, "Invalid regular expression flags"));
      }
      return s;
    }
  }, {
    key: "reduceMethod",
    value: function reduceMethod(node, _ref12) {
      var name = _ref12.name;
      var params = _ref12.params;
      var body = _ref12.body;

      params.lexicallyDeclaredNames.forEachEntry(function (nodes, name) {
        if (nodes.length > 1) {
          nodes.slice(1).forEach(function (dupeNode) {
            params = params.addError(new _EarlyErrorState$EarlyError.EarlyError(dupeNode, "Duplicate binding " + JSON.stringify(name)));
          });
        }
      });
      body.lexicallyDeclaredNames.forEachEntry(function (nodes, name) {
        if (params.lexicallyDeclaredNames.has(name)) {
          nodes.forEach(function (dupeNode) {
            body = body.addError(new _EarlyErrorState$EarlyError.EarlyError(dupeNode, "Duplicate binding " + JSON.stringify(name)));
          });
        }
      });
      if (node.isGenerator) {
        if (params.lexicallyDeclaredNames.has("yield")) {
          params.lexicallyDeclaredNames.get("yield").forEach(function (yieldDecl) {
            return params = params.addError(new _EarlyErrorState$EarlyError.EarlyError(yieldDecl, "Generator methods must not have parameters named \"yield\""));
          });
        }
        body = body.enforceYieldIdentifierExpression(function (node) {
          return new _EarlyErrorState$EarlyError.EarlyError(node, "The identifier " + JSON.stringify(node.name) + " must not be in expression position in generator method bodies");
        });
      }
      if (node.name.type === "StaticPropertyName" && node.name.value === "constructor") {
        body = body.observeConstructorMethod();
        params = params.observeConstructorMethod();
      } else {
        body = body.enforceSuperCallExpressions(SUPERCALL_ERROR);
        params = params.enforceSuperCallExpressions(SUPERCALL_ERROR);
      }
      body = body.clearSuperPropertyExpressions();
      params = params.clearSuperPropertyExpressions();
      body = body.clearNewTargetExpressions();
      if (isStrictFunctionBody(node.body)) {
        params = params.enforceStrictErrors();
        body = body.enforceStrictErrors();
      }
      return _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceMethod", this).call(this, node, { name: name, params: params, body: body }).observeVarBoundary();
    }
  }, {
    key: "reduceModule",
    value: function reduceModule() {
      var s = _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceModule", this).apply(this, arguments);
      s.lexicallyDeclaredNames.forEachEntry(function (nodes, name) {
        if (nodes.length > 1) {
          nodes.slice(1).forEach(function (dupeNode) {
            s = s.addError(new _EarlyErrorState$EarlyError.EarlyError(dupeNode, "Duplicate binding " + JSON.stringify(name)));
          });
        }
        if (s.varDeclaredNames.has(name)) {
          nodes.forEach(function (dupeNode) {
            s = s.addError(new _EarlyErrorState$EarlyError.EarlyError(dupeNode, "Duplicate binding " + JSON.stringify(name)));
          });
        }
      });
      s.exportedNames.forEachEntry(function (nodes, name) {
        if (nodes.length > 1) {
          nodes.slice(1).forEach(function (dupeNode) {
            s = s.addError(new _EarlyErrorState$EarlyError.EarlyError(dupeNode, "Duplicate export " + JSON.stringify(name)));
          });
        }
      });
      s.exportedBindings.forEachEntry(function (nodes, name) {
        if (name !== "*default*" && !s.lexicallyDeclaredNames.has(name) && !s.varDeclaredNames.has(name)) {
          nodes.forEach(function (undeclaredNode) {
            s = s.addError(new _EarlyErrorState$EarlyError.EarlyError(undeclaredNode, "Exported binding " + JSON.stringify(name) + " is not declared"));
          });
        }
      });
      s.newTargetExpressions.forEach(function (node) {
        s = s.addError(new _EarlyErrorState$EarlyError.EarlyError(node, "new.target must be within function (but not arrow expression) code"));
      });
      s = s.enforceFreeContinueStatementErrors(function (node) {
        return new _EarlyErrorState$EarlyError.EarlyError(node, "Continue statement must be nested within an iteration statement");
      });
      s = s.enforceFreeLabeledContinueStatementErrors(function (node) {
        return new _EarlyErrorState$EarlyError.EarlyError(node, "Continue statement must be nested within an iteration statement with label " + JSON.stringify(node.label));
      });
      s = s.enforceFreeBreakStatementErrors(function (node) {
        return new _EarlyErrorState$EarlyError.EarlyError(node, "Break statement must be nested within an iteration statement or a switch statement");
      });
      s = s.enforceFreeLabeledBreakStatementErrors(function (node) {
        return new _EarlyErrorState$EarlyError.EarlyError(node, "Break statement must be nested within a statement with label " + JSON.stringify(node.label));
      });
      s = s.enforceSuperCallExpressions(SUPERCALL_ERROR);
      s = s.enforceSuperPropertyExpressions(SUPERPROPERTY_ERROR);
      s = s.enforceStrictErrors();
      return s;
    }
  }, {
    key: "reduceNewTargetExpression",
    value: function reduceNewTargetExpression(node) {
      return this.identity.observeNewTargetExpression(node);
    }
  }, {
    key: "reduceObjectExpression",
    value: function reduceObjectExpression(node) {
      var s = _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceObjectExpression", this).apply(this, arguments);
      s = s.enforceSuperCallExpressionsInConstructorMethod(SUPERCALL_ERROR);
      var protos = node.properties.filter(function (p) {
        return p.type === "DataProperty" && p.name.type === "StaticPropertyName" && p.name.value === "__proto__";
      });
      protos.slice(1).forEach(function (node) {
        s = s.addError(new _EarlyErrorState$EarlyError.EarlyError(node, "Duplicate __proto__ property in object literal not allowed"));
      });
      return s;
    }
  }, {
    key: "reducePostfixExpression",
    value: function reducePostfixExpression(node) {
      var s = _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reducePostfixExpression", this).apply(this, arguments);
      switch (node.operator) {
        case "++":
        case "--":
          if (!isValidSimpleAssignmentTarget(node.operand)) {
            s = s.addError(new _EarlyErrorState$EarlyError.EarlyError(node, "Increment/decrement target must be an identifier or member expression"));
          }
          break;
      }
      return s;
    }
  }, {
    key: "reducePrefixExpression",
    value: function reducePrefixExpression(node) {
      var s = _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reducePrefixExpression", this).apply(this, arguments);
      switch (node.operator) {
        case "++":
        case "--":
          if (!isValidSimpleAssignmentTarget(node.operand)) {
            s = s.addError(new _EarlyErrorState$EarlyError.EarlyError(node, "Increment/decrement target must be an identifier or member expression"));
          }
          break;
        case "delete":
          if (node.operand.type === "IdentifierExpression") {
            s = s.addStrictError(new _EarlyErrorState$EarlyError.EarlyError(node, "Identifier expressions must not be deleted in strict mode"));
          }
          break;
      }
      return s;
    }
  }, {
    key: "reduceScript",
    value: function reduceScript() {
      var s = _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceScript", this).apply(this, arguments).enforceSuperCallExpressions(SUPERCALL_ERROR).enforceSuperPropertyExpressions(SUPERPROPERTY_ERROR);
      s.newTargetExpressions.forEach(function (node) {
        s = s.addError(new _EarlyErrorState$EarlyError.EarlyError(node, "new.target must be within function (but not arrow expression) code"));
      });
      return s;
    }
  }, {
    key: "reduceSetter",
    value: function reduceSetter(node, _ref13) {
      var name = _ref13.name;
      var param = _ref13.param;
      var body = _ref13.body;

      param = param.observeLexicalDeclaration();
      param.lexicallyDeclaredNames.forEachEntry(function (nodes, name) {
        if (nodes.length > 1) {
          nodes.slice(1).forEach(function (dupeNode) {
            param = param.addError(new _EarlyErrorState$EarlyError.EarlyError(dupeNode, "Duplicate binding " + JSON.stringify(name)));
          });
        }
      });
      body.lexicallyDeclaredNames.forEachEntry(function (nodes, name) {
        if (param.lexicallyDeclaredNames.has(name)) {
          nodes.forEach(function (dupeNode) {
            body = body.addError(new _EarlyErrorState$EarlyError.EarlyError(dupeNode, "Duplicate binding " + JSON.stringify(name)));
          });
        }
      });
      body = body.enforceSuperCallExpressions(SUPERCALL_ERROR).clearSuperPropertyExpressions();
      param = param.enforceSuperCallExpressions(SUPERCALL_ERROR).clearSuperPropertyExpressions();
      body = body.clearNewTargetExpressions();
      if (isStrictFunctionBody(node.body)) {
        param = param.enforceStrictErrors();
        body = body.enforceStrictErrors();
      }
      return _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceSetter", this).call(this, node, { name: name, param: param, body: body }).observeVarBoundary();
    }
  }, {
    key: "reduceStaticMemberExpression",
    value: function reduceStaticMemberExpression(node) {
      var s = _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceStaticMemberExpression", this).apply(this, arguments);
      if (node.object.type === "Super") {
        s = s.observeSuperPropertyExpression(node);
      }
      return s;
    }
  }, {
    key: "reduceSwitchStatement",
    value: function reduceSwitchStatement(node, _ref14) {
      var discriminant = _ref14.discriminant;
      var cases = _ref14.cases;

      var sCases = this.fold(cases).functionDeclarationNamesAreLexical();
      sCases.lexicallyDeclaredNames.forEachEntry(function (nodes, name) {
        if (nodes.length > 1) {
          nodes.slice(1).forEach(function (dupeNode) {
            sCases = sCases.addError(new _EarlyErrorState$EarlyError.EarlyError(dupeNode, "Duplicate binding " + JSON.stringify(name)));
          });
        }
        if (sCases.varDeclaredNames.has(name)) {
          nodes.forEach(function (dupeNode) {
            sCases = sCases.addError(new _EarlyErrorState$EarlyError.EarlyError(dupeNode, "Duplicate binding " + JSON.stringify(name)));
          });
        }
      });
      sCases = sCases.observeLexicalBoundary();
      var s = this.append(discriminant, sCases);
      s = s.clearFreeBreakStatements();
      return s;
    }
  }, {
    key: "reduceSwitchStatementWithDefault",
    value: function reduceSwitchStatementWithDefault(node, _ref15) {
      var discriminant = _ref15.discriminant;
      var preDefaultCases = _ref15.preDefaultCases;
      var defaultCase = _ref15.defaultCase;
      var postDefaultCases = _ref15.postDefaultCases;

      var sCases = this.append(defaultCase, this.append(this.fold(preDefaultCases), this.fold(postDefaultCases))).functionDeclarationNamesAreLexical();
      sCases.lexicallyDeclaredNames.forEachEntry(function (nodes, name) {
        if (nodes.length > 1) {
          nodes.slice(1).forEach(function (dupeNode) {
            sCases = sCases.addError(new _EarlyErrorState$EarlyError.EarlyError(dupeNode, "Duplicate binding " + JSON.stringify(name)));
          });
        }
        if (sCases.varDeclaredNames.has(name)) {
          nodes.forEach(function (dupeNode) {
            sCases = sCases.addError(new _EarlyErrorState$EarlyError.EarlyError(dupeNode, "Duplicate binding " + JSON.stringify(name)));
          });
        }
      });
      sCases = sCases.observeLexicalBoundary();
      var s = this.append(discriminant, sCases);
      s = s.clearFreeBreakStatements();
      return s;
    }
  }, {
    key: "reduceVariableDeclaration",
    value: function reduceVariableDeclaration(node) {
      var s = _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceVariableDeclaration", this).apply(this, arguments);
      switch (node.kind) {
        case "const":
        case "let":
          {
            s = s.observeLexicalDeclaration();
            s.lexicallyDeclaredNames.forEachEntry(function (nodes, name) {
              if (nodes.length > 1) {
                nodes.slice(1).forEach(function (dupeNode) {
                  s = s.addError(new _EarlyErrorState$EarlyError.EarlyError(dupeNode, "Duplicate binding " + JSON.stringify(name)));
                });
              }
              if (name === "let") {
                nodes.forEach(function (node) {
                  s = s.addError(new _EarlyErrorState$EarlyError.EarlyError(node, "Lexical declarations must not have a binding named \"let\""));
                });
              }
            });
            break;
          }
        case "var":
          s = s.observeVarDeclaration();
          break;
      }
      return s;
    }
  }, {
    key: "reduceVariableDeclarationStatement",
    value: function reduceVariableDeclarationStatement(node) {
      var s = _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceVariableDeclarationStatement", this).apply(this, arguments);
      switch (node.declaration.kind) {
        case "const":
          node.declaration.declarators.forEach(function (declarator) {
            if (declarator.init == null) {
              s = s.addError(new _EarlyErrorState$EarlyError.EarlyError(declarator, "Constant lexical declarations must have an initialiser"));
            }
          });
          break;
      }
      return s;
    }
  }, {
    key: "reduceWhileStatement",
    value: function reduceWhileStatement(node) {
      var s = _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceWhileStatement", this).apply(this, arguments);
      if (isLabelledFunction(node.body)) {
        s = s.addError(new _EarlyErrorState$EarlyError.EarlyError(node.body, "The body of a while statement must not be a labeled function declaration"));
      }
      s = s.clearFreeContinueStatements().clearFreeBreakStatements();
      return s;
    }
  }, {
    key: "reduceWithStatement",
    value: function reduceWithStatement(node) {
      var s = _get(Object.getPrototypeOf(EarlyErrorChecker.prototype), "reduceWithStatement", this).apply(this, arguments);
      if (isLabelledFunction(node.body)) {
        s = s.addError(new _EarlyErrorState$EarlyError.EarlyError(node.body, "The body of a with statement must not be a labeled function declaration"));
      }
      s = s.addStrictError(new _EarlyErrorState$EarlyError.EarlyError(node, "Strict mode code must not include a with statement"));
      return s;
    }
  }], [{
    key: "check",
    value: function check(node) {
      return _reduce$MonoidalReducer["default"](new EarlyErrorChecker(), node).errors;
    }
  }]);

  return EarlyErrorChecker;
})(_reduce$MonoidalReducer.MonoidalReducer);

exports.EarlyErrorChecker = EarlyErrorChecker;