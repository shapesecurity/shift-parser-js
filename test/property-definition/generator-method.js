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
var testParseFailure = require('../assertions').testParseFailure;
var expr = require("../helpers").expr;
var stmt = require("../helpers").stmt;


suite("Parser", function () {

  suite("generator method", function () {
    testParse('({*a(){}})', expr, new Shift.ObjectExpression([
      new Shift.Method(true, new Shift.StaticPropertyName('a'), [], null, new Shift.FunctionBody([], []))
    ]));
    testParse('({*yield(){}})', expr, new Shift.ObjectExpression([
      new Shift.Method(true, new Shift.StaticPropertyName('yield'), [], null, new Shift.FunctionBody([], []))
    ]));
    testParse('({*[yield](){}})', expr, new Shift.ObjectExpression([
      new Shift.Method(true, new Shift.ComputedPropertyName(
        new Shift.IdentifierExpression(new Shift.Identifier('yield'))), [], null, new Shift.FunctionBody([], []))
    ]));

    testParseFailure('({*a([yield]){}})', 'Unexpected token yield');
    testParseFailure('class A { *constructor(){} }', 'Constructors cannot be generators, getters or setters');
  });

});
