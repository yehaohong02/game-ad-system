import { useMemo, useState } from 'react';
import { Row, Col, Card, Tag, Typography, Button, Input, Space, Divider, Table } from 'antd';
import {
  EditOutlined, CheckOutlined,
  AimOutlined, PlayCircleOutlined, WarningOutlined,
  BarChartOutlined, TrophyOutlined,
  CloseCircleOutlined, ExclamationCircleOutlined, StarOutlined,
  PieChartOutlined, RadarChartOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useMaterialDataStore } from '../stores/materialData';

const { Text } = Typography;

const panelBg = '#1E293B';
const border = '#334155';
const darkBg = '#0f172a';
const cardBg2 = '#1a2332';
const green = '#10b981';
const red = '#ef4444';
const yellow = '#f59e0b';
const blue = '#3b82f6';
const purple = '#8b5cf6';
const orange = '#f97316';
const cyan = '#06b6d4';

const fmtMoney = (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(1)}K` : `$${v.toFixed(2)}`;
const fmtNum = (v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(2)}M` : v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toFixed(0);
const fmtPct = (v: number) => `${(v * 100).toFixed(2)}%`;

function EvalDot({ color, text }: { color: string; text: string }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />{text}</span>;
}

export default function Dashboard() {
  const [title, setTitle] = useState(() => localStorage.getItem('dashboard_title') || '5月设计师数据诊断报告');
  const [editingTitle, setEditingTitle] = useState(false);
  const materialData = useMaterialDataStore(s => s.data);
  const data: any[] = useMemo(() => {
    const rows = materialData.filter(r => r.spend > 0);
    return rows.filter(r => r.category && r.category !== '');
  }, [materialData]);

  const m = useMemo(() => {
    const totalSpend = data.reduce((s, r) => s + r.spend, 0);
    const totalImp = data.reduce((s, r) => s + r.impressions, 0);
    const totalClicks = data.reduce((s, r) => s + r.clicks, 0);
    const withPlay = data.filter(r => r.playCount > 0);
    const totalPlayWP = withPlay.reduce((s, r) => s + r.playCount, 0);
    const total2s = withPlay.reduce((s, r) => s + r.play2s, 0);
    const total6s = withPlay.reduce((s, r) => s + r.play6s, 0);
    const total25 = withPlay.reduce((s, r) => s + r.play25, 0);
    const total100 = withPlay.reduce((s, r) => s + r.play100, 0);
    return {
      totalSpend, totalImp, totalClicks,
      avgCpm: totalImp > 0 ? totalSpend / totalImp * 1000 : 0,
      avgCtr: totalImp > 0 ? totalClicks / totalImp : 0,
      avgCpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
      rate2s: totalPlayWP > 0 ? total2s / totalPlayWP : 0,
      rate6s: totalPlayWP > 0 ? total6s / totalPlayWP : 0,
      rate25: totalPlayWP > 0 ? total25 / totalPlayWP : 0,
      rate100: totalPlayWP > 0 ? total100 / totalPlayWP : 0,
      count: data.length,
      withPlayCount: withPlay.length,
      zeroPlayCount: data.filter(r => r.playCount === 0).length,
      totalPlayWP, total2s, total6s, total25, total100,
    };
  }, [data]);

  const categoryData = useMemo(() => {
    const map: Record<string, any> = {};
    data.forEach(r => {
      const cat = r.category || '未知';
      if (!map[cat]) map[cat] = { spend: 0, count: 0, imp: 0, clicks: 0, play: 0, play2s: 0, play25: 0, play100: 0 };
      const c = map[cat];
      c.spend += r.spend; c.count++; c.imp += r.impressions; c.clicks += r.clicks;
      c.play += r.playCount; c.play2s += r.play2s; c.play25 += r.play25; c.play100 += r.play100;
    });
    return Object.entries(map).map(([cat, v]) => ({
      category: cat, ...v,
      ctr: v.imp > 0 ? v.clicks / v.imp : 0,
      rate2s: v.play > 0 ? v.play2s / v.play : 0,
      rate25: v.play > 0 ? v.play25 / v.play : 0,
      rate100: v.play > 0 ? v.play100 / v.play : 0,
    })).sort((a, b) => b.spend - a.spend);
  }, [data]);

  const analysis = useMemo(() => {
    const highCtr = data.filter(r => r.ctr > 0.015).sort((a, b) => b.ctr - a.ctr);
    const lowCtr = data.filter(r => r.ctr > 0 && r.ctr < 0.003);
    const zeroPlay = data.filter(r => r.playCount === 0);
    const withPlay = data.filter(r => r.playCount > 0);
    const highCompletion = withPlay.map(r => ({ ...r, rate: r.play100 / r.playCount })).filter(r => r.rate > 0.03).sort((a, b) => b.rate - a.rate);
    return { highCtr, lowCtr, zeroPlay, highCompletion };
  }, [data]);

  const strengths = useMemo(() => {
    const items: { title: string; points: string[] }[] = [];
    if (m.avgCpm < 8 && m.avgCpc < 1) items.push({ title: '成本控制优秀', points: [`CPM $${m.avgCpm.toFixed(2)}、CPC $${m.avgCpc.toFixed(2)} 均处于行业低位，获量性价比高`, `总花费 ${fmtMoney(m.totalSpend)} 获得 ${fmtNum(m.totalImp)} 次展示`] });
    if (analysis.highCtr.length > 0) items.push({ title: `${analysis.highCtr.length} 条素材 CTR > 1.5%`, points: analysis.highCtr.slice(0, 3).map(r => `素材 ${r.materialId}：CTR ${fmtPct(r.ctr)}，花费 ${fmtMoney(r.spend)}`) });
    if (analysis.highCompletion.length > 0) items.push({ title: '存在高完播率素材', points: analysis.highCompletion.slice(0, 2).map(r => `素材 ${r.materialId}：完播率 ${fmtPct(r.rate)}`) });
    if (categoryData.length > 0 && categoryData[0].spend > m.totalSpend * 0.6) items.push({ title: '主力品类聚焦明确', points: [`「${categoryData[0].category}」占比 ${(categoryData[0].spend / m.totalSpend * 100).toFixed(0)}%，${categoryData[0].count} 条素材`] });
    return items;
  }, [m, analysis, categoryData]);

  const weaknesses = useMemo(() => {
    const items: { title: string; points: string[]; danger: boolean }[] = [];
    if (m.avgCtr < 0.01) items.push({ danger: true, title: '点击率普遍偏低', points: [`整体 CTR ${fmtPct(m.avgCtr)}，远低于行业均值 1%-2%`, `${analysis.lowCtr.length} 条素材 CTR < 0.3%，合计浪费 $${analysis.lowCtr.reduce((s, r) => s + r.spend, 0).toFixed(0)}`] });
    if (m.rate2s < 0.05 || m.rate6s < 0.03) items.push({ danger: true, title: '前6秒流失极其严重', points: [`2s播放率 ${fmtPct(m.rate2s)}，6s播放率 ${fmtPct(m.rate6s)} — 超过 97% 用户在前6秒划走`, `原因：视频开场无悬念/冲突/视觉冲击，首帧可能为静态图`] });
    if (m.rate100 < 0.02) items.push({ danger: true, title: '完播率极低', points: [`100%完播率仅 ${fmtPct(m.rate100)}，内容缺乏持续吸引力`] });
    if (analysis.zeroPlay.length > 10) items.push({ danger: false, title: `${analysis.zeroPlay.length} 条素材无播放数据`, points: [`占比 ${(analysis.zeroPlay.length / m.count * 100).toFixed(0)}%，可能为图片素材或投放未生效，建议清理`] });
    const weakCats = categoryData.filter(c => c.ctr < 0.005 && c.spend > 100);
    if (weakCats.length > 0) items.push({ danger: false, title: '部分品类表现落后', points: weakCats.map(c => `「${c.category}」CTR ${fmtPct(c.ctr)}，花费 ${fmtMoney(c.spend)}（${c.count}条）`) });
    return items;
  }, [m, analysis, categoryData]);

  const recommendations = useMemo(() => {
    const r: { priority: 'high' | 'medium' | 'low'; title: string; action: string }[] = [];
    if (m.rate2s < 0.05) r.push({ priority: 'high', title: '重构前3-6秒开场钩子', action: '加入冲突/悬念/福利；禁止Logo/黑屏/静态开场；每2-3秒切换画面，建立前6秒节奏' });
    if (m.avgCtr < 0.01) r.push({ priority: 'high', title: '强化点击诱导设计', action: '结尾加「点击下载」「免费领SSR」动态按钮+箭头+语音三重引导，提升CTR至1%以上' });
    if (analysis.zeroPlay.length > 5) r.push({ priority: 'high', title: '清理无效素材止损', action: `暂停 ${analysis.zeroPlay.length} 条无播放素材，将预算转移至高效素材` });
    if (m.rate100 < 0.03) r.push({ priority: 'medium', title: '提升内容密度与视频节奏', action: '视频控制在15-30秒，每3-5秒切换画面，使用快节奏剪辑+特效字幕+语音解说' });
    const weakCats = categoryData.filter(c => c.ctr < 0.005 && c.spend > 100);
    if (weakCats.length > 0) r.push({ priority: 'medium', title: '弱品类差异化优化', action: '非主品类暂停投放或更换创意风格、脚本方向，集中资源到主力品类' });
    r.push({ priority: 'low', title: '建立结构化A/B测试', action: '对开场方式、结尾号召、视频长度三维度系统测试，每次≥5000展示后判断结果' });
    if (analysis.highCtr.length > 0) r.push({ priority: 'low', title: '放大高CTR素材预算', action: `TOP3 素材（${analysis.highCtr.slice(0, 3).map(r => r.materialId).join('、')}）追加 20-50% 预算` });
    return r;
  }, [m, analysis, categoryData]);

  const summaryTable = useMemo(() => [
    { key: '1', dim: '成本控制', rating: m.avgCpm < 8 ? '✅ 优秀' : m.avgCpm < 12 ? '⚠️ 一般' : '❌ 偏高', p: '保持', pc: green },
    { key: '2', dim: '点击率(CTR)', rating: m.avgCtr > 0.01 ? '✅ 良好' : m.avgCtr > 0.005 ? '⚠️ 偏低' : '❌ 极低', p: m.avgCtr > 0.01 ? '保持' : '高', pc: m.avgCtr > 0.01 ? green : red },
    { key: '3', dim: '前6秒留存', rating: m.rate6s > 0.08 ? '✅ 良好' : m.rate6s > 0.03 ? '⚠️ 一般' : '❌ 极低', p: m.rate6s > 0.08 ? '保持' : '最高', pc: m.rate6s > 0.08 ? green : red },
    { key: '4', dim: '完播率', rating: m.rate100 > 0.03 ? '✅ 良好' : m.rate100 > 0.01 ? '⚠️ 偏低' : '❌ 极低', p: m.rate100 > 0.03 ? '保持' : '高', pc: m.rate100 > 0.03 ? green : red },
    { key: '5', dim: '品类差异化', rating: categoryData.length >= 3 ? '✅ 覆盖广' : '⚠️ 偏弱', p: categoryData.length >= 3 ? '保持' : '中', pc: categoryData.length >= 3 ? green : yellow },
    { key: '6', dim: '素材清理', rating: analysis.zeroPlay.length < 10 ? '✅ 健康' : analysis.zeroPlay.length < 30 ? '⚠️ 不足' : '❌ 待清理', p: analysis.zeroPlay.length < 10 ? '保持' : '中', pc: analysis.zeroPlay.length < 10 ? green : yellow },
  ], [m, categoryData, analysis]);

  const conclusion = useMemo(() => {
    const g: string[] = [], b: string[] = [];
    if (m.avgCpm < 8) g.push('成本控制');
    if (analysis.highCtr.length > 0) g.push('部分CTR表现');
    if (m.avgCtr < 0.01) b.push('点击率偏低');
    if (m.rate6s < 0.03) b.push('前6秒流失严重');
    if (m.rate100 < 0.02) b.push('完播率极低');
    const gs = g.length ? `在${g.join('、')}上表现良好` : '';
    const bs = b.length ? `但${b.join('、')}，需重点优化` : '';
    return gs ? `${gs}，${bs}` : bs.replace('但', '');
  }, [m, analysis]);

  // Charts
  const categoryChart = useMemo(() => {
    const top = categoryData.slice(0, 8);
    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' as const, axisPointer: { type: 'shadow' as const } },
      grid: { left: 110, right: 10, top: 5, bottom: 5 },
      xAxis: { type: 'value' as const, axisLabel: { color: '#94a3b8', fontSize: 11, formatter: (v: number) => `$${(v / 1000).toFixed(0)}K` }, splitLine: { lineStyle: { color: '#1e293b' } } },
      yAxis: { type: 'category' as const, data: top.map(e => e.category).reverse(), axisLabel: { color: '#e2e8f0', fontSize: 11 } },
      series: [{ type: 'bar', data: top.map(e => e.spend).reverse(), barWidth: 12, itemStyle: { borderRadius: [0, 3, 3, 0], color: (p: any) => [blue, cyan, purple, orange, yellow, green, '#818cf8', '#a5b4fc'][p.dataIndex % 8] } }],
    };
  }, [categoryData]);

  const funnelChart = useMemo(() => {
    const fields = ['playCount', 'play2s', 'play6s', 'play25', 'play50', 'play75', 'play100'] as const;
    const labels = ['总播放', '2s', '6s', '25%', '50%', '75%', '100%'];
    const totals = fields.map(f => data.filter(r => r.playCount > 0).reduce((s, r) => s + (r[f] || 0), 0));
    const gc = [purple, '#818cf8', '#a5b4fc', blue, '#60a5fa', '#93c5fd', green];
    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' as const },
      grid: { left: 45, right: 10, top: 5, bottom: 20 },
      xAxis: { type: 'category' as const, data: labels, axisLabel: { color: '#94a3b8', fontSize: 11, rotate: 15 } },
      yAxis: { type: 'value' as const, axisLabel: { color: '#94a3b8', fontSize: 11, formatter: (v: number) => `${(v / 10000).toFixed(0)}万` }, splitLine: { lineStyle: { color: '#1e293b' } } },
      series: [{ type: 'bar', data: totals, barWidth: 18, itemStyle: { borderRadius: [3, 3, 0, 0], color: (p: any) => gc[p.dataIndex] }, label: { show: true, position: 'top' as const, color: '#94a3b8', fontSize: 11, formatter: (p: any) => `${(p.value / 10000).toFixed(1)}万` } }],
    };
  }, [data]);

  const scatterChart = useMemo(() => {
    const pts = data.filter(r => r.ctr > 0 && r.cpm > 0).map(r => [r.cpm, r.ctr, r.spend, r.materialId, r.playCount > 0 ? 1 : 0]);
    return {
      backgroundColor: 'transparent',
      tooltip: { formatter: (p: any) => { const d = p.data; return `<b>${d[3]}</b><br/>CPM: $${d[0].toFixed(2)}<br/>CTR: ${(d[1] * 100).toFixed(2)}%<br/>花费: ${fmtMoney(d[2])}<br/>${d[4] ? '有播放' : '无播放'}`; } },
      grid: { left: 50, right: 10, top: 20, bottom: 30 },
      xAxis: { name: 'CPM', nameTextStyle: { color: '#64748b', fontSize: 12 }, type: 'value' as const, axisLabel: { color: '#94a3b8', fontSize: 11 }, splitLine: { lineStyle: { color: '#1e293b' } } },
      yAxis: { name: 'CTR', nameTextStyle: { color: '#64748b', fontSize: 12 }, type: 'value' as const, axisLabel: { color: '#94a3b8', fontSize: 11, formatter: (v: number) => `${(v * 100).toFixed(1)}%` }, splitLine: { lineStyle: { color: '#1e293b' } } },
      legend: { data: ['有播放', '无播放'], textStyle: { color: '#94a3b8', fontSize: 12 }, top: 0, right: 0 },
      series: [
        { type: 'scatter', data: pts.filter(p => p[4] === 1), symbolSize: (d: any) => Math.max(3, Math.sqrt(d[2]) / 6), itemStyle: { color: green, opacity: 0.7 }, name: '有播放' },
        { type: 'scatter', data: pts.filter(p => p[4] === 0), symbolSize: (d: any) => Math.max(3, Math.sqrt(d[2]) / 6), itemStyle: { color: '#64748b', opacity: 0.4 }, name: '无播放' },
      ],
    };
  }, [data]);

  const completionChart = useMemo(() => {
    const cats = categoryData.filter(c => c.play > 0).slice(0, 6);
    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' as const },
      legend: { data: ['2s播放率', '25%播放率', '100%完播率'], textStyle: { color: '#94a3b8', fontSize: 12 }, top: 0 },
      grid: { left: 110, right: 10, top: 30, bottom: 5 },
      xAxis: { type: 'value' as const, max: 1, axisLabel: { color: '#94a3b8', fontSize: 11, formatter: (v: number) => `${(v * 100).toFixed(0)}%` }, splitLine: { lineStyle: { color: '#1e293b' } } },
      yAxis: { type: 'category' as const, data: cats.map(c => c.category).reverse(), axisLabel: { color: '#e2e8f0', fontSize: 11 } },
      series: [
        { name: '2s播放率', type: 'bar', data: cats.map(c => c.rate2s).reverse(), barWidth: 6, itemStyle: { color: purple, borderRadius: [0, 2, 2, 0] } },
        { name: '25%播放率', type: 'bar', data: cats.map(c => c.rate25).reverse(), barWidth: 6, itemStyle: { color: blue, borderRadius: [0, 2, 2, 0] } },
        { name: '100%完播率', type: 'bar', data: cats.map(c => c.rate100).reverse(), barWidth: 6, itemStyle: { color: green, borderRadius: [0, 2, 2, 0] } },
      ],
    };
  }, [categoryData]);

  const priConf: Record<string, { color: string; bg: string }> = { high: { color: red, bg: `${red}15` }, medium: { color: yellow, bg: `${yellow}15` }, low: { color: blue, bg: `${blue}15` } };

  return (
    <div style={{ padding: '8px', background: darkBg, minHeight: '100vh' }}>
      {/* ===== Header ===== */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '8px 16px', background: panelBg, borderRadius: 8, border: `1px solid ${border}` }}>
        <RadarChartOutlined style={{ color: blue, fontSize: 20 }} />
        {editingTitle ? (
          <Space size={4}>
            <Input value={title} onChange={e => setTitle(e.target.value)} onPressEnter={() => { setEditingTitle(false); localStorage.setItem('dashboard_title', title); }} style={{ background: '#0f172a', border: `1px solid ${blue}`, color: '#e2e8f0', fontSize: 18, fontWeight: 700, width: 300 }} />
            <Button type="primary" icon={<CheckOutlined />} size="small" onClick={() => { setEditingTitle(false); localStorage.setItem('dashboard_title', title); }} />
          </Space>
        ) : (
          <Space size={4}>
            <span style={{ color: '#f1f5f9', fontSize: 18, fontWeight: 700 }}>{title}</span>
            <Button type="text" icon={<EditOutlined />} size="small" style={{ color: '#64748b' }} onClick={() => setEditingTitle(true)} />
          </Space>
        )}
        <div style={{ flex: 1 }} />
        <Tag color="blue" style={{ fontSize: 12, margin: 0 }}>{data.length} 条素材</Tag>
        <Tag color="purple" style={{ fontSize: 12, margin: 0 }}>{categoryData.length} 个品类</Tag>
        <Tag color={m.zeroPlayCount > 20 ? 'red' : 'orange'} style={{ fontSize: 12, margin: 0 }}>{m.withPlayCount} 条有播放</Tag>
      </div>

      {/* ===== Section 1: 整体表现概览 + 总结评估 融合 ===== */}
      <Card
        style={{ background: panelBg, border: `1px solid ${border}`, marginBottom: 8 }}
        styles={{ body: { padding: '12px 16px' } }}
        title={<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><BarChartOutlined style={{ color: blue, fontSize: 16 }} /><span style={{ color: '#f1f5f9', fontSize: 15, fontWeight: 600 }}>整体表现概览 &amp; 总结评估</span></div>}
      >
        {/* Metrics row: 9 compact chips in one row */}
        <Row gutter={[6, 6]}>
          {[
            { l: '总花费', v: fmtMoney(m.totalSpend), e: m.totalSpend > 30000 ? '高预算' : m.totalSpend > 10000 ? '中等' : '低预算', ec: m.totalSpend > 30000 ? orange : m.totalSpend > 10000 ? blue : '#94a3b8' },
            { l: '展示数', v: fmtNum(m.totalImp), e: m.totalImp > 5000000 ? '充足' : m.totalImp > 2000000 ? '尚可' : '偏低', ec: m.totalImp > 5000000 ? green : m.totalImp > 2000000 ? blue : yellow },
            { l: 'CPM', v: `$${m.avgCpm.toFixed(2)}`, e: m.avgCpm < 5 ? '优秀' : m.avgCpm < 8 ? '较好' : m.avgCpm < 12 ? '正常' : '偏高', ec: m.avgCpm < 5 ? green : m.avgCpm < 8 ? green : m.avgCpm < 12 ? blue : red },
            { l: 'CTR', v: fmtPct(m.avgCtr), e: m.avgCtr > 0.02 ? '优秀' : m.avgCtr > 0.01 ? '良好' : m.avgCtr > 0.005 ? '偏低' : '极低', ec: m.avgCtr > 0.02 ? green : m.avgCtr > 0.01 ? blue : m.avgCtr > 0.005 ? yellow : red },
            { l: 'CPC', v: `$${m.avgCpc.toFixed(2)}`, e: m.avgCpc < 0.5 ? '性价比高' : m.avgCpc < 1 ? '偏低' : m.avgCpc < 2 ? '正常' : '偏高', ec: m.avgCpc < 0.5 ? green : m.avgCpc < 1 ? green : m.avgCpc < 2 ? blue : yellow },
            { l: '2s播放率', v: fmtPct(m.rate2s), e: m.rate2s > 0.15 ? '良好' : m.rate2s > 0.08 ? '一般' : '极低', ec: m.rate2s > 0.15 ? green : m.rate2s > 0.08 ? yellow : red },
            { l: '6s播放率', v: fmtPct(m.rate6s), e: m.rate6s > 0.1 ? '良好' : m.rate6s > 0.05 ? '一般' : '极低', ec: m.rate6s > 0.1 ? green : m.rate6s > 0.05 ? yellow : red },
            { l: '25%播放率', v: fmtPct(m.rate25), e: m.rate25 > 0.25 ? '优秀' : m.rate25 > 0.15 ? '良好' : '一般', ec: m.rate25 > 0.25 ? green : m.rate25 > 0.15 ? blue : yellow },
            { l: '完播率', v: fmtPct(m.rate100), e: m.rate100 > 0.05 ? '优秀' : m.rate100 > 0.02 ? '良好' : m.rate100 > 0.01 ? '偏低' : '极低', ec: m.rate100 > 0.05 ? green : m.rate100 > 0.02 ? blue : m.rate100 > 0.01 ? yellow : red },
          ].map((c, i) => (
            <Col span={Math.floor(24 / 9)} key={i} style={{ flex: '0 0 11.11%' }}>
              <div style={{ background: cardBg2, borderRadius: 6, padding: '8px 10px', border: `1px solid ${border}`, height: '100%' }}>
                <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 3 }}>{c.l}</div>
                <div style={{ color: '#f1f5f9', fontSize: 18, fontWeight: 700, marginBottom: 3 }}>{c.v}</div>
                <EvalDot color={c.ec} text={c.e} />
              </div>
            </Col>
          ))}
        </Row>

        <Divider style={{ margin: '10px 0', borderColor: border }} />

        {/* Summary table + conclusion 融合 */}
        <Row gutter={12}>
          <Col span={9}>
            <Table
              dataSource={summaryTable}
              columns={[
                { title: '维度', dataIndex: 'dim', width: 100, render: (v: string) => <Text style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 500 }}>{v}</Text> },
                { title: '评价', dataIndex: 'rating', width: 80, render: (v: string) => <Text style={{ color: '#94a3b8', fontSize: 13 }}>{v}</Text> },
                { title: '优先级', dataIndex: 'p', width: 70, render: (v: string, r: any) => <Tag color={r.pc === green ? 'green' : r.pc === red ? 'red' : 'gold'} style={{ fontSize: 12, margin: 0 }}>{v}</Tag> },
              ]}
              pagination={false} size="small" rowKey="key"
            />
          </Col>
          <Col span={15}>
            <div style={{ background: cardBg2, borderRadius: 6, padding: '12px 14px', borderLeft: `3px solid ${blue}`, height: '100%' }}>
              <div style={{ color: '#64748b', fontSize: 12, marginBottom: 8 }}>诊断结论</div>
              <div style={{ color: '#e2e8f0', fontSize: 14, lineHeight: '22px', fontWeight: 500 }}>{conclusion}</div>
              <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 6 }}>该设计师在成本控制上表现优秀，但素材吸引力严重不足，尤其是前6秒流失率极高。<b style={{ color: yellow }}>优先优化视频开场钩子与点击诱导</b>，是提升ROI的关键。</div>
              <Divider style={{ margin: '10px 0', borderColor: border }} />
              <div style={{ color: '#64748b', fontSize: 12, marginBottom: 8 }}>优化建议</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {recommendations.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <span style={{ color: priConf[r.priority].color, fontSize: 11, fontWeight: 800, background: priConf[r.priority].bg, padding: '2px 6px', borderRadius: 3, flexShrink: 0, marginTop: 1 }}>{r.priority === 'high' ? 'P0' : r.priority === 'medium' ? 'P1' : 'P2'}</span>
                    <div style={{ color: '#94a3b8', fontSize: 12, lineHeight: '18px' }}><b style={{ color: '#e2e8f0' }}>{r.title}</b>：{r.action}</div>
                  </div>
                ))}
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* ===== Section 2: 优势分析 ===== */}
      <Card
        title={<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><TrophyOutlined style={{ color: green, fontSize: 16 }} /><span style={{ color: '#f1f5f9', fontSize: 15, fontWeight: 600 }}>优势分析</span></div>}
        style={{ background: panelBg, border: `1px solid ${border}`, marginBottom: 8 }}
        styles={{ body: { padding: '8px 12px' } }}
      >
        <Row gutter={8}>
          {strengths.map((s, i) => (
            <Col span={Math.max(6, Math.floor(24 / strengths.length))} key={i}>
              <div style={{ background: cardBg2, borderRadius: 6, borderLeft: `3px solid ${green}`, padding: '10px 12px', height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <StarOutlined style={{ color: green, fontSize: 14 }} />
                  <Text strong style={{ color: '#f1f5f9', fontSize: 13 }}>{s.title}</Text>
                </div>
                <ul style={{ margin: 0, paddingLeft: 16, color: '#94a3b8', fontSize: 12, lineHeight: '20px' }}>
                  {s.points.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* ===== Section 3: 劣势分析 ===== */}
      <Card
        title={<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ExclamationCircleOutlined style={{ color: red, fontSize: 16 }} /><span style={{ color: '#f1f5f9', fontSize: 15, fontWeight: 600 }}>劣势分析</span></div>}
        style={{ background: panelBg, border: `1px solid ${border}`, marginBottom: 8 }}
        styles={{ body: { padding: '8px 12px' } }}
      >
        <Row gutter={8}>
          {weaknesses.map((w, i) => (
            <Col span={Math.max(6, Math.floor(24 / weaknesses.length))} key={i}>
              <div style={{ background: cardBg2, borderRadius: 6, borderLeft: `3px solid ${w.danger ? red : yellow}`, padding: '10px 12px', height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  {w.danger ? <CloseCircleOutlined style={{ color: red, fontSize: 14 }} /> : <WarningOutlined style={{ color: yellow, fontSize: 14 }} />}
                  <Text strong style={{ color: '#f1f5f9', fontSize: 13 }}>{w.title}</Text>
                </div>
                <ul style={{ margin: 0, paddingLeft: 16, color: '#94a3b8', fontSize: 12, lineHeight: '20px' }}>
                  {w.points.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* ===== Charts: 2x2 ===== */}
      <Row gutter={8} style={{ marginBottom: 8 }}>
        <Col span={12}>
          <Card title={<span style={{ color: '#f1f5f9', fontSize: 14 }}><PieChartOutlined style={{ color: blue }} /> 品类花费分布</span>} style={{ background: panelBg, border: `1px solid ${border}` }} styles={{ body: { padding: '6px 10px' } }}>
            <ReactECharts option={categoryChart} style={{ height: 200 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title={<span style={{ color: '#f1f5f9', fontSize: 14 }}><PlayCircleOutlined style={{ color: purple }} /> 视频播放漏斗</span>} style={{ background: panelBg, border: `1px solid ${border}` }} styles={{ body: { padding: '6px 10px' } }}>
            <ReactECharts option={funnelChart} style={{ height: 200 }} />
          </Card>
        </Col>
      </Row>
      <Row gutter={8}>
        <Col span={12}>
          <Card title={<span style={{ color: '#f1f5f9', fontSize: 14 }}><AimOutlined style={{ color: green }} /> CTR × CPM 素材分布</span>} style={{ background: panelBg, border: `1px solid ${border}` }} styles={{ body: { padding: '6px 10px' } }}>
            <ReactECharts option={scatterChart} style={{ height: 220 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card title={<span style={{ color: '#f1f5f9', fontSize: 14 }}><TrophyOutlined style={{ color: cyan }} /> 品类播放留存对比</span>} style={{ background: panelBg, border: `1px solid ${border}` }} styles={{ body: { padding: '6px 10px' } }}>
            <ReactECharts option={completionChart} style={{ height: 220 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
