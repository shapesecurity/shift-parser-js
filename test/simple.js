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
var assertParseSuccess = require('./assertions').assertParseSuccess;

describe("API", function () {
  it("should exist", function () {
    expect(typeof ShiftParser.default).be('function');
  });
});

describe("Parser", function () {
  describe("parses simple JavaScript", function () {
    assertParseSuccess("");
    assertParseSuccess(" ");
    assertParseSuccess(" /**/");
    assertParseSuccess(" /****/");
    assertParseSuccess(" /**\n\r\r\n**/");
    assertParseSuccess(" //\n");
    assertParseSuccess("//\n;a;");

    assertParseSuccess("x");
    assertParseSuccess("'x';");
    assertParseSuccess("\"x\";");
    assertParseSuccess("0;");
    assertParseSuccess("null;");
    assertParseSuccess("/a/g;");
    assertParseSuccess("1+2;");
    assertParseSuccess("[,,1,,,3,4,,]");
    assertParseSuccess("a=2;");
    assertParseSuccess("a(b,c)");
    assertParseSuccess("new a(b,c)");
    assertParseSuccess("a++");
    assertParseSuccess("!a");
    assertParseSuccess("a.b(b,c)");
    assertParseSuccess("a[b](b,c)");
    assertParseSuccess("function a(a,b,c) {'use strict';return 0;};");
    assertParseSuccess("(function(a,b,c) {'use strict';return 0;});");
    assertParseSuccess("(function a(a,b,c) {'use strict';return 0;});");
    assertParseSuccess("a:{break a;}");
    assertParseSuccess("try{}catch(a){}");
    assertParseSuccess("try{}catch(a){}finally{}");
    assertParseSuccess("a?b:c");
    assertParseSuccess("do continue; while(1);");
    assertParseSuccess("a: do continue a; while(1);");
    assertParseSuccess("debugger");
    assertParseSuccess("for(a;b;c);");
    assertParseSuccess("for(var a;b;c);");
    assertParseSuccess("for(var a = 0;b;c);");
    assertParseSuccess("for(;b;c);");
    assertParseSuccess("for(var a in b);");
    assertParseSuccess("for(var a = c in b);");
    assertParseSuccess("for(a in b);");
    assertParseSuccess("for(a.b in b);");
    assertParseSuccess("if(a)b;");
    assertParseSuccess("if(a)b;else c;");
    assertParseSuccess("+{a:0, get 'b'(){}, set 3(d){}}");
    assertParseSuccess("while(1);");
    assertParseSuccess("with(1);");
    assertParseSuccess("throw this");
    assertParseSuccess("switch(a){case 1:}");
    assertParseSuccess("switch(a){case 1:default:case 2:}");
    assertParseSuccess("switch(a){case 1:default:}");
    assertParseSuccess("switch(a){default:case 2:}");
    assertParseSuccess("var a;");
  });
});
