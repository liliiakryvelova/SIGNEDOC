import { useEffect, useState, type FormEvent } from 'react';
import { Badge, Button, Card, Checkbox, Field, Input, MessageBar, MessageBarBody, Skeleton, SkeletonItem } from '@fluentui/react-components';
import { CheckmarkCircleRegular, DocumentRegular, ShieldLockRegular, SignatureRegular } from '@fluentui/react-icons';
import { useParams } from 'react-router-dom';
import { api } from '../api/index.js';
import type { SigningViewResponse } from '../types/index.js';
import { PageHeader, TrustNote } from '../app/Layout.js';

export function SignDocumentPage() {
  const { token = '' } = useParams();
  const [view, setView] = useState<SigningViewResponse | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [signature, setSignature] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);
  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    api.getSigningView(token).then(async (value) => {
      if (!active) return;
      setView(value);
      if (value.previewUrl.startsWith('/api/')) {
        const blob = await api.getSigningDocument(token);
        objectUrl = URL.createObjectURL(blob);
        if (active) setPreviewUrl(objectUrl);
      }
    }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'This signing link is not available.'); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [token]);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!view) return;
    if (!signature.trim() || !consent) { setError('Enter your signature and confirm your consent.'); return; }
    setSubmitting(true);
    try { await api.submitSignature(token, { signature: signature.trim(), consent, requestId: view.recipient.id }); setComplete(true); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Your signature could not be recorded.'); }
    finally { setSubmitting(false); }
  };
  if (!view && !error) return <div className="page-stack"><Skeleton><SkeletonItem /></Skeleton><Skeleton><SkeletonItem /></Skeleton></div>;
  if (!view) return <MessageBar intent="error"><MessageBarBody>{error}</MessageBarBody></MessageBar>;
  if (complete) return <Card className="sign-success" appearance="filled-alternative"><CheckmarkCircleRegular /><h1>Signature recorded</h1><p>Your typed signature and submission time were added to the signing record.</p><TrustNote /></Card>;
  return <div className="page-stack signing-page">
    <div className="private-banner"><ShieldLockRegular />Private invitation · addressed to {view.recipient.name}</div>
    <PageHeader title="Review and sign" description={`${view.document.fileName} · Sent by ${view.senderDisplayName}`} />
    <Badge appearance="filled" color="warning">Awaiting your signature</Badge>
    <div className="sign-grid">
      <Card className="pdf-preview" appearance="filled-alternative">
        <div className="pdf-toolbar"><DocumentRegular /><span>Document preview</span><Badge appearance="tint">PDF</Badge></div>
        {previewUrl ? <iframe className="pdf-frame" title={`PDF preview of ${view.document.fileName}`} src={previewUrl} /> : <div className="preview-unavailable"><DocumentRegular /><h2>Preview file unavailable</h2><p>This demonstration record does not include a source PDF. A real invitation link loads its original PDF here.</p></div>}
      </Card>
      <Card className="sign-form-card" appearance="filled-alternative"><form onSubmit={(event) => void submit(event)}><span className="section-kicker">RECIPIENT SIGNATURE</span><Field label="Type your full name" required hint="Your typed name is recorded as your electronic signature for this MVP."><Input value={signature} onChange={(_, data) => setSignature(data.value)} placeholder="Maya Chen" /></Field><Checkbox checked={consent} onChange={(_, data) => setConsent(data.checked === true)} label="I agree to sign electronically" /><p className="consent-note">By signing, you confirm that you reviewed the document and consent to recording this typed signature. This MVP does not establish legal enforceability.</p>{error && <MessageBar intent="error"><MessageBarBody>{error}</MessageBarBody></MessageBar>}<Button type="submit" appearance="primary" icon={<SignatureRegular />} disabled={submitting || !previewUrl}>{submitting ? 'Recording signature…' : 'Record my signature'}</Button></form></Card>
    </div>
    <TrustNote />
  </div>;
}