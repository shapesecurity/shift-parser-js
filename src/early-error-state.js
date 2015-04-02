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

import * as objectAssign from "object-assign";
import * as MultiMap from "multimap";

// FIXME: remove this when collections/multi-map is working
MultiMap.prototype.addEach = function(otherMap) {
  otherMap.forEachEntry((v, k) => {
    this.set.apply(this, [k].concat(v));
  });
  return this;
}


const proto = {
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
  boundNames: new MultiMap,
  // BindingIdentifiers that were found to be in a lexical binding position
  lexicallyDeclaredNames: new MultiMap,
  // BindingIdentifiers that were the name of a FunctionDeclaration
  functionDeclarationNames: new MultiMap,
  // BindingIdentifiers that were found to be in a variable binding position
  varDeclaredNames: new MultiMap,
  // BindingIdentifiers that were found to be in a variable binding position
  forOfVarDeclaredNames: [],

  // Names that this module exports
  exportedNames: new MultiMap,
  // Locally declared names that are referenced in export declarations
  exportedBindings: new MultiMap,

  // IdentifierExpressions with name "yield"
  yieldIdentifierExpressions: [],

  // CallExpressions with Super callee
  superCallExpressions: [],
  // SuperCall expressions in the context of a Method named "constructor"
  superCallExpressionsInConstructorMethod: [],
  // MemberExpressions with Super object
  superPropertyExpressions: [],
};

let identity; // initialised below EarlyErrorState

export class EarlyErrorState {

  constructor() { }

  clone(additionalProperties) {
    return objectAssign(objectAssign(new EarlyErrorState, this), additionalProperties);
  }


  addFreeBreakStatement(s) {
    return this.clone({
      freeBreakStatements: this.freeBreakStatements.concat([s]),
    });
  }

  addFreeLabeledBreakStatement(s) {
    return this.clone({
      freeLabeledBreakStatements: this.freeLabeledBreakStatements.concat([s]),
    });
  }

  clearFreeBreakStatements() {
    return this.clone({
      freeBreakStatements: [],
    });
  }

  addFreeContinueStatement(s) {
    return this.clone({
      freeContinueStatements: this.freeContinueStatements.concat([s]),
    });
  }

  addFreeLabeledContinueStatement(s) {
    return this.clone({
      freeLabeledContinueStatements: this.freeLabeledContinueStatements.concat([s]),
    });
  }

  clearFreeContinueStatements() {
    return this.clone({
      freeContinueStatements: [],
    });
  }

  enforceFreeBreakStatementErrors(createError) {
    return this.clone({
      freeBreakStatements: [],
      errors: this.errors.concat(this.freeBreakStatements.map(createError)),
    });
  }

  enforceFreeLabeledBreakStatementErrors(createError) {
    return this.clone({
      freeLabeledBreakStatements: [],
      errors: this.errors.concat(this.freeLabeledBreakStatements.map(createError)),
    });
  }

  enforceFreeContinueStatementErrors(createError) {
    return this.clone({
      freeContinueStatements: [],
      errors: this.errors.concat(this.freeContinueStatements.map(createError)),
    });
  }

  enforceFreeLabeledContinueStatementErrors(createError) {
    return this.clone({
      freeLabeledContinueStatements: [],
      errors: this.errors.concat(this.freeLabeledContinueStatements.map(createError)),
    });
  }


  observeIterationLabel(label) {
    return this.clone({
      usedLabelNames: this.usedLabelNames.concat([label]),
      freeLabeledBreakStatements: this.freeLabeledBreakStatements.filter(s => s.label !== label),
      freeLabeledContinueStatements: this.freeLabeledContinueStatements.filter(s => s.label !== label),
    });
  }

  observeNonIterationLabel(label) {
    return this.clone({
      usedLabelNames: this.usedLabelNames.concat([label]),
      freeLabeledBreakStatements: this.freeLabeledBreakStatements.filter(s => s.label !== label),
    });
  }

  clearUsedLabelNames() {
    return this.clone({
      usedLabelNames: [],
    });
  }


  observeSuperCallExpression(node) {
    return this.clone({
      superCallExpressions: this.superCallExpressions.concat([node]),
    });
  }

  observeConstructorMethod() {
    return this.clone({
      superCallExpressions: [],
      superCallExpressionsInConstructorMethod: this.superCallExpressions,
    });
  }

  clearSuperCallExpressionsInConstructorMethod() {
    return this.clone({
      superCallExpressionsInConstructorMethod: [],
    });
  }

  enforceSuperCallExpressions(createError) {
    return this.clone({
      errors:
        this.errors.concat(
          this.superCallExpressions.map(createError),
          this.superCallExpressionsInConstructorMethod.map(createError)
        ),
      superCallExpressions: [],
      superCallExpressionsInConstructorMethod: [],
    });
  }

  enforceSuperCallExpressionsInConstructorMethod(createError) {
    return this.clone({
      errors: this.errors.concat(this.superCallExpressionsInConstructorMethod.map(createError)),
      superCallExpressionsInConstructorMethod: [],
    });
  }


  observeSuperPropertyExpression(node) {
    return this.clone({
      superPropertyExpressions: this.superPropertyExpressions.concat([node]),
    });
  }

