/**
 * Extracts objects passed to JSON.parse() from JavaScript source code.
 *
 * Supported:
 *   JSON.parse('...')
 *   JSON.parse("...")
 *   JSON.parse(`...`)
 *
 * The parser intentionally does not execute the JavaScript.
 * It only extracts the string literal and then parses the JSON.
 */

function isWhitespace(char) {
  return /\s/.test(char);
}

function skipWhitespace(source, index) {
  while (index < source.length && isWhitespace(source[index])) {
    index++;
  }

  return index;
}

function findMatchingParenthesis(source, openIndex) {
  let depth = 1;
  let quote = null;
  let escaped = false;

  for (let i = openIndex + 1; i < source.length; i++) {
    const char = source[i];

    if (quote !== null) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (char === quote) {
        quote = null;
      }

      continue;
    }

    if (char === "'" || char === '"' || char === "`") {
      quote = char;
      continue;
    }

    if (char === "(") {
      depth++;
      continue;
    }

    if (char === ")") {
      depth--;

      if (depth === 0) {
        return i;
      }
    }
  }

  return -1;
}

/**
 * Reads a JavaScript string literal.
 *
 * Returns the decoded JavaScript string.
 *
 * Important:
 * We cannot simply use JSON.parse() here because the source
 * strings can use single quotes and JavaScript escaping.
 */
function readJavaScriptString(source, startIndex) {
  const quote = source[startIndex];

  if (quote !== "'" && quote !== '"' && quote !== "`") {
    throw new Error("Expected a JavaScript string literal");
  }

  let value = "";
  let escaped = false;

  for (let i = startIndex + 1; i < source.length; i++) {
    const char = source[i];

    if (escaped) {
      switch (char) {
        case "n":
          value += "\n";
          break;

        case "r":
          value += "\r";
          break;

        case "t":
          value += "\t";
          break;

        case "b":
          value += "\b";
          break;

        case "f":
          value += "\f";
          break;

        case "v":
          value += "\v";
          break;

        case "0":
          value += "\0";
          break;

        case "\\":
          value += "\\";
          break;

        case "'":
          value += "'";
          break;

        case '"':
          value += '"';
          break;

        case "`":
          value += "`";
          break;

        case "\n":
          // JavaScript line continuation.
          break;

        case "\r":
          if (source[i + 1] === "\n") {
            i++;
          }
          break;

        case "x": {
          const hex = source.slice(i + 1, i + 3);

          if (/^[0-9a-fA-F]{2}$/.test(hex)) {
            value += String.fromCharCode(parseInt(hex, 16));
            i += 2;
          } else {
            value += "x";
          }

          break;
        }

        case "u": {
          // \uXXXX
          if (source[i + 1] === "{") {
            const end = source.indexOf("}", i + 2);

            if (end !== -1) {
              const codePoint = source.slice(i + 2, end);

              if (/^[0-9a-fA-F]+$/.test(codePoint)) {
                value += String.fromCodePoint(parseInt(codePoint, 16));
                i = end;
                break;
              }
            }
          }

          const unicode = source.slice(i + 1, i + 5);

          if (/^[0-9a-fA-F]{4}$/.test(unicode)) {
            value += String.fromCharCode(parseInt(unicode, 16));
            i += 4;
          } else {
            value += "u";
          }

          break;
        }

        default:
          // JavaScript allows escaped characters such as
          // \c, \q, etc. In those cases the character itself
          // is the resulting value.
          value += char;
          break;
      }

      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === quote) {
      return {
        value,
        endIndex: i,
      };
    }

    value += char;
  }

  throw new Error("Unterminated JavaScript string");
}

/**
 * Extract every JSON.parse(<string literal>) occurrence.
 */
function extractJSONParses(source) {
  const results = [];

  const pattern = /JSON\.parse\s*\(/g;

  let match;

  while ((match = pattern.exec(source)) !== null) {
    const parseStart = match.index;
    const openParenthesis = source.indexOf(
      "(",
      parseStart + "JSON.parse".length,
    );

    if (openParenthesis === -1) {
      continue;
    }

    let argumentStart = skipWhitespace(source, openParenthesis + 1);

    if (argumentStart >= source.length) {
      continue;
    }

    const quote = source[argumentStart];

    // We currently only extract literal strings.
    // This avoids executing arbitrary JavaScript.
    if (quote !== "'" && quote !== '"' && quote !== "`") {
      continue;
    }

    try {
      const parsedString = readJavaScriptString(source, argumentStart);

      let afterString = skipWhitespace(source, parsedString.endIndex + 1);

      if (source[afterString] !== ")") {
        // The argument is not a simple JSON.parse("...").
        continue;
      }

      const jsonText = parsedString.value;

      let data;

      try {
        data = JSON.parse(jsonText);
      } catch (error) {
        results.push({
          index: results.length,
          sourceIndex: parseStart,
          valid: false,
          error: error.message,
          preview: jsonText.slice(0, 500),
        });

        continue;
      }

      results.push({
        index: results.length,
        sourceIndex: parseStart,
        valid: true,
        type: getValueType(data),
        data,
      });
    } catch (error) {
      results.push({
        index: results.length,
        sourceIndex: parseStart,
        valid: false,
        error: error.message,
      });
    }
  }

  return results;
}

function getValueType(value) {
  if (Array.isArray(value)) {
    return "array";
  }

  if (value === null) {
    return "null";
  }

  return typeof value;
}

/**
 * Produces a compact description of a parsed dataset.
 * Useful for inspecting huge datasets without returning them.
 */
function describeValue(value, options = {}) {
  const maxKeys = options.maxKeys ?? 100;
  const maxArraySample = options.maxArraySample ?? 3;

  if (Array.isArray(value)) {
    return {
      type: "array",
      length: value.length,
      sample: value
        .slice(0, maxArraySample)
        .map((item) => describeValue(item, options)),
    };
  }

  if (value === null) {
    return {
      type: "null",
    };
  }

  if (typeof value !== "object") {
    return {
      type: typeof value,
      value,
    };
  }

  const keys = Object.keys(value);

  const description = {
    type: "object",
    keyCount: keys.length,
    keys: keys.slice(0, maxKeys),
  };

  for (const key of keys.slice(0, maxKeys)) {
    const child = value[key];

    if (Array.isArray(child)) {
      description[key] = {
        type: "array",
        length: child.length,
        sample: child.slice(0, maxArraySample),
      };
    } else if (child && typeof child === "object") {
      description[key] = {
        type: "object",
        keyCount: Object.keys(child).length,
        keys: Object.keys(child).slice(0, maxKeys),
      };
    } else {
      description[key] = {
        type: typeof child,
        value: child,
      };
    }
  }

  return description;
}

module.exports = {
  extractJSONParses,
  describeValue,
};
