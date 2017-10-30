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

let expr = require('../helpers').expr;
let stmt = require('../helpers').stmt;

let testParseFailure = require('../assertions').testParseFailure;
let testParse = require('../assertions').testParse;

suite('Parser', () => {
  suite('super call', () => {


    testParse('class A extends B { constructor() { () => super(); } }', stmt,
      {
        type: 'ClassDeclaration',
        name: { type: 'BindingIdentifier', name: 'A' },
        super: { type: 'IdentifierExpression', name: 'B' },
        elements: [{
          type: 'ClassElement',
          isStatic: false,
          method: {
            type: 'Method',
            isGenerator: false,
            name: { type: 'StaticPropertyName', value: 'constructor' },
            params: { type: 'FormalParameters', items: [], rest: null },
            body: {
              type: 'FunctionBody',
              directives: [],
              statements: [{
                type: 'ExpressionStatement',
                expression: {
                  type: 'ArrowExpression',
                  params: { type: 'FormalParameters', items: [], rest: null },
                  body: { type: 'CallExpression', callee: { type: 'Super' }, arguments: [] },
                },
              }],
            },
          },
        }],
      }
    );


    testParseFailure('function f() { (super)() }', 'Unexpected token "super"');
    testParseFailure('class A extends B { constructor() { super; } }', 'Unexpected token "super"');
    testParseFailure('class A extends B { constructor() { (super)(); } }', 'Unexpected token "super"');
    testParseFailure('class A extends B { constructor() { new super(); } }', 'Unexpected token "super"');

  });

  suite('super member access', () => {


    testParseFailure('({ a() { (super).b(); } });', 'Unexpected token "super"');
    testParseFailure('class A extends B { constructor() { (super).a(); } }', 'Unexpected token "super"');

  });
});
