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


import {getHexValue, isLineTerminator, isWhitespace, isIdentifierStart, isIdentifierPart, isDecimalDigit} from "./utils";
import {ErrorMessages} from "./errors";

export const TokenClass = {
  BooleanLiteral: {name: "Boolean"},
  Eof: {name: "<End>"},
  Ident: {name: "Identifier"},
  Keyword: {name: "Keyword"},
  NullLiteral: {name: "Null"},
  NumericLiteral: {name: "Numeric"},
  Punctuator: {name: "Punctuator"},
  StringLiteral: {name: "String"},
  RegularExpression: {name: "RegularExpression"},
  LineComment: {name: "Line"},
  BlockComment: {name: "Block"},
  Illegal: {name: "Illegal"}
};

export const TokenType = {
  EOS: {klass: TokenClass.Eof, name: "EOS"},
  LPAREN: {klass: TokenClass.Punctuator, name: "("},
  RPAREN: {klass: TokenClass.Punctuator, name: ")"},
  LBRACK: {klass: TokenClass.Punctuator, name: "["},
  RBRACK: {klass: TokenClass.Punctuator, name: "]"},
  LBRACE: {klass: TokenClass.Punctuator, name: "{"},
  RBRACE: {klass: TokenClass.Punctuator, name: "}"},
  COLON: {klass: TokenClass.Punctuator, name: ":"},
  SEMICOLON: {klass: TokenClass.Punctuator, name: ";"},
  PERIOD: {klass: TokenClass.Punctuator, name: "."},
  CONDITIONAL: {klass: TokenClass.Punctuator, name: "?"},
  INC: {klass: TokenClass.Punctuator, name: "++"},
  DEC: {klass: TokenClass.Punctuator, name: "--"},
  ASSIGN: {klass: TokenClass.Punctuator, name: "="},
  ASSIGN_BIT_OR: {klass: TokenClass.Punctuator, name: "|="},
  ASSIGN_BIT_XOR: {klass: TokenClass.Punctuator, name: "^="},
  ASSIGN_BIT_AND: {klass: TokenClass.Punctuator, name: "&="},
  ASSIGN_SHL: {klass: TokenClass.Punctuator, name: "<<="},
  ASSIGN_SHR: {klass: TokenClass.Punctuator, name: ">>="},
  ASSIGN_SHR_UNSIGNED: {klass: TokenClass.Punctuator, name: ">>>="},
  ASSIGN_ADD: {klass: TokenClass.Punctuator, name: "+="},
  ASSIGN_SUB: {klass: TokenClass.Punctuator, name: "-="},
  ASSIGN_MUL: {klass: TokenClass.Punctuator, name: "*="},
  ASSIGN_DIV: {klass: TokenClass.Punctuator, name: "/="},
  ASSIGN_MOD: {klass: TokenClass.Punctuator, name: "%="},
  COMMA: {klass: TokenClass.Punctuator, name: ","},
  OR: {klass: TokenClass.Punctuator, name: "||"},
  AND: {klass: TokenClass.Punctuator, name: "&&"},
  BIT_OR: {klass: TokenClass.Punctuator, name: "|"},
  BIT_XOR: {klass: TokenClass.Punctuator, name: "^"},
  BIT_AND: {klass: TokenClass.Punctuator, name: "&"},
  SHL: {klass: TokenClass.Punctuator, name: "<<"},
  SHR: {klass: TokenClass.Punctuator, name: ">>"},
  SHR_UNSIGNED: {klass: TokenClass.Punctuator, name: ">>>"},
  ADD: {klass: TokenClass.Punctuator, name: "+"},
  SUB: {klass: TokenClass.Punctuator, name: "-"},
  MUL: {klass: TokenClass.Punctuator, name: "*"},
  DIV: {klass: TokenClass.Punctuator, name: "/"},
  MOD: {klass: TokenClass.Punctuator, name: "%"},
  EQ: {klass: TokenClass.Punctuator, name: "=="},
  NE: {klass: TokenClass.Punctuator, name: "!="},
  EQ_STRICT: {klass: TokenClass.Punctuator, name: "==="},
  NE_STRICT: {klass: TokenClass.Punctuator, name: "!=="},
  LT: {klass: TokenClass.Punctuator, name: "<"},
  GT: {klass: TokenClass.Punctuator, name: ">"},
  LTE: {klass: TokenClass.Punctuator, name: "<="},
  GTE: {klass: TokenClass.Punctuator, name: ">="},
  INSTANCEOF: {klass: TokenClass.Keyword, name: "instanceof"},
  IN: {klass: TokenClass.Keyword, name: "in"},
  NOT: {klass: TokenClass.Punctuator, name: "!"},
  BIT_NOT: {klass: TokenClass.Punctuator, name: "~"},
  DELETE: {klass: TokenClass.Keyword, name: "delete"},
  TYPEOF: {klass: TokenClass.Keyword, name: "typeof"},
  VOID: {klass: TokenClass.Keyword, name: "void"},
  BREAK: {klass: TokenClass.Keyword, name: "break"},
  CASE: {klass: TokenClass.Keyword, name: "case"},
  CATCH: {klass: TokenClass.Keyword, name: "catch"},
  CONTINUE: {klass: TokenClass.Keyword, name: "continue"},
  DEBUGGER: {klass: TokenClass.Keyword, name: "debugger"},
  DEFAULT: {klass: TokenClass.Keyword, name: "default"},
  DO: {klass: TokenClass.Keyword, name: "do"},
  ELSE: {klass: TokenClass.Keyword, name: "else"},
  FINALLY: {klass: TokenClass.Keyword, name: "finally"},
  FOR: {klass: TokenClass.Keyword, name: "for"},
  FUNCTION: {klass: TokenClass.Keyword, name: "function"},
  IF: {klass: TokenClass.Keyword, name: "if"},
  NEW: {klass: TokenClass.Keyword, name: "new"},
  RETURN: {klass: TokenClass.Keyword, name: "return"},
  SWITCH: {klass: TokenClass.Keyword, name: "switch"},
  THIS: {klass: TokenClass.Keyword, name: "this"},
  THROW: {klass: TokenClass.Keyword, name: "throw"},
  TRY: {klass: TokenClass.Keyword, name: "try"},
  VAR: {klass: TokenClass.Keyword, name: "var"},
  WHILE: {klass: TokenClass.Keyword, name: "while"},
  WITH: {klass: TokenClass.Keyword, name: "with"},
  NULL_LITERAL: {klass: TokenClass.NullLiteral, name: "null"},
  TRUE_LITERAL: {klass: TokenClass.BooleanLiteral, name: "true"},
  FALSE_LITERAL: {klass: TokenClass.BooleanLiteral, name: "false"},
  NUMBER: {klass: TokenClass.NumericLiteral, name: ""},
  STRING: {klass: TokenClass.StringLiteral, name: ""},
  REGEXP: {klass: TokenClass.RegularExpression, name: ""},
  IDENTIFIER: {klass: TokenClass.Ident, name: ""},
  FUTURE_RESERVED_WORD: {klass: TokenClass.Keyword, name: ""},
  FUTURE_STRICT_RESERVED_WORD: {klass: TokenClass.Keyword, name: ""},
  CONST: {klass: TokenClass.Keyword, name: "const"},
  LET: {klass: TokenClass.Keyword, name: "let"},
  YIELD: {klass: TokenClass.Keyword, name: "yield"},
  ILLEGAL: {klass: TokenClass.Illegal, name: ""}
};

