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

let testParseFailure = require('../assertions').testParseFailure;
let testParseModule = require('../assertions').testParseModule;
let testParseModuleFailure = require('../assertions').testParseModuleFailure;

let moduleItem = require('../helpers').moduleItem;

function testExportDecl(code, tree) {
  testParseModule(code, moduleItem, tree);
}

function id(x) {
  return x;
}

suite('Parser', () => {
  suite('export declaration', () => {

    testExportDecl('export * from "a"', { type: 'ExportAllFrom', moduleSpecifier: 'a' });

    testExportDecl('export {} from "a"', { type: 'ExportFrom', namedExports: [], moduleSpecifier: 'a' });

    testExportDecl('export {a} from "a"', {
      type: 'ExportFrom',
      namedExports: [{ type: 'ExportFromSpecifier', name: 'a', exportedName: null }],
      moduleSpecifier: 'a',
    });

    testExportDecl('export {with} from "a"', {
      type: 'ExportFrom',
      namedExports: [{ type: 'ExportFromSpecifier', name: 'with', exportedName: null }],
      moduleSpecifier: 'a',
    });

    testExportDecl('export {a,} from "a"', {
      type: 'ExportFrom',
      namedExports: [{ type: 'ExportFromSpecifier', name: 'a', exportedName: null }],
      moduleSpecifier: 'a',
    });

    testExportDecl('export {a,b} from "a"', {
      type: 'ExportFrom',
      namedExports: [{ type: 'ExportFromSpecifier', name: 'a', exportedName: null }, {
        type: 'ExportFromSpecifier',
        name: 'b',
        exportedName: null,
      }],
      moduleSpecifier: 'a',
    });

    testExportDecl('export {a as b} from "a"', {
      type: 'ExportFrom',
      namedExports: [{ type: 'ExportFromSpecifier', name: 'a', exportedName: 'b' }],
      moduleSpecifier: 'a',
    });

    testExportDecl('export {with as a} from "a"', {
      type: 'ExportFrom',
      namedExports: [{ type: 'ExportFromSpecifier', name: 'with', exportedName: 'a' }],
      moduleSpecifier: 'a',
    });

    testExportDecl('export {as as as} from "as"', {
      type: 'ExportFrom',
      namedExports: [{ type: 'ExportFromSpecifier', name: 'as', exportedName: 'as' }],
      moduleSpecifier: 'as',
    });

    testExportDecl('export {as as function} from "as"', {
      type: 'ExportFrom',
      namedExports: [{ type: 'ExportFromSpecifier', name: 'as', exportedName: 'function' }],
      moduleSpecifier: 'as',
    });

    testExportDecl('export {a} from "m"', {
      type: 'ExportFrom',
      namedExports: [{ type: 'ExportFromSpecifier', name: 'a', exportedName: null }],
      moduleSpecifier: 'm',
    });

    testExportDecl('export {if as var} from "a";', {
      type: 'ExportFrom',
      namedExports: [{ type: 'ExportFromSpecifier', name: 'if', exportedName: 'var' }],
      moduleSpecifier: 'a',
    });

    testExportDecl('export {a}\n var a;', {
      type: 'ExportLocals',
      namedExports: [{ type: 'ExportLocalSpecifier',
        name: { type: 'IdentifierExpression', name: 'a' }, exportedName: null }],
    });

    testExportDecl('export {a,}\n var a;', {
      type: 'ExportLocals',
      namedExports: [{ type: 'ExportLocalSpecifier',
        name: { type: 'IdentifierExpression', name: 'a' }, exportedName: null }],
    });

    testExportDecl('export {a,b,}\n var a,b;', {
      type: 'ExportLocals',
      namedExports: [{ type: 'ExportLocalSpecifier', name: { type: 'IdentifierExpression', name: 'a' },
        exportedName: null }, {
        type: 'ExportLocalSpecifier',
        name: { type: 'IdentifierExpression', name: 'b' },
        exportedName: null,
      }],
    });

    testExportDecl(
      'export var a = 0, b;',
      {
        type: 'Export',
        declaration: {
          type: 'VariableDeclaration',
          kind: 'var',
          declarators: [{
            type: 'VariableDeclarator',
            binding: { type: 'BindingIdentifier', name: 'a' },
            init: { type: 'LiteralNumericExpression', value: 0 },
          }, { type: 'VariableDeclarator', binding: { type: 'BindingIdentifier', name: 'b' }, init: null }],
        },
      });

    testExportDecl(
      'export const a = 0, b = 0;',
      {
        type: 'Export',
        declaration: {
          type: 'VariableDeclaration',
          kind: 'const',
          declarators: [{
            type: 'VariableDeclarator',
            binding: { type: 'BindingIdentifier', name: 'a' },
            init: { type: 'LiteralNumericExpression', value: 0 },
          }, {
            type: 'VariableDeclarator',
            binding: { type: 'BindingIdentifier', name: 'b' },
            init: { type: 'LiteralNumericExpression', value: 0 },
          }],
        },
      });

    testExportDecl(
      'export let a = 0, b = 0;',
      {
        type: 'Export',
        declaration: {
          type: 'VariableDeclaration',
          kind: 'let',
          declarators: [{
            type: 'VariableDeclarator',
            binding: { type: 'BindingIdentifier', name: 'a' },
            init: { type: 'LiteralNumericExpression', value: 0 },
          }, {
            type: 'VariableDeclarator',
            binding: { type: 'BindingIdentifier', name: 'b' },
            init: { type: 'LiteralNumericExpression', value: 0 },
          }],
        },
      });

    testExportDecl(
      'export let[a] = 0;',
      {
        type: 'Export',
        declaration: {
          type: 'VariableDeclaration',
          kind: 'let',
          declarators: [{
            type: 'VariableDeclarator',
            binding: { type: 'ArrayBinding', elements: [{ type: 'BindingIdentifier', name: 'a' }], rest: null },
            init: { type: 'LiteralNumericExpression', value: 0 },
          }],
        },
      });

    testExportDecl(
      'export class A{} /* no semi */ false',
      {
        type: 'Export',
        declaration: {
          type: 'ClassDeclaration',
          name: { type: 'BindingIdentifier', name: 'A' },
          super: null,
          elements: [],
        },
      });

    testExportDecl(
      'export function A(){} /* no semi */ false',
      {
        type: 'Export',
        declaration: {
          type: 'FunctionDeclaration',
          isGenerator: false,
          name: { type: 'BindingIdentifier', name: 'A' },
          params: { type: 'FormalParameters', items: [], rest: null },
          body: { type: 'FunctionBody', directives: [], statements: [] },
        },
      }
    );

    testExportDecl(
      'export default function (){} /* no semi */ false',
      {
        type: 'ExportDefault',
        body: {
          type: 'FunctionDeclaration',
          isGenerator: false,
          name: { type: 'BindingIdentifier', name: '*default*' },
          params: { type: 'FormalParameters', items: [], rest: null },
          body: { type: 'FunctionBody', directives: [], statements: [] },
        },
      }
    );

    testExportDecl(
      'export default class {} /* no semi */ false',
      {
        type: 'ExportDefault',
        body: {
          type: 'ClassDeclaration',
          name: { type: 'BindingIdentifier', name: '*default*' },
          super: null,
          elements: [],
        },
      });

    testExportDecl(
      'export default 3 + 1',
      {
        type: 'ExportDefault',
        body: {
          type: 'BinaryExpression',
          operator: '+',
          left: { type: 'LiteralNumericExpression', value: 3 },
          right: { type: 'LiteralNumericExpression', value: 1 },
        },
      });

    testExportDecl(
      'export default a',
      { type: 'ExportDefault', body: { type: 'IdentifierExpression', name: 'a' } });

    testExportDecl('export default function a(){}', {
      type: 'ExportDefault',
      body: {
        type: 'FunctionDeclaration',
        isGenerator: false,
        name: { type: 'BindingIdentifier', name: 'a' },
        params: { type: 'FormalParameters', items: [], rest: null },
        body: { type: 'FunctionBody', directives: [], statements: [] },
      },
    });

    testExportDecl('export default class a{}', {
      type: 'ExportDefault',
      body: { type: 'ClassDeclaration', name: { type: 'BindingIdentifier', name: 'a' }, super: null, elements: [] },
    });

    testExportDecl('export default function* a(){}', {
      type: 'ExportDefault',
      body: {
        type: 'FunctionDeclaration',
        isGenerator: true,
        name: { type: 'BindingIdentifier', name: 'a' },
        params: { type: 'FormalParameters', items: [], rest: null },
        body: { type: 'FunctionBody', directives: [], statements: [] },
      },
    });

    testParseModule('export default 0;0', id,
      { type: 'Module', directives: [], items: [
        { type: 'ExportDefault', body: { type: 'LiteralNumericExpression', value: 0 } },
        { type: 'ExpressionStatement', expression: { type: 'LiteralNumericExpression', value: 0 } },
      ] }
    );

    testParseModule('export function f(){};0', id,
      { type: 'Module', directives: [], items: [
        { type: 'Export', declaration:
        { type: 'FunctionDeclaration',
          isGenerator: false,
          name: { type: 'BindingIdentifier', name: 'f' },
          params: { type: 'FormalParameters', items: [], rest: null },
          body: { type: 'FunctionBody', directives: [], statements: [] } } },
        { type: 'EmptyStatement' },
        { type: 'ExpressionStatement', expression: { type: 'LiteralNumericExpression', value: 0 } },
      ] }
    );

    testParseModule('export class A{};0', id,
      { type: 'Module', directives: [], items: [
        { type: 'Export', declaration:
          { type: 'ClassDeclaration', name: { type: 'BindingIdentifier', name: 'A' }, super: null, elements: [] } },
        { type: 'EmptyStatement' },
        { type: 'ExpressionStatement', expression: { type: 'LiteralNumericExpression', value: 0 } },
      ] }
    );

    testParseModule('export {};0', id,
      { type: 'Module', directives: [], items: [
        { type: 'ExportLocals', namedExports: [] },
        { type: 'ExpressionStatement', expression: { type: 'LiteralNumericExpression', value: 0 } },
      ] }
    );

    testParseModule('export default function a(){} let b; export {b as a};', id,
      { type: 'Module', directives: [], items: [
        {
          type: 'ExportDefault',
          body: {
            type: 'FunctionDeclaration',
            isGenerator: false,
            name: { type: 'BindingIdentifier', name: 'a' },
            params: { type: 'FormalParameters', items: [], rest: null },
            body: { type: 'FunctionBody', directives: [], statements: [] },
          },
        },
        { type: 'VariableDeclarationStatement', declaration: { type: 'VariableDeclaration', kind: 'let', declarators:
          [{ type: 'VariableDeclarator', binding: { type: 'BindingIdentifier', name: 'b' }, init: null }] } },
        {
          type: 'ExportLocals',
          namedExports: [{
            type: 'ExportLocalSpecifier',
            name: {
              type: 'IdentifierExpression',
              name: 'b',
            },
            exportedName: 'a',
          }],
        },
      ] }
    );

    testParseFailure('export * from "a"', 'Unexpected token "export"');
    testParseModuleFailure('{export default 3;}', 'Unexpected token "export"');
    testParseModuleFailure('{export {a};}', 'Unexpected token "export"');
    testParseModuleFailure('while (1) export default 3', 'Unexpected token "export"');
    testParseModuleFailure('export', 'Unexpected end of input');
    testParseModuleFailure('export ', 'Unexpected end of input');
    testParseModuleFailure('export;', 'Unexpected token ";"');
    testParseModuleFailure('export {,,}', 'Unexpected token ","');
    testParseModuleFailure('export {a,,}', 'Unexpected token ","');
    testParseModuleFailure('export {a,,b}', 'Unexpected token ","');
    testParseModuleFailure('export {a,b} from', 'Unexpected end of input');
    testParseModuleFailure('export {a,b} from a', 'Unexpected identifier');
    testParseModuleFailure('export {a as} from a', 'Unexpected token "}"');
    testParseModuleFailure('export {as b} from a', 'Unexpected identifier');
    testParseModuleFailure('export * from a', 'Unexpected identifier');
    testParseModuleFailure('export / from a', 'Unexpected token "/"');
    testParseModuleFailure('export * From "a"', 'Unexpected identifier');
    testParseModuleFailure('export let[a] = 0 export let[b] = 0', 'Unexpected token "export"');
    testParseModuleFailure('export 3', 'Unexpected number');
    testParseModuleFailure('export function () {}', 'Unexpected token "("');
    testParseModuleFailure('export default default', 'Unexpected token "default"');
    testParseModuleFailure('export default function', 'Unexpected end of input');
    testParseModuleFailure('export {with as a}', 'Names of variables used in an export specifier from the current module must be identifiers');
  });
});
