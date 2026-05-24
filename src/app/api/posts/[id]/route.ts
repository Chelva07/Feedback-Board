import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  try {
    const { action, adminKey, slug } = await req.json()

    if (action === 'upvote') {
      const post = await prisma.post.update({
        where: { id },
        data: { upvotes: { increment: 1 } },
      })
      return NextResponse.json(post)
    }

    if (action === 'pin') {
      if (!adminKey || !slug) return NextResponse.json({ error: 'adminKey and slug required' }, { status: 400 })
      const board = await prisma.board.findUnique({ where: { slug } })
      if (!board || board.adminKey !== adminKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      const post = await prisma.post.findUnique({ where: { id } })
      if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      const updated = await prisma.post.update({ where: { id }, data: { pinned: !post.pinned } })
      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    console.error('[PATCH /api/posts/[id]]', err)
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params
  try {
    const { adminKey, slug } = await req.json()
    if (!adminKey || !slug) return NextResponse.json({ error: 'adminKey and slug required' }, { status: 400 })
    const board = await prisma.board.findUnique({ where: { slug } })
    if (!board || board.adminKey !== adminKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    await prisma.post.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DELETE /api/posts/[id]]', err)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}