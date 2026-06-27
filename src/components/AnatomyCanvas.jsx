import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import * as THREE from 'three';

// Colors
const COLORS = {
  bone: 0xf1f5f9, // Matte Slate 100 for bones
  boneHighlight: 0xe2e8f0,
  muscle: 0xbe123c, // Deep Crimson Red
  nerve: 0xfacc15, // Glowing Yellow
  nerveEmissive: 0xeab308,
  ligament: 0xe2e8f0, // White tendons
  disc: 0x38bdf8, // Neon blue
  organLung: 0xfca5a5, // Light pink
  organHeart: 0x9f1239, // Deep red
  organLiver: 0x881337, // Dark red-brown
  organStomach: 0xe11d48, // Rose pink
  organIntestines: 0xfda4af, // Light coral pink
  artery: 0xd60000, // Bright Red
  vein: 0x0041d6, // Deep Blue
  eyeWhite: 0xffffff,
  eyePupil: 0x0f172a,
};

// Views mapping for each focused region
const REGION_VIEWS = {
  'Shoulder Joint': {
    cam: new THREE.Vector3(0.5, 0.9, 1.8), // Zoomed in on right shoulder
    look: new THREE.Vector3(0.4, 0.9, 0)
  },
  'Lumbar Spine': {
    cam: new THREE.Vector3(0.0, -0.15, 1.8), // Zoomed in on lumbar spine (lower back)
    look: new THREE.Vector3(0.0, -0.15, 0)
  },
  'Knee Joint': {
    cam: new THREE.Vector3(0.25, -1.1, 1.6), // Zoomed in on right knee
    look: new THREE.Vector3(0.2, -1.1, 0)
  },
  'Cervical Spine': {
    cam: new THREE.Vector3(0.0, 1.2, 1.5), // Zoomed in on neck
    look: new THREE.Vector3(0.0, 1.2, 0)
  },
  'Full Body': {
    cam: new THREE.Vector3(0, 0.0, 4.65), // Show whole figure
    look: new THREE.Vector3(0, 0.0, 0)
  }
};

