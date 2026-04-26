import { AppService } from "@backend";
import { AlertCircle, Check, Download } from "lucide-solid";
import { createSignal, Match, Switch } from "solid-js";
import { useVersionContext } from "@/contexts";
import { getCurrentVersion } from "@/utils/versionCheck";

export const VersionStatus = () => {
  const { latestVersion, checkFailed, checked, isUpdateAvailable } =
    useVersionContext();
  const [dismissed, setDismissed] = createSignal(false);

  return (
    <Switch>
      <Match when={!checked()}>
        <div class="alert alert-soft max-w-150 mx-auto">
          <span class="loading loading-spinner loading-sm" />
          <div class="text-left">
            <div class="font-semibold">Checking for updates...</div>
          </div>
        </div>
      </Match>
      <Match when={checkFailed() && !dismissed()}>
        <div class="alert alert-soft max-w-150 mx-auto">
          <AlertCircle size={32} />
          <div class="text-left">
            <div class="font-semibold">Update check failed</div>
            <div class="text-sm">v{getCurrentVersion()} (current)</div>
          </div>
          <button
            type="button"
            class="btn btn-sm btn-ghost"
            onClick={() => setDismissed(true)}
          >
            Dismiss
          </button>
        </div>
      </Match>
      <Match when={isUpdateAvailable() && !dismissed()}>
        <div class="alert alert-soft max-w-150 mx-auto">
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
              onClick={() => AppService.InstallUpdate(latestVersion()!)}
            >
              Upgrade
            </button>
            <button
              type="button"
              class="btn btn-sm btn-ghost"
              onClick={() => setDismissed(true)}
            >
              Dismiss
            </button>
          </div>
        </div>
      </Match>
      <Match when={checked() && !dismissed()}>
        <div class="alert alert-soft max-w-150 mx-auto">
          <Check size={32} />
          <div class="text-left">
            <div class="font-semibold">Your version is up to date</div>
            <div class="text-sm">You have the latest version</div>
          </div>
          <button
            type="button"
            class="btn btn-sm btn-ghost"
            onClick={() => setDismissed(true)}
          >
            Dismiss
          </button>
        </div>
      </Match>
    </Switch>
  );
};
