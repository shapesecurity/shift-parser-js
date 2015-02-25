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

var testParseFailure = require('../assertions').testParseFailure;
var testParse = require('../assertions').testParse;

suite("Parser", function () {
  suite("super call", function () {

    testParse("(class extends B { constructor() { super() } });", expr,
      new Shift.ClassExpression(
        null,
        new Shift.IdentifierExpression(new Shift.Identifier("B")),
        [
          new Shift.ClassElement(false,
            new Shift.Method(false, new Shift.StaticPropertyName("constructor"), [], null, new Shift.FunctionBody([], [
              new Shift.ExpressionStatement(new Shift.CallExpression(new Shift.Super, [])),
            ]))
          ),
        ]
      )
    );

    testParse("class A extends B { constructor() { super() } }", stmt,
      new Shift.ClassDeclaration(
        new Shift.BindingIdentifier(new Shift.Identifier("A")),
        new Shift.IdentifierExpression(new Shift.Identifier("B")),
        [
          new Shift.ClassElement(false,
            new Shift.Method(false, new Shift.StaticPropertyName("constructor"), [], null, new Shift.FunctionBody([], [
              new Shift.ExpressionStatement(new Shift.CallExpression(new Shift.Super, [])),
            ]))
          ),
        ]
      )
    );

    testParse("class A extends B { \"constructor\"() { super() } }", stmt,
      new Shift.ClassDeclaration(
        new Shift.BindingIdentifier(new Shift.Identifier("A")),
        new Shift.IdentifierExpression(new Shift.Identifier("B")),
        [
          new Shift.ClassElement(false,
            new Shift.Method(false, new Shift.StaticPropertyName("constructor"), [], null, new Shift.FunctionBody([], [
              new Shift.ExpressionStatement(new Shift.CallExpression(new Shift.Super, [])),
            ]))
          ),
        ]
      )
    );

    testParse("class A extends B { constructor() { ({a: super()}); } }", stmt,
      new Shift.ClassDeclaration(
        new Shift.BindingIdentifier(new Shift.Identifier("A")),
        new Shift.IdentifierExpression(new Shift.Identifier("B")),
        [
          new Shift.ClassElement(false,
            new Shift.Method(false, new Shift.StaticPropertyName("constructor"), [], null, new Shift.FunctionBody([], [
              new Shift.ExpressionStatement(new Shift.ObjectExpression([
                new Shift.DataProperty(new Shift.StaticPropertyName("a"), new Shift.CallExpression(new Shift.Super, [])),
              ])),
            ]))
          ),
        ]
      )
    );

    testParse("class A extends B { constructor() { () => super(); } }", stmt,
      new Shift.ClassDeclaration(
        new Shift.BindingIdentifier(new Shift.Identifier("A")),
        new Shift.IdentifierExpression(new Shift.Identifier("B")),
        [
          new Shift.ClassElement(false,
            new Shift.Method(false, new Shift.StaticPropertyName("constructor"), [], null, new Shift.FunctionBody([], [
              new Shift.ExpressionStatement(new Shift.ArrowExpression([], null,
                new Shift.CallExpression(new Shift.Super, [])
              ))
            ]))
          ),
        ]
      )
    );

    testParse("class A extends B { constructor() { () => { super(); } } }", stmt,
      new Shift.ClassDeclaration(
        new Shift.BindingIdentifier(new Shift.Identifier("A")),
        new Shift.IdentifierExpression(new Shift.Identifier("B")),
        [
          new Shift.ClassElement(false,
            new Shift.Method(false, new Shift.StaticPropertyName("constructor"), [], null, new Shift.FunctionBody([], [
              new Shift.ExpressionStatement(new Shift.ArrowExpression([], null, new Shift.FunctionBody([], [
                new Shift.ExpressionStatement(new Shift.CallExpression(new Shift.Super, [])),
              ])))
            ]))
          ),
        ]
      )
    );

    testParseFailure("function f() { (super)() }", "Unexpected token super");
    testParseFailure("class A extends B { constructor() { super; } }", "Unexpected token super");
    testParseFailure("class A extends B { constructor() { (super)(); } }", "Unexpected token super");
    testParseFailure("class A extends B { constructor() { new super(); } }", "Unexpected token super");

  });

  suite("super member access", function () {

    testParse("({ a() { super.b(); } });", expr,
      new Shift.ObjectExpression([
        new Shift.Method(false, new Shift.StaticPropertyName("a"), [], null, new Shift.FunctionBody([], [
          new Shift.ExpressionStatement(new Shift.CallExpression(new Shift.StaticMemberExpression(new Shift.Super, "b"), [])),
        ])),
      ])
    );

    testParse("({ *a() { super.b = 0; } });", expr,
      new Shift.ObjectExpression([
        new Shift.Method(true, new Shift.StaticPropertyName("a"), [], null, new Shift.FunctionBody([], [
          new Shift.ExpressionStatement(new Shift.AssignmentExpression("=",
            new Shift.StaticMemberExpression(new Shift.Super, "b"),
            new Shift.LiteralNumericExpression(0)
          )),
        ])),
      ])
    );

    testParse("({ get a() { super[0] = 1; } });", expr,
      new Shift.ObjectExpression([
        new Shift.Getter(new Shift.StaticPropertyName("a"), new Shift.FunctionBody([], [
          new Shift.ExpressionStatement(new Shift.AssignmentExpression("=",
            new Shift.ComputedMemberExpression(new Shift.Super, new Shift.LiteralNumericExpression(0)),
            new Shift.LiteralNumericExpression(1)
          )),
        ])),
      ])
    );

    testParse("({ set a(x) { super.b[0] = 1; } });", expr,
      new Shift.ObjectExpression([
        new Shift.Setter(new Shift.StaticPropertyName("a"), new Shift.BindingIdentifier(new Shift.Identifier("x")), new Shift.FunctionBody([], [
          new Shift.ExpressionStatement(new Shift.AssignmentExpression("=",
            new Shift.ComputedMemberExpression(new Shift.StaticMemberExpression(new Shift.Super, "b"), new Shift.LiteralNumericExpression(0)),
            new Shift.LiteralNumericExpression(1)
          )),
        ])),
      ])
    );

    testParse("(class { constructor() { super.x } });", expr,
      new Shift.ClassExpression(null, null, [
        new Shift.ClassElement(false,
          new Shift.Method(false, new Shift.StaticPropertyName("constructor"), [], null, new Shift.FunctionBody([], [
            new Shift.ExpressionStatement(new Shift.StaticMemberExpression(new Shift.Super, "x")),
          ]))
        ),
      ])
    );

    testParse("class A extends B { constructor() { super.x } }", stmt,
      new Shift.ClassDeclaration(
        new Shift.BindingIdentifier(new Shift.Identifier("A")),
        new Shift.IdentifierExpression(new Shift.Identifier("B")),
        [
          new Shift.ClassElement(false,
            new Shift.Method(false, new Shift.StaticPropertyName("constructor"), [], null, new Shift.FunctionBody([], [
              new Shift.ExpressionStatement(new Shift.StaticMemberExpression(new Shift.Super, "x")),
            ]))
          ),
        ]
      )
    );

    testParse("class A { a() { () => super.b; } }", stmt,
      new Shift.ClassDeclaration(
        new Shift.BindingIdentifier(new Shift.Identifier("A")),
        null,
        [
          new Shift.ClassElement(false,
            new Shift.Method(false, new Shift.StaticPropertyName("a"), [], null, new Shift.FunctionBody([], [
              new Shift.ExpressionStatement(new Shift.ArrowExpression([], null,
                new Shift.StaticMemberExpression(new Shift.Super, "b")
              ))
            ]))
          ),
        ]
      )
    );

    testParse("class A { a() { new super.b; } }", stmt,
      new Shift.ClassDeclaration(
        new Shift.BindingIdentifier(new Shift.Identifier("A")),
        null,
        [
          new Shift.ClassElement(false,
            new Shift.Method(false, new Shift.StaticPropertyName("a"), [], null, new Shift.FunctionBody([], [
              new Shift.ExpressionStatement(
                new Shift.NewExpression(new Shift.StaticMemberExpression(new Shift.Super, "b"), []))
            ]))
          ),
        ]
      )
    );

    testParse("class A { a() { new super.b(); } }", stmt,
      new Shift.ClassDeclaration(
        new Shift.BindingIdentifier(new Shift.Identifier("A")),
        null,
        [
          new Shift.ClassElement(false,
            new Shift.Method(false, new Shift.StaticPropertyName("a"), [], null, new Shift.FunctionBody([], [
              new Shift.ExpressionStatement(
                  new Shift.NewExpression(new Shift.StaticMemberExpression(new Shift.Super, "b"), []))
            ]))
          ),
        ]
      )
    );

    testParseFailure("super.a", "Unexpected token super");
    testParseFailure("super[0]()", "Unexpected token super");
    testParseFailure("({ a() { (super).b(); } });", "Unexpected token super");
    testParseFailure("class A extends B { constructor() { (super)(); } }", "Unexpected token super");

  });
});
