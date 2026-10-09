import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import AeroShards from './components/AeroShards';
import Drone from './components/Drone';
import LoginPanel from './components/LoginPanel';
import './styles.css';

function App() {
  const assetBase = import.meta.env.BASE_URL;
  const [bgError,setBgError]=useState(false);
  const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(()=>{ const q=matchMedia('(prefers-reduced-motion: reduce)'); const fn=()=>setReduced(q.matches); q.addEventListener('change',fn); return ()=>q.removeEventListener('change',fn); },[]);
  return <main className="app">
    <div className="background"><AeroShards
      backgroundColor="#000000" shardColor="#0082ff" accentColor="#0758ff"
      placement="full" material="pearl" detail="balanced" flow="stream" effect="none" interaction="repel"
      scale={0.8} spread={0.75} depth={0.9} speed={0.1} spin={0.6} density={0.8}
      shardSize={0.9} stretch={1} turbulence={1} glow={1.25} edgeSoftness={2} bloom={0.5}
      grain={0.05} chromaticAberration={0} transitionDuration={1}
      interactionRadius={1.5} interactionStrength={0.5} rippleIntensity={0.6} holdToGather={true}
      paused={reduced} onError={()=>setBgError(true)}
    /></div>
    <div className="ambient" aria-hidden="true"/>
    <div className="digital-city" aria-hidden="true">
      <img src={`${assetBase}assets/digital-city-bottom-v1.png`} alt="" draggable="false" />
    </div>
    <section className="visual" aria-label="低空警务飞行器展示">
      <Drone paused={false} replay={0} reduced={reduced}/>
    </section>
    <LoginPanel />
    {bgError&&<div className="compatibility" role="status">当前浏览器不支持背景所需的 WebGPU，请使用支持 WebGPU 的新版 Chrome 查看 Aero Shards 交互。</div>}
  </main>;
}
createRoot(document.getElementById('root')).render(<App/>);
