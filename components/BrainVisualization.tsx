import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { animate as animeAnimate } from 'animejs';

interface Region {
  name: string;
  label: string;
  position: { x: number; y: number; z: number };
  color: number;
  id: string;
}

const regionConfig: Region[] = [
  {
    name: 'AgentDB',
    label: 'AGENT DB (MEMORY LAKE)',
    position: { x: 0, y: 0, z: 0 },
    color: 0x00ff88,
    id: 'agent-db'
  },
  {
    name: 'GLM47Flash',
    label: 'GLM-4.7-FLASH',
    position: { x: 3.5, y: 1.5, z: 1.2 },
    color: 0x00f2ff,
    id: 'glm-4-7-flash'
  },
  {
    name: 'GLM46VFlash',
    label: 'GLM-4.6V-FLASH',
    position: { x: -3.5, y: 1.5, z: 1.2 },
    color: 0x9854ff,
    id: 'glm-4-6v-flash'
  },
  {
    name: 'NotebookLM',
    label: 'NOTEBOOK LM',
    position: { x: 0, y: 2.0, z: 3.5 },
    color: 0x1bf7cd,
    id: 'notebook-lm'
  },
  {
    name: 'Llama3Local',
    label: 'LLAMA 3 (LOCAL)',
    position: { x: 0, y: -2.0, z: 3.5 },
    color: 0xf7d31b,
    id: 'llama-3-local'
  },
  {
    name: 'QwenLocal',
    label: 'QWEN 2.5 (LOCAL)',
    position: { x: 0, y: 0, z: -4.5 },
    color: 0xff2a6d,
    id: 'qwen-local'
  },
  {
    name: 'AgentOrchestration',
    label: 'CONSCIOUSNESS ENGINE',
    position: { x: -3.5, y: -1.5, z: 1.2 },
    color: 0xff2a6d,
    id: 'agents'
  },
  {
    name: 'DataCore',
    label: 'EPISODIC MEMORY',
    position: { x: 3.5, y: -1.5, z: 1.2 },
    color: 0x6C47FF,
    id: 'datacore'
  },
  {
    name: 'OperationsToDoNexus',
    label: 'INTENT CLASSIFIER',
    position: { x: 0, y: 3.5, z: 0 },
    color: 0x00f2ff,
    id: 'todo'
  },
  {
    name: 'DashboardMCP',
    label: 'DASHBOARD MCP',
    position: { x: 2.0, y: 3.0, z: -2.0 },
    color: 0x1bf7cd,
    id: 'workers-dashboard'
  },
  {
    name: 'BrowserMCP',
    label: 'BROWSER MCP',
    position: { x: -2.0, y: 3.0, z: -2.0 },
    color: 0x00f2ff,
    id: 'workers-browser'
  },
  {
    name: 'BridgeMCP',
    label: 'BRIDGE MCP',
    position: { x: 2.0, y: -3.0, z: -2.0 },
    color: 0x9854ff,
    id: 'workers-bridge'
  }
];

interface BrainVisualizationProps {
  onRegionClick: (regionId: string) => void;
  autoRotate?: boolean;
  selectedRegionId?: string | null;
  isLeftSidebarOpen?: boolean;
  isRightSidebarOpen?: boolean;
}

