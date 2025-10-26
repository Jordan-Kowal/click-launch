// ANSI color codes to CSS classes mapping
/** biome-ignore-all lint/suspicious/noControlCharactersInRegex: Authorized */
const ANSI_COLOR_MAP: Record<string, string> = {
  // Reset
  "0": "text-white",

  // Standard colors
  "30": "text-black",
  "31": "text-red-500",
  "32": "text-green-500",
  "33": "text-yellow-500",
  "34": "text-blue-500",
  "35": "text-purple-500",
  "36": "text-cyan-500",
  "37": "text-gray-300",

  // Bright colors
  "90": "text-gray-500",
  "91": "text-red-400",
  "92": "text-green-400",
  "93": "text-yellow-400",
  "94": "text-blue-400",
  "95": "text-purple-400",
  "96": "text-cyan-400",
  "97": "text-white",

  // Bold
  "1": "font-bold",

  // Dim
  "2": "opacity-75",

  // Underline
  "4": "underline",
};

export type AnsiSegment = {
  text: string;
  classes: string[];
};

export const isLiveUpdate = (text: string): boolean => {
  return /\x1b\[[0-9]*[ABCD]/.test(text) || /\x1b\[2K/.test(text);
};

export const parseAnsiToSegments = (text: string): AnsiSegment[] => {
  const segments: AnsiSegment[] = [];

  // First, remove cursor control sequences that don't apply to our log display
  const cleanedText = text
    .replace(/\x1b\[[0-9]*K/g, "") // Clear line sequences (0K, 1K, 2K)
    .replace(/\x1b\[[0-9]*G/g, "") // Move cursor to column sequences
    .replace(/\x1b\[[0-9]*;[0-9]*H/g, "") // Move cursor to position sequences
    .replace(/\x1b\[[0-9]*[ABCD]/g, "") // Move cursor up/down/left/right sequences
    .replace(/\x1b\[s/g, "") // Save cursor position
    .replace(/\x1b\[u/g, "") // Restore cursor position
    .replace(/\x1b\[2J/g, "") // Clear screen
    .replace(/\x1b\[\?25[lh]/g, ""); // Show/hide cursor

  const ansiRegex = /\x1b\[([0-9;]*)m/g;

  let lastIndex = 0;
  let currentClasses: string[] = [];
  let match: RegExpExecArray | null;

  // biome-ignore lint/suspicious/noAssignInExpressions: Supported
  while ((match = ansiRegex.exec(cleanedText)) !== null) {
    // Add text before the ANSI code
    if (match.index > lastIndex) {
      const textSegment = cleanedText.slice(lastIndex, match.index);
      if (textSegment) {
        segments.push({
          text: textSegment,
          classes: [...currentClasses],
        });
      }
    }

    // Process the ANSI code
    const codes = match[1].split(";").filter(Boolean);

    for (const code of codes) {
      if (code === "0" || code === "") {
        // Reset all formatting
        currentClasses = [];
      } else if (ANSI_COLOR_MAP[code]) {
        // Add new class, removing conflicting ones
        const newClass = ANSI_COLOR_MAP[code];

        // Remove existing text color classes if adding a new color
        if (newClass.startsWith("text-")) {
          currentClasses = currentClasses.filter(
            (cls) => !cls.startsWith("text-"),
          );
        }

        currentClasses.push(newClass);
      }
    }

    lastIndex = ansiRegex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < cleanedText.length) {
    const remainingText = cleanedText.slice(lastIndex);
    if (remainingText) {
      segments.push({
        text: remainingText,
        classes: [...currentClasses],
      });
    }
  }

  // If no ANSI codes were found, return the whole text as one segment
  if (segments.length === 0) {
    segments.push({
      text: cleanedText,
      classes: [],
    });
  }

  return segments;
};
