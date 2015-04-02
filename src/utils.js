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

import {keyword, code} from "esutils";

const { isReservedWordES6, isRestrictedWord } = keyword;
const { isIdentifierStartES6, isIdentifierPartES6, isWhiteSpace, isLineTerminator, isDecimalDigit } = code;

export {
  isRestrictedWord,
  isIdentifierStartES6 as isIdentifierStart,
  isIdentifierPartES6 as isIdentifierPart,
  isWhiteSpace,
  isLineTerminator,
  isDecimalDigit,
};


export function isStrictModeReservedWord(id) {
  return isReservedWordES6(id, true);
}

export function getHexValue(rune) {
  if ("0" <= rune && rune <= "9") {
    return rune.charCodeAt(0) - 48;
  }
  if ("a" <= rune && rune <= "f") {
    return rune.charCodeAt(0) - 87;
  }
  if ("A" <= rune && rune <= "F") {
    return rune.charCodeAt(0) - 55;
  }
  return -1;
}
