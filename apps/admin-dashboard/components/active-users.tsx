// src/components/active-users.tsx
"use client";

import { usePresence } from "@/hooks/use-presence";
import { UserAvatar } from "./user-avatar";
import { useState, useRef, useEffect } from "react";

export function ActiveUsers() {
  const { activeUsers, currentUserId } = usePresence();
  const [showDetails, setShowDetails] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Ensure this hook runs unconditionally, even before early return
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDetails(false);
      }
    };

    if (showDetails) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDetails]);

  if (activeUsers.length === 0) return null;

  const toggleDetails = () => setShowDetails(prev => !prev);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleDetails();
    }
  };

  return (
    <div className="relative">
      <button
        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={toggleDetails}
        onKeyDown={handleKeyDown}
        type="button"
        aria-label={`${activeUsers.length} utilisateur${
          activeUsers.length > 1 ? "s" : ""
        } en ligne. Cliquez pour voir les détails.`}
        aria-expanded={showDetails}
      >
        <div className="flex items-center -space-x-2">
          {activeUsers.slice(0, 3).map(user => (
            <UserAvatar
              key={user.id}
              name={user.name}
              color={user.color}
              isCurrentUser={user.id === currentUserId}
            />
          ))}

          {activeUsers.length > 3 && (
            <div className="w-10 h-10 rounded-full bg-zinc-700 border-2 border-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-300">
              +{activeUsers.length - 3}
            </div>
          )}
        </div>

        <div className="text-sm text-zinc-400">
          {activeUsers.length === 1
            ? "1 utilisateur en ligne"
            : `${activeUsers.length} utilisateurs en ligne`}
        </div>
      </button>

      {/* User details dropdown */}
      {showDetails && (
        <div
          ref={dropdownRef}
          className="absolute top-full mt-2 w-64 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg z-50
                     right-0 sm:right-0 
                     max-w-[calc(100vw-2rem)] 
                     left-auto sm:left-auto
                     transform-none sm:transform-none"
          style={{
            // Ensure it doesn't go off-screen on mobile
            right: 'max(0px, min(0px, calc(100vw - 16rem - 1rem)))'
          }}
        >
          <div className="p-3 border-b border-zinc-700">
            <h3 className="font-semibold text-zinc-200">Utilisateurs Actifs</h3>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {activeUsers.map(user => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-3 hover:bg-zinc-700 hover:rounded-lg"
              >
                <UserAvatar
                  name={user.name}
                  color={user.color}
                  size="sm"
                  isCurrentUser={user.id === currentUserId}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-zinc-200 truncate">
                    {user.name}
                    {user.id === currentUserId && (
                      <span className="text-primary ml-1">(Vous)</span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-400">
                    Actif il y a {Math.floor((Date.now() - user.lastSeen) / 1000)}s
                  </div>
                </div>

                <div className="w-2 h-2 bg-green-400 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}