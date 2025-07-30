// api/dashboard.js
// TribuCoach Dashboard API - Real Airtable Integration with Quiz Results

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
        const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'applozDwnDZOgPvsg';
        const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || 'your_api_key';

        // Fetch data from multiple tables
        const [conversationsData, quizResultsData] = await Promise.all([
            fetchAirtableData(AIRTABLE_BASE_ID, AIRTABLE_API_KEY, 'conversazioni'),
            fetchAirtableData(AIRTABLE_BASE_ID, AIRTABLE_API_KEY, 'quiz_results')
        ]);

        console.log(`📊 Fetched ${conversationsData.length} conversations and ${quizResultsData.length} quiz results`);

        // Process and analyze the data
        const processedData = processAllData(conversationsData, quizResultsData);

        // Return dashboard data
        return res.status(200).json(processedData);

    } catch (error) {
        console.error('Dashboard API Error:', error);
        
        // Return fallback data in case of error
        const fallbackData = generateFallbackData();
        return res.status(200).json(fallbackData);
    }
}

// Fetch data from Airtable table
async function fetchAirtableData(baseId, apiKey, tableName) {
    try {
        const airtableUrl = `https://api.airtable.com/v0/${baseId}/${tableName}`;
        
        const response = await fetch(airtableUrl, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.warn(`⚠️ Could not fetch ${tableName}: ${response.status}`);
            return [];
        }

        const data = await response.json();
        return data.records || [];

    } catch (error) {
        console.error(`❌ Error fetching ${tableName}:`, error);
        return [];
    }
}

// Process all data into dashboard format
function processAllData(conversationRecords, quizRecords) {
    console.log('🔍 Processing data for dashboard...');

    // Process conversations
    const conversations = conversationRecords.map(record => ({
        id: record.id,
        userMessage: record.fields.User_Message || '',
        botResponse: record.fields.Bot_Response || '',
        timestamp: new Date(record.fields.Timestamp || record.createdTime),
        interestArea: record.fields.Interest_Area || 'general',
        sessionId: record.fields.Session_ID || '',
        userAgent: record.fields.User_Agent || '',
        leadType: record.fields.Lead_Type || 'Conversation',
        leadQuality: record.fields.Lead_Quality || 'Medium',
        contactInfo: record.fields.Contact_Info || ''
    }));

    // Process quiz results
    const quizResults = quizRecords.map(record => ({
        id: record.id,
        name: record.fields.Name || '',
        phone: record.fields.Phone || '',
        timestamp: new Date(record.fields.Timestamp || record.createdTime),
        fitnessScore: record.fields.Fitness_Score || 0,
        alimentazioneScore: record.fields.Alimentazione_Score || 0,
        abitudiniScore: record.fields.Abitudini_Score || 0,
        motivazioneScore: record.fields.Motivazione_Score || 0,
        stressScore: record.fields.Stress_Score || 0,
        overallScore: record.fields.Overall_Score || 0,
        reportGenerated: record.fields.Report_Generated || '',
        leadPriority: record.fields.Lead_Priority || 'Medium',
        followUpStatus: record.fields.Follow_Up_Status || 'New',
        source: record.fields.Source || 'Quiz'
    }));

    // Calculate overview metrics
    const overview = calculateEnhancedOverviewMetrics(conversations, quizResults);

    // Generate leads from both sources
    const leads = generateEnhancedLeads(conversations, quizResults);

    // Analyze questions
    const questionsAnalysis = analyzeQuestions(conversations);

    // Generate trend data
    const trends = generateTrendData(conversations, quizResults);

    // Analyze interests
    const interests = analyzeInterests(conversations, quizResults);

    // Quiz analytics
    const quizAnalytics = generateQuizAnalytics(quizResults);

    return {
        overview,
        leads,
        questions: questionsAnalysis,
        trends,
        interests,
        quizAnalytics,
        lastUpdated: new Date().toISOString(),
        dataSource: 'airtable_with_quiz'
    };
}

