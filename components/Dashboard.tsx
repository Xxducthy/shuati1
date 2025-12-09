import React, { useState } from 'react';
import { QuestionSet } from '../types';
import { createInitialId, saveQuestionSet, deleteQuestionSet } from '../services/storageService';
import { Plus, BookOpen, Trash2, GraduationCap } from 'lucide-react';

interface DashboardProps {
  sets: QuestionSet[];
  onSelectSet: (set: QuestionSet) => void;
  onRefresh: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ sets, onSelectSet, onRefresh }) => {
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    const newSet: QuestionSet = {
      id: createInitialId(),
      title: newTitle,
      description: newDesc,
      createdAt: Date.now(),
      questions: []
    };
    saveQuestionSet(newSet);
    setNewTitle('');
    setNewDesc('');
    setShowCreate(false);
    onRefresh();
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this question set?')) {
      deleteQuestionSet(id);
      onRefresh();
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-primary" />
            ExamPrep AI
          </h1>
          <p className="text-gray-500 mt-1">Manage your exam materials and practice efficiently.</p>
        </div>
        <button 
          onClick={() => setShowCreate(true)}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-5 h-5" />
          New Question Set
        </button>
      </header>

      {showCreate && (
        <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-200">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Create New Set</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input 
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="e.g., History Final Exam"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
              <input 
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="Fall Semester 2024"
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button 
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreate}
                disabled={!newTitle.trim()}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {sets.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No question sets yet</h3>
          <p className="text-gray-500 mt-1">Create a set to start adding questions or generating them with AI.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sets.map(set => (
            <div 
              key={set.id}
              onClick={() => onSelectSet(set)}
              className="group bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer relative"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-50 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <BookOpen className="w-6 h-6" />
                </div>
                <button 
                  onClick={(e) => handleDelete(e, set.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  title="Delete Set"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">{set.title}</h3>
              <p className="text-gray-500 text-sm mb-4 line-clamp-2 min-h-[2.5em]">
                {set.description || "No description provided."}
              </p>
              <div className="flex items-center justify-between text-sm text-gray-400 border-t border-gray-50 pt-4 mt-auto">
                <span>{set.questions.length} Questions</span>
                <span>{new Date(set.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;