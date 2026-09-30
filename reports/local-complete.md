# R.E.P.O. 数据库 — 本地完成报告（Windows 端）

**状态：local_complete（本地可交付层：P0 清单 + 站点 + 门禁 + 报告）· 未发布** · Windows Harness

> 说明：local_complete 指"本地交付层"完成，不等于"所有值都提取到了"。值层完成度见 §4，未提取者一律显式 `unknown`。
> 发布（GitHub Actions → Cloudflare）仍未执行：无凭据，且 supermarket-simulator 尚未达 P0（见 §7）。

## 1. 游戏包与边界（已确证）
- 压缩包 `C:\uTorria\Downloads\REPOv040rar\R.E.P.O.v0.4.0.rar`（0.54 GB, RAR4）；解包 `data/raw/R.E.P.O.v0.4.0`（**原始数据留 Windows，不入 Git**），`UnRAR.exe x -o+ -idq` → EXIT=0
- 版本：`semiwork REPO`（`REPO_Data/app.info`）→ inventory 记为 `0.4.0 (folder R.E.P.O.v0.4.0)`；引擎 Unity；后端 **Mono**
- 程序集：`REPO_Data/Managed/Assembly-CSharp.dll`（2.78 MB）

## 2. P0 数据
- `data/normalized/p0-inventory.json`：**462 个 P0 类 / 4,723 字段**，其中 `extracted` 80、`verified-schema` 4,643；每字段带 source / version / confidence
- `data/normalized/p0-instances.json`：**77 个实例**（只有解码器"恰好耗尽 payload"时才写入）
- 枚举页、`values.html`（可信值层）均来自上述文件，非手写

## 3. 站点与门禁（本轮实测）
```
node pipeline/inventory.ts          -> p0-inventory.json（462 类, 4723 字段）
node pipeline/normalize_values.ts   -> p0-instances.json（77 实例）
[site] pages=479 indexable=13 schema(noindex)=463 out=web/dist
node tests/site.test.mjs            -> [site-tests] 38 passed, 0 failed
node .../typescript/bin/tsc --noEmit -p tsconfig.json -> exit 0
git status --porcelain              -> 空
```
站点代码 HEAD `cffcc27` · 75 commits · 工作区干净。

**门禁可失败性（反证，非声明）**：故意破坏构建后两半都失败，随后还原：
- `terms.html` 去掉 canonical → `FAIL every product route carries canonical, an index directive and its source line :: terms.html`（21 passed / 1 failed, exit 1）
- `privacy.html` 不输出 → `FAIL every required route is emitted :: privacy.html` 与 `FAIL every navigation target is a page that exists :: /privacy.html`
- 反证中发现并修复的缺陷：路由缺失时旧检查在缺失文件上 `readFileSync` 直接 **崩溃**（ENOENT、无汇总行）；现已跳过缺失文件，缺路由 = 干净 FAIL。

## 4. 可索引性策略（回应"436 个字段页不算内容"）
- **14 页可索引**（进 sitemap）：`index, collection, enemies, enums, values, search, tool, sources, guide, about, contact, disclaimer, privacy, terms`
- **462 个 `/entity/*` 为 schema 参考页**：带 `<meta name="robots" content="noindex, follow">`，**不进 sitemap.xml**；仍可被站内搜索与链接到达，不是孤页
- 理由：字段清单本身不回答玩家问题，不应与真正回答问题的页面争抢索引
- 每个可索引页都经门禁断言含 canonical + `index, follow` + 页脚来源行

## 5. 数据来源与 unknown 纪律
- 每字段记录 source / version / confidence，并在实体页渲染
- 门禁断言：字段不得在无值的情况下声称 `extracted`
- 未取到的值渲染为 `unknown`；不推断、不填默认、不猜测；解码器无法精确耗尽 payload 的类**整类拒绝**（例如 `AnimationCurve`）
- Unity 6 SerializedFile **v22** 头由自洽性实测（`fileSize` 等于实际长度，3 个游戏 8/8 文件），未假设布局；MonoBehaviour 的 `m_Script` 用原始偏移 20 读取（repo 637/637、tcg 3568/3568 命名成功）

## 6. 交接给 Mac（仅源码）
- 入 Git：`pipeline/`、`tests/`、`web/`（模板/静态）、`data/normalized/p0-inventory.json`、`data/normalized/p0-instances.json`、`reports/`
- 不入 Git（留 Windows）：`data/raw/**`（游戏包）、`web/dist/**`（构建产物）、`*-payloads.json`

