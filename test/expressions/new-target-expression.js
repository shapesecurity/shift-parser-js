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
var testParse = require('../assertions').testParse;
var testParseFailure = require('../assertions').testParseFailure;

suite("Parser", function () {
  suite("new.target expression", function () {

    testParse("function f() { new.target; }", stmt,
      new Shift.FunctionDeclaration(false, new Shift.BindingIdentifier(new Shift.Identifier("f")), [], null, new Shift.FunctionBody([], [
        new Shift.ExpressionStatement(new Shift.NewTargetExpression),
      ]))
    );

    testParse("function f() { new.\\u0074arget; }", stmt,
      new Shift.FunctionDeclaration(false, new Shift.BindingIdentifier(new Shift.Identifier("f")), [], null, new Shift.FunctionBody([], [
        new Shift.ExpressionStatement(new Shift.NewTargetExpression),
      ]))
    );

    testParse("function f() { new new.target; }", stmt,
      new Shift.FunctionDeclaration(false, new Shift.BindingIdentifier(new Shift.Identifier("f")), [], null, new Shift.FunctionBody([], [
        new Shift.ExpressionStatement(new Shift.NewExpression(new Shift.NewTargetExpression, [])),
      ]))
    );

    testParse("function f() { new.target(); }", stmt,
      new Shift.FunctionDeclaration(false, new Shift.BindingIdentifier(new Shift.Identifier("f")), [], null, new Shift.FunctionBody([], [
        new Shift.ExpressionStatement(new Shift.CallExpression(new Shift.NewTargetExpression, [])),
      ]))
    );

    testParse("function f() { new[\"target\"]; }", stmt,
      new Shift.FunctionDeclaration(false, new Shift.BindingIdentifier(new Shift.Identifier("f")), [], null, new Shift.FunctionBody([], [
        new Shift.ExpressionStatement(new Shift.NewExpression(new Shift.ArrayExpression([
          new Shift.LiteralStringExpression("target"),
        ]), [])),
      ]))
    );

    testParseFailure("function f() { new.anythingElse; }", "Unexpected identifier");
    testParseFailure("function f() { new..target; }", "Unexpected token .");

  });
});