// Calculate enhanced overview metrics with quiz data
function calculateEnhancedOverviewMetrics(conversations, quizResults) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Conversations today
    const todayConversations = conversations.filter(c => 
        new Date(c.timestamp) >= today
    ).length;

    // Quiz completions today
    const todayQuizzes = quizResults.filter(q => 
        new Date(q.timestamp) >= today
    ).length;

    // Total active leads (unique sessions + quiz leads)
    const uniqueSessions = [...new Set(conversations.map(c => c.sessionId))];
    const conversationLeads = uniqueSessions.length;
    const quizLeads = quizResults.length;
    const activeLeads = conversationLeads + quizLeads;

    // Enhanced conversion rate calculation
    const highEngagementConversations = conversations.filter(c => 
        c.userMessage.length > 20 && 
        (c.userMessage.toLowerCase().includes('prezzo') || 
         c.userMessage.toLowerCase().includes('costo') ||
         c.userMessage.toLowerCase().includes('contatto') ||
         c.userMessage.toLowerCase().includes('informazioni'))
    ).length;

    // Quiz leads count as high engagement
    const totalHighEngagement = highEngagementConversations + quizResults.length;
    const conversionRate = activeLeads > 0 ? 
        Math.round((totalHighEngagement / activeLeads) * 100) : 0;

    // Hot leads (high priority quiz + recent conversations)
    const recentThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const hotQuizLeads = quizResults.filter(q => 
        q.leadPriority === 'High' && new Date(q.timestamp) >= recentThreshold
    ).length;
    
    const hotConversationLeads = conversations.filter(c => 
        new Date(c.timestamp) >= recentThreshold &&
        (c.userMessage.toLowerCase().includes('prezzo') ||
         c.userMessage.toLowerCase().includes('quando') ||
         c.userMessage.toLowerCase().includes('dove') ||
         c.userMessage.toLowerCase().includes('contatto'))
    ).length;

    const hotLeads = hotQuizLeads + hotConversationLeads;

    return {
        todayConversations: todayConversations + todayQuizzes,
        activeLeads,
        conversionRate,
        hotLeads,
        todayQuizzes,
        totalQuizCompleted: quizResults.length
    };
}

// Generate enhanced leads from both conversations and quiz
function generateEnhancedLeads(conversations, quizResults) {
    const leads = [];

    // Add quiz leads (higher priority)
    quizResults.forEach((quiz, index) => {
        const weakestArea = determineWeakestArea(quiz);
        
        leads.push({
            id: `quiz_${quiz.id}`,
            name: quiz.name,
            lastMessage: `Completato quiz fitness - Score: ${quiz.overallScore}/5.0`,
            timestamp: quiz.timestamp,
            interest: mapScoreToInterest(weakestArea),
            engagementScore: calculateQuizEngagementScore(quiz),
            conversationCount: 1,
            isHot: quiz.leadPriority === 'High',
            phone: quiz.phone,
            source: 'Quiz',
            leadPriority: quiz.leadPriority,
            followUpStatus: quiz.followUpStatus,
            quizData: {
                overallScore: quiz.overallScore,
                weakestArea: weakestArea,
                fitnessScore: quiz.fitnessScore,
                alimentazioneScore: quiz.alimentazioneScore,
                abitudiniScore: quiz.abitudiniScore,
                motivazioneScore: quiz.motivazioneScore,
                stressScore: quiz.stressScore
            }
        });
    });

    // Add conversation-based leads
    const sessionGroups = conversations.reduce((groups, conv) => {
        const sessionId = conv.sessionId;
        if (!groups[sessionId]) {
            groups[sessionId] = [];
        }
        groups[sessionId].push(conv);
        return groups;
    }, {});

    Object.entries(sessionGroups).forEach(([sessionId, convs], index) => {
        convs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        const lastConversation = convs[convs.length - 1];
        const engagementScore = calculateEngagementScore(convs);
        
        const isHot = engagementScore > 70 && 
                     (Date.now() - new Date(lastConversation.timestamp)) < 48 * 60 * 60 * 1000;

        const leadName = lastConversation.contactInfo || `Lead ${index + 1}`;

        leads.push({
            id: sessionId,
            name: leadName,
            lastMessage: lastConversation.userMessage,
            timestamp: lastConversation.timestamp,
            interest: determineInterestFromConversations(convs),
            engagementScore,
            conversationCount: convs.length,
            isHot,
            phone: extractPhoneFromContactInfo(lastConversation.contactInfo),
            source: 'Conversation',
            leadPriority: lastConversation.leadQuality || 'Medium'
        });
    });

    // Sort by priority: Quiz leads first, then by engagement and recency
    return leads.sort((a, b) => {
        if (a.source === 'Quiz' && b.source !== 'Quiz') return -1;
        if (b.source === 'Quiz' && a.source !== 'Quiz') return 1;
        if (a.isHot !== b.isHot) return b.isHot - a.isHot;
        return b.engagementScore - a.engagementScore;
    });
}

