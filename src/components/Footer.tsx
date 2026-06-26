import React from "react";
import { Mail, Phone, MapPin, Globe, Sparkles } from "lucide-react";

interface FooterProps {
  onAdminClick?: () => void;
}

export default function Footer({ onAdminClick }: FooterProps) {
  return (
    <footer className="border-t border-editorial-border bg-editorial-accent-soft py-16 text-editorial-ink">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          
          {/* Column 1: Brand details */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-editorial-ink bg-transparent text-editorial-ink text-xs font-serif font-bold">
                LL
              </div>
              <span className="font-serif text-sm font-bold uppercase tracking-wider text-editorial-ink">
                Loom & Layer Studio
              </span>
            </div>
            <p className="text-xs leading-relaxed text-editorial-ink/75 font-light">
              Leading manufacturer and exporter of premium soft furniture items, cotton poufs, cushions, and designer accent furniture based in Jodhpur, Rajasthan. Bringing Indo-Nordic hand-woven minimalist luxury to homes worldwide.
            </p>
          </div>

          {/* Column 2: Materials & Heritage */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-editorial-ink mb-4">
              Our Materials
            </h3>
            <ul className="space-y-2 text-xs text-editorial-ink/70 font-light">
              <li>Organic Hand-Spun Cotton</li>
              <li>Sustainably-Sourced Jute Fiber</li>
              <li>Hand-Selected Mango Wood</li>
              <li>Merino Wool & Cashmere Blends</li>
              <li>Belgian Organic Flax Linen</li>
            </ul>
          </div>

          {/* Column 3: Exporter Services */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-editorial-ink mb-4">
              Services
            </h3>
            <ul className="space-y-2 text-xs text-editorial-ink/70 font-light">
              <li>Global Wholesale Exporting</li>
              <li>Custom Bespoke Design</li>
              <li>Interactive AR Room Fitting</li>
              <li>Bulk Corporate Orders</li>
              <li>FOB & CIF Logistics Packing</li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-editorial-ink mb-4">
              Jodhpur Headquarters
            </h3>
            <ul className="space-y-2.5 text-xs text-editorial-ink/70 font-light">
              <li className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-editorial-accent shrink-0 mt-0.5" />
                <span>Basni Industrial Area, Phase II, Jodhpur, Rajasthan, 342005, India</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-editorial-accent shrink-0" />
                <span>+91 291 243 0000</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-editorial-accent shrink-0" />
                <span>design@loomandlayer.com</span>
              </li>
              <li className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-editorial-accent shrink-0" />
                <span>www.loomandlayer.com</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom divider & credits */}
        <div className="mt-16 border-t border-editorial-border pt-8 flex flex-col sm:flex-row items-center justify-between">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <p className="text-[10px] text-editorial-accent font-semibold uppercase tracking-wider">
              &copy; {new Date().getFullYear()} Loom & Layer Studio Pvt. Ltd. All rights reserved.
            </p>
            {onAdminClick && (
              <button
                onClick={onAdminClick}
                className="text-[10px] text-editorial-accent/60 hover:text-editorial-ink font-semibold uppercase tracking-wider transition-colors cursor-pointer border border-editorial-border/40 hover:border-editorial-ink/30 px-2.5 py-0.5"
                title="Enter authorized operations console"
              >
                System Vault
              </button>
            )}
          </div>
          <div className="flex items-center space-x-1 mt-2 sm:mt-0 text-[10px] text-editorial-accent">
            <Sparkles className="h-3.5 w-3.5 text-editorial-accent" />
            <span>Built in collaboration with AI Studio • Design Advisor Active</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