  clearSuperPropertyExpressions() {
    return this.clone({
      superPropertyExpressions: [],
    });
  }

  enforceSuperPropertyExpressions(createError) {
    return this.clone({
      errors: this.errors.concat(this.superPropertyExpressions.map(createError)),
      superPropertyExpressions: [],
    });
  }


  observeNewTargetExpression(node) {
    return this.clone({
      newTargetExpressions: this.newTargetExpressions.concat([node]),
    });
  }

  clearNewTargetExpressions(node) {
    return this.clone({
      newTargetExpressions: [],
    });
  }


  bindName(name, node) {
    let newBoundNames = new MultiMap().addEach(this.boundNames);
    newBoundNames.set(name, node);
    return this.clone({
      boundNames: newBoundNames,
    });
  }

  clearBoundNames() {
    return this.clone({
      boundNames: new MultiMap,
    });
  }

  observeLexicalDeclaration() {
    return this.clone({
      boundNames: new MultiMap,
      lexicallyDeclaredNames: new MultiMap().addEach(this.lexicallyDeclaredNames).addEach(this.boundNames),
    });
  }

  observeLexicalBoundary() {
    return this.clone({
      lexicallyDeclaredNames: new MultiMap,
      functionDeclarationNames: new MultiMap,
      previousLexicallyDeclaredNames: this.lexicallyDeclaredNames,
    });
  }

  observeFunctionDeclaration() {
    return this.observeVarBoundary().clone({
      boundNames: new MultiMap,
      functionDeclarationNames: new MultiMap().addEach(this.functionDeclarationNames).addEach(this.boundNames),
    });
  }

  functionDeclarationNamesAreLexical() {
    return this.clone({
      lexicallyDeclaredNames: new MultiMap().addEach(this.lexicallyDeclaredNames).addEach(this.functionDeclarationNames),
      functionDeclarationNames: new MultiMap,
    });
  }

  observeVarDeclaration() {
    return this.clone({
      boundNames: new MultiMap,
      varDeclaredNames: new MultiMap().addEach(this.varDeclaredNames).addEach(this.boundNames),
    });
  }

  recordForOfVars() {
    let newForOfVarDeclaredNames = this.forOfVarDeclaredNames.slice();
    this.varDeclaredNames.forEach((bindingIdentifier, name) => {
      newForOfVarDeclaredNames.push(bindingIdentifier);
    });
    return this.clone({
      forOfVarDeclaredNames: newForOfVarDeclaredNames,
    });
  }

  observeVarBoundary() {
    return this.clone({
      lexicallyDeclaredNames: new MultiMap,
      functionDeclarationNames: new MultiMap,
      varDeclaredNames: new MultiMap,
      forOfVarDeclaredNames: [],
    });
  }


  exportName(name, node) {
    let newExportedNames = new MultiMap().addEach(this.exportedNames);
    newExportedNames.set(name, node);
    return this.clone({
      exportedNames: newExportedNames,
    });
  }

  exportDeclaredNames() {
    return this.clone({
      exportedNames: new MultiMap().addEach(this.exportedNames).addEach(this.lexicallyDeclaredNames).addEach(this.varDeclaredNames),
      exportedBindings: new MultiMap().addEach(this.exportedBindings).addEach(this.lexicallyDeclaredNames).addEach(this.varDeclaredNames),
    });
  }

  exportBinding(name, node) {
    let newExportedBindings = new MultiMap().addEach(this.exportedBindings);
    newExportedBindings.set(name, node);
    return this.clone({
      exportedBindings: newExportedBindings,
    });
  }


  observeYieldIdentifierExpression(node){
    return this.clone({
      yieldIdentifierExpressions: this.yieldIdentifierExpressions.concat([node]),
    });
  }

  enforceYieldIdentifierExpression(createError){
    return this.clone({
      errors: this.errors.concat(this.yieldIdentifierExpressions.map(createError)),
      yieldIdentifierExpressions: [],
    });
  }


  addError(e) {
    return this.clone({
      errors: this.errors.concat([e]),
    });
  }

  addStrictError(e) {
    return this.clone({
      strictErrors: this.strictErrors.concat([e]),
    });
  }

  enforceStrictErrors() {
    return this.clone({
      errors: this.errors.concat(this.strictErrors),
      strictErrors: [],
    });
  }


  // MONOID IMPLEMENTATION

  static empty() {
    return identity;
  }

  concat(s) {
    if (this === identity) return s;
    if (s === identity) return this;
    return this.clone({
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
      yieldIdentifierExpressions: this.yieldIdentifierExpressions.concat(s.yieldIdentifierExpressions),
      superCallExpressions: this.superCallExpressions.concat(s.superCallExpressions),
      superCallExpressionsInConstructorMethod: this.superCallExpressionsInConstructorMethod.concat(s.superCallExpressionsInConstructorMethod),
      superPropertyExpressions: this.superPropertyExpressions.concat(s.superPropertyExpressions),
    });
  }

}

identity = new EarlyErrorState;
objectAssign(identity, proto);

export class EarlyError extends Error {
  constructor(node, message) {
    super(message);
    this.node = node;
    this.message = message;
  }
}
