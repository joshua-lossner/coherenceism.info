const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoUrl = process.env.CONTENT_REPO_URL || 'https://github.com/joshua-lossner/coherenceism.content.git';
const contentDir = path.resolve(__dirname, '..', 'content');

function run(cmd) {
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (err) {
    console.error(`Failed to execute "${cmd}":`, err.message);
  }
}

if (!fs.existsSync(contentDir)) {
  console.log(`Cloning content repo to ${contentDir}...`);
  run(`git clone ${repoUrl} ${contentDir}`);
} else if (fs.existsSync(path.join(contentDir, '.git'))) {
  console.log('Updating content repo...');
  run(`git -C ${contentDir} pull`);
} else {
  console.log('Content directory exists but is not a git repo; skipping sync');
}
