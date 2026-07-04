type StarterUnit = "units" | "kg" | "g";

type StarterProduct = {
  slug: string;
  name: string;
  stockQuantity: number;
  unit: StarterUnit;
  description: string;
  price: number;
  profilePicUrl: string;
};

export const STARTER_PRODUCTS: StarterProduct[] = [
  {
    slug: "starter-kh-morning-glory",
    name: "Morning Glory",
    stockQuantity: 35,
    unit: "kg",
    description: "Fresh water spinach commonly used in Cambodian stir-fries and soups.",
    price: 4000,
    profilePicUrl:
      "https://images.unsplash.com/photo-1637858868799-7f26a0640eb6?w=900&h=700&fit=crop",
  },
  {
    slug: "starter-kh-long-beans",
    name: "Yardlong Beans",
    stockQuantity: 28,
    unit: "kg",
    description: "Crunchy long beans for Khmer salads, soups, and stir-fries.",
    price: 6000,
    profilePicUrl:
      "https://images.unsplash.com/photo-1567375698348-5d9d5ae99de0?w=900&h=700&fit=crop",
  },
  {
    slug: "starter-kh-eggplant",
    name: "Thai Eggplant",
    stockQuantity: 24,
    unit: "kg",
    description: "Small green eggplants suited to Khmer curries and dipping dishes.",
    price: 5500,
    profilePicUrl:
      "https://images.unsplash.com/photo-1659261200833-ec8761558af7?w=900&h=700&fit=crop",
  },
  {
    slug: "starter-kh-cucumber",
    name: "Cucumber",
    stockQuantity: 40,
    unit: "kg",
    description: "Crisp local cucumbers for salads, pickles, and fresh side dishes.",
    price: 4500,
    profilePicUrl:
      "https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=900&h=700&fit=crop",
  },
  {
    slug: "starter-kh-bok-choy",
    name: "Bok Choy",
    stockQuantity: 20,
    unit: "kg",
    description: "Tender leafy greens for quick stir-fries and clear soups.",
    price: 7000,
    profilePicUrl:
      "https://images.unsplash.com/photo-1622205313162-be1d5712a43f?w=900&h=700&fit=crop",
  },
  {
    slug: "starter-kh-cabbage",
    name: "Green Cabbage",
    stockQuantity: 32,
    unit: "kg",
    description: "Firm green cabbage for soups, stir-fries, and Khmer pickles.",
    price: 5000,
    profilePicUrl:
      "https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=900&h=700&fit=crop",
  },
  {
    slug: "starter-kh-tomatoes",
    name: "Local Tomatoes",
    stockQuantity: 45,
    unit: "kg",
    description: "Ripe tomatoes for soups, sauces, salads, and everyday cooking.",
    price: 6500,
    profilePicUrl:
      "https://images.unsplash.com/photo-1506806732259-39c2d0268443?w=900&h=700&fit=crop",
  },
  {
    slug: "starter-kh-pumpkin",
    name: "Pumpkin",
    stockQuantity: 18,
    unit: "kg",
    description: "Sweet pumpkin for Khmer soups, curries, and desserts.",
    price: 5000,
    profilePicUrl:
      "https://images.unsplash.com/photo-1508747703725-719777637510?w=900&h=700&fit=crop",
  },
  {
    slug: "starter-kh-lemongrass",
    name: "Lemongrass",
    stockQuantity: 50,
    unit: "units",
    description: "Fragrant fresh stalks used in kroeung, soups, and marinades.",
    price: 1000,
    profilePicUrl:
      "https://images.unsplash.com/photo-1596547609652-9cf5d8d76921?w=900&h=700&fit=crop",
  },
  {
    slug: "starter-kh-winter-melon",
    name: "Winter Melon",
    stockQuantity: 16,
    unit: "kg",
    description: "Mild winter melon for light Cambodian soups and stews.",
    price: 4500,
    profilePicUrl:
      "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=900&h=700&fit=crop",
  },
];

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function buildStarterProductRows(merchantId: string, today = new Date()) {
  const expires = new Date(today);
  expires.setUTCDate(expires.getUTCDate() + 7);

  return STARTER_PRODUCTS.map((product) => ({
    merchant_id: merchantId,
    slug: `${product.slug}-${merchantId}`,
    name: product.name,
    stock_quantity: product.stockQuantity,
    unit: product.unit,
    description: product.description,
    harvest_date: toIsoDate(today),
    expire_date: toIsoDate(expires),
    profile_pic_url: product.profilePicUrl,
    background_pic_urls: [product.profilePicUrl],
    is_active: true,
    price: product.price,
  }));
}
