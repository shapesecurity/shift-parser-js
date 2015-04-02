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

import reduce, {MonoidalReducer} from "shift-reducer";
import {isRestrictedWord, isStrictModeReservedWord} from "./utils";

import {EarlyErrorState, EarlyError} from "./early-error-state";

function isStrictFunctionBody({directives}) {
  return directives.some(directive => directive.rawValue === "use strict");
}

function containsDuplicates(list) {
  let uniqs = [];
  for (let i = 0, l = list.length; i < l; ++i) {
    let item = list[i];
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

function isLabelledFunction(node) {
  return node.type === "LabeledStatement" &&
    (node.body.type === "FunctionDeclaration" || isLabelledFunction(node.body));
}

function isIterationStatement(node) {
  switch (node.type) {
    case "LabeledStatement":
      return isIterationStatement(node.body);
    case "DoWhileStatement":
    case "ForInStatement":
    case "ForOfStatement":
    case "ForStatement":
    case "WhileStatement":
      return true;
  }
  return false;
}

function isSpecialMethod(methodDefinition) {
  if (methodDefinition.name.type !== "StaticPropertyName" || methodDefinition.name.value !== "constructor")
    return false;
  switch (methodDefinition.type) {
    case "Getter":
    case "Setter":
      return true;
    case "Method":
      return methodDefinition.isGenerator;
  }
  /* istanbul ignore next */
  throw new Error("not reached");
}

class PatternAcceptor {
  constructor(pattern, u = false) {
    this.index = 0;
    this.nCapturingParens = 0;
    // constants
    this.length = pattern.length;
    this.pattern = pattern;
    this.u = u;
  }

  static test(pattern, u = false) {
    let acceptor = new PatternAcceptor(pattern, u);
    return acceptor.readDisjunction() && acceptor.index === acceptor.length;
  }

  eat(ch) {
    if(this.index >= this.length || this.pattern[this.index] !== ch) return false;
    ++this.index;
    return true;
  }

  eatRegExp(r) {
    if (this.index >= this.length || !r.test(this.pattern[this.index])) return false;
    ++this.index;
    return true;
  }

  eatN(n, r) {
    if (this.index + n <= this.length && r.test(this.pattern.slice(this.index, this.index + n))) {
      this.index += n;
      return true;
    }
    return false;
  }

  match(ch) {
    return this.index < this.length && this.pattern[this.index] === ch;
  }

  matchRegExp(r) {
    return this.index < this.length && r.test(this.pattern[this.index]);
  }

  trackback(start, result) {
    if (result) return true;
    this.index = start;
    return false;
  }


  readDisjunction() {
    return this.readAlternative() && (this.eat("|") ? this.readDisjunction() : true);
  }

  readAlternative() {
    let savedIndex = this.index;
    while (this.readTerm()) {
      savedIndex = this.index;
    }
    this.index = savedIndex;
    return true;
  }

  readTerm() {
    if (!this.u) return this.readExtendedTerm();
    return this.readAssertion() ||
      this.readQuantifiableAssertion() ||
      this.readAtom() && (this.readQuantifier(), true);
  }

  readExtendedTerm() {
    return this.readQuantifiableAssertion() && (this.readQuantifier(), true) ||
      this.readAssertion() ||
      this.readAtomNoBrace() && (this.readQuantifier(), true) ||
      this.readAtom();
  }

  readAssertion() {
    return this.eat("^") || this.eat("$") || this.eatN(2, /^\\[bB]$/);
  }

  readQuantifiableAssertion() {
    let start = this.index;
    return this.eatN(3, /^\(\?[=!]$/) && this.trackback(start, this.readDisjunction() && this.eat(")"));
  }

  readQuantifier() {
    return this.readQuantifierPrefix() && (this.eat("?"), true);
  }

  readQuantifierPrefix() {
    if (this.eat("*") || this.eat("+") || this.eat("?")) return true;
    if (this.eat("{") && this.readDecimalDigits()) {
      if (this.eat(",")) this.readDecimalDigits();
      return this.eat("}");
    }
    return false;
  }

  readDecimalDigits() {
    let start = this.index;
    while (this.eatRegExp(/^\d$/));
    return this.index > start;
  }

  readAtomNoBrace() {
    let start = this.index;
    let startingParens = this.nCapturingParens;
    if (this.readPatternCharacterNoBrace() || this.eat(".")) return true;
    if (this.eat("\\")) return this.trackback(start, this.readAtomEscape());
    if (this.readCharacterClass()) return true;
    if (this.eat("(")) {
      if (!this.eatN(2, /^\?:$/)) ++this.nCapturingParens;
      if (this.readDisjunction() && this.eat(")")) return true;
      this.nCapturingParens = startingParens;
      this.index = start;
      return false;
    }
    return false;
  }

  readAtom() {
    return this.readAtomNoBrace() || this.eat("{") || this.eat("}");
  }

  readSyntaxCharacter() {
    return this.eatRegExp(/^[\^$\\.*+?()[\]{}|]$/);
  }

  readPatternCharacter() {
    return this.eatRegExp(/^[^\^$\\.*+?()[\]|]$/);
  }

  readPatternCharacterNoBrace() {
    return this.eatRegExp(/^[^\^$\\.*+?()[\]{}|]$/);
  }

  readAtomEscape() {
    return this.readDecimalEscape() || this.readCharacterEscape() || this.readCharacterClassEscape();
  }

  readCharacterEscape() {
    return this.readControlEscape() ||
      this.eat("c") && this.readControlLetter() ||
      this.readHexEscapeSequence() ||
      this.readRegExpUnicodeEscapeSequence() ||
      this.readIdentityEscape();
  }

  readControlEscape() {
    return this.eatRegExp(/^[fnrtv]$/);
  }

  readControlLetter() {
    return this.eatRegExp(/^[a-zA-Z]$/);
  }

  readHexEscapeSequence() {
    return this.eat("x") && this.readHexDigit() && this.readHexDigit();
  }

  readHexDigit() {
    return this.eatRegExp(/^[a-fA-F0-9]$/);
  }

  readRegExpUnicodeEscapeSequence() {
    if (!this.eat("u")) return false;
    if (this.u) {
      if (this.eatN(4, /^D[abAB89][a-fA-F0-9]{2}$/)) {
        this.eatN(6, /^\\u[dD][c-fC-F0-9][a-fA-F0-9]{2}$/);
        return true;
      }
      return this.readHex4Digits() || this.eat("{") && this.readHexDigits() && this.eat("}");
    } else {
      return this.readHex4Digits();
    }
  }

  readHex4Digits() {
    let k = 4;
    while (k > 0) {
      --k;
      if (!this.readHexDigit()) return false;
    }
    return true;
  }

  readHexDigits() {
    let start = this.index;
    while (this.readHexDigit());
    return this.index > start;
  }

  readIdentityEscape() {
    if (this.u) {
      return this.readSyntaxCharacter() || this.eat("/");
    } else {
      return this.eatRegExp(/^[^a-zA-Z0-9_]$/); // TODO: SourceCharacter but not UnicodeIDContinue
    }
  }

  readDecimalEscape() {
    if (this.eat("0")) {
      if (!this.matchRegExp(/^\d$/)) return true;
      --this.index;
      return false;
    }
    let start = this.index;
    while (this.eatRegExp(/^\d$/));
    return this.trackback(start, this.index > start && (this.u || +this.pattern.slice(start, this.index) <= this.nCapturingParens));
  }

  readCharacterClassEscape() {
    return this.eatRegExp(/^[dDsSwW]$/);
  }

  readCharacterClass() {
    let start = this.index;
    return this.eat("[") && this.trackback(start, (this.eat("^"), true) && this.readClassRanges() && this.eat("]"));
  }

  readClassRanges() {
    let start = this.index;
    if (!this.readNonemptyClassRanges()) {
      this.index = start;
    }
    return true;
  }

  readNonemptyClassRanges() {
    if (this.readClassAtom()) {
      if (this.match("]")) return true;
      if (this.eat("-")) {
        if (this.match("]")) return true;
       return this.readClassAtom() && this.readClassRanges();
      }
      return this.readNonemptyClassRangesNoDash();
    }
    return false;
  }

  readNonemptyClassRangesNoDash() {
    if (this.eat("-")) return true;
    if (this.readClassAtomNoDash()) {
      if (this.match("]")) return true;
      if (this.eat("-")) {
        if (this.match("]")) return true;
       return this.readClassAtom() && this.readClassRanges();
      }
      return this.readNonemptyClassRangesNoDash();
    }
    return false;
  }

  readClassAtom() {
    return this.eat("-") || this.readClassAtomNoDash();
  }

  readClassAtomNoDash() {
    return this.eatRegExp(/^[^\\\]-]$/) || this.eat("\\") && this.readClassEscape();
  }

  readClassEscape() {
    return this.readDecimalEscape() || this.eat("b") || this.u && this.eat("-") || this.readCharacterEscape() || this.readCharacterClassEscape();
  }

}


const SUPERCALL_ERROR = node => new EarlyError(node, `Calls to super must be in the "constructor" method of a class expression or class declaration that has a superclass`);
const SUPERPROPERTY_ERROR = node => new EarlyError(node, `Member access on super must be in a method`);

export class EarlyErrorChecker extends MonoidalReducer {
  constructor() {
    super(EarlyErrorState);
  }

  reduceAssignmentExpression() {
    return super.reduceAssignmentExpression(...arguments).clearBoundNames();
    return super.reduceAssignmentExpression(...arguments).clearBoundNames();
  }

  reduceArrowExpression(node, {params, body}) {
    params.lexicallyDeclaredNames.forEachEntry((nodes, name) => {
      if (nodes.length > 1) {
        nodes.slice(1).forEach(dupeNode => {
          params = params.addError(new EarlyError(dupeNode, `Duplicate binding ${JSON.stringify(name)}`));
        });
      }
    });
    if (node.body.type === "FunctionBody") {
      body.lexicallyDeclaredNames.forEachEntry((nodes, name) => {
        if (params.lexicallyDeclaredNames.has(name)) {
          nodes.forEach(dupeNode => {
            body = body.addError(new EarlyError(dupeNode, `Duplicate binding ${JSON.stringify(name)}`));
          });
        }
      });
      if (isStrictFunctionBody(node.body)) {
        params = params.enforceStrictErrors();
        body = body.enforceStrictErrors();
      }
    }
    return super.reduceArrowExpression(node, {params, body})
      .observeVarBoundary();
  }

  reduceBindingIdentifier(node) {
    let s = this.identity;
    let {name} = node;
    if (isRestrictedWord(name) || isStrictModeReservedWord(name)) {
      s = s.addStrictError(new EarlyError(node, `The identifier ${JSON.stringify(name)} must not be in binding position in strict mode`));
    }
    return s.bindName(name, node);
  }

  reduceBindingPropertyIdentifier(node) {
    let s = super.reduceBindingPropertyIdentifier(...arguments);
    let {binding: {name}} = node;
    if (isRestrictedWord(name) || isStrictModeReservedWord(name)) {
      s = s.addStrictError(new EarlyError(node, `The identifier ${JSON.stringify(name)} must not be in binding position in strict mode`));
    }
    if (name === "yield") {
      s = s.observeYieldIdentifierExpression(node);
    }
    return s;
  }

  reduceBlock() {
    let s = super.reduceBlock(...arguments)
      .functionDeclarationNamesAreLexical();
    s.lexicallyDeclaredNames.forEachEntry((nodes, name) => {
      if (nodes.length > 1) {
        nodes.slice(1).forEach(dupeNode => {
          s = s.addError(new EarlyError(dupeNode, `Duplicate binding ${JSON.stringify(name)}`));
        });
      }
      if (s.varDeclaredNames.has(name)) {
        nodes.forEach(dupeNode => {
          s = s.addError(new EarlyError(dupeNode, `Duplicate binding ${JSON.stringify(name)}`));
        });
      }
    });
    return s.observeLexicalBoundary();
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
    if (node.callee.type === "Super") {
      s = s.observeSuperCallExpression(node);
    }
    return s;
  }

  reduceCatchClause(node, {binding, body}) {
    binding = binding.observeLexicalDeclaration();
    binding.lexicallyDeclaredNames.forEachEntry((nodes, name) => {
      if (nodes.length > 1) {
        nodes.slice(1).forEach(dupeNode => {
          binding = binding.addError(new EarlyError(dupeNode, `Duplicate binding ${JSON.stringify(name)}`));
        });
      }
      if (body.previousLexicallyDeclaredNames.has(name)) {
        nodes.forEach(dupeNode => {
          binding = binding.addError(new EarlyError(dupeNode, `Duplicate binding ${JSON.stringify(name)}`));
        });
      }
      if (body.varDeclaredNames.has(name)) {
        body.varDeclaredNames.get(name).forEach(dupeNode => {
          if (body.forOfVarDeclaredNames.indexOf(dupeNode) >= 0) {
            binding = binding.addError(new EarlyError(dupeNode, `Duplicate binding ${JSON.stringify(name)}`));
          }
        });
      }
    });
    let s = super.reduceCatchClause(node, {binding, body});
    s = s.observeLexicalBoundary();
    return s;
  }

  reduceClassDeclaration(node, {name, super: _super, elements}) {
    let s = name;
    let sElements = this.fold(elements);
    sElements = sElements.enforceStrictErrors();
    if (node.super != null) {
      s = this.append(s, _super);
      sElements = sElements.clearSuperCallExpressionsInConstructorMethod();
    }
    sElements = sElements.enforceSuperCallExpressions(SUPERCALL_ERROR);
    sElements = sElements.enforceSuperPropertyExpressions(SUPERPROPERTY_ERROR);
    s = this.append(s, sElements);
    let ctors = node.elements.filter(e => !e.isStatic && e.method.type === "Method" && !e.method.isGenerator && e.method.name.type === "StaticPropertyName" && e.method.name.value === "constructor");
    if (ctors.length > 1) {
      ctors.slice(1).forEach(ctor => {
        s = s.addError(new EarlyError(ctor, "Duplicate constructor method in class"));
      });
    }
    s = s.observeLexicalDeclaration();
    return s;
  }

  reduceClassElement(node) {
    let s = super.reduceClassElement(...arguments);
    if (!node.isStatic && isSpecialMethod(node.method)) {
      s = s.addError(new EarlyError(node, "Constructors cannot be generators, getters or setters"));
    }
    if (node.isStatic && node.method.name.type === "StaticPropertyName" && node.method.name.value === "prototype") {
      s = s.addError(new EarlyError(node, "Static class methods cannot be named \"prototype\""));
    }
    return s;
  }

  reduceClassExpression(node, {name, super: _super, elements}) {
    let s = node.name == null ? this.identity : name;
    let sElements = this.fold(elements);
    sElements = sElements.enforceStrictErrors();
    if (node.super != null) {
      s = this.append(s, _super);
      sElements = sElements.clearSuperCallExpressionsInConstructorMethod();
    }
    sElements = sElements.enforceSuperCallExpressions(SUPERCALL_ERROR);
    sElements = sElements.enforceSuperPropertyExpressions(SUPERPROPERTY_ERROR);
    s = this.append(s, sElements);
    let ctors = node.elements.filter(e => !e.isStatic && e.method.type === "Method" && !e.method.isGenerator && e.method.name.type === "StaticPropertyName" && e.method.name.value === "constructor");
    if (ctors.length > 1) {
      ctors.slice(1).forEach(ctor => {
        s = s.addError(new EarlyError(ctor, "Duplicate constructor method in class"));
      });
    }
    return s;
  }

  reduceComputedMemberExpression(node) {
    let s = super.reduceComputedMemberExpression(...arguments);
    if (node.object.type === "Super") {
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
      s = s.addError(new EarlyError(node.body, "The body of a do-while statement must not be a labeled function declaration"));
    }
    s = s.clearFreeContinueStatements().clearFreeBreakStatements();
    return s;
  }

  reduceExport() {
    return super.reduceExport(...arguments)
      .functionDeclarationNamesAreLexical()
      .exportDeclaredNames();
  }

  reduceExportSpecifier(node) {
    return super.reduceExportSpecifier(...arguments)
      .exportName(node.exportedName, node)
      .exportBinding(node.name || node.exportedName, node);
  }

  reduceExportDefault(node) {
    let s = super.reduceExportDefault(...arguments)
      .functionDeclarationNamesAreLexical();
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

  reduceFormalParameters(node) {
    let s = super.reduceFormalParameters(...arguments)
      .observeLexicalDeclaration();
    let isSimpleParameterList = node.rest == null && node.items.every(i => i.type === "BindingIdentifier");
    let addError = s[isSimpleParameterList ? "addStrictError" : "addError"];
    s.lexicallyDeclaredNames.forEachEntry((nodes, name) => {
      if (nodes.length > 1) {
        nodes.slice(1).forEach(dupeNode => {
          s = addError.call(s, new EarlyError(dupeNode, `Duplicate binding ${JSON.stringify(name)}`));
        });
      }
    });
    return s;
  }

  reduceForStatement(node, {init, test, update, body}) {
    if (init != null) {
      init.lexicallyDeclaredNames.forEachEntry((nodes, name) => {
        if (body.varDeclaredNames.has(name)) {
          nodes.forEach(node => {
            init = init.addError(new EarlyError(node, `Duplicate binding ${JSON.stringify(name)}`));
          });
        }
      });
    }
    let s = super.reduceForStatement(node, {init, test, update, body});
    if (isLabelledFunction(node.body)) {
      s = s.addError(new EarlyError(node.body, "The body of a for statement must not be a labeled function declaration"));
    }
    s = s.clearFreeContinueStatements().clearFreeBreakStatements();
    return s.observeLexicalBoundary();
  }

  reduceForInStatement(node, {left, right, body}) {
    left.lexicallyDeclaredNames.forEachEntry((nodes, name) => {
      if (nodes.length > 1) {
        nodes.slice(1).forEach(dupeNode => {
          left = left.addError(new EarlyError(dupeNode, `Duplicate binding ${JSON.stringify(name)}`));
        });
      }
      if (body.varDeclaredNames.has(name)) {
        nodes.forEach(node => {
          left = left.addError(new EarlyError(node, `Duplicate binding ${JSON.stringify(name)}`));
        });
      }
    });
    let s = super.reduceForInStatement(node, {left, right, body});
    if (isLabelledFunction(node.body)) {
      s = s.addError(new EarlyError(node.body, "The body of a for-in statement must not be a labeled function declaration"));
    }
    s = s.clearFreeContinueStatements().clearFreeBreakStatements();
    return s.observeLexicalBoundary();
  }

  reduceForOfStatement(node, {left, right, body}) {
    left = left.recordForOfVars();
    left.lexicallyDeclaredNames.forEachEntry((nodes, name) => {
      if (nodes.length > 1) {
        nodes.slice(1).forEach(dupeNode => {
          left = left.addError(new EarlyError(dupeNode, `Duplicate binding ${JSON.stringify(name)}`));
        });
      }
      if (body.varDeclaredNames.has(name)) {
        nodes.forEach(node => {
          left = left.addError(new EarlyError(node, `Duplicate binding ${JSON.stringify(name)}`));
        });
      }
    });
    let s = super.reduceForOfStatement(node, {left, right, body});
    if (isLabelledFunction(node.body)) {
      s = s.addError(new EarlyError(node.body, "The body of a for-of statement must not be a labeled function declaration"));
    }
    s = s.clearFreeContinueStatements().clearFreeBreakStatements();
    return s.observeLexicalBoundary();
  }

  reduceFunctionBody(node) {
    let s = super.reduceFunctionBody(...arguments);
    s.lexicallyDeclaredNames.forEachEntry((nodes, name) => {
      if (nodes.length > 1) {
        nodes.slice(1).forEach(dupeNode => {
          s = s.addError(new EarlyError(dupeNode, `Duplicate binding ${JSON.stringify(name)}`));
        });
      }
      if (s.varDeclaredNames.has(name)) {
        nodes.forEach(dupeNode => {
          s = s.addError(new EarlyError(dupeNode, `Duplicate binding ${JSON.stringify(name)}`));
        });
      }
    });
    s = s.enforceFreeContinueStatementErrors(node => new EarlyError(node, "Continue statement must be nested within an iteration statement"));
    s = s.enforceFreeLabeledContinueStatementErrors(node => new EarlyError(node, `Continue statement must be nested within an iteration statement with label ${JSON.stringify(node.label)}`));
    s = s.enforceFreeBreakStatementErrors(node => new EarlyError(node, "Break statement must be nested within an iteration statement or a switch statement"));
    s = s.enforceFreeLabeledBreakStatementErrors(node => new EarlyError(node, `Break statement must be nested within a statement with label ${JSON.stringify(node.label)}`));
    s = s.clearUsedLabelNames();
    if (isStrictFunctionBody(node)) {
      s = s.enforceStrictErrors();
    }
    return s;
  }

  reduceFunctionDeclaration(node, {name, params, body}) {
    if (node.isGenerator) {
      if (params.lexicallyDeclaredNames.has("yield")) {
        params.lexicallyDeclaredNames.get("yield").forEach(yieldDecl =>
          params = params.addError(new EarlyError(yieldDecl, `Generator functions must not have parameters named "yield"`))
        );
      }
      body = body.enforceYieldIdentifierExpression(node =>
        new EarlyError(node, `The identifier ${JSON.stringify(node.name)} must not be in expression position in generator bodies`)
      );
    }
    body.lexicallyDeclaredNames.forEachEntry((nodes, name) => {
      if (params.lexicallyDeclaredNames.has(name)) {
        nodes.forEach(dupeNode => {
          body = body.addError(new EarlyError(dupeNode, `Duplicate binding ${JSON.stringify(name)}`));
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
    return super.reduceFunctionDeclaration(node, {name, params, body})
      .observeFunctionDeclaration();
  }

  reduceFunctionExpression(node, {name, params, body}) {
    if (node.isGenerator) {
      if (params.lexicallyDeclaredNames.has("yield")) {
        params.lexicallyDeclaredNames.get("yield").forEach(yieldDecl =>
          params = params.addError(new EarlyError(yieldDecl, `Generator functions must not have parameters named "yield"`))
        );
      }
      body = body.enforceYieldIdentifierExpression(node =>
        new EarlyError(node, `The identifier ${JSON.stringify(node.name)} must not be in expression position in generator bodies`)
      );
    }
    body.lexicallyDeclaredNames.forEachEntry((nodes, name) => {
      if (params.lexicallyDeclaredNames.has(name)) {
        nodes.forEach(dupeNode => {
          body = body.addError(new EarlyError(dupeNode, `Duplicate binding ${JSON.stringify(name)}`));
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
    return super.reduceFunctionExpression(node, {name, params, body})
      .clearBoundNames()
      .observeVarBoundary();
  }

  reduceGetter(node, {name, body}) {
    body = body.enforceSuperCallExpressions(SUPERCALL_ERROR).clearSuperPropertyExpressions();
    body = body.clearNewTargetExpressions();
    if (isStrictFunctionBody(node.body)) {
      body = body.enforceStrictErrors();
    }
    return super.reduceGetter(node, {name, body})
      .observeVarBoundary();
  }

  reduceIdentifierExpression(node) {
    let s = this.identity;
    let {name} = node;
    if (isStrictModeReservedWord(name)) {
      s = s.addStrictError(new EarlyError(node, `The identifier ${JSON.stringify(name)} must not be in expression position in strict mode`));
    }
    if (name === "yield") {
      s = s.observeYieldIdentifierExpression(node);
    }
    return s;
  }

  reduceIfStatement(node) {
    let s = super.reduceIfStatement(...arguments);
    if (isLabelledFunction(node.consequent)) {
      s = s.addError(new EarlyError(node.consequent, "The consequent of an if statement must not be a labeled function declaration"));
    }
    if (node.alternate != null && isLabelledFunction(node.alternate)) {
      s = s.addError(new EarlyError(node.alternate, "The alternate of an if statement must not be a labeled function declaration"));
    }
    return s;
  }

  reduceImport() {
    return super.reduceImport(...arguments).observeLexicalDeclaration();
  }

  reduceImportNamespace() {
    return super.reduceImportNamespace(...arguments).observeLexicalDeclaration();
  }

  reduceLabeledStatement(node) {
    let s = super.reduceLabeledStatement(...arguments);
    let {label} = node;
    if (label === "yield") {
      s = s.addStrictError(new EarlyError(node, `The identifier ${JSON.stringify(label)} must not be in label position in strict mode`));
    }
    if (s.usedLabelNames.indexOf(label) >= 0) {
      s = s.addError(new EarlyError(node, `Label ${JSON.stringify(label)} has already been declared`));
    }
    if (node.body.type === "FunctionDeclaration") {
      s = s.addStrictError(new EarlyError(node, "Labeled FunctionDeclarations are disallowed in strict mode"));
    }
    s = isIterationStatement(node.body)
      ? s.observeIterationLabel(node.label)
      : s.observeNonIterationLabel(node.label);
    return s;
  }

  reduceLiteralRegExpExpression(node) {
    let s = this.identity;
    let {pattern, flags} = node;
    if (!PatternAcceptor.test(pattern, flags.indexOf("u") >= 0)) {
      s = s.addError(new EarlyError(node, "Invalid regular expression pattern"));
    }
    if (!/^[igmyu]*$/.test(flags) || containsDuplicates(flags)) {
      s = s.addError(new EarlyError(node, "Invalid regular expression flags"));
    }
    return s;
  }

  reduceMethod(node, {name, params, body}) {
    params.lexicallyDeclaredNames.forEachEntry((nodes, name) => {
      if (nodes.length > 1) {
        nodes.slice(1).forEach(dupeNode => {
          params = params.addError(new EarlyError(dupeNode, `Duplicate binding ${JSON.stringify(name)}`));
        });
      }
    });
    body.lexicallyDeclaredNames.forEachEntry((nodes, name) => {
      if (params.lexicallyDeclaredNames.has(name)) {
        nodes.forEach(dupeNode => {
          body = body.addError(new EarlyError(dupeNode, `Duplicate binding ${JSON.stringify(name)}`));
        });
      }
    });
    if (node.isGenerator) {
      if (params.lexicallyDeclaredNames.has("yield")) {
        params.lexicallyDeclaredNames.get("yield").forEach(yieldDecl =>
          params = params.addError(new EarlyError(yieldDecl, `Generator methods must not have parameters named "yield"`))
        );
      }
      body = body.enforceYieldIdentifierExpression(node =>
        new EarlyError(node, `The identifier ${JSON.stringify(node.name)} must not be in expression position in generator method bodies`)
      );
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
    return super.reduceMethod(node, {name, params, body})
      .observeVarBoundary();
  }

  reduceModule() {
    let s = super.reduceModule(...arguments);
    s.lexicallyDeclaredNames.forEachEntry((nodes, name) => {
      if (nodes.length > 1) {
        nodes.slice(1).forEach(dupeNode => {
          s = s.addError(new EarlyError(dupeNode, `Duplicate binding ${JSON.stringify(name)}`));
        });
      }
      if (s.varDeclaredNames.has(name)) {
        nodes.forEach(dupeNode => {
          s = s.addError(new EarlyError(dupeNode, `Duplicate binding ${JSON.stringify(name)}`));
        });
      }
    });
    s.exportedNames.forEachEntry((nodes, name) => {
      if (nodes.length > 1) {
        nodes.slice(1).forEach(dupeNode => {
          s = s.addError(new EarlyError(dupeNode, `Duplicate export ${JSON.stringify(name)}`));
        });
      }
    });
    s.exportedBindings.forEachEntry((nodes, name) => {
      if (name !== "*default*" && !s.lexicallyDeclaredNames.has(name) && !s.varDeclaredNames.has(name)) {
        nodes.forEach(undeclaredNode => {
          s = s.addError(new EarlyError(undeclaredNode, `Exported binding ${JSON.stringify(name)} is not declared`));
        });
      }
    });
    s.newTargetExpressions.forEach(node => {
      s = s.addError(new EarlyError(node, "new.target must be within function (but not arrow expression) code"));
    });
    s = s.enforceFreeContinueStatementErrors(node => new EarlyError(node, "Continue statement must be nested within an iteration statement"));
    s = s.enforceFreeLabeledContinueStatementErrors(node => new EarlyError(node, `Continue statement must be nested within an iteration statement with label ${JSON.stringify(node.label)}`));
    s = s.enforceFreeBreakStatementErrors(node => new EarlyError(node, "Break statement must be nested within an iteration statement or a switch statement"));
    s = s.enforceFreeLabeledBreakStatementErrors(node => new EarlyError(node, `Break statement must be nested within a statement with label ${JSON.stringify(node.label)}`));
    s = s.enforceSuperCallExpressions(SUPERCALL_ERROR)
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
    let protos = node.properties.filter(p => p.type === "DataProperty" && p.name.type === "StaticPropertyName" && p.name.value === "__proto__");
    protos.slice(1).forEach(node => {
      s = s.addError(new EarlyError(node, "Duplicate __proto__ property in object literal not allowed"));
    });
    return s;
  }

  reducePostfixExpression(node) {
    let s = super.reducePostfixExpression(...arguments);
    switch (node.operator) {
      case "++":
      case "--":
        if (!isValidSimpleAssignmentTarget(node.operand)) {
          s = s.addError(new EarlyError(node, "Increment/decrement target must be an identifier or member expression"));
        }
        break;
    }
    return s;
  }

  reducePrefixExpression(node) {
    let s = super.reducePrefixExpression(...arguments);
    switch (node.operator) {
      case "++":
      case "--":
        if (!isValidSimpleAssignmentTarget(node.operand)) {
          s = s.addError(new EarlyError(node, "Increment/decrement target must be an identifier or member expression"));
        }
        break;
      case "delete":
        if (node.operand.type === "IdentifierExpression") {
          s = s.addStrictError(new EarlyError(node, "Identifier expressions must not be deleted in strict mode"));
        }
        break;
    }
    return s;
  }

  reduceScript() {
    let s = super.reduceScript(...arguments)
      .enforceSuperCallExpressions(SUPERCALL_ERROR)
      .enforceSuperPropertyExpressions(SUPERPROPERTY_ERROR);
    s.newTargetExpressions.forEach(node => {
      s = s.addError(new EarlyError(node, "new.target must be within function (but not arrow expression) code"));
    });
    return s;
  }

  reduceSetter(node, {name, param, body}) {
    param = param.observeLexicalDeclaration();
    param.lexicallyDeclaredNames.forEachEntry((nodes, name) => {
      if (nodes.length > 1) {
        nodes.slice(1).forEach(dupeNode => {
          param = param.addError(new EarlyError(dupeNode, `Duplicate binding ${JSON.stringify(name)}`));
        });
      }
    });
    body.lexicallyDeclaredNames.forEachEntry((nodes, name) => {
      if (param.lexicallyDeclaredNames.has(name)) {
        nodes.forEach(dupeNode => {
          body = body.addError(new EarlyError(dupeNode, `Duplicate binding ${JSON.stringify(name)}`));
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
    return super.reduceSetter(node, {name, param, body})
      .observeVarBoundary();
  }

  reduceStaticMemberExpression(node) {
    let s = super.reduceStaticMemberExpression(...arguments);
    if (node.object.type === "Super") {
      s = s.observeSuperPropertyExpression(node);
    }
    return s;
  }

  reduceSwitchStatement(node, {discriminant, cases}) {
    let sCases = this.fold(cases)
      .functionDeclarationNamesAreLexical();
    sCases.lexicallyDeclaredNames.forEachEntry((nodes, name) => {
      if (nodes.length > 1) {
        nodes.slice(1).forEach(dupeNode => {
          sCases = sCases.addError(new EarlyError(dupeNode, `Duplicate binding ${JSON.stringify(name)}`));
        });
      }
      if (sCases.varDeclaredNames.has(name)) {
        nodes.forEach(dupeNode => {
          sCases = sCases.addError(new EarlyError(dupeNode, `Duplicate binding ${JSON.stringify(name)}`));
        });
      }
    });
    sCases = sCases.observeLexicalBoundary();
    let s = this.append(discriminant, sCases);
    s = s.clearFreeBreakStatements();
    return s;
  }

  reduceSwitchStatementWithDefault(node, {discriminant, preDefaultCases, defaultCase, postDefaultCases}) {
    let sCases = this.append(defaultCase, this.append(this.fold(preDefaultCases), this.fold(postDefaultCases)))
      .functionDeclarationNamesAreLexical();
    sCases.lexicallyDeclaredNames.forEachEntry((nodes, name) => {
      if (nodes.length > 1) {
        nodes.slice(1).forEach(dupeNode => {
          sCases = sCases.addError(new EarlyError(dupeNode, `Duplicate binding ${JSON.stringify(name)}`));
        });
      }
      if (sCases.varDeclaredNames.has(name)) {
        nodes.forEach(dupeNode => {
          sCases = sCases.addError(new EarlyError(dupeNode, `Duplicate binding ${JSON.stringify(name)}`));
        });
      }
    });
    sCases = sCases.observeLexicalBoundary();
    let s = this.append(discriminant, sCases);
    s = s.clearFreeBreakStatements();
    return s;
  }

  reduceVariableDeclaration(node) {
    let s = super.reduceVariableDeclaration(...arguments);
    switch(node.kind) {
      case "const":
      case "let": {
        s = s.observeLexicalDeclaration();
        s.lexicallyDeclaredNames.forEachEntry((nodes, name) => {
          if (nodes.length > 1) {
            nodes.slice(1).forEach(dupeNode => {
              s = s.addError(new EarlyError(dupeNode, `Duplicate binding ${JSON.stringify(name)}`));
            });
          }
          if (name === "let") {
            nodes.forEach(node => {
              s = s.addError(new EarlyError(node, "Lexical declarations must not have a binding named \"let\""));
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

  reduceVariableDeclarationStatement(node) {
    let s = super.reduceVariableDeclarationStatement(...arguments);
    switch (node.declaration.kind) {
      case "const":
        node.declaration.declarators.forEach(declarator => {
          if (declarator.init == null) {
            s = s.addError(new EarlyError(declarator, "Constant lexical declarations must have an initialiser"));
          }
        });
        break;
    }
    return s;
  }

  reduceWhileStatement(node) {
    let s = super.reduceWhileStatement(...arguments);
    if (isLabelledFunction(node.body)) {
      s = s.addError(new EarlyError(node.body, "The body of a while statement must not be a labeled function declaration"));
    }
    s = s.clearFreeContinueStatements().clearFreeBreakStatements();
    return s;
  }

  reduceWithStatement(node) {
    let s = super.reduceWithStatement(...arguments);
    if (isLabelledFunction(node.body)) {
      s = s.addError(new EarlyError(node.body, "The body of a with statement must not be a labeled function declaration"));
    }
    s = s.addStrictError(new EarlyError(node, "Strict mode code must not include a with statement"));
    return s;
  }


  static check(node) {
    return reduce(new EarlyErrorChecker, node).errors;
  }
}
