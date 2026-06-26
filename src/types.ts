export interface Product {
  id: string;
  name: string;
  category: "poufs" | "cushions" | "stools" | "sofas" | "throws" | "rugs" | "chairs";
  price: number;
  description: string;
  image: string;
  dimensions: string;
  materials: string[];
  careInstructions: string;
  rating: number;
  reviewsCount: number;
  arAssetScale?: number; // scale adjustment for AR simulation
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface PlacementItem {
  id: string; // unique placement ID
  product: Product;
  x: number; // percentage width of container (0-100)
  y: number; // percentage height of container (0-100)
  scale: number; // scale multiplier (0.5 to 2.5)
  rotation: number; // in degrees (0-360)
  zIndex: number;
  isFlipped: boolean;
}

export interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  customerName: string;
  customerEmail: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  cardLastFour: string;
  paymentMethod: string;
  timestamp: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
}

export interface CountryRate {
  name: string;
  taxRate: number; // e.g. 8 for 8%
  shippingFee: number; // e.g. 25
  freeShippingThreshold: number; // e.g. 150
  currency: string; // e.g. USD
  currencySymbol: string; // e.g. $
}

export interface CouponCode {
  code: string;
  discountPercent: number;
  description: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  suggestedProducts?: string[]; // list of product IDs
}
