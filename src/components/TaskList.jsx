import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, List, Grid, ChevronDown, Columns, Plus, Settings, Terminal, FileText, HelpCircle, X } from 'lucide-react';
import { cn } from '../lib/utils';
import TaskCard from './TaskCard';
import CreateTaskModal from './CreateTaskModal';
import { useTaskMaster } from '../contexts/TaskMasterContext';
import Shell from './Shell';
import { api } from '../utils/api';

const TaskList = ({ 
  tasks = [], 
  onTaskClick, 
  className = '',
  showParentTasks = false,
  defaultView = 'kanban', // 'list', 'grid', or 'kanban'
  currentProject,
  onTaskCreated,
  onShowPRDEditor,
  existingPRDs = [],
  onRefreshPRDs
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('id'); // 'id', 'title', 'status', 'priority', 'updated'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
  const [viewMode, setViewMode] = useState(defaultView);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCLI, setShowCLI] = useState(false);
  const [showHelpGuide, setShowHelpGuide] = useState(false);
  const [isTaskMasterComplete, setIsTaskMasterComplete] = useState(false);
  const [showPRDDropdown, setShowPRDDropdown] = useState(false);
  
  const { projectTaskMaster, refreshProjects, refreshTasks, setCurrentProject } = useTaskMaster();

  // Close PRD dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showPRDDropdown && !event.target.closest('.relative')) {
        setShowPRDDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPRDDropdown]);

  // Get unique status values from tasks
  const statuses = useMemo(() => {
    const statusSet = new Set(tasks.map(task => task.status).filter(Boolean));
    return Array.from(statusSet).sort();
  }, [tasks]);

  // Get unique priority values from tasks
  const priorities = useMemo(() => {
    const prioritySet = new Set(tasks.map(task => task.priority).filter(Boolean));
    return Array.from(prioritySet).sort();
  }, [tasks]);

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      // Text search
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        task.title.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower) ||
        task.id.toString().includes(searchLower);

      // Status filter
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;

      // Priority filter
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });

    // Sort tasks
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'title':
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
          break;
        case 'status':
          // Custom status ordering: pending, in-progress, done, blocked, deferred, cancelled
          const statusOrder = { pending: 1, 'in-progress': 2, done: 3, blocked: 4, deferred: 5, cancelled: 6 };
          aVal = statusOrder[a.status] || 99;
          bVal = statusOrder[b.status] || 99;
          break;
        case 'priority':
          // Custom priority ordering: high should be sorted first in descending
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aVal = priorityOrder[a.priority] || 0;
          bVal = priorityOrder[b.priority] || 0;
          break;
        case 'updated':
          aVal = new Date(a.updatedAt || a.createdAt || 0);
          bVal = new Date(b.updatedAt || b.createdAt || 0);
          break;
        case 'id':
        default:
          // Handle numeric and dotted IDs (1, 1.1, 1.2, 2, 2.1, etc.)
          const parseId = (id) => {
            const parts = id.toString().split('.');
            return parts.map(part => parseInt(part, 10));
          };
          
          const aIds = parseId(a.id);
          const bIds = parseId(b.id);
          
          // Compare each part
          for (let i = 0; i < Math.max(aIds.length, bIds.length); i++) {
            const aId = aIds[i] || 0;
            const bId = bIds[i] || 0;
            if (aId !== bId) {
              aVal = aId;
              bVal = bId;
              break;
            }
          }
          break;
      }

      if (sortBy === 'updated') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      if (typeof aVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return filtered;
  }, [tasks, searchTerm, statusFilter, priorityFilter, sortBy, sortOrder]);

  // Organize tasks by status for Kanban view
  const kanbanColumns = useMemo(() => {
    const allColumns = [
      { 
        id: 'pending', 
        title: '📋 To Do', 
        status: 'pending', 
        color: 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700',
        headerColor: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
      },
      { 
        id: 'in-progress', 
        title: '🚀 In Progress', 
        status: 'in-progress', 
        color: 'bg-blue-50 dark:bg-blue-900/50 border-blue-200 dark:border-blue-700',
        headerColor: 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
      },
      { 
        id: 'done', 
        title: '✅ Done', 
        status: 'done', 
        color: 'bg-emerald-50 dark:bg-emerald-900/50 border-emerald-200 dark:border-emerald-700',
        headerColor: 'bg-emerald-100 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200'
      },
      { 
        id: 'blocked', 
        title: '🚫 Blocked', 
        status: 'blocked', 
        color: 'bg-red-50 dark:bg-red-900/50 border-red-200 dark:border-red-700',
        headerColor: 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200'
      },
      { 
        id: 'deferred', 
        title: '⏳ Deferred', 
        status: 'deferred', 
        color: 'bg-amber-50 dark:bg-amber-900/50 border-amber-200 dark:border-amber-700',
        headerColor: 'bg-amber-100 dark:bg-amber-800 text-amber-800 dark:text-amber-200'
      },
      { 
        id: 'cancelled', 
        title: '❌ Cancelled', 
        status: 'cancelled', 
        color: 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700',
        headerColor: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
      }
    ];

    // Only show columns that have tasks or are part of the main workflow
    const mainWorkflowStatuses = ['pending', 'in-progress', 'done'];
    const columnsWithTasks = allColumns.filter(column => {
      const hasTask = filteredAndSortedTasks.some(task => task.status === column.status);
      const isMainWorkflow = mainWorkflowStatuses.includes(column.status);
      return hasTask || isMainWorkflow;
    });

    return columnsWithTasks.map(column => ({
      ...column,
      tasks: filteredAndSortedTasks.filter(task => task.status === column.status)
    }));
  }, [filteredAndSortedTasks]);

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  if (tasks.length === 0) {
    // Check if TaskMaster is configured by looking for .taskmaster directory
    const hasTaskMasterDirectory = currentProject?.taskMasterConfigured || 
                                   currentProject?.taskmaster?.hasTaskmaster ||
                                   projectTaskMaster?.hasTaskmaster;

    return (
      <div className={cn('text-center py-12', className)}>
        {!hasTaskMasterDirectory ? (
          // TaskMaster not configured
          <div className="max-w-md mx-auto">
            <div className="text-blue-600 dark:text-blue-400 mb-4">
              <Settings className="w-12 h-12 mx-auto mb-4" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              TaskMaster AI 未配置
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              TaskMaster 帮助您通过 AI 辅助将复杂项目分解为可管理的任务
            </p>
            
            {/* What is TaskMaster section */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg text-left">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">
                🎯 什么是 TaskMaster？
              </h4>
              <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                <p>• <strong>AI 驱动的任务管理：</strong> 将复杂项目分解为可管理的子任务</p>
                <p>• <strong>PRD 模板：</strong> 从产品需求文档生成任务</p>
                <p>• <strong>依赖关系跟踪：</strong> 了解任务关系和执行顺序</p>
                <p>• <strong>进度可视化：</strong> 看板和详细的任务分析</p>
                <p>• <strong>CLI 集成：</strong> 使用 taskmaster 命令进行高级工作流</p>
              </div>
            </div>
            
            <button
              onClick={() => {
                setIsTaskMasterComplete(false); // Reset completion state
                setShowCLI(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
            >
              <Terminal className="w-4 h-4" />
              初始化 TaskMaster AI
            </button>
          </div>
        ) : (
          // TaskMaster configured but no tasks - show Getting Started guide
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-xl border border-blue-200 dark:border-blue-800 p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">TaskMaster 入门指南</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">TaskMaster 已初始化！接下来该做什么：</p>
                </div>
              </div>
              
              <div className="space-y-4 text-left">
                <div className="grid gap-3">
                  {/* Step 1 */}
                  <div className="flex gap-3 p-3 bg-white dark:bg-gray-800/50 rounded-lg border border-blue-100 dark:border-blue-800/50">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white text-xs font-semibold rounded-full flex items-center justify-center">1</div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">创建产品需求文档 (PRD)</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">讨论您的项目想法并创建描述您想要构建的内容的 PRD。</p>
                      <button
                        onClick={() => {
                          onShowPRDEditor?.();
                        }}
                        className="inline-flex items-center gap-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                      >
                        <FileText className="w-3 h-3" />
                        添加 PRD
                      </button>
                      
                      {/* Show existing PRDs if any */}
                      {existingPRDs.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">现有 PRD:</p>
                          <div className="flex flex-wrap gap-2">
                            {existingPRDs.map((prd) => (
                              <button
                                key={prd.name}
                                onClick={async () => {
                                  try {
                                    // Load the PRD content from the API
                                    const response = await api.get(`/taskmaster/prd/${encodeURIComponent(currentProject.name)}/${encodeURIComponent(prd.name)}`);
                                    if (response.ok) {
                                      const prdData = await response.json();
                                      onShowPRDEditor?.({
                                        name: prd.name,
                                        content: prdData.content,
                                        isExisting: true
                                      });
                                    } else {
                                      console.error('Failed to load PRD:', response.statusText);
                                    }
                                  } catch (error) {
                                    console.error('Error loading PRD:', error);
                                  }
                                }}
                                className="inline-flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                              >
                                <FileText className="w-3 h-3" />
                                {prd.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex gap-3 p-3 bg-white dark:bg-gray-800/50 rounded-lg border border-blue-100 dark:border-blue-800/50">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white text-xs font-semibold rounded-full flex items-center justify-center">2</div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">从 PRD 生成任务</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">拥有 PRD 后，让 AI 助手解析它，TaskMaster 将自动将其分解为包含实现细节的可管理任务。</p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex gap-3 p-3 bg-white dark:bg-gray-800/50 rounded-lg border border-blue-100 dark:border-blue-800/50">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white text-xs font-semibold rounded-full flex items-center justify-center">3</div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">分析和扩展任务</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">让 AI 助手分析任务复杂性并将其扩展为详细的子任务，以便更容易实现。</p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex gap-3 p-3 bg-white dark:bg-gray-800/50 rounded-lg border border-blue-100 dark:border-blue-800/50">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white text-xs font-semibold rounded-full flex items-center justify-center">4</div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">开始构建</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">让 AI 助手开始处理任务，更新任务状态，并随着项目发展添加新任务。</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-blue-200 dark:border-blue-700">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onShowPRDEditor?.();
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors cursor-pointer"
                    style={{ zIndex: 10 }}
                  >
                    <FileText className="w-4 h-4" />
                    Add PRD
                  </button>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                💡 <strong>提示：</strong> 从 PRD 开始，充分利用 TaskMaster 的 AI 驱动任务生成功能
              </div>
            </div>
          </div>
        )}
        
        {/* TaskMaster CLI Setup Modal */}
        {showCLI && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-4xl h-[600px] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                    <Terminal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">TaskMaster 设置</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{currentProject?.displayName} 的交互式 CLI</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCLI(false);
                    // Refresh project data after closing CLI to detect TaskMaster initialization
                    setTimeout(() => {
                      refreshProjects();
                      // Also refresh the current project's TaskMaster status
                      if (currentProject) {
                        setCurrentProject(currentProject);
                      }
                    }, 1000);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>
              
              {/* Terminal Container */}
              <div className="flex-1 p-4">
                <div 
                  className="h-full bg-black rounded-lg overflow-hidden" 
                  onClick={(e) => {
                    // Focus the terminal when clicked
                    const terminalElement = e.currentTarget.querySelector('.xterm-screen');
                    if (terminalElement) {
                      terminalElement.focus();
                    }
                  }}
                >
                  <Shell 
                    selectedProject={currentProject}
                    selectedSession={null}
                    isActive={true}
                    initialCommand="npx task-master init"
                    isPlainShell={true}
                    onProcessComplete={(exitCode) => {
                      setIsTaskMasterComplete(true);
                      if (exitCode === 0) {
                        // Auto-refresh after successful completion
                        setTimeout(() => {
                          refreshProjects();
                          if (currentProject) {
                            setCurrentProject(currentProject);
                          }
                        }, 1000);
                      }
                    }}
                  />
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {isTaskMasterComplete ? (
                      <span className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        TaskMaster 设置已完成！您现在可以关闭此窗口。
                      </span>
                    ) : (
                      "TaskMaster 初始化将自动开始"
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setShowCLI(false);
                      setIsTaskMasterComplete(false); // Reset state
                      // Refresh project data after closing CLI to detect TaskMaster initialization
                      setTimeout(() => {
                        refreshProjects();
                        // Also refresh the current project's TaskMaster status
                        if (currentProject) {
                          setCurrentProject(currentProject);
                        }
                      }, 1000);
                    }}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded-md transition-colors",
                      isTaskMasterComplete 
                        ? "bg-green-600 hover:bg-green-700 text-white" 
                        : "text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                    )}
                  >
                    {isTaskMasterComplete ? "关闭并继续" : "关闭"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="搜索任务..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                'p-2 rounded-md transition-colors',
                viewMode === 'kanban' 
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              )}
              title="看板视图"
            >
              <Columns className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded-md transition-colors',
                viewMode === 'list' 
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              )}
              title="列表视图"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded-md transition-colors',
                viewMode === 'grid' 
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              )}
              title="网格视图"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>

          {/* Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors',
              showFilters 
                ? 'bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300' 
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            )}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">筛选</span>
            <ChevronDown className={cn('w-4 h-4 transition-transform', showFilters && 'rotate-180')} />
          </button>
          
          {/* Action Buttons */}
          {currentProject && (
            <>
              {/* Help Button */}
              <button
                onClick={() => setShowHelpGuide(true)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-300 dark:border-gray-600"
                title="TaskMaster 入门指南"
              >
                <HelpCircle className="w-4 h-4" />
              </button>

              {/* PRD Management */}
              <div className="relative">
                {existingPRDs.length > 0 ? (
                  // Dropdown when PRDs exist
                  <div className="relative">
                    <button
                      onClick={() => setShowPRDDropdown(!showPRDDropdown)}
                      className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
                      title={`${existingPRDs.length} PRD${existingPRDs.length > 1 ? 's' : ''} available`}
                    >
                      <FileText className="w-4 h-4" />
                      <span className="hidden sm:inline">需求文档</span>
                      <span className="px-1.5 py-0.5 text-xs bg-purple-500 rounded-full min-w-[1.25rem] text-center">
                        {existingPRDs.length}
                      </span>
                      <ChevronDown className={cn('w-3 h-3 transition-transform hidden sm:block', showPRDDropdown && 'rotate-180')} />
                    </button>
                    
                    {showPRDDropdown && (
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-30">
                        <div className="p-2">
                          <button
                            onClick={() => {
                              onShowPRDEditor?.();
                              setShowPRDDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            创建新 PRD
                          </button>
                          <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 px-3 py-1 font-medium">现有 PRD:</div>
                          {existingPRDs.map((prd) => (
                            <button
                              key={prd.name}
                              onClick={async () => {
                                try {
                                  const response = await api.get(`/taskmaster/prd/${encodeURIComponent(currentProject.name)}/${encodeURIComponent(prd.name)}`);
                                  if (response.ok) {
                                    const prdData = await response.json();
                                    onShowPRDEditor?.({
                                      name: prd.name,
                                      content: prdData.content,
                                      isExisting: true
                                    });
                                    setShowPRDDropdown(false);
                                  }
                                } catch (error) {
                                  console.error('Error loading PRD:', error);
                                }
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                              title={`Modified: ${new Date(prd.modified).toLocaleDateString()}`}
                            >
                              <FileText className="w-4 h-4" />
                              <span className="truncate">{prd.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Simple button when no PRDs exist
                  <button
                    onClick={() => {
                      onShowPRDEditor?.();
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
                    title="创建产品需求文档"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="hidden sm:inline">添加 PRD</span>
                  </button>
                )}
              </div>
              
              {/* Add Task Button */}
              {((currentProject?.taskMasterConfigured || currentProject?.taskmaster?.hasTaskmaster || projectTaskMaster?.hasTaskmaster) || tasks.length > 0) && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                  title="添加新任务"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">添加任务</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                状态
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">所有状态</option>
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                优先级
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">所有优先级</option>
                {priorities.map(priority => (
                  <option key={priority} value={priority}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                排序方式
              </label>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="id-asc">ID (升序)</option>
                <option value="id-desc">ID (降序)</option>
                <option value="title-asc">标题 (A-Z)</option>
                <option value="title-desc">标题 (Z-A)</option>
                <option value="status-asc">状态 (待处理优先)</option>
                <option value="status-desc">状态 (已完成优先)</option>
                <option value="priority-asc">优先级 (高优先)</option>
                <option value="priority-desc">优先级 (低优先)</option>
              </select>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              显示 {filteredAndSortedTasks.length} / {tasks.length} 个任务
            </div>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              清除筛选
            </button>
          </div>
        </div>
      )}

      {/* Quick Sort Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleSortChange('id')}
          className={cn(
            'flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors',
            sortBy === 'id' 
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          )}
        >
          ID {getSortIcon('id')}
        </button>
        <button
          onClick={() => handleSortChange('status')}
          className={cn(
            'flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors',
            sortBy === 'status' 
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          )}
        >
          Status {getSortIcon('status')}
        </button>
        <button
          onClick={() => handleSortChange('priority')}
          className={cn(
            'flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors',
            sortBy === 'priority' 
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          )}
        >
          Priority {getSortIcon('priority')}
        </button>
      </div>

      {/* Task Cards */}
      {filteredAndSortedTasks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">没有匹配的任务</h3>
            <p className="text-sm">尝试调整搜索或筛选条件。</p>
          </div>
        </div>
      ) : viewMode === 'kanban' ? (
        /* Kanban Board Layout - Dynamic grid based on column count */
        <div className={cn(
          "grid gap-6", 
          kanbanColumns.length === 1 && "grid-cols-1 max-w-md mx-auto",
          kanbanColumns.length === 2 && "grid-cols-1 md:grid-cols-2",
          kanbanColumns.length === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
          kanbanColumns.length === 4 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
          kanbanColumns.length === 5 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
          kanbanColumns.length >= 6 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
        )}>
          {kanbanColumns.map((column) => (
            <div key={column.id} className={cn('rounded-xl border shadow-sm transition-shadow hover:shadow-md', column.color)}>
              {/* Column Header */}
              <div className={cn('px-4 py-3 rounded-t-xl border-b', column.headerColor)}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">
                    {column.title}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium px-2 py-1 bg-white/60 dark:bg-black/20 rounded-full">
                      {column.tasks.length}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Column Tasks */}
              <div className="p-3 space-y-3 min-h-[200px] max-h-[calc(100vh-300px)] overflow-y-auto">
                {column.tasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                    <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                    </div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      暂无任务
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {column.status === 'pending' ? '任务将显示在这里' :
                       column.status === 'in-progress' ? '开始时将任务移至此处' :
                       column.status === 'done' ? '已完成的任务将显示在这里' :
                       '具有此状态的任务将显示在这里'}
                    </div>
                  </div>
                ) : (
                  column.tasks.map((task) => (
                    <div key={task.id} className="transform transition-transform hover:scale-[1.02]">
                      <TaskCard
                        task={task}
                        onClick={() => onTaskClick?.(task)}
                        showParent={showParentTasks}
                        className="w-full shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={cn(
          'gap-4',
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
            : 'space-y-4'
        )}>
          {filteredAndSortedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick?.(task)}
              showParent={showParentTasks}
              className={viewMode === 'grid' ? 'h-full' : ''}
            />
          ))}
        </div>
      )}
      
      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          currentProject={currentProject}
          onClose={() => setShowCreateModal(false)}
          onTaskCreated={() => {
            setShowCreateModal(false);
            if (onTaskCreated) onTaskCreated();
          }}
        />
      )}
      
      {/* Help Guide Modal */}
      {showHelpGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">TaskMaster 入门指南</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">高效任务管理指南</p>
                </div>
              </div>
              <button
                onClick={() => setShowHelpGuide(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-4">
                {/* Step 1 */}
                <div className="flex gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white text-sm font-semibold rounded-full flex items-center justify-center">1</div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">创建产品需求文档 (PRD)</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">讨论您的项目想法并创建描述您想要构建的内容的 PRD。</p>
                    <button
                      onClick={() => {
                        onShowPRDEditor?.();
                        setShowHelpGuide(false);
                      }}
                      className="inline-flex items-center gap-2 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1.5 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      添加 PRD
                    </button>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white text-sm font-semibold rounded-full flex items-center justify-center">2</div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">从 PRD 生成任务</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">拥有 PRD 后，让 AI 助手解析它，TaskMaster 将自动将其分解为包含实现细节的可管理任务。</p>
                    <div className="bg-white dark:bg-gray-800/50 rounded border border-green-200 dark:border-green-700/50 p-3 mb-2">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">💬 Example:</p>
                      <p className="text-xs text-gray-900 dark:text-white font-mono">
                        "I've just initialized a new project with Claude Task Master. I have a PRD at .taskmaster/docs/prd.txt. Can you help me parse it and set up the initial tasks?"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex-shrink-0 w-8 h-8 bg-amber-600 text-white text-sm font-semibold rounded-full flex items-center justify-center">3</div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">分析和扩展任务</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">让 AI 助手分析任务复杂性并将其扩展为详细的子任务，以便更容易实现。</p>
                    <div className="bg-white dark:bg-gray-800/50 rounded border border-amber-200 dark:border-amber-700/50 p-3 mb-2">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">💬 Example:</p>
                      <p className="text-xs text-gray-900 dark:text-white font-mono">
                        "Task 5 seems complex. Can you break it down into subtasks?"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white text-sm font-semibold rounded-full flex items-center justify-center">4</div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">开始构建</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">让 AI 助手开始处理任务，更新任务状态，并随着项目发展添加新任务。</p>
                    <div className="bg-white dark:bg-gray-800/50 rounded border border-purple-200 dark:border-purple-700/50 p-3 mb-3">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">💬 Example:</p>
                      <p className="text-xs text-gray-900 dark:text-white font-mono">
                        "Please add a new task to implement user profile image uploads using Cloudinary, research the best approach."
                      </p>
                    </div>
                    <a
                      href="https://github.com/eyaltoledano/claude-task-master/blob/main/docs/examples.md"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline"
                    >
                      查看更多示例和使用模式 →
                    </a>
                  </div>
                </div>

                {/* Pro Tips */}
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">💡 专业提示</h4>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                      使用搜索栏快速查找特定任务
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                      使用视图切换按钮在看板、列表和网格视图之间切换
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                      使用筛选功能专注于特定任务状态或优先级
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></span>
                      点击任何任务可查看详细信息和管理子任务
                    </li>
                  </ul>
                </div>

                {/* Learn More Section */}
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-3">📚 了解更多</h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                    TaskMaster AI 是为开发者构建的高级任务管理系统。获取文档、示例并为项目做出贡献。
                  </p>
                  <a 
                    href="https://github.com/eyaltoledano/claude-task-master" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                    </svg>
                    在 GitHub 上查看
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList;