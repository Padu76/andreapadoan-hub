// /api/analytics.js
// API per raccogliere e processare dati comportamentali utenti

export default async function handler(req, res) {
    // Configurazione CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        // Configurazione Airtable
        const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
        const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
        const ANALYTICS_TABLE = process.env.AIRTABLE_ANALYTICS_TABLE || 'analytics';

        if (!AIRTABLE_BASE_ID || !AIRTABLE_API_KEY) {
            console.error('❌ Missing Airtable credentials');
            return res.status(500).json({ 
                error: 'Configuration missing'
            });
        }

        switch (req.method) {
            case 'GET':
                return await getAnalyticsData(req, res, AIRTABLE_BASE_ID, ANALYTICS_TABLE, AIRTABLE_API_KEY);
            case 'POST':
                return await saveAnalyticsData(req, res, AIRTABLE_BASE_ID, ANALYTICS_TABLE, AIRTABLE_API_KEY);
            default:
                return res.status(405).json({ error: 'Method not allowed' });
        }

    } catch (error) {
        console.error('❌ Error in analytics API:', error);
        
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}

// POST - Salva dati analytics
async function saveAnalyticsData(req, res, baseId, tableName, apiKey) {
    try {
        const { type, event, events, sessionId, summary } = req.body;
        
        if (type === 'event') {
            // Salva evento singolo
            await saveEvent(event, baseId, tableName, apiKey);
            
            console.log('✅ Analytics event saved:', event.action);
            
            return res.status(200).json({
                success: true,
                message: 'Event saved successfully'
            });
            
        } else if (type === 'batch') {
            // Salva batch di eventi
            const results = await saveBatchEvents(events, summary, sessionId, baseId, tableName, apiKey);
            
            console.log('✅ Analytics batch saved:', events.length, 'events');
            
            return res.status(200).json({
                success: true,
                message: 'Batch saved successfully',
                processed: results.length
            });
        }
        
        return res.status(400).json({
            error: 'Invalid request type'
        });

    } catch (error) {
        console.error('❌ Error saving analytics data:', error);
        return res.status(500).json({
            error: 'Failed to save analytics data',
            message: error.message
        });
    }
}

