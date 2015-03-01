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

var expr = require("./helpers").expr;
var stmt = require("./helpers").stmt;

var testParseFailure = require('./assertions').testParseFailure;
var testParse = require('./assertions').testParse;

function directives(program) {
  return program.body.directives;
}

suite("Parser", function () {
  suite("directives", function () {
    testParse("\"Hello\"", directives, [new Shift.Directive("Hello")]);
    testParse("\"\\n\\r\\t\\v\\b\\f\\\\\\'\\\"\\0\"", directives, [new Shift.Directive("\\n\\r\\t\\v\\b\\f\\\\\\'\\\"\\0")]);
    testParse("\"\\u0061\"", directives, [new Shift.Directive("\\u0061")]);
    testParse("\"\\x61\"", directives, [new Shift.Directive("\\x61")]);
    testParse("\"\\u00\"", directives, [new Shift.Directive("\\u00")]);
    testParse("\"\\xt\"", directives, [new Shift.Directive("\\xt")]);
    testParse("\"Hello\\nworld\"", directives, [new Shift.Directive("Hello\\nworld")]);
    testParse("\"Hello\\\nworld\"", directives, [new Shift.Directive("Hello\\\nworld")]);
    testParse("\"Hello\\02World\"", directives, [new Shift.Directive("Hello\\02World")]);
    testParse("\"Hello\\012World\"", directives, [new Shift.Directive("Hello\\012World")]);
    testParse("\"Hello\\122World\"", directives, [new Shift.Directive("Hello\\122World")]);
    testParse("\"Hello\\0122World\"", directives, [new Shift.Directive("Hello\\0122World")]);
    testParse("\"Hello\\312World\"", directives, [new Shift.Directive("Hello\\312World")]);
    testParse("\"Hello\\412World\"", directives, [new Shift.Directive("Hello\\412World")]);
    testParse("\"Hello\\812World\"", directives, [new Shift.Directive("Hello\\812World")]);
    testParse("\"Hello\\712World\"", directives, [new Shift.Directive("Hello\\712World")]);
    testParse("\"Hello\\0World\"", directives, [new Shift.Directive("Hello\\0World")]);
    testParse("\"Hello\\\r\nworld\"", directives, [new Shift.Directive("Hello\\\r\nworld")]);
    testParse("\"Hello\\1World\"", directives, [new Shift.Directive("Hello\\1World")]);

    testParse("(function () { 'use\\x20strict'; with (i); })", expr,
      new Shift.FunctionExpression(false, null, [], null, new Shift.FunctionBody([new Shift.Directive("use\\x20strict")], [
        new Shift.WithStatement(new Shift.IdentifierExpression(new Shift.Identifier("i")), new Shift.EmptyStatement),
      ]))
    );
    testParse("(function () { 'use\\nstrict'; with (i); })", expr,
      new Shift.FunctionExpression(false, null, [], null, new Shift.FunctionBody([new Shift.Directive("use\\nstrict")], [
        new Shift.WithStatement(new Shift.IdentifierExpression(new Shift.Identifier("i")), new Shift.EmptyStatement),
      ]))
    );

    testParse("function a() {'use strict';return 0;};", stmt,
      new Shift.FunctionDeclaration(false, new Shift.BindingIdentifier(new Shift.Identifier("a")), [], null, new Shift.FunctionBody([new Shift.Directive("use strict")], [
        new Shift.ReturnStatement(new Shift.LiteralNumericExpression(0)),
      ]))
    );
    testParse("(function() {'use strict';return 0;});", expr,
      new Shift.FunctionExpression(false, null, [], null, new Shift.FunctionBody([new Shift.Directive("use strict")], [
        new Shift.ReturnStatement(new Shift.LiteralNumericExpression(0)),
      ]))
    );
    testParse("(function a() {'use strict';return 0;});", expr,
      new Shift.FunctionExpression(false, new Shift.BindingIdentifier(new Shift.Identifier("a")), [], null, new Shift.FunctionBody([new Shift.Directive("use strict")], [
        new Shift.ReturnStatement(new Shift.LiteralNumericExpression(0)),
      ]))
    );
  });
});
