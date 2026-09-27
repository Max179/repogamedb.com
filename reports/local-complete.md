# repo (R.E.P.O.) — 本地状态报告（Windows 端）

**状态：site built · tests green · values unknown（尚未 local_complete）** · 2026-09-25 · Windows Harness

## 1. 游戏包（已确认）
- 压缩包：`C:\uTorria\Downloads\REPOv040rar\R.E.P.O.v0.4.0.rar`（0.54 GB, RAR4）
- 解包：`data/raw/R.E.P.O.v0.4.0`（**原始数据留 Windows，不入 Git**），命令 `UnRAR.exe x -o+ -idq` → EXIT=0
- 版本：`semiwork REPO`（`REPO_Data/app.info`）；引擎 Unity；后端 **Mono**（MonoBleedingEdge）

## 2. P0 数据（已确证，来自游戏自身程序集）
- 程序集 `REPO_Data/Managed/Assembly-CSharp.dll`（2.78 MB）
- **1,501 类型 / 19,505 字段 / 436 个 P0 候选类 / 130 个枚举** → `data/normalized/p0-inventory.json`
- 提取器 `pipeline/inventory.ts`；复现 `node --experimental-strip-types pipeline/inventory.ts`
- 例：`ShopKeeper` 118 字段 · `ExtractionPoint` 103 · `EnemyOogly` 77 · `ItemGun` 44 · `Level`(`NarrativeName:string`)
- 真实枚举：`EnemyState` 12（None=0,Spawn=1,Roaming=2,ChaseBegin=3,Chase=4…）· `EnemyType` 5 · `State` 12/8 · `Status` 4

## 3. 站点（本里程碑）
- 生成器 `pipeline/site.mjs`（零依赖，导出 `build()` / `lookupFields()`）
- 构建命令 `node pipeline/site.mjs` → **451 页 / 448 条 sitemap URL**（`web/dist/`，已 gitignore）
- 路由：index（home）/ search / collection / **entity × 436** / enums / guide / tool / sources / about / contact / disclaimer / privacy / terms / 404 / sitemap.xml / robots.txt
- 每页含 canonical + source/version/extractedAt 页脚；未取到的**字段值一律标 unknown**，不编造
- 工具：`tool.html` 字段查找 + `search.html` 客户端检索（无网络请求、无 cookie）

## 4. 测试与构建结果
- `node tests/site.test.mjs` → **13 passed, 0 failed**（正常/边界/无效输入 fixture + 路由/ canonical / 来源行 / sitemap 门禁）
- 测试抓到两个真实缺陷并已修复：① `site.mjs` 少一个引号导致构建失败；② 短名类（`State`/`Status`）slug 冲突 → **348 页 ≠ 436 类**，修复为唯一 slug 后 451 页

## 5. 未完成 / 阻塞
- **实例值 unknown**：容器为 **SerializedFile v22（Unity 6）**，头部布局与参考项目（v21）不同；证据见 `reports/container-probe.txt`
- 未做：typecheck（当前为纯 .mjs 无类型）、多语言、GitHub/Cloudflare 发布（未通过全部门禁，未发布）

## 6. Mac handoff（source-only）
`Desktop\repo`：`pipeline/`（提取器 + 生成器）、`tests/`、`data/normalized/p0-inventory.json`、`reports/`（含 container-probe.txt）。
**游戏包与解包原始数据留在 Windows。** 重建：`node pipeline/inventory.ts && node pipeline/site.mjs && node tests/site.test.mjs`
