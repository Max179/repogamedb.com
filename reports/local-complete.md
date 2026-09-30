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
- 计数（第 147 轮）：词条 28 条、文章 10 篇、真实映射图 13 张。新增"会反击的贵重物品"（Valuables，依据 Trap / trapTriggered / triggerOnTimer / trapActivateRarityLevel / GumballValuable / TrafficLightValuable / BlenderValuable / ItemValuableBox）一条词条，以及指南《拿到可能是陷阱的贵重物品》；并从 resources.assets 映射确认扭蛋机贴图。构建 pages=588 indexable=59，50 条门禁全过，tsc exit 0。
- 计数（第 146 轮）：词条 27 条、文章 9 篇、真实映射图 12 张。新增"卡车与一趟的收尾"（Extraction，依据 TruckDoor / TruckScreenPage 的 Start·EndNotEnough·EndEnough·AllPlayersInTruck / TruckHealer / ExtractionPointTracking）一条词条，以及指南《按自己的节奏收尾》；并从 resources.assets 映射确认卡车治疗器贴图。构建 pages=584 indexable=57，50 条门禁全过，tsc exit 0。
- 计数（第 145 轮）：词条 26 条、文章 8 篇、真实映射图 11 张。新增"你的角色与它出现的地方"（Cosmetics，依据 PlayerAvatarMenu 的 worldAvatar / iconMakerAvatar / expressionAvatar 三份模型、PlayerAvatarLeftArm / RightArm / Eyelids、CosmeticHideCondition）一条词条，以及指南《给你的角色挑一件真正合适的》；并从 sharedassets0.assets 映射确认 PlayerAvatar_Albedo。构建 pages=580 indexable=55，50 条门禁全过，tsc exit 0。
- 计数（第 144 轮）：词条 25 条、文章 7 篇、真实映射图 10 张。新增"把怪物电晕而不是打死"（Weapons，依据 ItemStunBaton / ItemGrenadeStun / ItemMineStun / EnemyStateStunned / MineType）与"推车与加速板"（Physics，依据 ItemVehicle / maxSpeedKmh / maxTiltAngle / hurtColliderSmall / ItemVehicleBoostPad）两条词条，以及指南《把眩晕当成窗口来用》；并从 resources.assets 映射确认 2 张游戏原图（眩晕电棍、手推车）。构建 pages=576 indexable=53，50 条门禁全过，tsc exit 0。
- 计数（第 143 轮）：词条 23 条、文章 6 篇、真实映射图 8 张。新增"聊天框什么时候打不开"（Comms，依据 PlayerChatBoxState / ChatState / LockedStartingTruck / LockedDestroySlackers）与"关卡是怎么拼出来的"（Maps，依据 Level / LevelGenerator / LevelState / ModulesNormal1 / ChangeLevelType / ExtractionPoint）两条词条，以及指南《在分队之前先读一张图》。构建 pages=569 indexable=50，50 条门禁全过，tsc exit 0。
- 计数（第 142 轮）：词条 21 条、文章 5 篇、真实映射图 8 张。新增词条"外观与代币机"（新栏目 Cosmetics），依据 CosmeticShopMachine / CosmeticShopMachineAnimator / CosmeticShopMachineConfetti / CosmeticAsset / CosmeticHideCondition / PlayerAvatarMenu 等已核验标识符；并从 resources.assets 映射确认 2 张游戏原图（CosmeticShopToken_Basecolor_Rare、Witch hat_Albedo，按最长边 1024 压到 15–26 KB，清单记录写入后的实际尺寸/字节/sha256）。构建 pages=564 indexable=47，50 条门禁全过，tsc exit 0，发布仍为外部凭据阻塞。
- 计数（第 148 轮，图片覆盖）：词条 28 条，其中 26 条带真实游戏图片（93%），2 条仅有原创示意图并已降级；images-manifest 记录 29 条，全部被词条引用、无未使用记录、无缺失记录。
- 图片纪律：每条 published 词条在 `imageTier` 中声明自己的图片等级（`game-image` 或 `diagram-only`）；门禁 tools/content-gate.mjs 校验二者与实际图片一致，且 diagram-only 词条的示意图必须写明"非游戏截图"；tools/image-coverage.mjs 生成 reports/image-coverage.md，逐条列出图片等级以及真实图片的来源包、资产名、尺寸、字节数与 sha256（前 16 位），并在出现"已用图无清单记录"或"清单记录无人使用"时以非 0 退出。词条页在正文顶部明确写出"Illustrated with an image taken from the game"或"Illustrated with an original diagram only"，后者同时从精选列表中移出、在栏目页标注"(original diagram only)"。
- 站点规模（第 148 轮）：pages=604 indexable=59，门禁 52 条全过，tsc exit 0。
- 图片覆盖（第 149 轮继续追图）：词条 28 条，其中 28 条带真实游戏图片（100%），0 条为已标注的 diagram-only；images-manifest 记录 31 条，无未使用、无缺失。仍缺真实图片的词条：（无）——已在页面顶部标注"仅为原创示意图/非游戏截图"并移出精选列表。站点规模：pages=606 indexable=59，门禁 52 条全过，tsc exit 0。
- 计数（第 149 轮内容）：词条 29 条、文章 11 篇、真实映射图 29 条（100%），diagram-only 0 条；pages=610 indexable=61，门禁 52 条全过，tsc exit 0。
- 计数（第 151 轮）：词条 30 条、文章 12 篇、真实映射图 30 条（100%）、diagram-only 0 条；images-manifest 33 条，无未使用、无缺失。pages=613 indexable=62，门禁 52 条全过，tsc exit 0。
- 计数（第 152 轮）：词条 31 条、文章 13 篇、真实映射图 31 条（100%）、diagram-only 0 条；images-manifest 34 条，无未使用、无缺失。pages=617 indexable=64，门禁 52 条全过，tsc exit 0。
- 计数（第 153 轮）：词条 33 条、文章 14 篇、真实映射图 33 条（100%）、diagram-only 0 条；images-manifest 36 条，无未使用、无缺失。pages=625 indexable=68，门禁 52 条全过，tsc exit 0。
- 计数（第 154 轮）：词条 34 条、文章 15 篇、真实映射图 34 条（100%）、diagram-only 0 条；images-manifest 37 条，无未使用、无缺失。pages=628 indexable=69，门禁 52 条全过，tsc exit 0。
- 计数（第 155 轮）：词条 35 条、文章 16 篇、真实映射图 35 条（100%）、diagram-only 0 条；images-manifest 38 条，无未使用、无缺失。pages=632 indexable=71，门禁 52 条全过，tsc exit 0。
- 计数（第 156 轮）：词条 36 条、文章 17 篇、真实映射图 36 条（100%）、diagram-only 0 条；images-manifest 39 条，无未使用、无缺失。pages=637 indexable=74，门禁 52 条全过，tsc exit 0。
- 计数（第 157 轮）：词条 37 条、文章 18 篇、真实映射图 37 条（100%）、diagram-only 0 条；images-manifest 40 条，无未使用、无缺失。pages=641 indexable=76，门禁 52 条全过，tsc exit 0。
- 计数（第 158 轮）：词条 38 条、文章 18 篇、真实映射图 38 条（100%）、diagram-only 0 条；images-manifest 41 条，无未使用、无缺失。pages=645 indexable=78，门禁 52 条全过，tsc exit 0。
- 计数（第 159 轮）：词条 39 条、文章 19 篇、真实映射图 39 条（100%）、diagram-only 0 条；images-manifest 42 条，无未使用、无缺失。pages=648 indexable=79，门禁 52 条全过，tsc exit 0。
- 计数（第 160 轮）：词条 40 条、文章 20 篇、真实映射图 40 条（100%）、diagram-only 0 条；images-manifest 43 条，无未使用、无缺失。pages=653 indexable=82，门禁 52 条全过，tsc exit 0。
- 计数（第 161 轮）：词条 42 条、文章 21 篇、真实映射图 42 条（100%）、diagram-only 0 条；images-manifest 45 条，无未使用、无缺失。pages=659 indexable=84，门禁 52 条全过，tsc exit 0。
- 计数（第 162 轮）：词条 44 条、文章 22 篇、真实映射图 44 条（100%）、diagram-only 0 条；images-manifest 47 条，无未使用、无缺失。pages=666 indexable=87，门禁 52 条全过，tsc exit 0。
- 计数（第 163 轮）：词条 46 条、文章 24 篇、真实映射图 46 条（100%）、diagram-only 0 条；images-manifest 49 条，无未使用、无缺失。pages=673 indexable=90，门禁 52 条全过，tsc exit 0。
- 计数（第 164 轮）：词条 47 条、文章 25 篇、真实映射图 47 条（100%）、diagram-only 0 条；images-manifest 50 条，无未使用、无缺失。pages=677 indexable=92，门禁 52 条全过，tsc exit 0。
- 计数（第 165 轮）：词条 48 条、文章 26 篇、真实映射图 48 条（100%）、diagram-only 0 条；images-manifest 51 条，无未使用、无缺失。pages=681 indexable=94，tsc exit 0。
- 计数（第 166 轮）：词条 49 条、文章 27 篇、真实映射图 49 条（100%）、diagram-only 0 条；images-manifest 52 条，无未使用、无缺失。pages=685 indexable=96，tsc exit 0。
- 计数（第 167 轮）：词条 49 条、文章 28 篇、真实映射图 49 条（100%）、diagram-only 0 条；images-manifest 52 条，无未使用、无缺失。pages=686 indexable=97，tsc exit 0。
- 覆盖矩阵（第 168 轮）：新增 config/coverage.json（本作目标栏目 21 个）与 tools/coverage.mjs，逐栏统计已发布/草稿/技术页数量并生成 reports/coverage-report.md；同时把覆盖率与质量（重复标题、重复摘要、占位词、摘要过短）并入 tools/preflight.mjs 门禁，低于 config/coverage.json 的 floor 即失败。当前已覆盖 17/21 栏，未覆盖栏目：combos、faq、glossary、versions。技术性参考页与未证实内容分别留在 reference/draft 分层，不进入构建与索引。

