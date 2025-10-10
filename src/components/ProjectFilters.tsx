import { Search, Calendar, Filter, X } from 'lucide-react';
import { useState } from 'react';

export interface FilterState {
  searchQuery: string;
  status: 'all' | 'completed' | 'processing' | 'failed';
  dateRange: 'all' | 'today' | 'week' | 'month';
  templateName: string;
}

interface ProjectFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  templateNames: string[];
}

export function ProjectFilters({ filters, onFiltersChange, templateNames }: ProjectFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearchChange = (searchQuery: string) => {
    onFiltersChange({ ...filters, searchQuery });
  };

  const handleStatusChange = (status: FilterState['status']) => {
    onFiltersChange({ ...filters, status });
  };

  const handleDateRangeChange = (dateRange: FilterState['dateRange']) => {
    onFiltersChange({ ...filters, dateRange });
  };

  const handleTemplateChange = (templateName: string) => {
    onFiltersChange({ ...filters, templateName });
  };

  const hasActiveFilters = 
    filters.searchQuery !== '' ||
    filters.status !== 'all' ||
    filters.dateRange !== 'all' ||
    filters.templateName !== '';

  const clearFilters = () => {
    onFiltersChange({
      searchQuery: '',
      status: 'all',
      dateRange: 'all',
      templateName: '',
    });
    setShowAdvanced(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex flex-col gap-4">
        {/* 搜索栏 */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索项目名称或模板..."
              value={filters.searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all ${
              showAdvanced || hasActiveFilters
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-5 h-5" />
            高级筛选
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2.5 bg-red-50 text-red-600 rounded-lg font-medium flex items-center gap-2 hover:bg-red-100 transition-all"
            >
              <X className="w-5 h-5" />
              清除
            </button>
          )}
        </div>

        {/* 高级筛选选项 */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            {/* 状态筛选 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">项目状态</label>
              <select
                value={filters.status}
                onChange={(e) => handleStatusChange(e.target.value as FilterState['status'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">全部状态</option>
                <option value="completed">已完成</option>
                <option value="processing">处理中</option>
                <option value="failed">失败</option>
              </select>
            </div>

            {/* 日期范围 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                创建时间
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleDateRangeChange(e.target.value as FilterState['dateRange'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">全部时间</option>
                <option value="today">今天</option>
                <option value="week">最近一周</option>
                <option value="month">最近一月</option>
              </select>
            </div>

            {/* 模板筛选 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">使用模板</label>
              <select
                value={filters.templateName}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">全部模板</option>
                {templateNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
