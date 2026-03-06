<template>
  <div class="admin-borrows">
    <Navbar />
    
    <div class="borrows-container">
      <div class="page-header">
        <div class="header-left">
          <h1>
            <span class="header-icon">📋</span>
            Borrow Management
          </h1>
          <p class="subtitle">Track and manage all book borrowings</p>
        </div>
        <div class="header-actions">
          <button class="refresh-btn" @click="fetchBorrows" :disabled="loading">
            <span :class="{ spinning: loading }">🔄</span>
            Refresh
          </button>
          <button class="export-btn" @click="exportBorrows" :disabled="loading">
            <span>📊</span>
            Export
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-cards">
        <div class="stat-card" @click="filterByStatus('all')">
          <span class="stat-value">{{ borrows.length }}</span>
          <span class="stat-label">Total Borrows</span>
        </div>
        <div class="stat-card" @click="filterByStatus('ACTIVE')">
          <span class="stat-value">{{ activeCount }}</span>
          <span class="stat-label">Active</span>
          <span class="stat-trend">{{ ((activeCount / borrows.length) * 100).toFixed(1) }}%</span>
        </div>
        <div class="stat-card" @click="filterByStatus('RETURNED')">
          <span class="stat-value">{{ returnedCount }}</span>
          <span class="stat-label">Returned</span>
          <span class="stat-trend">{{ ((returnedCount / borrows.length) * 100).toFixed(1) }}%</span>
        </div>
        <div class="stat-card overdue" @click="filterByStatus('OVERDUE')">
          <span class="stat-value">{{ overdueCount }}</span>
          <span class="stat-label">Overdue</span>
          <span class="stat-trend">{{ ((overdueCount / borrows.length) * 100).toFixed(1) }}%</span>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by book title, user, or ID..."
            @input="filterBorrows"
          />
        </div>
        
        <div class="filter-group">
          <select v-model="statusFilter" class="filter-select" @change="filterBorrows">
            <option value="all">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="RETURNED">Returned</option>
            <option value="OVERDUE">Overdue</option>
          </select>

          <select v-model="dateFilter" class="filter-select" @change="filterBorrows">
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          <select v-model="sortBy" class="filter-select" @change="filterBorrows">
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest First</option>
            <option value="due">Due Date</option>
          </select>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading borrows...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <span class="error-icon">⚠️</span>
        <h3>Failed to Load Borrows</h3>
        <p>{{ error }}</p>
        <button @click="fetchBorrows" class="primary-btn">
          <span>🔄</span> Try Again
        </button>
      </div>

      <!-- Borrows Table -->
      <div v-else-if="filteredBorrows.length > 0" class="table-container">
        <table class="modern-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Book</th>
              <th>User</th>
              <!-- <th>Availabale Copies</th> -->
              <th>Borrow Date</th>
              <th>Due Date</th>
              <th>Return Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="borrow in paginatedBorrows" :key="borrow.id" class="table-row">
              <td class="id-cell">#{{ borrow.id }}</td>
              <td>
                <div class="book-info">
                  <span class="book-title">{{ borrow.bookTitle }}</span>
                  <span class="book-id">ID: {{ borrow.bookId }}</span>
                </div>
              </td>
              <td>
                <div class="user-info">
                  <span class="username">{{ borrow.username }}</span>
                  <span class="user-id">ID: {{ borrow.userId }}</span>
                </div>
              </td>
              <!-- <td>
                <div class="book-inventory">
                    <span class="inventory-badge"
                          :class="book.availableCopies > 0 ? 'available' : 'borrowed'">
                      {{ borrow.availableCopies }} / {{ borrow.totalCopies }} copies available
                    </span>
                  </div>
              </td> -->
              <td>{{ formatDate(borrow.borrowDate) }}</td>
              <td>{{ calculateDueDate(borrow.borrowDate) }}</td>
              <td>
                <span v-if="borrow.returnDate" class="returned-date">
                  {{ formatDate(borrow.returnDate) }}
                </span>
                <span v-else class="not-returned">—</span>
              </td>
              <td>
                <span class="status-badge" :class="borrow.status.toLowerCase()">
                  {{ borrow.status?.toUpperCase() }}
                </span>
              </td>
              <td class="actions-cell">
                <button
                  v-if="borrow.status === 'ACTIVE'"
                  @click="openReturnModal(borrow)"
                  class="action-btn return"
                  :disabled="returnLoading[borrow.id!]"
                >
                  <span v-if="returnLoading[borrow.id!]" class="spinner-small"></span>
                  <span v-else>↩️ Return</span>
                </button>
                <button
                  v-if="borrow.status === 'OVERDUE'"
                  @click="sendReminder(borrow)"
                  class="action-btn reminder"
                  :disabled="reminderLoading[borrow.id!]"
                >
                  <span v-if="reminderLoading[borrow.id!]" class="spinner-small"></span>
                  <span v-else>🔔 Remind</span>
                </button>
                <button
                  @click="viewBorrowDetails(borrow)"
                  class="action-btn view"
                  title="View Details"
                >
                  👁️
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div class="pagination">
          <button 
            :disabled="currentPage === 1" 
            @click="currentPage--"
            class="page-btn"
          >
            ← Previous
          </button>
          <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
          <button 
            :disabled="currentPage === totalPages" 
            @click="currentPage++"
            class="page-btn"
          >
            Next →
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <span class="empty-icon">📋</span>
        <h3>No Borrows Found</h3>
        <p v-if="searchQuery || statusFilter !== 'all' || dateFilter !== 'all'">
          No borrows match your filters.
          <button @click="clearFilters" class="link-btn">Clear filters</button>
        </p>
        <p v-else>
          No borrow records available.
        </p>
      </div>
    </div>

    <!-- Return Book Modal -->
    <div v-if="showReturnModal" class="modal-overlay" @click.self="closeReturnModal">
      <div class="modal-container small">
        <div class="modal-header">
          <h3>📖 Return Book</h3>
          <button class="close-btn" @click="closeReturnModal">✕</button>
        </div>
        
        <div class="modal-body">
          <p>Confirm return for:</p>
          <div class="return-details">
            <p><strong>Book:</strong> {{ selectedBorrow?.bookTitle }}</p>
            <p><strong>User:</strong> {{ selectedBorrow?.username }}</p>
            <p><strong>Borrowed:</strong> {{ formatDate(selectedBorrow?.borrowDate) }}</p>
            <p><strong>Due:</strong> {{ calculateDueDate(selectedBorrow?.borrowDate) }}</p>
          </div>

          <div class="form-group">
            <label>Condition (Optional)</label>
            <select v-model="returnCondition" class="modern-select">
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="damaged">Damaged</option>
            </select>
          </div>

          <div class="form-group">
            <label>Notes (Optional)</label>
            <textarea
              v-model="returnNotes"
              rows="3"
              placeholder="Any notes about the return..."
              class="modern-textarea"
            ></textarea>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="closeReturnModal" class="secondary-btn" :disabled="processingReturn">
            Cancel
          </button>
          <button @click="confirmReturn" class="primary-btn" :disabled="processingReturn">
            <span v-if="processingReturn" class="spinner-small"></span>
            <span v-else>Confirm Return</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Borrow Details Modal -->
    <div v-if="showDetailsModal" class="modal-overlay" @click.self="closeDetailsModal">
      <div class="modal-container">
        <div class="modal-header">
          <h3>📋 Borrow Details</h3>
          <button class="close-btn" @click="closeDetailsModal">✕</button>
        </div>
        
        <div class="modal-body">
          <div v-if="selectedBorrow" class="details-grid">
            <div class="detail-item">
              <span class="detail-label">Borrow ID:</span>
              <span class="detail-value">#{{ selectedBorrow.id }}</span>
            </div>
            
            <div class="detail-item">
              <span class="detail-label">Book:</span>
              <span class="detail-value">{{ selectedBorrow.bookTitle }}</span>
            </div>
            
            <div class="detail-item">
              <span class="detail-label">Book ID:</span>
              <span class="detail-value">{{ selectedBorrow.bookId }}</span>
            </div>
            
            <div class="detail-item">
              <span class="detail-label">User:</span>
              <span class="detail-value">{{ selectedBorrow.username }}</span>
            </div>
            
            <div class="detail-item">
              <span class="detail-label">User ID:</span>
              <span class="detail-value">{{ selectedBorrow.userId }}</span>
            </div>
            
            <div class="detail-item">
              <span class="detail-label">Borrow Date:</span>
              <span class="detail-value">{{ formatDateTime(selectedBorrow.borrowDate) }}</span>
            </div>
            
            <div class="detail-item">
              <span class="detail-label">Due Date:</span>
              <span class="detail-value">{{ calculateDueDate(selectedBorrow.borrowDate) }}</span>
            </div>
            
            <div class="detail-item">
              <span class="detail-label">Return Date:</span>
              <span class="detail-value">
                {{ selectedBorrow.returnDate ? formatDateTime(selectedBorrow.returnDate) : 'Not returned' }}
              </span>
            </div>
            
            <div class="detail-item">
              <span class="detail-label">Status:</span>
              <span class="status-badge" :class="selectedBorrow.status.toLowerCase()">
                {{ selectedBorrow.status }}
              </span>
            </div>
            
            <div class="detail-item full-width" v-if="selectedBorrow.status === 'OVERDUE'">
              <span class="detail-label">Days Overdue:</span>
              <span class="detail-value overdue-text">
                {{ calculateOverdueDays(selectedBorrow.borrowDate) }} days
              </span>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button @click="closeDetailsModal" class="secondary-btn">Close</button>
          <button 
            v-if="selectedBorrow?.status === 'ACTIVE'"
            @click="openReturnModal(selectedBorrow)"
            class="primary-btn"
          >
            Return Book
          </button>
        </div>
      </div>
    </div>

    <!-- Success Toast -->
    <div v-if="showToast" class="toast" :class="toastType">
      {{ toastMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Navbar from '@/components/Navbar.vue';
import { borrowService } from '@/services/borrowService';
import { adminAPI } from '@/api/endpoints';
import type { Borrow } from '@/types/models';

// State
const borrows = ref<Borrow[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const searchQuery = ref('');
const statusFilter = ref('all');
const dateFilter = ref('all');
const sortBy = ref('recent');
const currentPage = ref(1);
const itemsPerPage = 15;

// Modal states
const showReturnModal = ref(false);
const showDetailsModal = ref(false);
const selectedBorrow = ref<Borrow | null>(null);
const returnCondition = ref('good');
const returnNotes = ref('');
const processingReturn = ref(false);

// Loading states
const returnLoading = ref<Record<number, boolean>>({});
const reminderLoading = ref<Record<number, boolean>>({});

// Toast
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');

// Computed
const activeCount = computed(() => borrows.value.filter(b => b.status === 'ACTIVE').length);
const returnedCount = computed(() => borrows.value.filter(b => b.status === 'RETURNED').length);
const overdueCount = computed(() => borrows.value.filter(b => b.status === 'OVERDUE').length);

const filteredBorrows = computed(() => {
  let filtered = [...borrows.value];

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(b => 
      b.bookTitle?.toLowerCase().includes(query) ||
      b.username?.toLowerCase().includes(query) ||
      b.id?.toString().includes(query)
    );
  }

  // Status filter
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(b => b.status === statusFilter.value);
  }

  // Date filter
  if (dateFilter.value !== 'all') {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    filtered = filtered.filter(b => {
      const borrowDate = new Date(b.borrowDate);
      
      switch (dateFilter.value) {
        case 'today':
          return borrowDate >= today;
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return borrowDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return borrowDate >= monthAgo;
        default:
          return true;
      }
    });
  }

  // Sort
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'recent':
        return new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime();
      case 'oldest':
        return new Date(a.borrowDate).getTime() - new Date(b.borrowDate).getTime();
      case 'due':
        const dueA = calculateDueDate(a.borrowDate);
        const dueB = calculateDueDate(b.borrowDate);
        return new Date(dueA).getTime() - new Date(dueB).getTime();
      default:
        return 0;
    }
  });

  return filtered;
});

