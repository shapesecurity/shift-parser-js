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
let testParse = require('../assertions').testParse;
let testParseFailure = require('../assertions').testParseFailure;

suite('Parser', () => {
  suite('for statement', () => {


    testParse('for (() => { this in null };;);', stmt,
      { type: 'ForStatement',
        init: {
          type: 'ArrowExpression',
          isAsync: false,
          params: { type: 'FormalParameters', items: [], rest: null },
          body: { type: 'FunctionBody', directives: [], statements: [
            { type: 'ExpressionStatement',
              expression: {
                type: 'BinaryExpression',
                operator: 'in',
                left: { type: 'ThisExpression' },
                right: { type: 'LiteralNullExpression' },
              },
            },
          ] },
        },
        body: { type: 'EmptyStatement' },
        test: null,
        update: null }
    );


    testParseFailure('for({a=0};;);', 'Illegal property initializer');
  });
});
