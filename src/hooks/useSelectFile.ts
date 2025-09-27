import { useNavigate } from "@solidjs/router";
import { routePaths } from "@/routes";

export const useSelectFile = () => {
  const navigate = useNavigate();

  return async () => {
    try {
      const filePath = await window.electronAPI.openFileDialog();
      if (filePath) {
        navigate(`${routePaths.dashboard}?file=${encodeURIComponent(filePath)}`);
      }
    } catch (_error) {
      // TODO: Add toast
      console.log("Error opening file dialog", _error);
    }
  };
};
