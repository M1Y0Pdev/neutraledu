import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

// Rate limiting için basit bir queue sistemi
let requestQueue: Array<() => Promise<any>> = [];
let isProcessing = false;
const RATE_LIMIT_DELAY = 1000; // 1 saniye

const processQueue = async () => {
  if (isProcessing || requestQueue.length === 0) return;
  
  isProcessing = true;
  
  while (requestQueue.length > 0) {
    const request = requestQueue.shift();
    if (request) {
      try {
        await request();
        // Rate limit için bekle
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
      } catch (error) {
        console.error('Queue request failed:', error);
      }
    }
  }
  
  isProcessing = false;
};

const addToQueue = (request: () => Promise<any>) => {
  requestQueue.push(request);
  processQueue();
};

// Retry mekanizması
const retryWithBackoff = async (fn: () => Promise<any>, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (error.message?.includes('429') && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff: 1s, 2s, 4s
        console.log(`Rate limited, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
};

// Offline fallback responses
const getOfflineResponse = (type: 'chat' | 'question' | 'explanation' | 'image') => {
  switch (type) {
    case 'chat':
      return "Merhaba! Şu anda API kullanım limitimiz dolmuş durumda. Lütfen birkaç dakika bekleyip tekrar deneyin. Bu süre zarfında size yardımcı olabileceğim başka konular hakkında sorular sorabilirsiniz.";
    case 'question':
      return "Bu konu hakkında temel sorular oluşturmak için API'ye ihtiyacım var. Şu anda kullanım limitimiz dolmuş durumda. Lütfen daha sonra tekrar deneyin.";
    case 'explanation':
      return "Bu soru hakkında detaylı açıklama yapmak için API'ye ihtiyacım var. Şu anda kullanım limitimiz dolmuş durumda. Lütfen daha sonra tekrar deneyin.";
    case 'image':
      return "Bu resmi analiz etmek için API'ye ihtiyacım var. Şu anda kullanım limitimiz dolmuş durumda. Lütfen daha sonra tekrar deneyin.";
    default:
      return "Şu anda API kullanım limitimiz dolmuş durumda. Lütfen birkaç dakika bekleyip tekrar deneyin.";
  }
};

export const generateText = async (prompt: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    addToQueue(async () => {
      try {
        const result = await retryWithBackoff(async () => {
          const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
          const result = await model.generateContent(prompt);
          const response = await result.response;
          return response.text();
        });
        resolve(result);
      } catch (error: any) {
        console.error('Error generating text with Gemini:', error);
        
        // Rate limit hatası durumunda offline fallback
        if (error.message?.includes('429') || error.message?.includes('quota')) {
          resolve(getOfflineResponse('chat'));
        } else {
          reject(error);
        }
      }
    });
  });
};

export const analyzeImage = async (prompt: string, imageBase64: string, mimeType: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    addToQueue(async () => {
      try {
        const result = await retryWithBackoff(async () => {
          const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
          
          const imagePart = {
            inlineData: {
              data: imageBase64,
              mimeType: mimeType,
            },
          };

          const result = await model.generateContent([prompt, imagePart]);
          const response = await result.response;
          return response.text();
        });
        resolve(result);
      } catch (error: any) {
        console.error('Error analyzing image with Gemini:', error);
        
        // Rate limit hatası durumunda offline fallback
        if (error.message?.includes('429') || error.message?.includes('quota')) {
          resolve(getOfflineResponse('image'));
        } else {
          reject(error);
        }
      }
    });
  });
};

export const generateAIExplanation = async (
  question: string,
  options: string[],
  correctAnswer: string,
  userAnswer: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    addToQueue(async () => {
      try {
        const prompt = `
        Öğrenci şu soruyu yanlış cevapladı:
        
        Soru: ${question}
        Seçenekler: ${options.join(', ')}
        Doğru Cevap: ${correctAnswer}
        Öğrencinin Cevabı: ${userAnswer}
        
        Lütfen öğrenciye şunları açıkla:
        1. Neden bu hatayı yaptığını
        2. Doğru cevabın nasıl bulunacağını
        3. Benzer sorularda dikkat etmesi gereken noktaları
        
        Kısa, anlaşılır ve motive edici bir şekilde yaz. Türkçe olarak yanıtla.
        `;

        const result = await retryWithBackoff(async () => {
          const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
          const result = await model.generateContent(prompt);
          const response = await result.response;
          return response.text();
        });
        resolve(result);
      } catch (error: any) {
        console.error('Error generating AI explanation:', error);
        
        // Rate limit hatası durumunda offline fallback
        if (error.message?.includes('429') || error.message?.includes('quota')) {
          resolve(getOfflineResponse('explanation'));
        } else {
          // Fallback explanation
          resolve(`Bu soruda ${userAnswer} cevabını verdin, ancak doğru cevap ${correctAnswer}. 
          Bu tür sorularda dikkat etmen gereken nokta, soruyu dikkatli okumak ve tüm seçenekleri değerlendirmektir. 
          Bir dahaki sefere daha dikkatli ol! 💪`);
        }
      }
    });
  });
};

export const generateQuestionFromContent = async (content: string, subject: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    addToQueue(async () => {
      try {
        const prompt = `
        Aşağıdaki ders içeriğinden 3 adet çoktan seçmeli soru oluştur:
        
        Ders İçeriği: ${content}
        Konu: ${subject}
        
        Her soru için şu formatı kullan:
        {
          "id": "unique-id",
          "timestamp": 60,
          "question": "Soru metni",
          "options": ["A) Seçenek 1", "B) Seçenek 2", "C) Seçenek 3", "D) Seçenek 4"],
          "correctAnswer": "A) Seçenek 1"
        }
        
        Timestamp'ler 30, 120, 300 saniye olarak ayarla.
        JSON formatında döndür.
        `;

        const result = await retryWithBackoff(async () => {
          const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
          const result = await model.generateContent(prompt);
          const response = await result.response;
          return response.text();
        });
        
        const text = result;
        
        // JSON parse etmeye çalış
        try {
          resolve(JSON.parse(text));
        } catch {
          // JSON parse edilemezse, basit sorular oluştur
          resolve([
            {
              id: "q1",
              timestamp: 30,
              question: "Bu konu hakkında ne öğrendin?",
              options: ["A) Temel kavramlar", "B) Detaylı analiz", "C) Pratik uygulama", "D) Hepsi"],
              correctAnswer: "D) Hepsi"
            },
            {
              id: "q2", 
              timestamp: 120,
              question: "Hangi yöntem daha etkili?",
              options: ["A) Geleneksel yöntem", "B) Modern yaklaşım", "C) Hibrit yöntem", "D) Deneme yanılma"],
              correctAnswer: "C) Hibrit yöntem"
            },
            {
              id: "q3",
              timestamp: 300,
              question: "Bu bilgiyi nasıl uygularsın?",
              options: ["A) Ezberleyerek", "B) Anlayarak", "C) Pratik yaparak", "D) B ve C"],
              correctAnswer: "D) B ve C"
            }
          ]);
        }
      } catch (error) {
        console.error('Error generating questions:', error);
        reject(error);
      }
    });
  });
}; 