import React, { useState, useEffect, useMemo } from 'react';
import { lessonService } from '../lib/supabase';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import { BookMarked, Search, DownloadCloud, BookCopy, ArrowLeft, Play, Clock, Target } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

interface Lesson {
    id: string;
    title: string;
    subject: string;
    grade_level: string;
    content: string;
    created_at: string;
    cover_image_url?: string;
    youtube_link?: string;
    attachments?: { name: string; url: string; }[];
    interactive_questions?: InteractiveQuestion[];
}

interface InteractiveQuestion {
    id: string;
    timestamp: number;
    question: string;
    options: string[];
    correctAnswer: string;
}

// Bu listeler AdminPage'den kopyalandı, idealde ortak bir dosyada olabilir.
const availableSubjects = [
  'Matematik', 'Fizik', 'Kimya', 'Biyoloji', 
  'Türkçe', 'Edebiyat', 'Tarih', 'Coğrafya', 'Felsefe'
];
const gradeLevels = ['9. Sınıf', '10. Sınıf', '11. Sınıf', '12. Sınıf', 'YKS', 'LGS'];

const getYouTubeEmbedUrl = (url: string | undefined): string | null => {
    if (!url) return null;
    let videoId: string | null = null;
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname === 'youtu.be') {
            videoId = urlObj.pathname.slice(1);
        } else if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
            videoId = urlObj.searchParams.get('v');
        }
    } catch (error) {
        console.error("Invalid URL:", error);
        return null;
    }
    
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
};

const LessonsPage: React.FC = () => {
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ subject: 'all', gradeLevel: 'all' });
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchLessons = async () => {
            setLoading(true);
            try {
                const lessonsList = await lessonService.getAllLessons();
                setLessons(lessonsList);
            } catch (error) {
                console.error("Dersler alınırken hata:", error);
                toast.error('Dersler yüklenirken hata oluştu');
            }
            setLoading(false);
        };
        fetchLessons();
    }, []);

    const filteredLessons = useMemo(() => {
        return lessons
            .filter(lesson => filters.subject === 'all' || lesson.subject === filters.subject)
            .filter(lesson => filters.gradeLevel === 'all' || lesson.grade_level === filters.gradeLevel)
            .filter(lesson => lesson.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [lessons, filters, searchQuery]);

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><LoadingSpinner size="lg"/></div>;
    }

    // Ders listesi görünümü
    return (
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Üst Başlık ve Filtreler */}
                <div className="md:flex md:items-center md:justify-between mb-8">
                    <div className="flex-1 min-w-0">
                        <h1 className="text-3xl font-bold leading-tight text-gray-900 dark:text-white">Ders Kütüphanesi</h1>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            İnteraktif sorular ve AI destekli öğrenme deneyimi
                        </p>
                    </div>
                    <div className="mt-4 flex md:mt-0 md:ml-4">
                        <div className="relative w-full max-w-xs">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Ders ara..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <select onChange={(e) => setFilters(f => ({...f, subject: e.target.value}))} className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="all" className="bg-white dark:bg-gray-800">Tüm Dersler</option>
                        {availableSubjects.map(s => <option className="bg-white dark:bg-gray-800" key={s} value={s}>{s}</option>)}
                    </select>
                     <select onChange={(e) => setFilters(f => ({...f, gradeLevel: e.target.value}))} className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="all" className="bg-white dark:bg-gray-800">Tüm Sınıflar</option>
                        {gradeLevels.map(g => <option className="bg-white dark:bg-gray-800" key={g} value={g}>{g}</option>)}
                    </select>
                </div>

                {/* Ders Kartları Grid */}
                {filteredLessons.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredLessons.map(lesson => (
                            <Link 
                                key={lesson.id} 
                                to={`/dashboard/lessons/${lesson.id}`}
                                className="bg-white dark:bg-gray-800 rounded-xl shadow-md cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group"
                            >
                                <div className="relative h-40 w-full overflow-hidden">
                                    {lesson.cover_image_url ? (
                                        <img src={lesson.cover_image_url} alt={lesson.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    ) : lesson.youtube_link ? (
                                        <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center group-hover:bg-gray-300 dark:group-hover:bg-gray-600 transition-colors">
                                            <Play className="w-12 h-12 text-gray-400 dark:text-gray-500 group-hover:text-indigo-500" />
                                        </div>
                                    ) : (
                                        <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                            <BookCopy className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                                        </div>
                                    )}
                                    
                                    {/* Interactive Questions Badge */}
                                    {lesson.interactive_questions && lesson.interactive_questions.length > 0 && (
                                        <div className="absolute top-2 right-2 bg-indigo-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                            <Target className="w-3 h-3" />
                                            {lesson.interactive_questions.length} Soru
                                        </div>
                                    )}
                                </div>
                                <div className="p-5 flex-grow">
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2">{lesson.title}</h3>
                                    <div className="flex items-center gap-2 text-sm mb-3">
                                        <span className="font-medium text-indigo-600 dark:text-indigo-400">{lesson.subject}</span>
                                        <span className="text-gray-500 dark:text-gray-400">•</span>
                                        <span className="text-gray-500 dark:text-gray-400">{lesson.grade_level}</span>
                                    </div>
                                    
                                    {/* Lesson Stats */}
                                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            <span>
                                                {lesson.interactive_questions && lesson.interactive_questions.length > 0 
                                                    ? `${Math.floor(lesson.interactive_questions[lesson.interactive_questions.length - 1].timestamp / 60)} dk`
                                                    : '5 dk'
                                                }
                                            </span>
                                        </div>
                                        {lesson.youtube_link && (
                                            <div className="flex items-center gap-1">
                                                <Play className="w-3 h-3" />
                                                <span>Video</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 px-5 py-3 text-sm font-medium text-indigo-700 dark:text-indigo-300 mt-auto group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/50 transition-colors">
                                    Dersi İzle →
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                         <Search className="mx-auto h-12 w-12 text-gray-400" />
                        <h2 className="mt-4 text-xl font-medium text-gray-700 dark:text-gray-300">Sonuç Bulunamadı</h2>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Arama kriterlerinizi değiştirmeyi deneyin.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default LessonsPage; 