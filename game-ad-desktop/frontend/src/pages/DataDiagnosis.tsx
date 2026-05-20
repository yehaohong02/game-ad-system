import { useState, useRef, useCallback } from 'react';
import {
  Table, Select, Button, Space, Tag, Drawer, message,
  Input, Checkbox, Image, Typography, Spin, Upload,
} from 'antd';
import {
  SearchOutlined, PauseCircleOutlined, PlayCircleOutlined,
  DollarOutlined, RobotOutlined, SendOutlined,
  RightOutlined,
  PlusOutlined, DeleteOutlined,
  FileImageOutlined, BarChartOutlined, BulbOutlined,
  TagsOutlined, SwapOutlined,
  CalendarOutlined, FilterOutlined, SortAscendingOutlined,
  DownloadOutlined, SettingOutlined, CaretDownOutlined,
  CaretRightOutlined, ColumnWidthOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useDataDiagnosisStore } from '../stores/dataDiagnosis';
import { useCreativeInsightStore, Creative } from '../stores/creativeInsight';
import { useMaterialDataStore } from '../stores/materialData';

const { Text } = Typography;
const { TextArea } = Input;

// ===== Theme =====
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

const statusColor: Record<string, string> = { active: 'green', paused: 'gold', completed: 'blue', error: 'red' };
const statusLabel: Record<string, string> = { active: '投放中', paused: '已暂停', completed: '已完成', error: '异常' };

