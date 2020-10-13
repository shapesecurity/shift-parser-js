/**
 * Copyright 2018 Shape Security, Inc.
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

let testParse = require('../assertions').testParse;
let testParseModule = require('../assertions').testParseModule;
let { stmt, expr } = require('../helpers');
let testParseFailure = require('../assertions').testParseFailure;
let testParseSuccess = require('../assertions').testParseSuccess;
let ErrorMessages = require('../../src/errors').ErrorMessages;

function id(x) {
  return x;
}

suite('async', () => {
  suite('arrows', () => {
    testParse('async (a, b) => 0', expr,
      {
        type: 'ArrowExpression',
        isAsync: true,
        params:
        {
          type: 'FormalParameters',
          items: [
            { type: 'BindingIdentifier', name: 'a' },
            { type: 'BindingIdentifier', name: 'b' },
          ],
          rest: null,
        },
        body: { type: 'LiteralNumericExpression', value: 0 },
      }
    );

    testParse('async (a, ...b) => 0', expr,
      {
        type: 'ArrowExpression',
        isAsync: true,
        params:
        {
          type: 'FormalParameters',
          items: [
            { type: 'BindingIdentifier', name: 'a' },
          ],
          rest: { type: 'BindingIdentifier', name: 'b' },
        },
        body: { type: 'LiteralNumericExpression', value: 0 },
      }
    );

    testParse('async a => {}', expr,
      {
        type: 'ArrowExpression',
        isAsync: true,
        params: {
          type: 'FormalParameters',
          items: [{ type: 'BindingIdentifier', name: 'a' }],
          rest: null,
        },
        body: { type: 'FunctionBody', directives: [], statements: [] },
      }
    );

    testParse('async () => {}', expr,
      {
        type: 'ArrowExpression',
        isAsync: true,
        params: {
          type: 'FormalParameters',
          items: [],
          rest: null,
        },
        body: { type: 'FunctionBody', directives: [], statements: [] },
      }
    );

    testParse('(async a => {})()', expr,
      {
        type: 'CallExpression',
        callee: {
          type: 'ArrowExpression',
          isAsync: true,
          params: {
            type: 'FormalParameters',
            items: [{ type: 'BindingIdentifier', name: 'a' }],
            rest: null,
          },
          body: { type: 'FunctionBody', directives: [], statements: [] },
        },
        arguments: [],
      }
    );

    testParse('a, async () => b, c', expr,
      {
        type: 'BinaryExpression',
        left: {
          type: 'BinaryExpression',
          left: { type: 'IdentifierExpression', name: 'a' },
          operator: ',',
          right: {
            type: 'ArrowExpression',
            isAsync: true,
            params: { type: 'FormalParameters', items: [], rest: null },
            body: { type: 'IdentifierExpression', name: 'b' },
          },
        },
        operator: ',',
        right: { type: 'IdentifierExpression', name: 'c' },
      }
    );

    testParse('async (a = await => {})', expr,
      {
        type: 'CallExpression',
        callee: { type: 'IdentifierExpression', name: 'async' },
        arguments: [
          {
            type: 'AssignmentExpression',
            binding: { type: 'AssignmentTargetIdentifier', name: 'a' },
            expression: {
              type: 'ArrowExpression',
              isAsync: false,
              params: {
                type: 'FormalParameters',
                items: [{ type: 'BindingIdentifier', name: 'await' }],
                rest: null,
              },
              body: { type: 'FunctionBody', directives: [], statements: [] },
            },
          },
        ],
      }
    );

    testParse('async (a = aw\\u{61}it => {})', expr,
      {
        type: 'CallExpression',
        callee: { type: 'IdentifierExpression', name: 'async' },
        arguments: [
          {
            type: 'AssignmentExpression',
            binding: { type: 'AssignmentTargetIdentifier', name: 'a' },
            expression: {
              type: 'ArrowExpression',
              isAsync: false,
              params: {
                type: 'FormalParameters',
                items: [{ type: 'BindingIdentifier', name: 'await' }],
                rest: null,
              },
              body: { type: 'FunctionBody', directives: [], statements: [] },
            },
          },
        ],
      }
    );

    testParse('async (a = b => await (0)) => {}', expr,
      {
        type: 'ArrowExpression',
        isAsync: true,
        params: {
          type: 'FormalParameters',
          items: [
            {
              type: 'BindingWithDefault',
              binding: { type: 'BindingIdentifier', name: 'a' },
              init: {
                type: 'ArrowExpression',
                isAsync: false,
                params: {
                  type: 'FormalParameters',
                  items: [{ type: 'BindingIdentifier', name: 'b' }],
                  rest: null,
                },
                body: {
                  type: 'CallExpression',
                  callee: { type: 'IdentifierExpression', name: 'await' },
                  arguments: [{ type: 'LiteralNumericExpression', value: 0 }],
                },
              },
            },
          ],
          rest: null,
        },
        body: { type: 'FunctionBody', directives: [], statements: [] },
      }
    );

    testParse('async (a = { b(await){} }) => {}', expr,
      {
        type: 'ArrowExpression',
        isAsync: true,
        params: {
          type: 'FormalParameters',
          items: [
            {
              type: 'BindingWithDefault',
              binding: { type: 'BindingIdentifier', name: 'a' },
              init: {
                type: 'ObjectExpression',
                properties: [
                  {
                    type: 'Method',
                    isAsync: false,
                    isGenerator: false,
                    name: {
                      type: 'StaticPropertyName',
                      value: 'b',
                    },
                    params: {
                      type: 'FormalParameters',
                      items: [
                        {
                          type: 'BindingIdentifier',
                          name: 'await',
                        },
                      ],
                      rest: null,
                    },
                    body: {
                      type: 'FunctionBody',
                      directives: [],
                      statements: [],
                    },
                  },
                ],
              },
            },
          ],
          rest: null,
        },
        body: { type: 'FunctionBody', directives: [], statements: [] },
      }
    );

    testParseFailure('let b = async () => []; for (a in await b());', 'Unexpected identifier');
    testParse('async () => { let b = async () => []; for (a in await b()); }', expr,
      {
        body: {
          directives: [],
          statements: [
            {
              declaration: {
                declarators: [
                  {
                    binding: {
                      name: 'b',
                      type: 'BindingIdentifier',
                    },
                    init: {
                      body: {
                        elements: [],
                        type: 'ArrayExpression',
                      },
                      isAsync: true,
                      params: {
                        items: [],
                        rest: null,
                        type: 'FormalParameters',
                      },
                      type: 'ArrowExpression',
                    },
                    type: 'VariableDeclarator',
                  },
                ],
                kind: 'let',
                type: 'VariableDeclaration',
              },
              type: 'VariableDeclarationStatement',
            },
            {
              body: {
                type: 'EmptyStatement',
              },
              left: {
                name: 'a',
                type: 'AssignmentTargetIdentifier',
              },
              right: {
                expression: {
                  arguments: [],
                  callee: {
                    name: 'b',
                    type: 'IdentifierExpression',
                  },
                  type: 'CallExpression',
                },
                type: 'AwaitExpression',
              },
              type: 'ForInStatement',
            },
          ],
          type: 'FunctionBody',
        },
        isAsync: true,
        params: {
          items: [],
          rest: null,
          type: 'FormalParameters',
        },
        type: 'ArrowExpression',
      });
  });

  suite('functions', () => {
    testParse('async function a(){}', stmt,
      {
        type: 'FunctionDeclaration',
        isAsync: true,
        isGenerator: false,
        name: { type: 'BindingIdentifier', name: 'a' },
        params: { type: 'FormalParameters', items: [], rest: null },
        body: { type: 'FunctionBody', directives: [], statements: [] },
      }
    );

    testParse('(async function a(){})', expr,
      {
        type: 'FunctionExpression',
        isAsync: true,
        isGenerator: false,
        name: { type: 'BindingIdentifier', name: 'a' },
        params: { type: 'FormalParameters', items: [], rest: null },
        body: { type: 'FunctionBody', directives: [], statements: [] },
      }
    );

    testParse('async function a() { function b(c = await (0)) {} }', stmt,
      {
        type: 'FunctionDeclaration',
        isAsync: true,
        isGenerator: false,
        name: { type: 'BindingIdentifier', name: 'a' },
        params: { type: 'FormalParameters', items: [], rest: null },
        body: {
          type: 'FunctionBody',
          directives: [],
          statements: [
            {
              type: 'FunctionDeclaration',
              isAsync: false,
              isGenerator: false,
              name: { type: 'BindingIdentifier', name: 'b' },
              params: {
                type: 'FormalParameters',
                items: [
                  {
                    type: 'BindingWithDefault',
                    binding: { type: 'BindingIdentifier', name: 'c' },
                    init: {
                      type: 'CallExpression',
                      callee: { type: 'IdentifierExpression', name: 'await' },
                      arguments: [{ type: 'LiteralNumericExpression', value: 0 }],
                    },
                  },
                ],
                rest: null,
              },
              body: { type: 'FunctionBody', directives: [], statements: [] },
            },
          ],
        },
      }
    );
  });

  suite('methods', () => {
    testParse('({ async })', expr,
      {
        type: 'ObjectExpression',
        properties: [
          {
            type: 'ShorthandProperty',
            name: { type: 'IdentifierExpression', name: 'async' },
          },
        ],
      }
    );

    testParse('({ async () {} })', expr,
      {
        type: 'ObjectExpression',
        properties: [
          {
            type: 'Method',
            isAsync: false,
            isGenerator: false,
            name: { type: 'StaticPropertyName', value: 'async' },
            params: { type: 'FormalParameters', items: [], rest: null },
            body: { type: 'FunctionBody', directives: [], statements: [] },
          },
        ],
      }
    );

    testParse('({ async a(){} })', expr,
      {
        type: 'ObjectExpression',
        properties: [
          {
            type: 'Method',
            isAsync: true,
            isGenerator: false,
            name: { type: 'StaticPropertyName', value: 'a' },
            params: { type: 'FormalParameters', items: [], rest: null },
            body: { type: 'FunctionBody', directives: [], statements: [] },
          },
        ],
      }
    );

    testParse('({ async get(){} })', expr,
      {
        type: 'ObjectExpression',
        properties: [
          {
            type: 'Method',
            isAsync: true,
            isGenerator: false,
            name: { type: 'StaticPropertyName', value: 'get' },
            params: { type: 'FormalParameters', items: [], rest: null },
            body: { type: 'FunctionBody', directives: [], statements: [] },
          },
        ],
      }
    );

    testParse('(class { async(){} })', expr,
      {
        type: 'ClassExpression',
        name: null,
        super: null,
        elements: [
          {
            type: 'ClassElement',
            isStatic: false,
            method: {
              type: 'Method',
              isAsync: false,
              isGenerator: false,
              name: { type: 'StaticPropertyName', value: 'async' },
              params: { type: 'FormalParameters', items: [], rest: null },
              body: { type: 'FunctionBody', directives: [], statements: [] },
            },
          },
        ],
      }
    );

    testParse('(class { async a(){} })', expr,
      {
        type: 'ClassExpression',
        name: null,
        super: null,
        elements: [
          {
            type: 'ClassElement',
            isStatic: false,
            method: {
              type: 'Method',
              isAsync: true,
              isGenerator: false,
              name: { type: 'StaticPropertyName', value: 'a' },
              params: { type: 'FormalParameters', items: [], rest: null },
              body: { type: 'FunctionBody', directives: [], statements: [] },
            },
          },
        ],
      }
    );

    testParse('(class { static async a(){} })', expr,
      {
        type: 'ClassExpression',
        name: null,
        super: null,
        elements: [
          {
            type: 'ClassElement',
            isStatic: true,
            method: {
              type: 'Method',
              isAsync: true,
              isGenerator: false,
              name: { type: 'StaticPropertyName', value: 'a' },
              params: { type: 'FormalParameters', items: [], rest: null },
              body: { type: 'FunctionBody', directives: [], statements: [] },
            },
          },
        ],
      }
    );
  });


  suite('await', () => {
    testParse('async function a() { await 0; }', stmt,
      {
        type: 'FunctionDeclaration',
        isAsync: true,
        isGenerator: false,
        name: { type: 'BindingIdentifier', name: 'a' },
        params: { type: 'FormalParameters', items: [], rest: null },
        body: {
          type: 'FunctionBody',
          directives: [],
          statements: [
            {
              type: 'ExpressionStatement',
              expression: {
                type: 'AwaitExpression',
                expression: { type: 'LiteralNumericExpression', value: 0 },
              },
            },
          ],
        },
      }
    );

    testParse('(async function a() { await 0; })', expr,
      {
        type: 'FunctionExpression',
        isAsync: true,
        isGenerator: false,
        name: { type: 'BindingIdentifier', name: 'a' },
        params: { type: 'FormalParameters', items: [], rest: null },
        body: {
          type: 'FunctionBody',
          directives: [],
          statements: [
            {
              type: 'ExpressionStatement',
              expression: {
                type: 'AwaitExpression',
                expression: { type: 'LiteralNumericExpression', value: 0 },
              },
            },
          ],
        },
      }
    );

    testParse('async () => await 0', expr,
      {
        type: 'ArrowExpression',
        isAsync: true,
        params: { type: 'FormalParameters', items: [], rest: null },
        body: {
          type: 'AwaitExpression',
          expression: { type: 'LiteralNumericExpression', value: 0 },
        },
      }
    );

    testParse('({ async a(){ await 0; } })', expr,
      {
        type: 'ObjectExpression',
        properties: [
          {
            type: 'Method',
            isAsync: true,
            isGenerator: false,
            name: { type: 'StaticPropertyName', value: 'a' },
            params: { type: 'FormalParameters', items: [], rest: null },
            body: {
              type: 'FunctionBody',
              directives: [],
              statements: [
                {
                  type: 'ExpressionStatement',
                  expression: {
                    type: 'AwaitExpression',
                    expression: { type: 'LiteralNumericExpression', value: 0 },
                  },
                },
              ],
            },
          },
        ],
      }
    );

    testParseFailure('await 0', 'Unexpected number');
  });


  suite('exports', () => {
    testParseModule('export async function a(){}', id,
      {
        type: 'Module',
        directives: [],
        items: [
          {
            type: 'Export',
            declaration: {
              type: 'FunctionDeclaration',
              isAsync: true,
              isGenerator: false,
              name: { type: 'BindingIdentifier', name: 'a' },
              params: { type: 'FormalParameters', items: [], rest: null },
              body: { type: 'FunctionBody', directives: [], statements: [] },
            },
          },
        ],
      }
    );

    testParseModule('export default async function (){}', id,
      {
        type: 'Module',
        directives: [],
        items: [
          {
            type: 'ExportDefault',
            body: {
              type: 'FunctionDeclaration',
              isAsync: true,
              isGenerator: false,
              name: { type: 'BindingIdentifier', name: '*default*' },
              params: { type: 'FormalParameters', items: [], rest: null },
              body: { type: 'FunctionBody', directives: [], statements: [] },
            },
          },
        ],
      }
    );

    testParseModule('export default async\nfunction a(){}', id,
      {
        type: 'Module',
        directives: [],
        items: [
          {
            type: 'ExportDefault',
            body: { type: 'IdentifierExpression', name: 'async' },
          },
          {
            type: 'FunctionDeclaration',
            isAsync: false,
            isGenerator: false,
            name: { type: 'BindingIdentifier', name: 'a' },
            params: { type: 'FormalParameters', items: [], rest: null },
            body: { type: 'FunctionBody', directives: [], statements: [] },
          },
        ],
      }
    );
  });

  suite('misc', () => {
    testParse('async;\n(a, b) => 0', id,
      {
        type: 'Script',
        directives: [],
        statements: [
          {
            type: 'ExpressionStatement',
            expression: { type: 'IdentifierExpression', name: 'async' },
          },
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'ArrowExpression',
              isAsync: false,
              params: {
                type: 'FormalParameters',
                items: [
                  { type: 'BindingIdentifier', name: 'a' },
                  { type: 'BindingIdentifier', name: 'b' },
                ],
                rest: null,
              },
              body: { type: 'LiteralNumericExpression', value: 0 },
            },
          },
        ],
      }
    );

    testParse('async\nfunction a(){}', id,
      {
        type: 'Script',
        directives: [],
        statements: [
          {
            type: 'ExpressionStatement',
            expression: { type: 'IdentifierExpression', name: 'async' },
          },
          {
            type: 'FunctionDeclaration',
            isAsync: false,
            isGenerator: false,
            name: { type: 'BindingIdentifier', name: 'a' },
            params: { type: 'FormalParameters', items: [], rest: null },
            body: { type: 'FunctionBody', directives: [], statements: [] },
          },
        ],
      }
    );

    testParse('new async()', expr,
      {
        type: 'NewExpression',
        callee: { type: 'IdentifierExpression', name: 'async' },
        arguments: [],
      }
    );

    testParse('async()``', expr,
      {
        type: 'TemplateExpression',
        tag: {
          type: 'CallExpression',
          callee: { type: 'IdentifierExpression', name: 'async' },
          arguments: [],
        },
        elements: [{ type: 'TemplateElement', rawValue: '' }],
      }
    );

    testParse('async ((a))', expr,
      {
        type: 'CallExpression',
        callee: { type: 'IdentifierExpression', name: 'async' },
        arguments: [{ type: 'IdentifierExpression', name: 'a' }],
      }
    );


    testParse('async function a(){}(0)', id,
      {
        type: 'Script',
        directives: [],
        statements: [
          {
            type: 'FunctionDeclaration',
            isAsync: true,
            isGenerator: false,
            name: { type: 'BindingIdentifier', name: 'a' },
            params: { type: 'FormalParameters', items: [], rest: null },
            body: { type: 'FunctionBody', directives: [], statements: [] },
          },
          {
            type: 'ExpressionStatement',
            expression: { type: 'LiteralNumericExpression', value: 0 },
          },
        ],
      }
    );

    testParse('(async function a(){}(0))', id,
      {
        type: 'Script',
        directives: [],
        statements: [
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'CallExpression',
              callee: {
                type: 'FunctionExpression',
                isAsync: true,
                isGenerator: false,
                name: { type: 'BindingIdentifier', name: 'a' },
                params: { type: 'FormalParameters', items: [], rest: null },
                body: { type: 'FunctionBody', directives: [], statements: [] },
              },
              arguments: [{ type: 'LiteralNumericExpression', value: 0 }],
            },
          },
        ],
      }
    );
  });

  testParse('(async function() { (await y); })', expr,
    {
      type: 'FunctionExpression',
      name: null,
      isAsync: true,
      isGenerator: false,
      params: {
        type: 'FormalParameters',
        rest: null,
        items: [],
      },
      body: {
        type: 'FunctionBody',
        directives: [],
        statements: [
          {
            type: 'ExpressionStatement',
            expression: {
              type: 'AwaitExpression',
              expression: {
                type: 'IdentifierExpression',
                name: 'y',
              },
            },
          },
        ],
      },
    });

  testParse('({ async *a(){} })', expr,
    {
      type: 'ObjectExpression',
      properties: [
        {
          type: 'Method',
          name: {
            type: 'StaticPropertyName',
            value: 'a',
          },
          isAsync: true,
          isGenerator: true,
          params: {
            type: 'FormalParameters',
            rest: null,
            items: [],
          },
          body: {
            'directives': [],
            'statements': [],
            'type': 'FunctionBody',
          },
        },
      ],
    });

  testParse('async function* a(){}', stmt,
    {
      type: 'FunctionDeclaration',
      isAsync: true,
      isGenerator: true,
      name: {
        type: 'BindingIdentifier',
        name: 'a',
      },
      params: {
        type: 'FormalParameters',
        items: [],
        rest: null,
      },
      body: {
        type: 'FunctionBody',
        directives: [],
        statements: [],
      },
    }
  );

  testParse('(async function* (){})', stmt,
    {
      type: 'ExpressionStatement',
      expression: {
        type: 'FunctionExpression',
        isAsync: true,
        isGenerator: true,
        name: null,
        params: {
          type: 'FormalParameters',
          items: [],
          rest: null,
        },
        body: {
          type: 'FunctionBody',
          directives: [],
          statements: [],
        },
      },
    }
  );

  suite('failures', () => {
    testParseFailure('async (a, ...b, ...c) => {}', ErrorMessages.UNEXPECTED_TOKEN(','));
    testParseFailure('async\n(a, b) => {}', 'Unexpected token "=>"');
    testParseFailure('new async() => {}', 'Unexpected token "=>"');
    testParseFailure('({ async\nf(){} })', 'Unexpected identifier');
    testParseFailure('async ((a)) => {}', ErrorMessages.UNEXPECTED_TOKEN('=>'));
    testParseFailure('({ async get a(){} })', 'Unexpected identifier');
    testParseFailure('async a => {} ()', 'Unexpected token "("');
    testParseFailure('a + async b => {}', 'Unexpected token "=>"');
    testParseFailure('a + async () => {}', 'Unexpected token "=>"');
    testParseFailure('with({}) async function f(){};', 'Unexpected token "function"');
    testParseFailure('function* a(){ async yield => {}; }', '"yield" may not be used as an identifier in this context');
    testParseFailure('function* a(){ async (yield) => {}; }', 'Unexpected token "=>"');
    testParseFailure('async await => 0', '"await" may not be used as an identifier in this context');
    testParseFailure('async (await) => 0', ErrorMessages.NO_AWAIT_IN_ASYNC_PARAMS);
    testParseFailure('(class { async })', 'Only methods are allowed in classes');
    testParseFailure('(class { async\na(){} })', 'Only methods are allowed in classes');
    testParseFailure('(class { async get a(){} })', 'Unexpected identifier');
    testParseFailure('async (a = await => {}) => {}', ErrorMessages.NO_AWAIT_IN_ASYNC_PARAMS);
    testParseFailure('async (a = (await) => {}) => {}', ErrorMessages.NO_AWAIT_IN_ASYNC_PARAMS);
    testParseFailure('async (a = aw\\u{61}it => {}) => {}', ErrorMessages.NO_AWAIT_IN_ASYNC_PARAMS);
    testParseFailure('async (a = (b = await (0)) => {}) => {}', 'Async arrow parameters may not contain "await"');
    testParseFailure('async ({await}) => 1', ErrorMessages.NO_AWAIT_IN_ASYNC_PARAMS);
    testParseFailure('async function x({await}) { return 1 }', ErrorMessages.ILLEGAL_AWAIT_IDENTIFIER);
    testParseFailure('async function f() { return {await}; }', ErrorMessages.ILLEGAL_AWAIT_IDENTIFIER);
    testParseFailure('async function f() { return {await = 0} = {}; }', ErrorMessages.ILLEGAL_AWAIT_IDENTIFIER);
  });
});
