export type QuestionType = 'choice' | 'text';

export interface Question {
  id: string;
  type: QuestionType;
  content: string;
  options?: string[]; // For multiple choice
  correctAnswer: string; // The correct answer text
  explanation?: string; // Optional pre-written explanation
}

export interface QuestionSet {
  id: string;
  title: string;
  description: string;
  createdAt: number;
  questions: Question[];
}

export type AppView = 'DASHBOARD' | 'SET_DETAILS' | 'PRACTICE';

export interface PracticeResult {
  questionId: string;
  isCorrect: boolean;
  userAnswer: string;
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}