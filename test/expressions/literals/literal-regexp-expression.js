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
let ErrorMessages = require('../../../dist/errors').ErrorMessages;

suite('Parser', () => {
  suite('literal regexp expression', () => {
    testParseFailure('/(?:)/gg', ErrorMessages.DUPLICATE_REGEXP_FLAGS, 'g');
    testParseFailure('/(?:)/ii', ErrorMessages.DUPLICATE_REGEXP_FLAGS, 'i');
    testParseFailure('/(?:)/mm', ErrorMessages.DUPLICATE_REGEXP_FLAGS, 'm');
    testParseFailure('/(?:)/yy', ErrorMessages.DUPLICATE_REGEXP_FLAGS, 'y');
    testParseFailure('/(?:)/uu', ErrorMessages.DUPLICATE_REGEXP_FLAGS, 'u');
  });
});
