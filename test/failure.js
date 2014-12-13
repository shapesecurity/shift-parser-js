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

var expect = require('expect.js');
var ShiftParser = require('../');

describe("Parser", function () {
var parse = ShiftParser.default;

  describe("error handling", function () {
    function testFailure(source, message) {
      it(source, function () {
        try {
          parse(source);
        } catch (e) {
          expect(e.description).be(message);
          return;
        }
        throw new Error("Expecting error");
      })
    }

    testFailure("/*", "Unexpected token ILLEGAL");
    testFailure("/*\r", "Unexpected token ILLEGAL");
    testFailure("/*\r\n", "Unexpected token ILLEGAL");
    testFailure("/*\u2028", "Unexpected token ILLEGAL");
    testFailure("/*\u2029", "Unexpected token ILLEGAL");
    testFailure("/**", "Unexpected token ILLEGAL");
    testFailure("\\", "Unexpected token ILLEGAL");
    testFailure("\\u", "Unexpected token ILLEGAL");
    testFailure("\\x", "Unexpected token ILLEGAL");
    testFailure("\\o", "Unexpected token ILLEGAL");
    testFailure("\\u1", "Unexpected token ILLEGAL");
    testFailure("\\u12", "Unexpected token ILLEGAL");
    testFailure("\\u113", "Unexpected token ILLEGAL");
    testFailure("a\\uz   ", "Unexpected token ILLEGAL");
    testFailure("a\\u1z  ", "Unexpected token ILLEGAL");
    testFailure("a\\u11z ", "Unexpected token ILLEGAL");
    testFailure("a\\u111z", "Unexpected token ILLEGAL");
    testFailure("a\\", "Unexpected token ILLEGAL");
    testFailure("a\\u", "Unexpected token ILLEGAL");
    testFailure("a\\x", "Unexpected token ILLEGAL");
    testFailure("a\\o", "Unexpected token ILLEGAL");
    testFailure("a\\u1", "Unexpected token ILLEGAL");
    testFailure("a\\u12", "Unexpected token ILLEGAL");
    testFailure("a\\u113", "Unexpected token ILLEGAL");
    testFailure("'\\03", "Unexpected token ILLEGAL");
    testFailure("'\\x", "Unexpected token ILLEGAL");
    testFailure("'\\x1", "Unexpected token ILLEGAL");
    testFailure("'\\x1   ", "Unexpected token ILLEGAL");
    testFailure("'\\x12  ", "Unexpected token ILLEGAL");
    testFailure("'\n", "Unexpected token ILLEGAL");
    testFailure("'\\", "Unexpected token ILLEGAL");
    testFailure("＊", "Unexpected token ILLEGAL");
    testFailure("1.a", "Unexpected token ILLEGAL");
    testFailure("1.e", "Unexpected token ILLEGAL");
    testFailure("1.e+", "Unexpected token ILLEGAL");
    testFailure("1.e+z", "Unexpected token ILLEGAL");
    testFailure("/\\\n42", "Invalid regular expression: missing /");
    testFailure("0x", "Unexpected token ILLEGAL");
    testFailure("0xz", "Unexpected token ILLEGAL");
    testFailure("0x1z", "Unexpected token ILLEGAL");
    testFailure("0a", "Unexpected token ILLEGAL");
    testFailure("08a", "Unexpected token ILLEGAL");
    testFailure("\u0008", "Unexpected token ILLEGAL");

    testFailure("{", "Unexpected end of input");
    testFailure("}", "Unexpected token }");
    testFailure("3ea", "Unexpected token ILLEGAL");
    testFailure("3in []", "Unexpected token ILLEGAL");
    testFailure("3e", "Unexpected token ILLEGAL");
    testFailure("3e+", "Unexpected token ILLEGAL");
    testFailure("3e-", "Unexpected token ILLEGAL");
    testFailure("3x", "Unexpected token ILLEGAL");
    testFailure("3x0", "Unexpected token ILLEGAL");
    testFailure("0x", "Unexpected token ILLEGAL");
    testFailure("09", "Unexpected token ILLEGAL");
    testFailure("018", "Unexpected token ILLEGAL");
    testFailure("01a", "Unexpected token ILLEGAL");
    testFailure("3in[]", "Unexpected token ILLEGAL");
    testFailure("0x3in[]", "Unexpected token ILLEGAL");
    testFailure("\"Hello\nWorld\"", "Unexpected token ILLEGAL");
    testFailure("x\\", "Unexpected token ILLEGAL");
    testFailure("x\\u005c", "Unexpected token ILLEGAL");
    testFailure("x\\u002a", "Unexpected token ILLEGAL");
    testFailure("var x = /(s/g", "Invalid regular expression");
    testFailure("a\\u", "Unexpected token ILLEGAL");
    testFailure("\\ua", "Unexpected token ILLEGAL");
    testFailure("/", "Invalid regular expression: missing /");
    testFailure("/test", "Invalid regular expression: missing /");
    testFailure("/test\n/", "Invalid regular expression: missing /");
    testFailure("var x = /[a-z]/\\ux", "Invalid regular expression");
    testFailure("var x = /[a-z\n]/\\ux", "Invalid regular expression: missing /");
    testFailure("var x = /[a-z]/\\\\ux", "Invalid regular expression");
    testFailure("var x = /[P QR]/\\\\u0067", "Invalid regular expression");

    // testFailure("3 = 4", "Invalid left-hand side in assignment");
    // testFailure("func() = 4", "Invalid left-hand side in assignment");
    // testFailure("(1 + 1) = 10", "Invalid left-hand side in assignment");

    // testFailure("1++", "Invalid left-hand side in assignment");
    // testFailure("1--", "Invalid left-hand side in assignment");
    // testFailure("++1", "Invalid left-hand side in assignment");
    // testFailure("--1", "Invalid left-hand side in assignment");
    testFailure("--(1+1)", "Invalid left-hand side in assignment");
    testFailure("(1+1)--", "Invalid left-hand side in assignment");

    testFailure("for((1 + 1) in list) process(x);", "Invalid left-hand side in for-in");
    testFailure("[", "Unexpected end of input");
    testFailure("[,", "Unexpected end of input");
    testFailure("1 + {", "Unexpected end of input");
    testFailure("1 + { t:t ", "Unexpected end of input");
    testFailure("1 + { t:t,", "Unexpected end of input");
    testFailure("var x = /\n/", "Invalid regular expression: missing /");
    testFailure("var x = \"\n", "Unexpected token ILLEGAL");
    testFailure("var if = 42", "Unexpected token if");
    testFailure("i #= 42", "Unexpected token ILLEGAL");

    // testFailure("i + 2 = 42", "Invalid left-hand side in assignment");
    // testFailure("+i = 42", "Invalid left-hand side in assignment");

    testFailure("1 + (", "Unexpected end of input");
    testFailure("\n\n\n{", "Unexpected end of input");
    testFailure("\n/* Some multiline\ncomment */\n)", "Unexpected token )");
    testFailure("{ set 1 }", "Unexpected number");
    testFailure("{ get 2 }", "Unexpected number");
    testFailure("({ set: s(if) { } })", "Unexpected token if");
    testFailure("({ set s(.) { } })", "Unexpected token .");
    testFailure("({ set s() { } })", "Unexpected token )");
    testFailure("({ set: s() { } })", "Unexpected token {");
    testFailure("({ set: s(a, b) { } })", "Unexpected token {");
    testFailure("({ get: g(d) { } })", "Unexpected token {");
    testFailure("({ get i() { }, i: 42 })",
        "Object literal may not have data and accessor property with the same name");
    testFailure("({ i: 42, get i() { } })",
        "Object literal may not have data and accessor property with the same name");
    testFailure("({ set i(x) { }, i: 42 })",
        "Object literal may not have data and accessor property with the same name");
    testFailure("({ i: 42, set i(x) { } })",
        "Object literal may not have data and accessor property with the same name");
    testFailure("({ get i() { }, get i() { } })",
        "Object literal may not have multiple get/set accessors with the same name");
    testFailure("({ set i(x) { }, set i(x) { } })",
        "Object literal may not have multiple get/set accessors with the same name");
    // TODO: ES6:
    // testFailure("((a)) => 42", "Unexpected token =>");
    // testFailure("(a, (b)) => 42", "Unexpected token =>");
    // testFailure("\"use strict\"; (eval = 10) => 42", "Assignment to eval or arguments is not allowed in strict mode");
    // strict mode, using eval when IsSimpleParameterList is true
    // testFailure("\"use strict\"; eval => 42", "Parameter name eval or arguments is not allowed in strict mode");
    // strict mode, using arguments when IsSimpleParameterList is true
    // testFailure("\"use strict\"; arguments => 42", "Parameter name eval or arguments is not allowed in strict mode");
    // strict mode, using eval when IsSimpleParameterList is true
    // testFailure("\"use strict\"; (eval, a) => 42", "Parameter name eval or arguments is not allowed in strict mode");
    // strict mode, using arguments when IsSimpleParameterList is true
    // testFailure("\"use strict\"; (arguments, a) => 42", "Parameter name eval or arguments is not allowed in strict mode");
    // testFailure("(a, a) => 42", "Strict mode function may not have duplicate parameter names");
    // testFailure("\"use strict\"; (a, a) => 42", "Strict mode function may not have duplicate parameter names");
    // testFailure("\"use strict\"; (a) => 00", "Octal literals are not allowed in strict mode.");
    // testFailure("() <= 42", "Unexpected token <=");
    // testFailure("() ? 42", "Unexpected token ?");
    // testFailure("() + 42", "Unexpected token +");
    // testFailure("(10) => 00", "Unexpected token =>");
    // testFailure("(10, 20) => 00", "Unexpected token =>");
    // testFailure("\"use strict\"; (eval) => 42", "Parameter name eval or arguments is not allowed in strict mode");
    // testFailure("(eval) => { \"use strict\"; 42 }", "Parameter name eval or arguments is not allowed in strict mode");
    testFailure("function t(if) { }", "Unexpected token if");
    testFailure("function t(true) { }", "Unexpected token true");
    testFailure("function t(false) { }", "Unexpected token false");
    testFailure("function t(null) { }", "Unexpected token null");
    testFailure("function null() { }", "Unexpected token null");
    testFailure("function true() { }", "Unexpected token true");
    testFailure("function false() { }", "Unexpected token false");
    testFailure("function if() { }", "Unexpected token if");
    testFailure("a b;", "Unexpected identifier");
    testFailure("if.a;", "Unexpected token .");
    testFailure("a if;", "Unexpected token if");
    testFailure("a class;", "Unexpected reserved word");
    testFailure("break\n", "Illegal break statement");
    testFailure("break 1;", "Unexpected number");
    testFailure("continue\n", "Illegal continue statement");
    testFailure("continue 2;", "Unexpected number");
    testFailure("throw", "Unexpected end of input");
    testFailure("throw;", "Unexpected token ;");
    testFailure("throw\n", "Illegal newline after throw");
    testFailure("for (var i, i2 in {});", "Unexpected token in");
    testFailure("for ((i in {}));", "Unexpected token )");
    testFailure("for (i + 1 in {});", "Invalid left-hand side in for-in");
    testFailure("for (+i in {});", "Invalid left-hand side in for-in");
    testFailure("if(false)", "Unexpected end of input");
    testFailure("if(false) doThis(); else", "Unexpected end of input");
    testFailure("do", "Unexpected end of input");
    testFailure("while(false)", "Unexpected end of input");
    testFailure("for(;;)", "Unexpected end of input");
    testFailure("with(x)", "Unexpected end of input");
    testFailure("try { }", "Missing catch or finally after try");
    testFailure("try {} catch (42) {} ", "Unexpected number");
    testFailure("try {} catch (answer()) {} ", "Unexpected token (");
    testFailure("try {} catch (-x) {} ", "Unexpected token -");
    testFailure("\u203F = 10", "Unexpected token ILLEGAL");
    testFailure("const x = 12, y;", "Unexpected token ;");
    testFailure("const x, y = 12;", "Unexpected token ,");
    testFailure("const x;", "Unexpected token ;");
    // TODO : testFailure("if(true) let a = 1;", "Unexpected token let");
    // TODO : testFailure("if(true) const a = 1;", "Unexpected token const");
    testFailure("switch (c) { default: default: }", "More than one default clause in switch statement");
    testFailure("new X().\"s\"", "Unexpected string");
    testFailure("/*", "Unexpected token ILLEGAL");
    testFailure("/*\n\n\n", "Unexpected token ILLEGAL");
    testFailure("/**", "Unexpected token ILLEGAL");
    testFailure("/*\n\n*", "Unexpected token ILLEGAL");
    testFailure("/*hello", "Unexpected token ILLEGAL");
    testFailure("/*hello  *", "Unexpected token ILLEGAL");
    testFailure("\n]", "Unexpected token ]");
    testFailure("\r]", "Unexpected token ]");
    testFailure("\r\n]", "Unexpected token ]");
    testFailure("\n\r]", "Unexpected token ]");
    testFailure("//\r\n]", "Unexpected token ]");
    testFailure("//\n\r]", "Unexpected token ]");
    testFailure("/a\\\n/", "Invalid regular expression: missing /");
    testFailure("//\r \n]", "Unexpected token ]");
    testFailure("/*\r\n*/]", "Unexpected token ]");
    testFailure("/*\n\r*/]", "Unexpected token ]");
    testFailure("/*\r \n*/]", "Unexpected token ]");
    testFailure("\\\\", "Unexpected token ILLEGAL");
    testFailure("\\u005c", "Unexpected token ILLEGAL");
    testFailure("\\x", "Unexpected token ILLEGAL");
    testFailure("\\u0000", "Unexpected token ILLEGAL");
    testFailure("\u200C = []", "Unexpected token ILLEGAL");
    testFailure("\u200D = []", "Unexpected token ILLEGAL");
    testFailure("\"\\", "Unexpected token ILLEGAL");
    testFailure("\"\\u", "Unexpected token ILLEGAL");
    testFailure("try { } catch() {}", "Unexpected token )");
    testFailure("return", "Illegal return statement");
    testFailure("break", "Illegal break statement");
    testFailure("continue", "Illegal continue statement");
    testFailure("switch (x) { default: continue; }", "Illegal continue statement");
    testFailure("do { x } *", "Unexpected token *");
    testFailure("while (true) { break x; }", "Undefined label \'x\'");
    testFailure("while (true) { continue x; }", "Undefined label \'x\'");
    testFailure("x: while (true) { (function () { break x; }); }", "Undefined label \'x\'");
    testFailure("x: while (true) { (function () { continue x; }); }", "Undefined label \'x\'");
    testFailure("x: while (true) { (function () { break; }); }", "Illegal break statement");
    testFailure("x: while (true) { (function () { continue; }); }", "Illegal continue statement");
    testFailure("x: while (true) { x: while (true) { } }", "Label \'x\' has already been declared");
    testFailure("(function () { \'use strict\'; delete i; }())", "Delete of an unqualified identifier in strict mode.");
    testFailure("(function () { \'use strict\'; with (i); }())", "Strict mode code may not include a with statement");
    testFailure("function hello() {\'use strict\'; ({ i: 42, i: 42 }) }",
        "Duplicate data property in object literal not allowed in strict mode");
    testFailure("function hello() {\'use strict\'; ({ hasOwnProperty: 42, hasOwnProperty: 42 }) }",
        "Duplicate data property in object literal not allowed in strict mode");
    testFailure("function hello() {\'use strict\'; var eval = 10; }",
        "Variable name may not be eval or arguments in strict mode");
    testFailure("function hello() {\'use strict\'; var arguments = 10; }",
        "Variable name may not be eval or arguments in strict mode");
    testFailure("function hello() {\'use strict\'; try { } catch (eval) { } }",
        "Catch variable may not be eval or arguments in strict mode");
    testFailure("function hello() {\'use strict\'; try { } catch (arguments) { } }",
        "Catch variable may not be eval or arguments in strict mode");
    testFailure("function hello() {\'use strict\'; eval = 10; }",
        "Assignment to eval or arguments is not allowed in strict mode");
    testFailure("function hello() {\'use strict\'; arguments = 10; }",
        "Assignment to eval or arguments is not allowed in strict mode");
    testFailure("function hello() {\'use strict\'; ++eval; }",
        "Prefix increment/decrement may not have eval or arguments operand in strict mode");
    testFailure("function hello() {\'use strict\'; --eval; }",
        "Prefix increment/decrement may not have eval or arguments operand in strict mode");
    testFailure("function hello() {\'use strict\'; ++arguments; }",
        "Prefix increment/decrement may not have eval or arguments operand in strict mode");
    testFailure("function hello() {\'use strict\'; --arguments; }",
        "Prefix increment/decrement may not have eval or arguments operand in strict mode");
    testFailure("function hello() {\'use strict\'; eval++; }",
        "Postfix increment/decrement may not have eval or arguments operand in strict mode");
    testFailure("function hello() {\'use strict\'; eval--; }",
        "Postfix increment/decrement may not have eval or arguments operand in strict mode");
    testFailure("function hello() {\'use strict\'; arguments++; }",
        "Postfix increment/decrement may not have eval or arguments operand in strict mode");
    testFailure("function hello() {\'use strict\'; arguments--; }",
        "Postfix increment/decrement may not have eval or arguments operand in strict mode");
    testFailure("function hello() {\'use strict\'; function eval() { } }",
        "Function name may not be eval or arguments in strict mode");
    testFailure("function hello() {\'use strict\'; function arguments() { } }",
        "Function name may not be eval or arguments in strict mode");
    testFailure("function eval() {\'use strict\'; }", "Function name may not be eval or arguments in strict mode");
    testFailure("function arguments() {\'use strict\'; }", "Function name may not be eval or arguments in strict mode");
    testFailure("function hello() {\'use strict\'; (function eval() { }()) }",
        "Function name may not be eval or arguments in strict mode");
    testFailure("function hello() {\'use strict\'; (function arguments() { }()) }",
        "Function name may not be eval or arguments in strict mode");
    testFailure("(function eval() {\'use strict\'; })()", "Function name may not be eval or arguments in strict mode");
    testFailure("(function arguments() {\'use strict\'; })()",
        "Function name may not be eval or arguments in strict mode");
    testFailure("function hello() {\'use strict\'; ({ s: function eval() { } }); }",
        "Function name may not be eval or arguments in strict mode");
    testFailure("(function package() {\'use strict\'; })()", "Use of future reserved word in strict mode");
    testFailure("function hello() {\'use strict\'; ({ i: 10, set s(eval) { } }); }",
        "Parameter name eval or arguments is not allowed in strict mode");
    testFailure("function hello() {\'use strict\'; ({ set s(eval) { } }); }",
        "Parameter name eval or arguments is not allowed in strict mode");
    testFailure("function hello() {\'use strict\'; ({ s: function s(eval) { } }); }",
        "Parameter name eval or arguments is not allowed in strict mode");
    testFailure("function hello(eval) {\'use strict\';}",
        "Parameter name eval or arguments is not allowed in strict mode");
    testFailure("function hello(arguments) {\'use strict\';}",
        "Parameter name eval or arguments is not allowed in strict mode");
    testFailure("function hello() { \'use strict\'; function inner(eval) {} }",
        "Parameter name eval or arguments is not allowed in strict mode");
    testFailure("function hello() { \'use strict\'; function inner(arguments) {} }",
        "Parameter name eval or arguments is not allowed in strict mode");
    testFailure(" \"\\1\"; \'use strict\';", "Octal literals are not allowed in strict mode.");
    testFailure("function hello() { \'use strict\'; \"\\1\"; }", "Octal literals are not allowed in strict mode.");
    testFailure("function hello() { \'use strict\'; 021; }", "Octal literals are not allowed in strict mode.");
    testFailure("function hello() { \'use strict\'; ({ \"\\1\": 42 }); }",
        "Octal literals are not allowed in strict mode.");
    testFailure("function hello() { \'use strict\'; ({ 021: 42 }); }",
        "Octal literals are not allowed in strict mode.");
    testFailure("function hello() { \"octal directive\\1\"; \"use strict\"; }",
        "Octal literals are not allowed in strict mode.");
    testFailure("function hello() { \"octal directive\\1\"; \"octal directive\\2\"; \"use strict\"; }",
        "Octal literals are not allowed in strict mode.");
    testFailure("function hello() { \"use strict\"; function inner() { \"octal directive\\1\"; } }",
        "Octal literals are not allowed in strict mode.");
    testFailure("function hello() { \"use strict\"; var implements; }", "Use of future reserved word in strict mode");
    testFailure("function hello() { \"use strict\"; var interface; }", "Use of future reserved word in strict mode");
    testFailure("function hello() { \"use strict\"; var package; }", "Use of future reserved word in strict mode");
    testFailure("function hello() { \"use strict\"; var private; }", "Use of future reserved word in strict mode");
    testFailure("function hello() { \"use strict\"; var protected; }", "Use of future reserved word in strict mode");
    testFailure("function hello() { \"use strict\"; var public; }", "Use of future reserved word in strict mode");
    testFailure("function hello() { \"use strict\"; var static; }", "Use of future reserved word in strict mode");
    testFailure("function hello() { \"use strict\"; var yield; }", "Use of future reserved word in strict mode");
    testFailure("function hello() { \"use strict\"; var let; }", "Use of future reserved word in strict mode");
    testFailure("function hello(static) { \"use strict\"; }", "Use of future reserved word in strict mode");
    testFailure("function static() { \"use strict\"; }", "Use of future reserved word in strict mode");
    testFailure("function eval(a) { \"use strict\"; }", "Function name may not be eval or arguments in strict mode");
    testFailure("function arguments(a) { \"use strict\"; }",
        "Function name may not be eval or arguments in strict mode");
    testFailure("var yield", "Unexpected token yield");
    testFailure("var let", "Unexpected token let");
    testFailure("\"use strict\"; function static() { }", "Use of future reserved word in strict mode");
    testFailure("function a(t, t) { \"use strict\"; }", "Strict mode function may not have duplicate parameter names");
    testFailure("function a(eval) { \"use strict\"; }",
        "Parameter name eval or arguments is not allowed in strict mode");
    testFailure("function a(package) { \"use strict\"; }", "Use of future reserved word in strict mode");
    testFailure("function a() { \"use strict\"; function b(t, t) { }; }",
        "Strict mode function may not have duplicate parameter names");
    testFailure("(function a(t, t) { \"use strict\"; })",
        "Strict mode function may not have duplicate parameter names");
    testFailure("function a() { \"use strict\"; (function b(t, t) { }); }",
        "Strict mode function may not have duplicate parameter names");
    testFailure("(function a(eval) { \"use strict\"; })",
        "Parameter name eval or arguments is not allowed in strict mode");
    testFailure("(function a(package) { \"use strict\"; })", "Use of future reserved word in strict mode");
    testFailure("__proto__: __proto__: 42;", "Label \'__proto__\' has already been declared");
    testFailure("\"use strict\"; function t(__proto__, __proto__) { }",
        "Strict mode function may not have duplicate parameter names");
    testFailure("\"use strict\"; x = { __proto__: 42, __proto__: 43 }",
        "Duplicate data property in object literal not allowed in strict mode");
    testFailure("\"use strict\"; x = { get __proto__() { }, __proto__: 43 }",
        "Object literal may not have data and accessor property with the same name");
    testFailure("var", "Unexpected end of input");
    testFailure("let", "Unexpected end of input");
    testFailure("const", "Unexpected end of input");
    testFailure("{ ;  ;  ", "Unexpected end of input");
    testFailure("({get +:3})", "Property name in object literal must be identifier, string literal or number literal");
    testFailure("({get +:3})", "Property name in object literal must be identifier, string literal or number literal");
    testFailure("function t() { ;  ;  ", "Unexpected end of input");
  });
});
