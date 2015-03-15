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

var expr = require("../../helpers").expr;
var testParse = require("../../assertions").testParse;
var testParseFailure = require("../../assertions").testParseFailure;

suite("Parser", function () {
  suite("array binding", function () {
    suite("assignment", function () {
      testParse("[x] = 0", expr,
        new Shift.AssignmentExpression(
          "=",
          new Shift.ArrayBinding(
            [{ type: "BindingIdentifier", name: "x" }],
            null
          ),
          new Shift.LiteralNumericExpression(0)
        )
      );

      testParse("[x,] = 0", expr,
        new Shift.AssignmentExpression(
          "=",
          new Shift.ArrayBinding(
            [{ type: "BindingIdentifier", name: "x" }],
            null
          ),
          new Shift.LiteralNumericExpression(0)
        )
      );

      testParse("[x,,] = 0", expr,
        new Shift.AssignmentExpression(
          "=",
          new Shift.ArrayBinding(
            [{ type: "BindingIdentifier", name: "x" }, null],
            null
          ),
          new Shift.LiteralNumericExpression(0)
        )
      );

      testParse("[[x]] = 0", expr,
        new Shift.AssignmentExpression(
          "=",
          new Shift.ArrayBinding(
            [
              new Shift.ArrayBinding(
                [{ type: "BindingIdentifier", name: "x" }],
                null
              ),
            ],
            null
          ),
          new Shift.LiteralNumericExpression(0)
        )
      );

      testParse("[x, y, ...z] = 0", expr,
        new Shift.AssignmentExpression(
          "=",
          new Shift.ArrayBinding(
            [
              { type: "BindingIdentifier", name: "x" },
              { type: "BindingIdentifier", name: "y" },
            ],
            { type: "BindingIdentifier", name: "z" }
          ),
          new Shift.LiteralNumericExpression(0)
        )
      );

      testParse("[, x,,] = 0", expr,
        new Shift.AssignmentExpression(
          "=",
          new Shift.ArrayBinding(
            [
              null,
              { type: "BindingIdentifier", name: "x" },
              null,
            ],
            null
          ),
          new Shift.LiteralNumericExpression(0)
        )
      );

      testParse("[...[x]] = 0", expr,
        new Shift.AssignmentExpression(
          "=",
          new Shift.ArrayBinding([], new Shift.ArrayBinding([
            { type: "BindingIdentifier", name: "x" },
          ], null)),
          new Shift.LiteralNumericExpression(0)
        )
      );

      testParse("[x, ...{0: y}] = 0", expr,
        new Shift.AssignmentExpression(
          "=",
          new Shift.ArrayBinding(
            [
              { type: "BindingIdentifier", name: "x" },
            ],
            new Shift.ObjectBinding([
              new Shift.BindingPropertyProperty(
                new Shift.StaticPropertyName("0"),
                { type: "BindingIdentifier", name: "y" }
              ),
            ])
          ),
          new Shift.LiteralNumericExpression(0)
        )
      );

      testParse("[x, x] = 0", expr,
        new Shift.AssignmentExpression(
          "=",
          new Shift.ArrayBinding(
            [
              { type: "BindingIdentifier", name: "x" },
              { type: "BindingIdentifier", name: "x" },
            ],
            null
          ),
          new Shift.LiteralNumericExpression(0)
        )
      );

      testParse("[x, ...x] = 0", expr,
        new Shift.AssignmentExpression(
          "=",
          new Shift.ArrayBinding(
            [
              { type: "BindingIdentifier", name: "x" },
            ],
            { type: "BindingIdentifier", name: "x" }
          ),
          new Shift.LiteralNumericExpression(0)
        )
      );

      testParse("[x.a=a] = b", expr, {
        "type": "AssignmentExpression",
        "binding": {
          "elements": [
            {
              "type": "BindingWithDefault",
              "binding": {
                "type": "StaticMemberExpression",
                "object": {
                  "type": "IdentifierExpression",
                  "name": "x",
                },
                "property": "a",
              },
              "init": {
                "type": "IdentifierExpression",
                "name": "a",
              }
            }
          ],
          "restElement": null,
          "type": "ArrayBinding",
        },
        "operator": "=",
        "expression": {
          "type": "IdentifierExpression",
          "name": "b",
        }
      });

      testParse("[x[a]=a] = b", expr, {
        type: "AssignmentExpression",
        binding: {
          elements: [
            {
              type: "BindingWithDefault",
              binding: {
                type: "ComputedMemberExpression",
                object: {
                  type: "IdentifierExpression",
                  name: "x",
                },
                expression: {
                  type: "IdentifierExpression",
                  name: "a",
                },
              },
              init: {
                type: "IdentifierExpression",
                name: "a",
              }
            }
          ],
          restElement: null,
          type: "ArrayBinding",
        },
        operator: "=",
        expression: {
          type: "IdentifierExpression",
          name: "b",
        }
      });

      testParse("[...[...a[x]]] = b", expr, {
        type: "AssignmentExpression",
        binding: {
          type: "ArrayBinding",
          elements: [],
          restElement: {
            type: "ArrayBinding",
            elements: [],
            restElement: {
              type: "ComputedMemberExpression",
              object: {
                type: "IdentifierExpression",
                name: "a"
              },
              expression: {
                type: "IdentifierExpression",
                name: "x"
              }
            },
          },
        },
        operator: "=",
        expression: {
          type: "IdentifierExpression",
          name: "b",
        },
      });

      testParse("[] = 0", expr, {
        type: "AssignmentExpression",
        binding: {
          type: "ArrayBinding",
          elements: [],
          restElement: null
        },
        operator: "=",
        expression: {
          type: "LiteralNumericExpression",
          value: 0
        }
      });

      testParse("[{a=0},{a=0}] = 0", expr, {
        type: "AssignmentExpression",
        binding: {
          type: "ArrayBinding",
          elements: [
            {
              type: "ObjectBinding",
              properties: [{
                type: "BindingPropertyIdentifier",
                binding: { type: "BindingIdentifier", name: "a" },
                init: { type: "LiteralNumericExpression", value: 0 }
              }]
            },
            {
              type: "ObjectBinding",
              properties: [{
                type: "BindingPropertyIdentifier",
                binding: { type: "BindingIdentifier", name: "a" },
                init: { type: "LiteralNumericExpression", value: 0 }
              }]
            },
          ],
          restElement: null,
        },
        operator: "=",
        expression: { type: "LiteralNumericExpression", value: 0 }
      });

      testParseFailure("[, x, ...y,] = 0", "Invalid left-hand side in assignment");
      testParseFailure("[...x, ...y] = 0", "Invalid left-hand side in assignment"); // TODO(bzhang): Unexpected token ,
      testParseFailure("[...x, y] = 0", "Invalid left-hand side in assignment");
      testParseFailure("[...x,,] = 0", "Invalid left-hand side in assignment");
      testParseFailure("[0,{a=0}] = 0", "Illegal property initializer");
      testParseFailure("[{a=0},{b=0},0] = 0", "Illegal property initializer");
      testParseFailure("[{a=0},...0]", "Illegal property initializer");
      testParseFailure("[...0,a]=0", "Invalid left-hand side in assignment");
      testParseFailure("[...0,{a=0}]=0", "Illegal property initializer");
      testParseFailure("[...0,...{a=0}]=0", "Illegal property initializer");
      testParseFailure("[...{a=0},]", "Illegal property initializer");
      testParseFailure("[...{a=0},]=0", "Invalid left-hand side in assignment");
    });
  });
});
