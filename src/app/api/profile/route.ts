import { NextRequest, NextResponse } from 'next/server';
import { auth as adminAuth } from 'firebase-admin';
import { getUserProfile } from '@/app/api/service/userProfileService';
import { firestore } from '@/lib/firebaseAdmin'; // Import to ensure initialization

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];

    if (!idToken) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token format' }, { status: 401 });
    }
    
    const decodedToken = await adminAuth().verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    if (!uid) {
        return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const userProfile = await getUserProfile(uid);

    if (!userProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json(userProfile);
  } catch (error: any) {
    console.error('API Error fetching user profile:', error);
    if (error.code === 'auth/id-token-expired') {
        return NextResponse.json({ error: 'Token expired, please re-authenticate.' }, { status: 401 });
    }
    if (error.code === 'auth/argument-error') {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 