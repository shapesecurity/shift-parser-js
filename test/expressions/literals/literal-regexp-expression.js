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
  suite('literal regexp expression', () => {
    // Regular Expression Literals
    testParse('/a/', expr, { type: 'LiteralRegExpExpression', pattern: 'a',
      global: false, ignoreCase: false, multiLine: false, sticky: false, unicode: false });
    testParse('/\\0/', expr, { type: 'LiteralRegExpExpression', pattern: '\\0',
      global: false, ignoreCase: false, multiLine: false, sticky: false, unicode: false });
    testParse('/\\1/u', expr, { type: 'LiteralRegExpExpression', pattern: '\\1',
      global: false, ignoreCase: false, multiLine: false, sticky: false, unicode: true });
    testParse('/a/;', expr, { type: 'LiteralRegExpExpression', pattern: 'a',
      global: false, ignoreCase: false, multiLine: false, sticky: false, unicode: false });
    testParse('/a/i', expr, { type: 'LiteralRegExpExpression', pattern: 'a',
      global: false, ignoreCase: true, multiLine: false, sticky: false, unicode: false });
    testParse('/a/i;', expr, { type: 'LiteralRegExpExpression', pattern: 'a',
      global: false, ignoreCase: true, multiLine: false, sticky: false, unicode: false });
    testParse('/[--]/', expr, { type: 'LiteralRegExpExpression', pattern: '[--]',
      global: false, ignoreCase: false, multiLine: false, sticky: false, unicode: false });
    testParse('/[a-z]/i', expr, { type: 'LiteralRegExpExpression', pattern: '[a-z]',
      global: false, ignoreCase: true, multiLine: false, sticky: false, unicode: false });
    testParse('/[x-z]/i', expr, { type: 'LiteralRegExpExpression', pattern: '[x-z]',
      global: false, ignoreCase: true, multiLine: false, sticky: false, unicode: false });
    testParse('/[a-c]/i', expr, { type: 'LiteralRegExpExpression', pattern: '[a-c]',
      global: false, ignoreCase: true, multiLine: false, sticky: false, unicode: false });
    testParse('/[P QR]/i', expr, { type: 'LiteralRegExpExpression', pattern: '[P QR]',
      global: false, ignoreCase: true, multiLine: false, sticky: false, unicode: false });
    testParse('/[\\]/]/', expr, { type: 'LiteralRegExpExpression', pattern: '[\\]/]',
      global: false, ignoreCase: false, multiLine: false, sticky: false, unicode: false });
    testParse('/foo\\/bar/', expr, { type: 'LiteralRegExpExpression', pattern: 'foo\\/bar',
      global: false, ignoreCase: false, multiLine: false, sticky: false, unicode: false });
    testParse('/=([^=\\s])+/g', expr, { type: 'LiteralRegExpExpression', pattern: '=([^=\\s])+',
      global: true, ignoreCase: false, multiLine: false, sticky: false, unicode: false });
    testParse('/(()(?:\\2)((\\4)))/;', expr, { type: 'LiteralRegExpExpression', pattern: '(()(?:\\2)((\\4)))',
      global: false, ignoreCase: false, multiLine: false, sticky: false, unicode: false });
    testParse('/((((((((((((.))))))))))))\\12/;', expr, { type: 'LiteralRegExpExpression',
      pattern: '((((((((((((.))))))))))))\\12',
      global: false, ignoreCase: false, multiLine: false, sticky: false, unicode: false });
    testParse('/\\.\\/\\\\/u', expr, { type: 'LiteralRegExpExpression',
      pattern: '\\.\\/\\\\', global: false, ignoreCase: false, multiLine: false, sticky: false, unicode: true });
    testParse('/\\uD834\\uDF06\\u{1d306}/u', expr,
      { type: 'LiteralRegExpExpression', pattern: '\\uD834\\uDF06\\u{1d306}',
        global: false, ignoreCase: false, multiLine: false, sticky: false, unicode: true });
    testParse('/\\uD834/u', expr, { type: 'LiteralRegExpExpression',
      pattern: '\\uD834', global: false, ignoreCase: false, multiLine: false, sticky: false, unicode: true });
    testParse('/\\uDF06/u', expr, { type: 'LiteralRegExpExpression',
      pattern: '\\uDF06', global: false, ignoreCase: false, multiLine: false, sticky: false, unicode: true });
    testParse('/[-a-]/', expr, { type: 'LiteralRegExpExpression',
      pattern: '[-a-]', global: false, ignoreCase: false, multiLine: false, sticky: false, unicode: false });
    testParse('/[-\\-]/u', expr, { type: 'LiteralRegExpExpression',
      pattern: '[-\\-]', global: false, ignoreCase: false, multiLine: false, sticky: false, unicode: true });
    testParse('/[-a-b-]/', expr, { type: 'LiteralRegExpExpression',
      pattern: '[-a-b-]', global: false, ignoreCase: false, multiLine: false, sticky: false, unicode: false });
    testParse('/[]/', expr, { type: 'LiteralRegExpExpression',
      pattern: '[]', global: false, ignoreCase: false, multiLine: false, sticky: false, unicode: false });

    testParse('/0/g.test', expr, {
      type: 'StaticMemberExpression',
      object: { type: 'LiteralRegExpExpression', pattern: '0', global: true,
        ignoreCase: false, multiLine: false, sticky: false, unicode: false },
      property: 'test',
    });

    // valid only if Annex B.1.4 is implemented
    testParse('/{/;', expr, { type: 'LiteralRegExpExpression', pattern: '{',
      global: false, ignoreCase: false, multiLine: false, sticky: false, unicode: false });
    testParse('/}/;', expr, { type: 'LiteralRegExpExpression', pattern: '}',
      global: false, ignoreCase: false, multiLine: false, sticky: false, unicode: false });
    testParse('/}?/u;', expr, { type: 'LiteralRegExpExpression', pattern: '}?',
      global: false, ignoreCase: false, multiLine: false, sticky: false, unicode: true });
    testParse('/{*/u;', expr, { type: 'LiteralRegExpExpression', pattern: '{*', global: false,
      ignoreCase: false, multiLine: false, sticky: false, unicode: true });
    testParse('/{}/;', expr, { type: 'LiteralRegExpExpression', pattern: '{}', global: false,
      ignoreCase: false, multiLine: false, sticky: false, unicode: false });
    testParse('/.{.}/;', expr, { type: 'LiteralRegExpExpression', pattern: '.{.}', global: false,
      ignoreCase: false, multiLine: false, sticky: false, unicode: false });
    testParse('/[\\w-\\s]/;', expr, { type: 'LiteralRegExpExpression', pattern: '[\\w-\\s]',
      global: false, ignoreCase: false, multiLine: false, sticky: false, unicode: false });
    testParse('/[\\s-\\w]/;', expr, { type: 'LiteralRegExpExpression', pattern: '[\\s-\\w]',
      global: false, ignoreCase: false, multiLine: false, sticky: false, unicode: false });
    testParse('/(?=.)*/;', expr, { type: 'LiteralRegExpExpression', pattern: '(?=.)*',
      global: false, ignoreCase: false, multiLine: false, sticky: false, unicode: false });
    testParse('/(?!.){0,}?/;', expr, { type: 'LiteralRegExpExpression', pattern: '(?!.){0,}?',
      global: false, ignoreCase: false, multiLine: false, sticky: false, unicode: false });
    // NOTE: The {0,} here is not a quantifier! It is just a regular atom.
    testParse('/(?!.){0,}?/u', expr, { type: 'LiteralRegExpExpression', pattern: '(?!.){0,}?',
      global: false, ignoreCase: false, multiLine: false, sticky: false, unicode: true });

    testParseFailure('/(?:)/gg', 'Duplicate regular expression flag \'g\'');
    testParseFailure('/(?:)/ii', 'Duplicate regular expression flag \'i\'');
    testParseFailure('/(?:)/mm', 'Duplicate regular expression flag \'m\'');
    testParseFailure('/(?:)/yy', 'Duplicate regular expression flag \'y\'');
    testParseFailure('/(?:)/uu', 'Duplicate regular expression flag \'u\'');
  });
});
