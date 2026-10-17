# I6 自定义 tab 模式 DOM 摘录（修复后，Playwright 实测抓取）

抓取环境：Chrome headless 1440×900 light，实例 http://127.0.0.1:3172，修复后 bundle。

## 1. 模型车道 tablist（AI 助手，`.pm-model-lane`）

```html
<div class="pm-lane-switch pm-model-lane" role="tablist" aria-label="模型车道">
  <button role="tab" aria-selected="true"  tabindex="0"  class="pm-lane-poc is-on">PoC 免费</button>
  <button role="tab" aria-selected="false" tabindex="-1" class="pm-lane-prod">生产 Key</button>
</div>
```

方向键实测（verify-i6-lane-copilot.txt）：
- 焦点在 PoC → ArrowRight：选中翻转为「生产 Key」(aria-selected=true)，焦点跟随到生产 Key（focused=true，roving tabindex 0/-1 互换）；
- ArrowLeft：回到 PoC（aria-selected=true，焦点跟随）。

## 2. 副驾模式 tablist（`.pm-copilot-mode`）+ tabpanel 关联

```html
<div class="pm-copilot-mode" role="tablist" aria-label="副驾模式">
  <button id="cp-tab-diag" role="tab" aria-selected="true"  aria-controls="cp-panel-diag"  tabindex="0">只读诊断</button>
  <button id="cp-tab-draft" role="tab" aria-selected="false" aria-controls="cp-panel-draft" tabindex="-1">草稿待确认</button>
</div>
```

面板关联：
```html
<div role="tabpanel" id="cp-panel-diag" aria-labelledby="cp-tab-diag"> …（内层保留 role=log 直播区）… </div>
<div class="pm-copilot-draft" role="tabpanel" id="cp-panel-draft" aria-labelledby="cp-tab-draft"> …操作计划… </div>
```

方向键实测：ArrowRight 从「只读诊断」→「草稿待确认」aria-selected 翻转 + 焦点跟随，`cp-panel-draft` 随之渲染（role=tabpanel, aria-labelledby=cp-tab-draft）；ArrowLeft 返回。

## 3. 风险/问题 tablist（`.ri-seg`，临时记录触发渲染后抓取，复测后已删除）

```html
<div class="ri-seg" role="tablist" aria-label="筛选记录类型">
  <button id="ri-tab-risk"  role="tab" aria-selected="true"  aria-controls="ri-panel" tabindex="0">风险 <span class="n">1</span></button>
  <button id="ri-tab-issue" role="tab" aria-selected="false" aria-controls="ri-panel" tabindex="-1">问题 <span class="n">0</span></button>
</div>
<section class="ri-card" role="tabpanel" id="ri-panel" aria-labelledby="ri-tab-risk"> …清单… </section>
```

方向键实测（verify-i6-risk.txt）：ArrowRight 风险→问题（aria-selected 翻转、焦点跟随、panel aria-labelledby 翻转为 ri-tab-issue）；ArrowLeft 回风险。

## 4. 无主面板清理

原 `<section class="pm-view" role="tabpanel">`（panel.tsx 主内容区，无归属它的 tablist，导航为 rail 菜单）移除孤立 role=tabpanel，避免无主面板；CSS 无 `[role=tabpanel]` 选择器依赖，布局零影响。
