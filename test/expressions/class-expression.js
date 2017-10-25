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

let testParse = require('../assertions').testParse;
let testParseFailure = require('../assertions').testParseFailure;
let testParseSuccess = require('../assertions').testParseSuccess;
let expr = require('../helpers').expr;
let stmt = require('../helpers').stmt;

suite('Parser', () => {
  suite('class expression', () => {


    testParseSuccess('({ a(){ (class {[super.a](){}}); } })');
    testParseSuccess('class A extends Object { constructor(){ (class {[super()](){}}); } }');
    testParseSuccess('class A extends Object { constructor(a = super()){} }');
    testParseSuccess('class A { b(c = super.d){} }');

    testParseFailure('(class {a:0})', 'Only methods are allowed in classes');
    testParseFailure('(class {a=0})', 'Only methods are allowed in classes');
    testParseFailure('(class {a})', 'Only methods are allowed in classes');
    testParseFailure('(class {3:0})', 'Only methods are allowed in classes');
    testParseFailure('(class {[3]:0})', 'Only methods are allowed in classes');
    testParseFailure('(class {)', 'Unexpected token ")"');
    testParseFailure('(class extends a,b {})', 'Unexpected token ","');
    testParseFailure('(class extends !a {})', 'Unexpected token "!"');
    testParseFailure('(class [a] {})', 'Unexpected token "["');
    testParseFailure('(class {[a,b](){}})', 'Unexpected token ","');
  });
});
