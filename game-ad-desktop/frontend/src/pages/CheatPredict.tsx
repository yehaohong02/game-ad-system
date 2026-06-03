import { useEffect, useState } from 'react';
import {
  Card, Button, Input, Select, Slider, Table, Tag, Typography, Alert, Divider, Tooltip,
} from 'antd';
import {
  EyeOutlined, PlusOutlined, DeleteOutlined, SendOutlined,
  ExperimentOutlined, AimOutlined,
  RocketOutlined, FileTextOutlined, QuestionCircleOutlined, BulbOutlined,
} from '@ant-design/icons';
import { useCheatStore, Prediction } from '../stores/cheat';
import CheatHelp from './CheatHelp';

const { Text, Title } = Typography;
const { TextArea } = Input;

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

const BUCKET_OPTIONS = [
  { label: '爆款 (viral)', value: 'viral' },
  { label: '超均 (outperform)', value: 'outperform' },
  { label: '平均 (average)', value: 'average' },
  { label: '低于均值 (underperform)', value: 'underperform' },
  { label: '扑街 (flop)', value: 'flop' },
];

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  predicted: { color: blue, label: '已预测' },
  published: { color: yellow, label: '已发布' },
  retro_done: { color: green, label: '已复盘' },
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
export default function CheatPredict() {
  const {
    loading, error, predictions, dimensions,
    fetchPredictions, createPrediction, fetchDimensions,
  } = useCheatStore();

  // ─── 表单状态 ───
  const [materialId, setMaterialId] = useState('');
  const [scriptText, setScriptText] = useState('');
  const [dimScores, setDimScores] = useState<Record<string, number>>({});
  const [predictedBucket, setPredictedBucket] = useState<string>('average');
  const [centerEstimate, setCenterEstimate] = useState<number>(10);
  const [distValues, setDistValues] = useState<Record<string, number>>({
    viral: 5, outperform: 15, average: 50, underperform: 20, flop: 10,
  });
  const [reasoningFactors, setReasoningFactors] = useState<string[]>(['']);
  const [criticalHypothesis, setCriticalHypothesis] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // ─── 展开行 ───
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);

  useEffect(() => {
    fetchDimensions();
    fetchPredictions();
  }, [fetchDimensions, fetchPredictions]);

  // 维度加载后初始化分数
  useEffect(() => {
    if (dimensions.length > 0 && Object.keys(dimScores).length === 0) {
      const init: Record<string, number> = {};
      dimensions.forEach(d => { init[d.key] = 5; });
      setDimScores(init);
    }
  }, [dimensions, dimScores]);

  // ─── 概率分布校验 ───
  const distSum = Object.values(distValues).reduce((s, v) => s + v, 0);
  const distValid = Math.abs(distSum - 100) < 0.5;

  const updateDist = (bucket: string, val: number) => {
    setDistValues(prev => ({ ...prev, [bucket]: Math.max(0, Math.min(100, val)) }));
  };

  // ─── 推理因素操作 ───
  const addFactor = () => setReasoningFactors(prev => [...prev, '']);
  const removeFactor = (idx: number) => setReasoningFactors(prev => prev.filter((_, i) => i !== idx));
  const updateFactor = (idx: number, val: string) => {
    setReasoningFactors(prev => prev.map((f, i) => i === idx ? val : f));
  };

  // ─── 提交 ───
  const handleSubmit = async () => {
    if (!materialId.trim()) return;

    await createPrediction({
      material_id: materialId.trim(),
      script_text: scriptText.trim(),
      scores: dimScores,
      prediction: {
        bucket: predictedBucket,
        probability_distribution: distValues,
        center_estimate_w: centerEstimate,
      },
      reasoning_factors: reasoningFactors.filter(f => f.trim()),
      critical_hypothesis: criticalHypothesis.trim(),
    });

    setSubmitted(true);
  };

  // ─── 重置表单 ───
  const handleReset = () => {
    setMaterialId('');
    setScriptText('');
    const init: Record<string, number> = {};
    dimensions.forEach(d => { init[d.key] = 5; });
    setDimScores(init);
    setPredictedBucket('average');
    setCenterEstimate(10);
    setDistValues({ viral: 5, outperform: 15, average: 50, underperform: 20, flop: 10 });
    setReasoningFactors(['']);
    setCriticalHypothesis('');
    setSubmitted(false);
  };

  // ─── 展开行渲染 ───
  const expandedRowRender = (record: Prediction) => {
    const pred = record.prediction;
    const dist = pred?.probability_distribution || {};
    return (
      <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* 概率分布 */}
        <div>
          <Text style={{ color: textMuted, fontSize: 12 }}>概率分布</Text>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            {BUCKET_OPTIONS.map(b => (
              <div key={b.value} style={{
                flex: 1, textAlign: 'center', padding: '8px 4px', borderRadius: 8,
                background: '#0F172A', border: `1px solid ${border}`,
              }}>
                <div style={{ color: textMuted, fontSize: 11 }}>{b.label.split(' ')[0]}</div>
                <div style={{ color: textPrimary, fontSize: 16, fontWeight: 700, marginTop: 2 }}>
                  {dist[b.value] ?? 0}%
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* 评分维度 */}
        {record.score_result && (
          <div>
            <Text style={{ color: textMuted, fontSize: 12 }}>评分维度</Text>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
              {Object.entries(record.score_result.dimensions || {}).map(([key, dim]) => (
                <Tag key={key} style={{
                  background: '#0F172A', border: `1px solid ${border}`, color: textSecondary, borderRadius: 6,
                }}>
                  {dim.name}: <span style={{ color: textPrimary, fontWeight: 600 }}>{dim.score}</span>
                </Tag>
              ))}
            </div>
          </div>
        )}
        {/* 推理因素 */}
        {record.reasoning_factors && record.reasoning_factors.length > 0 && (
          <div>
            <Text style={{ color: textMuted, fontSize: 12 }}>推理因素</Text>
            <div style={{ marginTop: 6 }}>
              {record.reasoning_factors.map((f: any, i: number) => (
                <Tag key={i} style={{
                  background: `${purple}15`, border: `1px solid ${purple}30`, color: purple,
                  borderRadius: 6, marginBottom: 4,
                }}>
                  {typeof f === 'string' ? f : f.factor || JSON.stringify(f)}
                </Tag>
              ))}
            </div>
          </div>
        )}
        {/* 关键假设 */}
        {record.critical_hypothesis && (
          <div>
            <Text style={{ color: textMuted, fontSize: 12 }}>关键假设</Text>
            <div style={{
              marginTop: 6, padding: '10px 14px', background: '#0F172A', borderRadius: 8,
              border: `1px solid ${border}`, color: textSecondary, fontSize: 13,
            }}>
              {record.critical_hypothesis}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ─── 表格列 ───
  const columns = [
    {
      title: 'ID', dataIndex: 'id', key: 'id', width: 80,
      render: (id: string) => <Text style={{ color: textMuted, fontSize: 12 }}>{id.slice(0, 8)}</Text>,
    },
    {
      title: '素材', dataIndex: 'material_id', key: 'material',
      render: (mid: string) => <Text strong style={{ color: textPrimary }}>{mid}</Text>,
    },
    {
      title: '预测档位', key: 'bucket', width: 130,
      render: (_: any, record: Prediction) => {
        const bucket = record.prediction?.bucket || '-';
        const colorMap: Record<string, string> = {
          viral: red, outperform: yellow, average: blue, underperform: textMuted, flop: '#475569',
        };
        return <Tag color={colorMap[bucket] || 'default'} style={{ borderRadius: 4 }}>{bucket}</Tag>;
      },
    },
    {
      title: '中心估计', key: 'estimate', width: 110,
      render: (_: any, record: Prediction) => (
        <Text style={{ color: cyan, fontWeight: 600 }}>
          {record.prediction?.center_estimate_w ?? '-'} 万
        </Text>
      ),
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (status: string) => {
        const cfg = STATUS_CONFIG[status] || { color: textMuted, label: status };
        return <Tag color={cfg.color} style={{ borderRadius: 4 }}>{cfg.label}</Tag>;
      },
    },
    {
      title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 180,
      render: (t: string) => (
        <Text style={{ color: textMuted, fontSize: 13 }}>
          {t ? new Date(t).toLocaleString('zh-CN') : '-'}
        </Text>
      ),
    },
  ];

  return (
    <div style={{ padding: 0 }}>
      {/* ─── 页头 ─── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, color: '#fff',
          }}>
            <EyeOutlined />
          </div>
          <div>
            <Title level={4} style={{ margin: 0, color: textPrimary }}>盲测预测</Title>
            <Text style={{ color: textMuted }}>发布前写下预测，不可修改</Text>
          </div>
        </div>
        <Tag color="cyan" style={{ fontSize: 13, padding: '2px 12px' }}>Cheat-on-Content</Tag>
        <CheatHelp page="predict" />
      </div>

      {/* ─── 错误 ─── */}
      {error && (
        <Alert message="操作错误" description={error} type="error" showIcon
          style={{ marginBottom: 16, background: '#EF444410', border: `1px solid ${red}40`, borderRadius: 12 }} />
      )}

      {/* ─── 新建预测表单 ─── */}
      <Card style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12, marginBottom: 16 }}
        styles={{ body: { padding: '20px 24px' } }}>
        <SectionTitle icon={<ExperimentOutlined />} title="新建盲测预测" subtitle="提交后不可修改，请认真填写" color={cyan} />

        {/* 素材信息 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 20 }}>
          <div>
            <Text style={{ color: textSecondary, fontSize: 13, marginBottom: 6, display: 'block' }}>素材 ID</Text>
            <Input
              placeholder="输入素材 ID"
              value={materialId}
              onChange={e => setMaterialId(e.target.value)}
              disabled={submitted}
              style={{ background: '#0F172A', border: `1px solid ${border}`, color: textPrimary, borderRadius: 8 }}
            />
          </div>
          <div>
            <Text style={{ color: textSecondary, fontSize: 13, marginBottom: 6, display: 'block' }}>脚本文案</Text>
            <TextArea
              placeholder="输入脚本文案内容"
              value={scriptText}
              onChange={e => setScriptText(e.target.value)}
              disabled={submitted}
              rows={2}
              style={{ background: '#0F172A', border: `1px solid ${border}`, color: textPrimary, borderRadius: 8 }}
            />
          </div>
        </div>

        {/* 7 维度滑块 */}
        <Divider style={{ borderColor: `${border}80`, margin: '16px 0' }} />
        <Text style={{ color: textSecondary, fontSize: 13, marginBottom: 12, display: 'block' }}>
          <AimOutlined style={{ marginRight: 6 }} />维度评分（1-10）
        </Text>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', marginBottom: 20 }}>
          {dimensions.map(dim => (
            <div key={dim.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Tooltip title={dim.desc}>
                <Text style={{ color: textSecondary, fontSize: 13, minWidth: 120, cursor: 'help' }}>
                  {dim.name}
                  <QuestionCircleOutlined style={{ marginLeft: 4, fontSize: 11, color: textMuted }} />
                </Text>
              </Tooltip>
              <Slider
                min={1} max={10} step={1}
                value={dimScores[dim.key] ?? 5}
                onChange={val => setDimScores(prev => ({ ...prev, [dim.key]: val }))}
                disabled={submitted}
                style={{ flex: 1 }}
                tooltip={{ formatter: (v) => `${v} / 10` }}
              />
              <Text style={{ color: textPrimary, fontWeight: 600, width: 24, textAlign: 'center' }}>
                {dimScores[dim.key] ?? 5}
              </Text>
            </div>
          ))}
        </div>

        {/* 预测档位 + 中心估计 */}
        <Divider style={{ borderColor: `${border}80`, margin: '16px 0' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div>
            <Text style={{ color: textSecondary, fontSize: 13, marginBottom: 6, display: 'block' }}>
              <RocketOutlined style={{ marginRight: 6 }} />预测档位
            </Text>
            <Select
              value={predictedBucket}
              onChange={setPredictedBucket}
              disabled={submitted}
              options={BUCKET_OPTIONS}
              style={{ width: '100%' }}
              size="large"
            />
          </div>
          <div>
            <Text style={{ color: textSecondary, fontSize: 13, marginBottom: 6, display: 'block' }}>
              中心估计（万）
            </Text>
            <Input
              type="number"
              value={centerEstimate}
              onChange={e => setCenterEstimate(Number(e.target.value))}
              disabled={submitted}
              addonAfter="万"
              style={{ background: '#0F172A', border: `1px solid ${border}`, color: textPrimary, borderRadius: 8 }}
            />
          </div>
        </div>

        {/* 概率分布 */}
        <Divider style={{ borderColor: `${border}80`, margin: '16px 0' }} />
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ color: textSecondary, fontSize: 13 }}>
              <BulbOutlined style={{ marginRight: 6 }} />概率分布（%）
            </Text>
            <Tag color={distValid ? 'success' : 'error'} style={{ borderRadius: 4 }}>
              合计: {distSum}%
            </Tag>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {BUCKET_OPTIONS.map(b => (
              <div key={b.value} style={{ textAlign: 'center' }}>
                <Text style={{ color: textMuted, fontSize: 11, display: 'block', marginBottom: 4 }}>
                  {b.label.split(' ')[0]}
                </Text>
                <Input
                  type="number"
                  min={0} max={100}
                  value={distValues[b.value]}
                  onChange={e => updateDist(b.value, Number(e.target.value))}
                  disabled={submitted}
                  addonAfter="%"
                  style={{ background: '#0F172A', border: `1px solid ${border}`, color: textPrimary, borderRadius: 8, textAlign: 'center' }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 推理因素 */}
        <Divider style={{ borderColor: `${border}80`, margin: '16px 0' }} />
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ color: textSecondary, fontSize: 13 }}>
              <FileTextOutlined style={{ marginRight: 6 }} />推理因素
            </Text>
            {!submitted && (
              <Button type="link" size="small" icon={<PlusOutlined />} onClick={addFactor}
                style={{ color: cyan, padding: 0 }}>
                添加因素
              </Button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {reasoningFactors.map((factor, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 8 }}>
                <Input
                  placeholder={`推理因素 ${idx + 1}`}
                  value={factor}
                  onChange={e => updateFactor(idx, e.target.value)}
                  disabled={submitted}
                  style={{ background: '#0F172A', border: `1px solid ${border}`, color: textPrimary, borderRadius: 8 }}
                />
                {!submitted && reasoningFactors.length > 1 && (
                  <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeFactor(idx)} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 关键假设 */}
        <Divider style={{ borderColor: `${border}80`, margin: '16px 0' }} />
        <div style={{ marginBottom: 24 }}>
          <Text style={{ color: textSecondary, fontSize: 13, marginBottom: 6, display: 'block' }}>
            <QuestionCircleOutlined style={{ marginRight: 6 }} />关键假设
          </Text>
          <TextArea
            placeholder="你认为这个素材表现的核心假设是什么？"
            value={criticalHypothesis}
            onChange={e => setCriticalHypothesis(e.target.value)}
            disabled={submitted}
            rows={3}
            style={{ background: '#0F172A', border: `1px solid ${border}`, color: textPrimary, borderRadius: 8 }}
          />
        </div>

        {/* 提交按钮 */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          {submitted && (
            <Button size="large" onClick={handleReset}
              style={{ borderRadius: 8, fontWeight: 600 }}>
              新建预测
            </Button>
          )}
          <Button
            type="primary"
            size="large"
            icon={<SendOutlined />}
            loading={loading}
            disabled={submitted || !materialId.trim() || !distValid}
            onClick={handleSubmit}
            style={{ borderRadius: 8, fontWeight: 600 }}
          >
            {submitted ? '已提交' : '提交预测'}
          </Button>
        </div>
      </Card>

      {/* ─── 预测列表 ─── */}
      <Card style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12 }}
        styles={{ body: { padding: '20px 24px' } }}>
        <SectionTitle
          icon={<EyeOutlined />}
          title="历史预测"
          subtitle={`共 ${predictions.length} 条预测记录，点击行展开查看详情`}
          color={blue}
        />
        <Table
          dataSource={predictions}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          pagination={{ pageSize: 10, showSizeChanger: false }}
          expandable={{
            expandedRowRender,
            expandedRowKeys,
            onExpandedRowsChange: (keys) => setExpandedRowKeys(keys as string[]),
          }}
          style={{ marginTop: 8 }}
          locale={{ emptyText: '暂无预测记录，提交第一条盲测预测吧' }}
        />
      </Card>
    </div>
  );
}