import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { lessonService, supabase } from '../lib/supabase';
import { generateAIExplanation } from '../lib/gemini';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  X, 
  CheckCircle, 
  XCircle, 
  Lightbulb,
  BookOpen,
  Clock,
  User,
  Target,
  TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Lesson {
  id: string;
  title: string;
  content: string;
  subject: string;
  grade_level: string;
  cover_image_url?: string;
  youtube_link?: string;
  attachments?: any[];
  interactive_questions?: InteractiveQuestion[];
  created_at: string;
  updated_at: string;
}

interface InteractiveQuestion {
  id: string;
  timestamp: number;
  question: string;
  options: string[];
  correctAnswer: string;
}

interface LessonMistake {
  id: string;
  user_id: string;
  lesson_id: string;
  question: InteractiveQuestion;
  user_answer: string;
  correct_answer: string;
  ai_explanation: string;
  created_at: string;
}

const LessonDetailPage = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { userData } = useAuth();
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState<InteractiveQuestion | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [isAnswering, setIsAnswering] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string>('');
  const [videoProgress, setVideoProgress] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [mistakes, setMistakes] = useState<LessonMistake[]>([]);
  const [showMistakesHistory, setShowMistakesHistory] = useState(false);

  const playerRef = useRef<any>(null);
  const questionCheckInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (lessonId) {
      fetchLesson();
      fetchMistakes();
    }
  }, [lessonId]);

  useEffect(() => {
    if (lesson?.interactive_questions && lesson.interactive_questions.length > 0) {
      startQuestionCheck();
    }
    return () => {
      if (questionCheckInterval.current) {
        clearInterval(questionCheckInterval.current);
      }
    };
  }, [lesson]);

  const fetchLesson = async () => {
    try {
      if (!lessonId) return;
      const lessonData = await lessonService.getLessonById(lessonId);
      setLesson(lessonData);
    } catch (error) {
      console.error('Error fetching lesson:', error);
      toast.error('Ders yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchMistakes = async () => {
    try {
      if (!lessonId || !userData?.id) return;
      const { data, error } = await supabase
        .from('lesson_mistakes')
        .select('*')
        .eq('lesson_id', lessonId)
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMistakes(data || []);
    } catch (error) {
      console.error('Error fetching mistakes:', error);
    }
  };

  const startQuestionCheck = () => {
    questionCheckInterval.current = setInterval(() => {
      if (!lesson?.interactive_questions) return;
      
      const currentTime = videoProgress;
      const question = lesson.interactive_questions.find(q => 
        Math.abs(q.timestamp - currentTime) < 2 // 2 saniye tolerans
      );

      if (question && !showQuestionModal) {
        setCurrentQuestion(question);
        setShowQuestionModal(true);
        setIsVideoPlaying(false);
      }
    }, 1000);
  };

  const handleAnswerSubmit = async () => {
    if (!selectedAnswer || !currentQuestion || !userData?.id) return;

    setIsAnswering(true);
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

    if (!isCorrect) {
      // AI explanation için Gemini API çağrısı
      try {
        const explanation = await generateAIExplanation(
          currentQuestion.question,
          currentQuestion.options,
          currentQuestion.correctAnswer,
          selectedAnswer
        );
        setAiExplanation(explanation);
        setShowExplanation(true);

        // Yanlış cevabı Supabase'e kaydet
        await supabase.from('lesson_mistakes').insert({
          user_id: userData.id,
          lesson_id: lessonId,
          question: currentQuestion,
          user_answer: selectedAnswer,
          correct_answer: currentQuestion.correctAnswer,
          ai_explanation: explanation
        });

        // XP kaybı (opsiyonel)
        toast.error('Yanlış cevap! Açıklamayı okuyun.');
      } catch (error) {
        console.error('Error generating AI explanation:', error);
        toast.error('AI açıklaması oluşturulamadı');
      }
    } else {
      // Doğru cevap - XP kazan
      toast.success('Doğru cevap! +15 XP kazandınız!');
      // XP güncelleme işlemi burada yapılabilir
    }

    setIsAnswering(false);
  };

  const closeQuestionModal = () => {
    setShowQuestionModal(false);
    setCurrentQuestion(null);
    setSelectedAnswer('');
    setShowExplanation(false);
    setAiExplanation('');
    setIsVideoPlaying(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Ders Bulunamadı</h2>
          <button 
            onClick={() => navigate('/lessons')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            Derslere Dön
          </button>
        </div>
      </div>
    );
  }

  const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = lesson.youtube_link ? getYouTubeVideoId(lesson.youtube_link) : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/lessons')}
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                ← Derslere Dön
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{lesson.title}</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {lesson.subject} • {lesson.grade_level}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowMistakesHistory(!showMistakesHistory)}
                className="flex items-center space-x-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900"
              >
                <Target className="w-4 h-4" />
                <span>Hatalarım ({mistakes.length})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              {videoId ? (
                <div className="relative aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}`}
                    title={lesson.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400">Video bulunamadı</p>
                </div>
              )}
              
              {/* Video Controls */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {Math.floor(videoProgress / 60)}:{(videoProgress % 60).toFixed(0).padStart(2, '0')}
                    </span>
                    <div className="flex items-center space-x-2">
                      {lesson.interactive_questions?.map((q, index) => (
                        <button
                          key={q.id}
                          onClick={() => {
                            setCurrentQuestion(q);
                            setShowQuestionModal(true);
                          }}
                          className="w-3 h-3 bg-indigo-500 rounded-full hover:bg-indigo-600 transition-colors"
                          title={`Soru ${index + 1} - ${Math.floor(q.timestamp / 60)}:${(q.timestamp % 60).toFixed(0).padStart(2, '0')}`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {lesson.interactive_questions?.length || 0} soru
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Lesson Content */}
            <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Ders İçeriği</h2>
              <div className="prose dark:prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: lesson.content.replace(/\n/g, '<br>') }} />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progress Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">İlerleme</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Video İzleme</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {Math.round((videoProgress / (lesson.interactive_questions?.[lesson.interactive_questions.length - 1]?.timestamp || 100)) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((videoProgress / (lesson.interactive_questions?.[lesson.interactive_questions.length - 1]?.timestamp || 100)) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Sorular</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {mistakes.length} hata
                  </span>
                </div>
              </div>
            </div>

            {/* Mistakes History */}
            {showMistakesHistory && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Hata Geçmişi</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {mistakes.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      Henüz hata yapmadınız! 🎉
                    </p>
                  ) : (
                    mistakes.map((mistake) => (
                      <div key={mistake.id} className="border border-red-200 dark:border-red-800 rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          {mistake.question.question}
                        </p>
                        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                          <p>Senin cevabın: <span className="text-red-600">{mistake.user_answer}</span></p>
                          <p>Doğru cevap: <span className="text-green-600">{mistake.correct_answer}</span></p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Hızlı İstatistikler</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Toplam Süre</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {Math.floor((lesson.interactive_questions?.[lesson.interactive_questions.length - 1]?.timestamp || 0) / 60)} dk
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Toplam Soru</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {lesson.interactive_questions?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Başarı Oranı</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {mistakes.length === 0 ? '100%' : `${Math.round(((lesson.interactive_questions?.length || 0) - mistakes.length) / (lesson.interactive_questions?.length || 1) * 100)}%`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Question Modal */}
      {showQuestionModal && currentQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Soru</h3>
              <button onClick={closeQuestionModal} className="p-2 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {!showExplanation ? (
                <>
                  <p className="text-lg text-gray-900 dark:text-white mb-6">{currentQuestion.question}</p>
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedAnswer(option)}
                        className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                          selectedAnswer === option
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/50'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                      >
                        <span className="font-medium text-gray-900 dark:text-white">{option}</span>
                      </button>
                    ))}
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={handleAnswerSubmit}
                      disabled={!selectedAnswer || isAnswering}
                      className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 font-semibold"
                    >
                      {isAnswering ? <LoadingSpinner size="sm" /> : 'Cevabı Gönder'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-lg font-semibold text-gray-900 dark:text-white">
                    <Lightbulb className="w-6 h-6 text-yellow-500" />
                    <span>AI Açıklaması</span>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <p className="text-gray-900 dark:text-white">{aiExplanation}</p>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={closeQuestionModal}
                      className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-semibold"
                    >
                      Devam Et
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonDetailPage;
