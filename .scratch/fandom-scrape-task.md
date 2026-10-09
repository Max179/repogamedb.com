# Fandom 词条批量抓取任务

## 目标

从以下两个 Fandom Wiki 批量抓取词条和图片，补充到本站：
- https://repo-2025horror.fandom.com/wiki/Repo_Wiki
- https://repogame.fandom.com/wiki/R.E.P.O._Wiki

## 范围

1. **P0 实体**（当前 90 个）：
   - 24 Threats
   - 38 Valuables  
   - 28 Gear

2. **缺失内容**：
   - 词条描述文本（当前大部分为空）
   - 高质量图片（替换渲染问题的图）
   - 策略/用法说明

## 技术要求

### 数据结构
遵循现有 schema：
```json
{
  "id": "ENEMY.BOMB_THROWER",
  "name": "The Bomb Thrower",
  "description": "从 Fandom 抓取的描述",
  "images": ["从 Fandom 下载的图片路径"],
  "source": "https://具体页面URL",
  "lastChecked": "2026-10-10",
  "verificationStatus": "community-sourced"
}
```

### 图片处理
- 下载到 `content/images/fandom/`
- 更新 `content/images-manifest.json`
- 记录原始 URL、下载日期、来源

### 合规要求（AGENTS.md §4）
- ✅ 图片必须记录原始来源、许可
- ✅ 每个字段带 `source`、`lastChecked`、`verificationStatus`
- ✅ 标记为 `community-sourced` 而非官方数据
- ⚠️ Fandom 内容使用 CC-BY-SA 许可，需在站点 footer 声明

## 执行步骤

1. **发现阶段**
   - 爬取两个 Wiki 的主要分类页
   - 提取所有词条链接
   - 匹配到我们的 90 个实体

2. **抓取阶段**
   - 对每个匹配的词条：
     - 提取描述文本
     - 下载 infobox 图片
     - 提取策略/用法段落
   - 保存原始 HTML 备查

3. **集成阶段**
   - 更新 `content/published/*.json`
   - 更新 `content/images-manifest.json`
   - 重新构建站点
   - 验证 90 个词条的覆盖率

4. **验证阶段**
   - 检查图片是否正常显示
   - 检查描述是否完整
   - 运行 `npm run check`

## 输出

- `content/published/*.json` 更新（90 个文件）
- `content/images/fandom/*.png` 新增
- `content/images-manifest.json` 更新
- `reports/fandom-scrape-report.md` 生成

## 注意事项

- 尊重 robots.txt
- 添加延迟避免过载
- 记录所有来源
- 不要覆盖已有的官方数据（Unity 拆包）
- Fandom 文本可能不准确，标记为 `verificationStatus: "community-sourced"`
