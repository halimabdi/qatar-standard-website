'use client';
import { useEffect } from 'react';

export default function OneSignalInit() {
  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    if (!appId) return;

    // Delay initialization so we don't prompt immediately on page load
    const timer = setTimeout(async () => {
      try {
        const OneSignal = (await import('react-onesignal')).default;
        await OneSignal.init({
          appId,
          serviceWorkerParam: { scope: '/' },
          notifyButton: { enable: false },
          promptOptions: {
            slidedown: {
              prompts: [
                {
                  type: 'push',
                  autoPrompt: true,
                  text: {
                    actionMessage: 'Get breaking news alerts from Qatar Standard.',
                    acceptButton: 'Allow',
                    cancelButton: 'Later',
                  },
                  delay: {
                    pageViews: 1,
                    timeDelay: 4,
                  },
                },
              ],
            },
          },
        });
      } catch {
        // OneSignal init failure is non-fatal
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
