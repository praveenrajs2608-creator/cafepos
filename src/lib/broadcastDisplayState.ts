import { pusherServer } from './pusher-server';
import { DisplayState } from '@/types/display';

export async function broadcastDisplayState(sessionId: string, state: DisplayState) {
  try {
    await pusherServer.trigger(`customer-display-${sessionId}`, 'state.updated', state);
  } catch (error) {
    console.error('Failed to broadcast customer display state:', error);
  }
}
