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
var testParse = require('../assertions').testParse;
var testParseFailure = require('../assertions').testParseFailure;
var testEsprimaEquiv = require('../assertions').testEsprimaEquiv;

suite("Parser", function () {
  suite("call expression", function () {
    testEsprimaEquiv("a(b,c)");
    testEsprimaEquiv("foo(bar, baz)");
    testEsprimaEquiv("(    foo  )()");

    testParse("f(...a)", expr,
      new Shift.CallExpression(
        new Shift.IdentifierExpression(new Shift.Identifier("f")),
        [
          new Shift.SpreadElement(new Shift.IdentifierExpression(new Shift.Identifier("a"))),
        ]
      )
    );
    testParse("f(...a = b)", expr,
      new Shift.CallExpression(
        new Shift.IdentifierExpression(new Shift.Identifier("f")),
        [
          new Shift.SpreadElement(
            new Shift.AssignmentExpression(
              "=",
              new Shift.BindingIdentifier(new Shift.Identifier("a")),
              new Shift.IdentifierExpression(new Shift.Identifier("b"))
            )
          ),
        ]
      )
    );
    testParse("f(...a, ...b)", expr,
      new Shift.CallExpression(
        new Shift.IdentifierExpression(new Shift.Identifier("f")),
        [
          new Shift.SpreadElement(new Shift.IdentifierExpression(new Shift.Identifier("a"))),
          new Shift.SpreadElement(new Shift.IdentifierExpression(new Shift.Identifier("b"))),
        ]
      )
    );
    testParse("f(a, ...b, c)", expr,
      new Shift.CallExpression(
        new Shift.IdentifierExpression(new Shift.Identifier("f")),
        [
          new Shift.IdentifierExpression(new Shift.Identifier("a")),
          new Shift.SpreadElement(new Shift.IdentifierExpression(new Shift.Identifier("b"))),
          new Shift.IdentifierExpression(new Shift.Identifier("c")),
        ]
      )
    );
    testParse("f(...a, b, ...c)", expr,
      new Shift.CallExpression(
        new Shift.IdentifierExpression(new Shift.Identifier("f")),
        [
          new Shift.SpreadElement(new Shift.IdentifierExpression(new Shift.Identifier("a"))),
          new Shift.IdentifierExpression(new Shift.Identifier("b")),
          new Shift.SpreadElement(new Shift.IdentifierExpression(new Shift.Identifier("c"))),
        ]
      )
    );
    testParse("f(....0)", expr,
      new Shift.CallExpression(
        new Shift.IdentifierExpression(new Shift.Identifier("f")),
        [
          new Shift.SpreadElement(new Shift.LiteralNumericExpression(0)),
        ]
      )
    );
    testParse("f(.0)", expr,
      new Shift.CallExpression(
        new Shift.IdentifierExpression(new Shift.Identifier("f")),
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
