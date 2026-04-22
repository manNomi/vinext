/**
 * Next.js compat: app-dir/errors — string thrown during server component rendering
 * Source: https://github.com/vercel/next.js/blob/canary/test/e2e/app-dir/errors/app/server-component/throw-string/page.js
 */
export default function Page() {
  // oxlint-disable-next-line no-throw-literal -- intentional fixture parity with Next.js throw-string case
  throw "this is a test";
}
