import Swal, { type SweetAlertOptions, type SweetAlertResult } from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

// Base configuration for a modern look
const baseConfig: SweetAlertOptions = {
    customClass: {
        popup: 'rounded-3xl shadow-2xl border border-slate-100 p-6 font-sans',
        title: 'text-xl font-bold text-slate-800',
        htmlContainer: 'text-slate-500 text-sm mt-2',
        confirmButton: 'px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all transform active:scale-95',
        cancelButton: 'bg-slate-100 text-slate-600 px-6 py-2.5 rounded-xl font-bold hover:bg-slate-200 transition-all text-sm active:scale-95',
        actions: 'flex gap-3 w-full justify-center mt-6',
        icon: 'scale-75 mb-2'
    },
    buttonsStyling: false,
    width: '24em',
    backdrop: `
        rgba(15, 23, 42, 0.4)
        backdrop-filter: blur(4px)
    `
};

export const showConfirm = async (
    title: string,
    text: string,
    confirmText: string = 'Ya, Lanjutkan',
    cancelText: string = 'Batal',
    icon: 'warning' | 'error' | 'success' | 'info' | 'question' = 'warning',
    variant: 'danger' | 'primary' | 'success' | 'warning' = 'primary'
): Promise<SweetAlertResult> => {

    let confirmBtnClass = 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200';

    if (variant === 'danger') {
        confirmBtnClass = 'bg-red-600 text-white hover:bg-red-700 shadow-red-200';
    } else if (variant === 'success') {
        confirmBtnClass = 'bg-green-600 text-white hover:bg-green-700 shadow-green-200';
    } else if (variant === 'warning') {
        confirmBtnClass = 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-200';
    }

    // Merge custom class
    const config = { ...baseConfig };
    config.customClass = {
        ...baseConfig.customClass,
        confirmButton: `${baseConfig.customClass?.confirmButton} ${confirmBtnClass}`
    };

    return MySwal.fire({
        ...config,
        title,
        text,
        icon,
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        reverseButtons: true
    });
};

export const showSuccess = (title: string, text: string) => {
    const config = { ...baseConfig };
    config.customClass = {
        ...baseConfig.customClass,
        confirmButton: `${baseConfig.customClass?.confirmButton} bg-green-600 text-white hover:bg-green-700 shadow-green-200`
    };

    return MySwal.fire({
        ...config,
        title,
        text,
        icon: 'success',
        confirmButtonText: 'OK',
        timer: 2000,
        timerProgressBar: true
    });
};

export const showError = (title: string, text: string) => {
    const config = { ...baseConfig };
    config.customClass = {
        ...baseConfig.customClass,
        confirmButton: `${baseConfig.customClass?.confirmButton} bg-red-600 text-white hover:bg-red-700 shadow-red-200`
    };

    return MySwal.fire({
        ...config,
        title,
        text,
        icon: 'error',
        confirmButtonText: 'Tutup'
    });
};

export default MySwal;
