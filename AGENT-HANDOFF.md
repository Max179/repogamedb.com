# R.E.P.O. Wiki 接手文档

## 项目位置

- Mac 源码：`/Users/carl/Documents/💰money/game-site-factory/repo`
- 构建输出：`web/dist/`（生成目录，不提交）
- 本地预览：`http://127.0.0.1:4186/`
- Windows 原始包：`C:\uTorria\Downloads\REPOv040rar\R.E.P.O.v0.4.0.rar`
- Windows MCP：`http://100.76.52.1:8765/mcp`；当前曾返回 HTTP 503，需要先恢复 Windows `win-mcp-server.js`。

## 当前状态

本地交付层已完成，尚未发布。当前 HEAD 为 `4def01c`，工作树应保持干净。

- 587 个生成页面
- 101 个可索引页面
- 486 个 noindex 页面
- 玩家 Wiki：24 Threats、38 Valuables、28 Gear，共 90 条词条
- 478 个技术实体页保留在 Reference/noindex，不进入 sitemap
- 值层：77 个已精确解码实例
- 游戏版本：`0.4.0`，Mono/Unity

详情见 `reports/local-complete.md`、`reports/status.json`、`reports/media-library-policy.md`。

## 站点结构

- 首页：Hero、搜索、Threats / Valuables / Gear / Extraction、Run plan、Featured threats、Guides、Tools
- `/enemies.html`：24 个威胁目录及详情
- `/valuables.html`：38 个贵重物品目录及详情
- `/gear.html`：28 个装备目录及详情
- `/guide.html`：Scout → Carry → Extract 玩家攻略
- `/search.html`：玩家向搜索
- `/tool.html`：出发清单
- `/sources.html`：来源与技术说明
- `/collection.html`、`/entity/*`、`/values.html`：技术 Reference，默认 noindex

## 视觉与交互约束

这是游戏 Wiki，不是工业官网：

- 深色 R.E.P.O. HUD 风格，黑/灰底、黄色提示色、红色警示色
- Hero 使用本地生成的原创 R.E.P.O. 风格横幅，不冒充游戏截图
- 分类使用 `web/assets/generated/` 内的原创图标
- 首页文字保持短、直接、动作导向；不要重新加入长营销文案
- 移动端搜索框和 CTA 必须纵向排列，不能裁切或粘连
- 所有图片必须本地可加载；禁止 SVG 和损坏纹理进入玩家页
- 任何新图片都要在 `web/assets/media-manifest.json` 记录来源、用途和许可边界

## 图片现状与限制

当前可用素材：

- `web/assets/generated/repo-hero-generated.png`
- `web/assets/generated/icon-threats.png`
- `web/assets/generated/icon-valuables.png`
- `web/assets/generated/icon-gear.png`
- `web/assets/generated/icon-extraction.png`
- `web/assets/hero-repo.jpg`

旧的 Unity 纹理图集、`level.jpg`、异常 SVG 已移除。当前目录页仍会复用少量站壳/官方宣传图，这是临时降级，不要把它们描述成逐条游戏截图。

真正的一对一实体图片需要 Windows 拆包映射恢复后再导入。Fandom/竞品图片只能作为事实和素材线索；没有明确许可时不要静默复制或热链。

## 本地验证命令

在项目根目录执行：

```bash
node pipeline/site.mjs
node pipeline/status.mjs
node tests/site.test.mjs
node tests/player-ui.test.mjs
node tools/preflight.mjs
```

当前预期：`38 passed, 0 failed`、`Player UI: 10 assertions passed`、`10 ok, 0 failed`。

启动预览：

```bash
python3 -m http.server 4186 --directory web/dist
```

浏览器操作统一使用 Ego Browser。截图验收至少检查桌面和 390px 移动端：破图数、SVG 数、横向溢出、搜索和按钮布局。

## 接手后的优先级

1. 恢复 Windows MCP 8765：通过 3090 Harness 的 PowerShell 检查 `Get-NetTCPConnection -LocalPort 8765`、`Get-Process node`，定位并按 Windows 侧启动脚本重启 `win-mcp-server.js`。不要杀掉全部 node 进程。
2. 从 Windows 已验证素材清单建立实体到图片的一对一映射，并更新 `media-manifest.json`；原始游戏包不得复制到 Git。
3. 重新构建并执行全部测试/Preflight，桌面和移动截图验收。
4. 若要发布，再检查 GitHub Actions/Cloudflare 凭据；本地完成不代表已推送或已部署。

## 提交纪律

每次代码、文案或素材映射改动完成后立即本地提交。不要提交 `data/raw/**`、`web/dist/**`、游戏包或 payload 临时文件。不要把 Windows MCP 未恢复误报为素材同步完成。
