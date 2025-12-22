import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Note from '@/models/Note';

export async function POST() {
  await dbConnect();
  
  // Create a blank note in the database
  const newNote = await Note.create({});
  
  // Send the new ID back to the frontend (so we can redirect the user)
  return NextResponse.json({ success: true, urlId: newNote.urlId });
}