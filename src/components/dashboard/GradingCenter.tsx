import React, { useState } from 'react';
import { Award, ChevronDown, Search } from 'lucide-react';
import { Course, Module, Test, Assignment, User, TestResult, AssignmentSubmission } from '../../types/lms';

interface GradingCenterProps {
    courses: Course[];
    modules: Module[];
    tests: Test[];
    assignments: Assignment[];
    users: User[];
    testResults: TestResult[];
    assignmentSubmissions: AssignmentSubmission[];
    onDataMutated: () => void;
}

const API_BASE_URL = 'https://b-t-backend-uc9w.onrender.com/api';

export const GradingCenter: React.FC<GradingCenterProps> = ({ 
    courses, modules, tests, assignments, users, testResults, assignmentSubmissions, onDataMutated 
}) => {
    const [selectedCourseId, setSelectedCourseId] = useState("");
    const [selectedModuleId, setSelectedModuleId] = useState("");
    const [gradingType, setGradingType] = useState<'test' | 'assignment'>('test');
    const [selectedAssessmentId, setSelectedAssessmentId] = useState("");
    const [studentSearch, setStudentSearch] = useState("");
    const [gradingLoading, setGradingLoading] = useState<string | null>(null);

    // Derived State for Dropdowns
    const gradingModules = modules.filter(m => String(m.courseId) === String(selectedCourseId));
    const gradingAssessments = gradingType === 'test' 
        ? tests.filter(t => String(t.moduleId) === String(selectedModuleId))
        : assignments.filter(a => String(a.moduleId) === String(selectedModuleId));
    
    const students = users.filter(u => u.role === 'student' && 
        (u.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
         (u.email && u.email.toLowerCase().includes(studentSearch.toLowerCase())))
    );

    // --- Action Handler ---
    const handleGrade = async (studentId: string, currentScore: number | undefined) => {
        const newScoreStr = prompt("Enter grade (0-100):", currentScore?.toString());
        if (newScoreStr === null) return; // Cancelled
        const newScore = parseInt(newScoreStr);
        if (isNaN(newScore)) return alert("Invalid number");

        const feedback = prompt("Enter feedback:", "Good job!");
        
        setGradingLoading(studentId);
        const token = localStorage.getItem('token');

        try {
            if (gradingType === 'test') {
                // Backend: POST /api/attempts/quiz (Creates or Updates attempt)
                await fetch(`${API_BASE_URL}/attempts/quiz`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                        quizId: selectedAssessmentId,
                        studentId: studentId,
                        score: newScore,
                        feedback: feedback
                    })
                });
            } else {
                // Backend: PUT /api/submissions/assignment/{id}/grade
                // First find the submission ID
                const submission = assignmentSubmissions.find(s => s.assignmentId === selectedAssessmentId && s.studentId === studentId);
                
                if (!submission) {
                    alert("Student has not submitted this assignment yet. Cannot grade.");
                    setGradingLoading(null);
                    return;
                }

                await fetch(`${API_BASE_URL}/submissions/assignment/${submission.id}/grade`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                        score: newScore,
                        feedback: feedback,
                        graderId: 'CURRENT_USER_ID_PLACEHOLDER' // Ideally passed from props
                    })
                });
            }
            // Refresh Data
            onDataMutated();
        } catch (error) {
            console.error("Grading failed", error);
            alert("Failed to save grade");
        } finally {
            setGradingLoading(null);
        }
    };

    return (
        <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 animate-in fade-in">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100">
                <div className="p-2 bg-red-100 rounded-lg"><Award className="text-red-600 w-6 h-6"/></div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Grading Center</h2>
                    <p className="text-sm text-gray-500">Filter by course and assessment to grade students</p>
                </div>
            </div>
            
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">1. Select Course</label>
                    <div className="relative">
                        <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg appearance-none" value={selectedCourseId} onChange={e => { setSelectedCourseId(e.target.value); setSelectedModuleId(""); }}>
                            <option value="">-- Choose Course --</option>
                            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none"/>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">2. Select Module</label>
                    <div className="relative">
                        <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg appearance-none" value={selectedModuleId} onChange={e => setSelectedModuleId(e.target.value)} disabled={!selectedCourseId}>
                            <option value="">-- Choose Module --</option>
                            {gradingModules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none"/>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">3. Type</label>
                    <div className="relative">
                        <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg appearance-none" value={gradingType} onChange={e => setGradingType(e.target.value as any)}>
                            <option value="test">Test</option>
                            <option value="assignment">Assignment</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none"/>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">4. Assessment</label>
                    <div className="relative">
                        <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg appearance-none" value={selectedAssessmentId} onChange={e => setSelectedAssessmentId(e.target.value)} disabled={!selectedModuleId}>
                            <option value="">-- Choose --</option>
                            {gradingAssessments.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none"/>
                    </div>
                </div>
            </div>

            {/* List */}
            {selectedAssessmentId ? (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between text-xs font-semibold text-gray-500 uppercase">
                        <span>Student</span>
                        <div className="flex gap-12 pr-4"><span>Status</span><span>Grade</span><span>Action</span></div>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {students.map((student) => {
                            // Find existing grade
                            const result = gradingType === 'test' 
                                ? testResults.find(r => String(r.testId) === String(selectedAssessmentId) && String(r.studentId) === String(student.id))
                                : assignmentSubmissions.find(s => String(s.assignmentId) === String(selectedAssessmentId) && String(s.studentId) === String(student.id));
                            
                            const hasSubmitted = !!result;
                            const score = result?.score;

                            return (
                                <div key={student.id} className="px-6 py-4 flex items-center justify-between hover:bg-red-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                            {student.name.substring(0,2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{student.name}</p>
                                            <p className="text-xs text-gray-500">{student.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-12">
                                        <span className={`text-xs px-2.5 py-1 rounded-full border ${hasSubmitted ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                            {hasSubmitted ? 'Submitted' : 'Pending'}
                                        </span>
                                        <span className="font-bold text-gray-800 w-16 text-right">
                                            {score !== undefined ? score : '-'}
                                        </span>
                                        <button 
                                            onClick={() => handleGrade(student.id, score)}
                                            disabled={gradingLoading === student.id}
                                            className="text-sm border border-gray-300 px-4 py-1.5 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600 transition-all w-24"
                                        >
                                            {gradingLoading === student.id ? 'Saving...' : (score !== undefined ? 'Edit' : 'Grade')}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 text-gray-400">Select an assessment to begin grading</div>
            )}
        </div>
    );
};