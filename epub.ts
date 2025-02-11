import { create } from 'zip';

import { Image } from "./util/html.ts";
import {
  validateAndNormalizeChapters,
  validateAndNormalizeOptions,
} from "./util/mod.ts";
import {
  fetchFileContent,
  renderTemplate,
  retryFetch,
  uuid,
} from "./util/other.ts";
import { buildBundle } from "./util/bundle.ts";
import { Content, NormChapter, NormOptions, Options } from "./util/validate.ts";

// import ejs from "https://esm.sh/ejs@3.1.8";
const encoder = new TextEncoder();

export class EPub {
  protected options: NormOptions;
  protected content: NormChapter[];
  protected uuid: string;
  protected images: Image[] = [];
  protected cover?: { extension: string; mediaType: string };

  protected log: typeof console.log;
  protected warn: typeof console.warn;
  protected files: Parameters<typeof create>[0] = [];

  constructor(options: Options, content: Content) {
    this.options = validateAndNormalizeOptions(options);
    switch (this.options.verbose) {
      case true:
        this.log = console.log.bind(console);
        this.warn = console.warn.bind(console);
        break;
      case false:
        this.log = this.warn = () => { };
        break;
      default:
        this.log = this.options.verbose.bind(null, "log");
        this.warn = this.options.verbose.bind(null, "warn");
        break;
    }
    this.uuid = uuid();
    this.content = validateAndNormalizeChapters.call(this, content);
    if (this.options.cover) {
      const mediaType = "image/jpeg";
      const extension = "jpg";

      if (mediaType && extension) {
        this.cover = { mediaType, extension };
      }
    }
  }

  async render() {
    this.log("Generating Template Files...");
    await this.generateTemplateFiles();
    this.log("Downloading fonts...");
    await this.downloadAllFonts();
    this.log("Downloading images...");
    await this.downloadAllImages();
    this.log("Making cover...");
    await this.makeCover();
    this.log("Finishing up...");
    return this;
  }

  async genEpub() {
    // if dev, generate bundle first
    if (Deno.env.get("DEV") == "1") {
      await buildBundle("./templates");
    }
    try {
      await this.render();
      const content = await create(this.files);
      this.log("Done");
      return content;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  protected async generateTemplateFiles() {
    const css = await fetchFileContent("template.css");

    this.files.push({
      name: "OEBPS/style.css",
      data: encoder.encode(css)
    });

    for (const chapter of this.content) {
      const rendered = await renderTemplate("chapter.xhtml.ejs", {
        lang: this.options.lang,
        prependChapterTitles: this.options.prependChapterTitles,
        ...chapter,
      });

      this.files.push({
        name: chapter.href,
        data: encoder.encode(rendered),
      });
    }

    this.files.push({
      name: 'META-INF/container.xml',
      data: encoder.encode(`<?xml version="1.0" encoding="UTF-8" ?>
            <container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
                <rootfiles>
                    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
                </rootfiles>
            </container>`.replaceAll(/\s+/g, " "))
    });

    const opt = {
      ...this.options,
      id: this.uuid,
      images: this.images,
      cover: this.cover,
      content: this.content,
    };

    // console.log("opt", opt);
    await renderTemplate("content.opf.ejs", opt).then((content) => {
      this.files.push({
        name: "OEBPS/content.opf",
        data: encoder.encode(content),
      });
    });
    await renderTemplate("toc.ncx.ejs", opt).then((toc) => {
      this.files.push({
        name: "OEBPS/toc.ncx",
        data: encoder.encode(toc),
      });
    });
    await renderTemplate("toc.xhtml.ejs", opt).then((toc) => {
      this.files.push({
        name: "OEBPS/toc.xhtml",
        data: encoder.encode(toc),
      });
    });
    if (this.cover) {
      await renderTemplate("cover.xhtml.ejs", {
        ...this.options,
        cover: this.cover,
      }).then(
        (cover) => {
          this.files.push({
            name: "OEBPS/cover.xhtml",
            data: encoder.encode(cover),
          });
        },
      );
    }
  }

  protected async downloadAllFonts() {
    if (!this.options.fonts.length) return this.log("No fonts to download");

    for (
      let i = 0;
      i < this.options.fonts.length;
      i += this.options.batchSize
    ) {
      const fontContents = await Promise.all(
        this.options.fonts.slice(i, i + this.options.batchSize).map((font) => {
          const d = retryFetch(
            font.url,
            this.options.fetchTimeout,
            this.options.retryTimes,
            this.log,
          )
            .then(
              (
                res,
              ) => (this.log(`Downloaded font ${font.url}`),
                { ...font, data: res }),
            );
          return this.options.ignoreFailedDownloads
            ? d.catch(
              (reason) => (this.warn(
                `Warning (font ${font.url}): Download failed`,
                reason,
              ),
                { ...font, data: "" }),
            )
            : d;
        }),
      );
      fontContents.forEach((font) => this.files.push({
        name: `OEBPS/fonts/${font.filename}`,
        data: typeof font.data == 'string' ? encoder.encode(font.data) : new Uint8Array(font.data),
      }));
    }
  }

  protected async downloadAllImages() {
    if (!this.images.length) return this.log("No images to download");

    for (let i = 0; i < this.images.length; i += this.options.batchSize) {
      const imageContents = await Promise.all(
        this.images.slice(i, i + this.options.batchSize).map((image) => {
          const d = retryFetch(
            image.url,
            this.options.fetchTimeout,
            this.options.retryTimes,
            this.log,
          )
            .then(
              (
                res,
              ) => (this.log(`Downloaded image ${image.url}`),
                { ...image, data: res }),
            );
          return this.options.ignoreFailedDownloads
            ? d.catch(
              (reason) => (this.warn(
                `Warning (image ${image.url}): Download failed`,
                reason,
              ),
                { ...image, data: "" }),
            )
            : d;
        }),
      );
      imageContents.forEach((image) =>
        this.files.push({
          name: `OEBPS/images/${image.id}.${image.extension}`,
          data: typeof image.data == 'string' ? encoder.encode(image.data) : new Uint8Array(image.data),
        })
      );
    }
  }

  protected async makeCover() {
    if (!this.cover) return this.log("No cover to download");
    const coverContent = await retryFetch(
      this.options.cover,
      this.options.fetchTimeout,
      this.options.retryTimes,
      this.log,
    )
      .catch(
        (reason) => (this.warn(
          `Warning (cover ${this.options.cover}): Download failed`,
          reason,
        ),
          ""),
      );

    this.files.push({
      name: `OEBPS/cover.${this.cover.extension}`,
      data: typeof coverContent == 'string' ? encoder.encode(coverContent) : new Uint8Array(coverContent),
    });
  }
}
