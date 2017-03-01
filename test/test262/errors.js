import fs from 'fs';
import { parseModule } from '../../';
import { parseScript } from '../../';
import expect from 'expect.js';

let scriptDir = 'node_modules/test262-parser-tests';

function parse(src, isModule, earlyErrors) {
  (isModule ? parseModule : parseScript)(src, { earlyErrors });
}

suite('test262', () => {
  suite('pass and pass-explicit', () => {
    let passExcludes = [
      // https://github.com/shapesecurity/shift-parser-js/issues/311
      '995.script.js',

      // This is an invalid test
      '970.script.js',

      // https://github.com/shapesecurity/shift-parser-js/issues/311
      '1012.script.js'
    ];
    fs.readdirSync(`${scriptDir}/pass`)
      .filter(item => passExcludes.indexOf(item) === -1)
      .forEach(f => {
        let passTree, passExplicitTree;
        let passTestDir = `${scriptDir}/pass/${f}`;
        let passExplicitTestDir = `${scriptDir}/pass-explicit/${f}`;
        test(`does not throw error and generates same tree[${f}]`, () => {
          let passSrc = fs.readFileSync(passTestDir, 'utf8');
          expect(function parsePass() {
            passTree = parse(passSrc, f.match('.module.js'), true);
          }).to.not.throwError();

          let passExplicitSrc = fs.readFileSync(passExplicitTestDir, 'utf8');
          expect(function parsePassExplicit() {
            passExplicitTree = parse(passExplicitSrc, f.match('.module.js'), true);
          }).to.not.throwError();

          expect.eql(passTree, passExplicitTree);
        });
      });
  });

  suite('fail', () => {
    let failTestDir = `${scriptDir}/fail`;
    let failExcludes = [
      // https://github.com/shapesecurity/shift-parser-js/issues/313
      '69.script.js',
      '70.script.js',
      '71.script.js',
      '75.script.js',
      '76.script.js',
      '77.script.js',
      '149.script.js',
      '151.script.js',
      '248.script.js',
      '519.script.js'
    ];
    fs.readdirSync(failTestDir)
      .filter(item => failExcludes.indexOf(item) === -1)
      .forEach(f => {
        test(`throws error[${f}]`, () => {
          let src = fs.readFileSync(`${failTestDir}/${f}`, 'utf8');
          expect(() => {
            parse(src, f.match('.module.js'), false);
          }).to.throwError();
        });
      });
  });

  suite('early', () => {
    let earlyExcludes = [
      // https://github.com/shapesecurity/shift-parser-js/issues/316
      '56.script.js', '641.script.js', '642.script.js',

      // https://github.com/shapesecurity/shift-parser-js/issues/317
      '88.script.js', '90.script.js',

      // https://github.com/shapesecurity/shift-parser-js/issues/318
      '190.script.js', '205.script.js',

      // https://github.com/shapesecurity/shift-parser-js/issues/319
      '557.script.js',

      // https://github.com/shapesecurity/shift-parser-js/issues/320
      '558.script.js', '559.script.js', '560.script.js', '561.script.js',

      // https://github.com/shapesecurity/shift-parser-js/issues/321
      '563.script.js', '564.script.js', '565.script.js', '566.script.js',
      '567.script.js', '568.script.js', '569.script.js', '570.script.js',
      '571.script.js', '572.script.js', '574.script.js',

      // https://github.com/shapesecurity/shift-parser-js/issues/322
      '575.script.js', '576.script.js', '577.script.js', '578.script.js',
      '579.script.js', '580.script.js', '581.script.js', '582.script.js',
      '583.script.js', '585.script.js', '586.script.js', '587.script.js', '588.script.js',

      // https://github.com/shapesecurity/shift-parser-js/issues/323
      '589.script.js', '590.script.js', '591.script.js', '592.script.js', '593.script.js',

      // https://github.com/tc39/test262-parser-tests/issues/7
      '594.script.js', '596.script.js', '597.script.js', '598.script.js',

      // https://github.com/tc39/test262-parser-tests/issues/6
      '135.script.js',

      // causes Syntax Errors in the test script
      '599.script.js', '600.script.js', '601.script.js', '602.script.js'
    ];
    let earlyErrorsTestDir = `${scriptDir}/early`;
    fs.readdirSync(earlyErrorsTestDir)
      .filter(item => earlyExcludes.indexOf(item) === -1)
      .forEach(f => {
        let src = fs.readFileSync(`${earlyErrorsTestDir}/${f}`, 'utf8');
        test(`does not throw error with earlyErrors false[${f}]`, function () {
          expect(() => {
            parse(src, f.match('.module.js'), false);
          }).to.not.throwError();
        });
        test(`throws error with earlyErrors true[${f}]`, function () {
          expect(() => {
            parse(src, f.match('.module.js'), true);
          }).to.throwError();
        });
      });
  });
});
