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

export default function ManagerMemory() {
  const { designers, refresh, setSelectedDesigner } = useManagerDataStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeDesigner, setActiveDesigner] = useState<DesignerStats | null>(null);

  useEffect(() => { refresh(); }, [refresh]);

  const summaryStats = useMemo(() => ({
    designerCount: designers.length,
    materialCount: designers.reduce((s, d) => s + d.materialCount, 0),
    totalSpend: designers.reduce((s, d) => s + d.totalSpend, 0),
    avgCtr: designers.length > 0 ? designers.reduce((s, d) => s + d.avgCtr, 0) / designers.length : 0,
    avgPlay100Rate: designers.length > 0 ? designers.reduce((s, d) => s + d.avgPlay100Rate, 0) / designers.length : 0,
    avgEfficiency: designers.length > 0 ? designers.reduce((s, d) => s + d.efficiencyScore, 0) / designers.length : 0,
  }), [designers]);

  const categoryPieData = useMemo(() => {
    const cm: Record<string, number> = {};
    for (const d of designers) for (const m of d.materials) if (m.category) cm[m.category] = (cm[m.category] || 0) + (m.spend || 0);
    return Object.entries(cm).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  }, [designers]);


  const handleCardClick = (designer: DesignerStats) => {
    setActiveDesigner(designer);
    setSelectedDesigner(designer.name);
    setModalOpen(true);
  };

  const getSpecialty = (d: DesignerStats): string => {
    const cats = d.materials.reduce((acc, m) => {
      if (m.category) acc[m.category] = (acc[m.category] || 0) + m.spend;
      return acc;
    }, {} as Record<string, number>);
    const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] : '-';
  };

  const chipStyle = (color: string): React.CSSProperties => ({
    display: 'inline-block', padding: '2px 6px', borderRadius: 4,
    fontSize: 10, color, fontWeight: 500,
  });

  const barRow = (label: string, pct: number, amount: number, barColor: string) => (
    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ color: text, fontSize: 10, minWidth: 56, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, background: panelBg, borderRadius: 3, height: 5 }}>
        <div style={{ width: `${Math.min(pct, 100)}%`, background: barColor, height: 5, borderRadius: 3 }} />
      </div>
      <span style={{ color: yellow, fontSize: 10, minWidth: 44, textAlign: 'right', whiteSpace: 'nowrap' }}>${amount.toFixed(0)}</span>
      <span style={{ color: muted, fontSize: 9, minWidth: 30, textAlign: 'right' }}>{pct.toFixed(0)}%</span>
    </div>
  );

  const getCardSections = (d: DesignerStats): CardSection[] => {
    const specialty = getSpecialty(d);
    const topMedia = d.mediaBreakdown.length > 0 ? d.mediaBreakdown[0].media : '-';

    const categoryBreakdown = d.materials.reduce((acc, m) => {
      if (m.category) {
        if (!acc[m.category]) acc[m.category] = { count: 0, spend: 0 };
        acc[m.category].count++;
        acc[m.category].spend += m.spend;
      }
      return acc;
    }, {} as Record<string, { count: number; spend: number }>);
    const sortedCategories = Object.entries(categoryBreakdown).sort((a, b) => b[1].spend - a[1].spend).slice(0, 3);

    const top3BySpend = [...d.materials].sort((a, b) => b.spend - a.spend).slice(0, 3);

    return [
      {
        title: '设计师档案',
        content: (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            <span style={chipStyle(blue)}>素材 {d.materialCount}</span>
            <span style={chipStyle(purple)}>擅长 {specialty}</span>
            <span style={chipStyle(blue)}>渠道 {topMedia}</span>
            <span style={chipStyle(green)}>CTR {(d.avgCtr * 100).toFixed(2)}%</span>
            <span style={chipStyle(d.efficiencyScore >= 60 ? green : red)}>效率 {d.efficiencyScore}</span>
            <span style={chipStyle(yellow)}>花费 ${d.totalSpend.toFixed(0)}</span>
          </div>
        ),
      },
      {
        title: '分类花费',
        content: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {sortedCategories.map(([cat, data]) =>
              barRow(cat, d.totalSpend > 0 ? data.spend / d.totalSpend * 100 : 0, data.spend, blue)
            )}
          </div>
        ),
      },
      {
        title: '渠道花费',
        content: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {d.mediaBreakdown.map(m =>
              barRow(m.media, d.totalSpend > 0 ? m.spend / d.totalSpend * 100 : 0, m.spend, purple)
            )}
          </div>
        ),
      },
      {
        title: 'TOP3作品',
        content: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {top3BySpend.map(m => (
              <div key={m.materialId} style={{
                display: 'flex', alignItems: 'center', gap: 4, fontSize: 10,
                background: panelBg, borderRadius: 4, padding: '3px 5px',
              }}>
                <Text style={{ color: text, fontSize: 10, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.materialId}</Text>
                <span style={{ color: muted }}>{m.category}</span>
                <span style={{ color: yellow }}>${m.spend.toFixed(0)}</span>
                <span style={{ color: green }}>{(m.ctr * 100).toFixed(2)}%</span>
              </div>
            ))}
          </div>
        ),
      },
    ];
  };

  const getModalSections = (d: DesignerStats): DetailSection[] => {
    const specialty = getSpecialty(d);
    const categoryBreakdown = d.materials.reduce((acc, m) => {
      if (m.category) {
        if (!acc[m.category]) acc[m.category] = { count: 0, spend: 0 };
        acc[m.category].count++;
        acc[m.category].spend += m.spend;
      }
      return acc;
    }, {} as Record<string, { count: number; spend: number }>);

    const sortedCategories = Object.entries(categoryBreakdown).sort((a, b) => b[1].spend - a[1].spend);

    // Simple efficiency trend: compare first half vs second half materials
    const sortedBySpend = [...d.materials].sort((a, b) => b.spend - a.spend);
    const half = Math.ceil(sortedBySpend.length / 2);
    const topHalfCtr = half > 0 ? sortedBySpend.slice(0, half).reduce((s, m) => s + m.ctr, 0) / half : 0;
    const bottomHalfCtr = half > 0 ? sortedBySpend.slice(half).reduce((s, m) => s + m.ctr, 0) / (sortedBySpend.length - half) : 0;
    const trend = topHalfCtr > bottomHalfCtr ? '上升' : topHalfCtr < bottomHalfCtr ? '下降' : '持平';
    const trendColor = trend === '上升' ? green : trend === '下降' ? red : muted;

    // Top media
    const topMedia = d.mediaBreakdown.length > 0 ? d.mediaBreakdown[0].media : '-';

    // Top 3 materials by spend
    const top3BySpend = [...d.materials].sort((a, b) => b.spend - a.spend).slice(0, 3);

    return [
      {
        title: '设计师档案',
        content: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Profile summary */}
            <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 8, padding: 16 }}>
              <Row gutter={[16, 12]}>
                <Col span={4}>
                  <Text style={{ color: muted, fontSize: 11, display: 'block' }}>擅长分类</Text>
                  <Tag color={purple} style={{ fontSize: 12, marginTop: 4 }}>{specialty}</Tag>
                </Col>
                <Col span={4}>
                  <Text style={{ color: muted, fontSize: 11, display: 'block' }}>擅长渠道</Text>
                  <Tag color={blue} style={{ fontSize: 12, marginTop: 4 }}>{topMedia}</Tag>
                </Col>
                <Col span={4}>
                  <Text style={{ color: muted, fontSize: 11, display: 'block' }}>素材总数</Text>
                  <Text style={{ color: text, fontSize: 18, fontWeight: 600 }}>{d.materialCount}</Text>
                </Col>
                <Col span={4}>
                  <Text style={{ color: muted, fontSize: 11, display: 'block' }}>总花费</Text>
                  <Text style={{ color: yellow, fontSize: 18, fontWeight: 600 }}>${d.totalSpend.toFixed(0)}</Text>
                </Col>
                <Col span={4}>
                  <Text style={{ color: muted, fontSize: 11, display: 'block' }}>效率趋势</Text>
                  <Text style={{ color: trendColor, fontSize: 18, fontWeight: 600 }}>{trend}</Text>
                </Col>
                <Col span={4}>
                  <Text style={{ color: muted, fontSize: 11, display: 'block' }}>平均CTR</Text>
                  <Text style={{ color: green, fontSize: 18, fontWeight: 600 }}>{(d.avgCtr * 100).toFixed(2)}%</Text>
                </Col>
              </Row>
            </div>

            {/* Category breakdown */}
            <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 8, padding: 16 }}>
              <Text style={{ color: text, fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 12 }}>分类分布</Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sortedCategories.map(([cat, data]) => (
                  <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Text style={{ color: text, fontSize: 12, minWidth: 80 }}>{cat}</Text>
                    <div style={{ flex: 1, background: panelBg, borderRadius: 4, height: 8 }}>
                      <div style={{
                        width: `${Math.min(data.spend / d.totalSpend * 100, 100)}%`,
                        background: blue, height: 8, borderRadius: 4,
                      }} />
                    </div>
                    <Text style={{ color: muted, fontSize: 11, minWidth: 60, textAlign: 'right' }}>{data.count}条</Text>
                    <Text style={{ color: yellow, fontSize: 11, minWidth: 60, textAlign: 'right' }}>${data.spend.toFixed(0)}</Text>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ),
      },
      {
        title: '渠道分布',
        content: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {d.mediaBreakdown.map((m) => (
              <div key={m.media} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Text style={{ color: text, fontSize: 12, minWidth: 80 }}>{m.media}</Text>
                <div style={{ flex: 1, background: panelBg, borderRadius: 4, height: 8 }}>
                  <div style={{
                    width: `${Math.min(m.spend / d.totalSpend * 100, 100)}%`,
                    background: purple, height: 8, borderRadius: 4,
                  }} />
                </div>
                <Text style={{ color: muted, fontSize: 11, minWidth: 60, textAlign: 'right' }}>{m.count}条</Text>
                <Text style={{ color: yellow, fontSize: 11, minWidth: 60, textAlign: 'right' }}>${m.spend.toFixed(0)}</Text>
              </div>
            ))}
          </div>
        ),
      },
      {
        title: '游戏分布',
        content: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {d.gameBreakdown.map((g) => (
              <div key={g.game} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Text style={{ color: text, fontSize: 12, minWidth: 80 }}>{g.game}</Text>
                <div style={{ flex: 1, background: panelBg, borderRadius: 4, height: 8 }}>
                  <div style={{
                    width: `${Math.min(g.spend / d.totalSpend * 100, 100)}%`,
                    background: green, height: 8, borderRadius: 4,
                  }} />
                </div>
                <Text style={{ color: muted, fontSize: 11, minWidth: 60, textAlign: 'right' }}>{g.count}条</Text>
                <Text style={{ color: yellow, fontSize: 11, minWidth: 60, textAlign: 'right' }}>${g.spend.toFixed(0)}</Text>
              </div>
            ))}
          </div>
        ),
      },
      {
        title: '成长趋势',
        content: (
          <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 8, padding: 16 }}>
            <Row gutter={[16, 12]}>
              <Col span={6}>
                <Text style={{ color: muted, fontSize: 11, display: 'block' }}>头部素材CTR</Text>
                <Text style={{ color: green, fontSize: 18, fontWeight: 600 }}>{(topHalfCtr * 100).toFixed(2)}%</Text>
              </Col>
              <Col span={6}>
                <Text style={{ color: muted, fontSize: 11, display: 'block' }}>尾部素材CTR</Text>
                <Text style={{ color: red, fontSize: 18, fontWeight: 600 }}>{(bottomHalfCtr * 100).toFixed(2)}%</Text>
              </Col>
              <Col span={6}>
                <Text style={{ color: muted, fontSize: 11, display: 'block' }}>趋势方向</Text>
                <Text style={{ color: trendColor, fontSize: 18, fontWeight: 600 }}>{trend}</Text>
              </Col>
              <Col span={6}>
                <Text style={{ color: muted, fontSize: 11, display: 'block' }}>CTR差距</Text>
                <Text style={{ color: text, fontSize: 18, fontWeight: 600 }}>{((topHalfCtr - bottomHalfCtr) * 100).toFixed(2)}%</Text>
              </Col>
            </Row>
          </div>
        ),
      },
      {
        title: '代表性作品 (按花费)',
        content: (
          <Table
            dataSource={top3BySpend}
            rowKey="materialId"
            size="small"
            pagination={false}
            columns={[
              { title: '素材ID', dataIndex: 'materialId', key: 'materialId', render: (v: string) => <Text style={{ color: text, fontSize: 12 }}>{v}</Text> },
              { title: '分类', dataIndex: 'category', key: 'category', render: (v: string) => <Text style={{ color: muted, fontSize: 12 }}>{v}</Text> },
              { title: '花费', dataIndex: 'spend', key: 'spend', render: (v: number) => <Text style={{ color: yellow, fontSize: 12 }}>${v.toFixed(2)}</Text> },
              { title: '展示', dataIndex: 'impressions', key: 'impressions', render: (v: number) => <Text style={{ color: text, fontSize: 12 }}>{(v || 0).toLocaleString()}</Text> },
              { title: 'CTR', dataIndex: 'ctr', key: 'ctr', render: (v: number) => <Text style={{ color: green, fontSize: 12 }}>{(v * 100).toFixed(2)}%</Text> },
            ]}
          />
        ),
      },
    ];
  };

  return (
    <div style={{ padding: 16, background: panelBg, minHeight: '100vh' }}>
      <Title level={4} style={{ color: text, marginBottom: 12 }}>记忆沉淀 · 管理者视角</Title>

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
            <Statistic title={<span style={{ color: muted }}>总素材数</span>} value={summaryStats.materialCount} valueStyle={{ color: blue, fontSize: 20 }} />
          </Card>
        </Col>
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
            <Statistic title={<span style={{ color: muted }}>平均完播率</span>} value={summaryStats.avgPlay100Rate * 100} suffix="%" precision={1} valueStyle={{ color: '#8b5cf6', fontSize: 20 }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 12 } }}>
            <Statistic title={<span style={{ color: muted }}>平均效率评分</span>} value={summaryStats.avgEfficiency} valueStyle={{ color: summaryStats.avgEfficiency >= 60 ? green : red, fontSize: 20 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 16 } }}>
            <Text strong style={{ color: text, fontSize: 14, display: 'block', marginBottom: 12 }}>记忆沉淀 · 管理者反馈</Text>
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              <Row gutter={[12, 8]}>
                {designers.map((d, idx) => {
                  const strengths: string[] = [];
                  const weaknesses: string[] = [];
                  const suggestions: string[] = [];
                  const categories = [...new Set(d.materials.map(m=>m.category).filter(Boolean))];
                  const mediaChannels = d.mediaBreakdown.map(m=>m.media);
                  if (categories.length >= 3) strengths.push(`品类覆盖广(${categories.length}个：${categories.slice(0,3).join('、')})`);
                  else if (categories.length < 2) { weaknesses.push(`品类单一(仅${categories.length}个)`); suggestions.push('拓展新游戏品类积累经验'); }
                  if (mediaChannels.length >= 3) strengths.push(`渠道经验丰富(${mediaChannels.length}个)`);
                  else if (mediaChannels.length < 2) { weaknesses.push(`渠道经验少(${mediaChannels.length}个)`); suggestions.push('尝试新投放渠道'); }
                  if (d.efficiencyScore >= 70) { strengths.push(`标杆设计师(${d.efficiencyScore}分)`); suggestions.push('总结投放方法论，录入知识库供团队学习'); }
                  if (d.materialCount > 50) strengths.push(`素材经验丰富(${d.materialCount}条)`);
                  else if (d.materialCount < 10) { weaknesses.push(`素材量少(${d.materialCount}条)，经验积累不足`); suggestions.push('增加素材产出积累投放数据'); }
                  if (d.avgCtr > 0.012) strengths.push(`CTR能力强(${(d.avgCtr*100).toFixed(2)}%)`);
                  const topGame = categories.length>0 ? categories.sort((a,b)=>d.materials.filter(m=>m.category===b).reduce((s,m)=>s+m.spend,0)-d.materials.filter(m=>m.category===a).reduce((s,m)=>s+m.spend,0))[0] : '';
                  if (topGame) strengths.push(`擅长品类：${topGame}`);
                  if (suggestions.length===0) suggestions.push('继续积累多品类多渠道经验');
                  if (strengths.length===0) strengths.push('持续积累中');
                  if (weaknesses.length===0) weaknesses.push('知识覆盖面良好');
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
              <Text strong style={{ color: text, fontSize: 13 }}>设计师品类经验</Text>
              <Text style={{ color: muted, fontSize: 10, textAlign: 'right', maxWidth: '55%', lineHeight: '14px' }}>各设计师覆盖的游戏品类数量，反映经验广度</Text>
            </div>
            <ReactECharts option={{
              backgroundColor: 'transparent',
              tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0].name}<br/>覆盖品类: ${p[0].value}个` },
              grid: { left: 10, right: 20, top: 4, bottom: 8, containLabel: true },
              xAxis: { type: 'category', data: designers.map(d => d.name), axisLabel: { color: muted, fontSize: 10 }, axisLine: { lineStyle: { color: border } } },
              yAxis: { type: 'value', axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: '#1e293b' } } },
              series: [{ type: 'bar', data: designers.map(d => new Set(d.materials.map(m => m.category).filter(Boolean)).size), barWidth: 20, itemStyle: { color: green, borderRadius: [4, 4, 0, 0] } }]
            }} style={{ height: 220 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: '12px 12px 8px' } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
              <Text strong style={{ color: text, fontSize: 13 }}>渠道专注度</Text>
              <Text style={{ color: muted, fontSize: 10, textAlign: 'right', maxWidth: '55%', lineHeight: '14px' }}>团队在各渠道的素材投放分布，反映渠道经验集中度</Text>
            </div>
            <ReactECharts option={{
              backgroundColor: 'transparent',
              tooltip: { trigger: 'item', formatter: (p: any) => `${p.name}<br/>素材: ${p.value}条 (${p.percent}%)` },
              series: [{ type: 'pie', radius: ['35%', '65%'], center: ['50%', '55%'], data: (() => { const map: Record<string,number> = {}; designers.forEach(d => d.mediaBreakdown.forEach(m => { map[m.media] = (map[m.media]||0) + m.count; })); return Object.entries(map).map(([name,value]) => ({name,value})); })(), label: { color: text, fontSize: 10 }, itemStyle: { borderRadius: 4, borderColor: cardBg, borderWidth: 2 }, color: [blue, green, yellow] }]
            }} style={{ height: 220 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: '12px 12px 8px' } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
              <Text strong style={{ color: text, fontSize: 13 }}>分类花费分布</Text>
              <Text style={{ color: muted, fontSize: 10, textAlign: 'right', maxWidth: '55%', lineHeight: '14px' }}>各游戏品类的花费分布，反映团队擅长领域</Text>
            </div>
            <ReactECharts option={{
              backgroundColor: 'transparent',
              tooltip: { trigger: 'item', formatter: (p: any) => `${p.name}<br/>花费: $${p.value.toFixed(0)} (${p.percent}%)` },
              series: [{
                type: 'pie', radius: ['35%', '65%'], center: ['50%', '55%'],
                data: categoryPieData,
                label: { color: text, fontSize: 10 },
                itemStyle: { borderRadius: 4, borderColor: cardBg, borderWidth: 2 },
                color: [blue, green, yellow, red, purple, '#06b6d4', '#f97316', '#ec4899']
              }]
            }} style={{ height: 220 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: '12px 12px 8px' } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
              <Text strong style={{ color: text, fontSize: 13 }}>经验积累榜</Text>
              <Text style={{ color: muted, fontSize: 10, textAlign: 'right', maxWidth: '55%', lineHeight: '14px' }}>按素材数量和品类覆盖度排名的设计师经验值</Text>
            </div>
            <Table
              dataSource={designers.map(d => ({ name: d.name, materialCount: d.materialCount, categories: [...new Set(d.materials.map(m => m.category).filter(Boolean))].length, channels: d.mediaBreakdown.length, score: d.materialCount + new Set(d.materials.map(m => m.category).filter(Boolean)).size * 10 + d.mediaBreakdown.length * 5 })).sort((a,b) => b.score - a.score)}
              rowKey="name"
              size="small"
              pagination={false}
              scroll={{ y: 224 }}
              columns={[
                { title: '#', key: 'rank', width: 32, render: (_:any, __:any, i:number) => <Tag color={i===0?'gold':i===1?'default':i===2?'orange':'blue'} style={{fontSize:10,margin:0}}>#{i+1}</Tag> },
                { title: '设计师', dataIndex: 'name', key: 'name', render: (v:string) => <Text style={{ color: text, fontSize: 11 }}>{v}</Text> },
                { title: '素材', dataIndex: 'materialCount', key: 'cnt', width: 48, render: (v:number) => <Text style={{ color: blue, fontSize: 11 }}>{v}</Text> },
                { title: '品类', dataIndex: 'categories', key: 'cats', width: 48, render: (v:number) => <Text style={{ color: green, fontSize: 11 }}>{v}个</Text> },
                { title: '渠道', dataIndex: 'channels', key: 'chs', width: 48, render: (v:number) => <Text style={{ color: '#8b5cf6', fontSize: 11 }}>{v}个</Text> },
              ]}
            />
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
