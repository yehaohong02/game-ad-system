import { useState } from 'react';
import { Row, Col, Card, Table, Button, Space, Tag, Switch, Typography, Modal, Form, Input, Select, message, Progress, Badge, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined, WarningOutlined, SafetyOutlined, DollarOutlined, ExperimentOutlined } from '@ant-design/icons';
import { useSafetyStore, type CircuitBreaker, type RiskRule, type OperationPreview } from '../stores/safety';

const { Text } = Typography;

const cardStyle = { background: '#1E293B', border: '1px solid #334155' };

const statusConfig: Record<CircuitBreaker['status'], { color: string; label: string }> = {
  closed: { color: '#10B981', label: '正常' },
  open: { color: '#EF4444', label: '熔断' },
  'half-open': { color: '#F59E0B', label: '半开' },
};

const typeColors: Record<RiskRule['type'], string> = { budget: 'blue', rate: 'purple', bid: 'cyan' };
const typeLabels: Record<RiskRule['type'], string> = { budget: '预算', rate: '频率', bid: '出价' };

const riskColors: Record<string, string> = { low: '#10B981', medium: '#F59E0B', high: '#EF4444' };

function BudgetBar({ label, used, limit, color }: { label: string; used: number; limit: number; color: string }) {
  const percent = Math.round((used / limit) * 100);
  const danger = percent > 80;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ color: '#94A3B8', fontSize: 12 }}>{label}</Text>
        <Space size={6}>
          <Text style={{ color: '#E2E8F0', fontSize: 12, fontWeight: 600 }}>
            ¥{(used / 1000).toFixed(1)}K
          </Text>
          <Text style={{ color: '#64748B', fontSize: 11 }}>
            / ¥{(limit / 1000).toFixed(0)}K
          </Text>
          <Tag color={danger ? 'red' : percent > 50 ? 'orange' : 'green'} style={{ fontSize: 10, margin: 0, lineHeight: '16px' }}>
            {percent}%
          </Tag>
        </Space>
      </div>
      <Progress
        percent={percent}
        showInfo={false}
        strokeColor={danger ? '#EF4444' : color}
        trailColor="#334155"
        size={{ height: 6 }}
      />
    </div>
  );
}

const ruleColumns = (onToggle: (id: string) => void, onDelete: (id: string) => void) => [
  {
    title: '规则名称', dataIndex: 'name', key: 'name',
    render: (text: string) => <Text style={{ color: '#E2E8F0', fontSize: 13 }}>{text}</Text>,
  },
  {
    title: '类型', dataIndex: 'type', key: 'type', width: 56,
    render: (t: RiskRule['type']) => <Tag color={typeColors[t]} style={{ fontSize: 10, margin: 0 }}>{typeLabels[t]}</Tag>,
  },
  {
    title: '触发条件', dataIndex: 'condition', key: 'condition', ellipsis: true,
    render: (text: string) => <Text style={{ color: '#94A3B8', fontSize: 12 }}>{text}</Text>,
  },
  {
    title: '状态', dataIndex: 'enabled', key: 'enabled', width: 48,
    render: (enabled: boolean, record: RiskRule) => (
      <Switch checked={enabled} size="small" onChange={() => onToggle(record.rule_id)} />
    ),
  },
  {
    title: '', key: 'action', width: 28,
    render: (_: any, record: RiskRule) => (
      <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => onDelete(record.rule_id)} style={{ padding: 0 }} />
    ),
  },
];

const auditColumns = [
  {
    title: '时间', dataIndex: 'timestamp', key: 'timestamp', width: 56,
    render: (text: string) => <Text style={{ color: '#64748B', fontSize: 11 }}>{text.split(' ')[1]}</Text>,
  },
  {
    title: '操作', dataIndex: 'action', key: 'action', width: 64,
    render: (text: string) => <Text style={{ color: '#E2E8F0', fontSize: 12 }}>{text}</Text>,
  },
  {
    title: '用户', dataIndex: 'user', key: 'user', width: 48,
    render: (text: string) => <Text style={{ color: '#94A3B8', fontSize: 12 }}>{text}</Text>,
  },
  {
    title: '详情', dataIndex: 'detail', key: 'detail', ellipsis: true,
    render: (text: string) => <Text style={{ color: '#94A3B8', fontSize: 12 }}>{text}</Text>,
  },
  {
    title: '结果', dataIndex: 'result', key: 'result', width: 48,
    render: (result: 'success' | 'blocked') => (
      <Tag color={result === 'success' ? 'green' : 'red'} style={{ fontSize: 10, margin: 0 }}>
        {result === 'success' ? '通过' : '拦截'}
      </Tag>
    ),
  },
];

