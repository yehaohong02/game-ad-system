import { useState, useEffect, useMemo } from 'react';
import { Row, Col, Typography, Tag, Table, Card, Statistic } from 'antd';
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

interface Suggestion {
  priority: 'high' | 'medium' | 'low';
  label: string;
  detail: string;
}

function generateSuggestions(d: DesignerStats): Suggestion[] {
  const suggestions: Suggestion[] = [];

  if (d.avgCtr < 0.005) {
    suggestions.push({ priority: 'high', label: 'CTR偏低', detail: `平均CTR仅${(d.avgCtr * 100).toFixed(2)}%，建议优化素材创意或调整受众定向` });
  } else if (d.avgCtr < 0.01) {
    suggestions.push({ priority: 'medium', label: 'CTR待提升', detail: `平均CTR ${(d.avgCtr * 100).toFixed(2)}%，有优化空间` });
  }

  if (d.avgCpm > 10) {
    suggestions.push({ priority: 'high', label: 'CPM偏高', detail: `平均CPM $${d.avgCpm.toFixed(2)}，建议调整出价策略或更换投放时段` });
  } else if (d.avgCpm > 6) {
    suggestions.push({ priority: 'medium', label: 'CPM待优化', detail: `平均CPM $${d.avgCpm.toFixed(2)}，可尝试优化竞价` });
  }

  if (d.anomalyCount > 0) {
    suggestions.push({ priority: 'high', label: '存在异常素材', detail: `检测到${d.anomalyCount}条异常数据，建议排查` });
  }

  if (d.avgPlay100Rate < 0.02) {
    suggestions.push({ priority: 'medium', label: '完播率偏低', detail: `完播率仅${(d.avgPlay100Rate * 100).toFixed(1)}%，建议优化前3秒吸引力` });
  }

  if (d.efficiencyScore >= 70) {
    suggestions.push({ priority: 'low', label: '表现优秀', detail: `效率评分${d.efficiencyScore}，建议追加预算扩大投放` });
  }

  if (d.materialCount < 5) {
    suggestions.push({ priority: 'medium', label: '素材数量不足', detail: `仅${d.materialCount}条素材，建议增加素材多样性` });
  }

  if (suggestions.length === 0) {
    suggestions.push({ priority: 'low', label: '状态良好', detail: '当前各项指标正常，继续保持' });
  }

  return suggestions;
}

const priorityColor: Record<string, string> = { high: red, medium: yellow, low: green };
const priorityLabel: Record<string, string> = { high: '高', medium: '中', low: '低' };

const chipStyle: React.CSSProperties = {
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: 4,
  padding: '4px 6px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 2,
};

const chipLabel: React.CSSProperties = { color: '#64748b', fontSize: 10, lineHeight: '12px' };

function chipValue(color: string): React.CSSProperties {
  return { color, fontSize: 11, fontWeight: 600, lineHeight: '14px' };
}

