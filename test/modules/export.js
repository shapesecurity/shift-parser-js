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

var testParseFailure = require('../assertions').testParseFailure;
var testParseModule = require('../assertions').testParseModule;
var testParseModuleFailure = require('../assertions').testParseModuleFailure;

var moduleItem = require("../helpers").moduleItem;
var locationSanityCheck = require('../helpers').locationSanityCheck;

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

    testExportDecl('export * from "a"', new Shift.ExportAllFrom("a"));

    testExportDecl('export * from "a";', new Shift.ExportAllFrom("a"));

    testExportDecl('export {} from "a"', new Shift.ExportFrom([], "a"));

    testExportDecl('export {a} from "a"', new Shift.ExportFrom([
      new Shift.ExportSpecifier(null, new Shift.Identifier('a'))
    ], "a"));

    testExportDecl('export {a,} from "a"', new Shift.ExportFrom([
      new Shift.ExportSpecifier(null, new Shift.Identifier('a'))
    ], "a"));

    testExportDecl('export {a,b} from "a"', new Shift.ExportFrom([
      new Shift.ExportSpecifier(null, new Shift.Identifier('a')),
      new Shift.ExportSpecifier(null, new Shift.Identifier('b'))
    ], "a"));

    testExportDecl('export {a as b} from "a"', new Shift.ExportFrom([
      new Shift.ExportSpecifier(new Shift.Identifier('a'), new Shift.Identifier('b'))
    ], "a"));

    testExportDecl('export {as as as} from "as"', new Shift.ExportFrom([
      new Shift.ExportSpecifier(new Shift.Identifier('as'), new Shift.Identifier('as'))
    ], "as"));

    testExportDecl('export {as as function} from "as"', new Shift.ExportFrom([
      new Shift.ExportSpecifier(new Shift.Identifier('as'), new Shift.Identifier('function'))
    ], "as"));

    testExportDecl('export {a}', new Shift.ExportFrom([
      new Shift.ExportSpecifier(null, new Shift.Identifier('a'))
    ], null));

    testExportDecl('export {a,}', new Shift.ExportFrom([
      new Shift.ExportSpecifier(null, new Shift.Identifier('a'))
    ], null));

    testExportDecl('export {a,b,}', new Shift.ExportFrom([
      new Shift.ExportSpecifier(null, new Shift.Identifier('a')),
      new Shift.ExportSpecifier(null, new Shift.Identifier('b'))
    ], null));

    testExportDecl(
      'export var a = 0, b;',
      new Shift.Export(new Shift.VariableDeclaration('var', [
        new Shift.VariableDeclarator(
          new Shift.BindingIdentifier(new Shift.Identifier('a')),
          new Shift.LiteralNumericExpression(0)),
        new Shift.VariableDeclarator(
          new Shift.BindingIdentifier(new Shift.Identifier('b')),
          null)])));

    testExportDecl(
      'export const a = 0, b = 0;',
      new Shift.Export(new Shift.VariableDeclaration('const', [
        new Shift.VariableDeclarator(
          new Shift.BindingIdentifier(new Shift.Identifier('a')),
          new Shift.LiteralNumericExpression(0)),
        new Shift.VariableDeclarator(
          new Shift.BindingIdentifier(new Shift.Identifier('b')),
          new Shift.LiteralNumericExpression(0))])));

    testExportDecl(
      'export let a = 0, b = 0;',
      new Shift.Export(new Shift.VariableDeclaration('let', [
        new Shift.VariableDeclarator(
          new Shift.BindingIdentifier(new Shift.Identifier('a')),
          new Shift.LiteralNumericExpression(0)),
        new Shift.VariableDeclarator(
          new Shift.BindingIdentifier(new Shift.Identifier('b')),
          new Shift.LiteralNumericExpression(0))])));

    testExportDecl(
      'export let[a] = 0;',
      new Shift.Export(new Shift.VariableDeclaration('let', [
        new Shift.VariableDeclarator(
          new Shift.ArrayBinding([
            new Shift.BindingIdentifier(new Shift.Identifier('a'))
          ], null),
          new Shift.LiteralNumericExpression(0))
      ])));

    testExportDecl(
      'export class A{} /* no semi */ false',
      new Shift.Export(
        new Shift.ClassDeclaration(
          new Shift.BindingIdentifier(new Shift.Identifier("A")),
          null,
          []
        )));

    testExportDecl(
      'export function A(){} /* no semi */ false',
      new Shift.Export(
        new Shift.FunctionDeclaration(
          false,
          new Shift.BindingIdentifier(new Shift.Identifier("A")),
          [],
          null,
          new Shift.FunctionBody([], []))));

    testExportDecl(
      'export default function (){} /* no semi */ false',
      new Shift.ExportDefault(
        new Shift.FunctionDeclaration(
          false,
          new Shift.BindingIdentifier(new Shift.Identifier("*default*")),
          [],
          null,
          new Shift.FunctionBody([], []))));

    testExportDecl(
      'export default class {} /* no semi */ false',
      new Shift.ExportDefault(
        new Shift.ClassDeclaration(
          new Shift.BindingIdentifier(new Shift.Identifier("*default*")),
          null,
          []
        )));

    testExportDecl(
      'export default 3 + 1',
      new Shift.ExportDefault(
        new Shift.BinaryExpression("+", new Shift.LiteralNumericExpression(3), new Shift.LiteralNumericExpression(1))
      ));

    testParseFailure('export * from "a"', 'Unexpected token export');
    testParseModuleFailure('{export default 3}', 'Unexpected token export');
    testParseModuleFailure('while (1) export default 3', 'Unexpected token export');
    testParseModuleFailure('export', 'Unexpected end of input');
    testParseModuleFailure('export ', 'Unexpected end of input');
    testParseModuleFailure('export;', 'Unexpected token ;');
    testParseModuleFailure('export {,,}', 'Unexpected token ,');
    testParseModuleFailure('export {a,,}', 'Unexpected token ,');
    testParseModuleFailure('export {a,,b}', 'Unexpected token ,');
    testParseModuleFailure('export {a,b} from', 'Unexpected end of input');
    testParseModuleFailure('export {a,b} from a', 'Unexpected identifier');
    testParseModuleFailure('export {a as} from a', 'Unexpected token }');
    testParseModuleFailure('export {as b} from a', 'Unexpected identifier');
    testParseModuleFailure('export {function} from a', 'Unexpected token function');
    testParseModuleFailure('export {function as a} from a', 'Unexpected token function');
    testParseModuleFailure('export * from a', 'Unexpected identifier');
    testParseModuleFailure('export / from a', 'Unexpected token /');
    testParseModuleFailure('export * From "a"', 'Unexpected identifier');
    testParseModuleFailure('export let[a] = 0 export let[a] = 0', 'Unexpected token export');
    testParseModuleFailure('export 3', 'Unexpected number');
    testParseModuleFailure('export function () {}', 'Unexpected token (');
    testParseModuleFailure('export default default', 'Unexpected token default');
    testParseModuleFailure('export default function', 'Unexpected end of input');
    testParseModuleFailure('export default let', 'Unexpected token let');
    testParseModuleFailure('export default function a(){}', 'Unexpected identifier');
    testParseModuleFailure('export default class a{}', 'Unexpected identifier');
    testParseModuleFailure('export default function* a{}', 'Unexpected identifier');

  });
});
