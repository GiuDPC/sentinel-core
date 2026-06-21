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
  
  // Replace ../generated/prisma or ../../generated/prisma with @prisma/client
  const regex = /['"](\.\.\/)*generated\/prisma(\/index\.js)?['"]/g;
  const newContent = content.replace(regex, "'@prisma/client'");

  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated Prisma imports in ${file}`);
  }
});
