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
  describe("interactions", function () {
    // LeftHandSideExpressions
    assertEsprimaEquiv("a.b(b,c)");
    assertEsprimaEquiv("a[b](b,c)");
    assertEsprimaEquiv("new foo().bar()");
    assertEsprimaEquiv("new foo[bar]");
    assertEsprimaEquiv("new foo.bar()");
    assertEsprimaEquiv("( new foo).bar()");
    assertEsprimaEquiv("universe[42].galaxies");
    assertEsprimaEquiv("universe(42).galaxies");
    assertEsprimaEquiv("universe(42).galaxies(14, 3, 77).milkyway");
    assertEsprimaEquiv("earth.asia.Indonesia.prepareForElection(2014)");

    // BinaryExpressions
    assertEsprimaEquiv("a || b && c | d ^ e & f == g < h >>> i + j * k");

    // Comments
    assertEsprimaEquiv("//\n;a;");
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
    assertEsprimaEquiv("while (i-->0) {}");
    assertEsprimaEquiv("var x = 1<!--foo");
    assertEsprimaEquiv("/* not comment*/; i-->0");
  });
});
