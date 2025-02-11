export { normalize as removeDiacritics } from "path";

export * from "./fetchable.ts";
import * as dejs from "jsr:@hongminhee/dejs";
import fetchable from "./fetchable.ts";
import assets from "../assets.json" with { type: "json" };

export const encoder = new TextEncoder();

export const uuid = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
    .replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      return (c === "x" ? r : r & 0x3 | 0x8).toString(16);
    });

export const retryFetch = async (
  url: string,
  timeout: number,
  retry: number,
  log: typeof console.log,
) => {
  for (let i = 0; i < retry - 1; i++) {
    try {
      return await fetchable(url, timeout);
    } catch {
      log(
        `Failed to fetch \`${url}\` ${i + 1} ${i === 0 ? "time" : "times"
        }. Retrying...`,
      );
    }
  }
  // last try, no catching
  return fetchable(url, timeout);
};
export function fetchFileContent(file: string): Promise<string> {
  // todo read user custom templates
  return Promise.resolve(
    (assets as Record<string, string>)[file],
  );
}

export const renderTemplate = (
  fileName: string,
  data: Record<string, unknown>,
) => {
  return new Promise<string>((resolve, reject) => {
    fetchFileContent(fileName).then((template) => {
      dejs.renderToString(template, data).then(
        (
          rendered,
        ) => {
          resolve(rendered);
        },
      ).catch((error) => {
        reject(error);
      });
    });
  });
};
