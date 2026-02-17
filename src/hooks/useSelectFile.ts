import { FileService } from "@backend";
import { useNavigate } from "@solidjs/router";
import { routePaths } from "@/routes";
import { useToast } from "./useToast";

export const useSelectFile = () => {
  const navigate = useNavigate();
  const toast = useToast();

  return async () => {
    try {
      const filePath = await FileService.OpenFileDialog();
      if (filePath) {
        navigate(
          `${routePaths.dashboard}?file=${encodeURIComponent(filePath)}`,
        );
      }
    } catch (error) {
      console.error("Failed to open file dialog:", error);
      toast.error("Failed to open file dialog");
    }
  };
};
