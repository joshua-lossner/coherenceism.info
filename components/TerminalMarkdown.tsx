import React from 'react'
import ReactMarkdown from 'react-markdown'

interface TerminalMarkdownProps {
  content: string
}

const components = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-terminal-green text-xl font-bold mb-4">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-terminal-green text-lg font-bold mb-3">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-terminal-green text-base font-bold mb-2">{children}</h3>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-terminal-green mb-3 leading-relaxed">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="text-terminal-green mb-3 ml-4 list-disc">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="text-terminal-green mb-3 ml-4 list-decimal">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="text-terminal-green mb-1">{children}</li>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="text-terminal-green-dim border-l-2 border-terminal-green pl-4 italic mb-3">{children}</blockquote>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="text-terminal-green font-bold brightness-125">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="text-terminal-green italic">{children}</em>
  ),
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="text-terminal-amber bg-black px-1 rounded">{children}</code>
  ),
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre className="text-terminal-amber bg-black p-3 rounded mb-3 overflow-x-auto">{children}</pre>
  ),
}

export default function TerminalMarkdown({ content }: TerminalMarkdownProps) {
  return <ReactMarkdown components={components}>{content}</ReactMarkdown>
}

