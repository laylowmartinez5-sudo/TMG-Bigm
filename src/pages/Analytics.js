import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const money = (n) =>
  '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function BarRow({ label, amount, max }) {
  const pct = max > 0 ? (amount / max) * 100 : 0;
  return (
    <div className="bar-row">
      <span>{label}</span>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="bar-amount">{money(amount)}</span>
    </div>
  );
}

export default function Analytics() {
  const [overview, setOverview] = useState(null);
  const [byRelease, setByRelease] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [ov, br] = await Promise.all([
          api.get('/analytics/overview'),
          api.get('/analytics/by-release'),
        ]);
        if (!alive) return;
        setOverview(ov.data);
        setByRelease(Array.isArray(br.data) ? br.data : br.data?.releases || []);
      } catch (err) {
        if (alive) setError(err.response?.data?.message || err.message || 'Failed to load analytics.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) return <p>Loading…</p>;
  if (error) return <div className="error-box">{error}</div>;

  const totals = overview?.totals || {};
  const hasData = (totals.statementCount || 0) > 0;
  const byDsp = overview?.byDsp || [];
  const byTerritory = overview?.byTerritory || [];
  const maxDsp = Math.max(0, ...byDsp.map((d) => Number(d.amount || 0)));
  const maxTerr = Math.max(0, ...byTerritory.map((t) => Number(t.amount || 0)));

  if (!hasData) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📈</div>
        <p>
          <strong>No royalty data imported yet.</strong>
        </p>
        <p>
          Analytics are built from your CSV imports. <Link to="/royalties">Import a statement</Link>{' '}
          and the numbers will show up here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="label">Total gross</div>
          <div className="value">{money(totals.grossAmount)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Statements imported</div>
          <div className="value">{totals.statementCount || 0}</div>
        </div>
        <div className="stat-card">
          <div className="label">Rows processed</div>
          <div className="value">{totals.rowCount || 0}</div>
        </div>
      </div>

      <div className="card">
        <h2>By DSP</h2>
        {byDsp.length === 0 ? (
          <p className="hint">No DSP breakdown in the imported data.</p>
        ) : (
          byDsp.map((d, i) => (
            <BarRow key={i} label={d.dsp || d.name || 'Unknown'} amount={Number(d.amount || 0)} max={maxDsp} />
          ))
        )}
      </div>

      <div className="card">
        <h2>By territory</h2>
        {byTerritory.length === 0 ? (
          <p className="hint">No territory breakdown in the imported data.</p>
        ) : (
          byTerritory.map((t, i) => (
            <BarRow key={i} label={t.territory || t.name || 'Unknown'} amount={Number(t.amount || 0)} max={maxTerr} />
          ))
        )}
      </div>

      <div className="card">
        <h2>Per release</h2>
        {byRelease.length === 0 ? (
          <p className="hint">No per-release earnings in the imported data.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Release</th>
                <th className="num">Gross</th>
              </tr>
            </thead>
            <tbody>
              {byRelease.map((r, i) => (
                <tr key={r.releaseId || i}>
                  <td>
                    {r.releaseId ? (
                      <Link to={`/releases/${r.releaseId}`}>{r.title || 'Untitled'}</Link>
                    ) : (
                      r.title || 'Untitled'
                    )}
                  </td>
                  <td className="num">{money(r.gross)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
