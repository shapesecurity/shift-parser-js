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

import reduce, { MonoidalReducer } from 'shift-reducer';
import { isRestrictedWord, isStrictModeReservedWord } from './utils';
import { EarlyErrorState, EarlyError } from './early-error-state';

function isStrictFunctionBody({ directives }) {
  return directives.some(directive => directive.rawValue === 'use strict');
}

// function containsDuplicates(list) {
//   let uniqs = [];
//   for (let i = 0, l = list.length; i < l; ++i) {
//     let item = list[i];
//     if (uniqs.indexOf(item) >= 0) {
//       return true;
//     }
//     uniqs.push(item);
//   }
//   return false;
// }

function isLabelledFunction(node) {
  return node.type === 'LabeledStatement' &&
    (node.body.type === 'FunctionDeclaration' || isLabelledFunction(node.body));
}

function isIterationStatement(node) {
  switch (node.type) {
    case 'LabeledStatement':
      return isIterationStatement(node.body);
    case 'DoWhileStatement':
    case 'ForInStatement':
    case 'ForOfStatement':
    case 'ForStatement':
    case 'WhileStatement':
      return true;
  }
  return false;
}

function isSpecialMethod(methodDefinition) {
  if (methodDefinition.name.type !== 'StaticPropertyName' || methodDefinition.name.value !== 'constructor') {
    return false;
  }
  switch (methodDefinition.type) {
    case 'Getter':
    case 'Setter':
      return true;
    case 'Method':
      return methodDefinition.isGenerator;
  }
  /* istanbul ignore next */
  throw new Error('not reached');
}


function enforceDuplicateConstructorMethods(node, s) {
  let state = s;
  let ctors = node.elements.filter(e =>
    !e.isStatic &&
    e.method.type === 'Method' &&
    !e.method.isGenerator &&
    e.method.name.type === 'StaticPropertyName' &&
    e.method.name.value === 'constructor'
  );
  if (ctors.length > 1) {
    ctors.slice(1).forEach(ctor => {
      state = state.addError(new EarlyError(ctor, 'Duplicate constructor method in class'));
    });
  }
  return state;
}

const SUPERCALL_ERROR = node => new EarlyError(node, 'Calls to super must be in the "constructor"' +
  'method of a class expression or class declaration that has a superclass');
const SUPERPROPERTY_ERROR = node => new EarlyError(node, 'Member access on super must be in a method');
const DUPLICATE_BINDING = node => new EarlyError(node, `Duplicate binding ${JSON.stringify(node.name)}`);
const FREE_CONTINUE = node => new EarlyError(node, 'Continue statement must be nested within an iteration statement');
const UNBOUND_CONTINUE = node => new EarlyError(node, `Continue statement must be nested within an 
  iteration statement with label ${JSON.stringify(node.label)}`);
const FREE_BREAK = node => new EarlyError(node, `Break statement must be nested within an iteration
  statement or a switch statement`);
const UNBOUND_BREAK = node => new EarlyError(node, `Break statement must be nested within a statement' +
  'with label ${JSON.stringify(node.label)}`);

export class EarlyErrorChecker extends MonoidalReducer {
  constructor() {
    super(EarlyErrorState);
  }

  reduceAssignmentExpression() {
    return super.reduceAssignmentExpression(...arguments).clearBoundNames();
  }

  reduceAssignmentTargetIdentifier(node) {
    let s = this.identity;
    if (isRestrictedWord(node.name) || isStrictModeReservedWord(node.name)) {
      s = s.addStrictError(new EarlyError(node, `The identifier ${JSON.stringify(node.name)}
        must not be in binding position in strict mode`));
    }
    return s;
  }

