import React, { useEffect, useState } from 'react';

// PWA install banner: shows only when the browser fires beforeinstallprompt.
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!deferred || dismissed) return null;

  const install = async () => {
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  return (
    <div className="install-banner">
      <span>Install Trackillaz Cash for quick access to your TMG dashboard.</span>
      <div className="banner-actions">
        <button className="btn btn-small" onClick={install}>
          Install
        </button>
        <button className="btn-plain btn-small" onClick={() => setDismissed(true)}>
          Dismiss
        </button>
      </div>
    </div>
  );
}
