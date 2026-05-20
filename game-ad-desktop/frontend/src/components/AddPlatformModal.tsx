import {
  Modal, Steps, Button, Input, Space, Table, Tag, Spin, Typography, Result, Card,
} from 'antd';
import {
  CheckCircleOutlined, GlobalOutlined, RobotOutlined,
  LoginOutlined, ReloadOutlined,
} from '@ant-design/icons';
import { usePlatformDataStore, type SelectorSuggestion } from '../stores/platformData';

const { Text } = Typography;

const cardStyle = { background: '#1E293B', border: '1px solid #334155' };

const stepItems = [
  { title: '填写信息' },
  { title: '登录验证' },
  { title: 'AI 分析' },
  { title: '完成' },
];

export default function AddPlatformModal() {
  const {
    addModalOpen, addModalStep, currentWizard,
    closeAddModal, updateWizard, setWizardStep,
    startBrowserFlow, analyzeCurrentPage, confirmSelectors, scrapePlatform,
  } = usePlatformDataStore();

  const handleNext = () => setWizardStep(addModalStep + 1);

  // ---- Step 1: Basic Info ----
  const step1 = (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Text style={{ color: '#94A3B8', display: 'block', marginBottom: 6 }}>平台名称</Text>
        <Input
          placeholder="例如：广大大"
          value={currentWizard.name}
          onChange={(e) => updateWizard({ name: e.target.value })}
          style={{ background: '#0F172A', border: '1px solid #334155', color: '#E2E8F0' }}
        />
      </div>
      <div>
        <Text style={{ color: '#94A3B8', display: 'block', marginBottom: 6 }}>网站地址</Text>
        <Input
          placeholder="https://example.com"
          prefix={<GlobalOutlined style={{ color: '#64748B' }} />}
          value={currentWizard.url}
          onChange={(e) => updateWizard({ url: e.target.value })}
          style={{ background: '#0F172A', border: '1px solid #334155', color: '#E2E8F0' }}
        />
      </div>
      <div>
        <Text style={{ color: '#94A3B8', display: 'block', marginBottom: 6 }}>账号</Text>
        <Input
          placeholder="登录账号"
          value={currentWizard.username}
          onChange={(e) => updateWizard({ username: e.target.value })}
          style={{ background: '#0F172A', border: '1px solid #334155', color: '#E2E8F0' }}
        />
      </div>
      <div>
        <Text style={{ color: '#94A3B8', display: 'block', marginBottom: 6 }}>密码</Text>
        <Input.Password
          placeholder="登录密码"
          value={currentWizard.password}
          onChange={(e) => updateWizard({ password: e.target.value })}
          style={{ background: '#0F172A', border: '1px solid #334155', color: '#E2E8F0' }}
        />
      </div>
    </Space>
  );

  // ---- Step 2: Login ----
  const step2 = (
    <Space direction="vertical" size="large" style={{ width: '100%', alignItems: 'center' }}>
      {currentWizard.loginStatus === 'idle' && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <LoginOutlined style={{ fontSize: 48, color: '#4F46E5', marginBottom: 16 }} />
          <Text style={{ color: '#94A3B8', display: 'block', marginBottom: 24 }}>
            点击下方按钮打开内置浏览器，系统将自动登录 <Text strong style={{ color: '#E2E8F0' }}>{currentWizard.name}</Text>
          </Text>
          <Button
            type="primary"
            icon={<LoginOutlined />}
            size="large"
            onClick={startBrowserFlow}
          >
            打开浏览器并登录
          </Button>
        </div>
      )}

      {currentWizard.loginStatus === 'logging-in' && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <Spin size="large" style={{ marginBottom: 16 }} />
          <Text style={{ color: '#94A3B8', display: 'block' }}>正在打开浏览器并尝试登录...</Text>
        </div>
      )}

      {currentWizard.loginStatus === 'success' && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <CheckCircleOutlined style={{ fontSize: 48, color: '#10B981', marginBottom: 16 }} />
          <Text style={{ color: '#10B981', display: 'block', fontSize: 16, fontWeight: 600 }}>登录成功</Text>
          <Text style={{ color: '#94A3B8', display: 'block', marginTop: 8 }}>
            已成功登录 {currentWizard.name}，可以继续下一步
          </Text>
        </div>
      )}

      {currentWizard.loginStatus === 'failed' && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <Result
            status="error"
            title={<span style={{ color: '#EF4444' }}>登录失败</span>}
            subTitle={<span style={{ color: '#94A3B8' }}>{currentWizard.error ?? '请检查账号密码是否正确'}</span>}
            style={{ background: 'transparent' }}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => updateWizard({ loginStatus: 'idle', error: null })}
          >
            重新登录
          </Button>
        </div>
      )}
    </Space>
  );

  // ---- Step 3: AI Analysis ----
  const selectorColumns = [
    {
      title: '字段',
      dataIndex: 'field',
      key: 'field',
      width: 120,
      render: (t: string) => <Tag color="blue">{t}</Tag>,
    },
    {
      title: 'CSS 选择器',
      dataIndex: 'selector',
      key: 'selector',
      render: (_: string, record: SelectorSuggestion) => (
        <Input
          size="small"
          value={currentWizard.selectors[record.field]?.selector ?? record.selector}
          onChange={(e) => {
            const updated = { ...currentWizard.selectors };
            updated[record.field] = { selector: e.target.value, attribute: updated[record.field]?.attribute ?? record.attribute };
            updateWizard({ selectors: updated });
          }}
          style={{ background: '#0F172A', border: '1px solid #334155', color: '#E2E8F0', fontFamily: 'monospace' }}
        />
      ),
    },
    {
      title: '属性',
      dataIndex: 'attribute',
      key: 'attribute',
      width: 140,
      render: (_: string, record: SelectorSuggestion) => (
        <Input
          size="small"
          value={currentWizard.selectors[record.field]?.attribute ?? record.attribute}
          onChange={(e) => {
            const updated = { ...currentWizard.selectors };
            updated[record.field] = { selector: updated[record.field]?.selector ?? record.selector, attribute: e.target.value };
            updateWizard({ selectors: updated });
          }}
          style={{ background: '#0F172A', border: '1px solid #334155', color: '#E2E8F0', fontFamily: 'monospace', fontSize: 12 }}
        />
      ),
    },
    {
      title: '置信度',
      dataIndex: 'confidence',
      key: 'confidence',
      width: 100,
      render: (v: number) => (
        <Tag color={v >= 0.9 ? 'green' : v >= 0.8 ? 'blue' : 'orange'}>
          {(v * 100).toFixed(0)}%
        </Tag>
      ),
    },
  ];

  const step3 = (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {!currentWizard.selectorSuggestions && !currentWizard.analyzing && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <RobotOutlined style={{ fontSize: 48, color: '#4F46E5', marginBottom: 16 }} />
          <Text style={{ color: '#94A3B8', display: 'block', marginBottom: 24 }}>
            使用 AI 自动分析页面结构，推荐数据提取选择器
          </Text>
          <Button
            type="primary"
            icon={<RobotOutlined />}
            size="large"
            onClick={analyzeCurrentPage}
          >
            AI 分析页面
          </Button>
        </div>
      )}

      {currentWizard.analyzing && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <Spin size="large" style={{ marginBottom: 16 }} />
          <Text style={{ color: '#94A3B8', display: 'block' }}>AI 正在分析页面结构...</Text>
        </div>
      )}

      {currentWizard.selectorSuggestions && (
        <>
          <Text style={{ color: '#94A3B8' }}>
            AI 推荐了 {currentWizard.selectorSuggestions.length} 个选择器，你可以手动调整后再保存：
          </Text>
          <Table
            columns={selectorColumns}
            dataSource={currentWizard.selectorSuggestions}
            rowKey="field"
            pagination={false}
            size="small"
            style={{ background: '#1E293B' }}
          />
          <Space style={{ width: '100%', justifyContent: 'flex-end', marginTop: 8 }}>
            <Button onClick={() => updateWizard({ selectorSuggestions: null, selectors: {} })}>
              重新分析
            </Button>
          </Space>
        </>
      )}
    </Space>
  );

  // ---- Step 4: Done ----
  const step4 = (
    <div style={{ textAlign: 'center', padding: '24px 0' }}>
      <Result
        status="success"
        title={<span style={{ color: '#10B981' }}>平台添加成功</span>}
        subTitle={
          <span style={{ color: '#94A3B8' }}>
            <Text strong style={{ color: '#E2E8F0' }}>{currentWizard.name}</Text> 已保存，
            选择器配置完成，可以开始抓取数据
          </span>
        }
        style={{ background: 'transparent' }}
      />
    </div>
  );

  const stepContents = [step1, step2, step3, step4];

  // Footer buttons per step
  const renderFooter = () => {
    if (addModalStep === 0) {
      return (
        <Space>
          <Button onClick={closeAddModal}>取消</Button>
          <Button
            type="primary"
            onClick={handleNext}
            disabled={!currentWizard.name || !currentWizard.url}
          >
            下一步
          </Button>
        </Space>
      );
    }
    if (addModalStep === 1) {
      return (
        <Space>
          <Button onClick={() => setWizardStep(0)}>上一步</Button>
          <Button
            type="primary"
            onClick={handleNext}
            disabled={currentWizard.loginStatus !== 'success'}
          >
            下一步
          </Button>
        </Space>
      );
    }
    if (addModalStep === 2) {
      return (
        <Space>
          <Button onClick={() => setWizardStep(1)}>上一步</Button>
          <Button
            type="primary"
            onClick={confirmSelectors}
            disabled={!currentWizard.selectorSuggestions}
          >
            确认保存
          </Button>
        </Space>
      );
    }
    if (addModalStep === 3) {
      return (
        <Space>
          <Button onClick={closeAddModal}>关闭</Button>
          <Button
            type="primary"
            onClick={() => {
              const latestPlatform = usePlatformDataStore.getState().platforms.slice(-1)[0];
              if (latestPlatform) {
                closeAddModal();
                usePlatformDataStore.getState().setPlatform(latestPlatform.id);
                scrapePlatform(latestPlatform.id);
              }
            }}
          >
            立即抓取
          </Button>
        </Space>
      );
    }
    return null;
  };

  return (
    <Modal
      title="添加平台"
      open={addModalOpen}
      onCancel={closeAddModal}
      footer={renderFooter()}
      width={680}
      destroyOnClose
      styles={{
        content: { background: '#0F172A', border: '1px solid #334155' },
        header: { background: '#0F172A' },
      }}
    >
      <Steps
        current={addModalStep}
        items={stepItems}
        style={{ marginBottom: 24 }}
      />
      <Card style={cardStyle}>
        {stepContents[addModalStep]}
      </Card>
    </Modal>
  );
}
