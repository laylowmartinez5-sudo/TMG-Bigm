import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api, { audioUrl } from '../api';

export default function ReleaseDetail() {
  const { id } = useParams();
  const [release, setRelease] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const [upload, setUpload] = useState({ title: '', isrc: '', trackNumber: '', file: null });
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');

  const [pkg, setPkg] = useState(null);
  const [packaging, setPackaging] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/releases/${id}`);
      setRelease(res.data.release);
      setTracks(res.data.tracks || []);
      setEditForm(res.data.release || {});
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load release.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const eset = (k) => (e) => setEditForm({ ...editForm, [k]: e.target.value });

  const saveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put(`/releases/${id}`, {
        title: editForm.title,
        artist: editForm.artist,
        releaseType: editForm.releaseType,
        releaseDate: editForm.releaseDate,
        upc: editForm.upc,
      });
      setRelease(res.data.release);
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save release.');
    } finally {
      setSaving(false);
    }
  };

  const submitTrack = async (e) => {
    e.preventDefault();
    if (!upload.file) {
      setUploadMsg('Choose an audio file to upload.');
      return;
    }
    setUploading(true);
    setUploadMsg('');
    try {
      const fd = new FormData();
      fd.append('audio', upload.file);
      fd.append('releaseId', id);
      fd.append('title', upload.title);
      fd.append('isrc', upload.isrc);
      fd.append('trackNumber', upload.trackNumber);
      const res = await api.post('/tracks/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setTracks([...tracks, res.data.track]);
      setUpload({ title: '', isrc: '', trackNumber: '', file: null });
      setUploadMsg('Track uploaded.');
    } catch (err) {
      setUploadMsg(err.response?.data?.message || err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const deleteTrack = async (trackId) => {
    if (!window.confirm('Delete this track?')) return;
    try {
      await api.delete(`/tracks/${trackId}`);
      setTracks(tracks.filter((t) => t.id !== trackId));
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to delete track.');
    }
  };

  const preparePackage = async () => {
    setPackaging(true);
    setPkg(null);
    try {
      const res = await api.post(`/releases/${id}/package`);
      setPkg(res.data.package);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to prepare package.');
    } finally {
      setPackaging(false);
    }
  };

  if (loading) return <p>Loading…</p>;
  if (error && !release) return <div className="error-box">{error}</div>;
  if (!release) return <div className="empty-state">Release not found.</div>;

  return (
    <div>
      {error && <div className="error-box">{error}</div>}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>{release.title}</h2>
          <button className="btn-secondary btn-small" onClick={() => setEditing(!editing)}>
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>
        {editing ? (
          <form className="field-form" onSubmit={saveEdit}>
            <div className="form-row">
              <label className="field">
                Title
                <input type="text" value={editForm.title || ''} onChange={eset('title')} required />
              </label>
              <label className="field">
                Artist
                <input type="text" value={editForm.artist || ''} onChange={eset('artist')} />
              </label>
            </div>
            <div className="form-row">
              <label className="field">
                Release type
                <select value={editForm.releaseType || 'single'} onChange={eset('releaseType')}>
                  <option value="single">Single</option>
                  <option value="ep">EP</option>
                  <option value="album">Album</option>
                  <option value="mixtape">Mixtape</option>
                </select>
              </label>
              <label className="field">
                Release date
                <input
                  type="date"
                  value={editForm.releaseDate ? String(editForm.releaseDate).slice(0, 10) : ''}
                  onChange={eset('releaseDate')}
                />
              </label>
              <label className="field">
                UPC
                <input type="text" value={editForm.upc || ''} onChange={eset('upc')} />
              </label>
            </div>
            <button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        ) : (
          <div>
            <p>
              <strong>Artist:</strong> {release.artist || '—'}
            </p>
            <p>
              <strong>Type:</strong> {release.releaseType || '—'}
              {' · '}
              <strong>Date:</strong> {release.releaseDate ? String(release.releaseDate).slice(0, 10) : '—'}
              {' · '}
              <strong>UPC:</strong> {release.upc || '—'}
            </p>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Tracks ({tracks.length})</h2>
        {tracks.length === 0 ? (
          <div className="empty-state">
            <p>
              <strong>No tracks yet.</strong>
            </p>
            <p>Upload audio below to add the first one.</p>
          </div>
        ) : (
          <ul className="list-plain">
            {tracks.map((t) => (
              <li key={t.id}>
                <div style={{ flex: 1 }}>
                  <strong>
                    {t.trackNumber ? `${t.trackNumber}. ` : ''}
                    {t.title}
                  </strong>
                  {t.isrc && <span className="hint"> · ISRC {t.isrc}</span>}
                  {t.filename && <audio controls src={audioUrl(t.filename)} preload="none" />}
                </div>
                <button className="btn-danger btn-small" onClick={() => deleteTrack(t.id)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <h2>Upload a track</h2>
        {uploadMsg && <div className="info-box">{uploadMsg}</div>}
        <form className="field-form" onSubmit={submitTrack}>
          <div className="form-row">
            <label className="field">
              Title
              <input
                type="text"
                value={upload.title}
                onChange={(e) => setUpload({ ...upload, title: e.target.value })}
                required
              />
            </label>
            <label className="field">
              ISRC
              <input
                type="text"
                value={upload.isrc}
                onChange={(e) => setUpload({ ...upload, isrc: e.target.value })}
                placeholder="Optional"
              />
            </label>
            <label className="field">
              Track #
              <input
                type="number"
                value={upload.trackNumber}
                onChange={(e) => setUpload({ ...upload, trackNumber: e.target.value })}
                placeholder="Optional"
              />
            </label>
          </div>
          <label className="field">
            Audio file
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setUpload({ ...upload, file: e.target.files?.[0] || null })}
            />
          </label>
          <button type="submit" disabled={uploading}>
            {uploading ? 'Uploading…' : 'Upload track'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Delivery package</h2>
        <p className="hint">
          Checks what this release still needs before it can go out for distribution.
        </p>
        <button onClick={preparePackage} disabled={packaging}>
          {packaging ? 'Checking…' : 'Prepare delivery package'}
        </button>
        {pkg && (
          <div style={{ marginTop: '1rem' }}>
            <ul className="checklist">
              {Object.entries(pkg).map(([key, value]) => {
                const ok = value === true || (value !== false && value !== null && value !== '' && value !== 0);
                return (
                  <li key={key}>
                    <span className={ok ? 'check-ok' : 'check-missing'}>{ok ? '✔' : '⚠'}</span>
                    <strong>{key}:</strong>{' '}
                    <span className="hint">
                      {typeof value === 'boolean' ? (value ? 'ready' : 'missing') : String(value)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
