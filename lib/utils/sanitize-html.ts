// Pure-JS HTML sanitizer. We previously used `isomorphic-dompurify`, but it
// pulls in `jsdom` on the server — and jsdom's current dependency chain
// (`html-encoding-sniffer` -> `@exodus/bytes`) has a CJS/ESM break that
// crashes the Vercel serverless runtime. `sanitize-html` is pure JavaScript
// with no DOM dependency, so it works identically on Node and on the edge.
import sanitizeHtmlLib, { type IOptions } from 'sanitize-html';

// Whitelist tuned for the TipTap-authored product descriptions. Allows the
// formatting the rich-text editor can produce (headings, lists, links,
// images, code blocks) and nothing else.
const options: IOptions = {
  allowedTags: [
    ...sanitizeHtmlLib.defaults.allowedTags,
    'img',
    'h1',
    'h2',
    'figure',
    'figcaption',
    'span',
  ],
  allowedAttributes: {
    ...sanitizeHtmlLib.defaults.allowedAttributes,
    a: ['href', 'name', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    span: ['class', 'style'],
    '*': ['class'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['http', 'https', 'data'] },
  // Force every <a> to be safe even when an author forgets to set rel.
  transformTags: {
    a: sanitizeHtmlLib.simpleTransform('a', { rel: 'noopener noreferrer' }, true),
  },
};

export function sanitizeHtml(html: string): string {
  return sanitizeHtmlLib(html, options);
}