  reduceArrowExpression(node, { params, body }) {
    let p = params,
        b = body;
    let isSimpleParameterList = node.p.rest == null &&
      node.p.items.every(i => i.type === 'BindingIdentifier');
    p = p.enforceDuplicateLexicallyDeclaredNames(DUPLICATE_BINDING);
    if (node.b.type === 'FunctionBody') {
      b = b.enforceConflictingLexicallyDeclaredNames(p.lexicallyDeclaredNames, DUPLICATE_BINDING);
      if (isStrictFunctionBody(node.b)) {
        p = p.enforceStrictErrors();
        b = b.enforceStrictErrors();
      }
    }
    b.yieldExpressions.forEach(function (n) {
      b = b.addError(new EarlyError(n, 'Concise arrow bodies must not contain yield expressions'));
    });
    p.yieldExpressions.forEach(function (n) {
      p = p.addError(new EarlyError(n, 'Arrow parameters must not contain yield expressions'));
    });
    let s = super.reduceArrowExpression(node, { p, b });
    if (!isSimpleParameterList && node.b.type === 'FunctionBody' && isStrictFunctionBody(node.b)) {
      s = s.addError(new EarlyError(node, `Functions with non-simple parameter lists may not
        contain a "use strict" directive`));
    }
    s = s.clearYieldExpressions();
    s = s.observeVarBoundary();
    return s;
  }

  reduceBindingIdentifier(node) {
    let s = this.identity;
    if (isRestrictedWord(node.name) || isStrictModeReservedWord(node.name)) {
      s = s.addStrictError(new EarlyError(node, `The identifier ${JSON.stringify(node.name)} must not
        be in binding position in strict mode`));
    }
    s = s.bindName(node.name, node);
    return s;
  }

  reduceBlock() {
    let s = super.reduceBlock(...arguments);
    s = s.functionDeclarationNamesAreLexical();
    s = s.enforceDuplicateLexicallyDeclaredNames(DUPLICATE_BINDING);
    s = s.enforceConflictingLexicallyDeclaredNames(s.varDeclaredNames, DUPLICATE_BINDING);
    s = s.observeLexicalBoundary();
    return s;
  }

  reduceBreakStatement(node) {
    let s = super.reduceBreakStatement(...arguments);
    s = node.label == null
      ? s.addFreeBreakStatement(node)
      : s.addFreeLabeledBreakStatement(node);
    return s;
  }

  reduceCallExpression(node) {
    let s = super.reduceCallExpression(...arguments);
    if (node.callee.type === 'Super') {
      s = s.observeSuperCallExpression(node);
    }
    return s;
  }

  reduceCatchClause(node, { binding, body }) {
    let b = binding;
    b = b.observeLexicalDeclaration();
    b = b.enforceDuplicateLexicallyDeclaredNames(DUPLICATE_BINDING);
    b = b.enforceConflictingLexicallyDeclaredNames(body.previousLexicallyDeclaredNames, DUPLICATE_BINDING);
    b.lexicallyDeclaredNames.forEachEntry((nodes, bindingName) => {
      if (body.varDeclaredNames.has(bindingName)) {
        body.varDeclaredNames.get(bindingName).forEach(conflictingNode => {
          if (body.forOfVarDeclaredNames.indexOf(conflictingNode) >= 0) {
            b = b.addError(DUPLICATE_BINDING(conflictingNode));
          }
        });
      }
    });
    let s = super.reduceCatchClause(node, { b, body });
    s = s.observeLexicalBoundary();
    return s;
  }

  reduceClassDeclaration(node, { name, super: _super, elements }) {
    let s = name,
        _s = _super;
    let sElements = this.fold(elements);
    sElements = sElements.enforceStrictErrors();
    if (node.super != null) {
      _s = _s.enforceStrictErrors();
      s = this.append(s, _s);
      sElements = sElements.clearSuperCallExpressionsInConstructorMethod();
    }
    sElements = sElements.enforceSuperCallExpressions(SUPERCALL_ERROR);
    sElements = sElements.enforceSuperPropertyExpressions(SUPERPROPERTY_ERROR);
    s = this.append(s, sElements);
    s = enforceDuplicateConstructorMethods(node, s);
    s = s.observeLexicalDeclaration();
    return s;
  }

