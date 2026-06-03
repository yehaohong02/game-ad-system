import { useState, useEffect } from 'react';
import {
  Card, Row, Col, Button, Tag, Typography, Input, Slider, Table, Space, Spin, Alert, Divider,
} from 'antd';
import {
  ExperimentOutlined, ThunderboltOutlined, StarOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import { useCheatStore } from '../stores/cheat';
import CheatHelp from './CheatHelp';

const { Text, Title } = Typography;

// ─── 主题色 ───
const cardBg = '#1E293B';
const border = '#334155';
const green = '#10b981';
const blue = '#3b82f6';
const purple = '#8b5cf6';
const textPrimary = '#E2E8F0';
const textSecondary = '#94A3B8';
const textMuted = '#64748b';

// ─── 7 维度定义 ───
const DIMENSIONS = [
  { key: 'ER', name: 'Emotional Resonance', label: '情感共鸣', weight: 1.5 },
  { key: 'SR', name: 'Social Resonance', label: '社交共鸣', weight: 1.5 },
  { key: 'HP', name: 'Hook Potential', label: '钩子潜力', weight: 1.5 },
  { key: 'QL', name: 'Quotable Lines', label: '金句密度', weight: 1.0 },
  { key: 'NA', name: 'Narrativity', label: '叙事力', weight: 1.0 },
  { key: 'AB', name: 'Audience Breadth', label: '受众广度', weight: 1.0 },
  { key: 'SAT', name: 'Satire Depth', label: '讽刺深度', weight: 1.0 },
];

const totalWeight = DIMENSIONS.reduce((s, d) => s + d.weight, 0);

// ─── 分桶颜色映射 ───
const bucketColors: Record<string, string> = {
  S: green,
  A: blue,
  B: purple,
  C: '#f59e0b',
  D: '#ef4444',
};

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

// ═══════════════════════════════════════════════════
// 主页面
// ═══════════════════════════════════════════════════
export default function CheatScore() {
  const { loading, error, currentScore, fetchDimensions, scoreContent } = useCheatStore();

  const [materialId, setMaterialId] = useState('');
  const [scriptText, setScriptText] = useState('');
  const [scores, setScores] = useState<Record<string, number>>(() =>
    Object.fromEntries(DIMENSIONS.map(d => [d.key, 2.5]))
  );

  useEffect(() => { fetchDimensions(); }, [fetchDimensions]);

  const handleScore = async () => {
    if (!materialId.trim()) return;
    await scoreContent(materialId.trim(), scriptText, scores);
  };

  const handleSliderChange = (key: string, value: number) => {
    setScores(prev => ({ ...prev, [key]: value }));
  };

  // ─── 维度分解表列 ───
  const breakdownColumns = [
    {
      title: '维度',
      dataIndex: 'key',
      key: 'key',
      width: 80,
      render: (key: string) => <Tag color="blue" style={{ fontWeight: 600 }}>{key}</Tag>,
    },
    {
      title: '名称',
      dataIndex: 'label',
      key: 'label',
      render: (label: string, record: any) => (
        <div>
          <Text style={{ color: textPrimary }}>{label}</Text>
          <div style={{ color: textMuted, fontSize: 11 }}>{record.name}</div>
        </div>
      ),
    },
    {
      title: '权重',
      dataIndex: 'weight',
      key: 'weight',
      width: 80,
      render: (w: number) => <Text style={{ color: purple, fontWeight: 600 }}>{w.toFixed(1)}</Text>,
    },
    {
      title: '得分',
      dataIndex: 'score',
      key: 'score',
      width: 80,
      render: (s: number) => <Text style={{ color: textPrimary, fontWeight: 700, fontSize: 16 }}>{(s ?? 0).toFixed(1)}</Text>,
    },
    {
      title: '加权贡献',
      dataIndex: 'contribution',
      key: 'contribution',
      width: 110,
      render: (c: number) => {
        const pct = (c / totalWeight) * 100;
        return (
          <div>
            <Text style={{ color: green, fontWeight: 600 }}>{c.toFixed(2)}</Text>
            <div style={{ color: textMuted, fontSize: 11 }}>{pct.toFixed(1)}%</div>
          </div>
        );
      },
    },
  ];

  // 构建表格数据
  const breakdownData = currentScore
    ? DIMENSIONS.map(d => {
        const dimResult = currentScore.dimensions?.[d.key];
        const sc = dimResult?.score ?? currentScore.scores?.[d.key] ?? 0;
        return {
          key: d.key,
          name: d.name,
          label: d.label,
          weight: d.weight,
          score: sc,
          contribution: sc * d.weight,
        };
      })
    : [];

  const bucketColor = currentScore ? (bucketColors[currentScore.bucket] || textMuted) : textMuted;

  return (
    <div style={{ padding: 0 }}>
      {/* ─── 页头 ─── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, color: '#fff',
        }}>
          <StarOutlined />
        </div>
        <div>
          <Title level={4} style={{ margin: 0, color: textPrimary }}>素材评分</Title>
          <Text style={{ color: textMuted }}>7 维度盲评 → 综合分 → 分桶</Text>
        </div>
        <CheatHelp page="score" />
      </div>

      {/* ─── 错误提示 ─── */}
      {error && (
        <Alert message="评分错误" description={error} type="error" showIcon
          style={{ marginBottom: 16, background: '#EF444410', border: `1px solid #ef444440`, borderRadius: 12 }} />
      )}

      <Row gutter={16}>
        {/* ═══ 左侧：输入面板 ═══ */}
        <Col span={10}>
          <Card
            style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12 }}
            styles={{ body: { padding: '20px 24px' } }}
          >
            <SectionTitle icon={<ExperimentOutlined />} title="评分输入" subtitle="填写素材信息并为每个维度打分" color={green} />

            {/* Material ID */}
            <div style={{ marginBottom: 16 }}>
              <Text style={{ color: textSecondary, fontSize: 13, marginBottom: 6, display: 'block' }}>素材 ID</Text>
              <Input
                placeholder="输入素材 ID"
                value={materialId}
                onChange={e => setMaterialId(e.target.value)}
                style={{ background: '#0F172A', border: `1px solid ${border}`, color: textPrimary, borderRadius: 8 }}
              />
            </div>

            {/* Script Text */}
            <div style={{ marginBottom: 20 }}>
              <Text style={{ color: textSecondary, fontSize: 13, marginBottom: 6, display: 'block' }}>
                文案脚本 <span style={{ color: textMuted }}>(可选)</span>
              </Text>
              <Input.TextArea
                placeholder="粘贴视频脚本文案..."
                value={scriptText}
                onChange={e => setScriptText(e.target.value)}
                rows={3}
                style={{ background: '#0F172A', border: `1px solid ${border}`, color: textPrimary, borderRadius: 8, resize: 'none' }}
              />
            </div>

            <Divider style={{ margin: '12px 0 16px', borderColor: `${border}80` }} />

            {/* 7 维度滑块 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {DIMENSIONS.map(d => (
                <div key={d.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                    <Space size={6}>
                      <Tag color="blue" style={{ margin: 0, fontWeight: 600, fontSize: 11 }}>{d.key}</Tag>
                      <Text style={{ color: textPrimary, fontSize: 13 }}>{d.label}</Text>
                    </Space>
                    <Space size={8}>
                      <Text style={{ color: purple, fontSize: 11 }}>w={d.weight}</Text>
                      <Text style={{ color: textPrimary, fontWeight: 700, fontSize: 14, minWidth: 28, textAlign: 'right' }}>
                        {(scores[d.key] ?? 2.5).toFixed(1)}
                      </Text>
                    </Space>
                  </div>
                  <Slider
                    min={0}
                    max={5}
                    step={0.5}
                    value={scores[d.key] ?? 2.5}
                    onChange={v => handleSliderChange(d.key, v)}
                    trackStyle={{ background: blue }}
                    handleStyle={{ borderColor: blue }}
                    railStyle={{ background: '#334155' }}
                  />
                </div>
              ))}
            </div>

            <Divider style={{ margin: '16px 0 12px', borderColor: `${border}80` }} />

            {/* 评分按钮 */}
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              loading={loading}
              onClick={handleScore}
              disabled={!materialId.trim()}
              block
              size="large"
              style={{ borderRadius: 8, fontWeight: 600, height: 44 }}
            >
              {loading ? '评分中...' : '评分'}
            </Button>
          </Card>
        </Col>

        {/* ═══ 右侧：结果面板 ═══ */}
        <Col span={14}>
          {loading && (
            <Card style={{ background: cardBg, border: `1px solid ${border}`, textAlign: 'center', padding: 60, borderRadius: 12 }}>
              <Spin size="large" />
              <div style={{ marginTop: 20, color: textSecondary, fontSize: 16, fontWeight: 500 }}>正在计算综合评分...</div>
            </Card>
          )}

          {!loading && currentScore && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* 综合得分卡片 */}
              <Card
                style={{ background: `linear-gradient(135deg, ${bucketColor}15 0%, ${cardBg} 100%)`, border: `1px solid ${border}`, borderRadius: 12 }}
                styles={{ body: { padding: '32px 40px' } }}
              >
                <Row align="middle" gutter={24}>
                  <Col span={8} style={{ textAlign: 'center' }}>
                    <div style={{ color: textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Composite Score</div>
                    <div style={{ fontSize: 64, fontWeight: 800, color: bucketColor, lineHeight: 1 }}>
                      {(currentScore.composite ?? 0).toFixed(2)}
                    </div>
                    <div style={{ color: textMuted, fontSize: 12, marginTop: 4 }}>/ {totalWeight.toFixed(1)} max</div>
                  </Col>
                  <Col span={1} style={{ display: 'flex', justifyContent: 'center' }}>
                    <Divider type="vertical" style={{ height: 80, borderColor: `${border}80` }} />
                  </Col>
                  <Col span={7} style={{ textAlign: 'center' }}>
                    <div style={{ color: textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Bucket</div>
                    <Tag
                      style={{
                        fontSize: 28, fontWeight: 800, padding: '8px 28px', borderRadius: 12,
                        background: `${bucketColor}18`, color: bucketColor, border: `2px solid ${bucketColor}40`,
                      }}
                    >
                      {currentScore.bucket}
                    </Tag>
                    <div style={{ color: textSecondary, fontSize: 13, marginTop: 8 }}>{currentScore.bucket_label}</div>
                  </Col>
                  <Col span={8} style={{ textAlign: 'center' }}>
                    <div style={{ color: textMuted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Formula</div>
                    <Text style={{ color: textSecondary, fontSize: 13 }}>{currentScore.formula}</Text>
                    <div style={{ color: textMuted, fontSize: 11, marginTop: 4 }}>Rubric v{currentScore.rubric_version}</div>
                  </Col>
                </Row>
              </Card>

              {/* 维度分解表 */}
              <Card
                style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12 }}
                styles={{ body: { padding: '16px 20px' } }}
              >
                <SectionTitle icon={<StarOutlined />} title="维度分解" subtitle="7 维度得分与加权贡献" color={purple} />
                <Table
                  dataSource={breakdownData}
                  columns={breakdownColumns}
                  rowKey="key"
                  pagination={false}
                  size="small"
                  style={{ marginTop: 8 }}
                  onRow={(record) => ({
                    style: { background: record.score >= 3.5 ? '#10B98108' : 'transparent' },
                  })}
                />
              </Card>

              {/* 分桶可视化 */}
              <Card
                style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12 }}
                styles={{ body: { padding: '16px 20px' } }}
              >
                <SectionTitle icon={<CheckCircleOutlined />} title="分桶结果" subtitle="综合分所在区间" color={green} />
                <div style={{ display: 'flex', gap: 10 }}>
                  {['S', 'A', 'B', 'C', 'D'].map(b => {
                    const isActive = currentScore.bucket === b;
                    const c = bucketColors[b];
                    return (
                      <div
                        key={b}
                        style={{
                          flex: 1,
                          padding: '16px 8px',
                          borderRadius: 10,
                          textAlign: 'center',
                          background: isActive ? `${c}18` : '#0F172A',
                          border: isActive ? `2px solid ${c}60` : `1px solid ${border}`,
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{
                          fontSize: 24, fontWeight: 800,
                          color: isActive ? c : textMuted,
                        }}>{b}</div>
                        {isActive && (
                          <div style={{ color: c, fontSize: 11, marginTop: 4, fontWeight: 600 }}>当前</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}

          {/* ─── 空状态 ─── */}
          {!loading && !currentScore && (
            <Card style={{ background: cardBg, border: `1px solid ${border}`, textAlign: 'center', padding: 80, borderRadius: 12 }}>
              <div style={{
                width: 80, height: 80, borderRadius: 20, margin: '0 auto 20px',
                background: 'linear-gradient(135deg, #10B98120 0%, #3B82F620 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 40, color: green,
              }}>
                <StarOutlined />
              </div>
              <div style={{ color: textPrimary, fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
                等待评分
              </div>
              <div style={{ color: textSecondary, fontSize: 14, maxWidth: 400, margin: '0 auto' }}>
                在左侧填写素材 ID 并为 7 个维度打分，点击「评分」查看综合结果与分桶
              </div>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
}