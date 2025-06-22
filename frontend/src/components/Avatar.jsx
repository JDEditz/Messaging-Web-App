import React from 'react';
import { User } from 'lucide-react';

const Avatar = ({ user, size = 'md', showOnline = false }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg'
  };

  const onlineSize = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4'
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getBgColor = (name) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="relative">
      <div className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-medium ${getBgColor(user?.username || 'U')}`}>
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={user.username}
            className="w-full h-full rounded-full object-cover"
          />
        ) : user?.username ? (
          getInitials(user.username)
        ) : (
          <User className="w-1/2 h-1/2" />
        )}
      </div>
      {showOnline && user?.isOnline && (
        <div className={`absolute bottom-0 right-0 ${onlineSize[size]} bg-green-500 border-2 border-white rounded-full`}></div>
      )}
    </div>
  );
};

export default Avatar;