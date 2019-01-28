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
let ErrorMessages = require('../../dist/errors').ErrorMessages;

function id(x) {
  return x;
}

suite('Parser', () => {
  suite('export declaration', () => {


    testParseModule('export {} from "a"', moduleItem, { type: 'ExportFrom', namedExports: [], moduleSpecifier: 'a' });

    testParseModule('export {a} from "a"', moduleItem, {
      type: 'ExportFrom',
      namedExports: [{ type: 'ExportFromSpecifier', name: 'a', exportedName: null }],
      moduleSpecifier: 'a',
    });

    testParseModule('export {with} from "a"', moduleItem, {
      type: 'ExportFrom',
      namedExports: [{ type: 'ExportFromSpecifier', name: 'with', exportedName: null }],
      moduleSpecifier: 'a',
    });

    testParseModule('export {a,} from "a"', moduleItem, {
      type: 'ExportFrom',
      namedExports: [{ type: 'ExportFromSpecifier', name: 'a', exportedName: null }],
      moduleSpecifier: 'a',
    });

    testParseModule('export {a,b} from "a"', moduleItem, {
      type: 'ExportFrom',
      namedExports: [{ type: 'ExportFromSpecifier', name: 'a', exportedName: null }, {
        type: 'ExportFromSpecifier',
        name: 'b',
        exportedName: null,
      }],
      moduleSpecifier: 'a',
    });

    testParseModule('export {a as b} from "a"', moduleItem, {
      type: 'ExportFrom',
      namedExports: [{ type: 'ExportFromSpecifier', name: 'a', exportedName: 'b' }],
      moduleSpecifier: 'a',
    });

    testParseModule('export {with as a} from "a"', moduleItem, {
      type: 'ExportFrom',
      namedExports: [{ type: 'ExportFromSpecifier', name: 'with', exportedName: 'a' }],
      moduleSpecifier: 'a',
    });

    testParseModule('export {as as as} from "as"', moduleItem, {
      type: 'ExportFrom',
      namedExports: [{ type: 'ExportFromSpecifier', name: 'as', exportedName: 'as' }],
      moduleSpecifier: 'as',
    });

    testParseModule('export {as as function} from "as"', moduleItem, {
      type: 'ExportFrom',
      namedExports: [{ type: 'ExportFromSpecifier', name: 'as', exportedName: 'function' }],
      moduleSpecifier: 'as',
    });

    testParseModule('export {a} from "m"', moduleItem, {
      type: 'ExportFrom',
      namedExports: [{ type: 'ExportFromSpecifier', name: 'a', exportedName: null }],
      moduleSpecifier: 'm',
    });

    testParseModule('export {if as var} from "a";', moduleItem, {
      type: 'ExportFrom',
      namedExports: [{ type: 'ExportFromSpecifier', name: 'if', exportedName: 'var' }],
      moduleSpecifier: 'a',
    });

    testParseModule('export {a}\n var a;', moduleItem, {
      type: 'ExportLocals',
      namedExports: [{ type: 'ExportLocalSpecifier',
        name: { type: 'IdentifierExpression', name: 'a' }, exportedName: null }],
    });

    testParseModule('export {a,}\n var a;', moduleItem, {
      type: 'ExportLocals',
      namedExports: [{ type: 'ExportLocalSpecifier',
        name: { type: 'IdentifierExpression', name: 'a' }, exportedName: null }],
    });

    testParseModule('export {a,b,}\n var a,b;', moduleItem, {
      type: 'ExportLocals',
      namedExports: [{ type: 'ExportLocalSpecifier', name: { type: 'IdentifierExpression', name: 'a' },
        exportedName: null }, {
        type: 'ExportLocalSpecifier',
        name: { type: 'IdentifierExpression', name: 'b' },
        exportedName: null,
      }],
    });

    testParseModule(
      'export var a = 0, b;',
      moduleItem, {
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

    testParseModule(
      'export const a = 0, b = 0;',
      moduleItem, {
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

    testParseModule(
      'export let a = 0, b = 0;',
      moduleItem, {
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

    testParseModule(
      'export let[a] = 0;',
      moduleItem, {
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

    testParseModule(
      'export class A{} /* no semi */ false',
      moduleItem, {
        type: 'Export',
        declaration: {
          type: 'ClassDeclaration',
          name: { type: 'BindingIdentifier', name: 'A' },
          super: null,
          elements: [],
        },
      });

    testParseModule(
      'export function A(){} /* no semi */ false',
      moduleItem, {
        type: 'Export',
        declaration: {
          type: 'FunctionDeclaration',
          isAsync: false,
          isGenerator: false,
          name: { type: 'BindingIdentifier', name: 'A' },
          params: { type: 'FormalParameters', items: [], rest: null },
          body: { type: 'FunctionBody', directives: [], statements: [] },
        },
      }
    );

    testParseModule(
      'export default function (){} /* no semi */ false',
      moduleItem, {
        type: 'ExportDefault',
        body: {
          type: 'FunctionDeclaration',
          isAsync: false,
          isGenerator: false,
          name: { type: 'BindingIdentifier', name: '*default*' },
          params: { type: 'FormalParameters', items: [], rest: null },
          body: { type: 'FunctionBody', directives: [], statements: [] },
        },
      }
    );

    testParseModule(
      'export default class {} /* no semi */ false',
      moduleItem, {
        type: 'ExportDefault',
        body: {
          type: 'ClassDeclaration',
          name: { type: 'BindingIdentifier', name: '*default*' },
          super: null,
          elements: [],
        },
      });

    testParseModule(
      'export default 3 + 1',
      moduleItem, {
        type: 'ExportDefault',
        body: {
          type: 'BinaryExpression',
          operator: '+',
          left: { type: 'LiteralNumericExpression', value: 3 },
          right: { type: 'LiteralNumericExpression', value: 1 },
        },
      });

    testParseModule(
      'export default a',
      moduleItem, { type: 'ExportDefault', body: { type: 'IdentifierExpression', name: 'a' } });

    testParseModule('export default function a(){}', moduleItem, {
      type: 'ExportDefault',
      body: {
        type: 'FunctionDeclaration',
        isAsync: false,
        isGenerator: false,
        name: { type: 'BindingIdentifier', name: 'a' },
        params: { type: 'FormalParameters', items: [], rest: null },
        body: { type: 'FunctionBody', directives: [], statements: [] },
      },
    });

    testParseModule('export default class a{}', moduleItem, {
      type: 'ExportDefault',
      body: { type: 'ClassDeclaration', name: { type: 'BindingIdentifier', name: 'a' }, super: null, elements: [] },
    });

    testParseModule('export default function* a(){}', moduleItem, {
      type: 'ExportDefault',
      body: {
        type: 'FunctionDeclaration',
        isAsync: false,
        isGenerator: true,
        name: { type: 'BindingIdentifier', name: 'a' },
        params: { type: 'FormalParameters', items: [], rest: null },
        body: { type: 'FunctionBody', directives: [], statements: [] },
      },
    });


    testParseModule('export default function a(){} let b; export {b as a};', id,
      { type: 'Module', directives: [], items: [
        {
          type: 'ExportDefault',
          body: {
            type: 'FunctionDeclaration',
            isAsync: false,
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

    testParseFailure('export * from "a"', ErrorMessages.UNEXPECTED_TOKEN, 'export');
    testParseModuleFailure('{export default 3;}', ErrorMessages.UNEXPECTED_TOKEN, 'export');
    testParseModuleFailure('{export {a};}', ErrorMessages.UNEXPECTED_TOKEN, 'export');
    testParseModuleFailure('while (1) export default 3', ErrorMessages.UNEXPECTED_TOKEN, 'export');
    testParseModuleFailure('export', ErrorMessages.UNEXPECTED_EOS);
    testParseModuleFailure('export ', ErrorMessages.UNEXPECTED_EOS);
    testParseModuleFailure('export;', ErrorMessages.UNEXPECTED_TOKEN, ';');
    testParseModuleFailure('export {,,}', ErrorMessages.UNEXPECTED_TOKEN, ',');
    testParseModuleFailure('export {a,,}', ErrorMessages.UNEXPECTED_TOKEN, ',');
    testParseModuleFailure('export {a,,b}', ErrorMessages.UNEXPECTED_TOKEN, ',');
    testParseModuleFailure('export {a,b} from', ErrorMessages.UNEXPECTED_EOS);
    testParseModuleFailure('export {a,b} from a', ErrorMessages.UNEXPECTED_IDENTIFIER);
    testParseModuleFailure('export {a as} from a', ErrorMessages.UNEXPECTED_TOKEN, '}');
    testParseModuleFailure('export {as b} from a', ErrorMessages.UNEXPECTED_IDENTIFIER);
    testParseModuleFailure('export * from a', ErrorMessages.UNEXPECTED_IDENTIFIER);
    testParseModuleFailure('export / from a', ErrorMessages.UNEXPECTED_TOKEN, '/');
    testParseModuleFailure('export * From "a"', ErrorMessages.UNEXPECTED_IDENTIFIER);
    testParseModuleFailure('export let[a] = 0 export let[b] = 0', ErrorMessages.UNEXPECTED_TOKEN, 'export');
    testParseModuleFailure('export 3', ErrorMessages.UNEXPECTED_NUMBER);
    testParseModuleFailure('export function () {}', ErrorMessages.UNEXPECTED_TOKEN, '(');
    testParseModuleFailure('export default default', ErrorMessages.UNEXPECTED_TOKEN, 'default');
    testParseModuleFailure('export default function', ErrorMessages.UNEXPECTED_EOS);
    testParseModuleFailure('export {with as a}', ErrorMessages.ILLEGAL_EXPORTED_NAME);
  });
});
