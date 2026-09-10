const debugEnabled =
  import.meta.env.DEV ||
  new URLSearchParams(window.location.search).get("debug") === "true";

const logger = {
  log: (...args) => {
    if (debugEnabled) {
      console.log(...args);
    }
  },

  info: (...args) => {
    if (debugEnabled) {
      console.info(...args);
    }
  },

  warn: (...args) => {
    if (debugEnabled) {
      console.warn(...args);
    }
  },

  error: (...args) => {
    if (debugEnabled) {
      console.error(...args);
    }
  },
};

export default logger;
