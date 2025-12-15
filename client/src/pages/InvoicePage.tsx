
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft } from 'lucide-react';

const InvoicePage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const data = location.state;

    // Jika diakses langsung tanpa data, kembalikan ke dashboard
    useEffect(() => {
        if (!data) {
            navigate('/admin-dashboard');
        }
    }, [data, navigate]);

    if (!data) return null;

    const { schoolName, schoolAddress, invoiceNo, date, description, amount, terbilang } = data;

    const parseAmount = (val: any) => {
        return Number(val).toLocaleString('id-ID');
    };

    return (
        <div className="min-h-screen bg-slate-500 p-8 print:p-0 print:bg-white flex flex-col items-center">
            <style>
                {`
                @media print {
                    @page { size: A4; margin: 0; }
                    body { margin: 0; -webkit-print-color-adjust: exact; }
                }
                `}
            </style>

            {/* Toolbar Buttons (Hidden when printing) */}
            <div className="mb-6 flex gap-4 print:hidden w-full max-w-[210mm]">
                <button
                    onClick={() => navigate(data.redirectBack || '/admin-dashboard')}
                    className="px-4 py-2 bg-slate-600 text-white rounded-lg flex items-center gap-2 hover:bg-slate-700"
                >
                    <ArrowLeft className="w-4 h-4" /> Kembali
                </button>
                <div className="flex-1"></div>
                <button
                    onClick={() => window.print()}
                    className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-lg"
                    title="Klik disini lalu pilih 'Save as PDF' di menu printer"
                >
                    <Printer className="w-4 h-4" /> Cetak / Download PDF
                </button>
            </div>

            {/* A4 Paper Container - Optimized for Single Page */}
            <div className="bg-white w-[210mm] min-h-[297mm] p-[20mm] print:p-[15mm] shadow-2xl print:shadow-none print:w-[210mm] print:min-h-0 print:h-auto text-slate-900 leading-relaxed relative flex flex-col">

                {/* KOP SURAT */}
                <div className="flex items-center justify-between border-b-4 border-slate-800 pb-5 mb-8">
                    <div className="w-24 flex justify-center">
                        <img src="/logo.png" alt="Logo" className="w-20 h-20 object-contain" />
                    </div>
                    <div className="flex-1 text-center px-4">
                        <h1 className="text-2xl font-black text-slate-800 tracking-wide uppercase">SIBENTIK EXAM</h1>
                        <p className="text-slate-600 font-medium text-base">Digital Assessment & Learning Management System</p>
                        <p className="text-sm text-slate-500 mt-1 leading-snug">
                            Jl. Pendidikan no.1 Kronjo, Tangerang, Banten
                            <br />
                            Email: sibentikofficial@gmail.com | Web: sibentikexam.id
                        </p>
                    </div>
                    {/* Dummy div for balance */}
                    <div className="w-24"></div>
                </div>

                {/* JUDUL TAGIHAN */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <span className="inline-block px-4 py-1 bg-blue-100 text-blue-800 font-bold border border-blue-200 rounded text-sm mb-2">
                            INVOICE / TAGIHAN
                        </span>
                        <table className="text-sm mt-3">
                            <tbody>
                                <tr>
                                    <td className="w-32 text-slate-500 font-medium">Nomor Invoice</td>
                                    <td className="font-bold font-mono text-lg">: {invoiceNo}</td>
                                </tr>
                                <tr>
                                    <td className="text-slate-500 font-medium">Tanggal</td>
                                    <td className="font-bold">: {date}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="text-right">
                        <p className="text-slate-500 text-sm mb-1">Kepada Yth,</p>
                        <h3 className="text-xl font-bold text-slate-800">{schoolName}</h3>
                        <p className="text-sm text-slate-600 max-w-[250px] leading-snug ml-auto">
                            {schoolAddress || 'Alamat Sekolah'}
                        </p>
                    </div>
                </div>

                {/* TABEL */}
                <table className="w-full mb-8">
                    <thead>
                        <tr className="bg-slate-100 border-y border-slate-200">
                            <th className="py-3 px-4 text-left font-bold text-slate-700 uppercase text-sm w-16">No</th>
                            <th className="py-3 px-4 text-left font-bold text-slate-700 uppercase text-sm">Deskripsi Layanan</th>
                            <th className="py-3 px-4 text-right font-bold text-slate-700 uppercase text-sm w-48">Total (IDR)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="py-4 px-4 text-slate-600 align-top border-b border-slate-100">1</td>
                            <td className="py-4 px-4 text-slate-800 font-medium align-top border-b border-slate-100">
                                <span className="block text-lg mb-1">{description}</span>
                                <span className="text-slate-500 text-sm">
                                    Penyediaan layanan sistem ujian berbasis komputer (CBT Client & Server).
                                </span>
                            </td>
                            <td className="py-4 px-4 text-right font-bold text-slate-800 text-lg align-top border-b border-slate-100">
                                Rp {parseAmount(amount)}
                            </td>
                        </tr>
                    </tbody>
                    <tfoot className="border-t-2 border-slate-800">
                        <tr>
                            <td colSpan={2} className="pt-4 text-right font-bold text-slate-600 text-lg uppercase pr-4">Total Pembayaran</td>
                            <td className="pt-4 text-right font-black text-slate-900 text-2xl">
                                Rp {parseAmount(amount)}
                            </td>
                        </tr>
                    </tfoot>
                </table>

                {/* TERBILANG & INFO */}
                <div className="mb-8 p-5 bg-slate-50 border border-slate-100 rounded-xl">
                    <p className="text-xs text-slate-500 font-bold uppercase mb-1">Terbilang:</p>
                    <p className="text-lg font-serif italic text-slate-800 capitalize">"{terbilang} Rupiah"</p>
                </div>

                {/* FOOTER / TTD */}
                <div className="flex justify-between items-end mt-auto pb-4">
                    <div className="text-sm text-slate-500">
                        <p className="font-bold text-slate-700 mb-2">Metode Pembayaran:</p>
                        <p>Bank BCA - 123 456 7890</p>
                        <p>A.n. PT Sibentik Teknologi</p>
                        <p className="mt-4 italic text-xs">* Harap simpan bukti transfer sebagai bukti pembayaran yang sah.</p>
                    </div>
                    <div className="text-center">
                        <p className="text-slate-600 mb-20">Hormat Kami,</p>
                        <p className="font-bold text-slate-900 underline decoration-2 underline-offset-4">Administrator</p>
                        <p className="text-xs text-slate-500 mt-1">Sibentik Finance Team</p>
                    </div>
                </div>

                {/* WATERMARK */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[150px] font-black text-slate-100 -rotate-45 pointer-events-none select-none z-0">
                    PAID
                </div>
            </div>
        </div>
    );
};

export default InvoicePage;
