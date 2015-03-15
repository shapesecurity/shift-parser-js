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
  suite("array binding", function () {
    suite("variable declarator", function () {
      testParse("var [,a] = 0;", stmt,
        new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
          new Shift.VariableDeclarator(
            new Shift.ArrayBinding([null, { type: "BindingIdentifier", name: "a" }], null),
            { type: "LiteralNumericExpression", value: 0 }
          ),
        ]))
      );

      testParse("var [a]=[1];", stmt,
        new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
          new Shift.VariableDeclarator(
            new Shift.ArrayBinding([{ type: "BindingIdentifier", name: "a" }], null),
            new Shift.ArrayExpression([new Shift.LiteralNumericExpression(1)], null)
          ),
        ]))
      );

      testParse("var [[a]]=0;", stmt,
        new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
          new Shift.VariableDeclarator(
            new Shift.ArrayBinding([
              new Shift.ArrayBinding([{ type: "BindingIdentifier", name: "a" }], null)
            ], null),
            new Shift.LiteralNumericExpression(0)
          ),
        ]))
      );

      testParse("var a, [a] = 0;", stmt,
        new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
          new Shift.VariableDeclarator(
            { type: "BindingIdentifier", name: "a" },
            null
          ),
          new Shift.VariableDeclarator(
            new Shift.ArrayBinding([
              { type: "BindingIdentifier", name: "a" },
            ], null),
            { type: "LiteralNumericExpression", value: 0 }
          ),
        ]))
      );

      testParse("var [a, a] = 0;", stmt,
        new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
          new Shift.VariableDeclarator(
            new Shift.ArrayBinding([
              { type: "BindingIdentifier", name: "a" },
              { type: "BindingIdentifier", name: "a" },
            ], null),
            { type: "LiteralNumericExpression", value: 0 }
          ),
        ]))
      );

      testParse("var [a, ...a] = 0;", stmt,
        new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
          new Shift.VariableDeclarator(
            new Shift.ArrayBinding(
              [
                { type: "BindingIdentifier", name: "a" },
              ],
              { type: "BindingIdentifier", name: "a" }
            ),
            { type: "LiteralNumericExpression", value: 0 }
          ),
        ]))
      );

      testParseFailure("var [a.b] = 0", "Unexpected token .");
      testParseFailure("var ([x]) = 0", "Unexpected token (");
    });

    suite("formal parameter", function () {
      // passing cases are tested in other function test cases.
      testParseFailure("([a.b]) => 0", "Illegal arrow function parameter list");
      testParseFailure("function a([a.b]) {}", "Unexpected token .");
      testParseFailure("function* a([a.b]) {}", "Unexpected token .");
      testParseFailure("(function ([a.b]) {})", "Unexpected token .");
      testParseFailure("(function* ([a.b]) {})", "Unexpected token .");
      testParseFailure("({a([a.b]){}})", "Unexpected token .");
      testParseFailure("({*a([a.b]){}})", "Unexpected token .");
      testParseFailure("({set a([a.b]){}})", "Unexpected token .");
    });

    suite("catch clause", function () {
      testParse("try {} catch ([e]) {}", stmt,
        new Shift.TryCatchStatement(
          new Shift.Block([]),
          new Shift.CatchClause(
            new Shift.ArrayBinding([{ type: "BindingIdentifier", name: "e" }], null),
            new Shift.Block([])
          )
        )
      );

      testParse("try {} catch ([e, ...a]) {}", stmt,
        new Shift.TryCatchStatement(
          new Shift.Block([]),
          new Shift.CatchClause(
            new Shift.ArrayBinding([{ type: "BindingIdentifier", name: "e" }],
              { type: "BindingIdentifier", name: "a" }),
            new Shift.Block([])
          )
        )
      );

    });

  });
});
