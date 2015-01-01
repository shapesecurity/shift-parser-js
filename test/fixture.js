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

var assertEsprimaEquiv = require('./assertions').assertEsprimaEquiv;

describe("Parser", function () {
  describe("basic fixture", function () {
    // Unicode
    assertEsprimaEquiv("日本語 = []");
    assertEsprimaEquiv("T\u203F = []");
    assertEsprimaEquiv("T\u200C = []");
    assertEsprimaEquiv("T\u200D = []");
    assertEsprimaEquiv("\u2163\u2161 = []");
    assertEsprimaEquiv("\u2163\u2161\u200A=\u2009[]");

    // Comments
    assertEsprimaEquiv("/* block comment */ 42");
    assertEsprimaEquiv("42 /* block comment 1 */ /* block comment 2 */");
    assertEsprimaEquiv("(a + /* assignment */b ) * c");
    assertEsprimaEquiv("/* assignment */\n a = b");
    assertEsprimaEquiv("42 /*The*/ /*Answer*/");
    assertEsprimaEquiv("42 /*the*/ /*answer*/");
    assertEsprimaEquiv("42 /* the * answer */");
    assertEsprimaEquiv("42 /* The * answer */");
    assertEsprimaEquiv("/* multiline\ncomment\nshould\nbe\nignored */ 42");
    assertEsprimaEquiv("/*a\r\nb*/ 42");
    assertEsprimaEquiv("/*a\rb*/ 42");
    assertEsprimaEquiv("/*a\nb*/ 42");
    assertEsprimaEquiv("/*a\nc*/ 42");
    assertEsprimaEquiv("// line comment\n42");
    assertEsprimaEquiv("42 // line comment");
    assertEsprimaEquiv("// Hello, world!\n42");
    assertEsprimaEquiv("// Hello, world!\n");
    assertEsprimaEquiv("// Hallo, world!\n");
    assertEsprimaEquiv("//\n42");
    assertEsprimaEquiv("//");
    assertEsprimaEquiv("// ");
    assertEsprimaEquiv("/**/42");
    assertEsprimaEquiv("42/**/");
    assertEsprimaEquiv("// Hello, world!\n\n//   Another hello\n42");
    assertEsprimaEquiv("if (x) { doThat() // Some comment\n }");
    assertEsprimaEquiv("if (x) { // Some comment\ndoThat(); }");
    assertEsprimaEquiv("if (x) { /* Some comment */ doThat() }");
    assertEsprimaEquiv("if (x) { doThat() /* Some comment */ }");
    assertEsprimaEquiv("switch (answer) { case 42: /* perfect */ bingo() }");
    assertEsprimaEquiv("switch (answer) { case 42: bingo() /* perfect */ }");
    assertEsprimaEquiv("/* header */ (function(){ var version = 1; }).call(this)");
    assertEsprimaEquiv("(function(){ var version = 1; /* sync */ }).call(this)");
    assertEsprimaEquiv("function f() { /* infinite */ while (true) { } /* bar */ var each; }");
    assertEsprimaEquiv("<!-- foo");
    assertEsprimaEquiv("var x = 1<!--foo");
    assertEsprimaEquiv("--> comment");
    assertEsprimaEquiv("<!-- comment");
    assertEsprimaEquiv(" \t --> comment");
    assertEsprimaEquiv(" \t /* block comment */  --> comment");
    assertEsprimaEquiv("/* block comment */--> comment");
    assertEsprimaEquiv("/* not comment*/; i-->0");
    assertEsprimaEquiv("while (i-->0) {}");

    // Primary Expression
    assertEsprimaEquiv("this\n");
    assertEsprimaEquiv("null\n");
    assertEsprimaEquiv("\n    42\n\n");
    assertEsprimaEquiv("(1 + 2 ) * 3");

    // Grouping Operator
    assertEsprimaEquiv("(1) + (2  ) + 3");
    assertEsprimaEquiv("4 + 5 << (6)");

    // Array Initializer
    assertEsprimaEquiv("x = []");
    assertEsprimaEquiv("x = [ ]");
    assertEsprimaEquiv("x = [ 42 ]");
    assertEsprimaEquiv("x = [ 42, ]");
    assertEsprimaEquiv("x = [ ,, 42 ]");
    assertEsprimaEquiv("x = [ 1, 2, 3, ]");
    assertEsprimaEquiv("x = [ 1, 2,, 3, ]");

    // Object Initializer
    assertEsprimaEquiv("x = {}");
    assertEsprimaEquiv("x = { }");
    assertEsprimaEquiv("x = { answer: 42 }");
    assertEsprimaEquiv("x = { if: 42 }");
    assertEsprimaEquiv("x = { true: 42 }");
    assertEsprimaEquiv("x = { false: 42 }");
    assertEsprimaEquiv("x = { null: 42 }");
    assertEsprimaEquiv("x = { \"answer\": 42 }");
    assertEsprimaEquiv("x = { x: 1, x: 2 }");
    assertEsprimaEquiv("x = { get width() { return m_width } }");
    assertEsprimaEquiv("x = { get undef() {} }");
    assertEsprimaEquiv("x = { get if() {} }");
    assertEsprimaEquiv("x = { get true() {} }");
    assertEsprimaEquiv("x = { get false() {} }");
    assertEsprimaEquiv("x = { get null() {} }");
    assertEsprimaEquiv("x = { get \"undef\"() {} }");
    assertEsprimaEquiv("x = { get 10() {} }");
    assertEsprimaEquiv("x = { set width(w) { m_width = w } }");
    assertEsprimaEquiv("x = { set if(w) { m_if = w } }");
    assertEsprimaEquiv("x = { set true(w) { m_true = w } }");
    assertEsprimaEquiv("x = { set false(w) { m_false = w } }");
    assertEsprimaEquiv("x = { set null(w) { m_null = w } }");
    assertEsprimaEquiv("x = { set \"null\"(w) { m_null = w } }");
    assertEsprimaEquiv("x = { set 10(w) { m_null = w } }");
    assertEsprimaEquiv("x = { get: 42 }");
    assertEsprimaEquiv("x = { set: 43 }");
    assertEsprimaEquiv("x = { __proto__: 2 }");
    assertEsprimaEquiv("x = {\"__proto__\": 2 }");
    assertEsprimaEquiv("expression/object/28",
        "x = { get width() { return m_width }, set width(width) { m_width = width; } }");

    // Numeric Literals
    assertEsprimaEquiv("0");
    assertEsprimaEquiv("3");
    assertEsprimaEquiv("5");
    assertEsprimaEquiv("42");
    assertEsprimaEquiv(".14");
    assertEsprimaEquiv("3.14159");
    assertEsprimaEquiv("6.02214179e+23");
    assertEsprimaEquiv("1.492417830e-10");
    assertEsprimaEquiv("0x0");
    assertEsprimaEquiv("0x0;");
    assertEsprimaEquiv("0e+100 ");
    assertEsprimaEquiv("0e+100");
    assertEsprimaEquiv("0xabc");
    assertEsprimaEquiv("0xdef");
    assertEsprimaEquiv("0X1A");
    assertEsprimaEquiv("0x10");
    assertEsprimaEquiv("0x100");
    assertEsprimaEquiv("0X04");
    assertEsprimaEquiv("02");
    assertEsprimaEquiv("012");
    assertEsprimaEquiv("0012");

    // String Literals
    assertEsprimaEquiv("\"Hello\"");
    assertEsprimaEquiv("\"\\n\\r\\t\\v\\b\\f\\\\\\'\\\"\\0\"");
    assertEsprimaEquiv("\"\\u0061\"");
    assertEsprimaEquiv("\"\\x61\"");
    assertEsprimaEquiv("\"\\u00\"");
    assertEsprimaEquiv("\"\\xt\"");
    assertEsprimaEquiv("\"Hello\\nworld\"");
    assertEsprimaEquiv("\"Hello\\\nworld\"");
    assertEsprimaEquiv("\"Hello\\02World\"");
    assertEsprimaEquiv("\"Hello\\012World\"");
    assertEsprimaEquiv("\"Hello\\122World\"");
    assertEsprimaEquiv("\"Hello\\0122World\"");
    assertEsprimaEquiv("\"Hello\\312World\"");
    assertEsprimaEquiv("\"Hello\\412World\"");
    assertEsprimaEquiv("\"Hello\\812World\"");
    assertEsprimaEquiv("\"Hello\\712World\"");
    assertEsprimaEquiv("\"Hello\\0World\"");
    assertEsprimaEquiv("\"Hello\\\r\nworld\"");
    assertEsprimaEquiv("\"Hello\\1World\"");

    // Regular Expression Literals
    assertEsprimaEquiv("var x = /[a-z]/i");
    assertEsprimaEquiv("var x = /[x-z]/i");
    assertEsprimaEquiv("var x = /[a-c]/i");
    assertEsprimaEquiv("var x = /[P QR]/i");
    assertEsprimaEquiv("var x = /[\\]/]/");
    assertEsprimaEquiv("var x = /foo\\/bar/");
    assertEsprimaEquiv("var x = /=([^=\\s])+/g");
    // testParser("expression/regexp/07", "var x = /[P QR]/\\g");
    assertEsprimaEquiv("var x = /42/g.test");

    // Left-Hand-Side Expression
    assertEsprimaEquiv("new Button");
    assertEsprimaEquiv("new Button()");
    assertEsprimaEquiv("new new foo");
    assertEsprimaEquiv("new new foo()");
    assertEsprimaEquiv("new foo().bar()");
    assertEsprimaEquiv("new foo[bar]");
    assertEsprimaEquiv("new foo.bar()");
    assertEsprimaEquiv("( new foo).bar()");
    assertEsprimaEquiv("foo(bar, baz)");
    assertEsprimaEquiv("(    foo  )()");
    assertEsprimaEquiv("universe.milkyway");
    assertEsprimaEquiv("universe.milkyway.solarsystem");
    assertEsprimaEquiv("universe.milkyway.solarsystem.Earth");
    assertEsprimaEquiv("universe[galaxyName, otherUselessName]");
    assertEsprimaEquiv("universe[galaxyName]");
    assertEsprimaEquiv("universe[42].galaxies");
    assertEsprimaEquiv("universe(42).galaxies");
    assertEsprimaEquiv("universe(42).galaxies(14, 3, 77).milkyway");
    assertEsprimaEquiv("earth.asia.Indonesia.prepareForElection(2014)");
    assertEsprimaEquiv("universe.if");
    assertEsprimaEquiv("universe.true");
    assertEsprimaEquiv("universe.false");
    assertEsprimaEquiv("universe.null");

    // Postfix Expressions
    assertEsprimaEquiv("x++");
    assertEsprimaEquiv("x--");
    assertEsprimaEquiv("eval++");
    assertEsprimaEquiv("eval--");
    assertEsprimaEquiv("arguments++");
    assertEsprimaEquiv("arguments--");

    // Unary Operators
    assertEsprimaEquiv("++x");
    assertEsprimaEquiv("--x");
    assertEsprimaEquiv("++eval");
    assertEsprimaEquiv("--eval");
    assertEsprimaEquiv("++arguments");
    assertEsprimaEquiv("--arguments");
    assertEsprimaEquiv("+x");
    assertEsprimaEquiv("-x");
    assertEsprimaEquiv("~x");
    assertEsprimaEquiv("!x");
    assertEsprimaEquiv("void x");
    assertEsprimaEquiv("delete x");
    assertEsprimaEquiv("typeof x");

    // Multiplicative Operators
    assertEsprimaEquiv("x * y");
    assertEsprimaEquiv("x / y");
    assertEsprimaEquiv("x % y");

    // Additive Operators
    assertEsprimaEquiv("x + y");
    assertEsprimaEquiv("x - y");
    assertEsprimaEquiv("\"use strict\" + 42");

    // Bitwise Shift Operator
    assertEsprimaEquiv("x << y");
    assertEsprimaEquiv("x >> y");
    assertEsprimaEquiv("x >>> y");

    // Relational Operators
    assertEsprimaEquiv("x < y");
    assertEsprimaEquiv("x > y");
    assertEsprimaEquiv("x <= y");
    assertEsprimaEquiv("x >= y");
    assertEsprimaEquiv("x in y");
    assertEsprimaEquiv("x instanceof y");
    assertEsprimaEquiv("x < y < z");

    // Equality Operators
    assertEsprimaEquiv("x == y");
    assertEsprimaEquiv("x != y");
    assertEsprimaEquiv("x === y");
    assertEsprimaEquiv("x !== y");

    // Binary Bitwise Operators
    assertEsprimaEquiv("x & y");
    assertEsprimaEquiv("x ^ y");
    assertEsprimaEquiv("x | y");

    // Binary Expressions
    assertEsprimaEquiv("x + y + z");
    assertEsprimaEquiv("x - y + z");
    assertEsprimaEquiv("x + y - z");
    assertEsprimaEquiv("x - y - z");
    assertEsprimaEquiv("x + y * z");
    assertEsprimaEquiv("x + y / z");
    assertEsprimaEquiv("x - y % z");
    assertEsprimaEquiv("x * y * z");
    assertEsprimaEquiv("x * y / z");
    assertEsprimaEquiv("x * y % z");
    assertEsprimaEquiv("x % y * z");
    assertEsprimaEquiv("x << y << z");
    assertEsprimaEquiv("x | y | z");
    assertEsprimaEquiv("x & y & z");
    assertEsprimaEquiv("x ^ y ^ z");
    assertEsprimaEquiv("x & y | z");
    assertEsprimaEquiv("x | y ^ z");
    assertEsprimaEquiv("x | y & z");

    // Binary Logical Operators
    assertEsprimaEquiv("x || y");
    assertEsprimaEquiv("x && y");
    assertEsprimaEquiv("x || y || z");
    assertEsprimaEquiv("x && y && z");
    assertEsprimaEquiv("x || y && z");
    assertEsprimaEquiv("x || y ^ z");

    // Conditional Operator
    assertEsprimaEquiv("y ? 1 : 2");
    assertEsprimaEquiv("x && y ? 1 : 2");
    assertEsprimaEquiv("x = (0) ? 1 : 2");

    // Assignment Operators
    assertEsprimaEquiv("x = 42");
    assertEsprimaEquiv("eval = 42");
    assertEsprimaEquiv("arguments = 42");
    assertEsprimaEquiv("x *= 42");
    assertEsprimaEquiv("x /= 42");
    assertEsprimaEquiv("x %= 42");
    assertEsprimaEquiv("x += 42");
    assertEsprimaEquiv("x -= 42");
    assertEsprimaEquiv("x <<= 42");
    assertEsprimaEquiv("x >>= 42");
    assertEsprimaEquiv("x >>>= 42");
    assertEsprimaEquiv("x &= 42");
    assertEsprimaEquiv("x ^= 42");
    assertEsprimaEquiv("x |= 42");
    assertEsprimaEquiv("'use strict'; eval[0] = 42");
    assertEsprimaEquiv("'use strict'; arguments[0] = 42");

    // Complex Expression
    assertEsprimaEquiv("a || b && c | d ^ e & f == g < h >>> i + j * k");

    // Block
    assertEsprimaEquiv("{ foo }");
    assertEsprimaEquiv("{ doThis(); doThat(); }");
    assertEsprimaEquiv("{}");

    // Variable Statement
    assertEsprimaEquiv("var x");
    assertEsprimaEquiv("var x, y;");
    assertEsprimaEquiv("var x = 42");
    assertEsprimaEquiv("var eval = 42, arguments = 42");
    assertEsprimaEquiv("var x = 14, y = 3, z = 1977");
    assertEsprimaEquiv("var implements, interface, package");
    assertEsprimaEquiv("var private, protected, public, static");

    // Let Statement
    assertEsprimaEquiv("let x");
    assertEsprimaEquiv("{ let x }");
    assertEsprimaEquiv("{ let x = 42 }");
    assertEsprimaEquiv("{ let x = 14, y = 3, z = 1977 }");

    // Const Statement
    assertEsprimaEquiv("const x = 42");
    assertEsprimaEquiv("{ const x = 42 }");
    assertEsprimaEquiv("{ const x = 14, y = 3, z = 1977 }");

    // Empty Statement
    assertEsprimaEquiv(";");

    // Expression Statement
    assertEsprimaEquiv("x");
    assertEsprimaEquiv("x, y");
    assertEsprimaEquiv("\\u0061");
    assertEsprimaEquiv("a\\u0061");
    assertEsprimaEquiv("\\u0061a");
    assertEsprimaEquiv("\\u0061a ");

    // If Statement
    assertEsprimaEquiv("if (morning) goodMorning()");
    assertEsprimaEquiv("if (morning) (function(){})");
    assertEsprimaEquiv("if (morning) var x = 0;");
    assertEsprimaEquiv("if (morning) function a(){}");
    assertEsprimaEquiv("if (morning) goodMorning(); else goodDay()");

    // Iteration Statements
    assertEsprimaEquiv("do keep(); while (true)");
    assertEsprimaEquiv("do keep(); while (true);");
    assertEsprimaEquiv("do { x++; y--; } while (x < 10)");
    assertEsprimaEquiv("{ do { } while (false) false }");
    assertEsprimaEquiv("while (true) doSomething()");
    assertEsprimaEquiv("while (x < 10) { x++; y--; }");
    assertEsprimaEquiv("for(;;);");
    assertEsprimaEquiv("for(;;){}");
    assertEsprimaEquiv("for(x = 0;;);");
    assertEsprimaEquiv("for(var x = 0;;);");
    assertEsprimaEquiv("for(let x = 0;;);");
    assertEsprimaEquiv("for(var x = 0, y = 1;;);");
    assertEsprimaEquiv("for(x = 0; x < 42;);");
    assertEsprimaEquiv("for(x = 0; x < 42; x++);");
    assertEsprimaEquiv("for(x = 0; x < 42; x++) process(x);");
    assertEsprimaEquiv("for(x in list) process(x);");
    assertEsprimaEquiv("for (var x in list) process(x);");
    assertEsprimaEquiv("for (var x = 42 in list) process(x);");
    assertEsprimaEquiv("for (let x in list) process(x);");
    assertEsprimaEquiv("for (var x = y = z in q);");
    assertEsprimaEquiv("for (var a = b = c = (d in e) in z);");
    assertEsprimaEquiv("for (var i = function() { return 10 in [] } in list) process(x);");

    // continue body
    assertEsprimaEquiv("while (true) { continue; }");
    assertEsprimaEquiv("while (true) { continue }");
    assertEsprimaEquiv("done: while (true) { continue done }");
    assertEsprimaEquiv("done: while (true) { continue done; }");
    assertEsprimaEquiv("__proto__: while (true) { continue __proto__; }");

    // break body
    assertEsprimaEquiv("while (true) { break }");
    assertEsprimaEquiv("done: while (true) { break done }");
    assertEsprimaEquiv("done: while (true) { break done; }");
    assertEsprimaEquiv("__proto__: while (true) { break __proto__; }");

    // return body
    assertEsprimaEquiv("(function(){ return })");
    assertEsprimaEquiv("(function(){ return; })");
    assertEsprimaEquiv("(function(){ return x; })");
    assertEsprimaEquiv("(function(){ return x * y })");

    // with body
    assertEsprimaEquiv("with (x) foo = bar");
    assertEsprimaEquiv("with (x) foo = bar;");
    assertEsprimaEquiv("with (x) { foo = bar }");

    // switch body
    assertEsprimaEquiv("switch (x) {}");
    assertEsprimaEquiv("switch (answer) { case 42: hi(); break; }");
    assertEsprimaEquiv("switch (answer) { case 42: hi(); break; default: break }");

    // Labelled Statements
    assertEsprimaEquiv("start: for (;;) break start");
    assertEsprimaEquiv("start: while (true) break start");
    assertEsprimaEquiv("__proto__: test");

    // throw body
    assertEsprimaEquiv("throw x;");
    assertEsprimaEquiv("throw x * y");
    assertEsprimaEquiv("throw { message: \"Error\" }");

    // try body
    assertEsprimaEquiv("try { } catch (e) { }");
    assertEsprimaEquiv("try { } catch (eval) { }");
    assertEsprimaEquiv("try { } catch (arguments) { }");
    assertEsprimaEquiv("try { } catch (e) { say(e) }");
    assertEsprimaEquiv("try { } finally { cleanup(stuff) }");
    assertEsprimaEquiv("try { doThat(); } catch (e) { say(e) }");
    assertEsprimaEquiv("try { doThat(); } catch (e) { say(e) } finally { cleanup(stuff) }");

    // debugger body
    assertEsprimaEquiv("debugger;");

    // FunctionId Definition
    assertEsprimaEquiv("function hello() { sayHi(); }");
    assertEsprimaEquiv("function eval() { }");
    assertEsprimaEquiv("function arguments() { }");
    assertEsprimaEquiv("function test(t, t) { }");
    assertEsprimaEquiv("(function test(t, t) { })");
    assertEsprimaEquiv("function eval() { function inner() { \"use strict\" } }");
    assertEsprimaEquiv("function hello(a) { sayHi(); }");
    assertEsprimaEquiv("function hello(a, b) { sayHi(); }");
    assertEsprimaEquiv("var hi = function() { sayHi() };");
    assertEsprimaEquiv("var hi = function eval() { };");
    assertEsprimaEquiv("var hi = function arguments() { };");
    assertEsprimaEquiv("var hello = function hi() { sayHi() };");
    assertEsprimaEquiv("(function(){})");
    assertEsprimaEquiv("function universe(__proto__) { }");
    assertEsprimaEquiv("function test() { \"use strict\" + 42; }");

    // Automatic semicolon insertion
    assertEsprimaEquiv("{ x\n++y }");
    assertEsprimaEquiv("{ x\n--y }");
    assertEsprimaEquiv("var x /* comment */;");
    assertEsprimaEquiv("{ var x = 14, y = 3\nz; }");
    assertEsprimaEquiv("while (true) { continue\nthere; }");
    assertEsprimaEquiv("while (true) { continue // Comment\nthere; }");
    assertEsprimaEquiv("while (true) { continue /* Multiline\nComment */there; }");
    assertEsprimaEquiv("while (true) { break\nthere; }");
    assertEsprimaEquiv("while (true) { break // Comment\nthere; }");
    assertEsprimaEquiv("while (true) { break /* Multiline\nComment */there; }");
    assertEsprimaEquiv("(function(){ return\nx; })");
    assertEsprimaEquiv("(function(){ return // Comment\nx; })");
    assertEsprimaEquiv("(function(){ return/* Multiline\nComment */x; })");
    assertEsprimaEquiv("{ throw error\nerror; }");
    assertEsprimaEquiv("{ throw error// Comment\nerror; }");
    assertEsprimaEquiv("{ throw error/* Multiline\nComment */error; }");

    // Directive Prolog
    // FIXME: heuristic converter cannot handle information loss in SpiderMonkey Parse API.
    // assertEsprimaEquiv("(function () { 'use\\x20strict'; with (i); }())");
    assertEsprimaEquiv("(function () { 'use\\nstrict'; with (i); }())");

    // Whitespace
    assertEsprimaEquiv("ws/00",
        "new\u0020\u0009\u000B\u000C\u00A0\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\uFEFFa");
    assertEsprimaEquiv("{0\n1\r2\u20283\u20294}");
  });
});
