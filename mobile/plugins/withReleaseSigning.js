// Signs release builds with the DesignStager upload key (from the GitHub secrets).
// Expo regenerates the android/ folder on each build, so this adds the signing setup every time.
const { withAppBuildGradle } = require('expo/config-plugins');

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let g = cfg.modResults.contents;
    if (g.includes('dsRelease')) return cfg;
    g = g.replace(
      /signingConfigs\s*\{/,
      `signingConfigs {
        dsRelease {
            if (System.getenv("KEYSTORE_FILE")) {
                storeFile file(System.getenv("KEYSTORE_FILE"))
                storePassword System.getenv("KEYSTORE_PASSWORD")
                keyAlias System.getenv("KEY_ALIAS")
                keyPassword System.getenv("KEY_PASSWORD")
            }
        }`
    );
    g = g.replace(
      /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig\s+signingConfigs\.debug/,
      `$1signingConfig System.getenv("KEYSTORE_FILE") ? signingConfigs.dsRelease : signingConfigs.debug`
    );
    cfg.modResults.contents = g;
    return cfg;
  });
};
