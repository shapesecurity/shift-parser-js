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

suite("API", function () {
  test("should exist", function () {
    expect(ShiftParser.default).to.be.a("function");
    expect(ShiftParser.default("")).to.be.an("object");
  });

  test("early error checker exists", function () {
    expect(ShiftParser.EarlyErrorChecker).to.be.ok();
    expect(ShiftParser.EarlyErrorChecker.check).to.be.a("function");
  });

  function withLoc(x, loc) {
    x.loc = loc;
    return x;
  }

  function span(si, sl, sc, ei, el, ec) {
    return {
      start: { line: sl, column: sc, offset: si },
      end: { line: el, column: ec, offset: ei }
    };
  }

  test("script for location information", function () {
    var rv = ShiftParser.parseScriptWithLocation("0", { earlyErrors: true });
    expect(rv.tree).to.eql(
      {
        type: "Script",
        directives: [],
        statements: [{
          type: "ExpressionStatement",
          expression: { type: "LiteralNumericExpression", value: 0 }
        }]
      }
    );

    expect(rv.locations.get(rv.tree)).to.eql(span(0, 1, 0, 1, 1, 1));
    expect(rv.locations.get(rv.tree.statements[0])).to.eql(span(0, 1, 0, 1, 1, 1));
    expect(rv.locations.get(rv.tree.statements[0].expression)).to.eql(span(0, 1, 0, 1, 1, 1));
  });

  test("module for location information", function () {
    var rv = ShiftParser.parseModuleWithLocation("0", { earlyErrors: true });
    expect(rv.tree).to.eql(
      {
        type: "Module",
        directives: [],
        items: [{
          type: "ExpressionStatement",
          expression: { type: "LiteralNumericExpression", value: 0 }
        }]
      }
    );

    expect(rv.locations.get(rv.tree)).to.eql(span(0, 1, 0, 1, 1, 1));
    expect(rv.locations.get(rv.tree.items[0])).to.eql(span(0, 1, 0, 1, 1, 1));
    expect(rv.locations.get(rv.tree.items[0].expression)).to.eql(span(0, 1, 0, 1, 1, 1));
  });

  function parseModule(name) {
    var source = require("fs").readFileSync(require.resolve(name), "utf-8");
    var tree = ShiftParser.parseModuleWithLocation(source, {earlyErrors: true}).tree;
  }

  function parseScript(name) {
    var source = require("fs").readFileSync(require.resolve(name), "utf-8");
    var tree = ShiftParser.parseScriptWithLocation(source, {earlyErrors: true}).tree;
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
