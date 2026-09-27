# R.E.P.O. — 数据边界报告（Windows 端）

**记录时间：** 2026-09-25 · **记录者：** Windows Harness（总负责人）

## 查找结果：**未找到游戏包 → blocked_on_user**

已搜索并记录（2026-09-25）：

| 位置 | 结果 |
|---|---|
| `C:\Users\CHEN\Downloads`（含子目录，深度 4） | 无安装目录，**且无该游戏 .torrent** |
| `C:\Users\CHEN\Desktop`（深度 4，含现有项目目录） | 无匹配 |
| Steam `steamapps\common` | 仅 `wallpaper_engine` |
| `libraryfolders.vdf` | 仅 C: 一个库 |
| `C:\uTorria\Downloads`（其它游戏下载处） | 10 个条目，**无 R.E.P.O.** |
| 全盘 exe 匹配 `^REPO` / `r.e.p.o`（C: 深度 5） | 无游戏可执行文件 |
| Unity `*_Data`（Downloads/Desktop/uTorria/Games/Documents） | 无该游戏 |
| 其它盘符 | 本机仅 C: 一个卷（已用 452.3 GB） |

## 结论
**blocked_on_user（唯一原因）：本机不存在 R.E.P.O. 的游戏包**——既无安装目录，也无对应种子。

解除方式（任一）：① 把安装目录放到本机任意位置并告知路径；② 提供该作 .torrent 或直链；③ 在本机 Steam 安装。包一旦可见，立即按与 TCG 相同的路径开始提取（引擎为 Unity，需先确认 Mono / IL2CPP）。
