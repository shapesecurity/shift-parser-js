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

let stmt = require('../../helpers').stmt;
let testParse = require('../../assertions').testParse;
let testParseFailure = require('../../assertions').testParseFailure;

suite('Parser', () => {
  suite('array binding', () => {
    suite('variable declarator', () => {
      testParse('var [,a] = 0;', stmt,
        {
          type: 'VariableDeclarationStatement',
          declaration: {
            type: 'VariableDeclaration',
            kind: 'var',
            declarators: [{
              type: 'VariableDeclarator',
              binding: {
                type: 'ArrayBinding',
                elements: [null, { type: 'BindingIdentifier', name: 'a' }],
                rest: null,
              },
              init: { type: 'LiteralNumericExpression', value: 0 },
            }],
          },
        }
      );

      testParse('var [a]=[1];', stmt,
        {
          type: 'VariableDeclarationStatement',
          declaration: {
            type: 'VariableDeclaration',
            kind: 'var',
            declarators: [{
              type: 'VariableDeclarator',
              binding: {
                type: 'ArrayBinding',
                elements: [{ type: 'BindingIdentifier', name: 'a' }],
                rest: null,
              },
              init: { type: 'ArrayExpression', elements: [{ type: 'LiteralNumericExpression', value: 1 }] },
            }],
          },
        }
      );

      testParse('var [[a]]=0;', stmt,
        {
          type: 'VariableDeclarationStatement',
          declaration: {
            type: 'VariableDeclaration',
            kind: 'var',
            declarators: [{
              type: 'VariableDeclarator',
              binding: {
                type: 'ArrayBinding',
                elements: [{
                  type: 'ArrayBinding',
                  elements: [{ type: 'BindingIdentifier', name: 'a' }],
                  rest: null,
                }],
                rest: null,
              },
              init: { type: 'LiteralNumericExpression', value: 0 },
            }],
          },
        }
      );

      testParse('var a, [a] = 0;', stmt,
        {
          type: 'VariableDeclarationStatement',
          declaration: {
            type: 'VariableDeclaration',
            kind: 'var',
            declarators: [{
              type: 'VariableDeclarator',
              binding: { type: 'BindingIdentifier', name: 'a' },
              init: null,
            }, {
              type: 'VariableDeclarator',
              binding: {
                type: 'ArrayBinding',
                elements: [{ type: 'BindingIdentifier', name: 'a' }],
                rest: null,
              },
              init: { type: 'LiteralNumericExpression', value: 0 },
            }],
          },
        }
      );

      testParse('var [a, a] = 0;', stmt,
        {
          type: 'VariableDeclarationStatement',
          declaration: {
            type: 'VariableDeclaration',
            kind: 'var',
            declarators: [{
              type: 'VariableDeclarator',
              binding: {
                type: 'ArrayBinding',
                elements: [{ type: 'BindingIdentifier', name: 'a' }, { type: 'BindingIdentifier', name: 'a' }],
                rest: null,
              },
              init: { type: 'LiteralNumericExpression', value: 0 },
            }],
          },
        }
      );

      testParse('var [a, ...a] = 0;', stmt,
        {
          type: 'VariableDeclarationStatement',
          declaration: {
            type: 'VariableDeclaration',
            kind: 'var',
            declarators: [{
              type: 'VariableDeclarator',
              binding: {
                type: 'ArrayBinding',
                elements: [{ type: 'BindingIdentifier', name: 'a' }],
                rest: { type: 'BindingIdentifier', name: 'a' },
              },
              init: { type: 'LiteralNumericExpression', value: 0 },
            }],
          },
        }
      );

      testParseFailure('var [a.b] = 0', 'Unexpected token "."');
      testParseFailure('var ([x]) = 0', 'Unexpected token "("');
    });

    suite('formal parameter', () => {
      // passing cases are tested in other function test cases.
      testParseFailure('([a.b]) => 0', 'Illegal arrow function parameter list');
      testParseFailure('function a([a.b]) {}', 'Unexpected token "."');
      testParseFailure('function* a([a.b]) {}', 'Unexpected token "."');
      testParseFailure('(function ([a.b]) {})', 'Unexpected token "."');
      testParseFailure('(function* ([a.b]) {})', 'Unexpected token "."');
      testParseFailure('({a([a.b]){}})', 'Unexpected token "."');
      testParseFailure('({*a([a.b]){}})', 'Unexpected token "."');
      testParseFailure('({set a([a.b]){}})', 'Unexpected token "."');
    });

    suite('catch clause', () => {
      testParse('try {} catch ([e]) {}', stmt,
        {
          type: 'TryCatchStatement',
          body: { type: 'Block', statements: [] },
          catchClause: {
            type: 'CatchClause',
            binding: { type: 'ArrayBinding', elements: [{ type: 'BindingIdentifier', name: 'e' }], rest: null },
            body: { type: 'Block', statements: [] },
          },
        }
      );

      testParse('try {} catch ([e, ...a]) {}', stmt,
        {
          type: 'TryCatchStatement',
          body: { type: 'Block', statements: [] },
          catchClause: {
            type: 'CatchClause',
            binding: {
              type: 'ArrayBinding',
              elements: [{ type: 'BindingIdentifier', name: 'e' }],
              rest: { type: 'BindingIdentifier', name: 'a' },
            },
            body: { type: 'Block', statements: [] },
          },
        }
      );

    });

  });
});
