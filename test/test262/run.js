'use strict';

const fs = require('fs');
const path = require('path');
const test262Parser = require('test262-parser');
const expect = require('expect.js');

const { parseScriptWithLocation, parseModuleWithLocation } = require('../..');

const expectations = require('./expectations/index.js');
const xfail = new Set(expectations.xfail.files);
const xfailFeatures = new Set(expectations.xfail.features);
const xpassDespiteFeatures = new Set(expectations.xfail.xpassDespiteFeatures);

const testDir = path.join(path.dirname(require.resolve('test262/package.json')), 'test');


function walk(dir, fileHandler) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.lstatSync(full).isDirectory()) {
      walk(full, fileHandler);
    } else {
      fileHandler(full);
    }
  }
}


suite('test262 tests', () => {
  walk(testDir, f => {
    if (!f.endsWith('.js') || f.endsWith('_FIXTURE.js')) {
      return;
    }
    const shortName = path.relative(testDir, f);

    test(shortName, () => {
      const contents = fs.readFileSync(f, 'utf8');
      const data = test262Parser.parseFile({ file: shortName, contents });

      const isModule = data.attrs.flags.module;
      const shouldFail = data.attrs.negative != null && (data.attrs.negative.phase === 'parse' || data.attrs.negative.phase === 'early');

      const xfailed = xfail.has(shortName) || !shouldFail && data.attrs.features != null && data.attrs.features.some(feat => xfailFeatures.has(feat)) && !xpassDespiteFeatures.has(shortName);

      let failed;
      try {
        // TODO location sanity checks
        if (isModule) {
          parseModuleWithLocation(data.contents);
        } else if (data.attrs.flags.onlyStrict) {
          parseScriptWithLocation('"use strict";\n' + data.contents);
        } else if (data.attrs.flags.noStrict) {
          parseScriptWithLocation(data.contents);
        } else {
          parseScriptWithLocation('"use strict";\n' + data.contents);
          parseScriptWithLocation(data.contents);
        }
        failed = false;
      } catch (er) {
        failed = true;
      }

      if (xfailed) {
        expect(failed).to.not.be(shouldFail);
      } else {
        expect(failed).to.be(shouldFail);
      }
    });
  });
});

suite('test262 expectations sanity', () => {
  suite('named tests exist', () => {
    for (let file of expectations.xfail.xpassDespiteFeatures.concat(expectations.xfail.files)) {
      test('existence of ' + file, () => {
        expect(fs.existsSync(path.join(testDir, file))).to.be.ok();
      });
    }
  });

  suite('xpassDespiteFeatures tests have a forbidden feature', () => {
    for (let file of expectations.xfail.xpassDespiteFeatures) {
      test('features of ' + file, () => {
        const contents = fs.readFileSync(path.join(testDir, file), 'utf8');
        const data = test262Parser.parseFile({ file, contents });
        expect(Array.isArray(data.attrs.features)).to.be.ok();
        expect(data.attrs.features.some(feat => xfailFeatures.has(feat))).to.be.ok();
      });
    }
  });
});
