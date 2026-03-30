const fs = require('fs');
const path = require('path');

const dirs = [
  path.join(__dirname, 'components'),
  path.join(__dirname, 'pages'),
  path.join(__dirname, 'context'),
  path.join(__dirname, 'src')
];
const rootFiles = [path.join(__dirname, 'App.tsx'), path.join(__dirname, 'tailwind.config.js')];

const colorMap = {
  '#0A0A0F': '#F8FAFC',
  '#0a0a0f': '#F8FAFC',
  '#14141C': '#F1F5F9',
  '#14141c': '#F1F5F9',
  '#1C1C28': '#FFFFFF',
  '#1c1c28': '#FFFFFF',
  '#1A1A24': '#F1F5F9',
  '#1a1a24': '#F1F5F9',
  '#E8EDF2': '#1E293B',
  '#e8edf2': '#1E293B'
};

function processFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.js') && !filePath.endsWith('.ts') && !filePath.endsWith('.css')) return;
  console.log('Processing', filePath);
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  for (const [dark, light] of Object.entries(colorMap)) {
    content = content.split(dark).join(light);
  }
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', filePath);
  }
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else {
      processFile(fullPath);
    }
  }
}

for (const dir of dirs) {
  walkDir(dir);
}

for (const file of rootFiles) {
  if (fs.existsSync(file)) {
    processFile(file);
  }
}
