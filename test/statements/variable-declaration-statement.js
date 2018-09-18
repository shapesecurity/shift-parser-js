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
let testParseModuleFailure = require('../assertions').testParseModuleFailure;

suite('Parser', () => {
  suite('variable declaration statement', () => {
    // Variable Statement

    testParse('var await;', stmt,
      {
        type: 'VariableDeclarationStatement',
        declaration: {
          type: 'VariableDeclaration',
          kind: 'var',
          declarators: [{
            type: 'VariableDeclarator',
            binding: {
              type: 'BindingIdentifier',
              name: 'await',
            },
            init: null,
          }],
        },
      }
    );


    // Let Statement


    // exotic unicode characters


    // Const Statement


    testParseModuleFailure('var await', 'Unexpected token "await"');
    testParseFailure('var const', 'Unexpected token "const"');
    testParseFailure('var a[0]=0;', 'Unexpected token "["');
    testParseFailure('var (a)=0;', 'Unexpected token "("');
    testParseFailure('var new A = 0;', 'Unexpected token "new"');
    testParseFailure('var (x)', 'Unexpected token "("');
    testParseFailure('var this', 'Unexpected token "this"');
    testParseFailure('var a.b;', 'Unexpected token "."');
    testParseFailure('var [a];', 'Unexpected token ";"');
    testParseFailure('var {a};', 'Unexpected token ";"');
    testParseFailure('var {a:a};', 'Unexpected token ";"');
  });
});
