import toast from "solid-toast";
import { useSettingsContext } from "@/contexts/SettingsProvider";

/** Wraps solid-toast to respect the "showNotifications" setting. Use this instead of importing toast directly. */
export const useToast = () => {
  const { settings } = useSettingsContext();

  return {
    success: (message: string) => {
      if (settings().showNotifications) {
        toast.success(message);
      }
    },
    error: (message: string) => {
      if (settings().showNotifications) {
        toast.error(message);
      }
    },
  };
};
