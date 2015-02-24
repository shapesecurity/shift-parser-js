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

import * as Shift from "shift-ast";

function markLocation(node, location) {
  node.loc = new Shift.SourceSpan(location, new Shift.SourceLocation(this.lastIndex, this.lastLine + 1, this.lastIndex - this.lastLineStart));
  return node;
}

export function parseModule(code, {loc = false} = {}) {
  let parser = new Parser(code);
  parser.module = true;
  if (loc) {
    parser.markLocation = markLocation;
  }
  return parser.parse();
}

export function parseScript(code, {loc = false} = {}) {
  let parser = new Parser(code);
  if (loc) {
    parser.markLocation = markLocation;
  }
  return parser.parse();
}

export default parseScript;
