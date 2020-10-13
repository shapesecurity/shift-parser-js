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


let testParse = require('../assertions').testParse;
let testParseFailure = require('../assertions').testParseFailure;
let expr = require('../helpers').expr;
let errorMessages = require('../../src/errors').ErrorMessages;

suite('Parser', () => {
  suite('untagged template expressions', () => {


    testParseFailure('`', 'Unexpected end of input');
    testParseFailure('a++``', 'Unexpected template');
    testParseFailure('`${a', 'Unexpected end of input');
    testParseFailure('`${a}a${b}', 'Unexpected end of input');

    testParseFailure('`\\1`', errorMessages.NO_OCTALS_IN_TEMPLATES);
    testParseFailure('`\\4`', errorMessages.NO_OCTALS_IN_TEMPLATES);
    testParseFailure('`\\11`', errorMessages.NO_OCTALS_IN_TEMPLATES);
    testParseFailure('`\\41`', errorMessages.NO_OCTALS_IN_TEMPLATES);
    testParseFailure('`\\01`', errorMessages.NO_OCTALS_IN_TEMPLATES);
    testParseFailure('`\\00`', errorMessages.NO_OCTALS_IN_TEMPLATES);
    testParseFailure('`\\001`', errorMessages.NO_OCTALS_IN_TEMPLATES);
    testParseFailure('`\\000`', errorMessages.NO_OCTALS_IN_TEMPLATES);
    testParseFailure('`\\123`', errorMessages.NO_OCTALS_IN_TEMPLATES);
    testParseFailure('`\\08`', errorMessages.NO_OCTALS_IN_TEMPLATES);
    testParseFailure('`\\09`', errorMessages.NO_OCTALS_IN_TEMPLATES);
  });

  suite('tagged template expressions', () => {


  });
});