const TT = TokenType;
const I = TT.ILLEGAL;
const F = false;
const T = true;

const ONE_CHAR_PUNCTUATOR = [
  I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, TT.NOT, I, I, I,
  TT.MOD, TT.BIT_AND, I, TT.LPAREN, TT.RPAREN, TT.MUL, TT.ADD, TT.COMMA, TT.SUB, TT.PERIOD, TT.DIV, I, I, I, I, I, I, I,
  I, I, I, TT.COLON, TT.SEMICOLON, TT.LT, TT.ASSIGN, TT.GT, TT.CONDITIONAL, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I,
  I, I, I, I, I, I, I, I, I, I, I, I, TT.LBRACK, I, TT.RBRACK, TT.BIT_XOR, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I,
  I, I, I, I, I, I, I, I, I, I, I, I, I, TT.LBRACE, TT.BIT_OR, TT.RBRACE, TT.BIT_NOT];

const PUNCTUATOR_START = [
  F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, T, F, F, F, T, T,
  F, T, T, T, T, T, T, F, T, F, F, F, F, F, F, F, F, F, F, T, T, T, T, T, T, F, F, F, F, F, F, F, F, F, F, F, F, F, F,
  F, F, F, F, F, F, F, F, F, F, F, F, F, T, F, T, T, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F,
  F, F, F, F, F, F, T, T, T, T, F];

const IDENTIFIER_START = [
  F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, T, F, F,
  F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, T, T, T, T, T, T, T, T, T, T, T, T, T,
  T, T, T, T, T, T, T, T, T, T, T, T, T, F, T, F, F, T, F, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T,
  T, T, T, T, T, T, F, F, F, F, F];

export class Token {
  constructor(type, slice, octal) {
    this.type = type;
    this.slice = slice;
    this.octal = octal;
  }

  get value() {
  }
}

export class IdentifierLikeToken extends Token {
  constructor(type, slice) {
    super(type, slice, false);
  }

  get value() {
    return this.slice.text;
  }
}

export class IdentifierToken extends IdentifierLikeToken {
  constructor(slice) {
    super(TokenType.IDENTIFIER, slice);
  }
}

export class NullLiteralToken extends IdentifierLikeToken {
  constructor(slice) {
    super(TokenType.NULL_LITERAL, slice);
  }
}

export class TrueLiteralToken extends IdentifierLikeToken {
  constructor(slice) {
    super(TokenType.TRUE_LITERAL, slice);
  }
}

export class FalseLiteralToken extends IdentifierLikeToken {
  constructor(slice) {
    super(TokenType.FALSE_LITERAL, slice);
  }
}

export class KeywordToken extends IdentifierLikeToken {
  constructor(type, slice) {
    super(type, slice);
  }
}

export class PunctuatorToken extends Token {
  constructor(type, slice) {
    super(type, slice, false);
  }

  get value() {
    return this.type.name;
  }
}

export class RegularExpressionLiteralToken extends Token {
  constructor(slice, value) {
    super(TokenType.REGEXP, slice, false);
    this._value = value;
  }

  get value() {
    return this._value;
  }
}

export class NumericLiteralToken extends Token {
  constructor(slice, value = +slice.text, octal = false) {
    super(TokenType.NUMBER, slice, octal);
    this._value = value;
  }

