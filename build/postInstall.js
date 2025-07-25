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

updateJSDomTypeDefinition();
