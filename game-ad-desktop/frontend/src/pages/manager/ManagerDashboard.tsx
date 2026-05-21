import { useState, useEffect, useMemo } from 'react';
import { Row, Col, Typography, Table, Statistic, Card } from 'antd';
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

export default function ManagerDashboard() {
  const { designers, refresh, setSelectedDesigner } = useManagerDataStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeDesigner, setActiveDesigner] = useState<DesignerStats | null>(null);

  useEffect(() => { refresh(); }, [refresh]);

  const totalSpend = useMemo(() => designers.reduce((s, d) => s + d.totalSpend, 0), [designers]);
  const totalMaterials = useMemo(() => designers.reduce((s, d) => s + d.materialCount, 0), [designers]);
  const highRiskCount = useMemo(() => designers.filter(d => d.riskLevel === 'high').length, [designers]);

  const handleCardClick = (designer: DesignerStats) => {
    setActiveDesigner(designer);
    setSelectedDesigner(designer.name);
    setModalOpen(true);
  };

  const getCardFields = (d: DesignerStats): CardField[] => [
    { label: '素材数', value: d.materialCount, color: blue },
    { label: '总花费', value: `$${d.totalSpend.toFixed(0)}`, color: yellow },
    { label: '平均CTR', value: `${(d.avgCtr * 100).toFixed(2)}%`, color: green },
    { label: '完播率', value: `${(d.avgPlay100Rate * 100).toFixed(1)}%`, color: '#8b5cf6' },
  ];

  const getModalSections = (d: DesignerStats): DetailSection[] => [
    {
      title: '核心指标',
      content: (
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 12 } }}>
              <Statistic title={<span style={{ color: muted }}>总花费</span>} value={d.totalSpend} prefix="$" precision={0}
                valueStyle={{ color: yellow, fontSize: 20 }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 12 } }}>
              <Statistic title={<span style={{ color: muted }}>总展示</span>} value={d.totalImpressions}
                valueStyle={{ color: blue, fontSize: 20 }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 12 } }}>
              <Statistic title={<span style={{ color: muted }}>平均CTR</span>} value={d.avgCtr * 100} suffix="%" precision={2}
                valueStyle={{ color: green, fontSize: 20 }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 12 } }}>
              <Statistic title={<span style={{ color: muted }}>效率评分</span>} value={d.efficiencyScore} suffix="/100"
                valueStyle={{ color: d.efficiencyScore >= 60 ? green : red, fontSize: 20 }} />
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      title: '素材列表',
      content: (
        <Table
          dataSource={d.materials}
          rowKey="materialId"
          size="small"
          pagination={{ pageSize: 8 }}
          style={{ background: cardBg }}
          columns={[
            { title: '素材ID', dataIndex: 'materialId', key: 'materialId', render: (v: string) => <Text style={{ color: text, fontSize: 12 }}>{v}</Text> },
            { title: '花费', dataIndex: 'spend', key: 'spend', render: (v: number) => <Text style={{ color: yellow, fontSize: 12 }}>${v.toFixed(2)}</Text> },
            { title: '展示', dataIndex: 'impressions', key: 'impressions', render: (v: number) => <Text style={{ color: text, fontSize: 12 }}>{v.toLocaleString()}</Text> },
            { title: 'CTR', dataIndex: 'ctr', key: 'ctr', render: (v: number) => <Text style={{ color: green, fontSize: 12 }}>{(v * 100).toFixed(2)}%</Text> },
            { title: 'CPM', dataIndex: 'cpm', key: 'cpm', render: (v: number) => <Text style={{ color: text, fontSize: 12 }}>${v.toFixed(2)}</Text> },
          ]}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: 16, background: panelBg, minHeight: '100vh' }}>
      <Title level={4} style={{ color: text, marginBottom: 16 }}>管理者总览</Title>

      {/* Summary stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 16 } }}>
            <Statistic title={<span style={{ color: muted }}>设计师数</span>} value={designers.length}
              valueStyle={{ color: blue, fontSize: 28 }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 16 } }}>
            <Statistic title={<span style={{ color: muted }}>总花费</span>} value={totalSpend} prefix="$" precision={0}
              valueStyle={{ color: yellow, fontSize: 28 }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 16 } }}>
            <Statistic title={<span style={{ color: muted }}>总素材数</span>} value={totalMaterials}
              valueStyle={{ color: green, fontSize: 28 }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 16 } }}>
            <Statistic title={<span style={{ color: muted }}>高风险设计师</span>} value={highRiskCount}
              valueStyle={{ color: red, fontSize: 28 }} />
          </Card>
        </Col>
      </Row>

      {/* Designer cards */}
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
