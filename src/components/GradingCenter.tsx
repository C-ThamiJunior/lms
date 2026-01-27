import React, { useState } from 'react';
import { Award, ChevronDown, Users, Search } from 'lucide-react';
import { Course, Module, Test, Assignment, User, AssignmentSubmission } from '../../types/lms';

interface GradingCenterProps {
    courses: Course[];
    modules: Module[];
    tests: Test[];
    assignments: Assignment[];
    users: User[];
    testResults: any[]; 
    assignmentSubmissions: AssignmentSubmission[];
    onDataMutated: () => void;
}

const API_BASE_URL = 'https://b-t-backend-uc9w.onrender.com/api';

export const GradingCenter: React.FC<GradingCenterProps> = ({ 
    courses = [], modules = [], tests = [], assignments = [], users = [], 
    testResults = [], assignmentSubmissions = [], onDataMutated 
}) => {
    // UI State
    const [selectedCourseId, setSelectedCourseId] = useState("");
    const [selectedModuleId, setSelectedModuleId] = useState("");
    const [gradingType, setGradingType] = useState<'test' | 'assignment'>('test');
    const [selectedAssessmentId, setSelectedAssessmentId] = useState("");
    const [studentSearch, setStudentSearch] = useState("");
    const [gradingLoading, setGradingLoading] = useState<string | null>(null);

    // --- 1. FILTERING LOGIC (SAFE) ---
    
    // Safety check: ensure modules is an array before filtering
    const safeModules = Array.isArray(modules) ? modules : [];
    const gradingModules = safeModules.filter(m => String(m.courseId) === String(selectedCourseId));
    
    // Safety check: ensure tests/assignments are arrays
    const sourceList = gradingType === 'test' 
        ? (Array.isArray(tests) ? tests : []) 
        : (Array.isArray(assignments) ? assignments : []);

    const gradingAssessments = sourceList.filter(item => {
        const matchesCourse = String(item.courseId) === String(selectedCourseId);
        const matchesModule = selectedModuleId ? String(item.moduleId) === String(selectedModuleId) : true;
        return matchesCourse && matchesModule;
    });
    
    // Filter Students
    const safeUsers = Array.isArray(users) ? users : [];
    const students = safeUsers.filter(u => {
        const role = String(u.role || '').toUpperCase();
        const isStudent = role.includes('STUDENT') || role.includes('LEARNER');

        const search = studentSearch.toLowerCase();
        const fullName = u.name 
            ? u.name 
            : `${u.firstname || ''} ${u.surname || ''}`.trim();
            
        const matchesSearch = 
            fullName.toLowerCase().includes(search) ||
            (u.email && u.email.toLowerCase().includes(search));

        return isStudent && matchesSearch;
    });

    // --- 2. DATA MATCHING HELPER ---
    const getResultForStudent = (studentId: string) => {
        if (gradingType === 'test') {
            return (Array.isArray(testResults) ? testResults : []).find(r => {
                const rQuizId = r.quiz?.id || r.quizId;
                const rStudentId = r.learner?.id || r.student?.id || r.learnerId || r.studentId;
                return String(rQuizId) === String(selectedAssessmentId) && String(rStudentId) === String(studentId);
            });
        } else {
            return (Array.isArray(assignmentSubmissions) ? assignmentSubmissions : []).find(s => {
                const sAssignId = (s as any).assignment?.id || s.assignmentId;
                const sStudentId = (s as any).student?.id || s.studentId || (s as any).learnerId;
                return String(sAssignId) === String(selectedAssessmentId) && String(sStudentId) === String(studentId);
            });
        }
    };

    // --- 3. GRADING ACTION ---
    const handleGrade = async (studentId: string, currentScore: number | undefined) => {
        const newScoreStr = prompt("Enter grade (0-100):", currentScore?.toString());
        if (newScoreStr === null) return;
        const newScore = parseInt(newScoreStr);
        if (isNaN(newScore)) return alert("Invalid number");

        const feedback = prompt("Enter feedback:", "Good job!");
        setGradingLoading(studentId);
        const token = localStorage.getItem('token');

        try {
            if (gradingType === 'test') {
                const existingResult = getResultForStudent(studentId);
                await fetch(`${API_BASE_URL}/attempts/quiz`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                        id: existingResult?.id,
                        quiz: { id: selectedAssessmentId },
                        learner: { id: studentId },
                        score: newScore,
                        totalMarks: 100,
                        feedback: feedback
                    })
                });
            } else {
                const submission = getResultForStudent(studentId);
                if (!submission) {
                    alert("Student has not submitted this assignment yet.");
                    setGradingLoading(null);
                    return;
                }
                await fetch(`${API_BASE_URL}/submissions/assignment/${submission.id}/grade`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ grade: newScore, feedback: feedback })
                });
            }
            onDataMutated();
            alert("Grade saved successfully!");
        } catch (error) {
            console.error("Grading failed", error);
            alert("Failed to save grade.");
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
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">1. Select Course</label>
                    <div className="relative">
                        <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg appearance-none" value={selectedCourseId} onChange={e => { setSelectedCourseId(e.target.value); setSelectedModuleId(""); setSelectedAssessmentId(""); }}>
                            <option value="">-- Choose Course --</option>
                            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none"/>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">2. Module (Optional)</label>
                    <div className="relative">
                        <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg appearance-none" value={selectedModuleId} onChange={e => setSelectedModuleId(e.target.value)} disabled={!selectedCourseId}>
                            <option value="">-- All Modules --</option>
                            {gradingModules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none"/>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">3. Type</label>
                    <div className="relative">
                        <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg appearance-none" value={gradingType} onChange={e => { setGradingType(e.target.value as any); setSelectedAssessmentId(""); }}>
                            <option value="test">Test / Quiz</option>
                            <option value="assignment">Assignment</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none"/>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">4. Assessment</label>
                    <div className="relative">
                        <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg appearance-none" value={selectedAssessmentId} onChange={e => setSelectedAssessmentId(e.target.value)} disabled={!selectedCourseId}>
                            <option value="">-- Choose --</option>
                            {gradingAssessments.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none"/>
                    </div>
                </div>
            </div>

            {selectedAssessmentId ? (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center flex-wrap gap-4">
                        <div className="flex gap-12 text-xs font-semibold text-gray-500 uppercase flex-1"><span>Student</span></div>
                        <div className="relative">
                            <input type="text" placeholder="Search..." value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 w-64"/>
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        </div>
                        <div className="flex gap-12 pr-4 text-xs font-semibold text-gray-500 uppercase">
                            <span className="w-16 text-center">Status</span><span className="w-16 text-right">Grade</span><span className="w-24 text-center">Action</span>
                        </div>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {students.length > 0 ? (
                            students.map((student) => {
                                const result = getResultForStudent(student.id);
                                const score = result ? ((result as any).grade ?? result.score) : undefined;
                                const hasSubmitted = !!result;
                                const displayName = student.name || `${student.firstname || ''} ${student.surname || ''}`.trim() || 'Unknown';
                                return (
                                    <div key={student.id} className="px-6 py-4 flex items-center justify-between hover:bg-red-50 transition-colors">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">{displayName.charAt(0).toUpperCase()}</div>
                                            <div><p className="font-semibold text-gray-900">{displayName}</p><p className="text-xs text-gray-500">{student.email}</p></div>
                                        </div>
                                        <div className="flex items-center gap-12">
                                            <span className={`w-20 text-center text-xs px-2.5 py-1 rounded-full border ${hasSubmitted ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{hasSubmitted ? 'Submitted' : 'Pending'}</span>
                                            <span className="font-bold text-gray-800 w-16 text-right">{score !== undefined ? score : '-'}</span>
                                            <button onClick={() => handleGrade(student.id, score)} disabled={gradingLoading === student.id} className="text-sm border border-gray-300 px-4 py-1.5 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600 transition-all w-24 flex justify-center">{gradingLoading === student.id ? 'Saving...' : (score !== undefined ? 'Edit' : 'Grade')}</button>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-12 text-center flex flex-col items-center justify-center text-gray-500">
                                <div className="bg-gray-100 p-4 rounded-full mb-4"><Users className="w-8 h-8 text-gray-400" /></div>
                                <h3 className="text-lg font-bold text-gray-700">No Students Found</h3>
                                <p className="text-sm text-gray-500 mt-1">{studentSearch ? "No students match your search criteria." : "There are no students enrolled in this course yet."}</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="text-center py-16 text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <Award className="w-12 h-12 mx-auto mb-3 text-gray-300"/>
                    <p className="font-medium">Select an assessment above to begin grading</p>
                </div>
            )}
        </div>
    );
};