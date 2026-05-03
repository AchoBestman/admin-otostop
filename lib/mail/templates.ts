const APP_NAME = process.env.APP_NAME || "OtoStop Global+";
const LOGO_URL = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/otostop-logo-new-hq8BD9kbjXVS4ZzDeLsAWCdmm8O9Cb.jpeg";

// Base email template
function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${APP_NAME}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0A0A0A;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 0;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #1A1A1A; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);">
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 32px 40px; text-align: center; background: linear-gradient(135deg, #1E3A5F 0%, #0A0A0A 100%);">
              <img src="${LOGO_URL}" alt="${APP_NAME}" style="max-width: 200px; height: auto;" />
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #111111; text-align: center;">
              <p style="margin: 0; color: #666666; font-size: 12px;">
                &copy; ${new Date().getFullYear()} ${APP_NAME}. Tous droits r\u00e9serv\u00e9s.
              </p>
              <p style="margin: 8px 0 0 0; color: #666666; font-size: 12px;">
                Cet email a \u00e9t\u00e9 envoy\u00e9 automatiquement. Merci de ne pas r\u00e9pondre.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

// OTP Email Template
export function otpTemplate(firstName: string, otp: string): string {
  const content = `
    <h1 style="margin: 0 0 24px 0; color: #D4AF37; font-size: 24px; font-weight: 600;">
      V\u00e9rification de connexion
    </h1>
    <p style="margin: 0 0 24px 0; color: #E0E0E0; font-size: 16px; line-height: 1.6;">
      Bonjour <strong style="color: #FFFFFF;">${firstName}</strong>,
    </p>
    <p style="margin: 0 0 24px 0; color: #E0E0E0; font-size: 16px; line-height: 1.6;">
      Voici votre code de v\u00e9rification pour acc\u00e9der \u00e0 votre compte ${APP_NAME} :
    </p>
    
    <!-- OTP Code Box -->
    <table role="presentation" style="width: 100%; margin: 32px 0;">
      <tr>
        <td style="text-align: center;">
          <div style="display: inline-block; padding: 20px 40px; background: linear-gradient(135deg, #D4AF37 0%, #C0A030 100%); border-radius: 12px;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #0A0A0A;">${otp}</span>
          </div>
        </td>
      </tr>
    </table>
    
    <p style="margin: 0 0 16px 0; color: #E0E0E0; font-size: 16px; line-height: 1.6;">
      Ce code est valide pendant <strong style="color: #D4AF37;">10 minutes</strong>.
    </p>
    
    <p style="margin: 24px 0 0 0; color: #888888; font-size: 14px; line-height: 1.6;">
      Si vous n'avez pas demand\u00e9 ce code, veuillez ignorer cet email ou contacter notre support.
    </p>
  `;
  
  return baseTemplate(content);
}

// Password Reset Email Template
export function passwordResetTemplate(firstName: string, resetLink: string): string {
  const content = `
    <h1 style="margin: 0 0 24px 0; color: #D4AF37; font-size: 24px; font-weight: 600;">
      R\u00e9initialisation du mot de passe
    </h1>
    <p style="margin: 0 0 24px 0; color: #E0E0E0; font-size: 16px; line-height: 1.6;">
      Bonjour <strong style="color: #FFFFFF;">${firstName}</strong>,
    </p>
    <p style="margin: 0 0 24px 0; color: #E0E0E0; font-size: 16px; line-height: 1.6;">
      Vous avez demand\u00e9 la r\u00e9initialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour proc\u00e9der :
    </p>
    
    <!-- Reset Button -->
    <table role="presentation" style="width: 100%; margin: 32px 0;">
      <tr>
        <td style="text-align: center;">
          <a href="${resetLink}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #D4AF37 0%, #C0A030 100%); color: #0A0A0A; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px;">
            R\u00e9initialiser mon mot de passe
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 0 0 16px 0; color: #E0E0E0; font-size: 16px; line-height: 1.6;">
      Ce lien est valide pendant <strong style="color: #D4AF37;">1 heure</strong>.
    </p>
    
    <p style="margin: 24px 0 0 0; color: #888888; font-size: 14px; line-height: 1.6;">
      Si vous n'avez pas demand\u00e9 cette r\u00e9initialisation, veuillez ignorer cet email.
    </p>
  `;
  
  return baseTemplate(content);
}

// Welcome Email Template
export function welcomeTemplate(firstName: string): string {
  const content = `
    <h1 style="margin: 0 0 24px 0; color: #D4AF37; font-size: 24px; font-weight: 600;">
      Bienvenue chez ${APP_NAME} !
    </h1>
    <p style="margin: 0 0 24px 0; color: #E0E0E0; font-size: 16px; line-height: 1.6;">
      Bonjour <strong style="color: #FFFFFF;">${firstName}</strong>,
    </p>
    <p style="margin: 0 0 24px 0; color: #E0E0E0; font-size: 16px; line-height: 1.6;">
      Nous sommes ravis de vous accueillir parmi nous ! Votre compte a \u00e9t\u00e9 cr\u00e9\u00e9 avec succ\u00e8s.
    </p>
    
    <div style="margin: 32px 0; padding: 24px; background-color: #252525; border-radius: 12px; border-left: 4px solid #D4AF37;">
      <h3 style="margin: 0 0 16px 0; color: #D4AF37; font-size: 18px;">Ce que vous pouvez faire :</h3>
      <ul style="margin: 0; padding: 0 0 0 20px; color: #E0E0E0;">
        <li style="margin-bottom: 8px;">Acc\u00e9der \u00e0 votre tableau de bord personnel</li>
        <li style="margin-bottom: 8px;">G\u00e9rer vos informations de profil</li>
        <li>Explorer nos services</li>
      </ul>
    </div>
    
    <p style="margin: 24px 0 0 0; color: #888888; font-size: 14px; line-height: 1.6;">
      Si vous avez des questions, n'h\u00e9sitez pas \u00e0 nous contacter.
    </p>
  `;
  
  return baseTemplate(content);
}
