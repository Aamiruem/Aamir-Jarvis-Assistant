import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { PageHeader } from '../ui.jsx';

export default function VisionPanel() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [preview, setPreview] = useState(null); // { url, width, height }
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), []);

  const startCamera = async () => {
    setError('');
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
      videoRef.current.srcObject = streamRef.current;
      setCameraOn(true);
    } catch (e) {
      setError(`Camera unavailable: ${e.message}`);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setCameraOn(false);
  };

  const analyze = async (blob, width, height) => {
    setPreview({ url: URL.createObjectURL(blob), width, height });
    setBusy(true);
    setResult(null);
    setError('');
    try {
      setResult(await api.analyzeImage(blob, question));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const capture = () => {
    const v = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    canvas.getContext('2d').drawImage(v, 0, 0);
    canvas.toBlob((blob) => analyze(blob, canvas.width, canvas.height), 'image/jpeg', 0.9);
  };

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => analyze(file, img.naturalWidth, img.naturalHeight);
    img.src = URL.createObjectURL(file);
  };

  return (
    <div className="panel">
      <PageHeader icon="eye" hue={290} title="Vision" subtitle="Use your camera or a photo: faces are detected on your PC, and Azarvis describes the scene and answers your question." />

      <div className="row wrap">
        {cameraOn ? (
          <>
            <button className="btn primary" onClick={capture} disabled={busy}>Capture & analyze</button>
            <button className="btn" onClick={stopCamera}>Stop camera</button>
          </>
        ) : (
          <button className="btn primary" onClick={startCamera}>Start camera</button>
        )}
        <label className="btn">
          Upload image
          <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={onFile} />
        </label>
      </div>
      <input
        className="full-input"
        placeholder="Optional question, e.g. 'What objects are on the desk?'"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />

      <div className="vision-grid">
        <video ref={videoRef} autoPlay playsInline muted className={cameraOn ? '' : 'hidden'} />
        {preview && (
          <div className="preview">
            <img src={preview.url} alt="Analyzed" />
            {result?.faces.map((f, i) => (
              <div
                key={i}
                className="face-box"
                style={{
                  left: `${(f.x / preview.width) * 100}%`,
                  top: `${(f.y / preview.height) * 100}%`,
                  width: `${(f.w / preview.width) * 100}%`,
                  height: `${(f.h / preview.height) * 100}%`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {busy && <p className="muted">Analyzing…</p>}
      {error && <div className="error">{error}</div>}
      {result && (
        <div className="card">
          <p><strong>Faces detected:</strong> {result.faces.length}</p>
          <p><strong>Size:</strong> {result.stats.width}×{result.stats.height} · <strong>Brightness:</strong> {result.stats.brightness}/255</p>
          {result.description && <p>{result.description}</p>}
        </div>
      )}
    </div>
  );
}
