export interface EmailConfig {
  region: string
  senderEmail: string
  rateLimit: number
}

export interface BulkEmailRequest {
  templateId: string
  fromEmail: string
  subject: string
  recipients: BulkRecipient[]
  defaultTemplateData: Record<string, any>
}

export interface BulkRecipient {
  email: string
  templateData: Record<string, any>
}

export interface BulkEmailResponse {
  successful: BulkEmailResult[]
  failed: BulkEmailResult[]
}

export interface BulkEmailResult {
  email: string
  messageId?: string
  error?: {
    code: string
    message: string
  }
}
