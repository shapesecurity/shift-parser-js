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
let stmt = require('../helpers').stmt;

suite('Parser', function () {
  suite('throw statement', function () {

    testParse('throw this', stmt, { type: 'ThrowStatement', expression: { type: 'ThisExpression' } });

    testParse('throw x;', stmt,
      { type: 'ThrowStatement',
        expression: { type: 'IdentifierExpression', name: 'x' } }
    );

    testParse('throw x * y', stmt,
      { type: 'ThrowStatement',
        expression:
        { type: 'BinaryExpression',
          operator: '*',
          left: { type: 'IdentifierExpression', name: 'x' },
          right: { type: 'IdentifierExpression', name: 'y' } } }
    );

    testParse('throw {}', stmt, { type: 'ThrowStatement', expression: { type: 'ObjectExpression', properties: [] } });

  });
});
