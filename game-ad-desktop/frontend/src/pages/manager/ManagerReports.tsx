import { useState, useEffect, useMemo } from 'react';
import { Row, Col, Typography, Tag } from 'antd';
import { useManagerDataStore, DesignerStats } from '../../stores/manager/managerData';
import DesignerCard from '../../components/manager/DesignerCard';
import DesignerDetailModal from '../../components/manager/DesignerDetailModal';
import type { CardField } from '../../components/manager/DesignerCard';
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


export default function ManagerReports() {
  const { designers, refresh, setSelectedDesigner } = useManagerDataStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeDesigner, setActiveDesigner] = useState<DesignerStats | null>(null);

  useEffect(() => { refresh(); }, [refresh]);

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

  const getCardFields = (d: DesignerStats, rank: number): CardField[] => [
    { label: '排名', value: `#${rank}`, color: getRankColor(rank) },
    { label: '效率评分', value: d.efficiencyScore, color: d.efficiencyScore >= 60 ? green : red },
    { label: '总花费', value: `$${d.totalSpend.toFixed(0)}`, color: yellow },
    { label: '平均CTR', value: `${(d.avgCtr * 100).toFixed(2)}%`, color: blue },
  ];

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

  const getModalSections = (d: DesignerStats): DetailSection[] => {
    const rank = rankedDesigners.findIndex(x => x.name === d.name) + 1;
    const suggestions = getImprovementSuggestions(d, rank);

    return [
      {
        title: '表现报告',
        content: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Rank & Score */}
            <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 8, padding: 16 }}>
              <Row gutter={[16, 12]}>
                <Col span={6}>
                  <Text style={{ color: muted, fontSize: 11, display: 'block' }}>排名</Text>
                  <Text style={{ color: getRankColor(rank), fontSize: 28, fontWeight: 700 }}>#{rank}</Text>
                </Col>
                <Col span={6}>
                  <Text style={{ color: muted, fontSize: 11, display: 'block' }}>效率评分</Text>
                  <Text style={{ color: d.efficiencyScore >= 60 ? green : red, fontSize: 28, fontWeight: 700 }}>{d.efficiencyScore}</Text>
                </Col>
                <Col span={6}>
                  <Text style={{ color: muted, fontSize: 11, display: 'block' }}>素材数</Text>
                  <Text style={{ color: text, fontSize: 28, fontWeight: 700 }}>{d.materialCount}</Text>
                </Col>
                <Col span={6}>
                  <Text style={{ color: muted, fontSize: 11, display: 'block' }}>总花费</Text>
                  <Text style={{ color: yellow, fontSize: 28, fontWeight: 700 }}>${d.totalSpend.toFixed(0)}</Text>
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
    ];
  };

  return (
    <div style={{ padding: 16, background: panelBg, minHeight: '100vh' }}>
      <Title level={4} style={{ color: text, marginBottom: 16 }}>报告中心 · 管理者视角</Title>

      <Row gutter={[16, 16]}>
        {rankedDesigners.map((d, idx) => {
          const rank = idx + 1;
          return (
            <Col key={d.name} xs={24} sm={12} md={8} lg={6}>
              <DesignerCard designer={d} fields={getCardFields(d, rank)} onClick={() => handleCardClick(d)} />
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
    </div>
  );
}