- 覆盖矩阵（第 169 轮，本作补栏）：新增 published 词条 3 条——which-version-this-site-documents（versions 栏）、glossary-of-terms（glossary 栏）、questions-players-ask（faq 栏），均为 diagram-only 并带原创示意图；combos 栏写入 content/draft/item-combinations.json，理由为本作未发现任何合成/配方系统（已检索 type/data/option 中的 combine、craft、recipe、mix、merge、ingredient）。config/coverage.json 三栏指向新词条，floor 由 17 提升至 20。当前 21 栏已覆盖 20 栏，唯一缺口为 combos（已归档为草稿并写明检索范围）。词条 52 条、文章 28 篇、真实映射图 52 条、diagram-only 3 条；pages=696 indexable=104；门禁 52 条全过、content-gate 0 违规、coverage qualityFailures=0、tsc exit 0、preflight 10/11（唯一失败项为提交前工作树未清空）。

- 真实图片（第 172 轮，本作）：新增词条 the-wizard-valuables（valuables 栏 5→6 条），依据 WizardBroomValuable、ValuableWizardTimeGlass、ValuableWizardStaff 三个独立珍贵物类型，以及 Valuable Wizard Cube of Knowledge / Goblin Head / Sword / Power Crystal 与 tiny pack_Wizard tiny valuables 等游戏自带资产名写成；配 3 张游戏内实图（时之沙漏、知识立方、巫师之剑的颜色贴图，均为资源包内的 BaseColor，已逐张查看确认为对应材质贴图并在 alt 与清单 note 中写明是“颜色贴图”而非物件照片）。词条 53 条、文章 28 篇、游戏内实图词条 50 条、diagram-only 3 条；images-manifest 55 条，无未使用、无缺失；pages=701 indexable=105；门禁 52 条全过、content-gate 0 违规、coverage 20/21（combos 为已归档草稿）、tsc exit 0、preflight 10/11（唯一失败项为提交前工作树未清空）。

