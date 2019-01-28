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
  suite('object binding', () => {
    suite('assignment', () => {


      testParseFailure('({a = 0});', ErrorMessages.ILLEGAL_PROPERTY);
      testParseFailure('({a} += 0);', ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
      testParseFailure('({a,,} = 0)', ErrorMessages.UNEXPECTED_TOKEN, ',');
      testParseFailure('({,a,} = 0)', ErrorMessages.UNEXPECTED_TOKEN, ',');
      testParseFailure('({a,,a} = 0)', ErrorMessages.UNEXPECTED_TOKEN, ',');
      testParseFailure('({function} = 0)', ErrorMessages.UNEXPECTED_TOKEN, 'function');
      testParseFailure('({a:function} = 0)', ErrorMessages.UNEXPECTED_TOKEN, '}');
      testParseFailure('({a:for} = 0)', ErrorMessages.UNEXPECTED_TOKEN, 'for');
      testParseFailure('({\'a\'} = 0)', ErrorMessages.UNEXPECTED_TOKEN, '}');
      testParseFailure('({var} = 0)', ErrorMessages.UNEXPECTED_TOKEN, 'var');
      testParseFailure('({a.b} = 0)', ErrorMessages.UNEXPECTED_TOKEN, '.');
      testParseFailure('({0} = 0)', ErrorMessages.UNEXPECTED_TOKEN, '}');
    });
  });
});
