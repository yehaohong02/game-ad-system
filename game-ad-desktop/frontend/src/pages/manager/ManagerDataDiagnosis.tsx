import { useState, useEffect, useMemo, useRef } from 'react';
import { Row, Col, Typography, Table, Tag, Card, Statistic, Button, message, Collapse, Tabs, Divider } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import * as XLSX from 'xlsx';
import { useManagerDataStore, DesignerStats, computeTeamOverview } from '../../stores/manager/managerData';
import type { MaterialRecord } from '../../stores/materialData';
import DesignerDetailModal from '../../components/manager/DesignerDetailModal';
import type { DetailSection } from '../../components/manager/DesignerDetailModal';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const panelBg = '#0F172A';
const cardBg = '#1E293B';
const border = '#334155';
const text = '#e2e8f0';
const muted = '#64748b';
const blue = '#3b82f6';
const green = '#10b981';
const red = '#ef4444';
const yellow = '#f59e0b';
const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

function numberFormat(v: number): string {
  if (v >= 10000) return (v / 10000).toFixed(1) + '万';
  return v.toLocaleString();
}

// ============ Section 3: Designer deep analysis — fully data-driven ============
interface DesignerAnalysis {
  strengths: string[];
  weaknesses: string[];
  shortTerm: string[];
  longTerm: string[];
  repMaterials: { materialId: string; media: string; cpc: number; ctr: number }[];
  label: string;
}

interface TeamBenchmarks {
  n: number;
  cpcSorted: DesignerStats[];
  ctrSorted: DesignerStats[];
  cpcP25: number; cpcMed: number; cpcP75: number;
  ctrP25: number; ctrMed: number; ctrP75: number;
  totalSpend: number; totalClicks: number;
  avgPlay2s: number; avgPlay100: number;
}

function buildBenchmarks(active: DesignerStats[]): TeamBenchmarks {
  const n = active.length;
  const cpcSorted = [...active].sort((a, b) => a.avgCpc - b.avgCpc);
  const ctrSorted = [...active].sort((a, b) => b.avgCtr - a.avgCtr);
  const idx = (arr: DesignerStats[], p: number) => arr[Math.max(0, Math.min(n - 1, Math.floor(n * p)))];
  const totalSpend = active.reduce((s, x) => s + x.totalSpend, 0);
  const totalClicks = active.reduce((s, x) => s + x.totalClicks, 0);
  const avgPlay2s = active.reduce((s, x) => s + x.avgPlay2sRate, 0) / n;
  const avgPlay100 = active.reduce((s, x) => s + x.avgPlay100Rate, 0) / n;
  return {
    n, cpcSorted, ctrSorted,
    cpcP25: idx(cpcSorted, 0.25).avgCpc, cpcMed: idx(cpcSorted, 0.5).avgCpc, cpcP75: idx(cpcSorted, 0.75).avgCpc,
    ctrP25: idx(ctrSorted, 0.75).avgCtr, ctrMed: idx(ctrSorted, 0.5).avgCtr, ctrP75: idx(ctrSorted, 0.25).avgCtr,
    totalSpend, totalClicks, avgPlay2s, avgPlay100,
  };
}

