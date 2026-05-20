import { useState, useEffect, useRef } from 'react';
import {
  Row, Col, Card, Button, Space, Tag, Input, Select, Typography, Modal, Divider,
  Progress, message,
} from 'antd';
import {
  RocketOutlined,
  ArrowLeftOutlined, CopyOutlined,
  HistoryOutlined, DeleteOutlined,
} from '@ant-design/icons';
import { useWorkshopStore } from '../stores/workshop';
import type { Formula, SeedanceCard } from '../stores/workshop';
import { formulas, structures } from '../stores/workshop';
import { usePlatformDataStore } from '../stores/platformData';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

const cardStyle = { background: '#1E293B', border: '1px solid #334155' };
const inputStyle = { background: '#0F172A', border: '1px solid #334155', color: '#E2E8F0' };

const platforms = ['抖音', '快手', 'TikTok', 'YouTube', 'Google', 'Facebook', 'AppLovin'];
const gameTypes = ['角色扮演', '策略', '卡牌', '放置挂机', 'MOBA', '模拟经营', '赛车', '益智/消除', '动作', '休闲', '射击', '冒险', '音乐/音游', '桌面棋牌'];

// ---- Formula Card ----
function FormulaCard({ formula, onClick }: { formula: Formula; onClick: () => void }) {
  return (
    <Card
      hoverable
      onClick={onClick}
      style={{
        ...cardStyle,
        cursor: 'pointer',
        overflow: 'hidden',
        position: 'relative',
        borderTop: `3px solid ${formula.color}`,
      }}
      bodyStyle={{ padding: 20 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10, background: formula.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
        }}>
          {formula.icon}
        </div>
        <Space size={4}>
          {formula.source === 'platform' && (
            <Tag color="green" style={{ fontSize: 10 }}>新增</Tag>
          )}
          <Tag color="default" style={{ fontSize: 11 }}>{formula.subtitle}</Tag>
        </Space>
      </div>
      <Text style={{ color: '#E2E8F0', fontSize: 16, fontWeight: 600, display: 'block', marginBottom: 12 }}>
        {formula.name}
      </Text>
      <div style={{ display: 'flex', gap: 20, marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #334155' }}>
        <div>
          <Text style={{ color: '#64748B', fontSize: 11, display: 'block' }}>代表案例</Text>
          <Text style={{ color: '#94A3B8', fontSize: 13 }}>{formula.caseStudy}</Text>
        </div>
        <div>
          <Text style={{ color: '#64748B', fontSize: 11, display: 'block' }}>人气值</Text>
          <Text style={{ color: '#FF6B35', fontSize: 13, fontWeight: 600 }}>{formula.popularity}</Text>
        </div>
        <div>
          <Text style={{ color: '#64748B', fontSize: 11, display: 'block' }}>素材时长</Text>
          <Text style={{ color: '#94A3B8', fontSize: 13 }}>{formula.duration}</Text>
        </div>
      </div>
      <Space size={[4, 4]} wrap>
        {formula.tags.map((t) => <Tag key={t} style={{ background: '#0F172A', border: '1px solid #334155', color: '#94A3B8', fontSize: 11 }}>{t}</Tag>)}
      </Space>
    </Card>
  );
}

// ---- Structure Modal ----
function StructureModal({
  formula, open, onClose, onUse,
}: {
  formula: Formula | null; open: boolean; onClose: () => void; onUse: () => void;
}) {
  if (!formula) return null;
  const struct = structures[formula.id] ?? [];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={560}
      destroyOnClose
      styles={{
        content: { background: '#0F172A', border: '1px solid #334155' },
        header: { background: '#0F172A' },
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12, background: formula.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
        }}>
          {formula.icon}
        </div>
        <div>
          <Text style={{ color: '#E2E8F0', fontSize: 18, fontWeight: 600, display: 'block' }}>{formula.name}</Text>
          <Text style={{ color: '#64748B', fontSize: 13 }}>{formula.subtitle}</Text>
        </div>
      </div>

      <Text style={{ color: '#94A3B8', fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 12 }}>公式结构拆解</Text>
      <div style={{ marginBottom: 20 }}>
        {struct.map((s, i) => (
          <div key={i} style={{
            display: 'flex', gap: 12, marginBottom: 8, padding: '10px 12px',
            background: '#1E293B', borderRadius: 8,
          }}>
            <Text style={{ color: '#FF6B35', fontWeight: 600, fontSize: 13, minWidth: 60 }}>{s.time}</Text>
            <Tag color="blue" style={{ fontSize: 11 }}>{s.type}</Tag>
            <Text style={{ color: '#E2E8F0', fontSize: 13 }}>{s.content}</Text>
          </div>
        ))}
      </div>

      <Row gutter={12} style={{ marginBottom: 20 }}>
        <Col span={12}>
          <Card style={cardStyle} size="small">
            <Text style={{ color: '#64748B', fontSize: 12, display: 'block', marginBottom: 4 }}>适用游戏类型</Text>
            <Text style={{ color: '#E2E8F0', fontSize: 13 }}>{formula.tags.join('、')}</Text>
          </Card>
        </Col>
        <Col span={12}>
          <Card style={cardStyle} size="small">
            <Text style={{ color: '#64748B', fontSize: 12, display: 'block', marginBottom: 4 }}>制作要点</Text>
            <Text style={{ color: '#E2E8F0', fontSize: 13 }}>{formula.tip}</Text>
          </Card>
        </Col>
      </Row>

      <Button type="primary" block size="large" onClick={onUse} style={{ borderRadius: 8 }}>
        使用这个公式生成脚本 →
      </Button>
    </Modal>
  );
}

// ---- Script Card ----
function ScriptCard({
  type, label, content, selectedTitle, onGenerateSeedance, loading,
}: {
  type: string; label: string; content: string; selectedTitle: string;
  onGenerateSeedance: () => void; loading: boolean;
}) {
  const headerColors: Record<string, string> = {
    aggressive: 'linear-gradient(135deg, #ff6b6b, #ff8e8e)',
    curious: 'linear-gradient(135deg, #9b59b6, #bb8fce)',
    data: 'linear-gradient(135deg, #3498db, #5dade2)',
  };

  const parseSection = (text: string, pattern: RegExp) => {
    const m = text.match(pattern);
    return m ? m[1].trim() : '';
  };

  const totalScore = parseInt(parseSection(content, /质量评分[：:]?\s*(\d+)\s*\/\s*100/) || '0');
  const highlight = parseSection(content, /亮点金句[：:]\s*["""]?([^"""]+?)["""]?\s*(?=\n|$)/);

  // Extract main content sections
  const hook = parseSection(content, /开场钩子[（(]\d+-?\d+秒[）)][：:]\s*([\s\S]*?)(?=\n\n|\n主体|\n行动|\nBGM|\n视觉|\n创作|\n质量|$)/);
  const main = parseSection(content, /主体内容[（(]\d+-?\d+秒[）)][：:]\s*([\s\S]*?)(?=\n\n|\n行动号召|\nBGM|\n视觉|\n创作|\n质量|$)/);
  const cta = parseSection(content, /行动号召[（(]最后\d+秒[）)][：:]\s*([\s\S]*?)(?=\n\n|\nBGM|\n视觉|\n创作|\n质量|$)/);
  const bgm = parseSection(content, /BGM风格[：:]\s*([\s\S]*?)(?=\n\n|\n视觉|\n创作|\n质量|$)/);

  return (
    <Card
      style={{ ...cardStyle, overflow: 'hidden' }}
      bodyStyle={{ padding: 0 }}
    >
      <div style={{
        padding: '16px 20px',
        background: headerColors[type] || headerColors.aggressive,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%', background: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 18, color: '#333', flexShrink: 0,
        }}>
          {type === 'aggressive' ? 'A' : type === 'curious' ? 'B' : 'C'}
        </div>
        <div style={{ flex: 1 }}>
          <Text style={{ color: 'white', fontSize: 15, fontWeight: 600 }}>{selectedTitle}</Text>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <Tag color="rgba(255,255,255,0.2)" style={{ color: 'white', fontSize: 11 }}>{label}</Tag>
            {totalScore > 0 && <Tag color="rgba(255,255,255,0.2)" style={{ color: 'white', fontSize: 11 }}>⭐ {totalScore}</Tag>}
          </div>
        </div>
      </div>

      <div style={{ padding: 20 }}>
        {hook && (
          <div style={{ marginBottom: 12 }}>
            <Tag color="magenta" style={{ fontSize: 11, marginBottom: 6 }}>开场钩子</Tag>
            <Paragraph style={{ color: '#E2E8F0', fontSize: 13, margin: 0, whiteSpace: 'pre-wrap' }}>{hook}</Paragraph>
          </div>
        )}
        {main && (
          <div style={{ marginBottom: 12 }}>
            <Tag color="blue" style={{ fontSize: 11, marginBottom: 6 }}>主体内容</Tag>
            <Paragraph style={{ color: '#E2E8F0', fontSize: 13, margin: 0, whiteSpace: 'pre-wrap' }}>{main}</Paragraph>
          </div>
        )}
        {cta && (
          <div style={{ marginBottom: 12 }}>
            <Tag color="green" style={{ fontSize: 11, marginBottom: 6 }}>行动号召</Tag>
            <Paragraph style={{ color: '#E2E8F0', fontSize: 13, margin: 0, whiteSpace: 'pre-wrap' }}>{cta}</Paragraph>
          </div>
        )}
        {bgm && (
          <div style={{ marginBottom: 12 }}>
            <Tag color="orange" style={{ fontSize: 11, marginBottom: 6 }}>BGM风格</Tag>
            <Text style={{ color: '#94A3B8', fontSize: 13 }}>{bgm}</Text>
          </div>
        )}

        {highlight && (
          <div style={{
            background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.2)',
            borderRadius: 8, padding: '10px 14px', marginBottom: 12,
          }}>
            <Text style={{ color: '#FF6B35', fontSize: 13, fontStyle: 'italic' }}>"{highlight}"</Text>
          </div>
        )}

        {totalScore > 0 && (
          <div style={{
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: 8, padding: 14, marginBottom: 12,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: '#10B981', fontSize: 13, fontWeight: 600 }}>质量评分</Text>
              <Text style={{ color: '#10B981', fontSize: 18, fontWeight: 700 }}>{totalScore}/100</Text>
            </div>
            {[
              { label: '开场钩子', pattern: /开场钩子[：:]?\s*(\d+)/, max: 25, color: '#42a5f5' },
              { label: '情绪张力', pattern: /情绪张力[：:]?\s*(\d+)/, max: 20, color: '#ab47bc' },
              { label: '卖点突出', pattern: /卖点突出[：:]?\s*(\d+)/, max: 20, color: '#ff9800' },
              { label: 'CTA效果', pattern: /CTA效果[：:]?\s*(\d+)/, max: 20, color: '#66bb6a' },
              { label: '节奏流畅', pattern: /节奏流畅[：:]?\s*(\d+)/, max: 15, color: '#ec407a' },
            ].map(({ label, pattern, max, color }) => {
              const val = parseInt(parseSection(content, pattern) || '0');
              return (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Text style={{ color: '#94A3B8', fontSize: 12, minWidth: 60 }}>{label}</Text>
                  <Progress
                    percent={Math.min(100, (val / max) * 100)}
                    strokeColor={color}
                    showInfo={false}
                    size="small"
                    style={{ flex: 1, margin: 0 }}
                  />
                  <Text style={{ color: '#E2E8F0', fontSize: 12, minWidth: 24, textAlign: 'right' }}>{val}</Text>
                </div>
              );
            })}
          </div>
        )}

        <Button
          type="primary"
          block
          icon={<RocketOutlined />}
          loading={loading}
          onClick={onGenerateSeedance}
          style={{ borderRadius: 8, background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none' }}
        >
          生成 Seedance2.0 提示词
        </Button>
      </div>
    </Card>
  );
}

// ---- Seedance Card Component ----
function SeedanceCardView({ card }: { card: SeedanceCard }) {
  const copyContent = () => {
    navigator.clipboard.writeText(card.content);
    message.success('已复制到剪贴板');
  };

  // Parse sections from content
  const sections: { label: string; content: string }[] = [];
  const headerNames = ['视频内容分析', '场景环境', '人物角色', '镜头运动与动作序列', '视觉风格', '情感氛围', '时间结构'];
  const headerMatches: { pos: number; header: string; end: number }[] = [];

  for (const header of headerNames) {
    const reg = new RegExp('(\\n|^)' + header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*[：:]?\\s*', 'gi');
    let match;
    while ((match = reg.exec(card.content)) !== null) {
      headerMatches.push({ pos: match.index + match[1].length, header, end: match.index + match[0].length });
    }
  }
  headerMatches.sort((a, b) => a.pos - b.pos);
  for (let i = 0; i < headerMatches.length; i++) {
    const current = headerMatches[i];
    const next = headerMatches[i + 1];
    const content = card.content.substring(current.end, next ? next.pos : card.content.length).trim();
    if (content) sections.push({ label: current.header, content });
  }

  const sectionColors: Record<string, string> = {
    '视频内容分析': '#1565c0', '场景环境': '#2e7d32', '人物角色': '#7b1fa2',
    '镜头运动与动作序列': '#e65100', '视觉风格': '#c62828', '情感氛围': '#f57c00', '时间结构': '#00838f',
  };

  return (
    <Card style={{ ...cardStyle, overflow: 'hidden', marginBottom: 16 }} bodyStyle={{ padding: 0 }}>
      <div style={{
        padding: '14px 20px',
        background: 'linear-gradient(135deg, #ff6b35, #ff8e53)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <RocketOutlined style={{ color: 'white', fontSize: 18 }} />
        <Text style={{ color: 'white', fontSize: 16, fontWeight: 700 }}>{card.typeName}</Text>
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginLeft: 'auto' }}>{card.title}</Text>
      </div>

      <div style={{ padding: 20 }}>
        {sections.length > 0 ? sections.map((sec, i) => (
          <div key={i} style={{ marginBottom: 16 }}>
            <Tag
              color={sectionColors[sec.label] || '#4F46E5'}
              style={{ fontSize: 12, marginBottom: 8 }}
            >
              {sec.label}
            </Tag>
            <div style={{
              padding: '12px 14px', background: '#0F172A', borderRadius: 8,
              fontSize: 13, lineHeight: 1.8, color: '#94A3B8',
              whiteSpace: 'pre-wrap', borderLeft: `3px solid ${sectionColors[sec.label] || '#4F46E5'}`,
            }}>
              {sec.content}
            </div>
          </div>
        )) : (
          <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.8, color: '#94A3B8', padding: 12 }}>
            {card.content}
          </div>
        )}

        <Button
          block
          icon={<CopyOutlined />}
          onClick={copyContent}
          style={{ borderRadius: 8, marginTop: 8 }}
        >
          复制提示词
        </Button>
      </div>
    </Card>
  );
}

// ---- Main Component ----

export default function Workshop() {
  const {
    page, selectedFormula, discoveredFormulas, gameDesc, platform, gameType, loading,
    titles, selectedTitle, scripts, seedanceCards, error, history,
    selectFormula, setGameDesc, setPlatform, setGameType,
    setSelectedTitle, generateTitles, generateScripts, generateSeedance,
    clearHistory, goToGenerate, goHome, syncFromPlatformData,
  } = useWorkshopStore();

  const { platforms: platformConfigs, platformsLoaded, fetchPlatforms } = usePlatformDataStore();
  const syncedRef = useRef(false);

  // Sync platform data to workshop on mount
  useEffect(() => {
    if (!platformsLoaded) fetchPlatforms();
  }, [platformsLoaded]);

  useEffect(() => {
    if (platformsLoaded && !syncedRef.current) {
      syncedRef.current = true;
      const originalPlatform = usePlatformDataStore.getState().platform;
      const defaultPlatforms = platformConfigs.filter((p) => p.id === 'guangdada' || p.id === 'adxray');
      defaultPlatforms.forEach((p) => {
        usePlatformDataStore.getState().setPlatform(p.id);
        Promise.all([
          usePlatformDataStore.getState().fetchCreatives(),
          usePlatformDataStore.getState().fetchRankings(),
        ]).then(() => {
          const state = usePlatformDataStore.getState();
          syncFromPlatformData(state.creatives, state.rankings, p.id, p.name);
        });
      });
      usePlatformDataStore.getState().setPlatform(originalPlatform);
    }
  }, [platformsLoaded]);

  // Discovered formulas first, then built-in
  const allFormulas = [...discoveredFormulas, ...formulas];

  const [formulaModal, setFormulaModal] = useState<Formula | null>(null);
  const [filter, setFilter] = useState('all');
  const [showHistory, setShowHistory] = useState(false);

  const filteredFormulas = filter === 'all' ? allFormulas
    : filter === 'hot' ? allFormulas.filter((f) => f.subtitle.includes('热门'))
    : filter === 'rising' ? allFormulas.filter((f) => f.subtitle.includes('飙升'))
    : allFormulas.filter((f) => f.subtitle.includes('新创意'));

  // Group discovered formulas by time period
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const monthAgo = new Date(now.getTime() - 30 * 86400000);

  type FormulaGroup = { label: string; dateLabel: string; formulas: Formula[] };
  const groupedDisplay: FormulaGroup[] = [];

  // All formulas have discoveredAt (seeded on first load)
  const discoveredFiltered = filteredFormulas.filter((f) => f.discoveredAt);

  // Group by time period
  const todayItems: Formula[] = [];
  const weekItems: Formula[] = [];
  const monthItems: Formula[] = [];
  const olderItems: Formula[] = [];

  discoveredFiltered.forEach((f) => {
    const d = new Date(f.discoveredAt!);
    const dateStr = f.discoveredAt!.slice(0, 10);
    if (dateStr === todayStr) {
      todayItems.push(f);
    } else if (d >= weekAgo) {
      weekItems.push(f);
    } else if (d >= monthAgo) {
      monthItems.push(f);
    } else {
      olderItems.push(f);
    }
  });

  if (todayItems.length > 0) groupedDisplay.push({ label: 'today', dateLabel: `今天 ${todayStr}`, formulas: todayItems });
  if (weekItems.length > 0) groupedDisplay.push({ label: 'week', dateLabel: '本周', formulas: weekItems });
  if (monthItems.length > 0) groupedDisplay.push({ label: 'month', dateLabel: '本月', formulas: monthItems });
  if (olderItems.length > 0) groupedDisplay.push({ label: 'older', dateLabel: '更早', formulas: olderItems });

  // ---- Home Page ----
  if (page === 'home') {
    return (
      <div className="page-enter">
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Text style={{
            fontSize: 28, fontWeight: 700,
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            display: 'block', marginBottom: 6,
          }}>
            爆款创意公式
          </Text>
          <Text style={{ color: '#64748B', fontSize: 14 }}>基于广大大数据，一键生成买量脚本</Text>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 28 }}>
          {[
            { key: 'all', label: '全部公式' },
            { key: 'hot', label: '每周热门榜' },
            { key: 'rising', label: '每周飙升榜' },
            { key: 'new', label: '新创意榜' },
          ].map((f) => (
            <Button
              key={f.key}
              type={filter === f.key ? 'primary' : 'default'}
              onClick={() => setFilter(f.key)}
              style={{ borderRadius: 6 }}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {groupedDisplay.map((group) => (
          <div key={group.label} style={{ marginBottom: 24 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14,
              padding: '0 4px',
            }}>
              <div style={{
                height: 1, flex: 1,
                background: 'linear-gradient(90deg, transparent, #334155 20%, #334155 80%, transparent)',
              }} />
              <Tag
                color={group.label === 'today' ? 'green' : group.label === 'builtin' ? 'default' : 'blue'}
                style={{
                  fontSize: 12, padding: '2px 12px', borderRadius: 10,
                  ...(group.label === 'today' ? { background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e' } : {}),
                }}
              >
                {group.dateLabel}
              </Tag>
              <div style={{
                height: 1, flex: 1,
                background: 'linear-gradient(90deg, transparent, #334155 20%, #334155 80%, transparent)',
              }} />
            </div>
            <Row gutter={[16, 16]}>
              {group.formulas.map((f) => (
                <Col xs={24} sm={12} lg={8} xl={6} key={f.id}>
                  <FormulaCard
                    formula={f}
                    onClick={() => setFormulaModal(f)}
                  />
                </Col>
              ))}
            </Row>
          </div>
        ))}

        <StructureModal
          formula={formulaModal}
          open={!!formulaModal}
          onClose={() => setFormulaModal(null)}
          onUse={() => {
            if (formulaModal) {
              selectFormula(formulaModal);
              setFormulaModal(null);
              goToGenerate();
            }
          }}
        />
      </div>
    );
  }

  // ---- Generate Page ----
  return (
    <div className="page-enter">
      {/* Back + formula bar */}
      <Card style={{ ...cardStyle, marginBottom: 16 }} bodyStyle={{ padding: '12px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={goHome} type="text" style={{ color: '#94A3B8' }}>
              返回
            </Button>
            <Divider type="vertical" style={{ borderColor: '#334155' }} />
            <Text style={{ color: '#E2E8F0', fontWeight: 600 }}>
              {selectedFormula?.icon} {selectedFormula?.name ?? '创意工坊'}
            </Text>
          </Space>
          <Space>
            <Button
              icon={<HistoryOutlined />}
              onClick={() => setShowHistory(true)}
              type="text"
              style={{ color: '#94A3B8' }}
            >
              历史
            </Button>
            <Button onClick={goHome} size="small">更换公式</Button>
          </Space>
        </div>
      </Card>

      {/* Form */}
      <Card style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <Text style={{ color: '#94A3B8', display: 'block', marginBottom: 6 }}>描述游戏</Text>
          <TextArea
            rows={2}
            value={gameDesc}
            onChange={(e) => setGameDesc(e.target.value)}
            placeholder="请输入游戏描述，例如：一款末日生存建造游戏，玩家需要在丧尸横行的世界中建造避难所..."
            style={inputStyle}
          />
        </div>

        <Row gutter={16}>
          <Col span={8}>
            <Text style={{ color: '#94A3B8', display: 'block', marginBottom: 6 }}>投放平台</Text>
            <Select
              value={platform}
              onChange={setPlatform}
              style={{ width: '100%' }}
              options={platforms.map((p) => ({ label: p, value: p }))}
            />
          </Col>
          <Col span={16}>
            <Text style={{ color: '#94A3B8', display: 'block', marginBottom: 6 }}>游戏类型（可选）</Text>
            <Space size={[6, 6]} wrap>
              {gameTypes.map((t) => (
                <Tag
                  key={t}
                  onClick={() => setGameType(gameType === t ? '' : t)}
                  style={{
                    cursor: 'pointer',
                    background: gameType === t ? '#4F46E5' : '#0F172A',
                    border: `1px solid ${gameType === t ? '#4F46E5' : '#334155'}`,
                    color: gameType === t ? 'white' : '#94A3B8',
                    borderRadius: 4,
                    fontSize: 12,
                    padding: '3px 10px',
                  }}
                >
                  {t}
                </Tag>
              ))}
            </Space>
          </Col>
        </Row>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 8, padding: '10px 14px', marginTop: 12,
          }}>
            <Text style={{ color: '#EF4444', fontSize: 13 }}>{error}</Text>
          </div>
        )}

        <Button
          type="primary"
          block
          size="large"
          loading={loading}
          disabled={!gameDesc.trim()}
          onClick={generateTitles}
          style={{ marginTop: 16, borderRadius: 8 }}
        >
          {loading ? '生成中...' : '生成标题'}
        </Button>
      </Card>

      {/* Titles */}
      {titles.length > 0 && (
        <Card style={{ ...cardStyle, marginBottom: 16 }}>
          <Text style={{ color: '#E2E8F0', fontSize: 15, fontWeight: 600, display: 'block', textAlign: 'center', marginBottom: 16 }}>
            选择标题
          </Text>
          <Row gutter={[10, 10]}>
            {titles.map((t, i) => (
              <Col span={8} key={i}>
                <div
                  onClick={() => setSelectedTitle(t)}
                  style={{
                    padding: '10px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                    lineHeight: 1.5, fontSize: 13, transition: 'all 0.2s',
                    background: selectedTitle === t
                      ? 'linear-gradient(135deg, #667eea, #764ba2)'
                      : '#0F172A',
                    border: `2px solid ${selectedTitle === t ? 'transparent' : '#334155'}`,
                    color: selectedTitle === t ? 'white' : '#E2E8F0',
                    transform: selectedTitle === t ? 'scale(1.02)' : 'none',
                    boxShadow: selectedTitle === t ? '0 4px 16px rgba(102,126,234,0.3)' : 'none',
                  }}
                >
                  {t}
                </div>
              </Col>
            ))}
          </Row>

          {selectedTitle && (
            <Button
              type="primary"
              block
              size="large"
              loading={loading}
              onClick={generateScripts}
              style={{ marginTop: 16, borderRadius: 8 }}
            >
              {loading ? '正在生成脚本，请稍候...' : '生成3个版本脚本'}
            </Button>
          )}
        </Card>
      )}

      {/* Scripts */}
      {Object.keys(scripts).length > 0 && (
        <>
          <Text style={{ color: '#E2E8F0', fontSize: 16, fontWeight: 600, display: 'block', textAlign: 'center', marginBottom: 16 }}>
            3个版本脚本
          </Text>
          <Row gutter={[16, 16]}>
            {[
              { type: 'aggressive', label: '激进版' },
              { type: 'curious', label: '猎奇版' },
              { type: 'data', label: '数据版' },
            ].map(({ type, label }) => (
              scripts[type] ? (
                <Col xs={24} lg={8} key={type}>
                  <ScriptCard
                    type={type}
                    label={label}
                    content={scripts[type]}
                    selectedTitle={selectedTitle}
                    onGenerateSeedance={() => generateSeedance(type)}
                    loading={loading}
                  />
                </Col>
              ) : null
            ))}
          </Row>
        </>
      )}

      {/* Seedance Cards */}
      {seedanceCards.length > 0 && (
        <>
          <Text style={{ color: '#E2E8F0', fontSize: 16, fontWeight: 600, display: 'block', textAlign: 'center', marginBottom: 16, marginTop: 24 }}>
            Seedance2.0 视频提示词
          </Text>
          <Row gutter={[16, 16]}>
            {seedanceCards.map((card) => (
              <Col xs={24} lg={12} key={card.id}>
                <SeedanceCardView card={card} />
              </Col>
            ))}
          </Row>
        </>
      )}

      {/* History Drawer */}
      <Modal
        title="历史记录"
        open={showHistory}
        onCancel={() => setShowHistory(false)}
        footer={
          history.length > 0 ? (
            <Button danger icon={<DeleteOutlined />} onClick={clearHistory}>
              清空历史
            </Button>
          ) : null
        }
        width={480}
        styles={{
          content: { background: '#0F172A', border: '1px solid #334155' },
          header: { background: '#0F172A' },
        }}
      >
        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#64748B' }}>
            <HistoryOutlined style={{ fontSize: 36, marginBottom: 12, display: 'block' }} />
            暂无记录
          </div>
        ) : (
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {history.map((item) => (
              <Card
                key={item.id}
                style={{ ...cardStyle, marginBottom: 8 }}
                bodyStyle={{ padding: 12 }}
                hoverable
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Tag color="blue" style={{ fontSize: 11 }}>
                    {item.type === 'scripts' ? '脚本' : item.type === 'seedance' ? 'Seedance' : '标题'}
                  </Tag>
                  <Text style={{ color: '#64748B', fontSize: 11 }}>{item.time}</Text>
                </div>
                <Text style={{ color: '#E2E8F0', fontSize: 13, display: 'block' }}>
                  {item.title ?? item.formula ?? '未命名'}
                </Text>
                <Text style={{ color: '#64748B', fontSize: 11 }}>
                  {item.gameDesc?.slice(0, 40)}{item.gameDesc?.length > 40 ? '...' : ''} | {item.platform}
                </Text>
              </Card>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
