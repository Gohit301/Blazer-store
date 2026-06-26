import React, { useState, useRef, useEffect } from "react";
import * as THREE from "three";
import { Product } from "../types";
import { PRODUCTS } from "../data";
import { 
  Maximize2, 
  RotateCcw, 
  Trash2, 
  Copy, 
  Grid, 
  Sun, 
  Moon, 
  Move, 
  Plus, 
  X, 
  ShoppingBag, 
  Camera, 
  Box, 
  Compass, 
  Eye, 
  Layers, 
  Sliders, 
  ChevronRight, 
  CornerDownRight, 
  Check,
  Cloud,
  UploadCloud,
  DownloadCloud,
  Share2
} from "lucide-react";

interface Room3DBuilderProps {
  products?: Product[];
  initialProductToPlace: Product | null;
  clearInitialProduct: () => void;
  onAddToCart: (product: Product) => void;
  onAddMultipleToCart: (products: Product[]) => void;
}

interface Placed3DItem {
  id: string;
  product: Product;
  x: number; // meters from center
  y: number; // meters from floor
  z: number; // meters from center
  rotation: number; // radians (0 to 2*PI)
  scale: number; // multiplier (0.5 to 2.0)
  colorVariantIdx: number; // active swatch index
}

type FloorFinish = "light-oak" | "dark-mango" | "loft-concrete" | "ivory-tile";
type WallFinish = "alabaster" | "desert-sand" | "forest-sage" | "charcoal";
type LightingMood = "daylight" | "sunset" | "overcast" | "candlelight";
type CameraPreset = "free" | "blueprint" | "elevation" | "isometric";

// Define swatches for the products to sync with custom colors
const PRODUCT_SWATCHES: Record<string, Array<{ name: string; color: string; rgb: number }>> = {
  "sg-001": [
    { name: "Cream Bouclé", color: "#F7F5F0", rgb: 0xF7F5F0 },
    { name: "Charcoal Slub", color: "#3B3B39", rgb: 0x3B3B39 },
    { name: "Sienna Earth", color: "#B8735C", rgb: 0xB8735C }
  ],
  "sg-002": [
    { name: "Natural Mango", color: "#DAB68F", rgb: 0xDAB68F },
    { name: "Ebonized Ash", color: "#252525", rgb: 0x252525 }
  ],
  "sg-003": [
    { name: "Royal Indigo", color: "#1E3B5C", rgb: 0x1E3B5C },
    { name: "Oatmeal Flax", color: "#E0D7C5", rgb: 0xE0D7C5 }
  ],
  "sg-004": [
    { name: "Tuscan Ochre", color: "#D19C4C", rgb: 0xD19C4C },
    { name: "Forest Spruce", color: "#2C4C3E", rgb: 0x2C4C3E }
  ],
  "sg-005": [
    { name: "Warm Herringbone", color: "#CBB9A5", rgb: 0xCBB9A5 },
    { name: "Nordic Sage", color: "#8E9B8D", rgb: 0x8E9B8D }
  ],
  "sg-009": [
    { name: "Cream Dhurrie", color: "#F0EAE1", rgb: 0xF0EAE1 },
    { name: "Sienna Jute", color: "#B37B5C", rgb: 0xB37B5C },
    { name: "Oceanic Indigo", color: "#2B475D", rgb: 0x2B475D }
  ],
  "sg-010": [
    { name: "Pebble Bouclé", color: "#E5E1DA", rgb: 0xE5E1DA },
    { name: "Terracotta Velvet", color: "#BC5A42", rgb: 0xBC5A42 },
    { name: "Olive Linen", color: "#5F6C5B", rgb: 0x5F6C5B }
  ],
  "sg-011": [
    { name: "Warm Amber", color: "#D99B5E", rgb: 0xD99B5E },
    { name: "Tuscan Rose", color: "#C58F87", rgb: 0xC58F87 }
  ]
};

