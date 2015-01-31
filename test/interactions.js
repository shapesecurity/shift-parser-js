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

var expect = require("expect.js");

var parse = require("../").default;
var Shift = require("shift-ast");

var expr = require("./helpers").expr;
var stmt = require("./helpers").stmt;
var testEsprimaEquiv = require('./assertions').testEsprimaEquiv;
var testParseFailure = require('./assertions').testParseFailure;

suite("Parser", function () {
  suite("interactions", function () {
    // LiteralNumericExpression and StaticMemberExpression
    testEsprimaEquiv("0..toString");
    testEsprimaEquiv("01.toString");
    testParseFailure("0.toString", "Unexpected token ILLEGAL");

    // LeftHandSideExpressions
    testEsprimaEquiv("a.b(b,c)");
    testEsprimaEquiv("a[b](b,c)");
    testEsprimaEquiv("new foo().bar()");
    testEsprimaEquiv("new foo[bar]");
    testEsprimaEquiv("new foo.bar()");
    testEsprimaEquiv("( new foo).bar()");
    testEsprimaEquiv("universe[42].galaxies");
    testEsprimaEquiv("universe(42).galaxies");
    testEsprimaEquiv("universe(42).galaxies(14, 3, 77).milkyway");
    testEsprimaEquiv("earth.asia.Indonesia.prepareForElection(2014)");

    // BinaryExpressions
    testEsprimaEquiv("a || b && c | d ^ e & f == g < h >>> i + j * k");

    // Comments
    testEsprimaEquiv("//\n;a;");
    testEsprimaEquiv("/* block comment */ 42");
    testEsprimaEquiv("42 /* block comment 1 */ /* block comment 2 */");
    testEsprimaEquiv("(a + /* assignment */b ) * c");
    testEsprimaEquiv("/* assignment */\n a = b");
    testEsprimaEquiv("42 /*The*/ /*Answer*/");
    testEsprimaEquiv("42 /*the*/ /*answer*/");
    testEsprimaEquiv("42 /* the * answer */");
    testEsprimaEquiv("42 /* The * answer */");
    testEsprimaEquiv("/* multiline\ncomment\nshould\nbe\nignored */ 42");
    testEsprimaEquiv("/*a\r\nb*/ 42");
    testEsprimaEquiv("/*a\rb*/ 42");
    testEsprimaEquiv("/*a\nb*/ 42");
    testEsprimaEquiv("/*a\nc*/ 42");
    testEsprimaEquiv("// line comment\n42");
    testEsprimaEquiv("42 // line comment");
    testEsprimaEquiv("// Hello, world!\n42");
    testEsprimaEquiv("// Hello, world!\n");
    testEsprimaEquiv("// Hallo, world!\n");
    testEsprimaEquiv("//\n42");
    testEsprimaEquiv("//");
    testEsprimaEquiv("// ");
    testEsprimaEquiv("/**/42");
    testEsprimaEquiv("42/**/");
    testEsprimaEquiv("// Hello, world!\n\n//   Another hello\n42");
    testEsprimaEquiv("if (x) { doThat() // Some comment\n }");
    testEsprimaEquiv("if (x) { // Some comment\ndoThat(); }");
    testEsprimaEquiv("if (x) { /* Some comment */ doThat() }");
    testEsprimaEquiv("if (x) { doThat() /* Some comment */ }");
    testEsprimaEquiv("switch (answer) { case 42: /* perfect */ bingo() }");
    testEsprimaEquiv("switch (answer) { case 42: bingo() /* perfect */ }");

    test(function () {
      expect(expr(parse("/* header */ (function(){ var version = 1; }).call(this)"))).to.be.eql(
        new Shift.CallExpression(
          new Shift.StaticMemberExpression(
            new Shift.FunctionExpression(null, [], new Shift.FunctionBody([], [
              new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
                new Shift.VariableDeclarator(new Shift.Identifier("version"), new Shift.LiteralNumericExpression(1)),
              ])),
            ])),
            new Shift.Identifier("call")
          ),
          [new Shift.ThisExpression]
        )
      );
    });

    expect(expr(parse("(function(){ var version = 1; /* sync */ }).call(this)"))).to.be.eql(
      new Shift.CallExpression(
        new Shift.StaticMemberExpression(
          new Shift.FunctionExpression(null, [], new Shift.FunctionBody([], [
            new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
              new Shift.VariableDeclarator(new Shift.Identifier("version"), new Shift.LiteralNumericExpression(1)),
            ])),
          ])),
          new Shift.Identifier("call")
        ),
        [new Shift.ThisExpression]
      )
    );
    expect(stmt(parse("function f() { /* infinite */ while (true) { } /* bar */ var each; }"))).to.be.eql(
      new Shift.FunctionDeclaration(new Shift.Identifier("f"), [], new Shift.FunctionBody([], [
        new Shift.WhileStatement(new Shift.LiteralBooleanExpression(true), new Shift.BlockStatement(new Shift.Block([]))),
        new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
          new Shift.VariableDeclarator(new Shift.Identifier("each"), null)
        ])),
      ]))
    );
    testEsprimaEquiv("while (i-->0) {}");
    testEsprimaEquiv("var x = 1<!--foo");
    testEsprimaEquiv("/* not comment*/; i-->0");
  });
});
