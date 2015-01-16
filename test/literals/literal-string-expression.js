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
  describe("literal string expression", function () {
    // String Literals
    assertEsprimaEquiv("\"Hello\"");
    assertEsprimaEquiv("\"\\n\\r\\t\\v\\b\\f\\\\\\'\\\"\\0\"");
    assertEsprimaEquiv("\"\\u0061\"");
    assertEsprimaEquiv("\"\\x61\"");
    assertEsprimaEquiv("\"\\u00\"");
    assertEsprimaEquiv("\"\\xt\"");
    assertEsprimaEquiv("\"Hello\\nworld\"");
    assertEsprimaEquiv("\"Hello\\\nworld\"");
    assertEsprimaEquiv("\"Hello\\02World\"");
    assertEsprimaEquiv("\"Hello\\012World\"");
    assertEsprimaEquiv("\"Hello\\122World\"");
    assertEsprimaEquiv("\"Hello\\0122World\"");
    assertEsprimaEquiv("\"Hello\\312World\"");
    assertEsprimaEquiv("\"Hello\\412World\"");
    assertEsprimaEquiv("\"Hello\\812World\"");
    assertEsprimaEquiv("\"Hello\\712World\"");
    assertEsprimaEquiv("\"Hello\\0World\"");
    assertEsprimaEquiv("\"Hello\\\r\nworld\"");
    assertEsprimaEquiv("\"Hello\\1World\"");
  });
});
