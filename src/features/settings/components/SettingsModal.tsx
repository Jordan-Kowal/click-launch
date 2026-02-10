import { Moon, Sun, X } from "lucide-solid";
import { Show } from "solid-js";
import { useSettingsContext } from "@/contexts";
import {
  MAX_LOG_BUFFER_SIZE,
  MIN_LOG_BUFFER_SIZE,
  type Settings,
} from "@/contexts/SettingsContext";
import { useToast } from "@/hooks/useToast";
import { SettingsRow } from "./SettingsRow";
import { SettingsSection } from "./SettingsSection";

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const SettingsModal = (props: SettingsModalProps) => {
  const { settings, updateSetting, resetSettings } = useSettingsContext();
  const toaster = useToast();

  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === e.currentTarget) {
      props.onClose();
    }
  };

  const handleLogBufferChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const value = Number.parseInt(target.value, 10);
    if (!Number.isNaN(value)) {
      updateSetting("logBufferSize", value);
    }
  };

  const handleThemeToggle = () => {
    updateSetting("theme", settings().theme === "nord" ? "dracula" : "nord");
  };

  const handleToggle = (key: keyof Settings) => (e: Event) => {
    const target = e.target as HTMLInputElement;
    updateSetting(key, target.checked as Settings[typeof key]);
  };

  const handleNotificationToggle = (e: Event) => {
    const target = e.target as HTMLInputElement;
    updateSetting("showNotifications", target.checked);
    if (target.checked) {
      toaster.success("Notifications enabled");
    }
  };

  return (
    <Show when={props.isOpen}>
      <div
        class="modal modal-open modal-middle"
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        onClick={handleBackdropClick}
      >
        <div class="modal-box max-w-lg overflow-x-hidden">
          <button
            type="button"
            class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            onClick={props.onClose}
          >
            <X size={16} />
          </button>
          <h3 class="font-bold text-lg mt-0!">Settings</h3>

          <div class="space-y-6 pt-4">
            <SettingsSection title="Appearance">
              <SettingsRow
                label="Theme"
                tooltip="Switch between light and dark mode"
              >
                <label class="toggle toggle-sm text-base-content">
                  <input
                    type="checkbox"
                    checked={settings().theme === "dracula"}
                    onChange={handleThemeToggle}
                  />
                  <Sun size={14} />
                  <Moon size={14} />
                </label>
              </SettingsRow>
            </SettingsSection>

            <SettingsSection title="Display">
              <SettingsRow
                label="Show grouping"
                tooltip="Display/hide group sections based on your configuration file"
              >
                <input
                  type="checkbox"
                  class="toggle toggle-sm toggle-primary"
                  checked={settings().showGrouping}
                  onChange={handleToggle("showGrouping")}
                />
              </SettingsRow>
              <SettingsRow
                label="Show resource monitor"
                tooltip="Show/hide the resource column in the main table"
              >
                <input
                  type="checkbox"
                  class="toggle toggle-sm toggle-primary"
                  checked={settings().showResourceMonitor}
                  onChange={handleToggle("showResourceMonitor")}
                />
              </SettingsRow>
              <SettingsRow
                label="Show notifications"
                tooltip="Enable/disable the notification toasts"
              >
                <input
                  type="checkbox"
                  class="toggle toggle-sm toggle-primary"
                  checked={settings().showNotifications}
                  onChange={handleNotificationToggle}
                />
              </SettingsRow>
            </SettingsSection>

            <SettingsSection title="Logs">
              <SettingsRow
                label="Log buffer size"
                tooltip={`How many logs are kept in memory (from ${MIN_LOG_BUFFER_SIZE.toLocaleString()} to ${MAX_LOG_BUFFER_SIZE.toLocaleString()})`}
              >
                <input
                  type="number"
                  class="input input-sm input-bordered w-28 text-right"
                  value={settings().logBufferSize}
                  min={MIN_LOG_BUFFER_SIZE}
                  max={MAX_LOG_BUFFER_SIZE}
                  onInput={handleLogBufferChange}
                />
              </SettingsRow>
            </SettingsSection>
          </div>

          <div class="mt-6 flex justify-end">
            <button
              type="button"
              class="btn btn-sm btn-ghost text-error"
              onClick={resetSettings}
            >
              Reset to defaults
            </button>
          </div>
        </div>
        <button
          type="button"
          class="modal-backdrop"
          onClick={props.onClose}
          aria-label="Close settings"
        />
      </div>
    </Show>
  );
};
