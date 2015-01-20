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
  describe("function declaration", function () {
    expect(stmt(parse("function hello() { z(); }"))).to.be.eql(
      new Shift.FunctionDeclaration(new Shift.Identifier("hello"), [], new Shift.FunctionBody([], [
        new Shift.ExpressionStatement(new Shift.CallExpression(new Shift.IdentifierExpression(new Shift.Identifier("z")), [])),
      ]))
    );
    expect(stmt(parse("function eval() { }"))).to.be.eql(
      new Shift.FunctionDeclaration(new Shift.Identifier("eval"), [], new Shift.FunctionBody([], []))
    );
    expect(stmt(parse("function arguments() { }"))).to.be.eql(
      new Shift.FunctionDeclaration(new Shift.Identifier("arguments"), [], new Shift.FunctionBody([], []))
    );
    expect(stmt(parse("function test(t, t) { }"))).to.be.eql(
      new Shift.FunctionDeclaration(new Shift.Identifier("test"), [
        new Shift.Identifier("t"),
        new Shift.Identifier("t"),
      ], new Shift.FunctionBody([], []))
    );
    expect(stmt(parse("function eval() { function inner() { \"use strict\" } }"))).to.be.eql(
      new Shift.FunctionDeclaration(new Shift.Identifier("eval"), [], new Shift.FunctionBody([], [
        new Shift.FunctionDeclaration(new Shift.Identifier("inner"), [], new Shift.FunctionBody([new Shift.UseStrictDirective], []))
      ]))
    );
    expect(stmt(parse("function hello(a) { z(); }"))).to.be.eql(
      new Shift.FunctionDeclaration(new Shift.Identifier("hello"), [new Shift.Identifier("a")], new Shift.FunctionBody([], [
        new Shift.ExpressionStatement(new Shift.CallExpression(new Shift.IdentifierExpression(new Shift.Identifier("z")), [])),
      ]))
    );
    expect(stmt(parse("function hello(a, b) { z(); }"))).to.be.eql(
      new Shift.FunctionDeclaration(new Shift.Identifier("hello"), [new Shift.Identifier("a"), new Shift.Identifier("b")], new Shift.FunctionBody([], [
        new Shift.ExpressionStatement(new Shift.CallExpression(new Shift.IdentifierExpression(new Shift.Identifier("z")), [])),
      ]))
    );
    expect(stmt(parse("function universe(__proto__) { }"))).to.be.eql(
      new Shift.FunctionDeclaration(new Shift.Identifier("universe"), [new Shift.Identifier("__proto__")], new Shift.FunctionBody([], []))
    );
    expect(stmt(parse("function test() { \"use strict\"\n + 42; }"))).to.be.eql(
      new Shift.FunctionDeclaration(new Shift.Identifier("test"), [], new Shift.FunctionBody([], [
        new Shift.ExpressionStatement(new Shift.BinaryExpression("+", new Shift.LiteralStringExpression("use strict"), new Shift.LiteralNumericExpression(42))),
      ]))
    );
  });
});
