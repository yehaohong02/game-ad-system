import { useState } from 'react';
import { Modal, Button, Typography, Tag, Card } from 'antd';
import { QuestionCircleOutlined, ArrowRightOutlined, ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons';

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

type PageId = 'dashboard' | 'data' | 'creative' | 'execution' | 'safety' | 'memory' | 'platform' | 'reports'
  | 'mgr-dashboard' | 'mgr-data' | 'mgr-creative' | 'mgr-execution' | 'mgr-safety' | 'mgr-memory' | 'mgr-reports';

interface HelpSection { title: string; content: React.ReactNode; }

const HELP: Record<PageId, { title: string; subtitle: string; sections: HelpSection[] }> = {
  // ═══════ 数据诊断 ═══════
  dashboard: {
    title: '数据诊断', subtitle: '看懂你的素材投放数据',
    sections: [
      { title: '📊 这个页面是什么？', content: <div>
        <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
          数据诊断页面是一个<strong style={{ color: textPrimary }}>自动化素材健康报告</strong>。
          系统会分析你的广告素材数据，自动找出优势和问题，并给出优化建议。
        </Paragraph>
        <Card style={{ background: '#0F172A', border: `1px solid ${border}`, marginBottom: 12 }}>
          <div style={{ color: textPrimary, fontWeight: 600, marginBottom: 8 }}>页面包含 5 个部分：</div>
          {[
            { icon: '📈', label: 'KPI 指标行', desc: '9 个核心指标（花费/展示/CPM/CTR/CPC/2s播放率/6s播放率/25%播放率/完播率），每个有颜色评级' },
            { icon: '📋', label: '评估汇总表', desc: '成本控制、CTR、6秒留存、完播率、品类分化、素材清理的综合评级' },
            { icon: '✅', label: '优势分析', desc: '系统自动发现的数据亮点（如"成本控制优秀"）' },
            { icon: '⚠️', label: '问题分析', desc: '系统自动发现的数据问题（如"CTR 普遍偏低"）' },
            { icon: '💡', label: '优化建议', desc: '按优先级 P0/P1/P2 排列的具体行动建议' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <div><Text strong style={{ color: textPrimary }}>{item.label}</Text><Text style={{ color: textMuted, marginLeft: 8, fontSize: 13 }}>{item.desc}</Text></div>
            </div>
          ))}
        </Card>
      </div> },
      { title: '📈 KPI 指标怎么看？', content: <div>
        {[
          { name: '花费', desc: '总广告支出', good: '看预算消耗节奏', unit: '元' },
          { name: 'CPM', desc: '千次展示成本', good: '越低越好，行业均值 20-50 元', unit: '元' },
          { name: 'CTR', desc: '点击率 = 点击/展示', good: '≥ 1.5% 为优秀', unit: '%' },
          { name: 'CPC', desc: '单次点击成本', good: '越低越好', unit: '元' },
          { name: '2s 播放率', desc: '看满 2 秒的比例', good: '≥ 30% 说明钩子有效', unit: '%' },
          { name: '6s 播放率', desc: '看满 6 秒的比例', good: '≥ 15% 说明内容有吸引力', unit: '%' },
          { name: '完播率', desc: '看完整个视频的比例', good: '≥ 5% 为优秀', unit: '%' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10, padding: '8px 0', borderBottom: `1px solid ${border}40` }}>
            <Text strong style={{ color: textPrimary, minWidth: 80, fontSize: 13 }}>{item.name}</Text>
            <div>
              <div style={{ color: textSecondary, fontSize: 13 }}>{item.desc}</div>
              <div style={{ color: green, fontSize: 12, marginTop: 2 }}>✅ 参考：{item.good}</div>
            </div>
          </div>
        ))}
      </div> },
      { title: '🎨 4 张图表怎么看？', content: <div>
        {[
          { name: '品类花费分布', desc: '横向柱状图，看哪个游戏品类花的钱最多。花费高但效果差的品类需要重点关注。' },
          { name: '视频播放漏斗', desc: '从展示→点击→2s→6s→25%→50%→75%→100% 的流失情况。每一步流失 > 50% 说明该环节有问题。' },
          { name: 'CTR vs CPM 散点图', desc: '每个点是一条素材。右上角=高CTR高CPM（效果好但贵），左下角=低CTR低CPM（便宜但没效果）。' },
          { name: '品类播放留存对比', desc: '分组柱状图，对比不同品类在各播放阶段的留存率。留存曲线下降快的品类需要优化内容。' },
        ].map((item, i) => (
          <Card key={i} style={{ background: '#0F172A', border: `1px solid ${border}`, marginBottom: 10 }}>
            <Text strong style={{ color: textPrimary }}>{item.name}</Text>
            <div style={{ color: textSecondary, fontSize: 13, marginTop: 6 }}>{item.desc}</div>
          </Card>
        ))}
      </div> },
    ],
  },

  // ═══════ 买量表格数据 ═══════
  data: {
    title: '买量表格数据', subtitle: '素材明细表 + AI 智能分析',
    sections: [
      { title: '📋 这个页面是什么？', content: <div>
        <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
          这是你的<strong style={{ color: textPrimary }}>素材数据中心</strong>。
          左侧是完整的素材数据表格，右侧是 AI 智能分析助手（智投精灵）。
          你可以在表格里查看每条素材的详细数据，也可以让 AI 帮你分析。
        </Paragraph>
      </div> },
      { title: '📊 表格数据怎么看？', content: <div>
        <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
          表格分为两组列：
        </Paragraph>
        <Card style={{ background: '#0F172A', border: `1px solid ${border}`, marginBottom: 12 }}>
          <Text strong style={{ color: textPrimary }}>渠道素材基础数据：</Text>
          <div style={{ color: textSecondary, fontSize: 13, lineHeight: 2, marginTop: 6 }}>
            • <strong>素材花费</strong>：这条素材花了多少钱<br/>
            • <strong>素材展示数</strong>：被展示了多少次<br/>
            • <strong>千次展示成本(CPM)</strong>：每 1000 次展示花多少钱<br/>
            • <strong>点击数/CPC/CTR</strong>：点击量、单次点击成本、点击率
          </div>
        </Card>
        <Card style={{ background: '#0F172A', border: `1px solid ${border}`, marginBottom: 12 }}>
          <Text strong style={{ color: textPrimary }}>视频播放数据：</Text>
          <div style={{ color: textSecondary, fontSize: 13, lineHeight: 2, marginTop: 6 }}>
            • <strong>播放次数</strong>：总播放量<br/>
            • <strong>2s/6s 播放</strong>：看了 2 秒/6 秒的人数<br/>
            • <strong>25%/50%/75%/100%</strong>：看到视频各进度的比例
          </div>
        </Card>
        <div style={{ background: `${yellow}10`, border: `1px solid ${yellow}30`, borderRadius: 8, padding: 14 }}>
          <Text style={{ color: yellow, fontWeight: 600 }}>💡 技巧：</Text>
          <Text style={{ color: textSecondary, marginLeft: 8, fontSize: 13 }}>点击列头可以排序，快速找到表现最好/最差的素材。</Text>
        </div>
      </div> },
      { title: '🤖 AI 助手怎么用？', content: <div>
        <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
          右侧面板是<strong style={{ color: textPrimary }}>智投精灵</strong>，你可以：
        </Paragraph>
        {[
          { btn: 'AI 创意简报', desc: '让 AI 总结当前素材的整体表现' },
          { btn: 'AI 创意打标', desc: '让 AI 自动给素材打标签（类型、风格、卖点）' },
          { btn: '素材对比', desc: '对比两条素材的数据差异' },
          { btn: '创意方向推荐', desc: '基于数据推荐下一步创意方向' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
            <Tag color={blue}>{item.btn}</Tag>
            <Text style={{ color: textSecondary, fontSize: 13 }}>{item.desc}</Text>
          </div>
        ))}
        <Paragraph style={{ color: textMuted, fontSize: 13, marginTop: 8 }}>
          你也可以直接在输入框里用自然语言提问，支持拖拽上传图片。
        </Paragraph>
      </div> },
    ],
  },

  // ═══════ 创意洞察 ═══════
  creative: {
    title: '创意洞察', subtitle: '趋势分析 + 爆款公式 + 优化建议',
    sections: [
      { title: '🎨 这个页面是什么？', content: <div>
        <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
          创意洞察页面是你的<strong style={{ color: textPrimary }}>创意决策中心</strong>。
          系统会分析当前创意趋势、匹配爆款公式、给出数据驱动的优化建议，
          最后还能生成一份创意简报。
        </Paragraph>
      </div> },
      { title: '📈 5 个核心区域', content: <div>
        {[
          { icon: '🔥', name: '创意趋势', desc: '当前热门的创意方向，带增长百分比。上升趋势 = 值得尝试的方向。' },
          { icon: '🏆', name: '爆款公式 × 素材推荐', desc: '每个公式有结构拆解、数据表现、适用品类。点击公式卡片可查看详情和推荐素材。' },
          { icon: '💡', name: '数据驱动优化建议', desc: '按优先级（高/中/低）排列，每条建议有数据证据和预期效果。' },
          { icon: '⚡', name: '快速行动步骤', desc: '5 步行动计划，如"暂停 CTR < 0.3% 的素材"。直接可执行。' },
          { icon: '📝', name: '创意简报', desc: '一键生成汇总报告，包含趋势、公式推荐和优化方案。' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12, padding: '8px 0' }}>
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <div>
              <Text strong style={{ color: textPrimary, fontSize: 14 }}>{item.name}</Text>
              <div style={{ color: textSecondary, fontSize: 13, marginTop: 4 }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div> },
      { title: '📊 素材分析图表', content: <div>
        <Card style={{ background: '#0F172A', border: `1px solid ${border}`, marginBottom: 12 }}>
          <Text strong style={{ color: textPrimary }}>花费 vs CTR 散点图：</Text>
          <div style={{ color: textSecondary, fontSize: 13, marginTop: 6 }}>
            每个点是一条素材。横轴=花费，纵轴=CTR。<br/>
            • 右上角：花得多、效果好 → 继续投<br/>
            • 左上角：花得少、效果好 → 加大预算<br/>
            • 右下角：花得多、效果差 → 考虑暂停<br/>
            • 左下角：花得少、效果差 → 可以放弃
          </div>
        </Card>
        <Card style={{ background: '#0F172A', border: `1px solid ${border}` }}>
          <Text strong style={{ color: textPrimary }}>播放漏斗图：</Text>
          <div style={{ color: textSecondary, fontSize: 13, marginTop: 6 }}>
            从展示到完播的转化漏斗。每一步的流失率帮你定位问题：<br/>
            • 展示→点击流失多：标题/封面不吸引<br/>
            • 点击→2s 流失多：开头不够抓人<br/>
            • 2s→完播流失多：内容不够有料
          </div>
        </Card>
      </div> },
    ],
  },

  // ═══════ 智能执行 ═══════
  execution: {
    title: '智能执行', subtitle: 'AI 代理自动操作广告账户',
    sections: [
      { title: '⚡ 这个页面是什么？', content: <div>
        <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
          智能执行页面是你的<strong style={{ color: textPrimary }}>广告自动化操控中心</strong>。
          AI 代理会根据数据自动执行操作（调价、暂停素材、调整预算等），
          你可以在三种模式间切换，控制自动化的程度。
        </Paragraph>
      </div> },
      { title: '🎮 三种执行模式', content: <div>
        {[
          { mode: '手动模式', color: blue, desc: '所有操作都需要你手动确认。适合刚上手或重要操作时使用。' },
          { mode: '半自动模式', color: yellow, desc: '规则触发的操作自动执行，高风险操作（如大额调价）需要确认。推荐日常使用。' },
          { mode: '全自动模式', color: red, desc: 'AI 代理自主决策并执行。适合成熟期、数据充分时使用。' },
        ].map((item, i) => (
          <Card key={i} style={{ background: '#0F172A', border: `1px solid ${item.color}30`, marginBottom: 10 }}>
            <Tag color={item.color} style={{ marginBottom: 8 }}>{item.mode}</Tag>
            <div style={{ color: textSecondary, fontSize: 13 }}>{item.desc}</div>
          </Card>
        ))}
      </div> },
      { title: '📋 页面核心功能', content: <div>
        {[
          { name: '代理推理过程', desc: 'AI 代理的思考和执行步骤，按时间线展示。每步有状态标签（待执行/运行中/已完成/失败）。' },
          { name: '自动化规则表', desc: '你可以配置规则，如"CTR < 0.3% 时暂停素材"。规则可以启用/禁用/删除。' },
          { name: '执行队列', desc: '当前待执行的任务列表，显示任务类型、状态和时间。' },
          { name: '实时日志', desc: '控制台风格的日志查看器，显示 INFO/WARN/ERROR 级别的消息。' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, padding: '6px 0' }}>
            <Tag color={cyan} style={{ minWidth: 100, textAlign: 'center' }}>{item.name}</Tag>
            <Text style={{ color: textSecondary, fontSize: 13 }}>{item.desc}</Text>
          </div>
        ))}
      </div> },
    ],
  },

  // ═══════ 安全防护 ═══════
  safety: {
    title: '安全防护', subtitle: '预算控制 + 熔断机制 + 风险审计',
    sections: [
      { title: '🛡️ 这个页面是什么？', content: <div>
        <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
          安全防护页面是你的<strong style={{ color: textPrimary }}>广告投放安全网</strong>。
          它监控预算消耗、设置熔断机制、管理风险规则，防止 AI 代理误操作导致大额损失。
        </Paragraph>
      </div> },
      { title: '💰 预算控制', content: <div>
        <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
          显示<strong style={{ color: textPrimary }}>日预算</strong>和<strong style={{ color: textPrimary }}>月预算</strong>的消耗进度条。
        </Paragraph>
        {[
          { pct: '< 60%', color: green, desc: '安全区，正常消耗' },
          { pct: '60-80%', color: yellow, desc: '注意区，消耗偏快' },
          { pct: '> 80%', color: red, desc: '危险区，接近预算上限' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Tag color={item.color} style={{ minWidth: 70, textAlign: 'center' }}>{item.pct}</Tag>
            <Text style={{ color: textSecondary, fontSize: 13 }}>{item.desc}</Text>
          </div>
        ))}
      </div> },
      { title: '⚡ 熔断机制', content: <div>
        <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
          熔断器像电路保险丝——当错误达到阈值时自动"跳闸"，停止所有自动操作。
        </Paragraph>
        {[
          { status: '关闭（正常）', color: green, desc: '正常工作，自动执行' },
          { status: '半开（恢复中）', color: yellow, desc: '正在试探性恢复' },
          { status: '打开（已跳闸）', color: red, desc: '自动操作已停止，需人工介入' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Tag color={item.color}>{item.status}</Tag>
            <Text style={{ color: textSecondary, fontSize: 13 }}>{item.desc}</Text>
          </div>
        ))}
      </div> },
      { title: '📋 风险规则 & 审计日志', content: <div>
        <Card style={{ background: '#0F172A', border: `1px solid ${border}`, marginBottom: 12 }}>
          <Text strong style={{ color: textPrimary }}>风险规则：</Text>
          <div style={{ color: textSecondary, fontSize: 13, marginTop: 6 }}>
            三种类型：<Tag color="blue">预算类</Tag> <Tag color="orange">频率类</Tag> <Tag color="purple">出价类</Tag><br/>
            每条规则有触发条件，满足时会阻止操作。你可以添加/删除/启用/禁用规则。
          </div>
        </Card>
        <Card style={{ background: '#0F172A', border: `1px solid ${border}` }}>
          <Text strong style={{ color: textPrimary }}>审计日志：</Text>
          <div style={{ color: textSecondary, fontSize: 13, marginTop: 6 }}>
            记录所有操作的时间、动作、执行者、详情和结果（通过/被阻止）。用于事后追溯。
          </div>
        </Card>
      </div> },
    ],
  },

  // ═══════ 记忆沉淀 ═══════
  memory: {
    title: '记忆沉淀', subtitle: '历史案例搜索 + AI 周报',
    sections: [
      { title: '🧠 这个页面是什么？', content: <div>
        <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
          记忆沉淀页面是你的<strong style={{ color: textPrimary }}>广告投放经验库</strong>。
          你可以用自然语言搜索历史投放案例，系统会找到最相似的案例供参考。
          底部还有 AI 自动生成的周报分析。
        </Paragraph>
      </div> },
      { title: '🔍 语义搜索怎么用？', content: <div>
        <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
          在搜索框输入自然语言描述，系统会用语义匹配找到最相关的案例。
        </Paragraph>
        <Card style={{ background: '#0F172A', border: `1px solid ${border}`, marginBottom: 12 }}>
          <Text style={{ color: textMuted, fontSize: 13 }}>搜索示例：</Text>
          <div style={{ color: textSecondary, fontSize: 13, lineHeight: 2.2, marginTop: 6 }}>
            • "ROAS 优化" — 找到所有提升 ROAS 的案例<br/>
            • "CPI 控制" — 找到降低 CPI 的经验<br/>
            • "素材衰减" — 找到素材效果下降的处理方法<br/>
            • "新游上线" — 找到新游戏首发的投放策略
          </div>
        </Card>
        <Paragraph style={{ color: textSecondary, fontSize: 13 }}>
          每条结果有<strong style={{ color: cyan }}>相似度评分</strong>（越高越匹配）、
          投放平台、国家、摘要和关键指标（花费/展示/CTR）。
          点击可查看详情。
        </Paragraph>
      </div> },
      { title: '📊 AI 周报', content: <div>
        <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
          页面底部的 AI 周报会自动分析你本周的投放数据，包含：
        </Paragraph>
        {[
          '本周整体投放概况（花费/展示/效果）',
          '表现最好的素材和最差的素材',
          '关键指标的变化趋势',
          '下周优化建议',
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <Text style={{ color: blue }}>{i + 1}.</Text>
            <Text style={{ color: textSecondary, fontSize: 13 }}>{item}</Text>
          </div>
        ))}
      </div> },
    ],
  },

  // ═══════ 平台数据 ═══════
  platform: {
    title: '平台数据', subtitle: '竞品数据采集 & 素材库',
    sections: [
      { title: '🌐 这个页面是什么？', content: <div>
        <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
          平台数据页面是你的<strong style={{ color: textPrimary }}>竞品数据采集中心</strong>。
          你可以从第三方平台（AdXray、广大大、AppGrowing 等）自动采集竞品素材数据，
          也可以手动上传数据文件。
        </Paragraph>
      </div> },
      { title: '📥 智能下载怎么用？', content: <div>
        {[
          { step: '1', action: '输入竞品网站 URL 或点击快捷链接（AdXray/广大大/AppGrowing）' },
          { step: '2', action: '点击「打开网站」在内置浏览器中访问' },
          { step: '3', action: '点击「智能扫描」自动发现页面上的下载按钮' },
          { step: '4', action: '点击发现的下载按钮，自动下载数据文件' },
          { step: '5', action: '下载完成后点击「导入」将数据入库' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, background: `${blue}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: blue, fontWeight: 700, fontSize: 14, flexShrink: 0,
            }}>{item.step}</div>
            <Text style={{ color: textSecondary, fontSize: 13, marginTop: 3 }}>{item.action}</Text>
          </div>
        ))}
      </div> },
      { title: '📁 数据分类', content: <div>
        <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
          左侧导航栏按数据类型分组：
        </Paragraph>
        {[
          { group: '国内数据', items: '重度/轻度/新游/储备', desc: '国内各大平台的竞品投放数据' },
          { group: '海外数据', items: '常规/储备/出海', desc: '海外平台的竞品数据' },
          { group: '短剧数据', items: '常规/抄剧/热剧/黄金', desc: '短剧赛道的投放数据' },
        ].map((item, i) => (
          <Card key={i} style={{ background: '#0F172A', border: `1px solid ${border}`, marginBottom: 10 }}>
            <Text strong style={{ color: textPrimary }}>{item.group}</Text>
            <Tag style={{ marginLeft: 8, background: '#1E293B', border: `1px solid ${border}`, color: textMuted }}>{item.items}</Tag>
            <div style={{ color: textSecondary, fontSize: 13, marginTop: 6 }}>{item.desc}</div>
          </Card>
        ))}
      </div> },
      { title: '📊 总览仪表盘', content: <div>
        <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
          选择「总览」类别时，显示：
        </Paragraph>
        {[
          '数据文件数、总记录数、覆盖游戏数、公司数',
          '每个数据分类的记录数柱状图',
          'AI 洞察分析',
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <Text style={{ color: green }}>•</Text>
            <Text style={{ color: textSecondary, fontSize: 13 }}>{item}</Text>
          </div>
        ))}
      </div> },
    ],
  },

  // ═══════ 报告中心 ═══════
  reports: {
    title: '报告中心', subtitle: '日报/周报 + 竞品预警 + 创意排名',
    sections: [
      { title: '📋 这个页面是什么？', content: <div>
        <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
          报告中心页面是你的<strong style={{ color: textPrimary }}>投放效果汇总看板</strong>。
          提供日报和周报两种视图，包含市场洞察、竞品预警和 Top 创意排名。
        </Paragraph>
      </div> },
      { title: '📊 日报怎么看？', content: <div>
        {[
          { icon: '📈', name: '指标栏', desc: '总花费、总展示、总点击、平均 CTR，颜色标注是否达标。' },
          { icon: '💡', name: '市场洞察', desc: '按优先级（高/中/低）排列的市场变化提示，如"某品类 CTR 上升 20%"。' },
          { icon: '🚨', name: '竞品预警', desc: '严重程度分级（严重/警告/信息），类型包括预算变动、创意更新、效果异常。' },
          { icon: '🏆', name: 'Top 创意排名', desc: '按 CTR 排名的素材列表，前 3 名有奖杯图标。' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12, padding: '8px 0' }}>
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <div>
              <Text strong style={{ color: textPrimary, fontSize: 14 }}>{item.name}</Text>
              <div style={{ color: textSecondary, fontSize: 13, marginTop: 4 }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div> },
      { title: '📅 周报怎么看？', content: <div>
        <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
          切换到「周报」视图，显示本周汇总数据：
        </Paragraph>
        {[
          '本周总花费、总展示、平均 CTR',
          '与上周的对比变化',
          '关键趋势和建议',
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <Text style={{ color: cyan }}>•</Text>
            <Text style={{ color: textSecondary, fontSize: 13 }}>{item}</Text>
          </div>
        ))}
        <div style={{ background: `${green}10`, border: `1px solid ${green}30`, borderRadius: 8, padding: 14, marginTop: 12 }}>
          <Text style={{ color: green, fontWeight: 600 }}>💡 使用建议：</Text>
          <Text style={{ color: textSecondary, marginLeft: 8, fontSize: 13 }}>
            每天花 2 分钟看日报预警，每周看一次周报趋势。重点关注红色预警和 P0 优先级的洞察。
          </Text>
        </div>
      </div> },
    ],
  },

  // ═══════ 管理者总览 ═══════
  'mgr-dashboard': {
    title: '管理者总览', subtitle: '团队全局视角，一眼看清每个设计师的表现',
    sections: [
      { title: '👔 这个页面是什么？', content: <div>
        <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
          管理者总览是<strong style={{ color: textPrimary }}>团队投放数据的驾驶舱</strong>。
          与普通模式看素材不同，这里以<strong style={{ color: cyan }}>设计师</strong>为维度聚合数据，
          帮你快速判断谁表现好、谁需要帮助。
        </Paragraph>
        <Card style={{ background: '#0F172A', border: `1px solid ${border}`, marginBottom: 12 }}>
          <div style={{ color: textPrimary, fontWeight: 600, marginBottom: 8 }}>四个核心指标卡：</div>
          {[
            { icon: '👥', label: '设计师数量', desc: '团队中有多少设计师有投放数据' },
            { icon: '💰', label: '总花费', desc: '团队本月总广告支出' },
            { icon: '📦', label: '素材总数', desc: '团队共投放了多少条素材' },
            { icon: '🚨', label: '高风险设计师', desc: '数据异常多、需要关注的设计师数量' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <div><Text strong style={{ color: textPrimary }}>{item.label}</Text><Text style={{ color: textMuted, marginLeft: 8, fontSize: 13 }}>{item.desc}</Text></div>
            </div>
          ))}
        </Card>
      </div> },
      { title: '📊 效率分怎么看？', content: <div>
        <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
          效率分是衡量设计师综合投放能力的核心指标，公式：
        </Paragraph>
        <Card style={{ background: '#0F172A', border: `1px solid ${border}`, marginBottom: 12 }}>
          <div style={{ color: textPrimary, fontFamily: 'monospace', fontSize: 14, padding: '8px 0' }}>
            效率分 = CTR% × 20 + 完播率% × 15 + (30 - CPM$)
          </div>
          <div style={{ color: textMuted, fontSize: 12, marginTop: 8 }}>
            CTR 越高、完播率越高、CPM 越低 → 效率分越高
          </div>
        </Card>
        {[
          { range: '≥ 80', color: green, label: '优秀', desc: '全维度标杆设计师' },
          { range: '60-80', color: blue, label: '良好', desc: '有明确优势' },
          { range: '40-60', color: yellow, label: '一般', desc: '有提升空间' },
          { range: '< 40', color: red, label: '待提升', desc: '需要重点关注和辅导' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Tag color={item.color} style={{ minWidth: 60, textAlign: 'center' }}>{item.range}</Tag>
            <Text strong style={{ color: textPrimary, minWidth: 50 }}>{item.label}</Text>
            <Text style={{ color: textSecondary, fontSize: 13 }}>{item.desc}</Text>
          </div>
        ))}
      </div> },
      { title: '📋 设计师卡片 & 详情', content: <div>
        <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
          每个设计师有一张卡片，展示：
        </Paragraph>
        {[
          { section: '核心指标', desc: '素材数、总花费、平均 CPM/CTR/CPC、完播率' },
          { section: 'TOP3 高花费素材', desc: '花最多钱的 3 条素材，关注是否值得' },
          { section: 'BOTTOM3 低花费素材', desc: '花钱最少的 3 条素材，可能是新测试' },
          { section: '渠道分布', desc: '该设计师在各渠道的花费占比' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
            <Tag color={blue} style={{ minWidth: 120, textAlign: 'center' }}>{item.section}</Tag>
            <Text style={{ color: textSecondary, fontSize: 13 }}>{item.desc}</Text>
          </div>
        ))}
        <div style={{ background: `${cyan}10`, border: `1px solid ${cyan}30`, borderRadius: 8, padding: 14, marginTop: 8 }}>
          <Text style={{ color: cyan, fontWeight: 600 }}>💡 点击卡片：</Text>
          <Text style={{ color: textSecondary, marginLeft: 8, fontSize: 13 }}>
            打开详情弹窗，查看渠道明细表、游戏明细表、TOP5 高效素材、BOTTOM5 低效素材和完整素材列表。
          </Text>
        </div>
      </div> },
      { title: '📝 管理者反馈怎么看？', content: <div>
        <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
          页面右侧的「管理者反馈」面板会自动为每位设计师生成评估，包含：
        </Paragraph>
        {[
          { icon: '✅', label: '优势', desc: '系统发现的数据亮点，如"CTR 团队第一"' },
          { icon: '⚠️', label: '问题', desc: '系统发现的数据问题，如"异常素材过多"' },
          { icon: '💡', label: '建议', desc: '针对问题的具体行动建议' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <div><Text strong style={{ color: textPrimary }}>{item.label}</Text><Text style={{ color: textMuted, marginLeft: 8, fontSize: 13 }}>{item.desc}</Text></div>
          </div>
        ))}
        <Paragraph style={{ color: textMuted, fontSize: 13, marginTop: 8 }}>
          设计师按效率分排名，前 3 名有🥇🥈🥉标签。
        </Paragraph>
      </div> },
    ],
  },

  // ═══════ 管理者团队体检 ═══════
  'mgr-data': {
    title: '团队体检报告', subtitle: '深度团队诊断 + 设计师排名 + 优化路线图',
    sections: [
      { title: '📋 这个页面是什么？', content: <div>
        <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
          这是一份<strong style={{ color: textPrimary }}>游戏广告买量团队的全面体检报告</strong>。
          它不只是看数据，而是像医生一样做诊断——找出问题、分析原因、开出处方。
        </Paragraph>
        <Card style={{ background: '#0F172A', border: `1px solid ${border}`, marginBottom: 12 }}>
          <div style={{ color: textPrimary, fontWeight: 600, marginBottom: 8 }}>报告包含 6 大板块：</div>
          {[
            { num: '1', label: '团队概览', desc: '5 个核心指标 + 诊断结论（CPC/CTR 水平、头部集中风险）' },
            { num: '2', label: '设计师综合排名', desc: '量级 40% + 效率 35% + 质量 25% 的加权排名' },
            { num: '3', label: '深度分析卡片', desc: '每位设计师的优势/劣势/短期行动/排名原因' },
            { num: '4', label: '短期优化', desc: '渠道&预算再分配表 + 具体执行动作（1-4 周）' },
            { num: '5', label: '长期机制', desc: '设计师分级、视频质量评分体系、培训知识沉淀' },
            { num: '6', label: '预期收益', desc: '1 个月/2 个月/3 个月的改善预测' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 24, height: 24, borderRadius: 6, background: `${blue}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: blue, fontWeight: 700, fontSize: 13, flexShrink: 0,
              }}>{item.num}</div>
              <div><Text strong style={{ color: textPrimary }}>{item.label}</Text><Text style={{ color: textMuted, marginLeft: 8, fontSize: 13 }}>{item.desc}</Text></div>
            </div>
          ))}
        </Card>
      </div> },
      { title: '📊 综合排名怎么算？', content: <div>
        <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
          每位设计师的综合得分由三个维度加权：
        </Paragraph>
        {[
          { dim: '量级分 (40%)', desc: '素材数量、总花费、渠道覆盖——衡量产出规模' },
          { dim: '效率分 (35%)', desc: 'CTR、CPC、CPM——衡量投放效率' },
          { dim: '质量分 (25%)', desc: '完播率、2s 播放率——衡量素材质量' },
        ].map((item, i) => (
          <Card key={i} style={{ background: '#0F172A', border: `1px solid ${border}`, marginBottom: 10 }}>
            <Text strong style={{ color: textPrimary }}>{item.dim}</Text>
            <div style={{ color: textSecondary, fontSize: 13, marginTop: 6 }}>{item.desc}</div>
          </Card>
        ))}
        <Paragraph style={{ color: textSecondary, fontSize: 13 }}>
          排名后按得分分为 <Tag color="gold">S</Tag> <Tag color="blue">A</Tag> <Tag color="green">B</Tag> <Tag color="red">C</Tag> 四个等级。
        </Paragraph>
      </div> },
      { title: '🏷️ 设计师标签系统', content: <div>
        <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
          系统会根据数据自动给每位设计师打标签，如：
        </Paragraph>
        {[
          { tag: '全维度标杆', desc: '量级+效率+质量都排前列' },
          { tag: '高效创意双优', desc: '效率分和质量分都很高' },
          { tag: '低成本大规模', desc: '花费控制好，产出量大' },
          { tag: '创意质量突出', desc: '完播率和 CTR 领先' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
            <Tag color={cyan}>{item.tag}</Tag>
            <Text style={{ color: textSecondary, fontSize: 13 }}>{item.desc}</Text>
          </div>
        ))}
      </div> },
      { title: '📥 Excel 导入', content: <div>
        <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
          点击「导入 Excel」按钮，上传设计师素材表（需包含<strong style={{ color: textPrimary }}>设计师</strong>和<strong style={{ color: textPrimary }}>媒体</strong>列）。
          系统会自动解析 24 列数据并生成完整报告。
        </Paragraph>
        <div style={{ background: `${yellow}10`, border: `1px solid ${yellow}30`, borderRadius: 8, padding: 14 }}>
          <Text style={{ color: yellow, fontWeight: 600 }}>⚠️ 注意：</Text>
          <Text style={{ color: textSecondary, marginLeft: 8, fontSize: 13 }}>
            这里的导入和普通模式的导入不同——需要包含「设计师」列，否则无法按设计师维度分析。
          </Text>
        </div>
      </div> },
    ],
  },

  // ═══════ 管理者创意洞察 ═══════
  'mgr-creative': {
    title: '创意洞察（管理者）', subtitle: '团队视频创意效果对比，关注完播率和创意质量',
    sections: [
      { title: '🎬 这个页面看什么？', content: <div>
        <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
          这个页面聚焦<strong style={{ color: textPrimary }}>视频创意效果</strong>，以设计师为维度对比完播率、播放量和创意质量。
          帮你判断谁的素材更有吸引力、谁需要优化内容。
        </Paragraph>
        <Card style={{ background: '#0F172A', border: `1px solid ${border}`, marginBottom: 12 }}>
          <div style={{ color: textPrimary, fontWeight: 600, marginBottom: 8 }}>6 个核心指标：</div>
          {[
            { label: '平均完播率', desc: '看完视频的比例。≥5% 优秀，<2% 需优化', color: green },
            { label: '平均 2s 率', desc: '看满 2 秒的比例。≥15% 钩子有效，<5% 开头差', color: blue },
            { label: '平均 6s 率', desc: '看满 6 秒的比例。衡量内容吸引力', color: cyan },
            { label: '总播放量', desc: '团队所有素材的总播放次数', color: purple },
            { label: '高 CTR 素材数', desc: 'CTR > 1.5% 的素材数量', color: yellow },
            { label: '平均 CTR', desc: '团队平均点击率', color: textPrimary },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
              <Text strong style={{ color: textPrimary, minWidth: 100, fontSize: 13 }}>{item.label}</Text>
              <Text style={{ color: textSecondary, fontSize: 12 }}>{item.desc}</Text>
            </div>
          ))}
        </Card>
      </div> },
      { title: '📊 播放漏斗图怎么看？', content: <div>
        <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
          团队播放漏斗展示从 2s → 6s → 100% 完播的流失情况：
        </Paragraph>
        {[
          { stage: '2s 播放', desc: '钩子阶段。流失多 = 开头不抓人', tip: '优化前 3 秒冲突/悬念' },
          { stage: '6s 播放', desc: '兴趣阶段。流失多 = 内容没吸引力', tip: '加快节奏、加信息密度' },
          { stage: '100% 完播', desc: '忠诚阶段。流失多 = 故事不够好', tip: '优化结尾钩子/反转' },
        ].map((item, i) => (
          <Card key={i} style={{ background: '#0F172A', border: `1px solid ${border}`, marginBottom: 10 }}>
            <Text strong style={{ color: textPrimary }}>{item.stage}</Text>
            <div style={{ color: textSecondary, fontSize: 13, marginTop: 4 }}>{item.desc}</div>
            <div style={{ color: cyan, fontSize: 12, marginTop: 4 }}>💡 {item.tip}</div>
          </Card>
        ))}
      </div> },
      { title: '📋 设计师卡片怎么看？', content: <div>
        <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
          每位设计师的卡片包含 5 个区域：
        </Paragraph>
        {[
          { section: '播放指标', desc: '完播率、2s 率、6s 率、25%/50%/75% 率' },
          { section: '创意效果', desc: '平均 CTR/CPM/CPC、总播放量、高 CTR 素材数' },
          { section: 'TOP3 完播素材', desc: '完播率最高的 3 条素材' },
          { section: 'TOP3 CTR 素材', desc: '点击率最高的 3 条素材' },
          { section: '渠道完播对比', desc: '该设计师在各渠道的完播率' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
            <Tag color={blue} style={{ minWidth: 110, textAlign: 'center' }}>{item.section}</Tag>
            <Text style={{ color: textSecondary, fontSize: 13 }}>{item.desc}</Text>
          </div>
        ))}
      </div> },
    ],
  },

  // ═══════ 管理者智能执行 ═══════
  'mgr-execution': {
    title: '智能执行（管理者）', subtitle: '执行健康度诊断 + 异常检测 + 优化建议',
    sections: [
      { title: '⚡ 这个页面看什么？', content: <div>
        <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
          与普通模式的执行控制不同，管理者视角关注<strong style={{ color: textPrimary }}>执行健康度</strong>——
          哪些设计师的投放数据有异常、哪些素材需要优化、风险分布如何。
        </Paragraph>
        <Card style={{ background: '#0F172A', border: `1px solid ${border}`, marginBottom: 12 }}>
          <div style={{ color: textPrimary, fontWeight: 600, marginBottom: 8 }}>异常检测规则：</div>
          {[
            { rule: 'CTR > 10%', desc: '点击率异常高，可能是误点击或刷量', color: red },
            { rule: 'CTR < 0.01%', desc: '点击率极低，素材或定向有问题', color: yellow },
            { rule: 'CPC > $50', desc: '单次点击成本过高，出价策略有问题', color: red },
            { rule: '有花费无展示', desc: '花了钱但没展示，账户或素材审核问题', color: yellow },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <Tag color={item.color} style={{ minWidth: 120, textAlign: 'center' }}>{item.rule}</Tag>
              <Text style={{ color: textSecondary, fontSize: 13 }}>{item.desc}</Text>
            </div>
          ))}
        </Card>
      </div> },
      { title: '📊 四张图表怎么看？', content: <div>
        {[
          { name: '渠道执行效率', desc: '分组柱状图，看每位设计师在各渠道的素材数量。某渠道素材过多=过度集中。' },
          { name: '设计师风险分布', desc: '饼图，低/中/高风险设计师占比。高风险多=团队整体需要关注。' },
          { name: '异常数量对比', desc: '柱状图，对比每位设计师的异常素材数。异常多的需要重点辅导。' },
          { name: '花费 vs 效率散点', desc: '每个点是一条素材。右下角（花得多效率低）=需要优化或暂停。' },
        ].map((item, i) => (
          <Card key={i} style={{ background: '#0F172A', border: `1px solid ${border}`, marginBottom: 10 }}>
            <Text strong style={{ color: textPrimary }}>{item.name}</Text>
            <div style={{ color: textSecondary, fontSize: 13, marginTop: 6 }}>{item.desc}</div>
          </Card>
        ))}
      </div> },
      { title: '💡 优化建议怎么看？', content: <div>
        <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
          每位设计师的卡片里有<strong style={{ color: textPrimary }}>优化建议</strong>区域，按优先级排列：
        </Paragraph>
        {[
          { priority: '高优先级', color: red, desc: '必须立即处理的问题，如"触发熔断机制"' },
          { priority: '中优先级', color: yellow, desc: '需要本周处理的问题，如"优化高花费低效素材"' },
          { priority: '低优先级', color: blue, desc: '可以下周处理的问题，如"调整渠道分配"' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Tag color={item.color}>{item.priority}</Tag>
            <Text style={{ color: textSecondary, fontSize: 13 }}>{item.desc}</Text>
          </div>
        ))}
      </div> },
    ],
  },

  // ═══════ 管理者安全防护 ═══════
  'mgr-safety': {
    title: '安全防护（管理者）', subtitle: '团队风险评估 + 异常检测 + 预算集中度分析',
    sections: [
      { title: '🛡️ 这个页面看什么？', content: <div>
        <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
          与普通模式的熔断/规则管理不同，管理者视角关注<strong style={{ color: textPrimary }}>团队风险全景</strong>——
          谁的风险最高、预算是否过度集中、有多少异常素材。
        </Paragraph>
        <Card style={{ background: '#0F172A', border: `1px solid ${border}`, marginBottom: 12 }}>
          <div style={{ color: textPrimary, fontWeight: 600, marginBottom: 8 }}>6 个核心指标：</div>
          {[
            { label: '高风险设计师', desc: '异常数据多、需要立即关注的设计师数' },
            { label: '异常素材数', desc: '触发异常规则的素材总数' },
            { label: '高 CPM 素材', desc: 'CPM > $8 的素材，投放成本过高' },
            { label: '低 CTR 素材', desc: 'CTR < 0.3% 的素材，效果太差' },
            { label: '预算集中度', desc: '单设计师花费占比 > 30% 会触发警告' },
            { label: '极端异常', desc: 'CTR > 100% 或 CPC > $50 的数据' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
              <Text strong style={{ color: textPrimary, minWidth: 100, fontSize: 13 }}>{item.label}</Text>
              <Text style={{ color: textSecondary, fontSize: 13 }}>{item.desc}</Text>
            </div>
          ))}
        </Card>
      </div> },
      { title: '📊 四张图表怎么看？', content: <div>
        {[
          { name: '风险等级分布', desc: '饼图，低/中/高风险设计师占比。高风险占比 > 30% 需要紧急处理。' },
          { name: '异常素材对比', desc: '分组柱状图，对比每位设计师的异常数/高CPM数/低CTR数。' },
          { name: '预算份额分布', desc: '饼图，每位设计师的花费占比。单人 > 30% = 预算过度集中。' },
          { name: '高风险素材类型', desc: '柱状图，高 CPM(>$8) 和低 CTR(<0.3%) 的数量对比。' },
        ].map((item, i) => (
          <Card key={i} style={{ background: '#0F172A', border: `1px solid ${border}`, marginBottom: 10 }}>
            <Text strong style={{ color: textPrimary }}>{item.name}</Text>
            <div style={{ color: textSecondary, fontSize: 13, marginTop: 6 }}>{item.desc}</div>
          </Card>
        ))}
      </div> },
      { title: '📋 设计师卡片怎么看？', content: <div>
        <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
          每位设计师的卡片包含 4 个区域：
        </Paragraph>
        {[
          { section: '预算&风险', desc: '预算份额%、风险等级标签、异常数、高CPM数、低CTR数、花费' },
          { section: '异常明细', desc: '异常数、异常率、高CTR数、低CTR数' },
          { section: 'TOP3 异常素材', desc: '最严重的 3 条异常素材，附具体原因' },
          { section: '渠道风险', desc: '各渠道的异常数和风险等级' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
            <Tag color={blue} style={{ minWidth: 100, textAlign: 'center' }}>{item.section}</Tag>
            <Text style={{ color: textSecondary, fontSize: 13 }}>{item.desc}</Text>
          </div>
        ))}
      </div> },
    ],
  },

  // ═══════ 管理者记忆沉淀 ═══════
  'mgr-memory': {
    title: '记忆沉淀（管理者）', subtitle: '设计师经验画像 + 品类/渠道覆盖 + 知识积累',
    sections: [
      { title: '🧠 这个页面看什么？', content: <div>
        <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
          与普通模式的案例搜索不同，管理者视角关注<strong style={{ color: textPrimary }}>设计师的经验积累</strong>——
          谁做过哪些品类、谁覆盖了哪些渠道、谁的能力在成长。
        </Paragraph>
      </div> },
      { title: '📊 经验积累排行榜', content: <div>
        <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
          综合得分 = 素材数量 + 品类数 × 10 + 渠道数 × 5
        </Paragraph>
        <Card style={{ background: '#0F172A', border: `1px solid ${border}`, marginBottom: 12 }}>
          <div style={{ color: textPrimary, fontWeight: 600, marginBottom: 8 }}>评估维度：</div>
          {[
            { dim: '品类覆盖', good: '≥ 3 个品类', weak: '< 2 个品类', desc: '做过多少种游戏类型' },
            { dim: '渠道经验', good: '≥ 3 个渠道', weak: '< 2 个渠道', desc: '投过多少个广告渠道' },
            { dim: '效率分', good: '≥ 70', weak: '< 50', desc: '综合投放效率' },
            { dim: 'CTR 能力', good: '高于团队均值', weak: '低于团队均值 50%', desc: '点击率水平' },
          ].map((item, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <Text strong style={{ color: textPrimary }}>{item.dim}</Text>
              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                <Text style={{ color: green, fontSize: 12 }}>✅ 强：{item.good}</Text>
                <Text style={{ color: red, fontSize: 12 }}>❌ 弱：{item.weak}</Text>
              </div>
            </div>
          ))}
        </Card>
      </div> },
      { title: '📋 设计师卡片怎么看？', content: <div>
        {[
          { section: '设计师画像', desc: '素材数、擅长品类、主力渠道、CTR、效率分、总花费' },
          { section: '品类花费', desc: '横向柱状图，看该设计师做过哪些品类、各花了多少钱' },
          { section: '渠道花费', desc: '横向柱状图，看该设计师投过哪些渠道' },
          { section: 'TOP3 作品', desc: '花费最高的 3 条素材，附品类和 CTR' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
            <Tag color={blue} style={{ minWidth: 100, textAlign: 'center' }}>{item.section}</Tag>
            <Text style={{ color: textSecondary, fontSize: 13 }}>{item.desc}</Text>
          </div>
        ))}
        <div style={{ background: `${cyan}10`, border: `1px solid ${cyan}30`, borderRadius: 8, padding: 14, marginTop: 8 }}>
          <Text style={{ color: cyan, fontWeight: 600 }}>💡 成长趋势：</Text>
          <Text style={{ color: textSecondary, marginLeft: 8, fontSize: 13 }}>
            详情弹窗里有「成长趋势」——对比前半段和后半段素材的 CTR，看设计师是否在进步。
          </Text>
        </div>
      </div> },
    ],
  },

  // ═══════ 管理者报告中心 ═══════
  'mgr-reports': {
    title: '报告中心（管理者）', subtitle: '设计师排名 + 团队对比 + 素材级改进建议',
    sections: [
      { title: '📋 这个页面看什么？', content: <div>
        <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
          与普通模式的日报/周报不同，管理者视角关注<strong style={{ color: textPrimary }}>设计师之间的对比</strong>——
          谁排名最高、谁低于团队平均、谁需要改进什么。
        </Paragraph>
        <Card style={{ background: '#0F172A', border: `1px solid ${border}`, marginBottom: 12 }}>
          <div style={{ color: textPrimary, fontWeight: 600, marginBottom: 8 }}>6 个核心指标：</div>
          {[
            { label: '平均效率分', desc: '团队整体投放效率' },
            { label: '平均 CTR', desc: '团队平均点击率' },
            { label: '平均完播率', desc: '团队平均完播率' },
            { label: '平均 CPM', desc: '团队平均千次展示成本' },
            { label: '设计师数量', desc: '有投放数据的设计师人数' },
            { label: '总花费', desc: '团队本月总广告支出' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
              <Text strong style={{ color: textPrimary, minWidth: 100, fontSize: 13 }}>{item.label}</Text>
              <Text style={{ color: textSecondary, fontSize: 13 }}>{item.desc}</Text>
            </div>
          ))}
        </Card>
      </div> },
      { title: '📊 效率排名怎么看？', content: <div>
        <Paragraph style={{ color: textSecondary, fontSize: 14, lineHeight: 1.8 }}>
          效率排名柱状图用颜色区分：
        </Paragraph>
        {[
          { color: '🥇🥈🥉', label: '前 3 名', desc: '金银铜标签，团队标杆' },
          { color: '绿色', label: '≥ 60 分', desc: '达标，表现正常' },
          { color: '红色', label: '< 60 分', desc: '未达标，需要改进' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Text style={{ minWidth: 80 }}>{item.color}</Text>
            <Text strong style={{ color: textPrimary, minWidth: 80, fontSize: 13 }}>{item.label}</Text>
            <Text style={{ color: textSecondary, fontSize: 13 }}>{item.desc}</Text>
          </div>
        ))}
      </div> },
      { title: '📋 设计师卡片怎么看？', content: <div>
        {[
          { section: '综合指标', desc: '排名、效率分、花费、CTR、完播率、素材数' },
          { section: '改进建议', desc: '系统自动生成的改进清单（如"参考高CTR设计师策略"）' },
          { section: 'TOP3 高效素材', desc: '效率最高的 3 条素材' },
          { section: '渠道表现', desc: '各渠道的 CTR 和花费' },
          { section: '团队对比', desc: '个人 CTR/CPM/效率 vs 团队平均，绿色=优于平均，红色=低于平均' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
            <Tag color={blue} style={{ minWidth: 100, textAlign: 'center' }}>{item.section}</Tag>
            <Text style={{ color: textSecondary, fontSize: 13 }}>{item.desc}</Text>
          </div>
        ))}
        <div style={{ background: `${yellow}10`, border: `1px solid ${yellow}30`, borderRadius: 8, padding: 14, marginTop: 8 }}>
          <Text style={{ color: yellow, fontWeight: 600 }}>⚠️ 素材级改进：</Text>
          <Text style={{ color: textSecondary, marginLeft: 8, fontSize: 13 }}>
            详情弹窗里有「素材级改进建议表」——列出每条有问题的素材（高花费低CTR、高CPM等）和具体建议。
          </Text>
        </div>
      </div> },
    ],
  },
};

