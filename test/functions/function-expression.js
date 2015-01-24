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
var assertEsprimaEquiv = require("../assertions").assertEsprimaEquiv;
var assertParseFailure = require("../assertions").assertParseFailure;

describe("Parser", function () {
  describe("function expression", function () {
    expect(expr(parse("(function(){})"))).to.be.eql(
      new Shift.FunctionExpression(false, null, [], null, new Shift.FunctionBody([], []))
    );
    expect(expr(parse("(function x() { y; z() });"))).to.be.eql(
      new Shift.FunctionExpression(false, new Shift.Identifier("x"), [], null, new Shift.FunctionBody([], [
        new Shift.ExpressionStatement(new Shift.IdentifierExpression(new Shift.Identifier("y"))),
        new Shift.ExpressionStatement(new Shift.CallExpression(new Shift.IdentifierExpression(new Shift.Identifier("z")), [])),
      ]))
    );
    expect(expr(parse("(function eval() { });"))).to.be.eql(
      new Shift.FunctionExpression(false, new Shift.Identifier("eval"), [], null, new Shift.FunctionBody([], []))
    );
    expect(expr(parse("(function arguments() { });"))).to.be.eql(
      new Shift.FunctionExpression(false, new Shift.Identifier("arguments"), [], null, new Shift.FunctionBody([], []))
    );
    expect(expr(parse("(function x(y, z) { })"))).to.be.eql(
      new Shift.FunctionExpression(
        false,
        new Shift.Identifier("x"),
        [
          new Shift.BindingIdentifier(new Shift.Identifier("y")),
          new Shift.BindingIdentifier(new Shift.Identifier("z"))
        ],
        null,
        new Shift.FunctionBody([], [])
      )
    );

    expect(expr(parse("(function(a = b){})"))).to.be.eql(
      new Shift.FunctionExpression(
        false, null,
        [
          new Shift.BindingWithDefault(
            new Shift.BindingIdentifier(new Shift.Identifier("a")),
            new Shift.IdentifierExpression(new Shift.Identifier("b"))
          )
        ],
        null, new Shift.FunctionBody([], [])
      )
    );
    expect(expr(parse("(function(...a){})"))).to.be.eql(
      new Shift.FunctionExpression(
        false, null, [], new Shift.BindingIdentifier(new Shift.Identifier("a")), new Shift.FunctionBody([], [])
      )
    );
    expect(expr(parse("(function(a, ...b){})"))).to.be.eql(
      new Shift.FunctionExpression(
        false, null, [new Shift.BindingIdentifier(new Shift.Identifier("a"))], new Shift.BindingIdentifier(new Shift.Identifier("b")), new Shift.FunctionBody([], [])
      )
    );
    expect(expr(parse("(function({a}){})"))).to.be.eql(
      new Shift.FunctionExpression(
        false,
        null,
        [
          new Shift.ObjectBinding([
            new Shift.BindingPropertyIdentifier(
              new Shift.BindingIdentifier(new Shift.Identifier("a")),
              null
            )
          ])
        ],
        null,
        new Shift.FunctionBody([], [])
      )
    );
    expect(expr(parse("(function({a: x, a: y}){})"))).to.be.eql(
      new Shift.FunctionExpression(
        false,
        null,
        [
          new Shift.ObjectBinding([
            new Shift.BindingPropertyProperty(
              new Shift.StaticPropertyName("a"),
              new Shift.BindingIdentifier(new Shift.Identifier("x"))
            ),
            new Shift.BindingPropertyProperty(
              new Shift.StaticPropertyName("a"),
              new Shift.BindingIdentifier(new Shift.Identifier("y"))
            )
          ])
        ],
        null,
        new Shift.FunctionBody([], [])
      )
    );
    expect(expr(parse("(function([a]){})"))).to.be.eql(
      new Shift.FunctionExpression(
        false,
        null,
        [
          new Shift.ArrayBinding(
            [new Shift.BindingIdentifier(new Shift.Identifier("a"))],
            null
          )
        ],
        null,
        new Shift.FunctionBody([], [])
      )
    );
    expect(expr(parse("(function({a = 0}){})"))).to.be.eql(
      new Shift.FunctionExpression(
        false,
        null,
        [
          new Shift.ObjectBinding([
            new Shift.BindingPropertyIdentifier(
              new Shift.BindingIdentifier(new Shift.Identifier("a")),
              new Shift.LiteralNumericExpression(0)
            )
          ])
        ],
        null,
        new Shift.FunctionBody([], [])
      )
    );

    assertParseFailure("(function([]){})", "Unexpected token [")
    assertParseFailure("(function([a, a]){})", "Duplicate binding 'a' in assignment")
    assertParseFailure("(function({a: x, b: x}){})", "Duplicate binding 'x' in assignment")
    assertParseFailure("'use strict'; (function({a: x}, {b: x}){})", "Strict mode function may not have duplicate parameter names")
    assertParseFailure("(function(...a, b){})", "Unexpected token ,")
  });
});
