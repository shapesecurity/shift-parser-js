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
  suite('literal string expression', () => {


    testParseFailure('\'', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('"', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('(\')', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('(\'\n\')', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '\n');
    testParseFailure('(\'\\x\')', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '\'');
    testParseFailure('(\'\\u\')', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '\'');
    testParseFailure('(\'\\8\')', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '8');
    testParseFailure('(\'\\9\')', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '9');
    testParseFailure('(\'\\x0\')', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '0');
    testParseFailure('(\'\u2028\')', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '\u2028');
    testParseFailure('(\'\u2029\')', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '\u2029');
    testParseFailure('(\'\\u{2028\')', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '{');
    testParseFailure('\'use strict\'; (\'\\1\')', ErrorMessages.UNEXPECTED_OCTAL_ESCAPE, '1');
    testParseFailure('\'use strict\'; (\'\\4\')', ErrorMessages.UNEXPECTED_OCTAL_ESCAPE, '4');
    testParseFailure('\'use strict\'; (\'\\11\')', ErrorMessages.UNEXPECTED_OCTAL_ESCAPE, '11');
    testParseFailure('\'use strict\'; (\'\\41\')', ErrorMessages.UNEXPECTED_OCTAL_ESCAPE, '41');
    testParseFailure('\'use strict\'; (\'\\01\')', ErrorMessages.UNEXPECTED_OCTAL_ESCAPE, '01');
    testParseFailure('\'use strict\'; (\'\\00\')', ErrorMessages.UNEXPECTED_OCTAL_ESCAPE, '00');
    testParseFailure('\'use strict\'; (\'\\001\')', ErrorMessages.UNEXPECTED_OCTAL_ESCAPE, '001');
    testParseFailure('\'use strict\'; (\'\\000\')', ErrorMessages.UNEXPECTED_OCTAL_ESCAPE, '000');
    testParseFailure('\'use strict\'; (\'\\123\')', ErrorMessages.UNEXPECTED_OCTAL_ESCAPE, '123');
    testParseFailure('\'use strict\'; (\'\\08\')', ErrorMessages.UNEXPECTED_OCTAL_ESCAPE, '08');
    testParseFailure('\'use strict\'; (\'\\09\')', ErrorMessages.UNEXPECTED_OCTAL_ESCAPE, '09');
    testParseModuleFailure('(\'\\1\')', ErrorMessages.UNEXPECTED_OCTAL_ESCAPE, '1');

    // early grammar error: 11.8.4.1
    // It is a Syntax Error if the MV of HexDigits > 1114111.
    testParseFailure('("\\u{110000}")', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '{');
    testParseFailure('("\\u{FFFFFFF}")', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '{');
  });
});
