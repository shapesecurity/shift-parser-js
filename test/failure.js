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

let testParseFailure = require('./assertions').testParseFailure;
let testParseModuleFailure = require('./assertions').testParseModuleFailure;
let ErrorMessages = require('../dist/errors.js').ErrorMessages;

// TODO: make sense of this file
suite('Parser', () => {
  suite('syntax errors', () => {

    testParseFailure('/*', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('/*\r', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('/*\r\n', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('/*\u2028', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('/*\u2029', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('/**', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('\\', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('\\u', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('\\x', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, 'x');
    testParseFailure('\\o', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, 'o');
    testParseFailure('\\u1', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '1');
    testParseFailure('\\u12', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '1');
    testParseFailure('\\u113', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '1');
    testParseFailure('a\\uz   ', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, 'z');
    testParseFailure('a\\u1z  ', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '1');
    testParseFailure('a\\u11z ', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '1');
    testParseFailure('a\\u111z', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '1');
    testParseFailure('a\\', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('a\\u', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('a\\x', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, 'x');
    testParseFailure('a\\o', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, 'o');
    testParseFailure('a\\u1', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '1');
    testParseFailure('a\\u12', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '1');
    testParseFailure('a\\u113', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '1');
    testParseFailure('\\uD800', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('\\uD800x', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, 'x');
    testParseFailure('\\uD800\\', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '\\');
    testParseFailure('\\uD800\\u', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '\\');
    testParseFailure('\\uD800\\x62', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '\\');
    testParseFailure('\uD800', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('\uD800x', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('\uD800\\', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('\uD800\\u', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, 'u');
    testParseFailure('\uD800\\x62', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, 'x');
    testParseFailure('\'\\03', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('\'\\x', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('\'\\x1', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '1');
    testParseFailure('\'\\x1   ', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '1');
    testParseFailure('\'\\x12  ', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('\'\n', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '\n');
    testParseFailure('\'\\', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('＊', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '\uFF0A');
    testParseFailure('1.a', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, 'a');
    testParseFailure('1.e', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('1.e+', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('1.e+z', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, 'z');
    testParseFailure('/\\\n0', ErrorMessages.UNTERMINATED_REGEXP);
    testParseFailure('0x', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('0xz', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, 'z');
    testParseFailure('0x1z', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '1');
    testParseFailure('0a', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, 'a');
    testParseFailure('08a', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, 'a');
    testParseFailure('\u0008', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '\b');
    testParseFailure('{', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('}', ErrorMessages.UNEXPECTED_TOKEN, '}');
    testParseModuleFailure('}', ErrorMessages.UNEXPECTED_TOKEN, '}');
    testParseFailure('3ea', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, 'a');
    testParseFailure('3in []', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, 'i');
    testParseFailure('3e', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('3e+', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('3e-', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('3x', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, 'x');
    testParseFailure('3x0', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, 'x');
    testParseFailure('0x', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('01a', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, 'a');
    testParseFailure('3in[]', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, 'i');
    testParseFailure('0x3in[]', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '3'); // TODO: shouldn't this be "Unexpected \"i\""?
    testParseFailure('"Hello\nWorld"', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '\n');
    testParseFailure('x\\', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('x\\u005c', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('x\\u002a', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('a\\u', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('\\ua', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, 'a');
    testParseFailure('/', ErrorMessages.UNTERMINATED_REGEXP);
    testParseFailure('/test', ErrorMessages.UNTERMINATED_REGEXP);
    testParseFailure('/test\n/', ErrorMessages.UNTERMINATED_REGEXP);
    testParseFailure('for((1 + 1) in list) process(x);', ErrorMessages.INVALID_LHS_IN_FOR_IN);
    testParseFailure('[', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('[,', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('1 + {', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('1 + { t:t ', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('1 + { t:t,', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('var x = /\n/', ErrorMessages.UNTERMINATED_REGEXP);
    testParseFailure('var x = "\n', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '\n');
    testParseFailure('var if = 0', ErrorMessages.UNEXPECTED_TOKEN, 'if');
    testParseFailure('i #= 0', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '#');
    testParseFailure('1 + (', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('\n\n\n{', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('\n/* Some multiline\ncomment */\n)', ErrorMessages.UNEXPECTED_TOKEN, ')');
    testParseFailure('{ set 1 }', ErrorMessages.UNEXPECTED_NUMBER);
    testParseFailure('{ get 2 }', ErrorMessages.UNEXPECTED_NUMBER);
    testParseFailure('({ set: s(if) { } })', ErrorMessages.UNEXPECTED_TOKEN, 'if');
    testParseFailure('({ set s(.) { } })', ErrorMessages.UNEXPECTED_TOKEN, '.');
    testParseFailure('({ set s() { } })', ErrorMessages.UNEXPECTED_TOKEN, ')');
    testParseFailure('({ set: s() { } })', ErrorMessages.UNEXPECTED_TOKEN, '{');
    testParseFailure('({ set: s(a, b) { } })', ErrorMessages.UNEXPECTED_TOKEN, '{');
    testParseFailure('({ get: g(d) { } })', ErrorMessages.UNEXPECTED_TOKEN, '{');
    testParseFailure('function t(if) { }', ErrorMessages.UNEXPECTED_TOKEN, 'if');
    testParseFailure('function t(true) { }', ErrorMessages.UNEXPECTED_TOKEN, 'true');
    testParseFailure('function t(false) { }', ErrorMessages.UNEXPECTED_TOKEN, 'false');
    testParseFailure('function t(null) { }', ErrorMessages.UNEXPECTED_TOKEN, 'null');
    testParseFailure('function null() { }', ErrorMessages.UNEXPECTED_TOKEN, 'null');
    testParseFailure('function true() { }', ErrorMessages.UNEXPECTED_TOKEN, 'true');
    testParseFailure('function false() { }', ErrorMessages.UNEXPECTED_TOKEN, 'false');
    testParseFailure('function if() { }', ErrorMessages.UNEXPECTED_TOKEN, 'if');
    testParseFailure('a b;', ErrorMessages.UNEXPECTED_IDENTIFIER);
    testParseFailure('if.a;', ErrorMessages.UNEXPECTED_TOKEN, '.');
    testParseFailure('a if;', ErrorMessages.UNEXPECTED_TOKEN, 'if');
    testParseFailure('a class;', ErrorMessages.UNEXPECTED_TOKEN, 'class');
    testParseFailure('break 1;', ErrorMessages.UNEXPECTED_NUMBER);
    testParseFailure('continue 2;', ErrorMessages.UNEXPECTED_NUMBER);
    testParseFailure('throw', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('throw;', ErrorMessages.UNEXPECTED_TOKEN, ';');
    testParseFailure('throw\n', ErrorMessages.NEWLINE_AFTER_THROW);
    testParseFailure('for (var i, i2 in {});', ErrorMessages.UNEXPECTED_TOKEN, 'in');
    testParseFailure('for ((i in {}));', ErrorMessages.UNEXPECTED_TOKEN, ')');
    testParseFailure('for (i + 1 in {});', ErrorMessages.INVALID_LHS_IN_FOR_IN);
    testParseFailure('for (+i in {});', ErrorMessages.INVALID_LHS_IN_FOR_IN);
    testParseFailure('for (let [];;);', ErrorMessages.UNINITIALIZED_BINDINGPATTERN_IN_FOR_INIT);
    testParseFailure('for (let [a = 0];;);', ErrorMessages.UNINITIALIZED_BINDINGPATTERN_IN_FOR_INIT);
    testParseFailure('for (let a = 0, [];;);', ErrorMessages.UNINITIALIZED_BINDINGPATTERN_IN_FOR_INIT);
    testParseFailure('for (let [] = 0, [];;);', ErrorMessages.UNINITIALIZED_BINDINGPATTERN_IN_FOR_INIT);
    testParseFailure('for (let {};;);', ErrorMessages.UNINITIALIZED_BINDINGPATTERN_IN_FOR_INIT);
    testParseFailure('for (let {a = 0};;);', ErrorMessages.UNINITIALIZED_BINDINGPATTERN_IN_FOR_INIT);
    testParseFailure('for (let a = 0, {};;);', ErrorMessages.UNINITIALIZED_BINDINGPATTERN_IN_FOR_INIT);
    testParseFailure('for (let [] = 0, {};;);', ErrorMessages.UNINITIALIZED_BINDINGPATTERN_IN_FOR_INIT);
    testParseFailure('if(false)', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('if(false) doThis(); else', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('do', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('while(false)', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('for(;;)', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('with(x)', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('try { }', ErrorMessages.NO_CATCH_OR_FINALLY);
    testParseFailure('try {} catch (0) {} ', ErrorMessages.UNEXPECTED_NUMBER);
    testParseFailure('try {} catch (answer()) {} ', ErrorMessages.UNEXPECTED_TOKEN, '(');
    testParseFailure('try {} catch (-x) {} ', ErrorMessages.UNEXPECTED_TOKEN, '-');
    testParseFailure('\u203F = 10', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '\u203F');
    testParseFailure('switch (c) { default: default: }', ErrorMessages.MULTIPLE_DEFAULTS_IN_SWITCH);
    testParseFailure('new X()."s"', ErrorMessages.UNEXPECTED_STRING);
    testParseFailure('/*', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('/*\n\n\n', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('/**', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('/*\n\n*', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('/*hello', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('/*hello  *', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('\n]', ErrorMessages.UNEXPECTED_TOKEN, ']');
    testParseFailure('\r]', ErrorMessages.UNEXPECTED_TOKEN, ']');
    testParseFailure('\r\n]', ErrorMessages.UNEXPECTED_TOKEN, ']');
    testParseFailure('\n\r]', ErrorMessages.UNEXPECTED_TOKEN, ']');
    testParseFailure('//\r\n]', ErrorMessages.UNEXPECTED_TOKEN, ']');
    testParseFailure('//\n\r]', ErrorMessages.UNEXPECTED_TOKEN, ']');
    testParseFailure('/a\\\n/', ErrorMessages.UNTERMINATED_REGEXP);
    testParseFailure('//\r \n]', ErrorMessages.UNEXPECTED_TOKEN, ']');
    testParseFailure('/*\r\n*/]', ErrorMessages.UNEXPECTED_TOKEN, ']');
    testParseFailure('/*\n\r*/]', ErrorMessages.UNEXPECTED_TOKEN, ']');
    testParseFailure('/*\r \n*/]', ErrorMessages.UNEXPECTED_TOKEN, ']');
    testParseFailure('\\\\', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '\\');
    testParseFailure('\\u005c', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('\\x', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, 'x');
    testParseFailure('\\u0000', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('\u200C = []', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '\u200C');
    testParseFailure('\u200D = []', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '\u200D');
    testParseFailure('"\\', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('"\\u', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('try { } catch() {}', ErrorMessages.UNEXPECTED_TOKEN, ')');
    testParseFailure('do { x } *', ErrorMessages.UNEXPECTED_TOKEN, '*');
    testParseFailure('var', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('const', ErrorMessages.UNEXPECTED_TOKEN, 'const');
    testParseFailure('a b', ErrorMessages.UNEXPECTED_IDENTIFIER);
    testParseFailure('{ ;  ;  ', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('({get +:3})', ErrorMessages.UNEXPECTED_TOKEN, '+');
    testParseFailure('({get +:3})', ErrorMessages.UNEXPECTED_TOKEN, '+');
    testParseFailure('function t() { ;  ;  ', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('#=', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '#');
    testParseFailure('**', ErrorMessages.UNEXPECTED_TOKEN, '**');
    testParseFailure('({a = 0});', ErrorMessages.ILLEGAL_PROPERTY);
    testParseFailure('({a: 0, b = 0});', ErrorMessages.INVALID_LHS_IN_BINDING);
    testParseFailure('({a: b = 0, c = 0});', ErrorMessages.ILLEGAL_PROPERTY);
    testParseFailure('[{a = 0}];', ErrorMessages.ILLEGAL_PROPERTY);
    testParseFailure('[+{a = 0}];', ErrorMessages.ILLEGAL_PROPERTY);
    testParseFailure('function* f() { [yield {a = 0}]; }', ErrorMessages.ILLEGAL_PROPERTY);
    testParseFailure('function* f() { [yield* {a = 0}]; }', ErrorMessages.ILLEGAL_PROPERTY);
    testParseFailure('1 / %', ErrorMessages.UNEXPECTED_TOKEN, '%');
    testParseFailure('\\u{}', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '}');
    testParseFailure('"\\u{}"', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '}');
    testParseFailure('("\\u{}")', ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN, '}');
    testParseFailure('"use strict"; function f(){("\\1");}', ErrorMessages.UNEXPECTED_OCTAL_ESCAPE, '1');
    testParseFailure('"use strict"; function f(){01;}', ErrorMessages.UNEXPECTED_OCTAL);
    testParseFailure('/./a', ErrorMessages.INVALID_REGEXP_FLAG, 'a');
    testParseFailure('/./ii', ErrorMessages.DUPLICATE_REGEXP_FLAGS, 'i');
    testParseFailure('enum : 0', ErrorMessages.UNEXPECTED_TOKEN, 'enum');
  });
});
