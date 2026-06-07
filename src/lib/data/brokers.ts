// src/lib/data/brokers.ts
import fs from 'fs';
import path from 'path';
import type { BrokerJSON } from '@/types/broker';

const brokersDirectory = path.join(process.cwd(), 'data/brokers');

export async function getAllBrokers(): Promise<BrokerJSON[]> {
  if (!fs.existsSync(brokersDirectory)) return [];

  const fileNames = fs.readdirSync(brokersDirectory);

  const brokers = fileNames
    .filter(fileName => fileName.endsWith('.json'))
    .map(fileName => {
      const fullPath = path.join(brokersDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      try {
        if (!fileContents.trim()) return null;
        return JSON.parse(fileContents) as BrokerJSON;
      } catch (error) {
        console.error(`🚨 Ошибка JSON в ${fileName}:`, error);
        return null;
      }
    })
    .filter((broker): broker is BrokerJSON => broker !== null);

  return brokers;
}