import { useCallback, useEffect, useRef, useState } from "react";
import {
  API_AUTH_EMAIL_STATUS,
  API_AUTH_RESEND_VERIFICATION,
  API_AUTH_VERIFY_EMAIL,
} from "@/constants/api";

export function useEmailVerification({ key, email, onVerified }) {
  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [resendStatus, setResendStatus] = useState("idle"); // idle, sending, sent, error
  const hasVerifiedRef = useRef(false);

  useEffect(() => {
    const verifyEmail = async () => {
      if (!key) {
        setStatus("error");
        return;
      }

      if (hasVerifiedRef.current) {
        return;
      }
      hasVerifiedRef.current = true;

      const decodedKey = decodeURIComponent(key);
      const normalizedEmail = (email || "").trim();

      try {
        if (normalizedEmail) {
          try {
            const statusResponse = await fetch(API_AUTH_EMAIL_STATUS, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ email: normalizedEmail }),
            });

            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              if (statusData?.verified) {
                setStatus("success");
                if (onVerified) {
                  onVerified();
                }
                return;
              }
            }
          } catch (statusError) {
            // Fall back to direct verification when status check fails.
          }
        }

        const response = await fetch(API_AUTH_VERIFY_EMAIL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ key: decodedKey }),
        });

        if (response.ok) {
          setStatus("success");
          if (onVerified) {
            onVerified();
          }
          return;
        }

        let detail = "";
        try {
          const data = await response.json();
          detail = typeof data?.detail === "string" ? data.detail : "";
        } catch (parseError) {
          detail = "";
        }

        if (
          response.status === 400 &&
          detail.toLowerCase().includes("already") &&
          detail.toLowerCase().includes("verified")
        ) {
          setStatus("success");
          if (onVerified) {
            onVerified();
          }
          return;
        }

        setStatus("error");
      } catch (error) {
        setStatus("error");
        console.error("Verification error:", error);
      }
    };

    verifyEmail();
  }, [key, email, onVerified]);

  const resendVerification = useCallback(async () => {
    if (!email) {
      setResendStatus("error");
      return;
    }

    setResendStatus("sending");

    try {
      const response = await fetch(API_AUTH_RESEND_VERIFICATION, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setResendStatus("sent");
      } else {
        setResendStatus("error");
      }
    } catch (error) {
      setResendStatus("error");
      console.error("Resend verification error:", error);
    }
  }, [email]);

  return { status, resendStatus, resendVerification };
}
