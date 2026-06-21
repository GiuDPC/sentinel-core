import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
files.push('./prisma/seed.ts');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Match `import ... from './xxx'` or `import ... from '../xxx'`
  // We use a safe regex that captures the whole string up to the quote.
  const regex = /(from\s+['"])(\.\/[^'"]+|\.\.\/[^'"]+)(['"])/g;
  
  const newContent = content.replace(regex, (match, p1, p2, p3) => {
    // p1 = "from '"
    // p2 = "./services/category.service"
    // p3 = "'"
    if (p2.endsWith('.js') || p2.endsWith('.json')) return match;
    return `${p1}${p2}.js${p3}`;
  });

  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated imports in ${file}`);
  }
});
