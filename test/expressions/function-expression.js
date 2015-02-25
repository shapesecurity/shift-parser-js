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

suite("Parser", function () {
  suite("function expression", function () {

    testParse("(function(){})", expr,
      new Shift.FunctionExpression(false, null, [], null, new Shift.FunctionBody([], []))
    );

    testParse("(function x() { y; z() });", expr,
      new Shift.FunctionExpression(false, new Shift.BindingIdentifier(new Shift.Identifier("x")), [], null, new Shift.FunctionBody([], [
        new Shift.ExpressionStatement(new Shift.IdentifierExpression(new Shift.Identifier("y"))),
        new Shift.ExpressionStatement(new Shift.CallExpression(new Shift.IdentifierExpression(new Shift.Identifier("z")), [])),
      ]))
    );

    testParse("(function eval() { });", expr,
      new Shift.FunctionExpression(false, new Shift.BindingIdentifier(new Shift.Identifier("eval")), [], null, new Shift.FunctionBody([], []))
    );

    testParse("(function arguments() { });", expr,
      new Shift.FunctionExpression(false, new Shift.BindingIdentifier(new Shift.Identifier("arguments")), [], null, new Shift.FunctionBody([], []))
    );

    testParse("(function x(y, z) { })", expr,
      new Shift.FunctionExpression(
        false,
        new Shift.BindingIdentifier(new Shift.Identifier("x")),
        [
          new Shift.BindingIdentifier(new Shift.Identifier("y")),
          new Shift.BindingIdentifier(new Shift.Identifier("z"))
        ],
        null,
        new Shift.FunctionBody([], [])
      )
    );

    testParse("(function(a = b){})", expr,
      new Shift.FunctionExpression(
        false,
        null,
        [
          new Shift.BindingWithDefault(
            new Shift.BindingIdentifier(new Shift.Identifier("a")),
            new Shift.IdentifierExpression(new Shift.Identifier("b"))
          )
        ],
        null, new Shift.FunctionBody([], [])
      )
    );

    testParse("(function(...a){})", expr,
      new Shift.FunctionExpression(
        false, null, [], new Shift.BindingIdentifier(new Shift.Identifier("a")), new Shift.FunctionBody([], [])
      )
    );

    testParse("(function(a, ...b){})", expr,
      new Shift.FunctionExpression(
        false, null, [new Shift.BindingIdentifier(new Shift.Identifier("a"))], new Shift.BindingIdentifier(new Shift.Identifier("b")), new Shift.FunctionBody([], [])
      )
    );

    testParse("(function({a}){})", expr,
      new Shift.FunctionExpression(
        false,
        null,
        [
          new Shift.ObjectBinding([
            new Shift.BindingPropertyIdentifier(
              new Shift.BindingIdentifier(new Shift.Identifier("a")),
              null
            )
          ])
        ],
        null,
        new Shift.FunctionBody([], [])
      )
    );

    testParse("(function({a: x, a: y}){})", expr,
      new Shift.FunctionExpression(
        false,
        null,
        [
          new Shift.ObjectBinding([
            new Shift.BindingPropertyProperty(
              new Shift.StaticPropertyName("a"),
              new Shift.BindingIdentifier(new Shift.Identifier("x"))
            ),
            new Shift.BindingPropertyProperty(
              new Shift.StaticPropertyName("a"),
              new Shift.BindingIdentifier(new Shift.Identifier("y"))
            )
          ])
        ],
        null,
        new Shift.FunctionBody([], [])
      )
    );

    testParse("(function([a]){})", expr,
      new Shift.FunctionExpression(
        false,
        null,
        [
          new Shift.ArrayBinding(
            [new Shift.BindingIdentifier(new Shift.Identifier("a"))],
            null
          )
        ],
        null,
        new Shift.FunctionBody([], [])
      )
    );

    testParse("(function({a = 0}){})", expr,
      new Shift.FunctionExpression(
        false,
        null,
        [
          new Shift.ObjectBinding([
            new Shift.BindingPropertyIdentifier(
              new Shift.BindingIdentifier(new Shift.Identifier("a")),
              new Shift.LiteralNumericExpression(0)
            )
          ])
        ],
        null,
        new Shift.FunctionBody([], [])
      )
    );

    testParse("label: !function(){ label:; };", stmt,
      new Shift.LabeledStatement(
        new Shift.Identifier("label"),
        new Shift.ExpressionStatement(new Shift.PrefixExpression("!",
          new Shift.FunctionExpression(false, null, [], null, new Shift.FunctionBody([], [
            new Shift.LabeledStatement(new Shift.Identifier("label"), new Shift.EmptyStatement),
          ]))
        ))
      )
    )

    testParseFailure("(function([]){})", "Unexpected token [");
    testParseFailure("(function(...a, b){})", "Unexpected token ,");
    testParseFailure("(function((a)){})", "Unexpected token (");
    testParseFailure("(function(package){'use strict';})", "Use of future reserved word in strict mode");
  });
});
