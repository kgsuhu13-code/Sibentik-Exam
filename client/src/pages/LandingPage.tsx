
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Shield, Smartphone, Zap, BarChart3, CheckCircle, ArrowRight, Bot, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    // Animation Variants
    const fadeInUp = {
        hidden: { opacity: 0, y: 60 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as any } }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    return (
        <div className="font-sans text-slate-800 bg-white">
            <Helmet>
                <title>SIBENTIK EXAM - Digitalisasi Ujian Sekolah Masa Depan</title>
                <meta name="description" content="Platform ujian sekolah modern berbasis web dan mobile dengan fitur anti-curang canggih. Solusi digitalisasi asesmen pendidikan yang aman, cepat, dan terintegrasi." />
                <meta name="keywords" content="ujian online, cbt, digitalisasi sekolah, aplikasi ujian, anti curang, sibentik exam" />
                <meta property="og:title" content="SIBENTIK EXAM - Solusi Ujian Sekolah Digital" />
                <meta property="og:description" content="Platform ujian berbasis komputer & HP yang aman dan mudah digunakan." />
                <meta property="og:image" content="/landing-hero.png" />
            </Helmet>

            {/* --- NAVBAR --- */}
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
                className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
                            <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
                            <span className="font-bold text-xl tracking-tight text-slate-800">SIBENTIK<span className="text-blue-600">EXAM</span></span>
                        </div>

                        <div className="hidden md:flex items-center space-x-8">
                            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Fitur</a>
                            <a href="#about" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Tentang Kami</a>
                            <a href="#contact" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Kontak</a>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/login')}
                                className="px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-full hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                            >
                                Masuk Aplikasi
                            </button>
                        </div>
                    </div>
                </div>
            </motion.nav>

            {/* --- HERO SECTION --- */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="absolute top-0 right-0 -z-10 w-1/2 h-full bg-gradient-to-bl from-blue-50 via-white to-white opacity-60 rounded-bl-[100px]"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Text Content */}
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={staggerContainer}
                            className="space-y-8"
                        >
                            <motion.div variants={fadeInUp}>
                                <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider rounded-full mb-4">
                                    #1 Platform Ujian Digital
                                </span>
                                <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight leading-tight text-slate-900">
                                    Digitalisasi Ujian <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                                        Sekolah Masa Depan
                                    </span>
                                </h1>
                            </motion.div>
                            <motion.p variants={fadeInUp} className="text-lg text-slate-600 leading-relaxed max-w-lg">
                                Platform asesmen modern yang aman, anti-curang, dan fleksibel untuk PC maupun Smartphone. Solusi digitalisasi pendidikan dalam satu genggaman.
                            </motion.p>
                            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={() => navigate('/login')}
                                    className="px-8 py-4 bg-blue-600 text-white font-bold rounded-xl shadow-xl shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                                >
                                    Mulai Sekarang <ArrowRight className="w-5 h-5" />
                                </button>
                                <button className="px-8 py-4 bg-white text-slate-700 font-bold border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
                                    Pelajari Fitur
                                </button>
                            </motion.div>

                            <motion.div variants={fadeInUp} className="pt-6 flex items-center gap-6 text-sm text-slate-500">
                                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> User Friendly</span>
                                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> Aman & Terpercaya</span>
                            </motion.div>
                        </motion.div>

                        {/* Hero Image */}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="relative"
                        >
                            <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-2 border border-slate-100 transform rotate-1 hover:rotate-0 transition-transform duration-500">
                                <img
                                    src="/landing-hero.png"
                                    alt="Ilustrasi Ujian Online"
                                    className="rounded-2xl w-full h-auto object-cover"
                                />
                            </div>
                            {/* Decorative Blobs */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-400 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob"></div>
                            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-400 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-2000"></div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* --- FEATURES SECTION --- */}
            <section id="features" className="py-20 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center max-w-2xl mx-auto mb-16"
                    >
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">Fitur Unggulan Kami</h2>
                        <p className="text-slate-500">
                            Dirancang khusus untuk memenuhi kebutuhan ujian modern yang efisien dan berintegritas tinggi.
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Features List */}
                        {[
                            { icon: Bot, color: 'purple', title: 'Pembuatan Soal AI', desc: 'Buat soal ujian otomatis hanya dengan satu klik menggunakan teknologi AI canggih.' },
                            { icon: Smartphone, color: 'indigo', title: 'Multi-Platform', desc: 'Akses ujian dari mana saja! Mendukung Laptop, Tablet, hingga Smartphone dengan tampilan responsif.' },
                            { icon: Shield, color: 'red', title: 'Proteksi Anti-Curang', desc: 'Dilengkapi pengunci layar, deteksi keluar aplikasi, dan token unik untuk menjaga integritas ujian.' },
                            { icon: Zap, color: 'blue', title: 'Performa Tinggi', desc: 'Teknologi caching canggih (Redis) memastikan ujian berjalan lancar meski diakses ribuan siswa.' },
                            { icon: BarChart3, color: 'emerald', title: 'Analisis Real-Time', desc: 'Hasil ujian dan analisis butir soal muncul otomatis secara real-time untuk memudahkan evaluasi guru.' },
                            { icon: Lock, color: 'orange', title: 'Auto-Lock System', desc: 'Sistem otomatis mengunci ujian jika terdeteksi aktivitas mencurigakan atau perpindahan aplikasi berlebih.' }
                        ].map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-lg transition-all group"
                            >
                                <div className={`w-14 h-14 bg-${feature.color}-50 text-${feature.color}-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-${feature.color}-600 group-hover:text-white transition-colors`}>
                                    <feature.icon className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-slate-800">{feature.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- ABOUT SECTION --- */}
            <section id="about" className="py-20 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="relative order-2 lg:order-1"
                        >
                            <div className="w-full h-80 bg-gradient-to-tr from-blue-600 to-indigo-700 rounded-3xl transform -rotate-3 p-1">
                                <div className="w-full h-full bg-slate-900 rounded-3xl opacity-20"></div>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center text-white text-center p-8">
                                <div>
                                    <p className="text-5xl font-extrabold mb-2">100+</p>
                                    <p className="text-lg opacity-80">Sekolah Bergabung</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="order-1 lg:order-2"
                        >
                            <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wider rounded-full mb-4">
                                Tentang Kami
                            </span>
                            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">Mewujudkan Ekosistem Pendidikan Digital Masa Depan</h2>
                            <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                                SIBENTIK EXAM hadir dengan misi mendukung sekolah dalam transisi menuju sistem evaluasi yang paperless, efisien, dan transparan.
                            </p>
                            <p className="text-slate-600 leading-relaxed mb-8">
                                Kami percaya bahwa teknologi harus memudahkan, bukan menyulitkan. Oleh karena itu, kami membangun platform yang tidak hanya canggih secara teknis, tetapi juga sangat mudah digunakan oleh guru maupun siswa dari berbagai jenjang pendidikan.
                            </p>
                            <button className="text-blue-600 font-bold flex items-center gap-2 hover:gap-3 transition-all">
                                Baca Selengkapnya <ArrowRight className="w-4 h-4" />
                            </button>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* --- CTA SECTION --- */}
            <section className="py-20">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-12 text-center text-white relative overflow-hidden shadow-2xl"
                    >
                        {/* Circles */}
                        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-black/10 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>

                        <h2 className="text-3xl md:text-4xl font-bold mb-6 relative z-10">Siap Mendigitalkan Ujian Sekolah Anda?</h2>
                        <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto relative z-10">
                            Bergabunglah bersama ratusan sekolah lainnya dan rasakan kemudahan pengelolaan ujian dengan SIBENTIK EXAM.
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/login')}
                            className="px-10 py-4 bg-white text-blue-700 font-bold rounded-xl shadow-lg hover:shadow-xl hover:bg-blue-50 transition-all relative z-10"
                        >
                            Mulai Sekarang Gratis
                        </motion.button>
                    </motion.div>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800" id="contact">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-3 gap-8 mb-8">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center gap-2 mb-4 text-white">
                                <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain bg-white rounded-lg p-1" />
                                <span className="font-bold text-xl">SIBENTIK EXAM</span>
                            </div>
                            <p className="max-w-sm text-sm leading-relaxed">
                                Platform ujian digital terdepan untuk sekolah modern. Aman, Cepat, dan Terpercaya.
                            </p>
                        </div>

                        <div>
                            <h4 className="text-white font-bold mb-4">Hubungi Kami</h4>
                            <ul className="space-y-2 text-sm">
                                <li>support@sibentik.com</li>
                                <li>+62 812 3456 7890</li>
                                <li>Semarang, Indonesia</li>
                            </ul>
                        </div>
                    </div>
                    <div className="pt-8 border-t border-slate-800 text-center text-xs">
                        &copy; {new Date().getFullYear()} SIBENTIK EXAM. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
