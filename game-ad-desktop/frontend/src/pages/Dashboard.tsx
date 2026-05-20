import { useMemo, useState } from 'react';
import { Row, Col, Card, Tag, Typography, Progress, Button, Input, Space, Divider } from 'antd';
import {
  EditOutlined, CheckOutlined, DollarOutlined, ThunderboltOutlined,
  AimOutlined, PlayCircleOutlined, RiseOutlined, FallOutlined, BulbOutlined,
  WarningOutlined, CheckCircleOutlined, FireOutlined, RocketOutlined,
  BarChartOutlined, TeamOutlined, GlobalOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import materialDataJson from '../data/materialData.json';

const { Text } = Typography;

const panelBg = '#1E293B';
const border = '#334155';
const darkBg = '#0f172a';
const green = '#10b981';
const red = '#ef4444';
const yellow = '#f59e0b';
const blue = '#3b82f6';
const purple = '#8b5cf6';

// ===== Score Card Component =====
function ScoreCard({ label, score, icon, color }: { label: string; score: number; icon: React.ReactNode; color: string }) {
  const status = score >= 80 ? '优秀' : score >= 60 ? '良好' : score >= 40 ? '一般' : '需优化';
  const statusColor = score >= 80 ? green : score >= 60 ? blue : score >= 40 ? yellow : red;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontSize: 14 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
          <Text style={{ color: '#e2e8f0', fontSize: 12 }}>{label}</Text>
          <Tag color={statusColor} style={{ fontSize: 10, margin: 0 }}>{status}</Tag>
        </div>
        <Progress percent={score} size="small" strokeColor={statusColor} trailColor="#1e293b" showInfo={false} />
      </div>
      <Text style={{ color: statusColor, fontSize: 16, fontWeight: 600, minWidth: 32, textAlign: 'right' }}>{score}</Text>
    </div>
  );
}

