<template>
  <div class="dashboard-container">
    <!-- 顶部导航 -->
    <el-header class="header">
      <div class="header-left">
        <h1>游戏买量系统 · 多Agent工厂</h1>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </el-header>

    <!-- 主要内容区 -->
    <el-main class="main-content">
      <!-- 系统状态卡片 -->
      <el-row :gutter="20" class="status-row">
        <el-col :span="6">
          <el-card shadow="hover" class="status-card">
            <div class="status-icon data-icon">
              <el-icon size="40"><DataAnalysis /></el-icon>
            </div>
            <div class="status-info">
              <h3>DATA 数据诊断</h3>
              <p class="status-text">数据管道正常运行</p>
              <el-tag type="success">活跃</el-tag>
            </div>
          </el-card>
        </el-col>

        <el-col :span="6">
          <el-card shadow="hover" class="status-card">
            <div class="status-icon creative-icon">
              <el-icon size="40"><Picture /></el-icon>
            </div>
            <div class="status-info">
              <h3>CREATIVE 创意洞察</h3>
              <p class="status-text">素材分析中</p>
              <el-tag type="warning">处理中</el-tag>
            </div>
          </el-card>
        </el-col>

        <el-col :span="6">
          <el-card shadow="hover" class="status-card">
            <div class="status-icon execution-icon">
              <el-icon size="40"><Operation /></el-icon>
            </div>
            <div class="status-info">
              <h3>EXECUTION 执行闭环</h3>
              <p class="status-text">Agent 待命中</p>
              <el-tag type="info">待命</el-tag>
            </div>
          </el-card>
        </el-col>

        <el-col :span="6">
          <el-card shadow="hover" class="status-card">
            <div class="status-icon safety-icon">
              <el-icon size="40"><Shield /></el-icon>
            </div>
            <div class="status-info">
              <h3>SAFETY 安全防护</h3>
              <p class="status-text">安全检查正常</p>
              <el-tag type="success">正常</el-tag>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 核心指标 -->
      <el-row :gutter="20" class="metrics-row">
        <el-col :span="12">
          <el-card shadow="hover">
            <template #header>
              <div class="card-header">
                <span>广告投放概览</span>
                <el-button text>查看详情</el-button>
              </div>
            </template>
            <div class="metrics-grid">
              <div class="metric-item">
                <div class="metric-value">{{ metrics.totalCampaigns }}</div>
                <div class="metric-label">活跃广告系列</div>
              </div>
              <div class="metric-item">
                <div class="metric-value">{{ metrics.totalSpend }}</div>
                <div class="metric-label">今日花费 ($)</div>
              </div>
              <div class="metric-item">
                <div class="metric-value">{{ metrics.totalInstalls }}</div>
                <div class="metric-label">今日安装</div>
              </div>
              <div class="metric-item">
                <div class="metric-value">{{ metrics.avgROAS }}</div>
                <div class="metric-label">平均 ROAS</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card shadow="hover">
            <template #header>
              <div class="card-header">
                <span>异常告警</span>
                <el-badge :value="alerts.length" class="badge">
                  <el-button text>查看全部</el-button>
                </el-badge>
              </div>
            </template>
            <div class="alerts-list" v-if="alerts.length > 0">
              <div v-for="alert in alerts" :key="alert.id" class="alert-item">
                <el-tag :type="alert.severity === 'critical' ? 'danger' : 'warning'" size="small">
                  {{ alert.severity === 'critical' ? '严重' : '警告' }}
                </el-tag>
                <span class="alert-message">{{ alert.message }}</span>
              </div>
            </div>
            <div v-else class="no-alerts">
              <el-empty description="暂无告警" :image-size="60"></el-empty>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- Agent 决策日志 -->
      <el-row :gutter="20" class="logs-row">
        <el-col :span="24">
          <el-card shadow="hover">
            <template #header>
              <div class="card-header">
                <span>Agent 决策日志</span>
                <el-button text @click="viewAllLogs">查看全部</el-button>
              </div>
            </template>
            <el-table :data="agentLogs" style="width: 100%">
              <el-table-column prop="timestamp" label="时间" width="180"></el-table-column>
              <el-table-column prop="agent" label="Agent" width="150"></el-table-column>
              <el-table-column prop="action" label="操作"></el-table-column>
              <el-table-column prop="result" label="结果" width="100">
                <template #default="scope">
                  <el-tag :type="scope.row.result === '成功' ? 'success' : 'danger'" size="small">
                    {{ scope.row.result }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>

      <!-- 快速操作 -->
      <el-row :gutter="20" class="actions-row">
        <el-col :span="24">
          <el-card shadow="hover">
            <template #header>
              <div class="card-header">
                <span>快速操作</span>
              </div>
            </template>
            <div class="quick-actions">
              <el-button type="primary" @click="runDataPipeline">
                <el-icon><DataLine /></el-icon>
                运行数据管道
              </el-button>
              <el-button type="success" @click="analyzeCreatives">
                <el-icon><Picture /></el-icon>
                分析素材
              </el-button>
              <el-button type="warning" @click="runAgentOptimization">
                <el-icon><Operation /></el-icon>
                执行优化
              </el-button>
              <el-button type="info" @click="generateReport">
                <el-icon><Document /></el-icon>
                生成报告
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Refresh,
  DataAnalysis,
  Picture,
  Operation,
  Shield,
  DataLine,
  Document
} from '@element-plus/icons-vue'

