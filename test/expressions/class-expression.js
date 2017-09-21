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

let testParse = require('../assertions').testParse;
let testParseFailure = require('../assertions').testParseFailure;
let testParseSuccess = require('../assertions').testParseSuccess;
let expr = require('../helpers').expr;
let stmt = require('../helpers').stmt;

suite('Parser', () => {
  suite('class expression', () => {

    testParse('(class {})', expr, { type: 'ClassExpression', name: null, super: null, elements: [] });
    testParse('(class A{})', expr, {
      type: 'ClassExpression',
      name: { type: 'BindingIdentifier', name: 'A' },
      super: null,
      elements: [],
    });
    testParse('(class extends A {})', expr, {
      type: 'ClassExpression',
      name: null,
      super: { type: 'IdentifierExpression', name: 'A' },
      elements: [],
    });
    testParse('(class A extends A {})', expr, {
      type: 'ClassExpression',
      name: { type: 'BindingIdentifier', name: 'A' },
      super: { type: 'IdentifierExpression', name: 'A' },
      elements: [],
    });

    testParse('(class {;;;\n;\n})', expr, { type: 'ClassExpression', name: null, super: null, elements: [] });
    testParse('(class {;;;\n;a(){}})', expr,
      {
        type: 'ClassExpression',
        name: null,
        super: null,
        elements: [{
          type: 'ClassElement',
          isStatic: false,
          method: {
            type: 'Method',
            isGenerator: false,
            name: { type: 'StaticPropertyName', value: 'a' },
            params: { type: 'FormalParameters', items: [], rest: null },
            body: { type: 'FunctionBody', directives: [], statements: [] },
          },
        }],
      }
    );

    testParse('(class {;;;\n;a(){}b(){}})', expr,
      {
        type: 'ClassExpression',
        name: null,
        super: null,
        elements: [{
          type: 'ClassElement',
          isStatic: false,
          method: {
            type: 'Method',
            isGenerator: false,
            name: { type: 'StaticPropertyName', value: 'a' },
            params: { type: 'FormalParameters', items: [], rest: null },
            body: { type: 'FunctionBody', directives: [], statements: [] },
          },
        }, {
          type: 'ClassElement',
          isStatic: false,
          method: {
            type: 'Method',
            isGenerator: false,
            name: { type: 'StaticPropertyName', value: 'b' },
            params: { type: 'FormalParameters', items: [], rest: null },
            body: { type: 'FunctionBody', directives: [], statements: [] },
          },
        }],
      }
    );

    testParse('(class {set a(b) {}})', expr,
      {
        type: 'ClassExpression',
        name: null,
        super: null,
        elements: [{
          type: 'ClassElement',
          isStatic: false,
          method: {
            type: 'Setter',
            name: { type: 'StaticPropertyName', value: 'a' },
            param: { type: 'BindingIdentifier', name: 'b' },
            body: { type: 'FunctionBody', directives: [], statements: [] },
          },
        }],
      }
    );

    testParse('(class {get a() {}})', expr,
      {
        type: 'ClassExpression',
        name: null,
        super: null,
        elements: [{
          type: 'ClassElement',
          isStatic: false,
          method: {
            type: 'Getter',
            name: { type: 'StaticPropertyName', value: 'a' },
            body: { type: 'FunctionBody', directives: [], statements: [] },
          },
        }],
      }
    );

    testParse('(class {set a(b) {\'use strict\';}})', expr,
      {
        type: 'ClassExpression',
        name: null,
        super: null,
        elements: [{
          type: 'ClassElement',
          isStatic: false,
          method: {
            type: 'Setter',
            name: { type: 'StaticPropertyName', value: 'a' },
            param: { type: 'BindingIdentifier', name: 'b' },
            body: { type: 'FunctionBody', directives: [{ type: 'Directive', rawValue: 'use strict' }], statements: [] },
          },
        }],
      }
    );

    testParse('(class {a(b) {\'use strict\';}})', expr,
      {
        type: 'ClassExpression',
        name: null,
        super: null,
        elements: [{
          type: 'ClassElement',
          isStatic: false,
          method: {
            type: 'Method',
            isGenerator: false,
            name: { type: 'StaticPropertyName', value: 'a' },
            params: { type: 'FormalParameters', items: [{ type: 'BindingIdentifier', name: 'b' }], rest: null },
            body: { type: 'FunctionBody', directives: [{ type: 'Directive', rawValue: 'use strict' }], statements: [] },
          },
        }],
      }
    );

    testParse('(class {prototype() {}})', expr,
      {
        type: 'ClassExpression',
        name: null,
        super: null,
        elements: [{
          type: 'ClassElement',
          isStatic: false,
          method: {
            type: 'Method',
            isGenerator: false,
            name: { type: 'StaticPropertyName', value: 'prototype' },
            params: { type: 'FormalParameters', items: [], rest: null },
            body: { type: 'FunctionBody', directives: [], statements: [] },
          },
        }],
      }
    );

    testParse('(class {a() {}})', expr,
      {
        type: 'ClassExpression',
        name: null,
        super: null,
        elements: [{
          type: 'ClassElement',
          isStatic: false,
          method: {
            type: 'Method',
            isGenerator: false,
            name: { type: 'StaticPropertyName', value: 'a' },
            params: { type: 'FormalParameters', items: [], rest: null },
            body: { type: 'FunctionBody', directives: [], statements: [] },
          },
        }],
      }
    );

    testParse('(class {3() {}})', expr,
      {
        type: 'ClassExpression',
        name: null,
        super: null,
        elements: [{
          type: 'ClassElement',
          isStatic: false,
          method: {
            type: 'Method',
            isGenerator: false,
            name: { type: 'StaticPropertyName', value: '3' },
            params: { type: 'FormalParameters', items: [], rest: null },
            body: { type: 'FunctionBody', directives: [], statements: [] },
          },
        }],
      }
    );

    testParse('(class{[3+5](){}})', expr,
      {
        type: 'ClassExpression',
        name: null,
        super: null,
        elements: [{
          type: 'ClassElement',
          isStatic: false,
          method: {
            type: 'Method',
            isGenerator: false,
            name: {
              type: 'ComputedPropertyName',
              expression: {
                type: 'BinaryExpression',
                operator: '+',
                left: { type: 'LiteralNumericExpression', value: 3 },
                right: { type: 'LiteralNumericExpression', value: 5 },
              },
            },
            params: { type: 'FormalParameters', items: [], rest: null },
            body: { type: 'FunctionBody', directives: [], statements: [] },
          },
        }],
      }
    );

    testParse('(class extends (a,b) {})', expr,
      {
        type: 'ClassExpression',
        name: null,
        super: {
          type: 'BinaryExpression',
          operator: ',',
          left: { type: 'IdentifierExpression', name: 'a' },
          right: { type: 'IdentifierExpression', name: 'b' },
        },
        elements: [],
      }
    );

    testParse('var x = class extends (a,b) {};', program => {
      return stmt(program).declaration.declarators[0].init;
    },
    {
      type: 'ClassExpression',
      name: null,
      super: {
        type: 'BinaryExpression',
        operator: ',',
        left: { type: 'IdentifierExpression', name: 'a' },
        right: { type: 'IdentifierExpression', name: 'b' },
      },
      elements: [],
    }
    );

    testParse('(class {static(){}})', expr, {
      type: 'ClassExpression',
      name: null,
      super: null,
      elements: [{
        type: 'ClassElement',
        isStatic: false,
        method: {
          type: 'Method',
          isGenerator: false,
          name: { type: 'StaticPropertyName', value: 'static' },
          params: { type: 'FormalParameters', items: [], rest: null },
          body: { type: 'FunctionBody', directives: [], statements: [] },
        },
      }],
    });

    testParse('(class {static constructor(){}})', expr, {
      type: 'ClassExpression',
      name: null,
      super: null,
      elements: [{
        type: 'ClassElement',
        isStatic: true,
        method: {
          type: 'Method',
          isGenerator: false,
          name: { type: 'StaticPropertyName', value: 'constructor' },
          params: { type: 'FormalParameters', items: [], rest: null },
          body: { type: 'FunctionBody', directives: [], statements: [] },
        },
      }],
    });

    testParseSuccess('({ a(){ (class {[super.a](){}}); } })');
    testParseSuccess('class A extends Object { constructor(){ (class {[super()](){}}); } }');
    testParseSuccess('class A extends Object { constructor(a = super()){} }');
    testParseSuccess('class A { b(c = super.d){} }');

    testParseFailure('(class {a:0})', 'Only methods are allowed in classes');
    testParseFailure('(class {a=0})', 'Only methods are allowed in classes');
    testParseFailure('(class {a})', 'Only methods are allowed in classes');
    testParseFailure('(class {3:0})', 'Only methods are allowed in classes');
    testParseFailure('(class {[3]:0})', 'Only methods are allowed in classes');
    testParseFailure('(class {)', 'Unexpected token ")"');
    testParseFailure('(class extends a,b {})', 'Unexpected token ","');
    testParseFailure('(class extends !a {})', 'Unexpected token "!"');
    testParseFailure('(class [a] {})', 'Unexpected token "["');
    testParseFailure('(class {[a,b](){}})', 'Unexpected token ","');
  });
});
