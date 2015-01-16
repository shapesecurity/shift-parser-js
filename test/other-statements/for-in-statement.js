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

var assertEsprimaEquiv = require('../assertions').assertEsprimaEquiv;

describe("Parser", function () {
  describe("for in statement", function () {
    assertEsprimaEquiv("for(x in list) process(x);");
    assertEsprimaEquiv("for (var x in list) process(x);");
    assertEsprimaEquiv("for (var x = 42 in list) process(x);");
    assertEsprimaEquiv("for (let x in list) process(x);");
    assertEsprimaEquiv("for (var x = y = z in q);");
    assertEsprimaEquiv("for (var a = b = c = (d in e) in z);");
    assertEsprimaEquiv("for (var i = function() { return 10 in [] } in list) process(x);");
    assertEsprimaEquiv("for(var a in b);");
    assertEsprimaEquiv("for(var a = c in b);");
    assertEsprimaEquiv("for(a in b);");
    assertEsprimaEquiv("for(a.b in b);");
  });
});
