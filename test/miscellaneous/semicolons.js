/**
 * Copyright 2016 Shape Security, Inc.
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
let testParseModule = require('../assertions').testParseModule;
let stmt = require('../helpers').stmt;

let stmts = function (script) {
  return script.statements;
};

let items = function (mod) {
  return mod.items;
};

suite('Parser', () => {
  suite('semicolons after statements are consumed', () => {


  });

  suite('semicolons after imports & exports are consumed as appropriate', () => {


  });

  suite('semicolons after export declarations are not consumed', () => {


  });

});
