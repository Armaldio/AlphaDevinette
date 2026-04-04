import fs from 'fs';
import path from 'path';

const packageJsonPath = path.resolve('package.json');
const buildGradlePath = path.resolve('android/app/build.gradle');

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;

// Split version into components: major.minor.patch
const [major, minor, patch] = version.split('.').map(Number);
// Generate a simple versionCode (e.g., 600 for 0.6.0)
const versionCode = major * 1000 + minor * 100 + patch;

console.log(`Syncing Android version to ${version} (versionCode: ${versionCode})...`);

if (fs.existsSync(buildGradlePath)) {
  let content = fs.readFileSync(buildGradlePath, 'utf8');
  
  // Replace versionName
  content = content.replace(/versionName\s+"[^"]+"/, `versionName "${version}"`);
  // Replace versionCode
  content = content.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);
  
  fs.writeFileSync(buildGradlePath, content);
  console.log('Successfully updated android/app/build.gradle');
} else {
  console.warn('android/app/build.gradle not found, skipping sync.');
}