## 7. 未完成 / 阻塞（明确声明）
- supermarket-simulator（IL2CPP）：类型表未定位，`data/normalized/p0-schema.json` 的 `typesExtracted: 0` 即失败证据；需要用户在 AssetRipper GUI 里对 `Supermarket Simulator_Data` 执行 Export → Dump (IL2CPP)，或授权安装 Il2CppDumper
- 值层：4723 字段中仅 80 个 `extracted`（28/462 类有实例）；继续扩展需按"实测字段规则"逐个验证，不接受推测布局
- 本地化：**有意只出英文单语言**。不生成 `/zh/`：没有译文就不能有译文页，机器编造的文案属于发明内容。若需第二语言，需先有作者文本，生成器结构已可加前缀与互为 `hreflang`
- 未发布：无 deploy、无域名、无 DNS、无 GSC/Bing 提交、无 AdSense

## 可索引页审计（第 75–76 轮）
对每个可索引页测量体积、表格行数与标题层级；并对 `search.html` 与 `tool.html` 的 `<main>` 正文做 `difflib` 相似度比较：

| 项目 | search 正文 | tool 正文 | 相似度 | 判定 |
| --- | --- | --- | --- | --- |
| repo | 18,173 B | 18,232 B | **0.988** | 两页几乎同质：只差标题与一句话，二者内联同一份字段载荷 |
| tcg-shop | 18,595 B | 18,655 B | **0.988** | 同上 |
| supermarket-simulator | 347,375 B | 312,720 B | 0.005 | 已在第 75 轮修好（tool 改为字段名查找） |

其余可索引页均有实质内容（repo：collection 463 行、enums 928 行、enemies 139 行/9 个 h2、values 77 行/28 个 h2；tcg：collection 219 行、cards 276 行/13 个 h2、enums 289 行、values 25 行）。政策页 2–3 KB 属正常文本量。

**待修（下一轮）**：`tool.html` 与本项目 `search.html` 高度重复，按既定可索引性政策应当**合并或 noindex + 移出 sitemap**（保留页面作为便捷入口，但不与 search 争索引），并新增一条通用门禁：**任意两个可索引页的 `<main>` 正文相似度不得超过 0.9**（该门禁在 supermarket 上可通过、在 repo/tcg 修好前必然失败）。审计脚本见 supermarket 仓库 `pipeline/audit_page_similarity.py`。

## 门禁清单（第 79 轮更新）
- 站点门禁：repo 29 条、tcg 29 条、supermarket 40 条，覆盖路由与导航目标存在、每条产品路由带 canonical + 明确的 robots 指令 + 页脚来源行、sitemap 恰好列出可索引页且不含 404、404 为 noindex、来源可核（sha256 / metadata 版本 / 表几何）、逐字段来源、extracted 必须有值、搜索载荷与游戏类集合一致。
- 发布配置也受门禁：workflow 必须构建并跑测试、部署作业必须有 needs: gate、只能用 secret（仓库内不得出现令牌字面量）、Pages 项目名与输出目录已声明、无 tab 且缩进为 2 的倍数、可移植 typecheck 配置存在。
- 第 75–78 轮新增：noindex/sitemap 政策门禁（重复页与 schema 页不入索引），以及可索引页重复内容门禁（逐字符 40 字符窗口哈希后的包含度 > 0.9 即失败）。
- 该重复内容判据经三次修正才有效，三次失败都记录在测试注释里：字符 shingle 的 Jaccard 实测 0.070、词 6-gram 包含度 0.048（正文是无空白 JSON）、按 10 字符采样的包含度 0.131——都因采样相位错位而失效；改为逐字符哈希后，破坏构建实测 search.html ~ tool.html = 0.93 并触发 FAIL。
- 已证实的重复：search.html 与 tool.html 的最长公共块为 17,284 / 18,173 字符（difflib autojunk=False 比例 0.989），因此 tool.html 保留 URL 但 noindex、不入 sitemap。

## 值层更新（第 102–113 轮）——本条**更正**上文关于值层的描述
- 上文"值层偏薄，原因是本作 P0 类多为引擎类型、payload 无法精确耗尽"**已不再准确**。实测（第 101–108 轮）表明主导原因是**类查找的名字形式不匹配**：dumper 记录的是 MonoScript 的简单类名，而类型表按含命名空间的完整名建索引，且查找只搜了 `assembly.types`（仅 Assembly-CSharp）而没有搜合并表 `byName`。
- 两处修复（第 102、106 轮，均经测量验证后保留）：合并**全部非系统托管程序集**；类查找改在**合并表**上进行，并加"唯一简单名回退、歧义即拒绝"。
- 效果：repo 已发布实例 **49 → 77**；tcg **41 → 260**（约 6 倍）。
- 仍被拒绝的部分（按阶段计数，均可观测）：repo `classNotFound=149`、`walkFailed=624`、`layoutShorter=84`、不支持形态 `generic:148 class:18`；tcg `classNotFound=318`、`walkFailed=5956`、不支持形态 `generic:906 class:420`。
- 第 113 轮尝试支持的 `class` 内联（理论依据：Unity 对 `[Serializable]` 类字段与结构体同样内联）经测量**无增益**，已按事先声明的标准**回退**；仓库中不留无效改动。
- 残留 `classNotFound` 共 28 个不同类名，链观测显示它们是 ScriptableObject 归属偏差与泛型基类未记录两类边缘个案，**拒绝而非猜测**是当前正确行为。

