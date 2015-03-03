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

var testParse = require("../assertions").testParse;
var stmt = require("../helpers").stmt;

suite("Parser", function () {
  suite("if statement", function () {

    testParse("if (morning) goodMorning()", stmt,
      { type: "IfStatement",
        test: { type: "IdentifierExpression", identifier: { type: "Identifier", name: "morning" } },
        consequent:
          { type: "ExpressionStatement",
            expression:
              { type: "CallExpression",
                callee: { type: "IdentifierExpression", identifier: { type: "Identifier", name: "goodMorning" } },
                arguments: [] } },
        alternate: null }
    );

    testParse("if (morning) (function(){})", stmt,
      new Shift.IfStatement(
        new Shift.IdentifierExpression(new Shift.Identifier("morning")),
        new Shift.ExpressionStatement(new Shift.FunctionExpression(false, null, [], null, new Shift.FunctionBody([], []))),
        null
      )
    );

    testParse("if (morning) var x = 0;", stmt,
      new Shift.IfStatement(
        new Shift.IdentifierExpression(new Shift.Identifier("morning")),
        new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
          new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("x")), new Shift.LiteralNumericExpression(0))
        ])),
        null
      )
    );

    testParse("if (morning) goodMorning(); else goodDay()", stmt,
      { type: "IfStatement",
        test: { type: "IdentifierExpression", identifier: { type: "Identifier", name: "morning" } },
        consequent:
          { type: "ExpressionStatement",
            expression:
              { type: "CallExpression",
                callee: { type: "IdentifierExpression", identifier: { type: "Identifier", name: "goodMorning" } },
                arguments: [] } },
        alternate:
          { type: "ExpressionStatement",
            expression:
              { type: "CallExpression",
                callee: { type: "IdentifierExpression", identifier: { type: "Identifier", name: "goodDay" } },
                arguments: [] } } }
    );

    testParse("if(a)b;", stmt,
      { type: "IfStatement",
        test: { type: "IdentifierExpression", identifier: { type: "Identifier", name: "a" } },
        consequent:
          { type: "ExpressionStatement",
            expression: { type: "IdentifierExpression", identifier: { type: "Identifier", name: "b" } } },
        alternate: null }
    );

    testParse("if(a)b;else c;", stmt,
      { type: "IfStatement",
        test: { type: "IdentifierExpression", identifier: { type: "Identifier", name: "a" } },
        consequent:
          { type: "ExpressionStatement",
            expression: { type: "IdentifierExpression", identifier: { type: "Identifier", name: "b" } } },
        alternate:
          { type: "ExpressionStatement",
            expression: { type: "IdentifierExpression", identifier: { type: "Identifier", name: "c" } } } }
    );

  });
});
