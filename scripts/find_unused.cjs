const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'src');


function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });

  return arrayOfFiles;
}

const allFiles = getAllFiles(srcDir);
const sourceFiles = allFiles.filter(f => f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.css'));
const assets = allFiles.filter(f => f.match(/\.(png|jpe?g|svg|gif|webp)$/i));

const fileContents = sourceFiles.map(f => fs.readFileSync(f, 'utf8'));
const fullContent = fileContents.join('\n');

const unusedAssets = [];
assets.forEach(asset => {
  const basename = path.basename(asset);
  // Check if basename is mentioned in any source file
  if (!fullContent.includes(basename)) {
    unusedAssets.push(asset);
  }
});

const unusedSourceFiles = [];
sourceFiles.forEach(sf => {
    const basename = path.basename(sf, path.extname(sf));
    if (basename === 'App' || basename === 'main' || basename === 'index' || basename === 'vite-env.d') return;
    
    // Check how many times it's mentioned. 1 time means its own export. 0 times is impossible if it exports.
    // Let's just do a simple check. If the basename is NOT mentioned anywhere except the file itself
    let count = 0;
    for (const content of fileContents) {
        if (content.includes(basename)) count++;
        if (count > 1) break;
    }
    if (count <= 1) {
        unusedSourceFiles.push(sf);
    }
});

console.log("=== UNUSED ASSETS ===");
unusedAssets.forEach(a => console.log(a.replace(srcDir, '')));

console.log("\n=== POTENTIALLY UNUSED SOURCE FILES ===");
unusedSourceFiles.forEach(f => console.log(f.replace(srcDir, '')));
