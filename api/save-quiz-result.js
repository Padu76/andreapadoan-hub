// api/save-quiz-result.js
// API per salvare i risultati del quiz su Airtable

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('💾 Save Quiz API: Saving quiz results to Airtable...');

        // Airtable configuration
        const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'applozDwnDZOgPvsg';
        const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || 'your_api_key';
        const QUIZ_TABLE_NAME = 'quiz_results'; // Nuova tabella per i risultati del quiz

        // Validate request data
        const quizData = req.body;
        if (!quizData.name || !quizData.phone) {
            return res.status(400).json({ error: 'Name and phone are required' });
        }

        // Prepare data for Airtable
        const airtableData = {
            fields: {
                'Name': quizData.name,
                'Phone': quizData.phone,
                'Timestamp': quizData.timestamp,
                'Fitness_Score': quizData.fitness_score,
                'Alimentazione_Score': quizData.alimentazione_score,
                'Abitudini_Score': quizData.abitudini_score,
                'Motivazione_Score': quizData.motivazione_score,
                'Stress_Score': quizData.stress_score,
                'Overall_Score': quizData.overall_score,
                'Report_Generated': quizData.report_generated,
                'Answers_JSON': quizData.answers_json,
                'Lead_Priority': quizData.lead_priority,
                'Follow_Up_Status': quizData.follow_up_status || 'New',
                'Source': 'Website Quiz'
            }
        };

        // Send to Airtable
        const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${QUIZ_TABLE_NAME}`;
        
        const airtableResponse = await fetch(airtableUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(airtableData)
        });

        if (!airtableResponse.ok) {
            const errorData = await airtableResponse.text();
            console.error('Airtable API error:', airtableResponse.status, errorData);
            throw new Error(`Airtable API error: ${airtableResponse.status}`);
        }

        const savedRecord = await airtableResponse.json();
        console.log('✅ Quiz result saved to Airtable:', savedRecord.id);

        // Also save to conversazioni table for dashboard integration
        await saveToConversationsTable(quizData, AIRTABLE_BASE_ID, AIRTABLE_API_KEY);

        return res.status(200).json({
            success: true,
            recordId: savedRecord.id,
            message: 'Quiz results saved successfully'
        });

    } catch (error) {
        console.error('❌ Save Quiz API Error:', error);
        
        return res.status(500).json({
            success: false,
            error: 'Failed to save quiz results',
            details: error.message
        });
    }
}

// Save quiz as conversation for dashboard integration
async function saveToConversationsTable(quizData, baseId, apiKey) {
    try {
        const conversationData = {
            fields: {
                'User_Message': `Quiz completato da ${quizData.name}. Score: ${quizData.overall_score}/5.0`,
                'Bot_Response': `Quiz fitness completato con successo! Report personalizzato generato per ${quizData.name}.`,
                'Timestamp': quizData.timestamp,
                'Interest_Area': determineInterestFromScores(quizData),
                'Session_ID': `quiz_${Date.now()}`,
                'User_Agent': 'Quiz Fitness Website',
                'Lead_Type': 'Quiz Lead',
                'Lead_Quality': quizData.lead_priority,
                'Contact_Info': `${quizData.name} - ${quizData.phone}`
            }
        };

        const conversationsUrl = `https://api.airtable.com/v0/${baseId}/conversazioni`;
        
        const response = await fetch(conversationsUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(conversationData)
        });

        if (response.ok) {
            console.log('✅ Quiz also saved to conversations table');
        } else {
            console.log('⚠️ Could not save to conversations table');
        }

    } catch (error) {
        console.error('❌ Error saving to conversations:', error);
    }
}

// Determine primary interest area from quiz scores
function determineInterestFromScores(quizData) {
    const scores = {
        fitness: quizData.fitness_score,
        alimentazione: quizData.alimentazione_score,
        abitudini: quizData.abitudini_score,
        motivazione: quizData.motivazione_score,
        stress: quizData.stress_score
    };

    // Find the lowest score (area that needs most improvement)
    const lowestScore = Math.min(...Object.values(scores));
    const primaryInterest = Object.keys(scores).find(key => scores[key] === lowestScore);

    // Map to dashboard categories
    const interestMapping = {
        fitness: 'fitness',
        alimentazione: 'nutrition',
        abitudini: 'lifestyle',
        motivazione: 'fitness',
        stress: 'lifestyle'
    };

    return interestMapping[primaryInterest] || 'fitness';
}