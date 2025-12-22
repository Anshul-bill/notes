import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';

export async function GET() {
  try {
    await dbConnect();
    return NextResponse.json({ message: '✅ Database Connection Successful!' });
  } catch (error: any) {
    return NextResponse.json({ message: '❌ Database Connection Failed', error: error.message }, { status: 500 });
  }
}