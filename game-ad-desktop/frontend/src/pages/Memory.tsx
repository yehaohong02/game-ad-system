import { useState } from 'react';
import {
  Row, Col, Card, Input, Button, Space, Tag, Typography, Empty, Spin, Divider, Drawer, Badge, Tooltip,
} from 'antd';
import {
  SearchOutlined, ReloadOutlined, FileTextOutlined, ArrowRightOutlined,
} from '@ant-design/icons';
import { useMemoryStore, type CaseResult } from '../stores/memory';

const { Text, Paragraph } = Typography;

function similarityColor(sim: number): string {
  if (sim >= 0.9) return '#10B981';
  if (sim >= 0.8) return '#4F46E5';
  if (sim >= 0.7) return '#F59E0B';
  return '#64748B';
}

function CaseRow({ item, onDetail }: { item: CaseResult; onDetail: () => void }) {
  return (
    <div
      onClick={onDetail}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px',
        borderBottom: '1px solid #1E293B', cursor: 'pointer',
        transition: 'background 0.2s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#1E293B')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Similarity badge */}
      <Tooltip title={`相似度 ${(item.similarity * 100).toFixed(0)}%`}>
        <div style={{
          width: 40, height: 40, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: similarityColor(item.similarity) + '22', flexShrink: 0,
        }}>
          <span style={{ color: similarityColor(item.similarity), fontWeight: 700, fontSize: 13 }}>
            {(item.similarity * 100).toFixed(0)}
          </span>
        </div>
      </Tooltip>

      {/* Main info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <Text style={{ color: '#E2E8F0', fontSize: 13, fontWeight: 600 }} ellipsis>{item.campaign_id}</Text>
          <Tag style={{ fontSize: 10, margin: 0, lineHeight: '16px' }}>{item.platform}</Tag>
          <Tag color="blue" style={{ fontSize: 10, margin: 0, lineHeight: '16px' }}>{item.country}</Tag>
        </div>
        <Text style={{ color: '#64748B', fontSize: 12 }} ellipsis>{item.summary}</Text>
      </div>

      {/* Inline metrics */}
      <Space size={16} style={{ flexShrink: 0 }}>
        <Tooltip title="总花费">
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#F59E0B', fontSize: 13, fontWeight: 600 }}>
              ¥{item.final_result.total_spend >= 10000 ? `${(item.final_result.total_spend / 10000).toFixed(1)}万` : item.final_result.total_spend.toLocaleString()}
            </div>
            <div style={{ color: '#475569', fontSize: 10 }}>花费</div>
          </div>
        </Tooltip>
        <Tooltip title="总曝光">
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#4F46E5', fontSize: 13, fontWeight: 600 }}>
              {item.final_result.impressions ? `${(item.final_result.impressions / 10000).toFixed(1)}万` : '-'}
            </div>
            <div style={{ color: '#475569', fontSize: 10 }}>曝光</div>
          </div>
        </Tooltip>
        <Tooltip title="CTR (点击率)">
          <div style={{ textAlign: 'center' }}>
            <div style={{
              color: (item.final_result.ctr ?? 0) >= 1.5 ? '#10B981' : (item.final_result.ctr ?? 0) >= 0.5 ? '#F59E0B' : '#EF4444',
              fontSize: 13, fontWeight: 700,
            }}>
              {item.final_result.ctr ? `${item.final_result.ctr.toFixed(2)}%` : '-'}
            </div>
            <div style={{ color: '#475569', fontSize: 10 }}>CTR</div>
          </div>
        </Tooltip>
        <ArrowRightOutlined style={{ color: '#334155', fontSize: 12 }} />
      </Space>
    </div>
  );
}