- 真实图片（第 176 轮，本作，events 栏 1→2 条）：新增词条 mines-traps-and-lasers，依据 MineType/ItemMine/ItemMineStun/ItemMineTrigger、TrapActivateRarityLevel、Trap/TrapTV/TrapDone、MuseumLaserState/MuseumLaserLogic、EnemyCeilingEye/EnemyCeilingEyeAnim/CeilingEyeLine、ParticleScriptExplosion/soundExplosionTell 写成；配 2 张游戏内实图（Explosive mine 与 Stun trap 的 BaseColor 材质，均逐张查看；期间检查发现名为 “Wall Mine” 的贴图其实是石墙材质，已丢弃不用，避免错误映射），另配 1 张原创示意图。events 栏 status 同步更新为“无独立事件系统；关卡固定装置（博物馆、地雷、陷阱、激光）在本栏与 maps 栏记录”。词条 54 条、文章 28 篇、游戏内实图词条 51 条、diagram-only 3 条；images-manifest 57 条，无未使用、无缺失；pages=706 indexable=107；门禁 52 条全过、content-gate 0 违规、coverage 20/21（combos 为已归档草稿）、tsc exit 0、preflight 10/11（唯一失败项为提交前工作树未清空）。

- 图片纪律否决（第 179 轮，本作）：原本打算用 Spectate Head Graphic 系列给联机词条配图，导出查看后确认它们只是头像的分层碎片（Base 是两个黑圆点、Eye Mask 全空白），完全不能说明任何东西，于是删除两条映射与文件、重新导出清单（回到 57 条记录、unusedRecords=0），改为不使用假图。
- 计数（第 179 轮，本作，coop 栏 2→3 条）：新增词条 the-lobby-and-spectating，依据 LobbyMenu/Lobby/savedLobbyTypes、MainMenuGameModeState、MenuPlayerListed/MenuElementHover/MenuElementAnimations、PhotonView/maxPlayersPhoton、VoiceBox/Photon.Voice.Unity、ExtractReady/OpenToExtractReady/localizedExtractionReady、isSpectate 写成；因不存在能说明该系统的真实游戏图，本词条按站点规则标记为 diagram-only 并在页面上写明“仅为原创示意图/非游戏截图”、从精选列表移出。词条 55 条、文章 28 篇、游戏内实图词条 51 条、diagram-only 4 条；images-manifest 57 条，无未使用、无缺失；pages=709 indexable=109；门禁 52 条全过（含“至少一半词条带真实游戏图”一条，51/55 通过）、content-gate 0 违规、coverage 20/21（combos 为已归档草稿）、tsc exit 0、preflight 10/11（唯一失败项为提交前工作树未清空）。

