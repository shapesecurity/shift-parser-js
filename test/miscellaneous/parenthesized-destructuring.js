var expr = require("../helpers").expr;
var testParse = require("../assertions").testParse;
var testParseFailure = require("../assertions").testParseFailure;

suite("Parser", function () {
  suite("parenthesized assignment", function () {
    suite("array", function () {
      testParse("[(a)] = 0", expr,
        {
          type: "AssignmentExpression",
          binding: { type: "ArrayBinding", elements: [{ type: "BindingIdentifier", name: "a" }], restElement: null },
          expression: { type: "LiteralNumericExpression", value: 0 }
        }
      );

      testParse("[(a) = 0] = 1", expr,
        {
          type: "AssignmentExpression",
          binding: { type: "ArrayBinding", elements: [{ type: "BindingWithDefault", binding: { type: "BindingIdentifier", name: "a" }, init: { type: "LiteralNumericExpression", value: 0 }}], restElement: null },
          expression: { type: "LiteralNumericExpression", value: 1 }
        }
      );

      testParse("[(a.b)] = 0", expr,
        {
          type: "AssignmentExpression",
          binding: { type: "ArrayBinding", elements: [{ type: "StaticMemberExpression", object: { type: "IdentifierExpression", name: "a" }, property: "b" }], restElement: null },
          expression: { type: "LiteralNumericExpression", value: 0 }
        }
      );

      testParse("[a = (b = c)] = 0", expr,
        {
          type: "AssignmentExpression",
          binding: { type: "ArrayBinding", elements: [{
            type: "BindingWithDefault",
            binding: { type: "BindingIdentifier", name: "a" },
            init: { type: "AssignmentExpression", binding: {type: "BindingIdentifier", name: "b"}, expression: { type: "IdentifierExpression", name: "c" }}
          }], restElement: null },
          expression: { type: "LiteralNumericExpression", value: 0 }
        }
      );

      testParse("[(a = 0)]", expr, {
        type: "ArrayExpression",
        elements: [
          {
            type: "AssignmentExpression",
            binding: {
              type: "BindingIdentifier",
              name: "a"
            },
            expression: {
              type: "LiteralNumericExpression",
              value: 0
            }
          }
        ]
      });

      testParseFailure("var [(a)] = 0", "Unexpected token \"(\"");
      testParseFailure("[(a = 0)] = 1", "Invalid left-hand side in assignment");
    });

    suite("object", function () {
      testParse("({a:(b)} = 0)", expr,
        {
          type: "AssignmentExpression",
          binding: { type: "ObjectBinding", properties: [{ type: "BindingPropertyProperty", name: {type: "StaticPropertyName", value: "a"}, binding: { type: "BindingIdentifier", name: "b" }}] },
          expression: { type: "LiteralNumericExpression", value: 0 }
        }
      );

      testParse("({a:(b) = 0} = 1)", expr,
        {
          type: "AssignmentExpression",
          binding: { type: "ObjectBinding", properties: [{ type: "BindingPropertyProperty", name: {type: "StaticPropertyName", value: "a"}, binding: { type: "BindingWithDefault", binding: { type: "BindingIdentifier", name: "b" }, init: { type: "LiteralNumericExpression", value: 0 }}}] },
          expression: { type: "LiteralNumericExpression", value: 1 }
        }
      );


      testParse("({a:(b.c)} = 0)", expr,
        {
          type: "AssignmentExpression",
          binding: { type: "ObjectBinding", properties: [{ type: "BindingPropertyProperty", name: {type: "StaticPropertyName", value: "a"}, binding: { type: "StaticMemberExpression", object: { type: "IdentifierExpression", name: "b" }, property: "c"}}] },
          expression: { type: "LiteralNumericExpression", value: 0 }
        }
      );

      testParse("({a:(b = 0)})", expr, {
        type: "ObjectExpression",
        properties: [
          {
            type: "DataProperty",
            expression: {
              type: "AssignmentExpression",
              binding: { type: "BindingIdentifier", name: "b" },
              expression: {
                type: "LiteralNumericExpression",
                value: 0
              }
            },
            name: {
              type: "StaticPropertyName",
              value: "a"
            }
          }
        ]
      });

      testParseFailure("var {(a)} = 0", "Unexpected token \"(\"");
      testParseFailure("var {a:(b)} = 0", "Unexpected token \"(\"");
      testParseFailure("({(a)} = 0)", "Unexpected token \"(\"");
      testParseFailure("({a:(b = 0)} = 1)", "Invalid left-hand side in assignment");
    });
  });
});
