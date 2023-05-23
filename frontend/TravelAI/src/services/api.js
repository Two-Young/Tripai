import axios from 'axios';

const API_URL = 'http://43.200.219.71:10375';

const api = axios.create({
  baseURL: API_URL,
});

export const getPing = async () => {
  const response = await api.get('/ping');
  return response.data;
};

export const authGoogleSign = async idToken => {
  try {
    const response = await api.post('/auth/google/sign', {id_token: idToken});
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const authFacebookSign = async accessToken => {
  try {
    const response = await api.post('/auth/facebook/sign', {id_token: accessToken});
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const authNaverSign = async accessToken => {
  try {
    console.log('accessToken: ', accessToken);
    const response = await api.post('/auth/naver/sign', {id_token: accessToken});
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response.data;
  }
};

export const authInstagramSign = async accessToken => {
  try {
    const response = await api.post('/auth/instagram/sign', {id_token: accessToken});
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
