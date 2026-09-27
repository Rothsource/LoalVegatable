'use client';

// Drop this into the distributor app, e.g. rendered at the top of the
// orders/dashboard page, so a distributor can opt in to push alerts for
// new orders.
import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { subscribeToPush } from '@/lib/push/subscribe';

export default function EnableOrderNotifications() {
  const [status, setStatus] = useState<'idle' | 'enabling' | 'on' | 'error'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      setStatus('on');
    }
  }, []);

  const handleEnable = async () => {
    setStatus('enabling');
    const result = await subscribeToPush('distributor');
    if (result.ok) setStatus('on');
    else {
      setStatus('error');
      setError(result.reason || 'Could not enable notifications.');
    }
  };

  if (status === 'on') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '10px', fontSize: '13px', fontWeight: 700, color: '#166534', width: 'fit-content' }}>
        <Bell size={15} /> New order alerts are on
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleEnable}
        disabled={status === 'enabling'}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#0A490A', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
      >
        <Bell size={15} /> {status === 'enabling' ? 'Enabling…' : 'Get notified of new orders'}
      </button>
      {status === 'error' && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px' }}>{error}</p>}
    </div>
  );
}