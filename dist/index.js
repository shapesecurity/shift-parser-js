"use strict";

exports.parseScript = parseScript;
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

var Parser = require("./parser").Parser;
var Shift = require("shift-ast");

function parseScript(code) {
  var _ref = arguments[1] === undefined ? {} : arguments[1];
  var _ref$loc = _ref.loc;
  var loc = _ref$loc === undefined ? false : _ref$loc;
  var parser = new Parser(code);
  if (loc) {
    parser.markLocation = function (node, location) {
      node.loc = new Shift.SourceSpan(location, new Shift.SourceLocation(this.lastIndex, this.lastLine + 1, this.lastIndex - this.lastLineStart));
      return node;
    };
  }
  return parser.parseScript();
}

exports["default"] = parseScript;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztRQW9CZ0IsV0FBVyxHQUFYLFdBQVc7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBSm5CLE1BQU0sV0FBTyxVQUFVLEVBQXZCLE1BQU07SUFFRixLQUFLLFdBQU0sV0FBVzs7QUFFM0IsU0FBUyxXQUFXLENBQUMsSUFBSSxFQUFzQjswQ0FBSixFQUFFO3NCQUFqQixHQUFHO01BQUgsR0FBRyw0QkFBRyxLQUFLO0FBQzVDLE1BQUksTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzlCLE1BQUksR0FBRyxFQUFFO0FBQ1AsVUFBTSxDQUFDLFlBQVksR0FBRyxVQUFVLElBQUksRUFBRSxRQUFRLEVBQUU7QUFDOUMsVUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLEtBQUssQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLElBQUksS0FBSyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxRQUFRLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7QUFDNUksYUFBTyxJQUFJLENBQUM7S0FDYixDQUFDO0dBQ0g7QUFDRCxTQUFPLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQztDQUM3Qjs7cUJBRWMsV0FBVyIsImZpbGUiOiJzcmMvaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAyMDE0IFNoYXBlIFNlY3VyaXR5LCBJbmMuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKVxuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IHtQYXJzZXJ9IGZyb20gXCIuL3BhcnNlclwiO1xuXG5pbXBvcnQgKiBhcyBTaGlmdCBmcm9tIFwic2hpZnQtYXN0XCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVNjcmlwdChjb2RlLCB7bG9jID0gZmFsc2V9ID0ge30pIHtcbiAgbGV0IHBhcnNlciA9IG5ldyBQYXJzZXIoY29kZSk7XG4gIGlmIChsb2MpIHtcbiAgICBwYXJzZXIubWFya0xvY2F0aW9uID0gZnVuY3Rpb24gKG5vZGUsIGxvY2F0aW9uKSB7XG4gICAgICBub2RlLmxvYyA9IG5ldyBTaGlmdC5Tb3VyY2VTcGFuKGxvY2F0aW9uLCBuZXcgU2hpZnQuU291cmNlTG9jYXRpb24odGhpcy5sYXN0SW5kZXgsIHRoaXMubGFzdExpbmUgKyAxLCB0aGlzLmxhc3RJbmRleCAtIHRoaXMubGFzdExpbmVTdGFydCkpO1xuICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfTtcbiAgfVxuICByZXR1cm4gcGFyc2VyLnBhcnNlU2NyaXB0KCk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IHBhcnNlU2NyaXB0O1xuIl19