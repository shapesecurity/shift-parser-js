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
    return {
      start: { line: sl, column: sc, offset: si },
      end: { line: el, column: ec, offset: ei },
      source: null
    };
  }

  test("for location information", function () {
    expect(ShiftParser.default("0", {loc: true})).to.eql(
      withLoc({
        type: "Script",
        body: withLoc({
          type: "FunctionBody",
          directives: [],
          statements: [withLoc({
            type: "ExpressionStatement",
            expression: withLoc({ type: "LiteralNumericExpression", value: 0 }, span(0, 1, 0, 1, 1, 1))
          }, span(0, 1, 0, 1, 1, 1))]
        }, span(0, 1, 0, 1, 1, 1))
      }, span(0, 1, 0, 1, 1, 1))
    );
  });

  test("for location information", function () {
    expect(ShiftParser.parseModule("0", {loc: true})).to.eql(
      withLoc({
          type: "Module",
          items: [withLoc({
            type: "ExpressionStatement",
            expression: withLoc({ type: "LiteralNumericExpression", value: 0 }, span(0, 1, 0, 1, 1, 1))
          }, span(0, 1, 0, 1, 1, 1))]
        },
        span(0, 1, 0, 1, 1, 1)));
  });

  function parseModule(name) {
    var source = require("fs").readFileSync(require.resolve(name), "utf-8");
    var tree = ShiftParser.parseModule(source, {loc: true});
    locationSanityCheck(tree);
  }

  function parseScript(name) {
    var source = require("fs").readFileSync(require.resolve(name), "utf-8");
    var tree = ShiftParser.parseScript(source, {loc: true});
    locationSanityCheck(tree);
  }

  test("location sanity test", function () {
    parseModule("everything.js/es2015-module");
    parseScript("everything.js/es2015-script");
  });

  test("self parsing", function () {
    parseScript(__filename);
    parseModule("../../src/utils");
    parseModule("../../src/errors");
    parseModule("../../src/parser");
    parseModule("../../src/tokenizer");
    parseModule("../../src/index");
  });

});