  reduceClassElement(node) {
    let s = super.reduceClassElement(...arguments);
    if (!node.isStatic && isSpecialMethod(node.method)) {
      s = s.addError(new EarlyError(node, 'Constructors cannot be generators, getters or setters'));
    }
    if (node.isStatic && node.method.name.type === 'StaticPropertyName' && node.method.name.value === 'prototype') {
      s = s.addError(new EarlyError(node, 'Static class methods cannot be named "prototype"'));
    }
    return s;
  }

  reduceClassExpression(node, { name, super: _super, elements }) {
    let _s = _super;
    let s = node.name == null ? this.identity : name;
    let sElements = this.fold(elements);
    sElements = sElements.enforceStrictErrors();
    if (node.super != null) {
      _s = _super.enforceStrictErrors();
      s = this.append(s, _s);
      sElements = sElements.clearSuperCallExpressionsInConstructorMethod();
    }
    sElements = sElements.enforceSuperCallExpressions(SUPERCALL_ERROR);
    sElements = sElements.enforceSuperPropertyExpressions(SUPERPROPERTY_ERROR);
    s = this.append(s, sElements);
    s = enforceDuplicateConstructorMethods(node, s);
    s = s.clearBoundNames();
    return s;
  }

  reduceCompoundAssignmentExpression() {
    return super.reduceCompoundAssignmentExpression(...arguments).clearBoundNames();
  }

  reduceComputedMemberExpression(node) {
    let s = super.reduceComputedMemberExpression(...arguments);
    if (node.object.type === 'Super') {
      s = s.observeSuperPropertyExpression(node);
    }
    return s;
  }

  reduceContinueStatement(node) {
    let s = super.reduceContinueStatement(...arguments);
    s = node.label == null
      ? s.addFreeContinueStatement(node)
      : s.addFreeLabeledContinueStatement(node);
    return s;
  }

  reduceDoWhileStatement(node) {
    let s = super.reduceDoWhileStatement(...arguments);
    if (isLabelledFunction(node.body)) {
      s = s.addError(new EarlyError(node.body, `The body of a do-while statemen
        t must not be a labeled function declaration`));
    }
    s = s.clearFreeContinueStatements();
    s = s.clearFreeBreakStatements();
    return s;
  }

  reduceExport() {
    let s = super.reduceExport(...arguments);
    s = s.functionDeclarationNamesAreLexical();
    s = s.exportDeclaredNames();
    return s;
  }

  reduceExportFrom() {
    let s = super.reduceExportFrom(...arguments);
    s = s.clearExportedBindings();
    return s;
  }

  reduceExportFromSpecifier(node) {
    let s = super.reduceExportFromSpecifier(...arguments);
    s = s.exportName(node.exportedName || node.name, node);
    s = s.exportBinding(node.name, node);
    return s;
  }

  reduceExportLocalSpecifier(node) {
    let s = super.reduceExportLocalSpecifier(...arguments);
    s = s.exportName(node.exportedName || node.name.name, node);
    s = s.exportBinding(node.name.name, node);
    return s;
  }

  reduceExportDefault(node) {
    let s = super.reduceExportDefault(...arguments);
    s = s.functionDeclarationNamesAreLexical();
    s = s.exportName('default', node);
    return s;
  }

  reduceFormalParameters() {
    let s = super.reduceFormalParameters(...arguments);
    s = s.observeLexicalDeclaration();
    return s;
  }

  reduceForStatement(node, { init, test, update, body }) {
    let i = init;
    if (i != null) {
      i = i.enforceDuplicateLexicallyDeclaredNames(DUPLICATE_BINDING);
      i = init.enforceConflictingLexicallyDeclaredNames(body.varDeclaredNames, DUPLICATE_BINDING);
    }
    let s = super.reduceForStatement(node, { i, test, update, body });
    if (node.i != null && node.i.type === 'VariableDeclaration' && node.i.kind === 'const') {
      node.init.declarators.forEach(declarator => {
        if (declarator.init == null) {
          s = s.addError(new EarlyError(declarator, 'Constant lexical declarations must have an initialiser'));
        }
      });
    }
    if (isLabelledFunction(node.body)) {
      s = s.addError(new EarlyError(node.body, `The body of a for statement must not
        be a labeled function declaration`));
    }
    s = s.clearFreeContinueStatements();
    s = s.clearFreeBreakStatements();
    s = s.observeLexicalBoundary();
    return s;
  }

