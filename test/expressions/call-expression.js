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

var Shift = require("shift-ast");

var expr = require("../helpers").expr;
var testParse = require("../assertions").testParse;
var testParseFailure = require("../assertions").testParseFailure;

suite("Parser", function () {
  suite("call expression", function () {
    testParse("a(b,c)", expr,
      { type: "CallExpression",
        callee: { type: "IdentifierExpression", name: "a" },
        arguments:
          [ { type: "IdentifierExpression", name: "b" },
            { type: "IdentifierExpression", name: "c" } ] }
    );

    testParse("foo(bar, baz)", expr,
      { type: "CallExpression",
        callee: { type: "IdentifierExpression", name: "foo" },
        arguments:
          [ { type: "IdentifierExpression", name: "bar" },
            { type: "IdentifierExpression", name: "baz" } ] }
    );

    testParse("(    foo  )()", expr,
      { type: "CallExpression",
        callee: { type: "IdentifierExpression", name: "foo" },
        arguments: [] }
    );


    testParse("f(...a)", expr,
      new Shift.CallExpression(
        { type: "IdentifierExpression", name: "f" },
        [
          new Shift.SpreadElement({ type: "IdentifierExpression", name: "a" }),
        ]
      )
    );
    testParse("f(...a = b)", expr,
      new Shift.CallExpression(
        { type: "IdentifierExpression", name: "f" },
        [
          new Shift.SpreadElement(
            new Shift.AssignmentExpression(
              "=",
              { type: "BindingIdentifier", name: "a" },
              { type: "IdentifierExpression", name: "b" }
            )
          ),
        ]
      )
    );
    testParse("f(...a, ...b)", expr,
      new Shift.CallExpression(
        { type: "IdentifierExpression", name: "f" },
        [
          new Shift.SpreadElement({ type: "IdentifierExpression", name: "a" }),
          new Shift.SpreadElement({ type: "IdentifierExpression", name: "b" }),
        ]
      )
    );
    testParse("f(a, ...b, c)", expr,
      new Shift.CallExpression(
        { type: "IdentifierExpression", name: "f" },
        [
          { type: "IdentifierExpression", name: "a" },
          new Shift.SpreadElement({ type: "IdentifierExpression", name: "b" }),
          { type: "IdentifierExpression", name: "c" },
        ]
      )
    );
    testParse("f(...a, b, ...c)", expr,
      new Shift.CallExpression(
        { type: "IdentifierExpression", name: "f" },
        [
          new Shift.SpreadElement({ type: "IdentifierExpression", name: "a" }),
          { type: "IdentifierExpression", name: "b" },
          new Shift.SpreadElement({ type: "IdentifierExpression", name: "c" }),
        ]
      )
    );
    testParse("f(....0)", expr,
      new Shift.CallExpression(
        { type: "IdentifierExpression", name: "f" },
        [
          new Shift.SpreadElement(new Shift.LiteralNumericExpression(0)),
        ]
      )
    );
    testParse("f(.0)", expr,
      new Shift.CallExpression(
        { type: "IdentifierExpression", name: "f" },
        [
          new Shift.LiteralNumericExpression(0),
        ]
      )
    );

    testParseFailure("f(..a)", "Unexpected token .");
    testParseFailure("f(....a)", "Unexpected token .");
    testParseFailure("f(... ... a)", "Unexpected token ...");
  });
});
