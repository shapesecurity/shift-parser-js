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

import { isIdentifierStart, isIdentifierPart } from './utils';

const syntaxCharacters = '^$\\.*+?()[]{}|'.split('');
const extendedSyntaxCharacters = '^$\\.*+?()[|'.split('');

const controlEscapeCharacters = 'fnrtv'.split('');
const controlEscapeCharacterValues = { 'f': '\f'.charCodeAt(0), 'n': '\n'.charCodeAt(0), 'r': '\r'.charCodeAt(0), 't': '\t'.charCodeAt(0), 'v': '\v'.charCodeAt(0) };

const controlCharacters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const hexDigits = '0123456789abcdefABCDEF'.split('');
const decimalDigits = '0123456789'.split('');
const octalDigits = '01234567'.split('');
const utf16GeneralCategoryValues = ['Cased_Letter', 'LC', 'Close_Punctuation', 'Pe', 'Connector_Punctuation', 'Pc', 'Control', 'Cc', 'cntrl', 'Currency_Symbol', 'Sc', 'Dash_Punctuation', 'Pd', 'Decimal_Number', 'Nd', 'digit', 'Enclosing_Mark', 'Me', 'Final_Punctuation', 'Pf', 'Format', 'Cf', 'Initial_Punctuation', 'Pi', 'Letter', 'L', 'Letter_Number', 'Nl', 'Line_Separator', 'Zl', 'Lowercase_Letter', 'Ll', 'Mark', 'M', 'Combining_Mark', 'Math_Symbol', 'Sm', 'Modifier_Letter', 'Lm', 'Modifier_Symbol', 'Sk', 'Nonspacing_Mark', 'Mn', 'Number', 'N', 'Open_Punctuation', 'Ps', 'Other', 'C', 'Other_Letter', 'Lo', 'Other_Number', 'No', 'Other_Punctuation', 'Po', 'Other_Symbol', 'So', 'Paragraph_Separator', 'Zp', 'Private_Use', 'Co', 'Punctuation', 'P', 'punct', 'Separator', 'Z', 'Space_Separator', 'Zs', 'Spacing_Mark', 'Mc', 'Surrogate', 'Cs', 'Symbol', 'S', 'Titlecase_Letter', 'Lt', 'Unassigned', 'Cn', 'Uppercase_Letter', 'Lu'];

