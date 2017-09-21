/**
 * Copyright 2017 Shape Security, Inc.
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

const expect = require('expect.js');
const { parseScriptWithLocation, parseModuleWithLocation } = require('../');

class LocationHelper {
  constructor(src, { isModule = false } = {}) {
    this.src = src;
    ({ tree: this.tree, locations: this.locations} = parseScriptWithLocation(src));
  }

  getText(node) {
    const location = this.locations.get(node);
    return this.src.substring(location.start.offset, location.end.offset);
  }

  assertText(node, text) {
    expect(this.getText(node)).to.eql(text);
  }
}

suite('Locations', function () {
  test('simple', function () {
    const helper = new LocationHelper(` a  + 1.  .b ;   `);
    helper.assertText(helper.tree, helper.src);

    const statement = helper.tree.statements[0];
    helper.assertText(statement, `a  + 1.  .b ;`);

    const expr = statement.expression;
    helper.assertText(expr, `a  + 1.  .b`);

    const left = expr.left;
    helper.assertText(left, `a`);

    const right = expr.right;
    helper.assertText(right, `1.  .b`);

    const object = right.object;
    helper.assertText(object, `1.`);
  });
});
