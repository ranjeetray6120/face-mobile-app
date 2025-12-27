import { useQuery } from '@tanstack/react-query';
import api from '../api';

export const useEvent = (eventId) => {
    return useQuery({
        queryKey: ['event', eventId],
        queryFn: async () => {
            if (!eventId) return null;
            const { data } = await api.get(`/guest/events/${eventId}`);
            return data;
        },
        enabled: !!eventId, // Only run if eventId exists
        retry: 1,
    });
};
