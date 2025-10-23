#!/usr/bin/env node
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// 要检查和清理的端口
const PORTS = [3001, 5173, 5174];

/**
 * 查找占用指定端口的进程 ID
 */
async function findProcessOnPort(port) {
  try {
    const { stdout } = await execAsync(`lsof -ti:${port}`);
    const pids = stdout.trim().split('\n').filter(Boolean);
    return pids;
  } catch (error) {
    // 如果没有找到进程，lsof 会返回错误，这是正常的
    return [];
  }
}

/**
 * 终止指定的进程
 */
async function killProcess(pid) {
  try {
    await execAsync(`kill -9 ${pid}`);
    return true;
  } catch (error) {
    console.error(`❌ 无法终止进程 ${pid}:`, error.message);
    return false;
  }
}

/**
 * 清理指定端口上的所有进程
 */
async function cleanupPort(port) {
  console.log(`🔍 检查端口 ${port}...`);

  const pids = await findProcessOnPort(port);

  if (pids.length === 0) {
    console.log(`✅ 端口 ${port} 未被占用`);
    return true;
  }

  console.log(`⚠️  端口 ${port} 被以下进程占用: ${pids.join(', ')}`);

  for (const pid of pids) {
    const success = await killProcess(pid);
    if (success) {
      console.log(`✅ 已终止进程 ${pid}`);
    }
  }

  return true;
}

/**
 * 清理所有配置的端口
 */
async function cleanupAllPorts() {
  console.log('🧹 开始清理端口...\n');

  for (const port of PORTS) {
    await cleanupPort(port);
    console.log('');
  }

  console.log('✨ 端口清理完成！\n');
}

// 运行清理
cleanupAllPorts().catch(error => {
  console.error('❌ 清理过程中出错:', error);
  process.exit(1);
});
