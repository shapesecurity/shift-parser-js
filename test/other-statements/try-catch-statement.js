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
  suite("try-catch statement", function () {
    testParse("try{}catch(a){}", stmt,
      new Shift.TryCatchStatement(
        new Shift.Block([]),
        new Shift.CatchClause(
          new Shift.BindingIdentifier(new Shift.Identifier("a")),
          new Shift.Block([])
        )
      )
    );
    testParse("try { } catch (e) { }", stmt,
      new Shift.TryCatchStatement(
        new Shift.Block([]),
        new Shift.CatchClause(
          new Shift.BindingIdentifier(new Shift.Identifier("e")),
          new Shift.Block([])
        )
      )
    );
    testParse("try { } catch (eval) { }", stmt,
      new Shift.TryCatchStatement(
        new Shift.Block([]),
        new Shift.CatchClause(
          new Shift.BindingIdentifier(new Shift.Identifier("eval")),
          new Shift.Block([])
        )
      )
    );
    testParse("try { } catch (arguments) { }", stmt,
      new Shift.TryCatchStatement(
        new Shift.Block([]),
        new Shift.CatchClause(
          new Shift.BindingIdentifier(new Shift.Identifier("arguments")),
          new Shift.Block([])
        )
      )
    );
    testParse("try { } catch (e) { say(e) }", stmt,
      new Shift.TryCatchStatement(
        new Shift.Block([]),
        new Shift.CatchClause(
          new Shift.BindingIdentifier(new Shift.Identifier("e")),
          new Shift.Block([new Shift.ExpressionStatement(new Shift.CallExpression(
            new Shift.IdentifierExpression(new Shift.Identifier("say")),
            [new Shift.IdentifierExpression(new Shift.Identifier("e"))]
          ))])
        )
      )
    );
    testParse("try { doThat(); } catch (e) { say(e) }", stmt,
      new Shift.TryCatchStatement(
        new Shift.Block([
          new Shift.ExpressionStatement(new Shift.CallExpression(new Shift.IdentifierExpression(new Shift.Identifier("doThat")), []))
        ]),
        new Shift.CatchClause(
          new Shift.BindingIdentifier(new Shift.Identifier("e")),
          new Shift.Block([new Shift.ExpressionStatement(new Shift.CallExpression(
            new Shift.IdentifierExpression(new Shift.Identifier("say")),
            [new Shift.IdentifierExpression(new Shift.Identifier("e"))]
          ))])
        )
      )
    );

    testParse("try {} catch ([e]) {}", stmt,
      new Shift.TryCatchStatement(
        new Shift.Block([]),
        new Shift.CatchClause(
          new Shift.ArrayBinding([new Shift.BindingIdentifier(new Shift.Identifier("e"))], null),
          new Shift.Block([])
        )
      )
    );

    testParse("try {} catch ([e, ...a]) {}", stmt,
      new Shift.TryCatchStatement(
        new Shift.Block([]),
        new Shift.CatchClause(
          new Shift.ArrayBinding([new Shift.BindingIdentifier(new Shift.Identifier("e"))],
            new Shift.BindingIdentifier(new Shift.Identifier("a"))),
          new Shift.Block([])
        )
      )
    );

    testParseFailure("try {} catch ([e,e]) {}", "Duplicate binding \'e\'");
    testParseFailure("try {} catch ((e)) {}", "Unexpected token (");
  });
});
