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
- `data/normalized/p0-instances.json`：**49 个实例 / 28 个类**（只有解码器"恰好耗尽 payload"时才写入）
- 枚举页、`values.html`（可信值层）均来自上述文件，非手写

## 3. 站点与门禁（本轮实测）
```
node pipeline/inventory.ts          -> p0-inventory.json（462 类, 4723 字段）
node pipeline/normalize_values.ts   -> p0-instances.json（49 实例, 28 类）
node pipeline/site.mjs              -> [site] pages=479 indexable=14 schema(noindex)=462 out=web/dist
node tests/site.test.mjs            -> [site-tests] 22 passed, 0 failed
node .../typescript/bin/tsc --noEmit -p tsconfig.json -> exit 0
git status --porcelain              -> 空
```
站点代码 HEAD `99f4fb9` · 37 commits · 工作区干净。

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
