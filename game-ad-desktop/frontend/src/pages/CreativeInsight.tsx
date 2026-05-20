import { useState, useRef, useCallback } from 'react';
import {
  Button, Space, Tag, Image, Typography,
  Table, Checkbox, Input, Spin, Select, message,
} from 'antd';
import {
  RobotOutlined, SendOutlined,
  DownOutlined, LeftOutlined, RightOutlined,
  PlusOutlined, DeleteOutlined,
  FileImageOutlined, BarChartOutlined, BulbOutlined,
  TagsOutlined, SwapOutlined, SearchOutlined,
  CalendarOutlined, FilterOutlined, SortAscendingOutlined,
  DownloadOutlined, SettingOutlined, CaretDownOutlined,
  CaretRightOutlined, ColumnWidthOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useCreativeInsightStore, Creative } from '../stores/creativeInsight';

const { Text } = Typography;
const { TextArea } = Input;

// ===== Theme Constants =====
const darkBg = '#0f172a';
const darkHover = '#1e293b';
const lightBg = '#1a2332';
const whiteBg = '#111827';
const borderColor = '#2d3a4a';
const primaryColor = '#3b82f6';
const textPrimary = '#e2e8f0';
const textSecondary = '#94a3b8';
const textMuted = '#64748b';
const panelBg = '#0F172A';
const cardBg = '#1E293B';

// ===== Mock Table Data =====
const mockTableData = [
  {
    key: 'summary',
    isSummary: true,
    operation: '',
    materialId: '汇总',
    preview: '',
    category: '',
    spend: 18243.10,
    impressions: 3585503,
    cpm: 5.09,
    clicks: 22230,
    cpc: 0.82,
    ctr: 0.62,
    playCount: 185420,
    play2s: 162300,
    play6s: 128400,
    play25: 98500,
    play50: 72100,
    play75: 48300,
    play100: 31200,
  },
  {
    key: 'CR-001',
    isSummary: false,
    operation: '下钻',
    materialId: 'CR-001',
    preview: 'https://picsum.photos/seed/cr001/60/40',
    category: 'RPG',
    spend: 4520.80,
    impressions: 892300,
    cpm: 5.07,
    clicks: 5890,
    cpc: 0.77,
    ctr: 0.66,
    playCount: 48200,
    play2s: 42100,
    play6s: 33500,
    play25: 25800,
    play50: 18900,
    play75: 12600,
    play100: 8100,
  },
  {
    key: 'CR-002',
    isSummary: false,
    operation: '下钻',
    materialId: 'CR-002',
    preview: 'https://picsum.photos/seed/cr002/60/40',
    category: 'SLG',
    spend: 3815.50,
    impressions: 756200,
    cpm: 5.04,
    clicks: 4820,
    cpc: 0.79,
    ctr: 0.64,
    playCount: 39800,
    play2s: 34900,
    play6s: 27600,
    play25: 21200,
    play50: 15500,
    play75: 10300,
    play100: 6700,
  },
  {
    key: 'CR-003',
    isSummary: false,
    operation: '下钻',
    materialId: 'CR-003',
    preview: 'https://picsum.photos/seed/cr003/60/40',
    category: '卡牌',
    spend: 3210.30,
    impressions: 638503,
    cpm: 5.03,
    clicks: 3950,
    cpc: 0.81,
    ctr: 0.62,
    playCount: 33200,
    play2s: 29100,
    play6s: 22900,
    play25: 17600,
    play50: 12900,
    play75: 8600,
    play100: 5500,
  },
  {
    key: 'CR-004',
    isSummary: false,
    operation: '下钻',
    materialId: 'CR-004',
    preview: 'https://picsum.photos/seed/cr004/60/40',
    category: 'RPG',
    spend: 2890.20,
    impressions: 572100,
    cpm: 5.05,
    clicks: 3520,
    cpc: 0.82,
    ctr: 0.62,
    playCount: 29600,
    play2s: 25900,
    play6s: 20400,
    play25: 15700,
    play50: 11500,
    play75: 7700,
    play100: 4900,
  },
  {
    key: 'CR-005',
    isSummary: false,
    operation: '下钻',
    materialId: 'CR-005',
    preview: 'https://picsum.photos/seed/cr005/60/40',
    category: '休闲',
    spend: 1806.30,
    impressions: 358400,
    cpm: 5.04,
    clicks: 2210,
    cpc: 0.82,
    ctr: 0.62,
    playCount: 18420,
    play2s: 16100,
    play6s: 12700,
    play25: 9800,
    play50: 7200,
    play75: 4800,
    play100: 3100,
  },
  {
    key: 'CR-006',
    isSummary: false,
    operation: '下钻',
    materialId: 'CR-006',
    preview: 'https://picsum.photos/seed/cr006/60/40',
    category: 'SLG',
    spend: 1200.00,
    impressions: 238000,
    cpm: 5.04,
    clicks: 1480,
    cpc: 0.81,
    ctr: 0.62,
    playCount: 12200,
    play2s: 10700,
    play6s: 8400,
    play25: 6500,
    play50: 4800,
    play75: 3200,
    play100: 2000,
  },
  {
    key: 'CR-007',
    isSummary: false,
    operation: '下钻',
    materialId: 'CR-007',
    preview: 'https://picsum.photos/seed/cr007/60/40',
    category: 'RPG',
    spend: 800.00,
    impressions: 158000,
    cpm: 5.06,
    clicks: 960,
    cpc: 0.83,
    ctr: 0.61,
    playCount: 8000,
    play2s: 7000,
    play6s: 5500,
    play25: 4200,
    play50: 3100,
    play75: 2100,
    play100: 1300,
  },
];

