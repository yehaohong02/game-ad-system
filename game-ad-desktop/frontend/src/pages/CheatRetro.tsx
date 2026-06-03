import { useState, useEffect } from 'react';
import {
  Row, Col, Card, Button, Space, Tag, Table, Modal, Form, Input,
  Typography, Spin, Divider, message,
} from 'antd';
import {
  ExperimentOutlined, CheckCircleOutlined, SyncOutlined,
  BarChartOutlined, FileTextOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useCheatStore, type Prediction } from '../stores/cheat';
import CheatHelp from './CheatHelp';

const { Text, Title } = Typography;
const { TextArea } = Input;

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

// ===== Helpers =====
function getErrorPct(pred: Prediction): number | null {
  if (!pred.retro?.actual_plays) return null;
  const predicted = pred.prediction?.center_estimate_w ?? 0;
  const actual = pred.retro.actual_plays;
  if (!actual) return null;
  return Math.abs(predicted - actual) / actual * 100;
}

function getErrorColor(pct: number): string {
  if (pct < 20) return green;
  if (pct < 50) return yellow;
  return red;
}

function getDirection(pred: Prediction): string {
  if (!pred.retro?.actual_plays) return '-';
  const predicted = pred.prediction?.center_estimate_w ?? 0;
  const actual = pred.retro.actual_plays;
  if (predicted > actual * 1.1) return '偏高';
  if (predicted < actual * 0.9) return '偏低';
  return '准确';
}

function getDirectionColor(dir: string): string {
  if (dir === '准确') return green;
  if (dir === '偏高') return yellow;
  return red;
}

