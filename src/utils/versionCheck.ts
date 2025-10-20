declare const __APP_VERSION__: string;

export const getCurrentVersion = (): string => __APP_VERSION__;

/**
 * Gets the latest version from GitHub releases
 * Returns null if failed to fetch
 */
export const getLatestVersion = async (): Promise<string | null> => {
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
    return release.tag_name.replace(/^v/, "");
  } catch (error) {
    console.error("Failed to check for updates:", error);
    return null;
  }
};
