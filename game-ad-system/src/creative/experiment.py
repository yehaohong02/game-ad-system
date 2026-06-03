"""
Phase 0 数据验证实验

核心问题：从素材标签 + 行为特征能否预测 ROAS 排名？

改造要点：
1. 特征从 10 个二值标签 → 30 个连续值特征
2. 评估指标增加 Spearman ρ（排名相关性）
3. 公式匹配用 scene_scores 加权和替代 set 交集
4. t 检验改为独立样本 t 检验
"""

from dataclasses import dataclass, field
from typing import Optional

import numpy as np
from scipy import stats

from src.creative.feature_matrix import (
    FEATURE_NAMES,
    NUM_FEATURES,
    SCENE_LABELS,
    FeatureVector,
    build_feature_matrix,
)


@dataclass
class FeatureImportance:
    """单个特征的重要性分析"""
    feature: str
    spearman_rho: float
    pvalue: float
    is_significant: bool


@dataclass
class FormulaBacktest:
    """公式回测结果"""
    formula_id: str
    formula_name: str
    matched_count: int
    matched_avg_roas: float
    unmatched_avg_roas: float
    lift: float
    ttest_pvalue: float
    is_significant: bool


@dataclass
class PredictabilityReport:
    """排名可预测性报告"""
    spearman_rho: float
    spearman_pvalue: float
    ndcg_at_5: float
    ndcg_at_10: float
    sample_count: int
    feature_count: int
    feature_importance: dict[str, float]  # Ridge 模型系数（每个特征的重要性权重）
    recommendation: str       # 'go' / 'no-go' / 'borderline'
    details: str


