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
    testParseFailure("\\uD800\\", "Unexpected end of input");
    testParseFailure("\\uD800\\u", "Unexpected end of input");
    testParseFailure("\\uD800\\x62", "Unexpected \"x\"");
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
    testParseFailure("var x = /(s/g", "Invalid regular expression");
    testParseFailure("a\\u", "Unexpected end of input");
    testParseFailure("\\ua", "Unexpected \"a\"");
    testParseFailure("/", "Invalid regular expression: missing /");
    testParseFailure("/test", "Invalid regular expression: missing /");
    testParseFailure("/test\n/", "Invalid regular expression: missing /");
    testParseFailure("var x = /[a-z]/\\ux", "Invalid regular expression");
    testParseFailure("var x = /[a-z\n]/\\ux", "Invalid regular expression: missing /");
    testParseFailure("var x = /[a-z]/\\\\ux", "Invalid regular expression");
    testParseFailure("var x = /[P QR]/\\\\u0067", "Invalid regular expression");
    testParseFailure("3 = 4", "Invalid left-hand side in assignment");
    testParseFailure("func() = 4", "Invalid left-hand side in assignment");
    testParseFailure("(1 + 1) = 10", "Invalid left-hand side in assignment");
    testParseFailure("1++", "Invalid left-hand side in assignment");
    testParseFailure("1--", "Invalid left-hand side in assignment");
    testParseFailure("++1", "Invalid left-hand side in assignment");
    testParseFailure("--1", "Invalid left-hand side in assignment");
    testParseFailure("--(1+1)", "Invalid left-hand side in assignment");
    testParseFailure("(1+1)--", "Invalid left-hand side in assignment");
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
    testParseFailure("break\n", "Illegal break statement");
    testParseFailure("break 1;", "Unexpected number");
    testParseFailure("continue\n", "Illegal continue statement");
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
    testParseFailure("const x = 12, y;", "Unexpected token \";\"");
    testParseFailure("const x, y = 12;", "Unexpected token \",\"");
    testParseFailure("const x;", "Unexpected token \";\"");
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
    testParseFailure("return", "Illegal return statement");
    testParseFailure("break", "Illegal break statement");
    testParseFailure("continue", "Illegal continue statement");
    testParseFailure("switch (x) { default: continue; }", "Illegal continue statement");
    testParseFailure("do { x } *", "Unexpected token \"*\"");
    testParseFailure("while (true) { break x; }", "Undefined label \"x\"");
    testParseFailure("while (true) { continue x; }", "Undefined label \"x\"");
    testParseFailure("x: while (true) { (function () { break x; }); }", "Undefined label \"x\"");
    testParseFailure("x: while (true) { (function () { continue x; }); }", "Undefined label \"x\"");
    testParseFailure("x: while (true) { (function () { break; }); }", "Illegal break statement");
    testParseFailure("x: while (true) { (function () { continue; }); }", "Illegal continue statement");
    testParseFailure("x: while (true) { x: while (true) { } }", "Label \"x\" has already been declared");
    testParseFailure("(function () { \'use strict\'; delete i; }())", "Delete of an unqualified identifier in strict mode.");
    testParseFailure("(function () { \'use strict\'; with (i); }())", "Strict mode code may not include a with statement");
    testParseFailure("function hello() {\'use strict\'; var eval = 10; }",
        "Variable name may not be eval or arguments in strict mode");
    testParseFailure("function hello() {\'use strict\'; var arguments = 10; }",
        "Variable name may not be eval or arguments in strict mode");
    testParseFailure("function hello() {\'use strict\'; try { } catch (eval) { } }",
        "Catch variable may not be eval or arguments in strict mode");
    testParseFailure("function hello() {\'use strict\'; try { } catch (arguments) { } }",
        "Catch variable may not be eval or arguments in strict mode");
    testParseFailure("function hello() {\'use strict\'; eval = 10; }",
        "Assignment to eval or arguments is not allowed in strict mode");
    testParseFailure("function hello() {\'use strict\'; arguments = 10; }",
        "Assignment to eval or arguments is not allowed in strict mode");
    testParseFailure("function hello() {\'use strict\'; ++eval; }",
        "Prefix increment/decrement may not have eval or arguments operand in strict mode");
    testParseFailure("function hello() {\'use strict\'; --eval; }",
        "Prefix increment/decrement may not have eval or arguments operand in strict mode");
    testParseFailure("function hello() {\'use strict\'; ++arguments; }",
        "Prefix increment/decrement may not have eval or arguments operand in strict mode");
    testParseFailure("function hello() {\'use strict\'; --arguments; }",
        "Prefix increment/decrement may not have eval or arguments operand in strict mode");
    testParseFailure("function hello() {\'use strict\'; eval++; }",
        "Postfix increment/decrement may not have eval or arguments operand in strict mode");
    testParseFailure("function hello() {\'use strict\'; eval--; }",
        "Postfix increment/decrement may not have eval or arguments operand in strict mode");
    testParseFailure("function hello() {\'use strict\'; arguments++; }",
        "Postfix increment/decrement may not have eval or arguments operand in strict mode");
    testParseFailure("function hello() {\'use strict\'; arguments--; }",
        "Postfix increment/decrement may not have eval or arguments operand in strict mode");
    testParseFailure("function hello() {\'use strict\'; function eval() { } }",
        "Function name may not be eval or arguments in strict mode");
    testParseFailure("function hello() {\'use strict\'; function arguments() { } }",
        "Function name may not be eval or arguments in strict mode");
    testParseFailure("function eval() {\'use strict\'; }", "Function name may not be eval or arguments in strict mode");
    testParseFailure("function arguments() {\'use strict\'; }", "Function name may not be eval or arguments in strict mode");
    testParseFailure("function hello() {\'use strict\'; (function eval() { }()) }",
        "Function name may not be eval or arguments in strict mode");
    testParseFailure("function hello() {\'use strict\'; (function arguments() { }()) }",
        "Function name may not be eval or arguments in strict mode");
    testParseFailure("(function eval() {\'use strict\'; })()", "Function name may not be eval or arguments in strict mode");
    testParseFailure("(function arguments() {\'use strict\'; })()",
        "Function name may not be eval or arguments in strict mode");
    testParseFailure("function hello() {\'use strict\'; ({ s: function eval() { } }); }",
        "Function name may not be eval or arguments in strict mode");
    testParseFailure("(function package() {\'use strict\'; })()", "Use of future reserved word in strict mode");
    testParseFailure("function hello() {\'use strict\'; ({ i: 10, set s(eval) { } }); }",
        "Parameter name eval or arguments is not allowed in strict mode");
    testParseFailure("function hello() {\'use strict\'; ({ set s(eval) { } }); }",
        "Parameter name eval or arguments is not allowed in strict mode");
    testParseFailure("function hello() {\'use strict\'; ({ s: function s(eval) { } }); }",
        "Parameter name eval or arguments is not allowed in strict mode");
    testParseFailure("function hello(eval) {\'use strict\';}",
        "Parameter name eval or arguments is not allowed in strict mode");
    testParseFailure("function hello(arguments) {\'use strict\';}",
        "Parameter name eval or arguments is not allowed in strict mode");
    testParseFailure("function hello() { \'use strict\'; function inner(eval) {} }",
        "Parameter name eval or arguments is not allowed in strict mode");
    testParseFailure("function hello() { \'use strict\'; function inner(arguments) {} }",
        "Parameter name eval or arguments is not allowed in strict mode");
    testParseFailure(" \"\\1\"; \'use strict\';", "Octal literals are not allowed in strict mode.");
    testParseFailure("function hello() { \'use strict\'; \"\\1\"; }", "Octal literals are not allowed in strict mode.");
    testParseFailure("function hello() { \'use strict\'; 021; }", "Octal literals are not allowed in strict mode.");
    testParseFailure("function hello() { \'use strict\'; ({ \"\\1\": 0 }); }",
        "Octal literals are not allowed in strict mode.");
    testParseFailure("function hello() { \'use strict\'; ({ 021: 0 }); }",
        "Octal literals are not allowed in strict mode.");
    testParseFailure("function hello() { \'use strict\'; ({ 08: 0 }); }",
      "Octal literals are not allowed in strict mode.");
    testParseFailure("function hello() { \"octal directive\\1\"; \"use strict\"; }",
        "Octal literals are not allowed in strict mode.");
    testParseFailure("function hello() { \"octal directive\\1\"; \"octal directive\\2\"; \"use strict\"; }",
        "Octal literals are not allowed in strict mode.");
    testParseFailure("function hello() { \"use strict\"; function inner() { \"octal directive\\1\"; } }",
        "Octal literals are not allowed in strict mode.");
    testParseFailure("function hello() { \"use strict\"; var implements; }", "Use of future reserved word in strict mode");
    testParseFailure("function hello() { \"use strict\"; var interface; }", "Use of future reserved word in strict mode");
    testParseFailure("function hello() { \"use strict\"; var package; }", "Use of future reserved word in strict mode");
    testParseFailure("function hello() { \"use strict\"; var private; }", "Use of future reserved word in strict mode");
    testParseFailure("function hello() { \"use strict\"; var protected; }", "Use of future reserved word in strict mode");
    testParseFailure("function hello() { \"use strict\"; var public; }", "Use of future reserved word in strict mode");
    testParseFailure("function hello() { \"use strict\"; var static; }", "Use of future reserved word in strict mode");
    testParseFailure("function hello() { \"use strict\"; var yield; }", "Unexpected token \"yield\"");
    testParseFailure("function hello() { \"use strict\"; var let; }", "Unexpected token \"let\"");
    testParseFailure("function hello(static) { \"use strict\"; }", "Use of future reserved word in strict mode");
    testParseFailure("function static() { \"use strict\"; }", "Use of future reserved word in strict mode");
    testParseFailure("function eval(a) { \"use strict\"; }", "Function name may not be eval or arguments in strict mode");
    testParseFailure("function arguments(a) { \"use strict\"; }",
        "Function name may not be eval or arguments in strict mode");
    testParseFailure("\"use strict\"; function static() { }", "Use of future reserved word in strict mode");
    testParseFailure("function a(t, t) { \"use strict\"; }", "Strict mode function may not have duplicate parameter names");
    testParseFailure("function a(eval) { \"use strict\"; }",
        "Parameter name eval or arguments is not allowed in strict mode");
    testParseFailure("function a(package) { \"use strict\"; }", "Use of future reserved word in strict mode");
    testParseFailure("function a() { \"use strict\"; function b(t, t) { }; }",
        "Strict mode function may not have duplicate parameter names");
    testParseFailure("(function a(t, t) { \"use strict\"; })",
        "Strict mode function may not have duplicate parameter names");
    testParseFailure("function a() { \"use strict\"; (function b(t, t) { }); }",
        "Strict mode function may not have duplicate parameter names");
    testParseFailure("(function a(eval) { \"use strict\"; })",
        "Parameter name eval or arguments is not allowed in strict mode");
    testParseFailure("(function a(package) { \"use strict\"; })", "Use of future reserved word in strict mode");
    testParseFailure("__proto__: __proto__: 0;", "Label \"__proto__\" has already been declared");
    testParseFailure("\"use strict\"; function t(__proto__, __proto__) { }",
        "Strict mode function may not have duplicate parameter names");
    testParseFailure("({__proto__:1,__proto__:2})", "Duplicate __proto__ property in object literal not allowed");
    testParseFailure("({\'__proto__\':1,__proto__:2})", "Duplicate __proto__ property in object literal not allowed");
    testParseFailure("{ \"use strict\"; ({__proto__:1,__proto__:2}) }", "Duplicate __proto__ property in object literal not allowed");
    testParseFailure("var", "Unexpected end of input");
    testParseFailure("const", "Unexpected end of input");
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

  });
});
