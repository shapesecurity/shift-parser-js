/**
 * Copyright 2015 Shape Security, Inc.
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


let testParse = require('../assertions').testParse;
let expr = require('../helpers').expr;
let testParseFailure = require('../assertions').testParseFailure;
let ErrorMessages = require('../../dist/errors').ErrorMessages;

suite('Parser', () => {
  suite('grouped expressions', () => {
    testParseFailure('(0, {a = 0}) = 0', ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
    testParseFailure('({a = 0})', ErrorMessages.ILLEGAL_PROPERTY);
    testParseFailure('(0, {a = 0}) => 0', ErrorMessages.ILLEGAL_ARROW_FUNCTION_PARAMS);
    testParseFailure('({a = 0}, {a = 0}, 0) => 0', ErrorMessages.UNEXPECTED_NUMBER);
  });
});
