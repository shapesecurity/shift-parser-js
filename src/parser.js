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

import {
    FunctionBody,
    FunctionDeclaration,
    FunctionExpression,
    ObjectExpression,
    Getter,
    Setter,
    DataProperty,
    PropertyName,
    LiteralBooleanExpression,
    LiteralNullExpression,
    LiteralNumericExpression,
    LiteralRegExpExpression,
    LiteralStringExpression,
    ArrayExpression,
    AssignmentExpression,
    BinaryExpression,
    CallExpression,
    ComputedMemberExpression,
    ConditionalExpression,
    IdentifierExpression,
    NewExpression,
    PostfixExpression,
    PrefixExpression,
    StaticMemberExpression,
    ThisExpression,
    BlockStatement,
    BreakStatement,
    ContinueStatement,
    DebuggerStatement,
    DoWhileStatement,
    EmptyStatement,
    ExpressionStatement,
    ForInStatement,
    ForStatement,
    IfStatement,
    LabeledStatement,
    ReturnStatement,
    SwitchStatement,
    SwitchStatementWithDefault,
    ThrowStatement,
    TryCatchStatement,
    TryFinallyStatement,
    VariableDeclarationStatement,
    WhileStatement,
    WithStatement,
    UnknownDirective,
    UseStrictDirective,
    Block,
    CatchClause,
    Identifier,
    Script,
    SwitchCase,
    SwitchDefault,
    VariableDeclaration,
    VariableDeclarator,
    } from "shift-ast";

import {isRestrictedWord, isStrictModeReservedWordES5} from "./utils";

import {ErrorMessages} from "./errors";

import Tokenizer, {
    TokenClass,
    TokenType,
    IdentifierToken,
    IdentifierLikeToken,
    NumericLiteralToken,
    StringLiteralToken} from "./tokenizer";

const INIT_MASK = 1;
const GETTER_MASK = 2;
const SETTER_MASK = 4;

const STRICT_MODE_RESERVED_WORD = [
  "implements", "interface", "package", "private", "protected", "public", "static", "yield", "let"];

