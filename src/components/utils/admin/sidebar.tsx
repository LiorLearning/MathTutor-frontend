
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Student, MODEL_API_BASE_URL } from '@/components/utils/admin/admin_utils';

interface UserSidebarProps {
  username: string;
}

const UserSidebar: React.FC<UserSidebarProps> = ({ username }) => {
  const [studentDetails, setStudentDetails] = useState<Student | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get<Student>(`${MODEL_API_BASE_URL}/users/${username}`);
        setStudentDetails(response.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [username]);

  return (
    <div className="w-1/5 bg-gray-100 p-4 border-r">
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">User Details</h2>
        {studentDetails ? (
          <div>
            <p><strong>User ID:</strong> {studentDetails.userid}</p>
            <p><strong>Name:</strong> {studentDetails.first_name} {studentDetails.last_name}</p>
            <p><strong>Grade:</strong> {studentDetails.grade}</p>
            <p><strong>Age:</strong> {studentDetails.age}</p>
            <p><strong>Parent/Guardian:</strong> {studentDetails.parent_guardian}</p>
            <p><strong>Email:</strong> {studentDetails.email}</p>
            <p><strong>Phone:</strong> {studentDetails.phone}</p>
            <p><strong>Country:</strong> {studentDetails.country}</p>
          </div>
        ) : (
          <p>Loading user details...</p>
        )}
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-2">User Context</h2>
        <p className="text-sm">{studentDetails?.user_context || 'Loading user context...'}</p>
      </div>
    </div>
  );
};

export default UserSidebar;
