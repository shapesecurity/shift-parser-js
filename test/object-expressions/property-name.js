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

var expect = require('expect.js');
var ShiftParser = require('../..');

describe("Parser", function () {
  describe("property name", function () {
    expect(ShiftParser.default("({0x0:0})").body.statements[0].expression.properties[0].name.value).to.be("0");
    expect(ShiftParser.default("({2e308:0})").body.statements[0].expression.properties[0].name.value).to.be("" + 1 / 0);

    expect(function () { ShiftParser.default("({__proto__:42,__proto__:43})") }).to.throwError();
    expect(function () { ShiftParser.default("use strict; ({__proto__:42,__proto__:43})") }).to.throwError();
    expect(function () { ShiftParser.default("({__proto__:42},{__proto__:43})") }).to.not.throwError();
  });
});
