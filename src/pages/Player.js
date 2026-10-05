import React, { useEffect, useRef, useState } from 'react';
import api, { audioUrl } from '../api';

export default function Player() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [current, setCurrent] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        let all = [];
        try {
          // Backend supports GET /api/tracks with no releaseId → all tracks.
          const res = await api.get('/tracks');
          all = res.data.tracks || [];
        } catch (e) {
          // Fallback: fetch each release's detail and merge tracks.
          const rel = await api.get('/releases');
          const releases = rel.data.releases || [];
          const details = await Promise.all(
            releases.map((r) => api.get(`/releases/${r.id}`).catch(() => null))
          );
          details.forEach((d) => {
            if (d?.data?.tracks) all = all.concat(d.data.tracks);
          });
        }
        if (!alive) return;
        setTracks(all);
        if (all.length > 0) setCurrent(all[0]);
      } catch (err) {
        if (alive) setError(err.response?.data?.message || err.message || 'Failed to load tracks.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (audioRef.current && current?.filename) {
      audioRef.current.load();
    }
  }, [current]);

  const playNext = () => {
    if (!current) return;
    const i = tracks.findIndex((t) => t.id === current.id);
    setCurrent(tracks[(i + 1) % tracks.length]);
  };
  const playPrev = () => {
    if (!current) return;
    const i = tracks.findIndex((t) => t.id === current.id);
    setCurrent(tracks[(i - 1 + tracks.length) % tracks.length]);
  };

  if (loading) return <p>Loading…</p>;
  if (error) return <div className="error-box">{error}</div>;

  if (tracks.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🎧</div>
        <p>
          <strong>No tracks to play.</strong>
        </p>
        <p>Upload tracks to a release to play them here.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <h2>Now playing</h2>
        {current ? (
          <div>
            <p style={{ fontSize: '1.2rem', margin: '0 0 0.5rem' }}>
              <strong>{current.title}</strong>
              {current.isrc && <span className="hint"> · ISRC {current.isrc}</span>}
            </p>
            {current.filename ? (
              <audio ref={audioRef} controls onEnded={playNext} style={{ width: '100%' }}>
                <source src={audioUrl(current.filename)} />
                Your browser does not support audio playback.
              </audio>
            ) : (
              <p className="hint">No audio file attached to this track.</p>
            )}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
              <button className="btn-secondary" onClick={playPrev}>
                ⏮ Prev
              </button>
              <button className="btn-secondary" onClick={playNext}>
                Next ⏭
              </button>
            </div>
          </div>
        ) : (
          <p className="hint">Select a track below.</p>
        )}
      </div>

      <div className="card">
        <h2>Playlist ({tracks.length})</h2>
        <ul className="list-plain">
          {tracks.map((t) => (
            <li
              key={t.id}
              onClick={() => setCurrent(t)}
              style={{
                cursor: 'pointer',
                background: current?.id === t.id ? 'var(--bg-card-2)' : 'transparent',
                borderRadius: '6px',
                paddingLeft: '0.5rem',
                paddingRight: '0.5rem',
              }}
            >
              <span>
                <strong>{t.title}</strong>
                {t.isrc && <span className="hint"> · {t.isrc}</span>}
                {t.releaseTitle && <span className="hint"> — {t.releaseTitle}</span>}
              </span>
              <span className="hint">{current?.id === t.id ? '▶' : ''}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
