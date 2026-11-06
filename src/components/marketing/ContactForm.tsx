"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { sendContactMessageAction } from "@/app/actions/contact";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const data = new FormData(formEl);
    startTransition(async () => {
      const result = await sendContactMessageAction({
        name: String(data.get("name") ?? ""),
        email: String(data.get("email") ?? ""),
        subject: String(data.get("subject") ?? ""),
        message: String(data.get("message") ?? ""),
        website: String(data.get("website") ?? ""),
      });
      if (result.success) {
        setStatus("sent");
        formEl.reset();
      } else {
        setStatus("error");
        setError(result.message ?? "Something went wrong. Please try again.");
      }
    });
  };

  if (status === "sent") {
    return (
      <div className="rounded-xl p-8 flex flex-col items-start gap-3" style={{ backgroundColor: "#f5f1ee" }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#5fa8a0" }}>
          <Check size={18} className="text-white" />
        </div>
        <p className="text-base font-semibold text-gray-900">Message sent</p>
        <p className="text-sm text-gray-500">Thanks for getting in touch. We&apos;ll reply to your email soon.</p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="text-sm text-gray-500 underline underline-offset-4 hover:text-gray-900"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium text-gray-900">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Your name"
            className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#5fa8a0]/20 focus:border-[#5fa8a0] transition-all placeholder:text-gray-400"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-gray-900">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@company.com"
            className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#5fa8a0]/20 focus:border-[#5fa8a0] transition-all placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="subject" className="text-sm font-medium text-gray-900">
          Subject
        </label>
        <select
          id="subject"
          name="subject"
          className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#5fa8a0]/20 focus:border-[#5fa8a0] transition-all text-gray-700"
        >
          <option value="Getting started">Getting started</option>
          <option value="Selling on the marketplace">Selling on the marketplace</option>
          <option value="Billing">Billing</option>
          <option value="General question">General question</option>
          <option value="Partnership">Partnership</option>
          <option value="Technical support">Technical support</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="message" className="text-sm font-medium text-gray-900">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder="Tell us about your business and what you need..."
          className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#5fa8a0]/20 focus:border-[#5fa8a0] transition-all placeholder:text-gray-400 resize-none"
        />
      </div>

      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

      {status === "error" && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full text-sm font-semibold text-white rounded-full px-6 py-3 transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ backgroundColor: "#5fa8a0" }}
      >
        {isPending ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}
