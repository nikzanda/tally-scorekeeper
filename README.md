# 🎲 Tally Scorekeeper

A React Native (Expo) app to keep score in board and card games: set up the players, tap to add or remove points, follow whose turn it is and keep a history of every game played. 🏆

> The app's interface is in Italian.

## ✨ Features

- **Players** – from 1 to 12 players, each with an editable name and a color picked from a palette or set by hand (RGB sliders or hex code).
- **Turn order** – drag & drop players to set who plays when, or let the app shuffle the order.
- **Scores** – big `+` / `−` buttons (hold to repeat faster) and a keypad to add or subtract any amount at once, e.g. +300. Negative scores are allowed.
- **Undo** – reverts the last score change; quick consecutive taps on the same player are undone together.
- **Turns and rounds** – highlights the current player and counts the rounds.
- **Win condition** – per game, the highest or the lowest score wins; the leader gets a 🏆.
- **Game history** – end a game to see the final ranking, rounds and duration, and save it to the history.
- **Light / dark theme** – follows the system until you pick one with the header button.
- **Offline** – the current game, the history and the theme are stored on the device only; no account or network needed.

## 🧰 Tech stack

- [Expo](https://expo.dev) SDK 58, React Native 0.88, TypeScript
- [Expo Router](https://docs.expo.dev/router/introduction/) for navigation
- React Context + `useReducer` for state, persisted with AsyncStorage
- [react-native-reorderable-list](https://github.com/omahili/react-native-reorderable-list) (Reanimated + Gesture Handler) for drag & drop
- Jest with `jest-expo` for unit tests

## 🚀 Getting started

### Prerequisites

- Node.js 22.13+ or 24.3+
- [Expo Go](https://expo.dev/go) built for **SDK 58** on your phone, or an Android emulator / iOS simulator

### Run the app

```bash
npm install
npx expo start
```

Scan the QR code shown in the terminal with Expo Go. The phone and the computer must be on the same network; otherwise start the server with `npx expo start --tunnel`.

- **Android**: install the SDK 58 build of Expo Go from [expo.dev/go](https://expo.dev/go) if the Play Store version is older.
- **iPhone**: the App Store version of Expo Go does not support SDK 58. Use [`eas go`](https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/) (requires an Apple Developer Program membership) or a [development build](https://docs.expo.dev/develop/development-builds/introduction/).
- **Web**: open http://localhost:8081 while the server is running. Drag & drop reordering works on iOS and Android only.

### Scripts

| Command | Description |
| --- | --- |
| `npm start` | Start the Expo dev server |
| `npm run android` / `npm run ios` / `npm run web` | Start the dev server and open the app on that platform |
| `npm test` | Run the unit tests |
| `npm run typecheck` | Type-check the project with TypeScript |
| `npm run build:apk` | Build a release APK locally into `dist/` (see below) |

## 📦 Build a release APK (local, no Expo account)

With [Android Studio](https://developer.android.com/studio) installed (it provides Java 17 and the Android SDK), one command is enough:

```bash
npm run build:apk
```

The APK is copied to `dist/tally-scorekeeper-<version>.apk`, ready to be installed on a phone. The first build downloads the required Android SDK, build tools and NDK, so it takes a while.

- [`scripts/build-apk.sh`](scripts/build-apk.sh) uses `JAVA_HOME` and `ANDROID_HOME` when set, otherwise the ones from a standard Android Studio install. It generates the `android/` folder with `expo prebuild` (the folder is not committed) and runs Gradle.
- To keep the app small (about 30 MB instead of about 90 MB), `expo-build-properties` in [`app.json`](app.json) builds only for `arm64-v8a`, which covers 64-bit phones, and enables R8 and resource shrinking. To also support old 32-bit phones, add `"armeabi-v7a"` to `buildArchs`.
- Before each new release, increase `expo.android.versionCode` (and usually `expo.version`) in `app.json`: Android only installs an update over an existing app when its version code is higher.

### Signing

By default the release APK is signed with the shared debug key of the Expo template, which is fine for installing it on your own devices. To publish the app, sign it with your own key: create a keystore outside the repository and keep a backup,

```bash
mkdir -p ~/keystores && keytool -genkeypair -v -storetype PKCS12 -keystore ~/keystores/tally-scorekeeper.keystore -alias tally-scorekeeper -keyalg RSA -keysize 2048 -validity 10000
```

then add these lines to `~/.gradle/gradle.properties` (with a PKCS12 keystore the key password is the keystore password):

```properties
TALLY_UPLOAD_STORE_FILE=~/keystores/tally-scorekeeper.keystore
TALLY_UPLOAD_STORE_PASSWORD=<keystore password>
TALLY_UPLOAD_KEY_ALIAS=tally-scorekeeper
TALLY_UPLOAD_KEY_PASSWORD=<keystore password>
```

[`plugins/withReleaseSigning.js`](plugins/withReleaseSigning.js) picks them up automatically. Android only updates an app signed with the same key, so switching key requires uninstalling the app first (its saved data is lost).

## 🗂️ Project structure

```text
src/
├── app/          # Expo Router screens: scoreboard, players, history
├── components/   # UI components (score card, color picker, sheets, …)
├── hooks/        # Reusable hooks (hold-to-repeat, score delta badge)
├── state/        # Game reducer, ranking, history, persistence and contexts
├── utils/        # Colors, formatting, storage, haptics, dialogs
└── theme.tsx     # Light/dark themes and theme toggle
```

The game logic lives in pure functions (`src/state/gameReducer.ts`, `ranking.ts`, `history.ts`) covered by the tests in the `__tests__` folders.

## 📄 License

[MIT](LICENSE) © 2026 Nicolò Zandarin
