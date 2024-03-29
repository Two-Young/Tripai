import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {useRecoilState} from 'recoil';
import userAtom from '../recoil/user/user';
import React from 'react';
import reactotron from 'reactotron-react-native';
import {navigate} from '../navigation/RootNavigator';
import {Alert} from 'react-native';

export const API_URL_PROD = 'http://43.200.219.71:10375';
export const API_URL_DEBUG = 'http://1.237.25.170:10375/';

const api = axios.create({
  baseURL: API_URL_PROD,
  timeout: 100000,
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
      api.defaults.headers.common['X-Refresh-Token'] = token;
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
                const {access_token, refresh_token} = res;
                if (access_token) {
                  error.config.headers.Authorization = `Bearer ${access_token?.token}`;
                }
                if (refresh_token) {
                  error.config.headers['X-Refresh-Token'] = refresh_token?.token;
                }
                setUser({...user, auth_tokens: {access_token, refresh_token}});
                await AsyncStorage.setItem(
                  'user',
                  JSON.stringify({...user, auth_tokens: {access_token, refresh_token}}),
                );
                return Promise.resolve(api.request(config));
              } catch (e) {
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
    console.error(JSON.stringify(error));
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
    console.error(JSON.stringify(error));
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

export const authRefreshToken = async () => {
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

export const getSessionCurrencies = async session_id => {
  try {
    const response = await api.get('/platform/session/currencies', {
      params: {
        session_id,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSessionMembers = async session_id => {
  try {
    const response = await api.get('/platform/session/members', {
      params: {
        session_id,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const inviteSession = async (session_id, target_user_id) => {
  try {
    const response = await api.post('/platform/session/invite', {
      session_id,
      target_user_id,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const cancelInvitationForSession = async (session_id, target_user_id) => {
  try {
    const response = await api.post('/platform/session/invite-cancel', {
      session_id,
      target_user_id,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSessionInvitationWaitings = async session_id => {
  try {
    const response = await api.get('/platform/session/invite-waitings', {
      params: {
        session_id,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSessionInvitationRequests = async () => {
  try {
    const response = await api.get('/platform/session/invite-requests');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const confirmSessionInvitation = async (session_id, accept) => {
  try {
    const response = await api.post('/platform/session/invite-confirm', {
      session_id,
      accept,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const joinSession = async session_code => {
  try {
    const response = await api.post('/platform/session/join', {
      session_code,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const cancelSessionJoinRequest = async session_id => {
  try {
    const response = await api.post('/platform/session/join-cancel', {
      session_id,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSessionJoinRequests = async session_id => {
  try {
    const response = await api.get('/platform/session/join-requests', {
      params: {
        session_id,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSessionJoinWaitings = async () => {
  try {
    const response = await api.get('/platform/session/join-waitings');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const confirmSessionJoinRequest = async (session_id, user_id, accept) => {
  try {
    const response = await api.post('/platform/session/join-confirm', {
      session_id,
      user_id,
      accept,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const expelUserFromSession = async (session_id, user_id) => {
  try {
    const response = await api.post('/platform/session/expel', {
      session_id,
      user_id,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const leaveSession = async session_id => {
  try {
    const response = await api.post('/platform/session/leave', {
      session_id,
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

// platform - currency
export const getCurrencies = async () => {
  try {
    const response = await api.get('/platform/currency');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getCurrenciesExchangeInfo = async ({from_currency_code, to_currency_code}) => {
  try {
    const response = await api.get('/platform/currency/exchange-rate', {
      params: {
        from_currency_code,
        to_currency_code,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// platform - budget
export const getBudgetSummary = async session_id => {
  try {
    const response = await api.get('/platform/budget/summary', {
      params: {
        session_id,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getBudget = async session_id => {
  try {
    const response = await api.get('/platform/budget', {
      params: {
        session_id,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const putBudget = async ({currency_code, amount, session_id}) => {
  try {
    const response = await api.put('/platform/budget', {
      currency_code,
      amount,
      session_id,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const postBudget = async ({budget_id, amount}) => {
  try {
    const response = await api.post('/platform/budget', {
      budget_id,
      amount,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteBudget = async budget_id => {
  try {
    const response = await api.delete('/platform/budget', {
      data: {
        budget_id,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getBudgetCurrent = async session_id => {
  try {
    const response = await api.get('/platform/budget/current', {
      params: {
        session_id,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// platform - expenditure
export const getExpenditures = async session_id => {
  try {
    const response = await api.get('/platform/expenditure/list', {
      params: {
        session_id,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getExpenditure = async expenditure_id => {
  try {
    const response = await api.get('/platform/expenditure', {
      params: {
        expenditure_id,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const putExpenditure = async ({
  name,
  category,
  total_price,
  currency_code,
  payers_id,
  distribution,
  items,
  payed_at,
  session_id,
}) => {
  try {
    const response = await api.put('/platform/expenditure', {
      name,
      category,
      total_price,
      currency_code,
      items,
      payers_id,
      distribution,
      payed_at,
      session_id,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const postExpenditure = async ({
  expenditure_id,
  name,
  category,
  total_price,
  currency_code,
  payers_id,
  items,
  distribution,
  payed_at,
  session_id,
}) => {
  try {
    const response = await api.post('/platform/expenditure', {
      expenditure_id,
      name,
      category,
      total_price,
      currency_code,
      payers_id,
      items,
      distribution,
      payed_at,
      session_id,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteExpenditure = async expenditure_id => {
  try {
    const response = await api.delete('/platform/expenditure', {
      data: {
        expenditure_id,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const postExpenditureReceipt = async formData => {
  try {
    const response = await api.post('/platform/expenditure/receipt', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.log(JSON.stringify(error));
    throw error;
  }
};

export const getExpenditureCategories = async () => {
  try {
    const response = await api.get('/platform/expenditure/categories');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// friends
export const getFriends = async () => {
  try {
    const response = await api.get('/platform/friends');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const requestFriends = async target_user_id => {
  try {
    const response = await api.post('/platform/friends/request', {
      target_user_id,
    });
    return response.data;
  } catch (error) {
    reactotron.log(error.response);
    throw error;
  }
};

export const cancelFriends = async target_user_id => {
  try {
    const response = await api.post('/platform/friends/cancel', {
      target_user_id,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const acceptFriends = async requested_user_id => {
  try {
    const response = await api.post('/platform/friends/accept', {
      requested_user_id,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const rejectFriends = async requested_user_id => {
  try {
    const response = await api.post('/platform/friends/reject', {
      requested_user_id,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getFriendsWaiting = async () => {
  try {
    const response = await api.get('/platform/friends/waiting');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const searchFriends = async query => {
  try {
    const response = await api.post('/platform/friends/search', null, {
      params: {query},
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteFriends = async target_user_id => {
  try {
    const response = await api.delete('/platform/friends', {
      data: {
        target_user_id,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// user
export const getProfile = async () => {
  try {
    const response = await api.get('/platform/user/profile');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateProfile = async formData => {
  try {
    const response = await api.post('/platform/user/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteProfile = async () => {
  try {
    const response = await api.delete('/platform/user');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getChatRooms = async session_id => {
  try {
    const response = await api.get('/platform/chat/getRooms', {
      params: {
        session_id,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createChatRoom = async (session_id, participantUserIds = []) => {
  try {
    const response = await api.post('/platform/chat/create', {
      // data: {
      session_id,
      participants: participantUserIds,
      // },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const inviteChatRoom = async (session_id, invited_user_id) => {
  try {
    const response = await api.post('/platform/chat/invite', {
      params: {
        session_id,
        invited_user_id,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getSettlement = async session_id => {
  try {
    const response = await api.get('/platform/settlement', {
      params: {
        session_id,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const completeSettlement = async (session_id, target_user_id, amount, currency_code) => {
  try {
    const response = await api.post('/platform/settlement/complete', {
      session_id,
      target_user_id,
      amount,
      currency_code,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteUser = async () => {
  try {
    const response = await api.delete('/platform/user');
    return response.data;
  } catch (error) {
    throw error;
  }
};
