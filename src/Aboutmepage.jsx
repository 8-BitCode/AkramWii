/* AboutMePage.jsx — Updated with Brain-Shaped Surface Mapping & Smaller Desktop Scale */
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import "./Aboutmepage.css";

// Face assets
import mii1Face from "./Assets/Mii1face.png";
import akramFace1 from "./Assets/Akramface1.png";
import akramFace2 from "./Assets/Akramface2.png";

// Game assets
import hypnospaceArt from "./Assets/Hypnospace.png";
import indikaArt from "./Assets/Indika.png";
import beginnersArt from "./Assets/Begginersguide.png";
import earthboundArt from "./Assets/Earthbound.png";

// Album Cover assets
import simbiArt from "./Assets/SIMBI.png";
import laurynArt from "./Assets/Lauryn.png";
import anjoArt from "./Assets/Anjo.png";
import hawaiiArt from "./Assets/Hawaii.png";
import tpabArt from "./Assets/TPAB.png";
import igorArt from "./Assets/Igor.png";
import paleArt from "./Assets/Pale.png";
import privateArt from "./Assets/Private.png";
import bbmArt from "./Assets/BBM.png";

const FACE_SEQUENCE = [mii1Face, akramFace1, mii1Face, akramFace2];

const ALBUMS = [
  { id: 0, title: "SIMBI", art: simbiArt, subtitle: "Little Simz" },
  { id: 1, title: "The Miseducation", art: laurynArt, subtitle: "Lauryn Hill" },
  { id: 2, title: "Anjo de Mim", art: anjoArt, subtitle: "Ivan Lins" },
  { id: 3, title: "Hawaii Part II", art: hawaiiArt, subtitle: "Miracle Musical" },
  { id: 4, title: "To Pimp a Butterfly", art: tpabArt, subtitle: "Kendrick Lamar" },
  { id: 5, title: "IGOR", art: igorArt, subtitle: "Tyler, The Creator" },
  { id: 6, title: "Pale Machine 2", art: paleArt, subtitle: "Bo En" },
  { id: 7, title: "Private Collection", art: privateArt, subtitle: "Saba & No I.D." },
  { id: 8, title: "Black British Music", art: bbmArt, subtitle: "Jim Legxacy" }
];

const LAB_FACTS = [
  {
    id: 0,
    title: "Yellow, Always Yellow",
    text: "Ask me to pick a color for anything and it's yellow. No deep reason, it just makes whatever I'm looking at feel more alive."
  },
  {
    id: 1,
    title: "Cooking Without a Recipe",
    text: "I love to cook. It gives me the freedom to not be super precise while still giving me more opportunities to improve and master. #ThisIsAMetaphore"
  },
  {
    id: 2,
    title: "Mathematical!!",
    text: "Every so often a conjecture gets stuck in my head and I end up writing a small program just to watch it play out."
  },
  {
    id: 3,
    title: "| Cinema |",
    text: "I genuinely have never left a cinema disliking a film; there is always something to appreciate. Every piece of cinema stands as a monument to collective human effort and artistic creation."
  }
];

const GLOBE_NODES = [
  { lat: 18, lon: 10 },
  { lat: -22, lon: 115 },
  { lat: 28, lon: 205 },
  { lat: -12, lon: 295 }
];

// --- 3D BRAIN-GLOBE COMPONENTS ---

const latLonToVector3 = (lat, lon, radius) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
};

