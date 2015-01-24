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

var Shift = require("shift-ast");

var expr = require("./helpers").expr;
var stmt = require("./helpers").stmt;
var testEsprimaEquiv = require('./assertions').testEsprimaEquiv;
var testParse = require('./assertions').testParse;
var testParseFailure = require('./assertions').testParseFailure;

suite("Parser", function () {
  suite("automatic semicolon insertion", function () {
    testEsprimaEquiv("{ x\n++y }");
    testEsprimaEquiv("{ x\n--y }");
    testParse("{ var x = 14, y = 3\nz; }", stmt,
      new Shift.BlockStatement(new Shift.Block([
        new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
          new Shift.VariableDeclarator(
            new Shift.BindingIdentifier(new Shift.Identifier("x")),
            new Shift.LiteralNumericExpression(14)
          ),
          new Shift.VariableDeclarator(
            new Shift.BindingIdentifier(new Shift.Identifier("y")),
            new Shift.LiteralNumericExpression(3)
          ),
        ])),
        new Shift.ExpressionStatement(new Shift.IdentifierExpression(new Shift.Identifier("z"))),
      ]))
    );

    testEsprimaEquiv("while (true) { continue\nthere; }");
    testEsprimaEquiv("while (true) { continue // Comment\nthere; }");
    testEsprimaEquiv("while (true) { continue /* Multiline\nComment */there; }");

    testEsprimaEquiv("while (true) { break\nthere; }");
    testEsprimaEquiv("while (true) { break // Comment\nthere; }");
    testEsprimaEquiv("while (true) { break /* Multiline\nComment */there; }");
    testEsprimaEquiv("0 ;");

    testParse("(function(){ return\nx; })", expr,
      new Shift.FunctionExpression(false, null, [], null, new Shift.FunctionBody([], [
        new Shift.ReturnStatement(null),
        new Shift.ExpressionStatement(new Shift.IdentifierExpression(new Shift.Identifier("x"))),
      ]))
    );
    testParse("(function(){ return // Comment\nx; })", expr,
      new Shift.FunctionExpression(false, null, [], null, new Shift.FunctionBody([], [
        new Shift.ReturnStatement(null),
        new Shift.ExpressionStatement(new Shift.IdentifierExpression(new Shift.Identifier("x"))),
      ]))
    );
    testParse("(function(){ return/* Multiline\nComment */x; })", expr,
      new Shift.FunctionExpression(false, null, [], null, new Shift.FunctionBody([], [
        new Shift.ReturnStatement(null),
        new Shift.ExpressionStatement(new Shift.IdentifierExpression(new Shift.Identifier("x"))),
      ]))
    );

    testEsprimaEquiv("{ throw error\nerror; }");
    testEsprimaEquiv("{ throw error// Comment\nerror; }");
    testEsprimaEquiv("{ throw error/* Multiline\nComment */error; }");
    testParseFailure("throw /* \n */ e", "Illegal newline after throw");
    testParseFailure("throw /* \u2028 */ e", "Illegal newline after throw");
    testParseFailure("throw /* \u2029 */ e", "Illegal newline after throw");
    testEsprimaEquiv("throw /* \u202a */ e");
  });

  suite("whitespace characters", function () {
    testEsprimaEquiv("new\u0020\u0009\u000B\u000C\u00A0\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\uFEFFa");
    testEsprimaEquiv("{0\n1\r2\u20283\u20294}");
  });
});