const utf16ScriptCategoryValues = ['Adlam', 'Adlm', 'Ahom', 'Anatolian_Hieroglyphs', 'Hluw', 'Arabic', 'Arab', 'Armenian', 'Armn', 'Avestan', 'Avst', 'Balinese', 'Bali', 'Bamum', 'Bamu', 'Bassa_Vah', 'Bass', 'Batak', 'Batk', 'Bengali', 'Beng', 'Bhaiksuki', 'Bhks', 'Bopomofo', 'Bopo', 'Brahmi', 'Brah', 'Braille', 'Brai', 'Buginese', 'Bugi', 'Buhid', 'Buhd', 'Canadian_Aboriginal', 'Cans', 'Carian', 'Cari', 'Caucasian_Albanian', 'Aghb', 'Chakma', 'Cakm', 'Cham', 'Cherokee', 'Cher', 'Common', 'Zyyy', 'Coptic', 'Copt', 'Qaac', 'Cuneiform', 'Xsux', 'Cypriot', 'Cprt', 'Cyrillic', 'Cyrl', 'Deseret', 'Dsrt', 'Devanagari', 'Deva', 'Dogra', 'Dogr', 'Duployan', 'Dupl', 'Egyptian_Hieroglyphs', 'Egyp', 'Elbasan', 'Elba', 'Ethiopic', 'Ethi', 'Georgian', 'Geor', 'Glagolitic', 'Glag', 'Gothic', 'Goth', 'Grantha', 'Gran', 'Greek', 'Grek', 'Gujarati', 'Gujr', 'Gunjala_Gondi', 'Gong', 'Gurmukhi', 'Guru', 'Han', 'Hani', 'Hangul', 'Hang', 'Hanifi_Rohingya', 'Rohg', 'Hanunoo', 'Hano', 'Hatran', 'Hatr', 'Hebrew', 'Hebr', 'Hiragana', 'Hira', 'Imperial_Aramaic', 'Armi', 'Inherited', 'Zinh', 'Qaai', 'Inscriptional_Pahlavi', 'Phli', 'Inscriptional_Parthian', 'Prti', 'Javanese', 'Java', 'Kaithi', 'Kthi', 'Kannada', 'Knda', 'Katakana', 'Kana', 'Kayah_Li', 'Kali', 'Kharoshthi', 'Khar', 'Khmer', 'Khmr', 'Khojki', 'Khoj', 'Khudawadi', 'Sind', 'Lao', 'Laoo', 'Latin', 'Latn', 'Lepcha', 'Lepc', 'Limbu', 'Limb', 'Linear_A', 'Lina', 'Linear_B', 'Linb', 'Lisu', 'Lycian', 'Lyci', 'Lydian', 'Lydi', 'Mahajani', 'Mahj', 'Makasar', 'Maka', 'Malayalam', 'Mlym', 'Mandaic', 'Mand', 'Manichaean', 'Mani', 'Marchen', 'Marc', 'Medefaidrin', 'Medf', 'Masaram_Gondi', 'Gonm', 'Meetei_Mayek', 'Mtei', 'Mende_Kikakui', 'Mend', 'Meroitic_Cursive', 'Merc', 'Meroitic_Hieroglyphs', 'Mero', 'Miao', 'Plrd', 'Modi', 'Mongolian', 'Mong', 'Mro', 'Mroo', 'Multani', 'Mult', 'Myanmar', 'Mymr', 'Nabataean', 'Nbat', 'New_Tai_Lue', 'Talu', 'Newa', 'Nko', 'Nkoo', 'Nushu', 'Nshu', 'Ogham', 'Ogam', 'Ol_Chiki', 'Olck', 'Old_Hungarian', 'Hung', 'Old_Italic', 'Ital', 'Old_North_Arabian', 'Narb', 'Old_Permic', 'Perm', 'Old_Persian', 'Xpeo', 'Old_Sogdian', 'Sogo', 'Old_South_Arabian', 'Sarb', 'Old_Turkic', 'Orkh', 'Oriya', 'Orya', 'Osage', 'Osge', 'Osmanya', 'Osma', 'Pahawh_Hmong', 'Hmng', 'Palmyrene', 'Palm', 'Pau_Cin_Hau', 'Pauc', 'Phags_Pa', 'Phag', 'Phoenician', 'Phnx', 'Psalter_Pahlavi', 'Phlp', 'Rejang', 'Rjng', 'Runic', 'Runr', 'Samaritan', 'Samr', 'Saurashtra', 'Saur', 'Sharada', 'Shrd', 'Shavian', 'Shaw', 'Siddham', 'Sidd', 'SignWriting', 'Sgnw', 'Sinhala', 'Sinh', 'Sogdian', 'Sogd', 'Sora_Sompeng', 'Sora', 'Soyombo', 'Soyo', 'Sundanese', 'Sund', 'Syloti_Nagri', 'Sylo', 'Syriac', 'Syrc', 'Tagalog', 'Tglg', 'Tagbanwa', 'Tagb', 'Tai_Le', 'Tale', 'Tai_Tham', 'Lana', 'Tai_Viet', 'Tavt', 'Takri', 'Takr', 'Tamil', 'Taml', 'Tangut', 'Tang', 'Telugu', 'Telu', 'Thaana', 'Thaa', 'Thai', 'Tibetan', 'Tibt', 'Tifinagh', 'Tfng', 'Tirhuta', 'Tirh', 'Ugaritic', 'Ugar', 'Vai', 'Vaii', 'Warang_Citi', 'Wara', 'Yi', 'Yiii', 'Zanabazar_Square', 'Zanb'];

