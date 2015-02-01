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
var testParse = require('../assertions').testParse;

suite("Parser", function () {
  suite("property name", function () {
    testParse("({0x0:0})", expr,
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.PropertyName("number", "0"), new Shift.LiteralNumericExpression(0)),
      ])
    );

    testParse("({2e308:0})", expr,
      new Shift.ObjectExpression([
        new Shift.DataProperty(new Shift.PropertyName("number", "" + 1 / 0), new Shift.LiteralNumericExpression(0)),
      ])
    );
  });
});
