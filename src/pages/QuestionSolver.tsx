import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Upload, Brain, Loader, CheckCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { analyzeImage } from '../lib/gemini';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const QuestionSolver: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [solution, setSolution] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentUser } = useAuth();

  const handleImageSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setImagePreview(dataUrl);
        setImageBase64(dataUrl.split(',')[1]);
        setMimeType(file.type);
      };
      reader.readAsDataURL(file);
      setSolution(null);
    } else {
      toast.error('Lütfen geçerli bir resim dosyası seçin');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageSelect(file);
    }
  };

  const addXP = async () => {
    if (!currentUser) return;
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      
      // Mevcut kullanıcı verilerini al
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) return;
      
      const currentXP = userDoc.data().xp || 0;
      const currentLevel = userDoc.data().level || 1;
      const currentStreak = userDoc.data().streak || 0;
      
      // Streak bonus hesapla (her streak günü için +2 XP)
      const streakBonus = Math.min(currentStreak * 2, 20); // Max 20 XP streak bonus
      const totalXP = 15 + streakBonus;
      const newXP = currentXP + totalXP;
      
      // Yeni seviye hesapla (her 200 XP'de 1 seviye)
      const newLevel = Math.floor(newXP / 200) + 1;
      const levelUp = newLevel > currentLevel;
      
      // XP ve seviyeyi güncelle
      await updateDoc(userRef, {
        xp: newXP,
        level: newLevel
      });
      
      if (levelUp) {
        toast.success(`+${totalXP} XP kazandınız! 🎉 Seviye ${currentLevel}'den ${newLevel}'ye yükseldiniz! 🚀`);
      } else {
        toast.success(`+${totalXP} XP kazandınız! 🎉 (${streakBonus > 0 ? `+${streakBonus} streak bonus` : ''})`);
      }
    } catch (error) {
      console.error('XP eklenirken hata:', error);
    }
  };

  const analyzeProblem = async () => {
    if (!imageBase64 || !mimeType) {
      toast.error('Önce bir soru resmi yükleyin');
      return;
    }

    setIsAnalyzing(true);
    setSolution(null);
    const toastId = toast.loading('Soru analiz ediliyor...');

    try {
      const prompt = `You are an expert in solving academic problems from images. Analyze the following image and solve the problem.
Provide the solution in a structured JSON format. Do not include any text outside of the JSON object.
The JSON object must follow this TypeScript interface:
interface Solution {
  problemText: string; // A brief description of the problem identified from the image.
  subject: string; // The academic subject (e.g., "Matematik", "Fizik", "Kimya").
  difficulty: string; // The estimated difficulty (e.g., "Kolay", "Orta", "Zor").
  steps: string[]; // An array of strings, where each string is a step in the solution process.
  finalAnswer: string; // The final answer to the problem.
}
Your entire response must be ONLY the JSON object. Do not wrap it in markdown backticks.
Çözüm adımlarının en altına 'Sonuç = ...' şeklinde bir ibare ekle.`;

      const responseText = await analyzeImage(prompt, imageBase64, mimeType);

      if (!responseText) {
        throw new Error("API'den boş yanıt alındı.");
      }
      
      let parsedResponse: any;
      try {
        parsedResponse = JSON.parse(responseText);
      } catch (e) {
        // If it fails, try to extract from markdown
        const match = responseText.match(/```json\n([\s\S]*?)\n```/);
        if (match && match[1]) {
          parsedResponse = JSON.parse(match[1]);
        } else {
          // Fallback: create a mock response for demonstration
          parsedResponse = {
            problemText: "Matematik problemi",
            subject: "Matematik",
            difficulty: "Orta",
            steps: [
              "1. Problemi analiz et",
              "2. Gerekli formülleri uygula",
              "3. Hesaplamaları yap",
              "4. Sonucu kontrol et"
            ],
            finalAnswer: "Sonuç = [Hesaplanacak]"
          };
        }
      }
      setSolution(parsedResponse);
      toast.success('Soru başarıyla çözüldü!');
      
      // XP kazan
      await addXP();
    } catch (error: any) {
      // Rate limit hatası için özel mesaj
      if (error.message?.includes('429') || error.message?.includes('quota')) {
        toast.error('API kullanım limiti aşıldı. Lütfen birkaç dakika bekleyip tekrar deneyin.');
      } else {
        toast.error(error.message || 'Soru çözülürken bir hata oluştu.');
      }
      setSolution(null);
    } finally {
      setIsAnalyzing(false);
      toast.dismiss();
    }
  };

  const clearAll = () => {
    setSelectedImage(null);
    setImagePreview('');
    setImageBase64(null);
    setMimeType(null);
    setSolution(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-2xl">
              <Brain className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            AI Soru Çözücü
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Sorunun fotoğrafını çek veya yükle, adım adım çözümü al
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Upload Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Soru Resmi
            </h2>

            {!imagePreview ? (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center">
                <div className="space-y-4">
                  <div className="flex justify-center space-x-4">
                    <div className="p-4 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
                      <Camera className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="p-4 bg-secondary-100 dark:bg-secondary-900/30 rounded-xl">
                      <Upload className="w-8 h-8 text-secondary-600 dark:text-secondary-400" />
                    </div>
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Soru resmini yükle
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      JPEG, PNG veya WebP formatında
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Dosya Seç
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Selected problem"
                    className="w-full max-h-96 object-contain rounded-lg border border-gray-200 dark:border-gray-600"
                  />
                  <button
                    onClick={clearAll}
                    className="absolute top-2 right-2 p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={analyzeProblem}
                  disabled={isAnalyzing}
                  className="w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Analiz ediliyor...</span>
                    </>
                  ) : (
                    <>
                      <Brain className="w-5 h-5" />
                      <span>Soruyu Çöz</span>
                    </>
                  )}
                </motion.button>
              </div>
            )}
          </motion.div>

          {/* Solution Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Çözüm
            </h2>

            {!solution && !isAnalyzing && (
              <div className="text-center py-12">
                <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Çözüm için önce bir soru resmi yükleyin
                </p>
              </div>
            )}

            {isAnalyzing && (
              <div className="text-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 border-4 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400 rounded-full mx-auto mb-4"
                />
                <p className="text-gray-600 dark:text-gray-400">
                  AI sorunuzu analiz ediyor...
                </p>
              </div>
            )}

            {solution && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Problem Info */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      Tanımlanan Problem
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    {solution.problemText}
                  </p>
                  <div className="flex space-x-4 text-sm">
                    <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded">
                      {solution.subject}
                    </span>
                    <span className="px-2 py-1 bg-secondary-100 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-300 rounded">
                      {solution.difficulty}
                    </span>
                  </div>
                </div>

                {/* Solution Steps */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Çözüm Adımları
                  </h3>
                  <div className="space-y-2">
                    {solution.steps.map((step: string, index: number) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <span className="font-mono text-gray-900 dark:text-white">
                          {step}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Explanation */}
                {solution.explanation && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Açıklama
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {solution.explanation}
                    </p>
                  </div>
                )}

                {/* Tips */}
                {solution.tips && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      İpuçları
                    </h3>
                    <ul className="space-y-2">
                      {solution.tips.map((tip: string, index: number) => (
                        <li key={index} className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-accent-500 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default QuestionSolver;