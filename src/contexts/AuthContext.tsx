import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { User } from '../types';
import toast from 'react-hot-toast';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Giriş başarılı!');
    } catch (error: any) {
      toast.error('Giriş yapılamadı: ' + error.message);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string, role: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create a new document in Firestore for the new user
    const newUser: User = {
      id: user.uid,
      name: name,
      email: user.email!,
      role: role as 'user' | 'teacher' | 'admin', // Use the provided role
      xp: 0,
      streak: 0,
      level: 1,
      progress: {},
      lastLogin: new Date(),
      createdAt: new Date(),
    };

    await setDoc(doc(db, "users", user.uid), newUser);
    toast.success('Hesap başarıyla oluşturuldu!');
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserData(null);
      toast.success('Çıkış yapıldı');
    } catch (error: any) {
      toast.error('Çıkış yapılamadı: ' + error.message);
    }
  };

  const resetPassword = (email: string) => {
    return sendPasswordResetEmail(auth, email);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            
            // localStorage ile bugün bonus verilip verilmediğini kontrol et
            const todayKey = `streak_bonus_${user.uid}_${new Date().toDateString()}`;
            const alreadyGivenToday = localStorage.getItem(todayKey);

            if (alreadyGivenToday) {
              // Bugün zaten bonus verilmiş, hiçbir şey yapma
              setUserData(userData);
              setLoading(false);
              return;
            }

            // Streak kontrolü ve güncelleme
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Bugünün başlangıcı
            
            let lastLogin: Date;
            try {
              lastLogin = userData.lastLogin instanceof Date 
                ? userData.lastLogin 
                : new Date(userData.lastLogin || 0);
            } catch {
              lastLogin = new Date(0);
            }
            lastLogin.setHours(0, 0, 0, 0); // Son girişin başlangıcı
            
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1); // Dün
            
            let newStreak = userData.streak || 0;
            let streakBonus = 0;
            let shouldUpdateStreak = false;
            
            // İlk giriş kontrolü (lastLogin yoksa veya çok eskiyse)
            if (!userData.lastLogin || lastLogin.getTime() === 0) {
              newStreak = 1;
              streakBonus = 5;
              shouldUpdateStreak = true;
            } else if (today.getTime() === lastLogin.getTime()) {
              // Bugün zaten giriş yapmış, streak aynı kalır, bonus yok
              newStreak = userData.streak || 0;
              streakBonus = 0;
              shouldUpdateStreak = false;
            } else if (yesterday.getTime() === lastLogin.getTime()) {
              // Dün giriş yapmış, streak artır
              newStreak += 1;
              streakBonus = Math.min(newStreak * 5, 50); // Her gün 5 XP bonus, max 50
              shouldUpdateStreak = true;
            } else {
              // 1 günden fazla geçmiş veya diğer durumlar, streak sıfırla ve bugün için 1 yap
              newStreak = 1;
              streakBonus = 5;
              shouldUpdateStreak = true;
            }
            
            // Kullanıcı verilerini güncelle
            const updatedUserData = {
              ...userData,
              streak: newStreak,
              lastLogin: new Date(),
              xp: userData.xp + streakBonus
            };
            
            // Sadece streak değişmişse veya bonus varsa güncelle
            if (shouldUpdateStreak || streakBonus > 0) {
              await updateDoc(doc(db, "users", user.uid), {
                streak: newStreak,
                lastLogin: new Date(),
                xp: userData.xp + streakBonus
              });
              
              // Bugün bonus verildiğini localStorage'a kaydet
              localStorage.setItem(todayKey, 'true');
            }

            setUserData(updatedUserData);
            
            // Streak bonus bildirimi (sadece gerçek bonus varsa)
            if (streakBonus > 0) {
              if (newStreak === 1) {
                toast.success(`Hoş geldin! Günlük seri başladı! +${streakBonus} XP bonus! 🔥`);
              } else {
                toast.success(`${newStreak} günlük seri! +${streakBonus} XP bonus! 🔥`);
              }
            }
          }
        } catch (error) {
          console.error("Kullanıcı verisi yüklenirken hata:", error);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    currentUser,
    userData,
    login,
    register,
    logout,
    resetPassword,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};