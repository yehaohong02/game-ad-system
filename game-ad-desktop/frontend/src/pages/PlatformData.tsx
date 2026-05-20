import { useState, useEffect } from 'react';
import {
  Card, Table, Button, Input, Space, Tag, Spin, Typography, message, Modal, Upload,
  Row, Col, Progress,
} from 'antd';
import {
  DownloadOutlined, FileExcelOutlined,
  GlobalOutlined, LinkOutlined,
  RadarChartOutlined,
  StarOutlined, StarFilled, DeleteOutlined, KeyOutlined,
  UploadOutlined, ReloadOutlined, DatabaseOutlined,
  ThunderboltOutlined,
  PlayCircleOutlined, BarChartOutlined,
} from '@ant-design/icons';
import { usePlatformDataStore } from '../stores/platformData';

const { Text } = Typography;

const cardStyle = { background: '#1E293B', border: '1px solid #334155' };
const sidebarItemStyle = (active: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: 'pointer',
  borderRadius: 6, fontSize: 13, color: active ? '#E2E8F0' : '#94A3B8',
  background: active ? '#334155' : 'transparent', transition: 'all 0.2s',
});

const defaultQuickSites = [
  { name: 'AdXray', url: 'https://www.adxray.com' },
  { name: '广大大', url: 'https://www.guangdada.com' },
  { name: 'AppGrowing', url: 'https://appgrowing.cn' },
];

