import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { 
  Brain, 
  BookOpen, 
  Trophy, 
  Target, 
  Users, 
  Sparkles,
  ArrowRight,
  Star,
  TrendingUp,
  Clock,
  Bot,
  Flame
} from 'lucide-react';

const Home: React.FC = () => {
  const { currentUser, userData } = useAuth();

  const features = [
    {
      icon: Brain,
      title: 'AI Soru Çözücü',
      description: 'Fotoğraf çek, adım adım çözüm al',
      color: 'primary'
    },
    {
      icon: BookOpen,
      title: 'Akıllı Flashcard',
      description: 'Kişiselleştirilmiş öğrenme kartları',
      color: 'secondary'
    },
    {
      icon: Trophy,
      title: 'Gamifikasyon',
      description: 'XP kazan, başarı rozetleri topla',
      color: 'accent'
    },
    {
      icon: Target,
      title: 'Sınav Planlayıcı',
      description: 'AI destekli kişisel çalışma planı',
      color: 'success'
    }
  ];

  const stats = [
    { label: 'Aktif Öğrenci', value: '10,000+', icon: Users },
    { label: 'Çözülen Soru', value: '50,000+', icon: Brain },
    { label: 'Başarı Oranı', value: '%95', icon: TrendingUp },
    { label: 'Günlük Kullanım', value: '2 Saat', icon: Clock }
  ];

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="inline-flex items-center px-4 py-2 bg-primary-100 dark:bg-primary-900/30 rounded-full text-primary-800 dark:text-primary-200 text-sm font-medium mb-8"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI Destekli Eğitim Platformu
              </motion.div>
              
              <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6">
                <span className="block">Öğrenmeyi</span>
                <span className="block text-primary-600 dark:text-primary-400">
                  Yeniden Keşfet
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
                YKS, LGS ve diğer sınavlara hazırlanırken AI destekli araçlarla 
                kişiselleştirilmiş öğrenme deneyimi yaşa.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/register"
                    className="inline-flex items-center px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors shadow-lg"
                  >
                    Ücretsiz Başla
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/login"
                    className="inline-flex items-center px-8 py-4 border-2 border-primary-600 text-primary-600 dark:text-primary-400 font-semibold rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                  >
                    Giriş Yap
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-20 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Neden Neutral Edu?
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Yapay zeka teknolojisi ile desteklenen modern öğrenme araçları
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-6 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:shadow-lg transition-all"
                >
                  <div className={`w-16 h-16 mx-auto mb-4 bg-${feature.color}-100 dark:bg-${feature.color}-900/30 rounded-xl flex items-center justify-center`}>
                    <feature.icon className={`w-8 h-8 text-${feature.color}-600 dark:text-${feature.color}-400`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="py-20 bg-primary-600 dark:bg-primary-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  className="text-center"
                >
                  <div className="w-12 h-12 mx-auto mb-4 bg-white/20 rounded-lg flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-primary-100">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  Hoş geldin, {userData?.name}! 👋
                </h1>
                <p className="text-primary-100 text-lg">
                  Bugün hangi konularda çalışmak istiyorsun?
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{userData?.xp || 0}</div>
                    <div className="text-sm text-primary-200">XP</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Flame className="w-5 h-5 text-orange-400" />
                      <div className="text-2xl font-bold">{userData?.streak || 0}</div>
                    </div>
                    <div className="text-sm text-primary-200">Günlük Seri</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">Seviye {userData?.level || 1}</div>
                    <div className="text-sm text-primary-200">Mevcut Seviye</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          {[
            { title: 'Soru Çöz', desc: 'AI ile soru çözümü', path: '/solver', icon: Brain, color: 'primary' },
            { title: 'AI Koç', desc: 'Kişisel çalışma koçu', path: '/coach', icon: Bot, color: 'purple' },
            { title: 'Test Çöz', desc: 'Konu testleri', path: '/quiz', icon: BookOpen, color: 'secondary' },
            { title: 'Flashcard', desc: 'Kelime kartları', path: '/flashcards', icon: Star, color: 'accent' },
          ].map((action, index) => (
            <motion.div
              key={action.title}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to={action.path}
                className={`block p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-lg transition-all border-l-4 ${
                  action.color === 'purple' 
                    ? 'border-purple-500' 
                    : `border-${action.color}-500`
                }`}
              >
                <div className={`w-12 h-12 ${
                  action.color === 'purple' 
                    ? 'bg-purple-100 dark:bg-purple-900/30' 
                    : `bg-${action.color}-100 dark:bg-${action.color}-900/30`
                } rounded-lg flex items-center justify-center mb-4`}>
                  <action.icon className={`w-6 h-6 ${
                    action.color === 'purple' 
                      ? 'text-purple-600 dark:text-purple-400' 
                      : `text-${action.color}-600 dark:text-${action.color}-400`
                  }`} />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {action.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {action.desc}
                </p>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Son Aktiviteler
          </h2>
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Henüz aktivite bulunmuyor. Çalışmaya başlamak için yukarıdaki seçenekleri kullanın.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;