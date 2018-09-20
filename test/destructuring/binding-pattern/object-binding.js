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

let stmt = require('../../helpers').stmt;
let expr = require('../../helpers').expr;
let testParse = require('../../assertions').testParse;
let testParseFailure = require('../../assertions').testParseFailure;
let ErrorMessages = require('../../../dist/errors').ErrorMessages;

suite('Parser', () => {
  suite('object binding', () => {
    suite('variable declarator', () => {


      testParseFailure('var {a: b.c} = 0;', ErrorMessages.UNEXPECTED_TOKEN, '.');
    });

    suite('formal parameter', () => {


      // other passing cases are tested in other function test cases.
      testParseFailure('({e: a.b}) => 0', ErrorMessages.ILLEGAL_ARROW_FUNCTION_PARAMS);
      testParseFailure('function a({e: a.b}) {}', ErrorMessages.UNEXPECTED_TOKEN, '.');
      testParseFailure('function* a({e: a.b}) {}', ErrorMessages.UNEXPECTED_TOKEN, '.');
      testParseFailure('(function ({e: a.b}) {})', ErrorMessages.UNEXPECTED_TOKEN, '.');
      testParseFailure('(function* ({e: a.b}) {})', ErrorMessages.UNEXPECTED_TOKEN, '.');
      testParseFailure('({a({e: a.b}){}})', ErrorMessages.UNEXPECTED_TOKEN, '.');
      testParseFailure('({*a({e: a.b}){}})', ErrorMessages.UNEXPECTED_TOKEN, '.');
      testParseFailure('({set a({e: a.b}){}})', ErrorMessages.UNEXPECTED_TOKEN, '.');

    });

    suite('catch clause', () => {


      testParseFailure('try {} catch ({e: x.a}) {}', ErrorMessages.UNEXPECTED_TOKEN, '.');
    });

  });
});
