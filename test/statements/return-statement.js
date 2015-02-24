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

var testParse = require('../assertions').testParse;
var expr = require("../helpers").expr;

suite("Parser", function () {
  suite("return statement", function () {
    testParse("(function(){ return })", expr,
      new Shift.FunctionExpression(false, null, [], null, new Shift.FunctionBody([], [
        new Shift.ReturnStatement(null),
      ]))
    );
    testParse("(function(){ return; })", expr,
      new Shift.FunctionExpression(false, null, [], null, new Shift.FunctionBody([], [
        new Shift.ReturnStatement(null),
      ]))
    );
    testParse("(function(){ return x; })", expr,
      new Shift.FunctionExpression(false, null, [], null, new Shift.FunctionBody([], [
        new Shift.ReturnStatement(new Shift.IdentifierExpression(new Shift.Identifier("x"))),
      ]))
    );
    testParse("(function(){ return x * y })", expr,
      new Shift.FunctionExpression(false, null, [], null, new Shift.FunctionBody([], [
        new Shift.ReturnStatement(new Shift.BinaryExpression("*", new Shift.IdentifierExpression(new Shift.Identifier("x")), new Shift.IdentifierExpression(new Shift.Identifier("y")))),
      ]))
    );
  });
});
