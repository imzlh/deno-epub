import ow from "ow";
import { Content, Options, optionsPredicate } from "./util/validate.ts";

import { EPub } from "./epub.ts";

/**
 * Generate an EPub file from the given options and content.
 * @example
 * ```ts
 * epub(options, [
 *   {
 *     title: "Chapter 1",
 *     content: "<p>Hello world!</p>",
 *   },
 * ]).then(
 *   (content) => {
 *     Deno.writeFileSync("book.epub", content);
 *   },
 *   (err) => console.error("Failed to generate Ebook because of ", err),
 * );
 * ```
 * @param optionsOrTitle The options or title of the EPub.
 * @param content The content of the EPub.
 * @param opts Additional options for the EPub generation.
 * @returns Buffer of the generated EPub file.
 */
export default function (
  optionsOrTitle: Options | string,
  content: Content,
  opts?: {
    verbose?: boolean;
    version?: number;
    noFormatHTML?: boolean;
  }
): Promise<Uint8Array> {
  const options = ow.isValid(optionsOrTitle, ow.string)
    ? { title: optionsOrTitle }
    : optionsOrTitle;
  opts?.verbose && (options.verbose = true);
  opts?.version && (options.version = opts.version);
  opts?.noFormatHTML && (options.noFormatHTML = true);

  return new EPub(options, content).genEpub();
};
