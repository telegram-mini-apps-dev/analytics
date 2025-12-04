export async function checkAuthError(res: Response): Promise<boolean> {
    if (res.status === 400 || res.status === 403) {
        try {
            const responseText = await res.clone().text();
            const responseData = responseText ? JSON.parse(responseText) : {};
            const errorMessage = (responseData.message || responseData.error || '').toLowerCase();
            
            return errorMessage.includes('invalid app_name');
        } catch (e) {
            return false;
        }
    }
    return false;
}


