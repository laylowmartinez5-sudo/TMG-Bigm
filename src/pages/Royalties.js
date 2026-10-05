import React, { useEffect, useState } from 'react';
import api from '../api';

const money = (n) =>
  '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const RAILS = ['venmo', 'cashapp', 'wire', 'other'];

function badgeClass(status) {
  if (status === 'approved') return 'badge-approved';
  if (status === 'complete') return 'badge-complete';
  return 'badge-draft';
}

// One manual CSV import card (never labeled as a live integration).
function ImportCard({ title, endpoint, needsSource, onDone }) {
  const [file, setFile] = useState(null);
  const [source, setSource] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMsg('Choose a CSV file first.');
      return;
    }
    setBusy(true);
    setMsg('');
    try {
      const fd = new FormData();
      fd.append('csv', file);
      if (needsSource) fd.append('source', source || title);
      const res = await api.post(endpoint, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMsg(`Imported ${res.data.imported ?? 0} rows (statement ${res.data.statementId ?? '—'}).`);
      setFile(null);
      e.target.reset();
      onDone();
    } catch (err) {
      setMsg(err.response?.data?.message || err.message || 'Import failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <h3>{title}</h3>
      <p className="hint">Manual CSV import — not a live integration.</p>
      {msg && <div className="info-box">{msg}</div>}
      <form className="field-form" onSubmit={submit}>
        {needsSource && (
          <label className="field">
            Source name
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. DistroKid, TuneCore"
            />
          </label>
        )}
        <label className="field">
          CSV file
          <input type="file" accept=".csv,text/csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </label>
        <button type="submit" disabled={busy}>
          {busy ? 'Importing…' : 'Import CSV'}
        </button>
      </form>
    </div>
  );
}

export default function Royalties() {
  const [statements, setStatements] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [balance, setBalance] = useState(0);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [pform, setPform] = useState({ payee: '', amount: '', rail: 'venmo', notes: '' });
  const [creating, setCreating] = useState(false);

  const [completeFor, setCompleteFor] = useState(null); // payout id being completed
  const [cform, setCform] = useState({ providerRef: '', executedAt: '', rail: 'venmo' });
  const [completing, setCompleting] = useState(false);

  const loadAll = async () => {
    setError('');
    try {
      const [st, lg, po] = await Promise.all([
        api.get('/royalties/statements'),
        api.get('/royalties/ledger'),
        api.get('/royalties/payouts'),
      ]);
      setStatements(st.data.statements || []);
      setLedger(lg.data.entries || []);
      setBalance(Number(lg.data.balance || 0));
      setPayouts(po.data.payouts || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load royalties.');
    }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      await loadAll();
      if (alive) setLoading(false);
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pset = (k) => (e) => setPform({ ...pform, [k]: e.target.value });

  const createPayout = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.post('/royalties/payouts', {
        payee: pform.payee,
        amount: Number(pform.amount),
        rail: pform.rail,
        notes: pform.notes,
      });
      setPayouts([res.data.payout, ...payouts]);
      setPform({ payee: '', amount: '', rail: 'venmo', notes: '' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create payout.');
    } finally {
      setCreating(false);
    }
  };

  const approve = async (id) => {
    try {
      const res = await api.post(`/royalties/payouts/${id}/approve`);
      setPayouts(payouts.map((p) => (p.id === id ? res.data.payout : p)));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to approve payout.');
    }
  };

  const openComplete = (p) => {
    setCompleteFor(p.id);
    setCform({ providerRef: '', executedAt: '', rail: p.rail || 'venmo' });
  };

  const markComplete = async (e) => {
    e.preventDefault();
    if (!cform.providerRef.trim() || !cform.executedAt) {
      setError('Provider reference and execution date are both required to mark a payout complete.');
      return;
    }
    setCompleting(true);
    try {
      const res = await api.post(`/royalties/payouts/${completeFor}/complete`, {
        providerRef: cform.providerRef,
        executedAt: cform.executedAt,
        rail: cform.rail,
      });
      setPayouts(payouts.map((p) => (p.id === completeFor ? res.data.payout : p)));
      setCompleteFor(null);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to mark payout complete.');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) return <p>Loading…</p>;

  return (
    <div>
      {error && <div className="error-box">{error}</div>}

      <h3 style={{ color: 'var(--gold)', marginTop: 0 }}>Import statements</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        <ImportCard title="Distributor statement" endpoint="/royalties/import" needsSource onDone={loadAll} />
        <ImportCard title="Luminate" endpoint="/luminate/import" onDone={loadAll} />
        <ImportCard title="SoundExchange" endpoint="/soundexchange/import" onDone={loadAll} />
      </div>

      <div className="card">
        <h2>Statements</h2>
        {statements.length === 0 ? (
          <div className="empty-state">
            <p>
              <strong>No statements imported yet.</strong>
            </p>
            <p>Upload a CSV above and it will appear here.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Source</th>
                <th>Period</th>
                <th className="num">Rows</th>
                <th className="num">Total</th>
                <th>Imported</th>
              </tr>
            </thead>
            <tbody>
              {statements.map((s) => (
                <tr key={s.id}>
                  <td className="mono">{s.id}</td>
                  <td>{s.source || '—'}</td>
                  <td>{s.period || '—'}</td>
                  <td className="num">{s.rowCount ?? '—'}</td>
                  <td className="num">{money(s.total)}</td>
                  <td>{s.createdAt ? String(s.createdAt).slice(0, 10) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2>Ledger</h2>
        <p className="hint">
          Running balance: <strong style={{ color: 'var(--gold)' }}>{money(balance)}</strong>
        </p>
        {ledger.length === 0 ? (
          <div className="empty-state">
            <p>
              <strong>No ledger entries yet.</strong>
            </p>
            <p>Entries appear once statements are imported.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Source</th>
                <th className="num">Amount</th>
                <th className="num">Balance</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((e, i) => (
                <tr key={e.id || i}>
                  <td>{e.date ? String(e.date).slice(0, 10) : '—'}</td>
                  <td>{e.description || '—'}</td>
                  <td>{e.source || '—'}</td>
                  <td className="num">{money(e.amount)}</td>
                  <td className="num">{money(e.runningBalance ?? e.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2>Payout batches</h2>
        <div className="info-box">
          <strong>How this works:</strong> create a payout here, approve it, then{' '}
          <strong>execute the payment in your real account</strong> (Venmo, Cash App, wire, or
          other). Come back here and mark it complete by entering the provider's reference number
          and the date you sent it. This app never sends money itself.
        </div>

        <h3>Create a payout</h3>
        <form className="field-form" onSubmit={createPayout} style={{ marginBottom: '1.5rem' }}>
          <div className="form-row">
            <label className="field">
              Payee
              <input type="text" value={pform.payee} onChange={pset('payee')} required />
            </label>
            <label className="field">
              Amount (USD)
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={pform.amount}
                onChange={pset('amount')}
                required
              />
            </label>
            <label className="field">
              Rail
              <select value={pform.rail} onChange={pset('rail')}>
                {RAILS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="field">
            Notes
            <input type="text" value={pform.notes} onChange={pset('notes')} placeholder="Optional" />
          </label>
          <button type="submit" disabled={creating}>
            {creating ? 'Creating…' : 'Create payout (draft)'}
          </button>
        </form>

        {payouts.length === 0 ? (
          <div className="empty-state">
            <p>
              <strong>No payouts yet.</strong>
            </p>
            <p>Create your first payout above.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Payee</th>
                <th className="num">Amount</th>
                <th>Rail</th>
                <th>Status</th>
                <th>Reference</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => (
                <tr key={p.id}>
                  <td>{p.payee}</td>
                  <td className="num">{money(p.amount)}</td>
                  <td>{p.rail}</td>
                  <td>
                    <span className={'badge ' + badgeClass(p.status)}>{p.status}</span>
                  </td>
                  <td className="mono">{p.providerRef || '—'}</td>
                  <td>
                    {p.status === 'draft' && (
                      <button className="btn-secondary btn-small" onClick={() => approve(p.id)}>
                        Approve
                      </button>
                    )}
                    {(p.status === 'approved' || p.status === 'draft') && (
                      <button
                        className="btn-small"
                        style={{ marginLeft: '0.4rem' }}
                        onClick={() => openComplete(p)}
                      >
                        Mark complete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {completeFor && (
          <div className="card" style={{ marginTop: '1rem', borderColor: 'var(--gold)' }}>
            <h3>Mark payout complete</h3>
            <div className="info-box">
              <strong>You execute the payment in your real account, then record it here.</strong>{' '}
              Enter the reference from your payment app/bank and the date it went out.
            </div>
            <form className="field-form" onSubmit={markComplete}>
              <div className="form-row">
                <label className="field">
                  Provider reference
                  <input
                    type="text"
                    value={cform.providerRef}
                    onChange={(e) => setCform({ ...cform, providerRef: e.target.value })}
                    placeholder="e.g. Venmo transaction ID, wire reference"
                    required
                  />
                </label>
                <label className="field">
                  Execution date
                  <input
                    type="date"
                    value={cform.executedAt}
                    onChange={(e) => setCform({ ...cform, executedAt: e.target.value })}
                    required
                  />
                </label>
                <label className="field">
                  Rail used
                  <select value={cform.rail} onChange={(e) => setCform({ ...cform, rail: e.target.value })}>
                    {RAILS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div>
                <button type="submit" disabled={completing}>
                  {completing ? 'Recording…' : 'Record as complete'}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ marginLeft: '0.5rem' }}
                  onClick={() => setCompleteFor(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
