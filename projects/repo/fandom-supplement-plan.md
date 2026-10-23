# Fandom 数据补充计划

**创建日期**：2026-10-11  
**状态**：进行中  
**目标**：补充 10 个 Unity 拆包中不存在但 Fandom 有记录的怪物

---

## 一、补充范围

### 1.1 当前数据状态
- **Unity 拆包**：25 个怪物（来自 Assembly-CSharp.dll）
- **Fandom**：35 个怪物条目
- **差异**：10 个 Fandom 独有的怪物

### 1.2 需要补充的 10 个怪物

| # | 怪物名称 | Fandom URL | 有图片 | 有描述 |
|---|---|---|---|---|
| 1 | Apex Predator | [链接](https://repo-2025horror.fandom.com/wiki/Apex_Predator) | ✅ | ✅ |
| 2 | Bella | [链接](https://repo-2025horror.fandom.com/wiki/Bella) | ✅ | ✅ |
| 3 | Chef | [链接](https://repo-2025horror.fandom.com/wiki/Chef) | ✅ | ✅ |
| 4 | Cleanup Crew | [链接](https://repo-2025horror.fandom.com/wiki/Cleanup_Crew) | ✅ | ✅ |
| 5 | Clown | [链接](https://repo-2025horror.fandom.com/wiki/Clown_(Monster)) | ✅ | ✅ |
| 6 | Gambit | [链接](https://repo-2025horror.fandom.com/wiki/Gambit) | ✅ | ✅ |
| 7 | Headgrab | [链接](https://repo-2025horror.fandom.com/wiki/Headgrab) | ✅ | ✅ |
| 8 | Loom | [链接](https://repo-2025horror.fandom.com/wiki/Loom) | ✅ | ✅ |
| 9 | Mentalist | [链接](https://repo-2025horror.fandom.com/wiki/Mentalist) | ✅ | ✅ |
| 10 | Reaper | [链接](https://repo-2025horror.fandom.com/wiki/Reaper) | ✅ | ✅ |

### 1.3 用户提到但不存在的怪物
- ❌ **Noisemaker** - Fandom 和 Unity 中都不存在
- ❌ **Mimic** - Fandom 和 Unity 中都不存在
- ❌ **Landmine Monster** - Fandom 和 Unity 中都不存在

**推测**：这些可能是游戏内的非正式名称、玩家俗称或未来版本的怪物。

---

## 二、数据来源风险评估

### 2.1 Fandom 数据的可靠性

**问题**：
根据 `AGENTS.md` §4：
> 禁止依赖复制其他 Wiki 文本或图片的站点

**风险等级**：🔴 高

**原因**：
- Fandom 是社区维护的 Wiki，内容可能不准确
- 这 10 个怪物在 Unity 代码中不存在，可能是：
  - 未发布的内容
  - 测试版本的怪物
  - 社区推测
  - 已删除的内容

### 2.2 验证策略

根据 `AGENTS.md` §4：
> 每个项目必须有社区来源分级、补丁复核队列、工具能力门禁和公开完成度说明

**必须标记**：
- `source: "fandom-community"`
- `verificationStatus: "unverified-community-source"`
- `dataConfidence: "low"` 或 `"medium"`
- `missingFromUnity: true`
- `gameVersion: "unknown"`

**页面处理**：
- 在页面顶部添加醒目的免责声明
- 标注"此怪物未在游戏代码中验证"
- 提供 Fandom 来源链接
- 考虑添加 `noindex` 标签（待决策）

---

## 三、补充步骤

### 3.1 数据处理流程

```bash
# 1. 为每个怪物创建 JSON 文件
for monster in "Reaper" "Apex Predator" "Bella" "Chef" "Cleanup Crew" "Clown" "Gambit" "Headgrab" "Loom" "Mentalist"; do
  # 从 Fandom 数据生成 JSON
  # 标记来源和验证状态
  # 添加免责声明字段
done

# 2. 下载并缓存 Fandom 图片
# - 记录到 images-manifest.json
# - 标记 imageTier: "fandom-image"
# - 记录原始 URL 和下载日期

# 3. 生成实体页面
# - 添加免责声明组件
# - 标注数据来源
# - 提供反馈入口

# 4. 更新 sitemap 和索引
# - 决策：是否 noindex 这些页面
# - 更新分类目录
```

### 3.2 文件生成清单

**每个怪物需要**：
- `content/published/<slug>.json` - 实体数据文件
- `content/assets/mapped/<slug>-*.jpg` - 本地缓存图片
- `content/images-manifest.json` - 图片记录（追加）
- 网站页面：`/threats/<slug>` - 自动生成

### 3.3 Schema 调整

需要在 JSON schema 中添加字段：
```json
{
  "source": "fandom-community",
  "verificationStatus": "unverified-community-source",
  "dataConfidence": "low" | "medium",
  "missingFromUnity": true,
  "gameVersion": "unknown",
  "fandomUrl": "https://...",
  "disclaimer": "This monster is documented in the community Wiki but not verified in game code."
}
```

---

## 四、AdSense 合规性检查

### 4.1 原创性问题

根据 `AGENTS.md` §4：
> 内容原创性：依赖 Unity 拆包数据，但 90 个词条的描述文本来源不明

**当前状态**：
- Unity 怪物：描述文本来源不明（可能来自 Fandom）
- Fandom 怪物：描述文本**明确**来自 Fandom

**风险**：
如果直接复制 Fandom 文本，违反 AdSense 原创性要求。

**解决方案**：
1. **改写所有描述文本**（推荐）
   - 基于 Fandom 信息，但用自己的语言重写
   - 添加额外的游戏机制说明
   - 添加玩家策略建议

2. **仅使用 Fandom 作为参考**
   - 只提取关键数值（HP、伤害、速度等）
   - 描述文本完全原创
   - 添加与其他怪物的比较

3. **标记为 noindex**（不推荐）
   - 页面存在但不进入搜索引擎
   - 仅供已知用户参考
   - 放弃 SEO 价值

### 4.2 建议策略

**Phase 1: 先补充数据**
- 创建 JSON 文件
- 下载并缓存图片
- 改写描述文本（原创化）
- 添加免责声明

**Phase 2: 游戏验证**
- 在游戏中寻找这些怪物
- 截图验证外观
- 记录实际行为
- 更新验证状态

**Phase 3: 持续更新**
- 关注游戏更新
- 检查新版本的 Unity 代码
- 如果找到，升级为 "game-verified"
- 如果确认不存在，标记为 "deprecated" 或删除

---

## 五、决策点

### 决策 1：是否补充这 10 个怪物？

**选项 A：全部补充**（推荐）
- 优点：数据完整，覆盖玩家查询
- 缺点：需要改写文本，增加维护负担
- 时间：~2 小时

**选项 B：只补充热门怪物**
- 优点：减少工作量
- 缺点：可能遗漏重要内容
- 需要：关键词搜索量数据

**选项 C：暂不补充**
- 优点：保持数据纯净（仅 Unity 验证）
- 缺点：数据不完整，可能失去流量
- 等待：游戏更新或更好的数据源

### 决策 2：这些页面是否 noindex？

**选项 A：正常索引**（推荐）
- 前提：改写所有文本，添加原创内容
- 标注数据来源和验证状态
- 提供用户反馈入口

**选项 B：暂时 noindex**
- 等待游戏内验证
- 验证后再开放索引
- 降低 AdSense 风险

### 决策 3：图片如何处理？

**选项 A：使用 Fandom 图片**（推荐）
- 本地缓存
- 标记来源
- 记录到 images-manifest.json
- imageTier: "fandom-image"

**选项 B：自己截图**
- 需要在游戏中找到这些怪物
- 如果怪物不存在，无法截图
- 更可靠但更费时

**选项 C：使用占位符**
- imageTier: "no-image-yet"
- 等待验证后补充
- 页面不完整

---

## 六、时间估算

### 如果选择"全部补充 + 正常索引"：

| 任务 | 时间 | 说明 |
|---|---|---|
| 创建 10 个 JSON 文件 | 30 分钟 | 基于 Fandom 数据，添加字段 |
| 改写描述文本 | 60 分钟 | 原创化所有文本 |
| 下载缓存图片 | 15 分钟 | 10 个图片 + manifest 更新 |
| 测试页面生成 | 15 分钟 | 验证构建和显示 |
| 更新文档 | 10 分钟 | database-coverage.md |
| **总计** | **2 小时 10 分钟** | |

---

## 七、下一步行动

**等待用户决策**：

### 问题 1：是否补充？
- **A. 全部补充**（10 个怪物）
- **B. 只补充你提到的 Reaper**
- **C. 暂不补充**（等待更好的数据源）

### 问题 2：索引策略？
- **A. 正常索引**（改写文本，添加原创内容）
- **B. 暂时 noindex**（等待游戏验证）

### 问题 3：图片处理？
- **A. 使用 Fandom 图片**（本地缓存）
- **B. 使用占位符**（等待截图）

### 问题 4：关于 Noisemaker/Mimic/Landmine Monster？
这 3 个怪物在 Fandom 和 Unity 中都不存在。你从哪里听说的？
- 游戏内遇到过？
- 玩家讨论？
- 其他 Wiki？

---

**状态**：等待决策  
**下一步**：根据用户回复执行补充或调整计划