function generateDesignerAnalysis(d: DesignerStats, allDesigners: DesignerStats[]): DesignerAnalysis {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const shortTerm: string[] = [];
  const longTerm: string[] = [];

  const active = allDesigners.filter(x => x.totalSpend > 0 && x.totalClicks > 0);
  if (active.length < 2) {
    return { strengths: ['数据量不足以进行团队对比分析'], weaknesses: [], shortTerm: ['持续投放积累数据'], longTerm: ['数据充足后重新评估'], repMaterials: d.repMaterials, label: '数据积累中' };
  }

  const B = buildBenchmarks(active);
  const dCpc = d.avgCpc;
  const dCtr = d.avgCtr;
  const dCtrPct = dCtr * 100;
  const cpcRank = B.cpcSorted.findIndex(x => x.name === d.name) + 1;
  const ctrRank = B.ctrSorted.findIndex(x => x.name === d.name) + 1;
  const clicksPct = B.totalClicks > 0 ? d.totalClicks / B.totalClicks * 100 : 0;
  const isVideo = d.materialType === '视频' || d.materialType === '混合';

  // ===== 1. CPC efficiency analysis =====
  if (dCpc <= B.cpcP25) {
    const ratio = B.cpcMed > 0 ? (B.cpcMed / dCpc).toFixed(1) : '?';
    strengths.push(`${d.name} CPC $${dCpc.toFixed(2)}处于团队前25%（中位数$${B.cpcMed.toFixed(2)}的${ratio}倍效率），获客成本控制是团队标杆。${d.mediaBreakdown.filter(m => m.spend > 0).length > 1 ? `在多渠道投放中，${[...d.mediaBreakdown].sort((a,b)=>a.avgCpm-b.avgCpm)[0]?.media}渠道CPM最低，可优先追加预算。` : `其${d.primaryMedia}渠道的CPM $${d.mediaBreakdown[0]?.avgCpm?.toFixed(1) || '?'}是成本优势的主要来源。`}`);
  } else if (dCpc <= B.cpcMed) {
    strengths.push(`${d.name} CPC $${dCpc.toFixed(2)}优于团队中位数$${B.cpcMed.toFixed(2)}（排名${cpcRank}/${B.n}），成本效率处于中上水平。`);
  } else if (dCpc <= B.cpcP75) {
    weaknesses.push(`CPC $${dCpc.toFixed(2)}高于团队中位数$${B.cpcMed.toFixed(2)}（排名${cpcRank}/${B.n}）。${d.highCpmCount > 0 ? `${d.highCpmCount}条素材CPM>$8拉高了均成本，暂停这些素材可将CPC降至$${((d.totalSpend - d.highCpmCount * 8 * d.totalImpressions / Math.max(d.materialCount,1)) / d.totalClicks).toFixed(2)}左右。` : '按素材逐条检查，重点排查CPM>P75的素材并优化。'}`);
  } else {
    weaknesses.push(`CPC $${dCpc.toFixed(2)}处于团队后25%（P75=$${B.cpcP75.toFixed(2)}），获客成本是全队最高区间。${d.anomalyCount > 0 ? `同时有${d.anomalyCount}条异常数据点（CPC>$50或CTR>10%等），建议先排查数据质量问题再制定优化策略。` : '建议立即审核所有投放素材的定向、出价和落地页，从素材层面查找成本失控原因。'}`);
  }

  // ===== 2. CTR quality analysis =====
  const highCtrRatio = d.highCtrCount / Math.max(d.materialCount, 1);
  const lowCtrRatio = d.lowCtrCount / Math.max(d.materialCount, 1);

  if (dCtr >= B.ctrP75) {
    const topMat = d.topMaterials[0];
    strengths.push(`CTR ${dCtrPct.toFixed(2)}%处于团队前25%（P75=${(B.ctrP75*100).toFixed(2)}%），素材吸引力在团队中领先。${topMat ? `表现最好的素材${topMat.materialId} CTR达${(topMat.ctr*100).toFixed(2)}%，其创意方向值得复盘总结并形成可复制模板。` : ''}`);
    if (highCtrRatio > 0.3) {
      strengths.push(`高CTR(>1.5%)素材占比${(highCtrRatio*100).toFixed(0)}%，远高于团队平均水平，说明有一套成熟的素材制作方法论。`);
      longTerm.push(`${d.name}的高CTR素材方法论应整理成培训文档，帮助B/C级设计师提升素材质量。`);
    }
  } else if (dCtr >= B.ctrMed) {
    // OK, not a strength or weakness
    if (highCtrRatio > 0.2) strengths.push(`有${(highCtrRatio*100).toFixed(0)}%的素材CTR>1.5%，说明具备产出高点击素材的能力，可重点分析这些素材的共性。`);
  } else if (dCtr >= B.ctrP25) {
    weaknesses.push(`CTR ${dCtrPct.toFixed(2)}%低于团队中位数${(B.ctrMed*100).toFixed(2)}%（排名${ctrRank}/${B.n}）。${lowCtrRatio > 0.3 ? `低CTR(<0.3%)素材占比${(lowCtrRatio*100).toFixed(0)}%拖累了整体表现，建议将这些素材逐一A/B测试优化创意或暂停。` : 'CTR表现平庸，需要在素材创意上做出差异化突破。'}`);
  } else {
    weaknesses.push(`CTR ${dCtrPct.toFixed(2)}%处于团队后25%（P25=${(B.ctrP25*100).toFixed(2)}%），素材对目标用户的吸引力严重不足。${d.bottomMaterials.length > 0 ? `最差素材${d.bottomMaterials[0].materialId} CTR仅${(d.bottomMaterials[0].ctr*100).toFixed(2)}%，建议全部暂停CTR<${(B.ctrP25*100).toFixed(1)}%的素材重新设计。` : ''}`);
    shortTerm.push(`暂停CTR<${(B.ctrP25*100).toFixed(1)}%的低效素材，节省预算集中投放表现稍好的素材，同时研究团队高CTR素材的创意模式。`);
  }

  // ===== 3. Volume & spend efficiency =====
  if (clicksPct >= 15) {
    strengths.push(`点击贡献${clicksPct.toFixed(0)}%（$${numberFormat(d.totalSpend)}花费，${numberFormat(d.totalClicks)}点击），是团队流量的核心支柱。${d.totalSpend > B.totalSpend / B.n * 2 ? '大体量下仍能保持效率优势，证明其素材方法论可规模化。' : ''}`);
    if (dCpc > B.cpcMed) {
      shortTerm.push(`${d.name}花费体量大但CPC偏高，建议不增加总预算，转而优化素材结构——将${Math.round(lowCtrRatio*100)}%的低CTR素材预算重新分配给高CTR素材，有望在不增加花费的前提下提升点击量${Math.round((1 - dCpc/B.cpcMed) * -100 + 20)}%以上。`);
    }
  } else if (clicksPct >= 5) {
    if (dCpc <= B.cpcMed && dCtr >= B.ctrMed) {
      strengths.push(`虽然体量中等（点击占比${clicksPct.toFixed(0)}%），但CPC和CTR均优于中位数，是"小而美"的高效投放模式，具备较大扩量潜力。`);
      shortTerm.push(`保持当前CPC和CTR优势，逐步将花费提升${Math.round((15/clicksPct-1)*100)}%（从$${numberFormat(d.totalSpend)}增至$${numberFormat(d.totalSpend*15/clicksPct)}），快速测试扩量后的效率变化。`);
    }
  } else {
    if (dCpc <= B.cpcMed) {
      strengths.push(`虽然体量较小（点击占比${clicksPct.toFixed(1)}%），但${dCpc <= B.cpcP25 ? '极低' : '较低'}的CPC（$${dCpc.toFixed(2)}）表明素材方向正确，值得追加投入验证扩量潜力。`);
    } else if (dCpc > B.cpcP75) {
      weaknesses.push(`在体量已经很小的情况下CPC仍高达$${dCpc.toFixed(2)}，说明当前素材和投放策略存在根因问题，不适合继续独立投放。`);
    }
  }

  // ===== 4. Channel-specific analysis =====
  if (d.mediaBreakdown.length >= 2) {
    const bestByCpc = [...d.mediaBreakdown].sort((a, b) => a.avgCpm - b.avgCpm)[0];
    const bestByCtr = [...d.mediaBreakdown].filter(m => m.spend > 100).sort((a, b) => b.avgCtr - a.avgCtr)[0];
    const worstByCpc = [...d.mediaBreakdown].filter(m => m.spend > 100).sort((a, b) => b.avgCpm - a.avgCpm).reverse()[0];

    if (bestByCpc && worstByCpc && bestByCpc.media !== worstByCpc.media) {
      const ratio = worstByCpc.avgCpm > 0 ? (worstByCpc.avgCpm / Math.max(bestByCpc.avgCpm, 0.01)).toFixed(1) : '?';
      if (parseFloat(ratio) > 2) {
        weaknesses.push(`渠道效率差异悬殊：${bestByCpc.media}的CPM $${bestByCpc.avgCpm.toFixed(1)}仅为${worstByCpc.media}的CPM $${worstByCpc.avgCpm.toFixed(1)}的${ratio}分之一。建议重新评估${worstByCpc.media}渠道的投放策略，或直接将预算转移至${bestByCpc.media}。`);
        shortTerm.push(`将${worstByCpc.media}渠道至少50%的预算转投${bestByCpc.media}，优先放大高效渠道的流量规模。`);
      }
    }
    if (bestByCtr && bestByCtr.avgCtr > dCtr * 1.5) {
      strengths.push(`${bestByCtr.media}渠道CTR ${(bestByCtr.avgCtr*100).toFixed(2)}%显著高于整体均值${dCtrPct.toFixed(2)}%，说明该渠道受众匹配度高，应作为扩量首选。`);
    }
  } else if (d.mediaBreakdown.length === 1) {
    weaknesses.push(`仅投放${d.primaryMedia}单一渠道，风险集中。一旦该渠道平台政策或竞价环境变化，效率可能出现断崖式下降。建议测试1-2个新渠道分散风险。`);
    if (d.grade === 'S' || d.grade === 'A') longTerm.push(`${d.name}已在${d.primaryMedia}验证了素材效率，下一步应基于现有高CTR素材复用到FaceBook或TikTok等新渠道，降低渠道集中风险。`);
  }

  // ===== 5. Video play-rate analysis (only for video designers) =====
  if (isVideo && d.totalPlayCount > 0) {
    const play2s = d.avgPlay2sRate * 100;
    const play100 = d.avgPlay100Rate * 100;
    if (play2s > 30) {
      strengths.push(`2s播放率${play2s.toFixed(1)}%（团队均值${(B.avgPlay2s*100).toFixed(1)}%），视频前3秒钩子设计精准，能有效拦截用户注意力。这是高CTR的前提条件。`);
    } else if (play2s < 15 && d.videoCount > 3) {
      weaknesses.push(`2s播放率仅${play2s.toFixed(1)}%（团队均值${(B.avgPlay2s*100).toFixed(1)}%），视频前3秒缺乏有效钩子，这是导致CTR偏低的根因之一。需重新设计开场画面，尝试"问题开场""冲突开场""福利开场"等不同钩子类型。`);
      shortTerm.push('对所有视频素材做A/B测试：同一视频内容，制作"冲突开场""福利开场""悬念开场"三个版本的前3秒，测试哪种钩子类型的2s播放率最高。');
    }
    if (play100 > 5) {
      strengths.push(`完播率${play100.toFixed(1)}%远超团队均值${(B.avgPlay100*100).toFixed(1)}%，视频内容对目标用户吸引力强，高完播率也意味着用户对游戏内容产生了真实兴趣。`);
    }
    if (play2s > 25 && play100 < 2) {
      weaknesses.push(`前3秒能留住用户（2s率${play2s.toFixed(1)}%），但完播率仅${play100.toFixed(1)}%，说明视频中间内容与开场预期不符，存在"骗点击"嫌疑——这会导致用户对品牌产生负面印象并降低转化率。`);
      shortTerm.push('优化视频中段内容，确保开场钩子传达的预期在视频中得到承接，避免"标题党"式素材损耗品牌信任。');
    }
  }

  // ===== 6. Material type mix =====
  if (d.imageCount > 0 && d.videoCount > 0 && d.materialType === '混合') {
    const imgMat = d.materials.filter(m => { const p = (m as any).preview || ''; return typeof p === 'string' && /\.(jpg|png|jpeg|webp)$/i.test(p); });
    const vidMat = d.materials.filter(m => { const p = (m as any).preview || ''; return typeof p === 'string' && p.endsWith('.mp4'); });
    if (imgMat.length >= 2 && vidMat.length >= 2) {
      const imgCpc = imgMat.reduce((s,m) => s + (m.cpc||0), 0) / imgMat.length;
      const vidCpc = vidMat.reduce((s,m) => s + (m.cpc||0), 0) / vidMat.length;
      if (imgCpc > 0 && vidCpc > 0 && Math.abs(imgCpc - vidCpc) / Math.max(imgCpc, vidCpc) > 0.3) {
        const betterType = imgCpc < vidCpc ? '图片' : '视频';
        const betterCpc = Math.min(imgCpc, vidCpc);
        const worseCpc = Math.max(imgCpc, vidCpc);
        strengths.push(`图片vs视频效率分化明显：${betterType}素材平均CPC $${betterCpc.toFixed(2)}，比另一种素材低${Math.round((1-betterCpc/worseCpc)*100)}%。建议短期预算向${betterType}倾斜。`);
      }
    }
  }

  // ===== 7. Anomaly & risk =====
  if (d.anomalyCount > 0) {
    const anomalyPct = (d.anomalyCount / Math.max(d.materialCount, 1) * 100);
    if (anomalyPct > 10) {
      weaknesses.push(`${d.anomalyCount}条（${anomalyPct.toFixed(0)}%）素材存在数据异常（CPC>$50、CTR>10%等），异常比例偏高。这可能反映数据采集问题或极端素材表现，需逐条核查。`);
    } else {
      weaknesses.push(`存在${d.anomalyCount}条数据异常素材，建议标记并复查这些素材的数据质量和投放设置。`);
    }
  } else if (d.materialCount >= 5) {
    strengths.push('所有素材数据质量健康，无异常数据点，数据可靠性高。');
  }

  // ===== 8. Generate label based on strongest data signature =====
  let label: string;
  const cpcExcellent = dCpc <= B.cpcP25;
  const ctrExcellent = dCtr >= B.ctrP75;
  const volumeLarge = clicksPct >= 15;
  const playExcellent = isVideo && d.totalPlayCount > 0 && d.avgPlay2sRate > 0.25 && d.avgPlay100Rate > 0.04;

  if (cpcExcellent && ctrExcellent && volumeLarge) {
    label = '全维度标杆';
  } else if (cpcExcellent && ctrExcellent) {
    label = '高效创意双优';
  } else if (cpcExcellent && volumeLarge) {
    label = '低成本大规模';
  } else if (ctrExcellent && volumeLarge) {
    label = '高吸量核心';
  } else if (cpcExcellent) {
    label = isVideo ? '低成本视频专家' : '低成本图片专家';
  } else if (ctrExcellent) {
    label = playExcellent ? '完播+CTR双高' : '高CTR创作者';
  } else if (playExcellent) {
    label = '视频内容专家';
  } else if (dCpc <= B.cpcMed && dCtr >= B.ctrMed) {
    label = '均衡稳健型';
  } else if (volumeLarge) {
    label = '流量贡献者';
  } else if (clicksPct < 3 && dCpc > B.cpcP75) {
    label = '待转型优化';
  } else {
    label = '成长观察期';
  }

  // ===== Fallbacks: ensure minimum content =====
  if (strengths.length === 0) {
    if (d.materialCount >= 10) strengths.push(`${d.name}拥有${d.materialCount}条素材，素材产出量充足，具备规模化测试的基础。`);
    else strengths.push(`${d.name}投放了${d.materialCount}条素材，建议增加素材量以提升测试样本量。`);
  }
  if (shortTerm.length === 0) {
    shortTerm.push(`继续保持当前CPC $${dCpc.toFixed(2)}和CTR ${dCtrPct.toFixed(2)}%的投放节奏，每周复盘数据趋势，关注效率指标的边际变化。`);
  }
  if (longTerm.length === 0) {
    longTerm.push(d.grade === 'S' || d.grade === 'A'
      ? `将${d.name}验证成功的素材方法论沉淀为团队标准，帮助B/C级设计师提升效率，实现团队整体升级。`
      : `基于${Math.max(3, B.n)}名同行对比数据，${d.name}应在${Math.round(90)}天内聚焦提升${dCpc > B.cpcMed ? 'CPC成本控制' : 'CTR素材吸引力'}，争取进入${d.grade === 'B' ? 'A' : 'B'}级。`);
  }

  return { strengths, weaknesses, shortTerm, longTerm, repMaterials: d.repMaterials, label };
}

