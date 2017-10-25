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
  suite('literal numeric expression', () => {


    testParse('\n    0\n\n', expr, { type: 'LiteralNumericExpression', value: 0 });


    // Legacy Octal Integer Literal


    testParse('\n    0\n\n', expr, { type: 'LiteralNumericExpression', value: 0 });


    testParseFailure('\'use strict\'; 01', 'Unexpected legacy octal integer literal');
    testParseFailure('\'use strict\'; 0123', 'Unexpected legacy octal integer literal');
    testParseFailure('\'use strict\'; 00', 'Unexpected legacy octal integer literal');
    testParseFailure('\'use strict\'; 07', 'Unexpected legacy octal integer literal');
    testParseFailure('\'use strict\'; 08', 'Unexpected noctal integer literal');
    testParseFailure('\'use strict\'; 019', 'Unexpected noctal integer literal');
    testParseModuleFailure('01', 'Unexpected legacy octal integer literal');

    // Binary Integer Literal


    testParseFailure('0b', 'Unexpected end of input');
    testParseFailure('0b1a', 'Unexpected "a"');
    testParseFailure('0b9', 'Unexpected "9"');
    testParseFailure('0b18', 'Unexpected "8"');
    testParseFailure('0b12', 'Unexpected "2"');
    testParseFailure('0B', 'Unexpected end of input');
    testParseFailure('0B1a', 'Unexpected "a"');
    testParseFailure('0B9', 'Unexpected "9"');
    testParseFailure('0B18', 'Unexpected "8"');
    testParseFailure('0B12', 'Unexpected "2"');

    // Octal Integer Literal


    testParseFailure('0o', 'Unexpected end of input');
    testParseFailure('0o1a', 'Unexpected "a"');
    testParseFailure('0o9', 'Unexpected "9"');
    testParseFailure('0o18', 'Unexpected "8"');
    testParseFailure('0O', 'Unexpected end of input');
    testParseFailure('0O1a', 'Unexpected "a"');
    testParseFailure('0O9', 'Unexpected "9"');
    testParseFailure('09.x', 'Unexpected identifier');
    testParseFailure('0O18', 'Unexpected "8"');

  });
});
