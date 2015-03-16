/**
 * Copyright 2015 Shape Security, Inc.
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

var ShiftParser = require("../../");

var testParseFailure = require("../assertions").testParseFailure;
var testParseModule = require("../assertions").testParseModule;
var testParseModuleFailure = require("../assertions").testParseModuleFailure;

var moduleItem = require("../helpers").moduleItem;

function locationSanityTest(source) {
  test(source, function() {
    var tree = ShiftParser.parseModule(source, {loc: true});
  });
}

function testExportDecl(code, tree) {
  testParseModule(code, moduleItem, tree);
  locationSanityTest(code);
}

suite("Parser", function () {
  suite("export declaration", function () {

    testExportDecl("export * from \"a\"; var a;", { type: "ExportAllFrom", moduleSpecifier: "a" });

    testExportDecl("export * from \"a\"; var a;", { type: "ExportAllFrom", moduleSpecifier: "a" });

    testExportDecl("export {} from \"a\"; var a;", { type: "ExportFrom", namedExports: [], moduleSpecifier: "a" });

    testExportDecl("export {a} from \"a\"; var a;", {
      type: "ExportFrom",
      namedExports: [{ type: "ExportSpecifier", name: null, exportedName: "a" }],
      moduleSpecifier: "a"
    });

    testExportDecl("export {a,} from \"a\"; var a;", {
      type: "ExportFrom",
      namedExports: [{ type: "ExportSpecifier", name: null, exportedName: "a" }],
      moduleSpecifier: "a"
    });

    testExportDecl("export {a,b} from \"a\"; var a,b;", {
      type: "ExportFrom",
      namedExports: [{ type: "ExportSpecifier", name: null, exportedName: "a" }, {
        type: "ExportSpecifier",
        name: null,
        exportedName: "b"
      }],
      moduleSpecifier: "a"
    });

    testExportDecl("export {a as b} from \"a\"; var a;", {
      type: "ExportFrom",
      namedExports: [{ type: "ExportSpecifier", name: "a", exportedName: "b" }],
      moduleSpecifier: "a"
    });

    testExportDecl("export {as as as} from \"as\"; var as;", {
      type: "ExportFrom",
      namedExports: [{ type: "ExportSpecifier", name: "as", exportedName: "as" }],
      moduleSpecifier: "as"
    });

    testExportDecl("export {as as function} from \"as\"; var as;", {
      type: "ExportFrom",
      namedExports: [{ type: "ExportSpecifier", name: "as", exportedName: "function" }],
      moduleSpecifier: "as"
    });

    testExportDecl("export {a}\n var a;", {
      type: "ExportFrom",
      namedExports: [{ type: "ExportSpecifier", name: null, exportedName: "a" }],
      moduleSpecifier: null
    });

    testExportDecl("export {a,}\n var a;", {
      type: "ExportFrom",
      namedExports: [{ type: "ExportSpecifier", name: null, exportedName: "a" }],
      moduleSpecifier: null
    });

    testExportDecl("export {a,b,}\n var a,b;", {
      type: "ExportFrom",
      namedExports: [{ type: "ExportSpecifier", name: null, exportedName: "a" }, {
        type: "ExportSpecifier",
        name: null,
        exportedName: "b"
      }],
      moduleSpecifier: null
    });

    testExportDecl(
      "export var a = 0, b;",
      {
        type: "Export",
        declaration: {
          type: "VariableDeclaration",
          kind: "var",
          declarators: [{
            type: "VariableDeclarator",
            binding: { type: "BindingIdentifier", name: "a" },
            init: { type: "LiteralNumericExpression", value: 0 }
          }, { type: "VariableDeclarator", binding: { type: "BindingIdentifier", name: "b" }, init: null }]
        }
      });

    testExportDecl(
      "export const a = 0, b = 0;",
      {
        type: "Export",
        declaration: {
          type: "VariableDeclaration",
          kind: "const",
          declarators: [{
            type: "VariableDeclarator",
            binding: { type: "BindingIdentifier", name: "a" },
            init: { type: "LiteralNumericExpression", value: 0 }
          }, {
            type: "VariableDeclarator",
            binding: { type: "BindingIdentifier", name: "b" },
            init: { type: "LiteralNumericExpression", value: 0 }
          }]
        }
      });

    testExportDecl(
      "export let a = 0, b = 0;",
      {
        type: "Export",
        declaration: {
          type: "VariableDeclaration",
          kind: "let",
          declarators: [{
            type: "VariableDeclarator",
            binding: { type: "BindingIdentifier", name: "a" },
            init: { type: "LiteralNumericExpression", value: 0 }
          }, {
            type: "VariableDeclarator",
            binding: { type: "BindingIdentifier", name: "b" },
            init: { type: "LiteralNumericExpression", value: 0 }
          }]
        }
      });

    testExportDecl(
      "export let[a] = 0;",
      {
        type: "Export",
        declaration: {
          type: "VariableDeclaration",
          kind: "let",
          declarators: [{
            type: "VariableDeclarator",
            binding: { type: "ArrayBinding", elements: [{ type: "BindingIdentifier", name: "a" }], restElement: null },
            init: { type: "LiteralNumericExpression", value: 0 }
          }]
        }
      });

    testExportDecl(
      "export class A{} /* no semi */ false",
      {
        type: "Export",
        declaration: {
          type: "ClassDeclaration",
          name: { type: "BindingIdentifier", name: "A" },
          super: null,
          elements: []
        }
      });

    testExportDecl(
      "export function A(){} /* no semi */ false",
      {
        type: "Export",
        declaration: {
          type: "FunctionDeclaration",
          isGenerator: false,
          name: { type: "BindingIdentifier", name: "A" },
          params: { type: "FormalParameters", items: [], rest: null },
          body: { type: "FunctionBody", directives: [], statements: [] }
        }
      }
    );

    testExportDecl(
      "export default function (){} /* no semi */ false",
      {
        type: "ExportDefault",
        body: {
          type: "FunctionDeclaration",
          isGenerator: false,
          name: { type: "BindingIdentifier", name: "*default*" },
          params: { type: "FormalParameters", items: [], rest: null },
          body: { type: "FunctionBody", directives: [], statements: [] }
        }
      }
    );

    testExportDecl(
      "export default class {} /* no semi */ false",
      {
        type: "ExportDefault",
        body: {
          type: "ClassDeclaration",
          name: { type: "BindingIdentifier", name: "*default*" },
          super: null,
          elements: []
        }
      });

    testExportDecl(
      "export default 3 + 1",
      {
        type: "ExportDefault",
        body: {
          type: "BinaryExpression",
          operator: "+",
          left: { type: "LiteralNumericExpression", value: 3 },
          right: { type: "LiteralNumericExpression", value: 1 }
        }
      });

    testExportDecl(
      "export default a",
      { type: "ExportDefault", body: { type: "IdentifierExpression", name: "a" } });

    testExportDecl("export default function a(){}", {
      type: "ExportDefault",
      body: {
        type: "FunctionDeclaration",
        isGenerator: false,
        name: { type: "BindingIdentifier", name: "a" },
        params: { type: "FormalParameters", items: [], rest: null },
        body: { type: "FunctionBody", directives: [], statements: [] }
      }
    });

    testExportDecl("export default class a{}", {
      type: "ExportDefault",
      body: { type: "ClassDeclaration", name: { type: "BindingIdentifier", name: "a" }, super: null, elements: [] }
    });

    testExportDecl("export default function* a(){}", {
      type: "ExportDefault",
      body: {
        type: "FunctionDeclaration",
        isGenerator: true,
        name: { type: "BindingIdentifier", name: "a" },
        params: { type: "FormalParameters", items: [], rest: null },
        body: { type: "FunctionBody", directives: [], statements: [] }
      }
    });

    testParseFailure("export * from \"a\"", "Unexpected token export");
    testParseModuleFailure("{export default 3}", "Unexpected token export");
    testParseModuleFailure("while (1) export default 3", "Unexpected token export");
    testParseModuleFailure("export", "Unexpected end of input");
    testParseModuleFailure("export ", "Unexpected end of input");
    testParseModuleFailure("export;", "Unexpected token ;");
    testParseModuleFailure("export {,,}", "Unexpected token ,");
    testParseModuleFailure("export {a,,}", "Unexpected token ,");
    testParseModuleFailure("export {a,,b}", "Unexpected token ,");
    testParseModuleFailure("export {a,b} from", "Unexpected end of input");
    testParseModuleFailure("export {a,b} from a", "Unexpected identifier");
    testParseModuleFailure("export {a as} from a", "Unexpected token }");
    testParseModuleFailure("export {as b} from a", "Unexpected identifier");
    testParseModuleFailure("export {function} from a", "Unexpected token function");
    testParseModuleFailure("export {function as a} from a", "Unexpected token function");
    testParseModuleFailure("export * from a", "Unexpected identifier");
    testParseModuleFailure("export / from a", "Unexpected token /");
    testParseModuleFailure("export * From \"a\"", "Unexpected identifier");
    testParseModuleFailure("export let[a] = 0 export let[b] = 0", "Unexpected token export");
    testParseModuleFailure("export 3", "Unexpected number");
    testParseModuleFailure("export function () {}", "Unexpected token (");
    testParseModuleFailure("export default default", "Unexpected token default");
    testParseModuleFailure("export default function", "Unexpected end of input");
    testParseModuleFailure("export default let", "Unexpected token let");
  });
});
