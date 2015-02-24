/**
 * Copyright 2015 Shape Security, Inc.
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

var testParse = require('../assertions').testParse;
var testParseFailure = require('../assertions').testParseFailure;
var expr = require("../helpers").expr;
var stmt = require("../helpers").stmt;


suite("Parser", function () {
  suite("declarations", function () {
    testParse('let a', stmt,
      new Shift.VariableDeclarationStatement(new Shift.VariableDeclaration('let',
        [
          new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier('a')), null)
        ]))
    );

    testParse('{ let a; }', stmt,
      new Shift.BlockStatement(
        new Shift.Block([
          new Shift.VariableDeclarationStatement(
            new Shift.VariableDeclaration(
              'let',
              [new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier('a')), null)]))])));

    // TODO: lookahead let [ : testParseFailure('while(true) let[a] = 0', 'Unexpected token let');
    testParse('while(true) var a', stmt,
      new Shift.WhileStatement(
        new Shift.LiteralBooleanExpression(true),
        new Shift.VariableDeclarationStatement(
          new Shift.VariableDeclaration(
            'var',
            [new Shift.VariableDeclarator(new Shift.BindingIdentifier(new Shift.Identifier('a')), null)]))));

    testParseFailure('while(true) let a', 'Unexpected identifier');
    testParseFailure('while(true) const a', 'Unexpected token const');
    testParseFailure('with(true) let a', 'Unexpected identifier');
    testParseFailure('with(true) class a {}', 'Unexpected token class');

    testParseFailure('a: let a', 'Unexpected identifier');

  });
});
