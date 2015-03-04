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

var stmt = require("../../helpers").stmt;
var testParse = require("../../assertions").testParse;
var testParseFailure = require("../../assertions").testParseFailure;

suite("Parser", function () {
  suite("object binding", function () {
    suite("variable declarator", function () {
      testParse("var {a};", stmt,
        new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
          new Shift.VariableDeclarator(
            new Shift.ObjectBinding([
              { type: "BindingPropertyIdentifier", binding: { type: "BindingIdentifier", name: "a" }, init: null },
            ]),
            null
          ),
        ]))
      );

      testParse("var {a, x: {y: a}};", stmt,
        new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
          new Shift.VariableDeclarator(
            new Shift.ObjectBinding([
              { type: "BindingPropertyIdentifier", binding: { type: "BindingIdentifier", name: "a" }, init: null },
              new Shift.BindingPropertyProperty(
                new Shift.StaticPropertyName("x"),
                new Shift.ObjectBinding([
                  new Shift.BindingPropertyProperty(
                    new Shift.StaticPropertyName("y"),
                    { type: "BindingIdentifier", name: "a" }
                  ),
                ])
              ),
            ]),
            null
          ),
        ]))
      );

      testParse("var a, {x: {y: a}};", stmt,
        new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
          new Shift.VariableDeclarator(
            { type: "BindingIdentifier", name: "a" },
            null
          ),
          new Shift.VariableDeclarator(
            new Shift.ObjectBinding([
              new Shift.BindingPropertyProperty(
                new Shift.StaticPropertyName("x"),
                new Shift.ObjectBinding([
                  new Shift.BindingPropertyProperty(
                    new Shift.StaticPropertyName("y"),
                    { type: "BindingIdentifier", name: "a" }
                  ),
                ])
              ),
            ]),
            null
          ),
        ]))
      );

      testParseFailure("let {a, x: {y: a}};", "Duplicate binding 'a'");
      testParseFailure("let a, {x: {y: a}};", "Duplicate binding 'a'");
      testParseFailure("var {a: b.c};", "Unexpected token {");
    });

    suite("catch clause", function () {
      testParse("try {} catch ({e}) {}", stmt,
        new Shift.TryCatchStatement(
          new Shift.Block([]),
          new Shift.CatchClause(
            new Shift.ObjectBinding([
              { type: "BindingPropertyIdentifier",
                binding: { type: "BindingIdentifier", name: "e" },
                init: null }
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
              { type: "BindingPropertyIdentifier",
                binding: { type: "BindingIdentifier", name: "e" },
                init: new Shift.LiteralNumericExpression(0) }
            ]),
            new Shift.Block([])
          )
        )
      );

    });

  });
});
