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
let testParseModuleFailure = require('../../assertions').testParseModuleFailure;
let ErrorMessages = require('../../../dist/errors').ErrorMessages;

suite('Parser', () => {
  suite('literal numeric expression', () => {
    testParse('\n    0\n\n', expr, { type: 'LiteralNumericExpression', value: 0 });

    // Legacy Octal Integer Literal
    testParseFailure('\'use strict\'; 01', ErrorMessages.UNEXPECTED_OCTAL);
    testParseFailure('\'use strict\'; 0123', ErrorMessages.UNEXPECTED_OCTAL);
    testParseFailure('\'use strict\'; 00', ErrorMessages.UNEXPECTED_OCTAL);
    testParseFailure('\'use strict\'; 07', ErrorMessages.UNEXPECTED_OCTAL);
    testParseFailure('\'use strict\'; 08', ErrorMessages.UNEXPECTED_NOCTAL);
    testParseFailure('\'use strict\'; 019', ErrorMessages.UNEXPECTED_NOCTAL);
    testParseModuleFailure('01', ErrorMessages.UNEXPECTED_OCTAL);

    // Binary Integer Literal
    testParseFailure('0b', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('0b1a', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, 'a');
    testParseFailure('0b9', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '9');
    testParseFailure('0b18', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '8');
    testParseFailure('0b12', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '2');
    testParseFailure('0B', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('0B1a', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, 'a');
    testParseFailure('0B9', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '9');
    testParseFailure('0B18', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '8');
    testParseFailure('0B12', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '2');

    // Octal Integer Literal
    testParseFailure('0o', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('0o1a', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, 'a');
    testParseFailure('0o9', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '9');
    testParseFailure('0o18', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '8');
    testParseFailure('0O', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('0O1a', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, 'a');
    testParseFailure('0O9', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '9');
    testParseFailure('09.x', ErrorMessages.UNEXPECTED_IDENTIFIER);
    testParseFailure('0O18', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '8');
  });
});
