// ============================================
// SUPABASE INTEGRATION
// ============================================

// Supabase Configuration
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_KEY = 'your-anon-key';

// Initialize Supabase client
let supabase = null;

try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('Supabase client initialized');
} catch (error) {
    console.error('Failed to initialize Supabase:', error);
}

// Database Schema
const TABLES = {
    WORK_SCOPE: 'work_scope',
    DAILY_WORK: 'daily_work',
    INFRASTRUCTURE: 'infrastructure',
    INFRASTRUCTURE_INFO: 'infrastructure_info',
    CHAMBERS: 'chambers',
    USERS: 'users',
    ACTIVITIES: 'activities'
};

// Data Operations
const DataService = {
    // Work Scope Operations
    async getWorkScope() {
        try {
            const { data, error } = await supabase
                .from(TABLES.WORK_SCOPE)
                .select('*')
                .order('block');
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching work scope:', error);
            return [];
        }
    },
    
    async saveWorkScope(block, totalScope) {
        try {
            const { data, error } = await supabase
                .from(TABLES.WORK_SCOPE)
                .upsert({
                    block: block,
                    total_scope: totalScope,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'block'
                });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error saving work scope:', error);
            return { success: false, error };
        }
    },
    
    // Daily Work Operations
    async getDailyWork(filters = {}) {
        try {
            let query = supabase
                .from(TABLES.DAILY_WORK)
                .select('*')
                .order('work_date', { ascending: false });
            
            // Apply filters
            if (filters.block && filters.block !== 'all') {
                query = query.eq('block', filters.block);
            }
            
            if (filters.startDate && filters.endDate) {
                query = query.gte('work_date', filters.startDate)
                           .lte('work_date', filters.endDate);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching daily work:', error);
            return [];
        }
    },
    
    async saveDailyWork(workData) {
        try {
            const { data, error } = await supabase
                .from(TABLES.DAILY_WORK)
                .insert({
                    district: workData.district,
                    block: workData.block,
                    machine_number: workData.machineNumber,
                    ring_name: workData.ringName,
                    route_name: workData.routeName,
                    work_date: workData.date,
                    work_done: workData.workDone,
                    description: workData.description,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error saving daily work:', error);
            return { success: false, error };
        }
    },
    
    async updateDailyWork(id, workData) {
        try {
            const { data, error } = await supabase
                .from(TABLES.DAILY_WORK)
                .update({
                    district: workData.district,
                    block: workData.block,
                    machine_number: workData.machineNumber,
                    ring_name: workData.ringName,
                    route_name: workData.routeName,
                    work_date: workData.date,
                    work_done: workData.workDone,
                    description: workData.description,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error updating daily work:', error);
            return { success: false, error };
        }
    },
    
    async deleteDailyWork(id) {
        try {
            const { error } = await supabase
                .from(TABLES.DAILY_WORK)
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error deleting daily work:', error);
            return { success: false, error };
        }
    },
    
    // Infrastructure Operations
    async getInfrastructure(filters = {}) {
        try {
            let query = supabase
                .from(TABLES.INFRASTRUCTURE)
                .select('*')
                .order('created_at', { ascending: false });
            
            // Apply filters
            if (filters.block && filters.block !== 'all') {
                query = query.eq('block', filters.block);
            }
            
            if (filters.liveStatus && filters.liveStatus !== 'all') {
                query = query.eq('live_status', filters.liveStatus);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching infrastructure:', error);
            return [];
        }
    },
    
    async saveInfrastructure(infraData) {
        try {
            const { data, error } = await supabase
                .from(TABLES.INFRASTRUCTURE)
                .insert({
                    block: infraData.block,
                    gp_name: infraData.gpName,
                    ring_name: infraData.ringName,
                    building: infraData.building,
                    router_category: infraData.routerCategory,
                    router_status: infraData.routerStatus,
                    status: infraData.status,
                    electricity_meter: infraData.electricityMeter,
                    live_status: infraData.liveStatus,
                    live_date: infraData.liveDate,
                    not_live_reason: infraData.notLiveReason,
                    notes: infraData.notes,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error saving infrastructure:', error);
            return { success: false, error };
        }
    },
    
    // Infrastructure Info Operations
    async getInfrastructureInfo(filters = {}) {
        try {
            let query = supabase
                .from(TABLES.INFRASTRUCTURE_INFO)
                .select('*')
                .order('created_at', { ascending: false });
            
            if (filters.block && filters.block !== 'all') {
                query = query.eq('block', filters.block);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching infrastructure info:', error);
            return [];
        }
    },
    
    // Chambers Operations
    async getChambers(filters = {}) {
        try {
            let query = supabase
                .from(TABLES.CHAMBERS)
                .select('*')
                .order('created_at', { ascending: false });
            
            if (filters.block && filters.block !== 'all') {
                query = query.eq('block', filters.block);
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching chambers:', error);
            return [];
        }
    },
    
    // Analytics Operations
    async getAnalyticsData(period = '30d') {
        try {
            // Calculate date range based on period
            const endDate = new Date();
            const startDate = new Date();
            
            switch (period) {
                case '7d':
                    startDate.setDate(endDate.getDate() - 7);
                    break;
                case '30d':
                    startDate.setDate(endDate.getDate() - 30);
                    break;
                case '90d':
                    startDate.setDate(endDate.getDate() - 90);
                    break;
                default:
                    startDate.setDate(endDate.getDate() - 30);
            }
            
            // Fetch data for analytics
            const [dailyWork, infrastructure, chambers] = await Promise.all([
                this.getDailyWork({
                    startDate: startDate.toISOString().split('T')[0],
                    endDate: endDate.toISOString().split('T')[0]
                }),
                this.getInfrastructure(),
                this.getChambers()
            ]);
            
            return {
                dailyWork,
                infrastructure,
                chambers,
                period
            };
        } catch (error) {
            console.error('Error fetching analytics data:', error);
            return null;
        }
    },
    
    // Export Operations
    async exportToExcel(dataType, filters = {}) {
        try {
            let data;
            let fileName;
            
            switch (dataType) {
                case 'daily-work':
                    data = await this.getDailyWork(filters);
                    fileName = `Daily_Work_${new Date().toISOString().split('T')[0]}.xlsx`;
                    break;
                case 'infrastructure':
                    data = await this.getInfrastructure(filters);
                    fileName = `Infrastructure_${new Date().toISOString().split('T')[0]}.xlsx`;
                    break;
                case 'chambers':
                    data = await this.getChambers(filters);
                    fileName = `Chambers_${new Date().toISOString().split('T')[0]}.xlsx`;
                    break;
                default:
                    throw new Error('Invalid data type');
            }
            
            // Convert to Excel
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Data');
            XLSX.writeFile(wb, fileName);
            
            return { success: true, fileName };
        } catch (error) {
            console.error('Error exporting data:', error);
            return { success: false, error };
        }
    },
    
    // File Upload Operations
    async uploadFile(file, bucket = 'photos') {
        try {
            const fileName = `${Date.now()}-${file.name}`;
            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(fileName, file);
            
            if (error) throw error;
            
            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(fileName);
            
            return { success: true, url: publicUrl, fileName };
        } catch (error) {
            console.error('Error uploading file:', error);
            return { success: false, error };
        }
    },
    
    // System Status
    async checkSystemStatus() {
        try {
            const { data, error } = await supabase
                .from('system_status')
                .select('*')
                .limit(1);
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error checking system status:', error);
            return { success: false, error };
        }
    }
};

// Initialize Supabase tables
async function initSupabaseTables() {
    const tables = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
    
    console.log('Existing tables:', tables.data);
    
    // Check if tables exist, create if not
    // Note: In production, you should run SQL migrations
}

// Export for use in other modules
window.DataService = DataService;
window.supabaseClient = supabase;

// Initialize when ready
document.addEventListener('DOMContentLoaded', () => {
    if (supabase) {
        initSupabaseTables();
    }
});
