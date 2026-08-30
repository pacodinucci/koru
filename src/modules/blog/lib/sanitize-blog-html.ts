import sanitizeHtml from "sanitize-html";

const allowedTags = [
  "p",
  "br",
  "strong",
  "em",
  "s",
  "u",
  "a",
  "ul",
  "ol",
  "li",
  "blockquote",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "img",
  "div",
  "span",
  "figure",
  "figcaption",
];

export function sanitizeBlogHtml(value: string) {
  return sanitizeHtml(value, {
    allowedTags,
    allowedAttributes: {
      "*": ["class", "data-*"],
      a: ["href", "target", "rel", "title"],
      img: [
        "src",
        "alt",
        "title",
        "width",
        "height",
        "loading",
        "decoding",
        "style",
      ],
    },
    allowedStyles: {
      img: {
        "object-position": [/^\d{1,3}%\s+\d{1,3}%$/],
      },
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: {
      img: ["http", "https"],
    },
    allowProtocolRelative: false,
  });
}