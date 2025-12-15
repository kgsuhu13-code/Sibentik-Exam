
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, Download } from 'lucide-react';

const ReceiptPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const data = location.state;

    // Jika diakses langsung tanpa data, kembalikan ke finance
    useEffect(() => {
        if (!data) {
            navigate('/admin/finance');
        }
    }, [data, navigate]);

    if (!data) return null;

    const { schoolName, schoolAddress, receiptNo, date, description, amount, terbilang } = data;

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

            {/* Toolbar Buttons */}
            <div className="mb-6 flex gap-4 print:hidden w-full max-w-[210mm]">
                <button
                    onClick={() => navigate('/admin/finance')}
                    className="px-4 py-2 bg-slate-600 text-white rounded-lg flex items-center gap-2 hover:bg-slate-700"
                >
                    <ArrowLeft className="w-4 h-4" /> Kembali
                </button>
                <div className="flex-1"></div>
                <button
                    onClick={() => window.print()}
                    className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg flex items-center gap-2 hover:bg-green-700 shadow-lg"
                    title="Klik disini lalu pilih 'Save as PDF' di menu printer"
                >
                    <Download className="w-4 h-4" /> Cetak / Download PDF
                </button>
            </div>

            {/* A4 Paper Container - Receipt Format */}
            <div className="bg-white w-[210mm] min-h-[297mm] p-[20mm] print:p-[15mm] shadow-2xl print:shadow-none print:w-[210mm] print:min-h-0 print:h-auto text-slate-900 leading-relaxed relative flex flex-col">

                {/* KOP SURAT (SAMA DENGAN INVOICE) */}
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
                    <div className="w-24"></div>
                </div>

                {/* JUDUL KUITANSI */}
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-black text-slate-800 underline decoration-4 decoration-slate-800 underline-offset-4 mb-2">
                        KUITANSI PEMBAYARAN
                    </h2>
                    <p className="text-slate-500 font-bold font-mono text-lg">NO. {receiptNo}</p>
                </div>

                {/* ISI KUITANSI */}
                <div className="flex-1 px-4">
                    <div className="space-y-6">
                        {/* Telah Terima Dari */}
                        <div className="flex">
                            <div className="w-48 font-bold text-slate-700 text-lg">Telah terima dari</div>
                            <div className="flex-1 border-b-2 border-dotted border-slate-400 pb-1 text-xl font-bold text-slate-900 relative">
                                : &nbsp; {schoolName}
                            </div>
                        </div>

                        {/* Uang Sejumlah */}
                        <div className="flex bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <div className="w-48 font-bold text-slate-700 text-lg flex items-center">Uang Sejumlah</div>
                            <div className="flex-1 text-xl font-serif italic text-slate-800 leading-relaxed capitalize">
                                <span className="font-bold not-italic font-sans mr-2">:</span>
                                "{terbilang} Rupiah"
                            </div>
                        </div>

                        {/* Untuk Pembayaran */}
                        <div className="flex">
                            <div className="w-48 font-bold text-slate-700 text-lg">Untuk Pembayaran</div>
                            <div className="flex-1 border-b-2 border-dotted border-slate-400 pb-1 text-lg text-slate-800 relative">
                                : &nbsp; {description}
                            </div>
                        </div>
                    </div>

                    {/* Nominal Box & Tanda Tangan */}
                    <div className="mt-16 flex justify-between items-end border-t border-slate-200 pt-8">

                        {/* Box Nominal */}
                        <div className="bg-slate-800 text-white px-8 py-4 rounded-tl-3xl rounded-br-3xl shadow-lg transform -rotate-2">
                            <p className="text-sm text-slate-400 font-bold uppercase mb-1">Total Dibayar</p>
                            <h3 className="text-3xl font-black font-mono">
                                Rp {parseAmount(amount)}
                            </h3>
                        </div>

                        {/* Area Tanda Tangan */}
                        <div className="text-center w-64">
                            <p className="text-slate-600 mb-2">Tangerang, {date}</p>
                            <p className="font-bold text-slate-800 text-sm uppercase mb-20">Keuangan / Admin</p>

                            <div className="border-b border-slate-800 mb-2"></div>
                            <p className="font-bold text-slate-900">Sibentik Official</p>
                        </div>
                    </div>
                </div>

                {/* Footer simple */}
                <div className="mt-auto pt-8 text-center text-xs text-slate-400 border-t border-slate-100">
                    Dokumen ini adalah bukti pembayaran yang sah dan diterbitkan secara komputerisasi.
                </div>

                {/* WATERMARK LUNAS */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[150px] font-black text-green-600 opacity-20 -rotate-12 pointer-events-none border-8 border-green-600 rounded-xl px-12 py-4 select-none">
                    LUNAS
                </div>
            </div>
        </div>
    );
};

export default ReceiptPage;
