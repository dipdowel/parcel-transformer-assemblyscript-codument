let isEnabled = false;

export const dbg: {
  setEnabled: (val: boolean) => void;
} & Pick<Console, "log" | "info" | "error" | "warn"> = {
  setEnabled(val: boolean): void {
    isEnabled = val;
  },
  log: (...args: any[]): void => {
    isEnabled && console.log(...args);
  },
  info: (...args: any[]): void => {
    isEnabled && console.info(...args);
  },
  error: (...args: any[]): void => {
    isEnabled && console.error(...args);
  },
  warn: (...args: any[]): void => {
    isEnabled && console.warn(...args);
  },
};
