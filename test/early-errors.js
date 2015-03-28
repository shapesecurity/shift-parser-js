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
    return;

    // 12.1.1
    // It is a Syntax Error if the code matched by this production is contained in strict code and the StringValue of Identifier is "arguments" or "eval".
    testParseFailure("'use strict'; arguments = 0", "Assignment to eval or arguments is not allowed in strict mode");
    testParseFailure("'use strict'; arguments *= 0", "Assignment to eval or arguments is not allowed in strict mode");

    testParseFailure("'use strict'; [eval] = 0", "Assignment to eval or arguments is not allowed in strict mode");
    testParseFailure("'use strict'; [,,,eval,] = 0", "Assignment to eval or arguments is not allowed in strict mode");
    testParseFailure("'use strict'; ({a: eval} = 0)", "Assignment to eval or arguments is not allowed in strict mode");
    testParseFailure("'use strict'; ({a: eval = 0} = 0)", "Assignment to eval or arguments is not allowed in strict mode");

    testParseFailure("'use strict'; [arguments] = 0", "Assignment to eval or arguments is not allowed in strict mode");
    testParseFailure("'use strict'; [,,,arguments,] = 0", "Assignment to eval or arguments is not allowed in strict mode");
    testParseFailure("'use strict'; ({a: arguments} = 0)", "Assignment to eval or arguments is not allowed in strict mode");
    testParseFailure("'use strict'; ({a: arguments = 0} = 0)", "Assignment to eval or arguments is not allowed in strict mode");

    testParseFailure("'use strict'; var eval;", "Variable name may not be eval or arguments in strict mode");
    testParseFailure("'use strict'; var arguments;", "Variable name may not be eval or arguments in strict mode");
    testParseFailure("'use strict'; let [eval] = 0;", "Variable name may not be eval or arguments in strict mode");
    testParseFailure("'use strict'; const {a: eval} = 0;", "Variable name may not be eval or arguments in strict mode");
    testParseModuleFailure("var eval;", "Variable name may not be eval or arguments in strict mode");

    testParseFailure("eval=>0", "Parameter name eval or arguments is not allowed in strict mode");
    testParseFailure("arguments=>0", "Parameter name eval or arguments is not allowed in strict mode");
    testParseFailure("(eval)=>0", "Parameter name eval or arguments is not allowed in strict mode");
    testParseFailure("(arguments)=>0", "Parameter name eval or arguments is not allowed in strict mode");

    testParseFailure("'use strict'; function f(eval){}", "Parameter name eval or arguments is not allowed in strict mode");
    testParseFailure("function f(eval){ 'use strict'; }", "Parameter name eval or arguments is not allowed in strict mode");
    testParseFailure("'use strict'; !function (eval){}", "Parameter name eval or arguments is not allowed in strict mode");
    testParseFailure("!function (eval){ 'use strict'; }", "Parameter name eval or arguments is not allowed in strict mode");
    testParseFailure("'use strict'; function* f(eval){}", "Parameter name eval or arguments is not allowed in strict mode");
    testParseFailure("function* f(eval){ 'use strict'; }", "Parameter name eval or arguments is not allowed in strict mode");
    testParseFailure("'use strict'; !function* (eval){}", "Parameter name eval or arguments is not allowed in strict mode");
    testParseFailure("!function* (eval){ 'use strict'; }", "Parameter name eval or arguments is not allowed in strict mode");
    testParseFailure("!{ f(eval){} };", "Parameter name eval or arguments is not allowed in strict mode");
    testParseFailure("!{ *f(eval){} };", "Parameter name eval or arguments is not allowed in strict mode");
    testParseFailure("'use strict'; !{ set f(eval){} };", "Parameter name eval or arguments is not allowed in strict mode");
    testParseFailure("!{ set f(eval){ 'use strict'; } };", "Parameter name eval or arguments is not allowed in strict mode");
    testParseFailure("class A { f(eval){} };", "Parameter name eval or arguments is not allowed in strict mode");
    testParseFailure("class A { *f(eval){} };", "Parameter name eval or arguments is not allowed in strict mode");
    testParseFailure("class A { set f(eval){} };", "Parameter name eval or arguments is not allowed in strict mode");
    // It is a Syntax Error if this production has a [Yield] parameter.
    //  (error)
    // It is a Syntax Error if the code match by this production is contained in strict code.
    testParseFailure("'use strict'; +yield;", "Unexpected token \"yield\"");
    testParseFailure("'use strict'; yield:;", "Unexpected token \"yield\"");
    testParseFailure("'use strict'; var [yield] = 0;", "Unexpected token \"yield\"");
    // It is a Syntax Error if the code match by this production is within the GeneratorBody of a GeneratorMethod, GeneratorDeclaration, or GeneratorExpression.
    testParseFailure("function* f(){ function* f(a = +yield){} }", "Unexpected token \"yield\"");
    testParseFailure("(function* f(){ function* f(a = +yield){} })", "Unexpected token \"yield\"");
    testParseFailure("!{ *f(){ function* f(a = +yield){} } };", "Unexpected token \"yield\"");
    testParseFailure("function* a(){ return ({set a(yield){}}); }", "Unexpected token \"yield\"");
    testParseFailure("function* a(){function b(){yield}}", "Unexpected token \"yield\"");
    // It is a Syntax Error if this production has a [Yield] parameter and StringValue of Identifier is "yield".
    //  (error)
    // It is a Syntax Error if this phrase is contained in strict code and the StringValue of IdentifierName is: "implements", "interface", "let", "package", "private", "protected", "public", "static", or "yield".
    testParseFailure("'use strict'; +implements;", "Use of future reserved word in strict mode");
    testParseFailure("'use strict'; +interface;", "Use of future reserved word in strict mode");
    testParseFailure("'use strict'; +let;", "Unexpected token \"let\"");
    testParseFailure("'use strict'; +package;", "Use of future reserved word in strict mode");
    testParseFailure("'use strict'; +private;", "Use of future reserved word in strict mode");
    testParseFailure("'use strict'; +protected;", "Use of future reserved word in strict mode");
    testParseFailure("'use strict'; +public;", "Use of future reserved word in strict mode");
    testParseFailure("'use strict'; +static;", "Use of future reserved word in strict mode");
    testParseFailure("'use strict'; +yield;", "Unexpected token \"yield\"");
    testParseFailure("package=>0", "Use of future reserved word in strict mode");
    testParseFailure("(package)=>0", "Use of future reserved word in strict mode");
    testParseFailure("([let])=>0", "Use of future reserved word in strict mode");
    testParseFailure("function* a(yield){}", "Unexpected token \"yield\"");
    testParseFailure("function* a(){function a(a=yield){}}", "Unexpected token \"yield\"");
    testParseFailure("function* a(){function* a(yield){}}", "Unexpected token \"yield\"");
    testParseFailure("function* a([yield]){}", "Unexpected token \"yield\"");
    testParseFailure("function* a({yield}){}", "Unexpected token \"yield\"");
    testParseFailure("function* a({yield=0}){}", "Unexpected token \"yield\"");
    testParseFailure("function* a({a:yield}){}", "Unexpected token \"yield\"");
    testParseFailure("function* a([yield,...a]){}", "Unexpected token \"yield\"");
    testParseFailure("class A {set a(yield){}}", "Unexpected token \"yield\"");
    testParseFailure("({a(yield){}})", "Unexpected token \"yield\"");
    // It is a Syntax Error if StringValue of IdentifierName is the same string value as the StringValue of any ReservedWord except for yield.
    // TODO: these should fail but will not
    //testParseFailure("(i\\u006E)", "Unexpected token \"in\"");
    //testParseFailure("var i\\u006E;", "Unexpected token \"in\"");
    //testParseModuleFailure("import {a as i\\u006E} from \"module\";", "Unexpected token \"in\"");

    // 12.2.5.1
    // It is a Syntax Error if HasDirectSuper of MethodDefinition is true.
    testParseFailure("({ a(){ super(); } });", "Unexpected super call");
    testParseFailure("({ a(){ {{ if(0) (( super() )); }} } });", "Unexpected super call");
    testParseFailure("class A extends B { constructor() { !{constructor() { super(); }}; } }", "Unexpected super call");
    testParseFailure("class A extends B { constructor() { !{*constructor() { super(); }}; } }", "Unexpected super call");
    testParseFailure("class A extends B { constructor() { !{get constructor() { super(); }}; } }", "Unexpected super call");
    testParseFailure("class A extends B { constructor() { !{set constructor(a) { super(); }}; } }", "Unexpected super call");

    // 12.2.7.1
    // It is a Syntax Error if BodyText of RegularExpressionLiteral cannot be recognized using the goal symbol Pattern of the ECMAScript RegExp grammar specified in 21.2.1.
    testParseFailure("/?/", "Invalid regular expression");
    testParseFailure("/(/", "Invalid regular expression");
    // It is a Syntax Error if FlagText of RegularExpressionLiteral contains any code points other than "g", "i", "m", "u", or "y", or if it contains the same code point more than once.
    testParseFailure("/./a", "Invalid regular expression");
    testParseFailure("/./ii", "Invalid regular expression");

    // 12.4.1
    // It is an early Reference Error if IsValidSimpleAssignmentTarget of LeftHandSideExpression is false.
    testParseFailure("0++", "Invalid left-hand side in assignment");
    testParseFailure("0--", "Invalid left-hand side in assignment");

    // 12.5.1
    // It is an early Reference Error if IsValidSimpleAssignmentTarget of UnaryExpression is false.
    testParseFailure("++0", "Invalid left-hand side in assignment");
    testParseFailure("--0", "Invalid left-hand side in assignment");

    // 12.5.4.1
    // It is a Syntax Error if the UnaryExpression is contained in strict code and the derived UnaryExpression is PrimaryExpression : IdentifierReference.
    testParseFailure("'use strict'; delete a;", "Invalid left-hand side in assignment");
    // It is a Syntax Error if the derived UnaryExpression is PrimaryExpression : CoverParenthesizedExpressionAndArrowParameterList and CoverParenthesizedExpressionAndArrowParameterList ultimately derives a phrase that, if used in place of UnaryExpression, would produce a Syntax Error according to these rules. This rule is recursively applied.
    testParseFailure("'use strict'; delete (a);", "Invalid left-hand side in assignment");
    testParseFailure("'use strict'; delete ((a));", "Invalid left-hand side in assignment");

    // 12.14.5.1
    // It is a Syntax Error if IsValidSimpleAssignmentTarget of IdentifierReference is false.
    testParseFailure("'use strict'; ({eval} = 0);", "Assignment to eval or arguments is not allowed in strict mode");
    testParseFailure("'use strict'; ({eval = 0} = 0);", "Assignment to eval or arguments is not allowed in strict mode");
    testParseFailure("'use strict'; ({arguments} = 0);", "Assignment to eval or arguments is not allowed in strict mode");
    testParseFailure("'use strict'; ({arguments = 0} = 0);", "Assignment to eval or arguments is not allowed in strict mode");

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
    testParseFailure("let let;", "Invalid lexical binding name \"let\"");
    testParseFailure("let a, let;", "Invalid lexical binding name \"let\"");
    testParseFailure("let a, let = 0;", "Invalid lexical binding name \"let\"");
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
    // It is a Syntax Error if Initializer is not present and IsConstantDeclaration of the LexicalDeclaration containing this production is true.
    testParseFailure("const a;", "");
    testParseFailure("const a, b = 0;", "");
    testParseFailure("const a = 0, b;", "");
    testParseFailure("{ const a; }", "");
    testParseFailure("function f(){ const a; }", "");

    // 13.5.1
    // It is a Syntax Error if IsLabelledFunction(Statement) is true for any occurrence of Statement in these rules.
    testParseFailure("if(0) label: function f(){}", "Unexpected token \"function\"");
    testParseFailure("if(0) label: function f(){} else ;", "Unexpected token \"function\"");
    testParseFailure("if(0) ; else label: function f(){}", "Unexpected token \"function\"");
    testParseFailure("if(0) labelA: function f(){} else labelB: function g(){}", "Unexpected token \"function\"");

    // 13.6.0.1
    // It is a Syntax Error if IsLabelledFunction(Statement) is true for any occurrence of Statement in these rules.
    testParseFailure("do label: function f(){} while (0)", "Unexpected token \"function\"");
    testParseFailure("do label: function f(){} while (0);", "Unexpected token \"function\"");
    testParseFailure("while(0) label: function f(){}", "Unexpected token \"function\"");
    testParseFailure("for(;;) label: function f(){}", "Unexpected token \"function\"");
    testParseFailure("for(var a;;) label: function f(){}", "Unexpected token \"function\"");
    testParseFailure("for(const a = 0;;) label: function f(){}", "Unexpected token \"function\"");
    testParseFailure("for(let a;;) label: function f(){}", "Unexpected token \"function\"");
    testParseFailure("for(a in b) label: function f(){}", "Unexpected token \"function\"");
    testParseFailure("for(var a in b) label: function f(){}", "Unexpected token \"function\"");
    testParseFailure("for(let a in b) label: function f(){}", "Unexpected token \"function\"");
    testParseFailure("for(const a in b) label: function f(){}", "Unexpected token \"function\"");
    testParseFailure("for(a of b) label: function f(){}", "Unexpected token \"function\"");
    testParseFailure("for(var a of b) label: function f(){}", "Unexpected token \"function\"");
    testParseFailure("for(let a of b) label: function f(){}", "Unexpected token \"function\"");
    testParseFailure("for(const a of b) label: function f(){}", "Unexpected token \"function\"");
    testParseFailure("for(;;) labelA: labelB: labelC: function f(){}", "Unexpected token \"function\"");

    // 13.6.3.1
    // It is a Syntax Error if any element of the BoundNames of LexicalDeclaration also occurs in the VarDeclaredNames of Statement.
    testParseFailure("for(let a;;) { var a; }", "Duplicate binding \"a\"");
    testParseFailure("for(const a = 0;;) { var a; }", "Duplicate binding \"a\"");

    // 13.6.4.1
    // It is a Syntax Error if the BoundNames of ForDeclaration contains "let".
    testParseFailure("for(let let in 0);", "Invalid lexical binding name \"let\"");
    testParseFailure("for(const let in 0);", "Invalid lexical binding name \"let\"");
    testParseFailure("for(let let of 0);", "Invalid lexical binding name \"let\"");
    testParseFailure("for(const let of 0);", "Invalid lexical binding name \"let\"");
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
    testParseFailure("continue;", "Illegal continue statement");
    testParseFailure("{ continue; }", "Illegal continue statement");
    testParseFailure("if(0) continue;", "Illegal continue statement");
    testParseFailure("while(0) !function(){ continue; };", "Illegal continue statement");
    testParseFailure("while(0) { function f(){ continue; } }", "Illegal continue statement");
    testParseFailure("label: continue label;", "Illegal continue statement");
    testParseFailure("label: { continue label; }", "Illegal continue statement");
    testParseFailure("label: if(0) continue label;", "Illegal continue statement");
    testParseFailure("label: while(0) !function(){ continue label; };", "Undefined label \"label\"");
    testParseFailure("label: while(0) { function f(){ continue label; } }", "Undefined label \"label\"");

    // 13.8.1
    // It is a Syntax Error if this production is not nested, directly or indirectly (but not crossing function boundaries), within an IterationStatement or a SwitchStatement.
    testParseFailure("break;", "Illegal break statement");
    testParseFailure("{ break; }", "Illegal break statement");
    testParseFailure("if(0) break;", "Illegal break statement");
    testParseFailure("while(0) !function(){ break; };", "Illegal break statement");
    testParseFailure("while(0) { function f(){ break; } }", "Illegal break statement");
    testParseFailure("switch(0) { case 0: !function(){ break; }; }", "Illegal break statement");
    testParseFailure("switch(0) { case 0: function f(){ break; } }", "Illegal break statement");
    testParseFailure("switch(0) { default: !function(){ break; }; }", "Illegal break statement");
    testParseFailure("switch(0) { default: function f(){ break; } }", "Illegal break statement");

    // 13.10.1
    // It is a Syntax Error if the code that matches this production is contained in strict code.
    testParseFailure("'use strict'; with(0);", "Strict mode code may not include a with statement");
    // It is a Syntax Error if IsLabelledFunction(Statement) is true.
    testParseFailure("with(0) label: function f(){}", "Unexpected token \"function\"");

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
    testParseFailure("'use strict'; function f(a, a){}", "Strict mode function may not have duplicate parameter names");
    testParseFailure("'use strict'; function f([a, a]){}", "Duplicate binding \"a\"");
    testParseModuleFailure("export default function(a, a){}", "Strict mode function may not have duplicate parameter names");
    testParseModuleFailure("export default function([a, a]){}", "Duplicate binding \"a\"");
    testParseFailure("'use strict'; !function(a, a){}", "Strict mode function may not have duplicate parameter names");
    testParseFailure("'use strict'; !function([a, a]){}", "Duplicate binding \"a\"");
    // If the source code matching this production is strict code, it is a Syntax Error if BindingIdentifier is the IdentifierName eval or the IdentifierName arguments.
    testParseFailure("'use strict'; function eval(){}", "Function name may not be eval or arguments in strict mode");
    testParseFailure("'use strict'; function arguments(){}", "Function name may not be eval or arguments in strict mode");
    testParseFailure("'use strict'; !function eval(){}", "Function name may not be eval or arguments in strict mode");
    testParseFailure("'use strict'; !function arguments(){}", "Function name may not be eval or arguments in strict mode");
    // It is a Syntax Error if any element of the BoundNames of FormalParameters also occurs in the LexicallyDeclaredNames of FunctionBody.
    testParseFailure("function f(a){ let a; }", "Duplicate binding \"a\"");
    testParseFailure("function f(a){ const a = 0; }", "Duplicate binding \"a\"");
    testParseModuleFailure("export default function(a){ let a; }", "Duplicate binding \"a\"");
    testParseModuleFailure("export default function(a){ const a = 0; }", "Duplicate binding \"a\"");
    testParseFailure("!function(a){ let a; }", "Duplicate binding \"a\"");
    testParseFailure("!function(a){ const a = 0; }", "Duplicate binding \"a\"");
    // It is a Syntax Error if FormalParameters Contains SuperProperty is true.
    testParseFailure("function f(a = super.b){}", "Unexpected super property");
    testParseModuleFailure("export default function(a = super.b){}", "Unexpected super property");
    testParseFailure("!function(a = super.b){}", "Unexpected super property");
    testParseFailure("!{ a() { function f(a = super.b()){} } };", "Unexpected super property");
    testParseFailure("!{ a() { !function(a = super.b()){} } };", "Unexpected super property");
    testParseFailure("class A extends B { a() { function f(a = super.b()){} } }", "Unexpected super property");
    testParseFailure("class A extends B { a() { !function(a = super.b()){} } }", "Unexpected super property");
    // It is a Syntax Error if FunctionBody Contains SuperProperty is true.
    testParseFailure("function f(a){ super.b }", "Unexpected super property");
    testParseModuleFailure("export default function(a){ super.b }", "Unexpected super property");
    testParseFailure("!function(a){ super.b }", "Unexpected super property");
    testParseFailure("!{ a() { function f(){ super.b(); } } };", "Unexpected super property");
    testParseFailure("!{ a() { !function(){ super.b(); } } };", "Unexpected super property");
    testParseFailure("class A extends B { a() { function f(){ super.b(); } } }", "Unexpected super property");
    testParseFailure("class A extends B { a() { !function(){ super.b(); } } }", "Unexpected super property");
    // It is a Syntax Error if FormalParameters Contains SuperCall is true.
    testParseFailure("function f(a = super()){}", "Unexpected super call");
    testParseModuleFailure("export default function(a = super()){}", "Unexpected super call");
    testParseFailure("!function(a = super()){}", "Unexpected super call");
    testParseFailure("class A extends B { constructor() { function f(a = super()){} } }", "Unexpected super call");
    testParseFailure("class A extends B { constructor() { !function(a = super()){} } }", "Unexpected super call");
    // It is a Syntax Error if FunctionBody Contains SuperCall is true.
    testParseFailure("function f(a){ super() }", "Unexpected super call");
    testParseModuleFailure("export default function(a){ super() }", "Unexpected super call");
    testParseFailure("!function(a){ super() }", "Unexpected super call");
    testParseFailure("class A extends B { constructor() { function f(){ super(); } } }", "Unexpected super call");
    testParseFailure("class A extends B { constructor() { !function(){ super(); } } }", "Unexpected super call");
    // It is a Syntax Error if BoundNames of FormalParameters contains any duplicate elements.
    testParseFailure("!{ f(a, a){} };", "Strict mode function may not have duplicate parameter names");
    testParseFailure("!{ f([a, a]){} };", "Duplicate binding \"a\"");
    testParseFailure("!{ f({a, a}){} };", "Duplicate binding \"a\"");
    testParseFailure("!{ *g(a, a){} };", "Strict mode function may not have duplicate parameter names");
    testParseFailure("!{ *g([a, a]){} };", "Duplicate binding \"a\"");
    testParseFailure("!{ *g({a, a}){} };", "Duplicate binding \"a\"");
    testParseFailure("class A { static f(a, a){} }", "Strict mode function may not have duplicate parameter names");
    testParseFailure("class A { static f([a, a]){} }", "Duplicate binding \"a\"");
    testParseFailure("class A { static f({a, a}){} }", "Duplicate binding \"a\"");
    testParseFailure("(a, a) => 0;", "Strict mode function may not have duplicate parameter names");
    testParseFailure("([a, a]) => 0;", "Strict mode function may not have duplicate parameter names");
    testParseFailure("({a, a}) => 0;", "Strict mode function may not have duplicate parameter names");
    testParseFailure("([a],...a)=>0", "Strict mode function may not have duplicate parameter names");
    testParseFailure("(a,...a)=>0", "Strict mode function may not have duplicate parameter names");
    testParseFailure("([a],...a)=>0", "Strict mode function may not have duplicate parameter names");
    // It is a Syntax Error if IsSimpleParameterList of FormalParameterList is false and BoundNames of FormalParameterList contains any duplicate elements.
    testParseFailure("function f(a, [a]){}", "Strict mode function may not have duplicate parameter names");
    testParseFailure("(function([a, a]){})", "Duplicate binding \"a\"");
    testParseFailure("(function({a: x, b: x}){})", "Duplicate binding \"x\"");
    testParseFailure("(function({a: x}, {b: x}){})", "Strict mode function may not have duplicate parameter names");
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
    testParseFailure("function f(){ break label; }", "Undefined label \"label\"");
    testParseFailure("function f(){ labelA: break labelB; }", "Undefined label \"labelB\"");
    // It is a Syntax Error if ContainsUndefinedContinueTarget of FunctionStatementList with arguments « » and « » is true.
    testParseFailure("function f(){ while(0) continue label; }", "Undefined label \"label\"");
    testParseFailure("function f(){ labelA: while(0) continue labelB; }", "Undefined label \"labelB\"");

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
    testParseFailure("!{ *f(a = super()){} };", "Unexpected super call");
    testParseFailure("!{ *f(a) { super() } };", "Unexpected super call");
    // It is a Syntax Error if any element of the BoundNames of StrictFormalParameters also occurs in the LexicallyDeclaredNames of GeneratorBody.
    testParseFailure("!{ *f(a) { let a; } };", "Duplicate binding \"a\"");
    testParseFailure("!{ *f([a]){ let a; } };", "Duplicate binding \"a\"");
    testParseFailure("!{ *f({a}){ let a; } };", "Duplicate binding \"a\"");
    // It is a Syntax Error if HasDirectSuper of GeneratorDeclaration is true .
    testParseFailure("function* f(a = super()){}", "Unexpected super call");
    testParseFailure("function* f(a){ super() }", "Unexpected super call");
    testParseFailure("class A extends B { constructor() { function* f(){ super(); } } }", "Unexpected super call");
    // It is a Syntax Error if HasDirectSuper of GeneratorExpression is true .
    testParseFailure("!function* f(a = super()){}", "Unexpected super call");
    testParseFailure("!function* f(a) { super() }", "Unexpected super call");
    // If the source code matching this production is strict code, the Early Error rules for StrictFormalParameters : FormalParameters are applied.
    testParseFailure("'use strict'; function* f(a, a){}", "Strict mode function may not have duplicate parameter names");
    testParseFailure("'use strict'; !function*(a, a){}", "Strict mode function may not have duplicate parameter names");
    // If the source code matching this production is strict code, it is a Syntax Error if BindingIdentifier is the IdentifierName eval or the IdentifierName arguments.
    testParseFailure("function* eval(){}", "Function name may not be eval or arguments in strict mode");
    testParseFailure("function* arguments(){}", "Function name may not be eval or arguments in strict mode");
    testParseFailure("!function* eval(){}", "Function name may not be eval or arguments in strict mode");
    testParseFailure("!function* arguments(){}", "Function name may not be eval or arguments in strict mode");
    // It is a Syntax Error if any element of the BoundNames of FormalParameters also occurs in the LexicallyDeclaredNames of GeneratorBody.
    testParseFailure("function* f(a) { let a; }", "Duplicate binding \"a\"");
    testParseFailure("function* f([a]){ let a; }", "Duplicate binding \"a\"");
    testParseFailure("function* f({a}){ let a; }", "Duplicate binding \"a\"");
    // It is a Syntax Error if FormalParameters Contains SuperProperty is true.
    testParseFailure("function* f(a = super.b){}", "Unexpected super property");
    testParseFailure("!function* (a = super.b){}", "Unexpected super property");
    testParseFailure("!{ a() { function* f(a = super.b()){} } };", "Unexpected super property");
    testParseFailure("!{ a() { !function* (a = super.b()){} } };", "Unexpected super property");
    testParseFailure("class A extends B { a() { function* f(a = super.b()){} } }", "Unexpected super property");
    testParseFailure("class A extends B { a() { !function* (a = super.b()){} } }", "Unexpected super property");
    // It is a Syntax Error if GeneratorBody Contains SuperProperty is true.
    testParseFailure("function* f(a){ super.b }", "Unexpected super property");
    testParseFailure("!function* (a){ super.b }", "Unexpected super property");
    testParseFailure("!{ a() { function* f(){ super.b(); } } };", "Unexpected super property");
    testParseFailure("!{ a() { !function* (){ super.b(); } } };", "Unexpected super property");
    testParseFailure("class A extends B { a() { function* f(){ super.b(); } } }", "Unexpected super property");
    testParseFailure("class A extends B { a() { !function* (){ super.b(); } } }", "Unexpected super property");

    // 14.5.1
    // It is a Syntax Error if ClassHeritage is not present and the following algorithm evaluates to true:
    //   1. Let constructor be ConstructorMethod of ClassBody.
    //   2. If constructor is empty, return false.
    //   3. Return HasDirectSuper of constructor.
    testParseFailure("class A { constructor() { super(); } }", "Unexpected super call");
    testParseFailure("class A { constructor() { {{ (( super() )); }} } }", "Unexpected super call");
    // It is a Syntax Error if PrototypePropertyNameList of ClassElementList contains more than one occurrence of "constructor".
    testParseFailure("class A { constructor(){} constructor(){} }", "Only one constructor is allowed in a class");
    testParseFailure("class A { constructor(){} \"constructor\"(){} }", "Only one constructor is allowed in a class");
    // It is a Syntax Error if PropName of MethodDefinition is not "constructor" and HasDirectSuper of MethodDefinition is true.
    testParseFailure("class A extends B { f() { super(); } }", "Unexpected super call");
    // It is a Syntax Error if PropName of MethodDefinition is "constructor" and SpecialMethod of MethodDefinition is true.
    testParseFailure("class A { *constructor(){} }", "Constructors cannot be generators, getters or setters");
    testParseFailure("class A { get constructor(){} }", "Constructors cannot be generators, getters or setters");
    testParseFailure("class A { set constructor(a) {} }", "Constructors cannot be generators, getters or setters");
    // It is a Syntax Error if HasDirectSuper of MethodDefinition is true.
    testParseFailure("class A extends B { static f() { super(); } }", "Unexpected super call");
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
    testParseFailure("super()", "Unexpected super call");
    testParseFailure("super.a", "Unexpected super property");
    // It is a Syntax Error if StatementList Contains NewTarget unless the source code containing NewTarget is eval code that is being processed by a direct eval that is contained in function code. However, such function code does not include ArrowFunction function code.
    testParseFailure("new.target", "Unexpected new . target");
    // It is a Syntax Error if ContainsDuplicateLabels of StatementList with argument « » is true.
    testParseFailure("label: label: ;", "Label \"label\" has already been declared");
    // It is a Syntax Error if ContainsUndefinedBreakTarget of StatementList with argument « » is true.
    testParseFailure("break label;", "Undefined label \"label\"");
    testParseFailure("labelA: break labelB;", "Undefined label \"labelB\"");
    // It is a Syntax Error if ContainsUndefinedContinueTarget of StatementList with arguments « » and « » is true.
    testParseFailure("while(0) continue label;", "Undefined label \"label\"");
    testParseFailure("labelA: while(0) continue labelB;", "Undefined label \"labelB\"");

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
    testParseModuleFailure("export var a; export var a;", "Duplicate export of \"a\"");
    testParseModuleFailure("export {a, a};", "Duplicate export of \"a\"");
    testParseModuleFailure("export {a, b as a};", "Duplicate export of \"a\"");
    testParseModuleFailure("export {a, a as a};", "Duplicate export of \"a\"");
    testParseModuleFailure("export {a}; export class a{};", "Duplicate export of \"a\"");
    testParseModuleFailure("export {a}; export function a(){};", "Duplicate export of \"a\"");
    testParseModuleFailure("export let a; export let a;", "Duplicate export of \"a\"");
    testParseModuleFailure("export const a = 0; export const a = 0;", "Duplicate export of \"a\"");
    testParseModuleFailure("export let a; export let a;", "Duplicate export of \"a\"");
    testParseModuleFailure("export default 0; export default 0;", "Duplicate export of \"default\"");
    testParseModuleFailure("export default 0; export default function f(){};", "Duplicate export of \"default\"");
    testParseModuleFailure("export default 0; export default class a {};", "Duplicate export of \"default\"");
    // It is a Syntax Error if any element of the ExportedBindings of ModuleItemList does not also occur in either the VarDeclaredNames of ModuleItemList, or the LexicallyDeclaredNames of ModuleItemList.
    testParseModuleFailure("export {a};", "Export \"a\" is not defined in module");
    testParseModuleFailure("var a; export {b as a};", "Export \"b\" is not defined in module");
    testParseModuleFailure("export {a as b}; var b;", "Export \"a\" is not defined in module");
    testParseModuleFailure("let a; export {b as a};", "Export \"b\" is not defined in module");
    testParseModuleFailure("export {a as b}; let b;", "Export \"a\" is not defined in module");
    // It is a Syntax Error if ModuleItemList Contains super.
    testParseModuleFailure("super()", "Unexpected super call");
    testParseModuleFailure("super.a", "Unexpected super property");
    // It is a Syntax Error if ModuleItemList Contains NewTarget
    testParseModuleFailure("new.target", "Unexpected new . target");
    // It is a Syntax Error if ContainsDuplicateLabels of ModuleItemList with argument « » is true.
    testParseModuleFailure("label: label: ;", "Label \"label\" has already been declared");
    // It is a Syntax Error if ContainsUndefinedBreakTarget of ModuleItemList with argument « » is true.
    testParseModuleFailure("break label;", "Undefined label \"label\"");
    testParseModuleFailure("labelA: break labelB;", "Undefined label \"labelB\"");
    // It is a Syntax Error if ContainsUndefinedContinueTarget of ModuleItemList with arguments « » and « » is true.
    testParseModuleFailure("while(0) continue label;", "Undefined label \"label\"");
    testParseModuleFailure("labelA: while(0) continue labelB;", "Undefined label \"labelB\"");

    // 15.2.2.1
    // It is a Syntax Error if the BoundNames of ImportDeclaration contains any duplicate entries.
    testParseModuleFailure("import a, * as a from \"module\";", "Duplicate imported names in import declaration");
    testParseModuleFailure("import a, {a} from \"module\";", "Duplicate imported names in import declaration");
    testParseModuleFailure("import a, {b as a} from \"module\";", "Duplicate imported names in import declaration");
    testParseModuleFailure("import {a, b as a} from \"module\";", "Duplicate imported names in import declaration");
    testParseModuleFailure("import {a, a} from \"module\";", "Duplicate imported names in import declaration");
    testParseModuleFailure("import {b as a, c as a} from \"module\";", "Duplicate imported names in import declaration");

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
    testParseFailure("'use strict'; label: function f(){}", "Unexpected token \"function\"");

    // Annex B 3.5 (13.14.1)
    // It is a Syntax Error if any element of the BoundNames of CatchParameter also occurs in the LexicallyDeclaredNames of Block.
    testParseFailure("try {} catch(e) { let e; }", "Duplicate binding \"e\"");
    testParseFailure("try {} catch(e) { function e(){} }", "Duplicate binding \"e\"");
    // It is a Syntax Error if any element of the BoundNames of CatchParameter also occurs in the VarDeclaredNames of Block,
    // unless that element is only bound by a VariableStatement or the VariableDeclarationList of a for statement,
    // or the ForBinding of a for-in statement.
    testParseFailure("try {} catch(e) { for(var e of 0); }", "Catch parameter \"e\" redeclared as var in for-of loop");

  });
});
