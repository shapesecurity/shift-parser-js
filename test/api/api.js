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

let expect = require('expect.js');
let ShiftParser = require('../../');

suite('API', () => {
  test('should exist', () => {
    expect(ShiftParser.default).to.be.a('function');
    expect(ShiftParser.default('')).to.be.an('object');
  });

  test('early error checker exists', () => {
    expect(ShiftParser.EarlyErrorChecker).to.be.ok();
    expect(ShiftParser.EarlyErrorChecker.check).to.be.a('function');
  });

  function span(si, sl, sc, ei, el, ec) {
    return {
      start: { line: sl, column: sc, offset: si },
      end: { line: el, column: ec, offset: ei },
    };
  }

  test('script for location information', () => {
    let rv = ShiftParser.parseScriptWithLocation('0', { earlyErrors: true });
    expect(rv.tree).to.eql(
      {
        type: 'Script',
        directives: [],
        statements: [{
          type: 'ExpressionStatement',
          expression: { type: 'LiteralNumericExpression', value: 0 },
        }],
      }
    );

    expect(rv.locations.get(rv.tree)).to.eql(span(0, 1, 0, 1, 1, 1));
    expect(rv.locations.get(rv.tree.statements[0])).to.eql(span(0, 1, 0, 1, 1, 1));
    expect(rv.locations.get(rv.tree.statements[0].expression)).to.eql(span(0, 1, 0, 1, 1, 1));
  });

  test('module for location information', () => {
    let rv = ShiftParser.parseModuleWithLocation('0', { earlyErrors: true });
    expect(rv.tree).to.eql(
      {
        type: 'Module',
        directives: [],
        items: [{
          type: 'ExpressionStatement',
          expression: { type: 'LiteralNumericExpression', value: 0 },
        }],
      }
    );

    expect(rv.locations.get(rv.tree)).to.eql(span(0, 1, 0, 1, 1, 1));
    expect(rv.locations.get(rv.tree.items[0])).to.eql(span(0, 1, 0, 1, 1, 1));
    expect(rv.locations.get(rv.tree.items[0].expression)).to.eql(span(0, 1, 0, 1, 1, 1));
  });

  test('script for comment locations', () => {
    let source = `
      // a comment
      '//not a comment';
      --> a comment
      a + /* a comment
      */ <!-- a comment
      \`/*not a comment*/ \${ 0/* a template comment */ } \`
      // a comment`; // That this does not have a trailing linebreak is important.
    let rv = ShiftParser.parseScriptWithLocation(source);

    const commentStrings = [];
    for (let i = 0; i < rv.comments.length; ++i) {
      const { start, end } = rv.comments[i];
      commentStrings.push(source.substring(start.offset, end.offset));
    }
    expect(commentStrings).to.eql([
      '// a comment\n',
      '--> a comment\n',
      '/* a comment\n      */',
      '<!-- a comment\n',
      '/* a template comment */',
      '// a comment',
    ]);

    expect(rv.comments.map(({ type, text }) => ({ type, text }))).to.eql([
      { type: 'SingleLine', text: ' a comment' },
      { type: 'HTMLClose', text: ' a comment' },
      { type: 'MultiLine', text: ' a comment\n      ' },
      { type: 'HTMLOpen', text: ' a comment' },
      { type: 'MultiLine', text: ' a template comment ' },
      { type: 'SingleLine', text: ' a comment' },
    ]);
  });

  test('module for comment locations', () => {
    let source = `
      // a comment
      '// not a comment';
      a <!-- b
      `; // Note that '<!-- b' is *not* a comment.
    let rv = ShiftParser.parseModuleWithLocation(source);

    const commentStrings = [];
    for (let i = 0; i < rv.comments.length; ++i) {
      const { start, end } = rv.comments[i];
      commentStrings.push(source.substring(start.offset, end.offset));
    }
    expect(commentStrings).to.eql([
      '// a comment\n',
    ]);

    expect(rv.comments.map(({ type, text }) => ({ type, text }))).to.eql([
      { type: 'SingleLine', text: ' a comment' },
    ]);
  });

  function parseModule(name) {
    let source = require('fs').readFileSync(require.resolve(name), 'utf-8');
    let tree = ShiftParser.parseModule(source, { earlyErrors: true });
    let tree2 = ShiftParser.parseModule(source, { earlyErrors: false });
    expect.eql(tree, tree2);
  }

  function parseScript(name) {
    let source = require('fs').readFileSync(require.resolve(name), 'utf-8');
    let tree = ShiftParser.parseScript(source, { earlyErrors: true });
    let tree2 = ShiftParser.parseScript(source, { earlyErrors: false });
    expect.eql(tree, tree2);
  }

  test('location sanity test', () => {
    parseModule('everything.js/es2015-module');
    parseScript('everything.js/es2015-script');
  });

  test('self parsing', () => {
    parseScript(__filename);
    parseModule('../../src/utils');
    parseModule('../../src/errors');
    parseModule('../../src/parser');
    parseModule('../../src/tokenizer');
    parseModule('../../src/index');
  });

});