  get value() {
    return this._value.toString();
  }
}

export class StringLiteralToken extends Token {
  constructor(slice, value, octal) {
    super(TokenType.STRING, slice, octal);
    this._value = value;
  }

  get value() {
    return this._value;
  }
}

export class EOFToken extends Token {
  constructor(slice) {
    super(TokenType.EOS, slice, false);
  }

  get value() {
    return "";
  }
}

export class JsError {
  constructor(index, line, column, msg) {
    this.index = index;
    this.line = line;
    this.column = column;
    this.description = msg;
    this.message = `[${line}:${column}]: ${msg}`;
  }
}

export default
class Tokenizer {
  constructor(source) {
    this.source = source;
    this.index = 0;
    this.lineStarts = [0];
    this.lookaheadStart = 0;
    this.lookahead = this.advance();
    this.lookaheadEnd = this.index;
    this.index = 0;
    this.strict = false;
    this.hasLineTerminatorBeforeNext = false;
    this.prevToken = null;
    this.tokenIndex = 0;
    this.lineStarts = [0];
  }

  trackBackLineNumber(position) {
    for (let line = this.lineStarts.length - 1; line >= 0; line--) {
      if ((position >= this.getLineStart(line))) {
        return line;
      }
    }
    return 0;
  }

  createILLEGAL() {
    return this.createError(ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN);
  }

  createUnexpected(token) {
    switch (token.type.klass) {
      case TokenClass.Eof:
        return this.createError(ErrorMessages.UNEXPECTED_EOS);
      case TokenClass.NumericLiteral:
        return this.createError(ErrorMessages.UNEXPECTED_NUMBER);
      case TokenClass.StringLiteral:
        return this.createError(ErrorMessages.UNEXPECTED_STRING);
      case TokenClass.Ident:
        return this.createError(ErrorMessages.UNEXPECTED_IDENTIFIER);
      case TokenClass.Keyword:
        if ((token.type === TokenType.FUTURE_RESERVED_WORD)) {
          return this.createError(ErrorMessages.UNEXPECTED_RESERVED_WORD);
        }
        if ((token.type === TokenType.FUTURE_STRICT_RESERVED_WORD)) {
          return this.createError(ErrorMessages.STRICT_RESERVED_WORD);
        }
        return this.createError(ErrorMessages.UNEXPECTED_TOKEN, token.slice.text);
      case TokenClass.Punctuator:
        return this.createError(ErrorMessages.UNEXPECTED_TOKEN, token.type.name);
      default:
        break;
    }
    return this.createError(ErrorMessages.UNEXPECTED_TOKEN, token.value || token.type.name);
  }

  createError(message, arg) {
    let msg = message.replace(/{(\d+)}/g, () => arg);
    let index = this.index;
    let line = this.trackBackLineNumber(index);
    return new JsError(index, line + 1, index - this.getLineStart(line) + 1, msg);
  }

  createErrorWithToken(token, message, arg) {
    let msg = message.replace(/{(\d+)}/g, () => arg);
    let index = token.slice.start;
    let line = this.trackBackLineNumber(index);
    return new JsError(index, line + 1, index - this.getLineStart(line) + 1, msg);
  }

  getLineStart(line) {
    return this.lineStarts[line];
  }

  static cse2(id, ch1, ch2) {
    return id.charAt(1) === ch1 && id.charAt(2) === ch2;
  }

  static cse3(id, ch1, ch2, ch3) {
    return id.charAt(1) === ch1 && id.charAt(2) === ch2 && id.charAt(3) === ch3;
  }

  static cse4(id, ch1, ch2, ch3, ch4) {
    return id.charAt(1) === ch1 && id.charAt(2) === ch2 && id.charAt(3) === ch3 && id.charAt(4) === ch4;
  }

  static cse5(id, ch1, ch2, ch3, ch4, ch5) {
    return id.charAt(1) === ch1 && id.charAt(2) === ch2 && id.charAt(3) === ch3 && id.charAt(4) === ch4 && id.charAt(5)
        === ch5;
  }

  static cse6(id, ch1, ch2, ch3, ch4, ch5, ch6) {
    return id.charAt(1) === ch1 && id.charAt(2) === ch2 && id.charAt(3) === ch3 && id.charAt(4) === ch4 && id.charAt(5)
        === ch5 && id.charAt(6) === ch6;
  }

  static cse7(id, ch1, ch2, ch3, ch4, ch5, ch6, ch7) {
    return id.charAt(1) === ch1 && id.charAt(2) === ch2 && id.charAt(3) === ch3 && id.charAt(4) === ch4 && id.charAt(5)
        === ch5 && id.charAt(6) === ch6 && id.charAt(7) === ch7;
  }

