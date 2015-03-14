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

var Shift = require("shift-ast");
var ShiftParser = require("../../");

var testParseFailure = require("../assertions").testParseFailure;
var testParseModule = require("../assertions").testParseModule;
var testParseModuleFailure = require("../assertions").testParseModuleFailure;

var moduleItem = require("../helpers").moduleItem;
var locationSanityCheck = require("../helpers").locationSanityCheck;

function locationSanityTest(source) {
  test(source, function() {
    var tree = ShiftParser.parseModule(source, {loc: true});
    locationSanityCheck(tree);
  });
}

function testExportDecl(code, tree) {
  testParseModule(code, moduleItem, tree);
  locationSanityTest(code);
}

suite("Parser", function () {
  suite("export declaration", function () {

    testExportDecl("export * from \"a\"; var a;", new Shift.ExportAllFrom("a"));

    testExportDecl("export * from \"a\"; var a;", new Shift.ExportAllFrom("a"));

    testExportDecl("export {} from \"a\"; var a;", new Shift.ExportFrom([], "a"));

    testExportDecl("export {a} from \"a\"; var a;", new Shift.ExportFrom([
      new Shift.ExportSpecifier(null, "a")
    ], "a"));

    testExportDecl("export {a,} from \"a\"; var a;", new Shift.ExportFrom([
      new Shift.ExportSpecifier(null, "a")
    ], "a"));

    testExportDecl("export {a,b} from \"a\"; var a,b;", new Shift.ExportFrom([
      new Shift.ExportSpecifier(null, "a"),
      new Shift.ExportSpecifier(null, "b")
    ], "a"));

    testExportDecl("export {a as b} from \"a\"; var a;", new Shift.ExportFrom([
      new Shift.ExportSpecifier("a", "b")
    ], "a"));

    testExportDecl("export {as as as} from \"as\"; var as;", new Shift.ExportFrom([
      new Shift.ExportSpecifier("as", "as")
    ], "as"));

    testExportDecl("export {as as function} from \"as\"; var as;", new Shift.ExportFrom([
      new Shift.ExportSpecifier("as", "function")
    ], "as"));

    testExportDecl("export {a}\n var a;", new Shift.ExportFrom([
      new Shift.ExportSpecifier(null, "a")
    ], null));

    testExportDecl("export {a,}\n var a;", new Shift.ExportFrom([
      new Shift.ExportSpecifier(null, "a")
    ], null));

    testExportDecl("export {a,b,}\n var a,b;", new Shift.ExportFrom([
      new Shift.ExportSpecifier(null, "a"),
      new Shift.ExportSpecifier(null, "b")
    ], null));

    testExportDecl(
      "export var a = 0, b;",
      new Shift.Export(new Shift.VariableDeclaration("var", [
        new Shift.VariableDeclarator(
          { type: "BindingIdentifier", name: "a" },
          new Shift.LiteralNumericExpression(0)),
        new Shift.VariableDeclarator(
          { type: "BindingIdentifier", name: "b" },
          null)])));

    testExportDecl(
      "export const a = 0, b = 0;",
      new Shift.Export(new Shift.VariableDeclaration("const", [
        new Shift.VariableDeclarator(
          { type: "BindingIdentifier", name: "a" },
          new Shift.LiteralNumericExpression(0)),
        new Shift.VariableDeclarator(
          { type: "BindingIdentifier", name: "b" },
          new Shift.LiteralNumericExpression(0))])));

    testExportDecl(
      "export let a = 0, b = 0;",
      new Shift.Export(new Shift.VariableDeclaration("let", [
        new Shift.VariableDeclarator(
          { type: "BindingIdentifier", name: "a" },
          new Shift.LiteralNumericExpression(0)),
        new Shift.VariableDeclarator(
          { type: "BindingIdentifier", name: "b" },
          new Shift.LiteralNumericExpression(0))])));

    testExportDecl(
      "export let[a] = 0;",
      new Shift.Export(new Shift.VariableDeclaration("let", [
        new Shift.VariableDeclarator(
          new Shift.ArrayBinding([
            { type: "BindingIdentifier", name: "a" }
          ], null),
          new Shift.LiteralNumericExpression(0))
      ])));

    testExportDecl(
      "export class A{} /* no semi */ false",
      new Shift.Export(
        new Shift.ClassDeclaration(
          { type: "BindingIdentifier", name: "A" },
          null,
          []
        )));

    testExportDecl(
      "export function A(){} /* no semi */ false",
      new Shift.Export(
        { type: "FunctionDeclaration",
          isGenerator: false,
          name: { type: "BindingIdentifier", name: "A" },
          params: { type: "FormalParameters", items: [], rest: null },
          body: new Shift.FunctionBody([], [])
        }
      )
    );

    testExportDecl(
      "export default function (){} /* no semi */ false",
      new Shift.ExportDefault(
        { type: "FunctionDeclaration",
          isGenerator: false,
          name: { type: "BindingIdentifier", name: "*default*" },
          params: { type: "FormalParameters", items: [], rest: null },
          body: new Shift.FunctionBody([], [])
        }
      )
    );

    testExportDecl(
      "export default class {} /* no semi */ false",
      new Shift.ExportDefault(
        new Shift.ClassDeclaration(
          { type: "BindingIdentifier", name: "*default*" },
          null,
          []
        )));

    testExportDecl(
      "export default 3 + 1",
      new Shift.ExportDefault(
        new Shift.BinaryExpression("+", new Shift.LiteralNumericExpression(3), new Shift.LiteralNumericExpression(1))
      ));

    testExportDecl(
      "export default a",
      new Shift.ExportDefault(
        { type: "IdentifierExpression", name: "a" }
      ));

    testExportDecl("export default function a(){}", new Shift.ExportDefault(
      { type: "FunctionDeclaration",
        isGenerator: false,
        name: { type: "BindingIdentifier", name: "a" },
        params: { type: "FormalParameters", items: [], rest: null },
        body: new Shift.FunctionBody([], [])
      }
    ));

    testExportDecl("export default class a{}", new Shift.ExportDefault(
      new Shift.ClassDeclaration(
        { type: "BindingIdentifier", name: "a" },
        null,
        []
      )));

    testExportDecl("export default function* a(){}", new Shift.ExportDefault(
      { type: "FunctionDeclaration",
        isGenerator: true,
        name: { type: "BindingIdentifier", name: "a" },
        params: { type: "FormalParameters", items: [], rest: null },
        body: new Shift.FunctionBody([], [])
      }
    ));

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
