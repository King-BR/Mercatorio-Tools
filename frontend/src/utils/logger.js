export const DEV = import.meta.env.DEV;
export const DEBUG =
  new URLSearchParams(window.location.search).get("debug") === "true";

const logger = {
  log: (...args) => {
    if (DEV || DEBUG) {
      console.log(...args);
    }
  },

  info: (...args) => {
    if (DEV || DEBUG) {
      console.info(...args);
    }
  },

  warn: (...args) => {
    if (DEV || DEBUG) {
      console.warn(...args);
    }
  },

  error: (...args) => {
    if (DEV || DEBUG) {
      console.error(...args);
    }
  },
};

export default logger;
