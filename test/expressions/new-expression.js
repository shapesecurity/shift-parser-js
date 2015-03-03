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

suite("Parser", function () {
  suite("new expression", function () {

    testParse("new a(b,c)", expr,
      { type: "NewExpression",
        callee: { type: "IdentifierExpression", identifier: { type: "Identifier", name: "a" } },
        arguments:
          [ { type: "IdentifierExpression",
            identifier: { type: "Identifier", name: "b" } },
            { type: "IdentifierExpression",
              identifier: { type: "Identifier", name: "c" } } ] }
    );

    testParse("new Button", expr,
      { type: "NewExpression",
        callee: { type: "IdentifierExpression", identifier: { type: "Identifier", name: "Button" } },
        arguments: [] }
    );

    testParse("new Button()", expr,
      { type: "NewExpression",
        callee: { type: "IdentifierExpression", identifier: { type: "Identifier", name: "Button" } },
        arguments: [] }
    );

    testParse("new Button(a)", expr,
      { type: "NewExpression",
        callee: { type: "IdentifierExpression", identifier: { type: "Identifier", name: "Button" } },
        arguments: [ { type: "IdentifierExpression", identifier: { type: "Identifier", name: "a" } } ] }
    );

    testParse("new new foo", expr,
      { type: "NewExpression",
        callee:
          { type: "NewExpression",
            callee: { type: "IdentifierExpression", identifier: { type: "Identifier", name: "foo" } },
            arguments: [] },
        arguments: [] }
    );

    testParse("new new foo()", expr,
      { type: "NewExpression",
        callee:
          { type: "NewExpression",
            callee: { type: "IdentifierExpression", identifier: { type: "Identifier", name: "foo" } },
            arguments: [] },
        arguments: [] }
    );


    testParse("new f(...a)", expr,
      new Shift.NewExpression(
        new Shift.IdentifierExpression(new Shift.Identifier("f")),
        [
          new Shift.SpreadElement(new Shift.IdentifierExpression(new Shift.Identifier("a"))),
        ]
      )
    );
    testParse("new f(...a = b)", expr,
      new Shift.NewExpression(
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
    testParse("new f(...a, ...b)", expr,
      new Shift.NewExpression(
        new Shift.IdentifierExpression(new Shift.Identifier("f")),
        [
          new Shift.SpreadElement(new Shift.IdentifierExpression(new Shift.Identifier("a"))),
          new Shift.SpreadElement(new Shift.IdentifierExpression(new Shift.Identifier("b"))),
        ]
      )
    );
    testParse("new f(a, ...b, c)", expr,
      new Shift.NewExpression(
        new Shift.IdentifierExpression(new Shift.Identifier("f")),
        [
          new Shift.IdentifierExpression(new Shift.Identifier("a")),
          new Shift.SpreadElement(new Shift.IdentifierExpression(new Shift.Identifier("b"))),
          new Shift.IdentifierExpression(new Shift.Identifier("c")),
        ]
      )
    );
    testParse("new f(...a, b, ...c)", expr,
      new Shift.NewExpression(
        new Shift.IdentifierExpression(new Shift.Identifier("f")),
        [
          new Shift.SpreadElement(new Shift.IdentifierExpression(new Shift.Identifier("a"))),
          new Shift.IdentifierExpression(new Shift.Identifier("b")),
          new Shift.SpreadElement(new Shift.IdentifierExpression(new Shift.Identifier("c"))),
        ]
      )
    );
  });
});
