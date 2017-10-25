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


  // programs where we choose to diverge from the ES5 specification
  suite('ES5 divergences', () => {
    // ES5: assignment to computed member expression
    // ES6: variable declaration statement


    // ES5: invalid program
    // ES6: function declaration within a block

  });


  // programs that parse according to ES5 but either fail or parse differently according to ES6
  suite('ES6 backward incompatibilities', () => {
    // ES5: in sloppy mode, future reserved words (including yield) are regular identifiers
    // ES6: yield has been moved from the future reserved words list to the keywords list


    // ES5: this declares a function-scoped variable while at the same time assigning to the block-scoped variable
    // ES6: this particular construction is explicitly disallowed


    // ES5: allows any LeftHandSideExpression on the left of an assignment
    // ES6: allows only valid bindings on the left of an assignment
    // NOTE: this is disabled due to separation of early errors in two-phase parsing
    // testParseFailure("a+b=c", "Invalid left-hand side in assignment");
    // testParseFailure("+i = 0", "Invalid left-hand side in assignment");
    // testParseFailure("new a=b", "Invalid left-hand side in assignment");
    // testParseFailure("(a+b)=c", "Invalid left-hand side in assignment");
    // testParseFailure("f()++", "Invalid left-hand side in assignment");
    // testParseFailure("--f()", "Invalid left-hand side in assignment");

    // ES5: allows initializers in for-in head
    // ES6: disallows initializers in for-in and for-of head
    testParseFailure('for(var x=1 in [1,2,3]) 0', 'Invalid variable declaration in for-in statement');
    testParseFailure('for(let x=1 in [1,2,3]) 0', 'Invalid variable declaration in for-in statement');
    testParseFailure('for(var x=1 of [1,2,3]) 0', 'Invalid variable declaration in for-of statement');
    testParseFailure('for(let x=1 of [1,2,3]) 0', 'Invalid variable declaration in for-of statement');


    // ES5: allows unicode escape sequences in regular expression flags
    // ES6: disallowes unicode escape sequences in regular expression flags
    // NOTE: this is disabled due to separation of early errors in two-phase parsing
    // testParseFailure("/a/\\u0000", "Invalid regular expression");

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
