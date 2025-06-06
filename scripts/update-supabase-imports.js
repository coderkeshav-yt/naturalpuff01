const fs = require('fs');
const path = require('path');

function updateImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const newContent = content.replace(
    /from ['"]@\/integrations\/supabase\/client['"];/g,
    'from "@/lib/supabase";'
  );
  fs.writeFileSync(filePath, newContent, 'utf8');
}

// Get all TypeScript files recursively
function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });

  return arrayOfFiles;
}

// Update all TypeScript files in src directory
const files = getAllFiles('./src');
files.forEach(updateImports); 