// ===== Column Definitions =====
const columnGroups = [
  {
    title: '渠道素材基础数据',
    key: 'basic',
    columns: [
      { title: '素材花费', dataIndex: 'spend', key: 'spend', align: 'right' as const, sorter: true },
      { title: '素材展示数', dataIndex: 'impressions', key: 'impressions', align: 'right' as const, sorter: true },
      { title: '素材千次展示成本', dataIndex: 'cpm', key: 'cpm', align: 'right' as const, sorter: true },
      { title: '素材点击数', dataIndex: 'clicks', key: 'clicks', align: 'right' as const, sorter: true },
      { title: '素材点击成本', dataIndex: 'cpc', key: 'cpc', align: 'right' as const, sorter: true },
      { title: '素材点击率', dataIndex: 'ctr', key: 'ctr', align: 'right' as const, sorter: true },
    ],
  },
  {
    title: '视频播放数据',
    key: 'video',
    columns: [
      { title: '播放次数', dataIndex: 'playCount', key: 'playCount', align: 'right' as const, sorter: true },
      { title: '播放2s次数', dataIndex: 'play2s', key: 'play2s', align: 'right' as const, sorter: true },
      { title: '播放6s次数', dataIndex: 'play6s', key: 'play6s', align: 'right' as const, sorter: true },
      { title: '播放25%次数', dataIndex: 'play25', key: 'play25', align: 'right' as const, sorter: true },
      { title: '播放50%次数', dataIndex: 'play50', key: 'play50', align: 'right' as const, sorter: true },
      { title: '播放75%次数', dataIndex: 'play75', key: 'play75', align: 'right' as const, sorter: true },
      { title: '播放100%次数', dataIndex: 'play100', key: 'play100', align: 'right' as const, sorter: true },
    ],
  },
];

const customColumnCategories = [
  {
    key: 'basic',
    label: '渠道素材基础数据',
    checked: true,
    items: [
      { key: 'spend', label: '素材花费', checked: true },
      { key: 'impressions', label: '素材展示数', checked: true },
      { key: 'cpm', label: '素材千次展示成本', checked: true },
      { key: 'clicks', label: '素材点击数', checked: true },
      { key: 'cpc', label: '素材点击成本', checked: true },
      { key: 'ctr', label: '素材点击率', checked: true },
    ],
  },
  {
    key: 'video',
    label: '视频播放数据',
    checked: true,
    items: [
      { key: 'playCount', label: '播放次数', checked: true },
      { key: 'play2s', label: '播放2s次数', checked: true },
      { key: 'play6s', label: '播放6s次数', checked: true },
      { key: 'play25', label: '播放25%次数', checked: true },
      { key: 'play50', label: '播放50%次数', checked: true },
      { key: 'play75', label: '播放75%次数', checked: true },
      { key: 'play100', label: '播放100%次数', checked: true },
      { key: 'rate2s', label: '2s播放率', checked: true },
      { key: 'rate6s', label: '6s播放率', checked: true },
      { key: 'rate25', label: '25%播放率', checked: true },
      { key: 'rate50', label: '50%播放率', checked: true },
      { key: 'rate75', label: '75%播放率', checked: true },
      { key: 'rate100', label: '100%播放率', checked: true },
    ],
  },
  {
    key: 'afcohort_basic',
    label: 'Afcohort[统一]-基础',
    checked: false,
    items: [],
  },
  {
    key: 'afcohort_retention',
    label: 'Afcohort[统一]-留存数',
    checked: false,
    items: [],
  },
];

function formatNumber(v: number) {
  if (v >= 1000000) return (v / 1000000).toFixed(2) + 'M';
  if (v >= 1000) return v.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return v.toFixed(2);
}

