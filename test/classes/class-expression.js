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

var ShiftParser = require('../..');
var Shift = require("shift-ast");
var testParse = require('../assertions').testParse;
var testParseFailure = require('../assertions').testParseFailure;
var expr = require("../helpers").expr;
var locationSanityCheck = require('../helpers').locationSanityCheck;

suite("Parser", function () {
  suite("class expression", function () {

    function locationSanityTest(source) {
      test(source, function() {
        var tree = ShiftParser.default(source, {loc: true});
        locationSanityCheck(tree);
      });
    }

    testParse("(class {})", expr, new Shift.ClassExpression(null, null, []));
    testParse("(class A{})", expr, new Shift.ClassExpression(new Shift.Identifier("A"), null, []));
    testParse("(class extends A {})", expr, new Shift.ClassExpression(null, new Shift.IdentifierExpression(new Shift.Identifier("A")), []));
    testParse("(class A extends A {})", expr, new Shift.ClassExpression(new Shift.Identifier("A"), new Shift.IdentifierExpression(new Shift.Identifier("A")), []));

    testParse("(class {;;;\n;\n})", expr, new Shift.ClassExpression(null, null, []));
    testParse("(class {;;;\n;a(){}})", expr,
      new Shift.ClassExpression(
        null,
        null,
        [
          new Shift.ClassElement(
            false,
            new Shift.Method(
              false,
              new Shift.StaticPropertyName("a"),
              [],
              null,
              new Shift.FunctionBody([], [])))]));

    testParse("(class {;;;\n;a(){}b(){}})", expr,
      new Shift.ClassExpression(
        null,
        null,
        [
          new Shift.ClassElement(
            false,
            new Shift.Method(
              false,
              new Shift.StaticPropertyName("a"),
              [],
              null,
              new Shift.FunctionBody([], []))),
          new Shift.ClassElement(
            false,
            new Shift.Method(
              false,
              new Shift.StaticPropertyName("b"),
              [],
              null,
              new Shift.FunctionBody([], [])))]));

    testParse("(class {set a(b) {}})", expr,
      new Shift.ClassExpression(
        null,
        null,
        [
          new Shift.ClassElement(false, new Shift.Setter(
            new Shift.StaticPropertyName("a"),
            new Shift.BindingIdentifier(new Shift.Identifier("b")),
            new Shift.FunctionBody([], [])
          ))
        ]
      )
    );

    testParse("(class {get a() {}})", expr,
      new Shift.ClassExpression(
        null,
        null,
        [
          new Shift.ClassElement(false, new Shift.Getter(
            new Shift.StaticPropertyName("a"),
            new Shift.FunctionBody([], [])
          ))
        ]
      )
    );

    testParse("(class {set a(b) {'use strict';}})", expr,
      new Shift.ClassExpression(
        null,
        null,
        [
          new Shift.ClassElement(false, new Shift.Setter(
            new Shift.StaticPropertyName("a"),
            new Shift.BindingIdentifier(new Shift.Identifier("b")),
            new Shift.FunctionBody([new Shift.Directive('use strict')], [])
          ))
        ]
      )
    );

    testParse("(class {a(b) {'use strict';}})", expr,
      new Shift.ClassExpression(
        null,
        null,
        [
          new Shift.ClassElement(false, new Shift.Method(
            false,
            new Shift.StaticPropertyName("a"),
            [new Shift.BindingIdentifier(new Shift.Identifier("b"))],
            null,
            new Shift.FunctionBody([new Shift.Directive('use strict')], [])
          ))
        ]
      )
    );

    testParse("(class {prototype() {}})", expr,
      new Shift.ClassExpression(
        null,
        null,
        [
          new Shift.ClassElement(false, new Shift.Method(
            false,
            new Shift.StaticPropertyName("prototype"),
            [],
            null,
            new Shift.FunctionBody([], [])
          ))
        ]
      )
    );

    testParse("(class {a() {}})", expr,
      new Shift.ClassExpression(
        null,
        null,
        [
          new Shift.ClassElement(false, new Shift.Method(
            false,
            new Shift.StaticPropertyName("a"),
            [],
            null,
            new Shift.FunctionBody([], [])
          ))
        ]
      )
    );

    testParse("(class {3() {}})", expr,
      new Shift.ClassExpression(
        null,
        null,
        [
          new Shift.ClassElement(false, new Shift.Method(
            false,
            new Shift.StaticPropertyName("3"),
            [],
            null,
            new Shift.FunctionBody([], [])
          ))
        ]
      )
    );

    testParse("(class{[3+5](){}})", expr,
      new Shift.ClassExpression(
        null,
        null,
        [
          new Shift.ClassElement(false, new Shift.Method(
            false,
            new Shift.ComputedPropertyName(
              new Shift.BinaryExpression(
                "+",
                new Shift.LiteralNumericExpression(3),
                new Shift.LiteralNumericExpression(5)
              )
            ),
            [],
            null,
            new Shift.FunctionBody([], [])
          ))
        ]
      )
    );

    testParse("(class extends (a,b) {})", expr,
      new Shift.ClassExpression(
        null,
        new Shift.BinaryExpression(",",
          new Shift.IdentifierExpression(new Shift.Identifier("a")),
          new Shift.IdentifierExpression(new Shift.Identifier("b"))),
        []
      )
    );

    testParse("var x = class extends (a,b) {};", function stmt(program) {
        return program.body.statements[0].declaration.declarators[0].init;
      },
      new Shift.ClassExpression(
        null,
        new Shift.BinaryExpression(",",
          new Shift.IdentifierExpression(new Shift.Identifier("a")),
          new Shift.IdentifierExpression(new Shift.Identifier("b"))),
        []
      )
    );

    testParse("(class {static(){}})", expr, new Shift.ClassExpression(null, null, [
      new Shift.ClassElement(
        false,
        new Shift.Method(
          false,
          new Shift.StaticPropertyName("static"),
          [],
          null,
          new Shift.FunctionBody([], [])))
    ]));

    testParse("(class {static constructor(){}})", expr, new Shift.ClassExpression(
      null,
      null,
      [
        new Shift.ClassElement(
          true,
          new Shift.Method(
            false,
            new Shift.StaticPropertyName("constructor"),
            [],
            null,
            new Shift.FunctionBody([], [])
          ))]));

    testParseFailure("(class {a(eval){'use strict';}})", "Parameter name eval or arguments is not allowed in strict mode");
    testParseFailure("(class {set a(eval){'use strict';}})", "Parameter name eval or arguments is not allowed in strict mode");
    testParseFailure("(class {a:0})", "Only methods are allowed in classes");
    testParseFailure("(class {get constructor(){}})", "Constructors cannot be generators, getters or setters");
    testParseFailure("(class {constructor(){}a(){}constructor(){}})", "Only one constructor is allowed in a class");
    testParseFailure("(class {static prototype(){}})", "Static class methods cannot be named \'prototype\'");
    testParseFailure("(class {a=0})", "Only methods are allowed in classes");
    testParseFailure("(class {a})", "Only methods are allowed in classes");
    testParseFailure("(class {3:0})", "Only methods are allowed in classes");
    testParseFailure("(class {[3]:0})", "Only methods are allowed in classes");
    testParseFailure("(class {)", "Unexpected token )");
    testParseFailure("(class extends a,b {})", "Unexpected token ,");
    testParseFailure("(class extends !a {})", "Unexpected token !");
    testParseFailure("(class [a] {})", "Unexpected token [");
    testParseFailure("(class {[a,b](){}})", "Unexpected token ,");

    locationSanityTest("(class {})");
    locationSanityTest("(class A {})");
    locationSanityTest("(class A extends A{})");
    locationSanityTest("(class extends A{})");
    locationSanityTest("(class {a(){}})");
    locationSanityTest("(class {[a](){}})");
    locationSanityTest("(class {[a+b](){}})");
    locationSanityTest("(class {get [a+b](){}})");
    locationSanityTest("(class {set [a+b]([a]){}})");
    locationSanityTest("(class {[a](){};})");
    locationSanityTest("(class {[a](){};;})");
    locationSanityTest("(class {static [a](){};;})");
  });
});
