export const htmlContent: string = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <title>Your HIP Physio Access</title>
      <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            padding: 20px 0;
            background-color: #3a7bd5;
            color: white;
            border-radius: 10px 10px 0 0;
        }
        .header h1 {
            margin: 0;
        }
        .content {
            padding: 20px;
            text-align: left;
        }
        .content h2 {
            color: #333333;
            text-align: center;
        }
        .content p {
            color: #666666;
            font-size: 16px;
            line-height: 1.5;
            margin-bottom: 15px;
        }
        .credentials {
          font-size: 18px;
          margin: 25px 0;
          padding: 15px;
          border: 1px solid #e1e1e1;
          border-radius: 5px;
          background-color: #f9f9f9;
        }
        .credentials strong {
            color: #3a7bd5;
        }
        .app-download {
            margin: 25px 0;
            text-align: center;
        }
        .app-store-badge {
            height: 50px;
            margin: 0 10px;
        }
        .footer {
            text-align: center;
            padding: 20px;
            font-size: 14px;
            color: #999999;
            border-top: 1px solid #eee;
            margin-top: 20px;
        }
        .steps {
            margin: 20px 0;
            padding-left: 20px;
        }
        .steps li {
            margin-bottom: 10px;
        }
      </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to The HIP Physio!</h1>
            </div>
            <div class="content">
                <h2>Your Rehab Plan Access</h2>
                <p>Dear {userName},</p>
                
                <p>Thank you for purchasing our <strong>{packageName}</strong> package. Here's how to get started:</p>
                
                <div class="credentials">
                    <p><strong>Your login credentials:</strong></p>
                    <p><strong>Email:</strong> {userEmail}</p>
                    <p><strong>Password:</strong> {generatedPassword}</p>
                </div>

                <div class="steps">
                    <h3>To access your content:</h3>
                    <ol>
                        <li>Install The HIP Physio mobile app from the App Store or Google Play Store</li>
                        <li>Open the app and select "Log In"</li>
                        <li>Enter your email and password shown above</li>
                        <li>Begin your personalized rehab Plan</li>
                    </ol>
                </div>

                <div class="app-download">
                    <p>Download the app now:</p>
                    <a href="{iosAppLink}"><img src="https://link-to-apple-app-store-badge.png" class="app-store-badge" alt="Download on the App Store"></a>
                    <a href="{androidAppLink}"><img src="https://link-to-google-play-badge.png" class="app-store-badge" alt="Get it on Google Play"></a>
                </div>

                <p><strong>Security Note:</strong> For your protection, we recommend changing your password after first login through the app's settings.</p>
                
                <p>If you have any questions about your rehab plan, please contact our support team at support@thehipphysio.com</p>
            </div>
            <div class="footer">
                <p>&copy; 2024 The HIP Physio. All rights reserved.</p>
                <p>Follow us for health tips: [Social Media Icons]</p>
            </div>
        </div>
    </body>
  </html>
`;

// export const generateWelcomeEmailHtml = (email, name: string, iosAppLink: string, androidAppLink: string) => {
//     return `
//     <html>
//         <head>
//             <style>
//                 .email-container {
//                     font-family: Arial, sans-serif;
//                     line-height: 1.6;
//                     color: #333;
//                     padding: 20px;
//                     background-color: #f4f4f4;
//                     border-radius: 10px;
//                     max-width: 600px;
//                     margin: auto;
//                 }
//                 .email-header {
//                     background-color: #3a7bd5;
//                     color: white;
//                     padding: 20px;
//                     text-align: center;
//                     border-radius: 10px 10px 0 0;
//                 }
//                 .email-body {
//                     padding: 20px;
//                     background-color: white;
//                     border-radius: 0 0 10px 10px;
//                 }
//                 .email-footer {
//                     text-align: center;
//                     padding: 20px;
//                     font-size: 14px;
//                     color: #777;
//                     border-top: 1px solid #eee;
//                     margin-top: 20px;
//                 }
//                 .app-download {
//                     margin: 25px 0;
//                     text-align: center;
//                 }
//                 .app-store-badge {
//                     height: 50px;
//                     margin: 0 10px;
//                 }
//                 .steps {
//                     margin: 20px 0;
//                     padding-left: 20px;
//                 }
//                 .steps li {
//                     margin-bottom: 10px;
//                 }
//             </style>
//         </head>
//         <body>
//             <div class="email-container">
//                 <div class="email-header">
//                     <h1>Welcome to The HIP Physio!</h1>
//                 </div>
//                 <div class="email-body">
//                     <p>Hi ${name},</p>
                    
//                     <p>Your account has been successfully verified and is ready to use!</p>
                    
