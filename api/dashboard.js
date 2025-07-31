// api/dashboard.js
// TribuCoach Dashboard API - Real Airtable Integration with Ebook Tracking
// AGGIORNATO per includere tabella ebook_transactions

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
        console.log('🔄 Dashboard API: Fetching data from Airtable with Ebook Tracking...');

        // Airtable configuration
        const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'applozDwnDZOgPvsg';
        const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || 'your_api_key';

        // Fetch data from multiple tables INCLUDING ebook_transactions
        const [conversationsData, quizResultsData, ebookTransactionsData] = await Promise.all([
            fetchAirtableData(AIRTABLE_BASE_ID, AIRTABLE_API_KEY, 'conversazioni'),
            fetchAirtableData(AIRTABLE_BASE_ID, AIRTABLE_API_KEY, 'quiz_results'),
            fetchAirtableData(AIRTABLE_BASE_ID, AIRTABLE_API_KEY, 'ebook_transactions') // NEW
        ]);

        console.log(`📊 Fetched ${conversationsData.length} conversations, ${quizResultsData.length} quiz results, and ${ebookTransactionsData.length} ebook transactions`);

        // Process and analyze ALL data including ebooks
        const processedData = processAllDataWithEbooks(conversationsData, quizResultsData, ebookTransactionsData);

        // Return dashboard data
        return res.status(200).json(processedData);

    } catch (error) {
        console.error('Dashboard API Error:', error);
        
        // Return fallback data in case of error
        const fallbackData = generateFallbackDataWithEbooks();
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

// Process all data INCLUDING ebook transactions
function processAllDataWithEbooks(conversationRecords, quizRecords, ebookRecords) {
    console.log('🔍 Processing data for dashboard with ebook tracking...');

    // Process conversations (existing)
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

    // Process quiz results (existing)
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

    // Process ebook transactions (NEW)
    const ebookTransactions = ebookRecords.map(record => ({
        id: record.id,
        Email: record.fields.Email || '',
        Product_ID: record.fields.Product_ID || '',
        Product_Title: record.fields.Product_Title || '',
        Transaction_Type: record.fields.Transaction_Type || 'free', // free/paid
        Amount: parseFloat(record.fields.Amount) || 0,
        Payment_Method: record.fields.Payment_Method || 'email', // email/stripe/paypal
        Status: record.fields.Status || 'completed', // completed/failed/pending
        Timestamp: new Date(record.fields.Timestamp || record.createdTime),
        Customer_Country: record.fields.Customer_Country || 'IT',
        Session_ID: record.fields.Session_ID || '',
        User_Agent: record.fields.User_Agent || '',
        Download_Count: record.fields.Download_Count || 0,
        Last_Download: record.fields.Last_Download ? new Date(record.fields.Last_Download) : null,
        Lead_Priority: record.fields.Lead_Priority || 'Medium',
        Follow_Up_Status: record.fields.Follow_Up_Status || 'New',
        Revenue_Category: record.fields.Revenue_Category || 'Lead Generation',
        Marketing_Source: record.fields.Marketing_Source || 'Organic'
    }));

    // Calculate enhanced overview metrics WITH ebook data
    const overview = calculateOverviewWithEbooks(conversations, quizResults, ebookTransactions);

    // Generate enhanced leads including ebook leads
    const leads = generateLeadsWithEbooks(conversations, quizResults, ebookTransactions);

    // Analyze questions (existing)
    const questionsAnalysis = analyzeQuestions(conversations);

    // Generate trend data WITH ebook data
    const trends = generateTrendDataWithEbooks(conversations, quizResults, ebookTransactions);

    // Analyze interests (existing)
    const interests = analyzeInterests(conversations, quizResults);

    // Quiz analytics (existing)
    const quizAnalytics = generateQuizAnalytics(quizResults);

    // NEW: Ebook analytics
    const ebookAnalytics = generateEbookAnalytics(ebookTransactions);

    return {
        overview,
        leads,
        questions: questionsAnalysis,
        trends,
        interests,
        quizAnalytics,
        ebookAnalytics, // NEW
        ebookTransactions, // NEW - raw data for detailed view
        lastUpdated: new Date().toISOString(),
        dataSource: 'airtable_with_ebook_tracking'
    };
}

// Calculate overview metrics INCLUDING ebook data
function calculateOverviewWithEbooks(conversations, quizResults, ebookTransactions) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Existing calculations
    const todayConversations = conversations.filter(c => 
        new Date(c.timestamp) >= today
    ).length;

    const todayQuizzes = quizResults.filter(q => 
        new Date(q.timestamp) >= today
    ).length;

    const uniqueSessions = [...new Set(conversations.map(c => c.sessionId))];
    const conversationLeads = uniqueSessions.length;
    const quizLeads = quizResults.length;
    
    // NEW: Ebook leads
    const ebookLeads = [...new Set(ebookTransactions.map(t => t.Email))].length;
    const activeLeads = conversationLeads + quizLeads + ebookLeads;

    // Enhanced conversion rate with ebook data
    const highEngagementConversations = conversations.filter(c => 
        c.userMessage.length > 20 && 
        (c.userMessage.toLowerCase().includes('prezzo') || 
         c.userMessage.toLowerCase().includes('costo') ||
         c.userMessage.toLowerCase().includes('contatto') ||
         c.userMessage.toLowerCase().includes('informazioni'))
    ).length;

    const completedEbookTransactions = ebookTransactions.filter(t => t.Status === 'completed').length;
    const totalHighEngagement = highEngagementConversations + quizResults.length + completedEbookTransactions;
    const conversionRate = activeLeads > 0 ? 
        Math.round((totalHighEngagement / activeLeads) * 100) : 0;

    // Hot leads calculation WITH ebook data
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

    // NEW: Hot ebook leads (recent high-priority ebook customers)
    const hotEbookLeads = ebookTransactions.filter(t => 
        t.Lead_Priority === 'High' && 
        new Date(t.Timestamp) >= recentThreshold &&
        t.Status === 'completed'
    ).length;

    const hotLeads = hotQuizLeads + hotConversationLeads + hotEbookLeads;

    return {
        todayConversations: todayConversations + todayQuizzes,
        activeLeads,
        conversionRate,
        hotLeads,
        todayQuizzes,
        totalQuizCompleted: quizResults.length,
        // NEW ebook metrics for overview
        todayEbookTransactions: ebookTransactions.filter(t => new Date(t.Timestamp) >= today).length,
        totalEbookLeads: ebookLeads
    };
}

