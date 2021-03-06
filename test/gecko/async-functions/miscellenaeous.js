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

// Reference : https://github.com/mozilla/gecko-dev/tree/master/js/src/tests/non262/async-functions

let testParseSuccess = require('../../assertions').testParseSuccess;
let testEarlyError = require('../../assertions').testEarlyError;
let ErrorMessages = require('../../../src/errors').ErrorMessages;

// Newline is allowed between await and operand
let codeWithNoSyntaxErrors = [
  `
  var expr = async function foo() {
    return await
    10;
  };
  `,
  'async\nfunction a(){}',
];

let codeWithSyntaxErrors = [
  // Await is not allowed as a default expr.
  'async function a(k = await 3) {}',
  'async function a() { async function b(k = await 3) {} }',
  'async function a() { async function b(k = [await 3]) {} }',

  'async function a() { async function b([k = await 3]) {} }',
  'async function a() { async function b([k = [await 3]]) {} }',
  'async function a() { async function b({k = await 3}) {} }',
  'async function a() { async function b({k = [await 3]}) {} }',
];

for (let code of codeWithNoSyntaxErrors) {
  testParseSuccess(code);
}

for (let code of codeWithSyntaxErrors) {
  testEarlyError(code, ErrorMessages.INVALID_ASYNC_PARAMS);
}
