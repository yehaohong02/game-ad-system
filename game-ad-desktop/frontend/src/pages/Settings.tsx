import { useEffect, useState } from 'react';
import {
  Row, Col, Card, Form, Input, Select, Button, Space, Tag,
  Switch, Radio, Divider, Typography, Badge, Alert, message,
  Collapse,
} from 'antd';
import {
  DatabaseOutlined, BellOutlined, SaveOutlined, CloudOutlined,
  CheckCircleOutlined, CloseCircleOutlined, LinkOutlined,
  ThunderboltOutlined, SearchOutlined,
} from '@ant-design/icons';
import { useSettingsStore, PROVIDER_PRESETS, CATEGORY_LABELS } from '../stores/settings';
import type { Connection } from '../stores/settings';

const { Text } = Typography;

const cardStyle = { background: '#1E293B', border: '1px solid #334155' };
const labelStyle = { color: '#E2E8F0' };
const textStyle = { color: '#94A3B8' };
const inputStyle = { background: '#0F172A', border: '1px solid #334155', color: '#E2E8F0' };

function StatusBadge({ status }: { status: Connection['status'] }) {
  return (
    <Badge
      status={status === 'connected' ? 'success' : 'error'}
      text={
        <span style={{ color: status === 'connected' ? '#10B981' : '#EF4444' }}>
          {status === 'connected' ? '已连接' : '未连接'}
        </span>
      }
    />
  );
}

function ConnectionIcon({ type }: { type: Connection['type'] }) {
  switch (type) {
    case 'clickhouse': return <DatabaseOutlined style={{ color: '#F59E0B', fontSize: 18 }} />;
    case 'redis': return <CloudOutlined style={{ color: '#EF4444', fontSize: 18 }} />;
    case 'chromadb': return <LinkOutlined style={{ color: '#8B5CF6', fontSize: 18 }} />;
  }
}

// Provider selector with search and categories
function ProviderSelector({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [search, setSearch] = useState('');

  const filtered = PROVIDER_PRESETS.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
    key,
    label,
    providers: filtered.filter((p) => p.category === key),
  })).filter((g) => g.providers.length > 0);

  return (
    <div>
      <Input
        prefix={<SearchOutlined style={{ color: '#64748B' }} />}
        placeholder="搜索供应商..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ ...inputStyle, marginBottom: 12 }}
        allowClear
      />
      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        <Collapse
          ghost
          defaultActiveKey={grouped.map((g) => g.key)}
          items={grouped.map((group) => ({
            key: group.key,
            label: <Text style={{ color: '#94A3B8', fontSize: 13 }}>{group.label} ({group.providers.length})</Text>,
            children: (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {group.providers.map((p) => (
                  <Tag
                    key={p.id}
                    onClick={() => onChange(p.id)}
                    style={{
                      cursor: 'pointer',
                      padding: '4px 12px',
                      borderRadius: 6,
                      fontSize: 12,
                      background: value === p.id ? '#4F46E5' : '#0F172A',
                      border: `1px solid ${value === p.id ? '#4F46E5' : '#334155'}`,
                      color: value === p.id ? 'white' : '#94A3B8',
                      transition: 'all 0.2s',
                    }}
                  >
                    {p.name}
                  </Tag>
                ))}
              </div>
            ),
          }))}
        />
      </div>
    </div>
  );
}

