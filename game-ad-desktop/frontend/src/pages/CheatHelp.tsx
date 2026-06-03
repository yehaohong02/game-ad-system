import { useState } from 'react';
import { Modal, Button, Typography, Tag, Card } from 'antd';
import {
  QuestionCircleOutlined, ArrowRightOutlined, ArrowLeftOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const cardBg = '#1E293B';
const border = '#334155';
const green = '#10b981';
const red = '#ef4444';
const blue = '#3b82f6';
const purple = '#8b5cf6';
const yellow = '#f59e0b';
const cyan = '#06b6d4';
const textPrimary = '#E2E8F0';
const textSecondary = '#94A3B8';
const textMuted = '#64748b';

type Page = 'dashboard' | 'score' | 'predict' | 'retro' | 'rubric';

interface HelpSection {
  title: string;
  content: React.ReactNode;
}

const HELP_DATA: Record<Page, { title: string; subtitle: string; sections: HelpSection[] }> = {
  // ═══════════════════════════════════════════
  // 仪表盘帮助
  // ═══════════════════════════════════════════
  dashboard: {
    title: '仪表盘总览',
    subtitle: '了解当前校准状态和下一步操作',
    sections: [
      {
        title: '📊 这个页面是什么？',
        content: (
          <div>
            <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
              仪表盘是你的<strong style={{ color: textPrimary }}>校准作战室</strong>，一眼看清：
              校准了多少样本、预测准不准、有没有素材等着复盘。
            </Paragraph>
            <Card style={{ background: '#0F172A', border: `1px solid ${border}`, marginBottom: 12 }}>
              <div style={{ color: textPrimary, fontWeight: 600, marginBottom: 8 }}>四个核心指标卡片：</div>
              {[
                { icon: '🎯', label: '校准样本数', desc: '你已经复盘了多少条素材。越多，公式越准。' },
                { icon: '📦', label: '缓冲区', desc: '还有多少素材等着发布。红=快断粮，绿=节奏好。' },
                { icon: '📝', label: '预测总数', desc: '已写盲测预测的数量。每个预测都是一个校准实验。' },
                { icon: '📉', label: '平均误差', desc: '预测和实际的差距。越低越好，目标 <25%。' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  <div><Text strong style={{ color: textPrimary }}>{item.label}</Text><Text style={{ color: textMuted, marginLeft: 8 }}>{item.desc}</Text></div>
                </div>
              ))}
            </Card>
          </div>
        ),
      },
      {
        title: '🚦 置信度颜色',
        content: (
          <div>
            <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
              校准样本数旁的颜色标签代表<strong style={{ color: textPrimary }}>你能信任公式多少</strong>：
            </Paragraph>
            {[
              { color: 'red', emoji: '🔴', label: '0-2 样本', desc: '占星阶段，什么都别信' },
              { color: 'orange', emoji: '🟠', label: '3-5 样本', desc: '仅能看方向趋势' },
              { color: 'yellow', emoji: '🟡', label: '6-10 样本', desc: '可以参考排名' },
              { color: 'green', emoji: '🟢', label: '11-20 样本', desc: '可以做决策' },
              { color: 'blue', emoji: '🔵', label: '21+ 样本', desc: '数据驱动，完全可信' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, padding: '6px 0' }}>
                <Tag color={item.color} style={{ minWidth: 80, textAlign: 'center' }}>{item.emoji} {item.label}</Tag>
                <Text style={{ color: textSecondary, fontSize: 13 }}>{item.desc}</Text>
              </div>
            ))}
          </div>
        ),
      },
      {
        title: '⚡ 快速上手路线',
        content: (
          <div>
            {[
              { day: '第 1 天', tag: 'blue', actions: '点「导入 Excel 评分」→ 看自动评分结果 → 理解 7 个维度' },
              { day: '第 2-3 天', tag: 'green', actions: '去「素材评分」手动评 3 条 → 去「盲测预测」写预测 → 发布' },
              { day: '第 6 天', tag: 'cyan', actions: '去「复盘中心」录入实际数据 → 看误差率 → 记录观察' },
              { day: '第 10+ 天', tag: 'purple', actions: '积累 5+ 复盘 → 去「公式管理」触发进化 → 校准完成' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
                <Tag color={item.tag} style={{ marginTop: 2 }}>{item.day}</Tag>
                <Text style={{ color: textSecondary, fontSize: 14 }}>{item.actions}</Text>
              </div>
            ))}
          </div>
        ),
      },
    ],
  },

  // ═══════════════════════════════════════════
  // 评分页面帮助
  // ═══════════════════════════════════════════
  score: {
    title: '素材评分指南',
    subtitle: '理解 7 个维度和评分逻辑',
    sections: [
      {
        title: '🎯 评分是什么？',
        content: (
          <div>
            <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
              给每条素材在 7 个维度上打 0-5 分，系统自动计算<strong style={{ color: textPrimary }}>综合分</strong>并归入对应<strong style={{ color: textPrimary }}>桶</strong>。
              当你通过「导入 Excel」导入数据时，系统会用实际表现数据（CTR、播放率等）自动评分。
              你也可以在这里手动评分——<strong style={{ color: yellow }}>手动评分时不要看实际数据</strong>（盲测原则）。
            </Paragraph>
          </div>
        ),
      },
      {
        title: '📐 7 个维度详解',
        content: (
          <div>
            {[
              { key: 'ER', name: '情感共鸣', weight: '×1.5', what: '观众看完后的情绪强度', how: 'CTR 点击率高 = 共鸣强', example: '「这也太真实了」→ 4分' },
              { key: 'SR', name: '社会共鸣', weight: '×1.5', what: '观众会不会转发/讨论', how: 'CPC 获客成本低 = 传播广', example: '「我要发给朋友看」→ 4分' },
              { key: 'HP', name: '钩子潜力', weight: '×1.5', what: '前 3 秒能不能留住人', how: '2s 播放率高 = 钩子强', example: '开头直接冲突 → 5分' },
              { key: 'QL', name: '金句密度', weight: '×1.0', what: '有没有可以截图传播的句子', how: '50% 播放率 = 看完一半有料', example: '「你以为的捷径其实是弯路」→ 4分' },
              { key: 'NA', name: '叙事性', weight: '×1.0', what: '故事线是否完整', how: '100% 播放率 = 故事好到看完', example: '有起承转合 → 4分' },
              { key: 'AB', name: '受众广度', weight: '×1.0', what: '覆盖面有多广', how: '总播放量大 = 覆盖面广', example: '全年龄题材 → 4分' },
              { key: 'SAT', name: '投放效率', weight: '×1.0', what: '千次曝光成本低不低', how: 'CPM 低 = 效率高', example: 'CPM < 均值 → 4分' },
            ].map(d => (
              <Card key={d.key} style={{ background: '#0F172A', border: `1px solid ${border}`, marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <Tag color={blue} style={{ minWidth: 36, textAlign: 'center', fontWeight: 700 }}>{d.key}</Tag>
                  <Text strong style={{ color: textPrimary, fontSize: 15 }}>{d.name}</Text>
                  <Tag style={{ background: '#1E293B', border: `1px solid ${border}`, color: textMuted }}>{d.weight}</Tag>
                </div>
                <div style={{ color: textSecondary, fontSize: 13, lineHeight: 1.8 }}>
                  <div>📌 <strong>是什么：</strong>{d.what}</div>
                  <div>📊 <strong>数据来源：</strong>{d.how}</div>
                  <div>💡 <strong>举例：</strong><span style={{ color: cyan }}>{d.example}</span></div>
                </div>
              </Card>
            ))}
          </div>
        ),
      },
      {
        title: '🏷️ 分桶规则',
        content: (
          <div>
            <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
              综合分 = 7 维度加权平均 × 2，映射到 5 个桶：
            </Paragraph>
            {[
              { bucket: '爆款 viral', range: '≥ 5.0', color: green, desc: '综合表现 Top 10%' },
              { bucket: '超均 outperform', range: '2.0 - 5.0', color: cyan, desc: '高于平均水平' },
              { bucket: '均值 average', range: '0.8 - 2.0', color: blue, desc: '正常水平' },
              { bucket: '低于均值 underperform', range: '0.3 - 0.8', color: yellow, desc: '低于平均水平' },
              { bucket: '扑街 flop', range: '< 0.3', color: red, desc: '表现很差' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, padding: '6px 0' }}>
                <Tag color={item.color} style={{ minWidth: 140 }}>{item.bucket}</Tag>
                <Text style={{ color: textPrimary, fontWeight: 600, minWidth: 90 }}>{item.range}</Text>
                <Text style={{ color: textSecondary, fontSize: 13 }}>{item.desc}</Text>
              </div>
            ))}
          </div>
        ),
      },
    ],
  },

  // ═══════════════════════════════════════════
  // 预测页面帮助
  // ═══════════════════════════════════════════
  predict: {
    title: '盲测预测指南',
    subtitle: '发布前写下预测，不可修改',
    sections: [
      {
        title: '🔮 什么是盲测预测？',
        content: (
          <div>
            <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
              在素材<strong style={{ color: textPrimary }}>发布前</strong>，写下你对它表现的预测。
              <strong style={{ color: yellow }}> 预测一旦提交就不可修改</strong>——这是校准的核心原则。
              等素材上线 3 天后，去「复盘中心」对比实际数据。
            </Paragraph>
            <div style={{ background: `${red}10`, border: `1px solid ${red}30`, borderRadius: 8, padding: 14, marginTop: 12 }}>
              <Text style={{ color: red, fontWeight: 600 }}>⚠️ 盲测原则：</Text>
              <Text style={{ color: textSecondary, marginLeft: 8 }}>
                提交预测前不能看该素材的实际数据（播放量、点赞等）。看了就不是盲测了，校准就废了。
              </Text>
            </div>
          </div>
        ),
      },
      {
        title: '📝 预测需要填什么？',
        content: (
          <div>
            {[
              { field: '素材 ID', desc: '你要预测的素材标识', tip: '填你自己的命名，方便后续查找' },
              { field: '脚本内容', desc: '素材的文案/脚本（可选）', tip: '填了可以更准确地打分' },
              { field: '7 维度评分', desc: '0-5 分 × 7 个维度', tip: '凭直觉打分，不要想太多' },
              { field: '预测桶', desc: '爆款/超均/均值/低于均值/扑街', tip: '基于综合分选一个最可能的桶' },
              { field: '中枢估计', desc: '你认为实际播放量（万）', tip: '找历史锚点对比着估' },
              { field: '概率分布', desc: '每个桶的概率，总和=100%', tip: '不要太集中，要有不确定性' },
              { field: '推理因素', desc: '你为什么这么预测', tip: '写 2-3 个关键因素' },
              { field: '关键假设', desc: '如果这个假设错了预测就偏', tip: '复盘时重点验证这个' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10, padding: '8px 0', borderBottom: `1px solid ${border}40` }}>
                <Text strong style={{ color: textPrimary, minWidth: 90, fontSize: 13 }}>{item.field}</Text>
                <div>
                  <div style={{ color: textSecondary, fontSize: 13 }}>{item.desc}</div>
                  <div style={{ color: cyan, fontSize: 12, marginTop: 2 }}>💡 {item.tip}</div>
                </div>
              </div>
            ))}
          </div>
        ),
      },
      {
        title: '📊 怎么看预测列表？',
        content: (
          <div>
            <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
              下方的预测列表显示你所有的预测记录。状态标签含义：
            </Paragraph>
            {[
              { status: 'predicted', color: blue, desc: '已预测，等待发布' },
              { status: 'published', color: yellow, desc: '已发布，等待复盘' },
              { status: 'retro_done', color: green, desc: '已复盘，有对比数据' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <Tag color={item.color}>{item.status}</Tag>
                <Text style={{ color: textSecondary, fontSize: 13 }}>{item.desc}</Text>
              </div>
            ))}
          </div>
        ),
      },
    ],
  },

  // ═══════════════════════════════════════════
  // 复盘页面帮助
  // ═══════════════════════════════════════════
  retro: {
    title: '复盘中心指南',
    subtitle: '对比预测 vs 实际，提取观察',
    sections: [
      {
        title: '📊 什么是复盘？',
        content: (
          <div>
            <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
              素材发布 3 天后（T+3），录入实际数据，系统自动对比你的预测。
              复盘是校准循环中<strong style={{ color: textPrimary }}>最重要的环节</strong>——没有复盘，预测就是空谈。
            </Paragraph>
          </div>
        ),
      },
      {
        title: '📋 怎么做复盘？',
        content: (
          <div>
            <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
              在「待复盘」区域找到素材，点「开始复盘」，填写：
            </Paragraph>
            {[
              { field: '实际播放数', desc: '素材上线 3 天后的总播放量', important: true },
              { field: '实际点赞数', desc: '3 天后的总点赞数', important: false },
              { field: '实际评论数', desc: '3 天后的总评论数', important: false },
              { field: '实际分享数', desc: '3 天后的总分享数', important: false },
              { field: 'Top 评论', desc: '观众评论的关键词/典型评论', important: false },
              { field: '新观察', desc: '这次学到了什么', important: true },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                {item.important && <span style={{ color: red }}>*</span>}
                <Text strong style={{ color: textPrimary, minWidth: 100, fontSize: 13 }}>{item.field}</Text>
                <Text style={{ color: textSecondary, fontSize: 13 }}>{item.desc}</Text>
              </div>
            ))}
          </div>
        ),
      },
      {
        title: '📈 怎么看复盘结果？',
        content: (
          <div>
            <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
              复盘完成后，系统会告诉你：
            </Paragraph>
            <Card style={{ background: '#0F172A', border: `1px solid ${border}`, marginBottom: 12 }}>
              {[
                { metric: '误差率', desc: '|预测 - 实际| / 预测 × 100%', good: '< 25%', bad: '> 50%' },
                { metric: '方向', desc: '你是高估了(over)还是低估了(under)', good: 'accurate', bad: '连续 under/over' },
                { metric: '验证/证伪', desc: '你的关键假设对不对', good: '假设成立', good2: '假设不成立但学到了' },
              ].map((item, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <Text strong style={{ color: textPrimary }}>{item.metric}</Text>
                  <Text style={{ color: textMuted, marginLeft: 8, fontSize: 12 }}>{item.desc}</Text>
                  <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                    <Text style={{ color: green, fontSize: 12 }}>✅ 好：{item.good}</Text>
                    <Text style={{ color: red, fontSize: 12 }}>❌ 差：{item.bad}</Text>
                  </div>
                </div>
              ))}
            </Card>
            <div style={{ background: `${cyan}10`, border: `1px solid ${cyan}30`, borderRadius: 8, padding: 14 }}>
              <Text style={{ color: cyan, fontWeight: 600 }}>💡 复盘技巧：</Text>
              <ul style={{ color: textSecondary, fontSize: 13, lineHeight: 2, marginTop: 8, marginBottom: 0 }}>
                <li>不只看播放量，也看点赞率、评论率、分享率</li>
                <li>记录 Top 评论关键词，了解观众在聊什么</li>
                <li>写下「这次学到了什么」，积累多了公式会自动进化</li>
                <li>误差超 50% 的素材要重点分析原因</li>
              </ul>
            </div>
          </div>
        ),
      },
    ],
  },

  // ═══════════════════════════════════════════
  // 公式管理帮助
  // ═══════════════════════════════════════════
  rubric: {
    title: '公式管理指南',
    subtitle: '理解评分公式和自动进化',
    sections: [
      {
        title: '⚙️ 评分公式是什么？',
        content: (
          <div>
            <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
              评分公式 = 7 个维度的<strong style={{ color: textPrimary }}>加权平均</strong>。
              权重越大，该维度对综合分的影响越大。
            </Paragraph>
            <Card style={{ background: '#0F172A', border: `1px solid ${border}`, marginBottom: 12 }}>
              <div style={{ color: textPrimary, fontFamily: 'monospace', fontSize: 14, padding: '8px 0' }}>
                综合分 = (ER×1.5 + SR×1.5 + HP×1.5 + QL×1 + NA×1 + AB×1 + SAT×1) / 8.5 × 2.0
              </div>
              <div style={{ color: textMuted, fontSize: 12, marginTop: 8 }}>
                ER/SR/HP 权重 1.5（最重要），其余权重 1.0
              </div>
            </Card>
          </div>
        ),
      },
      {
        title: '📊 偏差分析怎么看？',
        content: (
          <div>
            <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
              点「分析偏差」按钮，系统会检查你的预测是否有系统性偏差：
            </Paragraph>
            {[
              { metric: '平均方向误差', desc: '正数=你总高估，负数=你总低估', good: '接近 0', color: blue },
              { metric: '偏差方向', desc: 'balanced=正常，underestimate=总低估', good: 'balanced', color: green },
              { metric: '维度相关性', desc: '哪个维度和误差关联最大', good: '绝对值 < 0.3', color: cyan },
              { metric: '分布', desc: '高估/低估/准确各多少条', good: '均匀分布', color: purple },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10, padding: '8px 0' }}>
                <Tag color={item.color} style={{ minWidth: 100, textAlign: 'center' }}>{item.metric}</Tag>
                <div>
                  <div style={{ color: textSecondary, fontSize: 13 }}>{item.desc}</div>
                  <div style={{ color: green, fontSize: 12, marginTop: 2 }}>✅ 正常：{item.good}</div>
                </div>
              </div>
            ))}
          </div>
        ),
      },
      {
        title: '🔄 公式进化是什么？',
        content: (
          <div>
            <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
              当系统检测到<strong style={{ color: yellow }}>连续 3 次同方向偏差</strong>或<strong style={{ color: yellow }}>近 5 次平均误差 &gt; 50%</strong>，
              会自动提出公式升级方案。
            </Paragraph>
            <Card style={{ background: '#0F172A', border: `1px solid ${border}`, marginBottom: 12 }}>
              <div style={{ color: textPrimary, fontWeight: 600, marginBottom: 8 }}>进化流程：</div>
              <ol style={{ color: textSecondary, fontSize: 14, lineHeight: 2.2 }}>
                <li>系统分析偏差，找出问题维度</li>
                <li>提出新权重（问题维度降权，准确维度升权）</li>
                <li>用新公式重评所有历史样本</li>
                <li>计算新旧排名的 Spearman 一致性（≥ 0.8 才通过）</li>
                <li>通过后自动应用新公式</li>
              </ol>
            </Card>
            <div style={{ background: `${green}10`, border: `1px solid ${green}30`, borderRadius: 8, padding: 14 }}>
              <Text style={{ color: green, fontWeight: 600 }}>🎯 校准目标：</Text>
              <Text style={{ color: textSecondary, marginLeft: 8 }}>
                预测误差稳定 &lt; 25%，说明公式已经校准好了，可以信任它做投放决策。
              </Text>
            </div>
          </div>
        ),
      },
    ],
  },
};

