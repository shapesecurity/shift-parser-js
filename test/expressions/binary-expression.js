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
  suite('binary expression', () => {


    // Binary Bitwise Operators


    // Binary Expressions


    // Binary Logical Operators


    // Multiplicative Operators


    // Additive Operators


    // Exponentiation Operator
    testParse('x ** y', expr,
      { type: 'BinaryExpression',
        operator: '**',
        left: { type: 'IdentifierExpression', name: 'x' },
        right: { type: 'IdentifierExpression', name: 'y' } }
    );

    testParse('x ** y ** z', expr,
      { type: 'BinaryExpression',
        operator: '**',
        left: { type: 'IdentifierExpression', name: 'x' },
        right:
        { type: 'BinaryExpression',
          operator: '**',
          left: { type: 'IdentifierExpression', name: 'y' },
          right: { type: 'IdentifierExpression', name: 'z' } } }
    );

    testParse('++x ** y', expr,
      { type: 'BinaryExpression',
        operator: '**',
        left:
        { type: 'UpdateExpression',
          operator: '++',
          isPrefix: true,
          operand: { type: 'AssignmentTargetIdentifier', name: 'x' } },
        right: { type: 'IdentifierExpression', name: 'y' } }
    );

    testParse('(-x) ** y', expr,
      { type: 'BinaryExpression',
        operator: '**',
        left:
        { type: 'UnaryExpression',
          operator: '-',
          operand: { type: 'IdentifierExpression', name: 'x' } },
        right: { type: 'IdentifierExpression', name: 'y' } }
    );

    testParse('-(x ** y)', expr,
      { type: 'UnaryExpression',
        operator: '-',
        operand:
        { type: 'BinaryExpression',
          operator: '**',
          left: { type: 'IdentifierExpression', name: 'x' },
          right: { type: 'IdentifierExpression', name: 'y' } } }
    );

    testParseFailure('-x ** y', 'Unary expressions as the left operand of an exponentation expression must be ' +
      'disambiguated with parentheses');

    // Bitwise Shift Operator


    // Relational Operators


    // Equality Operators


  });
});
