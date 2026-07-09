import client from './client';

export const getReviews = (productId) => client.get(`/products/${productId}/reviews`);
export const submitReview = (productId, payload) => client.post(`/products/${productId}/reviews`, payload);
export const markReviewHelpful = (reviewId) => client.post(`/products/reviews/${reviewId}/helpful`);

export const getQuestions = (productId) => client.get(`/reviews/${productId}/questions`);
export const askQuestion = (productId, questionText) => client.post(`/reviews/${productId}/questions`, { questionText });
