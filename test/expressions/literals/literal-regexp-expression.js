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

var expr = require("../../helpers").expr;
var testParse = require("../../assertions").testParse;

suite("Parser", function () {
  suite("literal regexp expression", function () {
    // Regular Expression Literals
    testParse("/a/", expr, { type: "LiteralRegExpExpression", pattern: "a", flags: "" });
    testParse("/a/;", expr, { type: "LiteralRegExpExpression", pattern: "a", flags: "" });
    testParse("/a/i", expr, { type: "LiteralRegExpExpression", pattern: "a", flags: "i" });
    testParse("/a/i;", expr, { type: "LiteralRegExpExpression", pattern: "a", flags: "i" });
    testParse("/[a-z]/i", expr, { type: "LiteralRegExpExpression", pattern: "[a-z]", flags: "i" });
    testParse("/[x-z]/i", expr, { type: "LiteralRegExpExpression", pattern: "[x-z]", flags: "i" });
    testParse("/[a-c]/i", expr, { type: "LiteralRegExpExpression", pattern: "[a-c]", flags: "i" });
    testParse("/[P QR]/i", expr, { type: "LiteralRegExpExpression", pattern: "[P QR]", flags: "i" });
    testParse("/[\\]/]/", expr, { type: "LiteralRegExpExpression", pattern: "[\\]/]", flags: "" });
    testParse("/foo\\/bar/", expr, { type: "LiteralRegExpExpression", pattern: "foo/bar", flags: "" });
    testParse("/=([^=\\s])+/g", expr, { type: "LiteralRegExpExpression", pattern: "=([^=\\s])+", flags: "g" });
    testParse("/0/g.test", expr, {
      type: "StaticMemberExpression",
      object: { type: "LiteralRegExpExpression", pattern: "0", flags: "g" },
      property: "test"
    });
  });
});
