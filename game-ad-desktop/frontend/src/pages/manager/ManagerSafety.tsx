import { useState, useEffect, useMemo } from 'react';
import { Row, Col, Typography, Tag, Progress } from 'antd';
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

const riskColor: Record<string, string> = { low: green, medium: yellow, high: red };
const riskLabel: Record<string, string> = { low: '低风险', medium: '中风险', high: '高风险' };

export default function ManagerSafety() {
  const { designers, refresh, setSelectedDesigner } = useManagerDataStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeDesigner, setActiveDesigner] = useState<DesignerStats | null>(null);

  useEffect(() => { refresh(); }, [refresh]);

  const totalSpend = useMemo(() => designers.reduce((s, d) => s + d.totalSpend, 0), [designers]);

  const handleCardClick = (designer: DesignerStats) => {
    setActiveDesigner(designer);
    setSelectedDesigner(designer.name);
    setModalOpen(true);
  };

  const getCardFields = (d: DesignerStats): CardField[] => {
    const budgetPct = totalSpend > 0 ? (d.totalSpend / totalSpend * 100) : 0;
    return [
      { label: '预算占比', value: `${budgetPct.toFixed(1)}%`, color: budgetPct > 30 ? red : blue },
      { label: '风险等级', value: riskLabel[d.riskLevel], color: riskColor[d.riskLevel] },
      { label: '异常数', value: d.anomalyCount, color: d.anomalyCount > 0 ? red : green },
      { label: '总花费', value: `$${d.totalSpend.toFixed(0)}`, color: yellow },
    ];
  };

  const getModalSections = (d: DesignerStats): DetailSection[] => {
    const budgetPct = totalSpend > 0 ? (d.totalSpend / totalSpend * 100) : 0;
    return [
      {
        title: '预算与风险详情',
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
              </div>
            </div>
          </div>
        ),
      },
    ];
  };

  return (
    <div style={{ padding: 16, background: panelBg, minHeight: '100vh' }}>
      <Title level={4} style={{ color: text, marginBottom: 16 }}>安全防护 · 管理者视角</Title>

      <Row gutter={[16, 16]}>
        {designers.map(d => (
          <Col key={d.name} xs={24} sm={12} md={8} lg={6}>
            <DesignerCard designer={d} fields={getCardFields(d)} onClick={() => handleCardClick(d)} />
          </Col>
        ))}
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
