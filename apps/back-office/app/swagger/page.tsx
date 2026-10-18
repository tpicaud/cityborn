'use client';

import { getOpenApiDocument } from '@cityborn/api';
import { SwaggerUIClient } from '@/components/swagger/swagger-ui-client';
import { backOfficeClientConfig } from '@/config/client';
import { AdminAccessGuard } from '@/features/auth/admin-access-guard';

const openApiDocument: ReturnType<typeof getOpenApiDocument> =
  getOpenApiDocument(backOfficeClientConfig.restBackendUrl);

export default function SwaggerPage() {
  return (
    <AdminAccessGuard>
      <SwaggerUIClient spec={openApiDocument} />
    </AdminAccessGuard>
  );
}