- 真实图片（第 181 轮，本作，medical 栏 2→3 条）：新增词条 healing-at-the-truck，依据 TruckHealer、fullHealParticle/fullHealSmokeParticle/failedHealParticles、playerUpgradeHealth/localizedUpgradeHealth/playerUpgradeStamina/localizedUpgradeStamina、potentialItemHealthPacks/itemHealthPacksAmount、EnemyTickHealAura 写成（刻意避开 health-and-recovery 已覆盖的 PlayerHealth/HealthUI/ItemHealthPack，避免重复）；配 1 张游戏内实图（Truck Healer_DefaultMaterial_BaseColor，查看确认为带绿色治疗元件与警示条纹的装置材质），另配 1 张原创示意图。词条 56 条、文章 28 篇、游戏内实图词条 52 条、diagram-only 4 条；images-manifest 58 条，无未使用、无缺失；pages=713 indexable=111；门禁 52 条全过、content-gate 0 违规、coverage 20/21（combos 为已归档草稿）、tsc exit 0、preflight 10/11（唯一失败项为提交前工作树未清空）。

- 缺口扫描＋真实图片（第 182 轮，本作）：先用临时脚本对比 data/normalized/p0-inventory.json 的 478 个类型与已发布词条引用的标识符，找出 264 个尚未被任何词条提到的类型（大量具名怪物 Enemy*、具名珍贵物 *Valuable、HUD 类等），据此选定尚未覆盖的具名怪物。新增词条 the-floater（enemies 栏目 7→8 条，覆盖层数量不变），事实来自该类的实际字段：EnemyFloater/EnemyFloaterAnim、springHead/springHeadTarget/springLegL/springLegR/springArmL/springArmR、springSpeedMultiplier/springDampingMultiplier、FloaterAttackState/currentState/stateTimer、sfxChargeAttackStart/sfxDelayAttackLocal/sfxAttackUpLocal/sfxAttackDownLocal、sfxHurt/sfxDeath/sfxStunnedLoop、particleDeathImpact/particleDeathBitsFar/particleDeathBitsShort/particleDeathSmoke、FloaterSphereEffectState；配 1 张游戏内实图（enemy floater_Material_BaseColor，查看确认为该怪物的颜色贴图，可见双头与粉色组织），另配 1 张原创示意图。词条 57 条、文章 28 篇、游戏内实图词条 53 条、diagram-only 4 条；images-manifest 59 条，无未使用、无缺失；pages=716 indexable=112；门禁 52 条全过、content-gate 0 违规、coverage 20/21（combos 为已归档草稿）、tsc exit 0、preflight 10/11（唯一失败项为提交前工作树未清空）。