export default function PlatformData() {
  const {
    downloadRecords, scannedPages, scanning, scanProgress,
    savedCredentials, bookmarks,
    dataCategories, activeCategory, dataRecords, dataLoading,
    overviewSummary, overviewLoading,
    setCrawlPlatformId, clickDownloadButton,
    importDownloadedFile, initDownloadListener, startAutoScan,
    checkSavedCredentials, saveCredentials, autoLogin,
    fetchBookmarks, addBookmark, deleteBookmark,
    setActiveCategory, loadCategoryData, uploadDataFile,
    loadOverviewSummary,
  } = usePlatformDataStore();

  const [siteUrl, setSiteUrl] = useState('');
  const [siteName, setSiteName] = useState('');
  const [siteOpened, setSiteOpened] = useState(false);
  const [opening, setOpening] = useState(false);
  const [crawlDir, setCrawlDir] = useState('');

  // Credential modal
  const [credModalOpen, setCredModalOpen] = useState(false);
  const [credUsername, setCredUsername] = useState('');
  const [credPassword, setCredPassword] = useState('');

  // Bookmark modal
  const [bmModalOpen, setBmModalOpen] = useState(false);
  const [bmName, setBmName] = useState('');

  // Smart download panel collapsed
  const [smartPanelOpen, setSmartPanelOpen] = useState(false);

  useEffect(() => {
    initDownloadListener();
    fetchBookmarks();
    // Default crawl directory
    const defaultDir = 'D:\\CC\\数据\\crawl_1779164418450';
    setCrawlDir(defaultDir);
    loadOverviewSummary(defaultDir).catch(() => {});
  }, []);

  const handleOpenSite = async (url?: string) => {
    const targetUrl = url || siteUrl;
    if (!targetUrl) { message.warning('请输入网站地址'); return; }
    setOpening(true);
    if (!url) setSiteUrl(targetUrl);
    const platformId = `crawl_${Date.now()}`;
    const electron = (window as any).electronAPI?.platformData;

    if (electron) {
      try {
        await electron.openPlatform(platformId, targetUrl);
        setCrawlPlatformId(platformId);
        setSiteOpened(true);
        setSiteName(targetUrl);
        message.success('网站已打开，请在弹出窗口中登录');
        const siteKey = new URL(targetUrl).hostname;
        await checkSavedCredentials(siteKey);
      } catch (err: any) {
        message.error('打开失败: ' + err.message);
      }
    } else {
      setSiteOpened(true);
      setSiteName(targetUrl);
      message.success('网站已打开（模拟）');
    }
    setOpening(false);
  };

  const handleAutoLogin = async () => {
    if (!savedCredentials) return;
    await autoLogin(savedCredentials.username, savedCredentials.password);
    message.success('已自动填充登录信息');
  };

  const handleSaveCredentials = async () => {
    if (!credUsername || !credPassword) { message.warning('请输入账号和密码'); return; }
    const siteKey = new URL(siteUrl).hostname;
    await saveCredentials(siteKey, credUsername, credPassword);
    setCredModalOpen(false); setCredUsername(''); setCredPassword('');
    message.success('账号密码已保存');
  };

  const handleAddBookmark = async () => {
    const name = bmName || siteName || siteUrl;
    if (!name || !siteUrl) { message.warning('请先打开网站'); return; }
    await addBookmark(name, siteUrl);
    setBmModalOpen(false); setBmName('');
    message.success('已添加到书签');
  };

  const handleCategoryClick = (catId: string) => {
    setActiveCategory(catId);
    if (catId === 'overview') {
      loadOverviewSummary(crawlDir);
    } else {
      loadCategoryData(crawlDir, catId);
    }
  };

  const handleUpload = async (file: File) => {
    await uploadDataFile(file, activeCategory);
    message.success(`已导入 ${file.name}`);
    return false; // prevent default upload
  };

  const activeCat = dataCategories.find(c => c.id === activeCategory);
  const tableColumns = activeCat?.columns.map(col => ({
    title: col.title,
    dataIndex: col.key,
    key: col.key,
    width: col.width,
    ellipsis: col.ellipsis,
    sorter: (a: any, b: any) => {
      const va = a[col.key]; const vb = b[col.key];
      if (typeof va === 'number' && typeof vb === 'number') return va - vb;
      return String(va ?? '').localeCompare(String(vb ?? ''));
    },
    render: (v: any) => {
      if (v === null || v === undefined || v === '') return <Text style={{ color: '#475569', fontSize: 12 }}>-</Text>;
      if (typeof v === 'number') return <Text style={{ color: '#E2E8F0', fontSize: 12 }}>{v.toLocaleString()}</Text>;
      return <Text style={{ color: '#E2E8F0', fontSize: 12 }}>{String(v)}</Text>;
    },
  })) ?? [];

  // Add source file column
  tableColumns.push({
    title: '来源文件',
    dataIndex: '_source',
    key: '_source',
    width: 200,
    ellipsis: true,
    sorter: (a: any, b: any) => String(a._source ?? '').localeCompare(String(b._source ?? '')),
    render: (v: string) => <Text style={{ color: '#64748B', fontSize: 11 }}>{v}</Text>,
  });

  return (
    <div className="page-enter" style={{ display: 'flex', gap: 16, height: 'calc(100vh - 120px)' }}>
      {/* Left sidebar */}
      <div style={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Category list */}
        <Card style={{ ...cardStyle, flex: 1, overflow: 'auto' }} bodyStyle={{ padding: 8 }}>
          <div style={{ padding: '4px 8px', marginBottom: 8 }}>
            <Text style={{ color: '#64748B', fontSize: 11, fontWeight: 600 }}>数据分类</Text>
          </div>
          {(() => {
            const groups = [
              { label: '', ids: ['overview'] },
              { label: '国内数据', ids: ['domestic_heavy', 'domestic', 'domestic_light', 'domestic_new', 'domestic_reserve'] },
              { label: '海外数据', ids: ['overseas', 'overseas_reserve', 'overseas_out'] },
              { label: '短剧数据', ids: ['drama', 'drama_copy', 'drama_hot', 'drama_golden'] },
            ];
            return groups.map((g, gi) => (
              <div key={gi}>
                {g.label && (
                  <div style={{ padding: '8px 8px 2px', color: '#475569', fontSize: 10, fontWeight: 600, letterSpacing: 1 }}>
                    {g.label}
                  </div>
                )}
                {g.ids.map(id => {
                  const cat = dataCategories.find(c => c.id === id);
                  if (!cat) return null;
                  return (
                    <div key={cat.id} style={sidebarItemStyle(activeCategory === cat.id)}
                      onClick={() => handleCategoryClick(cat.id)}>
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                      {dataRecords.length > 0 && activeCategory === cat.id && (
                        <Tag color="blue" style={{ fontSize: 10, marginLeft: 'auto' }}>{dataRecords.length}</Tag>
                      )}
                    </div>
                  );
                })}
              </div>
            ));
          })()}
        </Card>

        {/* Bookmarks */}
        {bookmarks.length > 0 && (
          <Card style={cardStyle} bodyStyle={{ padding: 8 }}>
            <div style={{ padding: '4px 8px', marginBottom: 4 }}>
              <Text style={{ color: '#64748B', fontSize: 11, fontWeight: 600 }}>
                <StarFilled style={{ color: '#F59E0B', marginRight: 4 }} />书签
              </Text>
            </div>
            {bookmarks.map(bm => (
              <div key={bm.id} style={{ display: 'flex', alignItems: 'center', padding: '4px 8px' }}>
                <Text style={{ color: '#94A3B8', fontSize: 11, flex: 1, cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  onClick={() => handleOpenSite(bm.url)} title={bm.url}>
                  {bm.name}
                </Text>
                <Button size="small" type="text" icon={<DeleteOutlined />}
                  onClick={() => { deleteBookmark(bm.id); }}
                  style={{ color: '#475569', fontSize: 10, padding: '0 2px', minWidth: 0 }} />
              </div>
            ))}
          </Card>
        )}

        {/* Smart download toggle */}
        <Card style={cardStyle} bodyStyle={{ padding: 8 }}>
          <div style={{ ...sidebarItemStyle(false), justifyContent: 'center' }}
            onClick={() => setSmartPanelOpen(!smartPanelOpen)}>
            <RadarChartOutlined style={{ color: '#7C3AED' }} />
            <span>智能下载</span>
          </div>
        </Card>
      </div>

      {/* Right main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
        {/* Smart download panel (collapsible) */}
        {smartPanelOpen && (
          <Card style={cardStyle} bodyStyle={{ padding: 12 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <Input prefix={<LinkOutlined style={{ color: '#64748B' }} />}
                placeholder="输入网站地址" value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                onPressEnter={() => handleOpenSite()}
                style={{ flex: 1, background: '#0F172A', borderColor: '#334155', color: '#E2E8F0' }} />
              <Button type="primary" icon={<GlobalOutlined />} loading={opening} onClick={() => handleOpenSite()}
                style={{ background: '#3B82F6', borderColor: '#3B82F6' }}>打开网站</Button>
              {siteOpened && (
                <>
                  <Button icon={<RadarChartOutlined />} loading={scanning} onClick={startAutoScan}
                    style={{ borderColor: '#7C3AED', color: '#7C3AED' }}>智能扫描</Button>
                  {savedCredentials && (
                    <Button icon={<KeyOutlined />} onClick={handleAutoLogin}
                      style={{ borderColor: '#10B981', color: '#10B981' }}>自动填充</Button>
                  )}
                  <Button icon={<KeyOutlined />} onClick={() => setCredModalOpen(true)}
                    style={{ borderColor: '#334155', color: '#94A3B8' }}>保存密码</Button>
                  <Button icon={<StarOutlined />} onClick={() => { setBmName(siteName || siteUrl); setBmModalOpen(true); }}
                    style={{ borderColor: '#334155', color: '#F59E0B' }}>收藏</Button>
                </>
              )}
            </div>

            {/* Quick sites */}
            <Space size={8}>
              <Text style={{ color: '#64748B', fontSize: 11 }}>快捷:</Text>
              {defaultQuickSites.map(s => (
                <Button key={s.name} size="small" onClick={() => { setSiteUrl(s.url); setSiteName(s.name); }}
                  style={{ borderColor: '#334155', color: '#94A3B8', fontSize: 11 }}>{s.name}</Button>
              ))}
            </Space>

            {/* Scanning status */}
            {scanning && (
              <div style={{ textAlign: 'center', padding: 16 }}>
                <Spin size="large" />
                <Text style={{ color: '#94A3B8', display: 'block', marginTop: 8 }}>
                  正在自动浏览网站各页面...
                </Text>
                {scanProgress && (
                  <>
                    <Progress percent={Math.round(scanProgress.page / scanProgress.maxPages * 100)}
                      strokeColor="#7C3AED" trailColor="#1E293B" size="small"
                      style={{ width: 300, margin: '8px auto 0' }} />
                    <Text style={{ color: '#64748B', fontSize: 11, display: 'block', marginTop: 4 }}>
                      第 {scanProgress.page}/{scanProgress.maxPages} 页 · 已发现 {scanProgress.found} 个下载按钮
                    </Text>
                    <Text style={{ color: '#475569', fontSize: 10, display: 'block', marginTop: 2, maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '2px auto 0' }}>
                      {scanProgress.url}
                    </Text>
                  </>
                )}
              </div>
            )}

            {/* Scan results */}
            {!scanning && scannedPages.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <Text style={{ color: '#94A3B8', fontSize: 12 }}>
                  发现 {scannedPages.reduce((s, p) => s + p.buttons.length, 0)} 个下载按钮:
                </Text>
                <Space wrap style={{ marginTop: 4 }}>
                  {scannedPages.map((page, pi) => page.buttons.map((btn, bi) => (
                    <Button key={`${pi}-${bi}`} size="small" type="primary" icon={<DownloadOutlined />}
                      onClick={() => { clickDownloadButton(btn.selector); message.success(`正在下载: ${btn.text}`); }}
                      style={{ background: '#059669', borderColor: '#059669', fontSize: 11 }}>
                      {btn.text} <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>{page.title}</Text>
                    </Button>
                  )))}
                </Space>
              </div>
            )}

            {/* Download records */}
            {downloadRecords.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <Text style={{ color: '#94A3B8', fontSize: 12, marginBottom: 4, display: 'block' }}>下载记录:</Text>
                <Space wrap>
                  {downloadRecords.map((r, i) => (
                    <Tag key={i} color={r.status === 'done' ? 'green' : r.status === 'error' ? 'red' : 'blue'}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        if (r.status === 'pending') { importDownloadedFile(r); message.success('正在同步导入...'); }
                      }}>
                      {r.fileName} {r.status === 'done' ? '✓' : r.status === 'pending' ? '(点击同步)' : ''}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}
          </Card>
        )}

        {/* Content area */}
        {activeCategory === 'overview' ? (
          /* Overview Dashboard */
          overviewLoading ? (
            <Card style={{ ...cardStyle, flex: 1 }} bodyStyle={{ textAlign: 'center', padding: 60 }}>
              <Spin size="large" />
              <Text style={{ color: '#94A3B8', display: 'block', marginTop: 12 }}>分析数据中...</Text>
            </Card>
          ) : overviewSummary ? (
            <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* Compact stats row */}
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { label: '数据文件', value: overviewSummary.totalFiles, color: '#3B82F6', bg: '#1E3A5F' },
                  { label: '总记录', value: overviewSummary.totalRecords.toLocaleString(), color: '#10B981', bg: '#1A3326' },
                  { label: '覆盖游戏', value: overviewSummary.topGames.length, color: '#A855F7', bg: '#3B1F4E' },
                  { label: '投放公司', value: overviewSummary.topCompanies.length, color: '#F59E0B', bg: '#3D2E1A' },
                  { label: '均素材/游戏', value: overviewSummary.avgMaterialPerGame.toLocaleString(), color: '#EC4899', bg: '#3D1A2E' },
                ].map((s, i) => (
                  <div key={i} style={{ flex: 1, background: '#1E293B', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 6, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: s.color, fontSize: 14, fontWeight: 700 }}>{String(s.value).replace(/[^a-zA-Z0-9]/g, '').charAt(0) || '#'}</span>
                    </div>
                    <div>
                      <Text style={{ color: '#64748B', fontSize: 10, display: 'block', lineHeight: '14px' }}>{s.label}</Text>
                      <Text style={{ color: '#E2E8F0', fontSize: 16, fontWeight: 700, lineHeight: '20px' }}>{s.value}</Text>
                    </div>
                  </div>
                ))}
              </div>

              {/* Compact category bar */}
              <div style={{ display: 'flex', gap: 4, background: '#1E293B', border: '1px solid #334155', borderRadius: 8, padding: '8px 10px' }}>
                {overviewSummary.categoryStats.filter(c => c.recordCount > 0).map(cat => (
                  <div key={cat.id} onClick={() => handleCategoryClick(cat.id)}
                    style={{ flex: 1, cursor: 'pointer', textAlign: 'center', padding: '4px 2px', borderRadius: 4, transition: 'background 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#334155'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                    <Text style={{ color: '#E2E8F0', fontSize: 11, display: 'block' }}>{cat.icon} {cat.name}</Text>
                    <Text style={{ color: '#3B82F6', fontSize: 13, fontWeight: 600 }}>{cat.recordCount}</Text>
                  </div>
                ))}
              </div>

              {/* AI Insights */}
              {overviewSummary.insights.length > 0 && (
                <Card style={cardStyle} bodyStyle={{ padding: '10px 14px' }}
                  title={<span style={{ color: '#E2E8F0', fontSize: 13 }}><ThunderboltOutlined style={{ color: '#F59E0B', marginRight: 6 }} />数据洞察 · {overviewSummary.insights.length} 条发现</span>}>
                  <Row gutter={[16, 8]}>
                    {overviewSummary.insights.map((insight, i) => (
                      <Col key={i} span={12}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                          <Tag color="gold" style={{ marginTop: 2, fontSize: 10, lineHeight: '14px', padding: '0 4px', flexShrink: 0 }}>{i + 1}</Tag>
                          <Text style={{ color: '#CBD5E1', fontSize: 12, lineHeight: '18px' }}>{insight}</Text>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </Card>
              )}

              {/* Row 1: Top Games + Top Companies */}
              <Row gutter={6}>
                <Col span={12}>
                  <Card style={cardStyle} bodyStyle={{ padding: 10 }}
                    title={<span style={{ color: '#E2E8F0', fontSize: 12 }}>🏆 买量TOP10游戏</span>}>
                    {overviewSummary.topGames.slice(0, 10).map((game, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', borderBottom: i < 9 ? '1px solid #1E293B' : 'none' }}>
                        <Tag color={i < 3 ? 'gold' : 'default'} style={{ fontSize: 10, minWidth: 20, textAlign: 'center', margin: 0, padding: '0 2px' }}>{i + 1}</Tag>
                        <Text style={{ color: '#E2E8F0', fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{game.name}</Text>
                        <Text style={{ color: '#64748B', fontSize: 10 }}>{game.company}</Text>
                        <Text style={{ color: '#3B82F6', fontSize: 11, fontWeight: 600, minWidth: 50, textAlign: 'right' }}>{game.score.toLocaleString()}</Text>
                      </div>
                    ))}
                  </Card>
                </Col>
                <Col span={12}>
                  <Card style={cardStyle} bodyStyle={{ padding: 10 }}
                    title={<span style={{ color: '#E2E8F0', fontSize: 12 }}>🏢 活跃投放公司TOP10</span>}>
                    {overviewSummary.topCompanies.slice(0, 10).map((comp, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', borderBottom: i < 9 ? '1px solid #1E293B' : 'none' }}>
                        <Tag color={i < 3 ? 'purple' : 'default'} style={{ fontSize: 10, minWidth: 20, textAlign: 'center', margin: 0, padding: '0 2px' }}>{i + 1}</Tag>
                        <Text style={{ color: '#E2E8F0', fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{comp.name}</Text>
                        <Text style={{ color: '#A855F7', fontSize: 11, fontWeight: 600 }}>{comp.count}</Text>
                      </div>
                    ))}
                  </Card>
                </Col>
              </Row>

              {/* Row 2: Genres + Gameplay + Media */}
              <Row gutter={6}>
                <Col span={8}>
                  <Card style={cardStyle} bodyStyle={{ padding: 10 }}
                    title={<span style={{ color: '#E2E8F0', fontSize: 12 }}>🎮 热门题材</span>}>
                    {overviewSummary.topGenres.slice(0, 8).map((g, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}>
                        <Text style={{ color: '#E2E8F0', fontSize: 11, flex: 1 }}>{g.name}</Text>
                        <Progress percent={overviewSummary.topGenres[0] ? Math.round(g.count / overviewSummary.topGenres[0].count * 100) : 0}
                          showInfo={false} strokeColor="#10B981" trailColor="#1E293B" size="small" style={{ width: 60, margin: 0 }} />
                        <Text style={{ color: '#10B981', fontSize: 10, minWidth: 24, textAlign: 'right' }}>{g.count}</Text>
                      </div>
                    ))}
                  </Card>
                </Col>
                <Col span={8}>
                  <Card style={cardStyle} bodyStyle={{ padding: 10 }}
                    title={<span style={{ color: '#E2E8F0', fontSize: 12 }}>🎯 玩法类型</span>}>
                    {overviewSummary.gameplayTypes.slice(0, 8).map((g, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}>
                        <Text style={{ color: '#E2E8F0', fontSize: 11, flex: 1 }}>{g.name}</Text>
                        <Progress percent={overviewSummary.gameplayTypes[0] ? Math.round(g.count / overviewSummary.gameplayTypes[0].count * 100) : 0}
                          showInfo={false} strokeColor="#6366F1" trailColor="#1E293B" size="small" style={{ width: 60, margin: 0 }} />
                        <Text style={{ color: '#6366F1', fontSize: 10, minWidth: 24, textAlign: 'right' }}>{g.count}</Text>
                      </div>
                    ))}
                  </Card>
                </Col>
                <Col span={8}>
                  <Card style={cardStyle} bodyStyle={{ padding: 10 }}
                    title={<span style={{ color: '#E2E8F0', fontSize: 12 }}>📡 投放媒体分布</span>}>
                    {overviewSummary.topMedia.slice(0, 8).map((m, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}>
                        <Text style={{ color: '#E2E8F0', fontSize: 11, flex: 1 }}>{m.name}</Text>
                        <Progress percent={overviewSummary.topMedia[0] ? Math.round(m.count / overviewSummary.topMedia[0].count * 100) : 0}
                          showInfo={false} strokeColor="#F59E0B" trailColor="#1E293B" size="small" style={{ width: 60, margin: 0 }} />
                        <Text style={{ color: '#F59E0B', fontSize: 10, minWidth: 24, textAlign: 'right' }}>{m.count}</Text>
                      </div>
                    ))}
                  </Card>
                </Col>
              </Row>

              {/* Row 3: Drama Country + Tag Cloud + Top Products + Duration */}
              {(overviewSummary.dramaCountryDist.length > 0 || overviewSummary.dramaTagCloud.length > 0 || overviewSummary.dramaTopProducts.length > 0 || overviewSummary.dramaDurationDist.length > 0) && (
                <Row gutter={6}>
                  {overviewSummary.dramaCountryDist.length > 0 && (
                    <Col span={6}>
                      <Card style={cardStyle} bodyStyle={{ padding: 10 }}
                        title={<span style={{ color: '#E2E8F0', fontSize: 12 }}>🌏 短剧地区分布</span>}>
                        {overviewSummary.dramaCountryDist.slice(0, 8).map((c, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}>
                            <Text style={{ color: '#E2E8F0', fontSize: 11, flex: 1 }}>{c.country}</Text>
                            <Progress percent={overviewSummary.dramaCountryDist[0] ? Math.round(c.count / overviewSummary.dramaCountryDist[0].count * 100) : 0}
                              showInfo={false} strokeColor="#EC4899" trailColor="#1E293B" size="small" style={{ width: 50, margin: 0 }} />
                            <Text style={{ color: '#EC4899', fontSize: 10, minWidth: 20, textAlign: 'right' }}>{c.count}</Text>
                          </div>
                        ))}
                      </Card>
                    </Col>
                  )}
                  {overviewSummary.dramaTagCloud.length > 0 && (
                    <Col span={6}>
                      <Card style={cardStyle} bodyStyle={{ padding: 10 }}
                        title={<span style={{ color: '#E2E8F0', fontSize: 12 }}>🏷️ 短剧标签云</span>}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {overviewSummary.dramaTagCloud.slice(0, 20).map((t, i) => (
                            <Tag key={i} color={i < 3 ? 'magenta' : i < 7 ? 'volcano' : 'default'}
                              style={{ fontSize: i < 3 ? 12 : i < 7 ? 11 : 10, padding: '1px 6px', margin: 0 }}>
                              {t.tag}({t.count})
                            </Tag>
                          ))}
                        </div>
                      </Card>
                    </Col>
                  )}
                  {overviewSummary.dramaTopProducts.length > 0 && (
                    <Col span={6}>
                      <Card style={cardStyle} bodyStyle={{ padding: 10 }}
                        title={<span style={{ color: '#E2E8F0', fontSize: 12 }}>📱 短剧投放主</span>}>
                        {overviewSummary.dramaTopProducts.slice(0, 8).map((p, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', borderBottom: i < 7 ? '1px solid #1E293B' : 'none' }}>
                            <Tag color={i < 3 ? 'magenta' : 'default'} style={{ fontSize: 10, minWidth: 20, textAlign: 'center', margin: 0, padding: '0 2px' }}>{i + 1}</Tag>
                            <Text style={{ color: '#E2E8F0', fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.product}</Text>
                            <Text style={{ color: '#EC4899', fontSize: 10, fontWeight: 600 }}>{p.dramaCount}部</Text>
                          </div>
                        ))}
                      </Card>
                    </Col>
                  )}
                  {overviewSummary.dramaDurationDist.length > 0 && (
                    <Col span={6}>
                      <Card style={cardStyle} bodyStyle={{ padding: 10 }}
                        title={<span style={{ color: '#E2E8F0', fontSize: 12 }}>⏱ 短剧投放时长</span>}>
                        {overviewSummary.dramaDurationDist.map((d, i) => {
                          const maxCount = Math.max(...overviewSummary.dramaDurationDist.map(x => x.count), 1);
                          return (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}>
                              <Text style={{ color: '#E2E8F0', fontSize: 11, minWidth: 48 }}>{d.range}</Text>
                              <Progress percent={Math.round(d.count / maxCount * 100)}
                                showInfo={false} strokeColor="#F472B6" trailColor="#1E293B" size="small" style={{ flex: 1, margin: 0 }} />
                              <Text style={{ color: '#F472B6', fontSize: 10, minWidth: 20, textAlign: 'right' }}>{d.count}</Text>
                            </div>
                          );
                        })}
                      </Card>
                    </Col>
                  )}
                </Row>
              )}

              {/* Row 4: Long-term + Rising + Cross-region */}
              <Row gutter={6}>
                <Col span={8}>
                  <Card style={cardStyle} bodyStyle={{ padding: 10 }}
                    title={<span style={{ color: '#E2E8F0', fontSize: 12 }}>🔥 长期投放TOP10</span>}>
                    {overviewSummary.longTermGames.slice(0, 10).map((g, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', borderBottom: i < 9 ? '1px solid #1E293B' : 'none' }}>
                        <Tag color={i < 3 ? 'volcano' : 'default'} style={{ fontSize: 10, minWidth: 20, textAlign: 'center', margin: 0, padding: '0 2px' }}>{i + 1}</Tag>
                        <Text style={{ color: '#E2E8F0', fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</Text>
                        <Text style={{ color: '#64748B', fontSize: 10 }}>{g.company}</Text>
                        <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: 600, minWidth: 36, textAlign: 'right' }}>{g.days}天</Text>
                      </div>
                    ))}
                  </Card>
                </Col>
                <Col span={8}>
                  <Card style={cardStyle} bodyStyle={{ padding: 10 }}
                    title={<span style={{ color: '#E2E8F0', fontSize: 12 }}>📈 排名上升</span>}>
                    {overviewSummary.risingGames.length > 0 ? overviewSummary.risingGames.slice(0, 10).map((g, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', borderBottom: i < 9 ? '1px solid #1E293B' : 'none' }}>
                        <Text style={{ color: '#10B981', fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</Text>
                        <Text style={{ color: '#64748B', fontSize: 10 }}>{g.company}</Text>
                        <Tag color="green" style={{ fontSize: 10, margin: 0 }}>{g.change}</Tag>
                      </div>
                    )) : <Text style={{ color: '#475569', fontSize: 11 }}>暂无排名变化数据</Text>}
                  </Card>
                </Col>
                <Col span={8}>
                  <Card style={cardStyle} bodyStyle={{ padding: 10 }}
                    title={<span style={{ color: '#E2E8F0', fontSize: 12 }}>🌐 内外出海公司</span>}>
                    {overviewSummary.crossRegionCompanies.length > 0 ? overviewSummary.crossRegionCompanies.slice(0, 10).map((c, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', borderBottom: i < 9 ? '1px solid #1E293B' : 'none' }}>
                        <Text style={{ color: '#E2E8F0', fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</Text>
                        <Space size={2}>
                          {c.regions.map(r => <Tag key={r} color={r === '国内' ? 'blue' : 'magenta'} style={{ fontSize: 9, margin: 0, padding: '0 3px' }}>{r}</Tag>)}
                        </Space>
                        <Text style={{ color: '#F59E0B', fontSize: 10, fontWeight: 600 }}>{c.gameCount}款</Text>
                      </div>
                    )) : <Text style={{ color: '#475569', fontSize: 11 }}>暂无跨区域公司数据</Text>}
                  </Card>
                </Col>
              </Row>

              {/* Row 5: Outbound + Reserve + Media strategy */}
              <Row gutter={6}>
                <Col span={8}>
                  <Card style={cardStyle} bodyStyle={{ padding: 10 }}
                    title={<span style={{ color: '#E2E8F0', fontSize: 12 }}>✈️ 出海公司TOP10</span>}>
                    {overviewSummary.topOutboundCompanies.length > 0 ? overviewSummary.topOutboundCompanies.map((c, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', borderBottom: i < 9 ? '1px solid #1E293B' : 'none' }}>
                        <Tag color={i < 3 ? 'magenta' : 'default'} style={{ fontSize: 10, minWidth: 20, textAlign: 'center', margin: 0, padding: '0 2px' }}>{i + 1}</Tag>
                        <Text style={{ color: '#E2E8F0', fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</Text>
                        <Tag color="cyan" style={{ fontSize: 9, margin: 0 }}>{c.topMarket}</Tag>
                        <Text style={{ color: '#EC4899', fontSize: 10, fontWeight: 600 }}>{c.overseasGames}款</Text>
                      </div>
                    )) : <Text style={{ color: '#475569', fontSize: 11 }}>暂无出海数据</Text>}
                  </Card>
                </Col>
                <Col span={8}>
                  <Card style={cardStyle} bodyStyle={{ padding: 10 }}
                    title={<span style={{ color: '#E2E8F0', fontSize: 12 }}>📅 预约游戏</span>}>
                    {overviewSummary.reserveGames.length > 0 ? overviewSummary.reserveGames.map((g, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', borderBottom: i < 9 ? '1px solid #1E293B' : 'none' }}>
                        <Text style={{ color: '#E2E8F0', fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</Text>
                        <Text style={{ color: '#64748B', fontSize: 10 }}>{g.company}</Text>
                        <Tag color="orange" style={{ fontSize: 9, margin: 0 }}>{g.launchDate || '待定'}</Tag>
                      </div>
                    )) : <Text style={{ color: '#475569', fontSize: 11 }}>暂无预约数据</Text>}
                  </Card>
                </Col>
                <Col span={8}>
                  <Card style={cardStyle} bodyStyle={{ padding: 10 }}
                    title={<span style={{ color: '#E2E8F0', fontSize: 12 }}>📊 媒体覆盖游戏数</span>}>
                    {overviewSummary.mediaStrategy.map((m, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}>
                        <Text style={{ color: '#E2E8F0', fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.media}</Text>
                        <Text style={{ color: '#64748B', fontSize: 9, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.topGame}</Text>
                        <Text style={{ color: '#3B82F6', fontSize: 10, fontWeight: 600, minWidth: 24, textAlign: 'right' }}>{m.gameCount}</Text>
                      </div>
                    ))}
                  </Card>
                </Col>
              </Row>

              {/* Row 6: Dramas + Drama Keywords */}
              {(overviewSummary.topDramas.length > 0 || overviewSummary.dramaKeywords.length > 0) && (
                <Row gutter={6}>
                  {overviewSummary.topDramas.length > 0 && (
                    <Col span={12}>
                      <Card style={cardStyle} bodyStyle={{ padding: 10 }}
                        title={<span style={{ color: '#E2E8F0', fontSize: 12 }}><PlayCircleOutlined style={{ color: '#EC4899', marginRight: 4 }} />短剧投放TOP5</span>}>
                        <Row gutter={[8, 8]}>
                          {overviewSummary.topDramas.slice(0, 5).map((d, i) => (
                            <Col key={i} span={i < 3 ? 8 : 12}>
                              <div style={{ background: '#0F172A', borderRadius: 6, padding: 8, border: '1px solid #1E293B', textAlign: 'center' }}>
                                <Tag color={i < 3 ? 'magenta' : 'default'} style={{ fontSize: 9, marginBottom: 4 }}>#{i + 1}</Tag>
                                <Text style={{ color: '#E2E8F0', fontSize: 12, display: 'block', fontWeight: 500 }}>{d.name}</Text>
                                <Text style={{ color: '#EC4899', fontSize: 14, fontWeight: 700, display: 'block' }}>{d.score.toLocaleString()}</Text>
                                <Text style={{ color: '#64748B', fontSize: 10 }}>{d.country}</Text>
                              </div>
                            </Col>
                          ))}
                        </Row>
                      </Card>
                    </Col>
                  )}
                  {overviewSummary.dramaKeywords.length > 0 && (
                    <Col span={overviewSummary.topDramas.length > 0 ? 12 : 24}>
                      <Card style={cardStyle} bodyStyle={{ padding: 10 }}
                        title={<span style={{ color: '#E2E8F0', fontSize: 12 }}>✍️ 短剧文案高频词</span>}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {overviewSummary.dramaKeywords.map((k, i) => (
                            <Tag key={i} color={i < 3 ? 'magenta' : i < 6 ? 'volcano' : 'default'}
                              style={{ fontSize: i < 3 ? 13 : i < 6 ? 12 : 11, padding: '2px 8px' }}>
                              {k.word} <span style={{ opacity: 0.7 }}>({k.count})</span>
                            </Tag>
                          ))}
                        </div>
                      </Card>
                    </Col>
                  )}
                </Row>
              )}

              {/* Row 7: Drama Hot Apps + Golden 3-sec Analysis */}
              <Row gutter={6}>
                <Col span={12}>
                  <Card style={cardStyle} bodyStyle={{ padding: 10 }}
                    title={<span style={{ color: '#E2E8F0', fontSize: 12 }}>📱 短剧热榜投放APP</span>}>
                    <Row gutter={[8, 4]}>
                      {[
                        { app: 'My Drama / MyDrama', count: 5, hot: 'Mr Denver 4845万', color: '#EC4899' },
                        { app: 'Kuku TV', count: 5, hot: 'ROCKETWALA 2318万', color: '#F472B6' },
                        { app: 'DramaShorts / Dramashorts', count: 5, hot: 'Billionaire 8831万', color: '#E879F9' },
                        { app: 'NetShort', count: 4, hot: 'Wolfless 547万', color: '#A855F7' },
                        { app: 'DramaBox', count: 3, hot: "Lady Boss 3082万", color: '#8B5CF6' },
                        { app: 'DramaWave', count: 2, hot: "Dragon King 211万", color: '#6366F1' },
                        { app: 'ReelShort', count: 1, hot: 'Saia da frente 323万', color: '#4F46E5' },
                        { app: 'MokaTV', count: 1, hot: 'Mafia Boss 6332万', color: '#7C3AED' },
                      ].map((a, i) => (
                        <Col key={i} span={24}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}>
                            <Text style={{ color: '#E2E8F0', fontSize: 11, width: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.app}</Text>
                            <Tag color={i < 3 ? 'magenta' : 'default'} style={{ fontSize: 9, margin: 0 }}>{a.count}部</Tag>
                            <Progress percent={Math.round(a.count / 5 * 100)} showInfo={false} strokeColor={a.color} trailColor="#1E293B" size="small" style={{ width: 50, margin: 0 }} />
                            <Text style={{ color: '#94A3B8', fontSize: 9, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>热值: {a.hot}</Text>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card style={cardStyle} bodyStyle={{ padding: 10 }}
                    title={<span style={{ color: '#E2E8F0', fontSize: 12 }}>🥇 黄金3秒台词洞察</span>}>
                    <div style={{ marginBottom: 8, padding: '6px 8px', background: '#0F172A', borderRadius: 6, border: '1px solid #1E293B' }}>
                      <Text style={{ color: '#F59E0B', fontSize: 11, fontWeight: 600 }}>核心发现</Text>
                      <Text style={{ color: '#CBD5E1', fontSize: 10, display: 'block', marginTop: 2 }}>
                        葡萄牙语台词占据TOP6，巴西市场短剧投放竞争白热化。"plateia"(观众)和"o que"(什么)为最高频hook词。
                      </Text>
                    </div>
                    <Row gutter={[8, 4]}>
                      {[
                        { line: 'plateia, sim.', materials: 1184, lang: '葡语', insight: '最高频，单一产品' },
                        { line: 'o que, é isso.', materials: 437, lang: '葡语', insight: '疑问hook' },
                        { line: 'o que, é, que é.', materials: 343, lang: '葡语', insight: '重复强调' },
                        { line: 'plateia, oh.', materials: 278, lang: '葡语', insight: '感叹hook' },
                        { line: 'You have an extremely sharp brain...', materials: 242, lang: '英语', insight: '益智互动' },
                        { line: 'Can you tell me? No...', materials: 198, lang: '英语', insight: '对话挑战' },
                      ].map((g, i) => (
                        <Col key={i} span={24}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}>
                            <Tag color={i < 4 ? 'gold' : 'default'} style={{ fontSize: 9, margin: 0, maxWidth: 24, textAlign: 'center' }}>{i + 1}</Tag>
                            <Text style={{ color: '#E2E8F0', fontSize: 10, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.line}</Text>
                            <Tag color="orange" style={{ fontSize: 8, margin: 0 }}>{g.lang}</Tag>
                            <Text style={{ color: '#F59E0B', fontSize: 10, minWidth: 32, textAlign: 'right' }}>{g.materials}</Text>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </Card>
                </Col>
              </Row>

              {/* Row 8: Countries + Publishing Days + Genre by Region */}
              <Row gutter={6}>
                <Col span={8}>
                  <Card style={cardStyle} bodyStyle={{ padding: 10 }}
                    title={<span style={{ color: '#E2E8F0', fontSize: 12 }}>🌍 海外投放地区</span>}>
                    {overviewSummary.topCountries.slice(0, 8).map((c, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}>
                        <Text style={{ color: '#E2E8F0', fontSize: 11, flex: 1 }}>{c.name}</Text>
                        <Progress percent={overviewSummary.topCountries[0] ? Math.round(c.count / overviewSummary.topCountries[0].count * 100) : 0}
                          showInfo={false} strokeColor="#EC4899" trailColor="#1E293B" size="small" style={{ width: 60, margin: 0 }} />
                        <Text style={{ color: '#EC4899', fontSize: 10, minWidth: 24, textAlign: 'right' }}>{c.count}</Text>
                      </div>
                    ))}
                  </Card>
                </Col>
                <Col span={8}>
                  <Card style={cardStyle} bodyStyle={{ padding: 10 }}
                    title={<span style={{ color: '#E2E8F0', fontSize: 12 }}>⏱ 投放天数分布</span>}>
                    {overviewSummary.publishingDays.map((d, i) => {
                      const maxCount = Math.max(...overviewSummary.publishingDays.map(x => x.count), 1);
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}>
                          <Text style={{ color: '#E2E8F0', fontSize: 11, minWidth: 48 }}>{d.range}</Text>
                          <Progress percent={Math.round(d.count / maxCount * 100)}
                            showInfo={false} strokeColor="#06B6D4" trailColor="#1E293B" size="small" style={{ flex: 1, margin: 0 }} />
                          <Text style={{ color: '#06B6D4', fontSize: 10, minWidth: 24, textAlign: 'right' }}>{d.count}</Text>
                        </div>
                      );
                    })}
                  </Card>
                </Col>
                <Col span={8}>
                  <Card style={cardStyle} bodyStyle={{ padding: 10 }}
                    title={<span style={{ color: '#E2E8F0', fontSize: 12 }}>🔄 题材国内vs海外</span>}>
                    {overviewSummary.genreByRegion.slice(0, 6).map((g, i) => {
                      const maxVal = Math.max(g.domestic, g.overseas, 1);
                      return (
                        <div key={i} style={{ padding: '2px 0' }}>
                          <Text style={{ color: '#E2E8F0', fontSize: 11, display: 'block', marginBottom: 2 }}>{g.genre}</Text>
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <Text style={{ color: '#3B82F6', fontSize: 9, width: 20 }}>国</Text>
                            <Progress percent={Math.round(g.domestic / maxVal * 100)} showInfo={false} strokeColor="#3B82F6" trailColor="#1E293B" size="small" style={{ flex: 1, margin: 0 }} />
                            <Text style={{ color: '#3B82F6', fontSize: 10, minWidth: 20, textAlign: 'right' }}>{g.domestic}</Text>
                          </div>
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <Text style={{ color: '#EC4899', fontSize: 9, width: 20 }}>海</Text>
                            <Progress percent={Math.round(g.overseas / maxVal * 100)} showInfo={false} strokeColor="#EC4899" trailColor="#1E293B" size="small" style={{ flex: 1, margin: 0 }} />
                            <Text style={{ color: '#EC4899', fontSize: 10, minWidth: 20, textAlign: 'right' }}>{g.overseas}</Text>
                          </div>
                        </div>
                      );
                    })}
                  </Card>
                </Col>
              </Row>

              {/* Row 8: Overseas HQ Distribution + Domestic New Media */}
              <Row gutter={6}>
                <Col span={12}>
                  <Card style={cardStyle} bodyStyle={{ padding: 10 }}
                    title={<span style={{ color: '#E2E8F0', fontSize: 12 }}>🌏 海外买量公司总部分布</span>}>
                    <Row gutter={[8, 4]}>
                      {[
                        { region: '新加坡', count: 6, company: 'Oakever Games', color: '#10B981' },
                        { region: '土耳其', count: 2, company: 'Dream / Good Job', color: '#F59E0B' },
                        { region: '中国香港', count: 2, company: 'Vita Studio 等', color: '#3B82F6' },
                        { region: '中国内地', count: 1, company: 'Orange Game', color: '#EF4444' },
                        { region: '其他/未知', count: 9, company: '-', color: '#64748B' },
                      ].map((h, i) => (
                        <Col key={i} span={24}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: h.color, flexShrink: 0 }} />
                            <Text style={{ color: '#E2E8F0', fontSize: 11, width: 56 }}>{h.region}</Text>
                            <Progress percent={Math.round(h.count / 20 * 100)} showInfo={false} strokeColor={h.color} trailColor="#1E293B" size="small" style={{ flex: 1, margin: 0 }} />
                            <Text style={{ color: h.color, fontSize: 10, minWidth: 36, textAlign: 'right' }}>{h.count}款</Text>
                            <Text style={{ color: '#64748B', fontSize: 9, width: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.company}</Text>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card style={cardStyle} bodyStyle={{ padding: 10 }}
                    title={<span style={{ color: '#E2E8F0', fontSize: 12 }}>📦 出海公司投放矩阵</span>}>
                    <Row gutter={[8, 4]}>
                      {[
                        { company: 'Orange Game', games: 4, markets: '沙特/西班牙/美国/墨西哥', topMedia: 'FacebookAudience' },
                        { company: 'Century Games', games: 3, markets: '美国/日本/韩国/沙特', topMedia: 'AppLovin' },
                        { company: 'Level Infinite', games: 2, markets: '印尼/菲律宾/美国', topMedia: 'Instagram' },
                        { company: 'Microfun Limited', games: 2, markets: '美国/日本/法国', topMedia: 'AppLovin' },
                        { company: 'LTGAMES GLOBAL', games: 2, markets: '美国/德国/法国', topMedia: 'Instagram' },
                        { company: 'IGG.COM', games: 1, markets: '美国/新加坡/日本', topMedia: 'Facebook' },
                        { company: 'Hungry Studio', games: 1, markets: '美国/印尼/菲律宾', topMedia: 'AppLovin' },
                        { company: 'Phantix Games', games: 1, markets: '美国/新加坡', topMedia: 'Instagram' },
                      ].map((c, i) => (
                        <Col key={i} span={24}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0', borderBottom: i < 7 ? '1px solid #1E293B' : 'none' }}>
                            <Text style={{ color: '#E2E8F0', fontSize: 11, width: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.company}</Text>
                            <Tag color="blue" style={{ fontSize: 9, margin: 0 }}>{c.games}款</Tag>
                            <Text style={{ color: '#94A3B8', fontSize: 9, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.markets}</Text>
                            <Tag color="default" style={{ fontSize: 9, margin: 0 }}>{c.topMedia}</Tag>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </Card>
                </Col>
              </Row>

              {/* Declining games */}
              {overviewSummary.decliningGames.length > 0 && (
                <Card style={cardStyle} bodyStyle={{ padding: 10 }}
                  title={<span style={{ color: '#E2E8F0', fontSize: 12 }}>📉 排名下降</span>}>
                  <Row gutter={[12, 4]}>
                    {overviewSummary.decliningGames.slice(0, 8).map((g, i) => (
                      <Col key={i} span={6}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Text style={{ color: '#E2E8F0', fontSize: 11, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</Text>
                          <Tag color="red" style={{ fontSize: 9, margin: 0 }}>{g.change}</Tag>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </Card>
              )}
            </div>
          ) : (
            <Card style={{ ...cardStyle, flex: 1 }} bodyStyle={{ textAlign: 'center', padding: 60 }}>
              <BarChartOutlined style={{ fontSize: 40, color: '#334155', marginBottom: 12 }} />
              <Text style={{ color: '#64748B', display: 'block' }}>暂无数据概览</Text>
              <Text style={{ color: '#475569', fontSize: 11, display: 'block', marginTop: 4 }}>
                请先通过智能下载或导入Excel获取数据
              </Text>
            </Card>
          )
        ) : (
          /* Category data table */
          <Card style={{ ...cardStyle, flex: 1, overflow: 'hidden' }}
            title={
              <Space>
                <DatabaseOutlined style={{ color: '#3B82F6' }} />
                <span style={{ color: '#E2E8F0' }}>{activeCat?.name ?? '数据'}</span>
                {dataRecords.length > 0 && <Tag color="blue">{dataRecords.length} 条</Tag>}
              </Space>
            }
            extra={
              <Space>
                <Upload showUploadList={false} beforeUpload={(file) => { handleUpload(file); return false; }}
                  accept=".xlsx,.xls,.csv">
                  <Button icon={<UploadOutlined />} size="small"
                    style={{ borderColor: '#334155', color: '#94A3B8' }}>
                    导入Excel
                  </Button>
                </Upload>
                <Button icon={<ReloadOutlined />} size="small" loading={dataLoading}
                  onClick={() => loadCategoryData(crawlDir)}
                  style={{ borderColor: '#334155', color: '#94A3B8' }}>
                  刷新
                </Button>
              </Space>
            }
            bodyStyle={{ padding: 0, height: 'calc(100% - 57px)', overflow: 'auto' }}
          >
            {dataLoading ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <Spin size="large" />
                <Text style={{ color: '#94A3B8', display: 'block', marginTop: 12 }}>加载数据中...</Text>
              </div>
            ) : dataRecords.length > 0 ? (
              <Table
                dataSource={dataRecords}
                columns={tableColumns}
                rowKey={(_, i) => String(i)}
                size="small"
                pagination={{ pageSize: 50, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
                scroll={{ x: tableColumns.reduce((s, c) => s + (c.width ?? 120), 0) }}
                style={{ fontSize: 12 }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <FileExcelOutlined style={{ fontSize: 40, color: '#334155', marginBottom: 12 }} />
                <Text style={{ color: '#64748B', display: 'block' }}>暂无数据</Text>
                <Text style={{ color: '#475569', fontSize: 11, display: 'block', marginTop: 4 }}>
                  点击左侧分类加载数据，或点击"导入Excel"上传文件
                </Text>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Credential modal */}
      <Modal title="保存账号密码" open={credModalOpen} onOk={handleSaveCredentials}
        onCancel={() => setCredModalOpen(false)} okText="保存" cancelText="取消">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Text style={{ color: '#666', fontSize: 12 }}>保存后下次打开此网站可自动填充登录</Text>
          <Input placeholder="账号" value={credUsername} onChange={(e) => setCredUsername(e.target.value)} />
          <Input.Password placeholder="密码" value={credPassword} onChange={(e) => setCredPassword(e.target.value)} />
        </div>
      </Modal>

      {/* Bookmark modal */}
      <Modal title="添加书签" open={bmModalOpen} onOk={handleAddBookmark}
        onCancel={() => setBmModalOpen(false)} okText="添加" cancelText="取消">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input placeholder="书签名称" value={bmName} onChange={(e) => setBmName(e.target.value)} />
          <Input placeholder="网址" value={siteUrl} disabled />
        </div>
      </Modal>
    </div>
  );
}
