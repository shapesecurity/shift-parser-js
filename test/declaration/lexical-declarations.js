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
let ErrorMessages = require('../../dist/errors').ErrorMessages;

suite('Parser', () => {
  suite('declarations', () => {
    testParse('for (; false; ) let\n{}', program => program.statements,
      [
        {
          type: 'ForStatement',
          init: null,
          test: { type: 'LiteralBooleanExpression', value: false },
          update: null,
          body: {
            type: 'ExpressionStatement',
            expression: { type: 'IdentifierExpression', name: 'let' },
          },
        },
        {
          type: 'BlockStatement',
          block: { type: 'Block', statements: [] },
        },
      ]
    );

    testParse('for(let\n{} = {};;);', program => program.statements,
      [
        {
          type: 'ForStatement',
          init: {
            type: 'VariableDeclaration',
            kind: 'let',
            declarators: [
              {
                binding: { properties: [], type: 'ObjectBinding' },
                init: { properties: [], type: 'ObjectExpression' },
                type: 'VariableDeclarator',
              },
            ],
          },
          test: null,
          update: null,
          body: {
            type: 'EmptyStatement',
          },
        },
      ]
    );

    testParseFailure('for(; false;) let {}', ErrorMessages.UNEXPECTED_TOKEN, '{');
    testParseFailure('while(true) let[a] = 0', ErrorMessages.UNEXPECTED_TOKEN, 'let');
    testParseFailure('while(true) let a', ErrorMessages.UNEXPECTED_IDENTIFIER);
    testParseFailure('while(true) const a', ErrorMessages.UNEXPECTED_TOKEN, 'const');
    testParseFailure('with(true) let a', ErrorMessages.UNEXPECTED_IDENTIFIER);
    testParseFailure('with(true) class a {}', ErrorMessages.UNEXPECTED_TOKEN, 'class');

    testParseFailure('a: let a', ErrorMessages.UNEXPECTED_IDENTIFIER);

  });
});
