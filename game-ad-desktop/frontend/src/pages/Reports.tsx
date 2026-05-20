import { useEffect, useState } from 'react';
import {
  Row, Col, Card, Table, Button, Space, Tag, Statistic, Spin, DatePicker, Segmented,
  Typography, Alert, Divider,
} from 'antd';
import {
  DollarOutlined, DownloadOutlined, RiseOutlined, ThunderboltOutlined,
  AlertOutlined, TrophyOutlined, FileTextOutlined, ReloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useReportsStore } from '../stores/reports';
import type { TopCreative } from '../stores/reports';

const { Text } = Typography;

const cardStyle = { background: '#1E293B', border: '1px solid #334155' };

const topCreativeColumns: ColumnsType<TopCreative> = [
  {
    title: '排名',
    key: 'rank',
    width: 70,
    render: (_: any, __: any, index: number) => {
      const colors = ['#F59E0B', '#94A3B8', '#CD7F32'];
      return (
        <span style={{
          color: index < 3 ? colors[index] : '#94A3B8',
          fontWeight: index < 3 ? 700 : 400,
          fontSize: index < 3 ? 16 : 14,
        }}>
          {index < 3 ? <TrophyOutlined style={{ marginRight: 4 }} /> : null}
          {index + 1}
        </span>
      );
    },
  },
  {
    title: '素材ID',
    dataIndex: 'creative_id',
    key: 'creative_id',
    render: (id: string) => <Text copyable style={{ color: '#E2E8F0', fontFamily: 'monospace' }}>{id}</Text>,
  },
  {
    title: 'ROAS',
    dataIndex: 'roas',
    key: 'roas',
    sorter: (a, b) => a.roas - b.roas,
    render: (v: number) => (
      <Tag color={v >= 2 ? 'green' : v >= 1.5 ? 'blue' : 'orange'}>
        {v.toFixed(2)}x
      </Tag>
    ),
  },
  {
    title: '花费',
    dataIndex: 'spend',
    key: 'spend',
    sorter: (a, b) => a.spend - b.spend,
    render: (v: number) => <Text style={{ color: '#E2E8F0' }}>¥{v.toLocaleString()}</Text>,
  },
];

