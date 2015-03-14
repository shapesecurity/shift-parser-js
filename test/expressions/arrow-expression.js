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

var testParse = require("../assertions").testParse;
var expr = require("../helpers").expr;
var testParseFailure = require("../assertions").testParseFailure;

suite("Parser", function () {
  suite("arrow expression", function () {

    testParse("(()=>0)", expr,
      { type: "ArrowExpression",
        params: { type: "FormalParameters", items: [], rest: null },
        body: new Shift.LiteralNumericExpression(0)
      }
    );

    testParse("() => 0", expr,
      { type: "ArrowExpression",
        params: { type: "FormalParameters", items: [], rest: null },
        body: new Shift.LiteralNumericExpression(0)
      }
    );

    testParse("(...a) => 0", expr,
      { type: "ArrowExpression",
        params:
          { type: "FormalParameters",
            items: [],
            rest: { type: "BindingIdentifier", name: "a" }
          },
        body: new Shift.LiteralNumericExpression(0)
      }
    );

    testParse("() => {}", expr,
      { type: "ArrowExpression",
        params: { type: "FormalParameters", items: [], rest: null },
        body: new Shift.FunctionBody([], [])
      }
    );

    testParse("(a) => 0", expr,
      { type: "ArrowExpression",
        params:
          { type: "FormalParameters",
            items: [{ type: "BindingIdentifier", name: "a" }],
            rest: null
          },
        body: new Shift.LiteralNumericExpression(0)
      }
    );

    testParse("([a]) => 0", expr,
      { type: "ArrowExpression",
        params:
          { type: "FormalParameters",
            items:
              [
                new Shift.ArrayBinding(
                  [{ type: "BindingIdentifier", name: "a" }],
                  null)
              ],
            rest: null
          },
        body: new Shift.LiteralNumericExpression(0)
      }
    );

    testParse("a => 0", expr,
      { type: "ArrowExpression",
        params:
          { type: "FormalParameters",
            items: [{ type: "BindingIdentifier", name: "a" }],
            rest: null
          },
        body: new Shift.LiteralNumericExpression(0)
      }
    );

    testParse("({a}) => 0", expr,
      { type: "ArrowExpression",
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
            rest: null
          },
        body: new Shift.LiteralNumericExpression(0)
      }
    );

    testParse("() => () => 0", expr,
      { type: "ArrowExpression",
        params:
          { type: "FormalParameters",
            items: [],
            rest: null
          },
        body:
          { type: "ArrowExpression",
            params:
              { type: "FormalParameters",
                items: [],
                rest: null
              },
            body: new Shift.LiteralNumericExpression(0)
          }
      }
    );

    testParse("() => 0, 1", expr,
      new Shift.BinaryExpression(
        ",",
        { type: "ArrowExpression",
          params:
            { type: "FormalParameters",
              items: [],
              rest: null
            },
          body: new Shift.LiteralNumericExpression(0)
        },
        new Shift.LiteralNumericExpression(1)
      ));

    testParse("() => 0 + 1", expr,
      { type: "ArrowExpression",
        params:
          { type: "FormalParameters",
            items: [],
            rest: null
          },
        body:
          new Shift.BinaryExpression(
            "+",
            new Shift.LiteralNumericExpression(0),
            new Shift.LiteralNumericExpression(1)
          )
      }
    );

    testParse("(a,b) => 0 + 1", expr,
      { type: "ArrowExpression",
        params:
          { type: "FormalParameters",
            items:
              [
                { type: "BindingIdentifier", name: "a" },
                { type: "BindingIdentifier", name: "b" }
              ],
            rest: null
          },
        body:
          new Shift.BinaryExpression(
            "+",
            new Shift.LiteralNumericExpression(0),
            new Shift.LiteralNumericExpression(1)
          )
      }
    );

    testParse("(a,b,...c) => 0 + 1", expr,
      { type: "ArrowExpression",
        params:
          { type: "FormalParameters",
            items:
              [
                { type: "BindingIdentifier", name: "a" },
                { type: "BindingIdentifier", name: "b" }
              ],
            rest: { type: "BindingIdentifier", name: "c" }
          },
        body:
          new Shift.BinaryExpression(
            "+",
            new Shift.LiteralNumericExpression(0),
            new Shift.LiteralNumericExpression(1)
          )
      }
    );

    testParse("() => (a) = 0", expr,
      { type: "ArrowExpression",
        params: { type: "FormalParameters", items: [], rest: null },
        body:
          new Shift.AssignmentExpression(
            "=",
            { type: "BindingIdentifier", name: "a" },
            new Shift.LiteralNumericExpression(0)
          )
      }
    );

    testParse("a => b => c => 0", expr,
      { type: "ArrowExpression",
        params: { type: "FormalParameters", items: [{ type: "BindingIdentifier", name: "a" }], rest: null },
        body:
          { type: "ArrowExpression",
            params: { type: "FormalParameters", items: [{ type: "BindingIdentifier", name: "b" }], rest: null },
            body:
              { type: "ArrowExpression",
                params: { type: "FormalParameters", items: [{ type: "BindingIdentifier", name: "c" }], rest: null },
                body: new Shift.LiteralNumericExpression(0)
              }
          }
      }
    );

    testParse("(x)=>{'use strict';}", expr,
      { type: "ArrowExpression",
        params: { type: "FormalParameters", items: [{ type: "BindingIdentifier", name: "x" }], rest: null },
        body: new Shift.FunctionBody([new Shift.Directive("use strict")], [])
      }
    );

    testParse("'use strict';(x)=>0", expr,
      { type: "ArrowExpression",
        params: { type: "FormalParameters", items: [{ type: "BindingIdentifier", name: "x" }], rest: null },
        body: new Shift.LiteralNumericExpression(0)
      }
    );

    testParseFailure("[]=>0", "Unexpected token =>");
    testParseFailure("() + 1", "Unexpected token +");
    testParseFailure("1 + ()", "Unexpected end of input");
    testParseFailure("1 + ()", "Unexpected end of input");
    testParseFailure("(a)\n=> 0", "Unexpected token =>");
    testParseFailure("a\n=> 0", "Unexpected token =>");
    testParseFailure("((a)) => 1", "Illegal arrow function parameter list");
    testParseFailure("((a),...a) => 1", "Unexpected token ...");
    testParseFailure("(a,...a)", "Unexpected end of input");
    testParseFailure("(a,...a)\n", "Unexpected line terminator");
    testParseFailure("(a,...a)/*\r\n*/ => 0", "Unexpected line terminator");
    testParseFailure("(a,...a)/*\u2028*/ => 0", "Unexpected line terminator");
    testParseFailure("(a,...a)/*\u2029*/ => 0", "Unexpected line terminator");
    testParseFailure("(a,...a)/*\n*/ => 0", "Unexpected line terminator");
    testParseFailure("(a,...a)/*\r*/ => 0", "Unexpected line terminator");
    testParseFailure("(a,...a)/*\u202a*/", "Unexpected end of input");
    testParseFailure("() <= 0", "Unexpected token <=");
    testParseFailure("() ? 0", "Unexpected token ?");
    testParseFailure("() + 0", "Unexpected token +");
    testParseFailure("(10) => 0", "Illegal arrow function parameter list");
    testParseFailure("(10, 20) => 0", "Illegal arrow function parameter list");
  });
});
