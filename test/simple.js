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
var esprima = require('esprima');
var converters = require('shift-spidermonkey-converter');
var ShiftParser = require('../');

describe("API", function () {
  it("should exist", function () {
    expect(typeof ShiftParser.default).be('function');
  });
});

describe("Parser", function () {
  var parse = ShiftParser.default;
  describe("parses simple JavaScript", function () {
    function test(source) {
      it(source, function () {
        expect(parse(source)).eql(converters.toShift(esprima.parse(source)));
      })
    }

    test("");
    test(" ");
    test(" /**/");
    test(" /****/");
    test(" /**\n\r\r\n**/");
    test(" //\n");
    test("//\n;a;");

    test("x");
    test("'x';");
    test("\"x\";");
    test("0;");
    test("null;");
    test("/a/g;");
    test("1+2;");
    test("[,,1,,,3,4,,]");
    test("a=2;");
    test("a(b,c)");
    test("new a(b,c)");
    test("a++");
    test("!a");
    test("a.b(b,c)");
    test("a[b](b,c)");
    test("function a(a,b,c) {'use strict';return 0;};");
    test("(function(a,b,c) {'use strict';return 0;});");
    test("(function a(a,b,c) {'use strict';return 0;});");
    test("a:{break a;}");
    test("try{}catch(a){}");
    test("try{}catch(a){}finally{}");
    test("a?b:c");
    test("do continue; while(1);");
    test("a: do continue a; while(1);");
    test("debugger");
    test("for(a;b;c);");
    test("for(var a;b;c);");
    test("for(var a = 0;b;c);");
    test("for(;b;c);");
    test("for(var a in b);");
    test("for(var a = c in b);");
    test("for(a in b);");
    test("for(a.b in b);");
    test("if(a)b;");
    test("if(a)b;else c;");
    test("+{a:0, get 'b'(){}, set 3(d){}}");
    test("while(1);");
    test("with(1);");
    test("throw this");
    test("switch(a){case 1:}");
    test("switch(a){case 1:default:case 2:}");
    test("switch(a){case 1:default:}");
    test("switch(a){default:case 2:}");
    test("var a;");
  });
});