const createBrainTextures = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = 1024; bumpCanvas.height = 512;
  const bCtx = bumpCanvas.getContext('2d');

  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, '#f0c9c2');
  gradient.addColorStop(0.5, '#e0a89e');
  gradient.addColorStop(1, '#b9776c');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1024, 512);

  for (let i = 0; i < 90; i++) {
    const bx = Math.random() * 1024;
    const by = Math.random() * 512;
    const br = 30 + Math.random() * 70;
    const blotch = ctx.createRadialGradient(bx, by, 0, bx, by, br);
    const lighter = Math.random() > 0.5;
    blotch.addColorStop(0, lighter ? 'rgba(255, 235, 225, 0.22)' : 'rgba(120, 60, 55, 0.14)');
    blotch.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = blotch;
    ctx.fillRect(bx - br, by - br, br * 2, br * 2);
  }

  bCtx.fillStyle = '#111111';
  bCtx.fillRect(0, 0, 1024, 512);

  const drawBrainFolds = (context, isBump = false) => {
    context.strokeStyle = isBump ? '#ffffff' : 'rgba(110, 45, 40, 0.4)';
    context.lineWidth = isBump ? 12 : 8;
    context.lineCap = 'round';
    context.lineJoin = 'round';

    for (let y = 64; y < 512; y += 64) {
      context.beginPath();
      context.moveTo(50, y);
      for (let x = 150; x <= 850; x += 128) {
        const randomCurveY = y + Math.sin(x * 0.02 + y) * 35;
        context.quadraticCurveTo(x - 64, randomCurveY + (Math.random() * 20 - 10), x, randomCurveY);
      }
      context.stroke();
    }

    context.lineWidth = isBump ? 8 : 5;
    for (let x = 64; x < 1024; x += 96) {
      context.beginPath();
      context.moveTo(x, 50);
      for (let y = 50; y <= 450; y += 96) {
        const randomCurveX = x + Math.cos(y * 0.03 + x) * 25;
        context.quadraticCurveTo(randomCurveX + (Math.random() * 15 - 7), y - 48, randomCurveX, y);
      }
      context.stroke();
    }
  };

  drawBrainFolds(ctx, false);
  bCtx.filter = 'blur(4px)';
  drawBrainFolds(bCtx, true);
  bCtx.filter = 'none';

  ctx.fillStyle = 'rgba(60, 20, 18, 0.45)';
  ctx.fillRect(504, 0, 16, 512);
  bCtx.fillStyle = '#000000';
  bCtx.fillRect(500, 0, 24, 512);

  const colorMap = new THREE.CanvasTexture(canvas);
  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  
  colorMap.wrapS = THREE.RepeatWrapping;
  colorMap.wrapT = THREE.ClampToEdgeWrapping;
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.ClampToEdgeWrapping;

  colorMap.needsUpdate = true;
  bumpMap.needsUpdate = true;
  
  return { colorMap, bumpMap };
};

const createBrainGeometry = (radius) => {
  const geometry = new THREE.SphereGeometry(radius, 128, 128);
  const posAttr = geometry.attributes.position;
  const v = new THREE.Vector3();
  const dir = new THREE.Vector3();

  const frontalDir = new THREE.Vector3(0, 0.25, 1).normalize();
  const temporalDirL = new THREE.Vector3(-0.8, -0.45, 0.35).normalize();
  const temporalDirR = new THREE.Vector3(0.8, -0.45, 0.35).normalize();
  const occipitalDir = new THREE.Vector3(0, -0.05, -1).normalize();

  for (let i = 0; i < posAttr.count; i++) {
    v.fromBufferAttribute(posAttr, i);
    dir.copy(v).normalize();

    const theta = Math.atan2(dir.z, dir.x); 
    const phi = Math.acos(THREE.MathUtils.clamp(dir.y, -1, 1)); 

    let wrinkle = 0;
    wrinkle += Math.sin(theta * 8 + Math.sin(phi * 6.5) * 2.4);
    wrinkle += Math.sin(phi * 11 + Math.cos(theta * 5.3) * 3.1) * 0.75;
    wrinkle += Math.sin(theta * 15 - phi * 9.4) * 0.5;
    wrinkle += Math.sin(theta * 3.1 + phi * 2.7) * 0.6; 
    wrinkle *= 0.028 * radius;

    const fissure = Math.exp(-Math.pow(dir.x * 5.5, 2)) * 0.1 * radius;
    const frontalBulge = Math.pow(Math.max(0, dir.dot(frontalDir)), 2.2) * 0.34 * radius;
    const temporalBulge =
      (Math.pow(Math.max(0, dir.dot(temporalDirL)), 6) +
        Math.pow(Math.max(0, dir.dot(temporalDirR)), 6)) * 0.16 * radius;
    const occipitalTaper = Math.pow(Math.max(0, dir.dot(occipitalDir)), 2.5) * 0.16 * radius;
    const lobeShape = 1 - Math.pow(Math.max(0, -dir.y), 2) * 0.12;

    const finalRadius =
      (radius + wrinkle - fissure + frontalBulge + temporalBulge - occipitalTaper) * lobeShape;
    v.copy(dir).multiplyScalar(finalRadius);
    posAttr.setXYZ(i, v.x, v.y, v.z);
  }

  geometry.computeVertexNormals();
  return geometry;
};

