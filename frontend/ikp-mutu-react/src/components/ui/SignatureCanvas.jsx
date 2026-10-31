import { useRef, useEffect, useState } from 'react';
import SignaturePad from 'react-signature-canvas';

export default function SignatureCanvas({ base64, onSave, disabled = false }) {
  const sigRef = useRef(null);
  const containerRef = useRef(null);
  const [canvasWidth, setCanvasWidth] = useState(320);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const measured = containerRef.current.offsetWidth;
        if (measured > 0) {
          // Keep canvas responsive but bounded nicely
          setCanvasWidth(Math.min(measured - 4, 400));
        }
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const lastEmitted = useRef(null);

  useEffect(() => {
    // Jangan gambar ulang TTD yang baru saja dihasilkan kanvas ini sendiri
    if (base64 && sigRef.current && base64 !== lastEmitted.current) {
      setTimeout(() => {
        sigRef.current.fromDataURL(base64, {
          width: canvasWidth,
          height: 180,
        });
      }, 150);
    }
  }, [base64, canvasWidth]);

  const handleClear = () => {
    if (sigRef.current) {
      sigRef.current.clear();
    }
    onSave?.('');
  };

  // Simpan otomatis setiap selesai satu goresan
  const handleEnd = () => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
      lastEmitted.current = sigRef.current.toDataURL('image/png');
      onSave?.(lastEmitted.current);
    }
  };

  return (
    <div className="signature-container w-100" ref={containerRef}>
      <div className="d-flex align-items-center justify-content-between mb-2">
        <span className="small text-muted" style={{ fontSize: '11px' }}>
          <i className="fas fa-pen-nib me-1"></i> Goreskan tanda tangan dengan jari / stylus:
        </span>
      </div>

      <div
        className="signature-box border rounded-3 overflow-hidden shadow-sm bg-white position-relative"
        style={{ width: '100%', maxWidth: '400px' }}
      >
        <SignaturePad
          ref={sigRef}
          onEnd={handleEnd}
          canvasProps={{
            width: canvasWidth,
            height: 180,
            style: {
              width: '100%',
              height: '180px',
              backgroundColor: '#ffffff',
              touchAction: 'none',
              cursor: disabled ? 'not-allowed' : 'crosshair',
              pointerEvents: disabled ? 'none' : 'auto',
              display: 'block',
            },
          }}
          penColor="#111827"
          minWidth={1.8}
          maxWidth={3.0}
        />
        {/* Subtle guide line */}
        <div
          className="position-absolute border-bottom border-secondary border-opacity-25"
          style={{ left: '20px', right: '20px', bottom: '35px', pointerEvents: 'none' }}
        ></div>
      </div>

      {!disabled && (
        <div className="d-flex align-items-center justify-content-between gap-2 mt-2" style={{ maxWidth: '400px' }}>
          <span className="small text-muted" style={{ fontSize: '11px' }}>
            {base64 ? <><i className="fas fa-check text-success me-1"></i>Tersimpan otomatis</> : 'Belum ada tanda tangan'}
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2"
          >
            <i className="fas fa-undo"></i>
            <span>Hapus</span>
          </button>
        </div>
      )}
    </div>
  );
}

