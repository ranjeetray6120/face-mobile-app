import { useMutation } from '@tanstack/react-query';
import api from '../api';

export const useFaceMatch = () => {
    return useMutation({
        mutationFn: async ({ eventId, imageBlob }) => {
            const formData = new FormData();
            formData.append('file', imageBlob, 'face.jpg');

            // Note: Controller endpoint is /guest/events/{eventId}/match-face
            // And it expects 'file' param, not 'image' based on previous inspection
            const { data } = await api.post(`/guest/events/${eventId}/match-face`, formData);
            return data;
        },
    });
};
