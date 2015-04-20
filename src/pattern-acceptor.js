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

export class PatternAcceptor {
  constructor(pattern, u) {
    this.index = 0;
    this.nCapturingParens = 0;
    // constants
    this.length = pattern.length;
    this.pattern = pattern;
    this.u = u;
  }

  static test(pattern, u) {
    let acceptor = new PatternAcceptor(pattern, u);
    return acceptor.readDisjunction() && acceptor.index === acceptor.length;
  }

  eat(ch) {
    if (this.index >= this.length || this.pattern[this.index] !== ch) return false;
    ++this.index;
    return true;
  }

  eatRegExp(r) {
    if (this.index >= this.length || !r.test(this.pattern[this.index])) return false;
    ++this.index;
    return true;
  }

  eatN(n, r) {
    if (this.index + n <= this.length && r.test(this.pattern.slice(this.index, this.index + n))) {
      this.index += n;
      return true;
    }
    return false;
  }

  match(ch) {
    return this.index < this.length && this.pattern[this.index] === ch;
  }

  matchRegExp(r) {
    return this.index < this.length && r.test(this.pattern[this.index]);
  }

  trackback(start, result) {
    if (result) return true;
    this.index = start;
    return false;
  }


  readDisjunction() {
    return this.readAlternative() && (this.eat("|") ? this.readDisjunction() : true);
  }

  readAlternative() {
    let savedIndex = this.index;
    while (this.readTerm()) {
      savedIndex = this.index;
    }
    this.index = savedIndex;
    return true;
  }

  readTerm() {
    if (!this.u) return this.readExtendedTerm();
    return this.readAssertion() ||
      this.readQuantifiableAssertion() ||
      this.readAtom() && (this.readQuantifier(), true);
  }

  readExtendedTerm() {
    return this.readQuantifiableAssertion() && (this.readQuantifier(), true) ||
      this.readAssertion() ||
      this.readAtomNoBrace() && (this.readQuantifier(), true) ||
      this.readAtom();
  }

  readAssertion() {
    return this.eat("^") || this.eat("$") || this.eatN(2, /^\\[bB]$/);
  }

