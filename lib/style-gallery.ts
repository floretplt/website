/**
 * Home page mood board. Files live in `public/gallery/`.
 *
 * If any gallery shot renders black after optimization, re-export from the
 * original (Display P3 JPEGs can break): e.g.
 *   sips -Z 1600 your.jpg --out public/gallery/your.jpg
 */
export type StyleGalleryItem = {
  src: string;
};

const GALLERY_FILES = [
  "IMG_1132.JPG",
  "IMG_2409.JPG",
  "IMG_2429.JPG",
  "IMG_2486.JPG",
  "IMG_2514.JPG",
  "IMG_5737.JPG",
  "IMG_5747.jpg",
  "IMG_5803.JPG",
  "IMG_7377.JPG",
  "IMG_8809.JPG",
  "IMG_9054.JPG",
  "IMG_9351.JPG",
  "telegram-cloud-document-2-5409299580309250816.jpg",
] as const;

export const STYLE_GALLERY_ITEMS: StyleGalleryItem[] = GALLERY_FILES.map(
  (name) => ({ src: `/gallery/${name}` }),
);
