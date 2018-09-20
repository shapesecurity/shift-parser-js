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
let ErrorMessages = require('../../dist/errors').ErrorMessages;

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
        }] },
      right: { type: 'IdentifierExpression', name: 'b' },
      body: { type: 'EmptyStatement' },
    });

    testParseFailure('for(let of 0);', ErrorMessages.UNEXPECTED_NUMBER);
    testParseFailure('for(this of 0);', ErrorMessages.INVALID_LHS_IN_FOR_OF);

    testParseFailure('for(var a = 0 of b);', ErrorMessages.INVALID_VAR_INIT_FOR_OF);
    testParseFailure('for(let a = 0 of b);', ErrorMessages.INVALID_VAR_INIT_FOR_OF);
    testParseFailure('for(const a = 0 of b);', ErrorMessages.INVALID_VAR_INIT_FOR_OF);

    testParseFailure('for(({a}) of 0);', ErrorMessages.INVALID_LHS_IN_FOR_OF);
    testParseFailure('for(([a]) of 0);', ErrorMessages.INVALID_LHS_IN_FOR_OF);

    testParseFailure('for(var a of b, c);', ErrorMessages.UNEXPECTED_TOKEN, ',');
    testParseFailure('for(a of b, c);', ErrorMessages.UNEXPECTED_TOKEN, ',');
  });
});
