import { useState, useEffect, useMemo } from 'react';
import { Row, Col, Typography, Table, Tag, Card, Statistic } from 'antd';
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
const yellow = '#f59e0b';
const red = '#ef4444';
const purple = '#8b5cf6';

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

export default function ManagerCreativeInsight() {
  const { designers, refresh, setSelectedDesigner } = useManagerDataStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeDesigner, setActiveDesigner] = useState<DesignerStats | null>(null);

  useEffect(() => { refresh(); }, [refresh]);

  const summaryStats = useMemo(() => ({
    avgPlay100Rate: designers.length > 0 ? designers.reduce((s, d) => s + d.avgPlay100Rate, 0) / designers.length : 0,
    avgPlay2sRate: designers.length > 0 ? designers.reduce((s, d) => s + d.avgPlay2sRate, 0) / designers.length : 0,
    avgPlay6sRate: designers.length > 0 ? designers.reduce((s, d) => s + d.avgPlay6sRate, 0) / designers.length : 0,
    totalPlayCount: designers.reduce((s, d) => s + d.totalPlayCount, 0),
    highCtrCount: designers.reduce((s, d) => s + d.highCtrCount, 0),
    avgCtr: designers.length > 0 ? designers.reduce((s, d) => s + d.avgCtr, 0) / designers.length : 0,
  }), [designers]);

  const teamFunnel = useMemo(() => {
    if (designers.length === 0) return { play2s: 0, play6s: 0, play100: 0 };
    const avg2s = designers.reduce((s, d) => s + d.avgPlay2sRate, 0) / designers.length * 100;
    const avg6s = designers.reduce((s, d) => s + d.avgPlay6sRate, 0) / designers.length * 100;
    const avg100 = designers.reduce((s, d) => s + d.avgPlay100Rate, 0) / designers.length * 100;
    return { play2s: avg2s, play6s: avg6s, play100: avg100 };
  }, [designers]);

  const handleCardClick = (designer: DesignerStats) => {
    setActiveDesigner(designer);
    setSelectedDesigner(designer.name);
    setModalOpen(true);
  };

  const getCardSections = (d: DesignerStats): CardSection[] => {
    // Pre-compute derived data
    const playingMaterials = d.materials.filter(m => m.playCount > 0);
    const highCtrMaterials = d.materials.filter(m => m.ctr > 0.01);

    const topCompletion = [...playingMaterials]
      .sort((a, b) => (b.play100 / b.playCount) - (a.play100 / a.playCount))
      .slice(0, 3);

    const topCtr = [...d.materials]
      .sort((a, b) => b.ctr - a.ctr)
      .slice(0, 3);

    const channelCompletion = d.mediaBreakdown.map(m => {
      const channelMats = d.materials.filter((mat: any) => mat.media === m.media);
      const avgRate = channelMats.length > 0
        ? channelMats.reduce((s, mat) => s + (mat.playCount > 0 ? mat.play100 / mat.playCount : 0), 0) / channelMats.length
        : 0;
      return { media: m.media, completionRate: avgRate };
    }).sort((a, b) => b.completionRate - a.completionRate);

    return [
      {
        title: '播放指标',
        content: (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
            <div style={chipStyle}><span style={chipLabel}>完播率</span><span style={chipValue(purple)}>{(d.avgPlay100Rate * 100).toFixed(1)}%</span></div>
            <div style={chipStyle}><span style={chipLabel}>2s播放率</span><span style={chipValue(blue)}>{(d.avgPlay2sRate * 100).toFixed(1)}%</span></div>
            <div style={chipStyle}><span style={chipLabel}>6s播放率</span><span style={chipValue(yellow)}>{(d.avgPlay6sRate * 100).toFixed(1)}%</span></div>
            <div style={chipStyle}><span style={chipLabel}>25%率</span><span style={chipValue(muted)}>{d.materials.length > 0 ? (d.materials.reduce((s, m) => s + (m.playCount > 0 ? (m as any).play25 / m.playCount : 0), 0) / d.materials.length * 100).toFixed(1) : '0.0'}%</span></div>
            <div style={chipStyle}><span style={chipLabel}>50%率</span><span style={chipValue(muted)}>{d.materials.length > 0 ? (d.materials.reduce((s, m) => s + (m.playCount > 0 ? (m as any).play50 / m.playCount : 0), 0) / d.materials.length * 100).toFixed(1) : '0.0'}%</span></div>
            <div style={chipStyle}><span style={chipLabel}>75%率</span><span style={chipValue(muted)}>{d.materials.length > 0 ? (d.materials.reduce((s, m) => s + (m.playCount > 0 ? (m as any).play75 / m.playCount : 0), 0) / d.materials.length * 100).toFixed(1) : '0.0'}%</span></div>
          </div>
        ),
      },
      {
        title: '创意效果',
        content: (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
            <div style={chipStyle}><span style={chipLabel}>平均CTR</span><span style={chipValue(green)}>{(d.avgCtr * 100).toFixed(2)}%</span></div>
            <div style={chipStyle}><span style={chipLabel}>平均CPM</span><span style={chipValue(yellow)}>${d.avgCpm.toFixed(2)}</span></div>
            <div style={chipStyle}><span style={chipLabel}>平均CPC</span><span style={chipValue(blue)}>${d.avgCpc.toFixed(2)}</span></div>
            <div style={chipStyle}><span style={chipLabel}>总播放</span><span style={chipValue(text)}>{d.materials.reduce((s, m) => s + m.playCount, 0).toLocaleString()}</span></div>
            <div style={chipStyle}><span style={chipLabel}>播放素材数</span><span style={chipValue(green)}>{playingMaterials.length}</span></div>
            <div style={chipStyle}><span style={chipLabel}>高CTR素材数</span><span style={chipValue(highCtrMaterials.length > 0 ? green : muted)}>{highCtrMaterials.length}</span></div>
          </div>
        ),
      },
      {
        title: 'TOP3完播素材',
        content: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {topCompletion.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                <Text style={{ color: text, fontSize: 10, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.materialId.slice(0, 10)}...</Text>
                <Text style={{ color: muted, fontSize: 10 }}>{m.playCount.toLocaleString()}</Text>
                <Tag color="green" style={{ fontSize: 10, margin: 0 }}>{(m.play100 / m.playCount * 100).toFixed(1)}%</Tag>
              </div>
            ))}
            {topCompletion.length === 0 && <Text style={{ color: muted, fontSize: 10 }}>暂无数据</Text>}
          </div>
        ),
      },
      {
        title: 'TOP3 CTR素材',
        content: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {topCtr.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                <Text style={{ color: text, fontSize: 10, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.materialId.slice(0, 10)}...</Text>
                <Tag color="green" style={{ fontSize: 10, margin: 0 }}>{(m.ctr * 100).toFixed(2)}%</Tag>
                <Text style={{ color: muted, fontSize: 10 }}>{m.impressions.toLocaleString()}</Text>
              </div>
            ))}
            {topCtr.length === 0 && <Text style={{ color: muted, fontSize: 10 }}>暂无数据</Text>}
          </div>
        ),
      },
      {
        title: '渠道完播对比',
        content: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {channelCompletion.map((c, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10 }}>
                <Text style={{ color: text, fontSize: 10 }}>{c.media}</Text>
                <Text style={{ color: green, fontSize: 10 }}>{(c.completionRate * 100).toFixed(1)}%</Text>
              </div>
            ))}
            {channelCompletion.length === 0 && <Text style={{ color: muted, fontSize: 10 }}>暂无数据</Text>}
          </div>
        ),
      },
    ];
  };

  const getModalSections = (d: DesignerStats): DetailSection[] => {
    const lineChartOption = {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' as const },
      legend: { data: ['2s播放率', '6s播放率', '100%完播率'], textStyle: { color: muted, fontSize: 10 }, top: 0 },
      grid: { left: 50, right: 20, top: 30, bottom: 24 },
      xAxis: {
        type: 'category' as const,
        data: d.materials.slice(0, 15).map(m => m.materialId),
        axisLabel: { color: muted, fontSize: 9, rotate: 30 },
        axisLine: { lineStyle: { color: border } },
      },
      yAxis: {
        type: 'value' as const,
        axisLabel: { color: muted, fontSize: 10, formatter: (v: number) => `${(v * 100).toFixed(0)}%` },
        splitLine: { lineStyle: { color: '#1e293b' } },
      },
      series: [
        {
          name: '2s播放率', type: 'line', smooth: true,
          data: d.materials.slice(0, 15).map(m => m.playCount > 0 ? m.play2s / m.playCount : 0),
          itemStyle: { color: blue }, lineStyle: { width: 2 },
        },
        {
          name: '6s播放率', type: 'line', smooth: true,
          data: d.materials.slice(0, 15).map(m => m.playCount > 0 ? m.play6s / m.playCount : 0),
          itemStyle: { color: yellow }, lineStyle: { width: 2 },
        },
        {
          name: '100%完播率', type: 'line', smooth: true,
          data: d.materials.slice(0, 15).map(m => m.playCount > 0 ? m.play100 / m.playCount : 0),
          itemStyle: { color: green }, lineStyle: { width: 2 },
        },
      ],
    };

    // Per-channel completion comparison
    const channelCompletion = d.mediaBreakdown.map(m => {
      const channelMats = d.materials.filter(mat => (mat as any).media === m.media);
      const avgRate = channelMats.length > 0
        ? channelMats.reduce((s, mat) => s + (mat.playCount > 0 ? mat.play100 / mat.playCount : 0), 0) / channelMats.length
        : 0;
      return { media: m.media, count: m.count, completionRate: avgRate };
    }).sort((a, b) => b.completionRate - a.completionRate);

    // Per-game completion comparison
    const gameCompletion = d.gameBreakdown.map(g => {
      const gameMats = d.materials.filter(mat => ((mat as any).game || (mat as any).category) === g.game);
      const avgRate = gameMats.length > 0
        ? gameMats.reduce((s, mat) => s + (mat.playCount > 0 ? mat.play100 / mat.playCount : 0), 0) / gameMats.length
        : 0;
      return { game: g.game, count: g.count, completionRate: avgRate };
    }).sort((a, b) => b.completionRate - a.completionRate);

    // Top 5 by completion rate
    const topByCompletion = [...d.materials]
      .filter(m => m.playCount > 0)
      .sort((a, b) => (b.play100 / b.playCount) - (a.play100 / a.playCount))
      .slice(0, 5);

    return [
      {
        title: '完播率曲线',
        content: <ReactECharts option={lineChartOption} style={{ height: 280 }} />,
      },
      {
        title: '各渠道完播对比',
        content: (
          <Table
            dataSource={channelCompletion}
            rowKey="media"
            size="small"
            pagination={false}
            columns={[
              { title: '渠道', dataIndex: 'media', key: 'media', render: (v: string) => <Text style={{ color: text, fontSize: 12 }}>{v}</Text> },
              { title: '素材数', dataIndex: 'count', key: 'count', render: (v: number) => <Text style={{ color: blue, fontSize: 12 }}>{v}</Text> },
              { title: '平均完播率', dataIndex: 'completionRate', key: 'completionRate', render: (v: number) => <Text style={{ color: green, fontSize: 12 }}>{(v * 100).toFixed(1)}%</Text> },
            ]}
          />
        ),
      },
      {
        title: '各游戏完播对比',
        content: (
          <Table
            dataSource={gameCompletion}
            rowKey="game"
            size="small"
            pagination={false}
            columns={[
              { title: '游戏', dataIndex: 'game', key: 'game', render: (v: string) => <Text style={{ color: text, fontSize: 12 }}>{v}</Text> },
              { title: '素材数', dataIndex: 'count', key: 'count', render: (v: number) => <Text style={{ color: blue, fontSize: 12 }}>{v}</Text> },
              { title: '平均完播率', dataIndex: 'completionRate', key: 'completionRate', render: (v: number) => <Text style={{ color: green, fontSize: 12 }}>{(v * 100).toFixed(1)}%</Text> },
            ]}
          />
        ),
      },
      {
        title: '素材完播数据',
        content: (
          <Table
            dataSource={d.materials}
            rowKey="materialId"
            size="small"
            pagination={{ pageSize: 8 }}
            columns={[
              { title: '素材ID', dataIndex: 'materialId', key: 'materialId', render: (v: string) => <Text style={{ color: text, fontSize: 12 }}>{v}</Text> },
              { title: '游戏', key: 'game', render: (_: any, r: any) => <Text style={{ color: muted, fontSize: 12 }}>{r.game || r.category || '-'}</Text> },
              { title: '渠道', key: 'media', render: (_: any, r: any) => <Text style={{ color: muted, fontSize: 12 }}>{r.media || '-'}</Text> },
              { title: '播放次数', dataIndex: 'playCount', key: 'playCount', render: (v: number) => <Text style={{ color: text, fontSize: 12 }}>{v.toLocaleString()}</Text> },
              {
                title: '2s播放率', key: 'play2sRate',
                render: (_: any, r: any) => <Text style={{ color: blue, fontSize: 12 }}>{r.playCount > 0 ? (r.play2s / r.playCount * 100).toFixed(1) : 0}%</Text>,
              },
              {
                title: '100%完播率', key: 'play100Rate',
                render: (_: any, r: any) => <Text style={{ color: green, fontSize: 12 }}>{r.playCount > 0 ? (r.play100 / r.playCount * 100).toFixed(1) : 0}%</Text>,
              },
              { title: 'CTR', dataIndex: 'ctr', key: 'ctr', render: (v: number) => <Text style={{ color: yellow, fontSize: 12 }}>{(v * 100).toFixed(2)}%</Text> },
            ]}
          />
        ),
      },
      {
        title: '高效创意 TOP5 (完播率)',
        content: (
          <Table
            dataSource={topByCompletion}
            rowKey="materialId"
            size="small"
            pagination={false}
            columns={[
              { title: '素材ID', dataIndex: 'materialId', key: 'materialId', render: (v: string) => <Text style={{ color: text, fontSize: 12 }}>{v}</Text> },
              { title: '播放次数', dataIndex: 'playCount', key: 'playCount', render: (v: number) => <Text style={{ color: text, fontSize: 12 }}>{(v || 0).toLocaleString()}</Text> },
              {
                title: '完播率', key: 'completionRate',
                render: (_: any, r: any) => <Tag color="green" style={{ fontSize: 11 }}>{(r.play100 / r.playCount * 100).toFixed(1)}%</Tag>,
              },
              { title: 'CTR', dataIndex: 'ctr', key: 'ctr', render: (v: number) => <Text style={{ color: yellow, fontSize: 12 }}>{(v * 100).toFixed(2)}%</Text> },
            ]}
          />
        ),
      },
    ];
  };

  return (
    <div style={{ padding: 16, background: panelBg, minHeight: '100vh' }}>
      <Title level={4} style={{ color: text, marginBottom: 12 }}>创意洞察 · 管理者视角</Title>

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
            <Statistic title={<span style={{ color: muted }}>平均完播率</span>} value={summaryStats.avgPlay100Rate * 100} suffix="%" precision={1} valueStyle={{ color: '#8b5cf6', fontSize: 20 }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 12 } }}>
            <Statistic title={<span style={{ color: muted }}>平均2s率</span>} value={summaryStats.avgPlay2sRate * 100} suffix="%" precision={1} valueStyle={{ color: blue, fontSize: 20 }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 12 } }}>
            <Statistic title={<span style={{ color: muted }}>平均6s率</span>} value={summaryStats.avgPlay6sRate * 100} suffix="%" precision={1} valueStyle={{ color: yellow, fontSize: 20 }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 12 } }}>
            <Statistic title={<span style={{ color: muted }}>总播放</span>} value={summaryStats.totalPlayCount} valueStyle={{ color: text, fontSize: 20 }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 12 } }}>
            <Statistic title={<span style={{ color: muted }}>高CTR素材</span>} value={summaryStats.highCtrCount} valueStyle={{ color: green, fontSize: 20 }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 12 } }}>
            <Statistic title={<span style={{ color: muted }}>平均CTR</span>} value={summaryStats.avgCtr * 100} suffix="%" precision={2} valueStyle={{ color: green, fontSize: 20 }} />
          </Card>
        </Col>
      </Row>

      {/* Per-designer analysis panel */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 16 } }}>
            <Text strong style={{ color: text, fontSize: 14, display: 'block', marginBottom: 12 }}>创意洞察 · 管理者反馈</Text>
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              <Row gutter={[12, 8]}>
                {designers.map((d, idx) => {
                  const strengths: string[] = [];
                  const weaknesses: string[] = [];
                  const suggestions: string[] = [];
                  if (d.avgPlay100Rate > 0.05) strengths.push(`完播率优秀(${(d.avgPlay100Rate*100).toFixed(1)}%)`);
                  else if (d.avgPlay100Rate < 0.02) { weaknesses.push(`完播率偏低(${(d.avgPlay100Rate*100).toFixed(1)}%)`); suggestions.push('优化视频前3秒吸引力'); }
                  if (d.avgPlay2sRate > 0.15) strengths.push(`2s播放率高(${(d.avgPlay2sRate*100).toFixed(1)}%)，开头吸引人`);
                  else if (d.avgPlay2sRate < 0.05) { weaknesses.push(`2s播放率低(${(d.avgPlay2sRate*100).toFixed(1)}%)`); suggestions.push('强化视频开头画面'); }
                  if (d.avgPlay6sRate > 0.1) strengths.push(`6s播放率高(${(d.avgPlay6sRate*100).toFixed(1)}%)，持续吸引`);
                  if (d.totalPlayCount > 100000) strengths.push(`播放量大(${(d.totalPlayCount/10000).toFixed(0)}万)`);
                  else if (d.totalPlayCount < 1000) weaknesses.push('播放量偏低，素材曝光不足');
                  if (d.avgCtr > 0.012) strengths.push(`CTR优秀(${(d.avgCtr*100).toFixed(2)}%)`);
                  else if (d.avgCtr < 0.008) { weaknesses.push(`CTR偏低(${(d.avgCtr*100).toFixed(2)}%)`); suggestions.push('优化素材缩略图和标题'); }
                  if (d.highCtrCount > 3) strengths.push(`高CTR素材${d.highCtrCount}条，创意潜力大`);
                  if (d.avgPlay100Rate < 0.01 && d.totalPlayCount > 1000) suggestions.push('完播率极低，建议重新设计视频脚本');
                  if (suggestions.length===0) suggestions.push('创意表现良好，继续产出优质内容');
                  if (strengths.length===0) strengths.push('各项创意指标中等');
                  if (weaknesses.length===0) weaknesses.push('创意效果无明显短板');
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

      <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: '12px 12px 8px' } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
              <Text strong style={{ color: text, fontSize: 13 }}>设计师完播率对比</Text>
              <Text style={{ color: muted, fontSize: 10, textAlign: 'right', maxWidth: '55%', lineHeight: '14px' }}>各设计师视频素材100%完播率对比，反映内容吸引力</Text>
            </div>
            <ReactECharts option={{
              backgroundColor: 'transparent',
              tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0].name}<br/>完播率: ${p[0].value.toFixed(1)}%` },
              grid: { left: 10, right: 20, top: 4, bottom: 8, containLabel: true },
              xAxis: { type: 'category', data: designers.map(d => d.name), axisLabel: { color: muted, fontSize: 10 }, axisLine: { lineStyle: { color: border } } },
              yAxis: { type: 'value', axisLabel: { color: muted, fontSize: 10, formatter: (v: number) => `${v}%` }, splitLine: { lineStyle: { color: '#1e293b' } } },
              series: [{ type: 'bar', data: designers.map(d => d.avgPlay100Rate * 100), barWidth: 20, itemStyle: { color: purple, borderRadius: [4, 4, 0, 0] } }]
            }} style={{ height: 220 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: '12px 12px 8px' } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
              <Text strong style={{ color: text, fontSize: 13 }}>团队播放漏斗</Text>
              <Text style={{ color: muted, fontSize: 10, textAlign: 'right', maxWidth: '55%', lineHeight: '14px' }}>团队整体2s→6s→100%完播转化漏斗，反映素材留存能力</Text>
            </div>
            <ReactECharts option={{
              backgroundColor: 'transparent',
              tooltip: { trigger: 'item', formatter: (p: any) => `${p.name}<br/>${p.value.toFixed(1)}%` },
              series: [{
                type: 'funnel', left: '15%', width: '70%', top: 30, bottom: 8,
                min: 0, max: Math.max(teamFunnel.play2s, 10),
                sort: 'descending', gap: 4,
                label: { show: true, position: 'inside', color: '#fff', fontSize: 11, formatter: (p: any) => `${p.name} ${p.value.toFixed(1)}%` },
                itemStyle: { borderColor: cardBg, borderWidth: 2 },
                data: [
                  { value: teamFunnel.play2s, name: '2s播放', itemStyle: { color: blue } },
                  { value: teamFunnel.play6s, name: '6s播放', itemStyle: { color: yellow } },
                  { value: teamFunnel.play100, name: '完播', itemStyle: { color: green } },
                ]
              }]
            }} style={{ height: 220 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: '12px 12px 8px' } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
              <Text strong style={{ color: text, fontSize: 13 }}>播放量对比</Text>
              <Text style={{ color: muted, fontSize: 10, textAlign: 'right', maxWidth: '55%', lineHeight: '14px' }}>各设计师素材总播放次数对比，反映视频素材曝光规模</Text>
            </div>
            <ReactECharts option={{
              backgroundColor: 'transparent',
              tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0].name}<br/>播放: ${p[0].value.toLocaleString()}` },
              grid: { left: 10, right: 20, top: 4, bottom: 8, containLabel: true },
              xAxis: { type: 'category', data: designers.map(d => d.name), axisLabel: { color: muted, fontSize: 10 }, axisLine: { lineStyle: { color: border } } },
              yAxis: { type: 'value', axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: '#1e293b' } } },
              series: [{ type: 'bar', data: designers.map(d => d.totalPlayCount), barWidth: 20, itemStyle: { color: blue, borderRadius: [4, 4, 0, 0] } }]
            }} style={{ height: 220 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: '12px 12px 8px' } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
              <Text strong style={{ color: text, fontSize: 13 }}>播放率综合对比</Text>
              <Text style={{ color: muted, fontSize: 10, textAlign: 'right', maxWidth: '55%', lineHeight: '14px' }}>各设计师2s/6s/100%完播率的综合对比，全面评估视频表现</Text>
            </div>
            <ReactECharts option={{
              backgroundColor: 'transparent',
              tooltip: { trigger: 'axis' },
              legend: { data: ['2s率', '6s率', '完播率'], textStyle: { color: muted, fontSize: 10 }, top: 0, right: 10 },
              grid: { left: 10, right: 20, top: 4, bottom: 8, containLabel: true },
              xAxis: { type: 'category', data: designers.map(d => d.name), axisLabel: { color: muted, fontSize: 10 }, axisLine: { lineStyle: { color: border } } },
              yAxis: { type: 'value', axisLabel: { color: muted, fontSize: 10, formatter: (v: number) => `${v}%` }, splitLine: { lineStyle: { color: '#1e293b' } } },
              series: [
                { name: '2s率', type: 'bar', data: designers.map(d => +(d.avgPlay2sRate * 100).toFixed(1)), itemStyle: { color: blue } },
                { name: '6s率', type: 'bar', data: designers.map(d => +(d.avgPlay6sRate * 100).toFixed(1)), itemStyle: { color: yellow } },
                { name: '完播率', type: 'bar', data: designers.map(d => +(d.avgPlay100Rate * 100).toFixed(1)), barWidth: 16, itemStyle: { color: green } },
              ]
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
