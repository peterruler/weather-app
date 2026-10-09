# Project Guide

This file is the durable implementation guide for contributors and coding agents. Read it before making repository changes and update it as part of every user-requested change.

## Required maintenance for every change

- Update `CLAUDE.md` in the same change for every implementation, fix, refactor, dependency update, configuration change, or documentation task prompted to an agent. Record the resulting project state, decisions, commands, requirements, and validation limitations that future contributors need; replace outdated instructions.
- Always update `README.md` alongside the change so its feature descriptions, setup, commands, dependencies, testing instructions, and platform limitations match the project. Apply this requirement to documentation-only tasks as well.
- Preserve the existing tests and their coverage of supported behavior. Add or update meaningful tests when behavior or logic changes, and run the relevant tests before handoff. Do not delete, skip, or weaken tests merely to make a change pass.
- For dependency migrations and UI changes, run the full UI-enabled suite with `npm run test:expo -- --runInBand`; the default test command skips the opt-in UI suites.
- Record user-visible and operational changes in `CHANGELOG.md` under `Unreleased`. Keep the root app and `snack/` mirror consistent wherever the change applies.
- Report what was checked and any checks that could not be completed. Documentation-only edits require `git diff --check`; application tests and builds need rerunning when executable code, dependencies, configuration, or behavior changes.

## Project

