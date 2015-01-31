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
var testEsprimaEquiv = require('../assertions').testEsprimaEquiv;

describe("Parser", function () {
  describe("if statement", function () {
    testEsprimaEquiv("if (morning) goodMorning()");
    expect(stmt(parse("if (morning) (function(){})"))).to.be.eql(
      new Shift.IfStatement(
        new Shift.IdentifierExpression(new Shift.Identifier("morning")),
        new Shift.ExpressionStatement(new Shift.FunctionExpression(null, [], new Shift.FunctionBody([], []))),
        null
      )
    );
    testEsprimaEquiv("if (morning) var x = 0;");
    expect(stmt(parse("if (morning) function a(){}"))).to.be.eql(
      new Shift.IfStatement(
        new Shift.IdentifierExpression(new Shift.Identifier("morning")),
        new Shift.FunctionDeclaration(new Shift.Identifier("a"), [], new Shift.FunctionBody([], [])),
        null
      )
    );
    testEsprimaEquiv("if (morning) goodMorning(); else goodDay()");
    testEsprimaEquiv("if(a)b;");
    testEsprimaEquiv("if(a)b;else c;");
  });
});