- 缺口扫描＋词条（第 185 轮，本作，interface 栏 2→3 条）：用同一缺口脚本复查后新增词条 the-readouts-you-play-by，依据 HUD、HealthUI/HaulUI/GoalUI/ItemInfoUI、ItemInfoExtraUI、ValueScreen、ShopCostUI/ShopIncreaseUI、LevelUI/StatsUI，以及 PlayerAvatar_Health-bar_Shadow、Icon_Player 两个游戏自带 UI 贴图名写成；本作没有可用的 HUD 图标资源（仅有一条血条阴影贴图与 36x39 的玩家小图标，都不适合作为说明图），故按规则标记 diagram-only 并在页面写明“仅为原创示意图/非游戏截图”。同轮复查了 combos 栏的草稿是否也可能写错：检索 combi/combine/craft/recipe/ingredient/merge/mix 后确认本作**确实没有**合成系统（只命中 EnemyBangFuse 与 MixerEffects 这两个无关名称），故该草稿结论维持不变。词条 58 条、文章 28 篇、游戏内实图词条 53 条、diagram-only 5 条；images-manifest 59 条，无未使用、无缺失；pages=718 indexable=113；门禁 52 条全过、content-gate 0 违规、coverage 20/21（combos 为已归档草稿）、tsc exit 0、preflight 10/11（唯一失败项为提交前工作树未清空）。

- 复查既有结论＋真实图片（第 186 轮，本作，ammo 栏 2→3 条）：用与 supermarket 相同的办法复查 ammo 栏 status“本作没有独立弹药道具”是否准确——检索 ammo/bullet/magazine/clip/shell 后确认：**确实没有弹药道具类**（无 magazine/clip/shell），但存在 `ItemGunBullet` 子弹对象与 `OutOfAmmo`/`onStateOutOfAmmoStart|Update|FixedUpdate` 空仓状态、`soundNoAmmoClick` 空响音效，故原 status 说法不完整。新增词条 running-a-gun-dry，依据 ItemGunBullet、OutOfAmmo/onStateOutOfAmmo*、soundNoAmmoClick、hasBuildUp/buildUpTime/shootTime/hasOneShot、numberOfBullets/gunRandomSpread/gunRange、particleOverHeat/heatLatchCurve/soundReload/soundReload2、batteryDrain/batteryDrainFullBar/batteryDrainFullBars 写成；配 1 张游戏内实图（shotgun_DefaultMaterial_BaseColor，本作此前未使用的枪械贴图，已查看），另配 1 张原创示意图；ammo 栏 status 同步更正为“枪有子弹对象与空仓状态，无独立弹药道具，弹药与电量是两种资源”。词条 59 条、文章 28 篇、游戏内实图词条 54 条、diagram-only 5 条；images-manifest 60 条，无未使用、无缺失；pages=722 indexable=115；门禁 52 条全过、content-gate 0 违规、coverage 20/21（combos 为已归档草稿）、tsc exit 0、preflight 10/11（唯一失败项为提交前工作树未清空）。

- 缺口扫描＋字段级事实＋真实图片（第 187 轮，本作，items 栏 11→12 条）：用脚本筛出 Item* 类型中 12 个未被任何词条提到的类，新增词条 items-you-switch-carry-or-unlock，事实取自字段：ItemState/ItemManager/ItemAttributes、ItemToggle 的 toggleState/playSound/autoTurnOffWhenEquipped/onToggle、ItemLight 的 itemLight/lightIntensityCurve/alwaysActive、ItemVolume 的 itemVolume/volumes/itemSecretShopType、ItemEquippable/ItemEquipCube/isObstructed、ItemShockwave 的 particleSystemWave/Sparks/Lightning 与 cameraShake、ItemWalkieBox 的 walkie1SpawnPoint/walkie2SpawnPoint/walkieTalkieItem/walkieMaterials、ItemDeactivatedUntilLevel；配 2 张游戏内实图（Walkie_Basecolor RED 对讲机、shockwave grenade_DefaultMaterial_BaseColor 冲击波手雷，均查看确认），另配 1 张原创示意图。词条 60 条、文章 28 篇、游戏内实图词条 55 条、diagram-only 5 条；images-manifest 62 条，无未使用、无缺失；pages=726 indexable=116；门禁 52 条全过、content-gate 0 违规、coverage 20/21（combos 为已归档草稿）、tsc exit 0、preflight 10/11（唯一失败项为提交前工作树未清空）。

