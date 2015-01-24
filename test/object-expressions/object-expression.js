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

var expr = require("../helpers").expr;
var assertEsprimaEquiv = require('../assertions').assertEsprimaEquiv;

describe("Parser", function () {
  describe("object expression", function () {
    assertEsprimaEquiv("({})");
    assertEsprimaEquiv("+{}");
    assertEsprimaEquiv("+{ }");

    expect(expr(parse("({ answer: 42 })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.StaticPropertyName("answer"), new Shift.LiteralNumericExpression(42)),
      ])
    );
    expect(expr(parse("({ if: 42 })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.StaticPropertyName("if"), new Shift.LiteralNumericExpression(42)),
      ])
    );
    expect(expr(parse("({ true: 42 })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.StaticPropertyName("true"), new Shift.LiteralNumericExpression(42)),
      ])
    );
    expect(expr(parse("({ false: 42 })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.StaticPropertyName("false"), new Shift.LiteralNumericExpression(42)),
      ])
    );
    expect(expr(parse("({ null: 42 })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.StaticPropertyName("null"), new Shift.LiteralNumericExpression(42)),
      ])
    );
    expect(expr(parse("({ \"answer\": 42 })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.StaticPropertyName("answer"), new Shift.LiteralNumericExpression(42)),
      ])
    );
    expect(expr(parse("({ x: 1, x: 2 })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.StaticPropertyName("x"), new Shift.LiteralNumericExpression(1)),
        new Shift.DataProperty(new Shift.StaticPropertyName("x"), new Shift.LiteralNumericExpression(2)),
      ])
    );

    expect(expr(parse("({ get width() { return m_width } })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.Getter(new Shift.StaticPropertyName("width"), new Shift.FunctionBody([], [
          new Shift.ReturnStatement(new Shift.IdentifierExpression(new Shift.Identifier("m_width"))),
        ])),
      ])
    );
    expect(expr(parse("({ get undef() {} })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.Getter(new Shift.StaticPropertyName("undef"), new Shift.FunctionBody([], [])),
      ])
    );
    expect(expr(parse("({ get if() {} })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.Getter(new Shift.StaticPropertyName("if"), new Shift.FunctionBody([], [])),
      ])
    );
    expect(expr(parse("({ get true() {} })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.Getter(new Shift.StaticPropertyName("true"), new Shift.FunctionBody([], [])),
      ])
    );
    expect(expr(parse("({ get false() {} })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.Getter(new Shift.StaticPropertyName("false"), new Shift.FunctionBody([], [])),
      ])
    );
    expect(expr(parse("({ get null() {} })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.Getter(new Shift.StaticPropertyName("null"), new Shift.FunctionBody([], [])),
      ])
    );
    expect(expr(parse("({ get \"undef\"() {} })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.Getter(new Shift.StaticPropertyName("undef"), new Shift.FunctionBody([], [])),
      ])
    );
    expect(expr(parse("({ get 10() {} })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.Getter(new Shift.StaticPropertyName("10"), new Shift.FunctionBody([], [])),
      ])
    );

    expect(expr(parse("({ set width(w) { w } })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.Setter(new Shift.StaticPropertyName("width"), new Shift.Identifier("w"), new Shift.FunctionBody([], [
          new Shift.ExpressionStatement(new Shift.IdentifierExpression(new Shift.Identifier("w"))),
        ])),
      ])
    );
    expect(expr(parse("({ set if(w) { w } })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.Setter(new Shift.StaticPropertyName("if"), new Shift.Identifier("w"), new Shift.FunctionBody([], [
          new Shift.ExpressionStatement(new Shift.IdentifierExpression(new Shift.Identifier("w"))),
        ])),
      ])
    );
    expect(expr(parse("({ set true(w) { w } })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.Setter(new Shift.StaticPropertyName("true"), new Shift.Identifier("w"), new Shift.FunctionBody([], [
          new Shift.ExpressionStatement(new Shift.IdentifierExpression(new Shift.Identifier("w"))),
        ])),
      ])
    );
    expect(expr(parse("({ set false(w) { w } })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.Setter(new Shift.StaticPropertyName("false"), new Shift.Identifier("w"), new Shift.FunctionBody([], [
          new Shift.ExpressionStatement(new Shift.IdentifierExpression(new Shift.Identifier("w"))),
        ])),
      ])
    );
    expect(expr(parse("({ set null(w) { w } })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.Setter(new Shift.StaticPropertyName("null"), new Shift.Identifier("w"), new Shift.FunctionBody([], [
          new Shift.ExpressionStatement(new Shift.IdentifierExpression(new Shift.Identifier("w"))),
        ])),
      ])
    );
    expect(expr(parse("({ set \"null\"(w) { w } })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.Setter(new Shift.StaticPropertyName("null"), new Shift.Identifier("w"), new Shift.FunctionBody([], [
          new Shift.ExpressionStatement(new Shift.IdentifierExpression(new Shift.Identifier("w"))),
        ])),
      ])
    );
    expect(expr(parse("({ set 10(w) { w } })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.Setter(new Shift.StaticPropertyName("10"), new Shift.Identifier("w"), new Shift.FunctionBody([], [
          new Shift.ExpressionStatement(new Shift.IdentifierExpression(new Shift.Identifier("w"))),
        ])),
      ])
    );

    expect(expr(parse("({ get: 2 })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.StaticPropertyName("get"), new Shift.LiteralNumericExpression(2)),
      ])
    );
    expect(expr(parse("({ set: 2 })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.StaticPropertyName("set"), new Shift.LiteralNumericExpression(2)),
      ])
    );
    expect(expr(parse("({ __proto__: 2 })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.StaticPropertyName("__proto__"), new Shift.LiteralNumericExpression(2)),
      ])
    );
    expect(expr(parse("({\"__proto__\": 2 })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.StaticPropertyName("__proto__"), new Shift.LiteralNumericExpression(2)),
      ])
    );

    expect(expr(parse("({ get width() { return width }, set width(width) { return width; } })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.Getter(new Shift.StaticPropertyName("width"), new Shift.FunctionBody([], [
          new Shift.ReturnStatement(new Shift.IdentifierExpression(new Shift.Identifier("width"))),
        ])),
        new Shift.Setter(new Shift.StaticPropertyName("width"), new Shift.Identifier("width"), new Shift.FunctionBody([], [
          new Shift.ReturnStatement(new Shift.IdentifierExpression(new Shift.Identifier("width"))),
        ])),
      ])
    );

    expect(expr(parse("({a:0, get 'b'(){}, set 3(d){}})"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.StaticPropertyName("a"), new Shift.LiteralNumericExpression(0)),
        new Shift.Getter(new Shift.StaticPropertyName("b"), new Shift.FunctionBody([], [])),
        new Shift.Setter(new Shift.StaticPropertyName("3"), new Shift.Identifier("d"), new Shift.FunctionBody([], [])),
      ])
    );

    expect(expr(parse("({a})"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.ShorthandProperty(new Shift.Identifier("a")),
      ])
    );
    expect(expr(parse("({a, b: 0, c})"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.ShorthandProperty(new Shift.Identifier("a")),
        new Shift.DataProperty(
          new Shift.StaticPropertyName("b"),
          new Shift.LiteralNumericExpression(0)
        ),
        new Shift.ShorthandProperty(new Shift.Identifier("c")),
      ])
    );
    expect(expr(parse("({a, b})"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.ShorthandProperty(new Shift.Identifier("a")),
        new Shift.ShorthandProperty(new Shift.Identifier("b")),
      ])
    );
  });
});
