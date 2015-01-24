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
var assertParseFailure = require('../assertions').assertParseFailure;

describe("Parser", function () {
  describe("variable declaration statement", function () {
    // Variable Statement
    expect(stmt(parse("var x"))).to.be.eql(
      new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
        new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("x")), null),
      ]))
    );
    expect(stmt(parse("var a;"))).to.be.eql(
      new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
        new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("a")), null),
      ]))
    );
    expect(stmt(parse("var x, y;"))).to.be.eql(
      new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
        new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("x")), null),
        new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("y")), null),
      ]))
    );
    expect(stmt(parse("var x = 0"))).to.be.eql(
      new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
        new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("x")), new Shift.LiteralNumericExpression(0)),
      ]))
    );
    expect(stmt(parse("var eval = 0, arguments = 1"))).to.be.eql(
      new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
        new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("eval")), new Shift.LiteralNumericExpression(0)),
        new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("arguments")), new Shift.LiteralNumericExpression(1)),
      ]))
    );
    expect(stmt(parse("var x = 0, y = 1, z = 2"))).to.be.eql(
      new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
        new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("x")), new Shift.LiteralNumericExpression(0)),
        new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("y")), new Shift.LiteralNumericExpression(1)),
        new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("z")), new Shift.LiteralNumericExpression(2)),
      ]))
    );
    expect(stmt(parse("var implements, interface, package"))).to.be.eql(
      new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
        new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("implements")), null),
        new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("interface")), null),
        new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("package")), null),
      ]))
    );
    expect(stmt(parse("var private, protected, public, static"))).to.be.eql(
      new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
        new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("private")), null),
        new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("protected")), null),
        new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("public")), null),
        new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("static")), null),
      ]))
    );
    expect(stmt(parse("var yield;"))).to.be.eql(
      new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
        new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("yield")), null),
      ]))
    );

    // Let Statement
    expect(stmt(parse("let x"))).to.be.eql(
      new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("let", [
        new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("x")), null),
      ]))
    );
    expect(stmt(parse("{ let x }"))).to.be.eql(
      new Shift.BlockStatement(new Shift.Block([
        new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("let", [
          new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("x")), null),
        ])),
      ]))
    );
    expect(stmt(parse("{ let x = 0 }"))).to.be.eql(
      new Shift.BlockStatement(new Shift.Block([
        new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("let", [
          new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("x")), new Shift.LiteralNumericExpression(0)),
        ])),
      ]))
    );
    expect(stmt(parse("{ let x = 0, y = 1, z = 2 }"))).to.be.eql(
      new Shift.BlockStatement(new Shift.Block([
        new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("let", [
          new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("x")), new Shift.LiteralNumericExpression(0)),
          new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("y")), new Shift.LiteralNumericExpression(1)),
          new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("z")), new Shift.LiteralNumericExpression(2)),
        ])),
      ]))
    );

    // Const Statement
    assertParseFailure("const x", "Unexpected end of input");
    assertParseFailure("{ const x }", "Unexpected token }");
    expect(stmt(parse("{ const x = 0 }"))).to.be.eql(
      new Shift.BlockStatement(new Shift.Block([
        new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("const", [
          new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("x")), new Shift.LiteralNumericExpression(0)),
        ])),
      ]))
    );
    expect(stmt(parse("{ const x = 0, y = 1, z = 2 }"))).to.be.eql(
      new Shift.BlockStatement(new Shift.Block([
        new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("const", [
          new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("x")), new Shift.LiteralNumericExpression(0)),
          new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("y")), new Shift.LiteralNumericExpression(1)),
          new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("z")), new Shift.LiteralNumericExpression(2)),
        ])),
      ]))
    );

    // destructuring
    expect(stmt(parse("var {a};"))).to.be.eql(
      new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
        new Shift.VariableDeclarator(
          new Shift.ObjectBinding([
            new Shift.BindingPropertyIdentifier(new Shift.BindingIdentifier(new Shift.Identifier("a")), null)
          ]),
          null
        ),
      ]))
    );
  });
});
