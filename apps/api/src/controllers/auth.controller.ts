import { AuthService } from '../services/auth.service';
import { GlobalMemoryStore } from '../../../../packages/db/src/adapters/in-memory.adapter';
import { successResponse, errorResponse } from '../utils/response';

export const login = async (req: any, reply: any) => {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    
    if (!result) {
        return reply.code(401).send(errorResponse('Invalid credentials', 'AUTH_FAILED'));
    }
    
    return reply.code(200).send(successResponse(result));
};

export const getMe = async (req: any, reply: any) => {
    return reply.code(200).send(successResponse({ user: req.user }));
};

export const getProjects = async (req: any, reply: any) => {
    const userRole = req.user.role;
    const tenantId = req.user.tenantId;
    const assignedIds = req.user.assignedProjects;
    
    const allProjects = Array.from(GlobalMemoryStore.projects.values());
    
    // 1. SUPER_ADMIN sees everything across all tenants
    if (userRole === 'SUPER_ADMIN') {
        return reply.code(200).send(successResponse(allProjects));
    }
    
    // 2. Filter by Tenant first (Isolation)
    let filtered = allProjects.filter(p => p.tenantId === tenantId);
    
    // 3. For roles other than TENANT_ADMIN, restrict to assigned projects only
    if (userRole !== 'TENANT_ADMIN') {
        filtered = filtered.filter(p => assignedIds.includes(p.id));
    }
    
    return reply.code(200).send(successResponse(filtered));
};
