import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach, vi } from "vitest";
import { registerGlobalMocks } from "./mocks";

beforeAll(() => {});

beforeEach(() => {
  registerGlobalMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  cleanup();
});

afterAll(() => {});
