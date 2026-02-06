/**
 * Sandbox Cleanup Cron Job
 * 
 * Run this periodically (every 5-10 minutes) to:
 * - Pause idle sandboxes (save costs)
 * - Destroy old sandboxes
 * 
 * In production, use:
 * - Cloudflare Cron Triggers
 * - Vercel Cron Jobs
 * - AWS EventBridge
 */

import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { cleanupIdleSessions, getActiveSessions } from '~/lib/.server/sandbox/orchestrator';

export async function action({ context }: ActionFunctionArgs) {
  try {
    // Cleanup idle sessions
    await cleanupIdleSessions(context.cloudflare.env);

    // Get stats
    const sessions = getActiveSessions();
    const stats = {
      total: sessions.length,
      active: sessions.filter((s) => s.status === 'active').length,
      paused: sessions.filter((s) => s.status === 'paused').length,
      creating: sessions.filter((s) => s.status === 'creating').length,
    };

    return Response.json({
      success: true,
      message: 'Cleanup completed',
      stats,
    });
  } catch (error) {
    console.error('Cleanup error:', error);

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Cleanup failed',
      },
      { status: 500 },
    );
  }
}
