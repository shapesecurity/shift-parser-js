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
var esprima = require('esprima');
var converters = require('shift-spidermonkey-converter');
var ShiftParser = require('../');

describe("Parser", function () {
  var parse = ShiftParser.default;

  describe("basic fixture", function () {
    function testParsing(name, source) {
      it(name, function () {
        var tree = parse(source);
        var oracle = converters.toShift(esprima.parse(source));
        expect(tree).eql(oracle);
      });
    }

    // Unicode
    testParsing("unicode/00", "日本語 = []");
    testParsing("unicode/01", "T\u203F = []");
    testParsing("unicode/02", "T\u200C = []");
    testParsing("unicode/03", "T\u200D = []");
    testParsing("unicode/04", "\u2163\u2161 = []");
    testParsing("unicode/05", "\u2163\u2161\u200A=\u2009[]");

    // Comments
    testParsing("comments/00", "/* block comment */ 42");
    testParsing("comments/01", "42 /* block comment 1 */ /* block comment 2 */");
    testParsing("comments/02", "(a + /* assignment */b ) * c");
    testParsing("comments/03", "/* assignment */\n a = b");
    testParsing("comments/04", "42 /*The*/ /*Answer*/");
    testParsing("comments/05", "42 /*the*/ /*answer*/");
    testParsing("comments/06", "42 /* the * answer */");
    testParsing("comments/07", "42 /* The * answer */");
    testParsing("comments/08", "/* multiline\ncomment\nshould\nbe\nignored */ 42");
    testParsing("comments/09", "/*a\r\nb*/ 42");
    testParsing("comments/10", "/*a\rb*/ 42");
    testParsing("comments/11", "/*a\nb*/ 42");
    testParsing("comments/12", "/*a\nc*/ 42");
    testParsing("comments/13", "// line comment\n42");
    testParsing("comments/14", "42 // line comment");
    testParsing("comments/15", "// Hello, world!\n42");
    testParsing("comments/16", "// Hello, world!\n");
    testParsing("comments/17", "// Hallo, world!\n");
    testParsing("comments/18", "//\n42");
    testParsing("comments/19", "//");
    testParsing("comments/20", "// ");
    testParsing("comments/21", "/**/42");
    testParsing("comments/22", "42/**/");
    testParsing("comments/23", "// Hello, world!\n\n//   Another hello\n42");
    testParsing("comments/24", "if (x) { doThat() // Some comment\n }");
    testParsing("comments/25", "if (x) { // Some comment\ndoThat(); }");
    testParsing("comments/26", "if (x) { /* Some comment */ doThat() }");
    testParsing("comments/27", "if (x) { doThat() /* Some comment */ }");
    testParsing("comments/28", "switch (answer) { case 42: /* perfect */ bingo() }");
    testParsing("comments/29", "switch (answer) { case 42: bingo() /* perfect */ }");
    testParsing("comments/30", "/* header */ (function(){ var version = 1; }).call(this)");
    testParsing("comments/31", "(function(){ var version = 1; /* sync */ }).call(this)");
    testParsing("comments/32", "function f() { /* infinite */ while (true) { } /* bar */ var each; }");
    testParsing("comments/33", "<!-- foo");
    testParsing("comments/34", "var x = 1<!--foo");
    testParsing("comments/35", "--> comment");
    testParsing("comments/36", "<!-- comment");
    testParsing("comments/37", " \t --> comment");
    testParsing("comments/38", " \t /* block comment */  --> comment");
    testParsing("comments/39", "/* block comment */--> comment");
    testParsing("comments/40", "/* not comment*/; i-->0");
    testParsing("comments/41", "while (i-->0) {}");

    // Primary Expression
    testParsing("expression/primary/00", "this\n");
    testParsing("expression/primary/01", "null\n");
    testParsing("expression/primary/02", "\n    42\n\n");
    testParsing("expression/primary/03", "(1 + 2 ) * 3");

    // Grouping Operator
    testParsing("expression/grouping/00", "(1) + (2  ) + 3");
    testParsing("expression/grouping/01", "4 + 5 << (6)");

    // Array Initializer
    testParsing("expression/array/00", "x = []");
    testParsing("expression/array/01", "x = [ ]");
    testParsing("expression/array/02", "x = [ 42 ]");
    testParsing("expression/array/03", "x = [ 42, ]");
    testParsing("expression/array/04", "x = [ ,, 42 ]");
    testParsing("expression/array/05", "x = [ 1, 2, 3, ]");
    testParsing("expression/array/06", "x = [ 1, 2,, 3, ]");

    // Object Initializer
    testParsing("expression/object/00", "x = {}");
    testParsing("expression/object/01", "x = { }");
    testParsing("expression/object/02", "x = { answer: 42 }");
    testParsing("expression/object/03", "x = { if: 42 }");
    testParsing("expression/object/04", "x = { true: 42 }");
    testParsing("expression/object/05", "x = { false: 42 }");
    testParsing("expression/object/06", "x = { null: 42 }");
    testParsing("expression/object/07", "x = { \"answer\": 42 }");
    testParsing("expression/object/08", "x = { x: 1, x: 2 }");
    testParsing("expression/object/09", "x = { get width() { return m_width } }");
    testParsing("expression/object/10", "x = { get undef() {} }");
    testParsing("expression/object/11", "x = { get if() {} }");
    testParsing("expression/object/12", "x = { get true() {} }");
    testParsing("expression/object/13", "x = { get false() {} }");
    testParsing("expression/object/14", "x = { get null() {} }");
    testParsing("expression/object/15", "x = { get \"undef\"() {} }");
    testParsing("expression/object/16", "x = { get 10() {} }");
    testParsing("expression/object/17", "x = { set width(w) { m_width = w } }");
    testParsing("expression/object/18", "x = { set if(w) { m_if = w } }");
    testParsing("expression/object/19", "x = { set true(w) { m_true = w } }");
    testParsing("expression/object/20", "x = { set false(w) { m_false = w } }");
    testParsing("expression/object/21", "x = { set null(w) { m_null = w } }");
    testParsing("expression/object/22", "x = { set \"null\"(w) { m_null = w } }");
    testParsing("expression/object/23", "x = { set 10(w) { m_null = w } }");
    testParsing("expression/object/24", "x = { get: 42 }");
    testParsing("expression/object/25", "x = { set: 43 }");
    testParsing("expression/object/26", "x = { __proto__: 2 }");
    testParsing("expression/object/27", "x = {\"__proto__\": 2 }");
    testParsing("expression/object/28",
        "x = { get width() { return m_width }, set width(width) { m_width = width; } }");

    // Numeric Literals
    testParsing("expression/numeric/00", "0");
    testParsing("expression/numeric/01", "3");
    testParsing("expression/numeric/02", "5");
    testParsing("expression/numeric/03", "42");
    testParsing("expression/numeric/04", ".14");
    testParsing("expression/numeric/05", "3.14159");
    testParsing("expression/numeric/06", "6.02214179e+23");
    testParsing("expression/numeric/07", "1.492417830e-10");
    testParsing("expression/numeric/08", "0x0");
    testParsing("expression/numeric/09", "0x0;");
    testParsing("expression/numeric/10", "0e+100 ");
    testParsing("expression/numeric/11", "0e+100");
    testParsing("expression/numeric/12", "0xabc");
    testParsing("expression/numeric/13", "0xdef");
    testParsing("expression/numeric/14", "0X1A");
    testParsing("expression/numeric/15", "0x10");
    testParsing("expression/numeric/16", "0x100");
    testParsing("expression/numeric/17", "0X04");
    testParsing("expression/numeric/18", "02");
    testParsing("expression/numeric/19", "012");
    testParsing("expression/numeric/20", "0012");

    // String Literals
    testParsing("expression/string/00", "\"Hello\"");
    testParsing("expression/string/01", "\"\\n\\r\\t\\v\\b\\f\\\\\\'\\\"\\0\"");
    testParsing("expression/string/02", "\"\\u0061\"");
    testParsing("expression/string/03", "\"\\x61\"");
    testParsing("expression/string/04", "\"\\u00\"");
    testParsing("expression/string/05", "\"\\xt\"");
    testParsing("expression/string/06", "\"Hello\\nworld\"");
    testParsing("expression/string/07", "\"Hello\\\nworld\"");
    testParsing("expression/string/08", "\"Hello\\02World\"");
    testParsing("expression/string/09", "\"Hello\\012World\"");
    testParsing("expression/string/10", "\"Hello\\122World\"");
    testParsing("expression/string/11", "\"Hello\\0122World\"");
    testParsing("expression/string/12", "\"Hello\\312World\"");
    testParsing("expression/string/13", "\"Hello\\412World\"");
    testParsing("expression/string/14", "\"Hello\\812World\"");
    testParsing("expression/string/15", "\"Hello\\712World\"");
    testParsing("expression/string/16", "\"Hello\\0World\"");
    testParsing("expression/string/17", "\"Hello\\\r\nworld\"");
    testParsing("expression/string/18", "\"Hello\\1World\"");

    // Regular Expression Literals
    testParsing("expression/regexp/00", "var x = /[a-z]/i");
    testParsing("expression/regexp/01", "var x = /[x-z]/i");
    testParsing("expression/regexp/02", "var x = /[a-c]/i");
    testParsing("expression/regexp/03", "var x = /[P QR]/i");
    testParsing("expression/regexp/04", "var x = /[\\]/]/");
    testParsing("expression/regexp/05", "var x = /foo\\/bar/");
    testParsing("expression/regexp/06", "var x = /=([^=\\s])+/g");
    // testParser("expression/regexp/07", "var x = /[P QR]/\\g");
    testParsing("expression/regexp/08", "var x = /42/g.test");

    // Left-Hand-Side Expression
    testParsing("expression/lhs/00", "new Button");
    testParsing("expression/lhs/01", "new Button()");
    testParsing("expression/lhs/02", "new new foo");
    testParsing("expression/lhs/03", "new new foo()");
    testParsing("expression/lhs/04", "new foo().bar()");
    testParsing("expression/lhs/05", "new foo[bar]");
    testParsing("expression/lhs/06", "new foo.bar()");
    testParsing("expression/lhs/07", "( new foo).bar()");
    testParsing("expression/lhs/08", "foo(bar, baz)");
    testParsing("expression/lhs/09", "(    foo  )()");
    testParsing("expression/lhs/10", "universe.milkyway");
    testParsing("expression/lhs/11", "universe.milkyway.solarsystem");
    testParsing("expression/lhs/12", "universe.milkyway.solarsystem.Earth");
    testParsing("expression/lhs/13", "universe[galaxyName, otherUselessName]");
    testParsing("expression/lhs/14", "universe[galaxyName]");
    testParsing("expression/lhs/15", "universe[42].galaxies");
    testParsing("expression/lhs/16", "universe(42).galaxies");
    testParsing("expression/lhs/17", "universe(42).galaxies(14, 3, 77).milkyway");
    testParsing("expression/lhs/18", "earth.asia.Indonesia.prepareForElection(2014)");
    testParsing("expression/lhs/19", "universe.if");
    testParsing("expression/lhs/20", "universe.true");
    testParsing("expression/lhs/21", "universe.false");
    testParsing("expression/lhs/22", "universe.null");

    // Postfix Expressions
    testParsing("expression/postfix/00", "x++");
    testParsing("expression/postfix/01", "x--");
    testParsing("expression/postfix/02", "eval++");
    testParsing("expression/postfix/03", "eval--");
    testParsing("expression/postfix/04", "arguments++");
    testParsing("expression/postfix/05", "arguments--");

    // Unary Operators
    testParsing("expression/unary/00", "++x");
    testParsing("expression/unary/01", "--x");
    testParsing("expression/unary/02", "++eval");
    testParsing("expression/unary/03", "--eval");
    testParsing("expression/unary/04", "++arguments");
    testParsing("expression/unary/05", "--arguments");
    testParsing("expression/unary/06", "+x");
    testParsing("expression/unary/07", "-x");
    testParsing("expression/unary/08", "~x");
    testParsing("expression/unary/09", "!x");
    testParsing("expression/unary/10", "void x");
    testParsing("expression/unary/11", "delete x");
    testParsing("expression/unary/12", "typeof x");

    // Multiplicative Operators
    testParsing("expression/mul/00", "x * y");
    testParsing("expression/mul/01", "x / y");
    testParsing("expression/mul/02", "x % y");

    // Additive Operators
    testParsing("expression/add/00", "x + y");
    testParsing("expression/add/01", "x - y");
    testParsing("expression/add/02", "\"use strict\" + 42");

    // Bitwise Shift Operator
    testParsing("expression/shift/00", "x << y");
    testParsing("expression/shift/01", "x >> y");
    testParsing("expression/shift/02", "x >>> y");

    // Relational Operators
    testParsing("expression/rel/00", "x < y");
    testParsing("expression/rel/01", "x > y");
    testParsing("expression/rel/02", "x <= y");
    testParsing("expression/rel/03", "x >= y");
    testParsing("expression/rel/04", "x in y");
    testParsing("expression/rel/05", "x instanceof y");
    testParsing("expression/rel/06", "x < y < z");

    // Equality Operators
    testParsing("expression/eq/00", "x == y");
    testParsing("expression/eq/01", "x != y");
    testParsing("expression/eq/02", "x === y");
    testParsing("expression/eq/03", "x !== y");

    // Binary Bitwise Operators
    testParsing("expression/bit/00", "x & y");
    testParsing("expression/bit/01", "x ^ y");
    testParsing("expression/bit/02", "x | y");

    // Binary Expressions
    testParsing("expression/binary/00", "x + y + z");
    testParsing("expression/binary/01", "x - y + z");
    testParsing("expression/binary/02", "x + y - z");
    testParsing("expression/binary/03", "x - y - z");
    testParsing("expression/binary/04", "x + y * z");
    testParsing("expression/binary/05", "x + y / z");
    testParsing("expression/binary/06", "x - y % z");
    testParsing("expression/binary/07", "x * y * z");
    testParsing("expression/binary/08", "x * y / z");
    testParsing("expression/binary/09", "x * y % z");
    testParsing("expression/binary/10", "x % y * z");
    testParsing("expression/binary/11", "x << y << z");
    testParsing("expression/binary/12", "x | y | z");
    testParsing("expression/binary/13", "x & y & z");
    testParsing("expression/binary/14", "x ^ y ^ z");
    testParsing("expression/binary/15", "x & y | z");
    testParsing("expression/binary/16", "x | y ^ z");
    testParsing("expression/binary/17", "x | y & z");

    // Binary Logical Operators
    testParsing("expression/logic/00", "x || y");
    testParsing("expression/logic/01", "x && y");
    testParsing("expression/logic/02", "x || y || z");
    testParsing("expression/logic/03", "x && y && z");
    testParsing("expression/logic/04", "x || y && z");
    testParsing("expression/logic/05", "x || y ^ z");

    // Conditional Operator
    testParsing("expression/cond/00", "y ? 1 : 2");
    testParsing("expression/cond/01", "x && y ? 1 : 2");
    testParsing("expression/cond/02", "x = (0) ? 1 : 2");

    // Assignment Operators
    testParsing("expression/assignment/00", "x = 42");
    testParsing("expression/assignment/01", "eval = 42");
    testParsing("expression/assignment/02", "arguments = 42");
    testParsing("expression/assignment/03", "x *= 42");
    testParsing("expression/assignment/04", "x /= 42");
    testParsing("expression/assignment/05", "x %= 42");
    testParsing("expression/assignment/06", "x += 42");
    testParsing("expression/assignment/07", "x -= 42");
    testParsing("expression/assignment/08", "x <<= 42");
    testParsing("expression/assignment/09", "x >>= 42");
    testParsing("expression/assignment/10", "x >>>= 42");
    testParsing("expression/assignment/11", "x &= 42");
    testParsing("expression/assignment/12", "x ^= 42");
    testParsing("expression/assignment/13", "x |= 42");
    testParsing("expression/assignment/16", "'use strict'; eval[0] = 42");
    testParsing("expression/assignment/17", "'use strict'; arguments[0] = 42");

    // Complex Expression
    testParsing("expression/complex", "a || b && c | d ^ e & f == g < h >>> i + j * k");

    // Block
    testParsing("statement/block/00", "{ foo }");
    testParsing("statement/block/01", "{ doThis(); doThat(); }");
    testParsing("statement/block/02", "{}");

    // Variable Statement
    testParsing("statement/var/00", "var x");
    testParsing("statement/var/01", "var x, y;");
    testParsing("statement/var/02", "var x = 42");
    testParsing("statement/var/03", "var eval = 42, arguments = 42");
    testParsing("statement/var/04", "var x = 14, y = 3, z = 1977");
    testParsing("statement/var/05", "var implements, interface, package");
    testParsing("statement/var/06", "var private, protected, public, static");

    // Let Statement
    testParsing("statement/let/00", "let x");
    testParsing("statement/let/01", "{ let x }");
    testParsing("statement/let/02", "{ let x = 42 }");
    testParsing("statement/let/03", "{ let x = 14, y = 3, z = 1977 }");

    // Const Statement
    testParsing("statement/const/00", "const x = 42");
    testParsing("statement/const/01", "{ const x = 42 }");
    testParsing("statement/const/02", "{ const x = 14, y = 3, z = 1977 }");

    // Empty Statement
    testParsing("statement/empty", ";");

    // Expression Statement
    testParsing("statement/expression/00", "x");
    testParsing("statement/expression/01", "x, y");
    testParsing("statement/expression/02", "\\u0061");
    testParsing("statement/expression/03", "a\\u0061");
    testParsing("statement/expression/04", "\\u0061a");
    testParsing("statement/expression/05", "\\u0061a ");

    // If Statement
    testParsing("statement/if/00", "if (morning) goodMorning()");
    testParsing("statement/if/01", "if (morning) (function(){})");
    testParsing("statement/if/02", "if (morning) var x = 0;");
    testParsing("statement/if/03", "if (morning) function a(){}");
    testParsing("statement/if/04", "if (morning) goodMorning(); else goodDay()");

    // Iteration Statements
    testParsing("statement/iteration/00", "do keep(); while (true)");
    testParsing("statement/iteration/01", "do keep(); while (true);");
    testParsing("statement/iteration/02", "do { x++; y--; } while (x < 10)");
    testParsing("statement/iteration/03", "{ do { } while (false) false }");
    testParsing("statement/iteration/04", "while (true) doSomething()");
    testParsing("statement/iteration/05", "while (x < 10) { x++; y--; }");
    testParsing("statement/iteration/06", "for(;;);");
    testParsing("statement/iteration/07", "for(;;){}");
    testParsing("statement/iteration/08", "for(x = 0;;);");
    testParsing("statement/iteration/09", "for(var x = 0;;);");
    testParsing("statement/iteration/10", "for(let x = 0;;);");
    testParsing("statement/iteration/11", "for(var x = 0, y = 1;;);");
    testParsing("statement/iteration/12", "for(x = 0; x < 42;);");
    testParsing("statement/iteration/13", "for(x = 0; x < 42; x++);");
    testParsing("statement/iteration/14", "for(x = 0; x < 42; x++) process(x);");
    testParsing("statement/iteration/15", "for(x in list) process(x);");
    testParsing("statement/iteration/16", "for (var x in list) process(x);");
    testParsing("statement/iteration/17", "for (var x = 42 in list) process(x);");
    testParsing("statement/iteration/18", "for (let x in list) process(x);");
    testParsing("statement/iteration/19", "for (var x = y = z in q);");
    testParsing("statement/iteration/20", "for (var a = b = c = (d in e) in z);");
    testParsing("statement/iteration/21", "for (var i = function() { return 10 in [] } in list) process(x);");

    // continue body
    testParsing("statement/continue/00", "while (true) { continue; }");
    testParsing("statement/continue/01", "while (true) { continue }");
    testParsing("statement/continue/02", "done: while (true) { continue done }");
    testParsing("statement/continue/03", "done: while (true) { continue done; }");
    testParsing("statement/continue/04", "__proto__: while (true) { continue __proto__; }");

    // break body
    testParsing("statement/break/00", "while (true) { break }");
    testParsing("statement/break/01", "done: while (true) { break done }");
    testParsing("statement/break/02", "done: while (true) { break done; }");
    testParsing("statement/break/03", "__proto__: while (true) { break __proto__; }");

    // return body
    testParsing("statement/return/00", "(function(){ return })");
    testParsing("statement/return/01", "(function(){ return; })");
    testParsing("statement/return/02", "(function(){ return x; })");
    testParsing("statement/return/03", "(function(){ return x * y })");

    // with body
    testParsing("statement/with/00", "with (x) foo = bar");
    testParsing("statement/with/01", "with (x) foo = bar;");
    testParsing("statement/with/02", "with (x) { foo = bar }");

    // switch body
    testParsing("statement/switch/00", "switch (x) {}");
    testParsing("statement/switch/01", "switch (answer) { case 42: hi(); break; }");
    testParsing("statement/switch/02", "switch (answer) { case 42: hi(); break; default: break }");

    // Labelled Statements
    testParsing("statement/labeled/00", "start: for (;;) break start");
    testParsing("statement/labeled/01", "start: while (true) break start");
    testParsing("statement/labeled/02", "__proto__: test");

    // throw body
    testParsing("statement/throw/00", "throw x;");
    testParsing("statement/throw/01", "throw x * y");
    testParsing("statement/throw/02", "throw { message: \"Error\" }");

    // try body
    testParsing("statement/try/00", "try { } catch (e) { }");
    testParsing("statement/try/01", "try { } catch (eval) { }");
    testParsing("statement/try/02", "try { } catch (arguments) { }");
    testParsing("statement/try/03", "try { } catch (e) { say(e) }");
    testParsing("statement/try/04", "try { } finally { cleanup(stuff) }");
    testParsing("statement/try/05", "try { doThat(); } catch (e) { say(e) }");
    testParsing("statement/try/06", "try { doThat(); } catch (e) { say(e) } finally { cleanup(stuff) }");

    // debugger body
    testParsing("statement/debugger", "debugger;");

    // FunctionId Definition
    testParsing("statement/functionDecl/00", "function hello() { sayHi(); }");
    testParsing("statement/functionDecl/01", "function eval() { }");
    testParsing("statement/functionDecl/02", "function arguments() { }");
    testParsing("statement/functionDecl/03", "function test(t, t) { }");
    testParsing("statement/functionDecl/04", "(function test(t, t) { })");
    testParsing("statement/functionDecl/05", "function eval() { function inner() { \"use strict\" } }");
    testParsing("statement/functionDecl/06", "function hello(a) { sayHi(); }");
    testParsing("statement/functionDecl/07", "function hello(a, b) { sayHi(); }");
    testParsing("statement/functionDecl/08", "var hi = function() { sayHi() };");
    testParsing("statement/functionDecl/09", "var hi = function eval() { };");
    testParsing("statement/functionDecl/10", "var hi = function arguments() { };");
    testParsing("statement/functionDecl/11", "var hello = function hi() { sayHi() };");
    testParsing("statement/functionDecl/12", "(function(){})");
    testParsing("statement/functionDecl/13", "function universe(__proto__) { }");
    testParsing("statement/functionDecl/14", "function test() { \"use strict\" + 42; }");

    // Automatic semicolon insertion
    testParsing("asi/00", "{ x\n++y }");
    testParsing("asi/01", "{ x\n--y }");
    testParsing("asi/02", "var x /* comment */;");
    testParsing("asi/03", "{ var x = 14, y = 3\nz; }");
    testParsing("asi/04", "while (true) { continue\nthere; }");
    testParsing("asi/05", "while (true) { continue // Comment\nthere; }");
    testParsing("asi/06", "while (true) { continue /* Multiline\nComment */there; }");
    testParsing("asi/07", "while (true) { break\nthere; }");
    testParsing("asi/08", "while (true) { break // Comment\nthere; }");
    testParsing("asi/09", "while (true) { break /* Multiline\nComment */there; }");
    testParsing("asi/10", "(function(){ return\nx; })");
    testParsing("asi/11", "(function(){ return // Comment\nx; })");
    testParsing("asi/12", "(function(){ return/* Multiline\nComment */x; })");
    testParsing("asi/13", "{ throw error\nerror; }");
    testParsing("asi/14", "{ throw error// Comment\nerror; }");
    testParsing("asi/15", "{ throw error/* Multiline\nComment */error; }");

    // Directive Prolog
    // FIXME: heuristic converter cannot handle information loss in SpiderMonkey Parse API.
    // testParsing("directive/00", "(function () { 'use\\x20strict'; with (i); }())");
    testParsing("directive/01", "(function () { 'use\\nstrict'; with (i); }())");

    // Whitespace
    testParsing("ws/00",
        "new\u0020\u0009\u000B\u000C\u00A0\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\uFEFFa");
    testParsing("ws/01", "{0\n1\r2\u20283\u20294}");
  });
});