export default function CheatRetro() {
  const {
    predictions, loading,
    fetchPredictions, doRetro,
  } = useCheatStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPred, setSelectedPred] = useState<Prediction | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  const pendingRetros = predictions.filter(p => p.status === 'published' && !p.retro);
  const completedRetros = predictions.filter(p => p.retro);

  const handleOpenRetro = (pred: Prediction) => {
    setSelectedPred(pred);
    form.resetFields();
    setModalOpen(true);
  };

  const handleSubmitRetro = async () => {
    try {
      const values = await form.validateFields();
      const topComments = values.top_comments
        ? values.top_comments.split('\n').map((s: string) => s.trim()).filter(Boolean)
        : [];
      const observations = values.observations
        ? values.observations.split('\n').map((s: string) => s.trim()).filter(Boolean)
        : [];

      await doRetro({
        pred_id: selectedPred!.id,
        actual_plays: Number(values.actual_plays),
        actual_likes: Number(values.actual_likes || 0),
        actual_comments: Number(values.actual_comments || 0),
        actual_shares: Number(values.actual_shares || 0),
        actual_saves: Number(values.actual_saves || 0),
        top_comments: topComments,
        observations,
      });

      message.success('复盘提交成功');
      setModalOpen(false);
      setSelectedPred(null);
    } catch {
      // validation failed
    }
  };

  // ===== Retro Chart =====
  const retroChartData = completedRetros.map(p => {
    const predicted = p.prediction?.center_estimate_w ?? 0;
    const actual = p.retro?.actual_plays ?? 0;
    return { material: p.material_id, predicted, actual };
  });

  const chartOption = retroChartData.length > 0 ? {
    tooltip: { trigger: 'axis' as const },
    legend: { data: ['预测播放', '实际播放'], textStyle: { color: textSecondary } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category' as const,
      data: retroChartData.map(d => d.material),
      axisLabel: { color: textMuted, rotate: 30 },
    },
    yAxis: { type: 'value' as const, axisLabel: { color: textMuted } },
    series: [
      { name: '预测播放', type: 'bar', data: retroChartData.map(d => d.predicted), itemStyle: { color: blue } },
      { name: '实际播放', type: 'bar', data: retroChartData.map(d => d.actual), itemStyle: { color: green } },
    ],
  } : null;

  // ===== Table Columns =====
  const retroColumns = [
    {
      title: '素材', dataIndex: 'material_id', key: 'material',
      render: (v: string) => <Text style={{ color: textPrimary, fontSize: 13 }}>{v}</Text>,
    },
    {
      title: '预测桶', key: 'bucket',
      render: (_: any, r: Prediction) => (
        <Tag color={blue}>{r.prediction?.bucket ?? '-'}</Tag>
      ),
    },
    {
      title: '实际播放', key: 'actual',
      render: (_: any, r: Prediction) => (
        <Text style={{ color: textPrimary }}>{r.retro?.actual_plays?.toLocaleString() ?? '-'}</Text>
      ),
    },
    {
      title: '误差%', key: 'error',
      render: (_: any, r: Prediction) => {
        const pct = getErrorPct(r);
        if (pct === null) return <Text style={{ color: textMuted }}>-</Text>;
        return <Text style={{ color: getErrorColor(pct) }}>{pct.toFixed(1)}%</Text>;
      },
    },
    {
      title: '方向', key: 'direction',
      render: (_: any, r: Prediction) => {
        const dir = getDirection(r);
        return <Tag color={getDirectionColor(dir)}>{dir}</Tag>;
      },
    },
    {
      title: '日期', dataIndex: 'created_at', key: 'date',
      render: (v: string) => (
        <Text style={{ color: textMuted, fontSize: 12 }}>{v?.slice(0, 10) ?? '-'}</Text>
      ),
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
                <ExperimentOutlined style={{ marginRight: 8, color: purple }} />
                复盘中心
              </Title>
              <Text style={{ color: textMuted }}>T+3 天数据对比 → 提取观察 → 触发进化</Text>
            </div>
            <CheatHelp page="retro" />
          </div>
        </div>

        {/* Pending Retros */}
        <Card
          title={
            <Space>
              <SyncOutlined spin={pendingRetros.length > 0} style={{ color: yellow }} />
              <Text style={{ color: textPrimary, fontWeight: 600 }}>待复盘预测</Text>
              <Tag color={yellow}>{pendingRetros.length} 条</Tag>
            </Space>
          }
          style={cardStyle}
          styles={{ header: { background: 'transparent', borderBottom: `1px solid ${border}` }, body: { padding: 16 } }}
        >
          {pendingRetros.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <CheckCircleOutlined style={{ fontSize: 48, color: green, marginBottom: 12 }} />
              <div><Text style={{ color: textSecondary }}>暂无待复盘预测</Text></div>
            </div>
          ) : (
            <Row gutter={[16, 16]}>
              {pendingRetros.map(pred => (
                <Col key={pred.id} xs={24} sm={12} lg={8} xl={6}>
                  <Card
                    size="small"
                    style={{ background: '#0f172a', border: `1px solid ${border}`, borderRadius: 8 }}
                    styles={{ body: { padding: 16 } }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }} size={8}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ color: textPrimary, fontWeight: 600 }}>{pred.material_id}</Text>
                        <Tag color={blue}>{pred.prediction?.bucket}</Tag>
                      </div>
                      <div>
                        <Text style={{ color: textMuted, fontSize: 12 }}>预测播放: </Text>
                        <Text style={{ color: textPrimary }}>
                          {pred.prediction?.center_estimate_w?.toLocaleString() ?? '-'}w
                        </Text>
                      </div>
                      <div>
                        <Text style={{ color: textMuted, fontSize: 12 }}>创建时间: </Text>
                        <Text style={{ color: textMuted, fontSize: 12 }}>{pred.created_at?.slice(0, 10)}</Text>
                      </div>
                      <Button
                        type="primary"
                        size="small"
                        block
                        icon={<ExperimentOutlined />}
                        onClick={() => handleOpenRetro(pred)}
                      >
                        开始复盘
                      </Button>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Card>

        {/* Chart */}
        {chartOption && (
          <Card
            title={
              <Space>
                <BarChartOutlined style={{ color: blue }} />
                <Text style={{ color: textPrimary, fontWeight: 600 }}>预测 vs 实际对比</Text>
              </Space>
            }
            style={{ ...cardStyle, marginTop: 16 }}
            styles={{ header: { background: 'transparent', borderBottom: `1px solid ${border}` }, body: { padding: 16 } }}
          >
            <ReactECharts option={chartOption} style={{ height: 320 }} />
          </Card>
        )}

        {/* Completed Retros */}
        <Card
          title={
            <Space>
              <FileTextOutlined style={{ color: green }} />
              <Text style={{ color: textPrimary, fontWeight: 600 }}>已完成复盘</Text>
              <Tag color={green}>{completedRetros.length} 条</Tag>
            </Space>
          }
          style={{ ...cardStyle, marginTop: 16 }}
          styles={{ header: { background: 'transparent', borderBottom: `1px solid ${border}` }, body: { padding: 0 } }}
        >
          <Table
            dataSource={completedRetros}
            columns={retroColumns}
            rowKey="id"
            pagination={{ pageSize: 10, showSizeChanger: false }}
            size="small"
            style={{ background: 'transparent' }}
          />
        </Card>

        {/* Retro Modal */}
        <Modal
          title={
            <Space>
              <ExperimentOutlined style={{ color: purple }} />
              <Text style={{ color: textPrimary }}>复盘 — {selectedPred?.material_id}</Text>
            </Space>
          }
          open={modalOpen}
          onCancel={() => setModalOpen(false)}
          onOk={handleSubmitRetro}
          okText="提交复盘"
          cancelText="取消"
          width={600}
          styles={{ header: { background: cardBg }, body: { background: cardBg }, footer: { background: cardBg } }}
        >
          <Divider style={{ borderColor: border, margin: '12px 0' }} />
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="actual_plays" label={<Text style={{ color: textSecondary }}>实际播放量</Text>} rules={[{ required: true, message: '请输入实际播放量' }]}>
                  <Input type="number" placeholder="e.g. 150000" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="actual_likes" label={<Text style={{ color: textSecondary }}>实际点赞数</Text>}>
                  <Input type="number" placeholder="e.g. 5000" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="actual_comments" label={<Text style={{ color: textSecondary }}>评论数</Text>}>
                  <Input type="number" placeholder="0" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="actual_shares" label={<Text style={{ color: textSecondary }}>分享数</Text>}>
                  <Input type="number" placeholder="0" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="actual_saves" label={<Text style={{ color: textSecondary }}>收藏数</Text>}>
                  <Input type="number" placeholder="0" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="top_comments" label={<Text style={{ color: textSecondary }}>热门评论 (每行一条)</Text>}>
              <TextArea rows={3} placeholder="评论1&#10;评论2&#10;评论3" />
            </Form.Item>
            <Form.Item name="observations" label={<Text style={{ color: textSecondary }}>观察结论 (每行一条)</Text>}>
              <TextArea rows={3} placeholder="观察1&#10;观察2" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </Spin>
  );
}