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
var stmt = require("../../helpers").stmt;
var testParse = require('../../assertions').testParse;
var testParseFailure = require('../../assertions').testParseFailure;

suite("Parser", function () {
  suite("array binding", function () {
    suite("variable declarator", function () {
      testParse("var [,a];", stmt,
        new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
          new Shift.VariableDeclarator(
            new Shift.ArrayBinding([null, new Shift.BindingIdentifier(new Shift.Identifier("a"))], null),
            null
          ),
        ]))
      );

      testParse("var [a]=[1];", stmt,
        new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
          new Shift.VariableDeclarator(
            new Shift.ArrayBinding([new Shift.BindingIdentifier(new Shift.Identifier("a"))], null),
            new Shift.ArrayExpression([new Shift.LiteralNumericExpression(1)], null)
          ),
        ]))
      );

      testParse("var [[a]]=0;", stmt,
        new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
          new Shift.VariableDeclarator(
            new Shift.ArrayBinding([
              new Shift.ArrayBinding([new Shift.BindingIdentifier(new Shift.Identifier("a"))], null)
            ], null),
            new Shift.LiteralNumericExpression(0)
          ),
        ]))
      );

      testParseFailure("var [a.b]", "Unexpected token [");
      testParseFailure("var ([x])", "Unexpected token (");
      testParseFailure("var [a, a]", "Duplicate binding \'a\'");
      testParseFailure("var [a, a] = 0;", "Duplicate binding \'a\'");
    });

    suite("catch clause", function () {
      testParse("try {} catch ([e]) {}", stmt,
        new Shift.TryCatchStatement(
          new Shift.Block([]),
          new Shift.CatchClause(
            new Shift.ArrayBinding([new Shift.BindingIdentifier(new Shift.Identifier("e"))], null),
            new Shift.Block([])
          )
        )
      );

      testParse("try {} catch ([e, ...a]) {}", stmt,
        new Shift.TryCatchStatement(
          new Shift.Block([]),
          new Shift.CatchClause(
            new Shift.ArrayBinding([new Shift.BindingIdentifier(new Shift.Identifier("e"))],
              new Shift.BindingIdentifier(new Shift.Identifier("a"))),
            new Shift.Block([])
          )
        )
      );

      testParseFailure("try {} catch ([e,e]) {}", "Duplicate binding \'e\'");
    });

  });
});
