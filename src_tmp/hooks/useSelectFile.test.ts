import { describe, test } from "vitest";
import {
  navigateMock,
  openFileDialogMock,
  toastMock,
} from "@/tests/mocks/globals";
import { renderHook } from "@/tests/utils";
import { useSelectFile } from "./useSelectFile";

describe("useSelectFile", () => {
  test("should navigate to dashboard when file is selected", async ({
    expect,
  }) => {
    openFileDialogMock.mockResolvedValue("/path/to/file.yaml");

    const { result } = renderHook(() => useSelectFile());
    const selectFile = result.current;

    await selectFile();

    expect(openFileDialogMock).toHaveBeenCalledOnce();
    expect(navigateMock).toHaveBeenCalledWith(
      "/dashboard?file=%2Fpath%2Fto%2Ffile.yaml",
    );
  });

  test("should not navigate when file dialog is cancelled", async ({
    expect,
  }) => {
    openFileDialogMock.mockResolvedValue(null);

    const { result } = renderHook(() => useSelectFile());
    const selectFile = result.current;

    await selectFile();

    expect(openFileDialogMock).toHaveBeenCalledOnce();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  test("should handle error when file dialog fails", async ({ expect }) => {
    openFileDialogMock.mockRejectedValue(new Error("Dialog failed"));

    const { result } = renderHook(() => useSelectFile());
    const selectFile = result.current;

    await selectFile();

    expect(openFileDialogMock).toHaveBeenCalledOnce();
    expect(navigateMock).not.toHaveBeenCalled();
    expect(toastMock.error).toHaveBeenCalledWith("Error opening file dialog");
  });
});
