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

var expr = require("../../helpers").expr;
var testParse = require("../../assertions").testParse;
var testParseFailure = require("../../assertions").testParseFailure;

suite("Parser", function () {
  suite("object binding", function () {
    suite("assignment", function () {
      testParse("({x} = 0)", expr,
        new Shift.AssignmentExpression(
          "=",
          new Shift.ObjectBinding([
            { type: "BindingPropertyIdentifier",
              binding: { type: "BindingIdentifier", name: "x" },
              init: null }
          ]),
          new Shift.LiteralNumericExpression(0)
        )
      );

      testParse("({x,} = 0)", expr,
        new Shift.AssignmentExpression(
          "=",
          new Shift.ObjectBinding([
            { type: "BindingPropertyIdentifier",
              binding: { type: "BindingIdentifier", name: "x" },
              init: null }
          ]),
          new Shift.LiteralNumericExpression(0)
        )
      );

      testParse("({x,y} = 0)", expr,
        new Shift.AssignmentExpression(
          "=",
          new Shift.ObjectBinding([
            { type: "BindingPropertyIdentifier",
              binding: { type: "BindingIdentifier", name: "x" },
              init: null },
            { type: "BindingPropertyIdentifier",
              binding: { type: "BindingIdentifier", name: "y" },
              init: null },
          ]),
          new Shift.LiteralNumericExpression(0)
        )
      );

      testParse("({x,y,} = 0)", expr,
        new Shift.AssignmentExpression(
          "=",
          new Shift.ObjectBinding([
            { type: "BindingPropertyIdentifier",
              binding: { type: "BindingIdentifier", name: "x" },
              init: null },
            { type: "BindingPropertyIdentifier",
              binding: { type: "BindingIdentifier", name: "y" },
              init: null },
          ]),
          new Shift.LiteralNumericExpression(0)
        )
      );

      testParse("({[a]: a} = 1)", expr,
        new Shift.AssignmentExpression(
          "=",
          new Shift.ObjectBinding([
            new Shift.BindingPropertyProperty(
              new Shift.ComputedPropertyName({ type: "IdentifierExpression", name: "a" }),
              { type: "BindingIdentifier", name: "a" }
            ),
          ]),
          new Shift.LiteralNumericExpression(1)
        )
      );

      testParse("({x = 0} = 1)", expr,
        new Shift.AssignmentExpression(
          "=",
          new Shift.ObjectBinding([
            { type: "BindingPropertyIdentifier",
              binding: { type: "BindingIdentifier", name: "x" },
              init: new Shift.LiteralNumericExpression(0) }
          ]),
          new Shift.LiteralNumericExpression(1)
        )
      );

      testParse("({x = 0,} = 1)", expr,
        new Shift.AssignmentExpression(
          "=",
          new Shift.ObjectBinding([
            { type: "BindingPropertyIdentifier",
              binding: { type: "BindingIdentifier", name: "x" },
              init: new Shift.LiteralNumericExpression(0) }
          ]),
          new Shift.LiteralNumericExpression(1)
        )
      );


      testParse("({x: y} = 0)", expr,
        new Shift.AssignmentExpression(
          "=",
          new Shift.ObjectBinding([
            new Shift.BindingPropertyProperty(
              new Shift.StaticPropertyName("x"),
              { type: "BindingIdentifier", name: "y" }
            ),
          ]),
          new Shift.LiteralNumericExpression(0)
        )
      );

      testParse("({x: y,} = 0)", expr,
        new Shift.AssignmentExpression(
          "=",
          new Shift.ObjectBinding([
            new Shift.BindingPropertyProperty(
              new Shift.StaticPropertyName("x"),
              { type: "BindingIdentifier", name: "y" }
            ),
          ]),
          new Shift.LiteralNumericExpression(0)
        )
      );

      testParse("({var: x} = 0)", expr,
        new Shift.AssignmentExpression(
          "=",
          new Shift.ObjectBinding([
            new Shift.BindingPropertyProperty(
              new Shift.StaticPropertyName("var"),
              { type: "BindingIdentifier", name: "x" }
            ),
          ]),
          new Shift.LiteralNumericExpression(0)
        )
      );

      testParse("({\"x\": y} = 0)", expr,
        new Shift.AssignmentExpression(
          "=",
          new Shift.ObjectBinding([
            new Shift.BindingPropertyProperty(
              new Shift.StaticPropertyName("x"),
              { type: "BindingIdentifier", name: "y" }
            ),
          ]),
          new Shift.LiteralNumericExpression(0)
        )
      );

      testParse("({'x': y} = 0)", expr,
        new Shift.AssignmentExpression(
          "=",
          new Shift.ObjectBinding([
            new Shift.BindingPropertyProperty(
              new Shift.StaticPropertyName("x"),
              { type: "BindingIdentifier", name: "y" }
            ),
          ]),
          new Shift.LiteralNumericExpression(0)
        )
      );

      testParse("({0: y} = 0)", expr,
        new Shift.AssignmentExpression(
          "=",
          new Shift.ObjectBinding([
            new Shift.BindingPropertyProperty(
              new Shift.StaticPropertyName("0"),
              { type: "BindingIdentifier", name: "y" }
            ),
          ]),
          new Shift.LiteralNumericExpression(0)
        )
      );

      testParse("({0: x, 1: x} = 0)", expr,
        new Shift.AssignmentExpression(
          "=",
          new Shift.ObjectBinding([
            new Shift.BindingPropertyProperty(
              new Shift.StaticPropertyName("0"),
              { type: "BindingIdentifier", name: "x" }
            ),
            new Shift.BindingPropertyProperty(
              new Shift.StaticPropertyName("1"),
              { type: "BindingIdentifier", name: "x" }
            ),
          ]),
          new Shift.LiteralNumericExpression(0)
        )
      );

      testParse("({x: y = 0} = 1)", expr,
        new Shift.AssignmentExpression(
          "=",
          new Shift.ObjectBinding([
            new Shift.BindingPropertyProperty(
              new Shift.StaticPropertyName("x"),
              new Shift.BindingWithDefault(
                { type: "BindingIdentifier", name: "y" },
                new Shift.LiteralNumericExpression(0)
              )
            ),
          ]),
          new Shift.LiteralNumericExpression(1)
        )
      );

      testParse("({x: y = z = 0} = 1)", expr,
        new Shift.AssignmentExpression(
          "=",
          new Shift.ObjectBinding([
            new Shift.BindingPropertyProperty(
              new Shift.StaticPropertyName("x"),
              new Shift.BindingWithDefault(
                { type: "BindingIdentifier", name: "y" },
                new Shift.AssignmentExpression(
                  "=",
                  { type: "BindingIdentifier", name: "z" },
                  new Shift.LiteralNumericExpression(0)
                )
              )
            ),
          ]),
          new Shift.LiteralNumericExpression(1)
        )
      );

      testParse("({x: [y] = 0} = 1)", expr,
        new Shift.AssignmentExpression(
          "=",
          new Shift.ObjectBinding([
            new Shift.BindingPropertyProperty(
              new Shift.StaticPropertyName("x"),
              new Shift.BindingWithDefault(
                new Shift.ArrayBinding(
                  [{ type: "BindingIdentifier", name: "y" }],
                  null
                ),
                new Shift.LiteralNumericExpression(0)
              )
            ),
          ]),
          new Shift.LiteralNumericExpression(1)
        )
      );

      testParseFailure("({a = 0});", "Unexpected token ;");
      testParseFailure("({a,,} = 0)", "Unexpected token ,");
      testParseFailure("({,a,} = 0)", "Unexpected token ,");
      testParseFailure("({a,,a} = 0)", "Unexpected token ,");
      testParseFailure("({function} = 0)", "Unexpected token function");
      testParseFailure("({a:function} = 0)", "Unexpected token }");
      testParseFailure("({a:for} = 0)", "Unexpected token for");
      testParseFailure("({'a'} = 0)", "Unexpected token }");
      testParseFailure("({var} = 0)", "Unexpected token var");
      testParseFailure("({a.b} = 0)", "Unexpected token .");
      testParseFailure("({0} = 0)", "Unexpected token }");
    });
  });
});
