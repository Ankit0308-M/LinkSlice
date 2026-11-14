
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Link2, ArrowRight } from "lucide-react";
import api from "../api/axios";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [message, setMessage] = useState(
    location.state?.message || ""
  );

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    try {
      setLoading(true);

      const response = await api.post(
        "/api/auth/login",
        form
      );

      const email = response.data.email;

      sessionStorage.setItem("pendingEmail", email);
      sessionStorage.setItem("otpPurpose", "login");

      navigate("/verify-otp", {
        state: {
          email,
          purpose: "login"
        }
      });

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link2 size={38} className="brand-icon" />

        <h1>Welcome back</h1>

        <p className="subtitle">
          Login to manage your shortened URLs.
        </p>

        {message && (
          <div className="success-box">{message}</div>
        )}

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label>Email address</label>

          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={handleChange}
            required
          />

          <label>Password</label>

          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={handleChange}
            required
          />

          <button
            type="submit"
            className="primary-btn"
            disabled={loading}
          >
            {loading ? "Please wait..." : "Login"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account?
          <Link to="/register"> Register</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
