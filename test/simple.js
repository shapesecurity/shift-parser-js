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

var expect = require('expect.js');
var ShiftParser = require('../');
var assertEsprimaEquiv = require('./assertions').assertEsprimaEquiv;
var assertParseSuccess = require('./assertions').assertParseSuccess;

describe("API", function () {
  it("should exist", function () {
    expect(typeof ShiftParser.default).be('function');
  });
});

describe("Parser", function () {
  describe("parses simple JavaScript", function () {
    assertEsprimaEquiv("");
    assertEsprimaEquiv(" ");
    assertEsprimaEquiv(" /**/");
    assertEsprimaEquiv(" /****/");
    assertEsprimaEquiv(" /**\n\r\r\n**/");
    assertEsprimaEquiv(" //\n");
    assertEsprimaEquiv("//\n;a;");

    assertEsprimaEquiv("x");
    assertEsprimaEquiv("'x';");
    assertEsprimaEquiv("\"x\";");
    assertEsprimaEquiv("0;");
    assertEsprimaEquiv("null;");
    assertEsprimaEquiv("/a/g;");
    assertEsprimaEquiv("1+2;");
    assertEsprimaEquiv("[,,1,,,3,4,,]");
    assertEsprimaEquiv("a=2;");
    assertEsprimaEquiv("a(b,c)");
    assertEsprimaEquiv("new a(b,c)");
    assertEsprimaEquiv("a++");
    assertEsprimaEquiv("!a");
    assertEsprimaEquiv("a.b(b,c)");
    assertEsprimaEquiv("a[b](b,c)");
    assertEsprimaEquiv("function a(a,b,c) {'use strict';return 0;};");
    assertEsprimaEquiv("(function(a,b,c) {'use strict';return 0;});");
    assertEsprimaEquiv("(function a(a,b,c) {'use strict';return 0;});");
    assertEsprimaEquiv("a:{break a;}");
    assertEsprimaEquiv("try{}catch(a){}");
    assertEsprimaEquiv("try{}catch(a){}finally{}");
    assertEsprimaEquiv("a?b:c");
    assertEsprimaEquiv("do continue; while(1);");
    assertEsprimaEquiv("a: do continue a; while(1);");
    assertEsprimaEquiv("debugger");
    assertEsprimaEquiv("for(a;b;c);");
    assertEsprimaEquiv("for(var a;b;c);");
    assertEsprimaEquiv("for(var a = 0;b;c);");
    assertEsprimaEquiv("for(;b;c);");
    assertEsprimaEquiv("for(var a in b);");
    assertEsprimaEquiv("for(var a = c in b);");
    assertEsprimaEquiv("for(a in b);");
    assertEsprimaEquiv("for(a.b in b);");
    assertEsprimaEquiv("if(a)b;");
    assertEsprimaEquiv("if(a)b;else c;");
    assertEsprimaEquiv("+{a:0, get 'b'(){}, set 3(d){}}");
    assertEsprimaEquiv("while(1);");
    assertEsprimaEquiv("with(1);");
    assertEsprimaEquiv("throw this");
    assertEsprimaEquiv("switch(a){case 1:}");
    assertEsprimaEquiv("switch(a){case 1:default:case 2:}");
    assertEsprimaEquiv("switch(a){case 1:default:}");
    assertEsprimaEquiv("switch(a){default:case 2:}");
    assertEsprimaEquiv("var a;");
    assertParseSuccess("var yield;");
  });
});
