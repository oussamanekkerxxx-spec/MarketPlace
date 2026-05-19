'use client';

import { useEffect } from 'react';

export function BuildInfo() {
  const buildSha = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'dev';
  const buildTime = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA
    ? new Date().toISOString().slice(0, 10)
    : 'local';

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log(`[Build] ${buildSha} | ${buildTime}`);
  }, [buildSha, buildTime]);

  return (
    <div className="text-[10px] text-gray-400 px-4 py-1 text-right select-none" aria-hidden="true">
      build {buildSha} · {buildTime}
    </div>
  );
}