function CaseDetailDrawer({
  open, case: caseItem, onClose,
}: {
  open: boolean; case: CaseResult | null; onClose: () => void;
}) {
  if (!caseItem) return null;
  return (
    <Drawer
      title={
        <Space>
          <span style={{ color: '#E2E8F0' }}>{caseItem.campaign_id}</span>
          <Tag color="blue">{caseItem.platform}</Tag>
          <Tag>{caseItem.country}</Tag>
        </Space>
      }
      open={open} onClose={onClose} width={480}
      styles={{ header: { background: '#1E293B', borderBottom: '1px solid #334155' }, body: { background: '#1E293B' } }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size={16}>
        <div>
          <Text style={{ color: '#64748B', fontSize: 12 }}>案例ID</Text>
          <div style={{ color: '#E2E8F0', fontSize: 13, marginTop: 4 }}>{caseItem.case_id}</div>
        </div>
        <div>
          <Text style={{ color: '#64748B', fontSize: 12 }}>相似度</Text>
          <div style={{ marginTop: 4 }}>
            <Badge
              count={`${(caseItem.similarity * 100).toFixed(0)}%`}
              style={{ backgroundColor: similarityColor(caseItem.similarity), color: '#fff', fontWeight: 600, fontSize: 14, boxShadow: 'none' }}
            />
          </div>
        </div>
        <div>
          <Text style={{ color: '#64748B', fontSize: 12 }}>案例摘要</Text>
          <Paragraph style={{ color: '#E2E8F0', marginTop: 4, lineHeight: 1.8, fontSize: 13 }}>
            {caseItem.summary}
          </Paragraph>
        </div>
        <Divider style={{ borderColor: '#334155' }} />
        <Row gutter={12}>
          <Col span={8}>
            <Card style={{ background: '#0F172A', border: '1px solid #334155', textAlign: 'center' }}>
              <div style={{ color: '#F59E0B', fontSize: 18, fontWeight: 700 }}>¥{caseItem.final_result.total_spend >= 10000 ? `${(caseItem.final_result.total_spend / 10000).toFixed(1)}万` : caseItem.final_result.total_spend.toLocaleString()}</div>
              <div style={{ color: '#64748B', fontSize: 11, marginTop: 4 }}>总花费</div>
            </Card>
          </Col>
          <Col span={8}>
            <Card style={{ background: '#0F172A', border: '1px solid #334155', textAlign: 'center' }}>
              <div style={{ color: '#4F46E5', fontSize: 18, fontWeight: 700 }}>{caseItem.final_result.impressions ? `${(caseItem.final_result.impressions / 10000).toFixed(1)}万` : '-'}</div>
              <div style={{ color: '#64748B', fontSize: 11, marginTop: 4 }}>总曝光</div>
            </Card>
          </Col>
          <Col span={8}>
            <Card style={{ background: '#0F172A', border: '1px solid #334155', textAlign: 'center' }}>
              <div style={{ color: (caseItem.final_result.ctr ?? 0) >= 1.5 ? '#10B981' : (caseItem.final_result.ctr ?? 0) >= 0.5 ? '#F59E0B' : '#EF4444', fontSize: 18, fontWeight: 700 }}>{caseItem.final_result.ctr ? `${caseItem.final_result.ctr.toFixed(2)}%` : '-'}</div>
              <div style={{ color: '#64748B', fontSize: 11, marginTop: 4 }}>CTR</div>
            </Card>
          </Col>
        </Row>
      </Space>
    </Drawer>
  );
}

export default function Memory() {
  const {
    searchQuery, searchResults, allCases, weeklyReport, loading, reportLoading,
    hasSearched, setSearchQuery, search, fetchWeeklyReport,
  } = useMemoryStore();

  const [detailCase, setDetailCase] = useState<CaseResult | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [reportExpanded, setReportExpanded] = useState(false);

  const handleSearch = (value: string) => { if (value.trim()) search(value.trim()); };

  const showDetail = (c: CaseResult) => { setDetailCase(c); setDrawerOpen(true); };

  const displayResults = hasSearched ? searchResults : allCases;

  return (
    <div className="page-enter">
      {/* Compact search bar */}
      <Card style={{ background: '#1E293B', border: '1px solid #334155', marginBottom: 12 }} bodyStyle={{ padding: '10px 16px' }}>
        <Row align="middle" gutter={12}>
          <Col flex="auto">
            <Input.Search
              placeholder="语义搜索历史案例 — 如: ROAS优化、CPI控制、素材衰减、长投策略..."
              enterButton={<span><SearchOutlined /> 搜索</span>}
              size="middle"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onSearch={handleSearch}
              loading={loading}
            />
          </Col>
          <Col>
            <Text style={{ color: '#64748B', fontSize: 12 }}>
              共 <Text style={{ color: '#4F46E5', fontWeight: 600 }}>{allCases.length}</Text> 条案例
              {hasSearched && searchResults.length > 0 && (
                <>, 匹配 <Text style={{ color: '#10B981', fontWeight: 600 }}>{searchResults.length}</Text> 条</>
              )}
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Results */}
      <Spin spinning={loading}>
        {!hasSearched && allCases.length === 0 ? (
          <Card style={{ background: '#1E293B', border: '1px solid #334155', textAlign: 'center', padding: '32px 0' }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={<span style={{ color: '#64748B', fontSize: 13 }}>输入关键词检索历史投放案例与经验</span>}
            />
          </Card>
        ) : hasSearched && searchResults.length === 0 && !loading ? (
          <Card style={{ background: '#1E293B', border: '1px solid #334155', textAlign: 'center', padding: '32px 0' }}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span style={{ color: '#64748B' }}>未找到匹配案例</span>} />
          </Card>
        ) : (
          <Card
            style={{ background: '#0F172A', border: '1px solid #334155' }}
            bodyStyle={{ padding: 0 }}
          >
            {displayResults.map((item) => (
              <CaseRow key={item.case_id} item={item} onDetail={() => showDetail(item)} />
            ))}
          </Card>
        )}
      </Spin>

      {/* Weekly Report - compact collapsible */}
      <Card
        style={{ background: '#1E293B', border: '1px solid #334155', marginTop: 12 }}
        bodyStyle={{ padding: reportExpanded ? '12px 16px' : '0' }}
      >
        <div
          onClick={() => setReportExpanded(!reportExpanded)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 16px', cursor: 'pointer',
            borderBottom: reportExpanded ? '1px solid #334155' : 'none',
          }}
        >
          <Space size={8}>
            <FileTextOutlined style={{ color: '#4F46E5', fontSize: 14 }} />
            <Text style={{ color: '#E2E8F0', fontSize: 13, fontWeight: 600 }}>AI 周报</Text>
            {weeklyReport && (
              <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>5/14-5/20</Tag>
            )}
          </Space>
          <Space size={8}>
            <Button
              icon={<ReloadOutlined />}
              size="small"
              onClick={(e) => { e.stopPropagation(); fetchWeeklyReport(); }}
              loading={reportLoading}
              style={{ fontSize: 12 }}
            >
              刷新
            </Button>
            <Text style={{ color: '#64748B', fontSize: 12 }}>
              {reportExpanded ? '收起' : '展开'}
            </Text>
          </Space>
        </div>
        {reportExpanded && (
          <Spin spinning={reportLoading}>
            {weeklyReport ? (
              <div style={{ color: '#94A3B8', lineHeight: 1.8, whiteSpace: 'pre-wrap', paddingTop: 8, fontSize: 13 }}>
                {weeklyReport.split('\n').map((line, i) => {
                  if (line.startsWith('## ')) {
                    return <div key={i} style={{ color: '#E2E8F0', fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{line.replace('## ', '')}</div>;
                  }
                  if (line.startsWith('### ')) {
                    return <div key={i} style={{ color: '#E2E8F0', fontSize: 13, fontWeight: 600, marginTop: 12, marginBottom: 4 }}>{line.replace('### ', '')}</div>;
                  }
                  if (line.startsWith('- **')) {
                    const match = line.match(/^- \*\*(.+?)\*\*：?(.*)$/);
                    if (match) {
                      return (
                        <div key={i} style={{ marginBottom: 2, paddingLeft: 12 }}>
                          <Text style={{ color: '#4F46E5', fontWeight: 600, fontSize: 12 }}>{match[1]}</Text>
                          <Text style={{ color: '#94A3B8', fontSize: 12 }}>：{match[2]}</Text>
                        </div>
                      );
                    }
                  }
                  if (line.startsWith('- ')) {
                    return (
                      <div key={i} style={{ marginBottom: 2, paddingLeft: 12, fontSize: 12 }}>
                        <span style={{ color: '#4F46E5', marginRight: 6 }}>&bull;</span>
                        {line.substring(2)}
                      </div>
                    );
                  }
                  if (/^\d+\./.test(line)) {
                    return <div key={i} style={{ marginBottom: 2, paddingLeft: 12, fontSize: 12 }}>{line}</div>;
                  }
                  if (line.trim() === '') return <div key={i} style={{ height: 4 }} />;
                  return <div key={i} style={{ fontSize: 12 }}>{line}</div>;
                })}
              </div>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span style={{ color: '#64748B' }}>暂无周报数据</span>} />
            )}
          </Spin>
        )}
      </Card>

      {/* Detail Drawer */}
      <CaseDetailDrawer open={drawerOpen} case={detailCase} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
