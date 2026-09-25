export type StockAlert = {
  id: string | number;
  name: string;
  stock: number;
};

function commonsFile(fileName: string, width: number) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=${width}`;
}

export const PRODUCT_PHOTOS = {
  Tomatoes: {
    main: commonsFile("A Box of Red Tomatoes at Yuen Long.jpg", 900),
    thumb: commonsFile("A Box of Red Tomatoes at Yuen Long.jpg", 160),
    gallery: [
      commonsFile("A Box of Red Tomatoes at Yuen Long.jpg", 900),
      commonsFile("A Truss of Tomatoes 3D.JPG", 900),
      commonsFile("Adaskako tomatea.jpg", 900),
    ],
  },
  "Morning Glory": {
    main: commonsFile("90 - CIMG0865.jpg", 900),
    thumb: commonsFile("90 - CIMG0865.jpg", 160),
    gallery: [
      commonsFile("90 - CIMG0865.jpg", 900),
      commonsFile("Harvested - Kangkong (3446711239).jpg", 900),
      commonsFile("Cambodian Village Water Spinach Beds.jpg", 900),
    ],
  },
  Spinach: {
    main: commonsFile("Spinach leaves.jpg", 900),
    thumb: commonsFile("Spinach leaves.jpg", 160),
    gallery: [
      commonsFile("Spinach leaves.jpg", 900),
      commonsFile("Spinach harvesting at the farm.jpg", 900),
      commonsFile("Spinach 4.jpg", 900),
    ],
  },
} as const;

export const PRODUCT_IMAGE_BY_NAME: Record<string, string> = {
  Tomatoes: PRODUCT_PHOTOS.Tomatoes.thumb,
  "Morning Glory": PRODUCT_PHOTOS["Morning Glory"].thumb,
  Spinach: PRODUCT_PHOTOS.Spinach.thumb,
};

export const DEFAULT_STOCK_ALERTS: StockAlert[] = [
  { id: "2", name: "Morning Glory", stock: 8 },
  { id: "3", name: "Spinach", stock: 0 },
];
