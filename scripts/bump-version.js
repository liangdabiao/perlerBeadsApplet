const fs = require('fs');
const path = require('path');

const envProductionPath = path.join(__dirname, '../.env.production');
const packageJsonPath = path.join(__dirname, '../package.json');

function bumpVersion(version) {
  const parts = version.split('.').map(Number);
  parts[2]++;
  return parts.join('.');
}

function updateEnvVersion(newVersion) {
  let content = fs.readFileSync(envProductionPath, 'utf8');
  content = content.replace(/TARO_APP_VERSION="[^"]*"/, `TARO_APP_VERSION="${newVersion}"`);
  fs.writeFileSync(envProductionPath, content, 'utf8');
}

function updatePackageVersion(newVersion) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  packageJson.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
}

function main() {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const currentVersion = packageJson.version;
  const newVersion = bumpVersion(currentVersion);

  updateEnvVersion(newVersion);
  updatePackageVersion(newVersion);

  console.log(`Version bumped from ${currentVersion} to ${newVersion}`);
}

main();
