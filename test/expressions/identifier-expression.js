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
let stmt = require('../helpers').stmt;

suite('Parser', () => {
  suite('identifier expression', () => {
    testParseModuleFailure('await', 'Unexpected token "await"');
    testParseModuleFailure('function f() { var await }', 'Unexpected token "await"');

    suite('let used as identifier expression', () => {
      testParseFailure('for(let[a].b of 0);', 'Unexpected token "."');
      testParseFailure('for(let[a]().b of 0);', 'Unexpected token "("');
      testParseFailure('for(let.a of 0);', 'Invalid left-hand side in for-of');
    });

    suite('unicode identifier', () => {
      testParseFailure('\\uD800\\uDC00', 'Unexpected "\\\\"');
    });
  });
});
