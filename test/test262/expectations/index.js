'use strict';

const bigintXpass = require('./bigint-tests-without-literals.js');
const numsepXpass = require('./numeric-seperator-tests-without-literals.js');
const { xpass: regexpXpass, xfail: regexpXfail } = require('./regexp.js');

module.exports = {
  xfail: {
    // Tests with any of these feature flags are expected not to parse, unless they are whitelisted in xpassDespiteFeatures
    features: [
      'async-iteration',
      'BigInt',
      'regexp-dotall',
      'regexp-unicode-property-escapes',
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
      'dynamic-import',
      'import.meta',
    ],
    xpassDespiteFeatures: [
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
      'built-ins/RegExp/prototype/dotAll/cross-realm.js',
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

      // dynamic-import: tests using eval
      'language/expressions/dynamic-import/usage-from-eval.js',

      // import.meta: tests using eval or equivalent
      'language/expressions/import.meta/not-accessible-from-direct-eval.js',
      'language/expressions/import.meta/syntax/goal-async-function-params-or-body.js',
      'language/expressions/import.meta/syntax/goal-function-params-or-body.js',
      'language/expressions/import.meta/syntax/goal-generator-params-or-body.js',

      ...bigintXpass,

      ...regexpXpass,

      ...numsepXpass,
    ],
    files: [
      // feature misclassification (missing async iteration flag): https://github.com/tc39/test262/pull/1942
      'built-ins/Function/prototype/toString/proxy-async-generator-function.js',
      'built-ins/Function/prototype/toString/proxy-async-generator-method-definition.js',
      'language/expressions/await/async-generator-interleaved.js',

      // functions with reserved names whose bodies are strict: https://github.com/tc39/ecma262/pull/1158
      'language/expressions/function/name-arguments-strict-body.js',
      'language/expressions/function/name-eval-strict-body.js',
      'language/statements/function/name-arguments-strict-body.js',
      'language/statements/function/name-eval-strict-body.js',

      // ES2018 invalid escapes in template literals: https://github.com/tc39/ecma262/pull/773
      'language/expressions/tagged-template/invalid-escape-sequences.js',

      ...regexpXfail,
    ],
  },
};