  static getKeyword(id, strict) {
    // "const" is specialized as Keyword in V8.
    // "yield" and "let" are for compatibility with SpiderMonkey and ES.next.
    // Some others are from future reserved words.

    if (id.length === 1 || id.length > 10) {
      return TokenType.ILLEGAL;
    }
    switch (id.length) {
      case 2:
        switch (id.charAt(0)) {
          case "i":
            switch (id.charAt(1)) {
              case "f":
                return TokenType.IF;
              case "n":
                return TokenType.IN;
              default:
                break;
            }
            break;
          case "d":
            if (id.charAt(1) === "o") {
              return TokenType.DO;
            }
            break;
          default:
            break;
        }
        break;
      case 3:
        switch (id.charAt(0)) {
          case "v":
            if (Tokenizer.cse2(id, "a", "r")) {
              return TokenType.VAR;
            }
            break;
          case "f":
            if (Tokenizer.cse2(id, "o", "r")) {
              return TokenType.FOR;
            }
            break;
          case "n":
            if (Tokenizer.cse2(id, "e", "w")) {
              return TokenType.NEW;
            }
            break;
          case "t":
            if (Tokenizer.cse2(id, "r", "y")) {
              return TokenType.TRY;
            }
            break;
          case "l":
            if (Tokenizer.cse2(id, "e", "t")) {
              return strict ? TokenType.FUTURE_STRICT_RESERVED_WORD : TokenType.LET;
            }
            break;
          default:
            break;
        }
        break;
      case 4:
        switch (id.charAt(0)) {
          case "t":
            if (Tokenizer.cse3(id, "h", "i", "s")) {
              return TokenType.THIS;
            }
            break;
          case "e":
            if (Tokenizer.cse3(id, "l", "s", "e")) {
              return TokenType.ELSE;
            } else if (Tokenizer.cse3(id, "n", "u", "m")) {
              return TokenType.FUTURE_RESERVED_WORD;
            }
            break;
          case "c":
            if (Tokenizer.cse3(id, "a", "s", "e")) {
              return TokenType.CASE;
            }
            break;
          case "v":
            if (Tokenizer.cse3(id, "o", "i", "d")) {
              return TokenType.VOID;
            }
            break;
          case "w":
            if (Tokenizer.cse3(id, "i", "t", "h")) {
              return TokenType.WITH;
            }
            break;
          default:
            break;
        }
        break;
      case 5:
        switch (id.charAt(0)) {
          case "w": // WHILE
            if (Tokenizer.cse4(id, "h", "i", "l", "e")) {
              return TokenType.WHILE;
            }
            break;
          case "b": // BREAK
            if (Tokenizer.cse4(id, "r", "e", "a", "k")) {
              return TokenType.BREAK;
            }
            break;
          case "c": // CATCH
            if (Tokenizer.cse4(id, "a", "t", "c", "h")) {
              return TokenType.CATCH;
            } else if (Tokenizer.cse4(id, "o", "n", "s", "t")) {
              return TokenType.CONST;
            } else if (Tokenizer.cse4(id, "l", "a", "s", "s")) {
              return TokenType.FUTURE_RESERVED_WORD;
            }
            break;
          case "t": // THROW
            if (Tokenizer.cse4(id, "h", "r", "o", "w")) {
              return TokenType.THROW;
            }
            break;
          case "y": // YIELD
            if (Tokenizer.cse4(id, "i", "e", "l", "d")) {
              return strict ? TokenType.FUTURE_STRICT_RESERVED_WORD : TokenType.YIELD;
            }
            break;
          case "s": // SUPER
            if (Tokenizer.cse4(id, "u", "p", "e", "r")) {
              return TokenType.FUTURE_RESERVED_WORD;
            }
            break;
          default:
            break;
        }
        break;
      case 6:
        switch (id.charAt(0)) {
          case "r":
            if (Tokenizer.cse5(id, "e", "t", "u", "r", "n")) {
              return TokenType.RETURN;
            }
            break;
          case "t":
            if (Tokenizer.cse5(id, "y", "p", "e", "o", "f")) {
              return TokenType.TYPEOF;
            }
            break;
          case "d":
            if (Tokenizer.cse5(id, "e", "l", "e", "t", "e")) {
              return TokenType.DELETE;
            }
            break;
          case "s":
            if (Tokenizer.cse5(id, "w", "i", "t", "c", "h")) {
              return TokenType.SWITCH;
            } else if (strict && Tokenizer.cse5(id, "t", "a", "t", "i", "c")) {
              return TokenType.FUTURE_STRICT_RESERVED_WORD;
            }
            break;
          case "e":
            if (Tokenizer.cse5(id, "x", "p", "o", "r", "t")) {
              return TokenType.FUTURE_RESERVED_WORD;
            }
            break;
          case "i":
            if (Tokenizer.cse5(id, "m", "p", "o", "r", "t")) {
              return TokenType.FUTURE_RESERVED_WORD;
            }
            break;
          case "p":
            if (strict && Tokenizer.cse5(id, "u", "b", "l", "i", "c")) {
              return TokenType.FUTURE_STRICT_RESERVED_WORD;
            }
            break;
          default:
            break;
        }
        break;
      case 7:
        switch (id.charAt(0)) {
          case "d": // default
            if (Tokenizer.cse6(id, "e", "f", "a", "u", "l", "t")) {
              return TokenType.DEFAULT;
            }
            break;
          case "f": // finally
            if (Tokenizer.cse6(id, "i", "n", "a", "l", "l", "y")) {
              return TokenType.FINALLY;
            }
            break;
          case "e": // extends
            if (Tokenizer.cse6(id, "x", "t", "e", "n", "d", "s")) {
              return TokenType.FUTURE_RESERVED_WORD;
            }
            break;
          case "p":
            if (strict) {
              let s = id;
              if ("private" === s || "package" === s) {
                return TokenType.FUTURE_STRICT_RESERVED_WORD;
              }
            }
            break;
          default:
            break;
        }
        break;
      case 8:
        switch (id.charAt(0)) {
          case "f":
            if (Tokenizer.cse7(id, "u", "n", "c", "t", "i", "o", "n")) {
              return TokenType.FUNCTION;
            }
            break;
          case "c":
            if (Tokenizer.cse7(id, "o", "n", "t", "i", "n", "u", "e")) {
              return TokenType.CONTINUE;
            }
            break;
          case "d":
            if (Tokenizer.cse7(id, "e", "b", "u", "g", "g", "e", "r")) {
              return TokenType.DEBUGGER;
            }
            break;
          default:
            break;
        }
        break;
      case 9:
        if (strict && (id.charAt(0) === "p" || id.charAt(0) === "i")) {
          let s = id;
          if ("protected" === s || "interface" === s) {
            return TokenType.FUTURE_STRICT_RESERVED_WORD;
          }
        }
        break;
      case 10:
      {
        let s = id;
        if ("instanceof" === s) {
          return TokenType.INSTANCEOF;
        } else if (strict && "implements" === s) {
          return TokenType.FUTURE_STRICT_RESERVED_WORD;
        }
      }
        break;
      default:
        break;
    }
    return TokenType.ILLEGAL;
  }

