'use client';

import { useState, useEffect } from 'react';
import { useFirebase } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { UserProfile } from '@/lib/types';

export function useUserRole() {
  const { user, firestore, isUserLoading } = useFirebase();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isRoleLoading, setIsRoleLoading] = useState(true);

  useEffect(() => {
    if (isUserLoading) {
      setIsRoleLoading(true);
      return;
    }

    if (!user) {
      setUserProfile(null);
      setIsRoleLoading(false);
      return;
    }

    const docRef = doc(firestore, 'users', user.uid);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserProfile(docSnap.data() as UserProfile);
      } else {
        setUserProfile(null); // Or handle this case as an error
      }
      setIsRoleLoading(false);
    }, (error) => {
      console.error("Error fetching user role:", error);
      setUserProfile(null);
      setIsRoleLoading(false);
    });

    return () => unsubscribe();
  }, [user, firestore, isUserLoading]);

  return { userProfile, isRoleLoading };
}
