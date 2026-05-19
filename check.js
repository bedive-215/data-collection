const fs = require('fs');
const content = fs.readFileSync('D:\\data-collection\\frontend\\src\\pages\\user\\SurveyStudio.jsx');
const lines = content.split('\n');
const line = lines[333];

// Find borderRadius:10 in the line
const idx = line.indexOf('borderRadius:10');
console.log('Found borderRadius:10 at index:', idx);
// Show exact bytes around the 10
console.log('Chars around borderRadius:10:');
for (let i = idx; i < idx + 20; i++) {
  console.log(`  [${i}] U+${line.charCodeAt(i).toString(16).padStart(4,'0')} = '${line[i]}'`);
}

// Also check line 336 for same pattern
const line2 = lines[335];
const idx2 = line2.indexOf('borderRadius:6');
console.log('\nLine 336 borderRadius:6 at index:', idx2);
for (let i = idx2; i < idx2 + 20; i++) {
  console.log(`  [${i}] U+${line2.charCodeAt(i).toString(16).padStart(4,'0')} = '${line2[i]}'`);
}
