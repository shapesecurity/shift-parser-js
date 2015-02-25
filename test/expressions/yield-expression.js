/**
 * Copyright 2015 Shape Security, Inc.
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

var testParse = require("../assertions").testParse;
var testParseFailure = require("../assertions").testParseFailure;
var expr = require("../helpers").expr;
var stmt = require("../helpers").stmt;

suite("Parser", function () {
  var emptyBody = new Shift.FunctionBody([], []);

  suite("yield", function () {
    function yd(p) {
      return p.body.statements[0].body.statements.map(function (es) {
        return es.expression
      });
    }

    function yde(p) {
      return p.body.statements[0].body.statements[0].expression.expression;
    }

    testParse("function*a(){yield\na}", yd, [new Shift.YieldExpression(null), new Shift.IdentifierExpression(new Shift.Identifier("a"))]);
    testParse("function*a(){yield*a}", yd, [new Shift.YieldGeneratorExpression(new Shift.IdentifierExpression(new Shift.Identifier("a")))]);
    testParse("function a(){yield*a}", yd, [new Shift.BinaryExpression("*", new Shift.IdentifierExpression(new Shift.Identifier("yield")), new Shift.IdentifierExpression(new Shift.Identifier("a")))]);

    // yield as an Identifier cannot show up in body of a generator or in strict mode.
    testParse("({set a(yield){}})", expr,
      new Shift.ObjectExpression([
        new Shift.Setter(
          new Shift.StaticPropertyName("a"),
          new Shift.BindingIdentifier(new Shift.Identifier("yield")),
          emptyBody)
      ]));
    // TODO: figure out which early error applies here
    testParseFailure("function *a(){ return ({set a(yield){}}); }", "Unexpected token yield");
    testParseFailure("function *a(){yield\n*a}", "Unexpected token *");
    testParseFailure("function *a(){yield*}", "Unexpected token }");
    testParse("function *a(){yield 0}", yde, new Shift.LiteralNumericExpression(0));
    testParse("function *a(){yield null}", yde, new Shift.LiteralNullExpression());
    testParse("function *a(){yield true}", yde, new Shift.LiteralBooleanExpression(true));
    testParse("function *a(){yield false}", yde, new Shift.LiteralBooleanExpression(false));
    testParse("function *a(){yield \"a\"}", yde, new Shift.LiteralStringExpression("a"));
    testParse("function *a(){yield a}", yde, new Shift.IdentifierExpression(new Shift.Identifier("a")));
    testParse("function *a(){yield+0}", yde, new Shift.PrefixExpression("+", new Shift.LiteralNumericExpression(0)));
    testParse("function *a(){yield-0}", yde, new Shift.PrefixExpression("-", new Shift.LiteralNumericExpression(0)));
    testParse("function *a(){yield 2e308}", yde, new Shift.LiteralInfinityExpression());
    testParse("function *a(){yield(0)}", yde, new Shift.LiteralNumericExpression(0));
    testParse("function *a(){yield/a/}", yde, new Shift.LiteralRegExpExpression("a", ""));
    testParse("function *a(){yield/=3/}", yde, new Shift.LiteralRegExpExpression("=3", ""));
    testParse("function *a(){yield class{}}", yde, new Shift.ClassExpression(null, null, []));
  });
});
