import React, { useState, useEffect } from "react";
import { Product, CartItem, CountryRate, CouponCode } from "./types";
import { PRODUCTS } from "./data";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ProductCatalog from "./components/ProductCatalog";
import ARPlanner from "./components/ARPlanner";
import PaymentGateway from "./components/PaymentGateway";
import AIDecorAssistant from "./components/AIDecorAssistant";
import AdminPortal from "./components/AdminPortal";
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight, Truck, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

const DEFAULT_COUNTRIES: CountryRate[] = [
  { name: "United States", taxRate: 8, shippingFee: 25, freeShippingThreshold: 150, currency: "USD", currencySymbol: "$" },
  { name: "Canada", taxRate: 12, shippingFee: 30, freeShippingThreshold: 180, currency: "CAD", currencySymbol: "C$" },
  { name: "Germany", taxRate: 19, shippingFee: 35, freeShippingThreshold: 200, currency: "EUR", currencySymbol: "€" },
  { name: "United Kingdom", taxRate: 20, shippingFee: 35, freeShippingThreshold: 200, currency: "GBP", currencySymbol: "£" },
  { name: "France", taxRate: 20, shippingFee: 35, freeShippingThreshold: 200, currency: "EUR", currencySymbol: "€" },
  { name: "Japan", taxRate: 10, shippingFee: 40, freeShippingThreshold: 250, currency: "JPY", currencySymbol: "¥" },
  { name: "India", taxRate: 18, shippingFee: 15, freeShippingThreshold: 100, currency: "INR", currencySymbol: "₹" },
];

const DEFAULT_COUPONS: CouponCode[] = [
  { code: "SHIVGANGA10", discountPercent: 10, description: "10% discount on entire cart!" },
  { code: "WELCOME5", discountPercent: 5, description: "5% discount on entire cart!" },
  { code: "VAULT25", discountPercent: 25, description: "25% off for priority VIP buyers!" },
];

