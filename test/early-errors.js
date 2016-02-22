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

var expect = require("expect.js");
var parse = require("../").default;
var testParseFailure = require("./assertions").testParseFailure;
var testEarlyError = require("./assertions").testEarlyError;
var testModuleEarlyError = require("./assertions").testModuleEarlyError;

suite("Parser", function () {

  // these *would* be early errors, but we have no way to represent them in our AST
  suite("early grammar errors", function () {

    // 12.2.5.1
    // Always throw a Syntax Error if code matches this production.
    testParseFailure("({ a = 0 });", "Illegal property initializer");

    // 12.2.9.1
    // It is a Syntax Error if the lexical token sequence matched by CoverParenthesizedExpressionAndArrowParameterList cannot be parsed with no tokens left over using ParenthesizedExpression as the goal symbol.
    testParseFailure("(...a)", "Unexpected end of input");
    testParseFailure("(a, ...b)", "Unexpected end of input");
    // All Early Errors rules for ParenthesizedExpression and its derived productions also apply to CoveredParenthesizedExpression of CoverParenthesizedExpressionAndArrowParameterList.
    testParseFailure("(((...a)))", "Unexpected token \")\"");
    testParseFailure("(((a, ...b)))", "Unexpected token \")\"");

    // 12.4.1
    // It is an early Reference Error if IsValidSimpleAssignmentTarget of LeftHandSideExpression is false.
    testParseFailure("0++", "Increment/decrement target must be an identifier or member expression");
    testParseFailure("0--", "Increment/decrement target must be an identifier or member expression");

    // 12.5.1
    // It is an early Reference Error if IsValidSimpleAssignmentTarget of UnaryExpression is false.
    testParseFailure("++0", "Increment/decrement target must be an identifier or member expression");
    testParseFailure("--0", "Increment/decrement target must be an identifier or member expression");

    // 12.14.1
    // It is a Syntax Error if LeftHandSideExpression is either an ObjectLiteral or an ArrayLiteral and the lexical token sequence matched by LeftHandSideExpression cannot be parsed with no tokens left over using AssignmentPattern as the goal symbol.
    testParseFailure("({a: 0} = 0);", "Invalid left-hand side in assignment");
    testParseFailure("({get a(){}} = 0)", "Invalid left-hand side in assignment");
    testParseFailure("({set a(b){}} = 0)", "Invalid left-hand side in assignment");
    testParseFailure("({a(b){}} = 0)", "Invalid left-hand side in assignment");
    testParseFailure("[0] = 0;", "Invalid left-hand side in assignment");
    // It is an early Reference Error if LeftHandSideExpression is neither an ObjectLiteral nor an ArrayLiteral and IsValidSimpleAssignmentTarget of LeftHandSideExpression is false.
    testParseFailure("0 = 0;", "Invalid left-hand side in assignment");
    // TODO:
    //testParseFailure("({a}) = 0;", "Invalid left-hand side in assignment");
    //testParseFailure("([a]) = 0;", "Invalid left-hand side in assignment");
    // It is an early Reference Error if IsValidSimpleAssignmentTarget of LeftHandSideExpression is false.
    testParseFailure("({a} += 0);", "Invalid left-hand side in assignment");
    testParseFailure("[a] *= 0;", "Invalid left-hand side in assignment");
    testParseFailure("0 /= 0;", "Invalid left-hand side in assignment");

    // 12.14.5.1
    // It is a Syntax Error if LeftHandSideExpression is either an ObjectLiteral or an ArrayLiteral and if the lexical token sequence matched by LeftHandSideExpression cannot be parsed with no tokens left over using AssignmentPattern as the goal symbol.
    testParseFailure("[...{a: 0}] = 0;", "Invalid left-hand side in assignment");
    testParseFailure("[...[0]] = 0;", "Invalid left-hand side in assignment");
    // It is a Syntax Error if LeftHandSideExpression is neither an ObjectLiteral nor an ArrayLiteral and IsValidSimpleAssignmentTarget(LeftHandSideExpression) is false.
    testParseFailure("[...0] = 0;", "Invalid left-hand side in assignment");
    testParseFailure("[...new a] = 0;", "Invalid left-hand side in assignment");

    // 13.6.4.1
    // It is a Syntax Error if LeftHandSideExpression is either an ObjectLiteral or an ArrayLiteral and if the lexical token sequence matched by LeftHandSideExpression cannot be parsed with no tokens left over using AssignmentPattern as the goal symbol.
    testParseFailure("for({a: 0} in 0);", "Invalid left-hand side in for-in");
    testParseFailure("for([0] in 0);", "Invalid left-hand side in for-in");
    testParseFailure("for({a: 0} of 0);", "Invalid left-hand side in for-of");
    testParseFailure("for([0] of 0);", "Invalid left-hand side in for-of");
    // It is a Syntax Error if IsValidSimpleAssignmentTarget of LeftHandSideExpression is false.
    testParseFailure("for(0 in 0);", "Invalid left-hand side in for-in");
    testParseFailure("for(0 of 0);", "Invalid left-hand side in for-of");
    // It is a Syntax Error if the LeftHandSideExpression is CoverParenthesizedExpressionAndArrowParameterList : ( Expression ) and Expression derives a production that would produce a Syntax Error according to these rules if that production is substituted for LeftHandSideExpression. This rule is recursively applied.
    testParseFailure("for(({a: 0}) in 0);", "Invalid left-hand side in for-in");
    testParseFailure("for(([0]) in 0);", "Invalid left-hand side in for-in");
    testParseFailure("for(({a: 0}) of 0);", "Invalid left-hand side in for-of");
    testParseFailure("for(([0]) of 0);", "Invalid left-hand side in for-of");
    testParseFailure("for((0) in 0);", "Invalid left-hand side in for-in");
    testParseFailure("for((0) of 0);", "Invalid left-hand side in for-of");

  });

  suite("early tokenisation errors", function () {

    // 11.6.1.1
    // It is a Syntax Error if SV(UnicodeEscapeSequence) is neither the UTF16Encoding (10.1.1) of a single Unicode code point with the Unicode property “ID_Start” nor "$" or "_".
    testParseFailure("\\u0000", "Unexpected end of input");
    testParseFailure("\\u{0}", "Unexpected end of input");
    // It is a Syntax Error if SV(UnicodeEscapeSequence) is neither the UTF16Encoding (10.1.1) of a single Unicode code point with the Unicode property “ID_Continue” nor "$" or "_" nor the UTF16Encoding of either <ZWNJ> or <ZWJ>.
    testParseFailure("a\\u0000", "Unexpected end of input");
    testParseFailure("a\\u{0}", "Unexpected end of input");

    // 11.8.4.1
    // It is a Syntax Error if the MV of HexDigits > 1114111.
    testParseFailure("(\"\\u{110000}\")", "Unexpected \"{\"");
    testParseFailure("(\"\\u{FFFFFFF}\")", "Unexpected \"{\"");

    // 11.8.5.1
    // It is a Syntax Error if IdentifierPart contains a Unicode escape sequence.
    testParseFailure("/./\\u0069", "Invalid regular expression flags");
    testParseFailure("/./\\u{69}", "Invalid regular expression flags");

  });

  suite("early errors", function () {

    // 12.1.1
    // It is a Syntax Error if the code matched by this production is contained in strict code and the StringValue of Identifier is "arguments" or "eval".
    testEarlyError("'use strict'; arguments = 0", "The identifier \"arguments\" must not be in binding position in strict mode");
    testEarlyError("'use strict'; arguments *= 0", "The identifier \"arguments\" must not be in binding position in strict mode");

    testEarlyError("'use strict'; [eval] = 0", "The identifier \"eval\" must not be in binding position in strict mode");
    testEarlyError("'use strict'; [,,,eval,] = 0", "The identifier \"eval\" must not be in binding position in strict mode");
    testEarlyError("'use strict'; ({a: eval} = 0)", "The identifier \"eval\" must not be in binding position in strict mode");
    testEarlyError("'use strict'; ({a: eval = 0} = 0)", "The identifier \"eval\" must not be in binding position in strict mode");

    testEarlyError("'use strict'; [arguments] = 0", "The identifier \"arguments\" must not be in binding position in strict mode");
    testEarlyError("'use strict'; [,,,arguments,] = 0", "The identifier \"arguments\" must not be in binding position in strict mode");
    testEarlyError("'use strict'; ({a: arguments} = 0)", "The identifier \"arguments\" must not be in binding position in strict mode");
    testEarlyError("'use strict'; ({a: arguments = 0} = 0)", "The identifier \"arguments\" must not be in binding position in strict mode");

    testEarlyError("'use strict'; var eval;", "The identifier \"eval\" must not be in binding position in strict mode");
    testEarlyError("'use strict'; var arguments;", "The identifier \"arguments\" must not be in binding position in strict mode");
    testEarlyError("'use strict'; let [eval] = 0;", "The identifier \"eval\" must not be in binding position in strict mode");
    testEarlyError("'use strict'; const {a: eval} = 0;", "The identifier \"eval\" must not be in binding position in strict mode");
    testModuleEarlyError("var eval;", "The identifier \"eval\" must not be in binding position in strict mode");

    testModuleEarlyError("eval=>0", "The identifier \"eval\" must not be in binding position in strict mode");
    testEarlyError("'use strict'; eval=>0", "The identifier \"eval\" must not be in binding position in strict mode");
    testEarlyError("'use strict'; arguments=>0", "The identifier \"arguments\" must not be in binding position in strict mode");
    testEarlyError("'use strict'; (eval)=>0", "The identifier \"eval\" must not be in binding position in strict mode");
    testEarlyError("'use strict'; (arguments)=>0", "The identifier \"arguments\" must not be in binding position in strict mode");

    testEarlyError("'use strict'; function f(eval){}", "The identifier \"eval\" must not be in binding position in strict mode");
    testEarlyError("function f(eval){ 'use strict'; }", "The identifier \"eval\" must not be in binding position in strict mode");
    testEarlyError("'use strict'; !function (eval){}", "The identifier \"eval\" must not be in binding position in strict mode");
    testEarlyError("!function (eval){ 'use strict'; }", "The identifier \"eval\" must not be in binding position in strict mode");
    testEarlyError("'use strict'; function* f(eval){}", "The identifier \"eval\" must not be in binding position in strict mode");
    testEarlyError("function* f(eval){ 'use strict'; }", "The identifier \"eval\" must not be in binding position in strict mode");
    testEarlyError("'use strict'; !function* (eval){}", "The identifier \"eval\" must not be in binding position in strict mode");
    testEarlyError("!function* (eval){ 'use strict'; }", "The identifier \"eval\" must not be in binding position in strict mode");
    testEarlyError("!{ f(eval){ 'use strict'; } };", "The identifier \"eval\" must not be in binding position in strict mode");
    testEarlyError("!{ *f(eval){ 'use strict'; } };", "The identifier \"eval\" must not be in binding position in strict mode");
    testEarlyError("'use strict'; !{ set f(eval){} };", "The identifier \"eval\" must not be in binding position in strict mode");
    testEarlyError("!{ set f(eval){ 'use strict'; } };", "The identifier \"eval\" must not be in binding position in strict mode");
    testEarlyError("class A { f(eval){} };", "The identifier \"eval\" must not be in binding position in strict mode");
    testEarlyError("class A { *f(eval){} };", "The identifier \"eval\" must not be in binding position in strict mode");
    testEarlyError("class A { set f(eval){} };", "The identifier \"eval\" must not be in binding position in strict mode");
    testEarlyError("class A extends (eval = null) { };", "The identifier \"eval\" must not be in binding position in strict mode");
    testEarlyError("!class extends (eval = null) { };", "The identifier \"eval\" must not be in binding position in strict mode");
    // It is a Syntax Error if the code matched by this production is contained in strict code.
    testEarlyError("'use strict'; +yield;", "The identifier \"yield\" must not be in expression position in strict mode");
    testEarlyError("'use strict'; yield:;", "The identifier \"yield\" must not be in label position in strict mode");
    testEarlyError("'use strict'; var [yield] = 0;", "The identifier \"yield\" must not be in binding position in strict mode");
    // It is a Syntax Error if this phrase is contained in strict code and the StringValue of IdentifierName is: "implements", "interface", "let", "package", "private", "protected", "public", "static", or "yield".
    testEarlyError("'use strict'; +implements;", "The identifier \"implements\" must not be in expression position in strict mode");
    testEarlyError("'use strict'; +interface;", "The identifier \"interface\" must not be in expression position in strict mode");
    testEarlyError("'use strict'; +let;", "The identifier \"let\" must not be in expression position in strict mode");
    testEarlyError("'use strict'; +package;", "The identifier \"package\" must not be in expression position in strict mode");
    testEarlyError("'use strict'; +private;", "The identifier \"private\" must not be in expression position in strict mode");
    testEarlyError("'use strict'; +protected;", "The identifier \"protected\" must not be in expression position in strict mode");
    testEarlyError("'use strict'; +public;", "The identifier \"public\" must not be in expression position in strict mode");
    testEarlyError("'use strict'; +static;", "The identifier \"static\" must not be in expression position in strict mode");
    testEarlyError("'use strict'; +yield;", "The identifier \"yield\" must not be in expression position in strict mode");
    testEarlyError("function a(yield){ 'use strict'; }", "The identifier \"yield\" must not be in binding position in strict mode");
    testEarlyError("function a(){ 'use strict'; function a(a=yield){}}", "The identifier \"yield\" must not be in expression position in strict mode");
    testEarlyError("function a(){ 'use strict'; function a(yield){}}", "The identifier \"yield\" must not be in binding position in strict mode");
    testEarlyError("function a([yield]){ 'use strict'; }", "The identifier \"yield\" must not be in binding position in strict mode");
    testEarlyError("function a({yield}){ 'use strict'; }", "The identifier \"yield\" must not be in binding position in strict mode");
    testEarlyError("function a({yield=0}){ 'use strict'; }", "The identifier \"yield\" must not be in binding position in strict mode");
    testEarlyError("function a({a:yield}){ 'use strict'; }", "The identifier \"yield\" must not be in binding position in strict mode");
    testEarlyError("function a([yield,...a]){ 'use strict'; }", "The identifier \"yield\" must not be in binding position in strict mode");
    testEarlyError("class A {set a(yield){}}", "The identifier \"yield\" must not be in binding position in strict mode");
    testEarlyError("package => {'use strict'}", "The identifier \"package\" must not be in binding position in strict mode");
    testEarlyError("(package) => {'use strict'}", "The identifier \"package\" must not be in binding position in strict mode");
    testEarlyError("([let]) => {'use strict'}", "The identifier \"let\" must not be in binding position in strict mode");
    testEarlyError("({a(yield){ 'use strict'; }})", "The identifier \"yield\" must not be in binding position in strict mode");
    testEarlyError("!{ get a() { 'use strict'; +let; } }", "The identifier \"let\" must not be in expression position in strict mode");
    testEarlyError("!{ set a(let) { 'use strict'; } }", "The identifier \"let\" must not be in binding position in strict mode");
    testEarlyError("!{ a(let) { 'use strict'; } }", "The identifier \"let\" must not be in binding position in strict mode");
    testEarlyError("!{ a(let) { 'use strict'; } }", "The identifier \"let\" must not be in binding position in strict mode");
    // It is a Syntax Error if StringValue of IdentifierName is the same string value as the StringValue of any ReservedWord except for yield.
    // TODO: these should fail but will not
    //testEarlyError("(i\\u006E)", "Unexpected token \"in\"");
    //testEarlyError("var i\\u006E;", "Unexpected token \"in\"");
    //testModuleEarlyError("import {a as i\\u006E} from \"module\";", "Unexpected token \"in\"");

    // 12.2.5.1
    // It is a Syntax Error if HasDirectSuper of MethodDefinition is true.
    testEarlyError("({ a(){ super(); } });", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    testEarlyError("({ a(){ {{ if(0) (( super() )); }} } });", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    testEarlyError("class A extends B { constructor() { !{constructor() { super(); }}; } }", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    testEarlyError("class A extends B { constructor() { !{*constructor() { super(); }}; } }", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    testEarlyError("class A extends B { constructor() { !{get constructor() { super(); }}; } }", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    testEarlyError("class A extends B { constructor() { !{set constructor(a) { super(); }}; } }", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");

    // 12.2.7.1
    // It is a Syntax Error if BodyText of RegularExpressionLiteral cannot be recognized using the goal symbol Pattern of the ECMAScript RegExp grammar specified in 21.2.1.
    // TODO: re-enable the PatternAcceptor and these tests
    //testEarlyError("/?/", "Invalid regular expression pattern");
    //testEarlyError("/(/", "Invalid regular expression pattern");
    //testEarlyError("/(a/", "Invalid regular expression pattern");
    //testEarlyError("/\\1/", "Invalid regular expression pattern");
    //testEarlyError("/(()(?:\\3)(()))/", "Invalid regular expression pattern");
    //testEarlyError("/(\\01)/", "Invalid regular expression pattern");
    //testEarlyError("/((((((((((((.))))))))))))\\13/", "Invalid regular expression pattern");
    //testEarlyError("/}?/", "Invalid regular expression pattern");
    //testEarlyError("/{*/", "Invalid regular expression pattern");
    //testEarlyError("/(?=.)*/u", "Invalid regular expression pattern");
    // It is a Syntax Error if FlagText of RegularExpressionLiteral contains any code points other than "g", "i", "m", "u", or "y", or if it contains the same code point more than once.
    testEarlyError("/./a", "Invalid regular expression flags");
    testEarlyError("/./ii", "Invalid regular expression flags");

    // 12.5.4.1
    // It is a Syntax Error if the UnaryExpression is contained in strict code and the derived UnaryExpression is PrimaryExpression : IdentifierReference.
    testEarlyError("'use strict'; delete a;", "Identifier expressions must not be deleted in strict mode");
    // It is a Syntax Error if the derived UnaryExpression is PrimaryExpression : CoverParenthesizedExpressionAndArrowParameterList and CoverParenthesizedExpressionAndArrowParameterList ultimately derives a phrase that, if used in place of UnaryExpression, would produce a Syntax Error according to these rules. This rule is recursively applied.
    testEarlyError("'use strict'; delete (a);", "Identifier expressions must not be deleted in strict mode");
    testEarlyError("'use strict'; delete ((a));", "Identifier expressions must not be deleted in strict mode");

    // 12.14.5.1
    // It is a Syntax Error if IsValidSimpleAssignmentTarget of IdentifierReference is false.
    testEarlyError("'use strict'; ({eval} = 0);", "The identifier \"eval\" must not be in binding position in strict mode");
    testEarlyError("'use strict'; ({eval = 0} = 0);", "The identifier \"eval\" must not be in binding position in strict mode");
    testEarlyError("'use strict'; ({arguments} = 0);", "The identifier \"arguments\" must not be in binding position in strict mode");
    testEarlyError("'use strict'; ({arguments = 0} = 0);", "The identifier \"arguments\" must not be in binding position in strict mode");

    // 13.2.1
    // It is a Syntax Error if the LexicallyDeclaredNames of StatementList contains any duplicate entries.
    testEarlyError("{ let a; let a; }", "Duplicate binding \"a\"");
    testEarlyError("{ let a; const a = 0; }", "Duplicate binding \"a\"");
    testEarlyError("{ const a = 0; let a; }", "Duplicate binding \"a\"");
    testEarlyError("{ const a = 0; const a = 0; }", "Duplicate binding \"a\"");
    testEarlyError("{ function a(){} function a(){} }", "Duplicate binding \"a\"");
    testEarlyError("{ function a(){} function* a(){} }", "Duplicate binding \"a\"");
    testEarlyError("{ let a; function a(){} }", "Duplicate binding \"a\"");
    testEarlyError("{ const a = 0; function a(){} }", "Duplicate binding \"a\"");
    // It is a Syntax Error if any element of the LexicallyDeclaredNames of StatementList also occurs in the VarDeclaredNames of StatementList.
    testEarlyError("{ let a; var a; }", "Duplicate binding \"a\"");
    testEarlyError("{ let a; { var a; } }", "Duplicate binding \"a\"");
    testEarlyError("{ var a; let a; }", "Duplicate binding \"a\"");
    testEarlyError("{ const a = 0; var a; }", "Duplicate binding \"a\"");
    testEarlyError("{ var a; const a = 0; }", "Duplicate binding \"a\"");

    // 13.3.1.1
    // It is a Syntax Error if the BoundNames of BindingList contains "let".
    testEarlyError("let let;", "Lexical declarations must not have a binding named \"let\"");
    testEarlyError("let a, let;", "Lexical declarations must not have a binding named \"let\"");
    testEarlyError("let a, let = 0;", "Lexical declarations must not have a binding named \"let\"");
    testEarlyError("for(let let;;);", "Lexical declarations must not have a binding named \"let\"");
    testEarlyError("for(let a, let;;);", "Lexical declarations must not have a binding named \"let\"");
    testEarlyError("for(const let = 0;;);", "Lexical declarations must not have a binding named \"let\"");
    testEarlyError("for(const a = 0, let = 1;;);", "Lexical declarations must not have a binding named \"let\"");
    testEarlyError("for(let [let];;);", "Lexical declarations must not have a binding named \"let\"");
    // It is a Syntax Error if the BoundNames of BindingList contains any duplicate entries.
    testEarlyError("let a, a;", "Duplicate binding \"a\"");
    testEarlyError("let a, b, a;", "Duplicate binding \"a\"");
    testEarlyError("let a = 0, a = 1;", "Duplicate binding \"a\"");
    testEarlyError("const a = 0, a = 1;", "Duplicate binding \"a\"");
    testEarlyError("const a = 0, b = 1, a = 2;", "Duplicate binding \"a\"");
    testEarlyError("let a, [a] = 0;", "Duplicate binding \"a\"");
    testEarlyError("let [a, a] = 0;", "Duplicate binding \"a\"");
    testEarlyError("let {a: b, c: b} = 0;", "Duplicate binding \"b\"");
    testEarlyError("let [a, ...a] = 0;", "Duplicate binding \"a\"");
    testEarlyError("let \\u{61}, \\u{0061};", "Duplicate binding \"a\"");
    testEarlyError("let \\u0061, \\u{0061};", "Duplicate binding \"a\"");
    testEarlyError("let x\\u{61}, x\\u{0061};", "Duplicate binding \"xa\"");
    testEarlyError("let x\\u{E01D5}, x\uDB40\uDDD5;", "Duplicate binding \"x\uDB40\uDDD5\"");
    testEarlyError("for(let a, a;;);", "Duplicate binding \"a\"");
    testEarlyError("for(let [a, a];;);", "Duplicate binding \"a\"");
    testEarlyError("for(const a = 0, a = 1;;);", "Duplicate binding \"a\"");
    testEarlyError("for(const [a, a] = 0;;);", "Duplicate binding \"a\"");
    // It is a Syntax Error if Initializer is not present and IsConstantDeclaration of the LexicalDeclaration containing this production is true.
    testEarlyError("const a;", "Constant lexical declarations must have an initialiser");
    testEarlyError("const a, b = 0;", "Constant lexical declarations must have an initialiser");
    testEarlyError("const a = 0, b;", "Constant lexical declarations must have an initialiser");
    testEarlyError("{ const a; }", "Constant lexical declarations must have an initialiser");
    testEarlyError("function f(){ const a; }", "Constant lexical declarations must have an initialiser");
    testEarlyError("for(const a;;);", "Constant lexical declarations must have an initialiser");
    testEarlyError("for(const a = 0, b;;);", "Constant lexical declarations must have an initialiser");

    // 13.6.1
    // It is a Syntax Error if IsLabelledFunction(Statement) is true for any occurrence of Statement in these rules.
    testEarlyError("if(0) label: function f(){}", "The consequent of an if statement must not be a labeled function declaration");
    testEarlyError("if(0) labelA: labelB: function f(){}", "The consequent of an if statement must not be a labeled function declaration");
    testEarlyError("if(0) label: function f(){} else ;", "The consequent of an if statement must not be a labeled function declaration");
    testEarlyError("if(0) ; else label: function f(){}", "The alternate of an if statement must not be a labeled function declaration");

    // 13.7.1.1
    // It is a Syntax Error if IsLabelledFunction(Statement) is true for any occurrence of Statement in these rules.
    testEarlyError("do label: function f(){} while (0)", "The body of a do-while statement must not be a labeled function declaration");
    testEarlyError("do label: function f(){} while (0);", "The body of a do-while statement must not be a labeled function declaration");
    testEarlyError("while(0) label: function f(){}", "The body of a while statement must not be a labeled function declaration");
    testEarlyError("for(;;) label: function f(){}", "The body of a for statement must not be a labeled function declaration");
    testEarlyError("for(var a;;) label: function f(){}", "The body of a for statement must not be a labeled function declaration");
    testEarlyError("for(const a = 0;;) label: function f(){}", "The body of a for statement must not be a labeled function declaration");
    testEarlyError("for(let a;;) label: function f(){}", "The body of a for statement must not be a labeled function declaration");
    testEarlyError("for(a in b) label: function f(){}", "The body of a for-in statement must not be a labeled function declaration");
    testEarlyError("for(var a in b) label: function f(){}", "The body of a for-in statement must not be a labeled function declaration");
    testEarlyError("for(let a in b) label: function f(){}", "The body of a for-in statement must not be a labeled function declaration");
    testEarlyError("for(const a in b) label: function f(){}", "The body of a for-in statement must not be a labeled function declaration");
    testEarlyError("for(a of b) label: function f(){}", "The body of a for-of statement must not be a labeled function declaration");
    testEarlyError("for(var a of b) label: function f(){}", "The body of a for-of statement must not be a labeled function declaration");
    testEarlyError("for(let a of b) label: function f(){}", "The body of a for-of statement must not be a labeled function declaration");
    testEarlyError("for(const a of b) label: function f(){}", "The body of a for-of statement must not be a labeled function declaration");
    testEarlyError("for(;;) labelA: labelB: labelC: function f(){}", "The body of a for statement must not be a labeled function declaration");

    // 13.7.4.1
    // It is a Syntax Error if any element of the BoundNames of LexicalDeclaration also occurs in the VarDeclaredNames of Statement.
    testEarlyError("for(let a;;) { var a; }", "Duplicate binding \"a\"");
    testEarlyError("for(const a = 0;;) { var a; }", "Duplicate binding \"a\"");

    // 13.7.5.1
    // It is a Syntax Error if the BoundNames of ForDeclaration contains "let".
    testEarlyError("for(let let in 0);", "Lexical declarations must not have a binding named \"let\"");
    testEarlyError("for(const let in 0);", "Lexical declarations must not have a binding named \"let\"");
    testEarlyError("for(let let of 0);", "Lexical declarations must not have a binding named \"let\"");
    testEarlyError("for(const let of 0);", "Lexical declarations must not have a binding named \"let\"");
    // It is a Syntax Error if any element of the BoundNames of ForDeclaration also occurs in the VarDeclaredNames of Statement.
    testEarlyError("for(let a in 0) { var a; }", "Duplicate binding \"a\"");
    testEarlyError("for(const a in 0) { var a; }", "Duplicate binding \"a\"");
    testEarlyError("for(let a of 0) { var a; }", "Duplicate binding \"a\"");
    testEarlyError("for(const a of 0) { var a; }", "Duplicate binding \"a\"");
    // It is a Syntax Error if the BoundNames of ForDeclaration contains any duplicate entries.
    testEarlyError("for(let {a, a} in 0);", "Duplicate binding \"a\"");
    testEarlyError("for(const {a, a} in 0);", "Duplicate binding \"a\"");
    testEarlyError("for(let {a, a} of 0);", "Duplicate binding \"a\"");
    testEarlyError("for(const {a, a} of 0);", "Duplicate binding \"a\"");

    // 13.8.1
    // It is a Syntax Error if this production is not nested, directly or indirectly (but not crossing function boundaries), within an IterationStatement.
    testEarlyError("continue;", "Continue statement must be nested within an iteration statement");
    testModuleEarlyError("continue;", "Continue statement must be nested within an iteration statement");
    testEarlyError("{ continue; }", "Continue statement must be nested within an iteration statement");
    testEarlyError("if(0) continue;", "Continue statement must be nested within an iteration statement");
    testEarlyError("while(0) !function(){ continue; };", "Continue statement must be nested within an iteration statement");
    testEarlyError("while(0) { function f(){ continue; } }", "Continue statement must be nested within an iteration statement");
    testEarlyError("label: continue label;", "Continue statement must be nested within an iteration statement with label \"label\"");
    testEarlyError("label: { continue label; }", "Continue statement must be nested within an iteration statement with label \"label\"");
    testEarlyError("label: if(0) continue label;", "Continue statement must be nested within an iteration statement with label \"label\"");
    testEarlyError("label: while(0) !function(){ continue label; };", "Continue statement must be nested within an iteration statement with label \"label\"");
    testEarlyError("label: while(0) { function f(){ continue label; } }", "Continue statement must be nested within an iteration statement with label \"label\"");

    // 13.9.1
    // It is a Syntax Error if this production is not nested, directly or indirectly (but not crossing function boundaries), within an IterationStatement or a SwitchStatement.
    testEarlyError("break;", "Break statement must be nested within an iteration statement or a switch statement");
    testModuleEarlyError("break;", "Break statement must be nested within an iteration statement or a switch statement");
    testEarlyError("{ break; }", "Break statement must be nested within an iteration statement or a switch statement");
    testEarlyError("if(0) break;", "Break statement must be nested within an iteration statement or a switch statement");
    testEarlyError("while(0) !function(){ break; };", "Break statement must be nested within an iteration statement or a switch statement");
    testEarlyError("while(0) { function f(){ break; } }", "Break statement must be nested within an iteration statement or a switch statement");
    testEarlyError("switch(0) { case 0: !function(){ break; }; }", "Break statement must be nested within an iteration statement or a switch statement");
    testEarlyError("switch(0) { case 0: function f(){ break; } }", "Break statement must be nested within an iteration statement or a switch statement");
    testEarlyError("switch(0) { default: !function(){ break; }; }", "Break statement must be nested within an iteration statement or a switch statement");
    testEarlyError("switch(0) { default: function f(){ break; } }", "Break statement must be nested within an iteration statement or a switch statement");

    // 13.11.1
    // It is a Syntax Error if the code that matches this production is contained in strict code.
    testEarlyError("'use strict'; with(0);", "Strict mode code must not include a with statement");
    // It is a Syntax Error if IsLabelledFunction(Statement) is true.
    testEarlyError("with(0) label: function f(){}", "The body of a with statement must not be a labeled function declaration");

    // 13.12.1
    // It is a Syntax Error if the LexicallyDeclaredNames of CaseClauses contains any duplicate entries.
    testEarlyError("switch(0) { case 0: let a; case 1: let a; }", "Duplicate binding \"a\"");
    testEarlyError("switch(0) { case 0: let a; case 1: function a(){} }", "Duplicate binding \"a\"");
    testEarlyError("switch(0) { case 0: let a; default: let a; }", "Duplicate binding \"a\"");
    testEarlyError("switch(0) { default: let a; case 0: let a; }", "Duplicate binding \"a\"");
    testEarlyError("switch(0) { default: let a; case 0: function a(){} }", "Duplicate binding \"a\"");
    testEarlyError("switch(0) { default: function a(){} case 0: let a  }", "Duplicate binding \"a\"");
    testEarlyError("switch(0) { default: function a(){} case 0: let a  }", "Duplicate binding \"a\"");
    // It is a Syntax Error if any element of the LexicallyDeclaredNames of CaseClauses also occurs in the VarDeclaredNames of CaseClauses.
    testEarlyError("switch(0) { case 0: let a; case 1: var a; }", "Duplicate binding \"a\"");
    testEarlyError("switch(0) { case 0: var a; case 1: let a; }", "Duplicate binding \"a\"");
    testEarlyError("switch(0) { case 0: let a; default: var a; }", "Duplicate binding \"a\"");
    testEarlyError("switch(0) { case 0: var a; default: let a; }", "Duplicate binding \"a\"");
    testEarlyError("switch(0) { default: let a; case 0: var a; }", "Duplicate binding \"a\"");
    testEarlyError("switch(0) { default: var a; case 0: let a; }", "Duplicate binding \"a\"");
    testEarlyError("switch(0) { case 0: const a = 0; case 1: var a; }", "Duplicate binding \"a\"");
    testEarlyError("switch(0) { case 0: var a; case 1: const a = 0; }", "Duplicate binding \"a\"");
    testEarlyError("switch(0) { case 0: const a = 0; default: var a; }", "Duplicate binding \"a\"");
    testEarlyError("switch(0) { case 0: var a; default: const a = 0; }", "Duplicate binding \"a\"");
    testEarlyError("switch(0) { default: const a = 0; case 0: var a; }", "Duplicate binding \"a\"");
    testEarlyError("switch(0) { default: var a; case 0: const a = 0; }", "Duplicate binding \"a\"");

    // 13.13.1
    // It is a Syntax Error if any source text matches this rule.
    //  (see Annex B 3.2)

    // 13.15.1
    // It is a Syntax Error if BoundNames of CatchParameter contains any duplicate elements.
    testEarlyError("try {} catch ([e, e]) {}", "Duplicate binding \"e\"");
    testEarlyError("try {} catch ({e, e}) {}", "Duplicate binding \"e\"");
    testEarlyError("try {} catch ({a: e, b: e}) {}", "Duplicate binding \"e\"");
    testEarlyError("try {} catch ({e = 0, a: e}) {}", "Duplicate binding \"e\"");
    // It is a Syntax Error if any element of the BoundNames of CatchParameter also occurs in the LexicallyDeclaredNames of Block.
    //  (see Annex B 3.5)
    // It is a Syntax Error if any element of the BoundNames of CatchParameter also occurs in the VarDeclaredNames of Block.
    //  (see Annex B 3.5)

    // 14.1.2
    // If the source code matching this production is strict code, the Early Error rules for StrictFormalParameters : FormalParameters are applied.
    testEarlyError("'use strict'; function f(a, a){}", "Duplicate binding \"a\"");
    testEarlyError("'use strict'; function f([a, a]){}", "Duplicate binding \"a\"");
    testModuleEarlyError("export default function(a, a){}", "Duplicate binding \"a\"");
    testModuleEarlyError("export default function([a, a]){}", "Duplicate binding \"a\"");
    testEarlyError("'use strict'; !function(a, a){}", "Duplicate binding \"a\"");
    testEarlyError("'use strict'; !function([a, a]){}", "Duplicate binding \"a\"");
    // If the source code matching this production is strict code, it is a Syntax Error if BindingIdentifier is the IdentifierName eval or the IdentifierName arguments.
    testEarlyError("'use strict'; function eval(){}", "The identifier \"eval\" must not be in binding position in strict mode");
    testEarlyError("'use strict'; function arguments(){}", "The identifier \"arguments\" must not be in binding position in strict mode");
    testEarlyError("'use strict'; !function eval(){}", "The identifier \"eval\" must not be in binding position in strict mode");
    testEarlyError("'use strict'; !function arguments(){}", "The identifier \"arguments\" must not be in binding position in strict mode");
    // It is a Syntax Error if any element of the BoundNames of FormalParameters also occurs in the LexicallyDeclaredNames of FunctionBody.
    testEarlyError("function f(a){ let a; }", "Duplicate binding \"a\"");
    testEarlyError("function f(a){ const a = 0; }", "Duplicate binding \"a\"");
    testModuleEarlyError("export default function(a){ let a; }", "Duplicate binding \"a\"");
    testModuleEarlyError("export default function(a){ const a = 0; }", "Duplicate binding \"a\"");
    testEarlyError("!function(a){ let a; }", "Duplicate binding \"a\"");
    testEarlyError("!function(a){ const a = 0; }", "Duplicate binding \"a\"");
    // It is a Syntax Error if FormalParameters Contains SuperProperty is true.
    testEarlyError("function f(a = super.b){}", "Member access on super must be in a method");
    testEarlyError("!function f(a = super[0]){}", "Member access on super must be in a method");
    testModuleEarlyError("export default function(a = super.b){}", "Member access on super must be in a method");
    testEarlyError("!function(a = super.b){}", "Member access on super must be in a method");
    testEarlyError("!{ a() { function f(a = super.b()){} } };", "Member access on super must be in a method");
    testEarlyError("!{ a() { !function(a = super.b()){} } };", "Member access on super must be in a method");
    testEarlyError("class A extends B { a() { function f(a = super.b()){} } }", "Member access on super must be in a method");
    testEarlyError("class A extends B { a() { !function(a = super.b()){} } }", "Member access on super must be in a method");
    // It is a Syntax Error if FunctionBody Contains SuperProperty is true.
    testEarlyError("function f(a){ super.b }", "Member access on super must be in a method");
    testEarlyError("!function f(a){ super[0] }", "Member access on super must be in a method");
    testModuleEarlyError("export default function(a){ super.b }", "Member access on super must be in a method");
    testEarlyError("!function(a){ super.b }", "Member access on super must be in a method");
    testEarlyError("!{ a() { function f(){ super.b(); } } };", "Member access on super must be in a method");
    testEarlyError("!{ a() { !function(){ super.b(); } } };", "Member access on super must be in a method");
    testEarlyError("class A extends B { a() { function f(){ super.b(); } } }", "Member access on super must be in a method");
    testEarlyError("class A extends B { a() { !function(){ super.b(); } } }", "Member access on super must be in a method");
    // It is a Syntax Error if FormalParameters Contains SuperCall is true.
    testEarlyError("function f(a = super()){}", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    testModuleEarlyError("export default function(a = super()){}", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    testEarlyError("!function(a = super()){}", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    testEarlyError("class A extends B { constructor() { function f(a = super()){} } }", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    testEarlyError("class A extends B { constructor() { !function(a = super()){} } }", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    // It is a Syntax Error if FunctionBody Contains SuperCall is true.
    testEarlyError("function f(a){ super() }", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    testModuleEarlyError("export default function(a){ super() }", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    testEarlyError("!function(a){ super() }", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    testEarlyError("class A extends B { constructor() { function f(){ super(); } } }", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    testEarlyError("class A extends B { constructor() { !function(){ super(); } } }", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    // It is a Syntax Error if BoundNames of FormalParameters contains any duplicate elements.
    testEarlyError("!{ f(a, a){} };", "Duplicate binding \"a\"");
    testEarlyError("!{ f([a, a]){} };", "Duplicate binding \"a\"");
    testEarlyError("!{ f({a, a}){} };", "Duplicate binding \"a\"");
    testEarlyError("!{ *g(a, a){} };", "Duplicate binding \"a\"");
    testEarlyError("!{ *g([a, a]){} };", "Duplicate binding \"a\"");
    testEarlyError("!{ *g({a, a}){} };", "Duplicate binding \"a\"");
    testEarlyError("class A { static f(a, a){} }", "Duplicate binding \"a\"");
    testEarlyError("class A { static f([a, a]){} }", "Duplicate binding \"a\"");
    testEarlyError("class A { static f({a, a}){} }", "Duplicate binding \"a\"");
    testEarlyError("(a, a) => 0;", "Duplicate binding \"a\"");
    testEarlyError("([a, a]) => 0;", "Duplicate binding \"a\"");
    testEarlyError("({a, a}) => 0;", "Duplicate binding \"a\"");
    testEarlyError("(a,...a)=>0", "Duplicate binding \"a\"");
    testEarlyError("([a],...a)=>0", "Duplicate binding \"a\"");
    // It is a Syntax Error if IsSimpleParameterList of FormalParameterList is false and BoundNames of FormalParameterList contains any duplicate elements.
    testEarlyError("function f(a, [a]){}", "Duplicate binding \"a\"");
    testEarlyError("(function([a, a]){})", "Duplicate binding \"a\"");
    testEarlyError("(function({a: x, b: x}){})", "Duplicate binding \"x\"");
    testEarlyError("(function({a: x}, {b: x}){})", "Duplicate binding \"x\"");
    // It is a Syntax Error if the LexicallyDeclaredNames of FunctionStatementList contains any duplicate entries.
    testEarlyError("function f(){ let a; let a; }", "Duplicate binding \"a\"");
    testEarlyError("function f(){ let a; const a = 0; }", "Duplicate binding \"a\"");
    testEarlyError("function f(){ const a = 0; let a; }", "Duplicate binding \"a\"");
    testEarlyError("function f(){ const a = 0; const a = 0; }", "Duplicate binding \"a\"");
    testEarlyError("!function f(){ let a; let a; }", "Duplicate binding \"a\"");
    testEarlyError("!{ f(){ let a; let a; } };", "Duplicate binding \"a\"");
    testEarlyError("!{ *g(){ let a; let a; } };", "Duplicate binding \"a\"");
    testEarlyError("!{ get f(){ let a; let a; } };", "Duplicate binding \"a\"");
    testEarlyError("!{ set f(b){ let a; let a; } };", "Duplicate binding \"a\"");
    testEarlyError("class A { static f(){ let a; let a; } }", "Duplicate binding \"a\"");
    testEarlyError("() => { let a; let a; }", "Duplicate binding \"a\"");
    // It is a Syntax Error if any element of the LexicallyDeclaredNames of FunctionStatementList also occurs in the VarDeclaredNames of FunctionStatementList.
    testEarlyError("function f(){ let a; var a; }", "Duplicate binding \"a\"");
    testEarlyError("function f(){ var a; let a; }", "Duplicate binding \"a\"");
    testEarlyError("function f(){ const a = 0; var a; }", "Duplicate binding \"a\"");
    testEarlyError("function f(){ var a; const a = 0; }", "Duplicate binding \"a\"");
    testEarlyError("!function f(){ let a; var a; }", "Duplicate binding \"a\"");
    testEarlyError("!{ f(){ let a; var a; } };", "Duplicate binding \"a\"");
    testEarlyError("!{ *g(){ let a; var a; } };", "Duplicate binding \"a\"");
    testEarlyError("!{ get f(){ let a; var a; } };", "Duplicate binding \"a\"");
    testEarlyError("!{ set f(b){ let a; var a; } };", "Duplicate binding \"a\"");
    testEarlyError("class A { static f(){ let a; var a; } }", "Duplicate binding \"a\"");
    testEarlyError("() => { let a; var a; }", "Duplicate binding \"a\"");
    // It is a Syntax Error if ContainsDuplicateLabels of FunctionStatementList with argument « » is true.
    testEarlyError("function f(){ label: label: ; }", "Label \"label\" has already been declared");
    testEarlyError("function f(){ label: { label: ; } }", "Label \"label\" has already been declared");
    testEarlyError("function f(){ label: if(0) label: ; }", "Label \"label\" has already been declared");
    // It is a Syntax Error if ContainsUndefinedBreakTarget of FunctionStatementList with argument « » is true.
    testEarlyError("function f(){ break label; }", "Break statement must be nested within a statement with label \"label\"");
    testEarlyError("function f(){ labelA: break labelB; }", "Break statement must be nested within a statement with label \"labelB\"");
    // It is a Syntax Error if ContainsUndefinedContinueTarget of FunctionStatementList with arguments « » and « » is true.
    testEarlyError("function f(){ while(0) continue label; }", "Continue statement must be nested within an iteration statement with label \"label\"");
    testEarlyError("function f(){ labelA: while(0) continue labelB; }", "Continue statement must be nested within an iteration statement with label \"labelB\"");

    // 14.2.1
    // It is a Syntax Error if ArrowParameters Contains YieldExpression is true.
    testEarlyError("function* g(){ (a = yield) => 0; }", "Arrow parameters must not contain yield expressions");
    testEarlyError("function* g(){ (a = yield b) => 0; }", "Arrow parameters must not contain yield expressions");
    testEarlyError("function* g(){ (a = yield* b) => 0; }", "Arrow parameters must not contain yield expressions");
    testEarlyError("function* g(){ (a = x + f(yield)) => 0; }", "Arrow parameters must not contain yield expressions");
    testEarlyError("function* g(){ ({[yield]: a}) => 0; }", "Arrow parameters must not contain yield expressions");
    testEarlyError("function* g(){ ({a = yield}) => 0; }", "Arrow parameters must not contain yield expressions");
    testEarlyError("function* g(){ ([a = yield]) => 0; }", "Arrow parameters must not contain yield expressions");
    // TODO: testEarlyError("function* g(){ (...{a = yield}) => 0; }", "Arrow parameters must not contain yield expressions");
    // It is a Syntax Error if any element of the BoundNames of ArrowParameters also occurs in the LexicallyDeclaredNames of ConciseBody.
    testEarlyError("(a) => { let a; }", "Duplicate binding \"a\"");
    testEarlyError("([a]) => { let a; }", "Duplicate binding \"a\"");
    testEarlyError("({a}) => { let a; }", "Duplicate binding \"a\"");
    testEarlyError("(a) => { const a = 0; }", "Duplicate binding \"a\"");
    testEarlyError("([a]) => { const a = 0; }", "Duplicate binding \"a\"");
    testEarlyError("({a}) => { const a = 0; }", "Duplicate binding \"a\"");
    // If the [Yield] grammar parameter is present on ArrowParameters, it is a Syntax Error if the lexical token sequence matched by CoverParenthesizedExpressionAndArrowParameterList[?Yield] cannot be parsed with no tokens left over using ArrowFormalParameters[Yield, GeneratorParameter] as the goal symbol.
    // TODO
    // If the [Yield] grammar parameter is not present on ArrowParameters, it is a Syntax Error if the lexical token sequence matched by CoverParenthesizedExpressionAndArrowParameterList[?Yield] cannot be parsed with no tokens left over using ArrowFormalParameters as the goal symbol.
    // TODO
    // All early errors rules for ArrowFormalParameters and its derived productions also apply to CoveredFormalsList of CoverParenthesizedExpressionAndArrowParameterList[?Yield].
    // TODO

    // 14.3.1
    // It is a Syntax Error if any element of the BoundNames of StrictFormalParameters also occurs in the LexicallyDeclaredNames of FunctionBody.
    testEarlyError("!{ f(a) { let a; } };", "Duplicate binding \"a\"");
    testEarlyError("!{ f([a]){ let a; } };", "Duplicate binding \"a\"");
    testEarlyError("!{ f({a}){ let a; } };", "Duplicate binding \"a\"");
    // It is a Syntax Error if BoundNames of PropertySetParameterList contains any duplicate elements.
    testEarlyError("!{ set f({a, a}){} };", "Duplicate binding \"a\"");
    testEarlyError("!{ set f([a, a]){} };", "Duplicate binding \"a\"");
    // It is a Syntax Error if any element of the BoundNames of PropertySetParameterList also occurs in the LexicallyDeclaredNames of FunctionBody.
    testEarlyError("!{ set f(a) { let a; } };", "Duplicate binding \"a\"");
    testEarlyError("!{ set f([a]){ let a; } };", "Duplicate binding \"a\"");
    testEarlyError("!{ set f({a}){ let a; } };", "Duplicate binding \"a\"");

    // 14.4.1
    // It is a Syntax Error if HasDirectSuper of GeneratorMethod is true .
    testEarlyError("!{ *f(a = super()){} };", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    testEarlyError("!{ *f(a) { super() } };", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    // It is a Syntax Error if StrictFormalParameters Contains YieldExpression is true.
    testEarlyError("function* g(){ ({ *m(a = yield){} }); }", "Generator parameters must not contain yield expressions");
    testEarlyError("function* g(){ ({ *m(a = yield b){} }); }", "Generator parameters must not contain yield expressions");
    testEarlyError("function* g(){ ({ *m(a = yield* b){} }); }", "Generator parameters must not contain yield expressions");
    testEarlyError("function* g(){ ({ *m(a = x + f(yield)){} }); }", "Generator parameters must not contain yield expressions");
    testEarlyError("function* g(){ ({ *m({[yield]: a}){} }); }", "Generator parameters must not contain yield expressions");
    testEarlyError("function* g(){ ({ *m({a = yield}){} }); }", "Generator parameters must not contain yield expressions");
    testEarlyError("function* g(){ ({ *m([a = yield]){} }); }", "Generator parameters must not contain yield expressions");
    // TODO: testEarlyError("function* g(){ ({ *m(...{a = yield}){} }); }", "Generator parameters must not contain yield expressions");
    // It is a Syntax Error if any element of the BoundNames of StrictFormalParameters also occurs in the LexicallyDeclaredNames of GeneratorBody.
    testEarlyError("!{ *f(a) { let a; } };", "Duplicate binding \"a\"");
    testEarlyError("!{ *f([a]){ let a; } };", "Duplicate binding \"a\"");
    testEarlyError("!{ *f({a}){ let a; } };", "Duplicate binding \"a\"");
    // It is a Syntax Error if HasDirectSuper of GeneratorDeclaration is true .
    testEarlyError("function* f(a = super()){}", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    testEarlyError("function* f(a){ super() }", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    testEarlyError("class A extends B { constructor() { function* f(){ super(); } } }", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    // It is a Syntax Error if HasDirectSuper of GeneratorExpression is true .
    testEarlyError("!function* f(a = super()){}", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    testEarlyError("!function* f(a) { super() }", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    // If the source code matching this production is strict code, the Early Error rules for StrictFormalParameters : FormalParameters are applied.
    testEarlyError("'use strict'; function* f(a, a){}", "Duplicate binding \"a\"");
    testEarlyError("'use strict'; !function*(a, a){}", "Duplicate binding \"a\"");
    // If the source code matching this production is strict code, it is a Syntax Error if BindingIdentifier is the IdentifierName eval or the IdentifierName arguments.
    testEarlyError("'use strict'; function* eval(){}", "The identifier \"eval\" must not be in binding position in strict mode");
    testEarlyError("'use strict'; function* arguments(){}", "The identifier \"arguments\" must not be in binding position in strict mode");
    testEarlyError("'use strict'; !function* eval(){}", "The identifier \"eval\" must not be in binding position in strict mode");
    testEarlyError("'use strict'; !function* arguments(){}", "The identifier \"arguments\" must not be in binding position in strict mode");
    // It is a Syntax Error if any element of the BoundNames of FormalParameters also occurs in the LexicallyDeclaredNames of GeneratorBody.
    testEarlyError("function* f(a) { let a; }", "Duplicate binding \"a\"");
    testEarlyError("function* f([a]){ let a; }", "Duplicate binding \"a\"");
    testEarlyError("function* f({a}){ let a; }", "Duplicate binding \"a\"");
    // It is a Syntax Error if FormalParameters Contains YieldExpression is true.
    testEarlyError("function* g(){ function* f(a = yield){} }", "Generator parameters must not contain yield expressions");
    testEarlyError("function* g(){ function* f(a = yield b){} }", "Generator parameters must not contain yield expressions");
    testEarlyError("function* g(){ function* f(a = yield* b){} }", "Generator parameters must not contain yield expressions");
    testEarlyError("function* g(){ function* f(a = x + f(yield)){} }", "Generator parameters must not contain yield expressions");
    testEarlyError("function* g(){ function* f({[yield]: a}){} }", "Generator parameters must not contain yield expressions");
    testEarlyError("function* g(){ function* f({a = yield}){} }", "Generator parameters must not contain yield expressions");
    testEarlyError("function* g(){ function* f([a = yield]){} }", "Generator parameters must not contain yield expressions");
    // TODO: testEarlyError("function* g(){ function* f(...{a = yield}){} }", "Generator parameters must not contain yield expressions");
    testEarlyError("function* g(){ !function*(a = yield){} }", "Generator parameters must not contain yield expressions");
    testEarlyError("function* g(){ !function*(a = yield b){} }", "Generator parameters must not contain yield expressions");
    testEarlyError("function* g(){ !function*(a = yield* b){} }", "Generator parameters must not contain yield expressions");
    testEarlyError("function* g(){ !function*(a = x + f(yield)){} }", "Generator parameters must not contain yield expressions");
    testEarlyError("function* g(){ !function*({[yield]: a}){} }", "Generator parameters must not contain yield expressions");
    testEarlyError("function* g(){ !function*({a = yield}){} }", "Generator parameters must not contain yield expressions");
    testEarlyError("function* g(){ !function*([a = yield]){} }", "Generator parameters must not contain yield expressions");
    // TODO: testEarlyError("function* g(){ !function*(...{a = yield}){} }", "Generator parameters must not contain yield expressions");
    // It is a Syntax Error if FormalParameters Contains SuperProperty is true.
    testEarlyError("function* f(a = super.b){}", "Member access on super must be in a method");
    testEarlyError("!function* (a = super.b){}", "Member access on super must be in a method");
    testEarlyError("!{ a() { function* f(a = super.b()){} } };", "Member access on super must be in a method");
    testEarlyError("!{ a() { !function* (a = super.b()){} } };", "Member access on super must be in a method");
    testEarlyError("class A extends B { a() { function* f(a = super.b()){} } }", "Member access on super must be in a method");
    testEarlyError("class A extends B { a() { !function* (a = super.b()){} } }", "Member access on super must be in a method");
    // It is a Syntax Error if GeneratorBody Contains SuperProperty is true.
    testEarlyError("function* f(a){ super.b }", "Member access on super must be in a method");
    testEarlyError("!function* (a){ super.b }", "Member access on super must be in a method");
    testEarlyError("!{ a() { function* f(){ super.b(); } } };", "Member access on super must be in a method");
    testEarlyError("!{ a() { !function* (){ super.b(); } } };", "Member access on super must be in a method");
    testEarlyError("class A extends B { a() { function* f(){ super.b(); } } }", "Member access on super must be in a method");
    testEarlyError("class A extends B { a() { !function* (){ super.b(); } } }", "Member access on super must be in a method");

    // 14.5.1
    // It is a Syntax Error if ClassHeritage is not present and the following algorithm evaluates to true:
    //   1. Let constructor be ConstructorMethod of ClassBody.
    //   2. If constructor is empty, return false.
    //   3. Return HasDirectSuper of constructor.
    testEarlyError("class A { constructor() { super(); } }", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    testEarlyError("class A { constructor() { {{ (( super() )); }} } }", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    // It is a Syntax Error if PrototypePropertyNameList of ClassElementList contains more than one occurrence of "constructor".
    testEarlyError("class A { constructor(){} constructor(){} }", "Duplicate constructor method in class");
    testEarlyError("class A { constructor(){} \"constructor\"(){} }", "Duplicate constructor method in class");
    testEarlyError("!class A { constructor(){} constructor(){} }", "Duplicate constructor method in class");
    testEarlyError("!class A { constructor(){} \"constructor\"(){} }", "Duplicate constructor method in class");
    // It is a Syntax Error if PropName of MethodDefinition is not "constructor" and HasDirectSuper of MethodDefinition is true.
    testEarlyError("class A extends B { f() { super(); } }", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    // It is a Syntax Error if PropName of MethodDefinition is "constructor" and SpecialMethod of MethodDefinition is true.
    testEarlyError("class A { *constructor(){} }", "Constructors cannot be generators, getters or setters");
    testEarlyError("class A { get constructor(){} }", "Constructors cannot be generators, getters or setters");
    testEarlyError("class A { set constructor(a) {} }", "Constructors cannot be generators, getters or setters");
    // It is a Syntax Error if HasDirectSuper of MethodDefinition is true.
    testEarlyError("class A extends B { static f() { super(); } }", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    // It is a Syntax Error if PropName of MethodDefinition is "prototype".
    testEarlyError("class A extends B { static prototype(){} }", "Static class methods cannot be named \"prototype\"");
    testEarlyError("class A extends B { static *prototype(){} }", "Static class methods cannot be named \"prototype\"");
    testEarlyError("class A extends B { static get prototype(){} }", "Static class methods cannot be named \"prototype\"");
    testEarlyError("class A extends B { static set prototype(a) {} }", "Static class methods cannot be named \"prototype\"");

    // 15.1.1
    // It is a Syntax Error if the LexicallyDeclaredNames of StatementList contains any duplicate entries.
    testEarlyError("let a; let a;", "Duplicate binding \"a\"");
    testEarlyError("let a; const a = 0;", "Duplicate binding \"a\"");
    testEarlyError("const a = 0; let a;", "Duplicate binding \"a\"");
    testEarlyError("const a = 0; const a = 0;", "Duplicate binding \"a\"");
    // It is a Syntax Error if any element of the LexicallyDeclaredNames of StatementList also occurs in the VarDeclaredNames of StatementList.
    testEarlyError("let a; var a;", "Duplicate binding \"a\"");
    testEarlyError("var a; let a;", "Duplicate binding \"a\"");
    testEarlyError("const a = 0; var a;", "Duplicate binding \"a\"");
    testEarlyError("var a; const a = 0;", "Duplicate binding \"a\"");
    // It is a Syntax Error if StatementList Contains super unless the source code containing super is eval code that is being processed by a direct eval that is contained in function code. However, such function code does not include ArrowFunction function code.
    testEarlyError("super()", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    testEarlyError("super.a", "Member access on super must be in a method");
    // It is a Syntax Error if StatementList Contains NewTarget unless the source code containing NewTarget is eval code that is being processed by a direct eval that is contained in function code. However, such function code does not include ArrowFunction function code.
    testEarlyError("new.target", "new.target must be within function (but not arrow expression) code");
    // It is a Syntax Error if ContainsDuplicateLabels of StatementList with argument « » is true.
    testEarlyError("label: label: ;", "Label \"label\" has already been declared");
    // It is a Syntax Error if ContainsUndefinedBreakTarget of StatementList with argument « » is true.
    testEarlyError("break label;", "Break statement must be nested within a statement with label \"label\"");
    testEarlyError("labelA: break labelB;", "Break statement must be nested within a statement with label \"labelB\"");
    // It is a Syntax Error if ContainsUndefinedContinueTarget of StatementList with arguments « » and « » is true.
    testEarlyError("while(0) continue label;", "Continue statement must be nested within an iteration statement with label \"label\"");
    testEarlyError("labelA: while(0) continue labelB;", "Continue statement must be nested within an iteration statement with label \"labelB\"");

    // 15.2.1.1
    // It is a Syntax Error if the LexicallyDeclaredNames of ModuleItemList contains any duplicate entries.
    testModuleEarlyError("let a; let a;", "Duplicate binding \"a\"");
    testModuleEarlyError("let a; function a(){}", "Duplicate binding \"a\"");
    testModuleEarlyError("let a; const a = 0;", "Duplicate binding \"a\"");
    testModuleEarlyError("const a = 0; let a;", "Duplicate binding \"a\"");
    testModuleEarlyError("const a = 0; const a = 0;", "Duplicate binding \"a\"");
    testModuleEarlyError("let a; export class a {};", "Duplicate binding \"a\"");
    testModuleEarlyError("let a; export function a(){};", "Duplicate binding \"a\"");
    testModuleEarlyError("let a; export let a;", "Duplicate binding \"a\"");
    testModuleEarlyError("let a; export const a = 0;", "Duplicate binding \"a\"");
    testModuleEarlyError("const a = 0; export class a {};", "Duplicate binding \"a\"");
    testModuleEarlyError("const a = 0; export function a(){};", "Duplicate binding \"a\"");
    testModuleEarlyError("const a = 0; export let a;", "Duplicate binding \"a\"");
    testModuleEarlyError("const a = 0; export const a = 1;", "Duplicate binding \"a\"");
    // It is a Syntax Error if any element of the LexicallyDeclaredNames of ModuleItemList also occurs in the VarDeclaredNames of ModuleItemList.
    testModuleEarlyError("let a; var a;", "Duplicate binding \"a\"");
    testModuleEarlyError("var a; function a(){}", "Duplicate binding \"a\"");
    testModuleEarlyError("var a; let a;", "Duplicate binding \"a\"");
    testModuleEarlyError("const a = 0; var a;", "Duplicate binding \"a\"");
    testModuleEarlyError("var a; const a = 0;", "Duplicate binding \"a\"");
    testModuleEarlyError("var a; export class a {};", "Duplicate binding \"a\"");
    testModuleEarlyError("var a; export function a(){};", "Duplicate binding \"a\"");
    testModuleEarlyError("var a; export let a;", "Duplicate binding \"a\"");
    testModuleEarlyError("var a; export const a = 0;", "Duplicate binding \"a\"");
    // It is a Syntax Error if the ExportedNames of ModuleItemList contains any duplicate entries.
    testModuleEarlyError("export var a; export var a;", "Duplicate export \"a\"");
    testModuleEarlyError("let a; export {a, a};", "Duplicate export \"a\"");
    testModuleEarlyError("let a, b; export {a, b as a};", "Duplicate export \"a\"");
    testModuleEarlyError("let a; export {a, a as a};", "Duplicate export \"a\"");
    testModuleEarlyError("export {a}; export class a{};", "Duplicate export \"a\"");
    testModuleEarlyError("export {a}; export function a(){};", "Duplicate export \"a\"");
    testModuleEarlyError("export let a; export {a};", "Duplicate export \"a\"");
    testModuleEarlyError("export {a}; export const a = 0;", "Duplicate export \"a\"");
    testModuleEarlyError("export let a; let b; export {b as a};", "Duplicate export \"a\"");
    testModuleEarlyError("export default 0; export default 0;", "Duplicate export \"*default*\"");
    testModuleEarlyError("export default 0; export default function f(){};", "Duplicate export \"*default*\"");
    testModuleEarlyError("export default 0; export default class a {};", "Duplicate export \"*default*\"");
    // It is a Syntax Error if any element of the ExportedBindings of ModuleItemList does not also occur in either the VarDeclaredNames of ModuleItemList, or the LexicallyDeclaredNames of ModuleItemList.
    testModuleEarlyError("export {a};", "Exported binding \"a\" is not declared");
    testModuleEarlyError("export {b as a};", "Exported binding \"b\" is not declared");
    testModuleEarlyError("var a; export {b as a};", "Exported binding \"b\" is not declared");
    testModuleEarlyError("export {a as b}; var b;", "Exported binding \"a\" is not declared");
    testModuleEarlyError("export {b as a};", "Exported binding \"b\" is not declared");
    testModuleEarlyError("let a; export {b as a};", "Exported binding \"b\" is not declared");
    testModuleEarlyError("export {a as b}; let b;", "Exported binding \"a\" is not declared");
    // It is a Syntax Error if ModuleItemList Contains super.
    testModuleEarlyError("super()", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    testModuleEarlyError("super.a", "Member access on super must be in a method");
    // It is a Syntax Error if ModuleItemList Contains NewTarget
    testModuleEarlyError("new.target", "new.target must be within function (but not arrow expression) code");
    // It is a Syntax Error if ContainsDuplicateLabels of ModuleItemList with argument « » is true.
    testModuleEarlyError("label: label: ;", "Label \"label\" has already been declared");
    // It is a Syntax Error if ContainsUndefinedBreakTarget of ModuleItemList with argument « » is true.
    testModuleEarlyError("break label;", "Break statement must be nested within a statement with label \"label\"");
    testModuleEarlyError("labelA: break labelB;", "Break statement must be nested within a statement with label \"labelB\"");
    // It is a Syntax Error if ContainsUndefinedContinueTarget of ModuleItemList with arguments « » and « » is true.
    testModuleEarlyError("while(0) continue label;", "Continue statement must be nested within an iteration statement with label \"label\"");
    testModuleEarlyError("labelA: while(0) continue labelB;", "Continue statement must be nested within an iteration statement with label \"labelB\"");

    // 15.2.2.1
    // It is a Syntax Error if the BoundNames of ImportDeclaration contains any duplicate entries.
    testModuleEarlyError("import a, * as a from \"module\";", "Duplicate binding \"a\"");
    testModuleEarlyError("import a, {a} from \"module\";", "Duplicate binding \"a\"");
    testModuleEarlyError("import a, {b as a} from \"module\";", "Duplicate binding \"a\"");
    testModuleEarlyError("import {a, b as a} from \"module\";", "Duplicate binding \"a\"");
    testModuleEarlyError("import {a, a} from \"module\";", "Duplicate binding \"a\"");
    testModuleEarlyError("import {b as a, c as a} from \"module\";", "Duplicate binding \"a\"");

    // 15.2.3.1
    // For each IdentifierName n in ReferencedBindings of ExportClause : It is a Syntax Error if StringValue of n is a ReservedWord or if the StringValue of n is one of: "implements", "interface", "let", "package", "private", "protected", "public", "static", or "yield".
    // TODO

    // Annex B 3.1 (12.2.5.1)
    // It is a Syntax Error if PropertyNameList of PropertyDefinitionList contains any duplicate entries for "__proto__" and at least two of those entries were obtained from productions of the form PropertyDefinition : PropertyName : AssignmentExpression .
    testEarlyError("!{ __proto__: null, __proto__: null };", "Duplicate __proto__ property in object literal not allowed");
    testEarlyError("!{ __proto__: null, \"__proto__\": null };", "Duplicate __proto__ property in object literal not allowed");
    testEarlyError("!{ __proto__: null, __proto__: null, };", "Duplicate __proto__ property in object literal not allowed");

    // Annex B 3.2 (13.12.1)
    // It is a Syntax Error if any strict mode source code matches this rule.
    testEarlyError("'use strict'; label: function f(){}", "Labeled FunctionDeclarations are disallowed in strict mode");

    // Annex B 3.4
    // The above rules are only applied when parsing code that is not strict mode code
    testEarlyError("'use strict'; if (0) function f(){}", "FunctionDeclarations in IfStatements are disallowed in strict mode");
    testEarlyError("'use strict'; if (0) function f(){} else;", "FunctionDeclarations in IfStatements are disallowed in strict mode");
    testEarlyError("'use strict'; if (0); else function f(){}", "FunctionDeclarations in IfStatements are disallowed in strict mode");

    // Annex B 3.5 (13.14.1)
    // It is a Syntax Error if any element of the BoundNames of CatchParameter also occurs in the LexicallyDeclaredNames of Block.
    testEarlyError("try {} catch(e) { let e; }", "Duplicate binding \"e\"");
    testEarlyError("try {} catch(e) { function e(){} }", "Duplicate binding \"e\"");
    // It is a Syntax Error if any element of the BoundNames of CatchParameter also occurs in the VarDeclaredNames of Block,
    // unless that element is only bound by a VariableStatement or the VariableDeclarationList of a for statement,
    // or the ForBinding of a for-in statement.
    testEarlyError("try {} catch(e) { for(var e of 0); }", "Duplicate binding \"e\"");

  });

  suite("early error locations", function () {

    test("location disabled", function () {
      try {
        parse("super()", { loc: false, earlyErrors: true });
        expect().fail();
      } catch(e) {
        expect(e.index).to.be(0);
        expect(e.line).to.be(1);
        expect(e.column).to.be(0);
      }
      try {
        parse("\n\n  super()", { loc: false, earlyErrors: true });
        expect().fail();
      } catch(e) {
        expect(e.index).to.be(0);
        expect(e.line).to.be(1);
        expect(e.column).to.be(0);
      }
    });

    test("location enabled", function () {
      try {
        parse("super()", { loc: true, earlyErrors: true });
        expect().fail();
      } catch(e) {
        expect(e.index).to.be(0);
        expect(e.line).to.be(1);
        expect(e.column).to.be(0);
      }
      try {
        parse("\n\n  super()", { loc: true, earlyErrors: true });
        expect().fail();
      } catch(e) {
        expect(e.index).to.be(4);
        expect(e.line).to.be(3);
        expect(e.column).to.be(2);
      }
    });

  });

});
