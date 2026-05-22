import { useState, useEffect, useMemo } from 'react';
import { Row, Col, Typography, Table, Tag, Statistic, Card } from 'antd';
import ReactECharts from 'echarts-for-react';
import { useManagerDataStore, DesignerStats } from '../../stores/manager/managerData';
import DesignerCard from '../../components/manager/DesignerCard';
import DesignerDetailModal from '../../components/manager/DesignerDetailModal';
import type { CardSection } from '../../components/manager/DesignerCard';
import type { DetailSection } from '../../components/manager/DesignerDetailModal';

const { Title, Text } = Typography;

const panelBg = '#0F172A';
const cardBg = '#1E293B';
const border = '#334155';
const text = '#e2e8f0';
const muted = '#64748b';
const blue = '#3b82f6';
const green = '#10b981';
const red = '#ef4444';
const yellow = '#f59e0b';
const purple = '#8b5cf6';

export default function ManagerDashboard() {
  const { designers, refresh, setSelectedDesigner } = useManagerDataStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeDesigner, setActiveDesigner] = useState<DesignerStats | null>(null);

  useEffect(() => { refresh(); }, [refresh]);

  const totalSpend = useMemo(() => designers.reduce((s, d) => s + d.totalSpend, 0), [designers]);
  const totalMaterials = useMemo(() => designers.reduce((s, d) => s + d.materialCount, 0), [designers]);
  const highRiskCount = useMemo(() => designers.filter(d => d.riskLevel === 'high').length, [designers]);
  const allMedia = useMemo(() => Array.from(new Set(designers.flatMap(d => d.mediaBreakdown.map(m => m.media)))), [designers]);

  const handleCardClick = (designer: DesignerStats) => {
    setActiveDesigner(designer);
    setSelectedDesigner(designer.name);
    setModalOpen(true);
  };

  const getCardSections = (d: DesignerStats): CardSection[] => {
    const sorted = [...d.materials].sort((a, b) => b.spend - a.spend);
    const top3 = sorted.slice(0, 3);
    const bottom3 = sorted.filter(m => m.spend > 0).slice(-3).reverse();

    const chipStyle: React.CSSProperties = {
      background: '#0F172A', borderRadius: 4, padding: '4px 6px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    };

    return [
      {
        title: '核心指标',
        content: (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
            <div style={chipStyle}>
              <span style={{ color: muted, fontSize: 10 }}>素材数</span>
              <span style={{ color: blue, fontSize: 11, fontWeight: 600 }}>{d.materialCount}</span>
            </div>
            <div style={chipStyle}>
              <span style={{ color: muted, fontSize: 10 }}>总花费</span>
              <span style={{ color: yellow, fontSize: 11, fontWeight: 600 }}>${d.totalSpend.toFixed(0)}</span>
            </div>
            <div style={chipStyle}>
              <span style={{ color: muted, fontSize: 10 }}>平均CPM</span>
              <span style={{ color: yellow, fontSize: 11, fontWeight: 600 }}>${d.avgCpm.toFixed(1)}</span>
            </div>
            <div style={chipStyle}>
              <span style={{ color: muted, fontSize: 10 }}>平均CTR</span>
              <span style={{ color: green, fontSize: 11, fontWeight: 600 }}>{(d.avgCtr * 100).toFixed(2)}%</span>
            </div>
            <div style={chipStyle}>
              <span style={{ color: muted, fontSize: 10 }}>平均CPC</span>
              <span style={{ color: blue, fontSize: 11, fontWeight: 600 }}>${d.avgCpc.toFixed(2)}</span>
            </div>
            <div style={chipStyle}>
              <span style={{ color: muted, fontSize: 10 }}>完播率</span>
              <span style={{ color: purple, fontSize: 11, fontWeight: 600 }}>{(d.avgPlay100Rate * 100).toFixed(1)}%</span>
            </div>
          </div>
        ),
      },
      {
        title: 'TOP3花费',
        content: (
          <div>
            {top3.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 0' }}>
                <span style={{ color: text, fontSize: 10, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.materialId.slice(0, 8)}
                </span>
                <span style={{ color: yellow, fontSize: 10 }}>${m.spend.toFixed(0)}</span>
                <span style={{ color: green, fontSize: 10 }}>{(m.ctr * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        ),
      },
      {
        title: 'BOTTOM3花费',
        content: (
          <div>
            {bottom3.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 0' }}>
                <span style={{ color: text, fontSize: 10, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.materialId.slice(0, 8)}
                </span>
                <span style={{ color: yellow, fontSize: 10 }}>${m.spend.toFixed(0)}</span>
                <span style={{ color: green, fontSize: 10 }}>{(m.ctr * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        ),
      },
      {
        title: '渠道分布',
        content: (
          <div>
            {d.mediaBreakdown.map((mb, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
                <span style={{ color: text, fontSize: 10 }}>{mb.media}</span>
                <span style={{ color: blue, fontSize: 10 }}>{mb.count}素材</span>
                <span style={{ color: yellow, fontSize: 10 }}>${mb.spend.toFixed(0)}</span>
              </div>
            ))}
          </div>
        ),
      },
    ];
  };

  const getModalSections = (d: DesignerStats): DetailSection[] => [
    {
      title: '核心指标',
      content: (
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 12 } }}>
              <Statistic title={<span style={{ color: muted }}>总花费</span>} value={d.totalSpend} prefix="$" precision={0}
                valueStyle={{ color: yellow, fontSize: 20 }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 12 } }}>
              <Statistic title={<span style={{ color: muted }}>总展示</span>} value={d.totalImpressions}
                valueStyle={{ color: blue, fontSize: 20 }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 12 } }}>
              <Statistic title={<span style={{ color: muted }}>平均CTR</span>} value={d.avgCtr * 100} suffix="%" precision={2}
                valueStyle={{ color: green, fontSize: 20 }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 12 } }}>
              <Statistic title={<span style={{ color: muted }}>效率评分</span>} value={d.efficiencyScore} suffix="/100"
                valueStyle={{ color: d.efficiencyScore >= 60 ? green : red, fontSize: 20 }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 12 } }}>
              <Statistic title={<span style={{ color: muted }}>总点击</span>} value={d.totalClicks}
                valueStyle={{ color: blue, fontSize: 20 }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 12 } }}>
              <Statistic title={<span style={{ color: muted }}>平均CPM</span>} value={d.avgCpm} prefix="$" precision={2}
                valueStyle={{ color: yellow, fontSize: 20 }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 12 } }}>
              <Statistic title={<span style={{ color: muted }}>平均CPC</span>} value={d.avgCpc} prefix="$" precision={2}
                valueStyle={{ color: yellow, fontSize: 20 }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 12 } }}>
              <Statistic title={<span style={{ color: muted }}>完播率</span>} value={d.avgPlay100Rate * 100} suffix="%" precision={1}
                valueStyle={{ color: purple, fontSize: 20 }} />
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      title: '渠道分布',
      content: (
        <Table
          dataSource={d.mediaBreakdown}
          rowKey="media"
          size="small"
          pagination={false}
          style={{ background: cardBg }}
          columns={[
            { title: '渠道', dataIndex: 'media', key: 'media', render: (v: string) => <Text style={{ color: text, fontSize: 12 }}>{v}</Text> },
            { title: '素材数', dataIndex: 'count', key: 'count', render: (v: number) => <Text style={{ color: blue, fontSize: 12 }}>{v}</Text> },
            { title: '花费', dataIndex: 'spend', key: 'spend', render: (v: number) => <Text style={{ color: yellow, fontSize: 12 }}>${v.toFixed(0)}</Text> },
            { title: '平均CTR', dataIndex: 'avgCtr', key: 'avgCtr', render: (v: number) => <Text style={{ color: green, fontSize: 12 }}>{(v * 100).toFixed(2)}%</Text> },
            { title: '平均CPM', dataIndex: 'avgCpm', key: 'avgCpm', render: (v: number) => <Text style={{ color: text, fontSize: 12 }}>${v.toFixed(2)}</Text> },
          ]}
        />
      ),
    },
    {
      title: '游戏分布',
      content: (
        <Table
          dataSource={d.gameBreakdown}
          rowKey="game"
          size="small"
          pagination={false}
          style={{ background: cardBg }}
          columns={[
            { title: '游戏', dataIndex: 'game', key: 'game', render: (v: string) => <Text style={{ color: text, fontSize: 12 }}>{v}</Text> },
            { title: '素材数', dataIndex: 'count', key: 'count', render: (v: number) => <Text style={{ color: blue, fontSize: 12 }}>{v}</Text> },
            { title: '花费', dataIndex: 'spend', key: 'spend', render: (v: number) => <Text style={{ color: yellow, fontSize: 12 }}>${v.toFixed(0)}</Text> },
            { title: '平均CTR', dataIndex: 'avgCtr', key: 'avgCtr', render: (v: number) => <Text style={{ color: green, fontSize: 12 }}>{(v * 100).toFixed(2)}%</Text> },
            { title: '平均CPM', dataIndex: 'avgCpm', key: 'avgCpm', render: (v: number) => <Text style={{ color: text, fontSize: 12 }}>${v.toFixed(2)}</Text> },
          ]}
        />
      ),
    },
    {
      title: '高效素材 TOP5',
      content: (
        <Table
          dataSource={d.topMaterials}
          rowKey="materialId"
          size="small"
          pagination={false}
          style={{ background: cardBg }}
          columns={[
            { title: '素材ID', dataIndex: 'materialId', key: 'materialId', render: (v: string) => <Text style={{ color: text, fontSize: 12 }}>{v}</Text> },
            { title: '分类', dataIndex: 'category', key: 'category', render: (v: string) => <Text style={{ color: muted, fontSize: 12 }}>{v}</Text> },
            { title: '花费', dataIndex: 'spend', key: 'spend', render: (v: number) => <Text style={{ color: yellow, fontSize: 12 }}>${v.toFixed(2)}</Text> },
            { title: 'CTR', dataIndex: 'ctr', key: 'ctr', render: (v: number) => <Text style={{ color: green, fontSize: 12 }}>{(v * 100).toFixed(2)}%</Text> },
            { title: '展示', dataIndex: 'impressions', key: 'impressions', render: (v: number) => <Text style={{ color: text, fontSize: 12 }}>{v.toLocaleString()}</Text> },
          ]}
        />
      ),
    },
    {
      title: '低效素材 BOTTOM5',
      content: (
        <Table
          dataSource={d.bottomMaterials}
          rowKey="materialId"
          size="small"
          pagination={false}
          style={{ background: cardBg }}
          rowClassName={() => 'low-efficiency-row'}
          columns={[
            { title: '素材ID', dataIndex: 'materialId', key: 'materialId', render: (v: string) => <Text style={{ color: red, fontSize: 12 }}>{v}</Text> },
            { title: '分类', dataIndex: 'category', key: 'category', render: (v: string) => <Text style={{ color: muted, fontSize: 12 }}>{v}</Text> },
            { title: '花费', dataIndex: 'spend', key: 'spend', render: (v: number) => <Text style={{ color: yellow, fontSize: 12 }}>${v.toFixed(2)}</Text> },
            { title: 'CTR', dataIndex: 'ctr', key: 'ctr', render: (v: number) => <Text style={{ color: red, fontSize: 12 }}>{(v * 100).toFixed(2)}%</Text> },
            { title: '展示', dataIndex: 'impressions', key: 'impressions', render: (v: number) => <Text style={{ color: text, fontSize: 12 }}>{v.toLocaleString()}</Text> },
          ]}
        />
      ),
    },
    {
      title: '素材列表',
      content: (
        <Table
          dataSource={d.materials}
          rowKey="materialId"
          size="small"
          pagination={{ pageSize: 8 }}
          style={{ background: cardBg }}
          columns={[
            { title: '素材ID', dataIndex: 'materialId', key: 'materialId', render: (v: string) => <Text style={{ color: text, fontSize: 12 }}>{v}</Text> },
            { title: '游戏', key: 'game', render: (_: any, r: any) => <Text style={{ color: muted, fontSize: 12 }}>{r.game || r.category || '-'}</Text> },
            { title: '渠道', key: 'media', render: (_: any, r: any) => <Text style={{ color: muted, fontSize: 12 }}>{r.media || '-'}</Text> },
            { title: '花费', dataIndex: 'spend', key: 'spend', render: (v: number) => <Text style={{ color: yellow, fontSize: 12 }}>${v.toFixed(2)}</Text> },
            { title: '展示', dataIndex: 'impressions', key: 'impressions', render: (v: number) => <Text style={{ color: text, fontSize: 12 }}>{v.toLocaleString()}</Text> },
            { title: 'CTR', dataIndex: 'ctr', key: 'ctr', render: (v: number) => <Text style={{ color: green, fontSize: 12 }}>{(v * 100).toFixed(2)}%</Text> },
            { title: 'CPM', dataIndex: 'cpm', key: 'cpm', render: (v: number) => <Text style={{ color: text, fontSize: 12 }}>${v.toFixed(2)}</Text> },
            { title: '播放量', dataIndex: 'playCount', key: 'playCount', render: (v: number) => <Text style={{ color: text, fontSize: 12 }}>{(v || 0).toLocaleString()}</Text> },
            {
              title: '完播率', key: 'play100Rate',
              render: (_: any, r: any) => <Text style={{ color: purple, fontSize: 12 }}>{r.playCount > 0 ? (r.play100 / r.playCount * 100).toFixed(1) : 0}%</Text>,
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: 16, background: panelBg, minHeight: '100vh' }}>
      <Title level={4} style={{ color: text, marginBottom: 16 }}>管理者总览</Title>

      {designers.length === 0 && (
        <div style={{ color: muted, textAlign: 'center', padding: 60, fontSize: 14 }}>
          暂无数据，请点击"导入Excel"按钮导入素材表
        </div>
      )}

      {designers.length > 0 && (
        <>
      {/* Summary stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 16 } }}>
            <Statistic title={<span style={{ color: muted }}>设计师数</span>} value={designers.length}
              valueStyle={{ color: blue, fontSize: 28 }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 16 } }}>
            <Statistic title={<span style={{ color: muted }}>总花费</span>} value={totalSpend} prefix="$" precision={0}
              valueStyle={{ color: yellow, fontSize: 28 }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 16 } }}>
            <Statistic title={<span style={{ color: muted }}>总素材数</span>} value={totalMaterials}
              valueStyle={{ color: green, fontSize: 28 }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 16 } }}>
            <Statistic title={<span style={{ color: muted }}>高风险设计师</span>} value={highRiskCount}
              valueStyle={{ color: red, fontSize: 28 }} />
          </Card>
        </Col>
      </Row>

      {/* Per-designer analysis panel */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 16 } }}>
            <Text strong style={{ color: text, fontSize: 14, display: 'block', marginBottom: 12 }}>总览 · 管理者反馈</Text>
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              <Row gutter={[12, 8]}>
                {designers.map((d, idx) => {
                  const strengths: string[] = [];
                  const weaknesses: string[] = [];
                  const suggestions: string[] = [];
                  const totalSpendAll = designers.reduce((s,x)=>s+x.totalSpend,0);
                  const pct = totalSpendAll>0 ? d.totalSpend/totalSpendAll*100 : 0;
                  if (d.efficiencyScore >= 70) strengths.push(`效率优秀(${d.efficiencyScore}分)`);
                  else if (d.efficiencyScore < 50) weaknesses.push(`效率偏低(${d.efficiencyScore}分)`);
                  if (pct > 25) weaknesses.push(`花费占比过高(${pct.toFixed(1)}%)，预算集中风险`);
                  else if (pct < 5) weaknesses.push(`花费占比低(${pct.toFixed(1)}%)，可考虑追加`);
                  if (d.riskLevel === 'low') strengths.push('风险等级低，运行稳定');
                  else if (d.riskLevel === 'high') { weaknesses.push('高风险等级'); suggestions.push('重点排查异常素材，考虑熔断'); }
                  if (d.anomalyCount > 5) weaknesses.push(`异常素材${d.anomalyCount}条，数量偏多`);
                  if (d.materialCount > 50) strengths.push(`素材丰富(${d.materialCount}条)`);
                  else if (d.materialCount < 10) { weaknesses.push(`素材偏少(${d.materialCount}条)`); suggestions.push('增加素材多样性'); }
                  const mediaCount = d.mediaBreakdown.length;
                  if (mediaCount >= 3) strengths.push(`渠道覆盖广(${mediaCount}个)`);
                  else if (mediaCount < 2) weaknesses.push(`渠道单一(${mediaCount}个)`);
                  if (d.avgCtr > 0.012) strengths.push(`CTR优秀(${(d.avgCtr*100).toFixed(2)}%)`);
                  if (strengths.length === 0) strengths.push('各项指标中等');
                  if (weaknesses.length === 0) weaknesses.push('整体表现良好');
                  if (suggestions.length === 0) suggestions.push('保持当前投放策略');
                  const rankColor = idx === 0 ? yellow : idx === 1 ? '#c0c0c0' : idx === 2 ? '#cd7f32' : 'transparent';
                  return (
                    <Col span={8} key={d.name}>
                      <div style={{ background: panelBg, borderRadius: 6, padding: '8px 10px', borderLeft: rankColor ? `3px solid ${rankColor}` : '3px solid transparent' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          {idx < 3 && <Tag color={idx===0?'gold':idx===1?'default':'orange'} style={{fontSize:9,margin:0}}>#{idx+1}</Tag>}
                          <Text strong style={{ color: text, fontSize: 12 }}>{d.name}</Text>
                          <Text style={{ color: muted, fontSize: 10 }}>{d.materialCount}素材 ${d.totalSpend.toFixed(0)}</Text>
                        </div>
                        <div style={{ marginBottom: 3 }}><Text style={{ color: green, fontSize: 10 }}>优势：</Text><Text style={{ color: text, fontSize: 10 }}>{strengths.join('；')}</Text></div>
                        <div style={{ marginBottom: 3 }}><Text style={{ color: red, fontSize: 10 }}>劣势：</Text><Text style={{ color: text, fontSize: 10 }}>{weaknesses.join('；')}</Text></div>
                        <div><Text style={{ color: blue, fontSize: 10 }}>建议：</Text><Text style={{ color: text, fontSize: 10 }}>{suggestions.join('；')}</Text></div>
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: '12px 12px 8px' } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
              <Text strong style={{ color: text, fontSize: 13 }}>设计师花费对比</Text>
              <Text style={{ color: muted, fontSize: 10, textAlign: 'right', maxWidth: '55%', lineHeight: '14px' }}>各设计师广告花费对比，反映预算分配情况</Text>
            </div>
            <ReactECharts option={{
              backgroundColor: 'transparent',
              tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (p: any) => `${p[0].name}<br/>花费: $${p[0].value.toFixed(0)}` },
              grid: { left: 10, right: 20, top: 4, bottom: 8, containLabel: true },
              xAxis: { type: 'category', data: designers.map(d => d.name), axisLabel: { color: muted, fontSize: 10 }, axisLine: { lineStyle: { color: border } } },
              yAxis: { type: 'value', axisLabel: { color: muted, fontSize: 10, formatter: (v: number) => `$${v}` }, splitLine: { lineStyle: { color: '#1e293b' } } },
              series: [{ type: 'bar', data: designers.map(d => d.totalSpend), barWidth: 20, itemStyle: { color: blue, borderRadius: [4, 4, 0, 0] } }]
            }} style={{ height: 220 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: '12px 12px 8px' } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
              <Text strong style={{ color: text, fontSize: 13 }}>效率评分排名</Text>
              <Text style={{ color: muted, fontSize: 10, textAlign: 'right', maxWidth: '55%', lineHeight: '14px' }}>综合CTR、完播率、CPM效率计算的评分排名，越高越好</Text>
            </div>
            <ReactECharts option={{
              backgroundColor: 'transparent',
              tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (p: any) => `${p[0].name}<br/>评分: ${p[0].value}` },
              grid: { left: 10, right: 30, top: 4, bottom: 8, containLabel: true },
              xAxis: { type: 'value', max: 100, axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: '#1e293b' } } },
              yAxis: { type: 'category', data: [...designers].sort((a, b) => a.efficiencyScore - b.efficiencyScore).slice(-10).map(d => d.name), axisLabel: { color: text, fontSize: 11 }, axisLine: { lineStyle: { color: border } } },
              series: [{ type: 'bar', data: [...designers].sort((a, b) => a.efficiencyScore - b.efficiencyScore).slice(-10).map(d => ({ value: d.efficiencyScore, itemStyle: { color: d.efficiencyScore >= 60 ? green : red } })), barWidth: 20, itemStyle: { borderRadius: [0, 4, 4, 0] }, label: { show: true, position: 'right', color: text, fontSize: 10, formatter: (p: any) => p.value + '分' } }]
            }} style={{ height: 300 }} />
            <div style={{ marginTop: 4, padding: '4px 8px', background: panelBg, borderRadius: 4 }}>
              <Text style={{ color: muted, fontSize: 9, lineHeight: '14px' }}>
                效率 = CTR%×20 + 完播率%×15 + (30−CPM$)，满分100
              </Text>
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: '12px 12px 8px' } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
              <Text strong style={{ color: text, fontSize: 13 }}>素材数量分布</Text>
              <Text style={{ color: muted, fontSize: 10, textAlign: 'right', maxWidth: '55%', lineHeight: '14px' }}>各设计师素材制作数量占比</Text>
            </div>
            <ReactECharts option={{
              backgroundColor: 'transparent',
              tooltip: { trigger: 'item', formatter: (p: any) => `${p.name}<br/>素材数: ${p.value} (${p.percent}%)` },
              series: [{ type: 'pie', radius: ['35%', '65%'], center: ['50%', '55%'], data: designers.map(d => ({ name: d.name, value: d.materialCount })), label: { color: text, fontSize: 10 }, itemStyle: { borderRadius: 4, borderColor: cardBg, borderWidth: 2 }, color: [blue, green, yellow, red, purple, '#06b6d4', '#f97316'] }]
            }} style={{ height: 220 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: '12px 12px 8px' } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
              <Text strong style={{ color: text, fontSize: 13 }}>渠道花费分布</Text>
              <Text style={{ color: muted, fontSize: 10, textAlign: 'right', maxWidth: '55%', lineHeight: '14px' }}>各设计师在不同广告渠道的投放分布</Text>
            </div>
            <ReactECharts option={{
              backgroundColor: 'transparent',
              tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
              legend: { data: allMedia, textStyle: { color: muted, fontSize: 10 }, top: 0, right: 10 },
              grid: { left: 10, right: 20, top: 4, bottom: 8, containLabel: true },
              xAxis: { type: 'category', data: designers.map(d => d.name), axisLabel: { color: muted, fontSize: 10 }, axisLine: { lineStyle: { color: border } } },
              yAxis: { type: 'value', axisLabel: { color: muted, fontSize: 10, formatter: (v: number) => `$${v}` }, splitLine: { lineStyle: { color: '#1e293b' } } },
              series: allMedia.map((media, i) => ({
                name: media, type: 'bar', stack: 'total', barWidth: 24,
                data: designers.map(d => { const mb = d.mediaBreakdown.find(m => m.media === media); return mb ? mb.spend : 0; }),
                itemStyle: { borderRadius: i === allMedia.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0] },
                color: [blue, green, yellow, red, purple, '#06b6d4', '#f97316'][i % 7]
              }))
            }} style={{ height: 220 }} />
          </Card>
        </Col>
      </Row>

      {/* Designer cards */}
      <Row gutter={[12, 12]}>
        {designers.map(d => (
          <Col key={d.name} xs={12} sm={8} md={6} lg={4}>
            <DesignerCard designer={d} sections={getCardSections(d)} onClick={() => handleCardClick(d)} />
          </Col>
        ))}
      </Row>

      <DesignerDetailModal
        open={modalOpen}
        designer={activeDesigner}
        sections={activeDesigner ? getModalSections(activeDesigner) : []}
        onClose={() => { setModalOpen(false); setSelectedDesigner(null); }}
      />
        </>
      )}
    </div>
  );
}
