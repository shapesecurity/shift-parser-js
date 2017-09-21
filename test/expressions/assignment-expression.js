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

let testParse = require('../assertions').testParse;
let testParseFailure = require('../assertions').testParseFailure;
let expr = require('../helpers').expr;

suite('Parser', () => {
  suite('assignment expression', () => {
    testParse('a=0;', expr,
      {
        type: 'AssignmentExpression',
        binding: { type: 'AssignmentTargetIdentifier', name: 'a' },
        expression: { type: 'LiteralNumericExpression', value: 0 },
      }
    );
    testParse('(a)=(0);', expr,
      {
        type: 'AssignmentExpression',
        binding: { type: 'AssignmentTargetIdentifier', name: 'a' },
        expression: { type: 'LiteralNumericExpression', value: 0 },
      }
    );
    testParse('x = 0', expr,
      {
        type: 'AssignmentExpression',
        binding: { type: 'AssignmentTargetIdentifier', name: 'x' },
        expression: { type: 'LiteralNumericExpression', value: 0 },
      }
    );
    testParse('eval = 0', expr,
      {
        type: 'AssignmentExpression',
        binding: { type: 'AssignmentTargetIdentifier', name: 'eval' },
        expression: { type: 'LiteralNumericExpression', value: 0 },
      }
    );
    testParse('arguments = 0', expr,
      {
        type: 'AssignmentExpression',
        binding: { type: 'AssignmentTargetIdentifier', name: 'arguments' },
        expression: { type: 'LiteralNumericExpression', value: 0 },
      }
    );
    testParse('x *= 0', expr,
      {
        type: 'CompoundAssignmentExpression',
        operator: '*=',
        binding: { type: 'AssignmentTargetIdentifier', name: 'x' },
        expression: { type: 'LiteralNumericExpression', value: 0 },
      }
    );
    testParse('x.x *= 0', expr,
      {
        type: 'CompoundAssignmentExpression',
        operator: '*=',
        binding: { type: 'StaticMemberAssignmentTarget',
          object: { type: 'IdentifierExpression', name: 'x' }, property: 'x' },
        expression: { type: 'LiteralNumericExpression', value: 0 },
      }
    );
    testParse('x /= 0', expr,
      {
        type: 'CompoundAssignmentExpression',
        operator: '/=',
        binding: { type: 'AssignmentTargetIdentifier', name: 'x' },
        expression: { type: 'LiteralNumericExpression', value: 0 },
      }
    );
    testParse('x %= 0', expr,
      {
        type: 'CompoundAssignmentExpression',
        operator: '%=',
        binding: { type: 'AssignmentTargetIdentifier', name: 'x' },
        expression: { type: 'LiteralNumericExpression', value: 0 },
      }
    );
    testParse('x **= 0', expr,
      {
        type: 'CompoundAssignmentExpression',
        operator: '**=',
        binding: { type: 'AssignmentTargetIdentifier', name: 'x' },
        expression: { type: 'LiteralNumericExpression', value: 0 },
      }
    );
    testParse('x += 0', expr,
      {
        type: 'CompoundAssignmentExpression',
        operator: '+=',
        binding: { type: 'AssignmentTargetIdentifier', name: 'x' },
        expression: { type: 'LiteralNumericExpression', value: 0 },
      }
    );
    testParse('x -= 0', expr,
      {
        type: 'CompoundAssignmentExpression',
        operator: '-=',
        binding: { type: 'AssignmentTargetIdentifier', name: 'x' },
        expression: { type: 'LiteralNumericExpression', value: 0 },
      }
    );
    testParse('x <<= 0', expr,
      {
        type: 'CompoundAssignmentExpression',
        operator: '<<=',
        binding: { type: 'AssignmentTargetIdentifier', name: 'x' },
        expression: { type: 'LiteralNumericExpression', value: 0 },
      }
    );
    testParse('x >>= 0', expr,
      {
        type: 'CompoundAssignmentExpression',
        operator: '>>=',
        binding: { type: 'AssignmentTargetIdentifier', name: 'x' },
        expression: { type: 'LiteralNumericExpression', value: 0 },
      }
    );
    testParse('x >>>= 0', expr,
      {
        type: 'CompoundAssignmentExpression',
        operator: '>>>=',
        binding: { type: 'AssignmentTargetIdentifier', name: 'x' },
        expression: { type: 'LiteralNumericExpression', value: 0 },
      }
    );
    testParse('x &= 0', expr,
      {
        type: 'CompoundAssignmentExpression',
        operator: '&=',
        binding: { type: 'AssignmentTargetIdentifier', name: 'x' },
        expression: { type: 'LiteralNumericExpression', value: 0 },
      }
    );
    testParse('x ^= 0', expr,
      {
        type: 'CompoundAssignmentExpression',
        operator: '^=',
        binding: { type: 'AssignmentTargetIdentifier', name: 'x' },
        expression: { type: 'LiteralNumericExpression', value: 0 },
      }
    );
    testParse('x |= 0', expr,
      {
        type: 'CompoundAssignmentExpression',
        operator: '|=',
        binding: { type: 'AssignmentTargetIdentifier', name: 'x' },
        expression: { type: 'LiteralNumericExpression', value: 0 },
      }
    );

    testParse('\'use strict\'; eval[0] = 0', expr,
      {
        type: 'AssignmentExpression',
        binding: {
          type: 'ComputedMemberAssignmentTarget',
          object: { type: 'IdentifierExpression', name: 'eval' },
          expression: { type: 'LiteralNumericExpression', value: 0 },
        },
        expression: { type: 'LiteralNumericExpression', value: 0 },
      }
    );

    testParse('\'use strict\'; arguments[0] = 0', expr,
      {
        type: 'AssignmentExpression',
        binding: {
          type: 'ComputedMemberAssignmentTarget',
          object: { type: 'IdentifierExpression', name: 'arguments' },
          expression: { type: 'LiteralNumericExpression', value: 0 },
        },
        expression: { type: 'LiteralNumericExpression', value: 0 },
      }
    );

    testParse('((((((((((((((((((((((((((((((((((((((((a)))))))))))))))))))))))))))))))))))))))) = 0', expr,
      {
        type: 'AssignmentExpression',
        binding: { type: 'AssignmentTargetIdentifier', name: 'a' },
        expression: { type: 'LiteralNumericExpression', value: 0 },
      });

    testParse('((((((((((((((((((((((((((((((((((((((((a.a)))))))))))))))))))))))))))))))))))))))) = 0', expr,
      {
        type: 'AssignmentExpression',
        binding: { type: 'StaticMemberAssignmentTarget',
          object: { type: 'IdentifierExpression', name: 'a' }, property: 'a' },
        expression: { type: 'LiteralNumericExpression', value: 0 },
      });

    testParse('[0].length = 0', expr,
      {
        type: 'AssignmentExpression',
        binding: {
          type: 'StaticMemberAssignmentTarget',
          object: {
            type: 'ArrayExpression',
            elements: [
              { type: 'LiteralNumericExpression', value: 0 },
            ],
          },
          property: 'length',
        },
        expression: { type: 'LiteralNumericExpression', value: 0 },
      });

    testParse('([0].length) = 0', expr,
      {
        type: 'AssignmentExpression',
        binding: {
          type: 'StaticMemberAssignmentTarget',
          object: {
            type: 'ArrayExpression',
            elements: [
              { type: 'LiteralNumericExpression', value: 0 },
            ],
          },
          property: 'length',
        },
        expression: { type: 'LiteralNumericExpression', value: 0 },
      });

    testParse('(a**b).c=0', expr,
      {
        type: 'AssignmentExpression',
        binding: {
          type: 'StaticMemberAssignmentTarget',
          object: {
            type: 'BinaryExpression',
            left: { type: 'IdentifierExpression', name: 'a' },
            operator: '**',
            right: { type: 'IdentifierExpression', name: 'b' },
          },
          property: 'c',
        },
        expression: { type: 'LiteralNumericExpression', value: 0 },
      });

    testParseFailure('(({a})=0);', 'Invalid left-hand side in assignment');
    testParseFailure('(([a])=0);', 'Invalid left-hand side in assignment');

    testParseFailure('({a: (b = 0)} = {})', 'Invalid left-hand side in assignment');
    testParseFailure('([(a = b)] = []', 'Invalid left-hand side in assignment');
  });
});
