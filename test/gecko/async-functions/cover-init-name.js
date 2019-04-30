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

// Reference : https://github.com/mozilla/gecko-dev/tree/master/js/src/tests/non262/async-functions/cover-init-name-syntax.js

let testParseSuccess = require('../../assertions').testParseSuccess;
let testParseFailure = require('../../assertions').testParseFailure;
let ErrorMessages = require('../../../src/errors').ErrorMessages;

let codeContainingCoverInitNameWithNoSyntaxError = [
  // CoverInitName in async arrow parameters
  'async ({a = 1}) => {}',
  'async ({a = 1}, {b = 2}) => {}',
  'async ({a = 1}, {b = 2}, {c = 3}) => {}',
  'async ({a = 1} = {}, {b = 2}, {c = 3}) => {}',
  'async ({a = 1} = {}, {b = 2} = {}, {c = 3}) => {}',
  'async ({a = 1} = {}, {b = 2} = {}, {c = 3} = {}) => {}',

  // CoverInitName nested in array destructuring.
  'async ([{a = 0}]) => {}',

  // CoverInitName nested in rest pattern.
  'async ([...[{a = 0}]]) => {}',

  // CoverInitName nested in object destructuring.
  'async ({p: {a = 0}}) => {}',
];

// CoverInitName in CoverCallExpressionAndAsyncArrowHead
let codeContainingCoverInitNameWithSyntaxError = [
  'obj.async({a = 1}, {b = 2} = {}, {c = 3} = {})',
  'typeof async({a = 1}, {b = 2} = {}, {c = 3} = {})',
  'NotAsync({a = 1})',
  'NotAsync({a = 1}, {b = 2})',
  'NoAsync({a = 1}, {b = 2}, {c = 3})',
  'NoAsync({a = 1} = {}, {b = 2}, {c = 3})',
  'NoAsync({a = 1} = {}, {b = 2} = {}, {c = 3})',
  'NoAsync({a = 1}, {b = 2} = {}, {c = 3} = {})',
];

for (let code of codeContainingCoverInitNameWithNoSyntaxError) {
  testParseSuccess(code);
}

for (let code of codeContainingCoverInitNameWithSyntaxError) {
  testParseFailure(code, ErrorMessages.ILLEGAL_PROPERTY);
}
