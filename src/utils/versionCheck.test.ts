import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentVersion, getLatestVersion } from "./versionCheck";

describe("getCurrentVersion", () => {
  it("returns the injected app version", () => {
    expect(getCurrentVersion()).toBe("test-version");
  });
});

describe("getLatestVersion", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("strips the leading 'v' from the tag name", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ tag_name: "v1.2.3" }),
    });
    expect(await getLatestVersion()).toBe("1.2.3");
  });

  it("returns the tag as-is when there is no leading 'v'", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ tag_name: "1.2.3" }),
    });
    expect(await getLatestVersion()).toBe("1.2.3");
  });

  it("returns null on non-OK responses", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockResolvedValue({ ok: false, status: 500 });
    expect(await getLatestVersion()).toBeNull();
    errorSpy.mockRestore();
  });

  it("returns null when fetch throws", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    fetchMock.mockRejectedValue(new Error("network down"));
    expect(await getLatestVersion()).toBeNull();
    errorSpy.mockRestore();
  });
});
