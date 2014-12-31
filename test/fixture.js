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
    assertEsprimaEquiv("unicode/00", "日本語 = []");
    assertEsprimaEquiv("unicode/01", "T\u203F = []");
    assertEsprimaEquiv("unicode/02", "T\u200C = []");
    assertEsprimaEquiv("unicode/03", "T\u200D = []");
    assertEsprimaEquiv("unicode/04", "\u2163\u2161 = []");
    assertEsprimaEquiv("unicode/05", "\u2163\u2161\u200A=\u2009[]");

    // Comments
    assertEsprimaEquiv("comments/00", "/* block comment */ 42");
    assertEsprimaEquiv("comments/01", "42 /* block comment 1 */ /* block comment 2 */");
    assertEsprimaEquiv("comments/02", "(a + /* assignment */b ) * c");
    assertEsprimaEquiv("comments/03", "/* assignment */\n a = b");
    assertEsprimaEquiv("comments/04", "42 /*The*/ /*Answer*/");
    assertEsprimaEquiv("comments/05", "42 /*the*/ /*answer*/");
    assertEsprimaEquiv("comments/06", "42 /* the * answer */");
    assertEsprimaEquiv("comments/07", "42 /* The * answer */");
    assertEsprimaEquiv("comments/08", "/* multiline\ncomment\nshould\nbe\nignored */ 42");
    assertEsprimaEquiv("comments/09", "/*a\r\nb*/ 42");
    assertEsprimaEquiv("comments/10", "/*a\rb*/ 42");
    assertEsprimaEquiv("comments/11", "/*a\nb*/ 42");
    assertEsprimaEquiv("comments/12", "/*a\nc*/ 42");
    assertEsprimaEquiv("comments/13", "// line comment\n42");
    assertEsprimaEquiv("comments/14", "42 // line comment");
    assertEsprimaEquiv("comments/15", "// Hello, world!\n42");
    assertEsprimaEquiv("comments/16", "// Hello, world!\n");
    assertEsprimaEquiv("comments/17", "// Hallo, world!\n");
    assertEsprimaEquiv("comments/18", "//\n42");
    assertEsprimaEquiv("comments/19", "//");
    assertEsprimaEquiv("comments/20", "// ");
    assertEsprimaEquiv("comments/21", "/**/42");
    assertEsprimaEquiv("comments/22", "42/**/");
    assertEsprimaEquiv("comments/23", "// Hello, world!\n\n//   Another hello\n42");
    assertEsprimaEquiv("comments/24", "if (x) { doThat() // Some comment\n }");
    assertEsprimaEquiv("comments/25", "if (x) { // Some comment\ndoThat(); }");
    assertEsprimaEquiv("comments/26", "if (x) { /* Some comment */ doThat() }");
    assertEsprimaEquiv("comments/27", "if (x) { doThat() /* Some comment */ }");
    assertEsprimaEquiv("comments/28", "switch (answer) { case 42: /* perfect */ bingo() }");
    assertEsprimaEquiv("comments/29", "switch (answer) { case 42: bingo() /* perfect */ }");
    assertEsprimaEquiv("comments/30", "/* header */ (function(){ var version = 1; }).call(this)");
    assertEsprimaEquiv("comments/31", "(function(){ var version = 1; /* sync */ }).call(this)");
    assertEsprimaEquiv("comments/32", "function f() { /* infinite */ while (true) { } /* bar */ var each; }");
    assertEsprimaEquiv("comments/33", "<!-- foo");
    assertEsprimaEquiv("comments/34", "var x = 1<!--foo");
    assertEsprimaEquiv("comments/35", "--> comment");
    assertEsprimaEquiv("comments/36", "<!-- comment");
    assertEsprimaEquiv("comments/37", " \t --> comment");
    assertEsprimaEquiv("comments/38", " \t /* block comment */  --> comment");
    assertEsprimaEquiv("comments/39", "/* block comment */--> comment");
    assertEsprimaEquiv("comments/40", "/* not comment*/; i-->0");
    assertEsprimaEquiv("comments/41", "while (i-->0) {}");

    // Primary Expression
    assertEsprimaEquiv("expression/primary/00", "this\n");
    assertEsprimaEquiv("expression/primary/01", "null\n");
    assertEsprimaEquiv("expression/primary/02", "\n    42\n\n");
    assertEsprimaEquiv("expression/primary/03", "(1 + 2 ) * 3");

    // Grouping Operator
    assertEsprimaEquiv("expression/grouping/00", "(1) + (2  ) + 3");
    assertEsprimaEquiv("expression/grouping/01", "4 + 5 << (6)");

    // Array Initializer
    assertEsprimaEquiv("expression/array/00", "x = []");
    assertEsprimaEquiv("expression/array/01", "x = [ ]");
    assertEsprimaEquiv("expression/array/02", "x = [ 42 ]");
    assertEsprimaEquiv("expression/array/03", "x = [ 42, ]");
    assertEsprimaEquiv("expression/array/04", "x = [ ,, 42 ]");
    assertEsprimaEquiv("expression/array/05", "x = [ 1, 2, 3, ]");
    assertEsprimaEquiv("expression/array/06", "x = [ 1, 2,, 3, ]");

    // Object Initializer
    assertEsprimaEquiv("expression/object/00", "x = {}");
    assertEsprimaEquiv("expression/object/01", "x = { }");
    assertEsprimaEquiv("expression/object/02", "x = { answer: 42 }");
    assertEsprimaEquiv("expression/object/03", "x = { if: 42 }");
    assertEsprimaEquiv("expression/object/04", "x = { true: 42 }");
    assertEsprimaEquiv("expression/object/05", "x = { false: 42 }");
    assertEsprimaEquiv("expression/object/06", "x = { null: 42 }");
    assertEsprimaEquiv("expression/object/07", "x = { \"answer\": 42 }");
    assertEsprimaEquiv("expression/object/08", "x = { x: 1, x: 2 }");
    assertEsprimaEquiv("expression/object/09", "x = { get width() { return m_width } }");
    assertEsprimaEquiv("expression/object/10", "x = { get undef() {} }");
    assertEsprimaEquiv("expression/object/11", "x = { get if() {} }");
    assertEsprimaEquiv("expression/object/12", "x = { get true() {} }");
    assertEsprimaEquiv("expression/object/13", "x = { get false() {} }");
    assertEsprimaEquiv("expression/object/14", "x = { get null() {} }");
    assertEsprimaEquiv("expression/object/15", "x = { get \"undef\"() {} }");
    assertEsprimaEquiv("expression/object/16", "x = { get 10() {} }");
    assertEsprimaEquiv("expression/object/17", "x = { set width(w) { m_width = w } }");
    assertEsprimaEquiv("expression/object/18", "x = { set if(w) { m_if = w } }");
    assertEsprimaEquiv("expression/object/19", "x = { set true(w) { m_true = w } }");
    assertEsprimaEquiv("expression/object/20", "x = { set false(w) { m_false = w } }");
    assertEsprimaEquiv("expression/object/21", "x = { set null(w) { m_null = w } }");
    assertEsprimaEquiv("expression/object/22", "x = { set \"null\"(w) { m_null = w } }");
    assertEsprimaEquiv("expression/object/23", "x = { set 10(w) { m_null = w } }");
    assertEsprimaEquiv("expression/object/24", "x = { get: 42 }");
    assertEsprimaEquiv("expression/object/25", "x = { set: 43 }");
    assertEsprimaEquiv("expression/object/26", "x = { __proto__: 2 }");
    assertEsprimaEquiv("expression/object/27", "x = {\"__proto__\": 2 }");
    assertEsprimaEquiv("expression/object/28",
        "x = { get width() { return m_width }, set width(width) { m_width = width; } }");

    // Numeric Literals
    assertEsprimaEquiv("expression/numeric/00", "0");
    assertEsprimaEquiv("expression/numeric/01", "3");
    assertEsprimaEquiv("expression/numeric/02", "5");
    assertEsprimaEquiv("expression/numeric/03", "42");
    assertEsprimaEquiv("expression/numeric/04", ".14");
    assertEsprimaEquiv("expression/numeric/05", "3.14159");
    assertEsprimaEquiv("expression/numeric/06", "6.02214179e+23");
    assertEsprimaEquiv("expression/numeric/07", "1.492417830e-10");
    assertEsprimaEquiv("expression/numeric/08", "0x0");
    assertEsprimaEquiv("expression/numeric/09", "0x0;");
    assertEsprimaEquiv("expression/numeric/10", "0e+100 ");
    assertEsprimaEquiv("expression/numeric/11", "0e+100");
    assertEsprimaEquiv("expression/numeric/12", "0xabc");
    assertEsprimaEquiv("expression/numeric/13", "0xdef");
    assertEsprimaEquiv("expression/numeric/14", "0X1A");
    assertEsprimaEquiv("expression/numeric/15", "0x10");
    assertEsprimaEquiv("expression/numeric/16", "0x100");
    assertEsprimaEquiv("expression/numeric/17", "0X04");
    assertEsprimaEquiv("expression/numeric/18", "02");
    assertEsprimaEquiv("expression/numeric/19", "012");
    assertEsprimaEquiv("expression/numeric/20", "0012");

    // String Literals
    assertEsprimaEquiv("expression/string/00", "\"Hello\"");
    assertEsprimaEquiv("expression/string/01", "\"\\n\\r\\t\\v\\b\\f\\\\\\'\\\"\\0\"");
    assertEsprimaEquiv("expression/string/02", "\"\\u0061\"");
    assertEsprimaEquiv("expression/string/03", "\"\\x61\"");
    assertEsprimaEquiv("expression/string/04", "\"\\u00\"");
    assertEsprimaEquiv("expression/string/05", "\"\\xt\"");
    assertEsprimaEquiv("expression/string/06", "\"Hello\\nworld\"");
    assertEsprimaEquiv("expression/string/07", "\"Hello\\\nworld\"");
    assertEsprimaEquiv("expression/string/08", "\"Hello\\02World\"");
    assertEsprimaEquiv("expression/string/09", "\"Hello\\012World\"");
    assertEsprimaEquiv("expression/string/10", "\"Hello\\122World\"");
    assertEsprimaEquiv("expression/string/11", "\"Hello\\0122World\"");
    assertEsprimaEquiv("expression/string/12", "\"Hello\\312World\"");
    assertEsprimaEquiv("expression/string/13", "\"Hello\\412World\"");
    assertEsprimaEquiv("expression/string/14", "\"Hello\\812World\"");
    assertEsprimaEquiv("expression/string/15", "\"Hello\\712World\"");
    assertEsprimaEquiv("expression/string/16", "\"Hello\\0World\"");
    assertEsprimaEquiv("expression/string/17", "\"Hello\\\r\nworld\"");
    assertEsprimaEquiv("expression/string/18", "\"Hello\\1World\"");

    // Regular Expression Literals
    assertEsprimaEquiv("expression/regexp/00", "var x = /[a-z]/i");
    assertEsprimaEquiv("expression/regexp/01", "var x = /[x-z]/i");
    assertEsprimaEquiv("expression/regexp/02", "var x = /[a-c]/i");
    assertEsprimaEquiv("expression/regexp/03", "var x = /[P QR]/i");
    assertEsprimaEquiv("expression/regexp/04", "var x = /[\\]/]/");
    assertEsprimaEquiv("expression/regexp/05", "var x = /foo\\/bar/");
    assertEsprimaEquiv("expression/regexp/06", "var x = /=([^=\\s])+/g");
    // testParser("expression/regexp/07", "var x = /[P QR]/\\g");
    assertEsprimaEquiv("expression/regexp/08", "var x = /42/g.test");

    // Left-Hand-Side Expression
    assertEsprimaEquiv("expression/lhs/00", "new Button");
    assertEsprimaEquiv("expression/lhs/01", "new Button()");
    assertEsprimaEquiv("expression/lhs/02", "new new foo");
    assertEsprimaEquiv("expression/lhs/03", "new new foo()");
    assertEsprimaEquiv("expression/lhs/04", "new foo().bar()");
    assertEsprimaEquiv("expression/lhs/05", "new foo[bar]");
    assertEsprimaEquiv("expression/lhs/06", "new foo.bar()");
    assertEsprimaEquiv("expression/lhs/07", "( new foo).bar()");
    assertEsprimaEquiv("expression/lhs/08", "foo(bar, baz)");
    assertEsprimaEquiv("expression/lhs/09", "(    foo  )()");
    assertEsprimaEquiv("expression/lhs/10", "universe.milkyway");
    assertEsprimaEquiv("expression/lhs/11", "universe.milkyway.solarsystem");
    assertEsprimaEquiv("expression/lhs/12", "universe.milkyway.solarsystem.Earth");
    assertEsprimaEquiv("expression/lhs/13", "universe[galaxyName, otherUselessName]");
    assertEsprimaEquiv("expression/lhs/14", "universe[galaxyName]");
    assertEsprimaEquiv("expression/lhs/15", "universe[42].galaxies");
    assertEsprimaEquiv("expression/lhs/16", "universe(42).galaxies");
    assertEsprimaEquiv("expression/lhs/17", "universe(42).galaxies(14, 3, 77).milkyway");
    assertEsprimaEquiv("expression/lhs/18", "earth.asia.Indonesia.prepareForElection(2014)");
    assertEsprimaEquiv("expression/lhs/19", "universe.if");
    assertEsprimaEquiv("expression/lhs/20", "universe.true");
    assertEsprimaEquiv("expression/lhs/21", "universe.false");
    assertEsprimaEquiv("expression/lhs/22", "universe.null");

    // Postfix Expressions
    assertEsprimaEquiv("expression/postfix/00", "x++");
    assertEsprimaEquiv("expression/postfix/01", "x--");
    assertEsprimaEquiv("expression/postfix/02", "eval++");
    assertEsprimaEquiv("expression/postfix/03", "eval--");
    assertEsprimaEquiv("expression/postfix/04", "arguments++");
    assertEsprimaEquiv("expression/postfix/05", "arguments--");

    // Unary Operators
    assertEsprimaEquiv("expression/unary/00", "++x");
    assertEsprimaEquiv("expression/unary/01", "--x");
    assertEsprimaEquiv("expression/unary/02", "++eval");
    assertEsprimaEquiv("expression/unary/03", "--eval");
    assertEsprimaEquiv("expression/unary/04", "++arguments");
    assertEsprimaEquiv("expression/unary/05", "--arguments");
    assertEsprimaEquiv("expression/unary/06", "+x");
    assertEsprimaEquiv("expression/unary/07", "-x");
    assertEsprimaEquiv("expression/unary/08", "~x");
    assertEsprimaEquiv("expression/unary/09", "!x");
    assertEsprimaEquiv("expression/unary/10", "void x");
    assertEsprimaEquiv("expression/unary/11", "delete x");
    assertEsprimaEquiv("expression/unary/12", "typeof x");

    // Multiplicative Operators
    assertEsprimaEquiv("expression/mul/00", "x * y");
    assertEsprimaEquiv("expression/mul/01", "x / y");
    assertEsprimaEquiv("expression/mul/02", "x % y");

    // Additive Operators
    assertEsprimaEquiv("expression/add/00", "x + y");
    assertEsprimaEquiv("expression/add/01", "x - y");
    assertEsprimaEquiv("expression/add/02", "\"use strict\" + 42");

    // Bitwise Shift Operator
    assertEsprimaEquiv("expression/shift/00", "x << y");
    assertEsprimaEquiv("expression/shift/01", "x >> y");
    assertEsprimaEquiv("expression/shift/02", "x >>> y");

    // Relational Operators
    assertEsprimaEquiv("expression/rel/00", "x < y");
    assertEsprimaEquiv("expression/rel/01", "x > y");
    assertEsprimaEquiv("expression/rel/02", "x <= y");
    assertEsprimaEquiv("expression/rel/03", "x >= y");
    assertEsprimaEquiv("expression/rel/04", "x in y");
    assertEsprimaEquiv("expression/rel/05", "x instanceof y");
    assertEsprimaEquiv("expression/rel/06", "x < y < z");

    // Equality Operators
    assertEsprimaEquiv("expression/eq/00", "x == y");
    assertEsprimaEquiv("expression/eq/01", "x != y");
    assertEsprimaEquiv("expression/eq/02", "x === y");
    assertEsprimaEquiv("expression/eq/03", "x !== y");

    // Binary Bitwise Operators
    assertEsprimaEquiv("expression/bit/00", "x & y");
    assertEsprimaEquiv("expression/bit/01", "x ^ y");
    assertEsprimaEquiv("expression/bit/02", "x | y");

    // Binary Expressions
    assertEsprimaEquiv("expression/binary/00", "x + y + z");
    assertEsprimaEquiv("expression/binary/01", "x - y + z");
    assertEsprimaEquiv("expression/binary/02", "x + y - z");
    assertEsprimaEquiv("expression/binary/03", "x - y - z");
    assertEsprimaEquiv("expression/binary/04", "x + y * z");
    assertEsprimaEquiv("expression/binary/05", "x + y / z");
    assertEsprimaEquiv("expression/binary/06", "x - y % z");
    assertEsprimaEquiv("expression/binary/07", "x * y * z");
    assertEsprimaEquiv("expression/binary/08", "x * y / z");
    assertEsprimaEquiv("expression/binary/09", "x * y % z");
    assertEsprimaEquiv("expression/binary/10", "x % y * z");
    assertEsprimaEquiv("expression/binary/11", "x << y << z");
    assertEsprimaEquiv("expression/binary/12", "x | y | z");
    assertEsprimaEquiv("expression/binary/13", "x & y & z");
    assertEsprimaEquiv("expression/binary/14", "x ^ y ^ z");
    assertEsprimaEquiv("expression/binary/15", "x & y | z");
    assertEsprimaEquiv("expression/binary/16", "x | y ^ z");
    assertEsprimaEquiv("expression/binary/17", "x | y & z");

    // Binary Logical Operators
    assertEsprimaEquiv("expression/logic/00", "x || y");
    assertEsprimaEquiv("expression/logic/01", "x && y");
    assertEsprimaEquiv("expression/logic/02", "x || y || z");
    assertEsprimaEquiv("expression/logic/03", "x && y && z");
    assertEsprimaEquiv("expression/logic/04", "x || y && z");
    assertEsprimaEquiv("expression/logic/05", "x || y ^ z");

    // Conditional Operator
    assertEsprimaEquiv("expression/cond/00", "y ? 1 : 2");
    assertEsprimaEquiv("expression/cond/01", "x && y ? 1 : 2");
    assertEsprimaEquiv("expression/cond/02", "x = (0) ? 1 : 2");

    // Assignment Operators
    assertEsprimaEquiv("expression/assignment/00", "x = 42");
    assertEsprimaEquiv("expression/assignment/01", "eval = 42");
    assertEsprimaEquiv("expression/assignment/02", "arguments = 42");
    assertEsprimaEquiv("expression/assignment/03", "x *= 42");
    assertEsprimaEquiv("expression/assignment/04", "x /= 42");
    assertEsprimaEquiv("expression/assignment/05", "x %= 42");
    assertEsprimaEquiv("expression/assignment/06", "x += 42");
    assertEsprimaEquiv("expression/assignment/07", "x -= 42");
    assertEsprimaEquiv("expression/assignment/08", "x <<= 42");
    assertEsprimaEquiv("expression/assignment/09", "x >>= 42");
    assertEsprimaEquiv("expression/assignment/10", "x >>>= 42");
    assertEsprimaEquiv("expression/assignment/11", "x &= 42");
    assertEsprimaEquiv("expression/assignment/12", "x ^= 42");
    assertEsprimaEquiv("expression/assignment/13", "x |= 42");
    assertEsprimaEquiv("expression/assignment/16", "'use strict'; eval[0] = 42");
    assertEsprimaEquiv("expression/assignment/17", "'use strict'; arguments[0] = 42");

    // Complex Expression
    assertEsprimaEquiv("expression/complex", "a || b && c | d ^ e & f == g < h >>> i + j * k");

    // Block
    assertEsprimaEquiv("statement/block/00", "{ foo }");
    assertEsprimaEquiv("statement/block/01", "{ doThis(); doThat(); }");
    assertEsprimaEquiv("statement/block/02", "{}");

    // Variable Statement
    assertEsprimaEquiv("statement/var/00", "var x");
    assertEsprimaEquiv("statement/var/01", "var x, y;");
    assertEsprimaEquiv("statement/var/02", "var x = 42");
    assertEsprimaEquiv("statement/var/03", "var eval = 42, arguments = 42");
    assertEsprimaEquiv("statement/var/04", "var x = 14, y = 3, z = 1977");
    assertEsprimaEquiv("statement/var/05", "var implements, interface, package");
    assertEsprimaEquiv("statement/var/06", "var private, protected, public, static");

    // Let Statement
    assertEsprimaEquiv("statement/let/00", "let x");
    assertEsprimaEquiv("statement/let/01", "{ let x }");
    assertEsprimaEquiv("statement/let/02", "{ let x = 42 }");
    assertEsprimaEquiv("statement/let/03", "{ let x = 14, y = 3, z = 1977 }");

    // Const Statement
    assertEsprimaEquiv("statement/const/00", "const x = 42");
    assertEsprimaEquiv("statement/const/01", "{ const x = 42 }");
    assertEsprimaEquiv("statement/const/02", "{ const x = 14, y = 3, z = 1977 }");

    // Empty Statement
    assertEsprimaEquiv("statement/empty", ";");

    // Expression Statement
    assertEsprimaEquiv("statement/expression/00", "x");
    assertEsprimaEquiv("statement/expression/01", "x, y");
    assertEsprimaEquiv("statement/expression/02", "\\u0061");
    assertEsprimaEquiv("statement/expression/03", "a\\u0061");
    assertEsprimaEquiv("statement/expression/04", "\\u0061a");
    assertEsprimaEquiv("statement/expression/05", "\\u0061a ");

    // If Statement
    assertEsprimaEquiv("statement/if/00", "if (morning) goodMorning()");
    assertEsprimaEquiv("statement/if/01", "if (morning) (function(){})");
    assertEsprimaEquiv("statement/if/02", "if (morning) var x = 0;");
    assertEsprimaEquiv("statement/if/03", "if (morning) function a(){}");
    assertEsprimaEquiv("statement/if/04", "if (morning) goodMorning(); else goodDay()");

    // Iteration Statements
    assertEsprimaEquiv("statement/iteration/00", "do keep(); while (true)");
    assertEsprimaEquiv("statement/iteration/01", "do keep(); while (true);");
    assertEsprimaEquiv("statement/iteration/02", "do { x++; y--; } while (x < 10)");
    assertEsprimaEquiv("statement/iteration/03", "{ do { } while (false) false }");
    assertEsprimaEquiv("statement/iteration/04", "while (true) doSomething()");
    assertEsprimaEquiv("statement/iteration/05", "while (x < 10) { x++; y--; }");
    assertEsprimaEquiv("statement/iteration/06", "for(;;);");
    assertEsprimaEquiv("statement/iteration/07", "for(;;){}");
    assertEsprimaEquiv("statement/iteration/08", "for(x = 0;;);");
    assertEsprimaEquiv("statement/iteration/09", "for(var x = 0;;);");
    assertEsprimaEquiv("statement/iteration/10", "for(let x = 0;;);");
    assertEsprimaEquiv("statement/iteration/11", "for(var x = 0, y = 1;;);");
    assertEsprimaEquiv("statement/iteration/12", "for(x = 0; x < 42;);");
    assertEsprimaEquiv("statement/iteration/13", "for(x = 0; x < 42; x++);");
    assertEsprimaEquiv("statement/iteration/14", "for(x = 0; x < 42; x++) process(x);");
    assertEsprimaEquiv("statement/iteration/15", "for(x in list) process(x);");
    assertEsprimaEquiv("statement/iteration/16", "for (var x in list) process(x);");
    assertEsprimaEquiv("statement/iteration/17", "for (var x = 42 in list) process(x);");
    assertEsprimaEquiv("statement/iteration/18", "for (let x in list) process(x);");
    assertEsprimaEquiv("statement/iteration/19", "for (var x = y = z in q);");
    assertEsprimaEquiv("statement/iteration/20", "for (var a = b = c = (d in e) in z);");
    assertEsprimaEquiv("statement/iteration/21", "for (var i = function() { return 10 in [] } in list) process(x);");

    // continue body
    assertEsprimaEquiv("statement/continue/00", "while (true) { continue; }");
    assertEsprimaEquiv("statement/continue/01", "while (true) { continue }");
    assertEsprimaEquiv("statement/continue/02", "done: while (true) { continue done }");
    assertEsprimaEquiv("statement/continue/03", "done: while (true) { continue done; }");
    assertEsprimaEquiv("statement/continue/04", "__proto__: while (true) { continue __proto__; }");

    // break body
    assertEsprimaEquiv("statement/break/00", "while (true) { break }");
    assertEsprimaEquiv("statement/break/01", "done: while (true) { break done }");
    assertEsprimaEquiv("statement/break/02", "done: while (true) { break done; }");
    assertEsprimaEquiv("statement/break/03", "__proto__: while (true) { break __proto__; }");

    // return body
    assertEsprimaEquiv("statement/return/00", "(function(){ return })");
    assertEsprimaEquiv("statement/return/01", "(function(){ return; })");
    assertEsprimaEquiv("statement/return/02", "(function(){ return x; })");
    assertEsprimaEquiv("statement/return/03", "(function(){ return x * y })");

    // with body
    assertEsprimaEquiv("statement/with/00", "with (x) foo = bar");
    assertEsprimaEquiv("statement/with/01", "with (x) foo = bar;");
    assertEsprimaEquiv("statement/with/02", "with (x) { foo = bar }");

    // switch body
    assertEsprimaEquiv("statement/switch/00", "switch (x) {}");
    assertEsprimaEquiv("statement/switch/01", "switch (answer) { case 42: hi(); break; }");
    assertEsprimaEquiv("statement/switch/02", "switch (answer) { case 42: hi(); break; default: break }");

    // Labelled Statements
    assertEsprimaEquiv("statement/labeled/00", "start: for (;;) break start");
    assertEsprimaEquiv("statement/labeled/01", "start: while (true) break start");
    assertEsprimaEquiv("statement/labeled/02", "__proto__: test");

    // throw body
    assertEsprimaEquiv("statement/throw/00", "throw x;");
    assertEsprimaEquiv("statement/throw/01", "throw x * y");
    assertEsprimaEquiv("statement/throw/02", "throw { message: \"Error\" }");

    // try body
    assertEsprimaEquiv("statement/try/00", "try { } catch (e) { }");
    assertEsprimaEquiv("statement/try/01", "try { } catch (eval) { }");
    assertEsprimaEquiv("statement/try/02", "try { } catch (arguments) { }");
    assertEsprimaEquiv("statement/try/03", "try { } catch (e) { say(e) }");
    assertEsprimaEquiv("statement/try/04", "try { } finally { cleanup(stuff) }");
    assertEsprimaEquiv("statement/try/05", "try { doThat(); } catch (e) { say(e) }");
    assertEsprimaEquiv("statement/try/06", "try { doThat(); } catch (e) { say(e) } finally { cleanup(stuff) }");

    // debugger body
    assertEsprimaEquiv("statement/debugger", "debugger;");

    // FunctionId Definition
    assertEsprimaEquiv("statement/functionDecl/00", "function hello() { sayHi(); }");
    assertEsprimaEquiv("statement/functionDecl/01", "function eval() { }");
    assertEsprimaEquiv("statement/functionDecl/02", "function arguments() { }");
    assertEsprimaEquiv("statement/functionDecl/03", "function test(t, t) { }");
    assertEsprimaEquiv("statement/functionDecl/04", "(function test(t, t) { })");
    assertEsprimaEquiv("statement/functionDecl/05", "function eval() { function inner() { \"use strict\" } }");
    assertEsprimaEquiv("statement/functionDecl/06", "function hello(a) { sayHi(); }");
    assertEsprimaEquiv("statement/functionDecl/07", "function hello(a, b) { sayHi(); }");
    assertEsprimaEquiv("statement/functionDecl/08", "var hi = function() { sayHi() };");
    assertEsprimaEquiv("statement/functionDecl/09", "var hi = function eval() { };");
    assertEsprimaEquiv("statement/functionDecl/10", "var hi = function arguments() { };");
    assertEsprimaEquiv("statement/functionDecl/11", "var hello = function hi() { sayHi() };");
    assertEsprimaEquiv("statement/functionDecl/12", "(function(){})");
    assertEsprimaEquiv("statement/functionDecl/13", "function universe(__proto__) { }");
    assertEsprimaEquiv("statement/functionDecl/14", "function test() { \"use strict\" + 42; }");

    // Automatic semicolon insertion
    assertEsprimaEquiv("asi/00", "{ x\n++y }");
    assertEsprimaEquiv("asi/01", "{ x\n--y }");
    assertEsprimaEquiv("asi/02", "var x /* comment */;");
    assertEsprimaEquiv("asi/03", "{ var x = 14, y = 3\nz; }");
    assertEsprimaEquiv("asi/04", "while (true) { continue\nthere; }");
    assertEsprimaEquiv("asi/05", "while (true) { continue // Comment\nthere; }");
    assertEsprimaEquiv("asi/06", "while (true) { continue /* Multiline\nComment */there; }");
    assertEsprimaEquiv("asi/07", "while (true) { break\nthere; }");
    assertEsprimaEquiv("asi/08", "while (true) { break // Comment\nthere; }");
    assertEsprimaEquiv("asi/09", "while (true) { break /* Multiline\nComment */there; }");
    assertEsprimaEquiv("asi/10", "(function(){ return\nx; })");
    assertEsprimaEquiv("asi/11", "(function(){ return // Comment\nx; })");
    assertEsprimaEquiv("asi/12", "(function(){ return/* Multiline\nComment */x; })");
    assertEsprimaEquiv("asi/13", "{ throw error\nerror; }");
    assertEsprimaEquiv("asi/14", "{ throw error// Comment\nerror; }");
    assertEsprimaEquiv("asi/15", "{ throw error/* Multiline\nComment */error; }");

    // Directive Prolog
    // FIXME: heuristic converter cannot handle information loss in SpiderMonkey Parse API.
    // assertEsprimaEquiv("directive/00", "(function () { 'use\\x20strict'; with (i); }())");
    assertEsprimaEquiv("directive/01", "(function () { 'use\\nstrict'; with (i); }())");

    // Whitespace
    assertEsprimaEquiv("ws/00",
        "new\u0020\u0009\u000B\u000C\u00A0\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\uFEFFa");
    assertEsprimaEquiv("ws/01", "{0\n1\r2\u20283\u20294}");
  });
});
