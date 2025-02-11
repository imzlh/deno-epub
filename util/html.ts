import { lookup, extensionsFromMimetype } from "jsr:@geacko/deno-mimetypes@^1.0.4";
import type { EPub } from "../epub.ts";
import { fixHTML } from "./html-parse.ts";
import { uuid } from "./other.ts";

export type CB = typeof imgSrc;

export type Image = {
  url: string;
  id: string;
  extension: string | null;
  mediaType: string | null;
};

function imgSrc(this: EPub, url: string) {
  let image = this.images.find((i) => i.url === url);

  if (!image) {
    const _m = extensionsFromMimetype(url.replace(/\?.*/, "")) || "",
      mediaType = typeof _m == 'string' ? _m : _m[0];

    image = {
      url,
      mediaType,
      id: uuid(),
      extension: lookup(mediaType)?.type || "",
    };

    this.images.push(image);
  }
  return `images/${image.id}.${image.extension}`;
}

export function normalizeHTML(this: EPub, index: number, data: string) {
  return fixHTML.call(this, index, data, imgSrc).replace(
    /^<body(?: xmlns="http:\/\/www\.w3\.org\/1999\/xhtml")?>|<\/body>$/g,
    "",
  );
}
