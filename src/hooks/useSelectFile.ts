import { useNavigate } from "@solidjs/router";
import { routePaths } from "@/routes";
import { useToast } from "./useToast";

export const useSelectFile = () => {
  const navigate = useNavigate();
  const toast = useToast();

  return async () => {
    try {
      const filePath = await window.electronAPI.openFileDialog();
      if (filePath) {
        navigate(
          `${routePaths.dashboard}?file=${encodeURIComponent(filePath)}`,
        );
      }
    } catch (_error) {
      toast.error("Failed to open file dialog");
    }
  };
};
