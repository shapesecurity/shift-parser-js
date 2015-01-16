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

var expect = require("expect.js");

var parse = require("../..").default;
var Shift = require("shift-ast");

var expr = require("../helpers").expr;
var stmt = require("../helpers").stmt;

var assertParseFailure = require('../assertions').assertParseFailure;

function directives(program) {
  return program.body.directives;
}

describe("Parser", function () {
  describe("directive", function () {
    expect(directives(parse("\"Hello\""))).to.be.eql([new Shift.Directive("Hello")]);
    expect(directives(parse("\"\\n\\r\\t\\v\\b\\f\\\\\\'\\\"\\0\""))).to.be.eql([new Shift.Directive("\\n\\r\\t\\v\\b\\f\\\\\\'\\\"\\0")]);
    expect(directives(parse("\"\\u0061\""))).to.be.eql([new Shift.Directive("\\u0061")]);
    expect(directives(parse("\"\\x61\""))).to.be.eql([new Shift.Directive("\\x61")]);
    expect(directives(parse("\"\\u00\""))).to.be.eql([new Shift.Directive("\\u00")]);
    expect(directives(parse("\"\\xt\""))).to.be.eql([new Shift.Directive("\\xt")]);
    expect(directives(parse("\"Hello\\nworld\""))).to.be.eql([new Shift.Directive("Hello\\nworld")]);
    expect(directives(parse("\"Hello\\\nworld\""))).to.be.eql([new Shift.Directive("Hello\\\nworld")]);
    expect(directives(parse("\"Hello\\02World\""))).to.be.eql([new Shift.Directive("Hello\\02World")]);
    expect(directives(parse("\"Hello\\012World\""))).to.be.eql([new Shift.Directive("Hello\\012World")]);
    expect(directives(parse("\"Hello\\122World\""))).to.be.eql([new Shift.Directive("Hello\\122World")]);
    expect(directives(parse("\"Hello\\0122World\""))).to.be.eql([new Shift.Directive("Hello\\0122World")]);
    expect(directives(parse("\"Hello\\312World\""))).to.be.eql([new Shift.Directive("Hello\\312World")]);
    expect(directives(parse("\"Hello\\412World\""))).to.be.eql([new Shift.Directive("Hello\\412World")]);
    expect(directives(parse("\"Hello\\812World\""))).to.be.eql([new Shift.Directive("Hello\\812World")]);
    expect(directives(parse("\"Hello\\712World\""))).to.be.eql([new Shift.Directive("Hello\\712World")]);
    expect(directives(parse("\"Hello\\0World\""))).to.be.eql([new Shift.Directive("Hello\\0World")]);
    expect(directives(parse("\"Hello\\\r\nworld\""))).to.be.eql([new Shift.Directive("Hello\\\r\nworld")]);
    expect(directives(parse("\"Hello\\1World\""))).to.be.eql([new Shift.Directive("Hello\\1World")]);
  });

  describe("use strict directive", function () {
    assertParseFailure("(function () { 'use strict'; with (i); })", "Strict mode code may not include a with statement");
    expect(expr(parse("(function () { 'use\\x20strict'; with (i); })"))).to.be.eql(
      new Shift.FunctionExpression(false, null, [], null, new Shift.FunctionBody([new Shift.Directive("use\\x20strict")], [
        new Shift.WithStatement(new Shift.IdentifierExpression(new Shift.Identifier("i")), new Shift.EmptyStatement),
      ]))
    );
    expect(expr(parse("(function () { 'use\\nstrict'; with (i); })"))).to.be.eql(
      new Shift.FunctionExpression(false, null, [], null, new Shift.FunctionBody([new Shift.Directive("use\\nstrict")], [
        new Shift.WithStatement(new Shift.IdentifierExpression(new Shift.Identifier("i")), new Shift.EmptyStatement),
      ]))
    );

    expect(stmt(parse("function a() {'use strict';return 0;};"))).to.be.eql(
      new Shift.FunctionDeclaration(false, new Shift.Identifier("a"), [], null, new Shift.FunctionBody([new Shift.Directive("use strict")], [
        new Shift.ReturnStatement(new Shift.LiteralNumericExpression(0)),
      ]))
    );
    expect(expr(parse("(function() {'use strict';return 0;});"))).to.be.eql(
      new Shift.FunctionExpression(false, null, [], null, new Shift.FunctionBody([new Shift.Directive("use strict")], [
        new Shift.ReturnStatement(new Shift.LiteralNumericExpression(0)),
      ]))
    );
    expect(expr(parse("(function a() {'use strict';return 0;});"))).to.be.eql(
      new Shift.FunctionExpression(false, new Shift.Identifier("a"), [], null, new Shift.FunctionBody([new Shift.Directive("use strict")], [
        new Shift.ReturnStatement(new Shift.LiteralNumericExpression(0)),
      ]))
    );
  });
});
