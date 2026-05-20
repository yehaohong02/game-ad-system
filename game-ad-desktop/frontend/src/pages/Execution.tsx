import { useState } from 'react';
import {
  Row, Col, Card, Button, Space, Tag, Table, Modal, Form, Input,
  Switch, Popconfirm, Typography, Badge, Tooltip,
} from 'antd';
import {
  PlayCircleOutlined, PlusOutlined, DeleteOutlined,
  SettingOutlined, ClockCircleOutlined,
  CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined,
  BulbOutlined, RobotOutlined,
} from '@ant-design/icons';
import { useExecutionStore, type ExecutionMode, type Rule, type QueueTask, type LogEntry, type AgentStep, type CompetitiveInsight } from '../stores/execution';

const { Text } = Typography;

const modeOptions: { value: ExecutionMode; label: string; desc: string; color: string }[] = [
  { value: 'manual', label: '手动', desc: '所有操作需人工确认', color: '#64748B' },
  { value: 'semi-auto', label: '半自动', desc: '规则自动执行, 高危需确认', color: '#F59E0B' },
  { value: 'full-auto', label: '全自动', desc: 'Agent自主决策执行', color: '#10B981' },
];

const levelColor: Record<string, string> = { info: '#4F46E5', warn: '#F59E0B', error: '#EF4444' };
const statusIcon: Record<string, React.ReactNode> = {
  pending: <ClockCircleOutlined style={{ color: '#64748B' }} />,
  running: <LoadingOutlined style={{ color: '#4F46E5' }} />,
  done: <CheckCircleOutlined style={{ color: '#10B981' }} />,
  failed: <CloseCircleOutlined style={{ color: '#EF4444' }} />,
};
const statusText: Record<string, string> = {
  pending: '等待', running: '执行中', done: '完成', failed: '失败',
};

const stepStatusColor: Record<string, string> = {
  done: '#10B981', running: '#4F46E5', pending: '#64748B',
};

const cardStyle = { background: '#1E293B', border: '1px solid #334155' };

