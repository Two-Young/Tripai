import {atom, selector} from 'recoil';
import {getFriends} from '../../services/api';

export const friendsAtom = atom({
  key: 'friends',
  default: [],
});

export const sentFriendsAtom = atom({
  key: 'sentFriends',
  default: [],
});

export const receivedFriendsAtom = atom({
  key: 'receivedFriends',
  default: [],
});

export const getFriendsSelector = selector({
  key: 'friends/get',
  get: async ({get}) => {
    try {
      return await getFriends();
    } catch (err) {
      throw err;
    }
  },
});
