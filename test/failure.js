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

var assertParseFailure = require('./assertions').assertParseFailure;

describe("Parser", function () {

  describe("error handling", function () {
    assertParseFailure("/*", "Unexpected token ILLEGAL");
    assertParseFailure("/*\r", "Unexpected token ILLEGAL");
    assertParseFailure("/*\r\n", "Unexpected token ILLEGAL");
    assertParseFailure("/*\u2028", "Unexpected token ILLEGAL");
    assertParseFailure("/*\u2029", "Unexpected token ILLEGAL");
    assertParseFailure("/**", "Unexpected token ILLEGAL");
    assertParseFailure("\\", "Unexpected token ILLEGAL");
    assertParseFailure("\\u", "Unexpected token ILLEGAL");
    assertParseFailure("\\x", "Unexpected token ILLEGAL");
    assertParseFailure("\\o", "Unexpected token ILLEGAL");
    assertParseFailure("\\u1", "Unexpected token ILLEGAL");
    assertParseFailure("\\u12", "Unexpected token ILLEGAL");
    assertParseFailure("\\u113", "Unexpected token ILLEGAL");
    assertParseFailure("a\\uz   ", "Unexpected token ILLEGAL");
    assertParseFailure("a\\u1z  ", "Unexpected token ILLEGAL");
    assertParseFailure("a\\u11z ", "Unexpected token ILLEGAL");
    assertParseFailure("a\\u111z", "Unexpected token ILLEGAL");
    assertParseFailure("a\\", "Unexpected token ILLEGAL");
    assertParseFailure("a\\u", "Unexpected token ILLEGAL");
    assertParseFailure("a\\x", "Unexpected token ILLEGAL");
    assertParseFailure("a\\o", "Unexpected token ILLEGAL");
    assertParseFailure("a\\u1", "Unexpected token ILLEGAL");
    assertParseFailure("a\\u12", "Unexpected token ILLEGAL");
    assertParseFailure("a\\u113", "Unexpected token ILLEGAL");
    assertParseFailure("'\\03", "Unexpected token ILLEGAL");
    assertParseFailure("'\\x", "Unexpected token ILLEGAL");
    assertParseFailure("'\\x1", "Unexpected token ILLEGAL");
    assertParseFailure("'\\x1   ", "Unexpected token ILLEGAL");
    assertParseFailure("'\\x12  ", "Unexpected token ILLEGAL");
    assertParseFailure("'\n", "Unexpected token ILLEGAL");
    assertParseFailure("'\\", "Unexpected token ILLEGAL");
    assertParseFailure("＊", "Unexpected token ILLEGAL");
    assertParseFailure("1.a", "Unexpected token ILLEGAL");
    assertParseFailure("1.e", "Unexpected token ILLEGAL");
    assertParseFailure("1.e+", "Unexpected token ILLEGAL");
    assertParseFailure("1.e+z", "Unexpected token ILLEGAL");
    assertParseFailure("/\\\n42", "Invalid regular expression: missing /");
    assertParseFailure("0x", "Unexpected token ILLEGAL");
    assertParseFailure("0xz", "Unexpected token ILLEGAL");
    assertParseFailure("0x1z", "Unexpected token ILLEGAL");
    assertParseFailure("0a", "Unexpected token ILLEGAL");
    assertParseFailure("08a", "Unexpected token ILLEGAL");
    assertParseFailure("\u0008", "Unexpected token ILLEGAL");

    assertParseFailure("{", "Unexpected end of input");
    assertParseFailure("}", "Unexpected token }");
    assertParseFailure("3ea", "Unexpected token ILLEGAL");
    assertParseFailure("3in []", "Unexpected token ILLEGAL");
    assertParseFailure("3e", "Unexpected token ILLEGAL");
    assertParseFailure("3e+", "Unexpected token ILLEGAL");
    assertParseFailure("3e-", "Unexpected token ILLEGAL");
    assertParseFailure("3x", "Unexpected token ILLEGAL");
    assertParseFailure("3x0", "Unexpected token ILLEGAL");
    assertParseFailure("0x", "Unexpected token ILLEGAL");
    assertParseFailure("09", "Unexpected token ILLEGAL");
    assertParseFailure("018", "Unexpected token ILLEGAL");
    assertParseFailure("01a", "Unexpected token ILLEGAL");
    assertParseFailure("3in[]", "Unexpected token ILLEGAL");
    assertParseFailure("0x3in[]", "Unexpected token ILLEGAL");
    assertParseFailure("\"Hello\nWorld\"", "Unexpected token ILLEGAL");
    assertParseFailure("x\\", "Unexpected token ILLEGAL");
    assertParseFailure("x\\u005c", "Unexpected token ILLEGAL");
    assertParseFailure("x\\u002a", "Unexpected token ILLEGAL");
    assertParseFailure("var x = /(s/g", "Invalid regular expression");
    assertParseFailure("a\\u", "Unexpected token ILLEGAL");
    assertParseFailure("\\ua", "Unexpected token ILLEGAL");
    assertParseFailure("/", "Invalid regular expression: missing /");
    assertParseFailure("/test", "Invalid regular expression: missing /");
    assertParseFailure("/test\n/", "Invalid regular expression: missing /");
    assertParseFailure("var x = /[a-z]/\\ux", "Invalid regular expression");
    assertParseFailure("var x = /[a-z\n]/\\ux", "Invalid regular expression: missing /");
    assertParseFailure("var x = /[a-z]/\\\\ux", "Invalid regular expression");
    assertParseFailure("var x = /[P QR]/\\\\u0067", "Invalid regular expression");

    // assertParseFailure("3 = 4", "Invalid left-hand side in assignment");
    // assertParseFailure("func() = 4", "Invalid left-hand side in assignment");
    // assertParseFailure("(1 + 1) = 10", "Invalid left-hand side in assignment");

    // assertParseFailure("1++", "Invalid left-hand side in assignment");
    // assertParseFailure("1--", "Invalid left-hand side in assignment");
    // assertParseFailure("++1", "Invalid left-hand side in assignment");
    // assertParseFailure("--1", "Invalid left-hand side in assignment");
    assertParseFailure("--(1+1)", "Invalid left-hand side in assignment");
    assertParseFailure("(1+1)--", "Invalid left-hand side in assignment");

    assertParseFailure("for((1 + 1) in list) process(x);", "Invalid left-hand side in for-in");
    assertParseFailure("[", "Unexpected end of input");
    assertParseFailure("[,", "Unexpected end of input");
    assertParseFailure("1 + {", "Unexpected end of input");
    assertParseFailure("1 + { t:t ", "Unexpected end of input");
    assertParseFailure("1 + { t:t,", "Unexpected end of input");
    assertParseFailure("var x = /\n/", "Invalid regular expression: missing /");
    assertParseFailure("var x = \"\n", "Unexpected token ILLEGAL");
    assertParseFailure("var if = 42", "Unexpected token if");
    assertParseFailure("i #= 42", "Unexpected token ILLEGAL");
    assertParseFailure("1 + (", "Unexpected end of input");
    assertParseFailure("\n\n\n{", "Unexpected end of input");
    assertParseFailure("\n/* Some multiline\ncomment */\n)", "Unexpected token )");
    assertParseFailure("{ set 1 }", "Unexpected number");
    assertParseFailure("{ get 2 }", "Unexpected number");
    assertParseFailure("({ set: s(if) { } })", "Unexpected token if");
    assertParseFailure("({ set s(.) { } })", "Unexpected token .");
    assertParseFailure("({ set s() { } })", "Unexpected token )");
    assertParseFailure("({ set: s() { } })", "Unexpected token {");
    assertParseFailure("({ set: s(a, b) { } })", "Unexpected token {");
    assertParseFailure("({ get: g(d) { } })", "Unexpected token {");
    assertParseFailure("({ get i() { }, i: 42 })",
        "Object literal may not have data and accessor property with the same name");
    assertParseFailure("({ i: 42, get i() { } })",
        "Object literal may not have data and accessor property with the same name");
    assertParseFailure("({ set i(x) { }, i: 42 })",
        "Object literal may not have data and accessor property with the same name");
    assertParseFailure("({ i: 42, set i(x) { } })",
        "Object literal may not have data and accessor property with the same name");
    assertParseFailure("({ get i() { }, get i() { } })",
        "Object literal may not have multiple get/set accessors with the same name");
    assertParseFailure("({ set i(x) { }, set i(x) { } })",
        "Object literal may not have multiple get/set accessors with the same name");
    // TODO: ES6:
    // assertParseFailure("((a)) => 42", "Unexpected token =>");
    // assertParseFailure("(a, (b)) => 42", "Unexpected token =>");
    // assertParseFailure("\"use strict\"; (eval = 10) => 42", "Assignment to eval or arguments is not allowed in strict mode");
    // strict mode, using eval when IsSimpleParameterList is true
    // assertParseFailure("\"use strict\"; eval => 42", "Parameter name eval or arguments is not allowed in strict mode");
    // strict mode, using arguments when IsSimpleParameterList is true
    // assertParseFailure("\"use strict\"; arguments => 42", "Parameter name eval or arguments is not allowed in strict mode");
    // strict mode, using eval when IsSimpleParameterList is true
    // assertParseFailure("\"use strict\"; (eval, a) => 42", "Parameter name eval or arguments is not allowed in strict mode");
    // strict mode, using arguments when IsSimpleParameterList is true
    // assertParseFailure("\"use strict\"; (arguments, a) => 42", "Parameter name eval or arguments is not allowed in strict mode");
    // assertParseFailure("(a, a) => 42", "Strict mode function may not have duplicate parameter names");
    // assertParseFailure("\"use strict\"; (a, a) => 42", "Strict mode function may not have duplicate parameter names");
    // assertParseFailure("\"use strict\"; (a) => 00", "Octal literals are not allowed in strict mode.");
    // assertParseFailure("() <= 42", "Unexpected token <=");
    // assertParseFailure("() ? 42", "Unexpected token ?");
    // assertParseFailure("() + 42", "Unexpected token +");
    // assertParseFailure("(10) => 00", "Unexpected token =>");
    // assertParseFailure("(10, 20) => 00", "Unexpected token =>");
    // assertParseFailure("\"use strict\"; (eval) => 42", "Parameter name eval or arguments is not allowed in strict mode");
    // assertParseFailure("(eval) => { \"use strict\"; 42 }", "Parameter name eval or arguments is not allowed in strict mode");
    assertParseFailure("function t(if) { }", "Unexpected token if");
    assertParseFailure("function t(true) { }", "Unexpected token true");
    assertParseFailure("function t(false) { }", "Unexpected token false");
    assertParseFailure("function t(null) { }", "Unexpected token null");
    assertParseFailure("function null() { }", "Unexpected token null");
    assertParseFailure("function true() { }", "Unexpected token true");
    assertParseFailure("function false() { }", "Unexpected token false");
    assertParseFailure("function if() { }", "Unexpected token if");
    assertParseFailure("a b;", "Unexpected identifier");
    assertParseFailure("if.a;", "Unexpected token .");
    assertParseFailure("a if;", "Unexpected token if");
    assertParseFailure("a class;", "Unexpected reserved word");
    assertParseFailure("break\n", "Illegal break statement");
    assertParseFailure("break 1;", "Unexpected number");
    assertParseFailure("continue\n", "Illegal continue statement");
    assertParseFailure("continue 2;", "Unexpected number");
    assertParseFailure("throw", "Unexpected end of input");
    assertParseFailure("throw;", "Unexpected token ;");
    assertParseFailure("throw\n", "Illegal newline after throw");
    assertParseFailure("for (var i, i2 in {});", "Unexpected token in");
    assertParseFailure("for ((i in {}));", "Unexpected token )");
    assertParseFailure("for (i + 1 in {});", "Invalid left-hand side in for-in");
    assertParseFailure("for (+i in {});", "Invalid left-hand side in for-in");
    assertParseFailure("if(false)", "Unexpected end of input");
    assertParseFailure("if(false) doThis(); else", "Unexpected end of input");
    assertParseFailure("do", "Unexpected end of input");
    assertParseFailure("while(false)", "Unexpected end of input");
    assertParseFailure("for(;;)", "Unexpected end of input");
    assertParseFailure("with(x)", "Unexpected end of input");
    assertParseFailure("try { }", "Missing catch or finally after try");
    assertParseFailure("try {} catch (42) {} ", "Unexpected number");
    assertParseFailure("try {} catch (answer()) {} ", "Unexpected token (");
    assertParseFailure("try {} catch (-x) {} ", "Unexpected token -");
    assertParseFailure("\u203F = 10", "Unexpected token ILLEGAL");
    assertParseFailure("const x = 12, y;", "Unexpected token ;");
    assertParseFailure("const x, y = 12;", "Unexpected token ,");
    assertParseFailure("const x;", "Unexpected token ;");
    // TODO : assertParseFailure("if(true) let a = 1;", "Unexpected token let");
    // TODO : assertParseFailure("if(true) const a = 1;", "Unexpected token const");
    assertParseFailure("switch (c) { default: default: }", "More than one default clause in switch statement");
    assertParseFailure("new X().\"s\"", "Unexpected string");
    assertParseFailure("/*", "Unexpected token ILLEGAL");
    assertParseFailure("/*\n\n\n", "Unexpected token ILLEGAL");
    assertParseFailure("/**", "Unexpected token ILLEGAL");
    assertParseFailure("/*\n\n*", "Unexpected token ILLEGAL");
    assertParseFailure("/*hello", "Unexpected token ILLEGAL");
    assertParseFailure("/*hello  *", "Unexpected token ILLEGAL");
    assertParseFailure("\n]", "Unexpected token ]");
    assertParseFailure("\r]", "Unexpected token ]");
    assertParseFailure("\r\n]", "Unexpected token ]");
    assertParseFailure("\n\r]", "Unexpected token ]");
    assertParseFailure("//\r\n]", "Unexpected token ]");
    assertParseFailure("//\n\r]", "Unexpected token ]");
    assertParseFailure("/a\\\n/", "Invalid regular expression: missing /");
    assertParseFailure("//\r \n]", "Unexpected token ]");
    assertParseFailure("/*\r\n*/]", "Unexpected token ]");
    assertParseFailure("/*\n\r*/]", "Unexpected token ]");
    assertParseFailure("/*\r \n*/]", "Unexpected token ]");
    assertParseFailure("\\\\", "Unexpected token ILLEGAL");
    assertParseFailure("\\u005c", "Unexpected token ILLEGAL");
    assertParseFailure("\\x", "Unexpected token ILLEGAL");
    assertParseFailure("\\u0000", "Unexpected token ILLEGAL");
    assertParseFailure("\u200C = []", "Unexpected token ILLEGAL");
    assertParseFailure("\u200D = []", "Unexpected token ILLEGAL");
    assertParseFailure("\"\\", "Unexpected token ILLEGAL");
    assertParseFailure("\"\\u", "Unexpected token ILLEGAL");
    assertParseFailure("try { } catch() {}", "Unexpected token )");
    assertParseFailure("return", "Illegal return statement");
    assertParseFailure("break", "Illegal break statement");
    assertParseFailure("continue", "Illegal continue statement");
    assertParseFailure("switch (x) { default: continue; }", "Illegal continue statement");
    assertParseFailure("do { x } *", "Unexpected token *");
    assertParseFailure("while (true) { break x; }", "Undefined label \'x\'");
    assertParseFailure("while (true) { continue x; }", "Undefined label \'x\'");
    assertParseFailure("x: while (true) { (function () { break x; }); }", "Undefined label \'x\'");
    assertParseFailure("x: while (true) { (function () { continue x; }); }", "Undefined label \'x\'");
    assertParseFailure("x: while (true) { (function () { break; }); }", "Illegal break statement");
    assertParseFailure("x: while (true) { (function () { continue; }); }", "Illegal continue statement");
    assertParseFailure("x: while (true) { x: while (true) { } }", "Label \'x\' has already been declared");
    assertParseFailure("(function () { \'use strict\'; delete i; }())", "Delete of an unqualified identifier in strict mode.");
    assertParseFailure("(function () { \'use strict\'; with (i); }())", "Strict mode code may not include a with statement");
    assertParseFailure("function hello() {\'use strict\'; var eval = 10; }",
        "Variable name may not be eval or arguments in strict mode");
    assertParseFailure("function hello() {\'use strict\'; var arguments = 10; }",
        "Variable name may not be eval or arguments in strict mode");
    assertParseFailure("function hello() {\'use strict\'; try { } catch (eval) { } }",
        "Catch variable may not be eval or arguments in strict mode");
    assertParseFailure("function hello() {\'use strict\'; try { } catch (arguments) { } }",
        "Catch variable may not be eval or arguments in strict mode");
    assertParseFailure("function hello() {\'use strict\'; eval = 10; }",
        "Assignment to eval or arguments is not allowed in strict mode");
    assertParseFailure("function hello() {\'use strict\'; arguments = 10; }",
        "Assignment to eval or arguments is not allowed in strict mode");
    assertParseFailure("function hello() {\'use strict\'; ++eval; }",
        "Prefix increment/decrement may not have eval or arguments operand in strict mode");
    assertParseFailure("function hello() {\'use strict\'; --eval; }",
        "Prefix increment/decrement may not have eval or arguments operand in strict mode");
    assertParseFailure("function hello() {\'use strict\'; ++arguments; }",
        "Prefix increment/decrement may not have eval or arguments operand in strict mode");
    assertParseFailure("function hello() {\'use strict\'; --arguments; }",
        "Prefix increment/decrement may not have eval or arguments operand in strict mode");
    assertParseFailure("function hello() {\'use strict\'; eval++; }",
        "Postfix increment/decrement may not have eval or arguments operand in strict mode");
    assertParseFailure("function hello() {\'use strict\'; eval--; }",
        "Postfix increment/decrement may not have eval or arguments operand in strict mode");
    assertParseFailure("function hello() {\'use strict\'; arguments++; }",
        "Postfix increment/decrement may not have eval or arguments operand in strict mode");
    assertParseFailure("function hello() {\'use strict\'; arguments--; }",
        "Postfix increment/decrement may not have eval or arguments operand in strict mode");
    assertParseFailure("function hello() {\'use strict\'; function eval() { } }",
        "Function name may not be eval or arguments in strict mode");
    assertParseFailure("function hello() {\'use strict\'; function arguments() { } }",
        "Function name may not be eval or arguments in strict mode");
    assertParseFailure("function eval() {\'use strict\'; }", "Function name may not be eval or arguments in strict mode");
    assertParseFailure("function arguments() {\'use strict\'; }", "Function name may not be eval or arguments in strict mode");
    assertParseFailure("function hello() {\'use strict\'; (function eval() { }()) }",
        "Function name may not be eval or arguments in strict mode");
    assertParseFailure("function hello() {\'use strict\'; (function arguments() { }()) }",
        "Function name may not be eval or arguments in strict mode");
    assertParseFailure("(function eval() {\'use strict\'; })()", "Function name may not be eval or arguments in strict mode");
    assertParseFailure("(function arguments() {\'use strict\'; })()",
        "Function name may not be eval or arguments in strict mode");
    assertParseFailure("function hello() {\'use strict\'; ({ s: function eval() { } }); }",
        "Function name may not be eval or arguments in strict mode");
    assertParseFailure("(function package() {\'use strict\'; })()", "Use of future reserved word in strict mode");
    assertParseFailure("function hello() {\'use strict\'; ({ i: 10, set s(eval) { } }); }",
        "Parameter name eval or arguments is not allowed in strict mode");
    assertParseFailure("function hello() {\'use strict\'; ({ set s(eval) { } }); }",
        "Parameter name eval or arguments is not allowed in strict mode");
    assertParseFailure("function hello() {\'use strict\'; ({ s: function s(eval) { } }); }",
        "Parameter name eval or arguments is not allowed in strict mode");
    assertParseFailure("function hello(eval) {\'use strict\';}",
        "Parameter name eval or arguments is not allowed in strict mode");
    assertParseFailure("function hello(arguments) {\'use strict\';}",
        "Parameter name eval or arguments is not allowed in strict mode");
    assertParseFailure("function hello() { \'use strict\'; function inner(eval) {} }",
        "Parameter name eval or arguments is not allowed in strict mode");
    assertParseFailure("function hello() { \'use strict\'; function inner(arguments) {} }",
        "Parameter name eval or arguments is not allowed in strict mode");
    assertParseFailure(" \"\\1\"; \'use strict\';", "Octal literals are not allowed in strict mode.");
    assertParseFailure("function hello() { \'use strict\'; \"\\1\"; }", "Octal literals are not allowed in strict mode.");
    assertParseFailure("function hello() { \'use strict\'; 021; }", "Octal literals are not allowed in strict mode.");
    assertParseFailure("function hello() { \'use strict\'; ({ \"\\1\": 42 }); }",
        "Octal literals are not allowed in strict mode.");
    assertParseFailure("function hello() { \'use strict\'; ({ 021: 42 }); }",
        "Octal literals are not allowed in strict mode.");
    assertParseFailure("function hello() { \"octal directive\\1\"; \"use strict\"; }",
        "Octal literals are not allowed in strict mode.");
    assertParseFailure("function hello() { \"octal directive\\1\"; \"octal directive\\2\"; \"use strict\"; }",
        "Octal literals are not allowed in strict mode.");
    assertParseFailure("function hello() { \"use strict\"; function inner() { \"octal directive\\1\"; } }",
        "Octal literals are not allowed in strict mode.");
    assertParseFailure("function hello() { \"use strict\"; var implements; }", "Use of future reserved word in strict mode");
    assertParseFailure("function hello() { \"use strict\"; var interface; }", "Use of future reserved word in strict mode");
    assertParseFailure("function hello() { \"use strict\"; var package; }", "Use of future reserved word in strict mode");
    assertParseFailure("function hello() { \"use strict\"; var private; }", "Use of future reserved word in strict mode");
    assertParseFailure("function hello() { \"use strict\"; var protected; }", "Use of future reserved word in strict mode");
    assertParseFailure("function hello() { \"use strict\"; var public; }", "Use of future reserved word in strict mode");
    assertParseFailure("function hello() { \"use strict\"; var static; }", "Use of future reserved word in strict mode");
    assertParseFailure("function hello() { \"use strict\"; var yield; }", "Use of future reserved word in strict mode");
    assertParseFailure("function hello() { \"use strict\"; var let; }", "Use of future reserved word in strict mode");
    assertParseFailure("function hello(static) { \"use strict\"; }", "Use of future reserved word in strict mode");
    assertParseFailure("function static() { \"use strict\"; }", "Use of future reserved word in strict mode");
    assertParseFailure("function eval(a) { \"use strict\"; }", "Function name may not be eval or arguments in strict mode");
    assertParseFailure("function arguments(a) { \"use strict\"; }",
        "Function name may not be eval or arguments in strict mode");
    assertParseFailure("\"use strict\"; function static() { }", "Use of future reserved word in strict mode");
    assertParseFailure("function a(t, t) { \"use strict\"; }", "Strict mode function may not have duplicate parameter names");
    assertParseFailure("function a(eval) { \"use strict\"; }",
        "Parameter name eval or arguments is not allowed in strict mode");
    assertParseFailure("function a(package) { \"use strict\"; }", "Use of future reserved word in strict mode");
    assertParseFailure("function a() { \"use strict\"; function b(t, t) { }; }",
        "Strict mode function may not have duplicate parameter names");
    assertParseFailure("(function a(t, t) { \"use strict\"; })",
        "Strict mode function may not have duplicate parameter names");
    assertParseFailure("function a() { \"use strict\"; (function b(t, t) { }); }",
        "Strict mode function may not have duplicate parameter names");
    assertParseFailure("(function a(eval) { \"use strict\"; })",
        "Parameter name eval or arguments is not allowed in strict mode");
    assertParseFailure("(function a(package) { \"use strict\"; })", "Use of future reserved word in strict mode");
    assertParseFailure("__proto__: __proto__: 42;", "Label \'__proto__\' has already been declared");
    assertParseFailure("\"use strict\"; function t(__proto__, __proto__) { }",
        "Strict mode function may not have duplicate parameter names");
    assertParseFailure("({__proto__:1,__proto__:2})", "Duplicate __proto__ property in object literal not allowed");
    assertParseFailure("({\'__proto__\':1,__proto__:2})", "Duplicate __proto__ property in object literal not allowed");
    assertParseFailure("{ \"use strict\"; ({__proto__:1,__proto__:2}) }", "Duplicate __proto__ property in object literal not allowed");
    assertParseFailure("var", "Unexpected end of input");
    assertParseFailure("let", "Unexpected end of input");
    assertParseFailure("const", "Unexpected end of input");
    assertParseFailure("{ ;  ;  ", "Unexpected end of input");
    assertParseFailure("({get +:3})", "Property name in object literal must be identifier, string literal or number literal");
    assertParseFailure("({get +:3})", "Property name in object literal must be identifier, string literal or number literal");
    assertParseFailure("function t() { ;  ;  ", "Unexpected end of input");
  });
});