export default function BrainVisualization({ 
  onRegionClick, 
  autoRotate = true, 
  selectedRegionId,
  isLeftSidebarOpen = false,
  isRightSidebarOpen = false
}: BrainVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const requestRef = useRef<number | null>(null);
  const onRegionClickRef = useRef(onRegionClick);
  const selectedRegionIdRef = useRef(selectedRegionId);
  const labelRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const lineRefs = useRef<{ [key: string]: SVGLineElement | null }>({});
  const [labels, setLabels] = useState<{ id: string; label: string; x: number; y: number; visible: boolean }[]>([]);

  // Keep refs updated
  useEffect(() => {
    onRegionClickRef.current = onRegionClick;
  }, [onRegionClick]);

  useEffect(() => {
    selectedRegionIdRef.current = selectedRegionId;
  }, [selectedRegionId]);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const scene = new THREE.Scene();
    
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 12);

    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current, 
      antialias: true, 
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, container);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2.0;
    controls.enablePan = true;
    controls.enableZoom = true;
    controls.zoomSpeed = 1.2;
    controls.screenSpacePanning = true;
    controls.minDistance = 4;
    controls.maxDistance = 40;
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0x48cae4, 1.2);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const brainGroup = new THREE.Group();
    scene.add(brainGroup);

    // Create Brain Cortex
    const cortexGeometry = new THREE.SphereGeometry(3, 128, 128);
    const positions = cortexGeometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const vertex = new THREE.Vector3();
      vertex.fromBufferAttribute(positions, i);
      const noise = (Math.sin(vertex.x * 6) * Math.cos(vertex.y * 6) * Math.sin(vertex.z * 6) * 0.08) +
                    (Math.sin(vertex.x * 12) * Math.cos(vertex.y * 12) * Math.sin(vertex.z * 12) * 0.04);
      vertex.multiplyScalar(1 + noise);
      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    cortexGeometry.computeVertexNormals();

    const cortexMaterial = new THREE.MeshPhongMaterial({
      color: 0x4a9eff,
      emissive: 0x1a3d5f,
      emissiveIntensity: 0.15,
      transparent: true,
      opacity: 0.7,
      shininess: 30
    });
    const cortex = new THREE.Mesh(cortexGeometry, cortexMaterial);
    brainGroup.add(cortex);

    // Create Regions
    const brainRegions: THREE.Mesh[] = [];
    const geometries: THREE.BufferGeometry[] = [cortexGeometry];
    const materials: THREE.Material[] = [cortexMaterial];

    regionConfig.forEach(region => {
      const isAgentDB = region.id === 'agent-db';
      const regionGeometry = new THREE.SphereGeometry(isAgentDB ? 0.8 : 0.5, 32, 32);
      const regionMaterial = new THREE.MeshPhongMaterial({
        color: region.color,
        emissive: region.color,
        emissiveIntensity: isAgentDB ? 0.8 : 0.4,
        transparent: true,
        opacity: 0.9,
        shininess: 100
      });
      const regionMesh = new THREE.Mesh(regionGeometry, regionMaterial);
      regionMesh.position.set(region.position.x, region.position.y, region.position.z);
      regionMesh.userData = { id: region.id, label: region.label };
      
      const glowGeometry = new THREE.SphereGeometry(isAgentDB ? 1.0 : 0.6, 16, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({ color: region.color, transparent: true, opacity: isAgentDB ? 0.4 : 0.2 });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      regionMesh.add(glow);
      
      if (isAgentDB) {
        // Add a secondary outer glow for Agent DB
        const outerGlowGeo = new THREE.SphereGeometry(1.4, 16, 16);
        const outerGlowMat = new THREE.MeshBasicMaterial({ color: region.color, transparent: true, opacity: 0.1 });
        const outerGlow = new THREE.Mesh(outerGlowGeo, outerGlowMat);
        regionMesh.add(outerGlow);
      }
      
      brainGroup.add(regionMesh);
      brainRegions.push(regionMesh);
      geometries.push(regionGeometry, glowGeometry);
      materials.push(regionMaterial, glowMaterial);
    });

    // Neural Connections
    const connectionMaterial = new THREE.LineBasicMaterial({ color: 0x40e0d0, transparent: true, opacity: 0.3 });
    materials.push(connectionMaterial);
    regionConfig.forEach(region => {
      if (region.id === 'agent-db') return;
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(region.position.x * 0.5, region.position.y * 0.5, region.position.z + 1),
        new THREE.Vector3(region.position.x, region.position.y, region.position.z)
      );
      const points = curve.getPoints(20);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const clonedMat = connectionMaterial.clone();
      materials.push(clonedMat);
      const line = new THREE.Line(geometry, clonedMat);
      brainGroup.add(line);
      geometries.push(geometry);
    });

    // Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isHovering = false;
    let isHolding = false;
    let rippleTime = 0;
    let pointerDownPos = { x: 0, y: 0 };

    const originalPositions = cortexGeometry.attributes.position.array.slice();

    const onPointerDown = (e: PointerEvent) => { 
      isHolding = true; 
      rippleTime = 0;
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => { 
      isHolding = false;
      
      // Click detection: if pointer moved less than 5px, it's a click
      const dist = Math.sqrt(Math.pow(e.clientX - pointerDownPos.x, 2) + Math.pow(e.clientY - pointerDownPos.y, 2));
      if (dist < 5) {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        
        // Check regions first
        const intersects = raycaster.intersectObjects(brainRegions);
        if (intersects.length > 0) {
          const regionId = (intersects[0].object as THREE.Mesh).userData.id;
          onRegionClickRef.current(regionId);
          
          // Animate click
          animeAnimate((intersects[0].object as THREE.Mesh).scale, {
            x: [1, 1.3, 1],
            y: [1, 1.3, 1],
            z: [1, 1.3, 1],
            duration: 500,
            ease: 'outElastic(1, .6)',
          });
        }
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(cortex);
      isHovering = intersects.length > 0;
    };

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(container);

    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointerup', onPointerUp);
    container.addEventListener('pointermove', onPointerMove);

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };

    canvasRef.current.addEventListener('webglcontextlost', handleContextLost, false);

    const animate = () => {
      requestRef.current = requestAnimationFrame(animate);
      const time = Date.now() * 0.001;
      if (isHolding) rippleTime += 0.05;
      
      controls.update();

      // Pulse Agent DB node
      const agentDbNode = brainRegions.find(r => r.userData.id === 'agent-db');
      if (agentDbNode) {
        const isSelected = selectedRegionIdRef.current === 'agent-db';
        const pulse = (isSelected ? 1.2 : 1) + Math.sin(time * 3) * 0.1;
        agentDbNode.scale.set(pulse, pulse, pulse);
        if (agentDbNode.children[0]) {
          const glowPulse = (isSelected ? 1.5 : 1.2) * (1 + Math.sin(time * 3 + 1) * 0.2);
          agentDbNode.children[0].scale.set(glowPulse, glowPulse, glowPulse);
        }
      }

      // Highlight other selected nodes
      if (selectedRegionIdRef.current && selectedRegionIdRef.current !== 'agent-db') {
        const selectedNode = brainRegions.find(r => r.userData.id === selectedRegionIdRef.current);
        if (selectedNode) {
          const pulse = 1.3 + Math.sin(time * 5) * 0.15;
          selectedNode.scale.set(pulse, pulse, pulse);
          if (selectedNode.children[0]) {
            const glowPulse = 1.4 * (1 + Math.sin(time * 5 + 1) * 0.3);
            selectedNode.children[0].scale.set(glowPulse, glowPulse, glowPulse);
          }
        }
      }

      // Update Cortex Vertices for Ruffle/Ripple
      const positions = cortexGeometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        const x = originalPositions[i * 3];
        const y = originalPositions[i * 3 + 1];
        const z = originalPositions[i * 3 + 2];
        const vertex = new THREE.Vector3(x, y, z);
        
        // Base noise
        let noise = (Math.sin(vertex.x * 6 + time) * Math.cos(vertex.y * 6 + time) * Math.sin(vertex.z * 6 + time) * 0.08);
        
        // Ruffle effect (Hover)
        if (isHovering) {
          noise += (Math.sin(vertex.x * 15 + time * 5) * Math.cos(vertex.y * 15 + time * 5) * 0.05);
        }
        
        // Ripple effect (Hold)
        if (isHolding) {
          const dist = vertex.length();
          const ripple = Math.sin(dist * 10 - rippleTime * 5) * 0.1;
          noise += ripple;
        }

        vertex.multiplyScalar(1 + noise);
        positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
      }
      positions.needsUpdate = true;
      cortexGeometry.computeVertexNormals();

      // Update labels directly in DOM for performance
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        
        // Raycast for hover cursor feedback
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(brainRegions);
        if (intersects.length > 0) {
          canvasRef.current.style.cursor = 'pointer';
        } else {
          canvasRef.current.style.cursor = 'grab';
        }

        regionConfig.forEach(region => {
          const el = labelRefs.current[region.id];
          const line = lineRefs.current[region.id];
          if (!el || !line) return;

          const tempV = new THREE.Vector3(region.position.x, region.position.y, region.position.z);
          const distanceToCamera = tempV.distanceTo(camera.position);
          const cortexDistance = new THREE.Vector3(0,0,0).distanceTo(camera.position);
          
          tempV.project(camera);
          
          const isBehind = distanceToCamera > cortexDistance + 0.5;
          const visible = tempV.z <= 1 && tempV.z >= -1 && !isBehind;
          
          // Offset label slightly from sphere for mind-map look
          const x = (tempV.x * 0.5 + 0.5) * rect.width;
          const y = (tempV.y * -0.5 + 0.5) * rect.height;
          
          // Calculate label position (offset slightly)
          const angle = Math.atan2(y - rect.height / 2, x - rect.width / 2);
          const offset = 40; // Offset in pixels
          const labelX = x + Math.cos(angle) * offset;
          const labelY = y + Math.sin(angle) * offset;

          el.style.transform = `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`;
          
          // Hide completely if sidebars are open (full screen overlay)
          const sidebarFade = (isLeftSidebarOpen || isRightSidebarOpen) ? 0 : 1;
          el.style.opacity = visible ? (selectedRegionIdRef.current === region.id ? '1' : sidebarFade.toString()) : '0';
          el.style.pointerEvents = visible ? 'auto' : 'none';
          el.style.transition = 'opacity 0.5s ease-in-out, transform 0.3s ease-out';

          // Update SVG line
          if (visible) {
            line.setAttribute('x1', x.toString());
            line.setAttribute('y1', y.toString());
            line.setAttribute('x2', labelX.toString());
            line.setAttribute('y2', labelY.toString());
            line.style.opacity = '0.4';
          } else {
            line.style.opacity = '0';
          }
        });
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('webglcontextlost', handleContextLost);
      }
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('pointermove', onPointerMove);
      resizeObserver.disconnect();
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      controls.dispose();
      renderer.dispose();
      geometries.forEach(g => g.dispose());
      materials.forEach(m => m.dispose());
    };
  }, []);

  // Update autoRotate without re-initializing the scene
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[300px] md:min-h-[400px]">
      <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      
      <style>{`
        @keyframes linePulse {
          0% { stroke-dashoffset: 0; opacity: 0.4; }
          50% { stroke-dashoffset: 10; opacity: 0.8; }
          100% { stroke-dashoffset: 20; opacity: 0.4; }
        }
        .line-pulse {
          animation: linePulse 2s linear infinite;
        }
        .label-glow {
          text-shadow: 0 0 5px rgba(224, 247, 250, 0.5);
        }
      `}</style>
      
      {/* SVG Layer for mind-map lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-[90]">
        {regionConfig.map((region, idx) => (
          <line
            key={`line-${region.id}-${idx}`}
            ref={el => lineRefs.current[region.id] = el}
            stroke={selectedRegionId === region.id ? '#00f2ff' : region.color}
            strokeWidth={selectedRegionId === region.id ? '2' : '1'}
            strokeDasharray={selectedRegionId === region.id ? 'none' : '4,4'}
            className={selectedRegionId === region.id ? '' : 'line-pulse'}
            style={{ opacity: 0, transition: 'opacity 0.3s' }}
          />
        ))}
      </svg>

      <div className="absolute inset-0 pointer-events-none overflow-hidden z-[100]">
        {regionConfig.map((region, idx) => (
          <div
            key={`${region.id}-${idx}`}
            ref={el => labelRefs.current[region.id] = el}
            className={`animated-border absolute bg-[#0a1525e6] text-[#e0f7fa] px-1.5 py-0.5 md:px-2 md:py-1 rounded text-[7px] md:text-[8px] font-bold border ${selectedRegionId === region.id ? 'border-[#00f2ff] shadow-[0_0_20px_#00f2ff] scale-125 z-[120]' : 'border-[#00b4d84d] shadow-[0_0_10px_#00b4d844]'} transition-all duration-300 pointer-events-auto cursor-pointer hover:bg-[#00b4d844] hover:scale-110 max-w-[60px] md:max-w-[80px] min-w-[35px] md:min-w-[40px] flex items-center justify-center text-center leading-tight whitespace-normal break-words z-[110] opacity-0 label-glow`}
            style={{ left: 0, top: 0 }}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRegionClick(region.id);
            }}
          >
            {region.label}
          </div>
        ))}
      </div>
    </div>
  );
}
