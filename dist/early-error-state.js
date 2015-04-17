// istanbul ignore next
"use strict";

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

require("es6-map/implement");

var _import = require("object-assign");

var objectAssign = _import;

var _import2 = require("multimap");

var MultiMap = _import2;

// FIXME: remove this when collections/multi-map is working
MultiMap.prototype.addEach = function (otherMap) {
  var _this2 = this;

  otherMap.forEachEntry(function (v, k) {
    _this2.set.apply(_this2, [k].concat(v));
  });
  return this;
};

var proto = {
  __proto__: null,

  errors: [],
  // errors that are only errors in strict mode code
  strictErrors: [],

  // Label values used in LabeledStatement nodes; cleared at function boundaries
  usedLabelNames: [],

  // BreakStatement nodes; cleared at iteration, switch, and function boundaries
  freeBreakStatements: [],
  // ContinueStatement nodes; cleared at
  freeContinueStatements: [],

  // labeled BreakStatement nodes; cleared at LabeledStatement with same Label and function boundaries
  freeLabeledBreakStatements: [],
  // labeled ContinueStatement nodes; cleared at labeled iteration statement with same Label and function boundaries
  freeLabeledContinueStatements: [],

  // NewTargetExpression nodes; cleared at function (besides arrow expression) boundaries
  newTargetExpressions: [],

  // BindingIdentifier nodes; cleared at containing declaration node
  boundNames: new MultiMap(),
  // BindingIdentifiers that were found to be in a lexical binding position
  lexicallyDeclaredNames: new MultiMap(),
  // BindingIdentifiers that were the name of a FunctionDeclaration
  functionDeclarationNames: new MultiMap(),
  // BindingIdentifiers that were found to be in a variable binding position
  varDeclaredNames: new MultiMap(),
  // BindingIdentifiers that were found to be in a variable binding position
  forOfVarDeclaredNames: [],

  // Names that this module exports
  exportedNames: new MultiMap(),
  // Locally declared names that are referenced in export declarations
  exportedBindings: new MultiMap(),

  // CallExpressions with Super callee
  superCallExpressions: [],
  // SuperCall expressions in the context of a Method named "constructor"
  superCallExpressionsInConstructorMethod: [],
  // MemberExpressions with Super object
  superPropertyExpressions: [] };

var identity = undefined; // initialised below EarlyErrorState

