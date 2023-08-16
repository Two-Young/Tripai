import {atom} from 'recoil';

const sessionAtom = atom({
  key: 'session',
  default: {
    session_id: null,
    creator_user_id: null,
    name: null,
    start_at: null,
    end_at: null,
    created_at: null,
    country_codes: [],
    thumbnail_url: null,
  },
});

export default sessionAtom;