export default function ManagerExecution() {
  const { designers, refresh, setSelectedDesigner } = useManagerDataStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeDesigner, setActiveDesigner] = useState<DesignerStats | null>(null);

  useEffect(() => { refresh(); }, [refresh]);

  const summaryStats = useMemo(() => ({
    totalSpend: designers.reduce((s, d) => s + d.totalSpend, 0),
    avgCtr: designers.length > 0 ? designers.reduce((s, d) => s + d.avgCtr, 0) / designers.length : 0,
    avgCpm: designers.length > 0 ? designers.reduce((s, d) => s + d.avgCpm, 0) / designers.length : 0,
    avgEfficiency: designers.length > 0 ? designers.reduce((s, d) => s + d.efficiencyScore, 0) / designers.length : 0,
    anomalyCount: designers.reduce((s, d) => s + d.anomalyCount, 0),
    highCpmCount: designers.reduce((s, d) => s + d.highCpmCount, 0),
  }), [designers]);

  const handleCardClick = (designer: DesignerStats) => {
    setActiveDesigner(designer);
    setSelectedDesigner(designer.name);
    setModalOpen(true);
  };

  const getCardSections = (d: DesignerStats): CardSection[] => {
    const suggestions = generateSuggestions(d);
    const execStatus = d.anomalyCount > 0 ? '需关注' : '运行中';
    const highSpendLowEff = d.materials.filter(m => m.spend > 500 && m.ctr < 0.01);
    const highCpm = d.highCpmCount;

    const topHighSpend = [...highSpendLowEff]
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 3);

    const channelExec = d.mediaBreakdown.map(m => {
      const channelMats = d.materials.filter((mat: any) => mat.media === m.media);
      const anomalies = channelMats.filter(mat => mat.ctr > 10 || mat.ctr < 0.01 || mat.cpc > 50 || (mat.spend > 0 && mat.impressions < 10)).length;
      return { media: m.media, count: m.count, anomalies };
    });

    return [
      {
        title: '投放指标',
        content: (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
            <div style={chipStyle}><span style={chipLabel}>总花费</span><span style={chipValue(blue)}>${d.totalSpend.toFixed(0)}</span></div>
            <div style={chipStyle}><span style={chipLabel}>平均CTR</span><span style={chipValue(green)}>{(d.avgCtr * 100).toFixed(2)}%</span></div>
            <div style={chipStyle}><span style={chipLabel}>平均CPM</span><span style={chipValue(yellow)}>${d.avgCpm.toFixed(2)}</span></div>
            <div style={chipStyle}><span style={chipLabel}>效率评分</span><span style={chipValue(d.efficiencyScore >= 60 ? green : red)}>{d.efficiencyScore}</span></div>
            <div style={chipStyle}><span style={chipLabel}>素材数</span><span style={chipValue(text)}>{d.materialCount}</span></div>
            <div style={chipStyle}><span style={chipLabel}>完播率</span><span style={chipValue(purple)}>{(d.avgPlay100Rate * 100).toFixed(1)}%</span></div>
          </div>
        ),
      },
      {
        title: '执行状态',
        content: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: muted, fontSize: 10 }}>状态</Text>
              <Tag color={d.anomalyCount > 0 ? 'red' : 'green'} style={{ fontSize: 10, margin: 0 }}>{execStatus}</Tag>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: muted, fontSize: 10 }}>异常数</Text>
              <Text style={{ color: d.anomalyCount > 0 ? red : green, fontSize: 11, fontWeight: 600 }}>{d.anomalyCount}</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: muted, fontSize: 10 }}>高花费低效数</Text>
              <Text style={{ color: highSpendLowEff.length > 0 ? red : green, fontSize: 11, fontWeight: 600 }}>{highSpendLowEff.length}</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: muted, fontSize: 10 }}>高CPM数</Text>
              <Text style={{ color: highCpm > 0 ? yellow : green, fontSize: 11, fontWeight: 600 }}>{highCpm}</Text>
            </div>
          </div>
        ),
      },
      {
        title: '优化建议',
        content: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {suggestions.slice(0, 3).map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Tag color={priorityColor[s.priority]} style={{ fontSize: 9, margin: 0, padding: '0 4px' }}>{priorityLabel[s.priority]}</Tag>
                <Text style={{ color: text, fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</Text>
              </div>
            ))}
          </div>
        ),
      },
      {
        title: '待优化素材',
        content: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {topHighSpend.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Text style={{ color: text, fontSize: 10, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.materialId.slice(0, 10)}...</Text>
                <Text style={{ color: yellow, fontSize: 10 }}>${m.spend.toFixed(0)}</Text>
                <Text style={{ color: red, fontSize: 10 }}>{(m.ctr * 100).toFixed(2)}%</Text>
              </div>
            ))}
            {topHighSpend.length === 0 && <Text style={{ color: green, fontSize: 10 }}>无待优化素材</Text>}
          </div>
        ),
      },
      {
        title: '渠道执行',
        content: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {channelExec.map((c, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: text, fontSize: 10 }}>{c.media}</Text>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Text style={{ color: muted, fontSize: 10 }}>{c.count}素材</Text>
                  <Text style={{ color: c.anomalies > 0 ? red : green, fontSize: 10 }}>{c.anomalies}异常</Text>
                </div>
              </div>
            ))}
            {channelExec.length === 0 && <Text style={{ color: muted, fontSize: 10 }}>暂无数据</Text>}
          </div>
        ),
      },
    ];
  };

  const getModalSections = (d: DesignerStats): DetailSection[] => {
    const suggestions = generateSuggestions(d);

    // High spend low efficiency materials
    const highSpendLowEff = d.materials
      .filter(m => m.spend > 500 && m.ctr < 0.01)
      .sort((a, b) => b.spend - a.spend);

    // Per-media execution health
    const mediaHealth = d.mediaBreakdown.map(m => {
      const channelMats = d.materials.filter(mat => (mat as any).media === m.media);
      const anomalies = channelMats.filter(mat => mat.ctr > 10 || mat.ctr < 0.01 || mat.cpc > 50 || (mat.spend > 0 && mat.impressions < 10)).length;
      const status = anomalies > channelMats.length * 0.3 ? 'high' : anomalies > 0 ? 'medium' : 'low';
      return { media: m.media, count: m.count, spend: m.spend, anomalies, status };
    });

    // Materials needing action
    const needsAction = d.materials
      .filter(m => m.spend > 100 && (m.ctr < 0.005 || m.cpm > 10 || (m.playCount > 0 && m.play100 / m.playCount < 0.01)))
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 10)
      .map(m => {
        const reasons: string[] = [];
        if (m.ctr < 0.005) reasons.push('CTR过低');
        if (m.cpm > 10) reasons.push('CPM偏高');
        if (m.playCount > 0 && m.play100 / m.playCount < 0.01) reasons.push('完播率极低');
        return { ...m, reasons: reasons.join('、') };
      });

    return [
      {
        title: '优化建议',
        content: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {suggestions.map((s, i) => (
              <div key={i} style={{
                background: cardBg, border: `1px solid ${border}`, borderRadius: 8, padding: '10px 14px',
                borderLeft: `3px solid ${priorityColor[s.priority]}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Tag color={priorityColor[s.priority]} style={{ fontSize: 10, margin: 0 }}>
                    {priorityLabel[s.priority]}
                  </Tag>
                  <Text style={{ color: text, fontSize: 13, fontWeight: 500 }}>{s.label}</Text>
                </div>
                <Text style={{ color: muted, fontSize: 12 }}>{s.detail}</Text>
              </div>
            ))}
          </div>
        ),
      },
      {
        title: '高花费低效素材',
        content: highSpendLowEff.length > 0 ? (
          <Table
            dataSource={highSpendLowEff}
            rowKey="materialId"
            size="small"
            pagination={{ pageSize: 5 }}
            columns={[
              { title: '素材ID', dataIndex: 'materialId', key: 'materialId', render: (v: string) => <Text style={{ color: red, fontSize: 12 }}>{v}</Text> },
              { title: '花费', dataIndex: 'spend', key: 'spend', render: (v: number) => <Text style={{ color: yellow, fontSize: 12 }}>${v.toFixed(2)}</Text> },
              { title: '展示', dataIndex: 'impressions', key: 'impressions', render: (v: number) => <Text style={{ color: text, fontSize: 12 }}>{v.toLocaleString()}</Text> },
              { title: 'CTR', dataIndex: 'ctr', key: 'ctr', render: (v: number) => <Text style={{ color: red, fontSize: 12 }}>{(v * 100).toFixed(2)}%</Text> },
              { title: 'CPM', dataIndex: 'cpm', key: 'cpm', render: (v: number) => <Text style={{ color: text, fontSize: 12 }}>${v.toFixed(2)}</Text> },
            ]}
          />
        ) : (
          <Text style={{ color: green, fontSize: 12 }}>无高花费低效素材</Text>
        ),
      },
      {
        title: '渠道执行状态',
        content: (
          <Table
            dataSource={mediaHealth}
            rowKey="media"
            size="small"
            pagination={false}
            columns={[
              { title: '渠道', dataIndex: 'media', key: 'media', render: (v: string) => <Text style={{ color: text, fontSize: 12 }}>{v}</Text> },
              { title: '素材数', dataIndex: 'count', key: 'count', render: (v: number) => <Text style={{ color: blue, fontSize: 12 }}>{v}</Text> },
              { title: '花费', dataIndex: 'spend', key: 'spend', render: (v: number) => <Text style={{ color: yellow, fontSize: 12 }}>${v.toFixed(0)}</Text> },
              { title: '异常数', dataIndex: 'anomalies', key: 'anomalies', render: (v: number) => <Text style={{ color: v > 0 ? red : green, fontSize: 12 }}>{v}</Text> },
              {
                title: '状态', dataIndex: 'status', key: 'status',
                render: (v: string) => (
                  <Tag color={v === 'high' ? 'red' : v === 'medium' ? 'yellow' : 'green'} style={{ fontSize: 10 }}>
                    {v === 'high' ? '高风险' : v === 'medium' ? '中风险' : '健康'}
                  </Tag>
                ),
              },
            ]}
          />
        ),
      },
      {
        title: '待调整素材',
        content: needsAction.length > 0 ? (
          <Table
            dataSource={needsAction}
            rowKey="materialId"
            size="small"
            pagination={{ pageSize: 5 }}
            columns={[
              { title: '素材ID', dataIndex: 'materialId', key: 'materialId', render: (v: string) => <Text style={{ color: text, fontSize: 12 }}>{v}</Text> },
              { title: '花费', dataIndex: 'spend', key: 'spend', render: (v: number) => <Text style={{ color: yellow, fontSize: 12 }}>${v.toFixed(2)}</Text> },
              { title: 'CTR', dataIndex: 'ctr', key: 'ctr', render: (v: number) => <Text style={{ color: v < 0.005 ? red : yellow, fontSize: 12 }}>{(v * 100).toFixed(2)}%</Text> },
              { title: '问题', dataIndex: 'reasons', key: 'reasons', render: (v: string) => <Tag color="red" style={{ fontSize: 10 }}>{v}</Tag> },
            ]}
          />
        ) : (
          <Text style={{ color: green, fontSize: 12 }}>无需调整的素材</Text>
        ),
      },
    ];
  };

  return (
    <div style={{ padding: 16, background: panelBg, minHeight: '100vh' }}>
      <Title level={4} style={{ color: text, marginBottom: 12 }}>智能执行 · 管理者视角</Title>

      {designers.length === 0 && (
        <div style={{ color: muted, textAlign: 'center', padding: 60, fontSize: 14 }}>
          暂无数据，请点击"导入Excel"按钮导入素材表
        </div>
      )}

      {designers.length > 0 && (
        <>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 12 } }}>
            <Statistic title={<span style={{ color: muted }}>总花费</span>} value={summaryStats.totalSpend} prefix="$" precision={0} valueStyle={{ color: yellow, fontSize: 20 }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 12 } }}>
            <Statistic title={<span style={{ color: muted }}>平均CTR</span>} value={summaryStats.avgCtr * 100} suffix="%" precision={2} valueStyle={{ color: green, fontSize: 20 }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 12 } }}>
            <Statistic title={<span style={{ color: muted }}>平均CPM</span>} value={summaryStats.avgCpm} prefix="$" precision={2} valueStyle={{ color: yellow, fontSize: 20 }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 12 } }}>
            <Statistic title={<span style={{ color: muted }}>平均效率评分</span>} value={summaryStats.avgEfficiency} valueStyle={{ color: summaryStats.avgEfficiency >= 60 ? green : red, fontSize: 20 }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 12 } }}>
            <Statistic title={<span style={{ color: muted }}>异常数</span>} value={summaryStats.anomalyCount} valueStyle={{ color: red, fontSize: 20 }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 12 } }}>
            <Statistic title={<span style={{ color: muted }}>高CPM素材</span>} value={summaryStats.highCpmCount} valueStyle={{ color: yellow, fontSize: 20 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 16 } }}>
            <Text strong style={{ color: text, fontSize: 14, display: 'block', marginBottom: 12 }}>智能执行 · 管理者反馈</Text>
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              <Row gutter={[12, 8]}>
                {designers.map((d, idx) => {
                  const strengths: string[] = [];
                  const weaknesses: string[] = [];
                  const suggestions: string[] = [];
                  const highSpendLowEff = d.materials.filter((m:any) => m.spend > 500 && m.ctr < 0.01);
                  const inefficientCount = highSpendLowEff.length;
                  if (d.efficiencyScore >= 70) strengths.push(`执行高效(${d.efficiencyScore}分)`);
                  else if (d.efficiencyScore < 50) { weaknesses.push(`执行效率低(${d.efficiencyScore}分)`); suggestions.push('全面优化投放策略'); }
                  if (d.anomalyCount === 0) strengths.push('无异常素材');
                  else { weaknesses.push(`${d.anomalyCount}条异常素材`); suggestions.push('排查异常并及时暂停问题投放'); }
                  if (inefficientCount === 0) strengths.push('无高花费低效素材');
                  else { weaknesses.push(`${inefficientCount}条高花费低效素材`); suggestions.push(`暂停或优化${inefficientCount}条低效素材`); }
                  if (d.highCpmCount === 0) strengths.push('CPM控制良好');
                  else { weaknesses.push(`${d.highCpmCount}条高CPM素材`); suggestions.push('调整出价策略降低CPM'); }
                  if (d.avgCpm < 5) strengths.push(`CPM低($${d.avgCpm.toFixed(1)})成本优秀`);
                  else if (d.avgCpm > 10) weaknesses.push(`CPM过高($${d.avgCpm.toFixed(1)})`);
                  if (d.avgCtr > 0.015) strengths.push(`CTR优秀(${(d.avgCtr*100).toFixed(2)}%)`);
                  if (d.riskLevel==='high') { weaknesses.push('高风险需紧急干预'); suggestions.push('触发熔断暂停高风险投放'); }
                  if (strengths.length === 0) strengths.push('各项指标中等');
                  if (weaknesses.length === 0) weaknesses.push('执行状态良好');
                  if (suggestions.length === 0) suggestions.push('继续保持当前执行策略');
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

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: '12px 12px 8px' } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
              <Text strong style={{ color: text, fontSize: 13 }}>各渠道执行效率</Text>
              <Text style={{ color: muted, fontSize: 10, textAlign: 'right', maxWidth: '55%', lineHeight: '14px' }}>各设计师在主要渠道的素材制作效率对比，反映渠道执行力</Text>
            </div>
            <ReactECharts option={{
              backgroundColor: 'transparent',
              tooltip: { trigger: 'axis' },
              legend: { data: [...new Set(designers.flatMap(d => d.mediaBreakdown.slice(0,2).map(m => m.media)))].slice(0,3), textStyle: { color: muted, fontSize: 10 }, top: 0, right: 10 },
              grid: { left: 10, right: 20, top: 28, bottom: 8, containLabel: true },
              xAxis: { type: 'category', data: designers.map(d => d.name), axisLabel: { color: muted, fontSize: 10 }, axisLine: { lineStyle: { color: border } } },
              yAxis: { type: 'value', axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: '#1e293b' } } },
              series: [...new Set(designers.flatMap(d => d.mediaBreakdown.slice(0,2).map(m => m.media)))].slice(0,3).map((media, i) => ({
                name: media, type: 'bar',
                data: designers.map(d => { const mb = d.mediaBreakdown.find(m => m.media === media); return mb ? mb.count : 0; }),
                itemStyle: { color: [blue, green, yellow][i] }
              }))
            }} style={{ height: 220 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: '12px 12px 8px' } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
              <Text strong style={{ color: text, fontSize: 13 }}>设计师风险分布</Text>
              <Text style={{ color: muted, fontSize: 10, textAlign: 'right', maxWidth: '55%', lineHeight: '14px' }}>低/中/高风险设计师数量分布，反映团队健康度</Text>
            </div>
            <ReactECharts option={{
              backgroundColor: 'transparent',
              tooltip: { trigger: 'item' },
              series: [{
                type: 'pie', radius: ['35%', '65%'], center: ['50%', '55%'],
                data: [
                  { name: '低风险', value: designers.filter(d => d.riskLevel === 'low').length, itemStyle: { color: green } },
                  { name: '中风险', value: designers.filter(d => d.riskLevel === 'medium').length, itemStyle: { color: yellow } },
                  { name: '高风险', value: designers.filter(d => d.riskLevel === 'high').length, itemStyle: { color: red } },
                ],
                label: { color: text, fontSize: 10, formatter: '{b}: {c}人' },
                itemStyle: { borderRadius: 4, borderColor: cardBg, borderWidth: 2 }
              }]
            }} style={{ height: 220 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: '12px 12px 8px' } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
              <Text strong style={{ color: text, fontSize: 13 }}>异常数对比</Text>
              <Text style={{ color: muted, fontSize: 10, textAlign: 'right', maxWidth: '55%', lineHeight: '14px' }}>各设计师异常素材数量，异常多表示投放配置可能有问题</Text>
            </div>
            <ReactECharts option={{
              backgroundColor: 'transparent',
              tooltip: { trigger: 'axis' },
              grid: { left: 10, right: 20, top: 4, bottom: 8, containLabel: true },
              xAxis: { type: 'category', data: designers.map(d => d.name), axisLabel: { color: muted, fontSize: 10 }, axisLine: { lineStyle: { color: border } } },
              yAxis: { type: 'value', axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: '#1e293b' } } },
              series: [{ type: 'bar', data: designers.map(d => d.anomalyCount), barWidth: 20, itemStyle: { color: red, borderRadius: [4, 4, 0, 0] } }]
            }} style={{ height: 220 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: '12px 12px 8px' } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
              <Text strong style={{ color: text, fontSize: 13 }}>花费 vs 效率</Text>
              <Text style={{ color: muted, fontSize: 10, textAlign: 'right', maxWidth: '55%', lineHeight: '14px' }}>花费与效率的散点图，理想位置是右下（低花费高效率）</Text>
            </div>
            <ReactECharts option={{
              backgroundColor: 'transparent',
              tooltip: { formatter: (p: any) => `${p.data[2]}<br/>花费: $${p.data[0].toFixed(0)}<br/>效率: ${p.data[1]}` },
              grid: { left: 50, right: 20, top: 4, bottom: 24 },
              xAxis: { type: 'value', name: '花费', nameTextStyle: { color: muted, fontSize: 10 }, axisLabel: { color: muted, fontSize: 10, formatter: (v: number) => `$${v}` }, splitLine: { lineStyle: { color: '#1e293b' } } },
              yAxis: { type: 'value', name: '效率', min: 0, max: 100, nameTextStyle: { color: muted, fontSize: 10 }, axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: '#1e293b' } } },
              series: [{
                type: 'scatter', symbolSize: 18,
                data: designers.map(d => [d.totalSpend, d.efficiencyScore, d.name]),
                itemStyle: { color: blue, borderColor: green, borderWidth: 1 },
                label: { show: true, formatter: (p: any) => p.data[2], position: 'top', color: text, fontSize: 9 }
              }]
            }} style={{ height: 220 }} />
          </Card>
        </Col>
      </Row>

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
