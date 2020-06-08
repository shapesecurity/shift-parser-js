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

let expr = require('../../helpers').expr;
let testParse = require('../../assertions').testParse;
let testParseFailure = require('../../assertions').testParseFailure;

suite('Parser', () => {
  suite('object binding', () => {
    suite('assignment', () => {
      testParse('({a = 0, ...b} = 0);', expr, {
        type: 'AssignmentExpression',
        binding: {
          type: 'ObjectAssignmentTarget',
          properties: [
            {
              type: 'AssignmentTargetPropertyIdentifier',
              binding: { type: 'AssignmentTargetIdentifier', name: 'a' },
              init: { type: 'LiteralNumericExpression', value: 0 },
            },
          ],
          rest: {
            type: 'AssignmentTargetIdentifier',
            name: 'b',
          },
        },
        expression: { type: 'LiteralNumericExpression', value: 0 },
      });

      testParseFailure('({a = 0});', 'Illegal property initializer');
      testParseFailure('({a} += 0);', 'Invalid left-hand side in assignment');
      testParseFailure('({a,,} = 0)', 'Unexpected token ","');
      testParseFailure('({,a,} = 0)', 'Unexpected token ","');
      testParseFailure('({a,,a} = 0)', 'Unexpected token ","');
      testParseFailure('({function} = 0)', 'Unexpected token "function"');
      testParseFailure('({a:function} = 0)', 'Unexpected token "}"');
      testParseFailure('({a:for} = 0)', 'Unexpected token "for"');
      testParseFailure('({\'a\'} = 0)', 'Unexpected token "}"');
      testParseFailure('({var} = 0)', 'Unexpected token "var"');
      testParseFailure('({a.b} = 0)', 'Unexpected token "."');
      testParseFailure('({0} = 0)', 'Unexpected token "}"');
    });
  });
});