// ===== Metric Chip =====
function MetricChip({ label, value, unit, trend, color }: { label: string; value: string; unit?: string; trend?: 'up' | 'down' | 'flat'; color?: string }) {
  const trendIcon = trend === 'up' ? <RiseOutlined /> : trend === 'down' ? <FallOutlined /> : null;
  const trendColor = trend === 'up' ? green : trend === 'down' ? red : '#64748b';
  return (
    <div style={{ background: '#0f172a', borderRadius: 6, padding: '6px 10px', border: '1px solid #1e293b' }}>
      <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ color: color || '#e2e8f0', fontSize: 16, fontWeight: 600 }}>{value}</span>
        {unit && <span style={{ color: '#64748b', fontSize: 10 }}>{unit}</span>}
        {trendIcon && <span style={{ color: trendColor, fontSize: 10 }}>{trendIcon}</span>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [title, setTitle] = useState(() => localStorage.getItem('dashboard_title') || '设计师素材数据分析');
  const [editingTitle, setEditingTitle] = useState(false);

  const data: any[] = useMemo(() => (materialDataJson as any[]).filter(r => r.spend > 0), []);

  // === Core Metrics ===
  const m = useMemo(() => {
    const totalSpend = data.reduce((s, r) => s + r.spend, 0);
    const totalImp = data.reduce((s, r) => s + r.impressions, 0);
    const totalClicks = data.reduce((s, r) => s + r.clicks, 0);
    const totalPlay = data.reduce((s, r) => s + r.playCount, 0);
    const totalPlay2s = data.reduce((s, r) => s + r.play2s, 0);
    const totalPlay100 = data.reduce((s, r) => s + r.play100, 0);
    const avgCpm = totalImp > 0 ? totalSpend / totalImp * 1000 : 0;
    const avgCtr = totalImp > 0 ? totalClicks / totalImp * 100 : 0;
    const avgCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
    const completionRate = totalPlay > 0 ? totalPlay100 / totalPlay : 0;
    const play2sRate = totalPlay > 0 ? totalPlay2s / totalPlay : 0;
    return { totalSpend, totalImp, totalClicks, totalPlay, totalPlay2s, totalPlay100, avgCpm, avgCtr, avgCpc, completionRate, play2sRate, count: data.length };
  }, [data]);

  // === Health Scores ===
  const scores = useMemo(() => {
    // CTR score: >1.5% = 100, <0.3% = 20
    const ctrScore = Math.min(100, Math.max(20, (m.avgCtr - 0.3) / 1.2 * 80 + 20));
    // CPM efficiency: lower = better, <3 = 100, >10 = 30
    const cpmScore = Math.min(100, Math.max(20, (10 - m.avgCpm) / 7 * 80 + 20));
    // Completion rate: >8% = 100, <1% = 20
    const completionScore = Math.min(100, Math.max(20, (m.completionRate * 100 - 1) / 7 * 80 + 20));
    // Play engagement: 2s play rate >30% = 100, <10% = 30
    const engageScore = Math.min(100, Math.max(20, (m.play2sRate * 100 - 10) / 20 * 80 + 20));
    // Material diversity: more categories = better
    const cats = new Set(data.map(r => r.category)).size;
    const diversityScore = Math.min(100, Math.max(30, cats * 12));
    // Overall
    const overall = Math.round((ctrScore + cpmScore + completionScore + engageScore + diversityScore) / 5);
    return { overall, ctrScore: Math.round(ctrScore), cpmScore: Math.round(cpmScore), completionScore: Math.round(completionScore), engageScore: Math.round(engageScore), diversityScore: Math.round(diversityScore) };
  }, [m, data]);

  // === Category Analysis ===
  const categoryData = useMemo(() => {
    const map: Record<string, { spend: number; count: number; imp: number; clicks: number; play: number; play100: number }> = {};
    data.forEach(r => {
      if (!map[r.category]) map[r.category] = { spend: 0, count: 0, imp: 0, clicks: 0, play: 0, play100: 0 };
      const c = map[r.category];
      c.spend += r.spend; c.count += 1; c.imp += r.impressions; c.clicks += r.clicks; c.play += r.playCount; c.play100 += r.play100;
    });
    return Object.entries(map)
      .map(([cat, v]) => ({
        category: cat, ...v,
        cpm: v.imp > 0 ? v.spend / v.imp * 1000 : 0,
        ctr: v.imp > 0 ? v.clicks / v.imp : 0,
        completionRate: v.play > 0 ? v.play100 / v.play : 0,
      }))
      .sort((a, b) => b.spend - a.spend);
  }, [data]);

  // === Top & Bottom Performers ===
  const analysis = useMemo(() => {
    const sorted = [...data].sort((a, b) => b.spend - a.spend);
    const top5spend = sorted.slice(0, 5);
    const highCtr = data.filter(r => r.ctr > 0.015).sort((a, b) => b.ctr - a.ctr).slice(0, 5);
    const lowCtr = data.filter(r => r.ctr > 0 && r.ctr < 0.003);
    const highCpm = data.filter(r => r.cpm > 8).sort((a, b) => b.cpm - a.cpm).slice(0, 3);
    const zeroPlay = data.filter(r => r.playCount === 0);
    const highCompletion = data.filter(r => r.play100 > 0 && r.playCount > 1000)
      .map(r => ({ ...r, rate: r.play100 / r.playCount }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 3);
    return { top5spend, highCtr, lowCtr, highCpm, zeroPlay, highCompletion };
  }, [data]);

  // === Category Spend Chart ===
  const categoryChart = useMemo(() => {
    const top8 = categoryData.slice(0, 8);
    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' as const, axisPointer: { type: 'shadow' as const } },
      grid: { left: 100, right: 20, top: 8, bottom: 8 },
      xAxis: { type: 'value' as const, axisLabel: { color: '#94a3b8', fontSize: 10, formatter: (v: number) => `$${(v/1000).toFixed(0)}K` }, splitLine: { lineStyle: { color: '#1e293b' } } },
      yAxis: { type: 'category' as const, data: top8.map(e => e.category).reverse(), axisLabel: { color: '#e2e8f0', fontSize: 10 }, axisLine: { lineStyle: { color: '#334155' } } },
      series: [{ type: 'bar', data: top8.map(e => e.spend).reverse(), barWidth: 12, itemStyle: { color: blue, borderRadius: [0, 3, 3, 0] } }],
    };
  }, [categoryData]);

  // === Play Funnel Chart ===
  const funnelChart = useMemo(() => {
    const fields = ['playCount', 'play2s', 'play6s', 'play25', 'play50', 'play75', 'play100'];
    const labels = ['总播放', '2s', '6s', '25%', '50%', '75%', '100%'];
    const totals = fields.map(f => data.reduce((s, r) => s + (r[f] || 0), 0));
    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' as const },
      grid: { left: 40, right: 10, top: 8, bottom: 20 },
      xAxis: { type: 'category' as const, data: labels, axisLabel: { color: '#94a3b8', fontSize: 9 }, axisLine: { lineStyle: { color: '#334155' } } },
      yAxis: { type: 'value' as const, axisLabel: { color: '#94a3b8', fontSize: 9, formatter: (v: number) => `${(v/10000).toFixed(0)}万` }, splitLine: { lineStyle: { color: '#1e293b' } } },
      series: [{
        type: 'bar', data: totals, barWidth: 20,
        itemStyle: { color: (p: any) => [purple, '#818cf8', '#a5b4fc', blue, '#60a5fa', '#93c5fd', green][p.dataIndex], borderRadius: [3, 3, 0, 0] },
        label: { show: true, position: 'top' as const, color: '#94a3b8', fontSize: 9, formatter: (p: any) => `${(p.value/10000).toFixed(1)}万` },
      }],
    };
  }, [data]);

  // === CTR vs CPM Scatter ===
  const scatterChart = useMemo(() => {
    const points = data.filter(r => r.ctr > 0 && r.cpm > 0).map(r => [r.cpm, r.ctr, r.spend, r.materialId]);
    return {
      backgroundColor: 'transparent',
      tooltip: { formatter: (p: any) => `${p.data[3]}<br/>CPM: $${p.data[0].toFixed(2)}<br/>CTR: ${(p.data[1]*100).toFixed(2)}%<br/>花费: $${p.data[2].toFixed(0)}` },
      grid: { left: 50, right: 15, top: 8, bottom: 30 },
      xAxis: { name: 'CPM', nameTextStyle: { color: '#64748b', fontSize: 9 }, type: 'value' as const, axisLabel: { color: '#94a3b8', fontSize: 9 }, splitLine: { lineStyle: { color: '#1e293b' } } },
      yAxis: { name: 'CTR', nameTextStyle: { color: '#64748b', fontSize: 9 }, type: 'value' as const, axisLabel: { color: '#94a3b8', fontSize: 9, formatter: (v: number) => `${(v*100).toFixed(1)}%` }, splitLine: { lineStyle: { color: '#1e293b' } } },
      series: [{ type: 'scatter', data: points, symbolSize: (d: any) => Math.max(3, Math.sqrt(d[2]) / 4), itemStyle: { color: green, opacity: 0.6 } }],
    };
  }, [data]);

  // === Optimization Recommendations ===
  const recommendations = useMemo(() => {
    const recs: { level: 'danger' | 'warning' | 'info' | 'success'; title: string; detail: string; action: string }[] = [];

    if (analysis.lowCtr.length > 0) {
      recs.push({ level: 'danger', title: `${analysis.lowCtr.length} 条素材 CTR < 0.3%`, detail: `总花费 $${analysis.lowCtr.reduce((s, r) => s + r.spend, 0).toFixed(0)}，效果极差`, action: '建议暂停并优化素材创意，或调整投放受众' });
    }
    if (analysis.highCpm.length > 0) {
      recs.push({ level: 'warning', title: `${analysis.highCpm.length} 条素材 CPM > $8`, detail: `最高 CPM $${analysis.highCpm[0].cpm.toFixed(2)}，展示成本偏高`, action: '检查竞价策略，考虑调整出价或更换投放时段' });
    }
    if (analysis.zeroPlay.length > 0) {
      recs.push({ level: 'warning', title: `${analysis.zeroPlay.length} 条素材无播放数据`, detail: '可能存在素材加载问题或投放未生效', action: '检查素材状态和投放配置' });
    }
    if (m.completionRate < 0.03) {
      recs.push({ level: 'warning', title: '整体完播率偏低', detail: `当前完播率 ${(m.completionRate*100).toFixed(1)}%，低于 3% 基准`, action: '优化前3秒吸引力，缩短素材时长' });
    }
    if (analysis.highCtr.length > 0) {
      recs.push({ level: 'success', title: `${analysis.highCtr.length} 条高 CTR 素材`, detail: `最高 CTR ${(analysis.highCtr[0].ctr*100).toFixed(2)}%，表现优异`, action: '建议追加预算，扩大投放范围' });
    }
    if (analysis.highCompletion.length > 0) {
      recs.push({ level: 'success', title: '发现高完播率素材', detail: `「${analysis.highCompletion[0].materialId}」完播率 ${(analysis.highCompletion[0].rate*100).toFixed(1)}%`, action: '分析其创意特点，复制到其他素材' });
    }

    const catCount = new Set(data.map(r => r.category)).size;
    if (catCount < 4) {
      recs.push({ level: 'info', title: '素材分类集中度高', detail: `仅覆盖 ${catCount} 个游戏分类`, action: '建议拓展更多游戏类型，分散风险' });
    }

    return recs;
  }, [data, m, analysis]);

  const levelIcon = (l: string) => l === 'danger' ? <WarningOutlined style={{ color: red }} /> : l === 'warning' ? <WarningOutlined style={{ color: yellow }} /> : l === 'success' ? <CheckCircleOutlined style={{ color: green }} /> : <BulbOutlined style={{ color: blue }} />;
  const levelBorder = (l: string) => l === 'danger' ? red : l === 'warning' ? yellow : l === 'success' ? green : blue;

  return (
    <div style={{ padding: 12, background: darkBg, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        {editingTitle ? (
          <Space>
            <Input value={title} onChange={e => setTitle(e.target.value)} onPressEnter={() => { setEditingTitle(false); localStorage.setItem('dashboard_title', title); }}
              style={{ background: '#0f172a', border: `1px solid ${blue}`, color: '#e2e8f0', fontSize: 22, fontWeight: 700, width: 360 }} />
            <Button type="primary" icon={<CheckOutlined />} size="small" onClick={() => { setEditingTitle(false); localStorage.setItem('dashboard_title', title); }} />
          </Space>
        ) : (
          <Space>
            <span style={{ color: '#e2e8f0', fontSize: 22, fontWeight: 700 }}>{title}</span>
            <Button type="text" icon={<EditOutlined />} size="small" style={{ color: '#64748b' }} onClick={() => setEditingTitle(true)} />
          </Space>
        )}
        <div style={{ flex: 1 }} />
        <Tag color="blue" style={{ fontSize: 10 }}>{data.length} 条素材</Tag>
        <Tag color="green" style={{ fontSize: 10 }}>数据健康度 {scores.overall}/100</Tag>
      </div>

      <Row gutter={[8, 8]}>
        {/* Left: Health Scores */}
        <Col span={5}>
          <Card title={<span style={{ color: '#e2e8f0', fontSize: 12 }}><CheckCircleOutlined /> 数据体检</span>}
            style={{ background: panelBg, border: `1px solid ${border}` }} styles={{ body: { padding: '4px 12px' } }}>
            <ScoreCard label="CTR 点击率" score={scores.ctrScore} icon={<AimOutlined />} color={blue} />
            <ScoreCard label="CPM 效率" score={scores.cpmScore} icon={<ThunderboltOutlined />} color={yellow} />
            <ScoreCard label="完播率" score={scores.completionScore} icon={<PlayCircleOutlined />} color={green} />
            <ScoreCard label="播放参与度" score={scores.engageScore} icon={<FireOutlined />} color={purple} />
            <ScoreCard label="素材多样性" score={scores.diversityScore} icon={<BarChartOutlined />} color='#ec4899' />
            <Divider style={{ margin: '8px 0', borderColor: '#1e293b' }} />
            <div style={{ textAlign: 'center', padding: '4px 0' }}>
              <Progress type="circle" percent={scores.overall} size={64} strokeColor={scores.overall >= 60 ? green : yellow}
                trailColor="#1e293b" format={(p) => <span style={{ color: '#e2e8f0', fontSize: 16, fontWeight: 600 }}>{p}</span>} />
              <div style={{ color: '#94a3b8', fontSize: 10, marginTop: 4 }}>综合健康度</div>
            </div>
          </Card>
        </Col>

        {/* Center: Metrics + Charts */}
        <Col span={13}>
          {/* Metric Chips */}
          <Row gutter={[6, 6]} style={{ marginBottom: 8 }}>
            {[
              { label: '总花费', value: `$${(m.totalSpend/1000).toFixed(1)}K`, color: yellow },
              { label: '总展示', value: `${(m.totalImp/10000).toFixed(0)}万`, color: blue },
              { label: '平均CPM', value: `$${m.avgCpm.toFixed(2)}`, color: '#e2e8f0' },
              { label: '平均CTR', value: `${m.avgCtr.toFixed(2)}%`, color: green },
              { label: '平均CPC', value: `$${m.avgCpc.toFixed(2)}`, color: '#e2e8f0' },
              { label: '完播率', value: `${(m.completionRate*100).toFixed(1)}%`, color: purple },
            ].map((c, i) => (
              <Col span={4} key={i}>
                <MetricChip label={c.label} value={c.value} color={c.color} />
              </Col>
            ))}
          </Row>

          {/* Charts Row */}
          <Row gutter={[8, 8]}>
            <Col span={12}>
              <Card title={<span style={{ color: '#e2e8f0', fontSize: 11 }}><BarChartOutlined /> 分类花费分布</span>}
                style={{ background: panelBg, border: `1px solid ${border}` }} styles={{ body: { padding: '4px 8px' } }}>
                <ReactECharts option={categoryChart} style={{ height: 200 }} />
              </Card>
            </Col>
            <Col span={12}>
              <Card title={<span style={{ color: '#e2e8f0', fontSize: 11 }}><PlayCircleOutlined /> 播放漏斗</span>}
                style={{ background: panelBg, border: `1px solid ${border}` }} styles={{ body: { padding: '4px 8px' } }}>
                <ReactECharts option={funnelChart} style={{ height: 200 }} />
              </Card>
            </Col>
          </Row>

          {/* Scatter */}
          <Card title={<span style={{ color: '#e2e8f0', fontSize: 11 }}><AimOutlined /> CTR × CPM 素材分布</span>}
            style={{ background: panelBg, border: `1px solid ${border}`, marginTop: 8 }} styles={{ body: { padding: '4px 8px' } }}>
            <ReactECharts option={scatterChart} style={{ height: 170 }} />
          </Card>
        </Col>

        {/* Right: Recommendations */}
        <Col span={6}>
          <Card title={<span style={{ color: '#e2e8f0', fontSize: 12 }}><RocketOutlined /> 优化建议</span>}
            style={{ background: panelBg, border: `1px solid ${border}` }} styles={{ body: { padding: '6px 10px' } }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recommendations.map((r, i) => (
                <div key={i} style={{ background: '#0f172a', borderRadius: 6, padding: '8px 10px', borderLeft: `3px solid ${levelBorder(r.level)}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    {levelIcon(r.level)}
                    <Text style={{ color: '#e2e8f0', fontSize: 11, fontWeight: 500 }}>{r.title}</Text>
                  </div>
                  <div style={{ color: '#64748b', fontSize: 10, marginBottom: 3 }}>{r.detail}</div>
                  <div style={{ color: levelBorder(r.level), fontSize: 10 }}>{r.action}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Stats */}
          <Card title={<span style={{ color: '#e2e8f0', fontSize: 12 }}><BulbOutlined /> 关键发现</span>}
            style={{ background: panelBg, border: `1px solid ${border}`, marginTop: 8 }} styles={{ body: { padding: '6px 10px' } }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {analysis.highCtr.length > 0 && (
                <div style={{ fontSize: 11, color: '#e2e8f0' }}>
                  <FireOutlined style={{ color: yellow, marginRight: 4 }} />
                  TOP CTR: <span style={{ color: green }}>{analysis.highCtr[0].materialId}</span> ({(analysis.highCtr[0].ctr*100).toFixed(2)}%)
                </div>
              )}
              {analysis.top5spend.length > 0 && (
                <div style={{ fontSize: 11, color: '#e2e8f0' }}>
                  <DollarOutlined style={{ color: yellow, marginRight: 4 }} />
                  TOP 花费: <span style={{ color: yellow }}>{analysis.top5spend[0].materialId}</span> (${analysis.top5spend[0].spend.toFixed(0)})
                </div>
              )}
              {categoryData.length > 0 && (
                <div style={{ fontSize: 11, color: '#e2e8f0' }}>
                  <GlobalOutlined style={{ color: blue, marginRight: 4 }} />
                  最大分类: <span style={{ color: blue }}>{categoryData[0].category}</span> ({categoryData[0].count} 条)
                </div>
              )}
              <div style={{ fontSize: 11, color: '#e2e8f0' }}>
                <TeamOutlined style={{ color: purple, marginRight: 4 }} />
                覆盖 <span style={{ color: purple }}>{categoryData.length}</span> 个游戏分类
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
