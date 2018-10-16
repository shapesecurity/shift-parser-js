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
let testParse = require('../assertions').testParse;
let testParseFailure = require('../assertions').testParseFailure;
let testParseModule = require('../assertions').testParseModule;
let testParseModuleFailure = require('../assertions').testParseModuleFailure;

function moduleExpr(m) {
  return m.items[0].expression;
}

suite('Parser', () => {

  // programs that parse according to ES3 but either fail or parse differently according to ES5
  suite('ES5 backward incompatibilities', () => {
    // ES3: zero-width non-breaking space is allowed in an identifier
    // ES5: zero-width non-breaking space is a whitespace character
    testParseFailure('_\uFEFF_', 'Unexpected identifier');

    // ES3: a slash in a regexp character class will terminate the regexp
    // ES5: a slash is allowed within a regexp character class
    testParseFailure('[/[/]', 'Invalid regular expression: missing /');
  });


  // programs that parse according to ES5 but either fail or parse differently according to ES6
  suite('ES6 backward incompatibilities', () => {
    // ES5: allows initializers in for-in head
    // ES6: disallows initializers in for-in and for-of head
    // ES2017: allows initializers only in for-in heads in sloppy mode, and only for var declarations with no destructuring
    testParseFailure('for(let x=1 in [1,2,3]) 0', 'Invalid variable declaration in for-in statement');
    testParseFailure('for(var x=1 of [1,2,3]) 0', 'Invalid variable declaration in for-of statement');
    testParseFailure('for(let x=1 of [1,2,3]) 0', 'Invalid variable declaration in for-of statement');


    // ES5: disallow HTML-like comment
    // ES6: allowed in Script.
    testParseFailure('a -->', 'Unexpected end of input');
    testParseFailure(';/**/-->', 'Unexpected token ">"');
    testParse('\n  -->', stmt, void 0);


    testParseModuleFailure('<!--', 'Unexpected token "<"');
    testParseModuleFailure('function a(){\n<!--\n}', 'Unexpected token "<"');
    testParseModuleFailure('-->', 'Unexpected token ">"');
    testParseModuleFailure('function a(){\n-->\n}', 'Unexpected token ">"');

    testParseModule('a<!--b', moduleExpr,
      {
        type: 'BinaryExpression',
        operator: '<',
        left: { type: 'IdentifierExpression', name: 'a' },
        right: {
          type: 'UnaryExpression',
          operator: '!',
          operand: { type: 'UpdateExpression', isPrefix: true, operator: '--',
            operand: { type: 'AssignmentTargetIdentifier', name: 'b' } },
        },
      }
    );
  });
});
