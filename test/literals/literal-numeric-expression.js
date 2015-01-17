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
var Shift = require("shift-ast");
var parse = require("../..").default;
var expr = require("../helpers").expr;
var assertEsprimaEquiv = require("../assertions").assertEsprimaEquiv;
var assertParseFailure = require("../assertions").assertParseFailure;

describe("Parser", function () {
  describe("literal numeric expression", function () {
    assertEsprimaEquiv("0");
    assertEsprimaEquiv("0;");
    assertEsprimaEquiv("3");
    assertEsprimaEquiv("5");
    assertEsprimaEquiv("42");
    assertEsprimaEquiv("\n    42\n\n");

    assertEsprimaEquiv(".14");
    assertEsprimaEquiv("3.14159");

    assertEsprimaEquiv("6.02214179e+23");
    assertEsprimaEquiv("1.492417830e-10");
    assertEsprimaEquiv("0e+100 ");
    assertEsprimaEquiv("0e+100");

    assertEsprimaEquiv("0x0");
    assertEsprimaEquiv("0x0;");
    assertEsprimaEquiv("0xabc");
    assertEsprimaEquiv("0xdef");
    assertEsprimaEquiv("0X1A");
    assertEsprimaEquiv("0x10");
    assertEsprimaEquiv("0x100");
    assertEsprimaEquiv("0X04");

    assertEsprimaEquiv("02");
    assertEsprimaEquiv("012");
    assertEsprimaEquiv("0012");

    // Binary Numeric Literal
    expect(expr(parse("0b0"))).to.eql(new Shift.LiteralNumericExpression(0));
    expect(expr(parse("0b1"))).to.eql(new Shift.LiteralNumericExpression(1));
    expect(expr(parse("0b10"))).to.eql(new Shift.LiteralNumericExpression(2));
    expect(expr(parse("0B0"))).to.eql(new Shift.LiteralNumericExpression(0));

    assertParseFailure("0b", "Unexpected token ILLEGAL");
    assertParseFailure("0b1a", "Unexpected token ILLEGAL");
    assertParseFailure("0b9", "Unexpected token ILLEGAL");
    assertParseFailure("0b18", "Unexpected token ILLEGAL");
    assertParseFailure("0b12", "Unexpected token ILLEGAL");
    assertParseFailure("0B", "Unexpected token ILLEGAL");
    assertParseFailure("0B1a", "Unexpected token ILLEGAL");
    assertParseFailure("0B9", "Unexpected token ILLEGAL");
    assertParseFailure("0B18", "Unexpected token ILLEGAL");
    assertParseFailure("0B12", "Unexpected token ILLEGAL");

    // Octal Numeric Literal
    expect(expr(parse("0o0"))).to.eql(new Shift.LiteralNumericExpression(0));
    expect(expr(parse("0o1"))).to.eql(new Shift.LiteralNumericExpression(1));
    expect(expr(parse("0o10"))).to.eql(new Shift.LiteralNumericExpression(8));
    expect(expr(parse("0O0"))).to.eql(new Shift.LiteralNumericExpression(0));

    assertParseFailure("0o", "Unexpected token ILLEGAL");
    assertParseFailure("0o1a", "Unexpected token ILLEGAL");
    assertParseFailure("0o9", "Unexpected token ILLEGAL");
    assertParseFailure("0o18", "Unexpected token ILLEGAL");
    assertParseFailure("0O", "Unexpected token ILLEGAL");
    assertParseFailure("0O1a", "Unexpected token ILLEGAL");
    assertParseFailure("0O9", "Unexpected token ILLEGAL");
    assertParseFailure("0O18", "Unexpected token ILLEGAL");

  });
});
