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
let stmt = require('../helpers').stmt;
let expr = require('../helpers').expr;

suite('Parser', () => {
  let emptyBody = { type: 'FunctionBody', directives: [], statements: [] };

  suite('yield', () => {
    function yd(p) {
      return stmt(p).body.statements.map(es => {
        return es.expression;
      });
    }

    function yde(p) {
      return stmt(p).body.statements[0].expression.expression;
    }

    testParse('function *a(){yield delete 0}', yde, {
      type: 'UnaryExpression',
      operator: 'delete',
      operand: { type: 'LiteralNumericExpression', value: 0 },
    });
    testParse('function *a(){yield typeof 0}', yde, {
      type: 'UnaryExpression',
      operator: 'typeof',
      operand: { type: 'LiteralNumericExpression', value: 0 },
    });
    testParse('function *a(){yield void 0}', yde, {
      type: 'UnaryExpression',
      operator: 'void',
      operand: { type: 'LiteralNumericExpression', value: 0 },
    });
    testParse('function *a(){yield ~0}', yde, {
      type: 'UnaryExpression',
      operator: '~',
      operand: { type: 'LiteralNumericExpression', value: 0 },
    });


    let accessor = function (p) {
      return stmt(p).body.statements[0].expression.properties[0].body.statements[0].expression;
    };
    testParse('function *a(){({get b(){yield}})}', accessor, {
      type: 'IdentifierExpression',
      name: 'yield',
    });
    testParse('function *a(){({set b(c){yield}})}', accessor, {
      type: 'IdentifierExpression',
      name: 'yield',
    });
    testParse('function *a(){({b(){yield}})}', accessor, {
      type: 'IdentifierExpression',
      name: 'yield',
    });
    testParse('function a(){({*[yield](){}})}', p => {
      return stmt(p).body.statements[0].expression.properties[0].name.expression;
    }, {
      type: 'IdentifierExpression',
      name: 'yield',
    });
    testParse('function *a(){({*[yield](){}})}', p => {
      return stmt(p).body.statements[0].expression.properties[0].name.expression;
    }, {
      type: 'YieldExpression',
      expression: null,
    });
    testParse('function *a(){({set b(yield){}})}', p => {
      return stmt(p).body.statements[0].expression.properties[0].param;
    }, {
      type: 'BindingIdentifier',
      name: 'yield',
    });

  });
});
