import ow from "ow";
import { Content, Options, optionsPredicate } from "./util/validate.ts";

import { EPub } from "./epub.ts";

const epub = (
  optionsOrTitle: Options | string,
  content: Content,
  ...args: (boolean | number)[]
): Promise<Uint8Array> => {
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
export default epub;
