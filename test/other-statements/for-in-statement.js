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
var testEsprimaEquiv = require('../assertions').testEsprimaEquiv;
var testParse = require('../assertions').testParse;

suite("Parser", function () {
  suite("for in statement", function () {
    testEsprimaEquiv("for(x in list) process(x);");
    testParse("for (var x in list) process(x);", stmt,
      new Shift.ForInStatement(
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
    testParse("for (var x = 0 in list) process(x);", stmt,
      new Shift.ForInStatement(
        new Shift.VariableDeclaration("var", [
          new Shift.VariableDeclarator(
            new Shift.BindingIdentifier(new Shift.Identifier("x")),
            new Shift.LiteralNumericExpression(0)
          )
        ]),
        new Shift.IdentifierExpression(new Shift.Identifier("list")),
        new Shift.ExpressionStatement(new Shift.CallExpression(
          new Shift.IdentifierExpression(new Shift.Identifier("process")),
          [new Shift.IdentifierExpression(new Shift.Identifier("x"))]
        ))
      )
    );
    testParse("for (let x in list) process(x);", stmt,
      new Shift.ForInStatement(
        new Shift.VariableDeclaration("let", [
          new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("x")), null)
        ]),
        new Shift.IdentifierExpression(new Shift.Identifier("list")),
        new Shift.ExpressionStatement(new Shift.CallExpression(
          new Shift.IdentifierExpression(new Shift.Identifier("process")),
          [new Shift.IdentifierExpression(new Shift.Identifier("x"))]
        ))
      )
    );
    testParse("for (var x = y = z in q);", stmt,
      new Shift.ForInStatement(
        new Shift.VariableDeclaration("var", [
          new Shift.VariableDeclarator(
            new Shift.BindingIdentifier(new Shift.Identifier("x")),
            new Shift.AssignmentExpression(
              "=",
              new Shift.BindingIdentifier(new Shift.Identifier("y")),
              new Shift.IdentifierExpression(new Shift.Identifier("z"))
            )
          )
        ]),
        new Shift.IdentifierExpression(new Shift.Identifier("q")),
        new Shift.EmptyStatement
      )
    );
    testParse("for (var a = b = c = (d in e) in z);", stmt,
      new Shift.ForInStatement(
        new Shift.VariableDeclaration("var", [
          new Shift.VariableDeclarator(
            new Shift.BindingIdentifier(new Shift.Identifier("a")),
            new Shift.AssignmentExpression(
              "=",
              new Shift.BindingIdentifier(new Shift.Identifier("b")),
              new Shift.AssignmentExpression(
                "=",
                new Shift.BindingIdentifier(new Shift.Identifier("c")),
                new Shift.BinaryExpression(
                  "in",
                  new Shift.IdentifierExpression(new Shift.Identifier("d")),
                  new Shift.IdentifierExpression(new Shift.Identifier("e"))
                )
              )
            )
          )
        ]),
        new Shift.IdentifierExpression(new Shift.Identifier("z")),
        new Shift.EmptyStatement
      )
    );
    testParse("for (var i = function() { return 10 in [] } in list) process(x);", stmt,
      new Shift.ForInStatement(
        new Shift.VariableDeclaration("var", [
          new Shift.VariableDeclarator(
            new Shift.BindingIdentifier(new Shift.Identifier("i")),
            new Shift.FunctionExpression(false, null, [], null, new Shift.FunctionBody([], [
              new Shift.ReturnStatement(new Shift.BinaryExpression("in", new Shift.LiteralNumericExpression(10), new Shift.ArrayExpression([])))
            ]))
          )
        ]),
        new Shift.IdentifierExpression(new Shift.Identifier("list")),
        new Shift.ExpressionStatement(new Shift.CallExpression(
          new Shift.IdentifierExpression(new Shift.Identifier("process")), [new Shift.IdentifierExpression(new Shift.Identifier("x"))]
        ))
      )
    );
    testParse("for(var a in b);", stmt,
      new Shift.ForInStatement(
        new Shift.VariableDeclaration("var", [
          new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("a")), null)
        ]),
        new Shift.IdentifierExpression(new Shift.Identifier("b")),
        new Shift.EmptyStatement
      )
    );
    testParse("for(var a = c in b);", stmt,
      new Shift.ForInStatement(
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
    testEsprimaEquiv("for(a in b);");
    testEsprimaEquiv("for(a.b in b);");
  });
});