- 缺口扫描＋字段级事实（第 188 轮，本作，新增 2 条）：①the-beamer（enemies 栏，8→9 条），事实取自 EnemyBeamer/EnemyBeamerAnim 与字段 currentState/stateTimer、laser/laserStartTransform/laserRayTransform、aimVerticalTransform/aimHorizontalCurve/aimHorizontalSpread/aimHorizontalSpeed、horizontalRotationSpring、springNose01-03（含 target/source）、noseEmission、particleDeathSmoke/Body/Nose/Hat、particleBottomSmoke、soundFootstepSmall/Big/Huge、soundMoveShort/Long、soundStunIntro；配 1 张游戏内实图（Beamer_Albedo，已查看），另配 1 张原创示意图。②how-a-run-is-scored（interface 栏，3→4 条），事实取自 ProgressionManager 与字段 roundPointsHauling/Scouting/Combat/Support、roundPointsTotalHaul、roundPointsBonusAllSurvived/NoDeaths、penaltyDeath——这是本作此前未记录的“跑分方式”（搬运/侦察/战斗/支援四类＋全员存活与无死亡加成＋死亡罚分）；本作无对应美术资源，按规则标记 diagram-only。词条 62 条、文章 28 篇、游戏内实图词条 56 条、diagram-only 6 条；images-manifest 63 条，无未使用、无缺失；pages=731 indexable=118；门禁 52 条全过、content-gate 0 违规、coverage 20/21（combos 为已归档草稿）、tsc exit 0、preflight 10/11（唯一失败项为提交前工作树未清空）。

- 缺口扫描＋字段级事实（第 189 轮，本作，新增 2 条）：①the-tricycle-rider（enemies 栏 9→10 条），事实取自 EnemyTricycle 的 44 个已写字段：teleportTransform/animationCurveTeleportOut|In/particlesTeleportOut|In、bikeRiderTransforms/visuals、handMeshes(Attached)/footMeshes(Attached)、jawTransform/talkingAudioSources、audioBell/BellGlobal/FinalBellBuildup/Idle/Move/Attack/AttackLoop/AttackOutro/Death/DeathBikeCrash、audioWheelRattle/WheelSqueak/Hurt/HitPlayer/Tell/TellGlobal、audioRiderStunnedLoop/IdleBreaker/RiderGlitchIn|Out、stateTimer/stateTimerMax；配 1 张游戏内实图（tricycle_bike_Albedo，已查看），另配 1 张原创示意图。②the-music-of-a-level（maps 栏 4→5 条），事实取自 MusicManager 的 MusicMixerOn/Off/ScareOnly 与 MusicEnemyNear/Sighting/Catch、LevelMusic 的 fadeCurve/cooldownTimeMin|Max、LevelAmbience 的 loopClip/loopVolume/breakers、LevelAmbienceBreaker 的 name/sound/volume；本作无对应美术资源，按规则标记 diagram-only。词条 64 条、文章 28 篇、游戏内实图词条 57 条、diagram-only 7 条；images-manifest 64 条，无未使用、无缺失；pages=736 indexable=120；门禁 52 条全过、content-gate 0 违规、coverage 20/21（combos 为已归档草稿）、tsc exit 0、preflight 10/11（唯一失败项为提交前工作树未清空）。

- 缺口扫描＋字段级事实＋真实图片（第 190 轮，本作，valuables 栏 6→7 条）：新增词条 valuables-that-are-also-tools，事实取自字段：FlamethrowerValuable 的 fuelTimer/triggerMesh/semiFlames/soundFlameEmpty、FireExtinguisherValuable 的同类部件、JackhammerValuable 的 soundStart/End/Loop/ImpactLoop 与 dirtParticles/dustParticles、IceSawValuable（继承 Trap）的 trapTriggered/trapActive/triggerOnTimer/trapActivateRarityLevel 与 blade/bladeCurve/bladeSpeed/sparkParticles/hurtCollider/sawTimer、BarrelValuable、MusicalValuableLogic 的 musicKeys/numberOfOctaves/hasPitchShift/pitchShiftAmount/volume、CrystalBallValuable 的 soundLoop/aimTransform/cameraPositionTransform；配 2 张游戏内实图（new valaubles_Valuable Arctic Jackhammer_BaseColor、new valaubles_Arctic Valuable Fire Extinguisher_BaseColor——资产名本身就把二者标记为珍贵物，灭火器贴图可清楚看到压力表与使用说明，均已查看），另配 1 张原创示意图。词条 65 条、文章 28 篇、游戏内实图词条 58 条、diagram-only 7 条；images-manifest 66 条，无未使用、无缺失；pages=740 indexable=121；门禁 52 条全过、content-gate 0 违规、coverage 20/21（combos 为已归档草稿）、tsc exit 0、preflight 10/11（唯一失败项为提交前工作树未清空）。

