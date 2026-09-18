import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { firebaseAuth, googleProvider } from './client';

export async function initAuthPersistence() {
  await setPersistence(firebaseAuth, browserLocalPersistence);
}

export async function registerUser(email: string, password: string, displayName: string) {
  await initAuthPersistence();
  const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
  await updateProfile(credential.user, { displayName });
  return credential.user;
}

export async function loginUser(email: string, password: string) {
  await initAuthPersistence();
  return signInWithEmailAndPassword(firebaseAuth, email, password);
}

export async function loginWithGoogle() {
  await initAuthPersistence();
  return signInWithPopup(firebaseAuth, googleProvider);
}

export async function resetPassword(email: string) {
  return sendPasswordResetEmail(firebaseAuth, email);
}

export function logout() {
  return signOut(firebaseAuth);
}

export function authErrorMessage(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code: unknown }).code) : '';
  const map: Record<string, string> = {
    'auth/invalid-credential': 'Email hoặc mật khẩu không đúng.',
    'auth/email-already-in-use': 'Email đã được sử dụng.',
    'auth/weak-password': 'Mật khẩu chưa đủ mạnh.',
    'auth/popup-closed-by-user': 'Bạn đã đóng cửa sổ đăng nhập.',
    'auth/too-many-requests': 'Có quá nhiều yêu cầu. Hãy thử lại sau.',
  };
  return map[code] ?? 'Không thể hoàn tất thao tác tài khoản.';
}

export async function getAccessToken(user: User) {
  return user.getIdToken();
}