var EarlyErrorState = (function () {
  function EarlyErrorState() {
    _classCallCheck(this, EarlyErrorState);
  }

  _createClass(EarlyErrorState, [{
    key: "clone",
    value: function clone(additionalProperties) {
      return objectAssign(objectAssign(new EarlyErrorState(), this), additionalProperties);
    }
  }, {
    key: "addFreeBreakStatement",
    value: function addFreeBreakStatement(s) {
      return this.clone({
        freeBreakStatements: this.freeBreakStatements.concat([s]) });
    }
  }, {
    key: "addFreeLabeledBreakStatement",
    value: function addFreeLabeledBreakStatement(s) {
      return this.clone({
        freeLabeledBreakStatements: this.freeLabeledBreakStatements.concat([s]) });
    }
  }, {
    key: "clearFreeBreakStatements",
    value: function clearFreeBreakStatements() {
      return this.clone({
        freeBreakStatements: [] });
    }
  }, {
    key: "addFreeContinueStatement",
    value: function addFreeContinueStatement(s) {
      return this.clone({
        freeContinueStatements: this.freeContinueStatements.concat([s]) });
    }
  }, {
    key: "addFreeLabeledContinueStatement",
    value: function addFreeLabeledContinueStatement(s) {
      return this.clone({
        freeLabeledContinueStatements: this.freeLabeledContinueStatements.concat([s]) });
    }
  }, {
    key: "clearFreeContinueStatements",
    value: function clearFreeContinueStatements() {
      return this.clone({
        freeContinueStatements: [] });
    }
  }, {
    key: "enforceFreeBreakStatementErrors",
    value: function enforceFreeBreakStatementErrors(createError) {
      return this.clone({
        freeBreakStatements: [],
        errors: this.errors.concat(this.freeBreakStatements.map(createError)) });
    }
  }, {
    key: "enforceFreeLabeledBreakStatementErrors",
    value: function enforceFreeLabeledBreakStatementErrors(createError) {
      return this.clone({
        freeLabeledBreakStatements: [],
        errors: this.errors.concat(this.freeLabeledBreakStatements.map(createError)) });
    }
  }, {
    key: "enforceFreeContinueStatementErrors",
    value: function enforceFreeContinueStatementErrors(createError) {
      return this.clone({
        freeContinueStatements: [],
        errors: this.errors.concat(this.freeContinueStatements.map(createError)) });
    }
  }, {
    key: "enforceFreeLabeledContinueStatementErrors",
    value: function enforceFreeLabeledContinueStatementErrors(createError) {
      return this.clone({
        freeLabeledContinueStatements: [],
        errors: this.errors.concat(this.freeLabeledContinueStatements.map(createError)) });
    }
  }, {
    key: "observeIterationLabel",
    value: function observeIterationLabel(label) {
      return this.clone({
        usedLabelNames: this.usedLabelNames.concat([label]),
        freeLabeledBreakStatements: this.freeLabeledBreakStatements.filter(function (s) {
          return s.label !== label;
        }),
        freeLabeledContinueStatements: this.freeLabeledContinueStatements.filter(function (s) {
          return s.label !== label;
        }) });
    }
  }, {
    key: "observeNonIterationLabel",
    value: function observeNonIterationLabel(label) {
      return this.clone({
        usedLabelNames: this.usedLabelNames.concat([label]),
        freeLabeledBreakStatements: this.freeLabeledBreakStatements.filter(function (s) {
          return s.label !== label;
        }) });
    }
  }, {
    key: "clearUsedLabelNames",
    value: function clearUsedLabelNames() {
      return this.clone({
        usedLabelNames: [] });
    }
  }, {
    key: "observeSuperCallExpression",
    value: function observeSuperCallExpression(node) {
      return this.clone({
        superCallExpressions: this.superCallExpressions.concat([node]) });
    }
  }, {
    key: "observeConstructorMethod",
    value: function observeConstructorMethod() {
      return this.clone({
        superCallExpressions: [],
        superCallExpressionsInConstructorMethod: this.superCallExpressions });
    }
  }, {
    key: "clearSuperCallExpressionsInConstructorMethod",
    value: function clearSuperCallExpressionsInConstructorMethod() {
      return this.clone({
        superCallExpressionsInConstructorMethod: [] });
    }
  }, {
    key: "enforceSuperCallExpressions",
    value: function enforceSuperCallExpressions(createError) {
      return this.clone({
        errors: this.errors.concat(this.superCallExpressions.map(createError), this.superCallExpressionsInConstructorMethod.map(createError)),
        superCallExpressions: [],
        superCallExpressionsInConstructorMethod: [] });
    }
  }, {
    key: "enforceSuperCallExpressionsInConstructorMethod",
    value: function enforceSuperCallExpressionsInConstructorMethod(createError) {
      return this.clone({
        errors: this.errors.concat(this.superCallExpressionsInConstructorMethod.map(createError)),
        superCallExpressionsInConstructorMethod: [] });
    }
  }, {
    key: "observeSuperPropertyExpression",
    value: function observeSuperPropertyExpression(node) {
      return this.clone({
        superPropertyExpressions: this.superPropertyExpressions.concat([node]) });
    }
  }, {
    key: "clearSuperPropertyExpressions",
    value: function clearSuperPropertyExpressions() {
      return this.clone({
        superPropertyExpressions: [] });
    }
  }, {
    key: "enforceSuperPropertyExpressions",
    value: function enforceSuperPropertyExpressions(createError) {
      return this.clone({
        errors: this.errors.concat(this.superPropertyExpressions.map(createError)),
        superPropertyExpressions: [] });
    }
  }, {
    key: "observeNewTargetExpression",
    value: function observeNewTargetExpression(node) {
      return this.clone({
        newTargetExpressions: this.newTargetExpressions.concat([node]) });
    }
  }, {
    key: "clearNewTargetExpressions",
    value: function clearNewTargetExpressions() {
      return this.clone({
        newTargetExpressions: [] });
    }
  }, {
    key: "bindName",
    value: function bindName(name, node) {
      var newBoundNames = new MultiMap().addEach(this.boundNames);
      newBoundNames.set(name, node);
      return this.clone({
        boundNames: newBoundNames });
    }
  }, {
    key: "clearBoundNames",
    value: function clearBoundNames() {
      return this.clone({
        boundNames: new MultiMap() });
    }
  }, {
    key: "observeLexicalDeclaration",
    value: function observeLexicalDeclaration() {
      return this.clone({
        boundNames: new MultiMap(),
        lexicallyDeclaredNames: new MultiMap().addEach(this.lexicallyDeclaredNames).addEach(this.boundNames) });
    }
  }, {
    key: "observeLexicalBoundary",
    value: function observeLexicalBoundary() {
      return this.clone({
        lexicallyDeclaredNames: new MultiMap(),
        functionDeclarationNames: new MultiMap(),
        previousLexicallyDeclaredNames: this.lexicallyDeclaredNames });
    }
  }, {
    key: "enforceDuplicateLexicallyDeclaredNames",
    value: function enforceDuplicateLexicallyDeclaredNames(createError) {
      var s = this;
      this.lexicallyDeclaredNames.forEachEntry(function (nodes /*, bindingName*/) {
        if (nodes.length > 1) {
          nodes.slice(1).forEach(function (dupeNode) {
            s = s.addError(createError(dupeNode));
          });
        }
      });
      return s;
    }
  }, {
    key: "enforceConflictingLexicallyDeclaredNames",
    value: function enforceConflictingLexicallyDeclaredNames(otherNames, createError) {
      var s = this;
      this.lexicallyDeclaredNames.forEachEntry(function (nodes, bindingName) {
        if (otherNames.has(bindingName)) {
          nodes.forEach(function (conflictingNode) {
            s = s.addError(createError(conflictingNode));
          });
        }
      });
      return s;
    }
  }, {
    key: "observeFunctionDeclaration",
    value: function observeFunctionDeclaration() {
      return this.observeVarBoundary().clone({
        boundNames: new MultiMap(),
        functionDeclarationNames: new MultiMap().addEach(this.functionDeclarationNames).addEach(this.boundNames) });
    }
  }, {
    key: "functionDeclarationNamesAreLexical",
    value: function functionDeclarationNamesAreLexical() {
      return this.clone({
        lexicallyDeclaredNames: new MultiMap().addEach(this.lexicallyDeclaredNames).addEach(this.functionDeclarationNames),
        functionDeclarationNames: new MultiMap() });
    }
  }, {
    key: "observeVarDeclaration",
    value: function observeVarDeclaration() {
      return this.clone({
        boundNames: new MultiMap(),
        varDeclaredNames: new MultiMap().addEach(this.varDeclaredNames).addEach(this.boundNames) });
    }
  }, {
    key: "recordForOfVars",
    value: function recordForOfVars() {
      var newForOfVarDeclaredNames = this.forOfVarDeclaredNames.slice();
      this.varDeclaredNames.forEach(function (bindingIdentifier) {
        newForOfVarDeclaredNames.push(bindingIdentifier);
      });
      return this.clone({
        forOfVarDeclaredNames: newForOfVarDeclaredNames });
    }
  }, {
    key: "observeVarBoundary",
    value: function observeVarBoundary() {
      return this.clone({
        lexicallyDeclaredNames: new MultiMap(),
        functionDeclarationNames: new MultiMap(),
        varDeclaredNames: new MultiMap(),
        forOfVarDeclaredNames: [] });
    }
  }, {
    key: "exportName",
    value: function exportName(name, node) {
      var newExportedNames = new MultiMap().addEach(this.exportedNames);
      newExportedNames.set(name, node);
      return this.clone({
        exportedNames: newExportedNames });
    }
  }, {
    key: "exportDeclaredNames",
    value: function exportDeclaredNames() {
      return this.clone({
        exportedNames: new MultiMap().addEach(this.exportedNames).addEach(this.lexicallyDeclaredNames).addEach(this.varDeclaredNames),
        exportedBindings: new MultiMap().addEach(this.exportedBindings).addEach(this.lexicallyDeclaredNames).addEach(this.varDeclaredNames) });
    }
  }, {
    key: "exportBinding",
    value: function exportBinding(name, node) {
      var newExportedBindings = new MultiMap().addEach(this.exportedBindings);
      newExportedBindings.set(name, node);
      return this.clone({
        exportedBindings: newExportedBindings });
    }
  }, {
    key: "addError",
    value: function addError(e) {
      return this.clone({
        errors: this.errors.concat([e]) });
    }
  }, {
    key: "addStrictError",
    value: function addStrictError(e) {
      return this.clone({
        strictErrors: this.strictErrors.concat([e]) });
    }
  }, {
    key: "enforceStrictErrors",
    value: function enforceStrictErrors() {
      return this.clone({
        errors: this.errors.concat(this.strictErrors),
        strictErrors: [] });
    }
  }, {
    key: "concat",
    value: function concat(s) {
      if (this === identity) {
        return s;
      }if (s === identity) {
        return this;
      }return this.clone({
        errors: this.errors.concat(s.errors),
        strictErrors: this.strictErrors.concat(s.strictErrors),
        usedLabelNames: this.usedLabelNames.concat(s.usedLabelNames),
        freeBreakStatements: this.freeBreakStatements.concat(s.freeBreakStatements),
        freeContinueStatements: this.freeContinueStatements.concat(s.freeContinueStatements),
        freeLabeledBreakStatements: this.freeLabeledBreakStatements.concat(s.freeLabeledBreakStatements),
        freeLabeledContinueStatements: this.freeLabeledContinueStatements.concat(s.freeLabeledContinueStatements),
        newTargetExpressions: this.newTargetExpressions.concat(s.newTargetExpressions),
        boundNames: new MultiMap().addEach(this.boundNames).addEach(s.boundNames),
        lexicallyDeclaredNames: new MultiMap().addEach(this.lexicallyDeclaredNames).addEach(s.lexicallyDeclaredNames),
        functionDeclarationNames: new MultiMap().addEach(this.functionDeclarationNames).addEach(s.functionDeclarationNames),
        varDeclaredNames: new MultiMap().addEach(this.varDeclaredNames).addEach(s.varDeclaredNames),
        forOfVarDeclaredNames: this.forOfVarDeclaredNames.concat(s.forOfVarDeclaredNames),
        exportedNames: new MultiMap().addEach(this.exportedNames).addEach(s.exportedNames),
        exportedBindings: new MultiMap().addEach(this.exportedBindings).addEach(s.exportedBindings),
        superCallExpressions: this.superCallExpressions.concat(s.superCallExpressions),
        superCallExpressionsInConstructorMethod: this.superCallExpressionsInConstructorMethod.concat(s.superCallExpressionsInConstructorMethod),
        superPropertyExpressions: this.superPropertyExpressions.concat(s.superPropertyExpressions) });
    }
  }], [{
    key: "empty",

    // MONOID IMPLEMENTATION

    value: function empty() {
      return identity;
    }
  }]);

  return EarlyErrorState;
})();

exports.EarlyErrorState = EarlyErrorState;

identity = new EarlyErrorState();
objectAssign(identity, proto);

var EarlyError = (function (_Error) {
  function EarlyError(node, message) {
    _classCallCheck(this, EarlyError);

    var _this = new _Error(message);

    _this.__proto__ = EarlyError.prototype;

    _this.node = node;
    _this.message = message;
    return _this;
  }

  _inherits(EarlyError, _Error);

  return EarlyError;
})(Error);

exports.EarlyError = EarlyError;