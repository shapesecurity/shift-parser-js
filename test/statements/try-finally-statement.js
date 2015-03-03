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
var testParse = require("../assertions").testParse;

suite("Parser", function () {
  suite("try-finally statement", function () {
    testParse("try { } finally { cleanup(stuff) }", stmt,
      new Shift.TryFinallyStatement(
        new Shift.Block([]),
        null,
        new Shift.Block([new Shift.ExpressionStatement(new Shift.CallExpression(
          new Shift.IdentifierExpression(new Shift.Identifier("cleanup")),
          [new Shift.IdentifierExpression(new Shift.Identifier("stuff"))]
        ))])
      )
    );
    testParse("try{}catch(a){}finally{}", stmt,
      new Shift.TryFinallyStatement(
        new Shift.Block([]),
        new Shift.CatchClause(
          new Shift.BindingIdentifier(new Shift.Identifier("a")),
          new Shift.Block([])
        ),
        new Shift.Block([])
      )
    );
    testParse("try { doThat(); } catch (e) { say(e) } finally { cleanup(stuff) }", stmt,
      new Shift.TryFinallyStatement(
        new Shift.Block([new Shift.ExpressionStatement(new Shift.CallExpression(
          new Shift.IdentifierExpression(new Shift.Identifier("doThat")),
          []
        ))]),
        new Shift.CatchClause(
          new Shift.BindingIdentifier(new Shift.Identifier("e")),
          new Shift.Block([new Shift.ExpressionStatement(new Shift.CallExpression(
            new Shift.IdentifierExpression(new Shift.Identifier("say")),
            [new Shift.IdentifierExpression(new Shift.Identifier("e"))]
          ))])
        ),
        new Shift.Block([new Shift.ExpressionStatement(new Shift.CallExpression(
          new Shift.IdentifierExpression(new Shift.Identifier("cleanup")),
          [new Shift.IdentifierExpression(new Shift.Identifier("stuff"))]
        ))])
      )
    );
  });
});
