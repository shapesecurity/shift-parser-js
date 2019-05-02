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

let expr = require('../helpers').expr;
let stmt = require('../helpers').stmt;
let testParseFailure = require('../assertions').testParseFailure;
let testParse = require('../assertions').testParse;
let ErrorMessages = require('../../src/errors').ErrorMessages;

suite('Parser', () => {
  suite('function expression', () => {


    testParseFailure('(function(...a, b){})', ErrorMessages.UNEXPECTED_COMMA_AFTER_REST);
    testParseFailure('(function((a)){})', 'Unexpected token "("');
    testParseFailure('(function(...a = []) {})', ErrorMessages.INVALID_REST_PARAMETERS_INITIALIZATION);
    testParseFailure('(async function(...a = []) {})', ErrorMessages.INVALID_REST_PARAMETERS_INITIALIZATION);
    testParseFailure('(function(...a, ...b){})', ErrorMessages.UNEXPECTED_COMMA_AFTER_REST);
    testParseFailure('(async function(...a, b){})', ErrorMessages.UNEXPECTED_COMMA_AFTER_REST);
    testParseFailure('(async function(...a, ...b){})', ErrorMessages.UNEXPECTED_COMMA_AFTER_REST);
  });
});
