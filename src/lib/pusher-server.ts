import Pusher from 'pusher';

const appId = process.env.PUSHER_APP_ID || '';
const key = process.env.NEXT_PUBLIC_PUSHER_KEY || '';
const secret = process.env.PUSHER_SECRET || '';
const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1';

const isConfigured =
  appId !== '' &&
  key !== '' &&
  secret !== '' &&
  !appId.includes('placeholder') &&
  !key.includes('placeholder') &&
  !secret.includes('placeholder') &&
  appId !== '123456';

// Create a real Pusher instance or a no-op stub
export const pusherServer: Pusher = isConfigured
  ? new Pusher({ appId, key, secret, cluster, useTLS: true })
  : ({
      trigger: async () => {
        // Pusher not configured — silently skip
        return {};
      },
    } as unknown as Pusher);
