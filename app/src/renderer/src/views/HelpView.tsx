import { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ArrowLeft, ArrowRight, ChevronDown, ChevronRight, ExternalLink, Search, X } from 'lucide-react'
import { ALL_TOPICS, HELP, imageUrl, pageBody } from '../help/toc'

export default function HelpView({ topicId, onTopic, onOpenView }: { topicId: string; onTopic: (id: string) => void; onOpenView: (view: string) => void }) {
  const [q, setQ] = useState('')
  const [closed, setClosed] = useState<Set<string>>(() => new Set(HELP.map((g) => g.id)))
  const index = Math.max(0, ALL_TOPICS.findIndex((t) => t.topic.id === topicId))
  const { topic, group } = ALL_TOPICS[index]
  const body = pageBody(topic.id)
  const prev = ALL_TOPICS[index - 1], next = ALL_TOPICS[index + 1]

  const needle = q.trim().toLowerCase()
  const groups = useMemo(() => HELP.map((g) => ({ ...g, topics: needle ? g.topics.filter((t) => (t.title + ' ' + t.summary + ' ' + g.title).toLowerCase().includes(needle)) : g.topics })).filter((g) => g.topics.length), [needle])

  // keep the section of the current topic open (e.g. after Next / Previous)
  useEffect(() => { setClosed((c) => c.has(group.id) ? new Set([...c].filter((id) => id !== group.id)) : c) }, [group.id])
  const toggle = (id: string) => setClosed((c) => { const n = new Set(c); n.has(id) ? n.delete(id) : n.add(id); return n })

  useEffect(() => { document.querySelector('.help-page')?.scrollTo(0, 0) }, [topicId])

  return (
    <div className="col">
      <div className="pane-title"><span>Help</span><span className="spacer" /><span className="muted help-crumb">{group.title}</span></div>
      <div className="help">
        <nav className="help-toc" aria-label="Help contents">
          <div className="search-box">
            <Search size={14} strokeWidth={1.5} />
            <input value={q} placeholder="Search help" onChange={(e) => setQ(e.target.value)} style={{ textTransform: 'none' }} />
            {q && <button title="Clear" onClick={() => setQ('')}><X size={13} /></button>}
          </div>
          {groups.map((g) => {
            const open = !!needle || !closed.has(g.id)
            return (
              <div key={g.id} className="help-group">
                <button className="help-group-title" aria-expanded={open} onClick={() => toggle(g.id)}>
                  {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}{g.title}<span>{g.topics.length}</span>
                </button>
                {open && g.topics.map((t) => (
                  <button key={t.id} className={'help-link' + (t.id === topic.id ? ' active' : '')} onClick={() => onTopic(t.id)}>
                    {t.title}{!pageBody(t.id) && <i title="Page is being written" />}
                  </button>
                ))}
              </div>
            )
          })}
          {groups.length === 0 && <div className="muted help-none">No topics match “{q}”.</div>}
        </nav>
        <article className="help-page">
          <div className="help-inner">
            <div className="muted help-path">{group.title}</div>
            <h1>{topic.title}</h1>
            <p className="help-summary">{topic.summary}</p>
            {topic.view && <button className="btn small" onClick={() => onOpenView(topic.view!)}><ExternalLink size={12} /> Open this screen</button>}
            {body
              ? <div className="md"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                  img: ({ src, alt }) => <img src={imageUrl(src ?? '') ?? src} alt={alt ?? ''} />,
                  a: ({ href, children }) => <a href={href} onClick={(e) => { e.preventDefault(); if (href) window.api.openExternal(href) }}>{children}</a>
                }}>{body}</ReactMarkdown></div>
              : <div className="help-draft">This page is being written. Screenshots and step-by-step instructions will appear here.</div>}
            <div className="help-nav">
              {prev ? <button onClick={() => onTopic(prev.topic.id)}><ArrowLeft size={14} /> {prev.topic.title}</button> : <span />}
              {next ? <button onClick={() => onTopic(next.topic.id)}>{next.topic.title} <ArrowRight size={14} /></button> : <span />}
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}
