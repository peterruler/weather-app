# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## Unreleased

### Added

- Added an asset-free `snack/` import mirror with its own Expo entry point, exact native and web Expo SDK 54 dependencies, explicit `sdkVersion: 54.0.0`, disabled runtime updates, and content-addressed remote image assets to bypass Expo Snack's current GitHub asset-forwarding failure.
- Documented the required Snack GitHub import settings: repository URL, `snack` folder path, and `main` branch.
- Added this changelog and the contributor/agent guide in `CLAUDE.md`.
- Added Expo location permission descriptions for reproducible configuration.
- Added executable `install.sh` and `run.sh` workflows for locked installation, Expo Go, web development, cache clearing, simulators, and production web export.
- Added a read-only-by-default `scripts/upgrade-expo.js` alignment helper, adapted from the referenced frontend Snack, with an explicit `--write` mode.
- Added `.npmrc` with exact-version saving to prevent routine installs from drifting the Expo runtime baseline.
- Pinned Jest Expo's optional React Server Components peer to a React-19.1-compatible version so npm resolves the SDK 54 test toolchain without bypassing peer checks.
- Excluded that test-only peer from Expo's generic version checker because Expo's suggested 19.1.4 build is both deprecated for a high-severity issue and incompatible with SDK 54's React 19.1.0 peer range.
- Selected React Native Testing Library 13.3.3 because its supported React range includes SDK 54's React 19.1; version 14's renderer requires React 19.2.
- Added the SDK-matched Expo Babel preset directly so Jest resolution does not depend on npm's hoisting layout.
- Overrode Expo Metro's vulnerable build-time PostCSS 8.4 release with patched PostCSS 8.5.26; the production web export validates compatibility.

### Changed

- Fixed radar controls clipped by the legal footer on short mobile screens: the whole radar tab now scrolls, including playback, frame controls and attribution, while the footer stays visible in its own layout area. Mirrored the fix locally and in the saved SDK-55 Snack, strengthened the screen regression, and verified responsive browser behavior at 390×667 and 320×568 with all 32 tests passing.
- Added the official Expo SDK-57 Android download-page link to both READMEs, retaining the official release-assets link for manual APK downloads when Expo directs the current version to Google Play.
- Documented the requested Android Expo Go setup: uninstall the old app first, manually install the SDK-57-compatible APK from official Expo release assets, then scan the local LAN QR code. Updated both READMEs and the contributor guide; clarified that APK installation applies only to Android.
- Migrated back from SDK 55 to SDK 57.0.27 at the user's request, aligning React Native 0.86.3, React/test renderer 19.2.3, native libraries, TypeScript 6.0.3, Babel/Jest tooling, the separate React Native Jest preset, Node 22.13+ prerequisites, both Expo configurations, the exact-pinned Snack mirror, and the alignment helper. Preserved the three-tab navigation fix and all 32 behavior tests; documented that the saved hosted Snack remains constrained by Expo's deployed runtimes.

- Added `?sdkVersion=57.0.0` to the README demo URL at the user's request, retaining the SDK-55 saved-app state and unsupported-runtime fallback explanation.
- Documented Snack's SDK picker and official `sdkVersion` URL parameter after researching Expo's maintainer documentation. A separate SDK-57 URL test was rejected as unsupported and fell back to SDK 54; preserved the working saved weather Snack on SDK 55 and documented the Expo-side deployment requirement.
- Fixed the saved SDK-55 Snack Babel-loader dependency error by removing the redundant single-route native stack and the unused `@react-navigation/native-stack` / `react-native-screens` packages. Kept all three tabs and the legal footer, synchronized the local mirror and alignment helper, removed obsolete stack types/Jest mocks, and preserved all 32 behavior tests. Verified the hosted browser preview reports no errors and supports weather search, forecast, and radar.

- Migrated the app and Snack mirror from SDK 57 to SDK 55 (`sdkVersion: 55.0.0`, `expo@55.0.31`) at the user's request, aligning React Native 0.83.10, React/test renderer 19.2.0, native libraries, TypeScript 5.9.2, Babel/Jest tooling, lockfile, alignment helper, and installation prerequisites. Removed the SDK-57-only separate React Native Jest preset.
- Switched the saved online Snack to v55.0.0, aligned its native dependencies with Snack-recommended version specs, removed importer-added Node-only dependencies and the CLI-only helper, and documented the need for an SDK-55-compatible Expo Go client. Recorded the separate hosted `react-native-screens` bundler failure without substituting an incompatible native version.
- Updated React Navigation native to 7.5.0 to satisfy the current nested elements peer; verified clean lockfile installation, all 32 UI tests, Expo Doctor, and web/iOS/Android exports.
- Verified the saved Snack still selects SDK 54 and offers only SDK 50–55; documented two unsuccessful SDK-57 selection attempts, the hosted-runtime limitation, and the separate SDK-57 Expo Go LAN preview workflow. Corrected instructions that implied re-importing or `app.json` alone could enable SDK 57 online.
- Added an app-wide copyright and CARTO-key reuse warning, an accessible legal-notice modal with Peter Stroessler's contact address, and `LEGAL.md`; mirrored the UI and wording in Snack.
- Documented educational-only operation of this demonstration, legally qualified warranty/liability exclusions, and the distinction between the MIT source-code license and non-transferable demo credentials. Preserved contributor copyrights and added Peter's 2026 contribution copyright.
- Added configurable CARTO basemap authentication through `EXPO_PUBLIC_CARTO_API_KEY`, an empty `.env.example`, and encoded `?key=` tile URLs; synchronized the Snack mirror and documented local key setup and client-side visibility.
- Kept RainViewer radar and map attribution visible when the basemap key is missing, without requesting unauthenticated CARTO tiles; added regression tests for key encoding, missing configuration, and provider credential separation.
- Documented the fresh-cache web rebuild and localhost startup commands, port selection, and stopping the development server; verified the SDK-57 app opens in the browser after rebuilding.
- Made updates to `CLAUDE.md` and `README.md` mandatory for every agent-prompted repository change, including documentation tasks; documented test preservation, behavior-test maintenance, UI-enabled validation for migrations/UI changes, and explicit reporting of unverified checks.
- Migrated the root app and asset-free Snack mirror from Expo SDK 54 to SDK 57.0.27, React Native 0.86.3, React 19.2.3, and TypeScript 6.0.3, including SDK-matched native libraries and Jest/Babel tooling.
- Updated the reproducible npm lockfile, SDK alignment helper, and Node.js requirement to 22.13+; documented iOS 16.4+, Xcode 26.4+, Android SDK 36, New Architecture, and development-client rebuild requirements.
- Updated Jest's compatible optional React Server Components peer to patched 19.1.9 and added React Native's separate 0.86.3 Jest preset.
- Removed the obsolete `assetBundlePatterns` app configuration; runtime updates remain disabled.
- Applied compatible transitive security updates, including the critical `shell-quote` fix. The remaining npm audit findings are upstream Expo/Metro/Jest tooling advisories (high and moderate findings; no critical).

- Aligned and exact-pinned the app to Expo SDK 54.0.36, React Native 0.81.5, and React 19.1 for the saved Snack and the currently supported physical-device Expo Go workflow.
- Updated React Navigation, testing, and TypeScript packages and added repeatable validation scripts.
- Aligned React Navigation's native package to the patch required by its current nested elements package.
- Removed the deprecated `@testing-library/jest-native` package; React Native Testing Library now provides its matchers directly.
- Standardized dependency management on npm and documented the Node.js 20.19 minimum required by Expo SDK 54.
- Disabled Expo Updates and automatic update checks so release builds stay on their bundled JavaScript instead of accepting OTA changes.
- Replaced the unreliable single-radar page with an Expo Go/web-compatible RainViewer composite animation over CARTO/OpenStreetMap tiles, including location marker, observed/forecast labels, retry handling, and required attribution.
- Decoupled radar loading from weather requests: the radar opens on a Zurich default when no weather location is available.
- Isolated radar side effects in app-level weather tests while retaining dedicated radar URL, timeline, and screen coverage.
- Replaced authenticated OpenWeatherMap requests with key-free Open-Meteo geocoding, current-weather, and daily-forecast requests, eliminating the 401 failure after GPS positioning.
- Reverse-geocoded the GPS position before requesting weather so the current-location result has a useful place label even though the weather endpoint is coordinate based.
- Added regression tests proving GPS coordinates reach Open-Meteo without an `appid` credential and covering WMO-code, current-weather, forecast, and missing-place conversion.
- Added visible Open-Meteo attribution links to every screen displaying its weather data, as required by the provider's CC BY 4.0 terms.
- Stabilized the radar selection callback so parent renders do not restart network loading.
- Replaced legacy single-site radar tests with coverage for documented RainViewer timelines, tile geometry, URL construction, and failure handling.
- Switched the default Jest configuration to the SDK-matched Expo preset for Expo environment-variable support.
- Added a dedicated ESLint TypeScript project so tests remain lintable while excluded from the application typecheck.
- Added a root safe-area provider, migrated rendered screens to `react-native-safe-area-context`, and updated UI tests for React 19 module identity and concurrent forecast requests.
- Added a deterministic safe-area Jest mock for native-free UI rendering.
- Corrected stale UI-test expectations and enabled FlatList rendering for saved-location interaction coverage.
- Removed React module resets from renderer tests and made native touch-target lookup resilient to host-wrapper depth.
- Made the FlatList Jest mock render synchronously, eliminating post-test VirtualizedList timers.
- Switched the radar base layer from the restricted OpenStreetMap public tile server to CORS-enabled CARTO tiles with complete OpenStreetMap/CARTO attribution after live endpoint validation.
- Removed deprecated React Native web pointer-event and image resize style usage found during browser validation.
- Prevented an empty-radar error flash during initial timeline loading and made `run.sh` reject the example API-key placeholder.
- Updated the lint configuration to `eslint-config-universe` 16 and Prettier 3, removing outdated TypeScript-ESLint development dependencies.
- Documented the remaining upstream Expo CLI audit advisory and made the regular lint output actionable-error-only.
- Documented that disabling OTA updates does not freeze the independently managed Expo Go or Snack runtime and that a development build is the durable fallback.
- Rewrote the README with prerequisites, environment settings, script-based setup, Expo Go instructions, validation, deployment distinctions, radar behavior, attribution, and troubleshooting.
- Updated stale provider references in the project review document.

### Removed

- Removed undocumented RainViewer single-site lookup code and stale Swiss radar identifiers.
- Removed the OpenWeatherMap API-key and `.env` requirement from installation and startup.
