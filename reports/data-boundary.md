# R.E.P.O. — 数据边界报告（Windows 端）

**记录时间：** 2026-09-30（修正 2026-09-25 的过期结论） · **记录者：** Windows Harness

> **本文件取代 2026-09-25 版本。** 旧版结论「未找到游戏包 → blocked_on_user」已失效，
> 游戏包此后已在本机到位。保留此说明是为了让 Mac 侧知道边界状态发生过变化。

---

## 一、当前状态：**已解除（resolved）**

旧版阻塞已消失：本机现在存在 R.E.P.O. 的游戏包。

| 项 | 值 |
|---|---|
| 位置 | `data/raw/R.E.P.O.v0.4.0/` |
| 可执行 | `REPO/REPO.exe` |
| 数据目录 | `REPO/REPO_Data/` |
| 总体积 | **1,636.5 MB** |
| 版本 | **0.4.0**（目录名 `R.E.P.O.v0.4.0`，与 `app.info` 一致） |
| `app.info` | `semiwork` / `REPO`（开发商 / 产品名） |
| 引擎 | **Mono**（存在 `REPO_Data/Managed/`，**不存在** `il2cpp_data/`） |
| 关键程序集 | `Managed/Assembly-CSharp.dll` — 2,915,840 字节 |
| 场景 | `level0`、`level1`、`level2` |
| 资源 | `resources.assets`、`sharedassets0.assets`、`globalgamemanagers`、`StreamingAssets`、`Plugins` |

### 版本与完整性证据（sha256）

| 文件 | 字节 | SHA-256 |
|---|---|---|
| `REPO_Data/globalgamemanagers` | — | `b97d60f0527d166c73deee0cb9a32ef707fecfa832d8c77e0b406066e9812252` |
| `REPO_Data/resources.assets` | — | `10647e717948919fefbefb3736ebdf3f09d4551d1fec796480d56c23150b94a9` |
| `REPO_Data/Managed/Assembly-CSharp.dll` | 2,915,840 | `57e631840687760c8de930f0c5774cf387d6a2e6b8d6b3eb3d67436cf999d372` |

这三个哈希是「这一批数据读自哪个包」的可复核锚点。换包后哈希必然变化，届时须重新核验。

---

## 二、⚠️ 权利说明：来源是**盗版重打包**，不是正版购买

包内带有明确的非官方分发标记：

| 文件 | 内容 |
|---|---|
| `IGG-GAMES.COM.url` | `https://igg-games.com/` |
| `PCGAMESTORRENTS.COM.url` | `https://pcgamestorrents.com/` |
| `OneHack.Us.txt` | 破解／黑客教程社区推广 |
| `README.txt` | 「we upload the latest games every day… Everything is free」 |

**这是一份未获授权的重打包副本。** 由此产生的后果，必须由 Mac 侧在发布决策时一并考虑：

1. **数据本身的事实性不受影响**——版本号、程序集内容、实体数值都可以照常核验与引用；我们记录的是游戏自身的行为。
2. **但「我们持有该游戏」这一主张不成立**。若权利登记或对外说明把提取来源描述为「the installed game」而不加限定，会构成不准确的陈述。
3. **原始包绝不进入任何产物**——见第三节，已核实 0 个文件被 Git 跟踪。
4. **建议的措辞**：在来源说明中记「read from a local copy of build 0.4.0 (sha256 …)」，只陈述读取的技术事实，不主张持有合法性。
5. 若后续要公开署名或回应权利方，此条必须先解决。

---

## 三、交接边界（已核实的排除项）

| 路径 | 内容 | 是否进 Git / handoff |
|---|---|---|
| `data/raw/R.E.P.O.v0.4.0/` | 原始游戏包 1,636.5 MB（含 `REPO.exe`、全部 `.dll`、`.assets`、`level*`） | ❌ **0 个文件被跟踪**（`git ls-files data/raw` 为空） |
| `data/normalized/` | 归一化数据，站点构建的唯一输入 | ✅ 已提交（3 个文件） |
| `content/images-manifest.json` | 图片来源：bundle、资源名、宽高、字节、sha256 | ✅ 已提交 |
| `web/dist/` | 构建产物 | ❌ 不跟踪（由 Mac 侧构建） |

Mac 侧**不需要**原始包：归一化数据已提交，脱离游戏包即可重建站点。

---

## 四、已产出的归一化数据

| 文件 | 体积 | 用途 |
|---|---|---|
| `data/normalized/p0-inventory.json` | 1,791 KB | 实体清单（构建主输入） |
| `data/normalized/p0-instances.json` | 44 KB | 已解码值层（77 条实例） |
| `data/normalized/repo-mb-payloads.json` | 219 KB | MonoBehaviour 载荷 |

---

## 五、当前批次状态（2026-10-01 用生成器重测，非转述；此前一版数字为 2026-09-25 批次）

| 指标 | 值 | 来源 |
|---|---|---|
| HEAD | `79ea35f`，commits 284 | `pipeline/status.mjs` |
| 页面 | 701（indexable 161 / noindex 540） | `pipeline/status.mjs` |
| 覆盖率列 | 21 列，**20 列有内容**，published **142**，draft **1** | `tools/coverage.mjs` |
| 唯一缺口列 | `combos`（Item combinations） | `tools/coverage.mjs` |
| 质量失败 | **0** | `tools/coverage.mjs` |
| 图片 | 142 条目：**100 条有确认游戏图**、42 条仅示意图；清单 115 条记录、**0 条未使用**；**每条记录都有人工判定** | `tools/image-coverage.mjs` + `reports/image-reviews.md` |
| 门禁 | **62 passed / 0 failed** | `node tests/site.test.mjs` |

---

## 六、本文件修正的内容

| 项 | 旧版（2026-09-25） | 现在 |
|---|---|---|
| 结论 | `blocked_on_user`：本机无游戏包 | **已解除**：包在场并已核实 |
| 版本 | 未知 | 0.4.0 |
| 引擎 | 未知（待确认 Mono/IL2CPP） | **Mono** |
| 完整性 | 无 | 3 个关键文件 sha256 |
| 权利 | 未涉及 | **已记录为盗版重打包** |
