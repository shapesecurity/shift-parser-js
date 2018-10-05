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
let testParseSuccess = require('../../assertions').testParseSuccess;
let testParseFailure = require('../../assertions').testParseFailure;
let testRegexAcceptSuccess = require('../../assertions').testRegexAcceptSuccess;
let testRegexAcceptFailure = require('../../assertions').testRegexAcceptFailure;

const testRegexSuccess = testParseSuccess;
const testRegexFailure = source => testParseFailure(source, 'Invalid regular expression');

suite('Parser', () => {
  suite('literal regexp expression', () => {
    testParseFailure('/(?:)/gg', 'Duplicate regular expression flag \'g\'');
    testParseFailure('/(?:)/ii', 'Duplicate regular expression flag \'i\'');
    testParseFailure('/(?:)/mm', 'Duplicate regular expression flag \'m\'');
    testParseFailure('/(?:)/yy', 'Duplicate regular expression flag \'y\'');
    testParseFailure('/(?:)/uu', 'Duplicate regular expression flag \'u\'');
    testRegexAcceptFailure('/[/');
    const regexToPass = [
      '/./',
      '/.|./',
      '/.||./',
      '/|/',
      '/|.||.|/',
      '/^$\\b\\B/',
      '/^X/',
      '/X$/',
      '/\\bX/',
      '/\\BX/',
      '/(?=t|v|X|.|$||)/',
      '/(?!t|v|X|.|$||)/',
      '/(?<=t|v|X|.|$||)/',
      '/(?<!t|v|X|.|$||)/',
      '/(?=t|v|X|.|$||)/u',
      '/(?!t|v|X|.|$||)/u',
      '/(?<=t|v|X|.|$||)/u',
      '/(?<!t|v|X|.|$||)/u',
      '/(?=t|v|X|.|$||)*/',
      '/(?!t|v|X|.|$||)*/',
      '/X*/',
      '/X+/',
      '/X?/',
      '/X*?/',
      '/X+?/',
      '/X??/',
      '/X{5}/',
      '/X{5,}/',
      '/X{5,10}/',
      '/X{5}?/',
      '/X{5,}?/',
      '/X{5,10}?/',
      '/./',
      '/\\123/',
      '/\\0/',
      '/\\0/u',
      '/\\1()/',
      '/\\1()/u',
      '/\\2()/',
      '/\\2()/u',
      '/\\d/',
      '/\\D/',
      '/\\s/',
      '/\\S/',
      '/\\w/',
      '/\\W/',
      '/\\d/u',
      '/\\D/u',
      '/\\s/u',
      '/\\S/u',
      '/\\w/u',
      '/\\W/u',
      '/[]/',
      '/[^]/',
      '/[X]/',
      '/[^X]/',
      '/[-X]/',
      '/[^-X]/',
      '/[X-]/',
      '/[^X-]/',
      '/[0-9-a-]/',
      '/[^0-9-a-]/',
      '/[0-9-a-z]/',
      '/[^0-9-a-z]/',
      '/[0-9-a-z-]/',
      '/[^0-9-a-z-]/',
      '/[]/u',
      '/[^]/u',
      '/[X]/u',
      '/[^X]/u',
      '/[-X]/u',
      '/[^-X]/u',
      '/[X-]/u',
      '/[^X-]/u',
      '/[0-9-a-]/u',
      '/[^0-9-a-]/u',
      '/[0-9-a-z]/u',
      '/[^0-9-a-z]/u',
      '/[0-9-a-z-]/u',
      '/[^0-9-a-z-]/u',
      '/[{}[||)(()]?+*.$^]/',
      '/[{}[||)(()]?+*.$^]/u',
      '/[\\b]/',
      '/[\\b]/u',
      '/\\d]/',
      '/[\\D]/',
      '/[\\s]/',
      '/[\\S]/',
      '/[\\w]/',
      '/[\\W]/',
      '/\\f/',
      '/\\n/',
      '/\\r/',
      '/\\t/',
      '/\\v/',
      '/\\ca/',
      '/\\cZ/',
      '/\\xAA/',
      '/\\x0F/',
      '/\\u10AB/',
      '/\\u10AB/u',
      '/\\uD800/u',
      '/\\uDF00/u',
      '/\\uD800\\uDF00/u',
      '/\\u{001AD}/u',
      '/\\u{10FFFF}/u',
      '/\\u{0}/u',
      '/\\L/',
      '/\\$/',
      '/\\$/u',
    ];
    const regexToFail = [
      '/(?=t|v|X|.|$||)*/u',
      '/(?!t|v|X|.|$||)*/u',
      '/(?<=t|v|X|.|$||)*/',
      '/(?<!t|v|X|.|$||)*/',
      '/(?<=t|v|X|.|$||)*/u',
      '/(?<!t|v|X|.|$||)*/u',
      '/X{10,5}/',
      '/X{10,5}?/',
      '/\\123/u',
      '/\\1/u',
      '/\\2/u',
      '/\\p{ASCII}/u',
      '/\\P{ASCII}/u',
      '/\\u{110FFFF}/u',
      '/\\L/u',

    ];
    regexToPass.forEach(source => testRegexSuccess(source));
    regexToFail.forEach(source => testRegexFailure(source));
    testParseFailure('/(?<">)/', 'Invalid regular expression');
    testParseFailure('/\\k<">/', 'Invalid regular expression');
    testParseSuccess('/[\\c]/');
    testParseSuccess('/[\\c]/u');
    testParseSuccess('/\\0/');
    testParseSuccess('/\\0/u');
    testParseSuccess('/\\1/');
    testParseSuccess('/\\7/');
    testParseSuccess('/\\15/');
    testParseSuccess('/\\153/');
    testParseSuccess('/\\72/');
    testParseSuccess('/[\\1]/');
    testParseSuccess('/[\\7]/');
    testParseSuccess('/[\\15]/');
    testParseSuccess('/[\\153]/');
    testParseSuccess('/[\\72]/');
    testParseSuccess('/[\\s-5]/');
    testParseFailure('/[\\s-5]/u', 'Invalid regular expression');
    testParseSuccess('/[4-5]/');
    testParseFailure('/[6-5]/u', 'Invalid regular expression');
    testParseSuccess('/[6-]/');
    testParseSuccess('/\\xAF/');
    testParseFailure('/\\xZZ/u', 'Invalid regular expression');
    testParseFailure('/\\ud800\\u1000/u', 'Invalid regular expression');
    testParseFailure('/\\ud800\\uZZ/u', 'Invalid regular expression');
    testParseFailure('/\\uZZ/u', 'Invalid regular expression');
    testParseSuccess('/\\u{10}/u');
    testParseFailure('/\\u{ZZ}/u', 'Invalid regular expression');
    testParseFailure('/{5}/', 'Invalid regular expression');
    testParseFailure('/{5,}/', 'Invalid regular expression');
    testParseFailure('/{5,10}/', 'Invalid regular expression');
    testParseSuccess('/{5,G}/');
    testParseSuccess('/{5,1G}/');
    testParseSuccess('/{G}/');
    testParseSuccess('/X{5}/u');
    testParseSuccess('/X{5,}/u');
    testParseSuccess('/X{5,10}/u');
    testParseFailure('/X{5,G}/u', 'Invalid regular expression');
    testParseFailure('/X{5,1G}/u', 'Invalid regular expression');
    testParseFailure('/X{G}/u', 'Invalid regular expression');
    testParseSuccess('/(?<test>)\\k<test>/');
    testParseFailure('/\\k<f>/', 'Invalid regular expression');
    testParseFailure('/5{5,1G}/u', 'Invalid regular expression');
    testParseFailure('/(?<t>)(?<t>)/', 'Invalid regular expression');


    testParse('/t|v/u', expr, { type: 'LiteralRegExpExpression', pattern: 't|v', global: false, ignoreCase: false, multiLine: false, sticky: false, unicode: true });
    testParse('/\\p{ASCII}\\u{4819F}/u', expr, { type: 'LiteralRegExpExpression', pattern: '\\p{ASCII}\\u{4819F}', global: false, ignoreCase: false, multiLine: false, sticky: false, unicode: true });
  });
});
