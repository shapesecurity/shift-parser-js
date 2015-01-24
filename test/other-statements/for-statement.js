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
  describe("for statement", function () {
    assertEsprimaEquiv("for(;;);");
    assertEsprimaEquiv("for(;;){}");
    assertEsprimaEquiv("for(x, y;;);");
    expect(stmt(parse("for(var x = 0;;);"))).to.be.eql(
      new Shift.ForStatement(
        new Shift.VariableDeclaration("var", [
          new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("x")), new Shift.LiteralNumericExpression(0))
        ]),
        null,
        null,
        new Shift.EmptyStatement
      )
    );
    expect(stmt(parse("for(let x = 0;;);"))).to.be.eql(
      new Shift.ForStatement(
        new Shift.VariableDeclaration("let", [
          new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("x")), new Shift.LiteralNumericExpression(0))
        ]),
        null,
        null,
        new Shift.EmptyStatement
      )
    );
    expect(stmt(parse("for(var x = 0, y = 1;;);"))).to.be.eql(
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
    assertEsprimaEquiv("for(x, y; x < 42;);");
    assertEsprimaEquiv("for(x, y; x < 42; x++);");
    assertEsprimaEquiv("for(x, y; x < 42; x++) process(x);");
    assertEsprimaEquiv("for(a;b;c);");
    expect(stmt(parse("for(var a;b;c);"))).to.be.eql(
      new Shift.ForStatement(
        new Shift.VariableDeclaration("var", [
          new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("a")), null)
        ]),
        new Shift.IdentifierExpression(new Shift.Identifier("b")),
        new Shift.IdentifierExpression(new Shift.Identifier("c")),
        new Shift.EmptyStatement
      )
    );
    expect(stmt(parse("for(var a = 0;b;c);"))).to.be.eql(
      new Shift.ForStatement(
        new Shift.VariableDeclaration("var", [
          new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("a")), new Shift.LiteralNumericExpression(0))
        ]),
        new Shift.IdentifierExpression(new Shift.Identifier("b")),
        new Shift.IdentifierExpression(new Shift.Identifier("c")),
        new Shift.EmptyStatement
      )
    );
    assertEsprimaEquiv("for(;b;c);");
  });
});
