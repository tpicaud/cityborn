'use client';

interface UserAvatarProps {
  name: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
  isCurrentUser?: boolean;
}

export function UserAvatar({
  name,
  color,
  size = 'sm',
  isCurrentUser,
}: UserAvatarProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  return (
    <div className="relative">
      <div
        className={`
          ${sizeClasses[size]}
          rounded-full
          flex items-center justify-center
          font-semibold text-white
          ring-2 ring-zinc-700
          ${isCurrentUser ? 'ring-primary' : ''}
          transition-all duration-200 hover:scale-110
        `}
        style={{ backgroundColor: color }}
        title={isCurrentUser ? `${name} (Vous)` : name}
      >
        {getInitials(name)}
      </div>

      {isCurrentUser && (
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-zinc-900" />
      )}
    </div>
  );
}
