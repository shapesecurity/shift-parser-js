"use strict";

exports.isStrictModeReservedWord = isStrictModeReservedWord;
exports.getHexValue = getHexValue;
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

var _keyword$code = require("esutils");

var isReservedWordES6 = _keyword$code.keyword.isReservedWordES6;
var isRestrictedWord = _keyword$code.keyword.isRestrictedWord;
var isIdentifierStartES6 = _keyword$code.code.isIdentifierStartES6;
var isIdentifierPartES6 = _keyword$code.code.isIdentifierPartES6;
var isWhiteSpace = _keyword$code.code.isWhiteSpace;
var isLineTerminator = _keyword$code.code.isLineTerminator;
var isDecimalDigit = _keyword$code.code.isDecimalDigit;
exports.isRestrictedWord = isRestrictedWord;
exports.isIdentifierStart = isIdentifierStartES6;
exports.isIdentifierPart = isIdentifierPartES6;
exports.isWhiteSpace = isWhiteSpace;
exports.isLineTerminator = isLineTerminator;
exports.isDecimalDigit = isDecimalDigit;

function isStrictModeReservedWord(id) {
  return isReservedWordES6(id, true);
}

function getHexValue(rune) {
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