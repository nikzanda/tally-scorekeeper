const { withAppBuildGradle } = require('expo/config-plugins');

/**
 * Signs Android release builds with your own upload keystore when these Gradle properties are set
 * (usually in ~/.gradle/gradle.properties, outside the repository):
 *   TALLY_UPLOAD_STORE_FILE, TALLY_UPLOAD_STORE_PASSWORD,
 *   TALLY_UPLOAD_KEY_ALIAS, TALLY_UPLOAD_KEY_PASSWORD
 *
 * Without them the release build is signed with the template's shared debug key and Gradle prints
 * a warning: fine for installing the APK on your own phone, not for publishing it.
 */
const MARKER = '// tally-scorekeeper: release signing';

const RELEASE_SIGNING_CONFIG = `
        ${MARKER}
        release {
            def storeFilePath = findProperty('TALLY_UPLOAD_STORE_FILE')
            if (storeFilePath) {
                storeFile file(storeFilePath.replaceFirst('^~', System.getProperty('user.home')))
                storePassword findProperty('TALLY_UPLOAD_STORE_PASSWORD')
                keyAlias findProperty('TALLY_UPLOAD_KEY_ALIAS')
                keyPassword findProperty('TALLY_UPLOAD_KEY_PASSWORD')
            }
        }`;

const RELEASE_SIGNING_SELECTION =
  "signingConfig findProperty('TALLY_UPLOAD_STORE_FILE') ? signingConfigs.release : signingConfigs.debug";

const DEBUG_KEY_WARNING = `
${MARKER}: warn when the release APK falls back to the debug key
gradle.taskGraph.whenReady { graph ->
    if (!findProperty('TALLY_UPLOAD_STORE_FILE') && graph.allTasks.any { it.name == 'packageRelease' }) {
        logger.warn('Tally Scorekeeper: TALLY_UPLOAD_* properties not set, signing the release APK with the shared debug key.')
    }
}
`;

const SIGNING_CONFIGS_BLOCK = /signingConfigs\s*\{/;
// The release build type of the template: no closing brace between "release {" and the line.
const RELEASE_DEBUG_SIGNING = /(release\s*\{[^}]*?)signingConfig signingConfigs\.debug/;

function applyReleaseSigning(buildGradle) {
  if (buildGradle.includes(MARKER)) return buildGradle;
  if (!SIGNING_CONFIGS_BLOCK.test(buildGradle) || !RELEASE_DEBUG_SIGNING.test(buildGradle)) {
    throw new Error(
      'withReleaseSigning: android/app/build.gradle no longer matches the expected template; ' +
        'update plugins/withReleaseSigning.js before building a release.',
    );
  }
  const signed = buildGradle
    .replace(RELEASE_DEBUG_SIGNING, `$1${RELEASE_SIGNING_SELECTION}`)
    .replace(SIGNING_CONFIGS_BLOCK, (match) => `${match}${RELEASE_SIGNING_CONFIG}`);
  return `${signed.trimEnd()}\n${DEBUG_KEY_WARNING}`;
}

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (modConfig) => {
    if (modConfig.modResults.language !== 'groovy') {
      throw new Error('withReleaseSigning: only Groovy build.gradle files are supported.');
    }
    modConfig.modResults.contents = applyReleaseSigning(modConfig.modResults.contents);
    return modConfig;
  });
};

module.exports.applyReleaseSigning = applyReleaseSigning;