// Generate leads INCLUDING ebook customers
function generateLeadsWithEbooks(conversations, quizResults, ebookTransactions) {
    const leads = [];

    // Add quiz leads (highest priority)
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

    // Add ebook leads (high priority for paid customers)
    const ebookLeadsByEmail = {};
    ebookTransactions.forEach(transaction => {
        const email = transaction.Email;
        if (!ebookLeadsByEmail[email]) {
            ebookLeadsByEmail[email] = {
                transactions: [],
                totalSpent: 0,
                lastTransaction: transaction.Timestamp,
                highestPriority: transaction.Lead_Priority
            };
        }
        
        ebookLeadsByEmail[email].transactions.push(transaction);
        ebookLeadsByEmail[email].totalSpent += transaction.Amount;
        
        if (new Date(transaction.Timestamp) > new Date(ebookLeadsByEmail[email].lastTransaction)) {
            ebookLeadsByEmail[email].lastTransaction = transaction.Timestamp;
        }
        
        // Update priority to highest
        const priorities = ['Low', 'Medium', 'High'];
        if (priorities.indexOf(transaction.Lead_Priority) > priorities.indexOf(ebookLeadsByEmail[email].highestPriority)) {
            ebookLeadsByEmail[email].highestPriority = transaction.Lead_Priority;
        }
    });

    Object.entries(ebookLeadsByEmail).forEach(([email, data], index) => {
        const lastTransaction = data.transactions[data.transactions.length - 1];
        const paidTransactions = data.transactions.filter(t => t.Transaction_Type === 'paid').length;
        const freeTransactions = data.transactions.filter(t => t.Transaction_Type === 'free').length;
        
        let lastMessage = '';
        if (paidTransactions > 0 && freeTransactions > 0) {
            lastMessage = `Cliente: ${paidTransactions} ebook premium + ${freeTransactions} gratuiti - €${data.totalSpent}`;
        } else if (paidTransactions > 0) {
            lastMessage = `Cliente premium: ${paidTransactions} ebook acquistati - €${data.totalSpent}`;
        } else {
            lastMessage = `Lead: ${freeTransactions} ebook gratuiti scaricati`;
        }

        const engagementScore = calculateEbookEngagementScore(data);
        const isHot = data.highestPriority === 'High' && 
                     (Date.now() - new Date(data.lastTransaction)) < 72 * 60 * 60 * 1000; // 72 hours

        leads.push({
            id: `ebook_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
            name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
            lastMessage: lastMessage,
            timestamp: data.lastTransaction,
            interest: determineEbookInterest(data.transactions),
            engagementScore: engagementScore,
            conversationCount: data.transactions.length,
            isHot: isHot,
            phone: '+393478881515', // Default for ebook leads
            source: 'Ebook',
            leadPriority: data.highestPriority,
            followUpStatus: lastTransaction.Follow_Up_Status,
            ebookData: {
                totalSpent: data.totalSpent,
                totalTransactions: data.transactions.length,
                paidTransactions: paidTransactions,
                freeTransactions: freeTransactions,
                products: [...new Set(data.transactions.map(t => t.Product_Title))],
                lastProduct: lastTransaction.Product_Title
            }
        });
    });

    // Add conversation-based leads (existing logic)
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

    // Sort by priority: Quiz leads first, then paid ebook customers, then free ebook leads, then conversations
    return leads.sort((a, b) => {
        // Source priority: Quiz > Ebook (paid) > Ebook (free) > Conversation
        const sourcePriority = {
            'Quiz': 4,
            'Ebook': a.ebookData?.paidTransactions > 0 ? 3 : 2,
            'Conversation': 1
        };
        
        if (sourcePriority[a.source] !== sourcePriority[b.source]) {
            return sourcePriority[b.source] - sourcePriority[a.source];
        }
        
        // Then by hot status
        if (a.isHot !== b.isHot) return b.isHot - a.isHot;
        
        // Then by engagement score
        return b.engagementScore - a.engagementScore;
    });
}

// NEW: Generate comprehensive ebook analytics
function generateEbookAnalytics(ebookTransactions) {
    if (ebookTransactions.length === 0) {
        return {
            totalTransactions: 0,
            totalFreeDownloads: 0,
            totalPaidSales: 0,
            totalRevenue: 0,
            avgOrderValue: 0,
            conversionRate: 0,
            salesGrowth: 0,
            todayRevenue: 0,
            productPerformance: {},
            revenueTrend: { days: [], revenue: [] },
            topProductsToday: [],
            paymentMethodBreakdown: {},
            customerSegmentation: {}
        };
    }

    const completed = ebookTransactions.filter(t => t.Status === 'completed');
    const free = completed.filter(t => t.Transaction_Type === 'free');
    const paid = completed.filter(t => t.Transaction_Type === 'paid');
    
    // Basic metrics
    const totalTransactions = completed.length;
    const totalFreeDownloads = free.length;
    const totalPaidSales = paid.length;
    const totalRevenue = paid.reduce((sum, t) => sum + t.Amount, 0);
    const avgOrderValue = totalPaidSales > 0 ? totalRevenue / totalPaidSales : 0;
    
    // Conversion rate (paid vs total)
    const conversionRate = totalTransactions > 0 ? 
        Math.round((totalPaidSales / totalTransactions) * 100) : 0;

    // Today's metrics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTransactions = completed.filter(t => new Date(t.Timestamp) >= today);
    const todayRevenue = todayTransactions
        .filter(t => t.Transaction_Type === 'paid')
        .reduce((sum, t) => sum + t.Amount, 0);

    // Product performance
    const productPerformance = {};
    completed.forEach(transaction => {
        const productId = transaction.Product_ID;
        if (!productPerformance[productId]) {
            productPerformance[productId] = {
                sales: 0,
                revenue: 0,
                title: transaction.Product_Title
            };
        }
        productPerformance[productId].sales++;
        if (transaction.Transaction_Type === 'paid') {
            productPerformance[productId].revenue += transaction.Amount;
        }
    });

    // Revenue trend (last 7 days)
    const revenueTrend = { days: [], revenue: [] };
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const dayRevenue = paid
            .filter(t => new Date(t.Timestamp) >= date && new Date(t.Timestamp) < nextDate)
            .reduce((sum, t) => sum + t.Amount, 0);
        
        revenueTrend.days.push(date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }));
        revenueTrend.revenue.push(Math.round(dayRevenue * 100) / 100);
    }

    // Top products today
    const todayProducts = {};
    todayTransactions.forEach(transaction => {
        const productId = transaction.Product_ID;
        if (!todayProducts[productId]) {
            todayProducts[productId] = {
                count: 0,
                revenue: 0,
                title: transaction.Product_Title,
                type: transaction.Transaction_Type
            };
        }
        todayProducts[productId].count++;
        if (transaction.Transaction_Type === 'paid') {
            todayProducts[productId].revenue += transaction.Amount;
        }
    });

    const topProductsToday = Object.values(todayProducts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    // Payment method breakdown
    const paymentMethodBreakdown = {};
    paid.forEach(transaction => {
        const method = transaction.Payment_Method;
        paymentMethodBreakdown[method] = (paymentMethodBreakdown[method] || 0) + 1;
    });

    // Customer segmentation
    const customerEmails = [...new Set(completed.map(t => t.Email))];
    const customerSegmentation = {
        totalCustomers: customerEmails.length,
        paidCustomers: [...new Set(paid.map(t => t.Email))].length,
        freeOnlyCustomers: [...new Set(free.map(t => t.Email))].filter(email => 
            !paid.some(p => p.Email === email)
        ).length
    };

    // Growth calculation (simplified - comparing last 7 days vs previous 7 days)
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const previous7Days = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    
    const recentSales = paid.filter(t => new Date(t.Timestamp) >= last7Days).length;
    const previousSales = paid.filter(t => 
        new Date(t.Timestamp) >= previous7Days && new Date(t.Timestamp) < last7Days
    ).length;
    
    const salesGrowth = previousSales > 0 ? 
        Math.round(((recentSales - previousSales) / previousSales) * 100) : 
        (recentSales > 0 ? 100 : 0);

    return {
        totalTransactions,
        totalFreeDownloads,
        totalPaidSales,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        conversionRate,
        salesGrowth,
        todayRevenue: Math.round(todayRevenue * 100) / 100,
        productPerformance,
        revenueTrend,
        topProductsToday,
        paymentMethodBreakdown,
        customerSegmentation
    };
}

// Calculate ebook engagement score
function calculateEbookEngagementScore(ebookData) {
    let score = 30; // Base score
    
    // Bonus for paid transactions
    score += ebookData.transactions.filter(t => t.Transaction_Type === 'paid').length * 25;
    
    // Bonus for multiple products
    const uniqueProducts = [...new Set(ebookData.transactions.map(t => t.Product_ID))];
    score += Math.min(uniqueProducts.length * 10, 30);
    
    // Bonus for recent activity
    const hoursSinceLastTransaction = (Date.now() - new Date(ebookData.lastTransaction)) / (1000 * 60 * 60);
    if (hoursSinceLastTransaction < 24) score += 20;
    else if (hoursSinceLastTransaction < 72) score += 10;
    
    // Bonus for high priority
    if (ebookData.highestPriority === 'High') score += 15;
    else if (ebookData.highestPriority === 'Medium') score += 5;
    
    return Math.min(Math.round(score), 100);
}

// Determine interest from ebook purchases
function determineEbookInterest(transactions) {
    const productInterests = {
        '50-workout': 'fitness',
        'wave-system': 'fitness',
        '2-milioni-anni': 'nutrition',
        'body-construction': 'fitness'
    };
    
    const interestCounts = {};
    transactions.forEach(t => {
        const interest = productInterests[t.Product_ID] || 'fitness';
        interestCounts[interest] = (interestCounts[interest] || 0) + 1;
    });
    
    return Object.keys(interestCounts).reduce((a, b) => 
        interestCounts[a] > interestCounts[b] ? a : b, 'fitness'
    );
}

// Enhanced trend data WITH ebook transactions
function generateTrendDataWithEbooks(conversations, quizResults, ebookTransactions) {
    const days = [];
    const conversationCounts = [];
    const quizCounts = [];
    const ebookCounts = []; // NEW
    
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
        
        // NEW: Ebook transactions per day
        const dayEbooks = ebookTransactions.filter(t => 
            new Date(t.Timestamp) >= date && new Date(t.Timestamp) < nextDate &&
            t.Status === 'completed'
        ).length;
        
        days.push(date.toLocaleDateString('it-IT', { weekday: 'short' }));
        conversationCounts.push(dayConversations);
        quizCounts.push(dayQuizzes);
        ebookCounts.push(dayEbooks); // NEW
    }
    
    return {
        days,
        conversations: conversationCounts,
        quizzes: quizCounts,
        ebooks: ebookCounts, // NEW
        total: conversationCounts.map((conv, i) => conv + quizCounts[i] + ebookCounts[i])
    };
}

// EXISTING HELPER FUNCTIONS (keeping all existing functionality)
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

function calculateQuizEngagementScore(quiz) {
    let score = 70; // Base score for completing quiz
    
    if (quiz.phone) score += 15;
    
    if (quiz.leadPriority === 'High') score += 15;
    else if (quiz.leadPriority === 'Medium') score += 5;
    
    const hoursSinceQuiz = (Date.now() - new Date(quiz.timestamp)) / (1000 * 60 * 60);
    if (hoursSinceQuiz < 2) score += 20;
    else if (hoursSinceQuiz < 24) score += 10;
    else if (hoursSinceQuiz < 72) score += 5;
    
    return Math.min(Math.round(score), 100);
}

function generateQuizAnalytics(quizResults) {
    if (quizResults.length === 0) {
        return {
            totalCompleted: 0,
            averageScores: {},
            scoreDistribution: {},
            priorityDistribution: {}
        };
    }

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

    const scoreRanges = { '1-2': 0, '2-3': 0, '3-4': 0, '4-5': 0 };
    quizResults.forEach(quiz => {
        const score = quiz.overallScore;
        if (score < 2) scoreRanges['1-2']++;
        else if (score < 3) scoreRanges['2-3']++;
        else if (score < 4) scoreRanges['3-4']++;
        else scoreRanges['4-5']++;
    });

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

function analyzeInterests(conversations, quizResults) {
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
            interestCounts.fitness++;
        }
    });
    
    quizResults.forEach(quiz => {
        const weakestArea = determineWeakestArea(quiz);
        const interest = mapScoreToInterest(weakestArea);
        interestCounts[interest]++;
    });
    
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

// Fallback data WITH ebook analytics
function generateFallbackDataWithEbooks() {
    console.log('⚠️ Using fallback data with ebook tracking - Airtable connection failed');
    
    return {
        overview: {
            todayConversations: 8,
            activeLeads: 32,
            conversionRate: 28,
            hotLeads: 7,
            todayQuizzes: 4,
            totalQuizCompleted: 15,
            todayEbookTransactions: 6,
            totalEbookLeads: 28
        },
        leads: [
            {
                id: 'ebook_premium_1',
                name: 'Marco Cliente',
                lastMessage: 'Cliente premium: 2 ebook acquistati - €39.80',
                timestamp: new Date(Date.now() - 1000 * 60 * 15),
                interest: 'fitness',
                engagementScore: 95,
                isHot: true,
                phone: '+393478881515',
                source: 'Ebook',
                leadPriority: 'High',
                ebookData: {
                    totalSpent: 39.80,
                    totalTransactions: 3,
                    paidTransactions: 2,
                    freeTransactions: 1,
                    products: ['IL WAVE SYSTEM', 'BODY UNDER CONSTRUCTION VOL 1', '50 WORKOUT da viaggio'],
                    lastProduct: 'BODY UNDER CONSTRUCTION VOL 1'
                }
            },
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
            ebooks: [2, 4, 6, 8, 3, 2, 1],
            total: [6, 11, 17, 22, 13, 7, 4]
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
        ebookAnalytics: {
            totalTransactions: 45,
            totalFreeDownloads: 32,
            totalPaidSales: 13,
            totalRevenue: 287.70,
            avgOrderValue: 22.13,
            conversionRate: 29,
            salesGrowth: 15,
            todayRevenue: 49.80,
            productPerformance: {
                '50-workout': { sales: 32, revenue: 0 },
                'wave-system': { sales: 8, revenue: 119.20 },
                '2-milioni-anni': { sales: 3, revenue: 74.70 },
                'body-construction': { sales: 2, revenue: 49.80 }
            },
            revenueTrend: {
                days: ['24 Gen', '25 Gen', '26 Gen', '27 Gen', '28 Gen', '29 Gen', '30 Gen'],
                revenue: [32.40, 67.30, 19.90, 74.70, 49.80, 24.90, 18.70]
            },
            topProductsToday: [
                { title: '50 WORKOUT da viaggio', count: 4, revenue: 0, type: 'free' },
                { title: 'BODY UNDER CONSTRUCTION VOL 1', count: 2, revenue: 49.80, type: 'paid' }
            ],
            paymentMethodBreakdown: {
                stripe: 8,
                paypal: 5
            },
            customerSegmentation: {
                totalCustomers: 28,
                paidCustomers: 11,
                freeOnlyCustomers: 17
            }
        },
        ebookTransactions: [
            {
                id: 'rec123',
                Email: 'marco.rossi@email.it',
                Product_ID: 'body-construction',
                Product_Title: 'BODY UNDER CONSTRUCTION VOL 1',
                Transaction_Type: 'paid',
                Amount: 24.90,
                Payment_Method: 'stripe',
                Status: 'completed',
                Timestamp: new Date(Date.now() - 1000 * 60 * 15),
                Customer_Country: 'IT',
                Session_ID: 'sess_abc123',
                User_Agent: 'Mozilla/5.0',
                Download_Count: 1,
                Last_Download: new Date(Date.now() - 1000 * 60 * 10),
                Lead_Priority: 'High',
                Follow_Up_Status: 'New',
                Revenue_Category: 'Premium Sale',
                Marketing_Source: 'Website'
            },
            {
                id: 'rec456',
                Email: 'lucia.verdi@gmail.com',
                Product_ID: '50-workout',
                Product_Title: '50 WORKOUT da viaggio',
                Transaction_Type: 'free',
                Amount: 0,
                Payment_Method: 'email',
                Status: 'completed',
                Timestamp: new Date(Date.now() - 1000 * 60 * 45),
                Customer_Country: 'IT',
                Session_ID: 'sess_def456',
                User_Agent: 'Mozilla/5.0',
                Download_Count: 2,
                Last_Download: new Date(Date.now() - 1000 * 60 * 30),
                Lead_Priority: 'Medium',
                Follow_Up_Status: 'New',
                Revenue_Category: 'Lead Generation',
                Marketing_Source: 'Social Media'
            },
            {
                id: 'rec789',
                Email: 'alessandro.bianchi@yahoo.it',
                Product_ID: 'wave-system',
                Product_Title: 'IL WAVE SYSTEM',
                Transaction_Type: 'paid',
                Amount: 14.90,
                Payment_Method: 'paypal',
                Status: 'completed',
                Timestamp: new Date(Date.now() - 1000 * 60 * 120),
                Customer_Country: 'IT',
                Session_ID: 'sess_ghi789',
                User_Agent: 'Mozilla/5.0',
                Download_Count: 1,
                Last_Download: new Date(Date.now() - 1000 * 60 * 115),
                Lead_Priority: 'High',
                Follow_Up_Status: 'Contacted',
                Revenue_Category: 'Premium Sale',
                Marketing_Source: 'Organic'
            }
        ],
        lastUpdated: new Date().toISOString(),
        dataSource: 'fallback_with_ebook_tracking'
    };
}
            