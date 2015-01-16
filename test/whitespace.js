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

var assertEsprimaEquiv = require('./assertions').assertEsprimaEquiv;

describe("Parser", function () {
  describe("automatic semicolon insertion", function () {
    assertEsprimaEquiv("{ x\n++y }");
    assertEsprimaEquiv("{ x\n--y }");
    assertEsprimaEquiv("var x /* comment */;");
    assertEsprimaEquiv("{ var x = 14, y = 3\nz; }");
    assertEsprimaEquiv("while (true) { continue\nthere; }");
    assertEsprimaEquiv("while (true) { continue // Comment\nthere; }");
    assertEsprimaEquiv("while (true) { continue /* Multiline\nComment */there; }");
    assertEsprimaEquiv("while (true) { break\nthere; }");
    assertEsprimaEquiv("while (true) { break // Comment\nthere; }");
    assertEsprimaEquiv("while (true) { break /* Multiline\nComment */there; }");
    assertEsprimaEquiv("(function(){ return\nx; })");
    assertEsprimaEquiv("(function(){ return // Comment\nx; })");
    assertEsprimaEquiv("(function(){ return/* Multiline\nComment */x; })");
    assertEsprimaEquiv("{ throw error\nerror; }");
    assertEsprimaEquiv("{ throw error// Comment\nerror; }");
    assertEsprimaEquiv("{ throw error/* Multiline\nComment */error; }");

    assertEsprimaEquiv("new\u0020\u0009\u000B\u000C\u00A0\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\uFEFFa");
    assertEsprimaEquiv("{0\n1\r2\u20283\u20294}");
  });
});
