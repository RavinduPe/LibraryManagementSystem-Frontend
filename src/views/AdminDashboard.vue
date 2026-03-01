<template>
  <div class="admin-dashboard">
    <Navbar />
    
    <div class="dashboard-container">
      <div class="dashboard-header">
        <h1>
          <span class="header-icon">⚡</span>
          Admin Dashboard
        </h1>
        <div class="header-stats">
          <div class="stat-item">
            <span class="stat-label">Total Users</span>
            <span class="stat-value">{{ stats.totalUsers }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Total Books</span>
            <span class="stat-value">{{ stats.totalBooks }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Total Authors</span>
            <span class="stat-value">{{ stats.totalAuthors }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Active Borrows</span>
            <span class="stat-value">{{ stats.activeBorrows }}</span>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card" @click="navigateTo('users')">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.totalUsers }}</span>
            <span class="stat-label">Total Users</span>
          </div>
          <div class="stat-trend" :class="getTrendColor(stats.userTrend)">
            {{ stats.userTrend > 0 ? '+' : '' }}{{ stats.userTrend }}%
          </div>
        </div>

        <div class="stat-card" @click="navigateTo('books')">
          <div class="stat-icon">📚</div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.totalBooks }}</span>
            <span class="stat-label">Total Books</span>
          </div>
          <div class="stat-trend" :class="getTrendColor(stats.bookTrend)">
            {{ stats.bookTrend > 0 ? '+' : '' }}{{ stats.bookTrend }}%
          </div>
        </div>

        <div class="stat-card" @click="navigateTo('authors')">
          <div class="stat-icon">✍️</div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.totalAuthors }}</span>
            <span class="stat-label">Total Authors</span>
          </div>
          <div class="stat-trend" :class="getTrendColor(stats.authorTrend)">
            {{ stats.authorTrend > 0 ? '+' : '' }}{{ stats.authorTrend }}%
          </div>
        </div>

        <div class="stat-card" @click="navigateTo('borrows')">
          <div class="stat-icon">📋</div>
          <div class="stat-content">
            <span class="stat-value">{{ stats.activeBorrows }}</span>
            <span class="stat-label">Active Borrows</span>
          </div>
          <div class="stat-trend" :class="getTrendColor(stats.borrowTrend)">
            {{ stats.borrowTrend > 0 ? '+' : '' }}{{ stats.borrowTrend }}%
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <h2>Quick Actions</h2>
        <div class="action-grid">
          <button class="action-btn" @click="openCreateUser">
            <span>➕</span> Add User
          </button>
          <button class="action-btn" @click="openCreateBook">
            <span>➕</span> Add Book
          </button>
          <button class="action-btn" @click="openCreateAuthor">
            <span>➕</span> Add Author
          </button>
          <button class="action-btn" @click="openManageBorrows">
            <span>📋</span> Manage Borrows
          </button>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="recent-activity">
        <h2>Recent Activity</h2>
        
        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
        </div>

        <!-- Activity List -->
        <div v-else class="activity-list">
          <div v-for="activity in recentActivities" :key="activity.id" class="activity-item">
            <div class="activity-icon" :class="activity.type">
              {{ getActivityIcon(activity.type) }}
            </div>
            <div class="activity-details">
              <p class="activity-text">
                <span class="activity-user">{{ activity.user }}</span>
                {{ activity.action }}
                <span class="activity-target">{{ activity.target }}</span>
              </p>
              <span class="activity-time">{{ formatTime(activity.timestamp) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-section">
        <div class="chart-card">
          <h3>User Growth</h3>
          <div class="chart-placeholder">
            <div class="bar-chart">
              <div v-for="(value, index) in userGrowthData" :key="index" 
                   class="bar" :style="{ height: value + '%' }">
                <span class="bar-label">{{ value }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="chart-card">
          <h3>Book Categories</h3>
          <div class="chart-placeholder">
            <div class="pie-chart">
              <div v-for="(category, index) in bookCategories" :key="index" 
                   class="pie-segment" :style="getPieStyle(index, category.percentage)">
                <span class="pie-label">{{ category.name }} ({{ category.count }})</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Navbar from '@/components/Navbar.vue';
import { adminAPI } from '@/api/endpoints';
import { borrowService } from '@/services/borrowService';
import type { User, Book, Author, Borrow } from '@/types/models';

const router = useRouter();
const loading = ref(false);

// Stats
const stats = ref({
  totalUsers: 0,
  totalBooks: 0,
  totalAuthors: 0,
  activeBorrows: 0,
  userTrend: 12,
  bookTrend: 8,
  authorTrend: 5,
  borrowTrend: -3
});

// Recent Activities
const recentActivities = ref<any[]>([]);

// Chart Data
const userGrowthData = ref([45, 52, 48, 65, 58, 72, 68, 85, 78, 92]);
const bookCategories = ref([
  { name: 'Fiction', count: 45, percentage: 45 },
  { name: 'Non-Fiction', count: 30, percentage: 30 },
  { name: 'Science', count: 15, percentage: 15 },
  { name: 'Other', count: 10, percentage: 10 }
]);

onMounted(async () => {
  await fetchDashboardData();
  generateRecentActivities();
});

const fetchDashboardData = async () => {
  loading.value = true;
  try {
    const [usersRes, booksRes, authorsRes, borrowsRes] = await Promise.all([
      adminAPI.getUsers(),
      adminAPI.getBooks(),
      adminAPI.getAuthors(),
      borrowService.getAllBorrows()
    ]);

    stats.value.totalUsers = usersRes.data.length;
    stats.value.totalBooks = booksRes.data.length;
    stats.value.totalAuthors = authorsRes.data.length;
    stats.value.activeBorrows = borrowsRes.filter(b => b.status === 'ACTIVE').length;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    // Mock data for demo
    stats.value = {
      totalUsers: 156,
      totalBooks: 234,
      totalAuthors: 67,
      activeBorrows: 42,
      userTrend: 12,
      bookTrend: 8,
      authorTrend: 5,
      borrowTrend: -3
    };
  } finally {
    loading.value = false;
  }
};

const generateRecentActivities = () => {
  recentActivities.value = [
    {
      id: 1,
      type: 'user',
      user: 'John Doe',
      action: 'registered',
      target: 'as new user',
      timestamp: new Date(Date.now() - 5 * 60000)
    },
    {
      id: 2,
      type: 'book',
      user: 'Admin',
      action: 'added',
      target: '"The Great Gatsby"',
      timestamp: new Date(Date.now() - 30 * 60000)
    },
    {
      id: 3,
      type: 'borrow',
      user: 'Jane Smith',
      action: 'borrowed',
      target: '"1984"',
      timestamp: new Date(Date.now() - 2 * 3600000)
    },
    {
      id: 4,
      type: 'return',
      user: 'Bob Wilson',
      action: 'returned',
      target: '"Pride and Prejudice"',
      timestamp: new Date(Date.now() - 5 * 3600000)
    },
    {
      id: 5,
      type: 'author',
      user: 'Admin',
      action: 'updated',
      target: 'George Orwell',
      timestamp: new Date(Date.now() - 1 * 86400000)
    }
  ];
};

const navigateTo = (section: string) => {
  router.push(`/admin/${section}`);
};

const openCreateUser = () => {
  router.push('/admin/users?action=create');
};

const openCreateBook = () => {
  router.push('/admin/books?action=create');
};

const openCreateAuthor = () => {
  router.push('/admin/authors?action=create');
};

const openManageBorrows = () => {
  router.push('/admin/borrows');
};

const getTrendColor = (trend: number) => {
  return trend >= 0 ? 'positive' : 'negative';
};

const getActivityIcon = (type: string) => {
  const icons: Record<string, string> = {
    user: '👤',
    book: '📚',
    author: '✍️',
    borrow: '📖',
    return: '↩️'
  };
  return icons[type] || '📌';
};

const formatTime = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

const getPieStyle = (index: number, percentage: number) => {
  const colors = ['#667eea', '#764ba2', '#f39c12', '#e74c3c'];
  const rotation = index * (360 / bookCategories.value.length);
  return {
    backgroundColor: colors[index % colors.length],
    transform: `rotate(${rotation}deg) skew(${90 - percentage * 3.6}deg)`
  };
};
</script>

<style scoped>
.admin-dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.dashboard-header {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.dashboard-header h1 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #333;
  margin: 0;
}

.header-icon {
  font-size: 2rem;
}

.header-stats {
  display: flex;
  gap: 2rem;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  color: #666;
  font-size: 0.8rem;
}

.stat-value {
  display: block;
  color: #667eea;
  font-size: 1.5rem;
  font-weight: bold;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea, #764ba2);
}

.stat-icon {
  font-size: 2.5rem;
}

.stat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #333;
  line-height: 1;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}

.stat-trend {
  font-size: 0.9rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
}

.stat-trend.positive {
  background: #d4edda;
  color: #155724;
}

.stat-trend.negative {
  background: #f8d7da;
  color: #721c24;
}

.quick-actions {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.quick-actions h2 {
  color: #333;
  margin-bottom: 1rem;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(102, 126, 234, 0.3);
}

.recent-activity {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.recent-activity h2 {
  color: #333;
  margin-bottom: 1rem;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.activity-item:hover {
  background: #f0f0f0;
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.activity-icon.user { background: #d4edda; }
.activity-icon.book { background: #cce5ff; }
.activity-icon.author { background: #fff3cd; }
.activity-icon.borrow { background: #d1ecf1; }
.activity-icon.return { background: #e2d1f1; }

.activity-details {
  flex: 1;
}

.activity-text {
  color: #333;
  margin-bottom: 0.25rem;
}

.activity-user {
  font-weight: 600;
  color: #667eea;
}

.activity-target {
  font-weight: 600;
  color: #764ba2;
}

.activity-time {
  color: #999;
  font-size: 0.8rem;
}

.charts-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.chart-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.chart-card h3 {
  color: #333;
  margin-bottom: 1rem;
}

.chart-placeholder {
  height: 200px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.bar-chart {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  height: 150px;
  width: 100%;
}

.bar {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px 4px 0 0;
  position: relative;
  min-height: 20px;
  transition: height 0.3s ease;
}

.bar-label {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.75rem;
  color: #666;
}

.pie-chart {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  position: relative;
  overflow: hidden;
}

.pie-segment {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  transform-origin: 50% 50%;
}

.pie-label {
  position: absolute;
  font-size: 0.7rem;
  color: white;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.loading-state {
  text-align: center;
  padding: 2rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f0f0f0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 1rem;
  }

  .dashboard-header {
    flex-direction: column;
    text-align: center;
  }

  .header-stats {
    width: 100%;
    justify-content: space-around;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .action-grid {
    grid-template-columns: 1fr 1fr;
  }

  .charts-section {
    grid-template-columns: 1fr;
  }
}
</style>