# repo — 本地状态报告（Windows 端）

**状态：`partial`（数据面已打通，站点未建）** · 2026-09-25 · Windows Harness

## 游戏包（已确认，不再是 blocker）
| 项 | 值 |
|---|---|
| 压缩包 | `C:\uTorria\Downloads\REPOv040rar\R.E.P.O.v0.4.0.rar`（0.54 GB，RAR4） |
| 解包位置 | `C:\Users\CHEN\Desktop\repo\data\raw\R.E.P.O.v0.4.0`（**原始数据留在 Windows，不入 Git**） |
| 可执行 | `REPO\REPO.exe` |
| 版本标签 | `semiwork REPO`（`REPO_Data/app.info`）；包目录 `R.E.P.O.v0.4.0` |
| 引擎 / 后端 | **Unity** · **Mono**（`MonoBleedingEdge\EmbedRuntime\mono-2.0-bdwgc.dll`） |
| 解包命令 | `& 'C:\Program Files\WinRAR\UnRAR.exe' x -o+ -idq '<rar>' '<dest>\'` → EXIT=0 |

## P0 提取（已确证）
| 项 | 值 |
|---|---|
| 程序集 | `REPO_Data/Managed/Assembly-CSharp.dll` 2.78 MB |
| 总量 | **1,501 类型 / 19,505 字段 / 436 个 P0 候选类 / 130 个枚举** |
| 产物 | `data/normalized/p0-inventory.json` |
| 提取器 | `pipeline/inventory.ts`（复用参考项目 ECMA-335 读取架构，**未复用任何其它游戏数据**） |
| 复现 | `node --experimental-strip-types pipeline/inventory.ts` |

代表性 P0 类（已解析字段名与类型）：`ShopKeeper` 118 · `ExtractionPoint` 103 · `EnemyOogly` 77 · `EnemyHeartHugger` 69 ·
`UpgradeStand` 60 · `CosmeticShopMachineAnimator` 59 · `StatsManager` 53 · `ItemWalkieTalkie` 53 · `ItemGun` 44 ·
`Level` 43（含 `NarrativeName:string`、`NarrativeNameLocalized:LocalizedAsset`）。

真实枚举（游戏自身数值）：`EnemyState` 12（`None=0,Spawn=1,Roaming=2,ChaseBegin=3,Chase=4…`）· `EnemyType` 5
（`VeryLight=0…VeryHeavy=4`）· `State` 12 · `State` 8 · `Status` 4。

## 资源面
`resources.assets` 198.5 MB（+ resS 698.9 MB）· `sharedassets0.assets` 64.1 MB（+ resS 356.9 MB）·
`globalgamemanagers` 55.8 MB · `level0/1/2` 各 ~0.4–0.5 MB。

## 未完成
1. 实例值：需先确认该构建的 SerializedFile 版本（探针结果见 `reports/container-probe.txt`）。
2. P0 规范化实体（物品/贵重物、敌人、装备、地点、目标、危险与可核验数值），每字段带 source/version/checked/confidence，unknown 显式标注。
3. 静态站（home/search/collection/entity/guide/tool/sources/about/contact/disclaimer/privacy/terms）+ 测试 + typecheck + production build。

## Mac handoff（source-only）
`Desktop\repo`：提取脚本、P0 清单（含枚举）、报告、复现命令。**游戏包与解包原始数据留在 Windows。**