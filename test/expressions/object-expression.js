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

let expr = require('../helpers').expr;
let testParse = require('../assertions').testParse;

suite('Parser', () => {
  suite('object expression', () => {


    testParse('({ enum: 0 })', expr,
      {
        type: 'ObjectExpression',
        properties: [{
          type: 'DataProperty',
          name: { type: 'StaticPropertyName', value: 'enum' },
          expression: { type: 'LiteralNumericExpression', value: 0 },
        }],
      }
    );


    testParse('({a, b: 0, c})', expr,
      {
        type: 'ObjectExpression',
        properties: [{ type: 'ShorthandProperty', name: { type: 'IdentifierExpression', name: 'a' } }, {
          type: 'DataProperty',
          name: { type: 'StaticPropertyName', value: 'b' },
          expression: { type: 'LiteralNumericExpression', value: 0 },
        }, { type: 'ShorthandProperty', name: { type: 'IdentifierExpression', name: 'c' } }],
      }
    );


  });
});