## 玩家向重建与本地收尾（本轮阶段，全部由测试与构建核验）

- 三层内容模型：content/published（唯一可索引）/ reference（技术资料，独立入口 /reference/ + noindex + 不入 sitemap）/ draft（不构建），规则见 content/README.md；
- 已发布词条 3 条、结构化文章 2 篇：文章含目标、适用版本、前置、步骤（每步带依据）、常见错误、相关实体、来源；由 tools/content-gate.mjs 逐条校验；
- 真实映射图片 2 张：tools/extract-images.py 以显式映射表从游戏资源包导出，记录来源包、资产名、尺寸、字节数与 sha256 于 content/images-manifest.json；门禁要求 kind=game 的图片必须与清单一致。其余图片一律为原创示意图并标注"非截图"；
- URL 分类：config/urls.json 逐页 keep/noindex（本阶段 19 keep / 485 noindex / 0 redirect）；门禁保证每个产出页面都被分类、keep 必须在 sitemap、noindex 必须不在 sitemap、redirect 目标必须存在；
- SEO 与移动端：canonical、每页均带 hreflang=en 与 hreflang=x-default（只声明真实存在的语言，无译文不声明）、robots.txt、sitemap 只列 keep 页、404 为 noindex、移动端 smoke（viewport + 无固定像素宽度超 400）；
- 构建与门禁：pages=512 indexable=19，49 条门禁全部通过；tools/deploy-check.mjs 检查本地发布前提与凭据；
- 发布：未发布。本机没有 git remote、没有 gh、没有 Cloudflare/GitHub 凭据，属外部发布阻塞；本地一切可验证项均已通过。
- 内容扩充（本轮）：已发布词条 6 条、结构化文章 2 篇、可索引页 25 个，构建 pages=521 indexable=25，50 条门禁全过；每条词条均带依据事实、示意图（标注非截图）或映射确认的游戏图、相关内链与来源。
- 内容与图片计数（本轮）：已发布词条 8 条、结构化文章 3 篇、来自游戏且映射已确认的图片 5 张（其余为标注"非截图"的自绘示意图）；精确的页面计数以 reports/status.json 为准。
- 计数更新：已发布词条 9 条、结构化文章 4 篇、映射已确认的游戏图片 6 张；其余图片均为标注"非截图"的自绘示意图。
- 计数（第 132 轮）：已发布词条 13 条、结构化文章 4 篇、映射已确认的游戏图片 6 张；其余图片为标注"非截图"的自绘示意图。
- 计数（第 134 轮）：词条 15 条、文章 4 篇、真实映射图 6 张。
- 计数（第 139 轮）：词条 18 条、文章 5 篇、真实映射图 6 张。
- 计数（第 143 轮）：词条 23 条、文章 6 篇、真实映射图 8 张。新增"聊天框什么时候打不开"（Comms，依据 PlayerChatBoxState / ChatState / LockedStartingTruck / LockedDestroySlackers）与"关卡是怎么拼出来的"（Maps，依据 Level / LevelGenerator / LevelState / ModulesNormal1 / ChangeLevelType / ExtractionPoint）两条词条，以及指南《在分队之前先读一张图》。构建 pages=569 indexable=50，50 条门禁全过，tsc exit 0。
- 计数（第 142 轮）：词条 21 条、文章 5 篇、真实映射图 8 张。新增词条"外观与代币机"（新栏目 Cosmetics），依据 CosmeticShopMachine / CosmeticShopMachineAnimator / CosmeticShopMachineConfetti / CosmeticAsset / CosmeticHideCondition / PlayerAvatarMenu 等已核验标识符；并从 resources.assets 映射确认 2 张游戏原图（CosmeticShopToken_Basecolor_Rare、Witch hat_Albedo，按最长边 1024 压到 15–26 KB，清单记录写入后的实际尺寸/字节/sha256）。构建 pages=564 indexable=47，50 条门禁全过，tsc exit 0，发布仍为外部凭据阻塞。

