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
  suite('object binding', () => {
    suite('assignment', () => {
      testParse('({x} = 0)', expr,
        {
          type: 'AssignmentExpression',
          binding: {
            type: 'ObjectAssignmentTarget',
            properties: [{
              type: 'AssignmentTargetPropertyIdentifier',
              binding: { type: 'AssignmentTargetIdentifier', name: 'x' },
              init: null,
            }],
          },
          expression: { type: 'LiteralNumericExpression', value: 0 },
        }
      );

      testParse('({x,} = 0)', expr,
        {
          type: 'AssignmentExpression',
          binding: {
            type: 'ObjectAssignmentTarget',
            properties: [{
              type: 'AssignmentTargetPropertyIdentifier',
              binding: { type: 'AssignmentTargetIdentifier', name: 'x' },
              init: null,
            }],
          },
          expression: { type: 'LiteralNumericExpression', value: 0 },
        }
      );

      testParse('({x,y} = 0)', expr,
        {
          type: 'AssignmentExpression',
          binding: {
            type: 'ObjectAssignmentTarget',
            properties: [{
              type: 'AssignmentTargetPropertyIdentifier',
              binding: { type: 'AssignmentTargetIdentifier', name: 'x' },
              init: null,
            }, { type: 'AssignmentTargetPropertyIdentifier',
              binding: { type: 'AssignmentTargetIdentifier', name: 'y' }, init: null }],
          },
          expression: { type: 'LiteralNumericExpression', value: 0 },
        }
      );

      testParse('({x,y,} = 0)', expr,
        {
          type: 'AssignmentExpression',
          binding: {
            type: 'ObjectAssignmentTarget',
            properties: [{
              type: 'AssignmentTargetPropertyIdentifier',
              binding: { type: 'AssignmentTargetIdentifier', name: 'x' },
              init: null,
            }, { type: 'AssignmentTargetPropertyIdentifier',
              binding: { type: 'AssignmentTargetIdentifier', name: 'y' }, init: null }],
          },
          expression: { type: 'LiteralNumericExpression', value: 0 },
        }
      );

      testParse('({[a]: a} = 1)', expr,
        {
          type: 'AssignmentExpression',
          binding: {
            type: 'ObjectAssignmentTarget',
            properties: [{
              type: 'AssignmentTargetPropertyProperty',
              name: { type: 'ComputedPropertyName', expression: { type: 'IdentifierExpression', name: 'a' } },
              binding: { type: 'AssignmentTargetIdentifier', name: 'a' },
            }],
          },
          expression: { type: 'LiteralNumericExpression', value: 1 },
        }
      );

      testParse('({x = 0} = 1)', expr,
        {
          type: 'AssignmentExpression',
          binding: {
            type: 'ObjectAssignmentTarget',
            properties: [{
              type: 'AssignmentTargetPropertyIdentifier',
              binding: { type: 'AssignmentTargetIdentifier', name: 'x' },
              init: { type: 'LiteralNumericExpression', value: 0 },
            }],
          },
          expression: { type: 'LiteralNumericExpression', value: 1 },
        }
      );

      testParse('({x = 0,} = 1)', expr,
        {
          type: 'AssignmentExpression',
          binding: {
            type: 'ObjectAssignmentTarget',
            properties: [{
              type: 'AssignmentTargetPropertyIdentifier',
              binding: { type: 'AssignmentTargetIdentifier', name: 'x' },
              init: { type: 'LiteralNumericExpression', value: 0 },
            }],
          },
          expression: { type: 'LiteralNumericExpression', value: 1 },
        }
      );


      testParse('({x: y} = 0)', expr,
        {
          type: 'AssignmentExpression',
          binding: {
            type: 'ObjectAssignmentTarget',
            properties: [{
              type: 'AssignmentTargetPropertyProperty',
              name: { type: 'StaticPropertyName', value: 'x' },
              binding: { type: 'AssignmentTargetIdentifier', name: 'y' },
            }],
          },
          expression: { type: 'LiteralNumericExpression', value: 0 },
        }
      );

      testParse('({x: y,} = 0)', expr,
        {
          type: 'AssignmentExpression',
          binding: {
            type: 'ObjectAssignmentTarget',
            properties: [{
              type: 'AssignmentTargetPropertyProperty',
              name: { type: 'StaticPropertyName', value: 'x' },
              binding: { type: 'AssignmentTargetIdentifier', name: 'y' },
            }],
          },
          expression: { type: 'LiteralNumericExpression', value: 0 },
        }
      );

      testParse('({var: x} = 0)', expr,
        {
          type: 'AssignmentExpression',
          binding: {
            type: 'ObjectAssignmentTarget',
            properties: [{
              type: 'AssignmentTargetPropertyProperty',
              name: { type: 'StaticPropertyName', value: 'var' },
              binding: { type: 'AssignmentTargetIdentifier', name: 'x' },
            }],
          },
          expression: { type: 'LiteralNumericExpression', value: 0 },
        }
      );

      testParse('({"x": y} = 0)', expr,
        {
          type: 'AssignmentExpression',
          binding: {
            type: 'ObjectAssignmentTarget',
            properties: [{
              type: 'AssignmentTargetPropertyProperty',
              name: { type: 'StaticPropertyName', value: 'x' },
              binding: { type: 'AssignmentTargetIdentifier', name: 'y' },
            }],
          },
          expression: { type: 'LiteralNumericExpression', value: 0 },
        }
      );

      testParse('({\'x\': y} = 0)', expr,
        {
          type: 'AssignmentExpression',
          binding: {
            type: 'ObjectAssignmentTarget',
            properties: [{
              type: 'AssignmentTargetPropertyProperty',
              name: { type: 'StaticPropertyName', value: 'x' },
              binding: { type: 'AssignmentTargetIdentifier', name: 'y' },
            }],
          },
          expression: { type: 'LiteralNumericExpression', value: 0 },
        }
      );

      testParse('({0: y} = 0)', expr,
        {
          type: 'AssignmentExpression',
          binding: {
            type: 'ObjectAssignmentTarget',
            properties: [{
              type: 'AssignmentTargetPropertyProperty',
              name: { type: 'StaticPropertyName', value: '0' },
              binding: { type: 'AssignmentTargetIdentifier', name: 'y' },
            }],
          },
          expression: { type: 'LiteralNumericExpression', value: 0 },
        }
      );

      testParse('({0: x, 1: x} = 0)', expr,
        {
          type: 'AssignmentExpression',
          binding: {
            type: 'ObjectAssignmentTarget',
            properties: [{
              type: 'AssignmentTargetPropertyProperty',
              name: { type: 'StaticPropertyName', value: '0' },
              binding: { type: 'AssignmentTargetIdentifier', name: 'x' },
            }, {
              type: 'AssignmentTargetPropertyProperty',
              name: { type: 'StaticPropertyName', value: '1' },
              binding: { type: 'AssignmentTargetIdentifier', name: 'x' },
            }],
          },
          expression: { type: 'LiteralNumericExpression', value: 0 },
        }
      );

      testParse('({x: y = 0} = 1)', expr,
        {
          type: 'AssignmentExpression',
          binding: {
            type: 'ObjectAssignmentTarget',
            properties: [{
              type: 'AssignmentTargetPropertyProperty',
              name: { type: 'StaticPropertyName', value: 'x' },
              binding: {
                type: 'AssignmentTargetWithDefault',
                binding: { type: 'AssignmentTargetIdentifier', name: 'y' },
                init: { type: 'LiteralNumericExpression', value: 0 },
              },
            }],
          },
          expression: { type: 'LiteralNumericExpression', value: 1 },
        }
      );

      testParse('({x: y = z = 0} = 1)', expr,
        {
          type: 'AssignmentExpression',
          binding: {
            type: 'ObjectAssignmentTarget',
            properties: [{
              type: 'AssignmentTargetPropertyProperty',
              name: { type: 'StaticPropertyName', value: 'x' },
              binding: {
                type: 'AssignmentTargetWithDefault',
                binding: { type: 'AssignmentTargetIdentifier', name: 'y' },
                init: {
                  type: 'AssignmentExpression',
                  binding: { type: 'AssignmentTargetIdentifier', name: 'z' },
                  expression: { type: 'LiteralNumericExpression', value: 0 },
                },
              },
            }],
          },
          expression: { type: 'LiteralNumericExpression', value: 1 },
        }
      );

      testParse('({x: [y] = 0} = 1)', expr,
        {
          type: 'AssignmentExpression',
          binding: {
            type: 'ObjectAssignmentTarget',
            properties: [{
              type: 'AssignmentTargetPropertyProperty',
              name: { type: 'StaticPropertyName', value: 'x' },
              binding: {
                type: 'AssignmentTargetWithDefault',
                binding: {
                  type: 'ArrayAssignmentTarget',
                  elements: [{ type: 'AssignmentTargetIdentifier', name: 'y' }],
                  rest: null,
                },
                init: { type: 'LiteralNumericExpression', value: 0 },
              },
            }],
          },
          expression: { type: 'LiteralNumericExpression', value: 1 },
        }
      );

      testParse('({a:let} = 0);', expr,
        {
          type: 'AssignmentExpression',
          binding: {
            type: 'ObjectAssignmentTarget',
            properties: [
              {
                type: 'AssignmentTargetPropertyProperty',
                name: { type: 'StaticPropertyName', value: 'a' },
                binding: { type: 'AssignmentTargetIdentifier', name: 'let' },
              },
            ],
          },
          expression: { type: 'LiteralNumericExpression', value: 0 },
        });

      testParse('({let} = 0);', expr,
        {
          type: 'AssignmentExpression',
          binding: {
            type: 'ObjectAssignmentTarget',
            properties: [
              {
                type: 'AssignmentTargetPropertyIdentifier',
                binding: { type: 'AssignmentTargetIdentifier', name: 'let' },
                init: null,
              },
            ],
          },
          expression: { type: 'LiteralNumericExpression', value: 0 },
        });

      testParse('({a:yield} = 0);', expr,
        {
          type: 'AssignmentExpression',
          binding: {
            type: 'ObjectAssignmentTarget',
            properties: [
              {
                type: 'AssignmentTargetPropertyProperty',
                name: { type: 'StaticPropertyName', value: 'a' },
                binding: { type: 'AssignmentTargetIdentifier', name: 'yield' },
              },
            ],
          },
          expression: { type: 'LiteralNumericExpression', value: 0 },
        });

      testParse('({yield} = 0);', expr,
        {
          type: 'AssignmentExpression',
          binding: {
            type: 'ObjectAssignmentTarget',
            properties: [
              {
                type: 'AssignmentTargetPropertyIdentifier',
                binding: { type: 'AssignmentTargetIdentifier', name: 'yield' },
                init: null,
              },
            ],
          },
          expression: { type: 'LiteralNumericExpression', value: 0 },
        });

      testParse('({yield = 0} = 0);', expr,
        {
          type: 'AssignmentExpression',
          binding: {
            type: 'ObjectAssignmentTarget',
            properties: [
              {
                type: 'AssignmentTargetPropertyIdentifier',
                binding: { type: 'AssignmentTargetIdentifier', name: 'yield' },
                init: { type: 'LiteralNumericExpression', value: 0 },
              },
            ],
          },
          expression: { type: 'LiteralNumericExpression', value: 0 },
        });

      testParse('(function*() { [...{ x = yield }] = 0; })', expr,
        {
          type: 'FunctionExpression',
          name: null,
          isGenerator: true,
          params: { type: 'FormalParameters', items: [], rest: null },
          body: {
            type: 'FunctionBody',
            directives: [],
            statements: [{
              type: 'ExpressionStatement',
              expression: {
                type: 'AssignmentExpression',
                binding: {
                  type: 'ArrayAssignmentTarget',
                  elements: [],
                  rest: {
                    type: 'ObjectAssignmentTarget',
                    properties: [{
                      type: 'AssignmentTargetPropertyIdentifier',
                      binding: { type: 'AssignmentTargetIdentifier', name: 'x' },
                      init: { type: 'YieldExpression', expression: null },
                    }],
                  },
                },
                expression: { type: 'LiteralNumericExpression', value: 0 },
              },
            }],
          },
        }
      );

      testParseFailure('({a = 0});', 'Illegal property initializer');
      testParseFailure('({a} += 0);', 'Invalid left-hand side in assignment');
      testParseFailure('({a,,} = 0)', 'Unexpected token ","');
      testParseFailure('({,a,} = 0)', 'Unexpected token ","');
      testParseFailure('({a,,a} = 0)', 'Unexpected token ","');
      testParseFailure('({function} = 0)', 'Unexpected token "function"');
      testParseFailure('({a:function} = 0)', 'Unexpected token "}"');
      testParseFailure('({a:for} = 0)', 'Unexpected token "for"');
      testParseFailure('({\'a\'} = 0)', 'Unexpected token "}"');
      testParseFailure('({var} = 0)', 'Unexpected token "var"');
      testParseFailure('({a.b} = 0)', 'Unexpected token "."');
      testParseFailure('({0} = 0)', 'Unexpected token "}"');
    });
  });
});
