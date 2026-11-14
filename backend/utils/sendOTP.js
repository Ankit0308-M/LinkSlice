const sendOTPEmail = async (email, otp) => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME;

  if (!apiKey || !senderEmail || !senderName) {
    throw new Error("Brevo configuration is incomplete");
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <body style="
        margin: 0;
        padding: 30px;
        font-family: Arial, sans-serif;
        background-color: #f4f5fb;
      ">

        <div style="
          max-width: 500px;
          margin: auto;
          background: white;
          padding: 35px;
          border-radius: 12px;
          text-align: center;
        ">

          <h1 style="color: #635bdb;">
            LinkShort
          </h1>

          <h2>Email Verification</h2>

          <p style="color: #555;">
            Use the following OTP to verify your email address.
          </p>

          <div style="
            font-size: 34px;
            font-weight: bold;
            letter-spacing: 10px;
            color: #635bdb;
            padding: 20px;
            background: #f0efff;
            border-radius: 8px;
          ">
            ${otp}
          </div>

          <p style="color: #777;">
            This OTP is valid for 5 minutes.
          </p>

          <p style="font-size: 12px; color: #999;">
            Do not share this OTP with anyone.
          </p>

        </div>
      </body>
    </html>
  `;

  const response = await fetch(
    "https://api.brevo.com/v3/smtp/email",
    {
      method: "POST",

      headers: {
        "accept": "application/json",
        "api-key": apiKey,
        "content-type": "application/json"
      },

      body: JSON.stringify({
        sender: {
          name: senderName,
          email: senderEmail
        },

        to: [
          {
            email: email
          }
        ],

        subject: "Your LinkShort Verification OTP",

        htmlContent: htmlContent,

        textContent: `Your LinkShort verification OTP is ${otp}. It expires in 5 minutes. Do not share it with anyone.`
      })
    }
  );

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error("Brevo API error:", result);

    throw new Error(
      result.message || "Unable to send OTP email"
    );
  }

  console.log("OTP email accepted by Brevo");

  return result;
};

module.exports = sendOTPEmail;