  reduceForInStatement(node, { left, right, body }) {
    let l = left;
    l = l.enforceDuplicateLexicallyDeclaredNames(DUPLICATE_BINDING);
    l = l.enforceConflictingLexicallyDeclaredNames(body.varDeclaredNames, DUPLICATE_BINDING);
    let s = super.reduceForInStatement(node, { l, right, body });
    if (isLabelledFunction(node.body)) {
      s = s.addError(new EarlyError(node.body, `The body of a for-in statement must not
        be a labeled function declaration`));
    }
    s = s.clearFreeContinueStatements();
    s = s.clearFreeBreakStatements();
    s = s.observeLexicalBoundary();
    return s;
  }

  reduceForOfStatement(node, { left, right, body }) {
    let l = left;
    l = l.recordForOfVars();
    l = l.enforceDuplicateLexicallyDeclaredNames(DUPLICATE_BINDING);
    l = l.enforceConflictingLexicallyDeclaredNames(body.varDeclaredNames, DUPLICATE_BINDING);
    let s = super.reduceForOfStatement(node, { l, right, body });
    if (isLabelledFunction(node.body)) {
      s = s.addError(new EarlyError(node.body, `The body of a for-of statement must
        not be a labeled function declaration`));
    }
    s = s.clearFreeContinueStatements();
    s = s.clearFreeBreakStatements();
    s = s.observeLexicalBoundary();
    return s;
  }

  reduceFunctionBody(node) {
    let s = super.reduceFunctionBody(...arguments);
    s = s.enforceDuplicateLexicallyDeclaredNames(DUPLICATE_BINDING);
    s = s.enforceConflictingLexicallyDeclaredNames(s.varDeclaredNames, DUPLICATE_BINDING);
    s = s.enforceFreeContinueStatementErrors(FREE_CONTINUE);
    s = s.enforceFreeLabeledContinueStatementErrors(UNBOUND_CONTINUE);
    s = s.enforceFreeBreakStatementErrors(FREE_BREAK);
    s = s.enforceFreeLabeledBreakStatementErrors(UNBOUND_BREAK);
    s = s.clearUsedLabelNames();
    s = s.clearYieldExpressions();
    if (isStrictFunctionBody(node)) {
      s = s.enforceStrictErrors();
    }
    return s;
  }

  reduceFunctionDeclaration(node, { name, params, body }) {
    let p = params,
        b = body;
    let isSimpleParameterList = node.p.rest == null &&
      node.p.items.every(i => i.type === 'BindingIdentifier');
    let addError = !isSimpleParameterList || node.isGenerator ? 'addError' : 'addStrictError';
    p.lexicallyDeclaredNames.forEachEntry((nodes/* , bindingName*/) => {
      if (nodes.length > 1) {
        nodes.slice(1).forEach(dupeNode => {
          p = p[addError](DUPLICATE_BINDING(dupeNode));
        });
      }
    });
    b = b.enforceConflictingLexicallyDeclaredNames(p.lexicallyDeclaredNames, DUPLICATE_BINDING);
    b = b.enforceSuperCallExpressions(SUPERCALL_ERROR);
    b = b.enforceSuperPropertyExpressions(SUPERPROPERTY_ERROR);
    p = p.enforceSuperCallExpressions(SUPERCALL_ERROR);
    p = p.enforceSuperPropertyExpressions(SUPERPROPERTY_ERROR);
    if (node.isGenerator) {
      p.yieldExpressions.forEach(function (n) {
        p = p.addError(new EarlyError(n, 'Generator parameters must not contain yield expressions'));
      });
    }
    p = p.clearNewTargetExpressions();
    b = b.clearNewTargetExpressions();
    if (isStrictFunctionBody(node.body)) {
      p = p.enforceStrictErrors();
      b = b.enforceStrictErrors();
    }
    let s = super.reduceFunctionDeclaration(node, { name, p, b });
    if (!isSimpleParameterList && isStrictFunctionBody(node.b)) {
      s = s.addError(new EarlyError(node, `Functions with non-simple parameter lists
        may not contain a "use strict" directive`));
    }
    s = s.clearYieldExpressions();
    s = s.observeFunctionDeclaration();
    return s;
  }

