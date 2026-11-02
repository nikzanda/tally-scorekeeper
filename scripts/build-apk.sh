#!/usr/bin/env bash
# Builds a release APK locally and copies it to dist/.
# Java and the Android SDK are taken from the environment, or from a standard Android Studio install.
# Pass --clean to regenerate the android/ folder from scratch (slower, drops the build cache).
set -euo pipefail

cd "$(dirname "$0")/.."

fail() {
  echo "error: $1" >&2
  exit 1
}

if [[ -z "${JAVA_HOME:-}" ]]; then
  for candidate in \
    "/Applications/Android Studio.app/Contents/jbr/Contents/Home" \
    "$HOME/Applications/Android Studio.app/Contents/jbr/Contents/Home" \
    "/opt/android-studio/jbr" \
    "$HOME/android-studio/jbr"; do
    if [[ -x "$candidate/bin/java" ]]; then
      export JAVA_HOME="$candidate"
      break
    fi
  done
fi
[[ -n "${JAVA_HOME:-}" && -x "$JAVA_HOME/bin/java" ]] ||
  fail "Java not found. Install Android Studio or set JAVA_HOME to a JDK 17."

if [[ -z "${ANDROID_HOME:-}" ]]; then
  for candidate in "${ANDROID_SDK_ROOT:-}" "$HOME/Library/Android/sdk" "$HOME/Android/Sdk"; do
    if [[ -n "$candidate" && -d "$candidate/platform-tools" ]]; then
      export ANDROID_HOME="$candidate"
      break
    fi
  done
fi
[[ -n "${ANDROID_HOME:-}" && -d "$ANDROID_HOME" ]] ||
  fail "Android SDK not found. Install it from Android Studio or set ANDROID_HOME."

echo "Java:        $JAVA_HOME"
echo "Android SDK: $ANDROID_HOME"

prebuild_args=(--platform android)
[[ "${1:-}" == "--clean" ]] && prebuild_args+=(--clean)
CI=1 npx expo prebuild "${prebuild_args[@]}"
(cd android && ./gradlew assembleRelease)

version="$(node -p "require('./app.json').expo.version")"
mkdir -p dist
output="dist/tally-scorekeeper-$version.apk"
cp android/app/build/outputs/apk/release/app-release.apk "$output"
echo
echo "APK ready: $output"
