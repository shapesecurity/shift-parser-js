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

import {Parser} from "./parser";
import {JsError} from "./tokenizer";
import {EarlyErrorChecker} from "./early-errors";

function markLocation(node, location) {
  node.loc = {
    start: location,
    end: {
      line: this.lastLine + 1,
      column: this.lastIndex - this.lastLineStart,
      offset: this.lastIndex,
    },
    source: null
  };
  return node;
}

function generateInterface(parsingFunctionName) {
  return function parse(code, {loc = false, earlyErrors = true} = {}) {
    let parser = new Parser(code);
    if (loc) {
      parser.markLocation = markLocation;
    }
    let ast = parser[parsingFunctionName]();
    if (earlyErrors) {
      let errors = EarlyErrorChecker.check(ast);
      // for now, just throw the first error; we will handle multiple errors later
      if (errors.length > 0) {
        let {node, message} = errors[0];
        let offset = 0, line = 1, column = 0;
        if (node.loc != null) {
          ({offset, line, column} = node.loc.start);
        }
        throw new JsError(offset, line, column, message);
      }
    }
    return ast;
  }
}

export const parseModule = generateInterface("parseModule");
export const parseScript = generateInterface("parseScript");
export default parseScript;
