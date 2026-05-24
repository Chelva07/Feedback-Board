import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'

export async function POST(req: NextRequest) {
  try {
    const { title, notifyEmail, expiryDays } = await req.json()

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const slug = nanoid(8)
    const adminKey = nanoid(24)

    let expiresAt: Date | null = null
    if (expiryDays && expiryDays !== 'never') {
      expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + parseInt(expiryDays))
    }

    const board = await prisma.board.create({
      data: {
        slug,
        title: title.trim(),
        adminKey,
        notifyEmail: notifyEmail?.trim() || null,
        expiresAt,
      },
    })

    return NextResponse.json({
      slug: board.slug,
      adminKey: board.adminKey,
      title: board.title,
      expiresAt: board.expiresAt,
    })
  } catch (err) {
    console.error('[POST /api/boards]', err)
    return NextResponse.json({ error: 'Failed to create board' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')

  if (!slug) return NextResponse.json({ error: 'slug is required' }, { status: 400 })

  try {
    const board = await prisma.board.findUnique({
      where: { slug },
      select: { id: true, slug: true, title: true, createdAt: true, expiresAt: true },
    })

    if (!board) return NextResponse.json({ error: 'Board not found' }, { status: 404 })

    return NextResponse.json(board)
  } catch (err) {
    console.error('[GET /api/boards]', err)
    return NextResponse.json({ error: 'Failed to fetch board' }, { status: 500 })
  }
}