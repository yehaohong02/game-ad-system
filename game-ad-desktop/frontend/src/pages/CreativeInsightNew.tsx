import {
  Card, Row, Col, Button, Tag, Image, Typography, Modal, Tooltip,
} from 'antd';
import {
 RocketOutlined, FireOutlined, ArrowUpOutlined, ArrowDownOutlined,
  EyeOutlined, ThunderboltOutlined, AimOutlined,
  CheckCircleOutlined, FileTextOutlined,
  BarChartOutlined, PlayCircleOutlined, StarOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import {
  useCreativeInsightStore,
  TrendItem, CreativeAnalysis, OptimizationSuggestion, FormulaWithData,
} from '../stores/creativeInsightNew';
import { useMaterialDataStore } from '../stores/materialData';

const { Text } = Typography;

const cardBg = '#1E293B';
const border = '#334155';
const darkBg = '#0f172a';
const green = '#10b981';
const red = '#ef4444';
const yellow = '#f59e0b';
const blue = '#3b82f6';
const purple = '#8b5cf6';
const textPrimary = '#E2E8F0';
const textSecondary = '#94A3B8';
const textMuted = '#64748b';

const statusConfig = {
  excellent: { bg: '#10B98120', color: green, label: '优秀' },
  good: { bg: '#3B82F620', color: blue, label: '良好' },
  average: { bg: '#F59E0B20', color: yellow, label: '一般' },
  poor: { bg: '#EF444420', color: red, label: '较差' },
};

const priorityConfig = {
  high: { color: red, label: '高' },
  medium: { color: yellow, label: '中' },
  low: { color: green, label: '低' },
};

// ===== Section Title =====
function SectionTitle({ icon, title, extra, color }: { icon: React.ReactNode; title: string; extra?: React.ReactNode; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, marginTop: 4 }}>
      <div style={{ width: 28, height: 28, borderRadius: 6, background: `${color || blue}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color || blue, fontSize: 14 }}>{icon}</div>
      <Text strong style={{ color: textPrimary, fontSize: 20 }}>{title}</Text>
      {extra && <div style={{ marginLeft: 'auto' }}>{extra}</div>}
    </div>
  );
}

// ===== Trend Card =====
function TrendCard({ trend }: { trend: TrendItem }) {
  const isPositive = trend.growth > 0;
  return (
    <Card size="small" style={{ background: cardBg, border: `1px solid ${border}` }}
      styles={{ body: { padding: '8px 10px' } }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
        <Text strong style={{ color: textPrimary, fontSize: 16 }}>{trend.name}</Text>
        <Tag icon={isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
          color={isPositive ? 'success' : 'error'} style={{ fontSize: 12, margin: 0 }}>
          {isPositive ? '+' : ''}{trend.growth}%
        </Tag>
      </div>
      <Text style={{ color: textSecondary, fontSize: 14 }}>{trend.description}</Text>
    </Card>
  );
}

// ===== Material Recommendation Row =====
function MaterialRecRow({ rec, formulaColor }: { rec: { materialId: string; category: string; spend: number; ctr: number; reason: string; expectedImprovement: string }; formulaColor: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: '1px solid #1e293b' }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: formulaColor, flexShrink: 0 }} />
      <Tooltip title={rec.reason}>
        <Text style={{ color: textPrimary, fontSize: 14, minWidth: 80, cursor: 'help' }}>{rec.materialId}</Text>
      </Tooltip>
      <Tag style={{ background: '#0F172A', border: '1px solid #334155', color: '#94A3B8', fontSize: 12, margin: 0 }}>{rec.category}</Tag>
      <Text style={{ color: yellow, fontSize: 14, minWidth: 55 }}>${rec.spend.toFixed(0)}</Text>
      <Text style={{ color: rec.ctr > 0.01 ? green : rec.ctr > 0.005 ? yellow : red, fontSize: 14, minWidth: 55 }}>{(rec.ctr*100).toFixed(2)}%</Text>
      <Text style={{ color: textMuted, fontSize: 12, flex: 1 }} ellipsis={{ tooltip: rec.reason }}>{rec.reason}</Text>
      <Tag style={{ background: `${formulaColor}15`, color: formulaColor, fontSize: 12, margin: 0 }}>{rec.expectedImprovement}</Tag>
    </div>
  );
}

// ===== Formula Card =====
function FormulaCard({ formula, onClick }: { formula: FormulaWithData; onClick: () => void }) {
  const hasRecs = formula.recommendations.materials.length > 0;
  return (
    <Card size="small" style={{ background: cardBg, border: `1px solid ${border}`, cursor: 'pointer', borderLeft: `3px solid ${formula.color}` }}
      styles={{ body: { padding: '10px 12px' } }} onClick={onClick}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{ width: 32, height: 32, borderRadius: 6, background: formula.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{formula.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Text strong style={{ color: textPrimary, fontSize: 15 }}>{formula.name}</Text>
            <Tag style={{ fontSize: 11, margin: 0, background: `${formula.color}20`, color: formula.color }}>{formula.subtitle}</Tag>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
            <Text style={{ color: textMuted, fontSize: 12 }}>案例: {formula.caseStudy}</Text>
            <Text style={{ color: formula.color, fontSize: 12, fontWeight: 600 }}>{formula.popularity}</Text>
          </div>
        </div>
        {hasRecs && <Tag color="green" style={{ fontSize: 11, margin: 0 }}>{formula.recommendations.materials.length} 条推荐</Tag>}
      </div>
      {formula.matchedCount > 0 && (
        <div style={{ display: 'flex', gap: 10, background: darkBg, borderRadius: 4, padding: '4px 8px', marginBottom: 6 }}>
          <Text style={{ fontSize: 12, color: textSecondary }}>匹配: <span style={{ color: blue }}>{formula.matchedCategory}</span></Text>
          <Text style={{ fontSize: 12, color: textSecondary }}>{formula.matchedCount} 条</Text>
          <Text style={{ fontSize: 12, color: textSecondary }}>CTR: <span style={{ color: green }}>{(formula.matchedAvgCtr*100).toFixed(2)}%</span></Text>
          <Text style={{ fontSize: 12, color: textSecondary }}>完播: <span style={{ color: purple }}>{(formula.matchedAvgCompletion*100).toFixed(1)}%</span></Text>
        </div>
      )}
      {hasRecs && (
        <div style={{ background: darkBg, borderRadius: 4, padding: '4px 6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
            <AimOutlined style={{ color: formula.color, fontSize: 12 }} />
            <Text style={{ color: formula.color, fontSize: 12, fontWeight: 600 }}>推荐素材</Text>
          </div>
          {formula.recommendations.materials.slice(0, 3).map((rec, i) => (
            <MaterialRecRow key={i} rec={rec} formulaColor={formula.color} />
          ))}
          {formula.recommendations.materials.length > 3 && (
            <Text style={{ color: textMuted, fontSize: 12, marginTop: 3 }}>+{formula.recommendations.materials.length - 3} 条更多，点击查看</Text>
          )}
        </div>
      )}
    </Card>
  );
}

// ===== Formula Detail Modal =====
function FormulaDetailModal({ formula, open, onClose }: { formula: FormulaWithData | null; open: boolean; onClose: () => void }) {
  if (!formula) return null;
  return (
    <Modal open={open} onCancel={onClose} footer={null} width={680} styles={{ body: { padding: 0 } }}>
      <div style={{ padding: '16px 20px', maxHeight: '75vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: formula.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{formula.icon}</div>
          <div>
            <Text style={{ color: textPrimary, fontSize: 16, fontWeight: 600, display: 'block' }}>{formula.name}</Text>
            <Text style={{ color: textMuted, fontSize: 12 }}>{formula.subtitle} · {formula.caseStudy}</Text>
          </div>
        </div>
        {formula.structure.length > 0 && (
          <>
            <Text style={{ color: textSecondary, fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>公式结构拆解</Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              {formula.structure.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: darkBg, borderRadius: 6, padding: '8px 10px' }}>
                  <Tag color="blue" style={{ fontSize: 10, margin: 0, minWidth: 50, textAlign: 'center' }}>{s.time}</Tag>
                  <Tag style={{ background: '#3B82F620', color: '#60A5FA', fontSize: 10, margin: 0 }}>{s.type}</Tag>
                  <Text style={{ color: textPrimary, fontSize: 12, flex: 1 }}>{s.content}</Text>
                </div>
              ))}
            </div>
          </>
        )}
        {formula.matchedCount > 0 && (
          <>
            <Text style={{ color: textSecondary, fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>数据表现</Text>
            <Row gutter={8} style={{ marginBottom: 16 }}>
              {[
                { label: '匹配分类', value: formula.matchedCategory, color: blue },
                { label: '素材数量', value: `${formula.matchedCount} 条`, color: textPrimary },
                { label: '总花费', value: `$${formula.matchedSpend.toFixed(0)}`, color: yellow },
                { label: '平均CTR', value: `${(formula.matchedAvgCtr*100).toFixed(2)}%`, color: green },
                { label: '平均完播', value: `${(formula.matchedAvgCompletion*100).toFixed(1)}%`, color: purple },
              ].map((m, i) => (
                <Col span={8} key={i}>
                  <div style={{ background: darkBg, borderRadius: 4, padding: '6px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 9, color: textMuted }}>{m.label}</div>
                    <div style={{ fontSize: 13, color: m.color, fontWeight: 600 }}>{m.value}</div>
                  </div>
                </Col>
              ))}
            </Row>
          </>
        )}
        {formula.recommendations.materials.length > 0 && (
          <>
            <Text style={{ color: textSecondary, fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 8 }}>
              <AimOutlined style={{ marginRight: 4 }} />推荐套用此公式的素材
            </Text>
            <div style={{ background: darkBg, borderRadius: 6, padding: '6px 8px', marginBottom: 16 }}>
              {formula.recommendations.materials.map((rec, i) => (
                <MaterialRecRow key={i} rec={rec} formulaColor={formula.color} />
              ))}
            </div>
          </>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
          {formula.tags.map(t => <Tag key={t} style={{ background: '#0F172A', border: '1px solid #334155', color: '#94A3B8', fontSize: 10 }}>{t}</Tag>)}
        </div>
        <div style={{ background: darkBg, borderRadius: 6, padding: '8px 12px' }}>
          <Text style={{ color: yellow, fontSize: 11 }}>💡 {formula.tip}</Text>
        </div>
      </div>
    </Modal>
  );
}

// ===== Creative Card =====
function CreativeCard({ creative }: { creative: CreativeAnalysis }) {
  const st = statusConfig[creative.status];
  return (
    <Card size="small" style={{ background: cardBg, border: `1px solid ${border}`, marginBottom: 4 }}
      styles={{ body: { padding: '6px 8px' } }}>
      <Row align="middle" gutter={8}>
        <Col span={3}>
          <Image src={creative.thumbnail} width={64} height={44} style={{ objectFit: 'cover', borderRadius: 4 }} preview={false} />
        </Col>
        <Col span={13}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <Text strong style={{ color: textPrimary, fontSize: 14 }}>{creative.name}</Text>
            <Tag style={{ background: st.bg, color: st.color, fontSize: 11, margin: 0 }}>{st.label}</Tag>
          </div>
          <div>
            {creative.tags.map(tag => (
              <Tag key={tag} style={{ background: '#64748B20', color: '#94A3B8', fontSize: 11, marginRight: 2 }}>{tag}</Tag>
            ))}
          </div>
        </Col>
        <Col span={8}>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { label: 'CTR', value: `${creative.ctr}%`, color: blue },
              { label: '2s率', value: `${creative.cvr}%`, color: green },
              { label: '完播', value: `${creative.playRate}%`, color: purple },
            ].map(m => (
              <div key={m.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: textMuted }}>{m.label}</div>
                <div style={{ fontSize: 16, color: m.color, fontWeight: 600 }}>{m.value}</div>
              </div>
            ))}
          </div>
        </Col>
      </Row>
    </Card>
  );
}

// ===== Suggestion Card =====
function SuggestionCard({ sug, selected, onToggle }: { sug: OptimizationSuggestion; selected: boolean; onToggle: () => void }) {
  const pri = priorityConfig[sug.priority];
  const hasRelated = sug.relatedMaterials && sug.relatedMaterials.length > 0;
  return (
    <Card size="small" style={{ background: cardBg, border: `1px solid ${selected ? blue : border}`, cursor: 'pointer' }}
      styles={{ body: { padding: '10px 12px' } }} onClick={onToggle}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <Tag style={{ background: `${pri.color}20`, color: pri.color, fontSize: 12, margin: 0, padding: '1px 6px', flexShrink: 0 }}>{pri.label}</Tag>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ color: textPrimary, fontSize: 14, display: 'block', fontWeight: 600 }}>{sug.suggestion}</Text>
          {sug.example && <Text style={{ color: textMuted, fontSize: 13, display: 'block', marginTop: 3 }}>{sug.example}</Text>}
          {sug.dataEvidence && (
            <div style={{ background: darkBg, borderRadius: 4, padding: '4px 8px', marginTop: 4, marginBottom: 4 }}>
              <Text style={{ color: blue, fontSize: 12 }}>{sug.dataEvidence}</Text>
            </div>
          )}
          {hasRelated && (
            <div style={{ marginTop: 4 }}>
              {sug.relatedMaterials!.slice(0, 3).map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: pri.color, flexShrink: 0 }} />
                  <Text style={{ color: textSecondary, fontSize: 12 }}>
                    <span style={{ color: textPrimary }}>{m.id}</span>
                    <span style={{ color: yellow, marginLeft: 4 }}>${m.spend.toFixed(0)}</span>
                    <span style={{ color: m.ctr > 0.01 ? green : red, marginLeft: 4 }}>{(m.ctr*100).toFixed(2)}%</span>
                    <span style={{ color: textMuted, marginLeft: 4 }}>{m.reason}</span>
                  </Text>
                </div>
              ))}
            </div>
          )}
          <Text style={{ color: green, fontSize: 13, display: 'block', marginTop: 3, fontWeight: 600 }}>→ {sug.impact}</Text>
        </div>
        {selected && <CheckCircleOutlined style={{ color: blue, fontSize: 16 }} />}
      </div>
    </Card>
  );
}

export default function CreativeInsightNew() {
  const {
    trends, creatives, suggestions, selectedSuggestions, toggleSuggestion,
    formulasWithData, selectedFormula, selectFormula,
    brief, generateBrief,
  } = useCreativeInsightStore();

  const materialData = useMaterialDataStore(s => s.data);
  const data: any[] = materialData.filter((r: any) => r.spend > 0);

  // === Charts ===
  const spendCtrScatter = (() => {
    const points = data.filter((r: any) => r.ctr > 0).map((r: any) => [r.spend, r.ctr * 100, r.materialId, r.category]);
    return {
      backgroundColor: 'transparent',
      tooltip: { formatter: (p: any) => `${p.data[2]} (${p.data[3]})<br/>花费: $${p.data[0].toFixed(0)}<br/>CTR: ${p.data[1].toFixed(2)}%` },
      grid: { left: 50, right: 15, top: 8, bottom: 30 },
      xAxis: { name: '花费($)', nameTextStyle: { color: '#64748b', fontSize: 9 }, type: 'value' as const, axisLabel: { color: '#94a3b8', fontSize: 9 }, splitLine: { lineStyle: { color: '#1e293b' } } },
      yAxis: { name: 'CTR(%)', nameTextStyle: { color: '#64748b', fontSize: 9 }, type: 'value' as const, axisLabel: { color: '#94a3b8', fontSize: 9 }, splitLine: { lineStyle: { color: '#1e293b' } } },
      series: [{ type: 'scatter', data: points, symbolSize: (d: any) => Math.max(3, Math.sqrt(d[0]) / 3), itemStyle: { color: green, opacity: 0.6 } }],
    };
  })();

  const playFunnelChart = (() => {
    const fields = ['playCount', 'play2s', 'play6s', 'play25', 'play50', 'play75', 'play100'];
    const labels = ['总播放', '2s', '6s', '25%', '50%', '75%', '100%'];
    const totals = fields.map(f => data.reduce((s: number, r: any) => s + (r[f] || 0), 0));
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
  })();

  const formulaRecSummary = (() => {
    const totalRecs = formulasWithData.reduce((s, f) => s + f.recommendations.materials.length, 0);
    return { totalRecs };
  })();

  const highPriSuggestions = suggestions.filter(s => s.priority === 'high');

  return (
    <div style={{ padding: '12px 16px', background: darkBg, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <FireOutlined style={{ color: yellow, fontSize: 22 }} />
        <Text strong style={{ color: textPrimary, fontSize: 22 }}>创意洞察中心</Text>
        <div style={{ flex: 1 }} />
        {highPriSuggestions.length > 0 && <Tag color="red" style={{ fontSize: 13 }}>{highPriSuggestions.length} 项高优建议</Tag>}
        {formulaRecSummary.totalRecs > 0 && <Tag color="green" style={{ fontSize: 13 }}>{formulaRecSummary.totalRecs} 条公式推荐</Tag>}
        <Tag color="blue" style={{ fontSize: 13 }}>{data.length} 条素材</Tag>
      </div>

      {/* ===== 1. 创意趋势 ===== */}
      <SectionTitle icon={<FireOutlined />} title="创意趋势" color={yellow} />
      <Row gutter={[8, 8]} style={{ marginBottom: 10 }}>
        {trends.map(t => (
          <Col span={Math.floor(24 / Math.min(trends.length, 6))} key={t.id}>
            <TrendCard trend={t} />
          </Col>
        ))}
      </Row>

      {/* ===== 2. 爆款公式 ===== */}
      <SectionTitle icon={<StarOutlined />} title="爆款公式 × 素材推荐" extra={<Tag color="green" style={{ fontSize: 13 }}>共 {formulaRecSummary.totalRecs} 条推荐</Tag>} color={purple} />
      <Row gutter={[8, 8]} style={{ marginBottom: 10 }}>
        {formulasWithData.map(f => (
          <Col span={8} key={f.id}>
            <FormulaCard formula={f} onClick={() => selectFormula(f)} />
          </Col>
        ))}
      </Row>

      {/* ===== 3. 数据驱动优化方案 ===== */}
      <SectionTitle icon={<RocketOutlined />} title="数据驱动优化方案" extra={<Tag color="blue" style={{ fontSize: 13 }}>已选 {selectedSuggestions.length}</Tag>} color={red} />
      <Row gutter={[8, 8]} style={{ marginBottom: 10 }}>
        {suggestions.map(s => (
          <Col span={8} key={s.id}>
            <SuggestionCard sug={s} selected={selectedSuggestions.includes(s.id)} onToggle={() => toggleSuggestion(s.id)} />
          </Col>
        ))}
      </Row>
      <Row gutter={[8, 8]} style={{ marginBottom: 10 }}>
        <Col span={12}>
          <Card title={<span style={{ color: textPrimary, fontSize: 15 }}><ThunderboltOutlined /> 快速行动</span>}
            style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: '10px 14px' } }}>
            {[
              { step: 1, text: '暂停 CTR < 0.3% 的素材', color: red },
              { step: 2, text: '分析 TOP3 高 CTR 素材特点', color: green },
              { step: 3, text: '套用爆款公式到高花费素材', color: blue },
              { step: 4, text: '测试 UGC 风格变体', color: yellow },
              { step: 5, text: '优化前3秒画面', color: purple },
            ].map(item => (
              <div key={item.step} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: `${item.color}20`, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>{item.step}</div>
                <Text style={{ color: textSecondary, fontSize: 14 }}>{item.text}</Text>
              </div>
            ))}
          </Card>
        </Col>
        <Col span={12}>
          <Card title={<span style={{ color: textPrimary, fontSize: 15 }}><BarChartOutlined /> 数据概览</span>}
            style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: '10px 14px' } }}>
            {[
              { label: '总素材', value: `${data.length} 条`, color: blue },
              { label: '总花费', value: `$${data.reduce((s: number, r: any) => s + r.spend, 0).toFixed(0)}`, color: yellow },
              { label: '平均CTR', value: `${(data.reduce((s: number, r: any) => s + r.ctr, 0) / data.length * 100).toFixed(2)}%`, color: green },
              { label: '高优建议', value: `${highPriSuggestions.length} 项`, color: red },
              { label: '公式推荐', value: `${formulaRecSummary.totalRecs} 条`, color: purple },
            ].map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0' }}>
                <Text style={{ color: textMuted, fontSize: 14 }}>{m.label}</Text>
                <Text style={{ color: m.color, fontSize: 16, fontWeight: 600 }}>{m.value}</Text>
              </div>
            ))}
          </Card>
        </Col>
      </Row>

      {/* ===== 4. 素材分析 ===== */}
      <SectionTitle icon={<BarChartOutlined />} title="素材分析" color={blue} />
      <Row gutter={[8, 8]} style={{ marginBottom: 10 }}>
        <Col span={16}>
          <Card title={<span style={{ color: textPrimary, fontSize: 15 }}><BarChartOutlined /> 素材排名（按花费）</span>}
            style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: '6px 8px', maxHeight: 400, overflowY: 'auto' } }}>
            {creatives.map(c => <CreativeCard key={c.id} creative={c} />)}
          </Card>
        </Col>
        <Col span={8}>
          <Card title={<span style={{ color: textPrimary, fontSize: 15 }}><AimOutlined /> 花费 vs CTR</span>}
            style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: '4px 6px' } }}>
            <ReactECharts option={spendCtrScatter} style={{ height: 180 }} />
          </Card>
          <Card title={<span style={{ color: textPrimary, fontSize: 15 }}><PlayCircleOutlined /> 播放漏斗</span>}
            style={{ background: cardBg, border: `1px solid ${border}`, marginTop: 8 }} styles={{ body: { padding: '4px 6px' } }}>
            <ReactECharts option={playFunnelChart} style={{ height: 160 }} />
          </Card>
        </Col>
      </Row>

      {/* ===== 5. 创意简报 ===== */}
      <SectionTitle icon={<FileTextOutlined />} title="创意简报" color={green} />
      {!brief ? (
        <Card style={{ background: cardBg, border: `1px solid ${border}`, textAlign: 'center', padding: 30, marginBottom: 10 }}>
          <FileTextOutlined style={{ fontSize: 36, color: textMuted, marginBottom: 10 }} />
          <div style={{ color: textSecondary, fontSize: 16, marginBottom: 6 }}>基于以上分析生成创意简报</div>
          <div style={{ color: textMuted, fontSize: 14, marginBottom: 16 }}>汇总趋势、公式推荐、优化方案</div>
          <Button type="primary" icon={<RocketOutlined />} onClick={generateBrief} size="large">生成创意简报</Button>
        </Card>
      ) : (
        <Card title={<span style={{ color: textPrimary, fontSize: 16 }}><FileTextOutlined /> {brief.title}</span>}
          style={{ background: cardBg, border: `1px solid ${border}`, marginBottom: 10 }} styles={{ body: { padding: '14px 18px' } }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: '目标', value: brief.objective, icon: <AimOutlined />, color: blue },
              { label: '目标受众', value: brief.targetAudience, icon: <EyeOutlined />, color: purple },
              { label: '数据基础', value: brief.keyMessage, icon: <BarChartOutlined />, color: green },
              { label: '时间线', value: brief.timeline, icon: <ThunderboltOutlined />, color: yellow },
              { label: '预算', value: brief.budget, icon: <StarOutlined />, color: red },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 6, background: `${item.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color, fontSize: 15, flexShrink: 0 }}>{item.icon}</div>
                <div>
                  <div style={{ fontSize: 12, color: textMuted }}>{item.label}</div>
                  <div style={{ fontSize: 15, color: textPrimary }}>{item.value}</div>
                </div>
              </div>
            ))}
            {brief.creativeElements.length > 0 && (
              <div style={{ background: darkBg, borderRadius: 6, padding: '10px 14px' }}>
                <div style={{ fontSize: 12, color: textMuted, marginBottom: 6 }}>优化方向 + 素材行动</div>
                {brief.creativeElements.map((el, i) => (
                  <div key={i} style={{ fontSize: 14, color: textSecondary, padding: '3px 0', display: 'flex', gap: 8 }}>
                    <CheckCircleOutlined style={{ color: green, fontSize: 13, marginTop: 3 }} />
                    <span>{el}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Formula Detail Modal */}
      <FormulaDetailModal formula={selectedFormula} open={!!selectedFormula} onClose={() => selectFormula(null)} />
    </div>
  );
}
