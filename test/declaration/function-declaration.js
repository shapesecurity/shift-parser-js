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

let stmt = require('../helpers').stmt;
let testParse = require('../assertions').testParse;
let testParseFailure = require('../assertions').testParseFailure;

function id(x) {
  return x;
}

suite('Parser', () => {
  suite('function declaration', () => {
    testParse('function hello() { z(); }', stmt,
      { type: 'FunctionDeclaration',
        isGenerator: false,
        name: { type: 'BindingIdentifier', name: 'hello' },
        params: { type: 'FormalParameters', items: [], rest: null },
        body: {
          type: 'FunctionBody',
          directives: [],
          statements: [{
            type: 'ExpressionStatement',
            expression: { type: 'CallExpression', callee: { type: 'IdentifierExpression', name: 'z' }, arguments: [] },
          }],
        },
      }
    );

    testParse('function eval() { }', stmt,
      { type: 'FunctionDeclaration',
        isGenerator: false,
        name: { type: 'BindingIdentifier', name: 'eval' },
        params: { type: 'FormalParameters', items: [], rest: null },
        body: { type: 'FunctionBody', directives: [], statements: [] },
      }
    );

    testParse('function arguments() { }', stmt,
      { type: 'FunctionDeclaration',
        isGenerator: false,
        name: { type: 'BindingIdentifier', name: 'arguments' },
        params: { type: 'FormalParameters', items: [], rest: null },
        body: { type: 'FunctionBody', directives: [], statements: [] },
      }
    );

    testParse('function test(t, t) { }', stmt,
      { type: 'FunctionDeclaration',
        isGenerator: false,
        name: { type: 'BindingIdentifier', name: 'test' },
        params:
        { type: 'FormalParameters',
          items:
          [
            { type: 'BindingIdentifier', name: 't' },
            { type: 'BindingIdentifier', name: 't' },
          ],
          rest: null,
        },
        body: { type: 'FunctionBody', directives: [], statements: [] },
      }
    );

    testParse('function eval() { function inner() { "use strict" } }', stmt,
      { type: 'FunctionDeclaration',
        isGenerator: false,
        name: { type: 'BindingIdentifier', name: 'eval' },
        params: { type: 'FormalParameters', items: [], rest: null },
        body: {
          type: 'FunctionBody',
          directives: [],
          statements: [{
            type: 'FunctionDeclaration',
            isGenerator: false,
            name: { type: 'BindingIdentifier', name: 'inner' },
            params: { type: 'FormalParameters', items: [], rest: null },
            body: { type: 'FunctionBody', directives: [{ type: 'Directive', rawValue: 'use strict' }], statements: [] },
          }],
        },
      }
    );

    testParse('function hello(a) { z(); }', stmt,
      { type: 'FunctionDeclaration',
        isGenerator: false,
        name: { type: 'BindingIdentifier', name: 'hello' },
        params: { type: 'FormalParameters', items: [{ type: 'BindingIdentifier', name: 'a' }], rest: null },
        body: {
          type: 'FunctionBody',
          directives: [],
          statements: [{
            type: 'ExpressionStatement',
            expression: { type: 'CallExpression', callee: { type: 'IdentifierExpression', name: 'z' }, arguments: [] },
          }],
        },
      }
    );

    testParse('function hello(a, b) { z(); }', stmt,
      { type: 'FunctionDeclaration',
        isGenerator: false,
        name: { type: 'BindingIdentifier', name: 'hello' },
        params:
        { type: 'FormalParameters',
          items:
          [
            { type: 'BindingIdentifier', name: 'a' },
            { type: 'BindingIdentifier', name: 'b' },
          ],
          rest: null,
        },
        body: {
          type: 'FunctionBody',
          directives: [],
          statements: [{
            type: 'ExpressionStatement',
            expression: { type: 'CallExpression', callee: { type: 'IdentifierExpression', name: 'z' }, arguments: [] },
          }],
        },
      }
    );

    testParse('function a(...b) { }', stmt,
      { type: 'FunctionDeclaration',
        isGenerator: false,
        name: { type: 'BindingIdentifier', name: 'a' },
        params:
        { type: 'FormalParameters',
          items: [],
          rest: { type: 'BindingIdentifier', name: 'b' },
        },
        body: {
          type: 'FunctionBody',
          directives: [],
          statements: [],
        },
      }
    );

    testParse('function a(...[]) { }', stmt,
      { type: 'FunctionDeclaration',
        isGenerator: false,
        name: { type: 'BindingIdentifier', name: 'a' },
        params:
        { type: 'FormalParameters',
          items: [],
          rest: { type: 'ArrayBinding', elements: [], rest: null },
        },
        body: {
          type: 'FunctionBody',
          directives: [],
          statements: [],
        },
      }
    );

    testParse('function universe(__proto__) { }', stmt,
      { type: 'FunctionDeclaration',
        isGenerator: false,
        name: { type: 'BindingIdentifier', name: 'universe' },
        params: { type: 'FormalParameters', items: [{ type: 'BindingIdentifier', name: '__proto__' }], rest: null },
        body: { type: 'FunctionBody', directives: [], statements: [] },
      }
    );

    testParse('function test() { "use strict"\n + 0; }', stmt,
      { type: 'FunctionDeclaration',
        isGenerator: false,
        name: { type: 'BindingIdentifier', name: 'test' },
        params: { type: 'FormalParameters', items: [], rest: null },
        body: {
          type: 'FunctionBody',
          directives: [],
          statements: [{
            type: 'ExpressionStatement',
            expression: {
              type: 'BinaryExpression',
              operator: '+',
              left: { type: 'LiteralStringExpression', value: 'use strict' },
              right: { type: 'LiteralNumericExpression', value: 0 },
            },
          }],
        },
      }
    );

    testParse('function a() {} function a() {}', id,
      {
        type: 'Script',
        directives: [],
        statements: [{
          type: 'FunctionDeclaration',
          isGenerator: false,
          name: { type: 'BindingIdentifier', name: 'a' },
          params: { type: 'FormalParameters', items: [], rest: null },
          body: { type: 'FunctionBody', directives: [], statements: [] },
        }, {
          type: 'FunctionDeclaration',
          isGenerator: false,
          name: { type: 'BindingIdentifier', name: 'a' },
          params: { type: 'FormalParameters', items: [], rest: null },
          body: { type: 'FunctionBody', directives: [], statements: [] },
        }],
      }
    );

    testParse('function a() { function a() {} function a() {} }', stmt,
      { type: 'FunctionDeclaration',
        isGenerator: false,
        name: { type: 'BindingIdentifier', name: 'a' },
        params: { type: 'FormalParameters', items: [], rest: null },
        body: {
          type: 'FunctionBody',
          directives: [],
          statements: [{
            type: 'FunctionDeclaration',
            isGenerator: false,
            name: { type: 'BindingIdentifier', name: 'a' },
            params: { type: 'FormalParameters', items: [], rest: null },
            body: { type: 'FunctionBody', directives: [], statements: [] },
          }, {
            type: 'FunctionDeclaration',
            isGenerator: false,
            name: { type: 'BindingIdentifier', name: 'a' },
            params: { type: 'FormalParameters', items: [], rest: null },
            body: { type: 'FunctionBody', directives: [], statements: [] },
          }],
        },
      }
    );
  });

  suite('function declaration in labeled statement', () => {
    testParse('a: function a(){}', stmt,
      {
        type: 'LabeledStatement',
        label: 'a',
        body: {
          type: 'FunctionDeclaration',
          isGenerator: false,
          name: { type: 'BindingIdentifier', name: 'a' },
          params: { type: 'FormalParameters', items: [], rest: null },
          body: { type: 'FunctionBody', directives: [], statements: [] },
        },
      }
    );

    testParseFailure('a: function* a(){}', 'Unexpected token "*"');
  });

  suite('Annex B 3.4: function declarations in if statements', () => {

    testParse('if (0) function a(){}', stmt, {
      type: 'IfStatement',
      test: { type: 'LiteralNumericExpression', value: 0 },
      consequent: {
        type: 'FunctionDeclaration',
        isGenerator: false,
        name: { type: 'BindingIdentifier', name: 'a' },
        params: { type: 'FormalParameters', items: [], rest: null },
        body: { type: 'FunctionBody', directives: [], statements: [] },
      },
      alternate: null,
    });

    testParse('if (0) function a(){} else;', stmt, {
      type: 'IfStatement',
      test: { type: 'LiteralNumericExpression', value: 0 },
      consequent: {
        type: 'FunctionDeclaration',
        isGenerator: false,
        name: { type: 'BindingIdentifier', name: 'a' },
        params: { type: 'FormalParameters', items: [], rest: null },
        body: { type: 'FunctionBody', directives: [], statements: [] },
      },
      alternate: { type: 'EmptyStatement' },
    });

    testParse('if (0); else function a(){}', stmt, {
      type: 'IfStatement',
      test: { type: 'LiteralNumericExpression', value: 0 },
      consequent: { type: 'EmptyStatement' },
      alternate: {
        type: 'FunctionDeclaration',
        isGenerator: false,
        name: { type: 'BindingIdentifier', name: 'a' },
        params: { type: 'FormalParameters', items: [], rest: null },
        body: { type: 'FunctionBody', directives: [], statements: [] },
      },
    });

    testParse('if (0) function a(){} else function b(){}', stmt, {
      type: 'IfStatement',
      test: { type: 'LiteralNumericExpression', value: 0 },
      consequent: {
        type: 'FunctionDeclaration',
        isGenerator: false,
        name: { type: 'BindingIdentifier', name: 'a' },
        params: { type: 'FormalParameters', items: [], rest: null },
        body: { type: 'FunctionBody', directives: [], statements: [] },
      },
      alternate: {
        type: 'FunctionDeclaration',
        isGenerator: false,
        name: { type: 'BindingIdentifier', name: 'b' },
        params: { type: 'FormalParameters', items: [], rest: null },
        body: { type: 'FunctionBody', directives: [], statements: [] },
      },
    });

    testParse('try {} catch (e) { if(0) function e(){} }', stmt, {
      type: 'TryCatchStatement',
      body: { type: 'Block', statements: [] },
      catchClause: {
        type: 'CatchClause',
        binding: { name: 'e', type: 'BindingIdentifier' },
        body: {
          type: 'Block',
          statements: [
            {
              type: 'IfStatement',
              test: { type: 'LiteralNumericExpression', value: 0 },
              consequent: {
                type: 'FunctionDeclaration',
                isGenerator: false,
                name: { type: 'BindingIdentifier', name: 'e' },
                body: { type: 'FunctionBody', directives: [], statements: [] },
                params: { type: 'FormalParameters', items: [], rest: null },
              },
              alternate: null,
            },
          ],
        },
      },
    });

    testParseFailure('for(;;) function a(){}', 'Unexpected token "function"');
    testParseFailure('for(a in b) function c(){}', 'Unexpected token "function"');
    testParseFailure('for(a of b) function c(){}', 'Unexpected token "function"');
    testParseFailure('while(true) function a(){}', 'Unexpected token "function"');
    testParseFailure('with(true) function a(){}', 'Unexpected token "function"');
  });
});
