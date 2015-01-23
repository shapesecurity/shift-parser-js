"use strict";

var _toArray = function (arr) {
  return Array.isArray(arr) ? arr : Array.from(arr);
};

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

var Shift = require("shift-ast");

var isRestrictedWord = require("./utils").isRestrictedWord;
var isStrictModeReservedWordES5 = require("./utils").isStrictModeReservedWordES5;
var ErrorMessages = require("./errors").ErrorMessages;
var Tokenizer = require("./tokenizer")["default"];
var TokenClass = require("./tokenizer").TokenClass;
var TokenType = require("./tokenizer").TokenType;
var IdentifierToken = require("./tokenizer").IdentifierToken;
var IdentifierLikeToken = require("./tokenizer").IdentifierLikeToken;
var NumericLiteralToken = require("./tokenizer").NumericLiteralToken;
var StringLiteralToken = require("./tokenizer").StringLiteralToken;


var INIT_MASK = 1;
var GETTER_MASK = 2;
var SETTER_MASK = 4;

var STRICT_MODE_RESERVED_WORD = ["implements", "interface", "package", "private", "protected", "public", "static", "yield", "let"];

var Precedence = {
  Sequence: 0,
  Yield: 1,
  Assignment: 1,
  Conditional: 2,
  ArrowFunction: 2,
  LogicalOR: 3,
  LogicalAND: 4,
  BitwiseOR: 5,
  BitwiseXOR: 6,
  BitwiseAND: 7,
  Equality: 8,
  Relational: 9,
  BitwiseSHIFT: 10,
  Additive: 11,
  Multiplicative: 12,
  Unary: 13,
  Postfix: 14,
  Call: 15,
  New: 16,
  TaggedTemplate: 17,
  Member: 18,
  Primary: 19
};

var BinaryPrecedence = {
  "||": Precedence.LogicalOR,
  "&&": Precedence.LogicalAND,
  "|": Precedence.BitwiseOR,
  "^": Precedence.BitwiseXOR,
  "&": Precedence.BitwiseAND,
  "==": Precedence.Equality,
  "!=": Precedence.Equality,
  "===": Precedence.Equality,
  "!==": Precedence.Equality,
  "<": Precedence.Relational,
  ">": Precedence.Relational,
  "<=": Precedence.Relational,
  ">=": Precedence.Relational,
  "in": Precedence.Relational,
  "instanceof": Precedence.Relational,
  "<<": Precedence.BitwiseSHIFT,
  ">>": Precedence.BitwiseSHIFT,
  ">>>": Precedence.BitwiseSHIFT,
  "+": Precedence.Additive,
  "-": Precedence.Additive,
  "*": Precedence.Multiplicative,
  "%": Precedence.Multiplicative,
  "/": Precedence.Multiplicative
};

