"use strict";

var _extends = function (child, parent) {
  child.prototype = Object.create(parent.prototype, {
    constructor: {
      value: child,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  child.__proto__ = parent;
};

var _classProps = function (child, staticProps, instanceProps) {
  if (staticProps) Object.defineProperties(child, staticProps);
  if (instanceProps) Object.defineProperties(child.prototype, instanceProps);
};

var getHexValue = require("./utils").getHexValue;
var isLineTerminator = require("./utils").isLineTerminator;
var isWhitespace = require("./utils").isWhitespace;
var isIdentifierStart = require("./utils").isIdentifierStart;
var isIdentifierPart = require("./utils").isIdentifierPart;
var isDecimalDigit = require("./utils").isDecimalDigit;
var ErrorMessages = require("./errors").ErrorMessages;
var TokenClass = exports.TokenClass = {
  BooleanLiteral: { name: "Boolean" },
  Eof: { name: "<End>" },
  Ident: { name: "Identifier" },
  Keyword: { name: "Keyword" },
  NullLiteral: { name: "Null" },
  NumericLiteral: { name: "Numeric" },
  Punctuator: { name: "Punctuator" },
  StringLiteral: { name: "String" },
  RegularExpression: { name: "RegularExpression" },
  LineComment: { name: "Line" },
  BlockComment: { name: "Block" },
  Illegal: { name: "Illegal" }
};

var TokenType = exports.TokenType = {
  EOS: { klass: TokenClass.Eof, name: "EOS" },
  LPAREN: { klass: TokenClass.Punctuator, name: "(" },
  RPAREN: { klass: TokenClass.Punctuator, name: ")" },
  LBRACK: { klass: TokenClass.Punctuator, name: "[" },
  RBRACK: { klass: TokenClass.Punctuator, name: "]" },
  LBRACE: { klass: TokenClass.Punctuator, name: "{" },
  RBRACE: { klass: TokenClass.Punctuator, name: "}" },
  COLON: { klass: TokenClass.Punctuator, name: ":" },
  SEMICOLON: { klass: TokenClass.Punctuator, name: ";" },
  PERIOD: { klass: TokenClass.Punctuator, name: "." },
  ELLIPSIS: { klass: TokenClass.Punctuator, name: "..." },
  CONDITIONAL: { klass: TokenClass.Punctuator, name: "?" },
  INC: { klass: TokenClass.Punctuator, name: "++" },
  DEC: { klass: TokenClass.Punctuator, name: "--" },
  ASSIGN: { klass: TokenClass.Punctuator, name: "=" },
  ASSIGN_BIT_OR: { klass: TokenClass.Punctuator, name: "|=" },
  ASSIGN_BIT_XOR: { klass: TokenClass.Punctuator, name: "^=" },
  ASSIGN_BIT_AND: { klass: TokenClass.Punctuator, name: "&=" },
  ASSIGN_SHL: { klass: TokenClass.Punctuator, name: "<<=" },
  ASSIGN_SHR: { klass: TokenClass.Punctuator, name: ">>=" },
  ASSIGN_SHR_UNSIGNED: { klass: TokenClass.Punctuator, name: ">>>=" },
  ASSIGN_ADD: { klass: TokenClass.Punctuator, name: "+=" },
  ASSIGN_SUB: { klass: TokenClass.Punctuator, name: "-=" },
  ASSIGN_MUL: { klass: TokenClass.Punctuator, name: "*=" },
  ASSIGN_DIV: { klass: TokenClass.Punctuator, name: "/=" },
  ASSIGN_MOD: { klass: TokenClass.Punctuator, name: "%=" },
  COMMA: { klass: TokenClass.Punctuator, name: "," },
  OR: { klass: TokenClass.Punctuator, name: "||" },
  AND: { klass: TokenClass.Punctuator, name: "&&" },
  BIT_OR: { klass: TokenClass.Punctuator, name: "|" },
  BIT_XOR: { klass: TokenClass.Punctuator, name: "^" },
  BIT_AND: { klass: TokenClass.Punctuator, name: "&" },
  SHL: { klass: TokenClass.Punctuator, name: "<<" },
  SHR: { klass: TokenClass.Punctuator, name: ">>" },
  SHR_UNSIGNED: { klass: TokenClass.Punctuator, name: ">>>" },
  ADD: { klass: TokenClass.Punctuator, name: "+" },
  SUB: { klass: TokenClass.Punctuator, name: "-" },
  MUL: { klass: TokenClass.Punctuator, name: "*" },
  DIV: { klass: TokenClass.Punctuator, name: "/" },
  MOD: { klass: TokenClass.Punctuator, name: "%" },
  EQ: { klass: TokenClass.Punctuator, name: "==" },
  NE: { klass: TokenClass.Punctuator, name: "!=" },
  EQ_STRICT: { klass: TokenClass.Punctuator, name: "===" },
  NE_STRICT: { klass: TokenClass.Punctuator, name: "!==" },
  LT: { klass: TokenClass.Punctuator, name: "<" },
  GT: { klass: TokenClass.Punctuator, name: ">" },
  LTE: { klass: TokenClass.Punctuator, name: "<=" },
  GTE: { klass: TokenClass.Punctuator, name: ">=" },
  INSTANCEOF: { klass: TokenClass.Keyword, name: "instanceof" },
  IN: { klass: TokenClass.Keyword, name: "in" },
  NOT: { klass: TokenClass.Punctuator, name: "!" },
  BIT_NOT: { klass: TokenClass.Punctuator, name: "~" },
  DELETE: { klass: TokenClass.Keyword, name: "delete" },
  TYPEOF: { klass: TokenClass.Keyword, name: "typeof" },
  VOID: { klass: TokenClass.Keyword, name: "void" },
  BREAK: { klass: TokenClass.Keyword, name: "break" },
  CASE: { klass: TokenClass.Keyword, name: "case" },
  CATCH: { klass: TokenClass.Keyword, name: "catch" },
  CONTINUE: { klass: TokenClass.Keyword, name: "continue" },
  DEBUGGER: { klass: TokenClass.Keyword, name: "debugger" },
  DEFAULT: { klass: TokenClass.Keyword, name: "default" },
  DO: { klass: TokenClass.Keyword, name: "do" },
  ELSE: { klass: TokenClass.Keyword, name: "else" },
  FINALLY: { klass: TokenClass.Keyword, name: "finally" },
  FOR: { klass: TokenClass.Keyword, name: "for" },
  FUNCTION: { klass: TokenClass.Keyword, name: "function" },
  IF: { klass: TokenClass.Keyword, name: "if" },
  NEW: { klass: TokenClass.Keyword, name: "new" },
  RETURN: { klass: TokenClass.Keyword, name: "return" },
  SWITCH: { klass: TokenClass.Keyword, name: "switch" },
  THIS: { klass: TokenClass.Keyword, name: "this" },
  THROW: { klass: TokenClass.Keyword, name: "throw" },
  TRY: { klass: TokenClass.Keyword, name: "try" },
  VAR: { klass: TokenClass.Keyword, name: "var" },
  WHILE: { klass: TokenClass.Keyword, name: "while" },
  WITH: { klass: TokenClass.Keyword, name: "with" },
  NULL_LITERAL: { klass: TokenClass.NullLiteral, name: "null" },
  TRUE_LITERAL: { klass: TokenClass.BooleanLiteral, name: "true" },
  FALSE_LITERAL: { klass: TokenClass.BooleanLiteral, name: "false" },
  NUMBER: { klass: TokenClass.NumericLiteral, name: "" },
  STRING: { klass: TokenClass.StringLiteral, name: "" },
  REGEXP: { klass: TokenClass.RegularExpression, name: "" },
  IDENTIFIER: { klass: TokenClass.Ident, name: "" },
  FUTURE_RESERVED_WORD: { klass: TokenClass.Keyword, name: "" },
  FUTURE_STRICT_RESERVED_WORD: { klass: TokenClass.Keyword, name: "" },
  CONST: { klass: TokenClass.Keyword, name: "const" },
  LET: { klass: TokenClass.Keyword, name: "let" },
  ILLEGAL: { klass: TokenClass.Illegal, name: "" }
};

var TT = TokenType;
var I = TT.ILLEGAL;
var F = false;
var T = true;

var ONE_CHAR_PUNCTUATOR = [I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, TT.NOT, I, I, I, TT.MOD, TT.BIT_AND, I, TT.LPAREN, TT.RPAREN, TT.MUL, TT.ADD, TT.COMMA, TT.SUB, TT.PERIOD, TT.DIV, I, I, I, I, I, I, I, I, I, I, TT.COLON, TT.SEMICOLON, TT.LT, TT.ASSIGN, TT.GT, TT.CONDITIONAL, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, TT.LBRACK, I, TT.RBRACK, TT.BIT_XOR, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, I, TT.LBRACE, TT.BIT_OR, TT.RBRACE, TT.BIT_NOT];

var PUNCTUATOR_START = [F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, T, F, F, F, T, T, F, T, T, T, T, T, T, F, T, F, F, F, F, F, F, F, F, F, F, T, T, T, T, T, T, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, T, F, T, T, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, T, T, T, T, F];

var IDENTIFIER_START = [F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, T, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, F, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, F, T, F, F, T, F, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, T, F, F, F, F, F];

var Token = (function () {
  var Token = function Token(type, slice, octal) {
    this.type = type;
    this.slice = slice;
    this.octal = octal;
  };

  _classProps(Token, null, {
    value: {
      get: function () {}
    }
  });

  return Token;
})();

exports.Token = Token;
var IdentifierLikeToken = (function (Token) {
  var IdentifierLikeToken = function IdentifierLikeToken(type, slice) {
    Token.call(this, type, slice, false);
  };

  _extends(IdentifierLikeToken, Token);

  _classProps(IdentifierLikeToken, null, {
    value: {
      get: function () {
        return this.slice.text;
      }
    }
  });

  return IdentifierLikeToken;
})(Token);

exports.IdentifierLikeToken = IdentifierLikeToken;
var IdentifierToken = (function (IdentifierLikeToken) {
  var IdentifierToken = function IdentifierToken(slice) {
    IdentifierLikeToken.call(this, TokenType.IDENTIFIER, slice);
  };

  _extends(IdentifierToken, IdentifierLikeToken);

  return IdentifierToken;
})(IdentifierLikeToken);

exports.IdentifierToken = IdentifierToken;
var NullLiteralToken = (function (IdentifierLikeToken) {
  var NullLiteralToken = function NullLiteralToken(slice) {
    IdentifierLikeToken.call(this, TokenType.NULL_LITERAL, slice);
  };

  _extends(NullLiteralToken, IdentifierLikeToken);

  return NullLiteralToken;
})(IdentifierLikeToken);

exports.NullLiteralToken = NullLiteralToken;
var TrueLiteralToken = (function (IdentifierLikeToken) {
  var TrueLiteralToken = function TrueLiteralToken(slice) {
    IdentifierLikeToken.call(this, TokenType.TRUE_LITERAL, slice);
  };

  _extends(TrueLiteralToken, IdentifierLikeToken);

  return TrueLiteralToken;
})(IdentifierLikeToken);

exports.TrueLiteralToken = TrueLiteralToken;
var FalseLiteralToken = (function (IdentifierLikeToken) {
  var FalseLiteralToken = function FalseLiteralToken(slice) {
    IdentifierLikeToken.call(this, TokenType.FALSE_LITERAL, slice);
  };

  _extends(FalseLiteralToken, IdentifierLikeToken);

  return FalseLiteralToken;
})(IdentifierLikeToken);

exports.FalseLiteralToken = FalseLiteralToken;
var KeywordToken = (function (IdentifierLikeToken) {
  var KeywordToken = function KeywordToken(type, slice) {
    IdentifierLikeToken.call(this, type, slice);
  };

  _extends(KeywordToken, IdentifierLikeToken);

  return KeywordToken;
})(IdentifierLikeToken);

exports.KeywordToken = KeywordToken;
var PunctuatorToken = (function (Token) {
  var PunctuatorToken = function PunctuatorToken(type, slice) {
    Token.call(this, type, slice, false);
  };

  _extends(PunctuatorToken, Token);

  _classProps(PunctuatorToken, null, {
    value: {
      get: function () {
        return this.type.name;
      }
    }
  });

  return PunctuatorToken;
})(Token);

exports.PunctuatorToken = PunctuatorToken;
var RegularExpressionLiteralToken = (function (Token) {
  var RegularExpressionLiteralToken = function RegularExpressionLiteralToken(slice, value) {
    Token.call(this, TokenType.REGEXP, slice, false);
    this._value = value;
  };

  _extends(RegularExpressionLiteralToken, Token);

  _classProps(RegularExpressionLiteralToken, null, {
    value: {
      get: function () {
        return this._value;
      }
    }
  });

  return RegularExpressionLiteralToken;
})(Token);

exports.RegularExpressionLiteralToken = RegularExpressionLiteralToken;
var NumericLiteralToken = (function (Token) {
  var NumericLiteralToken = function NumericLiteralToken(slice, value, octal) {
    var _this = this;
    if (value === undefined) value = +slice.text;
    if (octal === undefined) octal = false;
    return (function () {
      Token.call(_this, TokenType.NUMBER, slice, octal);
      _this._value = value;
    })();
  };

  _extends(NumericLiteralToken, Token);

  _classProps(NumericLiteralToken, null, {
    value: {
      get: function () {
        return this._value.toString();
      }
    }
  });

  return NumericLiteralToken;
})(Token);

exports.NumericLiteralToken = NumericLiteralToken;
var StringLiteralToken = (function (Token) {
  var StringLiteralToken = function StringLiteralToken(slice, value, octal) {
    Token.call(this, TokenType.STRING, slice, octal);
    this._value = value;
  };

  _extends(StringLiteralToken, Token);

  _classProps(StringLiteralToken, null, {
    value: {
      get: function () {
        return this._value;
      }
    }
  });

  return StringLiteralToken;
})(Token);

exports.StringLiteralToken = StringLiteralToken;
var EOFToken = (function (Token) {
  var EOFToken = function EOFToken(slice) {
    Token.call(this, TokenType.EOS, slice, false);
  };

  _extends(EOFToken, Token);

  _classProps(EOFToken, null, {
    value: {
      get: function () {
        return "";
      }
    }
  });

  return EOFToken;
})(Token);

exports.EOFToken = EOFToken;
var JsError = (function (Error) {
  var JsError = function JsError(index, line, column, msg) {
    this.index = index;
    this.line = line;
    this.column = column;
    this.description = msg;
    this.message = "[" + line + ":" + column + "]: " + msg;
  };

  _extends(JsError, Error);

  return JsError;
})(Error);

exports.JsError = JsError;
var Tokenizer = (function () {
  var Tokenizer = function Tokenizer(source) {
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
  };

  Tokenizer.prototype.trackBackLineNumber = function (position) {
    for (var line = this.lineStarts.length - 1; line >= 0; line--) {
      if ((position >= this.getLineStart(line))) {
        return line;
      }
    }
    return 0;
  };

  Tokenizer.prototype.createILLEGAL = function () {
    return this.createError(ErrorMessages.UNEXPECTED_ILLEGAL_TOKEN);
  };

  Tokenizer.prototype.createUnexpected = function (token) {
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
  };

  Tokenizer.prototype.createError = function (message, arg) {
    var msg = message.replace(/{(\d+)}/g, function () {
      return arg;
    });
    var index = this.index;
    var line = this.trackBackLineNumber(index);
    return new JsError(index, line + 1, index - this.getLineStart(line) + 1, msg);
  };

  Tokenizer.prototype.createErrorWithToken = function (token, message, arg) {
    var msg = message.replace(/{(\d+)}/g, function () {
      return arg;
    });
    var index = token.slice.start;
    var line = this.trackBackLineNumber(index);
    return new JsError(index, line + 1, index - this.getLineStart(line) + 1, msg);
  };

  Tokenizer.prototype.getLineStart = function (line) {
    return this.lineStarts[line];
  };

  Tokenizer.cse2 = function (id, ch1, ch2) {
    return id.charAt(1) === ch1 && id.charAt(2) === ch2;
  };

  Tokenizer.cse3 = function (id, ch1, ch2, ch3) {
    return id.charAt(1) === ch1 && id.charAt(2) === ch2 && id.charAt(3) === ch3;
  };

  Tokenizer.cse4 = function (id, ch1, ch2, ch3, ch4) {
    return id.charAt(1) === ch1 && id.charAt(2) === ch2 && id.charAt(3) === ch3 && id.charAt(4) === ch4;
  };

  Tokenizer.cse5 = function (id, ch1, ch2, ch3, ch4, ch5) {
    return id.charAt(1) === ch1 && id.charAt(2) === ch2 && id.charAt(3) === ch3 && id.charAt(4) === ch4 && id.charAt(5) === ch5;
  };

  Tokenizer.cse6 = function (id, ch1, ch2, ch3, ch4, ch5, ch6) {
    return id.charAt(1) === ch1 && id.charAt(2) === ch2 && id.charAt(3) === ch3 && id.charAt(4) === ch4 && id.charAt(5) === ch5 && id.charAt(6) === ch6;
  };

  Tokenizer.cse7 = function (id, ch1, ch2, ch3, ch4, ch5, ch6, ch7) {
    return id.charAt(1) === ch1 && id.charAt(2) === ch2 && id.charAt(3) === ch3 && id.charAt(4) === ch4 && id.charAt(5) === ch5 && id.charAt(6) === ch6 && id.charAt(7) === ch7;
  };

  Tokenizer.getKeyword = function (id, strict) {
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
              return strict ? TokenType.FUTURE_STRICT_RESERVED_WORD : TokenType.ILLEGAL;
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
              var s = id;
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
          var s = id;
          if ("protected" === s || "interface" === s) {
            return TokenType.FUTURE_STRICT_RESERVED_WORD;
          }
        }
        break;
      case 10:
        {
          var s = id;
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
  };

  Tokenizer.prototype.skipSingleLineComment = function (offset) {
    this.index += offset;
    while (this.index < this.source.length) {
      /**
       * @type {Number}
       */
      var chCode = this.source.charCodeAt(this.index);
      this.index++;
      if (isLineTerminator(chCode)) {
        this.hasLineTerminatorBeforeNext = true;
        if (chCode === 13 /* "\r" */ && this.index < this.source.length && this.source.charCodeAt(this.index) === 10 /*"\n" */) {
          this.index++;
        }
        this.lineStarts.push(this.index);
        return;
      }
    }
  };

  Tokenizer.prototype.skipMultiLineComment = function () {
    this.index += 2;
    var length = this.source.length;
    var i = this.index;
    while (i < length) {
      var chCode = this.source.charCodeAt(i);
      if (chCode < 128) {
        switch (chCode) {
          case 42: // "*"
            // Block comment ends with "*/'.
            if (i + 1 < length && this.source.charAt(i + 1) === "/") {
              this.index = i + 2;
              return;
            }
            i++;
            break;
          case 10: // "\n"
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
      } else if (chCode === 8232 || chCode === 8233) {
        i++;
        this.lineStarts.push(this.index);
      } else {
        i++;
      }
    }
    this.index = i;
    throw this.createILLEGAL();
  };

  Tokenizer.prototype.skipComment = function () {
    var isLineStart = this.index === 0;
    var length = this.source.length;

    while (this.index < length) {
      var chCode = this.source.charCodeAt(this.index);
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
        if (this.index + 4 <= length && this.source.charAt(this.index + 1) === "!" && this.source.charAt(this.index + 2) === "-" && this.source.charAt(this.index + 3) === "-") {
          this.skipSingleLineComment(4);
        } else {
          break;
        }
      } else {
        break;
      }
    }
  };

  Tokenizer.prototype.scanHexEscape4 = function () {
    if (this.index + 4 > this.source.length) {
      return -1;
    }
    var r1 = getHexValue(this.source.charAt(this.index));
    if (r1 === -1) {
      return -1;
    }
    var r2 = getHexValue(this.source.charAt(this.index + 1));
    if (r2 === -1) {
      return -1;
    }
    var r3 = getHexValue(this.source.charAt(this.index + 2));
    if (r3 === -1) {
      return -1;
    }
    var r4 = getHexValue(this.source.charAt(this.index + 3));
    if (r4 === -1) {
      return -1;
    }
    this.index += 4;
    return r1 << 12 | r2 << 8 | r3 << 4 | r4;
  };

  Tokenizer.prototype.scanHexEscape2 = function () {
    if (this.index + 2 > this.source.length) {
      return -1;
    }
    var r1 = getHexValue(this.source.charAt(this.index));
    if (r1 === -1) {
      return -1;
    }
    var r2 = getHexValue(this.source.charAt(this.index + 1));
    if (r2 === -1) {
      return -1;
    }
    this.index += 2;
    return r1 << 4 | r2;
  };

  Tokenizer.prototype.getEscapedIdentifier = function () {
    var ch = this.source.charAt(this.index);
    this.index++;
    if (this.index >= this.source.length) {
      throw this.createILLEGAL();
    }

    var id = "";

    if (ch === "\\") {
      if (this.source.charAt(this.index) !== "u") {
        throw this.createILLEGAL();
      }
      this.index++;
      if (this.index >= this.source.length) {
        throw this.createILLEGAL();
      }
      var ich = this.scanHexEscape4();
      if (ich < 0 || ich === 92 /* "\\" */ || !isIdentifierStart(ich)) {
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
        var ich = this.scanHexEscape4();
        if (ich < 0 || ich === 92 /* "\\" */ || !isIdentifierPart(ich)) {
          throw this.createILLEGAL();
        }
        ch = String.fromCharCode(ich);
      }
      id += ch;
    }

    return id;
  };

  Tokenizer.prototype.getIdentifier = function () {
    var start = this.index;
    this.index++;
    var l = this.source.length;
    var i = this.index;
    while (i < l) {
      var ch = this.source.charAt(i);
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
  };

  Tokenizer.prototype.scanIdentifier = function () {
    var start = this.index;

    // Backslash (U+005C) starts an escaped character.
    var id = this.source.charAt(this.index) === "\\" ? this.getEscapedIdentifier() : this.getIdentifier();

    // There is no keyword or literal with only one character.
    // Thus, it must be an identifier.
    var slice = { text: id, start: start, end: this.index };
    if ((id.length === 1)) {
      return new IdentifierToken(slice);
    }

    var subType = Tokenizer.getKeyword(id, this.strict);
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
  };

  Tokenizer.prototype.getSlice = function (start) {
    return { text: this.source.slice(start, this.index), start: start, end: this.index };
  };

  Tokenizer.prototype.scanPunctuatorHelper = function () {
    var ch1 = this.source.charAt(this.index);

    switch (ch1) {
      // Check for most common single-character punctuators.
      case ".":
        var ch2 = this.source.charAt(this.index + 1);
        if (ch2 !== ".") return TokenType.PERIOD;
        var ch3 = this.source.charAt(this.index + 2);
        if (ch3 !== ".") return TokenType.PERIOD;
        return TokenType.ELLIPSIS;
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
      var _ch2 = this.source.charAt(this.index + 1);
      if (ch1 === _ch2) {
        if (this.index + 2 < this.source.length) {
          var _ch3 = this.source.charAt(this.index + 2);
          if (ch1 === ">" && _ch3 === ">") {
            // 4-character punctuator: >>>=
            if (this.index + 3 < this.source.length && this.source.charAt(this.index + 3) === "=") {
              return TokenType.ASSIGN_SHR_UNSIGNED;
            }
            return TokenType.SHR_UNSIGNED;
          }

          if (ch1 === "<" && _ch3 === "=") {
            return TokenType.ASSIGN_SHL;
          }

          if (ch1 === ">" && _ch3 === "=") {
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
  };

  Tokenizer.prototype.scanPunctuator = function () {
    var start = this.index;
    var subType = this.scanPunctuatorHelper();
    this.index += subType.name.length;
    return new PunctuatorToken(subType, this.getSlice(start));
  };

  Tokenizer.prototype.scanHexLiteral = function (start) {
    var i = this.index;
    while (i < this.source.length) {
      var ch = this.source.charAt(i);
      var hex = getHexValue(ch);
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

    var slice = this.getSlice(start);
    return new NumericLiteralToken(slice, parseInt(slice.text.substr(2), 16));
  };

  Tokenizer.prototype.scanBinaryLiteral = function (start) {
    var offset = this.index - start;

    while (this.index < this.source.length) {
      var ch = this.source.charAt(this.index);
      if (ch !== "0" && ch !== "1") {
        break;
      }
      this.index++;
    }

    if (this.index - start <= offset) {
      throw this.createILLEGAL();
    }

    if (this.index < this.source.length && (isIdentifierStart(this.source.charCodeAt(this.index)) || isDecimalDigit(this.source.charAt(this.index)))) {
      throw this.createILLEGAL();
    }

    return new NumericLiteralToken(this.getSlice(start), parseInt(this.getSlice(start).text.substr(offset), 2), true);
  };

  Tokenizer.prototype.scanOctalLiteral = function (start) {
    var offset = this.index - start;

    while (this.index < this.source.length) {
      var ch = this.source.charAt(this.index);
      if (!("0" <= ch && ch <= "7")) {
        break;
      }
      this.index++;
    }

    if (offset === 2 && this.index - start === 2) {
      throw this.createILLEGAL();
    }

    if (this.index < this.source.length && (isIdentifierStart(this.source.charCodeAt(this.index)) || isDecimalDigit(this.source.charAt(this.index)))) {
      throw this.createILLEGAL();
    }

    return new NumericLiteralToken(this.getSlice(start), parseInt(this.getSlice(start).text.substr(offset), 8), true);
  };

  Tokenizer.prototype.scanNumericLiteral = function () {
    var ch = this.source.charAt(this.index);
    // assert(ch === "." || "0" <= ch && ch <= "9")
    var start = this.index;

    if (ch === "0") {
      this.index++;
      if (this.index < this.source.length) {
        ch = this.source.charAt(this.index);
        if (ch === "x" || ch === "X") {
          this.index++;
          return this.scanHexLiteral(start);
        } else if (ch === "b" || ch === "B") {
          this.index++;
          return this.scanBinaryLiteral(start);
        } else if (ch === "o" || ch === "O") {
          this.index++;
          return this.scanOctalLiteral(start);
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

    var e = 0;
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
      var neg = false;
      if (ch === "+" || ch === "-") {
        neg = ch === "-";
        this.index++;
        if (this.index === this.source.length) {
          throw this.createILLEGAL();
        }
        ch = this.source.charAt(this.index);
      }

      var f = 0;
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
  };

  Tokenizer.prototype.scanStringLiteral = function () {
    var str = "";

    var quote = this.source.charAt(this.index);
    //  assert((quote === "\"" || quote === """), "String literal must starts with a quote")

    var start = this.index;
    this.index++;

    var octal = false;
    while (this.index < this.source.length) {
      var ch = this.source.charAt(this.index);
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
              var restore = this.index;
              var unescaped = undefined;
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
              str += "\u000b";
              this.index++;
              break;
            default:
              if ("0" <= ch && ch <= "7") {
                octal = true;
                var octLen = 1;
                // 3 digits are only allowed when string starts
                // with 0, 1, 2, 3
                if ("0" <= ch && ch <= "3") {
                  octLen = 0;
                }
                var code = 0;
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
  };

  Tokenizer.prototype.scanRegExp = function () {
    var start = this.index;
    // ch = this.source.charAt(this.index)

    var str = "";
    str += "/";
    this.index++;

    var terminated = false;
    var classMarker = false;
    while (this.index < this.source.length) {
      var ch = this.source.charAt(this.index);
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
      var ch = this.source.charAt(this.index);
      if (!isIdentifierPart(ch.charCodeAt(0)) && ch !== "\\") {
        break;
      }
      this.index++;
      str += ch;
    }
    this.lookaheadEnd = this.index;
    return new RegularExpressionLiteralToken(this.getSlice(start), str);
  };

  Tokenizer.prototype.advance = function () {
    var start = this.index;
    this.skipComment();
    this.lastWhitespace = this.getSlice(start);
    this.lookaheadStart = start = this.index;

    if (this.index >= this.source.length) {
      return new EOFToken(this.getSlice(start));
    }

    var charCode = this.source.charCodeAt(this.index);

    if (charCode < 128) {
      if (PUNCTUATOR_START[charCode]) {
        return this.scanPunctuator();
      }

      if (IDENTIFIER_START[charCode]) {
        return this.scanIdentifier();
      }

      // Dot (.) U+002E can also start a floating-polet number, hence the need
      // to check the next character.
      if (charCode === 46) {
        if (this.index + 1 < this.source.length && isDecimalDigit(this.source.charAt(this.index + 1))) {
          return this.scanNumericLiteral();
        }
        return this.scanPunctuator();
      }

      // String literal starts with single quote (U+0027) or double quote (U+0022).
      if (charCode === 39 || charCode === 34) {
        return this.scanStringLiteral();
      }

      if (48 /* '0' */ <= charCode && charCode <= 57 /* '9' */) {
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
  };

  Tokenizer.prototype.eof = function () {
    return this.lookahead.type === TokenType.EOS;
  };

  Tokenizer.prototype.lex = function () {
    if (this.prevToken !== null && this.prevToken.type === TokenType.EOS) {
      return this.prevToken;
    }
    this.prevToken = this.lookahead;
    var start = this.index = this.lookaheadEnd;
    this.hasLineTerminatorBeforeNext = false;
    this.lookahead = this.advance();
    this.lookaheadEnd = this.index;
    this.index = start;
    this.tokenIndex++;
    return this.prevToken;
  };

  return Tokenizer;
})();

exports["default"] = Tokenizer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy90b2tlbml6ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQWlCUSxXQUFXLHNCQUFYLFdBQVc7SUFBRSxnQkFBZ0Isc0JBQWhCLGdCQUFnQjtJQUFFLFlBQVksc0JBQVosWUFBWTtJQUFFLGlCQUFpQixzQkFBakIsaUJBQWlCO0lBQUUsZ0JBQWdCLHNCQUFoQixnQkFBZ0I7SUFBRSxjQUFjLHNCQUFkLGNBQWM7SUFDaEcsYUFBYSx1QkFBYixhQUFhO0FBRWQsSUFBTSxVQUFVLFdBQVYsVUFBVSxHQUFHO0FBQ3hCLGdCQUFjLEVBQUUsRUFBQyxJQUFJLEVBQUUsU0FBUyxFQUFDO0FBQ2pDLEtBQUcsRUFBRSxFQUFDLElBQUksRUFBRSxPQUFPLEVBQUM7QUFDcEIsT0FBSyxFQUFFLEVBQUMsSUFBSSxFQUFFLFlBQVksRUFBQztBQUMzQixTQUFPLEVBQUUsRUFBQyxJQUFJLEVBQUUsU0FBUyxFQUFDO0FBQzFCLGFBQVcsRUFBRSxFQUFDLElBQUksRUFBRSxNQUFNLEVBQUM7QUFDM0IsZ0JBQWMsRUFBRSxFQUFDLElBQUksRUFBRSxTQUFTLEVBQUM7QUFDakMsWUFBVSxFQUFFLEVBQUMsSUFBSSxFQUFFLFlBQVksRUFBQztBQUNoQyxlQUFhLEVBQUUsRUFBQyxJQUFJLEVBQUUsUUFBUSxFQUFDO0FBQy9CLG1CQUFpQixFQUFFLEVBQUMsSUFBSSxFQUFFLG1CQUFtQixFQUFDO0FBQzlDLGFBQVcsRUFBRSxFQUFDLElBQUksRUFBRSxNQUFNLEVBQUM7QUFDM0IsY0FBWSxFQUFFLEVBQUMsSUFBSSxFQUFFLE9BQU8sRUFBQztBQUM3QixTQUFPLEVBQUUsRUFBQyxJQUFJLEVBQUUsU0FBUyxFQUFDO0NBQzNCLENBQUM7O0FBRUssSUFBTSxTQUFTLFdBQVQsU0FBUyxHQUFHO0FBQ3ZCLEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUM7QUFDekMsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNqRCxRQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ2pELFFBQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDakQsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNqRCxRQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ2pELFFBQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDakQsT0FBSyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNoRCxXQUFTLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ3BELFFBQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDakQsVUFBUSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBQztBQUNyRCxhQUFXLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ3RELEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDL0MsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUMvQyxRQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ2pELGVBQWEsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDekQsZ0JBQWMsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDMUQsZ0JBQWMsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDMUQsWUFBVSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBQztBQUN2RCxZQUFVLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFDO0FBQ3ZELHFCQUFtQixFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBQztBQUNqRSxZQUFVLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQ3RELFlBQVUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDdEQsWUFBVSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUN0RCxZQUFVLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQ3RELFlBQVUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDdEQsT0FBSyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNoRCxJQUFFLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQzlDLEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDL0MsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUNqRCxTQUFPLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ2xELFNBQU8sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDbEQsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUMvQyxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQy9DLGNBQVksRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUM7QUFDekQsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUM5QyxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQzlDLEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUM7QUFDOUMsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUM5QyxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQzlDLElBQUUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDOUMsSUFBRSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUM5QyxXQUFTLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFDO0FBQ3RELFdBQVMsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUM7QUFDdEQsSUFBRSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUM3QyxJQUFFLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQzdDLEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDL0MsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQztBQUMvQyxZQUFVLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFDO0FBQzNELElBQUUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDM0MsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUM5QyxTQUFPLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQ2xELFFBQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUM7QUFDbkQsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBQztBQUNuRCxNQUFJLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFDO0FBQy9DLE9BQUssRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUM7QUFDakQsTUFBSSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBQztBQUMvQyxPQUFLLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFDO0FBQ2pELFVBQVEsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUM7QUFDdkQsVUFBUSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBQztBQUN2RCxTQUFPLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFDO0FBQ3JELElBQUUsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDM0MsTUFBSSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBQztBQUMvQyxTQUFPLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFDO0FBQ3JELEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUM7QUFDN0MsVUFBUSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBQztBQUN2RCxJQUFFLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQzNDLEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUM7QUFDN0MsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBQztBQUNuRCxRQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFDO0FBQ25ELE1BQUksRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUM7QUFDL0MsT0FBSyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBQztBQUNqRCxLQUFHLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFDO0FBQzdDLEtBQUcsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUM7QUFDN0MsT0FBSyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBQztBQUNqRCxNQUFJLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFDO0FBQy9DLGNBQVksRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsV0FBVyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUM7QUFDM0QsY0FBWSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxjQUFjLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBQztBQUM5RCxlQUFhLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLGNBQWMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFDO0FBQ2hFLFFBQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsY0FBYyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUM7QUFDcEQsUUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxhQUFhLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBQztBQUNuRCxRQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLGlCQUFpQixFQUFFLElBQUksRUFBRSxFQUFFLEVBQUM7QUFDdkQsWUFBVSxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBQztBQUMvQyxzQkFBb0IsRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUM7QUFDM0QsNkJBQTJCLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFDO0FBQ2xFLE9BQUssRUFBRSxFQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUM7QUFDakQsS0FBRyxFQUFFLEVBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBQztBQUM3QyxTQUFPLEVBQUUsRUFBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFDO0NBQy9DLENBQUM7O0FBRUYsSUFBTSxFQUFFLEdBQUcsU0FBUyxDQUFDO0FBQ3JCLElBQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUM7QUFDckIsSUFBTSxDQUFDLEdBQUcsS0FBSyxDQUFDO0FBQ2hCLElBQU0sQ0FBQyxHQUFHLElBQUksQ0FBQzs7QUFFZixJQUFNLG1CQUFtQixHQUFHLENBQzFCLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQ2xILEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFDckgsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQ3JILENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFDcEgsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsQ0FBQzs7QUFFdEYsSUFBTSxnQkFBZ0IsR0FBRyxDQUN2QixDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFDbkgsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQ25ILENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUNuSCxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7O0FBRW5DLElBQU0sZ0JBQWdCLEdBQUcsQ0FDdkIsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQ25ILENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUs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QUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUU7QUFDNUMsV0FBTyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUMzRyxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUM7R0FDckM7O0FBN0ZHLFdBQVMsQ0ErRk4sSUFBSSxHQUFBLFVBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRTtBQUNqRCxXQUFPLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEtBQzNHLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQztHQUM3RDs7QUFsR0csV0FBUyxDQW9HTixVQUFVLEdBQUEsVUFBQyxFQUFFLEVBQUUsTUFBTSxFQUFFOzs7OztBQUs1QixRQUFJLEVBQUUsQ0FBQyxNQUFNLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNLEdBQUcs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O0FBQ3pDLFFBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ2hDLFFBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztBQUMvQixRQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztBQUNuQixRQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDbEIsV0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDO0dBQ3ZCOztTQXRuQ0csU0FBUzs7O3FCQUFULFNBQVMiLCJmaWxlIjoic3JjL3Rva2VuaXplci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29weXJpZ2h0IDIwMTQgU2hhcGUgU2VjdXJpdHksIEluYy5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpXG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5cbmltcG9ydCB7Z2V0SGV4VmFsdWUsIGlzTGluZVRlcm1pbmF0b3IsIGlzV2hpdGVzcGFjZSwgaXNJZGVudGlmaWVyU3RhcnQsIGlzSWRlbnRpZmllclBhcnQsIGlzRGVjaW1hbERpZ2l0fSBmcm9tIFwiLi91dGlsc1wiO1xuaW1wb3J0IHtFcnJvck1lc3NhZ2VzfSBmcm9tIFwiLi9lcnJvcnNcIjtcblxuZXhwb3J0IGNvbnN0IFRva2VuQ2xhc3MgPSB7XG4gIEJvb2xlYW5MaXRlcmFsOiB7bmFtZTogXCJCb29sZWFuXCJ9LFxuICBFb2Y6IHtuYW1lOiBcIjxFbmQ+XCJ9LFxuICBJZGVudDoge25hbWU6IFwiSWRlbnRpZmllclwifSxcbiAgS2V5d29yZDoge25hbWU6IFwiS2V5d29yZFwifSxcbiAgTnVsbExpdGVyYWw6IHtuYW1lOiBcIk51bGxcIn0sXG4gIE51bWVyaWNMaXRlcmFsOiB7bmFtZTogXCJOdW1lcmljXCJ9LFxuICBQdW5jdHVhdG9yOiB7bmFtZTogXCJQdW5jdHVhdG9yXCJ9LFxuICBTdHJpbmdMaXRlcmFsOiB7bmFtZTogXCJTdHJpbmdcIn0sXG4gIFJlZ3VsYXJFeHByZXNzaW9uOiB7bmFtZTogXCJSZWd1bGFyRXhwcmVzc2lvblwifSxcbiAgTGluZUNvbW1lbnQ6IHtuYW1lOiBcIkxpbmVcIn0sXG4gIEJsb2NrQ29tbWVudDoge25hbWU6IFwiQmxvY2tcIn0sXG4gIElsbGVnYWw6IHtuYW1lOiBcIklsbGVnYWxcIn1cbn07XG5cbmV4cG9ydCBjb25zdCBUb2tlblR5cGUgPSB7XG4gIEVPUzoge2tsYXNzOiBUb2tlbkNsYXNzLkVvZiwgbmFtZTogXCJFT1NcIn0sXG4gIExQQVJFTjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiKFwifSxcbiAgUlBBUkVOOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIpXCJ9LFxuICBMQlJBQ0s6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIltcIn0sXG4gIFJCUkFDSzoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiXVwifSxcbiAgTEJSQUNFOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCJ7XCJ9LFxuICBSQlJBQ0U6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIn1cIn0sXG4gIENPTE9OOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI6XCJ9LFxuICBTRU1JQ09MT046IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIjtcIn0sXG4gIFBFUklPRDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiLlwifSxcbiAgRUxMSVBTSVM6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIi4uLlwifSxcbiAgQ09ORElUSU9OQUw6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIj9cIn0sXG4gIElOQzoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiKytcIn0sXG4gIERFQzoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiLS1cIn0sXG4gIEFTU0lHTjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiPVwifSxcbiAgQVNTSUdOX0JJVF9PUjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwifD1cIn0sXG4gIEFTU0lHTl9CSVRfWE9SOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCJePVwifSxcbiAgQVNTSUdOX0JJVF9BTkQ6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIiY9XCJ9LFxuICBBU1NJR05fU0hMOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI8PD1cIn0sXG4gIEFTU0lHTl9TSFI6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIj4+PVwifSxcbiAgQVNTSUdOX1NIUl9VTlNJR05FRDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiPj4+PVwifSxcbiAgQVNTSUdOX0FERDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiKz1cIn0sXG4gIEFTU0lHTl9TVUI6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIi09XCJ9LFxuICBBU1NJR05fTVVMOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIqPVwifSxcbiAgQVNTSUdOX0RJVjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiLz1cIn0sXG4gIEFTU0lHTl9NT0Q6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIiU9XCJ9LFxuICBDT01NQToge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiLFwifSxcbiAgT1I6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcInx8XCJ9LFxuICBBTkQ6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIiYmXCJ9LFxuICBCSVRfT1I6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcInxcIn0sXG4gIEJJVF9YT1I6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIl5cIn0sXG4gIEJJVF9BTkQ6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIiZcIn0sXG4gIFNITDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiPDxcIn0sXG4gIFNIUjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiPj5cIn0sXG4gIFNIUl9VTlNJR05FRDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiPj4+XCJ9LFxuICBBREQ6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIitcIn0sXG4gIFNVQjoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiLVwifSxcbiAgTVVMOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCIqXCJ9LFxuICBESVY6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIi9cIn0sXG4gIE1PRDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiJVwifSxcbiAgRVE6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIj09XCJ9LFxuICBORToge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiIT1cIn0sXG4gIEVRX1NUUklDVDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiPT09XCJ9LFxuICBORV9TVFJJQ1Q6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIiE9PVwifSxcbiAgTFQ6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIjxcIn0sXG4gIEdUOiB7a2xhc3M6IFRva2VuQ2xhc3MuUHVuY3R1YXRvciwgbmFtZTogXCI+XCJ9LFxuICBMVEU6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIjw9XCJ9LFxuICBHVEU6IHtrbGFzczogVG9rZW5DbGFzcy5QdW5jdHVhdG9yLCBuYW1lOiBcIj49XCJ9LFxuICBJTlNUQU5DRU9GOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJpbnN0YW5jZW9mXCJ9LFxuICBJTjoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiaW5cIn0sXG4gIE5PVDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiIVwifSxcbiAgQklUX05PVDoge2tsYXNzOiBUb2tlbkNsYXNzLlB1bmN0dWF0b3IsIG5hbWU6IFwiflwifSxcbiAgREVMRVRFOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJkZWxldGVcIn0sXG4gIFRZUEVPRjoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwidHlwZW9mXCJ9LFxuICBWT0lEOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJ2b2lkXCJ9LFxuICBCUkVBSzoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiYnJlYWtcIn0sXG4gIENBU0U6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImNhc2VcIn0sXG4gIENBVENIOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJjYXRjaFwifSxcbiAgQ09OVElOVUU6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImNvbnRpbnVlXCJ9LFxuICBERUJVR0dFUjoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiZGVidWdnZXJcIn0sXG4gIERFRkFVTFQ6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImRlZmF1bHRcIn0sXG4gIERPOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJkb1wifSxcbiAgRUxTRToge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiZWxzZVwifSxcbiAgRklOQUxMWToge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwiZmluYWxseVwifSxcbiAgRk9SOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJmb3JcIn0sXG4gIEZVTkNUSU9OOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJmdW5jdGlvblwifSxcbiAgSUY6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcImlmXCJ9LFxuICBORVc6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcIm5ld1wifSxcbiAgUkVUVVJOOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJyZXR1cm5cIn0sXG4gIFNXSVRDSDoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwic3dpdGNoXCJ9LFxuICBUSElTOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJ0aGlzXCJ9LFxuICBUSFJPVzoge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwidGhyb3dcIn0sXG4gIFRSWToge2tsYXNzOiBUb2tlbkNsYXNzLktleXdvcmQsIG5hbWU6IFwidHJ5XCJ9LFxuICBWQVI6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcInZhclwifSxcbiAgV0hJTEU6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcIndoaWxlXCJ9LFxuICBXSVRIOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJ3aXRoXCJ9LFxuICBOVUxMX0xJVEVSQUw6IHtrbGFzczogVG9rZW5DbGFzcy5OdWxsTGl0ZXJhbCwgbmFtZTogXCJudWxsXCJ9LFxuICBUUlVFX0xJVEVSQUw6IHtrbGFzczogVG9rZW5DbGFzcy5Cb29sZWFuTGl0ZXJhbCwgbmFtZTogXCJ0cnVlXCJ9LFxuICBGQUxTRV9MSVRFUkFMOiB7a2xhc3M6IFRva2VuQ2xhc3MuQm9vbGVhbkxpdGVyYWwsIG5hbWU6IFwiZmFsc2VcIn0sXG4gIE5VTUJFUjoge2tsYXNzOiBUb2tlbkNsYXNzLk51bWVyaWNMaXRlcmFsLCBuYW1lOiBcIlwifSxcbiAgU1RSSU5HOiB7a2xhc3M6IFRva2VuQ2xhc3MuU3RyaW5nTGl0ZXJhbCwgbmFtZTogXCJcIn0sXG4gIFJFR0VYUDoge2tsYXNzOiBUb2tlbkNsYXNzLlJlZ3VsYXJFeHByZXNzaW9uLCBuYW1lOiBcIlwifSxcbiAgSURFTlRJRklFUjoge2tsYXNzOiBUb2tlbkNsYXNzLklkZW50LCBuYW1lOiBcIlwifSxcbiAgRlVUVVJFX1JFU0VSVkVEX1dPUkQ6IHtrbGFzczogVG9rZW5DbGFzcy5LZXl3b3JkLCBuYW1lOiBcIlwifSxcbiAgRlVUVVJFX1NUUklDVF9SRVNFUlZFRF9XT1JEOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJcIn0sXG4gIENPTlNUOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJjb25zdFwifSxcbiAgTEVUOiB7a2xhc3M6IFRva2VuQ2xhc3MuS2V5d29yZCwgbmFtZTogXCJsZXRcIn0sXG4gIElMTEVHQUw6IHtrbGFzczogVG9rZW5DbGFzcy5JbGxlZ2FsLCBuYW1lOiBcIlwifVxufTtcblxuY29uc3QgVFQgPSBUb2tlblR5cGU7XG5jb25zdCBJID0gVFQuSUxMRUdBTDtcbmNvbnN0IEYgPSBmYWxzZTtcbmNvbnN0IFQgPSB0cnVlO1xuXG5jb25zdCBPTkVfQ0hBUl9QVU5DVFVBVE9SID0gW1xuICBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBUVC5OT1QsIEksIEksIEksXG4gIFRULk1PRCwgVFQuQklUX0FORCwgSSwgVFQuTFBBUkVOLCBUVC5SUEFSRU4sIFRULk1VTCwgVFQuQURELCBUVC5DT01NQSwgVFQuU1VCLCBUVC5QRVJJT0QsIFRULkRJViwgSSwgSSwgSSwgSSwgSSwgSSwgSSxcbiAgSSwgSSwgSSwgVFQuQ09MT04sIFRULlNFTUlDT0xPTiwgVFQuTFQsIFRULkFTU0lHTiwgVFQuR1QsIFRULkNPTkRJVElPTkFMLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLFxuICBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBJLCBUVC5MQlJBQ0ssIEksIFRULlJCUkFDSywgVFQuQklUX1hPUiwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSxcbiAgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgSSwgVFQuTEJSQUNFLCBUVC5CSVRfT1IsIFRULlJCUkFDRSwgVFQuQklUX05PVF07XG5cbmNvbnN0IFBVTkNUVUFUT1JfU1RBUlQgPSBbXG4gIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIFQsIEYsIEYsIEYsIFQsIFQsXG4gIEYsIFQsIFQsIFQsIFQsIFQsIFQsIEYsIFQsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIFQsIFQsIFQsIFQsIFQsIFQsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsXG4gIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIFQsIEYsIFQsIFQsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsIEYsXG4gIEYsIEYsIEYsIEYsIEYsIEYsIFQsIFQsIFQsIFQsIEZdO1xuXG5jb25zdCBJREVOVElGSUVSX1NUQVJUID0gW1xuICBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBULCBGLCBGLFxuICBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBGLCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULFxuICBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBGLCBULCBGLCBGLCBULCBGLCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULCBULFxuICBULCBULCBULCBULCBULCBULCBGLCBGLCBGLCBGLCBGXTtcblxuZXhwb3J0IGNsYXNzIFRva2VuIHtcbiAgY29uc3RydWN0b3IodHlwZSwgc2xpY2UsIG9jdGFsKSB7XG4gICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICB0aGlzLnNsaWNlID0gc2xpY2U7XG4gICAgdGhpcy5vY3RhbCA9IG9jdGFsO1xuICB9XG5cbiAgZ2V0IHZhbHVlKCkge1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBJZGVudGlmaWVyTGlrZVRva2VuIGV4dGVuZHMgVG9rZW4ge1xuICBjb25zdHJ1Y3Rvcih0eXBlLCBzbGljZSkge1xuICAgIHN1cGVyKHR5cGUsIHNsaWNlLCBmYWxzZSk7XG4gIH1cblxuICBnZXQgdmFsdWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuc2xpY2UudGV4dDtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgSWRlbnRpZmllclRva2VuIGV4dGVuZHMgSWRlbnRpZmllckxpa2VUb2tlbiB7XG4gIGNvbnN0cnVjdG9yKHNsaWNlKSB7XG4gICAgc3VwZXIoVG9rZW5UeXBlLklERU5USUZJRVIsIHNsaWNlKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgTnVsbExpdGVyYWxUb2tlbiBleHRlbmRzIElkZW50aWZpZXJMaWtlVG9rZW4ge1xuICBjb25zdHJ1Y3RvcihzbGljZSkge1xuICAgIHN1cGVyKFRva2VuVHlwZS5OVUxMX0xJVEVSQUwsIHNsaWNlKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgVHJ1ZUxpdGVyYWxUb2tlbiBleHRlbmRzIElkZW50aWZpZXJMaWtlVG9rZW4ge1xuICBjb25zdHJ1Y3RvcihzbGljZSkge1xuICAgIHN1cGVyKFRva2VuVHlwZS5UUlVFX0xJVEVSQUwsIHNsaWNlKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRmFsc2VMaXRlcmFsVG9rZW4gZXh0ZW5kcyBJZGVudGlmaWVyTGlrZVRva2VuIHtcbiAgY29uc3RydWN0b3Ioc2xpY2UpIHtcbiAgICBzdXBlcihUb2tlblR5cGUuRkFMU0VfTElURVJBTCwgc2xpY2UpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBLZXl3b3JkVG9rZW4gZXh0ZW5kcyBJZGVudGlmaWVyTGlrZVRva2VuIHtcbiAgY29uc3RydWN0b3IodHlwZSwgc2xpY2UpIHtcbiAgICBzdXBlcih0eXBlLCBzbGljZSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFB1bmN0dWF0b3JUb2tlbiBleHRlbmRzIFRva2VuIHtcbiAgY29uc3RydWN0b3IodHlwZSwgc2xpY2UpIHtcbiAgICBzdXBlcih0eXBlLCBzbGljZSwgZmFsc2UpO1xuICB9XG5cbiAgZ2V0IHZhbHVlKCkge1xuICAgIHJldHVybiB0aGlzLnR5cGUubmFtZTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgUmVndWxhckV4cHJlc3Npb25MaXRlcmFsVG9rZW4gZXh0ZW5kcyBUb2tlbiB7XG4gIGNvbnN0cnVjdG9yKHNsaWNlLCB2YWx1ZSkge1xuICAgIHN1cGVyKFRva2VuVHlwZS5SRUdFWFAsIHNsaWNlLCBmYWxzZSk7XG4gICAgdGhpcy5fdmFsdWUgPSB2YWx1ZTtcbiAgfVxuXG4gIGdldCB2YWx1ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fdmFsdWU7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIE51bWVyaWNMaXRlcmFsVG9rZW4gZXh0ZW5kcyBUb2tlbiB7XG4gIGNvbnN0cnVjdG9yKHNsaWNlLCB2YWx1ZSA9ICtzbGljZS50ZXh0LCBvY3RhbCA9IGZhbHNlKSB7XG4gICAgc3VwZXIoVG9rZW5UeXBlLk5VTUJFUiwgc2xpY2UsIG9jdGFsKTtcbiAgICB0aGlzLl92YWx1ZSA9IHZhbHVlO1xuICB9XG5cbiAgZ2V0IHZhbHVlKCkge1xuICAgIHJldHVybiB0aGlzLl92YWx1ZS50b1N0cmluZygpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTdHJpbmdMaXRlcmFsVG9rZW4gZXh0ZW5kcyBUb2tlbiB7XG4gIGNvbnN0cnVjdG9yKHNsaWNlLCB2YWx1ZSwgb2N0YWwpIHtcbiAgICBzdXBlcihUb2tlblR5cGUuU1RSSU5HLCBzbGljZSwgb2N0YWwpO1xuICAgIHRoaXMuX3ZhbHVlID0gdmFsdWU7XG4gIH1cblxuICBnZXQgdmFsdWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3ZhbHVlO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBFT0ZUb2tlbiBleHRlbmRzIFRva2VuIHtcbiAgY29uc3RydWN0b3Ioc2xpY2UpIHtcbiAgICBzdXBlcihUb2tlblR5cGUuRU9TLCBzbGljZSwgZmFsc2UpO1xuICB9XG5cbiAgZ2V0IHZhbHVlKCkge1xuICAgIHJldHVybiBcIlwiO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBKc0Vycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihpbmRleCwgbGluZSwgY29sdW1uLCBtc2cpIHtcbiAgICB0aGlzLmluZGV4ID0gaW5kZXg7XG4gICAgdGhpcy5saW5lID0gbGluZTtcbiAgICB0aGlzLmNvbHVtbiA9IGNvbHVtbjtcbiAgICB0aGlzLmRlc2NyaXB0aW9uID0gbXNnO1xuICAgIHRoaXMubWVzc2FnZSA9IGBbJHtsaW5lfToke2NvbHVtbn1dOiAke21zZ31gO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0XG5jbGFzcyBUb2tlbml6ZXIge1xuICBjb25zdHJ1Y3Rvcihzb3VyY2UpIHtcbiAgICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcbiAgICB0aGlzLmluZGV4ID0gMDtcbiAgICB0aGlzLmxpbmVTdGFydHMgPSBbMF07XG4gICAgdGhpcy5sb29rYWhlYWRTdGFydCA9IDA7XG4gICAgdGhpcy5sb29rYWhlYWQgPSB0aGlzLmFkdmFuY2UoKTtcbiAgICB0aGlzLmxvb2thaGVhZEVuZCA9IHRoaXMuaW5kZXg7XG4gICAgdGhpcy5pbmRleCA9IDA7XG4gICAgdGhpcy5zdHJpY3QgPSBmYWxzZTtcbiAgICB0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCA9IGZhbHNlO1xuICAgIHRoaXMucHJldlRva2VuID0gbnVsbDtcbiAgICB0aGlzLnRva2VuSW5kZXggPSAwO1xuICAgIHRoaXMubGluZVN0YXJ0cyA9IFswXTtcbiAgfVxuXG4gIHRyYWNrQmFja0xpbmVOdW1iZXIocG9zaXRpb24pIHtcbiAgICBmb3IgKGxldCBsaW5lID0gdGhpcy5saW5lU3RhcnRzLmxlbmd0aCAtIDE7IGxpbmUgPj0gMDsgbGluZS0tKSB7XG4gICAgICBpZiAoKHBvc2l0aW9uID49IHRoaXMuZ2V0TGluZVN0YXJ0KGxpbmUpKSkge1xuICAgICAgICByZXR1cm4gbGluZTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIDA7XG4gIH1cblxuICBjcmVhdGVJTExFR0FMKCkge1xuICAgIHJldHVybiB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5FWFBFQ1RFRF9JTExFR0FMX1RPS0VOKTtcbiAgfVxuXG4gIGNyZWF0ZVVuZXhwZWN0ZWQodG9rZW4pIHtcbiAgICBzd2l0Y2ggKHRva2VuLnR5cGUua2xhc3MpIHtcbiAgICAgIGNhc2UgVG9rZW5DbGFzcy5Fb2Y6XG4gICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5FWFBFQ1RFRF9FT1MpO1xuICAgICAgY2FzZSBUb2tlbkNsYXNzLk51bWVyaWNMaXRlcmFsOlxuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlVORVhQRUNURURfTlVNQkVSKTtcbiAgICAgIGNhc2UgVG9rZW5DbGFzcy5TdHJpbmdMaXRlcmFsOlxuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlVORVhQRUNURURfU1RSSU5HKTtcbiAgICAgIGNhc2UgVG9rZW5DbGFzcy5JZGVudDpcbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTkVYUEVDVEVEX0lERU5USUZJRVIpO1xuICAgICAgY2FzZSBUb2tlbkNsYXNzLktleXdvcmQ6XG4gICAgICAgIGlmICgodG9rZW4udHlwZSA9PT0gVG9rZW5UeXBlLkZVVFVSRV9SRVNFUlZFRF9XT1JEKSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5FWFBFQ1RFRF9SRVNFUlZFRF9XT1JEKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoKHRva2VuLnR5cGUgPT09IFRva2VuVHlwZS5GVVRVUkVfU1RSSUNUX1JFU0VSVkVEX1dPUkQpKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUkVTRVJWRURfV09SRCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTkVYUEVDVEVEX1RPS0VOLCB0b2tlbi5zbGljZS50ZXh0KTtcbiAgICAgIGNhc2UgVG9rZW5DbGFzcy5QdW5jdHVhdG9yOlxuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlVORVhQRUNURURfVE9LRU4sIHRva2VuLnR5cGUubmFtZSk7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBicmVhaztcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTkVYUEVDVEVEX1RPS0VOLCB0b2tlbi52YWx1ZSB8fCB0b2tlbi50eXBlLm5hbWUpO1xuICB9XG5cbiAgY3JlYXRlRXJyb3IobWVzc2FnZSwgYXJnKSB7XG4gICAgbGV0IG1zZyA9IG1lc3NhZ2UucmVwbGFjZSgveyhcXGQrKX0vZywgKCkgPT4gYXJnKTtcbiAgICBsZXQgaW5kZXggPSB0aGlzLmluZGV4O1xuICAgIGxldCBsaW5lID0gdGhpcy50cmFja0JhY2tMaW5lTnVtYmVyKGluZGV4KTtcbiAgICByZXR1cm4gbmV3IEpzRXJyb3IoaW5kZXgsIGxpbmUgKyAxLCBpbmRleCAtIHRoaXMuZ2V0TGluZVN0YXJ0KGxpbmUpICsgMSwgbXNnKTtcbiAgfVxuXG4gIGNyZWF0ZUVycm9yV2l0aFRva2VuKHRva2VuLCBtZXNzYWdlLCBhcmcpIHtcbiAgICBsZXQgbXNnID0gbWVzc2FnZS5yZXBsYWNlKC97KFxcZCspfS9nLCAoKSA9PiBhcmcpO1xuICAgIGxldCBpbmRleCA9IHRva2VuLnNsaWNlLnN0YXJ0O1xuICAgIGxldCBsaW5lID0gdGhpcy50cmFja0JhY2tMaW5lTnVtYmVyKGluZGV4KTtcbiAgICByZXR1cm4gbmV3IEpzRXJyb3IoaW5kZXgsIGxpbmUgKyAxLCBpbmRleCAtIHRoaXMuZ2V0TGluZVN0YXJ0KGxpbmUpICsgMSwgbXNnKTtcbiAgfVxuXG4gIGdldExpbmVTdGFydChsaW5lKSB7XG4gICAgcmV0dXJuIHRoaXMubGluZVN0YXJ0c1tsaW5lXTtcbiAgfVxuXG4gIHN0YXRpYyBjc2UyKGlkLCBjaDEsIGNoMikge1xuICAgIHJldHVybiBpZC5jaGFyQXQoMSkgPT09IGNoMSAmJiBpZC5jaGFyQXQoMikgPT09IGNoMjtcbiAgfVxuXG4gIHN0YXRpYyBjc2UzKGlkLCBjaDEsIGNoMiwgY2gzKSB7XG4gICAgcmV0dXJuIGlkLmNoYXJBdCgxKSA9PT0gY2gxICYmIGlkLmNoYXJBdCgyKSA9PT0gY2gyICYmIGlkLmNoYXJBdCgzKSA9PT0gY2gzO1xuICB9XG5cbiAgc3RhdGljIGNzZTQoaWQsIGNoMSwgY2gyLCBjaDMsIGNoNCkge1xuICAgIHJldHVybiBpZC5jaGFyQXQoMSkgPT09IGNoMSAmJiBpZC5jaGFyQXQoMikgPT09IGNoMiAmJiBpZC5jaGFyQXQoMykgPT09IGNoMyAmJiBpZC5jaGFyQXQoNCkgPT09IGNoNDtcbiAgfVxuXG4gIHN0YXRpYyBjc2U1KGlkLCBjaDEsIGNoMiwgY2gzLCBjaDQsIGNoNSkge1xuICAgIHJldHVybiBpZC5jaGFyQXQoMSkgPT09IGNoMSAmJiBpZC5jaGFyQXQoMikgPT09IGNoMiAmJiBpZC5jaGFyQXQoMykgPT09IGNoMyAmJiBpZC5jaGFyQXQoNCkgPT09IGNoNCAmJiBpZC5jaGFyQXQoNSlcbiAgICAgICAgPT09IGNoNTtcbiAgfVxuXG4gIHN0YXRpYyBjc2U2KGlkLCBjaDEsIGNoMiwgY2gzLCBjaDQsIGNoNSwgY2g2KSB7XG4gICAgcmV0dXJuIGlkLmNoYXJBdCgxKSA9PT0gY2gxICYmIGlkLmNoYXJBdCgyKSA9PT0gY2gyICYmIGlkLmNoYXJBdCgzKSA9PT0gY2gzICYmIGlkLmNoYXJBdCg0KSA9PT0gY2g0ICYmIGlkLmNoYXJBdCg1KVxuICAgICAgICA9PT0gY2g1ICYmIGlkLmNoYXJBdCg2KSA9PT0gY2g2O1xuICB9XG5cbiAgc3RhdGljIGNzZTcoaWQsIGNoMSwgY2gyLCBjaDMsIGNoNCwgY2g1LCBjaDYsIGNoNykge1xuICAgIHJldHVybiBpZC5jaGFyQXQoMSkgPT09IGNoMSAmJiBpZC5jaGFyQXQoMikgPT09IGNoMiAmJiBpZC5jaGFyQXQoMykgPT09IGNoMyAmJiBpZC5jaGFyQXQoNCkgPT09IGNoNCAmJiBpZC5jaGFyQXQoNSlcbiAgICAgICAgPT09IGNoNSAmJiBpZC5jaGFyQXQoNikgPT09IGNoNiAmJiBpZC5jaGFyQXQoNykgPT09IGNoNztcbiAgfVxuXG4gIHN0YXRpYyBnZXRLZXl3b3JkKGlkLCBzdHJpY3QpIHtcbiAgICAvLyBcImNvbnN0XCIgaXMgc3BlY2lhbGl6ZWQgYXMgS2V5d29yZCBpbiBWOC5cbiAgICAvLyBcInlpZWxkXCIgYW5kIFwibGV0XCIgYXJlIGZvciBjb21wYXRpYmlsaXR5IHdpdGggU3BpZGVyTW9ua2V5IGFuZCBFUy5uZXh0LlxuICAgIC8vIFNvbWUgb3RoZXJzIGFyZSBmcm9tIGZ1dHVyZSByZXNlcnZlZCB3b3Jkcy5cblxuICAgIGlmIChpZC5sZW5ndGggPT09IDEgfHwgaWQubGVuZ3RoID4gMTApIHtcbiAgICAgIHJldHVybiBUb2tlblR5cGUuSUxMRUdBTDtcbiAgICB9XG4gICAgc3dpdGNoIChpZC5sZW5ndGgpIHtcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgc3dpdGNoIChpZC5jaGFyQXQoMCkpIHtcbiAgICAgICAgICBjYXNlIFwiaVwiOlxuICAgICAgICAgICAgc3dpdGNoIChpZC5jaGFyQXQoMSkpIHtcbiAgICAgICAgICAgICAgY2FzZSBcImZcIjpcbiAgICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLklGO1xuICAgICAgICAgICAgICBjYXNlIFwiblwiOlxuICAgICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuSU47XG4gICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiZFwiOlxuICAgICAgICAgICAgaWYgKGlkLmNoYXJBdCgxKSA9PT0gXCJvXCIpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5ETztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgc3dpdGNoIChpZC5jaGFyQXQoMCkpIHtcbiAgICAgICAgICBjYXNlIFwidlwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2UyKGlkLCBcImFcIiwgXCJyXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuVkFSO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImZcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlMihpZCwgXCJvXCIsIFwiclwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkZPUjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJuXCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTIoaWQsIFwiZVwiLCBcIndcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5ORVc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwidFwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2UyKGlkLCBcInJcIiwgXCJ5XCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuVFJZO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImxcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlMihpZCwgXCJlXCIsIFwidFwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gc3RyaWN0ID8gVG9rZW5UeXBlLkZVVFVSRV9TVFJJQ1RfUkVTRVJWRURfV09SRCA6IFRva2VuVHlwZS5MRVQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDQ6XG4gICAgICAgIHN3aXRjaCAoaWQuY2hhckF0KDApKSB7XG4gICAgICAgICAgY2FzZSBcInRcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlMyhpZCwgXCJoXCIsIFwiaVwiLCBcInNcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5USElTO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImVcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlMyhpZCwgXCJsXCIsIFwic1wiLCBcImVcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5FTFNFO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChUb2tlbml6ZXIuY3NlMyhpZCwgXCJuXCIsIFwidVwiLCBcIm1cIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5GVVRVUkVfUkVTRVJWRURfV09SRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJjXCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTMoaWQsIFwiYVwiLCBcInNcIiwgXCJlXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQ0FTRTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJ2XCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTMoaWQsIFwib1wiLCBcImlcIiwgXCJkXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuVk9JRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJ3XCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTMoaWQsIFwiaVwiLCBcInRcIiwgXCJoXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuV0lUSDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgNTpcbiAgICAgICAgc3dpdGNoIChpZC5jaGFyQXQoMCkpIHtcbiAgICAgICAgICBjYXNlIFwid1wiOiAvLyBXSElMRVxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U0KGlkLCBcImhcIiwgXCJpXCIsIFwibFwiLCBcImVcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5XSElMRTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJiXCI6IC8vIEJSRUFLXG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTQoaWQsIFwiclwiLCBcImVcIiwgXCJhXCIsIFwia1wiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkJSRUFLO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImNcIjogLy8gQ0FUQ0hcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNChpZCwgXCJhXCIsIFwidFwiLCBcImNcIiwgXCJoXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQ0FUQ0g7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKFRva2VuaXplci5jc2U0KGlkLCBcIm9cIiwgXCJuXCIsIFwic1wiLCBcInRcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5DT05TVDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoVG9rZW5pemVyLmNzZTQoaWQsIFwibFwiLCBcImFcIiwgXCJzXCIsIFwic1wiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkZVVFVSRV9SRVNFUlZFRF9XT1JEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcInRcIjogLy8gVEhST1dcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNChpZCwgXCJoXCIsIFwiclwiLCBcIm9cIiwgXCJ3XCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuVEhST1c7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwieVwiOiAvLyBZSUVMRFxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U0KGlkLCBcImlcIiwgXCJlXCIsIFwibFwiLCBcImRcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHN0cmljdCA/IFRva2VuVHlwZS5GVVRVUkVfU1RSSUNUX1JFU0VSVkVEX1dPUkQgOiBUb2tlblR5cGUuSUxMRUdBTDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJzXCI6IC8vIFNVUEVSXG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTQoaWQsIFwidVwiLCBcInBcIiwgXCJlXCIsIFwiclwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkZVVFVSRV9SRVNFUlZFRF9XT1JEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA2OlxuICAgICAgICBzd2l0Y2ggKGlkLmNoYXJBdCgwKSkge1xuICAgICAgICAgIGNhc2UgXCJyXCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTUoaWQsIFwiZVwiLCBcInRcIiwgXCJ1XCIsIFwiclwiLCBcIm5cIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5SRVRVUk47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwidFwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U1KGlkLCBcInlcIiwgXCJwXCIsIFwiZVwiLCBcIm9cIiwgXCJmXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuVFlQRU9GO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImRcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNShpZCwgXCJlXCIsIFwibFwiLCBcImVcIiwgXCJ0XCIsIFwiZVwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkRFTEVURTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJzXCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTUoaWQsIFwid1wiLCBcImlcIiwgXCJ0XCIsIFwiY1wiLCBcImhcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5TV0lUQ0g7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHN0cmljdCAmJiBUb2tlbml6ZXIuY3NlNShpZCwgXCJ0XCIsIFwiYVwiLCBcInRcIiwgXCJpXCIsIFwiY1wiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkZVVFVSRV9TVFJJQ1RfUkVTRVJWRURfV09SRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJlXCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTUoaWQsIFwieFwiLCBcInBcIiwgXCJvXCIsIFwiclwiLCBcInRcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5GVVRVUkVfUkVTRVJWRURfV09SRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJpXCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTUoaWQsIFwibVwiLCBcInBcIiwgXCJvXCIsIFwiclwiLCBcInRcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5GVVRVUkVfUkVTRVJWRURfV09SRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgXCJwXCI6XG4gICAgICAgICAgICBpZiAoc3RyaWN0ICYmIFRva2VuaXplci5jc2U1KGlkLCBcInVcIiwgXCJiXCIsIFwibFwiLCBcImlcIiwgXCJjXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRlVUVVJFX1NUUklDVF9SRVNFUlZFRF9XT1JEO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA3OlxuICAgICAgICBzd2l0Y2ggKGlkLmNoYXJBdCgwKSkge1xuICAgICAgICAgIGNhc2UgXCJkXCI6IC8vIGRlZmF1bHRcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNihpZCwgXCJlXCIsIFwiZlwiLCBcImFcIiwgXCJ1XCIsIFwibFwiLCBcInRcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5ERUZBVUxUO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImZcIjogLy8gZmluYWxseVxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U2KGlkLCBcImlcIiwgXCJuXCIsIFwiYVwiLCBcImxcIiwgXCJsXCIsIFwieVwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkZJTkFMTFk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiZVwiOiAvLyBleHRlbmRzXG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTYoaWQsIFwieFwiLCBcInRcIiwgXCJlXCIsIFwiblwiLCBcImRcIiwgXCJzXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRlVUVVJFX1JFU0VSVkVEX1dPUkQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwicFwiOlxuICAgICAgICAgICAgaWYgKHN0cmljdCkge1xuICAgICAgICAgICAgICBsZXQgcyA9IGlkO1xuICAgICAgICAgICAgICBpZiAoXCJwcml2YXRlXCIgPT09IHMgfHwgXCJwYWNrYWdlXCIgPT09IHMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkZVVFVSRV9TVFJJQ1RfUkVTRVJWRURfV09SRDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA4OlxuICAgICAgICBzd2l0Y2ggKGlkLmNoYXJBdCgwKSkge1xuICAgICAgICAgIGNhc2UgXCJmXCI6XG4gICAgICAgICAgICBpZiAoVG9rZW5pemVyLmNzZTcoaWQsIFwidVwiLCBcIm5cIiwgXCJjXCIsIFwidFwiLCBcImlcIiwgXCJvXCIsIFwiblwiKSkge1xuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkZVTkNUSU9OO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSBcImNcIjpcbiAgICAgICAgICAgIGlmIChUb2tlbml6ZXIuY3NlNyhpZCwgXCJvXCIsIFwiblwiLCBcInRcIiwgXCJpXCIsIFwiblwiLCBcInVcIiwgXCJlXCIpKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQ09OVElOVUU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiZFwiOlxuICAgICAgICAgICAgaWYgKFRva2VuaXplci5jc2U3KGlkLCBcImVcIiwgXCJiXCIsIFwidVwiLCBcImdcIiwgXCJnXCIsIFwiZVwiLCBcInJcIikpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5ERUJVR0dFUjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgOTpcbiAgICAgICAgaWYgKHN0cmljdCAmJiAoaWQuY2hhckF0KDApID09PSBcInBcIiB8fCBpZC5jaGFyQXQoMCkgPT09IFwiaVwiKSkge1xuICAgICAgICAgIGxldCBzID0gaWQ7XG4gICAgICAgICAgaWYgKFwicHJvdGVjdGVkXCIgPT09IHMgfHwgXCJpbnRlcmZhY2VcIiA9PT0gcykge1xuICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5GVVRVUkVfU1RSSUNUX1JFU0VSVkVEX1dPUkQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAxMDpcbiAgICAgIHtcbiAgICAgICAgbGV0IHMgPSBpZDtcbiAgICAgICAgaWYgKFwiaW5zdGFuY2VvZlwiID09PSBzKSB7XG4gICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5JTlNUQU5DRU9GO1xuICAgICAgICB9IGVsc2UgaWYgKHN0cmljdCAmJiBcImltcGxlbWVudHNcIiA9PT0gcykge1xuICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuRlVUVVJFX1NUUklDVF9SRVNFUlZFRF9XT1JEO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHJldHVybiBUb2tlblR5cGUuSUxMRUdBTDtcbiAgfVxuXG4gIHNraXBTaW5nbGVMaW5lQ29tbWVudChvZmZzZXQpIHtcbiAgICB0aGlzLmluZGV4ICs9IG9mZnNldDtcbiAgICB3aGlsZSAodGhpcy5pbmRleCA8IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgLyoqXG4gICAgICAgKiBAdHlwZSB7TnVtYmVyfVxuICAgICAgICovXG4gICAgICBsZXQgY2hDb2RlID0gdGhpcy5zb3VyY2UuY2hhckNvZGVBdCh0aGlzLmluZGV4KTtcbiAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgIGlmIChpc0xpbmVUZXJtaW5hdG9yKGNoQ29kZSkpIHtcbiAgICAgICAgdGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQgPSB0cnVlO1xuICAgICAgICBpZiAoY2hDb2RlID09PSAweDAwMEQgLyogXCJcXHJcIiAqLyAmJiB0aGlzLmluZGV4IDwgdGhpcy5zb3VyY2UubGVuZ3RoICYmIHRoaXMuc291cmNlLmNoYXJDb2RlQXQodGhpcy5pbmRleClcbiAgICAgICAgICAgID09PSAweDAwMEEgLypcIlxcblwiICovKSB7XG4gICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubGluZVN0YXJ0cy5wdXNoKHRoaXMuaW5kZXgpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgc2tpcE11bHRpTGluZUNvbW1lbnQoKSB7XG4gICAgdGhpcy5pbmRleCArPSAyO1xuICAgIGxldCBsZW5ndGggPSB0aGlzLnNvdXJjZS5sZW5ndGg7XG4gICAgbGV0IGkgPSB0aGlzLmluZGV4O1xuICAgIHdoaWxlIChpIDwgbGVuZ3RoKSB7XG4gICAgICBsZXQgY2hDb2RlID0gdGhpcy5zb3VyY2UuY2hhckNvZGVBdChpKTtcbiAgICAgIGlmIChjaENvZGUgPCAweDgwKSB7XG4gICAgICAgIHN3aXRjaCAoY2hDb2RlKSB7XG4gICAgICAgICAgY2FzZSA0MjogIC8vIFwiKlwiXG4gICAgICAgICAgICAvLyBCbG9jayBjb21tZW50IGVuZHMgd2l0aCBcIiovJy5cbiAgICAgICAgICAgIGlmIChpICsgMSA8IGxlbmd0aCAmJiB0aGlzLnNvdXJjZS5jaGFyQXQoaSArIDEpID09PSBcIi9cIikge1xuICAgICAgICAgICAgICB0aGlzLmluZGV4ID0gaSArIDI7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgMTA6ICAvLyBcIlxcblwiXG4gICAgICAgICAgICB0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCA9IHRydWU7XG4gICAgICAgICAgICBpKys7XG4gICAgICAgICAgICB0aGlzLmxpbmVTdGFydHMucHVzaCh0aGlzLmluZGV4KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgMTI6IC8vIFwiXFxyXCI6XG4gICAgICAgICAgICB0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCA9IHRydWU7XG4gICAgICAgICAgICBpZiAoaSA8IGxlbmd0aCAtIDEgJiYgdGhpcy5zb3VyY2UuY2hhckF0KGkgKyAxKSA9PT0gXCJcXG5cIikge1xuICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpKys7XG4gICAgICAgICAgICB0aGlzLmxpbmVTdGFydHMucHVzaCh0aGlzLmluZGV4KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBpKys7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoY2hDb2RlID09PSAweDIwMjggfHwgY2hDb2RlID09PSAweDIwMjkpIHtcbiAgICAgICAgaSsrO1xuICAgICAgICB0aGlzLmxpbmVTdGFydHMucHVzaCh0aGlzLmluZGV4KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGkrKztcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5pbmRleCA9IGk7XG4gICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gIH1cblxuXG4gIHNraXBDb21tZW50KCkge1xuICAgIGxldCBpc0xpbmVTdGFydCA9IHRoaXMuaW5kZXggPT09IDA7XG4gICAgbGV0IGxlbmd0aCA9IHRoaXMuc291cmNlLmxlbmd0aDtcblxuICAgIHdoaWxlICh0aGlzLmluZGV4IDwgbGVuZ3RoKSB7XG4gICAgICBsZXQgY2hDb2RlID0gdGhpcy5zb3VyY2UuY2hhckNvZGVBdCh0aGlzLmluZGV4KTtcbiAgICAgIGlmIChpc1doaXRlc3BhY2UoY2hDb2RlKSkge1xuICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICB9IGVsc2UgaWYgKGlzTGluZVRlcm1pbmF0b3IoY2hDb2RlKSkge1xuICAgICAgICB0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCA9IHRydWU7XG4gICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgaWYgKGNoQ29kZSA9PT0gMTMgLyogXCJcXHJcIiAqLyAmJiB0aGlzLmluZGV4IDwgbGVuZ3RoICYmIHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KSA9PT0gXCJcXG5cIikge1xuICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxpbmVTdGFydHMucHVzaCh0aGlzLmluZGV4KTtcbiAgICAgICAgaXNMaW5lU3RhcnQgPSB0cnVlO1xuICAgICAgfSBlbHNlIGlmIChjaENvZGUgPT09IDQ3IC8qIFwiL1wiICovKSB7XG4gICAgICAgIGlmICh0aGlzLmluZGV4ICsgMSA+PSBsZW5ndGgpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjaENvZGUgPSB0aGlzLnNvdXJjZS5jaGFyQ29kZUF0KHRoaXMuaW5kZXggKyAxKTtcbiAgICAgICAgaWYgKGNoQ29kZSA9PT0gNDcgLyogXCIvXCIgKi8pIHtcbiAgICAgICAgICB0aGlzLnNraXBTaW5nbGVMaW5lQ29tbWVudCgyKTtcbiAgICAgICAgICBpc0xpbmVTdGFydCA9IHRydWU7XG4gICAgICAgIH0gZWxzZSBpZiAoY2hDb2RlID09PSA0MiAvKiBcIipcIiAqLykge1xuICAgICAgICAgIHRoaXMuc2tpcE11bHRpTGluZUNvbW1lbnQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChpc0xpbmVTdGFydCAmJiBjaENvZGUgPT09IDQ1IC8qIFwiLVwiICovKSB7XG4gICAgICAgIGlmICh0aGlzLmluZGV4ICsgMiA+PSBsZW5ndGgpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICAvLyBVKzAwM0UgaXMgXCI+J1xuICAgICAgICBpZiAoKHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMSkgPT09IFwiLVwiKSAmJiAodGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAyKSA9PT0gXCI+XCIpKSB7XG4gICAgICAgICAgLy8gXCItLT5cIiBpcyBhIHNpbmdsZS1saW5lIGNvbW1lbnRcbiAgICAgICAgICB0aGlzLnNraXBTaW5nbGVMaW5lQ29tbWVudCgzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChjaENvZGUgPT09IDYwIC8qIFwiPFwiICovKSB7XG4gICAgICAgIGlmICh0aGlzLmluZGV4ICsgNCA8PSBsZW5ndGggJiYgdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAxKSA9PT0gXCIhXCIgJiYgdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAyKVxuICAgICAgICAgICAgPT09IFwiLVwiXG4gICAgICAgICAgICAmJiB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDMpID09PSBcIi1cIikge1xuICAgICAgICAgIHRoaXMuc2tpcFNpbmdsZUxpbmVDb21tZW50KDQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBzY2FuSGV4RXNjYXBlNCgpIHtcbiAgICBpZiAodGhpcy5pbmRleCArIDQgPiB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gICAgbGV0IHIxID0gZ2V0SGV4VmFsdWUodGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpKTtcbiAgICBpZiAocjEgPT09IC0xKSB7XG4gICAgICByZXR1cm4gLTE7XG4gICAgfVxuICAgIGxldCByMiA9IGdldEhleFZhbHVlKHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMSkpO1xuICAgIGlmIChyMiA9PT0gLTEpIHtcbiAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gICAgbGV0IHIzID0gZ2V0SGV4VmFsdWUodGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAyKSk7XG4gICAgaWYgKHIzID09PSAtMSkge1xuICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbiAgICBsZXQgcjQgPSBnZXRIZXhWYWx1ZSh0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDMpKTtcbiAgICBpZiAocjQgPT09IC0xKSB7XG4gICAgICByZXR1cm4gLTE7XG4gICAgfVxuICAgIHRoaXMuaW5kZXggKz0gNDtcbiAgICByZXR1cm4gcjEgPDwgMTIgfCByMiA8PCA4IHwgcjMgPDwgNCB8IHI0O1xuICB9XG5cbiAgc2NhbkhleEVzY2FwZTIoKSB7XG4gICAgaWYgKHRoaXMuaW5kZXggKyAyID4gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gLTE7XG4gICAgfVxuICAgIGxldCByMSA9IGdldEhleFZhbHVlKHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KSk7XG4gICAgaWYgKHIxID09PSAtMSkge1xuICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbiAgICBsZXQgcjIgPSBnZXRIZXhWYWx1ZSh0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDEpKTtcbiAgICBpZiAocjIgPT09IC0xKSB7XG4gICAgICByZXR1cm4gLTE7XG4gICAgfVxuICAgIHRoaXMuaW5kZXggKz0gMjtcbiAgICByZXR1cm4gcjEgPDwgNCB8IHIyO1xuICB9XG5cbiAgZ2V0RXNjYXBlZElkZW50aWZpZXIoKSB7XG4gICAgbGV0IGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgIHRoaXMuaW5kZXgrKztcbiAgICBpZiAodGhpcy5pbmRleCA+PSB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgIH1cblxuICAgIGxldCBpZCA9IFwiXCI7XG5cbiAgICBpZiAoY2ggPT09IFwiXFxcXFwiKSB7XG4gICAgICBpZiAodGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpICE9PSBcInVcIikge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgIGlmICh0aGlzLmluZGV4ID49IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgIH1cbiAgICAgIGxldCBpY2ggPSB0aGlzLnNjYW5IZXhFc2NhcGU0KCk7XG4gICAgICBpZiAoaWNoIDwgMCB8fCBpY2ggPT09IDB4MDA1QyAvKiBcIlxcXFxcIiAqLyAgfHwgIWlzSWRlbnRpZmllclN0YXJ0KGljaCkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICB9XG4gICAgICBjaCA9IFN0cmluZy5mcm9tQ2hhckNvZGUoaWNoKTtcbiAgICB9XG4gICAgaWQgKz0gY2g7XG5cbiAgICB3aGlsZSAodGhpcy5pbmRleCA8IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICBpZiAoIWlzSWRlbnRpZmllclBhcnQoY2guY2hhckNvZGVBdCgwKSkgJiYgY2ggIT09IFwiXFxcXFwiKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgaWYgKGNoID09PSBcIlxcXFxcIikge1xuICAgICAgICBpZiAodGhpcy5pbmRleCA+PSB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpICE9PSBcInVcIikge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgaWYgKHRoaXMuaW5kZXggPj0gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGljaCA9IHRoaXMuc2NhbkhleEVzY2FwZTQoKTtcbiAgICAgICAgaWYgKGljaCA8IDAgfHwgaWNoID09PSAweDAwNUMgLyogXCJcXFxcXCIgKi8gfHwgIWlzSWRlbnRpZmllclBhcnQoaWNoKSkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgICB9XG4gICAgICAgIGNoID0gU3RyaW5nLmZyb21DaGFyQ29kZShpY2gpO1xuICAgICAgfVxuICAgICAgaWQgKz0gY2g7XG4gICAgfVxuXG4gICAgcmV0dXJuIGlkO1xuICB9XG5cbiAgZ2V0SWRlbnRpZmllcigpIHtcbiAgICBsZXQgc3RhcnQgPSB0aGlzLmluZGV4O1xuICAgIHRoaXMuaW5kZXgrKztcbiAgICBsZXQgbCA9IHRoaXMuc291cmNlLmxlbmd0aDtcbiAgICBsZXQgaSA9IHRoaXMuaW5kZXg7XG4gICAgd2hpbGUgKGkgPCBsKSB7XG4gICAgICBsZXQgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQoaSk7XG4gICAgICBpZiAoY2ggPT09IFwiXFxcXFwiKSB7XG4gICAgICAgIC8vIEdvIGJhY2sgYW5kIHRyeSB0aGUgaGFyZCBvbmUuXG4gICAgICAgIHRoaXMuaW5kZXggPSBzdGFydDtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0RXNjYXBlZElkZW50aWZpZXIoKTtcbiAgICAgIH0gZWxzZSBpZiAoaXNJZGVudGlmaWVyUGFydChjaC5jaGFyQ29kZUF0KDApKSkge1xuICAgICAgICBpKys7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5pbmRleCA9IGk7XG4gICAgcmV0dXJuIHRoaXMuc291cmNlLnNsaWNlKHN0YXJ0LCB0aGlzLmluZGV4KTtcbiAgfVxuXG4gIHNjYW5JZGVudGlmaWVyKCkge1xuICAgIGxldCBzdGFydCA9IHRoaXMuaW5kZXg7XG5cbiAgICAvLyBCYWNrc2xhc2ggKFUrMDA1Qykgc3RhcnRzIGFuIGVzY2FwZWQgY2hhcmFjdGVyLlxuICAgIGxldCBpZCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KSA9PT0gXCJcXFxcXCIgPyB0aGlzLmdldEVzY2FwZWRJZGVudGlmaWVyKCkgOiB0aGlzLmdldElkZW50aWZpZXIoKTtcblxuICAgIC8vIFRoZXJlIGlzIG5vIGtleXdvcmQgb3IgbGl0ZXJhbCB3aXRoIG9ubHkgb25lIGNoYXJhY3Rlci5cbiAgICAvLyBUaHVzLCBpdCBtdXN0IGJlIGFuIGlkZW50aWZpZXIuXG4gICAgbGV0IHNsaWNlID0ge3RleHQ6IGlkLCBzdGFydCwgZW5kOiB0aGlzLmluZGV4fTtcbiAgICBpZiAoKGlkLmxlbmd0aCA9PT0gMSkpIHtcbiAgICAgIHJldHVybiBuZXcgSWRlbnRpZmllclRva2VuKHNsaWNlKTtcbiAgICB9XG5cbiAgICBsZXQgc3ViVHlwZSA9IFRva2VuaXplci5nZXRLZXl3b3JkKGlkLCB0aGlzLnN0cmljdCk7XG4gICAgaWYgKHN1YlR5cGUgIT09IFRva2VuVHlwZS5JTExFR0FMKSB7XG4gICAgICByZXR1cm4gbmV3IEtleXdvcmRUb2tlbihzdWJUeXBlLCBzbGljZSk7XG4gICAgfVxuXG4gICAgaWYgKGlkLmxlbmd0aCA9PT0gNCkge1xuICAgICAgaWYgKFwibnVsbFwiID09PSBpZCkge1xuICAgICAgICByZXR1cm4gbmV3IE51bGxMaXRlcmFsVG9rZW4oc2xpY2UpO1xuICAgICAgfSBlbHNlIGlmIChcInRydWVcIiA9PT0gaWQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBUcnVlTGl0ZXJhbFRva2VuKHNsaWNlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoaWQubGVuZ3RoID09PSA1ICYmIFwiZmFsc2VcIiA9PT0gaWQpIHtcbiAgICAgIHJldHVybiBuZXcgRmFsc2VMaXRlcmFsVG9rZW4oc2xpY2UpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgSWRlbnRpZmllclRva2VuKHNsaWNlKTtcbiAgfVxuXG4gIGdldFNsaWNlKHN0YXJ0KSB7XG4gICAgcmV0dXJuIHt0ZXh0OiB0aGlzLnNvdXJjZS5zbGljZShzdGFydCwgdGhpcy5pbmRleCksIHN0YXJ0OiBzdGFydCwgZW5kOiB0aGlzLmluZGV4fTtcbiAgfVxuXG4gIHNjYW5QdW5jdHVhdG9ySGVscGVyKCkge1xuICAgIGxldCBjaDEgPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG5cbiAgICBzd2l0Y2ggKGNoMSkge1xuICAgICAgLy8gQ2hlY2sgZm9yIG1vc3QgY29tbW9uIHNpbmdsZS1jaGFyYWN0ZXIgcHVuY3R1YXRvcnMuXG4gICAgICBjYXNlIFwiLlwiOlxuICAgICAgICBsZXQgY2gyID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAxKTtcbiAgICAgICAgaWYgKGNoMiAhPT0gXCIuXCIpIHJldHVybiBUb2tlblR5cGUuUEVSSU9EO1xuICAgICAgICBsZXQgY2gzID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAyKTtcbiAgICAgICAgaWYgKGNoMyAhPT0gXCIuXCIpIHJldHVybiBUb2tlblR5cGUuUEVSSU9EO1xuICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkVMTElQU0lTO1xuICAgICAgY2FzZSBcIihcIjpcbiAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5MUEFSRU47XG4gICAgICBjYXNlIFwiKVwiOlxuICAgICAgY2FzZSBcIjtcIjpcbiAgICAgIGNhc2UgXCIsXCI6XG4gICAgICAgIHJldHVybiBPTkVfQ0hBUl9QVU5DVFVBVE9SW2NoMS5jaGFyQ29kZUF0KDApXTtcbiAgICAgIGNhc2UgXCJ7XCI6XG4gICAgICAgIHJldHVybiBUb2tlblR5cGUuTEJSQUNFO1xuICAgICAgY2FzZSBcIn1cIjpcbiAgICAgIGNhc2UgXCJbXCI6XG4gICAgICBjYXNlIFwiXVwiOlxuICAgICAgY2FzZSBcIjpcIjpcbiAgICAgIGNhc2UgXCI/XCI6XG4gICAgICBjYXNlIFwiflwiOlxuICAgICAgICByZXR1cm4gT05FX0NIQVJfUFVOQ1RVQVRPUltjaDEuY2hhckNvZGVBdCgwKV07XG4gICAgICBkZWZhdWx0OlxuICAgICAgICAvLyBcIj1cIiAoVSswMDNEKSBtYXJrcyBhbiBhc3NpZ25tZW50IG9yIGNvbXBhcmlzb24gb3BlcmF0b3IuXG4gICAgICAgIGlmICh0aGlzLmluZGV4ICsgMSA8IHRoaXMuc291cmNlLmxlbmd0aCAmJiB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCArIDEpID09PSBcIj1cIikge1xuICAgICAgICAgIHN3aXRjaCAoY2gxKSB7XG4gICAgICAgICAgICBjYXNlIFwiPVwiOlxuICAgICAgICAgICAgICBpZiAodGhpcy5pbmRleCArIDIgPCB0aGlzLnNvdXJjZS5sZW5ndGggJiYgdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAyKSA9PT0gXCI9XCIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkVRX1NUUklDVDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkVRO1xuICAgICAgICAgICAgY2FzZSBcIiFcIjpcbiAgICAgICAgICAgICAgaWYgKHRoaXMuaW5kZXggKyAyIDwgdGhpcy5zb3VyY2UubGVuZ3RoICYmIHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMikgPT09IFwiPVwiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5ORV9TVFJJQ1Q7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5ORTtcbiAgICAgICAgICAgIGNhc2UgXCJ8XCI6XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQVNTSUdOX0JJVF9PUjtcbiAgICAgICAgICAgIGNhc2UgXCIrXCI6XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQVNTSUdOX0FERDtcbiAgICAgICAgICAgIGNhc2UgXCItXCI6XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQVNTSUdOX1NVQjtcbiAgICAgICAgICAgIGNhc2UgXCIqXCI6XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQVNTSUdOX01VTDtcbiAgICAgICAgICAgIGNhc2UgXCI8XCI6XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuTFRFO1xuICAgICAgICAgICAgY2FzZSBcIj5cIjpcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5HVEU7XG4gICAgICAgICAgICBjYXNlIFwiL1wiOlxuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkFTU0lHTl9ESVY7XG4gICAgICAgICAgICBjYXNlIFwiJVwiOlxuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkFTU0lHTl9NT0Q7XG4gICAgICAgICAgICBjYXNlIFwiXlwiOlxuICAgICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkFTU0lHTl9CSVRfWE9SO1xuICAgICAgICAgICAgY2FzZSBcIiZcIjpcbiAgICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5BU1NJR05fQklUX0FORDtcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgIGJyZWFrOyAvL2ZhaWxlZFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0aGlzLmluZGV4ICsgMSA8IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgbGV0IGNoMiA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMSk7XG4gICAgICBpZiAoY2gxID09PSBjaDIpIHtcbiAgICAgICAgaWYgKHRoaXMuaW5kZXggKyAyIDwgdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgICAgbGV0IGNoMyA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMik7XG4gICAgICAgICAgaWYgKGNoMSA9PT0gXCI+XCIgJiYgY2gzID09PSBcIj5cIikge1xuICAgICAgICAgICAgLy8gNC1jaGFyYWN0ZXIgcHVuY3R1YXRvcjogPj4+PVxuICAgICAgICAgICAgaWYgKHRoaXMuaW5kZXggKyAzIDwgdGhpcy5zb3VyY2UubGVuZ3RoICYmIHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4ICsgMykgPT09IFwiPVwiKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQVNTSUdOX1NIUl9VTlNJR05FRDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuU0hSX1VOU0lHTkVEO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChjaDEgPT09IFwiPFwiICYmIGNoMyA9PT0gXCI9XCIpIHtcbiAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuQVNTSUdOX1NITDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoY2gxID09PSBcIj5cIiAmJiBjaDMgPT09IFwiPVwiKSB7XG4gICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLkFTU0lHTl9TSFI7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIE90aGVyIDItY2hhcmFjdGVyIHB1bmN0dWF0b3JzOiArKyAtLSA8PCA+PiAmJiB8fFxuICAgICAgICBzd2l0Y2ggKGNoMSkge1xuICAgICAgICAgIGNhc2UgXCIrXCI6XG4gICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLklOQztcbiAgICAgICAgICBjYXNlIFwiLVwiOlxuICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5ERUM7XG4gICAgICAgICAgY2FzZSBcIjxcIjpcbiAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuU0hMO1xuICAgICAgICAgIGNhc2UgXCI+XCI6XG4gICAgICAgICAgICByZXR1cm4gVG9rZW5UeXBlLlNIUjtcbiAgICAgICAgICBjYXNlIFwiJlwiOlxuICAgICAgICAgICAgcmV0dXJuIFRva2VuVHlwZS5BTkQ7XG4gICAgICAgICAgY2FzZSBcInxcIjpcbiAgICAgICAgICAgIHJldHVybiBUb2tlblR5cGUuT1I7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGJyZWFrOyAvL2ZhaWxlZFxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIE9ORV9DSEFSX1BVTkNUVUFUT1JbY2gxLmNoYXJDb2RlQXQoMCldO1xuICB9XG5cbiAgLy8gNy43IFB1bmN0dWF0b3JzXG4gIHNjYW5QdW5jdHVhdG9yKCkge1xuICAgIGxldCBzdGFydCA9IHRoaXMuaW5kZXg7XG4gICAgbGV0IHN1YlR5cGUgPSB0aGlzLnNjYW5QdW5jdHVhdG9ySGVscGVyKCk7XG4gICAgdGhpcy5pbmRleCArPSBzdWJUeXBlLm5hbWUubGVuZ3RoO1xuICAgIHJldHVybiBuZXcgUHVuY3R1YXRvclRva2VuKHN1YlR5cGUsIHRoaXMuZ2V0U2xpY2Uoc3RhcnQpKTtcbiAgfVxuXG4gIHNjYW5IZXhMaXRlcmFsKHN0YXJ0KSB7XG4gICAgbGV0IGkgPSB0aGlzLmluZGV4O1xuICAgIHdoaWxlIChpIDwgdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICBsZXQgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQoaSk7XG4gICAgICBsZXQgaGV4ID0gZ2V0SGV4VmFsdWUoY2gpO1xuICAgICAgaWYgKGhleCA9PT0gLTEpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBpKys7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaW5kZXggPT09IGkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgIH1cblxuICAgIGlmIChpIDwgdGhpcy5zb3VyY2UubGVuZ3RoICYmIGlzSWRlbnRpZmllclN0YXJ0KHRoaXMuc291cmNlLmNoYXJDb2RlQXQoaSkpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICB9XG5cbiAgICB0aGlzLmluZGV4ID0gaTtcblxuICAgIGxldCBzbGljZSA9IHRoaXMuZ2V0U2xpY2Uoc3RhcnQpO1xuICAgIHJldHVybiBuZXcgTnVtZXJpY0xpdGVyYWxUb2tlbihzbGljZSwgcGFyc2VJbnQoc2xpY2UudGV4dC5zdWJzdHIoMiksIDE2KSk7XG4gIH1cblxuICBzY2FuQmluYXJ5TGl0ZXJhbChzdGFydCkge1xuICAgIGxldCBvZmZzZXQgPSB0aGlzLmluZGV4IC0gc3RhcnQ7XG5cbiAgICB3aGlsZSAodGhpcy5pbmRleCA8IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgbGV0IGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgaWYgKGNoICE9PSBcIjBcIiAmJiBjaCAhPT0gXCIxXCIpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICB0aGlzLmluZGV4Kys7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaW5kZXggLSBzdGFydCA8PSBvZmZzZXQpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmluZGV4IDwgdGhpcy5zb3VyY2UubGVuZ3RoICYmIChpc0lkZW50aWZpZXJTdGFydCh0aGlzLnNvdXJjZS5jaGFyQ29kZUF0KHRoaXMuaW5kZXgpKVxuICAgICAgICB8fCBpc0RlY2ltYWxEaWdpdCh0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCkpKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBOdW1lcmljTGl0ZXJhbFRva2VuKHRoaXMuZ2V0U2xpY2Uoc3RhcnQpLCBwYXJzZUludCh0aGlzLmdldFNsaWNlKHN0YXJ0KS50ZXh0LnN1YnN0cihvZmZzZXQpLCAyKSwgdHJ1ZSk7XG4gIH1cblxuICBzY2FuT2N0YWxMaXRlcmFsKHN0YXJ0KSB7XG4gICAgdmFyIG9mZnNldCA9IHRoaXMuaW5kZXggLSBzdGFydDtcblxuICAgIHdoaWxlICh0aGlzLmluZGV4IDwgdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICBsZXQgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICBpZiAoIShcIjBcIiA8PSBjaCAmJiBjaCA8PSBcIjdcIikpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICB0aGlzLmluZGV4Kys7XG4gICAgfVxuXG4gICAgaWYgKG9mZnNldCA9PT0gMiAmJiB0aGlzLmluZGV4IC0gc3RhcnQgPT09IDIpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmluZGV4IDwgdGhpcy5zb3VyY2UubGVuZ3RoICYmIChpc0lkZW50aWZpZXJTdGFydCh0aGlzLnNvdXJjZS5jaGFyQ29kZUF0KHRoaXMuaW5kZXgpKVxuICAgICAgICB8fCBpc0RlY2ltYWxEaWdpdCh0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCkpKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBOdW1lcmljTGl0ZXJhbFRva2VuKHRoaXMuZ2V0U2xpY2Uoc3RhcnQpLCBwYXJzZUludCh0aGlzLmdldFNsaWNlKHN0YXJ0KS50ZXh0LnN1YnN0cihvZmZzZXQpLCA4KSwgdHJ1ZSk7XG4gIH1cblxuICBzY2FuTnVtZXJpY0xpdGVyYWwoKSB7XG4gICAgbGV0IGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgIC8vIGFzc2VydChjaCA9PT0gXCIuXCIgfHwgXCIwXCIgPD0gY2ggJiYgY2ggPD0gXCI5XCIpXG4gICAgbGV0IHN0YXJ0ID0gdGhpcy5pbmRleDtcblxuICAgIGlmIChjaCA9PT0gXCIwXCIpIHtcbiAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgIGlmICh0aGlzLmluZGV4IDwgdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgIGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgICBpZiAoY2ggPT09IFwieFwiIHx8IGNoID09PSBcIlhcIikge1xuICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICByZXR1cm4gdGhpcy5zY2FuSGV4TGl0ZXJhbChzdGFydCk7XG4gICAgICAgIH0gZWxzZSBpZiAoY2ggPT09IFwiYlwiIHx8IGNoID09PSBcIkJcIikge1xuICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICByZXR1cm4gdGhpcy5zY2FuQmluYXJ5TGl0ZXJhbChzdGFydCk7XG4gICAgICAgIH0gZWxzZSBpZiAoY2ggPT09IFwib1wiIHx8IGNoID09PSBcIk9cIikge1xuICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICByZXR1cm4gdGhpcy5zY2FuT2N0YWxMaXRlcmFsKHN0YXJ0KTtcbiAgICAgICAgfSBlbHNlIGlmIChcIjBcIiA8PSBjaCAmJiBjaCA8PSBcIjlcIikge1xuICAgICAgICAgIHJldHVybiB0aGlzLnNjYW5PY3RhbExpdGVyYWwoc3RhcnQpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gbmV3IE51bWVyaWNMaXRlcmFsVG9rZW4odGhpcy5nZXRTbGljZShzdGFydCkpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoY2ggIT09IFwiLlwiKSB7XG4gICAgICAvLyBNdXN0IGJlIFwiMScuLic5J1xuICAgICAgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICB3aGlsZSAoXCIwXCIgPD0gY2ggJiYgY2ggPD0gXCI5XCIpIHtcbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICBpZiAodGhpcy5pbmRleCA9PT0gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgICAgcmV0dXJuIG5ldyBOdW1lcmljTGl0ZXJhbFRva2VuKHRoaXMuZ2V0U2xpY2Uoc3RhcnQpKTtcbiAgICAgICAgfVxuICAgICAgICBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgZSA9IDA7XG4gICAgaWYgKGNoID09PSBcIi5cIikge1xuICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgaWYgKHRoaXMuaW5kZXggPT09IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gbmV3IE51bWVyaWNMaXRlcmFsVG9rZW4odGhpcy5nZXRTbGljZShzdGFydCkpO1xuICAgICAgfVxuXG4gICAgICBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgIHdoaWxlIChcIjBcIiA8PSBjaCAmJiBjaCA8PSBcIjlcIikge1xuICAgICAgICBlKys7XG4gICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgaWYgKHRoaXMuaW5kZXggPT09IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgICAgIHJldHVybiBuZXcgTnVtZXJpY0xpdGVyYWxUb2tlbih0aGlzLmdldFNsaWNlKHN0YXJ0KSk7XG4gICAgICAgIH1cbiAgICAgICAgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gRU9GIG5vdCByZWFjaGVkIGhlcmVcbiAgICBpZiAoY2ggPT09IFwiZVwiIHx8IGNoID09PSBcIkVcIikge1xuICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgaWYgKHRoaXMuaW5kZXggPT09IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgIH1cblxuICAgICAgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICBsZXQgbmVnID0gZmFsc2U7XG4gICAgICBpZiAoY2ggPT09IFwiK1wiIHx8IGNoID09PSBcIi1cIikge1xuICAgICAgICBuZWcgPSBjaCA9PT0gXCItXCI7XG4gICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgaWYgKHRoaXMuaW5kZXggPT09IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgICB9XG4gICAgICAgIGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgfVxuXG4gICAgICBsZXQgZiA9IDA7XG4gICAgICBpZiAoXCIwXCIgPD0gY2ggJiYgY2ggPD0gXCI5XCIpIHtcbiAgICAgICAgd2hpbGUgKFwiMFwiIDw9IGNoICYmIGNoIDw9IFwiOVwiKSB7XG4gICAgICAgICAgZiAqPSAxMDtcbiAgICAgICAgICBmICs9ICtjaDtcbiAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgaWYgKHRoaXMuaW5kZXggPT09IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgIH1cbiAgICAgIGUgKz0gbmVnID8gZiA6IC1mO1xuICAgIH1cblxuICAgIGlmIChpc0lkZW50aWZpZXJTdGFydChjaC5jaGFyQ29kZUF0KDApKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBOdW1lcmljTGl0ZXJhbFRva2VuKHRoaXMuZ2V0U2xpY2Uoc3RhcnQpKTtcbiAgfVxuXG4gIC8vIDcuOC40IFN0cmluZyBMaXRlcmFsc1xuICBzY2FuU3RyaW5nTGl0ZXJhbCgpIHtcbiAgICBsZXQgc3RyID0gXCJcIjtcblxuICAgIGxldCBxdW90ZSA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAvLyAgYXNzZXJ0KChxdW90ZSA9PT0gXCJcXFwiXCIgfHwgcXVvdGUgPT09IFwiXCJcIiksIFwiU3RyaW5nIGxpdGVyYWwgbXVzdCBzdGFydHMgd2l0aCBhIHF1b3RlXCIpXG5cbiAgICBsZXQgc3RhcnQgPSB0aGlzLmluZGV4O1xuICAgIHRoaXMuaW5kZXgrKztcblxuICAgIGxldCBvY3RhbCA9IGZhbHNlO1xuICAgIHdoaWxlICh0aGlzLmluZGV4IDwgdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICBsZXQgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICBpZiAoY2ggPT09IHF1b3RlKSB7XG4gICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgcmV0dXJuIG5ldyBTdHJpbmdMaXRlcmFsVG9rZW4odGhpcy5nZXRTbGljZShzdGFydCksIHN0ciwgb2N0YWwpO1xuICAgICAgfSBlbHNlIGlmIChjaCA9PT0gXCJcXFxcXCIpIHtcbiAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICBpZiAodGhpcy5pbmRleCA9PT0gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICAgIH1cbiAgICAgICAgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICAgIGlmICghaXNMaW5lVGVybWluYXRvcihjaC5jaGFyQ29kZUF0KDApKSkge1xuICAgICAgICAgIHN3aXRjaCAoY2gpIHtcbiAgICAgICAgICAgIGNhc2UgXCJuXCI6XG4gICAgICAgICAgICAgIHN0ciArPSBcIlxcblwiO1xuICAgICAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcInJcIjpcbiAgICAgICAgICAgICAgc3RyICs9IFwiXFxyXCI7XG4gICAgICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwidFwiOlxuICAgICAgICAgICAgICBzdHIgKz0gXCJcXHRcIjtcbiAgICAgICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJ1XCI6XG4gICAgICAgICAgICBjYXNlIFwieFwiOlxuICAgICAgICAgICAgICBsZXQgcmVzdG9yZSA9IHRoaXMuaW5kZXg7XG4gICAgICAgICAgICAgIGxldCB1bmVzY2FwZWQ7XG4gICAgICAgICAgICAgIHRoaXMuaW5kZXgrKztcbiAgICAgICAgICAgICAgaWYgKHRoaXMuaW5kZXggPj0gdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgdW5lc2NhcGVkID0gY2ggPT09IFwidVwiID8gdGhpcy5zY2FuSGV4RXNjYXBlNCgpIDogdGhpcy5zY2FuSGV4RXNjYXBlMigpO1xuICAgICAgICAgICAgICBpZiAodW5lc2NhcGVkID49IDApIHtcbiAgICAgICAgICAgICAgICBzdHIgKz0gU3RyaW5nLmZyb21DaGFyQ29kZSh1bmVzY2FwZWQpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuaW5kZXggPSByZXN0b3JlO1xuICAgICAgICAgICAgICAgIHN0ciArPSBjaDtcbiAgICAgICAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiYlwiOlxuICAgICAgICAgICAgICBzdHIgKz0gXCJcXGJcIjtcbiAgICAgICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJmXCI6XG4gICAgICAgICAgICAgIHN0ciArPSBcIlxcZlwiO1xuICAgICAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcInZcIjpcbiAgICAgICAgICAgICAgc3RyICs9IFwiXFx1MDAwQlwiO1xuICAgICAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgaWYgKFwiMFwiIDw9IGNoICYmIGNoIDw9IFwiN1wiKSB7XG4gICAgICAgICAgICAgICAgb2N0YWwgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGxldCBvY3RMZW4gPSAxO1xuICAgICAgICAgICAgICAgIC8vIDMgZGlnaXRzIGFyZSBvbmx5IGFsbG93ZWQgd2hlbiBzdHJpbmcgc3RhcnRzXG4gICAgICAgICAgICAgICAgLy8gd2l0aCAwLCAxLCAyLCAzXG4gICAgICAgICAgICAgICAgaWYgKFwiMFwiIDw9IGNoICYmIGNoIDw9IFwiM1wiKSB7XG4gICAgICAgICAgICAgICAgICBvY3RMZW4gPSAwO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBsZXQgY29kZSA9IDA7XG4gICAgICAgICAgICAgICAgd2hpbGUgKG9jdExlbiA8IDMgJiYgXCIwXCIgPD0gY2ggJiYgY2ggPD0gXCI3XCIpIHtcbiAgICAgICAgICAgICAgICAgIGNvZGUgKj0gODtcbiAgICAgICAgICAgICAgICAgIG9jdExlbisrO1xuICAgICAgICAgICAgICAgICAgY29kZSArPSBjaCAtIFwiMFwiO1xuICAgICAgICAgICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuaW5kZXggPT09IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzdHIgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShjb2RlKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzdHIgKz0gY2g7XG4gICAgICAgICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0ID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgICAgaWYgKGNoID09PSBcIlxcclwiICYmIHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KSA9PT0gXCJcXG5cIikge1xuICAgICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChpc0xpbmVUZXJtaW5hdG9yKGNoLmNoYXJDb2RlQXQoMCkpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlSUxMRUdBTCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RyICs9IGNoO1xuICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhyb3cgdGhpcy5jcmVhdGVJTExFR0FMKCk7XG4gIH1cblxuICBzY2FuUmVnRXhwKCkge1xuXG4gICAgbGV0IHN0YXJ0ID0gdGhpcy5pbmRleDtcbiAgICAvLyBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KVxuXG4gICAgbGV0IHN0ciA9IFwiXCI7XG4gICAgc3RyICs9IFwiL1wiO1xuICAgIHRoaXMuaW5kZXgrKztcblxuICAgIGxldCB0ZXJtaW5hdGVkID0gZmFsc2U7XG4gICAgbGV0IGNsYXNzTWFya2VyID0gZmFsc2U7XG4gICAgd2hpbGUgKHRoaXMuaW5kZXggPCB0aGlzLnNvdXJjZS5sZW5ndGgpIHtcbiAgICAgIGxldCBjaCA9IHRoaXMuc291cmNlLmNoYXJBdCh0aGlzLmluZGV4KTtcbiAgICAgIGlmIChjaCA9PT0gXCJcXFxcXCIpIHtcbiAgICAgICAgc3RyICs9IGNoO1xuICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICAgIGNoID0gdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpO1xuICAgICAgICAvLyBFQ01BLTI2MiA3LjguNVxuICAgICAgICBpZiAoaXNMaW5lVGVybWluYXRvcihjaC5jaGFyQ29kZUF0KDApKSkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTlRFUk1JTkFURURfUkVHX0VYUCk7XG4gICAgICAgIH1cbiAgICAgICAgc3RyICs9IGNoO1xuICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICB9IGVsc2UgaWYgKGlzTGluZVRlcm1pbmF0b3IoY2guY2hhckNvZGVBdCgwKSkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlVOVEVSTUlOQVRFRF9SRUdfRVhQKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChjbGFzc01hcmtlcikge1xuICAgICAgICAgIGlmIChjaCA9PT0gXCJdXCIpIHtcbiAgICAgICAgICAgIGNsYXNzTWFya2VyID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChjaCA9PT0gXCIvXCIpIHtcbiAgICAgICAgICAgIHRlcm1pbmF0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgc3RyICs9IGNoO1xuICAgICAgICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfSBlbHNlIGlmIChjaCA9PT0gXCJbXCIpIHtcbiAgICAgICAgICAgIGNsYXNzTWFya2VyID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgc3RyICs9IGNoO1xuICAgICAgICB0aGlzLmluZGV4Kys7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCF0ZXJtaW5hdGVkKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuVU5URVJNSU5BVEVEX1JFR19FWFApO1xuICAgIH1cblxuICAgIHdoaWxlICh0aGlzLmluZGV4IDwgdGhpcy5zb3VyY2UubGVuZ3RoKSB7XG4gICAgICBsZXQgY2ggPSB0aGlzLnNvdXJjZS5jaGFyQXQodGhpcy5pbmRleCk7XG4gICAgICBpZiAoIWlzSWRlbnRpZmllclBhcnQoY2guY2hhckNvZGVBdCgwKSkgJiYgY2ggIT09IFwiXFxcXFwiKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgdGhpcy5pbmRleCsrO1xuICAgICAgc3RyICs9IGNoO1xuICAgIH1cbiAgICB0aGlzLmxvb2thaGVhZEVuZCA9IHRoaXMuaW5kZXg7XG4gICAgcmV0dXJuIG5ldyBSZWd1bGFyRXhwcmVzc2lvbkxpdGVyYWxUb2tlbih0aGlzLmdldFNsaWNlKHN0YXJ0KSwgc3RyKTtcbiAgfVxuXG4gIGFkdmFuY2UoKSB7XG4gICAgbGV0IHN0YXJ0ID0gdGhpcy5pbmRleDtcbiAgICB0aGlzLnNraXBDb21tZW50KCk7XG4gICAgdGhpcy5sYXN0V2hpdGVzcGFjZSA9IHRoaXMuZ2V0U2xpY2Uoc3RhcnQpO1xuICAgIHRoaXMubG9va2FoZWFkU3RhcnQgPXN0YXJ0ID0gdGhpcy5pbmRleDtcblxuICAgIGlmICh0aGlzLmluZGV4ID49IHRoaXMuc291cmNlLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIG5ldyBFT0ZUb2tlbih0aGlzLmdldFNsaWNlKHN0YXJ0KSk7XG4gICAgfVxuXG4gICAgbGV0IGNoYXJDb2RlID0gdGhpcy5zb3VyY2UuY2hhckNvZGVBdCh0aGlzLmluZGV4KTtcblxuICAgIGlmIChjaGFyQ29kZSA8IDB4ODApIHtcbiAgICAgIGlmIChQVU5DVFVBVE9SX1NUQVJUW2NoYXJDb2RlXSkge1xuICAgICAgICByZXR1cm4gdGhpcy5zY2FuUHVuY3R1YXRvcigpO1xuICAgICAgfVxuXG4gICAgICBpZiAoSURFTlRJRklFUl9TVEFSVFtjaGFyQ29kZV0pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2NhbklkZW50aWZpZXIoKTtcbiAgICAgIH1cblxuICAgICAgLy8gRG90ICguKSBVKzAwMkUgY2FuIGFsc28gc3RhcnQgYSBmbG9hdGluZy1wb2xldCBudW1iZXIsIGhlbmNlIHRoZSBuZWVkXG4gICAgICAvLyB0byBjaGVjayB0aGUgbmV4dCBjaGFyYWN0ZXIuXG4gICAgICBpZiAoY2hhckNvZGUgPT09IDB4MDAyRSkge1xuICAgICAgICBpZiAodGhpcy5pbmRleCArIDEgPCB0aGlzLnNvdXJjZS5sZW5ndGggJiYgaXNEZWNpbWFsRGlnaXQodGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXggKyAxKSkpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5zY2FuTnVtZXJpY0xpdGVyYWwoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5zY2FuUHVuY3R1YXRvcigpO1xuICAgICAgfVxuXG4gICAgICAvLyBTdHJpbmcgbGl0ZXJhbCBzdGFydHMgd2l0aCBzaW5nbGUgcXVvdGUgKFUrMDAyNykgb3IgZG91YmxlIHF1b3RlIChVKzAwMjIpLlxuICAgICAgaWYgKGNoYXJDb2RlID09PSAweDAwMjcgfHwgY2hhckNvZGUgPT09IDB4MDAyMikge1xuICAgICAgICByZXR1cm4gdGhpcy5zY2FuU3RyaW5nTGl0ZXJhbCgpO1xuICAgICAgfVxuXG4gICAgICBpZiAoMHgwMDMwIC8qICcwJyAqLyA8PSBjaGFyQ29kZSAmJiBjaGFyQ29kZSA8PSAweDAwMzkgLyogJzknICovKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnNjYW5OdW1lcmljTGl0ZXJhbCgpO1xuICAgICAgfVxuXG4gICAgICAvLyBTbGFzaCAoLykgVSswMDJGIGNhbiBhbHNvIHN0YXJ0IGEgcmVnZXguXG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGlzSWRlbnRpZmllclN0YXJ0KGNoYXJDb2RlKSkge1xuICAgICAgICByZXR1cm4gdGhpcy5zY2FuSWRlbnRpZmllcigpO1xuICAgICAgfVxuXG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUlMTEVHQUwoKTtcbiAgICB9XG4gIH1cblxuICBlb2YoKSB7XG4gICAgcmV0dXJuIHRoaXMubG9va2FoZWFkLnR5cGUgPT09IFRva2VuVHlwZS5FT1M7XG4gIH1cblxuICBsZXgoKSB7XG4gICAgaWYgKHRoaXMucHJldlRva2VuICE9PSBudWxsICYmIHRoaXMucHJldlRva2VuLnR5cGUgPT09IFRva2VuVHlwZS5FT1MpIHtcbiAgICAgIHJldHVybiB0aGlzLnByZXZUb2tlbjtcbiAgICB9XG4gICAgdGhpcy5wcmV2VG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICBsZXQgc3RhcnQgPSB0aGlzLmluZGV4ID0gdGhpcy5sb29rYWhlYWRFbmQ7XG4gICAgdGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQgPSBmYWxzZTtcbiAgICB0aGlzLmxvb2thaGVhZCA9IHRoaXMuYWR2YW5jZSgpO1xuICAgIHRoaXMubG9va2FoZWFkRW5kID0gdGhpcy5pbmRleDtcbiAgICB0aGlzLmluZGV4ID0gc3RhcnQ7XG4gICAgdGhpcy50b2tlbkluZGV4Kys7XG4gICAgcmV0dXJuIHRoaXMucHJldlRva2VuO1xuICB9XG59XG4iXX0=