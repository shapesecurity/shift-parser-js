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
var stmt = require("../helpers").stmt;
var testParseFailure = require("../assertions").testParseFailure;
var testParse = require("../assertions").testParse;

suite("Parser", function () {
  suite("function expression", function () {

    testParse("(function(){})", expr,
      { type: "FunctionExpression",
        isGenerator: false,
        name: null,
        params: { type: "FormalParameters", items: [], rest: null },
        body: new Shift.FunctionBody([], [])
      }
    );

    testParse("(function x() { y; z() });", expr,
      { type: "FunctionExpression",
        isGenerator: false,
        name: { type: "BindingIdentifier", name: "x" },
        params: { type: "FormalParameters", items: [], rest: null },
        body: new Shift.FunctionBody([], [
          new Shift.ExpressionStatement({ type: "IdentifierExpression", name: "y" }),
          new Shift.ExpressionStatement(new Shift.CallExpression({ type: "IdentifierExpression", name: "z" }, [])),
        ])
      }
    );

    testParse("(function eval() { });", expr,
      { type: "FunctionExpression",
        isGenerator: false,
        name: { type: "BindingIdentifier", name: "eval" },
        params: { type: "FormalParameters", items: [], rest: null },
        body: new Shift.FunctionBody([], [])
      }
    );

    testParse("(function arguments() { });", expr,
      { type: "FunctionExpression",
        isGenerator: false,
        name: { type: "BindingIdentifier", name: "arguments" },
        params: { type: "FormalParameters", items: [], rest: null },
        body: new Shift.FunctionBody([], [])
      }
    );

    testParse("(function x(y, z) { })", expr,
      { type: "FunctionExpression",
        isGenerator: false,
        name: { type: "BindingIdentifier", name: "x" },
        params:
          { type: "FormalParameters",
            items:
              [
                { type: "BindingIdentifier", name: "y" },
                { type: "BindingIdentifier", name: "z" }
              ],
            rest: null
          },
        body: new Shift.FunctionBody([], [])
      }
    );

    testParse("(function(a = b){})", expr,
      { type: "FunctionExpression",
        isGenerator: false,
        name: null,
        params:
          { type: "FormalParameters",
            items:
              [
                new Shift.BindingWithDefault(
                  { type: "BindingIdentifier", name: "a" },
                  { type: "IdentifierExpression", name: "b" }
                )
              ],
            rest: null,
          },
        body: new Shift.FunctionBody([], [])
      }
    );

    testParse("(function(...a){})", expr,
      { type: "FunctionExpression",
        isGenerator: false,
        name: null,
        params:
          { type: "FormalParameters",
            items: [],
            rest: { type: "BindingIdentifier", name: "a" }
          },
        body: new Shift.FunctionBody([], [])
      }
    );

    testParse("(function(a, ...b){})", expr,
      { type: "FunctionExpression",
        isGenerator: false,
        name: null,
        params:
          { type: "FormalParameters",
            items: [{ type: "BindingIdentifier", name: "a" }],
            rest: { type: "BindingIdentifier", name: "b" }
          },
        body: new Shift.FunctionBody([], [])
      }
    );

    testParse("(function({a}){})", expr,
      { type: "FunctionExpression",
        isGenerator: false,
        name: null,
        params:
          { type: "FormalParameters",
            items:
              [
                new Shift.ObjectBinding([
                  { type: "BindingPropertyIdentifier",
                    binding: { type: "BindingIdentifier", name: "a" },
                    init: null }
                ])
              ],
            rest: null,
          },
        body: new Shift.FunctionBody([], [])
      }
    );

    testParse("(function({a: x, a: y}){})", expr,
      { type: "FunctionExpression",
        isGenerator: false,
        name: null,
        params:
          { type: "FormalParameters",
            items:
              [
                new Shift.ObjectBinding([
                  new Shift.BindingPropertyProperty(
                    new Shift.StaticPropertyName("a"),
                    { type: "BindingIdentifier", name: "x" }
                  ),
                  new Shift.BindingPropertyProperty(
                    new Shift.StaticPropertyName("a"),
                    { type: "BindingIdentifier", name: "y" }
                  )
                ])
              ],
            rest: null
          },
        body: new Shift.FunctionBody([], [])
      }
    );

    testParse("(function([a]){})", expr,
      { type: "FunctionExpression",
        isGenerator: false,
        name: null,
        params:
          { type: "FormalParameters",
            items:
              [
                new Shift.ArrayBinding(
                  [{ type: "BindingIdentifier", name: "a" }],
                  null
                )
              ],
            rest: null
          },
        body: new Shift.FunctionBody([], [])
      }
    );

    testParse("(function({a = 0}){})", expr,
      { type: "FunctionExpression",
        isGenerator: false,
        name: null,
        params:
          { type: "FormalParameters",
            items:
              [
                new Shift.ObjectBinding([
                  { type: "BindingPropertyIdentifier",
                    binding: { type: "BindingIdentifier", name: "a" },
                    init: new Shift.LiteralNumericExpression(0) }
                ])
              ],
            rest: null
          },
        body: new Shift.FunctionBody([], [])
      }
    );

    testParse("label: !function(){ label:; };", stmt,
      new Shift.LabeledStatement(
        "label",
        new Shift.ExpressionStatement(new Shift.PrefixExpression("!",
          { type: "FunctionExpression",
            isGenerator: false,
            name: null,
            params: { type: "FormalParameters", items: [], rest: null },
            body: new Shift.FunctionBody([], [
              new Shift.LabeledStatement("label", new Shift.EmptyStatement),
            ])
          }
        ))
      )
    );

    testParseFailure("(function([]){})", "Unexpected token [");
    testParseFailure("(function(...a, b){})", "Unexpected token ,");
    testParseFailure("(function((a)){})", "Unexpected token (");
    testParseFailure("(function(package){'use strict';})", "Use of future reserved word in strict mode");
  });
});