export default function Reports() {
  const {
    reportType, dailyReport, weeklyReport, loading,
    setReportType, fetchDailyReport, fetchWeeklyReport,
  } = useReportsStore();

  const [selectedDate, setSelectedDate] = useState<string>(
    dayjs().subtract(1, 'day').format('YYYY-MM-DD')
  );

  useEffect(() => {
    if (reportType === 'daily') fetchDailyReport(selectedDate);
    else fetchWeeklyReport();
  }, [reportType]);

  const handleRefresh = () => {
    if (reportType === 'daily') fetchDailyReport(selectedDate);
    else fetchWeeklyReport();
  };

  const metrics = reportType === 'daily' ? dailyReport?.metrics : weeklyReport?.metrics;

  return (
    <div className="page-enter">
      {/* Header */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card style={cardStyle}>
            <Space align="center" size="middle" wrap>
              <FileTextOutlined style={{ fontSize: 20, color: '#4F46E5' }} />
              <Text style={{ color: '#94A3B8', fontSize: 14 }}>报告类型:</Text>
              <Segmented
                options={[
                  { label: '日报', value: 'daily' },
                  { label: '周报', value: 'weekly' },
                ]}
                value={reportType}
                onChange={(v) => setReportType(v as 'daily' | 'weekly')}
                size="large"
              />
              {reportType === 'daily' && (
                <DatePicker
                  value={dayjs(selectedDate)}
                  onChange={(d) => {
                    if (d) {
                      const ds = d.format('YYYY-MM-DD');
                      setSelectedDate(ds);
                      fetchDailyReport(ds);
                    }
                  }}
                  style={{ background: '#0F172A', border: '1px solid #334155' }}
                  allowClear={false}
                />
              )}
              <Button icon={<ReloadOutlined />} loading={loading} onClick={handleRefresh}>
                刷新
              </Button>
              <Tag color="blue">
                {reportType === 'daily'
                  ? (dailyReport?.date ?? selectedDate)
                  : (weeklyReport?.period ?? '最近7天')}
              </Tag>
            </Space>
          </Card>
        </Col>
      </Row>

      <Spin spinning={loading}>
        {/* Metrics Cards */}
        {metrics && (
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} sm={12} lg={4} xl={4}>
              <Card style={cardStyle}>
                <Statistic
                  title="总花费"
                  value={metrics.total_spend}
                  prefix={<DollarOutlined />}
                  suffix="元"
                  valueStyle={{ color: '#E2E8F0' }}
                  formatter={(v) => `¥${Number(v).toLocaleString()}`}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={4} xl={4}>
              <Card style={cardStyle}>
                <Statistic
                  title="总安装"
                  value={metrics.total_installs}
                  prefix={<DownloadOutlined />}
                  valueStyle={{ color: '#10B981' }}
                  formatter={(v) => Number(v).toLocaleString()}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={4} xl={4}>
              <Card style={cardStyle}>
                <Statistic
                  title="平均 ROAS"
                  value={metrics.avg_roas}
                  prefix={<RiseOutlined />}
                  suffix="x"
                  precision={2}
                  valueStyle={{ color: metrics.avg_roas >= 1 ? '#10B981' : '#EF4444' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={4} xl={4}>
              <Card style={cardStyle}>
                <Statistic
                  title="平均 CPI"
                  value={metrics.avg_cpi}
                  prefix={<DollarOutlined />}
                  suffix="元"
                  precision={2}
                  valueStyle={{ color: '#F59E0B' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={4} xl={4}>
              <Card style={cardStyle}>
                <Statistic
                  title="平均 CTR"
                  value={metrics.avg_ctr ? metrics.avg_ctr * 100 : 0}
                  prefix={<ThunderboltOutlined />}
                  suffix="%"
                  precision={2}
                  valueStyle={{ color: '#4F46E5' }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* Daily-only sections */}
        {reportType === 'daily' && dailyReport && (
          <>
            {/* Alerts Summary */}
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col span={24}>
                <Card
                  title={
                    <Space>
                      <AlertOutlined style={{ color: '#F59E0B' }} />
                      <Text style={{ color: '#E2E8F0' }}>异常告警摘要</Text>
                    </Space>
                  }
                  style={cardStyle}
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <Card style={cardStyle}>
                        <Statistic
                          title="告警总数"
                          value={dailyReport.alerts.total}
                          suffix="条"
                          valueStyle={{ color: '#F59E0B' }}
                          prefix={<AlertOutlined />}
                        />
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card style={cardStyle}>
                        <Statistic
                          title="严重告警"
                          value={dailyReport.alerts.critical}
                          suffix="条"
                          valueStyle={{ color: '#EF4444' }}
                          prefix={<AlertOutlined />}
                        />
                      </Card>
                    </Col>
                  </Row>
                  {dailyReport.alerts.critical > 0 && (
                    <Alert
                      message={`发现 ${dailyReport.alerts.critical} 条严重告警，建议立即处理`}
                      type="error"
                      showIcon
                      style={{ marginTop: 16 }}
                    />
                  )}
                </Card>
              </Col>
            </Row>

            {/* Top Creatives */}
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col span={24}>
                <Card
                  title={
                    <Space>
                      <TrophyOutlined style={{ color: '#F59E0B' }} />
                      <Text style={{ color: '#E2E8F0' }}>Top 5 素材（按 ROAS 排序）</Text>
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
                  />
                </Card>
              </Col>
            </Row>
          </>
        )}

        {/* Weekly summary */}
        {reportType === 'weekly' && weeklyReport && (
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col span={24}>
              <Card
                title={
                  <Space>
                    <FileTextOutlined style={{ color: '#4F46E5' }} />
                    <Text style={{ color: '#E2E8F0' }}>周报摘要</Text>
                  </Space>
                }
                style={cardStyle}
              >
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Alert
                    message={`统计周期：${weeklyReport.period}`}
                    type="info"
                    showIcon
                  />
                  <Divider style={{ borderColor: '#334155' }} />
                  <Row gutter={16}>
                    <Col span={8}>
                      <Text style={{ color: '#94A3B8', display: 'block', marginBottom: 4 }}>周总花费</Text>
                      <Text style={{ color: '#E2E8F0', fontSize: 24, fontWeight: 700 }}>
                        ¥{weeklyReport.metrics.total_spend.toLocaleString()}
                      </Text>
                    </Col>
                    <Col span={8}>
                      <Text style={{ color: '#94A3B8', display: 'block', marginBottom: 4 }}>周总安装</Text>
                      <Text style={{ color: '#10B981', fontSize: 24, fontWeight: 700 }}>
                        {weeklyReport.metrics.total_installs.toLocaleString()}
                      </Text>
                    </Col>
                    <Col span={8}>
                      <Text style={{ color: '#94A3B8', display: 'block', marginBottom: 4 }}>周平均 ROAS</Text>
                      <Text style={{
                        color: weeklyReport.metrics.avg_roas >= 1 ? '#10B981' : '#EF4444',
                        fontSize: 24, fontWeight: 700,
                      }}>
                        {weeklyReport.metrics.avg_roas.toFixed(2)}x
                      </Text>
                    </Col>
                  </Row>
                </Space>
              </Card>
            </Col>
          </Row>
        )}

        {/* No data */}
        {!loading && !metrics && (
          <Card style={{ ...cardStyle, marginTop: 16, textAlign: 'center', padding: 60 }}>
            <FileTextOutlined style={{ fontSize: 48, color: '#64748B', marginBottom: 16 }} />
            <Text style={{ color: '#64748B', display: 'block' }}>暂无报告数据</Text>
            <Text style={{ color: '#475569', display: 'block', marginTop: 8, fontSize: 12 }}>
              请确认后端服务已启动，或选择其他日期查看
            </Text>
          </Card>
        )}
      </Spin>
    </div>
  );
}
