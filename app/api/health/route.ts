import { NextResponse } from 'next/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      service: 'contextify-backend',
      timestamp: new Date().toISOString(),
      groqConfigured: Boolean(process.env.GROQ_API_KEY),
    },
    { status: 200, headers: corsHeaders }
  );
}
