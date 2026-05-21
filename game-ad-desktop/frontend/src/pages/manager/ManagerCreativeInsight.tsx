import { useState, useEffect } from 'react';
import { Row, Col, Typography, Table } from 'antd';
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
const yellow = '#f59e0b';
const purple = '#8b5cf6';

export default function ManagerCreativeInsight() {
  const { designers, refresh, setSelectedDesigner } = useManagerDataStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeDesigner, setActiveDesigner] = useState<DesignerStats | null>(null);

  useEffect(() => { refresh(); }, [refresh]);

  const handleCardClick = (designer: DesignerStats) => {
    setActiveDesigner(designer);
    setSelectedDesigner(designer.name);
    setModalOpen(true);
  };

  // Derive creative style tags from categories
  const getCreativeTags = (d: DesignerStats): string[] => {
    const cats = d.materials.reduce((acc, m) => {
      if (m.category) acc[m.category] = (acc[m.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([cat]) => cat);
  };

  const getCardFields = (d: DesignerStats): CardField[] => {
    const tags = getCreativeTags(d);
    return [
      { label: '完播率', value: `${(d.avgPlay100Rate * 100).toFixed(1)}%`, color: purple },
      { label: '平均CTR', value: `${(d.avgCtr * 100).toFixed(2)}%`, color: green },
      { label: '创意风格', value: tags.join(', ') || '-', color: blue },
      { label: '素材数', value: d.materialCount, color: text },
    ];
  };

  const getModalSections = (d: DesignerStats): DetailSection[] => {
    const lineChartOption = {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' as const },
      legend: { data: ['2s播放率', '6s播放率', '100%完播率'], textStyle: { color: muted, fontSize: 10 }, top: 0 },
      grid: { left: 50, right: 20, top: 30, bottom: 24 },
      xAxis: {
        type: 'category' as const,
        data: d.materials.slice(0, 15).map(m => m.materialId),
        axisLabel: { color: muted, fontSize: 9, rotate: 30 },
        axisLine: { lineStyle: { color: border } },
      },
      yAxis: {
        type: 'value' as const,
        axisLabel: { color: muted, fontSize: 10, formatter: (v: number) => `${(v * 100).toFixed(0)}%` },
        splitLine: { lineStyle: { color: '#1e293b' } },
      },
      series: [
        {
          name: '2s播放率', type: 'line', smooth: true,
          data: d.materials.slice(0, 15).map(m => m.playCount > 0 ? m.play2s / m.playCount : 0),
          itemStyle: { color: blue }, lineStyle: { width: 2 },
        },
        {
          name: '6s播放率', type: 'line', smooth: true,
          data: d.materials.slice(0, 15).map(m => m.playCount > 0 ? m.play6s / m.playCount : 0),
          itemStyle: { color: yellow }, lineStyle: { width: 2 },
        },
        {
          name: '100%完播率', type: 'line', smooth: true,
          data: d.materials.slice(0, 15).map(m => m.playCount > 0 ? m.play100 / m.playCount : 0),
          itemStyle: { color: green }, lineStyle: { width: 2 },
        },
      ],
    };

    return [
      {
        title: '完播率曲线',
        content: <ReactECharts option={lineChartOption} style={{ height: 280 }} />,
      },
      {
        title: '素材完播数据',
        content: (
          <Table
            dataSource={d.materials}
            rowKey="materialId"
            size="small"
            pagination={{ pageSize: 8 }}
            columns={[
              { title: '素材ID', dataIndex: 'materialId', key: 'materialId', render: (v: string) => <Text style={{ color: text, fontSize: 12 }}>{v}</Text> },
              { title: '播放次数', dataIndex: 'playCount', key: 'playCount', render: (v: number) => <Text style={{ color: text, fontSize: 12 }}>{v.toLocaleString()}</Text> },
              {
                title: '2s播放率', key: 'play2sRate',
                render: (_: any, r: any) => <Text style={{ color: blue, fontSize: 12 }}>{r.playCount > 0 ? (r.play2s / r.playCount * 100).toFixed(1) : 0}%</Text>,
              },
              {
                title: '100%完播率', key: 'play100Rate',
                render: (_: any, r: any) => <Text style={{ color: green, fontSize: 12 }}>{r.playCount > 0 ? (r.play100 / r.playCount * 100).toFixed(1) : 0}%</Text>,
              },
              { title: 'CTR', dataIndex: 'ctr', key: 'ctr', render: (v: number) => <Text style={{ color: yellow, fontSize: 12 }}>{(v * 100).toFixed(2)}%</Text> },
            ]}
          />
        ),
      },
    ];
  };

  return (
    <div style={{ padding: 16, background: panelBg, minHeight: '100vh' }}>
      <Title level={4} style={{ color: text, marginBottom: 16 }}>创意洞察 · 管理者视角</Title>

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
