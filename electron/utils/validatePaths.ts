import { existsSync } from "node:fs";

/** Split the paths into 2 lists: valid and invalid */
export const validatePaths = (filePaths: string[]): [string[], string[]] => {
  return [
    filePaths.filter((path) => existsSync(path)),
    filePaths.filter((path) => !existsSync(path)),
  ];
};