// ===== AI Assistant Panel (Keep unchanged) =====
function AiAssistantPanel() {
  const [input, setInput] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const {
    chatMessages, aiLoading, addCreative, addChatMessage,
    uploadAndRecognize, fetchAiSuggestion, aiPanelCollapsed, toggleAiPanel,
  } = useCreativeInsightStore();

  const scrollToBottom = () => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleSend = async () => {
    if (previewFile) {
      const file = previewFile;
      setPreviewImage(null);
      setPreviewFile(null);
      scrollToBottom();
      await uploadAndRecognize(file);
      scrollToBottom();
      return;
    }
    if (!input.trim()) return;
    const msg = input.trim();
    setInput('');
    scrollToBottom();
    await fetchAiSuggestion(msg);
    scrollToBottom();
  };

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) { message.warning('请上传图片文件'); return; }
    if (file.size > 10 * 1024 * 1024) { message.warning('图片大小不能超过 10MB'); return; }
    setPreviewFile(file);
    setPreviewImage(URL.createObjectURL(file));
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) handleFileSelect(file);
        e.preventDefault();
        break;
      }
    }
  }, [handleFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleAddToLibrary = (creative: Creative) => {
    addCreative(creative);
    addChatMessage({ role: 'ai', content: `素材「${creative.name}」已成功添加到素材库！` });
    message.success('素材已添加到素材库');
    scrollToBottom();
  };

  const quickPrompts = [
    { icon: <BarChartOutlined />, label: 'AI创意简报', prompt: '请生成当前素材库的整体分析简报' },
    { icon: <TagsOutlined />, label: 'AI创意打标', prompt: '请对当前素材库进行标签分析' },
    { icon: <SwapOutlined />, label: '素材对比分析', prompt: '请对比分析TOP和Bottom素材差异' },
    { icon: <BulbOutlined />, label: '创意方向推荐', prompt: '基于数据推荐3个新创意方向' },
  ];

  if (aiPanelCollapsed) {
    return (
      <div style={{
        width: 40, height: '100%', background: cardBg,
        borderLeft: `1px solid ${borderColor}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', flexShrink: 0,
      }} onClick={toggleAiPanel}>
        <RobotOutlined style={{ color: '#A78BFA', fontSize: 18 }} />
      </div>
    );
  }

  return (
    <div style={{
      width: 320, flexShrink: 0, height: '100%',
      display: 'flex', flexDirection: 'column',
      background: cardBg, borderLeft: `1px solid ${borderColor}`,
    }}>
      <div style={{
        padding: '10px 14px', borderBottom: `1px solid ${borderColor}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Space>
          <RobotOutlined style={{ color: '#A78BFA', fontSize: 16 }} />
          <Text strong style={{ color: '#E2E8F0', fontSize: 14 }}>智投精灵</Text>
        </Space>
        <Button type="text" size="small" icon={<RightOutlined />} onClick={toggleAiPanel}
          style={{ color: textMuted }} />
      </div>
      <div style={{ padding: '8px 10px', borderBottom: `1px solid ${borderColor}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          {quickPrompts.map((item) => (
            <Button key={item.label} size="small" icon={item.icon}
              onClick={() => setInput(item.prompt)}
              style={{ background: panelBg, borderColor: borderColor, color: '#94A3B8', fontSize: 10, height: 28 }}>
              {item.label}
            </Button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}
        onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
        {chatMessages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '30px 12px' }}>
            <RobotOutlined style={{ fontSize: 36, color: textMuted }} />
            <Text style={{ color: '#94A3B8', display: 'block', marginTop: 10, fontSize: 12 }}>
              你好！我是智投精灵<br />可以帮你分析素材、识别标签、优化投放
            </Text>
          </div>
        )}
        {chatMessages.map((msg) => (
          <div key={msg.id} style={{
            display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 8,
          }}>
            <div style={{
              maxWidth: '90%', padding: '6px 10px', borderRadius: 8,
              background: msg.role === 'user' ? primaryColor : panelBg,
              border: msg.role === 'ai' ? `1px solid ${borderColor}` : 'none',
            }}>
              {msg.image && <Image src={msg.image} style={{ borderRadius: 4, marginBottom: 4 }} width={150} />}
              <Text style={{ color: '#E2E8F0', fontSize: 11, whiteSpace: 'pre-wrap' }}>{msg.content}</Text>
              {msg.creative && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 4, padding: 6, marginBottom: 4 }}>
                    <Image src={msg.creative.thumbnail} width="100%" height={60}
                      style={{ objectFit: 'cover', borderRadius: 3 }} preview={false} />
                    <div style={{ marginTop: 4 }}>
                      {msg.tags?.map((t) => (
                        <Tag key={t} style={{ background: '#7C3AED20', border: '1px solid #7C3AED40', color: '#A78BFA', fontSize: 9, marginBottom: 2 }}>{t}</Tag>
                      ))}
                    </div>
                  </div>
                  <Button type="primary" size="small" icon={<PlusOutlined />}
                    onClick={() => handleAddToLibrary(msg.creative!)}
                    style={{ background: '#10B981', borderColor: '#10B981', width: '100%', fontSize: 10 }}>
                    添加到素材库
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
        {aiLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 8 }}>
            <div style={{ padding: '6px 10px', borderRadius: 8, background: panelBg, border: `1px solid ${borderColor}` }}>
              <Spin size="small" /> <Text style={{ color: '#94A3B8', marginLeft: 6, fontSize: 11 }}>思考中...</Text>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <div style={{ padding: 8, borderTop: `1px solid ${borderColor}`, background: cardBg }}>
        {previewImage && (
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 6, marginRight: 6 }}>
            <Image src={previewImage} width={60} height={45} style={{ objectFit: 'cover', borderRadius: 3 }} preview={false} />
            <Button type="text" size="small" icon={<DeleteOutlined />}
              onClick={() => { setPreviewImage(null); setPreviewFile(null); }}
              style={{ position: 'absolute', top: -5, right: -5, background: '#EF4444', color: '#fff', borderRadius: '50%', width: 18, height: 18, minWidth: 18, fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
          </div>
        )}
        <div style={{ display: 'flex', gap: 4 }}>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); e.target.value = ''; }} />
          <Button icon={<FileImageOutlined />} onClick={() => fileInputRef.current?.click()}
            style={{ background: panelBg, borderColor: borderColor, color: '#94A3B8' }} title="上传图片" />
          <TextArea value={input} onChange={(e) => setInput(e.target.value)}
            placeholder={previewFile ? '图片已选择，点击发送' : '输入问题或粘贴图片...'}
            autoSize={{ minRows: 1, maxRows: 2 }}
            onPressEnter={(e) => { if (!e.shiftKey) { e.preventDefault(); handleSend(); } }}
            onPaste={handlePaste}
            style={{ background: panelBg, borderColor: borderColor, color: '#E2E8F0', resize: 'none', flex: 1, fontSize: 11 }} />
          <Button type="primary" icon={<SendOutlined />} onClick={handleSend} loading={aiLoading}
            style={{ background: primaryColor, borderColor: primaryColor }} />
        </div>
      </div>
    </div>
  );
}

// ===== Left Sidebar =====
function LeftSidebar({ collapsed, onCollapse }: { collapsed: boolean; onCollapse: () => void }) {
  const [activeMenu, setActiveMenu] = useState('designer-material');
  const menus = [
    { key: 'designer-material', label: '设计师素材表' },
    { key: 'designer-tag', label: '设计师标签表' },
    { key: 'cost-query', label: '素材成本查询' },
  ];

  if (collapsed) {
    return (
      <div style={{
        width: 48, height: '100%', background: darkBg,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingTop: 12, flexShrink: 0,
      }}>
        <MenuUnfoldOutlined style={{ color: '#fff', fontSize: 16, cursor: 'pointer', marginBottom: 20 }} onClick={onCollapse} />
        {menus.map((m) => (
          <div key={m.key} onClick={() => setActiveMenu(m.key)} style={{
            width: 36, height: 36, borderRadius: 6, marginBottom: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            background: activeMenu === m.key ? primaryColor : 'transparent',
          }}>
            <Text style={{ color: '#fff', fontSize: 11 }}>{m.label[0]}</Text>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{
      width: 200, height: '100%', background: darkBg,
      display: 'flex', flexDirection: 'column', flexShrink: 0,
    }}>
      <div style={{ padding: '12px 14px 10px', borderBottom: `1px solid ${darkHover}` }}>
        <Space style={{ cursor: 'pointer' }}>
          <Text strong style={{ color: '#fff', fontSize: 13 }}>数据分析-海外</Text>
          <DownOutlined style={{ color: '#94A3B8', fontSize: 9 }} />
        </Space>
      </div>
      <div style={{ flex: 1, padding: '6px 0' }}>
        {menus.map((m) => (
          <div key={m.key} onClick={() => setActiveMenu(m.key)} style={{
            padding: '7px 14px', cursor: 'pointer', margin: '1px 6px', borderRadius: 4,
            background: activeMenu === m.key ? primaryColor : 'transparent',
            transition: 'background 0.2s',
          }}>
            <Text style={{
              color: activeMenu === m.key ? '#fff' : '#94A3B8',
              fontSize: 12, fontWeight: activeMenu === m.key ? 600 : 400,
            }}>
              {m.label}
            </Text>
          </div>
        ))}
      </div>
      <div style={{ padding: '8px 14px', borderTop: `1px solid ${darkHover}` }}>
        <Button type="text" icon={<LeftOutlined />} onClick={onCollapse}
          style={{ color: '#94A3B8', fontSize: 11, padding: 0 }}>
          收起侧边栏
        </Button>
      </div>
    </div>
  );
}

// ===== Custom Columns Panel =====
function CustomColumnsPanel({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [expandedKeys, setExpandedKeys] = useState<string[]>(['basic', 'video']);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    customColumnCategories.forEach((cat) => {
      cat.items.forEach((item) => { map[item.key] = item.checked; });
    });
    return map;
  });

  if (!visible) return null;

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };

  return (
    <div style={{
      width: 240, height: '100%', background: cardBg,
      borderLeft: `1px solid ${borderColor}`, flexShrink: 0,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '10px 12px', borderBottom: `1px solid ${borderColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text strong style={{ fontSize: 12, color: textPrimary }}>自定义列</Text>
        <Button type="text" size="small" onClick={onClose} style={{ color: textSecondary, fontSize: 11 }}>关闭</Button>
      </div>
      <div style={{ padding: '6px 12px', borderBottom: `1px solid ${borderColor}` }}>
        <Text style={{ fontSize: 11, color: textMuted }}>指标自定义</Text>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {customColumnCategories.map((cat) => (
          <div key={cat.key}>
            <div
              onClick={() => toggleExpand(cat.key)}
              style={{
                padding: '6px 12px', cursor: 'pointer', display: 'flex',
                alignItems: 'center', gap: 5, background: darkHover,
                borderBottom: `1px solid ${borderColor}`,
              }}
            >
              {expandedKeys.includes(cat.key) ? <CaretDownOutlined style={{ fontSize: 9, color: textMuted }} /> : <CaretRightOutlined style={{ fontSize: 9, color: textMuted }} />}
              <Checkbox checked={cat.checked} onClick={(e) => e.stopPropagation()} />
              <Text style={{ fontSize: 11, color: textPrimary, fontWeight: 500 }}>{cat.label}</Text>
            </div>
            {expandedKeys.includes(cat.key) && cat.items.length > 0 && (
              <div style={{ padding: '4px 12px 4px 30px' }}>
                {cat.items.map((item) => (
                  <div key={item.key} style={{ marginBottom: 3 }}>
                    <Checkbox
                      checked={checkedItems[item.key]}
                      onChange={(e) => setCheckedItems((prev) => ({ ...prev, [item.key]: e.target.checked }))}
                      style={{ fontSize: 11 }}
                    >
                      <Text style={{ fontSize: 11, color: textPrimary }}>{item.label}</Text>
                    </Checkbox>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== Main Component =====
export default function CreativeInsight() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [customColVisible, setCustomColVisible] = useState(false);
  const [activeDimension, setActiveDimension] = useState('material-id');

  // Filter states
  const [startDate, setStartDate] = useState('2026-05-01');
  const [endDate, setEndDate] = useState('2026-05-15');
  const [source, setSource] = useState('yishijie-overseas');
  const [mediaCondition, setMediaCondition] = useState('equals');
  const [mediaValue, setMediaValue] = useState<string | undefined>(undefined);
  const [materialIdCondition, setMaterialIdCondition] = useState('contains');
  const [materialIdInput, setMaterialIdInput] = useState('');
  const [materialIdTags, setMaterialIdTags] = useState<string[]>([]);
  const [tagCondition, setTagCondition] = useState('contains');
  const [tagInput, setTagInput] = useState('');
  const [tagTags, setTagTags] = useState<string[]>([]);
  const [personalConfig, setPersonalConfig] = useState<string | undefined>(undefined);
  const [showAllFilters, setShowAllFilters] = useState(false);

  // Add material ID filter tag
  const addMaterialIdTag = () => {
    if (materialIdInput.trim() && !materialIdTags.includes(materialIdInput.trim())) {
      setMaterialIdTags([...materialIdTags, materialIdInput.trim()]);
      setMaterialIdInput('');
    }
  };
  const removeMaterialIdTag = (tag: string) => {
    setMaterialIdTags(materialIdTags.filter((t) => t !== tag));
  };

  // Add tag name filter tag
  const addTagTag = () => {
    if (tagInput.trim() && !tagTags.includes(tagInput.trim())) {
      setTagTags([...tagTags, tagInput.trim()]);
      setTagInput('');
    }
  };
  const removeTagTag = (tag: string) => {
    setTagTags(tagTags.filter((t) => t !== tag));
  };

  // Filter data
  const filteredData = mockTableData.filter((row) => {
    if (row.isSummary) return true;
    // Material ID filter
    if (materialIdTags.length > 0) {
      const match = materialIdTags.some((tag) => {
        if (materialIdCondition === 'contains') return row.materialId.toLowerCase().includes(tag.toLowerCase());
        return row.materialId.toLowerCase() === tag.toLowerCase();
      });
      if (!match) return false;
    }
    // Category filter (using media as category proxy)
    if (mediaValue) {
      if (mediaCondition === 'equals') {
        if (row.category !== mediaValue) return false;
      } else {
        if (!row.category.toLowerCase().includes(mediaValue.toLowerCase())) return false;
      }
    }
    return true;
  });

  // Recalculate summary row from filtered data
  const summaryRow: any = {
    key: 'summary',
    isSummary: true,
    operation: '',
    materialId: '汇总',
    preview: '',
    category: '',
    ...Object.fromEntries(
      ['spend', 'impressions', 'cpm', 'clicks', 'cpc', 'ctr', 'playCount', 'play2s', 'play6s', 'play25', 'play50', 'play75', 'play100'].map((k) => [
        k,
        filteredData.filter((r) => !r.isSummary).reduce((s: number, r: any) => s + (r[k] || 0), 0),
      ])
    ),
  };
  // Fix avg fields
  summaryRow.cpm = summaryRow.impressions > 0 ? +(summaryRow.spend / summaryRow.impressions * 1000).toFixed(2) : 0;
  summaryRow.cpc = summaryRow.clicks > 0 ? +(summaryRow.spend / summaryRow.clicks).toFixed(2) : 0;
  summaryRow.ctr = summaryRow.impressions > 0 ? +(summaryRow.clicks / summaryRow.impressions * 100).toFixed(2) : 0;

  const tableData = [summaryRow, ...filteredData.filter((r) => !r.isSummary)];

  // Reset all filters
  const resetFilters = () => {
    setStartDate('2026-05-01');
    setEndDate('2026-05-15');
    setSource('yishijie-overseas');
    setMediaCondition('equals');
    setMediaValue(undefined);
    setMaterialIdCondition('contains');
    setMaterialIdInput('');
    setMaterialIdTags([]);
    setTagCondition('contains');
    setTagInput('');
    setTagTags([]);
    setPersonalConfig(undefined);
    message.success('筛选条件已重置');
  };

  // Query action
  const handleQuery = () => {
    message.success(`查询完成，共 ${filteredData.filter((r) => !r.isSummary).length} 条数据`);
  };

  // Export action
  const handleExport = () => {
    message.success('正在导出数据...');
  };

  // Build table columns
  const baseColumns = [
    {
      title: '操作', dataIndex: 'operation', key: 'operation', width: 50, fixed: 'left' as const,
      render: (v: string, record: any) => record.isSummary ? null : (
        <a style={{ color: primaryColor, fontSize: 11, cursor: 'pointer' }}>{v}</a>
      ),
    },
    {
      title: '素材ID', dataIndex: 'materialId', key: 'materialId', width: 80, fixed: 'left' as const,
      render: (v: string, record: any) => (
        <Text style={{ color: record.isSummary ? textSecondary : textPrimary, fontSize: 11, fontWeight: record.isSummary ? 600 : 400 }}>{v}</Text>
      ),
    },
    {
      title: '预览链接', dataIndex: 'preview', key: 'preview', width: 60, fixed: 'left' as const,
      render: (v: string, record: any) => record.isSummary ? null : (
        v ? <Image src={v} width={36} height={24} style={{ objectFit: 'cover', borderRadius: 2 }} preview={false} /> : <div style={{ width: 36, height: 24, background: darkHover, borderRadius: 2 }} />
      ),
    },
    {
      title: '游戏分类', dataIndex: 'category', key: 'category', width: 70, fixed: 'left' as const,
      render: (v: string, record: any) => (
        <Text style={{ color: record.isSummary ? textSecondary : textPrimary, fontSize: 11, fontWeight: record.isSummary ? 600 : 400 }}>{v}</Text>
      ),
    },
  ];

  const dataColumns = columnGroups.flatMap((group) =>
    group.columns.map((col) => ({
      ...col,
      width: 95,
      render: (v: number, record: any) => {
        if (record.isSummary) {
          return <Text strong style={{ fontSize: 11, color: textPrimary, textAlign: 'right', display: 'block' }}>{formatNumber(v)}</Text>;
        }
        if (col.key === 'ctr') {
          return <Text style={{ fontSize: 11, color: textPrimary, textAlign: 'right', display: 'block' }}>{v}%</Text>;
        }
        return <Text style={{ fontSize: 11, color: textSecondary, textAlign: 'right', display: 'block' }}>{formatNumber(v)}</Text>;
      },
    }))
  );

  const allColumns = [...baseColumns, ...dataColumns];

  return (
    <div style={{
      display: 'flex', height: '100%', overflow: 'hidden', margin: -24,
    }}>
      {/* Left Sidebar */}
      <LeftSidebar collapsed={sidebarCollapsed} onCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />

      {/* Middle: Main Content */}
      <div className="dark-page" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: whiteBg }}>
        {/* Filter Bar */}
        <div style={{ background: lightBg, padding: '8px 12px', borderBottom: `1px solid ${borderColor}` }}>
          {/* Row 1 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Text style={{ color: '#ef4444', fontSize: 11 }}>*</Text>
              <Text style={{ color: textSecondary, fontSize: 11 }}>日期</Text>
              <Input value={startDate} onChange={(e) => setStartDate(e.target.value)} size="small"
                style={{ width: 95, background: darkHover, fontSize: 11, textAlign: 'center' }} />
              <Text style={{ color: textMuted, fontSize: 10 }}>~</Text>
              <Input value={endDate} onChange={(e) => setEndDate(e.target.value)} size="small"
                suffix={<CalendarOutlined style={{ color: textMuted, fontSize: 10 }} />}
                style={{ width: 95, background: darkHover, fontSize: 11 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Text style={{ color: '#ef4444', fontSize: 11 }}>*</Text>
              <Text style={{ color: textSecondary, fontSize: 11 }}>来源</Text>
              <Select value={source} onChange={setSource} size="small" style={{ width: 130 }}
                options={[
                  { value: 'yishijie-overseas', label: '益世界-海外' },
                  { value: 'yishijie-domestic', label: '益世界-国内' },
                  { value: 'other', label: '其他' },
                ]} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Text style={{ color: textSecondary, fontSize: 11 }}>媒体</Text>
              <Select value={mediaCondition} onChange={setMediaCondition} size="small" style={{ width: 70 }}
                options={[{ value: 'equals', label: '等于' }, { value: 'contains', label: '含有' }]} />
              <Select value={mediaValue} onChange={setMediaValue} placeholder="请选择" size="small" style={{ width: 110 }}
                allowClear
                options={[
                  { value: 'TikTok', label: 'TikTok' },
                  { value: 'Facebook', label: 'Facebook' },
                  { value: 'Google', label: 'Google' },
                  { value: 'Unity', label: 'Unity' },
                  { value: 'Applovin', label: 'Applovin' },
                ]} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Text style={{ color: textSecondary, fontSize: 11 }}>素材ID</Text>
              <Select value={materialIdCondition} onChange={setMaterialIdCondition} size="small" style={{ width: 70 }}
                options={[{ value: 'contains', label: '含有' }, { value: 'equals', label: '等于' }]} />
              <Input value={materialIdInput} onChange={(e) => setMaterialIdInput(e.target.value)}
                onPressEnter={addMaterialIdTag}
                placeholder="请输入" size="small" style={{ width: 120, fontSize: 11 }} />
              <Button type="primary" size="small" icon={<PlusOutlined />} onClick={addMaterialIdTag}
                style={{ background: primaryColor, borderColor: primaryColor }} />
            </div>
          </div>
          {/* Row 2 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Text style={{ color: textSecondary, fontSize: 11 }}>标签名称</Text>
                <Select value={tagCondition} onChange={setTagCondition} size="small" style={{ width: 70 }}
                  options={[{ value: 'contains', label: '含有' }, { value: 'equals', label: '等于' }]} />
                <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                  onPressEnter={addTagTag}
                  placeholder="请输入" size="small" style={{ width: 120, fontSize: 11 }} />
                <Button type="primary" size="small" icon={<PlusOutlined />} onClick={addTagTag}
                  style={{ background: primaryColor, borderColor: primaryColor }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Text style={{ color: textSecondary, fontSize: 11 }}>个人配置</Text>
                <Select value={personalConfig} onChange={setPersonalConfig} placeholder="请选择" size="small" style={{ width: 120 }}
                  allowClear
                  options={[
                    { value: 'config1', label: '我的常用配置' },
                    { value: 'config2', label: 'ROAS分析配置' },
                  ]} />
              </div>
              {/* Filter Tags */}
              {materialIdTags.length > 0 && (
                <Space size={4} wrap>
                  {materialIdTags.map((tag) => (
                    <Tag key={tag} closable onClose={() => removeMaterialIdTag(tag)}
                      style={{ background: '#3b82f620', borderColor: primaryColor, color: primaryColor, fontSize: 10 }}>
                      素材ID {materialIdCondition === 'contains' ? '含有' : '等于'} {tag}
                    </Tag>
                  ))}
                </Space>
              )}
              {tagTags.length > 0 && (
                <Space size={4} wrap>
                  {tagTags.map((tag) => (
                    <Tag key={tag} closable onClose={() => removeTagTag(tag)}
                      style={{ background: '#10b98120', borderColor: '#10b981', color: '#10b981', fontSize: 10 }}>
                      标签 {tagCondition === 'contains' ? '含有' : '等于'} {tag}
                    </Tag>
                  ))}
                </Space>
              )}
            </div>
            <Space size={6}>
              <Button type="primary" size="small" icon={<SearchOutlined />} onClick={handleQuery}
                style={{ background: primaryColor, borderColor: primaryColor, fontSize: 11 }}>查询</Button>
              <Button size="small" onClick={resetFilters}
                style={{ color: textSecondary, borderColor: borderColor, fontSize: 11 }}>重置</Button>
              <a style={{ color: primaryColor, fontSize: 11, cursor: 'pointer' }}
                onClick={() => setShowAllFilters(!showAllFilters)}>
                {showAllFilters ? '收起筛选' : '所有筛选'}
              </a>
            </Space>
          </div>
          {/* Expanded Filters */}
          {showAllFilters && (
            <div style={{ marginTop: 6, padding: '6px 0', borderTop: `1px solid ${borderColor}`, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <Text style={{ color: textMuted, fontSize: 10 }}>更多筛选条件将在此显示...</Text>
            </div>
          )}
        </div>

        {/* Dimension Tabs */}
        <div style={{ padding: '5px 12px', borderBottom: `1px solid ${borderColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space size={4}>
            <Button size="small" icon={<ColumnWidthOutlined />} style={{ borderColor: borderColor, color: textSecondary, fontSize: 11 }}>维度</Button>
            {[
              { key: 'material-id', label: '素材ID' },
              { key: 'game-category', label: '游戏分类' },
              { key: 'preview-link', label: '预览链接' },
            ].map((dim) => (
              <Button key={dim.key} size="small" onClick={() => setActiveDimension(dim.key)}
                style={{
                  background: activeDimension === dim.key ? primaryColor : 'transparent',
                  borderColor: activeDimension === dim.key ? primaryColor : borderColor,
                  color: activeDimension === dim.key ? '#fff' : textSecondary,
                  fontSize: 11,
                }}>
                {dim.label}
              </Button>
            ))}
          </Space>
          <Space size={4}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '2px 8px', borderRadius: 4, border: `1px solid ${borderColor}`,
            }}>
              <Input value={startDate} onChange={(e) => setStartDate(e.target.value)} size="small"
                style={{ width: 85, fontSize: 10, background: darkHover, textAlign: 'center', border: 'none', padding: '0 2px' }} />
              <Text style={{ fontSize: 10, color: textMuted }}>~</Text>
              <Input value={endDate} onChange={(e) => setEndDate(e.target.value)} size="small"
                style={{ width: 85, fontSize: 10, background: darkHover, textAlign: 'center', border: 'none', padding: '0 2px' }} />
              <div style={{
                width: 18, height: 18, borderRadius: '50%', border: `1px solid ${primaryColor}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: primaryColor, fontWeight: 700,
              }}>VS</div>
              <Input value={startDate} onChange={(e) => setStartDate(e.target.value)} size="small"
                style={{ width: 85, fontSize: 10, background: darkHover, textAlign: 'center', border: 'none', padding: '0 2px' }} />
              <Text style={{ fontSize: 10, color: textMuted }}>~</Text>
              <Input value={endDate} onChange={(e) => setEndDate(e.target.value)} size="small"
                style={{ width: 85, fontSize: 10, background: darkHover, textAlign: 'center', border: 'none', padding: '0 2px' }} />
            </div>
          </Space>
        </div>

        {/* Action Bar */}
        <div style={{ padding: '4px 12px', borderBottom: `1px solid ${borderColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space size={8}>
            <Button type="text" size="small" icon={<SortAscendingOutlined />} style={{ color: textSecondary, fontSize: 11 }}
              onClick={() => message.info('点击列头可排序')}>列排序</Button>
            <Button type="text" size="small" icon={<FilterOutlined />} style={{ color: textSecondary, fontSize: 11 }}
              onClick={() => setShowAllFilters(!showAllFilters)}>指标过滤</Button>
            <Button type="text" size="small" icon={<SettingOutlined />} onClick={() => setCustomColVisible(!customColVisible)}
              style={{ color: customColVisible ? primaryColor : textSecondary, fontSize: 11 }}>自定义列</Button>
            <Button type="text" size="small" icon={<DownloadOutlined />} onClick={handleExport}
              style={{ color: textSecondary, fontSize: 11 }}>导出</Button>
          </Space>
          <Text style={{ color: textMuted, fontSize: 10 }}>
            共 {filteredData.filter((r) => !r.isSummary).length} 条数据
          </Text>
        </div>

        {/* Data Table */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <Table
            dataSource={tableData}
            columns={allColumns}
            pagination={false}
            size="small"
            scroll={{ x: 'max-content' }}
            rowClassName={(record) => record.isSummary ? 'summary-row' : ''}
            className="dark-table"
          />
        </div>
      </div>

      {/* Right: Custom Columns Panel */}
      <CustomColumnsPanel visible={customColVisible} onClose={() => setCustomColVisible(false)} />

      {/* Far Right: AI Panel */}
      <AiAssistantPanel />
    </div>
  );
}
