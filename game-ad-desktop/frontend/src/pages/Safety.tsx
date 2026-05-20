import { useState } from 'react';
import { Row, Col, Card, Table, Button, Space, Tag, Switch, Statistic, Typography, Modal, Form, Input, Select, message } from 'antd';
import { PlusOutlined, DeleteOutlined, CheckCircleOutlined, CloseCircleOutlined, WarningOutlined, SafetyOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useSafetyStore, type CircuitBreaker, type RiskRule } from '../stores/safety';

const { Text } = Typography;

const cardStyle = { background: '#1E293B', border: '1px solid #334155' };

const statusConfig: Record<CircuitBreaker['status'], { color: string; label: string; icon: React.ReactNode }> = {
  closed: { color: '#10B981', label: '正常', icon: <CheckCircleOutlined /> },
  open: { color: '#EF4444', label: '熔断', icon: <CloseCircleOutlined /> },
  'half-open': { color: '#F59E0B', label: '半开', icon: <WarningOutlined /> },
};

const typeColors: Record<RiskRule['type'], string> = {
  budget: 'blue',
  rate: 'purple',
  bid: 'cyan',
};

const typeLabels: Record<RiskRule['type'], string> = {
  budget: '预算',
  rate: '频率',
  bid: '出价',
};

function createRingOption(title: string, used: number, limit: number, color: string) {
  const percent = Math.round((used / limit) * 100);
  return {
    backgroundColor: 'transparent',
    series: [
      {
        type: 'pie',
        radius: ['60%', '80%'],
        avoidLabelOverlap: false,
        label: {
          show: true,
          position: 'center',
          formatter: `{a|${percent}%}\n{b|$${(used / 1000).toFixed(1)}K}`,
          rich: {
            a: { fontSize: 22, fontWeight: 'bold', color: '#E2E8F0', lineHeight: 30 },
            b: { fontSize: 12, color: '#94A3B8', lineHeight: 20 },
          },
        },
        labelLine: { show: false },
        data: [
          { value: used, name: '已用', itemStyle: { color } },
          { value: limit - used, name: '剩余', itemStyle: { color: '#334155' } },
        ],
        emphasis: { disabled: true },
      },
    ],
    graphic: [
      {
        type: 'text',
        left: 'center',
        bottom: 10,
        style: { text: title, fill: '#64748B', fontSize: 13 },
      },
    ],
  };
}

const ruleColumns = (
  onToggle: (id: string) => void,
  onDelete: (id: string) => void,
) => [
  {
    title: '规则名称',
    dataIndex: 'name',
    key: 'name',
    render: (text: string) => <Text style={{ color: '#E2E8F0' }}>{text}</Text>,
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    width: 80,
    render: (t: RiskRule['type']) => <Tag color={typeColors[t]}>{typeLabels[t]}</Tag>,
  },
  {
    title: '触发条件',
    dataIndex: 'condition',
    key: 'condition',
    render: (text: string) => <Text style={{ color: '#94A3B8' }}>{text}</Text>,
  },
  {
    title: '状态',
    dataIndex: 'enabled',
    key: 'enabled',
    width: 80,
    render: (enabled: boolean, record: RiskRule) => (
      <Switch
        checked={enabled}
        size="small"
        onChange={() => onToggle(record.rule_id)}
      />
    ),
  },
  {
    title: '操作',
    key: 'action',
    width: 60,
    render: (_: any, record: RiskRule) => (
      <Button
        type="text"
        danger
        size="small"
        icon={<DeleteOutlined />}
        onClick={() => onDelete(record.rule_id)}
      />
    ),
  },
];

const auditColumns = [
  {
    title: '时间',
    dataIndex: 'timestamp',
    key: 'timestamp',
    width: 170,
    render: (text: string) => <Text style={{ color: '#64748B', fontSize: 12 }}>{text}</Text>,
  },
  {
    title: '操作',
    dataIndex: 'action',
    key: 'action',
    width: 100,
    render: (text: string) => <Text style={{ color: '#E2E8F0' }}>{text}</Text>,
  },
  {
    title: '用户',
    dataIndex: 'user',
    key: 'user',
    width: 80,
    render: (text: string) => <Text style={{ color: '#94A3B8' }}>{text}</Text>,
  },
  {
    title: '详情',
    dataIndex: 'detail',
    key: 'detail',
    render: (text: string) => <Text style={{ color: '#94A3B8' }}>{text}</Text>,
  },
  {
    title: '结果',
    dataIndex: 'result',
    key: 'result',
    width: 90,
    render: (result: 'success' | 'blocked') => (
      <Tag color={result === 'success' ? 'green' : 'red'}>
        {result === 'success' ? '通过' : '拦截'}
      </Tag>
    ),
  },
];

