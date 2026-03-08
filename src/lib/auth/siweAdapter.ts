import { createAuthenticationAdapter } from "@rainbow-me/rainbowkit";
import { SiweMessage } from "siwe";

export const siweAdapter = createAuthenticationAdapter({
  getNonce: async () => {
    const res = await fetch("/api/auth/nonce");
    if (!res.ok) throw new Error("Failed to get nonce");
    const json = await res.json();
    return json.nonce;
  },

  createMessage: ({ nonce, address, chainId }) => {
    return new SiweMessage({
      domain: window.location.host,
      address,
      statement: "Sign in to LiquidArk",
      uri: window.location.origin,
      version: "1",
      chainId,
      nonce,
    }).prepareMessage();
  },

  verify: async ({ message, signature }) => {
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, signature }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  signOut: async () => {
    await fetch("/api/auth/logout", { method: "POST" });
  },
});