const utf16LonePropertyValues = ['ASCII', 'ASCII_Hex_Digit', 'AHex', 'Alphabetic', 'Alpha', 'Any', 'Assigned', 'Bidi_Control', 'Bidi_C', 'Bidi_Mirrored', 'Bidi_M', 'Case_Ignorable', 'CI', 'Cased', 'Changes_When_Casefolded', 'CWCF', 'Changes_When_Casemapped', 'CWCM', 'Changes_When_Lowercased', 'CWL', 'Changes_When_NFKC_Casefolded', 'CWKCF', 'Changes_When_Titlecased', 'CWT', 'Changes_When_Uppercased', 'CWU', 'Dash', 'Default_Ignorable_Code_Point', 'DI', 'Deprecated', 'Dep', 'Diacritic', 'Dia', 'Emoji', 'Emoji_Component', 'Emoji_Modifier', 'Emoji_Modifier_Base', 'Emoji_Presentation', 'Extended_Pictographic', 'Extender', 'Ext', 'Grapheme_Base', 'Gr_Base', 'Grapheme_Extend', 'Gr_Ext', 'Hex_Digit', 'Hex', 'IDS_Binary_Operator', 'IDSB', 'IDS_Trinary_Operator', 'IDST', 'ID_Continue', 'IDC', 'ID_Start', 'IDS', 'Ideographic', 'Ideo', 'Join_Control', 'Join_C', 'Logical_Order_Exception', 'LOE', 'Lowercase', 'Lower', 'Math', 'Noncharacter_Code_Point', 'NChar', 'Pattern_Syntax', 'Pat_Syn', 'Pattern_White_Space', 'Pat_WS', 'Quotation_Mark', 'QMark', 'Radical', 'Regional_Indicator', 'RI', 'Sentence_Terminal', 'STerm', 'Soft_Dotted', 'SD', 'Terminal_Punctuation', 'Term', 'Unified_Ideograph', 'UIdeo', 'Uppercase', 'Upper', 'Variation_Selector', 'VS', 'White_Space', 'space', 'XID_Continue', 'XIDC', 'XID_Start', 'XIDS']
  .concat(utf16GeneralCategoryValues);

const utf16NonBinaryPropertyNames = {
  'General_Category': utf16GeneralCategoryValues,
  'gc': utf16GeneralCategoryValues,
  'Script': utf16ScriptCategoryValues,
  'sc': utf16ScriptCategoryValues,
  'Script_Extensions': utf16ScriptCategoryValues,
  'scx': utf16ScriptCategoryValues,
};

class PatternAcceptorState {
  constructor(pattern, flags) {
    this.pattern = pattern;
    this.flags = flags;
    this.index = 0;
    this.backreferences = [];
    this.backreferenceNames = [];
    this.groupingNames = [];
    this.nParenthesis = 0;
  }

  empty() {
    return this.index >= this.pattern.length;
  }

