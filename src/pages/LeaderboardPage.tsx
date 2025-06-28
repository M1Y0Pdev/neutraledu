import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Trophy, Medal, Crown, Star, TrendingUp, Users, Award, Sun, Moon } from 'lucide-react';
import LoadingSpinner from '../components/Common/LoadingSpinner';

interface LeaderboardUser {
  id: string;
  name: string;
  xp: number;
  level: number;
  rank: number;
}

const LeaderboardPage: React.FC = () => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const { currentUser, userData } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  console.log('LeaderboardPage yüklendi');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        console.log('Leaderboard verisi çekiliyor...');
        const usersRef = collection(db, 'users');
        const q = query(usersRef, orderBy('xp', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const usersList: LeaderboardUser[] = [];
        querySnapshot.docs.forEach((doc, index) => {
          const userData = doc.data();
          usersList.push({
            id: doc.id,
            name: userData.name || 'Anonim',
            xp: userData.xp || 0,
            level: userData.level || 1,
            rank: index + 1
          });
        });

        console.log('Çekilen kullanıcı sayısı:', usersList.length);
        setUsers(usersList);
        
        // Kullanıcının sıralamasını bul (sadece giriş yapmış kullanıcılar için)
        if (currentUser) {
          const userRank = usersList.find(user => user.id === currentUser.uid);
          setCurrentUserRank(userRank?.rank || null);
        }
      } catch (error) {
        console.error('Skor tablosu yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [currentUser]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 text-gray-500 font-bold">{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 3:
        return 'bg-gradient-to-r from-amber-500 to-amber-700 text-white';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Theme Toggle */}
        <div className="flex justify-between items-center mb-8 animate-fade-in">
          <div className="text-center flex-1">
            <div className="flex items-center justify-center mb-4 animate-bounce-in">
              <div className="p-3 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-2xl">
                <Trophy className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 animate-slide-up">
              Skor Tablosu
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 animate-slide-up-delay">
              En çok XP kazanan öğrenciler
            </p>
          </div>
          
          {/* Tema Değiştirme Butonu */}
          <button
            onClick={toggleTheme}
            className="p-3 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-110"
            aria-label="Toggle Theme"
            title={isDark ? "Açık temaya geç" : "Koyu temaya geç"}
          >
            {isDark ? (
              <Sun className="h-6 w-6" />
            ) : (
              <Moon className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Current User Stats */}
        {currentUserRank && userData && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm mb-8 animate-slide-up-fade">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {userData.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {userData.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Sıralama: #{currentUserRank} • XP: {userData.xp} • Seviye: {userData.level}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  #{currentUserRank}
                </div>
                <div className="text-sm text-gray-500">Sıralama</div>
              </div>
            </div>
          </div>
        )}

        {/* Login Call to Action for non-authenticated users */}
        {!currentUser && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 shadow-sm mb-8 text-center animate-slide-up-fade">
            <h3 className="text-xl font-semibold text-white mb-2">
              Sen de katıl!
            </h3>
            <p className="text-indigo-100 mb-4">
              Ücretsiz hesap oluştur ve arkadaşlarınla yarışmaya başla!
            </p>
            <div className="flex gap-4 justify-center">
              <a
                href="/login"
                className="bg-white text-indigo-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-300 hover:scale-105"
              >
                Giriş Yap
              </a>
              <a
                href="/register"
                className="bg-transparent border-2 border-white text-white px-6 py-2 rounded-lg font-semibold hover:bg-white hover:text-indigo-600 transition-all duration-300 hover:scale-105"
              >
                Kayıt Ol
              </a>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden animate-slide-up-fade">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Top 100 Öğrenci
            </h2>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((user, index) => (
              <div
                key={user.id}
                className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-[1.02] ${
                  user.id === currentUser?.uid ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getRankBadge(user.rank)}`}>
                      {getRankIcon(user.rank)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {user.name}
                        {user.id === currentUser?.uid && (
                          <span className="ml-2 text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 px-2 py-1 rounded-full">
                            Sen
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Seviye {user.level}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {user.xp.toLocaleString()} XP
                    </div>
                    <div className="text-sm text-gray-500">
                      #{user.rank}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up-fade">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm text-center hover:shadow-md transition-all duration-300 hover:scale-105">
            <Users className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {users.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Toplam Öğrenci
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm text-center hover:shadow-md transition-all duration-300 hover:scale-105">
            <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {users[0]?.xp.toLocaleString() || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              En Yüksek XP
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm text-center hover:shadow-md transition-all duration-300 hover:scale-105">
            <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(users.reduce((sum, user) => sum + user.xp, 0) / users.length).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Ortalama XP
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage; 