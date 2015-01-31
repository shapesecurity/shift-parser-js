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

var testEsprimaEquiv = require('../assertions').testEsprimaEquiv;

describe("Parser", function () {
  describe("binary expression", function () {
    testEsprimaEquiv("1+2;");

    // Binary Bitwise Operators
    testEsprimaEquiv("x & y");
    testEsprimaEquiv("x ^ y");
    testEsprimaEquiv("x | y");

    // Binary Expressions
    testEsprimaEquiv("x + y + z");
    testEsprimaEquiv("x - y + z");
    testEsprimaEquiv("x + y - z");
    testEsprimaEquiv("x - y - z");
    testEsprimaEquiv("x + y * z");
    testEsprimaEquiv("x + y / z");
    testEsprimaEquiv("x - y % z");
    testEsprimaEquiv("x * y * z");
    testEsprimaEquiv("x * y / z");
    testEsprimaEquiv("x * y % z");
    testEsprimaEquiv("x % y * z");
    testEsprimaEquiv("x << y << z");
    testEsprimaEquiv("x | y | z");
    testEsprimaEquiv("x & y & z");
    testEsprimaEquiv("x ^ y ^ z");
    testEsprimaEquiv("x & y | z");
    testEsprimaEquiv("x | y ^ z");
    testEsprimaEquiv("x | y & z");

    // Binary Logical Operators
    testEsprimaEquiv("x || y");
    testEsprimaEquiv("x && y");
    testEsprimaEquiv("x || y || z");
    testEsprimaEquiv("x && y && z");
    testEsprimaEquiv("x || y && z");
    testEsprimaEquiv("x || y ^ z");

    // Multiplicative Operators
    testEsprimaEquiv("x * y");
    testEsprimaEquiv("x / y");
    testEsprimaEquiv("x % y");

    // Additive Operators
    testEsprimaEquiv("x + y");
    testEsprimaEquiv("x - y");
    testEsprimaEquiv("\"use strict\" + 42");

    // Bitwise Shift Operator
    testEsprimaEquiv("x << y");
    testEsprimaEquiv("x >> y");
    testEsprimaEquiv("x >>> y");

    // Relational Operators
    testEsprimaEquiv("x < y");
    testEsprimaEquiv("x > y");
    testEsprimaEquiv("x <= y");
    testEsprimaEquiv("x >= y");
    testEsprimaEquiv("x in y");
    testEsprimaEquiv("x instanceof y");
    testEsprimaEquiv("x < y < z");

    // Equality Operators
    testEsprimaEquiv("x == y");
    testEsprimaEquiv("x != y");
    testEsprimaEquiv("x === y");
    testEsprimaEquiv("x !== y");
  });
});
