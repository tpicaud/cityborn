// src/app/api/presence/route.ts
import { type NextRequest, NextResponse } from "next/server";

interface ActiveUser {
  id: string;
  name: string;
  color: string;
  lastSeen: number;
  currentPage: string;
}

// In production, use Redis or database
const activeUsers = new Map<string, ActiveUser>();
const PRESENCE_TIMEOUT = 60000; // 60 seconds

// Generate consistent color based on user ID (same user = same color always)
const generateUserColor = (userId: string) => {
  const colors = [
    "#ef4444", "#f97316", "#f59e0b", "#eab308", 
    "#84cc16", "#22c55e", "#10b981", "#14b8a6",
    "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1",
    "#8b5cf6", "#a855f7", "#d946ef", "#ec4899"
  ];
  
  // Create a simple hash from the user ID
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Use the hash to pick a color consistently
  const colorIndex = Math.abs(hash) % colors.length;
  return colors[colorIndex];
};

// Generate name from user ID (already deterministic)
const generateUserName = (userId: string) => {
  const adjectives = ["Quick", "Bright", "Cool", "Smart", "Fast", "Bold", "Calm", "Sharp"];
  const nouns = ["Fox", "Wolf", "Eagle", "Tiger", "Lion", "Bear", "Hawk", "Cat"];
  
  const hash = userId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const adjIndex = Math.abs(hash) % adjectives.length;
  const nounIndex = Math.abs(hash >> 8) % nouns.length;
  
  return `${adjectives[adjIndex]} ${nouns[nounIndex]}`;
};

// Cleanup inactive users
const cleanupInactiveUsers = () => {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [id, user] of activeUsers.entries()) {
    if (now - user.lastSeen > PRESENCE_TIMEOUT) {
      activeUsers.delete(id);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`Cleaned up ${cleanedCount} inactive users`);
  }
};

export async function POST(request: NextRequest) {
  try {
    const { userId, action, currentPage } = await request.json();
    const now = Date.now();
    
    // Clean up inactive users first
    cleanupInactiveUsers();
    
    if (action === "heartbeat") {
      const existingUser = activeUsers.get(userId);
      
      if (!existingUser) {
        // New user joining - use deterministic color and name
        const newUser: ActiveUser = {
          id: userId,
          name: generateUserName(userId), // Deterministic based on ID
          color: generateUserColor(userId), // Deterministic based on ID
          lastSeen: now,
          currentPage: currentPage || "/dashboard"
        };
        activeUsers.set(userId, newUser);
        console.log(`New user joined: ${newUser.name} (${userId}) - Color: ${newUser.color}`);
      } else {
        // Update existing user (preserve color and name)
        existingUser.lastSeen = now;
        existingUser.currentPage = currentPage || existingUser.currentPage;
      }
    }
    
    if (action === "leave") {
      const user = activeUsers.get(userId);
      if (user) {
        activeUsers.delete(userId);
        console.log(`User left: ${user.name} (${userId})`);
      }
    }
    
    // Return all active users
    const users = Array.from(activeUsers.values());
    return NextResponse.json({ 
      users,
      timestamp: now,
      action: action || "unknown"
    });
    
  } catch (error) {
    console.error("Presence operation failed:", error);
    return NextResponse.json({ users: [] }, { status: 500 });
  }
}

export async function GET() {
  // Clean up inactive users
  cleanupInactiveUsers();
  
  const users = Array.from(activeUsers.values());
  return NextResponse.json({ 
    users,
    timestamp: Date.now()
  });
}