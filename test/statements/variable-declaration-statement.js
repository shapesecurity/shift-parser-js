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

var Shift = require("shift-ast");

var stmt = require("../helpers").stmt;
var expr = require("../helpers").expr;
var testParse = require("../assertions").testParse;
var testParseFailure = require("../assertions").testParseFailure;

suite("Parser", function () {
  suite("variable declaration statement", function () {
    // Variable Statement
    testParse("var x", stmt,
      new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
        new Shift.VariableDeclarator({ type: "BindingIdentifier", name: "x" }, null),
      ]))
    );
    testParse("var a;", stmt,
      new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
        new Shift.VariableDeclarator({ type: "BindingIdentifier", name: "a" }, null),
      ]))
    );
    testParse("var x, y;", stmt,
      new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
        new Shift.VariableDeclarator({ type: "BindingIdentifier", name: "x" }, null),
        new Shift.VariableDeclarator({ type: "BindingIdentifier", name: "y" }, null),
      ]))
    );
    testParse("var x = 0", stmt,
      new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
        new Shift.VariableDeclarator({ type: "BindingIdentifier", name: "x" }, new Shift.LiteralNumericExpression(0)),
      ]))
    );
    testParse("var eval = 0, arguments = 1", stmt,
      new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
        new Shift.VariableDeclarator({ type: "BindingIdentifier", name: "eval" }, new Shift.LiteralNumericExpression(0)),
        new Shift.VariableDeclarator({ type: "BindingIdentifier", name: "arguments" }, new Shift.LiteralNumericExpression(1)),
      ]))
    );
    testParse("var x = 0, y = 1, z = 2", stmt,
      new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
        new Shift.VariableDeclarator({ type: "BindingIdentifier", name: "x" }, new Shift.LiteralNumericExpression(0)),
        new Shift.VariableDeclarator({ type: "BindingIdentifier", name: "y" }, new Shift.LiteralNumericExpression(1)),
        new Shift.VariableDeclarator({ type: "BindingIdentifier", name: "z" }, new Shift.LiteralNumericExpression(2)),
      ]))
    );
    testParse("var implements, interface, package", stmt,
      new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
        new Shift.VariableDeclarator({ type: "BindingIdentifier", name: "implements" }, null),
        new Shift.VariableDeclarator({ type: "BindingIdentifier", name: "interface" }, null),
        new Shift.VariableDeclarator({ type: "BindingIdentifier", name: "package" }, null),
      ]))
    );
    testParse("var private, protected, public", stmt,
      new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
        new Shift.VariableDeclarator({ type: "BindingIdentifier", name: "private" }, null),
        new Shift.VariableDeclarator({ type: "BindingIdentifier", name: "protected" }, null),
        new Shift.VariableDeclarator({ type: "BindingIdentifier", name: "public" }, null),
      ]))
    );
    testParse("var yield;", stmt,
      new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
        new Shift.VariableDeclarator({ type: "BindingIdentifier", name: "yield" }, null),
      ]))
    );

    // Let Statement
    testParse("let x", stmt,
      new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("let", [
        new Shift.VariableDeclarator({ type: "BindingIdentifier", name: "x" }, null),
      ]))
    );
    testParse("{ let x }", stmt,
      new Shift.BlockStatement(new Shift.Block([
        new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("let", [
          new Shift.VariableDeclarator({ type: "BindingIdentifier", name: "x" }, null),
        ])),
      ]))
    );
    testParse("{ let x = 0 }", stmt,
      new Shift.BlockStatement(new Shift.Block([
        new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("let", [
          new Shift.VariableDeclarator({ type: "BindingIdentifier", name: "x" }, new Shift.LiteralNumericExpression(0)),
        ])),
      ]))
    );
    testParse("{ let x = 0, y = 1, z = 2 }", stmt,
      new Shift.BlockStatement(new Shift.Block([
        new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("let", [
          new Shift.VariableDeclarator({ type: "BindingIdentifier", name: "x" }, new Shift.LiteralNumericExpression(0)),
          new Shift.VariableDeclarator({ type: "BindingIdentifier", name: "y" }, new Shift.LiteralNumericExpression(1)),
          new Shift.VariableDeclarator({ type: "BindingIdentifier", name: "z" }, new Shift.LiteralNumericExpression(2)),
        ])),
      ]))
    );

    // Const Statement
    testParseFailure("const x", "Unexpected end of input");
    testParseFailure("{ const x }", "Unexpected token }");
    testParse("{ const x = 0 }", stmt,
      new Shift.BlockStatement(new Shift.Block([
        new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("const", [
          new Shift.VariableDeclarator({ type: "BindingIdentifier", name: "x" }, new Shift.LiteralNumericExpression(0)),
        ])),
      ]))
    );
    testParse("{ const x = 0, y = 1, z = 2 }", stmt,
      new Shift.BlockStatement(new Shift.Block([
        new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("const", [
          new Shift.VariableDeclarator({ type: "BindingIdentifier", name: "x" }, new Shift.LiteralNumericExpression(0)),
          new Shift.VariableDeclarator({ type: "BindingIdentifier", name: "y" }, new Shift.LiteralNumericExpression(1)),
          new Shift.VariableDeclarator({ type: "BindingIdentifier", name: "z" }, new Shift.LiteralNumericExpression(2)),
        ])),
      ]))
    );
    testParse("var static;", stmt,
      new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration("var", [
        new Shift.VariableDeclarator({ type: "BindingIdentifier", name: "static" }, null),
      ]))
    );

    testParse("(let[a])", expr,
      new Shift.ComputedMemberExpression(
        { type: "IdentifierExpression", name: "let" },
        { type: "IdentifierExpression", name: "a" }
      )
    );

    // FIXME(bzhang): testParseFailure("var a[0]=0;", "Unexpected token 'a'");
    // FIXME(bzhang): testParseFailure("var (a)=0;", "Unexpected token '('");
    testParseFailure("var new A = 0;", "Unexpected token new");
    testParseFailure("var (x)", "Unexpected token (");
    testParseFailure("var this", "Unexpected token this");
    testParseFailure("var a.b;", "Unexpected identifier");
    testParseFailure("'use strict'; var enum;", "Unexpected reserved word");
  });
});
