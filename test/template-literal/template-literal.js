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
  suite("untagged template literals", function () {
    testParse('``', expr, new Shift.TemplateString(null, [new Shift.TemplateLiteral('')]));
    testParse('`abc`', expr, new Shift.TemplateString(null, [new Shift.TemplateLiteral('abc')]));
    testParse('`\n`', expr, new Shift.TemplateString(null, [new Shift.TemplateLiteral('\n')]));
    testParse('`\r\n\t\n`', expr, new Shift.TemplateString(null, [new Shift.TemplateLiteral('\r\n\t\n')]));
    testParse('`\\``', expr, new Shift.TemplateString(null, [new Shift.TemplateLiteral('\\`')]));
    testParse('`$$$`', expr, new Shift.TemplateString(null, [new Shift.TemplateLiteral('$$$')]));
    testParse('`$$$${a}`', expr, new Shift.TemplateString(null, [new Shift.TemplateLiteral('$$$'), new Shift.IdentifierExpression(new Shift.Identifier('a')), new Shift.TemplateLiteral('')]));
    testParse('`${a}`', expr, new Shift.TemplateString(null, [new Shift.TemplateLiteral(''), new Shift.IdentifierExpression(new Shift.Identifier('a')), new Shift.TemplateLiteral('')]));
    testParse('`${a}$`', expr, new Shift.TemplateString(null, [new Shift.TemplateLiteral(''), new Shift.IdentifierExpression(new Shift.Identifier('a')), new Shift.TemplateLiteral('$')]));
    testParse('`${a}${b}`', expr, new Shift.TemplateString(null, [
      new Shift.TemplateLiteral(''),
      new Shift.IdentifierExpression(new Shift.Identifier('a')),
      new Shift.TemplateLiteral(''),
      new Shift.IdentifierExpression(new Shift.Identifier('b')),
      new Shift.TemplateLiteral(''),
    ]));
    testParse('````', expr, new Shift.TemplateString(new Shift.TemplateString(null, [new Shift.TemplateLiteral('')]), [new Shift.TemplateLiteral('')]));
    testParse('``````', expr, new Shift.TemplateString(new Shift.TemplateString(new Shift.TemplateString(null, [new Shift.TemplateLiteral('')]), [new Shift.TemplateLiteral('')]), [new Shift.TemplateLiteral('')]));

    testParseFailure('`', 'Unexpected token ILLEGAL');
    testParseFailure('`${a', 'Unexpected token ILLEGAL');
    testParseFailure('`${a}a${b}', 'Unexpected token ILLEGAL');
    testParseFailure('`\\37`', 'Unexpected token ILLEGAL');
  });

  suite("tagged template literals", function () {
    testParse('a``', expr, new Shift.TemplateString(new Shift.IdentifierExpression(new Shift.Identifier('a')), [new Shift.TemplateLiteral('')]));
    testParse('a()``', expr, new Shift.TemplateString(new Shift.CallExpression(new Shift.IdentifierExpression(new Shift.Identifier('a')), []), [new Shift.TemplateLiteral('')]));
    testParse('new a``', expr, new Shift.NewExpression(new Shift.TemplateString(new Shift.IdentifierExpression(new Shift.Identifier('a')), [new Shift.TemplateLiteral('')]), []));
    testParse('new a()``', expr, new Shift.TemplateString(new Shift.NewExpression(new Shift.IdentifierExpression(new Shift.Identifier('a')),[]), [new Shift.TemplateLiteral('')]));
  });
});
