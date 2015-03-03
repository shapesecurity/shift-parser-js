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

var expr = require("../helpers").expr;
var testParse = require("../assertions").testParse;

suite("Parser", function () {
  suite("prefix expression", function () {

    testParse("!a", expr,
      { type: "PrefixExpression",
        operand: { type: "IdentifierExpression", identifier: { type: "Identifier", name: "a" } },
        operator: "!" }
    );

    testParse("typeof a", expr,
      { type: "PrefixExpression",
        operand: { type: "IdentifierExpression", identifier: { type: "Identifier", name: "a" } },
        operator: "typeof" }
    );

    testParse("void a", expr,
      { type: "PrefixExpression",
        operand: { type: "IdentifierExpression", identifier: { type: "Identifier", name: "a" } },
        operator: "void" }
    );

    testParse("delete a", expr,
      { type: "PrefixExpression",
        operand: { type: "IdentifierExpression", identifier: { type: "Identifier", name: "a" } },
        operator: "delete" }
    );

    testParse("+a", expr,
      { type: "PrefixExpression",
        operand: { type: "IdentifierExpression", identifier: { type: "Identifier", name: "a" } },
        operator: "+" }
    );

    testParse("~a", expr,
      { type: "PrefixExpression",
        operand: { type: "IdentifierExpression", identifier: { type: "Identifier", name: "a" } },
        operator: "~" }
    );

    testParse("++a", expr,
      { type: "PrefixExpression",
        operand: { type: "IdentifierExpression", identifier: { type: "Identifier", name: "a" } },
        operator: "++" }
    );

    testParse("-a", expr,
      { type: "PrefixExpression",
        operand: { type: "IdentifierExpression", identifier: { type: "Identifier", name: "a" } },
        operator: "-" }
    );

    testParse("--a", expr,
      { type: "PrefixExpression",
        operand: { type: "IdentifierExpression", identifier: { type: "Identifier", name: "a" } },
        operator: "--" }
    );

  });
});