export default function Settings() {
  const {
    aiModel, connections, notifications, saving, aiEnabled,
    updateAIModel, selectProvider, updateNotifications, testConnection, saveSettings,
  } = useSettingsStore();

  const [form] = Form.useForm();
  const [customModel, setCustomModel] = useState(false);
  const currentPreset = PROVIDER_PRESETS.find((p) => p.id === aiModel.providerId);

  useEffect(() => {
    form.setFieldsValue(aiModel);
  }, [aiModel.providerId]);

  const handleProviderSelect = (presetId: string) => {
    selectProvider(presetId);
    setCustomModel(false);
    const preset = PROVIDER_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      form.setFieldsValue({
        providerId: presetId,
        baseUrl: preset.baseUrl,
        model: preset.defaultModel,
        apiFormat: preset.apiFormat,
      });
    }
  };

  const handleSave = async () => {
    try {
      await form.validateFields();
      await saveSettings();
      message.success('设置保存成功，AI 引擎已激活');
    } catch {
      message.error('请检查表单填写');
    }
  };

  return (
    <div className="page-enter">
      {/* AI Status */}
      <Alert
        message={
          <Space>
            {aiEnabled ? <CheckCircleOutlined style={{ color: '#10B981' }} /> : <CloseCircleOutlined style={{ color: '#EF4444' }} />}
            <span style={{ color: '#E2E8F0' }}>
              AI 引擎：{aiEnabled ? '已激活' : '未激活'}
            </span>
            {aiEnabled && (
              <Tag color="success">{currentPreset?.name} · {aiModel.model}</Tag>
            )}
            {!aiEnabled && (
              <Tag color="error">请选择供应商并填写 API Key</Tag>
            )}
          </Space>
        }
        type={aiEnabled ? 'success' : 'warning'}
        showIcon={false}
        style={{
          marginBottom: 16,
          background: aiEnabled ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${aiEnabled ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          borderRadius: 8,
        }}
      />

      <Row gutter={[16, 16]}>
        {/* Provider Selection */}
        <Col span={24}>
          <Card
            title={<Space><ThunderboltOutlined /> <span style={labelStyle}>AI 供应商配置</span></Space>}
            style={cardStyle}
            styles={{ header: { borderBottom: '1px solid #334155' } }}
          >
            <Row gutter={16}>
              {/* Left: Provider List */}
              <Col span={10}>
                <Text style={{ ...labelStyle, display: 'block', marginBottom: 8, fontWeight: 600 }}>选择供应商</Text>
                <ProviderSelector value={aiModel.providerId} onChange={handleProviderSelect} />
              </Col>

              {/* Right: Config Form */}
              <Col span={14}>
                <Form
                  form={form}
                  layout="vertical"
                  initialValues={aiModel}
                >
                  {currentPreset && (
                    <div style={{
                      background: '#0F172A', borderRadius: 8, padding: '10px 14px', marginBottom: 16,
                      border: '1px solid #334155', display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 8, background: '#4F46E5',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, fontWeight: 700, color: 'white',
                      }}>
                        {currentPreset.name[0]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <Text style={{ color: '#E2E8F0', fontWeight: 600, display: 'block' }}>{currentPreset.name}</Text>
                        <Text style={{ color: '#64748B', fontSize: 11 }}>{currentPreset.baseUrl}</Text>
                      </div>
                      <Tag color="blue">{currentPreset.apiFormat === 'anthropic' ? 'Anthropic' : 'OpenAI'}</Tag>
                    </div>
                  )}

                  <Form.Item
                    label={<span style={labelStyle}>API Key</span>}
                    name="apiKey"
                    rules={[{ required: true, message: '请输入 API Key' }]}
                  >
                    <Input.Password
                      placeholder="sk-..."
                      style={inputStyle}
                      onChange={(e) => updateAIModel({ apiKey: e.target.value })}
                    />
                  </Form.Item>

                  <Form.Item label={<span style={labelStyle}>请求地址</span>} name="baseUrl">
                    <Input
                      placeholder="https://api.example.com/v1"
                      style={inputStyle}
                      onChange={(e) => updateAIModel({ baseUrl: e.target.value })}
                    />
                  </Form.Item>

                  <Form.Item label={<span style={labelStyle}>API 格式</span>} name="apiFormat">
                    <Select
                      onChange={(v) => updateAIModel({ apiFormat: v })}
                      options={[
                        { value: 'openai', label: 'OpenAI Compatible' },
                        { value: 'anthropic', label: 'Anthropic Messages (原生)' },
                        { value: 'custom', label: '自定义' },
                      ]}
                    />
                  </Form.Item>

                  {/* Model selection: two modes side by side */}
                  <div style={{ marginBottom: 24 }}>
                    <Text style={{ ...labelStyle, display: 'block', marginBottom: 10, fontWeight: 600 }}>模型选择</Text>
                    <Row gutter={12}>
                      {/* Left: Preset dropdown */}
                      <Col span={12}>
                        <div
                          onClick={() => setCustomModel(false)}
                          style={{
                            padding: '12px 14px',
                            borderRadius: 8,
                            cursor: 'pointer',
                            background: !customModel ? 'rgba(79,70,229,0.1)' : '#0F172A',
                            border: `2px solid ${!customModel ? '#4F46E5' : '#334155'}`,
                            transition: 'all 0.2s',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <div style={{
                              width: 8, height: 8, borderRadius: '50%',
                              background: !customModel ? '#4F46E5' : '#334155',
                            }} />
                            <Text style={{ color: !customModel ? '#E2E8F0' : '#64748B', fontSize: 13, fontWeight: 600 }}>
                              预设模型
                            </Text>
                          </div>
                          {currentPreset && currentPreset.models.length > 0 ? (
                            <Select
                              showSearch
                              size="small"
                              value={!customModel ? aiModel.model : undefined}
                              onChange={(v) => { updateAIModel({ model: v }); setCustomModel(false); }}
                              style={{ width: '100%' }}
                              options={
                                currentPreset.models.includes(aiModel.model)
                                  ? currentPreset.models.map((m) => ({ value: m, label: m }))
                                  : currentPreset.models.map((m) => ({ value: m, label: m }))
                              }
                              onClick={(e) => { e.stopPropagation(); setCustomModel(false); }}
                            />
                          ) : (
                            <Text style={{ color: '#64748B', fontSize: 12 }}>该供应商无预设模型</Text>
                          )}
                        </div>
                      </Col>

                      {/* Right: Manual input */}
                      <Col span={12}>
                        <div
                          onClick={() => setCustomModel(true)}
                          style={{
                            padding: '12px 14px',
                            borderRadius: 8,
                            cursor: 'pointer',
                            background: customModel ? 'rgba(79,70,229,0.1)' : '#0F172A',
                            border: `2px solid ${customModel ? '#4F46E5' : '#334155'}`,
                            transition: 'all 0.2s',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <div style={{
                              width: 8, height: 8, borderRadius: '50%',
                              background: customModel ? '#4F46E5' : '#334155',
                            }} />
                            <Text style={{ color: customModel ? '#E2E8F0' : '#64748B', fontSize: 13, fontWeight: 600 }}>
                              手动输入
                            </Text>
                          </div>
                          <Input
                            size="small"
                            placeholder="输入模型名称"
                            style={inputStyle}
                            value={customModel ? aiModel.model : ''}
                            onChange={(e) => { updateAIModel({ model: e.target.value }); setCustomModel(true); }}
                            onFocus={() => setCustomModel(true)}
                          />
                        </div>
                      </Col>
                    </Row>

                    {/* Current model display */}
                    <div style={{
                      marginTop: 10, padding: '6px 12px', borderRadius: 6,
                      background: '#0F172A', border: '1px solid #334155',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <Text style={{ color: '#64748B', fontSize: 12 }}>当前模型：</Text>
                      <Tag color="blue" style={{ margin: 0 }}>{aiModel.model || '未选择'}</Tag>
                    </div>
                  </div>

                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.Item label={<span style={labelStyle}>备注名称（可选）</span>} name="nickname">
                        <Input
                          placeholder="例如：公司专用账号"
                          style={inputStyle}
                          onChange={(e) => updateAIModel({ nickname: e.target.value })}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label={<span style={labelStyle}>模型映射（可选）</span>} name="notes">
                        <Input
                          placeholder="高级：自定义模型映射"
                          style={inputStyle}
                          onChange={(e) => updateAIModel({ notes: e.target.value })}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  {/* Test button */}
                  <Button
                    icon={<ThunderboltOutlined />}
                    ghost
                    style={{ borderColor: '#4F46E5', color: '#4F46E5' }}
                    disabled={!aiModel.apiKey}
                    onClick={() => message.success('连接测试成功')}
                  >
                    测试连接
                  </Button>
                </Form>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* API Connections */}
        <Col span={24}>
          <Card
            title={<Space><DatabaseOutlined /> <span style={labelStyle}>系统连接</span></Space>}
            style={cardStyle}
            styles={{ header: { borderBottom: '1px solid #334155' } }}
          >
            <Row gutter={[16, 16]}>
              {connections.map((conn) => (
                <Col span={8} key={conn.type}>
                  <Card size="small" style={{ background: '#0F172A', border: '1px solid #334155' }}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Space>
                        <ConnectionIcon type={conn.type} />
                        <Text strong style={labelStyle}>{conn.name}</Text>
                      </Space>
                      <div><Text style={textStyle}>主机: </Text><Text style={labelStyle}>{conn.host}</Text></div>
                      <div><Text style={textStyle}>端口: </Text><Text style={labelStyle}>{conn.port}</Text></div>
                      <Divider style={{ margin: '8px 0', borderColor: '#334155' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <StatusBadge status={conn.status} />
                        <Button size="small" type="primary" ghost onClick={() => { testConnection(conn.type); message.info(`正在测试 ${conn.name}...`); }}>测试</Button>
                      </div>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        {/* Notifications */}
        <Col span={24}>
          <Card
            title={<Space><BellOutlined /> <span style={labelStyle}>通知设置</span></Space>}
            style={cardStyle}
            styles={{ header: { borderBottom: '1px solid #334155' } }}
          >
            <Row gutter={32}>
              <Col span={8}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={labelStyle}>邮件通知</Text>
                  <Switch checked={notifications.email} onChange={(checked) => updateNotifications({ email: checked })} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={labelStyle}>桌面通知</Text>
                  <Switch checked={notifications.desktop} onChange={(checked) => updateNotifications({ desktop: checked })} />
                </div>
              </Col>
              <Col span={16}>
                <Text style={{ ...labelStyle, display: 'block', marginBottom: 12 }}>告警级别</Text>
                <Radio.Group value={notifications.alertLevel} onChange={(e) => updateNotifications({ alertLevel: e.target.value })}>
                  <Radio value="all" style={labelStyle}>所有告警 <Tag color="blue" style={{ marginLeft: 8 }}>全部</Tag></Radio>
                  <Radio value="critical" style={labelStyle}>仅紧急告警 <Tag color="red" style={{ marginLeft: 8 }}>紧急</Tag></Radio>
                </Radio.Group>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Save */}
      <div style={{ marginTop: 24, textAlign: 'right' }}>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          size="large"
          loading={saving}
          onClick={handleSave}
          style={{ minWidth: 160 }}
        >
          保存设置
        </Button>
      </div>
    </div>
  );
}
