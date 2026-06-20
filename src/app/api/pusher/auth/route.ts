import { NextRequest, NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher-server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();
    const socketId = body.get('socket_id') as string;
    const channelName = body.get('channel_name') as string;

    if (!socketId || !channelName) {
      return new Response('Bad request', { status: 400 });
    }

    const authResponse = pusherServer.authorizeChannel(socketId, channelName);
    return NextResponse.json(authResponse);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
