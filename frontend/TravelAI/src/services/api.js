import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {useRecoilState} from 'recoil';
import userAtom from '../recoil/user/user';
import React from 'react';
import reactotron from 'reactotron-react-native';

export const API_URL_PROD = 'http://43.200.219.71:10375';
export const API_URL_DEBUG = 'http://180.226.155.13:10375/';

const api = axios.create({
  baseURL: API_URL_PROD,
  timeout: 10000,
});

// 응답에서 발생한 401 Unauthorized 에러에 대한 Interceptor

export const AxiosInterceptor = () => {
  const [user, setUser] = useRecoilState(userAtom);

  // Reactotron.log('user : ', user);

  const setAuthHeader = token => {
    // Reactotron.log('token : ', token);
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common.Authorization;
    }
  };

  React.useEffect(() => {
    let interceptor = null;
    if (user) {
      setAuthHeader(user?.auth_tokens?.access_token?.token);

      // 새로운 interceptor 생성
      interceptor = api.interceptors.response.use(
        response => {
          return response;
        },
        async error => {
          const {
            config,
            response: {status, data},
          } = error;
          if (status === 401) {
            if (data.error === 'all auth-dissolve methods failed') {
              setUser(null);
              delete api.defaults.headers.common.Authorization;
              await AsyncStorage.removeItem('user');
            }
          }

          if (error.response.status === 401 && !config._retry) {
            config._retry = true;
            const {access_token, refresh_token} = await authRefreshToken(
              user?.auth_tokens?.refresh_token?.token,
            ); // 여기서는 예시로 함수로 받아옴
            if (access_token) {
              setUser({...user, tokens: {access_token, refresh_token}});
              api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
              return api(config);
            }
          }
          return Promise.reject(error);
        },
      );
    }
    // cleanup 함수
    return () => {
      axios.interceptors.response.eject(interceptor);
      axios.defaults.headers.common.Authorization = null;
    };
  }, [user]);

  return null;
};

export const getPing = async () => {
  const response = await api.get('/ping');
  return response.data;
};

// auth
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
    const response = await api.post('/auth/naver/sign', {id_token: accessToken});
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response.data;
  }
};

export const authKakaoSign = async accessToken => {
  try {
    const response = await api.post('/auth/kakao/sign', {id_token: accessToken});
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const authRefreshToken = async refreshToken => {
  try {
    api.header['X-Refresh-Token'] = refreshToken;
    const response = await api.post('/auth/refreshToken');
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// platform

export const locateAutoComplete = async query => {
  try {
    const response = await api.post('/platform/locate/auto-complete', {
      input: query,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const locateDetail = async placeid => {
  try {
    const response = await api.get('/platform/locate/location', {
      params: {
        place_id: placeid,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const locateDirection = async (origin_place_id, destination_place_id) => {
  try {
    const response = await api.get('/platform/locate/direction', {
      params: {
        origin_place_id,
        destination_place_id,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const locatePin = async (latitude, longitude) => {
  try {
    const response = await api.get('/platform/locate/pin', {
      params: {
        latitude,
        longitude,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const locatePlacePhoto = async (reference, max_width) => {
  try {
    const response = await api.get('/platform/locate/place-photo', {
      params: {
        reference,
        max_width,
      },
      responseType: 'arraybuffer',
    });
    reactotron.log('response!! : ', response.data);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const locateLocation = async place_id => {
  try {
    const response = await api.get('/platform/locate/location', {
      params: {
        place_id,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const locateCountries = async () => {
  try {
    const response = await api.get('/platform/locate/countries');
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// platform - session
export const getSessions = async () => {
  try {
    const response = await api.get('/platform/session');
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const createSession = async (country_codes, start_at, end_at) => {
  try {
    const response = await api.put('/platform/session', {
      country_codes,
      start_at,
      end_at,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const deleteSession = async session_id => {
  try {
    console.log(session_id);
    const response = await api.delete('/platform/session', {
      data: {
        session_id,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// platform - location
export const getLocations = async session_id => {
  try {
    const response = await api.get('/platform/location', {
      params: {
        session_id,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const createLocation = async (session_id, place_id) => {
  try {
    const response = await api.put('/platform/location', {
      session_id,
      place_id,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const deleteLocation = async location_id => {
  try {
    const response = await api.delete('/platform/location', {
      data: {
        location_id,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

// platform - budget
export const getBudgetList = async () => {
  try {
    const response = await api.get('/platform/budget/list');
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const createBudget = async (sessiontoken, title, amount, currency) => {
  try {
    const response = await api.post('/platform/budget', {
      sessiontoken,
      title,
      amount,
      currency,
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
