import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {useRecoilState} from 'recoil';
import userAtom from '../recoil/user/user';
import React from 'react';
import reactotron from 'reactotron-react-native';
import {navigate} from '../navigation/RootNavigator';
import {Alert} from 'react-native';

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

  const setRefreshTokenHeader = token => {
    if (token) {
      reactotron.log('before refresh token : ', api.defaults.headers.common['X-Refresh-Token']);
      api.defaults.headers.common['X-Refresh-Token'] = token;
      reactotron.log('after refresh token : ', api.defaults.headers.common['X-Refresh-Token']);
    } else {
      delete api.defaults.headers.common['X-Refresh-Token'];
    }
  };

  React.useEffect(() => {
    let interceptor = null;
    if (user) {
      setAuthHeader(user?.auth_tokens?.access_token?.token);
      setRefreshTokenHeader(user?.auth_tokens?.refresh_token?.token);

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
          if (status === 401 && data?.error === 'authorization failed: Token is expired') {
            // reactotron.log('access token expired');
            if (!config._retry) {
              try {
                config._retry = true;
                // reactotron.log('try refresh token');
                const res = await authRefreshToken();
                // reactotron.log('res', res);
                const {access_token, refresh_token} = res;
                // setUser({...user, auth_tokens: {access_token, refresh_token}});
                if (access_token) {
                  // reactotron.log('access token valid');
                  error.config.headers.Authorization = `Bearer ${access_token?.token}`;
                }
                if (refresh_token) {
                  // reactotron.log('refresh token valid');
                  error.config.headers['X-Refresh-Token'] = refresh_token?.token;
                }
                setUser({...user, auth_tokens: {access_token, refresh_token}});
                await AsyncStorage.setItem(
                  'user',
                  JSON.stringify({...user, auth_tokens: {access_token, refresh_token}}),
                );
                return Promise.resolve(api.request(config));
                // return api(config);
              } catch (e) {
                // reactotron.log('refresh token failed');
                Alert.alert('Session expired', 'Please sign in again.', [
                  {
                    text: 'OK',
                    onPress: async () => {
                      setUser(null);
                      await AsyncStorage.removeItem('user');
                      // TODO: replace로 바꿔야됨
                      navigate('SignIn');
                    },
                  },
                ]);
                throw e;
              }
            }
            // reactotron.log(res);
            /*
                const {access_token, refresh_token} = res;
                if (access_token) {
                  reactotron.log('access token valid');
                  setUser({...user, auth_tokens: {access_token, refresh_token}});
                  api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
                  return api(config);
                }

                */
          }
          return Promise.reject(error);
        },
      );
    }
    // cleanup 함수
    return () => {
      axios.interceptors.response.eject(interceptor);
      axios.defaults.headers.common.Authorization = null;
      axios.defaults.headers.common['X-Refresh-Token'] = null;
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
    throw error;
  }
};

