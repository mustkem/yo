const { EOL } = require('os');
const path = require('path');
const fs = require('fs');

/**
 * Fix compilation issues in jsdom files.
 */
function updateJSDomTypeDefinition() {
  if (process.env.NODE_ENV === 'production') {
    console.log('Skipping postinstall in production');
    process.exit(0);
  }
  var relativePath = path.join('node_modules', '@types', 'jsdom', 'base.d.ts');
  var filePath = relativePath;
  if (!fs.existsSync(filePath)) {
    console.warn(
      "JSdom base.d.ts not found '" +
        filePath +
        "' (Jupyter Extension post install script)",
    );
    return;
  }
  var fileContents = fs.readFileSync(filePath, { encoding: 'utf8' });
  var replacedContents = fileContents.replace(
    /\s*globalThis: DOMWindow;\s*readonly \["Infinity"]: number;\s*readonly \["NaN"]: number;/g,
    [
      'globalThis: DOMWindow;',
      '// @ts-ignore',
      'readonly ["Infinity"]: number;',
      '// @ts-ignore',
      'readonly ["NaN"]: number;',
    ].join(`${EOL}        `),
  );
  if (replacedContents === fileContents) {
    console.warn('JSdom base.d.ts not updated');
    return;
  }
  fs.writeFileSync(filePath, replacedContents);
}

function patchCliTableStringWidth() {
  const filePath = path.join('node_modules', 'cli-table3', 'src', 'utils.js');
  if (!fs.existsSync(filePath)) {
    return;
  }

  const originalSnippet =
    "const stringWidth = require('string-width');" +
    EOL +
    "// import stringWidth from 'string-width';" +
    EOL;

  const fileContents = fs.readFileSync(filePath, { encoding: 'utf8' });
  if (!fileContents.includes(originalSnippet)) {
    return;
  }

  const replacement = [
    'let stringWidth;',
    'try {',
    "  stringWidth = require('string-width');",
    "  if (typeof stringWidth !== 'function') {",
    '    stringWidth = stringWidth.default || stringWidth.stringWidth;',
    '  }',
    '} catch (error) {',
    '  if (!error || error.code !== "ERR_REQUIRE_ESM") {',
    '    throw error;',
    '  }',
    '}',
    '',
    'if (typeof stringWidth !== "function") {',
    "  stringWidth = require('string-width-cjs');",
    '}',
    '',
    'if (typeof stringWidth !== "function") {',
    "  throw new TypeError('Unable to resolve string-width implementation');",
    '}',
    '',
  ].join(EOL);

  const patchedContents = fileContents.replace(originalSnippet, replacement);
  if (patchedContents === fileContents) {
    console.warn('cli-table3 utils.js not updated');
    return;
  }

  fs.writeFileSync(filePath, patchedContents);
}

updateJSDomTypeDefinition();
patchCliTableStringWidth();
