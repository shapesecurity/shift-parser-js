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
  var emptyBody = new Shift.FunctionBody([], []);
  suite("generator declaration", function () {
    testParse('function* a(){}', stmt, new Shift.FunctionDeclaration(true, new Shift.Identifier("a"), [], null, emptyBody));
    testParse('function* a(){yield}', stmt,
      new Shift.FunctionDeclaration(true, new Shift.Identifier("a"), [], null, new Shift.FunctionBody([], [
        new Shift.ExpressionStatement(new Shift.YieldExpression(null))
      ])));
    testParse('function* a(){yield a}', stmt,
      new Shift.FunctionDeclaration(true, new Shift.Identifier("a"), [], null, new Shift.FunctionBody([], [
        new Shift.ExpressionStatement(new Shift.YieldExpression(new Shift.IdentifierExpression(new Shift.Identifier("a"))))
      ])));
    testParse('function* yield(){}', stmt,
      new Shift.FunctionDeclaration(true, new Shift.Identifier("yield"), [], null, emptyBody));

    testParse('function* a(a=yield){}', stmt,
      new Shift.FunctionDeclaration(
        true,
        new Shift.Identifier("a"),
        [new Shift.BindingWithDefault(new Shift.BindingIdentifier(new Shift.Identifier("a")), new Shift.IdentifierExpression(new Shift.Identifier('yield')))],
        null,
        emptyBody));

    testParse('function* a({[yield]:a}){}', stmt,
      new Shift.FunctionDeclaration(
        true,
        new Shift.Identifier("a"),
        [new Shift.ObjectBinding([
          new Shift.BindingPropertyProperty(
            new Shift.ComputedPropertyName(new Shift.IdentifierExpression(new Shift.Identifier('yield'))),
            new Shift.BindingIdentifier(new Shift.Identifier('a'))
          )
        ])],
        null,
        emptyBody));

    testParse('function* a(){({[yield]:a}=0)}', function (p) {
        return p.body.statements[0].body.statements[0].expression
      },
      new Shift.AssignmentExpression('=',
        new Shift.ObjectBinding([
          new Shift.BindingPropertyProperty(
            new Shift.ComputedPropertyName(new Shift.YieldExpression(null)),
            new Shift.BindingIdentifier(new Shift.Identifier('a'))
          )
        ]),
        new Shift.LiteralNumericExpression(0)));

    testParse('function *a(a=class extends yield{}){}', function (p) {
      return p.body.statements[0].parameters[0].init.super;
    }, new Shift.IdentifierExpression(new Shift.Identifier('yield')));
    testParse('function *a({[class extends yield{}]:a}){}', function (p) {
      return p.body.statements[0].parameters[0].properties[0].name.value.super;
    }, new Shift.IdentifierExpression(new Shift.Identifier('yield')));
    testParseFailure('function* a(){function a(a=yield){}}', 'Unexpected token yield');
    testParseFailure('function* a(){function* a(yield){}}', 'Unexpected token yield');
    testParseFailure('function* a([yield]){}', 'Unexpected token yield');
    testParseFailure('function* a({yield}){}', 'Unexpected token yield');
    testParseFailure('function* a({yield=0}){}', 'Unexpected token yield');
    testParseFailure('function* a({a:yield}){}', 'Unexpected token yield');
    testParseFailure('function* a([yield,...a]){}', 'Unexpected token yield');
    testParseFailure('function* a(){var yield}', 'Unexpected token yield');
    testParseFailure('function yield(){"use strict";}', 'Use of future reserved word in strict mode');
    testParseFailure('"use strict";function yield(){}', 'Use of future reserved word in strict mode');
    testParseFailure('({a(yield){}})', 'Use of future reserved word in strict mode');
    testParseFailure('function *a(){function b(){yield}}', 'Unexpected token yield');
  });

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

  suite("yield", function () {
    function yd(p) {
      return p.body.statements[0].body.statements.map(function (es) { return es.expression });
    }

    function yde(p) {
      return p.body.statements[0].body.statements[0].expression.expression;
    }

    testParse('function*a(){yield\na}', yd, [new Shift.YieldExpression(null), new Shift.IdentifierExpression(new Shift.Identifier('a'))]);
    testParse('function*a(){yield*a}', yd, [new Shift.YieldGeneratorExpression(new Shift.IdentifierExpression(new Shift.Identifier('a')))]);
    testParse('function a(){yield*a}', yd, [new Shift.BinaryExpression('*', new Shift.IdentifierExpression(new Shift.Identifier('yield')), new Shift.IdentifierExpression(new Shift.Identifier('a')))]);
    testParseFailure('function*a(yield){}', 'Unexpected token yield');

    // yield as an Identifier cannot show up in body of a generator or in strict mode.
    testParse('({set a(yield){}})', expr,
      new Shift.ObjectExpression([
        new Shift.Setter(
          new Shift.StaticPropertyName("a"),
          new Shift.BindingIdentifier(new Shift.Identifier('yield')),
          emptyBody)
      ]));
    testParseFailure('function *a(){ return ({set a(yield){}}); }', 'Unexpected token yield');
    testParseFailure('class A{set a(yield){}}', 'Use of future reserved word in strict mode');

    testParseFailure('function *a(){yield\n*a}', 'Unexpected token *');
    testParseFailure('function *a(){yield*}', 'Unexpected token }');
    testParse('function *a(){yield 0}', yde, new Shift.LiteralNumericExpression(0));
    testParse('function *a(){yield null}', yde, new Shift.LiteralNullExpression());
    testParse('function *a(){yield true}', yde, new Shift.LiteralBooleanExpression(true));
    testParse('function *a(){yield false}', yde, new Shift.LiteralBooleanExpression(false));
    testParse('function *a(){yield "a"}', yde, new Shift.LiteralStringExpression('a'));
    testParse('function *a(){yield a}', yde, new Shift.IdentifierExpression(new Shift.Identifier('a')));
    testParse('function *a(){yield+0}', yde, new Shift.PrefixExpression('+', new Shift.LiteralNumericExpression(0)));
    testParse('function *a(){yield-0}', yde, new Shift.PrefixExpression('-', new Shift.LiteralNumericExpression(0)));
    testParse('function *a(){yield 2e308}', yde, new Shift.LiteralInfinityExpression());
    testParse('function *a(){yield(0)}', yde, new Shift.LiteralNumericExpression(0));
    testParse('function *a(){yield/a/}', yde, new Shift.LiteralRegExpExpression('a', ''));
    testParse('function *a(){yield/=3/}', yde, new Shift.LiteralRegExpExpression('=3', ''));
    testParse('function *a(){yield class{}}', yde, new Shift.ClassExpression(null, null, []));
  });
});
