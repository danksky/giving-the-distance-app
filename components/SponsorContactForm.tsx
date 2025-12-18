"use client";

import { useState } from "react";

export default function SponsorContactForm() {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch("/api/sponsor-interest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone, email }),
      });

      if (response.ok) {
        setSubmitStatus("success");
        setPhone("");
        setEmail("");
      } else {
        setSubmitStatus("error");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {/* Phone Number */}
      <div>
        <label
          htmlFor="phone"
          className="block text-lg font-semibold text-[#171717] mb-2"
        >
          Phone Number
        </label>
        <input
          type="tel"
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          placeholder="(555) 123-4567"
          className="w-full px-4 py-3 border-2 border-[#e5e7eb] rounded-lg focus:ring-2 focus:ring-[#B56DFF] focus:border-transparent outline-none transition-all text-lg"
        />
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="block text-base font-medium text-[#374151] mb-2"
        >
          Email (optional)
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@yourbusiness.com"
          className="w-full px-4 py-3 border border-[#e5e7eb] rounded-lg focus:ring-2 focus:ring-[#B56DFF] focus:border-transparent outline-none transition-all"
        />
      </div>

      {/* Success Message */}
      {submitStatus === "success" && (
        <div className="alert alert-success">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span>Thanks! We&apos;ll be in touch soon.</span>
        </div>
      )}

      {/* Error Message */}
      {submitStatus === "error" && (
        <div className="alert alert-error">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          <span>Something went wrong. Please try again.</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn btn-primary btn-lg w-full"
      >
        {isSubmitting ? "Sending..." : "Get in touch →"}
      </button>
    </form>
  );
}
