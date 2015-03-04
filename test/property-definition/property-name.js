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
var testParseFailure = require("../assertions").testParseFailure;

suite("Parser", function () {
  suite("property name", function () {
    testParse("({0x0:0})", expr,
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.StaticPropertyName("0"), new Shift.LiteralNumericExpression(0)),
      ])
    );

    testParse("({2e308:0})", expr,
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.StaticPropertyName("" + 1 / 0), new Shift.LiteralNumericExpression(0)),
      ])
    );

    testParse("({get b() {}})", expr,
      new Shift.ObjectExpression([
        new Shift.Getter(new Shift.StaticPropertyName("b"), new Shift.FunctionBody([], [])),
      ])
    );
    testParse("({set c(x) {}})", expr,
      new Shift.ObjectExpression([
        new Shift.Setter(new Shift.StaticPropertyName("c"), { type: "BindingIdentifier", name: "x" }, new Shift.FunctionBody([], [])),
      ])
    );

    testParse("({__proto__:0})", expr,
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.StaticPropertyName("__proto__"), new Shift.LiteralNumericExpression(0)),
      ])
    );

    testParse("({get __proto__() {}})", expr,
      new Shift.ObjectExpression([
        new Shift.Getter(new Shift.StaticPropertyName("__proto__"), new Shift.FunctionBody([], [])),
      ])
    );

    testParse("({set __proto__(x) {}})", expr,
      new Shift.ObjectExpression([
        new Shift.Setter(new Shift.StaticPropertyName("__proto__"), { type: "BindingIdentifier", name: "x" }, new Shift.FunctionBody([], [])),
      ])
    );

    testParse("({get __proto__() {}, set __proto__(x) {}})", expr,
      new Shift.ObjectExpression([
        new Shift.Getter(new Shift.StaticPropertyName("__proto__"), new Shift.FunctionBody([], [])),
        new Shift.Setter(new Shift.StaticPropertyName("__proto__"), { type: "BindingIdentifier", name: "x" }, new Shift.FunctionBody([], [])),
      ])
    );

    testParse("({[\"nUmBeR\"+9]:\"nein\"})", expr,
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.ComputedPropertyName(
          new Shift.BinaryExpression("+", new Shift.LiteralStringExpression("nUmBeR"), new Shift.LiteralNumericExpression(9))
        ), new Shift.LiteralStringExpression("nein")),
      ])
    );

    testParse("({[2*308]:0})", expr,
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.ComputedPropertyName(
          new Shift.BinaryExpression("*", new Shift.LiteralNumericExpression(2), new Shift.LiteralNumericExpression(308))
        ), new Shift.LiteralNumericExpression(0)),
      ])
    );

    testParse("({get [6+3]() {}, set [5/4](x) {}})", expr,
      new Shift.ObjectExpression([
        new Shift.Getter(new Shift.ComputedPropertyName(
          new Shift.BinaryExpression("+", new Shift.LiteralNumericExpression(6), new Shift.LiteralNumericExpression(3))
        ), new Shift.FunctionBody([], [])),
        new Shift.Setter(new Shift.ComputedPropertyName(
          new Shift.BinaryExpression("/", new Shift.LiteralNumericExpression(5), new Shift.LiteralNumericExpression(4))
        ), { type: "BindingIdentifier", name: "x" }, new Shift.FunctionBody([], [])),
      ])
    );

    testParse("({[6+3]() {}})", expr,
      new Shift.ObjectExpression([
        new Shift.Method(
          false,
          new Shift.ComputedPropertyName(
            new Shift.BinaryExpression("+", new Shift.LiteralNumericExpression(6), new Shift.LiteralNumericExpression(3))
          ),
          [], null, new Shift.FunctionBody([], []))
      ])
    );

    testParse("({3() {}})", expr,
      new Shift.ObjectExpression([
        new Shift.Method(
          false,
          new Shift.StaticPropertyName("3"),
          [], null, new Shift.FunctionBody([], []))
      ])
    );

    testParse("({\"moo\"() {}})", expr,
      new Shift.ObjectExpression([
        new Shift.Method(
          false,
          new Shift.StaticPropertyName("moo"),
          [], null, new Shift.FunctionBody([], []))
      ])
    );

    testParse("({\"oink\"(that, little, piggy) {}})", expr,
      new Shift.ObjectExpression([
        new Shift.Method(
          false,
          new Shift.StaticPropertyName("oink"),
          [{ type: "BindingIdentifier", name: "that" },
            { type: "BindingIdentifier", name: "little" },
            { type: "BindingIdentifier", name: "piggy" }],
          null, new Shift.FunctionBody([], []))
      ])
    );

    testParseFailure("({[1,2]:3})", "Unexpected token ,");
  });
});
