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
var stmt = require("../helpers").stmt;
var testParse = require('../assertions').testParse;
var testParseFailure = require('../assertions').testParseFailure;

suite("Parser", function () {
  suite("object binding", function () {

    suite("assignment", function () {

      testParse("({x} = 0)", expr,
        new Shift.AssignmentExpression(
          "=",
          new Shift.ObjectBinding([
            new Shift.BindingPropertyIdentifier(
              new Shift.BindingIdentifier(new Shift.Identifier("x")),
              null
            ),
          ]),
          new Shift.LiteralNumericExpression(0)
        )
      );

      testParse("({x = 0} = 1)", expr,
        new Shift.AssignmentExpression(
          "=",
          new Shift.ObjectBinding([
            new Shift.BindingPropertyIdentifier(
              new Shift.BindingIdentifier(new Shift.Identifier("x")),
              new Shift.LiteralNumericExpression(0)
            ),
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
              new Shift.BindingIdentifier(new Shift.Identifier("y"))
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
              new Shift.BindingIdentifier(new Shift.Identifier("x"))
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
              new Shift.BindingIdentifier(new Shift.Identifier("y"))
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
              new Shift.BindingIdentifier(new Shift.Identifier("y"))
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
              new Shift.BindingIdentifier(new Shift.Identifier("y"))
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
                new Shift.BindingIdentifier(new Shift.Identifier("y")),
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
                new Shift.BindingIdentifier(new Shift.Identifier("y")),
                new Shift.AssignmentExpression(
                  "=",
                  new Shift.BindingIdentifier(new Shift.Identifier("z")),
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
                  [new Shift.BindingIdentifier(new Shift.Identifier("y"))],
                  null
                ),
                new Shift.LiteralNumericExpression(0)
              )
            ),
          ]),
          new Shift.LiteralNumericExpression(1)
        )
      );

      testParseFailure("({a = 0})", "Unexpected token )");
      testParseFailure("({'a'} = 0)", "Unexpected token }");
      testParseFailure("({var} = 0)", "Unexpected token var");
      testParseFailure("({a.b} = 0)", "Unexpected token .");
      testParseFailure("({a: b.c} = 0)", "Invalid left-hand side in assignment");
      testParseFailure("({0} = 0)", "Unexpected token }");
      testParseFailure("({get a(){}} = 0)", "Invalid left-hand side in assignment");
      testParseFailure("({set a(b){}} = 0)", "Invalid left-hand side in assignment");
      testParseFailure("({a(b){}} = 0)", "Invalid left-hand side in assignment");

    });

    suite("variable declarator", function () {

      testParse("var {a};", stmt,
        new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
          new Shift.VariableDeclarator(
            new Shift.ObjectBinding([
              new Shift.BindingPropertyIdentifier(new Shift.BindingIdentifier(new Shift.Identifier("a")), null)
            ]),
            null
          ),
        ]))
      );

      testParseFailure("var {a,x:{y:a}} = 0;", "Duplicate binding \'a\'");
      testParseFailure("var {a: b.c};", "Unexpected token {");

    });

    suite("catch clause", function () {

      testParse("try {} catch ({e}) {}", stmt,
        new Shift.TryCatchStatement(
          new Shift.Block([]),
          new Shift.CatchClause(
            new Shift.ObjectBinding([
              new Shift.BindingPropertyIdentifier(
                new Shift.BindingIdentifier(new Shift.Identifier("e")),
                null
              ),
            ]),
            new Shift.Block([])
          )
        )
      );

      testParse("try {} catch ({e = 0}) {}", stmt,
        new Shift.TryCatchStatement(
          new Shift.Block([]),
          new Shift.CatchClause(
            new Shift.ObjectBinding([
              new Shift.BindingPropertyIdentifier(
                new Shift.BindingIdentifier(new Shift.Identifier("e")),
                new Shift.LiteralNumericExpression(0)
              ),
            ]),
            new Shift.Block([])
          )
        )
      );

      testParseFailure("try {} catch ({e, e}) {}", "Duplicate binding \'e\'");
      testParseFailure("try {} catch ({a: e, b: e}) {}", "Duplicate binding \'e\'");
      testParseFailure("try {} catch ({e = 0, a: e}) {}", "Duplicate binding \'e\'");

    });

  });
});