// 模拟数据
const metrics = ref({
  totalCampaigns: 12,
  totalSpend: '3,456',
  totalInstalls: '1,234',
  avgROAS: '1.25'
})

const alerts = ref([
  { id: 1, severity: 'warning', message: '广告组 A 的 CPI 超过阈值 20%' },
  { id: 2, severity: 'critical', message: 'Campaign B 预算即将耗尽' }
])

const agentLogs = ref([
  { timestamp: '2026-05-18 10:30:25', agent: 'DATA Agent', action: '检测到异常花费', result: '成功' },
  { timestamp: '2026-05-18 10:28:15', agent: 'CREATIVE Agent', action: '分析新素材标签', result: '成功' },
  { timestamp: '2026-05-18 10:25:10', agent: 'EXECUTION Agent', action: '暂停低效广告', result: '成功' },
  { timestamp: '2026-05-18 10:22:05', agent: 'SAFETY Agent', action: '预算安全检查', result: '成功' },
  { timestamp: '2026-05-18 10:20:00', agent: 'MEMORY Agent', action: '存储投放案例', result: '成功' }
])

// 方法
const refreshData = () => {
  ElMessage.success('数据已刷新')
}

const viewAllLogs = () => {
  ElMessage.info('查看全部日志')
}

const runDataPipeline = () => {
  ElMessage.success('数据管道已启动')
}

const analyzeCreatives = () => {
  ElMessage.success('素材分析已开始')
}

const runAgentOptimization = () => {
  ElMessage.success('Agent 优化已执行')
}

const generateReport = () => {
  ElMessage.success('报告生成中...')
}

onMounted(() => {
  console.log('游戏买量系统已加载')
})
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.main-content {
  padding: 20px;
}

.status-row {
  margin-bottom: 20px;
}

.status-card {
  height: 120px;
  display: flex;
  align-items: center;
  transition: all 0.3s;
}

.status-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.status-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  color: white;
}

.data-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.creative-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.execution-icon {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.safety-icon {
  background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);
}

.status-info h3 {
  margin: 0 0 5px 0;
  font-size: 14px;
  color: #303133;
}

.status-text {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #909399;
}

.metrics-row {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.metric-item {
  text-align: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.metric-value {
  font-size: 28px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 5px;
}

.metric-label {
  font-size: 12px;
  color: #909399;
}

.alerts-list {
  max-height: 200px;
  overflow-y: auto;
}

.alert-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #ebeef5;
}

.alert-item:last-child {
  border-bottom: none;
}

.alert-message {
  margin-left: 10px;
  font-size: 14px;
  color: #606266;
}

.no-alerts {
  text-align: center;
  padding: 20px;
}

.logs-row {
  margin-bottom: 20px;
}

.actions-row {
  margin-bottom: 20px;
}

.quick-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.quick-actions .el-button {
  flex: 1;
  min-width: 150px;
}
</style>
