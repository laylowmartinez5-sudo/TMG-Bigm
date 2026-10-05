import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const money = (n) =>
  '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [ov, rel] = await Promise.all([
          api.get('/analytics/overview'),
          api.get('/releases'),
        ]);
        if (!alive) return;
        setOverview(ov.data);
        setReleases(rel.data.releases || []);
      } catch (err) {
        if (alive) setError(err.response?.data?.message || err.message || 'Failed to load dashboard.');
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
  const trackCount = (overview?.trackCount ?? releases.reduce((n, r) => n + (r.trackCount || 0), 0));
  const hasRoyalties = (totals.statementCount || 0) > 0;

  return (
    <div>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="label">Total gross royalties</div>
          <div className="value">{hasRoyalties ? money(totals.grossAmount) : '—'}</div>
          {!hasRoyalties && <div className="hint">No royalty data imported yet.</div>}
        </div>
        <div className="stat-card">
          <div className="label">Statements imported</div>
          <div className="value">{hasRoyalties ? totals.statementCount : '—'}</div>
          {!hasRoyalties && <div className="hint">No royalty data imported yet.</div>}
        </div>
        <div className="stat-card">
          <div className="label">Releases</div>
          <div className="value">{releases.length || '—'}</div>
          {releases.length === 0 && <div className="hint">No releases yet.</div>}
        </div>
        <div className="stat-card">
          <div className="label">Tracks</div>
          <div className="value">{trackCount || '—'}</div>
          {!trackCount && <div className="hint">No tracks uploaded yet.</div>}
        </div>
      </div>

      <div className="card">
        <h2>Recent releases</h2>
        {releases.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💿</div>
            <p>
              <strong>No releases yet.</strong>
            </p>
            <p>
              <Link to="/releases">Create your first release</Link> to start building your catalog.
            </p>
          </div>
        ) : (
          <ul className="list-plain">
            {releases.slice(0, 5).map((r) => (
              <li key={r.id}>
                <span>
                  <Link to={`/releases/${r.id}`}>{r.title}</Link>
                  <span className="hint"> — {r.artist || 'Unknown artist'}</span>
                </span>
                <span className="hint">{r.releaseType || ''}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!hasRoyalties && (
        <div className="info-box">
          <strong>Royalty data is empty until you import it.</strong> Go to{' '}
          <Link to="/royalties">Royalties</Link> to upload a distributor, Luminate, or SoundExchange
          CSV. This app never invents numbers — what you import is what you see.
        </div>
      )}
    </div>
  );
}
