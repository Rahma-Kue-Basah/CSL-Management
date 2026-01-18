import { useCallback, useEffect, useState } from "react";
import {
  API_AUTH_RESEND_VERIFICATION,
  API_AUTH_VERIFY_EMAIL,
} from "@/constants/api";

export function useEmailVerification({ key, email, onVerified }) {
  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [resendStatus, setResendStatus] = useState("idle"); // idle, sending, sent, error

  useEffect(() => {
    const verifyEmail = async () => {
      if (!key) {
        setStatus("error");
        return;
      }

      const decodedKey = decodeURIComponent(key);

      try {
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
        } else {
          setStatus("error");
        }
      } catch (error) {
        setStatus("error");
        console.error("Verification error:", error);
      }
    };

    verifyEmail();
  }, [key, onVerified]);

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
