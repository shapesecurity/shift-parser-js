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

var testParseFailure = require("./assertions").testParseFailure;
var testParseModuleFailure = require("./assertions").testParseModuleFailure;

// TODO: make sense of this file
suite("Parser", function () {
  suite("syntax errors", function () {

    testParseFailure("/*", "Unexpected end of input");
    testParseFailure("/*\r", "Unexpected end of input");
    testParseFailure("/*\r\n", "Unexpected end of input");
    testParseFailure("/*\u2028", "Unexpected end of input");
    testParseFailure("/*\u2029", "Unexpected end of input");
    testParseFailure("/**", "Unexpected end of input");
    testParseFailure("\\", "Unexpected end of input");
    testParseFailure("\\u", "Unexpected end of input");
    testParseFailure("\\x", "Unexpected \"x\"");
    testParseFailure("\\o", "Unexpected \"o\"");
    testParseFailure("\\u1", "Unexpected \"1\"");
    testParseFailure("\\u12", "Unexpected \"1\"");
    testParseFailure("\\u113", "Unexpected \"1\"");
    testParseFailure("a\\uz   ", "Unexpected \"z\"");
    testParseFailure("a\\u1z  ", "Unexpected \"1\"");
    testParseFailure("a\\u11z ", "Unexpected \"1\"");
    testParseFailure("a\\u111z", "Unexpected \"1\"");
    testParseFailure("a\\", "Unexpected end of input");
    testParseFailure("a\\u", "Unexpected end of input");
    testParseFailure("a\\x", "Unexpected \"x\"");
    testParseFailure("a\\o", "Unexpected \"o\"");
    testParseFailure("a\\u1", "Unexpected \"1\"");
    testParseFailure("a\\u12", "Unexpected \"1\"");
    testParseFailure("a\\u113", "Unexpected \"1\"");
    testParseFailure("\\uD800", "Unexpected end of input");
    testParseFailure("\\uD800x", "Unexpected \"x\"");
    testParseFailure("\\uD800\\", "Unexpected \"\\\\\"");
    testParseFailure("\\uD800\\u", "Unexpected \"\\\\\"");
    testParseFailure("\\uD800\\x62", "Unexpected \"\\\\\"");
    testParseFailure("\uD800", "Unexpected end of input");
    testParseFailure("\uD800x", "Unexpected end of input");
    testParseFailure("\uD800\\", "Unexpected end of input");
    testParseFailure("\uD800\\u", "Unexpected \"u\"");
    testParseFailure("\uD800\\x62", "Unexpected \"x\"");
    testParseFailure("'\\03", "Unexpected end of input");
    testParseFailure("'\\x", "Unexpected end of input");
    testParseFailure("'\\x1", "Unexpected \"1\"");
    testParseFailure("'\\x1   ", "Unexpected \"1\"");
    testParseFailure("'\\x12  ", "Unexpected end of input");
    testParseFailure("'\n", "Unexpected \"\\n\"");
    testParseFailure("'\\", "Unexpected end of input");
    testParseFailure("＊", "Unexpected \"\uFF0A\"");
    testParseFailure("1.a", "Unexpected \"a\"");
    testParseFailure("1.e", "Unexpected end of input");
    testParseFailure("1.e+", "Unexpected end of input");
    testParseFailure("1.e+z", "Unexpected \"z\"");
    testParseFailure("/\\\n0", "Invalid regular expression: missing /");
    testParseFailure("0x", "Unexpected end of input");
    testParseFailure("0xz", "Unexpected \"z\"");
    testParseFailure("0x1z", "Unexpected \"1\"");
    testParseFailure("0a", "Unexpected \"a\"");
    testParseFailure("08a", "Unexpected \"a\"");
    testParseFailure("\u0008", "Unexpected \"\\b\"");
    testParseFailure("{", "Unexpected end of input");
    testParseFailure("}", "Unexpected token \"}\"");
    testParseModuleFailure("}", "Unexpected token \"}\"");
    testParseFailure("3ea", "Unexpected \"a\"");
    testParseFailure("3in []", "Unexpected \"i\"");
    testParseFailure("3e", "Unexpected end of input");
    testParseFailure("3e+", "Unexpected end of input");
    testParseFailure("3e-", "Unexpected end of input");
    testParseFailure("3x", "Unexpected \"x\"");
    testParseFailure("3x0", "Unexpected \"x\"");
    testParseFailure("0x", "Unexpected end of input");
    testParseFailure("01a", "Unexpected \"a\"");
    testParseFailure("3in[]", "Unexpected \"i\"");
    testParseFailure("0x3in[]", "Unexpected \"3\""); // TODO: shouldn't this be "Unexpected \"i\""?
    testParseFailure("\"Hello\nWorld\"", "Unexpected \"\\n\"");
    testParseFailure("x\\", "Unexpected end of input");
    testParseFailure("x\\u005c", "Unexpected end of input");
    testParseFailure("x\\u002a", "Unexpected end of input");
    testParseFailure("a\\u", "Unexpected end of input");
    testParseFailure("\\ua", "Unexpected \"a\"");
    testParseFailure("/", "Invalid regular expression: missing /");
    testParseFailure("/test", "Invalid regular expression: missing /");
    testParseFailure("/test\n/", "Invalid regular expression: missing /");
    testParseFailure("for((1 + 1) in list) process(x);", "Invalid left-hand side in for-in");
    testParseFailure("[", "Unexpected end of input");
    testParseFailure("[,", "Unexpected end of input");
    testParseFailure("1 + {", "Unexpected end of input");
    testParseFailure("1 + { t:t ", "Unexpected end of input");
    testParseFailure("1 + { t:t,", "Unexpected end of input");
    testParseFailure("var x = /\n/", "Invalid regular expression: missing /");
    testParseFailure("var x = \"\n", "Unexpected \"\\n\"");
    testParseFailure("var if = 0", "Unexpected token \"if\"");
    testParseFailure("i #= 0", "Unexpected \"#\"");
    testParseFailure("1 + (", "Unexpected end of input");
    testParseFailure("\n\n\n{", "Unexpected end of input");
    testParseFailure("\n/* Some multiline\ncomment */\n)", "Unexpected token \")\"");
    testParseFailure("{ set 1 }", "Unexpected number");
    testParseFailure("{ get 2 }", "Unexpected number");
    testParseFailure("({ set: s(if) { } })", "Unexpected token \"if\"");
    testParseFailure("({ set s(.) { } })", "Unexpected token \".\"");
    testParseFailure("({ set s() { } })", "Unexpected token \")\"");
    testParseFailure("({ set: s() { } })", "Unexpected token \"{\"");
    testParseFailure("({ set: s(a, b) { } })", "Unexpected token \"{\"");
    testParseFailure("({ get: g(d) { } })", "Unexpected token \"{\"");
    testParseFailure("function t(if) { }", "Unexpected token \"if\"");
    testParseFailure("function t(true) { }", "Unexpected token \"true\"");
    testParseFailure("function t(false) { }", "Unexpected token \"false\"");
    testParseFailure("function t(null) { }", "Unexpected token \"null\"");
    testParseFailure("function null() { }", "Unexpected token \"null\"");
    testParseFailure("function true() { }", "Unexpected token \"true\"");
    testParseFailure("function false() { }", "Unexpected token \"false\"");
    testParseFailure("function if() { }", "Unexpected token \"if\"");
    testParseFailure("a b;", "Unexpected identifier");
    testParseFailure("if.a;", "Unexpected token \".\"");
    testParseFailure("a if;", "Unexpected token \"if\"");
    testParseFailure("a class;", "Unexpected token \"class\"");
    testParseFailure("break 1;", "Unexpected number");
    testParseFailure("continue 2;", "Unexpected number");
    testParseFailure("throw", "Unexpected end of input");
    testParseFailure("throw;", "Unexpected token \";\"");
    testParseFailure("throw\n", "Illegal newline after throw");
    testParseFailure("for (var i, i2 in {});", "Unexpected token \"in\"");
    testParseFailure("for ((i in {}));", "Unexpected token \")\"");
    testParseFailure("for (i + 1 in {});", "Invalid left-hand side in for-in");
    testParseFailure("for (+i in {});", "Invalid left-hand side in for-in");
    testParseFailure("if(false)", "Unexpected end of input");
    testParseFailure("if(false) doThis(); else", "Unexpected end of input");
    testParseFailure("do", "Unexpected end of input");
    testParseFailure("while(false)", "Unexpected end of input");
    testParseFailure("for(;;)", "Unexpected end of input");
    testParseFailure("with(x)", "Unexpected end of input");
    testParseFailure("try { }", "Missing catch or finally after try");
    testParseFailure("try {} catch (0) {} ", "Unexpected number");
    testParseFailure("try {} catch (answer()) {} ", "Unexpected token \"(\"");
    testParseFailure("try {} catch (-x) {} ", "Unexpected token \"-\"");
    testParseFailure("\u203F = 10", "Unexpected \"\u203F\"");
    testParseFailure("switch (c) { default: default: }", "More than one default clause in switch statement");
    testParseFailure("new X().\"s\"", "Unexpected string");
    testParseFailure("/*", "Unexpected end of input");
    testParseFailure("/*\n\n\n", "Unexpected end of input");
    testParseFailure("/**", "Unexpected end of input");
    testParseFailure("/*\n\n*", "Unexpected end of input");
    testParseFailure("/*hello", "Unexpected end of input");
    testParseFailure("/*hello  *", "Unexpected end of input");
    testParseFailure("\n]", "Unexpected token \"]\"");
    testParseFailure("\r]", "Unexpected token \"]\"");
    testParseFailure("\r\n]", "Unexpected token \"]\"");
    testParseFailure("\n\r]", "Unexpected token \"]\"");
    testParseFailure("//\r\n]", "Unexpected token \"]\"");
    testParseFailure("//\n\r]", "Unexpected token \"]\"");
    testParseFailure("/a\\\n/", "Invalid regular expression: missing /");
    testParseFailure("//\r \n]", "Unexpected token \"]\"");
    testParseFailure("/*\r\n*/]", "Unexpected token \"]\"");
    testParseFailure("/*\n\r*/]", "Unexpected token \"]\"");
    testParseFailure("/*\r \n*/]", "Unexpected token \"]\"");
    testParseFailure("\\\\", "Unexpected \"\\\\\"");
    testParseFailure("\\u005c", "Unexpected end of input");
    testParseFailure("\\x", "Unexpected \"x\"");
    testParseFailure("\\u0000", "Unexpected end of input");
    testParseFailure("\u200C = []", "Unexpected \"\u200C\"");
    testParseFailure("\u200D = []", "Unexpected \"\u200D\"");
    testParseFailure("\"\\", "Unexpected end of input");
    testParseFailure("\"\\u", "Unexpected end of input");
    testParseFailure("try { } catch() {}", "Unexpected token \")\"");
    testParseFailure("do { x } *", "Unexpected token \"*\"");
    testParseFailure("var", "Unexpected end of input");
    testParseFailure("const", "Unexpected token \"const\"");
    testParseFailure("a enum", "Unexpected identifier");
    testParseFailure("{ ;  ;  ", "Unexpected end of input");
    testParseFailure("({get +:3})", "Unexpected token \"+\"");
    testParseFailure("({get +:3})", "Unexpected token \"+\"");
    testParseFailure("function t() { ;  ;  ", "Unexpected end of input");
    testParseFailure("#=", "Unexpected \"#\"");
    testParseFailure("**", "Unexpected token \"*\"");
    testParseFailure("({a = 0});", "Illegal property initializer");
    testParseFailure("({a: 0, b = 0});", "Illegal property initializer");
    testParseFailure("({a: b = 0, c = 0});", "Illegal property initializer");
    testParseFailure("[{a = 0}];", "Illegal property initializer");
    testParseFailure("[+{a = 0}];", "Illegal property initializer");
    testParseFailure("function* f() { [yield {a = 0}]; }", "Illegal property initializer");
    testParseFailure("function* f() { [yield* {a = 0}]; }", "Illegal property initializer");
    testParseFailure("1 / %", "Unexpected token \"%\"");
    testParseFailure("\\u{}", "Unexpected \"}\"");
    testParseFailure("\"\\u{}\"", "Unexpected \"}\"");
    testParseFailure("(\"\\u{}\")", "Unexpected \"}\"");
    testParseFailure("\"use strict\"; function f(){(\"\\1\");}", "Unexpected legacy octal escape sequence: \\1");
    testParseFailure("\"use strict\"; function f(){01;}", "Unexpected legacy octal integer literal");
  });
});
