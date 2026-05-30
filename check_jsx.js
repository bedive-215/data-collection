const fs = require('fs');
const content = fs.readFileSync('d:/data-collection/mobile/MobileApp/src/layouts/Surveyslayout.jsx', 'utf8');
const lines = content.split('\n');

// Remove strings, comments, template literals
function cleanLine(line) {
  let result = '';
  let inString = false;
  let stringChar = '';
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (!inString && (ch === '"' || ch === "'" || (ch === '`' && i+1 < line.length && line[i+1] !== '$'))) {
      inString = true;
      stringChar = ch;
      result += ' ';
    } else if (inString && ch === stringChar && line[i-1] !== '\\') {
      inString = false;
      result += ' ';
    } else if (inString) {
      result += ' ';
    } else {
      result += ch;
    }
  }
  // Remove single-line comments
  result = result.replace(/\/\/[^\n]*/g, '');
  return result;
}

const stack = [];
const map = {}; // line -> expected tag

let inMultiLine = false;

for (let i = 0; i < lines.length; i++) {
  const rawLine = lines[i];
  const line = cleanLine(rawLine);

  // Check for self-closing fragment
  if (/^\s*<>\s*<\/>/.test(line)) {
    // fine - self-closing fragment
    continue;
  }

  // Remove template literals ${}
  const snippet = line.replace(/\$\{[^}]*\}/g, '');

  // Find all opening tags
  const openRe = /<([A-Z][a-zA-Z]*)(?:\s|>)/g;
  let m;
  while ((m = openRe.exec(snippet)) !== null) {
    const tag = m[1];
    // Skip common non-component tags
    if (tag === 'View' || tag === 'Text' || tag === 'TouchableOpacity' ||
        tag === 'ScrollView' || tag === 'Modal' || tag === 'TextInput' ||
        tag === 'ActivityIndicator' || tag === 'Alert' || tag === 'Image' ||
        tag === 'Animated' || tag === 'Pressable' || tag === 'KeyboardAvoidingView' ||
        tag === 'FlatList' || tag === 'SectionList' || tag === 'Switch') {
      stack.push({ tag, line: i + 1 });
    }
  }

  // Find self-closing tags
  const selfRe = /<([A-Z][a-zA-Z]*)\s[^>]*\/>/g;
  while ((m = selfRe.exec(snippet)) !== null) {
    const tag = m[1];
    stack.push({ tag, line: i + 1, selfClose: true });
  }
  const selfSimpleRe = /<([A-Z][a-zA-Z]*)\/>/g;
  while ((m = selfSimpleRe.exec(snippet)) !== null) {
    const tag = m[1];
    if (!stack.length || stack[stack.length-1].tag !== tag) {
      console.log(`LINE ${i+1}: Self-close <${tag}/> but stack top is ${stack.length ? stack[stack.length-1].tag : 'EMPTY'}`);
    }
  }

  // Find closing tags
  const closeRe = /<\/([A-Z][a-zA-Z]*)>/g;
  while ((m = closeRe.exec(snippet)) !== null) {
    const tag = m[1];
    if (stack.length === 0) {
      console.log(`LINE ${i+1}: Closing </${tag}> but stack is empty`);
    } else if (stack[stack.length-1].tag === tag) {
      stack.pop();
    } else {
      // Try to find it in stack
      const idx = stack.findLastIndex ? stack.findLastIndex(s => s.tag === tag) : [...stack].reverse().findIndex(s => s.tag === tag);
      if (idx >= 0) {
        console.log(`LINE ${i+1}: Mismatch - opened <${stack[idx].tag}> at line ${stack[idx].line}, closing </${tag}>`);
        // Pop everything above
        for (let j = 0; j <= idx; j++) stack.pop();
      } else {
        console.log(`LINE ${i+1}: Closing </${tag}> but expected ${stack[stack.length-1].tag} (from line ${stack[stack.length-1].line})`);
      }
    }
  }
}

if (stack.length > 0) {
  console.log('Unclosed tags:');
  stack.forEach(s => console.log(`  <${s.tag}> opened at line ${s.line}`));
} else {
  console.log('All tags balanced!');
}
