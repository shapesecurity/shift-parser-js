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
var ShiftParser = require("../../");
var Shift = require("shift-ast");
var locationSanityCheck = require("../helpers").locationSanityCheck;

suite("API", function () {
  test("should exist", function () {
    expect(typeof ShiftParser.default).be("function");
  });

  function withLoc(x, loc) {
    x.loc = loc;
    return x;
  }

  function span(si, sl, sc, ei, el, ec) {
    return new Shift.SourceSpan(new Shift.SourceLocation(si, sl, sc), new Shift.SourceLocation(ei, el, ec));
  }

  test("for location information", function () {
    expect(ShiftParser.default("0", {loc: true})).to.eql(
      withLoc(new Shift.Script(
        withLoc(new Shift.FunctionBody(
          [],
          [
            withLoc(new Shift.ExpressionStatement(
              withLoc(new Shift.LiteralNumericExpression(0),
                span(0, 1, 0, 1, 1, 1)
              )
            ), span(0, 1, 0, 1, 1, 1))
          ]
        ), span(0, 1, 0, 1, 1, 1))
      ), span(0, 1, 0, 1, 1, 1))
    );
  });

  test("for location information", function () {
    expect(ShiftParser.parseModule("0", {loc: true})).to.eql(
      withLoc(new Shift.Module(
          [
            withLoc(
              new Shift.ExpressionStatement(
                withLoc(new Shift.LiteralNumericExpression(0), span(0, 1, 0, 1, 1, 1))
              ), span(0, 1, 0, 1, 1, 1))
          ],
          span(0, 1, 0, 1, 1, 1)),
        span(0, 1, 0, 1, 1, 1)));
  });


  test("location sanity test", function () {
    // TODO: everything.js once the ES6 version is ready
    var source = require("fs").readFileSync(require.resolve("../../src/parser"), "utf-8");
    var tree = ShiftParser.parseModule(source, {loc: true});
    locationSanityCheck(tree);
  });

  test("self parsing", function () {
    function parseFile(name) {
      var source = require("fs").readFileSync(require.resolve("../../src/" + name), "utf-8");
      var tree = ShiftParser.parseModule(source, {loc: true});
      locationSanityCheck(tree);
    }

    parseFile("utils");
    parseFile("errors");
    parseFile("parser");
    parseFile("tokenizer");
    parseFile("index");
  });

});
