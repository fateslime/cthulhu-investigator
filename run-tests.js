/* Optional Node.js runner. The game itself has no Node.js dependency. */
const fs = require('node:fs');
const path = require('node:path');
require('./engine.js');
const rules = require('./tests.js');
const ui = require('./ui-smoke.js')(
  fs.readFileSync(path.join(__dirname, 'engine.js'), 'utf8'),
  fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8'),
  fs.readFileSync(path.join(__dirname, 'story-recaps.js'), 'utf8')
);
for (const r of [...rules, ...ui]) console.log(`${r.pass ? 'PASS' : 'FAIL'} ${r.name}${r.error ? ' — ' + r.error : ''}`);
console.log(`${[...rules, ...ui].filter(r => r.pass).length}/${rules.length + ui.length} passed`);
if ([...rules, ...ui].some(r => !r.pass)) process.exitCode = 1;
