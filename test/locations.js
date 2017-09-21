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
    this.assertText(this.tree, src);
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

  test('simple template', function () {
    const helper = new LocationHelper('`foo`;');

    const statement = helper.tree.statements[0];
    helper.assertText(statement, '`foo`;');

    const expr = statement.expression;
    helper.assertText(expr, '`foo`');

    const element = expr.elements[0];
    helper.assertText(element, 'foo');
  });

  test('complex template', function () {
    const helper = new LocationHelper('`foo ${ 0 } bar ${ 1 } baz`;');

    const statement = helper.tree.statements[0];
    helper.assertText(statement, '`foo ${ 0 } bar ${ 1 } baz`;');

    const expr = statement.expression;
    helper.assertText(expr, '`foo ${ 0 } bar ${ 1 } baz`');

    let element = expr.elements[0];
    helper.assertText(element, 'foo ');

    element = expr.elements[1];
    helper.assertText(element, '0');

    element = expr.elements[2];
    helper.assertText(element, ' bar ');

    element = expr.elements[3];
    helper.assertText(element, '1');

    element = expr.elements[4];
    helper.assertText(element, ' baz');
  });
});
