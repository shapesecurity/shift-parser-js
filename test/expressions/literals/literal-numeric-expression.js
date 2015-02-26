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

var Shift = require("shift-ast");

var expr = require("../../helpers").expr;
var testParse = require('../../assertions').testParse;
var testEsprimaEquiv = require('../../assertions').testEsprimaEquiv;
var testParseFailure = require("../../assertions").testParseFailure;

suite("Parser", function () {
  suite("literal numeric expression", function () {
    testEsprimaEquiv("0");
    testEsprimaEquiv("0;");
    testEsprimaEquiv("3");
    testEsprimaEquiv("5");
    testEsprimaEquiv("42");
    testEsprimaEquiv("\n    42\n\n");

    testEsprimaEquiv(".14");
    testEsprimaEquiv("6.");
    testEsprimaEquiv("0.");
    testEsprimaEquiv("3.14159");

    testEsprimaEquiv("6.02214179e+23");
    testEsprimaEquiv("1.492417830e-10");
    testEsprimaEquiv("0e+100 ");
    testEsprimaEquiv("0e+100");

    testEsprimaEquiv("0x0");
    testEsprimaEquiv("0x0;");
    testEsprimaEquiv("0xabc");
    testEsprimaEquiv("0xdef");
    testEsprimaEquiv("0X1A");
    testEsprimaEquiv("0x10");
    testEsprimaEquiv("0x100");
    testEsprimaEquiv("0X04");

    testEsprimaEquiv("02");
    testEsprimaEquiv("012");
    testEsprimaEquiv("0012");
    testEsprimaEquiv("\n    42\n\n");
    testEsprimaEquiv("0.");

    // Binary Numeric Literal
    testParse("0b0", expr, new Shift.LiteralNumericExpression(0));
    testParse("0b1", expr, new Shift.LiteralNumericExpression(1));
    testParse("0b10", expr, new Shift.LiteralNumericExpression(2));
    testParse("0B0", expr, new Shift.LiteralNumericExpression(0));

    testParseFailure("0b", "Unexpected token ILLEGAL");
    testParseFailure("0b1a", "Unexpected token ILLEGAL");
    testParseFailure("0b9", "Unexpected token ILLEGAL");
    testParseFailure("0b18", "Unexpected token ILLEGAL");
    testParseFailure("0b12", "Unexpected token ILLEGAL");
    testParseFailure("0B", "Unexpected token ILLEGAL");
    testParseFailure("0B1a", "Unexpected token ILLEGAL");
    testParseFailure("0B9", "Unexpected token ILLEGAL");
    testParseFailure("0B18", "Unexpected token ILLEGAL");
    testParseFailure("0B12", "Unexpected token ILLEGAL");

    // Octal Numeric Literal
    testParse("0o0", expr, new Shift.LiteralNumericExpression(0));
    testParse("(0o0)", expr, new Shift.LiteralNumericExpression(0));
    testParse("0o1", expr, new Shift.LiteralNumericExpression(1));
    testParse("0o10", expr, new Shift.LiteralNumericExpression(8));
    testParse("0O0", expr, new Shift.LiteralNumericExpression(0));
    testParse("09", expr, new Shift.LiteralNumericExpression(9));
    testParse("018", expr, new Shift.LiteralNumericExpression(18));

    testParseFailure("0o", "Unexpected token ILLEGAL");
    testParseFailure("0o1a", "Unexpected token ILLEGAL");
    testParseFailure("0o9", "Unexpected token ILLEGAL");
    testParseFailure("0o18", "Unexpected token ILLEGAL");
    testParseFailure("0O", "Unexpected token ILLEGAL");
    testParseFailure("0O1a", "Unexpected token ILLEGAL");
    testParseFailure("0O9", "Unexpected token ILLEGAL");
    testParseFailure("0O18", "Unexpected token ILLEGAL");
  });
});
