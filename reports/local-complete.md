# repo — 本地状态报告（Windows 端）

**状态：`blocked_on_user`** · 记录时间 2026-09-25

## 唯一阻塞原因
**本机不存在 R.E.P.O. 的游戏包**——既无安装目录，也无对应种子文件。

搜索范围（全部已执行并记录）：`Downloads`（深度 4，含子目录）、`Desktop`（深度 4，含现有项目目录）、
Steam `steamapps/common`（仅 `wallpaper_engine`）、`libraryfolders.vdf`（仅 C: 一库）、`C:\uTorria\Downloads`（10 项，无该作）、
全盘 exe 名匹配 `^REPO`/`r.e.p.o`（C: 深度 5）、Unity `*_Data` 目录（多目录深度 3）、其它盘符（本机仅 C:）。

## 解除方式（任一）
① 把安装目录放到本机任意位置并告知路径；② 提供该作 .torrent 或直链；③ 在本机 Steam 安装。
包可见后立即按 TCG 的同一路径提取（Unity；先确认 Mono / IL2CPP）。