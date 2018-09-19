'use strict';

const fs = require('fs');
const path = require('path');
const test262Parser = require('test262-parser');

const { parseScriptWithLocation, parseModuleWithLocation } = require('../..');

const expectations = require('./expectations/index.js');


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

const xfail = new Set(expectations.xfail.files);
const xfailFeatures = new Set(expectations.xfail.features);
const xpassDespiteFeatures = new Set(expectations.xfail.xpassDespiteFeatures);


var acceptable = 2;

const results = [];
walk(testDir, f => {
  if (!f.endsWith('.js') || f.endsWith('_FIXTURE.js')) {
    return;
  }
  const file = path.relative(testDir, f);
  const contents = fs.readFileSync(f, 'utf8');
  const data = test262Parser.parseFile({ file, contents });

  const isModule = data.attrs.flags.module;
  const shouldFail = data.attrs.negative != null && (data.attrs.negative.phase === 'parse' || data.attrs.negative.phase === 'early');

  const xfailed = xfail.has(file) || !shouldFail && data.attrs.features != null && data.attrs.features.some(f => xfailFeatures.has(f)) && !xpassDespiteFeatures.has(file);
  // TODO: assert that xpassDespiteFeatures tests exist, have a banned feature

  let failed;
  let e;

  try {
    // TODO location sanity checks
    // const { tree, locations, comments } = 
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
    e = er;
    failed = true;
  }
  // results.push({ file, shouldFail, failed, xfailed });

  if (xfailed) {
    if (failed === shouldFail) {
      console.log('Passed despite being xfailed.');
      console.log(`'${data.file}',`);
      // console.log({ contents: data.contents });
      // console.log({ file, shouldFail, failed, xfailed });
      // console.log(e);
      if (--acceptable < 1)
        process.exit(1);
    }
  } else {
    if (failed !== shouldFail) {
      console.log(data.attrs.flags.onlyStrict);
      console.log('Failed');
      console.log(`'${data.file}',`);
      // console.log(data);
      // console.log({ file, shouldFail, failed, xfailed });
      // console.log(e);
      if (--acceptable < 1)
        process.exit(1);
    }
  }
  // console.log(Object.keys(data.attrs), data.async);
});

// TODO: assert all xfailed tests exist
