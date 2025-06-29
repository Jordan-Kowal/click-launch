import "@testing-library/jest-dom/vitest";
import { HttpResponse } from "msw";
import { afterAll, afterEach, beforeAll, beforeEach, vi } from "vitest";
import { registerGlobalMocks } from "./mocks";

beforeAll(() => {});

beforeEach(() => {
  registerGlobalMocks();
  vi.spyOn(HttpResponse, "json");
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

afterAll(() => {});
