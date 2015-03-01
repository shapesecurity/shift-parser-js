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

suite("Parser", function () {
  suite("literal regexp expression", function () {
    // Regular Expression Literals
    testParse("/a/", expr, new Shift.LiteralRegExpExpression("a", ""));
    testParse("/a/;", expr, new Shift.LiteralRegExpExpression("a", ""));
    testParse("/a/i", expr, new Shift.LiteralRegExpExpression("a", "i"));
    testParse("/a/i;", expr, new Shift.LiteralRegExpExpression("a", "i"));
    testParse("/[a-z]/i", expr, new Shift.LiteralRegExpExpression("[a-z]", "i"));
    testParse("/[x-z]/i", expr, new Shift.LiteralRegExpExpression("[x-z]", "i"));
    testParse("/[a-c]/i", expr, new Shift.LiteralRegExpExpression("[a-c]", "i"));
    testParse("/[P QR]/i", expr, new Shift.LiteralRegExpExpression("[P QR]", "i"));
    testParse("/[\\]/]/", expr, new Shift.LiteralRegExpExpression("[\\]/]", ""));
    testParse("/foo\\/bar/", expr, new Shift.LiteralRegExpExpression("foo/bar", ""));
    testParse("/=([^=\\s])+/g", expr, new Shift.LiteralRegExpExpression("=([^=\\s])+", "g"));
    testParse("/42/g.test", expr, new Shift.StaticMemberExpression(new Shift.LiteralRegExpExpression("42", "g"), "test"));
  });
});
