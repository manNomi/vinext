"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LinkAccordion } from "../../components/link-accordion";

export function LeafContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  return (
    <>
      <h1 data-testid="pathname">{pathname}</h1>
      <span data-testid="search" data-value={search}>
        {search}
      </span>
      <p data-testid="leaf-bfcache-id">{router.bfcacheId}</p>
      <form key={router.bfcacheId}>
        <input data-testid="leaf-input" defaultValue="" />
      </form>
      <LinkAccordion href={`${pathname}?q=2`}>same page (?q=2)</LinkAccordion>
      <LinkAccordion href={`${pathname}#section`}>same page (#section)</LinkAccordion>
      <button data-testid="refresh" onClick={() => router.refresh()} type="button">
        refresh
      </button>
    </>
  );
}
