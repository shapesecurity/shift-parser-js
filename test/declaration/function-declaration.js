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
var testParseFailure = require("../assertions").testParseFailure;

function id(x) {
  return x;
}

suite("Parser", function () {
  suite("function declaration", function () {
    testParse("function hello() { z(); }", stmt,
      { type: "FunctionDeclaration",
        isGenerator: false,
        name: { type: "BindingIdentifier", name: "hello" },
        params: { type: "FormalParameters", items: [], rest: null },
        body: new Shift.FunctionBody([], [
          new Shift.ExpressionStatement(new Shift.CallExpression({ type: "IdentifierExpression", name: "z" }, [])),
        ])
      }
    );

    testParse("function eval() { }", stmt,
      { type: "FunctionDeclaration",
        isGenerator: false,
        name: { type: "BindingIdentifier", name: "eval" },
        params: { type: "FormalParameters", items: [], rest: null },
        body: new Shift.FunctionBody([], [])
      }
    );

    testParse("function arguments() { }", stmt,
      { type: "FunctionDeclaration",
        isGenerator: false,
        name: { type: "BindingIdentifier", name: "arguments" },
        params: { type: "FormalParameters", items: [], rest: null },
        body: new Shift.FunctionBody([], [])
      }
    );

    testParse("function test(t, t) { }", stmt,
      { type: "FunctionDeclaration",
        isGenerator: false,
        name: { type: "BindingIdentifier", name: "test" },
        params:
          { type: "FormalParameters",
            items:
              [
                { type: "BindingIdentifier", name: "t" },
                { type: "BindingIdentifier", name: "t" },
              ],
            rest: null
          },
        body: new Shift.FunctionBody([], [])
      }
    );

    testParse("function eval() { function inner() { \"use strict\" } }", stmt,
      { type: "FunctionDeclaration",
        isGenerator: false,
        name: { type: "BindingIdentifier", name: "eval" },
        params: { type: "FormalParameters", items: [], rest: null },
        body: new Shift.FunctionBody([], [
          { type: "FunctionDeclaration",
            isGenerator: false,
            name: { type: "BindingIdentifier", name: "inner" },
            params: { type: "FormalParameters", items: [], rest: null },
            body: new Shift.FunctionBody([new Shift.Directive("use strict")], [])
          },
        ])
      }
    );

    testParse("function hello(a) { z(); }", stmt,
      { type: "FunctionDeclaration",
        isGenerator: false,
        name: { type: "BindingIdentifier", name: "hello" },
        params: { type: "FormalParameters", items: [{ type: "BindingIdentifier", name: "a" }], rest: null },
        body: new Shift.FunctionBody([], [
          new Shift.ExpressionStatement(new Shift.CallExpression({ type: "IdentifierExpression", name: "z" }, [])),
        ])
      }
    );

    testParse("function hello(a, b) { z(); }", stmt,
      { type: "FunctionDeclaration",
        isGenerator: false,
        name: { type: "BindingIdentifier", name: "hello" },
        params:
          { type: "FormalParameters",
            items:
              [
                { type: "BindingIdentifier", name: "a" },
                { type: "BindingIdentifier", name: "b" },
              ],
            rest: null
          },
        body: new Shift.FunctionBody([], [
          new Shift.ExpressionStatement(new Shift.CallExpression({ type: "IdentifierExpression", name: "z" }, [])),
        ])
      }
    );

    testParse("function universe(__proto__) { }", stmt,
      { type: "FunctionDeclaration",
        isGenerator: false,
        name: { type: "BindingIdentifier", name: "universe" },
        params: { type: "FormalParameters", items: [{ type: "BindingIdentifier", name: "__proto__" }], rest: null },
        body: new Shift.FunctionBody([], [])
      }
    );

    testParse("function test() { \"use strict\"\n + 0; }", stmt,
      { type: "FunctionDeclaration",
        isGenerator: false,
        name: { type: "BindingIdentifier", name: "test" },
        params: { type: "FormalParameters", items: [], rest: null },
        body: new Shift.FunctionBody([], [
          new Shift.ExpressionStatement(new Shift.BinaryExpression("+", new Shift.LiteralStringExpression("use strict"), new Shift.LiteralNumericExpression(0))),
        ])
      }
    );

    testParse("function a() {} function a() {}", id,
      new Shift.Script(new Shift.FunctionBody([], [
        { type: "FunctionDeclaration",
          isGenerator: false,
          name: { type: "BindingIdentifier", name: "a" },
          params: { type: "FormalParameters", items: [], rest: null },
          body: new Shift.FunctionBody([], [])
        },
        { type: "FunctionDeclaration",
          isGenerator: false,
          name: { type: "BindingIdentifier", name: "a" },
          params: { type: "FormalParameters", items: [], rest: null },
          body: new Shift.FunctionBody([], [])
        },
      ]))
    );

    testParse("function a() { function a() {} function a() {} }", stmt,
      { type: "FunctionDeclaration",
        isGenerator: false,
        name: { type: "BindingIdentifier", name: "a" },
        params: { type: "FormalParameters", items: [], rest: null },
        body: new Shift.FunctionBody([], [
          { type: "FunctionDeclaration",
            isGenerator: false,
            name: { type: "BindingIdentifier", name: "a" },
            params: { type: "FormalParameters", items: [], rest: null },
            body: new Shift.FunctionBody([], [])
          },
          { type: "FunctionDeclaration",
            isGenerator: false,
            name: { type: "BindingIdentifier", name: "a" },
            params: { type: "FormalParameters", items: [], rest: null },
            body: new Shift.FunctionBody([], [])
          },
        ])
      }
    );
  });

  suite("function declaration in labeled statement", function () {
    testParse("a: function a(){}", stmt,
      new Shift.LabeledStatement(
        "a",
        { type: "FunctionDeclaration",
          isGenerator: false,
          name: { type: "BindingIdentifier", name: "a" },
          params: { type: "FormalParameters", items: [], rest: null },
          body: new Shift.FunctionBody([], [])
        }
      )
    );

    testParseFailure("a: function* a(){}", "Unexpected token *");

    testParseFailure("while(true) function a(){}", "Unexpected token function");
    testParseFailure("with(true) function a(){}", "Unexpected token function");
    testParseFailure("a: function* a(){}", "Unexpected token *");
  });
});
