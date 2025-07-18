// /api/conversations.js
// API DEBUG ESTREMA per identificare errore 500

export default async function handler(req, res) {
    console.log('🎯 API CONVERSATIONS DEBUG START');
    
    // Configurazione CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        console.log('✅ OPTIONS request handled');
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        console.log('❌ Method not allowed:', req.method);
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('🔧 Starting API conversations debug...');

        // Test 1: Variabili ambiente
        const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
        const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
        const AIRTABLE_TABLE_NAME = 'conversazioni';

        console.log('📋 Environment Variables Check:');
        console.log('- AIRTABLE_BASE_ID exists:', !!AIRTABLE_BASE_ID);
        console.log('- AIRTABLE_API_KEY exists:', !!AIRTABLE_API_KEY);
        console.log('- Base ID length:', AIRTABLE_BASE_ID?.length || 0);
        console.log('- API Key starts with:', AIRTABLE_API_KEY?.substring(0, 8) || 'undefined');
        console.log('- Table name:', AIRTABLE_TABLE_NAME);

        if (!AIRTABLE_BASE_ID) {
            console.error('❌ CRITICAL: AIRTABLE_BASE_ID is missing');
            return res.status(200).json({
                error: 'AIRTABLE_BASE_ID missing',
                debug: { hasBaseId: false, hasApiKey: !!AIRTABLE_API_KEY },
                conversations: []
            });
        }

        if (!AIRTABLE_API_KEY) {
            console.error('❌ CRITICAL: AIRTABLE_API_KEY is missing');
            return res.status(200).json({
                error: 'AIRTABLE_API_KEY missing',
                debug: { hasBaseId: !!AIRTABLE_BASE_ID, hasApiKey: false },
                conversations: []
            });
        }

        // Test 2: Costruzione URL
        const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`;
        console.log('🌐 Airtable URL:', airtableUrl);

        // Test 3: Headers
        const headers = {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json'
        };
        console.log('📡 Request headers prepared');

        // Test 4: Fetch Airtable
        console.log('📡 Making request to Airtable...');
        
        const response = await fetch(airtableUrl, { headers });
        
        console.log('📡 Airtable response status:', response.status);
        console.log('📡 Airtable response ok:', response.ok);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Airtable API Error Details:');
            console.error('- Status:', response.status);
            console.error('- Status Text:', response.statusText);
            console.error('- Error Body:', errorText);
            
            return res.status(200).json({
                error: `Airtable API error: ${response.status}`,
                debug: {
                    airtableStatus: response.status,
                    airtableError: errorText,
                    url: airtableUrl
                },
                conversations: []
            });
        }

        // Test 5: Parse Response
        console.log('📊 Parsing Airtable response...');
        const data = await response.json();
        
        console.log('📊 Airtable response structure:');
        console.log('- Has records:', !!data.records);
        console.log('- Records count:', data.records?.length || 0);
        console.log('- First record fields:', data.records?.[0] ? Object.keys(data.records[0].fields) : 'No records');

        // Test 6: Process Data
        if (!data.records || data.records.length === 0) {
            console.log('⚠️ No records found in Airtable');
            return res.status(200).json({
                success: true,
                conversations: [],
                total: 0,
                debug: {
                    airtableRecords: 0,
                    message: 'No records in Airtable table'
                }
            });
        }

        console.log('🔄 Processing Airtable records...');
        
        // Simple processing for debugging
        const conversations = [];
        
        data.records.forEach((record, index) => {
            try {
                const fields = record.fields;
                console.log(`Processing record ${index + 1}:`, Object.keys(fields));
                
                const conversation = {
                    id: record.id,
                    name: fields.User_Message ? extractName(fields.User_Message) : null,
                    phone: fields.User_Message ? extractPhone(fields.User_Message) : null,
                    email: fields.User_Message ? extractEmail(fields.User_Message) : null,
                    timestamp: new Date(fields.Timestamp || record.createdTime).toISOString(),
                    status: 'new',
                    interest: 'generale',
                    isHot: false,
                    messages: []
                };
                
                if (fields.User_Message) {
                    conversation.messages.push({
                        role: 'user',
                        content: fields.User_Message,
                        timestamp: new Date(fields.Timestamp || record.createdTime).toISOString()
                    });
                }
                
                if (fields.Bot_Response) {
                    conversation.messages.push({
                        role: 'assistant',
                        content: fields.Bot_Response,
                        timestamp: new Date(fields.Timestamp || record.createdTime).toISOString()
                    });
                }
                
                conversations.push(conversation);
                
            } catch (recordError) {
                console.error(`❌ Error processing record ${index + 1}:`, recordError);
            }
        });

        console.log(`✅ Successfully processed ${conversations.length} conversations`);

        // Test 7: Return Response
        const result = {
            success: true,
            conversations: conversations,
            total: conversations.length,
            lastUpdate: new Date().toISOString(),
            debug: {
                airtableRecords: data.records.length,
                processedConversations: conversations.length,
                apiVersion: 'debug-v1.0'
            }
        };

        console.log('📤 Sending response with', conversations.length, 'conversations');
        
        res.status(200).json(result);

    } catch (error) {
        console.error('💥 CRITICAL ERROR in conversations API:');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        res.status(200).json({
            error: 'Internal server error',
            message: error.message,
            debug: {
                errorType: error.name,
                errorMessage: error.message,
                timestamp: new Date().toISOString()
            },
            conversations: []
        });
    }
}

// Utility functions - simplified for debugging
function extractName(message) {
    if (!message) return null;
    const patterns = [
        /mi chiamo ([a-zA-ZàèéìíîòóùúÀÈÉÌÍÎÒÓÙÚ\s]+)/i,
        /sono ([a-zA-ZàèéìíîòóùúÀÈÉÌÍÎÒÓÙÚ\s]+)/i
    ];
    
    for (const pattern of patterns) {
        const match = message.match(pattern);
        if (match && match[1]) return match[1].trim();
    }
    return null;
}

function extractPhone(message) {
    if (!message) return null;
    const pattern = /(\+39\s?)?(\d{3})\s?(\d{3})\s?(\d{4})/;
    const match = message.match(pattern);
    return match ? match[0] : null;
}

function extractEmail(message) {
    if (!message) return null;
    const pattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const match = message.match(pattern);
    return match ? match[0] : null;
}