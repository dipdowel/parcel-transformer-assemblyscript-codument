export type ProjectPath = string;
export type InternalGlob = ProjectPath;
export type InternalFileInvalidation = {
  filePath: ProjectPath;
};

export type InternalGlobInvalidation = {
  glob: InternalGlob;
};

export type InternalFileAboveInvalidation = {
  fileName: string;
  aboveFilePath: ProjectPath;
};

export type InternalFileCreateInvalidation =
  | InternalFileInvalidation
  | InternalGlobInvalidation
  | InternalFileAboveInvalidation;

export type ConfigRequest = {
  id: string;
  invalidateOnFileChange: Set<ProjectPath>;
  invalidateOnFileCreate: Array<InternalFileCreateInvalidation>;
  invalidateOnEnvChange: Set<string>;
  invalidateOnOptionChange: Set<string>;
  invalidateOnStartup: boolean;
  invalidateOnBuild: boolean;
};
