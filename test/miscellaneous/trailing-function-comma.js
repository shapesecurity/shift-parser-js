/**
 * Copyright 2018 Shape Security, Inc.
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
let { stmt, expr } = require('../helpers');
let testParseFailure = require('../assertions').testParseFailure;
let ErrorMessages = require('../../src/errors').ErrorMessages;

function id(x) {
  return x;
}

suite('trailing function comma', () => {
  suite('params', () => {
    testParse('(a,) => 0', expr,
      {
        type: 'ArrowExpression',
        isAsync: false,
        params:
        {
          type: 'FormalParameters',
          items: [
            { type: 'BindingIdentifier', name: 'a' },
          ],
          rest: null,
        },
        body: { type: 'LiteralNumericExpression', value: 0 },
      }
    );

    testParse('async (a,) => 0', expr,
      {
        type: 'ArrowExpression',
        isAsync: true,
        params:
        {
          type: 'FormalParameters',
          items: [
            { type: 'BindingIdentifier', name: 'a' },
          ],
          rest: null,
        },
        body: { type: 'LiteralNumericExpression', value: 0 },
      }
    );

    testParse('function a(b,){}', stmt,
      {
        type: 'FunctionDeclaration',
        isAsync: false,
        isGenerator: false,
        name: { type: 'BindingIdentifier', name: 'a' },
        params: {
          type: 'FormalParameters',
          items: [
            { type: 'BindingIdentifier', name: 'b' },
          ],
          rest: null,
        },
        body: { type: 'FunctionBody', directives: [], statements: [] },
      }
    );

    testParse('(function (a,){})', expr,
      {
        type: 'FunctionExpression',
        isAsync: false,
        isGenerator: false,
        name: null,
        params: {
          type: 'FormalParameters',
          items: [
            { type: 'BindingIdentifier', name: 'a' },
          ],
          rest: null,
        },
        body: { type: 'FunctionBody', directives: [], statements: [] },
      }
    );

    testParse('({ a (b,) {} })', expr,
      {
        type: 'ObjectExpression',
        properties: [
          {
            type: 'Method',
            isAsync: false,
            isGenerator: false,
            name: { type: 'StaticPropertyName', value: 'a' },
            params: {
              type: 'FormalParameters',
              items: [
                { type: 'BindingIdentifier', name: 'b' },
              ],
              rest: null,
            },
            body: { type: 'FunctionBody', directives: [], statements: [] },
          },
        ],
      }
    );
  });

  suite('call', () => {
    testParse('a(b,)', expr,
      {
        type: 'CallExpression',
        callee: { type: 'IdentifierExpression', name: 'a' },
        arguments: [{ type: 'IdentifierExpression', name: 'b' }],
      }
    );
    testParse('async(a,)', expr,
      {
        type: 'CallExpression',
        callee: { type: 'IdentifierExpression', name: 'async' },
        arguments: [{ type: 'IdentifierExpression', name: 'a' }],
      }
    );
    testParse('new a(b,)', expr,
      {
        type: 'NewExpression',
        callee: { type: 'IdentifierExpression', name: 'a' },
        arguments: [{ type: 'IdentifierExpression', name: 'b' }],
      }
    );
    testParse('new async(a,)', expr,
      {
        type: 'NewExpression',
        callee: { type: 'IdentifierExpression', name: 'async' },
        arguments: [{ type: 'IdentifierExpression', name: 'a' }],
      }
    );
  });

  suite('failures', () => {
    testParseFailure('(,) => 0', 'Unexpected token ","');
    testParseFailure('(a,,) => 0', 'Unexpected token ","');
    testParseFailure('(a, ...b,) => 0', ErrorMessages.INVALID_LAST_REST_PARAMETER);
    testParseFailure('async (,) => 0', 'Unexpected token ","');
    testParseFailure('async (a,,) => 0', 'Unexpected token ","');
    testParseFailure('async (a, ...b,) => 0', ErrorMessages.INVALID_LAST_REST_PARAMETER);
    testParseFailure('function a(,) {}', 'Unexpected token ","');
    testParseFailure('function a(b,,) {}', 'Unexpected token ","');
    testParseFailure('function a(b, ...c,) {}', ErrorMessages.UNEXPECTED_COMMA_AFTER_REST);
    testParseFailure('(function (,) {})', 'Unexpected token ","');
    testParseFailure('(function (a,,) {})', 'Unexpected token ","');
    testParseFailure('(function (a, ...b,) {})', ErrorMessages.UNEXPECTED_COMMA_AFTER_REST);
    testParseFailure('({ a (,) {} })', 'Unexpected token ","');
    testParseFailure('({ a (b,,) {} })', 'Unexpected token ","');
    testParseFailure('({ a (b, ...c,) {} })', ErrorMessages.UNEXPECTED_COMMA_AFTER_REST);

    testParseFailure('({ set a (b,) {} })', 'Unexpected token ","');
    testParseFailure('(a,)', 'Unexpected token ")"');
    testParseFailure('({a:1},)', 'Unexpected token ")"');
  });
});