const Precedence = {
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

const BinaryPrecedence = {
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
  "/": Precedence.Multiplicative,
};

export class Parser extends Tokenizer {
  constructor(source) {
    super(source);
    this.labelSet = Object.create(null);
    this.allowIn = true;
    this.inIteration = false;
    this.inSwitch = false;
    this.inFunctionBody = false;
  }

  eat(tokenType) {
    if (this.lookahead.type === tokenType) {
      return this.lex();
    }
  }

  expect(tokenType) {
    if (this.lookahead.type === tokenType) {
      return this.lex();
    }
    throw this.createUnexpected(this.lookahead);
  }

  match(subType) {
    return this.lookahead.type === subType;
  }

  consumeSemicolon() {
    // Catch the very common case first: immediately a semicolon (U+003B).
    if (this.index < this.source.length && this.source.charAt(this.index) == ';') {
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
  }

  // this is a no-op, reserved for future use
  markLocation(node, startTokenIndex, endTokenIndex = this.tokenIndex) {
    // TODO: mark the source locations.
    return node;
  }

  parseScript() {
    var [body, isStrict] = this.parseBody(true);
    return new Script(this.markLocation(body, 0));
  }

  parseFunctionBody() {
    let previousStrict = this.strict;
    let startTokenIndex = this.tokenIndex;

    let oldLabelSet = this.labelSet;
    let oldInIteration = this.inIteration;
    let oldInSwitch = this.inSwitch;
    let oldInFunctionBody = this.inFunctionBody;

    this.labelSet = Object.create(null);
    this.inIteration = false;
    this.inSwitch = false;
    this.inFunctionBody = true;

    this.expect(TokenType.LBRACE);
    let [body, isStrict] = this.parseBody();
    this.expect(TokenType.RBRACE);

    body = this.markLocation(body, startTokenIndex);

    this.labelSet = oldLabelSet;
    this.inIteration = oldInIteration;
    this.inSwitch = oldInSwitch;
    this.inFunctionBody = oldInFunctionBody;
    this.strict = previousStrict;
    return [body, isStrict];
  }

  parseBody(acceptEOF = false) {
    let directives = [];
    let statements = [];
    let parsingDirectives = true;
    let isStrict = this.strict;
    let firstRestricted = null;
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
      let token = this.lookahead;
      let text = token.slice.text;
      let isStringLiteral = token instanceof StringLiteralToken;
      let stmt = this.parseStatement();
      if (parsingDirectives) {
        if (isStringLiteral && stmt.type === "ExpressionStatement" &&
            stmt.expression.type === "LiteralStringExpression") {
          if (text === "\"use strict\"" || text === "'use strict'") {
            directives.push(new UseStrictDirective());
            isStrict = true;
            this.strict = true;
            if (firstRestricted != null) {
              throw this.createErrorWithToken(firstRestricted, ErrorMessages.STRICT_OCTAL_LITERAL);
            }
          } else {
            directives.push(new UnknownDirective(stmt.expression.value));
            if (firstRestricted == null && token.octal) {
              firstRestricted = token;
            }
          }
        } else {
          parsingDirectives = false;
          statements.push(stmt);
        }
      } else {
        statements.push(stmt);
      }
    }

    return [new FunctionBody(directives, statements), isStrict];
  }


  parseStatement() {
    let startTokenIndex = this.tokenIndex;
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
        let expr = this.parseExpression();

        // 12.12 Labelled Statements;
        if (expr.type === "IdentifierExpression" && this.match(TokenType.COLON)) {
          this.lex();
          let key = '$' + expr.identifier.name;
          if (Object.prototype.hasOwnProperty.call(this.labelSet, key)) {
            throw this.createError(ErrorMessages.LABEL_REDECLARATION, expr.identifier.name);
          }

          this.labelSet[key] = true;
          let labeledBody = this.parseStatement();
          delete this.labelSet[key];
          return this.markLocation(new LabeledStatement(expr.identifier, labeledBody), startTokenIndex);
        } else {
          this.consumeSemicolon();
          return this.markLocation(new ExpressionStatement(expr), startTokenIndex);
        }
      }
    }

  }

  parseVariableIdentifier() {
    let startTokenIndex = this.tokenIndex;

    let token = this.lex();
    if (!(token instanceof IdentifierToken)) {
      throw this.createUnexpected(token);
    }

    return this.markLocation(new Identifier(token.value), startTokenIndex);
  }

  parseEmptyStatement() {
    this.expect(TokenType.SEMICOLON);
    return new EmptyStatement();
  }

  parseBlockStatement() {
    return new BlockStatement(this.parseBlock());
  }

  parseExpressionStatement() {
    let expr = this.parseExpression();
    this.consumeSemicolon();
    return new ExpressionStatement(expr);
  }

  parseBreakStatement() {
    let token = this.lookahead;
    this.expect(TokenType.BREAK);

    // Catch the very common case first: immediately a semicolon (U+003B).
    if (this.lookahead.type == TokenType.SEMICOLON) {
      this.lex();

      if (!(this.inIteration || this.inSwitch)) {
        throw this.createErrorWithToken(token, ErrorMessages.ILLEGAL_BREAK);
      }

      return new BreakStatement(null);
    }

    if (this.hasLineTerminatorBeforeNext) {
      if (!(this.inIteration || this.inSwitch)) {
        throw this.createErrorWithToken(token, ErrorMessages.ILLEGAL_BREAK);
      }

      return new BreakStatement(null);
    }

    let label = null;
    if (this.lookahead.type == TokenType.IDENTIFIER) {
      label = this.parseVariableIdentifier();

      let key = '$' + label.name;
      if (!Object.prototype.hasOwnProperty.call(this.labelSet, key)) {
        throw this.createError(ErrorMessages.UNKNOWN_LABEL, label.name);
      }
    }

    this.consumeSemicolon();

    if (label == null && !(this.inIteration || this.inSwitch)) {
      throw this.createErrorWithToken(token, ErrorMessages.ILLEGAL_BREAK);
    }

    return new BreakStatement(label);
  }

  parseContinueStatement() {
    let token = this.lookahead;
    this.expect(TokenType.CONTINUE);

    // Catch the very common case first: immediately a semicolon (U+003B).
    if (this.lookahead.type == TokenType.SEMICOLON) {
      this.lex();
      if (!this.inIteration) {
        throw this.createErrorWithToken(token, ErrorMessages.ILLEGAL_CONTINUE);
      }

      return new ContinueStatement(null);
    }

    if (this.hasLineTerminatorBeforeNext) {
      if (!this.inIteration) {
        throw this.createErrorWithToken(token, ErrorMessages.ILLEGAL_CONTINUE);
      }

      return new ContinueStatement(null);
    }

    let label = null;
    if (this.lookahead.type == TokenType.IDENTIFIER) {
      label = this.parseVariableIdentifier();

      let key = '$' + label.name;
      if (!Object.prototype.hasOwnProperty.call(this.labelSet, key)) {
        throw this.createError(ErrorMessages.UNKNOWN_LABEL, label.name);
      }
    }

    this.consumeSemicolon();
    if (!this.inIteration) {
      throw this.createErrorWithToken(token, ErrorMessages.ILLEGAL_CONTINUE);
    }

    return new ContinueStatement(label);
  }


  parseDebuggerStatement() {
    this.expect(TokenType.DEBUGGER);
    this.consumeSemicolon();
    return new DebuggerStatement();
  }

  parseDoWhileStatement() {
    this.expect(TokenType.DO);
    let oldInIteration = this.inIteration;
    this.inIteration = true;

    let body = this.parseStatement();
    this.inIteration = oldInIteration;

    this.expect(TokenType.WHILE);
    this.expect(TokenType.LPAREN);
    let test = this.parseExpression();
    this.expect(TokenType.RPAREN);
    if (this.match(TokenType.SEMICOLON)) {
      this.lex();
    }

    return new DoWhileStatement(body, test);
  }

  static isLeftHandSide(expr) {
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
  }

  parseForStatement() {
    this.expect(TokenType.FOR);
    this.expect(TokenType.LPAREN);
    let test = null;
    let right = null;
    if (this.match(TokenType.SEMICOLON)) {
      this.lex();
      if (!this.match(TokenType.SEMICOLON)) {
        test = this.parseExpression();
      }
      this.expect(TokenType.SEMICOLON);
      if (!this.match(TokenType.RPAREN)) {
        right = this.parseExpression();
      }
      return new ForStatement(
          null,
          test,
          right,
          this.getIteratorStatementEpilogue()
      );
    } else {
      if (this.match(TokenType.VAR) || this.match(TokenType.LET)) {
        let previousAllowIn = this.allowIn;
        this.allowIn = false;
        let initDecl = this.parseVariableDeclaration();
        this.allowIn = previousAllowIn;

        if (initDecl.declarators.length === 1 && this.match(TokenType.IN)) {
          this.lex();
          right = this.parseExpression();
          return new ForInStatement(initDecl, right, this.getIteratorStatementEpilogue());
        } else {
          this.expect(TokenType.SEMICOLON);
          if (!this.match(TokenType.SEMICOLON)) {
            test = this.parseExpression();
          }
          this.expect(TokenType.SEMICOLON);
          if (!this.match(TokenType.RPAREN)) {
            right = this.parseExpression();
          }
          return new ForStatement(initDecl, test, right, this.getIteratorStatementEpilogue());
        }
      } else {
        let previousAllowIn = this.allowIn;
        this.allowIn = false;
        let init = this.parseExpression();
        this.allowIn = previousAllowIn;

        if (this.match(TokenType.IN)) {
          if (!Parser.isLeftHandSide(init)) {
            throw this.createError(ErrorMessages.INVALID_LHS_IN_FOR_IN);
          }

          this.lex();
          right = this.parseExpression();
          return new ForInStatement(init, right, this.getIteratorStatementEpilogue());
        } else {
          this.expect(TokenType.SEMICOLON);
          if (!this.match(TokenType.SEMICOLON)) {
            test = this.parseExpression();
          }
          this.expect(TokenType.SEMICOLON);
          if (!this.match(TokenType.RPAREN)) {
            right = this.parseExpression();
          }
          return new ForStatement(init, test, right, this.getIteratorStatementEpilogue());
        }
      }
    }
  }

  getIteratorStatementEpilogue() {
    this.expect(TokenType.RPAREN);
    let oldInIteration = this.inIteration;
    this.inIteration = true;
    let body = this.parseStatement();
    this.inIteration = oldInIteration;
    return body;
  }

  parseIfStatement() {
    this.expect(TokenType.IF);
    this.expect(TokenType.LPAREN);
    let test = this.parseExpression();

    this.expect(TokenType.RPAREN);
    let consequent = this.parseStatement();
    let alternate = null;
    if (this.match(TokenType.ELSE)) {
      this.lex();
      alternate = this.parseStatement();
    }
    return new IfStatement(test, consequent, alternate);
  }

  parseReturnStatement() {
    let argument = null;

    this.expect(TokenType.RETURN);
    if (!this.inFunctionBody) {
      throw this.createError(ErrorMessages.ILLEGAL_RETURN);
    }

    if (this.hasLineTerminatorBeforeNext) {
      return new ReturnStatement(null);
    }

    if (!this.match(TokenType.SEMICOLON)) {
      if (!this.match(TokenType.RBRACE) && !this.eof()) {
        argument = this.parseExpression();
      }
    }

    this.consumeSemicolon();
    return new ReturnStatement(argument);
  }

  parseWithStatement() {
    if (this.strict) {
      throw this.createError(ErrorMessages.STRICT_MODE_WITH);
    }

    this.expect(TokenType.WITH);
    this.expect(TokenType.LPAREN);
    let object = this.parseExpression();
    this.expect(TokenType.RPAREN);
    let body = this.parseStatement();

    return new WithStatement(object, body);
  }

  parseSwitchStatement() {
    this.expect(TokenType.SWITCH);
    this.expect(TokenType.LPAREN);
    let discriminant = this.parseExpression();
    this.expect(TokenType.RPAREN);
    this.expect(TokenType.LBRACE);

    if (this.match(TokenType.RBRACE)) {
      this.lex();
      return new SwitchStatement(discriminant, []);
    }
    let oldInSwitch = this.inSwitch;
    this.inSwitch = true;

    let cases = this.parseSwitchCases();

    if (this.match(TokenType.DEFAULT)) {
      let switchDefault = this.parseSwitchDefault();
      let postDefaultCases = this.parseSwitchCases();
      if (this.match(TokenType.DEFAULT)) {
        throw this.createError(ErrorMessages.MULTIPLE_DEFAULTS_IN_SWITCH);
      }
      this.inSwitch = oldInSwitch;
      this.expect(TokenType.RBRACE);
      return new SwitchStatementWithDefault(discriminant, cases, switchDefault, postDefaultCases);
    } else {
      this.inSwitch = oldInSwitch;
      this.expect(TokenType.RBRACE);
      return new SwitchStatement(discriminant, cases);
    }
  }

  parseSwitchCases() {
    let result = [];
    while (!(this.eof() || this.match(TokenType.RBRACE) || this.match(TokenType.DEFAULT))) {
      result.push(this.parseSwitchCase());
    }
    return result;
  }

  parseSwitchCase() {
    let startTokenIndex = this.tokenIndex;
    this.expect(TokenType.CASE);
    return this.markLocation(new SwitchCase(this.parseExpression(), this.parseSwitchCaseBody()), startTokenIndex);
  }

  parseSwitchDefault() {
    let startTokenIndex = this.tokenIndex;
    this.expect(TokenType.DEFAULT);
    return this.markLocation(new SwitchDefault(this.parseSwitchCaseBody()), startTokenIndex);
  }

  parseSwitchCaseBody() {
    this.expect(TokenType.COLON);
    return this.parseStatementListInSwitchCaseBody();
  }

  parseStatementListInSwitchCaseBody() {
    let result = [];
    while (!(this.eof() || this.match(TokenType.RBRACE) || this.match(TokenType.DEFAULT)
    || this.match(TokenType.CASE))) {
      result.push(this.parseStatement());
    }
    return result;
  }

  parseThrowStatement() {
    let token = this.expect(TokenType.THROW);

    if (this.hasLineTerminatorBeforeNext) {
      throw this.createErrorWithToken(token, ErrorMessages.NEWLINE_AFTER_THROW);
    }

    let argument = this.parseExpression();

    this.consumeSemicolon();

    return new ThrowStatement(argument);
  }

  parseTryStatement() {
    this.expect(TokenType.TRY);
    let block = this.parseBlock();

    if (this.match(TokenType.CATCH)) {
      let handler = this.parseCatchClause();
      if (this.match(TokenType.FINALLY)) {
        this.lex();
        let finalizer = this.parseBlock();
        return new TryFinallyStatement(block, handler, finalizer);
      }
      return new TryCatchStatement(block, handler);
    }

    if (this.match(TokenType.FINALLY)) {
      this.lex();
      let finalizer = this.parseBlock();
      return new TryFinallyStatement(block, null, finalizer);
    } else {
      throw this.createError(ErrorMessages.NO_CATCH_OR_FINALLY);
    }
  }

  parseVariableDeclarationStatement() {
    let declaration = this.parseVariableDeclaration();
    this.consumeSemicolon();
    return new VariableDeclarationStatement(declaration);
  }

  parseWhileStatement() {
    this.expect(TokenType.WHILE);
    this.expect(TokenType.LPAREN);
    return new WhileStatement(this.parseExpression(), this.getIteratorStatementEpilogue());
  }

  parseCatchClause() {
    let startTokenIndex = this.tokenIndex;

    this.expect(TokenType.CATCH);
    this.expect(TokenType.LPAREN);
    if (this.match(TokenType.RPAREN)) {
      throw this.createUnexpected(this.lookahead);
    }

    let param = this.parseVariableIdentifier();

    // 12.14.1;
    if (this.strict && isRestrictedWord(param.name)) {
      throw this.createError(ErrorMessages.STRICT_CATCH_VARIABLE);
    }

    this.expect(TokenType.RPAREN);

    let body = this.parseBlock();

    return this.markLocation(new CatchClause(param, body), startTokenIndex);
  }

  parseBlock() {
    let startTokenIndex = this.tokenIndex;
    this.expect(TokenType.LBRACE);

    let body = [];
    while (!this.match(TokenType.RBRACE)) {
      body.push(this.parseStatement());
    }
    this.expect(TokenType.RBRACE);

    return this.markLocation(new Block(body), startTokenIndex);
  }

  parseVariableDeclaration() {
    let startTokenIndex = this.tokenIndex;
    let token = this.lex();

    // Preceded by this.match(TokenSubType.VAR) || this.match(TokenSubType.LET);
    let kind = token.type == TokenType.VAR ? "var" : token.type === TokenType.CONST ? "const" : "let";
    let declarators = this.parseVariableDeclaratorList(kind);
    return this.markLocation(new VariableDeclaration(kind, declarators), startTokenIndex);
  }

  parseVariableDeclaratorList(kind) {
    let result = [];
    while (true) {
      result.push(this.parseVariableDeclarator(kind));
      if (!this.eat(TokenType.COMMA)) {
        return result;
      }
    }
  }

  parseVariableDeclarator(kind) {
    let startTokenIndex = this.tokenIndex;

    let id = this.parseVariableIdentifier();

    // 12.2.1;
    if (this.strict && isRestrictedWord(id.name)) {
      throw this.createError(ErrorMessages.STRICT_VAR_NAME);
    }

    let init = null;
    if (kind == "const") {
      this.expect(TokenType.ASSIGN);
      init = this.parseAssignmentExpression();
    } else if (this.match(TokenType.ASSIGN)) {
      this.lex();
      init = this.parseAssignmentExpression();
    }
    return this.markLocation(new VariableDeclarator(id, init), startTokenIndex);
  }

  parseExpression() {
    let startTokenIndex = this.tokenIndex;

    let expr = this.parseAssignmentExpression();

    if (this.match(TokenType.COMMA)) {
      while (!this.eof()) {
        if (!this.match(TokenType.COMMA)) {
          break;
        }
        this.lex();
        expr = this.markLocation(new BinaryExpression(",", expr, this.parseAssignmentExpression()),
            startTokenIndex);
      }
    }
    return expr;
  }

  parseAssignmentExpression() {
    let token = this.lookahead;
    let startTokenIndex = this.tokenIndex;

    let node = this.parseConditionalExpression();

    let isOperator = false;
    let operator = this.lookahead;
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
      // To be permissive.
      // if (!isLeftHandSide(node)) {
      //     throw this.createError(ErrorMessages.INVALID_LHS_IN_ASSIGNMENT);
      // }

      // 11.13.1;
      if (node.type === "IdentifierExpression") {
        if (this.strict && isRestrictedWord(node.identifier.name)) {
          throw this.createErrorWithToken(token, ErrorMessages.STRICT_LHS_ASSIGNMENT);
        }
      }

      this.lex();
      let right = this.parseAssignmentExpression();
      return this.markLocation(new AssignmentExpression(operator.type.name, node, right), startTokenIndex);
    }
    return node;
  }

  parseConditionalExpression() {
    let startTokenIndex = this.tokenIndex;
    let expr = this.parseBinaryExpression();
    if (this.match(TokenType.CONDITIONAL)) {
      this.lex();
      let previousAllowIn = this.allowIn;
      this.allowIn = true;
      let consequent = this.parseAssignmentExpression();
      this.allowIn = previousAllowIn;
      this.expect(TokenType.COLON);
      let alternate = this.parseAssignmentExpression();
      return this.markLocation(new ConditionalExpression(expr, consequent, alternate), startTokenIndex);
    }

    return expr;
  }

  isBinaryOperator(type) {
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
  }

  parseBinaryExpression() {
    let left = this.parseUnaryExpression();
    let operator = this.lookahead.type;

    let isBinaryOperator = this.isBinaryOperator(operator);
    if (!isBinaryOperator) {
      return left;
    }

    this.lex();
    let stack = [];
    stack.push({startIndex: this.tokenIndex, left, operator, precedence: BinaryPrecedence[operator.name]});
    let right = this.parseUnaryExpression();

    operator = this.lookahead.type;
    isBinaryOperator = this.isBinaryOperator(this.lookahead.type);
    while (isBinaryOperator) {
      let precedence = BinaryPrecedence[operator.name];
      // Reduce: make a binary expression from the three topmost entries.
      while (stack.length && (precedence <= stack[stack.length - 1].precedence)) {
        let stackItem = stack[stack.length - 1];
        let stackOperator = stackItem.operator;
        left = stackItem.left;
        stack.pop();
        right = this.markLocation(
            new BinaryExpression(stackOperator.name, left, right),
            stackItem.startIndex,
            this.tokenIndex);
      }

      // Shift.
      this.lex();
      stack.push({startIndex: this.tokenIndex, left: right, operator, precedence});
      right = this.parseUnaryExpression();

      operator = this.lookahead.type;
      isBinaryOperator = this.isBinaryOperator(operator);
    }

    // Final reduce to clean-up the stack.
    return stack.reduceRight(
        (expr, stackItem) => this.markLocation(
            new BinaryExpression(stackItem.operator.name, stackItem.left, expr),
            stackItem.startIndex,
            this.tokenIndex),
        right);
  }

  static isPrefixOperator(type) {
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
  }

  parseUnaryExpression() {
    if (this.lookahead.type.klass != TokenClass.Punctuator && this.lookahead.type.klass != TokenClass.Keyword) {
      return this.parsePostfixExpression();
    }
    let startTokenIndex = this.tokenIndex;
    let operator = this.lookahead;
    if (!Parser.isPrefixOperator(operator.type)) {
      return this.parsePostfixExpression();
    }
    this.lex();
    let expr = this.parseUnaryExpression();
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

    return this.markLocation(new PrefixExpression(operator.value, expr), startTokenIndex);
  }

  parsePostfixExpression() {
    let startTokenIndex = this.tokenIndex;

    let expr = this.parseLeftHandSideExpressionAllowCall();

    if (this.hasLineTerminatorBeforeNext) {
      return expr;
    }

    let operator = this.lookahead;
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
    return this.markLocation(new PostfixExpression(expr, operator.value), startTokenIndex);
  }

  parseLeftHandSideExpressionAllowCall() {
    let startTokenIndex = this.tokenIndex;
    let previousAllowIn = this.allowIn;
    this.allowIn = true;
    let expr = this.match(TokenType.NEW) ? this.parseNewExpression() : this.parsePrimaryExpression();

    while (true) {
      if (this.match(TokenType.LPAREN)) {
        expr = this.markLocation(new CallExpression(expr, this.parseArgumentList()), startTokenIndex);
      } else if (this.match(TokenType.LBRACK)) {
        expr = this.markLocation(new ComputedMemberExpression(expr, this.parseComputedMember()), startTokenIndex);
      } else if (this.match(TokenType.PERIOD)) {
        expr = this.markLocation(new StaticMemberExpression(expr, this.parseNonComputedMember()), startTokenIndex);
      } else {
        break;
      }
    }

    this.allowIn = previousAllowIn;

    return expr;
  }

  parseLeftHandSideExpression() {
    let startTokenIndex = this.tokenIndex;

    let expr = this.match(TokenType.NEW) ? this.parseNewExpression() : this.parsePrimaryExpression();

    while (this.match(TokenType.PERIOD) || this.match(TokenType.LBRACK)) {
      expr = this.markLocation(
          this.match(TokenType.LBRACK) ?
              new ComputedMemberExpression(expr, this.parseComputedMember()) :
              new StaticMemberExpression(expr, this.parseNonComputedMember()), startTokenIndex);
    }

    return expr;
  }

  parseNonComputedMember() {
    this.expect(TokenType.PERIOD);
    return this.parseNonComputedProperty();
  }

  parseComputedMember() {
    this.expect(TokenType.LBRACK);
    let expr = this.parseExpression();
    this.expect(TokenType.RBRACK);
    return expr;
  }

  parseNewExpression() {
    let startTokenIndex = this.tokenIndex;
    this.expect(TokenType.NEW);
    let callee = this.parseLeftHandSideExpression();
    return this.markLocation(new NewExpression(callee, this.match(TokenType.LPAREN) ? this.parseArgumentList() :
        []), startTokenIndex);
  }

  parsePrimaryExpression() {
    if (this.match(TokenType.LPAREN)) {
      return this.parseGroupExpression();
    }

    let startTokenIndex = this.tokenIndex;

    switch (this.lookahead.type.klass) {
      case TokenClass.Ident:
        return this.markLocation(new IdentifierExpression(this.parseIdentifier()), startTokenIndex);
      case TokenClass.StringLiteral:
        return this.parseStringLiteral();
      case TokenClass.NumericLiteral:
        return this.parseNumericLiteral();
      case TokenClass.Keyword:
      {
        if (this.match(TokenType.THIS)) {
          this.lex();
          return this.markLocation(new ThisExpression(), startTokenIndex);
        }
        if (this.match(TokenType.FUNCTION)) {
          return this.markLocation(this.parseFunction(true), startTokenIndex);
        }
        break;
      }
      case TokenClass.BooleanLiteral:
      {
        let token = this.lex();
        return this.markLocation(new LiteralBooleanExpression(token.type == TokenType.TRUE_LITERAL), startTokenIndex);
      }
      case TokenClass.NullLiteral:
      {
        this.lex();
        return this.markLocation(new LiteralNullExpression(), startTokenIndex);
      }
      default:
        if (this.match(TokenType.LBRACK)) {
          return this.parseArrayExpression();
        } else if (this.match(TokenType.LBRACE)) {
          return this.parseObjectExpression();
        } else if (this.match(TokenType.DIV) || this.match(TokenType.ASSIGN_DIV)) {
          this.skipComment();
          this.lookahead = this.scanRegExp();
          let token = this.lex();
          try {
            let lastSlash = token.value.lastIndexOf('/');
            RegExp(token.value.slice(1, lastSlash), token.value.slice(lastSlash + 1));
          } catch (unused) {
            throw this.createErrorWithToken(token, ErrorMessages.INVALID_REGULAR_EXPRESSION);
          }
          return this.markLocation(new LiteralRegExpExpression(token.value), startTokenIndex);
        }
    }

    throw this.createUnexpected(this.lex());
  }

  parseNumericLiteral() {
    let startTokenIndex = this.tokenIndex;
    if (this.strict && this.lookahead.octal) {
      throw this.createErrorWithToken(this.lookahead, ErrorMessages.STRICT_OCTAL_LITERAL);
    }
    let token2 = this.lex();
    return this.markLocation(new LiteralNumericExpression(token2._value), startTokenIndex);
  }

  parseStringLiteral() {
    let startTokenIndex = this.tokenIndex;
    if (this.strict && this.lookahead.octal) {
      throw this.createErrorWithToken(this.lookahead, ErrorMessages.STRICT_OCTAL_LITERAL);
    }
    let token2 = this.lex();
    return this.markLocation(new LiteralStringExpression(token2._value, token2.slice.text),
        startTokenIndex);
  }

  parseIdentifier() {
    let startTokenIndex = this.tokenIndex;
    return this.markLocation(new Identifier(this.lex().value), startTokenIndex);
  }

  parseArgumentList() {
    this.expect(TokenType.LPAREN);
    let args = this.parseArguments();
    this.expect(TokenType.RPAREN);
    return args;
  }

  parseArguments() {
    let result = [];
    while (true) {
      if (this.match(TokenType.RPAREN) || this.eof()) {
        return result;
      }
      let arg = this.parseAssignmentExpression();
      result.push(arg);
      if (!this.eat(TokenType.COMMA)) {
        break;
      }
    }
    return result;
  }

  // 11.2 Left-Hand-Side Expressions;

  parseNonComputedProperty() {
    let startTokenIndex = this.tokenIndex;

    let token = this.lex();

    if (!(token instanceof IdentifierLikeToken)) {
      throw this.createUnexpected(token);
    } else {
      return this.markLocation(new Identifier(token.value), startTokenIndex);
    }
  }

  parseGroupExpression() {
    this.expect(TokenType.LPAREN);
    let expr = this.parseExpression();
    this.expect(TokenType.RPAREN);
    return expr;
  }


  parseArrayExpression() {
    let startTokenIndex = this.tokenIndex;

    this.expect(TokenType.LBRACK);

    let elements = this.parseArrayExpressionElements();

    this.expect(TokenType.RBRACK);

    return this.markLocation(new ArrayExpression(elements), startTokenIndex);
  }

  parseArrayExpressionElements() {
    let result = [];
    while (true) {
      if (this.match(TokenType.RBRACK)) {
        return result;
      }
      let el;

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
  }

  parseObjectExpression() {
    let startTokenIndex = this.tokenIndex;

    this.expect(TokenType.LBRACE);

    let propertyMap = Object.create(null);
    let properties = this.parseObjectExpressionItems(propertyMap);

    this.expect(TokenType.RBRACE);

    return this.markLocation(new ObjectExpression(properties), startTokenIndex);
  }


  parseObjectExpressionItems(propertyMap) {
    let result = [];
    while (!this.match(TokenType.RBRACE)) {
      result.push(this.parseObjectExpressionItem(propertyMap));
    }
    return result;
  }

  parseObjectExpressionItem(propertyMap) {
    let property = this.parseObjectProperty();
    let type = property.type;
    let key = '$' + property.name.value;
    let value = Object.prototype.hasOwnProperty.call(propertyMap, key) ? propertyMap[key] : 0;

    if (Object.prototype.hasOwnProperty.call(propertyMap, key)) {
      if ((value & INIT_MASK) !== 0) {
        if (this.strict && type === "DataProperty") {
          throw this.createError(ErrorMessages.STRICT_DUPLICATE_PROPERTY);
        } else if (type !== "DataProperty") {
          throw this.createError(ErrorMessages.ACCESSOR_DATA_PROPERTY);
        }
      } else {
        if (type === "DataProperty") {
          throw this.createError(ErrorMessages.ACCESSOR_DATA_PROPERTY);
        } else if ((value & GETTER_MASK) !== 0 && type == "Getter"
            || (value & SETTER_MASK) !== 0 && type == "Setter") {
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
  }

  parseObjectPropertyKey() {
    let token = this.lookahead;

    // Note: This function is called only from parseObjectProperty(), where;
    // Eof and Punctuator tokens are already filtered out.

    if (token instanceof StringLiteralToken) {
      return new PropertyName("string", this.parseStringLiteral().value);
    }
    if (token instanceof NumericLiteralToken) {
      return new PropertyName("number", this.parseNumericLiteral().value);
    }
    if (token instanceof IdentifierLikeToken) {
      return new PropertyName("identifier", this.parseIdentifier().name);
    }

    throw this.createError(ErrorMessages.INVALID_PROPERTY_NAME);
  }

  parseObjectProperty() {
    let token = this.lookahead;
    let startTokenIndex = this.tokenIndex;

    if (token.type === TokenType.IDENTIFIER) {
      let key = this.parseObjectPropertyKey();
      let name = token.value;
      if (name.length === 3) {
        // Property Assignment: Getter and Setter.
        if ("get" === name && !this.match(TokenType.COLON)) {
          key = this.parseObjectPropertyKey();
          this.expect(TokenType.LPAREN);
          this.expect(TokenType.RPAREN);
          let [body, isStrict] = this.parseFunctionBody();
          return this.markLocation(new Getter(key, body), startTokenIndex);
        } else if ("set" === name && !this.match(TokenType.COLON)) {
          key = this.parseObjectPropertyKey();
          this.expect(TokenType.LPAREN);
          token = this.lookahead;
          if (token.type !== TokenType.IDENTIFIER) {
            this.expect(TokenType.RPAREN);
            throw this.createErrorWithToken(token, ErrorMessages.UNEXPECTED_TOKEN, token.type.name);
          } else {
            let param = this.parseVariableIdentifier();
            this.expect(TokenType.RPAREN);
            let [body, isStrict] = this.parseFunctionBody();
            if ((this.strict || isStrict) && isRestrictedWord(param.name)) {
              throw this.createError(ErrorMessages.STRICT_PARAM_NAME);
            }
            return this.markLocation(new Setter(key, param, body), startTokenIndex);
          }
        }
      }

      this.expect(TokenType.COLON);
      let value = this.parseAssignmentExpression();
      return this.markLocation(new DataProperty(key, value), startTokenIndex);
    }
    if (this.eof() || token.type.klass == TokenClass.Punctuator) {
      throw this.createUnexpected(token);
    } else {
      let key = this.parseObjectPropertyKey();
      this.expect(TokenType.COLON);
      let value = this.parseAssignmentExpression();
      return this.markLocation(new DataProperty(key, value), startTokenIndex);
    }
  }

  parseFunction(isExpression) {
    let startTokenIndex = this.tokenIndex;

    this.expect(TokenType.FUNCTION);

    let id = null;
    let message = null;
    let firstRestricted = null;
    if (!isExpression || !this.match(TokenType.LPAREN)) {
      let token = this.lookahead;
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
    let info = this.parseParams(firstRestricted);

    if (info.message != null) {
      message = info.message;
    }

    let previousStrict = this.strict;
    let [body, isStrict] = this.parseFunctionBody();
    if (message != null) {
      if ((this.strict || isStrict) && info.firstRestricted != null) {
        throw this.createErrorWithToken(info.firstRestricted, message);
      }
      if ((this.strict || isStrict) && info.stricted != null) {
        throw this.createErrorWithToken(info.stricted, message);
      }
    }
    this.strict = previousStrict;
    return this.markLocation(new (isExpression ? FunctionExpression : FunctionDeclaration)(id, info.params, body),
        startTokenIndex);
  }


  parseParams(fr) {
    let info = {params: []};
    info.firstRestricted = fr;
    this.expect(TokenType.LPAREN);

    if (!this.match(TokenType.RPAREN)) {
      let paramSet = Object.create(null);

      while (!this.eof()) {
        let token = this.lookahead;
        let param = this.parseVariableIdentifier();
        let key = '$' + param.name;
        if (this.strict) {
          if (token instanceof IdentifierLikeToken && isRestrictedWord(param.name)) {
            info.stricted = token;
            info.message = ErrorMessages.STRICT_PARAM_NAME;
          }
          if (Object.prototype.hasOwnProperty.call(paramSet, key)) {
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
          } else if (Object.prototype.hasOwnProperty.call(paramSet, key)) {
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
  }


}