// GET - Recupera dati analytics
async function getAnalyticsData(req, res, baseId, tableName, apiKey) {
    try {
        const { period = '7d', metric = 'all' } = req.query;
        
        console.log('📊 Loading analytics data...');
        
        // Carica dati da Airtable
        const airtableUrl = `https://api.airtable.com/v0/${baseId}/${tableName}`;
        
        const response = await fetch(airtableUrl, {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Airtable API error: ${response.status}`);
        }

        const data = await response.json();
        
        // Processa e analizza dati
        const analytics = await processAnalyticsData(data.records, period, metric);
        
        console.log('✅ Analytics data processed successfully');

        res.status(200).json({
            success: true,
            analytics,
            period,
            lastUpdate: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error getting analytics data:', error);
        throw error;
    }
}

// Salva evento singolo
async function saveEvent(event, baseId, tableName, apiKey) {
    const airtableUrl = `https://api.airtable.com/v0/${baseId}/${tableName}`;
    
    const record = {
        fields: {
            Session_ID: event.sessionId,
            Action: event.action,
            Category: event.category,
            Element_Type: event.data.elementType || '',
            Element_Text: event.data.elementText || '',
            Element_URL: event.data.elementHref || '',
            Section_Name: event.data.sectionName || '',
            Timestamp: event.timestamp,
            Time_To_Action: event.data.timeToClick || event.data.timeToView || 0,
            Scroll_Depth: event.data.scrollDepth || 0,
            Device_Type: event.data.device?.isMobile ? 'mobile' : 'desktop',
            Browser: event.data.device?.browser || '',
            OS: event.data.device?.os || '',
            Screen_Width: event.data.device?.screenWidth || 0,
            Screen_Height: event.data.device?.screenHeight || 0,
            Referrer: event.data.device?.referrer || '',
            User_Agent: event.userAgent || '',
            Page_URL: event.url || '',
            Event_Data: JSON.stringify(event.data)
        }
    };

    const response = await fetch(airtableUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(record)
    });

    if (!response.ok) {
        throw new Error(`Failed to save event: ${response.status}`);
    }

    return await response.json();
}

// Salva batch di eventi
async function saveBatchEvents(events, summary, sessionId, baseId, tableName, apiKey) {
    const airtableUrl = `https://api.airtable.com/v0/${baseId}/${tableName}`;
    
    // Prepara tutti i record
    const records = events.map(event => ({
        fields: {
            Session_ID: sessionId,
            Action: event.action,
            Category: event.category,
            Element_Type: event.data.elementType || '',
            Element_Text: event.data.elementText || '',
            Element_URL: event.data.elementHref || '',
            Section_Name: event.data.sectionName || '',
            Timestamp: event.timestamp,
            Time_To_Action: event.data.timeToClick || event.data.timeToView || 0,
            Scroll_Depth: event.data.scrollDepth || 0,
            Device_Type: event.data.device?.isMobile ? 'mobile' : 'desktop',
            Browser: event.data.device?.browser || '',
            OS: event.data.device?.os || '',
            Screen_Width: event.data.device?.screenWidth || 0,
            Screen_Height: event.data.device?.screenHeight || 0,
            Referrer: event.data.device?.referrer || '',
            User_Agent: event.userAgent || '',
            Page_URL: event.url || '',
            Event_Data: JSON.stringify(event.data)
        }
    }));

    // Salva anche riassunto sessione
    if (summary) {
        records.push({
            fields: {
                Session_ID: sessionId,
                Action: 'session_summary',
                Category: 'session',
                Element_Type: 'summary',
                Timestamp: new Date().toISOString(),
                Time_To_Action: summary.totalTime || 0,
                Scroll_Depth: summary.maxScrollDepth || 0,
                Device_Type: summary.deviceInfo?.isMobile ? 'mobile' : 'desktop',
                Browser: summary.deviceInfo?.browser || '',
                OS: summary.deviceInfo?.os || '',
                Screen_Width: summary.deviceInfo?.screenWidth || 0,
                Screen_Height: summary.deviceInfo?.screenHeight || 0,
                Referrer: summary.deviceInfo?.referrer || '',
                User_Agent: summary.deviceInfo?.userAgent || '',
                Event_Data: JSON.stringify({
                    sectionsViewed: summary.sectionsViewed,
                    sectionTimes: summary.sectionTimes,
                    deviceInfo: summary.deviceInfo
                })
            }
        });
    }

    // Invia in batch (max 10 record per volta per Airtable)
    const results = [];
    for (let i = 0; i < records.length; i += 10) {
        const batch = records.slice(i, i + 10);
        
        const response = await fetch(airtableUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ records: batch })
        });

        if (!response.ok) {
            throw new Error(`Failed to save batch: ${response.status}`);
        }

        const result = await response.json();
        results.push(...result.records);
    }

    return results;
}

// Processa dati analytics per dashboard
async function processAnalyticsData(records, period, metric) {
    const now = new Date();
    const periodStart = getPeriodStart(period, now);
    
    // Filtra per periodo
    const filteredRecords = records.filter(record => {
        const timestamp = new Date(record.fields.Timestamp);
        return timestamp >= periodStart;
    });

    // Calcola metriche
    const analytics = {
        overview: calculateOverview(filteredRecords),
        traffic: calculateTraffic(filteredRecords),
        engagement: calculateEngagement(filteredRecords),
        content: calculateContentMetrics(filteredRecords),
        devices: calculateDeviceMetrics(filteredRecords),
        behavior: calculateBehaviorMetrics(filteredRecords),
        conversion: calculateConversionMetrics(filteredRecords),
        heatmap: calculateHeatmapData(filteredRecords),
        timeline: calculateTimelineData(filteredRecords, period)
    };

    return analytics;
}

