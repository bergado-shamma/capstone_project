/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // update collection data
  unmarshal({
    "authAlert": {
      "emailTemplate": {
        "body": "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Security Alert - {APP_NAME}</title>\n    <style>\n        /* General Body Styles */\n        body {\n            font-family: 'Montserrat', 'Inter', sans-serif;\n            line-height: 1.6;\n            color: #ffffff;\n            margin: 0;\n            padding: 0;\n            background-color: #f8f9fa;\n        }\n        /* Container for the email content */\n        .email-container {\n            max-width: 600px;\n            margin: 20px auto;\n            background-color: #ffffff;\n            border-radius: 12px;\n            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);\n            overflow: hidden;\n            border: 1px solid #e0e0e0;\n        }\n        /* Header Section - Very Dark Maroon */\n        .header {\n            background-color: #1A0000; /* Very Dark Maroon */\n            color: #ffffff;\n            padding: 30px 25px;\n            text-align: center;\n            font-size: 28px;\n            font-weight: 800;\n            letter-spacing: 1px;\n            border-bottom: 3px solid #ffffff; /* White line below the header */\n            line-height: 1.2;\n        }\n        /* Content Body Section - Dark Maroon */\n        .content-body {\n            background-color: #400000; /* Dark Maroon */\n            color: #ffffff;\n            padding: 30px 25px;\n        }\n        /* Paragraph styles */\n        p {\n            margin-bottom: 15px;\n            font-size: 16px;\n            color: #ffffff;\n        }\n        /* Call to Action for Security */\n        .security-action {\n            display: inline-block;\n            padding: 15px 30px;\n            background-color: #FFC107; /* Bright yellow/orange for alert */\n            color: #333333 !important; /* Dark text for contrast */\n            text-decoration: none;\n            border-radius: 8px;\n            font-size: 18px;\n            font-weight: bold;\n            transition: background-color 0.3s ease;\n            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);\n        }\n        .security-action:hover {\n            background-color: #e0a800; /* Darker yellow on hover */\n        }\n        /* Footer Section */\n        .footer {\n            background-color: #f2f2f2;\n            color: #777777;\n            padding: 20px 25px;\n            font-size: 13px;\n            text-align: center;\n            border-top: 1px solid #e0e0e0;\n            border-bottom-left-radius: 12px;\n            border-bottom-right-radius: 12px;\n        }\n        .footer p {\n            margin: 5px 0;\n            color: #777777;\n        }\n    </style>\n</head>\n<body>\n    <div class=\"email-container\">\n        <div class=\"header\">\n            {APP_NAME}\n        </div>\n        <div class=\"content-body\">\n            <p>Dear PUPTian,</p>\n            <p>This is an important security alert regarding your {APP_NAME} account.</p>\n            <p>We detected a recent login to your account from a new device or location. If this was you, you can disregard this email. </p>\n            <p><strong>If this was NOT you, or if you believe your account may be compromised, please take immediate action:</strong></p>\n            <div style=\"text-align: center; margin-top: 35px; margin-bottom: 35px;\">\n                <a class=\"security-action\" href=\"{APP_URL}/_/#/auth/change-password\" target=\"_blank\" rel=\"noopener\">Change Your Password Immediately</a>\n            </div>\n            <p>We recommend reviewing your account activity and changing your password to secure your account.</p>\n            <p>For your security, if you have not already enabled it, we highly recommend setting up Two-Factor Authentication (2FA) for an added layer of protection.</p>\n            <p>Sincerely,</p>\n            <p>The {APP_NAME} Security Team</p>\n        </div>\n        <div class=\"footer\">\n            <p>&copy; 2025 {APP_NAME}. All rights reserved.</p>\n            <p>This is an automated email; please do not reply directly.</p>\n        </div>\n    </div>\n</body>\n</html>"
      }
    }
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // update collection data
  unmarshal({
    "authAlert": {
      "emailTemplate": {
        "body": "<p>Hello,</p>\n<p>We noticed a login to your {APP_NAME} account from a new location.</p>\n<p>If this was you, you may disregard this email.</p>\n<p><strong>If this wasn't you, you should immediately change your {APP_NAME} account password to revoke access from all other locations.</strong></p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>"
      }
    }
  }, collection)

  return app.save(collection)
})
