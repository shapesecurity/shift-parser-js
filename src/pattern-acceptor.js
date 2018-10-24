/**
 * Copyright 2018 Shape Security, Inc.
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

/* eslint-disable no-use-before-define */

const syntaxCharacters = '^$\\.*+?()[]{}|'.split('');
const extendedSyntaxCharacters = '^$\\.*+?()[|'.split('');

const controlEscapeCharacters = 'fnrtv'.split('');
const controlEscapeCharacterValues = { 'f': '\f'.charCodeAt(0), 'n': '\n'.charCodeAt(0), 'r': '\r'.charCodeAt(0), 't': '\t'.charCodeAt(0), 'v': '\v'.charCodeAt(0) };

const controlCharacters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const hexDigits = '0123456789abcdefABCDEF'.split('');
const decimalDigits = '0123456789'.split('');
const octalDigits = '01234567'.split('');


class PatternAcceptorState {
  constructor(pattern, unicode) {
    this.pattern = pattern;
    this.unicode = unicode;
    this.index = 0;
    this.backreferences = [];
    this.capturingGroups = 0;
  }

  empty() {
    return this.index >= this.pattern.length;
  }

  nextCodePoint() {
    if (this.empty()) {
      return null;
    }
    return String.fromCodePoint(this.pattern.codePointAt(this.index));
  }

  skip(n) {
    for (let i = 0; i < n && this.index < this.pattern.length; i++) {
      this.index += this.nextCodePoint().length;
    }
  }

  eat(str) {
    if (this.index + str.length > this.pattern.length || this.pattern.slice(this.index, this.index + str.length) !== str) {
      return false;
    }
    this.index += str.length;
    return true;
  }

  eatAny(...strs) {
    for (let str of strs) {
      if (this.eat(str)) {
        return str;
      }
    }
    return null;
  }

  match(str) {
    return this.index + str.length <= this.pattern.length && this.pattern.slice(this.index, this.index + str.length) === str;
  }

  matchAny(...strs) {
    for (let str of strs) {
      if (this.match(str)) {
        return true;
      }
    }
    return false;
  }

  eatNaturalNumber() {
    let characters = [];
    outer:
    while (true) {
      for (let str of decimalDigits) {
        if (this.eat(str)) {
          characters.push(str);
          continue outer;
        }
      }
      break;
    }
    return characters.length == 0 ? null : characters.join('');
  }
}

export const acceptRegex = (pattern, unicode) => {
  let state = new PatternAcceptorState(pattern, unicode);
  let accepted = acceptDisjunction(state);
  if (accepted.matched && state.unicode) {
    for (let backreference of state.backreferences) {
      if (backreference > state.capturingGroups) {
        return false;
      }
    }
  }
  return accepted.matched;
};

const backtrackOnFailure = func => state => {
  let savedIndex = state.index;
  let oldBackreferences = state.backreferences.slice(0);
  let oldCapturingGroups = state.capturingGroups;
  let val = func(state);
  if (!val.matched) {
    state.index = savedIndex;
    state.backreferences = oldBackreferences;
    state.capturingGroups = oldCapturingGroups;
  }
  return val;
};

const acceptUnicodeEscape = backtrackOnFailure(state => {
  if (!state.eat('u')) {
    return { matched: false };
  }
  if (state.unicode && state.eat('{')) {
    let digits = [];
    while (!state.eat('}')) {
      let digit = state.eatAny(...hexDigits);
      if (digit === null) {
        return { matched: false };
      }
      digits.push(digit);
    }
    let value = parseInt(digits.join(''), 16);
    return value > 0x10FFFF ? { matched: false } : { matched: true, value };
  }
  let digits = [0, 0, 0, 0].map(() => state.eatAny(...hexDigits));
  if (digits.some(digit => digit === null)) {
    return { matched: false };
  }
  let value = parseInt(digits.join(''), 16);
  if (state.unicode && value >= 0xD800 && value <= 0xDBFF) {
    let surrogatePairValue = backtrackOnFailure(subState => {
      if (!subState.eat('\\u')) {
        return { matched: false };
      }
      let digits2 = [0, 0, 0, 0].map(() => subState.eatAny(...hexDigits));
      if (digits2.some(digit => digit === null)) {
        return { matched: false };
      }
      let value2 = parseInt(digits2.join(''), 16);
      if (value2 < 0xDC00 || value2 >= 0xE000) {
        return { matched: false };
      }
      return { matched: true, value: 0x10000 + ((value & 0x03FF) << 10) + (value2 & 0x03FF) };
    })(state);
    if (surrogatePairValue.matched) {
      return surrogatePairValue;
    }
  }
  return { matched: true, value };
});

