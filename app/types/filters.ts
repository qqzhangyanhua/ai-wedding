// 列表筛选器的共享状态类型

export interface FilterState {
  searchQuery: string;
  status: 'all' | 'completed' | 'failed';
  dateRange: 'all' | 'today' | 'week' | 'month';
  templateName: string;
}

