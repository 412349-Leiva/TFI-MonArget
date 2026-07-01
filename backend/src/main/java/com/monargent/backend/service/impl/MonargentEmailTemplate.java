package com.monargent.backend.service.impl;

/**
 * Shared HTML building blocks for MonArgent transactional emails.
 * Palette: navy (#0f2543, #0c1a2e) with gold accents (#F5C542, #D9B44A).
 */
final class MonargentEmailTemplate {

    private static final String NAVY = "#0f2543";
    private static final String NAVY_DARK = "#0c1a2e";
    private static final String GOLD = "#F5C542";
    private static final String GOLD_DARK = "#D9B44A";
    private static final String BORDER = "#284567";
    private static final String BODY_TEXT = "#475569";
    private static final String MUTED_TEXT = "#64748b";
    private static final String HEADING_TEXT = NAVY;
    private static final String FOOTER_MUTED = "#94a3b8";
    private static final String OUTER_BG = "#f4f6f8";
    private static final String CARD_BG = "#ffffff";
    private static final String LIGHT_PANEL = "#f8fafc";

    private MonargentEmailTemplate() {
    }

    static String buildEmail(String heading, String bodyContent) {
        return buildEmailWithExtraSection(heading, bodyContent, "");
    }

    static String buildEmailWithExtraSection(String heading, String bodyContent, String extraSection) {
        String safeHeading = escapeHtml(heading);
        return """
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <meta http-equiv="X-UA-Compatible" content="IE=edge" />
              <title>MonArgent</title>
            </head>
            <body style="margin:0;padding:24px 12px;background-color:%s;font-family:Arial,Helvetica,sans-serif;color:%s;">
              <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;">
                <tr>
                  <td style="background-color:%s;border-radius:8px;overflow:hidden;border:1px solid %s;box-shadow:0 1px 3px rgba(8,15,26,0.12);">
                    <table role="presentation" width="100%%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding:28px 32px 20px;text-align:center;background-color:%s;border-bottom:3px solid %s;">
                          <div style="font-size:28px;font-weight:700;color:%s;letter-spacing:1px;">MonArgent</div>
                          <div style="font-size:12px;color:%s;margin-top:6px;letter-spacing:0.3px;">Gestión financiera personal</div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:32px 32px 8px;">
                          <h1 style="margin:0 0 14px;font-size:22px;line-height:1.3;color:%s;font-weight:600;">%s</h1>
                          %s
                        </td>
                      </tr>
                      %s
                      <tr>
                        <td style="padding:20px 32px;text-align:center;border-top:1px solid #e2e8f0;">
                          <p style="margin:0 0 12px;font-size:14px;line-height:1.5;color:%s;">
                            Saludos,<br />
                            <span style="color:%s;font-weight:600;">el equipo de MonArgent</span>
                          </p>
                          <div style="width:60px;height:3px;background-color:%s;margin:0 auto;border-radius:2px;"></div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 8px 0;text-align:center;">
                    <p style="margin:0;font-size:11px;line-height:1.4;color:%s;">
                      © MonArgent — Este es un mensaje automático, no respondas a este correo.
                    </p>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """.formatted(
            OUTER_BG,
            BODY_TEXT,
            CARD_BG,
            BORDER,
            NAVY,
            GOLD,
            GOLD,
            FOOTER_MUTED,
            HEADING_TEXT,
            safeHeading,
            bodyContent,
            extraSection,
            MUTED_TEXT,
            GOLD_DARK,
            GOLD,
            FOOTER_MUTED
        );
    }

    static String buildCodeBox(String code, String expiryText) {
        String safeCode = escapeHtml(code);
        String safeExpiry = escapeHtml(expiryText);
        return """
            <table role="presentation" width="100%%" cellspacing="0" cellpadding="0">
              <tr>
                <td align="center" style="background-color:%s;border-radius:6px;padding:28px 20px;border:1px solid %s;">
                  <div style="font-size:11px;text-transform:uppercase;letter-spacing:2px;color:%s;margin-bottom:12px;">Tu código</div>
                  <div style="font-size:42px;font-weight:700;letter-spacing:10px;color:%s;font-family:'Courier New',Courier,monospace;line-height:1.2;">%s</div>
                </td>
              </tr>
            </table>
            <p style="margin:22px 0 0;font-size:14px;line-height:1.5;color:%s;text-align:center;">
              Este código vence en <strong style="color:%s;">%s</strong>.
            </p>
            """.formatted(
            LIGHT_PANEL,
            GOLD_DARK,
            NAVY_DARK,
            GOLD_DARK,
            safeCode,
            MUTED_TEXT,
            NAVY,
            safeExpiry
        );
    }

    static String buildSecuritySection() {
        return """
            <tr>
              <td style="padding:16px 32px 28px;">
                <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background-color:%s;border-radius:6px;border-left:4px solid %s;">
                  <tr>
                    <td style="padding:18px 20px;">
                      <p style="margin:0 0 10px;font-size:13px;line-height:1.55;color:%s;">
                        <strong style="color:%s;">¿No fuiste vos?</strong><br />
                        Si no solicitaste este código, podés ignorar este mensaje con seguridad.
                      </p>
                      <p style="margin:0 0 10px;font-size:13px;line-height:1.55;color:%s;">
                        <strong style="color:%s;">No compartas este código</strong> con nadie, ni siquiera con personas que digan representar a MonArgent.
                      </p>
                      <p style="margin:0;font-size:13px;line-height:1.55;color:%s;">
                        <strong style="color:%s;">MonArgent nunca te pedirá tu contraseña por email.</strong>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            """.formatted(
            LIGHT_PANEL,
            GOLD,
            BODY_TEXT,
            NAVY,
            BODY_TEXT,
            NAVY,
            BODY_TEXT,
            NAVY
        );
    }

    static String buildCtaButton(String label, String url) {
        String safeLabel = escapeHtml(label);
        String safeUrl = escapeHtml(url);
        return """
            <table role="presentation" width="100%%" cellspacing="0" cellpadding="0">
              <tr>
                <td align="center" style="padding:4px 0;">
                  <a href="%s" style="display:inline-block;background-color:%s;color:%s;text-decoration:none;font-size:15px;font-weight:600;padding:14px 32px;border-radius:6px;border-bottom:3px solid %s;">
                    %s
                  </a>
                </td>
              </tr>
            </table>
            """.formatted(safeUrl, GOLD, NAVY, GOLD_DARK, safeLabel);
    }

    static String buildInfoBox(String text) {
        return """
            <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="margin-bottom:20px;">
              <tr>
                <td style="background-color:%s;border-radius:6px;border-left:4px solid %s;padding:18px 20px;">
                  <p style="margin:0;font-size:14px;line-height:1.55;color:%s;">%s</p>
                </td>
              </tr>
            </table>
            """.formatted(LIGHT_PANEL, GOLD, BODY_TEXT, escapeHtml(text));
    }

    static String buildDebtCard(String amountHtml, String creditorHtml, String aliasHtml, String ctaButton) {
        return """
            <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="margin-bottom:14px;">
              <tr>
                <td style="background-color:%s;border-radius:6px;padding:16px 18px;border:1px solid %s;">
                  <p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:#334155;">
                    Debés <strong style="color:%s;">%s</strong> a
                    <strong style="color:%s;">%s</strong>%s
                  </p>
                  %s
                </td>
              </tr>
            </table>
            """.formatted(LIGHT_PANEL, BORDER, GOLD_DARK, amountHtml, NAVY, creditorHtml, aliasHtml, ctaButton);
    }

    static String escapeHtml(String value) {
        if (value == null) {
            return "";
        }
        return value
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;");
    }
}
