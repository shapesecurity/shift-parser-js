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
  suite("if statement", function () {
    testEsprimaEquiv("if (morning) goodMorning()");
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
    testParse("if (morning) function a(){}", stmt,
      new Shift.IfStatement(
        new Shift.IdentifierExpression(new Shift.Identifier("morning")),
        new Shift.FunctionDeclaration(false, new Shift.Identifier("a"), [], null, new Shift.FunctionBody([], [])),
        null
      )
    );
    testEsprimaEquiv("if (morning) goodMorning(); else goodDay()");
    testEsprimaEquiv("if(a)b;");
    testEsprimaEquiv("if(a)b;else c;");
  });
});
