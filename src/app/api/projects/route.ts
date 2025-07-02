import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })
    return NextResponse.json(projects)
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching projects' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const project = await prisma.project.create({
      data: json
    })
    return NextResponse.json(project)
  } catch (error) {
    return NextResponse.json({ error: 'Error creating project' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const json = await request.json()
    const { id, ...data } = json
    const project = await prisma.project.update({
      where: { id },
      data
    })
    return NextResponse.json(project)
  } catch (error) {
    return NextResponse.json({ error: 'Error updating project' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
    }
    await prisma.project.delete({
      where: { id }
    })
    return NextResponse.json({ message: 'Project deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Error deleting project' }, { status: 500 })
  }
} 