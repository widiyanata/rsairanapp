import { useRef, useEffect, useCallback } from 'react';
import SignaturePad from 'react-signature-canvas';
import Swal from 'sweetalert2';

export default function SignatureCanvas({ base64, onSave, disabled = false }) {
  const sigRef = useRef(null);

  useEffect(() => {
    if (base64 && sigRef.current) {
      // Small delay to ensure canvas is mounted
      setTimeout(() => {
        sigRef.current.fromDataURL(base64, {
          width: 330,
          height: 230,
        });
      }, 100);
    }
  }, [base64]);

  const handleClear = () => {
    if (sigRef.current) {
      sigRef.current.clear();
    }
  };

  const handleSave = () => {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      Swal.fire('Gagal', 'Kanvas kosong, tidak dapat menyimpan tanda tangan.', 'error');
      return;
    }
    const dataURL = sigRef.current.toDataURL('image/png');
    onSave?.(dataURL);
    Swal.fire('Berhasil', 'Tanda tangan disimpan!', 'success');
  };

  return (
    <div className="signature-container">
      <div className="border rounded shadow" style={{ width: '100%', maxWidth: '350px' }}>
        <SignaturePad
          ref={sigRef}
          canvasProps={{
            width: 330,
            height: 230,
            style: {
              width: '100%',
              maxWidth: '350px',
              backgroundColor: '#fff',
              touchAction: 'none',
              cursor: 'crosshair',
            },
          }}
          penColor="black"
          minWidth={1.5}
          maxWidth={2.5}
        />
      </div>
      {!disabled && (
        <div className="my-3">
          <div className="btn-group btn-group-sm">
            <button type="button" onClick={handleClear} className="btn btn-danger">
              <i className="fas fa-trash"></i>
            </button>
            <button type="button" onClick={handleSave} className="btn btn-success">
              <i className="fas fa-save"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
