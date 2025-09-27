import { useCallback } from "react";
import { toast } from "react-toastify";
import { useLocation } from "wouter";
import { navigationPaths } from "@/router";

export const useSelectFile = () => {
  const [, navigate] = useLocation();

  return useCallback(async () => {
    try {
      const filePath = await window.electronAPI.openFileDialog();
      if (filePath) {
        navigate(
          `${navigationPaths.dashboard}?file=${encodeURIComponent(filePath)}`,
        );
      }
    } catch (_error) {
      toast.error("Error opening file dialog");
    }
  }, [navigate]);
};
