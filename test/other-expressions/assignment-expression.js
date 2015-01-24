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

var expect = require("expect.js");

var parse = require("../..").default;
var Shift = require("shift-ast");

var expr = require("../helpers").expr;
var assertParseFailure = require('../assertions').assertParseFailure;

describe("Parser", function () {
  describe("assignment expression", function () {
    expect(expr(parse("a=0;"))).to.be.eql(
      new Shift.AssignmentExpression(
        "=",
        new Shift.BindingIdentifier(new Shift.Identifier("a")),
        new Shift.LiteralNumericExpression(0)
      )
    );
    expect(expr(parse("x = 0"))).to.be.eql(
      new Shift.AssignmentExpression(
        "=",
        new Shift.BindingIdentifier(new Shift.Identifier("x")),
        new Shift.LiteralNumericExpression(0)
      )
    );
    expect(expr(parse("eval = 0"))).to.be.eql(
      new Shift.AssignmentExpression(
        "=",
        new Shift.BindingIdentifier(new Shift.Identifier("eval")),
        new Shift.LiteralNumericExpression(0)
      )
    );
    expect(expr(parse("arguments = 0"))).to.be.eql(
      new Shift.AssignmentExpression(
        "=",
        new Shift.BindingIdentifier(new Shift.Identifier("arguments")),
        new Shift.LiteralNumericExpression(0)
      )
    );
    expect(expr(parse("x *= 0"))).to.be.eql(
      new Shift.AssignmentExpression(
        "*=",
        new Shift.BindingIdentifier(new Shift.Identifier("x")),
        new Shift.LiteralNumericExpression(0)
      )
    );
    expect(expr(parse("x /= 0"))).to.be.eql(
      new Shift.AssignmentExpression(
        "/=",
        new Shift.BindingIdentifier(new Shift.Identifier("x")),
        new Shift.LiteralNumericExpression(0)
      )
    );
    expect(expr(parse("x %= 0"))).to.be.eql(
      new Shift.AssignmentExpression(
        "%=",
        new Shift.BindingIdentifier(new Shift.Identifier("x")),
        new Shift.LiteralNumericExpression(0)
      )
    );
    expect(expr(parse("x += 0"))).to.be.eql(
      new Shift.AssignmentExpression(
        "+=",
        new Shift.BindingIdentifier(new Shift.Identifier("x")),
        new Shift.LiteralNumericExpression(0)
      )
    );
    expect(expr(parse("x -= 0"))).to.be.eql(
      new Shift.AssignmentExpression(
        "-=",
        new Shift.BindingIdentifier(new Shift.Identifier("x")),
        new Shift.LiteralNumericExpression(0)
      )
    );
    expect(expr(parse("x <<= 0"))).to.be.eql(
      new Shift.AssignmentExpression(
        "<<=",
        new Shift.BindingIdentifier(new Shift.Identifier("x")),
        new Shift.LiteralNumericExpression(0)
      )
    );
    expect(expr(parse("x >>= 0"))).to.be.eql(
      new Shift.AssignmentExpression(
        ">>=",
        new Shift.BindingIdentifier(new Shift.Identifier("x")),
        new Shift.LiteralNumericExpression(0)
      )
    );
    expect(expr(parse("x >>>= 0"))).to.be.eql(
      new Shift.AssignmentExpression(
        ">>>=",
        new Shift.BindingIdentifier(new Shift.Identifier("x")),
        new Shift.LiteralNumericExpression(0)
      )
    );
    expect(expr(parse("x &= 0"))).to.be.eql(
      new Shift.AssignmentExpression(
        "&=",
        new Shift.BindingIdentifier(new Shift.Identifier("x")),
        new Shift.LiteralNumericExpression(0)
      )
    );
    expect(expr(parse("x ^= 0"))).to.be.eql(
      new Shift.AssignmentExpression(
        "^=",
        new Shift.BindingIdentifier(new Shift.Identifier("x")),
        new Shift.LiteralNumericExpression(0)
      )
    );
    expect(expr(parse("x |= 0"))).to.be.eql(
      new Shift.AssignmentExpression(
        "|=",
        new Shift.BindingIdentifier(new Shift.Identifier("x")),
        new Shift.LiteralNumericExpression(0)
      )
    );


    expect(expr(parse("[x] = 0"))).to.be.eql(
      new Shift.AssignmentExpression(
        "=",
        new Shift.ArrayBinding(
          [new Shift.BindingIdentifier(new Shift.Identifier("x"))],
          null
        ),
        new Shift.LiteralNumericExpression(0)
      )
    );
    expect(expr(parse("[[x]] = 0"))).to.be.eql(
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
    expect(expr(parse("[x, y, ...z] = 0"))).to.be.eql(
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
    expect(expr(parse("[, x, ...y,] = 0"))).to.be.eql(
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
    expect(expr(parse("[, x,,] = 0"))).to.be.eql(
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
    assertParseFailure("[] = 0", "Invalid left-hand side in assignment")
    assertParseFailure("[x, x] = 0", "Duplicate binding 'x' in assignment")
    assertParseFailure("[x, ...x] = 0", "Duplicate binding 'x' in assignment")
    assertParseFailure("[...x, ...y] = 0", "Invalid left-hand side in assignment")
    assertParseFailure("[...x, y] = 0", "Invalid left-hand side in assignment")
    assertParseFailure("[...x,,] = 0", "Invalid left-hand side in assignment")
    assertParseFailure("[...[x]] = 0", "Invalid left-hand side in assignment")

    expect(expr(parse("({x} = 0)"))).to.be.eql(
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
    expect(expr(parse("({x = 0} = 1)"))).to.be.eql(
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
    expect(expr(parse("({x: y} = 0)"))).to.be.eql(
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
    expect(expr(parse("({var: x} = 0)"))).to.be.eql(
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
    expect(expr(parse("({x: y = 0} = 1)"))).to.be.eql(
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
    expect(expr(parse("({x: y = z = 0} = 1)"))).to.be.eql(
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
    expect(expr(parse("({x: [y] = 0} = 1)"))).to.be.eql(
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
    assertParseFailure("({var} = 0)", "Unexpected token }")

    assertParseFailure("'use strict'; [eval] = 0", "Assignment to eval or arguments is not allowed in strict mode")
    assertParseFailure("'use strict'; [,,,eval,] = 0", "Assignment to eval or arguments is not allowed in strict mode")
    assertParseFailure("'use strict'; ({eval} = 0)", "Assignment to eval or arguments is not allowed in strict mode")
    assertParseFailure("'use strict'; ({eval = 0} = 0)", "Assignment to eval or arguments is not allowed in strict mode")
    assertParseFailure("'use strict'; ({a: eval} = 0)", "Assignment to eval or arguments is not allowed in strict mode")
    assertParseFailure("'use strict'; ({a: eval = 0} = 0)", "Assignment to eval or arguments is not allowed in strict mode")


    expect(expr(parse("'use strict'; eval[0] = 0"))).to.be.eql(
      new Shift.AssignmentExpression(
        "=",
        new Shift.ComputedMemberExpression(
          new Shift.IdentifierExpression(new Shift.Identifier("eval")),
          new Shift.LiteralNumericExpression(0)
        ),
        new Shift.LiteralNumericExpression(0)
      )
    );
    expect(expr(parse("'use strict'; arguments[0] = 0"))).to.be.eql(
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
