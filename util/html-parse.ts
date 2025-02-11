import { DOMParser } from "jsr:@b-fuze/deno-dom@^0.1.49";

import type { EPub } from "../epub.ts";
import { allowedAttributes } from "./constants.ts";
import type { CB } from "./html.ts";

export function fixHTML(this: EPub, index: number, html: string, imgCB: CB) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const body = doc.querySelector("body");
  const document = body ?? doc;

  // reverse to make sure we transform innermost first
  for (const element of document.querySelectorAll('*')) {
    for (const name of Object.keys(element.attributes)) {
      if (
        allowedAttributes.indexOf(name as typeof allowedAttributes[number]) ===
        -1
      ) {
        this.warn(
          `Warning (content[${index}]): attribute ${name} isn't allowed.`,
        );
        element.removeAttribute(name);
      }
    }
  }

  // record images and change where they point
  for (const element of document.querySelectorAll("img")) {
    // @ts-ignore
    element.attributes.alt ||= "image-placeholder";
    if (!element.hasAttribute("src")) {
      element.remove();
    } else {
      element.setAttribute("src", imgCB.call(this, element.getAttribute("src")!));
    }
  }

  return body?.innerHTML ?? String(document);
}
