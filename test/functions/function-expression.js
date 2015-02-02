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

var expr = require("../helpers").expr;
var testParse = require("../assertions").testParse;

suite("Parser", function () {
  suite("literal numeric expression", function () {
    testParse("(function(){})", expr,
      new Shift.FunctionExpression(null, [], new Shift.FunctionBody([], []))
    );
    testParse("(function x() { y; z() });", expr,
      new Shift.FunctionExpression(new Shift.Identifier("x"), [], new Shift.FunctionBody([], [
        new Shift.ExpressionStatement(new Shift.IdentifierExpression(new Shift.Identifier("y"))),
        new Shift.ExpressionStatement(new Shift.CallExpression(new Shift.IdentifierExpression(new Shift.Identifier("z")), [])),
      ]))
    );
    testParse("(function eval() { });", expr,
      new Shift.FunctionExpression(new Shift.Identifier("eval"), [], new Shift.FunctionBody([], []))
    );
    testParse("(function arguments() { });", expr,
      new Shift.FunctionExpression(new Shift.Identifier("arguments"), [], new Shift.FunctionBody([], []))
    );
    testParse("(function x(y, z) { })", expr,
      new Shift.FunctionExpression(new Shift.Identifier("x"), [new Shift.Identifier("y"), new Shift.Identifier("z")], new Shift.FunctionBody([], []))
    );

  });
});
