#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

async function main() {
  const token = process.env.FIGMA_TOKEN
  const fileKey = process.env.FIGMA_FILE_KEY

  if (!token || !fileKey) {
    console.error('Missing FIGMA_TOKEN or FIGMA_FILE_KEY environment variables.')
    console.error('Set them and re-run: FIGMA_TOKEN=... FIGMA_FILE_KEY=... npm run fetch:figjam')
    process.exit(1)
  }

  const url = `https://api.figma.com/v1/files/${fileKey}`
  console.log('Fetching FigJam file:', fileKey)

  try {
    const res = await fetch(url, {
      headers: {
        'X-Figma-Token': token,
      },
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Figma API error ${res.status}: ${text}`)
    }

    const json = await res.json()

    const outDir = path.resolve(__dirname, '..', '..', 'output', 'flowspec')
    fs.mkdirSync(outDir, { recursive: true })

    const outPath = path.join(outDir, `${fileKey}.json`)
    fs.writeFileSync(outPath, JSON.stringify(json, null, 2), 'utf8')
    console.log('Saved FigJam JSON to', outPath)
  } catch (err) {
    console.error('Failed to fetch FigJam file:', err.message || err)
    process.exit(2)
  }
}

main()
