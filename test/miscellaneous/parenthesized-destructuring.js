let expr = require('../helpers').expr;
let testParse = require('../assertions').testParse;
let testParseFailure = require('../assertions').testParseFailure;

suite('Parser', () => {
  suite('parenthesized assignment', () => {
    suite('array', () => {
      testParse('[(a)] = 0', expr,
        {
          type: 'AssignmentExpression',
          binding: { type: 'ArrayAssignmentTarget',
            elements: [{ type: 'AssignmentTargetIdentifier', name: 'a' }], rest: null },
          expression: { type: 'LiteralNumericExpression', value: 0 },
        }
      );

      testParse('[(a) = 0] = 1', expr,
        {
          type: 'AssignmentExpression',
          binding: { type: 'ArrayAssignmentTarget', elements: [{ type: 'AssignmentTargetWithDefault',
            binding: { type: 'AssignmentTargetIdentifier', name: 'a' },
            init: { type: 'LiteralNumericExpression', value: 0 } }], rest: null },
          expression: { type: 'LiteralNumericExpression', value: 1 },
        }
      );

      testParse('[(a.b)] = 0', expr,
        {
          type: 'AssignmentExpression',
          binding: { type: 'ArrayAssignmentTarget', elements: [{ type: 'StaticMemberAssignmentTarget',
            object: { type: 'IdentifierExpression', name: 'a' }, property: 'b' }], rest: null },
          expression: { type: 'LiteralNumericExpression', value: 0 },
        }
      );

      testParse('[a = (b = c)] = 0', expr,
        {
          type: 'AssignmentExpression',
          binding: { type: 'ArrayAssignmentTarget', elements: [{
            type: 'AssignmentTargetWithDefault',
            binding: { type: 'AssignmentTargetIdentifier', name: 'a' },
            init: { type: 'AssignmentExpression', binding: { type: 'AssignmentTargetIdentifier', name: 'b' },
              expression: { type: 'IdentifierExpression', name: 'c' } },
          }], rest: null },
          expression: { type: 'LiteralNumericExpression', value: 0 },
        }
      );

      testParse('[(a = 0)]', expr, {
        type: 'ArrayExpression',
        elements: [
          {
            type: 'AssignmentExpression',
            binding: {
              type: 'AssignmentTargetIdentifier',
              name: 'a',
            },
            expression: {
              type: 'LiteralNumericExpression',
              value: 0,
            },
          },
        ],
      });

      testParseFailure('var [(a)] = 0', 'Unexpected token "("');
      testParseFailure('[(a = 0)] = 1', 'Invalid left-hand side in assignment');
    });

    suite('object', () => {
      testParse('({a:(b)} = 0)', expr,
        {
          type: 'AssignmentExpression',
          binding: { type: 'ObjectAssignmentTarget', properties: [{ type: 'AssignmentTargetPropertyProperty',
            name: { type: 'StaticPropertyName', value: 'a' },
            binding: { type: 'AssignmentTargetIdentifier', name: 'b' } }] },
          expression: { type: 'LiteralNumericExpression', value: 0 },
        }
      );

      testParse('({a:(b) = 0} = 1)', expr,
        {
          type: 'AssignmentExpression',
          binding: { type: 'ObjectAssignmentTarget', properties: [{ type: 'AssignmentTargetPropertyProperty',
            name: { type: 'StaticPropertyName', value: 'a' }, binding: { type: 'AssignmentTargetWithDefault',
              binding: { type: 'AssignmentTargetIdentifier', name: 'b' },
              init: { type: 'LiteralNumericExpression', value: 0 } } }] },
          expression: { type: 'LiteralNumericExpression', value: 1 },
        }
      );


      testParse('({a:(b.c)} = 0)', expr,
        {
          type: 'AssignmentExpression',
          binding: { type: 'ObjectAssignmentTarget', properties: [{ type: 'AssignmentTargetPropertyProperty',
            name: { type: 'StaticPropertyName', value: 'a' }, binding: { type: 'StaticMemberAssignmentTarget',
              object: { type: 'IdentifierExpression', name: 'b' }, property: 'c' } }] },
          expression: { type: 'LiteralNumericExpression', value: 0 },
        }
      );

      testParse('({a:(b = 0)})', expr, {
        type: 'ObjectExpression',
        properties: [
          {
            type: 'DataProperty',
            expression: {
              type: 'AssignmentExpression',
              binding: { type: 'AssignmentTargetIdentifier', name: 'b' },
              expression: {
                type: 'LiteralNumericExpression',
                value: 0,
              },
            },
            name: {
              type: 'StaticPropertyName',
              value: 'a',
            },
          },
        ],
      });

      testParseFailure('var {(a)} = 0', 'Unexpected token "("');
      testParseFailure('var {a:(b)} = 0', 'Unexpected token "("');
      testParseFailure('({(a)} = 0)', 'Unexpected token "("');
      testParseFailure('({a:(b = 0)} = 1)', 'Invalid left-hand side in assignment');
    });
  });
});