interface CheatHelpProps {
  page: Page;
}

export default function CheatHelp({ page }: CheatHelpProps) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(0);

  const data = HELP_DATA[page];
  const sections = data.sections;

  return (
    <>
      <Button
        type="default"
        icon={<QuestionCircleOutlined />}
        onClick={() => { setOpen(true); setCurrent(0); }}
        style={{
          borderRadius: 8, fontWeight: 600,
          background: `${purple}15`, borderColor: `${purple}40`, color: purple,
        }}
      >
        新手帮助
      </Button>

      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        width={720}
        styles={{ body: { padding: 0, background: cardBg, borderRadius: 12 } }}
        style={{ top: 40 }}
      >
        {/* 页头 */}
        <div style={{ padding: '20px 24px 0', background: cardBg }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <QuestionCircleOutlined style={{ color: purple, fontSize: 22 }} />
            <div>
              <Title level={4} style={{ color: textPrimary, margin: 0 }}>{data.title}</Title>
              <Text style={{ color: textMuted, fontSize: 13 }}>{data.subtitle}</Text>
            </div>
          </div>
          {/* 步骤条 */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 0 }}>
            {sections.map((s, i) => (
              <div
                key={i}
                onClick={() => setCurrent(i)}
                style={{
                  flex: 1, padding: '8px 0', textAlign: 'center', cursor: 'pointer',
                  borderBottom: `3px solid ${i === current ? blue : 'transparent'}`,
                  background: i === current ? `${blue}10` : 'transparent',
                  borderRadius: '6px 6px 0 0', transition: 'all 0.2s',
                }}
              >
                <div style={{ color: i === current ? textPrimary : textMuted, fontSize: 12, fontWeight: i === current ? 600 : 400 }}>
                  {s.title}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 内容区 */}
        <div style={{ padding: '20px 24px 24px', background: cardBg, minHeight: 360, maxHeight: '60vh', overflowY: 'auto' }}>
          <Title level={5} style={{ color: textPrimary, marginTop: 0, marginBottom: 16 }}>
            {sections[current].title}
          </Title>
          {sections[current].content}
        </div>

        {/* 底部按钮 */}
        <div style={{
          padding: '14px 24px', background: '#0F172A',
          borderTop: `1px solid ${border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
        }}>
          <Button
            disabled={current === 0}
            onClick={() => setCurrent(c => c - 1)}
            icon={<ArrowLeftOutlined />}
            style={{ color: textSecondary, borderColor: border }}
          >
            上一步
          </Button>
          <Text style={{ color: textMuted, fontSize: 13 }}>
            {current + 1} / {sections.length}
          </Text>
          {current < sections.length - 1 ? (
            <Button type="primary" onClick={() => setCurrent(c => c + 1)} style={{ borderRadius: 8, fontWeight: 600 }}>
              下一步 <ArrowRightOutlined />
            </Button>
          ) : (
            <Button type="primary" onClick={() => setOpen(false)} icon={<CheckCircleOutlined />}
              style={{ borderRadius: 8, fontWeight: 600, background: green, borderColor: green }}>
              知道了
            </Button>
          )}
        </div>
      </Modal>
    </>
  );
}