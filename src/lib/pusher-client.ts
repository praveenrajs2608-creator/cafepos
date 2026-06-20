import Pusher from 'pusher-js';

export let pusherClient: any = null;

if (typeof window !== 'undefined') {
  pusherClient = new Pusher(
    process.env.NEXT_PUBLIC_PUSHER_KEY || 'pusher-key-placeholder',
    {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1',
      forceTLS: true,
    }
  );
}