  nextCodePoint() {
    let codePoint = this.pattern.codePointAt(this.index);
    return isNaN(codePoint) ? false : String.fromCodePoint(codePoint);
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

  eatIdentifierStart() {
    let characterValue;
    let originalIndex = this.index;
    if (this.match('\\u')) {
      this.skip(1);
      characterValue = acceptUnicodeEscape(this);
    } else {
      characterValue = this.pattern.codePointAt(this.index);
      this.index += String.fromCodePoint(characterValue).length;
    }
    let character = String.fromCodePoint(characterValue);
    if (character === '_' || character === '$' || isIdentifierStart(characterValue)) {
      return character;
    }
    this.index = originalIndex;
    return false;
  }

  eatIdentifierPart() {
    let characterValue;
    let originalIndex = this.index;
    if (this.match('\\u')) {
      this.skip(1);
      characterValue = acceptUnicodeEscape(this);
    } else {
      characterValue = this.pattern.codePointAt(this.index);
      this.index += String.fromCodePoint(characterValue).length;
    }
    let character = String.fromCodePoint(characterValue);
    // ZWNJ / ZWJ
    if (character === '\u200C' || character === '\u200D' || character === '$' || isIdentifierPart(characterValue)) {
      return character;
    }
    this.index = originalIndex;
    return false;
  }

  eatAny(...strs) {
    for (let str of strs) {
      if (this.eat(str)) {
        return str;
      }
    }
    return false;
  }

  expect(str) {
    if (!this.eat(str)) {
      throw new Error(`expected token "${str}", but saw "${this.pattern.slice(this.index, this.index + str.length)}" @ index ${this.index}`);
    }
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

  collect(...strs) {
    let characters = [];
    masterLoop:
    while (true) {
      for (let str of strs) {
        if (this.eat(str)) {
          characters.push(str);
          continue masterLoop;
        }
      }
      break;
    }
    return characters.join('');
  }
}

export const acceptRegex = (pattern, flags) => {
  let state = new PatternAcceptorState(pattern, flags);
  let accepted = acceptDisjunction(state);
  if (accepted) {
    if (state.flags.unicode) {
      for (let backreference of state.backreferences) {
        if (backreference > state.nParenthesis) {
          return false;
        }
      }
    }
    for (let backreferenceName of state.backreferenceNames) {
      if (state.groupingNames.indexOf(backreferenceName) === -1) {
        return false;
      }
    }
  }
  return accepted;
};

const nonZeroLogicalOr = (...funcs) => (...args) => {
  for (let func of funcs) {
    let value = func(...args);
    if (value === 0 || value) {
      return value;
    }
  }
  return false;
};

const falsyNotZero = value => value !== 0 && !value;


const backtrackOnFailure = func => state => {
  let savedIndex = state.index;
  let val;
  try {
    val = func(state);
  } catch (e) {
    val = false;
  }
  if (!val && val !== 0) {
    state.index = savedIndex;
  }
  return val;
};

const acceptUnicodeEscape = backtrackOnFailure(state => {
  state.expect('u');
  if (state.flags.unicode && state.eat('{')) {
    let digits = [];
    while (!state.eat('}')) {
      let digit = state.eatAny(...hexDigits);
      if (digit === false) {
        return false;
      }
      digits.push(digit);
    }
    let value = parseInt(digits.join(''), 16);
    return value > 0x10FFFF ? false : value;
  }
  let digits = [0, 0, 0, 0].map(() => state.eatAny(...hexDigits));
  if (digits.find(digit => digit === false) === false) {
    return false;
  }
  let value = parseInt(digits.join(''), 16);
  if (value >= 0xD800 && value <= 0xDBFF && state.eat('\\u')) {
    let digits2 = [0, 0, 0, 0].map(() => state.eatAny(...hexDigits));
    if (digits2.find(digit => digit === false) === false) {
      return false;
    }
    let value2 = parseInt(digits2.join(''), 16);
    if (value2 < 0xDC00 || value2 >= 0xE000) {
      return false;
    }
    return 0x10000 + ((value & 0x03FF) << 10) + (value2 & 0x03FF);
  }
  return value;
});

const acceptDisjunction = (state, terminator) => {
  do {
    if (terminator !== void 0 && state.eat(terminator)) {
      return true;
    } else if (state.match('|')) {
      continue;
    }
    if (!acceptAlternative(state, terminator)) {
      return false;
    }
  } while (state.eat('|'));
  if (terminator !== void 0) {
    state.expect(terminator);
  }
  return true;
};

const acceptAlternative = (state, terminator) => {
  while (!state.match('|') && !state.empty() && (terminator === void 0 || !state.match(terminator))) {
    if (!acceptTerm(state)) {
      return false;
    }
  }
  return true;
};

const acceptTerm = state => {
  // non-quantified references are rolled into quantified accepts to improve performance significantly.
  if (state.flags.unicode) {
    return acceptAssertion(state) ||
    acceptQuantified(acceptAtom)(state);
  }
  return acceptQuantified(acceptQuantifiableAssertion)(state) ||
    acceptAssertion(state) ||
    acceptQuantified(acceptAtom)(state);

};

const acceptLabeledGroup = predicate => backtrackOnFailure(state => {
  state.expect('(');
  if (predicate(state)) {
    return acceptDisjunction(state, ')');
  }
  return false;
});

const acceptAssertion = state => !!state.eatAny('^', '$', '\\b', '\\B') ||
  acceptLabeledGroup(subState => subState.flags.unicode ? !!subState.eatAny('?=', '?!', '?<=', '?<!') : !!subState.eatAny('?<=', '?<!'))(state);

const acceptQuantifiableAssertion = acceptLabeledGroup(state => !!state.eatAny('?=', '?!'));

const acceptDecimal = state => state.collect(...decimalDigits).length > 0;

const acceptQuantified = acceptor => backtrackOnFailure(state => {
  if (!acceptor(state)) {
    return false;
  }
  if (state.match('{')) {
    return backtrackOnFailure(subState => {
      subState.expect('{');
      let num1 = subState.collect(...decimalDigits);
      if (num1.length === 0) {
        return false;
      }
      if (subState.eat(',') && subState.matchAny(...decimalDigits)) {
        let num2 = subState.collect(...decimalDigits);
        if (num2.length === 0 || parseInt(num1) > parseInt(num2)) {
          return false;
        }
      }
      subState.expect('}');
      subState.eat('?');
      return true;
    })(state) || !state.flags.unicode;
  } else if (state.eatAny('*', '+', '?')) {
    state.eat('?');
  }
  return true;
});

const acceptCharacterExcept = characters => state => {
  let nextCodePoint = state.nextCodePoint();
  if (nextCodePoint === false || characters.indexOf(nextCodePoint) !== -1) {
    return false;
  }
  state.skip(nextCodePoint.length);
  return true;
};

const acceptPatternCharacter = acceptCharacterExcept(syntaxCharacters);

const acceptExtendedPatternCharacter = acceptCharacterExcept(extendedSyntaxCharacters);

const acceptInvalidBracedQuantifier = state => {
  return backtrackOnFailure(subState => {
    subState.expect('{');
    if (!acceptDecimal(subState)) {
      return false;
    }
    if (subState.eat(',') && !subState.match('}') && !acceptDecimal(subState)) {
      return false;
    }
    subState.expect('}');
    return true;
  })(state);
};

const acceptAtom = state => {
  if (state.flags.unicode) {
    return acceptPatternCharacter(state) ||
    state.eat('.') ||
    backtrackOnFailure(subState => subState.eat('\\') && !falsyNotZero(acceptAtomEscape(subState)))(state) ||
    acceptCharacterClass(state) ||
    acceptLabeledGroup(subState => subState.eat('?:'))(state) ||
    acceptGrouping(state);
  }
  let matched = state.eat('.') ||
    backtrackOnFailure(subState => subState.eat('\\') && !falsyNotZero(acceptAtomEscape(subState)))(state) ||
    backtrackOnFailure(subState => subState.eat('\\') && subState.match('c'))(state) ||
    acceptCharacterClass(state) ||
    acceptLabeledGroup(subState => subState.eat('?:'))(state) ||
    acceptGrouping(state);
  if (!matched && acceptInvalidBracedQuantifier(state)) {
    return false;
  }
  return matched || acceptExtendedPatternCharacter(state);

};

const acceptGrouping = backtrackOnFailure(state => {
  state.expect('(');
  let groupName = backtrackOnFailure(subState => {
    subState.expect('?');
    return acceptGroupName(subState);
  })(state);
  if (!acceptDisjunction(state, ')')) {
    return false;
  }
  if (groupName) {
    if (state.groupingNames.indexOf(groupName) !== -1) {
      return false;
    }
    state.groupingNames.push(groupName);
  }
  state.nParenthesis++;
  return true;
});

const acceptAtomEscape = nonZeroLogicalOr(
  state => acceptDecimalEscape(state),
  state => acceptCharacterClassEscape(state),
  state => acceptCharacterEscape(state),
  state => acceptGroupNameBackreference(state)
);

const acceptDecimalEscape = backtrackOnFailure(state => {
  let decimals = [];
  let firstDecimal = state.eatAny(...decimalDigits.slice(1));
  if (firstDecimal === false) {
    return false;
  }
  decimals.push(firstDecimal);
  let digit;
  while ((digit = state.eatAny(...decimalDigits)) !== false) {
    decimals.push(digit);
  }
  // we also accept octal escapes here, but it is impossible to tell if it is a octal escape until all parsing is complete.
  // octal escapes are handled in acceptCharacterEscape for classes
  state.backreferences.push(parseInt(decimals.join('')));
  return true;
});

const acceptCharacterClassEscape = state => !!state.eatAny('d', 'D', 's', 'S', 'w', 'W') ||
  state.flags.unicode && backtrackOnFailure(subState => (subState.eat('p{') || subState.eat('P{')) && acceptUnicodePropertyValueExpression(subState) && subState.eat('}'))(state);

const acceptUnicodePropertyName = state => {
  let characters = [];
  let character;
  while (character = state.eatAny(...controlCharacters, '_')) { // eslint-disable-line no-cond-assign
    characters.push(character);
  }
  return characters.length === 0 ? false : characters.join('');
};

const acceptUnicodePropertyValue = state => {
  let characters = [];
  let character;
  while (character = state.eatAny(...controlCharacters, ...decimalDigits, '_')) { // eslint-disable-line no-cond-assign
    characters.push(character);
  }
  return characters.length === 0 ? false : characters.join('');
};

const acceptLoneUnicodePropertyNameOrValue = state => {
  let loneValue = acceptUnicodePropertyValue(state);
  return loneValue && utf16LonePropertyValues.indexOf(loneValue) >= 0;
};

const acceptUnicodePropertyValueExpression = state =>
  backtrackOnFailure(subState => {
    let name = acceptUnicodePropertyName(subState);
    if (name === false) {
      return false;
    }
    subState.expect('=');
    let value = acceptUnicodePropertyValue(subState);
    if (value === false) {
      return false;
    }
    return name in utf16NonBinaryPropertyNames && utf16NonBinaryPropertyNames[name].indexOf(value) >= 0;
  })(state) ||
  backtrackOnFailure(acceptLoneUnicodePropertyNameOrValue)(state);

const acceptCharacterEscape = nonZeroLogicalOr(
  state => controlEscapeCharacterValues[state.eatAny(...controlEscapeCharacters)],
  backtrackOnFailure(state => {
    state.expect('c');
    let character = state.eatAny(...controlCharacters);
    if (character === false) {
      return false;
    }
    return character.codePointAt(0) % 32;
  }),
  backtrackOnFailure(state => state.eat('0') && !state.eatAny(...decimalDigits) ? 0 : false),
  backtrackOnFailure(state => {
    state.expect('x');
    let digits = [0, 0].map(() => state.eatAny(...hexDigits));
    if (digits.find(value => value === false) === false) {
      return false;
    }
    return parseInt(digits.join(''), 16);
  }),
  acceptUnicodeEscape,
  backtrackOnFailure(state => {
    if (state.flags.unicode) {
      return false;
    }
    let octal1 = state.eatAny(...octalDigits);
    if (!octal1) {
      return false;
    }
    let octal1Value = parseInt(octal1, 8);
    if (octalDigits.indexOf(state.nextCodePoint()) === -1) {
      return octal1Value;
    }
    let octal2 = state.eatAny(...octalDigits);
    let octal2Value = parseInt(octal2, 8);
    if (octal1Value < 4) {
      if (octalDigits.indexOf(state.nextCodePoint()) === -1) {
        return octal1Value << 3 | octal2Value;
      }
      let octal3 = state.eatAny(...octalDigits);
      let octal3Value = parseInt(octal3, 8);
      return octal1Value << 6 | octal2Value << 3 | octal3Value;
    }
    return octal1Value << 3 | octal2Value;
  }),
  backtrackOnFailure(state => {
    if (!state.flags.unicode) {
      return false;
    }
    let value = state.eatAny(...syntaxCharacters);
    if (!value) {
      return false;
    }
    return value.codePointAt(0);
  }),
  state => state.flags.unicode && state.eat('/') && '/'.charCodeAt(0),
  backtrackOnFailure(state => {
    if (state.flags.unicode) {
      return false;
    }
    let next = state.nextCodePoint();
    if (next !== false && next !== 'c' && next !== 'k') {
      state.skip(1);
      return next.codePointAt(0);
    }
    return false;
  })
);

const acceptGroupNameBackreference = backtrackOnFailure(state => {
  state.expect('k');
  let name = acceptGroupName(state);
  if (!name) {
    return false;
  }
  state.backreferenceNames.push(name);
  return true;
});

const acceptGroupName = backtrackOnFailure(state => {
  state.expect('<');
  let characters = [];
  let start = state.eatIdentifierStart();
  if (!start) {
    return false;
  }
  characters.push(start);
  let part;
  while (part = state.eatIdentifierPart()) { // eslint-disable-line no-cond-assign
    characters.push(part);
  }
  state.expect('>');
  return characters.join('');
});

const acceptCharacterClass = backtrackOnFailure(state => {
  state.expect('[');
  state.eat('^');
  const acceptClassEscape = nonZeroLogicalOr(
    subState => subState.eat('b') && 0x0008, // backspace
    subState => subState.flags.unicode && subState.eat('-') && '-'.charCodeAt(0),
    backtrackOnFailure(subState => !subState.flags.unicode && subState.eat('c') && subState.eatAny(...decimalDigits, '_')),
    acceptCharacterClassEscape,
    acceptCharacterEscape
  );
  const isTrueOrZero = value => value || value === 0;
  const acceptClassAtomNoDash = localState => {
    if (localState.eat('\\')) {
      return nonZeroLogicalOr(
        acceptClassEscape,
        backtrackOnFailure(subState => {
          if (subState.match('c')) {
            return 0x005C; // reverse solidus
          }
          return false;
        })
      )(localState);
    }
    let nextCodePoint = localState.nextCodePoint();
    if (nextCodePoint === false) {
      return false;
    }
    localState.skip(nextCodePoint.length);
    return nextCodePoint.codePointAt(0);
  };
  const acceptClassAtom = localState => localState.eat('-') && '-'.codePointAt(0) || acceptClassAtomNoDash(localState);
  const finishClassRange = (localState, atom) => {
    if (localState.eat('-')) {
      if (localState.match(']')) {
        return true;
      }
      let otherAtom = acceptClassAtom(localState);
      if (localState.flags.unicode && (atom === true || otherAtom === true)) {
        throw new Error('class in range is illegal');
      } else if (!(!localState.flags.unicode && (atom === true || otherAtom === true)) && atom > otherAtom) {
        throw new Error('out of order');
      } else if (localState.match(']')) {
        return true;
      } else {
        return acceptNonEmptyClassRanges(localState);
      }
    } else {
      if (localState.match(']')) {
        return true;
      }
      return acceptNonEmptyClassRangesNoDash(localState);

    }
  };
  const acceptNonEmptyClassRanges = localState => {
    let atom = acceptClassAtom(localState);
    return isTrueOrZero(atom) && finishClassRange(localState, atom);
  };
  const acceptNonEmptyClassRangesNoDash = localState => {
    let atom = acceptClassAtomNoDash(localState);
    return isTrueOrZero(atom) && finishClassRange(localState, atom);
  };
  if (state.eat(']')) {
    return true;
  }
  let value = acceptNonEmptyClassRanges(state);
  if (value) {
    state.expect(']');
  }
  return value;
});
