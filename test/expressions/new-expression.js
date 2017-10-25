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
  suite('new expression', () => {


    testParse('new f(...a)', expr,
      {
        type: 'NewExpression',
        callee: { type: 'IdentifierExpression', name: 'f' },
        arguments: [{ type: 'SpreadElement', expression: { type: 'IdentifierExpression', name: 'a' } }],
      }
    );


    testParse('new(a in b)', expr,
      {
        type: 'NewExpression',
        callee: {
          type: 'BinaryExpression',
          left: { type: 'IdentifierExpression', name: 'a' },
          operator: 'in',
          right: { type: 'IdentifierExpression', name: 'b' },
        },
        arguments: [],
      }
    );
  });
});
