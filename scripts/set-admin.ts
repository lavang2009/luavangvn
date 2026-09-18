import { getAdminAuth, getAdminDb, getAdminApp } from '../lib/firebase/admin';

async function main(){const uid=process.argv[2];if(!uid){console.error('Usage: npm run set-admin -- <FIREBASE_UID>');process.exit(1);}getAdminApp();const auth=getAdminAuth();const user=await auth.getUser(uid);await auth.setCustomUserClaims(uid,{...(user.customClaims??{}),admin:true});await getAdminDb().collection('users').doc(uid).set({role:'admin',updatedAt:Date.now()},{merge:true});console.log(`Admin claim set for ${uid}. User must refresh ID token before role is visible.`)}
main().catch(e=>{console.error(e);process.exit(1)});
