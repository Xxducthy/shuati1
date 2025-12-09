import React, { useState, useEffect } from 'react';
import { QuestionSet, Question } from '../types';
import { explainAnswer, gradeSubjectiveAnswer } from '../services/geminiService';
import { ArrowLeft, CheckCircle, XCircle, HelpCircle, AlertTriangle, RotateCw, ChevronRight } from 'lucide-react';

interface PracticeSessionProps {
  questionSet: QuestionSet;
  onExit: () => void;
}

const PracticeSession: React.FC<PracticeSessionProps> = ({ questionSet, onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[] | null>(null);
  
  // Current Question State
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  
  // Feedback State
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Score
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (questionSet.questions.length > 0) {
      // Shuffle questions on mount
      const shuffled = [...questionSet.questions].sort(() => Math.random() - 0.5);
      setShuffledQuestions(shuffled);
    } else {
      setShuffledQuestions([]);
    }
  }, [questionSet]);

  // Loading state
  if (shuffledQuestions === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
           <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
           <p className="text-gray-500">Preparing session...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (shuffledQuestions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-md">
           <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
           <h3 className="text-xl font-bold text-gray-900 mb-2">No Questions Available</h3>
           <p className="text-gray-500 mb-6">This set has no questions to practice. Add some questions or generate them with AI first.</p>
           <button 
             onClick={onExit}
             className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700 font-medium"
           >
             Go Back
           </button>
        </div>
      </div>
    );
  }

  const currentQuestion = shuffledQuestions[currentIndex];

  const handleSubmit = async () => {
    if (!currentQuestion) return;
    setHasSubmitted(true);
    setLoadingAi(true);

    if (currentQuestion.type === 'choice') {
      const correct = selectedOption === currentQuestion.correctAnswer;
      setIsCorrect(correct);
      if (correct) setScore(s => s + 1);
      
      // Fetch AI explanation if wrong or just to reinforce
      // For UX speed, we can show local explanation first if available
      if (currentQuestion.explanation && correct) {
          setAiFeedback(currentQuestion.explanation);
          setLoadingAi(false);
      } else {
          // If wrong or no local explanation, ask AI
          try {
              const explanation = await explainAnswer(currentQuestion, selectedOption || "No answer");
              setAiFeedback(explanation);
          } catch (e) {
              setAiFeedback("Could not load AI explanation.");
          } finally {
              setLoadingAi(false);
          }
      }

    } else {
      // Subjective Grading
      try {
        const result = await gradeSubjectiveAnswer(currentQuestion, textAnswer);
        setIsCorrect(result.isCorrect);
        if (result.isCorrect) setScore(s => s + 1);
        setAiFeedback(result.feedback);
      } catch (e) {
        setIsCorrect(false);
        setAiFeedback("AI Grading failed. Please compare with model answer manually.");
      } finally {
        setLoadingAi(false);
      }
    }
  };

  const handleNext = () => {
    if (currentIndex < shuffledQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setHasSubmitted(false);
      setSelectedOption(null);
      setTextAnswer('');
      setAiFeedback(null);
      setIsCorrect(false);
    } else {
      // Finished - handled by render logic below
      setCurrentIndex(prev => prev + 1);
    }
  };

  // Results Screen
  if (currentIndex >= shuffledQuestions.length) {
    const percentage = Math.round((score / shuffledQuestions.length) * 100);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-10 rounded-2xl shadow-xl max-w-lg w-full text-center">
            <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-primary">{percentage}%</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Practice Complete!</h2>
            <p className="text-gray-500 mb-8">You answered {score} out of {shuffledQuestions.length} questions correctly.</p>
            
            <div className="flex flex-col gap-3">
                <button 
                    onClick={() => {
                        setScore(0);
                        setCurrentIndex(0);
                        setHasSubmitted(false);
                        setSelectedOption(null);
                        setTextAnswer('');
                        setAiFeedback(null);
                        setShuffledQuestions([...questionSet.questions].sort(() => Math.random() - 0.5));
                    }}
                    className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                    <RotateCw className="w-5 h-5" /> Practice Again
                </button>
                <button 
                    onClick={onExit}
                    className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                >
                    Back to Set
                </button>
            </div>
        </div>
      </div>
    );
  }

  // Double check we have a question before rendering
  if (!currentQuestion) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white px-6 py-4 shadow-sm flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-4">
                <button onClick={onExit} className="text-gray-500 hover:text-gray-900"><ArrowLeft className="w-6 h-6"/></button>
                <div className="h-6 w-px bg-gray-200"></div>
                <span className="font-semibold text-gray-700">{questionSet.title}</span>
            </div>
            <div className="font-mono text-sm font-medium bg-gray-100 px-3 py-1 rounded-full text-gray-600">
                {currentIndex + 1} / {shuffledQuestions.length}
            </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-200 w-full">
            <div 
                className="h-full bg-primary transition-all duration-300" 
                style={{ width: `${((currentIndex) / shuffledQuestions.length) * 100}%` }}
            ></div>
        </div>

        {/* Question Card */}
        <div className="flex-1 max-w-3xl mx-auto w-full p-6 flex flex-col justify-center">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-8">
                    <span className="inline-block text-xs font-bold tracking-wider text-gray-400 uppercase mb-4">Question {currentIndex + 1}</span>
                    <h2 className="text-2xl font-bold text-gray-900 mb-8 leading-relaxed">
                        {currentQuestion.content}
                    </h2>

                    {currentQuestion.type === 'choice' ? (
                        <div className="space-y-3">
                            {currentQuestion.options?.map((opt, idx) => {
                                const isSelected = selectedOption === opt;
                                const isCorrectAnswer = opt === currentQuestion.correctAnswer;
                                let borderClass = "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50";
                                let icon = <div className="w-6 h-6 rounded-full border-2 border-gray-300 text-xs flex items-center justify-center font-bold text-gray-400">{String.fromCharCode(65+idx)}</div>;

                                if (hasSubmitted) {
                                    if (isCorrectAnswer) {
                                        borderClass = "border-green-500 bg-green-50 ring-1 ring-green-500";
                                        icon = <CheckCircle className="w-6 h-6 text-green-600" />;
                                    } else if (isSelected && !isCorrectAnswer) {
                                        borderClass = "border-red-500 bg-red-50 ring-1 ring-red-500";
                                        icon = <XCircle className="w-6 h-6 text-red-600" />;
                                    } else {
                                        borderClass = "border-gray-100 opacity-50";
                                    }
                                } else if (isSelected) {
                                    borderClass = "border-primary bg-indigo-50 ring-1 ring-primary";
                                    icon = <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center"><div className="w-2 h-2 bg-white rounded-full"></div></div>;
                                }

                                return (
                                    <button 
                                        key={idx}
                                        onClick={() => !hasSubmitted && setSelectedOption(opt)}
                                        disabled={hasSubmitted}
                                        className={`w-full text-left p-4 rounded-xl border-2 flex items-center gap-4 transition-all ${borderClass}`}
                                    >
                                        <div className="flex-shrink-0">{icon}</div>
                                        <span className={`text-lg ${hasSubmitted && isCorrectAnswer ? 'font-semibold text-green-900' : 'text-gray-700'}`}>{opt}</span>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div>
                             <textarea 
                                value={textAnswer}
                                onChange={e => setTextAnswer(e.target.value)}
                                disabled={hasSubmitted}
                                className={`w-full p-4 border-2 rounded-xl text-lg outline-none transition-all ${hasSubmitted 
                                    ? (isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50')
                                    : 'border-gray-200 focus:border-primary focus:ring-4 focus:ring-indigo-50'}`}
                                rows={4}
                                placeholder="Type your answer here..."
                             />
                             {hasSubmitted && !isCorrect && (
                                 <div className="mt-4 p-4 bg-yellow-50 text-yellow-800 rounded-xl border border-yellow-200">
                                     <p className="font-bold text-sm uppercase tracking-wide mb-1">Model Answer</p>
                                     <p>{currentQuestion.correctAnswer}</p>
                                 </div>
                             )}
                        </div>
                    )}
                </div>

                {/* Footer / Feedback Area */}
                <div className="bg-gray-50 p-6 border-t border-gray-100">
                    {!hasSubmitted ? (
                         <div className="flex justify-end">
                            <button 
                                onClick={handleSubmit}
                                disabled={(currentQuestion.type === 'choice' && !selectedOption) || (currentQuestion.type === 'text' && !textAnswer.trim())}
                                className="px-8 py-3 bg-primary text-white text-lg font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                            >
                                Check Answer
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* AI Explanation Block */}
                            <div className={`rounded-xl p-5 ${isCorrect ? 'bg-green-100/50' : 'bg-indigo-50'} border border-opacity-50 ${isCorrect ? 'border-green-200' : 'border-indigo-200'}`}>
                                <div className="flex items-start gap-3">
                                    {loadingAi ? (
                                        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin flex-shrink-0 mt-1"></div>
                                    ) : (
                                        <div className="bg-white p-1.5 rounded-lg shadow-sm text-indigo-600 flex-shrink-0 mt-0.5">
                                             <HelpCircle className="w-5 h-5" />
                                        </div>
                                    )}
                                    <div>
                                        <h4 className="font-bold text-gray-900 mb-1">
                                            {loadingAi ? "AI is analyzing..." : (isCorrect ? "Great job!" : "Explanation")}
                                        </h4>
                                        <p className="text-gray-700 leading-relaxed">
                                            {loadingAi ? "Generating personalized feedback..." : aiFeedback}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button 
                                    onClick={handleNext}
                                    className="flex items-center gap-2 px-8 py-3 bg-gray-900 text-white text-lg font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
                                >
                                    {currentIndex === shuffledQuestions.length - 1 ? 'Finish' : 'Next Question'}
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default PracticeSession;