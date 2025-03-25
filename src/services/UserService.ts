import { db } from '../firebase';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  Timestamp,
  query,
  collection,
  where,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';

export interface MusicPreferences {
  focusedMusic: string;
  calmMusic: string;
}

export interface FocusSession {
  id: string;
  startTime: Date;
  endTime: Date;
  averageFocusLevel: number;
  focusPoints: {
    timestamp: Date;
    level: number;
  }[];
}

class UserService {
  async getUserProfile(userId: string) {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return userSnap.data();
      } else {
        throw new Error('User not found');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  async updateMusicPreferences(userId: string, preferences: MusicPreferences) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { musicPreferences: preferences });
    } catch (error) {
      console.error('Error updating music preferences:', error);
      throw error;
    }
  }

  async saveFocusPoint(userId: string, sessionId: string, focusLevel: number) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        [`focusSessions.${sessionId}.focusPoints`]: arrayUnion({
          timestamp: Timestamp.now(),
          level: focusLevel
        })
      });
    } catch (error) {
      console.error('Error saving focus point:', error);
      throw error;
    }
  }

  async saveFocusSession(userId: string, session: FocusSession) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        focusSessions: arrayUnion(session)
      });
    } catch (error) {
      console.error('Error saving focus session:', error);
      throw error;
    }
  }

  async getFocusHistory(userId: string, days: number = 7) {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        throw new Error('User not found');
      }
      
      const userData = userSnap.data();
      
      if (!userData.focusSessions) {
        return [];
      }
      
      // Filter sessions from the last 'days' days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      return userData.focusSessions.filter((session: any) => 
        session.startTime.toDate() >= cutoffDate
      ).sort((a: any, b: any) => 
        b.startTime.toDate().getTime() - a.startTime.toDate().getTime()
      );
    } catch (error) {
      console.error('Error fetching focus history:', error);
      throw error;
    }
  }
}

export default new UserService();