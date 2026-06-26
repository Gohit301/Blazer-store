import React, { useState } from "react";
import { CartItem, Order, Product, CountryRate, CouponCode } from "../types";
import { CreditCard, Shield, Truck, Printer, ArrowLeft, CheckCircle, Percent, Plus, Minus, Trash2 } from "lucide-react";

interface PaymentGatewayProps {
  countries?: CountryRate[];
  coupons?: CouponCode[];
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveFromCart: (productId: string) => void;
  onClearCart: () => void;
  setView: (view: "catalog" | "ar-studio" | "checkout") => void;
}

export default function PaymentGateway({
  countries = [],
  coupons = [],
  cart,
  onUpdateQuantity,
  onRemoveFromCart,
  onClearCart,
  setView,
}: PaymentGatewayProps) {
  // Coupon state
  const [coupon, setCoupon] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  // Form states
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("United States");

  // Credit Card Interactive states
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVC, setCardCVC] = useState("");
  const [cardFocusedField, setCardFocusedField] = useState<"front" | "back">("front");

  // Payment progress
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "completed">("idle");
  const [processingStep, setProcessingStep] = useState("");
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Dynamic selected country rate configuration
  const activeCountryData = countries.find(c => c.name.toLowerCase() === country.toLowerCase()) || {
    name: "United States",
    taxRate: 8,
    shippingFee: 25,
    freeShippingThreshold: 150,
    currency: "USD",
    currencySymbol: "$"
  };

  // Financial Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discountAmount = Math.round(subtotal * (discountPercent / 100));
  const shipping = subtotal >= activeCountryData.freeShippingThreshold ? 0 : activeCountryData.shippingFee;
  const tax = Math.round((subtotal - discountAmount) * (activeCountryData.taxRate / 100));
  const total = subtotal - discountAmount + shipping + tax;

  // Synchronize country selection with dynamic countries
  React.useEffect(() => {
    if (countries.length > 0 && !countries.some(c => c.name.toLowerCase() === country.toLowerCase())) {
      setCountry(countries[0].name);
    }
  }, [countries]);

  // Format credit card number with spacing (xxxx xxxx xxxx xxxx)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 16) value = value.slice(0, 16);
    const matches = value.match(/\d{1,4}/g);
    const formatted = matches ? matches.join(" ") : "";
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length >= 2) {
      setCardExpiry(`${value.slice(0, 2)}/${value.slice(2)}`);
    } else {
      setCardExpiry(value);
    }
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 3) value = value.slice(0, 3);
    setCardCVC(value);
  };

  // Coupon handling
  const applyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    setCouponSuccess(null);

    const code = coupon.trim().toUpperCase();
    const foundCoupon = coupons.find(c => c.code.toUpperCase() === code);
    if (foundCoupon) {
      setDiscountPercent(foundCoupon.discountPercent);
      setCouponSuccess(`Promo '${foundCoupon.code}' applied: ${foundCoupon.discountPercent}% discount! ${foundCoupon.description}`);
    } else {
      const activeCodesHint = coupons.map(c => c.code).slice(0, 3).join(", ");
      setCouponError(`Invalid promo code.${activeCodesHint ? ` Try: ${activeCodesHint}` : ""}`);
    }
  };

  // Submit payment
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    // Start payment processing steps
    setPaymentStatus("processing");
    
    const steps = [
      "Contacting international banking server...",
      "Encrypting payload via global ledger endpoints...",
      "Validating shipping limits and addresses...",
      "Securing tokenized transaction... Almost there!"
    ];

    let currentStep = 0;
    setProcessingStep(steps[currentStep]);

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setProcessingStep(steps[currentStep]);
      } else {
        clearInterval(interval);
        
        // Finalize transaction and spawn real downloadable order invoice
        const finalOrder: Order = {
          id: `SG-ORD-${Math.floor(100000 + Math.random() * 900000)}`,
          items: [...cart],
          subtotal,
          tax,
          shipping,
          discount: discountAmount,
          total,
          customerName,
          customerEmail,
          shippingAddress: {
            street,
            city,
            state,
            postalCode,
            country,
          },
          cardLastFour: cardNumber.slice(-4) || "4242",
          paymentMethod: "Visa Premium Ledger",
          timestamp: new Date().toLocaleString(),
        };

        setCompletedOrder(finalOrder);
        setPaymentStatus("completed");
        onClearCart();
      }
    }, 1200);
  };

  // Print invoice
  const triggerPrint = () => {
    window.print();
  };

  // Success Screen Invoice
  if (paymentStatus === "completed" && completedOrder) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8 print:p-0">
        <div className="rounded-none bg-white border border-editorial-ink p-8 shadow-2xl space-y-6 print:border-none print:shadow-none">
          
          {/* Header invoice badge */}
          <div className="flex flex-col items-center text-center space-y-2 border-b border-editorial-border pb-6 print:text-left print:items-start">
            <CheckCircle className="h-12 w-12 text-editorial-accent print:hidden" />
            <h1 className="font-serif text-2xl font-bold text-editorial-ink">Purchase Transaction Completed</h1>
            <p className="text-xs text-editorial-accent font-light">
              Your secure international cargo shipment is being processed. Below is your official commercial invoice.
            </p>
          </div>

          {/* Core Invoice Layout */}
          <div className="space-y-4">
            <div className="flex justify-between items-start text-xs">
              <div>
                <span className="font-bold text-editorial-ink block font-serif uppercase tracking-wide">Loom & Layer Studio</span>
                <span className="text-editorial-accent block mt-1">Basni Industrial Area, Phase II</span>
                <span className="text-editorial-accent block">Jodhpur, Rajasthan, India</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-editorial-ink block">{completedOrder.id}</span>
                <span className="text-editorial-accent block mt-1">{completedOrder.timestamp}</span>
                <span className="text-editorial-accent font-semibold block mt-1">{completedOrder.paymentMethod}</span>
              </div>
            </div>

            {/* Ship-to details */}
            <div className="bg-editorial-accent-soft rounded-none p-4 border border-editorial-border grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[9px] font-bold text-editorial-accent uppercase tracking-wider block">Customer</span>
                <span className="font-semibold text-editorial-ink block mt-1">{completedOrder.customerName}</span>
                <span className="text-editorial-ink/75 block">{completedOrder.customerEmail}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-editorial-accent uppercase tracking-wider block">Shipping Destination</span>
                <span className="text-editorial-ink block mt-1">{completedOrder.shippingAddress.street}</span>
                <span className="text-editorial-ink block">
                  {completedOrder.shippingAddress.city}, {completedOrder.shippingAddress.state} {completedOrder.shippingAddress.postalCode}
                </span>
                <span className="text-editorial-ink/75 block">{completedOrder.shippingAddress.country}</span>
              </div>
            </div>

            {/* Line Items Grid */}
            <div className="border border-editorial-border rounded-none overflow-hidden">
              <table className="w-full text-left text-xs divide-y divide-editorial-border">
                <thead className="bg-editorial-accent-soft font-bold text-editorial-ink">
                  <tr>
                    <th className="px-4 py-2.5 uppercase tracking-wider text-[9px]">Staged Piece</th>
                    <th className="px-4 py-2.5 text-center uppercase tracking-wider text-[9px]">Qty</th>
                    <th className="px-4 py-2.5 text-right uppercase tracking-wider text-[9px]">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-editorial-border text-editorial-ink font-light">
                  {completedOrder.items.map((item) => (
                    <tr key={item.product.id}>
                      <td className="px-4 py-3 font-medium text-editorial-ink">{item.product.name}</td>
                      <td className="px-4 py-3 text-center font-medium">{item.quantity}</td>
                      <td className="px-4 py-3 text-right font-semibold text-editorial-ink">${item.product.price * item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial breakups */}
            <div className="border-t border-editorial-border pt-4 flex flex-col items-end space-y-1.5 text-xs text-editorial-ink/80">
              <div className="flex justify-between w-64">
                <span>Items Subtotal:</span>
                <span>${completedOrder.subtotal}</span>
              </div>
              {completedOrder.discount > 0 && (
                <div className="flex justify-between w-64 text-emerald-700">
                  <span>Ledger Discount:</span>
                  <span>-${completedOrder.discount}</span>
                </div>
              )}
              <div className="flex justify-between w-64">
                <span>Secure Customs Shipping:</span>
                <span>{completedOrder.shipping === 0 ? "FREE" : `$${completedOrder.shipping}`}</span>
              </div>
              <div className="flex justify-between w-64">
                <span>International Customs & Tax (8%):</span>
                <span>${completedOrder.tax}</span>
              </div>
              <div className="flex justify-between w-64 border-t border-editorial-border pt-2 text-sm font-bold text-editorial-ink font-serif">
                <span>Total Payment:</span>
                <span>${completedOrder.total}</span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex space-x-3 pt-4 print:hidden">
            <button
              onClick={triggerPrint}
              className="flex-1 flex items-center justify-center space-x-1.5 rounded-none border border-editorial-ink bg-transparent hover:bg-editorial-accent-soft text-editorial-ink text-[10px] font-bold uppercase tracking-widest py-3 transition-all"
            >
              <Printer className="h-4 w-4" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={() => {
                setPaymentStatus("idle");
                setCompletedOrder(null);
                setView("catalog");
              }}
              className="flex-1 flex items-center justify-center space-x-1.5 rounded-none bg-editorial-ink hover:bg-editorial-accent text-white text-[10px] font-bold uppercase tracking-widest py-3 transition-all shadow-none"
            >
              <span>Back to Showroom</span>
            </button>
          </div>

        </div>
      </div>
    );
  }

  // Processing loader screen
  if (paymentStatus === "processing") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 max-w-md mx-auto">
        <div className="relative flex items-center justify-center h-20 w-20 rounded-none bg-editorial-accent-soft border border-editorial-border shadow-inner mb-6">
          <div className="absolute h-14 w-14 rounded-none border-2 border-t-editorial-accent border-r-transparent border-b-transparent border-l-editorial-border animate-spin" />
          <CreditCard className="h-6 w-6 text-editorial-accent animate-pulse" />
        </div>
        <h2 className="font-serif text-lg font-bold text-editorial-ink">Authorizing Ledger Gateway</h2>
        <p className="text-xs text-editorial-accent mt-2 leading-relaxed animate-pulse">{processingStep}</p>
        <span className="text-[10px] text-editorial-accent font-bold uppercase tracking-widest mt-8 flex items-center space-x-1.5">
          <Shield className="h-3.5 w-3.5 text-editorial-accent" />
          <span>PCI-DSS Secured 256-bit encryption</span>
        </span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Return button */}
      <button
        onClick={() => setView("catalog")}
        className="flex items-center space-x-1.5 text-xs font-bold text-editorial-accent hover:text-editorial-ink mb-6 group transition-all uppercase tracking-widest"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-all" />
        <span>Return to Catalog</span>
      </button>

      {/* Grid: 2 Cols (Left = Checkout, Right = Cart Overview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* LEFT COLUMN: Billing, Shipping & Interactive Card (7 Cols) */}
        <div className="lg:col-span-7 space-y-8">
          <h2 className="font-serif text-2xl font-bold text-editorial-ink">Secure Global Checkout</h2>

          {/* INTERACTIVE DIGITAL CREDIT CARD DESIGN */}
          <div className="relative h-48 w-full max-w-sm mx-auto rounded-none overflow-hidden shadow-xl text-white transition-all duration-300 transform border border-editorial-ink/10">
            <div 
              className={`absolute inset-0 bg-gradient-to-br transition-all duration-300 ${
                cardFocusedField === "back" 
                  ? "from-[#1c1a17] to-[#12110f]" 
                  : "from-editorial-ink via-[#24211e] to-editorial-ink"
              }`}
            />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/5 to-transparent" />

            {/* FRONT OF THE CARD */}
            {cardFocusedField === "front" ? (
              <div className="relative h-full p-6 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[8px] font-bold tracking-[0.2em] text-editorial-accent uppercase leading-none">Loom & Layer Ledger</span>
                    <span className="text-xs font-serif italic tracking-widest block text-white/90">Visa Corporate</span>
                  </div>
                  <div className="h-8 w-11 rounded-none border border-editorial-accent/30 bg-transparent flex items-center justify-center font-bold text-[8px] tracking-wider uppercase text-editorial-accent">
                    Secure
                  </div>
                </div>

                {/* Card number */}
                <div className="font-mono text-base tracking-widest text-center text-white/90">
                  {cardNumber || "•••• •••• •••• ••••"}
                </div>

                {/* Name & Expiry row */}
                <div className="flex justify-between items-end text-xs">
                  <div className="max-w-[70%]">
                    <span className="text-[8px] font-bold text-editorial-accent block uppercase tracking-wider">Exporter profile</span>
                    <span className="font-serif italic block truncate text-white/95">{customerName || "Your Full Name"}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] font-bold text-editorial-accent block uppercase tracking-wider">Expiry</span>
                    <span className="font-mono block text-white/95">{cardExpiry || "MM/YY"}</span>
                  </div>
                </div>
              </div>
            ) : (
              /* BACK OF THE CARD */
              <div className="relative h-full py-6 flex flex-col justify-between">
                {/* Magnetic tape stripe */}
                <div className="h-9 w-full bg-[#12110f]" />
                
                {/* Signature and CVC panel */}
                <div className="px-6 flex items-center space-x-3">
                  <div className="flex-1 h-8 bg-white/10 rounded-none border border-white/5" />
                  <div className="h-8 w-14 bg-white text-editorial-ink font-mono text-xs font-bold flex items-center justify-center rounded-none">
                    {cardCVC || "•••"}
                  </div>
                </div>

                <div className="px-6 text-[7px] font-bold text-white/30 tracking-widest text-right">
                  SECURITY TOKEN AUTHORIZATION REQUIRED
                </div>
              </div>
            )}
          </div>

          {/* CHECKOUT FORM */}
          <form onSubmit={handleCheckoutSubmit} className="space-y-6">
            
            {/* Step 1: Account details */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-editorial-accent">1. Client Profile</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  required
                  type="text"
                  placeholder="Full Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="rounded-none border border-editorial-border bg-editorial-accent-soft/50 px-4 py-3 text-xs text-editorial-ink placeholder-editorial-accent focus:outline-none focus:border-editorial-ink focus:bg-white"
                />
                <input
                  required
                  type="email"
                  placeholder="Email Address"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="rounded-none border border-editorial-border bg-editorial-accent-soft/50 px-4 py-3 text-xs text-editorial-ink placeholder-editorial-accent focus:outline-none focus:border-editorial-ink focus:bg-white"
                />
              </div>
            </div>

            {/* Step 2: Shipping details */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-editorial-accent">2. Secure Destination Cargo</h3>
              <div className="space-y-3">
                <input
                  required
                  type="text"
                  placeholder="Street Address"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="w-full rounded-none border border-editorial-border bg-editorial-accent-soft/50 px-4 py-3 text-xs text-editorial-ink placeholder-editorial-accent focus:outline-none focus:border-editorial-ink focus:bg-white"
                />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <input
                    required
                    type="text"
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="rounded-none border border-editorial-border bg-editorial-accent-soft/50 px-4 py-3 text-xs text-editorial-ink placeholder-editorial-accent focus:outline-none focus:border-editorial-ink focus:bg-white"
                  />
                  <input
                    required
                    type="text"
                    placeholder="State"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="rounded-none border border-editorial-border bg-editorial-accent-soft/50 px-4 py-3 text-xs text-editorial-ink placeholder-editorial-accent focus:outline-none focus:border-editorial-ink focus:bg-white"
                  />
                  <input
                    required
                    type="text"
                    placeholder="Zip / Postal"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="rounded-none border border-editorial-border bg-editorial-accent-soft/50 px-4 py-3 text-xs text-editorial-ink placeholder-editorial-accent focus:outline-none focus:border-editorial-ink focus:bg-white font-mono"
                  />
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="rounded-none border border-editorial-border bg-editorial-accent-soft/50 px-4 py-3 text-xs text-editorial-ink focus:outline-none focus:border-editorial-ink focus:bg-white"
                  >
                    {countries.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Step 3: Card inputs */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-editorial-accent">3. Ledger Transaction Keys</h3>
              <div className="space-y-3">
                <div className="relative">
                  <input
                    required
                    type="text"
                    placeholder="Visa Card Number (e.g. 4242 4242 4242 4242)"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    onFocus={() => setCardFocusedField("front")}
                    className="w-full rounded-none border border-editorial-border bg-editorial-accent-soft/50 pl-10 pr-4 py-3 text-xs text-editorial-ink placeholder-editorial-accent focus:outline-none focus:border-editorial-ink focus:bg-white font-mono"
                  />
                  <CreditCard className="absolute left-3.5 top-3.5 h-4 w-4 text-editorial-accent" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    required
                    type="text"
                    placeholder="Expiry (MM/YY)"
                    value={cardExpiry}
                    onChange={handleExpiryChange}
                    onFocus={() => setCardFocusedField("front")}
                    className="rounded-none border border-editorial-border bg-editorial-accent-soft/50 px-4 py-3 text-xs text-editorial-ink placeholder-editorial-accent focus:outline-none focus:border-editorial-ink focus:bg-white font-mono text-center"
                  />
                  <input
                    required
                    type="text"
                    placeholder="CVC Security Code"
                    value={cardCVC}
                    onChange={handleCvcChange}
                    onFocus={() => setCardFocusedField("back")}
                    onBlur={() => setCardFocusedField("front")}
                    className="rounded-none border border-editorial-border bg-editorial-accent-soft/50 px-4 py-3 text-xs text-editorial-ink placeholder-editorial-accent focus:outline-none focus:border-editorial-ink focus:bg-white font-mono text-center"
                  />
                </div>
              </div>
            </div>

            {/* Checkbox agreements */}
            <div className="flex items-start space-x-2.5">
              <input
                required
                type="checkbox"
                id="legal-agree"
                className="mt-1 rounded-none border-editorial-border accent-editorial-ink cursor-pointer h-3.5 w-3.5"
              />
              <label htmlFor="legal-agree" className="text-[11px] text-editorial-ink/70 leading-relaxed font-light cursor-pointer">
                I authorize Loom & Layer Studio to process FOB secure cargo. Under secure PCI-DSS ledger laws, my credit credentials are card-encrypted on transit layers.
              </label>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={cart.length === 0}
              className="w-full flex items-center justify-center space-x-2 rounded-none bg-editorial-ink hover:bg-editorial-accent text-white font-bold py-4 text-[10px] tracking-[0.2em] uppercase transition-all shadow-none disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <span>Authorize Payment & Confirm Cargo</span>
            </button>

          </form>
        </div>

        {/* RIGHT COLUMN: Cart Summary and Promo Code Box (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-editorial-border rounded-none p-6 shadow-xs space-y-6">
            <h3 className="font-serif text-lg font-semibold text-editorial-ink border-b border-editorial-border pb-3">Your Room Combo</h3>
            
            {/* Scrollable item list */}
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-editorial-accent font-light">Your shopping cart is currently empty.</p>
              </div>
            ) : (
              <div className="divide-y divide-editorial-border max-h-[300px] overflow-y-auto space-y-4 pr-1">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center justify-between pt-4 first:pt-0">
                    <div className="flex items-center space-x-3.5">
                      <div className="h-14 w-14 shrink-0 rounded-none overflow-hidden bg-editorial-accent-soft border border-editorial-border/30">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-editorial-ink line-clamp-1">{item.product.name}</h4>
                        <span className="text-[9px] font-bold text-editorial-accent uppercase tracking-wider block mt-0.5">
                          ${item.product.price} each
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3.5">
                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-1.5 bg-editorial-accent-soft p-1 rounded-none border border-editorial-border">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                          className="h-5 w-5 bg-white text-editorial-ink hover:bg-editorial-ink hover:text-white flex items-center justify-center rounded-none border border-editorial-border shadow-xs cursor-pointer"
                        >
                          <Minus className="h-2.5 w-2.5" />
                        </button>
                        <span className="text-xs font-bold text-editorial-ink w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                          className="h-5 w-5 bg-white text-editorial-ink hover:bg-editorial-ink hover:text-white flex items-center justify-center rounded-none border border-editorial-border shadow-xs cursor-pointer"
                        >
                          <Plus className="h-2.5 w-2.5" />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => onRemoveFromCart(item.product.id)}
                        className="text-editorial-accent hover:text-red-600 transition-all p-1.5 hover:bg-editorial-accent-soft rounded-none border border-transparent hover:border-editorial-border cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Promo code form */}
            <form onSubmit={applyPromo} className="border-t border-editorial-border pt-5 space-y-2">
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Coupon Code (e.g. SHIVGANGA10)"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    className="w-full rounded-none border border-editorial-border bg-editorial-accent-soft/50 px-3 pl-8 py-2 text-xs text-editorial-ink placeholder-editorial-accent focus:outline-none focus:border-editorial-ink focus:bg-white"
                  />
                  <Percent className="absolute left-3 top-2.5 h-3.5 w-3.5 text-editorial-accent" />
                </div>
                <button
                  type="submit"
                  className="rounded-none bg-editorial-ink hover:bg-editorial-accent text-white text-[10px] font-bold px-4 py-2 uppercase tracking-[0.15em] transition-all cursor-pointer border border-editorial-ink hover:border-editorial-accent"
                >
                  Apply
                </button>
              </div>
              
              {/* Promo success/error logs */}
              {couponError && <p className="text-[10px] text-red-600 font-medium pl-1 animate-pulse">{couponError}</p>}
              {couponSuccess && <p className="text-[10px] text-emerald-700 font-semibold pl-1 animate-pulse">{couponSuccess}</p>}
            </form>

            {/* Financial summary breakdown */}
            <div className="border-t border-editorial-border pt-5 space-y-3 text-xs text-editorial-ink/75">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span className="font-bold text-editorial-ink">${subtotal}</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Ledger Discount ({discountPercent}%):</span>
                  <span>-${discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Secure Customs Shipping:</span>
                <span className="font-bold text-editorial-ink">
                  {shipping === 0 ? "FREE" : `$${shipping}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Customs Cargo Tax (8%):</span>
                <span className="font-bold text-editorial-ink">${tax}</span>
              </div>
              <div className="flex justify-between border-t border-editorial-border pt-4 text-sm font-bold text-editorial-ink font-serif">
                <span>Total Due:</span>
                <span>${total}</span>
              </div>
            </div>

            {/* Quality seals */}
            <div className="border-t border-editorial-border pt-4 grid grid-cols-2 gap-3 text-[10px] text-editorial-accent font-semibold tracking-wider uppercase">
              <div className="flex items-center space-x-1.5">
                <Truck className="h-4 w-4 text-editorial-accent" />
                <span>Cargo Insured</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Shield className="h-4 w-4 text-editorial-accent" />
                <span>PCI-DSS SSL</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
