import React from 'react';

export function NotFoundPage({
  attemptedPath,
  staticRedirectHref = '/',
}: {
  attemptedPath?: string;
  staticRedirectHref?: string;
}) {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>404 - Pagina Nu A Fost Găsită</h1>
      <p>Ne cerem scuze, dar pagina pe care o căutați nu există.</p>
      {attemptedPath ? <p style={{ opacity: 0.8 }}>Cale încercată: {attemptedPath}</p> : null}
      <a href={staticRedirectHref} style={{ color: '#0284c7', textDecoration: 'underline' }}>Înapoi la prima pagină</a>
    </div>
  );
}