  skipSingleLineComment(offset) {
    this.index += offset;
    while (this.index < this.source.length) {
      /**
       * @type {Number}
       */
      let chCode = this.source.charCodeAt(this.index);
      this.index++;
      if (isLineTerminator(chCode)) {
        this.hasLineTerminatorBeforeNext = true;
        if (chCode === 0x000D /* "\r" */ && this.index < this.source.length && this.source.charCodeAt(this.index)
            === 0x000A /*"\n" */) {
          this.index++;
        }
        this.lineStarts.push(this.index);
        return;
      }
    }
  }

  skipMultiLineComment() {
    this.index += 2;
    let length = this.source.length;
    let i = this.index;
    while (i < length) {
      let chCode = this.source.charCodeAt(i);
      if (chCode < 0x80) {
        switch (chCode) {
          case 42:  // "*"
            // Block comment ends with "*/'.
            if (i + 1 < length && this.source.charAt(i + 1) === "/") {
              this.index = i + 2;
              return;
            }
            i++;
            break;
          case 10:  // "\n"
            this.hasLineTerminatorBeforeNext = true;
            i++;
            this.lineStarts.push(this.index);
            break;
          case 12: // "\r":
            this.hasLineTerminatorBeforeNext = true;
            if (i < length - 1 && this.source.charAt(i + 1) === "\n") {
              i++;
            }
            i++;
            this.lineStarts.push(this.index);
            break;
          default:
            i++;
        }
      } else if (chCode === 0x2028 || chCode === 0x2029) {
        i++;
        this.lineStarts.push(this.index);
      } else {
        i++;
      }
    }
    this.index = i;
    throw this.createILLEGAL();
  }


  skipComment() {
    let isLineStart = this.index === 0;
    let length = this.source.length;

    while (this.index < length) {
      let chCode = this.source.charCodeAt(this.index);
      if (isWhitespace(chCode)) {
        this.index++;
      } else if (isLineTerminator(chCode)) {
        this.hasLineTerminatorBeforeNext = true;
        this.index++;
        if (chCode === 13 /* "\r" */ && this.index < length && this.source.charAt(this.index) === "\n") {
          this.index++;
        }
        this.lineStarts.push(this.index);
        isLineStart = true;
      } else if (chCode === 47 /* "/" */) {
        if (this.index + 1 >= length) {
          break;
        }
        chCode = this.source.charCodeAt(this.index + 1);
        if (chCode === 47 /* "/" */) {
          this.skipSingleLineComment(2);
          isLineStart = true;
        } else if (chCode === 42 /* "*" */) {
          this.skipMultiLineComment();
        } else {
          break;
        }
      } else if (isLineStart && chCode === 45 /* "-" */) {
        if (this.index + 2 >= length) {
          break;
        }
        // U+003E is ">'
        if ((this.source.charAt(this.index + 1) === "-") && (this.source.charAt(this.index + 2) === ">")) {
          // "-->" is a single-line comment
          this.skipSingleLineComment(3);
        } else {
          break;
        }
      } else if (chCode === 60 /* "<" */) {
        if (this.index + 4 <= length && this.source.charAt(this.index + 1) === "!" && this.source.charAt(this.index + 2)
            === "-"
            && this.source.charAt(this.index + 3) === "-") {
          this.skipSingleLineComment(4);
        } else {
          break;
        }
      } else {
        break;
      }
    }
  }

  scanHexEscape4() {
    if (this.index + 4 > this.source.length) {
      return -1;
    }
    let r1 = getHexValue(this.source.charAt(this.index));
    if (r1 === -1) {
      return -1;
    }
    let r2 = getHexValue(this.source.charAt(this.index + 1));
    if (r2 === -1) {
      return -1;
    }
    let r3 = getHexValue(this.source.charAt(this.index + 2));
    if (r3 === -1) {
      return -1;
    }
    let r4 = getHexValue(this.source.charAt(this.index + 3));
    if (r4 === -1) {
      return -1;
    }
    this.index += 4;
    return r1 << 12 | r2 << 8 | r3 << 4 | r4;
  }

  scanHexEscape2() {
    if (this.index + 2 > this.source.length) {
      return -1;
    }
    let r1 = getHexValue(this.source.charAt(this.index));
    if (r1 === -1) {
      return -1;
    }
    let r2 = getHexValue(this.source.charAt(this.index + 1));
    if (r2 === -1) {
      return -1;
    }
    this.index += 2;
    return r1 << 4 | r2;
  }

