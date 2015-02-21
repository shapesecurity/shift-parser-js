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

var Shift = require("shift-ast");

var expr = require("../helpers").expr;
var stmt = require("../helpers").stmt;

var testParseFailure = require('../assertions').testParseFailure;
var testParse = require('../assertions').testParse;

function directives(program) {
  return program.body.directives;
}

suite("Parser", function () {
  suite("use strict", function () {

    testParse("\"Hello\"", directives, [new Shift.UnknownDirective("Hello")]);

    testParse("\"\\n\\r\\t\\v\\b\\f\\\\\\'\\\"\\0\"", directives, [new Shift.UnknownDirective("\\n\\r\\t\\v\\b\\f\\\\\\'\\\"\\0")]);
    testParse("\"\\u0061\"", directives, [new Shift.UnknownDirective("\\u0061")]);
    testParse("\"\\x61\"", directives, [new Shift.UnknownDirective("\\x61")]);
    testParse("\"\\u00\"", directives, [new Shift.UnknownDirective("\\u00")]);
    testParse("\"\\xt\"", directives, [new Shift.UnknownDirective("\\xt")]);
    testParse("\"Hello\\nworld\"", directives, [new Shift.UnknownDirective("Hello\\nworld")]);
    testParse("\"Hello\\\nworld\"", directives, [new Shift.UnknownDirective("Hello\\\nworld")]);
    testParse("\"Hello\\02World\"", directives, [new Shift.UnknownDirective("Hello\\02World")]);
    testParse("\"Hello\\012World\"", directives, [new Shift.UnknownDirective("Hello\\012World")]);
    testParse("\"Hello\\122World\"", directives, [new Shift.UnknownDirective("Hello\\122World")]);
    testParse("\"Hello\\0122World\"", directives, [new Shift.UnknownDirective("Hello\\0122World")]);
    testParse("\"Hello\\312World\"", directives, [new Shift.UnknownDirective("Hello\\312World")]);
    testParse("\"Hello\\412World\"", directives, [new Shift.UnknownDirective("Hello\\412World")]);
    testParse("\"Hello\\812World\"", directives, [new Shift.UnknownDirective("Hello\\812World")]);
    testParse("\"Hello\\712World\"", directives, [new Shift.UnknownDirective("Hello\\712World")]);
    testParse("\"Hello\\0World\"", directives, [new Shift.UnknownDirective("Hello\\0World")]);
    testParse("\"Hello\\\r\nworld\"", directives, [new Shift.UnknownDirective("Hello\\\r\nworld")]);
    testParse("\"Hello\\1World\"", directives, [new Shift.UnknownDirective("Hello\\1World")]);

    testParseFailure("(function () { 'use strict'; with (i); })", "Strict mode code may not include a with statement");

    testParse("(function () { 'use\\x20strict'; with (i); })", expr,
      new Shift.FunctionExpression(null, [], new Shift.FunctionBody([new Shift.UnknownDirective("use\\x20strict")], [
        new Shift.WithStatement(new Shift.IdentifierExpression(new Shift.Identifier("i")), new Shift.EmptyStatement),
      ]))
    );
    testParse("(function () { 'use\\nstrict'; with (i); })", expr,
      new Shift.FunctionExpression(null, [], new Shift.FunctionBody([new Shift.UnknownDirective("use\\nstrict")], [
        new Shift.WithStatement(new Shift.IdentifierExpression(new Shift.Identifier("i")), new Shift.EmptyStatement),
      ]))
    );

    testParse("function a() {'use strict';return 0;};", stmt,
      new Shift.FunctionDeclaration(new Shift.Identifier("a"), [], new Shift.FunctionBody([new Shift.UseStrictDirective], [
        new Shift.ReturnStatement(new Shift.LiteralNumericExpression(0)),
      ]))
    );
    testParse("(function() {'use strict';return 0;});", expr,
      new Shift.FunctionExpression(null, [], new Shift.FunctionBody([new Shift.UseStrictDirective()], [
        new Shift.ReturnStatement(new Shift.LiteralNumericExpression(0)),
      ]))
    );
    testParse("(function a() {'use strict';return 0;});", expr,
      new Shift.FunctionExpression(new Shift.Identifier("a"), [], new Shift.FunctionBody([new Shift.UseStrictDirective], [
        new Shift.ReturnStatement(new Shift.LiteralNumericExpression(0)),
      ]))
    );
  });
});
