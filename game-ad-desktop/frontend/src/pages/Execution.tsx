import { useState } from 'react';
import {
  Row, Col, Card, Button, Space, Tag, Table, Modal, Form, Input,
  Radio, Switch, Popconfirm, Typography,
} from 'antd';
import {
  PlayCircleOutlined, PlusOutlined, DeleteOutlined,
  ThunderboltOutlined, SettingOutlined, UnorderedListOutlined,
} from '@ant-design/icons';
import { useExecutionStore, type ExecutionMode, type Rule } from '../stores/execution';

const { Text } = Typography;

const modeOptions: { value: ExecutionMode; label: string; desc: string }[] = [
  { value: 'manual', label: '手动模式', desc: '所有操作需人工确认后执行' },
  { value: 'semi-auto', label: '半自动模式', desc: '规则命中后自动执行, 高危操作需确认' },
  { value: 'full-auto', label: '全自动模式', desc: 'Agent 自主决策并执行全部操作' },
];

const levelColor: Record<string, string> = { info: '#4F46E5', warn: '#F59E0B', error: '#EF4444' };
const statusMap: Record<string, { color: string; text: string }> = {
  pending: { color: 'default', text: '等待中' },
  running: { color: 'processing', text: '执行中' },
  done: { color: 'success', text: '已完成' },
  failed: { color: 'error', text: '失败' },
};

export default function Execution() {
  const {
    mode, rules, queue, logs, loading,
    setMode, addRule, toggleRule, deleteRule, runAgent,
  } = useExecutionStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const handleAddRule = () => {
    form.validateFields().then((values) => {
      addRule({ ...values, enabled: true });
      form.resetFields();
      setModalOpen(false);
    });
  };

  const ruleColumns = [
    { title: '规则名称', dataIndex: 'name', key: 'name', render: (v: string) => <Text style={{ color: '#E2E8F0' }}>{v}</Text> },
    { title: '触发条件', dataIndex: 'condition', key: 'condition', render: (v: string) => <Text style={{ color: '#94A3B8' }}>{v}</Text> },
    { title: '执行动作', dataIndex: 'action', key: 'action', render: (v: string) => <Text style={{ color: '#94A3B8' }}>{v}</Text> },
    {
      title: '状态', dataIndex: 'enabled', key: 'enabled', width: 80,
      render: (enabled: boolean, record: Rule) => (
        <Switch size="small" checked={enabled} onChange={() => toggleRule(record.rule_id)} />
      ),
    },
    {
      title: '操作', key: 'action', width: 60,
      render: (_: unknown, record: Rule) => (
        <Popconfirm title="确认删除该规则？" onConfirm={() => deleteRule(record.rule_id)} okText="删除" cancelText="取消">
          <Button type="text" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      ),
    },
  ];

  const queueColumns = [
    { title: '任务ID', dataIndex: 'task_id', key: 'task_id', render: (v: string) => <Text style={{ color: '#94A3B8' }} code>{v}</Text> },
    { title: '类型', dataIndex: 'type', key: 'type', render: (v: string) => <Text style={{ color: '#E2E8F0' }}>{v}</Text> },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (s: string) => <Tag color={statusMap[s]?.color}>{statusMap[s]?.text}</Tag>,
    },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', render: (v: string) => <Text style={{ color: '#64748B' }}>{v}</Text> },
  ];

  const cardStyle = { background: '#1E293B', border: '1px solid #334155' };

  return (
    <div className="page-enter">
      {/* Top row: Mode selector + Run Agent */}
      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Card
            title={<Space><SettingOutlined /> 执行模式</Space>}
            style={cardStyle}
          >
            <Radio.Group value={mode} onChange={(e) => setMode(e.target.value as ExecutionMode)}>
              <Space direction="vertical" size={12}>
                {modeOptions.map((opt) => (
                  <Radio key={opt.value} value={opt.value} style={{ color: '#E2E8F0' }}>
                    <span style={{ color: '#E2E8F0', fontWeight: 500 }}>{opt.label}</span>
                    <br />
                    <span style={{ color: '#64748B', fontSize: 12 }}>{opt.desc}</span>
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ ...cardStyle, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
            <ThunderboltOutlined style={{ fontSize: 40, color: '#4F46E5', marginBottom: 16 }} />
            <div style={{ color: '#94A3B8', marginBottom: 16 }}>当前模式: {modeOptions.find((m) => m.value === mode)?.label}</div>
            <Button
              type="primary"
              size="large"
              icon={<PlayCircleOutlined />}
              loading={loading}
              onClick={runAgent}
              block
            >
              运行 Agent
            </Button>
          </Card>
        </Col>
      </Row>

      {/* Rules section */}
      <Card
        title={<Space><UnorderedListOutlined /> 自动化规则</Space>}
        style={{ ...cardStyle, marginTop: 16 }}
        extra={
          <Button type="primary" ghost icon={<PlusOutlined />} size="small" onClick={() => setModalOpen(true)}>
            新增规则
          </Button>
        }
      >
        <Table
          dataSource={rules}
          columns={ruleColumns}
          rowKey="rule_id"
          size="small"
          pagination={false}
        />
      </Card>

      {/* Queue + Logs */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="执行队列" style={cardStyle}>
            <Table
              dataSource={queue}
              columns={queueColumns}
              rowKey="task_id"
              size="small"
              pagination={false}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="实时日志" style={cardStyle}>
            <div
              style={{
                background: '#0F172A',
                borderRadius: 8,
                padding: 16,
                height: 320,
                overflowY: 'auto',
                fontFamily: 'Consolas, Monaco, monospace',
                fontSize: 13,
                lineHeight: 1.8,
              }}
            >
              {logs.map((log, i) => (
                <div key={i}>
                  <span style={{ color: '#64748B' }}>{log.timestamp}</span>
                  {' '}
                  <span style={{ color: levelColor[log.level], fontWeight: 500, textTransform: 'uppercase' }}>
                    [{log.level}]
                  </span>
                  {' '}
                  <span style={{ color: '#E2E8F0' }}>{log.message}</span>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Add Rule Modal */}
      <Modal
        title="新增自动化规则"
        open={modalOpen}
        onOk={handleAddRule}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        okText="创建"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="规则名称" rules={[{ required: true, message: '请输入规则名称' }]}>
            <Input placeholder="例如: CPI超限自动降价" />
          </Form.Item>
          <Form.Item name="condition" label="触发条件" rules={[{ required: true, message: '请输入触发条件' }]}>
            <Input placeholder="例如: CPI > $3.0 持续 2h" />
          </Form.Item>
          <Form.Item name="action" label="执行动作" rules={[{ required: true, message: '请输入执行动作' }]}>
            <Input placeholder="例如: 出价降低 15%" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