// ===== Column Groups =====
const columnGroups = [
  {
    title: '渠道素材基础数据', key: 'basic',
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
    title: '视频播放数据', key: 'video',
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

function formatNumber(v: number) {
  if (v >= 1000000) return (v / 1000000).toFixed(2) + 'M';
  if (v >= 1000) return v.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return v.toFixed(2);
}

// ===== AI Assistant Panel =====
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

// ===== Custom Columns Panel (with drag-and-drop reorder) =====
function CustomColumnsPanel({ visible, onClose, columnVisibility, onToggleColumn, columnOrder, onReorder }: {
  visible: boolean; onClose: () => void;
  columnVisibility: Record<string, boolean>;
  onToggleColumn: (key: string, checked: boolean) => void;
  columnOrder: string[];
  onReorder: (newOrder: string[]) => void;
}) {
  const [expandedKeys, setExpandedKeys] = useState<string[]>(['campaign', 'basic', 'video']);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  if (!visible) return null;

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };

  // All column labels
  const labelMap: Record<string, string> = {
    operation: '操作', status: '状态', materialId: '素材ID', preview: '预览',
    country: '国家', platform: '平台', category: '游戏分类', spend: '素材花费',
    installs: '安装数', cpi: 'CPI ($)', roas: 'ROAS', impressions: '素材展示数',
    cpm: '素材千次展示成本', clicks: '素材点击数', cpc: '素材点击成本', ctr: '素材点击率',
    playCount: '播放次数', play2s: '播放2s次数', play6s: '播放6s次数',
    play25: '播放25%次数', play50: '播放50%次数', play75: '播放75%次数', play100: '播放100%次数',
  };

  const handleDragStart = (key: string) => {
    setDraggingKey(key);
  };

  const handleDragOver = (e: React.DragEvent, key: string) => {
    e.preventDefault();
    if (draggingKey && draggingKey !== key) {
      setDragOverKey(key);
    }
  };

  const handleDrop = (targetKey: string) => {
    if (!draggingKey || draggingKey === targetKey) {
      setDraggingKey(null);
      setDragOverKey(null);
      return;
    }
    const newOrder = [...columnOrder];
    const dragIdx = newOrder.indexOf(draggingKey);
    const targetIdx = newOrder.indexOf(targetKey);
    newOrder.splice(dragIdx, 1);
    newOrder.splice(targetIdx, 0, draggingKey);
    onReorder(newOrder);
    setDraggingKey(null);
    setDragOverKey(null);
  };

  const handleDragEnd = () => {
    setDraggingKey(null);
    setDragOverKey(null);
  };

  // Category key sets for grouping
  const categoryKeySets: Record<string, string[]> = {
    campaign: ['country', 'platform', 'category', 'spend', 'installs', 'cpi', 'roas'],
    basic: ['impressions', 'cpm', 'clicks', 'cpc', 'ctr'],
    video: ['playCount', 'play2s', 'play6s', 'play25', 'play50', 'play75', 'play100'],
  };

  // Derive category display order from columnOrder
  const categories = [
    { key: 'campaign', label: 'Campaign 数据' },
    { key: 'basic', label: '渠道素材基础数据' },
    { key: 'video', label: '视频播放数据' },
  ].map((cat) => ({
    ...cat,
    keys: columnOrder.filter((k) => categoryKeySets[cat.key].includes(k)),
  }));

  const toggleCategory = (catKeys: string[]) => {
    const allChecked = catKeys.every((k) => columnVisibility[k]);
    catKeys.forEach((k) => onToggleColumn(k, !allChecked));
  };

  return (
    <div style={{
      width: 260, height: '100%', background: cardBg,
      borderLeft: `1px solid ${borderColor}`, flexShrink: 0,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '10px 12px', borderBottom: `1px solid ${borderColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text strong style={{ fontSize: 12, color: textPrimary }}>自定义列</Text>
        <Button type="text" size="small" onClick={onClose} style={{ color: textSecondary, fontSize: 11 }}>关闭</Button>
      </div>
      <div style={{ padding: '6px 12px', borderBottom: `1px solid ${borderColor}` }}>
        <Text style={{ fontSize: 10, color: textMuted }}>拖动调整列顺序，勾选控制显示/隐藏</Text>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {categories.map((cat) => (
          <div key={cat.key}>
            <div onClick={() => toggleExpand(cat.key)} style={{
              padding: '6px 12px', cursor: 'pointer', display: 'flex',
              alignItems: 'center', gap: 5, background: darkHover,
              borderBottom: `1px solid ${borderColor}`,
            }}>
              {expandedKeys.includes(cat.key) ? <CaretDownOutlined style={{ fontSize: 9, color: textMuted }} /> : <CaretRightOutlined style={{ fontSize: 9, color: textMuted }} />}
              <Checkbox checked={cat.keys.every((k) => columnVisibility[k])}
                onClick={(e) => { e.stopPropagation(); toggleCategory(cat.keys); }} />
              <Text style={{ fontSize: 11, color: textPrimary, fontWeight: 500 }}>{cat.label}</Text>
            </div>
            {expandedKeys.includes(cat.key) && (
              <div style={{ padding: '2px 0' }}>
                {cat.keys.map((itemKey) => (
                  <div
                    key={itemKey}
                    draggable
                    onDragStart={() => handleDragStart(itemKey)}
                    onDragOver={(e) => handleDragOver(e, itemKey)}
                    onDrop={() => handleDrop(itemKey)}
                    onDragEnd={handleDragEnd}
                    style={{
                      padding: '4px 12px 4px 30px',
                      display: 'flex', alignItems: 'center', gap: 6,
                      cursor: 'grab',
                      background: draggingKey === itemKey ? '#3b82f620' : dragOverKey === itemKey ? '#3b82f610' : 'transparent',
                      borderTop: dragOverKey === itemKey ? `1px solid ${primaryColor}` : '1px solid transparent',
                      opacity: draggingKey === itemKey ? 0.5 : 1,
                      transition: 'background 0.15s, opacity 0.15s',
                    }}
                  >
                    <span style={{ color: textMuted, fontSize: 10, cursor: 'grab', userSelect: 'none', lineHeight: 1 }}>⠿</span>
                    <Checkbox
                      checked={columnVisibility[itemKey] !== false}
                      onChange={(e) => onToggleColumn(itemKey, e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ fontSize: 11 }}>
                      <Text style={{ fontSize: 11, color: textPrimary }}>{labelMap[itemKey] ?? itemKey}</Text>
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
export default function DataDiagnosis() {
  const {
    selectedRows, setSelectedRows, batchPause, batchResume, batchAdjustBudget,
    openAiDrawer, closeAiDrawer, fetchAiDiagnosis, aiDrawerOpen, aiDiagnosis,
    importFileName, setImportedData, dataUpdatedAt,
  } = useDataDiagnosisStore();

  const [customColVisible, setCustomColVisible] = useState(false);
  const [activeDimension, setActiveDimension] = useState('material-id');

  // Filter states
  const [startDate, setStartDate] = useState('2026-05-01');
  const [endDate, setEndDate] = useState('2026-05-15');
  const [source, setSource] = useState('yishijie-overseas');
  const [mediaCondition, setMediaCondition] = useState('equals');
  const [mediaValue, setMediaValue] = useState<string | undefined>(undefined);
  const [countryValue, setCountryValue] = useState<string | undefined>(undefined);
  const [platformValue, setPlatformValue] = useState<string | undefined>(undefined);
  const [statusValue, setStatusValue] = useState<string | undefined>(undefined);
  const [materialIdCondition, setMaterialIdCondition] = useState('contains');
  const [materialIdInput, setMaterialIdInput] = useState('');
  const [materialIdTags, setMaterialIdTags] = useState<string[]>([]);
  const [tagCondition, setTagCondition] = useState('contains');
  const [tagInput, setTagInput] = useState('');
  const [tagTags, setTagTags] = useState<string[]>([]);
  const [personalConfig, setPersonalConfig] = useState<string | undefined>(undefined);
  const [showAllFilters, setShowAllFilters] = useState(false);

  const addMaterialIdTag = () => {
    if (materialIdInput.trim() && !materialIdTags.includes(materialIdInput.trim())) {
      setMaterialIdTags([...materialIdTags, materialIdInput.trim()]);
      setMaterialIdInput('');
    }
  };
  const removeMaterialIdTag = (tag: string) => setMaterialIdTags(materialIdTags.filter((t) => t !== tag));
  const addTagTag = () => {
    if (tagInput.trim() && !tagTags.includes(tagInput.trim())) {
      setTagTags([...tagTags, tagInput.trim()]);
      setTagInput('');
    }
  };
  const removeTagTag = (tag: string) => setTagTags(tagTags.filter((t) => t !== tag));

  const handleImportExcel = async (file: File) => {
    try {
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

      // Find header row (contains '素材ID')
      let headerIdx = rows.findIndex(r => r && r.includes('素材ID'));
      if (headerIdx < 0) headerIdx = 1;

      const headers = rows[headerIdx] as string[];
      const colMap: Record<string, number> = {};
      headers.forEach((h, i) => { if (h) colMap[h.trim()] = i; });

      const parsed: any[] = [];
      for (let i = headerIdx + 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || !row[colMap['素材ID']]) continue;
        const materialId = String(row[colMap['素材ID']]);
        if (materialId === '汇总' || materialId.includes('汇总')) continue;

        // Parse preview JSON
        let previewUrl = '';
        const rawPreview = row[colMap['预览链接']];
        if (rawPreview) {
          try {
            const pj = typeof rawPreview === 'string' ? JSON.parse(rawPreview) : rawPreview;
            previewUrl = pj._PREVIEW_ || pj.url || '';
          } catch { previewUrl = String(rawPreview); }
        }

        const num = (key: string) => {
          const v = row[colMap[key]];
          return v != null && v !== '' ? Number(v) : 0;
        };

        parsed.push({
          key: materialId,
          isSummary: false,
          materialId,
          preview: previewUrl,
          country: '',
          platform: '',
          category: String(row[colMap['游戏分类']] || ''),
          status: '',
          spend: num('素材花费'),
          installs: 0,
          cpi: 0,
          roas: 0,
          impressions: num('素材展示数'),
          cpm: num('素材千次展示成本'),
          clicks: num('素材点击数'),
          cpc: num('素材点击成本'),
          ctr: num('素材点击率'),
          playCount: num('播放次数'),
          play2s: num('播放2s次数'),
          play6s: num('播放6s次数'),
          play25: num('播放25%次数'),
          play50: num('播放50%次数'),
          play75: num('播放75%次数'),
          play100: num('播放100%次数'),
        });
      }

      if (parsed.length === 0) {
        message.warning('未解析到有效数据行');
        return false;
      }

      setImportedData(parsed, file.name);
      useMaterialDataStore.getState().setData(parsed, file.name);
      message.success(`导入成功: ${parsed.length} 条数据 (${file.name})`);
    } catch (err: any) {
      message.error('导入失败: ' + err.message);
    }
    return false;
  };

  const handleAiDiagnosis = () => { openAiDrawer(); fetchAiDiagnosis(); };
  const handleExport = () => message.success('正在导出数据...');
  const handleQuery = () => message.success(`查询完成，共 ${filteredData.filter((r) => !r.isSummary).length} 条数据`);
  const handleToggleColumn = (key: string, checked: boolean) => {
    setColumnVisibility((prev) => ({ ...prev, [key]: checked }));
  };

  const resetFilters = () => {
    setStartDate('2026-05-01'); setEndDate('2026-05-15'); setSource('yishijie-overseas');
    setMediaCondition('equals'); setMediaValue(undefined); setCountryValue(undefined);
    setPlatformValue(undefined); setStatusValue(undefined); setMaterialIdCondition('contains');
    setMaterialIdInput(''); setMaterialIdTags([]); setTagCondition('contains'); setTagInput('');
    setTagTags([]); setPersonalConfig(undefined); message.success('筛选条件已重置');
  };

  // Active data source: shared store (reactive across all modules)
  const activeData = useMaterialDataStore(s => s.data);

  // Filter data
  const filteredData = activeData.filter((row) => {
    if (row.isSummary) return true;
    if (countryValue && row.country !== countryValue) return false;
    if (platformValue && row.platform !== platformValue) return false;
    if (statusValue && row.status !== statusValue) return false;
    if (materialIdTags.length > 0) {
      const match = materialIdTags.some((tag) => {
        if (materialIdCondition === 'contains') return row.materialId.toLowerCase().includes(tag.toLowerCase());
        return row.materialId.toLowerCase() === tag.toLowerCase();
      });
      if (!match) return false;
    }
    if (mediaValue) {
      if (mediaCondition === 'equals') { if (row.category !== mediaValue) return false; }
      else { if (!row.category.toLowerCase().includes(mediaValue.toLowerCase())) return false; }
    }
    return true;
  });

  const summaryRow: any = {
    key: 'summary', isSummary: true, materialId: '汇总', preview: '', country: '', platform: '', category: '', status: '',
    ...Object.fromEntries(
      ['spend', 'installs', 'cpi', 'roas', 'impressions', 'cpm', 'clicks', 'cpc', 'ctr', 'playCount', 'play2s', 'play6s', 'play25', 'play50', 'play75', 'play100'].map((k) => [
        k, filteredData.filter((r) => !r.isSummary).reduce((s: number, r: any) => s + (r[k] || 0), 0),
      ])
    ),
  };
  summaryRow.cpm = summaryRow.impressions > 0 ? +(summaryRow.spend / summaryRow.impressions * 1000).toFixed(2) : 0;
  summaryRow.cpc = summaryRow.clicks > 0 ? +(summaryRow.spend / summaryRow.clicks).toFixed(2) : 0;
  summaryRow.ctr = summaryRow.impressions > 0 ? +(summaryRow.clicks / summaryRow.impressions * 100).toFixed(2) : 0;
  summaryRow.cpi = summaryRow.installs > 0 ? +(summaryRow.spend / summaryRow.installs).toFixed(2) : 0;
  summaryRow.roas = summaryRow.spend > 0 ? +(summaryRow.roas / filteredData.filter((r) => !r.isSummary).length).toFixed(2) : 0;
  const tableData = [summaryRow, ...filteredData.filter((r) => !r.isSummary)];

  // Build columns - unified, controllable by custom panel
  const allColumnDefs: Record<string, any> = {
    operation: { title: '操作', dataIndex: 'operation', key: 'operation', width: 50, fixed: 'left' as const,
      render: (_: any, record: any) => record.isSummary ? null : <a style={{ color: primaryColor, fontSize: 11, cursor: 'pointer' }}>下钻</a> },
    status: { title: '状态', dataIndex: 'status', key: 'status', width: 60, fixed: 'left' as const,
      render: (v: string, record: any) => record.isSummary ? <Text style={{ color: textSecondary, fontSize: 11 }}>-</Text> : <Tag color={statusColor[v]} style={{ fontSize: 10 }}>{statusLabel[v] || v}</Tag> },
    materialId: { title: '素材ID', dataIndex: 'materialId', key: 'materialId', width: 80, fixed: 'left' as const,
      render: (v: string, record: any) => <Text style={{ color: record.isSummary ? textSecondary : textPrimary, fontSize: 11, fontWeight: record.isSummary ? 600 : 400 }}>{v}</Text> },
    preview: { title: '预览', dataIndex: 'preview', key: 'preview', width: 60, fixed: 'left' as const,
      render: (v: string, record: any) => record.isSummary ? null : (
        v ? <Image src={v} width={36} height={24} style={{ objectFit: 'cover', borderRadius: 2 }} preview={false} /> : <div style={{ width: 36, height: 24, background: darkHover, borderRadius: 2 }} />
      ) },
    country: { title: '国家', dataIndex: 'country', key: 'country', width: 60,
      filters: [...new Set(activeData.filter((r) => !r.isSummary).map((r) => r.country))].map((v) => ({ text: v, value: v })),
      onFilter: (val: any, rec: any) => rec.country === val,
      render: (v: string, record: any) => <Text style={{ color: record.isSummary ? textSecondary : textPrimary, fontSize: 11 }}>{v || '-'}</Text> },
    platform: { title: '平台', dataIndex: 'platform', key: 'platform', width: 60,
      filters: [...new Set(activeData.filter((r) => !r.isSummary).map((r) => r.platform))].map((v) => ({ text: v, value: v })),
      onFilter: (val: any, rec: any) => rec.platform === val,
      render: (v: string, record: any) => <Text style={{ color: record.isSummary ? textSecondary : textPrimary, fontSize: 11 }}>{v || '-'}</Text> },
    category: { title: '游戏分类', dataIndex: 'category', key: 'category', width: 70,
      render: (v: string, record: any) => <Text style={{ color: record.isSummary ? textSecondary : textPrimary, fontSize: 11 }}>{v || '-'}</Text> },
    installs: { title: '安装数', dataIndex: 'installs', key: 'installs', width: 70, sorter: (a: any, b: any) => a.installs - b.installs,
      render: (v: number, record: any) => <Text style={{ fontSize: 11, color: record.isSummary ? textPrimary : textSecondary }}>{v.toLocaleString()}</Text> },
    cpi: { title: 'CPI ($)', dataIndex: 'cpi', key: 'cpi', width: 70, sorter: (a: any, b: any) => a.cpi - b.cpi,
      render: (v: number, record: any) => <Text style={{ fontSize: 11, color: v > 5.5 ? '#EF4444' : record.isSummary ? textPrimary : textSecondary }}>${v.toFixed(2)}</Text> },
    roas: { title: 'ROAS', dataIndex: 'roas', key: 'roas', width: 70, sorter: (a: any, b: any) => a.roas - b.roas,
      render: (v: number, record: any) => <Text style={{ fontSize: 11, color: v >= 1 ? '#10B981' : v >= 0.8 ? '#F59E0B' : '#EF4444', fontWeight: record.isSummary ? 600 : 400 }}>{v.toFixed(2)}</Text> },
  };

  // Add material columns from columnGroups
  columnGroups.forEach((group) => {
    group.columns.forEach((col) => {
      allColumnDefs[col.key] = {
        ...col, width: 95,
        render: (v: number, record: any) => {
          if (record.isSummary) return <Text strong style={{ fontSize: 11, color: textPrimary, textAlign: 'right', display: 'block' }}>{formatNumber(v)}</Text>;
          if (col.key === 'ctr') return <Text style={{ fontSize: 11, color: textPrimary, textAlign: 'right', display: 'block' }}>{v}%</Text>;
          return <Text style={{ fontSize: 11, color: textSecondary, textAlign: 'right', display: 'block' }}>{formatNumber(v)}</Text>;
        },
      };
    });
  });

  // Default column order (spend before installs)
  const defaultColumnOrder = [
    'operation', 'status', 'materialId', 'preview',
    'country', 'platform', 'category', 'spend', 'installs', 'cpi', 'roas',
    'impressions', 'cpm', 'clicks', 'cpc', 'ctr',
    'playCount', 'play2s', 'play6s', 'play25', 'play50', 'play75', 'play100',
  ];

  // Build visible columns based on custom panel checked state
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    const vis: Record<string, boolean> = {};
    defaultColumnOrder.forEach((k) => { vis[k] = true; });
    return vis;
  });

  // Column order state for drag-and-drop reordering
  const [columnOrder, setColumnOrder] = useState<string[]>(defaultColumnOrder);
  const handleReorder = (newOrder: string[]) => { setColumnOrder(newOrder); };

  const allColumns = columnOrder
    .filter((key) => columnVisibility[key] !== false)
    .map((key) => allColumnDefs[key])
    .filter(Boolean);

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', margin: -24 }}>
      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: whiteBg }}>
        {/* Header */}
        <div style={{
          background: lightBg, padding: '8px 12px', borderBottom: `1px solid ${borderColor}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <Space size={6}>
            <BarChartOutlined style={{ color: primaryColor, fontSize: 14 }} />
            <Text strong style={{ color: textPrimary, fontSize: 13 }}>数据表格</Text>
          </Space>
          <Space size={6}>
            {importFileName && <Tag color="green" style={{ fontSize: 10 }}>{importFileName}</Tag>}
            {dataUpdatedAt && <Tag color="blue" style={{ fontSize: 10 }}>更新于 {dataUpdatedAt}</Tag>}
            <Upload showUploadList={false} beforeUpload={(file) => { handleImportExcel(file); return false; }} accept=".xlsx,.xls,.csv">
              <Button icon={<UploadOutlined />} size="small"
                style={{ borderColor: '#10B981', color: '#10B981', fontSize: 11 }}>导入Excel</Button>
            </Upload>
            <Button icon={<RobotOutlined />} onClick={handleAiDiagnosis} size="small"
              style={{ background: '#7C3AED', borderColor: '#7C3AED', color: '#fff', fontSize: 11 }}>AI 诊断</Button>
          </Space>
        </div>

        {/* Filter Bar */}
        <div style={{ background: lightBg, padding: '8px 12px', borderBottom: `1px solid ${borderColor}` }}>
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
                options={[{ value: 'yishijie-overseas', label: '益世界-海外' }, { value: 'yishijie-domestic', label: '益世界-国内' }, { value: 'other', label: '其他' }]} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Text style={{ color: textSecondary, fontSize: 11 }}>国家</Text>
              <Select value={countryValue} onChange={setCountryValue} placeholder="全部" size="small" style={{ width: 80 }} allowClear
                options={[{ value: 'US', label: 'US' }, { value: 'JP', label: 'JP' }, { value: 'KR', label: 'KR' }, { value: 'DE', label: 'DE' }, { value: 'BR', label: 'BR' }, { value: 'UK', label: 'UK' }, { value: 'FR', label: 'FR' }]} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Text style={{ color: textSecondary, fontSize: 11 }}>平台</Text>
              <Select value={platformValue} onChange={setPlatformValue} placeholder="全部" size="small" style={{ width: 80 }} allowClear
                options={[{ value: 'iOS', label: 'iOS' }, { value: 'Android', label: 'Android' }]} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Text style={{ color: textSecondary, fontSize: 11 }}>状态</Text>
              <Select value={statusValue} onChange={setStatusValue} placeholder="全部" size="small" style={{ width: 80 }} allowClear
                options={[{ value: 'active', label: '投放中' }, { value: 'paused', label: '已暂停' }, { value: 'completed', label: '已完成' }, { value: 'error', label: '异常' }]} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Text style={{ color: textSecondary, fontSize: 11 }}>媒体</Text>
              <Select value={mediaCondition} onChange={setMediaCondition} size="small" style={{ width: 70 }}
                options={[{ value: 'equals', label: '等于' }, { value: 'contains', label: '含有' }]} />
              <Select value={mediaValue} onChange={setMediaValue} placeholder="请选择" size="small" style={{ width: 100 }} allowClear
                options={[{ value: 'TikTok', label: 'TikTok' }, { value: 'Facebook', label: 'Facebook' }, { value: 'Google', label: 'Google' }]} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Text style={{ color: textSecondary, fontSize: 11 }}>素材ID</Text>
              <Select value={materialIdCondition} onChange={setMaterialIdCondition} size="small" style={{ width: 70 }}
                options={[{ value: 'contains', label: '含有' }, { value: 'equals', label: '等于' }]} />
              <Input value={materialIdInput} onChange={(e) => setMaterialIdInput(e.target.value)}
                onPressEnter={addMaterialIdTag} placeholder="请输入" size="small" style={{ width: 100, fontSize: 11 }} />
              <Button type="primary" size="small" icon={<PlusOutlined />} onClick={addMaterialIdTag}
                style={{ background: primaryColor, borderColor: primaryColor }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Text style={{ color: textSecondary, fontSize: 11 }}>标签</Text>
                <Select value={tagCondition} onChange={setTagCondition} size="small" style={{ width: 70 }}
                  options={[{ value: 'contains', label: '含有' }, { value: 'equals', label: '等于' }]} />
                <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                  onPressEnter={addTagTag} placeholder="请输入" size="small" style={{ width: 100, fontSize: 11 }} />
                <Button type="primary" size="small" icon={<PlusOutlined />} onClick={addTagTag}
                  style={{ background: primaryColor, borderColor: primaryColor }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Text style={{ color: textSecondary, fontSize: 11 }}>个人配置</Text>
                <Select value={personalConfig} onChange={setPersonalConfig} placeholder="请选择" size="small" style={{ width: 110 }} allowClear
                  options={[{ value: 'config1', label: '我的常用配置' }, { value: 'config2', label: 'ROAS分析配置' }]} />
              </div>
              {materialIdTags.map((tag) => (
                <Tag key={tag} closable onClose={() => removeMaterialIdTag(tag)}
                  style={{ background: '#3b82f620', borderColor: primaryColor, color: primaryColor, fontSize: 10 }}>
                  素材ID {materialIdCondition === 'contains' ? '含有' : '等于'} {tag}
                </Tag>
              ))}
              {tagTags.map((tag) => (
                <Tag key={tag} closable onClose={() => removeTagTag(tag)}
                  style={{ background: '#10b98120', borderColor: '#10b981', color: '#10b981', fontSize: 10 }}>
                  标签 {tagCondition === 'contains' ? '含有' : '等于'} {tag}
                </Tag>
              ))}
            </div>
            <Space size={6}>
              <Button type="primary" size="small" icon={<SearchOutlined />} onClick={handleQuery}
                style={{ background: primaryColor, borderColor: primaryColor, fontSize: 11 }}>查询</Button>
              <Button size="small" onClick={resetFilters}
                style={{ color: textSecondary, borderColor: borderColor, fontSize: 11 }}>重置</Button>
            </Space>
          </div>
        </div>

        {/* Dimension + Action Bar */}
        <div style={{ padding: '5px 12px', borderBottom: `1px solid ${borderColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space size={4}>
            <Button size="small" icon={<ColumnWidthOutlined />} style={{ borderColor: borderColor, color: textSecondary, fontSize: 11 }}>维度</Button>
            {[{ key: 'material-id', label: '素材ID' }, { key: 'game-category', label: '游戏分类' }, { key: 'preview-link', label: '预览链接' }].map((dim) => (
              <Button key={dim.key} size="small" onClick={() => setActiveDimension(dim.key)}
                style={{
                  background: activeDimension === dim.key ? primaryColor : 'transparent',
                  borderColor: activeDimension === dim.key ? primaryColor : borderColor,
                  color: activeDimension === dim.key ? '#fff' : textSecondary,
                  fontSize: 11,
                }}>{dim.label}</Button>
            ))}
          </Space>
          <Space size={4}>
            {selectedRows.length > 0 && (
              <>
                <Text style={{ color: textPrimary, fontSize: 11 }}>已选 {selectedRows.length} 项</Text>
                <Button size="small" icon={<PauseCircleOutlined />}
                  onClick={() => { batchPause(); message.success(`已暂停 ${selectedRows.length} 项`); }}
                  style={{ fontSize: 11 }}>暂停</Button>
                <Button size="small" icon={<PlayCircleOutlined />}
                  onClick={() => { batchResume(); message.success(`已恢复 ${selectedRows.length} 项`); }}
                  style={{ fontSize: 11 }}>恢复</Button>
                <Button size="small" icon={<DollarOutlined />}
                  onClick={() => { batchAdjustBudget(20); message.success(`+20% 预算`); }}
                  style={{ fontSize: 11 }}>+20%</Button>
                <Button size="small" icon={<DollarOutlined />}
                  onClick={() => { batchAdjustBudget(-20); message.success(`-20% 预算`); }}
                  style={{ fontSize: 11 }}>-20%</Button>
              </>
            )}
            <Button type="text" size="small" icon={<SortAscendingOutlined />} style={{ color: textSecondary, fontSize: 11 }}
              onClick={() => message.info('点击列头可排序')}>列排序</Button>
            <Button type="text" size="small" icon={<FilterOutlined />} style={{ color: textSecondary, fontSize: 11 }}
              onClick={() => setShowAllFilters(!showAllFilters)}>指标过滤</Button>
            <Button type="text" size="small" icon={<SettingOutlined />} onClick={() => setCustomColVisible(!customColVisible)}
              style={{ color: customColVisible ? primaryColor : textSecondary, fontSize: 11 }}>自定义列</Button>
            <Button type="text" size="small" icon={<DownloadOutlined />} onClick={handleExport}
              style={{ color: textSecondary, fontSize: 11 }}>导出</Button>
            <Text style={{ color: textMuted, fontSize: 10 }}>
              共 {filteredData.filter((r) => !r.isSummary).length} 条数据
            </Text>
          </Space>
        </div>

        {/* Unified Data Table */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <Table
            dataSource={tableData}
            columns={allColumns}
            pagination={{ pageSize: 15, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
            size="small"
            scroll={{ x: 'max-content' }}
            rowClassName={(record) => record.isSummary ? 'summary-row' : ''}
            rowSelection={{ selectedRowKeys: selectedRows, onChange: (keys) => setSelectedRows(keys as string[]) }}
            className="dark-table"
          />
        </div>
      </div>

      {/* Custom Columns Panel */}
      <CustomColumnsPanel visible={customColVisible} onClose={() => setCustomColVisible(false)}
        columnVisibility={columnVisibility} onToggleColumn={handleToggleColumn}
        columnOrder={columnOrder} onReorder={handleReorder} />

      {/* AI Panel */}
      <AiAssistantPanel />

      {/* AI Diagnosis Drawer */}
      <Drawer title="AI 智能诊断" placement="right" width={520}
        open={aiDrawerOpen} onClose={closeAiDrawer}
        styles={{ body: { background: '#1E293B' }, header: { background: '#1E293B' } }}>
        <pre style={{ color: '#E2E8F0', whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: 14 }}>
          {aiDiagnosis || '点击诊断按钮开始分析...'}
        </pre>
      </Drawer>
    </div>
  );
}
