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

var stmt = require("../helpers").stmt;
var testParse = require('../assertions').testParse;

suite("Parser", function () {
  suite("for in statement", function () {
    testParse("for (var x of list) process(x);", stmt,
      new Shift.ForOfStatement(
        new Shift.VariableDeclaration("var", [
          new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("x")), null)
        ]),
        new Shift.IdentifierExpression(new Shift.Identifier("list")),
        new Shift.ExpressionStatement(new Shift.CallExpression(
          new Shift.IdentifierExpression(new Shift.Identifier("process")),
          [new Shift.IdentifierExpression(new Shift.Identifier("x"))]
        ))
      )
    );

    testParse("for(var a of b);", stmt,
      new Shift.ForOfStatement(
        new Shift.VariableDeclaration("var", [
          new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("a")), null)
        ]),
        new Shift.IdentifierExpression(new Shift.Identifier("b")),
        new Shift.EmptyStatement
      )
    );
    testParse("for(var a = c of b);", stmt,
      new Shift.ForOfStatement(
        new Shift.VariableDeclaration("var", [
          new Shift.VariableDeclarator(
            new Shift.BindingIdentifier(new Shift.Identifier("a")),
            new Shift.IdentifierExpression(new Shift.Identifier("c"))
          )
        ]),
        new Shift.IdentifierExpression(new Shift.Identifier("b")),
        new Shift.EmptyStatement
      )
    );
  });
});
