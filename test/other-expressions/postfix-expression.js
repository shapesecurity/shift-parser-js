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
  describe("postfix expression", function () {
    // Postfix Expressions
    assertEsprimaEquiv("x++");
    assertEsprimaEquiv("x--");
    assertEsprimaEquiv("eval++");
    assertEsprimaEquiv("eval--");
    assertEsprimaEquiv("arguments++");
    assertEsprimaEquiv("arguments--");
    expect(expr(parse("(x--)--"))).to.be.eql({
      type: 'PostfixExpression',
      operator: '--',
      operand: {
        type: 'PostfixExpression',
        operator: '--',
        operand: {
          type: 'IdentifierExpression',
          identifier: {
            type: 'Identifier',
            name: 'x'
          }
        }
      }
    });
  });
});
