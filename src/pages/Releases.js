import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function Releases() {
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', artist: '', releaseType: 'single', releaseDate: '', upc: '' });
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/releases');
      setReleases(res.data.releases || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load releases.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.post('/releases', form);
      setReleases([res.data.release, ...releases]);
      setForm({ title: '', artist: '', releaseType: 'single', releaseDate: '', upc: '' });
      setShowForm(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create release.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '＋ New release'}
        </button>
      </div>

      {error && <div className="error-box">{error}</div>}

      {showForm && (
        <div className="card">
          <h2>New release</h2>
          <form className="field-form" onSubmit={submit}>
            <div className="form-row">
              <label className="field">
                Title
                <input type="text" value={form.title} onChange={set('title')} required />
              </label>
              <label className="field">
                Artist
                <input type="text" value={form.artist} onChange={set('artist')} required />
              </label>
            </div>
            <div className="form-row">
              <label className="field">
                Release type
                <select value={form.releaseType} onChange={set('releaseType')}>
                  <option value="single">Single</option>
                  <option value="ep">EP</option>
                  <option value="album">Album</option>
                  <option value="mixtape">Mixtape</option>
                </select>
              </label>
              <label className="field">
                Release date
                <input type="date" value={form.releaseDate} onChange={set('releaseDate')} />
              </label>
              <label className="field">
                UPC
                <input type="text" value={form.upc} onChange={set('upc')} placeholder="Optional" />
              </label>
            </div>
            <button type="submit" disabled={creating}>
              {creating ? 'Creating…' : 'Create release'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <p>Loading…</p>
      ) : releases.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💿</div>
          <p>
            <strong>No releases yet.</strong>
          </p>
          <p>Hit “New release” above to create your first one.</p>
        </div>
      ) : (
        <div className="card">
          <ul className="list-plain">
            {releases.map((r) => (
              <li key={r.id}>
                <span>
                  <Link to={`/releases/${r.id}`}>{r.title}</Link>
                  <span className="hint">
                    {' '}
                    — {r.artist || 'Unknown artist'}
                    {r.upc ? ` · UPC ${r.upc}` : ''}
                  </span>
                </span>
                <span className="hint">{r.releaseType || ''}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