export default function App() {
  const [currentView, setView] = useState<"catalog" | "ar-studio" | "checkout" | "admin">("catalog");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isAIAdvisorOpen, setIsAIAdvisorOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [initialProductToPlace, setInitialProductToPlace] = useState<Product | null>(null);

  // Dynamic States for Products, Countries and Coupons
  const [products, setProducts] = useState<Product[]>(() => {
    const stored = localStorage.getItem("loom_layer_custom_products");
    if (stored) {
      try { return JSON.parse(stored); } catch (e) { console.error(e); }
    }
    return PRODUCTS;
  });

  const [countries, setCountries] = useState<CountryRate[]>(() => {
    const stored = localStorage.getItem("loom_layer_countries");
    if (stored) {
      try { return JSON.parse(stored); } catch (e) { console.error(e); }
    }
    return DEFAULT_COUNTRIES;
  });

  const [coupons, setCoupons] = useState<CouponCode[]>(() => {
    const stored = localStorage.getItem("loom_layer_coupons");
    if (stored) {
      try { return JSON.parse(stored); } catch (e) { console.error(e); }
    }
    return DEFAULT_COUPONS;
  });

  useEffect(() => {
    localStorage.setItem("loom_layer_custom_products", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem("loom_layer_countries", JSON.stringify(countries));
  }, [countries]);

  useEffect(() => {
    localStorage.setItem("loom_layer_coupons", JSON.stringify(coupons));
  }, [coupons]);

  // Cart operations
  const handleAddToCart = (product: Product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
    setIsCartOpen(true); // Auto-open cart for premium user feedback
  };

  const handleAddMultipleToCart = (products: Product[]) => {
    setCart((prevCart) => {
      let updatedCart = [...prevCart];
      products.forEach((prod) => {
        const existing = updatedCart.find((item) => item.product.id === prod.id);
        if (existing) {
          updatedCart = updatedCart.map((item) =>
            item.product.id === prod.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        } else {
          updatedCart.push({ product: prod, quantity: 1 });
        }
      });
      return updatedCart;
    });
    setIsCartOpen(true);
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Switch to AR view and stage product
  const handleTryInAR = (product: Product) => {
    setInitialProductToPlace(product);
    setView("ar-studio");
    setIsAIAdvisorOpen(false); // Close advisor to give full room view
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const freeShippingThreshold = 150;
  const remainingForFreeShipping = freeShippingThreshold - cartSubtotal;

  if (currentView === "admin") {
    return (
      <AdminPortal
        products={products}
        setProducts={setProducts}
        countries={countries}
        setCountries={setCountries}
        coupons={coupons}
        setCoupons={setCoupons}
        onClose={() => setView("catalog")}
      />
    );
  }

  return (
    <div className="relative flex flex-col min-h-screen bg-editorial-bg font-sans text-editorial-ink antialiased selection:bg-editorial-accent-light selection:text-editorial-ink">
      
      {/* Dynamic Header */}
      <Header
        currentView={currentView}
        setView={setView}
        cartCount={totalCartCount}
        toggleCart={() => setIsCartOpen(!isCartOpen)}
        openAIAdvisor={() => setIsAIAdvisorOpen(true)}
      />

      {/* Main Content View routing */}
      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {currentView === "catalog" && (
            <motion.div
              key="catalog"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: [0.19, 1, 0.22, 1] }}
            >
              <ProductCatalog
                products={products}
                onAddToCart={handleAddToCart}
                onTryInAR={handleTryInAR}
                openAIAdvisor={() => setIsAIAdvisorOpen(true)}
              />
            </motion.div>
          )}

          {currentView === "ar-studio" && (
            <motion.div
              key="ar-studio"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: [0.19, 1, 0.22, 1] }}
            >
              <ARPlanner
                products={products}
                initialProductToPlace={initialProductToPlace}
                clearInitialProduct={() => setInitialProductToPlace(null)}
                onAddToCart={handleAddToCart}
                onAddMultipleToCart={handleAddMultipleToCart}
              />
            </motion.div>
          )}

          {currentView === "checkout" && (
            <motion.div
              key="checkout"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: [0.19, 1, 0.22, 1] }}
            >
              <PaymentGateway
                countries={countries}
                coupons={coupons}
                cart={cart}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveFromCart={handleRemoveFromCart}
                onClearCart={handleClearCart}
                setView={setView}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Slide-out Shopping Cart Drawer Overlay */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-editorial-ink/40 backdrop-blur-xs animate-fade-in">
          {/* Backdrop closer */}
          <div className="absolute inset-0 cursor-pointer" onClick={() => setIsCartOpen(false)} />

          <div className="relative flex h-full w-full max-w-md flex-col bg-editorial-accent-soft border-l border-editorial-border shadow-2xl animate-slide-in-right">
            
            {/* Cart Header */}
            <div className="flex items-center justify-between border-b border-editorial-border bg-editorial-bg px-5 py-4">
              <div className="flex items-center space-x-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-none bg-editorial-ink text-white">
                  <ShoppingBag className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h2 className="font-serif text-sm font-bold text-editorial-ink leading-none">Your Room Combo</h2>
                  <span className="text-[10px] text-editorial-accent font-semibold tracking-wider uppercase block mt-1">
                    {totalCartCount} pieces selected
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent border border-editorial-border hover:bg-editorial-ink hover:text-white text-editorial-ink transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Free shipping banner */}
            <div className="bg-editorial-bg border-b border-editorial-border px-5 py-3 flex items-center space-x-2 text-[10px] uppercase tracking-wider font-semibold text-editorial-accent">
              <Truck className="h-4 w-4 text-editorial-accent shrink-0" />
              <span>
                {remainingForFreeShipping > 0 ? (
                  <>
                    Add <strong className="font-bold text-editorial-ink">${remainingForFreeShipping}</strong> more for{" "}
                    <strong className="text-editorial-ink">FREE Secure International Shipping</strong>!
                  </>
                ) : (
                  <strong className="text-editorial-ink">Your shipment qualifies for FREE secure cargo shipping!</strong>
                )}
              </span>
            </div>

            {/* Scrollable list of items */}
            <div className="flex-1 overflow-y-auto px-5 py-6 bg-editorial-bg/30 space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-editorial-border text-editorial-ink mb-3">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                  <h3 className="text-editorial-ink font-serif font-semibold text-sm">Your Cart is Empty</h3>
                  <p className="text-editorial-accent text-xs font-light max-w-xs mt-1">
                    Explore our soft furniture catalogue and choose items to add, or stage them in AR.
                  </p>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      setView("catalog");
                    }}
                    className="mt-4 rounded-none bg-editorial-ink text-white text-[10px] uppercase tracking-[0.2em] font-bold px-5 py-3 hover:bg-editorial-accent transition-all"
                  >
                    Browse Collections
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-editorial-border space-y-4">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex items-center justify-between pt-4 first:pt-0 animate-fade-in">
                      <div className="flex items-center space-x-3.5">
                        <div className="h-14 w-14 overflow-hidden rounded-none bg-white shrink-0 border border-editorial-border">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="h-full w-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-editorial-ink line-clamp-1">{item.product.name}</h4>
                          <span className="text-[9px] font-bold text-editorial-accent block mt-0.5 uppercase tracking-wider">{item.product.category}</span>
                          <span className="text-xs font-bold text-editorial-ink block mt-1">${item.product.price}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3.5">
                        {/* Quantity picker */}
                        <div className="flex items-center space-x-1.5 bg-editorial-accent-light p-0.5 rounded-none border border-editorial-border">
                          <button
                            onClick={() => handleUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                            className="h-5 w-5 bg-white text-editorial-ink hover:bg-editorial-ink hover:text-white flex items-center justify-center rounded-none shadow-xs transition-colors"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold text-editorial-ink w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                            className="h-5 w-5 bg-white text-editorial-ink hover:bg-editorial-ink hover:text-white flex items-center justify-center rounded-none shadow-xs transition-colors"
                          >
                            +
                          </button>
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => handleRemoveFromCart(item.product.id)}
                          className="text-editorial-accent hover:text-red-600 p-1.5 hover:bg-white rounded-none transition-all border border-transparent hover:border-editorial-border"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Drawer Subtotal and Proceed Box */}
            {cart.length > 0 && (
              <div className="border-t border-editorial-border p-5 space-y-4 bg-editorial-bg shadow-sm">
                <div className="flex justify-between items-baseline">
                  <span className="text-[10px] font-bold text-editorial-accent uppercase tracking-widest">Subtotal:</span>
                  <span className="text-xl font-bold text-editorial-ink font-serif">${cartSubtotal}</span>
                </div>
                
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setView("checkout");
                  }}
                  className="w-full flex items-center justify-center space-x-2 rounded-none bg-editorial-ink hover:bg-editorial-accent text-white font-bold py-4 text-[10px] tracking-[0.2em] uppercase transition-all shadow-none group"
                >
                  <span>Secure International Checkout</span>
                  <ArrowRight className="h-4 w-4 text-white group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Floating Sparkly AI Advisor launcher (visible when not open) */}
      {!isAIAdvisorOpen && (
        <button
          onClick={() => setIsAIAdvisorOpen(true)}
          className="fixed bottom-6 left-6 z-30 flex items-center space-x-2.5 rounded-none bg-editorial-ink hover:bg-editorial-accent hover:scale-[1.02] text-white px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.2em] transition-all shadow-xl border border-editorial-border"
        >
          <Sparkles className="h-4.5 w-4.5 text-editorial-accent animate-pulse" />
          <span>Decor Consultation</span>
        </button>
      )}

      {/* AI Advisor Sliding Panel Drawer */}
      <AIDecorAssistant
        isOpen={isAIAdvisorOpen}
        onClose={() => setIsAIAdvisorOpen(false)}
        onTryInAR={handleTryInAR}
        onAddToCart={handleAddToCart}
      />

      {/* Global Footer */}
      <Footer onAdminClick={() => setView("admin")} />

    </div>
  );
}
