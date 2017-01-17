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

let expr = require('../helpers').expr;
let stmt = require('../helpers').stmt;

let testParseFailure = require('../assertions').testParseFailure;
let testParse = require('../assertions').testParse;

suite('Parser', function () {
  suite('super call', function () {

    testParse('(class extends B { constructor() { super() } });', expr,
      {
        type: 'ClassExpression',
        name: null,
        super: { type: 'IdentifierExpression', name: 'B' },
        elements: [{
          type: 'ClassElement',
          isStatic: false,
          method: {
            type: 'Method',
            isGenerator: false,
            name: { type: 'StaticPropertyName', value: 'constructor' },
            params: { type: 'FormalParameters', items: [], rest: null },
            body: {
              type: 'FunctionBody',
              directives: [],
              statements: [{
                type: 'ExpressionStatement',
                expression: { type: 'CallExpression', callee: { type: 'Super' }, arguments: [] }
              }]
            }
          }
        }]
      }
    );

    testParse('class A extends B { constructor() { super() } }', stmt,
      {
        type: 'ClassDeclaration',
        name: { type: 'BindingIdentifier', name: 'A' },
        super: { type: 'IdentifierExpression', name: 'B' },
        elements: [{
          type: 'ClassElement',
          isStatic: false,
          method: {
            type: 'Method',
            isGenerator: false,
            name: { type: 'StaticPropertyName', value: 'constructor' },
            params: { type: 'FormalParameters', items: [], rest: null },
            body: {
              type: 'FunctionBody',
              directives: [],
              statements: [{
                type: 'ExpressionStatement',
                expression: { type: 'CallExpression', callee: { type: 'Super' }, arguments: [] }
              }]
            }
          }
        }]
      }
    );

    testParse('class A extends B { "constructor"() { super() } }', stmt,
      {
        type: 'ClassDeclaration',
        name: { type: 'BindingIdentifier', name: 'A' },
        super: { type: 'IdentifierExpression', name: 'B' },
        elements: [{
          type: 'ClassElement',
          isStatic: false,
          method: {
            type: 'Method',
            isGenerator: false,
            name: { type: 'StaticPropertyName', value: 'constructor' },
            params: { type: 'FormalParameters', items: [], rest: null },
            body: {
              type: 'FunctionBody',
              directives: [],
              statements: [{
                type: 'ExpressionStatement',
                expression: { type: 'CallExpression', callee: { type: 'Super' }, arguments: [] }
              }]
            }
          }
        }]
      }
    );

    testParse('class A extends B { constructor(a = super()){} }', stmt,
      {
        type: 'ClassDeclaration',
        name: { type: 'BindingIdentifier', name: 'A' },
        super: { type: 'IdentifierExpression', name: 'B' },
        elements: [{
          type: 'ClassElement',
          isStatic: false,
          method: {
            type: 'Method',
            isGenerator: false,
            name: { type: 'StaticPropertyName', value: 'constructor' },
            params: {
              type: 'FormalParameters',
              items: [{
                type: 'BindingWithDefault',
                binding: { type: 'BindingIdentifier', name: 'a' },
                init: { type: 'CallExpression', callee: { type: 'Super' }, arguments: [] }
              }],
              rest: null
            },
            body: {
              type: 'FunctionBody',
              directives: [],
              statements: []
            }
          }
        }]
      }
    );


    testParse('class A extends B { constructor() { ({a: super()}); } }', stmt,
      {
        type: 'ClassDeclaration',
        name: { type: 'BindingIdentifier', name: 'A' },
        super: { type: 'IdentifierExpression', name: 'B' },
        elements: [{
          type: 'ClassElement',
          isStatic: false,
          method: {
            type: 'Method',
            isGenerator: false,
            name: { type: 'StaticPropertyName', value: 'constructor' },
            params: { type: 'FormalParameters', items: [], rest: null },
            body: {
              type: 'FunctionBody',
              directives: [],
              statements: [{
                type: 'ExpressionStatement',
                expression: {
                  type: 'ObjectExpression',
                  properties: [{
                    type: 'DataProperty',
                    name: { type: 'StaticPropertyName', value: 'a' },
                    expression: { type: 'CallExpression', callee: { type: 'Super' }, arguments: [] }
                  }]
                }
              }]
            }
          }
        }]
      }
    );

    testParse('class A extends B { constructor() { () => super(); } }', stmt,
      {
        type: 'ClassDeclaration',
        name: { type: 'BindingIdentifier', name: 'A' },
        super: { type: 'IdentifierExpression', name: 'B' },
        elements: [{
          type: 'ClassElement',
          isStatic: false,
          method: {
            type: 'Method',
            isGenerator: false,
            name: { type: 'StaticPropertyName', value: 'constructor' },
            params: { type: 'FormalParameters', items: [], rest: null },
            body: {
              type: 'FunctionBody',
              directives: [],
              statements: [{
                type: 'ExpressionStatement',
                expression: {
                  type: 'ArrowExpression',
                  params: { type: 'FormalParameters', items: [], rest: null },
                  body: { type: 'CallExpression', callee: { type: 'Super' }, arguments: [] }
                }
              }]
            }
          }
        }]
      }
    );

    testParse('class A extends B { constructor() { () => { super(); } } }', stmt,
      {
        type: 'ClassDeclaration',
        name: { type: 'BindingIdentifier', name: 'A' },
        super: { type: 'IdentifierExpression', name: 'B' },
        elements: [{
          type: 'ClassElement',
          isStatic: false,
          method: {
            type: 'Method',
            isGenerator: false,
            name: { type: 'StaticPropertyName', value: 'constructor' },
            params: { type: 'FormalParameters', items: [], rest: null },
            body: {
              type: 'FunctionBody',
              directives: [],
              statements: [{
                type: 'ExpressionStatement',
                expression: {
                  type: 'ArrowExpression',
                  params: { type: 'FormalParameters', items: [], rest: null },
                  body: {
                    type: 'FunctionBody',
                    directives: [],
                    statements: [{
                      type: 'ExpressionStatement',
                      expression: { type: 'CallExpression', callee: { type: 'Super' }, arguments: [] }
                    }]
                  }
                }
              }]
            }
          }
        }]
      }
    );

    testParseFailure('function f() { (super)() }', 'Unexpected token "super"');
    testParseFailure('class A extends B { constructor() { super; } }', 'Unexpected token "super"');
    testParseFailure('class A extends B { constructor() { (super)(); } }', 'Unexpected token "super"');
    testParseFailure('class A extends B { constructor() { new super(); } }', 'Unexpected token "super"');

  });

  suite('super member access', function () {

    testParse('({ a() { super.b(); } });', expr,
      {
        type: 'ObjectExpression',
        properties: [{
          type: 'Method',
          isGenerator: false,
          name: { type: 'StaticPropertyName', value: 'a' },
          params: { type: 'FormalParameters', items: [], rest: null },
          body: {
            type: 'FunctionBody',
            directives: [],
            statements: [{
              type: 'ExpressionStatement',
              expression: {
                type: 'CallExpression',
                callee: { type: 'StaticMemberExpression', object: { type: 'Super' }, property: 'b' },
                arguments: []
              }
            }]
          }
        }]
      }
    );

    testParse('({ *a() { super.b = 0; } });', expr,
      {
        type: 'ObjectExpression',
        properties: [{
          type: 'Method',
          isGenerator: true,
          name: { type: 'StaticPropertyName', value: 'a' },
          params: { type: 'FormalParameters', items: [], rest: null },
          body: {
            type: 'FunctionBody',
            directives: [],
            statements: [{
              type: 'ExpressionStatement',
              expression: {
                type: 'AssignmentExpression',
                binding: { type: 'StaticMemberAssignmentTarget', object: { type: 'Super' }, property: 'b' },
                expression: { type: 'LiteralNumericExpression', value: 0 }
              }
            }]
          }
        }]
      }
    );

    testParse('({ get a() { super[0] = 1; } });', expr,
      {
        type: 'ObjectExpression',
        properties: [{
          type: 'Getter',
          name: { type: 'StaticPropertyName', value: 'a' },
          body: {
            type: 'FunctionBody',
            directives: [],
            statements: [{
              type: 'ExpressionStatement',
              expression: {
                type: 'AssignmentExpression',
                binding: {
                  type: 'ComputedMemberAssignmentTarget',
                  object: { type: 'Super' },
                  expression: { type: 'LiteralNumericExpression', value: 0 }
                },
                expression: { type: 'LiteralNumericExpression', value: 1 }
              }
            }]
          }
        }]
      }
    );

    testParse('({ set a(x) { super.b[0] = 1; } });', expr,
      {
        type: 'ObjectExpression',
        properties: [{
          type: 'Setter',
          name: { type: 'StaticPropertyName', value: 'a' },
          param: { type: 'BindingIdentifier', name: 'x' },
          body: {
            type: 'FunctionBody',
            directives: [],
            statements: [{
              type: 'ExpressionStatement',
              expression: {
                type: 'AssignmentExpression',
                binding: {
                  type: 'ComputedMemberAssignmentTarget',
                  object: { type: 'StaticMemberExpression', object: { type: 'Super' }, property: 'b' },
                  expression: { type: 'LiteralNumericExpression', value: 0 }
                },
                expression: { type: 'LiteralNumericExpression', value: 1 }
              }
            }]
          }
        }]
      }
    );

    testParse('(class { constructor() { super.x } });', expr,
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
            name: { type: 'StaticPropertyName', value: 'constructor' },
            params: { type: 'FormalParameters', items: [], rest: null },
            body: {
              type: 'FunctionBody',
              directives: [],
              statements: [{
                type: 'ExpressionStatement',
                expression: { type: 'StaticMemberExpression', object: { type: 'Super' }, property: 'x' }
              }]
            }
          }
        }]
      }
    );

    testParse('class A extends B { constructor() { super.x } }', stmt,
      {
        type: 'ClassDeclaration',
        name: { type: 'BindingIdentifier', name: 'A' },
        super: { type: 'IdentifierExpression', name: 'B' },
        elements: [{
          type: 'ClassElement',
          isStatic: false,
          method: {
            type: 'Method',
            isGenerator: false,
            name: { type: 'StaticPropertyName', value: 'constructor' },
            params: { type: 'FormalParameters', items: [], rest: null },
            body: {
              type: 'FunctionBody',
              directives: [],
              statements: [{
                type: 'ExpressionStatement',
                expression: { type: 'StaticMemberExpression', object: { type: 'Super' }, property: 'x' }
              }]
            }
          }
        }]
      }
    );

    testParse('class A { a() { () => super.b; } }', stmt,
      {
        type: 'ClassDeclaration',
        name: { type: 'BindingIdentifier', name: 'A' },
        super: null,
        elements: [{
          type: 'ClassElement',
          isStatic: false,
          method: {
            type: 'Method',
            isGenerator: false,
            name: { type: 'StaticPropertyName', value: 'a' },
            params: { type: 'FormalParameters', items: [], rest: null },
            body: {
              type: 'FunctionBody',
              directives: [],
              statements: [{
                type: 'ExpressionStatement',
                expression: {
                  type: 'ArrowExpression',
                  params: { type: 'FormalParameters', items: [], rest: null },
                  body: { type: 'StaticMemberExpression', object: { type: 'Super' }, property: 'b' }
                }
              }]
            }
          }
        }]
      }
    );

    testParse('class A { a() { new super.b; } }', stmt,
      {
        type: 'ClassDeclaration',
        name: { type: 'BindingIdentifier', name: 'A' },
        super: null,
        elements: [{
          type: 'ClassElement',
          isStatic: false,
          method: {
            type: 'Method',
            isGenerator: false,
            name: { type: 'StaticPropertyName', value: 'a' },
            params: { type: 'FormalParameters', items: [], rest: null },
            body: {
              type: 'FunctionBody',
              directives: [],
              statements: [{
                type: 'ExpressionStatement',
                expression: {
                  type: 'NewExpression',
                  callee: { type: 'StaticMemberExpression', object: { type: 'Super' }, property: 'b' },
                  arguments: []
                }
              }]
            }
          }
        }]
      }
    );

    testParse('class A { a() { new super.b(); } }', stmt,
      {
        type: 'ClassDeclaration',
        name: { type: 'BindingIdentifier', name: 'A' },
        super: null,
        elements: [{
          type: 'ClassElement',
          isStatic: false,
          method: {
            type: 'Method',
            isGenerator: false,
            name: { type: 'StaticPropertyName', value: 'a' },
            params: { type: 'FormalParameters', items: [], rest: null },
            body: {
              type: 'FunctionBody',
              directives: [],
              statements: [{
                type: 'ExpressionStatement',
                expression: {
                  type: 'NewExpression',
                  callee: { type: 'StaticMemberExpression', object: { type: 'Super' }, property: 'b' },
                  arguments: []
                }
              }]
            }
          }
        }]
      }
    );

    testParse('({ *f() { yield super.f(); } })', expr,
      {
        type: 'ObjectExpression',
        properties: [{
          type: 'Method',
          isGenerator: true,
          name: { type: 'StaticPropertyName', value: 'f' },
          params: { type: 'FormalParameters', items: [], rest: null },
          body: {
            type: 'FunctionBody',
            directives: [],
            statements: [{
              type: 'ExpressionStatement',
              expression: {
                type: 'YieldExpression',
                expression: {
                  type: 'CallExpression',
                  callee: { type: 'StaticMemberExpression', object: { type: 'Super' }, property: 'f' },
                  arguments: [],
                }
              }
            }]
          }
        }],
      });

    testParseFailure('({ a() { (super).b(); } });', 'Unexpected token "super"');
    testParseFailure('class A extends B { constructor() { (super).a(); } }', 'Unexpected token "super"');

  });
});