export default function Execution() {
  const {
    mode, rules, queue, logs, agentSteps, insights, loading,
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

  const enabledCount = rules.filter((r: Rule) => r.enabled).length;
  const queueDone = queue.filter((q: QueueTask) => q.status === 'done').length;
  const queueRunning = queue.filter((q: QueueTask) => q.status === 'running').length;
  const queueFailed = queue.filter((q: QueueTask) => q.status === 'failed').length;

  const ruleColumns = [
    {
      title: '规则名称', dataIndex: 'name', key: 'name',
      render: (v: string) => <Text style={{ color: '#E2E8F0', fontSize: 13 }}>{v}</Text>,
    },
    {
      title: '触发条件', dataIndex: 'condition', key: 'condition', ellipsis: true,
      render: (v: string) => <Text style={{ color: '#94A3B8', fontSize: 12 }}>{v}</Text>,
    },
    {
      title: '执行动作', dataIndex: 'action', key: 'action', ellipsis: true,
      render: (v: string) => <Text style={{ color: '#94A3B8', fontSize: 12 }}>{v}</Text>,
    },
    {
      title: '状态', dataIndex: 'enabled', key: 'enabled', width: 60,
      render: (enabled: boolean, record: Rule) => (
        <Switch size="small" checked={enabled} onChange={() => toggleRule(record.rule_id)} />
      ),
    },
    {
      title: '', key: 'action', width: 32,
      render: (_: unknown, record: Rule) => (
        <Popconfirm title="删除该规则？" onConfirm={() => deleteRule(record.rule_id)} okText="删除" cancelText="取消">
          <Button type="text" danger icon={<DeleteOutlined />} size="small" style={{ padding: 0 }} />
        </Popconfirm>
      ),
    },
  ];

  const queueColumns = [
    {
      title: '任务', dataIndex: 'type', key: 'type',
      render: (v: string) => <Text style={{ color: '#E2E8F0', fontSize: 13 }}>{v}</Text>,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (s: string) => (
        <Space size={4}>
          {statusIcon[s]}
          <Text style={{ color: s === 'failed' ? '#EF4444' : s === 'running' ? '#4F46E5' : '#94A3B8', fontSize: 12 }}>
            {statusText[s]}
          </Text>
        </Space>
      ),
    },
    {
      title: '时间', dataIndex: 'created_at', key: 'created_at', width: 60,
      render: (v: string) => <Text style={{ color: '#64748B', fontSize: 12 }}>{v.split(' ')[1]}</Text>,
    },
  ];

  return (
    <div className="page-enter">
      {/* Compact header: mode + stats + run */}
      <Card style={{ ...cardStyle, marginBottom: 12 }} bodyStyle={{ padding: '12px 20px' }}>
        <Row align="middle" gutter={16}>
          <Col flex="auto">
            <Space size={16} align="center">
              <Space size={4}>
                <SettingOutlined style={{ color: '#4F46E5', fontSize: 14 }} />
                <Text style={{ color: '#94A3B8', fontSize: 13 }}>模式:</Text>
              </Space>
              {modeOptions.map((opt) => (
                <Button
                  key={opt.value}
                  size="small"
                  type={mode === opt.value ? 'primary' : 'default'}
                  ghost={mode !== opt.value}
                  onClick={() => setMode(opt.value)}
                  style={{
                    fontSize: 12,
                    height: 28,
                    borderColor: mode === opt.value ? opt.color : undefined,
                    color: mode === opt.value ? '#fff' : '#94A3B8',
                    background: mode === opt.value ? opt.color + '22' : undefined,
                  }}
                >
                  {opt.label}
                </Button>
              ))}
              <Text style={{ color: '#64748B', fontSize: 12 }}>
                {modeOptions.find((m) => m.value === mode)?.desc}
              </Text>
            </Space>
          </Col>
          <Col>
            <Space size={16}>
              <Tooltip title={`规则: ${enabledCount}/${rules.length} 启用`}>
                <Badge status={enabledCount > 0 ? 'processing' : 'default'} text={
                  <Text style={{ color: '#94A3B8', fontSize: 12 }}>{enabledCount} 规则</Text>
                } />
              </Tooltip>
              <Tooltip title={`队列: ${queueRunning}执行中 ${queueDone}完成 ${queueFailed}失败`}>
                <Space size={4}>
                  {queueRunning > 0 && <Badge count={queueRunning} size="small" style={{ backgroundColor: '#4F46E5' }} />}
                  {queueFailed > 0 && <Badge count={queueFailed} size="small" style={{ backgroundColor: '#EF4444' }} />}
                  <Text style={{ color: '#94A3B8', fontSize: 12 }}>{queue.length} 任务</Text>
                </Space>
              </Tooltip>
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                loading={loading}
                onClick={runAgent}
                style={{ height: 28, fontSize: 13 }}
              >
                运行 Agent
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Agent推理过程 + 竞品策略参考 */}
      <Row gutter={[12, 0]} style={{ marginBottom: 12 }}>
        <Col span={14}>
          <Card
            title={
              <Space size={6}>
                <RobotOutlined style={{ color: '#4F46E5', fontSize: 13 }} />
                <Text style={{ color: '#E2E8F0', fontSize: 13, fontWeight: 600 }}>Agent 推理过程</Text>
                <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>{agentSteps.length} 步</Tag>
              </Space>
            }
            style={cardStyle}
            bodyStyle={{ padding: '8px 12px' }}
          >
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              {agentSteps.map((step: AgentStep, i: number) => (
                <div key={i} style={{
                  display: 'flex', gap: 10, padding: '6px 0',
                  borderBottom: i < agentSteps.length - 1 ? '1px solid #1E293B' : 'none',
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    background: stepStatusColor[step.status] + '22',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1px solid ${stepStatusColor[step.status]}`,
                  }}>
                    <Text style={{ color: stepStatusColor[step.status], fontSize: 10, fontWeight: 700 }}>{step.step}</Text>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <Tag style={{ fontSize: 10, margin: 0, lineHeight: '16px' }} color={
                        step.status === 'running' ? 'processing' : step.status === 'done' ? 'success' : 'default'
                      }>{step.action}</Tag>
                      {step.status === 'running' && <LoadingOutlined style={{ color: '#4F46E5', fontSize: 11 }} />}
                    </div>
                    <Text style={{ color: '#94A3B8', fontSize: 12, display: 'block' }}>{step.thinking}</Text>
                    {step.result && <Text style={{ color: '#64748B', fontSize: 11 }}>→ {step.result}</Text>}
                  </div>
                </div>
              ))}
              {agentSteps.length === 0 && (
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <Text style={{ color: '#64748B', fontSize: 12 }}>暂无推理步骤，点击"运行 Agent"开始</Text>
                </div>
              )}
            </div>
          </Card>
        </Col>
        <Col span={10}>
          <Card
            title={
              <Space size={6}>
                <BulbOutlined style={{ color: '#F59E0B', fontSize: 13 }} />
                <Text style={{ color: '#E2E8F0', fontSize: 13, fontWeight: 600 }}>策略参考</Text>
                <Tag color="orange" style={{ fontSize: 10, margin: 0 }}>{insights.length}</Tag>
              </Space>
            }
            style={cardStyle}
            bodyStyle={{ padding: '8px 12px' }}
          >
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              {insights.map((ins: CompetitiveInsight, i: number) => (
                <div key={i} style={{
                  padding: '8px 10px', marginBottom: 6,
                  background: '#0F172A', borderRadius: 6,
                  border: ins.priority === 'high' ? '1px solid #EF444444' : '1px solid #334155',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Tag color={ins.priority === 'high' ? 'red' : ins.priority === 'medium' ? 'orange' : 'default'} style={{ fontSize: 10, margin: 0 }}>
                      {ins.priority === 'high' ? '高' : ins.priority === 'medium' ? '中' : '低'}
                    </Tag>
                    <Text style={{ color: '#E2E8F0', fontSize: 12, fontWeight: 600, flex: 1 }} ellipsis>{ins.title}</Text>
                  </div>
                  <Text style={{ color: '#94A3B8', fontSize: 11, display: 'block' }}>{ins.suggestion}</Text>
                  <Text style={{ color: '#475569', fontSize: 10 }}>来源: {ins.source}</Text>
                  {ins.relatedMaterials && ins.relatedMaterials.length > 0 && (
                    <div style={{ marginTop: 4 }}>
                      {ins.relatedMaterials.slice(0, 3).map((m: string) => (
                        <Tag key={m} style={{ fontSize: 9, margin: '0 2px 0 0', lineHeight: '14px' }}>{m}</Tag>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {insights.length === 0 && (
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <Text style={{ color: '#64748B', fontSize: 12 }}>暂无策略建议</Text>
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Rules table */}
      <Card
        title={
          <Space size={8}>
            <Text style={{ color: '#E2E8F0', fontSize: 14, fontWeight: 600 }}>自动化规则</Text>
            <Tag color="blue" style={{ fontSize: 11 }}>{rules.length}</Tag>
          </Space>
        }
        style={{ ...cardStyle, marginBottom: 12 }}
        bodyStyle={{ padding: '0 12px' }}
        extra={
          <Button type="primary" ghost icon={<PlusOutlined />} size="small" onClick={() => setModalOpen(true)}>
            新增
          </Button>
        }
      >
        <Table
          dataSource={rules}
          columns={ruleColumns}
          rowKey="rule_id"
          size="small"
          pagination={false}
          showHeader={false}
        />
      </Card>

      {/* Queue + Logs side by side */}
      <Row gutter={[12, 0]}>
        <Col span={8}>
          <Card
            title={
              <Space size={8}>
                <Text style={{ color: '#E2E8F0', fontSize: 14, fontWeight: 600 }}>执行队列</Text>
                <Space size={4}>
                  {queueRunning > 0 && <Tag color="processing" style={{ fontSize: 11, margin: 0 }}>{queueRunning}执行中</Tag>}
                  {queueDone > 0 && <Tag color="success" style={{ fontSize: 11, margin: 0 }}>{queueDone}完成</Tag>}
                </Space>
              </Space>
            }
            style={cardStyle}
            bodyStyle={{ padding: 0 }}
          >
            <Table
              dataSource={queue}
              columns={queueColumns}
              rowKey="task_id"
              size="small"
              pagination={false}
              showHeader={false}
              rowClassName={(r: QueueTask) => r.status === 'running' ? 'ant-table-row-selected' : ''}
            />
          </Card>
        </Col>
        <Col span={16}>
          <Card
            title={
              <Space size={8}>
                <Text style={{ color: '#E2E8F0', fontSize: 14, fontWeight: 600 }}>实时日志</Text>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  backgroundColor: '#10B981',
                  animation: 'pulse 2s infinite',
                }} />
              </Space>
            }
            style={cardStyle}
            bodyStyle={{ padding: 0 }}
          >
            <div
              style={{
                background: '#0F172A',
                padding: '8px 12px',
                height: 320,
                overflowY: 'auto',
                fontFamily: 'Consolas, Monaco, monospace',
                fontSize: 12,
                lineHeight: 1.7,
              }}
            >
              {logs.map((log: LogEntry, i: number) => (
                <div key={i} style={{ display: 'flex', gap: 8 }}>
                  <span style={{ color: '#475569', flexShrink: 0 }}>{log.timestamp}</span>
                  <span style={{
                    color: levelColor[log.level], fontWeight: 600, flexShrink: 0, width: 38,
                    textTransform: 'uppercase', fontSize: 11,
                  }}>
                    {log.level}
                  </span>
                  <span style={{ color: '#CBD5E1' }}>{log.message}</span>
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
            <Input placeholder="例如: CPI > ¥3.0 持续 2h" />
          </Form.Item>
          <Form.Item name="action" label="执行动作" rules={[{ required: true, message: '请输入执行动作' }]}>
            <Input placeholder="例如: 出价降低 15%" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
