import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import QuestionSetView from './components/QuestionSetView';
import PracticeSession from './components/PracticeSession';
import { QuestionSet, AppView } from './types';
import { getQuestionSets } from './services/storageService';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('DASHBOARD');
  const [activeSet, setActiveSet] = useState<QuestionSet | null>(null);
  const [sets, setSets] = useState<QuestionSet[]>([]);

  useEffect(() => {
    loadSets();
  }, []);

  const loadSets = () => {
    setSets(getQuestionSets());
  };

  const handleSelectSet = (set: QuestionSet) => {
    setActiveSet(set);
    setView('SET_DETAILS');
  };

  const handleUpdateSet = (updatedSet: QuestionSet) => {
    setActiveSet(updatedSet);
    loadSets(); // Refresh dashboard data in background
  };

  const renderView = () => {
    switch (view) {
      case 'DASHBOARD':
        return (
          <Dashboard 
            sets={sets} 
            onSelectSet={handleSelectSet} 
            onRefresh={loadSets}
          />
        );
      
      case 'SET_DETAILS':
        if (!activeSet) return null;
        return (
          <QuestionSetView 
            questionSet={activeSet}
            onBack={() => setView('DASHBOARD')}
            onStartPractice={() => setView('PRACTICE')}
            onUpdate={handleUpdateSet}
          />
        );
      
      case 'PRACTICE':
        if (!activeSet) return null;
        return (
          <PracticeSession 
            questionSet={activeSet}
            onExit={() => setView('SET_DETAILS')}
          />
        );
      
      default:
        return <div>Unknown View</div>;
    }
  };

  return (
    <div className="min-h-screen font-sans text-gray-900">
      {renderView()}
    </div>
  );
};

export default App;