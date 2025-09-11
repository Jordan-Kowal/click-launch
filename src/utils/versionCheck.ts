declare const __APP_VERSION__: string;

/**
 * Gets the latest version from GitHub releases
 * Returns null if failed or if already latest
 */
export const getLatestVersion = async (): Promise<string | null> => {
  const currentVersion = __APP_VERSION__;

  try {
    const response = await fetch(
      "https://api.github.com/repos/Jordan-Kowal/click-launch/releases/latest",
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`GitHub API responded with ${response.status}`);
    }

    const release = await response.json();
    const latestVersion = release.tag_name.replace(/^v/, "");

    return currentVersion !== latestVersion ? latestVersion : null;
  } catch (error) {
    console.error("Failed to check for updates:", error);
    return null;
  }
};
