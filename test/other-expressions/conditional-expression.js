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

var parse = require("../..").default;
var Shift = require("shift-ast");

var expr = require("../helpers").expr;
var assertEsprimaEquiv = require('../assertions').assertEsprimaEquiv;

describe("Parser", function () {
  describe("conditional expression", function () {
    assertEsprimaEquiv("a?b:c");
    assertEsprimaEquiv("y ? 1 : 2");
    assertEsprimaEquiv("x && y ? 1 : 2");
    expect(expr(parse("x = (0) ? 1 : 2"))).to.be.eql(
      new Shift.AssignmentExpression(
        "=",
        new Shift.BindingIdentifier(new Shift.Identifier("x")),
        new Shift.ConditionalExpression(
          new Shift.LiteralNumericExpression(0),
          new Shift.LiteralNumericExpression(1),
          new Shift.LiteralNumericExpression(2)
        )
      )
    );
  });
});
