import { existsSync } from "node:fs";

export const validatePaths = (filePaths: string[]): [string[], string[]] => {
  return [
    filePaths.filter((path) => existsSync(path)),
    filePaths.filter((path) => !existsSync(path)),
  ];
};
