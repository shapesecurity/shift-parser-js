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
  suite("array binding", function () {
    suite("assignment", function () {
      testParse("[x] = 0", expr,
        new Shift.AssignmentExpression(
          "=",
          new Shift.ArrayBinding(
            [new Shift.BindingIdentifier(new Shift.Identifier("x"))],
            null
          ),
          new Shift.LiteralNumericExpression(0)
        )
      );

      testParse("[x,] = 0", expr,
        new Shift.AssignmentExpression(
          "=",
          new Shift.ArrayBinding(
            [new Shift.BindingIdentifier(new Shift.Identifier("x"))],
            null
          ),
          new Shift.LiteralNumericExpression(0)
        )
      );

      testParse("[x,,] = 0", expr,
        new Shift.AssignmentExpression(
          "=",
          new Shift.ArrayBinding(
            [new Shift.BindingIdentifier(new Shift.Identifier("x")), null],
            null
          ),
          new Shift.LiteralNumericExpression(0)
        )
      );

      testParse("[[x]] = 0", expr,
        new Shift.AssignmentExpression(
          "=",
          new Shift.ArrayBinding(
            [
              new Shift.ArrayBinding(
                [new Shift.BindingIdentifier(new Shift.Identifier("x"))],
                null
              ),
            ],
            null
          ),
          new Shift.LiteralNumericExpression(0)
        )
      );

      testParse("[x, y, ...z] = 0", expr,
        new Shift.AssignmentExpression(
          "=",
          new Shift.ArrayBinding(
            [
              new Shift.BindingIdentifier(new Shift.Identifier("x")),
              new Shift.BindingIdentifier(new Shift.Identifier("y")),
            ],
            new Shift.BindingIdentifier(new Shift.Identifier("z"))
          ),
          new Shift.LiteralNumericExpression(0)
        )
      );

      // TODO(bzhang): should fail
      testParse("[, x, ...y,] = 0", expr,
        new Shift.AssignmentExpression(
          "=",
          new Shift.ArrayBinding(
            [
              null,
              new Shift.BindingIdentifier(new Shift.Identifier("x")),
            ],
            new Shift.BindingIdentifier(new Shift.Identifier("y"))
          ),
          new Shift.LiteralNumericExpression(0)
        )
      );

      testParse("[, x,,] = 0", expr,
        new Shift.AssignmentExpression(
          "=",
          new Shift.ArrayBinding(
            [
              null,
              new Shift.BindingIdentifier(new Shift.Identifier("x")),
              null,
            ],
            null
          ),
          new Shift.LiteralNumericExpression(0)
        )
      );

      testParse("[...[x]] = 0", expr,
        new Shift.AssignmentExpression(
          "=",
          new Shift.ArrayBinding([], new Shift.ArrayBinding([
            new Shift.BindingIdentifier(new Shift.Identifier("x")),
          ], null)),
          new Shift.LiteralNumericExpression(0)
        )
      );

      testParse("[x, ...{0: y}] = 0", expr,
        new Shift.AssignmentExpression(
          "=",
          new Shift.ArrayBinding(
            [
              new Shift.BindingIdentifier(new Shift.Identifier("x")),
            ],
            new Shift.ObjectBinding([
              new Shift.BindingPropertyProperty(
                new Shift.StaticPropertyName("0"),
                new Shift.BindingIdentifier(new Shift.Identifier("y"))
              ),
            ])
          ),
          new Shift.LiteralNumericExpression(0)
        )
      );

      testParse("[x, x] = 0", expr,
        new Shift.AssignmentExpression(
          "=",
          new Shift.ArrayBinding(
            [
              new Shift.BindingIdentifier(new Shift.Identifier("x")),
              new Shift.BindingIdentifier(new Shift.Identifier("x")),
            ],
            null
          ),
          new Shift.LiteralNumericExpression(0)
        )
      );

      testParse("[x, ...x] = 0", expr,
        new Shift.AssignmentExpression(
          "=",
          new Shift.ArrayBinding(
            [
              new Shift.BindingIdentifier(new Shift.Identifier("x")),
            ],
            new Shift.BindingIdentifier(new Shift.Identifier("x"))
          ),
          new Shift.LiteralNumericExpression(0)
        )
      );

      testParseFailure("[] = 0", "Invalid left-hand side in assignment");
      testParseFailure("[...x, ...y] = 0", "Invalid left-hand side in assignment"); // TODO(bzhang): Unexpected token ,
      testParseFailure("[...x, y] = 0", "Invalid left-hand side in assignment");
      testParseFailure("[...x,,] = 0", "Invalid left-hand side in assignment");
    });
  });
});
