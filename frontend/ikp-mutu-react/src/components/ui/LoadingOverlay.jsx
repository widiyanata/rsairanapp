import Swal from 'sweetalert2';

export default function LoadingOverlay({ loading }) {
  if (!loading) return null;

  // Also use Swal for consistency with existing UX
  if (loading) {
    Swal.fire({
      title: 'Loading',
      width: 250,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
  }

  return null;
}

export function showLoading() {
  Swal.fire({
    title: 'Loading',
    width: 250,
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
}

export function hideLoading() {
  setTimeout(() => Swal.close(), 300);
}
