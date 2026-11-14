
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ExternalLink, Link2 } from "lucide-react";
import api from "../api/axios";

function PublicPage() {
  const { slug } = useParams();

  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const response = await api.get(
          `/api/pages/public/${slug}`
        );

        setPage(response.data.data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
          "Unable to load this landing page."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug]);

  if (loading) {
    return <div className="ls-public-loading">Loading page...</div>;
  }

  if (error || !page) {
    return (
      <div className="ls-public-page">
        <h2>Page not found</h2>
        <p>{error || "This landing page does not exist."}</p>
        <a href="/">Go to LinkSlice</a>
      </div>
    );
  }

  return (
    <div className="ls-public-page">
      <div className="ls-public-card">

        <div className="ls-public-logo">
          <Link2 size={24} />
          <span>LinkSlice</span>
        </div>

        <h1>{page.title}</h1>

        {page.description && (
          <p className="ls-public-description">
            {page.description}
          </p>
        )}

        <div className="ls-public-links">
          {page.links.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ls-public-link"
            >
              {link.label}
              <ExternalLink size={17} />
            </a>
          ))}
        </div>

        <footer>Powered by LinkSlice</footer>
      </div>
    </div>
  );
}

export default PublicPage;