  getEscapedIdentifier() {
    let ch = this.source.charAt(this.index);
    this.index++;
    if (this.index >= this.source.length) {
      throw this.createILLEGAL();
    }

    let id = "";

    if (ch === "\\") {
      if (this.source.charAt(this.index) !== "u") {
        throw this.createILLEGAL();
      }
      this.index++;
      if (this.index >= this.source.length) {
        throw this.createILLEGAL();
      }
      let ich = this.scanHexEscape4();
      if (ich < 0 || ich === 0x005C /* "\\" */  || !isIdentifierStart(ich)) {
        throw this.createILLEGAL();
      }
      ch = String.fromCharCode(ich);
    }
    id += ch;

    while (this.index < this.source.length) {
      ch = this.source.charAt(this.index);
      if (!isIdentifierPart(ch.charCodeAt(0)) && ch !== "\\") {
        break;
      }
      this.index++;
      if (ch === "\\") {
        if (this.index >= this.source.length) {
          throw this.createILLEGAL();
        }
        if (this.source.charAt(this.index) !== "u") {
          throw this.createILLEGAL();
        }
        this.index++;
        if (this.index >= this.source.length) {
          throw this.createILLEGAL();
        }
        let ich = this.scanHexEscape4();
        if (ich < 0 || ich === 0x005C /* "\\" */ || !isIdentifierPart(ich)) {
          throw this.createILLEGAL();
        }
        ch = String.fromCharCode(ich);
      }
      id += ch;
    }

    return id;
  }

  getIdentifier() {
    let start = this.index;
    this.index++;
    let l = this.source.length;
    let i = this.index;
    while (i < l) {
      let ch = this.source.charAt(i);
      if (ch === "\\") {
        // Go back and try the hard one.
        this.index = start;
        return this.getEscapedIdentifier();
      } else if (isIdentifierPart(ch.charCodeAt(0))) {
        i++;
      } else {
        break;
      }
    }
    this.index = i;
    return this.source.slice(start, this.index);
  }

  scanIdentifier() {
    let start = this.index;

    // Backslash (U+005C) starts an escaped character.
    let id = this.source.charAt(this.index) === "\\" ? this.getEscapedIdentifier() : this.getIdentifier();

    // There is no keyword or literal with only one character.
    // Thus, it must be an identifier.
    let slice = {text: id, start, end: this.index};
    if ((id.length === 1)) {
      return new IdentifierToken(slice);
    }

    let subType = Tokenizer.getKeyword(id, this.strict);
    if (subType !== TokenType.ILLEGAL) {
      return new KeywordToken(subType, slice);
    }

    if (id.length === 4) {
      if ("null" === id) {
        return new NullLiteralToken(slice);
      } else if ("true" === id) {
        return new TrueLiteralToken(slice);
      }
    }

    if (id.length === 5 && "false" === id) {
      return new FalseLiteralToken(slice);
    }

    return new IdentifierToken(slice);
  }

  getSlice(start) {
    return {text: this.source.slice(start, this.index), start: start, end: this.index};
  }

  scanPunctuatorHelper() {
    let ch1 = this.source.charAt(this.index);

    switch (ch1) {
      // Check for most common single-character punctuators.
      case ".":
        return TokenType.PERIOD;
      case "(":
        return TokenType.LPAREN;
      case ")":
      case ";":
      case ",":
        return ONE_CHAR_PUNCTUATOR[ch1.charCodeAt(0)];
      case "{":
        return TokenType.LBRACE;
      case "}":
      case "[":
      case "]":
      case ":":
      case "?":
      case "~":
        return ONE_CHAR_PUNCTUATOR[ch1.charCodeAt(0)];
      default:
        // "=" (U+003D) marks an assignment or comparison operator.
        if (this.index + 1 < this.source.length && this.source.charAt(this.index + 1) === "=") {
          switch (ch1) {
            case "=":
              if (this.index + 2 < this.source.length && this.source.charAt(this.index + 2) === "=") {
                return TokenType.EQ_STRICT;
              }
              return TokenType.EQ;
            case "!":
              if (this.index + 2 < this.source.length && this.source.charAt(this.index + 2) === "=") {
                return TokenType.NE_STRICT;
              }
              return TokenType.NE;
            case "|":
              return TokenType.ASSIGN_BIT_OR;
            case "+":
              return TokenType.ASSIGN_ADD;
            case "-":
              return TokenType.ASSIGN_SUB;
            case "*":
              return TokenType.ASSIGN_MUL;
            case "<":
              return TokenType.LTE;
            case ">":
              return TokenType.GTE;
            case "/":
              return TokenType.ASSIGN_DIV;
            case "%":
              return TokenType.ASSIGN_MOD;
            case "^":
              return TokenType.ASSIGN_BIT_XOR;
            case "&":
              return TokenType.ASSIGN_BIT_AND;
            default:
              break; //failed
          }
        }
    }

    if (this.index + 1 < this.source.length) {
      let ch2 = this.source.charAt(this.index + 1);
      if (ch1 === ch2) {
        if (this.index + 2 < this.source.length) {
          let ch3 = this.source.charAt(this.index + 2);
          if (ch1 === ">" && ch3 === ">") {
            // 4-character punctuator: >>>=
            if (this.index + 3 < this.source.length && this.source.charAt(this.index + 3) === "=") {
              return TokenType.ASSIGN_SHR_UNSIGNED;
            }
            return TokenType.SHR_UNSIGNED;
          }

          if (ch1 === "<" && ch3 === "=") {
            return TokenType.ASSIGN_SHL;
          }

          if (ch1 === ">" && ch3 === "=") {
            return TokenType.ASSIGN_SHR;
          }
        }
        // Other 2-character punctuators: ++ -- << >> && ||
        switch (ch1) {
          case "+":
            return TokenType.INC;
          case "-":
            return TokenType.DEC;
          case "<":
            return TokenType.SHL;
          case ">":
            return TokenType.SHR;
          case "&":
            return TokenType.AND;
          case "|":
            return TokenType.OR;
          default:
            break; //failed
        }
      }
    }

    return ONE_CHAR_PUNCTUATOR[ch1.charCodeAt(0)];
  }

