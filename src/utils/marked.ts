import { marked } from "marked";
import highlightjs from "highlight.js";
import fetch from "node-fetch";

const renderer = new marked.Renderer();

renderer.link = (href, title, text) => {
  return `<a href="${href}" title="${title ?? "Link"}">${text}</a>`;
};

renderer.hr = () => {
  return '<div class="hr"></div>';
};

renderer.paragraph = (text) => {
  const lines = text.split("\n");

  const paragraphs = lines.map((line) => `<p>${line}</p>`);

  return paragraphs.join("");
};

const walkTokens = async (token: any) => {
  if (token.type === "link") {
    const { href, title, text } = token;

    if (!href) return;

    try {
      const res = await fetch(href, { method: "HEAD" });

      const contentType = res.headers.get("content-type");
      if (!contentType) throw "no image";

      const allowedContent = ["jpeg", "jpg", "png", "gif", "avif", "webp"];

      if (allowedContent.includes(contentType.split("image/")[1])) {
        const url = token.href;

        token.type = "image";
        token.attrs = [["src", url]];
        token.title = token.title || "Image";
      }
    } catch (err) {
      return;
    }
  }
};

marked.setOptions({
  highlight: (code, language) => {
    const validLanguage = highlightjs.getLanguage(language)
      ? language
      : "plaintext";
    return highlightjs.highlight(code, { language: validLanguage }).value;
  },
  renderer: renderer,
  gfm: true,
  breaks: false,
  pedantic: false,
  sanitize: false,
  smartLists: false,
  smartypants: false,
  headerIds: false,
});

marked.use({ walkTokens, async: true });
