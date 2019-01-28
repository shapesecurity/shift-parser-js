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
let ErrorMessages = require('../../dist/errors').ErrorMessages;

function id(x) {
  return x;
}

suite('Parser', () => {
  suite('function declaration', () => {


    testParse('function a(...[]) { }', stmt,
      { type: 'FunctionDeclaration',
        isAsync: false,
        isGenerator: false,
        name: { type: 'BindingIdentifier', name: 'a' },
        params:
        { type: 'FormalParameters',
          items: [],
          rest: { type: 'ArrayBinding', elements: [], rest: null },
        },
        body: {
          type: 'FunctionBody',
          directives: [],
          statements: [],
        },
      }
    );


  });

  suite('function declaration in labeled statement', () => {


    testParseFailure('a: function* a(){}', ErrorMessages.UNEXPECTED_TOKEN, '*');
  });

  suite('Annex B 3.4: function declarations in if statements', () => {


    testParseFailure('for(;;) function a(){}', ErrorMessages.UNEXPECTED_TOKEN, 'function');
    testParseFailure('for(a in b) function c(){}', ErrorMessages.UNEXPECTED_TOKEN, 'function');
    testParseFailure('for(a of b) function c(){}', ErrorMessages.UNEXPECTED_TOKEN, 'function');
    testParseFailure('while(true) function a(){}', ErrorMessages.UNEXPECTED_TOKEN, 'function');
    testParseFailure('with(true) function a(){}', ErrorMessages.UNEXPECTED_TOKEN, 'function');
  });
});
