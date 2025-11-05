const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

module.exports = function withModularHeaders(config) {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, "Podfile");
      
      if (fs.existsSync(podfilePath)) {
        let podfileContent = fs.readFileSync(podfilePath, "utf8");
        
        // Add use_modular_headers! if it's not already present
        if (!podfileContent.includes("use_modular_headers!")) {
          // Try to add after use_react_native! call
          if (podfileContent.includes("use_react_native!")) {
            podfileContent = podfileContent.replace(
              /(use_react_native!\s*\([^)]*\))/,
              `$1\n  use_modular_headers!`
            );
          } 
          // If that didn't work, try adding after platform declaration
          else if (podfileContent.includes("platform :ios")) {
            podfileContent = podfileContent.replace(
              /(platform :ios, ['"]\d+\.\d+['"])/,
              `$1\n  use_modular_headers!`
            );
          }
          // Last resort: add at the beginning of the target block
          else {
            // Find the target block and add it there
            podfileContent = podfileContent.replace(
              /(target\s+['"][^'"]+['"]\s+do)/,
              `$1\n  use_modular_headers!`
            );
          }
          
          fs.writeFileSync(podfilePath, podfileContent, "utf8");
        }
      }
      
      return config;
    },
  ]);
};

