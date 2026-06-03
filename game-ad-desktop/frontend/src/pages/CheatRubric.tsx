import { useEffect } from 'react';
import {
  Row, Col, Card, Button, Space, Tag, Table, Typography, Spin,
  Progress, Alert, message,
} from 'antd';
import {
  FunctionOutlined, ExperimentOutlined, ThunderboltOutlined,
  BarChartOutlined, RocketOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useCheatStore } from '../stores/cheat';
import CheatHelp from './CheatHelp';

const { Text, Title } = Typography;

// ===== Theme =====
const cardBg = '#1E293B';
const border = '#334155';
const green = '#10b981';
const red = '#ef4444';
const yellow = '#f59e0b';
const blue = '#3b82f6';
const purple = '#8b5cf6';
const textPrimary = '#E2E8F0';
const textSecondary = '#94A3B8';
const textMuted = '#64748b';

const cardStyle: React.CSSProperties = { background: cardBg, border: `1px solid ${border}`, borderRadius: 8 };

// ===== Default dimension data =====
const DEFAULT_DIMENSIONS = [
  { key: 'hook', name: 'Hook力', weight: 0.20, desc: '开头3秒吸引力' },
  { key: 'emotion', name: '情感共鸣', weight: 0.15, desc: '情绪触发强度' },
  { key: 'narrative', name: '叙事节奏', weight: 0.15, desc: '信息递进节奏' },
  { key: 'visual', name: '视觉冲击', weight: 0.15, desc: '画面质量与构图' },
  { key: 'audio', name: '音频配合', weight: 0.10, desc: 'BGM与配音匹配' },
  { key: 'cta', name: 'CTA引导', weight: 0.15, desc: '行动号召清晰度' },
  { key: 'brand', name: '品牌植入', weight: 0.10, desc: '产品融入自然度' },
];

const BUCKET_COLORS: Record<string, string> = {
  S: '#10b981', A: '#3b82f6', B: '#8b5cf6', C: '#f59e0b', D: '#ef4444',
};

