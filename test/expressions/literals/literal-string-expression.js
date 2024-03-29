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

suite('Parser', () => {
  suite('literal string expression', () => {


    testParseFailure('\'', 'Unexpected end of input');
    testParseFailure('"', 'Unexpected end of input');
    testParseFailure('(\')', 'Unexpected end of input');
    testParseFailure('(\'\n\')', 'Unexpected "\\n"');
    testParseFailure('(\'\\x\')', 'Unexpected "\'"');
    testParseFailure('(\'\\u\')', 'Unexpected "\'"');
    testParseFailure('(\'\\8\')', 'Unexpected "8"');
    testParseFailure('(\'\\9\')', 'Unexpected "9"');
    testParseFailure('(\'\\x0\')', 'Unexpected "0"');
    testParseFailure('(\'\\u{2028\')', 'Unexpected "{"');
    testParseFailure('\'use strict\'; (\'\\1\')', 'Unexpected legacy octal escape sequence: \\1');
    testParseFailure('\'use strict\'; (\'\\4\')', 'Unexpected legacy octal escape sequence: \\4');
    testParseFailure('\'use strict\'; (\'\\11\')', 'Unexpected legacy octal escape sequence: \\11');
    testParseFailure('\'use strict\'; (\'\\41\')', 'Unexpected legacy octal escape sequence: \\41');
    testParseFailure('\'use strict\'; (\'\\01\')', 'Unexpected legacy octal escape sequence: \\01');
    testParseFailure('\'use strict\'; (\'\\00\')', 'Unexpected legacy octal escape sequence: \\00');
    testParseFailure('\'use strict\'; (\'\\001\')', 'Unexpected legacy octal escape sequence: \\001');
    testParseFailure('\'use strict\'; (\'\\000\')', 'Unexpected legacy octal escape sequence: \\000');
    testParseFailure('\'use strict\'; (\'\\123\')', 'Unexpected legacy octal escape sequence: \\123');
    testParseFailure('\'use strict\'; (\'\\08\')', 'Unexpected legacy octal escape sequence: \\08');
    testParseFailure('\'use strict\'; (\'\\09\')', 'Unexpected legacy octal escape sequence: \\09');
    testParseModuleFailure('(\'\\1\')', 'Unexpected legacy octal escape sequence: \\1');

    // early grammar error: 11.8.4.1
    // It is a Syntax Error if the MV of HexDigits > 1114111.
    testParseFailure('("\\u{110000}")', 'Unexpected "{"');
    testParseFailure('("\\u{FFFFFFF}")', 'Unexpected "{"');
  });
});
