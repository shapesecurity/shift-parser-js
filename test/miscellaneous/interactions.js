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

var Shift = require("shift-ast");

var expr = require("./../helpers").expr;
var stmt = require("./../helpers").stmt;
var testEsprimaEquiv = require('./../assertions').testEsprimaEquiv;
var testParseFailure = require('./../assertions').testParseFailure;
var testParse = require('./../assertions').testParse;

suite("Parser", function () {
  suite("interactions", function () {
    // LiteralNumericExpression and StaticMemberExpression

    testParse("0..toString", expr,
      new Shift.StaticMemberExpression(new Shift.LiteralNumericExpression(0), "toString")
    );

    testParse("01.toString", expr,
      new Shift.StaticMemberExpression(new Shift.LiteralNumericExpression(1), "toString")
    );

    testParseFailure("0.toString", "Unexpected token ILLEGAL");

    // LeftHandSideExpressions

    testParse("a.b(b, c)", expr,
      new Shift.CallExpression(
        new Shift.StaticMemberExpression(
          new Shift.IdentifierExpression(new Shift.Identifier("a")),
          "b"
        ),
        [
          new Shift.IdentifierExpression(new Shift.Identifier("b")),
          new Shift.IdentifierExpression(new Shift.Identifier("c")),
        ]
      )
    );

    testEsprimaEquiv("a[b](b,c)");

    testParse("new foo().bar()", expr,
      new Shift.CallExpression(
        new Shift.StaticMemberExpression(
          new Shift.NewExpression(new Shift.IdentifierExpression(new Shift.Identifier("foo")), []),
          "bar"
        ),
        []
      )
    );

    testEsprimaEquiv("new foo[bar]");

    testParse("new foo.bar()", expr,
      new Shift.NewExpression(
        new Shift.StaticMemberExpression(
          new Shift.IdentifierExpression(new Shift.Identifier("foo")),
          "bar"
        ),
        []
      )
    );

    testParse("(new foo).bar()", expr,
      new Shift.CallExpression(
        new Shift.StaticMemberExpression(
          new Shift.NewExpression(new Shift.IdentifierExpression(new Shift.Identifier("foo")), []),
          "bar"
        ),
        []
      )
    );

    testParse("a[42].b", expr,
      new Shift.StaticMemberExpression(
        new Shift.ComputedMemberExpression(
          new Shift.IdentifierExpression(new Shift.Identifier("a")),
          new Shift.LiteralNumericExpression(42)
        ),
        "b"
      )
    );

    testParse("a(42).b", expr,
      new Shift.StaticMemberExpression(
        new Shift.CallExpression(
          new Shift.IdentifierExpression(new Shift.Identifier("a")),
          [new Shift.LiteralNumericExpression(42)]
        ),
        "b"
      )
    );

    testParse("a(42).b(14, 3, 77).c", expr,
      new Shift.StaticMemberExpression(
        new Shift.CallExpression(
          new Shift.StaticMemberExpression(
            new Shift.CallExpression(
              new Shift.IdentifierExpression(new Shift.Identifier("a")),
              [new Shift.LiteralNumericExpression(42)]
            ),
            "b"
          ),
          [
            new Shift.LiteralNumericExpression(14),
            new Shift.LiteralNumericExpression(3),
            new Shift.LiteralNumericExpression(77),
          ]
        ),
        "c"
      )
    );

    testParse("a.b.c(2014)", expr,
      new Shift.CallExpression(
        new Shift.StaticMemberExpression(new Shift.StaticMemberExpression(
          new Shift.IdentifierExpression(new Shift.Identifier("a")), "b"), "c"),
        [new Shift.LiteralNumericExpression(2014)]
      )
    );

    // BinaryExpressions
    testEsprimaEquiv("a || b && c | d ^ e & f == g < h >>> i + j * k");

    // Comments
    testEsprimaEquiv("//\n;a;");
    testEsprimaEquiv("/* block comment */ 42");
    testEsprimaEquiv("42 /* block comment 1 */ /* block comment 2 */");
    testEsprimaEquiv("(a + /* assignment */b ) * c");
    testParse("/* assignment */\n a = b", expr,
      new Shift.AssignmentExpression(
        "=",
        new Shift.BindingIdentifier(new Shift.Identifier("a")),
        new Shift.IdentifierExpression(new Shift.Identifier("b"))
      )
    );
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
    testParse("/* header */ (function(){ var version = 1; }).call(this)", expr,
      new Shift.CallExpression(
        new Shift.StaticMemberExpression(
          new Shift.FunctionExpression(false, null, [], null, new Shift.FunctionBody([], [
            new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
              new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("version")), new Shift.LiteralNumericExpression(1)),
            ])),
          ])),
          "call"
        ), [new Shift.ThisExpression]
      )
    );
    testParse("(function(){ var version = 1; /* sync */ }).call(this)", expr,
      new Shift.CallExpression(
        new Shift.StaticMemberExpression(
          new Shift.FunctionExpression(false, null, [], null, new Shift.FunctionBody([], [
            new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
              new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("version")), new Shift.LiteralNumericExpression(1)),
            ])),
          ])),
          "call"
        ), [new Shift.ThisExpression]
      )
    );
    testParse("function f() { /* infinite */ while (true) { } /* bar */ var each; }", stmt,
      new Shift.FunctionDeclaration(false, new Shift.BindingIdentifier(new Shift.Identifier("f")), [], null, new Shift.FunctionBody([], [
        new Shift.WhileStatement(new Shift.LiteralBooleanExpression(true), new Shift.BlockStatement(new Shift.Block([]))),
        new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
          new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("each")), null)
        ])),
      ]))
    );

    testEsprimaEquiv("while (i-->0) {}");
    testParse("var x = 1<!--foo", stmt,
      new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
        new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("x")), new Shift.LiteralNumericExpression(1)),
      ]))
    );
    testEsprimaEquiv("/* not comment*/; i-->0");
  });
});
