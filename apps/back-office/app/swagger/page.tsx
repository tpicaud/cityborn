'use client';

import { getOpenApiDocument } from '@cityborn/api';
import { SwaggerUIClient } from '@/components/swagger-ui-client';
import { backOfficeClientConfig } from '@/config/client';

const openApiDocument: ReturnType<typeof getOpenApiDocument> =
  getOpenApiDocument(backOfficeClientConfig.restBackendUrl);

export default function SwaggerPage() {
  return <SwaggerUIClient spec={openApiDocument} />;
}
