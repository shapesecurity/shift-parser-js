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
var assertParseSuccess = require('../assertions').assertParseSuccess;

describe("Parser", function () {
  describe("variable declaration statement", function () {
    // Variable Statement
    assertEsprimaEquiv("var x");
    assertEsprimaEquiv("var a;");
    assertEsprimaEquiv("var x, y;");
    assertEsprimaEquiv("var x = 42");
    assertEsprimaEquiv("var eval = 42, arguments = 42");
    assertEsprimaEquiv("var x = 14, y = 3, z = 1977");
    assertEsprimaEquiv("var implements, interface, package");
    assertEsprimaEquiv("var private, protected, public, static");
    assertParseSuccess("var yield;");

    // Let Statement
    assertEsprimaEquiv("let x");
    assertEsprimaEquiv("{ let x }");
    assertEsprimaEquiv("{ let x = 42 }");
    assertEsprimaEquiv("{ let x = 14, y = 3, z = 1977 }");

    // Const Statement
    assertEsprimaEquiv("const x = 42");
    assertEsprimaEquiv("{ const x = 42 }");
    assertEsprimaEquiv("{ const x = 14, y = 3, z = 1977 }");
  });
});
