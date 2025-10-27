/**
 * Albato Incoming Webhook Receiver
 *
 * This endpoint receives webhooks from Albato automations
 * Use this URL in Albato: https://your-app.railway.app/api/webhooks/albato-incoming
 *
 * Albato can send data from any connected platform:
 * - Aitable.ai (CRM records, updates)
 * - Blastable.com (email events, campaigns)
 * - Any of your 100+ platforms connected in Albato
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const webhookData = req.body;

    console.log('📨 Received webhook from Albato:', {
      timestamp: new Date().toISOString(),
      headers: req.headers,
      data: webhookData
    });

    // Extract common fields
    const {
      platform,        // Which platform sent this (aitable, blastable, etc.)
      event_type,      // Type of event (record_created, email_sent, etc.)
      data,           // The actual data payload
      automation_id,  // Albato automation that triggered this
      ...rest
    } = webhookData;

    // Process based on platform
    let processedResult;

    switch (platform?.toLowerCase()) {
      case 'aitable':
        processedResult = await processAitableWebhook(event_type, data);
        break;

      case 'blastable':
        processedResult = await processBlastableWebhook(event_type, data);
        break;

      default:
        // Generic processing for any platform
        processedResult = await processGenericWebhook(platform, event_type, data);
        break;
    }

    // Log successful processing
    console.log('✅ Webhook processed successfully:', processedResult);

    // Respond to Albato
    return res.status(200).json({
      success: true,
      message: 'Webhook received and processed',
      processed_at: new Date().toISOString(),
      result: processedResult
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);

    return res.status(500).json({
      success: false,
      error: 'Webhook processing failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Process Aitable webhooks (CRM events)
 */
async function processAitableWebhook(eventType, data) {
  console.log(`📊 Processing Aitable ${eventType}:`, data);

  switch (eventType) {
    case 'record_created':
      return {
        action: 'aitable_record_created',
        record_id: data.record_id,
        fields: data.fields,
        processed: true
      };

    case 'record_updated':
      return {
        action: 'aitable_record_updated',
        record_id: data.record_id,
        changes: data.changes,
        processed: true
      };

    default:
      return {
        action: 'aitable_event',
        event_type: eventType,
        data,
        processed: true
      };
  }
}

/**
 * Process Blastable webhooks (Email marketing events)
 */
async function processBlastableWebhook(eventType, data) {
  console.log(`📧 Processing Blastable ${eventType}:`, data);

  switch (eventType) {
    case 'email_sent':
      return {
        action: 'blastable_email_sent',
        email_id: data.email_id,
        recipient: data.recipient,
        processed: true
      };

    case 'email_opened':
      return {
        action: 'blastable_email_opened',
        email_id: data.email_id,
        opened_at: data.opened_at,
        processed: true
      };

    case 'email_clicked':
      return {
        action: 'blastable_email_clicked',
        email_id: data.email_id,
        link: data.link,
        processed: true
      };

    default:
      return {
        action: 'blastable_event',
        event_type: eventType,
        data,
        processed: true
      };
  }
}

/**
 * Process webhooks from any other platform
 */
async function processGenericWebhook(platform, eventType, data) {
  console.log(`🔔 Processing ${platform} webhook:`, eventType, data);

  return {
    action: 'generic_webhook',
    platform,
    event_type: eventType,
    data,
    processed: true,
    note: 'Add custom processing logic for this platform'
  };
}

// Disable body parser to handle raw webhook data if needed
export const config = {
  api: {
    bodyParser: true,
  },
};
