# Cheat-on-Content × 游戏买量系统：对比分析与改进方案 v3

> 文档版本：v3.0（务实验证版）
> 生成时间：2026-06-02
> 核心变更：推翻 v2 的"直接建系统"思路，改为"先验证再建设"的分阶段策略

---

## 目录

- [第一部分：问题重新定义](#第一部分问题重新定义)
- [第二部分：Phase 0 — 数据验证实验](#第二部分phase-0--数据验证实验)
- [第三部分：Phase 1 — 回顾性公式健康度](#第三部分phase-1--回顾性公式健康度)
- [第四部分：Phase 2 — 公式权重进化](#第四部分phase-2--公式权重进化)
- [第五部分：Phase 3 — 投放闭环](#第五部分phase-3--投放闭环)
- [第六部分：Phase 4 — 管理者模式同步](#第六部分phase-4--管理者模式同步)
- [第七部分：实施路线图](#第七部分实施路线图)
- [第八部分：风险与应对](#第八部分风险与应对)

---

# 第一部分：问题重新定义

## 1.1 v2 的核心问题

v2 方案犯了一个根本性错误：**把内容创作工具的模式直接套用到广告买量场景**。

| 维度 | 内容创作（Cheat-on-Content） | 广告买量（你的系统） |
|------|---------------------------|-------------------|
| 决定因素 | 内容本身占 80%+ | 内容只占 ~30%，定向/出价/受众/落地页各占一份 |
| 反馈周期 | T+3 天，数据确定 | 归因窗口 7-30 天，数据持续漂移 |
| 测试成本 | 免费发布 | 每次测试花真金白银 |
| 样本独立性 | 每条内容独立 | 广告受预算分配、竞价环境、学习期影响 |

**v2 的 5 个方案中，方案三（盲预测隔离）在广告场景下没有价值，应直接砍掉。**

## 1.2 v3 的核心思路

```
v2 思路：设计完整系统 → 开发 → 上线 → 希望有用
v3 思路：用现有数据做实验 → 验证假设 → 有证据后才建设 → 持续迭代
```

## 1.3 借鉴 Cheat-on-Content 的真正价值

不是照搬它的功能，而是借鉴它的**思维方式**：

| Cheat-on-Content 的思维 | 在你的系统中如何体现 |
|------------------------|-------------------|
| "每次发布都是实验" | 每次素材投放都标记公式版本，事后回看 |
| "从你的数据推导标准" | 从你自己的投放历史推导公式权重，不用通用标准 |
| "预测→复盘→进化闭环" | 公式投前评分 → 投后回看 → 权重自动微调 |
| "评分标准是工作台不是博物馆" | 无效的公式标签组合要淘汰，不是永远保留 |

## 1.4 现有系统数据资产盘点

在设计方案前，先搞清楚你**已经有什么**：

### 已有数据层

| 数据层 | 位置 | 关键字段 |
|--------|------|---------|
| **ClickHouse ads_performance** | 后端 | date, ad_account_id, campaign_id, ad_id, creative_id, country, platform, impressions, clicks, spend, installs, revenue, roi |
| **CreativeTags** | 后端 CLIP 流水线 | video_id, visual_tags(10种), audio_tags, text_keywords, duration_seconds |
| **ElementRanking** | 后端 | tag, avg_roas, avg_ctr, avg_ipm, sample_size |
| **MaterialRecord** | 前端 store | materialId, category, spend, impressions, clicks, ctr, cpm, cpc, playCount~play100, installs, cpi, roas |
| **Formula f1-f7** | 前端 workshop.ts | id, name, tags, popularity, caseStudy, duration, structures(时间段拆解) |

### 已有指标

| 指标 | 计算方式 | 来源 |
|------|---------|------|
| ROAS | revenue / spend | ClickHouse |
| CTR | clicks / impressions | ClickHouse / 前端 |
| IPM | installs / impressions × 1000 | ElementRanking |
| CPI | spend / installs | ClickHouse / 前端 |
| ROI | revenue / spend | ClickHouse |
| cvr (播放率) | play2s / playCount | 前端 |
| playRate (完播率) | play100 / playCount | 前端 |
| dataScore | matchedCount×10 + matchedSpend×0.01 + avgCtr×10000 | 前端 |

### 公式 f1-f7 定义

| ID | 名称 | 标签 | 案例 |
|----|------|------|------|
| f1 | 末世生存+建造经营 | 建造经营/模拟, 成就进步, 末世题材 | Whiteout Survival |
| f2 | 真人剧情+游戏混剪 | 真人, 剧情叙事, 混合 | Dark War:Survival |
| f3 | 解压治愈+放松逃离 | 解压治愈, 放松逃离 | Big Farm Homestead |
| f4 | 突发事件+快速响应 | 技巧挑战, 逆境反击 | — |
| f5 | 真人出镜+技巧展示 | 真人, 技巧挑战 | Mobile Legends |
| f6 | 新角色/新玩法首发 | 剧情叙事, 沉浸剧情 | MONOPOLY GO! |
| f7 | 短平快+高频测试 | 解压治愈, 轻松上手 | Hexa Diamonds |

每个公式还有时间段结构拆解：0-3秒(黄金3秒/钩子) → 3-15秒(核心玩法) → 15-30秒(情绪爆点) → 结尾(CTA)

---

# 第二部分：Phase 0 — 数据验证实验

> **这是整个方案最重要的部分。用 1-2 周回答一个核心问题：从素材标签能否预测 ROAS 排名？如果答案是"不能"，后续所有建设都是浪费。**

## 2.1 实验设计

### 数据来源

利用现有数据：
- `MaterialRecord`：spend, impressions, clicks, ctr, cpm, cpc, installs, cpi, roas, 播放漏斗（play2s~play100）
- `CreativeTags`：visual_tags（10 种场景标签）, audio_tags, text_keywords, duration_seconds
- `ElementRanking`：tag 组合的 avg_roas, avg_ctr, avg_ipm
- `Formula` f1-f7：每个公式对应一组标签组合

### 实验步骤

```
Step 1: 数据对齐
  把 MaterialRecord 和 CreativeTags 通过 materialId 关联
  产出：一张宽表，每行 = 一个素材，列 = 标签 + 实际表现

Step 2: 回顾性排名
  按 ROAS 降序排列所有素材
  标记 Top-20% 和 Bottom-20%

Step 3: 标签区分度分析
  计算每个标签在 Top-20% 和 Bottom-20% 中的出现频率差异
  用卡方检验或信息增益衡量标签的区分能力

Step 4: 公式命中率回测
  对 f1-f7 每个公式：
    - 找到匹配该公式的素材
    - 计算这些素材的平均 ROAS
    - 与全局平均 ROAS 对比
  如果命中公式的素材平均 ROAS 显著高于全局 → 公式有效
  如果无显著差异 → 公式只是"好看的标签"，没有预测价值

Step 5: 排名可预测性评估
  用标签特征训练一个简单的排序模型（如 LightGBM Ranker）
  用留一法或时间切分法评估
  计算 NDCG@5 和 NDCG@10
  如果 NDCG@5 > 0.6 → 预测可行，进入 Phase 1
  如果 NDCG@5 < 0.5 → 预测不可行，转向"回顾性分析"路线
```

## 2.2 后端实现

### `game-ad-system/src/creative/experiment.py`

```python
"""
Phase 0: 数据验证实验

目标：用现有数据验证"标签能否预测 ROAS 排名"
"""

from dataclasses import dataclass
from typing import Optional
import numpy as np
from scipy import stats

@dataclass
class TagDiscrimination:
    """标签区分度分析结果"""
    tag: str
    top_frequency: float      # 在 Top-20% 中的出现频率
    bottom_frequency: float   # 在 Bottom-20% 中的出现频率
    frequency_diff: float     # 频率差异
    chi2_pvalue: float        # 卡方检验 p 值
    is_significant: bool      # p < 0.05
    lift: float               # 含此标签素材的平均 ROAS / 全局平均 ROAS

@dataclass
class FormulaBacktest:
    """公式回测结果"""
    formula_id: str
    formula_name: str
    matched_count: int        # 匹配素材数量
    matched_avg_roas: float   # 匹配素材平均 ROAS
    global_avg_roas: float    # 全局平均 ROAS
    lift: float               # 提升度
    ttest_pvalue: float       # t 检验 p 值
    is_significant: bool      # p < 0.05

@dataclass
class PredictabilityReport:
    """排名可预测性报告"""
    ndcg_at_5: float
    ndcg_at_10: float
    sample_count: int
    feature_count: int
    recommendation: str       # 'go' / 'no-go' / 'borderline'
    details: str

class Phase0Experiment:
    """
    Phase 0 数据验证实验

    核心问题：从素材标签能否预测 ROAS 排名？
    """

    # Go/No-Go 阈值
    NDCG_GO_THRESHOLD = 0.6
    NDCG_NOGO_THRESHOLD = 0.5
    MIN_SAMPLES = 30  # 最少需要的素材数量

    def __init__(self, materials: list[dict], formulas: list[dict]):
        """
        Args:
            materials: MaterialRecord 列表，每个包含 visual_tags, roas 等字段
            formulas: Formula 列表，每个包含 id, name, tags 字段
        """
        self.materials = [m for m in materials if m.get('roas') is not None and m.get('roas', 0) > 0]
        self.formulas = formulas

    def run_full_experiment(self) -> dict:
        """运行完整实验"""
        if len(self.materials) < self.MIN_SAMPLES:
            return {
                'status': 'insufficient_data',
                'message': f'素材数量不足（{len(self.materials)} < {self.MIN_SAMPLES}）',
                'recommendation': 'no-go',
            }

        # Step 1: 标签区分度分析
        tag_discriminations = self._analyze_tag_discrimination()

        # Step 2: 公式命中率回测
        formula_backtests = self._backtest_formulas()

        # Step 3: 排名可预测性评估
        predictability = self._evaluate_predictability()

        # 汇总结论
        significant_tags = [t for t in tag_discriminations if t.is_significant]
        effective_formulas = [f for f in formula_backtests if f.is_significant]

        return {
            'status': 'completed',
            'sample_count': len(self.materials),
            'tag_discrimination': {
                'total_tags': len(tag_discriminations),
                'significant_tags': len(significant_tags),
                'top_tags': sorted(tag_discriminations, key=lambda t: t.lift, reverse=True)[:5],
                'insignificant_tags': [t.tag for t in tag_discriminations if not t.is_significant],
            },
            'formula_backtest': {
                'total_formulas': len(formula_backtests),
                'effective_formulas': len(effective_formulas),
                'results': formula_backtests,
            },
            'predictability': predictability,
            'recommendation': predictability.recommendation,
        }

    def _analyze_tag_discrimination(self) -> list[TagDiscrimination]:
        """分析每个标签的区分度"""
        # 按 ROAS 排序
        sorted_m = sorted(self.materials, key=lambda m: m['roas'], reverse=True)
        n = len(sorted_m)
        top_n = max(1, n // 5)
        top_materials = sorted_m[:top_n]
        bottom_materials = sorted_m[-top_n:]

        # 收集所有标签
        all_tags = set()
        for m in self.materials:
            all_tags.update(m.get('visual_tags', []))

        global_avg_roas = np.mean([m['roas'] for m in self.materials])
        results = []

        for tag in all_tags:
            top_freq = sum(1 for m in top_materials if tag in m.get('visual_tags', [])) / len(top_materials)
            bottom_freq = sum(1 for m in bottom_materials if tag in m.get('visual_tags', [])) / len(bottom_materials)

            # 卡方检验
            contingency = [
                [sum(1 for m in top_materials if tag in m.get('visual_tags', [])),
                 sum(1 for m in top_materials if tag not in m.get('visual_tags', []))],
                [sum(1 for m in bottom_materials if tag in m.get('visual_tags', [])),
                 sum(1 for m in bottom_materials if tag not in m.get('visual_tags', []))],
            ]
            try:
                _, pvalue = stats.chi2_contingency(contingency)[:2]
            except ValueError:
                pvalue = 1.0

            # 含此标签素材的 ROAS 提升度
            tag_materials = [m for m in self.materials if tag in m.get('visual_tags', [])]
            tag_avg_roas = np.mean([m['roas'] for m in tag_materials]) if tag_materials else 0
            lift = tag_avg_roas / global_avg_roas if global_avg_roas > 0 else 0

            results.append(TagDiscrimination(
                tag=tag,
                top_frequency=top_freq,
                bottom_frequency=bottom_freq,
                frequency_diff=top_freq - bottom_freq,
                chi2_pvalue=pvalue,
                is_significant=pvalue < 0.05,
                lift=lift,
            ))

        return results

    def _backtest_formulas(self) -> list[FormulaBacktest]:
        """回测每个公式的命中率"""
        global_avg_roas = np.mean([m['roas'] for m in self.materials])
        results = []

        for formula in self.formulas:
            formula_tags = set(formula.get('tags', []))
            category_tags = set(formula.get('categories', []))
            all_tags = formula_tags | category_tags

            # 匹配素材
            matched = []
            for m in self.materials:
                material_tags = set(m.get('visual_tags', []) + m.get('category', '').split('/'))
                if material_tags & all_tags:
                    matched.append(m)

            if len(matched) < 3:
                results.append(FormulaBacktest(
                    formula_id=formula['id'],
                    formula_name=formula['name'],
                    matched_count=len(matched),
                    matched_avg_roas=0,
                    global_avg_roas=global_avg_roas,
                    lift=0,
                    ttest_pvalue=1.0,
                    is_significant=False,
                ))
                continue

            matched_roas = [m['roas'] for m in matched]
            matched_avg = np.mean(matched_roas)
            lift = matched_avg / global_avg_roas if global_avg_roas > 0 else 0

            # t 检验：匹配素材的 ROAS 是否显著高于全局
            _, pvalue = stats.ttest_1samp(matched_roas, global_avg_roas)

            results.append(FormulaBacktest(
                formula_id=formula['id'],
                formula_name=formula['name'],
                matched_count=len(matched),
                matched_avg_roas=matched_avg,
                global_avg_roas=global_avg_roas,
                lift=lift,
                ttest_pvalue=pvalue,
                is_significant=pvalue < 0.05 and lift > 1.0,
            ))

        return results

    def _evaluate_predictability(self) -> PredictabilityReport:
        """评估排名可预测性"""
        try:
            from sklearn.preprocessing import MultiLabelBinarizer
            from sklearn.model_selection import LeaveOneOut
        except ImportError:
            return PredictabilityReport(
                ndcg_at_5=0, ndcg_at_10=0,
                sample_count=len(self.materials),
                feature_count=0,
                recommendation='no-go',
                details='需要安装 scikit-learn: pip install scikit-learn',
            )

        # 构建特征矩阵
        all_tags = set()
        for m in self.materials:
            all_tags.update(m.get('visual_tags', []))
        all_tags = sorted(all_tags)

        X = np.array([
            [1 if tag in m.get('visual_tags', []) else 0 for tag in all_tags]
            for m in self.materials
        ])
        y = np.array([m['roas'] for m in self.materials])

        if X.shape[1] == 0:
            return PredictabilityReport(
                ndcg_at_5=0, ndcg_at_10=0,
                sample_count=len(self.materials),
                feature_count=0,
                recommendation='no-go',
                details='没有可用的标签特征',
            )

        # 简单线性模型 + Leave-One-Out 交叉验证
        from sklearn.linear_model import Ridge

        loo = LeaveOneOut()
        predictions = np.zeros(len(y))

        for train_idx, test_idx in loo.split(X):
            model = Ridge(alpha=1.0)
            model.fit(X[train_idx], y[train_idx])
            predictions[test_idx] = model.predict(X[test_idx])

        # 计算 NDCG
        ndcg_5 = self._ndcg_at_k(y, predictions, k=5)
        ndcg_10 = self._ndcg_at_k(y, predictions, k=10)

        # 推荐
        if ndcg_5 >= self.NDCG_GO_THRESHOLD:
            recommendation = 'go'
            details = f'NDCG@5={ndcg_5:.3f} >= {self.NDCG_GO_THRESHOLD}，标签有预测能力，建议建设闭环系统'
        elif ndcg_5 <= self.NDCG_NOGO_THRESHOLD:
            recommendation = 'no-go'
            details = f'NDCG@5={ndcg_5:.3f} <= {self.NDCG_NOGO_THRESHOLD}，标签预测能力不足，建议转向回顾性分析'
        else:
            recommendation = 'borderline'
            details = f'NDCG@5={ndcg_5:.3f} 处于灰色地带，建议先做 Phase 1（公式健康度），观察效果后再决定'

        return PredictabilityReport(
            ndcg_at_5=ndcg_5,
            ndcg_at_10=ndcg_10,
            sample_count=len(self.materials),
            feature_count=X.shape[1],
            recommendation=recommendation,
            details=details,
        )

    def _ndcg_at_k(self, y_true: np.ndarray, y_pred: np.ndarray, k: int) -> float:
        """计算 NDCG@k"""
        # 按预测值排序
        order = np.argsort(y_pred)[::-1]
        y_true_sorted = y_true[order]

        # DCG
        dcg = sum(
            y_true_sorted[i] / np.log2(i + 2)
            for i in range(min(k, len(y_true_sorted)))
        )

        # Ideal DCG
        y_true_ideal = np.sort(y_true)[::-1]
        idcg = sum(
            y_true_ideal[i] / np.log2(i + 2)
            for i in range(min(k, len(y_true_ideal)))
        )

        return dcg / idcg if idcg > 0 else 0
```

## 2.3 API 端点

```python
# game-ad-system/src/api/routes/experiment.py

from fastapi import APIRouter, Query

router = APIRouter(prefix="/experiment", tags=["experiment"])

@router.post("/phase0")
async def run_phase0(account_id: str = Query(...)):
    """
    运行 Phase 0 数据验证实验

    返回：
    - 标签区分度分析
    - 公式命中率回测
    - 排名可预测性评估
    - Go/No-Go 建议
    """
    materials = await get_materials_with_tags(account_id)
    formulas = await get_formulas(account_id)

    experiment = Phase0Experiment(materials, formulas)
    result = experiment.run_full_experiment()

    return result
```

## 2.4 前端：实验结果展示页面

### 新增路由 `/experiment`

```typescript
// game-ad-desktop/frontend/src/pages/Phase0Experiment.tsx

import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Alert, Progress, Descriptions, Button, Spin } from 'antd';
import { RocketOutlined, CheckCircleOutlined, CloseCircleOutlined, WarningOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';

const Phase0Experiment = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runExperiment = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/experiment/phase0?account_id=default');
      const data = await res.json();
      setResult(data);
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationAlert = () => {
    if (!result) return null;

    const config = {
      'go': { type: 'success' as const, icon: <CheckCircleOutlined />, message: '建议继续建设闭环系统' },
      'no-go': { type: 'error' as const, icon: <CloseCircleOutlined />, message: '建议转向回顾性分析路线' },
      'borderline': { type: 'warning' as const, icon: <WarningOutlined />, message: '处于灰色地带，建议先做 Phase 1 观察' },
      'insufficient_data': { type: 'info' as const, icon: <WarningOutlined />, message: '数据不足，无法评估' },
    };

    const c = config[result.recommendation as keyof typeof config] || config['insufficient_data'];

    return <Alert type={c.type} icon={c.icon} message={c.message} description={result.predictability?.details} showIcon />;
  };

  return (
    <div style={{ padding: 24 }}>
      <Card title="🔬 Phase 0：数据验证实验" extra={
        <Button type="primary" icon={<RocketOutlined />} onClick={runExperiment} loading={loading}>
          运行实验
        </Button>
      }>
        <Alert
          type="info"
          message="核心问题：从素材标签能否预测 ROAS 排名？"
          description="这个实验用你现有的历史数据来回答。如果答案是'不能'，后续建设预测系统就是浪费。"
          showIcon
          style={{ marginBottom: 24 }}
        />

        {loading && <Spin size="large" style={{ display: 'block', margin: '40px auto' }} />}

        {result && (
          <>
            {/* 推荐结论 */}
            {getRecommendationAlert()}

            {/* 概览 */}
            <Descriptions title="实验概览" bordered column={3} style={{ marginTop: 24 }}>
              <Descriptions.Item label="素材样本数">{result.sample_count}</Descriptions.Item>
              <Descriptions.Item label="有效标签数">{result.tag_discrimination?.significant_tags}/{result.tag_discrimination?.total_tags}</Descriptions.Item>
              <Descriptions.Item label="有效公式数">{result.formula_backtest?.effective_formulas}/{result.formula_backtest?.total_formulas}</Descriptions.Item>
              <Descriptions.Item label="NDCG@5">
                <Tag color={result.predictability?.ndcg_at_5 > 0.6 ? 'green' : result.predictability?.ndcg_at_5 > 0.5 ? 'orange' : 'red'}>
                  {result.predictability?.ndcg_at_5?.toFixed(3)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="NDCG@10">{result.predictability?.ndcg_at_10?.toFixed(3)}</Descriptions.Item>
              <Descriptions.Item label="特征数">{result.predictability?.feature_count}</Descriptions.Item>
            </Descriptions>

            {/* 标签区分度 */}
            <Card title="📊 标签区分度分析" style={{ marginTop: 24 }}>
              <ReactECharts option={{
                tooltip: { trigger: 'axis' },
                xAxis: { type: 'category', data: result.tag_discrimination?.top_tags?.map((t: any) => t.tag) },
                yAxis: { type: 'value', name: 'ROAS 提升度' },
                series: [
                  { name: '提升度', type: 'bar', data: result.tag_discrimination?.top_tags?.map((t: any) => t.lift) },
                ],
                markLine: { data: [{ yAxis: 1, label: '基线', lineStyle: { color: '#999', type: 'dashed' } }] },
              }} />

              <Table
                style={{ marginTop: 16 }}
                size="small"
                pagination={false}
                columns={[
                  { title: '标签', dataIndex: 'tag' },
                  { title: 'Top-20% 出现率', dataIndex: 'top_frequency', render: (v: number) => `${(v * 100).toFixed(0)}%` },
                  { title: 'Bottom-20% 出现率', dataIndex: 'bottom_frequency', render: (v: number) => `${(v * 100).toFixed(0)}%` },
                  { title: 'ROAS 提升度', dataIndex: 'lift', render: (v: number) => <Tag color={v > 1.2 ? 'green' : v > 1 ? 'blue' : 'red'}>{v.toFixed(2)}x</Tag> },
                  { title: 'p 值', dataIndex: 'chi2_pvalue', render: (v: number) => v < 0.001 ? '< 0.001' : v.toFixed(3) },
                  { title: '显著', dataIndex: 'is_significant', render: (v: boolean) => v ? <Tag color="green">是</Tag> : <Tag>否</Tag> },
                ]}
                dataSource={result.tag_discrimination?.top_tags}
              />
            </Card>

            {/* 公式回测 */}
            <Card title="🧪 公式命中率回测" style={{ marginTop: 24 }}>
              <Table
                pagination={false}
                columns={[
                  { title: '公式', dataIndex: 'formula_name' },
                  { title: '匹配素材数', dataIndex: 'matched_count' },
                  { title: '匹配素材平均 ROAS', dataIndex: 'matched_avg_roas', render: (v: number) => v.toFixed(3) },
                  { title: '全局平均 ROAS', dataIndex: 'global_avg_roas', render: (v: number) => v.toFixed(3) },
                  { title: '提升度', dataIndex: 'lift', render: (v: number) => <Tag color={v > 1.2 ? 'green' : v > 1 ? 'blue' : 'red'}>{v.toFixed(2)}x</Tag> },
                  { title: 'p 值', dataIndex: 'ttest_pvalue', render: (v: number) => v < 0.001 ? '< 0.001' : v.toFixed(3) },
                  { title: '有效', dataIndex: 'is_significant', render: (v: boolean) => v ? <Tag color="green">有效</Tag> : <Tag color="red">无效</Tag> },
                ]}
                dataSource={result.formula_backtest?.results}
              />
            </Card>
          </>
        )}
      </Card>
    </div>
  );
};

export default Phase0Experiment;
```

## 2.5 工期：1-2 周

| 任务 | 工作量 |
|------|--------|
| 数据对齐脚本 | 2 天 |
| 标签区分度分析 | 1 天 |
| 公式命中率回测 | 1 天 |
| 排名可预测性评估 | 2 天 |
| 前端实验结果页面 | 2 天 |
| **合计** | **8 天（约 1.5 周）** |

---

# 第三部分：Phase 1 — 回顾性公式健康度

> **无论 Phase 0 结果如何，这个都做。即使预测不可行，"知道哪些公式有效"本身就有巨大价值。**

## 3.1 设计目标

给 f1-f7 每个公式计算健康度，让用户知道：
- 这个公式在你的账户里到底有没有用
- 哪些标签是有效的，哪些是噪音
- 公式什么时候该更新了

## 3.2 数据结构

### FormulaHealth 接口

```typescript
interface FormulaHealth {
  hitRate: number;           // 命中率：匹配素材中 ROAS > 全局中位数的比例
  avgRoas: number;           // 匹配素材的平均 ROAS
  globalAvgRoas: number;     // 全局平均 ROAS
  lift: number;              // 提升度 = avgRoas / globalAvgRoas
  sampleCount: number;       // 匹配素材数量
  confidence: 'high' | 'medium' | 'low' | 'insufficient';
  lastEvaluated: string;     // 最后评估时间
  needsUpdate: boolean;      // 是否需要更新
  tagEffectiveness: TagEffectiveness[];
}

interface TagEffectiveness {
  tag: string;
  frequency: number;         // 在高 ROAS 素材中的出现频率
  lift: number;              // 该标签的 ROAS 提升度
  sampleSize: number;        // 含此标签的素材数量
}
```

## 3.3 后端实现

### `game-ad-system/src/creative/formula_evaluator.py`

```python
from dataclasses import dataclass
from typing import Optional
import numpy as np

@dataclass
class TagEffectiveness:
    tag: str
    frequency: float   # 在 Top-20% 中的出现频率
    lift: float        # 含此标签素材的平均 ROAS / 全局平均 ROAS
    sample_size: int

@dataclass
class FormulaHealth:
    formula_id: str
    hit_rate: float           # 命中率
    avg_roas: float           # 匹配素材平均 ROAS
    global_avg_roas: float    # 全局平均 ROAS
    lift: float               # 提升度
    sample_count: int
    confidence: str
    needs_update: bool
    tag_effectiveness: list[TagEffectiveness]

class FormulaEvaluator:
    """
    公式健康度评估器

    核心逻辑：
    1. 从 MaterialRecord 中筛选匹配公式的素材
    2. 计算命中率和提升度
    3. 评估各标签的有效性
    4. 判断公式是否需要更新
    """

    MIN_SAMPLES_HIGH = 20
    MIN_SAMPLES_MEDIUM = 10
    MIN_SAMPLES_LOW = 5

    def evaluate(self, formula: dict, materials: list[dict]) -> FormulaHealth:
        """评估单个公式的健康度"""
        matched = self._match_materials(formula, materials)

        if len(matched) < self.MIN_SAMPLES_LOW:
            return FormulaHealth(
                formula_id=formula['id'],
                hit_rate=0,
                avg_roas=0,
                global_avg_roas=0,
                lift=0,
                sample_count=len(matched),
                confidence='insufficient',
                needs_update=False,
                tag_effectiveness=[],
            )

        global_avg_roas = self._calc_global_avg_roas(materials)
        matched_avg_roas = self._calc_avg_roas(matched)
        hit_rate = sum(1 for m in matched if m.get('roas', 0) > global_avg_roas) / len(matched)
        lift = matched_avg_roas / global_avg_roas if global_avg_roas > 0 else 0

        confidence = self._calc_confidence(len(matched))
        needs_update = self._check_needs_update(hit_rate, confidence, formula)
        tag_effectiveness = self._analyze_tag_effectiveness(formula, materials)

        return FormulaHealth(
            formula_id=formula['id'],
            hit_rate=hit_rate,
            avg_roas=matched_avg_roas,
            global_avg_roas=global_avg_roas,
            lift=lift,
            sample_count=len(matched),
            confidence=confidence,
            needs_update=needs_update,
            tag_effectiveness=tag_effectiveness,
        )

    def evaluate_all(self, formulas: list[dict], materials: list[dict]) -> list[FormulaHealth]:
        """评估所有公式的健康度"""
        return [self.evaluate(f, materials) for f in formulas]

    def _match_materials(self, formula: dict, materials: list[dict]) -> list[dict]:
        """筛选匹配公式标签的素材"""
        formula_tags = set(formula.get('tags', []))
        category_tags = set(formula.get('categories', []))
        all_tags = formula_tags | category_tags

        matched = []
        for m in materials:
            material_tags = set(m.get('visual_tags', []) + m.get('category', '').split('/'))
            if material_tags & all_tags:
                matched.append(m)
        return matched

    def _analyze_tag_effectiveness(
        self, formula: dict, all_materials: list[dict]
    ) -> list[TagEffectiveness]:
        """分析每个标签的有效性"""
        matched = self._match_materials(formula, all_materials)
        if not matched:
            return []

        sorted_m = sorted(matched, key=lambda m: m.get('roas', 0), reverse=True)
        top_n = max(1, len(sorted_m) // 5)
        top_materials = sorted_m[:top_n]
        global_avg = self._calc_global_avg_roas(all_materials)

        results = []
        for tag in formula.get('tags', []):
            top_freq = sum(1 for m in top_materials if tag in m.get('visual_tags', [])) / len(top_materials)
            tag_materials = [m for m in all_materials if tag in m.get('visual_tags', [])]
            tag_avg_roas = self._calc_avg_roas(tag_materials) if tag_materials else 0
            lift = tag_avg_roas / global_avg if global_avg > 0 else 0

            results.append(TagEffectiveness(
                tag=tag,
                frequency=top_freq,
                lift=lift,
                sample_size=len(tag_materials),
            ))

        return sorted(results, key=lambda t: t.lift, reverse=True)

    def _calc_global_avg_roas(self, materials: list[dict]) -> float:
        roas_values = [m.get('roas', 0) for m in materials if m.get('roas') is not None and m.get('roas', 0) > 0]
        return np.mean(roas_values) if roas_values else 0

    def _calc_avg_roas(self, materials: list[dict]) -> float:
        roas_values = [m.get('roas', 0) for m in materials if m.get('roas') is not None]
        return np.mean(roas_values) if roas_values else 0

    def _calc_confidence(self, sample_count: int) -> str:
        if sample_count >= self.MIN_SAMPLES_HIGH:
            return 'high'
        elif sample_count >= self.MIN_SAMPLES_MEDIUM:
            return 'medium'
        elif sample_count >= self.MIN_SAMPLES_LOW:
            return 'low'
        return 'insufficient'

    def _check_needs_update(self, hit_rate: float, confidence: str, formula: dict) -> bool:
        if confidence in ('high', 'medium') and hit_rate < 0.4:
            return True
        return False
```

## 3.4 API 端点

```python
# game-ad-system/src/api/routes/formula.py

from fastapi import APIRouter, Query

router = APIRouter(prefix="/formulas", tags=["formulas"])

@router.get("/health")
async def get_formulas_health(account_id: str = Query(...)):
    """获取所有公式的健康度"""
    evaluator = FormulaEvaluator()
    formulas = await get_formulas(account_id)
    materials = await get_materials(account_id)

    results = []
    for f in formulas:
        health = evaluator.evaluate(f, materials)
        results.append({
            'formula': f,
            'health': health,
        })

    return {'formulas': results}

@router.get("/{formula_id}/tags")
async def get_tag_effectiveness(formula_id: str, account_id: str = Query(...)):
    """获取公式的标签有效性分析"""
    evaluator = FormulaEvaluator()
    formula = await get_formula(formula_id)
    materials = await get_materials(account_id)

    effectiveness = evaluator._analyze_tag_effectiveness(formula, materials)
    return {'tags': effectiveness}
```

## 3.5 前端改动

### Workshop.tsx — 公式卡片新增健康度指示器

```typescript
// game-ad-desktop/frontend/src/components/FormulaHealthBadge.tsx

import React from 'react';
import { Tag, Tooltip, Space } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

interface FormulaHealth {
  hitRate: number;
  lift: number;
  sampleCount: number;
  confidence: string;
  needsUpdate: boolean;
}

const FormulaHealthBadge = ({ health }: { health: FormulaHealth }) => {
  if (health.confidence === 'insufficient') {
    return <Tag color="default">数据不足（{health.sampleCount}条）</Tag>;
  }

  const color = health.lift > 1.2 ? 'green' :
                health.lift > 1.0 ? 'blue' :
                health.lift > 0.8 ? 'orange' : 'red';

  const label = health.lift > 1.2 ? '有效' :
                health.lift > 1.0 ? '平庸' :
                health.lift > 0.8 ? '偏弱' : '失效';

  return (
    <Space>
      <Tag color={color}>{label}</Tag>
      <Tooltip title={`提升度: ${health.lift.toFixed(2)}x，命中率: ${(health.hitRate * 100).toFixed(0)}%，样本: ${health.sampleCount}`}>
        <QuestionCircleOutlined />
      </Tooltip>
      {health.needsUpdate && (
        <Tag color="red">⚠️ 需要更新</Tag>
      )}
    </Space>
  );
};

export default FormulaHealthBadge;
```

### Workshop.tsx — 标签有效性雷达图

```typescript
// game-ad-desktop/frontend/src/components/TagEffectivenessChart.tsx

import React from 'react';
import ReactECharts from 'echarts-for-react';

interface TagEffectiveness {
  tag: string;
  frequency: number;
  lift: number;
  sampleSize: number;
}

const TagEffectivenessChart = ({ tags }: { tags: TagEffectiveness[] }) => {
  const option = {
    radar: {
      indicator: tags.map(t => ({ name: t.tag, max: 3 })),
    },
    series: [{
      type: 'radar',
      data: [{
        value: tags.map(t => t.lift),
        name: 'ROAS 提升度',
        areaStyle: { opacity: 0.2 },
      }],
    }],
    tooltip: {
      formatter: (params: any) => {
        const data = params.data[0];
        return tags.map((t, i) => `${t.tag}: ${data.value[i].toFixed(2)}x (样本: ${t.sampleSize})`).join('\n');
      },
    },
  };

  return <ReactECharts option={option} style={{ height: 300 }} />;
};

export default TagEffectivenessChart;
```

## 3.6 工期：1 周

| 任务 | 工作量 |
|------|--------|
| FormulaEvaluator 后端实现 | 2 天 |
| API 端点 | 0.5 天 |
| Workshop 健康度指示器 | 1 天 |
| 标签有效性雷达图 | 1 天 |
| 公式详情弹窗增强 | 0.5 天 |
| **合计** | **5 天** |

---

# 第四部分：Phase 2 — 公式权重进化

> **前提条件：Phase 0 的 NDCG@5 > 0.6，证明标签确实有预测能力。如果 Phase 0 未通过，跳过此阶段。**

## 4.1 设计思路

不照搬 Cheat-on-Content 的"盲预测+影子模式"，而是做**基于历史回测的权重微调**：

```
现有流程：
  f1-f7 公式 → 人工定义标签权重 → 生成创意简报 → 结束

Phase 2 流程：
  f1-f7 公式 → 标签权重（初始=人工定义）
       ↓
  历史数据回测 → 计算当前权重的排序准确率
       ↓
  梯度优化 → 生成候选权重
       ↓
  留一法交叉验证 → 候选权重 vs 当前权重
       ↓
  候选更优？ → 人工审核 → 更新权重
       ↓
  下次回测时使用新权重
```

**关键区别**：不用真实投放验证，用历史数据回测，成本为零。

## 4.2 数据结构

```typescript
interface WeightCandidate {
  formulaId: string;
  version: number;
  weights: Record<string, number>;  // tag -> weight
  backtestNdcg: number;             // 回测 NDCG@5
  currentNdcg: number;              // 当前权重的 NDCG@5
  improvement: number;              // 提升幅度
  crossValScores: number[];         // 交叉验证分数
  meanCvScore: number;
  stdCvScore: number;
}

interface EvolutionResult {
  formulaId: string;
  oldVersion: number;
  newVersion: number;
  oldWeights: Record<string, number>;
  newWeights: Record<string, number>;
  oldNdcg: number;
  newNdcg: number;
  improvement: number;
  approved: boolean;
  reason: string;
}
```

## 4.3 后端实现

### `game-ad-system/src/creative/formula_evolver.py`

```python
from dataclasses import dataclass
from typing import Optional
import numpy as np

@dataclass
class WeightCandidate:
    formula_id: str
    version: int
    weights: dict[str, float]
    backtest_ndcg: float
    current_ndcg: float
    improvement: float
    cross_val_scores: list[float]
    mean_cv_score: float
    std_cv_score: float

class FormulaEvolver:
    """
    公式权重进化器

    核心逻辑：
    1. 用历史数据回测当前权重的排序准确率
    2. 用梯度优化生成候选权重
    3. 用交叉验证比较新旧权重
    4. 候选更优时生成进化建议
    """

    IMPROVEMENT_THRESHOLD = 0.05  # 最低提升阈值（5%）
    MIN_SAMPLES = 20

    def evolve(
        self,
        formula: dict,
        materials: list[dict],
    ) -> Optional[WeightCandidate]:
        """尝试进化公式权重"""
        matched = self._match_materials(formula, materials)

        if len(matched) < self.MIN_SAMPLES:
            return None

        current_ndcg = self._evaluate_weights(formula['weights'], matched)
        candidate_weights = self._optimize_weights(formula, matched)
        candidate_ndcg = self._evaluate_weights(candidate_weights, matched)
        cv_scores = self._cross_validate(candidate_weights, formula['weights'], matched)

        improvement = (candidate_ndcg - current_ndcg) / current_ndcg if current_ndcg > 0 else 0

        if improvement < self.IMPROVEMENT_THRESHOLD:
            return None

        return WeightCandidate(
            formula_id=formula['id'],
            version=formula.get('version', 1),
            weights=candidate_weights,
            backtest_ndcg=candidate_ndcg,
            current_ndcg=current_ndcg,
            improvement=improvement,
            cross_val_scores=cv_scores,
            mean_cv_score=np.mean(cv_scores),
            std_cv_score=np.std(cv_scores),
        )

    def _evaluate_weights(self, weights: dict, materials: list[dict]) -> float:
        """用 NDCG@5 评估权重的排序质量"""
        scored = []
        for m in materials:
            score = sum(weights.get(tag, 0) for tag in m.get('visual_tags', []))
            scored.append((score, m.get('roas', 0)))

        scored.sort(key=lambda x: x[0], reverse=True)
        return self._ndcg_at_k(scored, k=5)

    def _ndcg_at_k(self, scored: list[tuple], k: int) -> float:
        dcg = 0
        for i, (_, relevance) in enumerate(scored[:k]):
            dcg += relevance / np.log2(i + 2)

        ideal = sorted([r for _, r in scored], reverse=True)
        idcg = sum(ideal[i] / np.log2(i + 2) for i in range(min(k, len(ideal))))

        return dcg / idcg if idcg > 0 else 0

    def _optimize_weights(self, formula: dict, materials: list[dict]) -> dict[str, float]:
        """用简单的梯度优化调整权重"""
        current_weights = dict(formula['weights'])
        best_weights = dict(current_weights)
        best_ndcg = self._evaluate_weights(current_weights, materials)

        for tag in current_weights:
            for delta in [-0.2, -0.1, 0.1, 0.2]:
                trial = dict(best_weights)
                trial[tag] = max(0, trial[tag] + delta)
                trial_ndcg = self._evaluate_weights(trial, materials)
                if trial_ndcg > best_ndcg:
                    best_ndcg = trial_ndcg
                    best_weights = dict(trial)

        return best_weights

    def _cross_validate(
        self,
        candidate_weights: dict,
        current_weights: dict,
        materials: list[dict],
        n_folds: int = 3,
    ) -> list[float]:
        """交叉验证"""
        shuffled = list(materials)
        np.random.shuffle(shuffled)
        fold_size = len(shuffled) // n_folds
        scores = []

        for i in range(n_folds):
            test_start = i * fold_size
            test_end = test_start + fold_size
            test_set = shuffled[test_start:test_end]

            candidate_ndcg = self._evaluate_weights(candidate_weights, test_set)
            current_ndcg = self._evaluate_weights(current_weights, test_set)

            if current_ndcg > 0:
                scores.append(candidate_ndcg / current_ndcg)
            else:
                scores.append(1.0)

        return scores

    def _match_materials(self, formula: dict, materials: list[dict]) -> list[dict]:
        formula_tags = set(formula.get('tags', []))
        category_tags = set(formula.get('categories', []))
        all_tags = formula_tags | category_tags

        matched = []
        for m in materials:
            material_tags = set(m.get('visual_tags', []) + m.get('category', '').split('/'))
            if material_tags & all_tags:
                matched.append(m)
        return matched
```

## 4.4 API 端点

```python
# game-ad-system/src/api/routes/formula.py

@router.post("/{formula_id}/evolve")
async def evolve_formula(formula_id: str, account_id: str = Query(...)):
    """尝试进化公式权重"""
    evolver = FormulaEvolver()
    formula = await get_formula(formula_id)
    materials = await get_materials(account_id)

    candidate = evolver.evolve(formula, materials)

    if candidate is None:
        return {
            'status': 'no_improvement',
            'message': '当前权重已经是较优状态，无需进化',
        }

    return {
        'status': 'candidate_found',
        'candidate': candidate,
        'message': f'发现更优权重，NDCG@5 提升 {candidate.improvement * 100:.1f}%',
    }

@router.post("/{formula_id}/evolve/approve")
async def approve_evolution(formula_id: str, request: ApprovalRequest):
    """人工审核通过，更新公式权重"""
    formula = await get_formula(formula_id)

    formula['weights'] = request.new_weights
    formula['version'] = formula.get('version', 1) + 1
    formula['last_evolved'] = datetime.now().isoformat()
    formula['evolution_log'] = formula.get('evolution_log', [])
    formula['evolution_log'].append({
        'type': 'evolution',
        'old_weights': request.old_weights,
        'new_weights': request.new_weights,
        'improvement': request.improvement,
        'approved_by': request.reviewer,
        'timestamp': datetime.now().isoformat(),
    })

    await save_formula(formula)
    return {'status': 'approved', 'new_version': formula['version']}
```

## 4.5 前端：Workshop 公式进化面板

```typescript
// game-ad-desktop/frontend/src/pages/WorkshopEvolution.tsx

import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Descriptions, Button, Space, Divider, Alert } from 'antd';
import { ExperimentOutlined, CheckCircleOutlined } from '@ant-design/icons';
import WeightDiffChart from '../components/WeightDiffChart';

interface WeightCandidate {
  formulaId: string;
  version: number;
  weights: Record<string, number>;
  backtestNdcg: number;
  currentNdcg: number;
  improvement: number;
  crossValScores: number[];
  meanCvScore: number;
  stdCvScore: number;
}

const WorkshopEvolution = () => {
  const [candidates, setCandidates] = useState<WeightCandidate[]>([]);
  const [loading, setLoading] = useState(false);

  const checkEvolutions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/formulas/evolve-check?account_id=default');
      const data = await res.json();
      setCandidates(data.candidates);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (candidate: WeightCandidate) => {
    await fetch(`/api/formulas/${candidate.formulaId}/evolve/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        new_weights: candidate.weights,
        old_weights: currentWeights,
        improvement: candidate.improvement,
        reviewer: 'current_user',
      }),
    });
    checkEvolutions();
  };

  return (
    <div>
      <Alert
        type="info"
        message="公式进化基于历史数据回测，不消耗广告预算"
        description="系统会自动分析你的投放历史，找到更优的标签权重组合。"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Button
        type="primary"
        icon={<ExperimentOutlined />}
        onClick={checkEvolutions}
        loading={loading}
      >
        检查进化建议
      </Button>

      {candidates.map(c => (
        <Card key={c.formulaId} title={`公式 ${c.formulaId} 进化建议`} style={{ marginTop: 16 }}>
          <Descriptions column={2}>
            <Descriptions.Item label="当前 NDCG@5">{c.currentNdcg.toFixed(3)}</Descriptions.Item>
            <Descriptions.Item label="候选 NDCG@5">
              <Tag color="green">{c.backtestNdcg.toFixed(3)}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="提升幅度">
              <Tag color="green">+{(c.improvement * 100).toFixed(1)}%</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="交叉验证">
              {c.meanCvScore.toFixed(2)} ± {c.stdCvScore.toFixed(2)}
            </Descriptions.Item>
          </Descriptions>

          <Divider>权重变化</Divider>
          <WeightDiffChart oldWeights={currentWeights} newWeights={c.weights} />

          <Space style={{ marginTop: 16 }}>
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => handleApprove(c)}>
              ✅ 采纳新权重
            </Button>
            <Button onClick={() => handleReject(c)}>
              ❌ 保留当前权重
            </Button>
          </Space>
        </Card>
      ))}

      {candidates.length === 0 && !loading && (
        <Card style={{ marginTop: 16 }}>
          <Descriptions title="所有公式状态" column={2}>
            <Descriptions.Item label="结论">当前权重已是较优状态，无需进化</Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </div>
  );
};

export default WorkshopEvolution;
```

## 4.6 工期：2 周

| 任务 | 工作量 |
|------|--------|
| FormulaEvolver 后端实现 | 3 天 |
| API 端点 | 1 天 |
| 权重对比图表组件 | 1 天 |
| 进化面板前端 | 2 天 |
| 人工审核流程 | 1 天 |
| **合计** | **8 天** |

---

# 第五部分：Phase 3 — 投放闭环

> **前提条件：Phase 2 完成。借鉴 Cheat-on-Content 的"预测→复盘→进化"闭环，做适合广告场景的简化版。**

## 5.1 设计思路

```
不做：盲预测（广告场景下没意义）
不做：影子模式（用回测替代，成本为零）
做：投前评分 → 投放标记 → T+7 自动回看 → 公式权重微调
```

## 5.2 流程

```
Step 1: 投前评分
  新素材上传 → CLIP 打标 → 用当前公式权重计算得分
  → 显示：该素材在历史同标签素材中的排名百分位
  → 显示：置信度（基于相似素材数量）

Step 2: 投放标记
  素材开始投放 → 自动记录：公式版本、标签、预测得分
  → 写入 ClickHouse 的新表

Step 3: T+7 自动回看
  投放 7 天后 → 自动拉取实际 ROAS
  → 计算：预测排名 vs 实际排名的偏差
  → 分级：Normal（<15%）/ Moderate（15-30%）/ Severe（>30%）

Step 4: 积累触发
  当某公式积累了 >= 10 个有效回看样本
  → 自动触发 Phase 2 的权重进化流程
  → 生成进化建议供人工审核
```

## 5.3 数据库新增表

```sql
-- 投放预测记录
CREATE TABLE creative_predictions (
    id UUID DEFAULT generateUUIDv4(),
    creative_id String,
    account_id String,
    formula_id String,
    formula_version Int32,
    predicted_score Float64,          -- 公式得分
    predicted_percentile Float64,     -- 排名百分位
    confidence String,                -- high/medium/low/insufficient
    similar_count Int32,              -- 相似素材数量
    tags Array(String),               -- 素材标签
    created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (account_id, created_at);

-- 投放回看记录
CREATE TABLE creative_retros (
    id UUID DEFAULT generateUUIDv4(),
    prediction_id UUID,
    creative_id String,
    account_id String,
    formula_id String,
    predicted_score Float64,
    actual_roas Float64,
    actual_ctr Float64,
    rank_error Float64,               -- 排名偏差
    deviation_level String,           -- normal/moderate/severe
    is_clean UInt8,                   -- 是否通过数据清洗
    exclusion_reason Nullable(String),
    reviewed_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (account_id, reviewed_at);
```

## 5.4 后端实现

### `game-ad-system/src/creative/predictor.py`

```python
from dataclasses import dataclass
from typing import Optional

@dataclass
class Prediction:
    creative_id: str
    formula_id: str
    formula_version: int
    predicted_score: float
    predicted_percentile: float
    confidence: str
    similar_count: int
    tags: list[str]

class CreativePredictor:
    """素材投前评分器"""

    def predict(
        self,
        creative_features: dict,
        formula: dict,
        historical_materials: list[dict],
    ) -> Prediction:
        """
        对素材进行投前评分

        Args:
            creative_features: 素材特征（含 visual_tags）
            formula: 公式定义（含 weights）
            historical_materials: 历史素材数据

        Returns:
            Prediction 对象
        """
        tags = creative_features.get('visual_tags', [])
        weights = formula.get('weights', {})

        # 计算公式得分
        score = sum(weights.get(tag, 0) for tag in tags)

        # 计算排名百分位
        historical_scores = []
        for m in historical_materials:
            m_tags = m.get('visual_tags', [])
            m_score = sum(weights.get(tag, 0) for tag in m_tags)
            historical_scores.append(m_score)

        if historical_scores:
            percentile = sum(1 for s in historical_scores if s < score) / len(historical_scores)
        else:
            percentile = 0.5

        # 计算相似素材数量
        similar_count = sum(
            1 for m in historical_materials
            if set(m.get('visual_tags', [])) & set(tags)
        )

        # 置信度
        if similar_count >= 20:
            confidence = 'high'
        elif similar_count >= 10:
            confidence = 'medium'
        elif similar_count >= 5:
            confidence = 'low'
        else:
            confidence = 'insufficient'

        return Prediction(
            creative_id=creative_features.get('id', ''),
            formula_id=formula['id'],
            formula_version=formula.get('version', 1),
            predicted_score=score,
            predicted_percentile=percentile,
            confidence=confidence,
            similar_count=similar_count,
            tags=tags,
        )
```

### `game-ad-system/src/creative/retro_engine.py`

```python
from dataclasses import dataclass
from typing import Optional
from datetime import datetime, timedelta

@dataclass
class RetroResult:
    prediction_id: str
    creative_id: str
    predicted_score: float
    actual_roas: float
    rank_error: float
    deviation_level: str  # normal/moderate/severe
    is_clean: bool
    exclusion_reason: Optional[str]

class RetroEngine:
    """投放回看引擎"""

    CLEANING_RULES = {
        'min_spend': 50,
        'min_impressions': 1000,
        'cold_start_days': 3,
    }

    def review(self, prediction: dict, actual: dict) -> RetroResult:
        """回看单个素材的预测 vs 实际"""
        is_clean, reason = self._clean_data(actual)
        if not is_clean:
            return RetroResult(
                prediction_id=prediction['id'],
                creative_id=actual['creative_id'],
                predicted_score=prediction['predicted_score'],
                actual_roas=actual['roas'],
                rank_error=0,
                deviation_level='excluded',
                is_clean=False,
                exclusion_reason=reason,
            )

        # 简化的排名偏差计算
        # 用预测分数和实际 ROAS 的相对差异
        if actual['roas'] > 0:
            rank_error = abs(prediction['predicted_percentile'] - self._roas_percentile(actual)) 
        else:
            rank_error = 0

        if rank_error < 0.15:
            level = 'normal'
        elif rank_error < 0.30:
            level = 'moderate'
        else:
            level = 'severe'

        return RetroResult(
            prediction_id=prediction['id'],
            creative_id=actual['creative_id'],
            predicted_score=prediction['predicted_score'],
            actual_roas=actual['roas'],
            rank_error=rank_error,
            deviation_level=level,
            is_clean=True,
            exclusion_reason=None,
        )

    def _clean_data(self, actual: dict) -> tuple[bool, Optional[str]]:
        """数据清洗"""
        if actual.get('spend', 0) < self.CLEANING_RULES['min_spend']:
            return False, f"花费不足（{actual.get('spend', 0)} < {self.CLEANING_RULES['min_spend']}）"
        if actual.get('impressions', 0) < self.CLEANING_RULES['min_impressions']:
            return False, f"曝光不足（{actual.get('impressions', 0)} < {self.CLEANING_RULES['min_impressions']}）"
        return True, None

    def _roas_percentile(self, actual: dict) -> float:
        """计算实际 ROAS 的百分位（需要上下文数据）"""
        # 简化实现，实际需要与同批素材比较
        return 0.5

    def check_evolution_trigger(
        self,
        retros: list[RetroResult],
        min_samples: int = 10,
    ) -> tuple[bool, str]:
        """检查是否触发公式进化"""
        clean_retros = [r for r in retros if r.is_clean]

        if len(clean_retros) < min_samples:
            return False, f"样本不足（{len(clean_retros)}/{min_samples}）"

        severe_count = sum(1 for r in clean_retros if r.deviation_level == 'severe')
        severe_ratio = severe_count / len(clean_retros)

        if severe_ratio < 0.30:
            return False, f"严重偏差占比低（{severe_ratio:.0%}）"

        avg_error = sum(r.rank_error for r in clean_retros) / len(clean_retros)
        return True, f"平均排名偏差={avg_error:.2f}, 严重偏差占比={severe_ratio:.0%}"
```

## 5.5 API 端点

```python
# game-ad-system/src/api/routes/prediction.py

from fastapi import APIRouter, Query

router = APIRouter(prefix="/predictions", tags=["predictions"])

@router.post("/predict")
async def predict_creative(request: PredictionRequest):
    """对素材进行投前评分"""
    predictor = CreativePredictor()
    formula = await get_formula(request.formula_id)
    materials = await get_materials(request.account_id)

    prediction = predictor.predict(
        creative_features=request.features,
        formula=formula,
        historical_materials=materials,
    )

    await store_prediction(prediction)

    return {
        'prediction': prediction,
        'message': f'该素材预测得分 {prediction.predicted_score:.2f}，'
                   f'排名百分位 {prediction.predicted_percentile:.0%}，'
                   f'置信度 {prediction.confidence}',
    }

@router.post("/retro")
async def review_prediction(request: RetroRequest):
    """复盘预测结果"""
    retro_engine = RetroEngine()
    prediction = await get_prediction(request.prediction_id)
    actual = await get_actual_data(request.creative_id)

    result = retro_engine.review(prediction, actual)
    await store_retro(result)

    # 检查是否触发进化
    should_evolve = False
    reason = ''
    if result.is_clean:
        retros = await get_recent_retros(request.account_id, prediction['formula_id'])
        should_evolve, reason = retro_engine.check_evolution_trigger(retros)

    return {
        'retro': result,
        'evolution_triggered': should_evolve,
        'evolution_reason': reason,
    }
```

## 5.6 前端：CreativeInsightNew 新增 Tab

```typescript
// game-ad-desktop/frontend/src/components/FormulaRetroTab.tsx

import React from 'react';
import { Card, Table, Tag, Progress, Descriptions, Alert } from 'antd';

interface RetroSummary {
  formulaId: string;
  formulaName: string;
  retroCount: number;
  normalRate: number;
  severeRate: number;
  needsEvolution: boolean;
}

interface RetroRecord {
  creativeName: string;
  formulaId: string;
  predictedScore: number;
  actualRoas: number;
  deviationLevel: 'normal' | 'moderate' | 'severe';
}

const FormulaRetroTab = ({
  retroSummary,
  recentRetros,
}: {
  retroSummary: RetroSummary[];
  recentRetros: RetroRecord[];
}) => {
  return (
    <div>
      {/* 公式回看概览 */}
      <Card title="📊 公式回看概览">
        <Table
          pagination={false}
          columns={[
            { title: '公式', dataIndex: 'formulaName' },
            { title: '回看样本数', dataIndex: 'retroCount' },
            {
              title: '正常偏差',
              dataIndex: 'normalRate',
              render: (v: number) => <Progress percent={Math.round(v * 100)} status="success" />,
            },
            {
              title: '严重偏差',
              dataIndex: 'severeRate',
              render: (v: number) => (
                <Tag color={v > 0.3 ? 'red' : 'green'}>{(v * 100).toFixed(0)}%</Tag>
              ),
            },
            {
              title: '状态',
              dataIndex: 'needsEvolution',
              render: (v: boolean) =>
                v ? <Tag color="red">需要进化</Tag> : <Tag color="green">健康</Tag>,
            },
          ]}
          dataSource={retroSummary}
        />
      </Card>

      {/* 近期回看记录 */}
      <Card title="📋 近期回看记录" style={{ marginTop: 16 }}>
        <Table
          pagination={{ pageSize: 10 }}
          columns={[
            { title: '素材', dataIndex: 'creativeName', ellipsis: true },
            { title: '公式', dataIndex: 'formulaId' },
            { title: '预测得分', dataIndex: 'predictedScore' },
            { title: '实际 ROAS', dataIndex: 'actualRoas' },
            {
              title: '偏差等级',
              dataIndex: 'deviationLevel',
              render: (v: string) => (
                <Tag color={v === 'normal' ? 'green' : v === 'moderate' ? 'orange' : 'red'}>
                  {v === 'normal' ? '正常' : v === 'moderate' ? '中等' : '严重'}
                </Tag>
              ),
            },
          ]}
          dataSource={recentRetros}
        />
      </Card>
    </div>
  );
};

export default FormulaRetroTab;
```

## 5.7 工期：2 周

| 任务 | 工作量 |
|------|--------|
| ClickHouse 新表创建 | 0.5 天 |
| CreativePredictor 实现 | 2 天 |
| RetroEngine 实现 | 2 天 |
| API 端点 | 1 天 |
| 前端回看 Tab | 2 天 |
| 投放标记集成 | 1.5 天 |
| **合计** | **9 天** |

---

# 第六部分：Phase 4 — 管理者模式同步

> **前提条件：Phase 3 完成。将标准模式的改动映射到管理者模式。**

## 6.1 设计原则

- 标准模式 = 素材级视角（单人单素材深度分析）
- 管理者模式 = 设计师级视角（团队横向对比+排名）
- 新增 section 而非修改现有 section，避免回归问题

## 6.2 DesignerStats 接口扩展

```typescript
interface DesignerStats {
  // ═══ 现有约50个字段 ═══
  // ...

  // ═══ Phase 4 新增 ═══
  formulaHealthSummary: {
    totalFormulas: number;
    healthyFormulas: number;
    needsUpdateFormulas: number;
    avgLift: number;
  };
  retroSummary: {
    totalRetros: number;
    normalRate: number;
    severeRate: number;
    avgRankError: number;
  };
}
```

## 6.3 ManagerDataDiagnosis 新增第七章

```typescript
// 在现有六章基础上新增

const chapter7 = {
  title: '七、公式健康度团队视图',
  sections: [
    // ─── 7.1 团队公式健康度总览 ───
    {
      title: '7.1 团队公式健康度总览',
      content: (
        <Descriptions column={3} bordered>
          <Descriptions.Item label="团队平均提升度">
            <Tag color={teamAvgLift > 1.1 ? 'green' : 'orange'}>{teamAvgLift.toFixed(2)}x</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="健康公式占比">{healthyFormulaRate}%</Descriptions.Item>
          <Descriptions.Item label="需要更新的公式">{needsUpdateCount}个</Descriptions.Item>
        </Descriptions>
      ),
    },

    // ─── 7.2 设计师公式使用排名 ───
    {
      title: '7.2 设计师公式使用排名',
      content: (
        <Table
          pagination={false}
          columns={[
            { title: '排名', render: (_, __, i) => i + 1, width: 60 },
            { title: '设计师', dataIndex: 'name' },
            {
              title: '公式命中率',
              dataIndex: 'formulaHitRate',
              render: (v: number) => <Progress percent={Math.round(v * 100)} size="small" />,
              sorter: (a, b) => a.formulaHitRate - b.formulaHitRate,
            },
            {
              title: '平均提升度',
              dataIndex: 'avgLift',
              render: (v: number) => <Tag color={v > 1.1 ? 'green' : 'orange'}>{v.toFixed(2)}x</Tag>,
              sorter: (a, b) => a.avgLift - b.avgLift,
            },
            {
              title: '回看偏差率',
              dataIndex: 'severeRate',
              render: (v: number) => <Tag color={v > 0.3 ? 'red' : 'green'}>{(v * 100).toFixed(0)}%</Tag>,
              sorter: (a, b) => a.severeRate - b.severeRate,
            },
          ]}
          dataSource={designerFormulaRanking}
        />
      ),
    },

    // ─── 7.3 公式健康度全景 ───
    {
      title: '7.3 公式健康度全景',
      content: (
        <Table
          pagination={false}
          columns={[
            { title: '公式', dataIndex: 'formulaName' },
            {
              title: '团队命中率',
              dataIndex: 'teamHitRate',
              render: (v: number) => (
                <Progress
                  percent={Math.round(v * 100)}
                  status={v > 0.7 ? 'success' : v > 0.5 ? 'active' : 'exception'}
                />
              ),
            },
            {
              title: '使用人数',
              dataIndex: 'userCount',
            },
            {
              title: '状态',
              dataIndex: 'needsUpdate',
              render: (v: boolean) =>
                v ? <Tag color="red">需要更新</Tag> : <Tag color="green">健康</Tag>,
            },
          ]}
          dataSource={formulaHealthOverview}
        />
      ),
    },
  ],
};
```

## 6.4 ManagerDashboard 改动

### DesignerCard 新增 section

```typescript
const getCardSections = (designer: DesignerStats): CardSection[] => [
  // ═══ 现有 section ═══
  // ...

  // ═══ Phase 4 新增 ═══
  {
    title: '🧪 公式健康度',
    content: (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <Tag color={designer.formulaHealthSummary.avgLift > 1.1 ? 'green' : 'orange'}>
          提升度 {designer.formulaHealthSummary.avgLift.toFixed(2)}x
        </Tag>
        <Tag color={designer.formulaHealthSummary.needsUpdateFormulas > 0 ? 'red' : 'green'}>
          {designer.formulaHealthSummary.healthyFormulas}/{designer.formulaHealthSummary.totalFormulas} 健康
        </Tag>
        {designer.retroSummary.totalRetros > 0 && (
          <Tag color={designer.retroSummary.severeRate > 0.3 ? 'red' : 'green'}>
            回看偏差率 {(designer.retroSummary.severeRate * 100).toFixed(0)}%
          </Tag>
        )}
      </div>
    ),
  },
];
```

## 6.5 ManagerReports 改动

### 新增图表：花费 vs 公式提升度散点图

```typescript
const formulaScatterChart = {
  title: '花费 vs 公式提升度',
  tooltip: {
    formatter: (params) =>
      `${params.data.name}\n花费: $${params.data.x.toLocaleString()}\n提升度: ${params.data.y.toFixed(2)}x`,
  },
  xAxis: { name: '总花费 ($)', type: 'log' },
  yAxis: { name: '公式提升度', min: 0, max: 3 },
  series: [{
    type: 'scatter',
    data: designers.map(d => ({
      x: d.totalSpend,
      y: d.formulaHealthSummary.avgLift,
      name: d.name,
      symbolSize: Math.max(10, d.materialCount / 2),
      itemStyle: {
        color: d.formulaHealthSummary.avgLift > 1.1 ? '#52c41a' :
               d.formulaHealthSummary.avgLift > 0.9 ? '#faad14' : '#ff4d4f',
      },
    })),
  }],
  markLine: {
    data: [{ yAxis: 1, label: '基线', lineStyle: { color: '#999', type: 'dashed' } }],
  },
};
```

## 6.6 工期：1.5 周

| 任务 | 工作量 |
|------|--------|
| DesignerStats 接口扩展 + computeDesignerStats 新增字段 | 1 天 |
| ManagerDataDiagnosis 第七章 | 2 天 |
| ManagerDashboard 卡片 section | 1 天 |
| ManagerReports 散点图 | 1 天 |
| 集成测试 | 1 天 |
| **合计** | **6 天** |

---

# 第七部分：实施路线图

## 7.1 总览

```
Phase 0: 数据验证实验（1-2周）
    ↓ NDCG@5 > 0.6?
    ↓
    ├── 是 → Phase 1: 公式健康度（1周）
    │           ↓
    │       Phase 2: 权重进化（2周）
    │           ↓
    │       Phase 3: 投放闭环（2周）
    │           ↓
    │       Phase 4: 管理者同步（1.5周）
    │
    └── 否 → Phase 1: 公式健康度（1周）
                ↓
            转向"回顾性分析"路线
            （不做预测，只做事后分析和公式淘汰）
```

## 7.2 详细工期

| Phase | 任务 | 工期 | 前置条件 | 涉及模块 |
|-------|------|------|---------|---------|
| **0** | 数据对齐 + 标签区分度分析 + 公式回测 + 排名可预测性评估 | 1-2 周 | 无 | 🧠DATA |
| **1** | 公式健康度计算 + Workshop 健康度指示器 + 标签有效性雷达图 | 1 周 | 无 | 🎨CREATIVE |
| **2** | 权重优化 + 交叉验证 + 进化面板 + 人工审核 | 2 周 | Phase 0 通过 | 🧠DATA + 🎨CREATIVE |
| **3** | 投前评分 + 投放标记 + T+7 回看 + 进化触发 | 2 周 | Phase 2 完成 | 🎨CREATIVE + 🧠DATA |
| **4** | DesignerStats 扩展 + ManagerDataDiagnosis 第七章 + 管理者回看汇总 | 1.5 周 | Phase 3 完成 | 🧠DATA + 🎨CREATIVE |

**总工期：7.5-9.5 周**（比 v2 的 12-15 周更短，且 Phase 0 后可以提前止损）

## 7.3 里程碑和 Go/No-Go 决策点

| 时间点 | 里程碑 | Go/No-Go 条件 |
|--------|--------|--------------|
| **第 2 周末** | Phase 0 完成 | NDCG@5 > 0.6 → 继续；< 0.5 → 转向回顾性路线 |
| **第 3 周末** | Phase 1 完成 | 公式健康度上线，可独立使用 |
| **第 5 周末** | Phase 2 完成 | 权重进化可用，观察 1 周效果 |
| **第 7 周末** | Phase 3 完成 | 投放闭环可用 |
| **第 9 周末** | Phase 4 完成 | 管理者模式同步完成 |

---

# 第八部分：风险与应对

| 风险 | 概率 | 影响 | 应对 |
|------|------|------|------|
| Phase 0 验证不通过 | 中 | 预测功能无法建设 | 转向回顾性分析路线（Phase 1 照做） |
| 标签数据不足 | 中 | 公式健康度无法计算 | 降低最低样本量阈值，接受低置信度 |
| 回测过拟合 | 低 | 进化后的权重不泛化 | 交叉验证 + 提升阈值 5% |
| 回看数据延迟 | 中 | 闭环周期过长 | T+7 回看（而非 T+3），接受延迟 |
| 管理者模式改动影响现有功能 | 低 | 回归问题 | 新增 section 而非修改现有 section |

---

# 总结

## v3 的核心理念

> **先证明"预测"有价值，再建设预测系统。用数据说话，不用假设驱动。**

## 一句话总结

Phase 0 用 1-2 周验证"标签能否预测 ROAS 排名"。能 → 建闭环；不能 → 做回顾性分析。不管哪种结果，Phase 1 的公式健康度都有价值。

## 与 Cheat-on-Content 的关系

v3 借鉴了 Cheat-on-Content 的**思维方式**（预测→复盘→进化），但没有照搬它的**实现方式**（盲预测、影子模式）。因为广告买量和内容创作是两个不同的领域，思维方式可以迁移，实现必须适配。

## 立即行动

如果你想开始，第一步是：

```bash
# 在后端运行 Phase 0 实验
cd game-ad-system
python -m src.creative.experiment --account-id default
```

这会输出一份报告，告诉你"标签能否预测 ROAS 排名"，然后你再决定要不要继续。

---

*v3 文档完成 | 2026-06-02*