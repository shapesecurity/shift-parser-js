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

let testParse = require('../assertions').testParse;
let testParseFailure = require('../assertions').testParseFailure;
let testParseModuleFailure = require('../assertions').testParseModuleFailure;
let expr = require('../helpers').expr;
let ErrorMessages = require('../../dist/errors').ErrorMessages;

suite('Parser', () => {
  suite('identifier expression', () => {
    testParse('await', expr, { type: 'IdentifierExpression', name: 'await' });
    testParseModuleFailure('await', ErrorMessages.UNEXPECTED_TOKEN, 'await');
    testParseModuleFailure('function f() { var await }', ErrorMessages.UNEXPECTED_TOKEN, 'await');

    suite('let used as identifier expression', () => {
      testParseFailure('for(let[a].b of 0);', ErrorMessages.UNEXPECTED_TOKEN, '.');
      testParseFailure('for(let[a]().b of 0);', ErrorMessages.UNEXPECTED_TOKEN, '(');
      testParseFailure('for(let.a of 0);', ErrorMessages.INVALID_LHS_IN_FOR_OF);
    });

    suite('unicode identifier', () => {
      testParseFailure('\\uD800\\uDC00', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '\\');
    });
  });
});
