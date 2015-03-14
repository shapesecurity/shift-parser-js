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
var testParse = require("../assertions").testParse;

suite("Parser", function () {
  suite("object expression", function () {

    testParse("({})", expr, { type: "ObjectExpression", properties: [] });

    testParse("+{}", expr,
      { type: "PrefixExpression",
        operand: { type: "ObjectExpression", properties: [] },
        operator: "+" }
    );

    testParse("+{ }", expr,
      { type: "PrefixExpression",
        operand: { type: "ObjectExpression", properties: [] },
        operator: "+" }
    );

    testParse("({ answer: 0 })", expr,
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.StaticPropertyName("answer"), new Shift.LiteralNumericExpression(0)),
      ])
    );

    testParse("({ if: 0 })", expr,
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.StaticPropertyName("if"), new Shift.LiteralNumericExpression(0)),
      ])
    );
    testParse("({ true: 0 })", expr,
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.StaticPropertyName("true"), new Shift.LiteralNumericExpression(0)),
      ])
    );
    testParse("({ false: 0 })", expr,
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.StaticPropertyName("false"), new Shift.LiteralNumericExpression(0)),
      ])
    );
    testParse("({ null: 0 })", expr,
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.StaticPropertyName("null"), new Shift.LiteralNumericExpression(0)),
      ])
    );
    testParse("({ \"answer\": 0 })", expr,
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.StaticPropertyName("answer"), new Shift.LiteralNumericExpression(0)),
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
          new Shift.ReturnStatement({ type: "IdentifierExpression", name: "m_width" }),
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
        { type: "Setter",
          name: new Shift.StaticPropertyName("width"),
          param: { type: "BindingIdentifier", name: "w" },
          body:
            new Shift.FunctionBody([], [
              new Shift.ExpressionStatement({ type: "IdentifierExpression", name: "w" }),
            ])
        },
      ])
    );

    testParse("({ set if(w) { w } })", expr,
      new Shift.ObjectExpression([
        { type: "Setter",
          name: new Shift.StaticPropertyName("if"),
          param: { type: "BindingIdentifier", name: "w" },
          body:
            new Shift.FunctionBody([], [
              new Shift.ExpressionStatement({ type: "IdentifierExpression", name: "w" }),
            ])
        },
      ])
    );

    testParse("({ set true(w) { w } })", expr,
      new Shift.ObjectExpression([
        { type: "Setter",
          name: new Shift.StaticPropertyName("true"),
          param: { type: "BindingIdentifier", name: "w" },
          body:
            new Shift.FunctionBody([], [
              new Shift.ExpressionStatement({ type: "IdentifierExpression", name: "w" }),
            ])
        },
      ])
    );

    testParse("({ set false(w) { w } })", expr,
      new Shift.ObjectExpression([
        { type: "Setter",
          name: new Shift.StaticPropertyName("false"),
          param: { type: "BindingIdentifier", name: "w" },
          body:
            new Shift.FunctionBody([], [
              new Shift.ExpressionStatement({ type: "IdentifierExpression", name: "w" }),
            ]),
        },
      ])
    );

    testParse("({ set null(w) { w } })", expr,
      new Shift.ObjectExpression([
        { type: "Setter",
          name: new Shift.StaticPropertyName("null"),
          param: { type: "BindingIdentifier", name: "w" },
          body:
            new Shift.FunctionBody([], [
              new Shift.ExpressionStatement({ type: "IdentifierExpression", name: "w" }),
            ])
        },
      ])
    );

    testParse("({ set \"null\"(w) { w } })", expr,
      new Shift.ObjectExpression([
        { type: "Setter",
          name: new Shift.StaticPropertyName("null"),
          param: { type: "BindingIdentifier", name: "w" },
          body:
            new Shift.FunctionBody([], [
              new Shift.ExpressionStatement({ type: "IdentifierExpression", name: "w" }),
            ])
        },
      ])
    );

    testParse("({ set 10(w) { w } })", expr,
      new Shift.ObjectExpression([
        { type: "Setter",
          name: new Shift.StaticPropertyName("10"),
          param: { type: "BindingIdentifier", name: "w" },
          body:
            new Shift.FunctionBody([], [
              new Shift.ExpressionStatement({ type: "IdentifierExpression", name: "w" }),
            ])
        },
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
          new Shift.ReturnStatement({ type: "IdentifierExpression", name: "width" }),
        ])),
        { type: "Setter",
          name: new Shift.StaticPropertyName("width"),
          param: { type: "BindingIdentifier", name: "width" },
          body:
            new Shift.FunctionBody([], [
              new Shift.ReturnStatement({ type: "IdentifierExpression", name: "width" }),
            ])
        },
      ])
    );

    testParse("({a:0, get 'b'(){}, set 3(d){}})", expr,
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.StaticPropertyName("a"), new Shift.LiteralNumericExpression(0)),
        new Shift.Getter(new Shift.StaticPropertyName("b"), new Shift.FunctionBody([], [])),
        { type: "Setter",
          name: new Shift.StaticPropertyName("3"),
          param: { type: "BindingIdentifier", name: "d" },
          body: new Shift.FunctionBody([], [])
        },
      ])
    );

    testParse("({a})", expr,
      new Shift.ObjectExpression([
        new Shift.ShorthandProperty("a"),
      ])
    );

    testParse("({a, b: 0, c})", expr,
      new Shift.ObjectExpression([
        new Shift.ShorthandProperty("a"),
        new Shift.DataProperty(
          new Shift.StaticPropertyName("b"),
          new Shift.LiteralNumericExpression(0)
        ),
        new Shift.ShorthandProperty("c"),
      ])
    );

    testParse("({a, b})", expr,
      new Shift.ObjectExpression([
        new Shift.ShorthandProperty("a"),
        new Shift.ShorthandProperty("b"),
      ])
    );

    testParse("({a(){}})", expr,
      new Shift.ObjectExpression([
        { type: "Method",
          isGenerator: false,
          name: new Shift.StaticPropertyName("a"),
          params: { type: "FormalParameters", items: [], rest: null },
          body: new Shift.FunctionBody([], [])
        },
      ])
    );

    testParse("({a(){let a;}})", expr,
      new Shift.ObjectExpression([
        { type: "Method",
          isGenerator: false,
          name: new Shift.StaticPropertyName("a"),
          params: { type: "FormalParameters", items: [], rest: null },
          body:
            new Shift.FunctionBody(
              [],
              [new Shift.VariableDeclarationStatement(
                new Shift.VariableDeclaration(
                  "let",
                  [new Shift.VariableDeclarator({ type: "BindingIdentifier", name: "a" }, null)]
                )
              )]
            )
        },
      ])
    );

    testParse("({a(b){}})", expr,
      new Shift.ObjectExpression([
        { type: "Method",
          isGenerator: false,
          name: new Shift.StaticPropertyName("a"),
          params: { type: "FormalParameters", items: [{ type: "BindingIdentifier", name: "b" }], rest: null },
          body: new Shift.FunctionBody([], [])
        },
      ])
    );

    testParse("({a(b,...c){}})", expr,
      new Shift.ObjectExpression([
        { type: "Method",
          isGenerator: false,
          name: new Shift.StaticPropertyName("a"),
          params:
            { type: "FormalParameters",
              items: [{ type: "BindingIdentifier", name: "b" }],
              rest: { type: "BindingIdentifier", name: "c" }
            },
          body: new Shift.FunctionBody([], [])
        },
      ])
    );

    testParse("({a(b,c){}})", expr,
      new Shift.ObjectExpression([
        { type: "Method",
          isGenerator: false,
          name: new Shift.StaticPropertyName("a"),
          params:
            { type: "FormalParameters",
              items:
                [
                  { type: "BindingIdentifier", name: "b" },
                  { type: "BindingIdentifier", name: "c" },
                ],
              rest: null,
            },
          body: new Shift.FunctionBody([], [])
        },
      ])
    );

    testParse("({a(b,c){let d;}})", expr,
      new Shift.ObjectExpression([
        { type: "Method",
          isGenerator: false,
          name: new Shift.StaticPropertyName("a"),
          params:
            { type: "FormalParameters",
              items:
                [
                  { type: "BindingIdentifier", name: "b" },
                  { type: "BindingIdentifier", name: "c" },
                ],
              rest: null,
            },
          body:
            new Shift.FunctionBody(
              [],
              [new Shift.VariableDeclarationStatement(
                new Shift.VariableDeclaration(
                  "let",
                  [new Shift.VariableDeclarator({ type: "BindingIdentifier", name: "d" }, null)]
                )
              )]
            )
        },
      ])
    );

    testParse("({set a(eval){}})", expr, new Shift.ObjectExpression([
      { type: "Setter",
        name: new Shift.StaticPropertyName("a"),
        param: { type: "BindingIdentifier", name: "eval" },
        body: new Shift.FunctionBody([], [])
      },
    ]));

    testParse("({ set a([{b = 0}]){}, })", expr, new Shift.ObjectExpression([
      { type: "Setter",
        name: new Shift.StaticPropertyName("a"),
        param:
          new Shift.ArrayBinding([
            new Shift.ObjectBinding([
            { type: "BindingPropertyIdentifier", binding: { type: "BindingIdentifier", name: "b" }, init: new Shift.LiteralNumericExpression(0) },
            ]),
          ], null),
        body: new Shift.FunctionBody([], [])
      },
    ]));

  });
});
