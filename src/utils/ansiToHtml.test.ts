/** biome-ignore-all lint/suspicious/noControlCharactersInRegex: ANSI parsing requires control chars */

import { describe, expect, it } from "vitest";
import { isLiveUpdate, parseAnsiToSegments } from "./ansiToHtml";

const ESC = "\x1b";

describe("parseAnsiToSegments — cursor control stripping", () => {
  it("strips erase-in-line (K) with and without parameter", () => {
    expect(parseAnsiToSegments(`a${ESC}[Kb`)).toEqual([
      { text: "ab", classes: [] },
    ]);
    expect(parseAnsiToSegments(`a${ESC}[2Kb`)).toEqual([
      { text: "ab", classes: [] },
    ]);
  });

  it("strips cursor-horizontal-absolute (G)", () => {
    expect(parseAnsiToSegments(`a${ESC}[Gb`)).toEqual([
      { text: "ab", classes: [] },
    ]);
    expect(parseAnsiToSegments(`a${ESC}[10Gb`)).toEqual([
      { text: "ab", classes: [] },
    ]);
  });

  it("strips cursor-position (H) with row;col", () => {
    expect(parseAnsiToSegments(`a${ESC}[1;1Hb`)).toEqual([
      { text: "ab", classes: [] },
    ]);
    expect(parseAnsiToSegments(`a${ESC}[;Hb`)).toEqual([
      { text: "ab", classes: [] },
    ]);
  });

  it("strips cursor-up/down/forward/back (A/B/C/D)", () => {
    expect(
      parseAnsiToSegments(`a${ESC}[Ab${ESC}[2Bc${ESC}[Cd${ESC}[5De`),
    ).toEqual([{ text: "abcde", classes: [] }]);
  });

  it("strips save/restore cursor (s/u)", () => {
    expect(parseAnsiToSegments(`a${ESC}[sb${ESC}[uc`)).toEqual([
      { text: "abc", classes: [] },
    ]);
  });

  it("strips clear-screen (2J)", () => {
    expect(parseAnsiToSegments(`a${ESC}[2Jb`)).toEqual([
      { text: "ab", classes: [] },
    ]);
  });

  it("strips show/hide cursor (?25l, ?25h)", () => {
    expect(parseAnsiToSegments(`a${ESC}[?25lb${ESC}[?25hc`)).toEqual([
      { text: "abc", classes: [] },
    ]);
  });

  it("strips multiple back-to-back cursor sequences", () => {
    expect(
      parseAnsiToSegments(`${ESC}[K${ESC}[?25l${ESC}[2Jhello${ESC}[u`),
    ).toEqual([{ text: "hello", classes: [] }]);
  });
});

describe("parseAnsiToSegments — SGR (color/style) preservation", () => {
  it("applies foreground color", () => {
    expect(parseAnsiToSegments(`${ESC}[31mred${ESC}[0m`)).toEqual([
      { text: "red", classes: ["text-red-500"] },
    ]);
  });

  it("applies bright color", () => {
    expect(parseAnsiToSegments(`${ESC}[91mred${ESC}[0m`)).toEqual([
      { text: "red", classes: ["text-red-400"] },
    ]);
  });

  it("applies bold style", () => {
    expect(parseAnsiToSegments(`${ESC}[1mbold${ESC}[0m`)).toEqual([
      { text: "bold", classes: ["font-bold"] },
    ]);
  });

  it("combines color + style", () => {
    expect(parseAnsiToSegments(`${ESC}[1;31mboldred${ESC}[0m`)).toEqual([
      { text: "boldred", classes: ["font-bold", "text-red-500"] },
    ]);
  });

  it("replaces previous text- color when new color applied", () => {
    expect(
      parseAnsiToSegments(`${ESC}[31mred${ESC}[32mgreen${ESC}[0m`),
    ).toEqual([
      { text: "red", classes: ["text-red-500"] },
      { text: "green", classes: ["text-green-500"] },
    ]);
  });

  it("resets on \\x1b[0m", () => {
    expect(
      parseAnsiToSegments(`${ESC}[31mred${ESC}[0mplain${ESC}[32mgreen`),
    ).toEqual([
      { text: "red", classes: ["text-red-500"] },
      { text: "plain", classes: [] },
      { text: "green", classes: ["text-green-500"] },
    ]);
  });
});

describe("parseAnsiToSegments — mixed input", () => {
  it("strips cursor control while preserving SGR", () => {
    expect(
      parseAnsiToSegments(`${ESC}[K${ESC}[31merror${ESC}[0m${ESC}[?25l done`),
    ).toEqual([
      { text: "error", classes: ["text-red-500"] },
      { text: " done", classes: [] },
    ]);
  });

  it("returns single empty-classes segment for plain text", () => {
    expect(parseAnsiToSegments("plain log line")).toEqual([
      { text: "plain log line", classes: [] },
    ]);
  });

  it("returns single empty segment for empty string", () => {
    expect(parseAnsiToSegments("")).toEqual([{ text: "", classes: [] }]);
  });
});

describe("isLiveUpdate", () => {
  it("detects cursor-up sequences", () => {
    expect(isLiveUpdate(`${ESC}[Aredraw`)).toBe(true);
  });

  it("detects clear-line (2K)", () => {
    expect(isLiveUpdate(`${ESC}[2Kredraw`)).toBe(true);
  });

  it("ignores plain SGR colors", () => {
    expect(isLiveUpdate(`${ESC}[31mred${ESC}[0m`)).toBe(false);
  });

  it("returns false for plain text", () => {
    expect(isLiveUpdate("just a log line")).toBe(false);
  });
});
