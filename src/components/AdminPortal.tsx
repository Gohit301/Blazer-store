import React, { useState, useEffect } from "react";
import { Product, CountryRate, CouponCode, Order } from "../types";
import { 
  LayoutDashboard, 
  Tag, 
  Globe2, 
  Ticket, 
  ShoppingBag, 
  LogOut, 
  Trash2, 
  Edit3, 
  Plus, 
  Lock, 
  Unlock, 
  TrendingUp, 
  Coins, 
  Users, 
  CheckCircle, 
  X, 
  ArrowLeft, 
  Sparkles, 
  PlusCircle, 
  Image as ImageIcon, 
  Eye, 
  ChevronRight,
  RefreshCw,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AdminPortalProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  countries: CountryRate[];
  setCountries: React.Dispatch<React.SetStateAction<CountryRate[]>>;
  coupons: CouponCode[];
  setCoupons: React.Dispatch<React.SetStateAction<CouponCode[]>>;
  onClose: () => void;
}

export default function AdminPortal({
  products,
  setProducts,
  countries,
  setCountries,
  coupons,
  setCoupons,
  onClose
}: AdminPortalProps) {
  // Authentication State
  const [passcode, setPasscode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("loom_layer_admin_auth") === "true";
  });
  const [showPasscode, setShowPasscode] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Navigation State
  const [activeTab, setActiveTab] = useState<"dashboard" | "catalog" | "regions" | "coupons" | "orders">("dashboard");

  // Orders State (loaded from localStorage)
  const [orders, setOrders] = useState<Order[]>([]);

  // Form Editing States
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCountry, setEditingCountry] = useState<CountryRate | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<CouponCode | null>(null);

  // File Upload State & Drag Event Handler
  const [isDragging, setIsDragging] = useState(false);
  const handleFileChange = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (PNG, JPEG, WEBP, etc.).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === "string") {
        setProdForm(prev => ({ ...prev, image: e.target.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Create Form States - Products
  const [prodForm, setProdForm] = useState({
    id: "",
    name: "",
    category: "poufs" as Product["category"],
    price: 99,
    description: "",
    image: "",
    dimensions: "50cm x 50cm x 40cm",
    materials: "100% Cotton, Premium EPS Beads",
    careInstructions: "Spot clean only.",
    rating: 5.0,
    reviewsCount: 1,
    arAssetScale: 1.0
  });

  // Create Form States - Countries
  const [countryForm, setCountryForm] = useState({
    name: "",
    taxRate: 10,
    shippingFee: 25,
    freeShippingThreshold: 150,
    currency: "USD",
    currencySymbol: "$"
  });

  // Create Form States - Coupons
  const [couponForm, setCouponForm] = useState({
    code: "",
    discountPercent: 15,
    description: "Special seasonal discount!"
  });

  // Load orders and initial custom setups
  useEffect(() => {
    const loadOrders = () => {
      const storedOrders = localStorage.getItem("loom_layer_orders_history");
      if (storedOrders) {
        try {
          setOrders(JSON.parse(storedOrders));
        } catch (e) {
          console.error("Failed to parse orders", e);
        }
      }
    };
    loadOrders();
    // Watch for localStorage updates (if simulated checkouts occur)
    window.addEventListener("storage", loadOrders);
    return () => window.removeEventListener("storage", loadOrders);
  }, []);

  // Handle Login Submission
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === "admin123" || passcode === "admin") {
      setIsAuthenticated(true);
      setLoginError(null);
      localStorage.setItem("loom_layer_admin_auth", "true");
    } else {
      setLoginError("Invalid Admin Passcode. Please check key and try again.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("loom_layer_admin_auth");
  };

  // --- PRODUCT CRUD OPERATIONS ---
  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const materialsArray = prodForm.materials.split(",").map(m => m.trim()).filter(Boolean);

    if (editingProduct) {
      // Edit existing
      const updated = products.map(p => {
        if (p.id === editingProduct.id) {
          return {
            ...p,
            name: prodForm.name,
            category: prodForm.category,
            price: Number(prodForm.price),
            description: prodForm.description,
            image: prodForm.image || "https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=600&q=80",
            dimensions: prodForm.dimensions,
            materials: materialsArray,
            careInstructions: prodForm.careInstructions,
            arAssetScale: Number(prodForm.arAssetScale)
          };
        }
        return p;
      });
      setProducts(updated);
      localStorage.setItem("loom_layer_custom_products", JSON.stringify(updated));
      setEditingProduct(null);
    } else {
      // Add new
      const newId = prodForm.id.trim() || `sg-${Date.now().toString().slice(-3)}`;
      // Check for unique ID
      if (products.some(p => p.id === newId)) {
        alert("A product with this unique SKU / ID already exists.");
        return;
      }

      const newProduct: Product = {
        id: newId,
        name: prodForm.name,
        category: prodForm.category,
        price: Number(prodForm.price),
        description: prodForm.description,
        image: prodForm.image || "https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=600&q=80",
        dimensions: prodForm.dimensions,
        materials: materialsArray,
        careInstructions: prodForm.careInstructions,
        rating: 5.0,
        reviewsCount: Math.floor(Math.random() * 12) + 1,
        arAssetScale: Number(prodForm.arAssetScale)
      };

      const updated = [newProduct, ...products];
      setProducts(updated);
      localStorage.setItem("loom_layer_custom_products", JSON.stringify(updated));
    }

    // Reset Form
    setProdForm({
      id: "",
      name: "",
      category: "poufs",
      price: 99,
      description: "",
      image: "",
      dimensions: "50cm x 50cm x 40cm",
      materials: "100% Cotton, Premium EPS Beads",
      careInstructions: "Spot clean only.",
      rating: 5.0,
      reviewsCount: 1,
      arAssetScale: 1.0
    });
  };

  const startEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProdForm({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      description: p.description,
      image: p.image,
      dimensions: p.dimensions,
      materials: p.materials.join(", "),
      careInstructions: p.careInstructions,
      rating: p.rating,
      reviewsCount: p.reviewsCount,
      arAssetScale: p.arAssetScale || 1.0
    });
  };

  const deleteProduct = (id: string) => {
    if (confirm("Are you sure you want to retire this design piece from the catalog?")) {
      const updated = products.filter(p => p.id !== id);
      setProducts(updated);
      localStorage.setItem("loom_layer_custom_products", JSON.stringify(updated));
      if (editingProduct?.id === id) {
        setEditingProduct(null);
      }
    }
  };

  // --- COUNTRY RATE CRUD OPERATIONS ---
  const handleCountrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCountry) {
      const updated = countries.map(c => {
        if (c.name === editingCountry.name) {
          return {
            name: countryForm.name,
            taxRate: Number(countryForm.taxRate),
            shippingFee: Number(countryForm.shippingFee),
            freeShippingThreshold: Number(countryForm.freeShippingThreshold),
            currency: countryForm.currency.toUpperCase(),
            currencySymbol: countryForm.currencySymbol
          };
        }
        return c;
      });
      setCountries(updated);
      localStorage.setItem("loom_layer_countries", JSON.stringify(updated));
      setEditingCountry(null);
    } else {
      if (countries.some(c => c.name.toLowerCase() === countryForm.name.toLowerCase())) {
        alert("This country is already registered.");
        return;
      }
      const newCountry: CountryRate = {
        name: countryForm.name,
        taxRate: Number(countryForm.taxRate),
        shippingFee: Number(countryForm.shippingFee),
        freeShippingThreshold: Number(countryForm.freeShippingThreshold),
        currency: countryForm.currency.toUpperCase(),
        currencySymbol: countryForm.currencySymbol
      };
      const updated = [...countries, newCountry];
      setCountries(updated);
      localStorage.setItem("loom_layer_countries", JSON.stringify(updated));
    }

    setCountryForm({
      name: "",
      taxRate: 10,
      shippingFee: 25,
      freeShippingThreshold: 150,
      currency: "USD",
      currencySymbol: "$"
    });
  };

  const startEditCountry = (c: CountryRate) => {
    setEditingCountry(c);
    setCountryForm({
      name: c.name,
      taxRate: c.taxRate,
      shippingFee: c.shippingFee,
      freeShippingThreshold: c.freeShippingThreshold,
      currency: c.currency,
      currencySymbol: c.currencySymbol
    });
  };

  const deleteCountry = (name: string) => {
    if (confirm(`Remove custom delivery region for ${name}?`)) {
      const updated = countries.filter(c => c.name !== name);
      setCountries(updated);
      localStorage.setItem("loom_layer_countries", JSON.stringify(updated));
      if (editingCountry?.name === name) {
        setEditingCountry(null);
      }
    }
  };

  // --- COUPON CRUD OPERATIONS ---
  const handleCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const codeUpper = couponForm.code.trim().toUpperCase();
    if (!codeUpper) return;

    if (editingCoupon) {
      const updated = coupons.map(c => {
        if (c.code === editingCoupon.code) {
          return {
            code: codeUpper,
            discountPercent: Number(couponForm.discountPercent),
            description: couponForm.description
          };
        }
        return c;
      });
      setCoupons(updated);
      localStorage.setItem("loom_layer_coupons", JSON.stringify(updated));
      setEditingCoupon(null);
    } else {
      if (coupons.some(c => c.code.toUpperCase() === codeUpper)) {
        alert("This promo code already exists.");
        return;
      }
      const newCoupon: CouponCode = {
        code: codeUpper,
        discountPercent: Number(couponForm.discountPercent),
        description: couponForm.description
      };
      const updated = [...coupons, newCoupon];
      setCoupons(updated);
      localStorage.setItem("loom_layer_coupons", JSON.stringify(updated));
    }

    setCouponForm({
      code: "",
      discountPercent: 15,
      description: "Special seasonal discount!"
    });
  };

  const startEditCoupon = (c: CouponCode) => {
    setEditingCoupon(c);
    setCouponForm({
      code: c.code,
      discountPercent: c.discountPercent,
      description: c.description
    });
  };

  const deleteCoupon = (code: string) => {
    if (confirm(`Retire discount coupon ${code}?`)) {
      const updated = coupons.filter(c => c.code !== code);
      setCoupons(updated);
      localStorage.setItem("loom_layer_coupons", JSON.stringify(updated));
      if (editingCoupon?.code === code) {
        setEditingCoupon(null);
      }
    }
  };

  // --- SIMULATED INBOUND TRANSACTION INJECTOR ---
  const injectSampleOrder = () => {
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    const qty = Math.floor(Math.random() * 2) + 1;
    const itemSubtotal = randomProduct.price * qty;
    
    const randomCountry = countries[Math.floor(Math.random() * countries.length)];
    const isFreeShipping = itemSubtotal >= randomCountry.freeShippingThreshold;
    const shippingFee = isFreeShipping ? 0 : randomCountry.shippingFee;
    const taxValue = Math.round(itemSubtotal * (randomCountry.taxRate / 100));
    const totalValue = itemSubtotal + shippingFee + taxValue;

    const names = ["Aria Vance", "Knut Lindqvist", "Hana Tanaka", "Arjun Patel", "Isabella Rossi", "Maximilian Schmidt"];
    const emails = ["aria@vance.co", "knut@nordiccrafts.se", "tanaka@design.jp", "arjun@jodhpurcrafts.in", "isabella@bellaro.it", "max@schmidt.de"];
    const cities = ["New York", "Stockholm", "Kyoto", "Mumbai", "Milan", "Munich"];
    const streets = ["452 Lexington Ave", "Sveavägen 12", "15 Karasuma-dori", "High Street Gate 4", "Via della Moscova 18", "Maximilianstraße 5"];

    const idx = Math.floor(Math.random() * names.length);

    const newOrder: Order = {
      id: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      items: [{ product: randomProduct, quantity: qty }],
      subtotal: itemSubtotal,
      tax: taxValue,
      shipping: shippingFee,
      discount: 0,
      total: totalValue,
      customerName: names[idx],
      customerEmail: emails[idx],
      shippingAddress: {
        street: streets[idx],
        city: cities[idx],
        state: "Region HQ",
        postalCode: Math.floor(10000 + Math.random() * 89999).toString(),
        country: randomCountry.name
      },
      cardLastFour: Math.floor(1000 + Math.random() * 8999).toString(),
      paymentMethod: "Visa Premium",
      timestamp: new Date().toISOString()
    };

    const newHistory = [newOrder, ...orders];
    setOrders(newHistory);
    localStorage.setItem("loom_layer_orders_history", JSON.stringify(newHistory));
  };

  const clearOrdersHistory = () => {
    if (confirm("Reset order book ledger? This removes all logged transaction entries.")) {
      setOrders([]);
      localStorage.removeItem("loom_layer_orders_history");
    }
  };

  // Financial statistics
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalSoldItemsCount = orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);
  const averageOrderValue = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;

  // --- RENDER PASSCODE GATE ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-editorial-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Aesthetic design accents */}
        <div className="absolute top-10 right-10 opacity-15">
          <span className="font-serif text-[180px] leading-none text-editorial-accent font-extrabold select-none">
            LL
          </span>
        </div>
        <div className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-editorial-accent-soft blur-3xl opacity-60" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md bg-white border border-editorial-border p-8 sm:p-10 shadow-xl relative z-10"
        >
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-editorial-accent hover:text-editorial-ink transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="h-12 w-12 bg-editorial-ink text-white flex items-center justify-center rounded-none mb-6 shadow-md">
              <Lock className="h-5 w-5 text-editorial-accent animate-pulse" />
            </div>

            <span className="text-[9px] font-bold tracking-[0.25em] text-editorial-accent uppercase mb-1">
              Private Ledger Terminal
            </span>
            <h1 className="font-serif text-2xl font-bold text-editorial-ink">
              Loom & Layer Vault
            </h1>
            <p className="mt-2 text-xs text-editorial-ink/60 font-light max-w-xs">
              Access is restricted to authorized operations managers and design directors. Enter ledger security passcode.
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            <div className="space-y-1 text-left">
              <label className="block text-[8px] font-bold text-editorial-accent uppercase tracking-wider">
                System Key
              </label>
              <div className="relative">
                <input
                  required
                  type={showPasscode ? "text" : "password"}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter passcode..."
                  className="w-full border border-editorial-border px-4 py-3 text-xs outline-none focus:border-editorial-ink transition-all placeholder-editorial-ink/30 font-mono tracking-widest text-center"
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-3 top-3 text-[10px] uppercase font-bold text-editorial-accent hover:text-editorial-ink cursor-pointer"
                >
                  {showPasscode ? "Hide" : "Show"}
                </button>
              </div>
              <span className="block text-[9px] text-editorial-ink/40 font-mono mt-1 text-center">
                Demo Key Hint: <code className="font-semibold text-editorial-accent">admin123</code>
              </span>
            </div>

            {loginError && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-600 font-bold text-[10px] uppercase tracking-wider text-center"
              >
                ⚠️ {loginError}
              </motion.p>
            )}

            <button
              type="submit"
              className="w-full bg-editorial-ink hover:bg-editorial-accent text-white font-bold py-3 text-[10px] uppercase tracking-[0.2em] transition-all cursor-pointer shadow-sm"
            >
              Authenticate & Unlock
            </button>
          </form>

          <div className="mt-6 border-t border-editorial-border/60 pt-4 flex justify-between text-[9px] text-editorial-ink/40 font-mono">
            <span>SSL Key: active</span>
            <span>Port: Local SSL</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-editorial-bg text-editorial-ink flex flex-col">
      {/* Top Admin Header */}
      <header className="border-b border-editorial-border bg-white px-4 py-4 sm:px-6 lg:px-8 relative z-20 shadow-xs">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="flex items-center justify-center h-8 w-8 border border-editorial-border hover:bg-editorial-ink hover:text-white transition-all text-editorial-ink cursor-pointer"
              title="Return to Public Catalog"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex h-8 w-8 items-center justify-center bg-editorial-ink text-white font-serif font-bold text-xs">
              LL
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-sm font-bold uppercase tracking-wider leading-none">
                  Loom & Layer Executive
                </h1>
                <span className="text-[8px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 border border-emerald-200 uppercase tracking-widest flex items-center gap-1 animate-pulse">
                  <span className="h-1 w-1 rounded-full bg-emerald-500" />
                  Privileged
                </span>
              </div>
              <span className="text-[9px] text-editorial-accent font-semibold tracking-wider uppercase block mt-0.5">
                Catalog & Region Ledger Hub
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={injectSampleOrder}
              className="hidden sm:flex items-center space-x-1.5 bg-editorial-accent-soft border border-editorial-border hover:border-editorial-ink px-3 py-1.5 text-[9px] font-bold text-editorial-accent uppercase tracking-wider transition-all cursor-pointer"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Simulate Order</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 border border-editorial-border hover:bg-red-50 hover:text-red-700 px-3 py-1.5 text-[9px] font-bold text-editorial-accent uppercase tracking-wider transition-all cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Lock Terminal</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row border-b border-editorial-border">
        {/* Vertical Operations Sidebar */}
        <nav className="w-full md:w-64 bg-white border-r border-editorial-border flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible shrink-0 md:pt-4">
          <button
            onClick={() => { setActiveTab("dashboard"); }}
            className={`flex-1 md:flex-initial flex items-center justify-center md:justify-start space-x-3 px-5 py-4 text-[10px] font-bold uppercase tracking-wider transition-all border-b md:border-b-0 md:border-l-4 cursor-pointer text-center md:text-left ${
              activeTab === "dashboard"
                ? "bg-editorial-accent-soft text-editorial-ink border-editorial-ink"
                : "text-editorial-accent hover:bg-neutral-50 border-transparent hover:text-editorial-ink"
            }`}
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline md:inline">Analytics Hub</span>
          </button>

          <button
            onClick={() => { setActiveTab("catalog"); }}
            className={`flex-1 md:flex-initial flex items-center justify-center md:justify-start space-x-3 px-5 py-4 text-[10px] font-bold uppercase tracking-wider transition-all border-b md:border-b-0 md:border-l-4 cursor-pointer text-center md:text-left ${
              activeTab === "catalog"
                ? "bg-editorial-accent-soft text-editorial-ink border-editorial-ink"
                : "text-editorial-accent hover:bg-neutral-50 border-transparent hover:text-editorial-ink"
            }`}
          >
            <Tag className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline md:inline">Catalog items</span>
          </button>

          <button
            onClick={() => { setActiveTab("regions"); }}
            className={`flex-1 md:flex-initial flex items-center justify-center md:justify-start space-x-3 px-5 py-4 text-[10px] font-bold uppercase tracking-wider transition-all border-b md:border-b-0 md:border-l-4 cursor-pointer text-center md:text-left ${
              activeTab === "regions"
                ? "bg-editorial-accent-soft text-editorial-ink border-editorial-ink"
                : "text-editorial-accent hover:bg-neutral-50 border-transparent hover:text-editorial-ink"
            }`}
          >
            <Globe2 className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline md:inline">Global rates</span>
          </button>

          <button
            onClick={() => { setActiveTab("coupons"); }}
            className={`flex-1 md:flex-initial flex items-center justify-center md:justify-start space-x-3 px-5 py-4 text-[10px] font-bold uppercase tracking-wider transition-all border-b md:border-b-0 md:border-l-4 cursor-pointer text-center md:text-left ${
              activeTab === "coupons"
                ? "bg-editorial-accent-soft text-editorial-ink border-editorial-ink"
                : "text-editorial-accent hover:bg-neutral-50 border-transparent hover:text-editorial-ink"
            }`}
          >
            <Ticket className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline md:inline">Promo codes</span>
          </button>

          <button
            onClick={() => { setActiveTab("orders"); }}
            className={`flex-1 md:flex-initial flex items-center justify-center md:justify-start space-x-3 px-5 py-4 text-[10px] font-bold uppercase tracking-wider transition-all border-b md:border-b-0 md:border-l-4 cursor-pointer text-center md:text-left ${
              activeTab === "orders"
                ? "bg-editorial-accent-soft text-editorial-ink border-editorial-ink font-bold"
                : "text-editorial-accent hover:bg-neutral-50 border-transparent hover:text-editorial-ink"
            }`}
          >
            <ShoppingBag className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline md:inline flex-1 text-left">Order ledger</span>
            {orders.length > 0 && (
              <span className="ml-auto bg-editorial-ink text-white text-[9px] font-bold h-5 w-5 flex items-center justify-center shrink-0">
                {orders.length}
              </span>
            )}
          </button>

          {/* Simulated stats box for operations */}
          <div className="hidden md:block mt-auto p-4 border-t border-editorial-border bg-editorial-accent-soft/40 space-y-2">
            <span className="block text-[8px] font-bold uppercase tracking-widest text-editorial-accent">
              Operational Status
            </span>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-editorial-ink">Local Sync OK</span>
            </div>
            <p className="text-[9px] text-editorial-accent/80 font-light leading-relaxed">
              Updates made here write securely back to storage. All client components refresh automatically.
            </p>
          </div>
        </nav>

        {/* Dashboard Work Area */}
        <main className="flex-1 bg-white p-4 sm:p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* TABS 1: ANALYTICS HUB */}
            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="font-serif text-2xl font-bold text-editorial-ink">Executive Performance Deck</h2>
                  <p className="text-xs text-editorial-accent mt-1 font-light">
                    Real-time operational summary, revenue metrics, design metadata and export telemetry.
                  </p>
                </div>

                {/* Statistics Bento Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="border border-editorial-border bg-editorial-accent-soft p-5 relative overflow-hidden">
                    <span className="block text-[9px] font-bold text-editorial-accent uppercase tracking-widest">
                      Gross Revenue
                    </span>
                    <span className="block font-serif text-3xl font-normal mt-2 text-editorial-ink">
                      ${totalRevenue.toLocaleString()}
                    </span>
                    <span className="text-[9px] font-mono text-emerald-700 font-semibold flex items-center gap-1 mt-2">
                      <TrendingUp className="h-3 w-3" />
                      +14.2% global shift
                    </span>
                    <Coins className="absolute bottom-2 right-2 h-14 w-14 text-editorial-accent/15 select-none pointer-events-none" />
                  </div>

                  <div className="border border-editorial-border bg-editorial-accent-soft p-5 relative overflow-hidden">
                    <span className="block text-[9px] font-bold text-editorial-accent uppercase tracking-widest">
                      Total Orders
                    </span>
                    <span className="block font-serif text-3xl font-normal mt-2 text-editorial-ink">
                      {orders.length}
                    </span>
                    <span className="text-[9px] font-mono text-editorial-ink/55 flex items-center gap-1 mt-2">
                      <Clock className="h-3 w-3" />
                      Inbound ledger synced
                    </span>
                    <ShoppingBag className="absolute bottom-2 right-2 h-14 w-14 text-editorial-accent/15 select-none pointer-events-none" />
                  </div>

                  <div className="border border-editorial-border bg-editorial-accent-soft p-5 relative overflow-hidden">
                    <span className="block text-[9px] font-bold text-editorial-accent uppercase tracking-widest">
                      Active Catalog
                    </span>
                    <span className="block font-serif text-3xl font-normal mt-2 text-editorial-ink">
                      {products.length}
                    </span>
                    <span className="text-[9px] font-mono text-editorial-accent font-semibold flex items-center gap-1 mt-2">
                      {products.filter(p => p.rating >= 4.9).length} Premium Grade
                    </span>
                    <Tag className="absolute bottom-2 right-2 h-14 w-14 text-editorial-accent/15 select-none pointer-events-none" />
                  </div>

                  <div className="border border-editorial-border bg-editorial-accent-soft p-5 relative overflow-hidden">
                    <span className="block text-[9px] font-bold text-editorial-accent uppercase tracking-widest">
                      Avg Order Size
                    </span>
                    <span className="block font-serif text-3xl font-normal mt-2 text-editorial-ink">
                      ${averageOrderValue}
                    </span>
                    <span className="text-[9px] font-mono text-emerald-700 font-semibold flex items-center gap-1 mt-2">
                      {totalSoldItemsCount} pieces dispatched
                    </span>
                    <CheckCircle className="absolute bottom-2 right-2 h-14 w-14 text-editorial-accent/15 select-none pointer-events-none" />
                  </div>
                </div>

                {/* Elegant SVG Performance Chart */}
                <div className="border border-editorial-border p-6 bg-white space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-editorial-ink">
                        Global Despatch & Logistics Flow
                      </h3>
                      <p className="text-[10px] text-editorial-accent font-light">
                        Visualizing monthly luxury export shipments in thousands of dollars.
                      </p>
                    </div>
                    <span className="text-[10px] bg-editorial-accent-soft text-editorial-ink border border-editorial-border px-2.5 py-1 font-mono uppercase font-semibold">
                      FY26 Real-time
                    </span>
                  </div>

                  {/* SVG Line Graph */}
                  <div className="h-64 w-full pt-4 relative">
                    <svg className="w-full h-full" viewBox="0 0 800 240" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Grid lines */}
                      <line x1="50" y1="20" x2="750" y2="20" stroke="#F1EFE9" strokeWidth="1" />
                      <line x1="50" y1="80" x2="750" y2="80" stroke="#F1EFE9" strokeWidth="1" />
                      <line x1="50" y1="140" x2="750" y2="140" stroke="#F1EFE9" strokeWidth="1" />
                      <line x1="50" y1="200" x2="750" y2="200" stroke="#DEDAD0" strokeWidth="1" />

                      {/* Labels */}
                      <text x="15" y="25" fill="#C2BAB2" fontSize="9" fontFamily="monospace">200K</text>
                      <text x="15" y="85" fill="#C2BAB2" fontSize="9" fontFamily="monospace">100K</text>
                      <text x="15" y="145" fill="#C2BAB2" fontSize="9" fontFamily="monospace">50K</text>
                      <text x="15" y="205" fill="#8C8375" fontSize="9" fontFamily="monospace">0</text>

                      {/* Gradient path fill */}
                      <path
                        d="M 50 200 C 150 180, 200 130, 250 140 C 300 150, 350 70, 450 60 C 550 50, 600 120, 650 90 C 700 60, 720 30, 750 35 L 750 200 L 50 Z"
                        fill="url(#gradient-chart)"
                        opacity="0.5"
                      />

                      {/* Smooth trend Line */}
                      <path
                        d="M 50 200 C 150 180, 200 130, 250 140 C 300 150, 350 70, 450 60 C 550 50, 600 120, 650 90 C 700 60, 720 30, 750 35"
                        stroke="#B8735C"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />

                      {/* Dots on nodes */}
                      <circle cx="250" cy="140" r="4" fill="#B8735C" stroke="#fff" strokeWidth="2" />
                      <circle cx="450" cy="60" r="4" fill="#B8735C" stroke="#fff" strokeWidth="2" />
                      <circle cx="650" cy="90" r="4" fill="#B8735C" stroke="#fff" strokeWidth="2" />
                      <circle cx="750" cy="35" r="4" fill="#B8735C" stroke="#fff" strokeWidth="2" />

                      {/* Month markers */}
                      <text x="50" y="225" fill="#8C8375" fontSize="10" textAnchor="middle">Jan</text>
                      <text x="166" y="225" fill="#8C8375" fontSize="10" textAnchor="middle">Mar</text>
                      <text x="282" y="225" fill="#8C8375" fontSize="10" textAnchor="middle">May</text>
                      <text x="398" y="225" fill="#8C8375" fontSize="10" textAnchor="middle">Jul</text>
                      <text x="514" y="225" fill="#8C8375" fontSize="10" textAnchor="middle">Sep</text>
                      <text x="630" y="225" fill="#8C8375" fontSize="10" textAnchor="middle">Nov</text>
                      <text x="750" y="225" fill="#8C8375" fontSize="10" textAnchor="end">Dec</text>

                      {/* Definitions */}
                      <defs>
                        <linearGradient id="gradient-chart" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#B8735C" />
                          <stop offset="100%" stopColor="#FAF9F6" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>

                {/* Recent Activity Ledger */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                  <div className="border border-editorial-border p-6 space-y-4 text-left">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-editorial-ink flex items-center justify-between">
                      <span>Live Ledger Feed</span>
                      <span className="text-[8px] bg-editorial-accent-soft text-editorial-accent px-1.5 py-0.5 border border-editorial-border">
                        {orders.length} transaction logged
                      </span>
                    </h3>
                    
                    {orders.length === 0 ? (
                      <div className="py-12 text-center text-editorial-ink/40 text-xs font-light">
                        No transactions registered yet. Checkouts on the frontend populate this ledger in real-time.
                        <button 
                          onClick={injectSampleOrder} 
                          className="mt-3 block mx-auto underline font-bold text-editorial-accent hover:text-editorial-ink cursor-pointer uppercase text-[9px] tracking-wider"
                        >
                          Simulate Sample Purchase
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                        {orders.slice(0, 5).map(o => (
                          <div key={o.id} className="flex items-center justify-between p-3 bg-editorial-accent-soft border border-editorial-border/60">
                            <div>
                              <span className="block font-mono text-[10px] font-bold text-editorial-ink">
                                {o.id} • {o.customerName}
                              </span>
                              <span className="block text-[8px] text-editorial-ink/40 mt-0.5">
                                {new Date(o.timestamp).toLocaleDateString()} {new Date(o.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="block text-xs font-bold text-editorial-ink font-serif">
                                ${o.total.toLocaleString()}
                              </span>
                              <span className="block text-[8px] text-emerald-700 font-bold uppercase tracking-wider">
                                PAID SECURE
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border border-editorial-border p-6 space-y-4 text-left">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-editorial-ink">
                      System Configuration Node
                    </h3>
                    <div className="space-y-4 text-xs">
                      <div className="flex items-center justify-between border-b border-editorial-border pb-2.5">
                        <span className="text-editorial-ink/65 font-light">Total Supported Regions:</span>
                        <strong className="font-bold">{countries.length} countries</strong>
                      </div>
                      <div className="flex items-center justify-between border-b border-editorial-border pb-2.5">
                        <span className="text-editorial-ink/65 font-light">Active Coupons:</span>
                        <strong className="font-bold">{coupons.length} promotional codes</strong>
                      </div>
                      <div className="flex items-center justify-between border-b border-editorial-border pb-2.5">
                        <span className="text-editorial-ink/65 font-light">Custom Admin Passcode:</span>
                        <strong className="font-mono bg-editorial-accent-soft text-editorial-accent px-1.5 py-0.5 border border-editorial-border">admin123</strong>
                      </div>
                      <div className="flex items-center justify-between pb-1">
                        <span className="text-editorial-ink/65 font-light">Database Ledger Status:</span>
                        <strong className="text-emerald-700 font-bold uppercase tracking-wider">Local & Sandbox Active</strong>
                      </div>
                      <p className="text-[9px] text-editorial-accent leading-relaxed pt-2 border-t border-dashed border-editorial-border">
                        Any new product design, delivery region rate, or coupon code created on this panel is written immediately to browser storage and fully overrides static defaults.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 2: PRODUCT CATALOG MANAGER */}
            {activeTab === "catalog" && (
              <motion.div
                key="catalog"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-8 text-left"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-editorial-ink">Product Catalog Vault</h2>
                    <p className="text-xs text-editorial-accent mt-1 font-light">
                      Register new hand-woven items, edit specifications, or adjust scaling multipliers.
                    </p>
                  </div>
                  {editingProduct && (
                    <button 
                      onClick={() => {
                        setEditingProduct(null);
                        setProdForm({
                          id: "",
                          name: "",
                          category: "poufs",
                          price: 99,
                          description: "",
                          image: "",
                          dimensions: "50cm x 50cm x 40cm",
                          materials: "100% Cotton, Premium EPS Beads",
                          careInstructions: "Spot clean only.",
                          rating: 5.0,
                          reviewsCount: 1,
                          arAssetScale: 1.0
                        });
                      }}
                      className="px-4 py-2 border border-editorial-border hover:bg-neutral-50 text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer shrink-0"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                {/* Catalog Edit Form */}
                <div className="border border-editorial-border p-6 bg-editorial-accent-soft/40 relative">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-editorial-accent mb-4 flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span>{editingProduct ? `Modify SKU [${editingProduct.id}]` : "Register New Soft-Furniture Item"}</span>
                  </h3>

                  <form onSubmit={handleProductSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3 md:col-span-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="block text-[8px] font-bold text-editorial-accent uppercase tracking-wider">
                            Product Name
                          </label>
                          <input
                            required
                            type="text"
                            value={prodForm.name}
                            onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                            placeholder="e.g. Jaipur Indigo Pouf"
                            className="w-full bg-white border border-editorial-border px-3 py-2 text-xs text-editorial-ink outline-none focus:border-editorial-ink"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="block text-[8px] font-bold text-editorial-accent uppercase tracking-wider">
                              Category
                            </label>
                            <select
                              value={prodForm.category}
                              onChange={(e) => setProdForm({ ...prodForm, category: e.target.value as Product["category"] })}
                              className="w-full bg-white border border-editorial-border px-2.5 py-2 text-xs text-editorial-ink outline-none focus:border-editorial-ink"
                            >
                              <option value="poufs">Poufs</option>
                              <option value="cushions">Cushions</option>
                              <option value="stools">Stools</option>
                              <option value="sofas">Sofas</option>
                              <option value="throws">Throws</option>
                              <option value="rugs">Rugs</option>
                              <option value="chairs">Chairs</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[8px] font-bold text-editorial-accent uppercase tracking-wider">
                              Price (USD)
                            </label>
                            <input
                              required
                              type="number"
                              min="1"
                              value={prodForm.price}
                              onChange={(e) => setProdForm({ ...prodForm, price: Number(e.target.value) })}
                              className="w-full bg-white border border-editorial-border px-3 py-2 text-xs text-editorial-ink outline-none focus:border-editorial-ink font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[8px] font-bold text-editorial-accent uppercase tracking-wider">
                          Description
                        </label>
                        <textarea
                          required
                          value={prodForm.description}
                          onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                          rows={2}
                          placeholder="Detail the loom type, aesthetic appeal, and fill quality..."
                          className="w-full bg-white border border-editorial-border px-3 py-2 text-xs text-editorial-ink outline-none focus:border-editorial-ink placeholder-editorial-ink/30"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="block text-[8px] font-bold text-editorial-accent uppercase tracking-wider">
                            Dimensions
                          </label>
                          <input
                            required
                            type="text"
                            value={prodForm.dimensions}
                            onChange={(e) => setProdForm({ ...prodForm, dimensions: e.target.value })}
                            className="w-full bg-white border border-editorial-border px-3 py-2 text-xs text-editorial-ink outline-none focus:border-editorial-ink"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[8px] font-bold text-editorial-accent uppercase tracking-wider">
                            Materials (comma separated)
                          </label>
                          <input
                            required
                            type="text"
                            value={prodForm.materials}
                            onChange={(e) => setProdForm({ ...prodForm, materials: e.target.value })}
                            placeholder="e.g. 100% Organic Cotton, Hand-carved Mango Wood"
                            className="w-full bg-white border border-editorial-border px-3 py-2 text-xs text-editorial-ink outline-none focus:border-editorial-ink placeholder-editorial-ink/30"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="block text-[8px] font-bold text-editorial-accent uppercase tracking-wider">
                          Unique Product SKU / ID
                        </label>
                        <input
                          required
                          disabled={!!editingProduct}
                          type="text"
                          value={prodForm.id}
                          onChange={(e) => setProdForm({ ...prodForm, id: e.target.value })}
                          placeholder="e.g. sg-012"
                          className="w-full bg-white border border-editorial-border px-3 py-2 text-xs text-editorial-ink outline-none focus:border-editorial-ink font-mono disabled:opacity-50 disabled:bg-neutral-100 placeholder-editorial-ink/30"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[8px] font-bold text-editorial-accent uppercase tracking-wider">
                          Premium Image Selection
                        </label>
                        <input
                          type="text"
                          value={prodForm.image}
                          onChange={(e) => setProdForm({ ...prodForm, image: e.target.value })}
                          placeholder="Paste image URL (https://...) or upload below"
                          className="w-full bg-white border border-editorial-border px-3 py-2 text-xs text-editorial-ink outline-none focus:border-editorial-ink placeholder-editorial-ink/30"
                        />
                        
                        {/* Drag and Drop File Upload Area */}
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragging(true);
                          }}
                          onDragLeave={() => setIsDragging(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDragging(false);
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              handleFileChange(e.dataTransfer.files[0]);
                            }
                          }}
                          onClick={() => document.getElementById("product-image-file-input")?.click()}
                          className={`mt-2 border border-dashed p-4 flex flex-col items-center justify-center cursor-pointer transition-all min-h-[90px] ${
                            isDragging
                              ? "border-editorial-ink bg-editorial-accent-soft/80"
                              : "border-editorial-border hover:border-editorial-ink bg-neutral-50/50"
                          }`}
                        >
                          <input
                            type="file"
                            id="product-image-file-input"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleFileChange(e.target.files[0]);
                              }
                            }}
                          />
                          {prodForm.image ? (
                            <div className="flex items-center space-x-3 w-full" onClick={(e) => e.stopPropagation()}>
                              <img
                                src={prodForm.image}
                                alt="Preview"
                                className="h-12 w-12 object-cover border border-editorial-border bg-white"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=600&q=80";
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <span className="block text-[10px] font-mono truncate text-editorial-ink">
                                  {prodForm.image.startsWith("data:") ? "Local Image Uploaded" : "Remote URL Connected"}
                                </span>
                                <span className="block text-[8px] text-editorial-accent uppercase font-bold tracking-wider mt-0.5">
                                  Click here to upload another
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setProdForm(prev => ({ ...prev, image: "" }))}
                                className="text-editorial-accent hover:text-red-600 p-1 cursor-pointer transition-colors"
                                title="Remove image"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="text-center pointer-events-none">
                              <ImageIcon className="h-6 w-6 text-editorial-accent/60 mx-auto mb-1" />
                              <span className="block text-[10px] text-editorial-ink font-medium">
                                Drag & drop image here, or <span className="underline">browse</span>
                              </span>
                              <span className="block text-[8px] text-editorial-accent uppercase tracking-wider mt-0.5">
                                Supports PNG, JPEG, WEBP or SVG
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="block text-[8px] font-bold text-editorial-accent uppercase tracking-wider">
                            Care Instructions
                          </label>
                          <input
                            required
                            type="text"
                            value={prodForm.careInstructions}
                            onChange={(e) => setProdForm({ ...prodForm, careInstructions: e.target.value })}
                            className="w-full bg-white border border-editorial-border px-3 py-2 text-xs text-editorial-ink outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[8px] font-bold text-editorial-accent uppercase tracking-wider" title="Multiplier for 3D staging space models">
                            3D Model Staging Scale
                          </label>
                          <input
                            required
                            type="number"
                            step="0.05"
                            min="0.2"
                            max="3.0"
                            value={prodForm.arAssetScale}
                            onChange={(e) => setProdForm({ ...prodForm, arAssetScale: Number(e.target.value) })}
                            className="w-full bg-white border border-editorial-border px-3 py-2 text-xs text-editorial-ink outline-none font-mono"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-editorial-ink hover:bg-editorial-accent text-white font-bold py-3 text-[10px] uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 md:mt-10"
                      >
                        <PlusCircle className="h-4 w-4" />
                        <span>{editingProduct ? "Update Catalog Entry" : "Register Product"}</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Existing Catalog List */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-editorial-ink">
                    Active Catalog Matrix ({products.length} registered items)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((p) => (
                      <div key={p.id} className="border border-editorial-border bg-white flex flex-col justify-between group">
                        <div className="p-4 border-b border-editorial-border flex items-center justify-between bg-editorial-accent-soft/30">
                          <span className="font-mono text-[10px] font-bold text-editorial-ink">
                            SKU: {p.id}
                          </span>
                          <span className="text-[9px] bg-white border border-editorial-border px-2 py-0.5 uppercase tracking-wider font-bold text-editorial-accent">
                            {p.category}
                          </span>
                        </div>
                        
                        <div className="p-4 flex gap-4">
                          <div className="h-20 w-20 bg-neutral-100 overflow-hidden border border-editorial-border shrink-0">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="h-full w-full object-cover group-hover:scale-105 transition-all duration-500"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="space-y-1 text-left min-w-0">
                            <h4 className="text-xs font-bold text-editorial-ink truncate">{p.name}</h4>
                            <p className="text-[10px] font-semibold text-editorial-accent font-serif">${p.price}</p>
                            <p className="text-[10px] text-editorial-ink/50 line-clamp-2 leading-relaxed font-light">{p.description}</p>
                          </div>
                        </div>

                        <div className="p-4 bg-editorial-accent-soft/20 border-t border-editorial-border/60 flex items-center justify-between text-[9px] font-mono text-editorial-accent">
                          <span>Scale: {p.arAssetScale || 1.0}x</span>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => startEditProduct(p)}
                              className="p-1 text-editorial-ink hover:text-editorial-accent hover:bg-white border border-transparent hover:border-editorial-border transition-all cursor-pointer"
                              title="Edit product specs"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => deleteProduct(p.id)}
                              className="p-1 text-red-500/70 hover:text-red-600 hover:bg-white border border-transparent hover:border-editorial-border transition-all cursor-pointer"
                              title="Delete from catalog"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 3: REGIONS & RATE MANAGER */}
            {activeTab === "regions" && (
              <motion.div
                key="regions"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-8 text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-editorial-ink">Global Shipping & Tax Rate Ledger</h2>
                    <p className="text-xs text-editorial-accent mt-1 font-light">
                      Define regional sales tax values (GST/VAT), cargo shipping rates, and currency values.
                    </p>
                  </div>
                  {editingCountry && (
                    <button 
                      onClick={() => {
                        setEditingCountry(null);
                        setCountryForm({
                          name: "",
                          taxRate: 10,
                          shippingFee: 25,
                          freeShippingThreshold: 150,
                          currency: "USD",
                          currencySymbol: "$"
                        });
                      }}
                      className="px-4 py-2 border border-editorial-border hover:bg-neutral-50 text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer shrink-0"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                {/* Country rates edit form */}
                <div className="border border-editorial-border p-6 bg-editorial-accent-soft/40">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-editorial-accent mb-4 flex items-center gap-2">
                    <Globe2 className="h-4 w-4 text-editorial-accent" />
                    <span>{editingCountry ? `Modify Delivery Rules for [${editingCountry.name}]` : "Register New Delivery Region"}</span>
                  </h3>

                  <form onSubmit={handleCountrySubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-1">
                      <label className="block text-[8px] font-bold text-editorial-accent uppercase tracking-wider">
                        Country / Territory Name
                      </label>
                      <input
                        required
                        type="text"
                        value={countryForm.name}
                        onChange={(e) => setCountryForm({ ...countryForm, name: e.target.value })}
                        placeholder="e.g. Switzerland"
                        className="w-full bg-white border border-editorial-border px-3 py-2 text-xs text-editorial-ink outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="block text-[8px] font-bold text-editorial-accent uppercase tracking-wider">
                          Tax Rate (%)
                        </label>
                        <input
                          required
                          type="number"
                          min="0"
                          max="50"
                          value={countryForm.taxRate}
                          onChange={(e) => setCountryForm({ ...countryForm, taxRate: Number(e.target.value) })}
                          className="w-full bg-white border border-editorial-border px-3 py-2 text-xs text-editorial-ink outline-none font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[8px] font-bold text-editorial-accent uppercase tracking-wider">
                          Cargo Ship Fee ($)
                        </label>
                        <input
                          required
                          type="number"
                          min="0"
                          value={countryForm.shippingFee}
                          onChange={(e) => setCountryForm({ ...countryForm, shippingFee: Number(e.target.value) })}
                          className="w-full bg-white border border-editorial-border px-3 py-2 text-xs text-editorial-ink outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="block text-[8px] font-bold text-editorial-accent uppercase tracking-wider">
                          Free Ship Min ($)
                        </label>
                        <input
                          required
                          type="number"
                          min="0"
                          value={countryForm.freeShippingThreshold}
                          onChange={(e) => setCountryForm({ ...countryForm, freeShippingThreshold: Number(e.target.value) })}
                          className="w-full bg-white border border-editorial-border px-3 py-2 text-xs text-editorial-ink outline-none font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[8px] font-bold text-editorial-accent uppercase tracking-wider">
                          Currency Code (e.g. CHF)
                        </label>
                        <input
                          required
                          type="text"
                          maxLength={3}
                          value={countryForm.currency}
                          onChange={(e) => setCountryForm({ ...countryForm, currency: e.target.value })}
                          className="w-full bg-white border border-editorial-border px-3 py-2 text-xs text-editorial-ink outline-none font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="block text-[8px] font-bold text-editorial-accent uppercase tracking-wider">
                          Symbol (e.g. SFr)
                        </label>
                        <input
                          required
                          type="text"
                          maxLength={4}
                          value={countryForm.currencySymbol}
                          onChange={(e) => setCountryForm({ ...countryForm, currencySymbol: e.target.value })}
                          className="w-full bg-white border border-editorial-border px-3 py-2 text-xs text-editorial-ink outline-none font-mono"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-editorial-ink hover:bg-editorial-accent text-white font-bold py-2.5 text-[9px] uppercase tracking-widest transition-all cursor-pointer h-9 shrink-0 flex items-center justify-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Save Rules</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Active countries ledger */}
                <div className="border border-editorial-border overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-editorial-accent-soft text-[9px] font-bold uppercase tracking-wider text-editorial-accent border-b border-editorial-border">
                        <th className="p-4">Delivery Country</th>
                        <th className="p-4">Local Currency</th>
                        <th className="p-4 text-center">Tax Levy (%)</th>
                        <th className="p-4 text-center">Standard Shipping Fee</th>
                        <th className="p-4 text-center">Free Shipping Limit</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-editorial-border/60 text-xs font-medium">
                      {countries.map((c) => (
                        <tr key={c.name} className="hover:bg-neutral-50/50 transition-colors">
                          <td className="p-4 font-bold text-editorial-ink">{c.name}</td>
                          <td className="p-4 font-mono text-[10px] text-editorial-accent">
                            {c.currency} ({c.currencySymbol})
                          </td>
                          <td className="p-4 text-center font-mono">{c.taxRate}%</td>
                          <td className="p-4 text-center font-mono">
                            {c.currencySymbol}{c.shippingFee}
                          </td>
                          <td className="p-4 text-center font-mono">
                            {c.currencySymbol}{c.freeShippingThreshold}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => startEditCountry(c)}
                                className="p-1 border border-editorial-border hover:bg-white hover:text-editorial-accent transition-all cursor-pointer"
                                title="Edit country rules"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => deleteCountry(c.name)}
                                className="p-1 border border-editorial-border hover:bg-white hover:text-red-600 transition-all cursor-pointer"
                                title="Remove region"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* TAB 4: ACTIVE PROMO COUPONS */}
            {activeTab === "coupons" && (
              <motion.div
                key="coupons"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-8 text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-editorial-ink">Vouchers & Promotional Campaigns</h2>
                    <p className="text-xs text-editorial-accent mt-1 font-light">
                      Establish active discount promotion codes, percentage offsets, and checkouts coupons.
                    </p>
                  </div>
                  {editingCoupon && (
                    <button 
                      onClick={() => {
                        setEditingCoupon(null);
                        setCouponForm({
                          code: "",
                          discountPercent: 15,
                          description: "Special seasonal discount!"
                        });
                      }}
                      className="px-4 py-2 border border-editorial-border hover:bg-neutral-50 text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer shrink-0"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                {/* Form to add coupon */}
                <div className="border border-editorial-border p-6 bg-editorial-accent-soft/40">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-editorial-accent mb-4 flex items-center gap-2">
                    <Ticket className="h-4 w-4" />
                    <span>{editingCoupon ? `Edit Code [${editingCoupon.code}]` : "Mint New Promo Voucher Code"}</span>
                  </h3>

                  <form onSubmit={handleCouponSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                    <div className="space-y-1">
                      <label className="block text-[8px] font-bold text-editorial-accent uppercase tracking-wider">
                        Voucher Code (e.g. WELCOME15)
                      </label>
                      <input
                        required
                        type="text"
                        value={couponForm.code}
                        onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })}
                        placeholder="SUMMER30"
                        className="w-full bg-white border border-editorial-border px-3 py-2 text-xs text-editorial-ink outline-none font-mono uppercase"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[8px] font-bold text-editorial-accent uppercase tracking-wider">
                        Discount Value (%)
                      </label>
                      <input
                        required
                        type="number"
                        min="1"
                        max="90"
                        value={couponForm.discountPercent}
                        onChange={(e) => setCouponForm({ ...couponForm, discountPercent: Number(e.target.value) })}
                        className="w-full bg-white border border-editorial-border px-3 py-2 text-xs text-editorial-ink outline-none font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1 col-span-2">
                        <label className="block text-[8px] font-bold text-editorial-accent uppercase tracking-wider">
                          Voucher Campaign Label
                        </label>
                        <input
                          required
                          type="text"
                          value={couponForm.description}
                          onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                          className="w-full bg-white border border-editorial-border px-3 py-2 text-xs text-editorial-ink outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-editorial-ink hover:bg-editorial-accent text-white font-bold py-2 text-[9px] uppercase tracking-widest transition-all cursor-pointer h-9 shrink-0 flex items-center justify-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Mint Code</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Active promotion matrix */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {coupons.map((c) => (
                    <div key={c.code} className="border border-editorial-border bg-white p-4 space-y-3 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 h-10 w-10 bg-editorial-accent-soft border-b border-l border-editorial-border font-serif text-[11px] font-bold text-editorial-accent flex items-center justify-center select-none">
                        %{c.discountPercent}
                      </div>

                      <div className="space-y-1.5 text-left">
                        <span className="inline-block bg-neutral-100 border border-editorial-border/60 px-2.5 py-0.5 text-xs font-mono font-bold text-editorial-ink tracking-wider">
                          {c.code}
                        </span>
                        <h4 className="text-[11px] font-serif font-semibold text-editorial-ink mt-2">
                          {c.description}
                        </h4>
                        <p className="text-[8px] text-editorial-accent font-mono uppercase tracking-widest pt-1">
                          Apply at checkout for {c.discountPercent}% discount
                        </p>
                      </div>

                      <div className="pt-3 border-t border-editorial-border/40 flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => startEditCoupon(c)}
                          className="p-1 hover:text-editorial-accent hover:bg-neutral-50 border border-transparent hover:border-editorial-border transition-all cursor-pointer"
                          title="Edit coupon details"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => deleteCoupon(c.code)}
                          className="p-1 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-editorial-border transition-all cursor-pointer"
                          title="Retire coupon"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* TAB 5: COMPREHENSIVE ORDER LEDGER */}
            {activeTab === "orders" && (
              <motion.div
                key="orders"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-8 text-left"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-editorial-ink">Transaction & Order Dispatch Ledger</h2>
                    <p className="text-xs text-editorial-accent mt-1 font-light">
                      Track simulated front-end checkout invoices, dispatch status, address details, and financial logs.
                    </p>
                  </div>
                  {orders.length > 0 && (
                    <button
                      onClick={clearOrdersHistory}
                      className="px-4 py-2 bg-white hover:bg-red-50 text-red-700 border border-red-200 hover:border-red-300 text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer shrink-0"
                    >
                      Clear All Ledger Data
                    </button>
                  )}
                </div>

                {orders.length === 0 ? (
                  <div className="border border-dashed border-editorial-border p-12 text-center text-editorial-ink/45 space-y-3">
                    <ShoppingBag className="h-8 w-8 text-editorial-accent mx-auto" />
                    <p className="text-xs font-light">No order records currently found in the system vault.</p>
                    <button
                      onClick={injectSampleOrder}
                      className="px-4 py-2 bg-editorial-ink hover:bg-editorial-accent text-white text-[10px] uppercase tracking-widest font-bold transition-all cursor-pointer inline-block"
                    >
                      Simulate Incoming Checkout Purchase
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((o) => (
                      <div key={o.id} className="border border-editorial-border bg-white divide-y divide-editorial-border/60">
                        {/* Order Sub-Header */}
                        <div className="p-4 bg-editorial-accent-soft/35 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div>
                            <span className="font-mono font-bold text-editorial-ink block">
                              Order Registry ID: {o.id}
                            </span>
                            <span className="text-[10px] text-editorial-accent font-light block mt-0.5">
                              Registered: {new Date(o.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[9px] bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 uppercase tracking-widest px-2 py-0.5 inline-block">
                              Payment Settled (Credit Card •••• {o.cardLastFour})
                            </span>
                          </div>
                        </div>

                        {/* Order Middle Specs */}
                        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                          {/* Items Column */}
                          <div className="space-y-3 text-left">
                            <span className="block text-[8px] font-bold uppercase tracking-widest text-editorial-accent">
                              Dispatch Cargo Details
                            </span>
                            <div className="space-y-2">
                              {o.items.map((item, index) => (
                                <div key={index} className="flex gap-3">
                                  <div className="h-10 w-10 overflow-hidden border border-editorial-border shrink-0">
                                    <img
                                      src={item.product.image}
                                      alt={item.product.name}
                                      className="h-full w-full object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="font-bold text-editorial-ink truncate">{item.product.name}</h4>
                                    <span className="text-[10px] text-editorial-accent block mt-0.5">
                                      QTY: <strong className="font-bold text-editorial-ink font-mono">{item.quantity}</strong> • ${item.product.price} each
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Client Billing details */}
                          <div className="space-y-1.5 text-left text-[11px]">
                            <span className="block text-[8px] font-bold uppercase tracking-widest text-editorial-accent mb-2">
                              Customer Consignee
                            </span>
                            <strong className="block text-editorial-ink font-semibold">{o.customerName}</strong>
                            <span className="block text-editorial-accent font-mono text-[10px]">{o.customerEmail}</span>
                            <div className="text-editorial-ink/70 pt-1 leading-normal font-light">
                              {o.shippingAddress.street}<br />
                              {o.shippingAddress.city}, {o.shippingAddress.state} {o.shippingAddress.postalCode}<br />
                              <strong className="font-semibold text-editorial-ink">{o.shippingAddress.country}</strong>
                            </div>
                          </div>

                          {/* Price calculation sheet */}
                          <div className="space-y-1.5 text-right font-mono text-[11px] bg-neutral-50/50 p-3 border border-editorial-border/40">
                            <span className="block text-right text-[8px] font-bold uppercase tracking-widest text-editorial-accent mb-2">
                              Financial Invoicing
                            </span>
                            <div className="flex justify-between">
                              <span className="text-editorial-ink/65">Subtotal:</span>
                              <span>${o.subtotal}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-editorial-ink/65">Regional Tax:</span>
                              <span>+${o.tax}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-editorial-ink/65">Shipping Cargo:</span>
                              <span>+${o.shipping}</span>
                            </div>
                            {o.discount > 0 && (
                              <div className="flex justify-between text-red-600">
                                <span>Discount:</span>
                                <span>-${o.discount}</span>
                              </div>
                            )}
                            <div className="flex justify-between border-t border-editorial-border/60 pt-1.5 font-serif font-bold text-xs text-editorial-ink">
                              <span>Total settled:</span>
                              <span>${o.total}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
