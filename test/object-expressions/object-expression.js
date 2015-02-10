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
var testEsprimaEquiv = require('../assertions').testEsprimaEquiv;
var testParse = require('../assertions').testParse;

suite("Parser", function () {
  suite("object expression", function () {
    testEsprimaEquiv("({})");
    testEsprimaEquiv("+{}");
    testEsprimaEquiv("+{ }");

    testParse("({ answer: 42 })", expr,
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.StaticPropertyName("answer"), new Shift.LiteralNumericExpression(42)),
      ])
    );

    testParse("({ if: 42 })", expr,
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.StaticPropertyName("if"), new Shift.LiteralNumericExpression(42)),
      ])
    );
    testParse("({ true: 42 })", expr,
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.StaticPropertyName("true"), new Shift.LiteralNumericExpression(42)),
      ])
    );
    testParse("({ false: 42 })", expr,
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.StaticPropertyName("false"), new Shift.LiteralNumericExpression(42)),
      ])
    );
    testParse("({ null: 42 })", expr,
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.StaticPropertyName("null"), new Shift.LiteralNumericExpression(42)),
      ])
    );
    testParse("({ \"answer\": 42 })", expr,
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.StaticPropertyName("answer"), new Shift.LiteralNumericExpression(42)),
      ])
    );
    testParse("({ x: 1, x: 2 })", expr,
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.StaticPropertyName("x"), new Shift.LiteralNumericExpression(1)),
        new Shift.DataProperty(new Shift.StaticPropertyName("x"), new Shift.LiteralNumericExpression(2)),
      ])
    );

    testParse("({ get width() { return m_width } })", expr,
      new Shift.ObjectExpression([
        new Shift.Getter(new Shift.StaticPropertyName("width"), new Shift.FunctionBody([], [
          new Shift.ReturnStatement(new Shift.IdentifierExpression(new Shift.Identifier("m_width"))),
        ])),
      ])
    );
    testParse("({ get undef() {} })", expr,
      new Shift.ObjectExpression([
        new Shift.Getter(new Shift.StaticPropertyName("undef"), new Shift.FunctionBody([], [])),
      ])
    );
    testParse("({ get if() {} })", expr,
      new Shift.ObjectExpression([
        new Shift.Getter(new Shift.StaticPropertyName("if"), new Shift.FunctionBody([], [])),
      ])
    );

    testParse("({ get true() {} })", expr,
      new Shift.ObjectExpression([
        new Shift.Getter(new Shift.StaticPropertyName("true"), new Shift.FunctionBody([], [])),
      ])
    );

    testParse("({ get false() {} })", expr,
      new Shift.ObjectExpression([
        new Shift.Getter(new Shift.StaticPropertyName("false"), new Shift.FunctionBody([], [])),
      ])
    );

    testParse("({ get null() {} })", expr,
      new Shift.ObjectExpression([
        new Shift.Getter(new Shift.StaticPropertyName("null"), new Shift.FunctionBody([], [])),
      ])
    );

    testParse("({ get \"undef\"() {} })", expr,
      new Shift.ObjectExpression([
        new Shift.Getter(new Shift.StaticPropertyName("undef"), new Shift.FunctionBody([], [])),
      ])
    );

    testParse("({ get 10() {} })", expr,
      new Shift.ObjectExpression([
        new Shift.Getter(new Shift.StaticPropertyName("10"), new Shift.FunctionBody([], [])),
      ])
    );

    testParse("({ set width(w) { w } })", expr,
      new Shift.ObjectExpression([
        new Shift.Setter(new Shift.StaticPropertyName("width"), new Shift.Identifier("w"), new Shift.FunctionBody([], [
          new Shift.ExpressionStatement(new Shift.IdentifierExpression(new Shift.Identifier("w"))),
        ])),
      ])
    );

    testParse("({ set if(w) { w } })", expr,
      new Shift.ObjectExpression([
        new Shift.Setter(new Shift.StaticPropertyName("if"), new Shift.Identifier("w"), new Shift.FunctionBody([], [
          new Shift.ExpressionStatement(new Shift.IdentifierExpression(new Shift.Identifier("w"))),
        ])),
      ])
    );

    testParse("({ set true(w) { w } })", expr,
      new Shift.ObjectExpression([
        new Shift.Setter(new Shift.StaticPropertyName("true"), new Shift.Identifier("w"), new Shift.FunctionBody([], [
          new Shift.ExpressionStatement(new Shift.IdentifierExpression(new Shift.Identifier("w"))),
        ])),
      ])
    );

    testParse("({ set false(w) { w } })", expr,
      new Shift.ObjectExpression([
        new Shift.Setter(new Shift.StaticPropertyName("false"), new Shift.Identifier("w"), new Shift.FunctionBody([], [
          new Shift.ExpressionStatement(new Shift.IdentifierExpression(new Shift.Identifier("w"))),
        ])),
      ])
    );

    testParse("({ set null(w) { w } })", expr,
      new Shift.ObjectExpression([
        new Shift.Setter(new Shift.StaticPropertyName("null"), new Shift.Identifier("w"), new Shift.FunctionBody([], [
          new Shift.ExpressionStatement(new Shift.IdentifierExpression(new Shift.Identifier("w"))),
        ])),
      ])
    );

    testParse("({ set \"null\"(w) { w } })", expr,
      new Shift.ObjectExpression([
        new Shift.Setter(new Shift.StaticPropertyName("null"), new Shift.Identifier("w"), new Shift.FunctionBody([], [
          new Shift.ExpressionStatement(new Shift.IdentifierExpression(new Shift.Identifier("w"))),
        ])),
      ])
    );

    testParse("({ set 10(w) { w } })", expr,
      new Shift.ObjectExpression([
        new Shift.Setter(new Shift.StaticPropertyName("10"), new Shift.Identifier("w"), new Shift.FunctionBody([], [
          new Shift.ExpressionStatement(new Shift.IdentifierExpression(new Shift.Identifier("w"))),
        ])),
      ])
    );

    testParse("({ get: 2 })", expr,
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.StaticPropertyName("get"), new Shift.LiteralNumericExpression(2)),
      ])
    );
    testParse("({ set: 2 })", expr,
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.StaticPropertyName("set"), new Shift.LiteralNumericExpression(2)),
      ])
    );
    testParse("({ __proto__: 2 })", expr,
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.StaticPropertyName("__proto__"), new Shift.LiteralNumericExpression(2)),
      ])
    );
    testParse("({\"__proto__\": 2 })", expr,
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.StaticPropertyName("__proto__"), new Shift.LiteralNumericExpression(2)),
      ])
    );

    testParse("({ get width() { return width }, set width(width) { return width; } })", expr,
      new Shift.ObjectExpression([
        new Shift.Getter(new Shift.StaticPropertyName("width"), new Shift.FunctionBody([], [
          new Shift.ReturnStatement(new Shift.IdentifierExpression(new Shift.Identifier("width"))),
        ])),
        new Shift.Setter(new Shift.StaticPropertyName("width"), new Shift.Identifier("width"), new Shift.FunctionBody([], [
          new Shift.ReturnStatement(new Shift.IdentifierExpression(new Shift.Identifier("width"))),
        ])),
      ])
    );

    testParse("({a:0, get 'b'(){}, set 3(d){}})", expr,
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.StaticPropertyName("a"), new Shift.LiteralNumericExpression(0)),
        new Shift.Getter(new Shift.StaticPropertyName("b"), new Shift.FunctionBody([], [])),
        new Shift.Setter(new Shift.StaticPropertyName("3"), new Shift.Identifier("d"), new Shift.FunctionBody([], [])),
      ])
    );

    testParse("({a})", expr,
      new Shift.ObjectExpression([
        new Shift.ShorthandProperty(new Shift.Identifier("a")),
      ])
    );

    testParse("({a, b: 0, c})", expr,
      new Shift.ObjectExpression([
        new Shift.ShorthandProperty(new Shift.Identifier("a")),
        new Shift.DataProperty(
          new Shift.StaticPropertyName("b"),
          new Shift.LiteralNumericExpression(0)
        ),
        new Shift.ShorthandProperty(new Shift.Identifier("c")),
      ])
    );

    testParse("({a, b})", expr,
      new Shift.ObjectExpression([
        new Shift.ShorthandProperty(new Shift.Identifier("a")),
        new Shift.ShorthandProperty(new Shift.Identifier("b")),
      ])
    );

    testParse("({a(){}})", expr,
      new Shift.ObjectExpression([
        new Shift.Method(
          false,
          new Shift.StaticPropertyName("a"),
          [],
          null,
          new Shift.FunctionBody([], [])
        )
      ])
    );

    testParse("({a(){let a;}})", expr,
      new Shift.ObjectExpression([
        new Shift.Method(
          false,
          new Shift.StaticPropertyName("a"),
          [],
          null,
          new Shift.FunctionBody(
            [],
            [new Shift.VariableDeclarationStatement(
              new Shift.VariableDeclaration(
                "let",
                [new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("a")),null)]
              )
            )]
          )
        )
      ])
    );

    testParse("({a(b){}})", expr,
      new Shift.ObjectExpression([
        new Shift.Method(
          false,
          new Shift.StaticPropertyName("a"),
          [new Shift.BindingIdentifier(new Shift.Identifier("b"))],
          null,
          new Shift.FunctionBody([], [])
        )
      ])
    );

    testParse("({a(b,...c){}})", expr,
      new Shift.ObjectExpression([
        new Shift.Method(
          false,
          new Shift.StaticPropertyName("a"),
          [new Shift.BindingIdentifier(new Shift.Identifier("b"))],
          new Shift.BindingIdentifier(new Shift.Identifier("c")),
          new Shift.FunctionBody([], [])
        )
      ])
    );

    testParse("({a(b,c){}})", expr,
      new Shift.ObjectExpression([
        new Shift.Method(
          false,
          new Shift.StaticPropertyName("a"),
          [
            new Shift.BindingIdentifier(new Shift.Identifier("b")),
            new Shift.BindingIdentifier(new Shift.Identifier("c"))
          ],
          null,
          new Shift.FunctionBody([], [])
        )
      ])
    );

    testParse("({a(b,c){let d;}})", expr,
      new Shift.ObjectExpression([
        new Shift.Method(
          false,
          new Shift.StaticPropertyName("a"),
          [
            new Shift.BindingIdentifier(new Shift.Identifier("b")),
            new Shift.BindingIdentifier(new Shift.Identifier("c"))
          ],
          null,
          new Shift.FunctionBody(
            [],
            [new Shift.VariableDeclarationStatement(
              new Shift.VariableDeclaration(
                "let",
                [new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier("d")), null)]
              )
            )]
          )
        )
      ])
    );
  });
});
