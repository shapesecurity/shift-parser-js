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

let stmt = require('../helpers').stmt;
let expr = require('../helpers').expr;
let testParse = require('../assertions').testParse;
let testParseFailure = require('../assertions').testParseFailure;

suite('Parser', () => {
  suite('new.target expression', () => {


    testParse('function f() { new.target(); }', stmt,
      { type: 'FunctionDeclaration',
        isGenerator: false,
        name: { type: 'BindingIdentifier', name: 'f' },
        params: { type: 'FormalParameters', items: [], rest: null },
        body: {
          type: 'FunctionBody',
          directives: [],
          statements: [{
            type: 'ExpressionStatement',
            expression: { type: 'CallExpression', callee: { type: 'NewTargetExpression' }, arguments: [] },
          }],
        },
      }
    );


    testParseFailure('function f() { new.anythingElse; }', 'Unexpected identifier');
    testParseFailure('function f() { new..target; }', 'Unexpected token "."');

  });
});