var Parser = (function (Tokenizer) {
  var Parser = function Parser(source) {
    Tokenizer.call(this, source);
    this.labelSet = Object.create(null);
    this.allowIn = true;
    this.inIteration = false;
    this.inSwitch = false;
    this.inFunctionBody = false;
  };

  _extends(Parser, Tokenizer);

  Parser.prototype.eat = function (tokenType) {
    if (this.lookahead.type === tokenType) {
      return this.lex();
    }
  };

  Parser.prototype.expect = function (tokenType) {
    if (this.lookahead.type === tokenType) {
      return this.lex();
    }
    throw this.createUnexpected(this.lookahead);
  };

  Parser.prototype.match = function (subType) {
    return this.lookahead.type === subType;
  };

  Parser.prototype.consumeSemicolon = function () {
    // Catch the very common case first: immediately a semicolon (U+003B).
    if (this.index < this.source.length && this.source.charAt(this.index) == ";") {
      this.lex();
      return;
    }

    this.index = this.lookahead.slice.start;
    if (this.hasLineTerminatorBeforeNext) {
      return;
    }

    if (this.match(TokenType.SEMICOLON)) {
      this.lex();
      return;
    }

    if (!this.eof() && !this.match(TokenType.RBRACE)) {
      throw this.createUnexpected(this.lookahead);
    }
  };

  Parser.prototype.markLocation = function (node, startTokenIndex, endTokenIndex) {
    if (endTokenIndex === undefined) endTokenIndex = this.tokenIndex;
    // TODO: mark the source locations.
    return node;
  };

  Parser.prototype.parseScript = function () {
    var _ref = this.parseBody(true);

    var _ref2 = _toArray(_ref);

    var body = _ref2[0];
    var isStrict = _ref2[1];
    return new Shift.Script(this.markLocation(body, 0));
  };

  Parser.prototype.parseFunctionBody = function () {
    var previousStrict = this.strict;
    var startTokenIndex = this.tokenIndex;

    var oldLabelSet = this.labelSet;
    var oldInIteration = this.inIteration;
    var oldInSwitch = this.inSwitch;
    var oldInFunctionBody = this.inFunctionBody;

    this.labelSet = Object.create(null);
    this.inIteration = false;
    this.inSwitch = false;
    this.inFunctionBody = true;

    this.expect(TokenType.LBRACE);
    var _ref3 = this.parseBody();

    var _ref4 = _toArray(_ref3);

    var body = _ref4[0];
    var isStrict = _ref4[1];
    this.expect(TokenType.RBRACE);

    body = this.markLocation(body, startTokenIndex);

    this.labelSet = oldLabelSet;
    this.inIteration = oldInIteration;
    this.inSwitch = oldInSwitch;
    this.inFunctionBody = oldInFunctionBody;
    this.strict = previousStrict;
    return [body, isStrict];
  };

  Parser.prototype.parseBody = function (acceptEOF) {
    if (acceptEOF === undefined) acceptEOF = false;
    var directives = [];
    var statements = [];
    var parsingDirectives = true;
    var isStrict = this.strict;
    var firstRestricted = null;
    while (true) {
      if (acceptEOF) {
        if (this.eof()) {
          break;
        }
      } else {
        if (this.match(TokenType.RBRACE)) {
          break;
        }
      }
      var token = this.lookahead;
      var text = token.slice.text;
      var isStringLiteral = token instanceof StringLiteralToken;
      var stmt = this.parseStatement();
      if (parsingDirectives) {
        if (isStringLiteral && stmt.type === "ExpressionStatement" && stmt.expression.type === "LiteralStringExpression") {
          if (text === "\"use strict\"" || text === "'use strict'") {
            isStrict = true;
            this.strict = true;
            if (firstRestricted != null) {
              throw this.createErrorWithToken(firstRestricted, ErrorMessages.STRICT_OCTAL_LITERAL);
            }
          } else if (firstRestricted == null && token.octal) {
            firstRestricted = token;
          }
          directives.push(new Shift.Directive(text.slice(1, -1)));
        } else {
          parsingDirectives = false;
          statements.push(stmt);
        }
      } else {
        statements.push(stmt);
      }
    }

    return [new Shift.FunctionBody(directives, statements), isStrict];
  };

  Parser.prototype.parseStatement = function () {
    var startTokenIndex = this.tokenIndex;
    if (this.eof()) {
      throw this.createUnexpected(this.lookahead);
    }
    switch (this.lookahead.type) {
      case TokenType.SEMICOLON:
        return this.markLocation(this.parseEmptyStatement(), startTokenIndex);
      case TokenType.LBRACE:
        return this.markLocation(this.parseBlockStatement(), startTokenIndex);
      case TokenType.LPAREN:
        return this.markLocation(this.parseExpressionStatement(), startTokenIndex);
      case TokenType.BREAK:
        return this.markLocation(this.parseBreakStatement(), startTokenIndex);
      case TokenType.CONTINUE:
        return this.markLocation(this.parseContinueStatement(), startTokenIndex);
      case TokenType.DEBUGGER:
        return this.markLocation(this.parseDebuggerStatement(), startTokenIndex);
      case TokenType.DO:
        return this.markLocation(this.parseDoWhileStatement(), startTokenIndex);
      case TokenType.FOR:
        return this.markLocation(this.parseForStatement(), startTokenIndex);
      case TokenType.FUNCTION:
        return this.markLocation(this.parseFunction(false), startTokenIndex);
      case TokenType.IF:
        return this.markLocation(this.parseIfStatement(), startTokenIndex);
      case TokenType.RETURN:
        return this.markLocation(this.parseReturnStatement(), startTokenIndex);
      case TokenType.SWITCH:
        return this.markLocation(this.parseSwitchStatement(), startTokenIndex);
      case TokenType.THROW:
        return this.markLocation(this.parseThrowStatement(), startTokenIndex);
      case TokenType.TRY:
        return this.markLocation(this.parseTryStatement(), startTokenIndex);
      case TokenType.VAR:
      case TokenType.LET:
      case TokenType.CONST:
        return this.markLocation(this.parseVariableDeclarationStatement(), startTokenIndex);
      case TokenType.WHILE:
        return this.markLocation(this.parseWhileStatement(), startTokenIndex);
      case TokenType.WITH:
        return this.markLocation(this.parseWithStatement(), startTokenIndex);
      default:
        {
          var expr = this.parseExpression();

          // 12.12 Labelled Statements;
          if (expr.type === "IdentifierExpression" && this.match(TokenType.COLON)) {
            this.lex();
            var key = "$" + expr.identifier.name;
            if ({}.hasOwnProperty.call(this.labelSet, key)) {
              throw this.createError(ErrorMessages.LABEL_REDECLARATION, expr.identifier.name);
            }

            this.labelSet[key] = true;
            var labeledBody = this.parseStatement();
            delete this.labelSet[key];
            return this.markLocation(new Shift.LabeledStatement(expr.identifier, labeledBody), startTokenIndex);
          } else {
            this.consumeSemicolon();
            return this.markLocation(new Shift.ExpressionStatement(expr), startTokenIndex);
          }
        }
    }
  };

  Parser.prototype.parseVariableIdentifier = function () {
    var startTokenIndex = this.tokenIndex;

    var token = this.lex();
    if (!(token instanceof IdentifierToken)) {
      throw this.createUnexpected(token);
    }

    return this.markLocation(new Shift.Identifier(token.value), startTokenIndex);
  };

  Parser.prototype.parseEmptyStatement = function () {
    this.expect(TokenType.SEMICOLON);
    return new Shift.EmptyStatement();
  };

  Parser.prototype.parseBlockStatement = function () {
    return new Shift.BlockStatement(this.parseBlock());
  };

  Parser.prototype.parseExpressionStatement = function () {
    var expr = this.parseExpression();
    this.consumeSemicolon();
    return new Shift.ExpressionStatement(expr);
  };

  Parser.prototype.parseBreakStatement = function () {
    var token = this.lookahead;
    this.expect(TokenType.BREAK);

    // Catch the very common case first: immediately a semicolon (U+003B).
    if (this.lookahead.type == TokenType.SEMICOLON) {
      this.lex();

      if (!(this.inIteration || this.inSwitch)) {
        throw this.createErrorWithToken(token, ErrorMessages.ILLEGAL_BREAK);
      }

      return new Shift.BreakStatement(null);
    }

    if (this.hasLineTerminatorBeforeNext) {
      if (!(this.inIteration || this.inSwitch)) {
        throw this.createErrorWithToken(token, ErrorMessages.ILLEGAL_BREAK);
      }

      return new Shift.BreakStatement(null);
    }

    var label = null;
    if (this.lookahead.type == TokenType.IDENTIFIER) {
      label = this.parseVariableIdentifier();

      var key = "$" + label.name;
      if (!{}.hasOwnProperty.call(this.labelSet, key)) {
        throw this.createError(ErrorMessages.UNKNOWN_LABEL, label.name);
      }
    }

    this.consumeSemicolon();

    if (label == null && !(this.inIteration || this.inSwitch)) {
      throw this.createErrorWithToken(token, ErrorMessages.ILLEGAL_BREAK);
    }

    return new Shift.BreakStatement(label);
  };

  Parser.prototype.parseContinueStatement = function () {
    var token = this.lookahead;
    this.expect(TokenType.CONTINUE);

    // Catch the very common case first: immediately a semicolon (U+003B).
    if (this.lookahead.type == TokenType.SEMICOLON) {
      this.lex();
      if (!this.inIteration) {
        throw this.createErrorWithToken(token, ErrorMessages.ILLEGAL_CONTINUE);
      }

      return new Shift.ContinueStatement(null);
    }

    if (this.hasLineTerminatorBeforeNext) {
      if (!this.inIteration) {
        throw this.createErrorWithToken(token, ErrorMessages.ILLEGAL_CONTINUE);
      }

      return new Shift.ContinueStatement(null);
    }

    var label = null;
    if (this.lookahead.type == TokenType.IDENTIFIER) {
      label = this.parseVariableIdentifier();

      var key = "$" + label.name;
      if (!{}.hasOwnProperty.call(this.labelSet, key)) {
        throw this.createError(ErrorMessages.UNKNOWN_LABEL, label.name);
      }
    }

    this.consumeSemicolon();
    if (!this.inIteration) {
      throw this.createErrorWithToken(token, ErrorMessages.ILLEGAL_CONTINUE);
    }

    return new Shift.ContinueStatement(label);
  };

  Parser.prototype.parseDebuggerStatement = function () {
    this.expect(TokenType.DEBUGGER);
    this.consumeSemicolon();
    return new Shift.DebuggerStatement();
  };

  Parser.prototype.parseDoWhileStatement = function () {
    this.expect(TokenType.DO);
    var oldInIteration = this.inIteration;
    this.inIteration = true;

    var body = this.parseStatement();
    this.inIteration = oldInIteration;

    this.expect(TokenType.WHILE);
    this.expect(TokenType.LPAREN);
    var test = this.parseExpression();
    this.expect(TokenType.RPAREN);
    if (this.match(TokenType.SEMICOLON)) {
      this.lex();
    }

    return new Shift.DoWhileStatement(body, test);
  };

  Parser.isLeftHandSide = function (expr) {
    switch (expr.type) {
      case "CallExpression":
      case "NewExpression":
      case "StaticMemberExpression":
      case "ComputedMemberExpression":
      case "ArrayExpression":
      case "FunctionExpression":
      case "IdentifierExpression":
      case "LiteralBooleanExpression":
      case "LiteralStringExpression":
      case "LiteralNullExpression":
      case "LiteralRegExpExpression":
      case "ObjectExpression":
      case "ThisExpression":
        return true;
    }
    return false;
  };

  Parser.prototype.parseForStatement = function () {
    this.expect(TokenType.FOR);
    this.expect(TokenType.LPAREN);
    var test = null;
    var right = null;
    if (this.match(TokenType.SEMICOLON)) {
      this.lex();
      if (!this.match(TokenType.SEMICOLON)) {
        test = this.parseExpression();
      }
      this.expect(TokenType.SEMICOLON);
      if (!this.match(TokenType.RPAREN)) {
        right = this.parseExpression();
      }
      return new Shift.ForStatement(null, test, right, this.getIteratorStatementEpilogue());
    } else {
      if (this.match(TokenType.VAR) || this.match(TokenType.LET)) {
        var previousAllowIn = this.allowIn;
        this.allowIn = false;
        var initDecl = this.parseVariableDeclaration();
        this.allowIn = previousAllowIn;

        if (initDecl.declarators.length === 1 && this.match(TokenType.IN)) {
          this.lex();
          right = this.parseExpression();
          return new Shift.ForInStatement(initDecl, right, this.getIteratorStatementEpilogue());
        } else {
          this.expect(TokenType.SEMICOLON);
          if (!this.match(TokenType.SEMICOLON)) {
            test = this.parseExpression();
          }
          this.expect(TokenType.SEMICOLON);
          if (!this.match(TokenType.RPAREN)) {
            right = this.parseExpression();
          }
          return new Shift.ForStatement(initDecl, test, right, this.getIteratorStatementEpilogue());
        }
      } else {
        var previousAllowIn = this.allowIn;
        this.allowIn = false;
        var init = this.parseExpression();
        this.allowIn = previousAllowIn;

        if (this.match(TokenType.IN)) {
          if (!Parser.isLeftHandSide(init)) {
            throw this.createError(ErrorMessages.INVALID_LHS_IN_FOR_IN);
          }

          this.lex();
          right = this.parseExpression();
          return new Shift.ForInStatement(init, right, this.getIteratorStatementEpilogue());
        } else {
          this.expect(TokenType.SEMICOLON);
          if (!this.match(TokenType.SEMICOLON)) {
            test = this.parseExpression();
          }
          this.expect(TokenType.SEMICOLON);
          if (!this.match(TokenType.RPAREN)) {
            right = this.parseExpression();
          }
          return new Shift.ForStatement(init, test, right, this.getIteratorStatementEpilogue());
        }
      }
    }
  };

  Parser.prototype.getIteratorStatementEpilogue = function () {
    this.expect(TokenType.RPAREN);
    var oldInIteration = this.inIteration;
    this.inIteration = true;
    var body = this.parseStatement();
    this.inIteration = oldInIteration;
    return body;
  };

  Parser.prototype.parseIfStatement = function () {
    this.expect(TokenType.IF);
    this.expect(TokenType.LPAREN);
    var test = this.parseExpression();

    this.expect(TokenType.RPAREN);
    var consequent = this.parseStatement();
    var alternate = null;
    if (this.match(TokenType.ELSE)) {
      this.lex();
      alternate = this.parseStatement();
    }
    return new Shift.IfStatement(test, consequent, alternate);
  };

  Parser.prototype.parseReturnStatement = function () {
    var argument = null;

    this.expect(TokenType.RETURN);
    if (!this.inFunctionBody) {
      throw this.createError(ErrorMessages.ILLEGAL_RETURN);
    }

    if (this.hasLineTerminatorBeforeNext) {
      return new Shift.ReturnStatement(null);
    }

    if (!this.match(TokenType.SEMICOLON)) {
      if (!this.match(TokenType.RBRACE) && !this.eof()) {
        argument = this.parseExpression();
      }
    }

    this.consumeSemicolon();
    return new Shift.ReturnStatement(argument);
  };

  Parser.prototype.parseWithStatement = function () {
    if (this.strict) {
      throw this.createError(ErrorMessages.STRICT_MODE_WITH);
    }

    this.expect(TokenType.WITH);
    this.expect(TokenType.LPAREN);
    var object = this.parseExpression();
    this.expect(TokenType.RPAREN);
    var body = this.parseStatement();

    return new Shift.WithStatement(object, body);
  };

  Parser.prototype.parseSwitchStatement = function () {
    this.expect(TokenType.SWITCH);
    this.expect(TokenType.LPAREN);
    var discriminant = this.parseExpression();
    this.expect(TokenType.RPAREN);
    this.expect(TokenType.LBRACE);

    if (this.match(TokenType.RBRACE)) {
      this.lex();
      return new Shift.SwitchStatement(discriminant, []);
    }
    var oldInSwitch = this.inSwitch;
    this.inSwitch = true;

    var cases = this.parseSwitchCases();

    if (this.match(TokenType.DEFAULT)) {
      var switchDefault = this.parseSwitchDefault();
      var postDefaultCases = this.parseSwitchCases();
      if (this.match(TokenType.DEFAULT)) {
        throw this.createError(ErrorMessages.MULTIPLE_DEFAULTS_IN_SWITCH);
      }
      this.inSwitch = oldInSwitch;
      this.expect(TokenType.RBRACE);
      return new Shift.SwitchStatementWithDefault(discriminant, cases, switchDefault, postDefaultCases);
    } else {
      this.inSwitch = oldInSwitch;
      this.expect(TokenType.RBRACE);
      return new Shift.SwitchStatement(discriminant, cases);
    }
  };

  Parser.prototype.parseSwitchCases = function () {
    var result = [];
    while (!(this.eof() || this.match(TokenType.RBRACE) || this.match(TokenType.DEFAULT))) {
      result.push(this.parseSwitchCase());
    }
    return result;
  };

  Parser.prototype.parseSwitchCase = function () {
    var startTokenIndex = this.tokenIndex;
    this.expect(TokenType.CASE);
    return this.markLocation(new Shift.SwitchCase(this.parseExpression(), this.parseSwitchCaseBody()), startTokenIndex);
  };

  Parser.prototype.parseSwitchDefault = function () {
    var startTokenIndex = this.tokenIndex;
    this.expect(TokenType.DEFAULT);
    return this.markLocation(new Shift.SwitchDefault(this.parseSwitchCaseBody()), startTokenIndex);
  };

  Parser.prototype.parseSwitchCaseBody = function () {
    this.expect(TokenType.COLON);
    return this.parseStatementListInSwitchCaseBody();
  };

  Parser.prototype.parseStatementListInSwitchCaseBody = function () {
    var result = [];
    while (!(this.eof() || this.match(TokenType.RBRACE) || this.match(TokenType.DEFAULT) || this.match(TokenType.CASE))) {
      result.push(this.parseStatement());
    }
    return result;
  };

  Parser.prototype.parseThrowStatement = function () {
    var token = this.expect(TokenType.THROW);

    if (this.hasLineTerminatorBeforeNext) {
      throw this.createErrorWithToken(token, ErrorMessages.NEWLINE_AFTER_THROW);
    }

    var argument = this.parseExpression();

    this.consumeSemicolon();

    return new Shift.ThrowStatement(argument);
  };

  Parser.prototype.parseTryStatement = function () {
    this.expect(TokenType.TRY);
    var block = this.parseBlock();

    if (this.match(TokenType.CATCH)) {
      var handler = this.parseCatchClause();
      if (this.match(TokenType.FINALLY)) {
        this.lex();
        var finalizer = this.parseBlock();
        return new Shift.TryFinallyStatement(block, handler, finalizer);
      }
      return new Shift.TryCatchStatement(block, handler);
    }

    if (this.match(TokenType.FINALLY)) {
      this.lex();
      var finalizer = this.parseBlock();
      return new Shift.TryFinallyStatement(block, null, finalizer);
    } else {
      throw this.createError(ErrorMessages.NO_CATCH_OR_FINALLY);
    }
  };

  Parser.prototype.parseVariableDeclarationStatement = function () {
    var declaration = this.parseVariableDeclaration();
    this.consumeSemicolon();
    return new Shift.VariableDeclarationStatement(declaration);
  };

  Parser.prototype.parseWhileStatement = function () {
    this.expect(TokenType.WHILE);
    this.expect(TokenType.LPAREN);
    return new Shift.WhileStatement(this.parseExpression(), this.getIteratorStatementEpilogue());
  };

  Parser.prototype.parseCatchClause = function () {
    var startTokenIndex = this.tokenIndex;

    this.expect(TokenType.CATCH);
    this.expect(TokenType.LPAREN);
    if (this.match(TokenType.RPAREN)) {
      throw this.createUnexpected(this.lookahead);
    }

    var param = this.parseVariableIdentifier();

    // 12.14.1;
    if (this.strict && isRestrictedWord(param.name)) {
      throw this.createError(ErrorMessages.STRICT_CATCH_VARIABLE);
    }

    this.expect(TokenType.RPAREN);

    var body = this.parseBlock();

    return this.markLocation(new Shift.CatchClause(param, body), startTokenIndex);
  };

  Parser.prototype.parseBlock = function () {
    var startTokenIndex = this.tokenIndex;
    this.expect(TokenType.LBRACE);

    var body = [];
    while (!this.match(TokenType.RBRACE)) {
      body.push(this.parseStatement());
    }
    this.expect(TokenType.RBRACE);

    return this.markLocation(new Shift.Block(body), startTokenIndex);
  };

  Parser.prototype.parseVariableDeclaration = function () {
    var startTokenIndex = this.tokenIndex;
    var token = this.lex();

    // Preceded by this.match(TokenSubType.VAR) || this.match(TokenSubType.LET);
    var kind = token.type == TokenType.VAR ? "var" : token.type === TokenType.CONST ? "const" : "let";
    var declarators = this.parseVariableDeclaratorList(kind);
    return this.markLocation(new Shift.VariableDeclaration(kind, declarators), startTokenIndex);
  };

  Parser.prototype.parseVariableDeclaratorList = function (kind) {
    var result = [];
    while (true) {
      result.push(this.parseVariableDeclarator(kind));
      if (!this.eat(TokenType.COMMA)) {
        return result;
      }
    }
  };

  Parser.prototype.parseVariableDeclarator = function (kind) {
    var startTokenIndex = this.tokenIndex;

    var id = this.parseVariableIdentifier();

    // 12.2.1;
    if (this.strict && isRestrictedWord(id.name)) {
      throw this.createError(ErrorMessages.STRICT_VAR_NAME);
    }

    var init = null;
    if (kind == "const") {
      this.expect(TokenType.ASSIGN);
      init = this.parseAssignmentExpression();
    } else if (this.match(TokenType.ASSIGN)) {
      this.lex();
      init = this.parseAssignmentExpression();
    }
    return this.markLocation(new Shift.VariableDeclarator(id, init), startTokenIndex);
  };

  Parser.prototype.parseExpression = function () {
    var startTokenIndex = this.tokenIndex;

    var expr = this.parseAssignmentExpression();

    if (this.match(TokenType.COMMA)) {
      while (!this.eof()) {
        if (!this.match(TokenType.COMMA)) {
          break;
        }
        this.lex();
        expr = this.markLocation(new Shift.BinaryExpression(",", expr, this.parseAssignmentExpression()), startTokenIndex);
      }
    }
    return expr;
  };

  Parser.prototype.parseAssignmentExpression = function () {
    var token = this.lookahead;
    var startTokenIndex = this.tokenIndex;

    var isParenthesised = token.type === TokenType.LPAREN;
    var node = this.parseConditionalExpression();

    var isOperator = false;
    var operator = this.lookahead;
    switch (operator.type) {
      case TokenType.ASSIGN:
      case TokenType.ASSIGN_BIT_OR:
      case TokenType.ASSIGN_BIT_XOR:
      case TokenType.ASSIGN_BIT_AND:
      case TokenType.ASSIGN_SHL:
      case TokenType.ASSIGN_SHR:
      case TokenType.ASSIGN_SHR_UNSIGNED:
      case TokenType.ASSIGN_ADD:
      case TokenType.ASSIGN_SUB:
      case TokenType.ASSIGN_MUL:
      case TokenType.ASSIGN_DIV:
      case TokenType.ASSIGN_MOD:
        isOperator = true;
        break;
    }

    if (isOperator) {
      if (!isParenthesised && !Parser.isLeftHandSide(node)) {
        throw this.createError(ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
      }

      // 11.13.1;
      if (node.type === "IdentifierExpression") {
        if (this.strict && isRestrictedWord(node.identifier.name)) {
          throw this.createErrorWithToken(token, ErrorMessages.STRICT_LHS_ASSIGNMENT);
        }
      }

      this.lex();
      var right = this.parseAssignmentExpression();
      return this.markLocation(new Shift.AssignmentExpression(operator.type.name, node, right), startTokenIndex);
    }
    return node;
  };

  Parser.prototype.parseConditionalExpression = function () {
    var startTokenIndex = this.tokenIndex;
    var expr = this.parseBinaryExpression();
    if (this.match(TokenType.CONDITIONAL)) {
      this.lex();
      var previousAllowIn = this.allowIn;
      this.allowIn = true;
      var consequent = this.parseAssignmentExpression();
      this.allowIn = previousAllowIn;
      this.expect(TokenType.COLON);
      var alternate = this.parseAssignmentExpression();
      return this.markLocation(new Shift.ConditionalExpression(expr, consequent, alternate), startTokenIndex);
    }

    return expr;
  };

  Parser.prototype.isBinaryOperator = function (type) {
    switch (type) {
      case TokenType.OR:
      case TokenType.AND:
      case TokenType.BIT_OR:
      case TokenType.BIT_XOR:
      case TokenType.BIT_AND:
      case TokenType.EQ:
      case TokenType.NE:
      case TokenType.EQ_STRICT:
      case TokenType.NE_STRICT:
      case TokenType.LT:
      case TokenType.GT:
      case TokenType.LTE:
      case TokenType.GTE:
      case TokenType.INSTANCEOF:
      case TokenType.SHL:
      case TokenType.SHR:
      case TokenType.SHR_UNSIGNED:
      case TokenType.ADD:
      case TokenType.SUB:
      case TokenType.MUL:
      case TokenType.DIV:
      case TokenType.MOD:
        return true;
      case TokenType.IN:
        return this.allowIn;
      default:
        return false;
    }
  };

  Parser.prototype.parseBinaryExpression = function () {
    var _this = this;
    var left = this.parseUnaryExpression();
    var operator = this.lookahead.type;

    var _isBinaryOperator = this.isBinaryOperator(operator);
    if (!_isBinaryOperator) {
      return left;
    }

    this.lex();
    var stack = [];
    stack.push({ startIndex: this.tokenIndex, left: left, operator: operator, precedence: BinaryPrecedence[operator.name] });
    var right = this.parseUnaryExpression();

    operator = this.lookahead.type;
    _isBinaryOperator = this.isBinaryOperator(this.lookahead.type);
    while (_isBinaryOperator) {
      var precedence = BinaryPrecedence[operator.name];
      // Reduce: make a binary expression from the three topmost entries.
      while (stack.length && (precedence <= stack[stack.length - 1].precedence)) {
        var stackItem = stack[stack.length - 1];
        var stackOperator = stackItem.operator;
        left = stackItem.left;
        stack.pop();
        right = this.markLocation(new Shift.BinaryExpression(stackOperator.name, left, right), stackItem.startIndex, this.tokenIndex);
      }

      // Shift.
      this.lex();
      stack.push({ startIndex: this.tokenIndex, left: right, operator: operator, precedence: precedence });
      right = this.parseUnaryExpression();

      operator = this.lookahead.type;
      _isBinaryOperator = this.isBinaryOperator(operator);
    }

    // Final reduce to clean-up the stack.
    return stack.reduceRight(function (expr, stackItem) {
      return _this.markLocation(new Shift.BinaryExpression(stackItem.operator.name, stackItem.left, expr), stackItem.startIndex, _this.tokenIndex);
    }, right);
  };

  Parser.isPrefixOperator = function (type) {
    switch (type) {
      case TokenType.INC:
      case TokenType.DEC:
      case TokenType.ADD:
      case TokenType.SUB:
      case TokenType.BIT_NOT:
      case TokenType.NOT:
      case TokenType.DELETE:
      case TokenType.VOID:
      case TokenType.TYPEOF:
        return true;
    }
    return false;
  };

  Parser.prototype.parseUnaryExpression = function () {
    if (this.lookahead.type.klass != TokenClass.Punctuator && this.lookahead.type.klass != TokenClass.Keyword) {
      return this.parsePostfixExpression();
    }
    var startTokenIndex = this.tokenIndex;
    var operator = this.lookahead;
    if (!Parser.isPrefixOperator(operator.type)) {
      return this.parsePostfixExpression();
    }
    this.lex();
    var expr = this.parseUnaryExpression();
    switch (operator.type) {
      case TokenType.INC:
      case TokenType.DEC:
        // 11.4.4, 11.4.5;
        if (expr.type === "IdentifierExpression") {
          if (this.strict && isRestrictedWord(expr.identifier.name)) {
            throw this.createError(ErrorMessages.STRICT_LHS_PREFIX);
          }
        }

        if (!Parser.isLeftHandSide(expr)) {
          throw this.createError(ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
        }
        break;
      case TokenType.DELETE:
        if (expr.type === "IdentifierExpression" && this.strict) {
          throw this.createError(ErrorMessages.STRICT_DELETE);
        }
        break;
      default:
        break;
    }

    return this.markLocation(new Shift.PrefixExpression(operator.value, expr), startTokenIndex);
  };

  Parser.prototype.parsePostfixExpression = function () {
    var startTokenIndex = this.tokenIndex;

    var expr = this.parseLeftHandSideExpressionAllowCall();

    if (this.hasLineTerminatorBeforeNext) {
      return expr;
    }

    var operator = this.lookahead;
    if ((operator.type !== TokenType.INC) && (operator.type !== TokenType.DEC)) {
      return expr;
    }
    this.lex();
    // 11.3.1, 11.3.2;
    if (expr.type === "IdentifierExpression") {
      if (this.strict && isRestrictedWord(expr.identifier.name)) {
        throw this.createError(ErrorMessages.STRICT_LHS_POSTFIX);
      }
    }
    if (!Parser.isLeftHandSide(expr)) {
      throw this.createError(ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
    }
    return this.markLocation(new Shift.PostfixExpression(expr, operator.value), startTokenIndex);
  };

  Parser.prototype.parseLeftHandSideExpressionAllowCall = function () {
    var startTokenIndex = this.tokenIndex;
    var previousAllowIn = this.allowIn;
    this.allowIn = true;
    var expr = this.match(TokenType.NEW) ? this.parseNewExpression() : this.parsePrimaryExpression();

    while (true) {
      if (this.match(TokenType.LPAREN)) {
        expr = this.markLocation(new Shift.CallExpression(expr, this.parseArgumentList()), startTokenIndex);
      } else if (this.match(TokenType.LBRACK)) {
        expr = this.markLocation(new Shift.ComputedMemberExpression(expr, this.parseComputedMember()), startTokenIndex);
      } else if (this.match(TokenType.PERIOD)) {
        expr = this.markLocation(new Shift.StaticMemberExpression(expr, this.parseNonComputedMember()), startTokenIndex);
      } else {
        break;
      }
    }

    this.allowIn = previousAllowIn;

    return expr;
  };

  Parser.prototype.parseLeftHandSideExpression = function () {
    var startTokenIndex = this.tokenIndex;

    var expr = this.match(TokenType.NEW) ? this.parseNewExpression() : this.parsePrimaryExpression();

    while (this.match(TokenType.PERIOD) || this.match(TokenType.LBRACK)) {
      expr = this.markLocation(this.match(TokenType.LBRACK) ? new Shift.ComputedMemberExpression(expr, this.parseComputedMember()) : new Shift.StaticMemberExpression(expr, this.parseNonComputedMember()), startTokenIndex);
    }

    return expr;
  };

  Parser.prototype.parseNonComputedMember = function () {
    this.expect(TokenType.PERIOD);
    return this.parseNonComputedProperty();
  };

  Parser.prototype.parseComputedMember = function () {
    this.expect(TokenType.LBRACK);
    var expr = this.parseExpression();
    this.expect(TokenType.RBRACK);
    return expr;
  };

  Parser.prototype.parseNewExpression = function () {
    var startTokenIndex = this.tokenIndex;
    this.expect(TokenType.NEW);
    var callee = this.parseLeftHandSideExpression();
    return this.markLocation(new Shift.NewExpression(callee, this.match(TokenType.LPAREN) ? this.parseArgumentList() : []), startTokenIndex);
  };

  Parser.prototype.parsePrimaryExpression = function () {
    if (this.match(TokenType.LPAREN)) {
      return this.parseGroupExpression();
    }

    var startTokenIndex = this.tokenIndex;

    switch (this.lookahead.type.klass) {
      case TokenClass.Ident:
        return this.markLocation(new Shift.IdentifierExpression(this.parseIdentifier()), startTokenIndex);
      case TokenClass.StringLiteral:
        return this.parseStringLiteral();
      case TokenClass.NumericLiteral:
        return this.parseNumericLiteral();
      case TokenClass.Keyword:
        {
          if (this.match(TokenType.THIS)) {
            this.lex();
            return this.markLocation(new Shift.ThisExpression(), startTokenIndex);
          }
          if (this.match(TokenType.FUNCTION)) {
            return this.markLocation(this.parseFunction(true), startTokenIndex);
          }
          break;
        }
      case TokenClass.BooleanLiteral:
        {
          var token = this.lex();
          return this.markLocation(new Shift.LiteralBooleanExpression(token.type == TokenType.TRUE_LITERAL), startTokenIndex);
        }
      case TokenClass.NullLiteral:
        {
          this.lex();
          return this.markLocation(new Shift.LiteralNullExpression(), startTokenIndex);
        }
      default:
        if (this.match(TokenType.LBRACK)) {
          return this.parseArrayExpression();
        } else if (this.match(TokenType.LBRACE)) {
          return this.parseObjectExpression();
        } else if (this.match(TokenType.DIV) || this.match(TokenType.ASSIGN_DIV)) {
          this.skipComment();
          this.lookahead = this.scanRegExp();
          var token = this.lex();
          try {
            var lastSlash = token.value.lastIndexOf("/");
            RegExp(token.value.slice(1, lastSlash), token.value.slice(lastSlash + 1));
          } catch (unused) {
            throw this.createErrorWithToken(token, ErrorMessages.INVALID_REGULAR_EXPRESSION);
          }
          return this.markLocation(new Shift.LiteralRegExpExpression(token.value), startTokenIndex);
        }
    }

    throw this.createUnexpected(this.lex());
  };

  Parser.prototype.parseNumericLiteral = function () {
    var startTokenIndex = this.tokenIndex;
    if (this.strict && this.lookahead.octal) {
      throw this.createErrorWithToken(this.lookahead, ErrorMessages.STRICT_OCTAL_LITERAL);
    }
    var token2 = this.lex();
    var node = token2._value === 1 / 0 ? new Shift.LiteralInfinityExpression() : new Shift.LiteralNumericExpression(token2._value);
    return this.markLocation(node, startTokenIndex);
  };

  Parser.prototype.parseStringLiteral = function () {
    var startTokenIndex = this.tokenIndex;
    if (this.strict && this.lookahead.octal) {
      throw this.createErrorWithToken(this.lookahead, ErrorMessages.STRICT_OCTAL_LITERAL);
    }
    var token2 = this.lex();
    return this.markLocation(new Shift.LiteralStringExpression(token2._value, token2.slice.text), startTokenIndex);
  };

  Parser.prototype.parseIdentifier = function () {
    var startTokenIndex = this.tokenIndex;
    return this.markLocation(new Shift.Identifier(this.lex().value), startTokenIndex);
  };

  Parser.prototype.parseArgumentList = function () {
    this.expect(TokenType.LPAREN);
    var args = this.parseArguments();
    this.expect(TokenType.RPAREN);
    return args;
  };

  Parser.prototype.parseArguments = function () {
    var result = [];
    while (true) {
      if (this.match(TokenType.RPAREN) || this.eof()) {
        return result;
      }
      var arg = this.parseAssignmentExpression();
      result.push(arg);
      if (!this.eat(TokenType.COMMA)) {
        break;
      }
    }
    return result;
  };

  Parser.prototype.parseNonComputedProperty = function () {
    var startTokenIndex = this.tokenIndex;

    var token = this.lex();

    if (!(token instanceof IdentifierLikeToken)) {
      throw this.createUnexpected(token);
    } else {
      return this.markLocation(new Shift.Identifier(token.value), startTokenIndex);
    }
  };

  Parser.prototype.parseGroupExpression = function () {
    this.expect(TokenType.LPAREN);
    var expr = this.parseExpression();
    this.expect(TokenType.RPAREN);
    return expr;
  };

  Parser.prototype.parseArrayExpression = function () {
    var startTokenIndex = this.tokenIndex;

    this.expect(TokenType.LBRACK);

    var elements = this.parseArrayExpressionElements();

    this.expect(TokenType.RBRACK);

    return this.markLocation(new Shift.ArrayExpression(elements), startTokenIndex);
  };

  Parser.prototype.parseArrayExpressionElements = function () {
    var result = [];
    while (true) {
      if (this.match(TokenType.RBRACK)) {
        return result;
      }
      var el = undefined;

      if (this.match(TokenType.COMMA)) {
        this.lex();
        el = null;
      } else {
        el = this.parseAssignmentExpression();
        if (!this.match(TokenType.RBRACK)) {
          this.expect(TokenType.COMMA);
        }
      }
      result.push(el);
    }
  };

  Parser.prototype.parseObjectExpression = function () {
    var startTokenIndex = this.tokenIndex;

    this.expect(TokenType.LBRACE);

    var propertyMap = Object.create(null);
    var properties = this.parseObjectExpressionItems(propertyMap);

    this.expect(TokenType.RBRACE);

    return this.markLocation(new Shift.ObjectExpression(properties), startTokenIndex);
  };

  Parser.prototype.parseObjectExpressionItems = function (propertyMap) {
    var result = [];
    while (!this.match(TokenType.RBRACE)) {
      result.push(this.parseObjectExpressionItem(propertyMap));
    }
    return result;
  };

  Parser.prototype.parseObjectExpressionItem = function (propertyMap) {
    var property = this.parseObjectProperty();
    var type = property.type;
    var key = "$" + property.name.value;
    var value = {}.hasOwnProperty.call(propertyMap, key) ? propertyMap[key] : 0;

    if ({}.hasOwnProperty.call(propertyMap, key)) {
      if ((value & INIT_MASK) !== 0) {
        if (this.strict && type === "DataProperty" || key == "$__proto__") {
          throw this.createError(ErrorMessages.STRICT_DUPLICATE_PROPERTY);
        } else if (type !== "DataProperty") {
          throw this.createError(ErrorMessages.ACCESSOR_DATA_PROPERTY);
        }
      } else {
        if (type === "DataProperty") {
          throw this.createError(ErrorMessages.ACCESSOR_DATA_PROPERTY);
        } else if ((value & GETTER_MASK) !== 0 && type == "Getter" || (value & SETTER_MASK) !== 0 && type == "Setter") {
          throw this.createError(ErrorMessages.ACCESSOR_GET_SET);
        }
      }
    }
    switch (type) {
      case "DataProperty":
        propertyMap[key] = value | INIT_MASK;
        break;
      case "Getter":
        propertyMap[key] = value | GETTER_MASK;
        break;
      case "Setter":
        propertyMap[key] = value | SETTER_MASK;
        break;
    }

    if (!this.match(TokenType.RBRACE)) {
      this.expect(TokenType.COMMA);
    }
    return property;
  };

  Parser.prototype.parseObjectPropertyKey = function () {
    var token = this.lookahead;

    // Note: This function is called only from parseObjectProperty(), where;
    // Eof and Punctuator tokens are already filtered out.

    if (token instanceof StringLiteralToken) {
      return new Shift.StaticPropertyName(this.parseStringLiteral().value);
    }
    if (token instanceof NumericLiteralToken) {
      var numLiteral = this.parseNumericLiteral();
      return new Shift.StaticPropertyName("" + (numLiteral.type === "LiteralInfinityExpression" ? 1 / 0 : numLiteral.value));
    }
    if (token instanceof IdentifierLikeToken) {
      return new Shift.StaticPropertyName(this.parseIdentifier().name);
    }

    throw this.createError(ErrorMessages.INVALID_PROPERTY_NAME);
  };

  Parser.prototype.parseObjectProperty = function () {
    var token = this.lookahead;
    var startTokenIndex = this.tokenIndex;

    if (token.type === TokenType.IDENTIFIER) {
      var key = this.parseObjectPropertyKey();
      var name = token.value;
      if (name.length === 3) {
        // Property Assignment: Getter and Setter.
        if ("get" === name && !this.match(TokenType.COLON)) {
          key = this.parseObjectPropertyKey();
          this.expect(TokenType.LPAREN);
          this.expect(TokenType.RPAREN);
          var _ref5 = this.parseFunctionBody();

          var _ref6 = _toArray(_ref5);

          var body = _ref6[0];
          var isStrict = _ref6[1];
          return this.markLocation(new Shift.Getter(key, body), startTokenIndex);
        } else if ("set" === name && !this.match(TokenType.COLON)) {
          key = this.parseObjectPropertyKey();
          this.expect(TokenType.LPAREN);
          token = this.lookahead;
          if (token.type !== TokenType.IDENTIFIER) {
            this.expect(TokenType.RPAREN);
            throw this.createErrorWithToken(token, ErrorMessages.UNEXPECTED_TOKEN, token.type.name);
          } else {
            var param = this.parseVariableIdentifier();
            this.expect(TokenType.RPAREN);
            var _ref7 = this.parseFunctionBody();

            var _ref8 = _toArray(_ref7);

            var body = _ref8[0];
            var isStrict = _ref8[1];
            if ((this.strict || isStrict) && isRestrictedWord(param.name)) {
              throw this.createError(ErrorMessages.STRICT_PARAM_NAME);
            }
            return this.markLocation(new Shift.Setter(key, param, body), startTokenIndex);
          }
        }
      }

      this.expect(TokenType.COLON);
      var value = this.parseAssignmentExpression();
      return this.markLocation(new Shift.DataProperty(key, value), startTokenIndex);
    }
    if (this.eof() || token.type.klass == TokenClass.Punctuator) {
      throw this.createUnexpected(token);
    } else {
      var key = this.parseObjectPropertyKey();
      this.expect(TokenType.COLON);
      var value = this.parseAssignmentExpression();
      return this.markLocation(new Shift.DataProperty(key, value), startTokenIndex);
    }
  };

  Parser.prototype.parseFunction = function (isExpression) {
    var startTokenIndex = this.tokenIndex;

    this.expect(TokenType.FUNCTION);

    var id = null;
    var message = null;
    var firstRestricted = null;
    if (!isExpression || !this.match(TokenType.LPAREN)) {
      var token = this.lookahead;
      id = this.parseVariableIdentifier();
      if (this.strict) {
        if (isRestrictedWord(id.name)) {
          throw this.createErrorWithToken(token, ErrorMessages.STRICT_FUNCTION_NAME);
        }
      } else {
        if (isRestrictedWord(id.name)) {
          firstRestricted = token;
          message = ErrorMessages.STRICT_FUNCTION_NAME;
        } else if (isStrictModeReservedWordES5(id.name)) {
          firstRestricted = token;
          message = ErrorMessages.STRICT_RESERVED_WORD;
        }
      }
    }
    var info = this.parseParams(firstRestricted);

    if (info.message != null) {
      message = info.message;
    }

    var previousStrict = this.strict;
    var _ref9 = this.parseFunctionBody();

    var _ref10 = _toArray(_ref9);

    var body = _ref10[0];
    var isStrict = _ref10[1];
    if (message != null) {
      if ((this.strict || isStrict) && info.firstRestricted != null) {
        throw this.createErrorWithToken(info.firstRestricted, message);
      }
      if ((this.strict || isStrict) && info.stricted != null) {
        throw this.createErrorWithToken(info.stricted, message);
      }
    }
    this.strict = previousStrict;
    return this.markLocation(new (isExpression ? Shift.FunctionExpression : Shift.FunctionDeclaration)(false, id, info.params, null, body), startTokenIndex);
  };

  Parser.prototype.parseParams = function (fr) {
    var info = { params: [] };
    info.firstRestricted = fr;
    this.expect(TokenType.LPAREN);

    if (!this.match(TokenType.RPAREN)) {
      var paramSet = Object.create(null);

      while (!this.eof()) {
        var token = this.lookahead;
        var param = this.parseVariableIdentifier();
        var key = "$" + param.name;
        if (this.strict) {
          if (token instanceof IdentifierLikeToken && isRestrictedWord(param.name)) {
            info.stricted = token;
            info.message = ErrorMessages.STRICT_PARAM_NAME;
          }
          if ({}.hasOwnProperty.call(paramSet, key)) {
            info.stricted = token;
            info.message = ErrorMessages.STRICT_PARAM_DUPE;
          }
        } else if (info.firstRestricted == null) {
          if (token instanceof IdentifierLikeToken && isRestrictedWord(param.name)) {
            info.firstRestricted = token;
            info.message = ErrorMessages.STRICT_PARAM_NAME;
          } else if (STRICT_MODE_RESERVED_WORD.indexOf(param.name) !== -1) {
            info.firstRestricted = token;
            info.message = ErrorMessages.STRICT_RESERVED_WORD;
          } else if ({}.hasOwnProperty.call(paramSet, key)) {
            info.firstRestricted = token;
            info.message = ErrorMessages.STRICT_PARAM_DUPE;
          }
        }
        info.params.push(param);
        paramSet[key] = true;
        if (this.match(TokenType.RPAREN)) {
          break;
        }
        this.expect(TokenType.COMMA);
      }
    }

    this.expect(TokenType.RPAREN);
    return info;
  };

  return Parser;
})(Tokenizer);

exports.Parser = Parser;
//# sourceMappingURL=data:application/json;base64,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Z2h0IDIwMTQgU2hhcGUgU2VjdXJpdHksIEluYy5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpXG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqL1xuXG5pbXBvcnQgKiBhcyBTaGlmdCBmcm9tIFwic2hpZnQtYXN0XCI7XG5cbmltcG9ydCB7aXNSZXN0cmljdGVkV29yZCwgaXNTdHJpY3RNb2RlUmVzZXJ2ZWRXb3JkRVM1fSBmcm9tIFwiLi91dGlsc1wiO1xuXG5pbXBvcnQge0Vycm9yTWVzc2FnZXN9IGZyb20gXCIuL2Vycm9yc1wiO1xuXG5pbXBvcnQgVG9rZW5pemVyLCB7XG4gICAgVG9rZW5DbGFzcyxcbiAgICBUb2tlblR5cGUsXG4gICAgSWRlbnRpZmllclRva2VuLFxuICAgIElkZW50aWZpZXJMaWtlVG9rZW4sXG4gICAgTnVtZXJpY0xpdGVyYWxUb2tlbixcbiAgICBTdHJpbmdMaXRlcmFsVG9rZW59IGZyb20gXCIuL3Rva2VuaXplclwiO1xuXG5jb25zdCBJTklUX01BU0sgPSAxO1xuY29uc3QgR0VUVEVSX01BU0sgPSAyO1xuY29uc3QgU0VUVEVSX01BU0sgPSA0O1xuXG5jb25zdCBTVFJJQ1RfTU9ERV9SRVNFUlZFRF9XT1JEID0gW1xuICBcImltcGxlbWVudHNcIiwgXCJpbnRlcmZhY2VcIiwgXCJwYWNrYWdlXCIsIFwicHJpdmF0ZVwiLCBcInByb3RlY3RlZFwiLCBcInB1YmxpY1wiLCBcInN0YXRpY1wiLCBcInlpZWxkXCIsIFwibGV0XCJdO1xuXG5jb25zdCBQcmVjZWRlbmNlID0ge1xuICBTZXF1ZW5jZTogMCxcbiAgWWllbGQ6IDEsXG4gIEFzc2lnbm1lbnQ6IDEsXG4gIENvbmRpdGlvbmFsOiAyLFxuICBBcnJvd0Z1bmN0aW9uOiAyLFxuICBMb2dpY2FsT1I6IDMsXG4gIExvZ2ljYWxBTkQ6IDQsXG4gIEJpdHdpc2VPUjogNSxcbiAgQml0d2lzZVhPUjogNixcbiAgQml0d2lzZUFORDogNyxcbiAgRXF1YWxpdHk6IDgsXG4gIFJlbGF0aW9uYWw6IDksXG4gIEJpdHdpc2VTSElGVDogMTAsXG4gIEFkZGl0aXZlOiAxMSxcbiAgTXVsdGlwbGljYXRpdmU6IDEyLFxuICBVbmFyeTogMTMsXG4gIFBvc3RmaXg6IDE0LFxuICBDYWxsOiAxNSxcbiAgTmV3OiAxNixcbiAgVGFnZ2VkVGVtcGxhdGU6IDE3LFxuICBNZW1iZXI6IDE4LFxuICBQcmltYXJ5OiAxOVxufTtcblxuY29uc3QgQmluYXJ5UHJlY2VkZW5jZSA9IHtcbiAgXCJ8fFwiOiBQcmVjZWRlbmNlLkxvZ2ljYWxPUixcbiAgXCImJlwiOiBQcmVjZWRlbmNlLkxvZ2ljYWxBTkQsXG4gIFwifFwiOiBQcmVjZWRlbmNlLkJpdHdpc2VPUixcbiAgXCJeXCI6IFByZWNlZGVuY2UuQml0d2lzZVhPUixcbiAgXCImXCI6IFByZWNlZGVuY2UuQml0d2lzZUFORCxcbiAgXCI9PVwiOiBQcmVjZWRlbmNlLkVxdWFsaXR5LFxuICBcIiE9XCI6IFByZWNlZGVuY2UuRXF1YWxpdHksXG4gIFwiPT09XCI6IFByZWNlZGVuY2UuRXF1YWxpdHksXG4gIFwiIT09XCI6IFByZWNlZGVuY2UuRXF1YWxpdHksXG4gIFwiPFwiOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gIFwiPlwiOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gIFwiPD1cIjogUHJlY2VkZW5jZS5SZWxhdGlvbmFsLFxuICBcIj49XCI6IFByZWNlZGVuY2UuUmVsYXRpb25hbCxcbiAgXCJpblwiOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gIFwiaW5zdGFuY2VvZlwiOiBQcmVjZWRlbmNlLlJlbGF0aW9uYWwsXG4gIFwiPDxcIjogUHJlY2VkZW5jZS5CaXR3aXNlU0hJRlQsXG4gIFwiPj5cIjogUHJlY2VkZW5jZS5CaXR3aXNlU0hJRlQsXG4gIFwiPj4+XCI6IFByZWNlZGVuY2UuQml0d2lzZVNISUZULFxuICBcIitcIjogUHJlY2VkZW5jZS5BZGRpdGl2ZSxcbiAgXCItXCI6IFByZWNlZGVuY2UuQWRkaXRpdmUsXG4gIFwiKlwiOiBQcmVjZWRlbmNlLk11bHRpcGxpY2F0aXZlLFxuICBcIiVcIjogUHJlY2VkZW5jZS5NdWx0aXBsaWNhdGl2ZSxcbiAgXCIvXCI6IFByZWNlZGVuY2UuTXVsdGlwbGljYXRpdmVcbn07XG5cbmV4cG9ydCBjbGFzcyBQYXJzZXIgZXh0ZW5kcyBUb2tlbml6ZXIge1xuICBjb25zdHJ1Y3Rvcihzb3VyY2UpIHtcbiAgICBzdXBlcihzb3VyY2UpO1xuICAgIHRoaXMubGFiZWxTZXQgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIHRoaXMuYWxsb3dJbiA9IHRydWU7XG4gICAgdGhpcy5pbkl0ZXJhdGlvbiA9IGZhbHNlO1xuICAgIHRoaXMuaW5Td2l0Y2ggPSBmYWxzZTtcbiAgICB0aGlzLmluRnVuY3Rpb25Cb2R5ID0gZmFsc2U7XG4gIH1cblxuICBlYXQodG9rZW5UeXBlKSB7XG4gICAgaWYgKHRoaXMubG9va2FoZWFkLnR5cGUgPT09IHRva2VuVHlwZSkge1xuICAgICAgcmV0dXJuIHRoaXMubGV4KCk7XG4gICAgfVxuICB9XG5cbiAgZXhwZWN0KHRva2VuVHlwZSkge1xuICAgIGlmICh0aGlzLmxvb2thaGVhZC50eXBlID09PSB0b2tlblR5cGUpIHtcbiAgICAgIHJldHVybiB0aGlzLmxleCgpO1xuICAgIH1cbiAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuICB9XG5cbiAgbWF0Y2goc3ViVHlwZSkge1xuICAgIHJldHVybiB0aGlzLmxvb2thaGVhZC50eXBlID09PSBzdWJUeXBlO1xuICB9XG5cbiAgY29uc3VtZVNlbWljb2xvbigpIHtcbiAgICAvLyBDYXRjaCB0aGUgdmVyeSBjb21tb24gY2FzZSBmaXJzdDogaW1tZWRpYXRlbHkgYSBzZW1pY29sb24gKFUrMDAzQikuXG4gICAgaWYgKHRoaXMuaW5kZXggPCB0aGlzLnNvdXJjZS5sZW5ndGggJiYgdGhpcy5zb3VyY2UuY2hhckF0KHRoaXMuaW5kZXgpID09IFwiO1wiKSB7XG4gICAgICB0aGlzLmxleCgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuaW5kZXggPSB0aGlzLmxvb2thaGVhZC5zbGljZS5zdGFydDtcbiAgICBpZiAodGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuU0VNSUNPTE9OKSkge1xuICAgICAgdGhpcy5sZXgoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuZW9mKCkgJiYgIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJCUkFDRSkpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlVW5leHBlY3RlZCh0aGlzLmxvb2thaGVhZCk7XG4gICAgfVxuICB9XG5cbiAgLy8gdGhpcyBpcyBhIG5vLW9wLCByZXNlcnZlZCBmb3IgZnV0dXJlIHVzZVxuICBtYXJrTG9jYXRpb24obm9kZSwgc3RhcnRUb2tlbkluZGV4LCBlbmRUb2tlbkluZGV4ID0gdGhpcy50b2tlbkluZGV4KSB7XG4gICAgLy8gVE9ETzogbWFyayB0aGUgc291cmNlIGxvY2F0aW9ucy5cbiAgICByZXR1cm4gbm9kZTtcbiAgfVxuXG4gIHBhcnNlU2NyaXB0KCkge1xuICAgIHZhciBbYm9keSwgaXNTdHJpY3RdID0gdGhpcy5wYXJzZUJvZHkodHJ1ZSk7XG4gICAgcmV0dXJuIG5ldyBTaGlmdC5TY3JpcHQodGhpcy5tYXJrTG9jYXRpb24oYm9keSwgMCkpO1xuICB9XG5cbiAgcGFyc2VGdW5jdGlvbkJvZHkoKSB7XG4gICAgbGV0IHByZXZpb3VzU3RyaWN0ID0gdGhpcy5zdHJpY3Q7XG4gICAgbGV0IHN0YXJ0VG9rZW5JbmRleCA9IHRoaXMudG9rZW5JbmRleDtcblxuICAgIGxldCBvbGRMYWJlbFNldCA9IHRoaXMubGFiZWxTZXQ7XG4gICAgbGV0IG9sZEluSXRlcmF0aW9uID0gdGhpcy5pbkl0ZXJhdGlvbjtcbiAgICBsZXQgb2xkSW5Td2l0Y2ggPSB0aGlzLmluU3dpdGNoO1xuICAgIGxldCBvbGRJbkZ1bmN0aW9uQm9keSA9IHRoaXMuaW5GdW5jdGlvbkJvZHk7XG5cbiAgICB0aGlzLmxhYmVsU2V0ID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICB0aGlzLmluSXRlcmF0aW9uID0gZmFsc2U7XG4gICAgdGhpcy5pblN3aXRjaCA9IGZhbHNlO1xuICAgIHRoaXMuaW5GdW5jdGlvbkJvZHkgPSB0cnVlO1xuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxCUkFDRSk7XG4gICAgbGV0IFtib2R5LCBpc1N0cmljdF0gPSB0aGlzLnBhcnNlQm9keSgpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SQlJBQ0UpO1xuXG4gICAgYm9keSA9IHRoaXMubWFya0xvY2F0aW9uKGJvZHksIHN0YXJ0VG9rZW5JbmRleCk7XG5cbiAgICB0aGlzLmxhYmVsU2V0ID0gb2xkTGFiZWxTZXQ7XG4gICAgdGhpcy5pbkl0ZXJhdGlvbiA9IG9sZEluSXRlcmF0aW9uO1xuICAgIHRoaXMuaW5Td2l0Y2ggPSBvbGRJblN3aXRjaDtcbiAgICB0aGlzLmluRnVuY3Rpb25Cb2R5ID0gb2xkSW5GdW5jdGlvbkJvZHk7XG4gICAgdGhpcy5zdHJpY3QgPSBwcmV2aW91c1N0cmljdDtcbiAgICByZXR1cm4gW2JvZHksIGlzU3RyaWN0XTtcbiAgfVxuXG4gIHBhcnNlQm9keShhY2NlcHRFT0YgPSBmYWxzZSkge1xuICAgIGxldCBkaXJlY3RpdmVzID0gW107XG4gICAgbGV0IHN0YXRlbWVudHMgPSBbXTtcbiAgICBsZXQgcGFyc2luZ0RpcmVjdGl2ZXMgPSB0cnVlO1xuICAgIGxldCBpc1N0cmljdCA9IHRoaXMuc3RyaWN0O1xuICAgIGxldCBmaXJzdFJlc3RyaWN0ZWQgPSBudWxsO1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBpZiAoYWNjZXB0RU9GKSB7XG4gICAgICAgIGlmICh0aGlzLmVvZigpKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0UpKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGxldCB0b2tlbiA9IHRoaXMubG9va2FoZWFkO1xuICAgICAgbGV0IHRleHQgPSB0b2tlbi5zbGljZS50ZXh0O1xuICAgICAgbGV0IGlzU3RyaW5nTGl0ZXJhbCA9IHRva2VuIGluc3RhbmNlb2YgU3RyaW5nTGl0ZXJhbFRva2VuO1xuICAgICAgbGV0IHN0bXQgPSB0aGlzLnBhcnNlU3RhdGVtZW50KCk7XG4gICAgICBpZiAocGFyc2luZ0RpcmVjdGl2ZXMpIHtcbiAgICAgICAgaWYgKGlzU3RyaW5nTGl0ZXJhbCAmJiBzdG10LnR5cGUgPT09IFwiRXhwcmVzc2lvblN0YXRlbWVudFwiICYmXG4gICAgICAgICAgICBzdG10LmV4cHJlc3Npb24udHlwZSA9PT0gXCJMaXRlcmFsU3RyaW5nRXhwcmVzc2lvblwiKSB7XG4gICAgICAgICAgaWYgKHRleHQgPT09IFwiXFxcInVzZSBzdHJpY3RcXFwiXCIgfHwgdGV4dCA9PT0gXCIndXNlIHN0cmljdCdcIikge1xuICAgICAgICAgICAgaXNTdHJpY3QgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5zdHJpY3QgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKGZpcnN0UmVzdHJpY3RlZCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoVG9rZW4oZmlyc3RSZXN0cmljdGVkLCBFcnJvck1lc3NhZ2VzLlNUUklDVF9PQ1RBTF9MSVRFUkFMKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKGZpcnN0UmVzdHJpY3RlZCA9PSBudWxsICYmIHRva2VuLm9jdGFsKSB7XG4gICAgICAgICAgICBmaXJzdFJlc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgICB9XG4gICAgICAgICAgZGlyZWN0aXZlcy5wdXNoKG5ldyBTaGlmdC5EaXJlY3RpdmUodGV4dC5zbGljZSgxLCAtMSkpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwYXJzaW5nRGlyZWN0aXZlcyA9IGZhbHNlO1xuICAgICAgICAgIHN0YXRlbWVudHMucHVzaChzdG10KTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RhdGVtZW50cy5wdXNoKHN0bXQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBbbmV3IFNoaWZ0LkZ1bmN0aW9uQm9keShkaXJlY3RpdmVzLCBzdGF0ZW1lbnRzKSwgaXNTdHJpY3RdO1xuICB9XG5cblxuICBwYXJzZVN0YXRlbWVudCgpIHtcbiAgICBsZXQgc3RhcnRUb2tlbkluZGV4ID0gdGhpcy50b2tlbkluZGV4O1xuICAgIGlmICh0aGlzLmVvZigpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodGhpcy5sb29rYWhlYWQpO1xuICAgIH1cbiAgICBzd2l0Y2ggKHRoaXMubG9va2FoZWFkLnR5cGUpIHtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlNFTUlDT0xPTjpcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHRoaXMucGFyc2VFbXB0eVN0YXRlbWVudCgpLCBzdGFydFRva2VuSW5kZXgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuTEJSQUNFOlxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24odGhpcy5wYXJzZUJsb2NrU3RhdGVtZW50KCksIHN0YXJ0VG9rZW5JbmRleCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5MUEFSRU46XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih0aGlzLnBhcnNlRXhwcmVzc2lvblN0YXRlbWVudCgpLCBzdGFydFRva2VuSW5kZXgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuQlJFQUs6XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih0aGlzLnBhcnNlQnJlYWtTdGF0ZW1lbnQoKSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkNPTlRJTlVFOlxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24odGhpcy5wYXJzZUNvbnRpbnVlU3RhdGVtZW50KCksIHN0YXJ0VG9rZW5JbmRleCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5ERUJVR0dFUjpcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHRoaXMucGFyc2VEZWJ1Z2dlclN0YXRlbWVudCgpLCBzdGFydFRva2VuSW5kZXgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuRE86XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih0aGlzLnBhcnNlRG9XaGlsZVN0YXRlbWVudCgpLCBzdGFydFRva2VuSW5kZXgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuRk9SOlxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24odGhpcy5wYXJzZUZvclN0YXRlbWVudCgpLCBzdGFydFRva2VuSW5kZXgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuRlVOQ1RJT046XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih0aGlzLnBhcnNlRnVuY3Rpb24oZmFsc2UpLCBzdGFydFRva2VuSW5kZXgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuSUY6XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih0aGlzLnBhcnNlSWZTdGF0ZW1lbnQoKSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlJFVFVSTjpcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHRoaXMucGFyc2VSZXR1cm5TdGF0ZW1lbnQoKSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlNXSVRDSDpcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHRoaXMucGFyc2VTd2l0Y2hTdGF0ZW1lbnQoKSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlRIUk9XOlxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24odGhpcy5wYXJzZVRocm93U3RhdGVtZW50KCksIHN0YXJ0VG9rZW5JbmRleCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5UUlk6XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbih0aGlzLnBhcnNlVHJ5U3RhdGVtZW50KCksIHN0YXJ0VG9rZW5JbmRleCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5WQVI6XG4gICAgICBjYXNlIFRva2VuVHlwZS5MRVQ6XG4gICAgICBjYXNlIFRva2VuVHlwZS5DT05TVDpcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHRoaXMucGFyc2VWYXJpYWJsZURlY2xhcmF0aW9uU3RhdGVtZW50KCksIHN0YXJ0VG9rZW5JbmRleCk7XG4gICAgICBjYXNlIFRva2VuVHlwZS5XSElMRTpcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHRoaXMucGFyc2VXaGlsZVN0YXRlbWVudCgpLCBzdGFydFRva2VuSW5kZXgpO1xuICAgICAgY2FzZSBUb2tlblR5cGUuV0lUSDpcbiAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKHRoaXMucGFyc2VXaXRoU3RhdGVtZW50KCksIHN0YXJ0VG9rZW5JbmRleCk7XG4gICAgICBkZWZhdWx0OlxuICAgICAge1xuICAgICAgICBsZXQgZXhwciA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG5cbiAgICAgICAgLy8gMTIuMTIgTGFiZWxsZWQgU3RhdGVtZW50cztcbiAgICAgICAgaWYgKGV4cHIudHlwZSA9PT0gXCJJZGVudGlmaWVyRXhwcmVzc2lvblwiICYmIHRoaXMubWF0Y2goVG9rZW5UeXBlLkNPTE9OKSkge1xuICAgICAgICAgIHRoaXMubGV4KCk7XG4gICAgICAgICAgbGV0IGtleSA9IFwiJFwiICsgZXhwci5pZGVudGlmaWVyLm5hbWU7XG4gICAgICAgICAgaWYgKHt9Lmhhc093blByb3BlcnR5LmNhbGwodGhpcy5sYWJlbFNldCwga2V5KSkge1xuICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLkxBQkVMX1JFREVDTEFSQVRJT04sIGV4cHIuaWRlbnRpZmllci5uYW1lKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB0aGlzLmxhYmVsU2V0W2tleV0gPSB0cnVlO1xuICAgICAgICAgIGxldCBsYWJlbGVkQm9keSA9IHRoaXMucGFyc2VTdGF0ZW1lbnQoKTtcbiAgICAgICAgICBkZWxldGUgdGhpcy5sYWJlbFNldFtrZXldO1xuICAgICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuTGFiZWxlZFN0YXRlbWVudChleHByLmlkZW50aWZpZXIsIGxhYmVsZWRCb2R5KSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmNvbnN1bWVTZW1pY29sb24oKTtcbiAgICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkV4cHJlc3Npb25TdGF0ZW1lbnQoZXhwciksIHN0YXJ0VG9rZW5JbmRleCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgfVxuXG4gIHBhcnNlVmFyaWFibGVJZGVudGlmaWVyKCkge1xuICAgIGxldCBzdGFydFRva2VuSW5kZXggPSB0aGlzLnRva2VuSW5kZXg7XG5cbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxleCgpO1xuICAgIGlmICghKHRva2VuIGluc3RhbmNlb2YgSWRlbnRpZmllclRva2VuKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRva2VuKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LklkZW50aWZpZXIodG9rZW4udmFsdWUpLCBzdGFydFRva2VuSW5kZXgpO1xuICB9XG5cbiAgcGFyc2VFbXB0eVN0YXRlbWVudCgpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuU0VNSUNPTE9OKTtcbiAgICByZXR1cm4gbmV3IFNoaWZ0LkVtcHR5U3RhdGVtZW50O1xuICB9XG5cbiAgcGFyc2VCbG9ja1N0YXRlbWVudCgpIHtcbiAgICByZXR1cm4gbmV3IFNoaWZ0LkJsb2NrU3RhdGVtZW50KHRoaXMucGFyc2VCbG9jaygpKTtcbiAgfVxuXG4gIHBhcnNlRXhwcmVzc2lvblN0YXRlbWVudCgpIHtcbiAgICBsZXQgZXhwciA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgdGhpcy5jb25zdW1lU2VtaWNvbG9uKCk7XG4gICAgcmV0dXJuIG5ldyBTaGlmdC5FeHByZXNzaW9uU3RhdGVtZW50KGV4cHIpO1xuICB9XG5cbiAgcGFyc2VCcmVha1N0YXRlbWVudCgpIHtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuQlJFQUspO1xuXG4gICAgLy8gQ2F0Y2ggdGhlIHZlcnkgY29tbW9uIGNhc2UgZmlyc3Q6IGltbWVkaWF0ZWx5IGEgc2VtaWNvbG9uIChVKzAwM0IpLlxuICAgIGlmICh0aGlzLmxvb2thaGVhZC50eXBlID09IFRva2VuVHlwZS5TRU1JQ09MT04pIHtcbiAgICAgIHRoaXMubGV4KCk7XG5cbiAgICAgIGlmICghKHRoaXMuaW5JdGVyYXRpb24gfHwgdGhpcy5pblN3aXRjaCkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhUb2tlbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5JTExFR0FMX0JSRUFLKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5ldyBTaGlmdC5CcmVha1N0YXRlbWVudChudWxsKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQpIHtcbiAgICAgIGlmICghKHRoaXMuaW5JdGVyYXRpb24gfHwgdGhpcy5pblN3aXRjaCkpIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhUb2tlbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5JTExFR0FMX0JSRUFLKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5ldyBTaGlmdC5CcmVha1N0YXRlbWVudChudWxsKTtcbiAgICB9XG5cbiAgICBsZXQgbGFiZWwgPSBudWxsO1xuICAgIGlmICh0aGlzLmxvb2thaGVhZC50eXBlID09IFRva2VuVHlwZS5JREVOVElGSUVSKSB7XG4gICAgICBsYWJlbCA9IHRoaXMucGFyc2VWYXJpYWJsZUlkZW50aWZpZXIoKTtcblxuICAgICAgbGV0IGtleSA9IFwiJFwiICsgbGFiZWwubmFtZTtcbiAgICAgIGlmICghe30uaGFzT3duUHJvcGVydHkuY2FsbCh0aGlzLmxhYmVsU2V0LCBrZXkpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTktOT1dOX0xBQkVMLCBsYWJlbC5uYW1lKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmNvbnN1bWVTZW1pY29sb24oKTtcblxuICAgIGlmIChsYWJlbCA9PSBudWxsICYmICEodGhpcy5pbkl0ZXJhdGlvbiB8fCB0aGlzLmluU3dpdGNoKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhUb2tlbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5JTExFR0FMX0JSRUFLKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFNoaWZ0LkJyZWFrU3RhdGVtZW50KGxhYmVsKTtcbiAgfVxuXG4gIHBhcnNlQ29udGludWVTdGF0ZW1lbnQoKSB7XG4gICAgbGV0IHRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNPTlRJTlVFKTtcblxuICAgIC8vIENhdGNoIHRoZSB2ZXJ5IGNvbW1vbiBjYXNlIGZpcnN0OiBpbW1lZGlhdGVseSBhIHNlbWljb2xvbiAoVSswMDNCKS5cbiAgICBpZiAodGhpcy5sb29rYWhlYWQudHlwZSA9PSBUb2tlblR5cGUuU0VNSUNPTE9OKSB7XG4gICAgICB0aGlzLmxleCgpO1xuICAgICAgaWYgKCF0aGlzLmluSXRlcmF0aW9uKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoVG9rZW4odG9rZW4sIEVycm9yTWVzc2FnZXMuSUxMRUdBTF9DT05USU5VRSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuZXcgU2hpZnQuQ29udGludWVTdGF0ZW1lbnQobnVsbCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaGFzTGluZVRlcm1pbmF0b3JCZWZvcmVOZXh0KSB7XG4gICAgICBpZiAoIXRoaXMuaW5JdGVyYXRpb24pIHtcbiAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhUb2tlbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5JTExFR0FMX0NPTlRJTlVFKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5ldyBTaGlmdC5Db250aW51ZVN0YXRlbWVudChudWxsKTtcbiAgICB9XG5cbiAgICBsZXQgbGFiZWwgPSBudWxsO1xuICAgIGlmICh0aGlzLmxvb2thaGVhZC50eXBlID09IFRva2VuVHlwZS5JREVOVElGSUVSKSB7XG4gICAgICBsYWJlbCA9IHRoaXMucGFyc2VWYXJpYWJsZUlkZW50aWZpZXIoKTtcblxuICAgICAgbGV0IGtleSA9IFwiJFwiICsgbGFiZWwubmFtZTtcbiAgICAgIGlmICghe30uaGFzT3duUHJvcGVydHkuY2FsbCh0aGlzLmxhYmVsU2V0LCBrZXkpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5VTktOT1dOX0xBQkVMLCBsYWJlbC5uYW1lKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmNvbnN1bWVTZW1pY29sb24oKTtcbiAgICBpZiAoIXRoaXMuaW5JdGVyYXRpb24pIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoVG9rZW4odG9rZW4sIEVycm9yTWVzc2FnZXMuSUxMRUdBTF9DT05USU5VRSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBTaGlmdC5Db250aW51ZVN0YXRlbWVudChsYWJlbCk7XG4gIH1cblxuXG4gIHBhcnNlRGVidWdnZXJTdGF0ZW1lbnQoKSB7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkRFQlVHR0VSKTtcbiAgICB0aGlzLmNvbnN1bWVTZW1pY29sb24oKTtcbiAgICByZXR1cm4gbmV3IFNoaWZ0LkRlYnVnZ2VyU3RhdGVtZW50O1xuICB9XG5cbiAgcGFyc2VEb1doaWxlU3RhdGVtZW50KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5ETyk7XG4gICAgbGV0IG9sZEluSXRlcmF0aW9uID0gdGhpcy5pbkl0ZXJhdGlvbjtcbiAgICB0aGlzLmluSXRlcmF0aW9uID0gdHJ1ZTtcblxuICAgIGxldCBib2R5ID0gdGhpcy5wYXJzZVN0YXRlbWVudCgpO1xuICAgIHRoaXMuaW5JdGVyYXRpb24gPSBvbGRJbkl0ZXJhdGlvbjtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5XSElMRSk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgbGV0IHRlc3QgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5TRU1JQ09MT04pKSB7XG4gICAgICB0aGlzLmxleCgpO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgU2hpZnQuRG9XaGlsZVN0YXRlbWVudChib2R5LCB0ZXN0KTtcbiAgfVxuXG4gIHN0YXRpYyBpc0xlZnRIYW5kU2lkZShleHByKSB7XG4gICAgc3dpdGNoIChleHByLnR5cGUpIHtcbiAgICAgIGNhc2UgXCJDYWxsRXhwcmVzc2lvblwiOlxuICAgICAgY2FzZSBcIk5ld0V4cHJlc3Npb25cIjpcbiAgICAgIGNhc2UgXCJTdGF0aWNNZW1iZXJFeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiQ29tcHV0ZWRNZW1iZXJFeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiQXJyYXlFeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiRnVuY3Rpb25FeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiSWRlbnRpZmllckV4cHJlc3Npb25cIjpcbiAgICAgIGNhc2UgXCJMaXRlcmFsQm9vbGVhbkV4cHJlc3Npb25cIjpcbiAgICAgIGNhc2UgXCJMaXRlcmFsU3RyaW5nRXhwcmVzc2lvblwiOlxuICAgICAgY2FzZSBcIkxpdGVyYWxOdWxsRXhwcmVzc2lvblwiOlxuICAgICAgY2FzZSBcIkxpdGVyYWxSZWdFeHBFeHByZXNzaW9uXCI6XG4gICAgICBjYXNlIFwiT2JqZWN0RXhwcmVzc2lvblwiOlxuICAgICAgY2FzZSBcIlRoaXNFeHByZXNzaW9uXCI6XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwYXJzZUZvclN0YXRlbWVudCgpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuRk9SKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTFBBUkVOKTtcbiAgICBsZXQgdGVzdCA9IG51bGw7XG4gICAgbGV0IHJpZ2h0ID0gbnVsbDtcbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuU0VNSUNPTE9OKSkge1xuICAgICAgdGhpcy5sZXgoKTtcbiAgICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuU0VNSUNPTE9OKSkge1xuICAgICAgICB0ZXN0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5TRU1JQ09MT04pO1xuICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5SUEFSRU4pKSB7XG4gICAgICAgIHJpZ2h0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgU2hpZnQuRm9yU3RhdGVtZW50KFxuICAgICAgICAgIG51bGwsXG4gICAgICAgICAgdGVzdCxcbiAgICAgICAgICByaWdodCxcbiAgICAgICAgICB0aGlzLmdldEl0ZXJhdG9yU3RhdGVtZW50RXBpbG9ndWUoKVxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLlZBUikgfHwgdGhpcy5tYXRjaChUb2tlblR5cGUuTEVUKSkge1xuICAgICAgICBsZXQgcHJldmlvdXNBbGxvd0luID0gdGhpcy5hbGxvd0luO1xuICAgICAgICB0aGlzLmFsbG93SW4gPSBmYWxzZTtcbiAgICAgICAgbGV0IGluaXREZWNsID0gdGhpcy5wYXJzZVZhcmlhYmxlRGVjbGFyYXRpb24oKTtcbiAgICAgICAgdGhpcy5hbGxvd0luID0gcHJldmlvdXNBbGxvd0luO1xuXG4gICAgICAgIGlmIChpbml0RGVjbC5kZWNsYXJhdG9ycy5sZW5ndGggPT09IDEgJiYgdGhpcy5tYXRjaChUb2tlblR5cGUuSU4pKSB7XG4gICAgICAgICAgdGhpcy5sZXgoKTtcbiAgICAgICAgICByaWdodCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICAgICAgcmV0dXJuIG5ldyBTaGlmdC5Gb3JJblN0YXRlbWVudChpbml0RGVjbCwgcmlnaHQsIHRoaXMuZ2V0SXRlcmF0b3JTdGF0ZW1lbnRFcGlsb2d1ZSgpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuU0VNSUNPTE9OKTtcbiAgICAgICAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlNFTUlDT0xPTikpIHtcbiAgICAgICAgICAgIHRlc3QgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuU0VNSUNPTE9OKTtcbiAgICAgICAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJQQVJFTikpIHtcbiAgICAgICAgICAgIHJpZ2h0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIG5ldyBTaGlmdC5Gb3JTdGF0ZW1lbnQoaW5pdERlY2wsIHRlc3QsIHJpZ2h0LCB0aGlzLmdldEl0ZXJhdG9yU3RhdGVtZW50RXBpbG9ndWUoKSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBwcmV2aW91c0FsbG93SW4gPSB0aGlzLmFsbG93SW47XG4gICAgICAgIHRoaXMuYWxsb3dJbiA9IGZhbHNlO1xuICAgICAgICBsZXQgaW5pdCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgICAgIHRoaXMuYWxsb3dJbiA9IHByZXZpb3VzQWxsb3dJbjtcblxuICAgICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuSU4pKSB7XG4gICAgICAgICAgaWYgKCFQYXJzZXIuaXNMZWZ0SGFuZFNpZGUoaW5pdCkpIHtcbiAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5JTlZBTElEX0xIU19JTl9GT1JfSU4pO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHRoaXMubGV4KCk7XG4gICAgICAgICAgcmlnaHQgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgICAgIHJldHVybiBuZXcgU2hpZnQuRm9ySW5TdGF0ZW1lbnQoaW5pdCwgcmlnaHQsIHRoaXMuZ2V0SXRlcmF0b3JTdGF0ZW1lbnRFcGlsb2d1ZSgpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuU0VNSUNPTE9OKTtcbiAgICAgICAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlNFTUlDT0xPTikpIHtcbiAgICAgICAgICAgIHRlc3QgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuU0VNSUNPTE9OKTtcbiAgICAgICAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJQQVJFTikpIHtcbiAgICAgICAgICAgIHJpZ2h0ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIG5ldyBTaGlmdC5Gb3JTdGF0ZW1lbnQoaW5pdCwgdGVzdCwgcmlnaHQsIHRoaXMuZ2V0SXRlcmF0b3JTdGF0ZW1lbnRFcGlsb2d1ZSgpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGdldEl0ZXJhdG9yU3RhdGVtZW50RXBpbG9ndWUoKSB7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJQQVJFTik7XG4gICAgbGV0IG9sZEluSXRlcmF0aW9uID0gdGhpcy5pbkl0ZXJhdGlvbjtcbiAgICB0aGlzLmluSXRlcmF0aW9uID0gdHJ1ZTtcbiAgICBsZXQgYm9keSA9IHRoaXMucGFyc2VTdGF0ZW1lbnQoKTtcbiAgICB0aGlzLmluSXRlcmF0aW9uID0gb2xkSW5JdGVyYXRpb247XG4gICAgcmV0dXJuIGJvZHk7XG4gIH1cblxuICBwYXJzZUlmU3RhdGVtZW50KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5JRik7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgbGV0IHRlc3QgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJQQVJFTik7XG4gICAgbGV0IGNvbnNlcXVlbnQgPSB0aGlzLnBhcnNlU3RhdGVtZW50KCk7XG4gICAgbGV0IGFsdGVybmF0ZSA9IG51bGw7XG4gICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkVMU0UpKSB7XG4gICAgICB0aGlzLmxleCgpO1xuICAgICAgYWx0ZXJuYXRlID0gdGhpcy5wYXJzZVN0YXRlbWVudCgpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IFNoaWZ0LklmU3RhdGVtZW50KHRlc3QsIGNvbnNlcXVlbnQsIGFsdGVybmF0ZSk7XG4gIH1cblxuICBwYXJzZVJldHVyblN0YXRlbWVudCgpIHtcbiAgICBsZXQgYXJndW1lbnQgPSBudWxsO1xuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJFVFVSTik7XG4gICAgaWYgKCF0aGlzLmluRnVuY3Rpb25Cb2R5KSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuSUxMRUdBTF9SRVRVUk4pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmhhc0xpbmVUZXJtaW5hdG9yQmVmb3JlTmV4dCkge1xuICAgICAgcmV0dXJuIG5ldyBTaGlmdC5SZXR1cm5TdGF0ZW1lbnQobnVsbCk7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5TRU1JQ09MT04pKSB7XG4gICAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJCUkFDRSkgJiYgIXRoaXMuZW9mKCkpIHtcbiAgICAgICAgYXJndW1lbnQgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuY29uc3VtZVNlbWljb2xvbigpO1xuICAgIHJldHVybiBuZXcgU2hpZnQuUmV0dXJuU3RhdGVtZW50KGFyZ3VtZW50KTtcbiAgfVxuXG4gIHBhcnNlV2l0aFN0YXRlbWVudCgpIHtcbiAgICBpZiAodGhpcy5zdHJpY3QpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5TVFJJQ1RfTU9ERV9XSVRIKTtcbiAgICB9XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuV0lUSCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgbGV0IG9iamVjdCA9IHRoaXMucGFyc2VFeHByZXNzaW9uKCk7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJQQVJFTik7XG4gICAgbGV0IGJvZHkgPSB0aGlzLnBhcnNlU3RhdGVtZW50KCk7XG5cbiAgICByZXR1cm4gbmV3IFNoaWZ0LldpdGhTdGF0ZW1lbnQob2JqZWN0LCBib2R5KTtcbiAgfVxuXG4gIHBhcnNlU3dpdGNoU3RhdGVtZW50KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5TV0lUQ0gpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MUEFSRU4pO1xuICAgIGxldCBkaXNjcmltaW5hbnQgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MQlJBQ0UpO1xuXG4gICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLlJCUkFDRSkpIHtcbiAgICAgIHRoaXMubGV4KCk7XG4gICAgICByZXR1cm4gbmV3IFNoaWZ0LlN3aXRjaFN0YXRlbWVudChkaXNjcmltaW5hbnQsIFtdKTtcbiAgICB9XG4gICAgbGV0IG9sZEluU3dpdGNoID0gdGhpcy5pblN3aXRjaDtcbiAgICB0aGlzLmluU3dpdGNoID0gdHJ1ZTtcblxuICAgIGxldCBjYXNlcyA9IHRoaXMucGFyc2VTd2l0Y2hDYXNlcygpO1xuXG4gICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkRFRkFVTFQpKSB7XG4gICAgICBsZXQgc3dpdGNoRGVmYXVsdCA9IHRoaXMucGFyc2VTd2l0Y2hEZWZhdWx0KCk7XG4gICAgICBsZXQgcG9zdERlZmF1bHRDYXNlcyA9IHRoaXMucGFyc2VTd2l0Y2hDYXNlcygpO1xuICAgICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkRFRkFVTFQpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5NVUxUSVBMRV9ERUZBVUxUU19JTl9TV0lUQ0gpO1xuICAgICAgfVxuICAgICAgdGhpcy5pblN3aXRjaCA9IG9sZEluU3dpdGNoO1xuICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJCUkFDRSk7XG4gICAgICByZXR1cm4gbmV3IFNoaWZ0LlN3aXRjaFN0YXRlbWVudFdpdGhEZWZhdWx0KGRpc2NyaW1pbmFudCwgY2FzZXMsIHN3aXRjaERlZmF1bHQsIHBvc3REZWZhdWx0Q2FzZXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmluU3dpdGNoID0gb2xkSW5Td2l0Y2g7XG4gICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUkJSQUNFKTtcbiAgICAgIHJldHVybiBuZXcgU2hpZnQuU3dpdGNoU3RhdGVtZW50KGRpc2NyaW1pbmFudCwgY2FzZXMpO1xuICAgIH1cbiAgfVxuXG4gIHBhcnNlU3dpdGNoQ2FzZXMoKSB7XG4gICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgIHdoaWxlICghKHRoaXMuZW9mKCkgfHwgdGhpcy5tYXRjaChUb2tlblR5cGUuUkJSQUNFKSB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5ERUZBVUxUKSkpIHtcbiAgICAgIHJlc3VsdC5wdXNoKHRoaXMucGFyc2VTd2l0Y2hDYXNlKCkpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgcGFyc2VTd2l0Y2hDYXNlKCkge1xuICAgIGxldCBzdGFydFRva2VuSW5kZXggPSB0aGlzLnRva2VuSW5kZXg7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNBU0UpO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuU3dpdGNoQ2FzZSh0aGlzLnBhcnNlRXhwcmVzc2lvbigpLCB0aGlzLnBhcnNlU3dpdGNoQ2FzZUJvZHkoKSksIHN0YXJ0VG9rZW5JbmRleCk7XG4gIH1cblxuICBwYXJzZVN3aXRjaERlZmF1bHQoKSB7XG4gICAgbGV0IHN0YXJ0VG9rZW5JbmRleCA9IHRoaXMudG9rZW5JbmRleDtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuREVGQVVMVCk7XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5Td2l0Y2hEZWZhdWx0KHRoaXMucGFyc2VTd2l0Y2hDYXNlQm9keSgpKSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgfVxuXG4gIHBhcnNlU3dpdGNoQ2FzZUJvZHkoKSB7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNPTE9OKTtcbiAgICByZXR1cm4gdGhpcy5wYXJzZVN0YXRlbWVudExpc3RJblN3aXRjaENhc2VCb2R5KCk7XG4gIH1cblxuICBwYXJzZVN0YXRlbWVudExpc3RJblN3aXRjaENhc2VCb2R5KCkge1xuICAgIGxldCByZXN1bHQgPSBbXTtcbiAgICB3aGlsZSAoISh0aGlzLmVvZigpIHx8IHRoaXMubWF0Y2goVG9rZW5UeXBlLlJCUkFDRSkgfHwgdGhpcy5tYXRjaChUb2tlblR5cGUuREVGQVVMVClcbiAgICB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5DQVNFKSkpIHtcbiAgICAgIHJlc3VsdC5wdXNoKHRoaXMucGFyc2VTdGF0ZW1lbnQoKSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBwYXJzZVRocm93U3RhdGVtZW50KCkge1xuICAgIGxldCB0b2tlbiA9IHRoaXMuZXhwZWN0KFRva2VuVHlwZS5USFJPVyk7XG5cbiAgICBpZiAodGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoVG9rZW4odG9rZW4sIEVycm9yTWVzc2FnZXMuTkVXTElORV9BRlRFUl9USFJPVyk7XG4gICAgfVxuXG4gICAgbGV0IGFyZ3VtZW50ID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcblxuICAgIHRoaXMuY29uc3VtZVNlbWljb2xvbigpO1xuXG4gICAgcmV0dXJuIG5ldyBTaGlmdC5UaHJvd1N0YXRlbWVudChhcmd1bWVudCk7XG4gIH1cblxuICBwYXJzZVRyeVN0YXRlbWVudCgpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuVFJZKTtcbiAgICBsZXQgYmxvY2sgPSB0aGlzLnBhcnNlQmxvY2soKTtcblxuICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5DQVRDSCkpIHtcbiAgICAgIGxldCBoYW5kbGVyID0gdGhpcy5wYXJzZUNhdGNoQ2xhdXNlKCk7XG4gICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuRklOQUxMWSkpIHtcbiAgICAgICAgdGhpcy5sZXgoKTtcbiAgICAgICAgbGV0IGZpbmFsaXplciA9IHRoaXMucGFyc2VCbG9jaygpO1xuICAgICAgICByZXR1cm4gbmV3IFNoaWZ0LlRyeUZpbmFsbHlTdGF0ZW1lbnQoYmxvY2ssIGhhbmRsZXIsIGZpbmFsaXplcik7XG4gICAgICB9XG4gICAgICByZXR1cm4gbmV3IFNoaWZ0LlRyeUNhdGNoU3RhdGVtZW50KGJsb2NrLCBoYW5kbGVyKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuRklOQUxMWSkpIHtcbiAgICAgIHRoaXMubGV4KCk7XG4gICAgICBsZXQgZmluYWxpemVyID0gdGhpcy5wYXJzZUJsb2NrKCk7XG4gICAgICByZXR1cm4gbmV3IFNoaWZ0LlRyeUZpbmFsbHlTdGF0ZW1lbnQoYmxvY2ssIG51bGwsIGZpbmFsaXplcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5OT19DQVRDSF9PUl9GSU5BTExZKTtcbiAgICB9XG4gIH1cblxuICBwYXJzZVZhcmlhYmxlRGVjbGFyYXRpb25TdGF0ZW1lbnQoKSB7XG4gICAgbGV0IGRlY2xhcmF0aW9uID0gdGhpcy5wYXJzZVZhcmlhYmxlRGVjbGFyYXRpb24oKTtcbiAgICB0aGlzLmNvbnN1bWVTZW1pY29sb24oKTtcbiAgICByZXR1cm4gbmV3IFNoaWZ0LlZhcmlhYmxlRGVjbGFyYXRpb25TdGF0ZW1lbnQoZGVjbGFyYXRpb24pO1xuICB9XG5cbiAgcGFyc2VXaGlsZVN0YXRlbWVudCgpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuV0hJTEUpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MUEFSRU4pO1xuICAgIHJldHVybiBuZXcgU2hpZnQuV2hpbGVTdGF0ZW1lbnQodGhpcy5wYXJzZUV4cHJlc3Npb24oKSwgdGhpcy5nZXRJdGVyYXRvclN0YXRlbWVudEVwaWxvZ3VlKCkpO1xuICB9XG5cbiAgcGFyc2VDYXRjaENsYXVzZSgpIHtcbiAgICBsZXQgc3RhcnRUb2tlbkluZGV4ID0gdGhpcy50b2tlbkluZGV4O1xuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNBVENIKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTFBBUkVOKTtcbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuUlBBUkVOKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubG9va2FoZWFkKTtcbiAgICB9XG5cbiAgICBsZXQgcGFyYW0gPSB0aGlzLnBhcnNlVmFyaWFibGVJZGVudGlmaWVyKCk7XG5cbiAgICAvLyAxMi4xNC4xO1xuICAgIGlmICh0aGlzLnN0cmljdCAmJiBpc1Jlc3RyaWN0ZWRXb3JkKHBhcmFtLm5hbWUpKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX0NBVENIX1ZBUklBQkxFKTtcbiAgICB9XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcblxuICAgIGxldCBib2R5ID0gdGhpcy5wYXJzZUJsb2NrKCk7XG5cbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkNhdGNoQ2xhdXNlKHBhcmFtLCBib2R5KSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgfVxuXG4gIHBhcnNlQmxvY2soKSB7XG4gICAgbGV0IHN0YXJ0VG9rZW5JbmRleCA9IHRoaXMudG9rZW5JbmRleDtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuTEJSQUNFKTtcblxuICAgIGxldCBib2R5ID0gW107XG4gICAgd2hpbGUgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5SQlJBQ0UpKSB7XG4gICAgICBib2R5LnB1c2godGhpcy5wYXJzZVN0YXRlbWVudCgpKTtcbiAgICB9XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJCUkFDRSk7XG5cbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkJsb2NrKGJvZHkpLCBzdGFydFRva2VuSW5kZXgpO1xuICB9XG5cbiAgcGFyc2VWYXJpYWJsZURlY2xhcmF0aW9uKCkge1xuICAgIGxldCBzdGFydFRva2VuSW5kZXggPSB0aGlzLnRva2VuSW5kZXg7XG4gICAgbGV0IHRva2VuID0gdGhpcy5sZXgoKTtcblxuICAgIC8vIFByZWNlZGVkIGJ5IHRoaXMubWF0Y2goVG9rZW5TdWJUeXBlLlZBUikgfHwgdGhpcy5tYXRjaChUb2tlblN1YlR5cGUuTEVUKTtcbiAgICBsZXQga2luZCA9IHRva2VuLnR5cGUgPT0gVG9rZW5UeXBlLlZBUiA/IFwidmFyXCIgOiB0b2tlbi50eXBlID09PSBUb2tlblR5cGUuQ09OU1QgPyBcImNvbnN0XCIgOiBcImxldFwiO1xuICAgIGxldCBkZWNsYXJhdG9ycyA9IHRoaXMucGFyc2VWYXJpYWJsZURlY2xhcmF0b3JMaXN0KGtpbmQpO1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuVmFyaWFibGVEZWNsYXJhdGlvbihraW5kLCBkZWNsYXJhdG9ycyksIHN0YXJ0VG9rZW5JbmRleCk7XG4gIH1cblxuICBwYXJzZVZhcmlhYmxlRGVjbGFyYXRvckxpc3Qoa2luZCkge1xuICAgIGxldCByZXN1bHQgPSBbXTtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgcmVzdWx0LnB1c2godGhpcy5wYXJzZVZhcmlhYmxlRGVjbGFyYXRvcihraW5kKSk7XG4gICAgICBpZiAoIXRoaXMuZWF0KFRva2VuVHlwZS5DT01NQSkpIHtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwYXJzZVZhcmlhYmxlRGVjbGFyYXRvcihraW5kKSB7XG4gICAgbGV0IHN0YXJ0VG9rZW5JbmRleCA9IHRoaXMudG9rZW5JbmRleDtcblxuICAgIGxldCBpZCA9IHRoaXMucGFyc2VWYXJpYWJsZUlkZW50aWZpZXIoKTtcblxuICAgIC8vIDEyLjIuMTtcbiAgICBpZiAodGhpcy5zdHJpY3QgJiYgaXNSZXN0cmljdGVkV29yZChpZC5uYW1lKSkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLlNUUklDVF9WQVJfTkFNRSk7XG4gICAgfVxuXG4gICAgbGV0IGluaXQgPSBudWxsO1xuICAgIGlmIChraW5kID09IFwiY29uc3RcIikge1xuICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkFTU0lHTik7XG4gICAgICBpbml0ID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgfSBlbHNlIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5BU1NJR04pKSB7XG4gICAgICB0aGlzLmxleCgpO1xuICAgICAgaW5pdCA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlZhcmlhYmxlRGVjbGFyYXRvcihpZCwgaW5pdCksIHN0YXJ0VG9rZW5JbmRleCk7XG4gIH1cblxuICBwYXJzZUV4cHJlc3Npb24oKSB7XG4gICAgbGV0IHN0YXJ0VG9rZW5JbmRleCA9IHRoaXMudG9rZW5JbmRleDtcblxuICAgIGxldCBleHByID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG5cbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuQ09NTUEpKSB7XG4gICAgICB3aGlsZSAoIXRoaXMuZW9mKCkpIHtcbiAgICAgICAgaWYgKCF0aGlzLm1hdGNoKFRva2VuVHlwZS5DT01NQSkpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxleCgpO1xuICAgICAgICBleHByID0gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkJpbmFyeUV4cHJlc3Npb24oXCIsXCIsIGV4cHIsIHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpKSxcbiAgICAgICAgICAgIHN0YXJ0VG9rZW5JbmRleCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBleHByO1xuICB9XG5cbiAgcGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpIHtcbiAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICBsZXQgc3RhcnRUb2tlbkluZGV4ID0gdGhpcy50b2tlbkluZGV4O1xuXG4gICAgbGV0IGlzUGFyZW50aGVzaXNlZCA9IHRva2VuLnR5cGUgPT09IFRva2VuVHlwZS5MUEFSRU47XG4gICAgbGV0IG5vZGUgPSB0aGlzLnBhcnNlQ29uZGl0aW9uYWxFeHByZXNzaW9uKCk7XG5cbiAgICBsZXQgaXNPcGVyYXRvciA9IGZhbHNlO1xuICAgIGxldCBvcGVyYXRvciA9IHRoaXMubG9va2FoZWFkO1xuICAgIHN3aXRjaCAob3BlcmF0b3IudHlwZSkge1xuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX0JJVF9PUjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9CSVRfWE9SOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX0JJVF9BTkQ6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fU0hMOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX1NIUjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9TSFJfVU5TSUdORUQ6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fQUREOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX1NVQjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkFTU0lHTl9NVUw6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BU1NJR05fRElWOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQVNTSUdOX01PRDpcbiAgICAgICAgaXNPcGVyYXRvciA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGlmIChpc09wZXJhdG9yKSB7XG4gICAgICBpZiAoIWlzUGFyZW50aGVzaXNlZCAmJiAhUGFyc2VyLmlzTGVmdEhhbmRTaWRlKG5vZGUpKSB7XG4gICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5JTlZBTElEX0xIU19JTl9BU1NJR05NRU5UKTtcbiAgICAgIH1cblxuICAgICAgLy8gMTEuMTMuMTtcbiAgICAgIGlmIChub2RlLnR5cGUgPT09IFwiSWRlbnRpZmllckV4cHJlc3Npb25cIikge1xuICAgICAgICBpZiAodGhpcy5zdHJpY3QgJiYgaXNSZXN0cmljdGVkV29yZChub2RlLmlkZW50aWZpZXIubmFtZSkpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aFRva2VuKHRva2VuLCBFcnJvck1lc3NhZ2VzLlNUUklDVF9MSFNfQVNTSUdOTUVOVCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdGhpcy5sZXgoKTtcbiAgICAgIGxldCByaWdodCA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5Bc3NpZ25tZW50RXhwcmVzc2lvbihvcGVyYXRvci50eXBlLm5hbWUsIG5vZGUsIHJpZ2h0KSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgICB9XG4gICAgcmV0dXJuIG5vZGU7XG4gIH1cblxuICBwYXJzZUNvbmRpdGlvbmFsRXhwcmVzc2lvbigpIHtcbiAgICBsZXQgc3RhcnRUb2tlbkluZGV4ID0gdGhpcy50b2tlbkluZGV4O1xuICAgIGxldCBleHByID0gdGhpcy5wYXJzZUJpbmFyeUV4cHJlc3Npb24oKTtcbiAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuQ09ORElUSU9OQUwpKSB7XG4gICAgICB0aGlzLmxleCgpO1xuICAgICAgbGV0IHByZXZpb3VzQWxsb3dJbiA9IHRoaXMuYWxsb3dJbjtcbiAgICAgIHRoaXMuYWxsb3dJbiA9IHRydWU7XG4gICAgICBsZXQgY29uc2VxdWVudCA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgdGhpcy5hbGxvd0luID0gcHJldmlvdXNBbGxvd0luO1xuICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNPTE9OKTtcbiAgICAgIGxldCBhbHRlcm5hdGUgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQ29uZGl0aW9uYWxFeHByZXNzaW9uKGV4cHIsIGNvbnNlcXVlbnQsIGFsdGVybmF0ZSksIHN0YXJ0VG9rZW5JbmRleCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGV4cHI7XG4gIH1cblxuICBpc0JpbmFyeU9wZXJhdG9yKHR5cGUpIHtcbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk9SOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQU5EOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQklUX09SOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQklUX1hPUjpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkJJVF9BTkQ6XG4gICAgICBjYXNlIFRva2VuVHlwZS5FUTpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk5FOlxuICAgICAgY2FzZSBUb2tlblR5cGUuRVFfU1RSSUNUOlxuICAgICAgY2FzZSBUb2tlblR5cGUuTkVfU1RSSUNUOlxuICAgICAgY2FzZSBUb2tlblR5cGUuTFQ6XG4gICAgICBjYXNlIFRva2VuVHlwZS5HVDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkxURTpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkdURTpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLklOU1RBTkNFT0Y6XG4gICAgICBjYXNlIFRva2VuVHlwZS5TSEw6XG4gICAgICBjYXNlIFRva2VuVHlwZS5TSFI6XG4gICAgICBjYXNlIFRva2VuVHlwZS5TSFJfVU5TSUdORUQ6XG4gICAgICBjYXNlIFRva2VuVHlwZS5BREQ6XG4gICAgICBjYXNlIFRva2VuVHlwZS5TVUI6XG4gICAgICBjYXNlIFRva2VuVHlwZS5NVUw6XG4gICAgICBjYXNlIFRva2VuVHlwZS5ESVY6XG4gICAgICBjYXNlIFRva2VuVHlwZS5NT0Q6XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgY2FzZSBUb2tlblR5cGUuSU46XG4gICAgICAgIHJldHVybiB0aGlzLmFsbG93SW47XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgcGFyc2VCaW5hcnlFeHByZXNzaW9uKCkge1xuICAgIGxldCBsZWZ0ID0gdGhpcy5wYXJzZVVuYXJ5RXhwcmVzc2lvbigpO1xuICAgIGxldCBvcGVyYXRvciA9IHRoaXMubG9va2FoZWFkLnR5cGU7XG5cbiAgICBsZXQgaXNCaW5hcnlPcGVyYXRvciA9IHRoaXMuaXNCaW5hcnlPcGVyYXRvcihvcGVyYXRvcik7XG4gICAgaWYgKCFpc0JpbmFyeU9wZXJhdG9yKSB7XG4gICAgICByZXR1cm4gbGVmdDtcbiAgICB9XG5cbiAgICB0aGlzLmxleCgpO1xuICAgIGxldCBzdGFjayA9IFtdO1xuICAgIHN0YWNrLnB1c2goe3N0YXJ0SW5kZXg6IHRoaXMudG9rZW5JbmRleCwgbGVmdCwgb3BlcmF0b3IsIHByZWNlZGVuY2U6IEJpbmFyeVByZWNlZGVuY2Vbb3BlcmF0b3IubmFtZV19KTtcbiAgICBsZXQgcmlnaHQgPSB0aGlzLnBhcnNlVW5hcnlFeHByZXNzaW9uKCk7XG5cbiAgICBvcGVyYXRvciA9IHRoaXMubG9va2FoZWFkLnR5cGU7XG4gICAgaXNCaW5hcnlPcGVyYXRvciA9IHRoaXMuaXNCaW5hcnlPcGVyYXRvcih0aGlzLmxvb2thaGVhZC50eXBlKTtcbiAgICB3aGlsZSAoaXNCaW5hcnlPcGVyYXRvcikge1xuICAgICAgbGV0IHByZWNlZGVuY2UgPSBCaW5hcnlQcmVjZWRlbmNlW29wZXJhdG9yLm5hbWVdO1xuICAgICAgLy8gUmVkdWNlOiBtYWtlIGEgYmluYXJ5IGV4cHJlc3Npb24gZnJvbSB0aGUgdGhyZWUgdG9wbW9zdCBlbnRyaWVzLlxuICAgICAgd2hpbGUgKHN0YWNrLmxlbmd0aCAmJiAocHJlY2VkZW5jZSA8PSBzdGFja1tzdGFjay5sZW5ndGggLSAxXS5wcmVjZWRlbmNlKSkge1xuICAgICAgICBsZXQgc3RhY2tJdGVtID0gc3RhY2tbc3RhY2subGVuZ3RoIC0gMV07XG4gICAgICAgIGxldCBzdGFja09wZXJhdG9yID0gc3RhY2tJdGVtLm9wZXJhdG9yO1xuICAgICAgICBsZWZ0ID0gc3RhY2tJdGVtLmxlZnQ7XG4gICAgICAgIHN0YWNrLnBvcCgpO1xuICAgICAgICByaWdodCA9IHRoaXMubWFya0xvY2F0aW9uKFxuICAgICAgICAgICAgbmV3IFNoaWZ0LkJpbmFyeUV4cHJlc3Npb24oc3RhY2tPcGVyYXRvci5uYW1lLCBsZWZ0LCByaWdodCksXG4gICAgICAgICAgICBzdGFja0l0ZW0uc3RhcnRJbmRleCxcbiAgICAgICAgICAgIHRoaXMudG9rZW5JbmRleCk7XG4gICAgICB9XG5cbiAgICAgIC8vIFNoaWZ0LlxuICAgICAgdGhpcy5sZXgoKTtcbiAgICAgIHN0YWNrLnB1c2goe3N0YXJ0SW5kZXg6IHRoaXMudG9rZW5JbmRleCwgbGVmdDogcmlnaHQsIG9wZXJhdG9yLCBwcmVjZWRlbmNlfSk7XG4gICAgICByaWdodCA9IHRoaXMucGFyc2VVbmFyeUV4cHJlc3Npb24oKTtcblxuICAgICAgb3BlcmF0b3IgPSB0aGlzLmxvb2thaGVhZC50eXBlO1xuICAgICAgaXNCaW5hcnlPcGVyYXRvciA9IHRoaXMuaXNCaW5hcnlPcGVyYXRvcihvcGVyYXRvcik7XG4gICAgfVxuXG4gICAgLy8gRmluYWwgcmVkdWNlIHRvIGNsZWFuLXVwIHRoZSBzdGFjay5cbiAgICByZXR1cm4gc3RhY2sucmVkdWNlUmlnaHQoXG4gICAgICAgIChleHByLCBzdGFja0l0ZW0pID0+IHRoaXMubWFya0xvY2F0aW9uKFxuICAgICAgICAgICAgbmV3IFNoaWZ0LkJpbmFyeUV4cHJlc3Npb24oc3RhY2tJdGVtLm9wZXJhdG9yLm5hbWUsIHN0YWNrSXRlbS5sZWZ0LCBleHByKSxcbiAgICAgICAgICAgIHN0YWNrSXRlbS5zdGFydEluZGV4LFxuICAgICAgICAgICAgdGhpcy50b2tlbkluZGV4KSxcbiAgICAgICAgcmlnaHQpO1xuICB9XG5cbiAgc3RhdGljIGlzUHJlZml4T3BlcmF0b3IodHlwZSkge1xuICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgY2FzZSBUb2tlblR5cGUuSU5DOlxuICAgICAgY2FzZSBUb2tlblR5cGUuREVDOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQUREOlxuICAgICAgY2FzZSBUb2tlblR5cGUuU1VCOlxuICAgICAgY2FzZSBUb2tlblR5cGUuQklUX05PVDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLk5PVDpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLkRFTEVURTpcbiAgICAgIGNhc2UgVG9rZW5UeXBlLlZPSUQ6XG4gICAgICBjYXNlIFRva2VuVHlwZS5UWVBFT0Y6XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwYXJzZVVuYXJ5RXhwcmVzc2lvbigpIHtcbiAgICBpZiAodGhpcy5sb29rYWhlYWQudHlwZS5rbGFzcyAhPSBUb2tlbkNsYXNzLlB1bmN0dWF0b3IgJiYgdGhpcy5sb29rYWhlYWQudHlwZS5rbGFzcyAhPSBUb2tlbkNsYXNzLktleXdvcmQpIHtcbiAgICAgIHJldHVybiB0aGlzLnBhcnNlUG9zdGZpeEV4cHJlc3Npb24oKTtcbiAgICB9XG4gICAgbGV0IHN0YXJ0VG9rZW5JbmRleCA9IHRoaXMudG9rZW5JbmRleDtcbiAgICBsZXQgb3BlcmF0b3IgPSB0aGlzLmxvb2thaGVhZDtcbiAgICBpZiAoIVBhcnNlci5pc1ByZWZpeE9wZXJhdG9yKG9wZXJhdG9yLnR5cGUpKSB7XG4gICAgICByZXR1cm4gdGhpcy5wYXJzZVBvc3RmaXhFeHByZXNzaW9uKCk7XG4gICAgfVxuICAgIHRoaXMubGV4KCk7XG4gICAgbGV0IGV4cHIgPSB0aGlzLnBhcnNlVW5hcnlFeHByZXNzaW9uKCk7XG4gICAgc3dpdGNoIChvcGVyYXRvci50eXBlKSB7XG4gICAgICBjYXNlIFRva2VuVHlwZS5JTkM6XG4gICAgICBjYXNlIFRva2VuVHlwZS5ERUM6XG4gICAgICAgIC8vIDExLjQuNCwgMTEuNC41O1xuICAgICAgICBpZiAoZXhwci50eXBlID09PSBcIklkZW50aWZpZXJFeHByZXNzaW9uXCIpIHtcbiAgICAgICAgICBpZiAodGhpcy5zdHJpY3QgJiYgaXNSZXN0cmljdGVkV29yZChleHByLmlkZW50aWZpZXIubmFtZSkpIHtcbiAgICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5TVFJJQ1RfTEhTX1BSRUZJWCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFQYXJzZXIuaXNMZWZ0SGFuZFNpZGUoZXhwcikpIHtcbiAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuSU5WQUxJRF9MSFNfSU5fQVNTSUdOTUVOVCk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFRva2VuVHlwZS5ERUxFVEU6XG4gICAgICAgIGlmIChleHByLnR5cGUgPT09IFwiSWRlbnRpZmllckV4cHJlc3Npb25cIiAmJiB0aGlzLnN0cmljdCkge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5TVFJJQ1RfREVMRVRFKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuUHJlZml4RXhwcmVzc2lvbihvcGVyYXRvci52YWx1ZSwgZXhwciksIHN0YXJ0VG9rZW5JbmRleCk7XG4gIH1cblxuICBwYXJzZVBvc3RmaXhFeHByZXNzaW9uKCkge1xuICAgIGxldCBzdGFydFRva2VuSW5kZXggPSB0aGlzLnRva2VuSW5kZXg7XG5cbiAgICBsZXQgZXhwciA9IHRoaXMucGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uQWxsb3dDYWxsKCk7XG5cbiAgICBpZiAodGhpcy5oYXNMaW5lVGVybWluYXRvckJlZm9yZU5leHQpIHtcbiAgICAgIHJldHVybiBleHByO1xuICAgIH1cblxuICAgIGxldCBvcGVyYXRvciA9IHRoaXMubG9va2FoZWFkO1xuICAgIGlmICgob3BlcmF0b3IudHlwZSAhPT0gVG9rZW5UeXBlLklOQykgJiYgKG9wZXJhdG9yLnR5cGUgIT09IFRva2VuVHlwZS5ERUMpKSB7XG4gICAgICByZXR1cm4gZXhwcjtcbiAgICB9XG4gICAgdGhpcy5sZXgoKTtcbiAgICAvLyAxMS4zLjEsIDExLjMuMjtcbiAgICBpZiAoZXhwci50eXBlID09PSBcIklkZW50aWZpZXJFeHByZXNzaW9uXCIpIHtcbiAgICAgIGlmICh0aGlzLnN0cmljdCAmJiBpc1Jlc3RyaWN0ZWRXb3JkKGV4cHIuaWRlbnRpZmllci5uYW1lKSkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX0xIU19QT1NURklYKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKCFQYXJzZXIuaXNMZWZ0SGFuZFNpZGUoZXhwcikpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5JTlZBTElEX0xIU19JTl9BU1NJR05NRU5UKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5Qb3N0Zml4RXhwcmVzc2lvbihleHByLCBvcGVyYXRvci52YWx1ZSksIHN0YXJ0VG9rZW5JbmRleCk7XG4gIH1cblxuICBwYXJzZUxlZnRIYW5kU2lkZUV4cHJlc3Npb25BbGxvd0NhbGwoKSB7XG4gICAgbGV0IHN0YXJ0VG9rZW5JbmRleCA9IHRoaXMudG9rZW5JbmRleDtcbiAgICBsZXQgcHJldmlvdXNBbGxvd0luID0gdGhpcy5hbGxvd0luO1xuICAgIHRoaXMuYWxsb3dJbiA9IHRydWU7XG4gICAgbGV0IGV4cHIgPSB0aGlzLm1hdGNoKFRva2VuVHlwZS5ORVcpID8gdGhpcy5wYXJzZU5ld0V4cHJlc3Npb24oKSA6IHRoaXMucGFyc2VQcmltYXJ5RXhwcmVzc2lvbigpO1xuXG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5MUEFSRU4pKSB7XG4gICAgICAgIGV4cHIgPSB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQ2FsbEV4cHJlc3Npb24oZXhwciwgdGhpcy5wYXJzZUFyZ3VtZW50TGlzdCgpKSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuTEJSQUNLKSkge1xuICAgICAgICBleHByID0gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkNvbXB1dGVkTWVtYmVyRXhwcmVzc2lvbihleHByLCB0aGlzLnBhcnNlQ29tcHV0ZWRNZW1iZXIoKSksIHN0YXJ0VG9rZW5JbmRleCk7XG4gICAgICB9IGVsc2UgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLlBFUklPRCkpIHtcbiAgICAgICAgZXhwciA9IHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5TdGF0aWNNZW1iZXJFeHByZXNzaW9uKGV4cHIsIHRoaXMucGFyc2VOb25Db21wdXRlZE1lbWJlcigpKSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuYWxsb3dJbiA9IHByZXZpb3VzQWxsb3dJbjtcblxuICAgIHJldHVybiBleHByO1xuICB9XG5cbiAgcGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uKCkge1xuICAgIGxldCBzdGFydFRva2VuSW5kZXggPSB0aGlzLnRva2VuSW5kZXg7XG5cbiAgICBsZXQgZXhwciA9IHRoaXMubWF0Y2goVG9rZW5UeXBlLk5FVykgPyB0aGlzLnBhcnNlTmV3RXhwcmVzc2lvbigpIDogdGhpcy5wYXJzZVByaW1hcnlFeHByZXNzaW9uKCk7XG5cbiAgICB3aGlsZSAodGhpcy5tYXRjaChUb2tlblR5cGUuUEVSSU9EKSB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5MQlJBQ0spKSB7XG4gICAgICBleHByID0gdGhpcy5tYXJrTG9jYXRpb24oXG4gICAgICAgICAgdGhpcy5tYXRjaChUb2tlblR5cGUuTEJSQUNLKSA/XG4gICAgICAgICAgICAgIG5ldyBTaGlmdC5Db21wdXRlZE1lbWJlckV4cHJlc3Npb24oZXhwciwgdGhpcy5wYXJzZUNvbXB1dGVkTWVtYmVyKCkpIDpcbiAgICAgICAgICAgICAgbmV3IFNoaWZ0LlN0YXRpY01lbWJlckV4cHJlc3Npb24oZXhwciwgdGhpcy5wYXJzZU5vbkNvbXB1dGVkTWVtYmVyKCkpLCBzdGFydFRva2VuSW5kZXgpO1xuICAgIH1cblxuICAgIHJldHVybiBleHByO1xuICB9XG5cbiAgcGFyc2VOb25Db21wdXRlZE1lbWJlcigpIHtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUEVSSU9EKTtcbiAgICByZXR1cm4gdGhpcy5wYXJzZU5vbkNvbXB1dGVkUHJvcGVydHkoKTtcbiAgfVxuXG4gIHBhcnNlQ29tcHV0ZWRNZW1iZXIoKSB7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxCUkFDSyk7XG4gICAgbGV0IGV4cHIgPSB0aGlzLnBhcnNlRXhwcmVzc2lvbigpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SQlJBQ0spO1xuICAgIHJldHVybiBleHByO1xuICB9XG5cbiAgcGFyc2VOZXdFeHByZXNzaW9uKCkge1xuICAgIGxldCBzdGFydFRva2VuSW5kZXggPSB0aGlzLnRva2VuSW5kZXg7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLk5FVyk7XG4gICAgbGV0IGNhbGxlZSA9IHRoaXMucGFyc2VMZWZ0SGFuZFNpZGVFeHByZXNzaW9uKCk7XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5OZXdFeHByZXNzaW9uKGNhbGxlZSwgdGhpcy5tYXRjaChUb2tlblR5cGUuTFBBUkVOKSA/IHRoaXMucGFyc2VBcmd1bWVudExpc3QoKSA6XG4gICAgICAgIFtdKSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgfVxuXG4gIHBhcnNlUHJpbWFyeUV4cHJlc3Npb24oKSB7XG4gICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLkxQQVJFTikpIHtcbiAgICAgIHJldHVybiB0aGlzLnBhcnNlR3JvdXBFeHByZXNzaW9uKCk7XG4gICAgfVxuXG4gICAgbGV0IHN0YXJ0VG9rZW5JbmRleCA9IHRoaXMudG9rZW5JbmRleDtcblxuICAgIHN3aXRjaCAodGhpcy5sb29rYWhlYWQudHlwZS5rbGFzcykge1xuICAgICAgY2FzZSBUb2tlbkNsYXNzLklkZW50OlxuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LklkZW50aWZpZXJFeHByZXNzaW9uKHRoaXMucGFyc2VJZGVudGlmaWVyKCkpLCBzdGFydFRva2VuSW5kZXgpO1xuICAgICAgY2FzZSBUb2tlbkNsYXNzLlN0cmluZ0xpdGVyYWw6XG4gICAgICAgIHJldHVybiB0aGlzLnBhcnNlU3RyaW5nTGl0ZXJhbCgpO1xuICAgICAgY2FzZSBUb2tlbkNsYXNzLk51bWVyaWNMaXRlcmFsOlxuICAgICAgICByZXR1cm4gdGhpcy5wYXJzZU51bWVyaWNMaXRlcmFsKCk7XG4gICAgICBjYXNlIFRva2VuQ2xhc3MuS2V5d29yZDpcbiAgICAgIHtcbiAgICAgICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLlRISVMpKSB7XG4gICAgICAgICAgdGhpcy5sZXgoKTtcbiAgICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LlRoaXNFeHByZXNzaW9uLCBzdGFydFRva2VuSW5kZXgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5GVU5DVElPTikpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24odGhpcy5wYXJzZUZ1bmN0aW9uKHRydWUpLCBzdGFydFRva2VuSW5kZXgpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBUb2tlbkNsYXNzLkJvb2xlYW5MaXRlcmFsOlxuICAgICAge1xuICAgICAgICBsZXQgdG9rZW4gPSB0aGlzLmxleCgpO1xuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkxpdGVyYWxCb29sZWFuRXhwcmVzc2lvbih0b2tlbi50eXBlID09IFRva2VuVHlwZS5UUlVFX0xJVEVSQUwpLCBzdGFydFRva2VuSW5kZXgpO1xuICAgICAgfVxuICAgICAgY2FzZSBUb2tlbkNsYXNzLk51bGxMaXRlcmFsOlxuICAgICAge1xuICAgICAgICB0aGlzLmxleCgpO1xuICAgICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkxpdGVyYWxOdWxsRXhwcmVzc2lvbiwgc3RhcnRUb2tlbkluZGV4KTtcbiAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5MQlJBQ0spKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VBcnJheUV4cHJlc3Npb24oKTtcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLm1hdGNoKFRva2VuVHlwZS5MQlJBQ0UpKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMucGFyc2VPYmplY3RFeHByZXNzaW9uKCk7XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuRElWKSB8fCB0aGlzLm1hdGNoKFRva2VuVHlwZS5BU1NJR05fRElWKSkge1xuICAgICAgICAgIHRoaXMuc2tpcENvbW1lbnQoKTtcbiAgICAgICAgICB0aGlzLmxvb2thaGVhZCA9IHRoaXMuc2NhblJlZ0V4cCgpO1xuICAgICAgICAgIGxldCB0b2tlbiA9IHRoaXMubGV4KCk7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGxldCBsYXN0U2xhc2ggPSB0b2tlbi52YWx1ZS5sYXN0SW5kZXhPZihcIi9cIik7XG4gICAgICAgICAgICBSZWdFeHAodG9rZW4udmFsdWUuc2xpY2UoMSwgbGFzdFNsYXNoKSwgdG9rZW4udmFsdWUuc2xpY2UobGFzdFNsYXNoICsgMSkpO1xuICAgICAgICAgIH0gY2F0Y2ggKHVudXNlZCkge1xuICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhUb2tlbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5JTlZBTElEX1JFR1VMQVJfRVhQUkVTU0lPTik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuTGl0ZXJhbFJlZ0V4cEV4cHJlc3Npb24odG9rZW4udmFsdWUpLCBzdGFydFRva2VuSW5kZXgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRoaXMubGV4KCkpO1xuICB9XG5cbiAgcGFyc2VOdW1lcmljTGl0ZXJhbCgpIHtcbiAgICBsZXQgc3RhcnRUb2tlbkluZGV4ID0gdGhpcy50b2tlbkluZGV4O1xuICAgIGlmICh0aGlzLnN0cmljdCAmJiB0aGlzLmxvb2thaGVhZC5vY3RhbCkge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhUb2tlbih0aGlzLmxvb2thaGVhZCwgRXJyb3JNZXNzYWdlcy5TVFJJQ1RfT0NUQUxfTElURVJBTCk7XG4gICAgfVxuICAgIGxldCB0b2tlbjIgPSB0aGlzLmxleCgpO1xuICAgIGxldCBub2RlID0gdG9rZW4yLl92YWx1ZSA9PT0gMS8wXG4gICAgICA/IG5ldyBTaGlmdC5MaXRlcmFsSW5maW5pdHlFeHByZXNzaW9uXG4gICAgICA6IG5ldyBTaGlmdC5MaXRlcmFsTnVtZXJpY0V4cHJlc3Npb24odG9rZW4yLl92YWx1ZSk7XG4gICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5vZGUsIHN0YXJ0VG9rZW5JbmRleCk7XG4gIH1cblxuICBwYXJzZVN0cmluZ0xpdGVyYWwoKSB7XG4gICAgbGV0IHN0YXJ0VG9rZW5JbmRleCA9IHRoaXMudG9rZW5JbmRleDtcbiAgICBpZiAodGhpcy5zdHJpY3QgJiYgdGhpcy5sb29rYWhlYWQub2N0YWwpIHtcbiAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3JXaXRoVG9rZW4odGhpcy5sb29rYWhlYWQsIEVycm9yTWVzc2FnZXMuU1RSSUNUX09DVEFMX0xJVEVSQUwpO1xuICAgIH1cbiAgICBsZXQgdG9rZW4yID0gdGhpcy5sZXgoKTtcbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LkxpdGVyYWxTdHJpbmdFeHByZXNzaW9uKHRva2VuMi5fdmFsdWUsIHRva2VuMi5zbGljZS50ZXh0KSxcbiAgICAgICAgc3RhcnRUb2tlbkluZGV4KTtcbiAgfVxuXG4gIHBhcnNlSWRlbnRpZmllcigpIHtcbiAgICBsZXQgc3RhcnRUb2tlbkluZGV4ID0gdGhpcy50b2tlbkluZGV4O1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuSWRlbnRpZmllcih0aGlzLmxleCgpLnZhbHVlKSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgfVxuXG4gIHBhcnNlQXJndW1lbnRMaXN0KCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MUEFSRU4pO1xuICAgIGxldCBhcmdzID0gdGhpcy5wYXJzZUFyZ3VtZW50cygpO1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgIHJldHVybiBhcmdzO1xuICB9XG5cbiAgcGFyc2VBcmd1bWVudHMoKSB7XG4gICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuUlBBUkVOKSB8fCB0aGlzLmVvZigpKSB7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9XG4gICAgICBsZXQgYXJnID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgICByZXN1bHQucHVzaChhcmcpO1xuICAgICAgaWYgKCF0aGlzLmVhdChUb2tlblR5cGUuQ09NTUEpKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLy8gMTEuMiBMZWZ0LUhhbmQtU2lkZSBFeHByZXNzaW9ucztcblxuICBwYXJzZU5vbkNvbXB1dGVkUHJvcGVydHkoKSB7XG4gICAgbGV0IHN0YXJ0VG9rZW5JbmRleCA9IHRoaXMudG9rZW5JbmRleDtcblxuICAgIGxldCB0b2tlbiA9IHRoaXMubGV4KCk7XG5cbiAgICBpZiAoISh0b2tlbiBpbnN0YW5jZW9mIElkZW50aWZpZXJMaWtlVG9rZW4pKSB7XG4gICAgICB0aHJvdyB0aGlzLmNyZWF0ZVVuZXhwZWN0ZWQodG9rZW4pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0LklkZW50aWZpZXIodG9rZW4udmFsdWUpLCBzdGFydFRva2VuSW5kZXgpO1xuICAgIH1cbiAgfVxuXG4gIHBhcnNlR3JvdXBFeHByZXNzaW9uKCkge1xuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MUEFSRU4pO1xuICAgIGxldCBleHByID0gdGhpcy5wYXJzZUV4cHJlc3Npb24oKTtcbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcbiAgICByZXR1cm4gZXhwcjtcbiAgfVxuXG5cbiAgcGFyc2VBcnJheUV4cHJlc3Npb24oKSB7XG4gICAgbGV0IHN0YXJ0VG9rZW5JbmRleCA9IHRoaXMudG9rZW5JbmRleDtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MQlJBQ0spO1xuXG4gICAgbGV0IGVsZW1lbnRzID0gdGhpcy5wYXJzZUFycmF5RXhwcmVzc2lvbkVsZW1lbnRzKCk7XG5cbiAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUkJSQUNLKTtcblxuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuQXJyYXlFeHByZXNzaW9uKGVsZW1lbnRzKSwgc3RhcnRUb2tlbkluZGV4KTtcbiAgfVxuXG4gIHBhcnNlQXJyYXlFeHByZXNzaW9uRWxlbWVudHMoKSB7XG4gICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuUkJSQUNLKSkge1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfVxuICAgICAgbGV0IGVsO1xuXG4gICAgICBpZiAodGhpcy5tYXRjaChUb2tlblR5cGUuQ09NTUEpKSB7XG4gICAgICAgIHRoaXMubGV4KCk7XG4gICAgICAgIGVsID0gbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVsID0gdGhpcy5wYXJzZUFzc2lnbm1lbnRFeHByZXNzaW9uKCk7XG4gICAgICAgIGlmICghdGhpcy5tYXRjaChUb2tlblR5cGUuUkJSQUNLKSkge1xuICAgICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5DT01NQSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJlc3VsdC5wdXNoKGVsKTtcbiAgICB9XG4gIH1cblxuICBwYXJzZU9iamVjdEV4cHJlc3Npb24oKSB7XG4gICAgbGV0IHN0YXJ0VG9rZW5JbmRleCA9IHRoaXMudG9rZW5JbmRleDtcblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MQlJBQ0UpO1xuXG4gICAgbGV0IHByb3BlcnR5TWFwID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICBsZXQgcHJvcGVydGllcyA9IHRoaXMucGFyc2VPYmplY3RFeHByZXNzaW9uSXRlbXMocHJvcGVydHlNYXApO1xuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLlJCUkFDRSk7XG5cbiAgICByZXR1cm4gdGhpcy5tYXJrTG9jYXRpb24obmV3IFNoaWZ0Lk9iamVjdEV4cHJlc3Npb24ocHJvcGVydGllcyksIHN0YXJ0VG9rZW5JbmRleCk7XG4gIH1cblxuXG4gIHBhcnNlT2JqZWN0RXhwcmVzc2lvbkl0ZW1zKHByb3BlcnR5TWFwKSB7XG4gICAgbGV0IHJlc3VsdCA9IFtdO1xuICAgIHdoaWxlICghdGhpcy5tYXRjaChUb2tlblR5cGUuUkJSQUNFKSkge1xuICAgICAgcmVzdWx0LnB1c2godGhpcy5wYXJzZU9iamVjdEV4cHJlc3Npb25JdGVtKHByb3BlcnR5TWFwKSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBwYXJzZU9iamVjdEV4cHJlc3Npb25JdGVtKHByb3BlcnR5TWFwKSB7XG4gICAgbGV0IHByb3BlcnR5ID0gdGhpcy5wYXJzZU9iamVjdFByb3BlcnR5KCk7XG4gICAgbGV0IHR5cGUgPSBwcm9wZXJ0eS50eXBlO1xuICAgIGxldCBrZXkgPSBcIiRcIiArIHByb3BlcnR5Lm5hbWUudmFsdWU7XG4gICAgbGV0IHZhbHVlID0ge30uaGFzT3duUHJvcGVydHkuY2FsbChwcm9wZXJ0eU1hcCwga2V5KSA/IHByb3BlcnR5TWFwW2tleV0gOiAwO1xuXG4gICAgaWYgKHt9Lmhhc093blByb3BlcnR5LmNhbGwocHJvcGVydHlNYXAsIGtleSkpIHtcbiAgICAgIGlmICgodmFsdWUgJiBJTklUX01BU0spICE9PSAwKSB7XG4gICAgICAgIGlmICh0aGlzLnN0cmljdCAmJiB0eXBlID09PSBcIkRhdGFQcm9wZXJ0eVwiIHx8IGtleSA9PSBcIiRfX3Byb3RvX19cIikge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5TVFJJQ1RfRFVQTElDQVRFX1BST1BFUlRZKTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlICE9PSBcIkRhdGFQcm9wZXJ0eVwiKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLkFDQ0VTU09SX0RBVEFfUFJPUEVSVFkpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAodHlwZSA9PT0gXCJEYXRhUHJvcGVydHlcIikge1xuICAgICAgICAgIHRocm93IHRoaXMuY3JlYXRlRXJyb3IoRXJyb3JNZXNzYWdlcy5BQ0NFU1NPUl9EQVRBX1BST1BFUlRZKTtcbiAgICAgICAgfSBlbHNlIGlmICgodmFsdWUgJiBHRVRURVJfTUFTSykgIT09IDAgJiYgdHlwZSA9PSBcIkdldHRlclwiXG4gICAgICAgICAgICB8fCAodmFsdWUgJiBTRVRURVJfTUFTSykgIT09IDAgJiYgdHlwZSA9PSBcIlNldHRlclwiKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcihFcnJvck1lc3NhZ2VzLkFDQ0VTU09SX0dFVF9TRVQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgY2FzZSBcIkRhdGFQcm9wZXJ0eVwiOlxuICAgICAgICBwcm9wZXJ0eU1hcFtrZXldID0gdmFsdWUgfCBJTklUX01BU0s7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIkdldHRlclwiOlxuICAgICAgICBwcm9wZXJ0eU1hcFtrZXldID0gdmFsdWUgfCBHRVRURVJfTUFTSztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiU2V0dGVyXCI6XG4gICAgICAgIHByb3BlcnR5TWFwW2tleV0gPSB2YWx1ZSB8IFNFVFRFUl9NQVNLO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJCUkFDRSkpIHtcbiAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5DT01NQSk7XG4gICAgfVxuICAgIHJldHVybiBwcm9wZXJ0eTtcbiAgfVxuXG4gIHBhcnNlT2JqZWN0UHJvcGVydHlLZXkoKSB7XG4gICAgbGV0IHRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG5cbiAgICAvLyBOb3RlOiBUaGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBvbmx5IGZyb20gcGFyc2VPYmplY3RQcm9wZXJ0eSgpLCB3aGVyZTtcbiAgICAvLyBFb2YgYW5kIFB1bmN0dWF0b3IgdG9rZW5zIGFyZSBhbHJlYWR5IGZpbHRlcmVkIG91dC5cblxuICAgIGlmICh0b2tlbiBpbnN0YW5jZW9mIFN0cmluZ0xpdGVyYWxUb2tlbikge1xuICAgICAgcmV0dXJuIG5ldyBTaGlmdC5TdGF0aWNQcm9wZXJ0eU5hbWUodGhpcy5wYXJzZVN0cmluZ0xpdGVyYWwoKS52YWx1ZSk7XG4gICAgfVxuICAgIGlmICh0b2tlbiBpbnN0YW5jZW9mIE51bWVyaWNMaXRlcmFsVG9rZW4pIHtcbiAgICAgIGxldCBudW1MaXRlcmFsID0gdGhpcy5wYXJzZU51bWVyaWNMaXRlcmFsKCk7XG4gICAgICByZXR1cm4gbmV3IFNoaWZ0LlN0YXRpY1Byb3BlcnR5TmFtZShcIlwiICsgKG51bUxpdGVyYWwudHlwZSA9PT0gXCJMaXRlcmFsSW5maW5pdHlFeHByZXNzaW9uXCIgPyAxIC8gMCA6IG51bUxpdGVyYWwudmFsdWUpKTtcbiAgICB9XG4gICAgaWYgKHRva2VuIGluc3RhbmNlb2YgSWRlbnRpZmllckxpa2VUb2tlbikge1xuICAgICAgcmV0dXJuIG5ldyBTaGlmdC5TdGF0aWNQcm9wZXJ0eU5hbWUodGhpcy5wYXJzZUlkZW50aWZpZXIoKS5uYW1lKTtcbiAgICB9XG5cbiAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuSU5WQUxJRF9QUk9QRVJUWV9OQU1FKTtcbiAgfVxuXG4gIHBhcnNlT2JqZWN0UHJvcGVydHkoKSB7XG4gICAgbGV0IHRva2VuID0gdGhpcy5sb29rYWhlYWQ7XG4gICAgbGV0IHN0YXJ0VG9rZW5JbmRleCA9IHRoaXMudG9rZW5JbmRleDtcblxuICAgIGlmICh0b2tlbi50eXBlID09PSBUb2tlblR5cGUuSURFTlRJRklFUikge1xuICAgICAgbGV0IGtleSA9IHRoaXMucGFyc2VPYmplY3RQcm9wZXJ0eUtleSgpO1xuICAgICAgbGV0IG5hbWUgPSB0b2tlbi52YWx1ZTtcbiAgICAgIGlmIChuYW1lLmxlbmd0aCA9PT0gMykge1xuICAgICAgICAvLyBQcm9wZXJ0eSBBc3NpZ25tZW50OiBHZXR0ZXIgYW5kIFNldHRlci5cbiAgICAgICAgaWYgKFwiZ2V0XCIgPT09IG5hbWUgJiYgIXRoaXMubWF0Y2goVG9rZW5UeXBlLkNPTE9OKSkge1xuICAgICAgICAgIGtleSA9IHRoaXMucGFyc2VPYmplY3RQcm9wZXJ0eUtleSgpO1xuICAgICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5MUEFSRU4pO1xuICAgICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgICAgICAgIGxldCBbYm9keSwgaXNTdHJpY3RdID0gdGhpcy5wYXJzZUZ1bmN0aW9uQm9keSgpO1xuICAgICAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuR2V0dGVyKGtleSwgYm9keSksIHN0YXJ0VG9rZW5JbmRleCk7XG4gICAgICAgIH0gZWxzZSBpZiAoXCJzZXRcIiA9PT0gbmFtZSAmJiAhdGhpcy5tYXRjaChUb2tlblR5cGUuQ09MT04pKSB7XG4gICAgICAgICAga2V5ID0gdGhpcy5wYXJzZU9iamVjdFByb3BlcnR5S2V5KCk7XG4gICAgICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG4gICAgICAgICAgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICAgICAgICBpZiAodG9rZW4udHlwZSAhPT0gVG9rZW5UeXBlLklERU5USUZJRVIpIHtcbiAgICAgICAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhUb2tlbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5VTkVYUEVDVEVEX1RPS0VOLCB0b2tlbi50eXBlLm5hbWUpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsZXQgcGFyYW0gPSB0aGlzLnBhcnNlVmFyaWFibGVJZGVudGlmaWVyKCk7XG4gICAgICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuUlBBUkVOKTtcbiAgICAgICAgICAgIGxldCBbYm9keSwgaXNTdHJpY3RdID0gdGhpcy5wYXJzZUZ1bmN0aW9uQm9keSgpO1xuICAgICAgICAgICAgaWYgKCh0aGlzLnN0cmljdCB8fCBpc1N0cmljdCkgJiYgaXNSZXN0cmljdGVkV29yZChwYXJhbS5uYW1lKSkge1xuICAgICAgICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yKEVycm9yTWVzc2FnZXMuU1RSSUNUX1BBUkFNX05BTUUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5TZXR0ZXIoa2V5LCBwYXJhbSwgYm9keSksIHN0YXJ0VG9rZW5JbmRleCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5DT0xPTik7XG4gICAgICBsZXQgdmFsdWUgPSB0aGlzLnBhcnNlQXNzaWdubWVudEV4cHJlc3Npb24oKTtcbiAgICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgU2hpZnQuRGF0YVByb3BlcnR5KGtleSwgdmFsdWUpLCBzdGFydFRva2VuSW5kZXgpO1xuICAgIH1cbiAgICBpZiAodGhpcy5lb2YoKSB8fCB0b2tlbi50eXBlLmtsYXNzID09IFRva2VuQ2xhc3MuUHVuY3R1YXRvcikge1xuICAgICAgdGhyb3cgdGhpcy5jcmVhdGVVbmV4cGVjdGVkKHRva2VuKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IGtleSA9IHRoaXMucGFyc2VPYmplY3RQcm9wZXJ0eUtleSgpO1xuICAgICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkNPTE9OKTtcbiAgICAgIGxldCB2YWx1ZSA9IHRoaXMucGFyc2VBc3NpZ25tZW50RXhwcmVzc2lvbigpO1xuICAgICAgcmV0dXJuIHRoaXMubWFya0xvY2F0aW9uKG5ldyBTaGlmdC5EYXRhUHJvcGVydHkoa2V5LCB2YWx1ZSksIHN0YXJ0VG9rZW5JbmRleCk7XG4gICAgfVxuICB9XG5cbiAgcGFyc2VGdW5jdGlvbihpc0V4cHJlc3Npb24pIHtcbiAgICBsZXQgc3RhcnRUb2tlbkluZGV4ID0gdGhpcy50b2tlbkluZGV4O1xuXG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkZVTkNUSU9OKTtcblxuICAgIGxldCBpZCA9IG51bGw7XG4gICAgbGV0IG1lc3NhZ2UgPSBudWxsO1xuICAgIGxldCBmaXJzdFJlc3RyaWN0ZWQgPSBudWxsO1xuICAgIGlmICghaXNFeHByZXNzaW9uIHx8ICF0aGlzLm1hdGNoKFRva2VuVHlwZS5MUEFSRU4pKSB7XG4gICAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICAgIGlkID0gdGhpcy5wYXJzZVZhcmlhYmxlSWRlbnRpZmllcigpO1xuICAgICAgaWYgKHRoaXMuc3RyaWN0KSB7XG4gICAgICAgIGlmIChpc1Jlc3RyaWN0ZWRXb3JkKGlkLm5hbWUpKSB7XG4gICAgICAgICAgdGhyb3cgdGhpcy5jcmVhdGVFcnJvcldpdGhUb2tlbih0b2tlbiwgRXJyb3JNZXNzYWdlcy5TVFJJQ1RfRlVOQ1RJT05fTkFNRSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChpc1Jlc3RyaWN0ZWRXb3JkKGlkLm5hbWUpKSB7XG4gICAgICAgICAgZmlyc3RSZXN0cmljdGVkID0gdG9rZW47XG4gICAgICAgICAgbWVzc2FnZSA9IEVycm9yTWVzc2FnZXMuU1RSSUNUX0ZVTkNUSU9OX05BTUU7XG4gICAgICAgIH0gZWxzZSBpZiAoaXNTdHJpY3RNb2RlUmVzZXJ2ZWRXb3JkRVM1KGlkLm5hbWUpKSB7XG4gICAgICAgICAgZmlyc3RSZXN0cmljdGVkID0gdG9rZW47XG4gICAgICAgICAgbWVzc2FnZSA9IEVycm9yTWVzc2FnZXMuU1RSSUNUX1JFU0VSVkVEX1dPUkQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgbGV0IGluZm8gPSB0aGlzLnBhcnNlUGFyYW1zKGZpcnN0UmVzdHJpY3RlZCk7XG5cbiAgICBpZiAoaW5mby5tZXNzYWdlICE9IG51bGwpIHtcbiAgICAgIG1lc3NhZ2UgPSBpbmZvLm1lc3NhZ2U7XG4gICAgfVxuXG4gICAgbGV0IHByZXZpb3VzU3RyaWN0ID0gdGhpcy5zdHJpY3Q7XG4gICAgbGV0IFtib2R5LCBpc1N0cmljdF0gPSB0aGlzLnBhcnNlRnVuY3Rpb25Cb2R5KCk7XG4gICAgaWYgKG1lc3NhZ2UgIT0gbnVsbCkge1xuICAgICAgaWYgKCh0aGlzLnN0cmljdCB8fCBpc1N0cmljdCkgJiYgaW5mby5maXJzdFJlc3RyaWN0ZWQgIT0gbnVsbCkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aFRva2VuKGluZm8uZmlyc3RSZXN0cmljdGVkLCBtZXNzYWdlKTtcbiAgICAgIH1cbiAgICAgIGlmICgodGhpcy5zdHJpY3QgfHwgaXNTdHJpY3QpICYmIGluZm8uc3RyaWN0ZWQgIT0gbnVsbCkge1xuICAgICAgICB0aHJvdyB0aGlzLmNyZWF0ZUVycm9yV2l0aFRva2VuKGluZm8uc3RyaWN0ZWQsIG1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnN0cmljdCA9IHByZXZpb3VzU3RyaWN0O1xuICAgIHJldHVybiB0aGlzLm1hcmtMb2NhdGlvbihuZXcgKGlzRXhwcmVzc2lvbiA/IFNoaWZ0LkZ1bmN0aW9uRXhwcmVzc2lvbiA6IFNoaWZ0LkZ1bmN0aW9uRGVjbGFyYXRpb24pKGZhbHNlLCBpZCwgaW5mby5wYXJhbXMsIG51bGwsIGJvZHkpLFxuICAgICAgICBzdGFydFRva2VuSW5kZXgpO1xuICB9XG5cblxuICBwYXJzZVBhcmFtcyhmcikge1xuICAgIGxldCBpbmZvID0ge3BhcmFtczogW119O1xuICAgIGluZm8uZmlyc3RSZXN0cmljdGVkID0gZnI7XG4gICAgdGhpcy5leHBlY3QoVG9rZW5UeXBlLkxQQVJFTik7XG5cbiAgICBpZiAoIXRoaXMubWF0Y2goVG9rZW5UeXBlLlJQQVJFTikpIHtcbiAgICAgIGxldCBwYXJhbVNldCA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbiAgICAgIHdoaWxlICghdGhpcy5lb2YoKSkge1xuICAgICAgICBsZXQgdG9rZW4gPSB0aGlzLmxvb2thaGVhZDtcbiAgICAgICAgbGV0IHBhcmFtID0gdGhpcy5wYXJzZVZhcmlhYmxlSWRlbnRpZmllcigpO1xuICAgICAgICBsZXQga2V5ID0gXCIkXCIgKyBwYXJhbS5uYW1lO1xuICAgICAgICBpZiAodGhpcy5zdHJpY3QpIHtcbiAgICAgICAgICBpZiAodG9rZW4gaW5zdGFuY2VvZiBJZGVudGlmaWVyTGlrZVRva2VuICYmIGlzUmVzdHJpY3RlZFdvcmQocGFyYW0ubmFtZSkpIHtcbiAgICAgICAgICAgIGluZm8uc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgICAgIGluZm8ubWVzc2FnZSA9IEVycm9yTWVzc2FnZXMuU1RSSUNUX1BBUkFNX05BTUU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh7fS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHBhcmFtU2V0LCBrZXkpKSB7XG4gICAgICAgICAgICBpbmZvLnN0cmljdGVkID0gdG9rZW47XG4gICAgICAgICAgICBpbmZvLm1lc3NhZ2UgPSBFcnJvck1lc3NhZ2VzLlNUUklDVF9QQVJBTV9EVVBFO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChpbmZvLmZpcnN0UmVzdHJpY3RlZCA9PSBudWxsKSB7XG4gICAgICAgICAgaWYgKHRva2VuIGluc3RhbmNlb2YgSWRlbnRpZmllckxpa2VUb2tlbiAmJiBpc1Jlc3RyaWN0ZWRXb3JkKHBhcmFtLm5hbWUpKSB7XG4gICAgICAgICAgICBpbmZvLmZpcnN0UmVzdHJpY3RlZCA9IHRva2VuO1xuICAgICAgICAgICAgaW5mby5tZXNzYWdlID0gRXJyb3JNZXNzYWdlcy5TVFJJQ1RfUEFSQU1fTkFNRTtcbiAgICAgICAgICB9IGVsc2UgaWYgKFNUUklDVF9NT0RFX1JFU0VSVkVEX1dPUkQuaW5kZXhPZihwYXJhbS5uYW1lKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIGluZm8uZmlyc3RSZXN0cmljdGVkID0gdG9rZW47XG4gICAgICAgICAgICBpbmZvLm1lc3NhZ2UgPSBFcnJvck1lc3NhZ2VzLlNUUklDVF9SRVNFUlZFRF9XT1JEO1xuICAgICAgICAgIH0gZWxzZSBpZiAoe30uaGFzT3duUHJvcGVydHkuY2FsbChwYXJhbVNldCwga2V5KSkge1xuICAgICAgICAgICAgaW5mby5maXJzdFJlc3RyaWN0ZWQgPSB0b2tlbjtcbiAgICAgICAgICAgIGluZm8ubWVzc2FnZSA9IEVycm9yTWVzc2FnZXMuU1RSSUNUX1BBUkFNX0RVUEU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGluZm8ucGFyYW1zLnB1c2gocGFyYW0pO1xuICAgICAgICBwYXJhbVNldFtrZXldID0gdHJ1ZTtcbiAgICAgICAgaWYgKHRoaXMubWF0Y2goVG9rZW5UeXBlLlJQQVJFTikpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmV4cGVjdChUb2tlblR5cGUuQ09NTUEpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuZXhwZWN0KFRva2VuVHlwZS5SUEFSRU4pO1xuICAgIHJldHVybiBpbmZvO1xuICB9XG5cblxufVxuIl19