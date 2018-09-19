'use strict';

// Tests which have neither the `async-functions` nor the `async-iteration` feature flags, but don't use at least one of those features.
// This is arguably a bug in test262, and these should be reported.
// These are split out so the main expectations file is easier to read.
module.exports = [
  'built-ins/AsyncFunction/AsyncFunction-construct.js',
  'built-ins/AsyncFunction/AsyncFunction-is-extensible.js',
  'built-ins/AsyncFunction/AsyncFunction-is-subclass.js',
  'built-ins/AsyncFunction/AsyncFunction-length.js',
  'built-ins/AsyncFunction/AsyncFunction-name.js',
  'built-ins/AsyncFunction/AsyncFunction-prototype.js',
  'built-ins/AsyncFunction/AsyncFunction.js',
  'built-ins/AsyncFunction/AsyncFunctionPrototype-is-extensible.js',
  'built-ins/AsyncFunction/AsyncFunctionPrototype-prototype.js',
  'built-ins/AsyncFunction/AsyncFunctionPrototype-to-string.js',
  'built-ins/AsyncFunction/instance-construct-throws.js',
  'built-ins/AsyncFunction/instance-has-name.js',
  'built-ins/AsyncFunction/instance-length.js',
  'built-ins/AsyncFunction/instance-prototype-property.js',
  'language/expressions/async-function/expression-returns-promise.js',
  'language/expressions/async-function/named-dflt-params-abrupt.js',
  'language/expressions/async-function/named-dflt-params-arg-val-not-undefined.js',
  'language/expressions/async-function/named-dflt-params-arg-val-undefined.js',
  'language/expressions/async-function/named-dflt-params-ref-later.js',
  'language/expressions/async-function/named-dflt-params-ref-prior.js',
  'language/expressions/async-function/named-dflt-params-ref-self.js',
  'language/expressions/async-function/named-dflt-params-trailing-comma.js',
  'language/expressions/async-function/named-params-trailing-comma-multiple.js',
  'language/expressions/async-function/named-params-trailing-comma-single.js',
  'language/expressions/async-function/nameless-dflt-params-abrupt.js',
  'language/expressions/async-function/nameless-dflt-params-arg-val-not-undefined.js',
  'language/expressions/async-function/nameless-dflt-params-arg-val-undefined.js',
  'language/expressions/async-function/nameless-dflt-params-ref-later.js',
  'language/expressions/async-function/nameless-dflt-params-ref-prior.js',
  'language/expressions/async-function/nameless-dflt-params-ref-self.js',
  'language/expressions/async-function/nameless-dflt-params-trailing-comma.js',
  'language/expressions/async-function/nameless-params-trailing-comma-multiple.js',
  'language/expressions/async-function/nameless-params-trailing-comma-single.js',
  'language/expressions/async-function/syntax-expression-is-PrimaryExpression.js',
  'language/expressions/async-function/try-reject-finally-reject.js',
  'language/expressions/async-function/try-reject-finally-return.js',
  'language/expressions/async-function/try-reject-finally-throw.js',
  'language/expressions/async-function/try-return-finally-reject.js',
  'language/expressions/async-function/try-return-finally-return.js',
  'language/expressions/async-function/try-return-finally-throw.js',
  'language/expressions/async-function/try-throw-finally-reject.js',
  'language/expressions/async-function/try-throw-finally-return.js',
  'language/expressions/async-function/try-throw-finally-throw.js',
  'language/expressions/await/await-BindingIdentifier-in-global.js',
  'language/expressions/await/await-awaits-thenable-not-callable.js',
  'language/expressions/await/await-awaits-thenables-that-throw.js',
  'language/expressions/await/await-awaits-thenables.js',
  'language/expressions/await/await-in-nested-function.js',
  'language/expressions/await/await-in-nested-generator.js',
  'language/expressions/await/await-throws-rejections.js',
  'language/expressions/await/syntax-await-has-UnaryExpression-with-MultiplicativeExpression.js',
  'language/expressions/await/syntax-await-has-UnaryExpression.js',
  'language/expressions/object/method-definition/object-method-returns-promise.js',
  'language/statements/async-function/declaration-returns-promise.js',
  'language/statements/async-function/dflt-params-abrupt.js',
  'language/statements/async-function/dflt-params-arg-val-not-undefined.js',
  'language/statements/async-function/dflt-params-arg-val-undefined.js',
  'language/statements/async-function/dflt-params-ref-later.js',
  'language/statements/async-function/dflt-params-ref-prior.js',
  'language/statements/async-function/dflt-params-ref-self.js',
  'language/statements/async-function/dflt-params-trailing-comma.js',
  'language/statements/async-function/evaluation-body-that-returns-after-await.js',
  'language/statements/async-function/evaluation-body-that-returns.js',
  'language/statements/async-function/evaluation-body-that-throws-after-await.js',
  'language/statements/async-function/evaluation-body-that-throws.js',
  'language/statements/async-function/evaluation-body.js',
  'language/statements/async-function/evaluation-default-that-throws.js',
  'language/statements/async-function/evaluation-mapped-arguments.js',
  'language/statements/async-function/evaluation-this-value-global.js',
  'language/statements/async-function/evaluation-this-value-passed.js',
  'language/statements/async-function/evaluation-unmapped-arguments.js',
  'language/statements/async-function/params-trailing-comma-multiple.js',
  'language/statements/async-function/params-trailing-comma-single.js',
  'language/statements/async-function/syntax-declaration-line-terminators-allowed.js',
  'language/statements/async-function/syntax-declaration.js',
  'language/statements/async-function/try-reject-finally-reject.js',
  'language/statements/async-function/try-reject-finally-return.js',
  'language/statements/async-function/try-reject-finally-throw.js',
  'language/statements/async-function/try-return-finally-reject.js',
  'language/statements/async-function/try-return-finally-return.js',
  'language/statements/async-function/try-return-finally-throw.js',
  'language/statements/async-function/try-throw-finally-reject.js',
  'language/statements/async-function/try-throw-finally-return.js',
  'language/statements/async-function/try-throw-finally-throw.js',
  'language/statements/class/definition/class-method-returns-promise.js',

  'language/expressions/async-arrow-function/arrow-returns-promise.js',
  'language/expressions/async-arrow-function/dflt-params-abrupt.js',
  'language/expressions/async-arrow-function/dflt-params-arg-val-not-undefined.js',
  'language/expressions/async-arrow-function/dflt-params-arg-val-undefined.js',
  'language/expressions/async-arrow-function/dflt-params-ref-later.js',
  'language/expressions/async-arrow-function/dflt-params-ref-prior.js',
  'language/expressions/async-arrow-function/dflt-params-ref-self.js',
  'language/expressions/async-arrow-function/dflt-params-trailing-comma.js',
  'language/expressions/async-arrow-function/params-trailing-comma-multiple.js',
  'language/expressions/async-arrow-function/params-trailing-comma-single.js',

  'language/expressions/async-arrow-function/try-reject-finally-reject.js',
  'language/expressions/async-arrow-function/try-reject-finally-return.js',
  'language/expressions/async-arrow-function/try-reject-finally-throw.js',
  'language/expressions/async-arrow-function/try-return-finally-reject.js',
  'language/expressions/async-arrow-function/try-return-finally-return.js',
  'language/expressions/async-arrow-function/try-return-finally-throw.js',
  'language/expressions/async-arrow-function/try-throw-finally-reject.js',
  'language/expressions/async-arrow-function/try-throw-finally-return.js',
  'language/expressions/async-arrow-function/try-throw-finally-throw.js',

  'language/expressions/class/async-meth-dflt-params-abrupt.js',
  'language/expressions/class/async-meth-dflt-params-arg-val-not-undefined.js',
  'language/expressions/class/async-meth-dflt-params-arg-val-undefined.js',
  'language/expressions/class/async-meth-dflt-params-ref-later.js',
  'language/expressions/class/async-meth-dflt-params-ref-prior.js',
  'language/expressions/class/async-meth-dflt-params-ref-self.js',
  'language/expressions/class/async-meth-dflt-params-trailing-comma.js',
  'language/expressions/class/async-meth-params-trailing-comma-multiple.js',
  'language/expressions/class/async-meth-params-trailing-comma-single.js',
  'language/expressions/class/async-meth-static-dflt-params-abrupt.js',
  'language/expressions/class/async-meth-static-dflt-params-arg-val-not-undefined.js',
  'language/expressions/class/async-meth-static-dflt-params-arg-val-undefined.js',
  'language/expressions/class/async-meth-static-dflt-params-ref-later.js',
  'language/expressions/class/async-meth-static-dflt-params-ref-prior.js',
  'language/expressions/class/async-meth-static-dflt-params-ref-self.js',
  'language/expressions/class/async-meth-static-dflt-params-trailing-comma.js',
  'language/expressions/class/async-meth-static-params-trailing-comma-multiple.js',
  'language/expressions/class/async-meth-static-params-trailing-comma-single.js',
  'language/expressions/object/method-definition/async-meth-dflt-params-abrupt.js',
  'language/expressions/object/method-definition/async-meth-dflt-params-arg-val-not-undefined.js',
  'language/expressions/object/method-definition/async-meth-dflt-params-arg-val-undefined.js',
  'language/expressions/object/method-definition/async-meth-dflt-params-ref-later.js',
  'language/expressions/object/method-definition/async-meth-dflt-params-ref-prior.js',
  'language/expressions/object/method-definition/async-meth-dflt-params-ref-self.js',
  'language/expressions/object/method-definition/async-meth-dflt-params-trailing-comma.js',
  'language/expressions/object/method-definition/async-meth-params-trailing-comma-multiple.js',
  'language/expressions/object/method-definition/async-meth-params-trailing-comma-single.js',
  'language/expressions/object/method-definition/async-super-call-body.js',
  'language/expressions/object/method-definition/async-super-call-param.js',
  'language/expressions/object/method-definition/object-method-returns-promise.js',
  'language/statements/class/async-meth-dflt-params-abrupt.js',
  'language/statements/class/async-meth-dflt-params-arg-val-not-undefined.js',
  'language/statements/class/async-meth-dflt-params-arg-val-undefined.js',
  'language/statements/class/async-meth-dflt-params-ref-later.js',
  'language/statements/class/async-meth-dflt-params-ref-prior.js',
  'language/statements/class/async-meth-dflt-params-ref-self.js',
  'language/statements/class/async-meth-dflt-params-trailing-comma.js',
  'language/statements/class/async-meth-params-trailing-comma-multiple.js',
  'language/statements/class/async-meth-params-trailing-comma-single.js',
  'language/statements/class/async-meth-static-dflt-params-abrupt.js',
  'language/statements/class/async-meth-static-dflt-params-arg-val-not-undefined.js',
  'language/statements/class/async-meth-static-dflt-params-arg-val-undefined.js',
  'language/statements/class/async-meth-static-dflt-params-ref-later.js',
  'language/statements/class/async-meth-static-dflt-params-ref-prior.js',
  'language/statements/class/async-meth-static-dflt-params-ref-self.js',
  'language/statements/class/async-meth-static-dflt-params-trailing-comma.js',
  'language/statements/class/async-meth-static-params-trailing-comma-multiple.js',
  'language/statements/class/async-meth-static-params-trailing-comma-single.js',
  'language/statements/class/definition/class-method-returns-promise.js',
  'language/statements/class/definition/methods-async-super-call-body.js',
  'language/statements/class/definition/methods-async-super-call-param.js',
];
