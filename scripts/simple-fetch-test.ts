#!/usr/bin/env tsx

import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing basic fetch to Supabase...');
console.log('URL:', supabaseUrl);

async function testFetch() {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseAnonKey!,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    const text = await response.text();
    console.log('Response body:', text);
  } catch (error: any) {
    console.error('Error:', error);
    console.error('Error code:', error.code);
    console.error('Error cause:', error.cause);
  }
}

testFetch();
