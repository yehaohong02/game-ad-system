import { useState, useEffect, useMemo, useRef } from 'react';
import { Row, Col, Typography, Table, Tag, Card, Statistic, Button, message } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import * as XLSX from 'xlsx';
import { useManagerDataStore, DesignerStats } from '../../stores/manager/managerData';
import type { MaterialRecord } from '../../stores/materialData';
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

export default function ManagerDataDiagnosis() {
  const { designers, refresh, setSelectedDesigner } = useManagerDataStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeDesigner, setActiveDesigner] = useState<DesignerStats | null>(null);

  useEffect(() => { refresh(); }, [refresh]);

  const summaryStats = useMemo(() => ({
    totalSpend: designers.reduce((s, d) => s + d.totalSpend, 0),
    totalImpressions: designers.reduce((s, d) => s + d.totalImpressions, 0),
    avgCpm: designers.length > 0 ? designers.reduce((s, d) => s + d.avgCpm, 0) / designers.length : 0,
    avgCtr: designers.length > 0 ? designers.reduce((s, d) => s + d.avgCtr, 0) / designers.length : 0,
    totalPlayCount: designers.reduce((s, d) => s + d.totalPlayCount, 0),
    anomalyCount: designers.reduce((s, d) => s + d.anomalyCount, 0),
  }), [designers]);

  const handleCardClick = (designer: DesignerStats) => {
    setActiveDesigner(designer);
    setSelectedDesigner(designer.name);
    setModalOpen(true);
  };

  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const setManagerMaterialData = useManagerDataStore(s => s.setManagerMaterialData);

  const handleImportExcel = (file: File) => {
    setImporting(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        // Validate: manager table must have 设计师 and 媒体 columns (24-column format)
        const headerRow = rows.find((r: any[]) => r && r.some((c: any) => String(c).includes('素材ID')));
        if (headerRow) {
          const headerStr = headerRow.map((c: any) => String(c)).join(',');
          const hasDesigner = headerStr.includes('设计师');
          const hasMedia = headerStr.includes('媒体');
          if (!hasDesigner || !hasMedia) {
            message.error('表格格式不匹配！这是设计师素材表（22列），请使用管理者设计师素材表（24列，含"设计师"和"媒体"列）');
            setImporting(false);
            return;
          }
        }

        // Find header row and build column map
        const headerIdx = rows.findIndex((r: any[]) => r && r.some((c: any) => String(c || '').trim() === '素材ID'));
        if (headerIdx < 0) {
          message.error('未找到表头行（需包含"素材ID"列）');
          setImporting(false);
          return;
        }
        const headers = rows[headerIdx].map((h: any) => String(h || '').trim());
        const colIdx: Record<string, number> = {};
        headers.forEach((h: string, i: number) => { if (h) colIdx[h] = i; });

        const num = (row: any[], name: string) => {
          const i = colIdx[name];
          const v = i != null ? row[i] : undefined;
          return v != null && v !== '' ? Number(v) : 0;
        };
        const str = (row: any[], name: string) => {
          const i = colIdx[name];
          return i != null ? String(row[i] || '') : '';
        };

        const dataRows = rows.slice(headerIdx + 1).filter((r: any[]) => {
          const mid = r[colIdx['素材ID']];
          return mid && String(mid) !== '合计' && String(mid) !== '汇总';
        });

        const records: MaterialRecord[] = dataRows.map((row: any[]) => {
          const mid = str(row, '素材ID');
          const game = str(row, '游戏分类');
          return {
            key: mid,
            materialId: mid,
            game,
            category: game,
            designer: str(row, '设计师'),
            media: str(row, '媒体'),
            spend: num(row, '素材花费'),
            impressions: num(row, '素材展示数'),
            cpm: num(row, '素材千次展示成本'),
            clicks: num(row, '素材点击数'),
            cpc: num(row, '素材点击成本'),
            ctr: num(row, '素材点击率'),
            playCount: num(row, '播放次数'),
            play2s: num(row, '播放2s次数'),
            play6s: num(row, '播放6s次数'),
            play25: num(row, '播放25%次数'),
            play50: num(row, '播放50%次数'),
            play75: num(row, '播放75%次数'),
            play100: num(row, '播放100%次数'),
            preview: str(row, '预览链接'),
            country: '',
            platform: '',
            status: '',
            installs: 0,
            cpi: 0,
            roas: 0,
          } as MaterialRecord;
        });

        setManagerMaterialData(records);
        message.success(`成功导入 ${records.length} 条素材数据`);
      } catch (err: any) {
        message.error(`导入失败: ${err.message || err}`);
      } finally {
        setImporting(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const getCardSections = (d: DesignerStats): CardSection[] => {
    const sorted = [...d.materials].sort((a, b) => b.ctr - a.ctr);
    const top3Ctr = sorted.slice(0, 3);
    const bottom3Ctr = sorted.filter(m => m.spend > 0).slice(-3).reverse();

    const chipStyle: React.CSSProperties = {
      background: '#0F172A', borderRadius: 4, padding: '4px 6px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    };

    return [
      {
        title: '投放指标',
        content: (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
            <div style={chipStyle}>
              <span style={{ color: muted, fontSize: 10 }}>总花费</span>
              <span style={{ color: yellow, fontSize: 11, fontWeight: 600 }}>${d.totalSpend.toFixed(0)}</span>
            </div>
            <div style={chipStyle}>
              <span style={{ color: muted, fontSize: 10 }}>总展示</span>
              <span style={{ color: blue, fontSize: 11, fontWeight: 600 }}>{d.totalImpressions.toLocaleString()}</span>
            </div>
            <div style={chipStyle}>
              <span style={{ color: muted, fontSize: 10 }}>平均CPM</span>
              <span style={{ color: yellow, fontSize: 11, fontWeight: 600 }}>${d.avgCpm.toFixed(2)}</span>
            </div>
            <div style={chipStyle}>
              <span style={{ color: muted, fontSize: 10 }}>平均CTR</span>
              <span style={{ color: green, fontSize: 11, fontWeight: 600 }}>{(d.avgCtr * 100).toFixed(2)}%</span>
            </div>
            <div style={chipStyle}>
              <span style={{ color: muted, fontSize: 10 }}>平均CPC</span>
              <span style={{ color: blue, fontSize: 11, fontWeight: 600 }}>${d.avgCpc.toFixed(2)}</span>
            </div>
            <div style={chipStyle}>
              <span style={{ color: muted, fontSize: 10 }}>总播放</span>
              <span style={{ color: '#e2e8f0', fontSize: 11, fontWeight: 600 }}>{(d.totalPlayCount || 0).toLocaleString()}</span>
            </div>
          </div>
        ),
      },
      {
        title: '视频播放',
        content: (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
            <div style={chipStyle}>
              <span style={{ color: muted, fontSize: 10 }}>播放量</span>
              <span style={{ color: '#e2e8f0', fontSize: 11, fontWeight: 600 }}>{(d.totalPlayCount || 0).toLocaleString()}</span>
            </div>
            <div style={chipStyle}>
              <span style={{ color: muted, fontSize: 10 }}>2s率</span>
              <span style={{ color: blue, fontSize: 11, fontWeight: 600 }}>{(d.avgPlay2sRate * 100).toFixed(1)}%</span>
            </div>
            <div style={chipStyle}>
              <span style={{ color: muted, fontSize: 10 }}>6s率</span>
              <span style={{ color: blue, fontSize: 11, fontWeight: 600 }}>{(d.avgPlay6sRate * 100).toFixed(1)}%</span>
            </div>
            <div style={chipStyle}>
              <span style={{ color: muted, fontSize: 10 }}>25%率</span>
              <span style={{ color: yellow, fontSize: 11, fontWeight: 600 }}>-</span>
            </div>
            <div style={chipStyle}>
              <span style={{ color: muted, fontSize: 10 }}>50%率</span>
              <span style={{ color: yellow, fontSize: 11, fontWeight: 600 }}>-</span>
            </div>
            <div style={chipStyle}>
              <span style={{ color: muted, fontSize: 10 }}>100%完播率</span>
              <span style={{ color: green, fontSize: 11, fontWeight: 600 }}>{(d.avgPlay100Rate * 100).toFixed(1)}%</span>
            </div>
          </div>
        ),
      },
      {
        title: '异常检测',
        content: (
          <div style={{ fontSize: 10, lineHeight: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
              <span style={{ color: muted }}>异常数</span>
              <span style={{ color: d.anomalyCount > 0 ? red : green, fontWeight: 600 }}>{d.anomalyCount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
              <span style={{ color: muted }}>高CTR素材数</span>
              <span style={{ color: green }}>{d.highCtrCount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
              <span style={{ color: muted }}>低CTR素材数</span>
              <span style={{ color: red }}>{d.lowCtrCount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
              <span style={{ color: muted }}>高CPM素材数</span>
              <span style={{ color: yellow }}>{d.highCpmCount}</span>
            </div>
          </div>
        ),
      },
      {
        title: 'TOP3 CTR素材',
        content: (
          <div>
            {top3Ctr.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 0' }}>
                <span style={{ color: text, fontSize: 10, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.materialId.slice(0, 8)}
                </span>
                <span style={{ color: green, fontSize: 10 }}>{(m.ctr * 100).toFixed(2)}%</span>
                <span style={{ color: muted, fontSize: 10 }}>{m.impressions.toLocaleString()}</span>
              </div>
            ))}
          </div>
        ),
      },
      {
        title: 'BOTTOM3 CTR素材',
        content: (
          <div>
            {bottom3Ctr.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 0' }}>
                <span style={{ color: red, fontSize: 10, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.materialId.slice(0, 8)}
                </span>
                <span style={{ color: red, fontSize: 10 }}>{(m.ctr * 100).toFixed(2)}%</span>
                <span style={{ color: yellow, fontSize: 10 }}>${m.spend.toFixed(0)}</span>
              </div>
            ))}
          </div>
        ),
      },
    ];
  };

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

    const totalCtrMats = d.materialCount || 1;

    return [
      {
        title: '花费分布',
        content: <ReactECharts option={barChartOption} style={{ height: 280 }} />,
      },
      {
        title: '渠道效率对比',
        content: (
          <Table
            dataSource={d.mediaBreakdown}
            rowKey="media"
            size="small"
            pagination={false}
            columns={[
              { title: '渠道', dataIndex: 'media', key: 'media', render: (v: string) => <Text style={{ color: text, fontSize: 12 }}>{v}</Text> },
              { title: '素材数', dataIndex: 'count', key: 'count', render: (v: number) => <Text style={{ color: blue, fontSize: 12 }}>{v}</Text> },
              { title: '花费', dataIndex: 'spend', key: 'spend', render: (v: number) => <Text style={{ color: yellow, fontSize: 12 }}>${v.toFixed(0)}</Text> },
              { title: '平均CTR', dataIndex: 'avgCtr', key: 'avgCtr', render: (v: number) => <Text style={{ color: green, fontSize: 12 }}>{(v * 100).toFixed(2)}%</Text> },
              { title: '平均CPM', dataIndex: 'avgCpm', key: 'avgCpm', render: (v: number) => <Text style={{ color: text, fontSize: 12 }}>${v.toFixed(2)}</Text> },
            ]}
          />
        ),
      },
      {
        title: '游戏效率对比',
        content: (
          <Table
            dataSource={d.gameBreakdown}
            rowKey="game"
            size="small"
            pagination={false}
            columns={[
              { title: '游戏', dataIndex: 'game', key: 'game', render: (v: string) => <Text style={{ color: text, fontSize: 12 }}>{v}</Text> },
              { title: '素材数', dataIndex: 'count', key: 'count', render: (v: number) => <Text style={{ color: blue, fontSize: 12 }}>{v}</Text> },
              { title: '花费', dataIndex: 'spend', key: 'spend', render: (v: number) => <Text style={{ color: yellow, fontSize: 12 }}>${v.toFixed(0)}</Text> },
              { title: '平均CTR', dataIndex: 'avgCtr', key: 'avgCtr', render: (v: number) => <Text style={{ color: green, fontSize: 12 }}>{(v * 100).toFixed(2)}%</Text> },
              { title: '平均CPM', dataIndex: 'avgCpm', key: 'avgCpm', render: (v: number) => <Text style={{ color: text, fontSize: 12 }}>${v.toFixed(2)}</Text> },
            ]}
          />
        ),
      },
      {
        title: 'CTR分布',
        content: (
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 8, padding: 16, textAlign: 'center' }}>
                <Text style={{ color: muted, fontSize: 11, display: 'block' }}>{'高CTR素材 (>1.5%)'}</Text>
                <Text style={{ color: green, fontSize: 24, fontWeight: 600 }}>{d.highCtrCount}</Text>
                <Text style={{ color: muted, fontSize: 11 }}>{(d.highCtrCount / totalCtrMats * 100).toFixed(1)}%</Text>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 8, padding: 16, textAlign: 'center' }}>
                <Text style={{ color: muted, fontSize: 11, display: 'block' }}>低CTR素材 ({'<'}0.3%)</Text>
                <Text style={{ color: red, fontSize: 24, fontWeight: 600 }}>{d.lowCtrCount}</Text>
                <Text style={{ color: muted, fontSize: 11 }}>{(d.lowCtrCount / totalCtrMats * 100).toFixed(1)}%</Text>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 8, padding: 16, textAlign: 'center' }}>
                <Text style={{ color: muted, fontSize: 11, display: 'block' }}>{'高CPM素材 (>$8)'}</Text>
                <Text style={{ color: yellow, fontSize: 24, fontWeight: 600 }}>{d.highCpmCount}</Text>
                <Text style={{ color: muted, fontSize: 11 }}>{(d.highCpmCount / totalCtrMats * 100).toFixed(1)}%</Text>
              </div>
            </Col>
          </Row>
        ),
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
              { title: '游戏', key: 'game', render: (_: any, r: any) => <Text style={{ color: muted, fontSize: 12 }}>{r.game || r.category || '-'}</Text> },
              { title: '渠道', key: 'media', render: (_: any, r: any) => <Text style={{ color: muted, fontSize: 12 }}>{r.media || '-'}</Text> },
              { title: '花费', dataIndex: 'spend', key: 'spend', render: (v: number) => <Text style={{ color: yellow, fontSize: 12 }}>${v.toFixed(2)}</Text> },
              { title: '展示', dataIndex: 'impressions', key: 'impressions', render: (v: number) => <Text style={{ color: text, fontSize: 12 }}>{v.toLocaleString()}</Text> },
              { title: 'CPM', dataIndex: 'cpm', key: 'cpm', render: (v: number) => <Text style={{ color: text, fontSize: 12 }}>${v.toFixed(2)}</Text> },
              { title: 'CTR', dataIndex: 'ctr', key: 'ctr', render: (v: number) => <Text style={{ color: green, fontSize: 12 }}>{(v * 100).toFixed(2)}%</Text> },
              { title: 'CPC', dataIndex: 'cpc', key: 'cpc', render: (v: number) => <Text style={{ color: text, fontSize: 12 }}>${v.toFixed(2)}</Text> },
              { title: '播放量', dataIndex: 'playCount', key: 'playCount', render: (v: number) => <Text style={{ color: text, fontSize: 12 }}>{(v || 0).toLocaleString()}</Text> },
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <Title level={4} style={{ color: text, margin: 0 }}>数据诊断 · 管理者视角</Title>
        <div style={{ flex: 1 }} />
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          style={{ display: 'none' }}
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) handleImportExcel(file);
            e.target.value = '';
          }}
        />
        {importing && <Tag color="blue" style={{ fontSize: 11 }}>导入中...</Tag>}
        <Button
          size="middle"
          icon={<UploadOutlined />}
          loading={importing}
          onClick={() => fileInputRef.current?.click()}
          style={{ background: green, borderColor: green, color: '#fff', fontWeight: 600 }}
        >
          导入Excel
        </Button>
        <Button
          size="middle"
          icon={<DeleteOutlined />}
          onClick={() => {
            localStorage.removeItem('managerMaterialDataStore');
            localStorage.setItem('managerMaterialDataStore_cleared', '1');
            window.location.reload();
          }}
          style={{ background: red, borderColor: red, color: '#fff', fontWeight: 600 }}
        >
          清除数据
        </Button>
      </div>

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
            <Statistic title={<span style={{ color: muted }}>总展示</span>} value={summaryStats.totalImpressions} valueStyle={{ color: blue, fontSize: 20 }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 12 } }}>
            <Statistic title={<span style={{ color: muted }}>平均CPM</span>} value={summaryStats.avgCpm} prefix="$" precision={2} valueStyle={{ color: yellow, fontSize: 20 }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 12 } }}>
            <Statistic title={<span style={{ color: muted }}>平均CTR</span>} value={summaryStats.avgCtr * 100} suffix="%" precision={2} valueStyle={{ color: green, fontSize: 20 }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 12 } }}>
            <Statistic title={<span style={{ color: muted }}>总播放</span>} value={summaryStats.totalPlayCount} valueStyle={{ color: text, fontSize: 20 }} />
          </Card>
        </Col>
        <Col span={4}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 12 } }}>
            <Statistic title={<span style={{ color: muted }}>异常素材数</span>} value={summaryStats.anomalyCount} valueStyle={{ color: red, fontSize: 20 }} />
          </Card>
        </Col>
      </Row>

      {/* Per-designer analysis panel */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={24}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: 16 } }}>
            <Text strong style={{ color: text, fontSize: 14, display: 'block', marginBottom: 12 }}>数据诊断 · 管理者反馈</Text>
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              <Row gutter={[12, 8]}>
                {designers.map((d, idx) => {
                  const strengths: string[] = [];
                  const weaknesses: string[] = [];
                  const suggestions: string[] = [];
                  if (d.avgCtr > 0.012) strengths.push(`CTR优秀(${(d.avgCtr*100).toFixed(2)}%)`);
                  else if (d.avgCtr < 0.008) { weaknesses.push(`CTR偏低(${(d.avgCtr*100).toFixed(2)}%)`); suggestions.push('优化素材创意和受众定向'); }
                  if (d.avgCpm < 5) strengths.push(`CPM低($${d.avgCpm.toFixed(1)})成本控制好`);
                  else if (d.avgCpm > 10) { weaknesses.push(`CPM过高($${d.avgCpm.toFixed(1)})`); suggestions.push('调整出价策略'); }
                  if (d.anomalyCount === 0) strengths.push('零异常，数据质量好');
                  else { weaknesses.push(`${d.anomalyCount}条异常素材`); suggestions.push('排查异常数据'); }
                  if (d.highCtrCount > 3) strengths.push(`高CTR素材多(${d.highCtrCount}条)`);
                  if (d.lowCtrCount > 5) { weaknesses.push(`低CTR素材偏多(${d.lowCtrCount}条)`); suggestions.push('暂停低CTR素材投放'); }
                  if (d.highCpmCount > 5) { weaknesses.push(`高CPM素材偏多(${d.highCpmCount}条)`); suggestions.push('设置CPM预算上限'); }
                  if (d.totalImpressions > 100000) strengths.push(`展示量大(${(d.totalImpressions/10000).toFixed(0)}万)`);
                  else if (d.totalImpressions < 10000) weaknesses.push('展示量偏低');
                  if (d.avgCpc > 2) { weaknesses.push(`CPC偏高($${d.avgCpc.toFixed(2)})`); suggestions.push('优化广告相关性降低CPC'); }
                  if (suggestions.length===0) suggestions.push('数据指标健康，保持监控');
                  if (strengths.length===0) strengths.push('各项指标处于中等水平');
                  if (weaknesses.length===0) weaknesses.push('数据诊断未发现明显问题');
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

      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col span={12}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: '12px 12px 8px' } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
              <Text strong style={{ color: text, fontSize: 13 }}>设计师CTR对比</Text>
              <Text style={{ color: muted, fontSize: 10, textAlign: 'right', maxWidth: '55%', lineHeight: '14px' }}>各设计师平均点击率对比，反映素材吸引力</Text>
            </div>
            <ReactECharts option={{
              backgroundColor: 'transparent',
              tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0].name}<br/>CTR: ${p[0].value.toFixed(2)}%` },
              grid: { left: 10, right: 20, top: 4, bottom: 8, containLabel: true },
              xAxis: { type: 'category', data: designers.map(d => d.name), axisLabel: { color: muted, fontSize: 10 }, axisLine: { lineStyle: { color: border } } },
              yAxis: { type: 'value', axisLabel: { color: muted, fontSize: 10, formatter: (v: number) => `${v}%` }, splitLine: { lineStyle: { color: '#1e293b' } } },
              series: [{ type: 'bar', data: designers.map(d => d.avgCtr * 100), barWidth: 20, itemStyle: { color: green, borderRadius: [4, 4, 0, 0] } }]
            }} style={{ height: 220 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: '12px 12px 8px' } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
              <Text strong style={{ color: text, fontSize: 13 }}>设计师CPM对比</Text>
              <Text style={{ color: muted, fontSize: 10, textAlign: 'right', maxWidth: '55%', lineHeight: '14px' }}>各设计师千次展示成本对比，反映投放成本效率</Text>
            </div>
            <ReactECharts option={{
              backgroundColor: 'transparent',
              tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0].name}<br/>CPM: $${p[0].value.toFixed(2)}` },
              grid: { left: 10, right: 20, top: 4, bottom: 8, containLabel: true },
              xAxis: { type: 'category', data: designers.map(d => d.name), axisLabel: { color: muted, fontSize: 10 }, axisLine: { lineStyle: { color: border } } },
              yAxis: { type: 'value', axisLabel: { color: muted, fontSize: 10, formatter: (v: number) => `$${v}` }, splitLine: { lineStyle: { color: '#1e293b' } } },
              series: [{ type: 'bar', data: designers.map(d => d.avgCpm), barWidth: 20, itemStyle: { color: yellow, borderRadius: [4, 4, 0, 0] } }]
            }} style={{ height: 220 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: '12px 12px 8px' } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
              <Text strong style={{ color: text, fontSize: 13 }}>异常素材分布</Text>
              <Text style={{ color: muted, fontSize: 10, textAlign: 'right', maxWidth: '55%', lineHeight: '14px' }}>高CTR/低CTR/高CPM素材的数量分布，反映数据健康度</Text>
            </div>
            <ReactECharts option={{
              backgroundColor: 'transparent',
              tooltip: { trigger: 'axis' },
              legend: { data: ['高CTR', '低CTR', '高CPM'], textStyle: { color: muted, fontSize: 10 }, top: 0, right: 10 },
              grid: { left: 10, right: 20, top: 4, bottom: 8, containLabel: true },
              xAxis: { type: 'category', data: designers.map(d => d.name), axisLabel: { color: muted, fontSize: 10 }, axisLine: { lineStyle: { color: border } } },
              yAxis: { type: 'value', axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: '#1e293b' } } },
              series: [
                { name: '高CTR', type: 'bar', stack: 'anomaly', data: designers.map(d => d.highCtrCount), itemStyle: { color: green } },
                { name: '低CTR', type: 'bar', stack: 'anomaly', data: designers.map(d => d.lowCtrCount), itemStyle: { color: red } },
                { name: '高CPM', type: 'bar', stack: 'anomaly', data: designers.map(d => d.highCpmCount), barWidth: 20, itemStyle: { color: yellow, borderRadius: [4, 4, 0, 0] } },
              ]
            }} style={{ height: 220 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card style={{ background: cardBg, border: `1px solid ${border}` }} styles={{ body: { padding: '12px 12px 8px' } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
              <Text strong style={{ color: text, fontSize: 13 }}>展示量对比</Text>
              <Text style={{ color: muted, fontSize: 10, textAlign: 'right', maxWidth: '55%', lineHeight: '14px' }}>各设计师素材总展示量对比，反映曝光规模</Text>
            </div>
            <ReactECharts option={{
              backgroundColor: 'transparent',
              tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0].name}<br/>展示: ${p[0].value.toLocaleString()}` },
              grid: { left: 10, right: 20, top: 4, bottom: 8, containLabel: true },
              xAxis: { type: 'category', data: designers.map(d => d.name), axisLabel: { color: muted, fontSize: 10 }, axisLine: { lineStyle: { color: border } } },
              yAxis: { type: 'value', axisLabel: { color: muted, fontSize: 10 }, splitLine: { lineStyle: { color: '#1e293b' } } },
              series: [{ type: 'bar', data: designers.map(d => d.totalImpressions), barWidth: 20, itemStyle: { color: blue, borderRadius: [4, 4, 0, 0] } }]
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
