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

var testParse = require("../assertions").testParse;
var testParseFailure = require("../assertions").testParseFailure;
var stmt = require("../helpers").stmt;

function id(x) {
  return x;
}

suite("Parser", function () {
  suite("generator declaration", function () {

    testParse("function* a(){}", stmt,
      { type: "FunctionDeclaration",
        isGenerator: true,
        name: { type: "BindingIdentifier", name: "a" },
        params: { type: "FormalParameters", items: [], rest: null },
        body: { type: "FunctionBody", directives: [], statements: [] }
      }
    );

    testParse("function* a(){yield}", stmt,
      { type: "FunctionDeclaration",
        isGenerator: true,
        name: { type: "BindingIdentifier", name: "a" },
        params: { type: "FormalParameters", items: [], rest: null },
        body: {
          type: "FunctionBody",
          directives: [],
          statements: [{ type: "ExpressionStatement", expression: { type: "YieldExpression", expression: null } }]
        }
      }
    );

    testParse("function* a(){yield a}", stmt,
      { type: "FunctionDeclaration",
        isGenerator: true,
        name: { type: "BindingIdentifier", name: "a" },
        params: { type: "FormalParameters", items: [], rest: null },
        body: {
          type: "FunctionBody",
          directives: [],
          statements: [{
            type: "ExpressionStatement",
            expression: { type: "YieldExpression", expression: { type: "IdentifierExpression", name: "a" } }
          }]
        }
      }
    );

    testParse("function* yield(){}", stmt,
      { type: "FunctionDeclaration",
        isGenerator: true,
        name: { type: "BindingIdentifier", name: "yield" },
        params: { type: "FormalParameters", items: [], rest: null },
        body: { type: "FunctionBody", directives: [], statements: [] }
      }
    );

    testParse("function* a(a=yield){}", stmt,
      { type: "FunctionDeclaration",
        isGenerator: true,
        name: { type: "BindingIdentifier", name: "a" },
        params:
          { type: "FormalParameters",
            items:
              [
                {
                  type: "BindingWithDefault",
                  binding: { type: "BindingIdentifier", name: "a" },
                  init: { type: "IdentifierExpression", name: "yield" }
                }
              ],
            rest: null },
        body: { type: "FunctionBody", directives: [], statements: [] }
      }
    );

    testParse("function* a({[yield]:a}){}", stmt,
      { type: "FunctionDeclaration",
        isGenerator: true,
        name: { type: "BindingIdentifier", name: "a" },
        params:
          { type: "FormalParameters",
            items:
              [
                {
                  type: "ObjectBinding",
                  properties: [{
                    type: "BindingPropertyProperty",
                    name: { type: "ComputedPropertyName", expression: { type: "IdentifierExpression", name: "yield" } },
                    binding: { type: "BindingIdentifier", name: "a" }
                  }]
                }
              ],
            rest: null
          },
        body: { type: "FunctionBody", directives: [], statements: [] }
      }
    );

    testParse("function* a(){({[yield]:a}=0)}", function (p) {
        return p.body.statements[0].body.statements[0].expression;
      },
      {
        type: "AssignmentExpression",
        operator: "=",
        binding: {
          type: "ObjectBinding",
          properties: [{
            type: "BindingPropertyProperty",
            name: { type: "ComputedPropertyName", expression: { type: "YieldExpression", expression: null } },
            binding: { type: "BindingIdentifier", name: "a" }
          }]
        },
        expression: { type: "LiteralNumericExpression", value: 0 }
      });

    testParse("function *a(a=class extends yield{}){}", function (p) {
      return p.body.statements[0].params.items[0].init.super;
    }, { type: "IdentifierExpression", name: "yield" });
    testParse("function *a({[class extends yield{}]:a}){}", function (p) {
      return p.body.statements[0].params.items[0].properties[0].name.expression.super;
    }, { type: "IdentifierExpression", name: "yield" });


    testParse("function* a() {} function a() {}", id,
      {
        type: "Script",
        body: {
          type: "FunctionBody",
          directives: [],
          statements: [{
            type: "FunctionDeclaration",
            isGenerator: true,
            name: { type: "BindingIdentifier", name: "a" },
            params: { type: "FormalParameters", items: [], rest: null },
            body: { type: "FunctionBody", directives: [], statements: [] }
          }, {
            type: "FunctionDeclaration",
            isGenerator: false,
            name: { type: "BindingIdentifier", name: "a" },
            params: { type: "FormalParameters", items: [], rest: null },
            body: { type: "FunctionBody", directives: [], statements: [] }
          }]
        }
      }
    );

    testParse("function a() { function* a() {} function a() {} }", stmt,
      { type: "FunctionDeclaration",
        isGenerator: false,
        name: { type: "BindingIdentifier", name: "a" },
        params: { type: "FormalParameters", items: [], rest: null },
        body: {
          type: "FunctionBody",
          directives: [],
          statements: [{
            type: "FunctionDeclaration",
            isGenerator: true,
            name: { type: "BindingIdentifier", name: "a" },
            params: { type: "FormalParameters", items: [], rest: null },
            body: { type: "FunctionBody", directives: [], statements: [] }
          }, {
            type: "FunctionDeclaration",
            isGenerator: false,
            name: { type: "BindingIdentifier", name: "a" },
            params: { type: "FormalParameters", items: [], rest: null },
            body: { type: "FunctionBody", directives: [], statements: [] }
          }]
        }
      }
    );

  });
});
