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
let expr = require('../helpers').expr;
let testParseFailure = require('../assertions').testParseFailure;
let ErrorMessages = require('../../src/errors').ErrorMessages;

suite('Parser', () => {
  suite('arrow expression', () => {


    testParse('(...[]) => 0', expr,
      { type: 'ArrowExpression',
        isAsync: false,
        params:
        { type: 'FormalParameters',
          items: [],
          rest: { type: 'ArrayBinding', elements: [], rest: null },
        },
        body: { type: 'LiteralNumericExpression', value: 0 },
      }
    );

    testParse('(a, ...[]) => 0', expr,
      { type: 'ArrowExpression',
        isAsync: false,
        params:
        { type: 'FormalParameters',
          items: [{ type: 'BindingIdentifier', name: 'a' }],
          rest: { type: 'ArrayBinding', elements: [], rest: null },
        },
        body: { type: 'LiteralNumericExpression', value: 0 },
      }
    );

    testParse('(a = []) => {}', expr,
      {
        body: {
          directives: [],
          statements: [],
          type: 'FunctionBody',
        },
        isAsync: false,
        params: {
          items: [
            {
              binding: {
                name: 'a',
                type: 'BindingIdentifier',
              },
              init: {
                elements: [],
                type: 'ArrayExpression',
              },
              type: 'BindingWithDefault',
            },
          ],
          rest: null,
          type: 'FormalParameters',
        },
        type: 'ArrowExpression',
      });

    testParseFailure('((...a = []) => {})', ErrorMessages.INVALID_REST_PARAMETERS_INITIALIZATION);
    testParseFailure('(async (...a = []) => {})', ErrorMessages.INVALID_REST_PARAMETERS_INITIALIZATION);
    testParseFailure('[]=>0', 'Unexpected token "=>"');
    testParseFailure('() + 1', 'Unexpected token "+"');
    testParseFailure('1 + ()', 'Unexpected end of input');
    testParseFailure('1 + ()', 'Unexpected end of input');
    testParseFailure('(a)\n=> 0', 'Unexpected token "=>"');
    testParseFailure('a\n=> 0', 'Unexpected token "=>"');
    testParseFailure('((a)) => 1', 'Illegal arrow function parameter list');
    testParseFailure('((a),...a) => 1', 'Unexpected token "..."');
    testParseFailure('(a,...a)', 'Unexpected end of input');
    testParseFailure('(a,...a)\n', 'Unexpected line terminator');
    testParseFailure('(a,...a)/*\r\n*/ => 0', 'Unexpected line terminator');
    testParseFailure('(a,...a)/*\u2028*/ => 0', 'Unexpected line terminator');
    testParseFailure('(a,...a)/*\u2029*/ => 0', 'Unexpected line terminator');
    testParseFailure('(a,...a)/*\n*/ => 0', 'Unexpected line terminator');
    testParseFailure('(a,...a)/*\r*/ => 0', 'Unexpected line terminator');
    testParseFailure('(a,...a)/*\u202a*/', 'Unexpected end of input');
    testParseFailure('() <= 0', 'Unexpected token "<="');
    testParseFailure('() ? 0', 'Unexpected token "?"');
    testParseFailure('() + 0', 'Unexpected token "+"');
    testParseFailure('(10) => 0', 'Illegal arrow function parameter list');
    testParseFailure('(10, 20) => 0', 'Illegal arrow function parameter list');
    testParseFailure('(...a, b) => {}', ErrorMessages.UNEXPECTED_COMMA_AFTER_REST);
    testParseFailure('(...a, ...b) => {}', ErrorMessages.UNEXPECTED_COMMA_AFTER_REST);
    testParseFailure('(a, ...b,) => {}', ErrorMessages.UNEXPECTED_COMMA_AFTER_REST);
    testParseFailure('(async (...a, b) => {})', 'Unexpected token ","');
    testParseFailure('(async (...a, ...b) => {})', 'Unexpected token ","');
    testParseFailure('(async (...x = []) => {});', ErrorMessages.INVALID_REST_PARAMETERS_INITIALIZATION);
  });
});