const paginatedBorrows = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredBorrows.value.slice(start, end);
});

const totalPages = computed(() => Math.ceil(filteredBorrows.value.length / itemsPerPage));

onMounted(() => {
  fetchBorrows();
});

const fetchBorrows = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    borrows.value = await borrowService.getAllBorrows();
  } catch (err: any) {
    console.error('Error fetching borrows:', err);
    error.value = err.response?.data?.message || 'Failed to load borrows';
    
    // Mock data for demo
    borrows.value = [
      {
        id: 1,
        bookId: 1,
        bookTitle: 'The Great Gatsby',
        userId: 2,
        username: 'john_doe',
        borrowDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'ACTIVE'
      },
      {
        id: 2,
        bookId: 3,
        bookTitle: '1984',
        userId: 3,
        username: 'jane_smith',
        borrowDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        returnDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'RETURNED'
      },
      {
        id: 3,
        bookId: 2,
        bookTitle: 'To Kill a Mockingbird',
        userId: 4,
        username: 'bob_wilson',
        borrowDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'OVERDUE'
      },
      {
        id: 4,
        bookId: 4,
        bookTitle: 'Pride and Prejudice',
        userId: 5,
        username: 'alice_brown',
        borrowDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'ACTIVE'
      },
      {
        id: 5,
        bookId: 5,
        bookTitle: 'The Catcher in the Rye',
        userId: 6,
        username: 'charlie_davis',
        borrowDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'OVERDUE'
      }
    ] as Borrow[];
  } finally {
    loading.value = false;
  }
};