// Calculate engagement score for quiz leads
function calculateQuizEngagementScore(quiz) {
    let score = 70; // Base score for completing quiz
    
    // Bonus for providing contact info
    if (quiz.phone) score += 15;
    
    // Priority-based scoring
    if (quiz.leadPriority === 'High') score += 15;
    else if (quiz.leadPriority === 'Medium') score += 5;
    
    // Recency bonus
    const hoursSinceQuiz = (Date.now() - new Date(quiz.timestamp)) / (1000 * 60 * 60);
    if (hoursSinceQuiz < 2) score += 20;
    else if (hoursSinceQuiz < 24) score += 10;
    else if (hoursSinceQuiz < 72) score += 5;
    
    return Math.min(Math.round(score), 100);
}

// Determine weakest area from quiz scores
function determineWeakestArea(quiz) {
    const scores = {
        fitness: quiz.fitnessScore,
        alimentazione: quiz.alimentazioneScore,
        abitudini: quiz.abitudiniScore,
        motivazione: quiz.motivazioneScore,
        stress: quiz.stressScore
    };
    
    const lowestScore = Math.min(...Object.values(scores));
    return Object.keys(scores).find(key => scores[key] === lowestScore);
}

// Map quiz category to interest area
function mapScoreToInterest(category) {
    const mapping = {
        fitness: 'fitness',
        alimentazione: 'nutrition',
        abitudini: 'lifestyle',
        motivazione: 'fitness',
        stress: 'lifestyle'
    };
    return mapping[category] || 'fitness';
}

// Generate quiz analytics
function generateQuizAnalytics(quizResults) {
    if (quizResults.length === 0) {
        return {
            totalCompleted: 0,
            averageScores: {},
            scoreDistribution: {},
            priorityDistribution: {}
        };
    }

    // Calculate average scores
    const averageScores = {
        overall: 0,
        fitness: 0,
        alimentazione: 0,
        abitudini: 0,
        motivazione: 0,
        stress: 0
    };

    quizResults.forEach(quiz => {
        averageScores.overall += quiz.overallScore;
        averageScores.fitness += quiz.fitnessScore;
        averageScores.alimentazione += quiz.alimentazioneScore;
        averageScores.abitudini += quiz.abitudiniScore;
        averageScores.motivazione += quiz.motivazioneScore;
        averageScores.stress += quiz.stressScore;
    });

    Object.keys(averageScores).forEach(key => {
        averageScores[key] = Math.round((averageScores[key] / quizResults.length) * 10) / 10;
    });

    // Score distribution
    const scoreRanges = { '1-2': 0, '2-3': 0, '3-4': 0, '4-5': 0 };
    quizResults.forEach(quiz => {
        const score = quiz.overallScore;
        if (score < 2) scoreRanges['1-2']++;
        else if (score < 3) scoreRanges['2-3']++;
        else if (score < 4) scoreRanges['3-4']++;
        else scoreRanges['4-5']++;
    });

    // Priority distribution
    const priorityDistribution = { High: 0, Medium: 0, Low: 0 };
    quizResults.forEach(quiz => {
        priorityDistribution[quiz.leadPriority]++;
    });

    return {
        totalCompleted: quizResults.length,
        averageScores,
        scoreDistribution: scoreRanges,
        priorityDistribution
    };
}

// Enhanced trend data with quiz results
function generateTrendData(conversations, quizResults) {
    const days = [];
    const conversationCounts = [];
    const quizCounts = [];
    
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
        
        const dayQuizzes = quizResults.filter(q => 
            new Date(q.timestamp) >= date && new Date(q.timestamp) < nextDate
        ).length;
        
        days.push(date.toLocaleDateString('it-IT', { weekday: 'short' }));
        conversationCounts.push(dayConversations);
        quizCounts.push(dayQuizzes);
    }
    
    return {
        days,
        conversations: conversationCounts,
        quizzes: quizCounts,
        total: conversationCounts.map((conv, i) => conv + quizCounts[i])
    };
}

