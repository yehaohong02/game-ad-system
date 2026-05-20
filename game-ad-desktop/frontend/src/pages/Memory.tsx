import { useEffect, useState } from 'react';
import {
  Row, Col, Card, Input, Button, Space, Tag, Badge, Typography, Empty, Spin, Divider, Drawer,
} from 'antd';
import {
  SearchOutlined, ReloadOutlined, FileTextOutlined, BankOutlined,
  MobileOutlined, TrophyOutlined, DollarOutlined,
} from '@ant-design/icons';
import { useMemoryStore, CaseResult } from '../stores/memory';

const { Title, Text, Paragraph } = Typography;

function similarityColor(sim: number): string {
  if (sim >= 0.9) return '#10B981';
  if (sim >= 0.8) return '#4F46E5';
  if (sim >= 0.7) return '#F59E0B';
  return '#64748B';
}

function CaseCard({ item, onDetail }: { item: CaseResult; onDetail: () => void }) {
  return (
    <Card
      hoverable
      style={{ background: '#1E293B', border: '1px solid #334155', height: '100%' }}
      onClick={onDetail}
    >
      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Tag color="blue">{item.case_id}</Tag>
            <Tag>{item.platform}</Tag>
          </Space>
          <Badge
            count={`${(item.similarity * 100).toFixed(0)}%`}
            style={{
              backgroundColor: similarityColor(item.similarity),
              color: '#fff',
              fontWeight: 600,
              boxShadow: 'none',
            }}
          />
        </div>

        <div>
          <BankOutlined style={{ color: '#64748B', marginRight: 6 }} />
          <Text style={{ color: '#94A3B8', fontSize: 13 }}>{item.country}</Text>
          <Text style={{ color: '#64748B', fontSize: 12, marginLeft: 12 }}>{item.campaign_id}</Text>
        </div>

        <Paragraph
          style={{ color: '#E2E8F0', fontSize: 13, marginBottom: 0 }}
          ellipsis={{ rows: 3 }}
        >
          {item.summary}
        </Paragraph>

        <Divider style={{ margin: '4px 0', borderColor: '#334155' }} />

        <Row gutter={16}>
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <DollarOutlined style={{ color: '#F59E0B', fontSize: 16 }} />
              <div style={{ color: '#E2E8F0', fontWeight: 600, marginTop: 4 }}>
                ${item.final_result.total_spend.toLocaleString()}
              </div>
              <div style={{ color: '#64748B', fontSize: 11 }}>总花费</div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <MobileOutlined style={{ color: '#4F46E5', fontSize: 16 }} />
              <div style={{ color: '#E2E8F0', fontWeight: 600, marginTop: 4 }}>
                {item.final_result.total_installs.toLocaleString()}
              </div>
              <div style={{ color: '#64748B', fontSize: 11 }}>总安装</div>
            </div>
          </Col>
          <Col span={8}>
            <div style={{ textAlign: 'center' }}>
              <TrophyOutlined
                style={{ color: item.final_result.roas >= 1 ? '#10B981' : '#EF4444', fontSize: 16 }}
              />
              <div
                style={{
                  color: item.final_result.roas >= 1 ? '#10B981' : '#EF4444',
                  fontWeight: 600,
                  marginTop: 4,
                }}
              >
                {item.final_result.roas.toFixed(2)}
              </div>
              <div style={{ color: '#64748B', fontSize: 11 }}>ROAS</div>
            </div>
          </Col>
        </Row>
      </Space>
    </Card>
  );
}

function CaseDetailDrawer({
  open,
  case: caseItem,
  onClose,
}: {
  open: boolean;
  case: CaseResult | null;
  onClose: () => void;
}) {
  if (!caseItem) return null;
  return (
    <Drawer
      title={
        <Space>
          <span style={{ color: '#E2E8F0' }}>{caseItem.case_id}</span>
          <Tag color="blue">{caseItem.platform}</Tag>
          <Tag>{caseItem.country}</Tag>
        </Space>
      }
      open={open}
      onClose={onClose}
      width={480}
      styles={{
        header: { background: '#1E293B', borderBottom: '1px solid #334155' },
        body: { background: '#1E293B' },
      }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size={16}>
        <div>
          <Text style={{ color: '#64748B', fontSize: 12 }}>Campaign</Text>
          <div style={{ color: '#E2E8F0', fontSize: 15, marginTop: 4 }}>{caseItem.campaign_id}</div>
        </div>

        <div>
          <Text style={{ color: '#64748B', fontSize: 12 }}>相似度</Text>
          <div style={{ marginTop: 4 }}>
            <Badge
              count={`${(caseItem.similarity * 100).toFixed(0)}%`}
              style={{
                backgroundColor: similarityColor(caseItem.similarity),
                color: '#fff',
                fontWeight: 600,
                fontSize: 14,
                boxShadow: 'none',
              }}
            />
          </div>
        </div>

        <div>
          <Text style={{ color: '#64748B', fontSize: 12 }}>案例摘要</Text>
          <Paragraph style={{ color: '#E2E8F0', marginTop: 4, lineHeight: 1.8 }}>
            {caseItem.summary}
          </Paragraph>
        </div>

        <Divider style={{ borderColor: '#334155' }} />

        <Row gutter={16}>
          <Col span={8}>
            <Card style={{ background: '#0F172A', border: '1px solid #334155', textAlign: 'center' }}>
              <div style={{ color: '#F59E0B', fontSize: 20, fontWeight: 700 }}>
                ${caseItem.final_result.total_spend.toLocaleString()}
              </div>
              <div style={{ color: '#64748B', fontSize: 12, marginTop: 4 }}>总花费</div>
            </Card>
          </Col>
          <Col span={8}>
            <Card style={{ background: '#0F172A', border: '1px solid #334155', textAlign: 'center' }}>
              <div style={{ color: '#4F46E5', fontSize: 20, fontWeight: 700 }}>
                {caseItem.final_result.total_installs.toLocaleString()}
              </div>
              <div style={{ color: '#64748B', fontSize: 12, marginTop: 4 }}>总安装</div>
            </Card>
          </Col>
          <Col span={8}>
            <Card style={{ background: '#0F172A', border: '1px solid #334155', textAlign: 'center' }}>
              <div
                style={{
                  color: caseItem.final_result.roas >= 1 ? '#10B981' : '#EF4444',
                  fontSize: 20,
                  fontWeight: 700,
                }}
              >
                {caseItem.final_result.roas.toFixed(2)}
              </div>
              <div style={{ color: '#64748B', fontSize: 12, marginTop: 4 }}>ROAS</div>
            </Card>
          </Col>
        </Row>
      </Space>
    </Drawer>
  );
}

export default function Memory() {
  const {
    searchQuery, searchResults, weeklyReport, loading, reportLoading,
    hasSearched, setSearchQuery, search, fetchWeeklyReport,
  } = useMemoryStore();

  const [detailCase, setDetailCase] = useState<CaseResult | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    fetchWeeklyReport();
  }, []);

  const handleSearch = (value: string) => {
    if (value.trim()) search(value.trim());
  };

  const showDetail = (c: CaseResult) => {
    setDetailCase(c);
    setDrawerOpen(true);
  };

  return (
    <div className="page-enter">
      {/* Search Section */}
      <Card style={{ background: '#1E293B', border: '1px solid #334155', marginBottom: 16 }}>
        <Title level={4} style={{ color: '#E2E8F0', marginBottom: 16 }}>
          <FileTextOutlined style={{ marginRight: 8 }} />
          记忆沉淀
        </Title>
        <Input.Search
          placeholder="语义搜索 — 输入关键词检索历史案例，如：ROAS优化、CPI控制、素材衰减..."
          enterButton={<span><SearchOutlined /> 搜索</span>}
          size="large"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onSearch={handleSearch}
          loading={loading}
          style={{ maxWidth: 720 }}
        />
      </Card>

      {/* Results Section */}
      <Spin spinning={loading}>
        {!hasSearched ? (
          <Card style={{ background: '#1E293B', border: '1px solid #334155', textAlign: 'center', padding: '48px 0' }}>
            <Empty
              description={
                <span style={{ color: '#64748B' }}>
                  输入关键词开始语义搜索，检索历史投放案例与经验
                </span>
              }
            />
          </Card>
        ) : searchResults.length === 0 && !loading ? (
          <Card style={{ background: '#1E293B', border: '1px solid #334155', textAlign: 'center', padding: '48px 0' }}>
            <Empty description={<span style={{ color: '#64748B' }}>未找到匹配的案例</span>} />
          </Card>
        ) : (
          <>
            <div style={{ marginBottom: 12 }}>
              <Text style={{ color: '#94A3B8' }}>
                找到 <Text style={{ color: '#4F46E5', fontWeight: 600 }}>{searchResults.length}</Text> 条相关案例
              </Text>
            </div>
            <Row gutter={[16, 16]}>
              {searchResults.map((item) => (
                <Col key={item.case_id} xs={24} sm={12} lg={8} xl={6}>
                  <CaseCard item={item} onDetail={() => showDetail(item)} />
                </Col>
              ))}
            </Row>
          </>
        )}
      </Spin>

      {/* Weekly Report Section */}
      <Card
        title={
          <Space>
            <FileTextOutlined style={{ color: '#4F46E5' }} />
            <span style={{ color: '#E2E8F0' }}>AI 周报</span>
          </Space>
        }
        style={{ background: '#1E293B', border: '1px solid #334155', marginTop: 24 }}
        extra={
          <Button
            icon={<ReloadOutlined />}
            size="small"
            onClick={fetchWeeklyReport}
            loading={reportLoading}
          >
            刷新
          </Button>
        }
      >
        <Spin spinning={reportLoading}>
          {weeklyReport ? (
            <div style={{ color: '#94A3B8', lineHeight: 2, whiteSpace: 'pre-wrap' }}>
              {weeklyReport.split('\n').map((line, i) => {
                if (line.startsWith('## ')) {
                  return (
                    <div key={i} style={{ color: '#E2E8F0', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                      {line.replace('## ', '')}
                    </div>
                  );
                }
                if (line.startsWith('### ')) {
                  return (
                    <div key={i} style={{ color: '#E2E8F0', fontSize: 15, fontWeight: 600, marginTop: 16, marginBottom: 8 }}>
                      {line.replace('### ', '')}
                    </div>
                  );
                }
                if (line.startsWith('- **')) {
                  const match = line.match(/^- \*\*(.+?)\*\*：?(.*)$/);
                  if (match) {
                    return (
                      <div key={i} style={{ marginBottom: 4, paddingLeft: 12 }}>
                        <Text style={{ color: '#4F46E5', fontWeight: 600 }}>{match[1]}</Text>
                        <Text style={{ color: '#94A3B8' }}>：{match[2]}</Text>
                      </div>
                    );
                  }
                }
                if (line.startsWith('- ')) {
                  return (
                    <div key={i} style={{ marginBottom: 4, paddingLeft: 12 }}>
                      <span style={{ color: '#4F46E5', marginRight: 8 }}>&bull;</span>
                      {line.substring(2)}
                    </div>
                  );
                }
                if (/^\d+\./.test(line)) {
                  return (
                    <div key={i} style={{ marginBottom: 4, paddingLeft: 12 }}>
                      {line}
                    </div>
                  );
                }
                if (line.trim() === '') return <div key={i} style={{ height: 8 }} />;
                return <div key={i}>{line}</div>;
              })}
            </div>
          ) : (
            <Empty description={<span style={{ color: '#64748B' }}>暂无周报数据</span>} />
          )}
        </Spin>
      </Card>

      {/* Detail Drawer */}
      <CaseDetailDrawer
        open={drawerOpen}
        case={detailCase}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