const filterBorrows = () => {
  currentPage.value = 1;
};

const clearFilters = () => {
  searchQuery.value = '';
  statusFilter.value = 'all';
  dateFilter.value = 'all';
  sortBy.value = 'recent';
};

const filterByStatus = (status: string) => {
  statusFilter.value = status;
  filterBorrows();
};

const calculateDueDate = (borrowDate?: string): string => {
  if (!borrowDate) return 'N/A';
  const date = new Date(borrowDate);
  date.setDate(date.getDate() + 14); // 14 days borrowing period
  return formatDate(date.toISOString());
};

const calculateOverdueDays = (borrowDate?: string): number => {
  if (!borrowDate) return 0;
  const dueDate = new Date(borrowDate);
  dueDate.setDate(dueDate.getDate() + 14);
  const today = new Date();
  const diffTime = today.getTime() - dueDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatDateTime = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Modal functions
const openReturnModal = (borrow: Borrow) => {
  selectedBorrow.value = borrow;
  returnCondition.value = 'good';
  returnNotes.value = '';
  showReturnModal.value = true;
};

const closeReturnModal = () => {
  showReturnModal.value = false;
  selectedBorrow.value = null;
};

const confirmReturn = async () => {
  if (!selectedBorrow.value?.id) return;
  
  processingReturn.value = true;
  returnLoading.value[selectedBorrow.value.id] = true;
  
  try {
    await borrowService.markAsReturned(selectedBorrow.value.id);
    await fetchBorrows();
    showSuccessToast('Book returned successfully');
    closeReturnModal();
  } catch (err: any) {
    showErrorToast(err.response?.data?.message || 'Failed to return book');
  } finally {
    processingReturn.value = false;
    returnLoading.value[selectedBorrow.value.id] = false;
  }
};

const viewBorrowDetails = (borrow: Borrow) => {
  selectedBorrow.value = borrow;
  showDetailsModal.value = true;
};

const closeDetailsModal = () => {
  showDetailsModal.value = false;
  selectedBorrow.value = null;
};

const sendReminder = async (borrow: Borrow) => {
  if (!borrow.id) return;
  
  reminderLoading.value[borrow.id] = true;
  
  try {
    // In a real app, call API to send reminder
    await new Promise(resolve => setTimeout(resolve, 1000));
    showSuccessToast(`Reminder sent to ${borrow.username}`);
  } catch (err: any) {
    showErrorToast('Failed to send reminder');
  } finally {
    reminderLoading.value[borrow.id] = false;
  }
};

const exportBorrows = () => {
  // Create CSV
  const headers = ['ID', 'Book', 'User', 'Borrow Date', 'Return Date', 'Status'];
  const data = borrows.value.map(b => [
    b.id,
    b.bookTitle,
    b.username,
    formatDate(b.borrowDate),
    b.returnDate ? formatDate(b.returnDate) : 'Not returned',
    b.status
  ]);
  
  const csv = [headers, ...data].map(row => row.join(',')).join('\n');
  
  // Download
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `borrows_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  
  showSuccessToast('Borrows exported successfully');
};

// Toast functions
const showSuccessToast = (message: string) => {
  toastMessage.value = message;
  toastType.value = 'success';
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 3000);
};

const showErrorToast = (message: string) => {
  toastMessage.value = message;
  toastType.value = 'error';
  showToast.value = true;
  setTimeout(() => {
    showToast.value = false;
  }, 3000);
};
</script>

<style scoped>
.admin-borrows {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.borrows-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-left h1 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.header-icon {
  font-size: 2rem;
}

.subtitle {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.refresh-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.refresh-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
}

.export-btn {
  background: white;
  color: #667eea;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.export-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
}

.stat-card.overdue {
  border-left: 4px solid #e74c3c;
}

.stat-value {
  display: block;
  font-size: 2rem;
  font-weight: bold;
  color: #333;
  line-height: 1;
}

.stat-label {
  display: block;
  color: #666;
  font-size: 0.9rem;
  margin-top: 0.25rem;
}

.stat-trend {
  display: block;
  color: #667eea;
  font-size: 0.8rem;
  font-weight: 600;
  margin-top: 0.5rem;
}

.filters-section {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.search-box {
  flex: 2;
  display: flex;
  align-items: center;
  background: white;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #ddd;
}

.search-icon {
  padding: 0 1rem;
  color: #666;
}

.search-box input {
  flex: 1;
  padding: 0.75rem 1rem 0.75rem 0;
  border: none;
  outline: none;
  font-size: 1rem;
}

.filter-group {
  flex: 2;
  display: flex;
  gap: 0.5rem;
}

.filter-select {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 10px;
  background: white;
  font-size: 1rem;
  outline: none;
  cursor: pointer;
}

.table-container {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.modern-table {
  width: 100%;
  border-collapse: collapse;
}

.modern-table th {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem;
  font-weight: 600;
  text-align: left;
  white-space: nowrap;
}

.modern-table td {
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
  color: #666;
}

.table-row {
  transition: background 0.3s ease;
}

.table-row:hover {
  background: #f8f9ff;
}

.id-cell {
  font-weight: 600;
  color: #667eea;
}

.book-info,
.user-info {
  display: flex;
  flex-direction: column;
}

.book-title,
.username {
  font-weight: 600;
  color: #333;
}

.book-id,
.user-id {
  font-size: 0.8rem;
  color: #999;
  margin-top: 0.25rem;
}

.returned-date {
  color: #2ecc71;
  font-weight: 500;
}

.not-returned {
  color: #999;
  font-style: italic;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-badge.active {
  background: #d4edda;
  color: #155724;
}

.status-badge.returned {
  background: #d1ecf1;
  color: #0c5460;
}

.status-badge.overdue {
  background: #f8d7da;
  color: #721c24;
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.action-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  white-space: nowrap;
}

.action-btn.return {
  background: #2ecc71;
  color: white;
}

.action-btn.reminder {
  background: #f39c12;
  color: white;
}

.action-btn.view {
  background: #3498db;
  color: white;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  filter: brightness(1.1);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  display: inline-block;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border-top: 1px solid #f0f0f0;
}

.page-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.page-btn:hover:not(:disabled) {
  background: #f5f5f5;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #666;
  font-size: 0.9rem;
}

.loading-state {
  text-align: center;
  padding: 4rem;
  background: white;
  border-radius: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f0f0f0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

.error-state {
  text-align: center;
  padding: 4rem;
  background: white;
  border-radius: 16px;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  display: block;
}

.error-state h3 {
  color: #d32f2f;
  margin-bottom: 0.5rem;
}

.error-state p {
  color: #666;
  margin-bottom: 1.5rem;
}

.empty-state {
  text-align: center;
  padding: 4rem;
  background: white;
  border-radius: 16px;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  display: block;
}

.empty-state h3 {
  color: #333;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #666;
}

.link-btn {
  background: none;
  border: none;
  color: #667eea;
  text-decoration: underline;
  cursor: pointer;
  font-size: 1rem;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}

.modal-container.small {
  max-width: 400px;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #666;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: #f5f5f5;
}

.modal-body {
  padding: 1.5rem;
}

.return-details {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
}

.return-details p {
  margin: 0.5rem 0;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 1rem;
}

.detail-item {
  display: contents;
}

.detail-item.full-width {
  display: flex;
  grid-column: span 2;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f0f0f0;
}

.detail-label {
  color: #666;
  font-weight: 600;
}

.detail-value {
  color: #333;
}

.overdue-text {
  color: #e74c3c;
  font-weight: 600;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 600;
}

.modern-select,
.modern-textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.3s ease;
  font-family: inherit;
}

.modern-textarea {
  resize: vertical;
  min-height: 80px;
}

.modern-select:focus,
.modern-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.modal-actions {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #f0f0f0;
}

.secondary-btn {
  flex: 1;
  padding: 0.75rem;
  background: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.secondary-btn:hover:not(:disabled) {
  background: #e8e8e8;
}

.primary-btn {
  flex: 1;
  padding: 0.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.primary-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(102, 126, 234, 0.3);
}

.primary-btn:disabled,
.secondary-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  padding: 1rem 2rem;
  border-radius: 10px;
  color: white;
  font-weight: 600;
  animation: slideIn 0.3s ease;
  z-index: 1001;
}

.toast.success {
  background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
}

.toast.error {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
}

.book-inventory {
  margin-top: 0.5rem;
}

.inventory-badge {
  display: inline-block;
  padding: 0.25rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.inventory-badge.available {
  background: #d4edda;
  color: #155724;
}

.inventory-badge.borrowed {
  background: #f8d7da;
  color: #721c24;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .borrows-container {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    text-align: center;
  }

  .header-actions {
    width: 100%;
    justify-content: center;
  }

  .stats-cards {
    grid-template-columns: 1fr 1fr;
  }

  .filters-section {
    flex-direction: column;
  }

  .filter-group {
    flex-direction: column;
  }

  .table-container {
    overflow-x: auto;
  }

  .actions-cell {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
    justify-content: center;
  }

  .details-grid {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .detail-item.full-width {
    grid-column: span 1;
  }

  .modal-container {
    width: 95%;
    margin: 1rem;
  }

  .toast {
    left: 1rem;
    right: 1rem;
    bottom: 1rem;
    text-align: center;
  }
}
</style>