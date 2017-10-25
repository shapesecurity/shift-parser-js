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

let expr = require('./helpers').expr;
let stmt = require('./helpers').stmt;

let testParse = require('./assertions').testParse;
let testParseFailure = require('./assertions').testParseFailure;
let testParseModule = require('./assertions').testParseModule;

function directives(program) {
  return program.directives;
}

function id(x) {
  return x;
}

suite('Parser', () => {
  suite('directives', () => {


    testParseFailure('"\\1"; "use strict";', 'Unexpected legacy octal escape sequence: \\1');
    testParseFailure('"\\1"; "use strict"; null;', 'Unexpected legacy octal escape sequence: \\1');
    testParseFailure('"use strict"; "\\1";', 'Unexpected legacy octal escape sequence: \\1');
    testParseFailure('"use strict"; "\\1"; null;', 'Unexpected legacy octal escape sequence: \\1');
    testParseFailure('"use strict"; function f(){"\\1";}', 'Unexpected legacy octal escape sequence: \\1');

  });
});