interface PageHelpProps { page: PageId; }

export default function PageHelp({ page }: PageHelpProps) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(0);
  const data = HELP[page];
  if (!data) return null;
  const sections = data.sections;

  return (
    <>
      <Button type="default" icon={<QuestionCircleOutlined />}
        onClick={() => { setOpen(true); setCurrent(0); }}
        style={{ borderRadius: 8, fontWeight: 600, background: `${purple}15`, borderColor: `${purple}40`, color: purple }}>
        新手帮助
      </Button>
      <Modal open={open} onCancel={() => setOpen(false)} footer={null} width={720}
        styles={{ body: { padding: 0, background: cardBg, borderRadius: 12 } }} style={{ top: 40 }}>
        <div style={{ padding: '20px 24px 0', background: cardBg }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <QuestionCircleOutlined style={{ color: purple, fontSize: 22 }} />
            <div>
              <Title level={4} style={{ color: textPrimary, margin: 0 }}>{data.title}</Title>
              <Text style={{ color: textMuted, fontSize: 13 }}>{data.subtitle}</Text>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {sections.map((s, i) => (
              <div key={i} onClick={() => setCurrent(i)} style={{
                flex: 1, padding: '8px 0', textAlign: 'center', cursor: 'pointer',
                borderBottom: `3px solid ${i === current ? blue : 'transparent'}`,
                background: i === current ? `${blue}10` : 'transparent',
                borderRadius: '6px 6px 0 0', transition: 'all 0.2s',
              }}>
                <div style={{ color: i === current ? textPrimary : textMuted, fontSize: 12, fontWeight: i === current ? 600 : 400 }}>
                  {s.title}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: '20px 24px 24px', background: cardBg, minHeight: 360, maxHeight: '60vh', overflowY: 'auto' }}>
          <Title level={5} style={{ color: textPrimary, marginTop: 0, marginBottom: 16 }}>{sections[current].title}</Title>
          {sections[current].content}
        </div>
        <div style={{
          padding: '14px 24px', background: '#0F172A', borderTop: `1px solid ${border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
        }}>
          <Button disabled={current === 0} onClick={() => setCurrent(c => c - 1)} icon={<ArrowLeftOutlined />}
            style={{ color: textSecondary, borderColor: border }}>上一步</Button>
          <Text style={{ color: textMuted, fontSize: 13 }}>{current + 1} / {sections.length}</Text>
          {current < sections.length - 1 ? (
            <Button type="primary" onClick={() => setCurrent(c => c + 1)} style={{ borderRadius: 8, fontWeight: 600 }}>
              下一步 <ArrowRightOutlined />
            </Button>
          ) : (
            <Button type="primary" onClick={() => setOpen(false)} icon={<CheckCircleOutlined />}
              style={{ borderRadius: 8, fontWeight: 600, background: green, borderColor: green }}>知道了</Button>
          )}
        </div>
      </Modal>
    </>
  );
}