- Expo SDK 57.0.27 / React Native 0.86.3 weather app targeting iOS, Android, SDK-57-compatible Expo Go, and web; the saved online Snack is subject to Expo's independently deployed runtime support.
- Saved Snack: `https://snack.expo.dev/@petethegreat/github.com-peterruler-weather-app`.
- The README demo URL includes `?sdkVersion=57.0.0` at the user's request. The user then explicitly requested migrating the repository back to SDK 57 on 2026-10-09; this supersedes the earlier SDK-55 migration preference. Both local configurations now use `sdkVersion: 57.0.0`. Do not downgrade implicitly.
- Hosted Snack support is separate: the last test of `https://snack.expo.dev/?sdkVersion=57.0.0` reported an unsupported SDK and fell back to 54; the picker offered SDK 50–55. The saved weather Snack was verified working on 55 before this migration. Do not save SDK-57 packages into its SDK-55 runtime or claim the URL provisions a runtime. When Snack supports 57, explicitly re-import the mirror, select 57, save, and verify. See the [official SDK configuration](https://github.com/expo/snack/blob/main/website/src/client/configs/sdk.tsx) and [maintainer deployment guide](https://github.com/expo/snack/blob/main/docs/expo-sdk-upgrade.md).
- For a phone, use SDK-57-compatible Expo Go and `./run.sh start --go --lan --port 8082`, then scan the local QR code on the same Wi-Fi. Use a rebuilt SDK-57 development client if no matching Expo Go version is available. Close and reopen Expo Go after a runtime change. Physical iOS Expo Go may require the CLI and device to use the same Expo account. Physical-device execution requires a separate test.
- GitHub-to-Snack imports must use repository `https://github.com/peterruler/weather-app`, folder path `snack`, and branch `main`. The root import currently fails inside Expo's import service while it forwards otherwise valid repository assets.
- `snack/` is the asset-free SDK-57 mirror used by the GitHub importer. It uses content-addressed Expo-hosted image URLs, an explicit `index.js` entry for isolated local web validation, SDK-57 runtime dependencies, `sdkVersion: 57.0.0`, and disabled runtime updates.
- UI language: German.
- Legal contact: Peter Stroessler, `peter.stroessler@bluewin.ch`. `src/components/LegalNotice.tsx` provides a persistent footer on every tab and a scrollable legal-notice modal; `src/legalNotice.json` is the shared notice content and `LEGAL.md` is its readable repository version. Keep all three, the README, and the Snack equivalents consistent when editing legal wording.
- The concrete hosted demonstration is for educational use. Prohibit sharing or reusing its CARTO key outside this demo, and require separate deployments/forks to obtain their own keys. This restriction applies to credentials and service access; preserve the MIT source-code license and existing contributor copyrights. Peter's 2026 copyright applies to his contributions. Keep provider attribution visible.
- Warranty and liability wording must retain mandatory-law exceptions, including intent, gross negligence, injury to life/body/health, and other non-excludable rights. The notice is a draft, not a guarantee of enforceability or a technical protection for client-visible keys. Do not imply that a footer changes CARTO's terms or that simply displaying it establishes contractual assent.
- Package manager: npm. `package-lock.json` is the source of truth.
- Expo and React Native dependencies are exact-pinned to the SDK 57.0.27-compatible set. Do not update them implicitly. Use `npm run expo:align` to audit the pins and only use `npm run expo:align:write` when an SDK alignment change is intentional.
- React Navigation is pinned as one compatible set (`native@7.5.0`, `material-top-tabs@7.6.14`) so nested `elements@2.9.44` peers resolve cleanly. The clean SDK-55 installation exposed its `native@^7.5.0` requirement; do not restore the older 7.3.16 pin.
- Keep the test-only `react-server-dom-webpack@19.1.9` pin. It is a patched release in `jest-expo@57.0.5`'s accepted `~19.0.4 || ~19.1.5 || ~19.2.4` range and its React peer supports SDK 57's React 19.2.3.
- `package.json` excludes only `react-server-dom-webpack` from `expo install --check`: Expo's suggested `~19.2.4` requires React `^19.2.4`, which conflicts with SDK 57's React 19.2.3. Reassess the exclusion when the SDK React baseline changes.
- Keep `react-test-renderer@19.2.3` matched to React. React Native 0.86 moved its Jest preset into the separate direct `@react-native/jest-preset@0.86.3` package, required by `jest-expo@57.0.5`. Preserve React Native Testing Library 13.3.3 and all 32 behavior tests.
- Keep `babel-preset-expo@57.0.14` as a direct development dependency for root Jest/Babel resolution. TypeScript is SDK-aligned at 6.0.3.
- React Native Web is pinned to 0.21.2. The root and Snack mirror runtime dependencies now share exact SDK-57 pins; preserve them and keep the alignment helper synchronized. Earlier hosted-SDK-55 tilde specs are no longer the local mirror policy.
- Linting uses `eslint-config-universe` 16 with Prettier 3. `package.json` narrowly overrides Metro's PostCSS to the patched `8.5.26`; reassess it when upgrading Metro. Compatible transitive audit fixes are included in the lockfile; the remaining audit findings are upstream tooling issues in `braces`, `node-forge`, `sprintf-js`, and `uuid` (high and moderate findings; no critical). Do not use `npm audit fix --force`; update the full compatible SDK set deliberately.
- Runtime weather and forecast data: Open-Meteo Forecast API. Text search uses the Open-Meteo Geocoding API, whose location data is based on GeoNames. These public endpoints require no client API key.
- Open-Meteo data is CC BY 4.0. Keep a visible, clickable `Wetterdaten: Open-Meteo` attribution next to weather data on every screen that displays it.
- Radar data: RainViewer Weather Maps API over CARTO `rastertiles/light_all` tiles using OpenStreetMap data. CARTO basemap requests require the app's own key via `EXPO_PUBLIC_CARTO_API_KEY`; the map is a centered, non-pannable tile mosaic at zoom 7 with animated observed/nowcast frames.

The renewed SDK-57 migration updates runtime/native libraries, Babel/Jest tooling, the separate React Native Jest preset, TypeScript 6, lockfile, alignment helper, Node prerequisite check, both Expo configurations, Snack mirror, and documentation. The three-tab navigator remains directly inside `NavigationContainer`, without an unused native stack or `react-native-screens`. Preserve weather, forecast, radar, legal notices, provider attribution, all 32 tests, and ignored local CARTO configuration. Runtime updates remain disabled.

Before migration, the SDK-55 hosted dependency failure was resolved by removing the single-route native stack. The saved online Snack then passed browser tests for Berlin weather, five forecast days, tab switching, radar and legal notices. This historical SDK-55 verification does not validate hosted SDK 57. The Node-only alignment helper remains only in the root repository, and the online demo requires its own CARTO configuration; never upload the ignored local key.

Final SDK-57 validation on 2026-10-09 passed `npm ci`, full `npm ls --all` without invalid peers, typecheck, lint, all 32 UI-enabled tests, the 16 default unit tests, alignment and Expo dependency checks, all 21 Expo Doctor checks, root web/iOS/Android JavaScript exports, isolated Snack web export, shell syntax checks, mirror/configuration consistency, and `git diff --check`. Browser verification confirmed Zürich search, weather values, five forecast days, tab switching, radar frame changes, CARTO basemap without the API-key watermark, and legal-modal open/close. The web server runs on 8081 and Expo Go LAN on 8082; the phone manifest reports `sdkVersion: 57.0.0` / `runtimeVersion: exposdk:57.0.0`. Bundle exports do not establish native-binary or physical-phone success. The hosted Snack remains on its separately verified SDK 55.

The updated SDK-57 audit reports 61 advisories (49 high, 12 moderate, zero critical), rooted in upstream `braces`, `node-forge`, `sprintf-js`, and `uuid`. npm proposes incompatible major toolchain changes for these findings; do not force-fix or silently downgrade Expo.

## Required configuration

Open-Meteo weather and RainViewer radar require no API keys. CARTO now requires its own basemap key. Copy `.env.example` to Git-ignored `.env.local` and set `EXPO_PUBLIC_CARTO_API_KEY`. Never commit the actual key, include it in documentation, or log it. Expo inlines public environment variables into the client bundle, so use only a basemap-scoped key and configure appropriate restrictions through CARTO; a website-only restriction may exclude native clients. Restart the development server and fully reload after changing the key; rebuild exported bundles and native releases to use the new value. Keep Open-Meteo key-free.

The local CARTO key was configured and the web app rebuilt/restarted on 2026-10-09. Browser verification confirmed that the basemap and radar render without the API-key watermark. Typecheck, lint, all 30 UI-enabled tests, and all 21 Expo Doctor checks passed. The key exists only in local ignored configuration and generated client bundles; fresh clones and the saved online Snack require their own configuration. Native-device behavior remains unverified.

## Commands

```bash
./install.sh             # verify prerequisites and install locked dependencies
./run.sh                 # start Expo for Expo Go / interactive development
./run.sh web             # start the web app
./run.sh web-export      # create a production web export in dist/
npm run expo:align       # report Expo SDK pin drift without changing files
npm run expo:align:write # explicitly restore the documented SDK 57 pins
npm run validate         # typecheck, tests, Expo Doctor, and web export
```

`run.sh` requires only the installed dependencies and forwards additional arguments to Expo. `install.sh` uses `npm ci` and never mutates the resolved dependency set.

To rebuild and start web with a fresh Metro cache, run `npm run web:export -- --clear`, then `./run.sh web --clear --localhost --port 8081`. The export is written to `dist/`; the live development app opens at `http://localhost:8081`. Check for an existing listener before choosing a port, leave the requested server running for the user, and verify the app renders in the browser before handoff. Stop it with `Ctrl+C` in its terminal. If the execution sandbox prevents binding the localhost port, request the necessary tool escalation and retry. The SDK-57 web rebuild and browser startup were verified on 2026-10-09, with typechecking and all 32 UI-enabled tests passing.

Use Node.js 22.13.0 or newer. Native builds require Xcode 26.4+ / iOS 16.4+ or Android SDK 36 / Android 7+. SDK 57 supports only the New Architecture. The repository has no checked-in native projects; `expo run:ios` and `expo run:android` generate them. Rebuild existing development clients after this migration. Regenerate previously generated native projects with the SDK-57 configuration after preserving custom edits. Do not opt into Hermes v1 as part of this migration. Do not install a global Expo CLI; use the project-local CLI through `npx expo` or npm scripts.

## Architecture and conventions

- `App.tsx` owns API/state orchestration and navigation. Its material top-tab navigator is the root navigator inside `NavigationContainer`; no native stack or `react-native-screens` dependency is needed for these three tabs.
- Keep the code under `snack/App.tsx` and `snack/src/` synchronized whenever their root counterparts change. Do not add binary files, shell scripts, or other non-code extensions to `snack/`; Expo's importer classifies extensions other than `.tsx`, `.ts`, `.js`, `.jsx`, `.json`, and `.md` as assets.
- Keep `snack/package.json` native and web runtime versions compatible with the root runtime dependencies, using the same exact pins; keep `snack/app.json` fixed to Expo SDK 57 with runtime updates disabled until an intentional full SDK migration is validated.
- Keep callbacks passed into network-loading effects stable with `useCallback` to avoid repeated requests.
- `src/screens/` contains the three tab screens.
- App root provides `SafeAreaProvider`; screens use `SafeAreaView` from `react-native-safe-area-context` because React Native's built-in component is deprecated.
- Jest replaces native safe-area primitives with deterministic zero-inset views and FlatList with synchronous item rendering to avoid native timers while preserving persistence UI tests.
- App-level weather orchestration tests mock `RadarViewer`; radar networking and rendering are covered separately so the independently mounted default radar does not contaminate Open-Meteo fetch assertions.
- `__tests__/weather-api.test.ts` covers WMO mapping, key-free geocoding, current-condition parsing, forecast parsing, and missing-place handling. Geolocation tests assert that coordinate weather requests contain no legacy `appid` credential.
- Weather API tests replace Node's built-in `global.fetch` with `jest.fn()` in each test setup; do not assume the runtime fetch is already a Jest mock.
- Do not call `jest.resetModules()` in React renderer tests; it creates a second React module instance and breaks hooks under React 19.
- `src/components/RadarViewer.tsx` renders the cross-platform radar.
- `src/lib/radarComposite.ts` is the only RainViewer and map-tile URL/timeline implementation. Do not restore the removed undocumented single-site radar endpoints.
- Radar must use RainViewer's documented `weather-maps.json` response (`host` + frame `path`), show provider attribution, and remain compatible with Expo Go and web without custom native code.
- Build CARTO URLs with an encoded `?key=` query in `buildBaseMapTileURL`; never send this key to RainViewer or Open-Meteo. The helper rejects empty keys. `RadarViewer` skips unauthenticated basemap requests and explains that the base map is unconfigured while continuing to show radar frames. Its optional `cartoApiKey` prop supports explicit configuration in runtimes without Expo environment loading, including manually configured online Snacks; never commit a real key in either mirror.
- Keep regression coverage for authenticated tile URLs, encoding/coordinate normalization, missing-key behavior, preserved radar/attribution, and separation between CARTO and RainViewer credentials.
- Keep UI coverage for the legal footer, opening/closing the notice, mandatory-liability carve-outs, continued MIT rights, and the contact mail link. Legal links must open only after user interaction.
- The radar must not depend on weather requests succeeding. With no selected weather location, `CardsScreen` uses documented Zurich fallback coordinates; a searched or GPS-selected location replaces the fallback.
- `src/lib/weatherApi.ts` owns Open-Meteo URLs, WMO weather-code normalization, geocoding, current conditions, and daily forecast parsing. Keep HTTP/authentication concerns out of the screens.
- Weather API adapters must await and validate responses centrally and surface concise German errors to the UI.
- `app.json` deliberately disables Expo Updates (`enabled: false`, `checkAutomatically: NEVER`). Do not re-enable background or automatic OTA updates unless the user explicitly changes this policy.
- `.npmrc` uses `save-exact=true`. Keep Expo-compatible dependency versions exact so routine installs cannot silently move the Snack/runtime baseline.
- `scripts/upgrade-expo.js` is the opt-in alignment helper adapted from the referenced frontend Snack. Its normal mode is read-only; changing versions requires `--write`, followed by `npm install` and full validation.
- Keep network failures user-friendly and provide a retry action where practical.
- Use current cross-platform React Native web props/styles; avoid deprecated `pointerEvents` props and `style.resizeMode`.
- No weather API credential is needed. Never hard-code or commit API keys if future providers introduce authenticated services.
- Preserve tests and add or update them for behavior and logic changes as required above.
- Application typechecking excludes Jest files; all tests are compiled and executed through the SDK-matched `jest-expo` preset so Expo environment-variable transforms work.
- ESLint uses `tsconfig.eslint.json` so test files still receive type-aware linting without entering the application TypeScript build.
- The normal lint command uses `--quiet` to report actionable errors without dumping the legacy formatting-warning backlog; use `npm run lint:fix` only for an intentional formatting pass.
- Update `README.md` with every prompted repository change, including installation, running, testing, environment variables, and platform limitations where affected.
- Keep provider references in `rating.md` consistent with the current Open-Meteo and RainViewer architecture.
- Keep documentation free of trailing whitespace so `git diff --check` remains clean.
- Record user-visible and operational changes in `CHANGELOG.md` under `Unreleased`.
- Update this file in every prompted repository change, including documentation-only changes.

## Validation before handoff

For application, dependency, or configuration changes, run at minimum:

```bash
npm run typecheck
npm test -- --runInBand
npm run lint
npx expo-doctor@latest
npm run web:export
```

Also run `npm run test:expo -- --runInBand` for dependency migrations and UI changes. For documentation-only changes, check accuracy against the current project and run `git diff --check`.

For device validation, start `./run.sh start --go --lan`, scan the local QR code with an Expo Go client that supports SDK 57, grant foreground location access, select a city, and open the radar tab. Verify the saved Snack with `v57.0.0` selected and SDK-57 native dependencies saved once hosted support is available; repository changes must be re-imported from folder path `snack` or applied explicitly in the editor. Record the actual selected runtime; local SDK-57 exports do not validate the online Snack.

Disabling Expo Updates freezes this app's OTA behavior, not the externally managed Expo Go or Snack runtime. Expo Go only supports selected/current SDKs, so long-term reproducibility requires a development build. Expo Go is a development preview, not a deployment target. Native releases should use a future EAS Build setup; production web output is the static `dist/` export.
