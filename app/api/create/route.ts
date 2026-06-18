import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Note from '@/models/Note';

export async function POST() {
  try {
    await dbConnect();
    const newNote = await Note.create({});
    return NextResponse.json({ success: true, urlId: newNote.urlId });
  } catch (e) {
    const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}