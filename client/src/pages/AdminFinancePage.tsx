
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer, Calendar, Search, CreditCard, DollarSign, Wallet, CheckCircle } from 'lucide-react';
import api from '../services/api';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

interface School {
    id: number;
    name: string;
    address: string;
    subscription_status: string;
    subscription_end_date: string | null;
    student_count: number;
    teacher_count: number;
}

interface Payment {
    id: number;
    school_name: string;
    amount: string;
    description: string;
    receipt_no: string;
    payment_date: string;
}

const AdminFinancePage = () => {
    const navigate = useNavigate();
    const [schools, setSchools] = useState<School[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchSchools();
        fetchPayments();
    }, []);

    const fetchSchools = async () => {
        try {
            const res = await api.get('/admin/schools');
            setSchools(res.data);
        } catch (error) {
            console.error('Failed to fetch schools:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPayments = async () => {
        try {
            const res = await api.get('/admin/payments');
            setPayments(res.data);
        } catch (error) {
            console.error('Failed to fetch payments', error);
        }
    };

    // Helper Terbilang
    const convertTerbilang = (nilai: number): string => {
        const huruf = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
        let temp = "";
        if (nilai < 12) {
            temp = " " + huruf[nilai];
        } else if (nilai < 20) {
            temp = convertTerbilang(nilai - 10) + " Belas";
        } else if (nilai < 100) {
            temp = convertTerbilang(Math.floor(nilai / 10)) + " Puluh" + convertTerbilang(nilai % 10);
        } else if (nilai < 200) {
            temp = " Seratus" + convertTerbilang(nilai - 100);
        } else if (nilai < 1000) {
            temp = convertTerbilang(Math.floor(nilai / 100)) + " Ratus" + convertTerbilang(nilai % 100);
        } else if (nilai < 2000) {
            temp = " Seribu" + convertTerbilang(nilai - 1000);
        } else if (nilai < 1000000) {
            temp = convertTerbilang(Math.floor(nilai / 1000)) + " Ribu" + convertTerbilang(nilai % 1000);
        } else if (nilai < 1000000000) {
            temp = convertTerbilang(Math.floor(nilai / 1000000)) + " Juta" + convertTerbilang(nilai % 1000000);
        }
        return temp;
    }

    const formatDateTime = (dateStr: any) => {
        if (!dateStr) return '-';
        try {
            return new Date(dateStr).toLocaleDateString('id-ID', {
                dateStyle: 'medium'
            });
        } catch (e) {
            return String(dateStr);
        }
    };

    const handleConfirmPayment = async (school: School) => {
        const currentEnd = school.subscription_end_date ? new Date(school.subscription_end_date) : new Date();
        const effectiveStart = (school.subscription_end_date && new Date(school.subscription_end_date) > new Date())
            ? new Date(school.subscription_end_date)
            : new Date();

        const { value: duration } = await MySwal.fire({
            title: 'Konfirmasi Pembayaran',
            html: `<p class="text-sm text-slate-500 mb-4">Sekolah: <b>${school.name}</b></p>
                   <p class="text-sm">Pilih durasi perpanjangan layanan:</p>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Lanjutkan',
            cancelButtonText: 'Batal',
            input: 'select',
            inputOptions: {
                '1': 'Paket 1 Bulan',
                '6': 'Paket 6 Bulan (1 Semester)',
                '12': 'Paket 1 Tahun',
                'custom': '📅 Input Tanggal Manual'
            },
            inputPlaceholder: 'Pilih Durasi...',
            confirmButtonColor: '#16a34a'
        });

        if (duration) {
            let finalDate = '';

            if (duration === 'custom') {
                const { value: manualDate } = await MySwal.fire({
                    title: 'Pilih Tanggal Berakhir',
                    input: 'date',
                    inputValue: effectiveStart.toISOString().split('T')[0]
                });
                if (!manualDate) return;
                finalDate = manualDate;
            } else {
                let newDate = new Date(effectiveStart);
                newDate.setMonth(newDate.getMonth() + parseInt(duration));
                finalDate = newDate.toISOString().split('T')[0];
            }

            try {
                MySwal.fire({
                    title: 'Memproses...',
                    didOpen: () => Swal.showLoading()
                });

                await api.put(`/admin/schools/${school.id}/subscription`, {
                    end_date: finalDate,
                    status: 'active',
                    payment_amount: duration === 'custom' ? 0 : (Number(school.student_count || 0) + Number(school.teacher_count || 0)) * 10000 * parseInt(duration),
                    payment_desc: duration === 'custom' ? 'Perpanjangan Manual' : `Perpanjangan ${duration} Bulan`
                });

                await fetchSchools();
                await fetchPayments();

                const result = await MySwal.fire({
                    icon: 'success',
                    title: 'Pembayaran Berhasil!',
                    text: `Masa aktif diperpanjang hingga ${new Date(finalDate).toLocaleDateString('id-ID', { dateStyle: 'long' })}`,
                    showCancelButton: true,
                    confirmButtonText: '🖨️ Cetak Kuitansi / PDF',
                    cancelButtonText: 'Tutup',
                    confirmButtonColor: '#16a34a'
                });

                if (result.isConfirmed) {
                    // Calculate Amount for Receipt
                    const totalAccounts = Number(school.student_count || 0) + Number(school.teacher_count || 0);
                    let multiplier = 1;
                    let descDuration = "Perpanjangan Layanan";

                    if (duration === '1') { multiplier = 1; descDuration = "Perpanjangan Layanan 1 Bulan"; }
                    else if (duration === '6') { multiplier = 6; descDuration = "Perpanjangan Layanan 1 Semester (6 Bulan)"; }
                    else if (duration === '12') { multiplier = 12; descDuration = "Perpanjangan Layanan 1 Tahun"; }

                    const amount = totalAccounts * 10000 * multiplier;
                    const terbilangText = convertTerbilang(amount) + " Rupiah";

                    navigate('/admin/receipt-print', {
                        state: {
                            schoolName: school.name,
                            schoolAddress: school.address,
                            receiptNo: `RCP/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
                            date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
                            description: descDuration + ` (${totalAccounts} User)`,
                            amount: amount,
                            terbilang: terbilangText,
                            redirectBack: '/admin/finance'
                        }
                    });
                }

            } catch (error) {
                MySwal.fire('Gagal', 'Terjadi kesalahan saat memperbarui data', 'error');
            }
        }
    };

    const handleCreateInvoice = async (school: School) => {
        const totalAccounts = Number(school.student_count || 0) + Number(school.teacher_count || 0);
        const autoAmount = totalAccounts * 10000;
        const formattedAmount = autoAmount.toLocaleString('id-ID');

        const { value: formValues } = await MySwal.fire({
            title: 'Konfirmasi Invoice Otomatis',
            html: `
                <div class="text-left bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm space-y-2 mb-4">
                    <div class="flex justify-between">
                        <span class="text-slate-500">Sekolah:</span>
                        <span class="font-bold text-slate-800">${school.name}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-500">Total Akun (Siswa+Guru):</span>
                        <span class="font-bold text-slate-800">${totalAccounts} User</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-500">Harga per Akun:</span>
                        <span class="font-bold text-slate-800">Rp 10.000</span>
                    </div>
                    <div class="border-t border-slate-200 my-2 pt-2 flex justify-between text-lg">
                        <span class="font-bold text-slate-600">Total Tagihan:</span>
                        <span class="font-bold text-blue-600">Rp ${formattedAmount}</span>
                    </div>
                </div>

                <div class="text-left mb-1 text-sm font-bold text-slate-600">Keterangan Layanan</div>
                <input id="swal-desc" class="swal2-input" value="Layanan CBT & LMS (${totalAccounts} User)" placeholder="Deskripsi">
                
                <div class="text-left mt-3 mb-1 text-sm font-bold text-slate-600">No. Invoice (Opsional)</div>
                <input id="swal-no" class="swal2-input" placeholder="Auto Generate">
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Generate Invoice',
            confirmButtonColor: '#2563eb',
            preConfirm: () => {
                return [
                    (document.getElementById('swal-desc') as HTMLInputElement).value,
                    autoAmount,
                    (document.getElementById('swal-no') as HTMLInputElement).value
                ]
            }
        });

        if (formValues) {
            const [desc, amountVal, noInv] = formValues;
            const amount = parseInt(amountVal);

            const terbilangText = convertTerbilang(amount) + " Rupiah";

            navigate('/admin/invoice-print', {
                state: {
                    schoolName: school.name,
                    schoolAddress: school.address,
                    invoiceNo: noInv || `INV/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${Math.floor(100 + Math.random() * 900)}`,
                    date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
                    description: desc,
                    amount: amount,
                    terbilang: terbilangText,
                    redirectBack: '/admin/finance'
                }
            });
        }
    };

    const filteredSchools = schools.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

    // Kalkulasi Statistik Real-Time
    const totalPotentialRevenue = schools.reduce((acc, curr) => {
        const users = Number(curr.student_count || 0) + Number(curr.teacher_count || 0);
        return acc + (users * 10000); // Asumsi Rp 10.000 per user
    }, 0);

    const billingTargetCount = schools.filter(s => {
        if (!s.subscription_end_date) return true; // Belum aktif = perlu ditagih
        const exp = new Date(s.subscription_end_date);
        const now = new Date();

        // Sekolah yang SUDAH expired ATAU akan expired BULAN INI
        const isExpired = exp < now;
        const isExpiringThisMonth = exp.getMonth() === now.getMonth() && exp.getFullYear() === now.getFullYear();

        return isExpired || isExpiringThisMonth;
    }).length;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Manajemen Keuangan</h1>
                <p className="text-slate-500 mt-1">Kelola tagihan, invoice, dan status pembayaran sekolah.</p>
            </div>

            {/* Finance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                        <Wallet className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Total Klien Aktif</p>
                        <h3 className="text-xl font-bold text-slate-800">{filteredSchools.length} Sekolah</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-full">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Potensi Revenue</p>
                        <h3 className="text-xl font-bold text-slate-800">Rp {totalPotentialRevenue.toLocaleString('id-ID')}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full">
                        <Printer className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Tagihan Bulan Ini</p>
                        <h3 className="text-xl font-bold text-slate-800">{billingTargetCount} Sekolah</h3>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">Daftar Billing Sekolah</h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Cari sekolah..."
                            className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Nama Sekolah</th>
                                <th className="px-6 py-4">Sisa Masa Aktif</th>
                                <th className="px-6 py-4">Status Tagihan</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredSchools.map((school) => {
                                const expiryDate = school.subscription_end_date ? new Date(school.subscription_end_date) : null;
                                const isExpired = expiryDate ? expiryDate < new Date() : false;
                                const daysLeft = expiryDate ? Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;

                                let billingStatus = <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-bold">LUNAS</span>;
                                if (isExpired) {
                                    billingStatus = <span className="text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-bold">PERLU DIPERPANJANG</span>;
                                } else if (daysLeft < 30) {
                                    billingStatus = <span className="text-yellow-600 bg-yellow-50 px-2 py-1 rounded text-xs font-bold">TAGIHAN MENDEKATI ({daysLeft} hari)</span>;
                                }

                                return (
                                    <tr key={school.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-800">{school.name}</p>
                                            <p className="text-xs text-slate-400 truncate max-w-[200px]">{school.address}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                {expiryDate ? expiryDate.toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {billingStatus}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleCreateInvoice(school)}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                                                >
                                                    <Printer className="w-4 h-4" />
                                                    Buat Invoice
                                                </button>
                                                <button
                                                    onClick={() => handleConfirmPayment(school)}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-all shadow-sm"
                                                    title="Konfirmasi Lunas & Perpanjang"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    Lunas
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Riwayat Transaksi */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800">Riwayat Transaksi Masuk</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">No. Kuitansi</th>
                                <th className="px-6 py-4">Tanggal</th>
                                <th className="px-6 py-4">Sekolah</th>
                                <th className="px-6 py-4">Keterangan</th>
                                <th className="px-6 py-4 text-right">Nominal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {payments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Belum ada riwayat transaksi</td>
                                </tr>
                            ) : (
                                payments.map((pay) => (
                                    <tr key={pay.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs text-slate-500">{pay.receipt_no}</td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {formatDateTime(pay.payment_date)}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-700">{pay.school_name}</td>
                                        <td className="px-6 py-4 text-slate-600">{pay.description}</td>
                                        <td className="px-6 py-4 text-right font-bold text-green-600">
                                            + Rp {Number(pay.amount).toLocaleString('id-ID')}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminFinancePage;
