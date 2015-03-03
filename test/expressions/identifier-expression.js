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

var testParse = require("../assertions").testParse;
var expr = require("../helpers").expr;

suite("Parser", function () {
  suite("identifier expression", function () {

    testParse("x", expr,
      { type: "IdentifierExpression", identifier: { type: "Identifier", name: "x" } }
    );

    testParse("x;", expr,
      { type: "IdentifierExpression", identifier: { type: "Identifier", name: "x" } }
    );

  });

  suite("unicode identifier", function () {
    // Unicode
    testParse("日本語", expr,
      { type: "IdentifierExpression", identifier: { type: "Identifier", name: "日本語" } }
    );

    testParse("T\u203F", expr,
      { type: "IdentifierExpression", identifier: { type: "Identifier", name: "T\u203F" } }
    );

    testParse("T\u200C", expr,
      { type: "IdentifierExpression", identifier: { type: "Identifier", name: "T\u200C" } }
    );

    testParse("T\u200D", expr,
      { type: "IdentifierExpression", identifier: { type: "Identifier", name: "T\u200D" } }
    );

    testParse("\u2163\u2161", expr,
      { type: "IdentifierExpression", identifier: { type: "Identifier", name: "\u2163\u2161" } }
    );

    testParse("\u2163\u2161\u200A", expr,
      { type: "IdentifierExpression", identifier: { type: "Identifier", name: "\u2163\u2161" } }
    );

  });
});
