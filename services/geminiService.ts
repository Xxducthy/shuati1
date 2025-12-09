import { GoogleGenAI, Type } from "@google/genai";
import { Question, QuestionType } from "../types";

// NOTE: API Key must be provided via process.env.API_KEY in the environment
// We do not ask the user for it in the UI as per instructions.
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

const MODEL_NAME = 'gemini-2.5-flash';

export const generateQuestionsFromText = async (
  text: string, 
  count: number = 5,
  qType: QuestionType = 'choice'
): Promise<Question[]> => {
  if (!text.trim()) return [];

  const prompt = `
    Generate ${count} ${qType === 'choice' ? 'multiple choice' : 'short answer'} questions based on the following text.
    
    Text content:
    "${text.slice(0, 8000)}" 
    
    Ensure the questions are suitable for a final exam review.
  `;

  // Define schema for structured output
  const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        content: { type: Type.STRING, description: "The question text" },
        options: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "Array of 4 possible options (only if multiple choice)"
        },
        correctAnswer: { type: Type.STRING, description: "The correct answer text exactly matching one of the options or the model answer" },
        explanation: { type: Type.STRING, description: "Brief explanation of why this answer is correct" }
      },
      required: ["content", "correctAnswer", "explanation"],
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        systemInstruction: "You are a strict and helpful professor preparing exam questions.",
      }
    });

    const rawQuestions = JSON.parse(response.text || '[]');
    
    return rawQuestions.map((q: any) => ({
      id: Math.random().toString(36).substr(2, 9),
      type: qType,
      content: q.content,
      options: qType === 'choice' ? q.options : undefined,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation
    }));
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw new Error("Failed to generate questions. Please try again.");
  }
};

export const explainAnswer = async (question: Question, userAnswer: string): Promise<string> => {
  const prompt = `
    The user is practicing exam questions.
    
    Question: "${question.content}"
    Correct Answer: "${question.correctAnswer}"
    User's Answer: "${userAnswer}"
    
    Please explain why the correct answer is right. 
    If the user's answer was wrong, briefly explain why their answer is incorrect.
    Keep it concise (under 100 words).
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text || "No explanation available.";
  } catch (error) {
    return "Could not retrieve explanation at this time.";
  }
};

export const gradeSubjectiveAnswer = async (question: Question, userAnswer: string): Promise<{ isCorrect: boolean; feedback: string }> => {
  const prompt = `
    You are grading a short answer exam question.
    
    Question: "${question.content}"
    Model Answer: "${question.correctAnswer}"
    Student Answer: "${userAnswer}"
    
    1. Determine if the student's answer is essentially correct based on the model answer. 
    2. Provide brief feedback.
    
    Output JSON.
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      isCorrect: { type: Type.BOOLEAN },
      feedback: { type: Type.STRING }
    },
    required: ["isCorrect", "feedback"]
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    });

    return JSON.parse(response.text || '{"isCorrect": false, "feedback": "Error grading."}');
  } catch (error) {
    console.error("Grading error", error);
    return { isCorrect: false, feedback: "AI grading failed." };
  }
};