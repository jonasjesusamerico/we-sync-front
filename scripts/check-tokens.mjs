// Fails when a color is written outside src/styles/_tokens.scss (feature 004, ADR-03 rule 7).
// Plain Node, no dependency. Run by `npm run lint`.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');
const TOKENS_FILE = join('src', 'styles', '_tokens.scss');
const EXTENSIONS = ['.scss', '.css', '.ts', '.html'];

const HEX = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])/;
const COLOR_FUNCTION = /\b(?:rgba?|hsla?)\(/i;

// CSS Color 4 named colors, without `transparent` and `currentColor`.
const COLOR_NAMES =
  `aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet
brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan
darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred
darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue
dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green
greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon
lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon
lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta
maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen
mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab
orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum
powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver
skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white
whitesmoke yellow yellowgreen`.split(/\s+/);
const COLOR_NAME = new RegExp(`(?<![\\w-])(?:${COLOR_NAMES.join('|')})(?![\\w-])`, 'i');
const DECLARATION = /([a-zA-Z-]+)\s*:\s*([^;{}]+)/g;

function isIgnored(path) {
  const rel = relative(ROOT, path);
  return (
    rel === TOKENS_FILE || rel.startsWith(join('src', 'testing') + sep) || rel.endsWith('.spec.ts')
  );
}

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      walk(path, files);
    } else if (EXTENSIONS.some((ext) => name.endsWith(ext)) && !isIgnored(path)) {
      files.push(path);
    }
  }
  return files;
}

function stripVars(value) {
  let previous;
  let current = value;
  do {
    previous = current;
    current = current.replace(/var\([^()]*\)/g, ' ');
  } while (current !== previous);
  return current.replace(/--[\w-]+/g, ' ');
}

function stripComments(line, isStyle) {
  let result = line.replace(/\/\*.*?\*\//g, ' ');
  if (isStyle) {
    result = result.replace(/(^|[^:])\/\/.*$/, '$1');
  }
  return result;
}

const problems = [];
const files = walk(SRC);

for (const file of files) {
  const isStyle = file.endsWith('.scss') || file.endsWith('.css');
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((raw, index) => {
    const line = stripComments(raw, isStyle);
    const where = `${relative(ROOT, file)}:${index + 1}: ${raw.trim()}`;
    if (HEX.test(line) || COLOR_FUNCTION.test(line)) {
      problems.push(where);
      return;
    }
    if (!isStyle) {
      return;
    }
    for (const match of line.matchAll(DECLARATION)) {
      if (COLOR_NAME.test(stripVars(match[2]))) {
        problems.push(where);
        return;
      }
    }
  });
}

if (problems.length > 0) {
  console.error('check-tokens: colors outside src/styles/_tokens.scss (use var(--ws-*)):');
  for (const problem of problems) {
    console.error(`  ${problem}`);
  }
  process.exit(1);
}

console.log(`check-tokens: ok (${files.length} arquivos)`);
