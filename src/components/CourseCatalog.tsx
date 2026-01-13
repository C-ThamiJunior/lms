import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, CheckCircle, PlusCircle } from 'lucide-react';
import { User, Course } from '../types/lms';

interface CourseCatalogProps {
  currentUser: User;
}

const API_BASE_URL = 'https://b-t-backend-production-1580.up.railway.app/api';

export const CourseCatalog: React.FC<CourseCatalogProps> = ({ currentUser }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all courses AND user's current enrollments
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };

        const [coursesRes, enrollRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/courses`, config),
          axios.get(`${API_BASE_URL}/enrollments/user/${currentUser.id}`, config)
        ]);

        setCourses(coursesRes.data);
        // Extract IDs of courses the student is already in
        const myIds = enrollRes.data.map((e: any) => e.course.id);
        setEnrolledCourseIds(myIds);
      } catch (err) {
        console.error("Failed to load catalog", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser.id]);

  const handleEnroll = async (courseId: number) => {
    try {
      const token = localStorage.getItem('token');
      // Call the enrollment endpoint
      await axios.post(
        `${API_BASE_URL}/enrollments`, 
        null, 
        { 
          params: { userId: currentUser.id, courseId },
          headers: { Authorization: `Bearer ${token}` } 
        }
      );
      
      // Update UI instantly
      setEnrolledCourseIds([...enrolledCourseIds, courseId]);
      alert("Successfully enrolled!");
    } catch (err: any) {
      alert("Enrollment failed: " + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading available courses...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Course Catalog</h1>
        <p className="text-gray-500">Browse and enroll in available courses.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => {
          const isEnrolled = enrolledCourseIds.includes(Number(course.id));
          
          return (
            <div key={course.id} className="bg-white border rounded-xl shadow-sm hover:shadow-md transition overflow-hidden flex flex-col">
              <div className="h-32 bg-blue-50 flex items-center justify-center border-b">
                 <BookOpen className="text-blue-200 w-12 h-12"/>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                 <h3 className="text-lg font-bold text-gray-900 mb-2">{course.title}</h3>
                 <p className="text-sm text-gray-600 line-clamp-3 mb-4 flex-1">{course.description}</p>
                 
                 <div className="mt-auto">
                    {isEnrolled ? (
                      <button disabled className="w-full bg-green-50 text-green-700 border border-green-200 py-2 rounded-lg font-medium flex items-center justify-center gap-2 cursor-default">
                        <CheckCircle size={18} /> Enrolled
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleEnroll(Number(course.id))}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
                      >
                        <PlusCircle size={18} /> Enroll Now
                      </button>
                    )}
                 </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};