import { useNavigate } from "@solidjs/router";
import toast from "solid-toast";
import { routePaths } from "@/routes";

export const useSelectFile = () => {
  const navigate = useNavigate();

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
