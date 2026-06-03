import {
  Card, Row, Col, Button, Tag, Typography, Spin, Table, Alert, Space, Progress, Upload, Divider,
} from 'antd';
import {
  ExperimentOutlined, RocketOutlined, StopOutlined, ThunderboltOutlined,
  BarChartOutlined, CheckCircleOutlined, CloseCircleOutlined,
  WarningOutlined, InfoCircleOutlined, AimOutlined, UploadOutlined,
  FileExcelOutlined, DatabaseOutlined, BulbOutlined, ReloadOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useExperimentStore, FeatureImportanceItem, FormulaBacktestItem } from '../stores/experiment';

const { Text, Title } = Typography;

// ─── 主题色 ───
const cardBg = '#1E293B';
const border = '#334155';
const green = '#10b981';
const red = '#ef4444';
const yellow = '#f59e0b';
const blue = '#3b82f6';
const purple = '#8b5cf6';
const cyan = '#06b6d4';
const textPrimary = '#E2E8F0';
const textSecondary = '#94A3B8';
const textMuted = '#64748b';

/** 安全 toFixed，防御 undefined/null/NaN */
const fmt = (v: number | undefined | null, d = 2) => (v ?? 0).toFixed(d);

// ─── 区块标题 ───
function SectionTitle({ icon, title, subtitle, color }: { icon: React.ReactNode; title: string; subtitle?: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8,
        background: `${color || blue}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: color || blue, fontSize: 18,
      }}>{icon}</div>
      <div>
        <Text strong style={{ color: textPrimary, fontSize: 18 }}>{title}</Text>
        {subtitle && <div style={{ color: textMuted, fontSize: 12, marginTop: 2 }}>{subtitle}</div>}
      </div>
    </div>
  );
}

// ─── 统计卡片 ───
function StatCard({ icon, label, value, suffix, color, sub }: {
  icon: React.ReactNode; label: string; value: number | string; suffix?: string; color: string; sub?: string;
}) {
  return (
    <Card style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12 }}
      styles={{ body: { padding: '20px 24px' } }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: `${color}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color, fontSize: 22,
        }}>{icon}</div>
        <div>
          <div style={{ color: textMuted, fontSize: 13, marginBottom: 4 }}>{label}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ color: textPrimary, fontSize: 28, fontWeight: 700 }}>{value}</span>
            {suffix && <span style={{ color: textMuted, fontSize: 14 }}>{suffix}</span>}
          </div>
          {sub && <div style={{ color: textMuted, fontSize: 11, marginTop: 2 }}>{sub}</div>}
        </div>
      </div>
    </Card>
  );
}

