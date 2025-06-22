const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoUrl = process.env.CONTENT_REPO_URL || 'https://github.com/joshua-lossner/coherenceism.content.git';
const contentDir = path.resolve(__dirname, '..', 'content');

function run(cmd) {
  execSync(cmd, { stdio: 'inherit' });
}

if (!fs.existsSync(contentDir)) {
  console.log(`Cloning content repo to ${contentDir}...`);
  run(`git clone ${repoUrl} ${contentDir}`);
} else {
  console.log('Updating content repo...');
  run(`git -C ${contentDir} pull`);
}
