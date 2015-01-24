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

var expect = require("expect.js");

var parse = require("../..").default;
var Shift = require("shift-ast");

var stmt = require("../helpers").stmt;
var assertEsprimaEquiv = require('../assertions').assertEsprimaEquiv;

describe("Parser", function () {
  describe("if statement", function () {
    assertEsprimaEquiv("if (morning) goodMorning()");
    expect(stmt(parse("if (morning) (function(){})"))).to.be.eql(
      new Shift.IfStatement(
        new Shift.IdentifierExpression(new Shift.Identifier("morning")),
        new Shift.ExpressionStatement(new Shift.FunctionExpression(false, null, [], null, new Shift.FunctionBody([], []))),
        null
      )
    );
    expect(stmt(parse("if (morning) var x = 0;"))).to.be.eql(
      new Shift.IfStatement(
        new Shift.IdentifierExpression(new Shift.Identifier("morning")),
        new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
          new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("x")), new Shift.LiteralNumericExpression(0))
        ])),
        null
      )
    );
    expect(stmt(parse("if (morning) function a(){}"))).to.be.eql(
      new Shift.IfStatement(
        new Shift.IdentifierExpression(new Shift.Identifier("morning")),
        new Shift.FunctionDeclaration(false, new Shift.Identifier("a"), [], null, new Shift.FunctionBody([], [])),
        null
      )
    );
    assertEsprimaEquiv("if (morning) goodMorning(); else goodDay()");
    assertEsprimaEquiv("if(a)b;");
    assertEsprimaEquiv("if(a)b;else c;");
  });
});
