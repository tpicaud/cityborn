'use client';
import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export function SwaggerUIClient({ spec }: { spec: object }) {
  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <SwaggerUI spec={spec} />
    </div>
  );
}
