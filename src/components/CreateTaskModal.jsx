import React from 'react';
import { X, Sparkles } from 'lucide-react';

const CreateTaskModal = ({ currentProject, onClose, onTaskCreated }) => {

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">创建 AI 生成的任务</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* AI-First Approach */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  💡 提示：直接询问 Claude Code!
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                  你可以直接在聊天中询问 Claude Code 为你创建任务。
                  AI 助手将自动生成详细的任务,包含基于研究的深入见解。
                </p>

                <div className="bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-700 p-3 mb-3">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">示例:</p>
                  <p className="text-sm text-gray-900 dark:text-white font-mono">
                    "请添加一个新任务,使用 Cloudinary 实现用户头像上传功能,研究最佳方案。"
                  </p>
                </div>

                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <strong>这会运行:</strong> <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded text-xs">
                    task-master add-task --prompt="实现用户头像上传功能,使用 Cloudinary" --research
                  </code>
                </p>
              </div>
            </div>
          </div>

          {/* Learn More Link */}
          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              查看更多示例和高级使用方法:
            </p>
            <a
              href="https://github.com/eyaltoledano/claude-task-master/blob/main/docs/examples.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline font-medium"
            >
              查看 TaskMaster 文档 →
            </a>
          </div>

          {/* Footer */}
          <div className="pt-4">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              知道了,我会直接询问 Claude Code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTaskModal;