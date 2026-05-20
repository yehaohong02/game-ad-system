import { useEffect } from 'react';
import {
  Row, Col, Card, Table, Button, Space, Tag, Spin, DatePicker, Segmented,
  Typography, Alert, Tooltip,
} from 'antd';
import {
  AlertOutlined, TrophyOutlined, FileTextOutlined, ReloadOutlined,
  BulbOutlined, WarningOutlined, ThunderboltOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useReportsStore, type TopCreative, type MarketInsight, type CompetitiveAlert } from '../stores/reports';

const { Text } = Typography;

const cardStyle = { background: '#1E293B', border: '1px solid #334155' };

function MetricBar({ metrics, label, totalImpressions, totalClicks }: { metrics: { total_spend: number; total_installs: number; avg_roas: number; avg_cpi: number; avg_ctr: number }; label: string; totalImpressions?: number; totalClicks?: number }) {
  const items = [
    { label: '总花费', value: `¥${metrics.total_spend.toLocaleString()}`, color: '#E2E8F0' },
    { label: '总曝光', value: totalImpressions ? `${(totalImpressions / 10000).toFixed(1)}万` : '-', color: '#10B981' },
    { label: '总点击', value: totalClicks ? totalClicks.toLocaleString() : '-', color: '#4F46E5' },
    { label: 'CTR', value: `${(metrics.avg_ctr * 100).toFixed(2)}%`, color: metrics.avg_ctr > 0.01 ? '#10B981' : '#F59E0B' },
  ];
  return (
    <Card style={cardStyle} bodyStyle={{ padding: '10px 20px' }}>
      <Row align="middle" gutter={0}>
        <Col flex="none" style={{ marginRight: 16 }}>
          <Text style={{ color: '#64748B', fontSize: 12 }}>{label}</Text>
        </Col>
        {items.map((item, i) => (
          <Col flex="auto" key={i}>
            <Tooltip title={item.label}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: item.color, fontSize: 18, fontWeight: 700, lineHeight: 1.3 }}>{item.value}</div>
                <div style={{ color: '#475569', fontSize: 10 }}>{item.label}</div>
              </div>
            </Tooltip>
          </Col>
        ))}
      </Row>
    </Card>
  );
}

const topCreativeColumns: ColumnsType<TopCreative> = [
  {
    title: '#', key: 'rank', width: 36,
    render: (_: any, __: any, index: number) => {
      const colors = ['#F59E0B', '#94A3B8', '#CD7F32'];
      return (
        <span style={{ color: index < 3 ? colors[index] : '#64748B', fontWeight: index < 3 ? 700 : 400, fontSize: 13 }}>
          {index < 3 ? <TrophyOutlined /> : index + 1}
        </span>
      );
    },
  },
  {
    title: '素材', dataIndex: 'creative_id', key: 'creative_id',
    render: (id: string) => {
      const short = id.length > 20 ? id.substring(0, 18) + '...' : id;
      return <Text style={{ color: '#E2E8F0', fontSize: 12 }} title={id}>{short}</Text>;
    },
  },
  {
    title: 'CTR', dataIndex: 'roas', key: 'roas', width: 72,
    sorter: (a, b) => a.roas - b.roas,
    render: (v: number) => (
      <Tag color={v >= 2.0 ? 'green' : v >= 1.5 ? 'blue' : 'orange'} style={{ fontSize: 11, margin: 0 }}>
        {v.toFixed(2)}%
      </Tag>
    ),
  },
  {
    title: '花费', dataIndex: 'spend', key: 'spend', width: 80,
    sorter: (a, b) => a.spend - b.spend,
    render: (v: number) => <Text style={{ color: '#E2E8F0', fontSize: 12 }}>¥{v.toFixed(v >= 100 ? 0 : 2)}</Text>,
  },
];

const severityConfig: Record<string, { color: string; label: string }> = {
  critical: { color: '#EF4444', label: '严重' },
  warning: { color: '#F59E0B', label: '警告' },
  info: { color: '#4F46E5', label: '信息' },
};

const alertTypeIcons: Record<string, React.ReactNode> = {
  budget: <WarningOutlined style={{ color: '#F59E0B' }} />,
  creative: <BulbOutlined style={{ color: '#4F46E5' }} />,
  performance: <ThunderboltOutlined style={{ color: '#EF4444' }} />,
};

export default function Reports() {
  const {
    reportType, dailyReport, weeklyReport, loading,
    setReportType, fetchDailyReport, fetchWeeklyReport,
  } = useReportsStore();

  const selectedDate = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

  useEffect(() => {
    if (reportType === 'daily') fetchDailyReport(selectedDate);
    else fetchWeeklyReport();
  }, [reportType]);

  const handleRefresh = () => {
    if (reportType === 'daily') fetchDailyReport(selectedDate);
    else fetchWeeklyReport();
  };

  const metrics = reportType === 'daily' ? dailyReport?.metrics : weeklyReport?.metrics;
  const periodLabel = reportType === 'daily'
    ? (dailyReport?.date ?? selectedDate)
    : (weeklyReport?.period ?? '最近7天');

  return (
    <div className="page-enter">
      {/* Compact header: type switch + date + refresh + period */}
      <Card style={{ ...cardStyle, marginBottom: 12 }} bodyStyle={{ padding: '8px 16px' }}>
        <Row align="middle" gutter={12}>
          <Col>
            <FileTextOutlined style={{ fontSize: 14, color: '#4F46E5' }} />
          </Col>
          <Col>
            <Segmented
              options={[
                { label: '日报', value: 'daily' },
                { label: '周报', value: 'weekly' },
              ]}
              value={reportType}
              onChange={(v) => setReportType(v as 'daily' | 'weekly')}
              size="small"
            />
          </Col>
          {reportType === 'daily' && (
            <Col>
              <DatePicker
                value={dayjs(selectedDate)}
                size="small"
                style={{ background: '#0F172A', border: '1px solid #334155' }}
                allowClear={false}
              />
            </Col>
          )}
          <Col>
            <Button icon={<ReloadOutlined />} size="small" loading={loading} onClick={handleRefresh}>刷新</Button>
          </Col>
          <Col flex="auto">
            <Tag color="blue" style={{ fontSize: 11 }}>{periodLabel}</Tag>
          </Col>
          {reportType === 'daily' && dailyReport && (
            <Col>
              <Space size={8}>
                <AlertOutlined style={{ color: dailyReport.alerts.critical > 0 ? '#EF4444' : '#F59E0B', fontSize: 13 }} />
                <Text style={{ color: '#94A3B8', fontSize: 12 }}>
                  告警 <Text style={{ color: '#F59E0B', fontWeight: 600 }}>{dailyReport.alerts.total}</Text>
                  {dailyReport.alerts.critical > 0 && (
                    <>, 严重 <Text style={{ color: '#EF4444', fontWeight: 600 }}>{dailyReport.alerts.critical}</Text></>
                  )}
                </Text>
              </Space>
            </Col>
          )}
        </Row>
      </Card>

      <Spin spinning={loading}>
        {/* Metrics inline bar */}
        {metrics && (
          <div style={{ marginBottom: 12 }}>
            <MetricBar
              metrics={metrics}
              label={reportType === 'daily' ? '日指标' : '周指标'}
              totalImpressions={reportType === 'daily' ? dailyReport?.total_impressions : undefined}
              totalClicks={reportType === 'daily' ? dailyReport?.total_clicks : undefined}
            />
          </div>
        )}

        {/* Daily: alerts + top creatives */}
        {reportType === 'daily' && dailyReport && (
          <>
            {/* 市场洞察 + 竞品异动 */}
            <Row gutter={[12, 0]} style={{ marginBottom: 12 }}>
              <Col span={12}>
                <Card
                  title={
                    <Space size={6}>
                      <BulbOutlined style={{ color: '#F59E0B', fontSize: 13 }} />
                      <Text style={{ color: '#E2E8F0', fontSize: 13, fontWeight: 600 }}>市场洞察</Text>
                      <Tag color="orange" style={{ fontSize: 10, margin: 0 }}>{(dailyReport.marketInsights ?? []).length}</Tag>
                    </Space>
                  }
                  style={cardStyle}
                  bodyStyle={{ padding: '8px 12px' }}
                >
                  <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                    {(dailyReport.marketInsights ?? []).map((ins: MarketInsight, i: number) => (
                      <div key={i} style={{
                        padding: '8px 10px', marginBottom: 6,
                        background: '#0F172A', borderRadius: 6,
                        border: ins.priority === 'high' ? '1px solid #EF444444' : '1px solid #334155',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <Tag color={ins.priority === 'high' ? 'red' : ins.priority === 'medium' ? 'orange' : 'default'} style={{ fontSize: 10, margin: 0 }}>
                            {ins.priority === 'high' ? '高' : ins.priority === 'medium' ? '中' : '低'}
                          </Tag>
                          <Text style={{ color: '#E2E8F0', fontSize: 12, fontWeight: 600 }}>{ins.title}</Text>
                        </div>
                        <Text style={{ color: '#94A3B8', fontSize: 11, display: 'block' }}>{ins.detail}</Text>
                        <Text style={{ color: '#475569', fontSize: 10 }}>来源: {ins.source}</Text>
                      </div>
                    ))}
                    {(!dailyReport.marketInsights || dailyReport.marketInsights.length === 0) && (
                      <div style={{ textAlign: 'center', padding: 20 }}>
                        <Text style={{ color: '#64748B', fontSize: 12 }}>暂无洞察数据</Text>
                      </div>
                    )}
                  </div>
                </Card>
              </Col>
              <Col span={12}>
                <Card
                  title={
                    <Space size={6}>
                      <ThunderboltOutlined style={{ color: '#EF4444', fontSize: 13 }} />
                      <Text style={{ color: '#E2E8F0', fontSize: 13, fontWeight: 600 }}>竞品异动</Text>
                      <Tag color={dailyReport.alerts.critical > 0 ? 'red' : 'orange'} style={{ fontSize: 10, margin: 0 }}>
                        {(dailyReport.competitiveAlerts ?? []).length}
                      </Tag>
                    </Space>
                  }
                  style={cardStyle}
                  bodyStyle={{ padding: '8px 12px' }}
                >
                  <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                    {(dailyReport.competitiveAlerts ?? []).map((alert: CompetitiveAlert, i: number) => {
                      const cfg = severityConfig[alert.severity];
                      return (
                        <div key={i} style={{
                          padding: '8px 10px', marginBottom: 6,
                          background: '#0F172A', borderRadius: 6,
                          border: alert.severity === 'critical' ? '1px solid #EF444444' : '1px solid #334155',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            {alertTypeIcons[alert.type]}
                            <Tag color={alert.severity === 'critical' ? 'red' : alert.severity === 'warning' ? 'orange' : 'blue'} style={{ fontSize: 10, margin: 0 }}>
                              {cfg.label}
                            </Tag>
                            <Text style={{ color: '#E2E8F0', fontSize: 12, flex: 1 }}>{alert.message}</Text>
                          </div>
                          {alert.materials && alert.materials.length > 0 && (
                            <div style={{ marginTop: 4 }}>
                              {alert.materials.slice(0, 4).map((m: string) => (
                                <Tag key={m} style={{ fontSize: 9, margin: '0 2px 0 0', lineHeight: '14px' }}>{m}</Tag>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {(!dailyReport.competitiveAlerts || dailyReport.competitiveAlerts.length === 0) && (
                      <div style={{ textAlign: 'center', padding: 20 }}>
                        <Text style={{ color: '#64748B', fontSize: 12 }}>暂无异动告警</Text>
                      </div>
                    )}
                  </div>
                </Card>
              </Col>
            </Row>

            {/* Original: alerts summary + top creatives */}
            <Row gutter={[12, 0]}>
              {/* Alerts - compact */}
              <Col span={8}>
                <Card
                  title={
                    <Space size={6}>
                      <AlertOutlined style={{ color: '#F59E0B', fontSize: 13 }} />
                      <Text style={{ color: '#E2E8F0', fontSize: 13, fontWeight: 600 }}>告警</Text>
                      <Tag color={dailyReport.alerts.critical > 0 ? 'red' : 'orange'} style={{ fontSize: 10, margin: 0 }}>
                        {dailyReport.alerts.total}
                      </Tag>
                    </Space>
                  }
                  style={cardStyle}
                  bodyStyle={{ padding: '8px 12px' }}
                >
                  <Row gutter={8}>
                    <Col span={12}>
                      <div style={{
                        background: '#0F172A', borderRadius: 6, padding: '8px 12px', textAlign: 'center',
                        border: '1px solid #334155',
                      }}>
                        <div style={{ color: '#F59E0B', fontSize: 20, fontWeight: 700 }}>{dailyReport.alerts.total}</div>
                        <div style={{ color: '#64748B', fontSize: 10 }}>总告警</div>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div style={{
                        background: '#0F172A', borderRadius: 6, padding: '8px 12px', textAlign: 'center',
                        border: dailyReport.alerts.critical > 0 ? '1px solid #EF444444' : '1px solid #334155',
                      }}>
                        <div style={{ color: '#EF4444', fontSize: 20, fontWeight: 700 }}>{dailyReport.alerts.critical}</div>
                        <div style={{ color: '#64748B', fontSize: 10 }}>严重</div>
                      </div>
                    </Col>
                  </Row>
                  {dailyReport.alerts.critical > 0 && (
                    <Alert
                      message="发现严重告警，建议立即处理"
                      type="error"
                      showIcon
                      style={{ marginTop: 8 }}
                      banner
                    />
                  )}
                </Card>
              </Col>

              {/* Top Creatives */}
              <Col span={16}>
                <Card
                  title={
                    <Space size={6}>
                      <TrophyOutlined style={{ color: '#F59E0B', fontSize: 13 }} />
                      <Text style={{ color: '#E2E8F0', fontSize: 13, fontWeight: 600 }}>Top 素材</Text>
                      <Text style={{ color: '#64748B', fontSize: 11 }}>(按CTR排序)</Text>
                    </Space>
                  }
                  style={cardStyle}
                  bodyStyle={{ padding: 0 }}
                >
                  <Table
                    columns={topCreativeColumns}
                    dataSource={dailyReport.top_creatives}
                    rowKey="creative_id"
                    pagination={false}
                    size="small"
                    showHeader={false}
                  />
                </Card>
              </Col>
            </Row>
          </>
        )}

        {/* Weekly summary - compact */}
        {reportType === 'weekly' && weeklyReport && (
          <Card
            title={
              <Space size={6}>
                <FileTextOutlined style={{ color: '#4F46E5', fontSize: 13 }} />
                <Text style={{ color: '#E2E8F0', fontSize: 13, fontWeight: 600 }}>周报摘要</Text>
                <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>{weeklyReport.period}</Tag>
              </Space>
            }
            style={cardStyle}
            bodyStyle={{ padding: '12px 16px' }}
          >
            <Row gutter={24}>
              <Col span={8}>
                <Text style={{ color: '#64748B', fontSize: 11, display: 'block', marginBottom: 2 }}>周总花费</Text>
                <Text style={{ color: '#E2E8F0', fontSize: 20, fontWeight: 700 }}>
                  ¥{(weeklyReport.metrics.total_spend / 10000).toFixed(1)}万
                </Text>
              </Col>
              <Col span={8}>
                <Text style={{ color: '#64748B', fontSize: 11, display: 'block', marginBottom: 2 }}>周总曝光</Text>
                <Text style={{ color: '#10B981', fontSize: 20, fontWeight: 700 }}>
                  {dailyReport?.total_impressions ? `${(dailyReport.total_impressions / 10000).toFixed(1)}万` : '-'}
                </Text>
              </Col>
              <Col span={8}>
                <Text style={{ color: '#64748B', fontSize: 11, display: 'block', marginBottom: 2 }}>周平均 CTR</Text>
                <Text style={{
                  color: weeklyReport.metrics.avg_ctr > 0.01 ? '#10B981' : '#F59E0B',
                  fontSize: 20, fontWeight: 700,
                }}>
                  {(weeklyReport.metrics.avg_ctr * 100).toFixed(2)}%
                </Text>
              </Col>
            </Row>
          </Card>
        )}

        {/* No data */}
        {!loading && !metrics && (
          <Card style={{ ...cardStyle, textAlign: 'center', padding: 40 }}>
            <FileTextOutlined style={{ fontSize: 36, color: '#475569', marginBottom: 12 }} />
            <Text style={{ color: '#64748B', display: 'block' }}>暂无报告数据</Text>
            <Text style={{ color: '#475569', display: 'block', marginTop: 4, fontSize: 12 }}>请确认后端服务已启动，或选择其他日期</Text>
          </Card>
        )}
      </Spin>
    </div>
  );
}
