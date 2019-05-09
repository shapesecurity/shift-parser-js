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

// Reference: https://github.com/mozilla/gecko-dev/blob/master/js/src/tests/non262/async-functions/syntax-arrow.js

let testParseFailure = require('../../assertions').testParseFailure;
let testParseSuccess = require('../../assertions').testParseSuccess;
let ErrorMessages = require('../../../src/errors').ErrorMessages;

let codeReflectWithNoSyntaxErrors = [
  'async () => 1',
  'async a => 1',
  'async (a) => 1',
  'async async => 1',
  'async (async) => 1',
  'async ([a]) => 1',
  'async ([a, b]) => 1',
  'async ({a}) => 1',
  'async ({a, b}) => 1',
  // Expression body.
  'async a => a == b',

  // Expression body with nested async function.
  'async a => async',
  'async a => async b => c',
  'async a => async function() {}',
  'async a => async function b() {}',

  // Expression body with `await`.
  'async a => await 1',
  'async a => await await 1',
  'async a => await await await 1',

  'async a => await (async X => Y)',
  // But it can have `async` identifier as an operand.
  'async async => await async',

  // Block body.
  'async X => {yield}',

  // `yield` handling.
  'async X => yield',
  'async yield => X',
  'async yield => yield',
  'async X => {yield}',

  'async X => {yield}',
  'async yield => {X}',
  'async yield => {yield}',
  'function* g() { async X => yield }',

  // Not async functions.
  'async ()',
  'async (a)',
  'async (async)',
  'async ([a])',
  'async ([a, b])',
  'async ({a})',
  'async ({a, b})',

  // Async arrow function is assignment expression.
  'a ? async () => {1} : b',
  'a ? b : async () => {1}',

  // Await is still available as an identifier name in strict mode code.
  `function a() { 'use strict'; var await = 3; }
  `,
  `'use strict'; var await = 3;
  `,

  // Await is treated differently depending on context. Various cases.
  'var await = 3; async function a() { await 4; }',
  'async function a() { await 4; } var await = 5',
  'async function a() { function b() { return await; } }',
  'async function a() { var k = { async: 4 } }',
  'function a() { await: 4 }',
];

let codeReflectWithSyntaxErrors1 = [
  'async ([a=await 1]) => 1',
  'async ({a=await 1}) => 1',
];

let codeReflectWithSyntaxErrors2 = [
  'async a => async b',
  'async a => async function',
  'async a => async function()',
  'async a => await',
  'async a => await await',
];

for (let code of codeReflectWithNoSyntaxErrors) {
  testParseSuccess(code);
}

for (let code of codeReflectWithSyntaxErrors1) {
  testParseFailure(code, ErrorMessages.UNEXPECTED_NUMBER);
}

for (let code of codeReflectWithSyntaxErrors2) {
  testParseFailure(code, ErrorMessages.UNEXPECTED_EOS);
}

testParseFailure('async await => 1', ErrorMessages.ILLEGAL_AWAIT_IDENTIFIER);
testParseFailure('async (await) => 1', ErrorMessages.NO_AWAIT_IN_ASYNC_PARAMS);
testParseFailure('async ([await]) => 1', ErrorMessages.NO_AWAIT_IN_ASYNC_PARAMS);
testParseFailure('async (a=await) => 1', ErrorMessages.NO_AWAIT_IN_ASYNC_PARAMS);
testParseFailure('async (a=await) => 1', ErrorMessages.NO_AWAIT_IN_ASYNC_PARAMS);
testParseFailure('async ([a=await]) => 1', ErrorMessages.NO_AWAIT_IN_ASYNC_PARAMS);
testParseFailure('async ({a=await}) => 1', ErrorMessages.NO_AWAIT_IN_ASYNC_PARAMS);

testParseFailure('async [a] => 1', ErrorMessages.UNEXPECTED_TOKEN('=>'));
testParseFailure('async [a, b] => 1', ErrorMessages.UNEXPECTED_TOKEN('=>'));
testParseFailure('async a => await async X => Y', ErrorMessages.UNEXPECTED_TOKEN('=>'));

testParseFailure('async {a} => 1', ErrorMessages.UNEXPECTED_TOKEN('{'));
testParseFailure('async {a: b} => 1', ErrorMessages.UNEXPECTED_TOKEN('{'));
