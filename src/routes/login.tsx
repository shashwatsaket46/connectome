import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Admin login — ConnectionMiner Experiment Hub" },
      {
        name: "description",
        content: "Log in to change which experiments are visible for every visitor.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError("Wrong password.");
        return;
      }
      navigate({ to: "/manage" });
    } catch {
      setError("Something went wrong — try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-6">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-primary">
        Admin
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Log in</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Logging in lets you hide or show an experiment for every visitor, not just this browser.
      </p>
      <form onSubmit={submit} className="mt-6 grid gap-3">
        <Input
          type="password"
          autoFocus
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          placeholder="Password"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button type="submit" disabled={busy || !password}>
          {busy ? "Checking…" : "Log in"}
        </Button>
      </form>
      <Link to="/manage" className="mt-4 text-xs text-muted-foreground hover:text-foreground">
        ← Back to manage
      </Link>
    </div>
  );
}
