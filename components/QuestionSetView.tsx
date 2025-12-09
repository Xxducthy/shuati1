import React, { useState } from 'react';
import { QuestionSet, Question, LoadingState } from '../types';
import { saveQuestionSet, createInitialId } from '../services/storageService';
import { generateQuestionsFromText } from '../services/geminiService';
import { ArrowLeft, Play, Sparkles, Plus, Trash2, Edit2, CheckCircle2, AlertCircle, X } from 'lucide-react';

interface QuestionSetViewProps {
  questionSet: QuestionSet;
  onBack: () => void;
  onStartPractice: () => void;
  onUpdate: (updatedSet: QuestionSet) => void;
}

const QuestionSetView: React.FC<QuestionSetViewProps> = ({ questionSet, onBack, onStartPractice, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'generate'>('list');
  
  // Manual Add Form State
  const [newQContent, setNewQContent] = useState('');
  const [newQType, setNewQType] = useState<'choice' | 'text'>('choice');
  const [newQOptions, setNewQOptions] = useState<string[]>(['', '', '', '']);
  const [newQCorrect, setNewQCorrect] = useState(''); // Stores text of correct answer
  const [newQExplanation, setNewQExplanation] = useState('');

  // AI Generation State
  const [sourceText, setSourceText] = useState('');
  const [genCount, setGenCount] = useState(5);
  const [genState, setGenState] = useState<LoadingState>(LoadingState.IDLE);
  const [genError, setGenError] = useState('');

  const handleDeleteQuestion = (qId: string) => {
    const updatedSet = {
      ...questionSet,
      questions: questionSet.questions.filter(q => q.id !== qId)
    };
    saveQuestionSet(updatedSet);
    onUpdate(updatedSet);
  };

  const handleAddManual = () => {
    if (!newQContent.trim() || !newQCorrect.trim()) {
      alert("Question and correct answer are required.");
      return;
    }

    const newQuestion: Question = {
      id: createInitialId(),
      type: newQType,
      content: newQContent,
      correctAnswer: newQCorrect,
      explanation: newQExplanation,
      options: newQType === 'choice' ? newQOptions.filter(o => o.trim()) : undefined
    };

    const updatedSet = {
      ...questionSet,
      questions: [...questionSet.questions, newQuestion]
    };
    saveQuestionSet(updatedSet);
    onUpdate(updatedSet);
    
    // Reset Form
    setNewQContent('');
    setNewQOptions(['', '', '', '']);
    setNewQCorrect('');
    setNewQExplanation('');
    setActiveTab('list');
  };

  const handleGenerate = async () => {
    if (!sourceText.trim()) return;
    
    setGenState(LoadingState.LOADING);
    setGenError('');

    try {
      const questions = await generateQuestionsFromText(sourceText, genCount, 'choice'); // Defaulting to choice for now in UI
      const updatedSet = {
        ...questionSet,
        questions: [...questionSet.questions, ...questions]
      };
      saveQuestionSet(updatedSet);
      onUpdate(updatedSet);
      setGenState(LoadingState.SUCCESS);
      setSourceText('');
      setTimeout(() => {
        setGenState(LoadingState.IDLE);
        setActiveTab('list');
      }, 1500);
    } catch (e) {
      setGenState(LoadingState.ERROR);
      setGenError("Failed to generate questions. Please try again later.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <button 
          onClick={onBack}
          className="flex items-center text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Dashboard
        </button>
        <div className="flex gap-3">
           <button 
            onClick={() => setActiveTab('generate')}
            className="flex items-center gap-2 px-4 py-2 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors font-medium"
          >
            <Sparkles className="w-4 h-4" /> AI Generate
          </button>
          <button 
            onClick={() => setActiveTab('add')}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors font-medium"
          >
            <Plus className="w-4 h-4" /> Add Manually
          </button>
          <button 
            onClick={onStartPractice}
            disabled={questionSet.questions.length === 0}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all font-semibold"
          >
            <Play className="w-4 h-4 fill-current" /> Start Practice
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[60vh]">
        {/* Detail Header */}
        <div className="p-8 border-b border-gray-100">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{questionSet.title}</h1>
            <p className="text-gray-500">{questionSet.description || "No description"}</p>
            <div className="mt-4 flex items-center gap-4 text-sm text-gray-400">
                <span className="bg-gray-100 px-3 py-1 rounded-full">{questionSet.questions.length} Questions</span>
                <span>Created: {new Date(questionSet.createdAt).toLocaleDateString()}</span>
            </div>
        </div>

        {/* Content Area */}
        <div className="p-6 bg-gray-50/50 min-h-[400px]">
          
          {/* List View */}
          {activeTab === 'list' && (
            <div className="space-y-4">
              {questionSet.questions.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-gray-500">No questions yet. Add some manually or use AI generation!</p>
                </div>
              ) : (
                questionSet.questions.map((q, idx) => (
                    <div key={q.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-500 mb-2">Q{idx + 1} • {q.type === 'choice' ? 'Multiple Choice' : 'Short Answer'}</span>
                                <h4 className="font-medium text-gray-900 text-lg mb-2">{q.content}</h4>
                                <div className="text-sm text-green-700 bg-green-50 inline-block px-3 py-1 rounded-lg">
                                    Answer: {q.correctAnswer}
                                </div>
                            </div>
                            <button 
                                onClick={() => handleDeleteQuestion(q.id)}
                                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))
              )}
            </div>
          )}

          {/* Add Manual Form */}
          {activeTab === 'add' && (
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Add New Question</h3>
                    <button onClick={() => setActiveTab('list')} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6"/></button>
                </div>
                
                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="qType" checked={newQType === 'choice'} onChange={() => setNewQType('choice')} className="text-primary focus:ring-primary"/>
                                <span>Multiple Choice</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="qType" checked={newQType === 'text'} onChange={() => setNewQType('text')} className="text-primary focus:ring-primary"/>
                                <span>Short Answer</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                        <textarea 
                            value={newQContent}
                            onChange={e => setNewQContent(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                            rows={3}
                            placeholder="Enter the question..."
                        />
                    </div>

                    {newQType === 'choice' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                            <div className="space-y-2">
                                {newQOptions.map((opt, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <div className="flex-shrink-0 w-8 h-10 flex items-center justify-center text-gray-400 font-medium">{String.fromCharCode(65 + idx)}</div>
                                        <input 
                                            value={opt}
                                            onChange={e => {
                                                const newOpts = [...newQOptions];
                                                newOpts[idx] = e.target.value;
                                                setNewQOptions(newOpts);
                                            }}
                                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                            placeholder={`Option ${idx + 1}`}
                                        />
                                        <button 
                                            onClick={() => setNewQCorrect(opt)}
                                            className={`px-3 rounded-lg text-sm font-medium border transition-colors ${newQCorrect === opt && opt !== '' ? 'bg-green-100 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                                            title="Mark as correct"
                                        >
                                            Correct
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {newQType === 'text' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Model Answer</label>
                            <textarea 
                                value={newQCorrect}
                                onChange={e => setNewQCorrect(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                rows={2}
                                placeholder="The ideal answer for grading..."
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Explanation (Optional)</label>
                        <textarea 
                            value={newQExplanation}
                            onChange={e => setNewQExplanation(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                            rows={2}
                            placeholder="Why is this correct?"
                        />
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button 
                            onClick={handleAddManual}
                            className="bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 font-medium shadow-sm"
                        >
                            Save Question
                        </button>
                    </div>
                </div>
            </div>
          )}

          {/* Generate AI Form */}
          {activeTab === 'generate' && (
             <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                 <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2 text-indigo-700">
                         <Sparkles className="w-6 h-6" />
                         <h3 className="text-xl font-bold">Generate with AI</h3>
                    </div>
                    <button onClick={() => setActiveTab('list')} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6"/></button>
                </div>

                {genState === LoadingState.LOADING ? (
                    <div className="py-20 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-gray-600 font-medium">Analyzing text and generating questions...</p>
                        <p className="text-gray-400 text-sm mt-2">This may take a few seconds.</p>
                    </div>
                ) : genState === LoadingState.SUCCESS ? (
                    <div className="py-20 text-center text-green-600">
                        <CheckCircle2 className="w-16 h-16 mx-auto mb-4" />
                        <h4 className="text-2xl font-bold">Questions Generated!</h4>
                        <p className="mt-2">Redirecting to list...</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {genError && (
                            <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                                <AlertCircle className="w-5 h-5"/> {genError}
                            </div>
                        )}
                        <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Source Text</label>
                             <p className="text-xs text-gray-500 mb-2">Paste your lecture notes, article, or summary here.</p>
                             <textarea 
                                value={sourceText}
                                onChange={e => setSourceText(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                                rows={8}
                                placeholder="Paste text content here..."
                             />
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="block text-sm font-medium text-gray-700">Number of Questions:</label>
                            <select 
                                value={genCount}
                                onChange={e => setGenCount(Number(e.target.value))}
                                className="border border-gray-300 rounded-lg px-3 py-2"
                            >
                                <option value={3}>3</option>
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                            </select>
                        </div>
                        <button 
                            onClick={handleGenerate}
                            disabled={!sourceText.trim()}
                            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Sparkles className="w-5 h-5" /> Generate Questions
                        </button>
                    </div>
                )}
             </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default QuestionSetView;