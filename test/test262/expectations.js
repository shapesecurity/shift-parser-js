export default {
  xfail: {
    pass: [
      // https://github.com/shapesecurity/shift-parser-js/issues/311
      '995.script.js',

      // This is an invalid test
      '970.script.js',

      // https://github.com/shapesecurity/shift-parser-js/issues/311
      '1012.script.js',

      // https://github.com/tc39/test262-parser-tests/issues/12
      '1252.script.js',
    ],
    early: [
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
      '599.script.js', '600.script.js', '601.script.js', '602.script.js',
    ],
    fail: [
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
      '519.script.js',
    ],
  },
};
