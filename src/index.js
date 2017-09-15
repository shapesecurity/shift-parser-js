/**
 * Copyright 2016 Shape Security, Inc.
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

import { GenericParser } from './parser';
import { JsError } from './tokenizer';
import { EarlyErrorChecker } from './early-errors';
import { isLineTerminator } from './utils';

class ParserWithLocation extends GenericParser {
  constructor(source) {
    super(source);
    this.locations = new WeakMap;
    this.comments = [];
  }

  startNode() {
    return this.getLocation();
  }

  finishNode(node, start) {
    this.locations.set(node, {
      start,
      end: this.getLocation()
    });
    return node;
  }

  copyNode(src, dest) {
    this.locations.set(dest, this.locations.get(src)); // todo check undefined
    return dest;
  }

  skipSingleLineComment(offset) {
    // We're actually extending the *tokenizer*, here.
    const start = {
      line: this.line + 1,
      column: this.index - this.lineStart,
      offset: this.index,
    };
    const c = this.source[this.index];
    const type = c === '/' ? 'SingleLine' : c === '<' ? 'HTMLOpen' : 'HTMLClose';

    super.skipSingleLineComment(offset);

    const end = {
      line: this.line + 1,
      column: this.index - this.lineStart,
      offset: this.index,
    };
    const trailingLineTerminatorCharacters = this.source[this.index - 2] === '\r' ? 2 : isLineTerminator(this.source.charCodeAt(this.index - 1)) ? 1 : 0;
    const text = this.source.substring(start.offset + offset, end.offset - trailingLineTerminatorCharacters);

    this.comments.push({ text, type, start, end });
  }

  skipMultiLineComment() {
    const start = {
      line: this.line + 1,
      column: this.index - this.lineStart,
      offset: this.index,
    };
    const type = 'MultiLine';

    super.skipMultiLineComment();

    const end = {
      line: this.line + 1,
      column: this.index - this.lineStart,
      offset: this.index,
    };
    const text = this.source.substring(start.offset + 2, end.offset - 2);

    this.comments.push({ text, type, start, end });
  }
}

function generateInterface(parsingFunctionName) {
  return function parse(code, { earlyErrors = true } = {}) {
    let parser = new GenericParser(code);
    let tree = parser[parsingFunctionName]();
    if (earlyErrors) {
      let errors = EarlyErrorChecker.check(tree);
      // for now, just throw the first error; we will handle multiple errors later
      if (errors.length > 0) {
        let { node, message } = errors[0];
        throw new JsError(0, 1, 0, message);
      }
    }
    return tree;
  };
}

function generateInterfaceWithLocation(parsingFunctionName) {
  return function parse(code, { earlyErrors = true } = {}) {
    let parser = new ParserWithLocation(code);
    let tree = parser[parsingFunctionName]();
    if (earlyErrors) {
      let errors = EarlyErrorChecker.check(tree);
      // for now, just throw the first error; we will handle multiple errors later
      if (errors.length > 0) {
        let { node, message } = errors[0];
        let { offset, line, column } = parser.locations.get(node).start;
        throw new JsError(offset, line, column, message);
      }
    }
    return { tree, locations: parser.locations, comments: parser.comments };
  };
}

export const parseModule = generateInterface('parseModule');
export const parseScript = generateInterface('parseScript');
export const parseModuleWithLocation = generateInterfaceWithLocation('parseModule');
export const parseScriptWithLocation = generateInterfaceWithLocation('parseScript');
export default parseScript;
export { EarlyErrorChecker, GenericParser, ParserWithLocation };
export { default as Tokenizer, TokenClass, TokenType } from './tokenizer';