const acceptDisjunction = (state, terminator) => {
  do {
    if (terminator !== void 0 && state.eat(terminator)) {
      return { matched: true };
    } else if (state.match('|')) {
      continue;
    }
    if (!acceptAlternative(state, terminator).matched) {
      return { matched: false };
    }
  } while (state.eat('|'));
  return { matched: terminator === void 0 || !!state.eat(terminator) };
};

const acceptAlternative = (state, terminator) => {
  while (!state.match('|') && !state.empty() && (terminator === void 0 || !state.match(terminator))) {
    if (!acceptTerm(state).matched) {
      return { matched: false };
    }
  }
  return { matched: true };
};

const orMatched = (...predicates) => state => {
  for (let predicate of predicates) {
    let value = predicate(state);
    if (value.matched) {
      return value;
    }
  }
  return { matched: false };
};

const acceptTerm = state => {
  // non-quantified references are rolled into quantified accepts to improve performance significantly.
  if (state.unicode) {
    return orMatched(acceptAssertion, acceptQuantified(acceptAtom))(state);
  }
  return orMatched(acceptQuantified(acceptQuantifiableAssertion),
    acceptAssertion,
    acceptQuantified(acceptAtom))(state);
};

const acceptLabeledGroup = predicate => backtrackOnFailure(state => {
  if (!state.eat('(')) {
    return { matched: false };
  }
  if (predicate(state)) {
    return acceptDisjunction(state, ')');
  }
  return { matched: false };
});

const acceptQuantifiableAssertion = acceptLabeledGroup(state => !!state.eatAny('?=', '?!'));

const acceptAssertion = state => {
  return { matched: !!state.eatAny('^', '$', '\\b', '\\B') || acceptQuantifiableAssertion(state).matched };
};

const acceptDecimal = state => {
  return { matched: state.eatNaturalNumber() !== null };
};

const acceptQuantified = acceptor => backtrackOnFailure(state => {
  if (!acceptor(state).matched) {
    return { matched: false };
  }
  if (state.match('{')) {
    let value = backtrackOnFailure(subState => {
      subState.eat('{');
      let num1 = subState.eatNaturalNumber();
      if (num1 === null) {
        return { matched: false };
      }
      if (subState.eat(',') && subState.matchAny(...decimalDigits)) {
        let num2 = subState.eatNaturalNumber();
        if (num2 === null || parseInt(num1) > parseInt(num2)) {
          return { matched: false };
        }
      }
      if (!subState.eat('}')) {
        return { matched: false };
      }
      subState.eat('?');
      return { matched: true };
    })(state);
    if (!value.matched) {
      return { matched: !state.unicode };
    }
    return value;
  } else if (state.eatAny('*', '+', '?')) {
    state.eat('?');
  }
  return { matched: true };
});

const acceptCharacterExcept = characters => state => {
  let nextCodePoint = state.nextCodePoint();
  if (nextCodePoint === null || characters.indexOf(nextCodePoint) !== -1) {
    return { matched: false };
  }
  state.skip(nextCodePoint.length);
  return { matched: true };
};

const acceptPatternCharacter = acceptCharacterExcept(syntaxCharacters);

const acceptExtendedPatternCharacter = acceptCharacterExcept(extendedSyntaxCharacters);

const acceptInvalidBracedQuantifier = state => {
  return backtrackOnFailure(subState => {
    return { matched: !!(subState.eat('{') && acceptDecimal(subState).matched && (!subState.eat(',') || subState.match('}') || acceptDecimal(subState).matched) && subState.eat('}')) };
  })(state);
};