export default function Safety() {
  const { budget, circuitBreakers, rules, auditLog, operationPreviews, toggleRule, deleteRule, addRule } = useSafetyStore();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [form] = Form.useForm();

  const openCount = circuitBreakers.filter((b) => b.status === 'open').length;
  const halfOpenCount = circuitBreakers.filter((b) => b.status === 'half-open').length;
  const closedCount = circuitBreakers.length - openCount - halfOpenCount;
  const blockedToday = auditLog.filter((a) => a.result === 'blocked').length;

  const handleAddRule = () => {
    form.validateFields().then((values) => {
      addRule({ rule_id: `r${Date.now()}`, name: values.name, type: values.type, condition: values.condition, enabled: true });
      message.success('规则已添加');
      setAddModalOpen(false);
      form.resetFields();
    });
  };

  return (
    <div className="page-enter">
      {/* Compact header: budget + breaker status */}
      <Card style={{ ...cardStyle, marginBottom: 12 }} bodyStyle={{ padding: '12px 20px' }}>
        <Row gutter={24} align="middle">
          <Col span={10}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <DollarOutlined style={{ color: '#F59E0B', fontSize: 14 }} />
              <Text style={{ color: '#E2E8F0', fontSize: 13, fontWeight: 600 }}>预算控制</Text>
            </div>
            <BudgetBar label="日预算" used={budget.dailyUsed} limit={budget.dailyLimit} color="#4F46E5" />
            <BudgetBar label="月预算" used={budget.monthlyUsed} limit={budget.monthlyLimit} color="#8B5CF6" />
          </Col>
          <Col span={1}>
            <div style={{ width: 1, height: 60, background: '#334155', margin: '0 auto' }} />
          </Col>
          <Col span={6}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <SafetyOutlined style={{ color: '#4F46E5', fontSize: 14 }} />
              <Text style={{ color: '#E2E8F0', fontSize: 13, fontWeight: 600 }}>熔断器</Text>
              <Text style={{ color: '#64748B', fontSize: 12 }}>{circuitBreakers.length} 个</Text>
            </div>
            <Space size={12} wrap>
              <Tooltip title="正常运行">
                <Badge status="success" text={<Text style={{ color: '#10B981', fontSize: 13, fontWeight: 600 }}>{closedCount}</Text>} />
              </Tooltip>
              <Tooltip title="半开状态（等待恢复）">
                <Badge status="warning" text={<Text style={{ color: '#F59E0B', fontSize: 13, fontWeight: 600 }}>{halfOpenCount}</Text>} />
              </Tooltip>
              <Tooltip title="已熔断（需人工介入）">
                <Badge status="error" text={<Text style={{ color: '#EF4444', fontSize: 13, fontWeight: 600 }}>{openCount}</Text>} />
              </Tooltip>
            </Space>
            <div style={{ marginTop: 10 }}>
              {circuitBreakers.filter((cb) => cb.status !== 'closed').map((cb) => {
                const cfg = statusConfig[cb.status];
                return (
                  <div key={cb.operation} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: cfg.color }} />
                    <Text style={{ color: '#CBD5E1', fontSize: 12, flex: 1 }} ellipsis>{cb.operation}</Text>
                    <Text style={{ color: '#64748B', fontSize: 11 }}>{cb.failures}/{cb.threshold}</Text>
                  </div>
                );
              })}
              {openCount === 0 && halfOpenCount === 0 && (
                <Text style={{ color: '#64748B', fontSize: 12 }}>所有熔断器正常运行</Text>
              )}
            </div>
          </Col>
          <Col span={1}>
            <div style={{ width: 1, height: 60, background: '#334155', margin: '0 auto' }} />
          </Col>
          <Col span={6}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <WarningOutlined style={{ color: '#F59E0B', fontSize: 14 }} />
              <Text style={{ color: '#E2E8F0', fontSize: 13, fontWeight: 600 }}>今日风控</Text>
            </div>
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#E2E8F0', fontSize: 24, fontWeight: 700 }}>{rules.filter((r) => r.enabled).length}</div>
                  <div style={{ color: '#64748B', fontSize: 11 }}>活跃规则</div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: blockedToday > 0 ? '#EF4444' : '#10B981', fontSize: 24, fontWeight: 700 }}>{blockedToday}</div>
                  <div style={{ color: '#64748B', fontSize: 11 }}>拦截操作</div>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {/* 操作预演 */}
      {operationPreviews.length > 0 && (
        <Card
          title={
            <Space size={6}>
              <ExperimentOutlined style={{ color: '#8B5CF6', fontSize: 13 }} />
              <Text style={{ color: '#E2E8F0', fontSize: 13, fontWeight: 600 }}>操作预演</Text>
              <Tag color="purple" style={{ fontSize: 10, margin: 0 }}>{operationPreviews.length} 模拟</Tag>
            </Space>
          }
          style={{ ...cardStyle, marginBottom: 12 }}
          bodyStyle={{ padding: '8px 12px' }}
        >
          <Row gutter={12}>
            {operationPreviews.map((preview: OperationPreview, i: number) => (
              <Col span={Math.floor(24 / operationPreviews.length) || 12} key={i}>
                <div style={{
                  background: '#0F172A', borderRadius: 6, padding: '10px 12px',
                  border: preview.riskLevel === 'high' ? '1px solid #EF444444' : '1px solid #334155',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Tag color={preview.riskLevel === 'high' ? 'red' : preview.riskLevel === 'medium' ? 'orange' : 'green'} style={{ fontSize: 10, margin: 0 }}>
                      {preview.riskLevel === 'high' ? '高风险' : preview.riskLevel === 'medium' ? '中风险' : '低风险'}
                    </Tag>
                    <Text style={{ color: '#E2E8F0', fontSize: 12, fontWeight: 600 }}>{preview.action}</Text>
                  </div>
                  <Row gutter={8} style={{ marginBottom: 6 }}>
                    <Col span={12}>
                      <Text style={{ color: '#64748B', fontSize: 10, display: 'block' }}>当前</Text>
                      <Text style={{ color: '#94A3B8', fontSize: 14, fontWeight: 600 }}>¥{preview.currentBudget.toLocaleString()}</Text>
                    </Col>
                    <Col span={12}>
                      <Text style={{ color: '#64748B', fontSize: 10, display: 'block' }}>预估</Text>
                      <Text style={{ color: riskColors[preview.riskLevel], fontSize: 14, fontWeight: 600 }}>¥{preview.projectedBudget.toLocaleString()}</Text>
                    </Col>
                  </Row>
                  <Text style={{ color: '#64748B', fontSize: 11 }}>{preview.recommendation}</Text>
                </div>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* Rules + Audit side by side */}
      <Row gutter={[12, 0]}>
        <Col span={10}>
          <Card
            title={
              <Space size={8}>
                <Text style={{ color: '#E2E8F0', fontSize: 14, fontWeight: 600 }}>风控规则</Text>
                <Tag color="blue" style={{ fontSize: 11, margin: 0 }}>{rules.length}</Tag>
              </Space>
            }
            style={cardStyle}
            bodyStyle={{ padding: 0 }}
            extra={
              <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>
                添加
              </Button>
            }
          >
            <Table
              dataSource={rules}
              columns={ruleColumns(toggleRule, deleteRule)}
              rowKey="rule_id"
              pagination={false}
              size="small"
              showHeader={false}
            />
          </Card>
        </Col>
        <Col span={14}>
          <Card
            title={
              <Space size={8}>
                <Text style={{ color: '#E2E8F0', fontSize: 14, fontWeight: 600 }}>操作审计日志</Text>
                <Tag color="blue" style={{ fontSize: 11, margin: 0 }}>{auditLog.length}</Tag>
                {blockedToday > 0 && <Tag color="red" style={{ fontSize: 11, margin: 0 }}>{blockedToday} 拦截</Tag>}
              </Space>
            }
            style={cardStyle}
            bodyStyle={{ padding: 0 }}
          >
            <Table
              dataSource={auditLog}
              columns={auditColumns}
              rowKey={(_, idx) => String(idx)}
              pagination={false}
              size="small"
              showHeader={false}
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
            <Input placeholder="如：日花费 > ¥50,000" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
