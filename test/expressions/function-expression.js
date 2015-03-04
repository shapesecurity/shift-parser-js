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
      new Shift.FunctionExpression(false, { type: "BindingIdentifier", name: "x" }, [], null, new Shift.FunctionBody([], [
        new Shift.ExpressionStatement({ type: "IdentifierExpression", name: "y" }),
        new Shift.ExpressionStatement(new Shift.CallExpression({ type: "IdentifierExpression", name: "z" }, [])),
      ]))
    );

    testParse("(function eval() { });", expr,
      new Shift.FunctionExpression(false, { type: "BindingIdentifier", name: "eval" }, [], null, new Shift.FunctionBody([], []))
    );

    testParse("(function arguments() { });", expr,
      new Shift.FunctionExpression(false, { type: "BindingIdentifier", name: "arguments" }, [], null, new Shift.FunctionBody([], []))
    );

    testParse("(function x(y, z) { })", expr,
      new Shift.FunctionExpression(
        false,
        { type: "BindingIdentifier", name: "x" },
        [
          { type: "BindingIdentifier", name: "y" },
          { type: "BindingIdentifier", name: "z" }
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
            { type: "BindingIdentifier", name: "a" },
            { type: "IdentifierExpression", name: "b" }
          )
        ],
        null, new Shift.FunctionBody([], [])
      )
    );

    testParse("(function(...a){})", expr,
      new Shift.FunctionExpression(
        false, null, [], { type: "BindingIdentifier", name: "a" }, new Shift.FunctionBody([], [])
      )
    );

    testParse("(function(a, ...b){})", expr,
      new Shift.FunctionExpression(
        false, null, [{ type: "BindingIdentifier", name: "a" }], { type: "BindingIdentifier", name: "b" }, new Shift.FunctionBody([], [])
      )
    );

    testParse("(function({a}){})", expr,
      new Shift.FunctionExpression(
        false,
        null,
        [
          new Shift.ObjectBinding([
            { type: "BindingPropertyIdentifier",
              binding: { type: "BindingIdentifier", name: "a" },
              init: null }
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
              { type: "BindingIdentifier", name: "x" }
            ),
            new Shift.BindingPropertyProperty(
              new Shift.StaticPropertyName("a"),
              { type: "BindingIdentifier", name: "y" }
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
            [{ type: "BindingIdentifier", name: "a" }],
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
            { type: "BindingPropertyIdentifier",
              binding: { type: "BindingIdentifier", name: "a" },
              init: new Shift.LiteralNumericExpression(0) }
          ])
        ],
        null,
        new Shift.FunctionBody([], [])
      )
    );

    testParse("label: !function(){ label:; };", stmt,
      new Shift.LabeledStatement(
        "label",
        new Shift.ExpressionStatement(new Shift.PrefixExpression("!",
          new Shift.FunctionExpression(false, null, [], null, new Shift.FunctionBody([], [
            new Shift.LabeledStatement("label", new Shift.EmptyStatement),
          ]))
        ))
      )
    );

    testParseFailure("(function([]){})", "Unexpected token [");
    testParseFailure("(function(...a, b){})", "Unexpected token ,");
    testParseFailure("(function((a)){})", "Unexpected token (");
    testParseFailure("(function(package){'use strict';})", "Use of future reserved word in strict mode");
  });
});
