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

interface Suggestion {
  priority: 'high' | 'medium' | 'low';
  label: string;
  detail: string;
}

function generateSuggestions(d: DesignerStats): Suggestion[] {
  const suggestions: Suggestion[] = [];

  if (d.avgCtr < 0.005) {
    suggestions.push({ priority: 'high', label: 'CTR偏低', detail: `平均CTR仅${(d.avgCtr * 100).toFixed(2)}%，建议优化素材创意或调整受众定向` });
  } else if (d.avgCtr < 0.01) {
    suggestions.push({ priority: 'medium', label: 'CTR待提升', detail: `平均CTR ${(d.avgCtr * 100).toFixed(2)}%，有优化空间` });
  }

  if (d.avgCpm > 10) {
    suggestions.push({ priority: 'high', label: 'CPM偏高', detail: `平均CPM $${d.avgCpm.toFixed(2)}，建议调整出价策略或更换投放时段` });
  } else if (d.avgCpm > 6) {
    suggestions.push({ priority: 'medium', label: 'CPM待优化', detail: `平均CPM $${d.avgCpm.toFixed(2)}，可尝试优化竞价` });
  }

  if (d.anomalyCount > 0) {
    suggestions.push({ priority: 'high', label: '存在异常素材', detail: `检测到${d.anomalyCount}条异常数据，建议排查` });
  }

  if (d.avgPlay100Rate < 0.02) {
    suggestions.push({ priority: 'medium', label: '完播率偏低', detail: `完播率仅${(d.avgPlay100Rate * 100).toFixed(1)}%，建议优化前3秒吸引力` });
  }

  if (d.efficiencyScore >= 70) {
    suggestions.push({ priority: 'low', label: '表现优秀', detail: `效率评分${d.efficiencyScore}，建议追加预算扩大投放` });
  }

  if (d.materialCount < 5) {
    suggestions.push({ priority: 'medium', label: '素材数量不足', detail: `仅${d.materialCount}条素材，建议增加素材多样性` });
  }

  if (suggestions.length === 0) {
    suggestions.push({ priority: 'low', label: '状态良好', detail: '当前各项指标正常，继续保持' });
  }

  return suggestions;
}

const priorityColor: Record<string, string> = { high: red, medium: yellow, low: green };
const priorityLabel: Record<string, string> = { high: '高', medium: '中', low: '低' };

export default function ManagerExecution() {
  const { designers, refresh, setSelectedDesigner } = useManagerDataStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeDesigner, setActiveDesigner] = useState<DesignerStats | null>(null);

  useEffect(() => { refresh(); }, [refresh]);

  const handleCardClick = (designer: DesignerStats) => {
    setActiveDesigner(designer);
    setSelectedDesigner(designer.name);
    setModalOpen(true);
  };

  const getCardFields = (d: DesignerStats): CardField[] => {
    const suggestions = generateSuggestions(d);
    const execStatus = d.anomalyCount > 0 ? '需关注' : '运行中';
    return [
      { label: '优化建议', value: suggestions.length, color: yellow },
      { label: '执行状态', value: execStatus, color: d.anomalyCount > 0 ? red : green },
      { label: '效率评分', value: d.efficiencyScore, color: d.efficiencyScore >= 60 ? green : red },
      { label: '总花费', value: `$${d.totalSpend.toFixed(0)}`, color: blue },
    ];
  };

  const getModalSections = (d: DesignerStats): DetailSection[] => {
    const suggestions = generateSuggestions(d);
    return [
      {
        title: '优化建议',
        content: (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {suggestions.map((s, i) => (
              <div key={i} style={{
                background: cardBg, border: `1px solid ${border}`, borderRadius: 8, padding: '10px 14px',
                borderLeft: `3px solid ${priorityColor[s.priority]}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Tag color={priorityColor[s.priority]} style={{ fontSize: 10, margin: 0 }}>
                    {priorityLabel[s.priority]}
                  </Tag>
                  <Text style={{ color: text, fontSize: 13, fontWeight: 500 }}>{s.label}</Text>
                </div>
                <Text style={{ color: muted, fontSize: 12 }}>{s.detail}</Text>
              </div>
            ))}
          </div>
        ),
      },
    ];
  };

  return (
    <div style={{ padding: 16, background: panelBg, minHeight: '100vh' }}>
      <Title level={4} style={{ color: text, marginBottom: 16 }}>智能执行 · 管理者视角</Title>

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
