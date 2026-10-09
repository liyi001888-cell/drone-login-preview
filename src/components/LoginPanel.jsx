import React, { useEffect, useRef, useState } from 'react';
import './LoginPanel.css';

// Figma 1084:289: preserve the complete 544.4 × 600.8 composition.
export default function LoginPanel() {
  const host = useRef(null);
  const assetBase = import.meta.env.BASE_URL;
  const [scale, setScale] = useState(1);
  const [message, setMessage] = useState('');
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / 544.4));
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);

  return <section ref={host} className="figma-login" aria-labelledby="login-title">
    <div className="figma-login-design" style={{ transform: `scale(${scale})` }}>
      <img className="login-art login-side-left" src={`${assetBase}assets/login/side-left.svg`} alt="" />
      <img className="login-art login-side-right" src={`${assetBase}assets/login/side-right.svg`} alt="" />
      <img className="login-art login-panel-art" src={`${assetBase}assets/login/panel.svg`} alt="" />
      <div className="figma-login-heading">
        <img src={`${assetBase}assets/login/logo.png`} width="32" height="32" alt="" />
        <h2 id="login-title">欢迎登录智飞平台</h2>
      </div>
      <form onSubmit={event => {
        event.preventDefault();
        setMessage('当前为动画预览，尚未连接登录服务。');
      }}>
        <div className="figma-login-field login-account">
          <label htmlFor="username">账号</label>
          <input id="username" name="username" autoComplete="username" placeholder="请输入账号" required />
        </div>
        <div className="figma-login-field login-password">
          <label htmlFor="password">密码</label>
          <input id="password" name="password" type="password" autoComplete="current-password" placeholder="请输入密码" required />
        </div>
        <button className="figma-login-submit" type="submit">立即登录</button>
        <p className="figma-login-message" role="status">{message}</p>
      </form>
    </div>
  </section>;
}
