import { Check, Download } from "lucide-solid";
import { createSignal, onMount, Show } from "solid-js";
import { getCurrentVersion, getLatestVersion } from "@/utils/versionCheck";

export const VersionStatus = () => {
  const [latestVersion, setLatestVersion] = createSignal<string | null>(null);
  const [versionChecked, setVersionChecked] = createSignal(false);

  const isUpdateAvailable = () => {
    const latest = latestVersion();
    return latest !== null && latest !== getCurrentVersion();
  };

  const handleInstallUpdate = () => {
    const message = [
      `A new version (${latestVersion()}) is available.`,
      "The app will close, update, and reopen automatically.",
      "Do you want to proceed?",
    ].join("\n\n");
    const confirmed = confirm(message);
    if (confirmed) {
      window.electronAPI.installUpdate();
    }
  };

  onMount(() => {
    const checkUpdates = async () => {
      const latest = await getLatestVersion();
      setLatestVersion(latest);
      setVersionChecked(true);
    };
    checkUpdates();
  });

  return (
    <Show when={versionChecked()}>
      <div class="alert alert-soft max-w-150 mx-auto">
        <Show
          when={isUpdateAvailable()}
          fallback={
            <>
              <Check size={32} />
              <div class="text-left">
                <div class="font-semibold">Your version is up to date</div>
                <div class="text-sm">You have the latest version</div>
              </div>
              <button
                type="button"
                class="btn btn-sm btn-ghost"
                onClick={() => setVersionChecked(false)}
              >
                Dismiss
              </button>
            </>
          }
        >
          <Download size={32} />
          <div class="text-left">
            <div class="font-semibold">Update Available!</div>
            <div class="text-sm">
              Version {latestVersion()} is now available
            </div>
          </div>
          <div class="flex gap-2">
            <button
              type="button"
              class="btn btn-sm btn-primary"
              onClick={handleInstallUpdate}
            >
              Upgrade
            </button>
            <button
              type="button"
              class="btn btn-sm btn-ghost"
              onClick={() => setVersionChecked(false)}
            >
              Dismiss
            </button>
          </div>
        </Show>
      </div>
    </Show>
  );
};
