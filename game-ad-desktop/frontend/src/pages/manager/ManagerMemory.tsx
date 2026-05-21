import { useState, useEffect } from 'react';
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
const purple = '#8b5cf6';

export default function ManagerMemory() {
  const { designers, refresh, setSelectedDesigner } = useManagerDataStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeDesigner, setActiveDesigner] = useState<DesignerStats | null>(null);

  useEffect(() => { refresh(); }, [refresh]);

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

  const getCardFields = (d: DesignerStats): CardField[] => [
    { label: '素材数', value: d.materialCount, color: blue },
    { label: '擅长分类', value: getSpecialty(d), color: purple },
    { label: '效率评分', value: d.efficiencyScore, color: d.efficiencyScore >= 60 ? green : red },
    { label: '总花费', value: `$${d.totalSpend.toFixed(0)}`, color: yellow },
  ];

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

    return [
      {
        title: '设计师档案',
        content: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Profile summary */}
            <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 8, padding: 16 }}>
              <Row gutter={[16, 12]}>
                <Col span={6}>
                  <Text style={{ color: muted, fontSize: 11, display: 'block' }}>擅长分类</Text>
                  <Tag color={purple} style={{ fontSize: 12, marginTop: 4 }}>{specialty}</Tag>
                </Col>
                <Col span={6}>
                  <Text style={{ color: muted, fontSize: 11, display: 'block' }}>素材总数</Text>
                  <Text style={{ color: text, fontSize: 18, fontWeight: 600 }}>{d.materialCount}</Text>
                </Col>
                <Col span={6}>
                  <Text style={{ color: muted, fontSize: 11, display: 'block' }}>总花费</Text>
                  <Text style={{ color: yellow, fontSize: 18, fontWeight: 600 }}>${d.totalSpend.toFixed(0)}</Text>
                </Col>
                <Col span={6}>
                  <Text style={{ color: muted, fontSize: 11, display: 'block' }}>效率趋势</Text>
                  <Text style={{ color: trendColor, fontSize: 18, fontWeight: 600 }}>{trend}</Text>
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
    ];
  };

  return (
    <div style={{ padding: 16, background: panelBg, minHeight: '100vh' }}>
      <Title level={4} style={{ color: text, marginBottom: 16 }}>记忆沉淀 · 管理者视角</Title>

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
