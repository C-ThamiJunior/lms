import React, { useState } from 'react';
import { Module, User, Course } from '../types/lms';
import { Plus, Edit2, Trash2, Users, Image, X } from 'lucide-react';

interface ModuleManagementProps {
  modules: Module[];
  courses: Course[];
  students: User[];
  currentUser: User;
  onCreateModule: (module: Omit<Module, 'id' | 'createdAt'>) => void;
  onUpdateModule: (moduleId: string, updates: Partial<Module>) => void;
  onDeleteModule: (moduleId: string) => void;
}

export const ModuleManagement: React.FC<ModuleManagementProps> = ({
  modules,
  courses,
  students,
  currentUser,
  onCreateModule,
  onUpdateModule,
  onDeleteModule,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [formData, setFormData] = useState({
    courseId: '',
    title: '',
    description: '',
    imageUrl: '',
    studentIds: [] as string[],
  });

  const facilitatorCourses = courses.filter(c => c.facilitatorId === currentUser.id);
  const facilitatorModules = modules.filter(m => 
    facilitatorCourses.some(c => c.id === m.courseId)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingModule) {
      onUpdateModule(editingModule.id, {
        ...formData,
        order: editingModule.order,
        isActive: editingModule.isActive,
      });
      setEditingModule(null);
    } else {
      onCreateModule({
        ...formData,
        order: facilitatorModules.length + 1,
        isActive: true,
      });
    }
    
    resetForm();
    setShowCreateModal(false);
  };

  const resetForm = () => {
    setFormData({
      courseId: '',
      title: '',
      description: '',
      imageUrl: '',
      studentIds: [],
    });
  };

  const handleEdit = (module: Module) => {
    setEditingModule(module);
    setFormData({
      courseId: module.courseId,
      title: module.title,
      description: module.description,
      imageUrl: module.imageUrl || '',
      studentIds: module.studentIds,
    });
    setShowCreateModal(true);
  };

  const handleStudentToggle = (studentId: string) => {
    setFormData(prev => ({
      ...prev,
      studentIds: prev.studentIds.includes(studentId)
        ? prev.studentIds.filter(id => id !== studentId)
        : [...prev.studentIds, studentId]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-black">Module Management</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Module</span>
        </button>
      </div>

      {facilitatorModules.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No modules created</h3>
          <p className="text-gray-600">Start by creating your first module.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {facilitatorModules.map(module => {
            const course = courses.find(c => c.id === module.courseId);
            const assignedStudents = students.filter(s => module.studentIds.includes(s.id));
            
            return (
              <div key={module.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {module.imageUrl && (
                  <img 
                    src={module.imageUrl} 
                    alt={module.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-black">{module.title}</h3>
                      <p className="text-sm text-gray-600">{course?.title}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(module)}
                        className="p-2 text-gray-400 hover:text-blue-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteModule(module.id)}
                        className="p-2 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{module.description}</p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">{assignedStudents.length} students</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      module.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {module.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Module Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-black">
                {editingModule ? 'Edit Module' : 'Create New Module'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingModule(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course
                </label>
                <select
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                >
                  <option value="">Select a course</option>
                  {facilitatorCourses.map(course => (
                    <option key={course.id} value={course.id}>{course.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Module Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Module Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign Students
                </label>
                <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3">
                  {students.length === 0 ? (
                    <p className="text-gray-500 text-sm">No students available</p>
                  ) : (
                    <div className="space-y-2">
                      {students.map(student => (
                        <label key={student.id} className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={formData.studentIds.includes(student.id)}
                            onChange={() => handleStudentToggle(student.id)}
                            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">{student.name}</span>
                          <span className="text-xs text-gray-500">({student.email})</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingModule(null);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors"
                >
                  {editingModule ? 'Update Module' : 'Create Module'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};