  reduceFunctionExpression(node, { name, params, body }) {
    let p = params,
        b = body;
    let isSimpleParameterList = node.p.rest == null && node.p.items.every(i => i.type === 'BindingIdentifier');
    let addError = !isSimpleParameterList || node.isGenerator ? 'addError' : 'addStrictError';
    p.lexicallyDeclaredNames.forEachEntry((nodes, bindingName) => {
      if (nodes.length > 1) {
        nodes.slice(1).forEach(dupeNode => {
          p = p[addError](new EarlyError(dupeNode, `Duplicate binding ${JSON.stringify(bindingName)}`));
        });
      }
    });
    b = b.enforceConflictingLexicallyDeclaredNames(params.lexicallyDeclaredNames, DUPLICATE_BINDING);
    b = b.enforceSuperCallExpressions(SUPERCALL_ERROR);
    b = b.enforceSuperPropertyExpressions(SUPERPROPERTY_ERROR);
    p = p.enforceSuperCallExpressions(SUPERCALL_ERROR);
    p = p.enforceSuperPropertyExpressions(SUPERPROPERTY_ERROR);
    if (node.isGenerator) {
      p.yieldExpressions.forEach(function (n) {
        p = params.addError(new EarlyError(n, 'Generator parameters must not contain yield expressions'));
      });
    }
    p = p.clearNewTargetExpressions();
    b = b.clearNewTargetExpressions();
    if (isStrictFunctionBody(node.b)) {
      p = p.enforceStrictErrors();
      b = b.enforceStrictErrors();
    }
    let s = super.reduceFunctionExpression(node, { name, p, b });
    if (!isSimpleParameterList && isStrictFunctionBody(node.b)) {
      s = s.addError(new EarlyError(node, `Functions with non-simple parameter lists
        may not contain a "use strict" directive`));
    }
    s = s.clearBoundNames();
    s = s.clearYieldExpressions();
    s = s.observeVarBoundary();
    return s;
  }

  reduceGetter(node, { name, body }) {
    let b = body;
    b = b.enforceSuperCallExpressions(SUPERCALL_ERROR);
    b = b.clearSuperPropertyExpressions();
    b = b.clearNewTargetExpressions();
    if (isStrictFunctionBody(node.b)) {
      b = b.enforceStrictErrors();
    }
    let s = super.reduceGetter(node, { name, b });
    s = s.observeVarBoundary();
    return s;
  }

  reduceIdentifierExpression(node) {
    let s = this.identity;
    if (isStrictModeReservedWord(node.name)) {
      s = s.addStrictError(new EarlyError(node, `The identifier ${JSON.stringify(node.name)} must not
        be in expression position in strict mode`));
    }
    return s;
  }

  reduceIfStatement(node, { test, consequent, alternate }) {
    let alt = alternate,
        consq = consequent;
    if (isLabelledFunction(node.consequent)) {
      consq = consq.addError(new EarlyError(node.consequent, `The consequent of an if statement must
        not be a labeled function declaration`));
    }
    if (node.alternate != null && isLabelledFunction(node.alternate)) {
      alt = alt.addError(new EarlyError(node.alternate, `The alternate of an if statement
        must not be a labeled function declaration`));
    }
    if (node.consequent.type === 'FunctionDeclaration') {
      consq = consq.addStrictError(new EarlyError(node.consequent, `FunctionDeclarations in IfStatements
        are disallowed in strict mode`));
      consq = consq.observeLexicalBoundary();
    }
    if (node.alternate != null && node.alternate.type === 'FunctionDeclaration') {
      alt = alt.addStrictError(new EarlyError(node.alternate, `FunctionDeclarations in IfStatements 
        are disallowed in strict mode`));
      alt = alt.observeLexicalBoundary();
    }
    return super.reduceIfStatement(node, { test, consq, alt });
  }

