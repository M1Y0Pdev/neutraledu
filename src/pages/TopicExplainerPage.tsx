import React, { useState, useRef } from 'react';
import { BookOpen, Sparkles, BrainCircuit, Download, Loader } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'react-hot-toast';
import { generateText } from '../lib/gemini';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const gradeLevels = ['9. Sınıf', '10. Sınıf', '11. Sınıf', '12. Sınıf', 'YKS', 'LGS', 'Diğer'];

const TopicExplainerPage: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [gradeLevel, setGradeLevel] = useState('YKS');
    const [generatedContent, setGeneratedContent] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    const handleGenerateContent = async () => {
        if (!topic) {
            toast.error("Lütfen bir konu başlığı girin.");
            return;
        }
        setIsGenerating(true);
        setGeneratedContent('');
        const toastId = toast.loading("Yapay zeka sizin için çalışıyor...");

        try {
            const systemPrompt = `Bir uzman eğitimci ve içerik üreticisi olarak davran. Görevin, verilen konu ve sınıf seviyesine uygun, kapsamlı ve anlaşılır bir ders içeriği oluşturmak. Çıktın, aşağıdaki yapıya sadık kalarak Markdown formatında olmalıdır:

            # {Konu Başlığı}
            **Sınıf Düzeyi:** {Sınıf Düzeyi}

            ---

            ## 📚 Ders Planı ve Hedefler
            - **Ana Tema:** Bu dersin ana fikri ve odak noktası.
            - **Öğrenme Hedefleri:**
                - Bu dersin sonunda öğrenci neyi bilecek? (En az 3 hedef)
                - Öğrenci hangi becerileri kazanacak?

            ---

            ## ✨ Detaylı Konu Anlatımı
            *Konuya ilgi çekici bir giriş yap. Örneğin, "Merhaba sevgili {Sınıf Düzeyi} kahramanı! Bugün {Konu} dünyasına dalıyoruz..." gibi samimi bir dil kullan.*

            ### {Alt Başlık 1}
            *Konunun ilk önemli bölümünü açıkla. Gerekirse listeler veya örnekler kullan.*

            ### {Alt Başlık 2}
            *Konunun ikinci önemli bölümünü açıkla. Karmaşık fikirleri basitleştir.*

            **Önemli Not:** *Konuyla ilgili kritik bir ipucu veya uyarı ekle.*

            ---

            ## 💡 Örnek Soru ve Çözümü
            *Konuyu pekiştirecek, seviyeye uygun bir örnek soru ve adım adım çözümünü sun.*

            ## สรุป (Özet)
            *Tüm konuyu 2-3 cümleyle özetle.*
            `;

            const userPrompt = `Konu: ${topic}, Sınıf Seviyesi: ${gradeLevel}`;
            
            const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
            const text = await generateText(fullPrompt);

            setGeneratedContent(text);
            toast.dismiss(toastId);
            toast.success("Konu anlatımı başarıyla oluşturuldu!");

        } catch (error) {
            toast.dismiss(toastId);
            toast.error("İçerik üretilirken bir hata oluştu.");
            console.error("AI content generation failed:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGeneratePdf = async () => {
        if (!generatedContent || !contentRef.current) {
            toast.error("PDF oluşturmak için önce içerik üretmelisiniz.");
            return;
        }
        const toastId = toast.loading("PDF oluşturuluyor...");
        try {
            const contentToRender = contentRef.current;
            const canvas = await html2canvas(contentToRender, {
                scale: 2,
                backgroundColor: '#1f2937' // dark background for the canvas
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgHeight = (canvas.height * pdfWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
            heightLeft -= pdf.internal.pageSize.getHeight();

            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                heightLeft -= pdf.internal.pageSize.getHeight();
            }

            pdf.save(`${topic.replace(/ /g, '_')}_konu_anlatimi.pdf`);
            toast.dismiss(toastId);
            toast.success("PDF başarıyla indirildi!");
        } catch (error) {
            toast.dismiss(toastId);
            toast.error("PDF oluşturulurken bir hata oluştu.");
            console.error("PDF generation failed:", error);
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
            <header className="text-center mb-12">
                <BrainCircuit className="mx-auto h-16 w-16 text-indigo-500 mb-4" />
                <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">AI Konu Anlatımı</h1>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    Merak ettiğiniz herhangi bir konuyu girin, yapay zeka sizin için yapılandırılmış bir ders materyali hazırlasın.
                </p>
            </header>

            <main className="max-w-4xl mx-auto">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2">
                            <label htmlFor="topic" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Konu Başlığı</label>
                            <input
                                type="text"
                                id="topic"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="Örn: Fonksiyonlar, I. Dünya Savaşı'nın Nedenleri..."
                                className="w-full px-4 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label htmlFor="gradeLevel" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Sınıf Düzeyi</label>
                            <select
                                id="gradeLevel"
                                value={gradeLevel}
                                onChange={(e) => setGradeLevel(e.target.value)}
                                className="w-full px-4 py-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {gradeLevels.map(level => <option key={level} value={level}>{level}</option>)}
                            </select>
                        </div>
                    </div>
                    <button
                        onClick={handleGenerateContent}
                        disabled={isGenerating}
                        className="w-full mt-6 flex items-center justify-center bg-indigo-600 text-white px-6 py-4 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors font-bold text-lg"
                    >
                        {isGenerating ? <><Loader className="animate-spin mr-3" /> Oluşturuluyor...</> : <><Sparkles className="w-6 h-6 mr-3" /> Anlatımı Oluştur</>}
                    </button>
                </div>

                {generatedContent && (
                    <div className="mt-12">
                        <div className="flex justify-end mb-4">
                            <button
                                onClick={handleGeneratePdf}
                                className="flex items-center justify-center bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
                            >
                                <Download className="w-5 h-5 mr-2" /> PDF olarak İndir
                            </button>
                        </div>
                        <div ref={contentRef} className="bg-gray-800 p-8 rounded-2xl shadow-inner">
                            <div className="prose prose-lg prose-invert max-w-none">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{generatedContent}</ReactMarkdown>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default TopicExplainerPage; 