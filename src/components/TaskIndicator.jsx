import React from 'react';
import { CheckCircle, Settings, X, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

/**
 * TaskIndicator Component
 * 
 * Displays TaskMaster status for projects in the sidebar with appropriate
 * icons and colors based on the project's TaskMaster configuration state.
 */
const TaskIndicator = ({ 
  status = 'not-configured', 
  size = 'sm',
  className = '',
  showLabel = false 
}) => {
  const getIndicatorConfig = () => {
    switch (status) {
      case 'fully-configured':
        return {
          icon: CheckCircle,
          color: 'text-green-500 dark:text-green-400',
          bgColor: 'bg-green-50 dark:bg-green-950',
          label: 'TaskMaster 就绪',
          title: 'TaskMaster 已完全配置,包含 MCP 服务器'
        };

      case 'taskmaster-only':
        return {
          icon: Settings,
          color: 'text-blue-500 dark:text-blue-400',
          bgColor: 'bg-blue-50 dark:bg-blue-950',
          label: 'TaskMaster 已初始化',
          title: 'TaskMaster 已初始化,需要配置 MCP 服务器'
        };

      case 'mcp-only':
        return {
          icon: AlertCircle,
          color: 'text-amber-500 dark:text-amber-400',
          bgColor: 'bg-amber-50 dark:bg-amber-950',
          label: 'MCP 就绪',
          title: 'MCP 服务器已配置,需要初始化 TaskMaster'
        };

      case 'not-configured':
      case 'error':
      default:
        return {
          icon: X,
          color: 'text-gray-400 dark:text-gray-500',
          bgColor: 'bg-gray-50 dark:bg-gray-900',
          label: '未配置 TaskMaster',
          title: 'TaskMaster 未配置'
        };
    }
  };

  const config = getIndicatorConfig();
  const Icon = config.icon;
  
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4', 
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const paddingClasses = {
    xs: 'p-0.5',
    sm: 'p-1',
    md: 'p-1.5', 
    lg: 'p-2'
  };

  if (showLabel) {
    return (
      <div 
        className={cn(
          'inline-flex items-center gap-1.5 text-xs rounded-md px-2 py-1 transition-colors',
          config.bgColor,
          config.color,
          className
        )}
        title={config.title}
      >
        <Icon className={sizeClasses[size]} />
        <span className="font-medium">{config.label}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full transition-colors',
        config.bgColor,
        paddingClasses[size],
        className
      )}
      title={config.title}
    >
      <Icon className={cn(sizeClasses[size], config.color)} />
    </div>
  );
};

export default TaskIndicator;