class Phase0Experiment:
    """
    Phase 0 数据验证实验（连续值版）

    核心变化（vs v3 原版）：
    1. 特征：10 个二值 → 30 个连续值
    2. 匹配：set 交集 → scene_scores 加权和 > 阈值
    3. 统计：ttest_1samp → ttest_ind（独立样本）
    4. 指标：NDCG → Spearman ρ（主指标）
    """

    # Go/No-Go 阈值
    SPEARMAN_GO_THRESHOLD = 0.4
    SPEARMAN_NOGO_THRESHOLD = 0.2
    NDCG_GO_THRESHOLD = 0.6
    MIN_SAMPLES = 30
    MATCH_SCORE_THRESHOLD = 0.3  # 公式匹配阈值

    def __init__(self, feature_vectors: list[FeatureVector], formulas: list[dict]):
        """
        Args:
            feature_vectors: 特征向量列表
            formulas: 公式列表，每个含 id, name, tags/categories
        """
        self.vectors = [v for v in feature_vectors if v.roas is not None and v.roas > 0]
        self.formulas = formulas

    def run_full_experiment(self) -> dict:
        """运行完整实验，返回结构化结果"""
        if len(self.vectors) < self.MIN_SAMPLES:
            return {
                'status': 'insufficient_data',
                'message': f'素材数量不足（{len(self.vectors)} < {self.MIN_SAMPLES}）',
                'recommendation': 'no-go',
            }

        # Step 1: 特征重要性分析
        feature_importance = self._analyze_feature_importance()

        # Step 2: 公式命中率回测（加权匹配 + 独立样本 t 检验）
        formula_backtests = self._backtest_formulas()

        # Step 3: 排名可预测性评估
        predictability = self._evaluate_predictability()

        # 汇总
        effective_formulas = [f for f in formula_backtests if f.is_significant]

        return {
            'status': 'completed',
            'sample_count': len(self.vectors),
            'feature_count': NUM_FEATURES,
            'feature_importance': [
                {
                    'feature': fi.feature,
                    'spearman_rho': fi.spearman_rho,
                    'pvalue': fi.pvalue,
                    'is_significant': fi.is_significant,
                }
                for fi in feature_importance
            ],
            'formula_backtest': {
                'total_formulas': len(formula_backtests),
                'effective_formulas': len(effective_formulas),
                'results': [
                    {
                        'formula_id': fb.formula_id,
                        'formula_name': fb.formula_name,
                        'matched_count': fb.matched_count,
                        'matched_avg_roas': fb.matched_avg_roas,
                        'unmatched_avg_roas': fb.unmatched_avg_roas,
                        'lift': fb.lift,
                        'ttest_pvalue': fb.ttest_pvalue,
                        'is_significant': fb.is_significant,
                    }
                    for fb in formula_backtests
                ],
            },
            'predictability': {
                'spearman_rho': predictability.spearman_rho,
                'spearman_pvalue': predictability.spearman_pvalue,
                'ndcg_at_5': predictability.ndcg_at_5,
                'ndcg_at_10': predictability.ndcg_at_10,
                'sample_count': predictability.sample_count,
                'feature_count': predictability.feature_count,
                'recommendation': predictability.recommendation,
                'details': predictability.details,
            },
            'recommendation': predictability.recommendation,
        }

    def _analyze_feature_importance(self) -> list[FeatureImportance]:
        """分析每个特征对 ROAS 的预测重要性（Spearman 相关系数）"""
        X, y, _ = build_feature_matrix(self.vectors)

        if len(y) == 0:
            return []

        results: list[FeatureImportance] = []
        for i, name in enumerate(FEATURE_NAMES):
            col = X[:, i]
            if np.std(col) < 1e-8:
                continue  # 常数特征跳过
            rho, pvalue = stats.spearmanr(col, y)
            results.append(FeatureImportance(
                feature=name,
                spearman_rho=round(float(rho), 4),
                pvalue=round(float(pvalue), 4),
                is_significant=pvalue < 0.05,
            ))

        results.sort(key=lambda r: abs(r.spearman_rho), reverse=True)
        return results

    def _backtest_formulas(self) -> list[FormulaBacktest]:
        """回测每个公式（加权匹配 + 独立样本 t 检验）"""
        X, y, _ = build_feature_matrix(self.vectors)

        results: list[FormulaBacktest] = []
        for formula in self.formulas:
            formula_tags = set(formula.get('tags', []))
            category_tags = set(formula.get('categories', []))
            all_tags = formula_tags | category_tags

            # 用 scene_scores 的加权和作为匹配度
            matched_indices: list[int] = []
            for i, v in enumerate(self.vectors):
                scene_scores = v.features
                match_score = sum(
                    scene_scores.get(f"scene_{tag}", 0.0)
                    for tag in all_tags
                    if f"scene_{tag}" in FEATURE_NAMES
                )
                if match_score > self.MATCH_SCORE_THRESHOLD:
                    matched_indices.append(i)

            if len(matched_indices) < 3:
                results.append(FormulaBacktest(
                    formula_id=formula['id'],
                    formula_name=formula['name'],
                    matched_count=len(matched_indices),
                    matched_avg_roas=0.0,
                    unmatched_avg_roas=0.0,
                    lift=0.0,
                    ttest_pvalue=1.0,
                    is_significant=False,
                ))
                continue

            matched_roas = y[matched_indices]
            unmatched_mask = np.ones(len(y), dtype=bool)
            unmatched_mask[matched_indices] = False
            unmatched_roas = y[unmatched_mask]

            matched_avg = float(np.mean(matched_roas))
            unmatched_avg = float(np.mean(unmatched_roas)) if len(unmatched_roas) > 0 else 0.0
            lift = matched_avg / unmatched_avg if unmatched_avg > 0 else 0.0

            # 独立样本 t 检验
            if len(unmatched_roas) > 0:
                _, pvalue = stats.ttest_ind(matched_roas, unmatched_roas)
            else:
                pvalue = 1.0

            results.append(FormulaBacktest(
                formula_id=formula['id'],
                formula_name=formula['name'],
                matched_count=len(matched_indices),
                matched_avg_roas=round(matched_avg, 4),
                unmatched_avg_roas=round(unmatched_avg, 4),
                lift=round(lift, 2),
                ttest_pvalue=round(float(pvalue), 4),
                is_significant=pvalue < 0.05 and lift > 1.0,
            ))

        return results

    def _evaluate_predictability(self) -> PredictabilityReport:
        """评估排名可预测性（Spearman ρ + NDCG）"""
        from sklearn.linear_model import Ridge
        from sklearn.model_selection import LeaveOneOut

        X, y, _ = build_feature_matrix(self.vectors)

        if len(y) < 5:
            return PredictabilityReport(
                spearman_rho=0.0, spearman_pvalue=1.0,
                ndcg_at_5=0.0, ndcg_at_10=0.0,
                sample_count=len(self.vectors), feature_count=0,
                feature_importance={},
                recommendation='no-go',
                details='样本量不足，无法评估',
            )

        if X.shape[1] == 0:
            return PredictabilityReport(
                spearman_rho=0.0, spearman_pvalue=1.0,
                ndcg_at_5=0.0, ndcg_at_10=0.0,
                sample_count=len(self.vectors), feature_count=0,
                feature_importance={},
                recommendation='no-go',
                details='没有可用的特征',
            )

        # Ridge 回归 + Leave-One-Out 交叉验证
        loo = LeaveOneOut()
        predictions = np.zeros(len(y))

        for train_idx, test_idx in loo.split(X):
            model = Ridge(alpha=1.0)
            model.fit(X[train_idx], y[train_idx])
            predictions[test_idx] = model.predict(X[test_idx])

        # Spearman ρ（排名相关性）
        spearman_rho, spearman_p = stats.spearmanr(y, predictions)

        # NDCG
        ndcg_5 = self._ndcg_at_k(y, predictions, k=5)
        ndcg_10 = self._ndcg_at_k(y, predictions, k=10)

        # 推荐
        if spearman_rho >= self.SPEARMAN_GO_THRESHOLD:
            recommendation = 'go'
            details = (
                f'Spearman ρ={spearman_rho:.3f} >= {self.SPEARMAN_GO_THRESHOLD}，'
                f'特征有排名预测能力，建议建设闭环系统'
            )
        elif spearman_rho <= self.SPEARMAN_NOGO_THRESHOLD:
            recommendation = 'no-go'
            details = (
                f'Spearman ρ={spearman_rho:.3f} <= {self.SPEARMAN_NOGO_THRESHOLD}，'
                f'特征预测能力不足，建议转向回顾性分析'
            )
        else:
            recommendation = 'borderline'
            details = (
                f'Spearman ρ={spearman_rho:.3f} 处于灰色地带，'
                f'建议先做 Phase 1（公式健康度），观察效果后再决定'
            )

        # 特征重要性：用 Ridge 模型系数衡量每个特征对 ROAS 的贡献
        model_full = Ridge(alpha=1.0)
        model_full.fit(X, y)
        feature_importance = {
            name: round(float(coef), 4)
            for name, coef in zip(FEATURE_NAMES, model_full.coef_)
        }

        return PredictabilityReport(
            spearman_rho=round(float(spearman_rho), 4),
            spearman_pvalue=round(float(spearman_p), 4),
            ndcg_at_5=round(float(ndcg_5), 4),
            ndcg_at_10=round(float(ndcg_10), 4),
            sample_count=len(self.vectors),
            feature_count=X.shape[1],
            feature_importance=feature_importance,
            recommendation=recommendation,
            details=details,
        )

    @staticmethod
    def _ndcg_at_k(y_true: np.ndarray, y_pred: np.ndarray, k: int) -> float:
        """计算 NDCG@k"""
        order = np.argsort(y_pred)[::-1]
        y_true_sorted = y_true[order]
        dcg = sum(
            y_true_sorted[i] / np.log2(i + 2)
            for i in range(min(k, len(y_true_sorted)))
        )
        y_true_ideal = np.sort(y_true)[::-1]
        idcg = sum(
            y_true_ideal[i] / np.log2(i + 2)
            for i in range(min(k, len(y_true_ideal)))
        )
        return dcg / idcg if idcg > 0 else 0.0