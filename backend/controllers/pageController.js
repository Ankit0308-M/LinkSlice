
const Page = require("../models/Page");
const crypto = require("crypto");

const isValidHttpUrl = (value) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const getUserId = (req) => req.user?._id || req.user?.id;

exports.createPage = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { title, description = "", links = [] } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    if (!title?.trim()) {
      return res.status(400).json({ message: "Page title is required." });
    }

    if (!Array.isArray(links) || links.length === 0) {
      return res.status(400).json({
        message: "Add at least one destination link."
      });
    }

    if (links.length > 20) {
      return res.status(400).json({
        message: "A page can have at most 20 links."
      });
    }

    const cleanLinks = [];

    for (const item of links) {
      const label = String(item.label || "").trim();
      const url = String(item.url || "").trim();

      if (!label || !url || !isValidHttpUrl(url)) {
        return res.status(400).json({
          message: "Every link needs a label and a valid HTTP or HTTPS URL."
        });
      }

      cleanLinks.push({ label, url });
    }

    const slug = crypto.randomBytes(6).toString("hex");

    const page = await Page.create({
      user: userId,
      title: title.trim(),
      description: String(description).trim(),
      slug,
      links: cleanLinks
    });

    return res.status(201).json({
      message: "Landing page created successfully.",
      data: page
    });
  } catch (error) {
    console.error("Create page error:", error);
    return res.status(500).json({ message: "Unable to create page." });
  }
};

exports.getMyPages = async (req, res) => {
  try {
    const userId = getUserId(req);

    const pages = await Page.find({ user: userId })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: pages.length,
      data: pages
    });
  } catch (error) {
    console.error("Get pages error:", error);
    return res.status(500).json({ message: "Unable to fetch pages." });
  }
};


exports.getMyPage = async (req, res) => {
  try {
    const page = await Page.findOne({
      _id: req.params.id,
      user: getUserId(req)
    });

    if (!page) {
      return res.status(404).json({ message: "Page not found." });
    }

    return res.status(200).json({ data: page });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch page." });
  }
};

exports.updatePage = async (req, res) => {
  try {
    const { title, description = "", links } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ message: "Page title is required." });
    }

    if (!Array.isArray(links) || links.length === 0 || links.length > 20) {
      return res.status(400).json({
        message: "Provide between 1 and 20 links."
      });
    }

    const cleanLinks = [];

    for (const item of links) {
      const label = String(item.label || "").trim();
      const url = String(item.url || "").trim();

      if (!label || !url || !isValidHttpUrl(url)) {
        return res.status(400).json({
          message: "Every link needs a label and a valid HTTP or HTTPS URL."
        });
      }

      cleanLinks.push({ label, url });
    }

    const page = await Page.findOneAndUpdate(
      {
        _id: req.params.id,
        user: getUserId(req)
      },
      {
        title: title.trim(),
        description: String(description).trim(),
        links: cleanLinks
      },
      { new: true, runValidators: true }
    );

    if (!page) {
      return res.status(404).json({ message: "Page not found." });
    }

    return res.status(200).json({
      message: "Page updated successfully.",
      data: page
    });
  } catch (error) {
    console.error("Update page error:", error);
    return res.status(500).json({ message: "Unable to update page." });
  }
};

exports.deletePage = async (req, res) => {
  try {
    const page = await Page.findOneAndDelete({
      _id: req.params.id,
      user: getUserId(req)
    });

    if (!page) {
      return res.status(404).json({ message: "Page not found." });
    }

    return res.status(200).json({
      message: "Landing page deleted successfully."
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to delete page." });
  }
};

exports.getPublicPage = async (req, res) => {
  try {
    const page = await Page.findOne({ slug: req.params.slug })
      .select("title description slug links createdAt");

    if (!page) {
      return res.status(404).json({ message: "Landing page not found." });
    }

    return res.status(200).json({ data: page });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load landing page." });
  }
};
