/**
 * Copyright 2015 Shape Security, Inc.
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
let stmt = require('../helpers').stmt;

suite('Parser', function () {
  suite('yield', function () {
    function yd(p) {
      return stmt(p).body.statements.map(function (es) {
        return es.expression;
      });
    }

    testParse('function*a(){yield*a}', yd, [{
      type: 'YieldGeneratorExpression',
      expression: { type: 'IdentifierExpression', name: 'a' }
    }]);
    testParse('function a(){yield*a}', yd, [{
      type: 'BinaryExpression',
      operator: '*',
      left: { type: 'IdentifierExpression', name: 'yield' },
      right: { type: 'IdentifierExpression', name: 'a' }
    }]);

    testParseFailure('function *a(){yield\n*a}', 'Unexpected token "*"');
    testParseFailure('function *a(){yield*}', 'Unexpected token "}"');
  });
});