export default function CheatRubric() {
  const {
    status, biasAnalysis, bumpProposal, loading,
    fetchStatus, analyzeBias, triggerBump,
  } = useCheatStore();

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const rubricVersion = status?.state?.rubric_version ?? 1;
  const buckets = status?.state ? ['S', 'A', 'B', 'C', 'D'] : [];

  // ===== Bias Chart =====
  const biasChartOption = biasAnalysis?.dimension_correlation ? {
    tooltip: { trigger: 'axis' as const },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category' as const,
      data: Object.keys(biasAnalysis.dimension_correlation),
      axisLabel: { color: textMuted, rotate: 20 },
    },
    yAxis: { type: 'value' as const, axisLabel: { color: textMuted } },
    series: [{
      type: 'bar' as const,
      data: Object.values(biasAnalysis.dimension_correlation).map(v => ({
        value: v,
        itemStyle: { color: v >= 0 ? blue : red },
      })),
    }],
  } : null;

  // ===== Weight change columns =====
  const weightChangeData = bumpProposal?.weight_changes
    ? Object.entries(bumpProposal.weight_changes).map(([dim, change]) => ({
        key: dim,
        dimension: dim,
        name: DEFAULT_DIMENSIONS.find(d => d.key === dim)?.name ?? dim,
        old_weight: change.old,
        new_weight: change.new,
        delta: change.new - change.old,
      }))
    : [];

  const weightColumns = [
    {
      title: '维度', key: 'dimension',
      render: (_: any, r: any) => <Text style={{ color: textPrimary }}>{r.name}</Text>,
    },
    {
      title: '旧权重', dataIndex: 'old_weight', key: 'old',
      render: (v: number) => <Text style={{ color: textMuted }}>{(v * 100).toFixed(0)}%</Text>,
    },
    {
      title: '', key: 'arrow', width: 40,
      render: () => <Text style={{ color: textMuted }}>→</Text>,
    },
    {
      title: '新权重', dataIndex: 'new_weight', key: 'new',
      render: (v: number) => <Text style={{ color: green, fontWeight: 600 }}>{(v * 100).toFixed(0)}%</Text>,
    },
    {
      title: '变化', dataIndex: 'delta', key: 'delta',
      render: (v: number) => {
        const color = v > 0 ? green : v < 0 ? red : textMuted;
        const sign = v > 0 ? '+' : '';
        return <Text style={{ color }}>{sign}{(v * 100).toFixed(1)}%</Text>;
      },
    },
  ];

  return (
    <Spin spinning={loading}>
      <div style={{ padding: 24 }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Title level={3} style={{ color: textPrimary, margin: 0 }}>
                <FunctionOutlined style={{ marginRight: 8, color: blue }} />
                评分公式管理
              </Title>
              <Text style={{ color: textMuted }}>维度权重 + 桶边界 + 公式进化</Text>
            </div>
            <CheatHelp page="rubric" />
          </div>
        </div>

        <Row gutter={[16, 16]}>
          {/* Current Formula */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <FunctionOutlined style={{ color: purple }} />
                  <Text style={{ color: textPrimary, fontWeight: 600 }}>当前公式</Text>
                </Space>
              }
              style={cardStyle}
              styles={{ header: { background: 'transparent', borderBottom: `1px solid ${border}` }, body: { padding: 16 } }}
            >
              <div style={{ marginBottom: 12 }}>
                <Tag color={blue} style={{ fontSize: 13 }}>v{rubricVersion}</Tag>
                <Tag color={status?.state?.confidence === 'high' ? green : status?.state?.confidence === 'medium' ? yellow : red}>
                  置信度: {status?.state?.confidence ?? '-'}
                </Tag>
              </div>
              <div style={{
                background: '#0f172a', borderRadius: 8, padding: '12px 16px',
                border: `1px solid ${border}`, fontFamily: 'monospace', fontSize: 13,
              }}>
                <Text style={{ color: green }}>
                  composite = Σ(dimension_score × weight)
                </Text>
              </div>
              <div style={{ marginTop: 12 }}>
                <Text style={{ color: textMuted, fontSize: 12 }}>
                  校准样本: {status?.state?.calibration_samples ?? 0} | 平台: {status?.state?.platform ?? '-'}
                </Text>
              </div>
            </Card>
          </Col>

          {/* Bucket Boundaries */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <BarChartOutlined style={{ color: yellow }} />
                  <Text style={{ color: textPrimary, fontWeight: 600 }}>桶边界方案</Text>
                </Space>
              }
              style={cardStyle}
              styles={{ header: { background: 'transparent', borderBottom: `1px solid ${border}` }, body: { padding: 16 } }}
            >
              <Space wrap>
                {buckets.map(b => (
                  <div key={b} style={{
                    background: '#0f172a', borderRadius: 8, padding: '12px 20px',
                    border: `1px solid ${BUCKET_COLORS[b] ?? border}`,
                    textAlign: 'center', minWidth: 80,
                  }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: BUCKET_COLORS[b] }}>{b}</div>
                    <Text style={{ color: textMuted, fontSize: 11 }}>桶</Text>
                  </div>
                ))}
              </Space>
              <div style={{ marginTop: 16 }}>
                <Text style={{ color: textMuted, fontSize: 12 }}>
                  Buffer: {status?.buffer?.count ?? 0} 条 ({status?.buffer?.days ?? 0} 天)
                </Text>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Dimension Weights Table */}
        <Card
          title={
            <Space>
              <BarChartOutlined style={{ color: blue }} />
              <Text style={{ color: textPrimary, fontWeight: 600 }}>维度权重</Text>
            </Space>
          }
          style={{ ...cardStyle, marginTop: 16 }}
          styles={{ header: { background: 'transparent', borderBottom: `1px solid ${border}` }, body: { padding: 0 } }}
        >
          <Table
            dataSource={DEFAULT_DIMENSIONS}
            rowKey="key"
            pagination={false}
            size="small"
            columns={[
              {
                title: '维度', dataIndex: 'key', key: 'key',
                render: (v: string) => <Tag color={blue}>{v}</Tag>,
              },
              {
                title: '名称', dataIndex: 'name', key: 'name',
                render: (v: string) => <Text style={{ color: textPrimary }}>{v}</Text>,
              },
              {
                title: '权重', dataIndex: 'weight', key: 'weight',
                render: (v: number) => (
                  <Space>
                    <Progress
                      percent={v * 100}
                      size="small"
                      strokeColor={blue}
                      trailColor={border}
                      showInfo={false}
                      style={{ width: 100 }}
                    />
                    <Text style={{ color: textPrimary }}>{(v * 100).toFixed(0)}%</Text>
                  </Space>
                ),
              },
              {
                title: '说明', dataIndex: 'desc', key: 'desc',
                render: (v: string) => <Text style={{ color: textMuted }}>{v}</Text>,
              },
            ]}
          />
        </Card>

        {/* Bias Analysis */}
        <Card
          title={
            <Space>
              <ExperimentOutlined style={{ color: yellow }} />
              <Text style={{ color: textPrimary, fontWeight: 600 }}>偏差分析</Text>
            </Space>
          }
          style={{ ...cardStyle, marginTop: 16 }}
          styles={{ header: { background: 'transparent', borderBottom: `1px solid ${border}` }, body: { padding: 16 } }}
        >
          <Button
            type="primary"
            icon={<ExperimentOutlined />}
            onClick={() => analyzeBias()}
            loading={loading}
            style={{ marginBottom: 16 }}
          >
            分析偏差
          </Button>

          {biasAnalysis && biasAnalysis.status === 'ok' && (
            <div>
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={8}>
                  <div style={{ background: '#0f172a', borderRadius: 8, padding: 16, textAlign: 'center', border: `1px solid ${border}` }}>
                    <Text style={{ color: textMuted, fontSize: 12 }}>样本数</Text>
                    <div style={{ fontSize: 28, fontWeight: 700, color: textPrimary }}>{biasAnalysis.sample_count}</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ background: '#0f172a', borderRadius: 8, padding: 16, textAlign: 'center', border: `1px solid ${border}` }}>
                    <Text style={{ color: textMuted, fontSize: 12 }}>平均误差</Text>
                    <div style={{ fontSize: 28, fontWeight: 700, color: Math.abs(biasAnalysis.avg_signed_error) < 20 ? green : red }}>
                      {biasAnalysis.avg_signed_error.toFixed(1)}%
                    </div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ background: '#0f172a', borderRadius: 8, padding: 16, textAlign: 'center', border: `1px solid ${border}` }}>
                    <Text style={{ color: textMuted, fontSize: 12 }}>偏差方向</Text>
                    <div style={{ fontSize: 28, fontWeight: 700, color: biasAnalysis.bias_direction === 'under' ? green : biasAnalysis.bias_direction === 'over' ? yellow : blue }}>
                      {biasAnalysis.bias_direction === 'under' ? '偏低' : biasAnalysis.bias_direction === 'over' ? '偏高' : '无偏'}
                    </div>
                  </div>
                </Col>
              </Row>

              {biasAnalysis.distribution && (
                <div style={{ marginBottom: 16 }}>
                  <Text style={{ color: textSecondary, fontSize: 12, marginBottom: 8, display: 'block' }}>误差分布</Text>
                  <Space>
                    <Tag color={green}>准确 {biasAnalysis.distribution.accurate}</Tag>
                    <Tag color={yellow}>偏高 {biasAnalysis.distribution.over}</Tag>
                    <Tag color={red}>偏低 {biasAnalysis.distribution.under}</Tag>
                  </Space>
                </div>
              )}

              {biasChartOption && (
                <div style={{ marginBottom: 16 }}>
                  <Text style={{ color: textSecondary, fontSize: 12, marginBottom: 8, display: 'block' }}>维度相关性</Text>
                  <ReactECharts option={biasChartOption} style={{ height: 280 }} />
                </div>
              )}

              {biasAnalysis.recommendation && (
                <Alert
                  message="建议"
                  description={biasAnalysis.recommendation}
                  type="info"
                  showIcon
                  style={{ background: '#0f172a', border: `1px solid ${border}`, color: textSecondary }}
                />
              )}
            </div>
          )}
        </Card>

        {/* Bump Proposal */}
        <Card
          title={
            <Space>
              <RocketOutlined style={{ color: purple }} />
              <Text style={{ color: textPrimary, fontWeight: 600 }}>公式升级提案</Text>
            </Space>
          }
          style={{ ...cardStyle, marginTop: 16 }}
          styles={{ header: { background: 'transparent', borderBottom: `1px solid ${border}` }, body: { padding: 16 } }}
        >
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            onClick={() => triggerBump(false)}
            loading={loading}
            style={{ marginBottom: 16 }}
          >
            触发升级分析
          </Button>

          {bumpProposal && bumpProposal.status === 'ok' && (
            <div>
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={12}>
                  <div style={{ background: '#0f172a', borderRadius: 8, padding: 16, border: `1px solid ${border}` }}>
                    <Text style={{ color: textMuted, fontSize: 12, display: 'block', marginBottom: 4 }}>当前公式</Text>
                    <Text style={{ color: textPrimary, fontFamily: 'monospace' }}>{bumpProposal.current_formula}</Text>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ background: '#0f172a', borderRadius: 8, padding: 16, border: `1px solid ${green}` }}>
                    <Text style={{ color: textMuted, fontSize: 12, display: 'block', marginBottom: 4 }}>拟议公式</Text>
                    <Text style={{ color: green, fontFamily: 'monospace' }}>{bumpProposal.proposed_formula}</Text>
                  </div>
                </Col>
              </Row>

              <div style={{ marginBottom: 16 }}>
                <Text style={{ color: textSecondary, fontSize: 12, marginBottom: 8, display: 'block' }}>权重变更</Text>
                <Table
                  dataSource={weightChangeData}
                  columns={weightColumns}
                  rowKey="key"
                  pagination={false}
                  size="small"
                />
              </div>

              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={12}>
                  <div style={{ background: '#0f172a', borderRadius: 8, padding: 16, textAlign: 'center', border: `1px solid ${border}` }}>
                    <Text style={{ color: textMuted, fontSize: 12 }}>排序一致性</Text>
                    <div style={{ fontSize: 28, fontWeight: 700, color: bumpProposal.rank_consistency >= 0.8 ? green : yellow }}>
                      {(bumpProposal.rank_consistency * 100).toFixed(1)}%
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ background: '#0f172a', borderRadius: 8, padding: 16, textAlign: 'center', border: `1px solid ${border}` }}>
                    <Text style={{ color: textMuted, fontSize: 12 }}>通过阈值</Text>
                    <div style={{ fontSize: 28, fontWeight: 700 }}>
                      {bumpProposal.passes_threshold
                        ? <CheckCircleOutlined style={{ color: green }} />
                        : <Text style={{ color: red }}>未通过</Text>
                      }
                    </div>
                  </div>
                </Col>
              </Row>

              {bumpProposal.passes_threshold && (
                <Button
                  type="primary"
                  size="large"
                  icon={<RocketOutlined />}
                  onClick={() => message.success('升级申请已提交（后端对接中）')}
                  style={{ background: green, borderColor: green }}
                >
                  应用升级
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>
    </Spin>
  );
}