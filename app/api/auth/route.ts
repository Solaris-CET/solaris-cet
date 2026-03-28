import { NextResponse } from 'next/server';
import { getDb, schema } from '@/db/client';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function POST(req: Request) {
  try {
    const { walletAddress } = await req.json();

    if (!walletAddress) {
      return NextResponse.json({ error: 'Adresa lipsește' }, { status: 400 });
    }

    const db = getDb();

    // Căutăm userul în baza de date
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.walletAddress, walletAddress));

    // Dacă există, îl trimitem înapoi la frontend
    if (user) {
      return NextResponse.json(user);
    }

    // Dacă nu există, creăm un rând nou în tabelul 'users'
    const [newUser] = await db
      .insert(schema.users)
      .values({
        walletAddress: walletAddress,
        referralCode: nanoid(8).toUpperCase(), // Exemplu: 'A1B2C3D4'
        points: 0,
        createdAt: new Date(),
      })
      .returning();

    return NextResponse.json(newUser);
  } catch (err) {
    console.error("Eroare Auth API:", err);
    return NextResponse.json({ error: 'Eroare la baza de date' }, { status: 500 });
  }
}