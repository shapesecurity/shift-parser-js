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

suite("Parser", function () {
  suite("literal numeric expression", function () {
    testEsprimaEquiv("0");
    testEsprimaEquiv("0;");
    testEsprimaEquiv("3");
    testEsprimaEquiv("5");
    testEsprimaEquiv("42");
    testEsprimaEquiv(".14");
    testEsprimaEquiv("3.14159");
    testEsprimaEquiv("6.02214179e+23");
    testEsprimaEquiv("1.492417830e-10");
    testEsprimaEquiv("0x0");
    testEsprimaEquiv("0x0;");
    testEsprimaEquiv("0e+100 ");
    testEsprimaEquiv("0e+100");
    testEsprimaEquiv("0xabc");
    testEsprimaEquiv("0xdef");
    testEsprimaEquiv("0X1A");
    testEsprimaEquiv("0x10");
    testEsprimaEquiv("0x100");
    testEsprimaEquiv("0X04");
    testEsprimaEquiv("02");
    testEsprimaEquiv("012");
    testEsprimaEquiv("0012");
    testEsprimaEquiv("\n    42\n\n");
  });
});
