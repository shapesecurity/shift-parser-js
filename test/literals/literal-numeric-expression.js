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
  describe("literal numeric expression", function () {
    // Numeric Literals
    assertEsprimaEquiv("0");
    assertEsprimaEquiv("3");
    assertEsprimaEquiv("5");
    assertEsprimaEquiv("42");
    assertEsprimaEquiv(".14");
    assertEsprimaEquiv("3.14159");
    assertEsprimaEquiv("6.02214179e+23");
    assertEsprimaEquiv("1.492417830e-10");
    assertEsprimaEquiv("0x0");
    assertEsprimaEquiv("0x0;");
    assertEsprimaEquiv("0e+100 ");
    assertEsprimaEquiv("0e+100");
    assertEsprimaEquiv("0xabc");
    assertEsprimaEquiv("0xdef");
    assertEsprimaEquiv("0X1A");
    assertEsprimaEquiv("0x10");
    assertEsprimaEquiv("0x100");
    assertEsprimaEquiv("0X04");
    assertEsprimaEquiv("02");
    assertEsprimaEquiv("012");
    assertEsprimaEquiv("0012");
    assertEsprimaEquiv("\n    42\n\n");
  });
});
