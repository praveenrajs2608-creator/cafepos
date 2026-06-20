export async function sendPushNotification(message: string, tags?: Record<string, string>) {
  const appId = process.env.ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_API_KEY;

  if (!appId || !apiKey) {
    console.log('OneSignal credentials missing, logging push notification:', message);
    return;
  }

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Basic ${apiKey}`,
      },
      body: JSON.stringify({
        app_id: appId,
        contents: { en: message },
        filters: tags
          ? Object.entries(tags).map(([key, value]) => ({
              field: 'tag',
              key: key,
              relation: '=',
              value: value,
            }))
          : undefined,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to send OneSignal push notification', error);
  }
}
