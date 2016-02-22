/**
 * Copyright 2016 Shape Security, Inc.
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

var testParse = require("../assertions").testParse;
var testParseModule = require("../assertions").testParseModule;
var stmt = require("../helpers").stmt;

var stmts = function(script) {
  return script.statements;
}

var items = function(module) {
  return module.items;
}

suite("Parser", function () {
  suite("semicolons after statements are consumed", function () {

    testParse("0\n;", stmts,
      [ { type: "ExpressionStatement",
        expression:
          { type: "LiteralNumericExpression",
            value: 0 } } ]
    );

    testParse("(0)\n;", stmts,
      [ { type: "ExpressionStatement",
          expression:
            { type: "LiteralNumericExpression",
              value: 0 } } ]
    );

    testParse("debugger\n;", stmts,
      [ { type: "DebuggerStatement" } ]
    );

    testParse("throw 0\n;", stmts,
      [ { type: "ThrowStatement",
          expression:
            { type: "LiteralNumericExpression",
              value: 0 } } ]
    );

    testParse("var x\n;", stmts,
      [ { type: "VariableDeclarationStatement",
        declaration:
          { type: "VariableDeclaration",
            kind: "var",
            declarators: [{ type: "VariableDeclarator", binding: { type: "BindingIdentifier", name: "x" }, init: null }] } } ]
    );

    testParse("while(true) { break\n; }", stmt,
      { type: "WhileStatement",
        test: { type: "LiteralBooleanExpression", value: true },
        body:
          { type: "BlockStatement",
            block: { type: "Block", statements: [
              { "type": "BreakStatement",
                "label": null } ] } } }
    );

    testParse("x: while(true) { break x\n; }", stmt,
      { type: "LabeledStatement", label: "x", body:
        { type: "WhileStatement",
          test: { type: "LiteralBooleanExpression", value: true },
          body:
            { type: "BlockStatement",
              block: { type: "Block", statements: [
                { "type": "BreakStatement",
                  "label": "x" } ] } } } }
    );

    testParse("while(true) { continue\n; }", stmt,
      { type: "WhileStatement",
        test: { type: "LiteralBooleanExpression", value: true },
        body:
          { type: "BlockStatement",
            block: { type: "Block", statements: [
              { "type": "ContinueStatement",
                "label": null } ] } } }
    );

    testParse("x: while(true) { continue x\n; }", stmt,
      { type: "LabeledStatement", label: "x", body:
        { type: "WhileStatement",
          test: { type: "LiteralBooleanExpression", value: true },
          body:
            { type: "BlockStatement",
              block: { type: "Block", statements: [
                { "type": "ContinueStatement",
                  "label": "x" } ] } } } }
    );

    testParse("function f() { return\n; }", stmt,
      { type: "FunctionDeclaration",
        isGenerator: false,
        name: { type: "BindingIdentifier", name: "f" },
        params: { type: "FormalParameters", items: [], rest: null },
        body: { type: "FunctionBody", directives: [], statements: [
          { type: "ReturnStatement", expression: null } ] } }
    );

    testParse("function f() { return null\n; }", stmt,
      { type: "FunctionDeclaration",
        isGenerator: false,
        name: { type: "BindingIdentifier", name: "f" },
        params: { type: "FormalParameters", items: [], rest: null },
        body: { type: "FunctionBody", directives: [], statements: [
          { type: "ReturnStatement", expression: { type: "LiteralNullExpression" } } ] } }
    );

    testParse("function* f() { yield\n; }", stmt,
      { type: "FunctionDeclaration",
        isGenerator: true,
        name: { type: "BindingIdentifier", name: "f" },
        params: { type: "FormalParameters", items: [], rest: null },
        body: { type: "FunctionBody", directives: [], statements: [
          { type: "ExpressionStatement", expression:
            { type: "YieldExpression", expression: null } } ] } }
    );

    testParse("if(a)b\n;else c;", stmt,
      { type: "IfStatement",
        test: { type: "IdentifierExpression", name: "a" },
        consequent:
          { type: "ExpressionStatement",
            expression: { type: "IdentifierExpression", name: "b" } },
        alternate:
          { type: "ExpressionStatement",
            expression: { type: "IdentifierExpression", name: "c" } } }
    );

  });

  suite("semicolons after imports & exports are consumed as appropriate", function () {

    testParseModule("import \"a\"\n;", items,
      [ { type: "Import", defaultBinding: null, namedImports: [], moduleSpecifier: "a" } ]
    );

    testParseModule("import x from \"a\"\n;", items,
      [ { type: "Import", defaultBinding: { type: "BindingIdentifier", name: "x" }, namedImports: [], moduleSpecifier: "a" } ]
    );

    testParseModule("import x, {} from \"a\"\n;", items,
      [ { type: "Import", defaultBinding: { type: "BindingIdentifier", name: "x" }, namedImports: [], moduleSpecifier: "a" } ]
    );

    testParseModule("import * as x from \"a\"\n;", items,
      [ { type: "ImportNamespace", defaultBinding: null, namespaceBinding: { type: "BindingIdentifier", name: "x" }, moduleSpecifier: "a" } ]
    );

    testParseModule("export {}\n;", items,
      [ { type: "ExportFrom", namedExports: [], moduleSpecifier: null } ]
    );

    testParseModule("export {} from \"a\"\n;", items,
      [ { type: "ExportFrom", namedExports: [], moduleSpecifier: "a" } ]
    );

    testParseModule("export * from \"a\"\n;", items,
      [ { type: "ExportAllFrom", moduleSpecifier: "a" } ]
    );

    testParseModule("export var x\n;", items,
      [ { type: "Export", declaration:
          { type: "VariableDeclaration",
            kind: "var",
            declarators: [{ type: "VariableDeclarator", binding: { type: "BindingIdentifier", name: "x" }, init: null }] } } ]
    );

  });

  suite("semicolons after export declarations are not consumed", function () {

    testParseModule("export function f(){}\n;", items,
      [ { type: "Export", declaration:
          { type: "FunctionDeclaration",
            isGenerator: false,
            name: { type: "BindingIdentifier", name: "f" },
            params: { type: "FormalParameters", items: [], rest: null },
            body: { type: "FunctionBody", directives: [], statements: [] } } },
        { type: "EmptyStatement" } ]
    );

    testParseModule("export class A {}\n;", items,
      [ { type: "Export", declaration:
          { type: "ClassDeclaration",
            name: { type: "BindingIdentifier", name: "A" },
            super: null,
            elements: [] } },
        { type: "EmptyStatement" } ]
    );

  });

});