export const authFacebookSign = async accessToken => {
  try {
    const response = await api.post('/auth/facebook/sign', {id_token: accessToken});
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const authNaverSign = async accessToken => {
  try {
    const response = await api.post('/auth/naver/sign', {id_token: accessToken});
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const authKakaoSign = async accessToken => {
  try {
    const response = await api.post('/auth/kakao/sign', {id_token: accessToken});
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const authRefreshToken = async refreshToken => {
  try {
    const response = await api.post('/auth/refreshToken');
    return response.data;
  } catch (error) {
    throw error;
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
    throw error;
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
    throw error;
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
    throw error;
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
    throw error;
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
    throw error;
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
    throw error;
  }
};

export const locateCountries = async () => {
  try {
    const response = await api.get('/platform/locate/countries');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// platform - session
export const getSessions = async () => {
  try {
    const response = await api.get('/platform/session');
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
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
    throw error;
  }
};

export const deleteSession = async session_id => {
  try {
    const response = await api.delete('/platform/session', {
      data: {
        session_id,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// platform - schedule
export const getSchedules = async (session_id, day) => {
  try {
    const response = await api.get('/platform/schedule', {
      params: {
        session_id,
        day,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createSchedule = async ({session_id, place_id, name, start_at, memo}) => {
  try {
    const response = await api.put('/platform/schedule', {
      session_id,
      place_id,
      name,
      start_at,
      memo,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteSchedule = async schedule_id => {
  try {
    const response = await api.delete('/platform/schedule', {
      data: {
        schedule_id,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateSchedule = async ({schedule_id, place_id, name, start_at, memo}) => {
  try {
    const response = await api.post('/platform/schedule', {
      schedule_id,
      place_id,
      name,
      start_at,
      memo,
    });
    return response.data;
  } catch (error) {
    throw error;
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
    throw error;
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
    throw error;
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
    throw error;
  }
};

// platform - receipt
export const getReceipt = async receipt_id => {
  try {
    const response = await api.get('/platform/receipt/current', {
      params: {
        receipt_id,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getReceiptImage = async receipt_id => {
  try {
    const response = await api.get('/platform/receipt/image', {
      params: {
        receipt_id,
      },
      responseType: 'arraybuffer',
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getReceipts = async session_id => {
  try {
    const response = await api.get('/platform/receipt', {
      params: {
        session_id,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const uploadReceipt = async ({session_id, file}) => {
  try {
    console.log(session_id, file);
    const response = await api.post('/platform/receipt/upload', file, {
      params: {
        session_id,
      },
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const submitReceipt = async ({receipt_id, items, name, type}) => {
  try {
    const response = await api.post('/platform/receipt/submit', {
      receipt_id,
      items,
      name,
      type,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getCurrencies = async () => {
  const response = {
    data: {
      EUR: {
        symbol: '€',
        name: 'Euro',
        symbol_native: '€',
        decimal_digits: 2,
        rounding: 0,
        code: 'EUR',
        name_plural: 'Euros',
      },
      USD: {
        symbol: '$',
        name: 'US Dollar',
        symbol_native: '$',
        decimal_digits: 2,
        rounding: 0,
        code: 'USD',
        name_plural: 'US dollars',
      },
      JPY: {
        symbol: '¥',
        name: 'Japanese Yen',
        symbol_native: '￥',
        decimal_digits: 0,
        rounding: 0,
        code: 'JPY',
        name_plural: 'Japanese yen',
      },
      BGN: {
        symbol: 'BGN',
        name: 'Bulgarian Lev',
        symbol_native: 'лв.',
        decimal_digits: 2,
        rounding: 0,
        code: 'BGN',
        name_plural: 'Bulgarian leva',
      },
      CZK: {
        symbol: 'Kč',
        name: 'Czech Republic Koruna',
        symbol_native: 'Kč',
        decimal_digits: 2,
        rounding: 0,
        code: 'CZK',
        name_plural: 'Czech Republic korunas',
      },
      DKK: {
        symbol: 'Dkr',
        name: 'Danish Krone',
        symbol_native: 'kr',
        decimal_digits: 2,
        rounding: 0,
        code: 'DKK',
        name_plural: 'Danish kroner',
      },
      GBP: {
        symbol: '£',
        name: 'British Pound Sterling',
        symbol_native: '£',
        decimal_digits: 2,
        rounding: 0,
        code: 'GBP',
        name_plural: 'British pounds sterling',
      },
      HUF: {
        symbol: 'Ft',
        name: 'Hungarian Forint',
        symbol_native: 'Ft',
        decimal_digits: 0,
        rounding: 0,
        code: 'HUF',
        name_plural: 'Hungarian forints',
      },
      PLN: {
        symbol: 'zł',
        name: 'Polish Zloty',
        symbol_native: 'zł',
        decimal_digits: 2,
        rounding: 0,
        code: 'PLN',
        name_plural: 'Polish zlotys',
      },
      RON: {
        symbol: 'RON',
        name: 'Romanian Leu',
        symbol_native: 'RON',
        decimal_digits: 2,
        rounding: 0,
        code: 'RON',
        name_plural: 'Romanian lei',
      },
      SEK: {
        symbol: 'Skr',
        name: 'Swedish Krona',
        symbol_native: 'kr',
        decimal_digits: 2,
        rounding: 0,
        code: 'SEK',
        name_plural: 'Swedish kronor',
      },
      CHF: {
        symbol: 'CHF',
        name: 'Swiss Franc',
        symbol_native: 'CHF',
        decimal_digits: 2,
        rounding: 0,
        code: 'CHF',
        name_plural: 'Swiss francs',
      },
      ISK: {
        symbol: 'Ikr',
        name: 'Icelandic Króna',
        symbol_native: 'kr',
        decimal_digits: 0,
        rounding: 0,
        code: 'ISK',
        name_plural: 'Icelandic krónur',
      },
      NOK: {
        symbol: 'Nkr',
        name: 'Norwegian Krone',
        symbol_native: 'kr',
        decimal_digits: 2,
        rounding: 0,
        code: 'NOK',
        name_plural: 'Norwegian kroner',
      },
      HRK: {
        symbol: 'kn',
        name: 'Croatian Kuna',
        symbol_native: 'kn',
        decimal_digits: 2,
        rounding: 0,
        code: 'HRK',
        name_plural: 'Croatian kunas',
      },
      RUB: {
        symbol: 'RUB',
        name: 'Russian Ruble',
        symbol_native: 'руб.',
        decimal_digits: 2,
        rounding: 0,
        code: 'RUB',
        name_plural: 'Russian rubles',
      },
      TRY: {
        symbol: 'TL',
        name: 'Turkish Lira',
        symbol_native: 'TL',
        decimal_digits: 2,
        rounding: 0,
        code: 'TRY',
        name_plural: 'Turkish Lira',
      },
      AUD: {
        symbol: 'AU$',
        name: 'Australian Dollar',
        symbol_native: '$',
        decimal_digits: 2,
        rounding: 0,
        code: 'AUD',
        name_plural: 'Australian dollars',
      },
      BRL: {
        symbol: 'R$',
        name: 'Brazilian Real',
        symbol_native: 'R$',
        decimal_digits: 2,
        rounding: 0,
        code: 'BRL',
        name_plural: 'Brazilian reals',
      },
      CAD: {
        symbol: 'CA$',
        name: 'Canadian Dollar',
        symbol_native: '$',
        decimal_digits: 2,
        rounding: 0,
        code: 'CAD',
        name_plural: 'Canadian dollars',
      },
      CNY: {
        symbol: 'CN¥',
        name: 'Chinese Yuan',
        symbol_native: 'CN¥',
        decimal_digits: 2,
        rounding: 0,
        code: 'CNY',
        name_plural: 'Chinese yuan',
      },
      HKD: {
        symbol: 'HK$',
        name: 'Hong Kong Dollar',
        symbol_native: '$',
        decimal_digits: 2,
        rounding: 0,
        code: 'HKD',
        name_plural: 'Hong Kong dollars',
      },
      IDR: {
        symbol: 'Rp',
        name: 'Indonesian Rupiah',
        symbol_native: 'Rp',
        decimal_digits: 0,
        rounding: 0,
        code: 'IDR',
        name_plural: 'Indonesian rupiahs',
      },
      ILS: {
        symbol: '₪',
        name: 'Israeli New Sheqel',
        symbol_native: '₪',
        decimal_digits: 2,
        rounding: 0,
        code: 'ILS',
        name_plural: 'Israeli new sheqels',
      },
      INR: {
        symbol: 'Rs',
        name: 'Indian Rupee',
        symbol_native: 'টকা',
        decimal_digits: 2,
        rounding: 0,
        code: 'INR',
        name_plural: 'Indian rupees',
      },
      KRW: {
        symbol: '₩',
        name: 'South Korean Won',
        symbol_native: '₩',
        decimal_digits: 0,
        rounding: 0,
        code: 'KRW',
        name_plural: 'South Korean won',
      },
      MXN: {
        symbol: 'MX$',
        name: 'Mexican Peso',
        symbol_native: '$',
        decimal_digits: 2,
        rounding: 0,
        code: 'MXN',
        name_plural: 'Mexican pesos',
      },
      MYR: {
        symbol: 'RM',
        name: 'Malaysian Ringgit',
        symbol_native: 'RM',
        decimal_digits: 2,
        rounding: 0,
        code: 'MYR',
        name_plural: 'Malaysian ringgits',
      },
      NZD: {
        symbol: 'NZ$',
        name: 'New Zealand Dollar',
        symbol_native: '$',
        decimal_digits: 2,
        rounding: 0,
        code: 'NZD',
        name_plural: 'New Zealand dollars',
      },
      PHP: {
        symbol: '₱',
        name: 'Philippine Peso',
        symbol_native: '₱',
        decimal_digits: 2,
        rounding: 0,
        code: 'PHP',
        name_plural: 'Philippine pesos',
      },
      SGD: {
        symbol: 'S$',
        name: 'Singapore Dollar',
        symbol_native: '$',
        decimal_digits: 2,
        rounding: 0,
        code: 'SGD',
        name_plural: 'Singapore dollars',
      },
      THB: {
        symbol: '฿',
        name: 'Thai Baht',
        symbol_native: '฿',
        decimal_digits: 2,
        rounding: 0,
        code: 'THB',
        name_plural: 'Thai baht',
      },
      ZAR: {
        symbol: 'R',
        name: 'South African Rand',
        symbol_native: 'R',
        decimal_digits: 2,
        rounding: 0,
        code: 'ZAR',
        name_plural: 'South African rand',
      },
    },
  };
  return response.data;
};
