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

let expr = require('./helpers').expr;
let stmt = require('./helpers').stmt;

let testParse = require('./assertions').testParse;
let testParseFailure = require('./assertions').testParseFailure;
let testParseModule = require('./assertions').testParseModule;

function directives(program) {
  return program.directives;
}

function id(x) {
  return x;
}

suite('Parser', () => {
  suite('directives', () => {
    testParse('"Hello"', directives, [{ type: 'Directive', rawValue: 'Hello' }]);
    testParse('"\\n\\r\\t\\v\\b\\f\\\\\\\'\\"\\0"', directives, [{
      type: 'Directive',
      rawValue: '\\n\\r\\t\\v\\b\\f\\\\\\\'\\"\\0',
    }]);
    testParse('"\\u0061"', directives, [{ type: 'Directive', rawValue: '\\u0061' }]);
    testParse('"\\x61"', directives, [{ type: 'Directive', rawValue: '\\x61' }]);
    testParse('"Hello\\nworld"', directives, [{ type: 'Directive', rawValue: 'Hello\\nworld' }]);
    testParse('"Hello\\\nworld"', directives, [{ type: 'Directive', rawValue: 'Hello\\\nworld' }]);
    testParse('"Hello\\02World"', directives, [{ type: 'Directive', rawValue: 'Hello\\02World' }]);
    testParse('"Hello\\012World"', directives, [{ type: 'Directive', rawValue: 'Hello\\012World' }]);
    testParse('"Hello\\122World"', directives, [{ type: 'Directive', rawValue: 'Hello\\122World' }]);
    testParse('"Hello\\0122World"', directives, [{ type: 'Directive', rawValue: 'Hello\\0122World' }]);
    testParse('"Hello\\312World"', directives, [{ type: 'Directive', rawValue: 'Hello\\312World' }]);
    testParse('"Hello\\412World"', directives, [{ type: 'Directive', rawValue: 'Hello\\412World' }]);
    testParse('"Hello\\712World"', directives, [{ type: 'Directive', rawValue: 'Hello\\712World' }]);
    testParse('"Hello\\0World"', directives, [{ type: 'Directive', rawValue: 'Hello\\0World' }]);
    testParse('"Hello\\\r\nworld"', directives, [{ type: 'Directive', rawValue: 'Hello\\\r\nworld' }]);
    testParse('"Hello\\1World"', directives, [{ type: 'Directive', rawValue: 'Hello\\1World' }]);

    testParse('(function () { \'use\\x20strict\'; with (i); })', expr,
      { type: 'FunctionExpression',
        isGenerator: false,
        name: null,
        params: { type: 'FormalParameters', items: [], rest: null },
        body: {
          type: 'FunctionBody',
          directives: [{ type: 'Directive', rawValue: 'use\\x20strict' }],
          statements: [{
            type: 'WithStatement',
            object: { type: 'IdentifierExpression', name: 'i' },
            body: { type: 'EmptyStatement' },
          }],
        },
      }
    );
    testParse('(function () { \'use\\nstrict\'; with (i); })', expr,
      { type: 'FunctionExpression',
        isGenerator: false,
        name: null,
        params: { type: 'FormalParameters', items: [], rest: null },
        body: {
          type: 'FunctionBody',
          directives: [{ type: 'Directive', rawValue: 'use\\nstrict' }],
          statements: [{
            type: 'WithStatement',
            object: { type: 'IdentifierExpression', name: 'i' },
            body: { type: 'EmptyStatement' },
          }],
        },
      }
    );

    testParse('function a() {\'use strict\';return 0;};', stmt,
      { type: 'FunctionDeclaration',
        isGenerator: false,
        name: { type: 'BindingIdentifier', name: 'a' },
        params: { type: 'FormalParameters', items: [], rest: null },
        body: {
          type: 'FunctionBody',
          directives: [{ type: 'Directive', rawValue: 'use strict' }],
          statements: [{ type: 'ReturnStatement', expression: { type: 'LiteralNumericExpression', value: 0 } }],
        },
      }
    );
    testParse('(function() {\'use strict\';return 0;});', expr,
      { type: 'FunctionExpression',
        isGenerator: false,
        name: null,
        params: { type: 'FormalParameters', items: [], rest: null },
        body: {
          type: 'FunctionBody',
          directives: [{ type: 'Directive', rawValue: 'use strict' }],
          statements: [{ type: 'ReturnStatement', expression: { type: 'LiteralNumericExpression', value: 0 } }],
        },
      }
    );
    testParse('(function a() {\'use strict\';return 0;});', expr,
      { type: 'FunctionExpression',
        isGenerator: false,
        name: { type: 'BindingIdentifier', name: 'a' },
        params: { type: 'FormalParameters', items: [], rest: null },
        body: {
          type: 'FunctionBody',
          directives: [{ type: 'Directive', rawValue: 'use strict' }],
          statements: [{ type: 'ReturnStatement', expression: { type: 'LiteralNumericExpression', value: 0 } }],
        },
      }
    );

    testParse('"use strict" + 0', expr,
      {
        type: 'BinaryExpression',
        operator: '+',
        left: { type: 'LiteralStringExpression', value: 'use strict' },
        right: { type: 'LiteralNumericExpression', value: 0 },
      }
    );


    testParseModule('"use strict";', id,
      { type: 'Module',
        directives: [{ type: 'Directive', rawValue: 'use strict' }],
        items: [],
      }
    );

    testParseFailure('"\\1"; "use strict";', 'Unexpected legacy octal escape sequence: \\1');
    testParseFailure('"\\1"; "use strict"; null;', 'Unexpected legacy octal escape sequence: \\1');
    testParseFailure('"use strict"; "\\1";', 'Unexpected legacy octal escape sequence: \\1');
    testParseFailure('"use strict"; "\\1"; null;', 'Unexpected legacy octal escape sequence: \\1');
    testParseFailure('"use strict"; function f(){"\\1";}', 'Unexpected legacy octal escape sequence: \\1');

  });
});
