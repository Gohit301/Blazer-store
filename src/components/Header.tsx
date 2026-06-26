import React from "react";
import { ShoppingBag, Sparkles, Compass, Eye } from "lucide-react";

interface HeaderProps {
  currentView: "catalog" | "ar-studio" | "checkout";
  setView: (view: "catalog" | "ar-studio" | "checkout") => void;
  cartCount: number;
  toggleCart: () => void;
  openAIAdvisor: () => void;
}

export default function Header({
  currentView,
  setView,
  cartCount,
  toggleCart,
  openAIAdvisor,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-editorial-border bg-editorial-bg/90 backdrop-blur-md h-20 flex items-center">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo - Designed with Editorial minimal signature */}
        <div 
          className="flex cursor-pointer items-center space-x-3 group"
          onClick={() => setView("catalog")}
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-editorial-ink text-editorial-ink bg-transparent font-serif font-bold text-sm tracking-tighter transition-transform group-hover:scale-105">
            <span>LL</span>
            <div className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-editorial-accent animate-pulse" />
          </div>
          <div>
            <span className="block font-serif text-base font-bold uppercase tracking-wider text-editorial-ink leading-none">
              Loom & Layer
            </span>
            <span className="block text-[9px] font-semibold tracking-[0.25em] text-editorial-accent uppercase mt-1">
              Furnishings • Jodhpur
            </span>
          </div>
        </div>

        {/* View Navigation Tabs - Styled as spaced editorial menu text */}
        <nav className="hidden md:flex items-center space-x-6">
          <button
            onClick={() => setView("catalog")}
            className={`flex items-center space-x-2 transition-all py-1.5 uppercase text-[10px] tracking-[0.2em] font-semibold ${
              currentView === "catalog"
                ? "text-editorial-ink border-b-2 border-editorial-ink font-bold"
                : "text-editorial-ink/50 hover:text-editorial-ink"
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Discover Catalog</span>
          </button>
          
          <button
            onClick={() => setView("ar-studio")}
            className={`flex items-center space-x-2 transition-all py-1.5 uppercase text-[10px] tracking-[0.2em] font-semibold ${
              currentView === "ar-studio"
                ? "text-editorial-ink border-b-2 border-editorial-ink font-bold"
                : "text-editorial-ink/50 hover:text-editorial-ink"
            }`}
          >
            <Eye className="h-3.5 w-3.5 text-editorial-accent" />
            <span className="relative">
              3D & AR Studio
              <span className="absolute -top-3 -right-6 rounded-full bg-editorial-accent px-1 text-[7px] font-bold text-white uppercase tracking-normal scale-90">
                New
              </span>
            </span>
          </button>
        </nav>

        {/* Utility Actions */}
        <div className="flex items-center space-x-4">
          {/* AI Advisor Trigger Button - Styled as a sharp-cornered luxury link */}
          <button
            onClick={openAIAdvisor}
            className="flex items-center space-x-2 border border-editorial-ink bg-transparent text-editorial-ink font-bold uppercase tracking-[0.2em] text-[9px] px-4 py-2.5 rounded-none transition-all hover:bg-editorial-ink hover:text-white"
          >
            <Sparkles className="h-3 w-3 text-editorial-accent animate-pulse" />
            <span className="hidden sm:inline">AI Interior Advisor</span>
            <span className="sm:hidden">AI Advisor</span>
          </button>

          {/* Cart Trigger - Clean round ink button */}
          <button
            onClick={toggleCart}
            className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-editorial-border bg-transparent text-editorial-ink transition-all hover:bg-editorial-ink hover:text-white"
          >
            <ShoppingBag className="h-4 w-4 transition-transform group-hover:scale-110" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-editorial-ink border border-editorial-bg text-[9px] font-bold text-white shadow-sm">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Row */}
      <div className="flex md:hidden absolute top-20 left-0 right-0 border-t border-b border-editorial-border bg-editorial-bg/95 p-1 divide-x divide-editorial-border">
        <button
          onClick={() => setView("catalog")}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 text-[10px] tracking-[0.15em] uppercase font-bold ${
            currentView === "catalog" ? "text-editorial-ink" : "text-editorial-ink/40"
          }`}
        >
          <Compass className="h-3.5 w-3.5" />
          <span>Catalog</span>
        </button>
        <button
          onClick={() => setView("ar-studio")}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-2.5 text-[10px] tracking-[0.15em] uppercase font-bold ${
            currentView === "ar-studio" ? "text-editorial-ink" : "text-editorial-ink/40"
          }`}
        >
          <Eye className="h-3.5 w-3.5 text-editorial-accent" />
          <span>3D & AR Studio</span>
        </button>
      </div>
    </header>
  );
}
