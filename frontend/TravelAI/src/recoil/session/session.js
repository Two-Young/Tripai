import {atom} from 'recoil';

const sessionAtom = atom({
  key: 'session',
  default: '',
});

export default sessionAtom;
