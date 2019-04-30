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

let testParseFailure = require('../../assertions').testParseFailure;
let testParseSuccess = require('../../assertions').testParseSuccess;
let ErrorMessages = require('../../../src/errors').ErrorMessages;

function assertNoSyntaxError(code) {
  testParseSuccess(code);
}

function assertSyntaxError(code, message) {
  testParseFailure(code, message);
}
function assertSyntaxErrorForPropertyNames(code) {
  assertSyntaxError(code, ErrorMessages.UNEXPECTED_TOKEN('async'));
}
function assertSyntaxErrorForAwaitIdentfier(code) {
  assertSyntaxError(code, ErrorMessages.ILLEGAL_AWAIT_IDENTIFIER);
}

// async property name error
for (let decl of ['var', 'let', 'const']) {
  assertSyntaxErrorForPropertyNames(`${decl} {async async: a} = {}`);
  assertSyntaxErrorForPropertyNames(`${decl} {async async} = {}`);
  assertSyntaxErrorForPropertyNames(`${decl} {async async, } = {}`);
  assertSyntaxErrorForPropertyNames(`${decl} {async async = 0} = {}`);
}

testParseFailure('await 10', ErrorMessages.UNEXPECTED_NUMBER);

// |await| expression is invalid in arrow functions in async-context.
let codeContainingAwaitasIdentifier = [
  'async(a = await/r/g) => {}',
  'async(a = (b = await/r/g) => {}) => {}',
  '(a = async(b = await/r/g) => {}) => {}',
  'async(a = async(b = await/r/g) => {}) => {}',
];

for (let code of codeContainingAwaitasIdentifier) {
  assertSyntaxErrorForAwaitIdentfier(code);
}

let codeContainingAwaitAsRestBindingParam = [
  'async(...await) => {}',
  'async(a, ...await) => {}',
  '(a = async(...await) => {}) => {}',
  'async(a = (...await) => {}) => {}',
  'async(a = async(...await) => {}) => {}',
];

// |await| cannot be used as rest-binding parameter in arrow functions in async-context.
for (let code of codeContainingAwaitAsRestBindingParam) {
  assertSyntaxErrorForAwaitIdentfier(code);
}

let codeContainingAwaitWithNoSyntaxError = [
  '(a = await/r/g) => {}',
  '(a = (b = await/r/g) => {}) => {}',
  '(...await) => {}',
  '(a, ...await) => {}',
  '(a = (...await) => {}) => {}',
  '(a = (b, ...await) => {}) => {}',
];

for (let code of codeContainingAwaitWithNoSyntaxError) {
  assertNoSyntaxError(code);
}
