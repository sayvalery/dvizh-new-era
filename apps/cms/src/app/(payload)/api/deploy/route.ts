import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'

const execAsync = promisify(exec)

export async function POST() {
  const scriptPath = path.resolve(process.cwd(), '../../scripts/build-site.sh')

  try {
    const { stdout, stderr } = await execAsync(`bash ${scriptPath}`, {
      timeout: 300_000, // 5 минут макс
      cwd: path.resolve(process.cwd(), '../..'),
      env: {
        ...process.env,
        CMS_URL: 'http://localhost:3002',
      },
    })

    const output = (stdout + '\n' + stderr).trim()

    return NextResponse.json({
      success: true,
      message: 'Сайт успешно опубликован',
      output,
    })
  } catch (err: unknown) {
    const error = err as { stdout?: string; stderr?: string; message?: string }
    const output = [error.stdout, error.stderr, error.message]
      .filter(Boolean)
      .join('\n')
      .trim()

    return NextResponse.json(
      {
        success: false,
        error: output || 'Ошибка сборки',
      },
      { status: 500 },
    )
  }
}
