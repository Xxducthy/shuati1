import { QuestionSet, Question } from '../types';

const STORAGE_KEY = 'examprep_data_v1';

export const getQuestionSets = (): QuestionSet[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load data", e);
    return [];
  }
};

export const saveQuestionSet = (set: QuestionSet): void => {
  const sets = getQuestionSets();
  const existingIndex = sets.findIndex(s => s.id === set.id);
  
  if (existingIndex >= 0) {
    sets[existingIndex] = set;
  } else {
    sets.push(set);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
};

export const deleteQuestionSet = (id: string): void => {
  const sets = getQuestionSets();
  const newSets = sets.filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newSets));
};

export const createInitialId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};