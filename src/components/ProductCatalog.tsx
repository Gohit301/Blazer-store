import React, { useState } from "react";
import { Product } from "../types";
import { PRODUCTS, MOCK_REVIEWS } from "../data";
import { Plus, Eye, Star, X, Sparkles, MoveRight, ShoppingBag } from "lucide-react";

interface ProductCatalogProps {
  products?: Product[];
  onAddToCart: (product: Product) => void;
  onTryInAR: (product: Product) => void;
  openAIAdvisor: () => void;
}

type CategoryFilter = "all" | "poufs" | "cushions" | "stools" | "sofas" | "throws" | "rugs" | "chairs";

export default function ProductCatalog({
  products = PRODUCTS,
  onAddToCart,
  onTryInAR,
  openAIAdvisor,
}: ProductCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Premium features
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "price-low" | "price-high" | "rating">("default");
  const [selectedSwatches, setSelectedSwatches] = useState<Record<string, number>>({});

  // Product Swatches mapping for premium variant previewing
  const SWATCHES: Record<string, Array<{ name: string; color: string; image: string }>> = {
    "sg-001": [
      { name: "Cream Bouclé", color: "#F7F5F0", image: "https://images.unsplash.com/photo-1581428982868-e410dd047a90?auto=format&fit=crop&w=600&q=80" },
      { name: "Charcoal Slub", color: "#3B3B39", image: "https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&w=600&q=80" },
      { name: "Sienna Earth", color: "#B8735C", image: "https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=600&q=80" }
    ],
    "sg-002": [
      { name: "Natural Mango", color: "#DAB68F", image: "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=600&q=80" },
      { name: "Ebonized Ash", color: "#252525", image: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=600&q=80" }
    ],
    "sg-003": [
      { name: "Royal Indigo", color: "#1E3B5C", image: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=600&q=80" },
      { name: "Oatmeal Flax", color: "#E0D7C5", image: "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&w=600&q=80" }
    ],
    "sg-004": [
      { name: "Tuscan Ochre", color: "#D19C4C", image: "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=600&q=80" },
      { name: "Forest Spruce", color: "#2C4C3E", image: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=600&q=80" }
    ],
    "sg-005": [
      { name: "Warm Herringbone", color: "#CBB9A5", image: "https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=600&q=80" },
      { name: "Nordic Sage", color: "#8E9B8D", image: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=600&q=80" }
    ],
    "sg-009": [
      { name: "Cream Dhurrie", color: "#F0EAE1", image: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=600&q=80" },
      { name: "Sienna Jute Blend", color: "#B37B5C", image: "https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=600&q=80" },
      { name: "Oceanic Indigo", color: "#2B475D", image: "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&w=600&q=80" }
    ],
    "sg-010": [
      { name: "Pebble Bouclé", color: "#E5E1DA", image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=600&q=80" },
      { name: "Terracotta Velvet", color: "#BC5A42", image: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=600&q=80" },
      { name: "Olive Linen", color: "#5F6C5B", image: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=600&q=80" }
    ],
    "sg-011": [
      { name: "Warm Amber", color: "#D99B5E", image: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=600&q=80" },
      { name: "Tuscan Rose", color: "#C58F87", image: "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&w=600&q=80" }
    ]
  };

  // Filter & Search & Sort products
  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.materials.some(m => m.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "price-high") return b.price - a.price;
    if (sortBy === "rating") return b.rating - a.rating;
    return 0; // default order
  });

  return (
    <div className="bg-editorial-bg min-h-screen">
      {/* Editorial Hero Banner */}
      <section className="relative overflow-hidden bg-editorial-accent-soft py-20 sm:py-28 text-editorial-ink border-b border-editorial-border texture-overlay">
        <div className="absolute inset-0 opacity-15 mix-blend-multiply">
          <img
            src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1920&q=80"
            alt="Loom & Layer Showroom backdrop"
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center sm:text-left">
          <div className="max-w-3xl">
            <span className="inline-flex items-center space-x-2 bg-editorial-accent text-white uppercase text-[9px] tracking-[0.25em] font-bold px-4 py-1.5 rounded-none">
              <Sparkles className="h-3.5 w-3.5 text-white animate-pulse" />
              <span>Indo-Nordic Craft Fusion</span>
            </span>
            <h1 className="mt-8 font-serif text-4xl sm:text-6xl font-normal tracking-tight text-editorial-ink leading-[1.15]">
              Soft Seating. <br className="hidden sm:inline" />
              <span className="italic font-light text-editorial-accent">Hand-woven by Loom & Layer.</span>
            </h1>
            <p className="mt-6 text-sm sm:text-base leading-relaxed text-editorial-ink/75 font-light max-w-2xl">
              Experience Jodhpur's exquisite textile hand-weaving tradition fused with Copenhagen's clean, minimalist architectural lines. Every piece is woven with organic yarns and structured by master woodworkers.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                onClick={openAIAdvisor}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded-none bg-editorial-ink hover:bg-editorial-accent text-white font-bold px-6 py-4 text-[10px] tracking-[0.2em] uppercase transition-all shadow-none"
              >
                <span>Consult AI Decorator</span>
                <MoveRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  const element = document.getElementById("products-grid");
                  element?.scrollIntoView({ behavior: "smooth" });
                }}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded-none bg-transparent hover:bg-editorial-accent-light text-editorial-ink border border-editorial-ink px-6 py-4 text-[10px] tracking-[0.2em] uppercase transition-all"
              >
                <span>Explore Pieces</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog Content */}
      <section id="products-grid" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-editorial-border pb-8">
          <div>
            <span className="text-[9px] font-bold tracking-[0.25em] text-editorial-accent uppercase">
              Exquisite Handloom Collections
            </span>
            <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-medium text-editorial-ink">
              The Living Room Suite
            </h2>
          </div>

          {/* Filtering Tabs */}
          <div className="mt-6 md:mt-0 flex flex-wrap gap-2 overflow-x-auto pb-1">
            {(["all", "poufs", "cushions", "stools", "sofas", "throws", "rugs", "chairs"] as CategoryFilter[]).map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-5 py-2 text-[10px] font-bold tracking-[0.15em] transition-all uppercase shrink-0 rounded-none border ${
                  selectedCategory === category
                    ? "bg-editorial-ink text-white border-editorial-ink shadow-sm"
                    : "bg-transparent text-editorial-ink/55 border-editorial-border hover:bg-white hover:text-editorial-ink hover:border-editorial-ink"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Sort Panel */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 p-4 bg-editorial-accent-soft border border-editorial-border">
          <div className="w-full sm:max-w-md relative">
            <input
              type="text"
              placeholder="Search by name, fabric, or craftsmanship description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-editorial-border px-4 py-2.5 text-xs text-editorial-ink focus:outline-none focus:border-editorial-ink rounded-none placeholder-editorial-ink/40"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-editorial-accent hover:text-editorial-ink font-bold"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto shrink-0 justify-end text-xs font-bold uppercase tracking-wider text-editorial-ink">
            <span className="text-editorial-accent text-[10px]">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-editorial-border px-3 py-2 text-xs font-bold uppercase tracking-wider text-editorial-ink focus:outline-none focus:border-editorial-ink rounded-none cursor-pointer"
            >
              <option value="default">Release Date</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Best Customer Rating</option>
            </select>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {filteredProducts.map((product) => {
            const swatchIdx = selectedSwatches[product.id] ?? 0;
            const productSwatches = SWATCHES[product.id];
            const hasSwatches = !!productSwatches;
            const cardImg = hasSwatches ? productSwatches[swatchIdx].image : product.image;
            const swatchName = hasSwatches ? productSwatches[swatchIdx].name : null;

            return (
              <div
                key={product.id}
                className="group relative flex flex-col overflow-hidden rounded-none bg-white border border-editorial-border p-4 hover:border-editorial-ink hover:shadow-xl transition-all duration-300"
              >
                {/* Image Container */}
                <div 
                  className="relative aspect-square w-full overflow-hidden rounded-none bg-editorial-accent-soft cursor-pointer border border-editorial-border/30"
                  onClick={() => setSelectedProduct(product)}
                >
                  <img
                    src={cardImg}
                    alt={product.name}
                    className="h-full w-full object-cover object-center transition-transform duration-750 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Floating Tags */}
                  <div className="absolute left-3 top-3 flex flex-col space-y-1">
                    {product.rating >= 4.9 && (
                      <span className="bg-editorial-ink text-white px-2.5 py-1 text-[8px] font-bold uppercase tracking-wider">
                        Best Rated
                      </span>
                    )}
                  </div>

                  {/* Direct Action Overlay */}
                  <div className="absolute inset-0 bg-editorial-ink/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTryInAR(product);
                      }}
                      className="flex items-center space-x-1.5 rounded-none bg-white border border-editorial-ink px-4 py-2 text-[9px] font-bold text-editorial-ink tracking-[0.15em] uppercase hover:bg-editorial-ink hover:text-white transition-all transform translate-y-2 group-hover:translate-y-0"
                    >
                      <Eye className="h-3 w-3 text-editorial-accent" />
                      <span>Try in AR</span>
                    </button>
                  </div>
                </div>

                {/* Product Info */}
                <div className="mt-4 flex flex-1 flex-col justify-between">
                  <div className="cursor-pointer" onClick={() => setSelectedProduct(product)}>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-editorial-accent">
                        {product.category} {swatchName && `• ${swatchName}`}
                      </span>
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 fill-editorial-accent text-editorial-accent" />
                        <span className="text-[11px] font-semibold text-editorial-ink">{product.rating}</span>
                      </div>
                    </div>
                    <h3 className="mt-2 font-serif text-sm font-medium text-editorial-ink group-hover:text-editorial-accent transition-colors">
                      {product.name}
                    </h3>
                    <p className="mt-2 text-xs text-editorial-ink/70 line-clamp-2 font-light leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  {/* Color Swatch Selectors */}
                  {hasSwatches && (
                    <div className="mt-3 flex items-center space-x-2 border-t border-dashed border-editorial-border/40 pt-2.5">
                      <span className="text-[8px] font-bold text-editorial-accent uppercase tracking-wider">Finish:</span>
                      <div className="flex items-center space-x-1.5">
                        {productSwatches.map((swatch, idx) => (
                          <button
                            key={swatch.name}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSwatches((prev) => ({ ...prev, [product.id]: idx }));
                            }}
                            className={`h-4 w-4 rounded-full border transition-all cursor-pointer ${
                              swatchIdx === idx
                                ? "ring-2 ring-editorial-ink ring-offset-1 border-transparent"
                                : "border-editorial-border hover:scale-110"
                            }`}
                            style={{ backgroundColor: swatch.color }}
                            title={swatch.name}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                {/* Footer section with Price and Add to Cart */}
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-editorial-border">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-editorial-accent font-bold tracking-wider uppercase">Export Price</span>
                    <span className="text-base font-serif font-bold text-editorial-ink">${product.price}</span>
                  </div>
                  <button
                    onClick={() => onAddToCart(product)}
                    className="flex h-9 w-9 items-center justify-center rounded-none bg-editorial-accent-soft hover:bg-editorial-ink hover:text-white border border-editorial-border hover:border-editorial-ink text-editorial-ink transition-all"
                    title="Add to cart"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      </section>

      {/* CRAFT AND SUSTAINABILITY MANIFESTO SECTION */}
      <section className="bg-editorial-accent-soft py-20 border-t border-b border-editorial-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-[9px] font-bold tracking-[0.25em] text-editorial-accent uppercase">
              The Loom & Layer Standard
            </span>
            <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-normal text-editorial-ink">
              Craftsmanship & Sustainable Integrity
            </h2>
            <p className="mt-4 text-xs sm:text-sm text-editorial-ink/70 font-light leading-relaxed">
              We operate at the nexus of Indian handloom heritage and Scandinavian ecological rigor. Every piece of furniture leaving our Jodhpur facility is certified for quality and social responsibility.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Aspect 1: The Weaver Cooperative */}
            <div className="bg-white border border-editorial-border p-6 sm:p-8 flex flex-col justify-between hover:shadow-lg transition-all duration-300">
              <div className="space-y-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-none bg-editorial-accent-soft text-editorial-ink font-serif text-sm font-bold border border-editorial-border">
                  01
                </div>
                <h3 className="font-serif text-lg font-bold text-editorial-ink">The Weaver Cooperative</h3>
                <p className="text-xs text-editorial-ink/75 leading-relaxed font-light">
                  We support over 120 artisan families in Rajasthan through fair-trade wage guarantees, safe work conditions, and ongoing handloom raw material subsidies. Every purchase directly drives independent local micro-economies.
                </p>
              </div>
              <span className="text-[9px] text-editorial-accent font-bold uppercase tracking-wider block mt-6">
                100% Fair wage certified
              </span>
            </div>

            {/* Aspect 2: Organic Threads Only */}
            <div className="bg-white border border-editorial-border p-6 sm:p-8 flex flex-col justify-between hover:shadow-lg transition-all duration-300">
              <div className="space-y-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-none bg-editorial-accent-soft text-editorial-ink font-serif text-sm font-bold border border-editorial-border">
                  02
                </div>
                <h3 className="font-serif text-lg font-bold text-editorial-ink">Eco-Thread Certification</h3>
                <p className="text-xs text-editorial-ink/75 leading-relaxed font-light">
                  Our raw cotton, wool, and jute fibers meet the Global Organic Textile Standard (GOTS). We use natural plant-based indigo, madder root, and pomegranate peel dye solutions to ensure completely zero toxic residue.
                </p>
              </div>
              <span className="text-[9px] text-editorial-accent font-bold uppercase tracking-wider block mt-6">
                Gots certified organic fibers
              </span>
            </div>

            {/* Aspect 3: Zero-Waste Mango Wood */}
            <div className="bg-white border border-editorial-border p-6 sm:p-8 flex flex-col justify-between hover:shadow-lg transition-all duration-300">
              <div className="space-y-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-none bg-editorial-accent-soft text-editorial-ink font-serif text-sm font-bold border border-editorial-border">
                  03
                </div>
                <h3 className="font-serif text-lg font-bold text-editorial-ink">Zero-Waste Timber</h3>
                <p className="text-xs text-editorial-ink/75 leading-relaxed font-light">
                  Our solid mango and acacia wood components are sourced exclusively from agricultural tree orchard salvage. When fruit trees stop yielding, they are repurposed for furniture, preventing farm burn-off and carbon emissions.
                </p>
              </div>
              <span className="text-[9px] text-editorial-accent font-bold uppercase tracking-wider block mt-6">
                Sustainably harvested orchard wood
              </span>
            </div>

          </div>
        </div>
      </section>

      {/* Product Detail Modal/Drawer */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-editorial-ink/60 backdrop-blur-md">
          <div className="relative w-full max-w-3xl overflow-hidden rounded-none bg-white border border-editorial-ink shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-editorial-accent-soft border border-editorial-border text-editorial-ink hover:bg-editorial-ink hover:text-white transition-all shadow-xs"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Content Container */}
            <div className="grid grid-cols-1 md:grid-cols-2 max-h-[85vh] overflow-y-auto">
              
              {/* Left Column: Image */}
              <div className="relative h-64 md:h-full min-h-[350px] bg-editorial-accent-soft">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="absolute h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Right Column: Information */}
              <div className="p-6 sm:p-8 flex flex-col justify-between bg-white">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-editorial-accent">
                    {selectedProduct.category} Collection
                  </span>
                  <h2 className="mt-1 font-serif text-xl sm:text-2xl font-bold text-editorial-ink">
                    {selectedProduct.name}
                  </h2>
                  <div className="mt-2 flex items-center space-x-2">
                    <div className="flex items-center space-x-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < Math.floor(selectedProduct.rating)
                              ? "fill-editorial-accent text-editorial-accent"
                              : "text-editorial-accent-light"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-editorial-ink">{selectedProduct.rating} / 5.0</span>
                    <span className="text-[11px] text-editorial-accent">({selectedProduct.reviewsCount} verified customer reviews)</span>
                  </div>

                  <p className="mt-4 text-xs sm:text-sm text-editorial-ink/75 leading-relaxed font-light">
                    {selectedProduct.description}
                  </p>

                  {/* Specifications */}
                  <div className="mt-6 grid grid-cols-2 gap-4 border-t border-editorial-border pt-4">
                    <div>
                      <span className="block text-[9px] font-bold uppercase text-editorial-accent tracking-wider">Dimensions</span>
                      <span className="text-xs font-semibold text-editorial-ink">{selectedProduct.dimensions}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold uppercase text-editorial-accent tracking-wider">Craft Materials</span>
                      <span className="text-xs font-semibold text-editorial-ink line-clamp-1">{selectedProduct.materials.join(", ")}</span>
                    </div>
                  </div>

                  {/* Care instructions */}
                  <div className="mt-4 bg-editorial-accent-soft rounded-none p-3.5 border border-editorial-border">
                    <span className="block text-[9px] font-bold uppercase text-editorial-accent tracking-wider mb-1">Care & Maintenance</span>
                    <span className="text-[11px] text-editorial-ink/70 leading-relaxed font-light block">{selectedProduct.careInstructions}</span>
                  </div>
                </div>

                {/* Order Tray */}
                <div className="mt-8 border-t border-editorial-border pt-6 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[9px] text-editorial-accent font-bold block uppercase tracking-wider">Direct Price</span>
                    <span className="text-2xl font-serif font-bold text-editorial-ink">${selectedProduct.price}</span>
                  </div>

                  <div className="flex space-x-2 w-2/3">
                    <button
                      onClick={() => {
                        onTryInAR(selectedProduct);
                        setSelectedProduct(null);
                      }}
                      className="flex-1 flex items-center justify-center space-x-1.5 rounded-none border border-editorial-ink text-editorial-ink text-[10px] uppercase tracking-wider font-bold py-3 hover:bg-editorial-accent-light transition-all"
                    >
                      <Eye className="h-3.5 w-3.5 text-editorial-accent" />
                      <span>Try in AR</span>
                    </button>
                    <button
                      onClick={() => {
                        onAddToCart(selectedProduct);
                        setSelectedProduct(null);
                      }}
                      className="flex-1 flex items-center justify-center space-x-1.5 rounded-none bg-editorial-ink text-white text-[10px] uppercase tracking-wider font-bold py-3 hover:bg-editorial-accent transition-all shadow-none"
                    >
                      <ShoppingBag className="h-3.5 w-3.5" />
                      <span>Add to Order</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
