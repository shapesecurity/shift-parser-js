'use strict';

const bigintXpass = require('./bigint-tests-without-literals.js');
const numsepXpass = require('./numeric-seperator-tests-without-literals.js');
const asyncXfail = require('./async.js');
const trailingCommaXfail = require('./trailing-function-commas.js');

module.exports = {
  xfail: {
    // Tests with any of these feature flags are expected not to parse, unless they are whitelisted in xpassDespiteFeatures
    features: [
      'async-functions',
      'async-iteration',
      'BigInt',
      'regexp-dotall',
      'class-fields-public',
      'class-fields-private',
      'class-static-fields-public',
      'class-static-fields-private',
      'class-methods-private',
      'class-static-methods-private',
      'object-rest',
      'object-spread',
      'numeric-separator-literal',
      'json-superset',
      'export-star-as-namespace-from-module',
      'optional-catch-binding',
    ],
    xpassDespiteFeatures: [
      // arguable feature misclassification https://github.com/tc39/test262/blob/master/test/language/expressions/async-arrow-function/escaped-async-line-terminator.js
      'language/expressions/async-arrow-function/escaped-async-line-terminator.js',

      // json-superset: tests using eval
      'language/literals/string/line-separator-eval.js',
      'language/literals/string/paragraph-separator-eval.js',

      // export-star-as-namespace-from-module: feature used in an import, not the main test
      'language/module-code/instn-star-as-props-dflt-skip.js',
      'language/module-code/instn-star-props-nrml.js',
      'language/module-code/namespace/internals/get-nested-namespace-dflt-skip.js',
      'language/module-code/namespace/internals/get-nested-namespace-props-nrml.js',

      // class-fields-private: tests using eval
      'language/statements/class/privatename-not-valid-eval-earlyerr-1.js',
      'language/statements/class/privatename-not-valid-eval-earlyerr-2.js',
      'language/statements/class/privatename-not-valid-eval-earlyerr-6.js',
      'language/statements/class/privatename-not-valid-eval-earlyerr-7.js',
      'language/statements/class/privatename-not-valid-eval-earlyerr-8.js',

      // regexp-dotall: tests using constructor, or checking properties of functions
      'annexB/built-ins/RegExp/prototype/flags/order-after-compile.js',
      'built-ins/RegExp/duplicate-flags.js',
      'built-ins/RegExp/prototype/dotAll/length.js',
      'built-ins/RegExp/prototype/dotAll/name.js',
      'built-ins/RegExp/prototype/dotAll/prop-desc.js',
      'built-ins/RegExp/prototype/dotAll/this-val-invalid-obj.js',
      'built-ins/RegExp/prototype/dotAll/this-val-non-obj.js',
      'built-ins/RegExp/prototype/dotAll/this-val-regexp-prototype.js',
      'built-ins/RegExp/prototype/flags/coercion-dotall.js',
      'built-ins/RegExp/prototype/flags/get-order.js',
      'built-ins/RegExp/prototype/flags/rethrow.js',
      'built-ins/RegExp/prototype/flags/return-order.js',

      ...bigintXpass,

      ...numsepXpass,
    ],
    files: [
      // functions with reserved names whose bodies are strict: https://github.com/tc39/ecma262/pull/1158
      'language/expressions/function/name-arguments-strict-body.js',
      'language/expressions/function/name-eval-strict-body.js',
      'language/statements/function/name-arguments-strict-body.js',
      'language/statements/function/name-eval-strict-body.js',

      // `for (;;) let \n {` bug: https://github.com/shapesecurity/shift-parser-js/issues/389
      'language/statements/for/let-block-with-newline.js',
      'language/statements/for/let-identifier-with-newline.js',
      'language/statements/for-in/let-block-with-newline.js',
      'language/statements/for-in/let-identifier-with-newline.js',
      'language/statements/for-of/let-block-with-newline.js',
      'language/statements/for-of/let-identifier-with-newline.js',
      'language/statements/if/let-block-with-newline.js',
      'language/statements/if/let-identifier-with-newline.js',
      'language/statements/labeled/let-block-with-newline.js',
      'language/statements/labeled/let-identifier-with-newline.js',
      'language/statements/while/let-block-with-newline.js',
      'language/statements/while/let-identifier-with-newline.js',
      'language/statements/with/let-block-with-newline.js',
      'language/statements/with/let-identifier-with-newline.js',

      // ES2018 invalid escapes in template literals: https://github.com/tc39/ecma262/pull/773
      'language/expressions/tagged-template/invalid-escape-sequences.js',

      // ES2017 for-var-in: https://github.com/tc39/ecma262/pull/614
      'annexB/language/statements/for-in/nonstrict-initializer.js',

      ...trailingCommaXfail,

      ...asyncXfail,

    ],
  },
};
