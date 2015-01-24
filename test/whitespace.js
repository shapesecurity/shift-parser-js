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
var stmt = require("./helpers").stmt;
var assertEsprimaEquiv = require('./assertions').assertEsprimaEquiv;

describe("Parser", function () {
  describe("automatic semicolon insertion", function () {
    assertEsprimaEquiv("{ x\n++y }");
    assertEsprimaEquiv("{ x\n--y }");
    expect(stmt(parse("{ var x = 14, y = 3\nz; }"))).to.be.eql(
      new Shift.BlockStatement(new Shift.Block([
        new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
          new Shift.VariableDeclarator(
            new Shift.BindingIdentifier(new Shift.Identifier("x")),
            new Shift.LiteralNumericExpression(14)
          ),
          new Shift.VariableDeclarator(
            new Shift.BindingIdentifier(new Shift.Identifier("y")),
            new Shift.LiteralNumericExpression(3)
          ),
        ])),
        new Shift.ExpressionStatement(new Shift.IdentifierExpression(new Shift.Identifier("z"))),
      ]))
    );

    assertEsprimaEquiv("while (true) { continue\nthere; }");
    assertEsprimaEquiv("while (true) { continue // Comment\nthere; }");
    assertEsprimaEquiv("while (true) { continue /* Multiline\nComment */there; }");

    assertEsprimaEquiv("while (true) { break\nthere; }");
    assertEsprimaEquiv("while (true) { break // Comment\nthere; }");
    assertEsprimaEquiv("while (true) { break /* Multiline\nComment */there; }");

    expect(expr(parse("(function(){ return\nx; })"))).to.be.eql(
      new Shift.FunctionExpression(false, null, [], null, new Shift.FunctionBody([], [
        new Shift.ReturnStatement(null),
        new Shift.ExpressionStatement(new Shift.IdentifierExpression(new Shift.Identifier("x"))),
      ]))
    );
    expect(expr(parse("(function(){ return // Comment\nx; })"))).to.be.eql(
      new Shift.FunctionExpression(false, null, [], null, new Shift.FunctionBody([], [
        new Shift.ReturnStatement(null),
        new Shift.ExpressionStatement(new Shift.IdentifierExpression(new Shift.Identifier("x"))),
      ]))
    );
    expect(expr(parse("(function(){ return/* Multiline\nComment */x; })"))).to.be.eql(
      new Shift.FunctionExpression(false, null, [], null, new Shift.FunctionBody([], [
        new Shift.ReturnStatement(null),
        new Shift.ExpressionStatement(new Shift.IdentifierExpression(new Shift.Identifier("x"))),
      ]))
    );

    assertEsprimaEquiv("{ throw error\nerror; }");
    assertEsprimaEquiv("{ throw error// Comment\nerror; }");
    assertEsprimaEquiv("{ throw error/* Multiline\nComment */error; }");
  });

  describe("whitespace characters", function () {
    assertEsprimaEquiv("new\u0020\u0009\u000B\u000C\u00A0\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\uFEFFa");
    assertEsprimaEquiv("{0\n1\r2\u20283\u20294}");
  });
});
