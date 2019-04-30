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

// Reference : https://github.com/mozilla/gecko-dev/tree/master/js/src/tests/non262/async-functions 

let testEarlyError = require('../../assertions').testEarlyError;
let ErrorMessages = require('../../../src/errors').ErrorMessages;

// If FormalParameters Contains AwaitExpression is true.
testEarlyError('async function a(k = await 3) {}', ErrorMessages.INVALID_ASYNC_PARAMS);
testEarlyError('(async function(k = await 3) {})', ErrorMessages.INVALID_ASYNC_PARAMS);
testEarlyError('(async function a(k = await 3) {})', ErrorMessages.INVALID_ASYNC_PARAMS);

// If BindingIdentifier is `eval` or `arguments`.
testEarlyError('\'use strict\'; async function eval() {}', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('eval'));
testEarlyError('\'use strict\'; (async function eval() {})', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('eval'));

testEarlyError('\'use strict\'; async function arguments() {}', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('arguments'));
testEarlyError('\'use strict\'; (async function arguments() {})', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('arguments'));

// If any element of the BoundNames of FormalParameters also occurs in the
// LexicallyDeclaredNames of AsyncFunctionBody.
testEarlyError('async function a(x) { let x; }', ErrorMessages.DUPLICATE_BINDING('x'));
testEarlyError('(async function(x) { let x; })', ErrorMessages.DUPLICATE_BINDING('x'));
testEarlyError('(async function a(x) { let x; })', ErrorMessages.DUPLICATE_BINDING('x'));

// If FormalParameters contains SuperProperty is true.
testEarlyError('async function a(k = super.prop) { }', ErrorMessages.ILLEGAL_ACCESS_SUPER_MEMBER);
testEarlyError('(async function(k = super.prop) {})', ErrorMessages.ILLEGAL_ACCESS_SUPER_MEMBER);
testEarlyError('(async function a(k = super.prop) {})', ErrorMessages.ILLEGAL_ACCESS_SUPER_MEMBER);

// If AsyncFunctionBody contains SuperProperty is true.
testEarlyError('async function a() { super.prop(); }', ErrorMessages.ILLEGAL_ACCESS_SUPER_MEMBER);
testEarlyError('(async function() { super.prop(); })', ErrorMessages.ILLEGAL_ACCESS_SUPER_MEMBER);
testEarlyError('(async function a() { super.prop(); })', ErrorMessages.ILLEGAL_ACCESS_SUPER_MEMBER);

// If FormalParameters contains SuperCall is true.
testEarlyError('async function a(k = super()) {}', ErrorMessages.ILLEGAL_SUPER_CALL);
testEarlyError('(async function(k = super()) {})', ErrorMessages.ILLEGAL_SUPER_CALL);
testEarlyError('(async function a(k = super()) {})', ErrorMessages.ILLEGAL_SUPER_CALL);

// If AsyncFunctionBody contains SuperCall is true.
testEarlyError('async function a() { super(); }', ErrorMessages.ILLEGAL_SUPER_CALL);
testEarlyError('(async function() { super(); })', ErrorMessages.ILLEGAL_SUPER_CALL);
testEarlyError('(async function a() { super(); })', ErrorMessages.ILLEGAL_SUPER_CALL);
