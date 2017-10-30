'use strict';

const fs = require('fs');
const crypto = require('crypto');
const reducer = require('shift-reducer');
const normalize = require('normalize-parser-test').default;
const { parseScriptWithLocation, parseModuleWithLocation } = require('shift-parser');

const expectationsDir = 'node_modules/shift-parser-expectations/expectations';

function getTest262Name(program, isModule) {
  const digest = crypto.createHash('sha256').update(normalize(program, isModule)).digest('hex');
  return digest.substring(0, 16) + (isModule ? '.module' : '');
}

function testExistsUpstream(src, isModule) {
  const name = getTest262Name(src, isModule);
  return fs.existsSync(expectationsDir + '/' + name + '.js-tree.json');
}

class DupFinder extends reducer.MonoidalReducer {
  constructor() {
    super({
      empty: () => [],
      concat: function(b) {
        return this.concat(b);
      },
    });
  }

  reduceExpressionStatement(node, arg) {
    const sup = super.reduceExpressionStatement(node, arg);
    if (
      node.expression.type === 'CallExpression' &&
      node.expression.callee.type === 'IdentifierExpression' &&
      (node.expression.callee.name === 'testParse' ||
        node.expression.callee.name === 'testParseModule') &&
      node.expression.arguments.length === 3 &&
      node.expression.arguments[0].type === 'LiteralStringExpression'
    ) {
      const test = node.expression.arguments[0].value;
      if (testExistsUpstream(test, node.expression.callee.name === 'testParseModule')) {
        return [node].concat(sup);
      }
    }
    return sup;
  }
}

function locateDupTests(src) {
  const { tree, locations } = parseModuleWithLocation(src, {
    earlyErrors: false,
  });
  const dups = reducer.default(new DupFinder, tree);
  const ranges = dups.map(d => {
    const loc = locations.get(d);
    return { start: loc.start.offset, end: loc.end.offset };
  });
  return ranges.sort((a, b) => a.start - b.start);
}

function getDupsFromDir(dir) {
  return fs.readdirSync(dir).reduce((acc, v) => {
    const f = dir + '/' + v;
    if (fs.lstatSync(f).isDirectory()) {
      return acc.concat(getDupsFromDir(f));
    }
    if (/\.js$/.test(f)) {
      const src = fs.readFileSync(f, 'utf8');
      return acc.concat([{ file: f, src, ranges: locateDupTests(src) }]);
    }
    return acc;
  }, []);
}

const diffs = getDupsFromDir('test');

for (let { file, src, ranges } of diffs) {
  if (ranges.length === 0) continue;
  let offset = 0;
  let out = '';
  for (let { start, end } of ranges) {
    out += src.substring(offset, start);
    offset = end;
  }
  out += src.substring(offset);
  fs.writeFileSync(file, out, 'utf8');
}

const changeCount = diffs.reduce((acc, diff) => acc + diff.ranges.length, 0);

if (changeCount === 0) {
  console.log('No duplicates found!');
} else {
  console.log('Removed ' + changeCount + ' duplicates!\nYou probably want to run `npm run lint -- --fix` to clean up.');
}