// Enhanced interests analysis
function analyzeInterests(conversations, quizResults) {
    const interestCounts = {
        fitness: 0,
        nutrition: 0,
        business: 0,
        lifestyle: 0
    };
    
    // Count from conversations
    conversations.forEach(conv => {
        const interest = conv.interestArea || 'fitness';
        if (interestCounts.hasOwnProperty(interest)) {
            interestCounts[interest]++;
        } else {
            interestCounts.fitness++;
        }
    });
    
    // Count from quiz results (based on weakest area)
    quizResults.forEach(quiz => {
        const weakestArea = determineWeakestArea(quiz);
        const interest = mapScoreToInterest(weakestArea);
        interestCounts[interest]++;
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

// Helper functions (keeping existing ones)
function calculateEngagementScore(conversations) {
    let score = 0;
    
    score += Math.min(conversations.length * 10, 40);
    
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
        
        if (conv.userMessage.length > 50) score += 3;
        if (conv.userMessage.length > 100) score += 5;
    });
    
    const lastConversation = conversations[conversations.length - 1];
    const hoursSinceLastMessage = (Date.now() - new Date(lastConversation.timestamp)) / (1000 * 60 * 60);
    
    if (hoursSinceLastMessage < 2) score += 20;
    else if (hoursSinceLastMessage < 24) score += 10;
    else if (hoursSinceLastMessage < 72) score += 5;
    
    return Math.min(Math.round(score), 100);
}

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
    
    return Object.keys(scores).reduce((a, b) => 
        scores[a] > scores[b] ? a : b, 'fitness'
    );
}

function extractPhoneFromContactInfo(contactInfo) {
    if (!contactInfo) return '+393478881515';
    
    const phoneMatch = contactInfo.match(/\+?\d{10,15}/);
    return phoneMatch ? phoneMatch[0] : '+393478881515';
}

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
    
    return Object.values(questionCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
}

// Fallback data for development/errors
function generateFallbackData() {
    console.log('⚠️ Using fallback data - Airtable connection failed');
    
    return {
        overview: {
            todayConversations: 8,
            activeLeads: 32,
            conversionRate: 28,
            hotLeads: 7,
            todayQuizzes: 4,
            totalQuizCompleted: 15
        },
        leads: [
            {
                id: 'quiz_fallback_1',
                name: 'Marco Fitness',
                lastMessage: 'Completato quiz fitness - Score: 2.3/5.0',
                timestamp: new Date(Date.now() - 1000 * 60 * 30),
                interest: 'fitness',
                engagementScore: 95,
                isHot: true,
                phone: '+393478881515',
                source: 'Quiz',
                leadPriority: 'High',
                quizData: {
                    overallScore: 2.3,
                    weakestArea: 'fitness',
                    fitnessScore: 1,
                    alimentazioneScore: 3,
                    abitudiniScore: 2,
                    motivazioneScore: 3,
                    stressScore: 2
                }
            },
            {
                id: 'conv_fallback_1',
                name: 'Lead Interessato',
                lastMessage: 'Quanto costa il personal training?',
                timestamp: new Date(Date.now() - 1000 * 60 * 60),
                interest: 'fitness',
                engagementScore: 85,
                isHot: true,
                phone: '+393478881515',
                source: 'Conversation',
                leadPriority: 'High'
            }
        ],
        questions: [
            { question: 'Quanto costa il personal training?', count: 18, category: 'pricing' },
            { question: 'Dove si trova lo studio?', count: 15, category: 'location' },
            { question: 'Che risultati posso aspettarmi?', count: 12, category: 'results' }
        ],
        trends: {
            days: ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'],
            conversations: [3, 5, 8, 12, 6, 4, 2],
            quizzes: [1, 2, 3, 2, 4, 1, 1],
            total: [4, 7, 11, 14, 10, 5, 3]
        },
        interests: {
            fitness: 50,
            nutrition: 25,
            business: 15,
            lifestyle: 10
        },
        quizAnalytics: {
            totalCompleted: 15,
            averageScores: {
                overall: 3.2,
                fitness: 2.8,
                alimentazione: 3.5,
                abitudini: 3.0,
                motivazione: 3.8,
                stress: 2.9
            },
            scoreDistribution: {
                '1-2': 3,
                '2-3': 5,
                '3-4': 4,
                '4-5': 3
            },
            priorityDistribution: {
                High: 6,
                Medium: 7,
                Low: 2
            }
        },
        lastUpdated: new Date().toISOString(),
        dataSource: 'fallback_with_quiz'
    };
}