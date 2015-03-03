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
  suite("grouping", function () {

    testParse("((((((((((((((((((((((((((((((((((((((((((((((((((0))))))))))))))))))))))))))))))))))))))))))))))))))", expr,
      { type: "LiteralNumericExpression", value: 0 }
    );

    testParse("(1 + 2 ) * 3", expr,
      { type: "BinaryExpression",
        operator: "*",
        left:
          { type: "BinaryExpression",
            operator: "+",
            left: { type: "LiteralNumericExpression", value: 1 },
            right: { type: "LiteralNumericExpression", value: 2 } },
        right: { type: "LiteralNumericExpression", value: 3 } }
    );

    testParse("(1) + (2  ) + 3", expr,
      { type: "BinaryExpression",
        operator: "+",
        left:
          { type: "BinaryExpression",
            operator: "+",
            left: { type: "LiteralNumericExpression", value: 1 },
            right: { type: "LiteralNumericExpression", value: 2 } },
        right: { type: "LiteralNumericExpression", value: 3 } }
    );

    testParse("4 + 5 << (6)", expr,
      { type: "BinaryExpression",
        operator: "<<",
        left:
          { type: "BinaryExpression",
            operator: "+",
            left: { type: "LiteralNumericExpression", value: 4 },
            right: { type: "LiteralNumericExpression", value: 5 } },
        right: { type: "LiteralNumericExpression", value: 6 } }
    );


    testParse("(a) + (b)", expr,
      new Shift.BinaryExpression(
        "+",
        new Shift.IdentifierExpression(new Shift.Identifier("a")),
        new Shift.IdentifierExpression(new Shift.Identifier("b"))
      )
    );

    testParse("(a)", expr,
      new Shift.IdentifierExpression(new Shift.Identifier("a"))
    );

    testParse("((a))", expr,
      new Shift.IdentifierExpression(new Shift.Identifier("a"))
    );

    testParse("((a))()", expr,
      new Shift.CallExpression(new Shift.IdentifierExpression(new Shift.Identifier("a")), [])
    );

    testParse("((a))((a))", expr,
      new Shift.CallExpression(
        new Shift.IdentifierExpression(new Shift.Identifier("a")),
        [new Shift.IdentifierExpression(new Shift.Identifier("a"))]
      )
    );

    testParse("(a) = 0", expr,
      new Shift.AssignmentExpression("=",
        new Shift.BindingIdentifier(new Shift.Identifier("a")),
        new Shift.LiteralNumericExpression(0)
      )
    );

    testParse("((a)) = 0", expr,
      new Shift.AssignmentExpression("=",
        new Shift.BindingIdentifier(new Shift.Identifier("a")),
        new Shift.LiteralNumericExpression(0)
      )
    );

    testParse("void (a)", expr,
      new Shift.PrefixExpression("void", new Shift.IdentifierExpression(new Shift.Identifier("a")))
    );

    testParse("(void a)", expr,
      new Shift.PrefixExpression("void", new Shift.IdentifierExpression(new Shift.Identifier("a")))
    );

    testParse("(a++)", expr,
      new Shift.PostfixExpression(
        new Shift.IdentifierExpression(new Shift.Identifier("a")),
        "++"
      )
    );

    testParse("(a)++", expr,
      new Shift.PostfixExpression(
        new Shift.IdentifierExpression(new Shift.Identifier("a")),
        "++"
      )
    );

    testParse("(a)--", expr,
      new Shift.PostfixExpression(
        new Shift.IdentifierExpression(new Shift.Identifier("a")),
        "--"
      )
    );

    testParse("(a) ? (b) : (c)", expr,
      new Shift.ConditionalExpression(
        new Shift.IdentifierExpression(new Shift.Identifier("a")),
        new Shift.IdentifierExpression(new Shift.Identifier("b")),
        new Shift.IdentifierExpression(new Shift.Identifier("c"))
      )
    );
  });
});
