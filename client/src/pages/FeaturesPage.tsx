
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bot, Shield, Smartphone, Zap, CheckCircle,
    ArrowRight, BookOpen, Clock, FileText, Monitor,
    Lock, Award, BarChart2, Globe
} from 'lucide-react';
import { motion } from 'framer-motion';

const FeaturesPage: React.FC = () => {
    const navigate = useNavigate();

    const fadeInUp = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    return (
        <div className="font-sans text-slate-900 bg-white">
            {/* --- NAVBAR SIMPLE --- */}
            <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                            <span className="font-bold text-lg tracking-tight text-slate-800">SIBENTIK<span className="text-blue-600">EXAM</span></span>
                        </div>
                        <button
                            onClick={() => navigate('/login')}
                            className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-all"
                        >
                            Masuk Aplikasi
                        </button>
                    </div>
                </div>
            </nav>

            {/* --- HERO SECTION --- */}
            <section className="pt-32 pb-20 bg-gradient-to-b from-blue-50 to-white">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider rounded-full mb-6"
                    >
                        Tur Fitur & Kapabilitas
                    </motion.span>
                    <motion.h1
                        initial="hidden"
                        animate="visible"
                        variants={fadeInUp}
                        className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight"
                    >
                        Lebih Dari Sekadar <br className="hidden md:block" />
                        <span className="text-blue-600">Aplikasi Ujian Online</span>
                    </motion.h1>
                    <motion.p
                        initial="hidden"
                        animate="visible"
                        variants={fadeInUp}
                        className="text-lg text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto"
                    >
                        Pelajari bagaimana Sibentik Exam membantu sekolah Anda mengelola siklus evaluasi secara menyeluruh, dari pembuatan soal dengan AI hingga analisis nilai otomatis.
                    </motion.p>
                </div>
            </section>

            {/* --- CORE WORKFLOW TOUR (ZIG-ZAG) --- */}
            <div className="space-y-0">
                {/* 1. BANK SOAL & AI */}
                <section className="py-20 bg-white overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                                className="order-2 lg:order-1 relative"
                            >
                                {/* Decorative elements */}
                                <div className="absolute -left-10 -top-10 w-40 h-40 bg-purple-100 rounded-full blur-3xl opacity-50"></div>
                                <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                                    {/* Mock Component Representation */}
                                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                                        <Bot className="w-5 h-5 text-purple-600" />
                                        <span className="font-bold text-sm text-slate-700">AI Assistant</span>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div className="flex gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0"></div>
                                            <div className="bg-slate-100 rounded-lg rounded-tl-none p-3 text-sm text-slate-600 w-3/4">
                                                Buatkan saya 5 soal pilihan ganda tentang Hukum Newton untuk kelas X Fisika.
                                            </div>
                                        </div>
                                        <div className="flex gap-3 flex-row-reverse">
                                            <div className="w-8 h-8 rounded-full bg-purple-100 shrink-0 flex items-center justify-center text-purple-600"><Bot className="w-4 h-4" /></div>
                                            <div className="bg-purple-50 border border-purple-100 rounded-lg rounded-tr-none p-3 text-sm text-slate-700 w-3/4">
                                                <p className="mb-2 font-medium text-purple-700">Tentu, ini draf soalnya:</p>
                                                <ul className="list-disc pl-4 space-y-1 text-xs">
                                                    <li>Hukum I Newton (Inersia)...</li>
                                                    <li>Rumus F = m.a...</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                            <div className="order-1 lg:order-2">
                                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
                                    <Bot className="w-6 h-6" />
                                </div>
                                <h2 className="text-3xl font-bold text-slate-900 mb-4">Buat Soal 10x Lebih Cepat dengan AI</h2>
                                <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                                    Tidak perlu lagi menghabiskan waktu berjam-jam mengetik soal manual. Asisten AI kami dapat men-generate soal Pilihan Ganda maupun Essay berdasarkan topik yang Anda inginkan.
                                </p>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                                        <span className="text-slate-700">Generate otomatis materi & kunci jawaban</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                                        <span className="text-slate-700">Bank Soal Publik: Duplikat soal dari guru lain</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                                        <span className="text-slate-700">Dukungan rumus matematika (MathJax/LaTeX)</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. EXAM MANAGEMENT & SECURITY */}
                <section className="py-20 bg-slate-50 overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div>
                                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                                    <Shield className="w-6 h-6" />
                                </div>
                                <h2 className="text-3xl font-bold text-slate-900 mb-4">Keamanan Ujian Terjamin</h2>
                                <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                                    Cegah kecurangan dengan fitur keamanan berlapis. Sistem kami memantau aktivitas siswa secara real-time dan memberikan kontrol penuh kepada pengawas.
                                </p>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                                        <span className="text-slate-700 font-bold">Token Ujian Unik</span>
                                        <span className="text-slate-500 text-sm">- seperti UNBK</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                                        <span className="text-slate-700 font-bold">Auto-Lock System</span>
                                        <span className="text-slate-500 text-sm">- Ujian terkunci jika ganti tab/aplikasi</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                                        <span className="text-slate-700 font-bold">Real-time Monitoring</span>
                                        <span className="text-slate-500 text-sm">- Pantau status tiap siswa live</span>
                                    </li>
                                </ul>
                            </div>
                            <motion.div
                                initial={{ opacity: 0, x: 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                                className="relative"
                            >
                                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
                                <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
                                    <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
                                        <div>
                                            <h4 className="font-bold text-slate-800">Ujian Matematika Wajib</h4>
                                            <p className="text-xs text-slate-500">Token: <span className="font-mono font-bold text-blue-600 bg-blue-50 px-1 rounded">X9J2K</span></p>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">Aktif</span>
                                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">2 Pelanggaran</span>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-lg">
                                            <span className="text-slate-700">Ahmad Siswa</span>
                                            <span className="text-green-600 font-bold">Mengerjakan</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm p-3 bg-red-50 border border-red-100 rounded-lg">
                                            <span className="text-slate-700">Budi Santoso</span>
                                            <span className="text-red-600 font-bold flex items-center gap-1"><Lock className="w-3 h-3" /> Terkunci</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-lg">
                                            <span className="text-slate-700">Citra Dewi</span>
                                            <span className="text-blue-600 font-bold">Selesai</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* 3. GRADING & ANALYSIS */}
                <section className="py-20 bg-white overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                                className="order-2 lg:order-1 relative"
                            >
                                <div className="absolute -left-10 -top-10 w-40 h-40 bg-green-100 rounded-full blur-3xl opacity-50"></div>
                                <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden p-6">
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <div className="bg-green-50 p-4 rounded-xl">
                                            <div className="text-green-600 text-xs font-bold mb-1">TERTINGGI</div>
                                            <div className="text-2xl font-bold text-slate-800">98.5</div>
                                        </div>
                                        <div className="bg-red-50 p-4 rounded-xl">
                                            <div className="text-red-600 text-xs font-bold mb-1">REMEDIAL</div>
                                            <div className="text-2xl font-bold text-slate-800">5 Siswa</div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500 w-[75%]"></div>
                                        </div>
                                        <div className="flex justify-between text-xs text-slate-500">
                                            <span>Rata-rata Kelas</span>
                                            <span>78.5 / 100</span>
                                        </div>
                                    </div>
                                    <div className="mt-6 pt-4 border-t border-slate-100">
                                        <button className="w-full py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 flex items-center justify-center gap-2">
                                            <FileText className="w-4 h-4" /> Download Laporan Excel/PDF
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                            <div className="order-1 lg:order-2">
                                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-6">
                                    <BarChart2 className="w-6 h-6" />
                                </div>
                                <h2 className="text-3xl font-bold text-slate-900 mb-4">Analisis & Penilaian Otomatis</h2>
                                <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                                    Lupakan mengoreksi kertas jawaban satu per satu. Biarkan sistem kami yang bekerja untuk Anda.
                                </p>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                                        <span className="text-slate-700">Koreksi otomatis untuk Pilihan Ganda</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                                        <span className="text-slate-700">Fitur koreksi manual khusus Essay</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                                        <span className="text-slate-700">Deteksi otomatis siswa perlu Remedial</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* --- DETAILED FEATURE GRID --- */}
            <section className="py-20 bg-slate-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold mb-4">Fitur Lengkap Platform</h2>
                        <p className="text-slate-400">Semua yang Anda butuhkan untuk ekosistem ujian digital yang sukses.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { icon: BookOpen, title: 'Bank Soal', desc: 'Arsip soal tersusun rapi per mapel & kelas.' },
                            { icon: Globe, title: 'Kolaborasi', desc: 'Bagikan & duplikat soal antar guru.' },
                            { icon: Smartphone, title: 'Mobile Friendly', desc: 'Aplikasi ringan untuk siswa di Android.' },
                            { icon: FileText, title: 'Export Nilai', desc: 'Download laporan nilai siap cetak.' },
                            { icon: Lock, title: 'Aman', desc: 'Sistem proteksi dari kecurangan.' },
                            { icon: Zap, title: 'Cepat & Ringan', desc: 'Teknologi caching untuk akses ribuan siswa.' },
                            { icon: Bot, title: 'AI Generator', desc: 'Buat soal instan dengan bantuan AI.' },
                            { icon: Monitor, title: 'Monitoring', desc: 'Pantau ujian dari dashboard guru.' },
                        ].map((item, idx) => (
                            <motion.div
                                key={idx}
                                whileHover={{ y: -5 }}
                                className="bg-slate-800 p-6 rounded-xl border border-slate-700"
                            >
                                <item.icon className="w-8 h-8 text-blue-400 mb-4" />
                                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                                <p className="text-slate-400 text-sm">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- CTA BOTTOM --- */}
            <section className="py-20 bg-blue-600">
                <div className="max-w-4xl mx-auto px-4 text-center text-white">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">Siap Beralih ke Digital?</h2>
                    <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
                        Bergabunglah dengan sekolah-sekolah yang telah memodernisasi sistem evaluasi mereka bersama Sibentik Exam.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => navigate('/login')}
                            className="px-8 py-4 bg-white text-blue-600 font-bold rounded-xl shadow-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                        >
                            Mulai Sekarang Gratis <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer Simple */}
            <footer className="bg-slate-900 border-t border-slate-800 py-8 text-center text-slate-500 text-sm">
                &copy; 2024 SIBENTIK EXAM. All rights reserved.
            </footer>
        </div>
    );
};

export default FeaturesPage;
