/**
 * Copyright 2015 Shape Security, Inc.
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

"use strict";
var Benchmark = require("benchmark");

global.fs = require("fs");
global.parse = require("./").parseScript;
global.esprima = require("esprima");
global.acorn = require("acorn");
global.babel = require("babel-core");
global.traceur = require("traceur");
global.uglifyjs = require("uglify-js");

// Poor man's error reporter for Traceur.
console.reportError = console.error;

function benchmarkParsing(fileName) {
  var source = global.source = fs.readFileSync(require.resolve(fileName), "utf-8");
  console.log(fileName + " (" + (source.length / 1000).toFixed(2) + "KB)");
  var suite = new Benchmark.Suite;
  suite.add("shift", function () {
    parse(source, { loc: true, earlyErrors: false });
  });
  suite.add("acorn", function() {
    acorn.parse(source, { loc: true, sourceType: "script" });
  });
  suite.add("esprima", function() {
    esprima.parse(source, { loc: true, sourceType: "script" });
  });
  suite.add("babel", function() {
    babel.parse(source, { loc: true, sourceType: "script" });
  });
  suite.add("traceur", function() {
    var file, parser, tree;
    file = new traceur.syntax.SourceFile('name', source);
    parser = new traceur.syntax.Parser(file, console);
    tree = parser.parseScript();
  });
  suite.add("uglifyjs", function() {
    uglifyjs.parse(source);
  });
  suite.on("complete", function() {
    this.sort(function(a, b) { return a.stats.mean - b.stats.mean; });
    [].forEach.call(this, function(results) {
      console.log("  " + results.name + ": " + (results.stats.mean * 1000).toFixed(2) + "ms");
    });
  });
  suite.run({ "async": false });
}

benchmarkParsing("angular/angular");
benchmarkParsing("esprima/dist/esprima");
benchmarkParsing("./src/parser");