// ============ Section 5: Designer grading table data ============
interface DesignerScore { designer: DesignerStats; rank: number; compositeScore: number; volumeScore: number; efficiencyScore: number; qualityScore: number; rankingReason: string; }
function getGradeData(ranked: DesignerScore[]) {
  const designers = ranked.map(s => s.designer);
  const active = designers.filter(d => d.totalSpend > 0);
  const cpcs = active.map(d => d.avgCpc).sort((a, b) => a - b);
  const ctrs = active.map(d => d.avgCtr).sort((a, b) => a - b);
  const p25Cpc = cpcs[Math.floor(cpcs.length * 0.25)] || 0;
  const p50Cpc = cpcs[Math.floor(cpcs.length * 0.50)] || 0;
  const p75Cpc = cpcs[Math.floor(cpcs.length * 0.75)] || 0;
  const p25Ctr = ctrs[Math.floor(ctrs.length * 0.25)] || 0;
  const p50Ctr = ctrs[Math.floor(ctrs.length * 0.50)] || 0;
  const p75Ctr = ctrs[Math.floor(ctrs.length * 0.75)] || 0;

  const sCount = designers.filter(d => d.grade === 'S').length;
  const aCount = designers.filter(d => d.grade === 'A').length;
  const bCount = designers.filter(d => d.grade === 'B').length;
  const cCount = designers.filter(d => d.grade === 'C').length;
  const totalWeight = sCount * 4 + aCount * 3 + bCount * 2 + cCount * 1;

  // Sort by composite rank to match the ranking table
  const sorted = [...ranked].sort((a, b) => a.rank - b.rank);

  return sorted.map(s => {
    const d = s.designer;
    const weight = d.grade === 'S' ? 4 : d.grade === 'A' ? 3 : d.grade === 'B' ? 2 : 1;
    const share = totalWeight > 0 ? Math.round(weight / totalWeight * 100) : 25;
    const cpcTarget = d.grade === 'S' ? `<$${(p25Cpc * 1.1).toFixed(2)}` : d.grade === 'A' ? `<$${(p50Cpc * 0.95).toFixed(2)}` : d.grade === 'B' ? `<$${p75Cpc.toFixed(2)}` : '限期达标';
    const ctrTarget = d.grade === 'S' ? `CTR>${(p75Ctr * 100).toFixed(1)}%` : d.grade === 'A' ? `CTR>${(p50Ctr * 100).toFixed(1)}%` : d.grade === 'B' ? `CTR>${(p25Ctr * 100).toFixed(1)}%` : '限期3个月';
    return {
      key: d.name,
      designer: d.name,
      grade: d.grade,
      gradeLabel: d.grade === 'S' ? 'S级' : d.grade === 'A' ? 'A级' : d.grade === 'B' ? 'B级' : 'C级',
      budgetShare: `${share}%`,
      kpi: `${cpcTarget}, ${ctrTarget}`,
    };
  });
}

// ============ Section 6: Video quality scoring ============
const qualityScoringCols = [
  { title: '指标', dataIndex: 'metric', key: 'metric', render: (v: string) => <Text style={{ color: text, fontSize: 12 }}>{v}</Text> },
  { title: '权重', dataIndex: 'weight', key: 'weight', render: (v: string) => <Text style={{ color: blue, fontSize: 12 }}>{v}</Text> },
  { title: '优秀线', dataIndex: 'excellent', key: 'excellent', render: (v: string) => <Tag color="green" style={{ fontSize: 11 }}>{v}</Tag> },
  { title: '及格线', dataIndex: 'pass', key: 'pass', render: (v: string) => <Tag color="orange" style={{ fontSize: 11 }}>{v}</Tag> },
];

const qualityScoringData = [
  { key: '1', metric: '2s播放率', weight: '30%', excellent: '>25%', pass: '>15%' },
  { key: '2', metric: '6s播放率', weight: '25%', excellent: '>12%', pass: '>8%' },
  { key: '3', metric: '点击率', weight: '25%', excellent: '>1.2%', pass: '>0.8%' },
  { key: '4', metric: '100%播放率', weight: '20%', excellent: '>4%', pass: '>2%' },
];

// ============ Section 5: Channel redistribution ============
function getChannelRedistribution(designers: DesignerStats[]) {
  // Compute actual channel spend breakdown from real data
  const channelSpend = new Map<string, number>();
  for (const d of designers) {
    for (const mb of d.mediaBreakdown) {
      channelSpend.set(mb.media, (channelSpend.get(mb.media) || 0) + mb.spend);
    }
  }
  const totalChannelSpend = [...channelSpend.values()].reduce((s, v) => s + v, 0);
  const pct = (m: string) => totalChannelSpend > 0 ? (channelSpend.get(m) || 0) / totalChannelSpend * 100 : 0;

  const googlePct = pct('Google');
  const fbPct = pct('FaceBook');
  const ttPct = pct('Tiktok');

  const googleDesigners = designers.filter(d => d.mediaBreakdown.some(m => m.media === 'Google' && m.spend > 0));
  const fbDesigners = designers.filter(d => d.mediaBreakdown.some(m => m.media === 'FaceBook' && m.spend > 100));
  const ttDesigners = designers.filter(d => d.mediaBreakdown.some(m => m.media === 'Tiktok' && m.spend > 100));

  const topGoogle = googleDesigners.sort((a, b) => a.avgCpc - b.avgCpc).slice(0, 1);
  const topFb = fbDesigners.sort((a, b) => b.avgCtr - a.avgCtr).slice(0, 2);
  const topTt = ttDesigners.sort((a, b) => a.avgPlay2sRate - b.avgPlay2sRate).slice(0, 3);

  // Target: Google gets higher share if best-CPC designers are Google-heavy
  const bestGoogle = topGoogle.length > 0 ? topGoogle[0].avgCpc : 999;
  const newGooglePct = bestGoogle < 0.3 ? 35 : googlePct * 1.5;
  const newFbPct = fbPct > 10 ? fbPct * 0.9 : fbPct;
  const newTtPct = ttPct > 5 ? ttPct : 15;

  return [
    {
      key: '1', channel: 'Google',
      original: googlePct > 0 ? `约${googlePct.toFixed(0)}%` : '0%',
      new_: `${newGooglePct.toFixed(0)}%`,
      designers: topGoogle.map(d => d.name).join('、') || '待定',
      type: '图片',
      target: bestGoogle < 0.3 ? `CPC<$${bestGoogle.toFixed(2)}，CTR>1.5%` : 'CPC<0.3, CTR>1.5%',
    },
    {
      key: '2', channel: 'FaceBook',
      original: fbPct > 0 ? `约${fbPct.toFixed(0)}%` : '0%',
      new_: `${newFbPct.toFixed(0)}%`,
      designers: topFb.map(d => d.name).join('、') || '待定',
      type: '视频',
      target: topFb.length > 0 ? `CPC<$${(topFb[0].avgCpc * 0.9).toFixed(2)}，CTR>${(topFb[0].avgCtr * 100 * 1.1).toFixed(1)}%` : 'CPC<0.6, CTR>0.8%',
    },
    {
      key: '3', channel: 'TikTok',
      original: ttPct > 0 ? `约${ttPct.toFixed(0)}%` : '0%',
      new_: `${newTtPct.toFixed(0)}%`,
      designers: topTt.map(d => d.name).join('、') || '待定',
      type: '短视频',
      target: '2s播放率>30%',
    },
  ];
}

// ============ Material tag tree data ============
interface TagNode { label: string; value: string; children?: TagNode[] }
const tagTreeData: TagNode[] = [
  {
    label: '渠道', value: 'channel',
    children: [
      { label: 'Google', value: 'Google' },
      { label: 'FaceBook', value: 'FaceBook' },
      { label: 'TikTok', value: 'Tiktok' },
      { label: '其他', value: '其他' },
    ],
  },
  {
    label: '素材类型', value: 'type',
    children: [
      { label: '图片', value: 'image', children: [
        { label: '静态图', value: 'static' },
        { label: '轮播图', value: 'carousel' },
        { label: '动图', value: 'gif' },
      ]},
      { label: '视频', value: 'video', children: [
        { label: '横版(16:9)', value: '16:9' },
        { label: '竖版(9:16)', value: '9:16' },
        { label: '方形(1:1)', value: '1:1' },
      ]},
    ],
  },
  {
    label: '核心卖点', value: 'selling',
    children: [
      { label: '福利类', value: 'welfare' },
      { label: '玩法类', value: 'gameplay' },
      { label: '画质类', value: 'graphics' },
      { label: '社交类', value: 'social' },
    ],
  },
  {
    label: '钩子类型(前3秒)', value: 'hook',
    children: [
      { label: '冲突型', value: 'conflict' },
      { label: '问题型', value: 'question' },
      { label: '视觉型', value: 'visual' },
      { label: '福利型', value: 'welfare' },
    ],
  },
  {
    label: '结尾CTA类型', value: 'cta',
    children: [
      { label: '下载按钮', value: 'download' },
      { label: '福利倒计时', value: 'countdown' },
      { label: '点击箭头', value: 'arrow' },
      { label: '悬念引导', value: 'suspense' },
    ],
  },
  {
    label: '绩效标签', value: 'performance',
    children: [
      { label: '红榜(高分)', value: 'red' },
      { label: '普通', value: 'normal' },
      { label: '黑榜(低分/已暂停)', value: 'black' },
    ],
  },
];

const tagExampleData = [
  { key: '1', id: '1384246', channel: 'FaceBook', type: '视频', game: '代号重生欧美', selling: '福利类', hook: '问题型', cta: '下载按钮', performance: '红榜' },
  { key: '2', id: '1382903', channel: 'Google', type: '图片', game: '代号重生欧美', selling: '福利类', hook: '福利型', cta: '-', performance: '红榜' },
  { key: '3', id: '1323443', channel: 'TikTok', type: '视频', game: '代号重生欧美', selling: '玩法类', hook: '视觉型', cta: '点击箭头', performance: '红榜' },
];

