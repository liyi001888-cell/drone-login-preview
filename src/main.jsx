import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Pause, Play } from 'lucide-react';
import AeroShards from './components/AeroShards';
import Drone from './components/Drone';
import LoginPanel from './components/LoginPanel';
import './styles.css';

function App() {
  const assetBase = import.meta.env.BASE_URL;
  const [paused,setPaused]=useState(false), [bgError,setBgError]=useState(false);
  const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(()=>{ const q=matchMedia('(prefers-reduced-motion: reduce)'); const fn=()=>setReduced(q.matches); q.addEventListener('change',fn); return ()=>q.removeEventListener('change',fn); },[]);
  return <main className="app">
    <div className="background"><AeroShards
      backgroundColor="#120f17" shardColor="#0082ff" accentColor="#0758ff"
      placement="full" material="pearl" detail="balanced" flow="stream" effect="none" interaction="repel"
      scale={0.8} spread={0.75} depth={0.9} speed={0.1} spin={0.6} density={0.8}
      shardSize={0.9} stretch={1} turbulence={1} glow={1.25} edgeSoftness={2} bloom={0.5}
      grain={0.05} chromaticAberration={0} transitionDuration={1}
      interactionRadius={1.5} interactionStrength={0.5} rippleIntensity={0.6} holdToGather={true}
      paused={paused || reduced} onError={()=>setBgError(true)}
    /></div>
    <div className="ambient" aria-hidden="true"/>
    <div className="digital-city" aria-hidden="true">
      <img src={`${assetBase}assets/digital-city-bottom-v1.png`} alt="" draggable="false" />
    </div>
    <section className="visual" aria-label="低空警务飞行器展示">
      <Drone paused={paused} replay={0} reduced={reduced}/>
    </section>
    <LoginPanel paused={paused} reduced={reduced} />
    <button className="animation-toggle" type="button" onClick={()=>setPaused(p=>!p)} disabled={reduced} aria-label={reduced?'系统已启用减少动态效果':paused?'继续动画':'暂停动画'}>
      {paused || reduced ? <Play size={14}/> : <Pause size={14}/>}
      {reduced ? '已减少动态效果' : paused ? '继续动画' : '暂停动画'}
    </button>
    {bgError&&<div className="compatibility" role="status">当前浏览器不支持背景所需的 WebGPU，请使用支持 WebGPU 的新版 Chrome 查看 Aero Shards 交互。</div>}
  </main>;
}
createRoot(document.getElementById('root')).render(<App/>);
