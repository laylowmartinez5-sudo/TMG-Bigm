import React, { useEffect, useState } from 'react';
import api from '../api';

const fmtSats = (n) => Number(n || 0).toLocaleString('en-US');

export default function Bitcoin() {
  const [addresses, setAddresses] = useState([]);
  const [balances, setBalances] = useState({}); // id -> {confirmed, unconfirmed, checked}
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ label: '', address: '' });
  const [adding, setAdding] = useState(false);
  const [checking, setChecking] = useState({});

  const load = async () => {
    setError('');
    try {
      const res = await api.get('/bitcoin/addresses');
      setAddresses(res.data.addresses || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load addresses.');
    }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      await load();
      if (alive) setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const addAddress = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await api.post('/bitcoin/addresses', form);
      setAddresses([...addresses, res.data.address]);
      setForm({ label: '', address: '' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add address.');
    } finally {
      setAdding(false);
    }
  };

  const checkBalance = async (id) => {
    setChecking({ ...checking, [id]: true });
    try {
      const res = await api.get(`/bitcoin/addresses/${id}/balance`);
      setBalances({ ...balances, [id]: { ...res.data, checked: true } });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Balance check failed.');
    } finally {
      setChecking({ ...checking, [id]: false });
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Remove this watched address?')) return;
    try {
      await api.delete(`/bitcoin/addresses/${id}`);
      setAddresses(addresses.filter((a) => a.id !== id));
      const nb = { ...balances };
      delete nb[id];
      setBalances(nb);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to remove address.');
    }
  };

  if (loading) return <p>Loading…</p>;

  return (
    <div>
      {error && <div className="error-box">{error}</div>}

      <div className="info-box">
        <strong>Watch-only.</strong> This app never holds keys or sends BTC. Balances are read
        from the backend (mempool.space) for addresses you choose to watch.
      </div>

      <div className="card">
        <h2>Watch a new address</h2>
        <form className="field-form" onSubmit={addAddress}>
          <div className="form-row">
            <label className="field">
              Label
              <input
                type="text"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="e.g. TMG treasury"
                required
              />
            </label>
            <label className="field">
              Bitcoin address
              <input
                type="text"
                className="mono"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="bc1…"
                required
              />
            </label>
          </div>
          <button type="submit" disabled={adding}>
            {adding ? 'Adding…' : 'Add address'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Watched addresses ({addresses.length})</h2>
        {addresses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">₿</div>
            <p>
              <strong>No addresses being watched.</strong>
            </p>
            <p>Add a Bitcoin address above to check its balance here.</p>
          </div>
        ) : (
          <ul className="list-plain">
            {addresses.map((a) => {
              const b = balances[a.id];
              return (
                <li key={a.id}>
                  <div style={{ flex: 1 }}>
                    <strong>{a.label}</strong>
                    <div className="mono hint">{a.address}</div>
                    {b && b.checked && (
                      <div className="hint" style={{ marginTop: '0.35rem' }}>
                        Confirmed: <strong style={{ color: 'var(--gold)' }}>{fmtSats(b.confirmed)} sats</strong>
                        {' · '}
                        Unconfirmed: {fmtSats(b.unconfirmed)} sats
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      className="btn-secondary btn-small"
                      onClick={() => checkBalance(a.id)}
                      disabled={checking[a.id]}
                    >
                      {checking[a.id] ? 'Checking…' : 'Check balance'}
                    </button>
                    <button className="btn-danger btn-small" onClick={() => remove(a.id)}>
                      Remove
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