  reduceImport() {
    let s = super.reduceImport(...arguments);
    s = s.observeLexicalDeclaration();
    return s;
  }

  reduceImportNamespace() {
    let s = super.reduceImportNamespace(...arguments);
    s = s.observeLexicalDeclaration();
    return s;
  }

  reduceLabeledStatement(node) {
    let s = super.reduceLabeledStatement(...arguments);
    if (node.label === 'yield') {
      s = s.addStrictError(new EarlyError(node, `The identifier
        ${JSON.stringify(node.label)} must not be in label position in strict mode`));
    }
    if (s.usedLabelNames.indexOf(node.label) >= 0) {
      s = s.addError(new EarlyError(node, `Label ${JSON.stringify(node.label)} has already been declared`));
    }
    if (node.body.type === 'FunctionDeclaration') {
      s = s.addStrictError(new EarlyError(node, 'Labeled FunctionDeclarations are disallowed in strict mode'));
    }
    s = isIterationStatement(node.body)
      ? s.observeIterationLabel(node.label)
      : s.observeNonIterationLabel(node.label);
    return s;
  }

//  reduceLiteralRegExpExpression(node) {
  reduceLiteralRegExpExpression() {
    let s = this.identity;
    // NOTE: the RegExp pattern acceptor is disabled until we have more confidence in its correctness (more tests)
    // if (!PatternAcceptor.test(node.pattern, node.flags.indexOf("u") >= 0)) {
    //  s = s.addError(new EarlyError(node, "Invalid regular expression pattern"));
    // }
    return s;
  }

  reduceMethod(node, { name, p, b }) {
    let params = p,
        body = b;
    let isSimpleParameterList = node.params.rest == null &&
      node.params.items.every(i => i.type === 'BindingIdentifier');
    params = params.enforceDuplicateLexicallyDeclaredNames(DUPLICATE_BINDING);
    body = body.enforceConflictingLexicallyDeclaredNames(params.lexicallyDeclaredNames, DUPLICATE_BINDING);
    if (node.name.type === 'StaticPropertyName' && node.name.value === 'constructor') {
      body = body.observeConstructorMethod();
      params = params.observeConstructorMethod();
    } else {
      body = body.enforceSuperCallExpressions(SUPERCALL_ERROR);
      params = params.enforceSuperCallExpressions(SUPERCALL_ERROR);
    }
    if (node.isGenerator) {
      params.yieldExpressions.forEach(function (n) {
        params = params.addError(new EarlyError(n, 'Generator parameters must not contain yield expressions'));
      });
    }
    body = body.clearSuperPropertyExpressions();
    params = params.clearSuperPropertyExpressions();
    params = params.clearNewTargetExpressions();
    body = body.clearNewTargetExpressions();
    if (isStrictFunctionBody(node.body)) {
      params = params.enforceStrictErrors();
      body = body.enforceStrictErrors();
    }
    let s = super.reduceMethod(node, { name, params, body });
    if (!isSimpleParameterList && isStrictFunctionBody(node.body)) {
      s = s.addError(new EarlyError(node, `Functions with non-simple parameter
        lists may not contain a "use strict" directive`));
    }
    s = s.clearYieldExpressions();
    s = s.observeVarBoundary();
    return s;
  }

