// Deliberately small, text-only Markdown subset. No raw HTML or executable URLs.
// Authors can use ## headings, paragraphs, and - lists without an HTML sanitizer.
export function blogBlocks(content: string) {
  return content.replace(/\r\n/g, '\n').split(/\n\s*\n/).filter((block) => block.trim())
}
export default function BlogBody({ content }: { content: string }) {
  return <div className="space-y-7 text-base leading-[2] text-charcoal/80 sm:text-lg">
    {blogBlocks(content).map((block, index) => {
      if (block.startsWith('## ')) return <h2 id={`section-${index}`} key={index} className="scroll-mt-32 pt-5 text-2xl font-semibold leading-relaxed text-charcoal sm:text-3xl">{block.slice(3).trim()}</h2>
      if (block.split('\n').every((line) => line.startsWith('- '))) return <ul key={index} className="list-disc space-y-2 ps-6">{block.split('\n').map((line, i) => <li key={i}>{line.slice(2)}</li>)}</ul>
      return <p key={index} className="whitespace-pre-line">{block}</p>
    })}
  </div>
}
