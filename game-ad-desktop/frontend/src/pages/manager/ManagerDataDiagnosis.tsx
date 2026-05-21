import { useState, useEffect } from 'react';
import { Row, Col, Typography, Table, Tag } from 'antd';
import ReactECharts from 'echarts-for-react';
import { useManagerDataStore, DesignerStats } from '../../stores/manager/managerData';
import DesignerCard from '../../components/manager/DesignerCard';
import DesignerDetailModal from '../../components/manager/DesignerDetailModal';
import type { CardField } from '../../components/manager/DesignerCard';
import type { DetailSection } from '../../components/manager/DesignerDetailModal';

const { Title, Text } = Typography;

const panelBg = '#0F172A';
const border = '#334155';
const text = '#e2e8f0';
const muted = '#64748b';
const blue = '#3b82f6';
const green = '#10b981';
const red = '#ef4444';
const yellow = '#f59e0b';

export default function ManagerDataDiagnosis() {
  const { designers, refresh, setSelectedDesigner } = useManagerDataStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeDesigner, setActiveDesigner] = useState<DesignerStats | null>(null);

  useEffect(() => { refresh(); }, [refresh]);

  const handleCardClick = (designer: DesignerStats) => {
    setActiveDesigner(designer);
    setSelectedDesigner(designer.name);
    setModalOpen(true);
  };

  const getCardFields = (d: DesignerStats): CardField[] => [
    { label: 'ROI指标', value: `${(d.avgCtr * 100).toFixed(2)}%`, color: green },
    { label: '效率评分', value: d.efficiencyScore, color: d.efficiencyScore >= 60 ? green : red },
    { label: '异常数', value: d.anomalyCount, color: d.anomalyCount > 0 ? red : green },
    { label: '平均CPM', value: `$${d.avgCpm.toFixed(2)}`, color: yellow },
  ];

  const getModalSections = (d: DesignerStats): DetailSection[] => {
    // Top 10 materials by spend for bar chart
    const top10 = [...d.materials].sort((a, b) => b.spend - a.spend).slice(0, 10);

    const barChartOption = {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' as const, axisPointer: { type: 'shadow' as const } },
      grid: { left: 80, right: 20, top: 8, bottom: 24 },
      xAxis: {
        type: 'value' as const,
        axisLabel: { color: muted, fontSize: 10, formatter: (v: number) => `$${v}` },
        splitLine: { lineStyle: { color: '#1e293b' } },
      },
      yAxis: {
        type: 'category' as const,
        data: top10.map(m => m.materialId).reverse(),
        axisLabel: { color: text, fontSize: 10 },
        axisLine: { lineStyle: { color: border } },
      },
      series: [{
        type: 'bar',
        data: top10.map(m => m.spend).reverse(),
        barWidth: 14,
        itemStyle: { color: blue, borderRadius: [0, 3, 3, 0] },
      }],
    };

    return [
      {
        title: '花费分布',
        content: <ReactECharts option={barChartOption} style={{ height: 280 }} />,
      },
      {
        title: '素材明细',
        content: (
          <Table
            dataSource={d.materials}
            rowKey="materialId"
            size="small"
            pagination={{ pageSize: 8 }}
            columns={[
              { title: '素材ID', dataIndex: 'materialId', key: 'materialId', render: (v: string) => <Text style={{ color: text, fontSize: 12 }}>{v}</Text> },
              { title: '花费', dataIndex: 'spend', key: 'spend', render: (v: number) => <Text style={{ color: yellow, fontSize: 12 }}>${v.toFixed(2)}</Text> },
              { title: '展示', dataIndex: 'impressions', key: 'impressions', render: (v: number) => <Text style={{ color: text, fontSize: 12 }}>{v.toLocaleString()}</Text> },
              { title: 'CPM', dataIndex: 'cpm', key: 'cpm', render: (v: number) => <Text style={{ color: text, fontSize: 12 }}>${v.toFixed(2)}</Text> },
              { title: 'CTR', dataIndex: 'ctr', key: 'ctr', render: (v: number) => <Text style={{ color: green, fontSize: 12 }}>{(v * 100).toFixed(2)}%</Text> },
              { title: 'CPC', dataIndex: 'cpc', key: 'cpc', render: (v: number) => <Text style={{ color: text, fontSize: 12 }}>${v.toFixed(2)}</Text> },
              {
                title: '状态', key: 'status',
                render: (_: any, record: any) => {
                  const isAnomaly = record.ctr > 10 || record.ctr < 0.01 || record.cpc > 50 || (record.spend > 0 && record.impressions < 10);
                  return isAnomaly
                    ? <Tag color="red" style={{ fontSize: 10 }}>异常</Tag>
                    : <Tag color="green" style={{ fontSize: 10 }}>正常</Tag>;
                },
              },
            ]}
          />
        ),
      },
    ];
  };

  return (
    <div style={{ padding: 16, background: panelBg, minHeight: '100vh' }}>
      <Title level={4} style={{ color: text, marginBottom: 16 }}>数据诊断 · 管理者视角</Title>

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
