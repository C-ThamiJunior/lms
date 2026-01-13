import React, { useState } from 'react';
import { Discussion, DiscussionReply, User, Course, Module } from '../types/lms';
import { MessageSquare, Plus, Reply, Clock, X } from 'lucide-react';

interface DiscussionForumProps {
  discussions: Discussion[];
  courses: Course[];
  modules: Module[];
  users: User[];
  currentUser: User;
  onCreateDiscussion: (discussion: Omit<Discussion, 'id' | 'createdAt' | 'replies'>) => void;
  onReplyToDiscussion: (discussionId: string, content: string) => void;
}

export const DiscussionForum: React.FC<DiscussionForumProps> = ({
  discussions,
  courses,
  modules,
  users,
  currentUser,
  onCreateDiscussion,
  onReplyToDiscussion,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    courseId: '',
    moduleId: '',
  });

  // Get user's enrolled courses (for students) or facilitated courses (for facilitators)
  const availableCourses = currentUser.role === 'student' 
    ? courses // In a real app, filter by enrolled courses
    : courses.filter(c => c.facilitatorId === currentUser.id);

  const availableModules = modules.filter(m => m.courseId === formData.courseId);

  const handleCreateDiscussion = (e: React.FormEvent) => {
    e.preventDefault();
    
    onCreateDiscussion({
      ...formData,
      authorId: currentUser.id,
      isActive: true,
    });

    setFormData({ title: '', content: '', courseId: '', moduleId: '' });
    setShowCreateModal(false);
  };

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDiscussion && replyContent.trim()) {
      onReplyToDiscussion(selectedDiscussion.id, replyContent.trim());
      setReplyContent('');
    }
  };

  const getAuthorName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Unknown User';
  };

  const getCourseName = (courseId?: string) => {
    if (!courseId) return 'General';
    const course = courses.find(c => c.id === courseId);
    return course?.title || 'Unknown Course';
  };

  const getModuleName = (moduleId?: string) => {
    if (!moduleId) return null;
    const module = modules.find(m => m.id === moduleId);
    return module?.title || 'Unknown Module';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-black">Discussion Forum</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Start Discussion</span>
        </button>
      </div>

      {discussions.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No discussions yet</h3>
          <p className="text-gray-600">Start the first discussion to engage with your peers!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {discussions
            .filter(d => d.isActive)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map(discussion => (
              <div key={discussion.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-black mb-2">{discussion.title}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <span>By {getAuthorName(discussion.authorId)}</span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(discussion.createdAt)}</span>
                      </span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                        {getCourseName(discussion.courseId)}
                      </span>
                      {discussion.moduleId && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                          {getModuleName(discussion.moduleId)}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 mb-4">{discussion.content}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-600">
                      {discussion.replies.length} {discussion.replies.length === 1 ? 'reply' : 'replies'}
                    </span>
                    <button
                      onClick={() => setSelectedDiscussion(
                        selectedDiscussion?.id === discussion.id ? null : discussion
                      )}
                      className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center space-x-1"
                    >
                      <Reply className="w-4 h-4" />
                      <span>Reply</span>
                    </button>
                  </div>

                  {/* Replies */}
                  {discussion.replies.length > 0 && (
                    <div className="space-y-3 mb-4">
                      {discussion.replies
                        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                        .map(reply => (
                          <div key={reply.id} className="bg-gray-50 rounded-lg p-4 ml-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-medium text-black text-sm">
                                {getAuthorName(reply.authorId)}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDate(reply.createdAt)}
                              </span>
                            </div>
                            <p className="text-gray-700 text-sm">{reply.content}</p>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Reply Form */}
                  {selectedDiscussion?.id === discussion.id && (
                    <form onSubmit={handleReply} className="ml-4">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Write your reply..."
                        rows={3}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 mb-3"
                        required
                      />
                      <div className="flex space-x-2">
                        <button
                          type="submit"
                          disabled={!replyContent.trim()}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          Post Reply
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDiscussion(null);
                            setReplyContent('');
                          }}
                          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Create Discussion Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-black">Start New Discussion</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateDiscussion} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course (Optional)
                  </label>
                  <select
                    value={formData.courseId}
                    onChange={(e) => setFormData({ ...formData, courseId: e.target.value, moduleId: '' })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">General Discussion</option>
                    {availableCourses.map(course => (
                      <option key={course.id} value={course.id}>{course.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Module (Optional)
                  </label>
                  <select
                    value={formData.moduleId}
                    onChange={(e) => setFormData({ ...formData, moduleId: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    disabled={!formData.courseId}
                  >
                    <option value="">No specific module</option>
                    {availableModules.map(module => (
                      <option key={module.id} value={module.id}>{module.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discussion Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="What would you like to discuss?"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={5}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Share your thoughts, questions, or ideas..."
                  required
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Start Discussion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};