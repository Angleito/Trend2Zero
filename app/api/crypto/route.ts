import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');

    // Removed redundant bitcoin-price logic

    return NextResponse.json({ message: "Unsupported endpoint" }, { status: 400 });
}
