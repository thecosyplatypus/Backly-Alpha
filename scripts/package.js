const path = require('path');
const fs = require('fs');
const { packager } = require('@electron/packager');

async function build() {
  try {
    console.log('Packaging Backly...');

    // Kill any running Backly processes that might hold file locks
    try {
      const { execSync } = require('child_process');
      if (process.platform === 'win32') {
        execSync('taskkill /f /im Backly.exe', { stdio: 'pipe' });
      } else {
        execSync('pkill -f Backly', { stdio: 'pipe' });
      }
    } catch {} // Ignore errors if no process was running

    // Clean old release directory to avoid EBUSY file lock conflicts
    const releaseDir = path.resolve(__dirname, '..', 'release');
    if (fs.existsSync(releaseDir)) {
      console.log('Cleaning old release directory...');
      try {
        const entries = fs.readdirSync(releaseDir);
        for (const entry of entries) {
          const fullPath = path.join(releaseDir, entry);
          try {
            fs.rmSync(fullPath, { recursive: true, force: true });
          } catch (e) {
            console.log(`Could not remove ${entry}, renaming...`);
            try {
              fs.renameSync(fullPath, path.join(releaseDir, `${entry}_old_${Date.now()}`));
            } catch {}
          }
        }
      } catch (e) {
        console.log('Cleanup warning:', e.message);
      }
    }

    const appPaths = await packager({
      dir: path.resolve(__dirname, '..'),
      out: releaseDir,
      name: 'Backly',
      platform: 'win32',
      arch: 'x64',
      electronVersion: '33.4.11',
      appVersion: '1.0.0',
      executableName: 'Backly',
      asar: true,
      overwrite: true,
      prune: true,
      quiet: false,
      win32metadata: {
        ProductName: 'Backly',
        CompanyName: 'Backly',
        FileDescription: 'Premium Gaming Backlog Tracker',
      },
      appBundleId: 'com.backly.app',
      ignore: [
        /\.ts$/,
        /\.tsx$/,
        /\.map$/,
        /scripts/,
        /node_modules\/\.cache/,
        /\.git/,
        /prisma\/schema\.prisma/,
        /vite\.config\.ts/,
        /tailwind\.config\.js/,
        /postcss\.config\.js/,
        /tsconfig\.json/,
        /tsconfig\.main\.json/,
        /\.env/,
        /\.env\.example/,
        /BUILD_AND_RUN\.bat/,
        /RUN\.bat/,
      ],
    });

    // Copy bundled database to packaged resources
    const dbSrc = path.resolve(__dirname, '..', 'prisma', 'backly.db');
    for (const appPath of appPaths) {
      const dbDest = path.join(appPath, 'resources', 'database', 'backly.db');
      const dbDir = path.dirname(dbDest);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      fs.copyFileSync(dbSrc, dbDest);
      console.log('Database bundled at:', dbDest);
    }

    console.log('Packaged to:', appPaths.join(', '));
  } catch (err) {
    console.error('Packaging failed:', err);
    process.exit(1);
  }
}

build();
