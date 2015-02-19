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

var testEsprimaEquiv = require('../assertions').testEsprimaEquiv;
var testParse = require('../assertions').testParse;
var expr = require("../helpers").expr;
var testParseFailure = require('../assertions').testParseFailure;

suite("Parser", function () {
  suite("arrow expression", function () {
    testEsprimaEquiv("(a) + (b)");
    testEsprimaEquiv("(a)");
    testEsprimaEquiv("((a))");
    testEsprimaEquiv("((a))()");
    testEsprimaEquiv("((a))((a))");
    testEsprimaEquiv("void (a)");
    testEsprimaEquiv("(void a)");
    testEsprimaEquiv("(a++)");
    testEsprimaEquiv("(a)++");
    testEsprimaEquiv("(a)--");
    testEsprimaEquiv("(a) ? (b) : (c)");

    testParse("(()=>0)", expr, new Shift.ArrowExpression([], null, new Shift.LiteralNumericExpression(0)));

    testParse("() => 0", expr, new Shift.ArrowExpression([], null, new Shift.LiteralNumericExpression(0)));

    testParse("(...a) => 0", expr,
      new Shift.ArrowExpression([],
        new Shift.BindingIdentifier(new Shift.Identifier("a")),
        new Shift.LiteralNumericExpression(0)));

    testParse("() => {}", expr, new Shift.ArrowExpression([], null, new Shift.FunctionBody([], [])));

    testParse("(a) => 0", expr, new Shift.ArrowExpression([
      new Shift.BindingIdentifier(new Shift.Identifier("a"))
    ], null, new Shift.LiteralNumericExpression(0)));

    testParse("([a]) => 0", expr, new Shift.ArrowExpression([
      new Shift.ArrayBinding(
        [new Shift.BindingIdentifier(new Shift.Identifier("a"))],
        null)
    ], null, new Shift.LiteralNumericExpression(0)));

    testParse("a => 0", expr, new Shift.ArrowExpression([
      new Shift.BindingIdentifier(new Shift.Identifier("a"))
    ], null, new Shift.LiteralNumericExpression(0)));

    testParse("({a}) => 0", expr,
      new Shift.ArrowExpression([new Shift.ObjectBinding([
        new Shift.BindingPropertyIdentifier(
          new Shift.BindingIdentifier(new Shift.Identifier("a")),
          null
        )
      ])], null, new Shift.LiteralNumericExpression(0)));

    testParse("() => () => 0", expr,
      new Shift.ArrowExpression([], null, new Shift.ArrowExpression([], null, new Shift.LiteralNumericExpression(0))));

    testParse("() => 0, 1", expr,
      new Shift.BinaryExpression(",",
        new Shift.ArrowExpression([], null, new Shift.LiteralNumericExpression(0)),
        new Shift.LiteralNumericExpression(1)
      ));

    testParse("() => 0 + 1", expr,
      new Shift.ArrowExpression([], null,
        new Shift.BinaryExpression("+", new Shift.LiteralNumericExpression(0), new Shift.LiteralNumericExpression(1))
      ));

    testParse("(a,b) => 0 + 1", expr,
      new Shift.ArrowExpression([
          new Shift.BindingIdentifier(new Shift.Identifier("a")),
          new Shift.BindingIdentifier(new Shift.Identifier("b"))
        ], null,
        new Shift.BinaryExpression("+", new Shift.LiteralNumericExpression(0), new Shift.LiteralNumericExpression(1))
      ));

    testParse("(a,b,...c) => 0 + 1", expr,
      new Shift.ArrowExpression([
          new Shift.BindingIdentifier(new Shift.Identifier("a")),
          new Shift.BindingIdentifier(new Shift.Identifier("b"))
        ], new Shift.BindingIdentifier(new Shift.Identifier("c")),
        new Shift.BinaryExpression("+", new Shift.LiteralNumericExpression(0), new Shift.LiteralNumericExpression(1))
      ));

    testParse("() => (a) = 0", expr,
      new Shift.ArrowExpression([], null,
        new Shift.AssignmentExpression(
          "=",
          new Shift.BindingIdentifier(new Shift.Identifier("a")),
          new Shift.LiteralNumericExpression(0))));

    testParse("a => b => c => 0", expr,
      new Shift.ArrowExpression(
        [new Shift.BindingIdentifier(new Shift.Identifier("a"))],
        null,
        new Shift.ArrowExpression(
          [new Shift.BindingIdentifier(new Shift.Identifier("b"))],
          null,
          new Shift.ArrowExpression(
            [new Shift.BindingIdentifier(new Shift.Identifier("c"))],
            null,
            new Shift.LiteralNumericExpression(0)))));

    testParse("(x)=>{'use strict';}", expr, new Shift.ArrowExpression([
        new Shift.BindingIdentifier(new Shift.Identifier("x")),
      ], null,
      new Shift.FunctionBody([new Shift.Directive('use strict')], [])
    ));

    testParse("'use strict';(x)=>0", expr, new Shift.ArrowExpression([
        new Shift.BindingIdentifier(new Shift.Identifier("x")),
      ], null,
      new Shift.LiteralNumericExpression(0)
    ));

    testParseFailure("[]=>0", "Unexpected token =>");
    testParseFailure("() + 1", "Unexpected token +");
    testParseFailure("1 + ()", "Unexpected end of input");
    testParseFailure("1 + ()", "Unexpected end of input");
    testParseFailure("(a)\n=> 0", "Unexpected token =>");
    testParseFailure("a\n=> 0", "Unexpected token =>");
    testParseFailure("((a)) => 1", "Illegal arrow function parameter list");
    testParseFailure("((a),...a) => 1", "Unexpected token ...");
    testParseFailure("(a,...a)", "Unexpected end of input");
    testParseFailure("([a,a])=>0", "Duplicate binding \'a\'");
    testParseFailure("(a,...a)\n", "Unexpected line terminator");
    testParseFailure("(a,...a)/*\r\n*/ => 0", "Unexpected line terminator");
    testParseFailure("(a,...a)/*\u2028*/ => 0", "Unexpected line terminator");
    testParseFailure("(a,...a)/*\u2029*/ => 0", "Unexpected line terminator");
    testParseFailure("(a,...a)/*\n*/ => 0", "Unexpected line terminator");
    testParseFailure("(a,...a)/*\r*/ => 0", "Unexpected line terminator");
    testParseFailure("(a,...a)/*\u202a*/", "Unexpected end of input");

    testParseFailure("(a,a)=>0", "Strict mode function may not have duplicate parameter names");
    testParseFailure("([a],...a)=>0", "Strict mode function may not have duplicate parameter names");
    testParseFailure("(a,...a)=>0", "Strict mode function may not have duplicate parameter names");
    testParseFailure("([a],...a)=>0", "Strict mode function may not have duplicate parameter names");
    testParseFailure("eval=>0", "Parameter name eval or arguments is not allowed in strict mode");
    testParseFailure("arguments=>0", "Parameter name eval or arguments is not allowed in strict mode");
    testParseFailure("package=>0", "Use of future reserved word in strict mode");
    testParseFailure("(eval)=>0", "Parameter name eval or arguments is not allowed in strict mode");
    testParseFailure("(arguments)=>0", "Parameter name eval or arguments is not allowed in strict mode");
    testParseFailure("(package)=>0", "Use of future reserved word in strict mode");
    testParseFailure("([let])=>0", "Use of future reserved word in strict mode");

  });
});
