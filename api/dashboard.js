// api/dashboard.js
// TribuCoach Dashboard API - Real Airtable Integration

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('🔄 Dashboard API: Fetching data from Airtable...');

        // Airtable configuration
        const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'your_base_id';
        const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || 'your_api_key';
        const AIRTABLE_TABLE_NAME = 'conversazioni';

        // Fetch conversations from Airtable
        const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`;
        
        const airtableResponse = await fetch(airtableUrl, {
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!airtableResponse.ok) {
            console.error('Airtable API error:', airtableResponse.status);
            throw new Error('Failed to fetch from Airtable');
        }

        const airtableData = await airtableResponse.json();
        console.log(`📊 Fetched ${airtableData.records.length} records from Airtable`);

        // Process and analyze the data
        const processedData = processAirtableData(airtableData.records);

        // Return dashboard data
        return res.status(200).json(processedData);

    } catch (error) {
        console.error('Dashboard API Error:', error);
        
        // Return fallback data in case of error
        const fallbackData = generateFallbackData();
        return res.status(200).json(fallbackData);
    }
}

// Process Airtable data into dashboard format
function processAirtableData(records) {
    console.log('🔍 Processing Airtable data for dashboard...');

    const conversations = records.map(record => ({
        id: record.id,
        userMessage: record.fields.User_Message || '',
        botResponse: record.fields.Bot_Response || '',
        timestamp: new Date(record.fields.Timestamp || record.createdTime),
        interestArea: record.fields.Interest_Area || 'general',
        sessionId: record.fields.Session_ID || '',
        userAgent: record.fields.User_Agent || ''
    }));

    // Calculate overview metrics
    const overview = calculateOverviewMetrics(conversations);

    // Generate leads from conversations
    const leads = generateLeadsFromConversations(conversations);

    // Analyze questions
    const questionsAnalysis = analyzeQuestions(conversations);

    // Generate trend data
    const trends = generateTrendData(conversations);

    // Analyze interests
    const interests = analyzeInterests(conversations);

    return {
        overview,
        leads,
        questions: questionsAnalysis,
        trends,
        interests,
        lastUpdated: new Date().toISOString()
    };
}

// Calculate overview metrics
function calculateOverviewMetrics(conversations) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayConversations = conversations.filter(c => 
        new Date(c.timestamp) >= today
    ).length;

    // Group by session to count unique leads
    const uniqueSessions = [...new Set(conversations.map(c => c.sessionId))];
    const activeLeads = uniqueSessions.length;

    // Calculate conversion rate (simplified)
    const highEngagementConversations = conversations.filter(c => 
        c.userMessage.length > 20 && 
        (c.userMessage.toLowerCase().includes('prezzo') || 
         c.userMessage.toLowerCase().includes('costo') ||
         c.userMessage.toLowerCase().includes('contatto') ||
         c.userMessage.toLowerCase().includes('informazioni'))
    ).length;

    const conversionRate = activeLeads > 0 ? 
        Math.round((highEngagementConversations / activeLeads) * 100) : 0;

    // Calculate hot leads (recent high engagement)
    const recentThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    const hotLeads = conversations.filter(c => 
        new Date(c.timestamp) >= recentThreshold &&
        (c.userMessage.toLowerCase().includes('prezzo') ||
         c.userMessage.toLowerCase().includes('quando') ||
         c.userMessage.toLowerCase().includes('dove') ||
         c.userMessage.toLowerCase().includes('contatto'))
    ).length;

    return {
        todayConversations,
        activeLeads,
        conversionRate,
        hotLeads
    };
}

// Generate leads from conversations
function generateLeadsFromConversations(conversations) {
    // Group conversations by session
    const sessionGroups = conversations.reduce((groups, conv) => {
        const sessionId = conv.sessionId;
        if (!groups[sessionId]) {
            groups[sessionId] = [];
        }
        groups[sessionId].push(conv);
        return groups;
    }, {});

    // Convert sessions to leads
    const leads = Object.entries(sessionGroups).map(([sessionId, convs], index) => {
        // Sort conversations by timestamp
        convs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        const lastConversation = convs[convs.length - 1];
        const firstConversation = convs[0];
        
        // Calculate engagement score based on conversation characteristics
        const engagementScore = calculateEngagementScore(convs);
        
        // Determine if lead is hot
        const isHot = engagementScore > 70 && 
                     (Date.now() - new Date(lastConversation.timestamp)) < 48 * 60 * 60 * 1000;

        // Generate a lead name (in real scenario, you might extract from conversation)
        const leadName = `Lead ${index + 1}`;

        return {
            id: sessionId,
            name: leadName,
            lastMessage: lastConversation.userMessage,
            timestamp: lastConversation.timestamp,
            interest: determineInterestFromConversations(convs),
            engagementScore,
            conversationCount: convs.length,
            isHot,
            phone: '+393478881515' // Default - in real scenario extract if available
        };
    });

    // Sort by engagement and recency
    return leads.sort((a, b) => {
        if (a.isHot !== b.isHot) return b.isHot - a.isHot;
        return b.engagementScore - a.engagementScore;
    });
}

// Calculate engagement score for a lead
function calculateEngagementScore(conversations) {
    let score = 0;
    
    // Base score from conversation count
    score += Math.min(conversations.length * 10, 40);
    
    // Bonus for specific keywords indicating high interest
    const highInterestKeywords = [
        'prezzo', 'costo', 'quanto', 'contatto', 'telefono', 'whatsapp',
        'quando', 'dove', 'orari', 'prenot', 'informazioni', 'interessato'
    ];
    
    conversations.forEach(conv => {
        const message = conv.userMessage.toLowerCase();
        highInterestKeywords.forEach(keyword => {
            if (message.includes(keyword)) {
                score += 5;
            }
        });
        
        // Bonus for longer messages (more engaged users)
        if (conv.userMessage.length > 50) score += 3;
        if (conv.userMessage.length > 100) score += 5;
    });
    
    // Recency bonus
    const lastConversation = conversations[conversations.length - 1];
    const hoursSinceLastMessage = (Date.now() - new Date(lastConversation.timestamp)) / (1000 * 60 * 60);
    
    if (hoursSinceLastMessage < 2) score += 20;
    else if (hoursSinceLastMessage < 24) score += 10;
    else if (hoursSinceLastMessage < 72) score += 5;
    
    return Math.min(Math.round(score), 100);
}

// Determine primary interest from conversations
function determineInterestFromConversations(conversations) {
    const interests = {
        fitness: ['allena', 'palestra', 'muscol', 'peso', 'forma', 'personal', 'training'],
        nutrition: ['aliment', 'dieta', 'nutriz', 'mangia', 'cibo', 'meal'],
        business: ['business', 'azienda', 'impresa', 'startup', 'upstart', 'consulenz'],
        lifestyle: ['lifestyle', 'vita', 'cambiamento', 'trasform', 'coach']
    };
    
    const scores = {};
    
    conversations.forEach(conv => {
        const message = conv.userMessage.toLowerCase();
        
        Object.entries(interests).forEach(([interest, keywords]) => {
            keywords.forEach(keyword => {
                if (message.includes(keyword)) {
                    scores[interest] = (scores[interest] || 0) + 1;
                }
            });
        });
    });
    
    // Return the interest with highest score, default to 'fitness'
    return Object.keys(scores).reduce((a, b) => 
        scores[a] > scores[b] ? a : b, 'fitness'
    );
}

// Analyze questions from conversations
function analyzeQuestions(conversations) {
    const questionPatterns = [
        { pattern: /quanto.*cost|prezzo|costa/i, category: 'pricing', label: 'Quanto costa il servizio?' },
        { pattern: /dove.*studio|dove.*sede|indirizzo/i, category: 'location', label: 'Dove si trova lo studio?' },
        { pattern: /orari|quando.*aper|ore/i, category: 'schedule', label: 'Quali sono gli orari?' },
        { pattern: /allena.*online|remoto|casa/i, category: 'service', label: 'Posso allenarmi online?' },
        { pattern: /nutriz|aliment|dieta|mangia/i, category: 'nutrition', label: 'Consigli alimentari?' },
        { pattern: /risultati|tempo|quanto.*tempo/i, category: 'results', label: 'Che risultati aspettarsi?' },
        { pattern: /principiant|inizio|comincio/i, category: 'level', label: 'Programmi per principianti?' },
        { pattern: /business|azienda|consulenz/i, category: 'business', label: 'Consulenze business?' }
    ];
    
    const questionCounts = {};
    
    conversations.forEach(conv => {
        const message = conv.userMessage;
        
        questionPatterns.forEach(({ pattern, category, label }) => {
            if (pattern.test(message)) {
                if (!questionCounts[label]) {
                    questionCounts[label] = { question: label, count: 0, category };
                }
                questionCounts[label].count++;
            }
        });
    });
    
    // Convert to array and sort by count
    return Object.values(questionCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
}

// Generate trend data
function generateTrendData(conversations) {
    const days = [];
    const conversationCounts = [];
    
    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const dayConversations = conversations.filter(c => 
            new Date(c.timestamp) >= date && new Date(c.timestamp) < nextDate
        ).length;
        
        days.push(date.toLocaleDateString('it-IT', { weekday: 'short' }));
        conversationCounts.push(dayConversations);
    }
    
    return {
        days,
        conversations: conversationCounts
    };
}

// Analyze interests distribution
function analyzeInterests(conversations) {
    const interestCounts = {
        fitness: 0,
        nutrition: 0,
        business: 0,
        lifestyle: 0
    };
    
    conversations.forEach(conv => {
        const interest = conv.interestArea || 'fitness';
        if (interestCounts.hasOwnProperty(interest)) {
            interestCounts[interest]++;
        } else {
            interestCounts.fitness++; // Default fallback
        }
    });
    
    // Convert to percentages
    const total = Object.values(interestCounts).reduce((sum, count) => sum + count, 0);
    
    if (total === 0) {
        return { fitness: 40, nutrition: 30, business: 20, lifestyle: 10 };
    }
    
    return {
        fitness: Math.round((interestCounts.fitness / total) * 100),
        nutrition: Math.round((interestCounts.nutrition / total) * 100),
        business: Math.round((interestCounts.business / total) * 100),
        lifestyle: Math.round((interestCounts.lifestyle / total) * 100)
    };
}

// Fallback data for development/errors
function generateFallbackData() {
    console.log('⚠️ Using fallback data - Airtable connection failed');
    
    return {
        overview: {
            todayConversations: 12,
            activeLeads: 28,
            conversionRate: 23,
            hotLeads: 5
        },
        leads: [
            {
                id: 'fallback_1',
                name: 'Lead Interessato',
                lastMessage: 'Quanto costa il personal training?',
                timestamp: new Date(Date.now() - 1000 * 60 * 30),
                interest: 'fitness',
                engagementScore: 85,
                isHot: true,
                phone: '+393478881515'
            },
            {
                id: 'fallback_2',
                name: 'Lead Nutrizione',
                lastMessage: 'Che tipo di alimentazione consigliate?',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
                interest: 'nutrition',
                engagementScore: 72,
                isHot: true,
                phone: '+393478881515'
            }
        ],
        questions: [
            { question: 'Quanto costa il personal training?', count: 15, category: 'pricing' },
            { question: 'Dove si trova lo studio?', count: 12, category: 'location' },
            { question: 'Che risultati posso aspettarmi?', count: 8, category: 'results' }
        ],
        trends: {
            days: ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'],
            conversations: [5, 8, 12, 15, 18, 22, 12]
        },
        interests: {
            fitness: 45,
            nutrition: 25,
            business: 20,
            lifestyle: 10
        },
        lastUpdated: new Date().toISOString(),
        dataSource: 'fallback'
    };
}