  readQuantifiableAssertion() {
    let start = this.index;
    return this.eatN(3, /^\(\?[=!]$/) && this.trackback(start, this.readDisjunction() && this.eat(")"));
  }

  readQuantifier() {
    return this.readQuantifierPrefix() && (this.eat("?"), true);
  }

  readQuantifierPrefix() {
    if (this.eat("*") || this.eat("+") || this.eat("?")) return true;
    if (this.eat("{") && this.readDecimalDigits()) {
      if (this.eat(",")) this.readDecimalDigits();
      return this.eat("}");
    }
    return false;
  }

  readDecimalDigits() {
    let start = this.index;
    while (this.eatRegExp(/^\d$/));
    return this.index > start;
  }

  readAtomNoBrace() {
    let start = this.index;
    let startingParens = this.nCapturingParens;
    if (this.readPatternCharacterNoBrace() || this.eat(".")) return true;
    if (this.eat("\\")) return this.trackback(start, this.readAtomEscape());
    if (this.readCharacterClass()) return true;
    if (this.eat("(")) {
      if (!this.eatN(2, /^\?:$/)) ++this.nCapturingParens;
      if (this.readDisjunction() && this.eat(")")) return true;
      this.nCapturingParens = startingParens;
      this.index = start;
      return false;
    }
    return false;
  }

  readAtom() {
    return this.readAtomNoBrace() || this.eat("{") || this.eat("}");
  }

  readSyntaxCharacter() {
    return this.eatRegExp(/^[\^$\\.*+?()[\]{}|]$/);
  }

  readPatternCharacterNoBrace() {
    return this.eatRegExp(/^[^\^$\\.*+?()[\]{}|]$/);
  }

  readAtomEscape() {
    return this.readDecimalEscape() || this.readCharacterEscape() || this.readCharacterClassEscape();
  }

  readCharacterEscape() {
    return this.readControlEscape() ||
      this.eat("c") && this.readControlLetter() ||
      this.readHexEscapeSequence() ||
      this.readRegExpUnicodeEscapeSequence() ||
      this.readIdentityEscape();
  }

  readControlEscape() {
    return this.eatRegExp(/^[fnrtv]$/);
  }

  readControlLetter() {
    return this.eatRegExp(/^[a-zA-Z]$/);
  }

  readHexEscapeSequence() {
    return this.eat("x") && this.readHexDigit() && this.readHexDigit();
  }

  readHexDigit() {
    return this.eatRegExp(/^[a-fA-F0-9]$/);
  }

  readRegExpUnicodeEscapeSequence() {
    if (!this.eat("u")) return false;
    if (this.u) {
      if (this.eatN(4, /^D[abAB89][a-fA-F0-9]{2}$/)) {
        this.eatN(6, /^\\u[dD][c-fC-F0-9][a-fA-F0-9]{2}$/);
        return true;
      }
      return this.readHex4Digits() || this.eat("{") && this.readHexDigits() && this.eat("}");
    } else {
      return this.readHex4Digits();
    }
  }

  readHex4Digits() {
    let k = 4;
    while (k > 0) {
      --k;
      if (!this.readHexDigit()) return false;
    }
    return true;
  }

  readHexDigits() {
    let start = this.index;
    while (this.readHexDigit());
    return this.index > start;
  }

  readIdentityEscape() {
    if (this.u) {
      return this.readSyntaxCharacter() || this.eat("/");
    } else {
      return this.eatRegExp(/^[^a-zA-Z0-9_]$/); // TODO: SourceCharacter but not UnicodeIDContinue
    }
  }

  readDecimalEscape() {
    if (this.eat("0")) {
      if (!this.matchRegExp(/^\d$/)) return true;
      --this.index;
      return false;
    }
    let start = this.index;
    while (this.eatRegExp(/^\d$/));
    return this.trackback(start, this.index > start && (this.u || +this.pattern.slice(start, this.index) <= this.nCapturingParens));
  }

  readCharacterClassEscape() {
    return this.eatRegExp(/^[dDsSwW]$/);
  }

  readCharacterClass() {
    let start = this.index;
    return this.eat("[") && this.trackback(start, (this.eat("^"), true) && this.readClassRanges() && this.eat("]"));
  }

  readClassRanges() {
    let start = this.index;
    if (!this.readNonemptyClassRanges()) {
      this.index = start;
    }
    return true;
  }

  readNonemptyClassRanges() {
    if (!this.readClassAtom()) return false;
    if (this.match("]")) return true;
    if (this.eat("-")) {
      if (this.match("]")) return true;
     return this.readClassAtom() && this.readClassRanges();
    }
    return this.readNonemptyClassRangesNoDash();
  }

  readNonemptyClassRangesNoDash() {
    // NOTE: it is impossible to reach this next line with a value matched by RegularExpressionLiteral;
    // the pattern "[-a" would reach here if it could get past RegularExpressionLiteral
    /* istanbul ignore next */
    if (!this.readClassAtomNoDash()) return false;
    if (this.match("]")) return true;
    if (this.eat("-")) {
      if (this.match("]")) return true;
      return this.readClassAtom() && this.readClassRanges();
    }
    return this.readNonemptyClassRangesNoDash();
  }

  readClassAtom() {
    return this.eat("-") || this.readClassAtomNoDash();
  }

  readClassAtomNoDash() {
    return this.eatRegExp(/^[^\\\]-]$/) || this.eat("\\") && this.readClassEscape();
  }

  readClassEscape() {
    return this.readDecimalEscape() || this.eat("b") || this.u && this.eat("-") || this.readCharacterEscape() || this.readCharacterClassEscape();
  }

}
