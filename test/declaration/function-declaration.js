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

var stmt = require("../helpers").stmt;
var testEsprimaEquiv = require('../assertions').testEsprimaEquiv;
var testParse = require('../assertions').testParse;
var testParseFailure = require('../assertions').testParseFailure;

suite("Parser", function () {
  suite("function declaration", function () {
    testParse("function hello() { z(); }", stmt,
      new Shift.FunctionDeclaration(false, new Shift.BindingIdentifier(new Shift.Identifier("hello")), [], null, new Shift.FunctionBody([], [
        new Shift.ExpressionStatement(new Shift.CallExpression(new Shift.IdentifierExpression(new Shift.Identifier("z")), [])),
      ]))
    );

    testParse("function eval() { }", stmt,
      new Shift.FunctionDeclaration(false, new Shift.BindingIdentifier(new Shift.Identifier("eval")), [], null, new Shift.FunctionBody([], []))
    );

    testParse("function arguments() { }", stmt,
      new Shift.FunctionDeclaration(false, new Shift.BindingIdentifier(new Shift.Identifier("arguments")), [], null, new Shift.FunctionBody([], []))
    );

    testParse("function test(t, t) { }", stmt,
      new Shift.FunctionDeclaration(false, new Shift.BindingIdentifier(new Shift.Identifier("test")), [
        new Shift.BindingIdentifier(new Shift.Identifier("t")),
        new Shift.BindingIdentifier(new Shift.Identifier("t")),
      ], null, new Shift.FunctionBody([], []))
    );

    testParse("function eval() { function inner() { \"use strict\" } }", stmt,
      new Shift.FunctionDeclaration(false, new Shift.BindingIdentifier(new Shift.Identifier("eval")), [], null, new Shift.FunctionBody([], [
        new Shift.FunctionDeclaration(false, new Shift.BindingIdentifier(new Shift.Identifier("inner")), [], null, new Shift.FunctionBody([new Shift.Directive("use strict")], []))
      ]))
    );

    testParse("function hello(a) { z(); }", stmt,
      new Shift.FunctionDeclaration(false, new Shift.BindingIdentifier(new Shift.Identifier("hello")), [new Shift.BindingIdentifier(new Shift.Identifier("a"))], null, new Shift.FunctionBody([], [
        new Shift.ExpressionStatement(new Shift.CallExpression(new Shift.IdentifierExpression(new Shift.Identifier("z")), [])),
      ]))
    );

    testParse("function hello(a, b) { z(); }", stmt,
      new Shift.FunctionDeclaration(false, new Shift.BindingIdentifier(new Shift.Identifier("hello")), [new Shift.BindingIdentifier(new Shift.Identifier("a")), new Shift.BindingIdentifier(new Shift.Identifier("b"))], null, new Shift.FunctionBody([], [
        new Shift.ExpressionStatement(new Shift.CallExpression(new Shift.IdentifierExpression(new Shift.Identifier("z")), [])),
      ]))
    );

    testParse("function universe(__proto__) { }", stmt,
      new Shift.FunctionDeclaration(false, new Shift.BindingIdentifier(new Shift.Identifier("universe")), [new Shift.BindingIdentifier(new Shift.Identifier("__proto__"))], null, new Shift.FunctionBody([], []))
    );

    testParse("function test() { \"use strict\"\n + 42; }", stmt,
      new Shift.FunctionDeclaration(false, new Shift.BindingIdentifier(new Shift.Identifier("test")), [], null, new Shift.FunctionBody([], [
        new Shift.ExpressionStatement(new Shift.BinaryExpression("+", new Shift.LiteralStringExpression("use strict"), new Shift.LiteralNumericExpression(42))),
      ]))
    );
  });

  suite("function declaration in labeled statement", function () {
    testParse('a: function a(){}', stmt,
      new Shift.LabeledStatement(
        new Shift.Identifier('a'),
        new Shift.FunctionDeclaration(false, new Shift.BindingIdentifier(new Shift.Identifier('a')), [], null, new Shift.FunctionBody([], []))));

    testParseFailure('a: function* a(){}', 'Unexpected token *');

    testParseFailure('while(true) function a(){}', 'Unexpected token function');
    testParseFailure('with(true) function a(){}', 'Unexpected token function');
    testParseFailure('a: function* a(){}', 'Unexpected token *');
  })
});