// ─── Go/No-Go 决策卡片 ───
function RecommendationCard({ recommendation, details, rho, ndcg5, ndcg10 }: {
  recommendation: string; details: string; rho: number; ndcg5: number; ndcg10: number;
}) {
  const config: Record<string, { icon: React.ReactNode; color: string; label: string; sub: string; bg: string; gradient: string }> = {
    go: {
      icon: <RocketOutlined />, color: green, label: 'GO', sub: '建议建设闭环系统',
      bg: '#10B98112', gradient: 'linear-gradient(135deg, #10B98120 0%, #10B98105 100%)',
    },
    'no-go': {
      icon: <StopOutlined />, color: red, label: 'NO-GO', sub: '特征预测能力不足',
      bg: '#EF444412', gradient: 'linear-gradient(135deg, #EF444420 0%, #EF444405 100%)',
    },
    borderline: {
      icon: <WarningOutlined />, color: yellow, label: 'BORDERLINE', sub: '灰色地带，需进一步验证',
      bg: '#F59E0B12', gradient: 'linear-gradient(135deg, #F59E0B20 0%, #F59E0B05 100%)',
    },
  };
  const c = config[recommendation] || config.borderline;

  return (
    <Card style={{ background: c.gradient, border: `2px solid ${c.color}30`, borderRadius: 16 }}
      styles={{ body: { padding: '32px 40px' } }}>
      <Row gutter={32} align="middle">
        <Col span={5}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 80, height: 80, borderRadius: 20, margin: '0 auto 12px',
              background: `${c.color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 40, color: c.color,
            }}>{c.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: c.color, letterSpacing: 2 }}>{c.label}</div>
            <div style={{ color: textSecondary, fontSize: 13, marginTop: 4 }}>{c.sub}</div>
          </div>
        </Col>
        <Col span={19}>
          <Row gutter={24}>
            <Col span={8}>
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ color: textMuted, fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Spearman ρ</div>
                <div style={{ fontSize: 42, fontWeight: 800, color: c.color }}>{fmt(rho, 3)}</div>
                <div style={{ color: textMuted, fontSize: 11, marginTop: 4 }}>
                  {rho >= 0.4 ? '强预测力' : rho >= 0.2 ? '中等预测力' : '弱预测力'}
                </div>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ color: textMuted, fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>NDCG@5</div>
                <div style={{ fontSize: 42, fontWeight: 800, color: blue }}>{fmt(ndcg5, 3)}</div>
                <div style={{ color: textMuted, fontSize: 11, marginTop: 4 }}>
                  Top5 排名质量
                </div>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ color: textMuted, fontSize: 12, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>NDCG@10</div>
                <div style={{ fontSize: 42, fontWeight: 800, color: purple }}>{fmt(ndcg10, 3)}</div>
                <div style={{ color: textMuted, fontSize: 11, marginTop: 4 }}>
                  Top10 排名质量
                </div>
              </div>
            </Col>
          </Row>
          <Divider style={{ margin: '8px 0 12px', borderColor: `${border}80` }} />
          <Alert message={details} type={recommendation === 'go' ? 'success' : recommendation === 'no-go' ? 'error' : 'warning'}
            showIcon style={{ background: 'transparent', border: 'none', padding: 0 }} />
        </Col>
      </Row>
    </Card>
  );
}

// ─── 特征重要性条形图 ───
function FeatureImportanceChart({ data }: { data: FeatureImportanceItem[] }) {
  const sorted = [...data].sort((a, b) => b.spearman_rho - a.spearman_rho);
  const top = sorted.slice(0, 15);
  const bottom = sorted.slice(-5);
  const display = [...new Set([...top, ...bottom])];

  const categories = display.map(d => {
    const name = d.feature.replace('scene_', '🎨').replace('audio_', '🔊').replace('dur_', '⏱').replace('behav_', '📊');
    return name;
  });
  const values = display.map(d => d.spearman_rho);
  const colors = values.map(v => v > 0 ? green : v < 0 ? red : textMuted);

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const p = params[0];
        const item = display[p.dataIndex];
        return `<b>${item.feature}</b><br/>Spearman ρ: ${fmt(item.spearman_rho, 4)}<br/>p-value: ${fmt(item.pvalue, 4)}<br/>${item.is_significant ? '✅ 显著' : '❌ 不显著'}`;
      },
    },
    grid: { left: 160, right: 30, top: 10, bottom: 30 },
    xAxis: {
      type: 'value',
      axisLabel: { color: textMuted },
      splitLine: { lineStyle: { color: '#1E293B' } },
    },
    yAxis: {
      type: 'category',
      data: categories,
      axisLabel: { color: textSecondary, fontSize: 11 },
      inverse: true,
    },
    series: [{
      type: 'bar',
      data: values.map((v, i) => ({
        value: v,
        itemStyle: { color: colors[i], borderRadius: [0, 4, 4, 0] },
      })),
      barWidth: 16,
    }],
  };

  return (
    <Card style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12 }}
      styles={{ body: { padding: '16px 20px' } }}>
      <SectionTitle icon={<BarChartOutlined />} title="特征重要性排名" subtitle="Spearman ρ 相关系数（与 ROAS）" color={blue} />
      <ReactECharts option={option} style={{ height: Math.max(400, display.length * 28) }} />
    </Card>
  );
}

// ─── 特征类别雷达图 ───
function FeatureCategoryRadar({ data }: { data: FeatureImportanceItem[] }) {
  const categories = {
    '视觉场景': data.filter(d => d.feature.startsWith('scene_')),
    '音频特征': data.filter(d => d.feature.startsWith('audio_')),
    '时长分桶': data.filter(d => d.feature.startsWith('dur_')),
    '行为特征': data.filter(d => d.feature.startsWith('behav_')),
  };

  const names = Object.keys(categories);
  const avgRho = names.map(name => {
    const items = categories[name as keyof typeof categories];
    if (items.length === 0) return 0;
    return Math.abs(items.reduce((s, d) => s + d.spearman_rho, 0) / items.length);
  });
  const sigCount = names.map(name => {
    const items = categories[name as keyof typeof categories];
    return items.filter(d => d.is_significant).length;
  });
  const totalCounts = names.map(name => categories[name as keyof typeof categories].length);

  const option = {
    backgroundColor: 'transparent',
    tooltip: {},
    radar: {
      indicator: names.map(name => ({ name, max: 0.5 })),
      axisName: { color: textSecondary, fontSize: 13 },
      splitArea: { areaStyle: { color: ['#0F172A', '#1E293B'] } },
      splitLine: { lineStyle: { color: '#334155' } },
      axisLine: { lineStyle: { color: '#334155' } },
    },
    series: [{
      type: 'radar',
      data: [{
        value: avgRho,
        name: '平均 |ρ|',
        areaStyle: { color: `${blue}30` },
        lineStyle: { color: blue, width: 2 },
        itemStyle: { color: blue },
      }],
    }],
  };

  return (
    <Card style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12 }}
      styles={{ body: { padding: '16px 20px' } }}>
      <SectionTitle icon={<AimOutlined />} title="特征类别对比" subtitle="四类特征的平均预测力" color={purple} />
      <ReactECharts option={option} style={{ height: 320 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
        {names.map((name, i) => (
          <div key={name} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 12px', background: '#0F172A', borderRadius: 8,
          }}>
            <span style={{ color: textSecondary, fontSize: 12 }}>{name}</span>
            <span style={{ color: textPrimary, fontSize: 13, fontWeight: 600 }}>
              <span style={{ color: green }}>{sigCount[i]}</span>
              <span style={{ color: textMuted }}>/</span>
              <span>{totalCounts[i]}</span>
              <span style={{ color: textMuted, fontSize: 11, marginLeft: 4 }}>显著</span>
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── 模型系数瀑布图 ───
function ModelCoefficientsChart({ coefficients }: { coefficients: Record<string, number> }) {
  const entries = Object.entries(coefficients)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .slice(0, 20);

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const p = params[0];
        return `<b>${p.name}</b><br/>Ridge 系数: ${p.value}`;
      },
    },
    grid: { left: 160, right: 30, top: 10, bottom: 30 },
    xAxis: {
      type: 'value',
      axisLabel: { color: textMuted },
      splitLine: { lineStyle: { color: '#1E293B' } },
    },
    yAxis: {
      type: 'category',
      data: entries.map(([k]) => k.replace('scene_', '🎨').replace('audio_', '🔊').replace('dur_', '⏱').replace('behav_', '📊')),
      axisLabel: { color: textSecondary, fontSize: 11 },
      inverse: true,
    },
    series: [{
      type: 'bar',
      data: entries.map(([, v]) => ({
        value: v,
        itemStyle: { color: v > 0 ? green : red, borderRadius: v > 0 ? [0, 4, 4, 0] : [4, 0, 0, 4] },
      })),
      barWidth: 16,
    }],
  };

  return (
    <Card style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12 }}
      styles={{ body: { padding: '16px 20px' } }}>
      <SectionTitle icon={<ThunderboltOutlined />} title="Ridge 回归系数" subtitle="特征对 ROAS 的贡献权重（正=正相关，负=负相关）" color={cyan} />
      <ReactECharts option={option} style={{ height: Math.max(360, entries.length * 28) }} />
    </Card>
  );
}

// ─── 公式回测表格 ───
function FormulaBacktestTable({ data }: { data: FormulaBacktestItem[] }) {
  const columns = [
    { title: '公式', dataIndex: 'formula_name', key: 'name',
      render: (name: string) => <Text strong style={{ color: textPrimary }}>{name}</Text> },
    { title: '命中数', dataIndex: 'matched_count', key: 'count', width: 80,
      render: (n: number) => <Tag color={n >= 3 ? 'blue' : 'default'}>{n}</Tag> },
    { title: '命中 ROAS', dataIndex: 'matched_avg_roas', key: 'matched', width: 110,
      render: (v: number) => <Text style={{ color: green, fontWeight: 600 }}>{fmt(v)}</Text> },
    { title: '未命中 ROAS', dataIndex: 'unmatched_avg_roas', key: 'unmatched', width: 110,
      render: (v: number) => <Text style={{ color: textMuted }}>{fmt(v)}</Text> },
    { title: 'Lift', dataIndex: 'lift', key: 'lift', width: 80,
      render: (v: number) => <Text style={{ color: (v ?? 0) > 1 ? green : red, fontWeight: 700 }}>{fmt(v)}x</Text> },
    { title: 'p-value', dataIndex: 'ttest_pvalue', key: 'pvalue', width: 100,
      render: (v: number) => <Text style={{ color: (v ?? 1) < 0.05 ? green : textMuted }}>{fmt(v, 4)}</Text> },
    { title: '结论', dataIndex: 'is_significant', key: 'sig', width: 110,
      render: (sig: boolean) => sig
        ? <Tag icon={<CheckCircleOutlined />} color="success">显著有效</Tag>
        : <Tag icon={<CloseCircleOutlined />} color="default">不显著</Tag> },
  ];

  return (
    <Card style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12 }}
      styles={{ body: { padding: '16px 20px' } }}>
      <SectionTitle icon={<ExperimentOutlined />} title="公式命中率回测" subtitle="基于 scene_scores 加权匹配 + 独立样本 t 检验" color={yellow} />
      <Table dataSource={data} columns={columns} rowKey="formula_id" pagination={false} size="small"
        style={{ marginTop: 8 }}
        onRow={(record) => ({
          style: { background: record.is_significant ? '#10B98108' : 'transparent' },
        })}
      />
    </Card>
  );
}

// ─── 特征详情表格 ───
function FeatureDetailTable({ data }: { data: FeatureImportanceItem[] }) {
  const columns = [
    { title: '特征名', dataIndex: 'feature', key: 'feature',
      render: (name: string) => {
        const prefix = name.split('_')[0];
        const iconMap: Record<string, string> = { scene: '🎨', audio: '🔊', dur: '⏱', behav: '📊' };
        return <Text style={{ color: textPrimary }}>{iconMap[prefix] || ''} {name}</Text>;
      },
      filters: [
        { text: '🎨 视觉', value: 'scene_' },
        { text: '🔊 音频', value: 'audio_' },
        { text: '⏱ 时长', value: 'dur_' },
        { text: '📊 行为', value: 'behav_' },
      ],
      onFilter: (value: any, record: FeatureImportanceItem) => record.feature.startsWith(value),
    },
    { title: 'Spearman ρ', dataIndex: 'spearman_rho', key: 'rho', width: 130, sorter: (a: FeatureImportanceItem, b: FeatureImportanceItem) => a.spearman_rho - b.spearman_rho,
      render: (v: number) => {
        const abs = Math.abs(v ?? 0);
        const color = abs > 0.3 ? green : abs > 0.15 ? yellow : textMuted;
        return <Text style={{ color, fontWeight: 600 }}>{fmt(v, 4)}</Text>;
      },
    },
    { title: 'p-value', dataIndex: 'pvalue', key: 'pvalue', width: 110, sorter: (a: FeatureImportanceItem, b: FeatureImportanceItem) => a.pvalue - b.pvalue,
      render: (v: number) => <Text style={{ color: (v ?? 1) < 0.05 ? green : textMuted }}>{fmt(v, 4)}</Text>,
    },
    { title: '显著性', dataIndex: 'is_significant', key: 'sig', width: 80,
      render: (sig: boolean) => sig
        ? <Tag color="success">显著</Tag>
        : <Tag color="default">不显著</Tag>,
    },
    { title: '强度', dataIndex: 'spearman_rho', key: 'strength', width: 120,
      render: (v: number) => {
        const abs = Math.abs(v ?? 0);
        const pct = Math.min(abs / 0.5 * 100, 100);
        const color = abs > 0.3 ? green : abs > 0.15 ? yellow : red;
        return <Progress percent={pct} size="small" strokeColor={color} showInfo={false} />;
      },
    },
  ];

  return (
    <Card style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12 }}
      styles={{ body: { padding: '16px 20px' } }}>
      <SectionTitle icon={<InfoCircleOutlined />} title="全部特征详情" subtitle="34 维特征的 Spearman 相关系数与显著性" color={cyan} />
      <Table dataSource={data} columns={columns} rowKey="feature" size="small"
        pagination={{ pageSize: 15, showSizeChanger: false }}
        style={{ marginTop: 8 }} />
    </Card>
  );
}

// ─── 数据质量提示 ───
function DataQualityInsights({ result }: { result: any }) {
  const warnings: { icon: React.ReactNode; text: string; color: string }[] = [];

  // 检查各类特征是否有数据
  const fi = result.feature_importance as FeatureImportanceItem[];
  const zeroFeatures = fi.filter(f => Math.abs(f.spearman_rho) < 0.001);
  if (zeroFeatures.length > 5) {
    warnings.push({
      icon: <WarningOutlined />,
      text: `${zeroFeatures.length} 个特征相关性接近 0，可能是 CLIP 标签缺失或样本量不足`,
      color: yellow,
    });
  }

  // 样本量检查
  if (result.sample_count < 20) {
    warnings.push({
      icon: <InfoCircleOutlined />,
      text: `样本量仅 ${result.sample_count} 条，结论仅供参考，建议积累 50+ 条数据后重跑`,
      color: yellow,
    });
  }

  // 显著特征占比
  const sigRatio = fi.filter(f => f.is_significant).length / fi.length;
  if (sigRatio < 0.2) {
    warnings.push({
      icon: <BulbOutlined />,
      text: `仅 ${(sigRatio * 100).toFixed(0)}% 特征显著（<20%），当前标签体系区分度较低`,
      color: cyan,
    });
  }

  // 公式回测
  const effective = result.formula_backtest.effective_formulas;
  if (effective === 0) {
    warnings.push({
      icon: <CloseCircleOutlined />,
      text: '所有创意公式均不显著，建议调整公式定义或积累更多数据',
      color: red,
    });
  }

  if (warnings.length === 0) return null;

  return (
    <Card style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12 }}
      styles={{ body: { padding: '16px 20px' } }}>
      <SectionTitle icon={<BulbOutlined />} title="数据质量洞察" subtitle="自动检测的数据问题与优化建议" color={yellow} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {warnings.map((w, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px', background: `${w.color}08`, borderRadius: 8,
            border: `1px solid ${w.color}20`,
          }}>
            <span style={{ color: w.color, fontSize: 18 }}>{w.icon}</span>
            <Text style={{ color: textSecondary, fontSize: 13 }}>{w.text}</Text>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ═══════════════════════════════════════════════════
// 主页面
// ═══════════════════════════════════════════════════
export default function Phase0Experiment() {
  const { loading, result, recommendation, error, runExperiment, uploadExcel, fileName, dataSource } = useExperimentStore();

  const rho = result?.predictability?.spearman_rho ?? 0;
  const ndcg5 = result?.predictability?.ndcg_at_5 ?? 0;
  const ndcg10 = result?.predictability?.ndcg_at_10 ?? 0;

  // 统计显著特征数
  const sigCount = result?.feature_importance?.filter(f => f.is_significant).length ?? 0;

  return (
    <div style={{ padding: 0 }}>
      {/* ─── 页头 ─── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, color: '#fff',
          }}>
            <ExperimentOutlined />
          </div>
          <div>
            <Title level={4} style={{ margin: 0, color: textPrimary }}>Phase 0 数据验证实验</Title>
            <Text style={{ color: textMuted }}>验证「标签 + 行为特征 → ROAS 排名」的可预测性</Text>
          </div>
        </div>
        <Space size={12}>
          {/* 数据来源指示 */}
          {dataSource === 'upload' && fileName ? (
            <Tag icon={<FileExcelOutlined />} color="success" style={{ fontSize: 13, padding: '4px 12px', borderRadius: 6 }}>
              {fileName}
            </Tag>
          ) : result ? (
            <Tag icon={<DatabaseOutlined />} color="blue" style={{ fontSize: 13, padding: '4px 12px', borderRadius: 6 }}>
              默认数据源
            </Tag>
          ) : null}
          <Tag color="blue" style={{ fontSize: 13, padding: '2px 12px' }}>34 维特征空间</Tag>
          <Tag color="purple" style={{ fontSize: 13, padding: '2px 12px' }}>Ridge + LOO 交叉验证</Tag>
          <Upload
            accept=".xlsx,.xls"
            showUploadList={false}
            beforeUpload={(file) => {
              uploadExcel(file);
              return false;
            }}
          >
            <Button icon={<UploadOutlined />} loading={loading} size="large"
              style={{ borderRadius: 8, fontWeight: 600 }}>
              {loading ? '分析中...' : '导入 Excel 分析'}
            </Button>
          </Upload>
          <Button type="primary" icon={<ThunderboltOutlined />} loading={loading}
            onClick={runExperiment} size="large"
            style={{ borderRadius: 8, fontWeight: 600 }}>
            {loading ? '实验运行中...' : '运行实验'}
          </Button>
        </Space>
      </div>

      {/* ─── 加载中 ─── */}
      {loading && (
        <Card style={{ background: cardBg, border: `1px solid ${border}`, textAlign: 'center', padding: 60, borderRadius: 12 }}>
          <Spin size="large" />
          <div style={{ marginTop: 20, color: textSecondary, fontSize: 16, fontWeight: 500 }}>
            {dataSource === 'upload' ? `正在解析 ${fileName || 'Excel 文件'}...` : '正在执行 Phase 0 实验...'}
          </div>
          <div style={{ marginTop: 8, color: textMuted, fontSize: 13 }}>
            计算 34 维特征 × Spearman 相关性 × Ridge LOO 交叉验证
          </div>
        </Card>
      )}

      {/* ─── 错误 ─── */}
      {error && !loading && (
        <Alert message="实验错误" description={error} type="error" showIcon
          style={{ marginBottom: 16, background: '#EF444410', border: `1px solid ${red}40`, borderRadius: 12 }} />
      )}

      {/* ─── 结果仪表盘 ─── */}
      {result && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 数据概览卡片 */}
          <Row gutter={16}>
            <Col span={6}>
              <StatCard icon={<DatabaseOutlined />} label="素材样本" value={result.sample_count} suffix="条" color={blue}
                sub="有效参与分析的素材数" />
            </Col>
            <Col span={6}>
              <StatCard icon={<AimOutlined />} label="特征维度" value={result.feature_count} suffix="维" color={purple}
                sub="14 视觉 + 4 音频 + 4 时长 + 12 行为" />
            </Col>
            <Col span={6}>
              <StatCard icon={<CheckCircleOutlined />} label="显著特征" value={sigCount} suffix={`/ ${result.feature_count}`} color={green}
                sub={sigCount > 10 ? '特征区分度良好' : sigCount > 5 ? '特征区分度一般' : '特征区分度较低'} />
            </Col>
            <Col span={6}>
              <StatCard icon={<RocketOutlined />} label="有效公式" value={result.formula_backtest.effective_formulas}
                suffix={`/ ${result.formula_backtest.total_formulas}`} color={cyan}
                sub="命中且统计显著的创意公式" />
            </Col>
          </Row>

          {/* Go/No-Go 决策 */}
          <RecommendationCard
            recommendation={recommendation || 'borderline'}
            details={result.predictability.details}
            rho={rho} ndcg5={ndcg5} ndcg10={ndcg10}
          />

          {/* 特征重要性 + 类别雷达 */}
          <Row gutter={16}>
            <Col span={16}>
              <FeatureImportanceChart data={result.feature_importance} />
            </Col>
            <Col span={8}>
              <FeatureCategoryRadar data={result.feature_importance} />
            </Col>
          </Row>

          {/* 模型系数 */}
          <ModelCoefficientsChart coefficients={result.model_coefficients} />

          {/* 公式回测 */}
          <FormulaBacktestTable data={result.formula_backtest.results} />

          {/* 特征详情表 */}
          <FeatureDetailTable data={result.feature_importance} />

          {/* 数据质量洞察 */}
          <DataQualityInsights result={result} />
        </div>
      )}

      {/* ─── 空状态 ─── */}
      {!result && !loading && !error && (
        <Card style={{ background: cardBg, border: `1px solid ${border}`, textAlign: 'center', padding: 80, borderRadius: 12 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20, margin: '0 auto 20px',
            background: 'linear-gradient(135deg, #8B5CF620 0%, #3B82F620 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 40, color: purple,
          }}>
            <ExperimentOutlined />
          </div>
          <div style={{ color: textPrimary, fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
            开始 Phase 0 验证实验
          </div>
          <div style={{ color: textSecondary, fontSize: 14, maxWidth: 480, margin: '0 auto 24px' }}>
            导入你的素材 Excel 表，系统将自动分析 34 维特征（14 视觉 + 4 音频 + 4 时长 + 12 行为）对 ROAS 的预测能力
          </div>
          <Space size={16}>
            <Upload
              accept=".xlsx,.xls"
              showUploadList={false}
              beforeUpload={(file) => {
                uploadExcel(file);
                return false;
              }}
            >
              <Button type="primary" icon={<UploadOutlined />} size="large"
                style={{ borderRadius: 8, fontWeight: 600, height: 44, paddingInline: 28 }}>
                导入 Excel 分析
              </Button>
            </Upload>
            <Button icon={<ReloadOutlined />} size="large" onClick={runExperiment}
              style={{ borderRadius: 8, fontWeight: 600, height: 44, paddingInline: 28 }}>
              使用默认数据
            </Button>
          </Space>
        </Card>
      )}
    </div>
  );
}