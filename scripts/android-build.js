const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const target = process.argv[2] || 'apk';
if (!['apk', 'aab'].includes(target)) {
  console.error('Usage: node scripts/android-build.js [apk|aab]');
  process.exit(1);
}

const root = path.resolve(__dirname, '..');
const androidDir = path.join(root, 'android');
const env = { ...process.env };
// Keep Gradle's downloaded distribution and dependency cache inside the project.
env.GRADLE_USER_HOME = env.GRADLE_USER_HOME || path.join(root, '.gradle');

if (!env.ANDROID_HOME && !env.ANDROID_SDK_ROOT) {
  const defaultSdk = path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk');
  if (fs.existsSync(defaultSdk)) env.ANDROID_HOME = defaultSdk;
}

const gradle = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
const task = target === 'apk' ? 'assembleDebug' : 'bundleRelease';
const result = spawnSync(gradle, [task, '--no-daemon'], {
  cwd: androidDir,
  env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}
if (result.status !== 0) process.exit(result.status || 1);

const source = target === 'apk'
  ? path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk')
  : path.join(androidDir, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');
const outputDir = path.join(root, 'release', 'android');
const destination = path.join(outputDir, target === 'apk' ? 'Backly-debug.apk' : 'Backly-release.aab');

fs.mkdirSync(outputDir, { recursive: true });
fs.copyFileSync(source, destination);
console.log(`\nAndroid ${target.toUpperCase()} created: ${destination}`);
