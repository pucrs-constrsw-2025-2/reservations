import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import * as process from 'process';

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'reservations',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
  }),
  instrumentations: [getNodeAutoInstrumentations()],
  metricReader: new PrometheusExporter({
    port: 9091,
    endpoint: '/metrics',
  }),
});

sdk.start();
console.log('OpenTelemetry SDK started for reservations');

// Graceful shutdown
if (typeof process !== 'undefined' && process.on) {
  process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => console.log('OpenTelemetry terminated'))
      .catch((error) => console.log('Error terminating OpenTelemetry', error))
      .finally(() => {
        if (process.exit) {
          process.exit(0);
        }
      });
  });
}