export default function Room3DBuilder({
  products = PRODUCTS,
  initialProductToPlace,
  clearInitialProduct,
  onAddToCart,
  onAddMultipleToCart,
}: Room3DBuilderProps) {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<"catalog" | "room" | "inspector">("catalog");
  const [placedItems, setPlacedItems] = useState<Placed3DItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Room Customization
  const [roomWidth, setRoomWidth] = useState(4.5); // meters (~15 ft)
  const [roomDepth, setRoomDepth] = useState(4.0); // meters (~13 ft)
  const [roomHeight, setRoomHeight] = useState(2.8); // meters (~9 ft)
  const [floorFinish, setFloorFinish] = useState<FloorFinish>("light-oak");
  const [wallFinish, setWallFinish] = useState<WallFinish>("alabaster");
  const [lightingMood, setLightingMood] = useState<LightingMood>("daylight");
  const [showGrid, setShowGrid] = useState(true);
  const [showDimensionsHUD, setShowDimensionsHUD] = useState(true);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>("free");

  // Camera screenshot flash
  const [showFlash, setShowFlash] = useState(false);

  // Cloud Save/Load states
  const [cloudDesignName, setCloudDesignName] = useState("My Scandinavian Lounge");
  const [cloudDesignCode, setCloudDesignCode] = useState("");
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const [savedDesignsList, setSavedDesignsList] = useState<Array<{ binId: string; name: string; savedAt: string }>>([]);
  const [copiedDesignId, setCopiedDesignId] = useState<string | null>(null);

  const [isJsonbinConfigured, setIsJsonbinConfigured] = useState<boolean | null>(null);

  // Load saved designs list and check JSONbin status on mount
  useEffect(() => {
    const list = localStorage.getItem("loom_layer_cloud_designs");
    if (list) {
      try {
        setSavedDesignsList(JSON.parse(list));
      } catch (e) {
        console.error("Failed to parse saved cloud designs", e);
      }
    }

    fetch("/api/designs/status")
      .then((res) => res.json())
      .then((data) => {
        setIsJsonbinConfigured(!!data.configured);
      })
      .catch((err) => {
        console.error("Failed to fetch JSONbin status:", err);
        setIsJsonbinConfigured(false);
      });
  }, []);

  // --- REFS FOR THREE.JS ---
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const objectsGroupRef = useRef<THREE.Group | null>(null);
  const boundingBoxHelperRef = useRef<THREE.BoxHelper | null>(null);
  const dimensionGuidesGroupRef = useRef<THREE.Group | null>(null);

  // Orbit camera parameters
  const cameraOrbitRef = useRef({
    theta: Math.PI / 4, // horizontal angle
    phi: Math.PI / 3, // vertical angle
    radius: 7.5, // zoom distance
    target: new THREE.Vector3(0, 0.5, 0),
    isDragging: false,
    startX: 0,
    startY: 0,
    startTheta: 0,
    startPhi: 0,
  });

  // Track the actual mesh instances in Three.js
  const meshInstancesRef = useRef<Record<string, THREE.Group>>({});

  // Clean up initial product request
  useEffect(() => {
    if (initialProductToPlace) {
      handlePlaceProduct(initialProductToPlace);
      clearInitialProduct();
    }
  }, [initialProductToPlace]);

  // --- ROOM MATERIALS ---
  const wallColors: Record<WallFinish, string> = {
    alabaster: "#F4F3EF",
    "desert-sand": "#E3D7C5",
    "forest-sage": "#7E8576",
    charcoal: "#303233"
  };

  const wallRGB: Record<WallFinish, number> = {
    alabaster: 0xF4F3EF,
    "desert-sand": 0xE3D7C5,
    "forest-sage": 0x7E8576,
    charcoal: 0x303233
  };

  // --- THREE.JS INITIALIZATION ---
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    // 1. Create Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0xF9F8F6); // Soft luxury off-white canvas

    // 2. Create Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      canvasContainerRef.current.clientWidth / canvasContainerRef.current.clientHeight,
      0.1,
      50
    );
    cameraRef.current = camera;
    updateCameraPosition();

    // 3. Create WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    rendererRef.current = renderer;
    renderer.setSize(canvasContainerRef.current.clientWidth, canvasContainerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Clear previous children
    canvasContainerRef.current.innerHTML = "";
    canvasContainerRef.current.appendChild(renderer.domElement);

    // 4. Create Groups
    const objectsGroup = new THREE.Group();
    scene.add(objectsGroup);
    objectsGroupRef.current = objectsGroup;

    const dimensionGuidesGroup = new THREE.Group();
    scene.add(dimensionGuidesGroup);
    dimensionGuidesGroupRef.current = dimensionGuidesGroup;

    // 5. Setup Lighting
    setupSceneLighting(scene);

    // 6. Build Room Shell (Floor + Walls)
    rebuildRoomShell(scene);

    // 7. Raycasting for item selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleCanvasClick = (e: MouseEvent) => {
      if (!canvasContainerRef.current || !cameraRef.current) return;

      // Calculate container-relative bounds
      const rect = renderer.domElement.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Convert to normalized coordinates (-1 to +1)
      mouse.x = (clickX / rect.width) * 2 - 1;
      mouse.y = -(clickY / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, cameraRef.current);
      
      // Get all selectable groups
      const targets: THREE.Object3D[] = [];
      Object.values(meshInstancesRef.current).forEach((grp) => {
        const group = grp as THREE.Group;
        if (group && group.children) {
          targets.push(...group.children);
        }
      });

      const intersects = raycaster.intersectObjects(targets, true);
      
      if (intersects.length > 0) {
        // Trace back to root PlacedItem group
        let node: THREE.Object3D | null = intersects[0].object;
        while (node && node.parent) {
          if (node.name.startsWith("placed-item-")) {
            const itemId = node.name.replace("placed-item-", "");
            setSelectedItemId(itemId);
            setActiveTab("inspector");
            return;
          }
          node = node.parent;
        }
      } else {
        // If they click on the floor, deselect
        const floorIntersects = raycaster.intersectObject(scene.getObjectByName("floor-mesh") || new THREE.Object3D());
        if (floorIntersects.length > 0) {
          setSelectedItemId(null);
        }
      }
    };

    renderer.domElement.addEventListener("click", handleCanvasClick);

    // 8. Event listener for camera rotation
    const handleMouseDown = (e: MouseEvent) => {
      if (cameraPreset !== "free") return;
      
      cameraOrbitRef.current.isDragging = true;
      cameraOrbitRef.current.startX = e.clientX;
      cameraOrbitRef.current.startY = e.clientY;
      cameraOrbitRef.current.startTheta = cameraOrbitRef.current.theta;
      cameraOrbitRef.current.startPhi = cameraOrbitRef.current.phi;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!cameraOrbitRef.current.isDragging || cameraPreset !== "free") return;

      const dx = e.clientX - cameraOrbitRef.current.startX;
      const dy = e.clientY - cameraOrbitRef.current.startY;

      // Rotate camera
      cameraOrbitRef.current.theta = cameraOrbitRef.current.startTheta - dx * 0.007;
      cameraOrbitRef.current.phi = THREE.MathUtils.clamp(
        cameraOrbitRef.current.startPhi - dy * 0.007,
        0.1,
        Math.PI / 2 - 0.05 // Don't go below floor
      );

      updateCameraPosition();
    };

    const handleMouseUp = () => {
      cameraOrbitRef.current.isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (cameraPreset !== "free") return;
      
      cameraOrbitRef.current.radius = THREE.MathUtils.clamp(
        cameraOrbitRef.current.radius + e.deltaY * 0.005,
        2.5,
        15.0
      );
      updateCameraPosition();
    };

    // Touch event support for tablet/mobile 3D navigation
    const handleTouchStart = (e: TouchEvent) => {
      if (cameraPreset !== "free" || e.touches.length === 0) return;
      cameraOrbitRef.current.isDragging = true;
      cameraOrbitRef.current.startX = e.touches[0].clientX;
      cameraOrbitRef.current.startY = e.touches[0].clientY;
      cameraOrbitRef.current.startTheta = cameraOrbitRef.current.theta;
      cameraOrbitRef.current.startPhi = cameraOrbitRef.current.phi;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!cameraOrbitRef.current.isDragging || cameraPreset !== "free" || e.touches.length === 0) return;
      const dx = e.touches[0].clientX - cameraOrbitRef.current.startX;
      const dy = e.touches[0].clientY - cameraOrbitRef.current.startY;

      cameraOrbitRef.current.theta = cameraOrbitRef.current.startTheta - dx * 0.01;
      cameraOrbitRef.current.phi = THREE.MathUtils.clamp(
        cameraOrbitRef.current.startPhi - dy * 0.01,
        0.1,
        Math.PI / 2 - 0.05
      );
      updateCameraPosition();
    };

    renderer.domElement.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    renderer.domElement.addEventListener("wheel", handleWheel, { passive: false });
    renderer.domElement.addEventListener("touchstart", handleTouchStart, { passive: true });
    renderer.domElement.addEventListener("touchmove", handleTouchMove, { passive: true });
    renderer.domElement.addEventListener("touchend", handleMouseUp);

    // 9. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0 || !rendererRef.current || !cameraRef.current) return;
      const { width, height } = entries[0].contentRect;
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    });
    resizeObserver.observe(canvasContainerRef.current);

    // 10. Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (rendererRef.current) {
        rendererRef.current.domElement.removeEventListener("click", handleCanvasClick);
        rendererRef.current.domElement.removeEventListener("mousedown", handleMouseDown);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
        rendererRef.current.domElement.removeEventListener("wheel", handleWheel);
        rendererRef.current.domElement.removeEventListener("touchstart", handleTouchStart);
        rendererRef.current.domElement.removeEventListener("touchmove", handleTouchMove);
        rendererRef.current.domElement.removeEventListener("touchend", handleMouseUp);
      }

      // Dispose geometries & materials
      disposeRecursive(scene);
    };
  }, []);

  // --- WATCH PRESETS & CUSTOMIZATIONS ---

  // Re-build room shell when dimensions, colors or grid toggles change
  useEffect(() => {
    if (sceneRef.current) {
      rebuildRoomShell(sceneRef.current);
    }
  }, [roomWidth, roomDepth, roomHeight, floorFinish, wallFinish, showGrid]);

  // Sync lighting mood changes
  useEffect(() => {
    if (sceneRef.current) {
      setupSceneLighting(sceneRef.current);
    }
  }, [lightingMood]);

  // Sync camera preset changes
  useEffect(() => {
    if (cameraPreset === "blueprint") {
      cameraOrbitRef.current.theta = 0;
      cameraOrbitRef.current.phi = 0.01; // nearly straight down
      cameraOrbitRef.current.radius = 8.5;
    } else if (cameraPreset === "elevation") {
      cameraOrbitRef.current.theta = 0;
      cameraOrbitRef.current.phi = Math.PI / 2 - 0.1; // straight ahead
      cameraOrbitRef.current.radius = 8.0;
    } else if (cameraPreset === "isometric") {
      cameraOrbitRef.current.theta = Math.PI / 4;
      cameraOrbitRef.current.phi = Math.PI / 3.5;
      cameraOrbitRef.current.radius = 7.5;
    }
    updateCameraPosition();
  }, [cameraPreset]);

  // Synchronize Placed Items List to 3D Scene
  useEffect(() => {
    syncPlacedItems3D();
  }, [placedItems, selectedItemId, showDimensionsHUD]);

  // --- PROCEDURAL 3D SHAPE BUILDERS ---

  // Synchronizes state to 3D scene representation
  const syncPlacedItems3D = () => {
    const scene = sceneRef.current;
    const group = objectsGroupRef.current;
    if (!scene || !group) return;

    // 1. Clear old dimensions guides
    if (dimensionGuidesGroupRef.current) {
      disposeRecursive(dimensionGuidesGroupRef.current);
      scene.remove(dimensionGuidesGroupRef.current);
      const newDGs = new THREE.Group();
      scene.add(newDGs);
      dimensionGuidesGroupRef.current = newDGs;
    }

    // 2. Map existing item IDs to keep track
    const placedItemIds = new Set(placedItems.map((i) => i.id));

    // 3. Delete meshes of removed items
    Object.keys(meshInstancesRef.current).forEach((itemId) => {
      if (!placedItemIds.has(itemId)) {
        const meshGroup = meshInstancesRef.current[itemId];
        group.remove(meshGroup);
        disposeRecursive(meshGroup);
        delete meshInstancesRef.current[itemId];
      }
    });

    // 4. Create/update remaining items
    placedItems.forEach((item) => {
      let itemGroup = meshInstancesRef.current[item.id];

      // Create new mesh if it doesn't exist or variant changed
      if (!itemGroup) {
        itemGroup = createProceduralMesh(item);
        group.add(itemGroup);
        meshInstancesRef.current[item.id] = itemGroup;
      }

      // Update position, rotation, scale
      itemGroup.position.set(item.x, item.y, item.z);
      itemGroup.rotation.y = item.rotation;
      itemGroup.scale.set(item.scale, item.scale, item.scale);

      // Draw bounding wireframe & text overlay on selected item
      if (item.id === selectedItemId && showDimensionsHUD) {
        drawHUDIndicators(item, itemGroup);
      }
    });
  };

  // Helper to dispose ThreeJS elements cleanly
  const disposeRecursive = (obj: THREE.Object3D) => {
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else if (child.material) {
          child.material.dispose();
        }
      }
    });
  };

  const updateCameraPosition = () => {
    const camera = cameraRef.current;
    if (!camera) return;

    const o = cameraOrbitRef.current;
    const radius = o.radius;
    
    camera.position.x = o.target.x + radius * Math.sin(o.phi) * Math.sin(o.theta);
    camera.position.y = o.target.y + radius * Math.cos(o.phi);
    camera.position.z = o.target.z + radius * Math.sin(o.phi) * Math.cos(o.theta);
    camera.lookAt(o.target);
  };

  // Re-builds floor and rear walls based on size state
  const rebuildRoomShell = (scene: THREE.Scene) => {
    // 1. Remove old room shell
    const oldFloor = scene.getObjectByName("floor-mesh");
    const oldLeftWall = scene.getObjectByName("left-wall");
    const oldRightWall = scene.getObjectByName("right-wall");
    const oldGrid = scene.getObjectByName("floor-grid");

    if (oldFloor) { scene.remove(oldFloor); disposeRecursive(oldFloor); }
    if (oldLeftWall) { scene.remove(oldLeftWall); disposeRecursive(oldLeftWall); }
    if (oldRightWall) { scene.remove(oldRightWall); disposeRecursive(oldRightWall); }
    if (oldGrid) { scene.remove(oldGrid); }

    // 2. Re-create Floor
    const floorGeo = new THREE.PlaneGeometry(roomWidth, roomDepth);
    floorGeo.rotateX(-Math.PI / 2); // Lay flat

    // Create Floor texture/material procedurally
    let floorMat: THREE.Material;

    if (floorFinish === "light-oak") {
      floorMat = new THREE.MeshStandardMaterial({
        color: 0xE8D5B7, // light wood tone
        roughness: 0.35,
        metalness: 0.05
      });
    } else if (floorFinish === "dark-mango") {
      floorMat = new THREE.MeshStandardMaterial({
        color: 0x543D2F, // rich dark handloomed stain
        roughness: 0.3,
        metalness: 0.0
      });
    } else if (floorFinish === "loft-concrete") {
      floorMat = new THREE.MeshStandardMaterial({
        color: 0x94979C, // neutral gray
        roughness: 0.7,
        metalness: 0.1
      });
    } else {
      floorMat = new THREE.MeshStandardMaterial({
        color: 0xEEEEEC, // beautiful tile
        roughness: 0.15,
        metalness: 0.1
      });
    }

    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.name = "floor-mesh";
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // 3. Grid overlay
    if (showGrid) {
      const gridHelper = new THREE.GridHelper(Math.max(roomWidth, roomDepth), 10, 0x9E9E9E, 0xD6D6D6);
      gridHelper.name = "floor-grid";
      // Slightly raise grid to avoid Z-fighting
      gridHelper.position.y = 0.002;
      scene.add(gridHelper);
    }

    // 4. Create Walls (Left Back and Right Back)
    const wallThickness = 0.05;
    const wallMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(wallColors[wallFinish]),
      roughness: 0.9,
      metalness: 0.0
    });

    // Left Back Wall
    const leftWallGeo = new THREE.BoxGeometry(wallThickness, roomHeight, roomDepth);
    const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
    leftWall.name = "left-wall";
    leftWall.position.set(-roomWidth / 2 - wallThickness / 2, roomHeight / 2, 0);
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // Right Back Wall
    const rightWallGeo = new THREE.BoxGeometry(roomWidth, roomHeight, wallThickness);
    const rightWall = new THREE.Mesh(rightWallGeo, wallMat);
    rightWall.name = "right-wall";
    rightWall.position.set(0, roomHeight / 2, -roomDepth / 2 - wallThickness / 2);
    rightWall.receiveShadow = true;
    scene.add(rightWall);
  };

  // Configure lights in the scene based on active lighting mood
  const setupSceneLighting = (scene: THREE.Scene) => {
    // Clear old lights
    const lightsToDelete: THREE.Object3D[] = [];
    scene.traverse((child) => {
      if (child instanceof THREE.Light || child instanceof THREE.AmbientLight || child instanceof THREE.DirectionalLight) {
        lightsToDelete.push(child);
      }
    });
    lightsToDelete.forEach((light) => scene.remove(light));

    // Colors matching state
    let ambientColor = 0xFFFFFF;
    let dirColor = 0xFFFFFF;
    let ambientIntensity = 0.6;
    let dirIntensity = 1.0;
    let dirPos = new THREE.Vector3(5, 8, 5);

    if (lightingMood === "sunset") {
      ambientColor = 0xFFA57D; // amber sunset
      dirColor = 0xFF5500;
      ambientIntensity = 0.35;
      dirIntensity = 1.4;
      dirPos.set(6, 4, -4);
    } else if (lightingMood === "overcast") {
      ambientColor = 0xE0EAFC; // blue overcast loft
      dirColor = 0xA1C4FD;
      ambientIntensity = 0.75;
      dirIntensity = 0.55;
      dirPos.set(-2, 10, 4);
    } else if (lightingMood === "candlelight") {
      ambientColor = 0xFF8A3D;
      dirColor = 0xFFD27A;
      ambientIntensity = 0.15;
      dirIntensity = 0.85;
      dirPos.set(1, 1.5, 2);
    }

    const ambientLight = new THREE.AmbientLight(ambientColor, ambientIntensity);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(dirColor, dirIntensity);
    dirLight.position.copy(dirPos);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 25;
    
    // Set orthographic bounds for shadows matching room size
    const d = 5;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.001;

    scene.add(dirLight);

    // Warm helper accent light
    if (lightingMood === "candlelight") {
      const pointLight = new THREE.PointLight(0xFFAA33, 1.5, 6);
      pointLight.position.set(0, 0.6, 0);
      pointLight.castShadow = true;
      scene.add(pointLight);
    }
  };

  // Creates high-fidelity procedurally generated furniture 3D groups in ThreeJS
  const createProceduralMesh = (item: Placed3DItem): THREE.Group => {
    const itemGroup = new THREE.Group();
    itemGroup.name = `placed-item-${item.id}`;

    // Look up color swatches for product
    const swatches = PRODUCT_SWATCHES[item.product.id];
    const customColor = swatches ? swatches[item.colorVariantIdx].rgb : null;

    // Materials
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x8C5E3C, // Natural mango wood tone
      roughness: 0.4,
      metalness: 0.05
    });

    const ironFrameMat = new THREE.MeshStandardMaterial({
      color: 0x222222, // Matte steel
      roughness: 0.6,
      metalness: 0.8
    });

    const fabricMatColor = customColor || (item.product.category === "poufs" ? 0xD6C7B2 : 0x4F617D);
    const mainFabricMat = new THREE.MeshStandardMaterial({
      color: fabricMatColor,
      roughness: 0.9,
      metalness: 0.0
    });

    // Custom shape builder depending on Category
    switch (item.product.category) {
      case "poufs": {
        // Renders beautiful ribbed cotton/wool braid poufs (Braided cylinder)
        const poufHeight = item.product.id === "sg-004" ? 0.4 : 0.35;
        const poufRadius = item.product.id === "sg-004" ? 0.3 : 0.25;

        // Base cylindrical cushion
        const bodyGeo = new THREE.CylinderGeometry(poufRadius, poufRadius, poufHeight, 24, 8);
        const bodyMesh = new THREE.Mesh(bodyGeo, mainFabricMat);
        bodyMesh.position.y = poufHeight / 2;
        bodyMesh.castShadow = true;
        bodyMesh.receiveShadow = true;
        itemGroup.add(bodyMesh);

        // Add visual textured rib bands around the cylinder (simulates hand-braiding)
        const ribCount = 6;
        for (let i = 0; i < ribCount; i++) {
          const ribGeo = new THREE.TorusGeometry(poufRadius + 0.008, 0.015, 8, 36);
          ribGeo.rotateX(Math.PI / 2);
          const ribMesh = new THREE.Mesh(ribGeo, new THREE.MeshStandardMaterial({
            color: new THREE.Color(fabricMatColor).multiplyScalar(0.9), // slightly darker for shadow contouring
            roughness: 0.95
          }));
          ribMesh.position.y = (poufHeight / ribCount) * (i + 0.5);
          itemGroup.add(ribMesh);
        }

        // Add soft top button detail
        const buttonGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.01, 12);
        const buttonMesh = new THREE.Mesh(buttonGeo, new THREE.MeshStandardMaterial({
          color: new THREE.Color(fabricMatColor).multiplyScalar(0.7),
          roughness: 0.8
        }));
        buttonMesh.position.y = poufHeight + 0.002;
        itemGroup.add(buttonMesh);
        break;
      }

      case "stools": {
        // Stools: Wooden / metal frame legs supporting woven or leather seat plates
        const stoolHeight = item.product.id === "sg-002" ? 0.45 : 0.38;
        const stoolRadius = 0.2;

        // Seat Cushion
        const seatHeight = 0.06;
        const seatGeo = new THREE.CylinderGeometry(stoolRadius, stoolRadius, seatHeight, 20);
        const seatMesh = new THREE.Mesh(seatGeo, mainFabricMat);
        seatMesh.position.y = stoolHeight - seatHeight / 2;
        seatMesh.castShadow = true;
        seatMesh.receiveShadow = true;
        itemGroup.add(seatMesh);

        // Woven braid/canvas coordinate grid details on seat
        const weaveMat = new THREE.MeshStandardMaterial({
          color: item.product.id === "sg-002" ? 0xC59B6D : 0x1F2421, // Natural Jute / Black Steel Accent
          roughness: 0.8
        });
        const weaveRing = new THREE.Mesh(new THREE.TorusGeometry(stoolRadius + 0.004, 0.008, 8, 24).rotateX(Math.PI / 2), weaveMat);
        weaveRing.position.y = stoolHeight - seatHeight / 2;
        itemGroup.add(weaveRing);

        // Legs
        const legThickness = 0.02;
        const legMaterial = item.product.id === "sg-008" ? ironFrameMat : woodMat;

        for (let i = 0; i < 4; i++) {
          const angle = (i * Math.PI) / 2 + Math.PI / 4;
          const legGeo = new THREE.CylinderGeometry(legThickness, legThickness * 0.7, stoolHeight - seatHeight, 8);
          // Angle legs slightly outward for realistic design stability
          legGeo.rotateZ(i % 2 === 0 ? 0.08 : -0.08);
          
          const legMesh = new THREE.Mesh(legGeo, legMaterial);
          const xPos = Math.cos(angle) * (stoolRadius - 0.04);
          const zPos = Math.sin(angle) * (stoolRadius - 0.04);
          legMesh.position.set(xPos, (stoolHeight - seatHeight) / 2, zPos);
          legMesh.castShadow = true;
          itemGroup.add(legMesh);
        }

        // Metal support ring or wood stretchers
        const ringGeo = new THREE.TorusGeometry(stoolRadius - 0.05, 0.006, 6, 16).rotateX(Math.PI / 2);
        const ringMesh = new THREE.Mesh(ringGeo, legMaterial);
        ringMesh.position.y = 0.15;
        itemGroup.add(ringMesh);
        break;
      }

      case "sofas": {
        // Deep, luxurious modular sectional cloud sofas (Custom box combinations)
        const sofaWidth = 0.95;
        const sofaDepth = 0.95;
        const sofaHeight = 0.68;
        const seatHeight = 0.35;
        const backrestThickness = 0.22;

        // Seat block (Thick plush box)
        const seatGeo = new THREE.BoxGeometry(sofaWidth, seatHeight - 0.04, sofaDepth);
        const seatMesh = new THREE.Mesh(seatGeo, mainFabricMat);
        seatMesh.position.set(0, (seatHeight - 0.04) / 2 + 0.04, 0);
        seatMesh.castShadow = true;
        seatMesh.receiveShadow = true;
        itemGroup.add(seatMesh);

        // Backrest block
        const backGeo = new THREE.BoxGeometry(sofaWidth, sofaHeight - seatHeight, backrestThickness);
        const backMesh = new THREE.Mesh(backGeo, mainFabricMat);
        backMesh.position.set(0, seatHeight + (sofaHeight - seatHeight) / 2, -sofaDepth / 2 + backrestThickness / 2);
        backMesh.castShadow = true;
        backMesh.receiveShadow = true;
        itemGroup.add(backMesh);

        // Side armrests (Looming side cushions)
        const armWidth = 0.18;
        const armHeight = 0.52;
        const armDepth = sofaDepth - backrestThickness;

        // Left Armrest
        const leftArmGeo = new THREE.BoxGeometry(armWidth, armHeight, armDepth);
        const leftArmMesh = new THREE.Mesh(leftArmGeo, mainFabricMat);
        leftArmMesh.position.set(-sofaWidth / 2 + armWidth / 2, armHeight / 2, backrestThickness / 2);
        leftArmMesh.castShadow = true;
        leftArmMesh.receiveShadow = true;
        itemGroup.add(leftArmMesh);

        // Right Armrest
        const rightArmGeo = new THREE.BoxGeometry(armWidth, armHeight, armDepth);
        const rightArmMesh = new THREE.Mesh(rightArmGeo, mainFabricMat);
        rightArmMesh.position.set(sofaWidth / 2 - armWidth / 2, armHeight / 2, backrestThickness / 2);
        rightArmMesh.castShadow = true;
        rightArmMesh.receiveShadow = true;
        itemGroup.add(rightArmMesh);

        // Legs (Tiny wood cylinders)
        const legGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.04, 8);
        for (let xOff of [-0.4, 0.4]) {
          for (let zOff of [-0.4, 0.4]) {
            const leg = new THREE.Mesh(legGeo, woodMat);
            leg.position.set(xOff, 0.02, zOff);
            leg.castShadow = true;
            itemGroup.add(leg);
          }
        }
        break;
      }

      case "cushions": {
        // Cushions: Fluffy squashed square pillowy box mesh, tilted slightly
        const size = 0.45;
        const thickness = 0.12;

        const cushionGeo = new THREE.BoxGeometry(size, thickness, size, 4, 2, 4);
        
        // Deform vertices to make it puffy and non-rigid!
        const posAttr = cushionGeo.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
          const x = posAttr.getX(i);
          const y = posAttr.getY(i);
          const z = posAttr.getZ(i);

          // Puffy swelling calculation
          if (Math.abs(y) < 0.01) {
            const factor = 1.15;
            posAttr.setXY(i, x * factor, z * factor);
          } else {
            const factor = 0.9;
            posAttr.setXY(i, x * factor, z * factor);
          }
        }
        cushionGeo.computeVertexNormals();

        const cushionMesh = new THREE.Mesh(cushionGeo, mainFabricMat);
        cushionMesh.position.y = thickness / 2;
        cushionMesh.castShadow = true;
        cushionMesh.receiveShadow = true;
        itemGroup.add(cushionMesh);

        // Add soft seam line detail
        const seamGeo = new THREE.TorusGeometry(size / 2 + 0.005, 0.008, 4, 32).rotateX(Math.PI / 2);
        const seamMesh = new THREE.Mesh(seamGeo, new THREE.MeshStandardMaterial({
          color: new THREE.Color(fabricMatColor).multiplyScalar(0.85),
          roughness: 0.95
        }));
        seamMesh.position.y = thickness / 2;
        itemGroup.add(seamMesh);

        // Tilt item slightly to look organic
        itemGroup.rotation.x = 0.15;
        break;
      }

      case "throws": {
        // Drapes: FoldedParametric waves representing loomed merino wool throws
        const width = 0.65;
        const depth = 0.85;

        // Custom organic wavy sheet using low-poly grid
        const throwGeo = new THREE.PlaneGeometry(width, depth, 12, 12);
        throwGeo.rotateX(-Math.PI / 2);

        // Apply dynamic wave offsets to mimic soft fabric drape
        const posAttr = throwGeo.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
          const x = posAttr.getX(i);
          const z = posAttr.getZ(i);
          // Create sine ripple wave
          const wave = Math.sin(x * 6) * 0.02 + Math.cos(z * 4) * 0.015;
          posAttr.setY(i, wave + 0.02); // Elevate slightly
        }
        throwGeo.computeVertexNormals();

        const throwMesh = new THREE.Mesh(throwGeo, mainFabricMat);
        throwMesh.castShadow = true;
        throwMesh.receiveShadow = true;
        itemGroup.add(throwMesh);

        // Add folded double layered mesh for thickness
        const thicknessOffset = 0.005;
        const thickMesh = throwMesh.clone();
        thickMesh.position.y = -thicknessOffset;
        itemGroup.add(thickMesh);
        break;
      }

      case "rugs": {
        // Flat area rug slightly above floor (to prevent z-fighting)
        const rugWidth = 2.2;
        const rugDepth = 1.6;
        const rugGeo = new THREE.PlaneGeometry(rugWidth, rugDepth);
        rugGeo.rotateX(-Math.PI / 2);
        const rugMesh = new THREE.Mesh(rugGeo, mainFabricMat);
        rugMesh.position.y = 0.002; // Tiny hover above floor
        rugMesh.receiveShadow = true;
        itemGroup.add(rugMesh);

        // Add soft fringe borders at ends of the rug
        const fringeMat = new THREE.MeshStandardMaterial({
          color: 0xECE9E2,
          roughness: 0.9,
        });
        for (let i = 0; i < 2; i++) {
          const zSide = i === 0 ? -rugDepth / 2 : rugDepth / 2;
          const fringeGeo = new THREE.BoxGeometry(rugWidth, 0.005, 0.02);
          const fringeMesh = new THREE.Mesh(fringeGeo, fringeMat);
          fringeMesh.position.set(0, 0.002, zSide);
          fringeMesh.receiveShadow = true;
          itemGroup.add(fringeMesh);
        }
        break;
      }

      case "chairs": {
        // Boucle swivel armchair
        const seatHeight = 0.38;
        const seatRadius = 0.35;
        const backrestHeight = 0.42;

        // Swivel circular base
        const baseGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.04, 16);
        const baseMesh = new THREE.Mesh(baseGeo, ironFrameMat);
        baseMesh.position.y = 0.02;
        baseMesh.castShadow = true;
        itemGroup.add(baseMesh);

        // Short metal swivel cylinder column
        const colGeo = new THREE.CylinderGeometry(0.04, 0.04, seatHeight - 0.04, 12);
        const colMesh = new THREE.Mesh(colGeo, ironFrameMat);
        colMesh.position.y = 0.02 + (seatHeight - 0.04) / 2;
        colMesh.castShadow = true;
        itemGroup.add(colMesh);

        // Circular cozy bucket seat
        const seatGeo = new THREE.CylinderGeometry(seatRadius, seatRadius, 0.12, 24);
        const seatMesh = new THREE.Mesh(seatGeo, mainFabricMat);
        seatMesh.position.y = seatHeight - 0.06;
        seatMesh.castShadow = true;
        seatMesh.receiveShadow = true;
        itemGroup.add(seatMesh);

        // Curved rounded backrest (Half cylinder wrapper)
        const backGeo = new THREE.CylinderGeometry(seatRadius + 0.01, seatRadius + 0.01, backrestHeight, 24, 1, true, -Math.PI / 2, Math.PI);
        const backMesh = new THREE.Mesh(backGeo, mainFabricMat);
        // Make the backrest double-sided
        backMesh.material.side = THREE.DoubleSide;
        backMesh.position.set(0, seatHeight + backrestHeight / 2 - 0.12, -0.01);
        backMesh.castShadow = true;
        backMesh.receiveShadow = true;
        itemGroup.add(backMesh);
        break;
      }

      default: {
        const fallbackGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const fallbackMesh = new THREE.Mesh(fallbackGeo, mainFabricMat);
        fallbackMesh.position.y = 0.15;
        itemGroup.add(fallbackMesh);
        break;
      }
    }

    return itemGroup;
  };

  // Draws CAD-style overlay lines, dimensions text, bounding boxes and clearance fields
  const drawHUDIndicators = (item: Placed3DItem, group: THREE.Group) => {
    const scene = sceneRef.current;
    const guidesGroup = dimensionGuidesGroupRef.current;
    if (!scene || !guidesGroup) return;

    // 1. Calculate bounding size of the group
    const bbox = new THREE.Box3().setFromObject(group);
    const size = new THREE.Vector3();
    bbox.getSize(size);

    // Bounding Box edges helper
    const boxHelper = new THREE.BoxHelper(group, 0xCE7E65); // Warm Sienna contrast indicator
    guidesGroup.add(boxHelper);

    // 2. Draw Floor clearance outline projection (Soft circle under item)
    const footprintRadius = Math.max(size.x, size.z) * 0.6;
    const circleGeo = new THREE.RingGeometry(footprintRadius - 0.01, footprintRadius, 32);
    circleGeo.rotateX(-Math.PI / 2);
    const circleMat = new THREE.MeshBasicMaterial({ color: 0xCE7E65, side: THREE.DoubleSide, transparent: true, opacity: 0.4 });
    const circleMesh = new THREE.Mesh(circleGeo, circleMat);
    circleMesh.position.set(item.x, 0.005, item.z); // sit just above grid lines
    guidesGroup.add(circleMesh);

    // 3. Draw architectural coordinate projection line guides (extends to back walls)
    const lineMat = new THREE.LineBasicMaterial({ color: 0xCE7E65, transparent: true, opacity: 0.5 });

    // Ray to Left wall (X projection)
    const pointsX = [
      new THREE.Vector3(item.x, item.y + size.y / 2, item.z),
      new THREE.Vector3(-roomWidth / 2, item.y + size.y / 2, item.z)
    ];
    const lineXGeo = new THREE.BufferGeometry().setFromPoints(pointsX);
    const lineX = new THREE.Line(lineXGeo, lineMat);
    guidesGroup.add(lineX);

    // Ray to Back wall (Z projection)
    const pointsZ = [
      new THREE.Vector3(item.x, item.y + size.y / 2, item.z),
      new THREE.Vector3(item.x, item.y + size.y / 2, -roomDepth / 2)
    ];
    const lineZGeo = new THREE.BufferGeometry().setFromPoints(pointsZ);
    const lineZ = new THREE.Line(lineZGeo, lineMat);
    guidesGroup.add(lineZ);

    // Ray to floor (Height projection)
    const pointsY = [
      new THREE.Vector3(item.x, item.y, item.z),
      new THREE.Vector3(item.x, 0, item.z)
    ];
    const lineYGeo = new THREE.BufferGeometry().setFromPoints(pointsY);
    const lineY = new THREE.Line(lineYGeo, lineMat);
    guidesGroup.add(lineY);
  };

  // --- CLOUD STORAGE STORAGE HANDLERS ---
  const handleSaveToCloud = async (overwriteBinId?: string) => {
    if (placedItems.length === 0) {
      alert("Please add at least one item to your room before saving.");
      return;
    }
    
    setIsSavingCloud(true);
    try {
      const designPayload = {
        placedItems: placedItems.map(item => ({
          productId: item.product.id,
          x: item.x,
          y: item.y,
          z: item.z,
          rotation: item.rotation,
          scale: item.scale,
          colorVariantIdx: item.colorVariantIdx
        })),
        roomWidth,
        roomDepth,
        roomHeight,
        wallFinish,
        floorFinish
      };

      const url = overwriteBinId ? `/api/designs/${overwriteBinId}` : "/api/designs";
      const method = overwriteBinId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: cloudDesignName,
          design: designPayload
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to save design to the cloud.");
      }

      const binId = result.binId;
      const savedName = result.name;

      if (overwriteBinId) {
        const updatedList = savedDesignsList.map(item => 
          item.binId === binId ? { ...item, name: savedName, savedAt: new Date().toLocaleDateString() } : item
        );
        setSavedDesignsList(updatedList);
        localStorage.setItem("loom_layer_cloud_designs", JSON.stringify(updatedList));
        setSuccessToast(`Blueprint "${savedName}" successfully updated in cloud!`);
      } else {
        const newItem = {
          binId,
          name: savedName,
          savedAt: new Date().toLocaleDateString()
        };
        const newList = [newItem, ...savedDesignsList];
        setSavedDesignsList(newList);
        localStorage.setItem("loom_layer_cloud_designs", JSON.stringify(newList));
        setCloudDesignCode(binId);
        setSuccessToast(`Blueprint "${savedName}" saved to cloud! Code: ${binId}`);
      }

      setTimeout(() => setSuccessToast(null), 6000);
    } catch (err: any) {
      console.error("Save cloud error:", err);
      alert(err.message || "Could not connect to server storage. Please check your JSONBIN_API_KEY.");
    } finally {
      setIsSavingCloud(false);
    }
  };

  const handleLoadFromCloud = async (binIdToLoad: string) => {
    if (!binIdToLoad.trim()) {
      alert("Please enter or select a valid Cloud Blueprint Code.");
      return;
    }

    setIsLoadingCloud(true);
    try {
      const response = await fetch(`/api/designs/${binIdToLoad.trim()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch blueprint from cloud.");
      }

      const data = result.data;
      if (!data || !data.design) {
        throw new Error("Invalid cloud blueprint data format.");
      }

      const design = data.design;
      
      setRoomWidth(design.roomWidth || 4.5);
      setRoomDepth(design.roomDepth || 4.0);
      setRoomHeight(design.roomHeight || 2.8);
      if (design.wallFinish) setWallFinish(design.wallFinish);
      if (design.floorFinish) setFloorFinish(design.floorFinish);
      if (data.name) setCloudDesignName(data.name);

      const restoredItems = (design.placedItems || []).map((item: any, idx: number) => {
        const product = products.find(p => p.id === item.productId);
        if (!product) return null;
        return {
          id: `cloud-${idx}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          product,
          x: item.x,
          y: item.y,
          z: item.z,
          rotation: item.rotation,
          scale: item.scale,
          colorVariantIdx: item.colorVariantIdx || 0
        };
      }).filter(Boolean) as Placed3DItem[];

      // Clear current meshes
      Object.keys(meshInstancesRef.current).forEach((id) => {
        const group = meshInstancesRef.current[id];
        if (group && objectsGroupRef.current) {
          objectsGroupRef.current.remove(group);
        }
        disposeRecursive(group);
      });
      meshInstancesRef.current = {};

      setPlacedItems(restoredItems);
      if (restoredItems.length > 0) {
        setSelectedItemId(restoredItems[0].id);
      } else {
        setSelectedItemId(null);
      }

      setSuccessToast(`Blueprint "${data.name}" successfully loaded from cloud!`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      console.error("Load cloud error:", err);
      alert(err.message || "Failed to load cloud blueprint. Verify your code and configuration.");
    } finally {
      setIsLoadingCloud(false);
    }
  };

  const handleDeleteSavedLocal = (binId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedDesignsList.filter(item => item.binId !== binId);
    setSavedDesignsList(updated);
    localStorage.setItem("loom_layer_cloud_designs", JSON.stringify(updated));
  };

  // --- CONTROLS ACTION HANDLERS ---

  // Curated room templates for rapid styling
  const applyRoomTemplate = (templateName: "lounge" | "reading" | "tea") => {
    let itemsToPlace: Array<{ productId: string; x: number; y: number; z: number; rotation: number; scale: number; colorVariantIdx: number }> = [];

    if (templateName === "lounge") {
      itemsToPlace = [
        { productId: "sg-005", x: 0, y: 0, z: -0.5, rotation: 0, scale: 1.0, colorVariantIdx: 0 },
        { productId: "sg-003", x: -0.2, y: 0.35, z: -0.4, rotation: 0.15, scale: 1.0, colorVariantIdx: 0 },
        { productId: "sg-007", x: 0.3, y: 0.35, z: -0.3, rotation: -0.1, scale: 1.0, colorVariantIdx: 0 },
        { productId: "sg-001", x: -0.7, y: 0, z: 0.5, rotation: 0, scale: 1.0, colorVariantIdx: 0 },
        { productId: "sg-009", x: 0, y: 0, z: 0.3, rotation: 0, scale: 1.0, colorVariantIdx: 0 }
      ];
    } else if (templateName === "reading") {
      itemsToPlace = [
        { productId: "sg-010", x: -0.5, y: 0, z: 0.1, rotation: 0.5, scale: 1.0, colorVariantIdx: 0 },
        { productId: "sg-011", x: -0.5, y: 0.4, z: 0.1, rotation: 0.5, scale: 1.0, colorVariantIdx: 0 },
        { productId: "sg-002", x: 0.4, y: 0, z: 0.3, rotation: 0, scale: 1.0, colorVariantIdx: 0 },
        { productId: "sg-007", x: -0.5, y: 0.3, z: 0, rotation: 0.3, scale: 1.0, colorVariantIdx: 1 }
      ];
    } else if (templateName === "tea") {
      itemsToPlace = [
        { productId: "sg-008", x: 0.5, y: 0, z: -0.1, rotation: 0, scale: 1.0, colorVariantIdx: 0 },
        { productId: "sg-001", x: -0.4, y: 0, z: 0.3, rotation: 0, scale: 1.0, colorVariantIdx: 1 },
        { productId: "sg-009", x: 0, y: 0, z: 0.1, rotation: 0, scale: 1.0, colorVariantIdx: 2 }
      ];
    }

    const newPlacedItems = itemsToPlace.map((item, idx) => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return null;
      return {
        id: `template-${templateName}-${idx}-${Date.now()}`,
        product: product,
        x: item.x,
        y: item.y,
        z: item.z,
        rotation: item.rotation,
        scale: item.scale,
        colorVariantIdx: item.colorVariantIdx
      };
    }).filter(Boolean) as Placed3DItem[];

    setPlacedItems(newPlacedItems);
    setSelectedItemId(newPlacedItems[0]?.id || null);
    
    // Auto trigger Three.JS updates on geometry changes by letting parent canvas context reset
    setSuccessToast(`Curated layout loaded successfully.`);
  };

  // Adds a product to the 3D room, calculating smart centered placement with height offset
  const handlePlaceProduct = (product: Product) => {
    // Generate unique ID
    const newId = `3d-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Stacking/Placement: Find empty spots or space slightly offset
    const offsetCount = placedItems.length;
    const xOffset = (offsetCount % 3 - 1) * 0.45;
    const zOffset = (Math.floor(offsetCount / 3) % 3 - 1) * 0.45;

    // Check if sofa module and adjust position
    const isSofa = product.category === "sofas";
    const initialHeight = 0; // standard floor alignment

    const newItem: Placed3DItem = {
      id: newId,
      product,
      x: THREE.MathUtils.clamp(xOffset, -roomWidth / 2 + 0.5, roomWidth / 2 - 0.5),
      y: initialHeight,
      z: THREE.MathUtils.clamp(zOffset, -roomDepth / 2 + 0.5, roomDepth / 2 - 0.5),
      rotation: 0,
      scale: 1.0,
      colorVariantIdx: 0
    };

    setPlacedItems((prev) => [...prev, newItem]);
    setSelectedItemId(newId);
    setActiveTab("inspector");

    setSuccessToast(`Placed ${product.name} inside your 3D design canvas.`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Duplicates the currently selected item with a small layout offset
  const handleDuplicateItem = (item: Placed3DItem) => {
    const newId = `3d-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const duplicated: Placed3DItem = {
      ...item,
      id: newId,
      x: THREE.MathUtils.clamp(item.x + 0.3, -roomWidth / 2 + 0.5, roomWidth / 2 - 0.5),
      z: THREE.MathUtils.clamp(item.z + 0.3, -roomDepth / 2 + 0.5, roomDepth / 2 - 0.5),
    };

    setPlacedItems((prev) => [...prev, duplicated]);
    setSelectedItemId(newId);
    setSuccessToast(`Copied and shifted ${item.product.name}.`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  // Removes an item from the 3D scene
  const handleDeleteItem = (id: string) => {
    setPlacedItems((prev) => prev.filter((item) => item.id !== id));
    if (selectedItemId === id) setSelectedItemId(null);
  };

  // Updates specific numeric properties on placed item (rotation, scale, X/Y/Z coords)
  const handleUpdateItemProp = (id: string, key: keyof Placed3DItem, value: number) => {
    setPlacedItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        // Apply wall limits/collisions to coordinates
        if (key === "x") {
          const limitX = roomWidth / 2 - 0.2;
          return { ...item, x: THREE.MathUtils.clamp(value, -limitX, limitX) };
        }
        if (key === "z") {
          const limitZ = roomDepth / 2 - 0.2;
          return { ...item, z: THREE.MathUtils.clamp(value, -limitZ, limitZ) };
        }
        if (key === "y") {
          return { ...item, y: THREE.MathUtils.clamp(value, 0, roomHeight - 0.2) };
        }

        return { ...item, [key]: value };
      })
    );
  };

  // Swaps a color variant for the placed item
  const handleSetColorVariant = (id: string, idx: number) => {
    setPlacedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, colorVariantIdx: idx } : item))
    );

    // Rebuild the mesh specifically to trigger material update
    const oldGroup = meshInstancesRef.current[id];
    if (oldGroup && objectsGroupRef.current) {
      objectsGroupRef.current.remove(oldGroup);
      disposeRecursive(oldGroup);
      delete meshInstancesRef.current[id];
    }
  };

  // Capture current canvas layout as PNG and download
  const handleCaptureSnapshot = () => {
    if (!rendererRef.current) return;
    
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 300);

    // Ensure frame is fully rendered before downloading
    const canvas = rendererRef.current.domElement;
    const imgData = canvas.toDataURL("image/png");
    
    const link = document.createElement("a");
    link.download = `shiv-ganga-3d-blueprint-${Date.now()}.png`;
    link.href = imgData;
    link.click();

    setSuccessToast("High-resolution 3D blueprint snapshot saved to your devices.");
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Adds all staged products on the canvas to the shopping cart order list
  const handleBulkAddToCart = () => {
    if (placedItems.length === 0) return;
    const productsToAdd = placedItems.map((i) => i.product);
    onAddMultipleToCart(productsToAdd);
    
    setSuccessToast(`Success! Added all ${placedItems.length} elements to your room combo cart.`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const selectedItem = placedItems.find((i) => i.id === selectedItemId);
  const totalCost = placedItems.reduce((sum, i) => sum + i.product.price, 0);

  return (
    <div className="relative flex flex-col space-y-6">
      
      {/* Toast Alert */}
      {successToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-editorial-ink text-white text-[10px] uppercase tracking-widest font-bold py-3.5 px-6 border border-white/20 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          {successToast}
        </div>
      )}

      {/* Screen flash camera snapshot feedback */}
      {showFlash && (
        <div className="fixed inset-0 z-50 bg-white pointer-events-none animate-flash-out" />
      )}

      {/* Title Header with interactive Volume Estimators */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-editorial-border pb-5">
        <div>
          <span className="text-[9px] font-bold tracking-[0.25em] text-editorial-accent uppercase">
            Interactive CAD Suite
          </span>
          <h1 className="font-serif text-2xl font-normal text-editorial-ink mt-1">
            3D Room Planner & Dimensions Studio
          </h1>
          <p className="text-xs text-editorial-ink/60 font-light mt-1 max-w-xl">
            Design your floor layout in full interactive 3D. Inspect high-fidelity procedural renders, precise measurements, blueprint outlines, and certified wood/fiber specs in real-time.
          </p>
        </div>

        {/* Global Blueprint Metrics Cards */}
        <div className="flex items-center space-x-4 shrink-0">
          <div className="border border-editorial-border bg-white p-3 min-w-[110px] text-center shadow-xs">
            <span className="block text-[8px] font-bold text-editorial-accent uppercase tracking-wider mb-1">Room footprint</span>
            <span className="font-mono text-sm font-bold text-editorial-ink">{(roomWidth * roomDepth).toFixed(1)} m²</span>
            <span className="block text-[8px] text-editorial-ink/50 mt-0.5">{(roomWidth * 3.28 * roomDepth * 3.28).toFixed(0)} sq ft</span>
          </div>
          <div className="border border-editorial-border bg-white p-3 min-w-[110px] text-center shadow-xs">
            <span className="block text-[8px] font-bold text-editorial-accent uppercase tracking-wider mb-1">Combo Pieces</span>
            <span className="font-mono text-sm font-bold text-editorial-ink">{placedItems.length} Items</span>
            <span className="block text-[8px] text-editorial-ink/50 mt-0.5">${totalCost} Combined</span>
          </div>
          {placedItems.length > 0 && (
            <button
              onClick={handleBulkAddToCart}
              className="flex items-center justify-center space-x-1.5 h-[62px] border border-editorial-ink bg-editorial-ink hover:bg-editorial-accent text-white px-5 text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Add All to Order</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Builder Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: 3D Render & Interactive viewport (8 cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          
          {/* Top Bar controls for Environment Mood, Camera preset, and Grid Helper */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 border border-editorial-border text-[10px] uppercase tracking-wider font-bold text-editorial-ink">
            
            {/* Ambient Lighting Mixers */}
            <div className="flex items-center space-x-3">
              <span className="text-editorial-accent">Illumination Mood:</span>
              <div className="flex items-center space-x-1">
                {(["daylight", "sunset", "overcast", "candlelight"] as const).map((mood) => (
                  <button
                    key={mood}
                    onClick={() => setLightingMood(mood)}
                    className={`px-2 py-1 border transition-all cursor-pointer ${
                      lightingMood === mood
                        ? "bg-editorial-ink border-editorial-ink text-white"
                        : "bg-editorial-accent-soft border-editorial-border text-editorial-ink hover:bg-white"
                    }`}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            {/* Layout Helpers */}
            <div className="flex items-center space-x-2.5">
              
              {/* Bounding Box HUD toggle */}
              <button
                onClick={() => setShowDimensionsHUD(!showDimensionsHUD)}
                className={`flex items-center space-x-1 px-2.5 py-1.5 border transition-all cursor-pointer ${
                  showDimensionsHUD ? "bg-editorial-accent-soft border-editorial-accent text-editorial-ink" : "bg-white border-editorial-border text-editorial-accent"
                }`}
                title="Toggle real-time architectural blueprint dimension markers"
              >
                <Maximize2 className="h-3 w-3 text-editorial-accent" />
                <span>Dimensions HUD</span>
              </button>

              {/* Grid Toggle */}
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`flex items-center space-x-1 px-2.5 py-1.5 border transition-all cursor-pointer ${
                  showGrid ? "bg-editorial-accent-soft border-editorial-accent text-editorial-ink" : "bg-white border-editorial-border text-editorial-accent"
                }`}
              >
                <Grid className="h-3 w-3" />
                <span>Floor Grid</span>
              </button>

            </div>

          </div>

          {/* Viewport 3D Canvas wrapper */}
          <div className="relative w-full aspect-[4/3] bg-editorial-accent-soft border border-editorial-border shadow-inner overflow-hidden select-none">
            
            {/* The canvas container */}
            <div ref={canvasContainerRef} className="absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing" />

            {/* Bounding HUD Overlay Card inside 3D Canvas showing exact coordinates */}
            {selectedItem && showDimensionsHUD && (
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md border border-editorial-ink p-4 w-60 text-editorial-ink shadow-lg animate-in fade-in duration-200 pointer-events-auto">
                <div className="flex items-center justify-between border-b border-editorial-border pb-2 mb-2.5">
                  <span className="text-[8px] font-bold text-editorial-accent uppercase tracking-widest">Active 3D HUD Specs</span>
                  <button onClick={() => setSelectedItemId(null)} className="hover:text-editorial-accent">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <h3 className="font-serif text-xs font-bold leading-tight truncate">{selectedItem.product.name}</h3>
                <span className="text-[8px] tracking-widest font-bold text-editorial-accent uppercase block mt-0.5">{selectedItem.product.category}</span>

                <div className="mt-3.5 space-y-1.5 text-[10px] font-mono border-t border-dashed border-editorial-border pt-3">
                  <div className="flex justify-between">
                    <span className="text-editorial-accent">Product Width:</span>
                    <span className="font-bold">{selectedItem.product.dimensions.split(" x ")[0] || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-editorial-accent">Product Depth:</span>
                    <span className="font-bold">{selectedItem.product.dimensions.split(" x ")[1] || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-editorial-accent">Product Height:</span>
                    <span className="font-bold">{selectedItem.product.dimensions.split(" x ")[2] || "N/A"}</span>
                  </div>
                  <div className="flex justify-between border-t border-editorial-border/30 pt-1.5 mt-1.5">
                    <span className="text-editorial-accent">Placer Offset X:</span>
                    <span className="font-bold">{selectedItem.x.toFixed(2)} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-editorial-accent">Placer Offset Z:</span>
                    <span className="font-bold">{selectedItem.z.toFixed(2)} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-editorial-accent">Placer Height Y:</span>
                    <span className="font-bold">{selectedItem.y.toFixed(2)} m</span>
                  </div>
                </div>
              </div>
            )}

            {/* Instruction Banner if canvas is empty */}
            {placedItems.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-editorial-ink/5 pointer-events-none p-4 text-center">
                <Box className="h-10 w-10 text-editorial-accent/60 stroke-[1.5] animate-bounce" />
                <h3 className="font-serif text-base font-bold text-editorial-ink mt-3">3D Designer Space Empty</h3>
                <p className="text-xs text-editorial-ink/60 font-light mt-1 max-w-xs leading-relaxed">
                  Click on any Loom & Layer product on the right panel catalog dock to instantly project its 3D mesh scale replica onto the blueprint grid!
                </p>
              </div>
            )}

            {/* Camera Perspective presets overlay floating in bottom corner */}
            <div className="absolute bottom-4 right-4 flex items-center space-x-1.5 bg-white/90 backdrop-blur-xs border border-editorial-border p-1.5 rounded-none shadow-md">
              <span className="text-[8px] font-bold text-editorial-accent uppercase tracking-wider px-1.5">Camera View:</span>
              {(["free", "blueprint", "elevation", "isometric"] as const).map((view) => (
                <button
                  key={view}
                  onClick={() => setCameraPreset(view)}
                  className={`text-[8px] font-bold uppercase tracking-widest px-2.5 py-1.5 border transition-all cursor-pointer ${
                    cameraPreset === view
                      ? "bg-editorial-ink border-editorial-ink text-white"
                      : "bg-white border-editorial-border text-editorial-ink hover:bg-editorial-accent-soft"
                  }`}
                >
                  {view}
                </button>
              ))}
            </div>

            {/* Interactive camera reset & export action tools in bottom left */}
            <div className="absolute bottom-4 left-4 flex items-center space-x-1.5">
              <button
                onClick={() => {
                  cameraOrbitRef.current.theta = Math.PI / 4;
                  cameraOrbitRef.current.phi = Math.PI / 3;
                  cameraOrbitRef.current.radius = 7.5;
                  updateCameraPosition();
                }}
                className="flex items-center justify-center h-8 w-8 bg-white/95 border border-editorial-border hover:bg-editorial-ink hover:text-white text-editorial-ink shadow-md transition-all cursor-pointer"
                title="Reset Camera Angle"
              >
                <RotateCcw className="h-4.5 w-4.5" />
              </button>
              <button
                onClick={handleCaptureSnapshot}
                className="flex items-center space-x-1.5 px-3.5 h-8 bg-white/95 border border-editorial-border hover:bg-editorial-ink hover:text-white text-editorial-ink shadow-md font-bold text-[9px] uppercase tracking-wider transition-all cursor-pointer"
                title="Export high-fidelity 3D rendering snapshot"
              >
                <Camera className="h-4 w-4 text-editorial-accent" />
                <span>Export Layout</span>
              </button>
            </div>

          </div>

          {/* Quick Help Indicator Bar */}
          <div className="flex items-center space-x-2.5 text-[9px] font-medium text-editorial-ink/60 bg-editorial-accent-soft border border-editorial-border/60 p-2.5">
            <Compass className="h-4 w-4 text-editorial-accent" />
            <span>
              <strong>3D Navigation Guide:</strong> Left-click and Drag on empty canvas space to orbit. Scroll or Pinch to zoom in/out. Left-click any furniture object to edit its position, finishes, and dimensions.
            </span>
          </div>

        </div>

        {/* RIGHT COLUMN: Controls Panel Suite (4 cols) */}
        <div className="lg:col-span-4 flex flex-col bg-white border border-editorial-border shadow-xs min-h-[500px]">
          
          {/* Controls Tab selection bar */}
          <div className="grid grid-cols-3 border-b border-editorial-border text-center text-[10px] uppercase tracking-widest font-bold">
            <button
              onClick={() => setActiveTab("catalog")}
              className={`py-4 border-r border-editorial-border transition-all cursor-pointer ${
                activeTab === "catalog"
                  ? "bg-editorial-bg text-editorial-ink border-b-2 border-b-editorial-ink font-extrabold"
                  : "text-editorial-ink/40 hover:text-editorial-ink hover:bg-editorial-accent-soft"
              }`}
            >
              Add Items
            </button>
            <button
              onClick={() => setActiveTab("room")}
              className={`py-4 border-r border-editorial-border transition-all cursor-pointer ${
                activeTab === "room"
                  ? "bg-editorial-bg text-editorial-ink border-b-2 border-b-editorial-ink font-extrabold"
                  : "text-editorial-ink/40 hover:text-editorial-ink hover:bg-editorial-accent-soft"
              }`}
            >
              Room Specs
            </button>
            <button
              onClick={() => setActiveTab("inspector")}
              className={`py-4 transition-all cursor-pointer ${
                activeTab === "inspector"
                  ? "bg-editorial-bg text-editorial-ink border-b-2 border-b-editorial-ink font-extrabold"
                  : "text-editorial-ink/40 hover:text-editorial-ink hover:bg-editorial-accent-soft"
              }`}
            >
              Inspector
            </button>
          </div>

          {/* Tab Body scroll area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">

            {/* TAB 1: ADD PRODUCTS TO ROOM */}
            {activeTab === "catalog" && (
              <div className="space-y-4">
                <div className="border-b border-dashed border-editorial-border pb-3">
                  <h3 className="font-serif text-sm font-bold text-editorial-ink uppercase tracking-wider">Loom & Layer Inventory</h3>
                  <p className="text-[10px] text-editorial-ink/65 font-light leading-relaxed mt-1">
                    Select a handloomed Rajasthan masterpiece below to place its scaled dimensional structure inside your custom 3D studio.
                  </p>
                </div>

                <div className="space-y-3.5">
                  {products.map((prod) => (
                    <div 
                      key={prod.id}
                      className="group flex items-center justify-between p-2.5 border border-editorial-border hover:border-editorial-ink transition-all bg-editorial-accent-soft/35"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="h-12 w-12 object-cover border border-editorial-border"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h4 className="font-serif text-xs font-bold text-editorial-ink leading-tight">{prod.name}</h4>
                          <span className="text-[8px] font-bold text-editorial-accent uppercase tracking-widest block mt-0.5">{prod.category} • {prod.dimensions}</span>
                          <span className="font-serif text-xs text-editorial-ink block mt-1 font-semibold">${prod.price}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handlePlaceProduct(prod)}
                        className="flex h-8 w-8 items-center justify-center border border-editorial-ink hover:bg-editorial-ink hover:text-white transition-all cursor-pointer"
                        title="Add to 3D canvas"
                      >
                        <Plus className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: ROOM BLUEPRINT SPECIFICATIONS */}
            {activeTab === "room" && (
              <div className="space-y-6">
                
                {/* Pre-Styled Room Layout Templates */}
                <div className="space-y-3.5 bg-editorial-accent-soft p-4 border border-editorial-border">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-xs font-bold text-editorial-ink uppercase tracking-wider">
                      Curated Staged Layouts
                    </h3>
                    <span className="text-[8px] font-bold text-white bg-editorial-accent px-1.5 py-0.5 uppercase tracking-wider rounded-none">
                      Templates
                    </span>
                  </div>
                  <p className="text-[10px] text-editorial-ink/70 leading-relaxed font-light">
                    Instantly style your virtual studio with professionally configured arrangements of soft furnishings.
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-[9px] font-bold uppercase tracking-wider text-editorial-ink">
                    <button
                      onClick={() => applyRoomTemplate("lounge")}
                      className="p-2 border text-center transition-all cursor-pointer bg-white border-editorial-border hover:bg-editorial-ink hover:text-white"
                    >
                      Cozy Lounge
                    </button>
                    <button
                      onClick={() => applyRoomTemplate("reading")}
                      className="p-2 border text-center transition-all cursor-pointer bg-white border-editorial-border hover:bg-editorial-ink hover:text-white"
                    >
                      Reading Nook
                    </button>
                    <button
                      onClick={() => applyRoomTemplate("tea")}
                      className="p-2 border text-center transition-all cursor-pointer bg-white border-editorial-border hover:bg-editorial-ink hover:text-white"
                    >
                      Tea Corner
                    </button>
                  </div>
                </div>

                {/* Section A: Room Sizing */}
                <div className="space-y-4">
                  <h3 className="font-serif text-xs font-bold text-editorial-ink uppercase tracking-wider border-b border-editorial-border pb-2.5">
                    Room Dimensions
                  </h3>
                  
                  {/* Width slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold uppercase text-editorial-ink">
                      <span>Room Width (X)</span>
                      <span className="font-mono">{roomWidth.toFixed(1)}m ({(roomWidth * 3.28).toFixed(1)} ft)</span>
                    </div>
                    <input
                      type="range"
                      min="2.4"
                      max="6.0"
                      step="0.1"
                      value={roomWidth}
                      onChange={(e) => setRoomWidth(parseFloat(e.target.value))}
                      className="w-full h-1 bg-editorial-accent-soft appearance-none cursor-pointer outline-none accent-editorial-ink"
                    />
                  </div>

                  {/* Depth slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold uppercase text-editorial-ink">
                      <span>Room Depth (Z)</span>
                      <span className="font-mono">{roomDepth.toFixed(1)}m ({(roomDepth * 3.28).toFixed(1)} ft)</span>
                    </div>
                    <input
                      type="range"
                      min="2.4"
                      max="6.0"
                      step="0.1"
                      value={roomDepth}
                      onChange={(e) => setRoomDepth(parseFloat(e.target.value))}
                      className="w-full h-1 bg-editorial-accent-soft appearance-none cursor-pointer outline-none accent-editorial-ink"
                    />
                  </div>

                  {/* Height slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold uppercase text-editorial-ink">
                      <span>Ceiling Height (Y)</span>
                      <span className="font-mono">{roomHeight.toFixed(1)}m ({(roomHeight * 3.28).toFixed(1)} ft)</span>
                    </div>
                    <input
                      type="range"
                      min="2.2"
                      max="3.6"
                      step="0.1"
                      value={roomHeight}
                      onChange={(e) => setRoomHeight(parseFloat(e.target.value))}
                      className="w-full h-1 bg-editorial-accent-soft appearance-none cursor-pointer outline-none accent-editorial-ink"
                    />
                  </div>
                </div>

                {/* Section B: Architectural Finishes */}
                <div className="space-y-4">
                  <h3 className="font-serif text-xs font-bold text-editorial-ink uppercase tracking-wider border-b border-editorial-border pb-2.5">
                    Floor Finish
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-[9px] font-bold uppercase tracking-wider text-editorial-ink">
                    <button
                      onClick={() => setFloorFinish("light-oak")}
                      className={`p-2.5 border text-center transition-all cursor-pointer ${
                        floorFinish === "light-oak" ? "bg-editorial-ink text-white" : "bg-editorial-accent-soft hover:bg-white border-editorial-border"
                      }`}
                    >
                      Light Oak Wood
                    </button>
                    <button
                      onClick={() => setFloorFinish("dark-mango")}
                      className={`p-2.5 border text-center transition-all cursor-pointer ${
                        floorFinish === "dark-mango" ? "bg-editorial-ink text-white" : "bg-editorial-accent-soft hover:bg-white border-editorial-border"
                      }`}
                    >
                      Dark Mango Wood
                    </button>
                    <button
                      onClick={() => setFloorFinish("loft-concrete")}
                      className={`p-2.5 border text-center transition-all cursor-pointer ${
                        floorFinish === "loft-concrete" ? "bg-editorial-ink text-white" : "bg-editorial-accent-soft hover:bg-white border-editorial-border"
                      }`}
                    >
                      Loft Concrete
                    </button>
                    <button
                      onClick={() => setFloorFinish("ivory-tile")}
                      className={`p-2.5 border text-center transition-all cursor-pointer ${
                        floorFinish === "ivory-tile" ? "bg-editorial-ink text-white" : "bg-editorial-accent-soft hover:bg-white border-editorial-border"
                      }`}
                    >
                      Ivory Marble Tile
                    </button>
                  </div>
                </div>

                {/* Section C: Wall Paints */}
                <div className="space-y-4">
                  <h3 className="font-serif text-xs font-bold text-editorial-ink uppercase tracking-wider border-b border-editorial-border pb-2.5">
                    Wall Paint Hue
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-[9px] font-bold uppercase tracking-wider text-editorial-ink">
                    <button
                      onClick={() => setWallFinish("alabaster")}
                      className={`flex items-center space-x-2 p-2.5 border transition-all cursor-pointer ${
                        wallFinish === "alabaster" ? "bg-editorial-ink text-white border-editorial-ink" : "bg-editorial-accent-soft hover:bg-white border-editorial-border"
                      }`}
                    >
                      <div className="h-3 w-3 rounded-full bg-[#F4F3EF] border border-black/10 shrink-0" />
                      <span>Alabaster</span>
                    </button>
                    <button
                      onClick={() => setWallFinish("desert-sand")}
                      className={`flex items-center space-x-2 p-2.5 border transition-all cursor-pointer ${
                        wallFinish === "desert-sand" ? "bg-editorial-ink text-white border-editorial-ink" : "bg-editorial-accent-soft hover:bg-white border-editorial-border"
                      }`}
                    >
                      <div className="h-3 w-3 rounded-full bg-[#E3D7C5] border border-black/10 shrink-0" />
                      <span>Desert Sand</span>
                    </button>
                    <button
                      onClick={() => setWallFinish("forest-sage")}
                      className={`flex items-center space-x-2 p-2.5 border transition-all cursor-pointer ${
                        wallFinish === "forest-sage" ? "bg-editorial-ink text-white border-editorial-ink" : "bg-editorial-accent-soft hover:bg-white border-editorial-border"
                      }`}
                    >
                      <div className="h-3 w-3 rounded-full bg-[#7E8576] border border-black/10 shrink-0" />
                      <span>Forest Sage</span>
                    </button>
                    <button
                      onClick={() => setWallFinish("charcoal")}
                      className={`flex items-center space-x-2 p-2.5 border transition-all cursor-pointer ${
                        wallFinish === "charcoal" ? "bg-editorial-ink text-white border-editorial-ink" : "bg-editorial-accent-soft hover:bg-white border-editorial-border"
                      }`}
                    >
                      <div className="h-3 w-3 rounded-full bg-[#303233] border border-black/10 shrink-0" />
                      <span>Charcoal</span>
                    </button>
                  </div>
                </div>

                {/* Section D: Cloud Storage Blueprints */}
                <div className="space-y-4 pt-4 border-t border-editorial-border">
                  <h3 className="font-serif text-xs font-bold text-editorial-ink uppercase tracking-wider flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Cloud className="h-4 w-4 text-editorial-accent" />
                      <span>Cloud Blueprints (JSONbin)</span>
                    </div>
                    {isJsonbinConfigured === true && (
                      <span className="flex items-center gap-1 text-[8px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 uppercase tracking-wider border border-emerald-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Connected
                      </span>
                    )}
                    {isJsonbinConfigured === false && (
                      <span className="flex items-center gap-1 text-[8px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 uppercase tracking-wider border border-amber-200 animate-pulse">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        Key Missing
                      </span>
                    )}
                    {isJsonbinConfigured === null && (
                      <span className="flex items-center gap-1 text-[8px] font-bold text-editorial-ink/40 bg-white px-1.5 py-0.5 uppercase tracking-wider border border-editorial-border">
                        Checking...
                      </span>
                    )}
                  </h3>
                  
                  <div className="bg-editorial-accent-soft p-4 border border-editorial-border/60 space-y-4">
                    {isJsonbinConfigured === false && (
                      <div className="p-3 bg-amber-50/80 border border-amber-200 text-amber-800 rounded-none space-y-1 text-left">
                        <p className="text-[10px] font-bold leading-normal flex items-center gap-1">
                          ⚠️ Connection Action Required
                        </p>
                        <p className="text-[9px] text-amber-800/80 font-light leading-relaxed">
                          To activate Cloud Storage, open the <strong className="font-semibold">Settings (gear icon)</strong> panel in the top-right of AI Studio, go to <strong className="font-semibold">Secrets / Environment Variables</strong>, and add <strong className="font-semibold">JSONBIN_API_KEY</strong> with your API key from <a href="https://jsonbin.io" target="_blank" rel="noreferrer" className="underline font-medium hover:text-amber-950">jsonbin.io</a>.
                        </p>
                      </div>
                    )}

                    {/* Save Blueprint Form */}
                    <div className="space-y-2">
                      <label className="block text-[8px] font-bold text-editorial-accent uppercase tracking-wider">
                        Blueprint Name / Label
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={cloudDesignName}
                          onChange={(e) => setCloudDesignName(e.target.value)}
                          placeholder="e.g. Modern Scandinavian Lounge"
                          className="flex-1 bg-white border border-editorial-border px-2.5 py-1.5 text-xs text-editorial-ink outline-none placeholder-editorial-ink/30 font-medium"
                        />
                        <button
                          onClick={() => handleSaveToCloud()}
                          disabled={isSavingCloud || placedItems.length === 0}
                          className="px-3 bg-editorial-ink hover:bg-editorial-accent text-white font-bold text-[9px] uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1 shrink-0"
                          title="Save this layout design to the cloud"
                        >
                          {isSavingCloud ? "Saving..." : "Save New"}
                        </button>
                      </div>
                    </div>

                    {/* Load Blueprint Form */}
                    <div className="space-y-2 border-t border-dashed border-editorial-border/60 pt-3">
                      <label className="block text-[8px] font-bold text-editorial-accent uppercase tracking-wider">
                        Load Shareable Design Code
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={cloudDesignCode}
                          onChange={(e) => setCloudDesignCode(e.target.value)}
                          placeholder="Paste JSONbin code here..."
                          className="flex-1 bg-white border border-editorial-border px-2.5 py-1.5 text-xs font-mono text-editorial-ink outline-none placeholder-editorial-ink/30"
                        />
                        <button
                          onClick={() => handleLoadFromCloud(cloudDesignCode)}
                          disabled={isLoadingCloud || !cloudDesignCode.trim()}
                          className="px-3 bg-editorial-accent hover:bg-editorial-ink text-white font-bold text-[9px] uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1 shrink-0"
                        >
                          {isLoadingCloud ? "Loading..." : "Load Code"}
                        </button>
                      </div>
                    </div>

                    {/* Recent Cloud Blueprints List */}
                    {savedDesignsList.length > 0 && (
                      <div className="space-y-2 border-t border-dashed border-editorial-border/60 pt-3">
                        <span className="block text-[8px] font-bold text-editorial-accent uppercase tracking-wider mb-2">
                          Your Saved Cloud Blueprints
                        </span>
                        <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                          {savedDesignsList.map((design) => (
                            <div 
                              key={design.binId} 
                              onClick={() => {
                                setCloudDesignCode(design.binId);
                                handleLoadFromCloud(design.binId);
                              }}
                              className="group flex items-center justify-between p-2 bg-white border border-editorial-border/50 hover:border-editorial-ink transition-all cursor-pointer text-left"
                            >
                              <div className="truncate pr-2">
                                <span className="block text-[10px] font-bold text-editorial-ink truncate group-hover:text-editorial-accent">
                                  {design.name}
                                </span>
                                <span className="block text-[8px] text-editorial-ink/40 font-mono">
                                  Code: {design.binId.substring(0, 10)}... • {design.savedAt}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1 shrink-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCloudDesignName(design.name);
                                    handleSaveToCloud(design.binId);
                                  }}
                                  className="p-1 text-editorial-ink/50 hover:text-editorial-ink hover:bg-editorial-accent-soft rounded-none transition-all"
                                  title="Overwrite this cloud blueprint with current state"
                                >
                                  <UploadCloud className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(design.binId);
                                    setCopiedDesignId(design.binId);
                                    setTimeout(() => setCopiedDesignId(null), 2000);
                                  }}
                                  className="p-1 text-editorial-ink/50 hover:text-editorial-ink hover:bg-editorial-accent-soft rounded-none transition-all"
                                  title="Copy Design Code to clipboard"
                                >
                                  {copiedDesignId === design.binId ? (
                                    <Check className="h-3 w-3 text-green-600 animate-bounce" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                                <button
                                  onClick={(e) => handleDeleteSavedLocal(design.binId, e)}
                                  className="p-1 text-red-500/50 hover:text-red-500 hover:bg-red-50 rounded-none transition-all"
                                  title="Remove from recent list"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* TAB 3: SELECTED ITEM SPECIFIC CONTROLS & INSPECTOR */}
            {activeTab === "inspector" && (
              <div className="space-y-5">
                {!selectedItem ? (
                  <div className="text-center py-10 space-y-2">
                    <Sliders className="h-8 w-8 text-editorial-accent/50 mx-auto" />
                    <h3 className="font-serif text-sm font-bold text-editorial-ink">No Selected Item</h3>
                    <p className="text-[11px] text-editorial-ink/60 font-light max-w-xs mx-auto leading-relaxed">
                      Click directly on any furniture mesh inside the 3D Canvas above, or select an item from the placed inventory checklist below to activate the precision positioning and fabric swatches inspector.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    
                    {/* Header Detail */}
                    <div className="flex items-start justify-between border-b border-editorial-border pb-3.5">
                      <div className="flex space-x-3">
                        <img
                          src={selectedItem.product.image}
                          alt={selectedItem.product.name}
                          className="h-14 w-14 object-cover border border-editorial-border shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h4 className="font-serif text-xs font-bold text-editorial-ink leading-tight">{selectedItem.product.name}</h4>
                          <span className="text-[8px] font-bold text-editorial-accent uppercase tracking-widest block mt-0.5">
                            Category: {selectedItem.product.category}
                          </span>
                          <span className="text-[9px] font-mono text-editorial-ink/70 block mt-1 bg-editorial-accent-soft px-1.5 py-0.5 border border-editorial-border/40 w-fit">
                            Ref size: {selectedItem.product.dimensions}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedItemId(null)}
                        className="text-editorial-accent hover:text-editorial-ink"
                      >
                        <X className="h-4.5 w-4.5" />
                      </button>
                    </div>

                    {/* Quick Duplication & Deletion Actions */}
                    <div className="grid grid-cols-2 gap-2 text-[9px] font-bold uppercase tracking-wider">
                      <button
                        onClick={() => handleDuplicateItem(selectedItem)}
                        className="flex items-center justify-center space-x-1.5 p-2.5 border border-editorial-border bg-white hover:bg-editorial-accent-soft text-editorial-ink cursor-pointer"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        <span>Duplicate</span>
                      </button>
                      <button
                        onClick={() => handleDeleteItem(selectedItem.id)}
                        className="flex items-center justify-center space-x-1.5 p-2.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete Item</span>
                      </button>
                    </div>

                    {/* Swatches Customizer for current item */}
                    {PRODUCT_SWATCHES[selectedItem.product.id] && (
                      <div className="space-y-2 border-t border-b border-dashed border-editorial-border py-3">
                        <span className="text-[9px] font-bold text-editorial-accent uppercase tracking-wider block">Custom Finish Selection:</span>
                        <div className="flex items-center space-x-3.5">
                          {PRODUCT_SWATCHES[selectedItem.product.id].map((sw, idx) => (
                            <button
                              key={sw.name}
                              onClick={() => handleSetColorVariant(selectedItem.id, idx)}
                              className={`flex items-center space-x-1.5 p-1 border transition-all cursor-pointer ${
                                selectedItem.colorVariantIdx === idx
                                  ? "bg-editorial-ink text-white border-editorial-ink"
                                  : "bg-white border-editorial-border text-editorial-ink hover:bg-editorial-accent-soft"
                              }`}
                              title={sw.name}
                            >
                              <div className="h-3.5 w-3.5 rounded-full border border-black/15 shrink-0" style={{ backgroundColor: sw.color }} />
                              <span className="text-[9px] font-bold uppercase tracking-wider leading-none">{sw.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Precision 3D Placements controls */}
                    <div className="space-y-4">
                      <span className="text-[9px] font-bold text-editorial-accent uppercase tracking-wider block border-b border-editorial-border pb-1">Precision Placement</span>
                      
                      {/* Left-Right (X) axis */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-bold uppercase text-editorial-ink">
                          <span>Left / Right (Axis X)</span>
                          <span className="font-mono">{selectedItem.x.toFixed(2)}m</span>
                        </div>
                        <input
                          type="range"
                          min={-(roomWidth / 2 - 0.2)}
                          max={roomWidth / 2 - 0.2}
                          step="0.05"
                          value={selectedItem.x}
                          onChange={(e) => handleUpdateItemProp(selectedItem.id, "x", parseFloat(e.target.value))}
                          className="w-full h-1 bg-editorial-accent-soft appearance-none cursor-pointer outline-none accent-editorial-ink"
                        />
                      </div>

                      {/* Forward-Backward (Z) axis */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-bold uppercase text-editorial-ink">
                          <span>Forward / Backward (Axis Z)</span>
                          <span className="font-mono">{selectedItem.z.toFixed(2)}m</span>
                        </div>
                        <input
                          type="range"
                          min={-(roomDepth / 2 - 0.2)}
                          max={roomDepth / 2 - 0.2}
                          step="0.05"
                          value={selectedItem.z}
                          onChange={(e) => handleUpdateItemProp(selectedItem.id, "z", parseFloat(e.target.value))}
                          className="w-full h-1 bg-editorial-accent-soft appearance-none cursor-pointer outline-none accent-editorial-ink"
                        />
                      </div>

                      {/* Stacking Height (Y) axis */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-bold uppercase text-editorial-ink">
                          <span>Stacking Height (Axis Y)</span>
                          <span className="font-mono">{selectedItem.y.toFixed(2)}m</span>
                        </div>
                        <input
                          type="range"
                          min="0.0"
                          max="1.5"
                          step="0.02"
                          value={selectedItem.y}
                          onChange={(e) => handleUpdateItemProp(selectedItem.id, "y", parseFloat(e.target.value))}
                          className="w-full h-1 bg-editorial-accent-soft appearance-none cursor-pointer outline-none accent-editorial-ink"
                          title="Simulate placing/stacking cushions and throws on stools, tables or sofas"
                        />
                        <span className="text-[8px] text-editorial-accent block italic mt-0.5">Use Y-axis to stack throws/cushions on sofas or stools!</span>
                      </div>

                      {/* Rotation slider */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-bold uppercase text-editorial-ink">
                          <span>3D Rotation (Yaw)</span>
                          <span className="font-mono">{Math.round((selectedItem.rotation * 180) / Math.PI)}°</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={Math.PI * 2}
                          step="0.05"
                          value={selectedItem.rotation}
                          onChange={(e) => handleUpdateItemProp(selectedItem.id, "rotation", parseFloat(e.target.value))}
                          className="w-full h-1 bg-editorial-accent-soft appearance-none cursor-pointer outline-none accent-editorial-ink"
                        />
                      </div>

                      {/* Custom Scale sizing */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-bold uppercase text-editorial-ink">
                          <span>Custom Size Scale</span>
                          <span className="font-mono">{Math.round(selectedItem.scale * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="2.0"
                          step="0.05"
                          value={selectedItem.scale}
                          onChange={(e) => handleUpdateItemProp(selectedItem.id, "scale", parseFloat(e.target.value))}
                          className="w-full h-1 bg-editorial-accent-soft appearance-none cursor-pointer outline-none accent-editorial-ink"
                        />
                      </div>

                    </div>

                  </div>
                )}
              </div>
            )}

          </div>

          {/* Placed Items Checklist Summary Footer inside Control Panel */}
          {placedItems.length > 0 && (
            <div className="border-t border-editorial-border bg-editorial-accent-soft p-4 space-y-3 shrink-0">
              <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-editorial-ink">
                <span>Room Checklist Layout:</span>
                <span className="text-editorial-accent">{placedItems.length} active units</span>
              </div>
              
              <div className="max-h-24 overflow-y-auto space-y-1.5 divide-y divide-editorial-border/30 text-xs text-editorial-ink font-light">
                {placedItems.map((item, index) => (
                  <div 
                    key={item.id} 
                    onClick={() => {
                      setSelectedItemId(item.id);
                      setActiveTab("inspector");
                    }}
                    className={`flex items-center justify-between pt-1.5 cursor-pointer hover:bg-white/40 transition-all ${
                      selectedItemId === item.id ? "font-bold text-editorial-accent bg-white/60 p-1" : ""
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span className="font-mono text-[9px] font-bold">#{index + 1}</span>
                      <span className="truncate leading-tight">{item.product.name}</span>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="font-mono text-[10px] font-bold text-editorial-ink font-serif">${item.product.price}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(item.id);
                        }}
                        className="text-red-500 hover:text-red-700"
                        title="Remove piece"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-editorial-border font-serif font-bold text-xs">
                <span>Room Subtotal:</span>
                <span className="text-sm text-editorial-ink font-serif">${totalCost}</span>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
