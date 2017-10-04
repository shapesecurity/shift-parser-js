import fs from 'fs';
import { parseScriptWithLocation, parseModuleWithLocation } from '../../';
import { locationSanityCheck } from '../helpers';
import expect from 'expect.js';
import expectations from './expectations';

let scriptDir = 'node_modules/test262-parser-tests';

function parse(src, asModule, earlyErrors) {
  return (asModule ? parseModuleWithLocation : parseScriptWithLocation)(src, { earlyErrors });
}

function isModule(f) {
  return /\.module\.js/.test(f);
}

suite('test262', () => {
  suite('pass and pass-explicit', () => {
    for (let f of fs.readdirSync(`${scriptDir}/pass`)) {
      if (expectations.xfail.pass.indexOf(f) !== -1) {
        continue;
      }

      let passTestFile = `${scriptDir}/pass/${f}`;
      let passExplicitTestFile = `${scriptDir}/pass-explicit/${f}`;
      test(`does not throw error and generates same tree[${f}]`, () => {
        let passSrc = fs.readFileSync(passTestFile, 'utf8');
        let passTree, passLocations;
        expect(() => {
          ({ tree: passTree, locations: passLocations } = parse(passSrc, isModule(f), true));
        }).to.not.throwError();
        locationSanityCheck(passTree, passLocations);

        let passExplicitSrc = fs.readFileSync(passExplicitTestFile, 'utf8');
        let passExplicitTree;
        expect(() => {
          passExplicitTree = parse(passExplicitSrc, isModule(f), true).tree;
        }).to.not.throwError();

        expect.eql(passTree, passExplicitTree);
      });
    }

    for (let f of expectations.xfail.pass) {
      let passTestFile = `${scriptDir}/pass/${f}`;
      let passExplicitTestFile = `${scriptDir}/pass-explicit/${f}`;
      test(`xfail: throws or fails to generate the same tree[${f}]`, () => {
        let passSrc = fs.readFileSync(passTestFile, 'utf8'); // We are intentionally not catching errors here, so if the expectation becomes stale we'll get an error.
        let passTree, passLocations;
        let passExplicitSrc = fs.readFileSync(passExplicitTestFile, 'utf8');
        let passExplicitTree;
        try {
          ({ tree: passTree, locations: passLocations } = parse(passSrc, isModule(f), true));
          locationSanityCheck(passTree, passLocations);
          passExplicitTree = parse(passExplicitSrc, isModule(f), true).tree;
        } catch (e) {
          return; // pass
        }
        expect.not.eql(passTree, passExplicitTree);
      });
    }
  });

  suite('fail', () => {
    let failTestDir = `${scriptDir}/fail`;
    for (let f of fs.readdirSync(failTestDir)) {
      if (expectations.xfail.fail.indexOf(f) !== -1) {
        continue;
      }

      test(`throws error[${f}]`, () => {
        let src = fs.readFileSync(`${failTestDir}/${f}`, 'utf8');
        expect(() => {
          parse(src, isModule(f), false);
        }).to.throwError();
      });
    }

    for (let f of expectations.xfail.fail) {
      test(`xfail: does not throw error[${f}]`, () => {
        let src = fs.readFileSync(`${failTestDir}/${f}`, 'utf8');
        expect(() => {
          parse(src, isModule(f), false);
        }).to.not.throwError();
      });
    }
  });

  suite('early', () => {
    let earlyErrorsTestDir = `${scriptDir}/early`;
    for (let f of fs.readdirSync(earlyErrorsTestDir)) {
      if (expectations.xfail.early.indexOf(f) !== -1) {
        continue;
      }

      let src = fs.readFileSync(`${earlyErrorsTestDir}/${f}`, 'utf8');
      test(`does not throw error with earlyErrors false[${f}]`, () => {
        expect(() => {
          parse(src, isModule(f), false);
        }).to.not.throwError();
      });
      test(`throws error with earlyErrors true[${f}]`, () => {
        expect(() => {
          parse(src, isModule(f), true);
        }).to.throwError();
      });
    }

    for (let f of expectations.xfail.early) {
      let src = fs.readFileSync(`${earlyErrorsTestDir}/${f}`, 'utf8');

      test(`xfail: throws with earlyErrors false or not with earlyErrors true[${f}]`, () => {
        try {
          parse(src, isModule(f), false);
        } catch (e) {
          return; // pass
        }
        expect(() => {
          parse(src, isModule(f), true);
        }).to.not.throwError();
      });
    }
  });
});