export default function ManagerDataDiagnosis() {
  const { designers, refresh, setSelectedDesigner } = useManagerDataStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeDesigner, setActiveDesigner] = useState<DesignerStats | null>(null);

  useEffect(() => { refresh(); }, [refresh]);

  const team = useMemo(() => computeTeamOverview(designers), [designers]);
  // Higher CTR → stronger performance
  const overallCtrPct = team.overallCtr * 100;

  // Composite scoring: 40% volume (clicks share) + 35% efficiency (CPC) + 25% quality (CTR)
  const rankedDesigners = useMemo((): DesignerScore[] => {
    const active = designers.filter(d => d.totalSpend > 0 && d.totalClicks > 0);
    if (active.length === 0) return designers.map((d, i) => ({
      designer: d, rank: i + 1, compositeScore: 0, volumeScore: 0, efficiencyScore: 0, qualityScore: 0,
      rankingReason: '无投放数据',
    }));

    const totalClicksAll = active.reduce((s, d) => s + d.totalClicks, 0);
    const maxClicksShare = Math.max(...active.map(d => d.totalClicks / totalClicksAll));
    const cpcs = active.map(d => d.avgCpc);
    const minCpc = Math.min(...cpcs);
    const maxCpc = Math.max(...cpcs);
    const ctrs = active.map(d => d.totalClicks / Math.max(d.totalImpressions, 1));
    const minCtr = Math.min(...ctrs);
    const maxCtr = Math.max(...ctrs);
    const avgCtr = active.length > 0 ? ctrs.reduce((s, v) => s + v, 0) / active.length : 0;
    const avgCpc = active.length > 0 ? cpcs.reduce((s, v) => s + v, 0) / active.length : 0;

    const scored = designers.map(d => {
      if (d.totalSpend === 0 || d.totalClicks === 0) {
        return { designer: d, compositeScore: 0, volumeScore: 0, efficiencyScore: 0, qualityScore: 0, rankingReason: '无投放数据' };
      }
      const clicksShare = d.totalClicks / totalClicksAll;
      const dCtr = d.totalClicks / Math.max(d.totalImpressions, 1);
      const volumeScore = (clicksShare / maxClicksShare) * 40;
      const efficiencyScore = maxCpc > minCpc ? Math.max(0, (1 - (d.avgCpc - minCpc) / (maxCpc - minCpc))) * 35 : 35;
      const qualityScore = maxCtr > minCtr ? ((dCtr - minCtr) / (maxCtr - minCtr)) * 25 : 12.5;
      const compositeScore = volumeScore + efficiencyScore + qualityScore;

      // Generate ranking reason
      const reasons: string[] = [];
      const clicksPct = (clicksShare * 100);
      if (clicksPct >= 20) reasons.push(`点击贡献${clicksPct.toFixed(0)}%为团队最高，是绝对流量支柱（体量得分${volumeScore.toFixed(1)}）`);
      else if (clicksPct >= 8) reasons.push(`点击贡献${clicksPct.toFixed(0)}%（体量得分${volumeScore.toFixed(1)}），是团队核心产出者`);
      else if (clicksPct >= 2) reasons.push(`点击贡献${clicksPct.toFixed(1)}%（体量得分${volumeScore.toFixed(1)}），中等体量`);
      else reasons.push(`点击贡献仅${clicksPct.toFixed(1)}%（体量得分${volumeScore.toFixed(1)}），体量偏小拖累综合排名`);

      if (d.avgCpc <= minCpc * 1.3) reasons.push(`CPC $${d.avgCpc.toFixed(2)}全队最低区间（效率得分${efficiencyScore.toFixed(1)}），成本控制极其优秀`);
      else if (d.avgCpc <= avgCpc) reasons.push(`CPC $${d.avgCpc.toFixed(2)}优于团队均值$${avgCpc.toFixed(2)}（效率得分${efficiencyScore.toFixed(1)}），成本控制良好`);
      else if (d.avgCpc <= maxCpc * 0.6) reasons.push(`CPC $${d.avgCpc.toFixed(2)}中规中矩（效率得分${efficiencyScore.toFixed(1)}），有优化空间`);
      else reasons.push(`CPC $${d.avgCpc.toFixed(2)}全队最高区间（效率得分${efficiencyScore.toFixed(1)}），严重拖累综合排名`);

      if (dCtr >= maxCtr * 0.85) reasons.push(`CTR ${(dCtr * 100).toFixed(2)}%全队最高区间（质量得分${qualityScore.toFixed(1)}），素材极其吸量`);
      else if (dCtr >= avgCtr) reasons.push(`CTR ${(dCtr * 100).toFixed(2)}%高于团队均值${(avgCtr * 100).toFixed(2)}%（质量得分${qualityScore.toFixed(1)}），素材吸引力不错`);
      else reasons.push(`CTR ${(dCtr * 100).toFixed(2)}%低于团队均值${(avgCtr * 100).toFixed(2)}%（质量得分${qualityScore.toFixed(1)}），素材吸引力待改善`);

      return { designer: d, compositeScore, volumeScore, efficiencyScore, qualityScore, rankingReason: reasons.join('；') };
    });

    scored.sort((a, b) => b.compositeScore - a.compositeScore);
    return scored.map((s, i) => ({ ...s, rank: i + 1 }));
  }, [designers]);

  const handleCardClick = (designer: DesignerStats) => {
    setActiveDesigner(designer);
    setSelectedDesigner(designer.name);
    setModalOpen(true);
  };

  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const setManagerMaterialData = useManagerDataStore(s => s.setManagerMaterialData);

  const handleImportExcel = (file: File) => {
    setImporting(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        const headerRow = rows.find((r: any[]) => r && r.some((c: any) => String(c).includes('素材ID')));
        if (headerRow) {
          const headerStr = headerRow.map((c: any) => String(c)).join(',');
          const hasDesigner = headerStr.includes('设计师');
          const hasMedia = headerStr.includes('媒体');
          if (!hasDesigner || !hasMedia) {
            message.error('表格格式不匹配！请使用管理者设计师素材表（24列，含"设计师"和"媒体"列）');
            setImporting(false);
            return;
          }
        }
        const headerIdx = rows.findIndex((r: any[]) => r && r.some((c: any) => String(c || '').trim() === '素材ID'));
        if (headerIdx < 0) { message.error('未找到表头行（需包含"素材ID"列）'); setImporting(false); return; }
        const headers = rows[headerIdx].map((h: any) => String(h || '').trim());
        const colIdx: Record<string, number> = {};
        headers.forEach((h: string, i: number) => { if (h) colIdx[h] = i; });
        const num = (row: any[], name: string) => { const i = colIdx[name]; const v = i != null ? row[i] : undefined; return v != null && v !== '' ? Number(v) : 0; };
        const str = (row: any[], name: string) => { const i = colIdx[name]; return i != null ? String(row[i] || '') : ''; };
        const dataRows = rows.slice(headerIdx + 1).filter((r: any[]) => {
          const mid = r[colIdx['素材ID']]; return mid && String(mid) !== '合计' && String(mid) !== '汇总';
        });
        const records: MaterialRecord[] = dataRows.map((row: any[]) => {
          const mid = str(row, '素材ID');
          const game = str(row, '游戏分类');
          return {
            key: mid, materialId: mid, game, category: game,
            designer: str(row, '设计师'), media: str(row, '媒体'),
            spend: num(row, '素材花费'), impressions: num(row, '素材展示数'),
            cpm: num(row, '素材千次展示成本'), clicks: num(row, '素材点击数'),
            cpc: num(row, '素材点击成本'), ctr: num(row, '素材点击率'),
            playCount: num(row, '播放次数'), play2s: num(row, '播放2s次数'),
            play6s: num(row, '播放6s次数'), play25: num(row, '播放25%次数'),
            play50: num(row, '播放50%次数'), play75: num(row, '播放75%次数'),
            play100: num(row, '播放100%次数'), preview: str(row, '预览链接'),
            country: '', platform: '', status: '', installs: 0, cpi: 0, roas: 0,
          } as MaterialRecord;
        });
        setManagerMaterialData(records);
        message.success(`成功导入 ${records.length} 条素材数据`);
      } catch (err: any) { message.error(`导入失败: ${err.message || err}`); }
      finally { setImporting(false); }
    };
    reader.readAsArrayBuffer(file);
  };

  // Section style helpers
  const sectionTitle = (num: string, titleStr: string) => (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
      <Tag color="blue" style={{ fontSize: 12, fontWeight: 600 }}>{num}</Tag>
      <Title level={5} style={{ color: text, margin: 0 }}>{titleStr}</Title>
    </div>
  );

  const cardStyle: React.CSSProperties = { background: cardBg, border: `1px solid ${border}`, borderRadius: 8 };

  const chartGrid = { left: 10, right: 20, top: 8, bottom: 8, containLabel: true };

  // Designer detail modal sections
  const getModalSections = (d: DesignerStats): DetailSection[] => {
    const top10 = [...d.materials].sort((a, b) => b.spend - a.spend).slice(0, 10);
    return [
      {
        title: '花费分布',
        content: <ReactECharts option={{
          backgroundColor: 'transparent', tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
          grid: { left: 80, right: 20, top: 8, bottom: 24 },
          xAxis: { type: 'value', axisLabel: { color: muted, fontSize: 10, formatter: (v: number) => `$${v}` }, splitLine: { lineStyle: { color: '#1e293b' } } },
          yAxis: { type: 'category', data: top10.map(m => m.materialId).reverse(), axisLabel: { color: text, fontSize: 10 }, axisLine: { lineStyle: { color: border } } },
          series: [{ type: 'bar', data: top10.map(m => m.spend).reverse(), barWidth: 14, itemStyle: { color: blue, borderRadius: [0, 3, 3, 0] } }],
        }} style={{ height: 280 }} />,
      },
      {
        title: '渠道效率对比',
        content: <Table dataSource={d.mediaBreakdown} rowKey="media" size="small" pagination={false}
          columns={[
            { title: '渠道', dataIndex: 'media', render: (v: string) => <Text style={{ color: text }}>{v}</Text> },
            { title: '素材数', dataIndex: 'count', render: (v: number) => <Text style={{ color: blue }}>{v}</Text> },
            { title: '花费', dataIndex: 'spend', render: (v: number) => <Text style={{ color: yellow }}>${v.toFixed(0)}</Text> },
            { title: '平均CTR', dataIndex: 'avgCtr', render: (v: number) => <Text style={{ color: green }}>{(v * 100).toFixed(2)}%</Text> },
            { title: '平均CPM', dataIndex: 'avgCpm', render: (v: number) => <Text style={{ color: text }}>${v.toFixed(2)}</Text> },
          ]} />,
      },
      {
        title: '素材明细',
        content: <Table dataSource={d.materials} rowKey="materialId" size="small" pagination={{ pageSize: 8 }}
          columns={[
            { title: '素材ID', dataIndex: 'materialId', render: (v: string) => <Text style={{ color: text, fontSize: 12 }}>{v}</Text> },
            { title: '渠道', key: 'media', render: (_: any, r: any) => <Text style={{ color: muted }}>{r.media || '-'}</Text> },
            { title: '花费', dataIndex: 'spend', render: (v: number) => <Text style={{ color: yellow }}>${v.toFixed(2)}</Text> },
            { title: '展示', dataIndex: 'impressions', render: (v: number) => <Text style={{ color: text }}>{v.toLocaleString()}</Text> },
            { title: 'CTR', dataIndex: 'ctr', render: (v: number) => <Text style={{ color: green }}>{(v * 100).toFixed(2)}%</Text> },
            { title: 'CPC', dataIndex: 'cpc', render: (v: number) => <Text style={{ color: text }}>${v.toFixed(2)}</Text> },
            { title: '播放', dataIndex: 'playCount', render: (v: number) => <Text style={{ color: text }}>{(v || 0).toLocaleString()}</Text> },
          ]} />,
      },
    ];
  };

  return (
    <div style={{ padding: 16, background: panelBg, minHeight: '100vh' }}>
      {/* ===== Header: import & clear ===== */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Title level={4} style={{ color: text, margin: 0 }}>游戏广告买量团队体检报告</Title>
        <div style={{ flex: 1 }} />
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }}
          onChange={e => { const file = e.target.files?.[0]; if (file) handleImportExcel(file); e.target.value = ''; }} />
        {importing && <Tag color="blue">导入中...</Tag>}
        <Button size="middle" icon={<UploadOutlined />} loading={importing}
          onClick={() => fileInputRef.current?.click()}
          style={{ background: green, borderColor: green, color: '#fff', fontWeight: 600 }}>导入Excel</Button>
        <Button size="middle" icon={<DeleteOutlined />}
          onClick={() => { localStorage.removeItem('managerMaterialDataStore'); localStorage.setItem('managerMaterialDataStore_cleared', '1'); window.location.reload(); }}
          style={{ background: red, borderColor: red, color: '#fff', fontWeight: 600 }}>清除数据</Button>
      </div>

      {designers.length === 0 && (
        <div style={{ color: muted, textAlign: 'center', padding: 60, fontSize: 14 }}>
          暂无数据，请点击"导入Excel"按钮导入管理者设计师素材表
        </div>
      )}

      {designers.length > 0 && (
        <>
      {/* ===== Report meta ===== */}
      <Card style={{ ...cardStyle, marginBottom: 16 }} styles={{ body: { padding: 16 } }}>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          <div><Text style={{ color: muted }}>报告日期：</Text><Text style={{ color: text }}>{today}</Text></div>
          <div><Text style={{ color: muted }}>数据范围：</Text><Text style={{ color: text }}>表格中所有素材（排除汇总行），包含图片和视频</Text></div>
          <div><Text style={{ color: muted }}>统计指标：</Text><Text style={{ color: text }}>总花费、总展示、总点击、平均点击成本(CPC)、平均点击率(CTR)</Text></div>
        </div>
        <div style={{ marginTop: 8 }}><Text style={{ color: muted }}>核心目标：</Text><Text style={{ color: text }}>客观评估每位设计师的买量效率，找出优势与短板，制定数据驱动的优化策略。</Text></div>
      </Card>

      {/* ===== ONE: Team overview ===== */}
      {sectionTitle('一', '团队整体概览（所有素材）')}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {[
          { label: '总花费', value: team.totalSpend, prefix: '$', precision: 0, color: yellow },
          { label: '总展示数', value: team.totalImpressions, precision: 0, color: blue },
          { label: '总点击数', value: team.totalClicks, precision: 0, color: green },
          { label: '平均点击成本', value: team.overallCpc, prefix: '$', precision: 2, color: yellow },
          { label: '平均点击率', value: overallCtrPct, suffix: '%', precision: 2, color: green },
        ].map((s, i) => (
          <Col span={Math.floor(24 / 5)} key={i}>
            <Card style={cardStyle} styles={{ body: { padding: 12 } }}>
              <Statistic title={<span style={{ color: muted, fontSize: 12 }}>{s.label}</span>}
                value={s.value} prefix={s.prefix} suffix={s.suffix} precision={s.precision}
                valueStyle={{ color: s.color, fontSize: 22, fontWeight: 600 }} />
            </Card>
          </Col>
        ))}
      </Row>
      <Card style={{ ...cardStyle, marginBottom: 24 }} styles={{ body: { padding: 12 } }}>
        {(() => {
          const sRank = rankedDesigners.filter(s => s.designer.grade === 'S');
          const aRank = rankedDesigners.filter(s => s.designer.grade === 'A');
          const bRank = rankedDesigners.filter(s => s.designer.grade === 'B');
          const cRank = rankedDesigners.filter(s => s.designer.grade === 'C');
          const top3Names = rankedDesigners.slice(0, 3).map(s => `${s.designer.name}(${s.compositeScore.toFixed(1)}分)`).join('、');
          const activeDs = rankedDesigners.filter(s => s.designer.totalSpend > 0 && s.designer.totalClicks > 0);
          const cpcs = activeDs.map(s => s.designer.avgCpc).sort((a, b) => a - b);
          const ctrs = activeDs.map(s => s.designer.avgCtr).sort((a, b) => a - b);
          const cpcSpread = cpcs.length > 1 ? cpcs[cpcs.length - 1] / cpcs[0] : 1;
          const ctrSpread = ctrs.length > 1 ? ctrs[ctrs.length - 1] / Math.max(ctrs[0], 0.001) : 1;
          const topHeavy = activeDs.length >= 2 && activeDs[0].designer.totalClicks > team.totalClicks * 0.5;

          // Team diagnosis
          const diagnosisParts: string[] = [];
          if (team.overallCpc < 0.3) diagnosisParts.push(`团队整体CPC $${team.overallCpc.toFixed(2)}处于行业优秀水平（<$0.30），获客成本控制良好`);
          else if (team.overallCpc < 0.6) diagnosisParts.push(`团队整体CPC $${team.overallCpc.toFixed(2)}处于行业中游，仍有${Math.round((1-0.3/team.overallCpc)*100)}%的优化空间可向$${(team.overallCpc*0.7).toFixed(2)}靠拢`);
          else diagnosisParts.push(`团队整体CPC $${team.overallCpc.toFixed(2)}偏高，需系统性优化${cpcs.length > 0 ? `——各设计师CPC从$${cpcs[0].toFixed(2)}到$${cpcs[cpcs.length-1].toFixed(2)}不等，意味着优化空间巨大` : ''}`);

          if (overallCtrPct > 1.5) diagnosisParts.push(`整体CTR ${overallCtrPct.toFixed(2)}%优秀，素材对目标用户的吸引力强`);
          else if (overallCtrPct > 0.8) diagnosisParts.push(`整体CTR ${overallCtrPct.toFixed(2)}%中等偏上，仍有优化空间——团队内CTR差距达${ctrSpread.toFixed(1)}倍，学习高CTR设计师的经验可快速提升`);
          else diagnosisParts.push(`整体CTR ${overallCtrPct.toFixed(2)}%偏低，素材吸引力是当前最大短板——需从钩子设计、卖点选择、落地页匹配三个维度系统性提升`);

          if (cpcSpread > 3 && cpcs.length > 0) diagnosisParts.push(`⚠ 团队CPC极差达${cpcSpread.toFixed(1)}倍（最低$${cpcs[0].toFixed(2)} vs 最高$${cpcs[cpcs.length-1].toFixed(2)}），内部效率分化严重，优化低效设计师是当前ROI最高的动作`);
          if (topHeavy) diagnosisParts.push(`⚠ 流量高度集中于头部设计师（${rankedDesigners[0].designer.name}贡献超50%点击），存在单点风险——需尽快培养第二梯队分散依赖`);
          if (cRank.length >= activeDs.length * 0.4) diagnosisParts.push(`⚠ ${cRank.length}名C级设计师占团队${Math.round(cRank.length/activeDs.length*100)}%，尾部过长——建议对其中数据量充足的限期整改，数据不足的追加投入验证`);

          return (
            <div style={{ lineHeight: '22px' }}>
              <div style={{ marginBottom: 8 }}>
                <Text strong style={{ color: blue, fontSize: 13 }}>【诊断结论】</Text>
                {diagnosisParts.map((part, i) => (
                  <div key={i} style={{ marginTop: i === 0 ? 4 : 2 }}><Text style={{ color: text, fontSize: 13 }}>{part}</Text></div>
                ))}
              </div>
              <Divider style={{ margin: '8px 0', borderColor: border }} />
              <div style={{ marginBottom: 4 }}><Text style={{ color: text, fontSize: 13 }}>综合排名前三：<Text strong style={{ color: green }}>{top3Names}</Text></Text></div>
              {sRank.length > 0 && <div><Text style={{ color: text, fontSize: 13 }}><Tag color="green" style={{ fontSize: 10 }}>S级</Tag><Text strong style={{ color: green }}>{sRank.map(s => s.designer.name).join('、')}</Text>——团队核心资产，CPC和CTR均处于团队前25%，应在优势渠道给予最大预算支持。</Text></div>}
              {aRank.length > 0 && <div><Text style={{ color: text, fontSize: 13 }}><Tag color="blue" style={{ fontSize: 10 }}>A级</Tag><Text strong style={{ color: blue }}>{aRank.map(s => s.designer.name).join('、')}</Text>——团队主力，${aRank.filter(s => s.designer.avgCpc > team.overallCpc).length > 0 ? `其中${aRank.filter(s => s.designer.avgCpc > team.overallCpc).map(s => s.designer.name).join('、')}CPC高于团队均值，需优先优化成本` : '整体表现均衡，可在现有基础上适度扩量'}。</Text></div>}
              {bRank.length > 0 && <div><Text style={{ color: text, fontSize: 13 }}><Tag color="orange" style={{ fontSize: 10 }}>B级</Tag><Text strong style={{ color: yellow }}>{bRank.map(s => s.designer.name).join('、')}</Text>——{bRank.some(s => s.designer.avgCtr > team.overallCtr) ? '部分设计师CTR表现不错，但CPC拉低了综合分，聚焦成本优化后可晋级A级' : '现阶段以创意测试和素材创新为主，降低对效率指标的考核权重，鼓励多样化尝试'}。</Text></div>}
              {cRank.length > 0 && <div><Text style={{ color: text, fontSize: 13 }}><Tag color="red" style={{ fontSize: 10 }}>C级</Tag><Text strong style={{ color: red }}>{cRank.map(s => s.designer.name).join('、')}</Text>——${cRank.some(s => s.designer.totalSpend > 100) ? '已有一定投放数据但仍未达效率基准，需专项辅导或暂停独立投放转协助S/A级设计师' : '数据量尚不足，给予1-2个月的观察期并增加素材产出量再评估'}。</Text></div>}
              <div style={{ marginTop: 6 }}>
                <Text style={{ color: muted, fontSize: 12 }}>
                  排名公式：综合得分 = 体量(40%) + 效率(35%) + 质量(25%)。体量=点击占比归一化，效率=CPC反向归一化，质量=CTR归一化。
                </Text>
              </div>
            </div>
          );
        })()}
      </Card>

      {/* ===== TWO: Designer composite ranking ===== */}
      {sectionTitle('二', '设计师综合排名（团队视角：量40% + 效35% + 质25%）')}
      <Card style={{ ...cardStyle, marginBottom: 24 }} styles={{ body: { padding: 12 } }}>
        {/* Summary at top */}
        <div style={{ marginBottom: 12, padding: '10px 14px', background: panelBg, borderRadius: 6, borderLeft: `3px solid ${blue}` }}>
          <Text style={{ color: text, fontSize: 13, lineHeight: '22px' }}>
            {(() => {
              const best = rankedDesigners[0];
              const second = rankedDesigners[1];
              const third = rankedDesigners[2];
              const topSpenders = [...rankedDesigners].sort((a, b) => b.designer.totalSpend - a.designer.totalSpend).slice(0, 2);
              const lowScorers = rankedDesigners.filter(s => s.designer.totalSpend > 0 && s.compositeScore < 20);
              return <>
                <div><Text strong style={{ color: green }}>{best.designer.name}</Text> 综合排名第1（{best.compositeScore.toFixed(1)}分）：体量{best.volumeScore.toFixed(1)}+效率{best.efficiencyScore.toFixed(1)}+质量{best.qualityScore.toFixed(1)}。作为团队最大流量贡献者，CPC ${best.designer.avgCpc.toFixed(2)}和CTR {(best.designer.avgCtr * 100).toFixed(2)}%均优于团队均值，是当之无愧的团队核心。</div>
                {second && <div><Text strong style={{ color: blue }}>{second.designer.name}</Text> 综合排名第2（{second.compositeScore.toFixed(1)}分）：{second.designer.totalClicks >= best.designer.totalClicks * 0.9 ? '点击量与第1名接近' : `点击量${numberFormat(second.designer.totalClicks)}`}，但CPC ${second.designer.avgCpc.toFixed(2)}{second.designer.avgCpc > best.designer.avgCpc * 1.2 ? `高于${best.designer.name}的$${best.designer.avgCpc.toFixed(2)}` : '表现接近'}，效率分{second.efficiencyScore.toFixed(1)}。</div>}
                {third && <div><Text strong style={{ color: yellow }}>{third.designer.name}</Text> 综合排名第3（{third.compositeScore.toFixed(1)}分）：质量分满分{third.qualityScore.toFixed(1)}（CTR {(third.designer.avgCtr * 100).toFixed(2)}%全队最高），但因体量较小（点击占比{(third.designer.totalClicks / team.totalClicks * 100).toFixed(0)}%），总排名受限于量分。</div>}
                {topSpenders.length >= 2 && <div><Text strong style={{ color: blue }}>{topSpenders.map(d => d.designer.name).join('、')}</Text> 合计贡献团队{((topSpenders.reduce((s, d) => s + d.designer.totalSpend, 0) / team.totalSpend) * 100).toFixed(0)}%花费，{((topSpenders.reduce((s, d) => s + d.designer.totalClicks, 0) / team.totalClicks) * 100).toFixed(0)}%点击。</div>}
                {lowScorers.length > 0 && <div><Text strong style={{ color: red }}>{lowScorers.map(s => s.designer.name).join('、')}</Text> 综合分低于20，需重点优化或暂停独立投放。</div>}
              </>;
            })()}
          </Text>
        </div>
        <Table
          dataSource={rankedDesigners.map(s => ({ ...s.designer, key: s.designer.name, rank: s.rank, compositeScore: s.compositeScore, volumeScore: s.volumeScore, efficiencyScore: s.efficiencyScore, qualityScore: s.qualityScore, rankingReason: s.rankingReason }))}
          rowKey="name"
          size="small"
          pagination={false}
          columns={[
            { title: '排名', dataIndex: 'rank', width: 55,
              render: (v: number) => {
                if (v === 1) return <Tag color="gold" style={{ fontWeight: 600 }}>🥇 {v}</Tag>;
                if (v === 2) return <Tag color="default" style={{ fontWeight: 600 }}>🥈 {v}</Tag>;
                if (v === 3) return <Tag color="orange" style={{ fontWeight: 600 }}>🥉 {v}</Tag>;
                return <Text style={{ color: muted }}>{v}</Text>;
              }},
            { title: '设计师', dataIndex: 'name', render: (v: string, r: any) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Text strong style={{ color: text, cursor: 'pointer' }} onClick={() => handleCardClick(r)}>{v}</Text>
                <Tag color={r.grade === 'S' ? 'green' : r.grade === 'A' ? 'blue' : r.grade === 'B' ? 'orange' : 'red'} style={{ fontSize: 10 }}>
                  {r.grade}级
                </Tag>
              </div>
            )},
            { title: '综合分', dataIndex: 'compositeScore', width: 65,
              render: (v: number) => <Text strong style={{ color: v >= 70 ? green : v >= 45 ? blue : v >= 20 ? yellow : red, fontSize: 13 }}>{v.toFixed(1)}</Text> },
            { title: '体量', dataIndex: 'volumeScore', width: 50,
              render: (v: number) => <Text style={{ color: muted, fontSize: 11 }}>{v.toFixed(1)}</Text> },
            { title: '效率', dataIndex: 'efficiencyScore', width: 50,
              render: (v: number) => <Text style={{ color: muted, fontSize: 11 }}>{v.toFixed(1)}</Text> },
            { title: '质量', dataIndex: 'qualityScore', width: 50,
              render: (v: number) => <Text style={{ color: muted, fontSize: 11 }}>{v.toFixed(1)}</Text> },
            { title: '总花费', dataIndex: 'totalSpend', render: (v: number) => <Text style={{ color: yellow, fontSize: 12 }}>${v.toFixed(0)}</Text> },
            { title: '总点击', dataIndex: 'totalClicks', render: (v: number) => <Text style={{ color: green, fontSize: 12 }}>{numberFormat(v)}</Text> },
            { title: 'CPC', dataIndex: 'avgCpc', sorter: (a: any, b: any) => a.avgCpc - b.avgCpc,
              render: (v: number) => <Text style={{ color: v < 0.5 ? green : v < 1.0 ? yellow : red, fontSize: 12 }}>${v.toFixed(2)}</Text> },
            { title: 'CTR', dataIndex: 'avgCtr',
              render: (v: number) => <Text style={{ color: v > 0.01 ? green : v > 0.005 ? yellow : red, fontSize: 12 }}>{(v * 100).toFixed(2)}%</Text> },
            { title: '主媒体', dataIndex: 'primaryMedia', render: (v: string) => <Tag style={{ fontSize: 10 }}>{v}</Tag> },
          ]} />
      </Card>

      {/* ===== THREE: Designer deep analysis cards ===== */}
      {sectionTitle('三', '各设计师深度分析及优化方向')}
      <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
        {rankedDesigners.map((s, idx) => {
          const d = s.designer;
          const allDs = rankedDesigners.map(x => x.designer);
          const analysis = generateDesignerAnalysis(d, allDs);
          const scoreColor = s.compositeScore >= 70 ? green : s.compositeScore >= 45 ? blue : s.compositeScore >= 20 ? yellow : red;
          const rankText = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
          const isTop3 = idx < 3;
          return (
            <Col span={8} key={d.name}>
              <Card
                hoverable
                onClick={() => { setActiveDesigner(d); setSelectedDesigner(d.name); setModalOpen(true); }}
                style={{
                  background: cardBg, border: `1px solid ${isTop3 ? scoreColor : border}`,
                  borderRadius: 8, cursor: 'pointer', height: '100%',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                styles={{ body: { padding: 12 } }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = scoreColor; (e.currentTarget as HTMLElement).style.boxShadow = `0 0 12px ${scoreColor}33`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = isTop3 ? scoreColor : border; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Text style={{ fontSize: 16 }}>{rankText}</Text>
                  <Text strong style={{ color: text, fontSize: 14, flex: 1 }}>{d.name}</Text>
                  <Tag color={d.grade === 'S' ? 'green' : d.grade === 'A' ? 'blue' : d.grade === 'B' ? 'orange' : 'red'} style={{ fontSize: 10, margin: 0 }}>{d.grade}级</Tag>
                  <Tag style={{ fontSize: 10, background: scoreColor, color: '#fff', border: 'none', margin: 0 }}>{s.compositeScore.toFixed(1)}分</Tag>
                </div>

                {/* Metric strip */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                  <span><Text style={{ color: muted, fontSize: 10 }}>CPC </Text><Text style={{ color: d.avgCpc < 0.5 ? green : d.avgCpc < 1.0 ? yellow : red, fontSize: 12, fontWeight: 600 }}>${d.avgCpc.toFixed(2)}</Text></span>
                  <span><Text style={{ color: muted, fontSize: 10 }}>CTR </Text><Text style={{ color: d.avgCtr > 0.01 ? green : yellow, fontSize: 12, fontWeight: 600 }}>{(d.avgCtr * 100).toFixed(2)}%</Text></span>
                  <span><Text style={{ color: muted, fontSize: 10 }}>点击 </Text><Text style={{ color: text, fontSize: 12 }}>{numberFormat(d.totalClicks)}</Text></span>
                  <span><Text style={{ color: muted, fontSize: 10 }}>花费 </Text><Text style={{ color: text, fontSize: 12 }}>${numberFormat(d.totalSpend)}</Text></span>
                </div>

                {/* Label + score */}
                <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Tag style={{ fontSize: 10, background: scoreColor, color: '#fff', border: 'none' }}>{analysis.label}</Tag>
                  <Text style={{ color: muted, fontSize: 10 }}>量{s.volumeScore.toFixed(0)}+效{s.efficiencyScore.toFixed(0)}+质{s.qualityScore.toFixed(0)}</Text>
                </div>

                {/* Ranking reason — clamped to 2 lines */}
                <div style={{ marginBottom: 8, padding: '6px 8px', background: panelBg, borderRadius: 4, borderLeft: `3px solid ${scoreColor}` }}>
                  <Text style={{ color: muted, fontSize: 10, lineHeight: '16px', display: '-webkit-box', WebkitLineClamp: 2, overflow: 'hidden' } as React.CSSProperties}>
                    {s.rankingReason}
                  </Text>
                </div>

                {/* Strengths */}
                <div style={{ marginBottom: 6 }}>
                  <Text style={{ color: green, fontSize: 10, fontWeight: 600 }}>核心优势</Text>
                  {analysis.strengths.slice(0, 2).map((str, i) => (
                    <div key={i} style={{ paddingLeft: 8, lineHeight: '18px' }}>
                      <Text style={{ color: text, fontSize: 11 }}>+ {str.length > 60 ? str.slice(0, 60) + '...' : str}</Text>
                    </div>
                  ))}
                </div>

                {/* Weaknesses */}
                {analysis.weaknesses.length > 0 && (
                  <div style={{ marginBottom: 6 }}>
                    <Text style={{ color: red, fontSize: 10, fontWeight: 600 }}>待改善</Text>
                    {analysis.weaknesses.slice(0, 2).map((str, i) => (
                      <div key={i} style={{ paddingLeft: 8, lineHeight: '18px' }}>
                        <Text style={{ color: '#fca5a5', fontSize: 11 }}>- {str.length > 60 ? str.slice(0, 60) + '...' : str}</Text>
                      </div>
                    ))}
                  </div>
                )}

                {/* Short-term action */}
                <div style={{ marginBottom: 4 }}>
                  <Text style={{ color: blue, fontSize: 10, fontWeight: 600 }}>短期动作</Text>
                  <div style={{ paddingLeft: 8, lineHeight: '18px' }}>
                    <Text style={{ color: text, fontSize: 11 }}>
                      → {analysis.shortTerm[0].length > 50 ? analysis.shortTerm[0].slice(0, 50) + '...' : analysis.shortTerm[0]}
                    </Text>
                  </div>
                </div>

                {/* Footer: click hint */}
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${border}`, textAlign: 'center' }}>
                  <Text style={{ color: muted, fontSize: 10 }}>点击查看完整分析 →</Text>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Charts row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card style={cardStyle} styles={{ body: { padding: '12px 12px 8px' } }}>
            <Text strong style={{ color: text, fontSize: 13 }}>设计师CPC对比（越低越好）</Text>
            <ReactECharts option={{
              backgroundColor: 'transparent', tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0].name}<br/>CPC: $${p[0].value.toFixed(2)}` },
              grid: chartGrid, xAxis: { type: 'category', data: rankedDesigners.map(s => s.designer.name), axisLabel: { color: muted, fontSize: 10 }, axisLine: { lineStyle: { color: border } } },
              yAxis: { type: 'value', axisLabel: { color: muted, fontSize: 10, formatter: (v: number) => `$${v}` }, splitLine: { lineStyle: { color: '#1e293b' } } },
              series: [{ type: 'bar', data: rankedDesigners.map(s => s.designer.avgCpc), barWidth: 20, itemStyle: { color: yellow, borderRadius: [4, 4, 0, 0] } }],
            }} style={{ height: 240 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card style={cardStyle} styles={{ body: { padding: '12px 12px 8px' } }}>
            <Text strong style={{ color: text, fontSize: 13 }}>设计师CTR对比（越高越好）</Text>
            <ReactECharts option={{
              backgroundColor: 'transparent', tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0].name}<br/>CTR: ${p[0].value.toFixed(2)}%` },
              grid: chartGrid, xAxis: { type: 'category', data: rankedDesigners.map(s => s.designer.name), axisLabel: { color: muted, fontSize: 10 }, axisLine: { lineStyle: { color: border } } },
              yAxis: { type: 'value', axisLabel: { color: muted, fontSize: 10, formatter: (v: number) => `${v}%` }, splitLine: { lineStyle: { color: '#1e293b' } } },
              series: [{ type: 'bar', data: rankedDesigners.map(s => s.designer.avgCtr * 100), barWidth: 20, itemStyle: { color: green, borderRadius: [4, 4, 0, 0] } }],
            }} style={{ height: 240 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card style={cardStyle} styles={{ body: { padding: '12px 12px 8px' } }}>
            <Text strong style={{ color: text, fontSize: 13 }}>花费与展示对比</Text>
            <ReactECharts option={{
              backgroundColor: 'transparent', tooltip: { trigger: 'axis' },
              legend: { data: ['花费', '展示量'], textStyle: { color: muted, fontSize: 10 }, top: 0 },
              grid: { left: 10, right: 20, top: 24, bottom: 8, containLabel: true },
              xAxis: { type: 'category', data: rankedDesigners.map(s => s.designer.name), axisLabel: { color: muted, fontSize: 10 }, axisLine: { lineStyle: { color: border } } },
              yAxis: [
                { type: 'value', axisLabel: { color: muted, fontSize: 10, formatter: (v: number) => `$${v}` }, splitLine: { lineStyle: { color: '#1e293b' } } },
                { type: 'value', axisLabel: { color: muted, fontSize: 10 } },
              ],
              series: [
                { name: '花费', type: 'bar', data: rankedDesigners.map(s => s.designer.totalSpend), barWidth: 20, itemStyle: { color: yellow, borderRadius: [4, 4, 0, 0] } },
                { name: '展示量', type: 'line', yAxisIndex: 1, data: rankedDesigners.map(s => s.designer.totalImpressions), lineStyle: { color: blue }, itemStyle: { color: blue } },
              ],
            }} style={{ height: 240 }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card style={cardStyle} styles={{ body: { padding: '12px 12px 8px' } }}>
            <Text strong style={{ color: text, fontSize: 13 }}>素材数量与渠道分布</Text>
            <ReactECharts option={{
              backgroundColor: 'transparent', tooltip: { trigger: 'item', formatter: (p: any) => `${p.name}<br/>素材数: ${p.value} (${p.percent}%)` },
              series: [{ type: 'pie', radius: ['35%', '65%'], center: ['50%', '55%'],
                data: rankedDesigners.map(s => ({ name: s.designer.name, value: s.designer.materialCount })),
                label: { color: text, fontSize: 10 }, itemStyle: { borderRadius: 4, borderColor: cardBg, borderWidth: 2 },
              }],
            }} style={{ height: 240 }} />
          </Card>
        </Col>
      </Row>

      {/* ===== FOUR: Short-term optimization ===== */}
      {sectionTitle('四', '短期优化策略（1-4周）：聚焦高效渠道与素材')}
      <Card style={{ ...cardStyle, marginBottom: 24 }} styles={{ body: { padding: 16 } }}>
        <Tabs defaultActiveKey="channel"
          items={[
            {
              key: 'channel',
              label: <Text style={{ color: text }}>渠道与预算重分配</Text>,
              children: (
                <Table
                  dataSource={getChannelRedistribution(designers)}
                  rowKey="key"
                  size="small"
                  pagination={false}
                  columns={[
                    { title: '渠道', dataIndex: 'channel', render: (v: string) => <Text strong style={{ color: text }}>{v}</Text> },
                    { title: '原预算占比', dataIndex: 'original', render: (v: string) => <Tag>{v}</Tag> },
                    { title: '新预算占比', dataIndex: 'new_', render: (v: string) => <Tag color="green">{v}</Tag> },
                    { title: '负责设计师', dataIndex: 'designers', render: (v: string) => <Text style={{ color: blue }}>{v}</Text> },
                    { title: '素材类型', dataIndex: 'type', render: (v: string) => <Text style={{ color: muted }}>{v}</Text> },
                    { title: '目标', dataIndex: 'target', render: (v: string) => <Text style={{ color: green }}>{v}</Text> },
                  ]} />
              ),
            },
            {
              key: 'actions',
              label: <Text style={{ color: text }}>具体执行动作</Text>,
              children: (
                <Collapse ghost expandIconPosition="end" style={{ background: 'transparent' }}>
                  {rankedDesigners.map(s => {
                    const analysis = generateDesignerAnalysis(s.designer, rankedDesigners.map(x => x.designer));
                    const gradeColor = s.designer.grade === 'S' ? green : s.designer.grade === 'A' ? blue : s.designer.grade === 'B' ? yellow : red;
                    return (
                    <Panel key={s.designer.name}
                      header={<Text strong style={{ color: text }}>{s.designer.name}（<Text style={{ color: gradeColor }}>{s.designer.grade}级</Text> · {s.designer.primaryMedia} · {s.designer.materialType} · {s.compositeScore.toFixed(1)}分）</Text>}
                      style={{ background: panelBg, borderRadius: 6, marginBottom: 4, border: `1px solid ${border}` }}>
                      <div>
                        <div style={{ marginBottom: 8 }}>
                          <Text strong style={{ color: green, fontSize: 11 }}>短期动作（1-4周）</Text>
                          {analysis.shortTerm.map((str, i) => <div key={i} style={{ padding: '3px 0' }}><Text style={{ color: text, fontSize: 12 }}>• {str}</Text></div>)}
                        </div>
                        <div>
                          <Text strong style={{ color: blue, fontSize: 11 }}>长期方向（2-3月）</Text>
                          {analysis.longTerm.map((str, i) => <div key={i} style={{ padding: '3px 0' }}><Text style={{ color: muted, fontSize: 12 }}>• {str}</Text></div>)}
                        </div>
                      </div>
                    </Panel>
                    );
                  })}
                </Collapse>
              ),
            },
          ]} />
      </Card>

      {/* ===== FIVE: Long-term mechanisms ===== */}
      {sectionTitle('五', '长期建设机制（2-3个月）')}
      <Card style={{ ...cardStyle, marginBottom: 24 }} styles={{ body: { padding: 16 } }}>
        <Tabs defaultActiveKey="grading"
          items={[
            {
              key: 'grading',
              label: <Text style={{ color: text }}>设计师分级与资源倾斜</Text>,
              children: (
                <Table
                  dataSource={getGradeData(rankedDesigners)}
                  rowKey="key"
                  size="small"
                  pagination={false}
                  columns={[
                    { title: '级别', dataIndex: 'gradeLabel',
                      render: (v: string) => <Tag color={v === 'S级' ? 'green' : v === 'A级' ? 'blue' : v === 'B级' ? 'orange' : 'red'}>{v}</Tag> },
                    { title: '设计师', dataIndex: 'designer', render: (v: string) => <Text strong style={{ color: text }}>{v}</Text> },
                    { title: '预算占比', dataIndex: 'budgetShare', render: (v: string) => <Text style={{ color: yellow }}>{v}</Text> },
                    { title: '考核标准', dataIndex: 'kpi', render: (v: string) => <Text style={{ color: text }}>{v}</Text> },
                  ]} />
              ),
            },
            {
              key: 'quality',
              label: <Text style={{ color: text }}>素材质量评分体系（视频素材）</Text>,
              children: (
                <div>
                  <Table dataSource={qualityScoringData} rowKey="key" size="small" pagination={false} columns={qualityScoringCols} />
                  <div style={{ marginTop: 8, padding: '8px 12px', background: panelBg, borderRadius: 6 }}>
                    <Text style={{ color: muted, fontSize: 11 }}>每周输出红黑榜，红榜素材入库模板库，黑榜暂停并复盘。</Text>
                  </div>
                </div>
              ),
            },
            {
              key: 'training',
              label: <Text style={{ color: text }}>培训与知识沉淀</Text>,
              children: (
                <div style={{ padding: 8 }}>
                  <div style={{ padding: '4px 0' }}><Text style={{ color: text, fontSize: 12 }}>每月1次内部复盘会：分享红榜素材的设计思路和数据。</Text></div>
                  <div style={{ padding: '4px 0' }}><Text style={{ color: text, fontSize: 12 }}>每季度1次外部培训：邀请广告平台优化师或创意专家授课。</Text></div>
                  <div style={{ padding: '4px 0' }}><Text style={{ color: text, fontSize: 12 }}>素材中台建设：按"渠道-素材类型-卖点"分类存储高绩效素材，新设计师必须学习。</Text></div>
                </div>
              ),
            },
          ]} />
      </Card>

      {/* ===== SIX: Expected benefits ===== */}
      {sectionTitle('六', '预期收益')}
      <Card style={{ ...cardStyle, marginBottom: 24 }} styles={{ body: { padding: 12 } }}>
        {(() => {
          const active = rankedDesigners.filter(s => s.designer.totalSpend > 0);
          const activeDs = active.map(s => s.designer);
          const top3Cpc = [...activeDs].sort((a, b) => a.avgCpc - b.avgCpc).slice(0, 3);
          const top3CpcAvg = top3Cpc.reduce((sum, d) => sum + d.avgCpc, 0) / Math.max(top3Cpc.length, 1);
          const currentCpc = team.overallCpc;
          const cpcTarget = +(currentCpc * 0.8).toFixed(2);
          const clickBoost = Math.round((1 - cpcTarget / currentCpc) * 100) + 20;
          const sDesigner = active.find(s => s.designer.grade === 'S');
          const aDesigners = active.filter(s => s.designer.grade === 'A');
          const medCpcVal = activeDs.length > 0
            ? [...activeDs].sort((a, b) => a.avgCpc - b.avgCpc)[Math.floor(activeDs.length / 2)].avgCpc
            : 0;
          return (
            <Table
              dataSource={[
                {
                  key: '1', time: '1个月后',
                  effect: `整体CPC从$${currentCpc.toFixed(2)}降至$${cpcTarget}以下（向TOP3均值$${top3CpcAvg.toFixed(2)}靠拢），点击量提升${clickBoost}%`,
                },
                {
                  key: '2', time: '2个月后',
                  effect: `${sDesigner ? sDesigner.designer.name + '贡献' + Math.round(sDesigner.designer.totalClicks / Math.max(team.totalClicks, 1) * 100 * 1.5) + '%' : 'S级贡献'}点击量，${aDesigners.length > 0 ? aDesigners.map(s => s.designer.name).join('、') + '贡献45%' : 'A级贡献45%'}，团队CPC中位数降至$${(medCpcVal * 0.85).toFixed(2)}以下`,
                },
                {
                  key: '3', time: '3个月后',
                  effect: `买量成本降低${Math.round((1 - cpcTarget / currentCpc) * 100)}%，转化量提升50%+，低效素材占比降至10%以下`,
                },
              ]}
              rowKey="key"
              size="small"
              pagination={false}
              columns={[
                { title: '时间节点', dataIndex: 'time', width: 120, render: (v: string) => <Tag color="blue" style={{ fontSize: 12 }}>{v}</Tag> },
                { title: '预期效果', dataIndex: 'effect', render: (v: string) => <Text style={{ color: text, fontSize: 12 }}>{v}</Text> },
              ]} />
          );
        })()}
      </Card>

      {/* ===== APPENDIX: Material tagging system ===== */}
      <Divider style={{ borderColor: border }} />
      {sectionTitle('附', '素材中台分类标签体系')}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card style={cardStyle} styles={{ body: { padding: 12 } }} title={<Text strong style={{ color: text, fontSize: 13 }}>标签结构（4级）</Text>}>
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {tagTreeData.map(cat => (
                <div key={cat.value} style={{ marginBottom: 12 }}>
                  <Text strong style={{ color: blue, fontSize: 12 }}>├── {cat.label}</Text>
                  {(cat.children || []).map(child => (
                    <div key={child.value} style={{ marginLeft: 24 }}>
                      {child.children ? (
                        <>
                          <Text style={{ color: yellow, fontSize: 11 }}>├── {child.label}</Text>
                          {child.children.map(gc => (
                            <div key={gc.value} style={{ marginLeft: 24 }}>
                              <Text style={{ color: muted, fontSize: 10 }}>├── {gc.label}</Text>
                            </div>
                          ))}
                        </>
                      ) : (
                        <div><Text style={{ color: muted, fontSize: 11 }}>├── {child.label}</Text></div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card style={cardStyle} styles={{ body: { padding: 12 } }} title={<Text strong style={{ color: text, fontSize: 13 }}>标签使用示例</Text>}>
            <Table
              dataSource={tagExampleData}
              rowKey="key"
              size="small"
              pagination={false}
              columns={[
                { title: '素材ID', dataIndex: 'id', render: (v: string) => <Text style={{ color: text, fontSize: 11 }}>{v}</Text> },
                { title: '渠道', dataIndex: 'channel', render: (v: string) => <Tag style={{ fontSize: 10 }}>{v}</Tag> },
                { title: '类型', dataIndex: 'type', render: (v: string) => <Text style={{ color: muted, fontSize: 11 }}>{v}</Text> },
                { title: '卖点', dataIndex: 'selling', render: (v: string) => <Text style={{ color: blue, fontSize: 11 }}>{v}</Text> },
                { title: '钩子', dataIndex: 'hook', render: (v: string) => <Text style={{ color: yellow, fontSize: 11 }}>{v}</Text> },
                { title: '绩效', dataIndex: 'performance',
                  render: (v: string) => <Tag color={v === '红榜' ? 'green' : v === '黑榜' ? 'red' : 'default'} style={{ fontSize: 10 }}>{v}</Tag> },
              ]} />
            <div style={{ marginTop: 12, padding: '8px 12px', background: panelBg, borderRadius: 6 }}>
              <Text style={{ color: muted, fontSize: 10 }}>
                上传素材时设计师按以上标签填写；每周复盘筛选"绩效标签=红榜"+指定渠道即可快速找到可复用的高绩效素材模板。
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      <DesignerDetailModal
        open={modalOpen}
        designer={activeDesigner}
        sections={activeDesigner ? getModalSections(activeDesigner) : []}
        onClose={() => { setModalOpen(false); setSelectedDesigner(null); }}
      />
        </>
      )}
    </div>
  );
}
