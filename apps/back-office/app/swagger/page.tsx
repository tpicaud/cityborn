import { getOpenApiDocument } from '@cityborn/api';
import { SwaggerUIClient } from '@/components/swagger-ui-client';

export default function SwaggerPage() {
  const spec = getOpenApiDocument(process.env.BACKEND_URL);
  return <SwaggerUIClient spec={spec} />;
}