const acceptAtom = state => {
  if (state.unicode) {
    return orMatched(acceptPatternCharacter,
      subState => {
        return { matched: !!subState.eat('.') };
      },
      backtrackOnFailure(subState => subState.eat('\\') ? acceptAtomEscape(subState) : { matched: false }),
      acceptCharacterClass,
      acceptLabeledGroup(subState => subState.eat('?:')),
      acceptGrouping)(state);
  }
  let matched = orMatched(
    subState => {
      return { matched: !!subState.eat('.') };
    },
    backtrackOnFailure(subState => subState.eat('\\') ? acceptAtomEscape(subState) : { matched: false }),
    acceptCharacterClass,
    acceptLabeledGroup(subState => subState.eat('?:')),
    acceptGrouping)(state);
  if (!matched.matched && acceptInvalidBracedQuantifier(state).matched) {
    return { matched: false };
  }
  return matched.matched ? matched : acceptExtendedPatternCharacter(state);

};

const acceptGrouping = backtrackOnFailure(state => {
  if (!state.eat('(') || !acceptDisjunction(state, ')').matched) {
    return { matched: false };
  }
  state.capturingGroups++;
  return { matched: true };
});

const acceptDecimalEscape = backtrackOnFailure(state => {
  let firstDecimal = state.eatAny(...decimalDigits.slice(1));
  if (firstDecimal === null) {
    return { matched: false };
  }
  // we also accept octal escapes here, but it is impossible to tell if it is a octal escape until all parsing is complete.
  // octal escapes are handled in acceptCharacterEscape for classes
  state.backreferences.push(parseInt(firstDecimal + (state.eatNaturalNumber() || '')));
  return { matched: true };
});

const acceptCharacterClassEscape = state => {
  return { matched: !!state.eatAny('d', 'D', 's', 'S', 'w', 'W') };
};

const acceptCharacterEscape = orMatched(
  state => {
    let eaten = state.eatAny(...controlEscapeCharacters);
    if (eaten === null) {
      return { matched: false };
    }
    return { matched: true, value: controlEscapeCharacterValues[eaten] };
  },
  backtrackOnFailure(state => {
    if (!state.eat('c')) {
      return { matched: false };
    }
    let character = state.eatAny(...controlCharacters);
    if (character === null) {
      return { matched: false };
    }
    return { matched: true, value: character.codePointAt(0) % 32 };
  }),
  backtrackOnFailure(state => {
    if (!state.eat('0') || state.eatAny(...decimalDigits)) {
      return { matched: false };
    }
    return { matched: true, value: 0 };
  }),
  backtrackOnFailure(state => {
    if (!state.eat('x')) {
      return { matched: false };
    }
    let digits = [0, 0].map(() => state.eatAny(...hexDigits));
    if (digits.some(value => value === null)) {
      return { matched: false };
    }
    return { matched: true, value: parseInt(digits.join(''), 16) };
  }),
  acceptUnicodeEscape,
  backtrackOnFailure(state => {
    if (state.unicode) {
      return { matched: false };
    }
    let octal1 = state.eatAny(...octalDigits);
    if (octal1 === null) {
      return { matched: false };
    }
    let octal1Value = parseInt(octal1, 8);
    if (octalDigits.indexOf(state.nextCodePoint()) === -1) {
      return { matched: true, value: octal1Value };
    }
    let octal2 = state.eatAny(...octalDigits);
    let octal2Value = parseInt(octal2, 8);
    if (octal1Value < 4) {
      if (octalDigits.indexOf(state.nextCodePoint()) === -1) {
        return { matched: true, value: octal1Value << 3 | octal2Value };
      }
      let octal3 = state.eatAny(...octalDigits);
      let octal3Value = parseInt(octal3, 8);
      return { matched: true, value: octal1Value << 6 | octal2Value << 3 | octal3Value };
    }
    return { matched: true, value: octal1Value << 3 | octal2Value };
  }),
  backtrackOnFailure(state => {
    if (!state.unicode) {
      return { matched: false };
    }
    let value = state.eatAny(...syntaxCharacters);
    if (value === null) {
      return { matched: false };
    }
    return { matched: true, value: value.codePointAt(0) };
  }),
  state => {
    if (!state.unicode || !state.eat('/')) {
      return { matched: false };
    }
    return { matched: true, value: '/'.charCodeAt(0) };
  },
  backtrackOnFailure(state => {
    if (state.unicode) {
      return { matched: false };
    }
    let next = state.nextCodePoint();
    if (next !== null && next !== 'c') {
      state.skip(1);
      return { matched: true, value: next.codePointAt(0) };
    }
    return { matched: false };
  })
);

