#!/usr/bin/env node
/**
 * Explicit Expo SDK alignment helper, adapted from the referenced Snack.
 * It never changes files unless --write is passed.
 */

const fs = require('fs');
const path = require('path');

const packagePath = path.join(process.cwd(), 'package.json');

if (!fs.existsSync(packagePath)) {
  console.error('package.json not found');
  process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const target = {
  '@expo/metro-runtime': '57.0.16',
  '@react-native-async-storage/async-storage': '2.2.0',
  '@react-navigation/material-top-tabs': '7.6.14',
  '@react-navigation/native': '7.5.0',
  '@testing-library/react-native': '13.3.3',
  expo: '57.0.27',
  'expo-location': '57.0.20',
  'expo-status-bar': '57.0.1',
  react: '19.2.3',
  'react-dom': '19.2.3',
  'react-native': '0.86.3',
  'react-native-gesture-handler': '2.32.0',
  'react-native-pager-view': '8.0.2',
  'react-native-reanimated': '4.5.1',
  'react-native-safe-area-context': '5.7.0',
  'react-native-web': '0.21.2',
  'react-native-worklets': '0.10.1',
  '@react-native/jest-preset': '0.86.3',
  '@types/react': '19.2.18',
  'babel-preset-expo': '57.0.14',
  'jest-expo': '57.0.5',
  'react-server-dom-webpack': '19.1.9',
  'react-test-renderer': '19.2.3',
  typescript: '6.0.3',
};

const currentVersion = (name) =>
  packageJson.dependencies?.[name] ?? packageJson.devDependencies?.[name] ?? null;

const differences = Object.entries(target)
  .map(([name, wanted]) => ({ name, wanted, current: currentVersion(name) }))
  .filter(({ current, wanted }) => current !== wanted);

if (differences.length === 0) {
  console.log('Expo SDK 57 dependencies are pinned and aligned.');
  process.exit(0);
}

console.log('Expo SDK 57 version differences:');
for (const difference of differences) {
  console.log(`  ${difference.name}: ${difference.current ?? '(missing)'} -> ${difference.wanted}`);
}

if (!process.argv.includes('--write')) {
  console.log('\nNo files changed. Run npm run expo:align:write to apply these pins.');
  process.exit(1);
}

for (const { name, wanted } of differences) {
  if (Object.prototype.hasOwnProperty.call(packageJson.devDependencies ?? {}, name)) {
    packageJson.devDependencies[name] = wanted;
  } else {
    packageJson.dependencies ??= {};
    packageJson.dependencies[name] = wanted;
  }
}

fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
console.log('\npackage.json updated. Run npm install, then npm run doctor.');