  reduceModule() {
    let s = super.reduceModule(...arguments);
    s = s.functionDeclarationNamesAreLexical();
    s = s.enforceDuplicateLexicallyDeclaredNames(DUPLICATE_BINDING);
    s = s.enforceConflictingLexicallyDeclaredNames(s.varDeclaredNames, DUPLICATE_BINDING);
    s.exportedNames.forEachEntry((nodes, bindingName) => {
      if (nodes.length > 1) {
        nodes.slice(1).forEach(dupeNode => {
          s = s.addError(new EarlyError(dupeNode, `Duplicate export ${JSON.stringify(bindingName)}`));
        });
      }
    });
    s.exportedBindings.forEachEntry((nodes, bindingName) => {
      if (!s.lexicallyDeclaredNames.has(bindingName) && !s.varDeclaredNames.has(bindingName)) {
        nodes.forEach(undeclaredNode => {
          s = s.addError(new EarlyError(undeclaredNode, `Exported binding
            ${JSON.stringify(bindingName)} is not declared`));
        });
      }
    });
    s.newTargetExpressions.forEach(node => {
      s = s.addError(new EarlyError(node, 'new.target must be within function (but not arrow expression) code'));
    });
    s = s.enforceFreeContinueStatementErrors(FREE_CONTINUE);
    s = s.enforceFreeLabeledContinueStatementErrors(UNBOUND_CONTINUE);
    s = s.enforceFreeBreakStatementErrors(FREE_BREAK);
    s = s.enforceFreeLabeledBreakStatementErrors(UNBOUND_BREAK);
    s = s.enforceSuperCallExpressions(SUPERCALL_ERROR);
    s = s.enforceSuperPropertyExpressions(SUPERPROPERTY_ERROR);
    s = s.enforceStrictErrors();
    return s;
  }

  reduceNewTargetExpression(node) {
    return this.identity.observeNewTargetExpression(node);
  }

  reduceObjectExpression(node) {
    let s = super.reduceObjectExpression(...arguments);
    s = s.enforceSuperCallExpressionsInConstructorMethod(SUPERCALL_ERROR);
    let protos = node.properties.filter(p => p.type === 'DataProperty' &&
      p.name.type === 'StaticPropertyName' && p.name.value === '__proto__');
    protos.slice(1).forEach(n => {
      s = s.addError(new EarlyError(n, 'Duplicate __proto__ property in object literal not allowed'));
    });
    return s;
  }

  reduceUpdateExpression() {
    let s = super.reduceUpdateExpression(...arguments);
    s = s.clearBoundNames();
    return s;
  }

  reduceUnaryExpression(node) {
    let s = super.reduceUnaryExpression(...arguments);
    if (node.operator === 'delete' && node.operand.type === 'IdentifierExpression') {
      s = s.addStrictError(new EarlyError(node, 'Identifier expressions must not be deleted in strict mode'));
    }
    return s;
  }

  reduceScript(node) {
    let s = super.reduceScript(...arguments);
    s = s.enforceDuplicateLexicallyDeclaredNames(DUPLICATE_BINDING);
    s = s.enforceConflictingLexicallyDeclaredNames(s.varDeclaredNames, DUPLICATE_BINDING);
    s.newTargetExpressions.forEach(n => {
      s = s.addError(new EarlyError(n, 'new.target must be within function (but not arrow expression) code'));
    });
    s = s.enforceFreeContinueStatementErrors(FREE_CONTINUE);
    s = s.enforceFreeLabeledContinueStatementErrors(UNBOUND_CONTINUE);
    s = s.enforceFreeBreakStatementErrors(FREE_BREAK);
    s = s.enforceFreeLabeledBreakStatementErrors(UNBOUND_BREAK);
    s = s.enforceSuperCallExpressions(SUPERCALL_ERROR);
    s = s.enforceSuperPropertyExpressions(SUPERPROPERTY_ERROR);
    if (isStrictFunctionBody(node)) {
      s = s.enforceStrictErrors();
    }
    return s;
  }

  reduceSetter(node, { name, p, b }) {
    let param = p,
        body = b;
    let isSimpleParameterList = node.param.type === 'BindingIdentifier';
    param = param.observeLexicalDeclaration();
    param = param.enforceDuplicateLexicallyDeclaredNames(DUPLICATE_BINDING);
    body = body.enforceConflictingLexicallyDeclaredNames(param.lexicallyDeclaredNames, DUPLICATE_BINDING);
    param = param.enforceSuperCallExpressions(SUPERCALL_ERROR);
    body = body.enforceSuperCallExpressions(SUPERCALL_ERROR);
    param = param.clearSuperPropertyExpressions();
    body = body.clearSuperPropertyExpressions();
    param = param.clearNewTargetExpressions();
    body = body.clearNewTargetExpressions();
    if (isStrictFunctionBody(node.body)) {
      param = param.enforceStrictErrors();
      body = body.enforceStrictErrors();
    }
    let s = super.reduceSetter(node, { name, param, body });
    if (!isSimpleParameterList && isStrictFunctionBody(node.body)) {
      s = s.addError(new EarlyError(node, `Functions with non-simple parameter lists
        may not contain a "use strict" directive`));
    }
    s = s.observeVarBoundary();
    return s;
  }