const AnatomyCanvas = forwardRef(({ activeRegion, activeSystem }, ref) => {
  const mountRef = useRef(null);
  const [isRotating, setIsRotating] = useState(true);

  const activeRegionRef = useRef(activeRegion);
  useEffect(() => {
    activeRegionRef.current = activeRegion;
  }, [activeRegion]);

  // Keep references to Three.js elements for external control (zoom, rotate, reset)
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const mainGroupRef = useRef(null);
  const partsRef = useRef([]); // Holds array of { mesh, material, type }
  const reqAnimFrameRef = useRef(null);

  // Dynamic zoom scale controlled by zoom buttons
  const zoomScaleRef = useRef(1.0);
  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));

  // Expose controls to the parent component
  useImperativeHandle(ref, () => ({
    zoomIn() {
      zoomScaleRef.current = Math.max(0.4, zoomScaleRef.current - 0.15);
    },
    zoomOut() {
      zoomScaleRef.current = Math.min(2.2, zoomScaleRef.current + 0.15);
    },
    toggleRotation() {
      setIsRotating((prev) => !prev);
    },
    resetView() {
      zoomScaleRef.current = 1.0;
      currentLookAt.current.set(0, 0, 0);
      if (mainGroupRef.current) {
        mainGroupRef.current.rotation.set(0, 0, 0);
      }
      setIsRotating(true);
    }
  }));

  // Update opacities dynamically when activeSystem or activeRegion changes
  useEffect(() => {
    if (!partsRef.current.length) return;

    partsRef.current.forEach(({ material, type, region }) => {
      if (!material) return;

      let baseOpacity = 1.0;
      let isTransparent = false;

      if (activeSystem === 'Skeletal') {
        if (type === 'skeletal' || type === 'disc' || type === 'ligament') {
          baseOpacity = 1.0;
          isTransparent = false;
        } else if (type === 'muscular') {
          baseOpacity = 0.03;
          isTransparent = true;
        } else if (type === 'nervous') {
          baseOpacity = 0.05;
          isTransparent = true;
        }
      } else if (activeSystem === 'Muscular') {
        if (type === 'muscular') {
          baseOpacity = 1.0;
          isTransparent = false;
        } else if (type === 'skeletal') {
          baseOpacity = 0.15;
          isTransparent = true;
        } else if (type === 'disc') {
          baseOpacity = 0.08;
          isTransparent = true;
        } else if (type === 'nervous') {
          baseOpacity = 0.05;
          isTransparent = true;
        } else if (type === 'ligament') {
          baseOpacity = 1.0;
          isTransparent = false;
        }
      } else if (activeSystem === 'Nervous') {
        if (type === 'nervous') {
          baseOpacity = 1.0;
          isTransparent = false;
          if (material.emissive) {
            material.emissiveIntensity = 1.6;
          }
        } else if (type === 'skeletal') {
          baseOpacity = 0.15;
          isTransparent = true;
        } else if (type === 'disc') {
          baseOpacity = 0.08;
          isTransparent = true;
        } else if (type === 'muscular') {
          baseOpacity = 0.03;
          isTransparent = true;
        } else if (type === 'ligament') {
          baseOpacity = 0.05;
          isTransparent = true;
        }
      }

      const isCurrentRegion = region === activeRegion || activeRegion === 'Full Body';
      material.transparent = isTransparent || !isCurrentRegion;

      if (isCurrentRegion) {
        material.opacity = baseOpacity;
        if (material.emissive && type === 'nervous') {
          material.emissiveIntensity = 1.2;
        }
      } else {
        material.opacity = baseOpacity * 0.15;
        if (material.emissive) {
          material.emissiveIntensity = 0.1;
        }
      }
      material.needsUpdate = true;
    });
  }, [activeSystem, activeRegion]);

  // Setup full-body 3D models when component mounts
  useEffect(() => {
    if (!mountRef.current) return;

    // 1. Initialize Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617); // Dark Slate 950
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 4.65);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 2. Add Lights (Teal & Purple highlight setup)
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.2);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight1.position.set(5, 5, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x0ea5e9, 1.2); // Cyan/Teal fill light
    dirLight2.position.set(-5, 2, 2);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xa855f7, 2.5, 10); // Purple rim point light
    pointLight.position.set(0, -1, -4);
    scene.add(pointLight);

    // 3. Create Main Model Group (User drags this)
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);
    mainGroupRef.current = mainGroup;

    partsRef.current = [];

    // Helper to register parts for opacity control
    const registerPart = (mesh, material, type, region = 'Full Body') => {
      partsRef.current.push({ mesh, material, type, region });
      mainGroup.add(mesh);
    };

    // Bone generator
    const createBone = (radius, length, x, y, z, rx=0, ry=0, rz=0, region = 'Full Body') => {
      const group = new THREE.Group();
      const geom = new THREE.CylinderGeometry(radius, radius, length, 12);
      const mat = new THREE.MeshStandardMaterial({
        color: COLORS.bone,
        roughness: 0.7,
        metalness: 0.1,
      });
      const mesh = new THREE.Mesh(geom, mat);
      group.add(mesh);

      // Rounded ends
      const sphereGeom = new THREE.SphereGeometry(radius * 1.15, 12, 12);
      const sphereTop = new THREE.Mesh(sphereGeom, mat);
      sphereTop.position.y = length / 2;
      group.add(sphereTop);

      const sphereBottom = new THREE.Mesh(sphereGeom, mat);
      sphereBottom.position.y = -length / 2;
      group.add(sphereBottom);

      group.position.set(x, y, z);
      group.rotation.set(rx, ry, rz);

      registerPart(group, mat, 'skeletal', region);
      return group;
    };

    // Standard muscle builder
    const createMuscle = (radius, length, x, y, z, rx=0, ry=0, rz=0, scaleX=1, scaleZ=1, region = 'Full Body') => {
      const geom = new THREE.CylinderGeometry(radius, radius * 0.8, length, 10);
      const mat = new THREE.MeshStandardMaterial({
        color: COLORS.muscle,
        roughness: 0.6,
        metalness: 0.0,
      });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.scale.set(scaleX, 1, scaleZ);
      mesh.position.set(x, y, z);
      mesh.rotation.set(rx, ry, rz);

      registerPart(mesh, mat, 'muscular', region);
      return mesh;
    };

    // Striated fibrous muscle bundle builder
    const createFibrousMuscle = (radius, length, x, y, z, rx=0, ry=0, rz=0, scaleX=1, region = 'Full Body') => {
      const group = new THREE.Group();
      const fibersCount = 3;
      const fiberMat = new THREE.MeshStandardMaterial({
        color: COLORS.muscle,
        roughness: 0.65,
        metalness: 0.0,
      });
      
      for (let i = 0; i < fibersCount; i++) {
        const offsetX = (i - 1) * (radius * 0.55);
        const offsetZ = i === 1 ? radius * 0.2 : 0;
        const geom = new THREE.CylinderGeometry(radius * 0.45, radius * 0.35, length, 8);
        const fiber = new THREE.Mesh(geom, fiberMat);
        fiber.position.set(offsetX, 0, offsetZ);
        group.add(fiber);
      }

      group.position.set(x, y, z);
      group.rotation.set(rx, ry, rz);
      group.scale.set(scaleX, 1, 1);

      registerPart(group, fiberMat, 'muscular', region);
      return group;
    };

    // Nerve constructor
    const createNerve = (points, radius, region = 'Full Body') => {
      const curve = new THREE.CatmullRomCurve3(points);
      const geom = new THREE.TubeGeometry(curve, 20, radius, 6, false);
      const mat = new THREE.MeshStandardMaterial({
        color: COLORS.nerve,
        emissive: COLORS.nerveEmissive,
        emissiveIntensity: 0.8,
        roughness: 0.2,
      });
      const mesh = new THREE.Mesh(geom, mat);
      registerPart(mesh, mat, 'nervous', region);
      return mesh;
    };

    // Blood Vessel Constructors (Vein & Artery)
    const createArtery = (points, radius, region = 'Full Body') => {
      const curve = new THREE.CatmullRomCurve3(points);
      const geom = new THREE.TubeGeometry(curve, 24, radius, 6, false);
      const mat = new THREE.MeshStandardMaterial({
        color: COLORS.artery,
        roughness: 0.4,
        metalness: 0.1,
      });
      const mesh = new THREE.Mesh(geom, mat);
      registerPart(mesh, mat, 'nervous', region); // Classified with nervous/circulatory paths
      return mesh;
    };

    const createVein = (points, radius, region = 'Full Body') => {
      const curve = new THREE.CatmullRomCurve3(points);
      const geom = new THREE.TubeGeometry(curve, 24, radius, 6, false);
      const mat = new THREE.MeshStandardMaterial({
        color: COLORS.vein,
        roughness: 0.4,
        metalness: 0.1,
      });
      const mesh = new THREE.Mesh(geom, mat);
      registerPart(mesh, mat, 'nervous', region);
      return mesh;
    };

    // Rib constructor
    const createRibPath = (points, radius, boneMat, region = 'Full Body') => {
      const curve = new THREE.CatmullRomCurve3(points);
      const geom = new THREE.TubeGeometry(curve, 20, radius, 8, false);
      const mesh = new THREE.Mesh(geom, boneMat);
      registerPart(mesh, boneMat, 'skeletal', region);
      return mesh;
    };

    // ==========================================
    // --- BUILD FULL-BODY ANATOMICAL MODEL ---
    // ==========================================

    // 1. SKELETAL SYSTEM
    // Skull
    const skullGeom = new THREE.SphereGeometry(0.3, 16, 16);
    const skullMat = new THREE.MeshStandardMaterial({ color: COLORS.bone, roughness: 0.8 });
    const skull = new THREE.Mesh(skullGeom, skullMat);
    skull.position.set(0, 1.5, 0);
    skull.scale.set(0.9, 1.1, 1);
    registerPart(skull, skullMat, 'skeletal');

    // Skull Facial Details (Eyes & Pupils)
    const eyeGeom = new THREE.SphereGeometry(0.04, 12, 12);
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: COLORS.eyeWhite, roughness: 0.1 });
    const pupilGeom = new THREE.SphereGeometry(0.015, 8, 8);
    const pupilMat = new THREE.MeshStandardMaterial({ color: COLORS.eyePupil, roughness: 0.0 });

    const eyeL = new THREE.Mesh(eyeGeom, eyeWhiteMat);
    eyeL.position.set(-0.08, 1.54, 0.23);
    registerPart(eyeL, eyeWhiteMat, 'skeletal');

    const pupilL = new THREE.Mesh(pupilGeom, pupilMat);
    pupilL.position.set(-0.08, 1.54, 0.265);
    registerPart(pupilL, pupilMat, 'skeletal');

    const eyeR = new THREE.Mesh(eyeGeom, eyeWhiteMat);
    eyeR.position.set(0.08, 1.54, 0.23);
    registerPart(eyeR, eyeWhiteMat, 'skeletal');

    const pupilR = new THREE.Mesh(pupilGeom, pupilMat);
    pupilR.position.set(0.08, 1.54, 0.265);
    registerPart(pupilR, pupilMat, 'skeletal');

    // Jaw Mandible Bone
    const jawCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.18, 1.48, -0.05), // right joint
      new THREE.Vector3(0.16, 1.34, 0.12),  // right angle
      new THREE.Vector3(0, 1.31, 0.26),     // chin
      new THREE.Vector3(-0.16, 1.34, 0.12), // left angle
      new THREE.Vector3(-0.18, 1.48, -0.05), // left joint
    ]);
    const jawGeom = new THREE.TubeGeometry(jawCurve, 16, 0.024, 8, false);
    const jawMesh = new THREE.Mesh(jawGeom, skullMat);
    registerPart(jawMesh, skullMat, 'skeletal');

    // Cervical Spine (C1-C7)
    for (let i = 0; i < 7; i++) {
      const y = 1.3 - i * 0.06;
      const vertGeom = new THREE.CylinderGeometry(0.07, 0.07, 0.04, 12);
      const vertMat = new THREE.MeshStandardMaterial({ color: COLORS.bone, roughness: 0.7 });
      const vert = new THREE.Mesh(vertGeom, vertMat);
      vert.position.set(0, y, -0.05);
      registerPart(vert, vertMat, 'skeletal');

      if (i < 6) {
        const discGeom = new THREE.CylinderGeometry(0.068, 0.068, 0.015, 12);
        const discMat = new THREE.MeshStandardMaterial({ color: COLORS.disc, transparent: true, opacity: 0.7 });
        const disc = new THREE.Mesh(discGeom, discMat);
        disc.position.set(0, y - 0.03, -0.05);
        registerPart(disc, discMat, 'disc');
      }
    }

    // Thoracic Spine
    for (let i = 0; i < 12; i++) {
      const y = 0.88 - i * 0.07;
      const vertGeom = new THREE.CylinderGeometry(0.1, 0.1, 0.05, 12);
      const vertMat = new THREE.MeshStandardMaterial({ color: COLORS.bone, roughness: 0.7 });
      const vert = new THREE.Mesh(vertGeom, vertMat);
      vert.position.set(0, y, -0.07);
      registerPart(vert, vertMat, 'skeletal');
    }

    // Lumbar Spine (L1-L5)
    for (let i = 0; i < 5; i++) {
      const y = 0.04 - i * 0.08;
      const vertGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.06, 12);
      const vertMat = new THREE.MeshStandardMaterial({ color: COLORS.bone, roughness: 0.7 });
      const vert = new THREE.Mesh(vertGeom, vertMat);
      vert.position.set(0, y, -0.08);
      registerPart(vert, vertMat, 'skeletal');

      // Spinous processes on lumbar
      const spinGeom = new THREE.BoxGeometry(0.04, 0.05, 0.12);
      const spin = new THREE.Mesh(spinGeom, vertMat);
      spin.position.set(0, y, -0.16);
      registerPart(spin, vertMat, 'skeletal');

      if (i < 4) {
        const discGeom = new THREE.CylinderGeometry(0.118, 0.118, 0.02, 12);
        const discMat = new THREE.MeshStandardMaterial({ color: COLORS.disc, transparent: true, opacity: 0.7 });
        const disc = new THREE.Mesh(discGeom, discMat);
        disc.position.set(0, y - 0.04, -0.08);
        registerPart(disc, discMat, 'disc');
      }
    }

    // Chest Sternum Bone (Front center)
    const sternumMat = new THREE.MeshStandardMaterial({ color: COLORS.bone, roughness: 0.8 });
    const sternumGeom = new THREE.BoxGeometry(0.08, 0.52, 0.03);
    const sternum = new THREE.Mesh(sternumGeom, sternumMat);
    sternum.position.set(0, 0.64, 0.35);
    registerPart(sternum, sternumMat, 'skeletal');

    // Ribcage (10 pairs of anatomically curved ribs)
    const ribMat = new THREE.MeshStandardMaterial({ color: COLORS.bone, roughness: 0.75 });
    for (let i = 0; i < 10; i++) {
      const yStart = 0.88 - i * 0.05;
      const yEnd = 0.83 - i * 0.05;
      const radius = 0.36 - i * 0.01;
      
      // Right Rib
      const rRibPoints = [
        new THREE.Vector3(0, yStart, -0.07),
        new THREE.Vector3(radius, (yStart + yEnd) / 2, 0.1),
        new THREE.Vector3(radius * 0.7, yEnd, 0.3),
        new THREE.Vector3(0.04, yEnd, 0.34)
      ];
      createRibPath(rRibPoints, 0.012, ribMat);

      // Left Rib
      const lRibPoints = [
        new THREE.Vector3(0, yStart, -0.07),
        new THREE.Vector3(-radius, (yStart + yEnd) / 2, 0.1),
        new THREE.Vector3(-radius * 0.7, yEnd, 0.3),
        new THREE.Vector3(-0.04, yEnd, 0.34)
      ];
      createRibPath(lRibPoints, 0.012, ribMat);
    }

    // Pelvis
    const pelvisGeom = new THREE.TorusGeometry(0.24, 0.05, 8, 16);
    const pelvisMat = new THREE.MeshStandardMaterial({ color: COLORS.bone, roughness: 0.8 });
    const pelvis = new THREE.Mesh(pelvisGeom, pelvisMat);
    pelvis.position.set(0, -0.45, 0);
    pelvis.rotation.x = Math.PI / 2;
    pelvis.scale.set(1.2, 1, 0.75);
    registerPart(pelvis, pelvisMat, 'skeletal');

    // Clavicles (collar bones)
    createBone(0.022, 0.5, 0.22, 0.94, 0.1, 0, 0, Math.PI / 2 - 0.1, 'Shoulder Joint');
    createBone(0.022, 0.5, -0.22, 0.94, 0.1, 0, 0, -Math.PI / 2 + 0.1, 'Full Body');

    // Left & Right Shoulder / Arm Bones
    const rShoulderX = 0.52;
    const lShoulderX = -0.52;
    const shoulderY = 0.9;

    // Humerus (Upper arm)
    createBone(0.035, 0.6, rShoulderX + 0.05, shoulderY - 0.3, 0, 0, 0, -0.1, 'Shoulder Joint'); // Right
    createBone(0.035, 0.6, lShoulderX - 0.05, shoulderY - 0.3, 0, 0, 0, 0.1, 'Full Body'); // Left

    // Radius/Ulna (Forearm)
    createBone(0.025, 0.55, rShoulderX + 0.1, shoulderY - 0.85, 0, 0, 0, -0.15, 'Shoulder Joint'); // Right
    createBone(0.025, 0.55, lShoulderX - 0.1, shoulderY - 0.85, 0, 0, 0, 0.15, 'Full Body'); // Left

    // Leg Bones
    const hipX = 0.22;
    const kneeY = -1.1;

    // Femurs (Thighs)
    createBone(0.048, 0.65, hipX, -0.8, 0, 0, 0, 0.05, 'Knee Joint'); // Right
    createBone(0.048, 0.65, -hipX, -0.8, 0, 0, 0, -0.05, 'Full Body'); // Left

    // Tibias/Fibulas (Shins)
    createBone(0.038, 0.65, hipX + 0.02, -1.45, 0, 0, 0, 0, 'Knee Joint'); // Right
    createBone(0.038, 0.65, -hipX - 0.02, -1.45, 0, 0, 0, 0, 'Full Body'); // Left

    // Patellas (Knee caps)
    const patMat = new THREE.MeshStandardMaterial({ color: COLORS.bone, roughness: 0.8 });
    const patGeom = new THREE.SphereGeometry(0.055, 12, 12);

    const rPatella = new THREE.Mesh(patGeom, patMat);
    rPatella.position.set(hipX + 0.01, kneeY, 0.09);
    rPatella.scale.set(1, 1.2, 0.6);
    registerPart(rPatella, patMat, 'skeletal', 'Knee Joint');

    const lPatella = new THREE.Mesh(patGeom, patMat);
    lPatella.position.set(-hipX - 0.01, kneeY, 0.09);
    lPatella.scale.set(1, 1.2, 0.6);
    registerPart(lPatella, patMat, 'skeletal', 'Full Body');

    // Patellar Ligaments
    const ligMat = new THREE.MeshStandardMaterial({ color: COLORS.ligament, roughness: 0.5 });
    const ligGeom = new THREE.BoxGeometry(0.035, 0.2, 0.02);

    const rLig = new THREE.Mesh(ligGeom, ligMat);
    rLig.position.set(hipX + 0.01, kneeY - 0.12, 0.08);
    registerPart(rLig, ligMat, 'ligament', 'Knee Joint');

    const lLig = new THREE.Mesh(ligGeom, ligMat);
    lLig.position.set(-hipX - 0.01, kneeY - 0.12, 0.08);
    registerPart(lLig, ligMat, 'ligament', 'Full Body');


    // 2. MUSCULAR & VISCERAL SYSTEM (Striated muscles + organs + stomach + intestines)
    // Pectorals (Chest) - Fibrous
    createFibrousMuscle(0.12, 0.35, 0.18, 0.74, 0.15, 0, 0.4, -Math.PI / 4, 1.8, 'Shoulder Joint');
    createFibrousMuscle(0.12, 0.35, -0.18, 0.74, 0.15, 0, -0.4, Math.PI / 4, 1.8, 'Full Body');

    // Abdominals (Core)
    for (let i = 0; i < 3; i++) {
      const y = 0.4 - i * 0.15;
      createMuscle(0.08, 0.1, 0.08, y, 0.14, 0, 0, 0, 1.1, 1, 'Lumbar Spine');
      createMuscle(0.08, 0.1, -0.08, y, 0.14, 0, 0, 0, 1.1, 1, 'Lumbar Spine');
    }

    // Deltoids (Shoulders) - Fibrous striated
    createFibrousMuscle(0.09, 0.3, rShoulderX + 0.04, shoulderY - 0.08, 0.04, 0.2, 0, -0.2, 1, 'Shoulder Joint');
    createFibrousMuscle(0.09, 0.3, lShoulderX - 0.04, shoulderY - 0.08, 0.04, 0.2, 0, 0.2, 1, 'Full Body');

    // Biceps (Arms) - Fibrous
    createFibrousMuscle(0.065, 0.38, rShoulderX + 0.06, shoulderY - 0.32, 0.06, 0.1, 0, -0.1, 1, 'Shoulder Joint');
    createFibrousMuscle(0.065, 0.38, lShoulderX - 0.06, shoulderY - 0.32, 0.06, 0.1, 0, 0.1, 1, 'Full Body');

    // Quads (Thighs) - Fibrous striated
    createFibrousMuscle(0.12, 0.52, hipX + 0.01, -0.76, 0.12, 0, 0, 0.05, 1, 'Knee Joint');
    createFibrousMuscle(0.12, 0.52, -hipX - 0.01, -0.76, 0.12, 0, 0, -0.05, 1, 'Full Body');

    // Calves (Shins) - Fibrous
    createFibrousMuscle(0.08, 0.45, hipX + 0.04, -1.45, -0.08, 0, 0, 0, 1, 'Knee Joint');
    createFibrousMuscle(0.08, 0.45, -hipX - 0.04, -1.45, -0.08, 0, 0, 0, 1, 'Full Body');

    // --- VISCERAL ORGANS ---
    // Lungs (Left & Right)
    const lungMat = new THREE.MeshStandardMaterial({ color: COLORS.organLung, roughness: 0.6 });
    const lungGeom = new THREE.CylinderGeometry(0.08, 0.11, 0.35, 12);
    
    const rLung = new THREE.Mesh(lungGeom, lungMat);
    rLung.position.set(0.14, 0.65, 0.06);
    rLung.scale.set(1.2, 1, 0.8);
    registerPart(rLung, lungMat, 'muscular');

    const lLung = new THREE.Mesh(lungGeom, lungMat);
    lLung.position.set(-0.14, 0.65, 0.06);
    lLung.scale.set(1.2, 1, 0.8);
    registerPart(lLung, lungMat, 'muscular');

    // Heart
    const heartMat = new THREE.MeshStandardMaterial({ color: COLORS.organHeart, roughness: 0.5 });
    const heartGeom = new THREE.SphereGeometry(0.06, 12, 12);
    const heart = new THREE.Mesh(heartGeom, heartMat);
    heart.position.set(0.03, 0.66, 0.11);
    heart.scale.set(0.8, 1.1, 0.9);
    registerPart(heart, heartMat, 'muscular');

    // Liver
    const liverMat = new THREE.MeshStandardMaterial({ color: COLORS.organLiver, roughness: 0.6 });
    const liverGeom = new THREE.BoxGeometry(0.18, 0.12, 0.14);
    const liver = new THREE.Mesh(liverGeom, liverMat);
    liver.position.set(-0.08, 0.45, 0.09);
    liver.rotation.set(0.1, -0.2, -0.15);
    registerPart(liver, liverMat, 'muscular');

    // Stomach (visceral pink organ)
    const stomachMat = new THREE.MeshStandardMaterial({ color: COLORS.organStomach, roughness: 0.5 });
    const stomachGeom = new THREE.SphereGeometry(0.08, 12, 12);
    const stomach = new THREE.Mesh(stomachGeom, stomachMat);
    stomach.position.set(0.08, 0.32, 0.1);
    stomach.scale.set(1.4, 0.9, 0.9);
    stomach.rotation.z = -0.3;
    registerPart(stomach, stomachMat, 'muscular');

    // Intestines (folded loops represented by a complex winding procedural spline tube)
    const intestinalPoints = [];
    const loopsCount = 18;
    for (let i = 0; i < loopsCount; i++) {
      const theta = (i / loopsCount) * Math.PI * 8.5; // spiral wrapping curves
      const r = 0.13 - (i / loopsCount) * 0.03;       // slightly tapering radius
      const x = Math.sin(theta) * r;
      const y = 0.12 - (i / loopsCount) * 0.42;        // spiral downwards from y=0.12 to y=-0.3
      const z = Math.cos(theta) * r * 0.7 + 0.12;      // bulge forward into abdominal cavity
      intestinalPoints.push(new THREE.Vector3(x, y, z));
    }
    const intCurve = new THREE.CatmullRomCurve3(intestinalPoints);
    const intGeom = new THREE.TubeGeometry(intCurve, 100, 0.034, 8, false);
    const intMat = new THREE.MeshStandardMaterial({
      color: COLORS.organIntestines,
      roughness: 0.65,
      metalness: 0.0
    });
    const intMesh = new THREE.Mesh(intGeom, intMat);
    registerPart(intMesh, intMat, 'muscular');


    // 3. NERVOUS & CIRCULATORY SYSTEMS (Brain + spinal cord + nerves + arteries + veins)
    // Brain (inside skull)
    const brainGeom = new THREE.SphereGeometry(0.18, 16, 16);
    const brainMat = new THREE.MeshStandardMaterial({
      color: COLORS.nerve,
      emissive: COLORS.nerveEmissive,
      emissiveIntensity: 1.2,
      roughness: 0.1
    });
    const brain = new THREE.Mesh(brainGeom, brainMat);
    brain.position.set(0, 1.52, 0.02);
    brain.scale.set(0.9, 1.1, 1.1);
    registerPart(brain, brainMat, 'nervous', 'Cervical Spine');

    // Spinal Cord (central channel)
    createNerve([
      new THREE.Vector3(0, 1.35, -0.04),
      new THREE.Vector3(0, 0.8, -0.06),
      new THREE.Vector3(0, 0.2, -0.07),
      new THREE.Vector3(0, -0.3, -0.07)
    ], 0.022, 'Lumbar Spine');

    // Brachial Plexus Nerves
    // Right Plexus
    createNerve([
      new THREE.Vector3(0, 1.15, -0.04),
      new THREE.Vector3(0.2, 0.95, 0.05),
      new THREE.Vector3(rShoulderX, shoulderY - 0.1, 0.05),
      new THREE.Vector3(rShoulderX + 0.08, shoulderY - 0.4, 0.05),
      new THREE.Vector3(rShoulderX + 0.14, shoulderY - 0.85, 0.02)
    ], 0.012, 'Shoulder Joint');

    // Left Plexus
    createNerve([
      new THREE.Vector3(0, 1.15, -0.04),
      new THREE.Vector3(-0.2, 0.95, 0.05),
      new THREE.Vector3(lShoulderX, shoulderY - 0.1, 0.05),
      new THREE.Vector3(lShoulderX - 0.08, shoulderY - 0.4, 0.05),
      new THREE.Vector3(lShoulderX - 0.14, shoulderY - 0.85, 0.02)
    ], 0.012, 'Full Body');

    // Sciatic Nerves
    // Right Sciatic
    createNerve([
      new THREE.Vector3(0, -0.25, -0.07),
      new THREE.Vector3(hipX, -0.5, -0.03),
      new THREE.Vector3(hipX, -0.85, -0.04),
      new THREE.Vector3(hipX + 0.02, kneeY, -0.02),
      new THREE.Vector3(hipX + 0.04, -1.5, -0.06)
    ], 0.015, 'Knee Joint');

    // Left Sciatic
    createNerve([
      new THREE.Vector3(0, -0.25, -0.07),
      new THREE.Vector3(-hipX, -0.5, -0.03),
      new THREE.Vector3(-hipX, -0.85, -0.04),
      new THREE.Vector3(-hipX - 0.02, kneeY, -0.02),
      new THREE.Vector3(-hipX - 0.04, -1.5, -0.06)
    ], 0.015, 'Full Body');

    // --- CIRCULATORY SYSTEM PATHS (VEINS & ARTERIES) ---
    // Central Main Vessels (Aorta & Vena Cava running along spine)
    createArtery([
      new THREE.Vector3(0.03, 0.76, 0.12), // heart region
      new THREE.Vector3(0.04, 0.4, -0.02),
      new THREE.Vector3(0.03, 0.0, -0.04),
      new THREE.Vector3(0.02, -0.4, -0.03)
    ], 0.018, 'Full Body');

    createVein([
      new THREE.Vector3(-0.03, 0.76, 0.12),
      new THREE.Vector3(-0.04, 0.4, -0.02),
      new THREE.Vector3(-0.03, 0.0, -0.04),
      new THREE.Vector3(-0.02, -0.4, -0.03)
    ], 0.018, 'Full Body');

    // Neck Vessels (Carotid Artery & Jugular Vein)
    createArtery([
      new THREE.Vector3(0.03, 0.82, 0.08),
      new THREE.Vector3(0.06, 1.1, 0.06),
      new THREE.Vector3(0.08, 1.35, 0.12)
    ], 0.011, 'Cervical Spine');

    createVein([
      new THREE.Vector3(-0.03, 0.82, 0.08),
      new THREE.Vector3(-0.06, 1.1, 0.06),
      new THREE.Vector3(-0.08, 1.35, 0.12)
    ], 0.011, 'Cervical Spine');

    // Shoulder & Arm Vessels (Axillary / Brachial)
    // Right Arm (Artery and Vein pair)
    createArtery([
      new THREE.Vector3(0.04, 0.78, 0.12),
      new THREE.Vector3(0.24, 0.9, 0.08),
      new THREE.Vector3(rShoulderX + 0.04, shoulderY - 0.28, 0.03),
      new THREE.Vector3(rShoulderX + 0.12, shoulderY - 0.8, -0.02)
    ], 0.01, 'Shoulder Joint');

    createVein([
      new THREE.Vector3(-0.04, 0.78, 0.12),
      new THREE.Vector3(0.22, 0.86, 0.08),
      new THREE.Vector3(rShoulderX + 0.02, shoulderY - 0.32, 0.03),
      new THREE.Vector3(rShoulderX + 0.09, shoulderY - 0.82, -0.02)
    ], 0.01, 'Shoulder Joint');

    // Left Arm (Artery and Vein pair)
    createArtery([
      new THREE.Vector3(-0.04, 0.78, 0.12),
      new THREE.Vector3(-0.24, 0.9, 0.08),
      new THREE.Vector3(lShoulderX - 0.04, shoulderY - 0.28, 0.03),
      new THREE.Vector3(lShoulderX - 0.12, shoulderY - 0.8, -0.02)
    ], 0.01, 'Full Body');

    createVein([
      new THREE.Vector3(0.04, 0.78, 0.12),
      new THREE.Vector3(-0.22, 0.86, 0.08),
      new THREE.Vector3(lShoulderX - 0.02, shoulderY - 0.32, 0.03),
      new THREE.Vector3(lShoulderX - 0.09, shoulderY - 0.82, -0.02)
    ], 0.01, 'Full Body');

    // Leg Vessels (Femoral Artery & Vein)
    // Right Leg
    createArtery([
      new THREE.Vector3(0.02, -0.4, -0.03),
      new THREE.Vector3(hipX + 0.02, -0.65, 0.02),
      new THREE.Vector3(hipX + 0.02, kneeY, 0.04),
      new THREE.Vector3(hipX + 0.03, -1.5, 0.0)
    ], 0.012, 'Knee Joint');

    createVein([
      new THREE.Vector3(-0.02, -0.4, -0.03),
      new THREE.Vector3(hipX - 0.01, -0.65, 0.02),
      new THREE.Vector3(hipX - 0.01, kneeY, 0.04),
      new THREE.Vector3(hipX - 0.01, -1.5, 0.0)
    ], 0.012, 'Knee Joint');

    // Left Leg
    createArtery([
      new THREE.Vector3(-0.02, -0.4, -0.03),
      new THREE.Vector3(-hipX - 0.02, -0.65, 0.02),
      new THREE.Vector3(-hipX - 0.02, kneeY, 0.04),
      new THREE.Vector3(-hipX - 0.03, -1.5, 0.0)
    ], 0.012, 'Full Body');

    createVein([
      new THREE.Vector3(0.02, -0.4, -0.03),
      new THREE.Vector3(-hipX + 0.01, -0.65, 0.02),
      new THREE.Vector3(-hipX + 0.01, kneeY, 0.04),
      new THREE.Vector3(-hipX + 0.01, -1.5, 0.0)
    ], 0.012, 'Full Body');


    // ==========================================
    // --- MOUSE & TOUCH ROTATION HANDLING ---
    // ==========================================
    let isDragging = false;
    let previousPosition = { x: 0, y: 0 };

    const onStart = (clientX, clientY) => {
      isDragging = true;
      previousPosition = { x: clientX, y: clientY };
    };

    const onMove = (clientX, clientY) => {
      if (!isDragging) return;
      const deltaX = clientX - previousPosition.x;
      const deltaY = clientY - previousPosition.y;

      mainGroup.rotation.y += deltaX * 0.007;
      mainGroup.rotation.x += deltaY * 0.007;

      // Limit vertical rotation to avoid flipping upside down
      mainGroup.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, mainGroup.rotation.x));

      previousPosition = { x: clientX, y: clientY };
    };

    const onEnd = () => {
      isDragging = false;
    };

    const handleMouseDown = (e) => onStart(e.clientX, e.clientY);
    const handleMouseMove = (e) => onMove(e.clientX, e.clientY);
    const handleMouseUp = () => onEnd();
    const handleMouseLeave = () => onEnd();

    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        onStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const handleTouchMove = (e) => {
      if (e.touches.length === 1) {
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const handleTouchEnd = () => onEnd();

    const canvasEl = renderer.domElement;
    canvasEl.addEventListener('mousedown', handleMouseDown);
    canvasEl.addEventListener('mousemove', handleMouseMove);
    canvasEl.addEventListener('mouseup', handleMouseUp);
    canvasEl.addEventListener('mouseleave', handleMouseLeave);

    canvasEl.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvasEl.addEventListener('touchmove', handleTouchMove, { passive: true });
    canvasEl.addEventListener('touchend', handleTouchEnd);


    // ==========================================
    // --- ANIMATION / RENDER TICK LOOP ---
    // ==========================================
    const tick = () => {
      // 1. Slow auto-spin when not dragging
      if (isRotating && !isDragging) {
        mainGroup.rotation.y += 0.004;
      }

      // 2. Camera Lerping to Region View
      const view = REGION_VIEWS[activeRegionRef.current] || REGION_VIEWS['Full Body'];
      
      // Calculate target camera vector factoring in interactive zoom scale
      const targetCam = view.cam.clone().multiplyScalar(zoomScaleRef.current);
      camera.position.lerp(targetCam, 0.05);

      // Smoothly pan camera center of attention
      currentLookAt.current.lerp(view.look, 0.05);
      camera.lookAt(currentLookAt.current);

      // 3. Pulse animation for active region's non-skeletal parts (muscles, nerves, blood vessels)
      const time = Date.now() * 0.004;
      const pulseIntensity = 0.5 + Math.sin(time) * 0.45; // oscillates between 0.05 and 0.95
      
      partsRef.current.forEach(({ material, region, type }) => {
        if (material) {
          if (region === activeRegionRef.current) {
            if (type === 'muscular') {
              material.emissive = new THREE.Color(0x0ea5e9); // Cyan glowing highlights
              material.emissiveIntensity = pulseIntensity * 0.5;
            } else if (type === 'nervous') {
              material.emissiveIntensity = pulseIntensity * 1.5;
            }
          } else {
            // Reset emissive for other regions
            if (type === 'muscular') {
              material.emissive = new THREE.Color(0x000000);
              material.emissiveIntensity = 0;
            } else if (type === 'nervous' && material.emissive) {
              // Nerves have default yellow emission
              material.emissive = new THREE.Color(0xeab308);
              material.emissiveIntensity = 0.5;
            }
          }
        }
      });

      renderer.render(scene, camera);
      reqAnimFrameRef.current = requestAnimationFrame(tick);
    };
    tick();


    // ==========================================
    // --- CONTAINER RESIZE OBSERVER (BULLETPROOF) ---
    // ==========================================
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w === 0 || h === 0) continue;
        
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        
        renderer.setSize(w, h);
      }
    });
    
    resizeObserver.observe(mountRef.current);


    // ==========================================
    // --- CLEANUP DISPOSALS ---
    // ==========================================
    return () => {
      resizeObserver.disconnect();
      if (reqAnimFrameRef.current) {
        cancelAnimationFrame(reqAnimFrameRef.current);
      }
      if (canvasEl) {
        canvasEl.removeEventListener('mousedown', handleMouseDown);
        canvasEl.removeEventListener('mousemove', handleMouseMove);
        canvasEl.removeEventListener('mouseup', handleMouseUp);
        canvasEl.removeEventListener('mouseleave', handleMouseLeave);
        canvasEl.removeEventListener('touchstart', handleTouchStart);
        canvasEl.removeEventListener('touchmove', handleTouchMove);
        canvasEl.removeEventListener('touchend', handleTouchEnd);
      }

      partsRef.current.forEach(({ mesh }) => {
        mesh.traverse((node) => {
          if (node.isMesh) {
            if (node.geometry) node.geometry.dispose();
            if (node.material) {
              if (Array.isArray(node.material)) {
                node.material.forEach((mat) => mat.dispose());
              } else {
                node.material.dispose();
              }
            }
          }
        });
      });
    };
  }, [isRotating]);

  return (
    <div 
      ref={mountRef} 
      style={{ 
        width: '100%', 
        height: '100%', 
        cursor: 'grab', 
        display: 'block' 
      }} 
    />
  );
});

AnatomyCanvas.displayName = 'AnatomyCanvas';
export default AnatomyCanvas;
