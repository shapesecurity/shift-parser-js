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

var assertEsprimaEquiv = require('../assertions').assertEsprimaEquiv;

describe("Parser", function () {
  describe("binary expression", function () {
    assertEsprimaEquiv("1+2;");

    // Binary Bitwise Operators
    assertEsprimaEquiv("x & y");
    assertEsprimaEquiv("x ^ y");
    assertEsprimaEquiv("x | y");

    // Binary Expressions
    assertEsprimaEquiv("x + y + z");
    assertEsprimaEquiv("x - y + z");
    assertEsprimaEquiv("x + y - z");
    assertEsprimaEquiv("x - y - z");
    assertEsprimaEquiv("x + y * z");
    assertEsprimaEquiv("x + y / z");
    assertEsprimaEquiv("x - y % z");
    assertEsprimaEquiv("x * y * z");
    assertEsprimaEquiv("x * y / z");
    assertEsprimaEquiv("x * y % z");
    assertEsprimaEquiv("x % y * z");
    assertEsprimaEquiv("x << y << z");
    assertEsprimaEquiv("x | y | z");
    assertEsprimaEquiv("x & y & z");
    assertEsprimaEquiv("x ^ y ^ z");
    assertEsprimaEquiv("x & y | z");
    assertEsprimaEquiv("x | y ^ z");
    assertEsprimaEquiv("x | y & z");

    // Binary Logical Operators
    assertEsprimaEquiv("x || y");
    assertEsprimaEquiv("x && y");
    assertEsprimaEquiv("x || y || z");
    assertEsprimaEquiv("x && y && z");
    assertEsprimaEquiv("x || y && z");
    assertEsprimaEquiv("x || y ^ z");

    // Multiplicative Operators
    assertEsprimaEquiv("x * y");
    assertEsprimaEquiv("x / y");
    assertEsprimaEquiv("x % y");

    // Additive Operators
    assertEsprimaEquiv("x + y");
    assertEsprimaEquiv("x - y");
    assertEsprimaEquiv("\"use strict\" + 42");

    // Bitwise Shift Operator
    assertEsprimaEquiv("x << y");
    assertEsprimaEquiv("x >> y");
    assertEsprimaEquiv("x >>> y");

    // Relational Operators
    assertEsprimaEquiv("x < y");
    assertEsprimaEquiv("x > y");
    assertEsprimaEquiv("x <= y");
    assertEsprimaEquiv("x >= y");
    assertEsprimaEquiv("x in y");
    assertEsprimaEquiv("x instanceof y");
    assertEsprimaEquiv("x < y < z");

    // Equality Operators
    assertEsprimaEquiv("x == y");
    assertEsprimaEquiv("x != y");
    assertEsprimaEquiv("x === y");
    assertEsprimaEquiv("x !== y");
  });
});
