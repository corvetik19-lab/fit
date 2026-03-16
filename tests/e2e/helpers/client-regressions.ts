import { expect, type ConsoleMessage, type Page } from "@playwright/test";

type CapturedRegression = {
  source: "console" | "pageerror";
  text: string;
};

const regressionPatterns = [
  /hydration failed/iu,
  /didn't match the client/iu,
  /maximum update depth exceeded/iu,
  /recoverable error/iu,
  /minified react error/iu,
  /cannot update a component while rendering a different component/iu,
];

function normalizeConsoleMessage(message: ConsoleMessage) {
  return message.text().trim();
}

function isRegressionMessage(text: string) {
  return regressionPatterns.some((pattern) => pattern.test(text));
}

export function startClientRegressionCapture(page: Page) {
  const captured: CapturedRegression[] = [];

  const handleConsole = (message: ConsoleMessage) => {
    if (!["error", "warning"].includes(message.type())) {
      return;
    }

    const text = normalizeConsoleMessage(message);

    if (isRegressionMessage(text)) {
      captured.push({
        source: "console",
        text,
      });
    }
  };

  const handlePageError = (error: Error) => {
    const text = error.message.trim();

    if (isRegressionMessage(text)) {
      captured.push({
        source: "pageerror",
        text,
      });
    }
  };

  page.on("console", handleConsole);
  page.on("pageerror", handlePageError);

  return {
    assertNone() {
      expect(
        captured,
        captured
          .map((entry, index) => `${index + 1}. [${entry.source}] ${entry.text}`)
          .join("\n"),
      ).toEqual([]);
    },
    stop() {
      page.off("console", handleConsole);
      page.off("pageerror", handlePageError);
    },
  };
}