  reduceStaticMemberExpression(node) {
    let s = super.reduceStaticMemberExpression(...arguments);
    if (node.object.type === 'Super') {
      s = s.observeSuperPropertyExpression(node);
    }
    return s;
  }

  reduceSwitchStatement(node, { discriminant, cases }) {
    let sCases = this.fold(cases);
    sCases = sCases.functionDeclarationNamesAreLexical();
    sCases = sCases.enforceDuplicateLexicallyDeclaredNames(DUPLICATE_BINDING);
    sCases = sCases.enforceConflictingLexicallyDeclaredNames(sCases.varDeclaredNames, DUPLICATE_BINDING);
    sCases = sCases.observeLexicalBoundary();
    let s = this.append(discriminant, sCases);
    s = s.clearFreeBreakStatements();
    return s;
  }

  reduceSwitchStatementWithDefault(node, { discriminant, preDefaultCases, defaultCase, postDefaultCases }) {
    let sCases = this.append(defaultCase, this.append(this.fold(preDefaultCases), this.fold(postDefaultCases)));
    sCases = sCases.functionDeclarationNamesAreLexical();
    sCases = sCases.enforceDuplicateLexicallyDeclaredNames(DUPLICATE_BINDING);
    sCases = sCases.enforceConflictingLexicallyDeclaredNames(sCases.varDeclaredNames, DUPLICATE_BINDING);
    sCases = sCases.observeLexicalBoundary();
    let s = this.append(discriminant, sCases);
    s = s.clearFreeBreakStatements();
    return s;
  }

  reduceVariableDeclaration(node) {
    let s = super.reduceVariableDeclaration(...arguments);
    switch (node.kind) {
      case 'const':
      case 'let': {
        s = s.observeLexicalDeclaration();
        if (s.lexicallyDeclaredNames.has('let')) {
          s.lexicallyDeclaredNames.get('let').forEach(n => {
            s = s.addError(new EarlyError(n, 'Lexical declarations must not have a binding named "let"'));
          });
        }
        break;
      }
      case 'var':
        s = s.observeVarDeclaration();
        break;
    }
    return s;
  }

  reduceVariableDeclarationStatement(node) {
    let s = super.reduceVariableDeclarationStatement(...arguments);
    if (node.declaration.kind === 'const') {
      node.declaration.declarators.forEach(declarator => {
        if (declarator.init == null) {
          s = s.addError(new EarlyError(declarator, 'Constant lexical declarations must have an initialiser'));
        }
      });
    }
    return s;
  }

  reduceWhileStatement(node) {
    let s = super.reduceWhileStatement(...arguments);
    if (isLabelledFunction(node.body)) {
      s = s.addError(new EarlyError(node.body, `The body of a while statement must not
        be a labeled function declaration`));
    }
    s = s.clearFreeContinueStatements().clearFreeBreakStatements();
    return s;
  }

  reduceWithStatement(node) {
    let s = super.reduceWithStatement(...arguments);
    if (isLabelledFunction(node.body)) {
      s = s.addError(new EarlyError(node.body, `The body of a with statement must
        not be a labeled function declaration`));
    }
    s = s.addStrictError(new EarlyError(node, 'Strict mode code must not include a with statement'));
    return s;
  }

  reduceYieldExpression(node) {
    let s = super.reduceYieldExpression(...arguments);
    s = s.observeYieldExpression(node);
    return s;
  }

  reduceYieldGeneratorExpression(node) {
    let s = super.reduceYieldGeneratorExpression(...arguments);
    s = s.observeYieldExpression(node);
    return s;
  }


  static check(node) {
    return reduce(new EarlyErrorChecker, node).errors;
  }
}
