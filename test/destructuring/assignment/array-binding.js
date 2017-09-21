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

let expr = require('../../helpers').expr;
let testParse = require('../../assertions').testParse;
let testParseFailure = require('../../assertions').testParseFailure;

suite('Parser', () => {
  suite('array binding', () => {
    suite('assignment', () => {
      testParse('[x] = 0', expr,
        {
          type: 'AssignmentExpression',
          binding: { type: 'ArrayAssignmentTarget',
            elements: [{ type: 'AssignmentTargetIdentifier', name: 'x' }], rest: null },
          expression: { type: 'LiteralNumericExpression', value: 0 },
        }
      );

      testParse('[x,] = 0', expr,
        {
          type: 'AssignmentExpression',
          binding: { type: 'ArrayAssignmentTarget',
            elements: [{ type: 'AssignmentTargetIdentifier', name: 'x' }], rest: null },
          expression: { type: 'LiteralNumericExpression', value: 0 },
        }
      );

      testParse('[x,,] = 0', expr,
        {
          type: 'AssignmentExpression',
          binding: {
            type: 'ArrayAssignmentTarget',
            elements: [{ type: 'AssignmentTargetIdentifier', name: 'x' }, null],
            rest: null,
          },
          expression: { type: 'LiteralNumericExpression', value: 0 },
        }
      );

      testParse('[[x]] = 0', expr,
        {
          type: 'AssignmentExpression',
          binding: {
            type: 'ArrayAssignmentTarget',
            elements: [{
              type: 'ArrayAssignmentTarget',
              elements: [{ type: 'AssignmentTargetIdentifier', name: 'x' }],
              rest: null,
            }],
            rest: null,
          },
          expression: { type: 'LiteralNumericExpression', value: 0 },
        }
      );

      testParse('[x, y, ...z] = 0', expr,
        {
          type: 'AssignmentExpression',
          binding: {
            type: 'ArrayAssignmentTarget',
            elements: [{ type: 'AssignmentTargetIdentifier', name: 'x' },
              { type: 'AssignmentTargetIdentifier', name: 'y' }],
            rest: { type: 'AssignmentTargetIdentifier', name: 'z' },
          },
          expression: { type: 'LiteralNumericExpression', value: 0 },
        }
      );

      testParse('[, x,,] = 0', expr,
        {
          type: 'AssignmentExpression',
          binding: {
            type: 'ArrayAssignmentTarget',
            elements: [null, { type: 'AssignmentTargetIdentifier', name: 'x' }, null],
            rest: null,
          },
          expression: { type: 'LiteralNumericExpression', value: 0 },
        }
      );

      testParse('[...[x]] = 0', expr,
        {
          type: 'AssignmentExpression',
          binding: {
            type: 'ArrayAssignmentTarget',
            elements: [],
            rest: {
              type: 'ArrayAssignmentTarget',
              elements: [{ type: 'AssignmentTargetIdentifier', name: 'x' }],
              rest: null,
            },
          },
          expression: { type: 'LiteralNumericExpression', value: 0 },
        }
      );

      testParse('[x, ...{0: y}] = 0', expr,
        {
          type: 'AssignmentExpression',
          binding: {
            type: 'ArrayAssignmentTarget',
            elements: [{ type: 'AssignmentTargetIdentifier', name: 'x' }],
            rest: {
              type: 'ObjectAssignmentTarget',
              properties: [{
                type: 'AssignmentTargetPropertyProperty',
                name: { type: 'StaticPropertyName', value: '0' },
                binding: { type: 'AssignmentTargetIdentifier', name: 'y' },
              }],
            },
          },
          expression: { type: 'LiteralNumericExpression', value: 0 },
        }
      );

      testParse('[x, x] = 0', expr,
        {
          type: 'AssignmentExpression',
          binding: {
            type: 'ArrayAssignmentTarget',
            elements: [{ type: 'AssignmentTargetIdentifier', name: 'x' },
              { type: 'AssignmentTargetIdentifier', name: 'x' }],
            rest: null,
          },
          expression: { type: 'LiteralNumericExpression', value: 0 },
        }
      );

      testParse('[x, ...x] = 0', expr,
        {
          type: 'AssignmentExpression',
          binding: {
            type: 'ArrayAssignmentTarget',
            elements: [{ type: 'AssignmentTargetIdentifier', name: 'x' }],
            rest: { type: 'AssignmentTargetIdentifier', name: 'x' },
          },
          expression: { type: 'LiteralNumericExpression', value: 0 },
        }
      );

      testParse('[x.a=a] = b', expr, {
        'type': 'AssignmentExpression',
        'binding': {
          'elements': [
            {
              'type': 'AssignmentTargetWithDefault',
              'binding': {
                'type': 'StaticMemberAssignmentTarget',
                'object': {
                  'type': 'IdentifierExpression',
                  'name': 'x',
                },
                'property': 'a',
              },
              'init': {
                'type': 'IdentifierExpression',
                'name': 'a',
              },
            },
          ],
          'rest': null,
          'type': 'ArrayAssignmentTarget',
        },
        'expression': {
          'type': 'IdentifierExpression',
          'name': 'b',
        },
      });

      testParse('[x[a]=a] = b', expr, {
        type: 'AssignmentExpression',
        binding: {
          elements: [
            {
              type: 'AssignmentTargetWithDefault',
              binding: {
                type: 'ComputedMemberAssignmentTarget',
                object: {
                  type: 'IdentifierExpression',
                  name: 'x',
                },
                expression: {
                  type: 'IdentifierExpression',
                  name: 'a',
                },
              },
              init: {
                type: 'IdentifierExpression',
                name: 'a',
              },
            },
          ],
          rest: null,
          type: 'ArrayAssignmentTarget',
        },
        expression: {
          type: 'IdentifierExpression',
          name: 'b',
        },
      });

      testParse('[...[...a[x]]] = b', expr, {
        type: 'AssignmentExpression',
        binding: {
          type: 'ArrayAssignmentTarget',
          elements: [],
          rest: {
            type: 'ArrayAssignmentTarget',
            elements: [],
            rest: {
              type: 'ComputedMemberAssignmentTarget',
              object: {
                type: 'IdentifierExpression',
                name: 'a',
              },
              expression: {
                type: 'IdentifierExpression',
                name: 'x',
              },
            },
          },
        },
        expression: {
          type: 'IdentifierExpression',
          name: 'b',
        },
      });

      testParse('[] = 0', expr, {
        type: 'AssignmentExpression',
        binding: {
          type: 'ArrayAssignmentTarget',
          elements: [],
          rest: null,
        },
        expression: {
          type: 'LiteralNumericExpression',
          value: 0,
        },
      });

      testParse('[{a=0},{a=0}] = 0', expr, {
        type: 'AssignmentExpression',
        binding: {
          type: 'ArrayAssignmentTarget',
          elements: [
            {
              type: 'ObjectAssignmentTarget',
              properties: [{
                type: 'AssignmentTargetPropertyIdentifier',
                binding: { type: 'AssignmentTargetIdentifier', name: 'a' },
                init: { type: 'LiteralNumericExpression', value: 0 },
              }],
            },
            {
              type: 'ObjectAssignmentTarget',
              properties: [{
                type: 'AssignmentTargetPropertyIdentifier',
                binding: { type: 'AssignmentTargetIdentifier', name: 'a' },
                init: { type: 'LiteralNumericExpression', value: 0 },
              }],
            },
          ],
          rest: null,
        },
        expression: { type: 'LiteralNumericExpression', value: 0 },
      });

      testParse('[a = 0, ...{b = 0}] = 0', expr, {
        type: 'AssignmentExpression',
        binding: {
          type: 'ArrayAssignmentTarget',
          elements: [
            {
              type: 'AssignmentTargetWithDefault',
              binding: { type: 'AssignmentTargetIdentifier', name: 'a' },
              init: { type: 'LiteralNumericExpression', value: 0 },
            },
          ],
          rest: {
            type: 'ObjectAssignmentTarget',
            properties: [{
              type: 'AssignmentTargetPropertyIdentifier',
              binding: { type: 'AssignmentTargetIdentifier', name: 'b' },
              init: { type: 'LiteralNumericExpression', value: 0 },
            }],
          },
        },
        expression: { type: 'LiteralNumericExpression', value: 0 },
      });

      testParse('[{a=0}, ...b] = 0', expr, {
        type: 'AssignmentExpression',
        binding: {
          type: 'ArrayAssignmentTarget',
          elements: [
            {
              type: 'ObjectAssignmentTarget',
              properties: [{
                type: 'AssignmentTargetPropertyIdentifier',
                binding: { type: 'AssignmentTargetIdentifier', name: 'a' },
                init: { type: 'LiteralNumericExpression', value: 0 },
              }],
            },
          ],
          rest: {
            type: 'AssignmentTargetIdentifier',
            name: 'b',
          },
        },
        expression: { type: 'LiteralNumericExpression', value: 0 },
      });


      testParseFailure('[x] += 0', 'Invalid left-hand side in assignment');
      testParseFailure('[, x, ...y,] = 0', 'Invalid left-hand side in assignment');
      testParseFailure('[...x, ...y] = 0', 'Invalid left-hand side in assignment');
      testParseFailure('[...x, y] = 0', 'Invalid left-hand side in assignment');
      testParseFailure('[...x,,] = 0', 'Invalid left-hand side in assignment');
      testParseFailure('[0,{a=0}] = 0', 'Illegal property initializer');
      testParseFailure('[{a=0},{b=0},0] = 0', 'Illegal property initializer');
      testParseFailure('[{a=0},...0]', 'Illegal property initializer');
      testParseFailure('[...0,a]=0', 'Invalid left-hand side in assignment');
      testParseFailure('[...0,{a=0}]=0', 'Illegal property initializer');
      testParseFailure('[...0,...{a=0}]=0', 'Illegal property initializer');
      testParseFailure('[...{a=0},]', 'Unexpected comma after rest');
      testParseFailure('[...{a=0},]=0', 'Unexpected comma after rest');
      testParseFailure('[0] = 0', 'Invalid left-hand side in assignment');
      testParseFailure('[a, ...b, {c=0}]', 'Illegal property initializer');
      testParseFailure('{a = [...b, c]} = 0', 'Unexpected token "="');
      testParseFailure('[a, ...(b = c)] = 0', 'Invalid left-hand side in assignment');
    });
  });
});
