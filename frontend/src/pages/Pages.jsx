
import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  Copy,
  ExternalLink,
  RefreshCw,
  PanelsTopLeft,
  X
} from "lucide-react";

import api from "../api/axios";

const emptyForm = {
  title: "",
  description: "",
  links: [{ label: "", url: "" }]
};

function Pages() {
  const [pages, setPages] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchPages = async () => {
    try {
      setError("");
      const response = await api.get("/api/pages");

      const pageData =
        response.data.data || response.data.pages || [];

      setPages(Array.isArray(pageData) ? pageData : []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load pages."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value
    }));
  };

  const updateLink = (index, field, value) => {
    setForm((previous) => ({
      ...previous,
      links: previous.links.map((link, i) =>
        i === index ? { ...link, [field]: value } : link
      )
    }));
  };

  const addLink = () => {
    if (form.links.length >= 20) return;

    setForm((previous) => ({
      ...previous,
      links: [...previous.links, { label: "", url: "" }]
    }));
  };

  const removeLink = (index) => {
    setForm((previous) => ({
      ...previous,
      links: previous.links.filter((_, i) => i !== index)
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      setSaving(true);

      if (editingId) {
        await api.put(`/api/pages/${editingId}`, form);
        setSuccess("Landing page updated successfully.");
      } else {
        await api.post("/api/pages", form);
        setSuccess("Landing page created successfully.");
      }

      resetForm();
      await fetchPages();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to save landing page."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (page) => {
    setEditingId(page._id);

    setForm({
      title: page.title || "",
      description: page.description || "",
      links: page.links?.length
        ? page.links.map((link) => ({
            label: link.label,
            url: link.url
          }))
        : [{ label: "", url: "" }]
    });

    setError("");
    setSuccess("");

    document.getElementById("page-editor")?.scrollIntoView({
      behavior: "smooth"
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this page?")) {
      return;
    }

    try {
      setError("");
      await api.delete(`/api/pages/${id}`);
      setSuccess("Landing page deleted successfully.");

      if (editingId === id) resetForm();

      await fetchPages();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to delete page."
      );
    }
  };

  const getPublicUrl = (slug) =>
    `${window.location.origin}/p/${slug}`;

  const copyPageUrl = async (slug) => {
    try {
      await navigator.clipboard.writeText(getPublicUrl(slug));
      setSuccess("Public page URL copied.");
    } catch {
      setError("Unable to copy the page URL.");
    }
  };

  if (loading) {
    return (
      <div className="ls-card">
        <p>Loading your landing pages...</p>
      </div>
    );
  }

  return (
    <div className="ls-pages-container">

      {error && <div className="ls-alert ls-error">{error}</div>}
      {success && <div className="ls-alert ls-success">{success}</div>}

      {/* PAGE EDITOR */}

      <section className="ls-card" id="page-editor">

        <div className="ls-card-heading">
          <div>
            <h2>{editingId ? "Edit landing page" : "Create a landing page"}</h2>
            <p>
              Create one page to share all your important links.
            </p>
          </div>

          {editingId && (
            <button className="ls-icon-button" onClick={resetForm}>
              <X size={18} />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="ls-page-form">

          <label>Page title</label>
          <input
            type="text"
            placeholder="My personal links"
            value={form.title}
            maxLength={80}
            onChange={(e) => updateField("title", e.target.value)}
            required
          />

          <label>Description</label>
          <textarea
            placeholder="A little introduction about this page..."
            value={form.description}
            maxLength={300}
            rows={3}
            onChange={(e) => updateField("description", e.target.value)}
          />

          <div className="ls-card-heading">
            <div>
              <h3>Destination links</h3>
              <p>Add up to 20 links to your page.</p>
            </div>

            <button
              type="button"
              className="ls-theme-button"
              onClick={addLink}
              disabled={form.links.length >= 20}
            >
              <Plus size={16} /> Add link
            </button>
          </div>

          {form.links.map((link, index) => (
            <div className="ls-page-link-row" key={index}>

              <input
                type="text"
                placeholder="Link label (e.g. GitHub)"
                value={link.label}
                maxLength={60}
                onChange={(e) =>
                  updateLink(index, "label", e.target.value)
                }
                required
              />

              <input
                type="url"
                placeholder="https://example.com"
                value={link.url}
                onChange={(e) =>
                  updateLink(index, "url", e.target.value)
                }
                required
              />

              {form.links.length > 1 && (
                <button
                  type="button"
                  className="ls-icon-button ls-delete"
                  onClick={() => removeLink(index)}
                  title="Remove link"
                >
                  <Trash2 size={16} />
                </button>
              )}

            </div>
          ))}

          <button
            className="ls-create-button"
            type="submit"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : editingId
                ? "Update page"
                : "Create page"}
            <Plus size={17} />
          </button>

        </form>
      </section>

      {/* SAVED PAGES */}

      <section className="ls-card ls-history">

        <div className="ls-card-heading">
          <div>
            <h2>Your landing pages</h2>
            <p>{pages.length} saved page(s)</p>
          </div>

          <button
            className="ls-icon-button"
            onClick={fetchPages}
            title="Refresh pages"
          >
            <RefreshCw size={17} />
          </button>
        </div>

        {pages.length === 0 ? (
          <div className="ls-empty">
            <PanelsTopLeft size={35} />
            <h3>No landing pages yet</h3>
            <p>Create your first page using the form above.</p>
          </div>
        ) : (
          <div className="ls-pages-grid">

            {pages.map((page) => (
              <div className="ls-card ls-page-card" key={page._id}>

                <div className="ls-page-card-icon">
                  <PanelsTopLeft size={22} />
                </div>

                <h3>{page.title}</h3>
                <p>{page.description || "No description added."}</p>

                <span className="ls-page-link-count">
                  {page.links?.length || 0} destination link(s)
                </span>

                <div className="ls-page-public-url">
                  <span>{getPublicUrl(page.slug)}</span>
                </div>

                <div className="ls-page-actions">

                  <button
                    className="ls-theme-button"
                    onClick={() => copyPageUrl(page.slug)}
                  >
                    <Copy size={15} /> Copy URL
                  </button>

                  <button
                    className="ls-icon-button"
                    onClick={() => handleEdit(page)}
                    title="Edit page"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    className="ls-icon-button ls-delete"
                    onClick={() => handleDelete(page._id)}
                    title="Delete page"
                  >
                    <Trash2 size={16} />
                  </button>

                </div>

              </div>
            ))}

          </div>
        )}

      </section>

    </div>
  );
}

export default Pages;