const renderMarkerIcon = (idx) => {
  switch (idx) {
    case 0:
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
        </svg>
      );
    case 1:
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a3 3 0 0 0 3-3v-4a3 3 0 0 0-3-3Z" />
          <path d="M10 12v6m4-6v6" />
        </svg>
      );
    case 2:
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 16V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2Z" />
          <path d="M8 10h8m-8 4h5" />
        </svg>
      );
    case 3:
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="16" x="2" y="4" rx="2" />
          <path d="M10 9l5 3-5 3V9Z" />
        </svg>
      );
    default:
      return null;
  }
};

const GlobeMesh = ({ nodes, activeFactIndex, setActiveFactIndex, isMobile }) => {
  const globeRef = useRef();
  const sphereRef = useRef();

  const globeRadius = isMobile ? 0.95 : 1.05;

  const { colorMap, bumpMap } = useMemo(() => createBrainTextures(), []);
  const brainGeometry = useMemo(() => createBrainGeometry(globeRadius), [globeRadius]);

  useFrame(() => {
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.0015;
    }
  });

  return (
    <group ref={globeRef}>
      <mesh ref={sphereRef} geometry={brainGeometry}>
        <meshPhysicalMaterial 
          map={colorMap} 
          bumpMap={bumpMap}     
          bumpScale={0.05}      
          roughness={0.25} 
          metalness={0.0} 
          clearcoat={0.6}       
          clearcoatRoughness={0.25}
        />
      </mesh>

      {nodes.map((fact, idx) => {
        const position = latLonToVector3(fact.lat, fact.lon, globeRadius);
        const isActive = activeFactIndex === idx;
        
        return (
          <Html key={idx} position={position} center>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isActive && <div className="marker-pulse-ring" />}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveFactIndex(idx);
                }}
                title={fact.title}
                style={{ 
                  width: isActive ? '52px' : '40px',
                  height: isActive ? '52px' : '40px',
                  borderRadius: '50%',
                  background: isActive 
                    ? 'linear-gradient(135deg, #ffdd33, #ff9900)' 
                    : 'linear-gradient(135deg, rgba(30,30,30,0.85), rgba(50,50,50,0.9))',
                  color: isActive ? '#ffffff' : '#dddddd',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isActive 
                    ? '0 8px 18px rgba(255, 153, 0, 0.5), inset 0 2px 5px rgba(255, 255, 255, 0.6)' 
                    : '0 4px 10px rgba(0, 0, 0, 0.4), inset 0 1px 3px rgba(255, 255, 255, 0.2)',
                  border: isActive ? '2.5px solid #ffffff' : '1.5px solid rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  pointerEvents: 'auto',
                  userSelect: 'none',
                  zIndex: isActive ? 10 : 1
                }}
              >
                {renderMarkerIcon(idx)}
              </div>
            </div>
          </Html>
        );
      })}
    </group>
  );
};

