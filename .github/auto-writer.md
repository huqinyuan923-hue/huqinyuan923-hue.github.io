# 自动写作流水线（Auto Writer）

本仓库有一条 ZCode 自动化驱动的写作流水线：**定时选题 → 联网调研 → 撰写 MDX 草稿 → 提交 PR → 人工审阅合并后自动发布**。

## 工作方式

1. 每周日 20:00 由 ZCode 定时自动化触发一次（在作者本机运行）。
2. Agent 检查是否已有未合并的 `[自动草稿]` PR：有则跳过本次，无则继续。
3. 选题：对照 [auto-writer-log.md](./auto-writer-log.md) 与 `data/blog/`、`data/projects.ts` 查重，结合联网调研选一个贴合博客调性的新题目。
4. 调研后撰写一篇 `data/blog/YYYYMM/*.mdx` 文章草稿（frontmatter 与现有文章一致，`authors: ['default']`）。
5. 在分支 `auto/draft-YYYYMMDD` 上提交文章，并在 auto-writer-log.md 追加一行记录，推送并创建标题以 `[自动草稿]` 开头的 PR。
6. **人工审阅**：核对事实、链接与语气后合并 → Cloudflare 自动构建发布（约 3 分钟）。不满意直接关闭 PR，该选题未入日志、之后可重写。

## 安全边界

- Agent 绝不直接 push `main`，只通过 PR；
- 不修改 `data/projects.ts`、`data/navigation.ts` 等非文章文件（日志除外）；
- 不编造事实、数据与引用，引用一律附来源链接；
- 所有草稿在合并前对读者不可见。

## 校验

合并前建议本地跑一次 `npx contentlayer build`（快速校验 frontmatter 与 MDX 语法），或依赖 CI 的完整构建。
