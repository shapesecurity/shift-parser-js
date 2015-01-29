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
  describe("new expression", function () {
    assertEsprimaEquiv("new a(b,c)");
    assertEsprimaEquiv("new Button");
    assertEsprimaEquiv("new Button()");
    assertEsprimaEquiv("new Button(a)");
    assertEsprimaEquiv("new new foo");
    assertEsprimaEquiv("new new foo()");

    expect(expr(parse("new f(...a)"))).to.be.eql(
      new Shift.NewExpression(
        new Shift.IdentifierExpression(new Shift.Identifier("f")),
        [
          new Shift.SpreadElement(new Shift.IdentifierExpression(new Shift.Identifier("a"))),
        ]
      )
    );
    expect(expr(parse("new f(...a = b)"))).to.be.eql(
      new Shift.NewExpression(
        new Shift.IdentifierExpression(new Shift.Identifier("f")),
        [
          new Shift.SpreadElement(
            new Shift.AssignmentExpression(
              "=",
              new Shift.BindingIdentifier(new Shift.Identifier("a")),
              new Shift.IdentifierExpression(new Shift.Identifier("b"))
            )
          ),
        ]
      )
    );
    expect(expr(parse("new f(...a, ...b)"))).to.be.eql(
      new Shift.NewExpression(
        new Shift.IdentifierExpression(new Shift.Identifier("f")),
        [
          new Shift.SpreadElement(new Shift.IdentifierExpression(new Shift.Identifier("a"))),
          new Shift.SpreadElement(new Shift.IdentifierExpression(new Shift.Identifier("b"))),
        ]
      )
    );
    expect(expr(parse("new f(a, ...b, c)"))).to.be.eql(
      new Shift.NewExpression(
        new Shift.IdentifierExpression(new Shift.Identifier("f")),
        [
          new Shift.IdentifierExpression(new Shift.Identifier("a")),
          new Shift.SpreadElement(new Shift.IdentifierExpression(new Shift.Identifier("b"))),
          new Shift.IdentifierExpression(new Shift.Identifier("c")),
        ]
      )
    );
    expect(expr(parse("new f(...a, b, ...c)"))).to.be.eql(
      new Shift.NewExpression(
        new Shift.IdentifierExpression(new Shift.Identifier("f")),
        [
          new Shift.SpreadElement(new Shift.IdentifierExpression(new Shift.Identifier("a"))),
          new Shift.IdentifierExpression(new Shift.Identifier("b")),
          new Shift.SpreadElement(new Shift.IdentifierExpression(new Shift.Identifier("c"))),
        ]
      )
    );
  });
});
