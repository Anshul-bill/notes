import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Note from '@/models/Note';

// 1. GET: Fetch a specific note by its Short URL ID
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await params; // This is the short ID (e.g., "qeJGQZ")

  // CRITICAL FIX: Use 'findOne({ urlId: id })' instead of 'findById(id)'
  // 'findById' expects a long MongoDB Object ID, which causes the "Note not found" error.
  const note = await Note.findOne({ urlId: id });

  if (!note) {
    return NextResponse.json({ success: false }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: note });
}

// 2. PUT: Save changes (Title, Content, AND PIN STATUS)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await params;
  const body = await req.json();
  
  // We construct the update object dynamically
  // This allows us to update JUST 'isPinned' without overwriting title/content if we want
  const updateData: any = {};
  if (body.title !== undefined) updateData.title = body.title;
  if (body.content !== undefined) updateData.content = body.content;
  if (body.isPinned !== undefined) updateData.isPinned = body.isPinned; // <--- Handle Pin
  if (body.isEncrypted !== undefined) updateData.isEncrypted = body.isEncrypted;

  const note = await Note.findOneAndUpdate(
    { urlId: id }, 
    updateData, 
    { new: true }
  );
  
  if (!note) {
    return NextResponse.json({ success: false }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: note });
}

// 3. DELETE: Remove a note
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await params;

  // Find by custom 'urlId' and delete
  const deletedNote = await Note.findOneAndDelete({ urlId: id });

  if (!deletedNote) {
    return NextResponse.json({ success: false }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}