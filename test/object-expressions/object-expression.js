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
        new Shift.DataProperty(new Shift.PropertyName("identifier", "answer"), new Shift.LiteralNumericExpression(42)),
      ])
    );
    expect(expr(parse("({ if: 42 })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.PropertyName("identifier", "if"), new Shift.LiteralNumericExpression(42)),
      ])
    );
    expect(expr(parse("({ true: 42 })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.PropertyName("identifier", "true"), new Shift.LiteralNumericExpression(42)),
      ])
    );
    expect(expr(parse("({ false: 42 })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.PropertyName("identifier", "false"), new Shift.LiteralNumericExpression(42)),
      ])
    );
    expect(expr(parse("({ null: 42 })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.PropertyName("identifier", "null"), new Shift.LiteralNumericExpression(42)),
      ])
    );
    expect(expr(parse("({ \"answer\": 42 })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.PropertyName("string", "answer"), new Shift.LiteralNumericExpression(42)),
      ])
    );
    expect(expr(parse("({ x: 1, x: 2 })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.PropertyName("identifier", "x"), new Shift.LiteralNumericExpression(1)),
        new Shift.DataProperty(new Shift.PropertyName("identifier", "x"), new Shift.LiteralNumericExpression(2)),
      ])
    );

    expect(expr(parse("({ get width() { return m_width } })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.Getter(new Shift.PropertyName("identifier", "width"), new Shift.FunctionBody([], [
          new Shift.ReturnStatement(new Shift.IdentifierExpression(new Shift.Identifier("m_width"))),
        ])),
      ])
    );
    expect(expr(parse("({ get undef() {} })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.Getter(new Shift.PropertyName("identifier", "undef"), new Shift.FunctionBody([], [])),
      ])
    );
    expect(expr(parse("({ get if() {} })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.Getter(new Shift.PropertyName("identifier", "if"), new Shift.FunctionBody([], [])),
      ])
    );
    expect(expr(parse("({ get true() {} })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.Getter(new Shift.PropertyName("identifier", "true"), new Shift.FunctionBody([], [])),
      ])
    );
    expect(expr(parse("({ get false() {} })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.Getter(new Shift.PropertyName("identifier", "false"), new Shift.FunctionBody([], [])),
      ])
    );
    expect(expr(parse("({ get null() {} })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.Getter(new Shift.PropertyName("identifier", "null"), new Shift.FunctionBody([], [])),
      ])
    );
    expect(expr(parse("({ get \"undef\"() {} })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.Getter(new Shift.PropertyName("string", "undef"), new Shift.FunctionBody([], [])),
      ])
    );
    expect(expr(parse("({ get 10() {} })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.Getter(new Shift.PropertyName("number", "10"), new Shift.FunctionBody([], [])),
      ])
    );

    expect(expr(parse("({ set width(w) { w } })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.Setter(new Shift.PropertyName("identifier", "width"), new Shift.Identifier("w"), new Shift.FunctionBody([], [
          new Shift.ExpressionStatement(new Shift.IdentifierExpression(new Shift.Identifier("w"))),
        ])),
      ])
    );
    expect(expr(parse("({ set if(w) { w } })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.Setter(new Shift.PropertyName("identifier", "if"), new Shift.Identifier("w"), new Shift.FunctionBody([], [
          new Shift.ExpressionStatement(new Shift.IdentifierExpression(new Shift.Identifier("w"))),
        ])),
      ])
    );
    expect(expr(parse("({ set true(w) { w } })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.Setter(new Shift.PropertyName("identifier", "true"), new Shift.Identifier("w"), new Shift.FunctionBody([], [
          new Shift.ExpressionStatement(new Shift.IdentifierExpression(new Shift.Identifier("w"))),
        ])),
      ])
    );
    expect(expr(parse("({ set false(w) { w } })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.Setter(new Shift.PropertyName("identifier", "false"), new Shift.Identifier("w"), new Shift.FunctionBody([], [
          new Shift.ExpressionStatement(new Shift.IdentifierExpression(new Shift.Identifier("w"))),
        ])),
      ])
    );
    expect(expr(parse("({ set null(w) { w } })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.Setter(new Shift.PropertyName("identifier", "null"), new Shift.Identifier("w"), new Shift.FunctionBody([], [
          new Shift.ExpressionStatement(new Shift.IdentifierExpression(new Shift.Identifier("w"))),
        ])),
      ])
    );
    expect(expr(parse("({ set \"null\"(w) { w } })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.Setter(new Shift.PropertyName("string", "null"), new Shift.Identifier("w"), new Shift.FunctionBody([], [
          new Shift.ExpressionStatement(new Shift.IdentifierExpression(new Shift.Identifier("w"))),
        ])),
      ])
    );
    expect(expr(parse("({ set 10(w) { w } })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.Setter(new Shift.PropertyName("number", "10"), new Shift.Identifier("w"), new Shift.FunctionBody([], [
          new Shift.ExpressionStatement(new Shift.IdentifierExpression(new Shift.Identifier("w"))),
        ])),
      ])
    );

    expect(expr(parse("({ get: 2 })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.PropertyName("identifier", "get"), new Shift.LiteralNumericExpression(2)),
      ])
    );
    expect(expr(parse("({ set: 2 })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.PropertyName("identifier", "set"), new Shift.LiteralNumericExpression(2)),
      ])
    );
    expect(expr(parse("({ __proto__: 2 })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.PropertyName("identifier", "__proto__"), new Shift.LiteralNumericExpression(2)),
      ])
    );
    expect(expr(parse("({\"__proto__\": 2 })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.PropertyName("string", "__proto__"), new Shift.LiteralNumericExpression(2)),
      ])
    );

    expect(expr(parse("({ get width() { return width }, set width(width) { return width; } })"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.Getter(new Shift.PropertyName("identifier", "width"), new Shift.FunctionBody([], [
          new Shift.ReturnStatement(new Shift.IdentifierExpression(new Shift.Identifier("width"))),
        ])),
        new Shift.Setter(new Shift.PropertyName("identifier", "width"), new Shift.Identifier("width"), new Shift.FunctionBody([], [
          new Shift.ReturnStatement(new Shift.IdentifierExpression(new Shift.Identifier("width"))),
        ])),
      ])
    );

    expect(expr(parse("({a:0, get 'b'(){}, set 3(d){}})"))).to.be.eql(
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.PropertyName("identifier", "a"), new Shift.LiteralNumericExpression(0)),
        new Shift.Getter(new Shift.PropertyName("string", "b"), new Shift.FunctionBody([], [])),
        new Shift.Setter(new Shift.PropertyName("number", "3"), new Shift.Identifier("d"), new Shift.FunctionBody([], [])),
      ])
    );
  });
});
