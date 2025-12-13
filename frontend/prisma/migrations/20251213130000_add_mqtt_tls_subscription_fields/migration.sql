-- Add TLS/Security fields to MqttConfig
ALTER TABLE "MqttConfig" ADD COLUMN "tlsEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MqttConfig" ADD COLUMN "tlsInsecure" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MqttConfig" ADD COLUMN "caCertPath" TEXT;
ALTER TABLE "MqttConfig" ADD COLUMN "clientCertPath" TEXT;
ALTER TABLE "MqttConfig" ADD COLUMN "clientKeyPath" TEXT;

-- Add Subscription fields to MqttConfig
ALTER TABLE "MqttConfig" ADD COLUMN "subscribeEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MqttConfig" ADD COLUMN "subscribeTopicPattern" TEXT NOT NULL DEFAULT 'bacnet/override/#';
ALTER TABLE "MqttConfig" ADD COLUMN "subscribeQos" INTEGER NOT NULL DEFAULT 1;
