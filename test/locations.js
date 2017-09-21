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

  assertLocation(node, location) {
    expect(this.locations.get(node)).to.eql(location);
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

  test('template with simple linebreak', function () {
    const helper = new LocationHelper('`a\nb`;');

    const statement = helper.tree.statements[0];
    helper.assertLocation(statement, {
      start: { line: 1, column: 0, offset: 0 },
      end: { line: 2, column: 3, offset: 6 },
    });

    const expr = statement.expression;
    helper.assertLocation(expr, {
      start: { line: 1, column: 0, offset: 0 },
      end: { line: 2, column: 2, offset: 5 },
    });

    const element = expr.elements[0];
    helper.assertLocation(element, {
      start: { line: 1, column: 1, offset: 1 },
      end: { line: 2, column: 1, offset: 4 },
    });
  });

  test('template with windows linebreak', function () {
    const helper = new LocationHelper('`a\r\nb`;');

    const statement = helper.tree.statements[0];
    helper.assertLocation(statement, {
      start: { line: 1, column: 0, offset: 0 },
      end: { line: 2, column: 3, offset: 7 },
    });

    const expr = statement.expression;
    helper.assertLocation(expr, {
      start: { line: 1, column: 0, offset: 0 },
      end: { line: 2, column: 2, offset: 6 },
    });

    const element = expr.elements[0];
    helper.assertLocation(element, {
      start: { line: 1, column: 1, offset: 1 },
      end: { line: 2, column: 1, offset: 5 },
    });
  });

  test('template with multiple linebreaks', function () {
    const helper = new LocationHelper('`a\n\r\u2028\u2029b`;');

    const statement = helper.tree.statements[0];
    helper.assertLocation(statement, {
      start: { line: 1, column: 0, offset: 0 },
      end: { line: 5, column: 3, offset: 9 },
    });

    const expr = statement.expression;
    helper.assertLocation(expr, {
      start: { line: 1, column: 0, offset: 0 },
      end: { line: 5, column: 2, offset: 8 },
    });

    const element = expr.elements[0];
    helper.assertLocation(element, {
      start: { line: 1, column: 1, offset: 1 },
      end: { line: 5, column: 1, offset: 7 },
    });
  });

  test('arrow params', function () {
    let helper = new LocationHelper('(a, b) => 0');
    let arrow = helper.tree.statements[0].expression;
    helper.assertText(arrow, '(a, b) => 0');
    helper.assertText(arrow.params, 'a, b');

    helper = new LocationHelper('(a, ...b) => 0');
    helper.assertText(helper.tree.statements[0].expression.params, 'a, ...b');

    helper = new LocationHelper('() => 0');
    helper.assertText(helper.tree.statements[0].expression.params, '');

    helper = new LocationHelper('a => 0');
    helper.assertText(helper.tree.statements[0].expression.params, 'a');

  });

  test('function params', function () {
    let helper = new LocationHelper('function f( ){}');
    let params = helper.tree.statements[0].params;
    helper.assertText(params, '');

    helper.assertLocation(params, {
      start: { line: 1, column: 11, offset: 11 },
      end: { line: 1, column: 11, offset: 11 },
    });

    helper = new LocationHelper('function f( a ){}');
    params = helper.tree.statements[0].params;
    helper.assertText(params, 'a');

    helper = new LocationHelper('function f( a , ...b ){}');
    params = helper.tree.statements[0].params;
    helper.assertText(params, 'a , ...b');
  });

  test('group', function () {
    const helper = new LocationHelper('(0, 1);');

    const statement = helper.tree.statements[0];
    helper.assertText(statement, '(0, 1);');

    const expr = statement.expression;
    helper.assertText(expr, '0, 1');
  });

  test('spread', function () {
    const helper = new LocationHelper('f( ...a );\n[ ...b ];');

    let statement = helper.tree.statements[0];
    helper.assertText(statement, 'f( ...a );');

    let expr = statement.expression;
    helper.assertText(expr, 'f( ...a )');

    let spread = expr.arguments[0];
    helper.assertText(spread, '...a');

    statement = helper.tree.statements[1];
    helper.assertText(statement, '[ ...b ];');

    expr = statement.expression;
    helper.assertText(expr, '[ ...b ]');

    spread = expr.elements[0];
    helper.assertText(spread, '...b');
  });
});
