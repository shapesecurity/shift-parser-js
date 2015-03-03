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
var testParse = require("../assertions").testParse;

suite("Parser", function () {
  suite("for statement", function () {

    testParse("for(x, y;;);", stmt,
      { type: "ForStatement",
        body: { type: "EmptyStatement" },
        init:
          { type: "BinaryExpression",
            operator: ",",
            left: { type: "IdentifierExpression", identifier: { type: "Identifier", name: "x" } },
            right: { type: "IdentifierExpression", identifier: { type: "Identifier", name: "y" } } },
        test: null,
        update: null }
    );

    testParse("for(x = 0;;);", stmt,
      new Shift.ForStatement(
        new Shift.AssignmentExpression(
          "=",
          new Shift.BindingIdentifier(new Shift.Identifier("x")),
          new Shift.LiteralNumericExpression(0)
        ),
        null,
        null,
        new Shift.EmptyStatement
      )
    );

    testParse("for(var x = 0;;);", stmt,
      new Shift.ForStatement(
        new Shift.VariableDeclaration("var", [
          new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("x")), new Shift.LiteralNumericExpression(0))
        ]),
        null,
        null,
        new Shift.EmptyStatement
      )
    );

    testParse("for(let x = 0;;);", stmt,
      new Shift.ForStatement(
        new Shift.VariableDeclaration("let", [
          new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("x")), new Shift.LiteralNumericExpression(0))
        ]),
        null,
        null,
        new Shift.EmptyStatement
      )
    );

    testParse("for(var x = 0, y = 1;;);", stmt,
      new Shift.ForStatement(
        new Shift.VariableDeclaration("var", [
          new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("x")), new Shift.LiteralNumericExpression(0)),
          new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("y")), new Shift.LiteralNumericExpression(1)),
        ]),
        null,
        null,
        new Shift.EmptyStatement
      )
    );

    testParse("for(x; x < 0;);", stmt,
      { type: "ForStatement",
        body: { type: "EmptyStatement" },
        init: { type: "IdentifierExpression", identifier: { type: "Identifier", name: "x" } },
        test:
          { type: "BinaryExpression",
            operator: "<",
            left: { type: "IdentifierExpression", identifier: { type: "Identifier", name: "x" } },
            right: { type: "LiteralNumericExpression", value: 0 } },
        update: null }
    );

    testParse("for(x; x < 0; x++);", stmt,
      { type: "ForStatement",
        body: { type: "EmptyStatement" },
        init: { type: "IdentifierExpression", identifier: { type: "Identifier", name: "x" } },
        test:
          { type: "BinaryExpression",
            operator: "<",
            left: { type: "IdentifierExpression", identifier: { type: "Identifier", name: "x" } },
            right: { type: "LiteralNumericExpression", value: 0 } },
        update:
          { type: "PostfixExpression",
            operand: { type: "IdentifierExpression", identifier: { type: "Identifier", name: "x" } },
            operator: "++" } }
    );

    testParse("for(x; x < 0; x++) process(x);", stmt,
      { type: "ForStatement",
        body:
          { type: "ExpressionStatement",
            expression:
              { type: "CallExpression",
                callee: { type: "IdentifierExpression", identifier: { type: "Identifier", name: "process" } },
                arguments: [ { type: "IdentifierExpression", identifier: { type: "Identifier", name: "x" } } ] } },
        init: { type: "IdentifierExpression", identifier: { type: "Identifier", name: "x" } },
        test:
          { type: "BinaryExpression",
            operator: "<",
            left: { type: "IdentifierExpression", identifier: { type: "Identifier", name: "x" } },
            right: { type: "LiteralNumericExpression", value: 0 } },
        update:
          { type: "PostfixExpression",
            operand: { type: "IdentifierExpression", identifier: { type: "Identifier", name: "x" } },
            operator: "++" } }
    );

    testParse("for(a;b;c);", stmt,
      { type: "ForStatement",
        body: { type: "EmptyStatement" },
        init: { type: "IdentifierExpression", identifier: { type: "Identifier", name: "a" } },
        test: { type: "IdentifierExpression", identifier: { type: "Identifier", name: "b" } },
        update: { type: "IdentifierExpression", identifier: { type: "Identifier", name: "c" } } }
    );

    testParse("for(var a;b;c);", stmt,
      new Shift.ForStatement(
        new Shift.VariableDeclaration("var", [
          new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("a")), null)
        ]),
        new Shift.IdentifierExpression(new Shift.Identifier("b")),
        new Shift.IdentifierExpression(new Shift.Identifier("c")),
        new Shift.EmptyStatement
      )
    );

    testParse("for(var a = 0;b;c);", stmt,
      new Shift.ForStatement(
        new Shift.VariableDeclaration("var", [
          new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("a")), new Shift.LiteralNumericExpression(0))
        ]),
        new Shift.IdentifierExpression(new Shift.Identifier("b")),
        new Shift.IdentifierExpression(new Shift.Identifier("c")),
        new Shift.EmptyStatement
      )
    );

    testParse("for(var a = 0;;) { let a; }", stmt,
      new Shift.ForStatement(
        new Shift.VariableDeclaration("var", [
          new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("a")), new Shift.LiteralNumericExpression(0))
        ]),
        null,
        null,
        new Shift.BlockStatement(new Shift.Block([
          new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("let",
          [
            new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("a")), null)
          ]))
        ]))
      )
    );

    testParse("for(;b;c);", stmt,
      { type: "ForStatement",
        body: { type: "EmptyStatement" },
        init: null,
        test: { type: "IdentifierExpression", identifier: { type: "Identifier", name: "b" } },
        update: { type: "IdentifierExpression", identifier: { type: "Identifier", name: "c" } } }
    );

  });
});
