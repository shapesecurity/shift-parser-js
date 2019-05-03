/**
 * Copyright 2019 Shape Security, Inc.
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
let testParseSuccess = require('../assertions').testParseSuccess;
let testParseFailure = require('../assertions').testParseFailure;
let ErrorMessages = require('../../src/errors').ErrorMessages;

function createAsyncContext(body) {
  return `
  (async function() {
    ${body};
  })();
  `;
}

suite('Parser', () => {
  suite('for await statement', () => {

    testParseSuccess(createAsyncContext('for await(a of b);'));
    testParseFailure(createAsyncContext('for await(let of 0);'), ErrorMessages.UNEXPECTED_NUMBER);
    testParseFailure(createAsyncContext('for await(this of 0);'), ErrorMessages.INVALID_LHS_IN_FOR_AWAIT);

    testParseFailure(createAsyncContext('for await(var a = 0 of b);'), ErrorMessages.INVALID_VAR_INIT_FOR_AWAIT);
    testParseFailure(createAsyncContext('for await(let a = 0 of b);'), ErrorMessages.INVALID_VAR_INIT_FOR_AWAIT);
    testParseFailure(createAsyncContext('for await(const a = 0 of b);'), ErrorMessages.INVALID_VAR_INIT_FOR_AWAIT);

    testParseFailure(createAsyncContext('for await(({a}) of 0);'), 'Invalid left-hand side in for-await');
    testParseFailure(createAsyncContext('for await(([a]) of 0);'), 'Invalid left-hand side in for-await');

    testParseFailure(createAsyncContext('for await(var a of b, c);'), 'Unexpected token ","');
    testParseFailure(createAsyncContext('for await(a of b, c);'), 'Unexpected token ","');
    testParseFailure(createAsyncContext('for await(let.x of a);'), 'Invalid left-hand side in for-await');
    testParseFailure(createAsyncContext('for await(let a in b);'), 'Unexpected token "in"');
    testParseFailure(createAsyncContext('for await(a in b);'), 'Unexpected token "in"');
    testParseFailure(createAsyncContext('for await(;;);'), 'Unexpected token ";"');
    testParseFailure(createAsyncContext('for await(let a;;;);'), 'Unexpected token ";"');
    testParseFailure(createAsyncContext('let b = []; for await(a in b);'), 'Unexpected token "in"');
    testParseFailure(createAsyncContext('for await(;;);'), 'Unexpected token ";"');
    testParseFailure(createAsyncContext('let b = []; for await(a in b);'), 'Unexpected token "in"');
  });
});
