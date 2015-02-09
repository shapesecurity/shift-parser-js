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

var expr = require("../helpers").expr;
var testEsprimaEquiv = require('../assertions').testEsprimaEquiv;
var testParse = require('../assertions').testParse;
var testParseFailure = require('../assertions').testParseFailure;

suite("Parser", function () {
  suite("assignment expression", function () {
    testParse("a=0;", expr,
      new Shift.AssignmentExpression(
        "=",
        new Shift.BindingIdentifier(new Shift.Identifier("a")),
        new Shift.LiteralNumericExpression(0)
      )
    );
    testParse("(a)=(0);", expr,
      new Shift.AssignmentExpression(
        "=",
        new Shift.BindingIdentifier(new Shift.Identifier("a")),
        new Shift.LiteralNumericExpression(0)
      )
    );
    testParse("x = 0", expr,
      new Shift.AssignmentExpression(
        "=",
        new Shift.BindingIdentifier(new Shift.Identifier("x")),
        new Shift.LiteralNumericExpression(0)
      )
    );
    testParse("eval = 0", expr,
      new Shift.AssignmentExpression(
        "=",
        new Shift.BindingIdentifier(new Shift.Identifier("eval")),
        new Shift.LiteralNumericExpression(0)
      )
    );
    testParse("arguments = 0", expr,
      new Shift.AssignmentExpression(
        "=",
        new Shift.BindingIdentifier(new Shift.Identifier("arguments")),
        new Shift.LiteralNumericExpression(0)
      )
    );
    testParse("x *= 0", expr,
      new Shift.AssignmentExpression(
        "*=",
        new Shift.BindingIdentifier(new Shift.Identifier("x")),
        new Shift.LiteralNumericExpression(0)
      )
    );
    testParse("x /= 0", expr,
      new Shift.AssignmentExpression(
        "/=",
        new Shift.BindingIdentifier(new Shift.Identifier("x")),
        new Shift.LiteralNumericExpression(0)
      )
    );
    testParse("x %= 0", expr,
      new Shift.AssignmentExpression(
        "%=",
        new Shift.BindingIdentifier(new Shift.Identifier("x")),
        new Shift.LiteralNumericExpression(0)
      )
    );
    testParse("x += 0", expr,
      new Shift.AssignmentExpression(
        "+=",
        new Shift.BindingIdentifier(new Shift.Identifier("x")),
        new Shift.LiteralNumericExpression(0)
      )
    );
    testParse("x -= 0", expr,
      new Shift.AssignmentExpression(
        "-=",
        new Shift.BindingIdentifier(new Shift.Identifier("x")),
        new Shift.LiteralNumericExpression(0)
      )
    );
    testParse("x <<= 0", expr,
      new Shift.AssignmentExpression(
        "<<=",
        new Shift.BindingIdentifier(new Shift.Identifier("x")),
        new Shift.LiteralNumericExpression(0)
      )
    );
    testParse("x >>= 0", expr,
      new Shift.AssignmentExpression(
        ">>=",
        new Shift.BindingIdentifier(new Shift.Identifier("x")),
        new Shift.LiteralNumericExpression(0)
      )
    );
    testParse("x >>>= 0", expr,
      new Shift.AssignmentExpression(
        ">>>=",
        new Shift.BindingIdentifier(new Shift.Identifier("x")),
        new Shift.LiteralNumericExpression(0)
      )
    );
    testParse("x &= 0", expr,
      new Shift.AssignmentExpression(
        "&=",
        new Shift.BindingIdentifier(new Shift.Identifier("x")),
        new Shift.LiteralNumericExpression(0)
      )
    );
    testParse("x ^= 0", expr,
      new Shift.AssignmentExpression(
        "^=",
        new Shift.BindingIdentifier(new Shift.Identifier("x")),
        new Shift.LiteralNumericExpression(0)
      )
    );
    testParse("x |= 0", expr,
      new Shift.AssignmentExpression(
        "|=",
        new Shift.BindingIdentifier(new Shift.Identifier("x")),
        new Shift.LiteralNumericExpression(0)
      )
    );

    testParse("[x] = 0", expr,
      new Shift.AssignmentExpression(
        "=",
        new Shift.ArrayBinding(
          [new Shift.BindingIdentifier(new Shift.Identifier("x"))],
          null
        ),
        new Shift.LiteralNumericExpression(0)
      )
    );
    testParse("[[x]] = 0", expr,
      new Shift.AssignmentExpression(
        "=",
        new Shift.ArrayBinding(
          [
            new Shift.ArrayBinding(
              [new Shift.BindingIdentifier(new Shift.Identifier("x"))],
              null
            ),
          ],
          null
        ),
        new Shift.LiteralNumericExpression(0)
      )
    );
    testParse("[x, y, ...z] = 0", expr,
      new Shift.AssignmentExpression(
        "=",
        new Shift.ArrayBinding(
          [
            new Shift.BindingIdentifier(new Shift.Identifier("x")),
            new Shift.BindingIdentifier(new Shift.Identifier("y")),
          ],
          new Shift.BindingIdentifier(new Shift.Identifier("z"))
        ),
        new Shift.LiteralNumericExpression(0)
      )
    );
    testParse("[, x, ...y,] = 0", expr,
      new Shift.AssignmentExpression(
        "=",
        new Shift.ArrayBinding(
          [
            null,
            new Shift.BindingIdentifier(new Shift.Identifier("x")),
          ],
          new Shift.BindingIdentifier(new Shift.Identifier("y"))
        ),
        new Shift.LiteralNumericExpression(0)
      )
    );
    testParse("[, x,,] = 0", expr,
      new Shift.AssignmentExpression(
        "=",
        new Shift.ArrayBinding(
          [
            null,
            new Shift.BindingIdentifier(new Shift.Identifier("x")),
            null,
          ],
          null
        ),
        new Shift.LiteralNumericExpression(0)
      )
    );
    testParseFailure("[] = 0", "Invalid left-hand side in assignment");
    testParseFailure("[x, x] = 0", "Duplicate binding 'x'");
    testParseFailure("[x, ...x] = 0", "Duplicate binding 'x'");
    testParseFailure("[...x, ...y] = 0", "Invalid left-hand side in assignment");
    testParseFailure("[...x, y] = 0", "Invalid left-hand side in assignment");
    testParseFailure("[...x,,] = 0", "Invalid left-hand side in assignment");
    testParseFailure("[...[x]] = 0", "Invalid left-hand side in assignment");

    testParse("({x} = 0)", expr,
      new Shift.AssignmentExpression(
        "=",
        new Shift.ObjectBinding([
          new Shift.BindingPropertyIdentifier(
            new Shift.BindingIdentifier(new Shift.Identifier("x")),
            null
          ),
        ]),
        new Shift.LiteralNumericExpression(0)
      )
    );
    testParse("({x = 0} = 1)", expr,
      new Shift.AssignmentExpression(
        "=",
        new Shift.ObjectBinding([
          new Shift.BindingPropertyIdentifier(
            new Shift.BindingIdentifier(new Shift.Identifier("x")),
            new Shift.LiteralNumericExpression(0)
          ),
        ]),
        new Shift.LiteralNumericExpression(1)
      )
    );
    testParse("({x: y} = 0)", expr,
      new Shift.AssignmentExpression(
        "=",
        new Shift.ObjectBinding([
          new Shift.BindingPropertyProperty(
            new Shift.StaticPropertyName("x"),
            new Shift.BindingIdentifier(new Shift.Identifier("y"))
          ),
        ]),
        new Shift.LiteralNumericExpression(0)
      )
    );
    testParse("({var: x} = 0)", expr,
      new Shift.AssignmentExpression(
        "=",
        new Shift.ObjectBinding([
          new Shift.BindingPropertyProperty(
            new Shift.StaticPropertyName("var"),
            new Shift.BindingIdentifier(new Shift.Identifier("x"))
          ),
        ]),
        new Shift.LiteralNumericExpression(0)
      )
    );
    testParse("({x: y = 0} = 1)", expr,
      new Shift.AssignmentExpression(
        "=",
        new Shift.ObjectBinding([
          new Shift.BindingPropertyProperty(
            new Shift.StaticPropertyName("x"),
            new Shift.BindingWithDefault(
              new Shift.BindingIdentifier(new Shift.Identifier("y")),
              new Shift.LiteralNumericExpression(0)
            )
          ),
        ]),
        new Shift.LiteralNumericExpression(1)
      )
    );
    testParse("({x: y = z = 0} = 1)", expr,
      new Shift.AssignmentExpression(
        "=",
        new Shift.ObjectBinding([
          new Shift.BindingPropertyProperty(
            new Shift.StaticPropertyName("x"),
            new Shift.BindingWithDefault(
              new Shift.BindingIdentifier(new Shift.Identifier("y")),
              new Shift.AssignmentExpression(
                "=",
                new Shift.BindingIdentifier(new Shift.Identifier("z")),
                new Shift.LiteralNumericExpression(0)
              )
            )
          ),
        ]),
        new Shift.LiteralNumericExpression(1)
      )
    );
    testParse("({x: [y] = 0} = 1)", expr,
      new Shift.AssignmentExpression(
        "=",
        new Shift.ObjectBinding([
          new Shift.BindingPropertyProperty(
            new Shift.StaticPropertyName("x"),
            new Shift.BindingWithDefault(
              new Shift.ArrayBinding(
                [new Shift.BindingIdentifier(new Shift.Identifier("y"))],
                null
              ),
              new Shift.LiteralNumericExpression(0)
            )
          ),
        ]),
        new Shift.LiteralNumericExpression(1)
      )
    );
    testParseFailure("({var} = 0)", "Unexpected token }")

    testParseFailure("'use strict'; [eval] = 0", "Assignment to eval or arguments is not allowed in strict mode");
    testParseFailure("'use strict'; [,,,eval,] = 0", "Assignment to eval or arguments is not allowed in strict mode");
    testParseFailure("'use strict'; ({eval} = 0)", "Assignment to eval or arguments is not allowed in strict mode");
    testParseFailure("'use strict'; ({eval = 0} = 0)", "Assignment to eval or arguments is not allowed in strict mode");
    testParseFailure("'use strict'; ({a: eval} = 0)", "Assignment to eval or arguments is not allowed in strict mode");
    testParseFailure("'use strict'; ({a: eval = 0} = 0)", "Assignment to eval or arguments is not allowed in strict mode");

    testParse("'use strict'; eval[0] = 0", expr,
      new Shift.AssignmentExpression(
        "=",
        new Shift.ComputedMemberExpression(
          new Shift.IdentifierExpression(new Shift.Identifier("eval")),
          new Shift.LiteralNumericExpression(0)
        ),
        new Shift.LiteralNumericExpression(0)
      )
    );
    testParse("'use strict'; arguments[0] = 0", expr,
      new Shift.AssignmentExpression(
        "=",
        new Shift.ComputedMemberExpression(
          new Shift.IdentifierExpression(new Shift.Identifier("arguments")),
          new Shift.LiteralNumericExpression(0)
        ),
        new Shift.LiteralNumericExpression(0)
      )
    );
  });
});
