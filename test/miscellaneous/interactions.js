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

function id(x) {
  return x;
}

suite('Parser', () => {
  suite('interactions', () => {
    // LiteralNumericExpression and StaticMemberExpression


    testParseFailure('0.toString', 'Unexpected "t"');

    // LeftHandSideExpressions


    // BinaryExpressions


    // Comments


    testParse('/* assignment */\n a = b', expr,
      {
        type: 'AssignmentExpression',
        binding: { type: 'AssignmentTargetIdentifier', name: 'a' },
        expression: { type: 'IdentifierExpression', name: 'b' },
      }
    );


    // super-properties can be the target of destructuring assignment


    // Consise arrow bodies may contain yield as an identifier even in generators.


    // CompoundAssignmentExpressions are not valid binding targets


    // YieldExpression is legal in class expression heritage
    testParse('function* a(){(class extends (yield) {});}', stmt,
      { type: 'FunctionDeclaration',
        isAsync: false,
        isGenerator: true,
        name: { 'type': 'BindingIdentifier', 'name': 'a' },
        params: { type: 'FormalParameters', items: [], rest: null },
        body: {
          type: 'FunctionBody',
          directives: [],
          statements: [{
            type: 'ExpressionStatement',
            expression: {
              type: 'ClassExpression',
              name: null,
              super: {
                type: 'YieldExpression',
                expression: null,
              },
              elements: [],
            },
          }],
        },
      }
    );

    // YieldExpression is legal in class expression body
    testParse('function* a(){(class {[yield](){}})};', stmt,
      { type: 'FunctionDeclaration',
        isAsync: false,
        isGenerator: true,
        name: { 'type': 'BindingIdentifier', 'name': 'a' },
        params: { type: 'FormalParameters', items: [], rest: null },
        body: {
          type: 'FunctionBody',
          directives: [],
          statements: [{
            type: 'ExpressionStatement',
            expression: {
              type: 'ClassExpression',
              name: null,
              super: null,
              elements: [{
                type: 'ClassElement',
                isStatic: false,
                method: {
                  type: 'Method',
                  isAsync: false,
                  isGenerator: false,
                  name: {
                    type: 'ComputedPropertyName',
                    expression: { type: 'YieldExpression', expression: null },
                  },
                  params: { type: 'FormalParameters', items: [], rest: null },
                  body: {
                    type: 'FunctionBody',
                    directives: [],
                    statements: [],
                  },
                },
              }],
            },
          }],
        },
      }
    );

    testParseFailure('({a: b += 0} = {})', 'Invalid left-hand side in assignment');
    testParseFailure('[a += b] = []', 'Invalid left-hand side in assignment');
  });
});
