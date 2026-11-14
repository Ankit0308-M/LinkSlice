
const URL = require("../models/URL");
const crypto = require("crypto");
const mongoose = require("mongoose");
// GENERATE UNIQUE SHORT ID

const generateShortId = () => {
  return crypto.randomBytes(6).toString("base64url");
};


// VALIDATE ORIGINAL URL



const isValidUrl = (value) => {
  try {
    const parsedUrl = new globalThis.URL(value);

    return (
      ["http:", "https:"].includes(parsedUrl.protocol) &&
      Boolean(parsedUrl.hostname)
    );
  } catch {
    return false;
  }
};



// CREATE SHORT URL


exports.createShortUrl = async (req, res) => {
  try {
    const { redirectUrl } = req.body;

    // Validate input
    if (
      typeof redirectUrl !== "string" ||
      !redirectUrl.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Original URL is required"
      });
    }

    const originalUrl = redirectUrl.trim();

    if (!isValidUrl(originalUrl)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid HTTP or HTTPS URL"
      });
    }

  
    let shortId;
    let savedUrl;

  
    for (let attempt = 0; attempt < 5; attempt++) {
      shortId = generateShortId();

      try {
        savedUrl = await URL.create({
          shortId,
          redirectUrl: originalUrl,
          createdBy: req.user._id,
          visitHistory: []
        });

        break;

      } catch (error) {
        if (error.code === 11000 && attempt < 4) {
          continue;
        }

        throw error;
      }
    }

    if (!savedUrl) {
      throw new Error("Could not generate a unique short URL");
    }

    const baseUrl = (
      process.env.BASE_URL || "http://localhost:5000"
    ).replace(/\/+$/, "");

    const shortUrl = `${baseUrl}/${savedUrl.shortId}`;

    return res.status(201).json({
      success: true,
      message: "Short URL created successfully",

      data: {
        id: savedUrl._id,
        shortId: savedUrl.shortId,
        originalUrl: savedUrl.redirectUrl,
        shortUrl,
        clickCount: 0,
        createdAt: savedUrl.createdAt
      }
    });

  } catch (error) {
    console.error("Create URL error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create short URL"
    });
  }
};



// REDIRECT SHORT URL


exports.redirectUrl = async (req, res) => {
  try {
    const { shortId } = req.params;

    if (!shortId) {
      return res.status(400).json({
        success: false,
        message: "Short ID is required"
      });
    }

    
    const url = await URL.findOneAndUpdate(
      { shortId },
      {
        $push: {
          visitHistory: {
            visitedAt: new Date()
          }
        }
      },
      {
        new: true
      }
    );

    if (!url) {
      return res.status(404).json({
        success: false,
        message: "Short URL not found"
      });
    }


    return res.redirect(302, url.redirectUrl);

  } catch (error) {
    console.error("Redirect error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to redirect"
    });
  }
};



// GET USER-SPECIFIC URL HISTORY


exports.getUserUrls = async (req, res) => {
  try {
    // Pagination
    const page = Math.max(
      1,
      parseInt(req.query.page, 10) || 1
    );

    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 10)
    );

    const skip = (page - 1) * limit;

    // Only fetch URLs belonging to logged-in user
    const [urls, totalUrls] = await Promise.all([
      URL.find({
        createdBy: req.user._id
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      URL.countDocuments({
        createdBy: req.user._id
      })
    ]);

    const baseUrl = (
      process.env.BASE_URL || "http://localhost:5000"
    ).replace(/\/+$/, "");

    const formattedUrls = urls.map((url) => ({
      id: url._id,
      shortId: url.shortId,
      originalUrl: url.redirectUrl,
      shortUrl: `${baseUrl}/${url.shortId}`,
      clickCount: url.visitHistory.length,
      visitHistory: url.visitHistory,
      createdAt: url.createdAt
    }));

    return res.status(200).json({
      success: true,
      message: "URL history fetched successfully",

      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUrls / limit),
        totalUrls,
        limit
      },

      data: formattedUrls
    });

  } catch (error) {
    console.error("Get URL history error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch URL history"
    });
  }
};


// =====================================
// DELETE USER URL
// =====================================

exports.deleteUrl = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ID
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid URL ID"
      });
    }

    // Delete only if URL belongs to logged-in user
    const deletedUrl = await URL.findOneAndDelete({
      _id: id,
      createdBy: req.user._id
    });

    if (!deletedUrl) {
      return res.status(404).json({
        success: false,
        message: "URL not found or you are not authorized to delete it"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Short URL deleted successfully"
    });

  } catch (error) {
    console.error("Delete URL error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete URL"
    });
  }
};



// GET USER DASHBOARD STATISTICS


// =====================================
// GET USER DASHBOARD STATISTICS
// =====================================

exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Today's date boundaries
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Aggregate all statistics in one database query
    const result = await URL.aggregate([
      {
        $match: {
          createdBy: new mongoose.Types.ObjectId(
            userId.toString()
          )
        }
      },
      {
        $project: {
          shortId: 1,
          redirectUrl: 1,
          createdAt: 1,

          clicks: {
            $size: {
              $ifNull: ["$visitHistory", []]
            }
          },

          createdToday: {
            $cond: [
              {
                $and: [
                  { $gte: ["$createdAt", today] },
                  { $lt: ["$createdAt", tomorrow] }
                ]
              },
              1,
              0
            ]
          }
        }
      },
      {
        $group: {
          _id: null,

          totalLinks: {
            $sum: 1
          },

          totalClicks: {
            $sum: "$clicks"
          },

          createdToday: {
            $sum: "$createdToday"
          },

          topLink: {
            $top: {
              sortBy: {
                clicks: -1,
                createdAt: -1
              },
              output: {
                shortId: "$shortId",
                redirectUrl: "$redirectUrl",
                clicks: "$clicks"
              }
            }
          }
        }
      }
    ]);

    const stats = result.length
      ? result[0]
      : {
          totalLinks: 0,
          totalClicks: 0,
          createdToday: 0,
          topLink: null
        };

    // Don't show a top link if there are no clicks
    if (stats.topLink && stats.topLink.clicks === 0) {
      stats.topLink = null;
    }

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalLinks: stats.totalLinks,
          totalClicks: stats.totalClicks,
          createdToday: stats.createdToday,
          topLink: stats.topLink
        }
      }
    });

  } catch (error) {
    console.error("Dashboard stats error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch dashboard statistics."
    });
  }
};



// =====================================
// GET ADVANCED USER ANALYTICS
// =====================================

exports.getAnalytics = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(
      req.user._id.toString()
    );

    // Accept only 7, 30 or 90 days
    const requestedDays = Number(req.query.days || 7);
    const allowedDays = [7, 30, 90];

    const days = allowedDays.includes(requestedDays)
      ? requestedDays
      : 7;

    // Use UTC date boundaries for consistent daily grouping
    const now = new Date();
    const endDate = new Date(now);
    const startDate = new Date(now);

    startDate.setUTCHours(0, 0, 0, 0);
    startDate.setUTCDate(startDate.getUTCDate() - (days - 1));

    const result = await URL.aggregate([
      {
        $match: {
          createdBy: userId
        }
      },
      {
        $facet: {
          // Summary for the selected period
          summary: [
            {
              $project: {
                totalVisits: {
                  $size: {
                    $filter: {
                      input: { $ifNull: ["$visitHistory", []] },
                      as: "visit",
                      cond: {
                        $and: [
                          { $gte: ["$$visit.visitedAt", startDate] },
                          { $lte: ["$$visit.visitedAt", endDate] }
                        ]
                      }
                    }
                  }
                },
                allTimeVisits: {
                  $size: {
                    $ifNull: ["$visitHistory", []]
                  }
                }
              }
            },
            {
              $group: {
                _id: null,
                totalLinks: { $sum: 1 },
                totalClicks: { $sum: "$totalVisits" },
                allTimeClicks: { $sum: "$allTimeVisits" }
              }
            }
          ],

          // Daily click activity
          dailyClicks: [
            { $unwind: "$visitHistory" },
            {
              $match: {
                "visitHistory.visitedAt": {
                  $gte: startDate,
                  $lte: endDate
                }
              }
            },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$visitHistory.visitedAt",
                    timezone: "UTC"
                  }
                },
                clicks: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ],

          // Top-performing links in selected period
          topLinks: [
            {
              $project: {
                shortId: 1,
                redirectUrl: 1,
                createdAt: 1,
                clicks: {
                  $size: {
                    $filter: {
                      input: { $ifNull: ["$visitHistory", []] },
                      as: "visit",
                      cond: {
                        $and: [
                          { $gte: ["$$visit.visitedAt", startDate] },
                          { $lte: ["$$visit.visitedAt", endDate] }
                        ]
                      }
                    }
                  }
                }
              }
            },
            { $match: { clicks: { $gt: 0 } } },
            { $sort: { clicks: -1, createdAt: -1 } },
            { $limit: 10 }
          ]
        }
      }
    ]);

    const analytics = result[0] || {};

    const summary = analytics.summary?.[0] || {
      totalLinks: 0,
      totalClicks: 0,
      allTimeClicks: 0
    };

   
    const dailyClicks = [];
    const clickMap = new Map(
      (analytics.dailyClicks || []).map((item) => [
        item._id,
        item.clicks
      ])
    );

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setUTCDate(date.getUTCDate() + i);

      const dateKey = date.toISOString().slice(0, 10);

      dailyClicks.push({
        date: dateKey,
        clicks: clickMap.get(dateKey) || 0
      });
    }

    const baseUrl = (
      process.env.BASE_URL || "http://localhost:5000"
    ).replace(/\/+$/, "");

    const topLinks = (analytics.topLinks || []).map((link) => ({
      shortId: link.shortId,
      shortUrl: `${baseUrl}/${link.shortId}`,
      originalUrl: link.redirectUrl,
      clicks: link.clicks,
      createdAt: link.createdAt
    }));

    return res.status(200).json({
      success: true,
      data: {
        period: {
          days,
          startDate,
          endDate
        },
        summary: {
          totalLinks: summary.totalLinks,
          totalClicks: summary.totalClicks,
          allTimeClicks: summary.allTimeClicks,
          averageClicksPerLink: summary.totalLinks
            ? Number(
                (summary.totalClicks / summary.totalLinks).toFixed(2)
              )
            : 0
        },
        dailyClicks,
        topLinks
      }
    });

  } catch (error) {
    console.error("Advanced analytics error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch analytics."
    });
  }
};
