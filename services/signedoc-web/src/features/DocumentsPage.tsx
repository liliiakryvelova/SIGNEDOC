import { useCallback, useEffect, useState } from 'react';
import { Badge, Body1, Button, Card, CardHeader, MessageBar, MessageBarBody, Skeleton, SkeletonItem, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow, Title1 } from '@fluentui/react-components';
import { AddRegular, ArrowRightRegular, CheckmarkCircleRegular, ClockRegular, DocumentRegular, MailRegular } from '@fluentui/react-icons';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { api } from '../api/index.js';
import type { DocumentSummary } from '../types/index.js';

function statusBadge(status: DocumentSummary['status']) {
  if (status === 'completed') return <Badge appearance="filled" color="success" icon={<CheckmarkCircleRegular />}>Completed</Badge>;
  if (status === 'awaiting_signature') return <Badge appearance="filled" color="warning" icon={<ClockRegular />}>Awaiting signature</Badge>;
  if (status === 'expired') return <Badge appearance="filled" color="danger">Expired</Badge>;
  return <Badge appearance="tint" color="informative">Draft</Badge>;
}

export function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => { setLoading(true); setError(null); try { setDocuments((await api.listDocuments()).items); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not load documents.'); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  const completed = documents.filter((document) => document.status === 'completed').length;
  const waiting = documents.filter((document) => document.status === 'awaiting_signature').length;
  return <motion.div className="page-stack" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
    <section className="dashboard-hero">
      <svg className="hero-mesh" aria-hidden="true" viewBox="0 0 800 400" preserveAspectRatio="none"><defs><radialGradient id="glowA"><stop stopColor="#65d6ca" stopOpacity=".42"/><stop offset="1" stopColor="#65d6ca" stopOpacity="0"/></radialGradient><radialGradient id="glowB"><stop stopColor="#70a7ea" stopOpacity=".5"/><stop offset="1" stopColor="#70a7ea" stopOpacity="0"/></radialGradient></defs><rect width="800" height="400" fill="url(#glowA)"/><rect width="800" height="400" fill="url(#glowB)"/></svg>
      <div className="hero-content"><span className="eyebrow"><span />Your signing workspace</span><Title1>Every signature, right on track.</Title1><Body1>Share documents securely, see who still needs to sign, and keep completed files close at hand.</Body1><div className="hero-actions"><Button as="a" href="/documents/new" appearance="primary" icon={<AddRegular />}>Share a document</Button><Button as="a" href={documents[0] ? `/documents/${documents[0].id}` : '/documents/new'} appearance="secondary" icon={<ArrowRightRegular />}>View recent activity</Button></div></div>
    </section>
    <section className="metric-grid" aria-label="Signing summary"><Card className="metric-card"><CardHeader image={<span className="metric-icon waiting"><ClockRegular /></span>} header={<span>Needs a signature</span>} description={<strong>{loading ? '—' : waiting}</strong>} /><span className="metric-note">Across {loading ? '—' : waiting} document requests</span></Card><Card className="metric-card"><CardHeader image={<span className="metric-icon completed"><CheckmarkCircleRegular /></span>} header={<span>Completed</span>} description={<strong>{loading ? '—' : completed}</strong>} /><span className="metric-note">Ready for your records</span></Card><Card className="metric-card"><CardHeader image={<span className="metric-icon shared"><MailRegular /></span>} header={<span>Recipients invited</span>} description={<strong>{loading ? '—' : documents.reduce((sum, item) => sum + item.recipients.length, 0)}</strong>} /><span className="metric-note">Invitation links issued</span></Card></section>
    <Card className="data-card" appearance="filled-alternative"><CardHeader header={<div className="section-heading"><div><span className="section-kicker">DOCUMENT OVERVIEW</span><h2>Your documents</h2><p>Track every request from draft through completion.</p></div><Button as="a" href="/documents/new" appearance="primary" icon={<AddRegular />}>New request</Button></div>} />
      {loading ? <div className="loading-rows" aria-label="Loading documents">{[1, 2, 3].map((row) => <Skeleton key={row}><SkeletonItem /></Skeleton>)}</div> : error ? <MessageBar intent="error"><MessageBarBody>{error}<Button appearance="transparent" onClick={() => void load()}>Try again</Button></MessageBarBody></MessageBar> : documents.length === 0 ? <div className="empty-state"><span className="empty-icon"><DocumentRegular /></span><h3>No documents yet</h3><p>Create your first signing request and invite a recipient to review.</p><Button as="a" href="/documents/new" appearance="primary" icon={<AddRegular />}>Share your first document</Button></div> : <Table className="documents-table" aria-label="Signing requests"><TableHeader><TableRow><TableHeaderCell>Document</TableHeaderCell><TableHeaderCell>Recipient</TableHeaderCell><TableHeaderCell>Status</TableHeaderCell><TableHeaderCell>Updated</TableHeaderCell><TableHeaderCell aria-label="Actions" /></TableRow></TableHeader><TableBody>{documents.map((document) => { const recipient = document.recipients[0]; return <TableRow key={document.id}><TableCell><Link className="document-title" to={`/documents/${document.id}`}><DocumentRegular />{document.fileName}</Link></TableCell><TableCell>{recipient ? <span className="recipient-cell">{recipient.name}<small>{recipient.email}</small></span> : <span className="muted">No recipient yet</span>}</TableCell><TableCell>{statusBadge(document.status)}</TableCell><TableCell>{new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(document.updatedAt))}</TableCell><TableCell><Button as="a" href={`/documents/${document.id}`} appearance="subtle" icon={<ArrowRightRegular />} aria-label={`View ${document.fileName}`} /></TableCell></TableRow>; })}</TableBody></Table>}
    </Card>
  </motion.div>;
}