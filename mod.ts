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
 * @param args Additional arguments for the EPub generation.
 * @returns Buffer of the generated EPub file.
 */
export default function (
  optionsOrTitle: Options | string,
  content: Content,
  ...args: (boolean | number)[]
): Promise<Uint8Array> {
  ow(optionsOrTitle, ow.any(optionsPredicate, ow.string));
  const options = ow.isValid(optionsOrTitle, ow.string)
    ? { title: optionsOrTitle }
    : optionsOrTitle;
  ow(args, ow.array.ofType(ow.any(ow.boolean, ow.number)));
  args.forEach((arg) => {
    if (ow.isValid(arg, ow.boolean)) options.verbose = arg;
    else options.version = arg;
  });

  return new EPub(options, content).genEpub();
};
