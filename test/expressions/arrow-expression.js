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
let ErrorMessages = require('../../dist/errors').ErrorMessages;

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


    testParseFailure('[]=>0', ErrorMessages.UNEXPECTED_TOKEN, '=>');
    testParseFailure('() + 1', ErrorMessages.UNEXPECTED_TOKEN, '+');
    testParseFailure('1 + ()', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('1 + ()', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('(a)\n=> 0', ErrorMessages.UNEXPECTED_TOKEN, '=>');
    testParseFailure('a\n=> 0', ErrorMessages.UNEXPECTED_TOKEN, '=>');
    testParseFailure('((a)) => 1', ErrorMessages.ILLEGAL_ARROW_FUNCTION_PARAMS);
    testParseFailure('((a),...a) => 1', ErrorMessages.UNEXPECTED_TOKEN, '...');
    testParseFailure('(a,...a)', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('(a,...a)\n', ErrorMessages.UNEXPECTED_LINE_TERMINATOR);
    testParseFailure('(a,...a)/*\r\n*/ => 0', ErrorMessages.UNEXPECTED_LINE_TERMINATOR);
    testParseFailure('(a,...a)/*\u2028*/ => 0', ErrorMessages.UNEXPECTED_LINE_TERMINATOR);
    testParseFailure('(a,...a)/*\u2029*/ => 0', ErrorMessages.UNEXPECTED_LINE_TERMINATOR);
    testParseFailure('(a,...a)/*\n*/ => 0', ErrorMessages.UNEXPECTED_LINE_TERMINATOR);
    testParseFailure('(a,...a)/*\r*/ => 0', ErrorMessages.UNEXPECTED_LINE_TERMINATOR);
    testParseFailure('(a,...a)/*\u202a*/', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('() <= 0', ErrorMessages.UNEXPECTED_TOKEN, '<=');
    testParseFailure('() ? 0', ErrorMessages.UNEXPECTED_TOKEN, '?');
    testParseFailure('() + 0', ErrorMessages.UNEXPECTED_TOKEN, '+');
    testParseFailure('(10) => 0', ErrorMessages.ILLEGAL_ARROW_FUNCTION_PARAMS);
    testParseFailure('(10, 20) => 0', ErrorMessages.ILLEGAL_ARROW_FUNCTION_PARAMS);
  });
});
