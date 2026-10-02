import { useRef, useEffect, useState } from 'react';
import SignaturePad from 'react-signature-canvas';
import Swal from 'sweetalert2';

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

  useEffect(() => {
    if (base64 && sigRef.current) {
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
  };

  const handleSave = () => {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      Swal.fire({
        icon: 'warning',
        title: 'Tanda Tangan Kosong',
        text: 'Silakan goreskan tanda tangan terlebih dahulu pada kanvas.',
        confirmButtonColor: '#1a1a1a',
      });
      return;
    }
    const dataURL = sigRef.current.toDataURL('image/png');
    onSave?.(dataURL);
    Swal.fire({
      icon: 'success',
      title: 'Tersimpan!',
      text: 'Tanda tangan berhasil disimpan.',
      timer: 1200,
      showConfirmButton: false,
    });
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
          canvasProps={{
            width: canvasWidth,
            height: 180,
            style: {
              width: '100%',
              height: '180px',
              backgroundColor: '#ffffff',
              touchAction: 'none',
              cursor: 'crosshair',
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
        <div className="d-flex align-items-center gap-2 mt-3" style={{ maxWidth: '400px' }}>
          <button
            type="button"
            onClick={handleClear}
            className="btn btn-outline-secondary btn-sm flex-fill d-flex align-items-center justify-content-center gap-2 py-2"
            style={{ minHeight: '40px' }}
          >
            <i className="fas fa-undo"></i>
            <span>Hapus</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn btn-dark btn-sm flex-fill d-flex align-items-center justify-content-center gap-2 py-2"
            style={{ minHeight: '40px' }}
          >
            <i className="fas fa-check"></i>
            <span>Simpan TTD</span>
          </button>
        </div>
      )}
    </div>
  );
}