//                     <div class="steps">
//                         <h3>To get started with your rehab plan:</h3>
//                         <ol>
//                             <li>Install The HIP Physio mobile app</li>
//                             <li>Open the app and log in using your registered email</li>
//                             <li>Begin your personalized rehabilitation program</li>
//                         </ol>
//                     </div>

//                     <div class="app-download">
//                         <p>Download the app now:</p>
//                         <a href="${iosAppLink}"><img src="https://link-to-apple-app-store-badge.png" class="app-store-badge" alt="Download on the App Store"></a>
//                         <a href="${androidAppLink}"><img src="https://link-to-google-play-badge.png" class="app-store-badge" alt="Get it on Google Play"></a>
//                     </div>

//                     <p>If you need any assistance with your exercises or rehab plan, our physiotherapy team is available to help.</p>
                    
//                     <p>Best Regards,<br/>The HIP Physio Team</p>
//                 </div>
//                 <div class="email-footer">
//                     <p>&copy; 2024 The HIP Physio. All rights reserved.</p>
//                     <p>Contact us: support@thehipphysio.com</p>
//                 </div>
//             </div>
//         </body>
//     </html>
//     `;
// };

// USE TO SEND RESET URL LINK
export const generatePasswordResetEmailHtml = (resetURL: string, name: string) => {
  return `
  <html>
    <head>
      <style>
        .email-container {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          padding: 20px;
          background-color: #f4f4f4;
          border-radius: 10px;
          max-width: 600px;
          margin: auto;
        }
        .email-header {
          background-color: #d9534f;
          color: white;
          padding: 10px;
          text-align: center;
          border-radius: 10px 10px 0 0;
        }
        .email-body {
          padding: 20px;
          background-color: white;
          border-radius: 0 0 10px 10px;
        }
        .email-footer {
          text-align: center;
          padding: 10px;
          font-size: 12px;
          color: #777;
        }
        .button {
          display: inline-block;
          padding: 10px 20px;
          margin: 20px 0;
          font-size: 16px;
          color: white;
          background-color: #ffffff;
          text-decoration: none;
          border-radius: 5px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h1>Reset Your Password</h1>
        </div>
        <div class="email-body">
          <p>Hi ${name}</p>
          <p>We received a request to reset your password. Click the button below to reset it.</p>
          <a href="${resetURL}" class="button">Reset Password</a>
          <p>If you didn't request a password reset, please ignore this email.</p>
          <p>Thank you,<br/>The Hip Physio Team</p>
        </div>
        <div class="email-footer">
          <p>&copy; 2025 The Hip Physio. All rights reserved.</p>
        </div>
      </div>
    </body>
  </html>
`;
}

// USE TO SEND  NEW PASSWORD
export const generateNewPasswordEmailHtml = (newPassword: string, name: string) => {
  return `
  <html>
    <head>
      <style>
        .email-container {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          padding: 20px;
          background-color: #f4f4f4;
          border-radius: 10px;
          max-width: 600px;
          margin: auto;
        }
        .logo-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          padding: 20px 0;
          background-color: white;
        }
        .logo-img {
          max-height: 80px;
          max-width: 200px;
        }
        .company-name {
          font-size: 24px;
          font-weight: bold;
          color: #11989D;
          margin-top: 10px;
        }
        .email-header {
          background-color: #11989D;
          color: white;
          padding: 10px;
          text-align: center;
          border-radius: 10px 10px 0 0;
          margin-top: 10px;
        }
        .email-body {
          padding: 20px;
          background-color: white;
          border-radius: 0 0 10px 10px;
        }
        .email-footer {
          text-align: center;
          padding: 10px;
          font-size: 12px;
          color: #777;
        }
        .password-box {
          display: inline-block;
          padding: 10px 20px;
          margin: 20px 0;
          font-size: 16px;
          color: #333;
          background-color: #f8f9fa;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-family: monospace;
        }
        .note {
          font-size: 14px;
          color: #666;
          font-style: italic;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="logo-header">
          <img src="https://cdn.prod.website-files.com/639b805aaca91b48d316e315/6499d47277d8e8be8ade1539_The%20Hip%20Physio%20Logo.png" 
            class="logo-img" 
            alt="The HIP Physio Logo"
          >
          <div class="company-name">The Hip Physio</div>
        </div>
        <div class="email-header">
          <h1>Your New Password</h1>
        </div>
        <div class="email-body">
          <p>Hi ${name},</p>
          <p>We received a request to reset your password. Here's your new password:</p>
          <div class="password-box">${newPassword}</div>
          <p class="note">Please use this password to log in to your account. We recommend changing this password after logging in for security purposes.</p>
          <p>If you didn't request a password reset, please contact our support team immediately.</p>
          <p>Thank you,<br/>The Hip Physio</p>
        </div>
        <div class="email-footer">
          <p>&copy; 2025 The Hip Physio. All rights reserved.</p>
        </div>
      </div>
    </body>
  </html>
`;
}