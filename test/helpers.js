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

var expect = require("expect.js");

function stmt(program) {
  return program.body.statements[0];
}

function expr(program) {
  return stmt(program).expression;
}


var LT = -1, EQ = 0, GT = 1;

var SPEC = {
  ArrayBinding: ["elements", "restElement"],
  ArrayExpression: ["elements"],
  ArrowExpression: ["parameters", "restParameter", "body"],
  AssignmentExpression: ["operator", "binding", "expression"],
  BinaryExpression: ["operator", "left", "right"],
  BindingIdentifier: ["name"],
  BindingPropertyIdentifier: ["binding", "init"],
  BindingPropertyProperty: ["name", "binding"],
  BindingWithDefault: ["binding", "init"],
  Block: ["statements"],
  BlockStatement: ["block"],
  BreakStatement: ["label"],
  CallExpression: ["callee", "arguments"],
  CatchClause: ["binding", "body"],
  ClassDeclaration: ["name", "super", "elements"],
  ClassElement: ["isStatic", "method"],
  ClassExpression: ["name", "super", "elements"],
  ComputedMemberExpression: ["object", "expression"],
  ComputedPropertyName: ["expression"],
  ConditionalExpression: ["test", "consequent", "alternate"],
  ContinueStatement: ["label"],
  DataProperty: ["name", "expression"],
  DebuggerStatement: [],
  Directive: ["rawValue"],
  DoWhileStatement: ["body", "test"],
  EmptyStatement: [],
  Export: ["declaration"],
  ExportAllFrom: ["moduleSpecifier"],
  ExportDefault: ["value"],
  ExportFrom: ["namedExports", "moduleSpecifier"],
  ExportSpecifier: ["name", "exportedName"],
  ExpressionStatement: ["expression"],
  ForInStatement: ["left", "right", "body"],
  ForOfStatement: ["left", "right", "body"],
  ForStatement: ["init", "test", "update", "body"],
  FunctionBody: ["directives", "statements"],
  FunctionDeclaration: ["isGenerator", "name", "parameters", "restParameter", "body"],
  FunctionExpression: ["isGenerator", "name", "parameters", "restParameter", "body"],
  Getter: ["name", "body"],
  IdentifierExpression: ["name"],
  IfStatement: ["test", "consequent", "alternate"],
  Import: ["defaultBinding", "namedImports", "moduleSpecifier"],
  ImportNamespace: ["defaultBinding", "namespaceBinding", "moduleSpecifier"],
  ImportSpecifier: ["name", "binding"],
  LabeledStatement: ["label", "body"],
  LiteralBooleanExpression: ["value"],
  LiteralInfinityExpression: [],
  LiteralNullExpression: [],
  LiteralNumericExpression: ["value"],
  LiteralRegExpExpression: ["pattern", "flags"],
  LiteralStringExpression: ["value"],
  Method: ["isGenerator", "name", "parameters", "restParameter", "body"],
  Module: ["items"],
  NamedImports: ["importSpecifiers"],
  NewExpression: ["callee", "arguments"],
  NewTargetExpression: [],
  ObjectBinding: ["properties"],
  ObjectExpression: ["properties"],
  PostfixExpression: ["operand", "operator"],
  PrefixExpression: ["operator", "operand"],
  ReturnStatement: ["expression"],
  Script: ["body"],
  Setter: ["name", "parameter", "body"],
  ShorthandProperty: ["name"],
  SourceLocation: ["offset", "line", "column"],
  SourceSpan: ["start", "end", "source"],
  SpreadElement: ["expression"],
  StaticMemberExpression: ["object", "property"],
  StaticPropertyName: ["value"],
  Super: [],
  SwitchCase: ["test", "consequent"],
  SwitchDefault: ["consequent"],
  SwitchStatement: ["discriminant", "cases"],
  SwitchStatementWithDefault: ["discriminant", "preDefaultCases", "defaultCase", "postDefaultCases"],
  TemplateElement: ["rawValue"],
  TemplateExpression: ["tag", "elements"],
  ThisExpression: [],
  ThrowStatement: ["expression"],
  TryCatchStatement: ["body", "catchClause"],
  TryFinallyStatement: ["body", "catchClause", "finalizer"],
  VariableDeclaration: ["kind", "declarators"],
  VariableDeclarationStatement: ["declaration"],
  VariableDeclarator: ["binding", "init"],
  WhileStatement: ["test", "body"],
  WithStatement: ["object", "body"],
  YieldExpression: ["expression"],
  YieldGeneratorExpression: ["expression"],
};

function sourceLocationCompare(loc1, loc2) {
  if (loc1.offset < loc2.offset) {
    if (loc1.line < loc2.line || loc1.line === loc2.line && loc1.column < loc2.column) {
      return LT;
    }
  } else if (loc1.offset === loc2.offset) {
    if (loc1.line === loc2.line && loc1.column === loc2.column) {
      return EQ;
    }
  } else {
    if (loc1.line > loc2.line || loc1.line === loc2.line && loc1.column > loc2.column) {
      return GT;
    }
  }
  expect().fail("inconsistent location information.");
}

function expectSourceSpanContains(parent, loc) {
  if (sourceLocationCompare(parent.start, loc.start) > EQ || sourceLocationCompare(parent.end, loc.end) < EQ) {
    expect().fail("Parent does not include child");
  }
}

function moduleItem(mod) {
  return mod.items[0];
}

function checkLocation(loc) {
  if (!loc) {
    expect().fail("Node has no location");
  }
  if (loc.start.column < 0 ||
    loc.start.line < 0 ||
    loc.start.offset < 0 ||
    loc.end.column < 0 ||
    loc.end.line < 0 ||
    loc.end.offset < 0) {
    expect().fail("Illegal location information");
  }
}

function locationSanityCheck(node, parentSpan, prevLocation) {
  var loc = node.loc;

  checkLocation(node.loc);

  var compareEnds = sourceLocationCompare(node.loc.start, node.loc.end);
  if (compareEnds === GT) {
    expect().fail("Location information indicates that the node has negative length");
  }

  if (prevLocation) {
    if (sourceLocationCompare(prevLocation, loc.start) > EQ) {
      expect().fail("Nodes overlap");
    }
  }
  if (parentSpan) {
    expectSourceSpanContains(parentSpan, loc);
  }
  var last = null;
  for (var i = 0; i < SPEC[node.type].length; i++) {
    var field = SPEC[node.type][i];
    if (!node[field]) return;
    if (typeof node[field].type === "string") {  // subnode
      locationSanityCheck(node[field], loc, last);
      last = node[field].loc.end;
    } else if (Array.isArray(node[field])) {
      var childList = node[field];
      for (var j = 0; j < childList.length; j++) {
        var child = childList[j];
        if (!child) return;
        locationSanityCheck(child, loc, last);
        last = child.loc.end;
      }
    }
  }
}

exports.moduleItem = moduleItem;
exports.expr = expr;
exports.stmt = stmt;
exports.locationSanityCheck = locationSanityCheck;
