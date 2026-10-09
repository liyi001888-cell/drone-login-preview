# 低空警务登录页 · 动画预览

在线预览：https://liyi001888-cell.github.io/drone-login-preview/

启动：`npm install`，然后 `npm run dev`，访问 http://localhost:4173 。构建：`npm run build`。

使用现有 Matrice 4TD Blender 模型导出的 4.6 MB GLB；页面展示模型已隐藏机身品牌标识。

无人机约 3.1 秒从左侧飞入，随后轻微悬浮，四组旋翼按相邻反向、对角同向的逻辑旋转。页面支持暂停动画。React Bits Aero Shards 保留鼠标排斥，不包含鼠标拖尾。背景需要 WebGPU，无人机需要 WebGL；后台标签页暂停三维更新，遵循系统减少动态效果设置。

登录表单仅演示交互，不连接认证服务、不上传或保存账号密码。桌面浏览器已验证渲染、重播、暂停、密码显隐及提交提示。移动端布局已编写，但尚未完成实际小视口验证。
