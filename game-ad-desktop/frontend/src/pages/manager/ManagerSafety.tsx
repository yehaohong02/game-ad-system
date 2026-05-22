import { useState, useEffect, useMemo } from 'react';
import { Row, Col, Typography, Tag, Progress, Table, Card, Statistic } from 'antd';
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

const riskColor: Record<string, string> = { low: green, medium: yellow, high: red };
const riskLabel: Record<string, string> = { low: '低风险', medium: '中风险', high: '高风险' };

export default function ManagerSafety() {
  const { designers, refresh, setSelectedDesigner } = useManagerDataStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeDesigner, setActiveDesigner] = useState<DesignerStats | null>(null);

  useEffect(() => { refresh(); }, [refresh]);

  const totalSpend = useMemo(() => designers.reduce((s, d) => s + d.totalSpend, 0), [designers]);

  const summaryStats = useMemo(() => ({
    totalSpend,
    designerCount: designers.length,
    highRiskCount: designers.filter(d => d.riskLevel === 'high').length,
    anomalyCount: designers.reduce((s, d) => s + d.anomalyCount, 0),
    highCpmCount: designers.reduce((s, d) => s + d.highCpmCount, 0),
    lowCtrCount: designers.reduce((s, d) => s + d.lowCtrCount, 0),
  }), [designers, totalSpend]);

  const mediaAnomalyData = useMemo(() => {
    const allMedia = Array.from(new Set(designers.flatMap(d => d.mediaBreakdown.map(m => m.media))));
    return allMedia.map(media => {
      let anomalies = 0, total = 0;
      for (const d of designers) {
        const mats = d.materials.filter((m: any) => m.media === media);
        total += mats.length;
        anomalies += mats.filter((m: any) => m.ctr > 10 || m.ctr < 0.01 || m.cpc > 50 || (m.spend > 0 && m.impressions < 10)).length;
      }
      return { media, total, anomalies, normal: total - anomalies };
    });
  }, [designers]);

  const handleCardClick = (designer: DesignerStats) => {
    setActiveDesigner(designer);
    setSelectedDesigner(designer.name);
    setModalOpen(true);
  };

  const chipStyle = (color: string): React.CSSProperties => ({
    display: 'inline-block', padding: '2px 6px', borderRadius: 4,
    fontSize: 10, color, fontWeight: 500,
  });

  const getCardSections = (d: DesignerStats): CardSection[] => {
    const budgetPct = totalSpend > 0 ? (d.totalSpend / totalSpend * 100) : 0;
    const anomalyRate = d.materialCount > 0 ? (d.anomalyCount / d.materialCount * 100).toFixed(1) : '0';

    const anomalyMaterials = d.materials.filter(m =>
      m.ctr > 10 || m.ctr < 0.01 || m.cpc > 50 || (m.spend > 0 && m.impressions < 10)
    ).map(m => {
      const reasons: string[] = [];
      if (m.ctr > 10) reasons.push('CTR异常高');
      if (m.ctr < 0.01) reasons.push('CTR过低');
      if (m.cpc > 50) reasons.push('CPC异常高');
      if (m.spend > 0 && m.impressions < 10) reasons.push('有花费无展示');
      return { ...m, reasons: reasons.join('、') };
    }).slice(0, 3);

    const highCtrCount = d.materials.filter(m => m.ctr > 10).length;
    const lowCtrCount = d.materials.filter(m => m.ctr < 0.01).length;

    const mediaRisk = d.mediaBreakdown.map(m => {
      const channelMats = d.materials.filter(mat => (mat as any).media === m.media);
      const anomalies = channelMats.filter(mat =>
        mat.ctr > 10 || mat.ctr < 0.01 || mat.cpc > 50 || (mat.spend > 0 && mat.impressions < 10)
      ).length;
      const risk = anomalies >= channelMats.length * 0.3 ? 'high' : anomalies >= channelMats.length * 0.1 ? 'medium' : 'low';
      return { media: m.media, anomalies, risk };
    });

    return [
      {
        title: '预算与风险',
        content: (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            <span style={chipStyle(budgetPct > 30 ? red : blue)}>占比 {budgetPct.toFixed(1)}%</span>
            <span style={chipStyle(riskColor[d.riskLevel])}>{riskLabel[d.riskLevel]}</span>
            <span style={chipStyle(d.anomalyCount > 0 ? red : green)}>异常 {d.anomalyCount}</span>
            <span style={chipStyle(d.highCpmCount > 0 ? yellow : green)}>高CPM {d.highCpmCount}</span>
            <span style={chipStyle(d.lowCtrCount > 0 ? red : green)}>低CTR {d.lowCtrCount}</span>
            <span style={chipStyle(yellow)}>花费 ${d.totalSpend.toFixed(0)}</span>
          </div>
        ),
      },
      {
        title: '异常详情',
        content: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 10, color: muted }}>
            <span>异常数: <b style={{ color: d.anomalyCount > 0 ? red : green }}>{d.anomalyCount}</b></span>
            <span>异常率: <b style={{ color: d.anomalyCount > 0 ? yellow : green }}>{anomalyRate}%</b></span>
            <span>高CTR: <b style={{ color: highCtrCount > 0 ? yellow : green }}>{highCtrCount}</b></span>
            <span>低CTR: <b style={{ color: lowCtrCount > 0 ? red : green }}>{lowCtrCount}</b></span>
          </div>
        ),
      },
      {
        title: 'TOP3异常素材',
        content: anomalyMaterials.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {anomalyMaterials.map(m => (
              <div key={m.materialId} style={{
                display: 'flex', alignItems: 'center', gap: 4, fontSize: 10,
                background: panelBg, borderRadius: 4, padding: '3px 5px',
              }}>
                <Text style={{ color: red, fontSize: 10, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.materialId}</Text>
                <span style={{ color: yellow, whiteSpace: 'nowrap' }}>${m.spend.toFixed(0)}</span>
                <span style={{ color: red, whiteSpace: 'nowrap' }}>{(m.ctr * 100).toFixed(1)}%</span>
                <Tag color="red" style={{ fontSize: 9, margin: 0, padding: '0 3px' }}>{m.reasons}</Tag>
              </div>
            ))}
          </div>
        ) : (
          <span style={{ color: green, fontSize: 10 }}>无异常</span>
        ),
      },
      {
        title: '渠道风险',
        content: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {mediaRisk.map(m => (
              <div key={m.media} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                <span style={{ color: text, flex: 1 }}>{m.media}</span>
                <span style={{ color: m.anomalies > 0 ? red : green }}>异常 {m.anomalies}</span>
                <Tag color={riskColor[m.risk]} style={{ fontSize: 9, margin: 0, padding: '0 3px' }}>{riskLabel[m.risk]}</Tag>
              </div>
            ))}
          </div>
        ),
      },
    ];
  };

  const getModalSections = (d: DesignerStats): DetailSection[] => {
    const budgetPct = totalSpend > 0 ? (d.totalSpend / totalSpend * 100) : 0;

    // Anomaly materials list
    const anomalyMaterials = d.materials.filter(m => {
      return m.ctr > 10 || m.ctr < 0.01 || m.cpc > 50 || (m.spend > 0 && m.impressions < 10);
    }).map(m => {
      const reasons: string[] = [];
      if (m.ctr > 10) reasons.push('CTR异常高');
      if (m.ctr < 0.01) reasons.push('CTR过低');
      if (m.cpc > 50) reasons.push('CPC异常高');
      if (m.spend > 0 && m.impressions < 10) reasons.push('有花费无展示');
      return { ...m, reasons: reasons.join('、') };
    });

    // Per-media risk
    const mediaRisk = d.mediaBreakdown.map(m => {
      const channelMats = d.materials.filter(mat => (mat as any).media === m.media);
      const anomalies = channelMats.filter(mat => mat.ctr > 10 || mat.ctr < 0.01 || mat.cpc > 50 || (mat.spend > 0 && mat.impressions < 10)).length;
      const highCpm = channelMats.filter(mat => (mat.cpm || 0) > 8).length;
      const lowCtr = channelMats.filter(mat => (mat.ctr || 0) < 0.003).length;
      const risk = anomalies >= channelMats.length * 0.3 ? 'high' : anomalies >= channelMats.length * 0.1 ? 'medium' : 'low';
      return { media: m.media, count: m.count, spend: m.spend, anomalies, highCpm, lowCtr, risk };
    });

    // Per-game risk
    const gameRisk = d.gameBreakdown.map(g => {
      const gameMats = d.materials.filter(mat => ((mat as any).game || (mat as any).category) === g.game);
      const anomalies = gameMats.filter(mat => mat.ctr > 10 || mat.ctr < 0.01 || mat.cpc > 50 || (mat.spend > 0 && mat.impressions < 10)).length;
      const highCpm = gameMats.filter(mat => (mat.cpm || 0) > 8).length;
      const risk = anomalies >= gameMats.length * 0.3 ? 'high' : anomalies >= gameMats.length * 0.1 ? 'medium' : 'low';
      return { game: g.game, count: g.count, spend: g.spend, anomalies, highCpm, risk };
    });

    return [
      {
        title: '预算详情',
        content: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 8, padding: 16 }}>
              <Text style={{ color: muted, fontSize: 12, display: 'block', marginBottom: 8 }}>
                预算使用率: {budgetPct.toFixed(1)}% (设计师花费 / 团队总花费)
              </Text>
              <Progress
                percent={Math.min(budgetPct, 100)}
                strokeColor={budgetPct > 30 ? red : budgetPct > 20 ? yellow : green}
                trailColor="#1e293b"
                format={(p) => <span style={{ color: text }}>{p?.toFixed(1)}%</span>}
              />
            </div>

            <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <Text style={{ color: text, fontSize: 14, fontWeight: 500 }}>风险评估</Text>
                <Tag color={riskColor[d.riskLevel]}>{riskLabel[d.riskLevel]}</Tag>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ background: panelBg, borderRadius: 8, padding: '10px 16px', flex: 1 }}>
                  <Text style={{ color: muted, fontSize: 11, display: 'block' }}>异常素材数</Text>
                  <Text style={{ color: d.anomalyCount > 0 ? red : green, fontSize: 20, fontWeight: 600 }}>{d.anomalyCount}</Text>
                </div>
                <div style={{ background: panelBg, borderRadius: 8, padding: '10px 16px', flex: 1 }}>
                  <Text style={{ color: muted, fontSize: 11, display: 'block' }}>总素材数</Text>
                  <Text style={{ color: text, fontSize: 20, fontWeight: 600 }}>{d.materialCount}</Text>
                </div>
                <div style={{ background: panelBg, borderRadius: 8, padding: '10px 16px', flex: 1 }}>
                  <Text style={{ color: muted, fontSize: 11, display: 'block' }}>异常率</Text>
                  <Text style={{ color: d.anomalyCount > 0 ? yellow : green, fontSize: 20, fontWeight: 600 }}>
                    {d.materialCount > 0 ? (d.anomalyCount / d.materialCount * 100).toFixed(1) : 0}%
                  </Text>
                </div>
                <div style={{ background: panelBg, borderRadius: 8, padding: '10px 16px', flex: 1 }}>
                  <Text style={{ color: muted, fontSize: 11, display: 'block' }}>高CPM素材</Text>
                  <Text style={{ color: d.highCpmCount > 0 ? yellow : green, fontSize: 20, fontWeight: 600 }}>{d.highCpmCount}</Text>
                </div>
                <div style={{ background: panelBg, borderRadius: 8, padding: '10px 16px', flex: 1 }}>
                  <Text style={{ color: muted, fontSize: 11, display: 'block' }}>低CTR素材</Text>
                  <Text style={{ color: d.lowCtrCount > 0 ? red : green, fontSize: 20, fontWeight: 600 }}>{d.lowCtrCount}</Text>
                </div>
              </div>
            </div>
          </div>
        ),
      },
      {
        title: '异常素材清单',
        content: anomalyMaterials.length > 0 ? (
          <Table
            dataSource={anomalyMaterials}
            rowKey="materialId"
            size="small"
            pagination={{ pageSize: 5 }}
            columns={[
              { title: '素材ID', dataIndex: 'materialId', key: 'materialId', render: (v: string) => <Text style={{ color: red, fontSize: 12 }}>{v}</Text> },
              { title: '花费', dataIndex: 'spend', key: 'spend', render: (v: number) => <Text style={{ color: yellow, fontSize: 12 }}>${v.toFixed(2)}</Text> },
              { title: 'CTR', dataIndex: 'ctr', key: 'ctr', render: (v: number) => <Text style={{ color: red, fontSize: 12 }}>{(v * 100).toFixed(2)}%</Text> },
              { title: 'CPC', dataIndex: 'cpc', key: 'cpc', render: (v: number) => <Text style={{ color: text, fontSize: 12 }}>${v.toFixed(2)}</Text> },
              { title: '原因', dataIndex: 'reasons', key: 'reasons', render: (v: string) => <Tag color="red" style={{ fontSize: 10 }}>{v}</Tag> },
            ]}
          />
        ) : (
          <Text style={{ color: green, fontSize: 12 }}>无异常素材</Text>
        ),
      },
      {
        title: '渠道风险对比',
        content: (
          <Table
            dataSource={mediaRisk}
            rowKey="media"
            size="small"
            pagination={false}
            columns={[
              { title: '渠道', dataIndex: 'media', key: 'media', render: (v: string) => <Text style={{ color: text, fontSize: 12 }}>{v}</Text> },
              { title: '素材数', dataIndex: 'count', key: 'count', render: (v: number) => <Text style={{ color: blue, fontSize: 12 }}>{v}</Text> },
              { title: '花费', dataIndex: 'spend', key: 'spend', render: (v: number) => <Text style={{ color: yellow, fontSize: 12 }}>${v.toFixed(0)}</Text> },
              { title: '异常数', dataIndex: 'anomalies', key: 'anomalies', render: (v: number) => <Text style={{ color: v > 0 ? red : green, fontSize: 12 }}>{v}</Text> },
              { title: '高CPM', dataIndex: 'highCpm', key: 'highCpm', render: (v: number) => <Text style={{ color: v > 0 ? yellow : green, fontSize: 12 }}>{v}</Text> },
              { title: '低CTR', dataIndex: 'lowCtr', key: 'lowCtr', render: (v: number) => <Text style={{ color: v > 0 ? red : green, fontSize: 12 }}>{v}</Text> },
              {
                title: '风险', dataIndex: 'risk', key: 'risk',
                render: (v: string) => (
                  <Tag color={riskColor[v]} style={{ fontSize: 10 }}>{riskLabel[v]}</Tag>
                ),
              },
            ]}
          />
        ),
      },
      {
        title: '游戏风险对比',
        content: (
          <Table
            dataSource={gameRisk}
            rowKey="game"
            size="small"
            pagination={false}
            columns={[
              { title: '游戏', dataIndex: 'game', key: 'game', render: (v: string) => <Text style={{ color: text, fontSize: 12 }}>{v}</Text> },
              { title: '素材数', dataIndex: 'count', key: 'count', render: (v: number) => <Text style={{ color: blue, fontSize: 12 }}>{v}</Text> },
              { title: '花费', dataIndex: 'spend', key: 'spend', render: (v: number) => <Text style={{ color: yellow, fontSize: 12 }}>${v.toFixed(0)}</Text> },
              { title: '异常数', dataIndex: 'anomalies', key: 'anomalies', render: (v: number) => <Text style={{ color: v > 0 ? red : green, fontSize: 12 }}>{v}</Text> },
              { title: '高CPM', dataIndex: 'highCpm', key: 'highCpm', render: (v: number) => <Text style={{ color: v > 0 ? yellow : green, fontSize: 12 }}>{v}</Text> },
              {
                title: '风险', dataIndex: 'risk', key: 'risk',
                render: (v: string) => (
                  <Tag color={riskColor[v]} style={{ fontSize: 10 }}>{riskLabel[v]}</Tag>
                ),
              },
            ]}
          />
        ),
      },
    ];
  };

  return (
    <div style={{ padding: 16, background: panelBg, minHeight: '100vh' }}>
      <Title level={4} style={{ color: text, marginBottom: 12 }}>安全防护 · 管理者视角</Title>

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
            <Statistic title={<span style={{ color: muted }}>设计师数</span>} value={summaryStats.designerCount} valueStyle={{ color: blue, fontSize: 20 }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 12 } }}>
            <Statistic title={<span style={{ color: muted }}>高风险设计师</span>} value={summaryStats.highRiskCount} valueStyle={{ color: red, fontSize: 20 }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 12 } }}>
            <Statistic title={<span style={{ color: muted }}>异常素材数</span>} value={summaryStats.anomalyCount} valueStyle={{ color: red, fontSize: 20 }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 12 } }}>
            <Statistic title={<span style={{ color: muted }}>高CPM素材</span>} value={summaryStats.highCpmCount} valueStyle={{ color: yellow, fontSize: 20 }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 12 } }}>
            <Statistic title={<span style={{ color: muted }}>低CTR素材</span>} value={summaryStats.lowCtrCount} valueStyle={{ color: red, fontSize: 20 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 16 } }}>
            <Text strong style={{ color: text, fontSize: 14, display: 'block', marginBottom: 12 }}>安全防护 · 管理者反馈</Text>
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              <Row gutter={[12, 8]}>
                {designers.map((d, idx) => {
                  const strengths: string[] = [];
                  const weaknesses: string[] = [];
                  const suggestions: string[] = [];
                  const totalSpendAll = designers.reduce((s,x)=>s+x.totalSpend,0);
                  const pct = totalSpendAll>0 ? d.totalSpend/totalSpendAll*100 : 0;
                  if (d.riskLevel === 'low') strengths.push('安全等级：低风险');
                  else if (d.riskLevel === 'high') { weaknesses.push('安全等级：高风险！'); suggestions.push('触发熔断机制，暂停问题投放'); }
                  if (d.anomalyCount === 0) strengths.push('零异常，数据干净');
                  else { weaknesses.push(`${d.anomalyCount}条异常素材`); suggestions.push('逐条排查异常数据'); }
                  if (d.highCpmCount === 0) strengths.push('无高CPM风险');
                  else { weaknesses.push(`${d.highCpmCount}条高CPM素材(>$8)`); suggestions.push('设置CPM上限预算锁'); }
                  if (d.lowCtrCount === 0) strengths.push('无低CTR风险');
                  else { weaknesses.push(`${d.lowCtrCount}条低CTR素材(<0.3%)`); suggestions.push('暂停低CTR素材，优化创意'); }
                  if (pct > 30) { weaknesses.push(`预算占比过高(${pct.toFixed(1)}%)`); suggestions.push('分散投放预算，降低集中度风险'); }
                  else if (pct < 10 && pct > 0) strengths.push(`预算占比合理(${pct.toFixed(1)}%)`);
                  if (d.materials.filter((m:any)=>m.ctr>10||m.cpc>50).length>0) {
                    weaknesses.push('存在极端异常数据(CTR>100%或CPC>$50)');
                    suggestions.push('检查数据采集管道或广告平台配置');
                  }
                  if (strengths.length === 0) strengths.push('整体安全可控');
                  if (weaknesses.length === 0) weaknesses.push('无安全隐患');
                  if (suggestions.length === 0) suggestions.push('安全状态良好，继续保持');
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
              <Text strong style={{ color: text, fontSize: 13 }}>风险等级分布</Text>
              <Text style={{ color: muted, fontSize: 10, textAlign: 'right', maxWidth: '55%', lineHeight: '14px' }}>各风险等级的设计师人数分布，反映团队整体安全状态</Text>
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
              <Text strong style={{ color: text, fontSize: 13 }}>异常素材数对比</Text>
              <Text style={{ color: muted, fontSize: 10, textAlign: 'right', maxWidth: '55%', lineHeight: '14px' }}>各设计师异常数/高CPM/低CTR素材的对比，定位问题来源</Text>
            </div>
            <ReactECharts option={{
              backgroundColor: 'transparent',
              tooltip: { trigger: 'axis' },
              grid: { left: 10, right: 20, top: 4, bottom: 8, containLabel: true },
              xAxis: { type: 'category', data: designers.map(d => d.name), axisLabel: { color: muted, fontSize: 10 }, axisLine: { lineStyle: { color: border } } },
              yAxis: { type: 'value', axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: '#1e293b' } } },
              series: [
                { name: '异常数', type: 'bar', data: designers.map(d => d.anomalyCount), barWidth: 16, itemStyle: { color: red } },
                { name: '高CPM', type: 'bar', data: designers.map(d => d.highCpmCount), barWidth: 16, itemStyle: { color: yellow } },
                { name: '低CTR', type: 'bar', data: designers.map(d => d.lowCtrCount), barWidth: 16, itemStyle: { color: '#f97316' } },
              ]
            }} style={{ height: 220 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: '12px 12px 8px' } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
              <Text strong style={{ color: text, fontSize: 13 }}>预算占比分布</Text>
              <Text style={{ color: muted, fontSize: 10, textAlign: 'right', maxWidth: '55%', lineHeight: '14px' }}>各设计师花费占团队总预算的比例，识别预算集中风险</Text>
            </div>
            <ReactECharts option={{
              backgroundColor: 'transparent',
              tooltip: { trigger: 'item', formatter: (p: any) => `${p.name}<br/>花费: $${p.value.toFixed(0)} (${p.percent}%)` },
              series: [{
                type: 'pie', radius: ['35%', '65%'], center: ['50%', '55%'],
                data: designers.map(d => ({ name: d.name, value: d.totalSpend })),
                label: { color: text, fontSize: 10 },
                itemStyle: { borderRadius: 4, borderColor: cardBg, borderWidth: 2 },
                color: [blue, green, yellow, red, '#8b5cf6', '#06b6d4', '#f97316']
              }]
            }} style={{ height: 220 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: '12px 12px 8px' } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
              <Text strong style={{ color: text, fontSize: 13 }}>渠道异常分布</Text>
              <Text style={{ color: muted, fontSize: 10, textAlign: 'right', maxWidth: '55%', lineHeight: '14px' }}>各广告渠道的正常/异常素材比例，识别高风险渠道</Text>
            </div>
            <ReactECharts option={{
              backgroundColor: 'transparent',
              tooltip: { trigger: 'axis' },
              legend: { data: ['正常', '异常'], textStyle: { color: muted, fontSize: 10 }, top: 0, right: 10 },
              grid: { left: 10, right: 20, top: 4, bottom: 8, containLabel: true },
              xAxis: { type: 'category', data: mediaAnomalyData.map(m => m.media), axisLabel: { color: muted, fontSize: 10 }, axisLine: { lineStyle: { color: border } } },
              yAxis: { type: 'value', axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: '#1e293b' } } },
              series: [
                { name: '正常', type: 'bar', stack: 'total', data: mediaAnomalyData.map(m => m.normal), itemStyle: { color: green } },
                { name: '异常', type: 'bar', stack: 'total', data: mediaAnomalyData.map(m => m.anomalies), barWidth: 24, itemStyle: { color: red, borderRadius: [4, 4, 0, 0] } },
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