export default function Safety() {
  const { budget, circuitBreakers, rules, auditLog, toggleRule, deleteRule, addRule } = useSafetyStore();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form] = Form.useForm();

  const dailyPercent = Math.round((budget.dailyUsed / budget.dailyLimit) * 100);
  const monthlyPercent = Math.round((budget.monthlyUsed / budget.monthlyLimit) * 100);
  const openBreakers = circuitBreakers.filter((b) => b.status === 'open').length;
  const halfOpenBreakers = circuitBreakers.filter((b) => b.status === 'half-open').length;

  const dailyOption = createRingOption('日预算使用率', budget.dailyUsed, budget.dailyLimit, '#4F46E5');
  const monthlyOption = createRingOption('月预算使用率', budget.monthlyUsed, budget.monthlyLimit, '#8B5CF6');

  const handleAddRule = () => {
    form.validateFields().then((values) => {
      addRule({
        rule_id: `r${Date.now()}`,
        name: values.name,
        type: values.type,
        condition: values.condition,
        enabled: true,
      });
      message.success('规则已添加');
      setAddModalOpen(false);
      form.resetFields();
    });
  };

  return (
    <div className="page-enter">
      <Row gutter={[16, 16]}>
        {/* Budget Ring Charts */}
        <Col span={8}>
          <Card style={cardStyle}>
            <Statistic
              title={<span style={{ color: '#94A3B8' }}>日预算</span>}
              value={budget.dailyUsed}
              prefix="$"
              suffix={<span style={{ fontSize: 14, color: '#64748B' }}>/ ${budget.dailyLimit.toLocaleString()}</span>}
              valueStyle={{ color: '#E2E8F0' }}
            />
            <ReactECharts option={dailyOption} style={{ height: 200 }} />
            <div style={{ textAlign: 'center', marginTop: -12 }}>
              <Tag color={dailyPercent > 80 ? 'red' : dailyPercent > 50 ? 'orange' : 'green'}>
                {dailyPercent}% 已使用
              </Tag>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card style={cardStyle}>
            <Statistic
              title={<span style={{ color: '#94A3B8' }}>月预算</span>}
              value={budget.monthlyUsed}
              prefix="$"
              suffix={<span style={{ fontSize: 14, color: '#64748B' }}>/ ${budget.monthlyLimit.toLocaleString()}</span>}
              valueStyle={{ color: '#E2E8F0' }}
            />
            <ReactECharts option={monthlyOption} style={{ height: 200 }} />
            <div style={{ textAlign: 'center', marginTop: -12 }}>
              <Tag color={monthlyPercent > 80 ? 'red' : monthlyPercent > 50 ? 'orange' : 'green'}>
                {monthlyPercent}% 已使用
              </Tag>
            </div>
          </Card>
        </Col>

        {/* Circuit Breaker Summary */}
        <Col span={8}>
          <Card
            title={<Space><SafetyOutlined style={{ color: '#4F46E5' }} /><span style={{ color: '#E2E8F0' }}>熔断器状态</span></Space>}
            style={cardStyle}
          >
            <Row gutter={[8, 8]}>
              <Col span={8}>
                <Card size="small" style={{ ...cardStyle, textAlign: 'center' }}>
                  <Statistic
                    title={<span style={{ color: '#64748B', fontSize: 12 }}>正常</span>}
                    value={circuitBreakers.length - openBreakers - halfOpenBreakers}
                    valueStyle={{ color: '#10B981', fontSize: 28 }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ ...cardStyle, textAlign: 'center' }}>
                  <Statistic
                    title={<span style={{ color: '#64748B', fontSize: 12 }}>熔断</span>}
                    value={openBreakers}
                    valueStyle={{ color: '#EF4444', fontSize: 28 }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ ...cardStyle, textAlign: 'center' }}>
                  <Statistic
                    title={<span style={{ color: '#64748B', fontSize: 12 }}>半开</span>}
                    value={halfOpenBreakers}
                    valueStyle={{ color: '#F59E0B', fontSize: 28 }}
                  />
                </Card>
              </Col>
            </Row>
            <div style={{ marginTop: 16 }}>
              {circuitBreakers.map((cb) => {
                const cfg = statusConfig[cb.status];
                return (
                  <div
                    key={cb.operation}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 0',
                      borderBottom: '1px solid #334155',
                    }}
                  >
                    <Space>
                      <span style={{ color: cfg.color, fontSize: 16 }}>{cfg.icon}</span>
                      <Text style={{ color: '#E2E8F0', fontSize: 13 }}>{cb.operation}</Text>
                    </Space>
                    <Space size={4}>
                      <Text style={{ color: '#64748B', fontSize: 12 }}>
                        {cb.failures}/{cb.threshold}
                      </Text>
                      <Tag
                        color={cfg.color}
                        style={{ margin: 0, fontSize: 11 }}
                      >
                        {cfg.label}
                      </Tag>
                    </Space>
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* Risk Rules Table */}
        <Col span={12}>
          <Card
            title={<span style={{ color: '#E2E8F0' }}>风控规则</span>}
            style={cardStyle}
            extra={
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => setAddModalOpen(true)}
              >
                添加规则
              </Button>
            }
          >
            <Table
              dataSource={rules}
              columns={ruleColumns(toggleRule, deleteRule)}
              rowKey="rule_id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        {/* Audit Log Table */}
        <Col span={12}>
          <Card
            title={<span style={{ color: '#E2E8F0' }}>操作审计日志</span>}
            style={cardStyle}
          >
            <Table
              dataSource={auditLog}
              columns={auditColumns}
              rowKey={(_, idx) => String(idx)}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* Add Rule Modal */}
      <Modal
        title="添加风控规则"
        open={addModalOpen}
        onOk={handleAddRule}
        onCancel={() => { setAddModalOpen(false); form.resetFields(); }}
        okText="添加"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="规则名称" rules={[{ required: true, message: '请输入规则名称' }]}>
            <Input placeholder="如：单日预算上限" />
          </Form.Item>
          <Form.Item name="type" label="规则类型" rules={[{ required: true, message: '请选择类型' }]}>
            <Select placeholder="选择类型">
              <Select.Option value="budget">预算</Select.Option>
              <Select.Option value="rate">频率</Select.Option>
              <Select.Option value="bid">出价</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="condition" label="触发条件" rules={[{ required: true, message: '请输入条件' }]}>
            <Input placeholder="如：日花费 > $10,000" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
