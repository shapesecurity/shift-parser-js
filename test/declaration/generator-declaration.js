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

let testParse = require('../assertions').testParse;
let testParseFailure = require('../assertions').testParseFailure;
let stmt = require('../helpers').stmt;
let ErrorMessages = require('../../src/errors.js').ErrorMessages;

function id(x) {
  return x;
}

suite('Parser', () => {
  suite('generator declaration', () => {


    testParse('function* a(){({yield:a}=0)}', p => {
      return stmt(p).body.statements[0].expression;
    },
    {
      type: 'AssignmentExpression',
      binding: {
        type: 'ObjectAssignmentTarget',
        properties: [{
          type: 'AssignmentTargetPropertyProperty',
          name: { type: 'StaticPropertyName', value: 'yield' },
          binding: { type: 'AssignmentTargetIdentifier', name: 'a' },
        }],
        rest: null,
      },
      expression: { type: 'LiteralNumericExpression', value: 0 },
    });


    testParseFailure('label: function* a(){}', 'Unexpected token "*"');
    testParseFailure('function*g(yield){}', ErrorMessages.ILLEGAL_YIELD_IDENTIFIER);
    testParseFailure('function*g({yield}){}', ErrorMessages.ILLEGAL_YIELD_IDENTIFIER);
    testParseFailure('function*g([yield]){}', ErrorMessages.ILLEGAL_YIELD_IDENTIFIER);
    testParseFailure('function*g({a: yield}){}', ErrorMessages.ILLEGAL_YIELD_IDENTIFIER);
    testParseFailure('function*g(yield = 0){}', ErrorMessages.ILLEGAL_YIELD_IDENTIFIER);
    testParseFailure('function*g(){ var yield; }', ErrorMessages.ILLEGAL_YIELD_IDENTIFIER);
    testParseFailure('function*g(){ var yield = 1; }', ErrorMessages.ILLEGAL_YIELD_IDENTIFIER);
    testParseFailure('function*g(){ function yield(){}; }', ErrorMessages.ILLEGAL_YIELD_IDENTIFIER);

    testParseFailure('function*g() { var yield; }', ErrorMessages.ILLEGAL_YIELD_IDENTIFIER);
    testParseFailure('function*g() { let yield; }', ErrorMessages.ILLEGAL_YIELD_IDENTIFIER);
    testParseFailure('function*g() { try {} catch (yield) {} }', ErrorMessages.ILLEGAL_YIELD_IDENTIFIER);
    testParseFailure('function*g() { ({yield}); }', ErrorMessages.ILLEGAL_YIELD_IDENTIFIER);
    testParseFailure('function*g() { ({yield} = 0); }', ErrorMessages.ILLEGAL_YIELD_IDENTIFIER);
    testParseFailure('function*g() { var {yield} = 0; }', ErrorMessages.ILLEGAL_YIELD_IDENTIFIER);
    testParseFailure('function*g() { for ({yield} in 0); }', ErrorMessages.ILLEGAL_YIELD_IDENTIFIER);
    testParseFailure('function*g() { for ({yield} in [{}]); }', ErrorMessages.ILLEGAL_YIELD_IDENTIFIER);
    testParseFailure('function*g() { for ({yield} of [{}]); }', ErrorMessages.ILLEGAL_YIELD_IDENTIFIER);
    testParseFailure('function*g() { ({yield = 0}); }', ErrorMessages.ILLEGAL_YIELD_IDENTIFIER);
    testParseFailure('function*g() { 0, {yield} = {}; }', ErrorMessages.ILLEGAL_YIELD_IDENTIFIER);
    testParseFailure('function*g() { ({yield = 0} = 0); }', ErrorMessages.ILLEGAL_YIELD_IDENTIFIER);
    testParseFailure('function*g() { var {yield = 0} = 0; }', ErrorMessages.ILLEGAL_YIELD_IDENTIFIER);
    testParseFailure('function*g() { for ({yield = 0} in 0); }', ErrorMessages.ILLEGAL_YIELD_IDENTIFIER);
  });
});
