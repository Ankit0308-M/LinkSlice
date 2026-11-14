
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MailCheck } from "lucide-react";
import api from "../api/axios";

function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();

  const email =
    location.state?.email ||
    sessionStorage.getItem("pendingEmail") ||
    "";

  const purpose =
    location.state?.purpose ||
    sessionStorage.getItem("otpPurpose") ||
    "register";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!/^\d{6}$/.test(otp)) {
      setError("Please enter a valid six-digit OTP.");
      return;
    }

    if (!email) {
      setError("Email not found. Please start again.");
      return;
    }

    try {
      setLoading(true);

      const endpoint =
        purpose === "login"
          ? "/api/auth/verify-login"
          : "/api/auth/verify-register";

      await api.post(endpoint, {
        email,
        otp
      });

      sessionStorage.removeItem("pendingEmail");
      sessionStorage.removeItem("otpPurpose");

      if (purpose === "login") {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/login", {
          replace: true,
          state: {
            message: "Email verified successfully. You can now login."
          }
        });
      }

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "OTP verification failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <MailCheck size={42} className="brand-icon" />

        <h1>Verify your email</h1>

        <p className="subtitle">
          Enter the six-digit OTP sent to
        </p>

        <p className="email-highlight">{email}</p>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label>Verification code</label>

          <input
            className="otp-input"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            maxLength={6}
            value={otp}
            onChange={(e) =>
              setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            required
          />

          <button
            className="primary-btn"
            type="submit"
            disabled={loading}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        <p className="auth-footer">
          <Link to={purpose === "login" ? "/login" : "/register"}>
            Back
          </Link>
        </p>
      </div>
    </div>
  );
}

export default VerifyOTP;
