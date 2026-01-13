import React from 'react';
import { TestResult, Test, Assignment, AssignmentSubmission, TopicScore } from '../types/lms';
import { Award, TrendingUp, TrendingDown, Minus, BookOpen, FileText } from 'lucide-react';

interface GradeBreakdownProps {
  testResults: TestResult[];
  tests: Test[];
  assignmentSubmissions: AssignmentSubmission[];
  assignments: Assignment[];
  currentUser: { id: string };
}

export const GradeBreakdown: React.FC<GradeBreakdownProps> = ({
  testResults,
  tests,
  assignmentSubmissions,
  assignments,
  currentUser,
}) => {
  const studentResults = testResults.filter(result => result.studentId === currentUser.id);
  const studentSubmissions = assignmentSubmissions.filter(sub => 
    sub.studentId === currentUser.id && sub.score !== undefined
  );

  // Calculate overall statistics
  const totalTestScore = studentResults.reduce((sum, result) => sum + result.score, 0);
  const totalTestMarks = studentResults.reduce((sum, result) => sum + result.totalMarks, 0);
  const testAverage = totalTestMarks > 0 ? (totalTestScore / totalTestMarks) * 100 : 0;

  const totalAssignmentScore = studentSubmissions.reduce((sum, sub) => sum + (sub.score || 0), 0);
  const totalAssignmentMarks = studentSubmissions.reduce((sum, sub) => {
    const assignment = assignments.find(a => a.id === sub.assignmentId);
    return sum + (assignment?.totalMarks || 0);
  }, 0);
  const assignmentAverage = totalAssignmentMarks > 0 ? (totalAssignmentScore / totalAssignmentMarks) * 100 : 0;

  const overallAverage = (testAverage + assignmentAverage) / 2;

  // Aggregate topic performance
  const topicPerformance = new Map<string, { score: number; total: number; count: number }>();
  
  studentResults.forEach(result => {
    result.topicBreakdown.forEach(topic => {
      const existing = topicPerformance.get(topic.topic) || { score: 0, total: 0, count: 0 };
      topicPerformance.set(topic.topic, {
        score: existing.score + topic.score,
        total: existing.total + topic.totalMarks,
        count: existing.count + 1,
      });
    });
  });

  const topicStats = Array.from(topicPerformance.entries()).map(([topic, stats]) => ({
    topic,
    percentage: (stats.score / stats.total) * 100,
    totalScore: stats.score,
    totalMarks: stats.total,
    assessmentCount: stats.count,
  })).sort((a, b) => b.percentage - a.percentage);

  const getPerformanceIcon = (percentage: number) => {
    if (percentage >= 80) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (percentage >= 60) return <Minus className="w-4 h-4 text-yellow-600" />;
    return <TrendingDown className="w-4 h-4 text-red-600" />;
  };

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100 text-green-800';
    if (percentage >= 70) return 'bg-blue-100 text-blue-800';
    if (percentage >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getGradeLetter = (percentage: number) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-black">My Grades & Performance</h2>

      {/* Overall Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-black">Test Average</h3>
            <BookOpen className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-3xl font-bold mb-2">
            <span className={getPerformanceColor(testAverage)}>
              {testAverage.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {getPerformanceIcon(testAverage)}
            <span className={`text-sm font-medium ${getPerformanceColor(testAverage)}`}>
              Grade: {getGradeLetter(testAverage)}
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-black">Assignment Average</h3>
            <FileText className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-3xl font-bold mb-2">
            <span className={getPerformanceColor(assignmentAverage)}>
              {assignmentAverage.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {getPerformanceIcon(assignmentAverage)}
            <span className={`text-sm font-medium ${getPerformanceColor(assignmentAverage)}`}>
              Grade: {getGradeLetter(assignmentAverage)}
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-black">Overall Average</h3>
            <Award className="w-6 h-6 text-red-600" />
          </div>
          <div className="text-3xl font-bold mb-2">
            <span className={getPerformanceColor(overallAverage)}>
              {overallAverage.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {getPerformanceIcon(overallAverage)}
            <span className={`text-sm font-medium ${getPerformanceColor(overallAverage)}`}>
              Grade: {getGradeLetter(overallAverage)}
            </span>
          </div>
        </div>
      </div>

      {/* Topic Performance Breakdown */}
      {topicStats.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-black mb-6">Performance by Topic</h3>
          <div className="space-y-4">
            {topicStats.map(topic => (
              <div key={topic.topic} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-black">{topic.topic}</h4>
                  <div className="flex items-center space-x-2">
                    {getPerformanceIcon(topic.percentage)}
                    <span className={`font-semibold ${getPerformanceColor(topic.percentage)}`}>
                      {topic.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                  <div
                    className={`h-3 rounded-full ${
                      topic.percentage >= 80 ? 'bg-green-600' :
                      topic.percentage >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                    }`}
                    style={{ width: `${Math.min(topic.percentage, 100)}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{topic.totalScore}/{topic.totalMarks} points</span>
                  <span>{topic.assessmentCount} assessment{topic.assessmentCount !== 1 ? 's' : ''}</span>
                </div>
                
                <div className="mt-2">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(topic.percentage)}`}>
                    {getGradeLetter(topic.percentage)}
                  </span>
                  {topic.percentage < 70 && (
                    <span className="ml-2 text-xs text-red-600 font-medium">
                      Needs Improvement
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Test Results */}
      {studentResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-black mb-6">Test Results</h3>
          <div className="space-y-4">
            {studentResults
              .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
              .map(result => {
                const test = tests.find(t => t.id === result.testId);
                const percentage = (result.score / result.totalMarks) * 100;
                
                return (
                  <div key={result.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-black">{test?.title}</h4>
                        <p className="text-sm text-gray-600">
                          Submitted: {new Date(result.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          <span className={getPerformanceColor(percentage)}>
                            {result.score}/{result.totalMarks}
                          </span>
                        </div>
                        <div className={`text-sm font-medium ${getPerformanceColor(percentage)}`}>
                          {percentage.toFixed(1)}% ({getGradeLetter(percentage)})
                        </div>
                      </div>
                    </div>
                    
                    {result.topicBreakdown.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Topic Breakdown:</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {result.topicBreakdown.map(topic => (
                            <div key={topic.topic} className="text-sm">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">{topic.topic}</span>
                                <span className={`font-medium ${getPerformanceColor(topic.percentage)}`}>
                                  {topic.score}/{topic.totalMarks}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                                <div
                                  className={`h-1 rounded-full ${
                                    topic.percentage >= 80 ? 'bg-green-600' :
                                    topic.percentage >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                                  }`}
                                  style={{ width: `${Math.min(topic.percentage, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Assignment Results */}
      {studentSubmissions.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-black mb-6">Assignment Results</h3>
          <div className="space-y-4">
            {studentSubmissions
              .sort((a, b) => new Date(b.gradedAt || '').getTime() - new Date(a.gradedAt || '').getTime())
              .map(submission => {
                const assignment = assignments.find(a => a.id === submission.assignmentId);
                const percentage = assignment ? ((submission.score || 0) / assignment.totalMarks) * 100 : 0;
                
                return (
                  <div key={submission.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-black">{assignment?.title}</h4>
                        <p className="text-sm text-gray-600">
                          Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                          {submission.gradedAt && (
                            <span className="ml-2">
                              • Graded: {new Date(submission.gradedAt).toLocaleDateString()}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          <span className={getPerformanceColor(percentage)}>
                            {submission.score}/{assignment?.totalMarks}
                          </span>
                        </div>
                        <div className={`text-sm font-medium ${getPerformanceColor(percentage)}`}>
                          {percentage.toFixed(1)}% ({getGradeLetter(percentage)})
                        </div>
                      </div>
                    </div>
                    
                    {submission.feedback && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Feedback:</h5>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                          {submission.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {studentResults.length === 0 && studentSubmissions.length === 0 && (
        <div className="text-center py-12">
          <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No grades available</h3>
          <p className="text-gray-600">Complete tests and assignments to see your grades here.</p>
        </div>
      )}
    </div>
  );
};