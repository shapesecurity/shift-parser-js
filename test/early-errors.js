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

var testParseFailure = require("./assertions").testParseFailure;
var testParseModuleFailure = require("./assertions").testParseModuleFailure;

suite("Parser", function () {

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
    testParseFailure("'use strict'; arguments = 0", "The identifier \"arguments\" must not be in binding position in strict mode");
    testParseFailure("'use strict'; arguments *= 0", "The identifier \"arguments\" must not be in binding position in strict mode");

    testParseFailure("'use strict'; [eval] = 0", "The identifier \"eval\" must not be in binding position in strict mode");
    testParseFailure("'use strict'; [,,,eval,] = 0", "The identifier \"eval\" must not be in binding position in strict mode");
    testParseFailure("'use strict'; ({a: eval} = 0)", "The identifier \"eval\" must not be in binding position in strict mode");
    testParseFailure("'use strict'; ({a: eval = 0} = 0)", "The identifier \"eval\" must not be in binding position in strict mode");

    testParseFailure("'use strict'; [arguments] = 0", "The identifier \"arguments\" must not be in binding position in strict mode");
    testParseFailure("'use strict'; [,,,arguments,] = 0", "The identifier \"arguments\" must not be in binding position in strict mode");
    testParseFailure("'use strict'; ({a: arguments} = 0)", "The identifier \"arguments\" must not be in binding position in strict mode");
    testParseFailure("'use strict'; ({a: arguments = 0} = 0)", "The identifier \"arguments\" must not be in binding position in strict mode");

    testParseFailure("'use strict'; var eval;", "The identifier \"eval\" must not be in binding position in strict mode");
    testParseFailure("'use strict'; var arguments;", "The identifier \"arguments\" must not be in binding position in strict mode");
    testParseFailure("'use strict'; let [eval] = 0;", "The identifier \"eval\" must not be in binding position in strict mode");
    testParseFailure("'use strict'; const {a: eval} = 0;", "The identifier \"eval\" must not be in binding position in strict mode");
    testParseModuleFailure("var eval;", "The identifier \"eval\" must not be in binding position in strict mode");

    testParseModuleFailure("eval=>0", "The identifier \"eval\" must not be in binding position in strict mode");
    testParseFailure("'use strict'; eval=>0", "The identifier \"eval\" must not be in binding position in strict mode");
    testParseFailure("'use strict'; arguments=>0", "The identifier \"arguments\" must not be in binding position in strict mode");
    testParseFailure("'use strict'; (eval)=>0", "The identifier \"eval\" must not be in binding position in strict mode");
    testParseFailure("'use strict'; (arguments)=>0", "The identifier \"arguments\" must not be in binding position in strict mode");

    testParseFailure("'use strict'; function f(eval){}", "The identifier \"eval\" must not be in binding position in strict mode");
    testParseFailure("function f(eval){ 'use strict'; }", "The identifier \"eval\" must not be in binding position in strict mode");
    testParseFailure("'use strict'; !function (eval){}", "The identifier \"eval\" must not be in binding position in strict mode");
    testParseFailure("!function (eval){ 'use strict'; }", "The identifier \"eval\" must not be in binding position in strict mode");
    testParseFailure("'use strict'; function* f(eval){}", "The identifier \"eval\" must not be in binding position in strict mode");
    testParseFailure("function* f(eval){ 'use strict'; }", "The identifier \"eval\" must not be in binding position in strict mode");
    testParseFailure("'use strict'; !function* (eval){}", "The identifier \"eval\" must not be in binding position in strict mode");
    testParseFailure("!function* (eval){ 'use strict'; }", "The identifier \"eval\" must not be in binding position in strict mode");
    testParseFailure("!{ f(eval){ 'use strict'; } };", "The identifier \"eval\" must not be in binding position in strict mode");
    testParseFailure("!{ *f(eval){ 'use strict'; } };", "The identifier \"eval\" must not be in binding position in strict mode");
    testParseFailure("'use strict'; !{ set f(eval){} };", "The identifier \"eval\" must not be in binding position in strict mode");
    testParseFailure("!{ set f(eval){ 'use strict'; } };", "The identifier \"eval\" must not be in binding position in strict mode");
    testParseFailure("class A { f(eval){} };", "The identifier \"eval\" must not be in binding position in strict mode");
    testParseFailure("class A { *f(eval){} };", "The identifier \"eval\" must not be in binding position in strict mode");
    testParseFailure("class A { set f(eval){} };", "The identifier \"eval\" must not be in binding position in strict mode");
    // It is a Syntax Error if the code matched by this production is contained in strict code.
    testParseFailure("'use strict'; +yield;", "The identifier \"yield\" must not be in expression position in strict mode");
    testParseFailure("'use strict'; yield:;", "The identifier \"yield\" must not be in label position in strict mode");
    testParseFailure("'use strict'; var [yield] = 0;", "The identifier \"yield\" must not be in binding position in strict mode");
    // It is a Syntax Error if this phrase is contained in strict code and the StringValue of IdentifierName is: "implements", "interface", "let", "package", "private", "protected", "public", "static", or "yield".
    testParseFailure("'use strict'; +implements;", "The identifier \"implements\" must not be in expression position in strict mode");
    testParseFailure("'use strict'; +interface;", "The identifier \"interface\" must not be in expression position in strict mode");
    testParseFailure("'use strict'; +let;", "The identifier \"let\" must not be in expression position in strict mode");
    testParseFailure("'use strict'; +package;", "The identifier \"package\" must not be in expression position in strict mode");
    testParseFailure("'use strict'; +private;", "The identifier \"private\" must not be in expression position in strict mode");
    testParseFailure("'use strict'; +protected;", "The identifier \"protected\" must not be in expression position in strict mode");
    testParseFailure("'use strict'; +public;", "The identifier \"public\" must not be in expression position in strict mode");
    testParseFailure("'use strict'; +static;", "The identifier \"static\" must not be in expression position in strict mode");
    testParseFailure("'use strict'; +yield;", "The identifier \"yield\" must not be in expression position in strict mode");
    testParseFailure("function a(yield){ 'use strict'; }", "The identifier \"yield\" must not be in binding position in strict mode");
    testParseFailure("function a(){ 'use strict'; function a(a=yield){}}", "The identifier \"yield\" must not be in expression position in strict mode");
    testParseFailure("function a(){ 'use strict'; function* a(yield){}}", "Generator functions must not have parameters named \"yield\"");
    testParseFailure("function a(){ 'use strict'; function a(yield){}}", "The identifier \"yield\" must not be in binding position in strict mode");
    testParseFailure("function a([yield]){ 'use strict'; }", "The identifier \"yield\" must not be in binding position in strict mode");
    testParseFailure("function a({yield}){ 'use strict'; }", "The identifier \"yield\" must not be in binding position in strict mode");
    testParseFailure("function a({yield=0}){ 'use strict'; }", "The identifier \"yield\" must not be in binding position in strict mode");
    testParseFailure("function a({a:yield}){ 'use strict'; }", "The identifier \"yield\" must not be in binding position in strict mode");
    testParseFailure("function a([yield,...a]){ 'use strict'; }", "The identifier \"yield\" must not be in binding position in strict mode");
    testParseFailure("class A {set a(yield){}}", "The identifier \"yield\" must not be in binding position in strict mode");
    testParseFailure("package => {'use strict'}", "The identifier \"package\" must not be in binding position in strict mode");
    testParseFailure("(package) => {'use strict'}", "The identifier \"package\" must not be in binding position in strict mode");
    testParseFailure("([let]) => {'use strict'}", "The identifier \"let\" must not be in binding position in strict mode");
    testParseFailure("({a(yield){ 'use strict'; }})", "The identifier \"yield\" must not be in binding position in strict mode");
    testParseFailure("!{ get a() { 'use strict'; +let; } }", "The identifier \"let\" must not be in expression position in strict mode");
    testParseFailure("!{ set a(let) { 'use strict'; } }", "The identifier \"let\" must not be in binding position in strict mode");
    testParseFailure("!{ a(let) { 'use strict'; } }", "The identifier \"let\" must not be in binding position in strict mode");
    testParseFailure("!{ a(let) { 'use strict'; } }", "The identifier \"let\" must not be in binding position in strict mode");
    // It is a Syntax Error if StringValue of IdentifierName is the same string value as the StringValue of any ReservedWord except for yield.
    // TODO: these should fail but will not
    //testParseFailure("(i\\u006E)", "Unexpected token \"in\"");
    //testParseFailure("var i\\u006E;", "Unexpected token \"in\"");
    //testParseModuleFailure("import {a as i\\u006E} from \"module\";", "Unexpected token \"in\"");

    // 12.2.5.1
    // It is a Syntax Error if HasDirectSuper of MethodDefinition is true.
    testParseFailure("({ a(){ super(); } });", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    testParseFailure("({ a(){ {{ if(0) (( super() )); }} } });", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    testParseFailure("class A extends B { constructor() { !{constructor() { super(); }}; } }", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    testParseFailure("class A extends B { constructor() { !{*constructor() { super(); }}; } }", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    testParseFailure("class A extends B { constructor() { !{get constructor() { super(); }}; } }", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    testParseFailure("class A extends B { constructor() { !{set constructor(a) { super(); }}; } }", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");

    // 12.2.7.1
    // It is a Syntax Error if BodyText of RegularExpressionLiteral cannot be recognized using the goal symbol Pattern of the ECMAScript RegExp grammar specified in 21.2.1.
    testParseFailure("/?/", "Invalid regular expression pattern");
    testParseFailure("/(/", "Invalid regular expression pattern");
    testParseFailure("/(a/", "Invalid regular expression pattern");
    testParseFailure("/\\1/", "Invalid regular expression pattern");
    testParseFailure("/(()(?:\\3)(()))/", "Invalid regular expression pattern");
    testParseFailure("/(\\01)/", "Invalid regular expression pattern");
    testParseFailure("/((((((((((((.))))))))))))\\13/", "Invalid regular expression pattern");
    testParseFailure("/}?/", "Invalid regular expression pattern");
    testParseFailure("/{*/", "Invalid regular expression pattern");
    testParseFailure("/(?=.)*/u", "Invalid regular expression pattern");
    // It is a Syntax Error if FlagText of RegularExpressionLiteral contains any code points other than "g", "i", "m", "u", or "y", or if it contains the same code point more than once.
    testParseFailure("/./a", "Invalid regular expression flags");
    testParseFailure("/./ii", "Invalid regular expression flags");

    // 12.4.1
    // It is an early Reference Error if IsValidSimpleAssignmentTarget of LeftHandSideExpression is false.
    testParseFailure("0++", "Increment/decrement target must be an identifier or member expression");
    testParseFailure("0--", "Increment/decrement target must be an identifier or member expression");

    // 12.5.1
    // It is an early Reference Error if IsValidSimpleAssignmentTarget of UnaryExpression is false.
    testParseFailure("++0", "Increment/decrement target must be an identifier or member expression");
    testParseFailure("--0", "Increment/decrement target must be an identifier or member expression");

    // 12.5.4.1
    // It is a Syntax Error if the UnaryExpression is contained in strict code and the derived UnaryExpression is PrimaryExpression : IdentifierReference.
    testParseFailure("'use strict'; delete a;", "Identifier expressions must not be deleted in strict mode");
    // It is a Syntax Error if the derived UnaryExpression is PrimaryExpression : CoverParenthesizedExpressionAndArrowParameterList and CoverParenthesizedExpressionAndArrowParameterList ultimately derives a phrase that, if used in place of UnaryExpression, would produce a Syntax Error according to these rules. This rule is recursively applied.
    testParseFailure("'use strict'; delete (a);", "Identifier expressions must not be deleted in strict mode");
    testParseFailure("'use strict'; delete ((a));", "Identifier expressions must not be deleted in strict mode");

    // 12.14.5.1
    // It is a Syntax Error if IsValidSimpleAssignmentTarget of IdentifierReference is false.
    testParseFailure("'use strict'; ({eval} = 0);", "The identifier \"eval\" must not be in binding position in strict mode");
    testParseFailure("'use strict'; ({eval = 0} = 0);", "The identifier \"eval\" must not be in binding position in strict mode");
    testParseFailure("'use strict'; ({arguments} = 0);", "The identifier \"arguments\" must not be in binding position in strict mode");
    testParseFailure("'use strict'; ({arguments = 0} = 0);", "The identifier \"arguments\" must not be in binding position in strict mode");

    // 13.1.1
    // It is a Syntax Error if the LexicallyDeclaredNames of StatementList contains any duplicate entries.
    testParseFailure("{ let a; let a; }", "Duplicate binding \"a\"");
    testParseFailure("{ let a; const a = 0; }", "Duplicate binding \"a\"");
    testParseFailure("{ const a = 0; let a; }", "Duplicate binding \"a\"");
    testParseFailure("{ const a = 0; const a = 0; }", "Duplicate binding \"a\"");
    testParseFailure("{ function a(){} function a(){} }", "Duplicate binding \"a\"");
    testParseFailure("{ function a(){} function* a(){} }", "Duplicate binding \"a\"");
    testParseFailure("{ let a; function a(){} }", "Duplicate binding \"a\"");
    testParseFailure("{ const a = 0; function a(){} }", "Duplicate binding \"a\"");
    // It is a Syntax Error if any element of the LexicallyDeclaredNames of StatementList also occurs in the VarDeclaredNames of StatementList.
    testParseFailure("{ let a; var a; }", "Duplicate binding \"a\"");
    testParseFailure("{ let a; { var a; } }", "Duplicate binding \"a\"");
    testParseFailure("{ var a; let a; }", "Duplicate binding \"a\"");
    testParseFailure("{ const a = 0; var a; }", "Duplicate binding \"a\"");
    testParseFailure("{ var a; const a = 0; }", "Duplicate binding \"a\"");

    // 13.2.1.1
    // It is a Syntax Error if the BoundNames of BindingList contains "let".
    testParseFailure("let let;", "Lexical declarations must not have a binding named \"let\"");
    testParseFailure("let a, let;", "Lexical declarations must not have a binding named \"let\"");
    testParseFailure("let a, let = 0;", "Lexical declarations must not have a binding named \"let\"");
    // It is a Syntax Error if the BoundNames of BindingList contains any duplicate entries.
    testParseFailure("let a, a;", "Duplicate binding \"a\"");
    testParseFailure("let a, b, a;", "Duplicate binding \"a\"");
    testParseFailure("let a = 0, a = 1;", "Duplicate binding \"a\"");
    testParseFailure("const a = 0, a = 1;", "Duplicate binding \"a\"");
    testParseFailure("const a = 0, b = 1, a = 2;", "Duplicate binding \"a\"");
    testParseFailure("let a, [a] = 0;", "Duplicate binding \"a\"");
    testParseFailure("let [a, a] = 0;", "Duplicate binding \"a\"");
    testParseFailure("let [a, ...a] = 0;", "Duplicate binding \"a\"");
    testParseFailure("let \\u{61}, \\u{0061};", "Duplicate binding \"a\"");
    testParseFailure("let \\u0061, \\u{0061};", "Duplicate binding \"a\"");
    testParseFailure("let x\\u{61}, x\\u{0061};", "Duplicate binding \"xa\"");
    testParseFailure("let x\\u{E01D5}, x\uDB40\uDDD5;", "Duplicate binding \"x\uDB40\uDDD5\"");
    testParseFailure("let x\\u{E01D5}, x\\uDB40\\uDDD5;", "Duplicate binding \"x\uDB40\uDDD5\"");
    testParseFailure("for(let a, a;;);", "Duplicate binding \"a\"");
    // It is a Syntax Error if Initializer is not present and IsConstantDeclaration of the LexicalDeclaration containing this production is true.
    testParseFailure("const a;", "Constant lexical declarations must have an initialiser");
    testParseFailure("const a, b = 0;", "Constant lexical declarations must have an initialiser");
    testParseFailure("const a = 0, b;", "Constant lexical declarations must have an initialiser");
    testParseFailure("{ const a; }", "Constant lexical declarations must have an initialiser");
    testParseFailure("function f(){ const a; }", "Constant lexical declarations must have an initialiser");

    // 13.5.1
    // It is a Syntax Error if IsLabelledFunction(Statement) is true for any occurrence of Statement in these rules.
    testParseFailure("if(0) label: function f(){}", "The consequent of an if statement must not be a labeled function declaration");
    testParseFailure("if(0) labelA: labelB: function f(){}", "The consequent of an if statement must not be a labeled function declaration");
    testParseFailure("if(0) label: function f(){} else ;", "The consequent of an if statement must not be a labeled function declaration");
    testParseFailure("if(0) ; else label: function f(){}", "The alternate of an if statement must not be a labeled function declaration");
    testParseFailure("if(0) labelA: function f(){} else labelB: function g(){}", "The consequent of an if statement must not be a labeled function declaration");

    // 13.6.0.1
    // It is a Syntax Error if IsLabelledFunction(Statement) is true for any occurrence of Statement in these rules.
    testParseFailure("do label: function f(){} while (0)", "The body of a do-while statement must not be a labeled function declaration");
    testParseFailure("do label: function f(){} while (0);", "The body of a do-while statement must not be a labeled function declaration");
    testParseFailure("while(0) label: function f(){}", "The body of a while statement must not be a labeled function declaration");
    testParseFailure("for(;;) label: function f(){}", "The body of a for statement must not be a labeled function declaration");
    testParseFailure("for(var a;;) label: function f(){}", "The body of a for statement must not be a labeled function declaration");
    testParseFailure("for(const a = 0;;) label: function f(){}", "The body of a for statement must not be a labeled function declaration");
    testParseFailure("for(let a;;) label: function f(){}", "The body of a for statement must not be a labeled function declaration");
    testParseFailure("for(a in b) label: function f(){}", "The body of a for-in statement must not be a labeled function declaration");
    testParseFailure("for(var a in b) label: function f(){}", "The body of a for-in statement must not be a labeled function declaration");
    testParseFailure("for(let a in b) label: function f(){}", "The body of a for-in statement must not be a labeled function declaration");
    testParseFailure("for(const a in b) label: function f(){}", "The body of a for-in statement must not be a labeled function declaration");
    testParseFailure("for(a of b) label: function f(){}", "The body of a for-of statement must not be a labeled function declaration");
    testParseFailure("for(var a of b) label: function f(){}", "The body of a for-of statement must not be a labeled function declaration");
    testParseFailure("for(let a of b) label: function f(){}", "The body of a for-of statement must not be a labeled function declaration");
    testParseFailure("for(const a of b) label: function f(){}", "The body of a for-of statement must not be a labeled function declaration");
    testParseFailure("for(;;) labelA: labelB: labelC: function f(){}", "The body of a for statement must not be a labeled function declaration");

    // 13.6.3.1
    // It is a Syntax Error if any element of the BoundNames of LexicalDeclaration also occurs in the VarDeclaredNames of Statement.
    testParseFailure("for(let a;;) { var a; }", "Duplicate binding \"a\"");
    testParseFailure("for(const a = 0;;) { var a; }", "Duplicate binding \"a\"");

    // 13.6.4.1
    // It is a Syntax Error if the BoundNames of ForDeclaration contains "let".
    testParseFailure("for(let let in 0);", "Lexical declarations must not have a binding named \"let\"");
    testParseFailure("for(const let in 0);", "Lexical declarations must not have a binding named \"let\"");
    testParseFailure("for(let let of 0);", "Lexical declarations must not have a binding named \"let\"");
    testParseFailure("for(const let of 0);", "Lexical declarations must not have a binding named \"let\"");
    // It is a Syntax Error if any element of the BoundNames of ForDeclaration also occurs in the VarDeclaredNames of Statement.
    testParseFailure("for(let a in 0) { var a; }", "Duplicate binding \"a\"");
    testParseFailure("for(const a in 0) { var a; }", "Duplicate binding \"a\"");
    testParseFailure("for(let a of 0) { var a; }", "Duplicate binding \"a\"");
    testParseFailure("for(const a of 0) { var a; }", "Duplicate binding \"a\"");
    // It is a Syntax Error if the BoundNames of ForDeclaration contains any duplicate entries.
    testParseFailure("for(let {a, a} in 0);", "Duplicate binding \"a\"");
    testParseFailure("for(const {a, a} in 0);", "Duplicate binding \"a\"");
    testParseFailure("for(let {a, a} of 0);", "Duplicate binding \"a\"");
    testParseFailure("for(const {a, a} of 0);", "Duplicate binding \"a\"");

    // 13.7.1
    // It is a Syntax Error if this production is not nested, directly or indirectly (but not crossing function boundaries), within an IterationStatement.
    testParseFailure("continue;", "Continue statement must be nested within an iteration statement");
    testParseFailure("{ continue; }", "Continue statement must be nested within an iteration statement");
    testParseFailure("if(0) continue;", "Continue statement must be nested within an iteration statement");
    testParseFailure("while(0) !function(){ continue; };", "Continue statement must be nested within an iteration statement");
    testParseFailure("while(0) { function f(){ continue; } }", "Continue statement must be nested within an iteration statement");
    testParseFailure("label: continue label;", "Continue statement must be nested within an iteration statement with label \"label\"");
    testParseFailure("label: { continue label; }", "Continue statement must be nested within an iteration statement with label \"label\"");
    testParseFailure("label: if(0) continue label;", "Continue statement must be nested within an iteration statement with label \"label\"");
    testParseFailure("label: while(0) !function(){ continue label; };", "Continue statement must be nested within an iteration statement with label \"label\"");
    testParseFailure("label: while(0) { function f(){ continue label; } }", "Continue statement must be nested within an iteration statement with label \"label\"");

    // 13.8.1
    // It is a Syntax Error if this production is not nested, directly or indirectly (but not crossing function boundaries), within an IterationStatement or a SwitchStatement.
    testParseFailure("break;", "Break statement must be nested within an iteration statement or a switch statement");
    testParseFailure("{ break; }", "Break statement must be nested within an iteration statement or a switch statement");
    testParseFailure("if(0) break;", "Break statement must be nested within an iteration statement or a switch statement");
    testParseFailure("while(0) !function(){ break; };", "Break statement must be nested within an iteration statement or a switch statement");
    testParseFailure("while(0) { function f(){ break; } }", "Break statement must be nested within an iteration statement or a switch statement");
    testParseFailure("switch(0) { case 0: !function(){ break; }; }", "Break statement must be nested within an iteration statement or a switch statement");
    testParseFailure("switch(0) { case 0: function f(){ break; } }", "Break statement must be nested within an iteration statement or a switch statement");
    testParseFailure("switch(0) { default: !function(){ break; }; }", "Break statement must be nested within an iteration statement or a switch statement");
    testParseFailure("switch(0) { default: function f(){ break; } }", "Break statement must be nested within an iteration statement or a switch statement");

    // 13.10.1
    // It is a Syntax Error if the code that matches this production is contained in strict code.
    testParseFailure("'use strict'; with(0);", "Strict mode code must not include a with statement");
    // It is a Syntax Error if IsLabelledFunction(Statement) is true.
    testParseFailure("with(0) label: function f(){}", "The body of a with statement must not be a labeled function declaration");

    // 13.11.1
    // It is a Syntax Error if the LexicallyDeclaredNames of CaseClauses contains any duplicate entries.
    testParseFailure("switch(0) { case 0: let a; case 1: let a; }", "Duplicate binding \"a\"");
    testParseFailure("switch(0) { case 0: let a; case 1: function a(){} }", "Duplicate binding \"a\"");
    testParseFailure("switch(0) { case 0: let a; default: let a; }", "Duplicate binding \"a\"");
    testParseFailure("switch(0) { default: let a; case 0: let a; }", "Duplicate binding \"a\"");
    testParseFailure("switch(0) { default: let a; case 0: function a(){} }", "Duplicate binding \"a\"");
    testParseFailure("switch(0) { default: function a(){} case 0: let a  }", "Duplicate binding \"a\"");
    testParseFailure("switch(0) { default: function a(){} case 0: let a  }", "Duplicate binding \"a\"");

    // It is a Syntax Error if any element of the LexicallyDeclaredNames of CaseClauses also occurs in the VarDeclaredNames of CaseClauses.
    testParseFailure("switch(0) { case 0: let a; case 1: var a; }", "Duplicate binding \"a\"");
    testParseFailure("switch(0) { case 0: var a; case 1: let a; }", "Duplicate binding \"a\"");
    testParseFailure("switch(0) { case 0: let a; default: var a; }", "Duplicate binding \"a\"");
    testParseFailure("switch(0) { case 0: var a; default: let a; }", "Duplicate binding \"a\"");
    testParseFailure("switch(0) { default: let a; case 0: var a; }", "Duplicate binding \"a\"");
    testParseFailure("switch(0) { default: var a; case 0: let a; }", "Duplicate binding \"a\"");
    testParseFailure("switch(0) { case 0: const a = 0; case 1: var a; }", "Duplicate binding \"a\"");
    testParseFailure("switch(0) { case 0: var a; case 1: const a = 0; }", "Duplicate binding \"a\"");
    testParseFailure("switch(0) { case 0: const a = 0; default: var a; }", "Duplicate binding \"a\"");
    testParseFailure("switch(0) { case 0: var a; default: const a = 0; }", "Duplicate binding \"a\"");
    testParseFailure("switch(0) { default: const a = 0; case 0: var a; }", "Duplicate binding \"a\"");
    testParseFailure("switch(0) { default: var a; case 0: const a = 0; }", "Duplicate binding \"a\"");

    // 13.12.1
    // It is a Syntax Error if any source text matches this rule.
    //  (see Annex B 3.2)

    // 13.14.1
    // It is a Syntax Error if BoundNames of CatchParameter contains any duplicate elements.
    testParseFailure("try {} catch ([e, e]) {}", "Duplicate binding \"e\"");
    testParseFailure("try {} catch ({e, e}) {}", "Duplicate binding \"e\"");
    testParseFailure("try {} catch ({a: e, b: e}) {}", "Duplicate binding \"e\"");
    testParseFailure("try {} catch ({e = 0, a: e}) {}", "Duplicate binding \"e\"");
    // It is a Syntax Error if any element of the BoundNames of CatchParameter also occurs in the LexicallyDeclaredNames of Block.
    //  (see Annex B 3.5)
    // It is a Syntax Error if any element of the BoundNames of CatchParameter also occurs in the VarDeclaredNames of Block.
    //  (see Annex B 3.5)

    // 14.1.2
    // If the source code matching this production is strict code, the Early Error rules for StrictFormalParameters : FormalParameters are applied.
    testParseFailure("'use strict'; function f(a, a){}", "Duplicate binding \"a\"");
    testParseFailure("'use strict'; function f([a, a]){}", "Duplicate binding \"a\"");
    testParseModuleFailure("export default function(a, a){}", "Duplicate binding \"a\"");
    testParseModuleFailure("export default function([a, a]){}", "Duplicate binding \"a\"");
    testParseFailure("'use strict'; !function(a, a){}", "Duplicate binding \"a\"");
    testParseFailure("'use strict'; !function([a, a]){}", "Duplicate binding \"a\"");
    // If the source code matching this production is strict code, it is a Syntax Error if BindingIdentifier is the IdentifierName eval or the IdentifierName arguments.
    testParseFailure("'use strict'; function eval(){}", "The identifier \"eval\" must not be in binding position in strict mode");
    testParseFailure("'use strict'; function arguments(){}", "The identifier \"arguments\" must not be in binding position in strict mode");
    testParseFailure("'use strict'; !function eval(){}", "The identifier \"eval\" must not be in binding position in strict mode");
    testParseFailure("'use strict'; !function arguments(){}", "The identifier \"arguments\" must not be in binding position in strict mode");
    // It is a Syntax Error if any element of the BoundNames of FormalParameters also occurs in the LexicallyDeclaredNames of FunctionBody.
    testParseFailure("function f(a){ let a; }", "Duplicate binding \"a\"");
    testParseFailure("function f(a){ const a = 0; }", "Duplicate binding \"a\"");
    testParseModuleFailure("export default function(a){ let a; }", "Duplicate binding \"a\"");
    testParseModuleFailure("export default function(a){ const a = 0; }", "Duplicate binding \"a\"");
    testParseFailure("!function(a){ let a; }", "Duplicate binding \"a\"");
    testParseFailure("!function(a){ const a = 0; }", "Duplicate binding \"a\"");
    // It is a Syntax Error if FormalParameters Contains SuperProperty is true.
    testParseFailure("function f(a = super.b){}", "Member access on super must be in a method");
    testParseFailure("!function f(a = super[0]){}", "Member access on super must be in a method");
    testParseModuleFailure("export default function(a = super.b){}", "Member access on super must be in a method");
    testParseFailure("!function(a = super.b){}", "Member access on super must be in a method");
    testParseFailure("!{ a() { function f(a = super.b()){} } };", "Member access on super must be in a method");
    testParseFailure("!{ a() { !function(a = super.b()){} } };", "Member access on super must be in a method");
    testParseFailure("class A extends B { a() { function f(a = super.b()){} } }", "Member access on super must be in a method");
    testParseFailure("class A extends B { a() { !function(a = super.b()){} } }", "Member access on super must be in a method");
    // It is a Syntax Error if FunctionBody Contains SuperProperty is true.
    testParseFailure("function f(a){ super.b }", "Member access on super must be in a method");
    testParseFailure("!function f(a){ super[0] }", "Member access on super must be in a method");
    testParseModuleFailure("export default function(a){ super.b }", "Member access on super must be in a method");
    testParseFailure("!function(a){ super.b }", "Member access on super must be in a method");
    testParseFailure("!{ a() { function f(){ super.b(); } } };", "Member access on super must be in a method");
    testParseFailure("!{ a() { !function(){ super.b(); } } };", "Member access on super must be in a method");
    testParseFailure("class A extends B { a() { function f(){ super.b(); } } }", "Member access on super must be in a method");
    testParseFailure("class A extends B { a() { !function(){ super.b(); } } }", "Member access on super must be in a method");
    // It is a Syntax Error if FormalParameters Contains SuperCall is true.
    testParseFailure("function f(a = super()){}", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    testParseModuleFailure("export default function(a = super()){}", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    testParseFailure("!function(a = super()){}", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    testParseFailure("class A extends B { constructor() { function f(a = super()){} } }", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    testParseFailure("class A extends B { constructor() { !function(a = super()){} } }", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    // It is a Syntax Error if FunctionBody Contains SuperCall is true.
    testParseFailure("function f(a){ super() }", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    testParseModuleFailure("export default function(a){ super() }", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    testParseFailure("!function(a){ super() }", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    testParseFailure("class A extends B { constructor() { function f(){ super(); } } }", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    testParseFailure("class A extends B { constructor() { !function(){ super(); } } }", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    // It is a Syntax Error if BoundNames of FormalParameters contains any duplicate elements.
    testParseFailure("!{ f(a, a){} };", "Duplicate binding \"a\"");
    testParseFailure("!{ f([a, a]){} };", "Duplicate binding \"a\"");
    testParseFailure("!{ f({a, a}){} };", "Duplicate binding \"a\"");
    testParseFailure("!{ *g(a, a){} };", "Duplicate binding \"a\"");
    testParseFailure("!{ *g([a, a]){} };", "Duplicate binding \"a\"");
    testParseFailure("!{ *g({a, a}){} };", "Duplicate binding \"a\"");
    testParseFailure("class A { static f(a, a){} }", "Duplicate binding \"a\"");
    testParseFailure("class A { static f([a, a]){} }", "Duplicate binding \"a\"");
    testParseFailure("class A { static f({a, a}){} }", "Duplicate binding \"a\"");
    testParseFailure("(a, a) => 0;", "Duplicate binding \"a\"");
    testParseFailure("([a, a]) => 0;", "Duplicate binding \"a\"");
    testParseFailure("({a, a}) => 0;", "Duplicate binding \"a\"");
    testParseFailure("([a],...a)=>0", "Duplicate binding \"a\"");
    testParseFailure("(a,...a)=>0", "Duplicate binding \"a\"");
    testParseFailure("([a],...a)=>0", "Duplicate binding \"a\"");
    // It is a Syntax Error if IsSimpleParameterList of FormalParameterList is false and BoundNames of FormalParameterList contains any duplicate elements.
    testParseFailure("function f(a, [a]){}", "Duplicate binding \"a\"");
    testParseFailure("(function([a, a]){})", "Duplicate binding \"a\"");
    testParseFailure("(function({a: x, b: x}){})", "Duplicate binding \"x\"");
    testParseFailure("(function({a: x}, {b: x}){})", "Duplicate binding \"x\"");
    // It is a Syntax Error if the LexicallyDeclaredNames of FunctionStatementList contains any duplicate entries.
    testParseFailure("function f(){ let a; let a; }", "Duplicate binding \"a\"");
    testParseFailure("function f(){ let a; const a = 0; }", "Duplicate binding \"a\"");
    testParseFailure("function f(){ const a = 0; let a; }", "Duplicate binding \"a\"");
    testParseFailure("function f(){ const a = 0; const a = 0; }", "Duplicate binding \"a\"");
    testParseFailure("!function f(){ let a; let a; }", "Duplicate binding \"a\"");
    testParseFailure("!{ f(){ let a; let a; } };", "Duplicate binding \"a\"");
    testParseFailure("!{ *g(){ let a; let a; } };", "Duplicate binding \"a\"");
    testParseFailure("!{ get f(){ let a; let a; } };", "Duplicate binding \"a\"");
    testParseFailure("!{ set f(b){ let a; let a; } };", "Duplicate binding \"a\"");
    testParseFailure("class A { static f(){ let a; let a; } }", "Duplicate binding \"a\"");
    testParseFailure("() => { let a; let a; }", "Duplicate binding \"a\"");
    // It is a Syntax Error if any element of the LexicallyDeclaredNames of FunctionStatementList also occurs in the VarDeclaredNames of FunctionStatementList.
    testParseFailure("function f(){ let a; var a; }", "Duplicate binding \"a\"");
    testParseFailure("function f(){ var a; let a; }", "Duplicate binding \"a\"");
    testParseFailure("function f(){ const a = 0; var a; }", "Duplicate binding \"a\"");
    testParseFailure("function f(){ var a; const a = 0; }", "Duplicate binding \"a\"");
    testParseFailure("!function f(){ let a; var a; }", "Duplicate binding \"a\"");
    testParseFailure("!{ f(){ let a; var a; } };", "Duplicate binding \"a\"");
    testParseFailure("!{ *g(){ let a; var a; } };", "Duplicate binding \"a\"");
    testParseFailure("!{ get f(){ let a; var a; } };", "Duplicate binding \"a\"");
    testParseFailure("!{ set f(b){ let a; var a; } };", "Duplicate binding \"a\"");
    testParseFailure("class A { static f(){ let a; var a; } }", "Duplicate binding \"a\"");
    testParseFailure("() => { let a; var a; }", "Duplicate binding \"a\"");
    // It is a Syntax Error if ContainsDuplicateLabels of FunctionStatementList with argument « » is true.
    testParseFailure("function f(){ label: label: ; }", "Label \"label\" has already been declared");
    testParseFailure("function f(){ label: { label: ; } }", "Label \"label\" has already been declared");
    testParseFailure("function f(){ label: if(0) label: ; }", "Label \"label\" has already been declared");
    // It is a Syntax Error if ContainsUndefinedBreakTarget of FunctionStatementList with argument « » is true.
    testParseFailure("function f(){ break label; }", "Break statement must be nested within a statement with label \"label\"");
    testParseFailure("function f(){ labelA: break labelB; }", "Break statement must be nested within a statement with label \"labelB\"");
    // It is a Syntax Error if ContainsUndefinedContinueTarget of FunctionStatementList with arguments « » and « » is true.
    testParseFailure("function f(){ while(0) continue label; }", "Continue statement must be nested within an iteration statement with label \"label\"");
    testParseFailure("function f(){ labelA: while(0) continue labelB; }", "Continue statement must be nested within an iteration statement with label \"labelB\"");

    // 14.2.1
    // It is a Syntax Error if any element of the BoundNames of ArrowParameters also occurs in the LexicallyDeclaredNames of ConciseBody.
    testParseFailure("(a) => { let a; }", "Duplicate binding \"a\"");
    testParseFailure("([a]) => { let a; }", "Duplicate binding \"a\"");
    testParseFailure("({a}) => { let a; }", "Duplicate binding \"a\"");
    testParseFailure("(a) => { const a = 0; }", "Duplicate binding \"a\"");
    testParseFailure("([a]) => { const a = 0; }", "Duplicate binding \"a\"");
    testParseFailure("({a}) => { const a = 0; }", "Duplicate binding \"a\"");
    // If the [Yield] grammar parameter is present on ArrowParameters, it is a Syntax Error if the lexical token sequence matched by CoverParenthesizedExpressionAndArrowParameterList[?Yield] cannot be parsed with no tokens left over using ArrowFormalParameters[Yield, GeneratorParameter] as the goal symbol.
    // TODO
    // If the [Yield] grammar parameter is not present on ArrowParameters, it is a Syntax Error if the lexical token sequence matched by CoverParenthesizedExpressionAndArrowParameterList[?Yield] cannot be parsed with no tokens left over using ArrowFormalParameters as the goal symbol.
    // TODO
    // All early errors rules for ArrowFormalParameters and its derived productions also apply to CoveredFormalsList of CoverParenthesizedExpressionAndArrowParameterList[?Yield].
    // TODO

    // 14.3.1
    // It is a Syntax Error if any element of the BoundNames of StrictFormalParameters also occurs in the LexicallyDeclaredNames of FunctionBody.
    testParseFailure("!{ f(a) { let a; } };", "Duplicate binding \"a\"");
    testParseFailure("!{ f([a]){ let a; } };", "Duplicate binding \"a\"");
    testParseFailure("!{ f({a}){ let a; } };", "Duplicate binding \"a\"");
    // It is a Syntax Error if BoundNames of PropertySetParameterList contains any duplicate elements.
    testParseFailure("!{ set f({a, a}){} };", "Duplicate binding \"a\"");
    testParseFailure("!{ set f([a, a]){} };", "Duplicate binding \"a\"");
    // It is a Syntax Error if any element of the BoundNames of PropertySetParameterList also occurs in the LexicallyDeclaredNames of FunctionBody.
    testParseFailure("!{ set f(a) { let a; } };", "Duplicate binding \"a\"");
    testParseFailure("!{ set f([a]){ let a; } };", "Duplicate binding \"a\"");
    testParseFailure("!{ set f({a}){ let a; } };", "Duplicate binding \"a\"");

    // 14.4.1
    // It is a Syntax Error if HasDirectSuper of GeneratorMethod is true .
    testParseFailure("!{ *f(a = super()){} };", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    testParseFailure("!{ *f(a) { super() } };", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    // It is a Syntax Error if any element of the BoundNames of StrictFormalParameters also occurs in the LexicallyDeclaredNames of GeneratorBody.
    testParseFailure("!{ *f(a) { let a; } };", "Duplicate binding \"a\"");
    testParseFailure("!{ *f([a]){ let a; } };", "Duplicate binding \"a\"");
    testParseFailure("!{ *f({a}){ let a; } };", "Duplicate binding \"a\"");
    // It is a Syntax Error if HasDirectSuper of GeneratorDeclaration is true .
    testParseFailure("function* f(a = super()){}", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    testParseFailure("function* f(a){ super() }", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    testParseFailure("class A extends B { constructor() { function* f(){ super(); } } }", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    // It is a Syntax Error if HasDirectSuper of GeneratorExpression is true .
    testParseFailure("!function* f(a = super()){}", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    testParseFailure("!function* f(a) { super() }", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    // If the source code matching this production is strict code, the Early Error rules for StrictFormalParameters : FormalParameters are applied.
    testParseFailure("'use strict'; function* f(a, a){}", "Duplicate binding \"a\"");
    testParseFailure("'use strict'; !function*(a, a){}", "Duplicate binding \"a\"");
    // If the source code matching this production is strict code, it is a Syntax Error if BindingIdentifier is the IdentifierName eval or the IdentifierName arguments.
    testParseFailure("'use strict'; function* eval(){}", "The identifier \"eval\" must not be in binding position in strict mode");
    testParseFailure("'use strict'; function* arguments(){}", "The identifier \"arguments\" must not be in binding position in strict mode");
    testParseFailure("'use strict'; !function* eval(){}", "The identifier \"eval\" must not be in binding position in strict mode");
    testParseFailure("'use strict'; !function* arguments(){}", "The identifier \"arguments\" must not be in binding position in strict mode");
    // It is a Syntax Error if any element of the BoundNames of FormalParameters also occurs in the LexicallyDeclaredNames of GeneratorBody.
    testParseFailure("function* f(a) { let a; }", "Duplicate binding \"a\"");
    testParseFailure("function* f([a]){ let a; }", "Duplicate binding \"a\"");
    testParseFailure("function* f({a}){ let a; }", "Duplicate binding \"a\"");
    // It is a Syntax Error if FormalParameters Contains SuperProperty is true.
    testParseFailure("function* f(a = super.b){}", "Member access on super must be in a method");
    testParseFailure("!function* (a = super.b){}", "Member access on super must be in a method");
    testParseFailure("!{ a() { function* f(a = super.b()){} } };", "Member access on super must be in a method");
    testParseFailure("!{ a() { !function* (a = super.b()){} } };", "Member access on super must be in a method");
    testParseFailure("class A extends B { a() { function* f(a = super.b()){} } }", "Member access on super must be in a method");
    testParseFailure("class A extends B { a() { !function* (a = super.b()){} } }", "Member access on super must be in a method");
    // It is a Syntax Error if GeneratorBody Contains SuperProperty is true.
    testParseFailure("function* f(a){ super.b }", "Member access on super must be in a method");
    testParseFailure("!function* (a){ super.b }", "Member access on super must be in a method");
    testParseFailure("!{ a() { function* f(){ super.b(); } } };", "Member access on super must be in a method");
    testParseFailure("!{ a() { !function* (){ super.b(); } } };", "Member access on super must be in a method");
    testParseFailure("class A extends B { a() { function* f(){ super.b(); } } }", "Member access on super must be in a method");
    testParseFailure("class A extends B { a() { !function* (){ super.b(); } } }", "Member access on super must be in a method");

    // 14.5.1
    // It is a Syntax Error if ClassHeritage is not present and the following algorithm evaluates to true:
    //   1. Let constructor be ConstructorMethod of ClassBody.
    //   2. If constructor is empty, return false.
    //   3. Return HasDirectSuper of constructor.
    testParseFailure("class A { constructor() { super(); } }", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    testParseFailure("class A { constructor() { {{ (( super() )); }} } }", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    // It is a Syntax Error if PrototypePropertyNameList of ClassElementList contains more than one occurrence of "constructor".
    testParseFailure("class A { constructor(){} constructor(){} }", "Duplicate constructor method in class");
    testParseFailure("class A { constructor(){} \"constructor\"(){} }", "Duplicate constructor method in class");
    // It is a Syntax Error if PropName of MethodDefinition is not "constructor" and HasDirectSuper of MethodDefinition is true.
    testParseFailure("class A extends B { f() { super(); } }", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    // It is a Syntax Error if PropName of MethodDefinition is "constructor" and SpecialMethod of MethodDefinition is true.
    testParseFailure("class A { *constructor(){} }", "Constructors cannot be generators, getters or setters");
    testParseFailure("class A { get constructor(){} }", "Constructors cannot be generators, getters or setters");
    testParseFailure("class A { set constructor(a) {} }", "Constructors cannot be generators, getters or setters");
    // It is a Syntax Error if HasDirectSuper of MethodDefinition is true.
    testParseFailure("class A extends B { static f() { super(); } }", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    // It is a Syntax Error if PropName of MethodDefinition is "prototype".
    testParseFailure("class A extends B { static prototype(){} }", "Static class methods cannot be named \"prototype\"");
    testParseFailure("class A extends B { static *prototype(){} }", "Static class methods cannot be named \"prototype\"");
    testParseFailure("class A extends B { static get prototype(){} }", "Static class methods cannot be named \"prototype\"");
    testParseFailure("class A extends B { static set prototype(a) {} }", "Static class methods cannot be named \"prototype\"");

    // 15.1.1
    // It is a Syntax Error if the LexicallyDeclaredNames of StatementList contains any duplicate entries.
    testParseFailure("let a; let a;", "Duplicate binding \"a\"");
    testParseFailure("let a; const a = 0;", "Duplicate binding \"a\"");
    testParseFailure("const a = 0; let a;", "Duplicate binding \"a\"");
    testParseFailure("const a = 0; const a = 0;", "Duplicate binding \"a\"");
    // It is a Syntax Error if any element of the LexicallyDeclaredNames of StatementList also occurs in the VarDeclaredNames of StatementList.
    testParseFailure("let a; var a;", "Duplicate binding \"a\"");
    testParseFailure("var a; let a;", "Duplicate binding \"a\"");
    testParseFailure("const a = 0; var a;", "Duplicate binding \"a\"");
    testParseFailure("var a; const a = 0;", "Duplicate binding \"a\"");
    // It is a Syntax Error if StatementList Contains super unless the source code containing super is eval code that is being processed by a direct eval that is contained in function code. However, such function code does not include ArrowFunction function code.
    testParseFailure("super()", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    testParseFailure("super.a", "Member access on super must be in a method");
    // It is a Syntax Error if StatementList Contains NewTarget unless the source code containing NewTarget is eval code that is being processed by a direct eval that is contained in function code. However, such function code does not include ArrowFunction function code.
    testParseFailure("new.target", "new.target must be within function (but not arrow expression) code");
    // It is a Syntax Error if ContainsDuplicateLabels of StatementList with argument « » is true.
    testParseFailure("label: label: ;", "Label \"label\" has already been declared");
    // It is a Syntax Error if ContainsUndefinedBreakTarget of StatementList with argument « » is true.
    testParseFailure("break label;", "Break statement must be nested within a statement with label \"label\"");
    testParseFailure("labelA: break labelB;", "Break statement must be nested within a statement with label \"labelB\"");
    // It is a Syntax Error if ContainsUndefinedContinueTarget of StatementList with arguments « » and « » is true.
    testParseFailure("while(0) continue label;", "Continue statement must be nested within an iteration statement with label \"label\"");
    testParseFailure("labelA: while(0) continue labelB;", "Continue statement must be nested within an iteration statement with label \"labelB\"");

    // 15.2.1.1
    // It is a Syntax Error if the LexicallyDeclaredNames of ModuleItemList contains any duplicate entries.
    testParseModuleFailure("let a; let a;", "Duplicate binding \"a\"");
    testParseModuleFailure("let a; const a = 0;", "Duplicate binding \"a\"");
    testParseModuleFailure("const a = 0; let a;", "Duplicate binding \"a\"");
    testParseModuleFailure("const a = 0; const a = 0;", "Duplicate binding \"a\"");
    testParseModuleFailure("let a; export class a {};", "Duplicate binding \"a\"");
    testParseModuleFailure("let a; export function a(){};", "Duplicate binding \"a\"");
    testParseModuleFailure("let a; export let a;", "Duplicate binding \"a\"");
    testParseModuleFailure("let a; export const a = 0;", "Duplicate binding \"a\"");
    testParseModuleFailure("const a = 0; export class a {};", "Duplicate binding \"a\"");
    testParseModuleFailure("const a = 0; export function a(){};", "Duplicate binding \"a\"");
    testParseModuleFailure("const a = 0; export let a;", "Duplicate binding \"a\"");
    testParseModuleFailure("const a = 0; export const a = 1;", "Duplicate binding \"a\"");
    // It is a Syntax Error if any element of the LexicallyDeclaredNames of ModuleItemList also occurs in the VarDeclaredNames of ModuleItemList.
    testParseModuleFailure("let a; var a;", "Duplicate binding \"a\"");
    testParseModuleFailure("var a; let a;", "Duplicate binding \"a\"");
    testParseModuleFailure("const a = 0; var a;", "Duplicate binding \"a\"");
    testParseModuleFailure("var a; const a = 0;", "Duplicate binding \"a\"");
    testParseModuleFailure("var a; export class a {};", "Duplicate binding \"a\"");
    testParseModuleFailure("var a; export function a(){};", "Duplicate binding \"a\"");
    testParseModuleFailure("var a; export let a;", "Duplicate binding \"a\"");
    testParseModuleFailure("var a; export const a = 0;", "Duplicate binding \"a\"");
    // It is a Syntax Error if the ExportedNames of ModuleItemList contains any duplicate entries.
    testParseModuleFailure("export var a; export var a;", "Duplicate export \"a\"");
    testParseModuleFailure("let a; export {a, a};", "Duplicate export \"a\"");
    testParseModuleFailure("let a, b; export {a, b as a};", "Duplicate export \"a\"");
    testParseModuleFailure("let a; export {a, a as a};", "Duplicate export \"a\"");
    testParseModuleFailure("export {a}; export class a{};", "Duplicate export \"a\"");
    testParseModuleFailure("export {a}; export function a(){};", "Duplicate export \"a\"");
    testParseModuleFailure("export let a; export let a;", "Duplicate binding \"a\"");
    testParseModuleFailure("export const a = 0; export const a = 0;", "Duplicate binding \"a\"");
    testParseModuleFailure("export let a; export var a;", "Duplicate binding \"a\"");
    testParseModuleFailure("export default 0; export default 0;", "Duplicate export \"*default*\"");
    testParseModuleFailure("export default 0; export default function f(){};", "Duplicate export \"*default*\"");
    testParseModuleFailure("export default 0; export default class a {};", "Duplicate export \"*default*\"");
    // It is a Syntax Error if any element of the ExportedBindings of ModuleItemList does not also occur in either the VarDeclaredNames of ModuleItemList, or the LexicallyDeclaredNames of ModuleItemList.
    testParseModuleFailure("export {a};", "Exported binding \"a\" is not declared");
    testParseModuleFailure("export {b as a};", "Exported binding \"b\" is not declared");
    testParseModuleFailure("var a; export {b as a};", "Exported binding \"b\" is not declared");
    testParseModuleFailure("export {a as b}; var b;", "Exported binding \"a\" is not declared");
    testParseModuleFailure("export {b as a};", "Exported binding \"b\" is not declared");
    testParseModuleFailure("let a; export {b as a};", "Exported binding \"b\" is not declared");
    testParseModuleFailure("export {a as b}; let b;", "Exported binding \"a\" is not declared");
    // It is a Syntax Error if ModuleItemList Contains super.
    testParseModuleFailure("super()", "Calls to super must be in the \"constructor\" method of a class expression or class declaration that has a superclass");
    testParseModuleFailure("super.a", "Member access on super must be in a method");
    // It is a Syntax Error if ModuleItemList Contains NewTarget
    testParseModuleFailure("new.target", "new.target must be within function (but not arrow expression) code");
    // It is a Syntax Error if ContainsDuplicateLabels of ModuleItemList with argument « » is true.
    testParseModuleFailure("label: label: ;", "Label \"label\" has already been declared");
    // It is a Syntax Error if ContainsUndefinedBreakTarget of ModuleItemList with argument « » is true.
    testParseModuleFailure("break label;", "Break statement must be nested within a statement with label \"label\"");
    testParseModuleFailure("labelA: break labelB;", "Break statement must be nested within a statement with label \"labelB\"");
    // It is a Syntax Error if ContainsUndefinedContinueTarget of ModuleItemList with arguments « » and « » is true.
    testParseModuleFailure("while(0) continue label;", "Continue statement must be nested within an iteration statement with label \"label\"");
    testParseModuleFailure("labelA: while(0) continue labelB;", "Continue statement must be nested within an iteration statement with label \"labelB\"");

    // 15.2.2.1
    // It is a Syntax Error if the BoundNames of ImportDeclaration contains any duplicate entries.
    testParseModuleFailure("import a, * as a from \"module\";", "Duplicate binding \"a\"");
    testParseModuleFailure("import a, {a} from \"module\";", "Duplicate binding \"a\"");
    testParseModuleFailure("import a, {b as a} from \"module\";", "Duplicate binding \"a\"");
    testParseModuleFailure("import {a, b as a} from \"module\";", "Duplicate binding \"a\"");
    testParseModuleFailure("import {a, a} from \"module\";", "Duplicate binding \"a\"");
    testParseModuleFailure("import {b as a, c as a} from \"module\";", "Duplicate binding \"a\"");

    // 15.2.3.1
    // For each IdentifierName n in ReferencedBindings of ExportClause : It is a Syntax Error if StringValue of n is a ReservedWord or if the StringValue of n is one of: "implements", "interface", "let", "package", "private", "protected", "public", "static", or "yield".
    // TODO

    // Annex B 3.1 (12.2.5.1)
    // It is a Syntax Error if PropertyNameList of PropertyDefinitionList contains any duplicate entries for "__proto__" and at least two of those entries were obtained from productions of the form PropertyDefinition : PropertyName : AssignmentExpression .
    testParseFailure("!{ __proto__: null, __proto__: null };", "Duplicate __proto__ property in object literal not allowed");
    testParseFailure("!{ __proto__: null, \"__proto__\": null };", "Duplicate __proto__ property in object literal not allowed");
    testParseFailure("!{ __proto__: null, __proto__: null, };", "Duplicate __proto__ property in object literal not allowed");

    // Annex B 3.2 (13.12.1)
    // It is a Syntax Error if any strict mode source code matches this rule.
    testParseFailure("'use strict'; label: function f(){}", "Labeled FunctionDeclarations are disallowed in strict mode");

    // Annex B 3.5 (13.14.1)
    // It is a Syntax Error if any element of the BoundNames of CatchParameter also occurs in the LexicallyDeclaredNames of Block.
    testParseFailure("try {} catch(e) { let e; }", "Duplicate binding \"e\"");
    testParseFailure("try {} catch(e) { function e(){} }", "Duplicate binding \"e\"");
    // It is a Syntax Error if any element of the BoundNames of CatchParameter also occurs in the VarDeclaredNames of Block,
    // unless that element is only bound by a VariableStatement or the VariableDeclarationList of a for statement,
    // or the ForBinding of a for-in statement.
    testParseFailure("try {} catch(e) { for(var e of 0); }", "Duplicate binding \"e\"");

  });
});