const acceptAtomEscape = orMatched(
  acceptDecimalEscape,
  acceptCharacterClassEscape,
  acceptCharacterEscape
);

const acceptCharacterClass = backtrackOnFailure(state => {
  if (!state.eat('[')) {
    return { matched: false };
  }
  state.eat('^');

  const acceptClassEscape = orMatched(
    subState => {
      return { matched: !!subState.eat('b'), value: 0x0008 };
    },
    subState => {
      return { matched: subState.unicode && !!subState.eat('-'), value: '-'.charCodeAt(0) };
    },
    backtrackOnFailure(subState => {
      if (subState.unicode || !subState.eat('c')) {
        return { matched: false };
      }
      let eaten = subState.eatAny(...decimalDigits, '_');
      return { matched: !!eaten, value: eaten };
    }),
    acceptCharacterClassEscape,
    acceptCharacterEscape
  );

  const acceptClassAtomNoDash = localState => {
    if (localState.eat('\\')) {
      return orMatched(
        acceptClassEscape,
        backtrackOnFailure(subState => {
          if (subState.match('c')) {
            return { matched: true, value: 0x005C }; // reverse solidus
          }
          return { matched: false };
        })
      )(localState);
    }
    let nextCodePoint = localState.nextCodePoint();
    if (nextCodePoint === null) {
      return { matched: false };
    }
    localState.skip(nextCodePoint.length);
    return { matched: true, value: nextCodePoint.codePointAt(0) };
  };

  const acceptClassAtom = localState => {
    if (localState.eat('-')) {
      return { matched: true, value: '-'.codePointAt(0) };
    }
    return acceptClassAtomNoDash(localState);
  };

  const finishClassRange = (localState, atom) => {
    const isUnvaluedPassedAtom = subAtom => {
      return subAtom.value === void 0 && subAtom.matched;
    };
    if (localState.eat('-')) {
      if (localState.match(']')) {
        return { matched: true };
      }
      let otherAtom = acceptClassAtom(localState);
      if (!otherAtom.matched) {
        return { matched: false };
      }
      if (localState.unicode && (isUnvaluedPassedAtom(atom) || isUnvaluedPassedAtom(otherAtom))) {
        return { matched: false };
      } else if (!(!localState.unicode && (isUnvaluedPassedAtom(atom) || isUnvaluedPassedAtom(otherAtom))) && atom.value > otherAtom.value) {
        return { matched: false };
      } else if (localState.match(']')) {
        return { matched: true };
      }
      return acceptNonEmptyClassRanges(localState);

    }
    if (localState.match(']')) {
      return { matched: true };
    }
    return acceptNonEmptyClassRangesNoDash(localState);

  };

  const acceptNonEmptyClassRanges = localState => {
    let atom = acceptClassAtom(localState);
    return atom.matched ? finishClassRange(localState, atom) : { matched: false };
  };

  const acceptNonEmptyClassRangesNoDash = localState => {
    let atom = acceptClassAtomNoDash(localState);
    return atom.matched ? finishClassRange(localState, atom) : { matched: false };
  };

  if (state.eat(']')) {
    return { matched: true };
  }

  let value = acceptNonEmptyClassRanges(state);
  if (value.matched) {
    state.eat(']'); // cannot fail, as above will not return matched if it is not seen in advance
  }

  return value;
});
