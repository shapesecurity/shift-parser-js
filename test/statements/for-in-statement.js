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

let testParse = require('../assertions').testParse;
let testParseFailure = require('../assertions').testParseFailure;
let stmt = require('../helpers').stmt;

suite('Parser', () => {
  suite('for in statement', () => {


    testParse('for([{a=0}] in b);', stmt, {
      type: 'ForInStatement',
      left: {
        type: 'ArrayAssignmentTarget',
        rest: null,
        elements: [{
          type: 'ObjectAssignmentTarget',
          properties: [{
            type: 'AssignmentTargetPropertyIdentifier',
            binding: { type: 'AssignmentTargetIdentifier', name: 'a' },
            init: { type: 'LiteralNumericExpression', value: 0 } }],
          rest: null,
        }] },
      right: { type: 'IdentifierExpression', name: 'b' },
      body: { type: 'EmptyStatement' },
    });

    testParse('for(let [a=b in c] in null);', stmt, {
      type: 'ForInStatement',
      left: {
        type: 'VariableDeclaration',
        kind: 'let',
        declarators: [{ type: 'VariableDeclarator', binding: {
          type: 'ArrayBinding',
          elements: [{
            type: 'BindingWithDefault',
            binding: { type: 'BindingIdentifier', name: 'a' },
            init: {
              type: 'BinaryExpression',
              left: { type: 'IdentifierExpression', name: 'b' },
              operator: 'in',
              right: { type: 'IdentifierExpression', name: 'c' },
            },
          }],
          rest: null,
        }, init: null }],
      },
      right: { type: 'LiteralNullExpression' },
      body: { type: 'EmptyStatement' },
    });

    testParse('for(var a in b, c);', stmt, {
      type: 'ForInStatement',
      left: {
        type: 'VariableDeclaration',
        kind: 'var',
        declarators: [{ type: 'VariableDeclarator', binding: { type: 'BindingIdentifier', name: 'a' }, init: null }],
      },
      right: {
        type: 'BinaryExpression',
        operator: ',',
        left: { type: 'IdentifierExpression', name: 'b' },
        right: { type: 'IdentifierExpression', name: 'c' },
      },
      body: { type: 'EmptyStatement' },
    });
    testParse('for(a in b, c);', stmt, {
      type: 'ForInStatement',
      left: { type: 'AssignmentTargetIdentifier', name: 'a' },
      right: {
        type: 'BinaryExpression',
        operator: ',',
        left: { type: 'IdentifierExpression', name: 'b' },
        right: { type: 'IdentifierExpression', name: 'c' },
      },
      body: { type: 'EmptyStatement' },
    });

    testParse('for(var a = 0 in b, c);', stmt, {
      type: 'ForInStatement',
      left: {
        type: 'VariableDeclaration',
        kind: 'var',
        declarators: [{ type: 'VariableDeclarator', binding: { type: 'BindingIdentifier', name: 'a' }, init: { type: 'LiteralNumericExpression', value: 0 } }],
      },
      right: {
        type: 'BinaryExpression',
        operator: ',',
        left: { type: 'IdentifierExpression', name: 'b' },
        right: { type: 'IdentifierExpression', name: 'c' },
      },
      body: { type: 'EmptyStatement' },
    });

    testParseFailure('for(let a = 0 in b);', 'Invalid variable declaration in for-in statement');
    testParseFailure('for(const a = 0 in b);', 'Invalid variable declaration in for-in statement');
    testParseFailure('for(let ? b : c in 0);', 'Invalid left-hand side in for-in');

    testParseFailure('for(({a}) in 0);', 'Invalid left-hand side in for-in');
    testParseFailure('for(([a]) in 0);', 'Invalid left-hand side in for-in');
    testParseFailure('for(var [] = 0 in b);', 'Invalid variable declaration in for-in statement');
    testParseFailure('for(var {} = 0 in b);', 'Invalid variable declaration in for-in statement');
    testParseFailure('for(let a = 0 in b);', 'Invalid variable declaration in for-in statement');
    testParseFailure('for(const a = 0 in b);', 'Invalid variable declaration in for-in statement');
    testParseFailure('"use strict"; for(var a = 0 in b);', 'Invalid variable declaration in for-in statement');
    testParseFailure('let b = []; for await(a in b);', 'Unexpected token "in"');
  });
});
