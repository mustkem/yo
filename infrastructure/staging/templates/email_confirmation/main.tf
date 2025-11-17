# -------------------------
# SES EMAIL TEMPLATE: EmailConfirmationTemplate
# -------------------------
resource "aws_ses_template" "email_confirmation" {
  name    = "EmailConfirmationTemplate" # must match templateId used in app/env
  subject = "Login notification"

  html = <<EOT
<html>
  <body>
    <p>Hello {{username}},</p>
    <p>We noticed a login at {{loggedInAt}}.</p>
  </body>
</html>
EOT

  text = <<EOT
Hello {{username}},
We noticed a login at {{loggedInAt}}.
EOT
}
