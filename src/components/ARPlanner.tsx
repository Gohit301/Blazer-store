import React, { useState, useRef, useEffect } from "react";
import { Product, PlacementItem } from "../types";
import { PRODUCTS } from "../data";
import Room3DBuilder from "./Room3DBuilder";
import {
  Camera,
  RotateCw,
  Trash2,
  Layers,
  FlipHorizontal,
  RefreshCw,
  Sparkles,
  Check,
  Upload,
  Image as ImageIcon,
  Plus,
  ShoppingBag,
  Sliders,
  Scale,
  X,
  Box
} from "lucide-react";

interface ARPlannerProps {
  products?: Product[];
  initialProductToPlace: Product | null;
  clearInitialProduct: () => void;
  onAddToCart: (product: Product) => void;
  onAddMultipleToCart: (products: Product[]) => void;
}

const PRESET_BACKGROUNDS = [
  {
    id: "cozy-loft",
    name: "Cozy Loft Corner",
    url: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "minimalist-hall",
    name: "Minimalist Lounge",
    url: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "sunny-nook",
    name: "Scandinavian Sunlit Nook",
    url: "https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1200&q=80",
  }
];

export default function ARPlanner({
  products = PRODUCTS,
  initialProductToPlace,
  clearInitialProduct,
  onAddToCart,
  onAddMultipleToCart,
}: ARPlannerProps) {
  const [plannerMode, setPlannerMode] = useState<"3d" | "2d">("3d");
  const [placements, setPlacements] = useState<PlacementItem[]>([]);
  const [selectedPlacementId, setSelectedPlacementId] = useState<string | null>(null);
  
  // Premium features
  const [lightingMode, setLightingMode] = useState<"bright" | "sunset" | "overcast" | "candlelight">("bright");
  const [showGrid, setShowGrid] = useState(true);
  const [showSpecSheet, setShowSpecSheet] = useState(false);
  const [quoteId] = useState(() => `SG-${Math.floor(100000 + Math.random() * 900000)}`);
  
  // Background configuration
  const [bgMode, setBgMode] = useState<"preset" | "camera" | "upload">("preset");
  const [selectedBgUrl, setSelectedBgUrl] = useState<string>(PRESET_BACKGROUNDS[0].url);
  const [uploadedBgUrl, setUploadedBgUrl] = useState<string | null>(null);

  // Camera stream refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  // Flash state
  const [showFlash, setShowFlash] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Load initial product if triggered from catalog
  useEffect(() => {
    if (initialProductToPlace) {
      addProductToCanvas(initialProductToPlace);
      clearInitialProduct();
    }
  }, [initialProductToPlace]);

  // Handle camera permission & toggle
  useEffect(() => {
    if (bgMode === "camera") {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "environment" } })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            streamRef.current = stream;
          }
        })
        .catch((err) => {
          console.error("Camera access denied:", err);
          alert("Unable to access the camera. Please ensure permissions are granted.");
          setBgMode("preset");
        });
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [bgMode]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // Add item to canvas
  const addProductToCanvas = (product: Product) => {
    const newPlacement: PlacementItem = {
      id: `placement-${Date.now()}`,
      product: product,
      x: 35 + Math.random() * 20, // Center with minor randomness
      y: 40 + Math.random() * 20,
      scale: 1.0,
      rotation: 0,
      zIndex: placements.length + 1,
      isFlipped: false,
    };
    setPlacements((prev) => [...prev, newPlacement]);
    setSelectedPlacementId(newPlacement.id);
  };

  // Drag operations
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).id === "bg-overlay") {
      setSelectedPlacementId(null);
    }
  };

  const startDrag = (placementId: string, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setSelectedPlacementId(placementId);
    
    const isTouch = "touches" in e;
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;

    const placement = placements.find((p) => p.id === placementId);
    if (!placement || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const startXPercent = placement.x;
    const startYPercent = placement.y;

    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      const currentX = "touches" in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const currentY = "touches" in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;

      const deltaXPercent = ((currentX - clientX) / rect.width) * 100;
      const deltaYPercent = ((currentY - clientY) / rect.height) * 100;

      setPlacements((prev) =>
        prev.map((p) =>
          p.id === placementId
            ? {
                ...p,
                x: Math.max(5, Math.min(95, startXPercent + deltaXPercent)),
                y: Math.max(5, Math.min(95, startYPercent + deltaYPercent)),
              }
            : p
        )
      );
    };

    const handleEnd = () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleEnd);
  };

  // Selection actions
  const updateSelectedPlacement = (updater: (p: PlacementItem) => PlacementItem) => {
    if (!selectedPlacementId) return;
    setPlacements((prev) =>
      prev.map((p) => (p.id === selectedPlacementId ? updater(p) : p))
    );
  };

  const rotateSelected = () => {
    updateSelectedPlacement((p) => ({ ...p, rotation: (p.rotation + 15) % 360 }));
  };

  const flipSelected = () => {
    updateSelectedPlacement((p) => ({ ...p, isFlipped: !p.isFlipped }));
  };

  const changeScaleSelected = (newScale: number) => {
    updateSelectedPlacement((p) => ({ ...p, scale: newScale }));
  };

  const raiseZIndex = () => {
    if (!selectedPlacementId) return;
    const maxZ = placements.reduce((max, p) => (p.zIndex > max ? p.zIndex : max), 0);
    updateSelectedPlacement((p) => ({ ...p, zIndex: maxZ + 1 }));
  };

  const deleteSelected = () => {
    if (!selectedPlacementId) return;
    setPlacements((prev) => prev.filter((p) => p.id !== selectedPlacementId));
    setSelectedPlacementId(null);
  };

  const clearCanvas = () => {
    setPlacements([]);
    setSelectedPlacementId(null);
  };

  // Upload room backdrop
  const handleUploadBg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedBgUrl(event.target.result as string);
          setBgMode("upload");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Bundle purchasing
  const purchaseBundle = () => {
    if (placements.length === 0) return;
    const products = placements.map((p) => p.product);
    onAddMultipleToCart(products);
    
    setSuccessToast(`Perfect! Added all ${placements.length} staged furniture items to your shopping cart.`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Camera snapshot
  const takeSnapshot = () => {
    setShowFlash(true);
    setTimeout(() => {
      setShowFlash(false);
      setShowSpecSheet(true);
    }, 300);
  };

  const selectedPlacement = placements.find((p) => p.id === selectedPlacementId);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Tab Selectors for 3D vs 2D Planner */}
      <div className="flex border-b border-editorial-border mb-8 text-[10px] font-bold uppercase tracking-widest bg-editorial-accent-soft p-1 w-full max-w-md shadow-xs">
        <button
          onClick={() => setPlannerMode("3d")}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 transition-all cursor-pointer ${
            plannerMode === "3d"
              ? "bg-editorial-ink text-white shadow-xs"
              : "text-editorial-accent hover:text-editorial-ink"
          }`}
        >
          <Box className="h-3.5 w-3.5 text-editorial-accent" />
          <span>Interactive 3D Room</span>
        </button>
        <button
          onClick={() => setPlannerMode("2d")}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 transition-all cursor-pointer ${
            plannerMode === "2d"
              ? "bg-editorial-ink text-white shadow-xs"
              : "text-editorial-accent hover:text-editorial-ink"
          }`}
        >
          <Camera className="h-3.5 w-3.5" />
          <span>2D Photo Staging</span>
        </button>
      </div>

      {plannerMode === "3d" ? (
        <Room3DBuilder
          initialProductToPlace={initialProductToPlace}
          clearInitialProduct={clearInitialProduct}
          onAddToCart={onAddToCart}
          onAddMultipleToCart={onAddMultipleToCart}
        />
      ) : (
        <>
          {/* Intro and Info Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-editorial-border pb-6 mb-8">
        <div>
          <span className="inline-flex items-center space-x-1 rounded-none bg-editorial-accent-soft border border-editorial-border px-3 py-0.5 text-[9px] font-bold text-editorial-accent uppercase tracking-wider">
            <Sparkles className="h-3 w-3 animate-pulse" />
            <span>Interactive Space Staging</span>
          </span>
          <h1 className="mt-2 font-serif text-2xl sm:text-3xl font-bold text-editorial-ink">
            Augmented Reality Placement Studio
          </h1>
          <p className="mt-1 text-xs text-editorial-accent font-light">
            Drag items from the catalog onto the stage. Adjust scale and angle to preview depth and spacing.
          </p>
        </div>

        {/* Clear and snapshot controls */}
        {placements.length > 0 && (
          <div className="mt-4 md:mt-0 flex items-center space-x-2">
            <button
              onClick={clearCanvas}
              className="flex items-center space-x-1.5 rounded-none border border-editorial-border bg-white hover:bg-editorial-accent-soft px-4 py-2 text-xs font-bold text-editorial-ink transition-all cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset Scene</span>
            </button>
            <button
              onClick={purchaseBundle}
              className="flex items-center space-x-1.5 rounded-none bg-editorial-ink hover:bg-editorial-accent px-4 py-2 text-xs font-bold text-white transition-all cursor-pointer shadow-xs uppercase tracking-wider"
            >
              <ShoppingBag className="h-3.5 w-3.5 text-white" />
              <span>Purchase Room Combo</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Placement Interactive Area (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          
          {/* Background Selector Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-editorial-accent-soft p-2.5 rounded-none border border-editorial-border">
            <div className="flex items-center space-x-1 bg-white/40 p-1 rounded-none border border-editorial-border/50">
              <button
                onClick={() => setBgMode("preset")}
                className={`flex items-center space-x-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-none transition-all cursor-pointer ${
                  bgMode === "preset" ? "bg-editorial-ink text-white shadow-xs" : "text-editorial-accent hover:text-editorial-ink"
                }`}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                <span>Default Rooms</span>
              </button>
              <button
                onClick={() => setBgMode("camera")}
                className={`flex items-center space-x-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-none transition-all cursor-pointer ${
                  bgMode === "camera" ? "bg-editorial-ink text-white shadow-xs" : "text-editorial-accent hover:text-editorial-ink"
                }`}
              >
                <Camera className="h-3.5 w-3.5 text-editorial-accent" />
                <span>Live Camera</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`flex items-center space-x-1 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-none transition-all cursor-pointer ${
                  bgMode === "upload" ? "bg-editorial-ink text-white shadow-xs" : "text-editorial-accent hover:text-editorial-ink"
                }`}
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Upload Room</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUploadBg}
                className="hidden"
              />
            </div>

            {/* Snapshot trigger */}
            <button
              onClick={takeSnapshot}
              className="flex items-center space-x-1.5 rounded-none border border-editorial-border bg-white hover:bg-editorial-accent-soft px-3 py-1.5 text-[10px] font-bold text-editorial-ink uppercase tracking-wider transition-all shadow-xs cursor-pointer"
            >
              <Camera className="h-3.5 w-3.5 text-editorial-accent" />
              <span>Export Snapshot</span>
            </button>
          </div>

          {/* Preset Background Subselector (only if preset mode is active) */}
          {bgMode === "preset" && (
            <div className="flex items-center space-x-2 overflow-x-auto pb-1">
              <span className="text-[10px] font-bold text-editorial-accent uppercase shrink-0">Select Room:</span>
              {PRESET_BACKGROUNDS.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => setSelectedBgUrl(bg.url)}
                  className={`text-xs px-2.5 py-1 rounded-none border font-semibold transition-all cursor-pointer ${
                    selectedBgUrl === bg.url
                      ? "bg-editorial-ink border-editorial-ink text-white"
                      : "bg-white border-editorial-border text-editorial-accent hover:border-editorial-ink hover:text-editorial-ink"
                  }`}
                >
                  {bg.name}
                </button>
              ))}
            </div>
          )}

          {/* Scene Adjustments Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-3 border border-editorial-border text-[10px] uppercase tracking-wider font-bold text-editorial-ink">
            <div className="flex items-center space-x-3">
              <span className="text-editorial-accent">Ambient Illumination:</span>
              <div className="flex items-center space-x-1.5">
                {(["bright", "sunset", "overcast", "candlelight"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setLightingMode(mode)}
                    className={`px-2 py-1 border transition-all cursor-pointer ${
                      lightingMode === mode
                        ? "bg-editorial-ink border-editorial-ink text-white"
                        : "bg-editorial-accent-soft border-editorial-border text-editorial-ink hover:bg-white"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`flex items-center space-x-1 px-3 py-1.5 border transition-all cursor-pointer ${
                showGrid
                  ? "bg-editorial-ink border-editorial-ink text-white"
                  : "bg-white border-editorial-border text-editorial-accent"
              }`}
            >
              <span>Blueprint Overlay</span>
              <span className="text-[8px] px-1 bg-editorial-accent-soft text-editorial-ink border border-editorial-border ml-1">
                {showGrid ? "ON" : "OFF"}
              </span>
            </button>
          </div>

          {/* Interactive Canvas Canvas Area */}
          <div
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="relative aspect-video w-full overflow-hidden rounded-none bg-editorial-accent-soft border border-editorial-border shadow-inner cursor-default group"
          >
            {/* Visual Flash effect */}
            {showFlash && (
              <div className="absolute inset-0 z-50 bg-white animate-flash" />
            )}

            {/* Preset Backdrop Image */}
            {bgMode === "preset" && (
              <img
                src={selectedBgUrl}
                alt="Staging Room"
                className="absolute inset-0 h-full w-full object-cover select-none pointer-events-none"
                referrerPolicy="no-referrer"
              />
            )}

            {/* Custom Upload Backdrop */}
            {bgMode === "upload" && uploadedBgUrl && (
              <img
                src={uploadedBgUrl}
                alt="Custom Uploaded Room"
                className="absolute inset-0 h-full w-full object-cover select-none pointer-events-none"
                referrerPolicy="no-referrer"
              />
            )}

            {/* Real Web Camera Video background stream */}
            {bgMode === "camera" && (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="absolute inset-0 h-full w-full object-cover pointer-events-none select-none flip-horizontal-if-selfie"
              />
            )}

            {/* Overlay grid lines for perspective assistance */}
            <div
              id="bg-overlay"
              className="absolute inset-0 bg-editorial-ink/5 border border-white/5 pointer-events-auto"
            />

            {/* Custom Interactive Room lighting layers */}
            {lightingMode === "sunset" && (
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 via-transparent to-amber-700/5 mix-blend-color-burn pointer-events-none select-none" />
            )}
            {lightingMode === "overcast" && (
              <div className="absolute inset-0 bg-blue-500/10 mix-blend-color-burn pointer-events-none select-none" />
            )}
            {lightingMode === "candlelight" && (
              <div className="absolute inset-0 bg-amber-900/15 mix-blend-multiply pointer-events-none select-none" />
            )}

            {/* Architectural Grid Lines Overlay */}
            {showGrid && (
              <div className="absolute inset-0 pointer-events-none select-none border border-editorial-accent/20">
                {/* Simulated coordinate horizontal lines */}
                <div className="absolute top-[35%] left-0 w-full border-t border-dashed border-editorial-ink/15 flex justify-between px-4 text-[8px] font-mono text-editorial-accent/60">
                  <span>PERSPECTIVE PLANE [Y=0.35]</span>
                  <span>GRID DEPTH: DEEP</span>
                </div>
                <div className="absolute top-[65%] left-0 w-full border-t border-dashed border-editorial-ink/20 flex justify-between px-4 text-[8px] font-mono text-editorial-accent/60">
                  <span>PERSPECTIVE PLANE [Y=0.65]</span>
                  <span>GRID DEPTH: ANCHOR</span>
                </div>
                <div className="absolute top-[85%] left-0 w-full border-t border-dashed border-editorial-ink/25 flex justify-between px-4 text-[8px] font-mono text-editorial-accent/60">
                  <span>PERSPECTIVE PLANE [Y=0.85]</span>
                  <span>GRID DEPTH: ACCESSIBLE</span>
                </div>
                
                {/* Diagonals to mock depth projection */}
                <svg className="absolute inset-0 h-full w-full opacity-10" xmlns="http://www.w3.org/2000/svg">
                  <line x1="0" y1="35%" x2="100%" y2="85%" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="100%" y1="35%" x2="0" y2="85%" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
                  <line x1="50%" y1="0" x2="50%" y2="100%" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
                </svg>
              </div>
            )}

            {/* Empty Slate Prompt inside canvas */}
            {placements.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-editorial-ink/20 pointer-events-none p-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-none bg-white/20 backdrop-blur-md text-white mb-3 shadow-md border border-white/10 animate-pulse">
                  <Plus className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-white font-serif text-lg font-bold tracking-wide">
                  Your Room Stage is Ready
                </h3>
                <p className="text-white/80 text-xs font-light max-w-xs mt-1">
                  Choose any soft furniture item from the right side panel to place and preview it instantly in AR mode.
                </p>
              </div>
            )}

            {/* RENDER SPAWNED ITEMS */}
            {placements.map((item) => {
              const isSelected = item.id === selectedPlacementId;
              const arScaleFactor = item.product.arAssetScale || 1.0;
              // We simulate depth and spacing through dimensions sizing.
              const itemSizePct = 30 * item.scale * arScaleFactor;

              return (
                <div
                  key={item.id}
                  onMouseDown={(e) => startDrag(item.id, e)}
                  onTouchStart={(e) => startDrag(item.id, e)}
                  style={{
                    position: "absolute",
                    left: `${item.x}%`,
                    top: `${item.y}%`,
                    transform: `translate(-50%, -50%) rotate(${item.rotation}deg) scaleX(${
                      item.isFlipped ? -1 : 1
                    })`,
                    width: `${itemSizePct}%`,
                    zIndex: item.zIndex,
                    cursor: "grab",
                  }}
                  className={`relative select-none pointer-events-auto group transition-shadow ${
                    isSelected ? "z-50" : ""
                  }`}
                >
                  {/* Outer selection ring */}
                  <div
                    className={`absolute -inset-2.5 rounded-none border-2 transition-all ${
                      isSelected
                        ? "border-editorial-accent border-dashed animate-pulse"
                        : "border-transparent group-hover:border-white/40"
                    }`}
                  />

                  {/* Render PNG product image */}
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-full object-contain drop-shadow-[0_15px_15px_rgba(0,0,0,0.35)] select-none pointer-events-none rounded-none"
                    referrerPolicy="no-referrer"
                  />

                  {/* Tiny label on top */}
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 rounded-none bg-editorial-ink/90 backdrop-blur-xs px-2 py-0.5 text-[8px] font-bold text-white tracking-wider whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.product.name.split(" ")[0]} ({Math.round(item.scale * 100)}%)
                  </span>

                  {/* Direct remove handle */}
                  {isSelected && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSelected();
                      }}
                      className="absolute -top-4 -right-4 flex h-6 w-6 items-center justify-center rounded-none bg-red-600 text-white shadow-md hover:bg-red-700 transition-all cursor-pointer border border-white"
                      title="Delete piece"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* ACTIVE OBJECT MANUAL CONTROL PANEL */}
          {selectedPlacement && (
            <div className="bg-white border border-editorial-border rounded-none p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-editorial-border pb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold text-editorial-accent uppercase tracking-widest">Active Placement:</span>
                  <span className="text-sm font-bold text-editorial-ink font-serif">{selectedPlacement.product.name}</span>
                </div>
                <button
                  onClick={deleteSelected}
                  className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1.5 rounded-none border border-transparent hover:border-editorial-border transition-all cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Scale and Rotate controls */}
                <div className="space-y-3">
                  {/* Scaling Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-editorial-ink">
                      <span className="flex items-center space-x-1">
                        <Scale className="h-3.5 w-3.5 text-editorial-accent" />
                        <span>Object Depth Scale</span>
                      </span>
                      <span>{Math.round(selectedPlacement.scale * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.4"
                      max="2.5"
                      step="0.05"
                      value={selectedPlacement.scale}
                      onChange={(e) => changeScaleSelected(parseFloat(e.target.value))}
                      className="w-full h-1 bg-editorial-accent-soft rounded-none appearance-none cursor-pointer accent-editorial-ink"
                    />
                  </div>

                  {/* Rotation Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-editorial-ink">
                      <span className="flex items-center space-x-1">
                        <RotateCw className="h-3.5 w-3.5 text-editorial-accent" />
                        <span>Placement Angle</span>
                      </span>
                      <span>{selectedPlacement.rotation}°</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      step="15"
                      value={selectedPlacement.rotation}
                      onChange={(e) => updateSelectedPlacement(p => ({ ...p, rotation: parseInt(e.target.value) }))}
                      className="w-full h-1 bg-editorial-accent-soft rounded-none appearance-none cursor-pointer accent-editorial-ink"
                    />
                  </div>
                </div>

                {/* Layering & layout controls */}
                <div className="flex flex-col justify-end space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={rotateSelected}
                      className="flex items-center justify-center space-x-1.5 py-2 text-xs font-bold rounded-none bg-editorial-accent-soft border border-editorial-border text-editorial-ink hover:bg-white transition-all cursor-pointer uppercase tracking-wider text-[10px]"
                    >
                      <RotateCw className="h-3.5 w-3.5 text-editorial-accent" />
                      <span>Rotate 15°</span>
                    </button>
                    <button
                      onClick={flipSelected}
                      className="flex items-center justify-center space-x-1.5 py-2 text-xs font-bold rounded-none bg-editorial-accent-soft border border-editorial-border text-editorial-ink hover:bg-white transition-all cursor-pointer uppercase tracking-wider text-[10px]"
                    >
                      <FlipHorizontal className="h-3.5 w-3.5 text-editorial-accent" />
                      <span>Mirror Flip</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={raiseZIndex}
                      className="flex items-center justify-center space-x-1.5 py-2 text-xs font-bold rounded-none bg-editorial-accent-soft border border-editorial-border text-editorial-ink hover:bg-white transition-all cursor-pointer uppercase tracking-wider text-[10px]"
                    >
                      <Layers className="h-3.5 w-3.5 text-editorial-accent" />
                      <span>To Front</span>
                    </button>
                    <button
                      onClick={() => onAddToCart(selectedPlacement.product)}
                      className="flex items-center justify-center space-x-1.5 py-2 text-xs font-bold rounded-none bg-editorial-ink text-white hover:bg-editorial-accent transition-all shadow-xs cursor-pointer uppercase tracking-wider text-[10px]"
                    >
                      <ShoppingBag className="h-3.5 w-3.5 text-white" />
                      <span>Buy Item</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Sidebar Inventory panel (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          <div className="bg-white border border-editorial-border rounded-none p-5 flex flex-col max-h-[600px] overflow-hidden">
            <h3 className="font-serif text-lg font-bold text-editorial-ink border-b border-editorial-border pb-3">
              Staging Inventory
            </h3>
            <p className="text-[11px] text-editorial-accent mt-1 mb-4 font-light">
              Click any authentic Loom & Layer piece to add it onto your live layout.
            </p>

            {/* Scrollable grid */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {products.map((prod) => {
                const countStaged = placements.filter((p) => p.product.id === prod.id).length;

                return (
                  <div
                    key={prod.id}
                    onClick={() => addProductToCanvas(prod)}
                    className="flex items-center justify-between p-2 rounded-none border border-editorial-border/30 hover:border-editorial-ink bg-editorial-accent-soft/30 hover:bg-white cursor-pointer transition-all group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-14 w-14 overflow-hidden rounded-none bg-white shrink-0 border border-editorial-border/30">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-editorial-ink group-hover:text-editorial-accent transition-colors">
                          {prod.name}
                        </h4>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span className="text-[9px] text-editorial-accent font-bold uppercase tracking-wider">{prod.category}</span>
                          <span className="text-xs font-bold text-editorial-ink">${prod.price}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {countStaged > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-none bg-editorial-ink text-[9px] font-bold text-white shadow-sm">
                          {countStaged}
                        </span>
                      )}
                      <div className="h-7 w-7 rounded-none bg-white border border-editorial-border flex items-center justify-center text-editorial-accent group-hover:bg-editorial-ink group-hover:text-white transition-all shadow-xs">
                        <Plus className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Guide / Quality seal */}
          <div className="rounded-none bg-editorial-accent-soft border border-editorial-border p-4">
            <span className="text-[9px] font-bold tracking-wider uppercase text-editorial-accent block">Staging Guidelines</span>
            <p className="text-[11px] text-editorial-ink/80 leading-relaxed font-light mt-1">
              Soft furniture adapts to space context. We recommend grouping poufs in sets of two, using throws to add visual soft draping over stools, and checking clearances in 1:1 scaling.
            </p>
          </div>
        </div>

      </div>

      {/* Floating Success Alert */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 rounded-none bg-editorial-ink px-5 py-4 text-white shadow-2xl border border-editorial-border animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex h-7 w-7 items-center justify-center rounded-none bg-white text-editorial-ink border border-editorial-border">
            <Check className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">{successToast}</p>
          </div>
        </div>
      )}

      {/* EXPORTER DESIGN SPECIFICATION MODAL (SPEC SHEET) */}
      {showSpecSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-editorial-ink/60 backdrop-blur-md">
          <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-white border border-editorial-ink shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            
            {/* Spec Sheet Header */}
            <div className="flex items-center justify-between border-b border-editorial-border bg-editorial-accent-soft p-5">
              <div className="flex items-center space-x-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-editorial-ink bg-transparent text-editorial-ink font-serif font-bold text-xs">
                  SG
                </div>
                <div>
                  <h2 className="font-serif text-base font-bold text-editorial-ink leading-none">Architectural Spec Sheet</h2>
                  <span className="text-[9px] text-editorial-accent font-semibold tracking-wider uppercase block mt-1">
                    Quote Reference: {quoteId}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowSpecSheet(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-editorial-border hover:bg-editorial-ink hover:text-white transition-all cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Spec Sheet Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 printable-area">
              
              {/* Top Meta info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-editorial-border pb-6">
                <div>
                  <span className="block text-[8px] font-bold text-editorial-accent uppercase tracking-wider mb-1">Exporter & Manufacturer</span>
                  <span className="text-xs font-bold text-editorial-ink block">Loom & Layer Studio Pvt. Ltd.</span>
                  <span className="text-[10px] text-editorial-ink/70 font-light block">Basni Industrial Area, Phase II, Jodhpur, India</span>
                </div>
                <div>
                  <span className="block text-[8px] font-bold text-editorial-accent uppercase tracking-wider mb-1">Staging Date</span>
                  <span className="text-xs font-bold text-editorial-ink block">{new Date().toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  <span className="text-[10px] text-editorial-ink/70 font-light block">Design Environment: Web Studio</span>
                </div>
                <div>
                  <span className="block text-[8px] font-bold text-editorial-accent uppercase tracking-wider mb-1">Shipment Method</span>
                  <span className="text-xs font-bold text-editorial-ink block">FOB Jodhpur Dry Port / CIF Air Express</span>
                  <span className="text-[10px] text-editorial-ink/70 font-light block">Includes secure heavy-duty cargo packing</span>
                </div>
              </div>

              {/* Placed Items Breakdown Table */}
              <div>
                <h3 className="font-serif text-sm font-bold text-editorial-ink mb-3 uppercase tracking-wider">Itemized Staging Specification</h3>
                {placements.length === 0 ? (
                  <p className="text-xs text-editorial-accent italic py-4">No items have been staged on the canvas yet.</p>
                ) : (
                  <div className="border border-editorial-border divide-y divide-editorial-border text-xs">
                    
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-2 bg-editorial-accent-soft p-3 font-bold text-editorial-ink text-[10px] uppercase tracking-wider">
                      <div className="col-span-1">Ref ID</div>
                      <div className="col-span-5">Product Details</div>
                      <div className="col-span-2">Dimensions</div>
                      <div className="col-span-2">Materials</div>
                      <div className="col-span-2 text-right">Unit Price</div>
                    </div>

                    {/* Table Rows */}
                    {placements.map((item, index) => (
                      <div key={item.id} className="grid grid-cols-12 gap-2 p-3 items-center text-editorial-ink/90">
                        <div className="col-span-1 font-mono font-bold text-[10px] text-editorial-accent">#{index + 1}</div>
                        <div className="col-span-5 flex items-center space-x-3">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="h-10 w-10 object-cover border border-editorial-border/40 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <span className="font-bold block text-editorial-ink leading-tight">{item.product.name}</span>
                            <span className="text-[9px] text-editorial-accent uppercase tracking-widest font-semibold block">{item.product.category} ({Math.round(item.scale * 100)}% scale)</span>
                          </div>
                        </div>
                        <div className="col-span-2 text-[10px] text-editorial-ink/75">{item.product.dimensions}</div>
                        <div className="col-span-2 text-[10px] text-editorial-ink/75 truncate" title={item.product.materials.join(", ")}>
                          {item.product.materials.slice(0, 2).join(", ")}
                        </div>
                        <div className="col-span-2 text-right font-bold text-editorial-ink font-serif">${item.product.price}</div>
                      </div>
                    ))}

                    {/* Table Footer / Summary */}
                    <div className="p-4 bg-editorial-accent-soft/30 space-y-2">
                      <div className="flex justify-between text-xs font-light">
                        <span className="text-editorial-accent">Cargo CBM Est. (Volume):</span>
                        <span className="font-bold text-editorial-ink font-mono">{(placements.length * 0.18).toFixed(2)} m³ (Cubic Meters)</span>
                      </div>
                      <div className="flex justify-between text-xs font-light">
                        <span className="text-editorial-accent">Estimated Total Weight:</span>
                        <span className="font-bold text-editorial-ink font-mono">{placements.length * 8} kg</span>
                      </div>
                      <div className="flex justify-between text-sm pt-2 border-t border-editorial-border font-bold">
                        <span className="text-editorial-ink">Total CIF Export Cost:</span>
                        <span className="text-base text-editorial-ink font-serif">${placements.reduce((sum, item) => sum + item.product.price, 0)}</span>
                      </div>
                    </div>

                  </div>
                )}
              </div>

              {/* Certified Craft Stamp */}
              <div className="border border-dashed border-editorial-border p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center md:text-left">
                  <span className="text-[9px] font-bold tracking-wider text-editorial-accent block uppercase">Loom & Layer Quality Seal</span>
                  <p className="text-[11px] text-editorial-ink/70 font-light leading-relaxed max-w-md">
                    Each item is individually certified by Jodhpur Handloom weavers. Solid timber meets IS-401 timber seasoning standards and fabrics pass 30,000 double-rub abrasion checks.
                  </p>
                </div>
                <div className="border border-editorial-ink text-editorial-ink text-[10px] font-bold p-3 text-center tracking-widest uppercase rotate-2 shrink-0 bg-editorial-accent-soft">
                  CERTIFIED DESIGN
                </div>
              </div>

            </div>

            {/* Spec Sheet Footer Actions */}
            <div className="border-t border-editorial-border bg-editorial-bg p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={() => window.print()}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 border border-editorial-ink px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-editorial-ink hover:bg-editorial-accent-soft transition-all"
              >
                <span>Print Specification</span>
              </button>
              
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    const products = placements.map(p => p.product);
                    onAddMultipleToCart(products);
                    setShowSpecSheet(false);
                    setSuccessToast("Perfect! Entire staged combo has been added to your order.");
                    setTimeout(() => setSuccessToast(null), 4000);
                  }}
                  className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 bg-editorial-ink hover:bg-editorial-accent text-white px-6 py-3 text-[10px] font-bold uppercase tracking-wider transition-all"
                >
                  <ShoppingBag className="h-4 w-4 animate-pulse" />
                  <span>Order Entire Combo</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