const SolidGlobe = ({ nodes, activeFactIndex, setActiveFactIndex, isMobile }) => {
  const canvasSize = isMobile ? 240 : 340;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`
        @keyframes marker-pulse {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .marker-pulse-ring {
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          border: 3px solid #ffcc00;
          animation: marker-pulse 1.5s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
          pointer-events: none;
        }
      `}</style>

      <div className="globe-atmosphere" style={{ position: 'absolute' }} />
      <Canvas camera={{ position: [0, 0, 4.2], fov: 45 }} style={{ width: `${canvasSize}px`, height: `${canvasSize}px`, zIndex: 2 }}>
        <ambientLight intensity={1.8} />
        <directionalLight position={[5, 5, 3]} intensity={2.5} />
        <directionalLight position={[-5, -2, -3]} intensity={1} color="#ffd9c7" />
        <GlobeMesh 
          nodes={nodes} 
          activeFactIndex={activeFactIndex} 
          setActiveFactIndex={setActiveFactIndex} 
          isMobile={isMobile}
        />
        <OrbitControls enableZoom={false} enablePan={false} rotateSpeed={0.6} />
      </Canvas>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---

export default function AboutMePage({ onGoBack, onEscape }) {
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia('(max-width: 800px)').matches
  );
  const [faceStep, setFaceStep] = useState(0);
  const [activePanel, setActivePanel] = useState(1); 
  const [selectedAlbumIndex, setSelectedAlbumIndex] = useState(0);
  const [activeFactIndex, setActiveFactIndex] = useState(0);

  const deckRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 800px)');
    const handleChange = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  const handleFaceClick = () => setFaceStep((s) => s + 1);
  const currentFace = FACE_SEQUENCE[faceStep % FACE_SEQUENCE.length];
  const activeAlbum = ALBUMS[selectedAlbumIndex];

  const handleAlbumSelect = (idx) => {
    setSelectedAlbumIndex(idx);
    if (deckRef.current) {
      const deck = deckRef.current;
      const card = deck.children[0]?.children[idx];
      if (card) {
        const scrollTarget = card.offsetLeft - (deck.offsetWidth / 2) + (card.offsetWidth / 2);
        deck.scrollTo({
          left: scrollTarget,
          behavior: 'smooth'
        });
      }
    }
  };

  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    startXRef.current = e.pageX - deckRef.current.offsetLeft;
    scrollLeftRef.current = deckRef.current.scrollLeft;
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    const x = e.pageX - deckRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    deckRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  const handleTouchStart = (e) => {
    isDraggingRef.current = true;
    startXRef.current = e.touches[0].pageX - deckRef.current.offsetLeft;
    scrollLeftRef.current = deckRef.current.scrollLeft;
  };

  const handleTouchMove = (e) => {
    if (!isDraggingRef.current) return;
    const x = e.touches[0].pageX - deckRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    deckRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  return (
    <div className="about-me-page">
      <div className="about-me-page-bg" aria-hidden="true">
        <div className="about-me-page-grid" />
        <div className="about-me-page-scanlines" />
        <div className="about-me-page-vignette" />
      </div>

      <div className="about-me-page-header">
        <div className="about-me-page-header-content">
          <h1 className="about-me-page-title">About Me</h1>
          <p className="about-me-page-subtitle">Akram Munir Awel</p>
        </div>
        <button
          className="about-me-page-esc"
          onClick={onEscape}
          aria-label={isMobile ? "Open Menu" : "Press ESC to open HOME Menu"}
        >
          {isMobile ? (
            <>
              <span className="about-me-page-esc-mobile-label">Menu</span>
              <svg
                className="about-me-page-esc-mobile-arrow"
                viewBox="0 0 24 24"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 6 15 12 9 18" />
              </svg>
            </>
          ) : (
            <>
              <span className="about-me-page-esc-key">⎋ ESC</span>
              <span className="about-me-page-esc-label">HOME Menu</span>
            </>
          )}
        </button>
      </div>

      <div className="about-me-page-body">
        <div className="accordion-canvas">
          
          {/* Panel 1: Identity */}
          <div 
            className={`accordion-panel panel-vibe ${activePanel === 1 ? 'is-active' : ''}`}
            onMouseEnter={() => !isMobile && setActivePanel(1)}
            onClick={() => isMobile && setActivePanel(1)}
          >
            <div className="panel-title-strip">
              <h2>01. IDENTITY</h2>
            </div>
            <div className="panel-content">
              <div className="panel-hero-layout">
                <div className="panel-face-container">
                  <div className="panel-face-ring" />
                  <button className="widget-face-btn" onClick={handleFaceClick} style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', width: '100%', height: '100%' }}>
                    <img src={currentFace} alt="Akram" className="panel-face-img" draggable="false" />
                    <span className="face-click-hint" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 2.5 9 14.5" />
                        <path d="M9 8.5 13.5 13a2.5 2.5 0 0 1 .7 1.7v3.8a2.5 2.5 0 0 1-2.5 2.5H9a5 5 0 0 1-4-2l-2.3-3.4A1.4 1.4 0 0 1 4.8 13.5L6 14.8" />
                      </svg>
                    </span>
                  </button>
                </div>
                <div className="panel-hero-info">
                  <h3>Akram Munir Awel</h3>
                  <p>Student @ UoM • Developer & Designer</p>
                  <div className="panel-socials">
                    <a href="https://linkedin.com/in/akrammunirawel/" target="_blank" rel="noreferrer">LinkedIn</a>
                    <a href="mailto:akrammunirawel@gmail.com">Email</a>
                  </div>
                </div>
              </div>

              <h3 className="content-headline" style={{ marginTop: "25px" }}>Hey, welcome in</h3>
              <p className="content-body">
                I'm a student at the University of Manchester. My creative energy comes in bursts — long quiet stretches followed by bouts of drive where I'll disappear into something for days at a time. A good chunk of that time goes into studying design: pulling apart different styles, eras, and movements to understand what actually makes them work.
              </p>
              <p className="content-body" style={{ marginTop: "15px" }}>
                Most of that shows up in code: web projects, interfaces I keep rebuilding until they feel right. I like the process more than any finished result.
              </p>
              <div className="currently-box">
                <span className="pulsing-indicator" />
                <div>
                  <strong>Currently:</strong> attempting, in vain, to invent a new type of dessert the likes of which the world has never seen.
                </div>
              </div>
            </div>
          </div>

          {/* Panel 2: Narratives */}
          <div 
            className={`accordion-panel panel-games ${activePanel === 2 ? 'is-active' : ''}`}
            onMouseEnter={() => !isMobile && setActivePanel(2)}
            onClick={() => isMobile && setActivePanel(2)}
          >
            <div className="panel-title-strip">
              <h2>02. NARRATIVES</h2>
            </div>
            <div className="panel-content">
              <h3 className="content-headline">Games I keep coming back to</h3>
              <p className="content-body">
                I love narrative-driven games, and a handful of them have genuinely shaped how I think.
              </p>
              
              <div className="games-cascade">
                <div className="game-card">
                  <div className="game-placeholder">
                    <img src={hypnospaceArt} alt="Hypnospace Outlaw" />
                  </div>
                  <strong>Hypnospace Outlaw</strong>
                  <span>It doesn't feel like it's catering to you as the player — you're dropped into a world full of unique characters and history, and you're just watching the natural consequences of them unfold. I'm also completely in love with the fantastic anarchy of the Geocities aesthetic it adopts; it inspires a lot of my own projects.</span>
                </div>
                <div className="game-card">
                  <div className="game-placeholder">
                    <img src={indikaArt} alt="Indika" />
                  </div>
                  <strong>Indika</strong>
                  <span>Deeply philosophical and thought-provoking, constantly turning videogame tropes against themselves to make you question what you're actually doing while you play.</span>
                </div>
                <div className="game-card">
                  <div className="game-placeholder">
                    <img src={beginnersArt} alt="The Beginner's Guide" />
                  </div>
                  <strong>The Beginner's Guide</strong>
                  <span>A profound look at creative intent, projection, and creator intimacy. This is a piece of media that has really confronted my desire for external validation, and deeply challenged the ethics of narrativising a person's art.</span>
                </div>
                <div className="game-card">
                  <div className="game-placeholder">
                    <img src={earthboundArt} alt="EarthBound" />
                  </div>
                  <strong>EarthBound</strong>
                  <span>In my opinion, it's one of the most pivotal, groundbreaking, and revolutionary games ever made. It inspired so much of what came after it, and heavily defined my childhood and my style in all regards</span>
                </div>
              </div>
            </div>
          </div>

          {/* Panel 3: Audio */}
          <div 
            className={`accordion-panel panel-music ${activePanel === 3 ? 'is-active' : ''}`}
            onMouseEnter={() => !isMobile && setActivePanel(3)}
            onClick={() => isMobile && setActivePanel(3)}
          >
            <div className="panel-title-strip">
              <h2>03. AUDIO</h2>
            </div>
            <div className="panel-content">
              <h3 className="content-headline">On heavy rotation</h3>
              <p className="content-body">
                Music is a huge source of inspiration for me, and I like taking the time to really sit with each album over the course of weeks and really understand it. <strong>Drag through the deck</strong> below is a small, hyper-focused subsection of albums i love.
              </p>
              
              <div className="album-stack-layout">
                <div className="album-showcase-box">
                  <div className="album-showcase-art">
                    <img src={activeAlbum.art} alt={activeAlbum.title} />
                  </div>
                  <div className="album-showcase-details">
                    <h4>{activeAlbum.title}</h4>
                    <p>{activeAlbum.subtitle}</p>
                  </div>
                </div>

                <div 
                  className="album-3d-scene"
                  ref={deckRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUpOrLeave}
                  onMouseLeave={handleMouseUpOrLeave}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <div className="album-3d-deck">
                    {ALBUMS.map((album, idx) => {
                      const isSelected = selectedAlbumIndex === idx;
                      return (
                        <div
                          key={album.id}
                          className={`album-3d-card ${isSelected ? 'is-selected' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAlbumSelect(idx);
                          }}
                        >
                          <img src={album.art} alt={album.title} draggable="false" />
                          <div className="album-3d-label">{album.title}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Panel 4: The Lab */}
          <div 
            className={`accordion-panel panel-lab ${activePanel === 4 ? 'is-active' : ''}`}
            onMouseEnter={() => !isMobile && setActivePanel(4)}
            onClick={() => isMobile && setActivePanel(4)}
          >
            <div className="panel-title-strip">
              <h2>04. The Brain</h2>
            </div>
            <div className="panel-content">
              <h3 className="content-headline">The Lab</h3>
              <p className="content-body">A few things about me that didn't fit anywhere else. Drag the mind to spin it, or tap a marker directly.</p>
              
              <div className="globe-lab-container">
                <div className="globe-viewport" style={{ width: isMobile ? '240px' : '340px', height: isMobile ? '240px' : '340px' }}>
                  <SolidGlobe 
                    nodes={GLOBE_NODES}
                    activeFactIndex={activeFactIndex}
                    setActiveFactIndex={setActiveFactIndex}
                    isMobile={isMobile}
                  />
                </div>

                <div className="globe-fact-display">
                  <span className="globe-fact-index">{String(activeFactIndex + 1).padStart(2, '0')} / {String(LAB_FACTS.length).padStart(2, '0')}</span>
                  <h4>{LAB_FACTS[activeFactIndex].title}</h4>
                  <p>{LAB_FACTS[activeFactIndex].text}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}