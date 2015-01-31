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

var stmt = require("../helpers").stmt;
var testEsprimaEquiv = require('../assertions').testEsprimaEquiv;

suite("Parser", function () {
  suite("variable declaration statement", function () {
    // Variable Statement
    testEsprimaEquiv("var x");
    testEsprimaEquiv("var a;");
    testEsprimaEquiv("var x, y;");
    testEsprimaEquiv("var x = 42");
    testEsprimaEquiv("var eval = 42, arguments = 42");
    testEsprimaEquiv("var x = 14, y = 3, z = 1977");
    testEsprimaEquiv("var implements, interface, package");
    testEsprimaEquiv("var private, protected, public, static");
    expect(stmt(parse("var yield;"))).to.be.eql(
      new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
        new Shift.VariableDeclarator(new Shift.Identifier("yield"), null),
      ]))
    );

    // Let Statement
    testEsprimaEquiv("let x");
    testEsprimaEquiv("{ let x }");
    testEsprimaEquiv("{ let x = 42 }");
    testEsprimaEquiv("{ let x = 14, y = 3, z = 1977 }");

    // Const Statement
    testEsprimaEquiv("const x = 42");
    testEsprimaEquiv("{ const x = 42 }");
    testEsprimaEquiv("{ const x = 14, y = 3, z = 1977 }");
  });
});
