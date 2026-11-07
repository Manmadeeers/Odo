import 'dotenv/config';
import { DataSource } from 'typeorm';
import { environmentSchema } from '../config/environment.schema.js';
import { createDatabaseOptions } from './database.config.js';

const environment = environmentSchema.parse(process.env);

export default new DataSource(createDatabaseOptions(environment.DATABASE_URL));
