# Project Guide

This file is the durable implementation guide for contributors and coding agents. Update it in the same change whenever project behavior, dependencies, configuration, commands, architecture, or operational requirements change.

## Project

- Expo SDK 54.0.36 / React Native 0.81.5 weather app targeting iOS, Android, the saved Expo Snack, Expo Go, and web.
- Saved Snack: `https://snack.expo.dev/@petethegreat/github.com-peterruler-weather-app`.
- UI language: German.
- Package manager: npm. `package-lock.json` is the source of truth.
- Expo and React Native dependencies are exact-pinned to the SDK 54.0.36-compatible set. Do not update them implicitly. Use `npm run expo:align` to audit the pins and only use `npm run expo:align:write` when an SDK alignment change is intentional.
- React Navigation is pinned as one compatible set (`native@7.3.16`, `material-top-tabs@7.6.14`, `native-stack@7.18.7`) so its nested `elements` peer resolves cleanly.
- Keep the test-only `react-server-dom-webpack@19.0.8` pin. It is the latest security-patched release inside `jest-expo@54.0.17`'s accepted 19.0 range and, unlike npm's newer automatic selection, remains compatible with SDK 54's React 19.1.0.
- `package.json` excludes only `react-server-dom-webpack` from `expo install --check`: Expo's suggested `19.1.4` is deprecated for a high-severity issue and requires React `^19.1.4`, which conflicts with SDK 54's React 19.1.0. Do not remove the exclusion without reassessing all three constraints.
- React Native Testing Library stays on its latest 13.x release (`13.3.3`); 14.x brings a test renderer that requires React 19.2 and is therefore outside SDK 54's React baseline.
- Keep `babel-preset-expo@54.0.12` as a direct development dependency; npm may otherwise nest Expo's copy where the root Jest/Babel configuration cannot resolve it.
- Linting uses `eslint-config-universe` 16 with Prettier 3. `package.json` narrowly overrides Expo Metro's PostCSS to the patched `8.5.26`; keep it unless Expo 54 receives an equivalent fix. The remaining audit advisories are moderate Expo 54 tooling issues whose offered fix is SDK 57. Do not use `npm audit fix --force` while this project intentionally targets SDK 54.
- Runtime weather and forecast data: Open-Meteo Forecast API. Text search uses the Open-Meteo Geocoding API, whose location data is based on GeoNames. These public endpoints require no client API key.
- Open-Meteo data is CC BY 4.0. Keep a visible, clickable `Wetterdaten: Open-Meteo` attribution next to weather data on every screen that displays it.
- Radar data: RainViewer Weather Maps API over CARTO `light_all` tiles using OpenStreetMap data. The map is a centered, non-pannable tile mosaic at zoom 7 with animated observed/nowcast frames.

## Required configuration

No API key or `.env` file is required. Do not reintroduce a client-side weather credential; the key-free Open-Meteo integration exists specifically to avoid 401 failures in Expo Go and Snack.

## Commands

```bash
./install.sh             # verify prerequisites and install locked dependencies
./run.sh                 # start Expo for Expo Go / interactive development
./run.sh web             # start the web app
./run.sh web-export      # create a production web export in dist/
npm run expo:align       # report Expo SDK pin drift without changing files
npm run expo:align:write # explicitly restore the documented SDK 54 pins
npm run validate         # typecheck, tests, Expo Doctor, and web export
```

`run.sh` requires only the installed dependencies and forwards additional arguments to Expo. `install.sh` uses `npm ci` and never mutates the resolved dependency set.

Use Node.js 20.19 or newer. Do not install a global Expo CLI; use the project-local CLI through `npx expo` or the npm scripts.

## Architecture and conventions

- `App.tsx` owns API/state orchestration and navigation.
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
- The radar must not depend on weather requests succeeding. With no selected weather location, `CardsScreen` uses documented Zurich fallback coordinates; a searched or GPS-selected location replaces the fallback.
- `src/lib/weatherApi.ts` owns Open-Meteo URLs, WMO weather-code normalization, geocoding, current conditions, and daily forecast parsing. Keep HTTP/authentication concerns out of the screens.
- Weather API adapters must await and validate responses centrally and surface concise German errors to the UI.
- `app.json` deliberately disables Expo Updates (`enabled: false`, `checkAutomatically: NEVER`). Do not re-enable background or automatic OTA updates unless the user explicitly changes this policy.
- `.npmrc` uses `save-exact=true`. Keep Expo-compatible dependency versions exact so routine installs cannot silently move the Snack/runtime baseline.
- `scripts/upgrade-expo.js` is the opt-in alignment helper adapted from the referenced frontend Snack. Its normal mode is read-only; changing versions requires `--write`, followed by `npm install` and full validation.
- Keep network failures user-friendly and provide a retry action where practical.
- Use current cross-platform React Native web props/styles; avoid deprecated `pointerEvents` props and `style.resizeMode`.
- No weather API credential is needed. Never hard-code or commit API keys if future providers introduce authenticated services.
- Add or update tests for logic changes.
- Application typechecking excludes Jest files; all tests are compiled and executed through the SDK-matched `jest-expo` preset so Expo environment-variable transforms work.
- ESLint uses `tsconfig.eslint.json` so test files still receive type-aware linting without entering the application TypeScript build.
- The normal lint command uses `--quiet` to report actionable errors without dumping the legacy formatting-warning backlog; use `npm run lint:fix` only for an intentional formatting pass.
- Keep `README.md` accurate for installation, running, environment variables, and platform limitations.
- Keep provider references in `rating.md` consistent with the current Open-Meteo and RainViewer architecture.
- Keep documentation free of trailing whitespace so `git diff --check` remains clean.
- Record user-visible and operational changes in `CHANGELOG.md` under `Unreleased`.
- Update this file in every change that affects any instruction above.

## Validation before handoff

Run, at minimum:

```bash
npm run typecheck
npm test -- --runInBand
npx expo-doctor@latest
npm run web:export
```

For device validation, start `./run.sh`, scan the QR code with an Expo Go client that supports SDK 54, grant foreground location access, select a city, and open the radar tab. Also verify the saved Snack after repository changes have been imported or re-saved there.

Disabling Expo Updates freezes this app's OTA behavior, not the externally managed Expo Go or Snack runtime. Expo Go only supports selected/current SDKs, so long-term reproducibility requires a development build. Expo Go is a development preview, not a deployment target. Native releases should use a future EAS Build setup; production web output is the static `dist/` export.
