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

suite("Parser", function () {
  suite("assignment expression", function () {
    testParse("a=0;", expr,
      new Shift.AssignmentExpression(
        "=",
        { type: "BindingIdentifier", name: "a" },
        new Shift.LiteralNumericExpression(0)
      )
    );
    testParse("(a)=(0);", expr,
      new Shift.AssignmentExpression(
        "=",
        { type: "BindingIdentifier", name: "a" },
        new Shift.LiteralNumericExpression(0)
      )
    );
    testParse("x = 0", expr,
      new Shift.AssignmentExpression(
        "=",
        { type: "BindingIdentifier", name: "x" },
        new Shift.LiteralNumericExpression(0)
      )
    );
    testParse("eval = 0", expr,
      new Shift.AssignmentExpression(
        "=",
        { type: "BindingIdentifier", name: "eval" },
        new Shift.LiteralNumericExpression(0)
      )
    );
    testParse("arguments = 0", expr,
      new Shift.AssignmentExpression(
        "=",
        { type: "BindingIdentifier", name: "arguments" },
        new Shift.LiteralNumericExpression(0)
      )
    );
    testParse("x *= 0", expr,
      new Shift.AssignmentExpression(
        "*=",
        { type: "BindingIdentifier", name: "x" },
        new Shift.LiteralNumericExpression(0)
      )
    );
    testParse("x.x *= 0", expr,
      new Shift.AssignmentExpression(
        "*=",
        new Shift.StaticMemberExpression(
          { type: "IdentifierExpression", name: "x" },
          "x"
        ),
        new Shift.LiteralNumericExpression(0)
      )
    );
    testParse("x /= 0", expr,
      new Shift.AssignmentExpression(
        "/=",
        { type: "BindingIdentifier", name: "x" },
        new Shift.LiteralNumericExpression(0)
      )
    );
    testParse("x %= 0", expr,
      new Shift.AssignmentExpression(
        "%=",
        { type: "BindingIdentifier", name: "x" },
        new Shift.LiteralNumericExpression(0)
      )
    );
    testParse("x += 0", expr,
      new Shift.AssignmentExpression(
        "+=",
        { type: "BindingIdentifier", name: "x" },
        new Shift.LiteralNumericExpression(0)
      )
    );
    testParse("x -= 0", expr,
      new Shift.AssignmentExpression(
        "-=",
        { type: "BindingIdentifier", name: "x" },
        new Shift.LiteralNumericExpression(0)
      )
    );
    testParse("x <<= 0", expr,
      new Shift.AssignmentExpression(
        "<<=",
        { type: "BindingIdentifier", name: "x" },
        new Shift.LiteralNumericExpression(0)
      )
    );
    testParse("x >>= 0", expr,
      new Shift.AssignmentExpression(
        ">>=",
        { type: "BindingIdentifier", name: "x" },
        new Shift.LiteralNumericExpression(0)
      )
    );
    testParse("x >>>= 0", expr,
      new Shift.AssignmentExpression(
        ">>>=",
        { type: "BindingIdentifier", name: "x" },
        new Shift.LiteralNumericExpression(0)
      )
    );
    testParse("x &= 0", expr,
      new Shift.AssignmentExpression(
        "&=",
        { type: "BindingIdentifier", name: "x" },
        new Shift.LiteralNumericExpression(0)
      )
    );
    testParse("x ^= 0", expr,
      new Shift.AssignmentExpression(
        "^=",
        { type: "BindingIdentifier", name: "x" },
        new Shift.LiteralNumericExpression(0)
      )
    );
    testParse("x |= 0", expr,
      new Shift.AssignmentExpression(
        "|=",
        { type: "BindingIdentifier", name: "x" },
        new Shift.LiteralNumericExpression(0)
      )
    );

    testParse("'use strict'; eval[0] = 0", expr,
      new Shift.AssignmentExpression(
        "=",
        new Shift.ComputedMemberExpression(
          { type: "IdentifierExpression", name: "eval" },
          new Shift.LiteralNumericExpression(0)
        ),
        new Shift.LiteralNumericExpression(0)
      )
    );

    testParse("'use strict'; arguments[0] = 0", expr,
      new Shift.AssignmentExpression(
        "=",
        new Shift.ComputedMemberExpression(
          { type: "IdentifierExpression", name: "arguments" },
          new Shift.LiteralNumericExpression(0)
        ),
        new Shift.LiteralNumericExpression(0)
      )
    );

    // TODO: add some assignment failure tests
  });
});
