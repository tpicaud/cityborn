'use client';

import { getOpenApiDocument } from '@cityborn/api';
import { AdminAccessGuard } from '@/components/auth/admin-access-guard';
import { SwaggerUIClient } from '@/components/swagger-ui-client';
import { backOfficeClientConfig } from '@/config/client';

const openApiDocument: ReturnType<typeof getOpenApiDocument> =
  getOpenApiDocument(backOfficeClientConfig.restBackendUrl);

export default function SwaggerPage() {
  return (
    <AdminAccessGuard>
      <SwaggerUIClient spec={openApiDocument} />
    </AdminAccessGuard>
  );
}