- 缺口扫描＋字段级事实（第 191 轮，本作，新增 2 条）：①the-hunter（enemies 栏 10→11 条），事实取自 EnemyHunter 字段：enemyHunterAnim/currentState/enemyHunterAlwaysActive、gunAimTransform/gunTipTransform/verticalAimTransform、horizontalAimSpring/verticalAimSpring、investigateRayTransform/lineRenderer/lineRendererWidthCurve、shootEffects/hitEffects/deathEffects 及其 transform、soundShoot/ShootGlobal/Hurt/Hit/Death、hurtCollider；配 1 张游戏内实图（Hunter Material Albedo，本作此前未使用，已查看），另配 1 张原创示意图。②how-a-monster-sees-you（behaviour 栏 7→8 条），事实取自 EnemyVision 字段：VisionTransform/VisionDistance、VisionDistanceClose/VisionDistanceCloseCrouch、VisionDotStanding/Crouch/Crawl、VisionsToTrigger/Crouch/Crawl、PhysObjectVision/PhysObjectVisionRadiusOverride/PhysObjectVisionDot、VisionsTriggered/VisionTriggered/onVisionTriggered——这是本作此前没有记录的“怪物如何看见玩家（站/蹲/爬三种姿势分别有视距与目击计数）”机制；本作无对应美术资源，按规则标记 diagram-only。词条 67 条、文章 28 篇、游戏内实图词条 59 条、diagram-only 8 条；images-manifest 67 条，无未使用、无缺失；pages=746 indexable=124；门禁 52 条全过、content-gate 0 违规、coverage 20/21（combos 为已归档草稿）、tsc exit 0、preflight 10/11（唯一失败项为提交前工作树未清空）。

- 缺口扫描＋字段级事实＋真实图片（第 192 轮，本作，enemies 栏 11→13 条，新增 2 条）：①the-shadow，事实取自 EnemyShadow 的 45 个已写字段：springPoseAnimator 与 torsoBend/headBend/neckBend/rightArmBend/leftArmBend、leftEyePivot/rightEyePivot/leftWristPivot/rightWristPivot/leftArmPoint/rightArmPoint/leftHandDownPos/rightHandDownPos、headTurnSpeed/eyeTurnSpeed、slapAnimationCurve/handArea/handAreaUnder/handAreaUnderSlapReady、visionTransform、topCollider/crouchColliders/shootingColliders/collisionCheckers/hurtCollider/hurtColliderWave、hairSpring1-4（各带 pivot/target）、horizontalRotationSpring、leftHandAnimator/rightHandAnimator、screenVeinEffect；配 shadow_DefaultMaterial_BaseColor 实图（此前未使用，已查看）。②the-balloon-monster，事实取自 EnemyBirthdayBoy 的 23 个已写字段：maxBalloons/balloonPrefab/balloonSpawnPoints/balloons、blowing/animatingBalloon、balloonPopEffect、balloonCollisionChecker/standUpCollisionChecker/doorCollisionChecker、BBcollider/colliderSmall/visualMesh、headPivot/leftEyePivot/rightEyePivot/horizontalRotationSpring、playerTarget/currentState/enemyParent；配 BirthdayBoyBaseColor 实图（此前未使用，已查看）。两条均另配原创示意图。词条 69 条、文章 28 篇、游戏内实图词条 61 条、diagram-only 8 条；images-manifest 69 条，无未使用、无缺失；pages=752 indexable=126；门禁 52 条全过、content-gate 0 违规、coverage 20/21（combos 为已归档草稿）、tsc exit 0、preflight 10/11（唯一失败项为提交前工作树未清空）。

