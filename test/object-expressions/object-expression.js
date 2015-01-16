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
  describe("object expression", function () {
    // Object Initializer
    assertEsprimaEquiv("+{}");
    assertEsprimaEquiv("+{ }");
    assertEsprimaEquiv("+{ answer: 42 }");
    assertEsprimaEquiv("+{ if: 42 }");
    assertEsprimaEquiv("+{ true: 42 }");
    assertEsprimaEquiv("+{ false: 42 }");
    assertEsprimaEquiv("+{ null: 42 }");
    assertEsprimaEquiv("+{ \"answer\": 42 }");
    assertEsprimaEquiv("+{ x: 1, x: 2 }");
    assertEsprimaEquiv("+{ get width() { return m_width } }");
    assertEsprimaEquiv("+{ get undef() {} }");
    assertEsprimaEquiv("+{ get if() {} }");
    assertEsprimaEquiv("+{ get true() {} }");
    assertEsprimaEquiv("+{ get false() {} }");
    assertEsprimaEquiv("+{ get null() {} }");
    assertEsprimaEquiv("+{ get \"undef\"() {} }");
    assertEsprimaEquiv("+{ get 10() {} }");
    assertEsprimaEquiv("+{ set width(w) { m_width = w } }");
    assertEsprimaEquiv("+{ set if(w) { m_if = w } }");
    assertEsprimaEquiv("+{ set true(w) { m_true = w } }");
    assertEsprimaEquiv("+{ set false(w) { m_false = w } }");
    assertEsprimaEquiv("+{ set null(w) { m_null = w } }");
    assertEsprimaEquiv("+{ set \"null\"(w) { m_null = w } }");
    assertEsprimaEquiv("+{ set 10(w) { m_null = w } }");
    assertEsprimaEquiv("+{ get: 42 }");
    assertEsprimaEquiv("+{ set: 43 }");
    assertEsprimaEquiv("+{ __proto__: 2 }");
    assertEsprimaEquiv("+{\"__proto__\": 2 }");
    assertEsprimaEquiv("+{ get width() { return m_width }, set width(width) { m_width = width; } }");
    assertEsprimaEquiv("+{a:0, get 'b'(){}, set 3(d){}}");
  });
});
