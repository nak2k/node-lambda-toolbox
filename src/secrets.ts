import { SecretsManager } from 'aws-sdk';

export interface DatabaseSecret {
  dbClusterIdentifier: string;
  password: string;
  engine: string;
  port: number;
  host: string;
  username: string;
}

export interface GetDatabaseSecretOptions {
  secretId?: string;
}

export async function getDatabaseSecret(options: GetDatabaseSecretOptions): Promise<DatabaseSecret> {
  const {
    secretId = process.env.DATABASE_SECRET_ARN,
  } = options;

  if (!secretId) {
    throw new Error('The secretId option must be specified');
  }

  const secretsManager = new SecretsManager();

  return secretsManager.getSecretValue({
    SecretId: secretId,
  }).promise().then(data => {
    if (!data.SecretString) {
      throw new Error('Invalid database secret');
    }

    return JSON.parse(data.SecretString);
  });
}
