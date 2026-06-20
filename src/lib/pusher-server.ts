import Pusher from 'pusher';

export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID || '123456',
  key: process.env.NEXT_PUBLIC_PUSHER_KEY || 'pusher-key-placeholder',
  secret: process.env.PUSHER_SECRET || 'pusher-secret-placeholder',
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1',
  useTLS: true,
});