  // 7.7 Punctuators
  scanPunctuator() {
    let start = this.index;
    let subType = this.scanPunctuatorHelper();
    this.index += subType.name.length;
    return new PunctuatorToken(subType, this.getSlice(start));
  }

  scanHexLiteral(start) {
    let i = this.index;
    while (i < this.source.length) {
      let ch = this.source.charAt(i);
      let hex = getHexValue(ch);
      if (hex === -1) {
        break;
      }
      i++;
    }

    if (this.index === i) {
      throw this.createILLEGAL();
    }

    if (i < this.source.length && isIdentifierStart(this.source.charCodeAt(i))) {
      throw this.createILLEGAL();
    }

    this.index = i;

    let slice = this.getSlice(start);
    return new NumericLiteralToken(slice, parseInt(slice.text.substr(2), 16));
  }

  scanOctalLiteral(start) {
    while (this.index < this.source.length) {
      let ch = this.source.charAt(this.index);
      if (!("0" <= ch && ch <= "7")) {
        break;
      }
      this.index++;
    }

    if (this.index < this.source.length && (isIdentifierStart(this.source.charCodeAt(this.index))
        || isDecimalDigit(this.source.charAt(this.index)))) {
      throw this.createILLEGAL();
    }

    return new NumericLiteralToken(this.getSlice(start), parseInt(this.getSlice(start).text.substr(1), 8), true);
  }

  scanNumericLiteral() {
    let ch = this.source.charAt(this.index);
    // assert(ch === "." || "0" <= ch && ch <= "9")
    let start = this.index;

    if (ch === "0") {
      this.index++;
      if (this.index < this.source.length) {
        ch = this.source.charAt(this.index);
        if (ch === "x" || ch === "X") {
          this.index++;
          return this.scanHexLiteral(start);
        } else if ("0" <= ch && ch <= "9") {
          return this.scanOctalLiteral(start);
        }
      } else {
        return new NumericLiteralToken(this.getSlice(start));
      }
    } else if (ch !== ".") {
      // Must be "1'..'9'
      ch = this.source.charAt(this.index);
      while ("0" <= ch && ch <= "9") {
        this.index++;
        if (this.index === this.source.length) {
          return new NumericLiteralToken(this.getSlice(start));
        }
        ch = this.source.charAt(this.index);
      }
    }

    let e = 0;
    if (ch === ".") {
      this.index++;
      if (this.index === this.source.length) {
        return new NumericLiteralToken(this.getSlice(start));
      }

      ch = this.source.charAt(this.index);
      while ("0" <= ch && ch <= "9") {
        e++;
        this.index++;
        if (this.index === this.source.length) {
          return new NumericLiteralToken(this.getSlice(start));
        }
        ch = this.source.charAt(this.index);
      }
    }

    // EOF not reached here
    if (ch === "e" || ch === "E") {
      this.index++;
      if (this.index === this.source.length) {
        throw this.createILLEGAL();
      }

      ch = this.source.charAt(this.index);
      let neg = false;
      if (ch === "+" || ch === "-") {
        neg = ch === "-";
        this.index++;
        if (this.index === this.source.length) {
          throw this.createILLEGAL();
        }
        ch = this.source.charAt(this.index);
      }

      let f = 0;
      if ("0" <= ch && ch <= "9") {
        while ("0" <= ch && ch <= "9") {
          f *= 10;
          f += +ch;
          this.index++;
          if (this.index === this.source.length) {
            break;
          }
          ch = this.source.charAt(this.index);
        }
      } else {
        throw this.createILLEGAL();
      }
      e += neg ? f : -f;
    }

    if (isIdentifierStart(ch.charCodeAt(0))) {
      throw this.createILLEGAL();
    }

    return new NumericLiteralToken(this.getSlice(start));
  }

