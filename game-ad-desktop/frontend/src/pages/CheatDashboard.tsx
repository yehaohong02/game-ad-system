import { useEffect, useState } from 'react';
import { Card, Row, Col, Button, Tag, Typography, Spin, Alert, Space, Badge, Upload, Table } from 'antd';
import {
  RocketOutlined, ExperimentOutlined, BarChartOutlined, BulbOutlined,
  CheckCircleOutlined, WarningOutlined, SyncOutlined, LineChartOutlined,
  PlayCircleOutlined, AuditOutlined, FunctionOutlined, ThunderboltOutlined,
  UploadOutlined, FileExcelOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import axios from 'axios';
import { useCheatStore } from '../stores/cheat';
import CheatHelp from './CheatHelp';
// CheatDashboard uses page="dashboard"

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

// ─── 置信度颜色 ───
function confidenceColor(confidence: string): string {
  switch (confidence) {
    case 'high': return green;
    case 'medium': return yellow;
    case 'low': return red;
    default: return textMuted;
  }
}

// ─── 缓冲区颜色 ───
function bufferColor(color: string): string {
  switch (color) {
    case 'green': return green;
    case 'yellow': return yellow;
    case 'red': return red;
    default: return textMuted;
  }
}

// ═══════════════════════════════════════════════════
// 主页面
// ═══════════════════════════════════════════════════
export default function CheatDashboard() {
  const { loading, error, status, scoreCurve, fetchStatus, fetchPredictions, fetchScoreCurve } = useCheatStore();
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  useEffect(() => {
    fetchStatus();
    fetchPredictions();
    fetchScoreCurve();
  }, [fetchStatus, fetchPredictions, fetchScoreCurve]);

  const s = status;
  const pendingRetros = s?.pending_retros ?? [];

  // ─── 维度列定义 ───
  const dimColumns = [
    { key: 'ER', label: '情感共鸣' },
    { key: 'SR', label: '社会共鸣' },
    { key: 'HP', label: '钩子潜力' },
    { key: 'QL', label: '金句密度' },
    { key: 'NA', label: '叙事性' },
    { key: 'AB', label: '受众广度' },
    { key: 'SAT', label: '投放效率' },
  ].map(({ key: dim, label }) => ({
    title: `${dim} ${label}`,
    key: dim, width: 80, align: 'center' as const,
    render: (_: any, record: any) => {
      const v = record.scores?.[dim] ?? 0;
      const color = v >= 4 ? green : v >= 2.5 ? yellow : textMuted;
      return <span style={{ color, fontWeight: 600, fontSize: 13 }}>{v}</span>;
    },
  }));

  // ─── Excel 上传处理 ───
  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const resp = await axios.post('http://localhost:8002/api/experiment/phase0/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadResult(resp.data);
      fetchStatus();
    } catch (err: any) {
      setUploadResult({ status: 'error', message: err.response?.data?.detail || err.message });
    } finally {
      setUploading(false);
    }
    return false;
  };

  // ─── Score Curve 图表配置 ───
  const curveOption = (() => {
    const curve = scoreCurve;
    if (!curve || !curve.points || curve.points.length === 0) return null;

    const points = curve.points as { date: string; error: number }[];
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const p = params[0];
          return `<b>${p.name}</b><br/>误差: ${fmt(p.value, 3)}`;
        },
      },
      grid: { left: 50, right: 20, top: 20, bottom: 40 },
      xAxis: {
        type: 'category',
        data: points.map(p => p.date),
        axisLabel: { color: textMuted, fontSize: 11 },
        axisLine: { lineStyle: { color: border } },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: textMuted },
        splitLine: { lineStyle: { color: '#1E293B' } },
      },
      series: [{
        type: 'line',
        data: points.map(p => p.error),
        smooth: true,
        lineStyle: { color: cyan, width: 2 },
        itemStyle: { color: cyan },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: `${cyan}30` },
              { offset: 1, color: `${cyan}05` },
            ],
          },
        },
      }],
    };
  })();

  return (
    <div style={{ padding: 0 }}>
      {/* ─── 页头 ─── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: 'linear-gradient(135deg, #06B6D4 0%, #8B5CF6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, color: '#fff',
          }}>
            <RocketOutlined />
          </div>
          <div>
            <Title level={4} style={{ margin: 0, color: textPrimary }}>Cheat-on-Content 校准系统</Title>
            <Text style={{ color: textMuted }}>Score → Predict → Publish → Retro → Evolve</Text>
          </div>
        </div>
        <Space size={12}>
          <CheatHelp page="dashboard" />
          <Upload accept=".xlsx,.xls" showUploadList={false} beforeUpload={handleUpload}>
            <Button icon={<UploadOutlined />} loading={uploading} size="large"
              style={{ borderRadius: 8, fontWeight: 600, background: `${green}15`, borderColor: `${green}40`, color: green }}>
              {uploading ? '分析中...' : '导入 Excel 评分'}
            </Button>
          </Upload>
          {s && (
            <Tag color="blue" style={{ fontSize: 13, padding: '2px 12px' }}>
              v{s.state.schema_version} / Rubric v{s.state.rubric_version}
            </Tag>
          )}
          <Button icon={<SyncOutlined />} loading={loading}
            onClick={() => { fetchStatus(); fetchPredictions(); fetchScoreCurve(); }}
            size="large" style={{ borderRadius: 8, fontWeight: 600 }}>
            刷新
          </Button>
        </Space>
      </div>

      {/* ─── 加载中 ─── */}
      {loading && !s && (
        <Card style={{ background: cardBg, border: `1px solid ${border}`, textAlign: 'center', padding: 60, borderRadius: 12 }}>
          <Spin size="large" />
          <div style={{ marginTop: 20, color: textSecondary, fontSize: 16, fontWeight: 500 }}>
            正在加载校准系统状态...
          </div>
        </Card>
      )}

      {/* ─── 错误 ─── */}
      {error && !loading && (
        <Alert message="系统错误" description={error} type="error" showIcon
          style={{ marginBottom: 16, background: '#EF444410', border: `1px solid ${red}40`, borderRadius: 12 }} />
      )}

      {/* ─── Excel 导入评分结果 ─── */}
      {uploadResult && !uploading && (
        <Card style={{ background: cardBg, border: `1px solid ${uploadResult.status === 'error' ? red : green}40`, borderRadius: 12, marginBottom: 16 }}
          styles={{ body: { padding: '16px 20px' } }}>
          {uploadResult.status === 'error' ? (
            <Alert message="导入失败" description={uploadResult.message} type="error" showIcon style={{ background: 'transparent', border: 'none', padding: 0 }} />
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FileExcelOutlined style={{ color: green, fontSize: 20 }} />
                  <Text strong style={{ color: textPrimary, fontSize: 16 }}>
                    自动评分完成 — {uploadResult.data?.sample_count || 0} 条素材
                  </Text>
                  <Tag color="green">{uploadResult.data?.cheat_scored_count || 0} 条已评分</Tag>
                </div>
                <Tag color={uploadResult.recommendation === 'go' ? 'success' : uploadResult.recommendation === 'no-go' ? 'error' : 'warning'}>
                  {uploadResult.recommendation?.toUpperCase()}
                </Tag>
              </div>

              {/* 评分结果表格 */}
              {uploadResult.data?.cheat_scores?.length > 0 && (
                <Table
                  dataSource={uploadResult.data.cheat_scores}
                  rowKey="material_id"
                  size="small"
                  pagination={{ pageSize: 10, showSizeChanger: false }}
                  columns={[
                    {
                      title: '素材 ID', dataIndex: 'material_id', key: 'id', width: 140,
                      render: (v: any) => <Text style={{ color: textPrimary, fontSize: 13 }}>{String(v).slice(0, 15)}</Text>,
                    },
                    ...dimColumns,
                    {
                      title: '综合分', dataIndex: 'composite', key: 'composite', width: 80, sorter: (a: any, b: any) => a.composite - b.composite,
                      render: (v: number) => <Text style={{ color: blue, fontWeight: 700, fontSize: 14 }}>{v}</Text>,
                    },
                    {
                      title: '分桶', dataIndex: 'bucket', key: 'bucket', width: 100,
                      render: (b: string, record: any) => {
                        const colorMap: Record<string, string> = { viral: green, outperform: cyan, average: blue, underperform: yellow, flop: red };
                        return <Tag color={colorMap[b] || 'default'}>{record.bucket_label}</Tag>;
                      },
                    },
                  ]}
                />
              )}

              {/* 分桶分布统计 */}
              {uploadResult.data?.cheat_scores?.length > 0 && (() => {
                const scores = uploadResult.data.cheat_scores;
                const buckets: Record<string, number> = {};
                scores.forEach((s: any) => { buckets[s.bucket] = (buckets[s.bucket] || 0) + 1; });
                const bucketLabels: Record<string, { label: string; color: string }> = {
                  viral: { label: '爆款', color: green },
                  outperform: { label: '超均', color: cyan },
                  average: { label: '均值', color: blue },
                  underperform: { label: '低于均值', color: yellow },
                  flop: { label: '扑街', color: red },
                };
                return (
                  <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
                    {Object.entries(bucketLabels).map(([key, { label, color }]) => (
                      <div key={key} style={{
                        flex: 1, minWidth: 100, textAlign: 'center', padding: '12px 8px',
                        background: `${color}10`, borderRadius: 8, border: `1px solid ${color}30`,
                      }}>
                        <div style={{ fontSize: 24, fontWeight: 800, color }}>{buckets[key] || 0}</div>
                        <div style={{ color: textSecondary, fontSize: 12, marginTop: 4 }}>{label}</div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </>
          )}
        </Card>
      )}

      {/* ─── 状态卡片行 ─── */}
      {s && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Row gutter={16}>
            {/* 校准样本数 */}
            <Col span={6}>
              <Card style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12 }}
                styles={{ body: { padding: '20px 24px' } }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: `${blue}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: blue, fontSize: 22,
                  }}><ExperimentOutlined /></div>
                  <div>
                    <div style={{ color: textMuted, fontSize: 13, marginBottom: 4 }}>校准样本数</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ color: textPrimary, fontSize: 28, fontWeight: 700 }}>{s.state.calibration_samples}</span>
                      <Tag color={confidenceColor(s.state.confidence)} style={{ fontSize: 11, padding: '0 6px', borderRadius: 4 }}>
                        {s.state.confidence}
                      </Tag>
                    </div>
                    <div style={{ color: textMuted, fontSize: 11, marginTop: 2 }}>{s.state.content_form} / {s.state.platform}</div>
                  </div>
                </div>
              </Card>
            </Col>

            {/* 缓冲区状态 */}
            <Col span={6}>
              <Card style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12 }}
                styles={{ body: { padding: '20px 24px' } }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: `${bufferColor(s.buffer.color)}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: bufferColor(s.buffer.color), fontSize: 22,
                  }}><BarChartOutlined /></div>
                  <div>
                    <div style={{ color: textMuted, fontSize: 13, marginBottom: 4 }}>缓冲区状态</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ color: textPrimary, fontSize: 28, fontWeight: 700 }}>{s.buffer.count}</span>
                      <span style={{ color: textMuted, fontSize: 14 }}>条</span>
                      <Badge color={bufferColor(s.buffer.color)} />
                    </div>
                    <div style={{ color: textMuted, fontSize: 11, marginTop: 2 }}>{s.buffer.days} 天窗口</div>
                  </div>
                </div>
              </Card>
            </Col>

            {/* 预测总数 */}
            <Col span={6}>
              <StatCard
                icon={<LineChartOutlined />}
                label="预测总数"
                value={s.predictions.total}
                color={purple}
                sub={`已发布 ${s.predictions.published} / 已复盘 ${s.predictions.retro_done}`}
              />
            </Col>

            {/* 平均误差 */}
            <Col span={6}>
              <Card style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12 }}
                styles={{ body: { padding: '20px 24px' } }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: `${cyan}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: cyan, fontSize: 22,
                  }}><ThunderboltOutlined /></div>
                  <div>
                    <div style={{ color: textMuted, fontSize: 13, marginBottom: 4 }}>平均误差</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ color: textPrimary, fontSize: 28, fontWeight: 700 }}>{fmt(s.retro.avg_error)}</span>
                      <span style={{ color: textMuted, fontSize: 14 }}>W</span>
                    </div>
                    <div style={{ color: textMuted, fontSize: 11, marginTop: 2 }}>
                      方向准确率 {(s.retro.direction_accuracy * 100).toFixed(0)}% / 共 {s.retro.total} 次复盘
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          {/* ─── 快捷操作行 ─── */}
          <Card style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12 }}
            styles={{ body: { padding: '16px 24px' } }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Text style={{ color: textMuted, fontSize: 13, whiteSpace: 'nowrap' }}>快捷操作</Text>
              <Space size={12}>
                <Button icon={<PlayCircleOutlined />} size="large"
                  style={{ borderRadius: 8, fontWeight: 600, borderColor: cyan, color: cyan }}>
                  评分
                </Button>
                <Button icon={<BulbOutlined />} size="large"
                  style={{ borderRadius: 8, fontWeight: 600, borderColor: purple, color: purple }}>
                  预测
                </Button>
                <Button icon={<AuditOutlined />} size="large"
                  style={{ borderRadius: 8, fontWeight: 600, borderColor: green, color: green }}>
                  复盘
                </Button>
                <Button icon={<FunctionOutlined />} size="large"
                  style={{ borderRadius: 8, fontWeight: 600, borderColor: yellow, color: yellow }}>
                  公式
                </Button>
              </Space>
            </div>
          </Card>

          {/* ─── Bump Trigger 警告 ─── */}
          {s.bump_trigger.should_bump && (
            <Alert
              message="公式升级触发"
              description={s.bump_trigger.reason || '检测到校准数据偏差，建议执行公式升级（bump）。'}
              type="warning"
              showIcon
              icon={<WarningOutlined />}
              style={{
                background: '#F59E0B10',
                border: `1px solid ${yellow}40`,
                borderRadius: 12,
              }}
              action={
                <Button size="small" type="primary" danger style={{ borderRadius: 6, fontWeight: 600 }}>
                  立即升级
                </Button>
              }
            />
          )}

          {/* ─── 待复盘列表 ─── */}
          <Card style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12 }}
            styles={{ body: { padding: '16px 20px' } }}>
            <SectionTitle icon={<AuditOutlined />} title="待复盘预测" subtitle={`共 ${pendingRetros.length} 条预测等待复盘`} color={green} />
            {pendingRetros.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: textMuted }}>
                <CheckCircleOutlined style={{ fontSize: 28, marginBottom: 8, color: green }} />
                <div>暂无待复盘项</div>
              </div>
            ) : (
              <Row gutter={[12, 12]}>
                {pendingRetros.map((p: any) => (
                  <Col span={8} key={p.id}>
                    <Card style={{ background: '#0F172A', border: `1px solid ${border}`, borderRadius: 10 }}
                      styles={{ body: { padding: '14px 16px' } }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <Text strong style={{ color: textPrimary, fontSize: 13 }}>{p.material_id || p.id}</Text>
                        <Tag color={p.status === 'published' ? 'blue' : 'default'} style={{ fontSize: 11 }}>
                          {p.status}
                        </Tag>
                      </div>
                      {p.prediction && (
                        <div style={{ color: textSecondary, fontSize: 12, marginBottom: 6 }}>
                          预测: {p.prediction.bucket} ({p.prediction.center_estimate_w}W)
                        </div>
                      )}
                      {p.created_at && (
                        <div style={{ color: textMuted, fontSize: 11 }}>
                          {new Date(p.created_at).toLocaleDateString('zh-CN')}
                        </div>
                      )}
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Card>

          {/* ─── Score Curve 图表 ─── */}
          <Card style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12 }}
            styles={{ body: { padding: '16px 20px' } }}>
            <SectionTitle icon={<LineChartOutlined />} title="预测误差趋势" subtitle="复盘误差随时间变化" color={cyan} />
            {curveOption ? (
              <ReactECharts option={curveOption} style={{ height: 300 }} />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: textMuted }}>
                暂无复盘数据，误差曲线将在首次复盘后显示
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ─── 空状态 ─── */}
      {!s && !loading && !error && (
        <Card style={{ background: cardBg, border: `1px solid ${border}`, textAlign: 'center', padding: 80, borderRadius: 12 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20, margin: '0 auto 20px',
            background: 'linear-gradient(135deg, #06B6D420 0%, #8B5CF620 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 40, color: cyan,
          }}>
            <RocketOutlined />
          </div>
          <div style={{ color: textPrimary, fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
            尚未初始化校准系统
          </div>
          <div style={{ color: textSecondary, fontSize: 14, maxWidth: 480, margin: '0 auto 24px' }}>
            请先初始化 Cheat-on-Content 项目，建立校准基线后即可开始 Score → Predict → Publish → Retro → Evolve 循环
          </div>
          <Space size={16}>
            <Button type="primary" icon={<RocketOutlined />} size="large"
              onClick={() => useCheatStore.getState().initProject()}
              style={{ borderRadius: 8, fontWeight: 600, height: 44, paddingInline: 28 }}>
              初始化项目
            </Button>
          </Space>
        </Card>
      )}
    </div>
  );
}