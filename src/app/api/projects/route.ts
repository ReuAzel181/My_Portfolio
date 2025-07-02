import { NextResponse } from 'next/server'
import { projects } from '@/data/projects'

export async function GET() {
  try {
    return NextResponse.json(projects)
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching projects' }, { status: 500 })
  }
}

// Remove POST, PUT, and DELETE methods since we're using static data 