  // 7.8.4 String Literals
  scanStringLiteral() {
    let str = "";

    let quote = this.source.charAt(this.index);
    //  assert((quote === "\"" || quote === """), "String literal must starts with a quote")

    let start = this.index;
    this.index++;

    let octal = false;
    while (this.index < this.source.length) {
      let ch = this.source.charAt(this.index);
      if (ch === quote) {
        this.index++;
        return new StringLiteralToken(this.getSlice(start), str, octal);
      } else if (ch === "\\") {
        this.index++;
        if (this.index === this.source.length) {
          throw this.createILLEGAL();
        }
        ch = this.source.charAt(this.index);
        if (!isLineTerminator(ch.charCodeAt(0))) {
          switch (ch) {
            case "n":
              str += "\n";
              this.index++;
              break;
            case "r":
              str += "\r";
              this.index++;
              break;
            case "t":
              str += "\t";
              this.index++;
              break;
            case "u":
            case "x":
              let restore = this.index;
              let unescaped;
              this.index++;
              if (this.index >= this.source.length) {
                throw this.createILLEGAL();
              }
              unescaped = ch === "u" ? this.scanHexEscape4() : this.scanHexEscape2();
              if (unescaped >= 0) {
                str += String.fromCharCode(unescaped);
              } else {
                this.index = restore;
                str += ch;
                this.index++;
              }
              break;
            case "b":
              str += "\b";
              this.index++;
              break;
            case "f":
              str += "\f";
              this.index++;
              break;
            case "v":
              str += "\u000B";
              this.index++;
              break;
            default:
              if ("0" <= ch && ch <= "7") {
                octal = true;
                let octLen = 1;
                // 3 digits are only allowed when string starts
                // with 0, 1, 2, 3
                if ("0" <= ch && ch <= "3") {
                  octLen = 0;
                }
                let code = 0;
                while (octLen < 3 && "0" <= ch && ch <= "7") {
                  code *= 8;
                  octLen++;
                  code += ch - "0";
                  this.index++;
                  if (this.index === this.source.length) {
                    throw this.createILLEGAL();
                  }
                  ch = this.source.charAt(this.index);
                }
                str += String.fromCharCode(code);
              } else {
                str += ch;
                this.index++;
              }
          }
        } else {
          this.hasLineTerminatorBeforeNext = true;
          this.index++;
          if (ch === "\r" && this.source.charAt(this.index) === "\n") {
            this.index++;
          }
        }
      } else if (isLineTerminator(ch.charCodeAt(0))) {
        throw this.createILLEGAL();
      } else {
        str += ch;
        this.index++;
      }
    }

    throw this.createILLEGAL();
  }

  scanRegExp() {

    let start = this.index;
    // ch = this.source.charAt(this.index)

    let str = "";
    str += "/";
    this.index++;

    let terminated = false;
    let classMarker = false;
    while (this.index < this.source.length) {
      let ch = this.source.charAt(this.index);
      if (ch === "\\") {
        str += ch;
        this.index++;
        ch = this.source.charAt(this.index);
        // ECMA-262 7.8.5
        if (isLineTerminator(ch.charCodeAt(0))) {
          throw this.createError(ErrorMessages.UNTERMINATED_REG_EXP);
        }
        str += ch;
        this.index++;
      } else if (isLineTerminator(ch.charCodeAt(0))) {
        throw this.createError(ErrorMessages.UNTERMINATED_REG_EXP);
      } else {
        if (classMarker) {
          if (ch === "]") {
            classMarker = false;
          }
        } else {
          if (ch === "/") {
            terminated = true;
            str += ch;
            this.index++;
            break;
          } else if (ch === "[") {
            classMarker = true;
          }
        }
        str += ch;
        this.index++;
      }
    }

    if (!terminated) {
      throw this.createError(ErrorMessages.UNTERMINATED_REG_EXP);
    }

    while (this.index < this.source.length) {
      let ch = this.source.charAt(this.index);
      if (!isIdentifierPart(ch.charCodeAt(0)) && ch !== "\\") {
        break;
      }
      this.index++;
      str += ch;
    }
    this.lookaheadEnd = this.index;
    return new RegularExpressionLiteralToken(this.getSlice(start), str);
  }

  advance() {
    let start = this.index;
    this.skipComment();
    this.lastWhitespace = this.getSlice(start);
    this.lookaheadStart =start = this.index;

    if (this.index >= this.source.length) {
      return new EOFToken(this.getSlice(start));
    }

    let charCode = this.source.charCodeAt(this.index);

    if (charCode < 0x80) {
      if (PUNCTUATOR_START[charCode]) {
        return this.scanPunctuator();
      }

      if (IDENTIFIER_START[charCode]) {
        return this.scanIdentifier();
      }

      // Dot (.) U+002E can also start a floating-polet number, hence the need
      // to check the next character.
      if (charCode === 0x002E) {
        if (this.index + 1 < this.source.length && isDecimalDigit(this.source.charAt(this.index + 1))) {
          return this.scanNumericLiteral();
        }
        return this.scanPunctuator();
      }

      // String literal starts with single quote (U+0027) or double quote (U+0022).
      if (charCode === 0x0027 || charCode === 0x0022) {
        return this.scanStringLiteral();
      }

      if (0x0030 /* '0' */ <= charCode && charCode <= 0x0039 /* '9' */) {
        return this.scanNumericLiteral();
      }

      // Slash (/) U+002F can also start a regex.
      throw this.createILLEGAL();
    } else {
      if (isIdentifierStart(charCode)) {
        return this.scanIdentifier();
      }

      throw this.createILLEGAL();
    }
  }

  eof() {
    return this.lookahead.type === TokenType.EOS;
  }

  lex() {
    if (this.prevToken !== null && this.prevToken.type === TokenType.EOS) {
      return this.prevToken;
    }
    this.prevToken = this.lookahead;
    let start = this.index = this.lookaheadEnd;
    this.hasLineTerminatorBeforeNext = false;
    this.lookahead = this.advance();
    this.lookaheadEnd = this.index;
    this.index = start;
    this.tokenIndex++;
    return this.prevToken;
  }
}
