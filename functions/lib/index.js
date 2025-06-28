"use strict";
/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFileAsBase64 = exports.generateInteractiveQuestions = exports.getYouTubeTranscript = exports.generateLessonFromKeywords = void 0;
const functions = __importStar(require("firebase-functions"));
const logger = __importStar(require("firebase-functions/logger"));
const admin = __importStar(require("firebase-admin"));
const generative_ai_1 = require("@google/generative-ai");
const youtube_transcript_1 = require("youtube-transcript");
// Initialize Firebase Admin
admin.initializeApp();
const storage = admin.storage();
// Initialize Gemini
let genAI;
const API_KEY = (_a = functions.config().gemini) === null || _a === void 0 ? void 0 : _a.key;
if (API_KEY) {
    genAI = new generative_ai_1.GoogleGenerativeAI(API_KEY);
}
else {
    logger.error("GEMINI_API_KEY environment variable not set. Functions will not work.");
}
exports.generateLessonFromKeywords = functions.https.onCall(async (data, context) => {
    if (!genAI) {
        logger.error("Gemini AI is not initialized. Check API key.");
        throw new functions.https.HttpsError("failed-precondition", "AI service is not configured.");
    }
    const { title, subject, gradeLevel, keywords } = data;
    if (!title || !subject || !gradeLevel || !keywords) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields: title, subject, gradeLevel, keywords.');
    }
    const prompt = `You are an expert curriculum developer. Your task is to generate a comprehensive lesson plan based on the following details.
The output must be in Turkish and formatted as a clean, well-structured Markdown document.

Lesson Title: "${title}"
Subject: "${subject}"
Grade Level: "${gradeLevel}"
Keywords/Summary:
---
${keywords}
---

Please generate the lesson content. Include headings (##), subheadings (###), lists (* or -), bold text, and other Markdown elements to create a rich, readable, and engaging educational text.
The content should be detailed and suitable for the specified grade level.
Do not include any text or explanation outside of the Markdown content itself.`;
    try {
        const result = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }).generateContent(prompt);
        const content = result.response.text();
        return { content };
    }
    catch (error) {
        logger.error("Gemini API error:", error);
        throw new functions.https.HttpsError("internal", "Failed to generate lesson content.", error);
    }
});
exports.getYouTubeTranscript = functions.https.onCall(async (data, context) => {
    var _a, _b;
    const videoUrl = data.url;
    if (!videoUrl || typeof videoUrl !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with one argument "url" containing the video URL to process.');
    }
    try {
        const transcript = await youtube_transcript_1.YoutubeTranscript.fetchTranscript(videoUrl);
        if (!transcript || transcript.length === 0) {
            throw new functions.https.HttpsError('not-found', 'No transcript found for this video. It might be disabled or unavailable.');
        }
        const fullText = transcript.map((item) => item.text).join(' ');
        return { transcript: fullText };
    }
    catch (error) {
        logger.error("Transcript fetch error:", error);
        if ((_a = error.message) === null || _a === void 0 ? void 0 : _a.includes("subtitles")) {
            throw new functions.https.HttpsError('not-found', 'Transcripts are disabled for this video.');
        }
        if ((_b = error.message) === null || _b === void 0 ? void 0 : _b.includes("No transcripts are available")) {
            throw new functions.https.HttpsError('not-found', 'No transcripts are available for this video.');
        }
        throw new functions.https.HttpsError('internal', 'An unexpected error occurred while fetching the transcript.', error.message);
    }
});
exports.generateInteractiveQuestions = functions.https.onCall(async (data, context) => {
    if (!genAI) {
        logger.error("Gemini AI is not initialized. Check API key.");
        throw new functions.https.HttpsError("failed-precondition", "AI service is not configured.");
    }
    const { transcript } = data;
    if (!transcript) {
        throw new functions.https.HttpsError('invalid-argument', 'The function must be called with "transcript" data.');
    }
    const prompt = `
        You are an expert instructional designer creating interactive video quizzes.
        Based on the following video transcript, your task is to generate exactly 3 multiple-choice questions.
        For each question, you must also provide the most relevant timestamp (in total seconds) where the answer can be found.
        The timestamps should be spread out and cover different parts of the video.

        You MUST return the output as a valid JSON array of objects. Do not include any text, explanation, or markdown formatting like \`\`\`json before or after the JSON array.

        The JSON structure for each object must be:
        {
          "timestamp": <number>, // The time in total seconds.
          "question": "<The question text>",
          "options": ["<Option A>", "<Option B>", "<Option C>", "<Option D>"],
          "correctAnswer": "<The text of the correct option>" // This must be an exact match to one of the options.
        }

        Here is the transcript:
        ---
        ${transcript}
        ---
    `;
    try {
        const result = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }).generateContent(prompt);
        let textResponse = result.response.text();
        // Clean the response to ensure it's valid JSON
        textResponse = textResponse.trim().replace(/^```json\s*/, '').replace(/```$/, '');
        // Basic validation
        if (!textResponse.startsWith('[') || !textResponse.endsWith(']')) {
            logger.error("AI did not return a valid JSON array.", { rawResponse: textResponse });
            throw new Error("AI response was not in the expected format.");
        }
        const questions = JSON.parse(textResponse);
        return { questions };
    }
    catch (error) {
        logger.error("Interactive questions generation failed:", error);
        throw new functions.https.HttpsError("internal", "Failed to generate interactive questions from the transcript.", error.message);
    }
});
exports.uploadFileAsBase64 = functions.runWith({ memory: "1GB" }).https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Dosya yüklemek için giriş yapmış olmalısınız.");
    }
    const { fileData, filePath, fileType } = data;
    if (!fileData || !filePath || !fileType) {
        throw new functions.https.HttpsError("invalid-argument", "Fonksiyon 'fileData', 'filePath' ve 'fileType' argümanları ile çağrılmalıdır.");
    }
    try {
        const base64EncodedString = fileData.split(';base64,').pop();
        if (!base64EncodedString) {
            throw new Error('Geçersiz Base64 formatı.');
        }
        const fileBuffer = Buffer.from(base64EncodedString, 'base64');
        const bucket = storage.bucket("gs://neutraledumain.appspot.com");
        const file = bucket.file(filePath);
        await file.save(fileBuffer, {
            metadata: {
                contentType: fileType,
            },
        });
        // Make the file public and return the URL
        await file.makePublic();
        const publicUrl = file.publicUrl();
        return { downloadURL: publicUrl };
    }
    catch (error) {
        logger.error("Base64 upload failed:", error);
        throw new functions.https.HttpsError("internal", "Dosya yüklenemedi.", error.message);
    }
});
//# sourceMappingURL=index.js.map