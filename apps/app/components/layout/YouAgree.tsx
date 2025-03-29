import React from "react";
import Link from "next/link";

export function YouAgree() {
  return (
    <div className="w-full text-center py-2">
      <p className="text-xs text-muted-foreground">
        by messaging webs, you agree to our{' '}
        <Link href="/terms" className="underline text-muted-foreground hover:text-foreground transition-colors">terms</Link>{' '}
        and{' '}
        <Link href="/privacy" className="underline text-muted-foreground hover:text-foreground transition-colors">privacy policy</Link>
      </p>
    </div>
  );
}
