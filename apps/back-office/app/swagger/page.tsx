import { getOpenApiDocument } from '@cityborn/api';
import { SwaggerUIClient } from '@/components/swagger-ui-client';
import { getBackOfficeServerConfig } from '@/config/server';

export const dynamic = 'force-dynamic';

export default function SwaggerPage() {
  const backOfficeServerConfig = getBackOfficeServerConfig();
  const spec = getOpenApiDocument(backOfficeServerConfig.backendUrl);
  return <SwaggerUIClient spec={spec} />;
}
