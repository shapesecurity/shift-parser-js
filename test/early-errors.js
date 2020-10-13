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

let expect = require('expect.js');
let parse = require('../').default;
let parseWithLocation = require('../').parseScriptWithLocation;
let testParseFailure = require('./assertions').testParseFailure;
let testParseSuccess = require('./assertions').testParseSuccess;
let testEarlyError = require('./assertions').testEarlyError;
let testModuleEarlyError = require('./assertions').testModuleEarlyError;
let ErrorMessages = require('../src/errors.js').ErrorMessages;

suite('Parser', () => {
  suite('positive', () => {
    testParseSuccess('async function f(){ for await (let x of 0) { break; } }');
    testParseSuccess('async function f(){ for await (let x of 0) { continue; } }');
  });

  // these *would* be early errors, but we have no way to represent them in our AST
  suite('early grammar errors', () => {

    // 12.2.5.1
    // Always throw a Syntax Error if code matches this production.
    testParseFailure('({ a = 0 });', ErrorMessages.ILLEGAL_PROPERTY);

    // 12.2.9.1
    // It is a Syntax Error if the lexical token sequence matched by CoverParenthesizedExpressionAndArrowParameterList
    // cannot be parsed with no tokens left over using ParenthesizedExpression as the goal symbol.
    testParseFailure('(...a)', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('(a, ...b)', ErrorMessages.UNEXPECTED_EOS);
    // All Early Errors rules for ParenthesizedExpression and its derived productions also apply to
    // CoveredParenthesizedExpression of CoverParenthesizedExpressionAndArrowParameterList.
    testParseFailure('(((...a)))', 'Unexpected token ")"');
    testParseFailure('(((a, ...b)))', 'Unexpected token ")"');

    // 12.4.1
    // It is an early Reference Error if IsValidSimpleAssignmentTarget of LeftHandSideExpression is false.
    testParseFailure('0++', ErrorMessages.INVALID_UPDATE_OPERAND);
    testParseFailure('0--', ErrorMessages.INVALID_UPDATE_OPERAND);

    // 12.5.1
    // It is an early Reference Error if IsValidSimpleAssignmentTarget of UnaryExpression is false.
    testParseFailure('++0', ErrorMessages.INVALID_UPDATE_OPERAND);
    testParseFailure('--0', ErrorMessages.INVALID_UPDATE_OPERAND);

    // 12.14.1
    // It is a Syntax Error if LeftHandSideExpression is either an ObjectLiteral or an ArrayLiteral and the lexical
    // token sequence matched by LeftHandSideExpression cannot be parsed with no tokens left over using
    // AssignmentPattern as the goal symbol.
    testParseFailure('({a: 0} = 0);', ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
    testParseFailure('({get a(){}} = 0)', ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
    testParseFailure('({set a(b){}} = 0)', ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
    testParseFailure('({a(b){}} = 0)', ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
    testParseFailure('[0] = 0;', ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
    // It is an early Reference Error if LeftHandSideExpression is neither an ObjectLiteral nor an ArrayLiteral and
    // IsValidSimpleAssignmentTarget of LeftHandSideExpression is false.
    testParseFailure('0 = 0;', ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
    // It is an early Reference Error if IsValidSimpleAssignmentTarget of LeftHandSideExpression is false.
    testParseFailure('({a}) = 0;', ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
    testParseFailure('([a]) = 0;', ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
    testParseFailure('({a} += 0);', ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
    testParseFailure('[a] *= 0;', ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
    testParseFailure('0 /= 0;', ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);

    // 12.14.5.1
    // It is a Syntax Error if LeftHandSideExpression is either an ObjectLiteral or an ArrayLiteral and if the lexical
    // token sequence matched by LeftHandSideExpression cannot be parsed with no tokens left over using
    // AssignmentPattern as the goal symbol.
    testParseFailure('[...{a: 0}] = 0;', ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
    testParseFailure('[...[0]] = 0;', ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
    // It is a Syntax Error if LeftHandSideExpression is neither an ObjectLiteral nor an ArrayLiteral and
    // IsValidSimpleAssignmentTarget(LeftHandSideExpression) is false.
    testParseFailure('[...0] = 0;', ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
    testParseFailure('[...new a] = 0;', ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);

    // 13.6.4.1
    // It is a Syntax Error if LeftHandSideExpression is either an ObjectLiteral or an ArrayLiteral and if the
    // lexical token sequence matched by LeftHandSideExpression cannot be parsed with no tokens left over using
    // AssignmentPattern as the goal symbol.
    testParseFailure('for({a: 0} in 0);', ErrorMessages.INVALID_LHS_IN_FOR_IN);
    testParseFailure('for([0] in 0);', ErrorMessages.INVALID_LHS_IN_FOR_IN);
    testParseFailure('for({a: 0} of 0);', ErrorMessages.INVALID_LHS_IN_FOR_OF);
    testParseFailure('for([0] of 0);', ErrorMessages.INVALID_LHS_IN_FOR_OF);
    // It is a Syntax Error if IsValidSimpleAssignmentTarget of LeftHandSideExpression is false.
    testParseFailure('for(0 in 0);', ErrorMessages.INVALID_LHS_IN_FOR_IN);
    testParseFailure('for(0 of 0);', ErrorMessages.INVALID_LHS_IN_FOR_OF);
    // It is a Syntax Error if the LeftHandSideExpression is CoverParenthesizedExpressionAndArrowParameterList
    // : ( Expression ) and Expression derives a production that would produce a Syntax Error according to these
    // rules if that production is substituted for LeftHandSideExpression. This rule is recursively applied.
    testParseFailure('for(({a: 0}) in 0);', ErrorMessages.INVALID_LHS_IN_FOR_IN);
    testParseFailure('for(([0]) in 0);', ErrorMessages.INVALID_LHS_IN_FOR_IN);
    testParseFailure('for(({a: 0}) of 0);', ErrorMessages.INVALID_LHS_IN_FOR_OF);
    testParseFailure('for(([0]) of 0);', ErrorMessages.INVALID_LHS_IN_FOR_OF);
    testParseFailure('for((0) in 0);', ErrorMessages.INVALID_LHS_IN_FOR_IN);
    testParseFailure('for((0) of 0);', ErrorMessages.INVALID_LHS_IN_FOR_OF);

  });

  suite('early tokenisation errors', () => {

    // 11.6.1.1
    // It is a Syntax Error if SV(UnicodeEscapeSequence) is neither the UTF16Encoding (10.1.1) of a single Unicode code
    // point with the Unicode property “ID_Start” nor "$" or "_".
    testParseFailure('\\u0000', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('\\u{0}', ErrorMessages.UNEXPECTED_EOS);
    // It is a Syntax Error if SV(UnicodeEscapeSequence) is neither the UTF16Encoding (10.1.1) of a single Unicode code
    // point with the Unicode property “ID_Continue” nor "$" or "_" nor the UTF16Encoding of either <ZWNJ> or <ZWJ>.
    testParseFailure('a\\u0000', ErrorMessages.UNEXPECTED_EOS);
    testParseFailure('a\\u{0}', ErrorMessages.UNEXPECTED_EOS);

    // 11.8.4.1
    // It is a Syntax Error if the MV of HexDigits > 1114111.
    testParseFailure('("\\u{110000}")', 'Unexpected "{"');
    testParseFailure('("\\u{FFFFFFF}")', 'Unexpected "{"');

    // 11.8.5.1
    // It is a Syntax Error if IdentifierPart contains a Unicode escape sequence.
    testParseFailure('/./\\u0069', 'Invalid regular expression flags');
    testParseFailure('/./\\u{69}', 'Invalid regular expression flags');

  });

  suite('early errors', () => {
    // #sec-arrow-function-definitions-static-semantics-early-errors
    testEarlyError('async function a(){ (a = await (0)) => {}; }', 'Arrow parameters must not contain await expressions');

    // #sec-async-function-definitions-static-semantics-early-errors
    // It is a Syntax Error if UniqueFormalParameters Contains AwaitExpression is true
    testEarlyError('async function a(b = await (0)) {}', 'Async function parameters must not contain await expressions');
    testEarlyError('(async function(b = await (0)) {})', 'Async function parameters must not contain await expressions');
    testEarlyError('({ async a(b = await (0)) {} })', 'Async function parameters must not contain await expressions');

    // #sec-class-definitions-static-semantics-early-errors
    // It is a Syntax Error if PropName of MethodDefinition is "constructor" and SpecialMethod of MethodDefinition is true.
    testEarlyError('(class { async constructor(){} })', ErrorMessages.ILLEGAL_CONSTRUCTORS);

    // 12.1.1
    // It is a Syntax Error if the code matched by this production is contained in strict code and the StringValue of
    // Identifier is "arguments" or "eval".
    testEarlyError('\'use strict\'; arguments = 0', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('arguments'));
    testEarlyError('\'use strict\'; arguments *= 0', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('arguments'));

    testEarlyError('\'use strict\'; [eval] = 0', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('eval'));
    testEarlyError('\'use strict\'; [,,,eval,] = 0', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('eval'));
    testEarlyError('\'use strict\'; ({a: eval} = 0)', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('eval'));
    testEarlyError('\'use strict\'; ({a: eval = 0} = 0)', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('eval'));

    testEarlyError('\'use strict\'; [arguments] = 0', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('arguments'));
    testEarlyError('\'use strict\'; [,,,arguments,] = 0', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('arguments'));
    testEarlyError('\'use strict\'; ({a: arguments} = 0)', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('arguments'));
    testEarlyError('\'use strict\'; ({a: arguments = 0} = 0)',
      ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('arguments'));

    testEarlyError('\'use strict\'; var eval;', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('eval'));
    testEarlyError('\'use strict\'; var arguments;', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('arguments'));
    testEarlyError('\'use strict\'; let [eval] = 0;', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('eval'));
    testEarlyError('\'use strict\'; const {a: eval} = 0;', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('eval'));
    testModuleEarlyError('var eval;', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('eval'));

    testModuleEarlyError('eval=>0', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('eval'));
    testEarlyError('\'use strict\'; eval=>0', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('eval'));
    testEarlyError('\'use strict\'; arguments=>0', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('arguments'));
    testEarlyError('\'use strict\'; (eval)=>0', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('eval'));
    testEarlyError('\'use strict\'; (arguments)=>0', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('arguments'));

    testEarlyError('\'use strict\'; function f(eval){}', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('eval'));
    testEarlyError('function f(eval){ \'use strict\'; }', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('eval'));
    testEarlyError('\'use strict\'; !function (eval){}', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('eval'));
    testEarlyError('!function (eval){ \'use strict\'; }', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('eval'));
    testEarlyError('\'use strict\'; function* f(eval){}', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('eval'));
    testEarlyError('function* f(eval){ \'use strict\'; }', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('eval'));
    testEarlyError('\'use strict\'; !function* (eval){}', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('eval'));
    testEarlyError('!function* (eval){ \'use strict\'; }', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('eval'));
    testEarlyError('!{ f(eval){ \'use strict\'; } };', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('eval'));
    testEarlyError('!{ *f(eval){ \'use strict\'; } };', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('eval'));
    testEarlyError('\'use strict\'; !{ set f(eval){} };', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('eval'));
    testEarlyError('!{ set f(eval){ \'use strict\'; } };', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('eval'));
    testEarlyError('class A { f(eval){} };', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('eval'));
    testEarlyError('class A { *f(eval){} };', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('eval'));
    testEarlyError('class A { set f(eval){} };', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('eval'));
    testEarlyError('class A extends (eval = null) { };', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('eval'));
    testEarlyError('!class extends (eval = null) { };', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('eval'));
    // It is a Syntax Error if the code matched by this production is contained in strict code.
    testEarlyError('\'use strict\'; +yield;', ErrorMessages.INVALID_ID_IN_EXPRESSION_STRICT_MODE('yield'));
    testEarlyError('\'use strict\'; yield:;', ErrorMessages.INVALID_ID_IN_LABEL_STRICT_MODE('yield'));
    testEarlyError('\'use strict\'; var [yield] = 0;', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('yield'));
    // It is a Syntax Error if this phrase is contained in strict code and the StringValue of IdentifierName is:
    // "implements", "interface", "let", "package", "private", "protected", "public", "static", or "yield".
    testEarlyError('\'use strict\'; +implements;', ErrorMessages.INVALID_ID_IN_EXPRESSION_STRICT_MODE('implements'));
    testEarlyError('\'use strict\'; +interface;', ErrorMessages.INVALID_ID_IN_EXPRESSION_STRICT_MODE('interface'));
    testEarlyError('\'use strict\'; +let;', ErrorMessages.INVALID_ID_IN_EXPRESSION_STRICT_MODE('let'));
    testEarlyError('\'use strict\'; +package;', ErrorMessages.INVALID_ID_IN_EXPRESSION_STRICT_MODE('package'));
    testEarlyError('\'use strict\'; +private;', ErrorMessages.INVALID_ID_IN_EXPRESSION_STRICT_MODE('private'));
    testEarlyError('\'use strict\'; +protected;', ErrorMessages.INVALID_ID_IN_EXPRESSION_STRICT_MODE('protected'));
    testEarlyError('\'use strict\'; +public;', ErrorMessages.INVALID_ID_IN_EXPRESSION_STRICT_MODE('public'));
    testEarlyError('\'use strict\'; +static;', ErrorMessages.INVALID_ID_IN_EXPRESSION_STRICT_MODE('static'));
    testEarlyError('\'use strict\'; +yield;', ErrorMessages.INVALID_ID_IN_EXPRESSION_STRICT_MODE('yield'));
    testEarlyError('\'use strict\'; implements:0;', ErrorMessages.INVALID_ID_IN_LABEL_STRICT_MODE('implements'));
    testEarlyError('\'use strict\'; interface:0;', ErrorMessages.INVALID_ID_IN_LABEL_STRICT_MODE('interface'));
    testEarlyError('\'use strict\'; let:0;', ErrorMessages.INVALID_ID_IN_LABEL_STRICT_MODE('let'));
    testEarlyError('\'use strict\'; package:0;', ErrorMessages.INVALID_ID_IN_LABEL_STRICT_MODE('package'));
    testEarlyError('\'use strict\'; private:0;', ErrorMessages.INVALID_ID_IN_LABEL_STRICT_MODE('private'));
    testEarlyError('\'use strict\'; protected:0;', ErrorMessages.INVALID_ID_IN_LABEL_STRICT_MODE('protected'));
    testEarlyError('\'use strict\'; public:0;', ErrorMessages.INVALID_ID_IN_LABEL_STRICT_MODE('public'));
    testEarlyError('\'use strict\'; static:0;', ErrorMessages.INVALID_ID_IN_LABEL_STRICT_MODE('static'));
    testEarlyError('\'use strict\'; yield:0;', ErrorMessages.INVALID_ID_IN_LABEL_STRICT_MODE('yield'));
    testEarlyError('function a(yield){ \'use strict\'; }', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('yield'));
    testEarlyError('function a(){ \'use strict\'; function a(a=yield){}}',
      ErrorMessages.INVALID_ID_IN_EXPRESSION_STRICT_MODE('yield'));
    testEarlyError('function a(){ \'use strict\'; function a(yield){}}',
      ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('yield'));
    testEarlyError('\'use strict\'; function a([yield]){}', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('yield'));
    testEarlyError('\'use strict\'; function a({yield}){}', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('yield'));
    testEarlyError('\'use strict\'; function a({yield=0}){}', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('yield'));
    testEarlyError('\'use strict\'; function a({a:yield}){}', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('yield'));
    testEarlyError('\'use strict\'; function a([yield,...a]){}', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('yield'));
    testEarlyError('class A {set a(yield){}}', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('yield'));
    testEarlyError('package => {\'use strict\'}', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('package'));
    testEarlyError('(package) => {\'use strict\'}', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('package'));
    testEarlyError('\'use strict\'; ([let]) => {}', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('let'));
    testEarlyError('({a(yield){ \'use strict\'; }})', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('yield'));
    testEarlyError('!{ get a() { \'use strict\'; +let; } }', ErrorMessages.INVALID_ID_IN_EXPRESSION_STRICT_MODE('let'));
    testEarlyError('!{ set a(let) { \'use strict\'; } }', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('let'));
    testEarlyError('!{ a(let) { \'use strict\'; } }', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('let'));
    testEarlyError('!{ a(let) { \'use strict\'; } }', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('let'));

    testEarlyError('class let {}', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('let'));
    testEarlyError('class l\\u{65}t {}', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('let'));
    testEarlyError('class yield {}', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('yield'));
    testEarlyError('class yi\\u{65}ld {}', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('yield'));
    testEarlyError('(class let {})', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('let'));
    testEarlyError('(class l\\u{65}t {})', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('let'));
    testEarlyError('(class yield {})', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('yield'));
    testEarlyError('(class yi\\u{65}ld {})', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('yield'));
    // It is a Syntax Error if StringValue of IdentifierName is the same string value as the StringValue of any
    // ReservedWord except for yield.
    // TODO: these should fail but will not
    // testEarlyError("(i\\u006E)", "Unexpected token \"in\"");
    // testEarlyError("var i\\u006E;", "Unexpected token \"in\"");
    // testModuleEarlyError("import {a as i\\u006E} from \"module\";", "Unexpected token \"in\"");

    // 12.2.5.1
    // It is a Syntax Error if HasDirectSuper of MethodDefinition is true.
    testEarlyError('({ a(){ super(); } });', ErrorMessages.INVALID_CALL_TO_SUPER);
    testEarlyError('({ a(){ {{ if(0) (( super() )); }} } });', ErrorMessages.INVALID_CALL_TO_SUPER);
    testEarlyError('class A extends B { constructor() { !{constructor() { super(); }}; } }',
      ErrorMessages.INVALID_CALL_TO_SUPER);
    testEarlyError('class A extends B { constructor() { !{*constructor() { super(); }}; } }',
      ErrorMessages.INVALID_CALL_TO_SUPER);
    testEarlyError('class A extends B { constructor() { !{get constructor() { super(); }}; } }',
      ErrorMessages.INVALID_CALL_TO_SUPER);
    testEarlyError('class A extends B { constructor() { !{set constructor(a) { super(); }}; } }',
      ErrorMessages.INVALID_CALL_TO_SUPER);

    // 12.2.7.1
    // It is a Syntax Error if BodyText of RegularExpressionLiteral cannot be recognized using the goal symbol
    // Pattern of the ECMAScript RegExp grammar specified in 21.2.1.
    // TODO: re-enable the PatternAcceptor and these tests
    // testEarlyError("/?/", "Invalid regular expression pattern");
    // testEarlyError("/(/", "Invalid regular expression pattern");
    // testEarlyError("/(a/", "Invalid regular expression pattern");
    // testEarlyError("/\\1/", "Invalid regular expression pattern");
    // testEarlyError("/(()(?:\\3)(()))/", "Invalid regular expression pattern");
    // testEarlyError("/(\\01)/", "Invalid regular expression pattern");
    // testEarlyError("/((((((((((((.))))))))))))\\13/", "Invalid regular expression pattern");
    // testEarlyError("/}?/", "Invalid regular expression pattern");
    // testEarlyError("/{*/", "Invalid regular expression pattern");
    // testEarlyError("/(?=.)*/u", "Invalid regular expression pattern");

    // 12.5.4.1
    // It is a Syntax Error if the UnaryExpression is contained in strict code and the derived UnaryExpression is
    // PrimaryExpression : IdentifierReference.
    testEarlyError('\'use strict\'; delete a;', ErrorMessages.INVALID_DELETE_STRICT_MODE);
    // It is a Syntax Error if the derived UnaryExpression is PrimaryExpression :
    // CoverParenthesizedExpressionAndArrowParameterList and CoverParenthesizedExpressionAndArrowParameterList
    // ultimately derives a phrase that, if used in place of UnaryExpression, would produce a Syntax Error according
    // to these rules. This rule is recursively applied.
    testEarlyError('\'use strict\'; delete (a);', ErrorMessages.INVALID_DELETE_STRICT_MODE);
    testEarlyError('\'use strict\'; delete ((a));', ErrorMessages.INVALID_DELETE_STRICT_MODE);

    // 12.14.5.1
    // It is a Syntax Error if IsValidSimpleAssignmentTarget of IdentifierReference is false.
    testEarlyError('\'use strict\'; ({eval} = 0);', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('eval'));
    testEarlyError('\'use strict\'; ({eval = 0} = 0);', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('eval'));
    testEarlyError('\'use strict\'; ({arguments} = 0);', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('arguments'));
    testEarlyError('\'use strict\'; ({arguments = 0} = 0);', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('arguments'));

    // 13.2.1
    // It is a Syntax Error if the LexicallyDeclaredNames of StatementList contains any duplicate entries.
    testEarlyError('{ let a; let a; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('{ let a; const a = 0; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('{ const a = 0; let a; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('{ const a = 0; const a = 0; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('{ function a(){} function a(){} }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('{ function a(){} function* a(){} }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('{ let a; function a(){} }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('{ const a = 0; function a(){} }', ErrorMessages.DUPLICATE_BINDING('a'));
    // It is a Syntax Error if any element of the LexicallyDeclaredNames of StatementList also
    // occurs in the VarDeclaredNames of StatementList.
    testEarlyError('{ let a; var a; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('{ let a; { var a; } }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('{ var a; let a; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('{ const a = 0; var a; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('{ var a; const a = 0; }', ErrorMessages.DUPLICATE_BINDING('a'));

    // 13.3.1.1
    // It is a Syntax Error if the BoundNames of BindingList contains "let".
    testEarlyError('let let;', ErrorMessages.ILLEGAL_ID_IN_LEXICAL_DECLARATION('let'));
    testEarlyError('let a, let;', ErrorMessages.ILLEGAL_ID_IN_LEXICAL_DECLARATION('let'));
    testEarlyError('let a, let = 0;', ErrorMessages.ILLEGAL_ID_IN_LEXICAL_DECLARATION('let'));
    testEarlyError('for(let let;;);', ErrorMessages.ILLEGAL_ID_IN_LEXICAL_DECLARATION('let'));
    testEarlyError('for(let a, let;;);', ErrorMessages.ILLEGAL_ID_IN_LEXICAL_DECLARATION('let'));
    testEarlyError('for(const let = 0;;);', ErrorMessages.ILLEGAL_ID_IN_LEXICAL_DECLARATION('let'));
    testEarlyError('for(const a = 0, let = 1;;);', ErrorMessages.ILLEGAL_ID_IN_LEXICAL_DECLARATION('let'));
    testEarlyError('for(let [let] = 0;;);', ErrorMessages.ILLEGAL_ID_IN_LEXICAL_DECLARATION('let'));
    // It is a Syntax Error if the BoundNames of BindingList contains any duplicate entries.
    testEarlyError('let a, a;', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('let a, b, a;', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('let a = 0, a = 1;', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('const a = 0, a = 1;', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('const a = 0, b = 1, a = 2;', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('let a, [a] = 0;', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('let [a, a] = 0;', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('let {a: b, c: b} = 0;', 'Duplicate binding "b"');
    testEarlyError('let [a, ...a] = 0;', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('let \\u{61}, \\u{0061};', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('let \\u0061, \\u{0061};', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('let x\\u{61}, x\\u{0061};', 'Duplicate binding "xa"');
    testEarlyError('let x\\u{E01D5}, x\uDB40\uDDD5;', 'Duplicate binding "x\uDB40\uDDD5"');
    testEarlyError('for(let a, a;;);', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('for(let [a, a] = 0;;);', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('for(const a = 0, a = 1;;);', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('for(const [a, a] = 0;;);', ErrorMessages.DUPLICATE_BINDING('a'));
    // It is a Syntax Error if Initializer is not present and IsConstantDeclaration of the LexicalDeclaration
    // containing this production is true.
    testEarlyError('const a;', ErrorMessages.UNITIALIZED_CONST);
    testEarlyError('const a, b = 0;', ErrorMessages.UNITIALIZED_CONST);
    testEarlyError('const a = 0, b;', ErrorMessages.UNITIALIZED_CONST);
    testEarlyError('{ const a; }', ErrorMessages.UNITIALIZED_CONST);
    testEarlyError('function f(){ const a; }', ErrorMessages.UNITIALIZED_CONST);
    testEarlyError('for(const a;;);', ErrorMessages.UNITIALIZED_CONST);
    testEarlyError('for(const a = 0, b;;);', ErrorMessages.UNITIALIZED_CONST);

    // 13.6.1
    // It is a Syntax Error if IsLabelledFunction(Statement) is true for any occurrence of Statement in these rules.
    testEarlyError('if(0) label: function f(){}', ErrorMessages.ILLEGEAL_LABEL_IN_IF);
    testEarlyError('if(0) labelA: labelB: function f(){}', ErrorMessages.ILLEGEAL_LABEL_IN_IF);
    testEarlyError('if(0) label: function f(){} else ;', ErrorMessages.ILLEGEAL_LABEL_IN_IF);
    testEarlyError('if(0) ; else label: function f(){}', ErrorMessages.ILLEGAL_LABEL_IN_ELSE);

    // 13.7.1.1
    // It is a Syntax Error if IsLabelledFunction(Statement) is true for any occurrence of Statement in these rules.
    testEarlyError('do label: function f(){} while (0)', ErrorMessages.ILLEGAL_LABEL_IN_BODY('do-while'));
    testEarlyError('do label: function f(){} while (0);', ErrorMessages.ILLEGAL_LABEL_IN_BODY('do-while'));
    testEarlyError('while(0) label: function f(){}', ErrorMessages.ILLEGAL_LABEL_IN_BODY('while'));
    testEarlyError('for(;;) label: function f(){}', ErrorMessages.ILLEGAL_LABEL_IN_BODY('for'));
    testEarlyError('for(var a;;) label: function f(){}', ErrorMessages.ILLEGAL_LABEL_IN_BODY('for'));
    testEarlyError('for(const a = 0;;) label: function f(){}', ErrorMessages.ILLEGAL_LABEL_IN_BODY('for'));
    testEarlyError('for(let a;;) label: function f(){}', ErrorMessages.ILLEGAL_LABEL_IN_BODY('for'));
    testEarlyError('for(a in b) label: function f(){}', ErrorMessages.ILLEGAL_LABEL_IN_BODY('for-in'));
    testEarlyError('for(var a in b) label: function f(){}', ErrorMessages.ILLEGAL_LABEL_IN_BODY('for-in'));
    testEarlyError('for(let a in b) label: function f(){}', ErrorMessages.ILLEGAL_LABEL_IN_BODY('for-in'));
    testEarlyError('for(const a in b) label: function f(){}', ErrorMessages.ILLEGAL_LABEL_IN_BODY('for-in'));
    testEarlyError('for(a of b) label: function f(){}', ErrorMessages.ILLEGAL_LABEL_IN_BODY('for-of'));
    testEarlyError('for(var a of b) label: function f(){}', ErrorMessages.ILLEGAL_LABEL_IN_BODY('for-of'));
    testEarlyError('for(let a of b) label: function f(){}', ErrorMessages.ILLEGAL_LABEL_IN_BODY('for-of'));
    testEarlyError('for(const a of b) label: function f(){}', ErrorMessages.ILLEGAL_LABEL_IN_BODY('for-of'));
    testEarlyError('for(;;) labelA: labelB: labelC: function f(){}', ErrorMessages.ILLEGAL_LABEL_IN_BODY('for'));
    testEarlyError('async function f(){ for await(a of b) label: function f(){} }', ErrorMessages.ILLEGAL_LABEL_IN_BODY('for-await'));
    testEarlyError('async function f(){ for await(var a of b) label: function f(){} }', ErrorMessages.ILLEGAL_LABEL_IN_BODY('for-await'));
    testEarlyError('async function f(){ for await(let a of b) label: function f(){} }', ErrorMessages.ILLEGAL_LABEL_IN_BODY('for-await'));
    testEarlyError('async function f(){ for await(const a of b) label: function f(){} }', ErrorMessages.ILLEGAL_LABEL_IN_BODY('for-await'));

    // 13.7.4.1
    // It is a Syntax Error if any element of the BoundNames of LexicalDeclaration
    // also occurs in the VarDeclaredNames of Statement.
    testEarlyError('for(let a;;) { var a; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('for(const a = 0;;) { var a; }', ErrorMessages.DUPLICATE_BINDING('a'));

    // 13.7.5.1
    // It is a Syntax Error if the BoundNames of ForDeclaration contains "let".
    testEarlyError('for(let let in 0);', ErrorMessages.ILLEGAL_ID_IN_LEXICAL_DECLARATION('let'));
    testEarlyError('for(const let in 0);', ErrorMessages.ILLEGAL_ID_IN_LEXICAL_DECLARATION('let'));
    testEarlyError('for(let let of 0);', ErrorMessages.ILLEGAL_ID_IN_LEXICAL_DECLARATION('let'));
    testEarlyError('for(const let of 0);', ErrorMessages.ILLEGAL_ID_IN_LEXICAL_DECLARATION('let'));
    // It is a Syntax Error if any element of the BoundNames of ForDeclaration also occurs in
    // the VarDeclaredNames of Statement.
    testEarlyError('for(let a in 0) { var a; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('for(const a in 0) { var a; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('for(let a of 0) { var a; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('for(const a of 0) { var a; }', ErrorMessages.DUPLICATE_BINDING('a'));
    // It is a Syntax Error if the BoundNames of ForDeclaration contains any duplicate entries.
    testEarlyError('for(let {a, a} in 0);', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('for(const {a, a} in 0);', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('for(let {a, a} of 0);', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('for(const {a, a} of 0);', ErrorMessages.DUPLICATE_BINDING('a'));

    // 13.8.1
    // It is a Syntax Error if this production is not nested, directly or indirectly
    // (but not crossing function boundaries), within an IterationStatement.
    testEarlyError('continue;', ErrorMessages.ILLEGAL_CONTINUE_WITHOUT_ITERATION);
    testModuleEarlyError('continue;', ErrorMessages.ILLEGAL_CONTINUE_WITHOUT_ITERATION);
    testEarlyError('{ continue; }', ErrorMessages.ILLEGAL_CONTINUE_WITHOUT_ITERATION);
    testEarlyError('if(0) continue;', ErrorMessages.ILLEGAL_CONTINUE_WITHOUT_ITERATION);
    testEarlyError('while(0) !function(){ continue; };', ErrorMessages.ILLEGAL_CONTINUE_WITHOUT_ITERATION);
    testEarlyError('while(0) { function f(){ continue; } }', ErrorMessages.ILLEGAL_CONTINUE_WITHOUT_ITERATION);
    testEarlyError('label: continue label;', ErrorMessages.ILLEGAL_CONTINUE_WITHOUT_ITERATION_WITH_ID('label'));
    testEarlyError('label: { continue label; }', ErrorMessages.ILLEGAL_CONTINUE_WITHOUT_ITERATION_WITH_ID('label'));
    testEarlyError('label: if(0) continue label;', ErrorMessages.ILLEGAL_CONTINUE_WITHOUT_ITERATION_WITH_ID('label'));
    testEarlyError('label: while(0) !function(){ continue label; };',
      ErrorMessages.ILLEGAL_CONTINUE_WITHOUT_ITERATION_WITH_ID('label'));
    testEarlyError('label: while(0) { function f(){ continue label; } }',
      ErrorMessages.ILLEGAL_CONTINUE_WITHOUT_ITERATION_WITH_ID('label'));

    // 13.9.1
    // It is a Syntax Error if this production is not nested, directly or indirectly
    // (but not crossing function boundaries), within an IterationStatement or a SwitchStatement.
    testEarlyError('break;', ErrorMessages.ILLEGAL_BREAK_WITHOUT_ITERATION_OR_SWITCH);
    testModuleEarlyError('break;', ErrorMessages.ILLEGAL_BREAK_WITHOUT_ITERATION_OR_SWITCH);
    testEarlyError('{ break; }', ErrorMessages.ILLEGAL_BREAK_WITHOUT_ITERATION_OR_SWITCH);
    testEarlyError('if(0) break;', ErrorMessages.ILLEGAL_BREAK_WITHOUT_ITERATION_OR_SWITCH);
    testEarlyError('while(0) !function(){ break; };',
      ErrorMessages.ILLEGAL_BREAK_WITHOUT_ITERATION_OR_SWITCH);
    testEarlyError('while(0) { function f(){ break; } }',
      ErrorMessages.ILLEGAL_BREAK_WITHOUT_ITERATION_OR_SWITCH);
    testEarlyError('switch(0) { case 0: !function(){ break; }; }',
      ErrorMessages.ILLEGAL_BREAK_WITHOUT_ITERATION_OR_SWITCH);
    testEarlyError('switch(0) { case 0: function f(){ break; } }',
      ErrorMessages.ILLEGAL_BREAK_WITHOUT_ITERATION_OR_SWITCH);
    testEarlyError('switch(0) { default: !function(){ break; }; }',
      ErrorMessages.ILLEGAL_BREAK_WITHOUT_ITERATION_OR_SWITCH);
    testEarlyError('switch(0) { default: function f(){ break; } }',
      ErrorMessages.ILLEGAL_BREAK_WITHOUT_ITERATION_OR_SWITCH);

    // 13.11.1
    // It is a Syntax Error if the code that matches this production is contained in strict code.
    testEarlyError('\'use strict\'; with(0);', ErrorMessages.ILLEGAL_WITH_STRICT_MODE);
    // It is a Syntax Error if IsLabelledFunction(Statement) is true.
    testEarlyError('with(0) label: function f(){}', ErrorMessages.ILLEGAL_LABEL_IN_BODY('with'));

    // 13.12.1
    // It is a Syntax Error if the LexicallyDeclaredNames of CaseClauses contains any duplicate entries.
    testEarlyError('switch(0) { case 0: let a; case 1: let a; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('switch(0) { case 0: let a; case 1: function a(){} }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('switch(0) { case 0: let a; default: let a; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('switch(0) { default: let a; case 0: let a; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('switch(0) { default: let a; case 0: function a(){} }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('switch(0) { default: function a(){} case 0: let a  }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('switch(0) { default: function a(){} case 0: let a  }', ErrorMessages.DUPLICATE_BINDING('a'));
    // It is a Syntax Error if any element of the LexicallyDeclaredNames of CaseClauses also occurs in the
    // VarDeclaredNames of CaseClauses.
    testEarlyError('switch(0) { case 0: let a; case 1: var a; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('switch(0) { case 0: var a; case 1: let a; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('switch(0) { case 0: let a; default: var a; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('switch(0) { case 0: var a; default: let a; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('switch(0) { default: let a; case 0: var a; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('switch(0) { default: var a; case 0: let a; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('switch(0) { case 0: const a = 0; case 1: var a; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('switch(0) { case 0: var a; case 1: const a = 0; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('switch(0) { case 0: const a = 0; default: var a; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('switch(0) { case 0: var a; default: const a = 0; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('switch(0) { default: const a = 0; case 0: var a; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('switch(0) { default: var a; case 0: const a = 0; }', ErrorMessages.DUPLICATE_BINDING('a'));

    // 13.13.1
    // It is a Syntax Error if any source text matches this rule.
    //  (see Annex B 3.2)

    // 13.15.1
    // It is a Syntax Error if BoundNames of CatchParameter contains any duplicate elements.
    testEarlyError('try {} catch ([e, e]) {}', ErrorMessages.DUPLICATE_BINDING('e'));
    testEarlyError('try {} catch ({e, e}) {}', ErrorMessages.DUPLICATE_BINDING('e'));
    testEarlyError('try {} catch ({a: e, b: e}) {}', ErrorMessages.DUPLICATE_BINDING('e'));
    testEarlyError('try {} catch ({e = 0, a: e}) {}', ErrorMessages.DUPLICATE_BINDING('e'));
    // It is a Syntax Error if any element of the BoundNames of CatchParameter also occurs in the
    // LexicallyDeclaredNames of Block.
    //  (see Annex B 3.5)
    // It is a Syntax Error if any element of the BoundNames of CatchParameter also occurs in the
    // VarDeclaredNames of Block.
    //  (see Annex B 3.5)

    // 14.1.2
    // If the source code matching this production is strict code, the Early Error rules for
    //  StrictFormalParameters : FormalParameters are applied.
    testEarlyError('\'use strict\'; function f(a, a){}', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('\'use strict\'; function f([a, a]){}', ErrorMessages.DUPLICATE_BINDING('a'));
    testModuleEarlyError('export default function(a, a){}', ErrorMessages.DUPLICATE_BINDING('a'));
    testModuleEarlyError('export default function([a, a]){}', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('\'use strict\'; !function(a, a){}', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('\'use strict\'; !function([a, a]){}', ErrorMessages.DUPLICATE_BINDING('a'));
    // If the source code matching this production is strict code, it is a Syntax Error if
    // BindingIdentifier is the IdentifierName eval or the IdentifierName arguments.
    testEarlyError('\'use strict\'; function eval(){}', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('eval'));
    testEarlyError('\'use strict\'; function arguments(){}', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('arguments'));
    testEarlyError('\'use strict\'; !function eval(){}', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('eval'));
    testEarlyError('\'use strict\'; !function arguments(){}',
      ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('arguments'));
    // It is a Syntax Error if any element of the BoundNames of FormalParameters also occurs
    // in the LexicallyDeclaredNames of FunctionBody.
    testEarlyError('function f(a){ let a; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('function f(a){ const a = 0; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testModuleEarlyError('export default function(a){ let a; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testModuleEarlyError('export default function(a){ const a = 0; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('!function(a){ let a; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('!function(a){ const a = 0; }', ErrorMessages.DUPLICATE_BINDING('a'));
    // It is a Syntax Error if FormalParameters Contains SuperProperty is true.
    testEarlyError('function f(a = super.b){}', ErrorMessages.ILLEGAL_ACCESS_SUPER_MEMBER);
    testEarlyError('!function f(a = super[0]){}', ErrorMessages.ILLEGAL_ACCESS_SUPER_MEMBER);
    testModuleEarlyError('export default function(a = super.b){}', ErrorMessages.ILLEGAL_ACCESS_SUPER_MEMBER);
    testEarlyError('!function(a = super.b){}', ErrorMessages.ILLEGAL_ACCESS_SUPER_MEMBER);
    testEarlyError('!{ a() { function f(a = super.b()){} } };', ErrorMessages.ILLEGAL_ACCESS_SUPER_MEMBER);
    testEarlyError('!{ a() { !function(a = super.b()){} } };', ErrorMessages.ILLEGAL_ACCESS_SUPER_MEMBER);
    testEarlyError('class A extends B { a() { function f(a = super.b()){} } }',
      ErrorMessages.ILLEGAL_ACCESS_SUPER_MEMBER);
    testEarlyError('class A extends B { a() { !function(a = super.b()){} } }',
      ErrorMessages.ILLEGAL_ACCESS_SUPER_MEMBER);
    // It is a Syntax Error if FunctionBody Contains SuperProperty is true.
    testEarlyError('function f(a){ super.b }', ErrorMessages.ILLEGAL_ACCESS_SUPER_MEMBER);
    testEarlyError('!function f(a){ super[0] }', ErrorMessages.ILLEGAL_ACCESS_SUPER_MEMBER);
    testModuleEarlyError('export default function(a){ super.b }', ErrorMessages.ILLEGAL_ACCESS_SUPER_MEMBER);
    testEarlyError('!function(a){ super.b }', ErrorMessages.ILLEGAL_ACCESS_SUPER_MEMBER);
    testEarlyError('!{ a() { function f(){ super.b(); } } };', ErrorMessages.ILLEGAL_ACCESS_SUPER_MEMBER);
    testEarlyError('!{ a() { !function(){ super.b(); } } };', ErrorMessages.ILLEGAL_ACCESS_SUPER_MEMBER);
    testEarlyError('class A extends B { a() { function f(){ super.b(); } } }',
      ErrorMessages.ILLEGAL_ACCESS_SUPER_MEMBER);
    testEarlyError('class A extends B { a() { !function(){ super.b(); } } }',
      ErrorMessages.ILLEGAL_ACCESS_SUPER_MEMBER);
    // It is a Syntax Error if FormalParameters Contains SuperCall is true.
    testEarlyError('function f(a = super()){}', ErrorMessages.INVALID_CALL_TO_SUPER);
    testModuleEarlyError('export default function(a = super()){}', ErrorMessages.INVALID_CALL_TO_SUPER);
    testEarlyError('!function(a = super()){}', ErrorMessages.INVALID_CALL_TO_SUPER);
    testEarlyError('class A extends B { constructor() { function f(a = super()){} } }',
      ErrorMessages.INVALID_CALL_TO_SUPER);
    testEarlyError('class A extends B { constructor() { !function(a = super()){} } }',
      ErrorMessages.INVALID_CALL_TO_SUPER);
    // It is a Syntax Error if FunctionBody Contains SuperCall is true.
    testEarlyError('function f(a){ super() }', ErrorMessages.INVALID_CALL_TO_SUPER);
    testModuleEarlyError('export default function(a){ super() }', ErrorMessages.INVALID_CALL_TO_SUPER);
    testEarlyError('!function(a){ super() }', ErrorMessages.INVALID_CALL_TO_SUPER);
    testEarlyError('class A extends B { constructor() { function f(){ super(); } } }',
      ErrorMessages.INVALID_CALL_TO_SUPER);
    testEarlyError('class A extends B { constructor() { !function(){ super(); } } }',
      ErrorMessages.INVALID_CALL_TO_SUPER);
    // It is a Syntax Error if BoundNames of FormalParameters contains any duplicate elements.
    testEarlyError('!{ f(a, a){} };', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('!{ f([a, a]){} };', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('!{ f({a, a}){} };', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('!{ *g(a, a){} };', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('!{ *g([a, a]){} };', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('!{ *g({a, a}){} };', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('class A { static f(a, a){} }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('class A { static f([a, a]){} }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('class A { static f({a, a}){} }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('(a, a) => 0;', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('([a, a]) => 0;', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('({a, a}) => 0;', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('(a,...a)=>0', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('([a],...a)=>0', ErrorMessages.DUPLICATE_BINDING('a'));
    // It is a Syntax Error if IsSimpleParameterList of FormalParameterList is false and
    // BoundNames of FormalParameterList contains any duplicate elements.
    testEarlyError('function f(a, [a]){}', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('(function([a, a]){})', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('(function({a: x, b: x}){})', 'Duplicate binding "x"');
    testEarlyError('(function({a: x}, {b: x}){})', 'Duplicate binding "x"');
    // It is a Syntax Error if the LexicallyDeclaredNames of FunctionStatementList contains any duplicate entries.
    testEarlyError('function f(){ let a; let a; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('function f(){ let a; const a = 0; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('function f(){ const a = 0; let a; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('function f(){ const a = 0; const a = 0; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('!function f(){ let a; let a; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('!{ f(){ let a; let a; } };', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('!{ *g(){ let a; let a; } };', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('!{ get f(){ let a; let a; } };', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('!{ set f(b){ let a; let a; } };', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('class A { static f(){ let a; let a; } }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('() => { let a; let a; }', ErrorMessages.DUPLICATE_BINDING('a'));
    // It is a Syntax Error if any element of the LexicallyDeclaredNames of FunctionStatementList
    // also occurs in the VarDeclaredNames of FunctionStatementList.
    testEarlyError('function f(){ let a; var a; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('function f(){ var a; let a; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('function f(){ const a = 0; var a; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('function f(){ var a; const a = 0; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('!function f(){ let a; var a; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('!{ f(){ let a; var a; } };', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('!{ *g(){ let a; var a; } };', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('!{ get f(){ let a; var a; } };', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('!{ set f(b){ let a; var a; } };', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('class A { static f(){ let a; var a; } }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('() => { let a; var a; }', ErrorMessages.DUPLICATE_BINDING('a'));
    // It is a Syntax Error if ContainsDuplicateLabels of FunctionStatementList with argument « » is true.
    testEarlyError('function f(){ label: label: ; }', ErrorMessages.DUPLICATE_LABEL_DECLARATION('label'));
    testEarlyError('function f(){ label: { label: ; } }', ErrorMessages.DUPLICATE_LABEL_DECLARATION('label'));
    testEarlyError('function f(){ label: if(0) label: ; }', ErrorMessages.DUPLICATE_LABEL_DECLARATION('label'));
    // It is a Syntax Error if ContainsUndefinedBreakTarget of FunctionStatementList with argument « » is true.
    testEarlyError('function f(){ break label; }', ErrorMessages.ILLEGAL_BREAK_WITHIN_LABEL('label'));
    testEarlyError('function f(){ labelA: break labelB; }',
      ErrorMessages.ILLEGAL_BREAK_WITHIN_LABEL('labelB'));
    // It is a Syntax Error if ContainsUndefinedContinueTarget of FunctionStatementList
    // with arguments « » and « » is true.
    testEarlyError('function f(){ while(0) continue label; }',
      ErrorMessages.ILLEGAL_CONTINUE_WITHOUT_ITERATION_WITH_ID('label'));
    testEarlyError('function f(){ labelA: while(0) continue labelB; }',
      ErrorMessages.ILLEGAL_CONTINUE_WITHOUT_ITERATION_WITH_ID('labelB'));

    // 14.2.1
    // It is a Syntax Error if ArrowParameters Contains YieldExpression is true.
    testEarlyError('function* g(){ (a = yield) => 0; }', ErrorMessages.ILLEGAL_YIELD_EXPRESSIONS('Arrow'));
    testEarlyError('function* g(){ (a = yield b) => 0; }', ErrorMessages.ILLEGAL_YIELD_EXPRESSIONS('Arrow'));
    testEarlyError('function* g(){ (a = yield* b) => 0; }', ErrorMessages.ILLEGAL_YIELD_EXPRESSIONS('Arrow'));
    testEarlyError('function* g(){ (a = x + f(yield)) => 0; }', ErrorMessages.ILLEGAL_YIELD_EXPRESSIONS('Arrow'));
    testEarlyError('function* g(){ ({[yield]: a}) => 0; }', ErrorMessages.ILLEGAL_YIELD_EXPRESSIONS('Arrow'));
    testEarlyError('function* g(){ ({a = yield}) => 0; }', ErrorMessages.ILLEGAL_YIELD_EXPRESSIONS('Arrow'));
    testEarlyError('function* g(){ ([a = yield]) => 0; }', ErrorMessages.ILLEGAL_YIELD_EXPRESSIONS('Arrow'));
    // TODO: testEarlyError("function* g(){ (...{a = yield}) => 0; }",
    // "Arrow parameters must not contain yield expressions");
    // It is a Syntax Error if any element of the BoundNames of ArrowParameters
    // also occurs in the LexicallyDeclaredNames of ConciseBody.
    testEarlyError('(a) => { let a; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('([a]) => { let a; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('({a}) => { let a; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('(a) => { const a = 0; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('([a]) => { const a = 0; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('({a}) => { const a = 0; }', ErrorMessages.DUPLICATE_BINDING('a'));
    // If the [Yield] grammar parameter is present on ArrowParameters, it is a Syntax Error if the lexical
    // token sequence matched by CoverParenthesizedExpressionAndArrowParameterList[?Yield] cannot be parsed
    // with no tokens left over using ArrowFormalParameters[Yield, GeneratorParameter] as the goal symbol.
    // TODO
    // If the [Yield] grammar parameter is not present on ArrowParameters, it is a Syntax Error if the
    // lexical token sequence matched by CoverParenthesizedExpressionAndArrowParameterList[?Yield] cannot be
    // parsed with no tokens left over using ArrowFormalParameters as the goal symbol.
    // TODO
    // All early errors rules for ArrowFormalParameters and its derived productions also apply to
    // CoveredFormalsList of CoverParenthesizedExpressionAndArrowParameterList[?Yield].
    // TODO

    // 14.3.1
    // It is a Syntax Error if any element of the BoundNames of StrictFormalParameters also occurs in the
    // LexicallyDeclaredNames of FunctionBody.
    testEarlyError('!{ f(a) { let a; } };', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('!{ f([a]){ let a; } };', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('!{ f({a}){ let a; } };', ErrorMessages.DUPLICATE_BINDING('a'));
    // It is a Syntax Error if BoundNames of PropertySetParameterList contains any duplicate elements.
    testEarlyError('!{ set f({a, a}){} };', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('!{ set f([a, a]){} };', ErrorMessages.DUPLICATE_BINDING('a'));
    // It is a Syntax Error if any element of the BoundNames of PropertySetParameterList also occurs in
    // the LexicallyDeclaredNames of FunctionBody.
    testEarlyError('!{ set f(a) { let a; } };', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('!{ set f([a]){ let a; } };', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('!{ set f({a}){ let a; } };', ErrorMessages.DUPLICATE_BINDING('a'));

    // 14.4.1
    // It is a Syntax Error if HasDirectSuper of GeneratorMethod is true .
    testEarlyError('!{ *f(a = super()){} };', ErrorMessages.INVALID_CALL_TO_SUPER);
    testEarlyError('!{ *f(a) { super() } };', ErrorMessages.INVALID_CALL_TO_SUPER);
    // It is a Syntax Error if StrictFormalParameters Contains YieldExpression is true.
    testEarlyError('function* g(){ ({ *m(a = yield){} }); }', ErrorMessages.ILLEGAL_YIELD_EXPRESSIONS('Generator'));
    testEarlyError('function* g(){ ({ *m(a = yield b){} }); }', ErrorMessages.ILLEGAL_YIELD_EXPRESSIONS('Generator'));
    testEarlyError('function* g(){ ({ *m(a = yield* b){} }); }', ErrorMessages.ILLEGAL_YIELD_EXPRESSIONS('Generator'));
    testEarlyError('function* g(){ ({ *m(a = x + f(yield)){} }); }',
      ErrorMessages.ILLEGAL_YIELD_EXPRESSIONS('Generator'));
    testEarlyError('function* g(){ ({ *m({[yield]: a}){} }); }', ErrorMessages.ILLEGAL_YIELD_EXPRESSIONS('Generator'));
    testEarlyError('function* g(){ ({ *m({a = yield}){} }); }', ErrorMessages.ILLEGAL_YIELD_EXPRESSIONS('Generator'));
    testEarlyError('function* g(){ ({ *m([a = yield]){} }); }', ErrorMessages.ILLEGAL_YIELD_EXPRESSIONS('Generator'));
    // TODO: testEarlyError("function* g(){ ({ *m(...{a = yield}){} }); }",
    // "Generator parameters must not contain yield expressions");
    // It is a Syntax Error if any element of the BoundNames of StrictFormalParameters also occurs
    // in the LexicallyDeclaredNames of GeneratorBody.
    testEarlyError('!{ *f(a) { let a; } };', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('!{ *f([a]){ let a; } };', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('!{ *f({a}){ let a; } };', ErrorMessages.DUPLICATE_BINDING('a'));
    // It is a Syntax Error if HasDirectSuper of GeneratorDeclaration is true .
    testEarlyError('function* f(a = super()){}', ErrorMessages.INVALID_CALL_TO_SUPER);
    testEarlyError('function* f(a){ super() }', ErrorMessages.INVALID_CALL_TO_SUPER);
    testEarlyError('class A extends B { constructor() { function* f(){ super(); } } }',
      ErrorMessages.INVALID_CALL_TO_SUPER);
    // It is a Syntax Error if HasDirectSuper of GeneratorExpression is true .
    testEarlyError('!function* f(a = super()){}', ErrorMessages.INVALID_CALL_TO_SUPER);
    testEarlyError('!function* f(a) { super() }', ErrorMessages.INVALID_CALL_TO_SUPER);
    // If the source code matching this production is strict code, the Early Error rules for
    // StrictFormalParameters : FormalParameters are applied.
    testEarlyError('\'use strict\'; function* f(a, a){}', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('\'use strict\'; !function*(a, a){}', ErrorMessages.DUPLICATE_BINDING('a'));
    // If the source code matching this production is strict code, it is a Syntax Error if BindingIdentifier
    // is the IdentifierName eval or the IdentifierName arguments.
    testEarlyError('\'use strict\'; function* eval(){}', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('eval'));
    testEarlyError('\'use strict\'; function* arguments(){}',
      ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('arguments'));
    testEarlyError('\'use strict\'; !function* eval(){}', ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('eval'));
    testEarlyError('\'use strict\'; !function* arguments(){}',
      ErrorMessages.INVALID_ID_BINDING_STRICT_MODE('arguments'));
    // It is a Syntax Error if any element of the BoundNames of FormalParameters also occurs in the
    // LexicallyDeclaredNames of GeneratorBody.
    testEarlyError('function* f(a) { let a; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('function* f([a]){ let a; }', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('function* f({a}){ let a; }', ErrorMessages.DUPLICATE_BINDING('a'));
    // It is a Syntax Error if FormalParameters Contains YieldExpression is true.
    testEarlyError('function* g(){ function* f(a = yield){} }', ErrorMessages.ILLEGAL_YIELD_EXPRESSIONS('Generator'));
    testEarlyError('function* g(){ function* f(a = yield b){} }', ErrorMessages.ILLEGAL_YIELD_EXPRESSIONS('Generator'));
    testEarlyError('function* g(){ function* f(a = yield* b){} }',
      ErrorMessages.ILLEGAL_YIELD_EXPRESSIONS('Generator'));
    testEarlyError('function* g(){ function* f(a = x + f(yield)){} }',
      ErrorMessages.ILLEGAL_YIELD_EXPRESSIONS('Generator'));
    testEarlyError('function* g(){ function* f({[yield]: a}){} }',
      ErrorMessages.ILLEGAL_YIELD_EXPRESSIONS('Generator'));
    testEarlyError('function* g(){ function* f({a = yield}){} }', ErrorMessages.ILLEGAL_YIELD_EXPRESSIONS('Generator'));
    testEarlyError('function* g(){ function* f([a = yield]){} }', ErrorMessages.ILLEGAL_YIELD_EXPRESSIONS('Generator'));
    // TODO: testEarlyError("function* g(){ function* f(...{a = yield}){} }",
    // "Generator parameters must not contain yield expressions");
    testEarlyError('function* g(){ !function*(a = yield){} }', ErrorMessages.ILLEGAL_YIELD_EXPRESSIONS('Generator'));
    testEarlyError('function* g(){ !function*(a = yield b){} }', ErrorMessages.ILLEGAL_YIELD_EXPRESSIONS('Generator'));
    testEarlyError('function* g(){ !function*(a = yield* b){} }', ErrorMessages.ILLEGAL_YIELD_EXPRESSIONS('Generator'));
    testEarlyError('function* g(){ !function*(a = x + f(yield)){} }',
      ErrorMessages.ILLEGAL_YIELD_EXPRESSIONS('Generator'));
    testEarlyError('function* g(){ !function*({[yield]: a}){} }', ErrorMessages.ILLEGAL_YIELD_EXPRESSIONS('Generator'));
    testEarlyError('function* g(){ !function*({a = yield}){} }', ErrorMessages.ILLEGAL_YIELD_EXPRESSIONS('Generator'));
    testEarlyError('function* g(){ !function*([a = yield]){} }', ErrorMessages.ILLEGAL_YIELD_EXPRESSIONS('Generator'));
    // TODO: testEarlyError("function* g(){ !function*(...{a = yield}){} }",
    // "Generator parameters must not contain yield expressions");
    // It is a Syntax Error if FormalParameters Contains SuperProperty is true.
    testEarlyError('function* f(a = super.b){}', ErrorMessages.ILLEGAL_ACCESS_SUPER_MEMBER);
    testEarlyError('!function* (a = super.b){}', ErrorMessages.ILLEGAL_ACCESS_SUPER_MEMBER);
    testEarlyError('!{ a() { function* f(a = super.b()){} } };', ErrorMessages.ILLEGAL_ACCESS_SUPER_MEMBER);
    testEarlyError('!{ a() { !function* (a = super.b()){} } };', ErrorMessages.ILLEGAL_ACCESS_SUPER_MEMBER);
    testEarlyError('class A extends B { a() { function* f(a = super.b()){} } }',
      ErrorMessages.ILLEGAL_ACCESS_SUPER_MEMBER);
    testEarlyError('class A extends B { a() { !function* (a = super.b()){} } }',
      ErrorMessages.ILLEGAL_ACCESS_SUPER_MEMBER);
    // It is a Syntax Error if GeneratorBody Contains SuperProperty is true.
    testEarlyError('function* f(a){ super.b }', ErrorMessages.ILLEGAL_ACCESS_SUPER_MEMBER);
    testEarlyError('!function* (a){ super.b }', ErrorMessages.ILLEGAL_ACCESS_SUPER_MEMBER);
    testEarlyError('!{ a() { function* f(){ super.b(); } } };', ErrorMessages.ILLEGAL_ACCESS_SUPER_MEMBER);
    testEarlyError('!{ a() { !function* (){ super.b(); } } };', ErrorMessages.ILLEGAL_ACCESS_SUPER_MEMBER);
    testEarlyError('class A extends B { a() { function* f(){ super.b(); } } }',
      ErrorMessages.ILLEGAL_ACCESS_SUPER_MEMBER);
    testEarlyError('class A extends B { a() { !function* (){ super.b(); } } }',
      ErrorMessages.ILLEGAL_ACCESS_SUPER_MEMBER);

    // 14.5.1
    // It is a Syntax Error if ClassHeritage is not present and the following algorithm evaluates to true:
    //   1. Let constructor be ConstructorMethod of ClassBody.
    //   2. If constructor is empty, return false.
    //   3. Return HasDirectSuper of constructor.
    testEarlyError('class A { constructor() { super(); } }', ErrorMessages.INVALID_CALL_TO_SUPER);
    testEarlyError('class A { constructor() { {{ (( super() )); }} } }', ErrorMessages.INVALID_CALL_TO_SUPER);
    testEarlyError('class A { constructor() { (class {[super()](){}}); } }', ErrorMessages.INVALID_CALL_TO_SUPER);
    // It is a Syntax Error if PrototypePropertyNameList of ClassElementList contains more than
    // one occurrence of "constructor".
    testEarlyError('class A { constructor(){} constructor(){} }', ErrorMessages.DUPLICATE_CONSTRUCTOR);
    testEarlyError('class A { constructor(){} "constructor"(){} }', ErrorMessages.DUPLICATE_CONSTRUCTOR);
    testEarlyError('!class A { constructor(){} constructor(){} }', ErrorMessages.DUPLICATE_CONSTRUCTOR);
    testEarlyError('!class A { constructor(){} "constructor"(){} }', ErrorMessages.DUPLICATE_CONSTRUCTOR);
    // It is a Syntax Error if PropName of MethodDefinition is not "constructor" and
    // HasDirectSuper of MethodDefinition is true.
    testEarlyError('class A extends B { f() { super(); } }', ErrorMessages.INVALID_CALL_TO_SUPER);
    // It is a Syntax Error if PropName of MethodDefinition is "constructor" and SpecialMethod of
    // MethodDefinition is true.
    testEarlyError('class A { *constructor(){} }', ErrorMessages.ILLEGAL_CONSTRUCTORS);
    testEarlyError('class A { get constructor(){} }', ErrorMessages.ILLEGAL_CONSTRUCTORS);
    testEarlyError('class A { set constructor(a) {} }', ErrorMessages.ILLEGAL_CONSTRUCTORS);
    // It is a Syntax Error if HasDirectSuper of MethodDefinition is true.
    testEarlyError('class A extends B { static f() { super(); } }', ErrorMessages.INVALID_CALL_TO_SUPER);
    // It is a Syntax Error if PropName of MethodDefinition is "prototype".
    testEarlyError('class A extends B { static prototype(){} }', ErrorMessages.ILLEGAL_STATIC_CLASS_NAME);
    testEarlyError('class A extends B { static *prototype(){} }', ErrorMessages.ILLEGAL_STATIC_CLASS_NAME);
    testEarlyError('class A extends B { static get prototype(){} }', ErrorMessages.ILLEGAL_STATIC_CLASS_NAME);
    testEarlyError('class A extends B { static set prototype(a) {} }', ErrorMessages.ILLEGAL_STATIC_CLASS_NAME);

    // 15.1.1
    // It is a Syntax Error if the LexicallyDeclaredNames of StatementList contains any duplicate entries.
    testEarlyError('let a; let a;', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('let a; const a = 0;', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('const a = 0; let a;', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('const a = 0; const a = 0;', ErrorMessages.DUPLICATE_BINDING('a'));
    // It is a Syntax Error if any element of the LexicallyDeclaredNames of StatementList
    // also occurs in the VarDeclaredNames of StatementList.
    testEarlyError('let a; var a;', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('var a; let a;', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('const a = 0; var a;', ErrorMessages.DUPLICATE_BINDING('a'));
    testEarlyError('var a; const a = 0;', ErrorMessages.DUPLICATE_BINDING('a'));
    // It is a Syntax Error if StatementList Contains super unless the source code containing super
    // is eval code that is being processed by a direct eval that is contained in function code.
    // However, such function code does not include ArrowFunction function code.
    testEarlyError('super()', ErrorMessages.INVALID_CALL_TO_SUPER);
    testEarlyError('super.a', ErrorMessages.ILLEGAL_ACCESS_SUPER_MEMBER);
    testEarlyError('(class {[super()](){}});', ErrorMessages.INVALID_CALL_TO_SUPER);
    testEarlyError('(class {[super.a](){}});', ErrorMessages.ILLEGAL_ACCESS_SUPER_MEMBER);
    testEarlyError('(class {a(b = super()){}});', ErrorMessages.INVALID_CALL_TO_SUPER);
    // It is a Syntax Error if StatementList Contains NewTarget unless the source code containing
    // NewTarget is eval code that is being processed by a direct eval that is contained in function code.
    // However, such function code does not include ArrowFunction function code.
    testEarlyError('new.target', ErrorMessages.NEW_TARGET_ERROR);
    // It is a Syntax Error if ContainsDuplicateLabels of StatementList with argument « » is true.
    testEarlyError('label: label: ;', ErrorMessages.DUPLICATE_LABEL_DECLARATION('label'));
    // It is a Syntax Error if ContainsUndefinedBreakTarget of StatementList with argument « » is true.
    testEarlyError('break label;', ErrorMessages.ILLEGAL_BREAK_WITHIN_LABEL('label'));
    testEarlyError('labelA: break labelB;', ErrorMessages.ILLEGAL_BREAK_WITHIN_LABEL('labelB'));
    // It is a Syntax Error if ContainsUndefinedContinueTarget of StatementList with arguments « » and « » is true.
    testEarlyError('while(0) continue label;', ErrorMessages.ILLEGAL_CONTINUE_WITHOUT_ITERATION_WITH_ID('label'));
    testEarlyError('labelA: while(0) continue labelB;',
      ErrorMessages.ILLEGAL_CONTINUE_WITHOUT_ITERATION_WITH_ID('labelB'));

    // 15.2.1.1
    // It is a Syntax Error if the LexicallyDeclaredNames of ModuleItemList contains any duplicate entries.
    testModuleEarlyError('let a; let a;', ErrorMessages.DUPLICATE_BINDING('a'));
    testModuleEarlyError('let a; function a(){}', ErrorMessages.DUPLICATE_BINDING('a'));
    testModuleEarlyError('let a; const a = 0;', ErrorMessages.DUPLICATE_BINDING('a'));
    testModuleEarlyError('const a = 0; let a;', ErrorMessages.DUPLICATE_BINDING('a'));
    testModuleEarlyError('const a = 0; const a = 0;', ErrorMessages.DUPLICATE_BINDING('a'));
    testModuleEarlyError('let a; export class a {};', ErrorMessages.DUPLICATE_BINDING('a'));
    testModuleEarlyError('let a; export function a(){};', ErrorMessages.DUPLICATE_BINDING('a'));
    testModuleEarlyError('let a; export let a;', ErrorMessages.DUPLICATE_BINDING('a'));
    testModuleEarlyError('let a; export const a = 0;', ErrorMessages.DUPLICATE_BINDING('a'));
    testModuleEarlyError('const a = 0; export class a {};', ErrorMessages.DUPLICATE_BINDING('a'));
    testModuleEarlyError('const a = 0; export function a(){};', ErrorMessages.DUPLICATE_BINDING('a'));
    testModuleEarlyError('const a = 0; export let a;', ErrorMessages.DUPLICATE_BINDING('a'));
    testModuleEarlyError('const a = 0; export const a = 1;', ErrorMessages.DUPLICATE_BINDING('a'));
    // It is a Syntax Error if any element of the LexicallyDeclaredNames of ModuleItemList also occurs in
    // the VarDeclaredNames of ModuleItemList.
    testModuleEarlyError('let a; var a;', ErrorMessages.DUPLICATE_BINDING('a'));
    testModuleEarlyError('var a; function a(){}', ErrorMessages.DUPLICATE_BINDING('a'));
    testModuleEarlyError('var a; let a;', ErrorMessages.DUPLICATE_BINDING('a'));
    testModuleEarlyError('const a = 0; var a;', ErrorMessages.DUPLICATE_BINDING('a'));
    testModuleEarlyError('var a; const a = 0;', ErrorMessages.DUPLICATE_BINDING('a'));
    testModuleEarlyError('var a; export class a {};', ErrorMessages.DUPLICATE_BINDING('a'));
    testModuleEarlyError('var a; export function a(){};', ErrorMessages.DUPLICATE_BINDING('a'));
    testModuleEarlyError('var a; export let a;', ErrorMessages.DUPLICATE_BINDING('a'));
    testModuleEarlyError('var a; export const a = 0;', ErrorMessages.DUPLICATE_BINDING('a'));
    testModuleEarlyError('let a; export default function a(){};', ErrorMessages.DUPLICATE_BINDING('a'));
    testModuleEarlyError('let a; export default class a {};', ErrorMessages.DUPLICATE_BINDING('a'));
    // It is a Syntax Error if the ExportedNames of ModuleItemList contains any duplicate entries.
    testModuleEarlyError('export var a; export var a;', ErrorMessages.DUPLICATE_EXPORT('a'));
    testModuleEarlyError('let a; export {a, a};', ErrorMessages.DUPLICATE_EXPORT('a'));
    testModuleEarlyError('let a, b; export {a, b as a};', ErrorMessages.DUPLICATE_EXPORT('a'));
    testModuleEarlyError('let a; export {a, a as a};', ErrorMessages.DUPLICATE_EXPORT('a'));
    testModuleEarlyError('export {a}; export class a{};', ErrorMessages.DUPLICATE_EXPORT('a'));
    testModuleEarlyError('export {a}; export function a(){};', ErrorMessages.DUPLICATE_EXPORT('a'));
    testModuleEarlyError('export let a; export {a};', ErrorMessages.DUPLICATE_EXPORT('a'));
    testModuleEarlyError('export {a}; export const a = 0;', ErrorMessages.DUPLICATE_EXPORT('a'));
    testModuleEarlyError('export let a; let b; export {b as a};', ErrorMessages.DUPLICATE_EXPORT('a'));
    testModuleEarlyError('export default 0; export default 0;', ErrorMessages.DUPLICATE_EXPORT('default'));
    testModuleEarlyError('export default 0; export default function f(){};', ErrorMessages.DUPLICATE_EXPORT('default'));
    testModuleEarlyError('export default 0; export default class a {};', ErrorMessages.DUPLICATE_EXPORT('default'));
    testModuleEarlyError('var a; export default function() {} export { a as default };',
      ErrorMessages.DUPLICATE_EXPORT('default'));
    testModuleEarlyError('var a; export default class {} export { a as default };',
      ErrorMessages.DUPLICATE_EXPORT('default'));
    testModuleEarlyError('var a, b; export default a; export { b as default };',
      ErrorMessages.DUPLICATE_EXPORT('default'));
    // It is a Syntax Error if any element of the ExportedBindings of ModuleItemList does not also occur
    // in either the VarDeclaredNames of ModuleItemList, or the LexicallyDeclaredNames of ModuleItemList.
    testModuleEarlyError('export {a};', ErrorMessages.UNDECLARED_BINDING('a'));
    testModuleEarlyError('export {b as a};', ErrorMessages.UNDECLARED_BINDING('b'));
    testModuleEarlyError('var a; export {b as a};', ErrorMessages.UNDECLARED_BINDING('b'));
    testModuleEarlyError('export {a as b}; var b;', ErrorMessages.UNDECLARED_BINDING('a'));
    testModuleEarlyError('export {b as a};', ErrorMessages.UNDECLARED_BINDING('b'));
    testModuleEarlyError('let a; export {b as a};', ErrorMessages.UNDECLARED_BINDING('b'));
    testModuleEarlyError('export {a as b}; let b;', ErrorMessages.UNDECLARED_BINDING('a'));
    // It is a Syntax Error if ModuleItemList Contains super.
    testModuleEarlyError('super()', ErrorMessages.INVALID_CALL_TO_SUPER);
    testModuleEarlyError('super.a', ErrorMessages.ILLEGAL_ACCESS_SUPER_MEMBER);
    // It is a Syntax Error if ModuleItemList Contains NewTarget
    testModuleEarlyError('new.target', ErrorMessages.NEW_TARGET_ERROR);
    // It is a Syntax Error if ContainsDuplicateLabels of ModuleItemList with argument « » is true.
    testModuleEarlyError('label: label: ;', ErrorMessages.DUPLICATE_LABEL_DECLARATION('label'));
    // It is a Syntax Error if ContainsUndefinedBreakTarget of ModuleItemList with argument « » is true.
    testModuleEarlyError('break label;', ErrorMessages.ILLEGAL_BREAK_WITHIN_LABEL('label'));
    testModuleEarlyError('labelA: break labelB;',
      'Break statement must be nested within a statement with label "labelB"');
    // It is a Syntax Error if ContainsUndefinedContinueTarget of ModuleItemList with arguments « » and « » is true.
    testModuleEarlyError('while(0) continue label;', ErrorMessages.ILLEGAL_CONTINUE_WITHOUT_ITERATION_WITH_ID('label'));
    testModuleEarlyError('labelA: while(0) continue labelB;',
      'Continue statement must be nested within an iteration statement with label "labelB"');

    // 15.2.2.1
    // It is a Syntax Error if the BoundNames of ImportDeclaration contains any duplicate entries.
    testModuleEarlyError('import a, * as a from "module";', ErrorMessages.DUPLICATE_BINDING('a'));
    testModuleEarlyError('import a, {a} from "module";', ErrorMessages.DUPLICATE_BINDING('a'));
    testModuleEarlyError('import a, {b as a} from "module";', ErrorMessages.DUPLICATE_BINDING('a'));
    testModuleEarlyError('import {a, b as a} from "module";', ErrorMessages.DUPLICATE_BINDING('a'));
    testModuleEarlyError('import {a, a} from "module";', ErrorMessages.DUPLICATE_BINDING('a'));
    testModuleEarlyError('import {b as a, c as a} from "module";', ErrorMessages.DUPLICATE_BINDING('a'));

    // 15.2.3.1
    // For each IdentifierName n in ReferencedBindings of ExportClause :
    // It is a Syntax Error if StringValue of n is a ReservedWord or if the StringValue of n is
    // one of: "implements", "interface", "let", "package", "private", "protected", "public", "static", or "yield".
    // TODO

    // Annex B 3.1 (12.2.5.1)
    // It is a Syntax Error if PropertyNameList of PropertyDefinitionList contains any duplicate
    // entries for "__proto__" and at least two of those entries were obtained from productions of the
    // form PropertyDefinition : PropertyName : AssignmentExpression .
    testEarlyError('!{ __proto__: null, __proto__: null };', ErrorMessages.DUPLICATE_PROPTO_PROP);
    testEarlyError('!{ __proto__: null, "__proto__": null };', ErrorMessages.DUPLICATE_PROPTO_PROP);
    testEarlyError('!{ __proto__: null, __proto__: null, };', ErrorMessages.DUPLICATE_PROPTO_PROP);

    // Annex B 3.2 (13.12.1)
    // It is a Syntax Error if any strict mode source code matches this rule.
    testEarlyError('\'use strict\'; label: function f(){}', ErrorMessages.ILLEGAL_LABEL_FUNC_DECLARATION);

    // Annex B 3.4
    // The above rules are only applied when parsing code that is not strict mode code
    testEarlyError('\'use strict\'; if (0) function f(){}', ErrorMessages.ILLEGAL_FUNC_DECL_IF);
    testEarlyError('\'use strict\'; if (0) function f(){} else;', ErrorMessages.ILLEGAL_FUNC_DECL_IF);
    testEarlyError('\'use strict\'; if (0); else function f(){}', ErrorMessages.ILLEGAL_FUNC_DECL_IF);

    // Annex B 3.5 (13.14.1)
    // It is a Syntax Error if any element of the BoundNames of CatchParameter also occurs
    // in the LexicallyDeclaredNames of Block.
    testEarlyError('try {} catch(e) { let e; }', ErrorMessages.DUPLICATE_BINDING('e'));
    testEarlyError('try {} catch(e) { function e(){} }', ErrorMessages.DUPLICATE_BINDING('e'));
    // It is a Syntax Error if any element of the BoundNames of CatchParameter also occurs
    // in the VarDeclaredNames of Block,
    // unless that element is only bound by a VariableStatement or the VariableDeclarationList of a for statement,
    // or the ForBinding of a for-in statement.
    testEarlyError('try {} catch(e) { for(var e of 0); }', ErrorMessages.DUPLICATE_BINDING('e'));

    // 14.1.2, 14.2.1, 14.3.1, 14.4.1
    // It is a Syntax Error if ContainsUseStrict of FunctionBody is true and IsSimpleParameterList
    // of FormalParameters is false.
    testEarlyError('function a([]){\'use strict\';}', ErrorMessages.ILLEGAL_USE_STRICT);
    testEarlyError('(function ([]){\'use strict\';})', ErrorMessages.ILLEGAL_USE_STRICT);
    testEarlyError('(([]) => {\'use strict\';})', ErrorMessages.ILLEGAL_USE_STRICT);
    testEarlyError('({set a([]){\'use strict\'}})', ErrorMessages.ILLEGAL_USE_STRICT);
    testEarlyError('({a([]){\'use strict\'}})', ErrorMessages.ILLEGAL_USE_STRICT);
  });

  suite('early error locations', () => {

    test('location disabled', () => {
      try {
        parse('super()', { earlyErrors: true });
        expect().fail();
      } catch (e) {
        expect(e.index).to.be(0);
        expect(e.line).to.be(1);
        expect(e.column).to.be(0);
      }
      try {
        parse('\n\n  super()', { earlyErrors: true });
        expect().fail();
      } catch (e) {
        expect(e.index).to.be(0);
        expect(e.line).to.be(1);
        expect(e.column).to.be(0);
      }
    });

    test('location enabled', () => {
      try {
        parseWithLocation('super()', { earlyErrors: true });
        expect().fail();
      } catch (e) {
        expect(e.index).to.be(0);
        expect(e.line).to.be(1);
        expect(e.column).to.be(0);
      }
      try {
        parseWithLocation('\n\n  super()', { earlyErrors: true });
        expect().fail();
      } catch (e) {
        expect(e.index).to.be(4);
        expect(e.line).to.be(3);
        expect(e.column).to.be(2);
      }
    });

  });

});
