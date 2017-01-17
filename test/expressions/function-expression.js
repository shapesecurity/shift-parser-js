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
let stmt = require('../helpers').stmt;
let testParseFailure = require('../assertions').testParseFailure;
let testParse = require('../assertions').testParse;

suite('Parser', function () {
  suite('function expression', function () {

    testParse('(function(){})', expr,
      { type: 'FunctionExpression',
        isGenerator: false,
        name: null,
        params: { type: 'FormalParameters', items: [], rest: null },
        body: { type: 'FunctionBody', directives: [], statements: [] }
      }
    );

    testParse('(function x() { y; z() });', expr,
      { type: 'FunctionExpression',
        isGenerator: false,
        name: { type: 'BindingIdentifier', name: 'x' },
        params: { type: 'FormalParameters', items: [], rest: null },
        body: {
          type: 'FunctionBody',
          directives: [],
          statements: [{
            type: 'ExpressionStatement',
            expression: { type: 'IdentifierExpression', name: 'y' }
          }, {
            type: 'ExpressionStatement',
            expression: { type: 'CallExpression', callee: { type: 'IdentifierExpression', name: 'z' }, arguments: [] }
          }]
        }
      }
    );

    testParse('(function eval() { });', expr,
      { type: 'FunctionExpression',
        isGenerator: false,
        name: { type: 'BindingIdentifier', name: 'eval' },
        params: { type: 'FormalParameters', items: [], rest: null },
        body: { type: 'FunctionBody', directives: [], statements: [] }
      }
    );

    testParse('(function arguments() { });', expr,
      { type: 'FunctionExpression',
        isGenerator: false,
        name: { type: 'BindingIdentifier', name: 'arguments' },
        params: { type: 'FormalParameters', items: [], rest: null },
        body: { type: 'FunctionBody', directives: [], statements: [] }
      }
    );

    testParse('(function x(y, z) { })', expr,
      { type: 'FunctionExpression',
        isGenerator: false,
        name: { type: 'BindingIdentifier', name: 'x' },
        params:
        { type: 'FormalParameters',
          items:
          [
                { type: 'BindingIdentifier', name: 'y' },
                { type: 'BindingIdentifier', name: 'z' }
          ],
          rest: null
        },
        body: { type: 'FunctionBody', directives: [], statements: [] }
      }
    );

    testParse('(function(a = b){})', expr,
      { type: 'FunctionExpression',
        isGenerator: false,
        name: null,
        params:
        { type: 'FormalParameters',
          items:
          [
            {
              type: 'BindingWithDefault',
              binding: { type: 'BindingIdentifier', name: 'a' },
              init: { type: 'IdentifierExpression', name: 'b' }
            }
          ],
          rest: null,
        },
        body: { type: 'FunctionBody', directives: [], statements: [] }
      }
    );

    testParse('(function(...a){})', expr,
      { type: 'FunctionExpression',
        isGenerator: false,
        name: null,
        params:
        { type: 'FormalParameters',
          items: [],
          rest: { type: 'BindingIdentifier', name: 'a' }
        },
        body: { type: 'FunctionBody', directives: [], statements: [] }
      }
    );

    testParse('(function(a, ...b){})', expr,
      { type: 'FunctionExpression',
        isGenerator: false,
        name: null,
        params:
        { type: 'FormalParameters',
          items: [{ type: 'BindingIdentifier', name: 'a' }],
          rest: { type: 'BindingIdentifier', name: 'b' }
        },
        body: { type: 'FunctionBody', directives: [], statements: [] }
      }
    );

    testParse('(function({a}){})', expr,
      { type: 'FunctionExpression',
        isGenerator: false,
        name: null,
        params:
        { type: 'FormalParameters',
          items:
          [
            {
              type: 'ObjectBinding',
              properties: [{
                type: 'BindingPropertyIdentifier',
                binding: { type: 'BindingIdentifier', name: 'a' },
                init: null
              }]
            }
          ],
          rest: null,
        },
        body: { type: 'FunctionBody', directives: [], statements: [] }
      }
    );

    testParse('(function({a: x, a: y}){})', expr,
      { type: 'FunctionExpression',
        isGenerator: false,
        name: null,
        params:
        { type: 'FormalParameters',
          items:
          [
            {
              type: 'ObjectBinding',
              properties: [{
                type: 'BindingPropertyProperty',
                name: { type: 'StaticPropertyName', value: 'a' },
                binding: { type: 'BindingIdentifier', name: 'x' }
              }, {
                type: 'BindingPropertyProperty',
                name: { type: 'StaticPropertyName', value: 'a' },
                binding: { type: 'BindingIdentifier', name: 'y' }
              }]
            }
          ],
          rest: null
        },
        body: { type: 'FunctionBody', directives: [], statements: [] }
      }
    );

    testParse('(function([a]){})', expr,
      { type: 'FunctionExpression',
        isGenerator: false,
        name: null,
        params:
        { type: 'FormalParameters',
          items:
          [
                { type: 'ArrayBinding', elements: [{ type: 'BindingIdentifier', name: 'a' }], rest: null }
          ],
          rest: null
        },
        body: { type: 'FunctionBody', directives: [], statements: [] }
      }
    );

    testParse('(function({a = 0}){})', expr,
      { type: 'FunctionExpression',
        isGenerator: false,
        name: null,
        params:
        { type: 'FormalParameters',
          items:
          [
            {
              type: 'ObjectBinding',
              properties: [{
                type: 'BindingPropertyIdentifier',
                binding: { type: 'BindingIdentifier', name: 'a' },
                init: { type: 'LiteralNumericExpression', value: 0 }
              }]
            }
          ],
          rest: null
        },
        body: { type: 'FunctionBody', directives: [], statements: [] }
      }
    );

    testParse('label: !function(){ label:; };', stmt,
      {
        type: 'LabeledStatement',
        label: 'label',
        body: {
          type: 'ExpressionStatement',
          expression: {
            type: 'UnaryExpression',
            operator: '!',
            operand: {
              type: 'FunctionExpression',
              isGenerator: false,
              name: null,
              params: { type: 'FormalParameters', items: [], rest: null },
              body: {
                type: 'FunctionBody',
                directives: [],
                statements: [{ type: 'LabeledStatement', label: 'label', body: { type: 'EmptyStatement' } }]
              }
            }
          }
        }
      }
    );

    testParse('(function([]){})', expr,
      {
        type: 'FunctionExpression',
        isGenerator: false,
        name: null,
        params: {
          type: 'FormalParameters',
          items: [{ type: 'ArrayBinding', elements: [], rest: null }],
          rest: null
        },
        body: { type: 'FunctionBody', directives: [], statements: [] }
      });

    testParse('function* g(){ (function yield(){}); }', stmt,
      {
        type: 'FunctionDeclaration',
        isGenerator: true,
        name: { type: 'BindingIdentifier', name: 'g' },
        params: { type: 'FormalParameters', items: [], rest: null },
        body: {
          type: 'FunctionBody',
          directives: [],
          statements: [{
            type: 'ExpressionStatement',
            expression: {
              type: 'FunctionExpression',
              isGenerator: false,
              name: { type: 'BindingIdentifier', name: 'yield' },
              params: { type: 'FormalParameters', items: [], rest: null },
              body: { type: 'FunctionBody', directives: [], statements: [] },
            }
          }]
        }
      }
    );

    testParse('(function*(){ (function yield(){}); })', expr,
      {
        type: 'FunctionExpression',
        isGenerator: true,
        name: null,
        params: { type: 'FormalParameters', items: [], rest: null },
        body: {
          type: 'FunctionBody',
          directives: [],
          statements: [{
            type: 'ExpressionStatement',
            expression: {
              type: 'FunctionExpression',
              isGenerator: false,
              name: { type: 'BindingIdentifier', name: 'yield' },
              params: { type: 'FormalParameters', items: [], rest: null },
              body: { type: 'FunctionBody', directives: [], statements: [] },
            }
          }]
        }
      }
    );

    testParseFailure('(function(...a, b){})', 'Unexpected token ","');
    testParseFailure('(function((a)){})', 'Unexpected token "("');
  });
});
