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

var expr = require("../helpers").expr;
var stmt = require("../helpers").stmt;
var testParseFailure = require("../assertions").testParseFailure;
var testParse = require("../assertions").testParse;

function id(x) {
  return x;
}

suite("Parser", function () {
  suite("interactions", function () {
    // LiteralNumericExpression and StaticMemberExpression

    testParse("0 .toString", expr,
      new Shift.StaticMemberExpression(new Shift.LiteralNumericExpression(0), "toString")
    );

    testParse("0.0.toString", expr,
      new Shift.StaticMemberExpression(new Shift.LiteralNumericExpression(0), "toString")
    );

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
          { type: "IdentifierExpression", name: "a" },
          "b"
        ),
        [
          { type: "IdentifierExpression", name: "b" },
          { type: "IdentifierExpression", name: "c" },
        ]
      )
    );

    testParse("a[b](b,c)", expr,
      { type: "CallExpression",
        callee:
         { type: "ComputedMemberExpression",
           object: { type: "IdentifierExpression", name: "a" },
           expression: { type: "IdentifierExpression", name: "b" } },
        arguments:
         [ { type: "IdentifierExpression", name: "b" },
           { type: "IdentifierExpression", name: "c" } ] }
    );


    testParse("new foo().bar()", expr,
      new Shift.CallExpression(
        new Shift.StaticMemberExpression(
          new Shift.NewExpression({ type: "IdentifierExpression", name: "foo" }, []),
          "bar"
        ),
        []
      )
    );

    testParse("new foo[bar]", expr,
      { type: "NewExpression",
        callee:
          { type: "ComputedMemberExpression",
            object: { type: "IdentifierExpression", name: "foo" },
            expression: { type: "IdentifierExpression", name: "bar" } },
        arguments: [] }
    );


    testParse("new foo.bar()", expr,
      new Shift.NewExpression(
        new Shift.StaticMemberExpression(
          { type: "IdentifierExpression", name: "foo" },
          "bar"
        ),
        []
      )
    );

    testParse("(new foo).bar()", expr,
      new Shift.CallExpression(
        new Shift.StaticMemberExpression(
          new Shift.NewExpression({ type: "IdentifierExpression", name: "foo" }, []),
          "bar"
        ),
        []
      )
    );

    testParse("a[0].b", expr,
      new Shift.StaticMemberExpression(
        new Shift.ComputedMemberExpression(
          { type: "IdentifierExpression", name: "a" },
          new Shift.LiteralNumericExpression(0)
        ),
        "b"
      )
    );

    testParse("a(0).b", expr,
      new Shift.StaticMemberExpression(
        new Shift.CallExpression(
          { type: "IdentifierExpression", name: "a" },
          [new Shift.LiteralNumericExpression(0)]
        ),
        "b"
      )
    );

    testParse("a(0).b(14, 3, 77).c", expr,
      new Shift.StaticMemberExpression(
        new Shift.CallExpression(
          new Shift.StaticMemberExpression(
            new Shift.CallExpression(
              { type: "IdentifierExpression", name: "a" },
              [new Shift.LiteralNumericExpression(0)]
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
          { type: "IdentifierExpression", name: "a" }, "b"), "c"),
        [new Shift.LiteralNumericExpression(2014)]
      )
    );

    // BinaryExpressions
    testParse("a || b && c | d ^ e & f == g < h >>> i + j * k", expr,
      { type: "BinaryExpression",
        operator: "||",
        left: { type: "IdentifierExpression", name: "a" },
        right:
          { type: "BinaryExpression",
            operator: "&&",
            left: { type: "IdentifierExpression", name: "b" },
            right:
              { type: "BinaryExpression",
                operator: "|",
                left: { type: "IdentifierExpression", name: "c" },
                right:
                  { type: "BinaryExpression",
                    operator: "^",
                    left: { type: "IdentifierExpression", name: "d" },
                    right:
                      { type: "BinaryExpression",
                        operator: "&",
                        left: { type: "IdentifierExpression", name: "e" },
                        right:
                          { type: "BinaryExpression",
                            operator: "==",
                            left: { type: "IdentifierExpression", name: "f" },
                            right:
                              { type: "BinaryExpression",
                                operator: "<",
                                left: { type: "IdentifierExpression", name: "g" },
                                right:
                                  { type: "BinaryExpression",
                                    operator: ">>>",
                                    left: { type: "IdentifierExpression", name: "h" },
                                    right:
                                      { type: "BinaryExpression",
                                        operator: "+",
                                        left: { type: "IdentifierExpression", name: "i" },
                                        right:
                                          { type: "BinaryExpression",
                                            operator: "*",
                                            left: { type: "IdentifierExpression", name: "j" },
                                            right: { type: "IdentifierExpression", name: "k" } } } } } } } } } } }
    );


    // Comments
    testParse("//\n;a;", id,
      { type: "Script",
        body:
          { type: "FunctionBody",
            directives: [],
            statements:
              [ { type: "EmptyStatement" },
                { type: "ExpressionStatement",
                  expression: { type: "IdentifierExpression", name: "a" } } ] } }
    );

    testParse("/* block comment */ 0", expr,
      { type: "LiteralNumericExpression", value: 0 }
    );

    testParse("0 /* block comment 1 */ /* block comment 2 */", id,
      { type: "Script",
        body:
          { type: "FunctionBody",
            directives: [],
            statements:
              [ { type: "ExpressionStatement", expression: { type: "LiteralNumericExpression", value: 0 } } ] } }
    );

    testParse("(a + /* assignment */b ) * c", expr,
      { type: "BinaryExpression",
        operator: "*",
        left:
          { type: "BinaryExpression",
            operator: "+",
            left: { type: "IdentifierExpression", name: "a" },
            right: { type: "IdentifierExpression", name: "b" } },
        right: { type: "IdentifierExpression", name: "c" } }
    );

    testParse("/* assignment */\n a = b", expr,
      new Shift.AssignmentExpression(
        "=",
        { type: "BindingIdentifier", name: "a" },
        { type: "IdentifierExpression", name: "b" }
      )
    );

    testParse("0 /*The*/ /*Answer*/", expr, { type: "LiteralNumericExpression", value: 0 });
    testParse("0 /*the*/ /*answer*/", expr, { type: "LiteralNumericExpression", value: 0 });
    testParse("0 /* the * answer */", expr, { type: "LiteralNumericExpression", value: 0 });
    testParse("0 /* The * answer */", expr, { type: "LiteralNumericExpression", value: 0 });
    testParse("/* multiline\ncomment\nshould\nbe\nignored */ 0", expr,
      { type: "LiteralNumericExpression", value: 0 }
    );
    testParse("/*a\r\nb*/ 0", expr, { type: "LiteralNumericExpression", value: 0 });
    testParse("/*a\rb*/ 0", expr, { type: "LiteralNumericExpression", value: 0 });
    testParse("/*a\nb*/ 0", expr, { type: "LiteralNumericExpression", value: 0 });
    testParse("/*a\nc*/ 0", expr, { type: "LiteralNumericExpression", value: 0 });
    testParse("// line comment\n0", expr, { type: "LiteralNumericExpression", value: 0 });
    testParse("0 // line comment", expr, { type: "LiteralNumericExpression", value: 0 });
    testParse("// Hello, world!\n0", expr, { type: "LiteralNumericExpression", value: 0 });

    testParse("// Hello, world!\n", id,
      { type: "Script", body: { type: "FunctionBody", directives: [], statements: [] } }
    );

    testParse("// Hallo, world!\n", id,
      { type: "Script", body: { type: "FunctionBody", directives: [], statements: [] } }
    );

    testParse("//\n0", expr, { type: "LiteralNumericExpression", value: 0 });

    testParse("//", id,
      { type: "Script", body: { type: "FunctionBody", directives: [], statements: [] } }
    );

    testParse("// ", id,
      { type: "Script", body: { type: "FunctionBody", directives: [], statements: [] } }
    );

    testParse("/**/0", expr, { type: "LiteralNumericExpression", value: 0 });
    testParse("0/**/", expr, { type: "LiteralNumericExpression", value: 0 });
    testParse("// Hello, world!\n\n//   Another hello\n0", expr,
      { type: "LiteralNumericExpression", value: 0 }
    );

    testParse("if (x) { doThat() // Some comment\n }", stmt,
      { type: "IfStatement",
        test: { type: "IdentifierExpression", name: "x" },
        consequent:
          { type: "BlockStatement",
            block:
              { type: "Block",
                statements:
                  [ { type: "ExpressionStatement",
                      expression:
                        { type: "CallExpression",
                          callee: { type: "IdentifierExpression", name: "doThat" },
                          arguments: [] } } ] } },
        alternate: null }
    );

    testParse("if (x) { // Some comment\ndoThat(); }", stmt,
      { type: "IfStatement",
        test: { type: "IdentifierExpression", name: "x" },
        consequent:
          { type: "BlockStatement",
            block:
              { type: "Block",
                statements:
                  [ { type: "ExpressionStatement",
                      expression:
                        { type: "CallExpression",
                          callee: { type: "IdentifierExpression", name: "doThat" },
                          arguments: [] } } ] } },
        alternate: null }
    );

    testParse("if (x) { /* Some comment */ doThat() }", stmt,
      { type: "IfStatement",
        test: { type: "IdentifierExpression", name: "x" },
        consequent:
          { type: "BlockStatement",
            block:
              { type: "Block",
                statements:
                  [ { type: "ExpressionStatement",
                      expression:
                        { type: "CallExpression",
                          callee: { type: "IdentifierExpression", name: "doThat" },
                          arguments: [] } } ] } },
        alternate: null }
    );

    testParse("if (x) { doThat() /* Some comment */ }", stmt,
      { type: "IfStatement",
        test: { type: "IdentifierExpression", name: "x" },
        consequent:
          { type: "BlockStatement",
            block:
              { type: "Block",
                statements:
                  [ { type: "ExpressionStatement",
                      expression:
                        { type: "CallExpression",
                          callee: { type: "IdentifierExpression", name: "doThat" },
                          arguments: [] } } ] } },
        alternate: null }
    );

    testParse("switch (answer) { case 0: /* perfect */ bingo() }", stmt,
      { type: "SwitchStatement",
        discriminant: { type: "IdentifierExpression", name: "answer" },
        cases:
          [ { type: "SwitchCase",
              test: { type: "LiteralNumericExpression", value: 0 },
              consequent:
                [ { type: "ExpressionStatement",
                    expression:
                      { type: "CallExpression",
                        callee: { type: "IdentifierExpression", name: "bingo" },
                        arguments: [] } } ] } ] }
    );

    testParse("switch (answer) { case 0: bingo() /* perfect */ }", stmt,
      { type: "SwitchStatement",
        discriminant: { type: "IdentifierExpression", name: "answer" },
        cases:
          [ { type: "SwitchCase",
              test: { type: "LiteralNumericExpression", value: 0 },
              consequent:
                [ { type: "ExpressionStatement",
                    expression:
                      { type: "CallExpression",
                        callee: { type: "IdentifierExpression", name: "bingo" },
                        arguments: [] } } ] } ] }
    );

    testParse("/* header */ (function(){ var version = 1; }).call(this)", expr,
      new Shift.CallExpression(
        new Shift.StaticMemberExpression(
          new Shift.FunctionExpression(false, null, [], null, new Shift.FunctionBody([], [
            new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
              new Shift.VariableDeclarator({ type: "BindingIdentifier", name: "version" }, new Shift.LiteralNumericExpression(1)),
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
              new Shift.VariableDeclarator({ type: "BindingIdentifier", name: "version" }, new Shift.LiteralNumericExpression(1)),
            ])),
          ])),
          "call"
        ), [new Shift.ThisExpression]
      )
    );
    testParse("function f() { /* infinite */ while (true) { } /* bar */ var each; }", stmt,
      new Shift.FunctionDeclaration(false, { type: "BindingIdentifier", name: "f" }, [], null, new Shift.FunctionBody([], [
        new Shift.WhileStatement(new Shift.LiteralBooleanExpression(true), new Shift.BlockStatement(new Shift.Block([]))),
        new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
          new Shift.VariableDeclarator({ type: "BindingIdentifier", name: "each" }, null)
        ])),
      ]))
    );

    testParse("while (i-->0) {}", stmt,
      { type: "WhileStatement",
        body: { type: "BlockStatement", block: { type: "Block", statements: [] } },
        test:
         { type: "BinaryExpression",
           operator: ">",
           left:
            { type: "PostfixExpression",
              operand: { type: "IdentifierExpression", name: "i" },
              operator: "--" },
           right: { type: "LiteralNumericExpression", value: 0 } } }
    );

    testParse("var x = 1<!--foo", stmt,
      new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
        new Shift.VariableDeclarator({ type: "BindingIdentifier", name: "x" }, new Shift.LiteralNumericExpression(1)),
      ]))
    );

    testParse("/* not comment*/; i-->0", id,
      { type: "Script",
        body:
          { type: "FunctionBody",
            directives: [],
            statements:
              [ { type: "EmptyStatement" },
                { type: "ExpressionStatement",
                  expression:
                    { type: "BinaryExpression",
                      operator: ">",
                      left:
                        { type: "PostfixExpression",
                          operand: { type: "IdentifierExpression", name: "i" },
                          operator: "--" },
                      right: { type: "LiteralNumericExpression", value: 0 } } } ] } }
    );

  });
});
