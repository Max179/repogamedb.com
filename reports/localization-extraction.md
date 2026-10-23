# R.E.P.O. 本地化表提取（Windows 侧，2026-10-01）

## 结论先说

游戏**自带** Unity Localization 字符串表：**6 种语言 × 566 个 key**（三个表集合：Menu 363、Game 11、HUD 192）。
但**它们几乎全是占位文本**——把英文原文前面加一个语言标记（例如 `(pt-BR) Extraction point activated`）就算该语言的值。实测：

| 语言 | 条目 | 与英文相同 | 占位（= 标记 + 英文） | **真正翻译过** |
| --- | --- | --- | --- | --- |
| da-DK | 566 | 0 | 563 | **3** |
| en-US | 566 | — | — | （参照） |
| fi-FI | 566 | 0 | 566 | **0** |
| pt-BR | 566 | 0 | 566 | **0** |
| pt-PT | 566 | 0 | 566 | **0** |
| sv-SE | 566 | 0 | 546 | **20** |

也就是说：**这个构建里真正被翻译的字符串一共 23 条**。任何多语言站点若直接使用这些表，会把「英文 + 语言标记」当成译文展示——这是必须避免的。

## 提取方法与可复现性

`tools/extract-localization.py <game-root> <out-dir>`：

1. 读 `StreamingAssets/aa/StandaloneWindows64/localization-assets-shared_assets_all.bundle` 里的 `SharedTableData`，
   得到每个表集合的 **key ↔ 64 位 id**（本作共 566 个 key）。
2. 逐个语言包 `localization-string-tables-<locale>_assets_all.bundle` 读 `StringTable` 对象。
   这些嵌套条目结构（`StringTableEntry`）的类型树在本作里**读不出来**（TypeTreeGeneratorAPI 对 `Unity.Localization.dll` 报
   "Object reference not set"，直接按节点读会 AssertionError），因此改为**按已知 id 反查原始字节**：
   只接受出现在共享表里的 id，且其后必须紧跟合法的长度与 UTF-8 文本，同一个 id 只取一次——猜错不可能混进结果。
3. 产出 `data/normalized/localization-<locale>.json`，每条含 bundle 名、**sha256**、字节数、共享包 sha256、提取器版本，
   并附 `verification` 段（与英文表逐条比较得出的 sameAsEnglish / placeholderEntries / genuinelyLocalized）。

## 对站点侧的意义

- 站点若要做「多语言」，**不能**直接拿这 6 个表当译文；能用的只有 23 条真翻译（da 3、sv 20）。
- 其余语言要么由站点自行翻译，要么明确标注为「游戏未提供译文」。

## 同批次另外两个游戏（下一步）

| 游戏 | 本地化现状 | 处理方式 |
| --- | --- | --- |
| Supermarket Simulator | 地址资源包里有 **20 种语言**的 `localization-string-tables-*`（zh-cn、cs-cz、da-dk、nl-nl、en、fi-fi、fr-fr、de、hu-hu、it、ja-jp、ko-kr、lt-lt、pl-pl、pt-br、pt-pt、ro-ro、ru-ru、es-es、tr） | 同一支脚本可直接跑（IL2CPP + TTG 不可用时同样走「按 id 反查字节」）；需先验证这 20 个表是真翻译还是占位 |
| TCG Card Shop Simulator | 没有地址资源目录；`resources.assets` 里列出语言（de/ja/ko/it/pt-BR …）并带一个 **Google Sheets 发布端点**，说明译文来自在线表格 | 需要抓取该端点（游戏自带的公开数据源）或读取其运行时缓存；先确认端点是游戏官方发布 |
