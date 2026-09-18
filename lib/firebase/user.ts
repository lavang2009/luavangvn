import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { firebaseDb } from './client';

export async function ensureUserProfile(user: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  providerId: string;
}) {
  const ref = doc(firebaseDb, 'users', user.uid);
  const snapshot = await getDoc(ref);
  if (snapshot.exists()) return;

  await setDoc(ref, {
    uid: user.uid,
    username: user.email?.split('@')[0]?.slice(0, 30) ?? `user_${user.uid.slice(0, 8)}`,
    displayName: user.displayName ?? 'Thành viên',
    email: user.email ?? '',
    photoURL: user.photoURL ?? '',
    provider: user.providerId,
    role: 'user',
    balance: 0,
    totalSpent: 0,
    totalDeposited: 0,
    totalOrders: 0,
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  });
}
