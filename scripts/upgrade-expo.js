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
  '@expo/metro-runtime': '6.1.2',
  '@react-native-async-storage/async-storage': '2.2.0',
  '@react-navigation/material-top-tabs': '7.6.14',
  '@react-navigation/native': '7.3.16',
  '@react-navigation/native-stack': '7.18.7',
  '@testing-library/react-native': '13.3.3',
  expo: '54.0.36',
  'expo-location': '19.0.8',
  'expo-status-bar': '3.0.9',
  react: '19.1.0',
  'react-dom': '19.1.0',
  'react-native': '0.81.5',
  'react-native-gesture-handler': '2.28.0',
  'react-native-pager-view': '6.9.1',
  'react-native-reanimated': '4.1.1',
  'react-native-safe-area-context': '5.6.0',
  'react-native-screens': '4.16.0',
  'react-native-web': '0.21.0',
  'react-native-worklets': '0.5.1',
  '@types/react': '19.1.17',
  'babel-preset-expo': '54.0.12',
  'jest-expo': '54.0.17',
  'react-server-dom-webpack': '19.0.8',
  'react-test-renderer': '19.1.0',
  typescript: '5.9.3',
};

const currentVersion = (name) =>
  packageJson.dependencies?.[name] ?? packageJson.devDependencies?.[name] ?? null;

const differences = Object.entries(target)
  .map(([name, wanted]) => ({ name, wanted, current: currentVersion(name) }))
  .filter(({ current, wanted }) => current !== wanted);

if (differences.length === 0) {
  console.log('Expo SDK 54 dependencies are pinned and aligned.');
  process.exit(0);
}

console.log('Expo SDK 54 version differences:');
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
