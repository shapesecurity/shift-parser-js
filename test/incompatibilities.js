
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

var assertParseFailure = require('./assertions').assertParseFailure;
var assertParseSuccess = require('./assertions').assertParseSuccess;

describe("Parser", function() {
  // programs that parse according to ES3 but either fail or parse differently according to ES5
  describe("ES5 backward incompatibilities", function() {
    // ES3: zero-width non-breaking space is allowed in an identifier
    // ES5: zero-width non-breaking space is a whitespace character
    assertParseFailure("_\uFEFF_", "Unexpected identifier");

    // ES3: a slash in a regexp character class will terminate the regexp
    // ES5: a slash is allowed within a regexp character class
    assertParseFailure("[/[/]", "Invalid regular expression: missing /");
  });

  // programs where we choose to diverge from the ES5 specification
  describe("ES5 divergences", function() {
    // ES5: assignment to computed member expression
    // ES6: variable declaration statement
    // We choose to fail here because we support ES5 with a minor addition: let/const with binding identifier.
    // This is the same decision esprima has made.
    assertParseFailure("let[a] = b;", "Unexpected token [");
    assertParseFailure("const[a] = b;", "Unexpected token [");
    assertParseFailure("var let", "Unexpected token let");
    assertParseFailure("var const", "Unexpected token const");

    // ES5: invalid program
    // ES6: function declaration within a block
    // We choose to parse this because of ubiquitous support among popular interpreters, despite disagreements about semantics.
    assertParseSuccess("{ function f(){} }");
  });

  // programs that parse according to ES5 but either fail or parse differently according to ES6
  describe("ES6 backward incompatibilities", function() {
    // ES5: in sloppy mode, future reserved words (including yield) are regular identifiers
    // ES6: yield has been moved from the future reserved words list to the keywords list
    assertParseSuccess("var yield = function yield(){};");

    // ES5: this declares a function-scoped variable while at the same time assigning to the block-scoped variable
    // ES6: this particular construction is explicitly disallowed
    assertParseSuccess("try {} catch(e) { var e = 0; }");

    // ES5: allows any LeftHandSideExpression on the left of an assignment
    // ES6: allows only valid bindings on the left of an assignment
    assertParseFailure("a+b=c", "Invalid left-hand side in assignment");
    assertParseSuccess("(a+b)=c");
    assertParseFailure("+i = 42", "Invalid left-hand side in assignment");
  });
});
