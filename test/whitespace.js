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

var parse = require("../").default;
var Shift = require("shift-ast");

var expr = require("./helpers").expr;
var testEsprimaEquiv = require('./assertions').testEsprimaEquiv;

describe("Parser", function () {
  describe("automatic semicolon insertion", function () {
    testEsprimaEquiv("{ x\n++y }");
    testEsprimaEquiv("{ x\n--y }");
    testEsprimaEquiv("{ var x = 14, y = 3\nz; }");

    testEsprimaEquiv("while (true) { continue\nthere; }");
    testEsprimaEquiv("while (true) { continue // Comment\nthere; }");
    testEsprimaEquiv("while (true) { continue /* Multiline\nComment */there; }");

    testEsprimaEquiv("while (true) { break\nthere; }");
    testEsprimaEquiv("while (true) { break // Comment\nthere; }");
    testEsprimaEquiv("while (true) { break /* Multiline\nComment */there; }");

    expect(expr(parse("(function(){ return\nx; })"))).to.be.eql(
      new Shift.FunctionExpression(null, [], new Shift.FunctionBody([], [
        new Shift.ReturnStatement(null),
        new Shift.ExpressionStatement(new Shift.IdentifierExpression(new Shift.Identifier("x"))),
      ]))
    );
    expect(expr(parse("(function(){ return // Comment\nx; })"))).to.be.eql(
      new Shift.FunctionExpression(null, [], new Shift.FunctionBody([], [
        new Shift.ReturnStatement(null),
        new Shift.ExpressionStatement(new Shift.IdentifierExpression(new Shift.Identifier("x"))),
      ]))
    );
    expect(expr(parse("(function(){ return/* Multiline\nComment */x; })"))).to.be.eql(
      new Shift.FunctionExpression(null, [], new Shift.FunctionBody([], [
        new Shift.ReturnStatement(null),
        new Shift.ExpressionStatement(new Shift.IdentifierExpression(new Shift.Identifier("x"))),
      ]))
    );

    testEsprimaEquiv("{ throw error\nerror; }");
    testEsprimaEquiv("{ throw error// Comment\nerror; }");
    testEsprimaEquiv("{ throw error/* Multiline\nComment */error; }");
  });

  describe("whitespace characters", function () {
    testEsprimaEquiv("new\u0020\u0009\u000B\u000C\u00A0\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\uFEFFa");
    testEsprimaEquiv("{0\n1\r2\u20283\u20294}");
  });
});
