// Make sure this file is saved as: pb_hooks/main.pb.js

/// <reference path="../pb_data/types.d.ts" />

// Alternative hook registration (if export default doesn't work)
routerAdd("POST", "/api/send-announcement", async (c) => {
  try {
    const body = await c.req.json();
    const subject = body.subject || "New Announcement";
    const content = body.content || "No content.";

    console.log("🔍 Starting announcement send process...");
    console.log("📝 Subject:", subject);
    console.log("📝 Content length:", content.length);

    // Fetch all users with role = "student"
    console.log("🔍 Searching for students...");
    const students = await $app
      .dao()
      .findRecordsByFilter("users", 'role = "student"');

    console.log("👥 Found", students.length, "students");

    const toEmails = students
      .map((user) => user.email)
      .filter((email) => email && email.trim() !== "");

    if (toEmails.length === 0) {
      console.log("❌ No student emails found");
      return c.json({ success: false, error: "No student emails found." }, 400);
    }

    // Check if template file exists, if not use simple HTML
    let htmlBody = `
      <html>
        <body>
          <h2>${subject}</h2>
          <div>${content}</div>
        </body>
      </html>
    `;

    try {
      const tpl = $app.newTemplateRegistry();
      const htmlContent = await tpl.loadFiles(
        `${__hooks}/views/announcement_template.html`
      );
      htmlBody = htmlContent.render({
        Subject: subject,
        Content: content,
      });
    } catch (templateErr) {
      console.log("⚠️ Template not found, using default HTML");
    }

    // Create the email message
    const message = {
      from: $app.settings().meta.senderAddress,
      to: toEmails,
      subject: subject,
      html: htmlBody,
    };

    // Send the email
    await $app.newMailClient().send(message);

    console.log("✅ Email sent to", toEmails.length, "students");
    return c.json({
      success: true,
      sentTo: toEmails.length,
      recipients: toEmails,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.log("❌ Error sending announcement:", err.message);
    return c.json({ success: false, error: err.message }, 500);
  }
});

// A quick hello
