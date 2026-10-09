import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export default function Drone({ paused, replay, reduced }) {
  const host = useRef(null), control = useRef({ paused, replay, reduced });
  const assetBase = import.meta.env.BASE_URL;
  const [state, setState] = useState('loading');
  control.current = { paused, replay, reduced };
  useEffect(() => {
    let disposed = false, frame, renderer, model, pmrem, env, observer;
    let cleanupInteraction = () => {};
    const geometries = new Set(), materials = new Set(), textures = new Set();
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
      renderer.setClearColor(0x000000, 0);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = .95;
      host.current.appendChild(renderer.domElement);
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(31, 1, .01, 20);
      // Near-level three-quarter view: reveal the gimbal rather than the top shell.
      camera.position.set(.33, .19, .935); camera.lookAt(0, .14, 0);
      pmrem = new THREE.PMREMGenerator(renderer);
      const room = new RoomEnvironment(); env = pmrem.fromScene(room, .04); room.dispose();
      scene.environment = env.texture; scene.environmentIntensity = .55;
      scene.add(new THREE.HemisphereLight(0xbddaff, 0x162037, .8));
      const key = new THREE.DirectionalLight(0xeaf3ff, 2); key.position.set(-1, 2, 3); scene.add(key);
      const rim = new THREE.DirectionalLight(0x238aff, 2.8); rim.position.set(1, 1, -2); scene.add(rim);
      const rig = new THREE.Group(); scene.add(rig);
      const inspection = new THREE.Group(); inspection.position.y = .14; rig.add(inspection);
      const defaultPose = new THREE.Euler(.12, -.16, 0);
      const restorePose = () => inspection.rotation.copy(defaultPose);
      restorePose();
      const canvas = renderer.domElement;
      canvas.style.pointerEvents = 'auto';
      canvas.style.touchAction = 'none';
      canvas.tabIndex = 0;
      canvas.setAttribute('aria-label', '无人机模型：长按拖动旋转，双击或按 Escape 复位，方向键调整角度');
      canvas.title = '长按拖动旋转 · 双击复位';
      const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
      let heldPointer = null, holdTimer = null, dragging = false, lastX = 0, lastY = 0;
      const hitModel = event => {
        if (!model) return false;
        const rect = canvas.getBoundingClientRect();
        pointer.set((event.clientX-rect.left)/rect.width*2-1, 1-(event.clientY-rect.top)/rect.height*2);
        scene.updateMatrixWorld(true); camera.updateMatrixWorld(true);
        raycaster.setFromCamera(pointer,camera);
        return raycaster.intersectObject(model,true).some(hit=>hit.object.isMesh);
      };
      const release = () => {
        clearTimeout(holdTimer); holdTimer = null; dragging = false;
        const id = heldPointer; heldPointer = null;
        if (id !== null && canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
        canvas.style.cursor = '';
      };
      const down = event => {
        if (event.button !== 0 || heldPointer !== null || !hitModel(event)) return;
        event.preventDefault(); canvas.focus({preventScroll:true});
        heldPointer = event.pointerId; lastX = event.clientX; lastY = event.clientY;
        canvas.setPointerCapture(heldPointer); canvas.style.cursor = 'grab';
        holdTimer = setTimeout(()=>{dragging=true;canvas.style.cursor='grabbing';},300);
      };
      const move = event => {
        if (event.pointerId !== heldPointer) return;
        if (dragging) {
          inspection.rotation.y += (event.clientX-lastX)*.006;
          inspection.rotation.x = THREE.MathUtils.clamp(inspection.rotation.x+(event.clientY-lastY)*.004,-.65,.65);
        }
        lastX=event.clientX;lastY=event.clientY;
      };
      const up = event => { if(event.pointerId===heldPointer) release(); };
      const reset = event => { if(hitModel(event)){release();restorePose();} };
      const keyboard = event => {
        if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Escape'].includes(event.key)) return;
        event.preventDefault();
        if(event.key==='Escape'){release();restorePose();return;}
        if(event.key==='ArrowLeft') inspection.rotation.y-=.08;
        if(event.key==='ArrowRight') inspection.rotation.y+=.08;
        if(event.key==='ArrowUp') inspection.rotation.x-=.05;
        if(event.key==='ArrowDown') inspection.rotation.x+=.05;
        inspection.rotation.x=THREE.MathUtils.clamp(inspection.rotation.x,-.65,.65);
      };
      const visibility = () => { if(document.hidden) release(); };
      canvas.addEventListener('pointerdown',down);
      canvas.addEventListener('pointermove',move);
      canvas.addEventListener('pointerup',up);
      canvas.addEventListener('pointercancel',up);
      canvas.addEventListener('lostpointercapture',up);
      canvas.addEventListener('dblclick',reset);
      canvas.addEventListener('keydown',keyboard);
      window.addEventListener('blur',release);
      document.addEventListener('visibilitychange',visibility);
      cleanupInteraction = () => {
        release();
        canvas.removeEventListener('pointerdown',down);
        canvas.removeEventListener('pointermove',move);
        canvas.removeEventListener('pointerup',up);
        canvas.removeEventListener('pointercancel',up);
        canvas.removeEventListener('lostpointercapture',up);
        canvas.removeEventListener('dblclick',reset);
        canvas.removeEventListener('keydown',keyboard);
        window.removeEventListener('blur',release);
        document.removeEventListener('visibilitychange',visibility);
      };
      let elapsed = 0, last = performance.now(), seenReplay = control.current.replay;
      const rotors = [];
      const resize = () => {
        const {width,height} = host.current.getBoundingClientRect();
        if (!width || !height) return;
        renderer.setSize(width,height); camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };
      observer = new ResizeObserver(resize); observer.observe(host.current); resize();
      new GLTFLoader().load(`${assetBase}assets/drone.glb`, gltf => {
        if (disposed) { gltf.scene.traverse(o=>{o.geometry?.dispose(); if(o.material) (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());}); return; }
        model = gltf.scene;
        const whiteChannel = new THREE.MeshStandardMaterial({
          name: 'White • light strip inset channel', color: 0xf4f7ff, metalness: .08, roughness: .55
        });
        const glowingPropeller = new THREE.MeshStandardMaterial({
          name: 'Electric blue • luminous propeller',
          color: 0x3aa7ff,
          emissive: 0x0077ff,
          emissiveIntensity: 2.35,
          metalness: .16,
          roughness: .28,
          toneMapped: false
        });
        materials.add(whiteChannel); materials.add(glowingPropeller);
        model.traverse(o => {
          if (o.name.includes('Rotor_pivot') || o.name.includes('Rotor pivot')) rotors.push(o);
          if (o.geometry) geometries.add(o.geometry);
          if (o.material) for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
            materials.add(m); Object.values(m).forEach(v => {if(v?.isTexture) textures.add(v);});
            if (m.name.includes('Platform logo')) {
              o.visible = false;
            }
          }
          // Change only the strip backing, not the shared black optics material.
          if (o.isMesh && /inset[ _]channel/i.test(o.name)) o.material = whiteChannel;
          if (o.isMesh && /blade [12]$/i.test(o.name)) o.material = glowingPropeller;
          if (o.isMesh && /Unbranded[ _]service[ _]hatch/i.test(o.name)) o.visible = false;
          if (/Service[ _]hatch.*(screw|indicator)/i.test(o.name)) o.visible = false;
        });
        // Adjacent motors counter-rotate while diagonal motors share a direction.
        // Derive the pairing from each rotor's position instead of GLTF node order.
        model.updateMatrixWorld(true);
        rotors.forEach(rotor => {
          const worldPosition = rotor.getWorldPosition(new THREE.Vector3());
          const modelPosition = model.worldToLocal(worldPosition);
          rotor.userData.spinDirection = modelPosition.x * modelPosition.z >= 0 ? 1 : -1;
          const rotorLight = new THREE.PointLight(0x168dff, .9, .46, 2);
          rotorLight.position.y = .025;
          rotor.add(rotorLight);
        });
        const glowCanvas = document.createElement('canvas'); glowCanvas.width = glowCanvas.height = 64;
        const ctx = glowCanvas.getContext('2d'), gradient = ctx.createRadialGradient(32,32,0,32,32,32);
        gradient.addColorStop(0,'rgba(50,205,255,.5)'); gradient.addColorStop(.22,'rgba(15,160,255,.2)'); gradient.addColorStop(1,'rgba(0,80,255,0)');
        ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
        const glowTexture=new THREE.CanvasTexture(glowCanvas);textures.add(glowTexture);
        model.updateMatrixWorld(true);
        const emitters=[];model.traverse(o=>{ if(o.isMesh && o.visible && o.material?.name.includes('ION cyan')) emitters.push(o); });
        emitters.forEach(o=>{
          const bright=new THREE.MeshBasicMaterial({color:0x21bdff,toneMapped:false}); materials.add(bright);o.material=bright;
          const center=new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3());
          const sm=new THREE.SpriteMaterial({map:glowTexture,color:0x4bcfff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false});materials.add(sm);
          const sprite=new THREE.Sprite(sm);sprite.position.copy(model.worldToLocal(center));sprite.scale.setScalar(.06);model.add(sprite);
        });
        model.position.y -= .14;
        inspection.add(model); elapsed = 0; setState('ready');
      }, undefined, () => { if(!disposed) setState('error'); });
      const animate = now => {
        if(disposed) return;
        frame = requestAnimationFrame(animate);
        const dt = Math.min((now-last)/1000,.05); last = now;
        if(document.hidden) return;
        const c = control.current;
        if(c.replay !== seenReplay) { elapsed = 0; seenReplay = c.replay; }
        if(!c.paused && !c.reduced && model) elapsed += dt;
        const t = c.reduced ? 5 : elapsed;
        const p = Math.min(t/3.1,1), ease = 1-Math.pow(1-p,3);
        rig.position.x = -1.6*(1-ease);
        rig.position.y = (1-ease)*.045 + Math.sin(Math.max(0,t-3.1)*.72)*.0075;
        rig.rotation.z = -.105*(1-ease) + Math.sin(t*.48)*.003*ease;
        // Turn the nose toward the login form on the right.
        rig.rotation.y = .82 - .12*(1-ease) + Math.sin(t*.32)*.009*ease;
        // One revolution per 4 seconds.
        if(!c.paused && !c.reduced) rotors.forEach(r => {
          r.rotation.y += dt*(Math.PI*2/4)*r.userData.spinDirection;
        });
        renderer.render(scene,camera);
      };
      frame = requestAnimationFrame(animate);
    } catch { setState('error'); }
    return () => { disposed=true; cancelAnimationFrame(frame); cleanupInteraction(); observer?.disconnect(); geometries.forEach(g=>g.dispose()); materials.forEach(m=>m.dispose()); textures.forEach(t=>t.dispose()); env?.dispose(); pmrem?.dispose(); renderer?.dispose(); renderer?.domElement.remove(); };
  }, [assetBase]);
  return <div className="drone-stage" ref={host} aria-label="Matrice 4TD 无人机三维动画">{state==='loading' && <span className="model-loading">正在装载飞行器…</span>}{state==='error' && <img className="drone-fallback" src={`${assetBase}assets/drone-poster.png`} alt="Matrice 4TD 无人机" />}</div>;
}
