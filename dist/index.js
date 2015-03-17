"use strict";

exports.parseModule = parseModule;
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

function markLocation(node, location) {
  node.loc = {
    start: location,
    end: {
      line: this.lastLine + 1,
      column: this.lastIndex - this.lastLineStart,
      offset: this.lastIndex },
    source: null
  };
  return node;
}

function parseModule(code) {
  var _ref = arguments[1] === undefined ? {} : arguments[1];

  var _ref$loc = _ref.loc;
  var loc = _ref$loc === undefined ? false : _ref$loc;

  var parser = new Parser(code);
  if (loc) {
    parser.markLocation = markLocation;
  }
  return parser.parseModule();
}

function parseScript(code) {
  var _ref = arguments[1] === undefined ? {} : arguments[1];

  var _ref$loc = _ref.loc;
  var loc = _ref$loc === undefined ? false : _ref$loc;

  var parser = new Parser(code);
  if (loc) {
    parser.markLocation = markLocation;
  }
  return parser.parseScript();
}

exports["default"] = parseScript;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztRQStCZ0IsV0FBVyxHQUFYLFdBQVc7UUFRWCxXQUFXLEdBQVgsV0FBVzs7Ozs7Ozs7Ozs7Ozs7Ozs7SUF2Qm5CLE1BQU0sV0FBTyxVQUFVLEVBQXZCLE1BQU07O0FBRWQsU0FBUyxZQUFZLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRTtBQUNwQyxNQUFJLENBQUMsR0FBRyxHQUFHO0FBQ1QsU0FBSyxFQUFFLFFBQVE7QUFDZixPQUFHLEVBQUU7QUFDSCxVQUFJLEVBQUUsSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDO0FBQ3ZCLFlBQU0sRUFBRSxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxhQUFhO0FBQzNDLFlBQU0sRUFBRSxJQUFJLENBQUMsU0FBUyxFQUN2QjtBQUNELFVBQU0sRUFBRSxJQUFJO0dBQ2IsQ0FBQztBQUNGLFNBQU8sSUFBSSxDQUFDO0NBQ2I7O0FBRU0sU0FBUyxXQUFXLENBQUMsSUFBSSxFQUFzQjswQ0FBSixFQUFFOztzQkFBakIsR0FBRztNQUFILEdBQUcsNEJBQUcsS0FBSzs7QUFDNUMsTUFBSSxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDOUIsTUFBSSxHQUFHLEVBQUU7QUFDUCxVQUFNLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQztHQUNwQztBQUNELFNBQU8sTUFBTSxDQUFDLFdBQVcsRUFBRSxDQUFDO0NBQzdCOztBQUVNLFNBQVMsV0FBVyxDQUFDLElBQUksRUFBc0I7MENBQUosRUFBRTs7c0JBQWpCLEdBQUc7TUFBSCxHQUFHLDRCQUFHLEtBQUs7O0FBQzVDLE1BQUksTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzlCLE1BQUksR0FBRyxFQUFFO0FBQ1AsVUFBTSxDQUFDLFlBQVksR0FBRyxZQUFZLENBQUM7R0FDcEM7QUFDRCxTQUFPLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQztDQUM3Qjs7cUJBRWMsV0FBVyIsImZpbGUiOiJzcmMvaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAyMDE0IFNoYXBlIFNlY3VyaXR5LCBJbmMuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKVxuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKi9cblxuaW1wb3J0IHtQYXJzZXJ9IGZyb20gXCIuL3BhcnNlclwiO1xuXG5mdW5jdGlvbiBtYXJrTG9jYXRpb24obm9kZSwgbG9jYXRpb24pIHtcbiAgbm9kZS5sb2MgPSB7XG4gICAgc3RhcnQ6IGxvY2F0aW9uLFxuICAgIGVuZDoge1xuICAgICAgbGluZTogdGhpcy5sYXN0TGluZSArIDEsXG4gICAgICBjb2x1bW46IHRoaXMubGFzdEluZGV4IC0gdGhpcy5sYXN0TGluZVN0YXJ0LFxuICAgICAgb2Zmc2V0OiB0aGlzLmxhc3RJbmRleCxcbiAgICB9LFxuICAgIHNvdXJjZTogbnVsbFxuICB9O1xuICByZXR1cm4gbm9kZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlTW9kdWxlKGNvZGUsIHtsb2MgPSBmYWxzZX0gPSB7fSkge1xuICBsZXQgcGFyc2VyID0gbmV3IFBhcnNlcihjb2RlKTtcbiAgaWYgKGxvYykge1xuICAgIHBhcnNlci5tYXJrTG9jYXRpb24gPSBtYXJrTG9jYXRpb247XG4gIH1cbiAgcmV0dXJuIHBhcnNlci5wYXJzZU1vZHVsZSgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VTY3JpcHQoY29kZSwge2xvYyA9IGZhbHNlfSA9IHt9KSB7XG4gIGxldCBwYXJzZXIgPSBuZXcgUGFyc2VyKGNvZGUpO1xuICBpZiAobG9jKSB7XG4gICAgcGFyc2VyLm1hcmtMb2NhdGlvbiA9IG1hcmtMb2NhdGlvbjtcbiAgfVxuICByZXR1cm4gcGFyc2VyLnBhcnNlU2NyaXB0KCk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IHBhcnNlU2NyaXB0O1xuIl19