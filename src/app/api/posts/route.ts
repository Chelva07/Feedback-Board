import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')
  const category = searchParams.get('category')

  if (!slug) return NextResponse.json({ error: 'slug is required' }, { status: 400 })

  try {
    const board = await prisma.board.findUnique({ where: { slug } })
    if (!board) return NextResponse.json({ error: 'Board not found' }, { status: 404 })

    const posts = await prisma.post.findMany({
      where: {
        boardId: board.id,
        ...(category && category !== 'All' ? { category } : {}),
      },
      orderBy: [{ pinned: 'desc' }, { upvotes: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json(posts)
  } catch (err) {
    console.error('[GET /api/posts]', err)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { slug, content, category } = await req.json()

    if (!slug || !content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ error: 'slug and content are required' }, { status: 400 })
    }

    const board = await prisma.board.findUnique({ where: { slug } })
    if (!board) return NextResponse.json({ error: 'Board not found' }, { status: 404 })

    // Block posting if board is expired
    if (board.expiresAt && new Date() > new Date(board.expiresAt)) {
      return NextResponse.json({ error: 'This board has expired' }, { status: 403 })
    }

    const post = await prisma.post.create({
      data: {
        content: content.trim(),
        category: category?.trim() || 'General',
        boardId: board.id,
      },
    })

    // Send email notification if board has notifyEmail
    if (board.notifyEmail) {
      try {
        await resend.emails.send({
          from: 'FeedbackBoard <onboarding@resend.dev>',
          to: board.notifyEmail,
          subject: `New feedback on "${board.title}"`,
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
              <h2 style="color: #111;">New feedback on <em>${board.title}</em></h2>
              <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <p style="margin: 0; font-size: 15px; color: #333;">${post.content}</p>
                <p style="margin: 8px 0 0; font-size: 12px; color: #888;">Category: ${post.category}</p>
              </div>
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/board/${slug}"
                style="display: inline-block; background: #c8ff57; color: #000; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 8px;">
                View Board →
              </a>
            </div>
          `,
        })
      } catch (emailErr) {
        console.error('Email send failed:', emailErr)
        // Don't fail the post if email fails
      }
    }

    return NextResponse.json(post)
  } catch (err) {
    console.error('[POST /api/posts]', err)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}