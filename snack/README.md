# Expo Weather Snack import

This asset-free mirror exists as a workaround for the Expo Snack GitHub importer's current asset-upload failure.
Import the repository URL with folder path `snack` and branch `main`. The package and Expo SDK versions are intentionally exact-pinned to SDK 57.

Runtime updates are disabled. Update this mirror together with the root application whenever shared application code changes.

The footer and legal-notice modal mirror the root app: educational demonstration, © 2026 Peter Stroessler for his contributions, contact `peter.stroessler@bluewin.ch`, no reuse or sharing of the demo's CARTO key, and legally qualified warranty/liability limitations. The MIT license continues to govern source code, not credentials. Keep `src/legalNotice.json` synchronized with the root and `LEGAL.md`.

The local mirror targets Expo SDK 57.0.27 / React Native 0.86.3 / React 19.2.3. Select SDK 57 when importing in Snack. The saved online Snack is updated only after re-importing and saving; local changes do not publish it automatically. Local exports use the root SDK-57 toolchain.

CARTO basemaps require your own key. Local Expo runs read `EXPO_PUBLIC_CARTO_API_KEY` from the app's `.env.local` or process environment. The root `.env.local` is not imported into an online Snack. In a runtime without Expo environment loading, supply your own basemap-scoped key through `RadarViewer`'s optional `cartoApiKey` prop in your private Snack configuration; keep it out of this repository. The key is visible in client bundles. Configure appropriate key restrictions in CARTO. Without a key, radar data and attribution remain visible and basemap tiles are not requested.
