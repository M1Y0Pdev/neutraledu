import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, BookOpen, BrainCircuit, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { GraduationCap } from 'lucide-react';

const LandingPage: React.FC = () => {
    const { isDark, toggleTheme } = useTheme();

    return (
        <div className={`min-h-screen ${isDark ? 'dark' : ''} bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100`}>
            {/* Header */}
            <header className="py-4 px-8 flex justify-between items-center">
                 <div className="flex items-center space-x-2">
                    <GraduationCap className="h-8 w-8 text-primary-600" />
                    <span className="text-xl font-bold">NeutralEdu</span>
                </div>
                <div className="flex items-center space-x-4">
                    {/* Tema Değiştirme Butonu */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Toggle Theme"
                        title={isDark ? "Açık temaya geç" : "Koyu temaya geç"}
                    >
                        {isDark ? (
                            <Sun className="h-5 w-5" />
                        ) : (
                            <Moon className="h-5 w-5" />
                        )}
                    </button>
                    
                    <Link to="/dashboard/leaderboard" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">Skor Tablosu</Link>
                    <Link to="/login" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">Giriş Yap</Link>
                    <Link to="/register" className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors">Ücretsiz Başla</Link>
                </div>
            </header>

            {/* Hero Section */}
            <main className="container mx-auto px-8 text-center pt-20 pb-24">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="inline-block bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-semibold px-4 py-1 rounded-full mb-6">
                        ✨ AI Destekli Eğitim Platformu
                    </div>
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
                        Öğrenmeyi <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-secondary-500">
                            Yeniden Keşfet
                        </span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10">
                        YKS, LGS ve diğer sınavlara hazırlanırken AI destekli araçlarla kişiselleştirilmiş öğrenme deneyimi yaşa.
                    </p>
                    <Link to="/register" className="inline-flex items-center justify-center bg-primary-600 text-white text-lg font-bold px-8 py-4 rounded-lg hover:bg-primary-700 transition-transform hover:scale-105">
                        Ücretsiz Başla <ArrowRight className="ml-2" />
                    </Link>
                </motion.div>
            </main>

            {/* Features Section */}
            <section className="bg-gray-50 dark:bg-gray-800/50 py-20">
                <div className="container mx-auto px-8">
                    <h2 className="text-3xl font-bold text-center mb-12">Neden Neutral Edu?</h2>
                    <div className="grid md:grid-cols-3 gap-10">
                        <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                            <BrainCircuit className="w-12 h-12 text-primary-500 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Akıllı Soru Çözücü</h3>
                            <p className="text-gray-600 dark:text-gray-400">Yapamadığın soruların fotoğrafını çek, AI adım adım çözsün.</p>
                        </div>
                         <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                            <Zap className="w-12 h-12 text-secondary-500 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Kişisel AI Koçu</h3>
                            <p className="text-gray-600 dark:text-gray-400">Hedeflerine ve öğrenme stiline özel çalışma programları oluştur.</p>
                        </div>
                         <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                            <BookOpen className="w-12 h-12 text-green-500 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Etkileşimli Dersler</h3>
                            <p className="text-gray-600 dark:text-gray-400">Sıkıcı konu anlatımlarını unut, interaktif materyallerle öğren.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage; 