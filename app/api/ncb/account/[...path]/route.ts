import { createNcbAccountProxy } from '@nocodebackend/account-react/server';

const proxy = createNcbAccountProxy({
  instance: process.env.NCB_INSTANCE!,
  secretKey: process.env.NCB_SECRET_KEY!,
  appUrl: process.env.NCB_APP_URL,
  authApiUrl: process.env.NCB_AUTH_API_URL,
});

type Context = { params: Promise<{ path: string[] }> };

async function handle(request: Request, context: Context) {
  return proxy(request, (await context.params).path);
}

export const GET = handle;
export const POST = handle;
