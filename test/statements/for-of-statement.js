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

suite('Parser', () => {
  suite('for of statement', () => {


    testParse('for([{a=0}] of b);', stmt, {
      type: 'ForOfStatement',
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

    testParseFailure('for(let of 0);', 'Unexpected number');
    testParseFailure('for(this of 0);', 'Invalid left-hand side in for-of');

    testParseFailure('for(var a = 0 of b);', 'Invalid variable declaration in for-of statement');
    testParseFailure('for(let a = 0 of b);', 'Invalid variable declaration in for-of statement');
    testParseFailure('for(const a = 0 of b);', 'Invalid variable declaration in for-of statement');

    testParseFailure('for(({a}) of 0);', 'Invalid left-hand side in for-of');
    testParseFailure('for(([a]) of 0);', 'Invalid left-hand side in for-of');

    testParseFailure('for(var a of b, c);', 'Unexpected token ","');
    testParseFailure('for(a of b, c);', 'Unexpected token ","');
  });
});
