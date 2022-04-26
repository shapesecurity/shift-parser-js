/**
 * Copyright 2017 Shape Security, Inc.
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

let expect = require('expect.js');
let SHIFT_SPEC = require('shift-spec');
let reduce = require('shift-reducer').default;

function stmt(program) {
  return program.statements[0];
}

function expr(program) {
  return stmt(program).expression;
}

function schemaCheckUnion(node, spec) {
  if (spec.typeName === 'Union') {
    return spec.arguments.some(argument => {
      return schemaCheckUnion(node, argument);
    });
  } else if (spec.typeName === node.type) {
    schemaCheck(node, spec);
    return true;
  }
  return false;
}

let fieldDatabase = Object.create(null);
for (let type in SHIFT_SPEC) {
  if ({}.hasOwnProperty.call(SHIFT_SPEC, type)) {
    fieldDatabase[type] = {};
    SHIFT_SPEC[type].fields.forEach(field => {
      fieldDatabase[type][field] = true;
    });
  }
}

function schemaCheck(node, spec) {
  switch (spec.typeName) {
    case 'List':
      if (!Array.isArray(node)) {
        expect().fail('node must be an array, but it is: ' + JSON.stringify(node, null, 2));
      }
      node.forEach(n => {
        schemaCheck(n, spec.argument);
      });
      return;
    case 'Union':
      if (!schemaCheckUnion(node, spec)) {
        expect().fail('node cannot exist in this position.');
      }
      return;
    case 'Maybe':
      if (node) {
        schemaCheck(node, spec.argument);
      }
      return;
    case 'Enum':
      if (typeof node !== 'string') {
        expect().fail('enum must be of string type.');
      }
      if (spec.values.indexOf(node) < 0) {
        expect().fail('illegal enum value \'' + node + '\'. accepted values: [' + spec.values + ']');
      }
      return;
    case 'Boolean':
      if (typeof node !== 'boolean') {
        expect(typeof node).eql('boolean');
      }
      return;
    case 'Number':
      if (typeof node !== 'number') {
        expect(typeof node).eql('number');
      }
      return;
    case 'String':
      if (typeof node !== 'string') {
        expect(typeof node).eql('string');
      }
      return;
  }

  spec.fields.forEach(field => {
    if (field.name === 'type') {
      if (node.type !== field.value) {
        expect(node.type).eql(field.value);
      }
    } else {
      if (!node.hasOwnProperty(field.name)) {
        // *default* BindingIdentifier nodes don't have a representation in the program text
        if (!(node.type === 'BindingIdentifier' && node.name === '*default*' && field.name === 'loc')) {
          expect(node).to.have.key(field.name);
        }
      }
      schemaCheck(node[field.name], field.type);
    }
  });
}

function moduleItem(mod) {
  return mod.items[0];
}

function checkSanity(range, child) {
  if (Array.isArray(child)) {
    let lower = range.min;
    for (let item of child) {
      if (item === null) continue;
      if (item.min < lower) {
        throw new Error('list-lower out of order');
      }
      lower = item.max;
    }
    if (lower > range.max) {
      throw new Error('list-upper out of order');
    }
  } else if (child !== null) {
    if (child.min < range.min || child.max > range.max) {
      throw new Error('child exceeds parent');
    }
  }
}

function locationSanityCheck(tree, locations) {
  let rangeChecker = {};

  for (let typeName of Object.keys(SHIFT_SPEC)) {
    rangeChecker[`reduce${typeName}`] = function (node, children) {
      if (!locations.has(node)) {
        if (node.type === 'BindingIdentifier' && node.name === '*default*') {
          // the artificial BindingIdentifier for export default unnamed function/class has no location information.
          return null;
        }
        throw new Error(`${node.type} missing location information`);
      }
      let loc = locations.get(node);

      let ret = { min: loc.start.offset, max: loc.end.offset };
      if (ret.min >= ret.max) {
        if ( // These are the only legitimately empty nodes.
          ret.min === ret.max && (
            node.type === 'Script' && node.directives.length === 0 && node.statements.length === 0
            || node.type === 'Module' && node.items.length === 0 && ret.min === 0 && ret.max === 0
            || node.type === 'FunctionBody' && node.directives.length === 0 && node.statements.length === 0
            || node.type === 'FormalParameters' && node.items.length === 0 && node.rest === null
            || node.type === 'TemplateElement' && node.rawValue === ''
          )
        ) {
          return null;
        }
        throw new Error('min >= max');
      }
      if (children) {
        for (let childName of Object.keys(children)) {
          checkSanity(ret, children[childName]);
        }
      }
      return ret;
    };
  }

  reduce(rangeChecker, tree);
}


exports.moduleItem = moduleItem;
exports.expr = expr;
exports.stmt = stmt;
exports.locationSanityCheck = locationSanityCheck;
exports.schemaCheck = schemaCheck;
