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


export default function ManagerReports() {
  const { designers, refresh, setSelectedDesigner } = useManagerDataStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeDesigner, setActiveDesigner] = useState<DesignerStats | null>(null);

  useEffect(() => { refresh(); }, [refresh]);

  const summaryStats = useMemo(() => ({
    designerCount: designers.length,
    avgEfficiency: designers.length > 0 ? designers.reduce((s, d) => s + d.efficiencyScore, 0) / designers.length : 0,
    avgCtr: designers.length > 0 ? designers.reduce((s, d) => s + d.avgCtr, 0) / designers.length : 0,
    avgPlay100Rate: designers.length > 0 ? designers.reduce((s, d) => s + d.avgPlay100Rate, 0) / designers.length : 0,
    avgCpm: designers.length > 0 ? designers.reduce((s, d) => s + d.avgCpm, 0) / designers.length : 0,
    totalSpend: designers.reduce((s, d) => s + d.totalSpend, 0),
  }), [designers]);

  // Sort designers by efficiencyScore descending for ranking
  const rankedDesigners = useMemo(() =>
    [...designers].sort((a, b) => b.efficiencyScore - a.efficiencyScore),
    [designers]
  );

  const handleCardClick = (designer: DesignerStats) => {
    setActiveDesigner(designer);
    setSelectedDesigner(designer.name);
    setModalOpen(true);
  };

  const getRankColor = (rank: number): string => {
    if (rank === 1) return yellow;
    if (rank === 2) return '#c0c0c0';
    if (rank === 3) return '#cd7f32';
    return muted;
  };

  const chipStyle = (color: string): React.CSSProperties => ({
    display: 'inline-block', padding: '2px 6px', borderRadius: 4,
    fontSize: 10, color, fontWeight: 500,
  });

  const getImprovementSuggestions = (d: DesignerStats, rank: number): string[] => {
    const suggestions: string[] = [];

    if (d.avgCtr < 0.01) suggestions.push('CTR偏低，建议优化素材创意和受众定向');
    if (d.avgCpm > 8) suggestions.push('CPM偏高，建议调整出价策略');
    if (d.avgPlay100Rate < 0.03) suggestions.push('完播率低，建议优化视频前3秒吸引力');
    if (d.anomalyCount > 0) suggestions.push(`存在${d.anomalyCount}条异常数据，需排查`);
    if (d.materialCount < 5) suggestions.push('素材数量不足，建议增加创意多样性');

    if (rank <= 3) suggestions.push('表现优异，建议作为标杆推广经验');
    if (suggestions.length === 0) suggestions.push('各项指标正常，继续保持');

    return suggestions;
  };

  const getCardSections = (d: DesignerStats, rank: number): CardSection[] => {
    const suggestions = getImprovementSuggestions(d, rank).slice(0, 3);
    const top3BySpend = [...d.materials].sort((a, b) => b.spend - a.spend).slice(0, 3);

    const teamAvgCtr = designers.length > 0 ? designers.reduce((s, x) => s + x.avgCtr, 0) / designers.length : 0;
    const teamAvgCpm = designers.length > 0 ? designers.reduce((s, x) => s + x.avgCpm, 0) / designers.length : 0;
    const teamAvgEfficiency = designers.length > 0 ? designers.reduce((s, x) => s + x.efficiencyScore, 0) / designers.length : 0;

    return [
      {
        title: '综合指标',
        content: (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            <span style={chipStyle(getRankColor(rank))}>#{rank}</span>
            <span style={chipStyle(d.efficiencyScore >= 60 ? green : red)}>效率 {d.efficiencyScore}</span>
            <span style={chipStyle(yellow)}>花费 ${d.totalSpend.toFixed(0)}</span>
            <span style={chipStyle(green)}>CTR {(d.avgCtr * 100).toFixed(2)}%</span>
            <span style={chipStyle('#8b5cf6')}>完播 {(d.avgPlay100Rate * 100).toFixed(1)}%</span>
            <span style={chipStyle(blue)}>素材 {d.materialCount}</span>
          </div>
        ),
      },
      {
        title: '改进建议',
        content: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {suggestions.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                <Tag color={i === 0 && rank <= 3 ? 'green' : 'blue'} style={{ fontSize: 9, margin: 0, padding: '0 3px', lineHeight: '16px' }}>{i + 1}</Tag>
                <span style={{ color: text, fontSize: 10 }}>{s}</span>
              </div>
            ))}
          </div>
        ),
      },
      {
        title: 'TOP3高效素材',
        content: top3BySpend.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {top3BySpend.map(m => (
              <div key={m.materialId} style={{
                display: 'flex', alignItems: 'center', gap: 4, fontSize: 10,
                background: panelBg, borderRadius: 4, padding: '3px 5px',
              }}>
                <Text style={{ color: text, fontSize: 10, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.materialId}</Text>
                <span style={{ color: green }}>{(m.ctr * 100).toFixed(2)}%</span>
                <span style={{ color: muted }}>{(m.impressions || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <span style={{ color: muted, fontSize: 10 }}>暂无数据</span>
        ),
      },
      {
        title: '渠道表现',
        content: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {d.mediaBreakdown.map(m => (
              <div key={m.media} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                <span style={{ color: text, flex: 1 }}>{m.media}</span>
                <span style={{ color: green }}>{(m.avgCtr * 100).toFixed(2)}%</span>
                <span style={{ color: yellow }}>${m.spend.toFixed(0)}</span>
              </div>
            ))}
          </div>
        ),
      },
      {
        title: '与团队对比',
        content: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: muted }}>CTR</span>
              <span style={{ color: d.avgCtr > teamAvgCtr ? green : red }}>{(d.avgCtr * 100).toFixed(2)}% <span style={{ color: muted }}>({(teamAvgCtr * 100).toFixed(2)}%)</span></span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: muted }}>CPM</span>
              <span style={{ color: d.avgCpm < teamAvgCpm ? green : red }}>${d.avgCpm.toFixed(2)} <span style={{ color: muted }}>(${teamAvgCpm.toFixed(2)})</span></span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: muted }}>效率</span>
              <span style={{ color: d.efficiencyScore > teamAvgEfficiency ? green : red }}>{d.efficiencyScore} <span style={{ color: muted }}>({Math.round(teamAvgEfficiency)})</span></span>
            </div>
          </div>
        ),
      },
    ];
  };

  const getModalSections = (d: DesignerStats): DetailSection[] => {
    const rank = rankedDesigners.findIndex(x => x.name === d.name) + 1;
    const suggestions = getImprovementSuggestions(d, rank);

    // Per-media performance ranking
    const mediaPerf = d.mediaBreakdown.map(m => ({
      media: m.media,
      count: m.count,
      spend: m.spend,
      avgCtr: m.avgCtr,
      avgCpm: m.avgCpm,
    }));

    // Per-game performance
    const gamePerf = d.gameBreakdown.map(g => ({
      game: g.game,
      count: g.count,
      spend: g.spend,
      avgCtr: g.avgCtr,
      avgCpm: g.avgCpm,
    }));

    // Team averages
    const teamAvgCtr = designers.length > 0 ? designers.reduce((s, x) => s + x.avgCtr, 0) / designers.length : 0;
    const teamAvgCpm = designers.length > 0 ? designers.reduce((s, x) => s + x.avgCpm, 0) / designers.length : 0;
    const teamAvgEfficiency = designers.length > 0 ? designers.reduce((s, x) => s + x.efficiencyScore, 0) / designers.length : 0;
    const teamAvgCompletion = designers.length > 0 ? designers.reduce((s, x) => s + x.avgPlay100Rate, 0) / designers.length : 0;

    // Specific material-level suggestions
    const materialSuggestions: { materialId: string; issue: string; recommendation: string }[] = [];
    const lowCtrMats = d.materials.filter(m => m.spend > 200 && m.ctr < 0.005).slice(0, 3);
    for (const m of lowCtrMats) {
      materialSuggestions.push({
        materialId: m.materialId,
        issue: `CTR ${(m.ctr * 100).toFixed(2)}%，花费 $${m.spend.toFixed(0)}`,
        recommendation: '优化素材创意或暂停投放',
      });
    }
    const highCpmMats = d.materials.filter(m => m.cpm > 10).slice(0, 3);
    for (const m of highCpmMats) {
      materialSuggestions.push({
        materialId: m.materialId,
        issue: `CPM $${m.cpm.toFixed(2)}`,
        recommendation: '调整出价策略或定向',
      });
    }

    return [
      {
        title: '综合表现',
        content: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Rank & Score */}
            <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 8, padding: 16 }}>
              <Row gutter={[16, 12]}>
                <Col span={4}>
                  <Text style={{ color: muted, fontSize: 11, display: 'block' }}>排名</Text>
                  <Text style={{ color: getRankColor(rank), fontSize: 28, fontWeight: 700 }}>#{rank}</Text>
                </Col>
                <Col span={4}>
                  <Text style={{ color: muted, fontSize: 11, display: 'block' }}>效率评分</Text>
                  <Text style={{ color: d.efficiencyScore >= 60 ? green : red, fontSize: 28, fontWeight: 700 }}>{d.efficiencyScore}</Text>
                </Col>
                <Col span={4}>
                  <Text style={{ color: muted, fontSize: 11, display: 'block' }}>素材数</Text>
                  <Text style={{ color: text, fontSize: 28, fontWeight: 700 }}>{d.materialCount}</Text>
                </Col>
                <Col span={4}>
                  <Text style={{ color: muted, fontSize: 11, display: 'block' }}>总花费</Text>
                  <Text style={{ color: yellow, fontSize: 28, fontWeight: 700 }}>${d.totalSpend.toFixed(0)}</Text>
                </Col>
                <Col span={4}>
                  <Text style={{ color: muted, fontSize: 11, display: 'block' }}>平均CTR</Text>
                  <Text style={{ color: green, fontSize: 28, fontWeight: 700 }}>{(d.avgCtr * 100).toFixed(2)}%</Text>
                </Col>
                <Col span={4}>
                  <Text style={{ color: muted, fontSize: 11, display: 'block' }}>完播率</Text>
                  <Text style={{ color: '#8b5cf6', fontSize: 28, fontWeight: 700 }}>{(d.avgPlay100Rate * 100).toFixed(1)}%</Text>
                </Col>
              </Row>
            </div>

            {/* Improvement suggestions */}
            <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 8, padding: 16 }}>
              <Text style={{ color: text, fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 12 }}>改进建议</Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {suggestions.map((s, i) => (
                  <div key={i} style={{
                    background: panelBg, borderRadius: 6, padding: '8px 12px',
                    borderLeft: `3px solid ${i === 0 && rank <= 3 ? green : blue}`,
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <Tag color={i === 0 && rank <= 3 ? 'green' : 'blue'} style={{ fontSize: 10, margin: 0 }}>{i + 1}</Tag>
                    <Text style={{ color: text, fontSize: 12 }}>{s}</Text>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ),
      },
      {
        title: '渠道表现排名',
        content: (
          <Table
            dataSource={mediaPerf}
            rowKey="media"
            size="small"
            pagination={false}
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
        title: '游戏表现排名',
        content: (
          <Table
            dataSource={gamePerf}
            rowKey="game"
            size="small"
            pagination={false}
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
        title: '素材级改进建议',
        content: materialSuggestions.length > 0 ? (
          <Table
            dataSource={materialSuggestions}
            rowKey="materialId"
            size="small"
            pagination={false}
            columns={[
              { title: '素材ID', dataIndex: 'materialId', key: 'materialId', render: (v: string) => <Text style={{ color: text, fontSize: 12 }}>{v}</Text> },
              { title: '问题', dataIndex: 'issue', key: 'issue', render: (v: string) => <Text style={{ color: yellow, fontSize: 12 }}>{v}</Text> },
              { title: '建议', dataIndex: 'recommendation', key: 'recommendation', render: (v: string) => <Tag color="blue" style={{ fontSize: 10 }}>{v}</Tag> },
            ]}
          />
        ) : (
          <Text style={{ color: green, fontSize: 12 }}>无需特别改进的素材</Text>
        ),
      },
      {
        title: '与团队对比',
        content: (
          <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 8, padding: 16 }}>
            <Row gutter={[16, 12]}>
              <Col span={6}>
                <Text style={{ color: muted, fontSize: 11, display: 'block' }}>个人CTR</Text>
                <Text style={{ color: d.avgCtr > teamAvgCtr ? green : red, fontSize: 18, fontWeight: 600 }}>{(d.avgCtr * 100).toFixed(2)}%</Text>
                <Text style={{ color: muted, fontSize: 10 }}>团队均值: {(teamAvgCtr * 100).toFixed(2)}%</Text>
              </Col>
              <Col span={6}>
                <Text style={{ color: muted, fontSize: 11, display: 'block' }}>个人CPM</Text>
                <Text style={{ color: d.avgCpm < teamAvgCpm ? green : red, fontSize: 18, fontWeight: 600 }}>${d.avgCpm.toFixed(2)}</Text>
                <Text style={{ color: muted, fontSize: 10 }}>团队均值: ${teamAvgCpm.toFixed(2)}</Text>
              </Col>
              <Col span={6}>
                <Text style={{ color: muted, fontSize: 11, display: 'block' }}>个人效率</Text>
                <Text style={{ color: d.efficiencyScore > teamAvgEfficiency ? green : red, fontSize: 18, fontWeight: 600 }}>{d.efficiencyScore}</Text>
                <Text style={{ color: muted, fontSize: 10 }}>团队均值: {Math.round(teamAvgEfficiency)}</Text>
              </Col>
              <Col span={6}>
                <Text style={{ color: muted, fontSize: 11, display: 'block' }}>个人完播率</Text>
                <Text style={{ color: d.avgPlay100Rate > teamAvgCompletion ? green : red, fontSize: 18, fontWeight: 600 }}>{(d.avgPlay100Rate * 100).toFixed(1)}%</Text>
                <Text style={{ color: muted, fontSize: 10 }}>团队均值: {(teamAvgCompletion * 100).toFixed(1)}%</Text>
              </Col>
            </Row>
          </div>
        ),
      },
    ];
  };

  return (
    <div style={{ padding: 16, background: panelBg, minHeight: '100vh' }}>
      <Title level={4} style={{ color: text, marginBottom: 12 }}>报告中心 · 管理者视角</Title>

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
            <Statistic title={<span style={{ color: muted }}>设计师数</span>} value={summaryStats.designerCount} valueStyle={{ color: blue, fontSize: 20 }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 12 } }}>
            <Statistic title={<span style={{ color: muted }}>平均效率评分</span>} value={summaryStats.avgEfficiency} valueStyle={{ color: summaryStats.avgEfficiency >= 60 ? green : red, fontSize: 20 }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 12 } }}>
            <Statistic title={<span style={{ color: muted }}>平均CTR</span>} value={summaryStats.avgCtr * 100} suffix="%" precision={2} valueStyle={{ color: green, fontSize: 20 }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 12 } }}>
            <Statistic title={<span style={{ color: muted }}>平均完播率</span>} value={summaryStats.avgPlay100Rate * 100} suffix="%" precision={1} valueStyle={{ color: '#8b5cf6', fontSize: 20 }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 12 } }}>
            <Statistic title={<span style={{ color: muted }}>平均CPM</span>} value={summaryStats.avgCpm} prefix="$" precision={2} valueStyle={{ color: yellow, fontSize: 20 }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 12 } }}>
            <Statistic title={<span style={{ color: muted }}>总花费</span>} value={summaryStats.totalSpend} prefix="$" precision={0} valueStyle={{ color: yellow, fontSize: 20 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 16 } }}>
            <Text strong style={{ color: text, fontSize: 14, display: 'block', marginBottom: 12 }}>报告中心 · 管理者反馈</Text>
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              <Row gutter={[12, 8]}>
                {designers.map((d, idx) => {
                  const strengths: string[] = [];
                  const weaknesses: string[] = [];
                  const suggestions: string[] = [];
                  const teamAvgCtr = designers.length>0 ? designers.reduce((s,x)=>s+x.avgCtr,0)/designers.length : 0;
                  const teamAvgCpm = designers.length>0 ? designers.reduce((s,x)=>s+x.avgCpm,0)/designers.length : 0;
                  const teamAvgEff = designers.length>0 ? designers.reduce((s,x)=>s+x.efficiencyScore,0)/designers.length : 0;
                  if (idx === 0) strengths.push('团队排名第一，标杆设计师');
                  else if (idx < 3) strengths.push(`团队排名第${idx+1}，表现优秀`);
                  if (d.efficiencyScore > teamAvgEff) strengths.push(`效率高于团队均值(+${(d.efficiencyScore-teamAvgEff).toFixed(0)}分)`);
                  else weaknesses.push(`效率低于团队均值(${(d.efficiencyScore-teamAvgEff).toFixed(0)}分)`);
                  if (d.avgCtr > teamAvgCtr) strengths.push(`CTR高于均值(+${((d.avgCtr-teamAvgCtr)*100).toFixed(2)}%)`);
                  else { weaknesses.push(`CTR低于均值(${((d.avgCtr-teamAvgCtr)*100).toFixed(2)}%)`); suggestions.push('参考高CTR设计师的素材策略'); }
                  if (d.avgCpm < teamAvgCpm) strengths.push(`CPM低于均值(-$${(teamAvgCpm-d.avgCpm).toFixed(1)})成本优势`);
                  else { weaknesses.push(`CPM高于均值(+$${(d.avgCpm-teamAvgCpm).toFixed(1)})`); suggestions.push('优化竞价策略降低CPM'); }
                  if (d.anomalyCount > 0) { weaknesses.push(`${d.anomalyCount}条异常素材需处理`); suggestions.push('排查异常数据后再追加投放'); }
                  if (d.avgPlay100Rate > teamAvgCtr*100) strengths.push('完播率高于团队平均水平');
                  if (d.efficiencyScore >= 70 && suggestions.length === 0) suggestions.push('表现优异，建议追加预算扩大优势');
                  if (suggestions.length===0) suggestions.push('继续关注数据变化，保持当前策略');
                  if (strengths.length===0) strengths.push('各项指标接近团队均值');
                  if (weaknesses.length===0) weaknesses.push('表现优于团队平均水平');
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
              <Text strong style={{ color: text, fontSize: 13 }}>效率排名对比</Text>
              <Text style={{ color: muted, fontSize: 10, textAlign: 'right', maxWidth: '55%', lineHeight: '14px' }}>各设计师综合效率评分排名对比</Text>
            </div>
            <ReactECharts option={{
              backgroundColor: 'transparent',
              tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0].name}<br/>评分: ${p[0].value}` },
              grid: { left: 10, right: 20, top: 4, bottom: 8, containLabel: true },
              xAxis: { type: 'category', data: rankedDesigners.map(d => d.name), axisLabel: { color: muted, fontSize: 10 }, axisLine: { lineStyle: { color: border } } },
              yAxis: { type: 'value', max: 100, axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: '#1e293b' } } },
              series: [{ type: 'bar', data: rankedDesigners.map((d, i) => ({ value: d.efficiencyScore, itemStyle: { color: i === 0 ? yellow : i === 1 ? '#c0c0c0' : d.efficiencyScore >= 60 ? green : red } })), barWidth: 20, itemStyle: { borderRadius: [4, 4, 0, 0] } }]
            }} style={{ height: 220 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: '12px 12px 8px' } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
              <Text strong style={{ color: text, fontSize: 13 }}>设计师综合排名</Text>
              <Text style={{ color: muted, fontSize: 10, textAlign: 'right', maxWidth: '55%', lineHeight: '14px' }}>按综合效率评分排名的设计师综合表现对比</Text>
            </div>
            <Table
              dataSource={rankedDesigners}
              rowKey="name"
              size="small"
              pagination={false}
              scroll={{ y: 224 }}
              columns={[
                { title: '#', dataIndex: '_rank', key: 'rank', width: 36, render: (_: any, __: any, i: number) => <Tag color={i === 0 ? 'gold' : i === 1 ? 'default' : i === 2 ? 'orange' : 'blue'} style={{ fontSize: 10, margin: 0 }}>#{i + 1}</Tag> },
                { title: '设计师', dataIndex: 'name', key: 'name', render: (v: string) => <Text style={{ color: text, fontSize: 11 }}>{v}</Text> },
                { title: '效率', dataIndex: 'efficiencyScore', key: 'eff', width: 52, render: (v: number) => <Text style={{ color: v >= 60 ? green : red, fontSize: 11, fontWeight: 600 }}>{v}</Text> },
                { title: 'CTR', key: 'ctr', width: 60, render: (_: any, r: any) => <Text style={{ color: green, fontSize: 11 }}>{(r.avgCtr * 100).toFixed(2)}%</Text> },
                { title: '完播', key: 'comp', width: 56, render: (_: any, r: any) => <Text style={{ color: '#8b5cf6', fontSize: 11 }}>{(r.avgPlay100Rate * 100).toFixed(1)}%</Text> },
                { title: '素材', dataIndex: 'materialCount', key: 'cnt', width: 44, render: (v: number) => <Text style={{ color: muted, fontSize: 11 }}>{v}</Text> },
                { title: '花费', key: 'spend', width: 70, render: (_: any, r: any) => <Text style={{ color: yellow, fontSize: 11 }}>${r.totalSpend.toFixed(0)}</Text> },
              ]}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: '12px 12px 8px' } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
              <Text strong style={{ color: text, fontSize: 13 }}>花费 vs CTR</Text>
              <Text style={{ color: muted, fontSize: 10, textAlign: 'right', maxWidth: '55%', lineHeight: '14px' }}>花费与CTR的散点分布，识别高性价比素材</Text>
            </div>
            <ReactECharts option={{
              backgroundColor: 'transparent',
              tooltip: { formatter: (p: any) => `${p.data[2]}<br/>花费: $${p.data[0].toFixed(0)}<br/>CTR: ${p.data[1].toFixed(2)}%` },
              grid: { left: 50, right: 20, top: 4, bottom: 24 },
              xAxis: { type: 'value', name: '花费($)', nameTextStyle: { color: muted, fontSize: 10 }, axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: '#1e293b' } } },
              yAxis: { type: 'value', name: 'CTR(%)', nameTextStyle: { color: muted, fontSize: 10 }, axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: '#1e293b' } } },
              series: [{
                type: 'scatter', symbolSize: 18,
                data: designers.map(d => [d.totalSpend, d.avgCtr * 100, d.name]),
                itemStyle: { color: green, borderColor: blue, borderWidth: 1 },
                label: { show: true, formatter: (p: any) => p.data[2], position: 'top', color: text, fontSize: 9 }
              }]
            }} style={{ height: 260 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: '12px 12px 8px' } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
              <Text strong style={{ color: text, fontSize: 13 }}>完播率对比</Text>
              <Text style={{ color: muted, fontSize: 10, textAlign: 'right', maxWidth: '55%', lineHeight: '14px' }}>各设计师视频完播率对比，反映内容吸引力</Text>
            </div>
            <ReactECharts option={{
              backgroundColor: 'transparent',
              tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0].name}<br/>完播率: ${p[0].value.toFixed(1)}%` },
              grid: { left: 10, right: 20, top: 4, bottom: 8, containLabel: true },
              xAxis: { type: 'category', data: designers.map(d => d.name), axisLabel: { color: muted, fontSize: 10 }, axisLine: { lineStyle: { color: border } } },
              yAxis: { type: 'value', axisLabel: { color: muted, fontSize: 10, formatter: (v: number) => `${v}%` }, splitLine: { lineStyle: { color: '#1e293b' } } },
              series: [{ type: 'bar', data: designers.map(d => d.avgPlay100Rate * 100), barWidth: 20, itemStyle: { color: purple, borderRadius: [4, 4, 0, 0] } }]
            }} style={{ height: 260 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[12, 12]}>
        {rankedDesigners.map((d, idx) => {
          const rank = idx + 1;
          return (
            <Col key={d.name} xs={12} sm={8} md={6} lg={4}>
              <DesignerCard designer={d} sections={getCardSections(d, rank)} onClick={() => handleCardClick(d)} />
            </Col>
          );
        })}
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
