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
var expr = require("../../helpers").expr;
var testParse = require("../../assertions").testParse;
var testParseFailure = require("../../assertions").testParseFailure;

suite("Parser", function () {
  suite("object binding", function () {
    suite("variable declarator", function () {
      testParse("var {a} = 0;", stmt,
        new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
          new Shift.VariableDeclarator(
            new Shift.ObjectBinding([
              { type: "BindingPropertyIdentifier", binding: { type: "BindingIdentifier", name: "a" }, init: null },
            ]),
            { type: "LiteralNumericExpression", value: 0 }
          ),
        ]))
      );

      testParse("var [{a = 0}] = 0;", stmt,
        new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
          new Shift.VariableDeclarator(
            new Shift.ArrayBinding([
              new Shift.ObjectBinding([
                { type: "BindingPropertyIdentifier", binding: { type: "BindingIdentifier", name: "a" }, init: new Shift.LiteralNumericExpression(0) },
              ]),
            ], null)
          , { type: "LiteralNumericExpression", value: 0 }),
        ]))
      );

      testParse("var [{__proto__:a, __proto__:b}] = 0;", stmt,
        new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
          new Shift.VariableDeclarator(
            new Shift.ArrayBinding([
              new Shift.ObjectBinding([
                {
                  type: "BindingPropertyProperty",
                  name: { type: "StaticPropertyName", value: "__proto__" },
                  binding: { type: "BindingIdentifier", name: "a" },
                }, {
                  type: "BindingPropertyProperty",
                  name: { type: "StaticPropertyName", value: "__proto__" },
                  binding: { type: "BindingIdentifier", name: "b" },
                }
              ]),
            ], null)
            , { type: "LiteralNumericExpression", value: 0 }),
        ]))
      );

      testParse("var {a, x: {y: a}} = 0;", stmt,
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
            { type: "LiteralNumericExpression", value: 0 }
          ),
        ]))
      );

      testParse("var a, {x: {y: a}} = 0;", stmt,
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
            { type: "LiteralNumericExpression", value: 0 }
          ),
        ]))
      );

      testParseFailure("let {a, x: {y: a}} = 0;", "Duplicate binding 'a'");
      testParseFailure("let a, {x: {y: a}} = 0;", "Duplicate binding 'a'");
      testParseFailure("var {a: b.c} = 0;", "Unexpected token .");
    });

    suite("formal parameter", function () {
      testParse("(a, b, [c]) => 0", expr, {
        type: "ArrowExpression",
        params: {
          type: "FormalParameters",
          items: [
            { type: "BindingIdentifier", name: "a" },
            { type: "BindingIdentifier", name: "b" },
            { type: "ArrayBinding", elements: [{ type: "BindingIdentifier", name: "c" }], restElement: null }],
          rest: null
        },
        body: {
          type: "LiteralNumericExpression", value: 0
        }
      });

      // other passing cases are tested in other function test cases.
      testParseFailure("({e: a.b}) => 0", "Illegal arrow function parameter list");
      testParseFailure("function a({e: a.b}) {}", "Unexpected token .");
      testParseFailure("function* a({e: a.b}) {}", "Unexpected token .");
      testParseFailure("(function ({e: a.b}) {})", "Unexpected token .");
      testParseFailure("(function* ({e: a.b}) {})", "Unexpected token .");
      testParseFailure("({a({e: a.b}){}})", "Unexpected token .");
      testParseFailure("({*a({e: a.b}){}})", "Unexpected token .");
      testParseFailure("({set a({e: a.b}){}})", "Unexpected token .");
      testParseFailure("(function*({yield}){}})", "Unexpected token yield");
      testParseFailure("(function*(){(function*({a=function({yield}){}}){})})", "Unexpected token yield");

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

      testParseFailure("try {} catch ({e: x.a}) {}", "Unexpected token .");
    });

  });
});