function getPeriodStart(period, now) {
    switch (period) {
        case '1d':
            return new Date(now.getTime() - 24 * 60 * 60 * 1000);
        case '7d':
            return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case '30d':
            return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        case '90d':
            return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        default:
            return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
}

function calculateOverview(records) {
    const uniqueSessions = new Set();
    const pageViews = records.filter(r => r.fields.Action === 'page_load').length;
    const totalEvents = records.length;
    
    records.forEach(record => {
        if (record.fields.Session_ID) {
            uniqueSessions.add(record.fields.Session_ID);
        }
    });

    const sessions = uniqueSessions.size;
    const bounceRate = calculateBounceRate(records);
    const avgSessionTime = calculateAvgSessionTime(records);

    return {
        sessions,
        pageViews,
        totalEvents,
        bounceRate,
        avgSessionTime,
        eventsPerSession: sessions > 0 ? Math.round(totalEvents / sessions) : 0
    };
}

function calculateTraffic(records) {
    const deviceTypes = {};
    const browsers = {};
    const os = {};
    const referrers = {};

    records.forEach(record => {
        const fields = record.fields;
        
        // Device types
        const deviceType = fields.Device_Type || 'unknown';
        deviceTypes[deviceType] = (deviceTypes[deviceType] || 0) + 1;
        
        // Browsers
        const browser = fields.Browser || 'unknown';
        browsers[browser] = (browsers[browser] || 0) + 1;
        
        // OS
        const osName = fields.OS || 'unknown';
        os[osName] = (os[osName] || 0) + 1;
        
        // Referrers
        const referrer = fields.Referrer || 'direct';
        referrers[referrer] = (referrers[referrer] || 0) + 1;
    });

    return {
        deviceTypes,
        browsers,
        os,
        referrers
    };
}

function calculateEngagement(records) {
    const scrollDepths = [];
    const timeToActions = [];
    const sectionsViewed = {};

    records.forEach(record => {
        const fields = record.fields;
        
        if (fields.Scroll_Depth) {
            scrollDepths.push(fields.Scroll_Depth);
        }
        
        if (fields.Time_To_Action) {
            timeToActions.push(fields.Time_To_Action);
        }
        
        if (fields.Section_Name) {
            sectionsViewed[fields.Section_Name] = (sectionsViewed[fields.Section_Name] || 0) + 1;
        }
    });

    const avgScrollDepth = scrollDepths.length > 0 ? 
        Math.round(scrollDepths.reduce((a, b) => a + b, 0) / scrollDepths.length) : 0;
    
    const avgTimeToAction = timeToActions.length > 0 ? 
        Math.round(timeToActions.reduce((a, b) => a + b, 0) / timeToActions.length) : 0;

    return {
        avgScrollDepth,
        avgTimeToAction,
        sectionsViewed
    };
}

function calculateContentMetrics(records) {
    const clicksByElement = {};
    const viewsBySection = {};
    const topElements = {};

    records.forEach(record => {
        const fields = record.fields;
        
        if (fields.Action === 'click' && fields.Element_Type) {
            const key = `${fields.Element_Type}:${fields.Element_Text}`;
            clicksByElement[key] = (clicksByElement[key] || 0) + 1;
        }
        
        if (fields.Action === 'section_view' && fields.Section_Name) {
            viewsBySection[fields.Section_Name] = (viewsBySection[fields.Section_Name] || 0) + 1;
        }
        
        if (fields.Element_Type) {
            topElements[fields.Element_Type] = (topElements[fields.Element_Type] || 0) + 1;
        }
    });

    // Ordina per popolarità
    const sortedClicks = Object.entries(clicksByElement)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);

    const sortedSections = Object.entries(viewsBySection)
        .sort(([,a], [,b]) => b - a);

    return {
        clicksByElement: Object.fromEntries(sortedClicks),
        viewsBySection: Object.fromEntries(sortedSections),
        topElements
    };
}

function calculateDeviceMetrics(records) {
    const screenSizes = {};
    const mobileVsDesktop = { mobile: 0, desktop: 0 };

    records.forEach(record => {
        const fields = record.fields;
        
        if (fields.Screen_Width && fields.Screen_Height) {
            const size = `${fields.Screen_Width}x${fields.Screen_Height}`;
            screenSizes[size] = (screenSizes[size] || 0) + 1;
        }
        
        const deviceType = fields.Device_Type || 'desktop';
        if (mobileVsDesktop[deviceType] !== undefined) {
            mobileVsDesktop[deviceType]++;
        }
    });

    return {
        screenSizes,
        mobileVsDesktop
    };
}

