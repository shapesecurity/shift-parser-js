/**
 * Copyright 2017 Shape Security, Inc.
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

let stmt = require('../helpers').stmt;
let testParse = require('../assertions').testParse;
let testEarlyError = require('../assertions').testEarlyError;
let testParseFailure = require('../assertions').testParseFailure;

function yd(p) {
  return stmt(p).body.statements[0].expression;
}

suite('Parser', () => {

  suite('escapes in normal keywords', () => {
    testParseFailure('i\\u0066 (0)', 'Unexpected escaped keyword');
    testParseFailure('var i\\u0066', 'Unexpected escaped keyword');

    testParse('({i\\u0066: 0})', stmt,
      {
        type: 'ExpressionStatement',
        expression: {
          type: 'ObjectExpression',
          properties: [{
            type: 'DataProperty',
            name: {
              type: 'StaticPropertyName',
              value: 'if',
            },
            expression: {
              type: 'LiteralNumericExpression',
              value: 0,
            },
          }],
        },
      }
    );
  });

  suite('escapes in "let"', () => {
    testParseFailure('le\\u0074 a', 'Unexpected identifier');

    testParse('var le\\u0074', stmt,
      {
        type: 'VariableDeclarationStatement',
        declaration: {
          type: 'VariableDeclaration',
          kind: 'var',
          declarators: [{
            type: 'VariableDeclarator',
            binding: { type: 'BindingIdentifier', name: 'let' },
            init: null,
          }],
        },
      }
    );

    testEarlyError('"use strict"; var le\\u0074', 'The identifier "let" must not be in binding position in strict mode');
  });

  suite('escapes in "yield"', () => {
    testParseFailure('function *a(){yi\\u0065ld 0}', '"yield" may not be used as an identifier in this context');
    testParseFailure('function *a(){var yi\\u0065ld}', '"yield" may not be used as an identifier in this context');

    testParse('function *a(){({yi\\u0065ld: 0})}', yd,
      {
        type: 'ObjectExpression',
        properties: [{
          type: 'DataProperty',
          name: {
            type: 'StaticPropertyName',
            value: 'yield',
          },
          expression: {
            type: 'LiteralNumericExpression',
            value: 0,
          },
        }],
      }
    );
  });
});
