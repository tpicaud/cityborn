'use client';

import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import { useEffect, useState } from 'react';

export default function ApiDocsPage() {
  const [swaggerSpec, setSwaggerSpec] = useState(null);

  useEffect(() => {
    const fetchSwaggerSpec = async () => {
      const response = await fetch('/api/docs');
      const data = await response.json();
      setSwaggerSpec(data);
    };

    fetchSwaggerSpec();
  }, []);

  if (!swaggerSpec) return <p>Chargement de la documentation...</p>;

  return <SwaggerUI spec={swaggerSpec} />;
}
