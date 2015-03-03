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
var testParse = require("../../assertions").testParse;
var testParseFailure = require("../../assertions").testParseFailure;

suite("Parser", function () {
  suite("literal string expression", function () {
    testParse("('x')", expr, new Shift.LiteralStringExpression("x") );
    testParse("('\\\\\\'')", expr, new Shift.LiteralStringExpression("\\'"));
    testParse("(\"x\")", expr, new Shift.LiteralStringExpression("x"));
    testParse("(\"\\\\\\\"\")", expr, new Shift.LiteralStringExpression("\\\""));
    testParse("('\\\r')", expr, new Shift.LiteralStringExpression(""));
    testParse("('\\\r\n')", expr, new Shift.LiteralStringExpression(""));
    testParse("('\\\n')", expr, new Shift.LiteralStringExpression(""));
    testParse("('\\\u2028')", expr, new Shift.LiteralStringExpression(""));
    testParse("('\\\u2029')", expr, new Shift.LiteralStringExpression(""));
    testParse("('\u202a')", expr, new Shift.LiteralStringExpression("\u202a"));
    testParse("('\\0')", expr, new Shift.LiteralStringExpression("\u0000"));
    testParse("('\\01')", expr, new Shift.LiteralStringExpression("\u0001"));
    testParse("('\\1')", expr, new Shift.LiteralStringExpression("\u0001"));
    testParse("('\\11')", expr, new Shift.LiteralStringExpression("\u0009"));
    testParse("('\\111')", expr, new Shift.LiteralStringExpression("\u0049"));
    testParse("('\\1111')", expr, new Shift.LiteralStringExpression("\u00491")); // 73/16
    testParse("('\\2111')", expr, new Shift.LiteralStringExpression("\u00891")); // 73/16
    testParse("('\\5111')", expr, new Shift.LiteralStringExpression("\u002911")); // 73/16
    testParse("('\\5a')", expr, new Shift.LiteralStringExpression("\u0005a")); // 73/16
    testParse("('\\7a')", expr, new Shift.LiteralStringExpression("\u0007a")); // 73/16
    testParse("('\\9a')", expr, new Shift.LiteralStringExpression("9a")); // 73/16
    testParse("('\\u{00F8}')", expr, new Shift.LiteralStringExpression("\u00F8"));
    testParse("('\\u{0}')", expr, new Shift.LiteralStringExpression("\u0000"));
    testParse("('\\u{10FFFF}')", expr, new Shift.LiteralStringExpression(String.fromCharCode(0x10FFFF)));
    testParse("('\\u{0000000000F8}')", expr, new Shift.LiteralStringExpression("\u00F8"));

    testParseFailure("(')", "Unexpected token ILLEGAL");
    testParseFailure("('\n')", "Unexpected token ILLEGAL");
    testParseFailure("('\u2028')", "Unexpected token ILLEGAL");
    testParseFailure("('\u2029')", "Unexpected token ILLEGAL");
    testParseFailure("('\\u{2028')", "Unexpected token ILLEGAL");
    testParseFailure("'use strict'; ('\\1')", "Octal literals are not allowed in strict mode.");

  });
});
