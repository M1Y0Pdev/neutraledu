import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';
import { Send, Loader, ArrowLeft, Bot, User, Paperclip } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateText } from '../lib/gemini';

interface Message {
    role: 'user' | 'model';
    content: string;
    timestamp: Date;
}

interface Coach {
    userId: string;
    coachName: string;
    examType: string;
    targetDate: string;
    subjects: string[];
    communicationTone: string[];
    interactions: string[];
    dailyHours: string;
    personality: string;
    chatHistory: Message[];
}

const ChatPage = () => {
    const { coachId } = useParams<{ coachId: string }>();
    const { currentUser, userData } = useAuth();
    const navigate = useNavigate();

    const [coach, setCoach] = useState<Coach | null>(null);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!coachId || !currentUser) {
            navigate('/');
            return;
        }

        const coachRef = doc(db, 'coaches', coachId);
        const unsubscribe = onSnapshot(coachRef, (docSnap) => {
            if (docSnap.exists()) {
                const coachData = docSnap.data() as Coach;

                if (coachData.userId !== currentUser.uid) {
                    toast.error("Bu sohbet sayfasına erişim yetkiniz yok.");
                    navigate('/dashboard');
                    return;
                }
                
                setCoach(coachData);
                setLoading(false);
            } else {
                toast.error("Koç bulunamadı. Lütfen yeni bir tane oluşturun.");
                navigate('/dashboard/coaches');
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [coachId, currentUser, navigate]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [coach?.chatHistory]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !coachId || isSending || !coach) return;

        setIsSending(true);
        const userMessageContent = newMessage;
        setNewMessage('');

        const userMessage: Message = {
            role: 'user',
            content: userMessageContent,
            timestamp: new Date(),
        };

        const coachRef = doc(db, 'coaches', coachId);
        setCoach(prev => prev ? { ...prev, chatHistory: [...prev.chatHistory, userMessage] } : null);
        try {
            await updateDoc(coachRef, { chatHistory: arrayUnion(userMessage) });

            const systemPrompt = `Sen, ${coach.coachName} adında bir kişisel öğrenci koçusun. Kullanıcının hedefi ${coach.examType} sınavını ${coach.targetDate} tarihinde başarmak. Odaklanacağınız dersler: ${coach.subjects.join(', ')}. İletişim tonun şöyle olmalı: ${coach.communicationTone.join(', ')}. Kullanıcıyla şu şekillerde etkileşim kurman bekleniyor: ${coach.interactions.join(', ')}. Kişilik özelliklerin: ${coach.personality}. Kısa, net ve samimi cevaplar ver. Kullanıcının sorularına bu kimlikle cevap ver.`;
            
            // Chat history'yi string formatına çevir
            const chatHistoryText = coach.chatHistory.map(msg => 
                `${msg.role === 'user' ? 'Öğrenci' : 'Koç'}: ${msg.content}`
            ).join('\n');
            
            const fullPrompt = `${systemPrompt}\n\nSohbet geçmişi:\n${chatHistoryText}\n\nÖğrenci: ${userMessageContent}\n\nKoç:`;

            const responseText = await generateText(fullPrompt);
            
            // Eğer offline fallback mesajı geldiyse kullanıcıya bilgi ver
            if (responseText.includes('API kullanım limitimiz dolmuş')) {
                toast.success("API kullanım limiti aşıldı. Koç geçici olarak offline modda çalışıyor.");
            }
            
            const aiMessage: Message = { role: 'model', content: responseText, timestamp: new Date() };
            await updateDoc(coachRef, { chatHistory: arrayUnion(aiMessage) });
        } catch (error: any) {
            console.error("AI cevabı alınırken hata oluştu:", error);
            
            // Artık generateText fonksiyonu hata fırlatmıyor, bu kısım sadece diğer hatalar için
            toast.error("Üzgünüm, bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
            
            setCoach(prev => prev ? { ...prev, chatHistory: prev.chatHistory.slice(0, -1) } : null);
        } finally {
            setIsSending(false);
        }
    };

    const handleFileUpload = () => {
        toast.success('Dosya yükleme özelliği yakında gelecek!', { icon: '🚀' });
    }

    if (loading) {
        return <div className="flex justify-center items-center h-full"><Loader className="animate-spin text-indigo-500" size={48} /></div>;
    }

    if (!coach) {
        return <div className="text-center p-8">Koç bilgileri yüklenemedi.</div>;
    }

    return (
        <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <header className="bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex items-center shadow-sm sticky top-0 z-10">
                <button onClick={() => navigate('/dashboard/coaches')} className="mr-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                    <ArrowLeft size={20} />
                </button>
                <div className="flex items-center">
                   <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center mr-3">
                       <Bot className="text-white"/>
                   </div>
                   <div>
                       <h1 className="text-xl font-bold">{coach.coachName}</h1>
                       <p className="text-sm text-gray-500 dark:text-gray-400">Hedef: {coach.examType} - {new Date(coach.targetDate).toLocaleDateString('tr-TR')}</p>
                   </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-6 space-y-8">
                {coach.chatHistory.map((msg, index) => (
                    <div key={index} className={`flex items-end gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'model' && (
                             <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                                <Bot size={20} className="text-white"/>
                            </div>
                        )}
                        <div className={`max-w-xl p-4 rounded-2xl ${
                            msg.role === 'user' 
                            ? 'bg-indigo-600 text-white rounded-br-none' 
                            : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none'
                        }`}>
                           <p style={{whiteSpace: 'pre-wrap'}}>{msg.content}</p>
                        </div>
                         {msg.role === 'user' && (
                             <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0 font-bold">
                                {userData?.name?.[0].toUpperCase() ?? <User size={20} />}
                            </div>
                        )}
                    </div>
                ))}
                 <div ref={messagesEndRef} />
            </main>

            <footer className="bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700 sticky bottom-0">
                <form onSubmit={handleSendMessage} className="flex items-center gap-4 max-w-4xl mx-auto">
                     <button type="button" onClick={handleFileUpload} className="p-2 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-full">
                        <Paperclip size={24} />
                    </button>
                    <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage(e as any);
                            }
                        }}
                        placeholder="Mesajınızı yazın..."
                        className="flex-1 p-3 bg-gray-100 dark:bg-gray-700 rounded-xl resize-none border-transparent focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        rows={1}
                        disabled={isSending}
                    />
                    <button type="submit" disabled={isSending || !newMessage.trim()} className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors">
                        {isSending ? <Loader size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                </form>
            </footer>
        </div>
    );
};

export default ChatPage; 