- 缺口扫描＋字段级事实＋真实图片（第 193 轮，本作，enemies 栏 13→15 条，新增 2 条）：①the-runner，事实取自 EnemyRunner 的 13 个已写字段：animator/currentState/headSpring/headSpringSource/headSpringTarget、rotationSpring、hayParticlesBig/hayParticlesSmall、bitsParticlesFar/bitsParticlesShort、feetTransform/hurtCollider；配 Runner_substance01_Albedo 实图（此前未使用，已查看）。②the-thin-man，事实取自 EnemyThinMan 的 13 个已写字段：tentacleR1-3/tentacleL1-3/extendedTentacles、tentacleLerp、head/anim、otherEnemies、rb/currentState；配 Thin Man_Albedo 实图（此前未使用；该贴图清楚显示**两张面孔**——一张亮眼张口、一张空白，已在 alt 与正文中如实描述）。两条均另配原创示意图。词条 71 条、文章 28 篇、游戏内实图词条 63 条、diagram-only 8 条；images-manifest 71 条，无未使用、无缺失；pages=758 indexable=128；门禁 52 条全过、content-gate 0 违规、coverage 20/21（combos 为已归档草稿）、tsc exit 0、preflight 10/11（唯一失败项为提交前工作树未清空）。

- 缺口扫描＋字段级事实＋真实图片（第 194 轮，本作，enemies 栏 15→16 条）：新增词条 the-upscream，事实取自 EnemyUpscream 的 18 个已写字段：headSpring/headTransform/headIdleTransform、eyeLeftSpring/eyeLeftTransform/eyeLeftIdle/eyeLeftTarget 与 eyeRight 同组、currentState/previousState、idleBreakTimeMin/idleBreakTimeMax、upscreamAnim/deathEffects/visionTransform；配 upscream exp_Upscream_Legs_BaseColor 实图（此前未使用，已查看），另配 1 张原创示意图。词条 72 条、文章 28 篇、游戏内实图词条 64 条、diagram-only 8 条；images-manifest 72 条，无未使用、无缺失；pages=761 indexable=129；门禁 52 条全过、content-gate 0 违规、coverage 20/21（combos 为已归档草稿）、tsc exit 0、preflight 10/11（唯一失败项为提交前工作树未清空）。

- 缺口扫描＋字段级事实＋真实图片（第 195 轮，本作，enemies 栏 16→17 条）：新增词条 the-elsa，事实取自 EnemyElsa 的 45 个已写字段：headSpring/headTransform/headTransformTarget、tailFlyingPivotSpring 与 tail01/02Spring（各带 transform/target）、ear01Spring/ear01TransformL、angryCurve、currentState/stateTimer/visualsTransform/hurtCollider、deathParticlesSmall/deathParticlesBig、duckBucketCollider；配 Elsa_Albedo 实图（此前未使用，已查看），另配 1 张原创示意图。词条 73 条、文章 28 篇、游戏内实图词条 65 条、diagram-only 8 条；images-manifest 73 条，无未使用、无缺失；pages=764 indexable=130；门禁 52 条全过、content-gate 0 违规、coverage 20/21（combos 为已归档草稿）、tsc exit 0、preflight 10/11（唯一失败项为提交前工作树未清空）。

- 缺口扫描＋字段级事实＋真实图片（第 196 轮，本作，enemies 栏 17→18 条）：新增词条 the-heart-hugger，事实取自 EnemyHeartHugger 的 69 个已写字段（declared 134）：normalMesh1/2 与 horrorMesh1/2（两套形体）、cuteMeshLeft/RightClosedMouth 与 OpenMouth（四片嘴）、growAnimationCurve/popAwayMeshesCurve/popBackMeshesCurve/biteCurve/biteScaleBounceCurve、springLimbs/vineTransforms/headSegment1|2TargetTransform/headCenterTransform、breatheScaleParent1|2/holeScaleParent1|2、soundIdleBreaker01-03 与 soundAggroBreaker01-03、soundGrow/Degrow/ChompThrust/ChompBite/GasLoop/AggroLoop/Scare/Hurt/Death、soundEnchantedVO/Loop、gasChecker/gasParticles/headLight、particlesShatteredDream/Hearts/Death；配 HeartHuggerBaseColor 实图（此前未使用，已查看），另配 1 张原创示意图。词条 74 条、文章 28 篇、游戏内实图词条 66 条、diagram-only 8 条；images-manifest 74 条，无未使用、无缺失；pages=767 indexable=131；门禁 52 条全过、content-gate 0 违规、coverage 20/21（combos 为已归档草稿）、tsc exit 0、preflight 10/11（唯一失败项为提交前工作树未清空）。