function calculateBehaviorMetrics(records) {
    const scrollMilestones = {};
    const timeMilestones = {};
    const exitPages = {};

    records.forEach(record => {
        const fields = record.fields;
        
        if (fields.Action === 'scroll_milestone') {
            const milestone = fields.Event_Data;
            try {
                const data = JSON.parse(milestone);
                if (data.milestone) {
                    scrollMilestones[data.milestone] = (scrollMilestones[data.milestone] || 0) + 1;
                }
            } catch (e) {
                // Ignore parsing errors
            }
        }
        
        if (fields.Action === 'time_milestone') {
            const milestone = fields.Event_Data;
            try {
                const data = JSON.parse(milestone);
                if (data.milestone) {
                    timeMilestones[data.milestone] = (timeMilestones[data.milestone] || 0) + 1;
                }
            } catch (e) {
                // Ignore parsing errors
            }
        }
        
        if (fields.Action === 'page_exit') {
            const url = fields.Page_URL || 'unknown';
            exitPages[url] = (exitPages[url] || 0) + 1;
        }
    });

    return {
        scrollMilestones,
        timeMilestones,
        exitPages
    };
}

function calculateConversionMetrics(records) {
    const conversions = {
        chat_opened: 0,
        whatsapp_clicked: 0,
        email_clicked: 0,
        project_clicked: 0,
        form_submitted: 0
    };

    records.forEach(record => {
        const fields = record.fields;
        
        switch (fields.Action) {
            case 'click':
                if (fields.Element_Type === 'chat') conversions.chat_opened++;
                if (fields.Element_Type === 'whatsapp') conversions.whatsapp_clicked++;
                if (fields.Element_Type === 'email') conversions.email_clicked++;
                if (fields.Element_Type === 'project') conversions.project_clicked++;
                break;
            case 'form_submit':
                conversions.form_submitted++;
                break;
        }
    });

    return conversions;
}

function calculateHeatmapData(records) {
    const heatmapData = {};
    
    records.forEach(record => {
        const fields = record.fields;
        
        if (fields.Action === 'click' && fields.Event_Data) {
            try {
                const data = JSON.parse(fields.Event_Data);
                if (data.position) {
                    const key = `${Math.round(data.position.x/50)*50}-${Math.round(data.position.y/50)*50}`;
                    heatmapData[key] = (heatmapData[key] || 0) + 1;
                }
            } catch (e) {
                // Ignore parsing errors
            }
        }
    });

    return heatmapData;
}

function calculateTimelineData(records, period) {
    const timeline = {};
    const interval = period === '1d' ? 'hour' : 'day';
    
    records.forEach(record => {
        const timestamp = new Date(record.fields.Timestamp);
        let timeKey;
        
        if (interval === 'hour') {
            timeKey = `${timestamp.getFullYear()}-${timestamp.getMonth()}-${timestamp.getDate()}-${timestamp.getHours()}`;
        } else {
            timeKey = `${timestamp.getFullYear()}-${timestamp.getMonth()}-${timestamp.getDate()}`;
        }
        
        if (!timeline[timeKey]) {
            timeline[timeKey] = {
                pageViews: 0,
                clicks: 0,
                events: 0
            };
        }
        
        timeline[timeKey].events++;
        
        if (record.fields.Action === 'page_load') {
            timeline[timeKey].pageViews++;
        } else if (record.fields.Action === 'click') {
            timeline[timeKey].clicks++;
        }
    });

    return timeline;
}

function calculateBounceRate(records) {
    // Semplificato: considera bounce se solo 1 evento per sessione
    const sessionEvents = {};
    
    records.forEach(record => {
        const sessionId = record.fields.Session_ID;
        if (sessionId) {
            sessionEvents[sessionId] = (sessionEvents[sessionId] || 0) + 1;
        }
    });

    const totalSessions = Object.keys(sessionEvents).length;
    const bouncedSessions = Object.values(sessionEvents).filter(count => count <= 1).length;
    
    return totalSessions > 0 ? Math.round((bouncedSessions / totalSessions) * 100) : 0;
}

function calculateAvgSessionTime(records) {
    const sessionTimes = {};
    
    records.forEach(record => {
        const fields = record.fields;
        if (fields.Action === 'session_summary' && fields.Time_To_Action) {
            sessionTimes[fields.Session_ID] = fields.Time_To_Action;
        }
    });

    const times = Object.values(sessionTimes);
    return times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
}