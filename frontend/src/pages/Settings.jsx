
import { useState } from "react";
import {
  User,
  Mail,
  ShieldCheck,
  Sun,
  Moon,
  Save,
  LogOut
} from "lucide-react";

import api from "../api/axios";
import { useTheme } from "../context/ThemeContext";

function SettingsPage({ user, onProfileUpdated, onLogout }) {
  const { theme, toggleTheme } = useTheme();

  const [name, setName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleUpdate = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const trimmedName = name.trim();

    if (trimmedName.length < 2 || trimmedName.length > 50) {
      setError("Name must contain 2 to 50 characters.");
      return;
    }

    try {
      setSaving(true);

      const response = await api.patch("/api/auth/profile", {
        name: trimmedName
      });

      const updatedUser =
        response.data.user ||
        response.data.data?.user ||
        response.data.data;

      if (updatedUser) {
        onProfileUpdated?.(updatedUser);
        setName(updatedUser.name || trimmedName);
      } else {
        setName(trimmedName);
      }

      setSuccess("Profile updated successfully!");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to update your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ls-settings">

      {/* PROFILE */}

      <section className="ls-card ls-settings-card">
        <div className="ls-settings-heading">
          <div className="ls-settings-icon">
            <User size={21} />
          </div>

          <div>
            <h2>Profile information</h2>
            <p>Manage your personal account details.</p>
          </div>
        </div>

        {error && (
          <div className="ls-alert ls-error">{error}</div>
        )}

        {success && (
          <div className="ls-alert ls-success">{success}</div>
        )}

        <form onSubmit={handleUpdate}>
          <label className="ls-field-label">Full name</label>

          <input
            className="ls-settings-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            minLength={2}
            maxLength={50}
            required
          />

          <label className="ls-field-label">Email address</label>

          <div className="ls-readonly-field">
            <Mail size={17} />
            <span>{user?.email || "Email unavailable"}</span>
            <span className="ls-readonly-tag">Read only</span>
          </div>

          <button
            type="submit"
            className="ls-create-button"
            disabled={saving || name.trim() === user?.name}
          >
            <Save size={17} />
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>
      </section>

      {/* APPEARANCE */}

      <section className="ls-card ls-settings-card">
        <div className="ls-settings-heading">
          <div className="ls-settings-icon">
            {theme === "light" ? <Sun size={21} /> : <Moon size={21} />}
          </div>

          <div>
            <h2>Appearance</h2>
            <p>Choose how LinkSlice looks on your device.</p>
          </div>
        </div>

        <div className="ls-setting-row">
          <div>
            <strong>
              {theme === "light" ? "Day mode" : "Night mode"}
            </strong>
            <p>Switch between light and dark appearance.</p>
          </div>

          <button
            type="button"
            className="ls-theme-button"
            onClick={toggleTheme}
          >
            {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
            {theme === "light" ? "Night mode" : "Day mode"}
          </button>
        </div>
      </section>

      {/* SECURITY */}

      <section className="ls-card ls-settings-card">
        <div className="ls-settings-heading">
          <div className="ls-settings-icon">
            <ShieldCheck size={21} />
          </div>

          <div>
            <h2>Account security</h2>
            <p>Your account verification information.</p>
          </div>
        </div>

        <div className="ls-setting-row">
          <div>
            <strong>Email verification</strong>
            <p>
              {user?.isVerified
                ? "Your email address has been verified."
                : "Your email address is not verified."}
            </p>
          </div>

          <span className={`ls-status ${user?.isVerified ? "verified" : ""}`}>
            {user?.isVerified ? "Verified" : "Not verified"}
          </span>
        </div>

        <div className="ls-setting-row">
          <div>
            <strong>Password protection</strong>
            <p>Your password is stored securely as a hash.</p>
          </div>

          <ShieldCheck size={20} />
        </div>
      </section>

      {/* ACCOUNT ACTIONS */}

      <section className="ls-card ls-settings-card">
        <div className="ls-settings-heading">
          <div>
            <h2>Account actions</h2>
            <p>Sign out of your LinkSlice account.</p>
          </div>
        </div>

        <button
          type="button"
          className="ls-logout ls-settings-logout"
          onClick={onLogout}
        >
          <LogOut size={17} />
          Sign out
        </button>
      </section>

    </div>
  );
}

export default SettingsPage;
