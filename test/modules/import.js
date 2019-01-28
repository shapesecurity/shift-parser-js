/**
 * Copyright 2015 Shape Security, Inc.
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

let testParseFailure = require('../assertions').testParseFailure;
let testParseModule = require('../assertions').testParseModule;
let testParseModuleFailure = require('../assertions').testParseModuleFailure;
let moduleItem = require('../helpers').moduleItem;
let ErrorMessages = require('../../dist/errors').ErrorMessages;

function testImportDecl(code, tree) {
  testParseModule(code, moduleItem, tree);
}

suite('Parser', () => {
  suite('import declaration', () => {

    testImportDecl('import \'a\'', { type: 'Import', defaultBinding: null, namedImports: [], moduleSpecifier: 'a' });

    testImportDecl(
      'import * as a from \'a\'',
      {
        type: 'ImportNamespace',
        defaultBinding: null,
        namespaceBinding: { type: 'BindingIdentifier', name: 'a' },
        moduleSpecifier: 'a',
      });

    testImportDecl(
      'import a from \'c\'',
      {
        type: 'Import',
        defaultBinding: { type: 'BindingIdentifier', name: 'a' },
        namedImports: [],
        moduleSpecifier: 'c',
      });

    testImportDecl(
      'import a, {} from \'c\'',
      {
        type: 'Import',
        defaultBinding: { type: 'BindingIdentifier', name: 'a' },
        namedImports: [],
        moduleSpecifier: 'c',
      });

    testImportDecl(
      'import {} from \'a\'',
      { type: 'Import', defaultBinding: null, namedImports: [], moduleSpecifier: 'a' });

    testImportDecl(
      'import a, * as b from \'a\'',
      {
        type: 'ImportNamespace',
        defaultBinding: { type: 'BindingIdentifier', name: 'a' },
        namespaceBinding: { type: 'BindingIdentifier', name: 'b' },
        moduleSpecifier: 'a',
      });

    testImportDecl(
      'import a, {b} from \'c\'',
      {
        type: 'Import',
        defaultBinding: { type: 'BindingIdentifier', name: 'a' },
        namedImports: [{ type: 'ImportSpecifier', name: null, binding: { type: 'BindingIdentifier', name: 'b' } }],
        moduleSpecifier: 'c',
      });

    testImportDecl(
      'import a, {b as c} from \'c\'',
      {
        type: 'Import',
        defaultBinding: { type: 'BindingIdentifier', name: 'a' },
        namedImports: [{ type: 'ImportSpecifier', name: 'b', binding: { type: 'BindingIdentifier', name: 'c' } }],
        moduleSpecifier: 'c',
      });

    testImportDecl(
      'import a, {function as c} from \'c\'',
      {
        type: 'Import',
        defaultBinding: { type: 'BindingIdentifier', name: 'a' },
        namedImports: [{
          type: 'ImportSpecifier',
          name: 'function',
          binding: { type: 'BindingIdentifier', name: 'c' },
        }],
        moduleSpecifier: 'c',
      });

    testImportDecl(
      'import a, {as} from \'c\'',
      {
        type: 'Import',
        defaultBinding: { type: 'BindingIdentifier', name: 'a' },
        namedImports: [{ type: 'ImportSpecifier', name: null, binding: { type: 'BindingIdentifier', name: 'as' } }],
        moduleSpecifier: 'c',
      });

    testImportDecl(
      'import a, {as as c} from \'c\'',
      {
        type: 'Import',
        defaultBinding: { type: 'BindingIdentifier', name: 'a' },
        namedImports: [{ type: 'ImportSpecifier', name: 'as', binding: { type: 'BindingIdentifier', name: 'c' } }],
        moduleSpecifier: 'c',
      });

    testImportDecl(
      'import {as as as} from \'as\'',
      {
        type: 'Import',
        defaultBinding: null,
        namedImports: [{ type: 'ImportSpecifier', name: 'as', binding: { type: 'BindingIdentifier', name: 'as' } }],
        moduleSpecifier: 'as',
      });

    testImportDecl(
      'import a, {b,} from \'c\'',
      {
        type: 'Import',
        defaultBinding: { type: 'BindingIdentifier', name: 'a' },
        namedImports: [{ type: 'ImportSpecifier', name: null, binding: { type: 'BindingIdentifier', name: 'b' } }],
        moduleSpecifier: 'c',
      });

    testImportDecl(
      'import a, {b,c} from \'d\'',
      {
        type: 'Import',
        defaultBinding: { type: 'BindingIdentifier', name: 'a' },
        namedImports: [{
          type: 'ImportSpecifier',
          name: null,
          binding: { type: 'BindingIdentifier', name: 'b' },
        }, { type: 'ImportSpecifier', name: null, binding: { type: 'BindingIdentifier', name: 'c' } }],
        moduleSpecifier: 'd',
      });

    testImportDecl(
      'import a, {b,c,} from \'d\'',
      {
        type: 'Import',
        defaultBinding: { type: 'BindingIdentifier', name: 'a' },
        namedImports: [{
          type: 'ImportSpecifier',
          name: null,
          binding: { type: 'BindingIdentifier', name: 'b' },
        }, { type: 'ImportSpecifier', name: null, binding: { type: 'BindingIdentifier', name: 'c' } }],
        moduleSpecifier: 'd',
      });

    testParseFailure('import \'a\'', ErrorMessages.UNEXPECTED_TOKEN, 'import');
    testParseModuleFailure('{import a from \'b\';}', ErrorMessages.UNEXPECTED_TOKEN, 'import');
    testParseModuleFailure('import', ErrorMessages.UNEXPECTED_EOS);
    testParseModuleFailure('import;', ErrorMessages.UNEXPECTED_TOKEN, ';');
    testParseModuleFailure('import {}', ErrorMessages.UNEXPECTED_EOS);
    testParseModuleFailure('import {};', ErrorMessages.UNEXPECTED_TOKEN, ';');
    testParseModuleFailure('import {} from;', ErrorMessages.UNEXPECTED_TOKEN, ';');
    testParseModuleFailure('import {,} from \'a\';', ErrorMessages.UNEXPECTED_TOKEN, ',');
    testParseModuleFailure('import {b,,} from \'a\';', ErrorMessages.UNEXPECTED_TOKEN, ',');
    testParseModuleFailure('import {b as,} from \'a\';', ErrorMessages.UNEXPECTED_TOKEN, ',');
    testParseModuleFailure('import {function} from \'a\';', ErrorMessages.UNEXPECTED_TOKEN, '}');
    testParseModuleFailure('import {a as function} from \'a\';', ErrorMessages.UNEXPECTED_TOKEN, 'function');
    testParseModuleFailure('import {b,,c} from \'a\';', ErrorMessages.UNEXPECTED_TOKEN, ',');
    testParseModuleFailure('import {b,c,,} from \'a\';', ErrorMessages.UNEXPECTED_TOKEN, ',');
    testParseModuleFailure('import * As a from \'a\'', ErrorMessages.UNEXPECTED_IDENTIFIER);
    testParseModuleFailure('import / as a from \'a\'', ErrorMessages.UNEXPECTED_TOKEN, '/');
    testParseModuleFailure('import * as b, a from \'a\'', ErrorMessages.UNEXPECTED_TOKEN, ',');
    testParseModuleFailure('import a as b from \'a\'', ErrorMessages.UNEXPECTED_IDENTIFIER);
    testParseModuleFailure('import a, b from \'a\'', ErrorMessages.UNEXPECTED_IDENTIFIER);

  });
});
