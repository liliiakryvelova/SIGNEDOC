import { useState, type FormEvent } from 'react';
import { Button, Card, Checkbox, Field, Input, MessageBar, MessageBarBody, Textarea } from '@fluentui/react-components';
import { ArrowUploadRegular, CheckmarkCircleRegular, DocumentAddRegular, MailRegular } from '@fluentui/react-icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/index.js';
import { PageHeader, TrustNote } from '../app/Layout.js';

const MAX_FILE_BYTES = 10 * 1024 * 1024;

export function ShareDocumentPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState('');
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError('');
    const form = new FormData(event.currentTarget);
    if (!file) { setError('Choose a PDF document to continue.'); return; }
    if (file.type !== 'application/pdf' || !file.name.toLowerCase().endsWith('.pdf')) { setError('Only PDF files are supported in this MVP.'); return; }
    if (file.size > MAX_FILE_BYTES) { setError('The PDF must be 10 MB or smaller.'); return; }
    const name = String(form.get('name') ?? '').trim(); const email = String(form.get('email') ?? '').trim();
    if (!name || !email) { setError('Enter the recipient name and email address.'); return; }
    setSending(true);
    try { const created = await api.createDocument({ fileName: file.name, contentType: 'application/pdf', size: file.size }); await api.uploadDocument(created.documentId, file); const invitation = await api.createInvitation(created.documentId, { name, email, message: String(form.get('message') ?? ''), expiresAt: String(form.get('expiresAt') ?? '') ? new Date(String(form.get('expiresAt'))).toISOString() : undefined }); setDeliveryStatus(invitation.status); setSent(true); window.setTimeout(() => navigate(`/documents/${created.documentId}`), 900); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'The request could not be created. Try again.'); }
    finally { setSending(false); }
  };
  return <div className="page-stack"><PageHeader title="Share a document" description="Add a PDF and recipient details. They can open a private link to review and sign." /><div className="form-layout"><Card className="form-card" appearance="filled-alternative"><form onSubmit={(event) => void handleSubmit(event)} noValidate>
    <span className="section-kicker">NEW SIGNING REQUEST</span>
    <Field label="Document file" hint="PDF only · Maximum 10 MB · Private storage" required>
      <label className={`upload-zone ${file ? 'upload-zone-selected' : ''}`} htmlFor="document-file"><span className="upload-symbol"><ArrowUploadRegular /></span><strong>{file ? file.name : 'Choose a PDF to upload'}</strong><span>{file ? `${(file.size / 1024).toFixed(0)} KB · Private storage` : 'Select a PDF from your device'}</span><input id="document-file" type="file" accept="application/pdf,.pdf" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setError(''); }} /></label>
    </Field>
    <div className="form-section-title"><span className="form-step">1</span><div><h2>Recipient details</h2><p>One person can sign this request in the MVP.</p></div></div>
    <div className="field-grid"><Field label="Recipient name" required><Input name="name" placeholder="Alex Rivera" autoComplete="name" /></Field><Field label="Recipient email" required><Input name="email" type="email" placeholder="alex@example.org" autoComplete="email" /></Field></div>
    <Field label="Message (optional)" hint="Add a note to include with the private signing invitation."><Textarea name="message" placeholder="Please review and sign by the requested date." resize="vertical" rows={3} /></Field>
    <Field label="Invitation expires" hint="Signing link expires after this date."><Input name="expiresAt" type="date" /></Field>
    <Field validationState={error ? 'error' : 'none'} validationMessage={error || undefined}>{error && <MessageBar intent="error"><MessageBarBody>{error}</MessageBarBody></MessageBar>}</Field>
    {sent && <MessageBar intent="success" icon={<CheckmarkCircleRegular />}><MessageBarBody>{deliveryStatus === 'sent_to_development_sink' ? 'Request created. The invitation URL was recorded in the local development sink; no email was sent.' : 'Request created. Email delivery is not configured; no email was sent.'}</MessageBarBody></MessageBar>}
    <div className="form-actions"><Button type="button" appearance="secondary" onClick={() => navigate('/')}>Cancel</Button><Button type="submit" appearance="primary" icon={<MailRegular />} disabled={sending || sent}>{sending ? 'Creating request…' : 'Send signing invitation'}</Button></div>
  </form></Card><aside className="form-aside"><Card appearance="filled-alternative"><div className="aside-icon"><DocumentAddRegular /></div><h3>Private from start to finish</h3><p>Files are placed in private storage. Signing links are scoped to one recipient and can expire.</p><div className="aside-check"><Checkbox checked disabled label="Private file storage" /><Checkbox checked disabled label="Single-recipient signing link" /><Checkbox checked disabled label="Timestamped signing event" /></div></Card><TrustNote /></aside></div></div>;
}